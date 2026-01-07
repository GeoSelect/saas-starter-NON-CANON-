/**
 * Share Links Type Definitions
 * Types for secure report sharing functionality
 */

export interface ShareLink {
  id: string;
  workspace_id: string;
  report_id: string;
  snapshot_id: string;
  creator_id: string;
  token: string; // 32-byte base64 secure token
  short_code: string; // 8-char alphanumeric short code (URL-friendly)
  created_at: string; // ISO 8601 timestamp
  expires_at: string | null;
  max_views: number | null;
  view_count: number;
  is_revoked: boolean;
  allows_unauthenticated: boolean;
  allows_downloads: boolean;
  metadata?: Record<string, any>;
}

export interface ShareLinkView {
  id: string;
  share_link_id: string;
  viewer_user_id?: string; // null if unauthenticated
  ip_address?: string;
  user_agent?: string;
  viewed_at: string;
  referrer?: string;
}

export interface CreateShareLinkRequest {
  reportId: string;
  snapshotId?: string; // Uses latest if not provided
  expiresAt?: string | null; // ISO 8601 timestamp
  maxViews?: number | null;
  allowsUnauthenticated?: boolean; // Default: true
  allowsDownloads?: boolean; // Default: false
  metadata?: Record<string, any>;
}

export interface CreateShareLinkResponse {
  ok: boolean;
  share_link?: ShareLink;
  error?: string;
}

export interface ListShareLinksRequest {
  reportId?: string;
  workspaceId?: string;
  includeRevoked?: boolean; // Default: false
  limit?: number;
  offset?: number;
}

export interface ListShareLinksResponse {
  ok: boolean;
  share_links?: ShareLink[];
  total?: number;
  error?: string;
}

export interface AccessShareLinkRequest {
  token: string;
  shortCode?: boolean; // If true, token is a short code instead of full token
}

export interface AccessShareLinkResponse {
  ok: boolean;
  share_link?: ShareLink;
  snapshot?: {
    id: string;
    report_id: string;
    data: Record<string, any>;
    created_at: string;
  };
  report?: {
    id: string;
    workspace_id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
  };
  error?: string;
  reason?: 'not_found' | 'expired' | 'revoked' | 'max_views_reached' | 'auth_required';
}

export interface RevokeShareLinkRequest {
  linkId: string;
}

export interface RevokeShareLinkResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

export interface ValidateShareLinkResult {
  valid: boolean;
  reason?: 'not_found' | 'expired' | 'revoked' | 'max_views_reached' | 'auth_required';
}

export interface ShareLinkConfig {
  // Default expiration for new share links (days, null = never)
  defaultExpirationDays: number | null;

  // Default max views for new share links (null = unlimited)
  defaultMaxViews: number | null;

  // Allow unauthenticated access by default
  defaultAllowsUnauthenticated: boolean;

  // Allow downloading/exporting by default
  defaultAllowsDownloads: boolean;

  // Maximum possible expiration (days, null = no limit)
  maxExpirationDays: number | null;

  // Track detailed view analytics
  trackViewAnalytics: boolean;

  // Automatically delete expired links after retention period (days, null = never)
  expiredLinkRetentionDays: number | null;

  // Rate limiting for accessing share links (requests per minute)
  accessRateLimit: number;

  // Require authentication for accessing certain report types
  requireAuthForSensitiveData: boolean;
}

// Database schema hints (for reference)
export interface ShareLinksTable {
  id: string;
  workspace_id: string;
  report_id: string;
  snapshot_id: string;
  creator_id: string;
  token: string;
  short_code: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  max_views: number | null;
  view_count: number;
  is_revoked: boolean;
  revoked_at: string | null;
  allows_unauthenticated: boolean;
  allows_downloads: boolean;
  metadata: Record<string, any>;
}

export interface ShareLinkViewsTable {
  id: string;
  share_link_id: string;
  viewer_user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  viewed_at: string;
  referrer: string | null;
}
