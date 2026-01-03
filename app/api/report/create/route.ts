import { NextResponse } from "next/server";

type CreateRequest = {
  parcel_context: Record<string, any>;
  intent: string;
  report_id?: string;
  request_id?: string;
};

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const configured = process.env.CORS_ALLOWED_ORIGINS ?? "";

  if (!configured) {
    return { Vary: "Origin" } as Record<string, string>;
  }

  const allowAll = configured.trim() === "*";
  const allowed = configured
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowOrigin = allowAll ? "*" : allowed.includes(origin) ? origin : "";

  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (allowOrigin) headers["Access-Control-Allow-Origin"] = allowOrigin;

  return headers;
}

function jsonError(req: Request, status: number, code: string, message: string) {
  const headers = getCorsHeaders(req);
  return NextResponse.json({ ok: false, error: { code, message } }, { status, headers });
}

export async function OPTIONS(req: Request) {
  const headers = getCorsHeaders(req);
  return new NextResponse(null, { status: 204, headers });
}

function emitAuditEvent(e: Record<string, any>) {
  try {
    const g = globalThis as any;
    if (!g.__AUDIT_EVENTS) g.__AUDIT_EVENTS = [];
    g.__AUDIT_EVENTS.push({ created_at: new Date().toISOString(), ...e });
  } catch {
    // ignore
  }
}

function projectParcelToReportContext(parcel: Record<string, any>, intent: string) {
  // Minimal projection — real implementation would be domain-specific
  return {
    intent,
    parcel: { ...parcel },
  };
}

function createReportFromContext(context: Record<string, any>, report_id?: string, request_id?: string) {
  const id = report_id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? (crypto as any).randomUUID() : `r_${Date.now()}`);

  // Frozen report shape v0.1 — minimal content for tests
  const sections = [
    { type: 'overview', blocks: [] },
    { type: 'restrictions', blocks: [] },
    { type: 'process', blocks: [] },
    { type: 'deadlines', blocks: [] },
    { type: 'risks', blocks: [] },
    { type: 'sources', blocks: [{ type: 'evidence_list', items: [] }] },
  ];

  const report = {
    // compatibility fields
    id,
    report_id: id,
    request_id: request_id ?? null,
    status: 'created',
    created_at: new Date().toISOString(),
    // frozen contract
    version: 'rpt-0.1',
    sections,
    // include context for debugging
    context,
  };

  return report;
}

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return jsonError(req, 400, "BAD_JSON", "Request body must be valid JSON.");
  }

  if (!body || typeof body !== "object") {
    return jsonError(req, 400, "INVALID_BODY", "Request body must be an object.");
  }

  const { parcel_context, intent, report_id, request_id } = body as CreateRequest;

  const headers = getCorsHeaders(req);

  if (!parcel_context || typeof parcel_context !== "object") {
    // Return the contract style error expected by tests: string error + code
    return NextResponse.json({ ok: false, error: "REPORT_CREATE_CONTRACT", code: "MISSING_PARCEL" }, { status: 400, headers });
  }

  if (intent === undefined || intent === null) {
    return jsonError(req, 422, "MISSING_INTENT", "intent is required.");
  }

  try {
    const ctx = projectParcelToReportContext(parcel_context, intent);
    const report = createReportFromContext(ctx, report_id, request_id);

    emitAuditEvent({ type: "report.created", report_id: report.id, request_id: report.request_id, payload: { intent } });

    return NextResponse.json({ ok: true, report }, { status: 200, headers });
  } catch (e) {
    return jsonError(req, 500, "REPORT_CREATE_FAILED", "Failed to create report.");
  }
}
