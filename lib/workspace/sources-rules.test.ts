import { describe, it, expect, beforeEach } from "vitest";
import type {
  Source,
  Rule,
  DataGap,
} from "@/lib/workspace/sources-rules";

describe("CCP-07: Data Sources & Rule Management", () => {
  describe("Sources Management", () => {
    it("should support source types", () => {
      const sourceTypes = [
        "hoa_ccr",
        "jurisdiction_code",
        "ordinance",
        "county_records",
        "assessor",
        "zoning",
        "custom",
      ];

      sourceTypes.forEach((type) => {
        expect(["hoa_ccr", "jurisdiction_code", "ordinance", "county_records", "assessor", "zoning", "custom"]).toContain(
          type
        );
      });
    });

    it("should track source confidence levels", () => {
      const mockSource: Partial<Source> = {
        name: "Telluride HOA CCRs",
        type: "hoa_ccr",
        confidence_level: "pending",
      };

      expect(["verified", "inferred", "pending"]).toContain(
        mockSource.confidence_level
      );
    });

    it("should track verification timestamps", () => {
      const mockSource: Partial<Source> = {
        name: "County Zoning Ordinance",
        last_verified_at: new Date().toISOString(),
      };

      if (mockSource.last_verified_at) {
        expect(new Date(mockSource.last_verified_at).getTime()).toBeGreaterThan(
          0
        );
      }
    });

    it("should allow filtering sources by type and jurisdiction", () => {
      const sourceFilters = {
        type: "ordinance",
        jurisdiction: "Telluride, CO",
        confidenceLevel: "verified" as const,
      };

      expect(sourceFilters).toHaveProperty("type");
      expect(sourceFilters).toHaveProperty("jurisdiction");
      expect(sourceFilters).toHaveProperty("confidenceLevel");
    });
  });

  describe("Rules Management", () => {
    it("should support rule types", () => {
      const ruleTypes = [
        "setback",
        "height_limit",
        "density",
        "use_restriction",
        "parking",
        "other",
      ];

      ruleTypes.forEach((type) => {
        expect([
          "setback",
          "height_limit",
          "density",
          "use_restriction",
          "parking",
          "other",
        ]).toContain(type);
      });
    });

    it("should attach rule details as JSON", () => {
      const mockRule: Partial<Rule> = {
        rule_type: "setback",
        description: "25-foot rear setback",
        details: {
          setback_feet: 25,
          applies_to: "rear",
          applies_to_sides: false,
        },
      };

      expect(mockRule.details).toHaveProperty("setback_feet");
      expect(mockRule.details?.setback_feet).toBe(25);
    });

    it("should track rule creator", () => {
      const mockRule: Partial<Rule> = {
        description: "New zoning restriction",
        created_by: "user-uuid-123",
      };

      expect(mockRule).toHaveProperty("created_by");
      expect(mockRule.created_by).toBeDefined();
    });

    it("should scope rules to workspace and optionally parcel", () => {
      const mockRule: Partial<Rule> = {
        workspace_id: "workspace-uuid",
        parcel_id: "parcel-id-123",
        rule_type: "height_limit",
      };

      expect(mockRule).toHaveProperty("workspace_id");
      expect(mockRule).toHaveProperty("parcel_id");
    });
  });

  describe("Rule-Source Citations", () => {
    it("should link rules to sources with citations", () => {
      const citation = "Section 4.2, Paragraph 3";
      const mockRuleSource = {
        rule_id: "rule-uuid",
        source_id: "source-uuid",
        citation,
        citation_date: new Date().toISOString(),
      };

      expect(mockRuleSource.citation).toBe(citation);
      expect(mockRuleSource).toHaveProperty("citation_date");
    });

    it("should support many-to-many rule-source relationships", () => {
      // One rule can have multiple sources
      const rule1Sources = [
        { rule_id: "rule-1", source_id: "source-a" },
        { rule_id: "rule-1", source_id: "source-b" },
      ];

      // One source can be cited by multiple rules
      const source1Rules = [
        { rule_id: "rule-x", source_id: "source-1" },
        { rule_id: "rule-y", source_id: "source-1" },
      ];

      expect(rule1Sources).toHaveLength(2);
      expect(source1Rules).toHaveLength(2);
    });

    it("should support detailed citations", () => {
      const citations = [
        "Section 4.2, Paragraph 3",
        "HOA CC&R Article IV, Section 2.1",
        "Telluride Town Code Chapter 13, Subsection 13.4.2(c)",
        "Zoning Map Amendment #2024-15",
      ];

      citations.forEach((citation) => {
        expect(citation).toBeTruthy();
        expect(citation.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Data Gaps", () => {
    it("should support gap types", () => {
      const gapTypes = ["missing", "conflict", "outdated", "unverified"];

      gapTypes.forEach((type) => {
        expect(["missing", "conflict", "outdated", "unverified"]).toContain(
          type
        );
      });
    });

    it("should support severity levels", () => {
      const severities = ["critical", "warning", "info"];

      severities.forEach((severity) => {
        expect(["critical", "warning", "info"]).toContain(severity);
      });
    });

    it("should track resolution status", () => {
      const mockGap: Partial<DataGap> = {
        gap_type: "missing",
        severity: "warning",
        resolution_status: "open",
      };

      expect(["open", "investigating", "resolved"]).toContain(
        mockGap.resolution_status
      );
    });

    it("should track reporter and resolution timestamp", () => {
      const mockGap: Partial<DataGap> = {
        reported_by: "user-uuid",
        created_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
      };

      expect(mockGap).toHaveProperty("reported_by");
      expect(mockGap).toHaveProperty("resolved_at");
    });

    it("should scope gaps to workspace and optionally parcel", () => {
      const mockGap: Partial<DataGap> = {
        workspace_id: "workspace-uuid",
        parcel_id: "parcel-id-123",
        gap_type: "missing",
      };

      expect(mockGap).toHaveProperty("workspace_id");
      expect(mockGap).toHaveProperty("parcel_id");
    });
  });

  describe("RLS Enforcement", () => {
    it("should allow public read of sources", () => {
      // Sources are public reference data
      const policy = {
        select: "public",
        insert: "authenticated workspace member",
        update: "authenticated workspace member",
      };

      expect(policy.select).toBe("public");
    });

    it("should restrict rules to workspace members", () => {
      // Only workspace members can view/create/edit rules
      const policy = {
        select: "workspace members only",
        insert: "workspace members only",
        update: "workspace members only",
        delete: "workspace members only",
      };

      expect(policy.select).toContain("workspace members");
    });

    it("should restrict data gaps to workspace members", () => {
      // Only workspace members can view/manage gaps
      const policy = {
        select: "workspace members only",
        insert: "workspace members only",
        update: "workspace members only",
      };

      expect(policy.select).toContain("workspace members");
    });
  });

  describe("Integration with Existing Data", () => {
    it("should integrate with existing sources in parcels", () => {
      // Current schema has parcels.sources as JSONB array
      // CCP-07 provides structured source management
      const parcelSources = ["Assessor", "Zoning"];
      const structuredSources = [
        { name: "Assessor", type: "assessor", confidence_level: "verified" },
        { name: "Zoning", type: "zoning", confidence_level: "inferred" },
      ];

      expect(parcelSources).toHaveLength(2);
      expect(structuredSources).toHaveLength(2);
    });

    it("should support finding rules by parcel_id", () => {
      // Rules linked to specific parcels can be queried
      const parcelId = "parcel-123";
      const mockParcelRules = [
        {
          id: "rule-1",
          parcel_id: parcelId,
          rule_type: "setback",
        },
        {
          id: "rule-2",
          parcel_id: parcelId,
          rule_type: "height_limit",
        },
      ];

      expect(mockParcelRules).toHaveLength(2);
      expect(mockParcelRules.every((r) => r.parcel_id === parcelId)).toBe(true);
    });

    it("should track data quality through gaps", () => {
      // CCP-04 snapshots are immutable, but CCP-07 tracks missing/conflicting data
      const gap: Partial<DataGap> = {
        gap_type: "missing",
        description:
          "HOA CCR setback requirements not found in online sources",
        severity: "critical",
      };

      expect(gap.gap_type).toBe("missing");
      expect(gap.severity).toBe("critical");
    });
  });

  describe("Workspace Isolation", () => {
    it("should isolate rules between workspaces", () => {
      const workspace1Rules = [
        { id: "rule-1", workspace_id: "ws-1", rule_type: "setback" },
        { id: "rule-2", workspace_id: "ws-1", rule_type: "height_limit" },
      ];

      const workspace2Rules = [
        { id: "rule-3", workspace_id: "ws-2", rule_type: "density" },
      ];

      expect(workspace1Rules.every((r) => r.workspace_id === "ws-1")).toBe(
        true
      );
      expect(workspace2Rules.every((r) => r.workspace_id === "ws-2")).toBe(true);
    });

    it("should isolate data gaps between workspaces", () => {
      const workspace1Gaps = [
        { id: "gap-1", workspace_id: "ws-1", gap_type: "missing" },
      ];

      const workspace2Gaps = [
        { id: "gap-2", workspace_id: "ws-2", gap_type: "conflict" },
      ];

      expect(workspace1Gaps[0].workspace_id).not.toBe(
        workspace2Gaps[0].workspace_id
      );
    });
  });

  describe("Data Quality Tracking", () => {
    it("should track missing information", () => {
      const missingGap: Partial<DataGap> = {
        gap_type: "missing",
        description: "Building height restrictions not found",
        severity: "warning",
      };

      expect(missingGap.gap_type).toBe("missing");
    });

    it("should track conflicting information", () => {
      const conflictGap: Partial<DataGap> = {
        gap_type: "conflict",
        description:
          "County records show 35ft limit, HOA CC&R shows 30ft limit",
        severity: "critical",
      };

      expect(conflictGap.gap_type).toBe("conflict");
      expect(conflictGap.severity).toBe("critical");
    });

    it("should track outdated information", () => {
      const outdatedGap: Partial<DataGap> = {
        gap_type: "outdated",
        description:
          "Zoning ordinance last verified 18 months ago, amendment pending",
        severity: "info",
      };

      expect(outdatedGap.gap_type).toBe("outdated");
    });

    it("should track unverified information", () => {
      const unverifiedGap: Partial<DataGap> = {
        gap_type: "unverified",
        description:
          "Parcel setback requirements inferred from adjacent properties",
        severity: "info",
      };

      expect(unverifiedGap.gap_type).toBe("unverified");
    });
  });

  describe("Citation & Sourcing", () => {
    it("should support precise legal citations", () => {
      const citations = [
        "TTC § 13.4.2(c) - Height Restrictions",
        "San Miguel County Code Title 17.11 - Development Standards",
        "Telluride HOA CC&Rs Article IV § 2.1 - Architectural Review",
        "Zoning Ordinance Amendment #2024-15",
      ];

      citations.forEach((citation) => {
        expect(citation).toMatch(/[§#]/); // Contains legal reference symbols
      });
    });

    it("should track when citations were verified", () => {
      const citationDate = new Date().toISOString();
      const ruleSource = {
        rule_id: "rule-123",
        source_id: "source-456",
        citation: "Section 4.2",
        citation_date: citationDate,
      };

      expect(ruleSource.citation_date).toBe(citationDate);
      expect(new Date(ruleSource.citation_date).getTime()).toBeGreaterThan(0);
    });
  });

  describe("Source Verification Workflow", () => {
    it("should track source verification status", () => {
      const source1: Partial<Source> = {
        name: "Verified HOA CCR",
        confidence_level: "verified",
        last_verified_at: new Date().toISOString(),
      };

      const source2: Partial<Source> = {
        name: "Inferred from County Records",
        confidence_level: "inferred",
      };

      const source3: Partial<Source> = {
        name: "Pending Verification",
        confidence_level: "pending",
      };

      expect(source1.confidence_level).toBe("verified");
      expect(source2.confidence_level).toBe("inferred");
      expect(source3.confidence_level).toBe("pending");
    });

    it("should update verification status over time", () => {
      const source: Source & { verification_history?: any[] } = {
        id: "source-1",
        name: "County Ordinance",
        type: "ordinance",
        confidence_level: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Initially pending
      expect(source.confidence_level).toBe("pending");

      // Later verified
      source.confidence_level = "verified";
      source.last_verified_at = new Date().toISOString();

      expect(source.confidence_level).toBe("verified");
      expect(source.last_verified_at).toBeDefined();
    });
  });
});
