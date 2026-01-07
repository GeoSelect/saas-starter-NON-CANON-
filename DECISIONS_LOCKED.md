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

### D002/D019: Docker Registry
**Decision**: `ecr` (AWS ECR)

**Why**:
- Private registry (not public Docker Hub)
- AWS integration (already using AWS for secrets)
- Cost-effective at our scale
- Security: fine-grained IAM access control

**Implications**:
- GitHub Actions needs AWS credentials for push
- Image pull in staging/prod uses IAM role
- Registry URL: `123456789.dkr.ecr.us-east-1.amazonaws.com/geoselect-app`
- Buildcache: ECR-backed (faster rebuilds)

### D005: Secrets Management
**Decision**: `aws-secrets` (AWS Secrets Manager)

**Why**:
- Centralized secret management
- Automatic rotation support
- AWS audit logs (CloudTrail)
- Works with both local (AWS CLI) and CI/CD (IAM role)

**Implications**:
- Local dev: `aws secretsmanager get-secret-value` 
- CI/CD: GitHub Actions IAM role has GetSecretValue permission
- .env.local loads secrets from AWS on startup
- Seed script loads database credentials from AWS

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

| Decision | Value | Locked? | Injection Status |
|----------|-------|---------|------------------|
| D001 | docker | ✅ Yes | Ready to inject |
| D002 | ecr | ✅ Yes | Ready to inject |
| D005 | aws-secrets | ✅ Yes | Ready to inject |
| D020 | sql-script | ✅ Yes | Ready to inject |

---

## Next Step

Run the injection script to replace all `${DECISION_PARAMETER}` placeholders with these concrete values in PR-2, PR-3, PR-4:

```bash
./scripts/inject-decisions.sh \
  --backend-hosting docker \
  --docker-registry ecr \
  --secrets-backend aws-secrets \
  --seed-strategy sql-script \
  --apply

# Output:
# ✅ Injecting decisions into Phase 1 PRs...
# ✅ Replaced ${D001_BACKEND_HOSTING} → docker
# ✅ Replaced ${D002_DOCKER_REGISTRY} → ecr
# ✅ Replaced ${D005_SECRETS_BACKEND} → aws-secrets
# ✅ Replaced ${D020_SEED_STRATEGY} → sql-script
# ✅ Updated .github/workflows/deploy.yml
# ✅ Updated .env.local.example
# ✅ Updated scripts/seed.ts
# ✅ Updated package.json
# ✅ All injections complete. Ready to merge PR-2, PR-3, PR-4.
```

---

## Verification Before Merge

After injection, verify files have real values (not placeholders):

```bash
# Check no placeholders remain
grep -r '\${D0[0-9][0-9]' .github/workflows/ scripts/ || echo "✅ No parameters found"

# Verify specific values are injected
grep "docker" .github/workflows/deploy.yml && echo "✅ docker found in deploy"
grep "ecr" .github/workflows/deploy.yml && echo "✅ ecr found in deploy"
grep "aws-secrets" .env.local.example && echo "✅ aws-secrets found in env"
grep "sql-script" scripts/seed.ts && echo "✅ sql-script found in seed"
```

---

## Timeline

- ✅ **Decisions made**: 30 min (you, solo)
- ⏳ **Injection script**: 15 min (automated)
- ⏳ **Verify + merge**: 15 min (manual review)
- **Total**: ~1 hour from now to production-ready scaffolding

---

## Important Notes

- These decisions are **not reversible without re-injection**. If you change your mind on docker/ecr/aws-secrets/sql-script, run injection again with new values.
- The injection script is **idempotent**. You can run it multiple times with the same decision values (safe).
- When person 2 arrives, they'll see this decision lock and understand what was chosen and why.
- When team hits 6 people, the injection script becomes your process for propagating any future architecture decisions.

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
