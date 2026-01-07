# Server-Side Auth Context - Implementation Guide

## Overview

The `getAuthContextServerSide()` function provides a unified way to resolve user and workspace context on the server. It uses a hierarchical fallback system to ensure consistent workspace resolution across all server components.

## Quick Start

### In Server Components

```typescript
// app/(dashboard)/layout.tsx
import { getAuthContextServerSide } from '@/lib/auth/server-context';

export default async function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode;
}) {
  // Get user + workspace context
  const { user, workspaceId, source } = await getAuthContextServerSide(request);

  if (!user) {
    redirect('/login');
  }

  if (!workspaceId) {
    // No workspace found - redirect to workspace selection/creation
    redirect('/workspaces/create');
  }

  // Now fetch workspace-specific data
  const workspace = await db.workspaces.findUnique({
    where: { id: workspaceId }
  });

  return (
    <div>
      <header>
        <h1>{workspace.name}</h1>
        <p>Workspace ID: {workspaceId} (resolved via {source})</p>
      </header>
      {children}
    </div>
  );
}
```

### In Route Handlers

```typescript
// app/api/workspace/data/route.ts
import { getAuthContextServerSide } from '@/lib/auth/server-context';
import { requireWorkspaceAccess } from '@/lib/auth/server-context';

export async function GET(request: Request) {
  const { user, workspaceId } = await getAuthContextServerSide(request);

  if (!user || !workspaceId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify access
  await requireWorkspaceAccess(user.id, workspaceId);

  // Fetch workspace data
  const data = await db.workspaceData.findMany({
    where: { workspace_id: workspaceId }
  });

  return Response.json({ data });
}
```

## Resolution Hierarchy

```
User authenticated?
  ├─ NO → return { user: null, workspaceId: null, source: 'none' }
  └─ YES
    ├─ Primary: Database primary mapping exists?
    │  ├─ YES → return { user, workspaceId, source: 'database_primary' }
    │  └─ NO
    │   ├─ Secondary: httpOnly cookie (active_workspace) exists AND user is member?
    │   │  ├─ YES → return { user, workspaceId, source: 'cookie_active_workspace' }
    │   │  └─ NO (or invalid membership)
    │   │   ├─ Tertiary: Dev ?workspace param exists (dev only) AND user is member?
    │   │   │  ├─ YES → return { user, workspaceId, source: 'dev_query_param' }
    │   │   │  └─ NO
    │   │   │   └─ return { user, workspaceId: null, source: 'none' }
```

## API Reference

### `getAuthContextServerSide(request)`

Main function that resolves auth context.

**Parameters:**
- `request` - Next.js Request object or similar with headers/cookies

**Returns:**
```typescript
{
  user: { id, email, ... } | null,
  workspaceId: string | null,
  source?: 'database_primary' | 'cookie_active_workspace' | 'dev_query_param' | 'none'
}
```

**Example:**
```typescript
const { user, workspaceId, source } = await getAuthContextServerSide(request);
console.log(`Workspace resolved via ${source}`);
```

### Access Control Guards

These throw errors if access is denied:

#### `requireWorkspaceAccess(userId, workspaceId)`
Ensures user is a member of the workspace.

```typescript
try {
  await requireWorkspaceAccess(user.id, workspaceId);
  // User is a member, proceed
} catch (err) {
  return Response.json({ error: err.message }, { status: 403 });
}
```

#### `requireWorkspaceOwner(userId, workspaceId)`
Ensures user is the workspace owner.

```typescript
// Admin-only operation
await requireWorkspaceOwner(user.id, workspaceId);
// User is owner, proceed
```

#### `requireWorkspaceRole(userId, workspaceId, role)`
Ensures user has at least the specified role.

```typescript
// Member or above
await requireWorkspaceRole(user.id, workspaceId, 'member');

// Admin or above
await requireWorkspaceRole(user.id, workspaceId, 'admin');
```

### Utility Helpers

#### `isWorkspaceOwner(userId, workspaceId)`
Check if user owns workspace.

```typescript
const isOwner = await isWorkspaceOwner(user.id, workspaceId);
if (isOwner) {
  // Show edit button
}
```

#### `getUserWorkspaceRole(userId, workspaceId)`
Get user's role in workspace.

```typescript
const role = await getUserWorkspaceRole(user.id, workspaceId);
// Returns: 'owner' | 'admin' | 'member' | 'viewer' | null
```

## Source Tracking

The `source` field indicates which method resolved the workspace:

| Source | Meaning | Trust Level |
|--------|---------|-------------|
| `database_primary` | User's primary workspace from DB | ✅ Highest |
| `cookie_active_workspace` | User selected via switcher (validated) | ✅ High |
| `dev_query_param` | Dev override (?workspace) | ⚠️ Dev only |
| `none` | No workspace found | ❌ Error state |

Use this for debugging and monitoring:
```typescript
if (source === 'cookie_active_workspace') {
  // User actively switched workspaces
  analytics.track('workspace_switched', { workspaceId });
}
```

## Implementation TODOs

This file contains placeholder implementations. Replace them with your actual implementations:

1. **`resolveUserFromSession(request)`**
   - Implement based on your auth provider (Supabase, Clerk, NextAuth, etc.)
   - Extract session from request and validate

2. **`findWorkspaceForUser(userId)`**
   - Query database for user's primary workspace
   - Order by creation date or prefer owner role

3. **`validateWorkspaceMembership(userId, workspaceId)`**
   - Check users_workspaces table for record
   - Return true only if membership exists

4. **`isWorkspaceOwner(userId, workspaceId)`**
   - Check if workspace.owner_id === userId

5. **`getUserWorkspaceRole(userId, workspaceId)`**
   - Return role from users_workspaces table

## Integration with Workspace Switcher

This works seamlessly with your `WorkspaceSwitcherDropdown`:

```
User selects workspace in dropdown
  ↓
selectWorkspace() called
  ↓
POST /api/workspaces/select
  ↓
Server sets httpOnly cookie: active_workspace
  ↓
Client calls router.refresh()
  ↓
Server components re-render
  ↓
getAuthContextServerSide() reads cookie
  ↓
Validates membership
  ↓
Returns correct workspaceId
  ↓
Page renders workspace-specific data
```

## Security Considerations

✅ **Implemented:**
- httpOnly cookie prevents XSS theft
- Server-side membership validation before trusting
- Dev override only in development
- Membership check before any data access
- Role-based access control

✅ **Recommended:**
- Log failed access attempts (already done)
- Rate limit auth checks
- Monitor for suspicious workspace access patterns
- Audit log all workspace switches
- Invalidate cookies on logout

## Error Handling

Always handle the "no workspace" case:

```typescript
const { user, workspaceId } = await getAuthContextServerSide(request);

if (!user) {
  redirect('/login');
}

if (!workspaceId) {
  redirect('/workspaces/select'); // Let user choose workspace
}

// Safe to proceed with workspaceId
```

## Testing

### Development Workspace Override

In development, you can test different workspaces:

```
http://localhost:3000/dashboard?workspace=WORKSPACE_ID_HERE
```

The system will:
1. Check if user is member of that workspace
2. If yes, use it for this request
3. If no, log warning and fall back

### Debug Logging

The function logs resolution details:
```
[AUTH] User abc123 resolved via database_primary: workspace-123
[AUTH] User abc123 resolved via cookie_active_workspace: workspace-456
[AUTH] User abc123 has no accessible workspace (...)
```

Check console to verify which resolution method is being used.

## Example: Complete Page

```typescript
// app/(dashboard)/workspace/page.tsx
import { getAuthContextServerSide, requireWorkspaceAccess } from '@/lib/auth/server-context';

export default async function WorkspacePage({ request }) {
  const { user, workspaceId } = await getAuthContextServerSide(request);

  // Guard: user must be authenticated
  if (!user) {
    return <RedirectToLogin />;
  }

  // Guard: workspace must be selected
  if (!workspaceId) {
    return <SelectWorkspace />;
  }

  // Guard: user must be member
  await requireWorkspaceAccess(user.id, workspaceId);

  // Fetch workspace-specific data
  const workspace = await db.workspaces.findUnique({
    where: { id: workspaceId }
  });

  const data = await db.getData({
    where: { workspace_id: workspaceId }
  });

  return (
    <div>
      <h1>{workspace.name}</h1>
      <DataDisplay data={data} />
    </div>
  );
}
```

## Files Modified/Created

- `apps/web/src/lib/auth/server-context.ts` - Main implementation
- This guide: `SERVER_AUTH_CONTEXT_GUIDE.md`

## Next Steps

1. Implement the TODO placeholders with your actual database/auth code
2. Import `getAuthContextServerSide` in your server components
3. Use the access control guards for permission checks
4. Test workspace switching and resolution
5. Monitor logs for suspicious activity
