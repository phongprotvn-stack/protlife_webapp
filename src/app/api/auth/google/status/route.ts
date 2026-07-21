import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  // Get current user from session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ linked: false }, { status: 401 });
  }

  // Check if user has google_tokens record
  const { data, error } = await supabaseAdmin
    .from('google_tokens')
    .select('sheet_id, sheet_name, sheet_url, updated_at')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ linked: false });
  }

  return NextResponse.json({
    linked: true,
    sheetId: data.sheet_id,
    sheetName: data.sheet_name,
    sheetUrl: data.sheet_url,
    lastSynced: data.updated_at,
  });
}
