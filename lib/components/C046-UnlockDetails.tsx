// C046 UnlockDetails — paywall gate (CCP-06, CCP-14)
'use client';

import React, { useEffect, useState } from 'react';
import { useAppShell } from '@/lib/hooks/useAppShell';
import type { UpgradeOption } from '@/lib/contracts/upgrade';
import type { FeatureId } from '@/lib/contracts/entitlements';
import { useBlockedAudit } from '@/lib/hooks/useBlockedAudit';

interface UnlockDetailsProps {
  feature: FeatureId;
  children?: React.ReactNode;
  onUpgradeClick?: (option: UpgradeOption) => void;
}

/**
 * C046 UnlockDetails: deterministic paywall UI.
 * Shows upgrade options when feature access is denied.
 * Server-authoritative: does not decide upgradability locally.
 */
export function UnlockDetails({
  feature,
  children,
  onUpgradeClick,
}: UnlockDetailsProps) {
  const appShell = useAppShell();
  const { auditAttempt } = useBlockedAudit();
  const [upgrade, setUpgrade] = useState<UpgradeOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (appShell.loading || !appShell.account || !appShell.workspace) {
      return;
    }

    // User is authenticated and workspace is loaded
    const hasAccess = appShell.can(feature);
    if (hasAccess) {
      // Access granted; render children
      return;
    }

    // Access denied; fetch upgrade option
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/upgrade-option', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            featureId: feature,
            workspaceId: appShell.workspace!.id,
          }),
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch upgrade: ${res.statusText}`);
        }

        const data = await res.json();
        setUpgrade(data.upgrade ?? null);

        // Audit the blocked attempt
        await auditAttempt({
          feature,
          tier: appShell.workspace!.tier,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [appShell.loading, appShell.account, appShell.workspace, feature, auditAttempt]);

  // Access granted
  if (appShell.can(feature)) {
    return <>{children}</>;
  }

  // Loading
  if (appShell.loading || loading) {
    return <div className="text-center text-gray-500">Loading...</div>;
  }

  // Error
  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  // No upgrade available
  if (!upgrade) {
    return (
      <div data-testid="blocked-explain" className="text-center text-gray-500">
        This feature is not available in your plan. Please contact support.
      </div>
    );
  }

  // Show upgrade prompt
  return (
    <div
      data-testid="unlock-details"
      className="bg-blue-50 border border-blue-200 rounded p-6"
    >
      <h3 className="text-lg font-semibold text-blue-900 mb-2">
        Upgrade to {upgrade.plan.name}
      </h3>
      <p className="text-sm text-blue-700 mb-4">
        {upgrade.plan.name} includes this feature and more.
      </p>
      <div className="text-2xl font-bold text-blue-900 mb-4">
        ${(upgrade.plan.price / 100).toFixed(2)} / {upgrade.plan.interval}
      </div>
      {upgrade.saving && (
        <div className="text-xs text-blue-600 mb-4">{upgrade.saving}</div>
      )}
      <button
        onClick={() => {
          onUpgradeClick?.(upgrade);
          window.location.href = upgrade.upgradeUrl;
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 w-full"
        data-testid="upgrade-btn"
      >
        Upgrade Now
      </button>
    </div>
  );
}
