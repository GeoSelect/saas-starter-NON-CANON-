# Workspace Audit Triggers - Step-by-Step Implementation

## Overview

These triggers automatically log workspace events to the audit trail. No manual `insert_audit_event()` calls needed.

## Architecture

```
User Action
    ↓
Workspace Table Changes
    ↓
Trigger Fires Automatically
    ↓
insert_audit_event() called
    ↓
Audit Event Recorded
```

## Step 1: Workspace Creation Trigger

### 1.1: What to Log

When a workspace is created, we log:
- WHO created it (created_by_user_id)
- WHAT workspace (resource_id = workspace.id)
- WHEN (created_at)
- THE VALUES (new_values contains full workspace data)

### 1.2: Create the Trigger

```sql
CREATE OR REPLACE FUNCTION log_workspace_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM insert_audit_event(
    p_action_type := 'CREATE_WORKSPACE',
    p_resource_type := 'workspace',
    p_resource_id := NEW.id,
    p_workspace_id := NEW.id, -- The workspace being created
    p_created_by_user_id := NEW.owner_id,
    p_new_values := row_to_json(NEW)::jsonb,
    p_metadata := jsonb_build_object(
      'plan', NEW.plan,
      'is_personal', NEW.is_personal
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to workspaces table
CREATE TRIGGER workspace_created_audit
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION log_workspace_created();
```

### 1.3: Test It

```sql
-- Create a test workspace
INSERT INTO workspaces (owner_id, name, plan)
VALUES ('user-123'::uuid, 'Test Workspace', 'starter')
RETURNING id;

-- Verify audit event was created
SELECT * FROM audit_events
WHERE action_type = 'CREATE_WORKSPACE'
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- ✓ action_type = 'CREATE_WORKSPACE'
-- ✓ resource_id = workspace id from insert
-- ✓ workspace_id = same as resource_id
-- ✓ created_by_user_id = 'user-123'
-- ✓ new_values has all workspace fields
```

---

## Step 2: Workspace Update Trigger

### 2.1: What to Log

When workspace is updated, we track what CHANGED:
- Name changed from X to Y
- Plan changed from starter to pro
- Settings modified

### 2.2: Create the Trigger

```sql
CREATE OR REPLACE FUNCTION log_workspace_updated()
RETURNS TRIGGER AS $$
DECLARE
  v_changed_fields TEXT[];
  v_key TEXT;
  v_changes JSONB := '{}'::jsonb;
BEGIN
  -- Skip if nothing actually changed
  IF OLD = NEW THEN
    RETURN NEW;
  END IF;
  
  -- Find which fields changed
  FOR v_key IN SELECT key FROM jsonb_each(row_to_json(NEW)::jsonb)
  LOOP
    IF OLD::json->>v_key IS DISTINCT FROM NEW::json->>v_key THEN
      v_changed_fields := array_append(v_changed_fields, v_key);
      
      -- Track the before/after for this field
      v_changes := jsonb_set(
        v_changes,
        ARRAY[v_key],
        jsonb_build_object(
          'from', (OLD::json->>v_key)::jsonb,
          'to', (NEW::json->>v_key)::jsonb
        )
      );
    END IF;
  END LOOP;
  
  -- Log if anything changed
  IF v_changed_fields IS NOT NULL AND array_length(v_changed_fields, 1) > 0 THEN
    PERFORM insert_audit_event(
      p_action_type := 'UPDATE_WORKSPACE',
      p_resource_type := 'workspace',
      p_resource_id := NEW.id,
      p_workspace_id := NEW.id,
      p_created_by_user_id := current_user_id, -- Current user doing the update
      p_old_values := row_to_json(OLD)::jsonb,
      p_new_values := row_to_json(NEW)::jsonb,
      p_metadata := jsonb_build_object(
        'changed_fields', v_changed_fields,
        'changes', v_changes
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to workspaces table
DROP TRIGGER IF EXISTS workspace_updated_audit ON workspaces;
CREATE TRIGGER workspace_updated_audit
  AFTER UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION log_workspace_updated();
```

### 2.3: Test It

```sql
-- Update a workspace
UPDATE workspaces
SET name = 'Updated Name', plan = 'pro'
WHERE id = 'ws-123'::uuid;

-- Verify audit event
SELECT * FROM audit_events
WHERE action_type = 'UPDATE_WORKSPACE'
AND resource_id = 'ws-123'::uuid
ORDER BY created_at DESC LIMIT 1;

-- Check the metadata
SELECT 
  ae.id,
  ae.metadata->'changed_fields' as fields_changed,
  ae.metadata->'changes' as before_after
FROM audit_events ae
WHERE action_type = 'UPDATE_WORKSPACE'
ORDER BY ae.created_at DESC LIMIT 1;

-- Should show:
-- ✓ changed_fields = ["name", "plan"]
-- ✓ changes shows before/after values
-- ✓ old_values = original row
-- ✓ new_values = updated row
```

---

## Step 3: Workspace Deletion Trigger

### 3.1: What to Log

When workspace is deleted:
- WHAT was deleted (workspace id, name)
- WHO deleted it
- WHY (if available)

### 3.2: Create the Trigger

```sql
CREATE OR REPLACE FUNCTION log_workspace_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- Log deletion
  PERFORM insert_audit_event(
    p_action_type := 'DELETE_WORKSPACE',
    p_resource_type := 'workspace',
    p_resource_id := OLD.id,
    p_workspace_id := OLD.id,
    p_created_by_user_id := current_user_id,
    p_old_values := row_to_json(OLD)::jsonb,
    p_tags := ARRAY['destructive', 'requires-approval'],
    p_metadata := jsonb_build_object(
      'workspace_name', OLD.name,
      'workspace_plan', OLD.plan,
      'owner_id', OLD.owner_id,
      'members_at_deletion', (
        SELECT COUNT(*) FROM users_workspaces 
        WHERE workspace_id = OLD.id
      )
    )
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to workspaces table
DROP TRIGGER IF EXISTS workspace_deleted_audit ON workspaces;
CREATE TRIGGER workspace_deleted_audit
  BEFORE DELETE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION log_workspace_deleted();
```

### 3.3: Test It

```sql
-- Delete a test workspace
DELETE FROM workspaces WHERE id = 'ws-delete-test'::uuid;

-- Verify audit event
SELECT * FROM audit_events
WHERE action_type = 'DELETE_WORKSPACE'
AND resource_id = 'ws-delete-test'::uuid;

-- Should show:
-- ✓ action_type = 'DELETE_WORKSPACE'
-- ✓ tags includes 'destructive'
-- ✓ old_values has all deleted workspace data
-- ✓ metadata shows workspace name, plan, member count
```

---

## Step 4: User Workspace Membership Changes

### 4.1: What to Log

When users are added/removed from workspaces:
- User ID
- Workspace ID
- Role change (member → admin)
- Who made the change

### 4.2: Create Triggers

```sql
-- MEMBERSHIP ADDED TRIGGER
CREATE OR REPLACE FUNCTION log_user_workspace_added()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM insert_audit_event(
    p_action_type := 'ADD_WORKSPACE_MEMBER',
    p_resource_type := 'workspace_membership',
    p_resource_id := NEW.user_id,
    p_workspace_id := NEW.workspace_id,
    p_created_by_user_id := current_user_id,
    p_new_values := jsonb_build_object(
      'user_id', NEW.user_id,
      'workspace_id', NEW.workspace_id,
      'role', NEW.role,
      'joined_at', NEW.created_at
    ),
    p_metadata := jsonb_build_object(
      'role', NEW.role
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_workspace_added_audit ON users_workspaces;
CREATE TRIGGER user_workspace_added_audit
  AFTER INSERT ON users_workspaces
  FOR EACH ROW
  EXECUTE FUNCTION log_user_workspace_added();


-- MEMBERSHIP ROLE CHANGED TRIGGER
CREATE OR REPLACE FUNCTION log_user_workspace_role_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM insert_audit_event(
      p_action_type := 'CHANGE_WORKSPACE_MEMBER_ROLE',
      p_resource_type := 'workspace_membership',
      p_resource_id := NEW.user_id,
      p_workspace_id := NEW.workspace_id,
      p_created_by_user_id := current_user_id,
      p_old_values := jsonb_build_object('role', OLD.role),
      p_new_values := jsonb_build_object('role', NEW.role),
      p_tags := ARRAY['privilege-change'],
      p_metadata := jsonb_build_object(
        'role_from', OLD.role,
        'role_to', NEW.role,
        'user_id', NEW.user_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_workspace_role_changed_audit ON users_workspaces;
CREATE TRIGGER user_workspace_role_changed_audit
  AFTER UPDATE ON users_workspaces
  FOR EACH ROW
  EXECUTE FUNCTION log_user_workspace_role_changed();


-- MEMBERSHIP REMOVED TRIGGER
CREATE OR REPLACE FUNCTION log_user_workspace_removed()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM insert_audit_event(
    p_action_type := 'REMOVE_WORKSPACE_MEMBER',
    p_resource_type := 'workspace_membership',
    p_resource_id := OLD.user_id,
    p_workspace_id := OLD.workspace_id,
    p_created_by_user_id := current_user_id,
    p_old_values := jsonb_build_object(
      'user_id', OLD.user_id,
      'workspace_id', OLD.workspace_id,
      'role', OLD.role,
      'joined_at', OLD.created_at
    ),
    p_tags := ARRAY['access-revoked'],
    p_metadata := jsonb_build_object(
      'role_at_removal', OLD.role,
      'tenure_days', EXTRACT(DAY FROM (NOW() - OLD.created_at))
    )
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_workspace_removed_audit ON users_workspaces;
CREATE TRIGGER user_workspace_removed_audit
  AFTER DELETE ON users_workspaces
  FOR EACH ROW
  EXECUTE FUNCTION log_user_workspace_removed();
```

### 4.3: Test It

```sql
-- Add user to workspace
INSERT INTO users_workspaces (user_id, workspace_id, role)
VALUES ('user-456'::uuid, 'ws-123'::uuid, 'member');

-- Verify audit
SELECT * FROM audit_events
WHERE action_type = 'ADD_WORKSPACE_MEMBER'
ORDER BY created_at DESC LIMIT 1;
-- Should show user-456 added as 'member'

-- Change role
UPDATE users_workspaces
SET role = 'admin'
WHERE user_id = 'user-456'::uuid
AND workspace_id = 'ws-123'::uuid;

-- Verify role change audit
SELECT * FROM audit_events
WHERE action_type = 'CHANGE_WORKSPACE_MEMBER_ROLE'
AND resource_id = 'user-456'::uuid;
-- Should show member → admin

-- Remove user
DELETE FROM users_workspaces
WHERE user_id = 'user-456'::uuid
AND workspace_id = 'ws-123'::uuid;

-- Verify removal audit
SELECT * FROM audit_events
WHERE action_type = 'REMOVE_WORKSPACE_MEMBER'
AND resource_id = 'user-456'::uuid;
-- Should show user removed with tenure days
```

---

## Step 5: Workspace Settings Changes

### 5.1: Separate Audit-Only Column

For complex settings, create a separate tracking:

```sql
-- Add to workspaces table
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Create trigger for settings updates
CREATE OR REPLACE FUNCTION log_workspace_settings_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.settings IS DISTINCT FROM NEW.settings THEN
    PERFORM insert_audit_event(
      p_action_type := 'UPDATE_WORKSPACE_SETTINGS',
      p_resource_type := 'workspace_settings',
      p_resource_id := NEW.id,
      p_workspace_id := NEW.id,
      p_created_by_user_id := current_user_id,
      p_old_values := OLD.settings,
      p_new_values := NEW.settings,
      p_tags := ARRAY['settings'],
      p_metadata := jsonb_build_object(
        'settings_category', 'general'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workspace_settings_changed_audit ON workspaces;
CREATE TRIGGER workspace_settings_changed_audit
  AFTER UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION log_workspace_settings_changed();
```

---

## Step 6: Batch Deployment

Deploy all triggers at once:

```bash
# Create a single migration file
cat > migrations/011_workspace_audit_triggers.sql << 'EOF'
-- Trigger 1: Workspace Created
CREATE OR REPLACE FUNCTION log_workspace_created() RETURNS TRIGGER AS $$
-- [insert trigger code from Step 1.2 above]
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspace_created_audit AFTER INSERT ON workspaces
FOR EACH ROW EXECUTE FUNCTION log_workspace_created();

-- Trigger 2: Workspace Updated
CREATE OR REPLACE FUNCTION log_workspace_updated() RETURNS TRIGGER AS $$
-- [insert trigger code from Step 2.2 above]
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspace_updated_audit AFTER UPDATE ON workspaces
FOR EACH ROW EXECUTE FUNCTION log_workspace_updated();

-- Trigger 3: Workspace Deleted
CREATE OR REPLACE FUNCTION log_workspace_deleted() RETURNS TRIGGER AS $$
-- [insert trigger code from Step 3.2 above]
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspace_deleted_audit BEFORE DELETE ON workspaces
FOR EACH ROW EXECUTE FUNCTION log_workspace_deleted();

-- Trigger 4-6: User Workspace Changes
CREATE OR REPLACE FUNCTION log_user_workspace_added() RETURNS TRIGGER AS $$
-- [insert trigger code from Step 4.2 above]
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_workspace_added_audit AFTER INSERT ON users_workspaces
FOR EACH ROW EXECUTE FUNCTION log_user_workspace_added();

-- [Continue with remaining triggers...]
EOF

# Apply migration
supabase migration up
```

---

## Step 7: Verification Checklist

### ✓ All Triggers Created

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('workspaces', 'users_workspaces')
ORDER BY trigger_name;
```

Should show:
- ✓ workspace_created_audit
- ✓ workspace_updated_audit
- ✓ workspace_deleted_audit
- ✓ user_workspace_added_audit
- ✓ user_workspace_role_changed_audit
- ✓ user_workspace_removed_audit

### ✓ Audit Events Are Being Logged

```sql
-- Count events by type
SELECT action_type, COUNT(*) as count
FROM audit_events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY action_type
ORDER BY count DESC;

-- Should see recent events like:
-- CREATE_WORKSPACE, UPDATE_WORKSPACE, ADD_WORKSPACE_MEMBER, etc.
```

### ✓ No Errors in Trigger Execution

```sql
-- Check PostgreSQL logs for errors
SELECT * FROM pg_stat_user_tables
WHERE relname IN ('workspaces', 'users_workspaces')
AND idx_scan > 0; -- High scan count = trigger working
```

---

## Step 8: View Audit Trail

Create views for easy querying:

```sql
-- View all workspace changes
CREATE OR REPLACE VIEW vw_workspace_audit AS
SELECT
  ae.id,
  ae.created_at,
  ae.action_type,
  ae.resource_id as workspace_id,
  ae.created_by_user_id,
  ae.metadata
FROM audit_events ae
WHERE ae.resource_type = 'workspace'
ORDER BY ae.created_at DESC;

-- View membership changes
CREATE OR REPLACE VIEW vw_membership_audit AS
SELECT
  ae.id,
  ae.created_at,
  ae.action_type,
  ae.workspace_id,
  ae.resource_id as user_id,
  ae.metadata->'role' as role,
  ae.created_by_user_id
FROM audit_events ae
WHERE ae.resource_type = 'workspace_membership'
ORDER BY ae.created_at DESC;

-- Use them
SELECT * FROM vw_workspace_audit 
WHERE workspace_id = 'ws-123'::uuid
ORDER BY created_at DESC LIMIT 20;
```

---

## Step 9: Application Integration

Now in your app, you don't need to manually log. Just perform actions:

```typescript
// apps/api/routes/workspaces/[id].ts

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { name, plan } = await request.json();
  
  // Just update - trigger handles logging
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .update({ name, plan })
    .eq('id', params.id)
    .select()
    .single();
  
  if (error) throw error;
  
  // ✓ Audit event automatically created by trigger
  // ✓ Shows what changed, who changed it, when
  
  return workspace;
}
```

---

## Troubleshooting

### Triggers Not Firing

```sql
-- Check if triggers are enabled
SELECT trigger_name, is_enabled
FROM pg_trigger
WHERE tgrelid = 'workspaces'::regclass;
-- Should all be enabled

-- If disabled, enable
ALTER TABLE workspaces ENABLE TRIGGER workspace_created_audit;
```

### Trigger Errors

```sql
-- Check for syntax errors
SELECT pg_get_triggerdef('workspace_created_audit'::regprocedure);

-- Re-create if broken
DROP TRIGGER IF EXISTS workspace_created_audit ON workspaces;
CREATE TRIGGER workspace_created_audit
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION log_workspace_created();
```

### Missing Audit Events

```sql
-- Verify current_user_id is set
-- (needed for created_by_user_id)
SELECT current_user_id;

-- If NULL, set it in your connection:
-- SET app.current_user_id = 'user-123';

-- Test with explicit user
INSERT INTO workspaces (owner_id, name, plan)
SELECT 'user-123'::uuid, 'Test', 'starter'
WHERE (SELECT current_user_id) IS NOT NULL;
```

---

## Next: Application Integration

See [AUDIT_IMPLEMENTATION_GUIDE.md](AUDIT_IMPLEMENTATION_GUIDE.md) for:
- ✓ Creating audit client helpers
- ✓ Building audit trails in UI
- ✓ Compliance reporting
- ✓ Retention policies
