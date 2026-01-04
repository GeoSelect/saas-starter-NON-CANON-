# Environment Configuration Guide

## Overview

GeoSelect uses separate Supabase projects for development and production to ensure data isolation and security.

## Environment Setup

### Development Environment

**File**: `.env.local` (local machine only, never commit)

```bash
# Supabase - Development Project
NEXT_PUBLIC_SUPABASE_URL=https://[DEV-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[DEV-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[DEV-SERVICE-ROLE-KEY]

# Database
POSTGRES_URL=postgresql://postgres:[PASSWORD]@db.[DEV-PROJECT-ID].supabase.co:5432/postgres

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_KEY=[YOUR-KEY]

# Feature flags
NODE_ENV=development
```

### Production Environment

**Deployment**: Use environment variables provided by your hosting platform (Vercel, Netlify, etc.)

```bash
# Supabase - Production Project (different from dev)
NEXT_PUBLIC_SUPABASE_URL=https://[PROD-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[PROD-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[PROD-SERVICE-ROLE-KEY]

# Database
POSTGRES_URL=postgresql://postgres:[PASSWORD]@db.[PROD-PROJECT-ID].supabase.co:5432/postgres

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_KEY=[YOUR-KEY]

# Feature flags
NODE_ENV=production
```

## Supabase Project Setup

### Creating Separate Projects

1. **Development Project**
   - Create new Supabase project: `geoselect-dev`
   - Use this for local development and testing
   - Data here is for testing only

2. **Production Project**
   - Create new Supabase project: `geoselect-prod`
   - Use this for live application
   - Enable backups and point-in-time recovery
   - Set up monitoring and alerts

### Getting Your Keys

1. Go to Supabase Dashboard
2. Select your project
3. Navigate to Settings → API
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### Getting Database URL

1. Go to Settings → Database
2. Copy the "URI" under "Connection pooling"
3. Add username/password and set as `POSTGRES_URL`

## Security Best Practices

### Service Role Key

⚠️ **CRITICAL**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client

- ✅ Used only in **server-only files**: `app/api/**`, server actions
- ✅ Imported from `@/lib/supabase/server.ts`
- ✅ Environment variables verified at build time
- ❌ Never imported in Client Components
- ❌ Never sent to browser or logged in client code

### Anon Key

- ✅ Safe to expose (marked as `NEXT_PUBLIC_`)
- Used for public queries and authentication
- Row Level Security (RLS) policies enforce access control

## Deployment Checklist

### Before Production Deployment

- [ ] Create separate production Supabase project
- [ ] Enable RLS policies on all tables
- [ ] Set up database backups
- [ ] Configure CORS for your domain
- [ ] Set environment variables in hosting platform
- [ ] Test database connection in production
- [ ] Verify service role key is not in browser DevTools
- [ ] Enable error tracking (Sentry, LogRocket, etc.)
- [ ] Set up monitoring alerts

### Vercel Deployment

1. Go to Project Settings → Environment Variables
2. Add variables for production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `POSTGRES_URL`
   - `NEXT_PUBLIC_GOOGLE_MAPS_KEY`

3. Deploy to production

### Netlify Deployment

1. Go to Site Settings → Build & Deploy → Environment
2. Add variables for production
3. Trigger redeploy

## Verification

### Verify Supabase Connection

```bash
npx tsx lib/db/seed-dev-data.ts
```

### Verify Service Role Key Security

1. Open DevTools → Application → Cookies
2. Look for `sb-` prefixed cookies (should not show service role)
3. Network → API calls should only use anon key

### Monitor Logs

```bash
# Watch application logs
tail -f ~/.local/share/geoselect/logs/app.log

# Or check hosting provider's logs
# Vercel: Deployments → Logs
# Netlify: Logs → Functions
```

## Troubleshooting

### Connection Issues

If database connection fails:

1. Verify `POSTGRES_URL` format:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   ```

2. Check password contains no special characters that need escaping

3. Verify IP whitelist (Supabase → Settings → Network)

### Key Rotation

To rotate keys safely:

1. Create new keys in Supabase dashboard
2. Update environment variables
3. Redeploy application
4. Delete old keys after confirming new ones work

## Monitoring & Observability

See [OBSERVABILITY.md](./OBSERVABILITY.md) for logs, error tracking, and metrics setup.
