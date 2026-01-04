#!/usr/bin/env node
/**
 * Logger - Minimal observability infrastructure for GeoSelect
 * 
 * Usage:
 *   import { logger } from '@/lib/observability/logger';
 *   logger.info('operation_name', { userId: 1, teamId: 1, duration: 234 });
 *   logger.error('operation_name', error, { context: 'report-create' });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
  timestamp?: string;
  duration?: number;
  userId?: number | string;
  teamId?: number | string;
  reportId?: string;
  environment?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(level: LogLevel, operation: string, context: LogContext, error?: Error) {
    const timestamp = new Date().toISOString();
    const env = process.env.NODE_ENV || 'unknown';
    
    return {
      timestamp,
      level,
      operation,
      environment: env,
      ...context,
      ...(error && {
        error: {
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
          code: (error as any).code,
        },
      }),
    };
  }

  debug(operation: string, context: LogContext = {}) {
    if (this.isDevelopment) {
      const log = this.formatLog('debug', operation, context);
      console.log('[DEBUG]', JSON.stringify(log));
    }
  }

  info(operation: string, context: LogContext = {}) {
    const log = this.formatLog('info', operation, context);
    console.log('[INFO]', JSON.stringify(log));
  }

  warn(operation: string, context: LogContext = {}) {
    const log = this.formatLog('warn', operation, context);
    console.warn('[WARN]', JSON.stringify(log));
  }

  error(operation: string, error: Error | unknown, context: LogContext = {}) {
    const err = error instanceof Error ? error : new Error(String(error));
    const log = this.formatLog('error', operation, context, err);
    console.error('[ERROR]', JSON.stringify(log));
    
    // In production, send critical errors to monitoring service
    if (!this.isDevelopment) {
      this.sendToMonitoring(log);
    }
  }

  private sendToMonitoring(log: any) {
    // TODO: Integrate with error tracking service (e.g., Sentry, LogRocket, etc.)
    // For now, this is a placeholder for future integration
  }
}

export const logger = new Logger();
