# CCP Merge Gates

## Purpose

These are **non-negotiable invariants** that every PR must satisfy. A PR that breaks any gate must be fixed before merge.

## How to Use

1. Before submitting a PR, run through this checklist
2. Link to this document in your PR description: `See docs/ccp/GATES.md`
3. Check off each gate you've verified
4. Reviewers: Verify gates before approving

---

## CCP-03 Gates: Report Creation Integrity

### ✅ Gate 1: Contract Tests Pass
**Invariant**: Response shape and error codes are stable.

**Verification**:
```bash
npm run test:contracts
# Or manually verify:
npm run test -- reports.contract.test
```

**Required**:
- [ ] Success response includes: `{ success: true, report: { id, teamId, userId, title, createdAt } }`
- [ ] Error response includes: `{ error: string, code?: string, details?: object }`
- [ ] Error codes remain stable: `TEAM_NOT_FOUND`, `QUOTA_EXCEEDED`, `INVALID_SNAPSHOT`, `DUPLICATE_TITLE`

**Break condition**: Any change to response shape or error code naming.

---

### ✅ Gate 2: Zod Validation Failure Modes
**Invariant**: Input validation errors are predictable and stable.

**Verification**:
```typescript
// Test that these still fail as expected:
await expect(createReport({ title: 'ab' })).rejects.toThrow('Title must be at least 3');
await expect(createReport({ title: 'x'.repeat(256) })).rejects.toThrow('Title too long');
await expect(createReport({ parcelSnapshot: null })).rejects.toThrow();
```

**Required**:
- [ ] Title: min 3 chars, max 255 chars
- [ ] Description: max 1000 chars (optional)
- [ ] ParcelSnapshot: required, must be valid JSON object
- [ ] Tags: array of strings, max 20 items, each max 50 chars

**Break condition**: Validation rules become more permissive without explicit approval.

---

### ✅ Gate 3: Transaction Boundary Intact
**Invariant**: Report creation is atomic - no partial writes on failure.

**Verification**:
```typescript
// Test that rollback works:
const beforeCount = await db.select({ count: count() }).from(reports);
try {
  await createReport({ /* invalid data that fails mid-transaction */ });
} catch (error) {
  const afterCount = await db.select({ count: count() }).from(reports);
  expect(afterCount[0].count).toBe(beforeCount[0].count); // No partial write
}
```

**Required**:
- [ ] All report operations wrapped in `db.transaction()`
- [ ] Activity logs only created if report succeeds
- [ ] Team membership checks inside transaction
- [ ] No direct `db.insert()` calls outside transactions for reports

**Break condition**: Finding any `reports` table modification outside a transaction.

---

### ✅ Gate 4: Observability Fields Present
**Invariant**: All operations are traceable.

**Verification**:
```typescript
// Check that logs include required fields:
logger.info('report_created', {
  reportId: string,     // ✓ Present
  userId: number,       // ✓ Present
  teamId: number,       // ✓ Present
  duration: number,     // ✓ Present
  title: string,        // ✓ Present (optional but recommended)
});
```

**Required**:
- [ ] `report_create_start` logged with `{ userId, teamId, title }`
- [ ] `report_created` logged with `{ reportId, userId, teamId, duration }`
- [ ] `report_create_failed` logged with `{ userId, error, duration }`
- [ ] All logs include operation name as first argument
- [ ] Error logs include error object as second argument

**Break condition**: Missing any required field in production logs.

---

## CCP-04 Gates: Snapshot Immutability

### ✅ Gate 5: Snapshots Remain Immutable
**Invariant**: No code path can modify a snapshot after creation.

**Verification**:
```bash
# Search for UPDATE statements on snapshots:
grep -r "update.*snapshots" app/ lib/ --include="*.ts" --include="*.tsx"
# Should only find: isActive flag changes (for version activation)

# Search for parcelSnapshot modifications:
grep -r "parcelSnapshot.*=" app/ lib/ --include="*.ts" --include="*.tsx"
# Should only find: initial assignments in INSERT statements
```

**Required**:
- [ ] No `db.update(reportSnapshots).set({ parcelSnapshot: ... })`
- [ ] No `db.update(reports).set({ parcelSnapshot: ... })` (use versioning instead)
- [ ] Only `isActive` flag can be updated on snapshots
- [ ] Schema prevents updates: `parcelSnapshot JSONB NOT NULL IMMUTABLE` (if using PostgreSQL 12+)

**Break condition**: Finding any UPDATE statement that modifies `parcelSnapshot` content.

---

### ✅ Gate 6: Checksums Validated
**Invariant**: Data integrity is verified on read, or explicitly bypassed with audit.

**Verification**:
```typescript
// Every snapshot read must verify checksum:
export const getSnapshot = async (id: string) => {
  const snapshot = await db.select().from(reportSnapshots).where(eq(reportSnapshots.id, id));
  
  // ✓ Checksum validation present
  const isValid = await verifyChecksum(snapshot.parcelSnapshot, snapshot.checksum);
  if (!isValid) {
    logger.error('snapshot_integrity_check_failed', ...);
    throw new SnapshotError('INTEGRITY_CHECK_FAILED');
  }
  
  return snapshot;
};
```

**Required**:
- [ ] `verifyChecksum()` called on every snapshot read
- [ ] If bypassed, must log `snapshot_checksum_bypassed` with reason
- [ ] Integrity failures logged with `snapshot_integrity_check_failed`
- [ ] Checksum calculated using stable algorithm (SHA-256 of sorted JSON)

**Break condition**: Finding snapshot read without checksum verification.

---

### ✅ Gate 7: Version Chain Deterministic
**Invariant**: Snapshot versioning is predictable and traceable.

**Verification**:
```typescript
// Version numbers must be sequential:
const snapshots = await db.select()
  .from(reportSnapshots)
  .where(eq(reportSnapshots.reportId, reportId))
  .orderBy(asc(reportSnapshots.version));

// Verify sequential: [1, 2, 3, 4] not [1, 3, 4, 5]
for (let i = 0; i < snapshots.length; i++) {
  expect(snapshots[i].version).toBe(i + 1);
}

// Verify parent chain:
for (let i = 1; i < snapshots.length; i++) {
  expect(snapshots[i].parentSnapshotId).toBe(snapshots[i - 1].id);
}
```

**Required**:
- [ ] Versions start at 1 and increment by 1
- [ ] No gaps in version sequence
- [ ] `parentSnapshotId` correctly references previous version
- [ ] Diff calculation is deterministic (same inputs → same output)
- [ ] Active snapshot is always the highest version

**Break condition**: Version gaps, broken parent chain, or non-deterministic diff.

---

### ✅ Gate 8: Snapshot Endpoints Audited
**Invariant**: All snapshot operations are logged for audit trail.

**Verification**:
```bash
# Check that these operations log to audit trail:
grep -A5 "createSnapshot\|getSnapshot\|rollbackSnapshot" app/api/ lib/
# Must find corresponding logger.info() calls
```

**Required**:
- [ ] `snapshot_created` logged with `{ snapshotId, reportId, version, userId }`
- [ ] `snapshot_retrieved` logged with `{ snapshotId, version, userId }` (read audit)
- [ ] `snapshot_rollback` logged with `{ reportId, fromVersion, toVersion, userId }`
- [ ] `snapshot_integrity_check_failed` logged on checksum mismatch
- [ ] Activity logs table updated for snapshot operations

**Break condition**: Snapshot operation without corresponding audit log.

---

## Verification Checklist Template

Copy this into your PR description:

```markdown
## CCP Gate Verification

### CCP-03: Report Creation Integrity
- [ ] ✅ Gate 1: Contract tests pass
- [ ] ✅ Gate 2: Zod validation failure modes stable
- [ ] ✅ Gate 3: Transaction boundary intact
- [ ] ✅ Gate 4: Observability fields present

### CCP-04: Snapshot Immutability
- [ ] ✅ Gate 5: Snapshots remain immutable
- [ ] ✅ Gate 6: Checksums validated
- [ ] ✅ Gate 7: Version chain deterministic
- [ ] ✅ Gate 8: Snapshot endpoints audited

### Notes
<!-- Add any exceptions, bypasses, or special considerations here -->
```

---

## Enforcement

### Automated Checks (CI/CD)
```yaml
# .github/workflows/gate-checks.yml
name: CCP Gate Checks

on: [pull_request]

jobs:
  gate-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      
      # Gate 1: Contract tests
      - run: npm run test:contracts
      
      # Gate 2: Validation tests
      - run: npm run test:validation
      
      # Gate 3: Transaction tests
      - run: npm run test:transactions
      
      # Gate 5: Immutability scan
      - run: |
          if grep -r "update.*reportSnapshots.*parcelSnapshot" app/ lib/; then
            echo "❌ Gate 5 FAILED: Found snapshot mutation"
            exit 1
          fi
      
      # Gate 6: Checksum verification scan
      - run: |
          if grep -r "getSnapshot" app/ lib/ | grep -v "verifyChecksum"; then
            echo "⚠️  Warning: Snapshot read without checksum verification"
          fi
```

### Manual Review
Reviewers must verify:
1. All gates checked in PR description
2. Test coverage for modified code
3. No obvious bypasses or workarounds
4. Logs include all required fields

---

## Exceptions

### Requesting an Exception
If you need to bypass a gate:

1. Document why in PR description
2. Tag `@security` or `@data-integrity` team
3. Add temporary bypass with expiration:
   ```typescript
   // GATE-EXCEPTION: CCP-04-Gate-5 (Snapshot immutability)
   // Reason: Migration script needs to fix corrupted checksums
   // Expires: 2026-01-15
   // Approved by: @security-lead
   if (process.env.MIGRATION_MODE === 'true') {
     // Exception code here
   }
   ```

### Exception Log
All exceptions must be logged:
```typescript
logger.warn('gate_exception_invoked', {
  gate: 'CCP-04-Gate-5',
  reason: 'Migration script',
  approver: 'security-lead',
  expiresAt: '2026-01-15',
});
```

---

## Gate Failure Response

### If a Gate is Broken
1. **Immediately**: Revert the breaking change or fix forward
2. **Within 1 hour**: Document what broke and why
3. **Within 24 hours**: Add regression test to prevent recurrence
4. **Within 1 week**: Review gates to see if they need updating

### Incident Template
```markdown
## Gate Failure Incident

**Gate**: CCP-03-Gate-3 (Transaction boundary)
**Broken by**: PR #123
**Detected**: 2026-01-04 14:30 UTC
**Impact**: Partial writes possible for 2 hours
**Root cause**: Refactor moved db.insert() outside transaction
**Fix**: PR #124 (reverted change)
**Prevention**: Added CI check for transaction boundaries
**Status**: ✅ Resolved
```

---

## Updating Gates

### When to Update a Gate
- New security requirement
- Performance optimization requires different approach
- Technology change (e.g., new database)

### Update Process
1. Propose change in RFC document
2. Get approval from team leads
3. Update this document
4. Notify all developers
5. Add to onboarding docs

### Gate History
| Date | Gate | Change | Reason |
|------|------|--------|--------|
| 2026-01-04 | All | Initial gates | Production readiness |

---

## Quick Reference

| Gate | What | Why | How to Check |
|------|------|-----|--------------|
| CCP-03-1 | Contract stability | API consumers depend on it | `npm run test:contracts` |
| CCP-03-2 | Validation rules | Prevent invalid data | Check Zod schemas unchanged |
| CCP-03-3 | Transaction safety | Data consistency | All writes in `db.transaction()` |
| CCP-03-4 | Observability | Debug production issues | Logs include required fields |
| CCP-04-5 | Immutability | Data integrity & audit | No UPDATE on parcelSnapshot |
| CCP-04-6 | Checksums | Detect corruption | `verifyChecksum()` on reads |
| CCP-04-7 | Version chain | Time-travel & diffs | Sequential versions, valid parents |
| CCP-04-8 | Audit trail | Compliance & security | All ops logged to activity_logs |

---

## Contact

Questions about gates? Ask in:
- Slack: #ccp-gates
- Email: engineering-standards@geoselect.com
- Office hours: Tuesdays 2pm EST
