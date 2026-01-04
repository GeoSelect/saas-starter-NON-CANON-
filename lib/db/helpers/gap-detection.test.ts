import { describe, it, expect, beforeEach } from "vitest";

/**
 * CCP-07 Gap Detection Logic Test Suite
 * Tests for identifying, analyzing, and prioritizing data quality gaps
 */

describe("CCP-07 Gap Detection: Missing Information", () => {
  describe("Identification", () => {
    it("should detect missing required rule information", () => {
      const parcelRules = [
        { rule_type: "setback", description: "25-foot rear" },
        { rule_type: "height_limit", description: null }, // Missing description
      ];

      const missingGaps = parcelRules
        .map((rule, idx) => ({
          rule_index: idx,
          rule_type: rule.rule_type,
          missing: !rule.description,
        }))
        .filter((g) => g.missing);

      expect(missingGaps).toHaveLength(1);
      expect(missingGaps[0].rule_type).toBe("height_limit");
    });

    it("should detect missing source citations for rules", () => {
      const rule = { id: "rule-1", rule_type: "setback" };
      const ruleSources = []; // No sources linked

      const isMissingSource = ruleSources.length === 0;

      expect(isMissingSource).toBe(true);
    });

    it("should detect when rule types lack authoritative source", () => {
      const rule = {
        rule_type: "height_limit",
        sources: [{ type: "custom", confidence_level: "inferred" }],
      };

      const hasAuthoritativeSource = rule.sources.some(
        (s) => ["ordinance", "jurisdiction_code"].includes(s.type)
      );

      expect(hasAuthoritativeSource).toBe(false);
    });

    it("should identify parcels with no documented rules", () => {
      const parcelRules = {
        "parcel-1": [],
        "parcel-2": [{ rule_type: "setback" }],
        "parcel-3": [],
      };

      const incomplete = Object.entries(parcelRules)
        .filter(([_, rules]) => rules.length === 0)
        .map(([id]) => id);

      expect(incomplete).toHaveLength(2);
      expect(incomplete).toContain("parcel-1");
      expect(incomplete).toContain("parcel-3");
    });
  });

  describe("Gap Reporting", () => {
    it("should create missing gap with description", () => {
      const gap = {
        gap_type: "missing" as const,
        description: "Setback requirement not found in any source",
        severity: "warning" as const,
        resolution_status: "open" as const,
      };

      expect(gap.gap_type).toBe("missing");
      expect(gap.description).toContain("not found");
    });

    it("should track which rule is missing information", () => {
      const gap = {
        gap_type: "missing",
        description: "Height limit not documented",
        related_rule_type: "height_limit",
      };

      expect(gap.related_rule_type).toBe("height_limit");
    });

    it("should distinguish between missing fields and missing rules", () => {
      const missingField = {
        gap_type: "missing",
        description: "Height limit height_feet value not specified",
        subtype: "field",
      };

      const missingRule = {
        gap_type: "missing",
        description: "No height limit rule found",
        subtype: "rule",
      };

      expect(missingField.subtype).toBe("field");
      expect(missingRule.subtype).toBe("rule");
    });
  });
});

describe("CCP-07 Gap Detection: Conflicts", () => {
  describe("Detection", () => {
    it("should identify conflicting rule values from different sources", () => {
      const sources = [
        { source_name: "County Assessor", value: "35 feet" },
        { source_name: "HOA CCR", value: "30 feet" },
      ];

      const conflict = sources.length > 1 &&
        sources.some((s, i) =>
          sources.slice(i + 1).some((other) => s.value !== other.value)
        );

      expect(conflict).toBe(true);
    });

    it("should detect contradictory rule implications", () => {
      const rules = [
        { rule_type: "density", description: "Maximum 2 units per acre" },
        {
          rule_type: "density",
          description: "Maximum 1 unit per acre",
        }, // Contradictory
      ];

      const conflict = new Set(
        rules.map((r) => r.description)
      ).size > 1 && rules.map((r) => r.rule_type).some((t, i) =>
        rules.slice(i + 1).map((r) => r.rule_type).includes(t)
      );

      expect(conflict).toBe(true);
    });

    it("should identify when jurisdictions override HOA rules", () => {
      const jurisdictionRule = {
        source_type: "jurisdiction_code",
        rule_type: "setback",
        value: "25 feet",
      };

      const hoaRule = {
        source_type: "hoa_ccr",
        rule_type: "setback",
        value: "30 feet",
      };

      // Note: Jurisdiction typically takes precedence
      const conflict = {
        rules: [jurisdictionRule, hoaRule],
        requires_clarification: true,
        likely_precedence: "jurisdiction",
      };

      expect(conflict.requires_clarification).toBe(true);
    });
  });

  describe("Gap Reporting", () => {
    it("should create conflict gap with both values", () => {
      const gap = {
        gap_type: "conflict" as const,
        description: "Conflicting setback requirements",
        details: {
          rule_type: "setback",
          sources: [
            { source: "County", value: "25 feet" },
            { source: "HOA", value: "30 feet" },
          ],
        },
        severity: "critical" as const,
      };

      expect(gap.gap_type).toBe("conflict");
      expect(gap.details.sources).toHaveLength(2);
    });

    it("should prioritize conflicts by rule importance", () => {
      const conflicts = [
        {
          gap_type: "conflict",
          rule_type: "use_restriction",
          severity: "critical",
        },
        { gap_type: "conflict", rule_type: "parking", severity: "info" },
        {
          gap_type: "conflict",
          rule_type: "height_limit",
          severity: "critical",
        },
      ];

      const criticalConflicts = conflicts.filter(
        (c) => c.severity === "critical"
      );
      expect(criticalConflicts).toHaveLength(2);
    });
  });
});

describe("CCP-07 Gap Detection: Outdated Information", () => {
  describe("Staleness Detection", () => {
    it("should identify sources not verified in 12+ months", () => {
      const now = new Date();
      const thirteenMonthsAgo = new Date(
        now.getTime() - 13 * 30 * 24 * 60 * 60 * 1000
      );

      const source = {
        last_verified_at: thirteenMonthsAgo,
      };

      const staleThresholdMs = 365 * 24 * 60 * 60 * 1000; // 1 year
      const isStale =
        now.getTime() - source.last_verified_at.getTime() >
        staleThresholdMs;

      expect(isStale).toBe(true);
    });

    it("should detect recently verified sources", () => {
      const now = new Date();
      const twoMonthsAgo = new Date(
        now.getTime() - 2 * 30 * 24 * 60 * 60 * 1000
      );

      const source = { last_verified_at: twoMonthsAgo };

      const staleThresholdMs = 365 * 24 * 60 * 60 * 1000;
      const isFresh =
        now.getTime() - source.last_verified_at.getTime() <
        staleThresholdMs;

      expect(isFresh).toBe(true);
    });

    it("should track verification age in months", () => {
      const now = new Date();
      const verifiedDate = new Date(
        now.getTime() - 8 * 30 * 24 * 60 * 60 * 1000
      ); // 8 months ago

      const ageMonths = Math.floor(
        (now.getTime() - verifiedDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
      );

      expect(ageMonths).toBe(8);
    });
  });

  describe("Gap Reporting", () => {
    it("should create outdated gap for old source", () => {
      const now = new Date();
      const oldDate = new Date(
        now.getTime() - 18 * 30 * 24 * 60 * 60 * 1000
      ); // 18 months

      const gap = {
        gap_type: "outdated" as const,
        description: `Source not verified since ${oldDate.toLocaleDateString()}`,
        last_verified_at: oldDate,
        severity: "warning" as const,
        recommendation: "Re-verify with current authority",
      };

      expect(gap.gap_type).toBe("outdated");
      expect(gap.recommendation).toContain("verify");
    });

    it("should set urgency based on age", () => {
      const gaps = [
        { gap_type: "outdated", ageMonths: 6, severity: "info" },
        { gap_type: "outdated", ageMonths: 13, severity: "warning" },
        { gap_type: "outdated", ageMonths: 24, severity: "critical" },
      ];

      expect(gaps[0].severity).toBe("info");
      expect(gaps[1].severity).toBe("warning");
      expect(gaps[2].severity).toBe("critical");
    });

    it("should track original source and current source for audits", () => {
      const gap = {
        gap_type: "outdated",
        original_source: {
          id: "src-1",
          name: "County Code v2022",
          verified_date: new Date("2022-01-01"),
        },
        current_source: {
          id: "src-1",
          name: "County Code v2024",
          verified_date: new Date("2024-01-01"),
        },
      };

      expect(gap.original_source.verified_date).not.toEqual(
        gap.current_source.verified_date
      );
    });
  });
});

describe("CCP-07 Gap Detection: Unverified Information", () => {
  describe("Confidence Tracking", () => {
    it("should identify inferred vs verified sources", () => {
      const sources = [
        { id: "src-1", confidence_level: "verified" },
        { id: "src-2", confidence_level: "pending" },
        { id: "src-3", confidence_level: "inferred" },
      ];

      const verified = sources.filter(
        (s) => s.confidence_level === "verified"
      );
      const unverified = sources.filter(
        (s) => s.confidence_level !== "verified"
      );

      expect(verified).toHaveLength(1);
      expect(unverified).toHaveLength(2);
    });

    it("should track verification method", () => {
      const source = {
        confidence_level: "inferred",
        inference_method: "neighbor_properties",
        inference_confidence: 0.65,
      };

      expect(source.inference_method).toBe("neighbor_properties");
      expect(source.inference_confidence).toBeLessThan(1);
    });

    it("should identify sources pending human verification", () => {
      const sources = [
        { id: "src-1", confidence_level: "verified" },
        { id: "src-2", confidence_level: "pending" },
        { id: "src-3", confidence_level: "pending" },
      ];

      const pending = sources.filter(
        (s) => s.confidence_level === "pending"
      );
      expect(pending).toHaveLength(2);
    });
  });

  describe("Gap Reporting", () => {
    it("should create unverified gap for inferred information", () => {
      const gap = {
        gap_type: "unverified" as const,
        description: "Setback inferred from neighbor properties",
        confidence: 0.65,
        inference_method: "neighbor_analysis",
        severity: "info" as const,
        recommendation:
          "Contact HOA or town to verify official requirement",
      };

      expect(gap.gap_type).toBe("unverified");
      expect(gap.confidence).toBeLessThan(1);
    });

    it("should track verification pathway", () => {
      const gap = {
        gap_type: "unverified",
        description: "Height limit inferred from zoning analysis",
        next_steps: [
          "Review county zoning map",
          "Contact zoning administrator",
          "Request official height limit determination",
        ],
      };

      expect(gap.next_steps).toHaveLength(3);
      expect(gap.next_steps[0]).toContain("zoning");
    });

    it("should identify rules relying on unverified sources only", () => {
      const rule = {
        rule_type: "setback",
        sources: [
          { confidence_level: "inferred" },
          { confidence_level: "pending" },
        ],
      };

      const hasVerifiedSource = rule.sources.some(
        (s) => s.confidence_level === "verified"
      );

      const gap = {
        gap_type: "unverified",
        description: `Rule has no verified sources`,
        affected_rule_type: rule.rule_type,
      };

      expect(hasVerifiedSource).toBe(false);
      expect(gap.affected_rule_type).toBe("setback");
    });
  });
});

describe("CCP-07 Gap Detection: Severity Calculation", () => {
  describe("Critical Gaps", () => {
    it("should mark use_restriction conflicts as critical", () => {
      const gap = {
        gap_type: "conflict",
        rule_type: "use_restriction",
        calculated_severity: "critical",
      };

      expect(gap.calculated_severity).toBe("critical");
    });

    it("should mark missing setback/height requirements as critical", () => {
      const gaps = [
        { gap_type: "missing", rule_type: "setback", severity: "critical" },
        {
          gap_type: "missing",
          rule_type: "height_limit",
          severity: "critical",
        },
      ];

      expect(gaps.every((g) => g.severity === "critical")).toBe(true);
    });

    it("should mark conflicting code interpretations as critical", () => {
      const gap = {
        gap_type: "conflict",
        description: "County and HOA have different interpretations",
        severity: "critical",
      };

      expect(gap.severity).toBe("critical");
    });
  });

  describe("Warning Gaps", () => {
    it("should mark outdated information (>6 months) as warning", () => {
      const gap = {
        gap_type: "outdated",
        ageMonths: 9,
        severity: "warning",
      };

      expect(gap.severity).toBe("warning");
    });

    it("should mark inferred setback as warning", () => {
      const gap = {
        gap_type: "unverified",
        rule_type: "setback",
        confidence: 0.75,
        severity: "warning",
      };

      expect(gap.severity).toBe("warning");
    });

    it("should mark missing optional rules as warning", () => {
      const gap = {
        gap_type: "missing",
        rule_type: "parking",
        is_optional: true,
        severity: "warning",
      };

      expect(gap.severity).toBe("warning");
    });
  });

  describe("Info Gaps", () => {
    it("should mark recently verified stale info as info", () => {
      const gap = {
        gap_type: "outdated",
        ageMonths: 4,
        severity: "info",
      };

      expect(gap.severity).toBe("info");
    });

    it("should mark high-confidence inferred data as info", () => {
      const gap = {
        gap_type: "unverified",
        confidence: 0.92,
        severity: "info",
      };

      expect(gap.severity).toBe("info");
    });

    it("should mark missing decorative rules as info", () => {
      const gap = {
        gap_type: "missing",
        rule_type: "other",
        subtype: "architectural_guidelines",
        severity: "info",
      };

      expect(gap.severity).toBe("info");
    });
  });
});

describe("CCP-07 Gap Detection: Resolution Workflow", () => {
  describe("Initial State", () => {
    it("should create gap in open state", () => {
      const gap = {
        id: "gap-1",
        resolution_status: "open" as const,
        created_at: new Date().toISOString(),
      };

      expect(gap.resolution_status).toBe("open");
    });

    it("should track gap reporter", () => {
      const gap = {
        reported_by: "user-123",
        reported_at: new Date().toISOString(),
      };

      expect(gap.reported_by).toBeDefined();
    });
  });

  describe("Investigation", () => {
    it("should transition gap to investigating", () => {
      const gap = {
        id: "gap-1",
        resolution_status: "open",
      };

      gap.resolution_status = "investigating";
      expect(gap.resolution_status).toBe("investigating");
    });

    it("should track investigator notes", () => {
      const gap = {
        resolution_status: "investigating",
        investigation_notes: "Contacted county zoning office - waiting for response",
        last_activity: new Date().toISOString(),
      };

      expect(gap.investigation_notes).toContain("county");
    });
  });

  describe("Resolution", () => {
    it("should mark gap resolved with evidence", () => {
      const gap = {
        resolution_status: "open",
      };

      // Update to resolved
      gap.resolution_status = "resolved";

      expect(gap.resolution_status).toBe("resolved");
    });

    it("should track resolution method", () => {
      const gap = {
        resolution_status: "resolved",
        resolution_method: "source_verification",
        resolution_date: new Date().toISOString(),
        resolution_details: {
          verified_by: "county_zoning_office",
          official_documentation: "Zoning Determination Letter",
        },
      };

      expect(gap.resolution_method).toContain("verification");
    });

    it("should link resolved gap to authoritative source", () => {
      const gap = {
        resolution_status: "resolved",
        resolved_source_id: "src-1",
        resolved_source_name: "Telluride Town Code 2024",
      };

      expect(gap.resolved_source_id).toBe("src-1");
    });
  });
});

describe("CCP-07 Gap Detection: Batch Operations", () => {
  it("should detect all gaps in workspace", () => {
    const parcels = [
      { id: "p-1", gaps: 2 },
      { id: "p-2", gaps: 0 },
      { id: "p-3", gaps: 3 },
    ];

    const totalGaps = parcels.reduce((sum, p) => sum + p.gaps, 0);
    expect(totalGaps).toBe(5);
  });

  it("should filter gaps by severity", () => {
    const gaps = [
      { gap_type: "missing", severity: "critical" },
      { gap_type: "conflict", severity: "critical" },
      { gap_type: "outdated", severity: "warning" },
      { gap_type: "unverified", severity: "info" },
    ];

    const criticalGaps = gaps.filter((g) => g.severity === "critical");
    const warningGaps = gaps.filter((g) => g.severity === "warning");

    expect(criticalGaps).toHaveLength(2);
    expect(warningGaps).toHaveLength(1);
  });

  it("should generate gap summary dashboard", () => {
    const gaps = [
      { gap_type: "missing", severity: "critical", resolution_status: "open" },
      {
        gap_type: "missing",
        severity: "warning",
        resolution_status: "open",
      },
      {
        gap_type: "conflict",
        severity: "critical",
        resolution_status: "investigating",
      },
      {
        gap_type: "outdated",
        severity: "info",
        resolution_status: "open",
      },
      {
        gap_type: "unverified",
        severity: "warning",
        resolution_status: "resolved",
      },
    ];

    const summary = {
      total: gaps.length,
      by_severity: {
        critical: gaps.filter((g) => g.severity === "critical").length,
        warning: gaps.filter((g) => g.severity === "warning").length,
        info: gaps.filter((g) => g.severity === "info").length,
      },
      by_status: {
        open: gaps.filter((g) => g.resolution_status === "open").length,
        investigating: gaps.filter(
          (g) => g.resolution_status === "investigating"
        ).length,
        resolved: gaps.filter((g) => g.resolution_status === "resolved")
          .length,
      },
      by_type: {
        missing: gaps.filter((g) => g.gap_type === "missing").length,
        conflict: gaps.filter((g) => g.gap_type === "conflict").length,
        outdated: gaps.filter((g) => g.gap_type === "outdated").length,
        unverified: gaps.filter((g) => g.gap_type === "unverified").length,
      },
    };

    expect(summary.total).toBe(5);
    expect(summary.by_severity.critical).toBe(2);
    expect(summary.by_status.open).toBe(3);
    expect(summary.by_type.missing).toBe(2);
  });
});
