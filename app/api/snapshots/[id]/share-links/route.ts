import { NextRequest, NextResponse } from 'next/server';
import { getSnapshotShareLinks } from '@/lib/db/helpers/share-links';

/**
 * GET /api/snapshots/[id]/share-links
 * List all share links for a specific snapshot
 *
 * Path params:
 * - id: Snapshot ID
 *
 * Responses:
 * 200: Array of share links for the snapshot
 * 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shareLinks = await getSnapshotShareLinks(params.id);
    return NextResponse.json({ share_links: shareLinks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
