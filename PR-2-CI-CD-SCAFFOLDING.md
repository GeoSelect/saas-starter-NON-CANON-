# PR-2: CI/CD Pipeline Scaffolding

**Status**: Ready to merge with decision parameters (depends on D001, D002, D005)

---

## What This PR Does

Creates GitHub Actions CI/CD pipeline scaffold with decision parameters embedded. Once Backend/SRE locks decisions, parameters are injected and pipeline is live.

**Merge Risk**: 🟡 Medium (has unresolved parameters, but safe to merge as template)  
**Blocks**: Nothing after merge  
**Blocked By**: PR-1 (soft dependency on governance clarity)

---

## Decision Parameters Required

This PR uses 3 critical decisions as parameters:

| Decision | Parameter | Options | Status |
|----------|-----------|---------|--------|
| D001 | `${D001_BACKEND_HOSTING}` | vercel \| docker \| kubernetes \| render | ⏳ Pending |
| D002 | `${D002_DOCKER_REGISTRY}` | ecr \| docker-hub \| gcr \| artifact-registry | ⏳ Pending |
| D005 | `${D005_SECRETS_BACKEND}` | aws-secrets \| vault \| supabase-vault \| github-secrets | ⏳ Pending |

---

## Files to Create

### 1. `.github/workflows/deploy.yml` (Parameterized)

```yaml
name: Deploy to ${D001_BACKEND_HOSTING}

on:
  push:
    branches:
      - main
      - staging
  workflow_dispatch:

env:
  REGISTRY: ${D002_DOCKER_REGISTRY}
  SECRETS_BACKEND: ${D005_SECRETS_BACKEND}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to ${D002_DOCKER_REGISTRY} Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ secrets.${D002_DOCKER_REGISTRY}_REGISTRY_URL }}
          username: ${{ secrets.${D002_DOCKER_REGISTRY}_USERNAME }}
          password: ${{ secrets.${D002_DOCKER_REGISTRY}_PASSWORD }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.${D002_DOCKER_REGISTRY}_REPO }}/app:${{ github.sha }}
            ${{ secrets.${D002_DOCKER_REGISTRY}_REPO }}/app:latest
          cache-from: type=registry,ref=${{ secrets.${D002_DOCKER_REGISTRY}_REPO }}/app:buildcache
          cache-to: type=registry,ref=${{ secrets.${D002_DOCKER_REGISTRY}_REPO }}/app:buildcache,mode=max

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    environment: staging
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to ${D001_BACKEND_HOSTING} (Staging)
        run: |
          # Deployment method depends on D001_BACKEND_HOSTING selection
          # This is a placeholder that will be replaced with actual deploy logic
          echo "Deploying with ${D001_BACKEND_HOSTING} strategy"
          case "${D001_BACKEND_HOSTING}" in
            docker)
              echo "Using Docker Swarm deploy..."
              ;;
            vercel)
              echo "Using Vercel deploy..."
              ;;
            kubernetes)
              echo "Using Kubernetes deploy..."
              ;;
            *)
              echo "Unknown backend hosting: ${D001_BACKEND_HOSTING}"
              exit 1
              ;;
          esac
        env:
          DEPLOY_TOKEN: ${{ secrets.${D001_BACKEND_HOSTING}_DEPLOY_TOKEN }}

  deploy-production:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to ${D001_BACKEND_HOSTING} (Production)
        run: |
          echo "Deploying to production with ${D001_BACKEND_HOSTING} strategy"
          # Full deployment logic will be injected after D001 decision
        env:
          DEPLOY_TOKEN: ${{ secrets.${D001_BACKEND_HOSTING}_DEPLOY_TOKEN }}
```

**After D001, D002, D005 locked**: Replace placeholders with actual deploy logic (sed script or manual)

### 2. `.github/workflows/test.yml` (Parameterized)

```yaml
name: Test

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main, staging]

env:
  SECRETS_BACKEND: ${D005_SECRETS_BACKEND}

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Load secrets (${D005_SECRETS_BACKEND})
        run: |
          # Secrets loading depends on D005_SECRETS_BACKEND selection
          case "${D005_SECRETS_BACKEND}" in
            aws-secrets)
              echo "Loading secrets from AWS Secrets Manager..."
              ;;
            supabase-vault)
              echo "Loading secrets from Supabase Vault..."
              ;;
            github-secrets)
              echo "Secrets already loaded via GitHub secrets"
              ;;
            *)
              echo "Unknown secrets backend: ${D005_SECRETS_BACKEND}"
              exit 1
              ;;
          esac
        env:
          AWS_REGION: us-east-1
      
      - name: Run tests
        run: pnpm test
      
      - name: Run linting
        run: pnpm lint
```

**After D005 locked**: Secret loading logic becomes concrete

### 3. `.github/workflows/health-check.yml` (Parameterized)

```yaml
name: Health Check

on:
  schedule:
    # Run every 30 minutes
    - cron: '*/30 * * * *'
  workflow_dispatch:

env:
  BACKEND_HOSTING: ${D001_BACKEND_HOSTING}

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Check API health (${D001_BACKEND_HOSTING})
        run: |
          # Health endpoint URL depends on backend hosting choice
          case "${D001_BACKEND_HOSTING}" in
            docker)
              HEALTH_URL="http://docker-spine.local:8000/health"
              ;;
            vercel)
              HEALTH_URL="${{ secrets.VERCEL_API_URL }}/health"
              ;;
            kubernetes)
              HEALTH_URL="${{ secrets.K8S_API_URL }}/health"
              ;;
            *)
              echo "Unknown backend: ${D001_BACKEND_HOSTING}"
              exit 1
              ;;
          esac
          
          curl -f $HEALTH_URL || exit 1
```

**After D001 locked**: Health check endpoint becomes concrete

### 4. `Makefile` (Parameterized)

```makefile
.PHONY: help build deploy-staging deploy-production test lint clean

# Decision parameters (will be injected after decisions lock)
BACKEND_HOSTING ?= ${D001_BACKEND_HOSTING}
DOCKER_REGISTRY ?= ${D002_DOCKER_REGISTRY}
SECRETS_BACKEND ?= ${D005_SECRETS_BACKEND}

help:
	@echo "Available targets:"
	@echo "  make build                - Build Docker image"
	@echo "  make deploy-staging       - Deploy to staging (${D001_BACKEND_HOSTING})"
	@echo "  make deploy-production    - Deploy to production (${D001_BACKEND_HOSTING})"
	@echo "  make test                 - Run test suite"
	@echo "  make lint                 - Run linting"
	@echo ""
	@echo "Current configuration:"
	@echo "  BACKEND_HOSTING = $(BACKEND_HOSTING)"
	@echo "  DOCKER_REGISTRY = $(DOCKER_REGISTRY)"
	@echo "  SECRETS_BACKEND = $(SECRETS_BACKEND)"

build:
	docker build -t app:latest .

deploy-staging:
	@echo "Deploying to $(BACKEND_HOSTING) staging..."
	git push staging main

deploy-production:
	@echo "Deploying to $(BACKEND_HOSTING) production..."
	git push main main

test:
	pnpm test

lint:
	pnpm lint

clean:
	docker rmi app:latest || true
```

**After D001, D002, D005 locked**: Make targets become functional

---

## Merge Checklist

Before merging PR-2:

- [ ] `.github/workflows/deploy.yml` created with ${D001_BACKEND_HOSTING}, ${D002_DOCKER_REGISTRY}, ${D005_SECRETS_BACKEND} placeholders
- [ ] `.github/workflows/test.yml` created with ${D005_SECRETS_BACKEND} placeholder
- [ ] `.github/workflows/health-check.yml` created with ${D001_BACKEND_HOSTING} placeholder
- [ ] `Makefile` created with all 3 parameters
- [ ] DECISION_PARAMETERS_PHASE1.md confirms parameter names match
- [ ] No attempts to resolve parameters (leave as placeholders)
- [ ] Team understands this is a template (not functional until decisions lock)
- [ ] Ready for injection script to run after Backend/SRE session

---

## After Decisions Lock (4-6 hours later)

Once Backend/SRE session completes and decisions are locked:

```bash
./scripts/inject-decisions.sh \
  --backend-hosting docker \
  --docker-registry ecr \
  --secrets-backend aws-secrets

# This script will:
# 1. Replace ${D001_BACKEND_HOSTING} with "docker" in all files
# 2. Replace ${D002_DOCKER_REGISTRY} with "ecr" in all files
# 3. Replace ${D005_SECRETS_BACKEND} with "aws-secrets" in all files
# 4. Remove unused deployment branches from deploy.yml
# 5. Commit changes with message "Inject Phase 1 decisions"
```

---

## Parameter Injection Examples

### Current (Parameterized)
```yaml
registry: ${{ secrets.${D002_DOCKER_REGISTRY}_REGISTRY_URL }}
```

### After Injection (D002 = ecr)
```yaml
registry: ${{ secrets.ECR_REGISTRY_URL }}
```

---

## Decision Dependencies

**This PR depends on**:
- PR-1 (soft dependency on governance clarity)
- D001 (Backend Hosting) - for deployment targets
- D002 (Docker Registry) - for image push targets
- D005 (Secrets Backend) - for secret loading

**This PR unblocks**:
- PR-4 (Seed script can now assume CI/CD exists)
- GitHub Actions workflows (once decisions lock)
- Health check automation (once decisions lock)

---

## Success Criteria

You'll know this PR is working when:
- ✅ PR merges with placeholders intact
- ✅ Team understands parameters are temporary
- ✅ Injection script runs successfully after decisions lock
- ✅ GitHub Actions workflows become functional after injection
- ✅ Deployed images appear in registry after injection

---

## Risk Assessment

**Current Risk**: 🟡 Medium
- Has unresolved parameters
- Not functional until injection runs
- But safe to merge (non-breaking template)

**Risk After Injection**: ✅ Low
- Becomes fully functional
- All parameters resolved
- Ready for production use
