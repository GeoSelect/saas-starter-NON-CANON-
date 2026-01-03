import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    user: data.user
      ? { id: data.user.id, email: data.user.email, metadata: data.user.user_metadata }
      : null
  });
}
