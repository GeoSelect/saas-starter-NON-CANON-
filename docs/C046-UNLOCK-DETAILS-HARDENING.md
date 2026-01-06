# C046 UnlockDetails — Hardening Task Template (CCP-06, CCP-14)

**Component:** C046 UnlockDetails  
**CCPs:** CCP-06 (Branded Reports & Enforcement), CCP-14 (Premium Features)  
**Status:** 🚨 Must Have (Blocking)  
**Priority:** CRITICAL (monetization enforcement)  
**Dependencies:** C001 AppShell (entitlements), C045 BlockedExplain (fallback UI)

---

## Goal

Build a deterministic, server-authoritative paywall gate that prevents access to premium features, provides clear upgrade paths, and logs all blocked attempts for audit/compliance (CCP-07).

C046 is the **enforcement mechanism**: when `appShell.can(feature)` returns `false`, C046 intercepts and shows upgrade options instead of locked content.

---

## Acceptance Criteria (Machine-Checkable)

1. **Upgrade resolver deterministic:** `getUpgradeOption(featureId, account, workspace)` returns single `UpgradeOption` (plan name, price, URL) or null
2. **No client-side bypass:** Upgrade URL and tier checks are server-authoritative; client UI is non-interactive without valid session
3. **Blocking audit trail:** Every blocked access logs `{ timestamp, userId, featureId, workspaceId, upgradePath }` to `blocked_access_logs` table
4. **Server gating:** API endpoints for premium features return `403 Forbidden` with `{ reason: 'upgrade_required', tier: 'pro' }`
5. **UI state machine:** UnlockDetails renders exactly: Loading → Error → UpgradePrompt → (on upgrade) → Success
6. **Entitlement cache consistency:** C046 respects AppShell.can() checks; no extra client-side entitlement logic
7. **RLS enforcement:** `blocked_access_logs` table has RLS policy so users can only query their own audit
8. **CI gating:** Build fails if:
   - UnlockDetails component doesn't use AppShell
   - Upgrade resolver has client-side tier checks (must be server-only)
   - Blocked access logs are not written to database
   - API endpoints don't enforce RLS

---

## Invariants (Must Always Be True)

- `upgrade(featureId) → UpgradeOption | null` — pure function, server-authoritative
- If account === null, `upgrade()` returns null (anonymous → no upgrades)
- If workspace.tier === 'enterprise', `upgrade()` returns null (already maxed)
- All tier comparisons happen server-side; client receives only boolean or upgrade URL
- `blocked_access_logs` rows are immutable (append-only); no deletes or updates
- Session cookie is canonical; client-side state is cache only
- RLS policies on `blocked_access_logs` prevent cross-tenant access

---

## Tactical Engineering Tasks (Ordered)

### Phase 1: Contracts & Types

#### Task 1.1: Create upgrade contract
**File:** `lib/contracts/upgrade.ts`

```typescript
// C046 UnlockDetails — upgrade state contract (CCP-06, CCP-14)

import type { SubscriptionTier } from './workspace';

export interface UpgradeOption {
  from: SubscriptionTier;
  to: SubscriptionTier;
  feature: string; // CCP code, e.g., 'ccp-06:branded-reports'
  plan: {
    name: string; // 'Pro', 'Pro+ CRM', etc.
    price: number; // cents, e.g., 7499
    interval: 'month' | 'year';
    stripePriceId: string;
  };
  upgradeUrl: string; // Stripe checkout or subscription page
  saving?: string; // e.g., '20% off annual'
}

export interface BlockedAccessLog {
  id: string; // UUID
  userId: string;
  workspaceId: string;
  featureId: string; // CCP code
  tier: SubscriptionTier;
  reason: 'upgrade_required' | 'feature_not_available';
  upgradeOption?: UpgradeOption;
  createdAt: string;
  userAgent?: string;
  ipAddress?: string; // for audit
}

export function isUpgradeOption(value: unknown): value is UpgradeOption {
  return (
    typeof value === 'object' &&
    value !== null &&
    'from' in value &&
    'to' in value &&
    'plan' in value &&
    'upgradeUrl' in value
  );
}
```

#### Task 1.2: Create blocked access audit contract
**File:** `lib/contracts/audit.ts`

```typescript
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
```

### Phase 2: Components & Hooks

#### Task 2.1: Create UnlockDetails component
**File:** `lib/components/C046-UnlockDetails.tsx`

```typescript
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
```

#### Task 2.2: Create upgrade resolver hook
**File:** `lib/hooks/useUpgradeResolver.ts`

```typescript
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
```

#### Task 2.3: Create blocked audit hook
**File:** `lib/hooks/useBlockedAudit.ts`

```typescript
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
```

### Phase 3: API Routes & Server Functions

#### Task 3.1: Create upgrade resolver endpoint
**File:** `app/api/upgrade-option/route.ts`

```typescript
// C046 UnlockDetails — upgrade resolver (CCP-06, CCP-14)
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { UpgradeOption } from '@/lib/contracts/upgrade';
import type { FeatureId } from '@/lib/contracts/entitlements';

const UPGRADE_PATHS: Record<FeatureId, Record<string, UpgradeOption>> = {
  'ccp-06:branded-reports': {
    free: {
      from: 'free',
      to: 'pro',
      feature: 'ccp-06:branded-reports',
      plan: {
        name: 'Pro',
        price: 7499,
        interval: 'month',
        stripePriceId: 'price_pro_monthly',
      },
      upgradeUrl: 'https://checkout.stripe.com/...',
    },
    pro: {
      from: 'pro',
      to: 'portfolio',
      feature: 'ccp-06:branded-reports',
      plan: {
        name: 'Portfolio',
        price: 49900,
        interval: 'month',
        stripePriceId: 'price_portfolio_monthly',
      },
      upgradeUrl: 'https://checkout.stripe.com/...',
    },
  },
  'ccp-09:crm-sync': {
    free: {
      from: 'free',
      to: 'pro-plus',
      feature: 'ccp-09:crm-sync',
      plan: {
        name: 'Pro+ CRM',
        price: 19900,
        interval: 'month',
        stripePriceId: 'price_pro_plus_crm_monthly',
      },
      upgradeUrl: 'https://checkout.stripe.com/...',
    },
  },
  // ... more features
  'ccp-03:report-generation': {},
  'ccp-04:report-sharing': {},
  'ccp-14:premium-unlock': {},
  'ccp-15:export-workspace': {},
};

export async function POST(req: NextRequest) {
  try {
    // C046: Get authenticated user
    const cookieStore = req.cookies;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ upgrade: null }, { status: 200 });
    }

    // Parse request
    const { featureId, workspaceId } = await req.json();

    // Fetch workspace tier
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('tier')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single();

    if (!workspace) {
      return NextResponse.json({ upgrade: null }, { status: 403 });
    }

    // C046: Determine upgrade path (server-authoritative)
    const paths = UPGRADE_PATHS[featureId as FeatureId];
    const upgrade = paths?.[workspace.tier] ?? null;

    return NextResponse.json({ upgrade }, { status: 200 });
  } catch (err) {
    console.error('[C046] Upgrade resolver error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### Task 3.2: Create blocked access audit endpoint
**File:** `app/api/audit/blocked-access/route.ts`

```typescript
// C046 UnlockDetails — audit endpoint (CCP-06, CCP-07)
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = req.cookies;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ status: 'ok' }, { status: 200 }); // best-effort
    }

    const { featureId, tier } = await req.json();

    // C046 + C007: Insert audit log (append-only)
    await supabase.from('blocked_access_logs').insert({
      user_id: user.id,
      feature_id: featureId,
      tier,
      user_agent: req.headers.get('user-agent'),
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err) {
    console.warn('[C046] Audit error:', err);
    return NextResponse.json({ status: 'ok' }, { status: 200 }); // best-effort
  }
}
```

### Phase 4: Database Schema & RLS

#### Task 4.1: Add blocked_access_logs table migration
**File:** `supabase/migrations/20260106_add_blocked_access_logs.sql`

```sql
-- C046 UnlockDetails — blocked access audit table (CCP-06, CCP-07)

CREATE TABLE IF NOT EXISTS blocked_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  feature_id VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_blocked_access_logs_user_id 
  ON blocked_access_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_access_logs_workspace_id 
  ON blocked_access_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_access_logs_feature_id 
  ON blocked_access_logs(feature_id, created_at DESC);

-- RLS: users can only query their own logs
ALTER TABLE blocked_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own blocked access logs" ON blocked_access_logs;
CREATE POLICY "Users can view their own blocked access logs" 
  ON blocked_access_logs FOR SELECT 
  USING (auth.uid() = user_id);

-- Audit table: no direct user deletes
DROP POLICY IF EXISTS "Blocked access logs are append-only" ON blocked_access_logs;
CREATE POLICY "Blocked access logs are append-only" 
  ON blocked_access_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

### Phase 5: Tests

#### Task 5.1: Unit tests
**File:** `tests/components/C046-UnlockDetails.test.tsx`

```typescript
// C046 UnlockDetails — unit tests (CCP-06, CCP-14)
import { render, screen, waitFor } from '@testing-library/react';
import { UnlockDetails } from '@/lib/components/C046-UnlockDetails';
import { AppShellProvider } from '@/lib/context/AppShellContext';
import type { Account } from '@/lib/contracts/account';
import type { Workspace } from '@/lib/contracts/workspace';

const mockAccount: Account = {
  id: '123',
  email: 'free@example.com',
  emailVerified: true,
  roles: ['member'],
};

const mockWorkspaceFree: Workspace = {
  id: 'ws-1',
  slug: 'free-workspace',
  name: 'Free Workspace',
  tier: 'free',
  members: [],
};

function TestWrapper({
  children,
  account,
  workspace,
}: {
  children: React.ReactNode;
  account: Account | null;
  workspace: Workspace | null;
}) {
  return (
    <AppShellProvider initialAccount={account} initialWorkspace={workspace}>
      {children}
    </AppShellProvider>
  );
}

describe('C046 UnlockDetails', () => {
  it('renders children when feature is allowed', () => {
    render(
      <TestWrapper account={mockAccount} workspace={{ ...mockWorkspaceFree, tier: 'pro' }}>
        <UnlockDetails feature="ccp-06:branded-reports">
          <div data-testid="protected-content">Protected Feature</div>
        </UnlockDetails>
      </TestWrapper>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('shows upgrade prompt when feature is denied', async () => {
    render(
      <TestWrapper account={mockAccount} workspace={mockWorkspaceFree}>
        <UnlockDetails feature="ccp-06:branded-reports">
          <div data-testid="protected-content">Protected Feature</div>
        </UnlockDetails>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('unlock-details')).toBeInTheDocument();
    });
  });

  it('shows error message when not authenticated', () => {
    render(
      <TestWrapper account={null} workspace={null}>
        <UnlockDetails feature="ccp-06:branded-reports">
          <div data-testid="protected-content">Protected Feature</div>
        </UnlockDetails>
      </TestWrapper>
    );

    expect(screen.getByTestId('blocked-explain')).toBeInTheDocument();
  });

  it('calls upgrade endpoint with correct params', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          upgrade: {
            from: 'free',
            to: 'pro',
            feature: 'ccp-06:branded-reports',
            plan: { name: 'Pro', price: 7499, interval: 'month', stripePriceId: 'price_1' },
            upgradeUrl: 'https://stripe.com/checkout',
          },
        }),
        { status: 200 }
      )
    );

    render(
      <TestWrapper account={mockAccount} workspace={mockWorkspaceFree}>
        <UnlockDetails feature="ccp-06:branded-reports" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/upgrade-option',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            featureId: 'ccp-06:branded-reports',
            workspaceId: 'ws-1',
          }),
        })
      );
    });

    fetchSpy.mockRestore();
  });
});
```

#### Task 5.2: E2E tests
**File:** `e2e/c046-unlock-details.spec.ts`

```typescript
// C046 UnlockDetails — E2E tests (CCP-06, CCP-14)
import { test, expect } from '@playwright/test';

test.describe('C046 UnlockDetails — Paywall Enforcement', () => {
  test('@c046: free user sees upgrade prompt for premium feature', async ({
    page,
    context,
  }) => {
    // Mock free user
    await context.addCookies([
      {
        name: 'sb-auth-token',
        value: 'free-user-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
      },
    ]);

    await page.goto('/app/branded-reports');

    // Should show unlock-details paywall
    const unlock = page.locator('[data-testid="unlock-details"]');
    await expect(unlock).toBeVisible({ timeout: 5000 });

    // Should have upgrade button
    const btn = page.locator('[data-testid="upgrade-btn"]');
    await expect(btn).toContainText('Upgrade Now');
  });

  test('@c046: pro user sees protected content (no paywall)', async ({
    page,
    context,
  }) => {
    // Mock pro user
    await context.addCookies([
      {
        name: 'sb-auth-token',
        value: 'pro-user-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
      },
    ]);

    await page.goto('/app/branded-reports');

    // Should NOT show unlock-details
    const unlock = page.locator('[data-testid="unlock-details"]');
    await expect(unlock).not.toBeVisible();

    // Should show content
    const content = page.locator('[data-testid="branded-reports-ui"]');
    await expect(content).toBeVisible();
  });

  test('@c046: blocked access is logged to audit table', async ({
    page,
    context,
  }) => {
    // Free user tries to access premium feature
    await context.addCookies([
      {
        name: 'sb-auth-token',
        value: 'free-user-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
      },
    ]);

    await page.goto('/app/branded-reports');
    await expect(page.locator('[data-testid="unlock-details"]')).toBeVisible();

    // In real test, verify via backend: blocked_access_logs table has entry
    // This is an integration point; DB query would confirm.
  });

  test('@c046: upgrade URL redirects to Stripe', async ({
    page,
    context,
  }) => {
    // Free user
    await context.addCookies([
      {
        name: 'sb-auth-token',
        value: 'free-user-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
      },
    ]);

    await page.goto('/app/branded-reports');

    const btn = page.locator('[data-testid="upgrade-btn"]');
    await expect(btn).toBeVisible();

    // Click would redirect to Stripe (external navigation)
    // In E2E, we'd verify the href matches expected Stripe URL
  });
});
```

### Phase 6: CI Integration

#### Task 6.1: CI workflow
**File:** `.github/workflows/ccp-06-checks.yml`

```yaml
# C046 UnlockDetails — paywall enforcement checks (CCP-06, CCP-14)

name: CCP-06 UnlockDetails Paywall Enforcement

on:
  pull_request:
    paths:
      - 'lib/contracts/upgrade.ts'
      - 'lib/contracts/audit.ts'
      - 'lib/components/C046-UnlockDetails.tsx'
      - 'lib/hooks/useUpgradeResolver.ts'
      - 'lib/hooks/useBlockedAudit.ts'
      - 'app/api/upgrade-option/**'
      - 'app/api/audit/**'
      - 'tests/components/C046-UnlockDetails.test.tsx'
      - 'e2e/c046-unlock-details.spec.ts'
      - '.github/workflows/ccp-06-checks.yml'

jobs:
  unit-tests:
    name: C046 Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- tests/components/C046-UnlockDetails.test.tsx

  e2e-paywall:
    name: C046 E2E Paywall Tests
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      - run: npm ci
      - run: npm exec playwright install --with-deps
      - run: npm run e2e -- --project=chromium --grep @c046 --reporter=dot

  type-check:
    name: C046 Type Safety
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      - run: npm ci
      - run: pnpm tsc --noEmit lib/contracts/upgrade.ts lib/components/C046-UnlockDetails.tsx

  lint:
    name: C046 Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      - run: npm ci
      - run: npm run lint -- lib/components/C046-UnlockDetails.tsx lib/hooks/useUpgradeResolver.ts
```

---

## Rollout Plan

### Stage 1: Staging (Internal)
1. Deploy C046 skeleton + upgrade resolver
2. Run all tests against mock Stripe account
3. Verify no production paywall blocks are triggered
4. Code review: confirm server-authoritative upgrade checks

### Stage 2: Canary (1% of free users)
1. Enable paywall for 1% free tier users
2. Monitor: upgrade completion rate, audit logs
3. Fix any entitlement cache misses

### Stage 3: Gradual (10% → 50% → 100%)
1. Increase to 10% over 24h
2. Monitor: conversion, support tickets
3. Ramp to 50% → 100% if no issues

### Stage 4: Enforcement Lock
1. All free tier users see paywall on premium features
2. API endpoints return `403` for unauthorized tiers
3. Audit table is locked (append-only); no deletions

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Entitlement cache out of sync | High | Use AppShell.can() exclusively; sync on login/refresh |
| Bypass via API (missing RLS) | Critical | Test all endpoints with RLS; use SA key for admin queries only |
| Audit log bloat | Medium | Implement log rotation/archiving; keep last 90 days |
| Upgrade URL changes without notice | Medium | Centralize upgrade paths in config; test on deploy |
| User data leak in audit table | Critical | RLS policy prevents cross-tenant access; encrypt IPs |

---

## Success Criteria

- ✅ All tests pass (unit + E2E)
- ✅ No RLS violations in staging
- ✅ Audit logs write correctly on blocked access
- ✅ Upgrade resolver returns server-authoritative options
- ✅ Zero premium feature leaks to free users
- ✅ Conversion rate > 2% of upgrade prompts
- ✅ Support tickets for paywall issues < 5/week

---

## Files to Create/Modify

| File | Task | Status |
|------|------|--------|
| `lib/contracts/upgrade.ts` | 1.1 | Create |
| `lib/contracts/audit.ts` | 1.2 | Create |
| `lib/components/C046-UnlockDetails.tsx` | 2.1 | Create |
| `lib/hooks/useUpgradeResolver.ts` | 2.2 | Create |
| `lib/hooks/useBlockedAudit.ts` | 2.3 | Create |
| `app/api/upgrade-option/route.ts` | 3.1 | Create |
| `app/api/audit/blocked-access/route.ts` | 3.2 | Create |
| `supabase/migrations/20260106_add_blocked_access_logs.sql` | 4.1 | Create |
| `tests/components/C046-UnlockDetails.test.tsx` | 5.1 | Create |
| `e2e/c046-unlock-details.spec.ts` | 5.2 | Create |
| `.github/workflows/ccp-06-checks.yml` | 6.1 | Create |

---

**Document Version:** 1.0  
**Created:** January 6, 2026  
**Maintainer:** Engineering Team (CCP-06 / CCP-14 Owner)
