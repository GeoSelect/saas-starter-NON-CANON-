# CCP-05 Workspace Hardening - Enforceable Gates

**Purpose**: Convert CCP-05 workspace hardening requirements into enforceable merge gates that prevent regressions.

**Status**: Non-negotiable quality invariants  
**Added**: Session Phase 6  
**Test Coverage**: Integration sentinel tests (lib/workspace/hardening.integration.test.ts)

---

## Gate System Architecture

Each gate:
- ✅ Has automated verification
- ✅ Blocks merges if violated
- ✅ Returns clear error messages
- ✅ Includes recovery procedures
- ✅ Prevents partial implementations

---

## GATE 1: Membership Verification Enforcement

**Requirement**: All workspace-scoped operations require valid membership check.

**What Fails**:
- ❌ Report creation without membership check
- ❌ Report deletion without membership check
- ❌ Sharing reports without membership check
- ❌ Membership check exists but has no role verification

**What Passes**:
- ✅ `verifyWorkspaceMembership(userId, workspaceId)` called before operation
- ✅ Result check: `if (!membership.ok) return 403 Forbidden`
- ✅ Role included in response: `membership.role` is one of `['owner', 'admin', 'member']`

**Verification Command**:
```bash
# Find all POST/PUT/DELETE routes in app/api/workspace/*
# Check each has verifyWorkspaceMembership call

grep -r "verifyWorkspaceMembership" app/api/workspace/ | wc -l
# Should be ≥ 6 (create, read, update, delete, share, invite)

# Verify each handler checks role
grep -r "membership.role" app/api/workspace/ | wc -l
# Should match number of membership verifications
```

**Sentinel Test**: `lib/workspace/hardening.integration.test.ts` → "Membership Verification" suite

**Error Handling**:
```typescript
// PASS
const membership = await verifyWorkspaceMembership(userId, workspaceId);
if (!membership.ok) {
  return NextResponse.json(
    { error: 'NOT_MEMBER', message: 'You do not have access to this workspace' },
    { status: 403 }
  );
}

// FAIL - No membership check
async function POST(req) {
  const report = await db.query.reports.findFirst(...);
  return NextResponse.json(report);
}
```

---

## GATE 2: Entitlements Enforcement - Quota Limits

**Requirement**: Workspace feature access and quota limits enforced before operations.

**What Fails**:
- ❌ Report creation without checking quota
- ❌ Inviting collaborators without checking limit
- ❌ Using feature without verifying plan tier
- ❌ Quota checks exist but have no fallback error

**What Passes**:
- ✅ `canCreateReport(workspaceId)` returns boolean or error
- ✅ `canInviteMembers(workspaceId)` returns boolean or error
- ✅ `hasFeature(workspaceId, featureName)` returns boolean or error
- ✅ Operation blocked with 402 Payment Required or 400 Quota Exceeded

**Verification Command**:
```bash
# Find all report creation endpoints
grep -r "POST.*reports" app/api/workspace/

# Each should have quota check
grep -r "canCreateReport\|quota\|REPORT_LIMIT" app/api/workspace/*/create

# Check error responses
grep -r "402\|403\|QUOTA_EXCEEDED\|PLAN_LIMIT" app/api/workspace/
```

**Sentinel Test**: `lib/workspace/hardening.integration.test.ts` → "Entitlements Enforcement" suite

**Error Handling**:
```typescript
// PASS
const canCreateReport = await canCreateReport(workspaceId);
if (!canCreateReport) {
  return NextResponse.json(
    { 
      error: 'QUOTA_EXCEEDED',
      message: 'You have reached the maximum reports for your plan',
      details: { plan: 'free', limit: 5, current: 5 }
    },
    { status: 402 }
  );
}

// FAIL - No quota check
async function POST(req) {
  return db.insert(reports).values(newReport);
}
```

---

## GATE 3: Secure Share Token Generation

**Requirement**: Share tokens are cryptographically secure, time-bound, and revocable.

**What Fails**:
- ❌ Token is < 32 bytes (< 64 hex chars)
- ❌ Token generation uses Math.random()
- ❌ Token format is sequential or predictable
- ❌ Token has no expiry option
- ❌ Token cannot be revoked

**What Passes**:
- ✅ `createShareToken()` uses `randomBytes(32)` (crypto module)
- ✅ Returns token with 64 hex characters
- ✅ Returns `expiresAt` timestamp
- ✅ Token can be revoked with `revokeShareToken()`
- ✅ Revoked tokens fail verification

**Verification Command**:
```bash
# Check randomBytes usage in share-token.ts
grep -n "randomBytes(32)" lib/workspace/share-token.ts
# Should exist

# Verify token format (64 hex = 32 bytes)
grep -n "toString('hex')" lib/workspace/share-token.ts

# Check expiry support
grep -n "expiresAt\|expiresIn" lib/workspace/share-token.ts | wc -l
# Should have multiple references

# Check revocation support
grep -n "revokeShareToken\|revokedAt" lib/workspace/share-token.ts
# Should both exist
```

**Sentinel Test**: `lib/workspace/hardening.integration.test.ts` → "Secure Sharing Tokens" suite

**Error Handling**:
```typescript
// PASS - Cryptographically secure
function generateToken(): string {
  return randomBytes(32).toString('hex'); // 64 hex chars
}

// FAIL - Predictable
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15); // Vulnerable!
}
```

---

## GATE 4: Share Token Verification & Validation

**Requirement**: Share token verification checks all constraints before granting access.

**What Fails**:
- ❌ Token accepted without checking revocation status
- ❌ Token accepted after expiry
- ❌ Token accepted without rate limit check
- ❌ Domain restrictions not enforced
- ❌ Password protection bypassed
- ❌ Access not logged for audit trail

**What Passes**:
- ✅ `verifyShareToken(token)` checks: revoked, expired, rate limit, domain, password
- ✅ Returns error code: INVALID_TOKEN | EXPIRED | RATE_LIMITED | DOMAIN_DENIED | PASSWORD_REQUIRED
- ✅ Access attempt logged (granted=true/false)
- ✅ Failed verification returns specific error, not generic 403

**Verification Command**:
```bash
# Check all verification checks in share-token.ts
grep -n "expiresAt\|revokedAt\|rateLimit\|allowedDomains\|passwordProtected" lib/workspace/share-token.ts | wc -l
# Should be ≥ 10 (multiple checks)

# Check access logging
grep -n "logShareTokenAccess\|accessGranted\|audit" lib/workspace/share-token.ts
# Should have logging calls

# Check error codes
grep -n "INVALID_TOKEN\|EXPIRED\|RATE_LIMITED\|DOMAIN_DENIED\|PASSWORD_REQUIRED" lib/workspace/share-token.ts | wc -l
# Should be ≥ 5
```

**Sentinel Test**: `lib/workspace/hardening.integration.test.ts` → "Secure Sharing Tokens" suite

**Error Handling**:
```typescript
// PASS - All checks performed
async function verifyShareToken(token: string, context: any) {
  if (!shareToken) return { ok: false, error: 'INVALID_TOKEN' };
  if (shareToken.revokedAt) return { ok: false, error: 'REVOKED' };
  if (shareToken.expiresAt && now > expiresAt) return { ok: false, error: 'EXPIRED' };
  if (!withinRateLimit) return { ok: false, error: 'RATE_LIMITED' };
  if (domainRestricted && !domainAllowed) return { ok: false, error: 'DOMAIN_DENIED' };
  if (passwordProtected && !passwordCorrect) return { ok: false, error: 'PASSWORD_REQUIRED' };
  
  await logShareTokenAccess(..., true);
  return { ok: true, reportId, accessLevel };
}

// FAIL - Insufficient checks
async function verifyShareToken(token: string) {
  const shareToken = await getToken(token);
  return { ok: !!shareToken }; // Missing all checks!
}
```

---

## GATE 5: RLS Policy Enforcement

**Requirement**: Supabase RLS policies protect workspace data at database level.

**What Fails**:
- ❌ RLS not enabled on workspace tables
- ❌ Policies missing on workspace_members table
- ❌ Policies missing on workspace_entitlements table
- ❌ Policies missing on report_share_tokens table
- ❌ Direct database access bypasses RLS checks

**What Passes**:
- ✅ `ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY`
- ✅ Policies require `auth.uid()` = `user_id` OR role = 'admin'
- ✅ All workspace-scoped tables have RLS enabled
- ✅ Policies audit-logged and testable

**Verification Command**:
```bash
# Check RLS enabled on workspace tables
supabase migration list
# Look for 20260104_ccp05_workspace_hardening.sql

# Verify in SQL migration
grep -n "ALTER TABLE.*ENABLE ROW LEVEL SECURITY" supabase/migrations/20260104_ccp05_workspace_hardening.sql
# Should have ≥ 4 (one per table)

# Verify policies exist
grep -n "CREATE POLICY" supabase/migrations/20260104_ccp05_workspace_hardening.sql | wc -l
# Should be ≥ 10 (multiple policies per table)
```

**Sentinel Test**: Run manual RLS test after migration applied

```sql
-- Test membership isolation
SET session auth.uid = 'user-without-access';
SELECT * FROM workspace_members 
WHERE workspace_id = 'workspace-restricted'; -- Should return 0 rows

SET session auth.uid = 'user-with-access';
SELECT * FROM workspace_members 
WHERE workspace_id = 'workspace-restricted'; -- Should return rows
```

**Error Handling**:
```sql
-- PASS - RLS protects data
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY workspace_member_access 
  ON workspace_members 
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM workspace_members m2 
    WHERE m2.workspace_id = workspace_members.workspace_id 
    AND m2.user_id = auth.uid() 
    AND m2.role IN ('admin', 'owner')
  ));

-- FAIL - No RLS, direct access allowed
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;
-- Anyone can SELECT * FROM workspace_members!
```

---

## GATE 6: Audit Trail & Access Logging

**Requirement**: All workspace operations logged to immutable audit table.

**What Fails**:
- ❌ Report creation not logged
- ❌ Share token access not logged
- ❌ Membership changes not logged
- ❌ Audit table is mutable (no constraints)
- ❌ Logs do not include IP/context

**What Passes**:
- ✅ `logShareTokenAccess()` called on every verification attempt
- ✅ Logs include: user_id, action, timestamp, ip_address, result (granted/denied)
- ✅ Audit table immutable (no UPDATE/DELETE permissions)
- ✅ Audit triggers on membership changes

**Verification Command**:
```bash
# Check audit logging in share-token.ts
grep -n "logShareTokenAccess\|logger\\.info\|logger\\.warn" lib/workspace/share-token.ts | wc -l
# Should be ≥ 5

# Check audit table in migration
grep -n "share_token_access_logs\|audit" supabase/migrations/20260104_ccp05_workspace_hardening.sql
# Should reference audit table

# Verify audit table is immutable
grep -n "ALTER TABLE.*share_token_access_logs" supabase/migrations/20260104_ccp05_workspace_hardening.sql
# Should have NO UPDATE/DELETE policies, only INSERT
```

**Sentinel Test**: `lib/workspace/hardening.integration.test.ts` → "Audit Trail" suite

**Error Handling**:
```typescript
// PASS - Audit logging
async function verifyShareToken(token: string, context: any) {
  const result = await performChecks(token);
  
  await logShareTokenAccess(
    tokenId,
    reportId,
    context,
    result.ok,
    result.ok ? 'SUCCESS' : 'INVALID_TOKEN'
  );
  
  return result;
}

// FAIL - No audit logging
async function verifyShareToken(token: string, context: any) {
  const result = await performChecks(token);
  return result; // Audit trail lost!
}
```

---

## GATE 7: Error Messages & Security Hardening

**Requirement**: Error messages reveal no sensitive information.

**What Fails**:
- ❌ Error reveals database structure: "Column user_id not found"
- ❌ Error reveals internal IDs: "Token ID: 12345"
- ❌ Error reveals timing info: "Attempted password in 5ms" (timing attack)
- ❌ Error exposes SQL: "WHERE workspace_id = 'xyz'"

**What Passes**:
- ✅ Errors are generic: "INVALID_TOKEN", "NOT_MEMBER", "QUOTA_EXCEEDED"
- ✅ Errors use HTTP status codes appropriately (403, 402, 404)
- ✅ Logging includes details, user sees generic messages
- ✅ Password verification uses timing-safe comparison

**Verification Command**:
```bash
# Check error messages in share-token.ts
grep -n "error:" lib/workspace/share-token.ts
# Should be generic codes, not SQL/internals

# Check password comparison uses timing-safe
grep -n "timingSafeEqual" lib/workspace/share-token.ts
# Should exist for password verification

# Check logger vs response (logs detailed, response generic)
grep -n "logger\\..*error\|error.*=.*'.*'" lib/workspace/share-token.ts
# Should separate what's logged (detailed) vs returned (generic)
```

**Sentinel Test**: Manual security review of error responses

**Error Handling**:
```typescript
// PASS - Generic error, detailed logging
export async function verifyShareToken(token: string, context: any) {
  try {
    const shareToken = await getToken(token);
    if (!shareToken) {
      logger.warn('share_token_not_found', { token: token.substring(0, 8) + '...' });
      return { ok: false, error: 'INVALID_TOKEN' }; // Generic
    }
  } catch (error) {
    logger.error('share_token_verify_failed', error, { token: token.substring(0, 8) + '...' });
    return { ok: false, error: 'UNKNOWN_ERROR' }; // Generic
  }
}

// FAIL - Leaks information
export async function verifyShareToken(token: string) {
  try {
    const shareToken = await db.query(`SELECT * FROM report_share_tokens WHERE token = '${token}'`);
  } catch (error) {
    return { ok: false, error: error.message }; // SQL errors exposed!
  }
}
```

---

## GATE 8: Plan Tier Constants & Enforcement

**Requirement**: Plan tier limits defined once, enforced everywhere.

**What Fails**:
- ❌ Report limit hardcoded: `if (reportCount > 5) {}`
- ❌ Collaborator limit duplicated: Free = 1, Pro = 5, Enterprise = unlimited
- ❌ Features list scattered across code
- ❌ No single source of truth for plan tiers

**What Passes**:
- ✅ `PLAN_FEATURES` constant defines all features per tier
- ✅ `PLAN_LIMITS` constant defines all limits per tier
- ✅ Functions reference constants: `canCreateReport()` checks `PLAN_LIMITS.FREE.maxReports`
- ✅ Plan tier added to seed data for testing

**Verification Command**:
```bash
# Check PLAN_FEATURES exists
grep -n "PLAN_FEATURES" lib/workspace/verify-membership.ts
# Should be defined and exported

# Check PLAN_LIMITS exists
grep -n "PLAN_LIMITS" lib/workspace/verify-membership.ts
# Should be defined and exported

# Check constants are comprehensive
grep -n "export const PLAN" lib/workspace/verify-membership.ts
# Should define free, pro, enterprise

# Check functions use constants
grep -n "PLAN_LIMITS\|PLAN_FEATURES" lib/workspace/verify-membership.ts | wc -l
# Should be multiple references in implementation
```

**Sentinel Test**: Verify constants match database seed data

```typescript
// In test:
expect(PLAN_LIMITS.free.maxReports).toBe(5);
expect(PLAN_LIMITS.pro.maxReports).toBe(50);
expect(PLAN_LIMITS.enterprise.maxReports).toBe(-1); // Unlimited
```

**Error Handling**:
```typescript
// PASS - Single source of truth
export const PLAN_LIMITS = {
  free: { maxReports: 5, maxCollaborators: 1, storage: '1GB' },
  pro: { maxReports: 50, maxCollaborators: 5, storage: '10GB' },
  enterprise: { maxReports: -1, maxCollaborators: -1, storage: 'unlimited' },
};

export async function canCreateReport(workspaceId: string) {
  const entitlements = await getEntitlements(workspaceId);
  const limit = PLAN_LIMITS[entitlements.planTier].maxReports;
  const current = await countReports(workspaceId);
  return current < limit;
}

// FAIL - Hardcoded limits scattered
async function canCreateReport(workspaceId: string) {
  if (workspaceId.startsWith('free-')) {
    if (reportCount > 5) return false; // Hardcoded!
  }
  // ... other hardcoded logic ...
}
```

---

## Gate Verification Checklist

Before merging any workspace-hardening PR:

- [ ] **Gate 1**: Membership verification calls exist in all workspace routes
- [ ] **Gate 2**: Quota/entitlements checks exist before operations
- [ ] **Gate 3**: Share tokens use `randomBytes(32)` and have expiry
- [ ] **Gate 4**: Token verification checks: revoked, expired, rate limit, domain, password
- [ ] **Gate 5**: RLS enabled on workspace_members, workspace_entitlements, report_share_tokens
- [ ] **Gate 6**: Audit logging present for all access attempts
- [ ] **Gate 7**: Error messages are generic, logs are detailed
- [ ] **Gate 8**: PLAN_LIMITS and PLAN_FEATURES constants defined and used
- [ ] **Tests**: Integration sentinel test suite passing (lib/workspace/hardening.integration.test.ts)
- [ ] **No Shortcuts**: No bypassing membership checks, no hardcoded limits, no plain-text passwords

---

## Gate Failure Examples

### Example 1: Missing Membership Check

```typescript
// ❌ FAILS Gate 1
async function POST(req, { params }) {
  const reportId = params.reportId;
  const report = await db.query.reports.findFirst({ where: eq(...) });
  return NextResponse.json(report); // No membership check!
}

// ✅ PASSES Gate 1
async function POST(req, { params }) {
  const userId = auth.userId();
  const workspaceId = params.workspaceId;
  
  const membership = await verifyWorkspaceMembership(userId, workspaceId);
  if (!membership.ok) return NextResponse.json({ error: 'NOT_MEMBER' }, { status: 403 });
  
  const reportId = params.reportId;
  const report = await db.query.reports.findFirst({ where: eq(...) });
  return NextResponse.json(report);
}
```

### Example 2: Weak Token Generation

```typescript
// ❌ FAILS Gate 3
function generateToken() {
  return Math.random().toString(36).substring(2, 15); // Predictable!
}

// ✅ PASSES Gate 3
function generateToken() {
  return randomBytes(32).toString('hex'); // Cryptographically secure
}
```

### Example 3: Missing Token Verification Checks

```typescript
// ❌ FAILS Gate 4
async function verifyShareToken(token: string) {
  const shareToken = await db.query.reportShareTokens.findFirst({ where: eq(...) });
  return { ok: !!shareToken };
}

// ✅ PASSES Gate 4
async function verifyShareToken(token: string, context: any) {
  const shareToken = await getToken(token);
  if (!shareToken) return { ok: false, error: 'INVALID_TOKEN' };
  if (shareToken.revokedAt) return { ok: false, error: 'REVOKED' };
  if (shareToken.expiresAt && now > expiresAt) return { ok: false, error: 'EXPIRED' };
  if (!withinRateLimit) return { ok: false, error: 'RATE_LIMITED' };
  
  await logShareTokenAccess(..., true);
  return { ok: true, reportId: shareToken.reportId };
}
```

---

## Related Documentation

- **CCP-05_WORKSPACE_HARDENING.md** - Complete specification
- **SENTINEL-TESTS.md** - Integration test documentation
- **GATES.md** - CCP-03 and CCP-04 gates (reference)

---

## Summary

These 8 gates form the "workspace fortress":
1. **Gate 1-2**: Membership + Entitlements (who can access, what can they do)
2. **Gate 3-4**: Secure Sharing (cryptographic tokens, verified access)
3. **Gate 5-6**: Protection Layers (RLS, audit trails)
4. **Gate 7-8**: Quality & Constants (error handling, single source of truth)

No PR is merged without passing all 8 gates.
