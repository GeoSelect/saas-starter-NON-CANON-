# Cohort-Based Decision Model for Testing Readiness

## Ownership Rule

> **Frontend explains. Backend enforces. Product gives meaning. Ops keeps it alive. Security keeps it safe.**

---

## 5 Decision Cohorts

Each cohort owns decisions within their domain.  
Cross-cohort dependencies are noted.  
Decisions must be approved by primary owner; secondary owner consults.

---

## 🔒 BACKEND/SRE COHORT

**Accountability**: Enforcement, correctness, durability  
**Owns**: API contracts, data layer, schema, persistence, deployment  
**Does NOT own**: UI behavior, user experience, compliance policy

### Critical Decisions (Must Decide First)

#### 1.2 Backend Hosting Platform
**Primary Owner**: Backend/SRE  
**Secondary Consult**: Ops/SRE  
**Impact**: Where spine runs, how it scales  
**Options**:
- [ ] Railway (simplest)
- [ ] Fly.io (balanced)
- [ ] DigitalOcean App Platform (integrates with DO Postgres)
- [ ] AWS ECS/Fargate (enterprise)

**Recommendation**: DigitalOcean App Platform for MVP  
**Depends on**: None  
**Blocks**: 1.3, 5.1, 6.1, 6.2, 6.3

**Decision**: ➜ _____________

---

#### 1.3 Container Registry
**Primary Owner**: Backend/SRE  
**Secondary Consult**: Ops/SRE  
**Impact**: Where Docker images live  
**Options**:
- [ ] GitHub Container Registry (GHCR)
- [ ] Docker Hub
- [ ] AWS ECR
- [ ] DigitalOcean Registry

**Recommendation**: GHCR for GitHub-native flow  
**Depends on**: 1.2  
**Blocks**: 5.2 (CI/CD pipeline)

**Decision**: ➜ _____________

---

#### 2.1 Database of Record
**Primary Owner**: Backend/SRE  
**Secondary Consult**: Security  
**Impact**: Where all data lives, must support Postgres, PostGIS, pg_cron  
**Options**:
- [ ] Supabase Postgres (recommended)
- [ ] AWS RDS Postgres
- [ ] DigitalOcean Managed Postgres
- [ ] Self-hosted Postgres

**Recommendation**: Supabase (managed, includes extensions)  
**Depends on**: None  
**Blocks**: 2.2, 2.3, 3.3, 6.3, 8.1, 9.1, 11.1, 11.2

**Decision**: ➜ _____________

---

#### 2.3 Database Migrations Strategy
**Primary Owner**: Backend/SRE  
**Secondary Consult**: Ops/SRE, Security  
**Impact**: How audit system (5 tables, 7 constraints, triggers, functions) gets deployed safely  
**Options**:
- [ ] Supabase Migrations CLI (versioned, reversible)
- [ ] Single SQL file
- [ ] Node.js migration tool (TypeORM, Knex, Drizzle)
- [ ] Manual SQL scripts

**Recommendation**: Supabase Migrations CLI  
**Sequence**:
1. Create staging project (from 2.2)
2. Run migrations
3. Test thoroughly
4. Repeat for production

**BLOCKER**: Audit system migration must complete before team testing  
**Depends on**: 2.1, 2.2  
**Blocks**: Audit system deployment, team testing kickoff

**Decision**: ➜ _____________

---

#### 4.2 Per-Environment Configuration
**Primary Owner**: Backend/SRE  
**Secondary Consult**: Frontend, Product  
**Impact**: Ensures correct URLs, keys in each environment  
**Variables**:
- `NEXT_PUBLIC_API_URL` (Frontend → Backend)
  - Staging: `https://spine-staging.yourdomain.com`
  - Prod: `https://spine.yourdomain.com`
- `SUPABASE_SERVICE_ROLE_KEY` (Backend → Supabase)
- `DATABASE_URL` (Backend → Postgres)

**Decision Required**: Which vars? How documented?  
**Depends on**: 1.2, 2.1, 6.1  
**Blocks**: 5.1 (deployment), Frontend testing

**Decision**: ➜ _____________

---

#### 5.1 Deployment Strategy
**Primary Owner**: Backend/SRE  
**Secondary Consult**: Product, Ops  
**Impact**: How code gets from repo to production  
**Frontend**:
- [ ] Git integration (auto-deploy on push)
- [ ] Preview on every PR

**Backend**:
- [ ] Manual deployment (button in UI)
- [ ] CI/CD automation (GitHub Actions)

**Recommendation**: Frontend auto-deploy + Backend CI/CD  
**Depends on**: 1.2, 1.3, 4.1, 4.2  
**Blocks**: Testing kickoff, release process

**Decision**: ➜ _____________

---

#### 6.3 Spine ↔ Database Connectivity
**Primary Owner**: Backend/SRE  
**Secondary Consult**: Security, Ops  
**Impact**: Spine must reach database  
**Options**:
- [ ] VPC/private networking (secure)
- [ ] Whitelisted IPs (static IP firewall)
- [ ] Public + password (simplest, less secure)

**Recommendation**: VPC/private networking  
**Depends on**: 1.2, 2.1  
**Blocks**: Team testing

**Decision**: ➜ _____________

---

#### 8.1 Audit System Immutability
**Primary Owner**: Backend/SRE  
**Secondary Consult**: Security  
**Impact**: Audit system cannot be tampered with  
**Implement**:
- [ ] Triggers prevent UPDATE/DELETE
- [ ] App role privileges revoked
- [ ] Document superuser exceptions

**Recommendation**: Enforce append-only via trigger  
**Depends on**: 2.1, 2.3  
**Blocks**: Compliance validation, team testing

**Decision**: ➜ _____________

---

#### 11.1 Archive Job (Audit Data)
**Primary Owner**: Backend/SRE  
**Secondary Consult**: Ops  
**Impact**: Daily audit data archival, query performance  
**Schedule**: Daily 2 AM UTC  
**Operation**: Move audit records >90 days to archive table  
**Tool**: pg_cron or platform cron  

**Decision Required**: Scheduled?  
**Depends on**: 2.1, 2.3  
**Blocks**: Audit system operational

**Decision**: ➜ _____________

---

#### 11.2 Partition Creation (Audit Performance)
**Primary Owner**: Backend/SRE  
**Secondary Consult**: Ops  
**Impact**: Monthly partitions prevent unbounded table growth  
**Schedule**: Monthly 1st at 1 AM UTC  
**Operation**: Create new monthly partition  
**Tool**: pg_cron or platform scheduler  

**Decision Required**: Scheduled?  
**Depends on**: 2.1, 2.3  
**Blocks**: Audit system operational

**Decision**: ➜ _____________

---

### Important Decisions (Parallel with Critical)

#### 2.4 Test Data & Seeding
**Primary Owner**: Backend/SRE  
**Impact**: Tester experience  
**Seed**:
- [ ] 2-3 demo workspaces
- [ ] Test users (admin, editor, viewer)
- [ ] Sample data

**Decision**: ➜ _____________

---

#### 5.2 CI/CD Pipeline
**Primary Owner**: Backend/SRE  
**Secondary Consult**: Ops  
**Generate**: `.github/workflows/deploy.yml`  
**Stages**: Test → Build → Push → Deploy Staging → Deploy Prod (approval)  

**Decision Required**: Generate now?  
**Depends on**: 1.3, 5.1  

**Decision**: ➜ _____________

---

#### 5.3 Image Tagging & Versioning
**Primary Owner**: Backend/SRE  
**Strategy**:
- [ ] Tag by commit SHA (reproducible)
- [ ] Tag by semver (optional)
- [ ] Tag latest (convenience)

**Decision**: ➜ _____________

---

#### 6.4 Service Auth Between App & Spine
**Primary Owner**: Backend/SRE  
**Secondary Consult**: Security  
**Impact**: How spine services authenticate  
**Options**:
- [ ] Public reads (no auth)
- [ ] Authenticated writes (JWT)
- [ ] Service-to-service (shared secret)

**Recommendation**: JWT for writes, public for geo reads  
**Decision**: ➜ _____________

---

#### 7.1 Health & Readiness Endpoints
**Primary Owner**: Backend/SRE  
**Implement**:
- [ ] `GET /health` → `{ok: true}`
- [ ] `GET /ready` → `{ready: true}`

**Decision Required**: Implemented?  
**Depends on**: Spine code exists

**Decision**: ➜ _____________

---

#### 8.2 Audit Write Monitoring
**Primary Owner**: Backend/SRE  
**Secondary Consult**: Security  
**Implement**:
- [ ] Instrument `appendAuditEvent()` for metrics
- [ ] Alert if write failures > 0.5% for 5 min

**Decision**: ➜ _____________

---

#### 9.1 File Storage Location
**Primary Owner**: Backend/SRE  
**Impact**: Where PDFs, images, analysis results live  
**Options**:
- [ ] Supabase Storage (recommended)
- [ ] AWS S3
- [ ] DigitalOcean Spaces

**Recommendation**: Supabase Storage  
**Depends on**: 2.1

**Decision**: ➜ _____________

---

#### 12.1 Smoke Tests
**Primary Owner**: Backend/SRE  
**Secondary Consult**: QA  
**Create**: Minimal happy-path test script  
**Tests**:
- App loads
- Can login
- Can create workspace
- Can switch workspaces
- Audit event appears in DB

**Decision**: ➜ _____________

---

#### 14.1 Deployment Runbook
**Primary Owner**: Backend/SRE  
**Secondary Consult**: Ops  
**Document**: How to deploy Frontend, Backend, run migrations, verify, rollback  
**Location**: `docs/RUNBOOKS/DEPLOYMENT.md`

**Decision**: ➜ _____________

---

---

## 🎨 FRONTEND/UI COHORT

**Accountability**: Clarity, affordance, trust signaling  
**Owns**: UI components, user experience, error states, accessibility  
**Does NOT own**: Enforcement logic, security, permissions

### Critical Decisions (Must Decide First)

#### Frontend Hosting
**Primary Owner**: Frontend/UI  
**Status**: ✅ CONFIRMED VERCEL

**1.0 Vercel Git Integration**
**Primary Owner**: Frontend/UI  
**Secondary Consult**: Backend  
**Impact**: How frontend deploys  
**Options**:
- [ ] Git integration (auto-deploy on push)
- [ ] Manual via `vercel/action`

**Recommendation**: Git integration (auto PR previews)  
**Depends on**: None  
**Blocks**: 10.2 (preview policy)

**Decision**: ➜ _____________

---

#### 6.2 Frontend ↔ Backend Connectivity
**Primary Owner**: Frontend/UI  
**Secondary Consult**: Backend  
**Impact**: Frontend must know where to call backend  
**Config**: `NEXT_PUBLIC_API_URL`
- Must match actual deployed spine URL
- Set correctly in Vercel per environment
- Staging: Points to staging spine
- Prod: Points to prod spine

**Depends on**: 1.2, 6.1 (Backend hosting, domain names)  
**Blocks**: Frontend testing, API calls working

**Decision**: ➜ _____________

---

#### 9.2 Upload Security
**Primary Owner**: Frontend/UI  
**Secondary Consult**: Security, Backend  
**Impact**: How file uploads work  
**Options**:
- [ ] Private bucket + server-mediated upload (safer)
- [ ] Private bucket + presigned URLs (faster)
- [ ] Public bucket

**Recommendation**: Private bucket + server-mediated upload  
**Depends on**: 9.1  

**Decision**: ➜ _____________

---

### Important Decisions

#### 10.1 Git Branch Strategy
**Primary Owner**: Frontend/UI  
**Secondary Consult**: Backend, Product  
**Branches**:
- [ ] `main` (production-ready)
- [ ] `staging` (staging code)
- [ ] Feature branches (per feature)

**Promotion**: feature → PR → staging → main → prod  
**Decision**: ➜ _____________

---

#### 10.2 Preview Deployments
**Primary Owner**: Frontend/UI  
**Secondary Consult**: Product, Security  
**Impact**: Testing PRs before merge  
**Options**:
- [ ] Enable Vercel Preview (auto-deploy on PR)
- [ ] Public or restricted to team only

**Recommendation**: Enable, restrict to GitHub team  
**Depends on**: 1.0 (Vercel Git integration)

**Decision**: ➜ _____________

---

#### 12.3 Testing Scope for Team
**Primary Owner**: Frontend/UI  
**Secondary Consult**: Product  
**Impact**: What testers focus on  
**Happy Path Flows**:
- [ ] Login/logout
- [ ] Create workspace
- [ ] Invite users
- [ ] Switch workspaces
- [ ] View audit trail
- [ ] Create analysis

**Known Limitations**: List what's NOT tested  
**Decision**: ➜ _____________

---

#### Error Boundaries & Fallbacks
**Primary Owner**: Frontend/UI  
**Secondary Consult**: Backend  
**Implement**:
- [ ] Handle Backend down gracefully
- [ ] Network errors with retry logic
- [ ] Auth errors with redirect to login

**Decision**: ➜ _____________

---

---

## 📊 PRODUCT/DESIGN COHORT

**Accountability**: Meaning, narrative, decision quality  
**Owns**: Copy, CTAs, UX narrative, flow coherence, messaging  
**Does NOT own**: Technical enforcement, data correctness, engineering details

### Important Decisions

#### 12.3 Testing Scope for Team
**Primary Owner**: Product/Design  
**Secondary Consult**: Frontend, Backend  
**Impact**: What testers focus on  
**Define**:
- [ ] Happy path flows to test
- [ ] Known limitations
- [ ] Out-of-scope items

**Decision**: ➜ _____________

---

#### 14.3 Testing Guide for Team
**Primary Owner**: Product/Design  
**Secondary Consult**: Frontend, Backend  
**Document**:
- [ ] How to access staging
- [ ] Test user credentials
- [ ] Happy path flows
- [ ] Known limitations
- [ ] How to report issues
- [ ] FAQ

**Location**: `docs/TESTING_GUIDE.md`  
**Decision**: ➜ _____________

---

#### Copy & Messaging Strategy
**Primary Owner**: Product/Design  
**Decisions**:
- [ ] BlockedExplain copy (why feature unavailable)
- [ ] TrustSignal copy (compliance badges)
- [ ] Error message tone and clarity

**Decision**: ➜ _____________

---

#### 13.3 Release Decision Matrix
**Primary Owner**: Product/Design  
**Secondary Consult**: Backend, Security  
**Decisions**:
- [ ] Staging deploys: Who decides?
- [ ] Prod deploys: Who approves?
- [ ] Rollback: Who decides?

**Recommendation**: Staging auto, Prod needs Product + Backend + Security sign-off  
**Decision**: ➜ _____________

---

---

## 🛠️ OPS/SRE COHORT

**Accountability**: Availability, recoverability, hygiene  
**Owns**: Infrastructure, monitoring, secrets, backups, runtime config  
**Does NOT own**: Feature behavior, product decisions, UI

### Critical Decisions

#### 4.1 Secrets Management
**Primary Owner**: Ops/SRE  
**Secondary Consult**: Security  
**Impact**: How credentials stay safe  
**Where**:
- [ ] Vercel env vars (frontend secrets)
- [ ] Platform secrets (Railway/DO/etc. for backend)
- [ ] GitHub Secrets (CI/CD only)
- [ ] 1Password/LastPass (team vault)

**Critical Secrets**:
- `SUPABASE_SERVICE_ROLE_KEY` (backend only, secret)
- `DATABASE_URL` (backend only, secret)
- Docker registry credentials (CI/CD)

**Recommendation**: Platform secret managers for runtime, never in code/repo  
**Depends on**: 1.2, 2.1  
**Blocks**: Deployment, team testing

**Decision**: ➜ _____________

---

#### 2.2 Data Separation Strategy
**Primary Owner**: Ops/SRE  
**Secondary Consult**: Backend, Security  
**Impact**: Test isolation, confidence  
**Options**:
- [ ] Separate Supabase projects (recommended)
- [ ] Separate schemas in same DB
- [ ] Same DB, different test data

**Recommendation**: Separate projects (staging ≠ prod)  
**Depends on**: 2.1  
**Blocks**: Team testing

**Decision**: ➜ _____________

---

#### 2.5 Backup & Snapshot Policy
**Primary Owner**: Ops/SRE  
**Secondary Consult**: Security  
**Impact**: Rollback capability  
**Decisions**:
- [ ] Manual snapshot before prod migrations
- [ ] Automated daily backups
- [ ] Retention: 7 days (testing), 30 days (prod)

**Recommendation**: Manual before migrations, automated daily  
**Depends on**: 2.1, 2.2  
**Blocks**: Safe migration path

**Decision**: ➜ _____________

---

#### 6.1 Domain Names & URLs
**Primary Owner**: Ops/SRE  
**Secondary Consult**: Backend, Frontend  
**Impact**: All services have consistent URLs  
**Schema**:
- Primary domain: `yourdomain.com`
- App:
  - Staging: `app-staging.yourdomain.com`
  - Prod: `app.yourdomain.com`
- Spine:
  - Staging: `spine-staging.yourdomain.com`
  - Prod: `spine.yourdomain.com`
- Geo services:
  - Staging: `geo-staging.yourdomain.com`
  - Prod: `geo.yourdomain.com`

**Depends on**: 1.2  
**Blocks**: API endpoints, auth redirects, deployment

**Decision**: ➜ _____________

---

### Important Decisions

#### 7.2 Error Tracking
**Primary Owner**: Ops/SRE  
**Secondary Consult**: Backend  
**Impact**: Catching errors in production  
**Options**:
- [ ] Sentry (error-focused, $15+/month)
- [ ] Datadog (logs + metrics + errors, $15+/month)
- [ ] Platform logs only (simple, less visibility)

**Recommendation**: Sentry for MVP  
**Decision**: ➜ _____________

---

#### 7.3 Logging & Log Aggregation
**Primary Owner**: Ops/SRE  
**Secondary Consult**: Backend, Security  
**Strategy**:
- [ ] Platform logs only (Vercel + Railway + Supabase)
- [ ] Aggregated (Papertrail, LogDNA, Datadog)
- [ ] Correlated by request ID

**Recommendation**: Platform logs + correlation  
**Decision**: ➜ _____________

---

#### 7.4 Monitoring & Alerting
**Primary Owner**: Ops/SRE  
**Secondary Consult**: Security  
**Alerts**:
- [ ] High error rate (5xx > 2% for 5 min)
- [ ] Audit write failures (> 0.5%)
- [ ] Database connection errors
- [ ] Cron job failures
- [ ] Uptime/health check failures

**Decision**: ➜ _____________

---

#### 11.3 Backup Job (Database Resilience)
**Primary Owner**: Ops/SRE  
**Secondary Consult**: Security  
**Schedule**:
- [ ] Frequency: Daily automated snapshots
- [ ] Retention: 7 days (testing), 30 days (prod)
- [ ] Tool: Platform-provided or cron

**Depends on**: 2.1, 2.5  
**Decision**: ➜ _____________

---

#### 14.2 Incident Response Playbook
**Primary Owner**: Ops/SRE  
**Secondary Consult**: Security  
**Document**:
- [ ] Error escalation (who to notify)
- [ ] Audit write failure response
- [ ] DB connectivity failure response
- [ ] Auth system failure response
- [ ] Data breach response

**Location**: `docs/RUNBOOKS/INCIDENTS.md`  
**Decision**: ➜ _____________

---

---

## 🔐 SECURITY/COMPLIANCE COHORT

**Accountability**: Risk containment, auditability  
**Owns**: Retention policies, access reviews, compliance mappings, incident response  
**Does NOT own**: Feature velocity, UI/UX, engineering timelines

### Critical Decisions

#### 3.1 Auth Provider & Methods
**Primary Owner**: Security  
**Secondary Consult**: Backend, Frontend  
**Current**: Supabase Auth  
**Methods**:
- [ ] Magic link (email-based) — recommended
- [ ] Google OAuth — recommended
- [ ] GitHub OAuth
- [ ] Password-based

**Recommendation**: Magic link + Google OAuth  
**Depends on**: None  
**Blocks**: 3.2 (redirect URLs), team testing

**Decision**: ➜ _____________

---

#### 3.3 Row-Level Security (RLS) Posture
**Primary Owner**: Security  
**Secondary Consult**: Backend  
**Impact**: Data isolation between workspaces, users  
**Decisions**:
- [ ] Enable RLS immediately in staging
- [ ] Enable RLS after validation in prod
- [ ] Document RLS policies (workspace membership)

**Recommendation**: Enable in staging immediately  
**Depends on**: 2.1  
**Blocks**: Compliance validation, team testing

**Decision**: ➜ _____________

---

#### 4.1 Secrets Management
**Primary Owner**: Security  
**Secondary Consult**: Ops/SRE  
**Impact**: Credentials never exposed  
**Enforce**:
- [ ] Secrets never in code/repo
- [ ] Use platform secret managers for runtime
- [ ] GitHub Secrets for CI/CD only
- [ ] Rotation policy: 90 days

**Depends on**: None  
**Blocks**: Safe deployment

**Decision**: ➜ _____________

---

#### 8.4 GDPR/CCPA Compliance
**Primary Owner**: Security  
**Secondary Consult**: Backend, Product  
**Impact**: Legal compliance (if handling EU/CA users)  
**Implement**:
- [ ] Data Subject Access Request queries
- [ ] Right to Erasure function
- [ ] Privacy Policy written
- [ ] Retention Policy defined

**Recommendation**: Implement for staging (testing)  
**Depends on**: 2.1, 2.3

**Decision**: ➜ _____________

---

### Important Decisions

#### 3.2 Redirect URL Configuration
**Primary Owner**: Security  
**Secondary Consult**: Frontend, Backend  
**Impact**: Auth flows must redirect correctly  
**URLs to configure**:
- [ ] Staging: `https://app-staging.yourdomain.com/auth/callback`
- [ ] Preview: `https://*.vercel.app/auth/callback` (wildcard)
- [ ] Prod: `https://app.yourdomain.com/auth/callback`

**Depends on**: 3.1, 6.1  
**Decision**: ➜ _____________

---

#### 3.4 Test User Accounts
**Primary Owner**: Security  
**Secondary Consult**: Backend  
**Create**:
- [ ] Admin user (workspace creation, user management)
- [ ] Editor user (create/edit data)
- [ ] Viewer user (read-only)

**Depends on**: 3.1, 2.4  
**Decision**: ➜ _____________

---

#### 8.3 Workspace Membership Validation
**Primary Owner**: Security  
**Secondary Consult**: Backend  
**Impact**: Tenancy safety  
**Enforce**:
- [ ] Server-side checks (all writes validate membership)
- [ ] RLS policies (Postgres enforces at DB level)
- [ ] Audit trail (log who accessed what)

**Recommendation**: Both server-side + RLS (defense in depth)  
**Depends on**: 3.3  
**Decision**: ➜ _____________

---

#### 13.2 Change Control for Sensitive Areas
**Primary Owner**: Security  
**Impact**: Audit system integrity, RLS policies, auth  
**Require approval** from Security for changes to:
- [ ] Audit system schema
- [ ] RLS policies
- [ ] Auth configuration
- [ ] Secrets/credentials

**Decision Required**: Process documented?  
**Decision**: ➜ _____________

---

#### Compliance Readiness
**Primary Owner**: Security  
**Secondary Consult**: Backend, Ops  
**Questions**:
- [ ] Which compliance frameworks apply? (GDPR, CCPA, SOC2)
- [ ] What's needed before testing?
- [ ] Privacy Policy written?
- [ ] Incident Response Playbook drafted?

**Decision**: ➜ _____________

---

---

## 🎯 LEADERSHIP/GOVERNANCE COHORT

**Accountability**: Cross-functional alignment  
**Owns**: Ownership assignment, release approval, governance

### Important Decisions

#### 13.1 Ownership & Approval
**Primary Owner**: Leadership  
**Impact**: Decision accountability  
**Assign**:
- [ ] **Frontend Owner**: Name, contact ➜ _____________
- [ ] **Backend Owner**: Name, contact ➜ _____________
- [ ] **Database Owner**: Name, contact ➜ _____________
- [ ] **Security Owner**: Name, contact ➜ _____________
- [ ] **Release Owner**: Name, contact ➜ _____________

---

#### 13.3 Release Decision Matrix
**Primary Owner**: Leadership  
**Secondary Consult**: Product, Backend, Security  
**Decisions**:
- [ ] Staging deploys: Backend/SRE decides (can auto-deploy)
- [ ] Prod deploys: Product + Backend + Security sign-off
- [ ] Emergency rollback: Backend/SRE decides (post-notify)

**Decision**: ➜ _____________

---

#### Decision Approval Timeline
**Primary Owner**: Leadership  
**Milestones**:
- [ ] Day 1: Critical path decisions (12 decisions from 5 cohorts)
- [ ] Day 2-3: Important decisions (15 decisions)
- [ ] Day 4-5: Supporting decisions (8 decisions)
- [ ] Day 5: Ownership assignment + governance finalized

**Total**: ~8-10 hours decision time (can run in parallel across cohorts)

**Decision**: ➜ _____________

---

---

## Decision Session Structure (By Cohort)

### Session 1: Backend/SRE Cohort (2.5 hours)
**Owner**: Backend Lead  
**Decisions**: 8 critical + 8 important = 16 total  
**Participants**: Backend engineers, SRE/DevOps, Product (listening)

**Order**:
1. 1.2 Backend Hosting (impacts everything)
2. 2.1 Database
3. 2.2 Data Separation
4. 2.3 Database Migrations
5. 1.3 Container Registry
6. 4.2 Per-Env Config
7. 5.1 Deployment Strategy
8. 6.3 Connectivity
9. 8.1 Audit Immutability
10. 11.1 Archive Job
11. 11.2 Partition Job
12. [Then 8 important decisions]

**Deliverables**:
- [ ] All 16 decisions locked
- [ ] Dependency graph confirmed
- [ ] Deployment plan documented

---

### Session 2: Frontend/UI Cohort (1.5 hours)
**Owner**: Frontend Lead  
**Decisions**: 1 critical (already confirmed) + 5 important = 6 total  
**Participants**: Frontend engineers, Designer, Product

**Order**:
1. 1.0 Vercel Git Integration (confirm)
2. 6.2 Frontend ↔ Backend (depends on Backend hosting decision)
3. 9.2 Upload Security
4. 10.1 Git Branch Strategy
5. 10.2 Preview Deployments
6. Error Boundaries

**Deliverables**:
- [ ] Frontend architecture locked
- [ ] Vercel config ready
- [ ] Testing plan confirmed

---

### Session 3: Security/Compliance Cohort (2 hours)
**Owner**: Security Lead  
**Decisions**: 4 critical + 5 important = 9 total  
**Participants**: Security/Compliance, Backend (listening), Product

**Order**:
1. 3.1 Auth Provider
2. 3.3 RLS Posture
3. 4.1 Secrets Management (with Ops)
4. 8.4 GDPR/CCPA
5. 3.2 Redirect URLs (depends on domain/auth)
6. 3.4 Test Users
7. 8.3 Workspace Membership Validation
8. 13.2 Change Control
9. Compliance Readiness

**Deliverables**:
- [ ] Security posture locked
- [ ] Auth flow designed
- [ ] RLS policies documented
- [ ] Compliance requirements listed

---

### Session 4: Ops/SRE Cohort (2 hours)
**Owner**: Ops/SRE Lead  
**Decisions**: 3 critical + 7 important = 10 total  
**Participants**: Ops/SRE, Backend (listening), Security (listening)

**Order**:
1. 2.2 Data Separation (depends on Backend)
2. 2.5 Backup Policy
3. 4.1 Secrets Management (with Security)
4. 6.1 Domain Names
5. 7.2 Error Tracking
6. 7.3 Log Aggregation
7. 7.4 Alerting
8. 11.3 Backup Job
9. 14.1 Deployment Runbook
10. 14.2 Incident Playbook

**Deliverables**:
- [ ] Infrastructure locked
- [ ] Monitoring plan ready
- [ ] Runbooks drafted
- [ ] Backup strategy confirmed

---

### Session 5: Product/Design Cohort (1 hour)
**Owner**: Product Lead  
**Decisions**: 3 important  
**Participants**: Product, Design, Frontend, Backend (listening)

**Order**:
1. 12.3 Testing Scope
2. 14.3 Testing Guide
3. Copy & Messaging Strategy
4. 13.3 Release Decision Matrix

**Deliverables**:
- [ ] Testing scope locked
- [ ] Testing guide drafted
- [ ] Messaging strategy confirmed
- [ ] Release matrix approved

---

### Session 6: Leadership Governance (30 min)
**Owner**: CEO/CTO  
**Decisions**: 2 governance  
**Participants**: All cohort leads

**Order**:
1. 13.1 Ownership & Approval (confirm assignments)
2. Decision approval timeline

**Deliverables**:
- [ ] All roles assigned + published
- [ ] Timeline locked
- [ ] Go/no-go for deployment

---

## Decision Dependencies (Cohort View)

```
BACKEND/SRE Session (Day 1, 2.5 hrs) → BLOCKS EVERYTHING
  └─ 1.2 Backend Hosting
  └─ 2.1 Database
  └─ 2.2 Data Separation
  └─ 2.3 Database Migrations
  └─ 1.3 Container Registry
  └─ 4.2 Per-Env Config
  └─ 5.1 Deployment Strategy
  └─ 6.3 Connectivity
  └─ 8.1 Audit Immutability
  └─ 11.1, 11.2 Archive/Partition Jobs

FRONTEND/UI Session (Day 1 PM, 1.5 hrs) ← DEPENDS ON Backend decisions
  ├─ 1.0 Vercel (confirm)
  └─ 6.2 Frontend ↔ Backend
  └─ 9.2, 10.1, 10.2, Error Boundaries

SECURITY/COMPLIANCE Session (Day 2 AM, 2 hrs) ← DEPENDS ON Backend + Domain decisions
  └─ 3.1 Auth Provider
  └─ 3.3 RLS Posture
  └─ 4.1 Secrets Management
  └─ 8.4 GDPR/CCPA
  └─ 3.2, 3.4, 8.3, 13.2

OPS/SRE Session (Day 2 PM, 2 hrs) ← DEPENDS ON Backend decisions
  └─ 2.2, 2.5 Data/Backup
  └─ 4.1 Secrets Management
  └─ 6.1 Domains
  └─ 7.2, 7.3, 7.4 Monitoring
  └─ 11.3 Backups
  └─ 14.1, 14.2 Runbooks

PRODUCT/DESIGN Session (Day 2 PM, 1 hr) ← DEPENDS ON all above
  └─ 12.3 Testing Scope
  └─ 14.3 Testing Guide
  └─ Copy & Messaging
  └─ 13.3 Release Matrix

LEADERSHIP Governance (Day 3 AM, 30 min) ← DEPENDS ON all cohorts
  └─ 13.1 Ownership Assignment
  └─ Timeline Approval
```

---

## Summary by Cohort

| Cohort | Critical | Important | Total | Session Length | Day |
|--------|----------|-----------|-------|----------------|-----|
| Backend/SRE | 8 | 8 | 16 | 2.5 hrs | Day 1 AM |
| Frontend/UI | 1 | 5 | 6 | 1.5 hrs | Day 1 PM |
| Security | 4 | 5 | 9 | 2 hrs | Day 2 AM |
| Ops/SRE | 3 | 7 | 10 | 2 hrs | Day 2 PM |
| Product/Design | 0 | 3 | 3 | 1 hr | Day 2 PM |
| Leadership | 0 | 2 | 2 | 0.5 hrs | Day 3 AM |
| **TOTAL** | **16** | **30** | **46** | **~10 hrs** | **3 days** |

---

## Next Steps

1. **Schedule 6 decision sessions** (use template above)
2. **Each cohort fills in their decisions** (provided template above)
3. **Publish decisions** as they're approved
4. **Run dependency checks** (make sure blockers clear)
5. **Launch deployment** (once all critical path locked)

**When are you ready to run the first Backend/SRE session?**

---

**Status**: Cohort-based decision model provided  
**Created**: 2026-01-07  
**Session Schedule**: 6 sessions over 3 days, 10 hours total effort  
**Owned by**: Each cohort lead (5) + Leadership (1)
