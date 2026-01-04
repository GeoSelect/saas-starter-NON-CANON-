import { ReportBranding } from './report.schema';

// ============================================================================
// CCP-06: Branding Cascade Resolver
// Placeholder for CCP-07 UI branding customization
// ============================================================================

/**
 * Resolve workspace branding for reports
 * 
 * Currently returns minimal branding (workspace_name only).
 * Future (CCP-07): Fetch color_primary, logo_url, fonts from workspace metadata UI.
 * 
 * @param workspace - Workspace record from DB
 * @returns ReportBranding with workspace context
 */
export function resolveBrandingFromWorkspace(workspace: any): ReportBranding {
  // TODO (CCP-07): Parse workspace.metadata for custom branding
  // const customBranding = workspace.metadata?.branding ?? {};

  return {
    workspace_name: workspace.name,
    // color_primary: customBranding.color_primary,
    // logo_url: customBranding.logo_url,
    // font_family: customBranding.font_family,
    // font_sizes: customBranding.font_sizes,
  };
}

/**
 * Validate branding metadata (when set via workspace settings)
 * 
 * Used by CCP-07 to ensure branding updates are valid.
 * 
 * @param branding - Branding object to validate
 * @returns true if valid, throws on invalid
 */
export function validateBranding(branding: any): boolean {
  // TODO (CCP-07): Add validation for colors, URLs, font families
  // if (branding.color_primary && !isValidColor(branding.color_primary)) {
  //   throw new Error('Invalid color_primary');
  // }
  // if (branding.logo_url && !isValidURL(branding.logo_url)) {
  //   throw new Error('Invalid logo_url');
  // }
  return true;
}

/**
 * Merge workspace branding with report-level overrides
 * 
 * Used when reports support custom branding overrides (future enhancement).
 * 
 * @param workspaceBranding - Base branding from workspace
 * @param reportOverrides - Report-specific overrides (optional)
 * @returns Merged branding
 */
export function mergeBrandingOverrides(
  workspaceBranding: ReportBranding,
  reportOverrides?: Partial<ReportBranding>
): ReportBranding {
  return {
    ...workspaceBranding,
    ...reportOverrides,
  };
}
