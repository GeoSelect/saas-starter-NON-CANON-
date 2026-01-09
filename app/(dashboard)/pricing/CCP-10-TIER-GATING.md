# CCP-10: Share Links - Tier Gating & Monetization

**Status**: ✅ Tier Gating Defined  
**Date**: January 8, 2026  
**Tier Requirement**: Pro Plus / Portfolio  
**Feature ID**: `ccp-10:collaboration`

---

## 📋 Feature Distinction

### CCP-10 vs CCP-12: Critical Difference

| Aspect | CCP-12 (Basic Sharing) | CCP-10 (Collaboration) |
|--------|------------------------|------------------------|
| **Tier** | FREE | Pro Plus / Portfolio |
| **Feature ID** | `ccp-12:sharing` | `ccp-10:collaboration` |
| **Functionality** | Simple "copy link" | Role-based access control |
| **Expiration** | ❌ None | ✅ Time-limited (configurable) |
| **Access Roles** | ❌ View only | ✅ Viewer / Commenter / Editor |
| **Recipient Tracking** | ❌ Anonymous | ✅ Contact integration (CCP-09) |
| **Audit Trails** | ❌ Basic | ✅ Advanced (IP, user agent, timestamps) |
| **Max Views** | ❌ Unlimited | ✅ Configurable limits |
| **Authentication** | ❌ Public only | ✅ Optional auth requirement |
| **Revocation** | ❌ Not supported | ✅ Instant revocation |
| **Email Notifications** | ❌ None | ✅ Recipient notifications |

---

## 🎯 Entitlement Integration (CCP-03 / CCP-05)

### Contract Alignment

From `lib/contracts/ccp05/entitlements.ts`:

```typescript
export type EntitlementFeature =
  | 'ccp-10:collaboration'  // ← THIS FEATURE
  | 'ccp-12:sharing'         // ← FREE TIER BASIC SHARING
  // ... other features

// Feature → Minimum Tier Mapping
const FEATURE_MINIMUM_TIERS: Record<EntitlementFeature, SubscriptionTier> = {
  'ccp-10:collaboration': 'pro_plus',  // ← PRO PLUS REQUIRED
  'ccp-12:sharing': 'free',             // ← FREE TIER
  // ... other mappings
};

// Tier Hierarchy: free < pro < pro_plus < portfolio < enterprise
```

**✅ No Conflicts**: CCP-10 correctly positioned at `pro_plus` tier, above free `ccp-12:sharing`.

---

## 🔐 API Route Entitlement Checks

### Required Pattern for All CCP-10 Routes

Every CCP-10 API route MUST check entitlements before allowing share link operations:

```typescript
// Example: POST /api/share-links/route.ts

import { hasWorkspaceEntitlement } from '@/lib/services/entitlements';

export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const { user } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Parse workspace_id from request
  const { workspace_id } = await request.json();

  // 3. CHECK ENTITLEMENT (CCP-10 specific)
  const hasCollaboration = await hasWorkspaceEntitlement(
    workspace_id,
    'ccp-10:collaboration'
  );

  if (!hasCollaboration.enabled) {
    return NextResponse.json(
      {
        error: "Feature not available",
        reason: hasCollaboration.denialReason, // e.g., "TIER_INSUFFICIENT"
        message: "Share Links collaboration requires Pro Plus or higher plan",
        upgradeUrl: `/pricing?feature=ccp-10:collaboration`,
      },
      { status: 402 } // Payment Required (tier upgrade needed)
    );
  }

  // 4. Proceed with share link creation
  const shareLink = await createShareLink(snapshot_id, workspace_id, user.id, options);
  // ...
}
```

### Error Response Format

When tier is insufficient:

```json
{
  "error": "Feature not available",
  "reason": "TIER_INSUFFICIENT",
  "message": "Share Links collaboration requires Pro Plus or higher plan",
  "upgrade": {
    "currentTier": "pro",
    "requiredTier": "pro_plus",
    "feature": "ccp-10:collaboration",
    "upgradeUrl": "/pricing?feature=ccp-10:collaboration"
  }
}
```

**HTTP Status**: `402 Payment Required` (tier upgrade needed)

---

## 📂 Files Requiring Entitlement Checks

### API Routes (Must Add Checks)

| Route | Method | Entitlement Check |
|-------|--------|-------------------|
| `app/api/share-links/route.ts` | POST | ✅ Required (create link) |
| `app/api/share-links/route.ts` | GET | ✅ Required (list links) |
| `app/api/share-links/[token]/route.ts` | GET | ❌ Optional (public access) |
| `app/api/share-links/[token]/route.ts` | DELETE | ✅ Required (revoke link) |
| `app/api/share-links/[id]/events/route.ts` | GET | ✅ Required (audit trail) |

**Note**: Public share link access (`GET /api/share-links/[token]`) does NOT require entitlement check, as the link itself was created by an entitled workspace.

### Helper Functions (No Checks Needed)

| Function | Entitlement Check |
|----------|-------------------|
| `createShareLink()` | ❌ None (caller must check) |
| `listShareLinks()` | ❌ None (caller must check) |
| `validateShareLink()` | ❌ None (public validation) |
| `revokeShareLink()` | ❌ None (caller must check) |

**Rationale**: Helper functions are data layer operations. Entitlement enforcement happens at the API route level (presentation layer).

---

## 🧪 Testing Requirements

### Entitlement Test Cases

```typescript
describe('CCP-10 Share Links - Tier Gating', () => {
  test('FREE tier: Cannot create share links (402)', async () => {
    const workspace = await createWorkspace({ tier: 'free' });
    const response = await POST('/api/share-links', {
      workspace_id: workspace.id,
      snapshot_id: 'snap-123'
    });
    expect(response.status).toBe(402);
    expect(response.json.error).toBe('Feature not available');
    expect(response.json.reason).toBe('TIER_INSUFFICIENT');
  });

  test('PRO tier: Cannot create share links (402)', async () => {
    const workspace = await createWorkspace({ tier: 'pro' });
    const response = await POST('/api/share-links', {
      workspace_id: workspace.id,
      snapshot_id: 'snap-123'
    });
    expect(response.status).toBe(402);
  });

  test('PRO PLUS tier: Can create share links (201)', async () => {
    const workspace = await createWorkspace({ tier: 'pro_plus' });
    const response = await POST('/api/share-links', {
      workspace_id: workspace.id,
      snapshot_id: 'snap-123'
    });
    expect(response.status).toBe(201);
    expect(response.json.share_link).toBeDefined();
  });

  test('PORTFOLIO tier: Can create share links (201)', async () => {
    const workspace = await createWorkspace({ tier: 'portfolio' });
    const response = await POST('/api/share-links', {
      workspace_id: workspace.id,
      snapshot_id: 'snap-123'
    });
    expect(response.status).toBe(201);
  });

  test('Grace period expired: Cannot create links (402)', async () => {
    const workspace = await createWorkspace({
      tier: 'pro_plus',
      subscription_status: 'past_due'
    });
    const response = await POST('/api/share-links', {
      workspace_id: workspace.id,
      snapshot_id: 'snap-123'
    });
    expect(response.status).toBe(402);
    expect(response.json.reason).toBe('GRACE_PERIOD_EXPIRED');
  });
});
```

---

## 💰 Upgrade Prompts

### UI Integration

When user attempts to create share link without Pro Plus:

```tsx
// components/share/ShareDialog.tsx

function ShareDialog({ snapshotId }: { snapshotId: string }) {
  const { workspace } = useAppShell();
  const hasCollaboration = workspace.can('ccp-10:collaboration');

  if (!hasCollaboration) {
    return (
      <UpgradePrompt
        feature="Share Links Collaboration"
        currentTier={workspace.subscription_tier}
        requiredTier="pro_plus"
        benefits={[
          'Role-based access control (viewer, commenter, editor)',
          'Time-limited expiration (1 day to 30 days)',
          'Recipient tracking with email notifications',
          'Advanced audit trails (IP, timestamp, user agent)',
          'Revoke links instantly',
          'Set maximum view counts',
        ]}
        upgradeUrl="/pricing?feature=ccp-10:collaboration"
      />
    );
  }

  return <ShareLinkForm snapshotId={snapshotId} />;
}
```

### Pricing Page Differentiation

Update pricing page to clearly distinguish CCP-10 vs CCP-12:

| Plan | Share Links Feature | Description |
|------|---------------------|-------------|
| **Free / Pro** | Basic Sharing (CCP-12) | Simple "copy link" to share reports publicly |
| **Pro Plus** | ✨ **Collaboration** (CCP-10) | Role-based sharing with expiration, tracking, and audit trails |
| **Portfolio** | ✨ **Collaboration** (CCP-10) | Same as Pro Plus, plus higher usage limits |

---

## 📊 Implementation Checklist

### Completed ✅

- [x] Database schema (migrations/010_ccp10_share_links.sql)
- [x] Helper functions (lib/db/helpers/share-links.ts)
- [x] Tier mapping in CCP-05 contract (`'ccp-10:collaboration': 'pro_plus'`)
- [x] Documentation (this file)

### Pending 🔴

- [ ] Add entitlement checks to `POST /api/share-links`
- [ ] Add entitlement checks to `GET /api/share-links`
- [ ] Add entitlement checks to `DELETE /api/share-links/[token]`
- [ ] Add entitlement checks to `GET /api/share-links/[id]/events`
- [ ] Create upgrade prompt UI component
- [ ] Update pricing page with CCP-10 vs CCP-12 distinction
- [ ] Write integration tests for tier gating
- [ ] Add feature flag documentation to API docs
- [ ] Update entitlements service (if not already handling ccp-10:collaboration)

---

## 🔗 Related Contracts

- **CCP-03**: Monetization & Billing (foundation)
- **CCP-05**: Entitlements & Feature Gating (enforcement)
- **CCP-09**: Contact Upload (recipient integration)
- **CCP-12**: Basic Sharing (free tier alternative)
- **CCP-15**: Audit Trail (event logging)

---

## 🎓 Key Takeaways

1. **CCP-10 is NOT free**: Requires Pro Plus or higher
2. **CCP-12 is the free alternative**: Basic sharing without collaboration features
3. **Entitlement checks are mandatory**: All write operations must check tier
4. **Public read access is allowed**: Share links can be accessed publicly (no tier check on GET)
5. **402 Payment Required**: Standard HTTP status for tier upgrades
6. **Graceful degradation**: Show upgrade prompts, don't just block silently

---

**Next Steps**: Add entitlement checks to API routes following the pattern above.
