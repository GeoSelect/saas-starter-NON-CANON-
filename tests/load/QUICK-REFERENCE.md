# Load Testing Quick Reference

**Purpose**: Fast reference for running CCP-03 & CCP-04 load tests.

---

## One-Liner Start

```bash
# All tests
npm run load-test

# CCP-03 only (reports)
npm run load-test:ccp03

# CCP-04 only (snapshots)
npm run load-test:ccp04

# Smoke test (quick validation)
npm run load-test:smoke
```

---

## Common Commands

| Command | Load Profile | Duration |
|---------|---|---|
| `npm run load-test:ccp03` | Ramp 5→10 VUs | 30s |
| `npm run load-test:ccp04` | Ramp 5→15→25 VUs | 45s |
| `npm run load-test:smoke` | 2 VUs | 10s |
| `npm run load-test:ramp` | Gradual ramp-up | 40s |
| `npm run load-test:spike` | Spike test | 30s |

---

## Custom Load Tests

```bash
# Heavy load
k6 run tests/load/ccp03_report_create.js --vus=20 --duration=60s

# Stress test (find breaking point)
k6 run tests/load/ccp03_report_create.js --vus=10 --duration=60s \
  --stage=20s:10 --stage=20s:50 --stage=20s:100

# Soak test (memory leaks)
k6 run tests/load/ccp03_report_create.js --vus=10 --duration=10m

# With custom API
API_BASE=https://api.example.com npm run load-test:ccp03
```

---

## What Gets Tested

### CCP-03: Report Creation
- ✅ Concurrent report creation (10 users)
- ✅ Response contract (rpt-0.1 JSON)
- ✅ Transaction atomicity
- ✅ Immutable snapshot creation
- ✅ Latency: p95 < 500ms

### CCP-04: Snapshot Operations
- ✅ Concurrent snapshot creation (15 users)
- ✅ Immutability enforcement
- ✅ Version chain integrity
- ✅ Checksum validation
- ✅ Mutation rejection (>95%)
- ✅ Rollback prevention

---

## Read Results

```bash
# View latest results
cat tests/load/results/ccp03-*.json | jq '.metrics'

# Extract specific metric
cat tests/load/results/ccp03-*.json | jq '.metrics.reports_created.value'

# Check if passed
cat tests/load/results/ccp03-*.json | jq '.summary'
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Command not found: k6" | `brew install k6` (macOS) |
| "Connection refused" | Run `pnpm dev` first |
| "404 errors" | Check `/api/report/create` endpoint exists |
| "High error rate" | Check server logs, reduce VUs |

---

## Performance Targets

| Metric | CCP-03 | CCP-04 |
|--------|--------|--------|
| **Error Rate** | < 10% | < 10% |
| **p95 Latency** | < 500ms | < 600ms |
| **Atomicity** | 100% | 100% |
| **Immutability** | 100% | > 95% mutation rejection |
| **Throughput** | 50+ reports/min | 80+ snapshots/min |

---

## Full Docs

See [LOAD-TESTING.md](LOAD-TESTING.md) for:
- Detailed test descriptions
- Custom load profiles
- Result interpretation
- CI/CD integration
- Advanced configuration

---

## Test Scripts

| File | Purpose |
|------|---------|
| [ccp03_report_create.js](ccp03_report_create.js) | Report creation load test |
| [ccp04_snapshot_ops.js](ccp04_snapshot_ops.js) | Snapshot operations load test |
| [orchestrate.js](orchestrate.js) | Test orchestration |
| [LOAD-TESTING.md](LOAD-TESTING.md) | Complete documentation |
