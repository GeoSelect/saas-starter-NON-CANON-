# Load Testing Guide - CCP-03 & CCP-04

**Purpose**: Validate CCP-03 report creation and CCP-04 snapshot operations under concurrent load.

**Status**: Ready to run | Requires k6 CLI | Tests production contract & atomicity

---

## Quick Start

### 1. Install k6

```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux
sudo apt-get install k6

# Or: Docker
docker run -i grafana/k6 run - < tests/load/ccp03_report_create.js
```

### 2. Start Development Server

```bash
pnpm dev
# or
npm run dev
```

### 3. Run Load Tests

```bash
# Run all tests (CCP-03 + CCP-04)
k6 run tests/load/ccp03_report_create.js --vus=10 --duration=30s
k6 run tests/load/ccp04_snapshot_ops.js --vus=15 --duration=45s

# Quick smoke test
k6 run tests/load/ccp03_report_create.js --vus=2 --duration=10s

# Using orchestration script
node tests/load/orchestrate.js ccp03
node tests/load/orchestrate.js ccp04
node tests/load/orchestrate.js all
```

---

## CCP-03: Report Creation Load Test

**File**: `tests/load/ccp03_report_create.js`

**What It Tests**:
- Concurrent report creation from multiple virtual users
- Response contract validation (rpt-0.1 JSON structure)
- Transaction atomicity (no partial writes under load)
- Immutable snapshot creation and enforcement
- Error rates and latency percentiles

**Load Profiles**:

| Profile | VUs | Duration | Purpose |
|---------|-----|----------|---------|
| Ramp-up | 5→10 | 30s | Default ramping load |
| Spike | 5→20 | 20s | Sudden traffic burst |
| Sustained | 10 | 60s | Long-running stability |
| Stress | 10→50 | 60s | Find breaking point |

**Run Ramp-up Profile** (default):

```bash
k6 run tests/load/ccp03_report_create.js
# Ramps from 5 VUs to 10 VUs over 30 seconds
```

**Metrics Tracked**:

| Metric | What It Measures | Threshold |
|--------|------------------|-----------|
| `reports_created` | Total reports created | > 15 |
| `reports_error` | Creation failures | Track |
| `report_creation_time` | Time to create | p95 < 500ms |
| `report_error_rate` | Error percentage | < 10% |
| `atomicity_failures` | Partial writes | 0 |

**Expected Output**:

```
╔════════════════════════════════════════════════════════════════╗
║         CCP-03 Load Test: Concurrent Report Creation            ║
╚════════════════════════════════════════════════════════════════╝

📊 METRICS SUMMARY
──────────────────────────────────────────────────────────────────
Reports Created:        42
Reports Failed:         2
Atomicity Failures:     0

⏱️  TIMING METRICS
──────────────────────────────────────────────────────────────────
Creation Time (avg):    156.34ms
Creation Time (p95):    387.65ms
Creation Time (p99):    412.89ms

📈 ERROR METRICS
──────────────────────────────────────────────────────────────────
Error Rate:             4.76%
HTTP Errors:            2

✅ TEST RESULT: PASSED
──────────────────────────────────────────────────────────────────
```

**Key Validations**:

1. **Contract Validation** (rpt-0.1 JSON):
   ```javascript
   ✓ status is 200
   ✓ has id, workspaceId, userId, title
   ✓ has immutableSnapshot with id, checksum, version
   ✓ has parcelSnapshot with parcelId
   ✓ reportVersion is 0.1
   ```

2. **Atomicity Checks**:
   ```javascript
   ✓ If creation succeeded (200), ALL fields present
   ✓ No partial writes (snapshot exists or nothing)
   ✓ Checksum properly calculated
   ```

3. **Immutability Tests**:
   ```javascript
   ✓ Attempt to UPDATE snapshot fails (409 Conflict)
   ✓ Snapshot is truly immutable under concurrent load
   ```

---

## CCP-04: Snapshot Operations Load Test

**File**: `tests/load/ccp04_snapshot_ops.js`

**What It Tests**:
- Concurrent snapshot creation
- Snapshot immutability enforcement under load
- Version chain integrity
- Checksum validation
- Mutation rejection
- Rollback prevention

**Load Profiles**:

| Profile | VUs | Duration | Purpose |
|---------|-----|----------|---------|
| Ramp + Spike | 5→15→25 | 45s | Default with spike test |
| Heavy | 20 | 60s | Sustained heavy load |
| Extreme | 50 | 30s | Find breaking point |

**Run Default Profile**:

```bash
k6 run tests/load/ccp04_snapshot_ops.js
# Ramps 5→15 VUs, spikes to 25, then ramps down
```

**Metrics Tracked**:

| Metric | What It Measures | Threshold |
|--------|------------------|-----------|
| `snapshots_created` | Total snapshots | > 30 |
| `snapshot_creation_time` | Time to create | p95 < 400ms |
| `mutation_rejection_rate` | % mutations rejected | > 95% |
| `immutability_enforced` | Immutable checks | > 25 |
| `version_chain_integrity` | Valid chains | Track |

**Expected Output**:

```
╔════════════════════════════════════════════════════════════════╗
║      CCP-04 Load Test: Concurrent Snapshot Operations           ║
╚════════════════════════════════════════════════════════════════╝

📸 SNAPSHOT METRICS
──────────────────────────────────────────────────────────────────
Snapshots Created:      67
Snapshots Failed:       1
Immutability Enforced:  48
Version Chain Valid:    12

⏱️  TIMING METRICS
──────────────────────────────────────────────────────────────────
Creation Time (avg):    198.45ms
Creation Time (p95):    367.89ms
Checksum Validation:    45.23ms

🛡️  PROTECTION METRICS
──────────────────────────────────────────────────────────────────
Mutations Rejected:     96.87%
Immutable Enforcement:  48 enforcements

✅ TEST RESULT: PASSED
──────────────────────────────────────────────────────────────────
```

**Key Validations**:

1. **Snapshot Contract**:
   ```javascript
   ✓ has id, reportId, checksum, version
   ✓ has previousVersion (version chain)
   ✓ data matches input
   ✓ marked as immutable=true
   ```

2. **Immutability Enforcement**:
   ```javascript
   ✓ PUT to snapshot returns 409 (conflict)
   ✓ Mutations rejected > 95% of time
   ✓ No dirty writes even under load
   ```

3. **Version Chain Integrity**:
   ```javascript
   ✓ Versions increment sequentially
   ✓ previousVersion points correctly
   ✓ No gaps in version chain
   ```

4. **Rollback Prevention**:
   ```javascript
   ✓ POST /{id}/rollback returns 403/409
   ✓ Cannot revert to previous version
   ```

---

## Custom Load Profiles

### Smoke Test (2 VUs, 10s)

```bash
k6 run tests/load/ccp03_report_create.js --vus=2 --duration=10s
```

Quick validation that endpoints work without heavy load.

### Ramp-up Test (Gradual increase)

```bash
k6 run tests/load/ccp03_report_create.js \
  --stage=5s:5 \
  --stage=10s:10 \
  --stage=20s:10 \
  --stage=5s:0
```

Gradually increase virtual users to find issues at scale.

### Spike Test (Sudden burst)

```bash
k6 run tests/load/ccp03_report_create.js \
  --stage=10s:10 \
  --stage=10s:50 \
  --stage=10s:10
```

Sudden traffic spike to test adaptive scaling.

### Stress Test (Find breaking point)

```bash
k6 run tests/load/ccp03_report_create.js \
  --stage=60s:10 \
  --stage=60s:50 \
  --stage=60s:100
```

Gradually increase until system fails.

### Soak Test (Long running)

```bash
k6 run tests/load/ccp03_report_create.js \
  --vus=20 \
  --duration=10m
```

Run for extended period to find memory leaks, connection issues.

---

## Environment Variables

Control test behavior with environment variables:

```bash
# Custom API endpoint
API_BASE=https://api.example.com \
  k6 run tests/load/ccp03_report_create.js

# Specific workspace/user for tests
WORKSPACE_ID=workspace-abc \
USER_ID=user-xyz \
  k6 run tests/load/ccp03_report_create.js

# All together
API_BASE=http://localhost:3000 \
WORKSPACE_ID=test-ws \
USER_ID=test-user \
k6 run tests/load/ccp03_report_create.js --vus=10 --duration=30s
```

---

## Interpreting Results

### ✅ Healthy Test Results

```
✓ Reports Created: 45+ (target: >15)
✓ Error Rate: < 5% (target: <10%)
✓ p95 Latency: < 500ms (target: <500ms)
✓ Atomicity Failures: 0 (target: 0)
✓ Mutation Rejection: > 95% (target: >95%)
```

### ⚠️ Warning Signs

| Sign | Meaning | Action |
|------|---------|--------|
| High error rate (>10%) | Server struggling | Reduce VUs or fix errors |
| p95 > 500ms | Slow responses | Optimize database or API |
| Atomicity failures | Partial writes | Check transaction logic |
| Mutations accepted | Immutability broken | Check constraint enforcement |
| Memory usage ↑ | Memory leak | Profile and fix |

### ❌ Failure Signals

- More than 10% error rate
- More than 1% atomicity failures
- More than 5% mutation acceptance
- p99 latency > 2000ms
- Response timeouts

---

## Analyzing Results JSON

Tests save results to `tests/load/results/`:

```bash
# View raw JSON
cat tests/load/results/ccp03-2025-01-04-*-*.json | jq '.metrics'

# Extract specific metric
cat tests/load/results/ccp03-*.json | jq '.metrics.reports_created'

# Check error rate
cat tests/load/results/ccp03-*.json | jq '.metrics.report_error_rate.values'
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Tests
on: [push]
jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: grafana/setup-k6-action@v1
      - run: k6 run tests/load/ccp03_report_create.js
        env:
          API_BASE: ${{ secrets.API_BASE }}
```

### GitLab CI Example

```yaml
load-test:
  image: grafana/k6:latest
  script:
    - k6 run tests/load/ccp03_report_create.js
  artifacts:
    paths:
      - tests/load/results/
```

---

## Troubleshooting

### Test won't run: "Command not found: k6"

```bash
# Install k6
brew install k6              # macOS
choco install k6             # Windows
sudo apt-get install k6      # Linux
```

### "Connection refused" error

```bash
# Check if server is running
curl http://localhost:3000

# Start server if not running
pnpm dev
```

### Tests fail with 404 errors

```bash
# Verify API endpoints exist
curl -X POST http://localhost:3000/api/report/create
curl -X POST http://localhost:3000/api/report/test-001/snapshot

# Check logs for errors
pnpm dev # Look at server output
```

### High error rate in test

```bash
# Run smoke test first
k6 run tests/load/ccp03_report_create.js --vus=2 --duration=10s

# Check server logs
# Check database connectivity
# Reduce VUs and try again
```

### Memory issues or slow tests

```bash
# Use lower VU count
k6 run tests/load/ccp03_report_create.js --vus=5 --duration=15s

# Extend duration to spread load
k6 run tests/load/ccp03_report_create.js --vus=10 --duration=60s

# Profile database queries
# Check for N+1 queries
```

---

## Performance Benchmarks

**Target Metrics** (from CCP specs):

| Metric | CCP-03 | CCP-04 | Target |
|--------|--------|--------|--------|
| p95 Latency | < 500ms | < 600ms | ✅ |
| Error Rate | < 10% | < 10% | ✅ |
| Atomicity | 100% | 100% | ✅ |
| Immutability | 100% | 100% | ✅ |
| Throughput | 50+ reports/min | 80+ snapshots/min | ✅ |

---

## Advanced: Custom Load Profiles

Edit `ccp03_report_create.js` `options.stages`:

```javascript
// Current: Ramp from 5→10 VUs
stages: [
  { duration: '5s', target: 5 },
  { duration: '10s', target: 10 },
  { duration: '20s', target: 10 },
  { duration: '5s', target: 0 },
]

// Custom: Sustained load
stages: [
  { duration: '10s', target: 20 },
  { duration: '120s', target: 20 },
  { duration: '10s', target: 0 },
]

// Custom: Progressive spike
stages: [
  { duration: '10s', target: 10 },
  { duration: '10s', target: 20 },
  { duration: '10s', target: 50 },
  { duration: '10s', target: 0 },
]
```

---

## Next Steps

1. **Run smoke test** to verify setup: `k6 run tests/load/ccp03_report_create.js --vus=2 --duration=10s`
2. **Review results** and check for errors
3. **Run full ramp-up** to test under load: `k6 run tests/load/ccp03_report_create.js`
4. **Run CCP-04** snapshot tests
5. **Analyze bottlenecks** if needed
6. **Integrate into CI/CD** for continuous validation

---

## Documentation Map

| Document | Purpose |
|----------|---------|
| [ccp03_report_create.js](ccp03_report_create.js) | Report creation load test script |
| [ccp04_snapshot_ops.js](ccp04_snapshot_ops.js) | Snapshot operations load test script |
| [orchestrate.js](orchestrate.js) | Test orchestration and aggregation |
| [LOAD-TESTING.md](LOAD-TESTING.md) | This guide |

---

## Summary

These load tests provide:
- ✅ **Contract Validation**: Verify rpt-0.1 JSON structure under load
- ✅ **Atomicity Testing**: Ensure no partial writes
- ✅ **Immutability Enforcement**: Reject mutations 95%+ of time
- ✅ **Performance Metrics**: p95 latency, error rates, throughput
- ✅ **Concurrency Safety**: Test with 10-50 simultaneous users
- ✅ **Version Integrity**: Verify version chains don't break

Ready to validate production readiness! 🚀
