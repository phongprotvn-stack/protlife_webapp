import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from('google_tokens')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Lỗi khi ngắt kết nối' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
