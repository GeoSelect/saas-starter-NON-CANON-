import { NextRequest, NextResponse } from 'next/server';
import { createShareLink } from '@/lib/db/helpers/share-links';
import { supabaseRoute } from '@/lib/supabase/server';
import { getEntitlementStatus } from '@/lib/services/entitlements';
import { logShareLinkCreated } from '@/lib/helpers/activity-logger';

/**
 * POST /api/share-links/create
 * Create a new share link with CCP-10 entitlement enforcement
 *
 * This endpoint enforces Portfolio plan requirement for advanced collaboration features
 * 
 * Request body:
 * {
 *   snapshot_id: string (required)
 *   workspace_id: string (required)
 *   expires_at?: string (ISO 8601 timestamp)
 *   max_views?: number
 *   requires_auth?: boolean
 *   recipient_email?: string
 *   recipient_contact_id?: string
 *   access_role?: 'viewer' | 'commenter' | 'editor'
 *   metadata?: object
 * }
 *
 * Responses:
 * 200: Share link created successfully
 * 400: Invalid input
 * 401: Unauthorized
 * 402: Payment required (entitlement insufficient)
 * 403: Forbidden (workspace access denied)
 * 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await supabaseRoute();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      snapshot_id,
      workspace_id,
      expires_at,
      max_views,
      requires_auth,
      recipient_email,
      recipient_contact_id,
      access_role,
      metadata,
    } = body;

    if (!snapshot_id || !workspace_id) {
      return NextResponse.json(
        { error: 'snapshot_id and workspace_id are required' },
        { status: 400 }
      );
    }

    // 3. Verify workspace access
    const { data: access } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!access) {
      return NextResponse.json(
        { error: 'Forbidden: Not a member of this workspace' },
        { status: 403 }
      );
    }

    // 4. Check CCP-10 entitlement (Portfolio plan required)
    const entitlement = await getEntitlementStatus(
      workspace_id,
      'ccp-10:collaboration',
      user.id
    );

    if (!entitlement.enabled) {
      // Return 402 Payment Required with upgrade information
      return NextResponse.json(
        {
          error: 'Upgrade required',
          message: 'Advanced collaboration features require the Portfolio plan',
          feature: 'ccp-10:collaboration',
          reason: entitlement.reason,
          current_tier: entitlement.tier,
          required_tier: 'portfolio',
          upgrade_url: '/pricing',
          details: {
            available_in: 'Portfolio Plan',
            price: '$199/month',
            benefits: [
              'Role-based share links (viewer/commenter/editor)',
              'Time-limited links with expiration',
              'Recipient tracking and analytics',
              'Complete audit trails',
              'Unlimited share links',
            ],
          },
        },
        { status: 402 }
      );
    }

    // 5. Create share link (entitlement granted)
    const shareLink = await createShareLink(
      snapshot_id,
      workspace_id,
      user.id,
      {
        expiresAt: expires_at ? new Date(expires_at) : undefined,
        maxViews: max_views,
        requiresAuth: requires_auth,
        recipientEmail: recipient_email,
        recipientContactId: recipient_contact_id,
        accessRole: access_role as 'viewer' | 'commenter' | 'editor',
        metadata,
      }
    );

    // 6. Log activity (best-effort, non-blocking)
    const tokenPrefix = shareLink.token ? shareLink.token.substring(0, 8) : 'unknown';
    logShareLinkCreated(
      user.id,
      workspace_id,
      shareLink.id || 'unknown',
      snapshot_id,
      tokenPrefix,
      expires_at ? new Date(expires_at) : undefined,
      max_views,
      requires_auth
    ).catch((err) => console.error('Activity logging failed:', err));

    // 7. Build share URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${shareLink.token}`;
    const shortUrl = `${baseUrl}/s/${shareLink.short_code}`;

    // 8. Return success response
    return NextResponse.json(
      {
        success: true,
        share_link: {
          id: shareLink.id,
          token: shareLink.token,
          short_code: shareLink.short_code,
          url: shareUrl,
          short_url: shortUrl,
          expires_at: shareLink.expires_at,
          access_role: shareLink.access_role,
          max_views: shareLink.max_views,
          created_at: shareLink.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/share-links/create:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create share link' },
      { status: 500 }
    );
  }
}
