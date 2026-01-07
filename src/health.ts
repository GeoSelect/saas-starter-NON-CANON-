/**
 * Health Check Endpoint
 * 
 * Provides system health status for monitoring and liveness checks
 * Integrates with docker health checks and kubernetes probes
 */

import { Request, Response } from 'express';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'connected' | 'disconnected';
      latency?: number;
      error?: string;
    };
    secrets: {
      status: 'accessible' | 'inaccessible';
      backend: 'aws-secrets' | 'unknown';
      error?: string;
    };
    memory: {
      status: 'healthy' | 'warning' | 'critical';
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    audit: {
      status: 'operational' | 'degraded' | 'offline';
      eventsProcessed: number;
      error?: string;
    };
  };
  version: string;
  environment: 'local' | 'staging' | 'production';
}

class HealthChecker {
  private startTime: number = Date.now();

  async checkDatabase(): Promise<HealthStatus['checks']['database']> {
    try {
      const start = Date.now();
      
      // TODO: Implement actual database connection check
      // const result = await db.query('SELECT 1');
      
      const latency = Date.now() - start;
      
      return {
        status: 'connected',
        latency,
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async checkSecrets(): Promise<HealthStatus['checks']['secrets']> {
    try {
      // Check if secrets backend is accessible
      const backend = process.env.SECRETS_BACKEND || 'aws-secrets';

      switch (backend) {
        case 'aws-secrets':
          // TODO: Implement AWS Secrets Manager availability check
          // const secretsClient = new SecretsManagerClient({...});
          // await secretsClient.send(new DescribeSecretCommand({...}));
          return { status: 'accessible', backend: 'aws-secrets' };

        default:
          return { status: 'inaccessible', backend: 'unknown' };
      }
    } catch (error) {
      return {
        status: 'inaccessible',
        backend: 'aws-secrets',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  checkMemory(): HealthStatus['checks']['memory'] {
    const memUsage = process.memoryUsage();
    
    // Warning at 80%, critical at 95%
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (heapUsagePercent > 95) {
      status = 'critical';
    } else if (heapUsagePercent > 80) {
      status = 'warning';
    }

    return {
      status,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
    };
  }

  async checkAudit(): Promise<HealthStatus['checks']['audit']> {
    try {
      // TODO: Implement audit system health check
      // const auditCount = await db.query('SELECT COUNT(*) FROM audit_events');
      
      return {
        status: 'operational',
        eventsProcessed: 0, // TODO: get from database
      };
    } catch (error) {
      return {
        status: 'offline',
        eventsProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getHealth(): Promise<HealthStatus> {
    const [database, secrets, audit] = await Promise.all([
      this.checkDatabase(),
      this.checkSecrets(),
      this.checkAudit(),
    ]);

    const memory = this.checkMemory();
    const uptime = Date.now() - this.startTime;

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (database.status === 'disconnected' || secrets.status === 'inaccessible') {
      overallStatus = 'unhealthy';
    } else if (memory.status === 'critical' || audit.status === 'degraded') {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      checks: {
        database,
        secrets,
        memory,
        audit,
      },
      version: process.env.APP_VERSION || '1.0.0',
      environment: (process.env.NODE_ENV as any) || 'local',
    };
  }
}

// Express endpoint handler
export async function healthHandler(req: Request, res: Response) {
  const checker = new HealthChecker();
  const health = await checker.getHealth();

  // Return appropriate HTTP status code
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 503 : 503;

  res.status(statusCode).json(health);
}

// Kubernetes-style liveness probe (simple, fast)
export async function livenessHandler(req: Request, res: Response) {
  // Simple check: if the app is running, it's alive
  res.status(200).json({ status: 'alive' });
}

// Kubernetes-style readiness probe (full checks)
export async function readinessHandler(req: Request, res: Response) {
  const checker = new HealthChecker();
  const health = await checker.getHealth();

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}

export default HealthChecker;
