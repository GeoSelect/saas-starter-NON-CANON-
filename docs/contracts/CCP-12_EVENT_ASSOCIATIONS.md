# Contract: CCP-12 Event Associations (event-association-0.1)

## Overview
Role-Based Access Control (RBAC) system for tracking "who shared what with whom" through event associations. Provides governance warnings, permission management, and audit trails for share links.

## Core Concepts

### Roles
- **viewer**: Read-only access
- **commenter**: View + add comments
- **editor**: View + comment + edit
- **owner**: Full control + manage sharing

### Permissions
11 system permissions across 3 resource types:
- **snapshot**: view, comment, edit, delete
- **workspace**: view, invite_members, manage_members, manage_settings
- **contact**: view, create, edit

### Association Types
- **direct_share**: One-to-one sharing
- **group_share**: Share with multiple recipients
- **public_link**: Open access link

### Governance Warning Types
- **record_creation**: New data record being created
- **permanent_share**: Non-expiring share link
- **external_recipient**: Sharing outside organization
- **sensitive_data**: Sensitive information disclosure

---

## API Endpoints

### Roles

#### GET /api/roles
Get all available system roles.

**Response:**
```json
{
  "roles": [
    {
      "id": "uuid",
      "name": "viewer",
      "display_name": "Viewer",
      "description": "Can view reports",
      "hierarchy_level": 1,
      "is_system_role": true
    }
  ]
}
```

---

### Permissions

#### GET /api/permissions
Get system permissions, optionally filtered by resource type.

**Query Parameters:**
- `resource_type` (optional): `snapshot`, `workspace`, or `contact`

**Response:**
```json
{
  "permissions": [
    {
      "id": "uuid",
      "name": "snapshot:view",
      "display_name": "View Snapshot",
      "resource_type": "snapshot",
      "is_system_permission": true
    }
  ]
}
```

---

### Event Associations

#### POST /api/event-associations
Create a new event association (link share to recipient with role).

**Request Body:**
```json
{
  "share_link_id": "uuid (required)",
  "workspace_id": "uuid (required)",
  "snapshot_id": "uuid (optional)",
  "sharer_user_id": "uuid (required)",
  "recipient_contact_id": "uuid (required)",
  "role_name": "viewer|commenter|editor|owner (required)",
  "association_type": "direct_share|group_share|public_link (default: direct_share)",
  "share_reason": "string (optional)",
  "acknowledged_warning": "boolean (default: false)",
  "metadata": "object (optional)"
}
```

**Response:** 201 Created
```json
{
  "association": {
    "id": "uuid",
    "share_link_id": "uuid",
    "assigned_role_id": "uuid",
    "relationship_status": "active",
    "created_at": "timestamp"
  }
}
```

---

#### GET /api/event-associations/[id]
Get details of a specific event association.

**Response:** 200 OK
```json
{
  "association": {
    "id": "uuid",
    "share_link_id": "uuid",
    "workspace_id": "uuid",
    "recipient_contact_id": "uuid",
    "assigned_role_id": "uuid",
    "relationship_status": "active",
    "role": { "name": "viewer", "display_name": "Viewer" },
    "share_link": { "token": "...", "expires_at": "..." },
    "recipient_contact": { "email": "...", "name": "..." }
  }
}
```

---

#### PATCH /api/event-associations/[id]
Change the role of an existing association.

**Request Body:**
```json
{
  "new_role_name": "viewer|commenter|editor|owner (required)",
  "change_reason": "string (optional)"
}
```

**Response:** 200 OK
```json
{
  "association": {
    "id": "uuid",
    "assigned_role_id": "uuid",
    "relationship_status": "active"
  },
  "message": "Role changed successfully"
}
```

---

#### DELETE /api/event-associations/[id]
Revoke an event association (terminate access).

**Request Body:**
```json
{
  "revoke_reason": "string (optional)"
}
```

**Response:** 200 OK
```json
{
  "message": "Association revoked successfully"
}
```

---

### Association Permissions

#### GET /api/event-associations/[id]/permissions
Get all permissions for a specific association (role + overrides).

**Response:** 200 OK
```json
{
  "permissions": [
    {
      "permission_name": "snapshot:view",
      "permission_id": "uuid",
      "source": "role|override",
      "granted": true
    }
  ]
}
```

---

#### POST /api/event-associations/[id]/permissions
Grant or revoke a permission override for an association.

**Request Body:**
```json
{
  "permission_name": "snapshot:view|snapshot:edit|... (required)",
  "grant": "boolean (required)",
  "reason": "string (optional)"
}
```

**Response:** 200 OK
```json
{
  "override": {
    "association_id": "uuid",
    "permission_id": "uuid",
    "override_type": "grant|revoke",
    "created_at": "timestamp"
  },
  "message": "Permission override applied"
}
```

---

### Workspace Associations

#### GET /api/workspaces/[id]/associations
List all associations for a workspace.

**Query Parameters:**
- `status` (optional): `active`, `expired`, `revoked`, or `transferred`

**Response:** 200 OK
```json
{
  "associations": [
    {
      "id": "uuid",
      "recipient_contact": { "email": "...", "name": "..." },
      "role": { "name": "viewer", "display_name": "Viewer" },
      "relationship_status": "active",
      "share_reason": "...",
      "created_at": "timestamp"
    }
  ]
}
```

---

### Governance Warnings

#### GET /api/governance-warnings
Get pending governance warnings for current user.

**Query Parameters:**
- `workspace_id` (optional): Filter by workspace

**Response:** 200 OK
```json
{
  "warnings": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "warning_type": "external_recipient",
      "warning_context": { "recipient_email": "..." },
      "is_acknowledged": false,
      "created_at": "timestamp"
    }
  ]
}
```

---

#### POST /api/governance-warnings
Create a governance warning for user to acknowledge.

**Request Body:**
```json
{
  "warning_type": "record_creation|permanent_share|external_recipient|sensitive_data (required)",
  "workspace_id": "uuid (optional)",
  "warning_context": "object (optional)"
}
```

**Response:** 201 Created
```json
{
  "warning": {
    "id": "uuid",
    "warning_type": "external_recipient",
    "is_acknowledged": false,
    "created_at": "timestamp"
  }
}
```

---

#### POST /api/governance-warnings/[id]/acknowledge
Acknowledge a governance warning.

**Response:** 200 OK
```json
{
  "warning": {
    "id": "uuid",
    "is_acknowledged": true,
    "acknowledged_at": "timestamp"
  },
  "message": "Warning acknowledged"
}
```

---

## Specialized Endpoints

### POST /api/events/[id]/share-with-homeowner
**Purpose:** One-click share flow for HOA board member → homeowner. Combines share link creation, event association, and optional notification in a single API call.

**Request Body:**
```json
{
  "workspace_id": "uuid (required)",
  "snapshot_id": "uuid (required)",
  "homeowner_contact_id": "uuid (optional - if contact exists)",
  "homeowner_email": "string (required)",
  "homeowner_name": "string (optional)",
  "access_role": "viewer|commenter|editor (default: viewer)",
  "expires_in_days": "number (default: 30)",
  "share_reason": "string (optional)",
  "send_notification": "boolean (default: true)",
  "acknowledged_warning": "boolean (required: true)",
  "custom_message": "string (optional)"
}
```

**Defaults for Homeowner Shares:**
- `expires_in_days`: 30 (longer than standard 7 days)
- `requires_auth`: false (homeowners don't have accounts)
- `access_role`: viewer
- `association_type`: direct_share

**Response:** 201 Created
```json
{
  "shareLink": {
    "id": "uuid",
    "token": "string",
    "short_code": "string",
    "expires_at": "timestamp"
  },
  "association": {
    "id": "uuid",
    "assigned_role_id": "uuid",
    "relationship_status": "active"
  },
  "shareUrl": "https://app.example.com/shared/{token}",
  "shortUrl": "https://app.example.com/s/{short_code}",
  "notificationSent": true
}
```

**Error Responses:**
- `400` - Missing required fields or warning not acknowledged
  ```json
  {
    "error": "Governance warning must be acknowledged",
    "code": "WARNING_NOT_ACKNOWLEDGED"
  }
  ```
- `401` - Unauthorized (not logged in)
- `404` - Resource not found (workspace/snapshot/contact)
- `500` - Server error

**Side Effects:**
1. Creates `share_links` record (CCP-11)
2. Creates `event_associations` record (CCP-12)
3. Creates `governance_warnings` record
4. Logs events to `share_link_events` (CCP-15)
5. Sends email notification (if `send_notification: true`)

**Notes:**
- Requires authenticated user (HOA board member/staff)
- Automatically sets `requiresAuth: false` (homeowners don't need accounts)
- Creates governance warning record if `acknowledged_warning: true`
- Integrates with CCP-10 (Share Links) and CCP-15 (Audit Trail)

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE (optional)",
  "details": "Additional context (optional)"
}
```

### Common HTTP Status Codes
- **200** - Success (GET, PATCH, DELETE)
- **201** - Created (POST)
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (not logged in)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource doesn't exist)
- **500** - Internal Server Error

### Error Codes
| Code | Status | Condition | User Message |
|------|--------|-----------|--------------|
| `WARNING_NOT_ACKNOWLEDGED` | 400 | Governance warning not acknowledged | "Please acknowledge the governance warning before proceeding" |
| `INVALID_ROLE` | 400 | Role name not found | "Invalid role specified" |
| `INVALID_PERMISSION` | 400 | Permission name not found | "Invalid permission specified" |
| `ASSOCIATION_NOT_FOUND` | 404 | Association ID invalid | "Association not found" |
| `WORKSPACE_NOT_FOUND` | 404 | Workspace ID invalid | "Workspace not found" |
| `UNAUTHORIZED` | 401 | No valid session | "Please log in to continue" |
| `FOREIGN_KEY_VIOLATION` | 400 | Invalid foreign key | "Invalid workspace, snapshot, or contact ID" |

---

## Integration Points

### CCP-10 (Share Links)
- Event associations link to share links via `share_link_id`
- Uses `createShareLink()` to generate secure tokens
- Inherits expiration and access control from share links

### CCP-15 (Audit Trail)
- Logs all association events via `share_link_events` table
- Tracks role changes in `role_change_history`
- Provides audit trail for compliance

### CCP-09 (Contacts)
- Associates recipients via `recipient_contact_id`
- Auto-populates email when contact selected
- Supports both existing and new contacts

---

## Database Schema

### Key Tables
- `roles` - System roles with hierarchy
- `permissions` - Granular permissions
- `role_permissions` - Role → permission mappings
- `event_associations` - Core linking table
- `event_association_permissions` - Permission overrides
- `role_change_history` - Audit trail
- `governance_warnings` - Compliance tracking

### Relationships
```
share_links (CCP-10)
    ↓
event_associations
    ├→ roles
    ├→ contacts (CCP-09)
    ├→ workspaces (CCP-05)
    └→ report_snapshots
        ↓
event_association_permissions
    └→ permissions
```

---

## Usage Examples

### Example 1: Share Report with Homeowner
```typescript
// 1. User clicks "Share with Homeowner" button
// 2. Component shows governance warning dialog
// 3. User acknowledges warning
// 4. Submit to API
const response = await fetch('/api/events/123/share-with-homeowner', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workspace_id: 'workspace-uuid',
    snapshot_id: 'snapshot-uuid',
    homeowner_email: 'john@example.com',
    homeowner_name: 'John Doe',
    share_reason: 'ARC violation review',
    acknowledged_warning: true,
    custom_message: 'Please review the attached report.'
  })
});
// 5. Email sent, share link created, association tracked
```

### Example 2: Change Association Role
```typescript
// Upgrade homeowner from viewer to commenter
await fetch('/api/event-associations/assoc-uuid', {
  method: 'PATCH',
  body: JSON.stringify({
    new_role_name: 'commenter',
    change_reason: 'Need homeowner feedback on violations'
  })
});
```

### Example 3: Grant Permission Override
```typescript
// Allow viewer to edit just this one report
await fetch('/api/event-associations/assoc-uuid/permissions', {
  method: 'POST',
  body: JSON.stringify({
    permission_name: 'snapshot:edit',
    grant: true,
    reason: 'Temporary edit access for corrections'
  })
});
```

---

## Version History
- **0.1** (2026-01-04): Initial version with RBAC and homeowner sharing
