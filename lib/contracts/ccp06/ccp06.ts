import { ReportProjection, ReportBranding, Report } from './report.schema';

// ============================================================================
// CCP-06: Request/Response Parsing Helpers
// ============================================================================

/**
 * Parse create report request body into validated projection + branding
 * 
 * @param parcelContext - Raw parcel context from request
 * @param workspaceBranding - Branding cascade from workspace metadata
 * @returns Validated ReportProjection + ReportBranding
 */
export function parseCreateReportRequest(
  parcelContext: any,
  workspaceBranding: any
): { projection: ReportProjection; branding: ReportBranding } {
  const projection: ReportProjection = {
    parcel_id: parcelContext.parcel_id,
    location: {
      lat: parcelContext.lat,
      lng: parcelContext.lng,
    },
    intent: parcelContext.intent,
  };

  const branding: ReportBranding = {
    workspace_name: workspaceBranding.workspace_name,
    color_primary: workspaceBranding.color_primary,
    logo_url: workspaceBranding.logo_url,
  };

  return { projection, branding };
}

/**
 * Format report for API response
 * 
 * @param report - Report from DB (may have JSON string fields)
 * @returns Formatted report with parsed JSON fields
 */
export function formatReportForResponse(report: any): Report {
  return {
    id: report.id,
    workspace_id: report.workspace_id,
    name: report.name,
    status: report.status,
    projection:
      typeof report.projection === 'string'
        ? JSON.parse(report.projection)
        : report.projection,
    branding:
      typeof report.branding === 'string'
        ? JSON.parse(report.branding)
        : report.branding,
    created_at: report.created_at,
    updated_at: report.updated_at,
  };
}

/**
 * Extract projection from report (for nested responses)
 * 
 * @param report - Full report
 * @returns Minimal report list item
 */
export function reportListItem(report: Report) {
  return {
    id: report.id,
    workspace_id: report.workspace_id,
    name: report.name,
    status: report.status,
    created_at: report.created_at,
    updated_at: report.updated_at,
  };
}
