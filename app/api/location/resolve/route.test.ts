import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

/**
 * Mock Supabase server helper
 */
const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => {
  return {
    supabaseRSC: vi.fn(async () => ({
      rpc: rpcMock,
    })),
  };
});

describe("POST /api/location/resolve (CCP-01)", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("returns frozen CCP-01 response shape for valid point input", async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        id: "74a46ea3-bd2d-4ea1-aa92-9dbb00000000",
        created_at: "2026-01-03T17:28:01.123Z",
        source: "manual",
        confidence: 0.92,
        geometry: {
          type: "Point",
          coordinates: [-105.0844, 39.7392],
        },
      },
      error: null,
    });

    const req = new Request("http://localhost/api/location/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "point",
        lat: 39.7392,
        lng: -105.0844,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);

    const data = json.data;

    // Contract assertions
    expect(data.location_id).toBe("74a46ea3-bd2d-4ea1-aa92-9dbb00000000");
    expect(data.geometry).toEqual({
      type: "Point",
      coordinates: [-105.0844, 39.7392],
    });
    expect(data.confidence).toBe(0.92);
    expect(data.method).toBe("point_input");
    expect(data.provider).toBeNull();
    expect(data.source).toBe("manual");
    expect(data.resolved_at).toBe("2026-01-03T17:28:01.123Z");

    // Explicit non-goals
    expect(data.normalized).toBeUndefined();
    expect(data.lat).toBeUndefined();
    expect(data.lng).toBeUndefined();
  });

  it("fails with LOCATION_RESOLVE_CONTRACT if required fields are missing", async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        id: "74a46ea3-bd2d-4ea1-aa92-9dbb00000000",
        // created_at missing
        geometry: null,
      },
      error: null,
    });

    const req = new Request("http://localhost/api/location/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "point",
        lat: 39.7392,
        lng: -105.0844,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("LOCATION_RESOLVE_CONTRACT");
  });
});

