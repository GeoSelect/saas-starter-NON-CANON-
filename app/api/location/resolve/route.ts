
import { NextResponse } from "next/server";
import { supabaseRSC } from "@/lib/supabase/server";

type ResolveRequest =
  | {
      mode: "point";
      lat: number;
      lng: number;
      source?: string;
      confidence?: number;
      payload?: Record<string, unknown>;
    }
  | { mode: "address"; address: string };

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

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

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return jsonError(req, 400, "BAD_JSON", "Request body must be valid JSON.");
  }

  if (!body || typeof body !== "object" || !("mode" in body) || (body as any).mode !== "point") {
    return jsonError(req, 400, "INVALID_MODE", "Only { mode: 'point', lat, lng } is supported in v1.");
  }

  const { lat, lng, source, confidence, payload } = body as Extract<ResolveRequest, { mode: "point" }>;

  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
    return jsonError(req, 422, "INVALID_COORDS", "lat and lng must be finite numbers.");
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return jsonError(req, 422, "INVALID_COORDS_RANGE", "lat/lng are outside valid ranges.");
  }

  const p_source = typeof source === "string" && source.trim() ? source.trim() : "device";
  const p_confidence = isFiniteNumber(confidence) ? confidence : 1.0;
  const p_payload = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};

  try {
    const supabase = await supabaseRSC();

      const { data, error } = await supabase.rpc("location_resolve_point", {
      p_lng: lng,
      p_lat: lat,
      p_source,
      p_confidence,
      p_payload,
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();

      if (msg.includes("location not allowed") || msg.includes("not allowed")) {
        return jsonError(req, 403, "LOCATION_NOT_ALLOWED", "This location is not in the allowed region.");
      }

      if (msg.includes("invalid") || msg.includes("required")) {
        return jsonError(req, 422, "LOCATION_INVALID", "The provided location could not be accepted.");
      }

      return jsonError(req, 500, "LOCATION_RESOLVE_FAILED", "Location resolve failed.");
    }

    const row = Array.isArray(data) ? data[0] : data;

    const shaped = {
      location_id: row?.location_id ?? row?.id,
      geometry: row?.geometry ?? row?.geom ?? null,
      confidence: row?.confidence ?? 1.0,
      method: "point_input" as const,
      provider: null as null,
      source: row?.source ?? "device",
      resolved_at: row?.created_at ?? null,
    };

    if (!shaped.location_id || !shaped.geometry || !shaped.resolved_at) {
      return jsonError(req, 500, "LOCATION_RESOLVE_CONTRACT", "RPC did not return required fields.");
    }

    const headers = getCorsHeaders(req);
    return NextResponse.json({ ok: true, data: shaped }, { status: 200, headers });
  } catch (e) {
    // Unexpected server/runtime error
    return jsonError(req, 500, "UNEXPECTED_ERROR", "Unexpected server error.");
  }
}
