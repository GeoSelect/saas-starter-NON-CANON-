import { NextResponse } from 'next/server';
import { supabaseRoute } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  // cookie/session-bound client (who is calling?)
  const supabase = await supabaseRoute();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) {
    return NextResponse.json({ ok: false, error: userErr.message }, { status: 401 });
  }
  const user = userData?.user;
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const accountName = (body?.account_name as string) || 'My Account';

  // If already provisioned, return existing membership
  const { data: existing, error: existingErr } = await supabase
    .from('account_users')
    .select('account_id, role')
    .eq('user_id', user.id)
    .limit(1);

  if (existingErr) {
    return NextResponse.json({ ok: false, error: existingErr.message }, { status: 500 });
  }
  if (existing && existing.length > 0) {
    return NextResponse.json({
      ok: true,
      alreadyProvisioned: true,
      account_id: existing[0].account_id,
      role: existing[0].role
    });
  }

  // admin client bypasses RLS for provisioning writes
  const admin = supabaseAdmin();

  const { data: acct, error: acctErr } = await admin
    .from('accounts')
    .insert({ name: accountName })
    .select('id, name')
    .single();

  if (acctErr) {
    return NextResponse.json({ ok: false, error: acctErr.message }, { status: 500 });
  }

  const { error: auErr } = await admin.from('account_users').insert({
    account_id: acct.id,
    user_id: user.id,
    role: 'owner'
  });

  if (auErr) {
    return NextResponse.json({ ok: false, error: auErr.message }, { status: 500 });
  }

  const { error: entErr } = await admin.from('entitlements').insert({
    account_id: acct.id,
    plan_tier: 'free',
    features: {},
    limits: {},
    overrides: {}
  });

  if (entErr) {
    return NextResponse.json({ ok: false, error: entErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, account: acct, role: 'owner' });
}
