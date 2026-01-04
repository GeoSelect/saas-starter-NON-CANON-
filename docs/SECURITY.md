# Security Checklist

## Service-Role Key Protection

The `SUPABASE_SERVICE_ROLE_KEY` is a powerful credential that must be protected. Use this checklist to ensure it's properly secured.

### ✅ Pre-Deployment Audit

#### 1. Environment Variables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local` (local dev only)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is in deployment platform secrets (not .env files)
- [ ] No service-role key exists in `next.env.d.ts` or `package.json`
- [ ] `.env.local` is in `.gitignore`
- [ ] No service-role key in git history: `git log -S "SUPABASE_SERVICE_ROLE_KEY"`

#### 2. Client-Side Code
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` imported in components/
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in browser bundles
  ```bash
  # Verify it's not in production build
  grep -r "SUPABASE_SERVICE_ROLE_KEY" .next/
  # Should return nothing
  ```

#### 3. Server-Only Paths
Service-role key should **only** be used in:

- [x] `lib/supabase/admin.ts` - Admin client initialization
- [x] `app/api/**` routes - API endpoints (server-side)
- [x] `app/(dashboard)/reports/actions.ts` - Server actions
- [ ] Other: _____________________

#### 4. Code Review Checklist

```bash
# Find all uses of admin client
grep -r "createClient.*service" --include="*.ts" --include="*.tsx"

# Find all uses of service-role key
grep -r "service.role\|ROLE_KEY\|supabaseAdmin" --include="*.ts" --include="*.tsx"
```

**Files that should have admin client:**
- lib/supabase/admin.ts ✓
- app/api/reports/route.ts ✓
- app/(dashboard)/reports/actions.ts ✓
- lib/db/route.ts ✓ (migrations)

**Files that should NOT have admin client:**
- components/**.tsx (never)
- app/(login)/actions.ts (use public auth only)
- lib/supabase/client.ts (public client only)

### ✅ Deployment Configuration

#### Vercel
```bash
# Add environment variable in Vercel dashboard
# Project Settings → Environment Variables
# Name: SUPABASE_SERVICE_ROLE_KEY
# Value: [actual key from Supabase]
# Environments: Production, Preview
```

- [ ] Added to Production environment
- [ ] Added to Preview environment (optional, for testing)
- [ ] NOT in git repository
- [ ] Redeploy after adding secret

#### Netlify
```bash
# Add in Site Settings → Build & Deploy → Environment
# Or in netlify.toml:
# [build.environment]
#   SUPABASE_SERVICE_ROLE_KEY = ""
```

- [ ] Added to environment variables
- [ ] NOT in netlify.toml in git
- [ ] Using .env.production file (gitignored)

#### Self-Hosted
- [ ] Key stored in secure .env file
- [ ] .env file has restricted permissions (600)
- [ ] Backed up in secure location
- [ ] Rotation plan documented

### ✅ Monitoring & Alerts

#### Log Auditing
- [ ] Logs don't contain service-role key
- [ ] Check: `grep "SUPABASE_SERVICE_ROLE_KEY\|Bearer.*super" logs/`
- [ ] Should be empty

#### Access Logs
Monitor Supabase dashboard for:
- [ ] Unexpected API calls from unfamiliar IPs
- [ ] Large data exports
- [ ] Failed authentication attempts
- [ ] Unusual query patterns

#### Metrics to Monitor
```sql
-- Check recent API calls (in Supabase dashboard)
-- Settings → API Audit Logs
-- Filter by: service-role key use
```

### ✅ Incident Response

#### If Key is Compromised

1. **Immediate** (within 1 hour)
   - [ ] Regenerate key in Supabase dashboard
   - [ ] Update environment variables in all deployment platforms
   - [ ] Restart all running services

2. **Short-term** (within 24 hours)
   - [ ] Review API audit logs for unauthorized access
   - [ ] Check database for unexpected changes
   - [ ] Notify team members

3. **Long-term** (within 1 week)
   - [ ] Document incident and timeline
   - [ ] Review code for other potential vulnerabilities
   - [ ] Implement additional monitoring

#### Contacts
- Supabase support: support@supabase.io
- Security team: security@[yourcompany].com
- Emergency: [emergency contact]

### ✅ Regular Maintenance

#### Weekly
- [ ] Check monitoring dashboard for anomalies
- [ ] Review error logs for auth failures
- [ ] Verify no key exposure in code

#### Monthly
- [ ] Rotate keys if policy requires
- [ ] Review access logs
- [ ] Update security documentation

#### Quarterly
- [ ] Security audit of all protected paths
- [ ] Team training on security best practices
- [ ] Disaster recovery drill

## Row-Level Security (RLS) Policy Status

RLS ensures users can only access their own data, even with service-role key.

### Current RLS Policies

#### users table
- [ ] Policy: Select own user record
  ```sql
  (auth.uid() = id)
  ```
- [ ] Policy: Admin can select all
  ```sql
  (auth.role() = 'service_role')
  ```

#### teams table
- [ ] Policy: Select team if member
  ```sql
  (EXISTS (SELECT 1 FROM team_members WHERE team_id = id AND user_id = auth.uid()))
  ```

#### reports table
- [ ] Policy: Select reports for own team
  ```sql
  (EXISTS (SELECT 1 FROM team_members WHERE team_id = team_id AND user_id = auth.uid()))
  ```

### Implementing RLS

1. Enable RLS on sensitive tables
2. Test that public client is blocked from bypassing
3. Verify service-role can still access as admin
4. Document which tables need RLS

## Best Practices Summary

✅ **DO:**
- [ ] Store in environment variables
- [ ] Rotate annually or if compromised
- [ ] Use only in server-side code
- [ ] Log access attempts
- [ ] Enable RLS on database tables
- [ ] Monitor for unauthorized access
- [ ] Document who has access

❌ **DON'T:**
- [ ] Commit to git repository
- [ ] Share via Slack or email
- [ ] Use in client-side code
- [ ] Store in comments
- [ ] Log the actual key value
- [ ] Use same key for dev and prod
- [ ] Share with external contractors

## Verifying Protection

Run this checklist locally before deploying:

```bash
# 1. Check no key in git
git grep SUPABASE_SERVICE_ROLE_KEY || echo "✓ Key not in git"

# 2. Check .env.local is gitignored
grep ".env.local" .gitignore && echo "✓ .env.local is gitignored"

# 3. Check no key in build output
grep -r "SUPABASE_SERVICE_ROLE_KEY" .next/ 2>/dev/null && echo "✗ Key in build!" || echo "✓ Key not in build"

# 4. Check admin client usage
grep -r "admin\|service.role" app/ lib/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | wc -l

# Should be small number (4-5 files max)
```

## Sign-Off

- [ ] Security lead reviewed this checklist
- [ ] All items verified before production deploy
- [ ] Team trained on security practices
- [ ] Incident response plan documented

**Date Completed:** __________  
**Reviewed By:** __________  
**Next Review Date:** __________
