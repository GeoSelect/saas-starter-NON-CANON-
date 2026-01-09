# CCP-10 Collaboration / Share Links Integration

## Overview

CCP-10 provides advanced collaboration features including role-based share links, time-limited access, recipient tracking, and comprehensive audit trails. This feature is available exclusively in the **Portfolio Plan** ($199/month).

## Key Components

### 1. Plan Definitions (`lib/plans/definitions.ts`)

Centralized plan configuration defining three subscription tiers:

- **Home Plan** ($29/month): Basic features, no CCP-10
- **Studio Plan** ($79/month): Professional features, no CCP-10  
- **Portfolio Plan** ($199/month): **Includes CCP-10 collaboration**

Each plan includes:
- Tier mapping (free/pro/pro_plus/portfolio)
- Feature list and CCP mappings
- Entitlements configuration
- Usage limits (users, storage, reports)

### 2. Entitlement System

#### Database Schema (`migrations/009_ccp05_entitlements.sql`)
- CCP-10 initialized as `'ccp-10:collaboration'` feature
- Mapped to `'pro_plus'` tier requirement
- Default state: disabled with `'TIER_INSUFFICIENT'` reason code
- Auto-enables when user upgrades to Portfolio or higher

#### Entitlement Service (`lib/services/entitlements.ts`)
- Server-authoritative checks with 5-minute cache
- `getEntitlementStatus()` - Check feature access
- Audit trail logging for compliance
- Stripe webhook integration for tier sync

#### Contracts (`lib/contracts/ccp05/entitlements.ts`)
```typescript
TIER_REQUIREMENTS['ccp-10:collaboration'] = 'pro_plus'
```

Tier hierarchy:
```
free < pro < pro_plus < portfolio < enterprise
```

### 3. API Routes

#### `/api/share-links/create` (NEW)
Gated endpoint for creating advanced share links with entitlement enforcement.

**Request:**
```json
{
  "snapshot_id": "uuid",
  "workspace_id": "uuid",
  "expires_at": "2026-02-01T00:00:00Z",
  "max_views": 100,
  "requires_auth": false,
  "recipient_email": "user@example.com",
  "access_role": "viewer",
  "metadata": {}
}
```

**Success Response (200):**
```json
{
  "success": true,
  "share_link": {
    "id": "uuid",
    "token": "base64-token",
    "short_code": "abc123",
    "url": "https://app.example.com/share/token",
    "short_url": "https://app.example.com/s/abc123",
    "expires_at": "2026-02-01T00:00:00Z",
    "access_role": "viewer",
    "max_views": 100,
    "created_at": "2026-01-08T20:00:00Z"
  }
}
```

**Payment Required Response (402):**
```json
{
  "error": "Upgrade required",
  "message": "Advanced collaboration features require the Portfolio plan",
  "feature": "ccp-10:collaboration",
  "reason": "TIER_INSUFFICIENT",
  "current_tier": "pro",
  "required_tier": "portfolio",
  "upgrade_url": "/pricing",
  "details": {
    "available_in": "Portfolio Plan",
    "price": "$199/month",
    "benefits": [
      "Role-based share links (viewer/commenter/editor)",
      "Time-limited links with expiration",
      "Recipient tracking and analytics",
      "Complete audit trails",
      "Unlimited share links"
    ]
  }
}
```

### 4. UI Components

#### `<ShareReportButton />` (`components/ShareReportButton.tsx`)
Client component for creating share links with entitlement handling.

**Usage:**
```tsx
<ShareReportButton
  snapshotId="report-snapshot-id"
  workspaceId="workspace-id"
  buttonText="Share Report"
  variant="primary"
  shareOptions={{
    expiresAt: new Date('2026-02-01'),
    maxViews: 100,
    requiresAuth: false,
    recipientEmail: 'user@example.com',
    accessRole: 'viewer'
  }}
  onSuccess={(shareLink) => console.log('Created:', shareLink)}
  onError={(error) => console.error('Error:', error)}
/>
```

**Features:**
- Loading state with spinner
- Success state with checkmark and "Link copied!" message
- Error handling with inline error display
- Automatic clipboard copy on success
- Shows paywall modal on 402 response

#### `<ShareLinkPaywall />` (`components/ShareLinkPaywall.tsx`)
Paywall component shown when users attempt to use CCP-10 without Portfolio plan.

**Usage:**
```tsx
<ShareLinkPaywall
  title="Upgrade to Portfolio Plan"
  message="Advanced collaboration features require the Portfolio plan"
  variant="modal" // or "inline"
  onUpgrade={() => router.push('/pricing')}
/>
```

**Features:**
- Lock icon and professional styling
- Portfolio plan benefits list
- Pricing display ($199/month)
- CTA buttons for upgrade and plan comparison
- Contact sales link

### 5. Feature Matrix (`lib/features/index.ts`)

Added new feature type:
```typescript
'share-link-management': {
  id: 'share-link-management',
  name: 'Advanced Share Links',
  description: 'Role-based share links with time limits, recipient tracking, and audit trails (CCP-10)',
  category: 'admin',
  minPlanRequired: 'portfolio'
}
```

Updated existing features:
- `team-collaboration`: now requires `portfolio` (aligned with CCP-10)
- `audit-trail`: now requires `portfolio` (aligned with CCP-10)

### 6. Middleware Helpers (`lib/auth/middleware.ts`)

New helper functions:

#### `requireEntitlement()`
```typescript
const auth = await requireEntitlement(request, 'can_share_collaboration');
if (!auth) {
  return forbiddenResponse('Access denied');
}
```

#### `forbiddenResponse()`
```typescript
return forbiddenResponse('User does not have permission');
```

## Integration Flow

### 1. User Attempts to Share
```
User clicks <ShareReportButton /> 
  → POST /api/share-links/create
  → Authenticate user
  → Check workspace membership
  → Check CCP-10 entitlement
```

### 2. Entitlement Check
```
getEntitlementStatus(workspace_id, 'ccp-10:collaboration', user_id)
  → Check cache (5-min TTL)
  → Get billing_state from database
  → Determine tier from Stripe subscription
  → Compare user tier vs required tier (pro_plus)
  → Return enabled/disabled with reason
```

### 3. Response Handling

**Portfolio Plan Users (allowed):**
```
✓ Entitlement enabled
→ createShareLink() called
→ Generate secure token + short code
→ Store in database
→ Log audit event (CCP-15)
→ Return share link with URLs
→ UI shows "Link copied!" message
```

**Home/Studio Plan Users (denied):**
```
✗ Entitlement disabled (TIER_INSUFFICIENT)
→ Return 402 Payment Required
→ UI shows <ShareLinkPaywall /> modal
→ User sees upgrade benefits
→ CTA buttons redirect to /pricing
```

## Stripe Webhook Integration

When subscription changes occur:

```typescript
// Stripe webhook handler updates billing_state
syncBillingStateFromStripe(workspaceId, {
  customerId: 'cus_xxx',
  subscriptionId: 'sub_xxx',
  tier: 'portfolio', // User upgraded!
  status: 'active',
  webhookEventId: 'evt_xxx'
});

// Trigger automatically updates entitlements
// Invalidates cache for workspace
// CCP-10 becomes enabled
```

Database trigger `sync_entitlements_from_billing()` automatically:
1. Updates all entitlements for workspace
2. Enables features where `tier <= user_tier`
3. Clears entitlement cache
4. User can immediately use CCP-10 features

## Security & Compliance

### Server-Side Enforcement
- **ALL** entitlement checks happen server-side
- UI components cannot bypass checks
- Database RLS policies provide defense-in-depth
- Audit trail logs every check (CCP-15)

### Token Security
- Cryptographically secure tokens (32 bytes, base64)
- Short codes for user-friendly URLs
- Tokens are unguessable and non-sequential
- Support for expiration and max views
- Revocation support with audit events

### Audit Trail
Every share link operation logged:
- `created` - Link created by user
- `viewed` - Link accessed by recipient
- `revoked` - Link manually disabled
- `expired` - Link reached expiration
- `access_denied` - Failed access attempt

Logs include:
- Actor user ID
- IP address
- User agent
- Timestamp
- Metadata

## Testing

### Unit Tests (`__tests__/ccp10.entitlements.test.ts`)

```bash
npm test -- __tests__/ccp10.entitlements.test.ts
```

Tests cover:
- CCP-10 tier mapping (pro_plus)
- Tier hierarchy validation
- Plan entitlements configuration
- Feature matrix inclusion
- Minimum plan requirements

### Integration Testing

Manual test scenarios:

1. **Home Plan User:**
   ```
   - Attempt to create share link
   - Verify 402 response
   - Verify paywall shown
   - Verify upgrade CTA works
   ```

2. **Portfolio Plan User:**
   ```
   - Create share link successfully
   - Verify link works
   - Verify audit trail logged
   - Verify recipient tracking
   ```

3. **Subscription Change:**
   ```
   - Upgrade from Studio to Portfolio
   - Verify webhook processes
   - Verify CCP-10 immediately enabled
   - Create share link successfully
   ```

4. **Subscription Cancellation:**
   ```
   - Cancel Portfolio subscription
   - Verify CCP-10 disabled
   - Attempt share link creation
   - Verify 402 response
   ```

## API Examples

### Create Share Link (cURL)
```bash
curl -X POST https://app.example.com/api/share-links/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "snapshot_id": "550e8400-e29b-41d4-a716-446655440000",
    "workspace_id": "660e8400-e29b-41d4-a716-446655440000",
    "expires_at": "2026-02-01T00:00:00Z",
    "max_views": 100,
    "access_role": "viewer"
  }'
```

### Check Entitlement (cURL)
```bash
curl https://app.example.com/api/workspaces/$WORKSPACE_ID/entitlements/ccp-10:collaboration \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Issue: User has Portfolio plan but CCP-10 disabled

**Diagnosis:**
```sql
-- Check billing_state
SELECT tier, status, synced_at 
FROM billing_state 
WHERE workspace_id = '<workspace_id>';

-- Check entitlement
SELECT enabled, reason_code, updated_at
FROM entitlements
WHERE workspace_id = '<workspace_id>' 
  AND feature = 'ccp-10:collaboration';
```

**Solution:**
```sql
-- Manually sync entitlements
UPDATE entitlements
SET enabled = true, reason_code = NULL, updated_at = now()
WHERE workspace_id = '<workspace_id>' 
  AND feature = 'ccp-10:collaboration';

-- Clear cache
DELETE FROM entitlement_cache 
WHERE workspace_id = '<workspace_id>';
```

### Issue: 402 error but should be allowed

**Check:**
1. Verify Stripe subscription active
2. Check `billing_state.tier` is 'portfolio' or higher
3. Verify workspace membership
4. Check entitlement cache hasn't expired
5. Review audit logs for denial reason

**Debug:**
```typescript
// In API route
console.log('Entitlement check:', {
  workspaceId,
  feature: 'ccp-10:collaboration',
  result: entitlement
});
```

## Migration Guide

If upgrading from existing share links implementation:

1. **Existing share links continue working** - CCP-10 is additive
2. Basic share links (CCP-12) remain free for all tiers
3. Advanced features (role-based, time limits, tracking) require Portfolio
4. Update UI to use new `<ShareReportButton />` component
5. Route `/api/share-links` (basic) vs `/api/share-links/create` (advanced)

## Future Enhancements

Potential improvements:
- Custom domains for share links (white-label)
- Password-protected links
- Email notifications on link access
- Batch link creation
- Link analytics dashboard
- API rate limiting per plan
- Custom expiration policies
- Auto-renewal options

## Support

For questions or issues:
- Documentation: `/docs/CCP-10-INTEGRATION.md`
- API Reference: `/api/share-links/create`
- Feature matrix: `lib/features/index.ts`
- Plan definitions: `lib/plans/definitions.ts`
- Contact: support@example.com
