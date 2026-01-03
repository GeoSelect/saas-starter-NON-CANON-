export type Actor = {
  actor_type: string; // e.g. 'user' | 'system'
  actor_id?: string | null;
  account_id?: string | null;
};

export type AuditEvent = {
  id?: string;
  type: string; // e.g. 'report.created'
  created_at: string; // ISO timestamp
  actor?: Actor | null;
  report_id?: string | null;
  request_id?: string | null;
  payload?: Record<string, any> | null;
};

export function makeAuditEvent(params: {
  type: string;
  actor?: Actor | null;
  report_id?: string | null;
  request_id?: string | null;
  payload?: Record<string, any> | null;
}): AuditEvent {
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? (crypto as any).randomUUID() : `ev_${Date.now()}`,
    type: params.type,
    created_at: new Date().toISOString(),
    actor: params.actor ?? null,
    report_id: params.report_id ?? null,
    request_id: params.request_id ?? null,
    payload: params.payload ?? null,
  };
}

export default { makeAuditEvent };
