# Flag Architecture Quick Reference Guide

**Quick Links:**
- Full Analysis: [BUILD_CODE_DESIGN_STATUS_REPORT.md](./BUILD_CODE_DESIGN_STATUS_REPORT.md)
- Feature Gating: [docs/FEATURE_GATING_README.md](./docs/FEATURE_GATING_README.md)
- Entitlements: [docs/CCP05-ENTITLEMENTS-QUICK-REFERENCE.md](./docs/CCP05-ENTITLEMENTS-QUICK-REFERENCE.md)
- CCP Status: [CCP-STATUS-OVERVIEW.md](./CCP-STATUS-OVERVIEW.md)

---

## At a Glance

| Flag Type | Status | Location | Use Case |
|-----------|--------|----------|----------|
| **Entitlement Flags** | 🟢 Production-Ready | `lib/services/entitlements.ts` | Subscription tier-based access |
| **Feature Flags** | 🟡 Demo Mode | `lib/features/index.ts` | Static feature definitions |
| **Release Flags** | 🔴 Missing | N/A | Environment-based rollout |
| **Operational Flags** | 🟡 Basic | `.env.example` | Runtime configuration |
| **CCP-01 Context** | 🟢 Production-Ready | `app/api/location/resolve/route.ts` | Location resolution |

---

## How to Use Each System

### 1. Entitlement Flags (✅ Use This for Tier-Based Features)

**When to use:** You want to gate a feature behind a subscription tier (Free/Pro/Portfolio/Enterprise)

```typescript
// Server-side check
import { getEntitlementStatus } from '@/lib/services/entitlements';

const result = await getEntitlementStatus(
  workspaceId,
  'ccp-09:contact-upload',
  userId
);

if (!result.enabled) {
  return { error: 'Upgrade to Pro Plus required' };
}

// Proceed with feature
```

**Client-side usage:**
```typescript
import { useFeatureGating } from '@/lib/hooks/useFeatureGating';

const { hasAccess } = useFeatureGating({ userPlan: 'pro' });

if (!hasAccess('crm-contacts')) {
  return <UpgradePrompt />;
}
```

**Available Entitlements:**
- `ccp-01:parcel-discovery` (Free)
- `ccp-06:branded-reports` (Pro)
- `ccp-09:contact-upload` (Pro Plus)
- `ccp-10:collaboration` (Portfolio)
- ... [see full list in entitlements.ts]

---

### 2. Feature Flags (⚠️ Demo Mode - Not for Production)

**When to use:** Demo/prototype only. Don't use for production feature gating.

```typescript
import { hasFeature } from '@/lib/features';

if (hasFeature('studio', 'ai-insights')) {
  // Show AI features
}
```

**⚠️ Limitations:**
- Hard-coded, no runtime toggles
- Requires code deployment to change
- Not integrated with billing system

**Recommendation:** Use Entitlement Flags instead for production.

---

### 3. Release Flags (❌ Not Implemented)

**Status:** Missing - needs implementation

**What it should do:**
- Control feature availability by environment (dev/staging/prod)
- Progressive rollout (10% → 50% → 100%)
- User/workspace targeting for early access

**Workaround:** Use environment variables for now
```typescript
if (process.env.NODE_ENV === 'production' && NEW_FEATURE_ENABLED) {
  // Show new feature
}
```

---

### 4. Operational Flags (⚠️ Basic Only)

**When to use:** Runtime configuration and environment-specific behavior

**Current capabilities:**
```typescript
// Environment detection
if (process.env.NODE_ENV === 'production') {
  // Production-only logic
}

// Feature availability
if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY) {
  // Enable Google Maps features
}
```

**⚠️ Missing:**
- Maintenance mode flag
- Circuit breakers
- Rate limit controls
- Observability level toggles

---

### 5. CCP-01 Context Resolution (✅ Use This for Location)

**When to use:** Resolve user location/address to normalized coordinates

```typescript
// API call
const response = await fetch('/api/location/resolve', {
  method: 'POST',
  body: JSON.stringify({
    mode: 'point',
    lat: 39.7392,
    lng: -105.0844,
    source: 'device'
  })
});

const { data } = await response.json();
// data.location_id - Use this for parcel lookup
// data.geometry - GeoJSON point
// data.confidence - Resolution confidence (0-1)
```

**Contract Guarantees:**
- ✅ Frozen API contract (won't change without version bump)
- ✅ Validated input/output shapes
- ✅ Clear error codes (LOCATION_NOT_ALLOWED, LOCATION_INVALID)

---

## Decision Tree: Which Flag System to Use?

```
┌─────────────────────────────────────────┐
│ What are you trying to gate?           │
└───────────┬─────────────────────────────┘
            │
            ├─ Subscription tier feature? ────► Use Entitlement Flags (CCP-05)
            │                                     ✅ Production-ready
            │
            ├─ Environment-specific rollout? ──► ❌ Not implemented
            │                                     Use env vars as workaround
            │
            ├─ Runtime configuration? ─────────► Use Operational Flags (.env)
            │                                     ⚠️  Basic, needs enhancement
            │
            ├─ Location/address lookup? ────────► Use CCP-01 (/api/location/resolve)
            │                                     ✅ Production-ready
            │
            └─ Demo/prototype feature? ─────────► Use Feature Flags (C046)
                                                  ⚠️  Demo mode only
```

---

## Common Patterns

### Pattern 1: Check Entitlement + Gate UI

```typescript
// Server action
export async function createReport(workspaceId: string) {
  // Check entitlement
  const status = await getEntitlementStatus(
    workspaceId,
    'ccp-03:report-generation'
  );
  
  if (!status.enabled) {
    throw new Error('Upgrade required');
  }
  
  // Create report
  return createReportInDb(...);
}

// Client component
export function ReportButton() {
  const { hasAccess } = useFeatureGating({ userPlan });
  
  if (!hasAccess('custom-reports')) {
    return <UpgradeButton feature="custom-reports" />;
  }
  
  return <CreateReportButton />;
}
```

### Pattern 2: Environment-Based Feature Toggle

```typescript
// Current workaround (until release flags implemented)
const NEW_ANALYTICS_ENABLED = 
  process.env.NODE_ENV === 'production' && 
  process.env.ENABLE_NEW_ANALYTICS === 'true';

if (NEW_ANALYTICS_ENABLED) {
  return <NewAnalyticsDashboard />;
}

return <LegacyAnalyticsDashboard />;
```

### Pattern 3: Location Resolution Flow

```typescript
// 1. Resolve location
const locationResult = await fetch('/api/location/resolve', {
  method: 'POST',
  body: JSON.stringify({
    mode: 'point',
    lat: userLat,
    lng: userLng
  })
});

const { data } = await locationResult.json();

// 2. Use location_id for next step (e.g., parcel lookup)
const parcel = await resolveParcel(data.location_id);
```

---

## Migration Guide: Moving to Production

### Step 1: Replace Feature Flags with Entitlement Flags

**Before:**
```typescript
if (hasFeature(userPlan, 'ai-insights')) {
  // ...
}
```

**After:**
```typescript
const status = await getEntitlementStatus(
  workspaceId,
  'ccp-14:premium-features',
  userId
);

if (status.enabled) {
  // ...
}
```

### Step 2: Implement Release Flag System

**Create:** `lib/flags/release-flags.ts`

```typescript
export interface ReleaseFlag {
  featureId: string;
  environments: {
    development: boolean;
    staging: boolean;
    production: boolean;
  };
  rolloutPercentage: number; // 0-100
}

export async function isFeatureReleased(
  featureId: string,
  environment: string,
  userId?: string
): Promise<boolean> {
  // Implementation needed
}
```

### Step 3: Add Operational Flags

**Create:** `lib/flags/operational-flags.ts`

```typescript
export async function isMaintenanceMode(): Promise<boolean> {
  // Check Redis/database for maintenance flag
  return false;
}

export async function isServiceHealthy(service: string): Promise<boolean> {
  // Check circuit breaker state
  return true;
}
```

---

## Testing

### Test Entitlement Checks

```typescript
import { getEntitlementStatus } from '@/lib/services/entitlements';
import { describe, it, expect } from 'vitest';

describe('Entitlement Checks', () => {
  it('denies access for free tier users', async () => {
    const result = await getEntitlementStatus(
      'workspace-free',
      'ccp-09:contact-upload'
    );
    
    expect(result.enabled).toBe(false);
    expect(result.reason).toBe('TIER_INSUFFICIENT');
  });
  
  it('allows access for pro_plus tier', async () => {
    const result = await getEntitlementStatus(
      'workspace-pro-plus',
      'ccp-09:contact-upload'
    );
    
    expect(result.enabled).toBe(true);
    expect(result.reason).toBeNull();
  });
});
```

### Test CCP-01 Context Resolution

```typescript
import { POST } from '@/app/api/location/resolve/route';
import { describe, it, expect } from 'vitest';

describe('CCP-01 Location Resolution', () => {
  it('resolves valid coordinates', async () => {
    const req = new Request('http://localhost/api/location/resolve', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'point',
        lat: 39.7392,
        lng: -105.0844
      })
    });
    
    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.location_id).toBeDefined();
    expect(json.data.geometry.type).toBe('Point');
  });
});
```

---

## Troubleshooting

### Issue: Entitlement check returns "cached: true" but billing changed

**Solution:** Invalidate workspace cache after billing changes

```typescript
import { invalidateWorkspaceCache } from '@/lib/services/entitlements';

// After Stripe webhook updates billing
await syncBillingStateFromStripe(workspaceId, stripeData);
invalidateWorkspaceCache(workspaceId); // Force cache refresh
```

### Issue: User should have access but entitlement check fails

**Debug steps:**
1. Check workspace billing state: `SELECT * FROM billing_state WHERE workspace_id = ?`
2. Check tier requirement: `TIER_REQUIREMENTS['ccp-XX:feature']`
3. Check audit log: `SELECT * FROM entitlement_checks WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 10`

### Issue: CCP-01 returns LOCATION_NOT_ALLOWED

**Reason:** Location is outside allowed region (configured in database)

**Solution:** Check `allowed_regions` table or remove region restrictions

---

## Best Practices

### ✅ Do This

1. **Always check entitlements server-side** before performing privileged operations
2. **Cache entitlement results** (5-minute TTL already implemented)
3. **Log all entitlement checks** (audit trail for compliance)
4. **Use CCP-01 for location normalization** (don't roll your own)
5. **Invalidate cache after billing changes** (ensure consistency)

### ❌ Don't Do This

1. **Don't use Feature Flags (C046) for production** - Use Entitlement Flags
2. **Don't bypass entitlement checks** - Always validate access
3. **Don't implement your own location resolution** - Use CCP-01
4. **Don't trust client-side flag checks** - Always verify server-side
5. **Don't hardcode tier requirements** - Use contracts in `entitlements.ts`

---

## Related Documentation

- **Full Analysis:** [BUILD_CODE_DESIGN_STATUS_REPORT.md](./BUILD_CODE_DESIGN_STATUS_REPORT.md)
- **Entitlements Contract:** `lib/contracts/ccp05/entitlements.ts`
- **Entitlements Service:** `lib/services/entitlements.ts`
- **Feature Gating Demo:** `app/(dashboard)/feature-gating/page.tsx`
- **CCP-01 Implementation:** `app/api/location/resolve/route.ts`
- **CCP Overview:** [CCP-STATUS-OVERVIEW.md](./CCP-STATUS-OVERVIEW.md)

---

## Support & Questions

For questions about the flag architecture:
1. Review the full report: [BUILD_CODE_DESIGN_STATUS_REPORT.md](./BUILD_CODE_DESIGN_STATUS_REPORT.md)
2. Check CCP status: [CCP-STATUS-OVERVIEW.md](./CCP-STATUS-OVERVIEW.md)
3. Review specific implementation files listed above

**Last Updated:** January 10, 2026
