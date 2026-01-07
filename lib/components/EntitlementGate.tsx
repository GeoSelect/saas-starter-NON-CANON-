// C001 AppShell — entitlement-based conditional rendering (CCP-00)
'use client';

import React from 'react';
import { useAppShell } from '@/lib/hooks/useAppShell';
import type { FeatureId } from '@/lib/contracts/entitlements';

interface EntitlementGateProps {
  feature: FeatureId;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
}

/**
 * Conditional rendering gate based on entitlements.
 * Handles loading, error, unauthorized, and content states.
 *
 * Usage:
 * <EntitlementGate
 *   feature="ccp-06:branded-reports"
 *   fallback={<BlockedExplain />}
 * >
 *   <BrandedReportsUI />
 * </EntitlementGate>
 */
export function EntitlementGate({
  feature,
  fallback = null,
  children,
  loading,
  error,
}: EntitlementGateProps) {
  const appShell = useAppShell();

  // Loading state
  if (appShell.loading) {
    return (
      <>
        {loading ?? (
          <div className="text-center text-gray-500">Loading...</div>
        )}
      </>
    );
  }

  // Error state
  if (appShell.error) {
    return (
      <>
        {error ?? (
          <div className="text-center text-red-500">
            Error: {appShell.error.message}
          </div>
        )}
      </>
    );
  }

  // Check entitlement
  const hasAccess = appShell.can(feature);

  // Render content or fallback
  return <>{hasAccess ? children : fallback}</>;
}
