# Phase 1 Decisions - LOCKED

**Status**: Complete  
**Decided by**: You  
**Date**: 2026-01-07  
**Timeline**: 30 min decision-making, 15 min injection, 15 min merge = 1 hour to production-ready scaffolding

---

## Critical Scaffolding Decisions (5)

### D001: Backend Hosting
**Decision**: `docker`

**Why**: 
- Full control over infrastructure
- Local development matches production (docker-compose)
- Easy to add team members (just docker pull)
- Can migrate to kubernetes later if needed

**Implications**:
- CI/CD deploy target: Docker Swarm / Docker Registry
- Environment URLs: http://docker-spine.local:8000 (local), staging/prod via Docker Hub registry
- Health checks: curl docker spine container
- Seed strategy: Direct database access via docker-compose exec

### D002: Docker Registry
**Decision**: `do-container-registry` (DigitalOcean Container Registry)

**Why**:
- Private registry, managed by DigitalOcean
- Integrates seamlessly with DO App Platform (automatic pull)
- Cost-effective (included with DO Spaces)
- No AWS dependency (using DO for everything)
- Simple authentication (DO API tokens)

**Implications**:
- GitHub Actions uses DO API token (GitHub Secret)
- Image push: `docker push registry.digitalocean.com/geoselect/api:latest`
- Image pull in DO App Platform: automatic (same account)
- Buildcache: DO-backed (faster rebuilds)
- No AWS IAM configuration needed

### D005: Secrets Management
**Decision**: `platform-env-vars` (Vercel + DO App Platform Environment Variables)

**Why**:
- No external dependencies (AWS removed)
- Vercel and DO both handle secrets natively in UI
- Simple: just set env vars in platform dashboard
- Automatic injection at runtime
- Different secrets per environment (staging vs production)

**Implications**:
- Vercel (Frontend): Settings → Environment Variables
- DO App Platform (Backend): Settings → Environment Variables
- Local dev: .env.local with test/fake values
- CI/CD: GitHub Secrets → docker build args → runtime env vars
- No AWS SDK needed, no secret rotation complexity

### D020: Seed Strategy
**Decision**: `sql-script` (Direct SQL seeding)

**Why**:
- Fast (one SQL file executed)
- Version controlled (seed.sql in git)
- No ORM dependency
- Reproducible for testing

**Implications**:
- Seed file: scripts/seed.sql (plain SQL, no framework)
- Execution: `psql < scripts/seed.sql` or via pg_client in container
- Data: Workspace templates, user roles, initial audit events
- Rollback: `scripts/unseed.sql` (optional)

---

## Decision Lock Summary

| Decision | Value | Locked? | Status |
|----------|-------|---------|--------|
| D001 | docker | ✅ Yes | Active |
| D002 | do-container-registry | ✅ Yes | Active (updated from ecr) |
| D005 | platform-env-vars | ✅ Yes | Active (updated from aws-secrets) |
| D020 | sql-script | ✅ Yes | Active |

---

## Latest Changes (AWS Removal)

**Updated 2026-01-07 (Post-Phase-2)**:
- ✅ D002: Changed from `ecr` → `do-container-registry`
  - Rationale: Using DigitalOcean for everything; no AWS needed
  - Impact: CI/CD pushes to DO registry instead of AWS ECR
  
- ✅ D005: Changed from `aws-secrets` → `platform-env-vars`
  - Rationale: Vercel + DO App Platform handle env vars natively
  - Impact: Removed AWS SDK, API calls, and complexity
  - Removed: AWS credentials, IAM roles, secret rotation
  - Simplified: Just set env vars in platform UI

---

## Next Step

All decisions are locked and executed. Phase 1 scaffolding is production-ready with DO/Vercel stack.

To deploy:
1. **Frontend**: Push to GitHub → Vercel auto-deploys, set env vars in Vercel dashboard
2. **Backend**: Push to GitHub → GitHub Actions builds Docker image → pushes to DO Container Registry → DO App Platform auto-deploys
3. **Database**: Create DO Managed PostgreSQL cluster, set connection string in DO App Platform env vars
4. **Cache**: Create DO Managed Redis cluster, set connection string in DO App Platform env vars
5. **Storage**: Create DO Spaces bucket, set credentials in DO App Platform env vars

---

## Verification

After Phase 1 completion, verify no AWS references remain:

```bash
# Should find nothing
grep -r "aws-secrets\|AWS_\|ecr\|IAM\|ECR" . --exclude-dir=node_modules --exclude-dir=.git || echo "✅ No AWS references found"

# Should find DO references
grep -r "do-container-registry\|DigitalOcean\|platform-env-vars" . --exclude-dir=node_modules --exclude-dir=.git || echo "✅ DO references found"
```

---

## Audit Trail

This file is the permanent record of Phase 1 decisions. Git history shows:
- Who made the decisions (you)
- When (2026-01-07)
- What was decided (D001=docker, D002=ecr, D005=aws-secrets, D020=sql-script)
- Why (reasoning above)

Linked in: 
- PR-2 (CI/CD deployment uses docker+ecr)
- PR-3 (Env setup uses aws-secrets)
- PR-4 (Seed script uses sql-script strategy)
