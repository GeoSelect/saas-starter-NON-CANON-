import { NextResponse } from "next/server";
import { z } from "zod";
import { unauthorized, validationError, success } from "@/lib/api/error-responses";

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

// New contract schema (parcel_id + branding) for CCP-03 wiring
const CreateReportSchema = z.object({
  parcel_id: z.string().min(1),
  title: z.string().min(1).max(255),
  include_sections: z.array(z.string()).optional(),
  branding: z
    .object({
      logo_url: z.string().url().optional(),
      footer_text: z.string().optional(),
    })
    .optional(),
  address: z.string().optional(),
  jurisdiction: z.string().optional(),
});

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

  // First try the new contract (CCP-03 wiring)
  const parsedNew = CreateReportSchema.safeParse(body);
  if (parsedNew.success) {
    const accountId = req.headers.get("x-account-id");
    if (!accountId) {
      return unauthorized();
    }

    async function persistReport(params: {
      id: string;
      accountId: string;
      data: CreateReportRequest;
    }) {
      // This API route is for external callers without authenticated context
      // Persistence should happen through the authenticated server action instead
      // This function is kept for legacy compatibility but does not persist
      return false;
    }

    const data = parsedNew.data;
    const now = new Date().toISOString();
    const reportId = (crypto as any).randomUUID
      ? `report_${(crypto as any).randomUUID()}`
      : `report_${Date.now()}`;

    const response = {
      report_id: reportId,
      status: "ready" as const,
      title: data.title,
      parcel: {
        apn: data.parcel_id,
        address: data.address ?? "",
        jurisdiction: data.jurisdiction ?? "",
      },
      cta: {
        label: "View report",
        url: `https://geoselect.it/reports/${reportId}`,
      },
      created_at: now,
    };

    // success wrapper keeps contract consistent
    void persistReport({ id: reportId, accountId, data });
    return success(response, 200);
  }

  // Fallback: legacy contract for existing tests
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
