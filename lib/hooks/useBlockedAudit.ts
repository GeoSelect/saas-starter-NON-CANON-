// C046 UnlockDetails — audit hook for blocked attempts (CCP-06, CCP-07)
import { useCallback } from 'react';
import type { FeatureId } from '@/lib/contracts/entitlements';
import type { SubscriptionTier } from '@/lib/contracts/workspace';

/**
 * Hook: log blocked access attempts.
 * Used by C046 to create audit trail for compliance (CCP-07).
 */
export function useBlockedAudit() {
  const auditAttempt = useCallback(
    async (opts: { feature: FeatureId; tier: SubscriptionTier }): Promise<void> => {
      try {
        await fetch('/api/audit/blocked-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            featureId: opts.feature,
            tier: opts.tier,
          }),
          credentials: 'include',
        });
      } catch (err) {
        console.warn('[C046] Failed to audit blocked attempt:', err);
        // Do not throw; audit is best-effort
      }
    },
    []
  );

  return { auditAttempt };
}
