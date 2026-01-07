<!-- SPDX-License-Identifier: MIT -->

# DigitalOcean Deployment Guide

This guide covers deploying GeoSelect to DigitalOcean with Vercel frontend and DO App Platform backend.

**Status**: Phase 2 Complete  
**Stack**: Vercel (Frontend) + DO App Platform (Backend) + DO Managed Services  
**Decision**: D002 = do-container-registry, D005 = platform-env-vars

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ GitHub                                                          │
│ - Main branch: auto-triggers build workflow                     │
│ - Secrets: DO_API_TOKEN, DIGITALOCEAN_APP_ID, BACKEND_URL      │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ↓
        ┌─────────────────────┐
        │   GitHub Actions    │
        │ - Build Docker img  │
        │ - Push to DO Reg    │
        │ - Deploy to DO App  │
        └─────────┬───────────┘
                  │
        ┌─────────┴─────────────────────────────────────────┐
        ↓                                                     ↓
┌──────────────────────────┐             ┌────────────────────────┐
│  DO Container Registry   │             │  DO App Platform       │
│  - Private Docker images │             │ - Node.js backend      │
│  - Automatic auth with   │             │ - Auto-deploys on push │
│    DO account            │             │ - Env vars in UI       │
└──────────────────────────┘             └────────┬───────────────┘
                                                  │
                                ┌─────────────────┼──────────────────┐
                                ↓                 ↓                  ↓
                        ┌──────────────┐  ┌──────────────┐  ┌─────────────┐
                        │   Database   │  │    Cache     │  │  Storage    │
                        │  PostgreSQL  │  │    Redis     │  │  Spaces     │
                        │  Managed     │  │  Managed     │  │  Bucket     │
                        └──────────────┘  └──────────────┘  └─────────────┘
```

---

## Prerequisites

1. **DigitalOcean Account**
   - Create account: https://www.digitalocean.com
   - Generate API Token: Settings → API → Tokens → Generate New Token
   - Save token securely (you'll use it once)

2. **GitHub Repository**
   - Repository secrets needed:
     - `DIGITALOCEAN_API_TOKEN` (from step 1)
     - `DIGITALOCEAN_APP_ID` (get after creating app below)
     - `BACKEND_URL` (get after deploying, e.g., https://api.geoselect.ondigitalocean.app)

3. **Vercel Account** (for frontend)
   - Create account: https://vercel.com
   - Import Next.js repo
   - Set environment variables in Vercel dashboard

---

## Step 1: Create DigitalOcean Resources

### 1.1 Create Managed PostgreSQL Database

```bash
# Via DO Dashboard:
# 1. Cloud Dashboard → Manage → Databases → Create Database
# 2. Choose PostgreSQL 12+
# 3. Region: same as app platform (e.g., New York 3)
# 4. Size: $15/month (shared) or $40/month (dedicated)
# 5. Name: geoselect
# 6. Copy connection string: postgresql://user:password@host:port/database?sslmode=require
```

Save the connection string - you'll use it in App Platform env vars.

### 1.2 Create Managed Redis Cache

```bash
# Via DO Dashboard:
# 1. Cloud Dashboard → Manage → Databases → Create Database
# 2. Choose Redis
# 3. Region: same as PostgreSQL
# 4. Size: $15/month (shared) or $40/month (dedicated)
# 5. Name: geoselect-cache
# 6. Copy connection string: redis://user:password@host:port?ssl=true
```

### 1.3 Create Spaces (File Storage)

```bash
# Via DO Dashboard:
# 1. Cloud Dashboard → Manage → Spaces → Create Spaces Bucket
# 2. Name: geoselect-staging (or production)
# 3. Region: same as other resources
# 4. Settings → Manage Keys → Create new space key
# 5. Copy: access key, secret key, endpoint URL
```

---

## Step 2: Create Container Registry

```bash
# Via DO Dashboard:
# 1. Cloud Dashboard → Manage → Container Registry → Create Registry
# 2. Name: geoselect
# 3. Region: New York (or your region)
# 4. Subscription: $5/month (12 repositories)

# Result: Registry URL = registry.digitalocean.com/geoselect
```

---

## Step 3: Create App Platform Application

### 3.1 Create App

```bash
# Via DO Dashboard:
# 1. Cloud Dashboard → Apps → Create App
# 2. Source: GitHub repository
# 3. Select your geoselect repository
# 4. Choose branch: main
# 5. Deploy: Node.js
```

### 3.2 Configure App

**Component Settings**:
```
HTTP Port: 8000
Build Command: npm run build
Run Command: npm run start
```

**Health Check**:
```
HTTP Path: /api/health/live
Port: 8000
Ping Interval: 10s
Timeout: 5s
Unhealthy Threshold: 3
```

**Environment Variables** (set in DO dashboard):
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
REDIS_URL=redis://user:password@host:port?ssl=true
DO_SPACES_KEY=your-spaces-key
DO_SPACES_SECRET=your-spaces-secret
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=geoselect-staging
DO_SPACES_REGION=nyc3
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@geoselect.local
APP_VERSION=1.0.0
```

### 3.3 Get App ID

After creating app:
1. Go to App Dashboard
2. Settings → App Info
3. Copy App ID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

---

## Step 4: Configure GitHub Secrets

Add to GitHub repository (Settings → Secrets → Actions):

```
DIGITALOCEAN_API_TOKEN = <token from Step 1>
DIGITALOCEAN_APP_ID = <app id from Step 3.3>
BACKEND_URL = https://api.your-app-name.ondigitalocean.app
```

---

## Step 5: Deploy

### 5.1 Push to main branch

```bash
git checkout main
git merge chore/copilot/bootstrap
git push origin main
```

GitHub Actions automatically:
1. Builds Docker image
2. Pushes to DO Container Registry
3. Deploys to DO App Platform
4. Runs health check
5. Creates issue on failure

### 5.2 Verify Deployment

Check DO Dashboard:
1. Apps → Your App
2. Runtime logs (should see "Server listening on port 8000")
3. Click App URL to test
4. GET `/api/health` should return `{ status: 'healthy' }`

---

## Step 6: Frontend Deployment (Vercel)

### 6.1 Connect Vercel

```bash
# Option 1: Push to GitHub
git push origin main
# Vercel auto-imports and deploys

# Option 2: Connect manually
# 1. Vercel Dashboard → Import Project
# 2. Select geoselect repository
# 3. Configure project
# 4. Deploy
```

### 6.2 Set Frontend Environment Variables

In Vercel Dashboard:

```
Settings → Environment Variables:

NEXT_PUBLIC_API_URL=https://api.your-app-name.ondigitalocean.app
NEXT_PUBLIC_APP_NAME=GeoSelect
```

---

## Troubleshooting

### Container Registry Push Fails

```bash
# Check credentials
doctl registry login

# Manual push test
docker tag geoselect-api:latest registry.digitalocean.com/geoselect/api:latest
docker push registry.digitalocean.com/geoselect/api:latest
```

### App Deployment Fails

1. **Check DO App Platform logs**:
   - Apps → Your App → Runtime logs
   - Look for startup errors

2. **Check environment variables**:
   - Are DATABASE_URL, REDIS_URL set?
   - Is DATABASE_URL correct format?

3. **Check database connectivity**:
   - Can you connect from your local machine?
   - Is database accessible to app platform?

4. **Check container health**:
   - Does Docker image build locally?
   - `docker build -t geoselect-api . && docker run -p 8000:8000 geoselect-api`

### Health Check Fails

```bash
# Test manually
curl https://api.your-app-name.ondigitalocean.app/api/health/live

# Should return:
# { "status": "alive" }

# Full health check:
curl https://api.your-app-name.ondigitalocean.app/api/health
```

### Database Connection Issues

```sql
-- Test connection locally
psql postgresql://user:password@host:port/geoselect

-- Check DO database trusted sources
-- Database → Settings → Trusted Sources
-- Add: 0.0.0.0/0 (or your DO App Platform cluster)
```

---

## Environment Management

### Local Development

```bash
# .env.local (NEVER commit)
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/geoselect
REDIS_URL=redis://localhost:6379
DO_SPACES_KEY=...
DO_SPACES_SECRET=...
```

### Staging

Set in DO Dashboard:
```
Environment Variables → Staging:
NODE_ENV=staging
DATABASE_URL=postgresql://...@staging-db
```

### Production

Set in DO Dashboard:
```
Environment Variables → Production:
NODE_ENV=production
DATABASE_URL=postgresql://...@production-db
```

---

## Scaling & Monitoring

### Auto-Scale

DO App Platform → Your App → Settings → Auto Scaling:
```
Min Instances: 1
Max Instances: 5
Target CPU: 70%
```

### Monitoring

**Built-in DO Monitoring**:
- Apps Dashboard shows CPU, Memory, Network
- Logs are available in runtime tab

**Health Checks**:
- GET `/api/health/live` every 10 seconds
- Automatically restarts unhealthy instances

**Metrics**:
- Optional: Export to external service (Datadog, New Relic, etc.)

---

## Backup & Disaster Recovery

### Database Backups

DO Managed PostgreSQL → Settings → Backup & Recovery:
```
Backup Frequency: Daily
Retention: 7 days
```

### Spaces Backups

DO Spaces → Settings:
- Versioning: Enable (optional)
- CORS: Configure for frontend

### App Snapshots

DO App Platform auto-snapshots on each deploy:
- Can rollback to previous deployment
- Apps → Your App → Deployments → Rollback

---

## Cost Estimation (Monthly)

```
Database (PostgreSQL):        $15 (shared) or $40 (dedicated)
Cache (Redis):               $15 (shared) or $40 (dedicated)
Spaces (100GB):              $5 + $0.02/GB excess
App Platform (2 instances):  $12 (2 × $6 per instance)
Container Registry:          $5 (unlimited repos, 250GB bandwidth)
DNS:                         Included (if using DO)
                             ────────────────────────────
Total (Shared):              ~$50/month
Total (Dedicated):           ~$105/month
```

---

## Next Steps

1. ✅ Deploy backend to DO App Platform
2. ✅ Deploy frontend to Vercel
3. ⏳ Configure custom domain (DNS)
4. ⏳ Set up CDN (optional)
5. ⏳ Enable monitoring/alerting
6. ⏳ Implement backup strategy

---

## References

- DO App Platform: https://docs.digitalocean.com/products/app-platform/
- DO Container Registry: https://docs.digitalocean.com/products/container-registry/
- DO Spaces: https://docs.digitalocean.com/products/spaces/
- DO Managed PostgreSQL: https://docs.digitalocean.com/products/databases/postgresql/
- DO Managed Redis: https://docs.digitalocean.com/products/databases/redis/

---

**Last Updated**: 2026-01-07  
**Status**: Production Ready  
**Owner**: Backend/SRE Team
