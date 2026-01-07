// C046 UnlockDetails — audit contract (CCP-06, CCP-07)
import type { SubscriptionTier } from './workspace';

export interface BlockedAccessAuditEvent {
  userId: string;
  workspaceId: string;
  featureId: string;
  currentTier: SubscriptionTier;
  requiredTier: SubscriptionTier;
  timestamp: string;
  userAgent?: string;
  country?: string;
  reason: 'insufficient_tier' | 'feature_not_in_tier' | 'trial_expired';
}

/**
 * Log blocked access attempt.
 * Server-side only; used by API routes and middleware.
 */
export async function auditBlockedAccess(
  event: BlockedAccessAuditEvent
): Promise<void> {
  // TODO: Insert into blocked_access_logs table
  // Server-side function only; never expose to client
}
