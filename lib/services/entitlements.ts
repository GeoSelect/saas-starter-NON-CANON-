// CCP-05 Monetization & Billing — Entitlement Service
// Server-authoritative entitlement resolution with caching, auditing, and Stripe integration
// lib/services/entitlements.ts

import { createServerClient } from '@supabase/ssr';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import type {
  EntitlementFeature,
  SubscriptionTier,
  EntitlementCheckResult,
  EntitlementDenialReason,
  BillingState,
} from '@/lib/contracts/ccp05/entitlements';
import {
  TIER_REQUIREMENTS,
  TIER_ORDER,
  isTierSufficient,
  isValidFeature,
  ENTITLEMENT_CACHE_TTL_SECONDS,
} from '@/lib/contracts/ccp05/entitlements';

/**
 * In-memory cache for entitlements (5-minute TTL per entry)
 * Production: Replace with Redis
 * Structure: workspaceId:feature => { result, expiresAt }
 */
const inMemoryCache = new Map<string, { result: EntitlementCheckResult; expiresAt: number }>();

/**
 * Get Supabase client (server-side)
 */
async function getSupabaseClient() {
  const cookieStore = await cookies();
  const headersList = await headers();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // In middleware
          }
        },
      },
      defaultHeaders: {
        'User-Agent': headersList.get('user-agent') || 'unknown',
      },
    }
  );
}

/**
 * Get billing state for workspace (synced from Stripe)
 */
async function getBillingState(workspaceId: string): Promise<BillingState> {
  const supabase = await getSupabaseClient();

  const { data: billing, error } = await supabase
    .from('billing_state')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !billing) {
    // Default to free tier if no billing record
    return {
      workspaceId,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      tier: 'free',
      status: 'active',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      trialEnd: null,
      lastWebhookEventId: null,
      lastWebhookAt: null,
      syncedAt: new Date(),
    };
  }

  return {
    workspaceId,
    stripeCustomerId: billing.stripe_customer_id,
    stripeSubscriptionId: billing.stripe_subscription_id,
    tier: billing.tier as SubscriptionTier,
    status: billing.status,
    currentPeriodStart: billing.current_period_start ? new Date(billing.current_period_start) : null,
    currentPeriodEnd: billing.current_period_end ? new Date(billing.current_period_end) : null,
    trialEnd: billing.trial_end ? new Date(billing.trial_end) : null,
    lastWebhookEventId: billing.last_webhook_event_id,
    lastWebhookAt: billing.last_webhook_at ? new Date(billing.last_webhook_at) : null,
    syncedAt: new Date(billing.synced_at),
  };
}

/**
 * Determine entitlement access based on billing state
 * Returns denial reason if access denied, null if allowed
 */
function determineDenialReason(
  billing: BillingState,
  minimumTier: SubscriptionTier
): EntitlementDenialReason | null {
  // 1. Check subscription status first
  if (billing.status === 'cancelled') {
    return 'SUBSCRIPTION_INACTIVE';
  }
  if (billing.status === 'past_due') {
    return 'SUBSCRIPTION_INACTIVE'; // Could be "PAYMENT_OVERDUE" but simplifying
  }

  // 2. Check tier sufficiency
  if (!isTierSufficient(billing.tier, minimumTier)) {
    return 'TIER_INSUFFICIENT';
  }

  // 3. Check trial status (if applicable)
  if (billing.status === 'trial' && billing.trialEnd) {
    if (new Date() > billing.trialEnd) {
      return 'GRACE_PERIOD_EXPIRED';
    }
  }

  // 4. All checks passed
  return null;
}

/**
 * CORE: Check if user has access to a feature
 * 
 * Flow:
 * 1. Validate feature name
 * 2. Check cache (5-minute TTL)
 * 3. Get workspace billing state
 * 4. Determine access based on tier + status
 * 5. Cache result
 * 6. Audit check
 * 7. Return result
 */
export async function getEntitlementStatus(
  workspaceId: string,
  feature: EntitlementFeature,
  userId?: string
): Promise<EntitlementCheckResult> {
  const now = Date.now();

  // 1. Validate feature
  if (!isValidFeature(feature)) {
    console.warn(`[getEntitlementStatus] Invalid feature: ${feature}`);
    return {
      feature,
      enabled: false,
      tier: 'free',
      reason: 'FEATURE_UNAVAILABLE',
      cached: false,
      resolvedAt: new Date(),
      cacheTtlRemaining: null,
    };
  }

  // 2. Check in-memory cache
  const cacheKey = `${workspaceId}:${feature}`;
  const cached = inMemoryCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return {
      ...cached.result,
      cached: true,
      cacheTtlRemaining: Math.ceil((cached.expiresAt - now) / 1000),
    };
  }

  // 3. Get billing state (source of truth)
  const billing = await getBillingState(workspaceId);
  const minimumTier = TIER_REQUIREMENTS[feature];

  // 4. Determine denial reason (null = allowed)
  const denialReason = determineDenialReason(billing, minimumTier);
  const enabled = denialReason === null;

  // 5. Build result
  const result: EntitlementCheckResult = {
    feature,
    enabled,
    tier: billing.tier,
    reason: denialReason,
    cached: false,
    resolvedAt: new Date(),
    cacheTtlRemaining: null,
  };

  // 6. Cache result (5 minutes)
  const expiresAt = now + ENTITLEMENT_CACHE_TTL_SECONDS * 1000;
  inMemoryCache.set(cacheKey, {
    result,
    expiresAt,
  });

  // 7. Audit check (best-effort, non-blocking)
  if (userId) {
    auditEntitlementCheck(workspaceId, userId, result).catch((err) => {
      console.warn('[getEntitlementStatus] Audit failed:', err);
    });
  }

  return result;
}

/**
 * Batch check multiple features for performance
 */
export async function checkMultipleEntitlements(
  workspaceId: string,
  features: EntitlementFeature[],
  userId?: string
): Promise<Record<EntitlementFeature, EntitlementCheckResult>> {
  const results: Record<EntitlementFeature, EntitlementCheckResult> = {} as any;

  // Fetch all results in parallel
  const promises = features.map((feature) =>
    getEntitlementStatus(workspaceId, feature, userId).then((result) => ({
      feature,
      result,
    }))
  );

  const resolved = await Promise.all(promises);

  // Build result map
  for (const { feature, result } of resolved) {
    results[feature] = result;
  }

  return results;
}

/**
 * Audit entitlement check to database (append-only)
 * Best-effort: failures don't break the feature
 */
async function auditEntitlementCheck(
  workspaceId: string,
  userId: string,
  result: EntitlementCheckResult
): Promise<void> {
  try {
    const supabase = await getSupabaseClient();
    const headersList = await headers();

    // Extract IP from headers (server-side, not trusted from client)
    const ipAddress =
      (headersList.get('x-forwarded-for') as string)?.split(',')[0].trim() ||
      headersList.get('x-real-ip') ||
      'unknown';

    // Insert to audit table
    const { error } = await supabase.from('entitlement_checks').insert({
      workspace_id: workspaceId,
      user_id: userId,
      feature: result.feature,
      result: result.enabled,
      reason_code: result.reason,
      tier: result.tier,
      cached: result.cached,
      user_agent: headersList.get('user-agent') || 'unknown',
      ip_address: ipAddress,
    });

    if (error) {
      console.warn('[auditEntitlementCheck] Insert failed:', error);
    }
  } catch (err) {
    console.warn('[auditEntitlementCheck] Unhandled error:', err);
    // Don't throw, audit is best-effort
  }
}

/**
 * Invalidate cache for a workspace (called after billing changes)
 */
export function invalidateWorkspaceCache(workspaceId: string): void {
  const keysToDelete: string[] = [];

  // Find all cache entries for this workspace
  for (const key of inMemoryCache.keys()) {
    if (key.startsWith(`${workspaceId}:`)) {
      keysToDelete.push(key);
    }
  }

  // Delete them
  for (const key of keysToDelete) {
    inMemoryCache.delete(key);
  }

  console.log(`[invalidateWorkspaceCache] Invalidated ${keysToDelete.length} entries for workspace ${workspaceId}`);
}

/**
 * Sync billing state from Stripe webhook
 * Called after Stripe webhook (subscription.updated, etc.)
 */
export async function syncBillingStateFromStripe(
  workspaceId: string,
  stripeData: {
    customerId: string;
    subscriptionId: string;
    tier: SubscriptionTier;
    status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trial';
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    trialEnd?: Date;
    webhookEventId: string;
  }
): Promise<void> {
  const supabase = await getSupabaseClient();

  // Upsert billing_state (insert or update)
  const { error } = await supabase
    .from('billing_state')
    .upsert(
      {
        workspace_id: workspaceId,
        stripe_customer_id: stripeData.customerId,
        stripe_subscription_id: stripeData.subscriptionId,
        tier: stripeData.tier,
        status: stripeData.status,
        current_period_start: stripeData.currentPeriodStart?.toISOString(),
        current_period_end: stripeData.currentPeriodEnd?.toISOString(),
        trial_end: stripeData.trialEnd?.toISOString(),
        last_webhook_event_id: stripeData.webhookEventId,
        last_webhook_at: new Date().toISOString(),
        synced_at: new Date().toISOString(),
      },
      {
        onConflict: 'workspace_id',
      }
    );

  if (error) {
    console.error('[syncBillingStateFromStripe] Upsert failed:', error);
    throw error;
  }

  // Invalidate cache (trigger entitlements to be recalculated)
  invalidateWorkspaceCache(workspaceId);

  console.log(`[syncBillingStateFromStripe] Synced workspace ${workspaceId} to tier ${stripeData.tier}`);
}

/**
 * Get all enabled entitlements for workspace
 * Useful for UI to determine which features to show
 */
export async function getEnabledEntitlements(
  workspaceId: string
): Promise<EntitlementFeature[]> {
  const supabase = await getSupabaseClient();

  const { data: entitlements, error } = await supabase
    .from('entitlements_current')
    .select('feature')
    .eq('workspace_id', workspaceId);

  if (error || !entitlements) {
    console.warn('[getEnabledEntitlements] Query failed:', error);
    return [];
  }

  return entitlements.map((e: any) => e.feature as EntitlementFeature);
}

/**
 * Get cache statistics (for monitoring)
 */
export function getCacheStatistics() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  for (const { expiresAt } of inMemoryCache.values()) {
    if (expiresAt > now) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }

  // Clean up expired entries
  for (const [key, { expiresAt }] of inMemoryCache.entries()) {
    if (expiresAt <= now) {
      inMemoryCache.delete(key);
    }
  }

  return {
    cacheSize: inMemoryCache.size,
    validEntries,
    expiredEntries: expiredEntries - (expiredEntries > 0 ? expiredEntries : 0), // Will be 0 after cleanup
    ttlSeconds: ENTITLEMENT_CACHE_TTL_SECONDS,
  };
}

/**
 * Clear all cache (for testing or emergency)
 */
export function clearAllCache(): void {
  const size = inMemoryCache.size;
  inMemoryCache.clear();
  console.log(`[clearAllCache] Cleared ${size} entries`);
}
