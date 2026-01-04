import { supabaseRSC } from "@/lib/supabase/server";
import { ActivityType } from "@/lib/types/activity";

interface LogActivityOptions {
  userId: string;
  activityType: ActivityType;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
}

/**
 * Log an activity for audit trail tracking
 * Should be called server-side from API routes or server actions
 *
 * @param userId - ID of user performing the action
 * @param activityType - Type of activity (from ActivityType enum)
 * @param workspaceId - Optional workspace context
 * @param metadata - Additional activity metadata
 * @param requestId - Optional idempotency key (prevents duplicate logging on retries)
 *
 * Idempotency: If requestId is provided, subsequent calls with the same
 * (workspace_id, activity_type, request_id) will be silently ignored (returns null).
 */
export async function logActivity({
  userId,
  activityType,
  workspaceId,
  metadata,
  requestId,
}: LogActivityOptions): Promise<void> {
  try {
    const supabase = supabaseRSC();

    const { error } = await supabase.from("activities").insert({
      user_id: userId,
      activity_type: activityType,
      workspace_id: workspaceId || null,
      request_id: requestId || null,
      metadata: metadata || null,
    });

    if (error) {
      // Check if this is an idempotency conflict (unique constraint violation)
      if (requestId && error.code === "23505") {
        // Silently ignore: duplicate request_id for same (workspace, type) already logged
        console.debug(
          `Activity already logged (idempotency): ${activityType}/${requestId}`
        );
        return;
      }

      console.error(`Failed to log activity ${activityType}:`, error);
      // Don't throw - activity logging should never break the main operation
    }
  } catch (err) {
    console.error("Error logging activity:", err);
    // Silently fail - activity logging is non-critical
  }
}

/**
 * Log a snapshot creation activity (hardened with full metadata)
 */
export async function logSnapshotCreated(
  userId: string,
  workspaceId: string,
  snapshotId: string,
  parcelId: string,
  address: string,
  reportId?: string,
  schemaVersion?: string,
  requestId?: string
): Promise<void> {
  return logActivity({
    userId,
    activityType: ActivityType.SNAPSHOT_CREATED,
    workspaceId,
    requestId,
    metadata: {
      snapshot_id: snapshotId,
      parcel_id: parcelId,
      address,
      report_id: reportId || null,
      schema_version: schemaVersion || "1.0",
    },
  });
}

/**
 * Log a share link creation activity (hardened - no full token exposed)
 */
export async function logShareLinkCreated(
  userId: string,
  workspaceId: string,
  shareLinkId: string,
  snapshotId: string,
  tokenPrefix: string,
  expiresAt?: Date,
  maxViews?: number,
  requiresAuth?: boolean,
  requestId?: string
): Promise<void> {
  return logActivity({
    userId,
    activityType: ActivityType.SHARE_LINK_CREATED,
    workspaceId,
    requestId,
    metadata: {
      share_link_id: shareLinkId,
      snapshot_id: snapshotId,
      token_prefix: tokenPrefix,
      expires_at: expiresAt?.toISOString() || null,
      max_views: maxViews || null,
      requires_auth: requiresAuth || false,
    },
  });
}

/**
 * Log a parcel selection activity
 */
export async function logParcelSelected(
  userId: string,
  workspaceId: string,
  parcelId: string,
  apn?: string,
  source?: "parcel_resolve" | "map_click" | "search_result",
  confidence?: number,
  requestId?: string
): Promise<void> {
  return logActivity({
    userId,
    activityType: ActivityType.PARCEL_SELECTED,
    workspaceId,
    requestId,
    metadata: {
      parcel_id: parcelId,
      apn: apn || null,
      source: source || "search_result",
      confidence: confidence || null,
      request_id: requestId || null,
    },
  });
}

/**
 * Log rules evaluation activity
 */
export async function logRulesEvaluated(
  userId: string,
  workspaceId: string,
  parcelId: string,
  rulesetVersion?: string,
  ruleCounts?: { evaluated: number; passed: number; failed: number },
  durationMs?: number,
  inputsHash?: string,
  requestId?: string
): Promise<void> {
  return logActivity({
    userId,
    activityType: ActivityType.RULES_EVALUATED,
    workspaceId,
    requestId,
    metadata: {
      parcel_id: parcelId,
      ruleset_version: rulesetVersion || "0.1",
      rule_counts: ruleCounts || { evaluated: 0, passed: 0, failed: 0 },
      duration_ms: durationMs || null,
      inputs_hash: inputsHash || null,
    },
  });
}

/**
 * Log a report share activity
 */
export async function logReportShared(
  userId: string,
  workspaceId: string,
  reportId: string,
  sharedWith: {
    contactId?: string;
    userId?: string;
    email?: string;
  },
  roleGranted?: "viewer" | "commenter" | "editor",
  channel?: "email" | "workspace" | "sms" | "link_only",
  messageId?: string,
  requestId?: string
): Promise<void> {
  return logActivity({
    userId,
    activityType: ActivityType.REPORT_SHARED,
    workspaceId,
    requestId,
    metadata: {
      report_id: reportId,
      shared_with: {
        contact_id: sharedWith.contactId || null,
        user_id: sharedWith.userId || null,
        email: sharedWith.email || null,
      },
      role_granted: roleGranted || "viewer",
      channel: channel || "email",
      message_id: messageId || null,
    },
  });
}
