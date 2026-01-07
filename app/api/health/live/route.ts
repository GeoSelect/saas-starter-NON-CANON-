/**
 * Liveness Probe - GET /api/health/live
 * 
 * Simple endpoint for Kubernetes liveness probes.
 * Always responds 200 if the process is running.
 * 
 * Use Case: Kubernetes will restart pod if this fails.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { status: 'alive' },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
