import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { supabaseRoute } from '@/lib/supabase/server';

/**
 * Share Links Helper Functions
 * CCP-10: Report Sharing - Secure share links with audit trails
 */

/**
 * Generate a cryptographically secure token (32 bytes base64)
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Generate a short code from token (8 chars alphanumeric)
 */
export function generateShortCode(): string {
  return crypto.randomBytes(6).toString('base64url').slice(0, 8).toLowerCase();
}

/**
 * Create a new share link for a snapshot
 */
export async function createShareLink(
  snapshotId: string,
  workspaceId: string,
  createdBy: string,
  options?: {
    expiresAt?: Date;
    maxViews?: number;
    requiresAuth?: boolean;
    recipientEmail?: string;
    recipientContactId?: string;
    accessRole?: 'viewer' | 'commenter' | 'editor';
    metadata?: Record<string, any>;
  }
) {
  const supabase = await supabaseRoute();

  // Generate secure token and short code
  const token = generateToken();
  const shortCode = generateShortCode();

  // Default expiration: 7 days
  const expiresAt = options?.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('share_links')
    .insert({
      id: uuid(),
      workspace_id: workspaceId,
      snapshot_id: snapshotId,
      created_by: createdBy,
      token,
      short_code: shortCode,
      expires_at: expiresAt.toISOString(),
      max_views: options?.maxViews || null,
      requires_auth: options?.requiresAuth || false,
      recipient_email: options?.recipientEmail || null,
      recipient_contact_id: options?.recipientContactId || null,
      access_role: options?.accessRole || 'viewer',
      metadata: options?.metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create share link: ${error.message}`);

  // Create audit event
  await createShareLinkEvent(data.id, 'created', createdBy);

  return data;
}

/**
 * Get share link by token
 */
export async function getShareLinkByToken(token: string) {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('token', token)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch share link: ${error.message}`);
  }

  return data || null;
}

/**
 * Get share link by short code
 */
export async function getShareLinkByShortCode(shortCode: string) {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('short_code', shortCode)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch share link: ${error.message}`);
  }

  return data || null;
}

/**
 * Validate if a share link is accessible
 * Returns { valid: boolean, reason?: string, shareLink?: object }
 */
export async function validateShareLink(
  token: string,
  userId?: string
): Promise<{
  valid: boolean;
  reason?: 'not_found' | 'expired' | 'revoked' | 'max_views_reached' | 'auth_required';
  shareLink?: any;
}> {
  try {
    const shareLink = await getShareLinkByToken(token);

    if (!shareLink) {
      return { valid: false, reason: 'not_found' };
    }

    // Check if revoked
    if (shareLink.revoked_at) {
      return { valid: false, reason: 'revoked' };
    }

    // Check if expired
    if (new Date(shareLink.expires_at) < new Date()) {
      return { valid: false, reason: 'expired' };
    }

    // Check max views
    if (shareLink.max_views && shareLink.view_count >= shareLink.max_views) {
      return { valid: false, reason: 'max_views_reached' };
    }

    // Check authentication requirement
    if (shareLink.requires_auth && !userId) {
      return { valid: false, reason: 'auth_required' };
    }

    return { valid: true, shareLink };
  } catch (error) {
    console.error('Error validating share link:', error);
    return { valid: false, reason: 'not_found' };
  }
}

/**
 * Track a view of a share link
 */
export async function trackShareLinkView(
  shareLinkId: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const supabase = await supabaseRoute();

  try {
    // Increment view count
    const { data: shareLink, error: fetchError } = await supabase
      .from('share_links')
      .select('view_count, first_viewed_at')
      .eq('id', shareLinkId)
      .single();

    if (fetchError) throw new Error(`Failed to fetch share link: ${fetchError.message}`);

    const isFirstView = !shareLink.first_viewed_at;
    const newViewCount = (shareLink.view_count || 0) + 1;

    await supabase
      .from('share_links')
      .update({
        view_count: newViewCount,
        ...(isFirstView && { first_viewed_at: new Date().toISOString() }),
        last_viewed_at: new Date().toISOString(),
      })
      .eq('id', shareLinkId);

    // Create event
    await createShareLinkEvent(
      shareLinkId,
      'viewed',
      userId,
      ipAddress,
      userAgent
    );
  } catch (error) {
    console.error('Error tracking share link view:', error);
    // Don't throw - view tracking shouldn't block access
  }
}

/**
 * Create an audit event for a share link
 */
export async function createShareLinkEvent(
  shareLinkId: string,
  eventType: 'created' | 'viewed' | 'downloaded' | 'revoked' | 'expired' | 'access_denied',
  actorUserId?: string,
  actorIpAddress?: string,
  actorUserAgent?: string,
  metadata?: Record<string, any>
) {
  const supabase = await supabaseRoute();

  try {
    await supabase
      .from('share_link_events')
      .insert({
        id: uuid(),
        share_link_id: shareLinkId,
        event_type: eventType,
        actor_user_id: actorUserId || null,
        actor_ip_address: actorIpAddress || null,
        actor_user_agent: actorUserAgent || null,
        metadata: metadata || {},
      });
  } catch (error) {
    console.error('Error creating share link event:', error);
    // Don't throw - event logging shouldn't block main operations
  }
}

/**
 * Revoke a share link
 */
export async function revokeShareLink(shareLinkId: string, revokedBy: string) {
  const supabase = await supabaseRoute();

  const revokedAt = new Date();

  const { data, error } = await supabase
    .from('share_links')
    .update({
      revoked_at: revokedAt.toISOString(),
      revoked_by: revokedBy,
      updated_at: revokedAt.toISOString(),
    })
    .eq('id', shareLinkId)
    .select()
    .single();

  if (error) throw new Error(`Failed to revoke share link: ${error.message}`);

  // Create audit event
  await createShareLinkEvent(shareLinkId, 'revoked', revokedBy);

  return data;
}

/**
 * List all share links for a snapshot
 */
export async function listShareLinksBySnapshot(
  snapshotId: string,
  includeRevoked = false
) {
  const supabase = await supabaseRoute();

  let query = supabase
    .from('share_links')
    .select('*')
    .eq('snapshot_id', snapshotId);

  if (!includeRevoked) {
    query = query.is('revoked_at', null);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list share links: ${error.message}`);

  return data || [];
}

/**
 * List all share links for a workspace
 */
export async function listShareLinksByWorkspace(
  workspaceId: string,
  includeRevoked = false
) {
  const supabase = await supabaseRoute();

  let query = supabase
    .from('share_links')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (!includeRevoked) {
    query = query.is('revoked_at', null);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list share links: ${error.message}`);

  return data || [];
}

/**
 * Get share link with snapshot and report details
 */
export async function getShareLinkWithDetails(token: string) {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('share_links')
    .select(
      `
      *,
      snapshot:report_snapshots (
        id,
        report_id,
        data,
        created_at
      ),
      report:snapshots->reports (
        id,
        workspace_id,
        name,
        description,
        created_at,
        updated_at
      )
    `
    )
    .eq('token', token)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch share link: ${error.message}`);
  }

  return data || null;
}

/**
 * Update share link settings
 */
export async function updateShareLink(
  shareLinkId: string,
  updates: {
    expiresAt?: Date;
    maxViews?: number;
    metadata?: Record<string, any>;
  }
) {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('share_links')
    .update({
      ...(updates.expiresAt && { expires_at: updates.expiresAt.toISOString() }),
      ...(updates.maxViews !== undefined && { max_views: updates.maxViews }),
      ...(updates.metadata && { metadata: updates.metadata }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', shareLinkId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update share link: ${error.message}`);

  return data;
}

/**
 * Delete expired share links (cleanup)
 */
export async function deleteExpiredShareLinks(retentionDays = 30) {
  const supabase = await supabaseRoute();

  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from('share_links')
    .delete()
    .lt('expires_at', cutoffDate.toISOString())
    .is('revoked_at', null);

  if (error) throw new Error(`Failed to delete expired share links: ${error.message}`);
}

/**
 * Get all events (audit trail) for a share link
 */
export async function getShareLinkEvents(shareLinkId: string) {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('share_link_events')
    .select('*')
    .eq('share_link_id', shareLinkId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch share link events: ${error.message}`);

  return data || [];
}

/**
 * Alias for listShareLinksBySnapshot
 * @deprecated Use listShareLinksBySnapshot instead
 */
export const getSnapshotShareLinks = listShareLinksBySnapshot;
