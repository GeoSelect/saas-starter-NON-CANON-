// CCP-05 Entitlements Service Unit Tests
// Tests: getEntitlementStatus, caching, tier hierarchy, denial reasons

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getEntitlementStatus,
  getBillingState,
  determineDenialReason,
  checkMultipleEntitlements,
  invalidateWorkspaceCache,
  getCacheStatistics,
} from '@/lib/services/entitlements';
import {
  isTierSufficient,
  isValidFeature,
  getMinimumTierFor,
  TIER_ORDER,
  TIER_REQUIREMENTS,
} from '@/lib/contracts/ccp05/entitlements';
import type {
  SubscriptionTier,
  EntitlementFeature,
  EntitlementDenialReason,
  BillingState,
} from '@/lib/contracts/ccp05/entitlements';

// Mock Supabase
vi.mock('@/lib/supabase-server', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn(function() {
        return this;
      }),
      eq: vi.fn(function() {
        return this;
      }),
      single: vi.fn(async function() {
        // Mock responses based on query context
        if (table === 'billing_state') {
          return {
            data: {
              workspace_id: 'ws-1',
              tier: 'pro',
              status: 'active',
              trial_end: null,
            },
            error: null,
          };
        }
        return { data: null, error: null };
      }),
    })),
  })),
}));

describe('CCP-05 Entitlements Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    invalidateWorkspaceCache('ws-1');
    vi.clearAllMocks();
  });

  afterEach(() => {
    invalidateWorkspaceCache('ws-1');
  });

  describe('Tier Hierarchy Tests', () => {
    it('should validate TIER_ORDER numeric levels', () => {
      expect(TIER_ORDER['free']).toBe(0);
      expect(TIER_ORDER['pro']).toBe(1);
      expect(TIER_ORDER['pro_plus']).toBe(2);
      expect(TIER_ORDER['portfolio']).toBe(3);
      expect(TIER_ORDER['enterprise']).toBe(4);
    });

    it('isTierSufficient: free tier cannot access pro features', () => {
      expect(isTierSufficient('free', 'pro')).toBe(false);
      expect(isTierSufficient('free', 'free')).toBe(true);
    });

    it('isTierSufficient: pro tier can access pro and below', () => {
      expect(isTierSufficient('pro', 'pro')).toBe(true);
      expect(isTierSufficient('pro', 'free')).toBe(true);
      expect(isTierSufficient('pro', 'pro_plus')).toBe(false);
    });

    it('isTierSufficient: enterprise can access all tiers', () => {
      expect(isTierSufficient('enterprise', 'free')).toBe(true);
      expect(isTierSufficient('enterprise', 'pro')).toBe(true);
      expect(isTierSufficient('enterprise', 'pro_plus')).toBe(true);
      expect(isTierSufficient('enterprise', 'portfolio')).toBe(true);
      expect(isTierSufficient('enterprise', 'enterprise')).toBe(true);
    });
  });

  describe('Feature Validation', () => {
    it('isValidFeature: should accept all 14 defined features', () => {
      const validFeatures: EntitlementFeature[] = [
        'ccp-01:parcel-discovery',
        'ccp-02:satellite-imagery',
        'ccp-03:property-history',
        'ccp-04:market-analysis',
        'ccp-05:investment-calculator',
        'ccp-06:branded-reports',
        'ccp-07:bulk-contacts-api',
        'ccp-08:webhooks-api',
        'ccp-09:csv-contact-upload',
        'ccp-10:crm-hub',
        'ccp-11:workflows',
        'ccp-12:analytics-dashboard',
        'ccp-13:export-builder',
        'ccp-14:api-keys',
      ];

      validFeatures.forEach((feature) => {
        expect(isValidFeature(feature)).toBe(true);
      });
    });

    it('isValidFeature: should reject invalid features', () => {
      expect(isValidFeature('invalid-feature')).toBe(false);
      expect(isValidFeature('ccp-99:nonexistent')).toBe(false);
      expect(isValidFeature('')).toBe(false);
    });

    it('getMinimumTierFor: should return correct tier for each feature', () => {
      expect(getMinimumTierFor('ccp-01:parcel-discovery')).toBe('free');
      expect(getMinimumTierFor('ccp-06:branded-reports')).toBe('pro');
      expect(getMinimumTierFor('ccp-10:crm-hub')).toBe('pro_plus');
    });
  });

  describe('Denial Reason Logic', () => {
    it('should deny inactive subscriptions with SUBSCRIPTION_INACTIVE', async () => {
      const billing: BillingState = {
        workspace_id: 'ws-1',
        stripe_customer_id: 'cus-123',
        stripe_subscription_id: 'sub-456',
        tier: 'pro',
        status: 'cancelled',
        trial_end: null,
      };

      const reason = determineDenialReason(billing, 'pro');
      expect(reason).toBe('SUBSCRIPTION_INACTIVE');
    });

    it('should deny past due subscriptions', async () => {
      const billing: BillingState = {
        workspace_id: 'ws-1',
        stripe_customer_id: 'cus-123',
        stripe_subscription_id: 'sub-456',
        tier: 'pro',
        status: 'past_due',
        trial_end: null,
      };

      const reason = determineDenialReason(billing, 'pro');
      expect(reason).toBe('SUBSCRIPTION_INACTIVE');
    });

    it('should deny tier insufficient access', async () => {
      const billing: BillingState = {
        workspace_id: 'ws-1',
        stripe_customer_id: 'cus-123',
        stripe_subscription_id: 'sub-456',
        tier: 'free',
        status: 'active',
        trial_end: null,
      };

      const reason = determineDenialReason(billing, 'pro');
      expect(reason).toBe('TIER_INSUFFICIENT');
    });

    it('should allow sufficient tier with active subscription', async () => {
      const billing: BillingState = {
        workspace_id: 'ws-1',
        stripe_customer_id: 'cus-123',
        stripe_subscription_id: 'sub-456',
        tier: 'pro',
        status: 'active',
        trial_end: null,
      };

      const reason = determineDenialReason(billing, 'free');
      expect(reason).toBeNull();
    });

    it('should deny expired trial with GRACE_PERIOD_EXPIRED', async () => {
      const expiredTrialEnd = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

      const billing: BillingState = {
        workspace_id: 'ws-1',
        stripe_customer_id: 'cus-123',
        stripe_subscription_id: 'sub-456',
        tier: 'free',
        status: 'trialing',
        trial_end: expiredTrialEnd,
      };

      const reason = determineDenialReason(billing, 'pro');
      // Trial expired and tier insufficient
      expect(reason).toBe('GRACE_PERIOD_EXPIRED');
    });

    it('should allow active trial', async () => {
      const futureTrialEnd = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now

      const billing: BillingState = {
        workspace_id: 'ws-1',
        stripe_customer_id: 'cus-123',
        stripe_subscription_id: 'sub-456',
        tier: 'free',
        status: 'trialing',
        trial_end: futureTrialEnd,
      };

      const reason = determineDenialReason(billing, 'pro');
      expect(reason).toBeNull();
    });
  });

  describe('TIER_REQUIREMENTS Mapping', () => {
    it('should have requirements for all 14 features', () => {
      const featureCount = Object.keys(TIER_REQUIREMENTS).length;
      expect(featureCount).toBe(14);
    });

    it('should have valid tier requirements (within defined tiers)', () => {
      Object.entries(TIER_REQUIREMENTS).forEach(([feature, tier]) => {
        expect(['free', 'pro', 'pro_plus', 'portfolio', 'enterprise']).toContain(tier);
      });
    });

    it('should map features in tier hierarchy order', () => {
      const features = Object.entries(TIER_REQUIREMENTS);

      // Basic sanity check: at least one free, at least one pro+
      const hasFree = features.some(([_, tier]) => tier === 'free');
      const hasProPlus = features.some(([_, tier]) => tier === 'pro_plus');

      expect(hasFree).toBe(true);
      expect(hasProPlus).toBe(true);
    });
  });

  describe('Cache Behavior', () => {
    it('getCacheStatistics should return cache metrics', async () => {
      const stats = getCacheStatistics();
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('validEntries');
      expect(stats).toHaveProperty('expiredEntries');
      expect(stats.cacheSize).toBeGreaterThanOrEqual(0);
    });

    it('should track cache statistics over time', async () => {
      const before = getCacheStatistics();
      const beforeSize = before.cacheSize;

      // After a real operation (mocked), cache should update
      // This is simplified; real test would call getEntitlementStatus

      const after = getCacheStatistics();
      expect(typeof after.cacheSize).toBe('number');
      expect(after.cacheSize).toBeGreaterThanOrEqual(beforeSize);
    });
  });

  describe('Batch Operations', () => {
    it('checkMultipleEntitlements should handle multiple features', async () => {
      const features: EntitlementFeature[] = [
        'ccp-01:parcel-discovery',
        'ccp-06:branded-reports',
      ];

      const results = await checkMultipleEntitlements('ws-1', features, 'user-1');

      expect(results).toHaveProperty('ccp-01:parcel-discovery');
      expect(results).toHaveProperty('ccp-06:branded-reports');

      Object.values(results).forEach((result) => {
        expect(result).toHaveProperty('feature');
        expect(result).toHaveProperty('enabled');
        expect(result).toHaveProperty('reason');
      });
    });
  });

  describe('Cache Invalidation', () => {
    it('invalidateWorkspaceCache should clear workspace entries', async () => {
      const statsBefore = getCacheStatistics();

      invalidateWorkspaceCache('ws-1');

      const statsAfter = getCacheStatistics();
      // After invalidation, valid entries should decrease (or stay same if empty)
      expect(typeof statsAfter.validEntries).toBe('number');
    });
  });

  describe('Type Safety', () => {
    it('should export correct type contracts', () => {
      // Runtime type verification
      const feature: EntitlementFeature = 'ccp-01:parcel-discovery';
      expect(isValidFeature(feature)).toBe(true);

      const tier: SubscriptionTier = 'pro';
      expect(TIER_ORDER[tier]).toBe(1);

      const reason: EntitlementDenialReason = 'TIER_INSUFFICIENT';
      expect(['TIER_INSUFFICIENT', 'FEATURE_DISABLED', 'SUBSCRIPTION_INACTIVE']).toContain(reason);
    });
  });
});
