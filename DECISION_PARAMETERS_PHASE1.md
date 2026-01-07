# Phase 1 Scaffolding - Decision Parameters

**Purpose**: Embed decision references in Phase 1 PRs so they can be created/merged immediately, then updated once Backend/SRE decisions lock.

**Status**: Ready to deploy PRs with these parameters → decisions lock 4-6 hours later → inject real values

---

## Critical Scaffolding Decisions (5)

These 5 decisions affect Phase 1 scaffolding PRs and must be parameterized:

### D001: Backend Hosting
- **Primary Owner**: Backend/SRE
- **Affects**: PR-2 (CI/CD), PR-4 (Seed Script)
- **Parameter**: `BACKEND_HOSTING`
- **Options**: `vercel|docker-swarm|kubernetes|render|heroku`
- **Used In**:
  - CI/CD deploy target
  - Seed script environment detection
  - Health endpoint URL
  - Environment variable setup
- **Status**: ⏳ Pending decision
- **Default Placeholder**: `BACKEND_HOSTING="${D001_BACKEND_HOSTING}"`

### D002/D019: Docker Registry
- **Primary Owner**: Backend/SRE
- **Affects**: PR-2 (CI/CD)
- **Parameter**: `DOCKER_REGISTRY`
- **Options**: `docker-hub|ecr|gcr|artifact-registry|private`
- **Used In**:
  - GitHub Actions docker build step
  - Image push target
  - Image pull in seed container
  - Registry authentication
- **Status**: ⏳ Pending decision
- **Default Placeholder**: `DOCKER_REGISTRY="${D002_DOCKER_REGISTRY}"`

### D005: Secrets Management
- **Primary Owner**: Backend/SRE + Security
- **Affects**: PR-3 (Env Docs), PR-4 (Seed Script)
- **Parameter**: `SECRETS_BACKEND`
- **Options**: `aws-secrets|vault|supabase-vault|github-secrets|env-file`
- **Used In**:
  - Env file setup (.env.local template)
  - Seed script secret loading
  - CI/CD secret injection
  - Health endpoint secret validation
- **Status**: ⏳ Pending decision
- **Default Placeholder**: `SECRETS_BACKEND="${D005_SECRETS_BACKEND}"`

### D020: Seed Strategy
- **Primary Owner**: Backend/SRE
- **Affects**: PR-4 (Seed Script)
- **Parameter**: `SEED_STRATEGY`
- **Options**: `sql-script|orm-migrations|managed-service|snapshot`
- **Used In**:
  - Seed script type selection
  - Database initialization method
  - Migration framework choice
  - Data population approach
- **Status**: ⏳ Pending decision
- **Default Placeholder**: `SEED_STRATEGY="${D020_SEED_STRATEGY}"`

### Supporting Decisions (NOT parameterized in Phase 1, but noted)

These decisions don't block Phase 1 PRs creation, but affect the actual implementation:

- **D007**: Frontend Environment Variables → affects PR-3 docs, implemented later
- **D017**: Frontend Runtime Config → affects PR-3 docs, implemented later
- **D032**: Health Endpoints → implemented after scaffolding
- **D036**: Smoke Tests → implemented after scaffolding

---

## Phase 1 PR Scaffold Map

### PR-1: Governance + Documentation
- **Status**: ✅ No decision parameters needed
- **Contents**: OWNERSHIP_INTAKE.md, decision roadmap, team contacts
- **Decision Blockers**: None
- **Can merge**: Immediately

### PR-2: CI/CD Pipeline Scaffolding
- **Status**: ⏳ Parameterized, needs D001 + D002/D019
- **Parameters Used**:
  - `${D001_BACKEND_HOSTING}` → deploy target
  - `${D002_DOCKER_REGISTRY}` → image registry
  - `${D005_SECRETS_BACKEND}` → secret injection
- **Contents**: 
  - `.github/workflows/deploy.yml` (parameterized)
  - `.github/workflows/test.yml` (parameterized)
  - Makefile with deploy targets
- **Update Process**: Once decisions lock, sed/replace placeholders
- **Can merge**: Immediately with placeholders

### PR-3: Environment Documentation + Policy
- **Status**: ⏳ Parameterized, needs D005
- **Parameters Used**:
  - `${D005_SECRETS_BACKEND}` → .env template type
  - `${D001_BACKEND_HOSTING}` → environment URLs
- **Contents**:
  - .env.local.example (parameterized)
  - ENV_SETUP.md (decision tree)
  - ENV_POLICY.md (security guardrails)
- **Update Process**: Once decisions lock, generate actual .env templates
- **Can merge**: Immediately with template tree

### PR-4: Seed Script Scaffolding
- **Status**: ⏳ Parameterized, needs D001 + D020 + D005
- **Parameters Used**:
  - `${D001_BACKEND_HOSTING}` → environment detection
  - `${D020_SEED_STRATEGY}` → seed method
  - `${D005_SECRETS_BACKEND}` → secret loading
- **Contents**:
  - `scripts/seed.ts` (parameterized)
  - Seed method selection logic
  - Placeholder data loaders
- **Update Process**: Once decisions lock, select seed implementation
- **Can merge**: Immediately with decision tree

---

## Injection Workflow

### NOW (Merge parameterized PRs)
```bash
# Merge PR-1, PR-2, PR-3, PR-4 with placeholders
git merge PR-1  # ✅ No params needed
git merge PR-2  # ⏳ Has ${D001_BACKEND_HOSTING}, ${D002_DOCKER_REGISTRY}, ${D005_SECRETS_BACKEND}
git merge PR-3  # ⏳ Has ${D005_SECRETS_BACKEND}, ${D001_BACKEND_HOSTING}
git merge PR-4  # ⏳ Has ${D001_BACKEND_HOSTING}, ${D020_SEED_STRATEGY}, ${D005_SECRETS_BACKEND}
```

### AFTER Backend/SRE Decision Session (4-6 hrs)
```bash
# Lock decisions: D001=docker, D002=ecr, D005=aws-secrets, D020=sql-script
# Inject values into parameterized files
./scripts/inject-decisions.sh \
  --backend-hosting docker \
  --docker-registry ecr \
  --secrets-backend aws-secrets \
  --seed-strategy sql-script

# Files updated:
# - .github/workflows/deploy.yml
# - .env.local.example
# - scripts/seed.ts
```

### THEN (Push updated PRs)
```bash
git commit -am "Inject Phase 1 decisions: D001, D002, D005, D020"
git push
```

---

## Parameter Replacement Examples

### D001: Backend Hosting
```yaml
# In .github/workflows/deploy.yml (PR-2)
deploy:
  name: Deploy to ${D001_BACKEND_HOSTING}
  strategy:
    matrix:
      environment:
        - prod: ${{ secrets.DEPLOY_${D001_BACKEND_HOSTING}_PROD }}
        - staging: ${{ secrets.DEPLOY_${D001_BACKEND_HOSTING}_STAGING }}
```

After decision: `docker` → `${{ secrets.DEPLOY_DOCKER_PROD }}`

### D002: Docker Registry
```yaml
# In .github/workflows/deploy.yml (PR-2)
- name: Push to ${D002_DOCKER_REGISTRY}
  run: |
    docker build -t ${{ secrets.${D002_DOCKER_REGISTRY}_REPO }}/app:latest .
    docker push ${{ secrets.${D002_DOCKER_REGISTRY}_REPO }}/app:latest
```

After decision: `ecr` → `${{ secrets.ECR_REPO }}/app:latest`

### D005: Secrets Backend
```bash
# In scripts/seed.ts (PR-4)
const secretsBackend = process.env.SECRETS_BACKEND || '${D005_SECRETS_BACKEND}';

switch (secretsBackend) {
  case 'aws-secrets':
    const secrets = await loadAwsSecrets();
    break;
  case 'supabase-vault':
    const secrets = await loadSupabaseSecrets();
    break;
  // ...default: throw error about unmapped decision
}
```

After decision: `aws-secrets` → remove switch, use only AWS loader

### D020: Seed Strategy
```typescript
// In scripts/seed.ts (PR-4)
const seedStrategy = process.env.SEED_STRATEGY || '${D020_SEED_STRATEGY}';

if (seedStrategy === 'sql-script') {
  const sql = fs.readFileSync('./scripts/seed.sql', 'utf-8');
  await db.query(sql);
} else if (seedStrategy === 'orm-migrations') {
  await runMigrations();
} else {
  throw new Error(`Unknown seed strategy: ${seedStrategy}`);
}
```

After decision: `sql-script` → remove others, inline SQL seed

---

## Timeline

| Step | Duration | Blockers | Outcome |
|------|----------|----------|---------|
| **NOW** | 30 min | None | PR-1, PR-2, PR-3, PR-4 merged (parameterized) |
| **Backend/SRE Session** | 2.5 hrs | PR-1 merged | D001, D002, D019, D005, D020 locked |
| **Inject Decisions** | 15 min | Decisions locked | Placeholders replaced with real values |
| **PR-5+** | 4+ hrs | All Phase 1 decisions | Real implementation PRs |

---

## Files Modified by Injection

Once decisions lock, these files will be updated:

| File | PR | Parameters | Update Action |
|------|----|-----------:|---|
| `.github/workflows/deploy.yml` | PR-2 | D001, D002, D005 | Replace placeholders, remove unused branches |
| `.github/workflows/test.yml` | PR-2 | D001, D005 | Replace placeholders |
| `.env.local.example` | PR-3 | D005, D001 | Generate template for selected secrets backend |
| `ENV_SETUP.md` | PR-3 | D005, D001 | Update setup instructions for chosen backend |
| `scripts/seed.ts` | PR-4 | D001, D020, D005 | Select implementation, remove other branches |
| `scripts/seed.sql` | PR-4 | D020 | Include if strategy is sql-script |

---

## Decision Lock Checklist

**Before injection, confirm:**

- [ ] D001: Backend Hosting is locked (docker | vercel | kubernetes | render | heroku)
- [ ] D002: Docker Registry is locked (ecr | docker-hub | gcr | artifact-registry | private)
- [ ] D005: Secrets Backend is locked (aws-secrets | vault | supabase-vault | github-secrets | env-file)
- [ ] D020: Seed Strategy is locked (sql-script | orm-migrations | managed-service | snapshot)
- [ ] All 4 parameters captured in decision document
- [ ] All 4 Phase 1 PRs merged with placeholders
- [ ] Ready to run injection script

---

## Summary

**Now**: Create 4 PRs with decision parameters embedded
- PR-1: ✅ No params (merge immediately)
- PR-2: ⏳ 3 params (merge with placeholders)
- PR-3: ⏳ 2 params (merge with placeholders)
- PR-4: ⏳ 3 params (merge with placeholders)

**Later**: Backend/SRE session locks decisions → injection script updates files → Phase 1 complete

This lets you move fast without blocking on decisions.
