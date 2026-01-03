import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANT: server-only env var
);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.event_name) {
    return NextResponse.json({ ok: false, error: 'event_name required' }, { status: 400 });
  }
const ALLOWED = new Set(['app_open', 'search_submitted', 'shared_view_opened']);

if (!ALLOWED.has(String(body.event_name))) {
  return NextResponse.json({ ok: false, error: 'event_name not allowed' }, { status: 400 });
}
const ALLOWED_EVENTS = new Set([
  'app_open',
  'search_submitted',
  'shared_view_opened'
]);

if (!ALLOWED_EVENTS.has(String(body.event_name))) {
  return NextResponse.json(
    { ok: false, error: 'event_name not allowed' },
    { status: 400 }
  );
}
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null;

  const user_agent = req.headers.get('user-agent');

  const payload = {
    event_name: String(body.event_name),
    event_version: Number.isFinite(body.event_version) ? Number(body.event_version) : 1,
    session_id: body.session_id ? String(body.session_id) : null,
    source: body.source ? String(body.source) : 'web',
    path: body.path ? String(body.path) : null,
    user_agent,
    ip,
    props: body.props && typeof body.props === 'object' ? body.props : {},
    // user/account fields intentionally null for anonymous (can be added later if you derive them)
    user_id: null,
    account_id: null,
    role: null
  };

  const { error } = await supabaseAdmin.from('telemetry_events').insert(payload);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
