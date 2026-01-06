// CCP-05 Monetization & Billing — Entitlement Contracts
// Defines all feature flags, tier hierarchies, reason codes, and resolution types
// lib/contracts/ccp05/entitlements.ts

/**
 * ENTITLEMENT PRINCIPLES
 *
 * 1. Server-Authoritative: All entitlement checks happen on server
 * 2. Boolean Result: Features are either enabled (true) or disabled (false)
 * 3. Reason Codes: When disabled, explain why (tier insufficient, feature disabled, etc.)
 * 4. Cached: Results cached for 5 minutes for performance
 * 5. Audited: Every check logged to append-only table
 * 6. Tier Hierarchy: free < pro < pro_plus < portfolio < enterprise
 */

/**
 * All supported tiers (from Stripe)
 * Ordered by capability level (ascending)
 */
export type SubscriptionTier = 'free' | 'pro' | 'pro_plus' | 'portfolio' | 'enterprise';

/**
 * All available entitlement features (CCP-mapped)
 * Format: ccp-XX:feature-name
 */
export type EntitlementFeature =
  | 'ccp-01:parcel-discovery'
  | 'ccp-02:parcel-context'
  | 'ccp-03:report-generation'
  | 'ccp-04:report-viewing'
  | 'ccp-05:billing'
  | 'ccp-06:branded-reports'
  | 'ccp-07:audit-logging'
  | 'ccp-08:saved-parcels'
  | 'ccp-09:contact-upload'
  | 'ccp-10:collaboration'
  | 'ccp-11:events'
  | 'ccp-12:sharing'
  | 'ccp-14:premium-features'
  | 'ccp-15:export';

/**
 * Reason codes for entitlement denial (why a feature is not enabled)
 */
export type EntitlementDenialReason =
  | 'TIER_INSUFFICIENT' // User's tier doesn't meet feature requirement
  | 'FEATURE_DISABLED' // Feature explicitly disabled for this workspace
  | 'GRACE_PERIOD_EXPIRED' // Trial/grace period ended
  | 'SUBSCRIPTION_INACTIVE' // Subscription cancelled or past due
  | 'TRIAL_NOT_STARTED' // User hasn't started trial yet
  | 'FEATURE_UNAVAILABLE' // Feature not available in user's region/plan
  | 'SYSTEM_MAINTENANCE' // Feature temporarily disabled
  | 'RATE_LIMIT_EXCEEDED'; // User exceeded usage quota

/**
 * Result of an entitlement check
 */
export interface EntitlementCheckResult {
  /** Feature requested */
  feature: EntitlementFeature;
  
  /** Whether feature is enabled (TRUE = allowed, FALSE = denied) */
  enabled: boolean;
  
  /** User's current subscription tier */
  tier: SubscriptionTier;
  
  /** Reason if denied, null if enabled */
  reason: EntitlementDenialReason | null;
  
  /** Whether this result came from cache (performance metric) */
  cached: boolean;
  
  /** Timestamp when resolved */
  resolvedAt: Date;
  
  /** Cache TTL remaining (seconds), null if not cached */
  cacheTtlRemaining: number | null;
}

/**
 * Entitlement configuration (what tier is required for a feature)
 */
export interface EntitlementConfig {
  feature: EntitlementFeature;
  minimumTier: SubscriptionTier; // e.g., 'pro' = pro+ and above
  enabled: boolean; // Can be disabled globally (feature flag)
  reason?: EntitlementDenialReason;
}

/**
 * Cached entitlement state (for performance)
 */
export interface EntitlementCacheEntry {
  feature: EntitlementFeature;
  enabled: boolean;
  tier: SubscriptionTier;
  reason: EntitlementDenialReason | null;
  cachedAt: Date;
  expiresAt: Date;
}

/**
 * Workspace billing state (synced from Stripe)
 */
export interface BillingState {
  workspaceId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trial';
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  trialEnd: Date | null;
  lastWebhookEventId: string | null;
  lastWebhookAt: Date | null;
  syncedAt: Date;
}

/**
 * Audit entry for entitlement check
 */
export interface EntitlementCheckAudit {
  workspaceId: string;
  userId: string;
  feature: EntitlementFeature;
  result: boolean; // enabled or not
  reason: EntitlementDenialReason | null;
  tier: SubscriptionTier;
  cached: boolean;
  userAgent?: string;
  ipAddress?: string;
  checkedAt: Date;
}

/**
 * TIER REQUIREMENTS
 * Maps features to minimum tier required to access them
 */
export const TIER_REQUIREMENTS: Record<EntitlementFeature, SubscriptionTier> = {
  'ccp-01:parcel-discovery': 'free',
  'ccp-02:parcel-context': 'free',
  'ccp-03:report-generation': 'free',
  'ccp-04:report-viewing': 'free',
  'ccp-05:billing': 'free',
  'ccp-06:branded-reports': 'pro',
  'ccp-07:audit-logging': 'free',
  'ccp-08:saved-parcels': 'pro',
  'ccp-09:contact-upload': 'pro_plus',
  'ccp-10:collaboration': 'pro_plus',
  'ccp-11:events': 'pro_plus',
  'ccp-12:sharing': 'free',
  'ccp-14:premium-features': 'pro',
  'ccp-15:export': 'portfolio',
};

/**
 * TIER HIERARCHY
 * Used for comparison: tier1 >= tier2
 */
export const TIER_ORDER: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  pro_plus: 2,
  portfolio: 3,
  enterprise: 4,
};

/**
 * Check if a tier is sufficient for a feature
 * @param userTier User's current subscription tier
 * @param featureTier Required tier for feature
 * @returns true if user's tier >= feature's required tier
 */
export function isTierSufficient(userTier: SubscriptionTier, featureTier: SubscriptionTier): boolean {
  return TIER_ORDER[userTier] >= TIER_ORDER[featureTier];
}

/**
 * Get minimum tier required for a feature
 */
export function getMinimumTierFor(feature: EntitlementFeature): SubscriptionTier {
  return TIER_REQUIREMENTS[feature];
}

/**
 * Check if feature exists and is valid
 */
export function isValidFeature(feature: string): feature is EntitlementFeature {
  return feature in TIER_REQUIREMENTS;
}

/**
 * Type guard: Ensure value is EntitlementCheckResult
 */
export function isEntitlementCheckResult(value: any): value is EntitlementCheckResult {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.feature === 'string' &&
    typeof value.enabled === 'boolean' &&
    typeof value.tier === 'string' &&
    (value.reason === null || typeof value.reason === 'string') &&
    typeof value.cached === 'boolean' &&
    value.resolvedAt instanceof Date
  );
}

/**
 * Cache TTL: 5 minutes (300 seconds)
 * Used by entitlement service for performance
 */
export const ENTITLEMENT_CACHE_TTL_SECONDS = 5 * 60;

/**
 * Feature descriptions (for UI/documentation)
 */
export const FEATURE_DESCRIPTIONS: Record<EntitlementFeature, string> = {
  'ccp-01:parcel-discovery': 'Search and discover parcels by address or location',
  'ccp-02:parcel-context': 'View detailed parcel information and context',
  'ccp-03:report-generation': 'Generate parcel reports',
  'ccp-04:report-viewing': 'View and access saved reports',
  'ccp-05:billing': 'Manage billing and subscription',
  'ccp-06:branded-reports': 'Create and share branded reports',
  'ccp-07:audit-logging': 'Access audit logs and compliance records',
  'ccp-08:saved-parcels': 'Save and bookmark parcels for later',
  'ccp-09:contact-upload': 'Import contacts via CSV',
  'ccp-10:collaboration': 'Collaborate with team members',
  'ccp-11:events': 'Track and manage events',
  'ccp-12:sharing': 'Share reports and parcels with others',
  'ccp-14:premium-features': 'Access premium features and tools',
  'ccp-15:export': 'Export data in various formats',
};

/**
 * Tier descriptions (for UI/marketing)
 */
export const TIER_DESCRIPTIONS: Record<SubscriptionTier, string> = {
  free: 'Free tier - Basic parcel discovery and reporting',
  pro: 'Pro tier - Branded reports and saved parcels',
  pro_plus: 'Pro Plus - Contact management and collaboration',
  portfolio: 'Portfolio - Data export and advanced analytics',
  enterprise: 'Enterprise - Custom features and support',
};
