# Team Management System Documentation

## Overview
This document describes the complete team management system including workspace invitations, team member management, email notifications, and entitlement checks.

## Features

### 1. Team Invitations
- **Send Invitations**: Admins and owners can invite new members via email
- **Accept/Reject**: Recipients can accept or reject invitations via a dedicated page
- **Resend**: Ability to resend pending invitations
- **Cancel**: Cancel pending invitations before they're accepted
- **Expiry**: Invitations automatically expire after 7 days

### 2. Team Member Management
- **View Members**: List all workspace members with their roles
- **Update Roles**: Owners can change member roles (admin/member)
- **Remove Members**: Admins and owners can remove members from the workspace
- **Role Hierarchy**: Owner > Admin > Member

### 3. Email Notifications
The system sends automated emails for:
- **Invitation Email**: Initial invitation with acceptance link
- **Reminder Email**: Reminder for pending invitations
- **Cancellation Email**: Notification when invitation is cancelled
- **Welcome Email**: Welcome message upon invitation acceptance

### 4. Entitlement Checks
- **Team Size Limits**: Enforces plan-based team size limits
  - Home Plan: 2 members
  - Studio Plan: 5 members
  - Portfolio Plan: 25 members
- **Invite Quota**: Tracks pending invites against plan limits
- **Authorization**: Validates user permissions for invite actions

## API Endpoints

### Invitations

#### Create Invitation
```
POST /api/team/invites
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "member",
  "workspaceId": "workspace-uuid"
}
```

#### List Invitations
```
GET /api/team/invites?workspaceId=workspace-uuid
```

#### Resend Invitation
```
PATCH /api/team/invites/{inviteId}
```

#### Cancel Invitation
```
DELETE /api/team/invites/{inviteId}
```

#### Accept Invitation
```
POST /api/team/invites/accept
Content-Type: application/json

{
  "token": "invitation-token"
}
```

### Team Members

#### List Members
```
GET /api/team/members?workspaceId=workspace-uuid
```

#### Update Member Role
```
PATCH /api/team/members/{memberId}
Content-Type: application/json

{
  "role": "admin"
}
```

#### Remove Member
```
DELETE /api/team/members/{memberId}
```

## Database Schema

### workspace_invites
- `id` (UUID): Primary key
- `workspace_id` (UUID): Foreign key to workspaces
- `email` (VARCHAR): Invitee email address
- `role` (VARCHAR): Member role (owner/admin/member)
- `invited_by` (UUID): Foreign key to users
- `token` (VARCHAR): Unique invitation token
- `status` (VARCHAR): Invitation status (pending/accepted/rejected/cancelled/expired)
- `expires_at` (TIMESTAMP): Expiration date
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

### workspace_members
- `id` (UUID): Primary key
- `workspace_id` (UUID): Foreign key to workspaces
- `user_id` (UUID): Foreign key to auth.users
- `role` (VARCHAR): Member role (owner/admin/member)
- `created_at` (TIMESTAMP): Join date
- `updated_at` (TIMESTAMP): Last update timestamp

## UI Components

### Team Management Page
Located at: `/settings/team`

Features:
- Display team information
- List all team members with avatars and roles
- Invite new members via dialog
- View pending invitations
- Resend or cancel invitations
- Remove team members with confirmation
- Display plan limits and current usage

### Invitation Acceptance Page
Located at: `/invites/accept?token={token}`

Features:
- Accept or decline invitation
- Display invitation details
- Redirect to dashboard on acceptance
- Handle expired or invalid invitations

## Security Considerations

1. **Authorization**: All endpoints verify user permissions
2. **Token Security**: Invitation tokens are 32-character random strings
3. **Rate Limiting**: Should be implemented at the API gateway level
4. **Email Verification**: Ensures invitation email matches authenticated user
5. **RLS Policies**: Row-level security enforced in database

## Usage Examples

### Inviting a Team Member
1. Navigate to Settings > Team
2. Click "Invite Member"
3. Enter email address and select role
4. Click "Send Invitation"
5. Invitee receives email with acceptance link

### Accepting an Invitation
1. Recipient clicks link in email
2. Redirected to invitation acceptance page
3. Click "Accept Invitation"
4. Automatically added to workspace
5. Redirected to dashboard

### Managing Team Members
1. Navigate to Settings > Team
2. View list of current members
3. Click trash icon to remove member (with confirmation)
4. Owner can change member roles

## Error Handling

### Common Error Scenarios
- **Team size limit reached**: Display upgrade prompt
- **Invalid invitation token**: Show error message
- **Expired invitation**: Notify user and offer to request new one
- **Duplicate invitation**: Prevent sending to existing members
- **Permission denied**: Display appropriate error message

## Future Enhancements

1. **Bulk Invitations**: Invite multiple users at once
2. **Custom Email Templates**: Allow workspace customization
3. **Invitation Analytics**: Track acceptance rates
4. **Guest Access**: Temporary limited access for non-members
5. **SSO Integration**: Single sign-on for enterprise plans
6. **Audit Trail**: Detailed logging of all team changes

## Testing

### Manual Testing Checklist
- [ ] Send invitation to new user
- [ ] Accept invitation as recipient
- [ ] Resend pending invitation
- [ ] Cancel pending invitation
- [ ] Remove team member
- [ ] Update member role
- [ ] Test plan limits enforcement
- [ ] Verify email delivery
- [ ] Test expired invitation handling
- [ ] Verify authorization checks

### Automated Tests
- Unit tests for API endpoints
- Integration tests for invitation flow
- E2E tests for UI interactions
