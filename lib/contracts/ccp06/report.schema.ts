import { z } from 'zod';

// ============================================================================
// CCP-06: Report Schema (Frozen v"rpt-0.1")
// ============================================================================

/**
 * Frozen Report Schema v"rpt-0.1"
 * 
 * Immutable structure. Any changes require new version (rpt-0.2, etc).
 * Projection converts parcel context -> report context.
 */

export const ReportProjectionSchema = z.object({
  parcel_id: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  intent: z.string(),
});

export type ReportProjection = z.infer<typeof ReportProjectionSchema>;

export const ReportBrandingSchema = z.object({
  workspace_name: z.string(),
  color_primary: z.string().optional(),
  logo_url: z.string().url().optional(),
  // Future: font_family, font_sizes, custom_css (CCP-07)
});

export type ReportBranding = z.infer<typeof ReportBrandingSchema>;

export const ReportStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ReportStatus = z.infer<typeof ReportStatusSchema>;

export const ReportSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  status: ReportStatusSchema,
  projection: ReportProjectionSchema,
  branding: ReportBrandingSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Report = z.infer<typeof ReportSchema>;

/**
 * Helper: Create default branding from workspace
 * 
 * @param workspace_name - Name of the workspace
 * @returns ReportBranding with workspace_name set, others optional
 */
export function createDefaultBranding(workspace_name: string): ReportBranding {
  return {
    workspace_name,
    // color_primary, logo_url resolved from workspace metadata (CCP-07)
  };
}

/**
 * Helper: Create report skeleton with frozen projection
 * 
 * @param projection - Parcel context projection
 * @param branding - Workspace branding cascade
 * @param name - Report name (optional, will be auto-generated if omitted)
 * @returns Partial report ready for DB insert
 */
export function createReportSkeleton(
  projection: ReportProjection,
  branding: ReportBranding,
  name?: string
): Omit<Report, 'id' | 'created_at' | 'updated_at'> {
  return {
    workspace_id: '', // Will be set by route handler
    name: name || `Report ${new Date().toISOString()}`,
    status: 'draft',
    projection,
    branding,
  };
}
