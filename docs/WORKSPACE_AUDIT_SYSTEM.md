# Workspace Audit Log System

Comprehensive audit trail for all workspace-level changes including member management, plan changes, entitlements, and billing events.

## Components

### 1. Core Audit Service

**File:** `lib/audit/workspace-audit.ts`

The main service providing audit logging capabilities for workspace events.

#### Key Functions

```typescript
// Log workspace creation
logWorkspaceCreated(supabase, workspaceId, actorId, workspaceName, plan, metadata?)

// Log workspace updates
logWorkspaceUpdated(supabase, workspaceId, actorId, oldValues, newValues, metadata?)

// Log member additions
logMemberAdded(supabase, workspaceId, actorId, memberId, memberEmail, role, metadata?)

// Log member role changes
logMemberRoleChanged(supabase, workspaceId, actorId, memberId, oldRole, newRole, metadata?)

// Log entitlement checks (granted or denied)
logEntitlementCheck(supabase, workspaceId, actorId, feature, granted, reason?, metadata?)

// Log plan changes (upgrade/downgrade)
logPlanChange(supabase, workspaceId, actorId, oldPlan, newPlan, reason?, metadata?)

// Log Stripe billing sync events
logBillingSync(supabase, workspaceId, stripeCustomerId, plan, status, metadata?)

// Retrieve audit log for a workspace
getWorkspaceAuditLog(supabase, workspaceId, options?)

// Get audit summary statistics
getWorkspaceAuditSummary(supabase, workspaceId, days?)
```

#### Audit Entry Structure

```typescript
interface WorkspaceAuditEntry {
  id: string;                              // Unique audit entry ID
  workspace_id: uuid;                      // Workspace being audited
  actor_id: string;                        // User ID or 'system'
  action: WorkspaceAuditAction;            // Type of action (see below)
  resource_type: 'workspace' | 'member' | 'entitlement' | 'billing';
  resource_id?: string;                    // ID of affected resource
  old_values?: Record<string, any>;        // Previous state (before change)
  new_values?: Record<string, any>;        // New state (after change)
  changed_fields?: string[];               // Which fields were modified
  reason?: string;                         // Why the change occurred
  metadata?: Record<string, any>;          // Additional context (IP, user-agent, etc)
  created_at: Date;                        // When the event occurred
  status: 'success' | 'denied' | 'failed'; // Outcome of the action
}
```

#### Action Types

```typescript
type WorkspaceAuditAction = 
  | 'workspace.created'
  | 'workspace.updated'
  | 'workspace.deleted'
  | 'workspace.member_added'
  | 'workspace.member_removed'
  | 'workspace.member_role_changed'
  | 'workspace.plan_upgraded'
  | 'workspace.plan_downgraded'
  | 'workspace.entitlement_granted'
  | 'workspace.entitlement_denied'
  | 'workspace.entitlement_revoked'
  | 'workspace.billing_sync'
  | 'workspace.settings_updated';
```

### 2. Database Schema

**File:** `db/migrations/015_workspace_audit_log.sql`

#### Table: `workspace_audit_log`

Core immutable append-only audit table with RLS protection:

```sql
-- Columns
id              text primary key        -- Unique event ID
workspace_id    uuid (fk)              -- Workspace reference
actor_id        text                   -- User or 'system'
action          text (checked enum)    -- Action type
resource_type   text (checked enum)    -- Resource being audited
resource_id     text                   -- Resource identifier
old_values      jsonb                  -- Previous state
new_values      jsonb                  -- New state
changed_fields  text[]                 -- Modified field names
reason          text                   -- Change reason/denial explanation
metadata        jsonb default '{}'     -- Context data
status          text (checked enum)    -- success | denied | failed
created_at      timestamp tz           -- Event timestamp

-- Indexes (for efficient querying)
workspace_id, actor_id, action, created_at
workspace_id + created_at (DESC) - for recent changes
resource_type + resource_id - for tracking specific resources
status - for finding denied/failed operations
```

#### RLS Policies

- **SELECT**: Users can view logs for workspaces they're members of
- **INSERT**: Only system (via service role) can create entries
- **UPDATE**: Disabled (immutable audit trail)
- **DELETE**: Disabled (immutable audit trail)

#### Views

**`workspace_audit_summary`** - Statistics per workspace:
```
workspace_id, total_events, successful_events, denied_events, failed_events,
unique_actors, action_types, first_event, last_event, actions_breakdown
```

**`workspace_recent_changes`** - Recent changes with row number (last 90 days):
```
All audit_log columns + row_number per workspace
```

### 3. Stripe Webhook Integration

**File:** `app/api/webhooks/stripe/route.ts`

The webhook handler now logs all billing and plan changes:

#### Updated Flows

**subscription.updated** event:
```
1. Update billing_state in database
2. Compare old vs new tier
3. If tier changed:
   - Call logPlanChange() with old/new tier
4. Sync entitlements to new plan
5. Invalidate cache
```

**subscription.deleted** event:
```
1. Set tier to 'free'
2. Set status to 'cancelled'
3. If was paid tier:
   - Call logPlanChange(oldTier, 'free')
   - Include 'subscription_cancelled' reason
4. Sync entitlements to free tier
5. Invalidate cache
```

#### Audit Entry Metadata

Plan change events include:
```json
{
  "stripeCustomerId": "cus_...",
  "stripeSubscriptionId": "sub_...",
  "subscriptionStatus": "active|cancelled|past_due",
  "trialEnd": "2024-12-31T00:00:00Z"
}
```

### 4. Admin Dashboard

**File:** `app/(dashboard)/audit/workspace-audit/page.tsx`

Real-time dashboard for viewing and filtering audit events.

#### Features

- **Time Range Filtering**: Date picker for start/end dates
- **Workspace Filtering**: View logs for specific workspaces
- **Action Filtering**: Filter by event type (upgrade, deny, member_added, etc.)
- **Status Filtering**: View successful, denied, or failed operations
- **Two Tab Views**:
  - **Logs Tab**: Chronological list of recent events (200 max) with:
    - Event type and status badges
    - Before/after values in expandable section
    - Denial reasons for failed entitlement checks
    - Relative timestamps
  - **Summary Tab**: Statistics cards per workspace showing:
    - Total events, successful, denied, failed counts
    - Unique actor count
    - Last event timestamp

#### View URL
```
/dashboard/audit/workspace-audit
```

## Usage Examples

### Log a plan upgrade

```typescript
import { logPlanChange } from '@/lib/audit/workspace-audit';

await logPlanChange(
  supabase,
  workspaceId,
  userId,
  'free',
  'pro',
  'User upgraded plan',
  { source: 'stripe_webhook' }
);
```

### Log an entitlement check denial

```typescript
import { logEntitlementCheck } from '@/lib/audit/workspace-audit';

await logEntitlementCheck(
  supabase,
  workspaceId,
  userId,
  'report.create',
  false, // denied
  'Pro plan required for reports',
  { featureGate: 'reports_v2' }
);
```

### Log member addition

```typescript
import { logMemberAdded } from '@/lib/audit/workspace-audit';

await logMemberAdded(
  supabase,
  workspaceId,
  actorId,
  newMemberId,
  'team@example.com',
  'editor',
  { invitationSource: 'invite_form' }
);
```

### Retrieve recent audit entries

```typescript
import { getWorkspaceAuditLog } from '@/lib/audit/workspace-audit';

const entries = await getWorkspaceAuditLog(
  supabase,
  workspaceId,
  {
    limit: 50,
    action: 'workspace.plan_upgraded',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  }
);

entries.forEach(entry => {
  console.log(`${entry.action}: ${entry.old_values.plan} → ${entry.new_values.plan}`);
});
```

### Get audit statistics

```typescript
import { getWorkspaceAuditSummary } from '@/lib/audit/workspace-audit';

const summary = await getWorkspaceAuditSummary(supabase, workspaceId, 30);

console.log(`This month: ${summary.total} events`);
console.log(`Denied: ${summary.deniedCount} access attempts`);
console.log(`Top actions:`, summary.byAction);
```

## Compliance & Retention

### Data Retention

- **Default**: 2 years (configured in migration)
- **Cleanup**: Automatic via `cleanup_old_audit_logs()` function
- **Policy**: Run via database scheduler or cron job

### Immutability Guarantees

- ✅ Append-only log (insert-only operations)
- ✅ RLS prevents user modifications
- ✅ Timestamps in UTC with timezone
- ✅ Cryptographic entry IDs
- ✅ No update or delete operations allowed

### SOC 2 / Audit Trail Requirements

The system satisfies common compliance requirements:

- ✅ **Who** (actor_id): User or system performing action
- ✅ **What** (action, resource_type): Type and scope of change
- ✅ **When** (created_at): Timestamp with timezone
- ✅ **Where** (workspace_id, metadata.ip_address): Location context
- ✅ **Why** (reason, metadata): Explanation for action
- ✅ **Before/After** (old_values, new_values): Change visibility
- ✅ **Result** (status): Success/denied/failed outcome

## Integration Patterns

### Workspace Creation Hook

```typescript
// When creating a workspace, log it
const workspace = await createWorkspace(data);

await logWorkspaceCreated(
  supabase,
  workspace.id,
  userId,
  workspace.name,
  'free'
);
```

### Member Management

```typescript
// When adding members
await logMemberAdded(supabase, workspaceId, userId, newMemberId, email, role);

// When changing roles
await logMemberRoleChanged(supabase, workspaceId, userId, memberId, oldRole, newRole);

// When removing members
// (similar pattern)
```

### Entitlement Checks

```typescript
// In feature gates, log both success and denials
const { allowed, reason } = await checkEntitlement(workspaceId, feature);

await logEntitlementCheck(supabase, workspaceId, userId, feature, allowed, reason);

if (!allowed) {
  throw new Error(`Access denied: ${reason}`);
}
```

### Settings Updates

```typescript
// When users update workspace settings
const oldSettings = getWorkspaceSettings(workspaceId);
const newSettings = await updateWorkspaceSettings(workspaceId, data);

await logWorkspaceUpdated(supabase, workspaceId, userId, oldSettings, newSettings);
```

## Monitoring & Alerting

### Key Metrics to Track

1. **Entitlement Denials**: High denial rate may indicate plan tier issues
2. **Plan Changes**: Track upgrade/downgrade patterns
3. **Member Activity**: New members, role changes
4. **Failed Operations**: Potential data integrity issues
5. **Stripe Sync Events**: Billing sync success rate

### Example Query: Find frequent denials

```sql
select
  actor_id,
  resource_id,
  count(*) as denial_count,
  max(created_at) as last_denial
from workspace_audit_log
where action = 'workspace.entitlement_denied'
  and created_at > now() - interval '7 days'
group by actor_id, resource_id
order by denial_count desc
limit 10;
```

### Example Query: Track plan migrations

```sql
select
  workspace_id,
  old_values->>'plan' as from_plan,
  new_values->>'plan' as to_plan,
  count(*) as count,
  max(created_at) as last_change
from workspace_audit_log
where action in ('workspace.plan_upgraded', 'workspace.plan_downgraded')
  and created_at > now() - interval '30 days'
group by workspace_id, old_values->>'plan', new_values->>'plan';
```

## Troubleshooting

### Audit logs not appearing

1. Check RLS policies are enabled
2. Verify Supabase service role is used for inserts
3. Ensure `workspace_audit_log` table exists
4. Check migration ran successfully: `db/migrations/015_workspace_audit_log.sql`

### Performance issues with large audit tables

1. Use time-range filters in queries
2. Ensure indexes are created (check migration)
3. Archive old logs using retention policy
4. Consider partitioning by workspace_id for very large datasets

### Stripe sync events not logged

1. Verify `logPlanChange()` imports are in webhook handler
2. Check webhook is processing subscription events
3. Ensure Supabase connection is valid
4. Review function error logs

## Future Enhancements

- [ ] Audit event webhooks (notify on specific actions)
- [ ] Automated compliance reports (monthly SOC 2)
- [ ] Machine learning to detect anomalous activity
- [ ] Full-text search on audit fields
- [ ] Export audit logs as CSV/JSON
- [ ] Real-time WebSocket updates to dashboard
- [ ] Audit event signing (cryptographic verification)
