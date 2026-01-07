# Server Auth Context - Quick Reference

## Import

```typescript
import { 
  getAuthContextServerSide,
  requireWorkspaceAccess,
  requireWorkspaceOwner,
  requireWorkspaceRole,
  isWorkspaceOwner,
  getUserWorkspaceRole
} from '@/lib/auth/server-context';
```

## Common Patterns

### 1. Get Context (Most Common)

```typescript
const { user, workspaceId } = await getAuthContextServerSide(request);
```

### 2. Guard: User Must Be Authenticated

```typescript
const { user } = await getAuthContextServerSide(request);
if (!user) return redirect('/login');
```

### 3. Guard: Workspace Must Be Selected

```typescript
const { workspaceId } = await getAuthContextServerSide(request);
if (!workspaceId) return redirect('/workspaces/select');
```

### 4. Guard: User Must Be Member

```typescript
const { user, workspaceId } = await getAuthContextServerSide(request);
await requireWorkspaceAccess(user.id, workspaceId);
```

### 5. Guard: User Must Be Owner

```typescript
const { user, workspaceId } = await getAuthContextServerSide(request);
await requireWorkspaceOwner(user.id, workspaceId);
```

### 6. Guard: User Must Be Admin or Owner

```typescript
const { user, workspaceId } = await getAuthContextServerSide(request);
await requireWorkspaceRole(user.id, workspaceId, 'admin');
```

### 7. Check Role Without Throwing

```typescript
const role = await getUserWorkspaceRole(user.id, workspaceId);
if (role === 'owner') {
  // Show admin options
}
```

## In Server Components (Layout)

```typescript
export default async function Layout({ children }) {
  const { user, workspaceId } = await getAuthContextServerSide(request);
  
  if (!user) redirect('/login');
  if (!workspaceId) redirect('/workspaces');
  
  return (
    <div>
      <Header workspace={workspaceId} user={user} />
      {children}
    </div>
  );
}
```

## In API Routes

```typescript
export async function POST(request: Request) {
  const { user, workspaceId } = await getAuthContextServerSide(request);
  
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
  if (!workspaceId) return json({ error: 'No workspace' }, { status: 400 });
  
  await requireWorkspaceAccess(user.id, workspaceId);
  
  // Proceed with workspace-scoped operation
}
```

## Resolution Hierarchy

```
1. Database Primary    ← Best: Source of truth
2. Active Cookie       ← Good: User preference (validated)
3. Dev Query Param     ← Dev only: Testing
4. None/Redirect       ← Error: No workspace
```

## Source Values

- `'database_primary'` - User's default workspace
- `'cookie_active_workspace'` - User switched via dropdown
- `'dev_query_param'` - Development override
- `'none'` - No workspace found

## Type Signature

```typescript
interface AuthContextServerSide {
  user: { id: string; email: string; [key: string]: any } | null;
  workspaceId: string | null;
  source?: 'database_primary' | 'cookie_active_workspace' | 'dev_query_param' | 'none';
}
```

## Error Messages

| Guard | Error | Status |
|-------|-------|--------|
| No user | `Unauthorized` | 401 |
| No workspace | `No workspace selected` | 400 |
| Not member | `Access denied: not a member` | 403 |
| Not owner | `Access denied: not owner` | 403 |
| Wrong role | `Access denied: insufficient role` | 403 |

## Debug Development Workspace

Override active workspace in development:
```
http://localhost:3000/page?workspace=YOUR_WORKSPACE_ID
```

The system will validate membership and use it if authorized.

## Integration Checklist

- [ ] Implement `resolveUserFromSession()` with your auth provider
- [ ] Implement `findWorkspaceForUser()` with your DB
- [ ] Implement `validateWorkspaceMembership()` with your DB
- [ ] Implement `isWorkspaceOwner()` with your DB
- [ ] Implement `getUserWorkspaceRole()` with your DB
- [ ] Import in all server components
- [ ] Add guards to protected routes
- [ ] Test with WorkspaceSwitcherDropdown
- [ ] Monitor logs for suspicious activity
- [ ] Add access control tests

## Related Files

- Implementation: `apps/web/src/lib/auth/server-context.ts`
- Guide: `SERVER_AUTH_CONTEXT_GUIDE.md`
- Workspace Switcher: `components/WorkspaceSwitcherDropdown.tsx`
- Hook: `hooks/useWorkspaces.ts`

## Links

- [Full Guide](SERVER_AUTH_CONTEXT_GUIDE.md)
- [Workspace System](WORKSPACE_IMPLEMENTATION.md)
- [Account Console](ACCOUNT_CONSOLE_GUIDE.md)
