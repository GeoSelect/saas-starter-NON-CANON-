# Architecture Decisions for Testing Readiness

## Purpose

Decision checklist to unlock Vercel + Docker deployment and team testing.  
Map each decision to owner (using GeoSelect ownership model).

---

## Critical Path Decisions (Must Decide First)

### 🔒 Backend/SRE Decisions

#### 1. **Backend Hosting Platform**
**Owner**: Backend/SRE  
**Impacts**: Deployment timeline, cost, monitoring  
**Options**:
- [ ] **Railway** (Recommended for MVP testing)
  - Pros: 15 min setup, free tier, auto-deploys from git, built-in monitoring
  - Cons: Limited scale, not enterprise-grade
  - Cost: Free → $5-50/month as you scale
  - Decision: Deploy Docker image, Railway builds/runs it
  
- [ ] **Fly.io** (Balanced option)
  - Pros: 20 min setup, global edge, good free tier
  - Cons: Moderate learning curve
  - Cost: Free → $10-50/month
  - Decision: Use `fly.toml`, deploy with `flyctl`
  
- [ ] **AWS ECS/Fargate** (Enterprise path)
  - Pros: Scalable, integrates with RDS, auto-scaling
  - Cons: 2-3 days setup, $30+/month minimum
  - Cost: $50+/month
  - Decision: Infrastructure as Code (Terraform), Docker image to ECR
  
- [ ] **DigitalOcean App Platform** (VPS hybrid)
  - Pros: Simple, affordable, Docker-native
  - Cons: Less automation than Fly/Railway
  - Cost: $12+/month
  - Decision: Docker image, Platform handles orchestration

**Decision Required**: Which platform? ➜ _____________

---

#### 2. **Database Strategy**
**Owner**: Backend/SRE  
**Impacts**: Data persistence, audit system readiness, backup strategy  
**Options**:
- [ ] **Supabase Postgres** (Current choice?)
  - Decision: Use staging project for testing?
  - URL: `postgresql://user:pass@db.supabase.co`
  - Auth: Use service role key for backend
  - Backups: Supabase handles daily
  - Cost: Free tier sufficient for testing
  
- [ ] **AWS RDS Postgres**
  - Decision: Separate RDS instance for staging?
  - Backups: Automated daily snapshots
  - Cost: $30+/month
  
- [ ] **Self-hosted Postgres on VPS**
  - Decision: Run on same VPS as Backend?
  - Backups: Manual cron jobs
  - Cost: Included in VPS cost ($5-20/month)

**Decision Required**: Which database? Where hosted? ➜ _____________

---

#### 3. **Database Migrations**
**Owner**: Backend/SRE  
**Impacts**: Data schema consistency, audit system deployment  
**Options**:
- [ ] **Supabase Migrations**
  - Use `supabase migration` CLI
  - Run `010_audit_trail_production.sql` in Supabase SQL editor
  
- [ ] **Node.js Migration Tool** (TypeORM, Knex, Drizzle)
  - Automate migrations in CI/CD
  - Version control each migration
  
- [ ] **Manual SQL scripts**
  - Run migrations manually before deployment
  - Document in runbook

**Decision Required**: Migration method? Who runs them? ➜ _____________

**Blocker**: Audit system migration must run on staging database before team testing.

---

#### 4. **Docker Registry**
**Owner**: Backend/SRE  
**Impacts**: Image storage, deployment speed, security  
**Options**:
- [ ] **GitHub Container Registry** (Free with GitHub)
  - `ghcr.io/yourusername/spine:latest`
  - Authentication: GitHub token
  - Cost: Free
  
- [ ] **Docker Hub** (Free/public)
  - `yourusername/spine:latest`
  - Public images OK? (Assess security)
  - Cost: Free for public, $5/month for private
  
- [ ] **AWS ECR** (Private, integrates with ECS)
  - `123456789.dkr.ecr.us-east-1.amazonaws.com/spine:latest`
  - Cost: $0.10 per GB stored
  
- [ ] **Supabase Vector Registry** (If using Supabase)
  - Cost: Included

**Decision Required**: Which registry? Public or private? ➜ _____________

---

#### 5. **Secrets Management**
**Owner**: Backend/SRE + Security  
**Impacts**: Security, developer experience, audit trail  
**Options**:
- [ ] **Vercel Secrets** (Frontend env vars)
  - Built into Vercel dashboard
  - Use: `NEXT_PUBLIC_*` for public, rest private
  
- [ ] **Railway Environment Variables** (Backend env vars)
  - Dashboard or CLI
  - `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.
  
- [ ] **GitHub Secrets** (CI/CD)
  - For deployment scripts
  
- [ ] **1Password / LastPass** (Team-wide)
  - Shared vault for all credentials
  - Recommended for team of 3+
  
- [ ] **Docker .env files** (NOT recommended for production)
  - Only for local development

**Decision Required**: 
- Where do Frontend secrets live? ➜ _____________
- Where do Backend secrets live? ➜ _____________
- Who has access to each? ➜ _____________

---

#### 6. **Monitoring & Logging**
**Owner**: Backend/SRE  
**Impacts**: Debugging, uptime visibility, SLO tracking  
**Options**:
- [ ] **Railway Dashboard** (Basic, built-in)
  - Logs visible in Railway UI
  - Basic alerts
  
- [ ] **Datadog** (Enterprise, comprehensive)
  - APM, logs, metrics, alerts
  - Cost: $15+/month
  
- [ ] **Grafana + Prometheus** (Self-hosted, complex)
  - Free but requires setup
  - Cost: Hosting only
  
- [ ] **New Relic** (Mid-market)
  - Similar to Datadog
  - Cost: $20+/month
  
- [ ] **Sentry** (Error tracking)
  - Catch exceptions in Backend
  - Cost: Free tier, $25+/month for more

**Decision Required**: 
- Error tracking tool? ➜ _____________
- Log aggregation? ➜ _____________
- Performance monitoring? ➜ _____________

---

#### 7. **Health Checks & Readiness**
**Owner**: Backend/SRE  
**Impacts**: Deployment confidence, monitoring alerts  
**Options**:
- [ ] **Implement `/health` endpoint** in Backend
  - Returns: `{"status":"ok","timestamp":"2026-01-07T..."}`
  - Checks: Database connectivity, external services
  
- [ ] **Implement `/ready` endpoint** in Backend
  - Ready for traffic (all dependencies available)
  
- [ ] **Implement `/metrics` endpoint** in Backend
  - Prometheus-compatible metrics
  - Request count, latency, errors

**Decision Required**: Which endpoints to implement first? ➜ _____________

---

### 🎨 Frontend/UI Decisions

#### 8. **Frontend Hosting (Vercel)**
**Owner**: Frontend/UI  
**Impacts**: Deployment, preview URLs, SSL  
**Options**:
- [ ] **Vercel (Recommended)**
  - Connect GitHub repo
  - Auto-deploy on `main` push
  - Preview deployments on PR
  - Custom domain: `app-staging.yourdomain.com`
  
- [ ] **Netlify** (Alternative)
  - Similar to Vercel
  - Cost: Free for testing
  
- [ ] **AWS Amplify** (Enterprise)
  - Integrates with AWS services
  - Cost: $0-5/month for simple apps

**Decision Required**: Confirmed Vercel? ➜ _____________

---

#### 9. **Environment Variables Strategy**
**Owner**: Frontend/UI  
**Impacts**: How Frontend talks to Backend  
**Decisions**:
- [ ] **API Endpoint**
  - Staging: `NEXT_PUBLIC_API_URL=https://spine-staging.railway.app`
  - Must match actual Backend URL
  - Update when Backend URL changes
  
- [ ] **Supabase Config**
  - `NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyXxx`
  - Use staging Supabase project
  
- [ ] **Feature Flags**
  - `NEXT_PUBLIC_ENABLE_AUDIT=true` (enable audit UI)
  - `NEXT_PUBLIC_WORKSPACE_SWITCHER=true`
  
- [ ] **Analytics** (Optional)
  - `NEXT_PUBLIC_GA_ID=G-xxx` (Google Analytics)

**Decision Required**: 
- What env vars needed? ➜ _____________
- Where are values stored? ➜ _____________

---

#### 10. **Error Boundaries & Fallbacks**
**Owner**: Frontend/UI  
**Impacts**: User experience during testing  
**Decisions**:
- [ ] **Handle Backend Down** gracefully
  - Show: "Service unavailable, retry?"
  - Don't: Crash entire app
  
- [ ] **Handle Network Errors** gracefully
  - Retry logic with exponential backoff
  - Toast notifications (not console errors)
  
- [ ] **Handle Auth Errors** gracefully
  - Invalid token: Redirect to login
  - CORS issues: Show helpful message

**Decision Required**: Framework for error handling? ➜ _____________

---

### 📊 Product/Design Decisions

#### 11. **Testing Scope (Happy Path)**
**Owner**: Product + Design  
**Impacts**: What team tests, feedback focus  
**Decisions**:
- [ ] **Core User Flows to Test**
  - Login/logout
  - Create workspace
  - Switch workspaces
  - Invite user
  - Check audit trail
  - (Add more...)
  
- [ ] **Out of Scope for Testing** (Known limitations)
  - Performance at scale (not tested)
  - Mobile responsiveness (tested as-is)
  - Payment flows (if any)
  - Advanced compliance features

**Decision Required**: List of testable user flows? ➜ _____________

---

#### 12. **Messaging & Copy**
**Owner**: Product + Design  
**Impacts**: User clarity, trust signals  
**Decisions**:
- [ ] **BlockedExplain Component**
  - When feature is unavailable, explain why
  - Copy: "Feature unavailable: Upgrade to unlock"
  
- [ ] **TrustSignal Component**
  - Show compliance badges
  - Copy: "SOC 2 Certified", "Data Encrypted", "GDPR Compliant"
  
- [ ] **Error Messages**
  - Clear, non-technical language
  - Action: "Try again" or "Contact support"

**Decision Required**: Who writes copy? ➜ _____________

---

### 🛠️ Ops/SRE Decisions

#### 13. **Deployment Strategy**
**Owner**: Ops/SRE  
**Impacts**: Risk, rollback speed, team confidence  
**Options**:
- [ ] **Manual Deployment** (Simplest for MVP)
  - Push to main branch
  - Vercel auto-deploys frontend
  - Manually deploy Backend (via Railway dashboard or CLI)
  - Suitable for: Testing phase
  
- [ ] **CI/CD Pipeline** (Recommended)
  - GitHub Actions on push to `staging` branch
  - Auto-test, build Docker, deploy to Railway
  - More complex, safer long-term
  
- [ ] **Canary Deployment** (Enterprise)
  - Deploy to 5% of traffic first
  - Monitor, then roll to 100%
  - Overkill for testing

**Decision Required**: Deployment approach? ➜ _____________

---

#### 14. **Backup Strategy**
**Owner**: Ops/SRE + Security  
**Impacts**: Data recovery, disaster readiness  
**Decisions**:
- [ ] **Database Backups**
  - Supabase: Auto daily
  - AWS RDS: Auto daily snapshots
  - Self-hosted: Cron job daily
  - Retention: 7 days (testing phase)
  
- [ ] **Backup Verification**
  - Weekly restore test to staging
  - Verify data integrity
  
- [ ] **Disaster Recovery Plan**
  - RTO (Recovery Time Objective): < 1 hour for testing
  - RPO (Recovery Point Objective): < 1 day for testing

**Decision Required**: 
- Backup frequency? ➜ _____________
- Retention period? ➜ _____________
- Tested recovery procedure? ➜ _____________

---

#### 15. **Infrastructure-as-Code (IaC)**
**Owner**: Ops/SRE  
**Impacts**: Reproducibility, scalability, drift prevention  
**Options**:
- [ ] **Skip for MVP** (Manual setup)
  - Acceptable for testing phase
  - Risk: Hard to recreate if production needed
  
- [ ] **Docker Compose** (Local + staging)
  - Document dependencies
  - Reproducible environment
  
- [ ] **Terraform** (AWS/Enterprise path)
  - Define all infrastructure in code
  - Complex, but production-grade

**Decision Required**: Document infrastructure now? ➜ _____________

---

### 🔐 Security/Compliance Decisions

#### 16. **Data Retention Policy (Audit System)**
**Owner**: Security  
**Impacts**: Compliance, storage cost, query performance  
**Decisions**:
- [ ] **Hot Storage** (Days 0-30)
  - Location: `audit_trail` table
  - Indexed for fast queries
  
- [ ] **Warm Storage** (Days 30-90)
  - Location: `audit_trail_archive_*` monthly tables
  - Archived daily at 2 AM
  
- [ ] **Cold Storage** (Days 90-365)
  - Location: `audit_trail_cold_*` yearly tables
  - Minimal indexes
  - Purged after 365 days
  
- [ ] **Compliance Mode** (Optional)
  - Never delete if enabled
  - For high-security workspaces

**Decision Required**: 
- Testing retention period? (365 days OK?) ➜ _____________
- Who approves deletions? ➜ _____________

---

#### 17. **Access Control & Authentication**
**Owner**: Security  
**Impacts**: Who can access what, data safety  
**Decisions**:
- [ ] **Test User Roles**
  - Admin (all permissions)
  - Editor (create/edit data)
  - Viewer (read-only)
  - Guest (logged out)
  
- [ ] **RLS Policies** (Row-Level Security in Postgres)
  - Users can only see their workspace data
  - Enforce at database level
  
- [ ] **OAuth Integration** (Supabase)
  - Google login
  - GitHub login
  - Magic link (email)

**Decision Required**: 
- Which auth methods enabled? ➜ _____________
- Test user accounts needed? ➜ _____________

---

#### 18. **Compliance Readiness**
**Owner**: Security  
**Impacts**: Legal, customer trust, audit readiness  
**Decisions**:
- [ ] **GDPR** (EU users)
  - Data Subject Access: Implemented ✅
  - Right to Erasure: Implemented ✅
  - Privacy Policy: Written? ➜ _____________
  
- [ ] **CCPA** (California users)
  - Consumer rights: Implemented ✅
  - Privacy Policy: Updated? ➜ _____________
  
- [ ] **SOC 2** (Enterprise customers)
  - Audit system: Ready ✅
  - Access controls: Defined? ➜ _____________
  - Incident response: Documented? ➜ _____________

**Decision Required**: 
- Which compliance frameworks apply? ➜ _____________
- What's needed before testing? ➜ _____________

---

#### 19. **Incident Response & Security Escalation**
**Owner**: Security  
**Impacts**: How quickly issues are resolved  
**Decisions**:
- [ ] **Security Incident Contacts**
  - Primary: _________ (email, phone)
  - Secondary: _________ (email, phone)
  
- [ ] **Breach Notification Plan**
  - Who do we notify? (Users, regulators, press)
  - Timeline: < 72 hours?
  
- [ ] **Data Breach Runbook**
  - Step 1: Isolate affected system
  - Step 2: Notify Security Lead
  - Step 3: Preserve evidence
  - Step 4: Investigate root cause

**Decision Required**: 
- Security contact info? ➜ _____________
- Incident response procedure drafted? ➜ _____________

---

## Supporting Decisions (Nice-to-Have Before Testing)

### 🎯 Team & Process Decisions

#### 20. **Testing Coordination**
**Owner**: Product/QA  
**Impacts**: Team alignment, feedback quality  
**Decisions**:
- [ ] **Testing Schedule**
  - Days: Mon-Fri?
  - Hours: All day or specific window?
  - Duration: 1 week? 2 weeks?
  
- [ ] **Test User Accounts**
  - How many needed? (10? 50?)
  - Who creates them? (SRE)
  - Which test data available? (Sample workspaces)
  
- [ ] **Feedback Collection**
  - Slack channel: #testing-feedback
  - GitHub issues: Bug reports
  - Form: Feature requests
  
- [ ] **Issue Triage**
  - Critical (blocks testing): Fix immediately
  - Major (affects flow): Fix this sprint
  - Minor (cosmetic): Track for later

**Decision Required**: 
- Testing timeline? ➜ _____________
- Feedback mechanism? ➜ _____________

---

#### 21. **Documentation for Testers**
**Owner**: Backend/Product  
**Impacts**: Tester efficiency, issue quality  
**Decisions**:
- [ ] **Testing Guide** (What to test)
  - Create: TESTING_GUIDE.md
  - Include: Happy path flows, known limitations
  
- [ ] **Test User Credentials** (How to access)
  - Doc: Private or via secure link?
  - Rotation: How often?
  
- [ ] **Reporting Issues** (How to help)
  - Template: Include env, steps, screenshot, error
  
- [ ] **FAQ** (Common questions)
  - "Is this a bug or feature?"
  - "Will my data persist?"
  - "When does testing end?"

**Decision Required**: 
- Who writes TESTING_GUIDE.md? ➜ _____________
- Shared via Slack, email, or doc? ➜ _____________

---

#### 22. **Ownership Alignment**
**Owner**: Leadership  
**Impacts**: Accountability, decision speed  
**Decisions**:
- [ ] **Frontend Owner** (Vercel deployment, env vars)
  - Name: _________
  - Phone: _________
  
- [ ] **Backend Owner** (Docker, Railway, API)
  - Name: _________
  - Phone: _________
  
- [ ] **Database Owner** (Migrations, backups)
  - Name: _________
  - Phone: _________
  
- [ ] **Security Owner** (Secrets, access, compliance)
  - Name: _________
  - Phone: _________
  
- [ ] **Product Owner** (Testing scope, scope changes)
  - Name: _________
  - Phone: _________

**Decision Required**: Assign all 5 roles ➜ _____________

---

## Decision Dependency Graph

```
Priority 1 (Must Decide to Start):
  1. Backend Hosting → 4. Docker Registry
  2. Database → 3. Database Migrations
  5. Secrets Management → 6. Monitoring
  8. Frontend Hosting (Vercel) → 9. Env Vars
  13. Deployment Strategy
  17. Access Control

Priority 2 (Decide Within 2 Days):
  7. Health Checks
  10. Error Boundaries
  11. Testing Scope
  14. Backup Strategy
  16. Data Retention
  18. Compliance Readiness

Priority 3 (Decide During Testing):
  12. Messaging & Copy
  15. Infrastructure-as-Code
  19. Incident Response
  20. Testing Coordination
  21. Documentation for Testers
  22. Ownership Alignment
```

---

## Decision Template (Use for Each)

```markdown
## Decision: [Name]
**Owner**: [Role]
**Impact**: [What depends on this]
**Options Considered**:
  A. [Option 1] - Pros/Cons
  B. [Option 2] - Pros/Cons
  C. [Option 3] - Pros/Cons
**Decided**: [Option A/B/C]
**Rationale**: [Why chosen]
**Date**: 2026-01-07
**Reviewed By**: [Names]
```

---

## Completion Checklist

### Phase 1: Critical Path (Days 1-2)
- [ ] Decision 1: Backend Hosting
- [ ] Decision 2: Database
- [ ] Decision 3: Database Migrations (run audit system!)
- [ ] Decision 4: Docker Registry
- [ ] Decision 5: Secrets Management
- [ ] Decision 8: Frontend Hosting (Vercel confirmed)
- [ ] Decision 9: Frontend Env Vars
- [ ] Decision 13: Deployment Strategy
- [ ] Decision 17: Access Control

### Phase 2: Pre-Testing (Days 3-4)
- [ ] Decision 6: Monitoring & Logging
- [ ] Decision 7: Health Checks
- [ ] Decision 10: Error Boundaries
- [ ] Decision 11: Testing Scope
- [ ] Decision 14: Backup Strategy
- [ ] Decision 16: Data Retention
- [ ] Decision 18: Compliance Readiness
- [ ] Decision 20: Testing Coordination

### Phase 3: Launch Testing (Days 5-6)
- [ ] Decision 12: Messaging & Copy
- [ ] Decision 19: Incident Response
- [ ] Decision 21: Documentation
- [ ] Decision 22: Ownership Assignment
- [ ] TESTING_GUIDE.md created
- [ ] Test user accounts ready
- [ ] Team notified of testing start

---

## Summary

**Total Decisions**: 22  
**Critical (must decide)**: 9  
**Important (decide before testing)**: 8  
**Nice-to-have (decide during)**: 5  

**Estimated Decision Time**:
- Critical path: 4-6 hours (spread over 2 days)
- Full decisions: 1-2 days (with meetings)

**Next Step**: Fill in decisions 1-9 (critical path) in the spaces above. ➜ Start here!

---

**Status**: Decision framework provided  
**Created**: 2026-01-07  
**Ownership**: Leadership (coordinate with Backend, Frontend, SRE, Security, Product)
