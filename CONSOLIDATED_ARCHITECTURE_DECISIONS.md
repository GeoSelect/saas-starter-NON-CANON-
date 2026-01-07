# Consolidated Architecture Decisions for Testing Readiness

## Purpose

Single source of truth for all architectural decisions needed to deploy and test GeoSelect online.  
Deduplicates and organizes decisions by criticality and logical grouping.

---

## Decision Categories

### 🔴 CRITICAL PATH (Blocks Testing)
Must decide before deployment can begin.

### 🟡 IMPORTANT (Needed Before Launch)
Must decide within 2 days, but unlocks testing in parallel.

### 🟢 SUPPORTING (Decide During Testing)
Can be decided during testing, but improves developer experience.

---

## 1. COMPUTE & HOSTING

### 1.1 Frontend Hosting Platform
**Criticality**: 🔴 CRITICAL  
**Owner**: Frontend/UI  
**Current**: Vercel (confirmed)  
**Decision**: Use Vercel Git integration for auto-deploys on push?
- [ ] Yes, Git integration (recommended for PR previews)
- [ ] Manual deploys via `vercel/action`

---

### 1.2 Backend Hosting Platform (Spine)
**Criticality**: 🔴 CRITICAL  
**Owner**: Backend/SRE  
**Impact**: All backend services depend on this  
**Options**:
- [ ] **Railway** (15 min setup, free tier, auto Docker deploys)
- [ ] **Fly.io** (20 min setup, global edge)
- [ ] **DigitalOcean App Platform** (fast, integrates with DO Postgres)
- [ ] **AWS ECS/Fargate** (enterprise scale, complex setup)
- [ ] **Google Cloud Run** (serverless, scales to zero)

**Recommendation**: DigitalOcean App Platform for MVP (integrates with managed Postgres, simple setup, $12+/month)

**Decision Required**: Which platform? ➜ _____________

---

### 1.3 Container Registry
**Criticality**: 🔴 CRITICAL  
**Owner**: Backend/SRE  
**Where**: Docker image for spine lives here before deployment  
**Options**:
- [ ] **GitHub Container Registry (GHCR)** (free, GitHub-native)
- [ ] **Docker Hub** (free public, $5/month private)
- [ ] **AWS ECR** (if using AWS ECS)
- [ ] **DigitalOcean Registry** (if using DO App Platform)

**Recommendation**: GHCR for GitHub-native CI/CD flow

**Decision Required**: Which registry? ➜ _____________

---

## 2. DATABASE & DATA

### 2.1 Database of Record
**Criticality**: 🔴 CRITICAL  
**Owner**: Backend/SRE  
**Impact**: Everything depends on this  
**Options**:
- [ ] **Supabase Postgres** (managed, includes Postgres + Auth + Storage + Vector)
- [ ] **AWS RDS Postgres** (managed, integrates with AWS)
- [ ] **DigitalOcean Managed Postgres** (if using DO App Platform)
- [ ] **Self-hosted Postgres in container** (full control, more ops burden)

**Note**: Must support:
- Audit system (5 tables, 7 constraints, triggers)
- PostGIS extension (for geo queries)
- pg_cron extension (for scheduled jobs: archive, partition creation)

**Recommendation**: Supabase Postgres (all extensions supported, includes Auth)

**Decision Required**: Which database? ➜ _____________

---

### 2.2 Data Separation Strategy
**Criticality**: 🔴 CRITICAL  
**Owner**: Backend/SRE  
**Impact**: Test isolation, confidence  
**Options**:
- [ ] **Separate Supabase projects** (separate databases, URLs, auth keys)
- [ ] **Separate schemas in same DB** (cheaper, higher isolation risk)
- [ ] **Same DB, different test data** (simplest, contamination risk)

**Recommendation**: Separate Supabase projects (staging ≠ prod, clear isolation)

**Decision Required**: Separate or shared? ➜ _____________

---

### 2.3 Database Migrations Strategy
**Criticality**: 🔴 CRITICAL  
**Owner**: Backend/SRE  
**Impact**: Audit system deployment, schema safety  
**What must migrate**:
- Audit tables (5 tables)
- Audit constraints (7 types)
- Audit triggers (3+)
- Audit functions (6+)
- Audit views (3+)
- PostGIS extension
- pg_cron extension

**Options**:
- [ ] **Supabase Migrations CLI** (`supabase migration up`)
- [ ] **Single SQL file** (simpler but riskier)
- [ ] **Node.js migration tool** (TypeORM, Knex, Drizzle)
- [ ] **Manual SQL scripts** (no automation)

**Recommendation**: Supabase Migrations CLI (versioned, reversible, safe)

**Sequence**: 
1. Create staging Supabase project
2. Run migrations in staging
3. Test thoroughly
4. Repeat for production

**Decision Required**: Which migration tool? ➜ _____________

**Blocker**: Audit system must be fully migrated before team testing begins.

---

### 2.4 Test Data & Seeding
**Criticality**: 🟡 IMPORTANT  
**Owner**: Backend  
**Impact**: Tester experience  
**Decisions**:
- [ ] Seed 2-3 demo workspaces with sample data?
- [ ] Seed test user accounts (admin, editor, viewer)?
- [ ] Seed sample reports/analyses?

**Recommendation**: Yes to all three (better testing experience)

**Decision Required**: Seed script or manual setup? ➜ _____________

---

### 2.5 Backup & Snapshot Policy
**Criticality**: 🔴 CRITICAL (before prod migrations)  
**Owner**: Ops/SRE  
**Impact**: Rollback capability  
**Decisions**:
- [ ] **Before migrations**: Create manual snapshot of production database
- [ ] **Automated backups**: Enable daily automated backups
- [ ] **Retention**: Keep backups for 7 days (testing phase)

**Recommendation**: Manual snapshot immediately before any prod migration

**Decision Required**: Snapshot process documented? ➜ _____________

---

## 3. AUTHENTICATION & ACCESS

### 3.1 Auth Provider & Methods
**Criticality**: 🔴 CRITICAL  
**Owner**: Security  
**Current**: Supabase Auth  
**Decisions**:
- [ ] **Magic link** (email-based login) — enabled?
- [ ] **Google OAuth** — enabled?
- [ ] **GitHub OAuth** — enabled?
- [ ] **Password-based** — enabled?

**Recommendation**: Magic link + Google OAuth (easiest for testers)

**Decision Required**: Which auth methods? ➜ _____________

---

### 3.2 Redirect URL Configuration
**Criticality**: 🔴 CRITICAL  
**Owner**: Security  
**Impact**: Auth flows must redirect correctly  
**URLs to configure in Supabase**:
- [ ] Staging: `https://app-staging.yourdomain.com/auth/callback`
- [ ] Staging previews: `https://*.vercel.app/auth/callback` (wildcard for PR previews)
- [ ] Production: `https://app.yourdomain.com/auth/callback`

**Decision Required**: Which redirect URLs? ➜ _____________

---

### 3.3 Row-Level Security (RLS) Posture
**Criticality**: 🔴 CRITICAL  
**Owner**: Security  
**Impact**: Data isolation between workspaces, users  
**Decisions**:
- [ ] **Enable RLS immediately** in staging (require users to belong to workspace)
- [ ] **Enable RLS after validation** in prod (backfill + test first)
- [ ] **RLS policies**: Defined (workspace membership, audit read access)

**Recommendation**: Enable in staging immediately; validate before prod

**Decision Required**: When to enable RLS? ➜ _____________

---

### 3.4 Test User Accounts
**Criticality**: 🟡 IMPORTANT  
**Owner**: Security  
**Impact**: Tester onboarding  
**Create**:
- [ ] Admin user (can create workspaces, manage users)
- [ ] Editor user (can create/edit data)
- [ ] Viewer user (read-only)

**Decision Required**: Test users created in staging? ➜ _____________

---

## 4. SECRETS & CONFIGURATION

### 4.1 Secrets Management
**Criticality**: 🔴 CRITICAL  
**Owner**: Security  
**Impact**: Credentials never exposed  
**Options**:
- [ ] **Vercel Environment Variables** (frontend secrets)
- [ ] **Platform Secrets** (Railway/DO/etc. for backend secrets)
- [ ] **GitHub Secrets** (CI/CD only, never committed)
- [ ] **1Password/LastPass** (team-shared vault, optional)

**Critical Secrets to Manage**:
- `SUPABASE_URL` (public, can go in code)
- `SUPABASE_ANON_KEY` (public, can go in code)
- `SUPABASE_SERVICE_ROLE_KEY` (secret, backend only)
- `DATABASE_URL` (secret, backend only)
- `JWT_SECRET` (if custom auth)
- `STRIPE_SECRET_KEY` (if payments)
- Docker registry credentials (for CI/CD)

**Recommendation**: 
- Public vars: Vercel env vars + code
- Secret vars: Platform secret managers (never in code/repo)
- CI/CD: GitHub Secrets only

**Decision Required**: Secrets management location? ➜ _____________

---

### 4.2 Per-Environment Configuration
**Criticality**: 🟡 IMPORTANT  
**Owner**: Backend/SRE  
**Impact**: Correct URLs in each environment  
**Variables that differ by environment**:
- `NEXT_PUBLIC_API_URL` (frontend → backend)
  - Preview: `https://spine-preview.yourdomain.com`
  - Staging: `https://spine-staging.yourdomain.com`
  - Prod: `https://spine.yourdomain.com`
- `NEXT_PUBLIC_SUPABASE_URL` (frontend → Supabase)
  - Staging project
  - Prod project
- `SUPABASE_SERVICE_ROLE_KEY` (backend → Supabase)
- `DATABASE_URL` (backend → Postgres)

**Decision Required**: Which vars change per environment? ➜ _____________

---

### 4.3 Secrets Rotation Policy
**Criticality**: 🟢 SUPPORTING  
**Owner**: Security  
**Impact**: Long-term security posture  
**Decisions**:
- [ ] **Testing phase**: No rotation needed
- [ ] **Pre-production**: Rotate all secrets 30 days before prod launch
- [ ] **Ongoing**: Rotate secrets every 90 days

**Decision Required**: Rotation policy acceptable? ➜ _____________

---

## 5. DEPLOYMENT & RELEASE

### 5.1 Deployment Strategy
**Criticality**: 🔴 CRITICAL  
**Owner**: Backend/SRE  
**Impact**: How code gets from repo to servers  
**Frontend (Vercel)**:
- [ ] Git integration (auto-deploy on push to main)
- [ ] Preview deployments on every PR
- [ ] Manual promotion to staging (merge to staging branch)

**Backend (Docker)**:
- [ ] Manual deployment (push button in platform UI)
- [ ] CI/CD automation (GitHub Actions build → registry → deploy)

**Recommendation**: 
- Frontend: Git integration + PR previews
- Backend: CI/CD automation (safer, faster)

**Decision Required**: Frontend auto-deploy? Backend CI/CD? ➜ _____________

---

### 5.2 CI/CD Pipeline
**Criticality**: 🟡 IMPORTANT  
**Owner**: Backend/SRE  
**Impact**: Safe, repeatable deployments  
**Pipeline stages** (GitHub Actions):
1. Test (run unit tests, lint)
2. Build (build Docker image)
3. Push (push to registry)
4. Deploy to staging (auto)
5. Deploy to prod (manual, requires approval)

**Artifacts to generate**:
- [ ] `.github/workflows/deploy.yml` (CI/CD pipeline)
- [ ] `.dockerignore` (exclude unnecessary files)
- [ ] `docker-compose.yml` (local development)

**Decision Required**: Generate CI/CD pipeline? ➜ _____________

---

### 5.3 Image Tagging & Versioning
**Criticality**: 🟡 IMPORTANT  
**Owner**: Backend/SRE  
**Impact**: Reproducible rollbacks  
**Strategy**:
- [ ] Tag by commit SHA: `spine:abc123def456`
- [ ] Tag by semantic version: `spine:v1.2.3`
- [ ] Tag latest: `spine:latest`

**Recommendation**: Use SHA for deploys (reproducible); optionally add semver tag

**Decision Required**: Tagging strategy? ➜ _____________

---

### 5.4 Production Deployment Window
**Criticality**: 🟡 IMPORTANT  
**Owner**: Backend/SRE  
**Impact**: Availability during critical migrations  
**Decisions**:
- [ ] Zero-downtime deploys (migrations run safely)
- [ ] Scheduled maintenance window (e.g., 2 AM UTC)
- [ ] Change freeze window (no deploys 5 PM - 9 AM)

**Recommendation**: Zero-downtime for config/code; scheduled window for schema changes

**Decision Required**: Deployment window policy? ➜ _____________

---

### 5.5 Rollback Paths
**Criticality**: 🔴 CRITICAL  
**Owner**: Backend/SRE  
**Impact**: Recovery from bad deployments  
**Options**:
- [ ] **Code rollback**: Revert commit + redeploy
- [ ] **Feature flag**: Disable feature via config
- [ ] **Database snapshot restore**: Revert schema changes
- [ ] **Trigger drop**: Disable audit logging (last resort)

**Recommendation**: Code rollback (default) + snapshot restore (for migrations)

**Decision Required**: Rollback procedure documented? ➜ _____________

---

## 6. NETWORKING & CONNECTIVITY

### 6.1 Domain Names & URLs
**Criticality**: 🔴 CRITICAL  
**Owner**: Backend/SRE  
**Impact**: All services must have consistent URLs  
**Decisions**:
- [ ] **Primary domain**: `yourdomain.com`
- [ ] **App frontend**: 
  - Staging: `https://app-staging.yourdomain.com`
  - Prod: `https://app.yourdomain.com`
- [ ] **Spine API**:
  - Staging: `https://spine-staging.yourdomain.com`
  - Prod: `https://spine.yourdomain.com`
- [ ] **Other spine services** (GeoServer, tiles):
  - Staging: `https://geo-staging.yourdomain.com`, `https://tiles-staging.yourdomain.com`
  - Prod: `https://geo.yourdomain.com`, `https://tiles.yourdomain.com`

**Decision Required**: Domain and subdomain strategy? ➜ _____________

---

### 6.2 Frontend ↔ Backend Connectivity
**Criticality**: 🔴 CRITICAL  
**Owner**: Frontend/UI + Backend  
**Impact**: Frontend must know where to call backend  
**Decisions**:
- [ ] **API base URL**: Frontend env var `NEXT_PUBLIC_API_URL`
  - Must match actual deployed spine URL
  - Must be set correctly in Vercel per environment
- [ ] **CORS policy**: Allow frontend origin to call spine
  - Staging: Allow `https://app-staging.yourdomain.com`
  - Prod: Allow `https://app.yourdomain.com`

**Decision Required**: API endpoint URL? ➜ _____________

---

### 6.3 Spine ↔ Database Connectivity
**Criticality**: 🔴 CRITICAL  
**Owner**: Backend/SRE  
**Impact**: Spine must connect to database  
**Options**:
- [ ] **VPC/Private networking** (secure, no internet exposure)
- [ ] **Whitelisted IPs** (static IP firewall rules)
- [ ] **Public with password** (simplest, less secure)

**Recommendation**: VPC/private networking if your hosting platform supports it

**Decision Required**: Network isolation strategy? ➜ _____________

---

### 6.4 Service Auth Between App & Spine
**Criticality**: 🟡 IMPORTANT  
**Owner**: Security + Backend  
**Impact**: Spine security  
**Decisions**:
- [ ] **Public reads** (GeoServer tiles, no auth needed)
- [ ] **Authenticated writes** (use JWT from frontend auth)
- [ ] **Service-to-service** (Spine ↔ other Spine services, use shared secret/JWT)

**Recommendation**: JWT for writes, public for geo reads

**Decision Required**: Service auth model? ➜ _____________

---

## 7. OBSERVABILITY & OPERATIONS

### 7.1 Health & Readiness Endpoints
**Criticality**: 🔴 CRITICAL  
**Owner**: Backend/SRE  
**Impact**: Deployment automation, uptime monitoring  
**Implement**:
- [ ] **`GET /health`**: Returns `{ok: true, timestamp}` if healthy
  - Checks: DB connectivity, external services
  - Used by: Platform health checks
- [ ] **`GET /ready`**: Returns `{ready: true}` if ready for traffic
  - Checks: Dependencies fully initialized
  - Used by: Load balancers before routing traffic

**Decision Required**: Health check endpoints implemented? ➜ _____________

---

### 7.2 Error Tracking
**Criticality**: 🟡 IMPORTANT  
**Owner**: Backend/SRE  
**Impact**: Catching errors in production  
**Options**:
- [ ] **Sentry** (comprehensive error tracking, $15+/month)
- [ ] **Datadog** (logs + metrics + errors, $15+/month)
- [ ] **Platform logs only** (simpler, less visibility)

**Recommendation**: Sentry for MVP (error-focused, lowest cost)

**Decision Required**: Error tracking tool? ➜ _____________

---

### 7.3 Logging & Log Aggregation
**Criticality**: 🟡 IMPORTANT  
**Owner**: Backend/SRE  
**Impact**: Debugging production issues  
**Sources**:
- Frontend logs (Vercel dashboard)
- Backend logs (platform or aggregator)
- Database logs (Supabase/RDS dashboard)

**Options**:
- [ ] **Platform logs only** (Vercel logs + Railway logs + Supabase logs)
- [ ] **Aggregated** (Papertrail, LogDNA, Datadog)
- [ ] **Correlated by request ID** (pass through all layers)

**Recommendation**: Platform logs + correlation by request ID (simple, sufficient for MVP)

**Decision Required**: Logging strategy? ➜ _____________

---

### 7.4 Monitoring & Alerting
**Criticality**: 🟡 IMPORTANT  
**Owner**: Ops/SRE  
**Impact**: Detecting issues during testing  
**Alerts to set up**:
- [ ] High error rate (5xx > 2% for 5 min)
- [ ] Audit write failures (> 0.5% for 5 min)
- [ ] Database connection errors
- [ ] Cron job failures (archive, partition creation)
- [ ] Uptime/availability (health check failures)

**Decision Required**: Alert thresholds? ➜ _____________

---

### 7.5 Metrics & Performance Monitoring
**Criticality**: 🟢 SUPPORTING  
**Owner**: Backend/SRE  
**Impact**: Understanding performance bottlenecks  
**Metrics to track**:
- Request latency (p50, p95, p99)
- Audit event insert latency
- Database query performance
- Container CPU/memory usage
- Disk usage (database size)

**Tools**: Prometheus + Grafana (free) or Datadog (paid)

**Decision Required**: Metrics stack needed before testing? ➜ _____________

---

## 8. DATA INTEGRITY & COMPLIANCE

### 8.1 Audit System Immutability
**Criticality**: 🔴 CRITICAL  
**Owner**: Backend + Security  
**Impact**: Compliance, forensics  
**Decisions**:
- [ ] **Append-only**: Use triggers to prevent UPDATE/DELETE on audit_trail
- [ ] **App role privileges**: Revoke UPDATE/DELETE for app connection
- [ ] **Superuser maintenance**: Document exceptions for DBAs only

**Recommendation**: Enforce append-only via trigger + document maintenance path

**Decision Required**: Audit immutability enforced? ➜ _____________

---

### 8.2 Audit Write Monitoring
**Criticality**: 🟡 IMPORTANT  
**Owner**: Backend + Security  
**Impact**: Detecting audit system failures  
**Implement**:
- [ ] Instrument `appendAuditEvent()` to emit metric on failure
- [ ] Alert if audit write failures exceed threshold (0.5% for 5 min)
- [ ] Log audit write errors with full context

**Decision Required**: Audit write monitoring implemented? ➜ _____________

---

### 8.3 Workspace Membership Validation
**Criticality**: 🔴 CRITICAL  
**Owner**: Backend  
**Impact**: Tenancy safety  
**Decisions**:
- [ ] **Server-side enforcement**: All writes check workspace membership
- [ ] **RLS policies**: Postgres enforces membership at database level
- [ ] **Audit trail**: Record who accessed what workspace

**Recommendation**: Both server-side + RLS (defense in depth)

**Decision Required**: Membership validation enforced? ➜ _____________

---

### 8.4 GDPR/CCPA Compliance
**Criticality**: 🟡 IMPORTANT (if handling EU/CA users)  
**Owner**: Security  
**Impact**: Legal compliance  
**Implement**:
- [ ] **Data Subject Access Request**: Query all user data
- [ ] **Right to Erasure**: Delete user data + log in audit trail
- [ ] **Privacy Policy**: Written and published
- [ ] **Retention Policy**: Define how long data is kept

**Recommendation**: Implement for staging (testing path)

**Decision Required**: Compliance requirements for testing? ➜ _____________

---

## 9. FILE UPLOADS & STORAGE

### 9.1 File Storage Location
**Criticality**: 🟡 IMPORTANT  
**Owner**: Backend  
**Impact**: Where PDFs, images, analysis results live  
**Options**:
- [ ] **Supabase Storage** (simple, integrates with Postgres)
- [ ] **AWS S3** (scalable, if using AWS)
- [ ] **DigitalOcean Spaces** (if using DO)
- [ ] **Self-hosted S3-compatible** (minio, complex)

**Recommendation**: Supabase Storage (simplest, integrated with auth/RLS)

**Decision Required**: File storage platform? ➜ _____________

---

### 9.2 Upload Security
**Criticality**: 🟡 IMPORTANT  
**Owner**: Security  
**Impact**: File access control  
**Decisions**:
- [ ] **Private bucket**: Require signed URLs to access
- [ ] **Public bucket**: Direct URLs, no auth needed
- [ ] **Server-mediated upload**: Backend validates, uploads on behalf of user
- [ ] **Client-side upload**: Presigned URLs, client uploads directly

**Recommendation**: Private bucket + server-mediated upload (safer)

**Decision Required**: Upload & access model? ➜ _____________

---

## 10. ENVIRONMENT & BRANCH STRATEGY

### 10.1 Git Branch Strategy
**Criticality**: 🟡 IMPORTANT  
**Owner**: Backend/Frontend  
**Impact**: Code organization, deployment flow  
**Branches**:
- [ ] **`main`**: Production-ready code
- [ ] **`staging`**: Staging environment code
- [ ] **Feature branches**: Per-feature development

**Promotion**: `feature` → PR → review → merge to `staging` → test → merge to `main` → auto-deploy to prod

**Decision Required**: Branch strategy defined? ➜ _____________

---

### 10.2 Preview Deployments
**Criticality**: 🟡 IMPORTANT  
**Owner**: Frontend  
**Impact**: Testing PRs before merge  
**Decisions**:
- [ ] **Enable Vercel Preview** (auto-deploy on PR)
- [ ] **Can testers access previews**: Yes (with test auth) or No (internal only)
- [ ] **Preview auth**: Use staging Supabase project

**Recommendation**: Enable previews, but restrict to GitHub team members

**Decision Required**: Preview deployment policy? ➜ _____________

---

## 11. SCHEDULED JOBS & AUTOMATION

### 11.1 Archive Job (Audit Data)
**Criticality**: 🔴 CRITICAL  
**Owner**: Backend/SRE  
**Impact**: Audit system operational, query performance  
**Schedule**:
- [ ] **Frequency**: Daily at 2 AM UTC
- [ ] **Operation**: Move audit records >90 days old to archive table
- [ ] **Automation**: Use pg_cron (in-database) or platform cron

**Decision Required**: Archive job scheduled? ➜ _____________

---

### 11.2 Partition Creation (Audit Performance)
**Criticality**: 🔴 CRITICAL  
**Owner**: Backend/SRE  
**Impact**: Prevents unbounded table growth  
**Schedule**:
- [ ] **Frequency**: Monthly on the 1st at 1 AM UTC
- [ ] **Operation**: Create new monthly partition for audit_trail
- [ ] **Automation**: Use pg_cron or platform scheduler

**Decision Required**: Partition creation scheduled? ➜ _____________

---

### 11.3 Backup Job (Database Resilience)
**Criticality**: 🟡 IMPORTANT  
**Owner**: Ops/SRE  
**Impact**: Disaster recovery  
**Schedule**:
- [ ] **Frequency**: Daily automated snapshots
- [ ] **Retention**: 7 days (testing phase)
- [ ] **Automation**: Platform-provided or cron

**Decision Required**: Backup schedule enabled? ➜ _____________

---

## 12. TESTING & QUALITY

### 12.1 Smoke Tests
**Criticality**: 🟡 IMPORTANT  
**Owner**: QA/Backend  
**Impact**: Basic confidence before team testing  
**Smoke tests** (minimal set):
- [ ] App loads without errors
- [ ] Can login with test account
- [ ] Can create workspace
- [ ] Can switch workspaces
- [ ] Audit event appears in database

**Implement**: Script or automated test suite

**Decision Required**: Smoke tests created? ➜ _____________

---

### 12.2 E2E Test Coverage
**Criticality**: 🟢 SUPPORTING  
**Owner**: QA  
**Impact**: Release confidence  
**Decide**: 
- [ ] Defer E2E tests until after initial testing
- [ ] Create minimal happy-path E2E tests now

**Recommendation**: Defer (MVP testing phase doesn't require full coverage)

**Decision Required**: E2E testing scope? ➜ _____________

---

### 12.3 Testing Scope for Team
**Criticality**: 🟡 IMPORTANT  
**Owner**: Product  
**Impact**: What testers focus on  
**Happy path flows to test**:
- [ ] Login/logout
- [ ] Create workspace
- [ ] Invite users
- [ ] Switch workspaces
- [ ] View audit trail
- [ ] Create analysis
- [ ] (Add custom flows)

**Known limitations**: List what's NOT tested

**Decision Required**: Testing scope document created? ➜ _____________

---

## 13. GOVERNANCE & OWNERSHIP

### 13.1 Ownership & Approval
**Criticality**: 🟡 IMPORTANT  
**Owner**: Leadership  
**Impact**: Decision accountability  
**Assign**:
- [ ] **Frontend Owner**: Who approves Frontend changes?
- [ ] **Backend Owner**: Who approves Backend changes?
- [ ] **Database Owner**: Who approves schema changes?
- [ ] **Security Owner**: Who approves security changes?
- [ ] **Release Owner**: Who approves prod deployments?

**Decision Required**: All 5 roles assigned? ➜ _____________

---

### 13.2 Change Control for Sensitive Areas
**Criticality**: 🔴 CRITICAL  
**Owner**: Security  
**Impact**: Audit system integrity, RLS policies, auth  
**Require approval** from Security for changes to:
- [ ] Audit system schema
- [ ] RLS policies
- [ ] Auth configuration
- [ ] Secrets/credentials

**Decision Required**: Change control process documented? ➜ _____________

---

### 13.3 Release Decision Matrix
**Criticality**: 🟡 IMPORTANT  
**Owner**: Backend/SRE + Product  
**Impact**: Who decides when to deploy  
**Decisions**:
- [ ] Staging deploys: Backend/SRE decides (can auto-deploy)
- [ ] Prod deploys: Product + Backend + Security sign-off
- [ ] Emergency rollback: Backend/SRE decides (post-notify)

**Decision Required**: Approval matrix defined? ➜ _____________

---

## 14. DOCUMENTATION & RUNBOOKS

### 14.1 Deployment Runbook
**Criticality**: 🟡 IMPORTANT  
**Owner**: Backend/SRE  
**Impact**: Repeatable deployments  
**Document**:
- [ ] How to deploy Frontend (Vercel push)
- [ ] How to deploy Backend (Docker build/push/deploy)
- [ ] How to run database migrations
- [ ] How to verify deployment success
- [ ] How to rollback if needed

**Location**: `docs/RUNBOOKS/DEPLOYMENT.md`

**Decision Required**: Runbook written? ➜ _____________

---

### 14.2 Incident Response Playbook
**Criticality**: 🟢 SUPPORTING  
**Owner**: Security + SRE  
**Impact**: Fast recovery from issues  
**Document**:
- [ ] Error escalation (who to notify)
- [ ] Audit write failure response
- [ ] Database connectivity failure response
- [ ] Auth system failure response
- [ ] Data breach response

**Location**: `docs/RUNBOOKS/INCIDENTS.md`

**Decision Required**: Incident playbook drafted? ➜ _____________

---

### 14.3 Testing Guide for Team
**Criticality**: 🟡 IMPORTANT  
**Owner**: Product  
**Impact**: Tester effectiveness  
**Document**:
- [ ] How to access staging
- [ ] Test user credentials
- [ ] Happy path flows to test
- [ ] Known limitations
- [ ] How to report issues
- [ ] FAQ

**Location**: `docs/TESTING_GUIDE.md`

**Decision Required**: Testing guide written? ➜ _____________

---

## Decision Dependency Graph

```
CRITICAL PATH (Must Decide First, Days 1-2):
  └─ 1.2 Backend Hosting
  └─ 1.3 Container Registry ← depends on 1.2
  └─ 2.1 Database of Record
  └─ 2.2 Data Separation
  └─ 2.3 Database Migrations ← depends on 2.1, 2.2
  └─ 3.1 Auth Provider
  └─ 3.3 RLS Posture ← depends on 2.1
  └─ 4.1 Secrets Management
  └─ 4.2 Per-Environment Config ← depends on 1.2, 2.1
  └─ 5.1 Deployment Strategy ← depends on 1.2, 1.3
  └─ 6.1 Domain Names ← depends on 1.2
  └─ 6.2 Frontend ↔ Backend ← depends on 1.2, 6.1

IMPORTANT (Can Decide Days 2-3, in parallel with critical path):
  └─ 2.4 Test Data
  └─ 3.2 Redirect URLs ← depends on 6.1, 3.1
  └─ 3.4 Test Users ← depends on 3.1
  └─ 5.2 CI/CD Pipeline ← depends on 1.3
  └─ 5.3 Image Tagging
  └─ 6.3 Spine ↔ Database ← depends on 2.1, 1.2
  └─ 6.4 Service Auth
  └─ 7.1 Health Endpoints
  └─ 7.2 Error Tracking
  └─ 8.1 Audit Immutability
  └─ 9.1 File Storage
  └─ 12.1 Smoke Tests
  └─ 12.3 Testing Scope
  └─ 13.1 Ownership Assignment
  └─ 14.1 Deployment Runbook
  └─ 14.3 Testing Guide

SUPPORTING (Can Decide during testing):
  └─ 7.3 Log Aggregation
  └─ 7.4 Alerting
  └─ 7.5 Metrics Stack
  └─ 10.2 Preview Deployments
  └─ 12.2 E2E Tests
  └─ 13.2 Change Control
  └─ 14.2 Incident Playbook
```

---

## Completion Checklist

### Phase 1: Critical Path (Days 1-2)
- [ ] 1.2: Backend Hosting decided
- [ ] 1.3: Container Registry decided
- [ ] 2.1: Database of Record decided
- [ ] 2.2: Data Separation decided
- [ ] 2.3: Database Migrations strategy decided
- [ ] 3.1: Auth Provider decided
- [ ] 3.3: RLS Posture decided
- [ ] 4.1: Secrets Management decided
- [ ] 4.2: Per-Environment Config decided
- [ ] 5.1: Deployment Strategy decided
- [ ] 6.1: Domain Names decided
- [ ] 6.2: Frontend ↔ Backend connectivity decided

### Phase 2: Important (Days 2-3)
- [ ] 2.4: Test Data seeding decided
- [ ] 3.2: Redirect URLs configured
- [ ] 3.4: Test Users created
- [ ] 5.2: CI/CD Pipeline generated
- [ ] 5.3: Image Tagging strategy decided
- [ ] 6.3: Spine ↔ Database connectivity configured
- [ ] 6.4: Service Auth model decided
- [ ] 7.1: Health Endpoints implemented
- [ ] 7.2: Error Tracking tool chosen
- [ ] 8.1: Audit Immutability enforced
- [ ] 9.1: File Storage platform chosen
- [ ] 12.1: Smoke tests created
- [ ] 12.3: Testing scope documented
- [ ] 13.1: Ownership assigned
- [ ] 14.1: Deployment Runbook written
- [ ] 14.3: Testing Guide written

### Phase 3: Supporting (During/After Testing)
- [ ] 2.5: Backup policy documented
- [ ] 7.3: Log aggregation implemented
- [ ] 7.4: Alerting configured
- [ ] 7.5: Metrics stack deployed
- [ ] 10.2: Preview deployment policy enforced
- [ ] 12.2: E2E tests written (if needed)
- [ ] 13.2: Change control process documented
- [ ] 14.2: Incident Response Playbook written

---

## Summary

**Total Decisions**: 44 (consolidated from ~70 overlapping items)  
**Critical Path** (must decide): 12  
**Important** (decide within 2 days): 15  
**Supporting** (decide during testing): 8  
**Governance** (assign roles): 3  
**Documentation** (write guides): 3  

**Estimated Decision Time**:
- Critical path: 4-6 hours (spread over 2 days, with team)
- Important: 4-6 hours (can run in parallel)
- Total: 1-2 working days

**Next Step**: Fill in the critical path decisions (1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.3, 4.1, 4.2, 5.1, 6.1, 6.2) in the spaces above.

Once those 12 are decided, you'll have:
- ✅ Hosting locked down
- ✅ Database configured
- ✅ Auth working
- ✅ Secrets secured
- ✅ Deployment ready
- ✅ Networking clear
- ✅ Path to testing unlocked

---

**Status**: Consolidated decision framework provided  
**Created**: 2026-01-07  
**Owned by**: Leadership (with input from Backend, Frontend, Security, SRE)  
**Review**: Before filling in blanks, ensure team alignment on critical path
