<!-- SPDX-License-Identifier: MIT -->

# Environment Variables Reference

Complete guide to all environment variables used in GeoSelect stack.

**Status**: Production Ready  
**Stack**: Node.js + Next.js + Docker + DO + Vercel  
**Scope**: Backend, Frontend, Local Dev, Staging, Production

---

## Variables by Environment

### Development (Local)

**File**: `.env.local` (NEVER commit)

```bash
# App Configuration
NODE_ENV=development
PORT=3000

# Database (local Docker or local PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/geoselect

# Cache (local Redis)
REDIS_URL=redis://localhost:6379

# File Storage (local or dev Spaces bucket)
DO_SPACES_KEY=dev-key
DO_SPACES_SECRET=dev-secret
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=geoselect-dev
DO_SPACES_REGION=nyc3

# Email (local or dev Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=dev-email@gmail.com
SMTP_PASSWORD=dev-app-password
SMTP_FROM=dev@geoselect.local

# Monitoring
HEALTH_CHECK_DATABASE=true
HEALTH_CHECK_AUDIT=true

# Frontend (if running locally)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=GeoSelect
```

### Staging

**Location**: DO App Platform → Environment

```bash
# App Configuration
NODE_ENV=staging
PORT=8000

# Database (DO Managed PostgreSQL - staging)
DATABASE_URL=postgresql://user:pass@geoselect-staging.db.ondigitalocean.com:25060/geoselect?sslmode=require

# Cache (DO Managed Redis - staging)
REDIS_URL=redis://user:pass@geoselect-staging.redis.ondigitalocean.com:25061?ssl=true

# File Storage (DO Spaces - staging)
DO_SPACES_KEY=xxxxxxxxxxxxxxxxxxxx
DO_SPACES_SECRET=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=geoselect-staging
DO_SPACES_REGION=nyc3

# Email (Staging Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=staging@geoselect.local
SMTP_PASSWORD=xxxxx-xxxx-xxxx-xxxx
SMTP_FROM=noreply-staging@geoselect.local

# Monitoring & Health
HEALTH_CHECK_DATABASE=true
HEALTH_CHECK_AUDIT=true

# Frontend (Vercel staging)
NEXT_PUBLIC_API_URL=https://api-staging.geoselect.com
NEXT_PUBLIC_APP_NAME=GeoSelect (Staging)

# Deployment
APP_VERSION=1.0.0-staging
DEPLOYMENT_TIMESTAMP=2026-01-07T12:00:00Z
```

### Production

**Location**: DO App Platform → Environment + Vercel Dashboard

```bash
# App Configuration
NODE_ENV=production
PORT=8000

# Database (DO Managed PostgreSQL - production, larger instance)
DATABASE_URL=postgresql://user:pass@geoselect-prod.db.ondigitalocean.com:25060/geoselect?sslmode=require

# Cache (DO Managed Redis - production, replicated)
REDIS_URL=redis://user:pass@geoselect-prod.redis.ondigitalocean.com:25061?ssl=true

# File Storage (DO Spaces - production bucket)
DO_SPACES_KEY=aaaaaaaaaaaaaaaa
DO_SPACES_SECRET=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=geoselect-production
DO_SPACES_REGION=nyc3

# Email (Production Gmail or custom domain)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@geoselect.com
SMTP_PASSWORD=zzzz-zzzz-zzzz-zzzz
SMTP_FROM=noreply@geoselect.com

# Monitoring & Health
HEALTH_CHECK_DATABASE=true
HEALTH_CHECK_AUDIT=true

# Sentry (Error tracking)
SENTRY_DSN=https://key@sentry.io/project-id

# Frontend (Vercel production)
NEXT_PUBLIC_API_URL=https://api.geoselect.com
NEXT_PUBLIC_APP_NAME=GeoSelect

# Deployment
APP_VERSION=1.0.0
DEPLOYMENT_TIMESTAMP=2026-01-07T15:30:00Z
ENVIRONMENT=production
```

---

## Variable Categories

### App Configuration

| Variable | Dev | Staging | Production | Type | Required |
|----------|-----|---------|------------|------|----------|
| `NODE_ENV` | development | staging | production | enum | ✅ |
| `PORT` | 3000 | 8000 | 8000 | number | ✅ |
| `APP_VERSION` | 1.0.0-dev | 1.0.0-staging | 1.0.0 | string | ❌ |
| `DEPLOYMENT_TIMESTAMP` | - | auto | auto | ISO8601 | ❌ |
| `ENVIRONMENT` | dev | staging | prod | enum | ❌ |

### Database

| Variable | Value Format | Source | Required |
|----------|--------------|--------|----------|
| `DATABASE_URL` | postgresql://user:pass@host:port/db?sslmode=require | DO Managed DB | ✅ |
| `DATABASE_POOL_MIN` | 2 | Config | ❌ |
| `DATABASE_POOL_MAX` | 20 | Config | ❌ |
| `DATABASE_TIMEOUT` | 5000 | Config (ms) | ❌ |

**Getting PostgreSQL Connection String**:
```bash
# DO Dashboard → Databases → Select DB
# → Connection Details → Connection string (copy entire URL)
# Format: postgresql://user:password@host.ondigitalocean.com:25060/geoselect?sslmode=require
```

### Cache (Redis)

| Variable | Value Format | Source | Required |
|----------|--------------|--------|----------|
| `REDIS_URL` | redis://user:pass@host:port?ssl=true | DO Managed Redis | ✅ |
| `REDIS_TIMEOUT` | 5000 | Config (ms) | ❌ |
| `REDIS_RETRY_ATTEMPTS` | 3 | Config | ❌ |

**Getting Redis Connection String**:
```bash
# DO Dashboard → Databases → Select Redis
# → Connection Details → Connection string (copy entire URL)
# Format: redis://user:password@host.ondigitalocean.com:25061?ssl=true
```

### File Storage (DO Spaces)

| Variable | Value Format | Source | Required |
|----------|--------------|--------|----------|
| `DO_SPACES_KEY` | 20-char access key | DO Spaces API token | ✅ |
| `DO_SPACES_SECRET` | 40-char secret | DO Spaces API token | ✅ |
| `DO_SPACES_ENDPOINT` | https://region.digitaloceanspaces.com | DO Spaces bucket | ✅ |
| `DO_SPACES_BUCKET` | geoselect-{env} | DO Spaces bucket name | ✅ |
| `DO_SPACES_REGION` | nyc3, sfo3, ams3, sgp1 | DO Spaces region | ✅ |

**Getting Spaces Credentials**:
```bash
# DO Dashboard → Spaces → {bucket} → Settings
# → API Keys → Create New → Copy access key + secret
# Endpoint: https://nyc3.digitaloceanspaces.com (or your region)
```

### Email (SMTP)

| Variable | Value | Source | Required |
|----------|-------|--------|----------|
| `SMTP_HOST` | smtp.gmail.com | Gmail | ✅ |
| `SMTP_PORT` | 587 | Gmail | ✅ |
| `SMTP_USER` | your-email@gmail.com | Gmail account | ✅ |
| `SMTP_PASSWORD` | xxxx-xxxx-xxxx-xxxx | Gmail app password | ✅ |
| `SMTP_FROM` | noreply@geoselect.com | Your domain | ✅ |
| `SMTP_TLS` | true | Config | ❌ |

**Getting Gmail App Password**:
```bash
# 1. Google Account → Security → Enable 2-Factor Authentication
# 2. Security → App passwords → Select "Mail" and "Other (custom name)"
# 3. Create and copy 16-character password
# 4. Use in SMTP_PASSWORD (spaces are removed automatically)
```

### Frontend (Vercel/Next.js)

| Variable | Value | Example | Public | Required |
|----------|-------|---------|--------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | https://api.geoselect.com | ✅ | ✅ |
| `NEXT_PUBLIC_APP_NAME` | Display name | GeoSelect | ✅ | ❌ |
| `NEXT_PUBLIC_ENV` | Environment name | production | ✅ | ❌ |

**Setting Frontend Vars in Vercel**:
```bash
# Vercel Dashboard → Project Settings → Environment Variables
# Add "NEXT_PUBLIC_*" variables (automatically exposed to browser)
# Regular variables are only available during build
```

### Monitoring & Health

| Variable | Type | Example | Required |
|----------|------|---------|----------|
| `HEALTH_CHECK_DATABASE` | boolean | true | ❌ (default: true) |
| `HEALTH_CHECK_AUDIT` | boolean | true | ❌ (default: true) |
| `SENTRY_DSN` | URL | https://key@sentry.io/id | ❌ |

**Health Checks**:
```bash
# GET /api/health/live (always 200, no checks)
# GET /api/health/ready (203 if checks fail)
# GET /api/health (full system health report)

# Disable checks to reduce latency:
HEALTH_CHECK_DATABASE=false
HEALTH_CHECK_AUDIT=false
```

---

## How to Set Variables

### Local Development

Create `.env.local` in project root:
```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

Next.js auto-loads `.env.local` on startup.

### DO App Platform

1. **During app creation**:
   - Apps → Create App → Configure → Set Environment Variables

2. **After app creation**:
   - Apps → Your App → Settings → Environment
   - Add/edit variables
   - Click "Save"
   - Deployment restarts with new variables

3. **Using DO CLI**:
```bash
# Install DO CLI
brew install doctl

# Login
doctl auth init

# Update variable
doctl apps update <app-id> --spec app.yaml
```

### Vercel Frontend

1. **During import**:
   - New Project → Configure → Set Environment Variables

2. **After deployment**:
   - Project Settings → Environment Variables
   - Add variable → Select environment (preview/prod)
   - Save → Auto-triggers rebuild

3. **Using Vercel CLI**:
```bash
# Install
npm i -g vercel

# Login
vercel login

# Add variable
vercel env add NEXT_PUBLIC_API_URL
# Enter value: https://api.geoselect.com
```

### GitHub Secrets (for CI/CD)

Used in `.github/workflows/build-and-deploy.yml`:

```yaml
# Settings → Secrets → Actions
DIGITALOCEAN_API_TOKEN  # DO API token (for registry login + API)
DIGITALOCEAN_APP_ID     # Target app ID
BACKEND_URL             # For health check
```

---

## Validation

### Pre-Deployment Checklist

```bash
# 1. Verify DATABASE_URL format
psql "$DATABASE_URL" -c "SELECT now();"
# Should return: current timestamp

# 2. Verify REDIS_URL format
redis-cli -u "$REDIS_URL" PING
# Should return: PONG

# 3. Verify DO Spaces credentials
aws s3 ls "s3://$DO_SPACES_BUCKET" --endpoint-url "$DO_SPACES_ENDPOINT" \
  --access-key "$DO_SPACES_KEY" --secret-key "$DO_SPACES_SECRET"
# Should list bucket contents

# 4. Verify SMTP credentials
telnet $SMTP_HOST $SMTP_PORT
# Should connect (then quit with Ctrl+])

# 5. Test app startup
NODE_ENV=production PORT=8000 npm run start
# Should log "Server listening on port 8000"
```

### Common Issues

**Database Connection Fails**:
```bash
# Check URL format
echo $DATABASE_URL
# Should match: postgresql://user:pass@host:port/db?sslmode=require

# Check host is accessible
nc -zv geoselect.db.ondigitalocean.com 25060
# Should show "succeeded"
```

**Redis Connection Fails**:
```bash
# Check URL format
echo $REDIS_URL
# Should match: redis://user:pass@host:port?ssl=true

# Check host is accessible
nc -zv geoselect.redis.ondigitalocean.com 25061
# Should show "succeeded"
```

**Spaces Upload Fails**:
```bash
# Check credentials (remove leading/trailing spaces)
echo "${#DO_SPACES_KEY}"  # Should be 20
echo "${#DO_SPACES_SECRET}"  # Should be 40

# Test with AWS CLI
aws s3api head-bucket --bucket "$DO_SPACES_BUCKET" \
  --endpoint-url "$DO_SPACES_ENDPOINT" \
  --region "$DO_SPACES_REGION"
```

---

## Security Best Practices

### Development

- ✅ Use `.env.local` (in .gitignore, never commit)
- ✅ Use unique credentials for each environment
- ✅ Rotate credentials regularly
- ✅ Never log sensitive variables

### Staging/Production

- ✅ Use platform-managed secrets (Vercel, DO)
- ✅ Restrict access to dashboard
- ✅ Use short-lived tokens where possible
- ✅ Audit variable access (log all reads/writes)
- ✅ Enable 2FA on all accounts
- ✅ Use IAM roles instead of keys where possible

### Monitoring

```bash
# Check for hardcoded secrets in commits
git log --oneline -S 'postgresql://' --all
# Should return: (no results)

# Check for secrets in code
git grep -E 'DATABASE_URL|REDIS_URL|DO_SPACES_SECRET'
# Should only find .env.local and .env.example (in .gitignore)
```

---

## Migration Guide

### Local → Staging

```bash
# 1. Create staging resources (see DIGITALOCEAN_DEPLOYMENT_GUIDE.md)
# 2. Copy .env.local to temp location
cp .env.local .env.local.backup

# 3. Update .env.local with staging values
DATABASE_URL=postgresql://user:pass@geoselect-staging.db.ondigitalocean.com:25060/geoselect?sslmode=require
REDIS_URL=redis://user:pass@geoselect-staging.redis.ondigitalocean.com:25061?ssl=true

# 4. Test locally with staging infrastructure
npm run dev

# 5. Set same variables in DO App Platform
# DO Dashboard → Apps → Your App → Settings → Environment Variables
```

### Staging → Production

```bash
# 1. Create production resources
# 2. Update DO App Platform environment variables to prod values
# 3. Update Vercel environment variables
# 4. Test /api/health endpoint
# 5. Gradual traffic shift (if using load balancer)
```

---

## References

- [DO Managed PostgreSQL Docs](https://docs.digitalocean.com/products/databases/postgresql/)
- [DO Managed Redis Docs](https://docs.digitalocean.com/products/databases/redis/)
- [DO Spaces Docs](https://docs.digitalocean.com/products/spaces/)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Next.js .env Documentation](https://nextjs.org/docs/basic-features/environment-variables)

---

**Last Updated**: 2026-01-07  
**Status**: Production Ready  
**Owner**: DevOps/Platform Team
