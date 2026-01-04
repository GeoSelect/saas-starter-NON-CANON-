# Production Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

### 1. Environment Configuration
- [ ] Created separate Supabase production project
- [ ] Updated `NEXT_PUBLIC_SUPABASE_URL` for production
- [ ] Updated `NEXT_PUBLIC_SUPABASE_ANON_KEY` for production
- [ ] Updated `SUPABASE_SERVICE_ROLE_KEY` for production (never commit!)
- [ ] All environment variables set in deployment platform
- [ ] Verified `.env.local` is gitignored
- [ ] No secrets in git repository

### 2. Security Audit
- [ ] Completed [SECURITY.md](./SECURITY.md) checklist
- [ ] Service-role key only used in server-only code
- [ ] No service-role key in browser bundles (`grep -r SUPABASE_SERVICE_ROLE_KEY .next/`)
- [ ] Row-Level Security (RLS) policies enabled on sensitive tables
- [ ] Database migrations run successfully
- [ ] Test user cannot access other users' data

### 3. Database Setup
- [ ] Production database provisioned
- [ ] Migrations run: `npm run db:push`
- [ ] Seed data created (if needed): `npm run db:seed`
- [ ] Connection pool limits configured
- [ ] Backup strategy in place

### 4. Observability
- [ ] Logger verified working locally
- [ ] Error boundaries tested (throw test error)
- [ ] Critical operations instrumented:
  - [ ] Report creation
  - [ ] Report listing
  - [ ] User authentication
- [ ] Production monitoring service configured (optional):
  - [ ] Sentry DSN set
  - [ ] Log aggregation enabled

### 5. Testing
- [ ] All unit tests passing: `npm test`
- [ ] Manual testing of key features:
  - [ ] User sign-up and login
  - [ ] Report creation
  - [ ] Report listing
  - [ ] Error handling
- [ ] Browser console has no critical errors
- [ ] No hydration warnings
- [ ] Mobile responsive testing completed

## Deployment Steps

### Option A: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Link project
   vercel link
   ```

2. **Set Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     SUPABASE_SERVICE_ROLE_KEY (Production only!)
     DATABASE_URL
     STRIPE_SECRET_KEY
     STRIPE_WEBHOOK_SECRET
     ```

3. **Deploy**
   ```bash
   # Preview deployment
   vercel
   
   # Production deployment
   vercel --prod
   ```

4. **Verification**
   - [ ] Visit production URL
   - [ ] Test sign-up flow
   - [ ] Create test report
   - [ ] Check logs: Vercel Dashboard → Logs

### Option B: Netlify

1. **Connect Repository**
   - Go to Netlify Dashboard → Add new site → Import from Git
   - Select repository
   - Configure build settings:
     ```
     Build command: npm run build
     Publish directory: .next
     ```

2. **Set Environment Variables**
   - Site Settings → Build & Deploy → Environment
   - Add all variables from `.env.local`

3. **Deploy**
   - Push to `main` branch
   - Or click "Trigger deploy" in Netlify dashboard

4. **Verification**
   - [ ] Visit production URL
   - [ ] Test key features
   - [ ] Check function logs

### Option C: Self-Hosted

1. **Server Setup**
   ```bash
   # On production server
   git clone <repo>
   cd geoselect
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Create production .env file
   cp .env.example .env
   nano .env
   # Add production values
   ```

3. **Build & Start**
   ```bash
   npm run build
   npm start
   ```

4. **Process Management**
   ```bash
   # Use PM2 for production
   npm install -g pm2
   pm2 start npm --name "geoselect" -- start
   pm2 save
   pm2 startup
   ```

## Post-Deployment

### Immediate (Within 1 Hour)
- [ ] Smoke test all critical features
- [ ] Check application logs for errors
- [ ] Verify database connections working
- [ ] Test authentication flow
- [ ] Monitor error rates

### Short-Term (Within 24 Hours)
- [ ] Review production logs for patterns
- [ ] Check performance metrics
- [ ] Verify monitoring alerts working
- [ ] Test error reporting (throw test error)
- [ ] Document any deployment issues

### Long-Term (Within 1 Week)
- [ ] Set up monitoring dashboards
- [ ] Configure alert thresholds
- [ ] Schedule first backup verification
- [ ] Plan first rotation of credentials
- [ ] Team training on production access

## Monitoring & Alerts

### Metrics to Track
- Error rate (target: < 1%)
- Response times (target: < 500ms for reports)
- Report creation success rate (target: > 99%)
- Authentication failures
- Database connection errors

### Alert Rules (Example - Sentry)
```javascript
// sentry.config.ts
export const config = {
  // Alert if error rate > 5% in 5 minutes
  rules: [
    {
      conditions: [
        { name: 'event.type', value: 'error' },
        { name: 'event.count', value: '> 10', interval: '5m' }
      ],
      actions: [
        { type: 'email', targetType: 'team' }
      ]
    }
  ]
};
```

### Log Queries

**Find Recent Errors:**
```bash
# In Vercel
vercel logs --filter "ERROR" --since 1h

# In Netlify
netlify logs --filter "ERROR"
```

**Track Operation Performance:**
```bash
grep "duration" logs/ | grep "report_created" | awk '{print $NF}'
```

## Rollback Plan

### If Deployment Fails

1. **Immediate Rollback**
   - Vercel: Dashboard → Deployments → Previous → Promote to Production
   - Netlify: Site Settings → Deploys → Previous → Publish deploy
   - Self-hosted: `git reset --hard <previous-commit>`

2. **Identify Issue**
   - Check deployment logs
   - Review recent code changes
   - Test locally with production config

3. **Fix & Redeploy**
   - Create hotfix branch
   - Fix issue
   - Test thoroughly
   - Deploy to staging first
   - Deploy to production

## Documentation

- [ ] Update [README.md](../README.md) with production URL
- [ ] Document deployment process for team
- [ ] Create runbook for common issues
- [ ] Update [ENVIRONMENT.md](./ENVIRONMENT.md) with actual config
- [ ] Share credentials with authorized team members (securely)

## Compliance & Legal

- [ ] Privacy policy updated
- [ ] Terms of service reviewed
- [ ] GDPR compliance verified (if applicable)
- [ ] Data retention policy documented
- [ ] User data deletion process tested

## Stakeholder Communication

- [ ] Product team notified of deployment
- [ ] Support team briefed on new features
- [ ] Users notified (if breaking changes)
- [ ] Changelog published

## Sign-Off

**Deployed By:** _______________  
**Date:** _______________  
**Production URL:** _______________  
**Deployment Platform:** _______________  
**Database:** _______________  

**Approved By:** _______________  
**Date:** _______________  

---

## Quick Reference

### Production URLs
- Application: https://_______________
- Supabase Dashboard: https://app.supabase.com/project/_______
- Deployment Platform: https://_______________

### Emergency Contacts
- On-Call Engineer: _______________
- Database Admin: _______________
- DevOps Lead: _______________
- Support Email: support@_______________

### Key Commands
```bash
# View logs
vercel logs --prod

# Rollback
vercel rollback

# Database migration
npm run db:push

# Check build
npm run build
```
