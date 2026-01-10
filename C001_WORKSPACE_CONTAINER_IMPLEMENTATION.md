# C001 WorkspaceContainer Implementation

This document describes the implementation of the C001 WorkspaceContainer component and related workspace management features.

## Overview

The WorkspaceContainer component provides workspace resolution and management capabilities for the application. It ensures that authenticated users always have a valid workspace context and handles workspace switching without page reloads.

## Components Created

### 1. WorkspaceContainer Component (`lib/components/WorkspaceContainer.tsx`)

The main component that wraps application content and ensures valid workspace context.

**Features:**
- Fetches and resolves user's active workspace
- Handles workspace loading states
- Provides workspace switching capabilities
- Integrates with existing AppShellContext
- Handles AnonymousWorkspace for unauthenticated users

**Key Methods:**
- `resolveWorkspace()`: Ensures user has an active workspace
- `switchWorkspace(workspaceId)`: Changes user's active workspace
- `refreshWorkspace()`: Reloads current workspace data

**Usage:**
```tsx
import { WorkspaceContainer } from '@/lib/components/WorkspaceContainer';

function MyApp({ children }) {
  return (
    <WorkspaceContainer>
      {children}
    </WorkspaceContainer>
  );
}
```

### 2. Workspace API Endpoints

#### POST /api/workspaces
Creates a new workspace for the authenticated user.

**Request:**
```json
{
  "name": "My Workspace",
  "slug": "my-workspace", // optional
  "organization_type": "hoa", // optional: hoa, portfolio, management_company
  "set_as_active": true // optional, defaults to true
}
```

**Response:**
```json
{
  "success": true,
  "workspace": {
    "id": "uuid",
    "name": "My Workspace",
    "slug": "my-workspace",
    "tier": "free",
    "organization_type": "hoa"
  }
}
```

#### GET /api/workspaces
Lists all workspaces the authenticated user is a member of.

**Response:**
```json
{
  "success": true,
  "workspaces": [
    {
      "id": "uuid",
      "name": "My Workspace",
      "slug": "my-workspace",
      "tier": "free",
      "organization_type": "hoa",
      "role": "owner",
      "created_at": "2026-01-10T00:00:00Z"
    }
  ]
}
```

## Automatic Workspace Creation

### Auth Callback Enhancement

The auth callback (`app/auth/callback/route.ts`) now automatically creates a default workspace for new users during their first login:

**Behavior:**
1. After successful authentication, checks if user has any workspaces
2. If no workspaces exist, creates a default workspace:
   - Name: `"{user's name}'s Workspace"` or `"User's Workspace"`
   - Slug: Auto-generated from name + timestamp
   - Organization Type: `hoa` (default)
   - Role: `owner` with full permissions
3. Sets the new workspace as active
4. If creation fails, logs error but allows user to continue

## Workspace Resolution

### AppShell Integration

The C001-AppShell component (`app/C001-AppShell.tsx`) now:
1. Fetches user's active workspace on server-side
2. Passes workspace data to AppShellProvider
3. Makes workspace available via `useAppShell()` hook

### API User Endpoint

The `/api/user` endpoint now returns both account and workspace data:

```json
{
  "account": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": true,
    "roles": [],
    "metadata": {
      "displayName": "User Name",
      "profileUrl": null,
      "createdAt": "2026-01-10T00:00:00Z",
      "updatedAt": "2026-01-10T00:00:00Z"
    }
  },
  "workspace": {
    "id": "uuid",
    "slug": "my-workspace",
    "name": "My Workspace",
    "tier": "free",
    "members": [
      {
        "userId": "uuid",
        "role": "owner",
        "joinedAt": "2026-01-10T00:00:00Z"
      }
    ],
    "metadata": {
      "createdAt": "2026-01-10T00:00:00Z",
      "updatedAt": "2026-01-10T00:00:00Z"
    }
  }
}
```

## Hooks

### useAppShell()
Access account and workspace context:
```tsx
import { useAppShell } from '@/lib/context/AppShellContext';

function MyComponent() {
  const { account, workspace, loading, can, refresh } = useAppShell();
  
  if (loading) return <div>Loading...</div>;
  if (!workspace) return <div>No workspace</div>;
  
  return <div>Current workspace: {workspace.name}</div>;
}
```

### useWorkspaceContext()
Get workspace-specific information from UserProfile:
```tsx
import { useWorkspaceContext } from '@/lib/hooks/useAccountContext';

function MyComponent() {
  const { workspaceId, workspaceRole, organization, loading } = useWorkspaceContext();
  
  return <div>Workspace ID: {workspaceId}</div>;
}
```

## Database Schema

The implementation uses the following tables:

### workspaces
- `id`: UUID (primary key)
- `organization_name`: Workspace name
- `organization_type`: hoa | portfolio | management_company
- `primary_contact_email`: Contact email
- `is_active`: Boolean
- `metadata`: JSONB (includes slug)

### workspace_memberships
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users)
- `workspace_id`: UUID (foreign key to workspaces)
- `workspace_role`: owner | manager | editor | viewer
- `can_resolve_parcels`: Boolean
- `can_create_reports`: Boolean
- `can_share_reports`: Boolean
- `can_view_audit_log`: Boolean
- `can_manage_contacts`: Boolean
- `is_active`: Boolean

### user_active_workspace
- `user_id`: UUID (primary key)
- `workspace_id`: UUID
- `updated_at`: Timestamp

## Error Handling

The implementation includes comprehensive error handling:

1. **Workspace Creation Failures**: Logged but don't block user authentication
2. **Workspace Resolution Failures**: Component shows error state with retry option
3. **Missing Workspace**: Handled gracefully, user can create workspace later
4. **API Errors**: Proper HTTP status codes and error messages

## Testing

To test the implementation:

1. **New User Signup**: 
   - Sign up with a new account
   - Verify default workspace is created
   - Check workspace is set as active

2. **Workspace Switching**:
   - Create multiple workspaces via `/api/workspaces`
   - Switch between workspaces via `/api/workspace/active` POST
   - Verify workspace data updates without page reload

3. **Anonymous Users**:
   - Access app without authentication
   - Verify no errors occur
   - Check workspace is null

## Future Enhancements

Potential improvements for future iterations:

1. Workspace switcher UI component
2. Workspace settings page
3. Multi-workspace management
4. Workspace invitations and sharing
5. Workspace transfer functionality
6. Workspace tier management (upgrade/downgrade)
