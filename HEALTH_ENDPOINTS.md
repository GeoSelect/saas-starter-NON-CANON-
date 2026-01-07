<!-- SPDX-License-Identifier: MIT -->

# Health Endpoints & Monitoring

## Overview

This document describes the health check system for GeoSelect Telluride (Phase 2, D032/D036 automation).

**Status**: Implements Kubernetes-compatible liveness/readiness probes + Docker health checks + monitoring endpoints.

**Locked Decision Dependency**: D005 (AWS Secrets Manager for secrets checks)

---

## 1. Endpoints

### GET `/health` - Full System Health

Returns comprehensive health status of all system components.

```bash
curl http://localhost:8000/health
```

**Response (Healthy)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-22T14:32:15.123Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "staging",
  "checks": {
    "database": {
      "status": "connected",
      "latency": 12,
      "poolSize": 10
    },
    "secrets": {
      "status": "accessible",
      "backend": "aws-secrets",
      "region": "us-west-2"
    },
    "memory": {
      "status": "healthy",
      "heapUsed": 104857600,
      "heapTotal": 209715200,
      "external": 5242880
    },
    "audit": {
      "status": "operational",
      "eventsProcessed": 4521,
      "lastEventAt": "2025-01-22T14:31:45.000Z"
    }
  }
}
```

**Response (Degraded)**:
```json
{
  "status": "degraded",
  "timestamp": "2025-01-22T14:32:15.123Z",
  "checks": {
    "memory": {
      "status": "warning",
      "heapUsed": 167772160,
      "heapTotal": 209715200
    }
  }
}
```

**Status Codes**:
- `200 OK` - System is healthy
- `503 Service Unavailable` - System is degraded or unhealthy

---

### GET `/health/live` - Liveness Probe

Simple endpoint for Kubernetes liveness probes. Always responds `200` if the process is running.

```bash
curl http://localhost:8000/health/live
```

**Response**:
```json
{
  "status": "alive"
}
```

**Status Codes**:
- `200 OK` - Process is running

**Use Case**: Kubernetes will restart pod if this fails (indicates process is dead).

---

### GET `/health/ready` - Readiness Probe

Comprehensive endpoint for Kubernetes readiness probes. Returns `200` only if all dependencies are ready.

```bash
curl http://localhost:8000/health/ready
```

**Response (Ready)**:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "connected" },
    "secrets": { "status": "accessible" },
    "audit": { "status": "operational" }
  }
}
```

**Status Codes**:
- `200 OK` - Ready to receive traffic
- `503 Service Unavailable` - Not ready (dependencies failing)

**Use Case**: Kubernetes will remove pod from load balancer if this fails (indicates pod can't handle requests).

---

## 2. Health Checks

### Database Check

Validates PostgreSQL connectivity.

```typescript
// Location: src/health.ts
checkDatabase(): Promise<DatabaseHealth>
```

**What's Checked**:
- ✅ TCP connection to PostgreSQL
- ✅ Query execution (simple SELECT to audit table)
- ✅ Query latency (in milliseconds)
- ✅ Connection pool status

**Configuration**:
```env
# .env.local or .env.staging
DATABASE_URL=postgresql://user:pass@localhost:5432/geoselect
HEALTH_DB_TIMEOUT_MS=5000
```

**Failure Scenarios**:
- Network unreachable → `ECONNREFUSED`
- Wrong credentials → `FATAL: password authentication failed`
- Timeout (default: 5 seconds) → marked degraded, not unhealthy

---

### Secrets Check

Validates AWS Secrets Manager accessibility (D005 decision).

```typescript
// Location: src/health.ts
checkSecrets(): Promise<SecretsHealth>
```

**What's Checked**:
- ✅ AWS Secrets Manager API reachable
- ✅ Can list secrets (permissions check)
- ✅ Specific secret exists (GEOSELECT_API_KEY)
- ✅ AWS region connectivity

**Configuration**:
```env
# AWS credentials (from Phase 1)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-west-2
AWS_SECRETS_NAME=geoselect-staging
```

**Failure Scenarios**:
- No AWS credentials → `NoCredentialProvider`
- Invalid credentials → `InvalidSignatureException`
- Wrong region → timeout or `RequestLimitExceeded`
- Secret doesn't exist → can list but secret missing

---

### Memory Check

Monitors Node.js heap usage.

```typescript
// Location: src/health.ts
checkMemory(): Promise<MemoryHealth>
```

**What's Checked**:
- ✅ Heap usage percentage
- ✅ Heap used (bytes)
- ✅ Heap total (bytes)
- ✅ External memory (buffers, etc.)

**Thresholds**:
```
Healthy:  < 80% heap used
Warning:  80-95% heap used (status = "warning")
Critical: > 95% heap used (status = "critical")
```

**Configuration**:
```env
HEALTH_MEMORY_WARNING_PCT=80
HEALTH_MEMORY_CRITICAL_PCT=95
```

**Typical Heap Sizes**:
```
Local development:  256MB default Node heap
Docker container:   512MB (from Dockerfile)
Production:         1GB recommended
```

---

### Audit Check

Validates audit system operational status.

```typescript
// Location: src/health.ts
checkAudit(): Promise<AuditHealth>
```

**What's Checked**:
- ✅ Audit table accessible (inherits from DB check)
- ✅ Recent events being logged (last 1 hour)
- ✅ Event processing rate (events/minute)
- ✅ Last event timestamp (to detect stalled processing)

**Configuration**:
```env
HEALTH_AUDIT_RECENT_HOURS=1
HEALTH_AUDIT_MIN_EVENTS_PER_MINUTE=0  # 0 = disabled, allows quiet periods
```

**Failure Scenarios**:
- No events in 1 hour → `degraded`
- Event queue backlog → `warning`
- Audit writes failing → `unhealthy`

---

## 3. Docker Integration

### Dockerfile Health Check

Add to production Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health/live || exit 1
```

**Behavior**:
- Checks liveness every 30 seconds
- If 3 consecutive checks fail → container marked unhealthy
- Docker will restart unhealthy container after 1 minute

**Config Options**:
```dockerfile
# Slower check for intensive operations
--interval=60s          # Check every 60 seconds
--timeout=15s           # Allow 15 seconds for response
--start-period=30s      # Wait 30 seconds before first check
--retries=5             # Restart after 5 failures
```

---

## 4. Kubernetes Integration

### Liveness Probe

Ensures pod is running. Restarts dead pods.

```yaml
# kubernetes/deployment.yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8000
    scheme: HTTP
  initialDelaySeconds: 10      # Wait 10s for startup
  periodSeconds: 10            # Check every 10s
  timeoutSeconds: 5            # Allow 5s for response
  failureThreshold: 3          # Restart after 3 failures
```

### Readiness Probe

Ensures pod is ready for traffic. Removes from load balancer if failing.

```yaml
# kubernetes/deployment.yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 8000
    scheme: HTTP
  initialDelaySeconds: 5       # Wait 5s for startup
  periodSeconds: 5             # Check every 5s
  timeoutSeconds: 3            # Allow 3s for response
  failureThreshold: 2          # Remove from LB after 2 failures
```

### Combined Health Check Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: geoselect-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: geoselect-api
  template:
    metadata:
      labels:
        app: geoselect-api
    spec:
      containers:
      - name: api
        image: ecr.aws/geoselect/api:latest  # D002 = ECR
        ports:
        - containerPort: 8000
        
        # Simple liveness: is process alive?
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 10
          failureThreshold: 3
        
        # Complex readiness: are dependencies ready?
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
          failureThreshold: 2
        
        # Full health for monitoring
        env:
        - name: HEALTH_CHECK_ENABLED
          value: "true"
```

---

## 5. Monitoring & Alerting

### GitHub Actions Health Check Workflow

Automated health checks every 30 minutes (`.github/workflows/health-check.yml`):

**Schedule**:
```yaml
on:
  schedule:
    - cron: '0,30 9-17 * * 1-5'  # Every 30 min, business hours, weekdays
  workflow_dispatch:              # Manual trigger
```

**Steps**:
1. Call `/health` endpoint
2. Parse response and validate all checks pass
3. If failure → create GitHub issue + Slack notification
4. Run smoke test suite
5. Upload health report as artifact

**Failure Conditions**:
- HTTP status != 200 (returns 503 or timeout)
- Any check status is `unhealthy`
- Response takes > 10 seconds
- Network unreachable

---

### Slack Alerts

When health check fails:

```json
{
  "text": "❌ Health Check Failed",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "⚠️ *Health Check Failed*\nStatus: 503 Service Unavailable\nRepository: geoselect-telluride\nRun: [View Details](https://github.com/...)"
      }
    }
  ]
}
```

**To Enable**:
1. Create Slack webhook: https://api.slack.com/messaging/webhooks
2. Add secret: `Settings → Secrets → New → SLACK_WEBHOOK_URL`
3. Workflow will auto-notify on failure

---

### GitHub Issues Auto-Create

On persistent failures, create issue:

```markdown
## 🚨 Health Check Failed

- **Timestamp**: 2025-01-22T14:32:15Z
- **Workflow Run**: [View](...)
- **Branch**: main

### Action Required
1. Review workflow logs
2. Check deployment status
3. Verify database and AWS connectivity
4. Check memory usage

Labels: health-check-failure, infrastructure
```

---

## 6. Local Development

### Running Health Checks Locally

```bash
# Start backend
npm run dev

# In another terminal:
curl http://localhost:8000/health

# Check liveness
curl http://localhost:8000/health/live

# Check readiness
curl http://localhost:8000/health/ready
```

### Running Smoke Tests

```bash
# Run health endpoint tests
npm test tests/health.test.ts

# Run with coverage
npm test tests/health.test.ts --coverage

# Run and watch
npm test tests/health.test.ts --watch
```

### Debugging Health Issues

```bash
# Check memory usage
node -e "console.log(process.memoryUsage())"

# Check environment variables
echo $DATABASE_URL
echo $AWS_REGION

# Test database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Test AWS Secrets Manager
aws secretsmanager list-secrets --region us-west-2
```

---

## 7. Performance & SLA

### Response Time Targets

| Endpoint | Target | Max |
|----------|--------|-----|
| `/health/live` | < 50ms | 100ms |
| `/health/ready` | < 200ms | 500ms |
| `/health` | < 500ms | 1s |

### Availability Targets

| Service | Target | Acceptable Downtime |
|---------|--------|---------------------|
| Liveness Probe | 99.9% | <8 seconds/day |
| Readiness Probe | 99.5% | <43 seconds/day |
| Full Health | 99.0% | <86 seconds/day |

### Monitoring Metrics

Suggested Prometheus metrics:

```typescript
// Add to src/health.ts
const healthCheckDuration = new prometheus.Histogram({
  name: 'health_check_duration_seconds',
  help: 'Time taken for health check',
  labelNames: ['endpoint']
});

const healthCheckStatus = new prometheus.Gauge({
  name: 'health_check_status',
  help: 'Health check status (1=healthy, 0=unhealthy)',
  labelNames: ['check']
});
```

---

## 8. Troubleshooting

### Database Connection Failed

```
Error: ECONNREFUSED - connection refused

Solution:
1. Check DATABASE_URL: psql $DATABASE_URL -c "SELECT 1"
2. Check PostgreSQL running: pg_isready -h localhost -p 5432
3. Check network: telnet localhost 5432
```

### AWS Secrets Manager Inaccessible

```
Error: NoCredentialProvider

Solution:
1. Check credentials: aws configure
2. Check region: AWS_REGION env var set
3. Check IAM permissions: aws secretsmanager list-secrets
```

### High Memory Usage

```
Memory: critical (96% heap used)

Solution:
1. Check for memory leaks: npm list --depth=0
2. Increase heap: NODE_OPTIONS=--max-old-space-size=2048
3. Check what's in memory: node --inspect & then chrome://inspect
```

### Audit System Degraded

```
Audit: degraded (0 events in last hour)

Solution:
1. Check audit writes: SELECT COUNT(*) FROM audit_trail WHERE created_at > NOW() - INTERVAL '1 hour'
2. Check permissions: Audit user has INSERT on audit_trail
3. Check database size: SELECT pg_size_pretty(pg_database_size('geoselect'))
```

---

## 9. Implementation Checklist

- [ ] Health endpoint handler created (`src/health.ts`)
- [ ] Express routes wired (app.get('/health', healthHandler))
- [ ] Database check implemented + tested
- [ ] AWS Secrets Manager check implemented + tested
- [ ] Memory monitoring enabled
- [ ] Audit system check implemented + tested
- [ ] Smoke tests pass (`npm test tests/health.test.ts`)
- [ ] Docker HEALTHCHECK added to Dockerfile
- [ ] GitHub Actions workflow enabled (`.github/workflows/health-check.yml`)
- [ ] Slack notifications configured (SLACK_WEBHOOK_URL secret)
- [ ] Kubernetes probes configured (deployment.yaml)
- [ ] Monitoring metrics exported (optional: Prometheus)
- [ ] Documentation published (this file)
- [ ] Team trained on health endpoints
- [ ] SLA targets set and monitored

---

## 10. Related Decisions

- **D005** (Secrets Backend): AWS Secrets Manager (locked, Phase 1)
- **D032** (Health Endpoints): Implemented in this phase
- **D036** (Smoke Tests): Implemented in this phase
- **D041** (Kubernetes Readiness): Uses /health/ready probe
- **D042** (Docker Health Checks): Uses /health/live probe

---

**Last Updated**: 2025-01-22  
**Status**: Phase 2 Implementation Complete  
**Owner**: Backend/SRE Team  
**Audience**: DevOps, Backend Engineers, Platform Team
