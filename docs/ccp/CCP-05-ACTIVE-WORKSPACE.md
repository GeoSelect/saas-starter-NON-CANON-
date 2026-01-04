# CCP-05: Active Workspace Selection Extension

## Overview

Active Workspace Selection is the session-level "current context" pointer for authenticated users. It complements CCP-05 Workspace Hardening by allowing users to designate which workspace they're actively working within.

**Core Doctrine:**
- **Workspace** remains the collaboration container (permanent, multi-user)
- **Active Workspace** is the session-level context pointer (per-user, mutable)
- **RLS** remains the enforcement layer (membership verification)
- **API** does NOT existence-check workspaces (deterministic 403 mapping)

## Frozen Contract: active-workspace-0.1

### Request: Set Active Workspace

```
POST /api/workspace/active
Content-Type: application/json

{
  "workspace_id": "a3b6a3d6-1b3b-4c62-8d77-4d05afbb23f4"
}
```

**Constraints:**
- `workspace_id`: Required, must be valid UUIDv4
- User must be authenticated
- User must be a member of the target workspace

### Response: Success (200 OK)

```json
{
  "ok": true,
  "active": {
    "schema": "active-workspace-0.1",
    "data": {
      "user_id": "9efb2f0d-8bf2-4b51-ae14-1d0a6ceef0d1",
      "workspace_id": "a3b6a3d6-1b3b-4c62-8d77-4d05afbb23f4",
      "updated_at": "2026-01-04T12:00:00.000Z"
    }
  }
}
```

### Request: Get Active Workspace

```
GET /api/workspace/active
```

**Constraints:**
- User must be authenticated
- Returns user's currently set active workspace

### Response: Success (200 OK)

```json
{
  "ok": true,
  "active": {
    "schema": "active-workspace-0.1",
    "data": {
      "user_id": "9efb2f0d-8bf2-4b51-ae14-1d0a6ceef0d1",
      "workspace_id": "a3b6a3d6-1b3b-4c62-8d77-4d05afbb23f4",
      "updated_at": "2026-01-04T12:00:00.000Z"
    }
  }
}
```

## Error Codes (Frozen)

| Code | HTTP | Scenario |
|------|------|----------|
| `workspace_active_unauthenticated` | 401 | User not authenticated |
| `workspace_active_contract` | 400 | Invalid request (missing/malformed `workspace_id`) |
| `workspace_active_forbidden` | 403 | User not a member of workspace OR workspace doesn't exist |

### 403 Deterministic Mapping

The API **does not** distinguish between:
- User is not a member of the workspace (would be member if existed)
- Workspace does not exist (user cannot be member)

Both return **403 Forbidden** with code `workspace_active_forbidden`. This prevents information leakage about workspace existence.

## Database Schema

### Table: `user_active_workspace`

```sql
CREATE TABLE user_active_workspace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id),  -- One active workspace per user
  CONSTRAINT user_workspace_exist CHECK (user_id IS NOT NULL AND workspace_id IS NOT NULL)
);
```

**Indexes:**
- `user_id` - Fast lookup by user
- `workspace_id` - Fast cascade on workspace delete
- `updated_at` - Chronological queries

### RLS Policies

1. **SELECT**: User can only view their own active workspace
   ```sql
   WHERE auth.uid() = user_id
   ```

2. **INSERT/UPDATE**: User can only set their own active workspace if they're a workspace member
   ```sql
   WHERE auth.uid() = user_id
   AND EXISTS (
     SELECT 1 FROM workspace_members
     WHERE user_id = auth.uid()
     AND workspace_id = user_active_workspace.workspace_id
   )
   ```

3. **DELETE**: User can only delete their own active workspace
   ```sql
   WHERE auth.uid() = user_id
   ```

## Helper Functions

### `getActiveWorkspace(userId?: string): Promise<ActiveWorkspaceResponse>`

Retrieves the active workspace for a user.

**Parameters:**
- `userId` (optional): User UUID. If omitted, uses `auth.getUser()`.

**Returns:**
- `{ ok: true, active }` on success (200)
- `{ ok: false, code: "workspace_active_unauthenticated" }` if not authenticated (401)
- `{ ok: false, code: "workspace_active_forbidden" }` if no active workspace set (403)

**Usage:**
```typescript
const result = await getActiveWorkspace();
if (result.ok) {
  console.log(result.active.data.workspace_id);
}
```

### `setActiveWorkspace(workspaceId: string, userId?: string): Promise<ActiveWorkspaceResponse>`

Sets the active workspace for a user.

**Parameters:**
- `workspaceId`: Target workspace UUID (must be valid UUIDv4)
- `userId` (optional): User UUID. If omitted, uses `auth.getUser()`.

**Returns:**
- `{ ok: true, active }` on success (200)
- `{ ok: false, code: "workspace_active_contract" }` if invalid format (400)
- `{ ok: false, code: "workspace_active_unauthenticated" }` if not authenticated (401)
- `{ ok: false, code: "workspace_active_forbidden" }` if not a member (403)

**Usage:**
```typescript
const result = await setActiveWorkspace("a3b6a3d6-1b3b-4c62-8d77-4d05afbb23f4");
if (!result.ok && result.code === "workspace_active_forbidden") {
  // User not a member
}
```

## API Routes

### `GET /api/workspace/active`

Retrieves the authenticated user's active workspace.

**Implementation:** [app/api/workspace/active/route.ts](../../app/api/workspace/active/route.ts)

**Status Codes:**
- `200` - Success with active workspace
- `401` - Unauthenticated
- `403` - No active workspace set
- `500` - Server error

### `POST /api/workspace/active`

Sets the authenticated user's active workspace.

**Request Body:**
```json
{
  "workspace_id": "uuid"
}
```

**Implementation:** [app/api/workspace/active/route.ts](../../app/api/workspace/active/route.ts)

**Status Codes:**
- `200` - Success with updated active workspace
- `400` - Invalid request contract
- `401` - Unauthenticated
- `403` - User not a member of workspace
- `500` - Server error

## Integration with CCP-05 Stack

### Membership Verification

Both `verifyWorkspaceMembership` (middleware) and `setActiveWorkspace` (RLS policy) enforce:

```sql
EXISTS (
  SELECT 1 FROM workspace_members
  WHERE user_id = auth.uid()
  AND workspace_id = <target_workspace>
)
```

This ensures **active workspace must be a workspace the user is already a member of**.

### Entitlements Enforcement

Entitlements limit:
- Number of workspaces a user can be a member of (per plan tier)
- Collaboration features available in a workspace

Active workspace selection **does not enforce entitlements**. It only enforces membership.

If user is a member of 5 workspaces (within their plan limit), they can switch active workspace between all 5.

### Share Token Integration

When sharing a report via `POST /api/workspace/:id/report/:reportId/share`, the recipient accesses the report within the shared workspace context. The recipient can set that workspace as their active workspace via `POST /api/workspace/active`.

## Implementation Checklist

- [x] Database migration: `user_active_workspace` table with RLS
- [x] Helper functions: `getActiveWorkspace()`, `setActiveWorkspace()`
- [x] API routes: `GET /api/workspace/active`, `POST /api/workspace/active`
- [x] Error handling: Deterministic 403 mapping, contract validation
- [x] Tests: Contract validation, RLS enforcement, error codes, integration

## Testing

Run tests with:
```bash
pnpm test -- lib/workspace/active-workspace.test.ts
```

Test coverage includes:
- Contract schema validation (active-workspace-0.1)
- Error codes (401, 400, 403)
- RLS enforcement (user isolation, membership requirement)
- Session-level context (one active workspace per user)
- Deterministic 403 mapping (no existence checks)
- Integration with CCP-05 layers

## Migration

Apply database migration:

```bash
# Via Supabase dashboard
supabase migration up

# Or via Drizzle
pnpm drizzle push
```

Verify:
```sql
SELECT * FROM user_active_workspace LIMIT 1;
SELECT * FROM information_schema.table_privileges 
WHERE table_name = 'user_active_workspace';
```

## Next Steps

1. **Deploy Migration**: Apply `20260104_ccp05_active_workspace.sql` to Supabase
2. **Integrate with UI**: Add workspace switcher component
3. **Route Handler Integration**: Automatically set active workspace on workspace entry
4. **Telemetry**: Track active workspace switches
5. **Phase 2 of CCP-05**: Integrate with report creation/access flows

## Files

- [lib/workspace/active-workspace.ts](../../lib/workspace/active-workspace.ts) - Helper functions
- [app/api/workspace/active/route.ts](../../app/api/workspace/active/route.ts) - API routes
- [lib/workspace/active-workspace.test.ts](../../lib/workspace/active-workspace.test.ts) - Tests
- [supabase/migrations/20260104_ccp05_active_workspace.sql](../../supabase/migrations/20260104_ccp05_active_workspace.sql) - Database schema

## Related CCP-05 Documents

- [CCP-05 Workspace Hardening](../ccp/CCP-05_WORKSPACE_HARDENING.md)
- [CCP-05 Implementation Guide](../ccp/CCP-05-IMPLEMENTATION-GUIDE.md)
- [CCP-05 Merge Gates](../ccp/CCP-05-GATES.md)
