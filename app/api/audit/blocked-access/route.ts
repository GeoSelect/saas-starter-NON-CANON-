// C046 UnlockDetails — audit endpoint (CCP-06, CCP-07)
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = req.cookies;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ status: 'ok' }, { status: 200 }); // best-effort
    }

    const { featureId, tier } = await req.json();

    // C046 + C007: Insert audit log (append-only)
    await supabase.from('blocked_access_logs').insert({
      user_id: user.id,
      feature_id: featureId,
      tier,
      user_agent: req.headers.get('user-agent'),
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err) {
    console.warn('[C046] Audit error:', err);
    return NextResponse.json({ status: 'ok' }, { status: 200 }); // best-effort
  }
}
