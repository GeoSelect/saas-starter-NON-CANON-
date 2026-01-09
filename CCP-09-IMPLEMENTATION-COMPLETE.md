# CCP-09: Contact Upload & Email - Implementation Complete ✅

**Date**: January 8, 2026  
**Status**: ✅ Pro Plus tier gating, CSV import, Gmail API integration ready  
**Tier Requirement**: Pro Plus / Portfolio / Enterprise

---

## 🎯 What Was Implemented

### 1. Database Schema (Migration 011)

**File**: [migrations/011_ccp09_contacts_crm.sql](migrations/011_ccp09_contacts_crm.sql)

**Tables Created**:
- ✅ **contacts** - CRM contacts with email, phone, company, tags
  - Unique constraint: One email per workspace
  - Email validation via CHECK constraint
  - Tracks email send count and last sent date
  - GIN index on tags array for fast filtering
  - RLS policies: Workspace isolation

- ✅ **contact_uploads** - Append-only audit trail for CSV imports
  - Tracks file name, size, row counts (total/success/error/duplicate)
  - Status tracking: pending → processing → completed/failed
  - Stores validation errors as JSONB
  - IP address and user agent logging

- ✅ **contact_emails** - Email send tracking via Gmail API
  - Links to contact and workspace
  - Stores Gmail message ID and thread ID
  - Status: pending → sent/failed/bounced
  - Trigger updates contact email stats on send

**Helper Functions**:
- ✅ `can_import_contacts(workspace_id, row_count)` - Tier-based limit checking
  - Free: 100 contacts
  - Pro: 1,000 contacts
  - Pro Plus: 5,000 contacts
  - Portfolio: 20,000 contacts
  - Enterprise: 50,000 contacts

**Views**:
- ✅ `contact_upload_summary` - Upload stats by workspace (last 30 days)
- ✅ `contact_email_stats` - Email sending stats per contact

---

### 2. Contact Upload API (CSV Import)

**File**: [app/api/contacts/import/route.ts](app/api/contacts/import/route.ts)

**POST /api/contacts/import** - Upload CSV and import contacts
- ✅ Authentication required (401 if unauthorized)
- ✅ Entitlement check (`ccp-09:contact-upload` required)
- ✅ Returns 402 Payment Required if tier insufficient
- ✅ File size validation (max 10MB)
- ✅ CSV parsing with error handling
- ✅ Tier-based row limit checking
- ✅ Duplicate detection (skips existing emails)
- ✅ Batch insert with error collection
- ✅ Audit trail logging

**GET /api/contacts/import** - List upload history
- ✅ Paginated upload history
- ✅ Shows success/error/duplicate counts

**Request Example**:
```bash
curl -X POST http://localhost:3000/api/contacts/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@contacts.csv" \
  -F "workspace_id=workspace-123"
```

**Response (200 OK)**:
```json
{
  "message": "Import completed",
  "result": {
    "total": 100,
    "success": 95,
    "errors": 3,
    "duplicates": 2,
    "upload_id": "uuid"
  },
  "details": {
    "validation_errors": [
      "Row 5: Invalid email format: notanemail",
      "Row 12: Missing required field (name)"
    ]
  }
}
```

**CSV Format**:
```csv
email,name,phone,company,notes,tags
alice@example.com,Alice Johnson,555-1111,Acme Corp,Preferred client,"vip,active"
bob@example.com,Bob Smith,555-2222,Widgets Inc,,"prospect"
```

---

### 3. Email Sending API (Gmail Integration)

**File**: [app/api/contacts/send-email/route.ts](app/api/contacts/send-email/route.ts)

**POST /api/contacts/send-email** - Send email to contact via Gmail API
- ✅ Authentication required
- ✅ Entitlement check (`ccp-09:contact-upload` required)
- ✅ Gmail OAuth access token required
- ✅ Creates pending email record
- ✅ Sends via Gmail API (RFC 2822 format)
- ✅ Updates contact email stats (trigger-based)
- ✅ Stores Gmail message ID and thread ID
- ✅ Error handling with status updates

**GET /api/contacts/send-email** - Get email send history
- ✅ Paginated email history
- ✅ Filter by contact_id
- ✅ Joins with contact details

**Request Example**:
```bash
curl -X POST http://localhost:3000/api/contacts/send-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-123",
    "contact_id": "contact-456",
    "subject": "Property Report Available",
    "body": "<p>Hi Alice, your property report is ready!</p>",
    "gmail_access_token": "ya29.xxx"
  }'
```

**Response (200 OK)**:
```json
{
  "message": "Email sent successfully",
  "email_id": "uuid",
  "gmail_message_id": "msg-123",
  "gmail_thread_id": "thread-456",
  "sent_to": "alice@example.com"
}
```

**Gmail Authorization Required (403)**:
```json
{
  "error": "Gmail authorization required",
  "message": "Please connect your Gmail account to send emails",
  "auth_url": "/api/auth/gmail/authorize",
  "email_id": "uuid"
}
```

---

### 4. Contacts CRUD API

**File**: [app/api/contacts/route.ts](app/api/contacts/route.ts)

**GET /api/contacts** - List contacts
- ✅ Authentication required
- ✅ Entitlement check
- ✅ Search by name or email (`?search=alice`)
- ✅ Filter by tags (`?tags=vip,active`)
- ✅ Pagination support
- ✅ Total count for UI

**POST /api/contacts** - Create single contact
- ✅ Authentication required
- ✅ Entitlement check
- ✅ Tier limit validation
- ✅ Duplicate detection (409 Conflict)
- ✅ Email validation

**Request Example**:
```bash
# List contacts
curl "http://localhost:3000/api/contacts?workspace_id=ws-123&search=alice&limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Create contact
curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "ws-123",
    "email": "alice@example.com",
    "name": "Alice Johnson",
    "phone": "555-1111",
    "company": "Acme Corp",
    "tags": ["vip", "active"]
  }'
```

---

## 🔐 Tier Gating & Entitlements

### CCP-09 Feature: `ccp-09:contact-upload`

**Minimum Tier**: Pro Plus

**Already Defined In**:
- ✅ `lib/contracts/ccp05/entitlements.ts` - `'ccp-09:contact-upload': 'pro_plus'`
- ✅ `migrations/009_ccp05_entitlements.sql` - Default entitlement initialization

**Tier Limits**:

| Tier | Max Contacts | CSV Import | Email Sending |
|------|-------------|-----------|---------------|
| Free | 100 | ❌ No | ❌ No |
| Pro | 1,000 | ❌ No | ❌ No |
| Pro Plus | 5,000 | ✅ Yes | ✅ Yes |
| Portfolio | 20,000 | ✅ Yes | ✅ Yes |
| Enterprise | 50,000 | ✅ Yes | ✅ Yes |

**Error Response (402 Payment Required)**:
```json
{
  "error": "Feature not available",
  "reason": "TIER_INSUFFICIENT",
  "message": "Contact Upload requires Pro Plus or higher plan",
  "upgrade": {
    "currentTier": "pro",
    "requiredTier": "pro_plus",
    "feature": "ccp-09:contact-upload",
    "upgradeUrl": "/pricing?feature=ccp-09:contact-upload&current=pro&required=pro_plus"
  }
}
```

---

## 📧 Gmail API Integration

### OAuth 2.0 Setup Required

To enable email sending, you must:

1. **Create Google Cloud Project**
   - Enable Gmail API
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URIs

2. **Environment Variables**:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
```

3. **OAuth Scopes Required**:
   - `https://www.googleapis.com/auth/gmail.send` - Send emails on user's behalf

4. **User Authorization Flow**:
   - User clicks "Connect Gmail" button
   - Redirected to Google OAuth consent screen
   - User grants permission to send emails
   - Access token stored in session/database
   - Token used for all email sends

### Gmail API Helper Function

```typescript
/**
 * Send email via Gmail API
 * 
 * @param accessToken - User's Gmail OAuth access token
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param body - Email body (HTML supported)
 * @returns { messageId, threadId }
 */
async function sendGmailEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<{ messageId: string; threadId: string }>
```

**Implementation Details**:
- Uses `googleapis` npm package
- Constructs RFC 2822 format email
- Base64url encodes message body
- Returns Gmail message ID for tracking

---

## 🧪 Testing Checklist

### Unit Tests

- [ ] CSV parsing with valid/invalid data
- [ ] Email validation (regex)
- [ ] Duplicate detection
- [ ] Tier limit checking function
- [ ] Gmail API email encoding

### Integration Tests

- [ ] POST /api/contacts/import with tier checking
- [ ] POST /api/contacts/import with duplicate emails
- [ ] POST /api/contacts/send-email (mock Gmail API)
- [ ] GET /api/contacts with search and filters
- [ ] POST /api/contacts with limit exceeded

### End-to-End Tests

- [ ] Upload CSV → verify contacts created
- [ ] Send email → verify Gmail API called
- [ ] Free tier → blocked from uploading
- [ ] Pro Plus tier → allowed to upload
- [ ] Upgrade prompt shown correctly

---

## 📊 Usage Examples

### Complete Contact Upload Flow

```typescript
// 1. User uploads CSV file
const formData = new FormData();
formData.append('file', csvFile);
formData.append('workspace_id', 'ws-123');

const uploadRes = await fetch('/api/contacts/import', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});

const { result } = await uploadRes.json();
console.log(`Imported ${result.success} contacts`);

// 2. List imported contacts
const listRes = await fetch('/api/contacts?workspace_id=ws-123', {
  headers: { Authorization: `Bearer ${token}` },
});

const { contacts } = await listRes.json();

// 3. Send email to first contact
const emailRes = await fetch('/api/contacts/send-email', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    workspace_id: 'ws-123',
    contact_id: contacts[0].id,
    subject: 'Hello!',
    body: '<p>Welcome to our service!</p>',
    gmail_access_token: gmailToken,
  }),
});

const { gmail_message_id } = await emailRes.json();
console.log(`Email sent: ${gmail_message_id}`);
```

---

## 🎯 Next Steps (Optional Enhancements)

### Phase 2: UI Components

- [ ] Create `ContactsTable` component with search and filters
- [ ] Create `ContactUploadDialog` component (drag & drop CSV)
- [ ] Create `EmailComposeDialog` component with rich text editor
- [ ] Add Gmail OAuth connection button
- [ ] Show email send history per contact

### Phase 3: Advanced Features

- [ ] Bulk email sending (select multiple contacts)
- [ ] Email templates (save and reuse)
- [ ] Email tracking (opens, clicks)
- [ ] Contact segmentation (tags, custom fields)
- [ ] Export contacts to CSV
- [ ] Contact merge/deduplication tool
- [ ] Email scheduling (send later)

### Phase 4: Integrations

- [ ] Salesforce sync
- [ ] HubSpot sync
- [ ] Mailchimp integration
- [ ] SMTP fallback (for non-Gmail users)
- [ ] SendGrid/Postmark for transactional emails

---

## 📁 Files Summary

| Component | File Path | LOC | Status |
|-----------|-----------|-----|--------|
| Database migration | migrations/011_ccp09_contacts_crm.sql | 340 | ✅ Complete |
| Contact upload API | app/api/contacts/import/route.ts | 415 | ✅ Complete |
| Email sending API | app/api/contacts/send-email/route.ts | 360 | ✅ Complete |
| Contacts CRUD API | app/api/contacts/route.ts | 280 | ✅ Complete |
| CRM import page | app/(dashboard)/crm/import/page.tsx | 265 | ✅ Existing |
| Entitlements service | lib/db/helpers/entitlements.ts | 480 | ✅ Complete |

**Total**: ~2,140 lines of code

---

## ✅ CCP-09 Implementation Checklist

### Completed ✅

- [x] Database schema (contacts, contact_uploads, contact_emails)
- [x] RLS policies (workspace isolation)
- [x] Tier limit checking function
- [x] Contact upload API with CSV parsing
- [x] Contact email API with Gmail integration
- [x] Contacts CRUD API
- [x] Entitlement checks (Pro Plus tier)
- [x] Audit trail logging
- [x] Duplicate detection
- [x] Email validation
- [x] Tag filtering (GIN index)
- [x] Email send stats tracking

### Pending 🔴

- [ ] Gmail OAuth flow implementation
- [ ] UI components (ContactsTable, EmailDialog)
- [ ] Email templates
- [ ] Bulk email sending
- [ ] Integration tests
- [ ] Documentation for OAuth setup

---

**Status**: ✅ Core functionality complete - CSV upload and email sending ready with Pro Plus tier gating. Gmail OAuth setup required for production use.
