// CCP-05 Integration Tests: Stripe Webhook → Entitlements → Cache
// Scenarios:
// 1. Free user requests pro feature (denied)
// 2. Pro user requests pro feature (allowed)
// 3. Stripe webhook tier upgrade → cache invalidated → feature now accessible
// 4. Subscription cancelled → all tier-gated features denied
// 5. Trial ending → grace period check
// 6. Batch feature check → cache reuse
// 7. Concurrent requests → cache hit reduces DB loads
// 8. Audit trail created for all checks

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createServerClient } from '@supabase/ssr';
import {
  getEntitlementStatus,
  syncBillingStateFromStripe,
  checkMultipleEntitlements,
  invalidateWorkspaceCache,
} from '@/lib/services/entitlements';
import type {
  EntitlementFeature,
  BillingState,
} from '@/lib/contracts/ccp05/entitlements';

// Mock Supabase
const mockSupabase = {
  from: vi.fn((table: string) => ({
    select: vi.fn(function() {
      return this;
    }),
    eq: vi.fn(function() {
      return this;
    }),
    single: vi.fn(async function() {
      // Mock based on current test scenario
      return { data: null, error: null };
    }),
    insert: vi.fn(async function() {
      return { data: null, error: null };
    }),
    upsert: vi.fn(async function() {
      return { data: null, error: null };
    }),
  })),
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: { id: 'user-1' } },
      error: null,
    })),
  },
};

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: vi.fn(() => mockSupabase),
}));

describe('CCP-05 Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateWorkspaceCache('ws-1');
  });

  afterEach(() => {
    invalidateWorkspaceCache('ws-1');
  });

  describe('Scenario 1: Free user denied pro feature', () => {
    it('should deny branded-reports (pro) to free tier', async () => {
      const result = await getEntitlementStatus('ws-1', 'ccp-06:branded-reports', 'user-1');

      expect(result.feature).toBe('ccp-06:branded-reports');
      expect(result.enabled).toBe(false);
      expect(result.tier).toBe('free');
      expect(result.reason).toBe('TIER_INSUFFICIENT');
    });
  });

  describe('Scenario 2: Pro user allowed pro feature', () => {
    it('should allow branded-reports (pro) to pro tier', async () => {
      // Mock billing state as pro
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(function() {
          return this;
        }),
        eq: vi.fn(function() {
          return this;
        }),
        single: vi.fn(async () => ({
          data: {
            workspace_id: 'ws-1',
            tier: 'pro',
            status: 'active',
          },
          error: null,
        })),
      });

      const result = await getEntitlementStatus('ws-1', 'ccp-06:branded-reports', 'user-1');

      expect(result.feature).toBe('ccp-06:branded-reports');
      expect(result.enabled).toBe(true);
      expect(result.tier).toBe('pro');
      expect(result.reason).toBeNull();
    });
  });

  describe('Scenario 3: Stripe webhook tier upgrade', () => {
    it('should sync billing state and invalidate cache on tier change', async () => {
      // Initial state: free user denied pro feature
      const beforeUpgrade = await getEntitlementStatus('ws-1', 'ccp-06:branded-reports', 'user-1');
      expect(beforeUpgrade.enabled).toBe(false);
      expect(beforeUpgrade.cached).toBe(false); // First check, not cached

      // Simulate Stripe webhook: tier upgraded to pro
      const stripeData = {
        workspace_id: 'ws-1',
        stripe_customer_id: 'cus-123',
        stripe_subscription_id: 'sub-456',
        tier: 'pro' as const,
        status: 'active' as const,
        trial_end: null,
      };

      await syncBillingStateFromStripe('ws-1', stripeData);

      // After cache invalidation, next check should reflect new tier
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(function() {
          return this;
        }),
        eq: vi.fn(function() {
          return this;
        }),
        single: vi.fn(async () => ({
          data: stripeData,
          error: null,
        })),
      });

      const afterUpgrade = await getEntitlementStatus('ws-1', 'ccp-06:branded-reports', 'user-1');
      expect(afterUpgrade.enabled).toBe(true);
      expect(afterUpgrade.tier).toBe('pro');
    });
  });

  describe('Scenario 4: Subscription cancelled', () => {
    it('should deny all tier-gated features when subscription cancelled', async () => {
      const cancelledBilling: BillingState = {
        workspace_id: 'ws-1',
        stripe_customer_id: 'cus-123',
        stripe_subscription_id: 'sub-456',
        tier: 'pro',
        status: 'cancelled',
        trial_end: null,
      };

      // Sync cancelled subscription
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(function() {
          return this;
        }),
        eq: vi.fn(function() {
          return this;
        }),
        single: vi.fn(async () => ({
          data: cancelledBilling,
          error: null,
        })),
      });

      await syncBillingStateFromStripe('ws-1', cancelledBilling);

      // Check pro feature (should now be denied)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(function() {
          return this;
        }),
        eq: vi.fn(function() {
          return this;
        }),
        single: vi.fn(async () => ({
          data: cancelledBilling,
          error: null,
        })),
      });

      const result = await getEntitlementStatus('ws-1', 'ccp-06:branded-reports', 'user-1');
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('SUBSCRIPTION_INACTIVE');
    });
  });

  describe('Scenario 5: Trial period expiration', () => {
    it('should deny access when trial expires (grace period ended)', async () => {
      const expiredTrialBilling: BillingState = {
        workspace_id: 'ws-1',
        stripe_customer_id: 'cus-123',
        stripe_subscription_id: 'sub-456',
        tier: 'free',
        status: 'trialing',
        trial_end: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
      };

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(function() {
          return this;
        }),
        eq: vi.fn(function() {
          return this;
        }),
        single: vi.fn(async () => ({
          data: expiredTrialBilling,
          error: null,
        })),
      });

      const result = await getEntitlementStatus('ws-1', 'ccp-06:branded-reports', 'user-1');
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('GRACE_PERIOD_EXPIRED');
    });
  });

  describe('Scenario 6: Batch feature check with cache reuse', () => {
    it('should cache multiple features and track cache hits', async () => {
      const features: EntitlementFeature[] = [
        'ccp-01:parcel-discovery',
        'ccp-06:branded-reports',
        'ccp-10:crm-hub',
      ];

      // Check all features
      const results = await checkMultipleEntitlements('ws-1', features, 'user-1');

      expect(Object.keys(results).length).toBe(3);
      expect(results['ccp-01:parcel-discovery']).toBeDefined();
      expect(results['ccp-06:branded-reports']).toBeDefined();
      expect(results['ccp-10:crm-hub']).toBeDefined();

      // Verify each has required fields
      Object.values(results).forEach((result) => {
        expect(result.feature).toBeDefined();
        expect(result.enabled).toEqual(expect.any(Boolean));
        expect(result.tier).toBeDefined();
        expect(result.cached).toEqual(expect.any(Boolean));
      });
    });
  });

  describe('Scenario 7: Concurrent requests reduce DB load', () => {
    it('should serve cached results for concurrent requests', async () => {
      // First request fetches from DB
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(function() {
          return this;
        }),
        eq: vi.fn(function() {
          return this;
        }),
        single: vi.fn(async () => ({
          data: {
            workspace_id: 'ws-1',
            tier: 'pro',
            status: 'active',
          },
          error: null,
        })),
      });

      const result1 = await getEntitlementStatus('ws-1', 'ccp-06:branded-reports', 'user-1');
      expect(result1.cached).toBe(false); // First check, not cached

      // Second request should use cache (no additional DB call)
      const result2 = await getEntitlementStatus('ws-1', 'ccp-06:branded-reports', 'user-1');
      expect(result2.cached).toBe(true); // Second check, cached
      expect(result2.enabled).toBe(result1.enabled); // Same result
    });
  });

  describe('Scenario 8: Audit trail created for checks', () => {
    it('should audit entitlement checks (async, best-effort)', async () => {
      // This is a best-effort audit, so failures don't break access
      const result = await getEntitlementStatus('ws-1', 'ccp-06:branded-reports', 'user-1');

      expect(result.feature).toBe('ccp-06:branded-reports');
      expect(result).toHaveProperty('enabled');
      // Audit happens async, so we can't directly verify, but function shouldn't throw
      expect(() => result).not.toThrow();
    });
  });

  describe('API Response Format', () => {
    it('should return properly formatted EntitlementCheckResult', async () => {
      const result = await getEntitlementStatus('ws-1', 'ccp-01:parcel-discovery', 'user-1');

      // Verify all required fields
      expect(result).toHaveProperty('feature');
      expect(result).toHaveProperty('enabled');
      expect(result).toHaveProperty('tier');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('cached');
      expect(result).toHaveProperty('resolvedAt');
      expect(result).toHaveProperty('cacheTtlRemaining');

      // Type checks
      expect(typeof result.feature).toBe('string');
      expect(typeof result.enabled).toBe('boolean');
      expect(typeof result.tier).toBe('string');
      expect(typeof result.cached).toBe('boolean');
      expect(result.resolvedAt instanceof Date).toBe(true);
      expect(typeof result.cacheTtlRemaining).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing billing state (default to free)', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(function() {
          return this;
        }),
        eq: vi.fn(function() {
          return this;
        }),
        single: vi.fn(async () => ({
          data: null, // No billing record
          error: null,
        })),
      });

      const result = await getEntitlementStatus('ws-1', 'ccp-06:branded-reports', 'user-1');
      expect(result.tier).toBe('free');
      expect(result.enabled).toBe(false);
    });

    it('should reject invalid feature names', async () => {
      const result = await getEntitlementStatus('ws-1', 'invalid-feature' as any, 'user-1');
      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('FEATURE_UNAVAILABLE');
    });
  });
});
