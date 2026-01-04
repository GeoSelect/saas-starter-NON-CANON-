# CCP-09: Contacts Access

## Overview

Comprehensive contacts management system for HOA members, homeowners, external contacts, and vendors with role-based permissions and group management.

**Status:** ✅ Complete  
**Tests:** 62 (all passing)  
**Tables:** 4 (contacts, contact_groups, contact_group_members, contact_permissions)

---

## Schema

### contacts table
Core contact information with verification and membership tracking.

**Fields:**
- `id` - UUID primary key
- `email` - Contact email (unique per workspace)
- `first_name`, `last_name` - Contact name
- `phone` - Optional phone number
- `workspace_id` - Workspace association
- `contact_type` - hoa_member | homeowner | external | vendor
- `verification_status` - unverified | pending | verified
- `verified_at`, `verified_by` - Verification audit trail
- `hoa_id`, `parcel_id` - HOA and property links
- `membership_status` - active | inactive | suspended (HOA members only)
- `avatar_url` - Profile picture
- `metadata` - Flexible JSONB storage
- `created_at`, `updated_at` - Timestamps

**Constraints:**
- UNIQUE(workspace_id, email)
- CHECK: hoa_member contacts must have membership_status
- CHECK: non-hoa contacts cannot have membership_status

**Indexes:**
- workspace_id
- (workspace_id, email)
- (workspace_id, contact_type)
- (workspace_id, verification_status)
- parcel_id

### contact_groups table
Groups for bulk operations (HOA Board, committees, etc.)

**Fields:**
- `id` - UUID primary key
- `workspace_id` - Workspace association
- `name` - Group name
- `description` - Optional description
- `group_type` - hoa_board | arc_committee | homeowners | custom
- `created_by` - User who created group
- `created_at`, `updated_at` - Timestamps

**Constraints:**
- UNIQUE(workspace_id, name)

**Indexes:**
- workspace_id

### contact_group_members table
Many-to-many: contacts ↔ groups

**Fields:**
- `contact_id` - FK to contacts
- `group_id` - FK to contact_groups
- `added_at` - When member was added
- `added_by` - User who added member

**Constraints:**
- PRIMARY KEY (contact_id, group_id)

**Indexes:**
- group_id

### contact_permissions table
Fine-grained permissions for accessing contacts

**Fields:**
- `id` - UUID primary key
- `workspace_id` - Workspace association
- `user_id` - User who has permission
- `contact_id` - Contact being shared
- `can_view_details` - Can view full contact details
- `can_share` - Can share contact with others
- `can_edit` - Can modify contact
- `granted_by` - User who granted permission
- `granted_at` - Timestamp

**Constraints:**
- UNIQUE(workspace_id, user_id, contact_id)

**Indexes:**
- (workspace_id, user_id)
- contact_id

---

## RLS Policies

All tables enforce workspace membership via RLS.

**Policy Pattern:**
```sql
workspace_id IN (
  SELECT workspace_id FROM workspace_members 
  WHERE user_id = auth.uid()
)
```

### contacts table
- SELECT: workspace members only
- INSERT/UPDATE: workspace members only
- DELETE: workspace members only (app restricts further)

### contact_groups table
- SELECT: workspace members only
- INSERT/UPDATE: workspace members only
- DELETE: workspace members only (app restricts further)

### contact_group_members table
- SELECT: workspace members only
- INSERT/DELETE: workspace members only

### contact_permissions table
- SELECT: workspace members only
- INSERT/UPDATE: workspace members only (app restricts further)
- DELETE: workspace members only

---

## Helper Functions

### Contacts CRUD

**createContact(workspaceId, data)**
- Creates new contact with validation
- Enforces contact_type ↔ membership_status relationship
- Returns: `{ ok, contact | error }`

**getContact(contactId)**
- Retrieves single contact by ID
- Returns: `{ ok, contact | error }`

**listContacts(workspaceId, options)**
- Lists contacts with filtering
- Filters: contact_type, verification_status, membership_status
- Pagination: limit, offset
- Returns: `{ ok, contacts, count | error }`

**updateContact(contactId, updates)**
- Updates contact fields
- Returns: `{ ok, contact | error }`

**verifyContact(contactId, verifiedBy)**
- Marks contact as verified
- Tracks verified_at and verified_by
- Returns: `{ ok, contact | error }`

**deleteContact(contactId)**
- Deletes contact (cascades group memberships, permissions)
- Returns: `{ ok | error }`

### Contact Groups

**createContactGroup(workspaceId, data, createdBy)**
- Creates group (hoa_board, arc_committee, homeowners, custom)
- Returns: `{ ok, group | error }`

**getContactGroup(groupId)**
- Retrieves group details
- Returns: `{ ok, group | error }`

**listContactGroups(workspaceId, options)**
- Lists groups with optional type filtering
- Returns: `{ ok, groups, count | error }`

**updateContactGroup(groupId, updates)**
- Updates group name/description
- Returns: `{ ok, group | error }`

**deleteContactGroup(groupId)**
- Deletes group (cascades memberships)
- Returns: `{ ok | error }`

### Group Membership

**addContactToGroup(contactId, groupId, addedBy)**
- Adds contact to group
- Tracks who added member
- Returns: `{ ok | error }`

**removeContactFromGroup(contactId, groupId)**
- Removes contact from group
- Returns: `{ ok | error }`

**listGroupMembers(groupId)**
- Lists all contacts in group
- Returns: `{ ok, members | error }`

### Permissions

**grantContactPermission(workspaceId, userId, contactId, options, grantedBy)**
- Grants permissions to user on contact
- Options: can_share, can_view_details, can_edit
- Upserts (updates if exists)
- Returns: `{ ok, permission | error }`

**checkContactPermission(userId, contactId, permissionType)**
- Checks if user has specific permission
- PermissionType: can_view_details | can_share | can_edit
- Returns: boolean

**revokeContactPermission(workspaceId, userId, contactId)**
- Removes all permissions
- Returns: `{ ok | error }`

**getContactPermissions(contactId)**
- Lists all permissions for contact
- Returns: `{ ok, permissions | error }`

---

## API Endpoints (Frozen Contract)

### POST /api/contacts
Create contact
```typescript
{
  email: string (unique per workspace)
  first_name: string
  last_name: string
  phone?: string
  contact_type: "hoa_member" | "homeowner" | "external" | "vendor"
  hoa_id?: string
  parcel_id?: string
  membership_status?: "active" | "inactive" | "suspended" (required if hoa_member)
  avatar_url?: string
  metadata?: Record<string, any>
}
```

**Response:**
```typescript
{
  ok: true
  contact: Contact
} | {
  ok: false
  error: string
}
```

### GET /api/contacts
List contacts with filtering
```typescript
Query:
  contact_type?: ContactType
  verification_status?: VerificationStatus
  membership_status?: MembershipStatus
  limit?: number (default 50)
  offset?: number (default 0)
```

**Response:**
```typescript
{
  ok: true
  contacts: Contact[]
  count: number
}
```

### GET /api/contacts/:id
Get contact details

**Response:**
```typescript
{
  ok: true
  contact: Contact
}
```

### PATCH /api/contacts/:id
Update contact
- Can update: phone, avatar_url, metadata
- Cannot update: email, contact_type, workspace_id
- Use POST /api/contacts/:id/verify for verification

**Response:**
```typescript
{
  ok: true
  contact: Contact
}
```

### POST /api/contacts/:id/verify
Verify contact (sets verification_status = "verified")

**Response:**
```typescript
{
  ok: true
  contact: Contact
}
```

### DELETE /api/contacts/:id
Delete contact (cascades group memberships and permissions)

### GET /api/contact-groups
List groups

**Response:**
```typescript
{
  ok: true
  groups: ContactGroup[]
  count: number
}
```

### POST /api/contact-groups
Create group
```typescript
{
  name: string
  description?: string
  group_type: "hoa_board" | "arc_committee" | "homeowners" | "custom"
}
```

### POST /api/contact-groups/:id/members
Add contact to group
```typescript
{
  contact_id: string
}
```

### DELETE /api/contact-groups/:id/members/:contactId
Remove contact from group

### GET /api/contact-groups/:id/members
List group members

### POST /api/contact-permissions
Grant permission to contact
```typescript
{
  user_id: string
  contact_id: string
  can_view_details?: boolean (default true)
  can_share?: boolean (default true)
  can_edit?: boolean (default false)
}
```

### GET /api/contact-permissions/:contactId
List all permissions for contact

### DELETE /api/contact-permissions/:id
Revoke permission

---

## Test Coverage

**62 Tests** covering:

### API Contract (20 tests)
- Contact CRUD schema validation
- Contact type validation
- Membership status constraints
- Filtering and pagination
- Group operations
- Permission management

### RLS Enforcement (14 tests)
- Workspace isolation
- Authentication enforcement
- Group access control
- Permission-based access
- Deterministic error handling

### Business Logic (18 tests)
- Contact type validation
- Verification workflow
- Group membership management
- Permission grant workflow
- Metadata flexibility
- Contact-type constraints

### CCP-05 Integration (7 tests)
- Workspace membership verification
- Active workspace context
- Audit trail integration
- Multi-workspace scenarios

### Batch Operations & Data Consistency (3 tests)
- Bulk contact import
- Bulk permissions
- Constraint enforcement

---

## Frozen Contract

**contacts-0.1**
- Contact CRUD operations
- Contact types: hoa_member, homeowner, external, vendor
- Verification status: verified, pending, unverified
- Membership status (hoa_member only): active, inactive, suspended
- Email uniqueness per workspace
- Flexible metadata storage

**contact-groups-0.1**
- Group CRUD operations
- Group types: hoa_board, arc_committee, homeowners, custom
- Group name uniqueness per workspace
- Member management (add/remove)

**contact-permissions-0.1**
- Permission grant/revoke
- Three permission types: can_view_details, can_share, can_edit
- User-to-contact permissions
- Unique per workspace/user/contact

---

## Security

### Row-Level Security
✅ All tables require workspace membership
✅ Auth.uid() enforcement
✅ No cross-workspace access
✅ Cascade deletion on workspace delete

### Deterministic Errors
✅ 403 for forbidden access
✅ No information leakage
✅ Consistent error codes

### Permission Model
✅ Fine-grained permissions (view, share, edit)
✅ Permission grant audit trail
✅ User-based access control
✅ Can revoke at any time

---

## Integration

### CCP-05 (Active Workspace)
- Uses workspace_members table for RLS
- Scoped to active workspace context
- Audit fields track user_id

### CCP-07 (Data Sources & Rules)
- Contact parcel_id links to CCP-07 rules
- Permissions can be used for rule sharing

### Future CCPs
- CCP-10: Report Sharing (contacts as recipients)
- CCP-11: Notifications (contacts for notifications)

---

## Examples

### Create HOA Member
```typescript
const result = await createContact("ws-1", {
  email: "jane@hoa.com",
  first_name: "Jane",
  last_name: "Smith",
  contact_type: "hoa_member",
  membership_status: "active",
  metadata: { role: "board_president" },
});
```

### Create Group and Add Members
```typescript
const group = await createContactGroup(
  "ws-1",
  {
    name: "HOA Board 2024",
    group_type: "hoa_board",
  },
  "user-1"
);

await addContactToGroup("contact-1", group.group.id, "user-1");
await addContactToGroup("contact-2", group.group.id, "user-1");
```

### Grant Permission to Share Contact
```typescript
await grantContactPermission(
  "ws-1",
  "user-2",
  "contact-1",
  { can_share: true, can_view_details: true, can_edit: false },
  "user-1"
);
```

### List HOA Members
```typescript
const result = await listContacts("ws-1", {
  contact_type: "hoa_member",
  membership_status: "active",
});
```

---

## Status

✅ Schema created
✅ RLS policies enforced
✅ Helper functions implemented
✅ 62 tests (all passing)
✅ Frozen contract defined
✅ Ready for API routes

---

## Next Steps

1. **API Routes** - Implement endpoints per frozen contract
2. **Bulk Operations** - Batch import/export contacts
3. **Contact Search** - Full-text search by name/email
4. **Group Templates** - Pre-defined group structures
5. **Contact Sync** - Integration with external sources
