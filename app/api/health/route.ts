/**
 * Health Endpoint - GET /api/health
 * 
 * Returns comprehensive health status of all system components.
 * Kubernetes-compatible response format.
 * 
 * Responses:
 * - 200 OK: System is healthy
 * - 503 Service Unavailable: System is degraded or unhealthy
 */

import { NextRequest, NextResponse } from 'next/server';
import { HealthChecker } from '@/src/health';

// Instantiate health checker (singleton-like)
const healthChecker = new HealthChecker();

export async function GET(request: NextRequest) {
  try {
    const health = await healthChecker.getHealth();
    
    // Return 503 if unhealthy or degraded in production
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    // Log error internally for debugging, but don't expose details in response
    console.error('[Health Check] Fatal error:', error);
    
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
