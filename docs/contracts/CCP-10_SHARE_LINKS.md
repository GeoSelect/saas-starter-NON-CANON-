# Contract: CCP-10 Share Links v0.1

**Status**: ✅ Implemented  
**Date**: January 4, 2026  
**Dependencies**: CCP-09 (Contacts), CCP-15 (Audit Trail)

---

## Overview
Secure, time-limited sharing of report snapshots with external recipients via cryptographically secure links.

## Architecture

### Security
- **Secure Tokens**: 32-byte cryptographic tokens (base64 encoded)
- **Short Codes**: 8-character alphanumeric codes (base64url) for easy sharing
- **Time-Limited**: Configurable expiration (default: 7 days)
- **Role-Scoped**: `viewer`, `commenter`, `editor` permissions
- **Audit Trail**: All events logged to `share_link_events` table (CCP-15)
- **Revocable**: Instant access revocation capability

### Data Model
```sql
-- Primary table
share_links (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  snapshot_id UUID REFERENCES report_snapshots(id),
  created_by UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  short_code TEXT UNIQUE,
  recipient_contact_id UUID REFERENCES contacts(id),
  recipient_email TEXT,
  access_role TEXT CHECK (access_role IN ('viewer', 'commenter', 'editor')),
  requires_auth BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  view_count INT DEFAULT 0,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  max_views INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Audit trail
share_link_events (
  id UUID PRIMARY KEY,
  share_link_id UUID REFERENCES share_links(id),
  event_type TEXT CHECK (event_type IN ('created', 'viewed', 'downloaded', 'revoked', 'expired', 'access_denied')),
  actor_user_id UUID REFERENCES auth.users(id),
  actor_ip_address INET,
  actor_user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Permissions (future extensibility)
share_link_permissions (
  id UUID PRIMARY KEY,
  share_link_id UUID REFERENCES share_links(id),
  permission_type TEXT,
  is_granted BOOLEAN DEFAULT true,
  granted_at TIMESTAMPTZ DEFAULT now()
)

-- Notifications (integration with notification system)
share_notifications (
  id UUID PRIMARY KEY,
  share_link_id UUID REFERENCES share_links(id),
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT CHECK (status IN ('pending', 'sent', 'failed')),
  custom_message TEXT,
  metadata JSONB DEFAULT '{}'
)
```

---

## API Endpoints

### POST /api/share-links
**Create new share link**

**Request:**
```typescript
{
  workspace_id: string;          // UUID - required
  snapshot_id: string;           // UUID - required
  recipient_contact_id?: string; // UUID - optional (from CCP-09)
  recipient_email?: string;      // Email address - optional
  access_role?: string;          // 'viewer' | 'commenter' | 'editor' - default: 'viewer'
  requires_auth?: boolean;       // Require login - default: false
  expires_in_days?: number;      // Days until expiration - default: 7
  max_views?: number;            // Max view limit - optional
  send_notification?: boolean;   // Send email notification - default: true
  custom_message?: string;       // Personal message in notification - optional
  metadata?: object;             // Additional metadata - optional
}
```

**Response (201):**
```typescript
{
  share_link: {
    id: string;
    token: string;
    short_code: string;
    workspace_id: string;
    snapshot_id: string;
    created_by: string;
    recipient_email?: string;
    access_role: string;
    requires_auth: boolean;
    expires_at: string;           // ISO 8601
    view_count: number;
    created_at: string;           // ISO 8601
  }
}
```

**Errors:**
- `400` - Invalid input (missing required fields)
- `401` - Unauthorized
- `403` - Forbidden (no access to workspace)
- `500` - Server error

---

### GET /api/share-links?snapshot_id=...&workspace_id=...
**List share links for a snapshot or workspace**

**Query Parameters:**
- `snapshot_id` - Filter by snapshot (optional)
- `workspace_id` - Filter by workspace (optional)
- `include_revoked` - Include revoked links (default: false)

**Response (200):**
```typescript
{
  share_links: ShareLink[];
}
```

**Errors:**
- `400` - Missing required query parameters
- `401` - Unauthorized
- `403` - Forbidden (no access to workspace)
- `500` - Server error

---

### GET /api/share-links/[token]
**Access shared report (public endpoint)**

**Path Parameters:**
- `token` - Share link token (secure 32-byte base64 token)

**Response (200):**
```typescript
{
  share_link: {
    id: string;
    view_count: number;
    access_role: string;
    expires_at: string;
  }
}
```

**Errors:**
- `401` - Authentication required (`requires_auth: true`)
- `404` - Share link not found
- `410` - Link expired, revoked, or max views reached
- `500` - Server error

**Side Effects:**
- Increments `view_count`
- Updates `last_viewed_at` (and `first_viewed_at` if first view)
- Creates `viewed` event in `share_link_events`

---

### DELETE /api/share-links/[token]
**Revoke a share link**

**Path Parameters:**
- `token` - Share link token

**Response (200):**
```typescript
{
  share_link: {
    id: string;
    revoked_at: string;           // ISO 8601
    revoked_by: string;
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not link creator or workspace owner)
- `404` - Share link not found
- `500` - Server error

**Side Effects:**
- Sets `revoked_at` and `revoked_by`
- Creates `revoked` event in `share_link_events`
- Link immediately becomes inaccessible

---

### GET /api/share-links/[id]/route.ts
**Get share links for a specific snapshot**

**Path Parameters:**
- `id` - Snapshot ID

**Response (200):**
```typescript
{
  share_links: ShareLink[];
}
```

---

### GET /api/share-links/[id]/events/route.ts
**Get audit trail for a share link**

**Path Parameters:**
- `id` - Share link ID

**Response (200):**
```typescript
{
  events: Array<{
    id: string;
    share_link_id: string;
    event_type: 'created' | 'viewed' | 'downloaded' | 'revoked' | 'expired' | 'access_denied';
    actor_user_id?: string;
    actor_ip_address?: string;
    actor_user_agent?: string;
    metadata: object;
    created_at: string;           // ISO 8601
  }>
}
```

---

## Helper Functions

### Core Operations
```typescript
// lib/db/helpers/share-links.ts

createShareLink(snapshotId, workspaceId, createdBy, options?)
getShareLinkByToken(token)
getShareLinkByShortCode(shortCode)
validateShareLink(token, userId?)
trackShareLinkView(shareLinkId, userId?, ipAddress?, userAgent?)
createShareLinkEvent(shareLinkId, eventType, actorUserId?, ...)
revokeShareLink(shareLinkId, revokedBy)
listShareLinksBySnapshot(snapshotId, includeRevoked?)
listShareLinksByWorkspace(workspaceId, includeRevoked?)
getShareLinkWithDetails(token)
updateShareLink(shareLinkId, updates)
deleteExpiredShareLinks(retentionDays?)
getShareLinkEvents(shareLinkId)
getSnapshotShareLinks(snapshotId)  // Alias
```

### Token Generation
```typescript
generateToken()        // 32-byte base64 secure token
generateShortCode()    // 8-char base64url alphanumeric
```

---

## Error Handling

### Error Codes

| Code | Condition | User Message | Action |
|------|-----------|--------------|--------|
| `400` | Missing required fields | "workspace_id and snapshot_id are required" | Return error response |
| `401` | Unauthenticated | "Unauthorized" | Return error response |
| `403` | Expired link | "This share link has expired" | Display expired message |
| `403` | Revoked link | "This share link has been revoked" | Display revoked message |
| `403` | Max views reached | "This share link has reached its view limit" | Display max views message |
| `403` | Auth required | (No message) | Redirect to `/login?return_to=/shared/{token}` |
| `403` | Insufficient permissions | "Forbidden" | Return error response |
| `404` | Token not found | "Not found" | Display not found page |
| `410` | Link expired/revoked/max views | Specific messages per reason | Display appropriate error page |
| `500` | Server error | "An error occurred" | Return error response |

### Error Response Format

**API Errors:**
```typescript
{
  error: string;         // User-friendly error message
  reason?: string;       // Machine-readable error code
}
```

**Validation Error Reasons:**
- `not_found` - Share link does not exist
- `expired` - Link has passed expiration date
- `revoked` - Link has been manually revoked
- `max_views_reached` - View limit exceeded
- `auth_required` - Authentication needed but not provided

### Implementation

**API Routes:**
```typescript
// Status code mapping
const statusMap: Record<string, number> = {
  not_found: 404,
  expired: 410,
  revoked: 410,
  max_views_reached: 410,
  auth_required: 401,
};

// User-friendly messages
const messages: Record<string, string> = {
  expired: 'This share link has expired',
  revoked: 'This share link has been revoked',
  max_views_reached: 'This share link has reached its maximum view limit',
  auth_required: 'Authentication required to access this link',
  not_found: 'Share link not found',
};
```

**Page-Level Handling:**
```typescript
// app/shared/[token]/page.tsx
if (!validation.valid) {
  if (validation.reason === 'expired') {
    return <ExpiredLinkPage />;
  }
  if (validation.reason === 'revoked') {
    return <RevokedLinkPage />;
  }
  if (validation.reason === 'auth_required') {
    redirect(`/login?return_to=/shared/${token}`);
  }
  notFound();  // 404 page
}
```

---

## UI Components

### ShareDialog
**Location:** `components/share/share-dialog.tsx`

Full-featured dialog for creating share links:
- Contact selection (CCP-09 integration)
- Email recipient input
- Access level control (viewer/commenter)
- Expiration settings (1-90 days)
- Authentication requirement toggle
- Email notification with custom message
- Link copying with visual feedback

**Usage:**
```tsx
<ShareDialog 
  workspaceId={workspaceId}
  snapshotId={snapshotId}
  trigger={<Button>Share</Button>}
/>
```

### ShareLinksList
**Location:** `components/share/share-links-list.tsx`

Management interface for active share links:
- Display all share links for a snapshot
- Status badges (Active/Revoked/Expired)
- View count and expiration display
- Copy link functionality
- Revoke with confirmation dialog
- Auto-refresh after actions

**Usage:**
```tsx
<ShareLinksList snapshotId={snapshotId} />
```

---

## Pages

### Public Share View
**Location:** `app/shared/[token]/page.tsx`

Server-rendered page for viewing shared reports:
- Share link validation with error handling
- Automatic view tracking
- Display rules with sources
- Highlight data gaps
- Read-only, professional layout
- Usage terms footer

**Route:** `/shared/[token]`

---

## Security & RLS Policies

### Row-Level Security
```sql
-- share_links: Users can only see links in their workspaces
CREATE POLICY "Users can view share links in their workspaces"
  ON share_links FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid()
    )
  );

-- share_links: Users can only create links in their workspaces
CREATE POLICY "Users can create share links in their workspaces"
  ON share_links FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid()
    )
  );

-- share_link_events: Public read for audit trail
CREATE POLICY "Anyone can view share link events"
  ON share_link_events FOR SELECT
  USING (true);
```

### Access Control
1. **Link Creation**: Must be workspace member
2. **Link Revocation**: Must be link creator OR workspace owner
3. **Link Access**: Validated by `validateShareLink()` function
4. **Expiration**: Checked on every access attempt
5. **View Limits**: Enforced before granting access

---

## Validation Rules

### Share Link Validation
```typescript
interface ValidationResult {
  valid: boolean;
  reason?: 'not_found' | 'expired' | 'revoked' | 'max_views_reached' | 'auth_required';
  shareLink?: ShareLink;
}
```

**Validation Flow:**
1. ✅ Link exists in database
2. ✅ Not revoked (`revoked_at IS NULL`)
3. ✅ Not expired (`expires_at > NOW()`)
4. ✅ Under view limit (`view_count < max_views` OR `max_views IS NULL`)
5. ✅ Auth satisfied (`requires_auth = false` OR user authenticated)

---

## Event Types

### Audit Trail Events
- `created` - Share link created
- `viewed` - Report accessed via link
- `downloaded` - Report downloaded (future)
- `revoked` - Link manually revoked
- `expired` - Link accessed after expiration
- `access_denied` - Access attempt denied (auth required, max views, etc.)

All events include:
- Timestamp
- Actor user ID (if authenticated)
- IP address
- User agent
- Custom metadata

---

## Integration Points

### CCP-09 (Contacts)
- Optional `recipient_contact_id` field
- Auto-fill email from contact
- Track share history per contact

### CCP-15 (Audit Trail)
- All events logged to `share_link_events`
- IP address and user agent tracking
- Searchable audit history

### Notifications (Future)
- Email notifications via `share_notifications` table
- Custom message support
- Delivery status tracking

---

## Usage Examples

### Create Share Link
```typescript
const shareLink = await createShareLink(
  snapshotId,
  workspaceId,
  userId,
  {
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxViews: 100,
    requiresAuth: false,
    recipientEmail: 'client@example.com',
    accessRole: 'viewer'
  }
);
```

### Validate & Access
```typescript
const validation = await validateShareLink(token, userId);

if (!validation.valid) {
  if (validation.reason === 'expired') {
    return <ExpiredPage />;
  }
  if (validation.reason === 'auth_required') {
    redirect('/login');
  }
  return notFound();
}

await trackShareLinkView(validation.shareLink.id, userId);
```

### Revoke Link
```typescript
const revokedLink = await revokeShareLink(shareLinkId, userId);
```

---

## Testing Checklist

- [ ] Create share link with all combinations of options
- [ ] Access valid share link (authenticated & unauthenticated)
- [ ] Access expired link
- [ ] Access revoked link
- [ ] Exceed max views limit
- [ ] Revoke active link
- [ ] List share links (authenticated vs unauthenticated)
- [ ] View tracking and analytics
- [ ] Audit trail events
- [ ] Error cases (invalid token, missing report, etc.)
- [ ] RLS policy enforcement
- [ ] Token uniqueness and collision handling
- [ ] Short code generation and uniqueness

---

## Performance Considerations

### Indexes
```sql
CREATE INDEX idx_share_links_workspace_id ON share_links(workspace_id);
CREATE INDEX idx_share_links_snapshot_id ON share_links(snapshot_id);
CREATE INDEX idx_share_links_created_by ON share_links(created_by);
CREATE INDEX idx_share_links_token ON share_links(token);
CREATE INDEX idx_share_links_short_code ON share_links(short_code);
CREATE INDEX idx_share_link_events_share_link_id ON share_link_events(share_link_id);
CREATE INDEX idx_share_link_events_created_at ON share_link_events(created_at);
```

### Cleanup
- Expired links retained for 30 days (configurable)
- Use `deleteExpiredShareLinks()` for periodic cleanup
- Consider archival strategy for audit events

---

## Future Enhancements

1. **Download Tracking** - Log report downloads
2. **Email Notifications** - Integration with email service
3. **Advanced Permissions** - Granular field-level access
4. **Analytics Dashboard** - Share link performance metrics
5. **Branded Sharing** - Custom domains and branding
6. **Password Protection** - Additional security layer
7. **QR Codes** - Generate QR codes for short codes
8. **Webhook Notifications** - Real-time event notifications

---

## Migration Path

### Database Migration
```bash
# Apply CCP-10 migration
supabase migration up 20260104_ccp10_share_links.sql
```

### Deployment
1. Apply database migration
2. Deploy helper functions
3. Deploy API routes
4. Deploy UI components
5. Update documentation
6. Train users on sharing features

---

## Support & Documentation

**Related Contracts:**
- CCP-09: Contact Management
- CCP-15: Audit Trail & Event Logging
- CCP-05: Workspace Security & Hardening

**Files:**
- Migration: `supabase/migrations/20260104_ccp10_share_links.sql`
- Helpers: `lib/db/helpers/share-links.ts`
- API: `app/api/share-links/`
- Components: `components/share/`
- Pages: `app/shared/[token]/page.tsx`

---

**Version History:**
- v0.1 (2026-01-04): Initial implementation
