<!-- SPDX-License-Identifier: MIT -->

# GitHub Actions & Secrets Setup Guide

Step-by-step guide to configure GitHub Actions workflows and secrets for DigitalOcean deployment.

**Status**: Phase 2 Complete  
**Workflow**: build-and-deploy.yml  
**Target**: DigitalOcean App Platform + Container Registry

---

## Quick Start

1. Create DO API Token: https://cloud.digitalocean.com/account/api/tokens
2. Add GitHub Secrets: Settings → Secrets and variables → Actions
3. Merge PR and watch workflow run

---

## GitHub Secrets Setup

### Step 1: Generate DigitalOcean API Token

**Via DigitalOcean Dashboard**:

```
1. Log in: https://cloud.digitalocean.com
2. Left sidebar: Account → API → Tokens → Personal access tokens
3. Click: Generate New Token
   - Token name: "GitHub Actions GeoSelect"
   - Expiration: 90 days (recommended for rotation)
   - Scopes: ✅ read, ✅ write (for registry + App API)
4. Click: Generate Token
5. COPY the token immediately (shown only once)
```

Save as: `DO_API_TOKEN_GITHUB`

### Step 2: Get DigitalOcean App ID

**Via DigitalOcean Dashboard**:

```
1. Apps → Your App (geoselect)
2. Right side: App ID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
3. COPY the App ID
```

Save as: `DO_APP_ID`

### Step 3: Get Backend URL

**From DO App Platform**:

```
1. Apps → Your App → Overview
2. Live App: click to get URL
   Format: https://api-xxx.ondigitalocean.app
3. COPY the URL

Or configure custom domain:
   Format: https://api.geoselect.com
```

Save as: `BACKEND_URL`

### Step 4: Add GitHub Secrets

**Via GitHub Repository**:

```
1. Repository → Settings (top right) → Secrets and variables → Actions
2. New repository secret (click green button)

   Name: DIGITALOCEAN_API_TOKEN
   Value: (paste DO_API_TOKEN_GITHUB)
   → Click: Add secret

3. New repository secret
   Name: DIGITALOCEAN_APP_ID
   Value: (paste DO_APP_ID)
   → Click: Add secret

4. New repository secret
   Name: BACKEND_URL
   Value: (paste BACKEND_URL, e.g., https://api.geoselect.com)
   → Click: Add secret
```

**Verify**:
```bash
# List secrets (GitHub CLI)
gh secret list --repo GeoSelect/saas-starter-NON-CANON-

# Should output:
# DIGITALOCEAN_API_TOKEN     ****** (managed by Dependabot)
# DIGITALOCEAN_APP_ID        ****** (managed by Dependabot)
# BACKEND_URL                ****** (managed by Dependabot)
```

---

## Workflow File Structure

### Location

```
.github/
├── workflows/
│   ├── build-and-deploy.yml       ← DO deployment pipeline
│   ├── health-check.yml            ← Periodic health monitoring
│   └── pull-request.yml            ← PR checks (optional)
```

### build-and-deploy.yml Jobs

```
┌─────────────────────────────────────────────────────────┐
│ Trigger: push to main                                   │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
    ┌────────────────┐
    │ Build (required)│ → Docker Buildx → DO Container Registry
    └────────┬───────┘
             │
             ↓
  ┌──────────────────────┐
  │ Deploy (required)     │ → curl DO App Platform API
  └──────────┬───────────┘
             │
             ↓
  ┌──────────────────────┐
  │ Verify (required)     │ → Poll deployment status
  └──────────┬───────────┘
             │
             ↓
  ┌──────────────────────┐
  │ Health-check (required)│ → GET /api/health
  └──────────┬───────────┘
             │
             ├─→ Success: Done ✅
             └─→ Failure:
                    │
                    ↓
        ┌────────────────────────┐
        │ Notify-on-failure      │ → Create GitHub issue
        └────────────────────────┘
```

---

## Environment in Workflows

### Variables Used in build-and-deploy.yml

| Variable | Source | Usage |
|----------|--------|-------|
| `DIGITALOCEAN_API_TOKEN` | GitHub Secret | Docker login, DO API calls |
| `DIGITALOCEAN_APP_ID` | GitHub Secret | DO App Platform endpoint |
| `BACKEND_URL` | GitHub Secret | Health check endpoint |
| `REGISTRY_URL` | Hardcoded | registry.digitalocean.com/geoselect |
| `IMAGE_TAG` | Derived | ${{ github.sha }} (short commit hash) |

### Job Environment Variables

Each job gets these auto-set:

```yaml
# Automatically provided by GitHub Actions
GITHUB_TOKEN          # For authentication
GITHUB_SHA            # Commit hash
GITHUB_REF            # Branch name
GITHUB_REPOSITORY     # owner/repo
GITHUB_ACTOR          # Triggering user
GITHUB_RUN_ID         # Workflow run ID
GITHUB_RUN_NUMBER     # Run number in sequence
```

---

## Running Workflows Locally

### Test Workflow Syntax

```bash
# Install Act (local GitHub Actions runner)
brew install act

# Test build-and-deploy workflow
act -j build

# Test with secrets
act -s DIGITALOCEAN_API_TOKEN=token-value \
    -s DIGITALOCEAN_APP_ID=app-id-value \
    -s BACKEND_URL=https://api.example.com

# Test full workflow
act
```

### Debug Mode

```bash
# Run with verbose logging
act -v

# Run specific event
act push -v  # Simulate push event
act pull_request -v  # Simulate PR event
```

---

## Monitoring Workflow Execution

### Via GitHub UI

```
1. Repository → Actions (tab)
2. Workflows list shows: build-and-deploy
3. Click workflow run:
   - Shows job execution timeline
   - Logs for each job
   - Artifact downloads (if any)
4. Click job name for detailed logs
```

### Via GitHub CLI

```bash
# List recent runs
gh run list --repo GeoSelect/saas-starter-NON-CANON-

# Watch latest run
gh run watch

# View logs for specific run
gh run view <run-id>

# View logs for specific job
gh run view <run-id> --job <job-id> --log
```

### Via Command Line

```bash
# Stream logs from latest run
gh run watch --exit-status

# Download artifact from run
gh run download <run-id>
```

---

## Troubleshooting

### Issue: Workflow Doesn't Trigger

**Cause**: Push event not recognized

**Solution**:
```bash
# Ensure you're on main branch
git branch -v

# Push with verbose output
git push origin main -v

# Check Actions → Workflows
# Should show "build-and-deploy" in recent runs
```

### Issue: Docker Login Fails

**Cause**: DIGITALOCEAN_API_TOKEN missing or invalid

**Solution**:
```bash
# Verify secret exists
gh secret list

# Regenerate if needed
# DigitalOcean → Account → API → Generate New Token
# GitHub → Settings → Secrets → Update DIGITALOCEAN_API_TOKEN

# View workflow logs for error
gh run view <run-id> --job build --log
```

### Issue: DO API Call Fails

**Cause**: DIGITALOCEAN_APP_ID invalid or app doesn't exist

**Solution**:
```bash
# Get correct app ID
doctl apps list

# Verify with API
curl -X GET "https://api.digitalocean.com/v2/apps" \
  -H "Authorization: Bearer $DIGITALOCEAN_API_TOKEN"

# Update secret
gh secret set DIGITALOCEAN_APP_ID
```

### Issue: Health Check Fails

**Cause**: BACKEND_URL incorrect or app not responding

**Solution**:
```bash
# Test URL manually
curl https://api.geoselect.com/api/health/live

# Check app status in DO
doctl apps get <app-id> --format status

# View app logs
doctl apps logs <app-id> --type runtime
```

### Issue: Deployment Hangs

**Cause**: App Platform deployment taking > 10 minutes

**Solution**:
```bash
# Check app resource allocation
doctl apps get <app-id>

# Increase timeout in workflow (edit build-and-deploy.yml)
# Line: for i in {1..60}; do  # Change 60 to higher number

# View deployment status
doctl apps deployments list <app-id>
```

---

## Secrets Rotation

### Rotate DigitalOcean API Token

```bash
# 1. Generate new token in DigitalOcean
#    Account → API → Generate New Token

# 2. Update GitHub secret
gh secret set DIGITALOCEAN_API_TOKEN
# Paste new token when prompted

# 3. Delete old token in DigitalOcean
#    Account → API → Tokens → Delete (old token)

# 4. Verify by running workflow
git push origin main
```

### Rotate DO App ID

```bash
# Usually not needed (app ID doesn't change)
# Only update if:
# - Recreating app entirely
# - Migrating to different app

# If needed:
gh secret set DIGITALOCEAN_APP_ID
# Paste new app ID when prompted
```

### Rotate Backend URL

```bash
# Update if:
# - Domain changes
# - App moves to different region

# Update:
gh secret set BACKEND_URL
# Paste new URL when prompted
```

---

## Advanced Configuration

### Matrix Builds (Multiple Environments)

```yaml
strategy:
  matrix:
    environment: [staging, production]
    
steps:
  - name: Deploy to ${{ matrix.environment }}
    env:
      TARGET_ENV: ${{ matrix.environment }}
    run: echo "Deploying to $TARGET_ENV"
```

### Conditional Jobs

```yaml
deploy:
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - name: Deploy
      run: echo "Only on main"
```

### Scheduled Workflows

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
```

---

## Best Practices

### Security

- ✅ Use GitHub Secrets for all sensitive data
- ✅ Rotate tokens every 90 days
- ✅ Limit secret access to necessary workflows
- ✅ Review Actions logs for exposed data
- ✅ Use branch protection rules

### Performance

- ✅ Cache Docker layers (via buildx cache)
- ✅ Only deploy on main branch (not all PRs)
- ✅ Parallelize jobs where possible
- ✅ Use smaller base images (alpine)
- ✅ Set workflow timeouts

### Reliability

- ✅ Retry jobs on transient failures
- ✅ Use health checks to verify deployment
- ✅ Notify on failure (create issue, Slack)
- ✅ Keep logs for 90+ days
- ✅ Test workflow syntax before pushing

### Debugging

- ✅ Add detailed logging to jobs
- ✅ Use GitHub CLI to inspect runs
- ✅ Test locally with Act
- ✅ Document workflow decisions
- ✅ Keep audit trail of changes

---

## Reference Files

### build-and-deploy.yml

Located at: `.github/workflows/build-and-deploy.yml`

Key sections:
- **Build job**: Docker Buildx + push to DO Container Registry
- **Deploy job**: curl DO App Platform API
- **Verify job**: Poll deployment status
- **Health-check job**: GET /api/health
- **Notify-on-failure job**: Create GitHub issue

### Secrets Required

```
DIGITALOCEAN_API_TOKEN     (40+ char token)
DIGITALOCEAN_APP_ID        (UUID format)
BACKEND_URL                (HTTPS URL)
```

---

## Next Steps

1. ✅ Add GitHub Secrets (DIGITALOCEAN_API_TOKEN, DIGITALOCEAN_APP_ID, BACKEND_URL)
2. ✅ Create DO App Platform application
3. ✅ Deploy DO infrastructure (PostgreSQL, Redis, Spaces)
4. ✅ Merge PR and watch first workflow run
5. ⏳ Monitor deployment logs
6. ⏳ Test health endpoints

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [DigitalOcean API Documentation](https://docs.digitalocean.com/reference/api/)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Act: Run GitHub Actions Locally](https://github.com/nektos/act)

---

**Last Updated**: 2026-01-07  
**Status**: Production Ready  
**Owner**: DevOps/Platform Team
