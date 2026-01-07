# Workspace Switcher Integration Guide

## Overview

The workspace system has been refactored to use `useWorkspaces` as the authoritative orchestration layer that will eventually delegate to `useAccountContext`.

## Architecture

```
useAccountContext (future)
    ↓
useWorkspaces (orchestration layer) ← NEW PRIMARY HOOK
    ↓
selectWorkspace (workspace-client.ts)
    ↓
POST /api/workspaces/select (backend)
    ↓
httpOnly cookie + audit event
```

## Components & Hooks

### 1. `useWorkspaces()` - Primary Hook
**Location:** `apps/web/src/hooks/useWorkspaces.ts`
**Purpose:** Orchestration layer for all workspace operations

**Returns:**
```typescript
{
  workspaces: Workspace[];           // List of user's workspaces
  activeWorkspaceId: string | null;  // Currently selected workspace ID
  activeWorkspace: Workspace | null; // Currently selected workspace object
  selectWorkspace: (id: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
  error: string | null;
}
```

**Usage:**
```typescript
const { workspaces, activeWorkspaceId, selectWorkspace, loading, error } = useWorkspaces();

// Switch workspace
await selectWorkspace(workspaceId);
```

### 2. `WorkspaceSwitcherDropdown` - UI Component
**Location:** `apps/web/src/components/WorkspaceSwitcherDropdown.tsx`
**Purpose:** Native `<select>` element for workspace switching

**Features:**
- Accessible (native select, ARIA labels, screen reader support)
- Progressive enhancement
- Loads workspaces on mount
- Shows loading state during switch
- Calls `router.refresh()` to re-run server components

**Usage:**
```typescript
import WorkspaceSwitcherDropdown from '@/components/WorkspaceSwitcherDropdown';

export function Header() {
  return (
    <header>
      <WorkspaceSwitcherDropdown />
    </header>
  );
}
```

### 3. `useActiveWorkspace()` - Deprecated
**Location:** `apps/web/src/hooks/useActiveWorkspace.ts`
**Status:** ⚠️ DEPRECATED - Use `useWorkspaces()` instead
**Purpose:** Backward compatibility wrapper

**Migration:**
```typescript
// Old
const { activeWorkspaceId, switchWorkspace } = useActiveWorkspace();

// New
const { activeWorkspaceId, selectWorkspace } = useWorkspaces();
```

## Integration Checklist

- [ ] Verify `useWorkspaces` is imported correctly in components
- [ ] Replace `WorkspaceSwitcher.tsx` references with `WorkspaceSwitcherDropdown.tsx`
- [ ] Update any components using `useActiveWorkspace()` to use `useWorkspaces()`
- [ ] Test workspace switching in browser
- [ ] Verify httpOnly cookie is set correctly
- [ ] Verify audit logs show WORKSPACE_SWITCH events
- [ ] Test server component re-rendering on workspace switch

## API Flow

1. User selects workspace in dropdown
2. `WorkspaceSwitcherDropdown` calls `selectWorkspace(workspaceId)`
3. `selectWorkspace` calls `POST /api/workspaces/select`
4. Server validates:
   - User is authenticated
   - Workspace exists
   - User is a member
5. Server sets `active_workspace` httpOnly cookie
6. Server logs `WORKSPACE_SWITCH` audit event
7. Client calls `router.refresh()` to re-run server components
8. Server reads httpOnly cookie and renders workspace-specific data

## Server Component Integration

For server components to read the active workspace:

```typescript
// app/dashboard/layout.tsx (server component)
import { getActiveWorkspaceFromRequest } from '@/hooks/useActiveWorkspace';

export default async function DashboardLayout({ children }) {
  const activeWorkspaceId = getActiveWorkspaceFromRequest(request);
  // Use activeWorkspaceId to fetch workspace-specific data
  
  return <>{children}</>;
}
```

## Notes

- `useWorkspaces` will eventually delegate to `useAccountContext` when available
- Cookie reading utilities are available but marked deprecated
- The component is production-ready; focus on integration
