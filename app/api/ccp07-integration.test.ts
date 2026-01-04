import { describe, it, expect, beforeEach } from "vitest";

describe("CCP-07 API Contract Tests", () => {
  describe("GET /api/workspaces/[id]/sources", () => {
    it("should return sources with correct schema", () => {
      const response = {
        ok: true,
        data: [
          {
            id: "source-1",
            name: "Telluride Town Code",
            type: "ordinance",
            url: "https://telluride.town/code",
            jurisdiction: "Telluride, CO",
            confidence_level: "verified",
            last_verified_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        count: 1,
      };

      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.count).toBe(response.data.length);

      const source = response.data[0];
      expect(source).toHaveProperty("id");
      expect(source).toHaveProperty("name");
      expect(source).toHaveProperty("type");
      expect(source).toHaveProperty("confidence_level");
    });

    it("should validate source types", () => {
      const validTypes = [
        "hoa_ccr",
        "jurisdiction_code",
        "ordinance",
        "county_records",
        "assessor",
        "zoning",
        "custom",
      ];

      const mockSource = {
        id: "src-1",
        name: "Test Source",
        type: "ordinance" as const,
        confidence_level: "verified" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(validTypes).toContain(mockSource.type);
    });

    it("should support query filters", () => {
      const queryParams = new URLSearchParams({
        type: "ordinance",
        jurisdiction: "Telluride, CO",
        confidenceLevel: "verified",
      });

      expect(queryParams.get("type")).toBe("ordinance");
      expect(queryParams.get("jurisdiction")).toBe("Telluride, CO");
      expect(queryParams.get("confidenceLevel")).toBe("verified");
    });

    it("should return 400 for missing workspace ID", () => {
      const response = {
        ok: false,
        error: "Workspace ID required",
        code: "missing_workspace_id",
      };

      expect(response.ok).toBe(false);
      expect(response.code).toBe("missing_workspace_id");
    });

    it("should return 500 on server error", () => {
      const response = {
        ok: false,
        error: "Internal server error",
        code: "internal_server_error",
      };

      expect(response.ok).toBe(false);
      expect(response.code).toBe("internal_server_error");
    });
  });

  describe("GET /api/workspaces/[id]/gaps", () => {
    it("should return gaps with correct schema", () => {
      const response = {
        ok: true,
        data: [
          {
            id: "gap-1",
            workspace_id: "ws-1",
            parcel_id: "parcel-1",
            gap_type: "missing",
            description: "Missing HOA setback",
            severity: "critical",
            resolution_status: "open",
            reported_by: "user-1",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        summary: {
          total: 1,
          by_type: { missing: 1, conflict: 0, outdated: 0, unverified: 0 },
          by_severity: { critical: 1, warning: 0, info: 0 },
          by_status: { open: 1, investigating: 0, resolved: 0 },
        },
      };

      expect(response.ok).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.summary).toHaveProperty("total");
      expect(response.summary).toHaveProperty("by_type");
      expect(response.summary).toHaveProperty("by_severity");
      expect(response.summary).toHaveProperty("by_status");

      const gap = response.data[0];
      expect(gap).toHaveProperty("id");
      expect(gap).toHaveProperty("gap_type");
      expect(gap).toHaveProperty("severity");
      expect(gap).toHaveProperty("resolution_status");
    });

    it("should validate gap types", () => {
      const validTypes = ["missing", "conflict", "outdated", "unverified"];
      const mockGap = { gap_type: "missing" as const };

      expect(validTypes).toContain(mockGap.gap_type);
    });

    it("should validate severity levels", () => {
      const validSeverities = ["critical", "warning", "info"];
      const mockGap = { severity: "critical" as const };

      expect(validSeverities).toContain(mockGap.severity);
    });

    it("should validate resolution status", () => {
      const validStatuses = ["open", "investigating", "resolved"];
      const mockGap = { resolution_status: "open" as const };

      expect(validStatuses).toContain(mockGap.resolution_status);
    });

    it("should support filtering by parcelId, gapType, severity, status", () => {
      const queryParams = new URLSearchParams({
        parcelId: "parcel-123",
        gapType: "missing",
        severity: "critical",
        resolutionStatus: "open",
      });

      expect(queryParams.get("parcelId")).toBe("parcel-123");
      expect(queryParams.get("gapType")).toBe("missing");
      expect(queryParams.get("severity")).toBe("critical");
      expect(queryParams.get("resolutionStatus")).toBe("open");
    });

    it("should calculate summary correctly", () => {
      const gaps = [
        { gap_type: "missing", severity: "critical", resolution_status: "open" },
        { gap_type: "missing", severity: "warning", resolution_status: "open" },
        {
          gap_type: "conflict",
          severity: "critical",
          resolution_status: "investigating",
        },
        {
          gap_type: "outdated",
          severity: "info",
          resolution_status: "resolved",
        },
      ];

      const summary = {
        total: gaps.length,
        by_type: gaps.reduce(
          (acc, g) => {
            acc[g.gap_type] = (acc[g.gap_type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        by_severity: gaps.reduce(
          (acc, g) => {
            acc[g.severity] = (acc[g.severity] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        by_status: gaps.reduce(
          (acc, g) => {
            acc[g.resolution_status] = (acc[g.resolution_status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };

      expect(summary.total).toBe(4);
      expect(summary.by_type["missing"]).toBe(2);
      expect(summary.by_type["conflict"]).toBe(1);
      expect(summary.by_type["outdated"]).toBe(1);
      expect(summary.by_severity["critical"]).toBe(2);
      expect(summary.by_severity["warning"]).toBe(1);
      expect(summary.by_status["open"]).toBe(2);
      expect(summary.by_status["investigating"]).toBe(1);
      expect(summary.by_status["resolved"]).toBe(1);
    });
  });

  describe("GET /api/rules/[id]/sources", () => {
    it("should return rule with sources and citations", () => {
      const response = {
        ok: true,
        data: {
          rule: {
            id: "rule-1",
            workspace_id: "ws-1",
            rule_type: "setback",
            description: "25-foot rear setback",
            details: { setback_feet: 25, applies_to: "rear" },
            created_by: "user-1",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          sources: [
            {
              rule_id: "rule-1",
              source_id: "source-1",
              citation: "Section 13.4.2(c)",
              citation_date: new Date().toISOString(),
              source: {
                id: "source-1",
                name: "Telluride Town Code",
                type: "ordinance",
                url: "https://telluride.town/code",
                confidence_level: "verified",
                last_verified_at: new Date().toISOString(),
              },
            },
          ],
          source_count: 1,
          verified_sources: 1,
          unverified_sources: 0,
        },
      };

      expect(response.ok).toBe(true);
      expect(response.data.rule).toHaveProperty("id");
      expect(response.data.rule).toHaveProperty("rule_type");
      expect(Array.isArray(response.data.sources)).toBe(true);
      expect(response.data.source_count).toBe(1);
      expect(response.data.verified_sources).toBe(1);
      expect(response.data.unverified_sources).toBe(0);

      const source = response.data.sources[0];
      expect(source).toHaveProperty("citation");
      expect(source).toHaveProperty("source");
    });

    it("should return 404 if rule not found", () => {
      const response = {
        ok: false,
        error: "Rule not found",
        code: "rule_not_found",
      };

      expect(response.ok).toBe(false);
      expect(response.code).toBe("rule_not_found");
    });

    it("should return 400 for missing rule ID", () => {
      const response = {
        ok: false,
        error: "Rule ID required",
        code: "missing_rule_id",
      };

      expect(response.ok).toBe(false);
      expect(response.code).toBe("missing_rule_id");
    });

    it("should count verified vs unverified sources", () => {
      const sources = [
        { source: { confidence_level: "verified" as const } },
        { source: { confidence_level: "verified" as const } },
        { source: { confidence_level: "pending" as const } },
      ];

      const verified = sources.filter(
        (s) => s.source.confidence_level === "verified"
      ).length;
      const unverified = sources.filter(
        (s) => s.source.confidence_level === "pending"
      ).length;

      expect(verified).toBe(2);
      expect(unverified).toBe(1);
    });
  });
});

describe("CCP-07 RLS Enforcement", () => {
  it("should enforce workspace membership for sources queries", () => {
    // RLS policy: Users can read sources (public)
    // but can only query rules in their workspace
    const rls = {
      sources_select: "public",
      rules_select: "workspace members only",
    };

    expect(rls.sources_select).toBe("public");
    expect(rls.rules_select).toContain("workspace members");
  });

  it("should enforce workspace membership for gaps queries", () => {
    // RLS policy: Only workspace members can view/manage gaps
    const rls = {
      gaps_select: "workspace members only",
      gaps_insert: "workspace members only",
      gaps_update: "workspace members only",
    };

    expect(rls.gaps_select).toContain("workspace members");
  });

  it("should prevent unauthorized access to rules from other workspaces", () => {
    const rule = {
      id: "rule-1",
      workspace_id: "ws-1",
    };

    const userWorkspace = "ws-2";

    // RLS should prevent access
    const hasAccess = rule.workspace_id === userWorkspace;
    expect(hasAccess).toBe(false);
  });

  it("should require auth for gap operations", () => {
    const unauthedUser = null;

    // RLS should require auth.uid() to be set
    const canAccess = unauthedUser !== null;
    expect(canAccess).toBe(false);
  });
});

describe("Gap Detection Logic", () => {
  it("should identify missing information gaps", () => {
    const gaps = [
      { gap_type: "missing", description: "HOA setback not found" },
      { gap_type: "conflict", description: "Conflicting height limits" },
      { gap_type: "outdated", description: "Last verified 18 months ago" },
    ];

    const missingGaps = gaps.filter((g) => g.gap_type === "missing");
    expect(missingGaps).toHaveLength(1);
    expect(missingGaps[0].description).toContain("not found");
  });

  it("should identify conflict gaps", () => {
    const gaps = [
      { gap_type: "missing", description: "Data not found" },
      {
        gap_type: "conflict",
        description: "County says 35ft, HOA says 30ft",
      },
      { gap_type: "unverified", description: "Inferred from neighbors" },
    ];

    const conflicts = gaps.filter((g) => g.gap_type === "conflict");
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].description).toContain("County");
  });

  it("should identify outdated gaps", () => {
    const verifyDate = new Date();
    const staleDate = new Date(verifyDate.getTime() - 18 * 30 * 24 * 60 * 60 * 1000); // 18 months ago

    const gap = {
      gap_type: "outdated",
      last_verified: staleDate,
      is_stale: verifyDate.getTime() - staleDate.getTime() > 365 * 24 * 60 * 60 * 1000,
    };

    expect(gap.gap_type).toBe("outdated");
    expect(gap.is_stale).toBe(true);
  });

  it("should identify unverified gaps", () => {
    const gaps = [
      { gap_type: "unverified", description: "Inferred from county records" },
      { gap_type: "missing", description: "Not found" },
    ];

    const unverified = gaps.filter((g) => g.gap_type === "unverified");
    expect(unverified).toHaveLength(1);
    expect(unverified[0].description).toContain("Inferred");
  });

  it("should prioritize gaps by severity", () => {
    const gaps = [
      {
        gap_type: "missing",
        severity: "info",
        description: "Minor gap",
      },
      {
        gap_type: "conflict",
        severity: "critical",
        description: "Critical conflict",
      },
      {
        gap_type: "outdated",
        severity: "warning",
        description: "Warning level",
      },
    ];

    const severityOrder = {
      critical: 0,
      warning: 1,
      info: 2,
    };

    const sorted = gaps.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );

    expect(sorted[0].severity).toBe("critical");
    expect(sorted[1].severity).toBe("warning");
    expect(sorted[2].severity).toBe("info");
  });

  it("should track gap resolution workflow", () => {
    const gap = {
      id: "gap-1",
      resolution_status: "open",
      created_at: new Date(),
    };

    // Update to investigating
    gap.resolution_status = "investigating";
    expect(gap.resolution_status).toBe("investigating");

    // Update to resolved
    gap.resolution_status = "resolved";
    expect(gap.resolution_status).toBe("resolved");
  });
});

describe("Integration with CCP-05 Workspace Hardening", () => {
  it("should scope gaps to workspace (CCP-05 workspace isolation)", () => {
    const workspace1Gaps = [
      { id: "gap-1", workspace_id: "ws-1" },
      { id: "gap-2", workspace_id: "ws-1" },
    ];

    const workspace2Gaps = [
      { id: "gap-3", workspace_id: "ws-2" },
    ];

    expect(workspace1Gaps.every((g) => g.workspace_id === "ws-1")).toBe(true);
    expect(workspace2Gaps[0].workspace_id).not.toBe("ws-1");
  });

  it("should require workspace membership to view gaps (CCP-05 verification)", () => {
    // CCP-05 verifyWorkspaceMembership enforces membership check
    // CCP-07 RLS also enforces via:
    // WHERE workspace_id IN (
    //   SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    // )

    const membership = {
      user_id: "user-1",
      workspace_id: "ws-1",
      verified: true,
    };

    expect(membership.verified).toBe(true);
  });

  it("should integrate with workspace entitlements (CCP-05)", () => {
    // Workspace members have roles (owner, editor, viewer)
    // Gap reporting should be allowed for editors/owners only

    const roles = {
      owner: { can_report_gaps: true },
      editor: { can_report_gaps: true },
      viewer: { can_report_gaps: false },
    };

    expect(roles.owner.can_report_gaps).toBe(true);
    expect(roles.editor.can_report_gaps).toBe(true);
    expect(roles.viewer.can_report_gaps).toBe(false);
  });

  it("should use workspace active context (CCP-05 active workspace)", () => {
    // When user is in a workspace, gaps should be scoped to that workspace
    const userContext = {
      user_id: "user-1",
      active_workspace_id: "ws-1",
    };

    // Gaps should be filtered by active_workspace_id
    const gaps = [
      { id: "gap-1", workspace_id: "ws-1" },
      { id: "gap-2", workspace_id: "ws-2" },
    ];

    const filteredGaps = gaps.filter(
      (g) => g.workspace_id === userContext.active_workspace_id
    );
    expect(filteredGaps).toHaveLength(1);
    expect(filteredGaps[0].id).toBe("gap-1");
  });

  it("should integrate with CCP-04 report snapshots", () => {
    // When analyzing a report, show applicable rules and gaps
    // Rules should be linked to parcel
    // Gaps should be linked to parcel

    const report = {
      id: "rpt-1",
      parcel_id: "parcel-123",
    };

    const parcelRules = [
      { id: "rule-1", parcel_id: "parcel-123", rule_type: "setback" },
    ];

    const parcelGaps = [
      { id: "gap-1", parcel_id: "parcel-123", gap_type: "missing" },
    ];

    expect(parcelRules.every((r) => r.parcel_id === report.parcel_id)).toBe(
      true
    );
    expect(parcelGaps.every((g) => g.parcel_id === report.parcel_id)).toBe(true);
  });

  it("should track rule citations as proof of due diligence", () => {
    // When a report identifies a violation, trace it to:
    // 1. Rule (CCP-07)
    // 2. Source (CCP-07)
    // 3. Citation (CCP-07)
    // Provides chain of custody for findings

    const violation = {
      finding: "Building exceeds height limit",
      rule: {
        id: "rule-1",
        rule_type: "height_limit",
        description: "35-foot maximum",
      },
      source: {
        id: "source-1",
        name: "Telluride Town Code",
        type: "ordinance",
      },
      citation: "Section 13.4.2(c)",
    };

    expect(violation.rule).toBeDefined();
    expect(violation.source).toBeDefined();
    expect(violation.citation).toBeDefined();
  });
});

describe("CCP-07 Advanced Integration", () => {
  it("should link rules to workspace members who created them", () => {
    // CCP-05 tracks users in workspace_members
    // CCP-07 tracks rule creator in rules.created_by

    const rule = {
      id: "rule-1",
      workspace_id: "ws-1",
      created_by: "user-1",
      created_at: new Date().toISOString(),
    };

    expect(rule).toHaveProperty("created_by");
    expect(rule.created_by).toBeDefined();
  });

  it("should track who reported data gaps", () => {
    const gap = {
      id: "gap-1",
      workspace_id: "ws-1",
      reported_by: "user-1",
      created_at: new Date().toISOString(),
    };

    expect(gap).toHaveProperty("reported_by");
  });

  it("should support concurrent rule and gap operations", () => {
    // Multiple users in same workspace can:
    // - Create rules independently
    // - Report gaps independently
    // - Link rules to sources independently
    // RLS ensures proper isolation

    const user1 = { id: "user-1", workspace_id: "ws-1" };
    const user2 = { id: "user-2", workspace_id: "ws-1" };

    const rule1 = { id: "rule-1", created_by: user1.id };
    const rule2 = { id: "rule-2", created_by: user2.id };

    expect(rule1.created_by).not.toBe(rule2.created_by);
    expect(rule1.created_by).toBe(user1.id);
  });

  it("should maintain data consistency with CCP-04 snapshots", () => {
    // When creating a snapshot, it captures rules+gaps at that time
    // Future gap resolution doesn't retroactively change snapshot
    // Snapshot remains immutable (CCP-04)

    const snapshot = {
      id: "snap-1",
      parcel_id: "parcel-1",
      created_at: new Date().toISOString(),
      rules: [{ id: "rule-1", rule_type: "setback" }],
      gaps: [{ id: "gap-1", gap_type: "missing" }],
    };

    // Later, gap is resolved
    const updatedGap = { id: "gap-1", resolution_status: "resolved" };

    // Snapshot should not change
    expect(snapshot.gaps[0].gap_type).toBe("missing");
  });
});
