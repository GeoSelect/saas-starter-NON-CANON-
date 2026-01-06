import { NextRequest, NextResponse } from 'next/server';
import {
  getShareLinkByToken,
  validateShareLink,
  trackShareLinkView,
  revokeShareLink,
} from '@/lib/db/helpers/share-links';
import { supabaseRoute } from '@/lib/supabase/server';

/**
 * GET /api/share-links/[token]
 * Access a shared report via secure token (public endpoint)
 *
 * Path params:
 * - token: Share link token (secure base64 token)
 *
 * Response includes:
 * - shareLink: Link metadata (with view count)
 * - snapshot: Report snapshot data
 *
 * Responses:
 * 200: Share link is valid, snapshot data returned
 * 400: Invalid token format
 * 401: Authentication required
 * 403: Access denied
 * 404: Share link not found
 * 410: Link expired, revoked, or max views reached
 * 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await supabaseRoute();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const validation = await validateShareLink(params.token, user?.id);

    if (!validation.valid) {
      const statusMap: Record<string, number> = {
        not_found: 404,
        expired: 410,
        revoked: 410,
        max_views_reached: 410,
        auth_required: 401,
      };

      return NextResponse.json(
        { error: validation.reason },
        { status: statusMap[validation.reason || 'not_found'] || 400 }
      );
    }

    // Track view
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    await trackShareLinkView(
      validation.shareLink!.id,
      user?.id,
      ipAddress || undefined,
      userAgent || undefined
    );

    return NextResponse.json({ share_link: validation.shareLink });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
