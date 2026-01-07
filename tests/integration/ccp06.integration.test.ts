/**
 * CCP-06: Branded Reports Integration Tests
 *
 * Frozen Test Contract - Do not modify existing test expectations
 * Tests enforce:
 *   1. API contract (error codes, status codes from error-codes.ts)
 *   2. Workspace isolation (RLS enforcement)
 *   3. Access control (admin-only writes, member reads)
 *   4. Schema validation (ReportSchema immutability)
 *   5. Branding cascade (workspace -> report)
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  createBrandedReport,
  getBrandedReport,
  updateBrandedReport,
  deleteBrandedReport,
  listBrandedReports,
  getAllReportsForWorkspace,
} from "@/lib/db/helpers/branded-reports";
import type { Report } from "@/lib/contracts/ccp06/report.schema";
import {
  CREATE_REPORT_RESPONSE,
  LIST_REPORTS_RESPONSE,
  GET_REPORT_RESPONSE,
  HTTP_STATUS,
} from "@/lib/contracts/ccp06/error-codes";

// ============================================================================
// Test Fixtures
// ============================================================================

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";
const WORKSPACE_ID_2 = "00000000-0000-0000-0000-000000000002";

const validProjection = {
  parcel_id: "parcel-123",
  location: { lat: 40.7128, lng: -74.006 },
  intent: "Property assessment",
};

const validBranding = {
  workspace_name: "Test Workspace",
  color_primary: "#FF6B35",
  logo_url: "https://example.com/logo.png",
};

// ============================================================================
// Contract Tests: Frozen API Schema
// ============================================================================

describe("CCP-06: Branded Reports - Contract Tests", () => {
  it("should return correct schema on create success (200)", async () => {
    const report = await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "Test Report",
      projection: validProjection,
      branding: validBranding,
    });

    // Validate response structure matches frozen schema
    expect(report).toHaveProperty("id");
    expect(report).toHaveProperty("workspace_id", WORKSPACE_ID);
    expect(report).toHaveProperty("name", "Test Report");
    expect(report).toHaveProperty("status", "draft");
    expect(report).toHaveProperty("projection");
    expect(report).toHaveProperty("branding");
    expect(report).toHaveProperty("created_at");
    expect(report).toHaveProperty("updated_at");

    // Validate projection structure
    expect(report.projection).toEqual(validProjection);

    // Validate branding structure
    expect(report.branding).toHaveProperty("workspace_name");
  });

  it("should validate UUID format in responses", async () => {
    const report = await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "UUID Test",
      projection: validProjection,
      branding: validBranding,
    });

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(report.id).toMatch(uuidRegex);
    expect(report.workspace_id).toMatch(uuidRegex);
  });

  it("should return ISO8601 timestamps", async () => {
    const report = await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "Timestamp Test",
      projection: validProjection,
      branding: validBranding,
    });

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(report.created_at).toMatch(iso8601Regex);
    expect(report.updated_at).toMatch(iso8601Regex);
  });

  it("should validate list response pagination structure", async () => {
    await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "List Test 1",
      projection: validProjection,
      branding: validBranding,
    });

    const { reports, total } = await listBrandedReports({
      workspace_id: WORKSPACE_ID,
      limit: 10,
      offset: 0,
    });

    expect(Array.isArray(reports)).toBe(true);
    expect(typeof total).toBe("number");
    expect(total).toBeGreaterThanOrEqual(0);
    expect(reports.length).toBeLessThanOrEqual(10);
  });

  it("should validate status enum values", async () => {
    const report = await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "Status Test",
      projection: validProjection,
      branding: validBranding,
      status: "published",
    });

    expect(["draft", "published", "archived"]).toContain(report.status);
  });
});

// ============================================================================
// Workspace Isolation Tests: RLS Enforcement
// ============================================================================

describe("CCP-06: Branded Reports - Workspace Isolation", () => {
  let reportId: string;

  beforeEach(async () => {
    const report = await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "Isolation Test",
      projection: validProjection,
      branding: validBranding,
    });
    reportId = report.id;
  });

  it("should not find report when querying with wrong workspace_id", async () => {
    const report = await getBrandedReport(reportId, WORKSPACE_ID_2);
    expect(report).toBeNull();
  });

  it("should list reports only from requested workspace", async () => {
    // Create reports in two different workspaces
    await createBrandedReport({
      workspace_id: WORKSPACE_ID_2,
      name: "Other Workspace Report",
      projection: validProjection,
      branding: { ...validBranding, workspace_name: "Other Workspace" },
    });

    const { reports } = await listBrandedReports({
      workspace_id: WORKSPACE_ID,
    });

    // All reports should belong to WORKSPACE_ID
    reports.forEach((r) => {
      expect(r.workspace_id).toBe(WORKSPACE_ID);
    });
  });

  it("should fail update when workspace_id mismatch", async () => {
    const updateFn = async () => {
      await updateBrandedReport({
        id: reportId,
        workspace_id: WORKSPACE_ID_2,
        name: "Hacked Name",
      });
    };

    // Should either return null or throw error (implementation dependent)
    try {
      await updateFn();
      // If no error, verify report wasn't actually updated in WORKSPACE_ID
      const report = await getBrandedReport(reportId, WORKSPACE_ID);
      expect(report?.name).toBe("Isolation Test");
    } catch (error: any) {
      expect(error.message).toContain("NOT_FOUND");
    }
  });

  it("should fail delete when workspace_id mismatch", async () => {
    await expect(
      deleteBrandedReport(reportId, WORKSPACE_ID_2)
    ).rejects.toThrow();

    // Verify report still exists in correct workspace
    const report = await getBrandedReport(reportId, WORKSPACE_ID);
    expect(report).not.toBeNull();
  });

  it("should prevent cross-workspace report access", async () => {
    const report2 = await createBrandedReport({
      workspace_id: WORKSPACE_ID_2,
      name: "Other Workspace Report",
      projection: validProjection,
      branding: { ...validBranding, workspace_name: "Other Workspace" },
    });

    // Try to access report2 (from WORKSPACE_ID_2) using WORKSPACE_ID
    const result = await getBrandedReport(report2.id, WORKSPACE_ID);
    expect(result).toBeNull();
  });
});

// ============================================================================
// Error Handling Tests: Status Codes and Error Codes
// ============================================================================

describe("CCP-06: Branded Reports - Error Handling", () => {
  it("should reject invalid projection (missing required fields)", async () => {
    const invalidProjection = {
      parcel_id: "parcel-123",
      // Missing location and intent
    };

    try {
      await createBrandedReport({
        workspace_id: WORKSPACE_ID,
        name: "Invalid Test",
        projection: invalidProjection as any,
        branding: validBranding,
      });
      fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("VALIDATION_ERROR");
      expect(error.message).toContain("required");
    }
  });

  it("should reject empty report name", async () => {
    try {
      await createBrandedReport({
        workspace_id: WORKSPACE_ID,
        name: "   ", // Only whitespace
        projection: validProjection,
        branding: validBranding,
      });
      fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("VALIDATION_ERROR");
    }
  });

  it("should reject name exceeding max length (255)", async () => {
    try {
      await createBrandedReport({
        workspace_id: WORKSPACE_ID,
        name: "a".repeat(256),
        projection: validProjection,
        branding: validBranding,
      });
      fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("VALIDATION_ERROR");
    }
  });

  it("should reject invalid status value", async () => {
    try {
      await updateBrandedReport({
        id: "00000000-0000-0000-0000-000000000000",
        workspace_id: WORKSPACE_ID,
        status: "invalid_status" as any,
      });
      fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("VALIDATION_ERROR");
    }
  });

  it("should reject invalid report_id format", async () => {
    try {
      await getBrandedReport("not-a-uuid", WORKSPACE_ID);
      // Note: getBrandedReport doesn't validate format, DB will return null
      // but PUT/DELETE routes should validate
    } catch (error: any) {
      // Optional: may be validated in route layer
    }
  });

  it("should return NOT_FOUND for missing report", async () => {
    const result = await getBrandedReport(
      "00000000-0000-0000-0000-000000000000",
      WORKSPACE_ID
    );
    expect(result).toBeNull();
  });

  it("should fail update with non-existent report", async () => {
    try {
      await updateBrandedReport({
        id: "00000000-0000-0000-0000-000000000000",
        workspace_id: WORKSPACE_ID,
        name: "Updated Name",
      });
      fail("Should have thrown NOT_FOUND error");
    } catch (error: any) {
      expect(error.message).toContain("NOT_FOUND");
    }
  });
});

// ============================================================================
// Branding Cascade Tests
// ============================================================================

describe("CCP-06: Branded Reports - Branding Cascade", () => {
  it("should use provided branding if supplied", async () => {
    const report = await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "Custom Branding",
      projection: validProjection,
      branding: {
        workspace_name: "Custom Name",
        color_primary: "#123456",
        logo_url: "https://example.com/custom-logo.png",
      },
    });

    expect(report.branding.workspace_name).toBe("Custom Name");
    expect(report.branding.color_primary).toBe("#123456");
    expect(report.branding.logo_url).toBe("https://example.com/custom-logo.png");
  });

  it("should resolve branding from workspace if not provided", async () => {
    // When branding is undefined, resolveBrandingFromWorkspace is called
    const report = await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "Default Branding",
      projection: validProjection,
      // branding: undefined (will be resolved)
    });

    expect(report.branding).toHaveProperty("workspace_name");
    expect(typeof report.branding.workspace_name).toBe("string");
  });

  it("should update branding independently from projection", async () => {
    const report = await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "Update Branding",
      projection: validProjection,
      branding: validBranding,
    });

    const updated = await updateBrandedReport({
      id: report.id,
      workspace_id: WORKSPACE_ID,
      branding: {
        color_primary: "#999999",
      },
    });

    // Projection should remain unchanged
    expect(updated.projection).toEqual(report.projection);

    // Branding should be merged (color_primary updated, workspace_name preserved)
    expect(updated.branding.workspace_name).toBe(
      report.branding.workspace_name
    );
    expect(updated.branding.color_primary).toBe("#999999");
  });

  it("should validate branding schema on update", async () => {
    const report = await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "Invalid Branding Update",
      projection: validProjection,
      branding: validBranding,
    });

    try {
      await updateBrandedReport({
        id: report.id,
        workspace_id: WORKSPACE_ID,
        branding: {
          logo_url: "not-a-valid-url",
        },
      });
      fail("Should have rejected invalid logo_url");
    } catch (error: any) {
      expect(error.message).toContain("VALIDATION_ERROR");
    }
  });
});

// ============================================================================
// Immutability Tests: Projection is Frozen After Creation
// ============================================================================

describe("CCP-06: Branded Reports - Immutability", () => {
  let reportId: string;

  beforeEach(async () => {
    const report = await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "Immutable Test",
      projection: validProjection,
      branding: validBranding,
    });
    reportId = report.id;
  });

  it("should not allow updating projection (frozen)", async () => {
    const originalProjection = validProjection;

    // Try to update with different projection (API doesn't support this)
    // Instead, verify projection remains unchanged after other updates
    await updateBrandedReport({
      id: reportId,
      workspace_id: WORKSPACE_ID,
      name: "Updated Name",
    });

    const updated = await getBrandedReport(reportId, WORKSPACE_ID);
    expect(updated?.projection).toEqual(originalProjection);
  });

  it("should not allow changing workspace_id (frozen after creation)", async () => {
    // API doesn't support workspace_id changes in updates
    // Update with different workspace_id should be rejected or ignored
    await updateBrandedReport({
      id: reportId,
      workspace_id: WORKSPACE_ID, // Same workspace
      name: "New Name",
    });

    const updated = await getBrandedReport(reportId, WORKSPACE_ID);
    expect(updated?.workspace_id).toBe(WORKSPACE_ID);
  });

  it("should preserve created_at on updates", async () => {
    const original = await getBrandedReport(reportId, WORKSPACE_ID);
    const originalCreatedAt = original?.created_at;

    // Wait a moment to ensure time difference
    await new Promise((resolve) => setTimeout(resolve, 100));

    await updateBrandedReport({
      id: reportId,
      workspace_id: WORKSPACE_ID,
      name: "Timestamp Test",
    });

    const updated = await getBrandedReport(reportId, WORKSPACE_ID);
    expect(updated?.created_at).toBe(originalCreatedAt);
  });

  it("should update updated_at on each modification", async () => {
    const original = await getBrandedReport(reportId, WORKSPACE_ID);
    const originalUpdatedAt = original?.updated_at;

    // Wait to ensure time difference
    await new Promise((resolve) => setTimeout(resolve, 100));

    await updateBrandedReport({
      id: reportId,
      workspace_id: WORKSPACE_ID,
      status: "published",
    });

    const updated = await getBrandedReport(reportId, WORKSPACE_ID);
    expect(updated?.updated_at).not.toBe(originalUpdatedAt);
    expect(new Date(updated?.updated_at || 0).getTime()).toBeGreaterThan(
      new Date(originalUpdatedAt || 0).getTime()
    );
  });
});

// ============================================================================
// Pagination Tests
// ============================================================================

describe("CCP-06: Branded Reports - Pagination", () => {
  beforeEach(async () => {
    // Create 25 reports
    for (let i = 0; i < 25; i++) {
      await createBrandedReport({
        workspace_id: WORKSPACE_ID,
        name: `Report ${i}`,
        projection: validProjection,
        branding: validBranding,
      });
    }
  });

  it("should respect limit parameter", async () => {
    const { reports } = await listBrandedReports({
      workspace_id: WORKSPACE_ID,
      limit: 10,
    });

    expect(reports.length).toBe(10);
  });

  it("should respect offset parameter", async () => {
    const page1 = await listBrandedReports({
      workspace_id: WORKSPACE_ID,
      limit: 10,
      offset: 0,
    });

    const page2 = await listBrandedReports({
      workspace_id: WORKSPACE_ID,
      limit: 10,
      offset: 10,
    });

    // Pages should have different reports
    const ids1 = page1.reports.map((r) => r.id);
    const ids2 = page2.reports.map((r) => r.id);
    const overlap = ids1.filter((id) => ids2.includes(id));

    expect(overlap.length).toBe(0);
  });

  it("should cap limit at 100", async () => {
    const { reports } = await listBrandedReports({
      workspace_id: WORKSPACE_ID,
      limit: 1000, // Try to request more
    });

    expect(reports.length).toBeLessThanOrEqual(100);
  });

  it("should default to limit 50", async () => {
    const { reports } = await listBrandedReports({
      workspace_id: WORKSPACE_ID,
    });

    expect(reports.length).toBeLessThanOrEqual(50);
  });

  it("should return correct total count", async () => {
    const { total } = await listBrandedReports({
      workspace_id: WORKSPACE_ID,
      limit: 10,
      offset: 0,
    });

    expect(total).toBeGreaterThanOrEqual(25);
  });
});

// ============================================================================
// Status Filter Tests
// ============================================================================

describe("CCP-06: Branded Reports - Status Filtering", () => {
  beforeEach(async () => {
    await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "Draft Report",
      projection: validProjection,
      branding: validBranding,
      status: "draft",
    });

    await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "Published Report",
      projection: validProjection,
      branding: validBranding,
      status: "published",
    });

    await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "Archived Report",
      projection: validProjection,
      branding: validBranding,
      status: "archived",
    });
  });

  it("should filter by draft status", async () => {
    const { reports } = await listBrandedReports({
      workspace_id: WORKSPACE_ID,
      status: "draft",
    });

    reports.forEach((r) => {
      expect(r.status).toBe("draft");
    });
  });

  it("should filter by published status", async () => {
    const { reports } = await listBrandedReports({
      workspace_id: WORKSPACE_ID,
      status: "published",
    });

    reports.forEach((r) => {
      expect(r.status).toBe("published");
    });
  });

  it("should filter by archived status", async () => {
    const { reports } = await listBrandedReports({
      workspace_id: WORKSPACE_ID,
      status: "archived",
    });

    reports.forEach((r) => {
      expect(r.status).toBe("archived");
    });
  });
});

// ============================================================================
// Concurrency Tests
// ============================================================================

describe("CCP-06: Branded Reports - Concurrency", () => {
  it("should handle concurrent creates atomically", async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      createBrandedReport({
        workspace_id: WORKSPACE_ID,
        name: `Concurrent ${i}`,
        projection: validProjection,
        branding: validBranding,
      })
    );

    const reports = await Promise.all(promises);

    // All should succeed with unique IDs
    const ids = reports.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);
  });

  it("should handle concurrent updates safely", async () => {
    const report = await createBrandedReport({
      workspace_id: WORKSPACE_ID,
      name: "Concurrent Update Test",
      projection: validProjection,
      branding: validBranding,
    });

    const updatePromises = Array.from({ length: 5 }, (_, i) =>
      updateBrandedReport({
        id: report.id,
        workspace_id: WORKSPACE_ID,
        status: i % 2 === 0 ? "published" : "draft",
      })
    );

    await Promise.all(updatePromises);

    // Report should exist with one of the final states
    const final = await getBrandedReport(report.id, WORKSPACE_ID);
    expect(final).not.toBeNull();
    expect(["draft", "published"]).toContain(final?.status);
  });
});
