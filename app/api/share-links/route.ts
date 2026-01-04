import { NextRequest, NextResponse } from 'next/server';
import {
  createShareLink,
  listShareLinksByWorkspace,
  listShareLinksBySnapshot,
} from '@/lib/db/helpers/share-links';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/share-links
 * Create a new share link for a report snapshot
 *
 * Request body:
 * {
 *   snapshot_id: string (required)
 *   workspace_id: string (required)
 *   expires_at?: string (ISO 8601 timestamp, default: 7 days)
 *   max_views?: number
 *   requires_auth?: boolean (default: false)
 *   recipient_email?: string
 *   recipient_contact_id?: string
 *   access_role?: 'viewer' | 'commenter' | 'editor' (default: 'viewer')
 *   metadata?: object
 * }
 *
 * Responses:
 * 201: Share link created
 * 400: Invalid input
 * 401: Unauthorized
 * 403: Not allowed
 * 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Verify user has access to this workspace
    const { data: access } = await supabase
      .from('workspace_users')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!access) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Create share link
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

    return NextResponse.json(
      { share_link: shareLink },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/share-links:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create share link' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/share-links?snapshot_id=... or ?workspace_id=...
 * List share links for a snapshot or workspace
 *
 * Query params:
 * - snapshot_id: Filter by snapshot
 * - workspace_id: Filter by workspace
 * - include_revoked: true to include revoked links (default: false)
 *
 * Responses:
 * 200: Array of share links
 * 401: Unauthorized
 * 400: Missing query params
 * 500: Server error
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const snapshotId = searchParams.get('snapshot_id');
    const workspaceId = searchParams.get('workspace_id');
    const includeRevoked = searchParams.get('include_revoked') === 'true';

    if (!snapshotId && !workspaceId) {
      return NextResponse.json(
        { error: 'snapshot_id or workspace_id query parameter is required' },
        { status: 400 }
      );
    }

    let shareLinks;

    if (snapshotId) {
      shareLinks = await listShareLinksBySnapshot(snapshotId, includeRevoked);
    } else {
      // Verify workspace access
      const { data: access } = await supabase
        .from('workspace_users')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();

      if (!access) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }

      shareLinks = await listShareLinksByWorkspace(workspaceId!, includeRevoked);
    }

    return NextResponse.json({ share_links: shareLinks });
  } catch (error: any) {
    console.error('GET /api/share-links:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch share links' },
      { status: 500 }
    );
  }
}
