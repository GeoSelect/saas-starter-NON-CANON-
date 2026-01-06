/**
 * Server-side audit event emitter for user actions.
 *
 * Responsibilities:
 * - Emit structured events to audit_events table
 * - Include context: userId, workspaceId, timestamp, IP, user agent
 * - Non-blocking (failures don't break page render)
 * - Privacy-conscious (optional: hash/redact sensitive fields)
 *
 * Used by:
 * - app/parcels/page/[pageNum]/page.tsx (page navigation)
 * - app/parcels/[id]/page.tsx (detail view)
 * - API routes for data mutation
 *
 * Database schema (migrations):
 * CREATE TABLE audit_events (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   workspace_id UUID NOT NULL REFERENCES workspaces(id),
 *   user_id UUID NOT NULL REFERENCES users(id),
 *   event_type VARCHAR(50) NOT NULL, -- 'page_view', 'parcel_update', etc.
 *   resource_type VARCHAR(50), -- 'parcels', 'reports', etc.
 *   resource_id UUID, -- specific parcel/report being accessed
 *   page_num INTEGER, -- for pagination audits
 *   total_pages INTEGER, -- context
 *   user_agent VARCHAR(500),
 *   ip_address INET,
 *   metadata JSONB, -- arbitrary additional data
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   INDEX ON (workspace_id, created_at),
 *   INDEX ON (user_id, created_at),
 *   INDEX ON (event_type, created_at)
 * );
 */

/**
 * Audit event for pagination navigation.
 */
export interface PageNavigationAuditEvent {
  userId: string;
  workspaceId: string;
  pageNum: number;
  resourceType: string; // 'parcels', 'reports', etc.
  totalPages: number;
  metadata?: Record<string, any>; // optional extra context
}

/**
 * Generic audit event (for mutations, API calls, etc.).
 */
export interface GenericAuditEvent {
  userId: string;
  workspaceId: string;
  eventType: string; // 'parcel_created', 'parcel_deleted', etc.
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Emit a page navigation audit event.
 * Called from server components when users view paginated content.
 *
 * @param event Page navigation details
 * @throws Error if DB write fails (caller should handle non-blocking)
 */
export async function auditPageNavigation(event: PageNavigationAuditEvent): Promise<void> {
  const {
    userId,
    workspaceId,
    pageNum,
    resourceType,
    totalPages,
    metadata,
  } = event;

  try {
    // TODO: Replace with your DB client (Supabase, Prisma, etc.)
    // Example: Supabase client
    // const supabase = createClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //   process.env.SUPABASE_SERVICE_ROLE_KEY!
    // );
    //
    // const { error } = await supabase.from('audit_events').insert({
    //   workspace_id: workspaceId,
    //   user_id: userId,
    //   event_type: 'page_view',
    //   resource_type: resourceType,
    //   page_num: pageNum,
    //   total_pages: totalPages,
    //   user_agent: headers().get('user-agent'),
    //   ip_address: headers().get('x-forwarded-for') || headers().get('x-real-ip'),
    //   metadata: {
    //     ...metadata,
    //     timestamp: new Date().toISOString(),
    //   },
    // });
    //
    // if (error) throw error;

    // Placeholder: Log to console for development
    console.log('[AUDIT] Page navigation:', {
      userId,
      workspaceId,
      resourceType,
      pageNum,
      totalPages,
      timestamp: new Date().toISOString(),
      metadata,
    });
  } catch (err: any) {
    // Non-blocking: audit failures should not interrupt user experience
    console.warn('[AUDIT ERROR] Failed to log page navigation:', err.message);
    throw err; // Let caller decide whether to retry or ignore
  }
}

/**
 * Emit a generic audit event (for data mutations, API access, etc.).
 * Called from API routes and server components.
 *
 * @param event Audit event details
 * @throws Error if DB write fails
 */
export async function auditEvent(event: GenericAuditEvent): Promise<void> {
  const {
    userId,
    workspaceId,
    eventType,
    resourceType,
    resourceId,
    metadata,
  } = event;

  try {
    // TODO: Replace with your DB client
    // Example: Supabase
    // const { error } = await supabase.from('audit_events').insert({
    //   workspace_id: workspaceId,
    //   user_id: userId,
    //   event_type: eventType,
    //   resource_type: resourceType,
    //   resource_id: resourceId,
    //   user_agent: headers().get('user-agent'),
    //   ip_address: headers().get('x-forwarded-for') || headers().get('x-real-ip'),
    //   metadata: {
    //     ...metadata,
    //     timestamp: new Date().toISOString(),
    //   },
    // });
    //
    // if (error) throw error;

    // Placeholder: Log to console for development
    console.log('[AUDIT] Event:', {
      userId,
      workspaceId,
      eventType,
      resourceType,
      resourceId,
      timestamp: new Date().toISOString(),
      metadata,
    });
  } catch (err: any) {
    console.warn('[AUDIT ERROR] Failed to log event:', err.message);
    throw err;
  }
}

/**
 * Helper: Extract request metadata for audit context.
 * Run from server components to capture user agent, IP, etc.
 *
 * Usage:
 * import { headers } from 'next/headers';
 * const meta = getRequestMetadata();
 * auditEvent({ ..., metadata: meta });
 */
export function getRequestMetadata(): Record<string, any> {
  try {
    // Note: headers() can only be called from server components.
    // If calling from API route, use request.headers instead.
    // For now, return empty object as placeholder (add headers() call if in server component).
    return {
      userAgent: null, // TODO: headers().get('user-agent'),
      ipAddress: null, // TODO: headers().get('x-forwarded-for'),
      referer: null, // TODO: headers().get('referer'),
    };
  } catch (err: any) {
    // If headers() not available, return empty
    return {};
  }
}

/**
 * PRIVACY CONSIDERATIONS:
 *
 * 1. **IP Addresses:**
 *    - Store only for debugging/security; consider GDPR/CCPA implications
 *    - Use x-forwarded-for (if behind proxy) or x-real-ip header
 *    - Consider storing hashed/anonymized IP (last octet only)
 *
 * 2. **User Agent:**
 *    - Generally safe to store for debugging
 *    - Can reveal device/OS info; consider user privacy
 *
 * 3. **Sensitive Resource IDs:**
 *    - If auditing access to personally identifiable data, ensure proper RLS
 *    - Consider PII redaction in logs (e.g., hash email, phone, etc.)
 *
 * 4. **Data Retention:**
 *    - Define retention policy (e.g., delete audit logs after 90 days)
 *    - Implement archival for long-term compliance
 *
 * 5. **Access Control:**
 *    - Limit audit log access to admins/compliance teams
 *    - Implement RLS on audit_events table
 *    - Log who accesses audit logs (meta-auditing)
 */
