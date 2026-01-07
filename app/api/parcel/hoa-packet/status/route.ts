import { NextRequest, NextResponse } from 'next/server';
import { getHoaPacketStatus } from '@/lib/hoa-packet';

/**
 * GET /api/parcel/hoa-packet/status?session_id=cs_test_...
 * 
 * Query authoritative status of HOA packet purchase
 * Source of truth is local DB (not Stripe)
 * Safe to call multiple times (idempotent GET)
 * 
 * Response:
 * {
 *   "state": "created" | "pending_payment" | "paid" | "fulfilled" | "revoked",
 *   "entitled": boolean,
 *   "packet_id": "pkt_123",
 *   "download_url": "/api/parcel/hoa-packet/download?..."
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }

    const status = await getHoaPacketStatus({ session_id: sessionId });

    console.log(
      `[/status] ✓ Query for session ${sessionId}: state=${status.state}, entitled=${status.entitled}`
    );

    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/status] Error:', message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
