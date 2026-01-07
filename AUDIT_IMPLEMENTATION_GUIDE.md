# Production Audit System - Implementation Guide

## Overview

This guide walks you through implementing a 5-layer production audit system:

1. **Foundation** - Append-only audit table with trigger-based logging
2. **Essential** - Constraint checks for data integrity
3. **Important** - Archive strategy for retention and compliance
4. **Nice-to-Have** - Partitioning for performance at scale
5. **Compliance** - Deletion audit log for forensic tracking

## Architecture Diagram

```
User Action (e.g., workspace switch)
        ↓
Application Layer
        ↓
INSERT audit_event() function
        ↓
audit_events table (append-only)
        │
        ├─→ Constraints validated (LAYER 2)
        ├─→ Sequence checked (chronological order)
        └─→ Indexed for performance
        ↓
After 90 days (configurable)
        ↓
Archive Job (runs daily)
        ↓
Moves to audit_events_archive
        │
        ├─→ Soft-deleted from main table
        └─→ Deletion logged in audit_deletion_log
        ↓
After 7 years (or policy-configured)
        ↓
Cold storage or deletion (with approval)
```

## Layer 1: Foundation Setup

### Step 1.1: Run the Base Migration

```bash
# Using Supabase CLI
supabase migration up

# Or manually in your database:
psql -U postgres -d your_database -f migrations/010_audit_trail_production.sql
```

### Step 1.2: Verify Table Creation

```sql
-- Check main table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'audit_events';

-- Check partitions
SELECT * FROM pg_partitioned_table 
WHERE relname = 'audit_events';

-- Check indexes
SELECT * FROM pg_indexes 
WHERE tablename LIKE 'audit_events%';
```

### Step 1.3: Create Application Helper

Create [apps/web/src/lib/audit/audit-client.ts](apps/web/src/lib/audit/audit-client.ts):

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuditEventPayload {
  actionType: string;
  resourceType: string;
  resourceId: string;
  workspaceId: string;
  createdByUserId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Log an audit event (application layer)
 * Calls the insert_audit_event() stored procedure
 */
export async function logAuditEvent(payload: AuditEventPayload): Promise<string> {
  const { data, error } = await supabase.rpc('insert_audit_event', {
    p_action_type: payload.actionType,
    p_resource_type: payload.resourceType,
    p_resource_id: payload.resourceId,
    p_workspace_id: payload.workspaceId,
    p_created_by_user_id: payload.createdByUserId,
    p_old_values: payload.oldValues,
    p_new_values: payload.newValues,
    p_ip_address: payload.ipAddress,
    p_user_agent: payload.userAgent,
    p_tags: payload.tags,
    p_metadata: payload.metadata,
  });

  if (error) throw error;
  
  return data as string; // Returns event UUID
}

/**
 * Retrieve audit trail for a resource or workspace
 */
export async function getAuditTrail(
  workspaceId: string,
  options?: {
    resourceType?: string;
    resourceId?: string;
    daysBack?: number;
    limit?: number;
  }
) {
  const { data, error } = await supabase.rpc('get_audit_trail', {
    p_workspace_id: workspaceId,
    p_resource_type: options?.resourceType,
    p_resource_id: options?.resourceId,
    p_days_back: options?.daysBack ?? 30,
    p_limit: options?.limit ?? 100,
  });

  if (error) throw error;
  return data;
}
```

---

## Layer 2: Essential Constraints Implementation

### Step 2.1: Verify Constraints Are Applied

The migration automatically creates:
- ✓ `check_action_type_not_empty`
- ✓ `check_resource_type_not_empty`
- ✓ `check_workspace_id_not_null`
- ✓ `check_created_by_user_id_not_null`
- ✓ `check_created_at_not_future`
- ✓ `check_old_values_not_empty`
- ✓ `check_new_values_not_empty`

```sql
-- View all constraints on audit_events
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'audit_events';
```

### Step 2.2: Test Constraint Enforcement

```sql
-- This should FAIL (empty action_type)
INSERT INTO audit_events (
  created_by_user_id, action_type, resource_type, 
  resource_id, workspace_id
) VALUES (
  'user-123'::uuid, '', 'workspace', 
  'ws-123'::uuid, 'ws-456'::uuid
);
-- Error: check_action_type_not_empty

-- This should FAIL (future date)
INSERT INTO audit_events (
  created_by_user_id, action_type, resource_type, 
  resource_id, workspace_id, created_at
) VALUES (
  'user-123'::uuid, 'TEST', 'workspace', 
  'ws-123'::uuid, 'ws-456'::uuid,
  NOW() + INTERVAL '1 hour'
);
-- Error: check_created_at_not_future

-- This should SUCCEED
INSERT INTO audit_events (
  created_by_user_id, action_type, resource_type, 
  resource_id, workspace_id
) VALUES (
  'user-123'::uuid, 'CREATE_WORKSPACE', 'workspace', 
  'ws-123'::uuid, 'ws-456'::uuid
) RETURNING id;
```

### Step 2.3: Implement Immutability Enforcement

The migration adds a trigger that prevents any UPDATE or DELETE on audit_events:

```sql
-- This will FAIL
UPDATE audit_events SET action_type = 'MODIFIED' WHERE id = 'event-123'::uuid;
-- Error: Audit events are immutable

-- This will FAIL
DELETE FROM audit_events WHERE id = 'event-123'::uuid;
-- Error: Audit events are immutable
```

**To remove an event, you MUST use the deletion log**:

```sql
-- Instead, soft-delete through the proper function
SELECT delete_user_audit_events_compliant(
  p_user_id := 'user-123'::uuid,
  p_workspace_id := 'ws-456'::uuid,
  p_authority := 'GDPR',
  p_approval_ticket_id := 'ticket-789'::uuid
);
```

### Step 2.4: Enable Sequence Checking

The sequence checker is automatically enabled. Verify it works:

```sql
-- Create test sequence tracker
INSERT INTO audit_event_sequence (workspace_id, last_event_id, last_created_at)
VALUES ('ws-123'::uuid, gen_random_uuid(), NOW());

-- Try to insert event with earlier timestamp (should fail)
INSERT INTO audit_events (
  created_by_user_id, action_type, resource_type, resource_id,
  workspace_id, created_at
) VALUES (
  'user-123'::uuid, 'LATE_EVENT', 'test', gen_random_uuid(),
  'ws-123'::uuid, NOW() - INTERVAL '1 hour'
);
-- Error: Audit event timestamp is before last event
```

---

## Layer 3: Archive Strategy Implementation

### Step 3.1: Configure Retention Policies

Each workspace has its own retention policy:

```sql
-- Update default policy (90 days hot, 365 days warm)
UPDATE audit_retention_policies
SET hot_retention_days = 90, warm_archive_days = 365
WHERE workspace_id = 'ws-123'::uuid;

-- View all policies
SELECT * FROM audit_retention_policies;
```

**For Compliance-Heavy Workspaces:**

```sql
-- GDPR/HIPAA/SOC2 mode - never auto-delete
UPDATE audit_retention_policies
SET is_compliance_mode = TRUE, compliance_reason = 'GDPR'
WHERE workspace_id = 'ws-compliance'::uuid;
```

### Step 3.2: Set Up Archive Job Scheduler

**Option A: Using pg_cron (Automatic)**

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily archival at 2 AM
SELECT cron.schedule(
  'archive_old_audit_events',
  '0 2 * * *',
  'SELECT archive_old_audit_events()'
);

-- View scheduled jobs
SELECT * FROM cron.job;
```

**Option B: Application-Scheduled (Manual)**

Create [apps/api/routes/admin/archive-audit.ts](apps/api/routes/admin/archive-audit.ts):

```typescript
// Call daily from your scheduler (e.g., node-cron, APScheduler, etc)

export async function archiveAuditEvents() {
  const { data, error } = await supabase.rpc('archive_old_audit_events');
  
  if (error) {
    console.error('Archive failed:', error);
    throw error;
  }
  
  console.log(`Archived ${data[0].archived_count} events, deleted ${data[0].deleted_count}`);
  return data;
}

// Example with node-cron
import cron from 'node-cron';

// Run at 2 AM daily
cron.schedule('0 2 * * *', archiveAuditEvents);
```

### Step 3.3: Monitor Archive Progress

```sql
-- Check how many events are in hot storage
SELECT COUNT(*) as hot_events FROM audit_events;

-- Check how many in archive
SELECT COUNT(*) as archived_events FROM audit_events_archive;

-- View archive progress by workspace
SELECT
  workspace_id,
  COUNT(*) as archived_events,
  MAX(created_at) as newest_archived,
  MIN(created_at) as oldest_archived
FROM audit_events_archive
GROUP BY workspace_id;

-- Check deletion log
SELECT * FROM audit_deletion_log ORDER BY deleted_at DESC LIMIT 10;
```

### Step 3.4: Restore from Archive (if needed)

```sql
-- Recover an archived event back to hot storage
WITH restored AS (
  DELETE FROM audit_events_archive
  WHERE id = 'event-123'::uuid
  RETURNING *
)
INSERT INTO audit_events (
  id, created_at, created_by_user_id, action_type, resource_type,
  resource_id, workspace_id, old_values, new_values, changed_fields,
  ip_address, user_agent, request_id, tags, metadata
)
SELECT 
  id, created_at, created_by_user_id, action_type, resource_type,
  resource_id, workspace_id, old_values, new_values, changed_fields,
  ip_address, user_agent, request_id, tags, metadata
FROM restored;
```

---

## Layer 4: Partitioning Implementation

### Step 4.1: Verify Partitions

```sql
-- List all partitions
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename LIKE 'audit_events%'
ORDER BY tablename;
```

Should see:
- `audit_events` (parent)
- `audit_events_2026_01` (Jan 2026)
- `audit_events_2026_02` (Feb 2026)
- `audit_events_2026_03` (Mar 2026)
- Similar for archive tables

### Step 4.2: Schedule Partition Creation

Partitions need to be created monthly. Create [apps/api/routes/admin/create-partitions.ts](apps/api/routes/admin/create-partitions.ts):

```typescript
export async function createNextMonthPartition() {
  const { error } = await supabase.rpc('create_monthly_audit_partition');
  
  if (error) {
    console.error('Partition creation failed:', error);
    throw error;
  }
  
  console.log('Monthly partition created');
}

// Schedule on the first of each month at 1 AM
import cron from 'node-cron';

cron.schedule('0 1 1 * *', createNextMonthPartition);
```

### Step 4.3: Monitor Partition Growth

```sql
-- View partition sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE 'audit_events%'
ORDER BY tablename;

-- Check partition health
SELECT
  schemaname,
  tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE tablename LIKE 'audit_events%';
```

### Step 4.4: Enable Automatic Vacuum on Partitions (Optional)

```sql
-- Set aggressive vacuum on audit partitions
ALTER TABLE audit_events SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005
);
```

---

## Layer 5: Compliance & Deletion Log

### Step 5.1: Verify Deletion Log Setup

```sql
-- Check deletion log is empty
SELECT * FROM audit_deletion_log;

-- Check audit_events has soft-delete columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'audit_events'
AND column_name IN ('deleted_at', 'deleted_by_user_id', 'deletion_reason');
```

### Step 5.2: Implement GDPR Right-to-be-Forgotten

Create [apps/api/routes/admin/delete-user-gdpr.ts](apps/api/routes/admin/delete-user-gdpr.ts):

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DeleteUserRequest {
  userId: string;
  workspaceId: string;
  authority: 'GDPR' | 'CCPA'; // Regulatory authority
  approvalTicketId: string; // Ticket # from compliance team
}

export async function deleteUserAuditEventsCompliant(
  req: DeleteUserRequest
) {
  // IMPORTANT: This should be called AFTER proper authorization/approval
  // Typically from a compliance admin portal with audit trail
  
  const { data, error } = await supabase.rpc(
    'delete_user_audit_events_compliant',
    {
      p_user_id: req.userId,
      p_workspace_id: req.workspaceId,
      p_authority: req.authority,
      p_approval_ticket_id: req.approvalTicketId,
    }
  );

  if (error) {
    console.error('User deletion failed:', error);
    throw error;
  }

  console.log(`Deleted ${data.deleted_count} events, log ID: ${data.deletion_log_id}`);
  
  return {
    deletedCount: data.deleted_count,
    deletionLogId: data.deletion_log_id,
    authority: req.authority,
  };
}
```

### Step 5.3: Audit the Audit Deletion Process

```sql
-- See who deleted what and when
SELECT
  dl.id,
  dl.deleted_at,
  u.email as deleted_by,
  dl.deletion_authority,
  dl.deletion_reason,
  dl.approval_ticket_id
FROM audit_deletion_log dl
LEFT JOIN users u ON dl.deleted_by_user_id = u.id
ORDER BY dl.deleted_at DESC;

-- Verify irrevocable deletions
SELECT * FROM audit_deletion_log WHERE is_irrevocable = TRUE;
```

### Step 5.4: Implement Deletion Approval Workflow

Create compliance admin interface:

```typescript
// apps/admin/pages/compliance/deletion-requests.tsx

export function DeletionRequestsAdmin() {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  
  async function approveDeletion(requestId: string) {
    // Get ticket from admin
    const ticketId = prompt('Enter approval ticket ID:');
    
    // Call deletion function
    await fetch('/api/admin/delete-user-gdpr', {
      method: 'POST',
      body: JSON.stringify({
        userId: request.userId,
        workspaceId: request.workspaceId,
        authority: request.authority, // 'GDPR'
        approvalTicketId: ticketId,
      }),
    });
    
    // Mark as approved in audit log
    // Automatically logged by database trigger
  }
  
  return (
    <div>
      <h1>Deletion Requests (Requires Approval)</h1>
      {requests.map(req => (
        <div key={req.id}>
          <p>User: {req.userId}</p>
          <p>Authority: {req.authority}</p>
          <button onClick={() => approveDeletion(req.id)}>
            Approve & Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Testing & Validation

### Test 1: Basic Audit Event Creation

```bash
# Via API
curl -X POST http://localhost:3000/api/audit/log \
  -H "Content-Type: application/json" \
  -d '{
    "actionType": "TEST_EVENT",
    "resourceType": "workspace",
    "resourceId": "ws-123",
    "workspaceId": "ws-123",
    "createdByUserId": "user-123"
  }'
```

```sql
-- Verify in database
SELECT * FROM audit_events 
WHERE action_type = 'TEST_EVENT'
ORDER BY created_at DESC LIMIT 1;
```

### Test 2: Constraint Validation

```bash
# Try invalid payload (empty action_type)
curl -X POST http://localhost:3000/api/audit/log \
  -H "Content-Type: application/json" \
  -d '{
    "actionType": "",
    "resourceType": "workspace",
    "resourceId": "ws-123"
  }'
# Should get: 400 - constraint violation
```

### Test 3: Archive & Cleanup

```sql
-- Manually trigger archive for old test data
SELECT archive_old_audit_events();

-- Verify events moved to archive
SELECT COUNT(*) as archived_count FROM audit_events_archive;

-- Check deletion log was created
SELECT * FROM audit_deletion_log ORDER BY deleted_at DESC LIMIT 1;
```

### Test 4: GDPR Deletion

```sql
-- Create test user events
INSERT INTO audit_events (
  created_by_user_id, action_type, resource_type, 
  resource_id, workspace_id
) VALUES (
  'test-user'::uuid, 'TEST_DELETE', 'workspace',
  gen_random_uuid(), 'ws-123'::uuid
);

-- Call GDPR deletion
SELECT delete_user_audit_events_compliant(
  p_user_id := 'test-user'::uuid,
  p_workspace_id := 'ws-123'::uuid,
  p_authority := 'GDPR',
  p_approval_ticket_id := 'GDPR-2026-001'::uuid
);

-- Verify soft-delete
SELECT deleted_at, deletion_reason FROM audit_events 
WHERE created_by_user_id = 'test-user'::uuid;

-- Check deletion log
SELECT * FROM audit_deletion_log WHERE deletion_authority = 'GDPR';
```

---

## Monitoring & Maintenance

### Daily Checks

```sql
-- Monitor table growth
SELECT 
  DATE(created_at) as date,
  COUNT(*) as daily_events
FROM audit_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Check for errors in constraints
SELECT * FROM pg_stat_user_tables
WHERE relname = 'audit_events'
ORDER BY seq_scan DESC;

-- Verify archive job ran
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'archive_old_audit_events')
ORDER BY start_time DESC LIMIT 1;
```

### Weekly Reports

```sql
-- Activity by action type
SELECT action_type, COUNT(*) as count
FROM audit_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action_type
ORDER BY count DESC;

-- Most active users
SELECT created_by_user_id, COUNT(*) as action_count
FROM audit_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY created_by_user_id
ORDER BY action_count DESC
LIMIT 10;

-- Security events
SELECT * FROM vw_security_audit
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Monthly Maintenance

```sql
-- Verify partitions created for next month
SELECT * FROM partition_schedule ORDER BY next_partition_date DESC;

-- Archive old data
SELECT archive_old_audit_events();

-- Analyze table stats
ANALYZE audit_events;

-- Reindex if needed
REINDEX TABLE CONCURRENTLY audit_events;
```

---

## Troubleshooting

### Problem: Archive Job Not Running

**Check 1:** Is pg_cron enabled?
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
-- Should show pg_cron with cascades to dependencies
```

**Check 2:** Is the job registered?
```sql
SELECT * FROM cron.job WHERE jobname = 'archive_old_audit_events';
```

**Check 3:** Did it fail?
```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'archive_old_audit_events')
ORDER BY start_time DESC LIMIT 5;
```

### Problem: Events Not Being Logged

**Check 1:** Is insert_audit_event() returning NULL?
```sql
SELECT insert_audit_event(
  'TEST', 'workspace', gen_random_uuid(), 
  'ws-123'::uuid, 'user-123'::uuid
);
-- Should return a UUID
```

**Check 2:** Is trigger firing?
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname LIKE 'audit%';

-- Manually test
INSERT INTO audit_events (
  created_by_user_id, action_type, resource_type, resource_id, workspace_id
) VALUES ('user-123'::uuid, 'TEST', 'ws', gen_random_uuid(), 'ws-123'::uuid);

-- Verify inserted
SELECT COUNT(*) FROM audit_events WHERE action_type = 'TEST';
```

### Problem: Constraints Too Strict

If legitimate events are failing constraints:

```sql
-- Temporarily disable constraint (DANGEROUS - only if debugging)
ALTER TABLE audit_events DISABLE TRIGGER check_audit_workspace_membership;

-- Fix root cause
-- Re-enable
ALTER TABLE audit_events ENABLE TRIGGER check_audit_workspace_membership;
```

---

## Next Steps

1. ✅ Deploy migration (`010_audit_trail_production.sql`)
2. ✅ Create audit client helper ([audit-client.ts](apps/web/src/lib/audit/audit-client.ts))
3. ⏭️ **Add workspace trigger** - Log when workspaces are created/updated
4. ⏭️ **Add user workspace trigger** - Log membership changes
5. ⏭️ **Schedule archive job** - Daily archival at 2 AM
6. ⏭️ **Schedule partition creation** - Monthly on 1st at 1 AM
7. ⏭️ **Build compliance admin** - GDPR deletion request UI
8. ⏭️ **Setup monitoring alerts** - Email if archive fails

See [WORKSPACE_AUDIT_TRIGGERS.md](WORKSPACE_AUDIT_TRIGGERS.md) for next phase.
