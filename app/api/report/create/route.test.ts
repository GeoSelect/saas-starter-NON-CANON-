import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";
import { PCX_FIXTURE } from "../../../../lib/contracts/ccp03.fixture";

function makeReq(json: any) {
  return new Request("http://localhost:3000/api/report/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(json)
  });
}

describe("CCP-03 audit emission", () => {
  beforeEach(() => {
    // reset global audit sink
    (globalThis as any).__AUDIT_EVENTS = [];
  });

  it("emits report_created audit event on success", async () => {
    const report_id = "rpt_audit_001";
    const request_id = "req_audit_001";

    const req = makeReq({
      parcel_context: PCX_FIXTURE,
      intent: { mode: 'arc_viability' },
      report_id,
      request_id
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const events = (globalThis as any).__AUDIT_EVENTS;
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);

    const created = events.find((e: any) => e.type === "report.created");
    expect(created).toBeDefined();
    expect(created.report_id).toBe(report_id);
    expect(created.request_id).toBe(request_id);
  });
});

describe("CCP-03 audit behavior (frozen)", () => {
  beforeEach(() => {
    (globalThis as any).__AUDIT_EVENTS = [];
  });

  it("emits no audit events on contract failure", async () => {
    const res = await POST(
      makeReq({
        // parcel_context intentionally missing
        report_id: "rpt_fail_001",
        request_id: "req_fail_001"
      })
    );

    expect(res.status).toBe(400);

    const events = (globalThis as any).__AUDIT_EVENTS;
    expect(events).toHaveLength(0);
  });
});
