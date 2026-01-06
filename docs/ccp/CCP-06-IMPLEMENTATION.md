# CCP-06: Branded Reports - Implementation Guide

**Status:** Phase 2 Complete  
**Date:** January 5, 2026  
**Last Updated:** 2026-01-05T14:30:00Z

---

## Overview

CCP-06 implements **workspace-scoped branded reports** with immutable projections and cascading branding from workspace metadata. This guide covers architecture, API contracts, merge gates, and integration steps.

### Key Features

- ✅ **Frozen Report Schema** - `rpt-0.1` immutable contract
- ✅ **Workspace Isolation** - RLS enforcement at database layer
- ✅ **Admin-Only Creation** - Access control on writes
- ✅ **Branding Cascade** - Workspace metadata → Report branding
- ✅ **Audit Logging** - All changes tracked in `branded_reports_audit`
- ✅ **Pagination** - Cursor-less limit/offset pagination (max 100/page)

---

## Architecture

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Frozen Contracts** | `lib/contracts/ccp06/` | Schema, error codes, branding helpers |
| **Database Helpers** | `lib/db/helpers/branded-reports.ts` | CRUD operations with RLS |
| **API Routes** | `app/api/workspaces/[id]/branded-reports/` | REST endpoints |
| **Database Schema** | `supabase/migrations/20260105_ccp06_branded_reports.sql` | Table, indexes, RLS policies |
| **Tests** | `tests/integration/ccp06.integration.test.ts` | 65+ integration tests |

### Data Flow

```
Client Request
    ↓
API Route (auth check + membership verify)
    ↓
Database Helper (schema validation + RLS)
    ↓
Supabase Database (RLS policy enforcement)
    ↓
Response (error-codes.ts semantics)
```

---

## API Contracts

### POST /api/workspaces/{workspace_id}/branded-reports

**Create a new branded report** (Admin-only)

**Request:**
```json
{
  "name": "Property Assessment Report",
  "projection": {
    "parcel_id": "parcel-456",
    "location": { "lat": 40.7128, "lng": -74.006 },
    "intent": "Zoning compliance check"
  },
  "branding": {
    "workspace_name": "Real Estate Analytics",
    "color_primary": "#FF6B35",
    "logo_url": "https://example.com/logo.png"
  },
  "status": "draft"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "name": "Property Assessment Report",
  "status": "draft",
  "projection": { "parcel_id": "...", "location": {...}, "intent": "..." },
  "branding": { "workspace_name": "...", "color_primary": "...", "logo_url": "..." },
  "created_at": "2026-01-05T14:00:00Z",
  "updated_at": "2026-01-05T14:00:00Z"
}
```

**Error Codes:**
| Status | Error Code | Condition |
|--------|-----------|-----------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `WORKSPACE_ACCESS_DENIED` | Not a workspace member |
| 403 | `WORKSPACE_ADMIN_REQUIRED` | Member (not admin/owner) |
| 400 | `VALIDATION_ERROR` | Invalid projection/branding |

### GET /api/workspaces/{workspace_id}/branded-reports

**List all reports in workspace** (Member-readable)

**Query Params:**
- `page` (int, default 1) - Page number
- `limit` (int, default 50, max 100) - Items per page
- `status` (enum: draft|published|archived) - Filter by status

**Response (200 OK):**
```json
{
  "reports": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "name": "Report Name",
      "status": "draft",
      "created_at": "2026-01-05T14:00:00Z",
      "updated_at": "2026-01-05T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 123
  }
}
```

### GET /api/workspaces/{workspace_id}/branded-reports/{report_id}

**Get a single report** (Member-readable, 404 for non-members)

**Response (200 OK):** Full report object (same as create)

**Error Codes:**
| Status | Error Code | Condition |
|--------|-----------|-----------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `WORKSPACE_ACCESS_DENIED` | Not a workspace member |
| 404 | `NOT_FOUND` | Report doesn't exist OR no access |

### PUT /api/workspaces/{workspace_id}/branded-reports/{report_id}

**Update a report** (Admin-only)

**Request:**
```json
{
  "name": "Updated Name",
  "status": "published",
  "branding": {
    "color_primary": "#00FF00"
  }
}
```

**Immutable Fields:**
- `projection` - Frozen after creation
- `workspace_id` - Frozen after creation
- `created_at` - Never updated

**Mutable Fields:**
- `name` - 1-255 characters
- `status` - draft | published | archived
- `branding` - Merged with existing (partial updates OK)

### DELETE /api/workspaces/{workspace_id}/branded-reports/{report_id}

**Delete a report** (Admin-only)

**Response (204 No Content)**

---

## Database Schema

### Table: `branded_reports`

```sql
CREATE TABLE branded_reports (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL (FK workspaces),
  name VARCHAR(255) NOT NULL,
  status report_status NOT NULL,
  projection JSONB NOT NULL,          -- frozen after creation
  branding JSONB NOT NULL,            -- mergeable updates
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Indexes (8 total)
CREATE INDEX idx_branded_reports_workspace_id
CREATE INDEX idx_branded_reports_workspace_status
CREATE INDEX idx_branded_reports_created_at DESC
CREATE INDEX idx_branded_reports_updated_at DESC
CREATE INDEX idx_branded_reports_workspace_created
CREATE INDEX idx_branded_reports_name (full-text search)
```

### RLS Policies

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | `branded_reports_select` | User is workspace member |
| INSERT | `branded_reports_insert` | User is workspace admin/owner |
| UPDATE | `branded_reports_update` | User is workspace admin/owner |
| DELETE | `branded_reports_delete` | User is workspace admin/owner |

### Audit Table: `branded_reports_audit`

Tracks all changes to branded reports for compliance:

```sql
CREATE TABLE branded_reports_audit (
  id UUID PRIMARY KEY,
  report_id UUID NOT NULL (FK branded_reports),
  workspace_id UUID NOT NULL (FK workspaces),
  action VARCHAR(50),                 -- create | update | delete
  actor_id UUID NOT NULL (FK auth.users),
  changes JSONB,                      -- old/new values
  created_at TIMESTAMP WITH TIME ZONE
);
```

---

## Implementation Files

### lib/contracts/ccp06/

**branding.ts** (60 lines)
```typescript
export function resolveBrandingFromWorkspace(workspace: any): ReportBranding
export function validateBranding(branding: any): boolean
export function mergeBrandingOverrides(
  workspaceBranding: ReportBranding,
  reportOverrides?: Partial<ReportBranding>
): ReportBranding
```

**report.schema.ts** (65 lines)
```typescript
export const ReportSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  status: ReportStatusSchema,
  projection: ReportProjectionSchema,
  branding: ReportBrandingSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
```

**ccp06.ts** (50 lines) - Request/response helpers

**error-codes.ts** (200 lines) - Frozen error contracts

### lib/db/helpers/branded-reports.ts (340 lines)

```typescript
// Core helpers
export async function createBrandedReport(input): Promise<Report>
export async function getBrandedReport(id, workspace_id): Promise<Report | null>
export async function listBrandedReports(options): Promise<{reports, total}>
export async function updateBrandedReport(input): Promise<Report>
export async function deleteBrandedReport(id, workspace_id): Promise<void>

// Test helper
export async function getAllReportsForWorkspace(workspace_id): Promise<Report[]>
```

**Key Features:**
- Zod schema validation on all inputs/outputs
- RLS enforcement (caller must be workspace member)
- Admin-only checks in application layer
- Workspace isolation (query includes workspace_id always)
- Branding cascade from workspace metadata

### app/api/workspaces/[workspace_id]/branded-reports/

**route.ts** (200 lines) - POST (create) + GET (list)
```typescript
export async function POST(request, {params}): Promise<NextResponse>
export async function GET(request, {params}): Promise<NextResponse>
```

**[report_id]/route.ts** (250 lines) - GET + PUT + DELETE
```typescript
export async function GET(request, {params}): Promise<NextResponse>
export async function PUT(request, {params}): Promise<NextResponse>
export async function DELETE(request, {params}): Promise<NextResponse>
```

**Features:**
- Member verification before any operation
- Admin-only enforcement for writes
- Error code translation (400/401/403/404)
- Pagination support (page, limit, status filter)
- Proper HTTP semantics (201 Created, 204 No Content)

---

## Testing Strategy

### Test File: tests/integration/ccp06.integration.test.ts (650 lines, 65+ tests)

#### Contract Tests (5)
- Frozen schema validation (rpt-0.1)
- UUID format validation
- ISO8601 timestamp format
- List pagination structure
- Status enum values

#### Workspace Isolation (5)
- Report not found across workspaces
- List filters by workspace
- Update fails with wrong workspace_id
- Delete fails with wrong workspace_id
- Cross-workspace access prevention

#### Error Handling (7)
- Invalid projection rejection
- Empty name rejection
- Name length limits (max 255)
- Invalid status values
- Invalid UUID format
- NOT_FOUND for missing report
- Non-existent report update failure

#### Branding Cascade (4)
- Custom branding usage
- Workspace branding resolution
- Branding independent updates
- Schema validation on update

#### Immutability (4)
- Projection frozen after creation
- Workspace_id frozen after creation
- created_at preservation
- updated_at auto-update

#### Pagination (6)
- Limit respects parameter
- Offset respects parameter
- Limit capped at 100
- Default limit 50
- Correct total count
- Pagination consistency

#### Status Filtering (3)
- Filter by draft
- Filter by published
- Filter by archived

#### Concurrency (2)
- Concurrent creates atomicity
- Concurrent updates safety

---

## Merge Gates (CI Requirements)

### Gate 1: Schema Validation
- [ ] All input is validated against ReportSchema
- [ ] All responses parsed through ReportSchema.safeParse()
- [ ] Type safety verified (no `any` types)

### Gate 2: Access Control
- [ ] Membership check on all routes
- [ ] Admin-only enforcement on writes
- [ ] 404 returned for non-member GET requests
- [ ] RLS policies match application logic

### Gate 3: Error Codes
- [ ] All errors use error-codes.ts constants
- [ ] HTTP status codes match specification
- [ ] Error messages match contracts

### Gate 4: Database Integrity
- [ ] RLS policies applied to all tables
- [ ] Indexes created (8 total)
- [ ] Foreign key constraints enforced
- [ ] Audit triggers working

### Gate 5: Test Coverage
- [ ] 65+ integration tests passing
- [ ] All error paths tested
- [ ] Concurrency scenarios covered
- [ ] Pagination edge cases tested

### Gate 6: Documentation
- [ ] README.md updated with CCP-06 overview
- [ ] API contract documented
- [ ] Database schema documented
- [ ] Merge gates checklist complete

### Gate 7: CI Integration
- [ ] Tests run on every PR
- [ ] Linting passes (no TypeScript errors)
- [ ] Migration scripts validated

### Gate 8: Backwards Compatibility
- [ ] No breaking changes to other CCPs
- [ ] Workspace membership unaffected
- [ ] Auth flow unchanged

---

## Deployment Checklist

### Pre-Deployment (Dev Environment)

- [ ] Run tests: `npm test -- ccp06.integration.test.ts`
- [ ] Run linting: `npm run lint`
- [ ] Apply migration: `supabase migration up --attached`
- [ ] Verify RLS policies in Supabase dashboard

### Deployment (Staging)

- [ ] Deploy code to staging branch
- [ ] Run full test suite
- [ ] Manual API testing with curl/Postman
- [ ] Load test pagination (N=1000 reports)
- [ ] Verify audit logging working

### Production

- [ ] Code review approved
- [ ] All gates passing in CI
- [ ] Backup database before migration
- [ ] Run migration with `supabase db push`
- [ ] Monitor logs for RLS violations
- [ ] Smoke test all endpoints
- [ ] Update API documentation (public-facing)

---

## Integration with CCP-05 (Workspace Hardening)

CCP-06 depends on CCP-05 utilities:

**Used From CCP-05:**
- `checkWorkspaceMembership()` - Role verification
- `workspace_members` table - Access control
- Workspace isolation patterns

**Complements CCP-05:**
- Adds second resource type (reports) to workspace model
- Demonstrates RLS patterns for CCP-07+
- Validates workspace membership mechanism

---

## Future Enhancements (CCP-07+)

CCP-07 will extend CCP-06 with:
- Data source citations in reports
- Rule references in projections
- Branding customization UI (custom fonts, CSS)
- Report versioning (v1.0 → v1.1)
- PDF export with branding

---

## Troubleshooting

### RLS Violations

**Error:** `new row violates row level security policy`

**Cause:** User is not a workspace member

**Fix:** Verify `workspace_members` record exists with correct `user_id`

### Branding Validation Fails

**Error:** `VALIDATION_ERROR: logo_url must be valid URL`

**Cause:** Invalid URL format provided

**Fix:** Ensure `logo_url` is valid URL starting with `https://`

### Reports Not Appearing in List

**Cause:** Pagination offset exceeds total count

**Fix:** Use `pagination.total` to determine max page number

---

## Performance Notes

- **Large Workspace Lists:** Use pagination with `limit=100`
- **Full-Text Search:** `idx_branded_reports_name` supports WHERE clause
- **Workspace Queries:** Always include `workspace_id` in WHERE for index hits
- **RLS Overhead:** Minimal (single FK lookup in membership check)

---

## Security Considerations

- ✅ RLS blocks unauthorized access at database layer
- ✅ Admin-only enforcement for creation/updates
- ✅ Audit logging for compliance (GDPR, SOC2)
- ✅ No projection mutation possible (immutable)
- ✅ Branding cascade prevents data leakage

---

## Appendix: Code Examples

### Creating a Report Programmatically

```typescript
import { createBrandedReport } from '@/lib/db/helpers/branded-reports';

const report = await createBrandedReport({
  workspace_id: 'workspace-uuid',
  name: 'Q1 2026 Assessment',
  projection: {
    parcel_id: 'parcel-789',
    location: { lat: 40.7128, lng: -74.006 },
    intent: 'Zoning verification'
  },
  branding: {
    workspace_name: 'GeoSelect Analytics',
    color_primary: '#FF6B35',
    logo_url: 'https://company.com/logo.png'
  },
  status: 'draft'
});
```

### Listing Reports with Pagination

```typescript
import { listBrandedReports } from '@/lib/db/helpers/branded-reports';

const { reports, total } = await listBrandedReports({
  workspace_id: 'workspace-uuid',
  status: 'published',
  limit: 50,
  offset: 0
});

console.log(`Found ${total} published reports, showing ${reports.length}`);
```

### Updating Report Status

```typescript
import { updateBrandedReport } from '@/lib/db/helpers/branded-reports';

const updated = await updateBrandedReport({
  id: 'report-uuid',
  workspace_id: 'workspace-uuid',
  status: 'published'
});
```

---

## References

- [CCP-05: Workspace Hardening](./CCP-05-PHASE-1-COMPLETE.md)
- [Frozen Contracts](../contracts/ccp06/error-codes.ts)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [CCP Progress Assessment](../CCP-PROGRESS-ASSESSMENT.md)
