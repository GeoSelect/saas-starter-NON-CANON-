# Workspace Feature Implementation Guide

## Overview
This guide documents the complete workspace feature that enables users to:
- Create and manage workspaces
- Track user activity within workspaces
- Generate reports from activity data
- Share reports publicly with optional password protection and expiration dates
- Control access so only workspace members can save/share reports, while public users can only download shared reports

## Database Schema

### Tables Created

1. **workspaces** - Core workspace data
   - `id` (UUID, Primary Key)
   - `name`, `slug`, `description`
   - `owner_id` (references auth.users)
   - `plan_id` (references PLANS from lib/features)
   - `created_at`, `updated_at`

2. **users_workspaces** - Team membership junction table
   - `id` (UUID, Primary Key)
   - `user_id`, `workspace_id`
   - `role` (owner, admin, member, viewer)
   - `joined_at`
   - Unique constraint on (user_id, workspace_id)

3. **activity_logs** - User action tracking
   - `id` (UUID, Primary Key)
   - `workspace_id`, `user_id`
   - `action_type` (login, data_accessed, feature_used, report_created, report_shared, report_downloaded, user_invited, settings_changed)
   - `action_description`, `metadata` (JSONB)
   - `ip_address`, `user_agent`
   - `created_at`

4. **reports** - Report storage
   - `id` (UUID, Primary Key)
   - `workspace_id`, `created_by`
   - `title`, `description`
   - `report_type` (activity_summary, data_export, analytics)
   - `file_url`, `file_format` (pdf, csv, json)
   - `data_json` (JSONB for raw data)
   - `is_public`
   - `created_at`, `updated_at`

5. **shared_reports** - Public sharing management
   - `id` (UUID, Primary Key)
   - `report_id`, `share_token` (unique)
   - `shared_by`
   - `password_hash` (optional)
   - `expires_at`, `max_downloads`
   - `download_count`, `is_active`
   - `created_at`

### Row Level Security (RLS)
All tables have RLS enabled with policies ensuring:
- Users can only see workspaces they own or are members of
- Activity logs are visible only to workspace members
- Reports are accessible based on workspace membership
- Shared reports are publicly accessible via token

## API Endpoints

### Workspace Management

#### `POST /api/workspaces`
Create a new workspace
```json
{
  "name": "My Workspace",
  "slug": "my-workspace",
  "description": "Optional description"
}
```

#### `GET /api/workspaces`
Get all workspaces for current user

#### `GET /api/workspaces/:id`
Get specific workspace

#### `PATCH /api/workspaces/:id`
Update workspace (owner only)

#### `DELETE /api/workspaces/:id`
Delete workspace (owner only)

### Workspace Members

#### `GET /api/workspaces/:id/members`
Get all members of a workspace

#### `POST /api/workspaces/:id/invite`
Invite user to workspace (owner only)
```json
{
  "email": "user@example.com",
  "role": "member"
}
```

#### `PATCH /api/workspaces/:id/members/:userId`
Update member role (owner only)

#### `DELETE /api/workspaces/:id/members/:userId`
Remove member from workspace

### Activity Logging

#### `GET /api/activity-logs`
Get activity logs with filtering
```
?workspace_id=...&action_type=...&start_date=...&end_date=...&limit=100&offset=0
```

#### `POST /api/activity-logs`
Create new activity log entry
```json
{
  "workspace_id": "...",
  "action_type": "report_created",
  "action_description": "Created report: Sales Report",
  "metadata": {
    "report_id": "...",
    "report_type": "analytics"
  }
}
```

### Reports

#### `POST /api/reports`
Create a new report
```json
{
  "workspace_id": "...",
  "title": "Sales Report",
  "description": "Q1 2026 Sales",
  "report_type": "analytics",
  "file_format": "pdf",
  "data": { /* report data */ }
}
```

#### `GET /api/reports`
Get reports for workspace
```
?workspace_id=...&limit=50&offset=0
```

#### `GET /api/reports/:id`
Get specific report (public or member access)

#### `PATCH /api/reports/:id`
Update report (creator only)

#### `DELETE /api/reports/:id`
Delete report (creator only)

### Report Sharing

#### `POST /api/reports/:id/share`
Create public share link
```json
{
  "password": "optional-password",
  "expires_in_days": 30,
  "max_downloads": 100
}
```

Returns:
```json
{
  "id": "...",
  "report_id": "...",
  "share_token": "...",
  "share_url": "https://yoursite.com/reports/shared/token",
  "expires_at": "...",
  "max_downloads": 100,
  "download_count": 0,
  "is_active": true
}
```

#### `GET /api/reports/shared/:token`
Get shared report (public endpoint)
```
?password=optional-password
```

## Client Libraries

### Workspace Management (`lib/workspace-client.ts`)
```typescript
createWorkspace(data)
getUserWorkspaces()
getWorkspace(workspace_id)
getWorkspaceBySlug(slug)
updateWorkspace(workspace_id, updates)
getWorkspaceMembers(workspace_id)
inviteUserToWorkspace(workspace_id, email, role)
updateUserRole(workspace_id, user_id, role)
removeUserFromWorkspace(workspace_id, user_id)
getWorkspaceStats(workspace_id)
deleteWorkspace(workspace_id)
```

### Activity Logging (`lib/activity-logger.ts`)
```typescript
logActivity(options)          // Client-side
getActivityLogs(workspace_id, filters)
getActivityStats(workspace_id, days)
logActivityServer(options, supabaseClient)  // Server-side
```

### Report Management (`lib/report-client.ts`)
```typescript
createReport(data)
getWorkspaceReports(workspace_id, limit, offset)
getReport(report_id)
updateReport(report_id, updates)
deleteReport(report_id)
shareReport(report_id, options)
getSharedReport(share_token, password)
downloadReport(report, format)
downloadSharedReport(share_token, format, password)
exportReportAsCSV(report)
exportReportAsJSON(report)
```

## React Components

### WorkspaceDashboard (`components/WorkspaceDashboard.tsx`)
Main dashboard showing:
- Workspace name and description
- Statistics cards (users, activity, reports, shares)
- Activity distribution pie chart
- Recent activity feed
- Detailed activity logs table

Usage:
```tsx
<WorkspaceDashboard workspace_id={id} />
```

### ReportsList (`components/ReportsList.tsx`)
Displays all reports with actions:
- Download report (PDF)
- Share report (generates link)
- Delete report
- Copy share link

Usage:
```tsx
<ReportsList workspace_id={id} />
```

### MembersManager (`components/MembersManager.tsx`)
Manage workspace members (owner only):
- Invite new members
- Change member roles
- Remove members
- View join dates

Usage:
```tsx
<MembersManager workspace_id={id} is_owner={true} />
```

## Type Definitions (`lib/types/workspace.ts`)

```typescript
interface Workspace { /* ... */ }
interface UserWorkspace { /* ... */ }
interface ActivityLog { /* ... */ }
interface Report { /* ... */ }
interface SharedReport { /* ... */ }
interface WorkspaceStats { /* ... */ }
interface CreateWorkspaceRequest { /* ... */ }
interface CreateReportRequest { /* ... */ }
interface ShareReportRequest { /* ... */ }
interface ActivityFilter { /* ... */ }
```

## Security Features

### Access Control
- ✅ Only workspace members can view/edit workspace data
- ✅ Only workspace owner can manage members and settings
- ✅ Only report creator can delete/edit reports
- ✅ Only workspace members can create and share reports
- ✅ Public users can only access shared reports via token

### Activity Tracking
- ✅ All actions logged with timestamp, user ID, and metadata
- ✅ IP address and user agent captured for security audits
- ✅ Action types categorized for analytics

### Report Sharing
- ✅ Unique tokens prevent guessing
- ✅ Optional password protection
- ✅ Expiration dates (optional)
- ✅ Download limits (optional)
- ✅ Inactive links can be disabled
- ✅ Public download logs activity

## Database Migration

Run the migration file to create all tables:
```sql
-- Located at: db/migrations/001_create_workspace_schema.sql
```

## Environment Variables

Ensure these are set in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_DOMAIN=http://localhost:3000
```

## Integration Example

### Create a Workspace
```tsx
import { createWorkspace } from '@/lib/workspace-client';

async function createMyWorkspace() {
  const workspace = await createWorkspace({
    name: 'Sales Team',
    slug: 'sales-team',
    description: 'Track sales activities and reports'
  });
  
  return workspace;
}
```

### Log Activity
```tsx
import { logActivity } from '@/lib/activity-logger';

async function trackLogin(workspaceId: string, userId: string) {
  await logActivity({
    workspace_id: workspaceId,
    user_id: userId,
    action_type: 'login',
    action_description: 'User logged in',
  });
}
```

### Generate and Share Report
```tsx
import { createReport, shareReport } from '@/lib/report-client';

async function generateAndShareReport(workspaceId: string) {
  // Create report
  const report = await createReport({
    workspace_id: workspaceId,
    title: 'Q1 Sales Report',
    report_type: 'analytics',
    data: { /* analytics data */ }
  });
  
  // Generate share link
  const shared = await shareReport(report.id, {
    expires_in_days: 30,
    password: 'optional-password'
  });
  
  return shared.share_url;
}
```

## Next Steps

1. **Run Database Migration**: Execute the SQL migration to create tables
2. **Install Dependencies**: Ensure `recharts` is installed for dashboard charts
3. **Test API Endpoints**: Verify all endpoints are working
4. **Integrate Components**: Add dashboard to your app's layout
5. **Configure Policies**: Customize workspace settings and permissions
6. **Add Notifications**: Implement email notifications for invites and shares
7. **Advanced Analytics**: Create custom report templates based on your needs

## Notes

- Activity logs are automatically created when reports are shared/downloaded
- Workspace slugs must be unique and URL-friendly
- Reports support JSONB for flexible data storage
- All timestamps are stored in UTC
- Password hashes use bcrypt with salt rounds of 10
- Share tokens are 64-character hex strings (32 bytes)
