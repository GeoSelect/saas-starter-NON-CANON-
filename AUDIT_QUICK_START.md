# 🚀 Quick Start - 30 Minute Deployment

## ⏱️ Timeline

```
5 min:  Read this file
5 min:  Run migration
10 min: Verify + test
5 min:  Schedule jobs
5 min:  Done! ✅
────────────────────
30 min: Total
```

## 📋 Pre-Deployment Checklist

- [ ] Database backup taken
- [ ] PostgreSQL 12+ confirmed
- [ ] Supabase or managed PostgreSQL
- [ ] Service role key available
- [ ] Team notified (no downtime, but adds logging overhead)

## 🔧 Step 1: Deploy Core Migration (5 min)

### Option A: Supabase CLI
```bash
# Make sure migrations are in supabase/migrations/
supabase migration up
# OR apply specific migration
supabase migration up 010_audit_trail_production
```

### Option B: Direct PostgreSQL
```bash
# Download migration file
wget https://raw.githubusercontent.com/your-repo/migrations/010_audit_trail_production.sql

# Or create it manually from:
# migrations/010_audit_trail_production.sql

# Apply migration
psql -U postgres -d your_database -f migrations/010_audit_trail_production.sql
```

### Option C: Supabase SQL Editor
1. Open Supabase dashboard
2. Go to SQL Editor
3. Create new query
4. Copy entire contents of `010_audit_trail_production.sql`
5. Click "RUN"
6. Wait for completion (2-5 min)

**Status**: ✅ Migration applied

## ✅ Step 2: Verify Migration (5 min)

Run these in your database:

```sql
-- Check 1: All tables created
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_name LIKE 'audit%';
-- Expected: 5

-- Check 2: All indexes created
SELECT COUNT(*) as index_count FROM pg_indexes 
WHERE tablename LIKE 'audit_events%';
-- Expected: 5+

-- Check 3: All triggers created
SELECT COUNT(*) as trigger_count FROM pg_trigger 
WHERE tgrelname = 'audit_events';
-- Expected: 2+

-- Check 4: Functions exist
SELECT COUNT(*) FROM pg_proc 
WHERE proname IN ('insert_audit_event', 'archive_old_audit_events', 'get_audit_trail');
-- Expected: 3

-- If all checks show correct numbers, continue to Step 3
```

**Status**: ✅ All tables/indexes/triggers/functions exist

## 🧪 Step 3: Test with Sample Data (5 min)

```sql
-- Create test audit event
SELECT insert_audit_event(
  p_action_type := 'DEPLOYMENT_TEST',
  p_resource_type := 'test',
  p_resource_id := '00000000-0000-0000-0000-000000000000'::uuid,
  p_workspace_id := '00000000-0000-0000-0000-000000000001'::uuid,
  p_created_by_user_id := '00000000-0000-0000-0000-000000000002'::uuid
) as event_id;
-- Result: Returns a UUID (success!)

-- Verify event was created
SELECT id, action_type, created_at FROM audit_events
WHERE action_type = 'DEPLOYMENT_TEST'
ORDER BY created_at DESC LIMIT 1;
-- Result: Shows your test event ✅

-- Verify immutability (should fail)
UPDATE audit_events SET action_type = 'HACKED' 
WHERE action_type = 'DEPLOYMENT_TEST';
-- Result: ERROR: Audit events are immutable ✅
```

**Status**: ✅ Core audit system working

## ⏰ Step 4: Schedule Archive Job (5 min)

This runs daily at 2 AM to move old events to archive.

### Option A: pg_cron (Recommended)
```bash
# Enable pg_cron extension
psql -c "CREATE EXTENSION IF NOT EXISTS pg_cron;"

# Schedule daily archival at 2 AM
psql -c "SELECT cron.schedule(
  'archive_old_audit_events',
  '0 2 * * *',
  'SELECT archive_old_audit_events()'
);"

# Schedule monthly partitions on 1st at 1 AM
psql -c "SELECT cron.schedule(
  'create_monthly_partitions',
  '0 1 1 * *',
  'SELECT create_monthly_audit_partition()'
);"

# Verify jobs scheduled
psql -c "SELECT jobname, schedule FROM cron.job;"
```

### Option B: Application Scheduler (Node.js/Python)

**Node.js with node-cron:**
```typescript
// apps/api/cron/audit-archive.ts
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Archive daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  const { data, error } = await supabase.rpc('archive_old_audit_events');
  if (error) console.error('Archive failed:', error);
  else console.log('✓ Archived', data[0].archived_count, 'events');
});

// Create partitions monthly on 1st at 1 AM
cron.schedule('0 1 1 * *', async () => {
  const { error } = await supabase.rpc('create_monthly_audit_partition');
  if (error) console.error('Partition failed:', error);
  else console.log('✓ Partitions created');
});
```

**Python with APScheduler:**
```python
# api/cron/audit_archive.py
from apscheduler.schedulers.background import BackgroundScheduler
from supabase import create_client

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
scheduler = BackgroundScheduler()

def archive_audit_events():
    result = supabase.rpc('archive_old_audit_events').execute()
    print(f"✓ Archived {result.data[0]['archived_count']} events")

def create_partitions():
    supabase.rpc('create_monthly_audit_partition').execute()
    print("✓ Partitions created")

# Archive daily at 2 AM
scheduler.add_job(archive_audit_events, 'cron', hour=2, minute=0)

# Partitions monthly on 1st at 1 AM
scheduler.add_job(create_partitions, 'cron', day=1, hour=1, minute=0)

scheduler.start()
```

**Status**: ✅ Archive and partition jobs scheduled

## 📊 Step 5: Quick Health Check (2 min)

```sql
-- Check audit table size
SELECT 
  COUNT(*) as event_count,
  MAX(created_at) as latest_event,
  MIN(created_at) as oldest_event
FROM audit_events;

-- Check partitions created
SELECT tablename FROM pg_tables 
WHERE tablename LIKE 'audit_events_%' 
ORDER BY tablename;
-- Should show: audit_events_2026_01, _02, _03 at minimum

-- Check retention policies
SELECT workspace_id, hot_retention_days, warm_archive_days 
FROM audit_retention_policies LIMIT 5;

-- Done! System is running
```

**Status**: ✅ Health check complete

---

## 🎉 You're Done! (30 min elapsed)

Your production audit system is now:
- ✅ Deployed and working
- ✅ Logging all workspace changes automatically
- ✅ Archiving old data daily
- ✅ Creating partitions monthly
- ✅ Ready for compliance queries

---

## 📖 Next Steps (When You Have Time)

### This Week
1. Read [AUDIT_QUICK_REFERENCE.md](AUDIT_QUICK_REFERENCE.md) for common queries
2. Deploy [workspace audit triggers](WORKSPACE_AUDIT_TRIGGERS.md) (optional, adds workspace change logging)
3. Monitor for 24 hours, watch for archive job at 2 AM

### Next Week
1. Build compliance UI in your app
2. Add audit trail page to account console
3. Train team on compliance procedures

### Next Month
1. Review retention policies for your workspaces
2. Monitor archive growth
3. Adjust retention if needed (longer for compliance mode)

---

## 🚨 Important Notes

### Archive Job

The `archive_old_audit_events()` function runs daily at 2 AM:
- Moves events older than 90 days (configurable) to `audit_events_archive`
- Soft-deletes from hot storage
- Logs the archival itself
- Will never delete if compliance mode is ON for workspace

### Partition Job

The `create_monthly_audit_partition()` function runs on 1st of month at 1 AM:
- Creates next month's partition automatically
- Prevents table from growing unbounded
- Can handle 100M+ events

### Compliance Mode

If your workspace handles sensitive data (HIPAA, SOC2, PCI-DSS):
```sql
UPDATE audit_retention_policies
SET is_compliance_mode = TRUE, compliance_reason = 'HIPAA'
WHERE workspace_id = 'your-workspace-id'::uuid;
-- Now: Never auto-delete, keep forever
```

---

## 🔍 Quick Queries

### View Recent Audit Events
```sql
SELECT id, created_at, action_type, created_by_user_id
FROM audit_events
WHERE workspace_id = 'ws-123'::uuid
ORDER BY created_at DESC
LIMIT 20;
```

### View Archive Statistics
```sql
SELECT 
  COUNT(*) as archived_count,
  MAX(archived_at) as most_recent_archive
FROM audit_events_archive;
```

### View Compliance Deletions
```sql
SELECT deleted_at, created_by_user_id, deletion_reason
FROM audit_deletion_log
WHERE deletion_authority IN ('GDPR', 'CCPA')
ORDER BY deleted_at DESC
LIMIT 10;
```

---

## ⚠️ If Something Goes Wrong

### Archive Job Failed
```sql
-- Check job status
SELECT * FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'archive_old_audit_events'
)
ORDER BY start_time DESC LIMIT 1;

-- Try manually
SELECT archive_old_audit_events();
```

### Constraint Violations
```sql
-- Check what constraint failed
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'audit_events'
LIMIT 10;

-- Verify your data
SELECT * FROM audit_events 
WHERE created_at > NOW() 
LIMIT 1;
-- Should be empty (can't log future events)
```

### Partitions Missing
```sql
-- Create missing partitions
SELECT create_monthly_audit_partition();

-- Verify
SELECT tablename FROM pg_tables 
WHERE tablename LIKE 'audit_events_%';
```

---

## 📚 Full Documentation

This is just the quick start. For complete information:

- **Full Implementation**: [AUDIT_IMPLEMENTATION_GUIDE.md](AUDIT_IMPLEMENTATION_GUIDE.md)
- **Trigger Deployment**: [WORKSPACE_AUDIT_TRIGGERS.md](WORKSPACE_AUDIT_TRIGGERS.md)
- **Detailed Checklist**: [AUDIT_DEPLOYMENT_CHECKLIST.md](AUDIT_DEPLOYMENT_CHECKLIST.md)
- **Quick Reference**: [AUDIT_QUICK_REFERENCE.md](AUDIT_QUICK_REFERENCE.md)
- **Complete Overview**: [AUDIT_SYSTEM_COMPLETE.md](AUDIT_SYSTEM_COMPLETE.md)

---

## ✅ Success Criteria

After 30 minutes, you should have:

- ✅ 5 audit tables created
- ✅ 5+ indexes for performance
- ✅ 2+ triggers active
- ✅ Test audit event logged
- ✅ Archive job scheduled (runs daily at 2 AM)
- ✅ Partition job scheduled (runs monthly on 1st)
- ✅ No errors in database logs

If you have all checkmarks, congratulations! Your production audit system is live! 🎉

---

## 🆘 Still Need Help?

1. Read [AUDIT_QUICK_REFERENCE.md](AUDIT_QUICK_REFERENCE.md) troubleshooting map
2. Check [AUDIT_DEPLOYMENT_CHECKLIST.md](AUDIT_DEPLOYMENT_CHECKLIST.md) Phase details
3. Review SQL comments in `010_audit_trail_production.sql` for function details

---

**Status**: Ready for Production ✅  
**Deployment Time**: 30 minutes  
**Downtime**: 0 minutes  
**Support**: See documentation files above

Good luck! 🚀
