# Audit Logging Contract

This document describes the audit logging framework for GeoSelect's happy path and future CCP implementations. It is the canonical reference for integrating activity logging into new endpoints.

**Last Updated:** January 4, 2026  
**Status:** Frozen (breaking changes require backwards compatibility plan)

## Overview

The audit logging system captures user actions across the happy path for:

- **Compliance & forensics:** Prove what happened, when, and by whom
- **Reproducibility:** Retrieve exact inputs and rule versions used
- **Debugging:** Correlate user actions with system outcomes
- **Analytics:** Track adoption and usage patterns

All activities are logged asynchronously (non-blocking) to ensure main business logic never fails due to audit issues.

## Activity Types

All activity types are defined in `lib/types/activity.ts` as the `ActivityType` enum.

### A1) PARCEL_SELECTED

**When to log:** User commits to a parcel selection (deliberate boundary, not every search keystroke).

**Where:** `POST /api/workspaces/[workspace_id]/parcels/selected` or equivalent first-committed-selection endpoint.

**Required metadata fields:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `parcel_id` | string (UUID) | Internal canonical parcel ID | ✓ |
| `apn` | string | Assessor's Parcel Number (jurisdiction variant) | ✗ |
| `source` | enum | How parcel was selected: `parcel_resolve`, `map_click`, `search_result` | ✓ |
| `confidence` | number | Confidence score [0.0–1.0] from resolver | ✗ |
| `request_id` | string (UUID) | Idempotency key (prevent duplicates on retry) | ✗ |

**Example:**

```json
{
  "user_id": "auth0|user123",
  "activity_type": "PARCEL_SELECTED",
  "workspace_id": "ws-789",
  "request_id": "req-a1b2c3d4e5f6g7h8",
  "metadata": {
    "parcel_id": "parcel-456",
    "apn": "123-45-6789",
    "source": "map_click",
    "confidence": 0.92,
    "request_id": "req-a1b2c3d4e5f6g7h8"
  }
}
```

### A2) RULES_EVALUATED

**When to log:** After running the deterministic rule evaluation (CCP-02 phase 2b or "rules summary" endpoint).

**Where:** Standalone endpoint `POST /api/workspaces/[workspace_id]/rules/evaluate` or integrated into the rules execution endpoint after successful evaluation.

**Required metadata fields:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `parcel_id` | string (UUID) | Parcel being evaluated | ✓ |
| `ruleset_version` | string | Frozen version string (e.g., `"0.1"`, `"2026-01"`) | ✓ |
| `rule_counts.evaluated` | number | Total rules checked | ✓ |
| `rule_counts.passed` | number | Rules that passed | ✓ |
| `rule_counts.failed` | number | Rules that failed | ✓ |
| `duration_ms` | number | Execution time in milliseconds | ✗ |
| `inputs_hash` | string (SHA256) | SHA256 of canonicalized inputs (for reproducibility) | ✗ |

**Example:**

```json
{
  "user_id": "auth0|user123",
  "activity_type": "RULES_EVALUATED",
  "workspace_id": "ws-789",
  "request_id": "req-x1y2z3...",
  "metadata": {
    "parcel_id": "parcel-456",
    "ruleset_version": "0.1",
    "rule_counts": {
      "evaluated": 47,
      "passed": 42,
      "failed": 5
    },
    "duration_ms": 234,
    "inputs_hash": "a3c4d9e2f5..."
  }
}
```

### A3) SNAPSHOT_CREATED

**When to log:** After successful parcel snapshot insertion into database (transactionally, post-insert only).

**Where:** `POST /api/workspaces/[workspace_id]/snapshots` endpoint (already integrated).

**Required metadata fields:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `snapshot_id` | string (UUID) | ID of created snapshot | ✓ |
| `parcel_id` | string (UUID) | Parcel within snapshot | ✓ |
| `address` | string | Human-readable parcel address | ✓ |
| `report_id` | string (UUID) | If snapshot is bound to a report | ✗ |
| `schema_version` | string | Snapshot schema version (e.g., `"1.0"`) | ✓ |

**Example:**

```json
{
  "user_id": "auth0|user123",
  "activity_type": "SNAPSHOT_CREATED",
  "workspace_id": "ws-789",
  "request_id": "req-snap1...",
  "metadata": {
    "snapshot_id": "snap-abc123",
    "parcel_id": "parcel-456",
    "address": "789 Oak Avenue, Boulder, CO 80301",
    "report_id": "report-xyz",
    "schema_version": "1.0"
  }
}
```

### A4) SHARE_LINK_CREATED

**When to log:** After successful share link creation (post-insert into database).

**Where:** `POST /api/share-links` endpoint (already integrated).

**Required metadata fields:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `share_link_id` | string (UUID) | ID of share link record | ✓ |
| `snapshot_id` | string (UUID) | Snapshot being shared | ✓ |
| `token_prefix` | string | First 8 characters of token (NEVER full token) | ✓ |
| `expires_at` | string (ISO 8601) | Expiration timestamp | ✗ |
| `max_views` | number | Max view count, or null for unlimited | ✗ |
| `requires_auth` | boolean | Whether auth is required to view | ✓ |

**Security contract:** Full tokens MUST NEVER be logged. Violating this results in an error thrown during sanitization.

**Example:**

```json
{
  "user_id": "auth0|user123",
  "activity_type": "SHARE_LINK_CREATED",
  "workspace_id": "ws-789",
  "request_id": "req-link1...",
  "metadata": {
    "share_link_id": "link-def456",
    "snapshot_id": "snap-abc123",
    "token_prefix": "ey9jZXJ0",
    "expires_at": "2026-01-11T12:00:00Z",
    "max_views": 5,
    "requires_auth": false
  }
}
```

### A5) REPORT_SHARED

**When to log:** When a report/snapshot is shared with a known principal (contact, user, or email).

**Where:** `POST /api/workspaces/[workspace_id]/reports/share` endpoint (ready for CCP-12 integration).

**Required metadata fields:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `report_id` | string (UUID) | Report being shared | ✓ |
| `shared_with.contact_id` | string (UUID) | Contact ID (if applicable) | ✗* |
| `shared_with.user_id` | string (UUID) | User ID (if applicable) | ✗* |
| `shared_with.email` | string | Email address (if applicable) | ✗* |
| `role_granted` | enum | Access level: `viewer`, `commenter`, `editor` | ✓ |
| `channel` | enum | Delivery channel: `email`, `workspace`, `sms`, `link_only` | ✓ |
| `message_id` | string | Message ID if integrated with email/SMS | ✗ |

*At least one of `contact_id`, `user_id`, or `email` must be present.

**Example:**

```json
{
  "user_id": "auth0|user123",
  "activity_type": "REPORT_SHARED",
  "workspace_id": "ws-789",
  "request_id": "req-share1...",
  "metadata": {
    "report_id": "report-xyz",
    "shared_with": {
      "contact_id": "contact-ghi789",
      "user_id": null,
      "email": null
    },
    "role_granted": "viewer",
    "channel": "email",
    "message_id": "msg-jkl012"
  }
}
```

## Idempotency

### Request ID

To prevent duplicate logging on retries, include a `request_id` (UUID) in activity logging calls:

```typescript
// example call
await logSnapshotCreated(
  userId,
  workspaceId,
  snapshotId,
  parcelId,
  address,
  reportId,
  schemaVersion,
  requestIdFromRequestHeader // optional, for idempotency
);
```

### Unique Index

The activities table enforces a unique index on `(workspace_id, activity_type, request_id)` **where `request_id IS NOT NULL`**. This means:

- **With request_id:** Second insert with same (ws, type, request_id) is silently ignored (PostgreSQL constraint).
- **Without request_id:** Multiple inserts for the same action are allowed (different rows).

### Logger Behavior

The `logActivity()` function catches PostgreSQL error code `23505` (unique constraint violation) and logs it at debug level (non-fatal). Main business logic is never interrupted.

**Implementation detail:** `lib/helpers/activity-logger.ts`

## Metadata Sanitization

All metadata is sanitized before insertion to prevent:

1. **Token leakage:** Full tokens, API keys, passwords
2. **PII dumps:** Unredacted email lists, contact details
3. **Payload bloat:** Oversized objects or arrays

### Sanitization Rules

1. **Allowlist enforcement:** Only declared keys per activity type are preserved.
2. **String truncation:** Values > 1000 chars are truncated with warning.
3. **Nested object handling:** Objects and arrays are converted to JSON strings.
4. **Type-specific validation:** SHARE_LINK_CREATED rejects full tokens with error.

### Allowlists

Key allowlists are defined in `lib/helpers/activity-sanitizer.ts`:

```typescript
ALLOWED_KEYS_BY_TYPE = {
  [ActivityType.SHARE_LINK_CREATED]: new Set([
    "share_link_id",
    "snapshot_id",
    "token_prefix", // NOT full_token
    "expires_at",
    "max_views",
    "requires_auth",
  ]),
  // ... other types
};
```

### Example: Safe Share Link Logging

```typescript
// ✓ GOOD: Token prefix only
const meta = {
  share_link_id: "link-123",
  token_prefix: "abc12345", // first 8 chars
  expires_at: "2026-01-11T12:00:00Z",
};

// ✗ BAD: Will throw error
const meta = {
  share_link_id: "link-123",
  full_token: "abc12345xyz789secret...really_long_token", // REJECTED
};

// Call sanitizer
const clean = sanitizeActivityMeta(ActivityType.SHARE_LINK_CREATED, meta);
// Throws if full_token or 'token' present
```

## Row-Level Security (RLS)

All activities are protected by RLS policies:

### SELECT Policy

Users can view:

1. **Their own activities** (regardless of workspace):
   ```sql
   auth.uid() = user_id
   ```

2. **Workspace activities** (if they are a member):
   ```sql
   workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
   ```

### INSERT Policy

Currently allows insert for any authenticated user (service role inserts via helper).

**Future:** Consider restricting inserts to service role only if abuse risk emerges.

## API: GET /api/workspaces/[workspace_id]/activities

Retrieve workspace activity history with pagination and filtering.

### Request

```
GET /api/workspaces/ws-789/activities?activityType=SNAPSHOT_CREATED&limit=50&offset=0
Authorization: Bearer [token]
```

### Query Parameters

| Param | Type | Description | Default |
|-------|------|-------------|---------|
| `activityType` | string | Filter by activity type (optional) | none |
| `limit` | number | Results per page | 50 |
| `offset` | number | Pagination offset | 0 |

### Response (200 OK)

```json
{
  "ok": true,
  "activities": [
    {
      "id": "activity-123",
      "user_id": "auth0|user123",
      "activity_type": "SNAPSHOT_CREATED",
      "workspace_id": "ws-789",
      "request_id": "req-snap1",
      "metadata": {
        "snapshot_id": "snap-abc123",
        "parcel_id": "parcel-456",
        "address": "789 Oak Avenue, Boulder, CO 80301",
        "schema_version": "1.0"
      },
      "created_at": "2026-01-04T14:32:10.123Z"
    }
  ],
  "pagination": {
    "total": 247,
    "limit": 50,
    "offset": 0
  }
}
```

### Error Responses

- **401:** Unauthenticated
- **403:** No access to workspace
- **500:** Server error

## Adding a New Activity Type

When implementing a new CCP endpoint, follow this pattern:

### 1. Define the Activity Type

```typescript
// lib/types/activity.ts
export enum ActivityType {
  // ... existing types
  NEW_ACTION = "NEW_ACTION",
}
```

### 2. Add to Allowlist

```typescript
// lib/helpers/activity-sanitizer.ts
ALLOWED_KEYS_BY_TYPE = {
  [ActivityType.NEW_ACTION]: new Set([
    "resource_id",
    "action_detail",
    "timestamp",
  ]),
};
```

### 3. Create Logger Helper

```typescript
// lib/helpers/activity-logger.ts
export async function logNewAction(
  userId: string,
  workspaceId: string,
  resourceId: string,
  actionDetail: string,
  requestId?: string
): Promise<void> {
  return logActivity({
    userId,
    activityType: ActivityType.NEW_ACTION,
    workspaceId,
    requestId,
    metadata: {
      resource_id: resourceId,
      action_detail: actionDetail,
    },
  });
}
```

### 4. Integrate into Endpoint

```typescript
// app/api/workspaces/[workspace_id]/new-action/route.ts
import { logNewAction } from "@/lib/helpers/activity-logger";

export async function POST(req: NextRequest, { params }) {
  // ... main logic ...

  // Log activity (post-success, non-blocking)
  logNewAction(user.id, workspaceId, resourceId, detail, requestIdFromHeaders).catch(
    (err) => console.error("Activity logging failed:", err)
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
```

### 5. Add Tests

```typescript
// app/api/workspaces/[workspace_id]/new-action/route.test.ts
import { logNewAction } from "@/lib/helpers/activity-logger";

vi.mock("@/lib/helpers/activity-logger", () => ({
  logNewAction: vi.fn(),
}));

describe("POST /api/workspaces/[workspace_id]/new-action", () => {
  it("logs NEW_ACTION activity with correct metadata", async () => {
    // ... test logic ...
    expect(logNewAction).toHaveBeenCalledWith(
      userId,
      workspaceId,
      resourceId,
      detail,
      expect.any(String) // requestId
    );
  });
});
```

## Audit Trail for Compliance

The activities table creates a deterministic audit trail for compliance narratives (CTRL-C01/C02):

- **What:** activity_type + metadata
- **When:** created_at (server time, no skew)
- **Who:** user_id (authenticated identity)
- **Where:** workspace_id (multi-tenant context)
- **How:** metadata details (inputs, outputs, versions)

### Exportable for Reports

To generate a compliance report:

```typescript
const { data: activities } = await supabase
  .from("activities")
  .select("*")
  .eq("workspace_id", workspaceId)
  .gte("created_at", startDate)
  .lte("created_at", endDate)
  .order("created_at", { ascending: true });

// Format for PDF/CSV export
const report = activities.map((a) => ({
  timestamp: a.created_at,
  user: a.user_id,
  action: a.activity_type,
  details: JSON.stringify(a.metadata),
}));
```

## Testing

### Unit Tests

- `lib/helpers/activity-sanitizer.test.ts` — Sanitization guardrails
- `lib/helpers/activity-logger.test.ts` — Idempotency behavior

### Integration Tests

- `app/api/workspaces/[workspace_id]/snapshots/route.test.ts` — End-to-end activity logging in POST endpoint
- `app/api/workspaces/[workspace_id]/activities/route.test.ts` — GET activities endpoint and filtering

### Cross-Platform Verification

```bash
# Run all activity checks (Bash or PowerShell)
pnpm activity:check

# On Windows PowerShell:
pwsh -File scripts/activity-check.ps1

# On Linux/macOS:
bash scripts/activity-check.sh
```

## References

- **Activity types definition:** `lib/types/activity.ts`
- **Logger implementation:** `lib/helpers/activity-logger.ts`
- **Sanitizer implementation:** `lib/helpers/activity-sanitizer.ts`
- **Database migration:** `lib/db/migrations/20260104_activities_audit_log.sql`
- **Endpoints:** `app/api/workspaces/[workspace_id]/activities/route.ts`
- **Verification scripts:** `scripts/activity-check.{sh,ps1}`

## Versioning

- **Current Version:** 1.0.0
- **Schema Version:** 1.0 (for snapshots)
- **Ruleset Version:** 0.1 (for rules evaluation, update as rules evolve)

Changes to activity types, metadata fields, or sanitization rules should be documented in CHANGELOG and coordinated with compliance/audit stakeholders.
