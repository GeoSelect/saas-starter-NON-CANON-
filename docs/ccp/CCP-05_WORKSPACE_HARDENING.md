# CCP-05: Workspace Hardening

**Status**: Implementation Plan  
**Date**: January 4, 2026  
**Scope**: Membership verification, entitlements enforcement, secure sharing  
**Parent**: CCP-03/04 (Report Creation & Snapshot Integrity)  
**Child**: CCP-06 (Branded Reports), CCP-07 (Advanced Sharing)

---

## Overview

CCP-05 harddens the workspace container to ensure:

1. **Membership Verification** - Only workspace members can access/create/share reports
2. **Entitlements Enforcement** - Features/limits enforced per subscription tier
3. **Secure Sharing** - Reports shareable via one-time tokens with expiry
4. **RLS (Row Level Security)** - Database-level access control

This creates the "fortress" around workspace data—no direct access without membership verification.

---

## 1. Membership Verification

### Requirements

#### 1.1 Membership Model

```typescript
// Database: workspace_members
{
  id: uuid;
  workspace_id: uuid;
  user_id: uuid;
  role: 'owner' | 'admin' | 'member'; // role-based permissions
  created_at: timestamp;
  updated_at: timestamp;
}
```

#### 1.2 Role Permissions Matrix

| Permission | Owner | Admin | Member |
|-----------|-------|-------|--------|
| Create reports | ✅ | ✅ | ✅ |
| Edit own reports | ✅ | ✅ | ✅ |
| Delete own reports | ✅ | ✅ | ✅ |
| Edit others' reports | ✅ | ✅ | ❌ |
| Delete others' reports | ✅ | ✅ | ❌ |
| Invite members | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | ❌ |
| Change roles | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ |
| Configure entitlements | ✅ | ❌ | ❌ |

#### 1.3 Membership Verification Middleware

```typescript
// lib/workspace/verify-membership.ts

/**
 * verifyWorkspaceMembership(userId, workspaceId)
 * 
 * Returns:
 * - { ok: true, role: 'owner|admin|member' }
 * - { ok: false, reason: 'NOT_MEMBER|DELETED|SUSPENDED' }
 * 
 * Checks:
 * 1. User has active membership record
 * 2. Workspace not deleted/suspended
 * 3. Membership not revoked
 */
export async function verifyWorkspaceMembership(
  userId: string,
  workspaceId: string
): Promise<{
  ok: boolean;
  role?: 'owner' | 'admin' | 'member';
  reason?: string;
}> {
  // Implementation
}

/**
 * verifyWorkspaceRole(userId, workspaceId, requiredRole)
 * 
 * Enforces role hierarchy:
 * - 'owner' can do anything owner can
 * - 'admin' can do anything admin+ can
 * - 'member' can do anything member+ can
 */
export async function verifyWorkspaceRole(
  userId: string,
  workspaceId: string,
  requiredRole: 'owner' | 'admin' | 'member'
): Promise<boolean> {
  // Implementation
}
```

#### 1.4 Membership Check Points

**All workspace-scoped operations** must verify membership:

```typescript
// POST /api/workspace/:id/report/create
const membership = await verifyWorkspaceMembership(userId, workspaceId);
if (!membership.ok) return forbidden('WORKSPACE_ACCESS_DENIED');

// GET /api/workspace/:id/reports
const membership = await verifyWorkspaceMembership(userId, workspaceId);
if (!membership.ok) return forbidden('WORKSPACE_ACCESS_DENIED');

// PUT /api/workspace/:id/report/:reportId
const membership = await verifyWorkspaceMembership(userId, workspaceId);
if (!membership.ok) return forbidden('WORKSPACE_ACCESS_DENIED');
const canEdit = membership.role === 'owner' || membership.role === 'admin' || isOwnReport;
if (!canEdit) return forbidden('WORKSPACE_INSUFFICIENT_ROLE');

// DELETE /api/workspace/:id/members/:userId
const membership = await verifyWorkspaceMembership(requesterUserId, workspaceId);
if (membership.role !== 'owner' && membership.role !== 'admin') {
  return forbidden('WORKSPACE_INSUFFICIENT_ROLE');
}
```

---

## 2. Entitlements Enforcement

### Requirements

#### 2.1 Entitlements Model

```typescript
// Database: workspace_entitlements
{
  id: uuid;
  workspace_id: uuid;
  plan_tier: 'free' | 'pro' | 'enterprise';
  features: {
    max_reports: number;           // -1 = unlimited
    max_snapshots_per_report: number;
    max_collaborators: number;
    custom_branding: boolean;
    api_access: boolean;
    integrations: string[];        // ['slack', 'webhook', ...]
    sso: boolean;
  };
  limits: {
    storage_gb: number;
    api_calls_per_month: number;
    custom_domains: number;
  };
  overrides: {
    [key: string]: any;            // Plan-specific overrides
  };
  active_from: timestamp;
  active_until: timestamp | null;  // null = perpetual
  status: 'active' | 'suspended' | 'trial';
  created_at: timestamp;
  updated_at: timestamp;
}
```

#### 2.2 Entitlements Verification

```typescript
// lib/workspace/verify-entitlements.ts

/**
 * canCreateReport(workspaceId): boolean
 * Checks if workspace has quota available
 */
export async function canCreateReport(workspaceId: string): Promise<{
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}> {
  const ent = await getWorkspaceEntitlements(workspaceId);
  if (!ent.ok) return { allowed: false, reason: 'ENTITLEMENTS_NOT_FOUND' };
  
  const current = await countWorkspaceReports(workspaceId);
  const limit = ent.features.max_reports;
  
  if (limit > 0 && current >= limit) {
    return { 
      allowed: false, 
      reason: 'QUOTA_EXCEEDED',
      current,
      limit 
    };
  }
  
  return { allowed: true, current, limit };
}

/**
 * canInviteMembers(workspaceId): boolean
 * Checks if workspace can add more collaborators
 */
export async function canInviteMembers(workspaceId: string): Promise<boolean> {
  const ent = await getWorkspaceEntitlements(workspaceId);
  if (!ent.ok) return false;
  
  const current = await countWorkspaceMembers(workspaceId);
  const limit = ent.features.max_collaborators;
  
  return limit === -1 || current < limit;
}

/**
 * hasFeature(workspaceId, feature): boolean
 * Checks if workspace has feature enabled
 */
export async function hasFeature(
  workspaceId: string,
  feature: keyof EntitlementFeatures
): Promise<boolean> {
  const ent = await getWorkspaceEntitlements(workspaceId);
  if (!ent.ok) return false;
  
  return ent.features[feature] === true;
}
```

#### 2.3 Entitlements Check Points

```typescript
// POST /api/workspace/:id/report/create
const canCreate = await canCreateReport(workspaceId);
if (!canCreate.allowed) {
  return forbidden(canCreate.reason, {
    current: canCreate.current,
    limit: canCreate.limit
  });
}

// POST /api/workspace/:id/members/invite
const canInvite = await canInviteMembers(workspaceId);
if (!canInvite) {
  return forbidden('COLLABORATOR_LIMIT_REACHED');
}

// PUT /api/workspace/:id/report/:reportId/branding
const hasBranding = await hasFeature(workspaceId, 'custom_branding');
if (!hasBranding) {
  return forbidden('FEATURE_NOT_AVAILABLE_IN_PLAN');
}
```

#### 2.4 Plan Tiers

**Free**:
- max_reports: 5
- max_snapshots_per_report: 1
- max_collaborators: 1 (self only)
- custom_branding: false
- api_access: false
- storage_gb: 1
- status: trial (30 days)

**Pro**:
- max_reports: 50
- max_snapshots_per_report: 10
- max_collaborators: 5
- custom_branding: true
- api_access: true
- integrations: ['webhook']
- storage_gb: 10
- api_calls_per_month: 10000

**Enterprise**:
- max_reports: -1 (unlimited)
- max_snapshots_per_report: -1 (unlimited)
- max_collaborators: -1 (unlimited)
- custom_branding: true
- api_access: true
- integrations: ['slack', 'webhook', 'zapier']
- sso: true
- storage_gb: 1000
- api_calls_per_month: -1 (unlimited)
- custom_domains: 5

---

## 3. Secure Sharing

### Requirements

#### 3.1 Share Token Model

```typescript
// Database: report_share_tokens
{
  id: uuid;
  report_id: uuid;
  workspace_id: uuid;
  created_by_user_id: uuid;
  token: string;                    // Cryptographic token (32 bytes hex)
  description: string;              // "Shared with Jane", "Public link"
  expires_at: timestamp | null;     // null = no expiry
  access_level: 'view' | 'comment' | 'edit';
  password_protected: boolean;
  password_hash: string | null;     // bcrypt hash if protected
  allowed_domains: string[];        // ['example.com'] - null = any domain
  rate_limit: number | null;        // max views per hour, null = unlimited
  tracking_enabled: boolean;        // log access events
  revoked_at: timestamp | null;
  created_at: timestamp;
  updated_at: timestamp;
  
  // Audit
  last_accessed_at: timestamp | null;
  access_count: number;
}
```

#### 3.2 Share Token Generation

```typescript
// lib/workspace/share-token.ts

/**
 * createShareToken(reportId, workspaceId, options)
 * 
 * Generates cryptographic token for secure sharing
 */
export async function createShareToken(
  reportId: string,
  workspaceId: string,
  createdByUserId: string,
  options: {
    expiresIn?: string;            // '7days', '24hours', '30days'
    description?: string;
    accessLevel?: 'view' | 'comment' | 'edit';
    passwordProtect?: boolean;
    allowedDomains?: string[];
    rateLimit?: number;            // views per hour
  }
): Promise<{
  ok: boolean;
  token?: string;
  expiresAt?: string;
  shortUrl?: string;
  error?: string;
}> {
  // 1. Verify user owns/can share report
  // 2. Check entitlements (sharing feature available?)
  // 3. Generate cryptographic token (32 bytes)
  // 4. Store token with metadata
  // 5. Return token + short URL
  // Implementation
}

/**
 * verifyShareToken(token, context)
 * 
 * Validates token for access
 */
export async function verifyShareToken(
  token: string,
  context: {
    ip?: string;
    referer?: string;
    password?: string;
  }
): Promise<{
  ok: boolean;
  reportId?: string;
  accessLevel?: 'view' | 'comment' | 'edit';
  workspaceId?: string;
  error?: string;
}> {
  // 1. Lookup token in database
  // 2. Check if revoked/expired
  // 3. Check rate limits
  // 4. Check domain restrictions
  // 5. Verify password if required
  // 6. Log access event
  // 7. Return report access
  // Implementation
}

/**
 * revokeShareToken(tokenId, userId)
 * 
 * Revokes token immediately
 */
export async function revokeShareToken(
  tokenId: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  // Implementation
}
```

#### 3.3 Share Token Check Points

```typescript
// POST /api/workspace/:id/report/:reportId/share
const membership = await verifyWorkspaceMembership(userId, workspaceId);
if (!membership.ok) return forbidden('WORKSPACE_ACCESS_DENIED');

const canShare = await hasFeature(workspaceId, 'api_access');
if (!canShare) return forbidden('FEATURE_NOT_AVAILABLE_IN_PLAN');

const token = await createShareToken(reportId, workspaceId, userId, options);
if (!token.ok) return badRequest(token.error);

return success({ token: token.token, expiresAt: token.expiresAt });

// GET /api/shared/report/:token
const access = await verifyShareToken(token, { ip, referer });
if (!access.ok) return forbidden(access.error);

const report = await db.query.reports.findById(access.reportId);
return success({ report, accessLevel: access.accessLevel });
```

---

## 4. Row Level Security (RLS)

### 4.1 Workspace Policies

```sql
-- Enable RLS on workspace_members
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Members can read workspace members in their workspace
CREATE POLICY workspace_members_select ON workspace_members
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Only admins/owners can insert members
CREATE POLICY workspace_members_insert ON workspace_members
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Only admins/owners can update members
CREATE POLICY workspace_members_update ON workspace_members
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

### 4.2 Report Policies (Workspace-Scoped)

```sql
-- Enable RLS on reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Members can read reports in their workspace
CREATE POLICY reports_select_member ON reports
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Members can create reports in workspace
CREATE POLICY reports_insert_member ON reports
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Can only edit own reports or if admin
CREATE POLICY reports_update_own_or_admin ON reports
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

---

## 5. Implementation Checklist

### Phase 1: Membership Verification (Week 1)

- [ ] Database: Create workspace_members table
- [ ] Database: RLS policies on workspace_members
- [ ] Middleware: `verifyWorkspaceMembership()`
- [ ] Middleware: `verifyWorkspaceRole()`
- [ ] Tests: Membership verification scenarios
- [ ] All workspace routes: Add membership checks

### Phase 2: Entitlements Enforcement (Week 2)

- [ ] Database: Create workspace_entitlements table
- [ ] Database: Seed plan tiers (free/pro/enterprise)
- [ ] Middleware: `canCreateReport()`, `canInviteMembers()`, `hasFeature()`
- [ ] Tests: Entitlements quota enforcement
- [ ] Report creation: Check quota before insert
- [ ] Member invites: Check collaborator limit
- [ ] Feature gates: Check plan before feature access

### Phase 3: Secure Sharing (Week 3)

- [ ] Database: Create report_share_tokens table
- [ ] Crypto: Token generation (32-byte secure random)
- [ ] Functions: `createShareToken()`, `verifyShareToken()`, `revokeShareToken()`
- [ ] Endpoints: POST `/api/workspace/:id/report/:reportId/share`
- [ ] Endpoints: GET `/api/shared/report/:token`
- [ ] Tests: Share token lifecycle (create/verify/revoke)
- [ ] Tests: Rate limiting + domain restrictions

### Phase 4: RLS Hardening (Week 4)

- [ ] RLS policies on all workspace tables
- [ ] RLS policies on all report tables
- [ ] Audit: Verify no direct table access bypasses RLS
- [ ] Tests: RLS policy enforcement (attempt unauthorized access)

---

## 6. Error Responses

### Membership Errors

```json
{
  "error": "WORKSPACE_ACCESS_DENIED",
  "message": "You are not a member of this workspace",
  "status": 403
}

{
  "error": "WORKSPACE_INSUFFICIENT_ROLE",
  "message": "This action requires admin or owner role",
  "status": 403
}

{
  "error": "WORKSPACE_SUSPENDED",
  "message": "This workspace has been suspended",
  "status": 403
}
```

### Entitlements Errors

```json
{
  "error": "QUOTA_EXCEEDED",
  "message": "You have reached the report limit for your plan (5)",
  "current": 5,
  "limit": 5,
  "status": 403
}

{
  "error": "FEATURE_NOT_AVAILABLE_IN_PLAN",
  "message": "Custom branding is available on Pro plan or higher",
  "status": 403
}

{
  "error": "COLLABORATOR_LIMIT_REACHED",
  "message": "Free plan limited to 1 collaborator. Upgrade to invite more.",
  "status": 403
}
```

### Sharing Errors

```json
{
  "error": "INVALID_SHARE_TOKEN",
  "message": "This share link is invalid or has expired",
  "status": 403
}

{
  "error": "SHARE_TOKEN_RATE_LIMIT_EXCEEDED",
  "message": "Too many access attempts. Try again later.",
  "status": 429
}

{
  "error": "SHARE_TOKEN_PASSWORD_REQUIRED",
  "message": "This share link is password protected",
  "status": 403
}
```

---

## 7. Audit Trail

All membership/entitlements/sharing actions logged:

```typescript
// Membership events
workspace.member_invited
workspace.member_joined
workspace.member_role_changed
workspace.member_removed

// Entitlements events
workspace.plan_upgraded
workspace.plan_downgraded
workspace.quota_exceeded
workspace.feature_accessed

// Sharing events
report.share_link_created
report.share_link_accessed
report.share_link_revoked
report.shared_externally
```

---

## 8. Success Criteria

✅ No workspace member access without verification  
✅ Quota limits enforced (no overage possible)  
✅ Features gated by plan tier  
✅ Share tokens cryptographically secure  
✅ RLS prevents direct database access  
✅ Complete audit trail of all actions  
✅ All errors have clear messaging + remediation  

---

## References

- RLS Documentation: docs/SECURITY.md
- Entitlements Model: docs/ccp/CCP-05_WORKSPACE_HARDENING.md
- Membership Schema: supabase/migrations/20260104_ccp05_workspace_hardening.sql
