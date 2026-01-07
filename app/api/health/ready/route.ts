/**
 * Readiness Probe - GET /api/health/ready
 * 
 * Comprehensive endpoint for Kubernetes readiness probes.
 * Returns 200 only if all dependencies are ready.
 * 
 * Use Case: Kubernetes will remove pod from load balancer if this fails.
 */

import { NextRequest, NextResponse } from 'next/server';
import { HealthChecker } from '@/src/health';

const healthChecker = new HealthChecker();

export async function GET(request: NextRequest) {
  try {
    const health = await healthChecker.getHealth();
    
    // Ready only if all critical checks pass
    const isReady = 
      health.checks.database.status === 'connected' &&
      health.checks.secrets.status === 'accessible' &&
      health.checks.audit.status === 'operational';
    
    const statusCode = isReady ? 200 : 503;
    
    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    // Log internally, don't expose details
    console.error('[Readiness Check] Fatal error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'disconnected' },
          secrets: { status: 'inaccessible', backend: 'unknown' },
          memory: { status: 'critical', heapUsed: 0, heapTotal: 0, external: 0 },
          audit: { status: 'offline', eventsProcessed: 0 },
        },
        version: process.env.APP_VERSION || '1.0.0',
        environment: (process.env.NODE_ENV as any) || 'local',
        uptime: 0,
      },
      { status: 503 }
    );
  }
}
