# CCP-05 Entitlements Quick Reference

## API Endpoints

### Check Single Feature
```bash
GET /api/workspaces/[workspace_id]/entitlements/[feature]
Authorization: Bearer <token>

# Example
curl -H "Authorization: Bearer ..." \
  https://yourdomain.com/api/workspaces/ws-123/entitlements/ccp-06:branded-reports

# Response
{
  "feature": "ccp-06:branded-reports",
  "enabled": false,
  "tier": "free",
  "reason": "TIER_INSUFFICIENT",
  "cached": false,
  "resolvedAt": "2026-01-15T10:30:00Z",
  "cacheTtlRemaining": 300
}
```

### List All Features
```bash
GET /api/workspaces/[workspace_id]/entitlements
Authorization: Bearer <token>

# Response
{
  "features": {
    "ccp-01:parcel-discovery": { "enabled": true, ... },
    "ccp-06:branded-reports": { "enabled": false, "reason": "TIER_INSUFFICIENT", ... },
    ...
  },
  "tier": "pro",
  "cacheHitRate": 95,
  "timestamp": "2026-01-15T10:30:00Z"
}
```

## Feature Matrix

| Feature | Free | Pro | Pro+ | Portfolio | Enterprise |
|---------|------|-----|------|-----------|------------|
| ccp-01:parcel-discovery | ✅ | ✅ | ✅ | ✅ | ✅ |
| ccp-02:satellite-imagery | ❌ | ✅ | ✅ | ✅ | ✅ |
| ccp-03:property-history | ❌ | ✅ | ✅ | ✅ | ✅ |
| ccp-04:market-analysis | ❌ | ❌ | ✅ | ✅ | ✅ |
| ccp-05:investment-calculator | ❌ | ❌ | ✅ | ✅ | ✅ |
| ccp-06:branded-reports | ❌ | ✅ | ✅ | ✅ | ✅ |
| ccp-07:bulk-contacts-api | ❌ | ❌ | ✅ | ✅ | ✅ |
| ccp-08:webhooks-api | ❌ | ❌ | ❌ | ✅ | ✅ |
| ccp-09:csv-contact-upload | ❌ | ✅ | ✅ | ✅ | ✅ |
| ccp-10:crm-hub | ❌ | ❌ | ✅ | ✅ | ✅ |
| ccp-11:workflows | ❌ | ❌ | ❌ | ✅ | ✅ |
| ccp-12:analytics-dashboard | ❌ | ❌ | ❌ | ✅ | ✅ |
| ccp-13:export-builder | ❌ | ❌ | ❌ | ❌ | ✅ |
| ccp-14:api-keys | ❌ | ❌ | ❌ | ✅ | ✅ |

## Service Usage

### TypeScript

```typescript
import { getEntitlementStatus, checkMultipleEntitlements } from '@/lib/services/entitlements';

// Check single feature
const result = await getEntitlementStatus('ws-123', 'ccp-06:branded-reports', 'user-456');
if (result.enabled) {
  // Show feature
} else {
  // Show paywall (result.reason tells why denied)
  console.log(`Denied: ${result.reason}`);
}

// Check multiple features
const results = await checkMultipleEntitlements('ws-123', [
  'ccp-06:branded-reports',
  'ccp-10:crm-hub'
], 'user-456');

// results['ccp-06:branded-reports'] = { enabled: false, reason: 'TIER_INSUFFICIENT', ... }
// results['ccp-10:crm-hub'] = { enabled: false, reason: 'TIER_INSUFFICIENT', ... }
```

### React Hook

```typescript
import useSWR from 'swr';

function MyComponent() {
  const { data: entitlements } = useSWR(`/api/workspaces/${workspaceId}/entitlements`);

  if (entitlements?.features['ccp-06:branded-reports']?.enabled) {
    return <BrandedReports />;
  } else {
    return <UpgradePaywall feature="branded-reports" tier="pro" />;
  }
}
```

## Denial Reason Reference

| Reason | Meaning | Resolution |
|--------|---------|-----------|
| `TIER_INSUFFICIENT` | User tier too low | Upgrade subscription |
| `SUBSCRIPTION_INACTIVE` | Subscription not active | Reactivate or upgrade |
| `GRACE_PERIOD_EXPIRED` | Trial/grace ended | Start paid subscription |
| `FEATURE_DISABLED` | Admin disabled feature | Contact workspace admin |
| `TRIAL_NOT_STARTED` | Trial not yet active | Wait for trial start date |
| `FEATURE_UNAVAILABLE` | Feature doesn't exist | Check feature ID spelling |
| `SYSTEM_MAINTENANCE` | Temporary maintenance | Retry in a few minutes |
| `RATE_LIMIT_EXCEEDED` | Too many checks | Wait before next request |

## Cache Behavior

- **TTL:** 5 minutes (300 seconds)
- **Hit Rate Target:** >90%
- **Invalidation:** Automatic on Stripe webhook
- **Best Practice:** Call API once per user session, cache on client

## Tier Hierarchy

```
free (0) → pro (1) → pro_plus (2) → portfolio (3) → enterprise (4)
```

**Rule:** User must be at equal or higher tier than feature requires.

```typescript
// Example: Pro user checking pro feature
// User tier: pro (1)
// Feature requires: pro (1)
// Result: 1 >= 1 → ALLOWED ✅

// Example: Pro user checking pro_plus feature
// User tier: pro (1)
// Feature requires: pro_plus (2)
// Result: 1 >= 2 → DENIED ❌ (TIER_INSUFFICIENT)

// Example: Enterprise user checking anything
// User tier: enterprise (4)
// Feature requires: any tier
// Result: 4 >= any → ALWAYS ALLOWED ✅
```

## Database Queries

### Check Workspace Entitlements
```sql
SELECT * FROM entitlements WHERE workspace_id = 'ws-123' ORDER BY feature;
```

### View Billing State
```sql
SELECT * FROM billing_state WHERE workspace_id = 'ws-123';
```

### Audit Trail (Last 24 Hours)
```sql
SELECT
  workspace_id,
  user_id,
  feature,
  result,
  reason,
  cached,
  created_at
FROM entitlement_checks
WHERE workspace_id = 'ws-123' AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

### Cache Hit Rate (Last Hour)
```sql
SELECT
  COUNT(*) as total_checks,
  COUNT(CASE WHEN cached THEN 1 END) as cache_hits,
  ROUND(COUNT(CASE WHEN cached THEN 1 END)::float / COUNT(*) * 100, 2) as hit_rate_percent
FROM entitlement_checks
WHERE workspace_id = 'ws-123' AND created_at > now() - interval '1 hour';
```

### Find Denied Checks (Last Day)
```sql
SELECT
  reason,
  COUNT(*) as denied_count
FROM entitlement_checks
WHERE workspace_id = 'ws-123'
  AND result = false
  AND created_at > now() - interval '1 day'
GROUP BY reason
ORDER BY denied_count DESC;
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional (for monitoring)
LOG_ENTITLEMENTS_CHECKS=true
CACHE_TTL_SECONDS=300
```

## Testing

### Unit Tests
```bash
pnpm test -- tests/services/entitlements.test.ts
```

### Integration Tests
```bash
pnpm test -- tests/integration/stripe-entitlements.test.ts
```

### CI/CD
```bash
# All hardening checks
.github/workflows/ccp-05-entitlement-checks.yml
```

## Deployment

### 1. Apply Migration
```bash
npm run db:migrate -- --schema public
```

### 2. Configure Stripe Webhook
Stripe Dashboard → Webhooks → Add Endpoint:
- URL: `https://yourdomain.com/api/webhooks/stripe`
- Events: `customer.subscription.updated`, `customer.subscription.deleted`
- Copy webhook secret → `STRIPE_WEBHOOK_SECRET` env var

### 3. Deploy
```bash
git push main  # Triggers CI/CD pipeline
```

### 4. Verify
```bash
# Check entitlements initialized
SELECT COUNT(*) FROM entitlements;  -- Should be 14 * number of workspaces

# Check webhook receiving
SELECT * FROM billing_state WHERE synced_at > now() - interval '5 minutes';
```

## Troubleshooting

### Feature access wrong?
```bash
# 1. Check billing state
SELECT * FROM billing_state WHERE workspace_id = 'ws-123';

# 2. Check entitlements
SELECT * FROM entitlements WHERE workspace_id = 'ws-123' AND feature = 'ccp-06:branded-reports';

# 3. Clear cache and re-check
CALL invalidateWorkspaceCache('ws-123');

# 4. Check audit trail
SELECT * FROM entitlement_checks
WHERE workspace_id = 'ws-123' AND feature = 'ccp-06:branded-reports'
ORDER BY created_at DESC LIMIT 10;
```

### Stripe webhook not working?
```bash
# 1. Check webhook secret
echo $STRIPE_WEBHOOK_SECRET

# 2. Check Stripe Dashboard → Webhook Logs → Delivery attempts
# 3. Test manually in Stripe Dashboard → Webhooks → Send test event
# 4. Check logs for 400 Bad Request (signature mismatch)
```

### Cache not working?
```bash
# Check cache hit rate
SELECT COUNT(CASE WHEN cached THEN 1 END)::float / COUNT(*) * 100
FROM entitlement_checks
WHERE created_at > now() - interval '1 hour';

# If low (<80%), check:
# 1. Is ENTITLEMENT_CACHE_TTL_SECONDS = 300?
# 2. Are webhooks invalidating cache? (CHECK synced_at in billing_state)
# 3. Is cache clearing accidentally? (grep for clearAllCache calls)
```

## Support

- **Docs:** [CCP05-ENTITLEMENTS-HARDENING.md](CCP05-ENTITLEMENTS-HARDENING.md)
- **Service:** [lib/services/entitlements.ts](../lib/services/entitlements.ts)
- **API Routes:** [app/api/workspaces/](../app/api/workspaces/)
- **Tests:** [tests/services/entitlements.test.ts](../tests/services/entitlements.test.ts)
- **Issues:** GitHub Issues #CCP-05
