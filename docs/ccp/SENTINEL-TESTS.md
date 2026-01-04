# CCP Sentinel Tests: Red-Line Regression Detection

**Commit**: `60acec2` | **Date**: January 4, 2026

## Overview

Added two high-signal integration sentinel tests that serve as the "red line" regression detectors in your CI pipeline. These tests are non-negotiable quality gates that prevent merges if critical contracts are broken.

## CCP-03 Sentinel: Report Creation Integrity

**File**: [app/api/reports/create.integration.test.ts](app/api/reports/create.integration.test.ts)

### What It Tests

1. **Report Creation Contract (rpt-0.1)**
   - POST /api/reports with known ParcelContext fixture
   - Asserts exact JSON structure with all required fields
   - Verifies immutable `parcelSnapshot` is stored correctly
   - Checks timestamps are valid ISO strings

2. **Transaction Atomicity**
   - Validates that invalid inserts fail completely (no partial writes)
   - Verifies no trace of failed insert remains in DB
   - Audits creation failures with reason

3. **Immutable Snapshot Enforcement**
   - Prevents mutation of `parcelSnapshot` after creation
   - Asserts original snapshot unchanged on read attempts
   - Tracks mutation attempts in audit log

### Test Cases (3 tests)
- ✅ `should create report with exact rpt-0.1 JSON structure and immutable snapshot`
- ✅ `should maintain transaction atomicity (no partial writes on validation failure)`
- ✅ `should prevent concurrent mutation of immutable parcelSnapshot`

### Audit Events

```typescript
// On successful creation:
{
  event: 'report_created',
  fields: { reportId, teamId, userId, parcelId, status }
}

// On validation failure:
{
  event: 'report_create_failed',
  fields: { reportId, reason: 'validation_failure', error }
}

// On mutation attempt:
{
  event: 'snapshot_mutation_attempted',
  fields: { reportId, originalChecksum, attemptedChecksum }
}
```

---

## CCP-04 Sentinel: Snapshot Immutability

**File**: [lib/db/snapshots.integration.test.ts](lib/db/snapshots.integration.test.ts)

### What It Tests

1. **Snapshot Creation with Checksum**
   - Creates snapshot with deterministic SHA256 checksum
   - Verifies checksum matches on every read
   - Prevents checksum tampering

2. **Mutation Rejection**
   - Attempts to mutate snapshot (address, version, etc.)
   - Asserts deterministic failure with clear error message
   - Prevents any unauthorized changes

3. **Version Chain Integrity**
   - Creates versioned snapshots with parent chain
   - Validates version sequence is deterministic
   - Tracks all versions in audit trail

4. **Rollback Prevention**
   - Blocks attempts to downgrade version
   - Logs rollback attempts as critical alerts
   - Prevents downgrade from v1 → v0

5. **Checksum Validation on Every Read**
   - Reads snapshot multiple times
   - Verifies checksum matches original
   - Catches silent corruption

### Test Cases (5 tests)
- ✅ `should create snapshot with checksum and prevent mutation`
- ✅ `should reject mutation attempt with deterministic failure`
- ✅ `should maintain version chain integrity with audit trail`
- ✅ `should emit audit event for any unauthorized rollback attempt`
- ✅ `should verify snapshot integrity on every read (checksum validation)`

### Audit Events

```typescript
// On creation:
{
  event: 'snapshot_created',
  fields: { reportId, checksum, version }
}

// On successful read:
{
  event: 'snapshot_retrieved',
  fields: { reportId, version, checksumVerified: true }
}

// On mutation detection:
{
  event: 'snapshot_mutation_detected',
  severity: 'warn',
  fields: { reportId, originalChecksum, attemptedChecksum, error }
}

// On rollback attempt:
{
  event: 'snapshot_rollback_attempted',
  severity: 'critical',
  fields: { reportId, currentVersion, attemptedVersion }
}
```

---

## CI Integration

### Updated Workflow
**File**: [.github/workflows/ccp-gate-checks.yml](.github/workflows/ccp-gate-checks.yml)

Sentinel tests now run **first** in the gate check pipeline, before all other gates:

```yaml
# 🚩 SENTINEL TESTS (Red Line Regression Detection)

- name: '🚩 CCP-03 Sentinel: Report Creation Integrity'
  run: pnpm test -- create.integration.test

- name: '🚩 CCP-04 Sentinel: Snapshot Immutability'
  run: pnpm test -- snapshots.integration.test

# Then the 8 standard gates follow...
```

### Execution Order
1. **Sentinel Tests** (2 tests, ~3-5 seconds)
   - CCP-03: 3 integration tests
   - CCP-04: 5 integration tests
2. **CCP Gates** (8 gates, contracts + scans)
3. **Quality Checks** (lint, type, build)

### Failure Behavior
If **any** sentinel test fails:
- ❌ CI reports `GATE FAILURE`
- PR blocked from merge
- Detailed console output explains which contract is broken
- Requires explicit fix (no exceptions)

---

## Local Testing

### Run Sentinel Tests
```bash
# CCP-03 only
pnpm test -- create.integration.test --run

# CCP-04 only
pnpm test -- snapshots.integration.test --run

# Both sentinels
pnpm test -- "integration.test" --run

# All tests including unit
pnpm test --run
```

### Test Output Example
```
✓ app/api/reports/create.integration.test.ts (3 tests) 1824ms
  ✓ should create report with exact rpt-0.1 JSON structure...
  ✓ should maintain transaction atomicity...
  ✓ should prevent concurrent mutation...

✓ lib/db/snapshots.integration.test.ts (5 tests) 1688ms
  ✓ should create snapshot with checksum and prevent mutation
  ✓ should reject mutation attempt with deterministic failure
  ✓ should maintain version chain integrity...
  ✓ should emit audit event for any unauthorized rollback...
  ✓ should verify snapshot integrity on every read...

Test Files  2 passed (2)
Tests  8 passed (8)
```

---

## Regression Detection Strategy

These sentinels catch regressions in two critical areas:

### CCP-03 Regressions (Report Creation)
Would fail if:
- ❌ Report fields change structure (teamId becomes string, userId changes)
- ❌ Immutable snapshot is mutated post-creation
- ❌ Audit logging stops emitting `report_created` event
- ❌ Transaction boundaries disappear (partial writes allowed)
- ❌ Timestamps lose ISO format
- ❌ parcelSnapshot is not stored as JSONB

### CCP-04 Regressions (Snapshot Immutability)
Would fail if:
- ❌ Snapshots become mutable (UPDATE allowed)
- ❌ Checksums are skipped or don't match
- ❌ Version chain becomes non-deterministic
- ❌ Rollback prevention is removed
- ❌ Audit trail stops logging mutations
- ❌ Silent corruption occurs during reads

---

## Non-Negotiable Properties

These tests enforce **immutable contracts**:

### For Report Creation (CCP-03)
```typescript
// This structure is frozen
type ReportContract = {
  id: string;
  teamId: number;
  userId: number;
  title: string;
  parcelId: string;
  address: string;
  apn: string;
  jurisdiction: string;
  zoning: string;
  parcelSnapshot: object; // Immutable JSON blob
  findings: null | object;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  snapshotAt: Date;
};
```

### For Snapshot Immutability (CCP-04)
```typescript
// Snapshots NEVER change
snapshot.parcelSnapshot = FROZEN_AFTER_CREATION;

// All reads must verify checksum
const checksum = sha256(snapshot.parcelSnapshot);
if (stored_checksum !== checksum) throw ERROR;

// Version chain is deterministic
if (newVersion <= currentVersion) throw ROLLBACK_ERROR;
```

---

## Maintenance Notes

### When Adding New Features
If you add fields to `Report`:
1. ❌ Sentinel test WILL fail
2. ✅ Update `EXPECTED_REPORT_SHAPE` in test
3. ✅ Document the change (breaking change)
4. ✅ Requires explicit approval (exception form)

### When Changing Snapshot Logic
If you modify snapshot handling:
1. ❌ Sentinel test WILL fail
2. ✅ Update fixtures and checksums
3. ✅ Add new version tests
4. ✅ Audit trail must reflect changes
5. ✅ Requires exception review

### When Adding Snapshot Versions
```typescript
// Add new version test case:
const FIXTURE_SNAPSHOT_V2 = {
  ...FIXTURE_SNAPSHOT_V1,
  version: 2,
  parentChecksum: calculateChecksum(FIXTURE_SNAPSHOT_V1),
  newField: 'value',
};
```

---

## CI Output

### On Success
```
🚩 SENTINEL TESTS (Red Line Detection)
  ✅ CCP-03: Report creation contract intact
  ✅ CCP-04: Snapshot immutability verified

CCP-03: Report Creation Integrity
  ✅ Gate 1: Contract tests pass
  ✅ Gate 2: Validation rules stable
  ✅ Gate 3: Transaction boundary intact
  ✅ Gate 4: Observability fields present

CCP-04: Snapshot Immutability
  ✅ Gate 5: Snapshots remain immutable
  ✅ Gate 6: Checksums validated
  ✅ Gate 7: Version chain deterministic
  ✅ Gate 8: Snapshot endpoints audited

✅ Ready for merge
```

### On Failure
```
❌ CCP-03 SENTINEL FAILED: Report creation contract broken
rpt-0.1 JSON structure or audit logging has changed

Error Details:
  Expected: parcelSnapshot.version to be 1
  Received: undefined
  
📚 Documentation: docs/ccp/GATES.md
🔧 Fix the issues and push again
```

---

## Summary

- **2 Sentinel Test Files**: ~900 lines of integration tests
- **8 Total Sentinel Cases**: 3 (CCP-03) + 5 (CCP-04)
- **Non-Negotiable**: These tests block PRs if broken
- **Fast**: ~3-5 seconds combined execution
- **Deterministic**: Same results every run
- **Audited**: Complete audit trail of all operations

These sentinels are your "red line"—they catch regressions before they make it to production.
