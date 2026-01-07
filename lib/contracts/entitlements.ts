// C001 AppShell — entitlements contract (CCP-00)
// Deterministic feature resolution; no heuristics.
// All checks are boolean; server enforces via RLS and API checks.

import type { Account } from './account';
import type { Workspace, SubscriptionTier } from './workspace';

/**
 * Feature IDs: map to specific CCP capabilities.
 * Must be registered here before use in gating.
 */
export type FeatureId =
  | 'ccp-03:report-generation'
  | 'ccp-04:report-sharing'
  | 'ccp-06:branded-reports'
  | 'ccp-09:crm-sync'
  | 'ccp-14:premium-unlock'
  | 'ccp-15:export-workspace';

/**
 * Feature matrix: tier → available features.
 * Define once; use everywhere for consistency.
 */
const tierFeatures: Record<SubscriptionTier, FeatureId[]> = {
  free: ['ccp-03:report-generation'],
  pro: [
    'ccp-03:report-generation',
    'ccp-04:report-sharing',
    'ccp-06:branded-reports',
  ],
  'pro-plus': [
    'ccp-03:report-generation',
    'ccp-04:report-sharing',
    'ccp-06:branded-reports',
    'ccp-09:crm-sync',
  ],
  portfolio: [
    'ccp-03:report-generation',
    'ccp-04:report-sharing',
    'ccp-06:branded-reports',
    'ccp-09:crm-sync',
    'ccp-15:export-workspace',
  ],
  enterprise: [
    'ccp-03:report-generation',
    'ccp-04:report-sharing',
    'ccp-06:branded-reports',
    'ccp-09:crm-sync',
    'ccp-14:premium-unlock',
    'ccp-15:export-workspace',
  ],
};

/**
 * Resolve whether account can access feature in workspace.
 * Pure function: server-authoritative; idempotent.
 *
 * @param featureId The feature to check (CCP-based)
 * @param account Authenticated account or null
 * @param workspace Current workspace or null
 * @returns true if account can access feature in workspace
 *
 * Invariant: If account === null OR workspace === null, always returns false.
 * Invariant: Result is deterministic (same inputs → same output).
 */
export function can(
  featureId: FeatureId,
  account: Account | null,
  workspace: Workspace | null,
): boolean {
  // C001 AppShell enforcement: anonymous or no workspace → no features
  if (account === null || workspace === null) {
    return false;
  }

  // Check tier entitlements
  const tier = workspace.tier;
  const features = tierFeatures[tier] ?? [];
  return features.includes(featureId);
}

/**
 * Cache object for client-side entitlement checks.
 * Refreshed when account or workspace changes.
 */
export interface EntitlementCache {
  account: Account | null;
  workspace: Workspace | null;
  features: Set<FeatureId>;
  builtAt: number; // timestamp for cache validity
}

/**
 * Build a fresh entitlement cache.
 * Called on mount and on refresh.
 */
export function buildEntitlementCache(
  account: Account | null,
  workspace: Workspace | null,
): EntitlementCache {
  const features = new Set<FeatureId>();
  if (account && workspace) {
    const tier = workspace.tier;
    const available = tierFeatures[tier] ?? [];
    available.forEach((f) => features.add(f));
  }
  return {
    account,
    workspace,
    features,
    builtAt: Date.now(),
  };
}

/**
 * Check if cache is stale (older than 5 minutes).
 */
export function isCacheStale(cache: EntitlementCache): boolean {
  return Date.now() - cache.builtAt > 5 * 60 * 1000;
}
