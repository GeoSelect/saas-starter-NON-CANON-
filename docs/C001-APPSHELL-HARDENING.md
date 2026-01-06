# C001 AppShell — Hardening Task Template (CCP-00)

**Component:** C001 AppShell  
**CCPs:** CCP-00 (Platform Foundation)  
**Status:** 🚨 Must Have (Blocking)  
**Priority:** CRITICAL (blocks all downstream CCPs)

---

## Goal

Establish a single authoritative source of account, workspace, and entitlement context that deterministically gates all child component rendering. Remove implicit auth assumptions and replace with explicit, auditable checks.

---

## Acceptance Criteria (Machine-Checkable)

1. **Account resolution:** `useAppShell().account` returns `null` (anonymous) or `Account` object with `id`, `email`, `roles` array
2. **Workspace resolution:** `useAppShell().workspace` returns `null` (anonymous) or `Workspace` object with `id`, `slug`, `tier` and `members` array
3. **Entitlement query:** `useAppShell().can(featureId: string): boolean` returns deterministic boolean (no heuristics)
4. **No split auth:** No page or component fetches workspace/account independently; all reads via `useAppShell()`
5. **Deterministic rendering:** Every page renders exactly one of: Loading → Error → Unauthorized → Content (no ambiguous intermediate states)
6. **Single client fetch:** AppShell calls Supabase auth exactly once at mount; subsequent updates via context subscription only
7. **TypeScript contracts:** All types exported from `lib/contracts/` and enforced via strict mode
8. **CI gating:** Build fails if:
   - Any page imports `lib/db/queries` directly (lint rule)
   - Tests don't cover Loading/Error/Unauthorized states
   - Contract types are missing `id` or canonical shape

---

## Invariants (Must Always Be True)

- `appShell.account ∈ {null, Account}` — never undefined, never partial
- `appShell.workspace ∈ {null, Workspace, AnonymousWorkspace}` — never undefined
- `entitlements(featureId, account, workspace): boolean` — pure function, idempotent
- If `account === null`, all feature checks return `false`
- If `workspace === null`, workspace-specific features return `false`
- Server-side session cookie is canonical; client state is a cache
- RLS policies on all tables enforce workspace isolation (no client-side auth tricks)

---

## Tactical Engineering Tasks (Ordered)

### Phase 1: Contracts & Types

#### Task 1.1: Create account contract
**File:** `lib/contracts/account.ts`

```typescript
// C001 AppShell — account shape contract (CCP-00)

export interface Account {
  id: string; // UUID, canonical from Supabase auth.users.id
  email: string;
  emailVerified: boolean;
  roles: AccountRole[];
  metadata?: {
    displayName?: string;
    profileUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export type AccountRole = 'admin' | 'owner' | 'member' | 'guest';

export function isAccount(value: unknown): value is Account {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    Array.isArray((value as any).roles)
  );
}
```

#### Task 1.2: Create workspace contract
**File:** `lib/contracts/workspace.ts`

```typescript
// C001 AppShell — workspace shape contract (CCP-00)

export interface Workspace {
  id: string; // UUID
  slug: string; // human-readable, unique per account
  name: string;
  tier: SubscriptionTier;
  members: WorkspaceMember[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    defaultParcelView?: 'map' | 'list';
  };
}

export interface AnonymousWorkspace {
  id: null;
  slug: 'anonymous';
  tier: 'free';
  members: [];
  isAnonymous: true;
}

export type SubscriptionTier = 'free' | 'pro' | 'pro-plus' | 'portfolio' | 'enterprise';

export interface WorkspaceMember {
  userId: string;
  role: 'admin' | 'owner' | 'member' | 'viewer';
  joinedAt: string;
}

export function isWorkspace(value: unknown): value is Workspace {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'slug' in value &&
    'tier' in value &&
    Array.isArray((value as any).members)
  );
}

export function isAnonymousWorkspace(value: unknown): value is AnonymousWorkspace {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as any).slug === 'anonymous' &&
    (value as any).isAnonymous === true
  );
}
```

#### Task 1.3: Create entitlements contract
**File:** `lib/contracts/entitlements.ts`

```typescript
// C001 AppShell — entitlements contract (CCP-00)
// Deterministic feature resolution; no guesswork.

import type { Account } from './account';
import type { Workspace, SubscriptionTier } from './workspace';

export type FeatureId =
  | 'ccp-03:report-generation'
  | 'ccp-06:branded-reports'
  | 'ccp-09:crm-sync'
  | 'ccp-14:premium-unlock'
  | 'ccp-15:export-workspace';

const tierFeatures: Record<SubscriptionTier, FeatureId[]> = {
  free: ['ccp-03:report-generation'],
  pro: ['ccp-03:report-generation', 'ccp-06:branded-reports'],
  'pro-plus': [
    'ccp-03:report-generation',
    'ccp-06:branded-reports',
    'ccp-09:crm-sync',
  ],
  portfolio: [
    'ccp-03:report-generation',
    'ccp-06:branded-reports',
    'ccp-09:crm-sync',
    'ccp-15:export-workspace',
  ],
  enterprise: [
    'ccp-03:report-generation',
    'ccp-06:branded-reports',
    'ccp-09:crm-sync',
    'ccp-14:premium-unlock',
    'ccp-15:export-workspace',
  ],
};

/**
 * Resolve whether account can access feature in workspace.
 * Server-authoritative; used to gate UI and enforce API checks.
 *
 * @param featureId The feature to check (CCP-based)
 * @param account Authenticated account or null
 * @param workspace Current workspace or null
 * @returns true if account can access feature in this workspace
 */
export function can(
  featureId: FeatureId,
  account: Account | null,
  workspace: Workspace | null,
): boolean {
  // C001 AppShell enforcement: anonymous cannot access any feature
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
}

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
  return { account, workspace, features };
}
```

---

### Phase 2: Context & Hook

#### Task 2.1: Create AppShellContext
**File:** `lib/context/AppShellContext.tsx`

```typescript
// C001 AppShell — React context for account/workspace/entitlements (CCP-00)
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Account } from '@/lib/contracts/account';
import type { Workspace } from '@/lib/contracts/workspace';
import type { EntitlementCache } from '@/lib/contracts/entitlements';
import { buildEntitlementCache, can } from '@/lib/contracts/entitlements';
import type { FeatureId } from '@/lib/contracts/entitlements';

interface AppShellContextValue {
  account: Account | null;
  workspace: Workspace | null;
  loading: boolean;
  error: Error | null;
  can: (featureId: FeatureId) => boolean;
  refresh: () => Promise<void>;
}

const AppShellContext = createContext<AppShellContextValue | undefined>(undefined);

export function AppShellProvider({
  children,
  initialAccount,
  initialWorkspace,
}: {
  children: React.ReactNode;
  initialAccount: Account | null;
  initialWorkspace: Workspace | null;
}) {
  const [account, setAccount] = useState<Account | null>(initialAccount);
  const [workspace, setWorkspace] = useState<Workspace | null>(initialWorkspace);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`Failed to refresh account: ${res.statusText}`);
      }
      const { account: newAccount, workspace: newWorkspace } = await res.json();
      setAccount(newAccount ?? null);
      setWorkspace(newWorkspace ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const value: AppShellContextValue = {
    account,
    workspace,
    loading,
    error,
    can: (featureId: FeatureId) => can(featureId, account, workspace),
    refresh,
  };

  return (
    <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
  );
}

export function useAppShell(): AppShellContextValue {
  const context = useContext(AppShellContext);
  if (context === undefined) {
    throw new Error('useAppShell must be used within AppShellProvider');
  }
  return context;
}
```

#### Task 2.2: Create useAppShell hook (export)
**File:** `lib/hooks/useAppShell.ts`

```typescript
// C001 AppShell — public hook export (CCP-00)
export { useAppShell } from '@/lib/context/AppShellContext';
```

---

### Phase 3: AppShell Component

#### Task 3.1: Create AppShell root component
**File:** `app/C001-AppShell.tsx`

```typescript
// C001 AppShell — root platform container (CCP-00)
import { AppShellProvider } from '@/lib/context/AppShellContext';
import { getServerSession } from '@/lib/auth/server'; // or your server auth function
import type { Account } from '@/lib/contracts/account';
import type { Workspace } from '@/lib/contracts/workspace';

export default async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side: fetch canonical session
  let account: Account | null = null;
  let workspace: Workspace | null = null;

  try {
    const session = await getServerSession();
    if (session?.user) {
      account = {
        id: session.user.id,
        email: session.user.email ?? '',
        emailVerified: session.user.email_confirmed_at !== null,
        roles: session.user.roles ?? [],
        metadata: {
          displayName: session.user.user_metadata?.displayName,
          profileUrl: session.user.user_metadata?.profileUrl,
          createdAt: session.user.created_at,
          updatedAt: session.user.updated_at,
        },
      };

      // TODO: Fetch default workspace for account
      // workspace = await getDefaultWorkspace(session.user.id);
    }
  } catch (err) {
    console.error('[C001] AppShell: failed to fetch server session', err);
  }

  return (
    <AppShellProvider initialAccount={account} initialWorkspace={workspace}>
      {children}
    </AppShellProvider>
  );
}
```

---

### Phase 4: EntitlementGate Helper

#### Task 4.1: Create EntitlementGate component
**File:** `lib/components/EntitlementGate.tsx`

```typescript
// C001 AppShell — entitlement-based conditional rendering (CCP-00)
'use client';

import { useAppShell } from '@/lib/hooks/useAppShell';
import type { FeatureId } from '@/lib/contracts/entitlements';
import React from 'react';

interface EntitlementGateProps {
  feature: FeatureId;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function EntitlementGate({
  feature,
  fallback,
  children,
}: EntitlementGateProps) {
  const appShell = useAppShell();

  if (appShell.loading) {
    return <div className="text-center text-gray-500">Loading...</div>;
  }

  if (appShell.error) {
    return (
      <div className="text-center text-red-500">
        Error: {appShell.error.message}
      </div>
    );
  }

  const hasAccess = appShell.can(feature);

  return <>{hasAccess ? children : fallback}</>;
}
```

---

### Phase 5: Invariant Checks & Linting

#### Task 5.1: ESLint rule (custom)
**File:** `.eslintrc.js` (add to rules)

```javascript
// C001 AppShell — enforce useAppShell contract
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "@/lib/db/queries",
            "message": "C001 AppShell: use useAppShell() hook instead of direct queries"
          }
        ]
      }
    ]
  }
}
```

#### Task 5.2: Contract scan script
**File:** `scripts/contract-scan.ts`

```typescript
// C001 AppShell — build-time contract validation (CCP-00)
import fs from 'fs';
import path from 'path';

const FORBIDDEN_PATTERNS = [
  /import\s+.*from\s+['"]@\/lib\/db\/queries['"]/,
  /from\s+['"]@\/lib\/payments\/queries['"]/,
];

const WHITELIST = [
  'lib/context/',
  'lib/hooks/',
  'lib/contracts/',
];

function scanFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const errors: string[] = [];

  const isWhitelisted = WHITELIST.some(pattern => filePath.includes(pattern));
  if (isWhitelisted) return errors;

  FORBIDDEN_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) {
      errors.push(
        `${filePath}: violates C001 AppShell — uses forbidden import\n` +
        `Pattern: ${pattern.source}`
      );
    }
  });

  return errors;
}

function scanDir(dir: string): string[] {
  const errors: string[] = [];
  const files = fs.readdirSync(dir, { recursive: true });

  files.forEach(file => {
    if (
      typeof file === 'string' &&
      (file.endsWith('.tsx') || file.endsWith('.ts')) &&
      !file.includes('node_modules')
    ) {
      const filePath = path.join(dir, file);
      errors.push(...scanFile(filePath));
    }
  });

  return errors;
}

// Run
const errors = scanDir('app');
if (errors.length > 0) {
  console.error('❌ C001 Contract Violations:\n', errors.join('\n'));
  process.exit(1);
}
console.log('✅ C001 AppShell contracts validated');
```

---

### Phase 6: Tests

#### Task 6.1: Unit tests — AppShell context
**File:** `tests/hooks/useAppShell.test.ts`

```typescript
// C001 AppShell — unit tests for context and entitlements (CCP-00)
import { render, screen } from '@testing-library/react';
import { AppShellProvider, useAppShell } from '@/lib/context/AppShellContext';
import type { Account } from '@/lib/contracts/account';
import type { Workspace } from '@/lib/contracts/workspace';

const mockAccount: Account = {
  id: '123',
  email: 'test@example.com',
  emailVerified: true,
  roles: ['member'],
};

const mockWorkspace: Workspace = {
  id: 'ws-1',
  slug: 'test-workspace',
  name: 'Test Workspace',
  tier: 'pro',
  members: [],
};

function TestComponent() {
  const { account, workspace, can, loading, error } = useAppShell();
  return (
    <div>
      <div data-testid="account">{account?.email ?? 'null'}</div>
      <div data-testid="workspace">{workspace?.slug ?? 'null'}</div>
      <div data-testid="can-report">{can('ccp-03:report-generation') ? 'yes' : 'no'}</div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="error">{error?.message ?? 'null'}</div>
    </div>
  );
}

describe('C001 AppShell — useAppShell hook', () => {
  it('returns initial account and workspace', () => {
    render(
      <AppShellProvider initialAccount={mockAccount} initialWorkspace={mockWorkspace}>
        <TestComponent />
      </AppShellProvider>
    );
    expect(screen.getByTestId('account')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('workspace')).toHaveTextContent('test-workspace');
  });

  it('allows feature check for pro tier', () => {
    render(
      <AppShellProvider initialAccount={mockAccount} initialWorkspace={mockWorkspace}>
        <TestComponent />
      </AppShellProvider>
    );
    expect(screen.getByTestId('can-report')).toHaveTextContent('yes');
  });

  it('denies feature for anonymous', () => {
    render(
      <AppShellProvider initialAccount={null} initialWorkspace={null}>
        <TestComponent />
      </AppShellProvider>
    );
    expect(screen.getByTestId('can-report')).toHaveTextContent('no');
  });
});
```

#### Task 6.2: E2E tests — AppShell gating
**File:** `e2e/appshell.spec.ts`

```typescript
// C001 AppShell — end-to-end gating behavior (CCP-00)
import { test, expect } from '@playwright/test';

test('Anonymous user sees blocked content', async ({ page }) => {
  await page.goto('/app');
  // AppShell should render loading, then unauthorized state
  await expect(page.locator('[data-testid="unauthorized"]')).toBeVisible({ timeout: 5000 });
});

test('Authenticated user sees dashboard', async ({ page, context }) => {
  // Set auth cookie (mock)
  await context.addCookies([{
    name: 'auth-token',
    value: 'test-token',
    domain: 'localhost',
    path: '/',
  }]);
  
  await page.goto('/app');
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 5000 });
});

test('Paywall blocks premium feature', async ({ page, context }) => {
  // Auth with free tier
  await context.addCookies([{
    name: 'auth-token',
    value: 'free-user-token',
    domain: 'localhost',
    path: '/',
  }]);
  
  await page.goto('/app/reports/premium');
  await expect(page.locator('[data-testid="blocked-explain"]')).toBeVisible();
});
```

---

### Phase 7: CI Integration

#### Task 7.1: Add CI workflow
**File:** `.github/workflows/ccp-00-checks.yml`

```yaml
# C001 AppShell — hardening CI checks (CCP-00)
name: CCP-00 AppShell Checks

on:
  pull_request:
    paths:
      - 'lib/contracts/**'
      - 'lib/context/**'
      - 'lib/hooks/**'
      - 'app/C001-*'
      - 'tests/hooks/useAppShell.test.ts'
      - 'e2e/appshell.spec.ts'

jobs:
  contract-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec ts-node scripts/contract-scan.ts
        name: 'C001: Scan for contract violations'

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint -- lib/contracts lib/context lib/hooks
        name: 'C001: Lint contracts and hooks'

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test -- tests/hooks/useAppShell.test.ts
        name: 'C001: Run AppShell unit tests'

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec playwright install
      - run: pnpm build
      - run: pnpm preview &
      - run: pnpm exec playwright test e2e/appshell.spec.ts
        name: 'C001: Run AppShell e2e tests'
```

---

## Rollout Plan

### Stage 1: Staging (Internal)
1. Create feature branch: `feat/C001-appshell-hardening`
2. Implement all Phase 1–7 tasks
3. Run full test suite (unit + e2e)
4. Code review: verify contracts are enforced

### Stage 2: Feature Flag (Prod, Opt-In)
1. Deploy with feature flag `FEATURE_APPSHELL_V2=false`
2. Enable for internal staff + early adopters
3. Monitor: session errors, entitlement mismatches, performance
4. Fix any contract violations (should be zero)

### Stage 3: Gradual Rollout (Prod, %Rollout)
1. Enable for 10% of users
2. Monitor for 24h
3. Ramp to 50% → 100% if no errors
4. Remove feature flag after 1 week at 100%

### Stage 4: Cleanup
1. Delete old auth patterns (if any)
2. Update API routes to use AppShell (via useAppShell on client)
3. Remove fallback direct query logic
4. Close feat branch with final commit

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Breaking existing pages that fetch workspace directly | High | Contract scan + staged rollout + comprehensive tests |
| Entitlement cache out of sync with server | High | Refresh hook + subscription to auth state changes |
| Client-side entitlement check bypass | Critical | Server enforces RLS + API checks (client is UI only) |
| Performance: context re-renders | Medium | Memoize context value + use SuspenseList for loading states |
| Leaking sensitive data in entitlements | Critical | Entitlements return only boolean flags; server is authoritative |

---

## Success Criteria (Acceptance)

- ✅ All tasks 1.1–7.1 complete and tested
- ✅ Contract scan passes (zero violations in prod deploy)
- ✅ E2E tests pass in staging (loading → unauthorized → content)
- ✅ No entitlement mismatches or permission errors in prod logs
- ✅ Latency < 100ms for entitlement checks (cached)
- ✅ Zero security incidents during rollout
- ✅ All pages render deterministic state (no ambiguous intermediate states)

---

## Files to Create/Modify

| File | Task | Status |
|------|------|--------|
| `lib/contracts/account.ts` | 1.1 | Create |
| `lib/contracts/workspace.ts` | 1.2 | Create |
| `lib/contracts/entitlements.ts` | 1.3 | Create |
| `lib/context/AppShellContext.tsx` | 2.1 | Create |
| `lib/hooks/useAppShell.ts` | 2.2 | Create |
| `app/C001-AppShell.tsx` | 3.1 | Create |
| `lib/components/EntitlementGate.tsx` | 4.1 | Create |
| `.eslintrc.js` | 5.1 | Modify |
| `scripts/contract-scan.ts` | 5.2 | Create |
| `tests/hooks/useAppShell.test.ts` | 6.1 | Create |
| `e2e/appshell.spec.ts` | 6.2 | Create |
| `.github/workflows/ccp-00-checks.yml` | 7.1 | Create |

---

## Next Actions

1. **Review this template** — confirm acceptance criteria and invariants
2. **Create feature branch:** `git checkout -b feat/C001-appshell-hardening`
3. **Execute Phase 1–3:** Create all contract, context, and component files
4. **Execute Phase 4–5:** Add gating helper and lint rules
5. **Execute Phase 6–7:** Add tests and CI workflow
6. **Commit & open PR** with conventional message:
   ```
   feat(C001): add AppShell skeleton + context + entitlements (CCP-00)
   
   - Add account, workspace, entitlements contracts
   - Implement AppShellProvider + useAppShell hook
   - Add EntitlementGate helper for conditional rendering
   - Add contract scan + ESLint rules
   - Add unit and e2e tests
   
   Closes #<issue>
   ```

---

**Document Version:** 1.0  
**Created:** January 6, 2026  
**Last Updated:** January 6, 2026  
**Maintainer:** Engineering Team (CCP-00 Owner)
