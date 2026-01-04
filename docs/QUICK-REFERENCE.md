# Quick Reference: Production Config

## 🔑 Environment Variables

### Development (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # Safe to expose
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   # Server-only, NEVER commit
```

### Production (Vercel/Netlify Secrets)
```bash
# Same keys but from PRODUCTION Supabase project
# Set in deployment platform dashboard only
```

---

## 📝 Using the Logger

```typescript
import { logger } from '@/lib/observability/logger';

// Info: Important events
logger.info('user_action', { userId: 1, action: 'created_report' });

// Error: With full context
logger.error('operation_failed', error, { 
  userId: 1, 
  operation: 'report-creation' 
});

// Debug: Development only
logger.debug('query_details', { sql: 'SELECT...' });
```

---

## ⚠️ Security Rules

### ✅ DO
- Use service-role key in `app/api/` routes
- Use service-role key in server actions
- Store in environment variables
- Rotate annually or if compromised

### ❌ NEVER
- Import in `components/` (client-side)
- Commit to git
- Share via Slack/email
- Log the actual key value
- Use same key for dev and prod

---

## 🚨 Pre-Deploy Checklist

```bash
# 1. No key in git
git grep SUPABASE_SERVICE_ROLE_KEY
# Should only show .env and docs/

# 2. Build test
npm run build
grep -r "SUPABASE_SERVICE_ROLE_KEY" .next/
# Should be empty

# 3. Security audit
# Complete docs/SECURITY.md checklist

# 4. Test locally
npm start
# Visit app, create report, check logs
```

---

## 📊 Monitoring

### View Logs (Development)
Browser console shows structured JSON:
```json
{
  "timestamp": "2026-01-04T12:00:00Z",
  "level": "info",
  "operation": "report_created",
  "userId": 5,
  "teamId": 1,
  "reportId": "abc123",
  "duration": 234
}
```

### View Logs (Production)
- **Vercel**: Dashboard → Deployments → [Select] → Logs
- **Netlify**: Site Settings → Logs

### Find Errors
```bash
# Vercel CLI
vercel logs --filter "ERROR" --since 1h

# Grep local logs
grep '"level":"error"' logs/ | tail -20
```

---

## 🐛 Debugging Reports

### Track Report Creation
```bash
# Find all logs for user 5
grep '"userId":5' logs/

# Find specific report lifecycle
grep '"reportId":"abc123"' logs/

# Find slow operations (>1s)
grep -E '"duration":[0-9]{4,}' logs/
```

### Common Issues

**"Foreign key constraint violation"**
- User doesn't exist in database
- Auto-sync should create user from Supabase auth
- Check `lib/auth/session.ts` - `getUser()` function

**"Unauthorized" errors**
- Check user is logged in
- Check team membership exists
- Verify RLS policies (if enabled)

**Reports not loading**
- Check `/api/reports` endpoint
- Check `GET /api/team` returns valid team
- Look for `reports_list_failed` in logs

---

## 📚 Full Documentation

- [ENVIRONMENT.md](./ENVIRONMENT.md) - Environment setup
- [SECURITY.md](./SECURITY.md) - Security checklist
- [OBSERVABILITY.md](./OBSERVABILITY.md) - Logging guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy checklist
- [PRODUCTION-READY.md](./PRODUCTION-READY.md) - Complete summary

---

## 🚀 Deploy Commands

### Vercel
```bash
vercel               # Preview
vercel --prod       # Production
vercel logs --prod  # View logs
vercel rollback     # Rollback
```

### Netlify
```bash
netlify deploy          # Preview
netlify deploy --prod   # Production
netlify logs            # View logs
```

---

## 🆘 Emergency Contacts

**Service-role key compromised:**
1. Regenerate immediately in Supabase dashboard
2. Update environment variables in deployment platform
3. Restart all services
4. Review audit logs for unauthorized access

**Production down:**
1. Check deployment logs
2. Rollback to previous deployment
3. Notify team
4. Debug in staging environment

---

**Last Updated:** 2026-01-04  
**Version:** 1.0
