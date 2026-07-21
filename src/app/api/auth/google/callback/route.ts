import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const cookieStore = await cookies();
  const savedState = cookieStore.get('google_oauth_state')?.value;
  cookieStore.delete('google_oauth_state');

  // User denied permission
  if (error) {
    return NextResponse.redirect(new URL('/settings?google=denied', request.url));
  }

  // Validate state (CSRF protection)
  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL('/settings?google=error&reason=state', request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/settings?google=error&reason=config', request.url));
  }

  const origin = url.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  // 1. Exchange authorization code for tokens
  let tokens: { access_token: string; refresh_token?: string; expires_in?: number };
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Google token exchange failed:', errBody);
      return NextResponse.redirect(new URL('/settings?google=error&reason=token', request.url));
    }

    tokens = await tokenRes.json();

    if (!tokens.access_token) {
      return NextResponse.redirect(new URL('/settings?google=error&reason=token', request.url));
    }
  } catch (e) {
    console.error('Google token exchange exception:', e);
    return NextResponse.redirect(new URL('/settings?google=error&reason=network', request.url));
  }

  // 2. Get current user from Supabase session
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Create Google Sheet via Sheets API
  let sheetId: string | undefined;
  let sheetUrl: string | undefined;
  try {
    const sheetRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title: 'ProtLife_Data_Export' },
        sheets: [{ properties: { title: 'Data', gridProperties: { frozenRowCount: 1 } } }],
      }),
    });

    if (sheetRes.ok) {
      const sheet = await sheetRes.json();
      sheetId = sheet.spreadsheetId;
      sheetUrl = sheet.spreadsheetUrl;

      // Write header row
      const headerUrl = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data!A1:F1`);
      headerUrl.searchParams.set('valueInputOption', 'USER_ENTERED');
      await fetch(headerUrl.toString(), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [['ID', 'Loại', 'Nội dung', 'Ngày', 'Ghi chú', 'Đồng bộ lúc']],
          majorDimension: 'ROWS',
        }),
      });
    } else {
      console.error('Create sheet failed:', await sheetRes.text());
    }
  } catch (e) {
    console.error('Create sheet exception:', e);
    // Continue even if sheet creation fails — tokens still saved
  }

  // 4. Save tokens & sheet info to DB
  try {
    const { error: dbError } = await supabaseAdmin.from('google_tokens').upsert({
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      token_expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      sheet_id: sheetId || null,
      sheet_name: 'ProtLife_Data_Export',
      sheet_url: sheetUrl || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('Save google_tokens failed:', dbError);
      return NextResponse.redirect(new URL('/settings?google=error&reason=db', request.url));
    }
  } catch (e) {
    console.error('Save google_tokens exception:', e);
    return NextResponse.redirect(new URL('/settings?google=error&reason=db', request.url));
  }

  // 5. Redirect back to settings with success
  return NextResponse.redirect(new URL('/settings?google=linked', request.url));
}
