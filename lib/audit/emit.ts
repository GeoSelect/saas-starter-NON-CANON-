/**
 * Audit Event Emission Helper
 * 
 * Provides reusable functions to emit success-only audit events.
 * Used by all endpoints to track successful operations.
 */

export interface AuditEventPayload {
  event_type: string;
  account_id: string;
  workspace_id: string;
  resource_type: string;
  action: string;
  resource_id?: string;
  details?: Record<string, any>;
  timestamp?: string;
}

/**
 * Emit an audit event (success-only)
 * 
 * In production, this would write to an audit table or event stream.
 * For testing, it appends to globalThis.__AUDIT_EVENTS array.
 * 
 * @param event - Audit event payload
 */
export function emitAuditEvent(event: AuditEventPayload): void {
  const timestamp = event.timestamp || new Date().toISOString();

  const auditEvent = {
    ...event,
    timestamp,
  };

  // In test environment, append to global array
  if (typeof globalThis !== 'undefined') {
    if (!globalThis.__AUDIT_EVENTS) {
      globalThis.__AUDIT_EVENTS = [];
    }
    globalThis.__AUDIT_EVENTS.push(auditEvent);
  }

  // In production, you would:
  // - Write to database audit table
  // - Send to event stream (Kafka, etc.)
  // - Log to centralized logging service

  console.log('[AUDIT]', event.event_type, {
    account: event.account_id,
    workspace: event.workspace_id,
    resource: event.resource_id,
  });
}

/**
 * Emit report.created event
 */
export function auditReportCreated(
  accountId: string,
  workspaceId: string,
  reportId: string,
  reportName: string
): void {
  emitAuditEvent({
    event_type: 'report.created',
    account_id: accountId,
    workspace_id: workspaceId,
    resource_type: 'report',
    action: 'create',
    resource_id: reportId,
    details: { report_name: reportName },
  });
}

/**
 * Emit reports.listed event
 */
export function auditReportsListed(
  accountId: string,
  workspaceId: string,
  count: number
): void {
  emitAuditEvent({
    event_type: 'reports.listed',
    account_id: accountId,
    workspace_id: workspaceId,
    resource_type: 'reports',
    action: 'list',
    details: { count },
  });
}

/**
 * Emit report.retrieved event
 */
export function auditReportRetrieved(
  accountId: string,
  workspaceId: string,
  reportId: string
): void {
  emitAuditEvent({
    event_type: 'report.retrieved',
    account_id: accountId,
    workspace_id: workspaceId,
    resource_type: 'report',
    action: 'retrieve',
    resource_id: reportId,
  });
}
