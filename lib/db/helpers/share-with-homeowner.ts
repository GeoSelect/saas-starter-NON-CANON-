import { createClient } from '@/lib/supabase/server';
import { createShareLink } from '@/lib/db/helpers/share-links';
import { createEventAssociation } from '@/lib/db/helpers/event-associations';
import { sendShareNotification } from '@/lib/db/helpers/share-links';
import { createGovernanceWarning } from '@/lib/db/helpers/event-associations';

export interface ShareWithHomeownerParams {
  workspaceId: string;
  snapshotId: string;
  sharerUserId: string;
  homeownerContactId: string;
  homeownerEmail: string;
  homeownerName?: string;
  accessRole?: 'viewer' | 'commenter' | 'editor';
  expiresInDays?: number;
  shareReason?: string;
  sendNotification?: boolean;
  acknowledgedWarning?: boolean;
  customMessage?: string;
}

export interface ShareWithHomeownerResult {
  shareLink: {
    id: string;
    token: string;
    short_code: string;
    expires_at: string;
  };
  association: {
    id: string;
    assigned_role_id: string;
    relationship_status: string;
  };
  shareUrl: string;
  shortUrl: string;
  notificationSent: boolean;
}

export async function shareWithHomeowner(
  params: ShareWithHomeownerParams
): Promise<ShareWithHomeownerResult> {
  const supabase = await createClient();

  // Default values for homeowner shares
  const accessRole = params.accessRole || 'viewer';
  const expiresInDays = params.expiresInDays || 30; // Longer default for homeowners
  const requiresAuth = false; // Homeowners don't have accounts

  // Step 1: Create governance warning record
  if (params.acknowledgedWarning) {
    await createGovernanceWarning(
      params.sharerUserId,
      'external_recipient',
      params.workspaceId,
      {
        recipient_email: params.homeownerEmail,
        snapshot_id: params.snapshotId,
      }
    );
  }

  // Step 2: Create share link (CCP-11)
  const shareLink = await createShareLink({
    workspaceId: params.workspaceId,
    snapshotId: params.snapshotId,
    createdBy: params.sharerUserId,
    recipientContactId: params.homeownerContactId,
    recipientEmail: params.homeownerEmail,
    accessRole,
    requiresAuth,
    expiresInDays,
    metadata: {
      share_type: 'homeowner',
      share_reason: params.shareReason,
    },
  });

  // Step 3: Create event association (CCP-12)
  const association = await createEventAssociation({
    shareLinkId: shareLink.id,
    workspaceId: params.workspaceId,
    snapshotId: params.snapshotId,
    sharerUserId: params.sharerUserId,
    recipientContactId: params.homeownerContactId,
    roleName: accessRole,
    associationType: 'direct_share',
    shareReason: params.shareReason,
    acknowledgedWarning: params.acknowledgedWarning,
    metadata: {
      recipient_type: 'homeowner',
      homeowner_email: params.homeownerEmail,
    },
  });

  // Step 4: Send notification (optional)
  let notificationSent = false;
  if (params.sendNotification && params.homeownerEmail) {
    try {
      await sendShareNotification(
        shareLink.id,
        params.homeownerEmail,
        params.homeownerName,
        params.customMessage
      );
      notificationSent = true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't fail the entire operation if notification fails
    }
  }

  // Step 5: Generate URLs
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = `${baseUrl}/shared/${shareLink.token}`;
  const shortUrl = shareLink.short_code
    ? `${baseUrl}/s/${shareLink.short_code}`
    : shareUrl;

  return {
    shareLink: {
      id: shareLink.id,
      token: shareLink.token,
      short_code: shareLink.short_code || '',
      expires_at: shareLink.expires_at,
    },
    association: {
      id: association.id,
      assigned_role_id: association.assigned_role_id,
      relationship_status: association.relationship_status,
    },
    shareUrl,
    shortUrl,
    notificationSent,
  };
}

/**
 * Bulk share with multiple homeowners
 */
export async function shareWithMultipleHomeowners(
  params: Omit<ShareWithHomeownerParams, 'homeownerContactId' | 'homeownerEmail' | 'homeownerName'> & {
    homeowners: Array<{
      contactId: string;
      email: string;
      name?: string;
    }>;
  }
): Promise<ShareWithHomeownerResult[]> {
  const results: ShareWithHomeownerResult[] = [];

  for (const homeowner of params.homeowners) {
    try {
      const result = await shareWithHomeowner({
        ...params,
        homeownerContactId: homeowner.contactId,
        homeownerEmail: homeowner.email,
        homeownerName: homeowner.name,
      });
      results.push(result);
    } catch (error) {
      console.error(`Failed to share with ${homeowner.email}:`, error);
      // Continue with other homeowners even if one fails
    }
  }

  return results;
}

/**
 * Get all shares for a specific homeowner
 */
export async function getHomeownerShares(homeownerContactId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_associations')
    .select(`
      *,
      share_links (*),
      report_snapshots (*),
      roles (*)
    `)
    .eq('recipient_contact_id', homeownerContactId)
    .eq('association_type', 'direct_share')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
