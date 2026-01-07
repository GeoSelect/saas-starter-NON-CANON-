// C046 UnlockDetails — upgrade resolver hook (CCP-06, CCP-14)
import { useCallback } from 'react';
import type { UpgradeOption } from '@/lib/contracts/upgrade';
import type { FeatureId } from '@/lib/contracts/entitlements';

/**
 * Hook: resolve upgrade path for a blocked feature.
 * Calls server endpoint; server is authoritative.
 */
export function useUpgradeResolver() {
  const getUpgrade = useCallback(
    async (
      featureId: FeatureId,
      workspaceId: string
    ): Promise<UpgradeOption | null> => {
      try {
        const res = await fetch('/api/upgrade-option', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featureId, workspaceId }),
          credentials: 'include',
        });

        if (!res.ok) {
          return null;
        }

        const data = await res.json();
        return data.upgrade ?? null;
      } catch (err) {
        console.error('[C046] Failed to resolve upgrade:', err);
        return null;
      }
    },
    []
  );

  return { getUpgrade };
}
