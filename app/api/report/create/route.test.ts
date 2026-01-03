import { describe, it, expect } from "vitest";
import { POST } from "./route";
import { PCX_FIXTURE } from "../../../../lib/contracts/ccp03.fixture";

function makeReq(json: any) {
  return new Request("http://localhost:3000/api/report/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(json),
  });
}

describe("POST /api/report/create (CCP-03)", () => {
  it("returns frozen CCP-03 response shape for valid input", async () => {
    const req = makeReq({
      parcel_context: PCX_FIXTURE,
      intent: { mode: "arc_viability", audience: "property_manager", locale: "en-US" },
      report_id: "rpt_test_endpoint_001",
      request_id: "req_test_001",
      environment: "local",
      actor: { actor_type: "user", actor_id: "user_1", account_id: "acct_1" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);

    // Frozen: report shape keys
    expect(json.report.version).toBe("rpt-0.1");
    expect(json.report.report_id).toBe("rpt_test_endpoint_001");
    expect(Array.isArray(json.report.sections)).toBe(true);
    expect(json.report.sections.map((s: any) => s.type)).toEqual([
      "overview",
      "restrictions",
      "process",
      "deadlines",
      "risks",
      "sources",
    ]);

    // Frozen: sources invariant
    const sources = json.report.sections.find((s: any) => s.type === "sources");
    expect(sources.blocks.filter((b: any) => b.type === "evidence_list")).toHaveLength(1);
  });

  it("fails with REPORT_CREATE_CONTRACT if required fields are missing", async () => {
    const req = makeReq({
      // parcel_context missing
      report_id: "rpt_test_endpoint_002",
      request_id: "req_test_002",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("REPORT_CREATE_CONTRACT");
    expect(typeof json.code).toBe("string");
  });
});
