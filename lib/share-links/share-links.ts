import { supabaseRoute } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * CCP-10: Report Sharing - Share Links
 * Secure, time-limited access to reports with audit trails
 */

export type AccessRole = 'viewer' | 'commenter' | 'editor';
export type ShareLinkEventType = 'created' | 'viewed' | 'downloaded' | 'revoked' | 'expired' | 'access_denied';

export interface ShareLink {
  id: string;
  token: string;
  short_code?: string;
  workspace_id: string;
  snapshot_id: string;
  created_by: string;
  recipient_contact_id?: string;
  recipient_email?: string;
  access_role: AccessRole;
  requires_auth: boolean;
  expires_at: string;
  revoked_at?: string;
  revoked_by?: string;
  view_count: number;
  first_viewed_at?: string;
  last_viewed_at?: string;
  max_views?: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateShareLinkParams {
  workspaceId: string;
  snapshotId: string;
  createdBy: string;
  recipientContactId?: string;
  recipientEmail?: string;
  accessRole?: AccessRole;
  requiresAuth?: boolean;
  expiresInDays?: number;
  maxViews?: number;
  metadata?: Record<string, any>;
}

export interface ShareLinkEvent {
  id: string;
  share_link_id: string;
  event_type: ShareLinkEventType;
  actor_user_id?: string;
  actor_ip_address?: string;
  actor_user_agent?: string;
  metadata: Record<string, any>;
  created_at: string;
}

// ========================================
// TOKEN GENERATION
// ========================================

function generateSecureToken(): string {
  // 32-byte random token, base64url encoded
  return crypto.randomBytes(32).toString('base64url');
}

function generateShortCode(): string {
  // 8-character alphanumeric short code
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ========================================
// CREATE SHARE LINK
// ========================================

export async function createShareLink(params: CreateShareLinkParams): Promise<ShareLink> {
  const supabase = await supabaseRoute();

  // Generate tokens
  const token = generateSecureToken();
  const shortCode = generateShortCode();

  // Calculate expiration
  const expiresInDays = params.expiresInDays || 7; // Default 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Create share link
  const { data: shareLink, error } = await supabase
    .from('share_links')
    .insert({
      token,
      short_code: shortCode,
      workspace_id: params.workspaceId,
      snapshot_id: params.snapshotId,
      created_by: params.createdBy,
      recipient_contact_id: params.recipientContactId,
      recipient_email: params.recipientEmail,
      access_role: params.accessRole || 'viewer',
      requires_auth: params.requiresAuth || false,
      expires_at: expiresAt.toISOString(),
      max_views: params.maxViews,
      metadata: params.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;

  // Log creation event (CCP-15)
  await logShareLinkEvent({
    shareLinkId: shareLink.id,
    eventType: 'created',
    actorUserId: params.createdBy,
    metadata: {
      recipient_email: params.recipientEmail,
      expires_at: expiresAt.toISOString(),
    },
  });

  // Set default permissions (CCP-12)
  await setDefaultPermissions(shareLink.id, params.accessRole || 'viewer');

  return shareLink as ShareLink;
}

// ========================================
// SET DEFAULT PERMISSIONS (CCP-12)
// ========================================

async function setDefaultPermissions(shareLinkId: string, accessRole: AccessRole) {
  const supabase = await supabaseRoute();

  const permissions = [
    { share_link_id: shareLinkId, permission_type: 'view', granted: true },
  ];

  if (accessRole === 'commenter' || accessRole === 'editor') {
    permissions.push({ share_link_id: shareLinkId, permission_type: 'comment', granted: true });
  }

  if (accessRole === 'editor') {
    permissions.push({ share_link_id: shareLinkId, permission_type: 'download', granted: true });
  }

  const { error } = await supabase
    .from('share_link_permissions')
    .insert(permissions);

  if (error) throw error;
}

// ========================================
// RETRIEVE SHARE LINK
// ========================================

export async function getShareLinkByToken(token: string): Promise<ShareLink | null> {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data) return null;

  return data as ShareLink;
}

export async function getShareLinkByShortCode(shortCode: string): Promise<ShareLink | null> {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('short_code', shortCode)
    .single();

  if (error || !data) return null;

  return data as ShareLink;
}

export async function getWorkspaceShareLinks(workspaceId: string): Promise<ShareLink[]> {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ShareLink[];
}

export async function getSnapshotShareLinks(snapshotId: string): Promise<ShareLink[]> {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('snapshot_id', snapshotId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ShareLink[];
}

// ========================================
// VALIDATE & TRACK ACCESS
// ========================================

export interface ValidateShareLinkResult {
  valid: boolean;
  shareLink?: ShareLink;
  reason?: 'expired' | 'revoked' | 'max_views_reached' | 'not_found' | 'auth_required';
}

export async function validateShareLink(
  token: string,
  userId?: string
): Promise<ValidateShareLinkResult> {
  const shareLink = await getShareLinkByToken(token);

  if (!shareLink) {
    return { valid: false, reason: 'not_found' };
  }

  // Check revocation
  if (shareLink.revoked_at) {
    return { valid: false, shareLink, reason: 'revoked' };
  }

  // Check expiration
  if (new Date(shareLink.expires_at) < new Date()) {
    return { valid: false, shareLink, reason: 'expired' };
  }

  // Check max views
  if (shareLink.max_views && shareLink.view_count >= shareLink.max_views) {
    return { valid: false, shareLink, reason: 'max_views_reached' };
  }

  // Check auth requirement
  if (shareLink.requires_auth && !userId) {
    return { valid: false, shareLink, reason: 'auth_required' };
  }

  return { valid: true, shareLink };
}

export async function trackShareLinkView(
  shareLinkId: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const supabase = await supabaseRoute();

  // Increment view count
  const { data: shareLink } = await supabase
    .from('share_links')
    .select('view_count, first_viewed_at')
    .eq('id', shareLinkId)
    .single();

  const updates: any = {
    view_count: (shareLink?.view_count || 0) + 1,
    last_viewed_at: new Date().toISOString(),
  };

  if (!shareLink?.first_viewed_at) {
    updates.first_viewed_at = new Date().toISOString();
  }

  await supabase
    .from('share_links')
    .update(updates)
    .eq('id', shareLinkId);

  // Log view event (CCP-15)
  await logShareLinkEvent({
    shareLinkId,
    eventType: 'viewed',
    actorUserId: userId,
    actorIpAddress: ipAddress,
    actorUserAgent: userAgent,
  });
}

// ========================================
// REVOKE SHARE LINK
// ========================================

export async function revokeShareLink(shareLinkId: string, revokedBy: string) {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('share_links')
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
    })
    .eq('id', shareLinkId)
    .select()
    .single();

  if (error) throw error;

  // Log revocation event (CCP-15)
  await logShareLinkEvent({
    shareLinkId,
    eventType: 'revoked',
    actorUserId: revokedBy,
  });

  return data as ShareLink;
}

// ========================================
// EVENT LOGGING (CCP-15)
// ========================================

interface LogShareLinkEventParams {
  shareLinkId: string;
  eventType: ShareLinkEventType;
  actorUserId?: string;
  actorIpAddress?: string;
  actorUserAgent?: string;
  metadata?: Record<string, any>;
}

export async function logShareLinkEvent(params: LogShareLinkEventParams) {
  const supabase = await supabaseRoute();

  const { error } = await supabase
    .from('share_link_events')
    .insert({
      share_link_id: params.shareLinkId,
      event_type: params.eventType,
      actor_user_id: params.actorUserId,
      actor_ip_address: params.actorIpAddress,
      actor_user_agent: params.actorUserAgent,
      metadata: params.metadata || {},
    });

  if (error) throw error;
}

export async function getShareLinkEvents(shareLinkId: string): Promise<ShareLinkEvent[]> {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('share_link_events')
    .select('*')
    .eq('share_link_id', shareLinkId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ShareLinkEvent[];
}

// ========================================
// PERMISSIONS (CCP-12)
// ========================================

export async function getShareLinkPermissions(shareLinkId: string) {
  const supabase = await supabaseRoute();

  const { data, error } = await supabase
    .from('share_link_permissions')
    .select('*')
    .eq('share_link_id', shareLinkId);

  if (error) throw error;
  return data;
}

export async function hasPermission(
  shareLinkId: string,
  permissionType: 'view' | 'comment' | 'download' | 'share'
): Promise<boolean> {
  const supabase = await supabaseRoute();

  const { data } = await supabase
    .from('share_link_permissions')
    .select('granted')
    .eq('share_link_id', shareLinkId)
    .eq('permission_type', permissionType)
    .single();

  return data?.granted || false;
}

// ========================================
// NOTIFICATIONS
// ========================================

export async function sendShareNotification(
  shareLinkId: string,
  recipientEmail: string,
  recipientName?: string,
  customMessage?: string
) {
  const supabase = await supabaseRoute();

  const { data: shareLink } = await supabase
    .from('share_links')
    .select('*')
    .eq('id', shareLinkId)
    .single();

  if (!shareLink) throw new Error('Share link not found');

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shared/${shareLink.token}`;

  const subject = `${recipientName || 'You'} have been shared a Parcel Report`;
  const body = `
${customMessage || 'A parcel report has been shared with you.'}

View the report: ${shareUrl}

This link expires on ${new Date(shareLink.expires_at).toLocaleDateString()}.
  `;

  const { error } = await supabase
    .from('share_notifications')
    .insert({
      share_link_id: shareLinkId,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject,
      body,
      status: 'pending',
    });

  if (error) throw error;

  // TODO: Integrate with email service (SendGrid, Resend, etc.)

  return { success: true };
}
