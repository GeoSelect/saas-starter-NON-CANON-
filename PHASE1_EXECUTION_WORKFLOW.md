# Phase 1 Execution Workflow

**Goal**: Go from parameterized PR templates → concrete production code in 1 hour

**Status**: Ready to execute NOW

---

## Step 1: Review Your Decisions (5 min)

Open [DECISIONS_LOCKED.md](DECISIONS_LOCKED.md) and confirm:

- ✅ D001 Backend Hosting = `docker`
- ✅ D002 Docker Registry = `ecr`
- ✅ D005 Secrets Backend = `aws-secrets`
- ✅ D020 Seed Strategy = `sql-script`

If any decision is wrong, edit DECISIONS_LOCKED.md and restart. Otherwise, proceed.

---

## Step 2: Test the Injection Script (5 min)

Run in **dry-run mode** first (no changes made):

```bash
chmod +x scripts/inject-decisions.sh

./scripts/inject-decisions.sh \
  --backend-hosting docker \
  --docker-registry ecr \
  --secrets-backend aws-secrets \
  --seed-strategy sql-script \
  --dry-run \
  --verbose
```

**Expected output**:
```
╔═════════════════════════════════════════╗
║  Phase 1 Decision Injection Script      ║
╚═════════════════════════════════════════╝

Mode: dry-run

Decisions to inject:
  D001 Backend Hosting:  docker
  D002 Docker Registry:  ecr
  D005 Secrets Backend:  aws-secrets
  D020 Seed Strategy:    sql-script

Processing files...

Injecting D001 (Backend Hosting = docker):
  [DRY-RUN] Would replace N occurrence(s) in .github/workflows/deploy.yml
  [DRY-RUN] Would replace N occurrence(s) in .github/workflows/health-check.yml
  ...

✅ All parameters injected successfully

DRY-RUN MODE
To apply these changes, run:
  ./scripts/inject-decisions.sh \
    --backend-hosting docker \
    --docker-registry ecr \
    --secrets-backend aws-secrets \
    --seed-strategy sql-script \
    --apply
```

Review the dry-run output. If everything looks correct, proceed to Step 3.

---

## Step 3: Apply the Injection (15 min)

Run in **apply mode** (makes actual changes + commits):

```bash
./scripts/inject-decisions.sh \
  --backend-hosting docker \
  --docker-registry ecr \
  --secrets-backend aws-secrets \
  --seed-strategy sql-script \
  --apply
```

**Expected output**:
```
✅ Replaced N occurrence(s) in .github/workflows/deploy.yml
✅ Replaced N occurrence(s) in .github/workflows/test.yml
...
✅ All parameters injected successfully

Creating commit...

✅ Changes committed

Next steps:
  1. Review the commit: git show HEAD
  2. Merge PR-2 (CI/CD Pipeline)
  3. Merge PR-3 (Environment Documentation)
  4. Merge PR-4 (Seed Script)

Phase 1 scaffolding is production-ready!
```

---

## Step 4: Verify Injection (5 min)

**Check the commit**:
```bash
git show HEAD
```

You should see:
- Replacements like `${D001_BACKEND_HOSTING}` → `docker`
- Replacements like `${D002_DOCKER_REGISTRY}` → `ecr`
- Replacements like `${D005_SECRETS_BACKEND}` → `aws-secrets`
- Replacements like `${D020_SEED_STRATEGY}` → `sql-script`

**Verify no parameters remain**:
```bash
grep -r '\${D0[0-9][0-9]' .github/ scripts/ || echo "✅ No parameters found"
```

Should output: `✅ No parameters found`

**Quick file checks**:
```bash
# CI/CD should reference docker and ecr
grep -l "docker\|ecr" .github/workflows/deploy.yml && echo "✅ CI/CD is concrete"

# Env should reference aws-secrets
grep "aws-secrets" .env.local.example && echo "✅ Env is concrete"

# Seed should reference sql-script
grep "sql-script" scripts/seed.ts && echo "✅ Seed is concrete"
```

---

## Step 5: Review Files (10 min)

Open these files and verify the concrete values are there:

**`.github/workflows/deploy.yml`**:
- Should deploy to `docker` (not `${D001_BACKEND_HOSTING}`)
- Should push to `ecr` registry (not `${D002_DOCKER_REGISTRY}`)
- Should load secrets from `aws-secrets` backend (not `${D005_SECRETS_BACKEND}`)

**`.env.local.example`**:
- Should show AWS Secrets Manager configuration (not generic secrets backend)
- Should show docker hosting environment variables (not generic hosting)

**`scripts/seed.ts`**:
- Should use `sql-script` strategy (not `${D020_SEED_STRATEGY}`)
- Should have SQL-specific implementation (not all 4 strategy branches)

**`Makefile`**:
- Should deploy to `docker` target (not parameterized)
- Should push to `ecr` (not parameterized)

---

## Step 6: Merge Phase 1 PRs (15 min)

Now that the parameterized PRs are concrete, merge them:

```bash
# Check current branch
git branch

# Assuming you're on main or staging branch:

# Merge PR-1 (Governance - no changes from injection)
git merge origin/PR-1
# Result: Governance docs added

# Merge PR-2 (CI/CD - now concrete)
git merge origin/PR-2
# Result: CI/CD pipeline with docker+ecr+aws-secrets

# Merge PR-3 (Environment - now concrete)
git merge origin/PR-3
# Result: Env docs and policy with aws-secrets + docker

# Merge PR-4 (Seed Script - now concrete)
git merge origin/PR-4
# Result: Seed script with sql-script strategy
```

**What you now have**:
- ✅ Governance framework (ownership, RACI, decisions)
- ✅ CI/CD pipeline (concrete GitHub Actions workflows)
- ✅ Environment documentation (concrete setup for docker + aws-secrets)
- ✅ Seed script (concrete SQL seeding)
- ✅ Injection script (reusable for future decisions)

**Timeline from start to finish**:
- Step 1: 5 min (review decisions)
- Step 2: 5 min (dry-run test)
- Step 3: 15 min (apply injection + commit)
- Step 4: 5 min (verify)
- Step 5: 10 min (review files)
- Step 6: 15 min (merge PRs)
- **Total: 55 minutes** (roundup to 1 hour)

---

## What Happens When Team Grows

### Person 2 Arrives (Phase 2)
- They see fully concrete, working CI/CD
- No confusion about templates
- They can review and comment on actual production code
- No need to re-run injection

### Person 3-4 Arrive (Phase 2+)
- Same: they see working infrastructure
- Injection script is proven and documented

### Person 5-6 Arrive (Phase 3)
- Team might need to revisit a decision (e.g., "should we move to kubernetes?")
- Run injection script again with new values:
  ```bash
  ./scripts/inject-decisions.sh \
    --backend-hosting kubernetes \
    --docker-registry ecr \
    --secrets-backend aws-secrets \
    --seed-strategy sql-script \
    --apply
  ```
- All 4 PRs updated consistently in one command
- **This is why the injection script was worth building solo**

---

## Rollback (If Needed)

If injection goes wrong:

```bash
# Undo the injection commit
git reset --soft HEAD~1

# Revert the file changes
git checkout .

# Start over with Step 2 (dry-run again)
```

---

## Summary

| Phase | Time | Action | Status |
|-------|------|--------|--------|
| **Now** | 1 hour | Run 6 steps (decide → inject → verify → merge) | Do this |
| **Person 2 arrives** | 0 min | They see working code | No action needed |
| **Person 4 arrives** | 0 min | They see working code | No action needed |
| **Team of 6** | 30 min | If decision changes, re-run injection | Use injection script |

**You've automated everything that can be automated. Inject now, reap the benefits forever.**

---

## Execution Checklist

- [ ] Step 1: Review decisions in DECISIONS_LOCKED.md
- [ ] Step 2: Run injection script in --dry-run mode
- [ ] Step 3: Run injection script in --apply mode
- [ ] Step 4: Verify no parameters remain (grep check)
- [ ] Step 5: Review files for concrete values
- [ ] Step 6: Merge PR-1, PR-2, PR-3, PR-4
- [ ] ✅ Phase 1 complete: Production-ready scaffolding

**Ready? Start with Step 1!**
