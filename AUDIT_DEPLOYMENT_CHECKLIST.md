# Audit System Deployment Checklist

## Pre-Deployment

### ✓ Prerequisites
- [ ] PostgreSQL 12+ with CREATE TABLE PARTITION support
- [ ] Supabase or managed PostgreSQL (for RLS policies)
- [ ] Database backup taken
- [ ] Deployment window scheduled (off-peak preferred)
- [ ] Team notified of changes

### ✓ Environment Setup
- [ ] Staging environment matches production
- [ ] Service role key available (for RPC calls)
- [ ] Application can make RPC calls to Supabase
- [ ] Node cron or scheduler available (for archive jobs)

---

## Phase 1: Foundation (Layer 1)

### Step 1: Deploy Core Migration

```bash
# Backup database first
pg_dump -h localhost -U postgres -d your_db > backup_$(date +%Y%m%d).sql

# Deploy migration
supabase migration up
# OR
psql -U postgres -d your_db -f migrations/010_audit_trail_production.sql
```

**Verify:**
```sql
-- Check all tables created
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name LIKE 'audit%';
-- Should return: 5 (audit_events, audit_events_archive, audit_deletion_log, 
--                   audit_retention_policies, audit_event_sequence)

-- Check indexes
SELECT COUNT(*) FROM pg_indexes 
WHERE tablename LIKE 'audit_events%';
-- Should return: 5+ indexes

-- Check triggers
SELECT COUNT(*) FROM pg_trigger 
WHERE tgrelname = 'audit_events';
-- Should return: 2 (prevent_audit_modifications, check_audit_sequence_order)
```

**Estimated Time**: 2-5 minutes  
**Risk Level**: ⚠️ Medium (modifies DB schema)  
**Rollback Plan**: `supabase migration down` (if migration system supported)

---

## Phase 2: Constraints (Layer 2)

### Step 2: Verify All Constraints Applied

```bash
# Query to verify (run in database)
psql -c "
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'audit_events'
ORDER BY constraint_name;
"
```

**Expected Output:**
```
 check_action_type_not_empty
 check_created_at_not_future
 check_created_by_user_id_not_null
 check_new_values_not_empty
 check_old_values_not_empty
 check_resource_type_not_empty
 check_workspace_id_not_null
```

**Test Constraints:**
```bash
# Run constraint tests
psql -f test_audit_constraints.sql
```

**Estimated Time**: 5 minutes  
**Risk Level**: ✅ Low (read-only verification)  
**Rollback Plan**: All constraints are in migration; rollback via Phase 1 reversal

---

## Phase 3: Archive Strategy (Layer 3)

### Step 3: Configure Retention Policies

```bash
# For each workspace, set retention policy
psql -c "
UPDATE audit_retention_policies
SET hot_retention_days = 90, warm_archive_days = 365
WHERE workspace_id = 'your-workspace-id'::uuid;
"
```

**Verify:**
```sql
SELECT workspace_id, hot_retention_days, warm_archive_days, is_compliance_mode
FROM audit_retention_policies;
```

### Step 4: Schedule Archive Job

**Option A: pg_cron (Preferred for Supabase)**

```bash
psql -c "
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('archive_old_audit_events', 
  '0 2 * * *', 
  'SELECT archive_old_audit_events()'
);
"
```

**Verify:**
```sql
SELECT * FROM cron.job WHERE jobname = 'archive_old_audit_events';
-- Should show job scheduled
```

**Option B: Application Scheduler**

Add to your scheduler (e.g., `api/cron/archive-audit.ts`):

```typescript
// Schedule at 2 AM daily
cron.schedule('0 2 * * *', async () => {
  const { data, error } = await supabase.rpc('archive_old_audit_events');
  if (error) console.error('Archive failed:', error);
  else console.log(`Archived ${data[0].archived_count} events`);
});
```

**Estimated Time**: 5-10 minutes  
**Risk Level**: ⚠️ Medium (enables automated data deletion)  
**Rollback Plan**: Delete cron job or disable scheduler; data remains in cold storage

---

## Phase 4: Partitioning (Layer 4)

### Step 5: Create Initial Partitions

```bash
psql -c "
SELECT create_monthly_audit_partition();
"
```

**Verify Partitions Created:**
```bash
psql -c "
SELECT tablename FROM pg_tables 
WHERE tablename LIKE 'audit_events_%'
ORDER BY tablename;
"
```

**Expected Output:**
```
 audit_events_2026_01
 audit_events_2026_02
 audit_events_2026_03
 audit_events_archive_2026_01
 audit_events_archive_2026_02
 audit_events_archive_2026_03
```

### Step 6: Schedule Monthly Partition Creation

```bash
# Option A: pg_cron
psql -c "
SELECT cron.schedule('create_monthly_partitions',
  '0 1 1 * *', -- First of month at 1 AM
  'SELECT create_monthly_audit_partition()'
);
"

# Option B: Application scheduler
cron.schedule('0 1 1 * *', async () => {
  const { error } = await supabase.rpc('create_monthly_audit_partition');
  if (error) console.error('Partition creation failed:', error);
});
```

**Estimated Time**: 2-5 minutes  
**Risk Level**: ✅ Low (creates new tables)  
**Rollback Plan**: Delete unused partitions; query still works

---

## Phase 5: Compliance & Deletion (Layer 5)

### Step 7: Verify Deletion Log Infrastructure

```bash
psql -c "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name IN ('audit_deletion_log', 'audit_event_sequence');
-- Should return: 2
"
```

**Test Deletion Function:**
```sql
-- Create test user audit event
INSERT INTO audit_events (
  created_by_user_id, action_type, resource_type, resource_id, workspace_id
) VALUES (
  'test-user-delete'::uuid, 'TEST', 'test', 
  gen_random_uuid(), 'ws-test'::uuid
) RETURNING id;

-- Call GDPR deletion
SELECT delete_user_audit_events_compliant(
  'test-user-delete'::uuid,
  'ws-test'::uuid,
  'GDPR',
  'TEST-TICKET'::uuid
);

-- Verify deletion logged
SELECT * FROM audit_deletion_log 
WHERE deletion_authority = 'GDPR'
ORDER BY deleted_at DESC LIMIT 1;
```

**Estimated Time**: 5 minutes  
**Risk Level**: ⚠️ High (irreversible deletions)  
**Rollback Plan**: Restore from database backup before this phase

---

## Phase 6: Workspace Triggers

### Step 8: Deploy Workspace Audit Triggers

```bash
# Create triggers for automatic audit logging
supabase migration up
# OR
psql -f migrations/011_workspace_audit_triggers.sql
```

**Verify All Triggers Created:**
```bash
psql -c "
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table IN ('workspaces', 'users_workspaces')
ORDER BY trigger_name;
"
```

**Expected Output:**
```
 user_workspace_added_audit
 user_workspace_removed_audit
 user_workspace_role_changed_audit
 workspace_created_audit
 workspace_deleted_audit
 workspace_updated_audit
```

**Test Triggers:**
```bash
# Create test workspace (should auto-log)
psql -c "
INSERT INTO workspaces (owner_id, name, plan)
VALUES ('test-owner'::uuid, 'Test WS', 'starter')
RETURNING id;
"

# Verify audit event created
psql -c "
SELECT id, action_type, resource_id FROM audit_events
WHERE action_type = 'CREATE_WORKSPACE'
ORDER BY created_at DESC LIMIT 1;
"
```

**Estimated Time**: 5-10 minutes  
**Risk Level**: ⚠️ Medium (adds logging overhead)  
**Rollback Plan**: Disable triggers individually: `ALTER TABLE workspaces DISABLE TRIGGER workspace_created_audit;`

---

## Phase 7: Application Integration

### Step 9: Deploy Audit Client Helper

```typescript
// Create: apps/web/src/lib/audit/audit-client.ts
// (See AUDIT_IMPLEMENTATION_GUIDE.md > Step 1.3)
```

**Verify:**
```bash
# Test import
npx ts-node -c apps/web/tsconfig.json -e "
import { logAuditEvent } from '@/lib/audit/audit-client';
console.log('✓ Audit client imported successfully');
"
```

### Step 10: Test Audit Logging in App

```typescript
// Test in any route
import { logAuditEvent } from '@/lib/audit/audit-client';

export async function POST(request: Request) {
  const eventId = await logAuditEvent({
    actionType: 'DEPLOYMENT_TEST',
    resourceType: 'system',
    resourceId: 'test-123',
    workspaceId: 'ws-test',
    createdByUserId: 'user-test'
  });
  
  console.log('✓ Audit event created:', eventId);
  return { success: true, eventId };
}
```

**Verify in Database:**
```sql
SELECT * FROM audit_events
WHERE action_type = 'DEPLOYMENT_TEST'
ORDER BY created_at DESC LIMIT 1;
```

**Estimated Time**: 10 minutes  
**Risk Level**: ✅ Low (app-level only)  
**Rollback Plan**: Simply remove event logging code

---

## Phase 8: Monitoring & Alerts

### Step 11: Setup Monitoring

```sql
-- Create monitoring view (if not present)
CREATE OR REPLACE VIEW vw_audit_health AS
SELECT 
  'audit_events' as table_name,
  COUNT(*) as row_count,
  MAX(created_at) as last_event
FROM audit_events
UNION ALL
SELECT 
  'audit_events_archive',
  COUNT(*),
  MAX(created_at)
FROM audit_events_archive
UNION ALL
SELECT 
  'audit_deletion_log',
  COUNT(*),
  MAX(deleted_at)
FROM audit_deletion_log;
```

**Monitor Daily:**
```bash
# Health check
psql -c "
SELECT * FROM vw_audit_health;

-- Also check archive job
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'archive_old_audit_events')
ORDER BY start_time DESC LIMIT 1;
"
```

### Step 12: Setup Alerts

```bash
# Alert if archive job fails
# Alert if partition creation fails
# Alert if constraints violated (query blocked)
# Alert if table growth exceeds threshold

# Example with Datadog/New Relic/Sentry:
```

**Estimated Time**: 20 minutes  
**Risk Level**: ✅ Low (read-only monitoring)  
**Rollback Plan**: Remove alerting rules

---

## Phase 9: Documentation & Training

### Step 13: Update Documentation

- [ ] Update team runbook
- [ ] Document retention policies for each workspace
- [ ] Create GDPR deletion request template
- [ ] Document audit trail access procedures
- [ ] Add compliance training for admins

### Step 14: Train Team

- [ ] Demo: How to view audit trail
- [ ] Demo: How to request GDPR deletion
- [ ] Demo: How to restore archived events
- [ ] Q&A: Compliance questions

**Estimated Time**: 30 minutes  
**Risk Level**: ✅ Low (process only)  
**Rollback Plan**: Distribute previous documentation

---

## Full Deployment Timeline

```
Phase 1: Foundation           5 min  ██
Phase 2: Constraints          5 min  ██
Phase 3: Archive             10 min  ████
Phase 4: Partitioning         5 min  ██
Phase 5: Compliance           5 min  ██
Phase 6: Triggers            10 min  ████
Phase 7: App Integration     10 min  ████
Phase 8: Monitoring          20 min  ████████
Phase 9: Documentation       30 min  ████████████
────────────────────────────────────────
Total:                       100 min (1.5 hours)
```

---

## Rollback Procedure (if needed)

### Quick Rollback (Keep data)

```sql
-- Disable all triggers
ALTER TABLE audit_events DISABLE TRIGGER ALL;
ALTER TABLE workspaces DISABLE TRIGGER ALL;
ALTER TABLE users_workspaces DISABLE TRIGGER ALL;

-- Disable cron jobs
SELECT cron.unschedule('archive_old_audit_events');
SELECT cron.unschedule('create_monthly_partitions');

-- App continues but doesn't log new events
```

### Full Rollback (Remove all)

```bash
# Backup current audit data (important!)
pg_dump -t "audit_*" -t "audit_*_archive" > audit_backup.sql

# Drop all audit infrastructure
supabase migration down
# OR
psql -c "
DROP TABLE IF EXISTS audit_deletion_log CASCADE;
DROP TABLE IF EXISTS audit_events_archive CASCADE;
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS audit_retention_policies CASCADE;
DROP TABLE IF EXISTS audit_event_sequence CASCADE;
DROP TABLE IF EXISTS partition_schedule CASCADE;
DROP TABLE IF EXISTS cron_jobs CASCADE;
DROP FUNCTION IF EXISTS archive_old_audit_events() CASCADE;
DROP FUNCTION IF EXISTS create_monthly_audit_partition() CASCADE;
DROP FUNCTION IF EXISTS log_audit_event() CASCADE;
-- ... etc for all functions
"
```

---

## Post-Deployment Validation

### Day 1 (After Deploy)

- [ ] All tables exist with correct schema
- [ ] Constraints preventing invalid data
- [ ] Triggers firing on workspace changes
- [ ] Archive job scheduled and working
- [ ] Partition creation scheduled
- [ ] Application can log events
- [ ] No errors in application logs

### Week 1

- [ ] Archive ran successfully (at 2 AM)
- [ ] Audit trail queries performing well (<100ms)
- [ ] No orphaned partitions
- [ ] Retention policies applied correctly
- [ ] Team familiar with audit trail

### Month 1

- [ ] Archive job running consistently
- [ ] Partitions created on schedule
- [ ] Database size stable (or growing as expected)
- [ ] Compliance team trained on GDPR deletions
- [ ] Documentation complete and accessible

---

## Success Criteria

✅ **Deployment is successful when:**

1. All 5 tables exist (`audit_events`, `audit_events_archive`, `audit_deletion_log`, `audit_retention_policies`, `audit_event_sequence`)
2. All 6 workspace triggers are firing (verified with test data)
3. Archive job runs daily without errors
4. Monthly partitions created on first of month
5. Application can call `insert_audit_event()` RPC
6. Audit trail is queryable (<100ms response time)
7. GDPR deletion function works without errors
8. Team trained and documentation updated

---

## Support Contacts

- **Database Admin**: [Your DBA contact]
- **Security/Compliance**: [Compliance contact]
- **DevOps/Infrastructure**: [DevOps contact]
- **Application Team**: [App lead]

---

**Deployment Date**: ________________  
**Approved By**: ________________  
**Deployed By**: ________________  

**Note**: Keep this checklist handy for future reference and updates!
