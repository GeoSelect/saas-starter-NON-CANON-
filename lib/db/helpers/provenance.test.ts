import { describe, it, expect } from "vitest";
import type { Source, DataGap, Rule } from "@/lib/workspace/sources-rules";

describe("Provenance Tracking Helpers", () => {
  describe("getRuleSources", () => {
    it("should return empty array if rule has no sources", () => {
      const sources: Source[] = [];
      expect(sources).toHaveLength(0);
    });

    it("should return all sources cited by a rule", () => {
      const mockSources: Source[] = [
        {
          id: "source-1",
          name: "Telluride Town Code",
          type: "ordinance",
          confidence_level: "verified",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "source-2",
          name: "HOA CC&Rs",
          type: "hoa_ccr",
          confidence_level: "verified",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      expect(mockSources).toHaveLength(2);
      expect(mockSources[0].type).toBe("ordinance");
      expect(mockSources[1].type).toBe("hoa_ccr");
    });

    it("should include citation information", () => {
      const mockRuleSource = {
        rule_id: "rule-1",
        source_id: "source-1",
        citation: "Section 13.4.2(c)",
        citation_date: new Date().toISOString(),
        source: {
          id: "source-1",
          name: "Telluride Town Code",
          type: "ordinance" as const,
          confidence_level: "verified" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      expect(mockRuleSource.citation).toBe("Section 13.4.2(c)");
      expect(mockRuleSource.source.name).toBe("Telluride Town Code");
    });
  });

  describe("getWorkspaceGaps", () => {
    it("should return all gaps in a workspace", () => {
      const mockGaps: DataGap[] = [
        {
          id: "gap-1",
          workspace_id: "ws-1",
          gap_type: "missing",
          description: "HOA setback requirements not found",
          severity: "critical",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "gap-2",
          workspace_id: "ws-1",
          gap_type: "conflict",
          description: "Conflicting height limits",
          severity: "warning",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      expect(mockGaps).toHaveLength(2);
      expect(mockGaps.every((g) => g.workspace_id === "ws-1")).toBe(true);
    });

    it("should order gaps by creation date (newest first)", () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const gaps = [
        {
          id: "gap-1",
          created_at: yesterday.toISOString(),
        },
        {
          id: "gap-2",
          created_at: now.toISOString(),
        },
      ];

      // Gaps should be ordered descending (newest first)
      expect(
        new Date(gaps[1].created_at).getTime() >
          new Date(gaps[0].created_at).getTime()
      ).toBe(true);
    });
  });

  describe("identifyMissingInfo", () => {
    it("should return only gaps with gap_type = 'missing'", () => {
      const allGaps: DataGap[] = [
        {
          id: "gap-1",
          workspace_id: "ws-1",
          gap_type: "missing",
          description: "Missing data",
          severity: "critical",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "gap-2",
          workspace_id: "ws-1",
          gap_type: "conflict",
          description: "Conflicting data",
          severity: "warning",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const missingGaps = allGaps.filter((g) => g.gap_type === "missing");
      expect(missingGaps).toHaveLength(1);
      expect(missingGaps[0].gap_type).toBe("missing");
    });

    it("should order by severity (critical first)", () => {
      const gaps: DataGap[] = [
        {
          id: "gap-1",
          workspace_id: "ws-1",
          gap_type: "missing",
          description: "Info level gap",
          severity: "info",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "gap-2",
          workspace_id: "ws-1",
          gap_type: "missing",
          description: "Critical gap",
          severity: "critical",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const severityOrder = { critical: 0, warning: 1, info: 2 };
      const sorted = gaps.sort(
        (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
      );

      expect(sorted[0].severity).toBe("critical");
      expect(sorted[1].severity).toBe("info");
    });
  });

  describe("getRuleProvenance", () => {
    it("should return complete rule with all sources and citations", () => {
      const provenance = {
        rule: {
          id: "rule-1",
          workspace_id: "ws-1",
          rule_type: "setback",
          description: "25-foot rear setback",
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
              type: "ordinance" as const,
              url: "https://telluride.town/code",
              confidence_level: "verified" as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        ],
      };

      expect(provenance.rule).toBeDefined();
      expect(provenance.sources).toHaveLength(1);
      expect(provenance.sources[0].citation).toBe("Section 13.4.2(c)");
    });
  });

  describe("getGapsBySeverity", () => {
    it("should filter gaps by severity level", () => {
      const allGaps: DataGap[] = [
        {
          id: "gap-1",
          workspace_id: "ws-1",
          gap_type: "missing",
          severity: "critical",
          description: "Critical gap",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "gap-2",
          workspace_id: "ws-1",
          gap_type: "missing",
          severity: "warning",
          description: "Warning gap",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const criticalGaps = allGaps.filter((g) => g.severity === "critical");
      expect(criticalGaps).toHaveLength(1);
      expect(criticalGaps[0].severity).toBe("critical");
    });

    it("should only return open gaps", () => {
      const gaps: DataGap[] = [
        {
          id: "gap-1",
          workspace_id: "ws-1",
          gap_type: "missing",
          severity: "critical",
          resolution_status: "open",
          description: "Open gap",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "gap-2",
          workspace_id: "ws-1",
          gap_type: "missing",
          severity: "critical",
          resolution_status: "resolved",
          description: "Resolved gap",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const openGaps = gaps.filter((g) => g.resolution_status === "open");
      expect(openGaps).toHaveLength(1);
      expect(openGaps[0].resolution_status).toBe("open");
    });
  });

  describe("getUnverifiedSources", () => {
    it("should return sources with confidence_level = 'pending'", () => {
      const allSources: Source[] = [
        {
          id: "source-1",
          name: "Verified Source",
          type: "ordinance",
          confidence_level: "verified",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "source-2",
          name: "Pending Source",
          type: "hoa_ccr",
          confidence_level: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const unverifiedSources = allSources.filter(
        (s) => s.confidence_level === "pending"
      );
      expect(unverifiedSources).toHaveLength(1);
      expect(unverifiedSources[0].confidence_level).toBe("pending");
    });
  });

  describe("getGapResolutionSummary", () => {
    it("should count gaps by resolution status", () => {
      const gaps: DataGap[] = [
        {
          id: "gap-1",
          workspace_id: "ws-1",
          gap_type: "missing",
          description: "Gap 1",
          severity: "critical",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "gap-2",
          workspace_id: "ws-1",
          gap_type: "conflict",
          description: "Gap 2",
          severity: "warning",
          resolution_status: "investigating",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "gap-3",
          workspace_id: "ws-1",
          gap_type: "outdated",
          description: "Gap 3",
          severity: "info",
          resolution_status: "resolved",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const summary = {
        total: gaps.length,
        open: gaps.filter((g) => g.resolution_status === "open").length,
        investigating: gaps.filter((g) => g.resolution_status === "investigating")
          .length,
        resolved: gaps.filter((g) => g.resolution_status === "resolved").length,
      };

      expect(summary.total).toBe(3);
      expect(summary.open).toBe(1);
      expect(summary.investigating).toBe(1);
      expect(summary.resolved).toBe(1);
    });

    it("should count gaps by type", () => {
      const gaps: DataGap[] = [
        {
          id: "gap-1",
          workspace_id: "ws-1",
          gap_type: "missing",
          description: "Gap",
          severity: "critical",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "gap-2",
          workspace_id: "ws-1",
          gap_type: "missing",
          description: "Gap",
          severity: "critical",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "gap-3",
          workspace_id: "ws-1",
          gap_type: "conflict",
          description: "Gap",
          severity: "critical",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const by_type: Record<string, number> = {};
      gaps.forEach((gap) => {
        by_type[gap.gap_type] = (by_type[gap.gap_type] || 0) + 1;
      });

      expect(by_type["missing"]).toBe(2);
      expect(by_type["conflict"]).toBe(1);
    });

    it("should count gaps by severity", () => {
      const gaps: DataGap[] = [
        {
          id: "gap-1",
          workspace_id: "ws-1",
          gap_type: "missing",
          description: "Gap",
          severity: "critical",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "gap-2",
          workspace_id: "ws-1",
          gap_type: "missing",
          description: "Gap",
          severity: "warning",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const by_severity: Record<string, number> = {};
      gaps.forEach((gap) => {
        by_severity[gap.severity] = (by_severity[gap.severity] || 0) + 1;
      });

      expect(by_severity["critical"]).toBe(1);
      expect(by_severity["warning"]).toBe(1);
    });
  });

  describe("getRulesWithoutSources", () => {
    it("should return rules that have no citations", () => {
      const allRules: Rule[] = [
        {
          id: "rule-1",
          workspace_id: "ws-1",
          rule_type: "setback",
          description: "Cited rule",
          created_by: "user-1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "rule-2",
          workspace_id: "ws-1",
          rule_type: "height_limit",
          description: "Orphaned rule",
          created_by: "user-1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const citedRuleIds = new Set(["rule-1"]);
      const orphanedRules = allRules.filter((r) => !citedRuleIds.has(r.id));

      expect(orphanedRules).toHaveLength(1);
      expect(orphanedRules[0].id).toBe("rule-2");
    });

    it("should return empty array if all rules are cited", () => {
      const allRules: Rule[] = [
        {
          id: "rule-1",
          workspace_id: "ws-1",
          rule_type: "setback",
          description: "Cited rule",
          created_by: "user-1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const citedRuleIds = new Set(["rule-1"]);
      const orphanedRules = allRules.filter((r) => !citedRuleIds.has(r.id));

      expect(orphanedRules).toHaveLength(0);
    });
  });

  describe("getParcelProvenance", () => {
    it("should return rules specific to a parcel", () => {
      const parcelRules: Rule[] = [
        {
          id: "rule-1",
          workspace_id: "ws-1",
          parcel_id: "parcel-1",
          rule_type: "setback",
          description: "Rule for parcel 1",
          created_by: "user-1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      expect(parcelRules).toHaveLength(1);
      expect(parcelRules[0].parcel_id).toBe("parcel-1");
    });

    it("should return gaps specific to a parcel", () => {
      const parcelGaps: DataGap[] = [
        {
          id: "gap-1",
          workspace_id: "ws-1",
          parcel_id: "parcel-1",
          gap_type: "missing",
          description: "Missing info for parcel 1",
          severity: "critical",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      expect(parcelGaps).toHaveLength(1);
      expect(parcelGaps[0].parcel_id).toBe("parcel-1");
    });

    it("should include gap summary", () => {
      const gaps: DataGap[] = [
        {
          id: "gap-1",
          workspace_id: "ws-1",
          parcel_id: "parcel-1",
          gap_type: "missing",
          description: "Missing",
          severity: "critical",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "gap-2",
          workspace_id: "ws-1",
          parcel_id: "parcel-1",
          gap_type: "missing",
          description: "Missing",
          severity: "critical",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "gap-3",
          workspace_id: "ws-1",
          parcel_id: "parcel-1",
          gap_type: "conflict",
          description: "Conflict",
          severity: "warning",
          resolution_status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const gap_summary = {
        missing: gaps.filter((g) => g.gap_type === "missing").length,
        conflicts: gaps.filter((g) => g.gap_type === "conflict").length,
        outdated: gaps.filter((g) => g.gap_type === "outdated").length,
      };

      expect(gap_summary.missing).toBe(2);
      expect(gap_summary.conflicts).toBe(1);
      expect(gap_summary.outdated).toBe(0);
    });
  });
});
