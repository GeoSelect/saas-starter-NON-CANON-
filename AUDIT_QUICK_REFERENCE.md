# Production Audit System - Quick Reference

## 5-Layer Architecture Summary

| Layer | Purpose | Status | Key Files |
|-------|---------|--------|-----------|
| **1. Foundation** | Append-only table with triggers | ✅ Done | `010_audit_trail_production.sql` |
| **2. Constraints** | Data integrity checks | ✅ Done | Built into Layer 1 |
| **3. Archive** | Retention policies + cold storage | ✅ Done | `audit_events_archive` table |
| **4. Partitioning** | Monthly date-based partitions | ✅ Done | Auto-created partitions |
| **5. Compliance** | GDPR/CCPA deletion logging | ✅ Done | `audit_deletion_log` table |

## Quick Deploy

```bash
# 1. Apply main migration
supabase migration up

# 2. Apply workspace triggers
psql -f migrations/011_workspace_audit_triggers.sql

# 3. Verify
psql -c "SELECT COUNT(*) FROM audit_events;"
```

## Core Tables

```sql
-- Main: Hot storage (90 days default)
audit_events (id, created_at, action_type, resource_id, workspace_id, ...)

-- Archive: Cold storage (after 90 days)
audit_events_archive (same schema + archived_at, archived_by)

-- Compliance: Who deleted what
audit_deletion_log (deleted_at, deletion_reason, authority, ...)

-- Config: Per-workspace retention
audit_retention_policies (workspace_id, hot_retention_days, is_compliance_mode, ...)

-- Sequence: Prevents time-travel attacks
audit_event_sequence (workspace_id, last_event_id, last_created_at)
```

## Key Functions

### Logging an Event

```typescript
// Auto (via trigger) - PREFERRED
UPDATE workspaces SET name = 'New' WHERE id = 'ws-123';
// Trigger fires → audit event created automatically

// Manual (if needed)
const eventId = await supabase.rpc('insert_audit_event', {
  p_action_type: 'CUSTOM_ACTION',
  p_resource_type: 'workspace',
  p_resource_id: 'ws-123',
  p_workspace_id: 'ws-123',
  p_created_by_user_id: 'user-123'
});
```

### Retrieving Audit Trail

```sql
-- Get audit trail for workspace
SELECT * FROM get_audit_trail('ws-123'::uuid);

-- With filters
SELECT * FROM get_audit_trail(
  'ws-123'::uuid,
  p_resource_type := 'workspace',
  p_days_back := 30
);

-- Raw query
SELECT * FROM audit_events
WHERE workspace_id = 'ws-123'::uuid
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 100;
```

### GDPR Compliance

```sql
-- Soft-delete all audit events for a user (IRREVOCABLE)
SELECT delete_user_audit_events_compliant(
  p_user_id := 'user-123'::uuid,
  p_workspace_id := 'ws-123'::uuid,
  p_authority := 'GDPR',
  p_approval_ticket_id := 'TICKET-123'::uuid
);

-- Check deletion log
SELECT * FROM audit_deletion_log
WHERE deletion_authority = 'GDPR'
ORDER BY deleted_at DESC;
```

## Constraint Checks (Automatic)

| Check | Prevents | Example |
|-------|----------|---------|
| `check_action_type_not_empty` | Empty action type | `action_type = ''` ❌ |
| `check_created_at_not_future` | Clock skew | `created_at = NOW() + 1 hour` ❌ |
| `prevent_audit_modifications` | UPDATE/DELETE | `UPDATE audit_events SET ...` ❌ |
| `check_audit_workspace_membership` | Invalid workspace | User not in workspace ❌ |
| `check_audit_sequence_order` | Out-of-order events | Event before previous ❌ |

## Archive Strategy

### Configuration

```sql
-- View default policy (90 days hot, 365 days warm, 7 years forever)
SELECT * FROM audit_retention_policies
WHERE workspace_id = 'ws-123'::uuid;

-- Update policy
UPDATE audit_retention_policies
SET hot_retention_days = 30, is_compliance_mode = TRUE
WHERE workspace_id = 'ws-123'::uuid;
```

### Manual Archive

```sql
-- Run archive (normally daily via cron)
SELECT archive_old_audit_events();
-- Returns: (archived_count INT, deleted_count INT)

-- Check what's archived
SELECT COUNT(*) FROM audit_events_archive;

-- Restore from archive
INSERT INTO audit_events (...)
SELECT * FROM audit_events_archive WHERE id = 'event-123'::uuid;
```

## Partitioning (Auto-Managed)

```sql
-- Create next month's partition (run on 1st of month)
SELECT create_monthly_audit_partition();

-- View all partitions
SELECT tablename FROM pg_tables
WHERE tablename LIKE 'audit_events%'
ORDER BY tablename;

-- Check partition sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename))
FROM pg_tables
WHERE tablename LIKE 'audit_events%';
```

## Deletion Logging (Compliance)

```sql
-- View all deletions
SELECT * FROM audit_deletion_log ORDER BY deleted_at DESC;

-- Check for approval ticket
SELECT * FROM audit_deletion_log
WHERE approval_ticket_id = 'JIRA-456'::uuid;

-- Irrevocable deletions (must verify before)
SELECT * FROM audit_deletion_log WHERE is_irrevocable = TRUE;
```

## Monitoring Views

### Daily Activity
```sql
SELECT * FROM vw_audit_summary
WHERE workspace_id = 'ws-123'::uuid
ORDER BY audit_date DESC;
```

### User Activity
```sql
SELECT * FROM vw_user_audit_activity
WHERE workspace_id = 'ws-123'::uuid
ORDER BY activity_date DESC;
```

### Security Events
```sql
SELECT * FROM vw_security_audit
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

## Common Tasks

### List All Workspace Changes
```sql
SELECT ae.id, ae.created_at, ae.action_type, ae.created_by_user_id
FROM audit_events ae
WHERE ae.resource_type = 'workspace'
  AND ae.workspace_id = 'ws-123'::uuid
ORDER BY ae.created_at DESC LIMIT 20;
```

### Find Who Changed What
```sql
SELECT ae.*, ae.new_values->'name' as new_name
FROM audit_events ae
WHERE ae.action_type = 'UPDATE_WORKSPACE'
  AND ae.metadata->'changes'->'name' IS NOT NULL
ORDER BY ae.created_at DESC;
```

### Track User Membership History
```sql
SELECT ae.created_at, ae.action_type, ae.metadata->'role' as role
FROM audit_events ae
WHERE ae.resource_type = 'workspace_membership'
  AND ae.resource_id = 'user-456'::uuid
ORDER BY ae.created_at DESC;
```

### Compliance Audit (7-Year Rule)
```sql
SELECT COUNT(*) as immutable_events
FROM audit_events
WHERE created_at > NOW() - INTERVAL '7 years'
  AND deleted_at IS NULL;
-- Should be all events in 7-year window
```

## Scheduling

### Daily Archive (2 AM)
```bash
# Option A: pg_cron (automatic)
SELECT cron.schedule('archive_audit', '0 2 * * *', 'SELECT archive_old_audit_events()');

# Option B: Application cron
# Call every day at 2 AM: archiveAuditEvents()
```

### Monthly Partitions (1st at 1 AM)
```bash
# Call on 1st of each month
SELECT create_monthly_audit_partition();
```

## Testing Commands

```sql
-- Create test event
SELECT insert_audit_event(
  'TEST_ACTION', 'test', gen_random_uuid(), 
  'ws-test'::uuid, 'user-test'::uuid
);

-- Verify immutability (should fail)
UPDATE audit_events SET action_type = 'HACKED' WHERE action_type = 'TEST_ACTION';

-- Verify sequence check (should fail)
INSERT INTO audit_events (
  created_by_user_id, action_type, resource_type, resource_id,
  workspace_id, created_at
) VALUES (
  'user-123'::uuid, 'LATE', 'test', gen_random_uuid(),
  'ws-123'::uuid, NOW() - INTERVAL '1 day'
);

-- Soft delete (should work)
SELECT delete_user_audit_events_compliant(
  'user-test'::uuid, 'ws-test'::uuid, 'GDPR', gen_random_uuid()
);
```

## Troubleshooting Map

| Issue | Check | Fix |
|-------|-------|-----|
| Events not logged | Trigger enabled? | `ALTER TABLE audit_events ENABLE TRIGGER ...;` |
| Archive stuck | pg_cron active? | `SELECT * FROM cron.job;` |
| Constraint fails | Valid values? | Check constraints with `\d audit_events` |
| Partitions missing | Next month created? | `SELECT create_monthly_audit_partition();` |
| Deletion failing | User exists? | User must be in workspace |

## Performance Tips

| Scale | Action | Impact |
|-------|--------|--------|
| 1M events/month | Enable partitions | ✅ Required |
| 10M events | Archive 90+ days | ✅ Reduces hot table |
| 100M events | Monitor partition size | ✅ Split if >10GB |

Run monthly:
```sql
ANALYZE audit_events;
REINDEX TABLE CONCURRENTLY audit_events;
```

## Files to Deploy

1. **SQL Migration**: `010_audit_trail_production.sql` (Layer 1-5)
2. **Triggers**: `011_workspace_audit_triggers.sql` (Auto-logging)
3. **App Helper**: `apps/web/src/lib/audit/audit-client.ts` (TypeScript wrapper)
4. **Admin UI**: `apps/admin/pages/compliance/...` (GDPR interface)

## Status Checklist

- [ ] Deploy `010_audit_trail_production.sql`
- [ ] Create triggers via `011_workspace_audit_triggers.sql`
- [ ] Verify tables exist with: `SELECT * FROM information_schema.tables WHERE table_name LIKE 'audit%';`
- [ ] Test with: `SELECT insert_audit_event(...)`
- [ ] Schedule archive job (daily 2 AM)
- [ ] Schedule partitions (monthly on 1st)
- [ ] Setup monitoring alerts
- [ ] Train compliance team on deletion process
- [ ] Document in runbook

## Documentation

- **Full Guide**: [AUDIT_IMPLEMENTATION_GUIDE.md](AUDIT_IMPLEMENTATION_GUIDE.md)
- **Triggers**: [WORKSPACE_AUDIT_TRIGGERS.md](WORKSPACE_AUDIT_TRIGGERS.md)
- **SQL**: [010_audit_trail_production.sql](migrations/010_audit_trail_production.sql)

---

*Last Updated: 2026-01-07 | Production Ready*
