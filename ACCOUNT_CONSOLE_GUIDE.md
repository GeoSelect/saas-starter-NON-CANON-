# Account Console - Complete Guide

## Overview

The **Account Console** at `/app/(dashboard)/audit` is now the centralized hub for account management. It combines workspace management, team oversight, and security auditing in one place.

## What's New

The page has been transformed from a simple audit log viewer into a comprehensive account management dashboard with:

### 1. Active Workspace Display
- Shows currently selected workspace
- Displays workspace name, description, and plan
- Quick visual indicator of active workspace

### 2. Quick Stats Card
- **Total Workspaces** - Count of all user's workspaces
- **Recent Activity** - Number of logged events
- **New Workspace Button** - Quick action to create workspace

### 3. Your Workspaces Grid
- Visual grid of all user workspaces
- Shows workspace name, description, and plan
- **Active workspace highlighted** in orange
- Hover effects for better UX

### 4. Activity Log Section
- **Summary Cards**: Total events, successful logins, failed attempts
- **Full Activity Table**: Detailed audit trail with filters
  - Date & Time
  - User information
  - Account plan
  - Action type with icon
  - IP address
  - Status badge

## Component Architecture

```
AccountConsole (audit/page.tsx)
├── Header (with WorkspaceSwitcherDropdown)
├── Active Workspace Card
├── Quick Stats Card
├── Your Workspaces Grid
├── Workspace Settings Panel (Edit form / View)
├── Team Members Section (Invite form / Member list)
├── Account Settings Panel (Edit form / View settings)
├── Activity Log Summary Cards
├── Activity Log Table
└── Footer
```

## Features

### Workspace Management
- View all workspaces at a glance
- See active workspace highlighted
- Quick stats on workspace count
- Visual plan indicator for each workspace

### Edit Workspace Settings
- **Toggle-able form** - Click "Edit Workspace" button
- Update workspace name
- Edit workspace description
- Change plan level
- Save or cancel changes
- Live preview of settings when not editing

### Team Member Management
- **Invite team members** by email
- Set role: Member, Admin, or Viewer
- View current team members with avatars and roles
- Remove team members
- See owner/admin status clearly

### Account Settings
- **Update profile information**
  - Display name
  - Email address
- **Security options**
  - Change password
  - Enable two-factor authentication
- **Notification preferences**
  - Account activity emails
  - Workspace update emails
- Settings displayed when not editing
- Full form available for updates

### Activity Monitoring
- Complete audit trail of all actions
- Sortable by date, user, action type
- Status indicators (success/failure)
- IP address tracking for security
- User agent logging (future enhancement)

### Security Features
- Failed login tracking
- IP address monitoring
- Action type categorization
- Timestamp logging
- User email verification

## Usage

### As an Account Owner
1. Navigate to `dashboard/audit`
2. See all your workspaces at a glance
3. Switch workspaces using the dropdown in header
4. **Edit workspace settings** - Click "Edit Workspace" button to update name, description, plan
5. **Manage team members** - Click "Manage Team" to invite members and set roles
6. **Update account settings** - Click "Edit Settings" to change profile, password, 2FA
7. Review activity logs for security audit
8. Track failed login attempts

### As a Team Member
1. View your active workspace
2. See workspace settings and team members
3. Update personal account settings
4. View your recent activity
5. Monitor login history
6. Review team member list

## Customization

### Connect to Backend APIs

The console is currently wired with placeholder forms. To connect to real data:

**Edit Workspace Settings:**
```tsx
const handleSaveWorkspace = async (data) => {
  const response = await fetch(`/api/workspaces/${activeWorkspaceId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  // Refresh workspace data
};
```

**Team Member Management:**
```tsx
const handleInviteMember = async (email, role) => {
  const response = await fetch(`/api/workspaces/${activeWorkspaceId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email, role })
  });
  // Refresh member list
};

const handleRemoveMember = async (userId) => {
  await fetch(`/api/workspaces/${activeWorkspaceId}/members/${userId}`, {
    method: 'DELETE'
  });
  // Refresh member list
};
```

**Account Settings:**
```tsx
const handleSaveSettings = async (data) => {
  const response = await fetch('/api/account/settings', {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  // Update user data
};
```

### Enhance UI/UX

- Add loading spinners during API calls
- Show success/error toast notifications
- Add confirmation dialogs before destructive actions
- Implement form validation
- Add progress indicators for team invitations
- Show password strength meter for change password
- Add avatar upload for profile picture

### Extend Features

- Role-based access control (hide edit buttons for non-owners)
- Audit log filters and search
- Workspace templates on creation
- Team member invitation expiry
- SSO integration options
- API key management
- Webhook configuration

## Data Flow

```
useWorkspaces Hook
├── workspaces[]
├── activeWorkspace
├── activeWorkspaceId
└── selectWorkspace()

+ Audit Logs API
  └── /api/audit/log?limit=100
      └── logs[]
          ├── user_id
          ├── action
          ├── timestamp
          ├── ip_address
          └── status
```

## Future Enhancements

- [ ] Export activity logs to CSV
- [ ] Activity filters (by date range, action type, user)
- [ ] Workspace creation wizard from console
- [ ] Team member management
- [ ] Account settings panel
- [ ] Two-factor authentication settings
- [ ] Session management (revoke active sessions)
- [ ] IP whitelist management
- [ ] Activity search with full-text search
- [ ] Alert configuration for suspicious activity

## Performance Considerations

- Activity logs load with limit=100 (configurable)
- Workspace list loads on mount via `useWorkspaces`
- Summary stats computed from loaded logs
- Consider pagination for large audit trails

## Security

- Workspace switcher sets httpOnly cookie
- All actions logged to audit_logs table
- IP address and user agent tracked
- RLS policies enforce workspace isolation
- Activity visible only to workspace members

## Testing Checklist

- [ ] Header displays with workspace switcher
- [ ] Active workspace highlights correctly
- [ ] Workspace count matches actual workspaces
- [ ] Activity logs load without errors
- [ ] Summary cards calculate correctly
- [ ] Failed logins counted accurately
- [ ] Action icons display correctly
- [ ] Status badges show correct color
- [ ] Responsive layout on mobile
- [ ] Footer displays properly

## Files Modified

- `app/(dashboard)/audit/page.tsx` - Enhanced with account console features
- `hooks/useWorkspaces.ts` - Provides workspace data
- `components/Header.tsx` - Contains workspace switcher
- `components/WorkspaceSwitcherDropdown.tsx` - Dropdown component

## Related Documentation

- [Workspace Switcher Integration](WORKSPACE_SWITCHER_INTEGRATION.md)
- [Header Integration Guide](HEADER_INTEGRATION_GUIDE.md)
- [Workspace System](WORKSPACE_IMPLEMENTATION.md)
