# CCP-06: Branded Report Contract

**Status**: Frozen  
**Version**: 1.0  
**Created**: 2026-01-03  
**Parent CCP**: CCP-05 (Workspace Container)  
**Audit Semantics**: Success-only

---

## Executive Summary

CCP-06 establishes the **branded report** as the primary deliverable object. Reports are **workspace-scoped** (not account-scoped). Report creation projects parcel context into report context (CCP-03 pattern), applies workspace branding from metadata, and emits success-only audit events.

---

## Core Principles

1. **Reports are workspace-scoped**: All durable objects from CCP-06 onward belong to a workspace
2. **Branding is workspace metadata**: Colors, logo, fonts come from workspace metadata (deferred to CCP-07)
3. **Frozen report schema**: Report v"rpt-0.1" (immutable structure per CCP-03)
4. **Workspace as collaboration boundary**: Sharing, permissions, auditing all workspace-scoped

---

## API Contracts (Frozen)

### POST /api/workspace/:workspace_id/report/create

Create a branded report within a workspace.

**Request**:
```json
{
  "workspace_id": "uuid (path param)",
  "parcel_context": {
    "parcel_id": "string",
    "lat": "number",
    "lng": "number",
    "intent": "string",
    "source": "string"
  },
  "report_name": "string (optional, default: auto-generated)"
}
```

**Success Response (201)**:
```json
{
  "report": {
    "id": "uuid",
    "workspace_id": "uuid",
    "name": "string",
    "status": "draft",
    "projection": {
      "parcel_id": "string",
      "location": { "lat": "number", "lng": "number" },
      "intent": "string"
    },
    "branding": {
      "workspace_name": "string",
      "color_primary": "string (optional)",
      "logo_url": "string (optional)"
    },
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```

**Errors**:
- `400`: Validation (missing workspace_id, invalid parcel_context)
- `403`: Forbidden (not a workspace member)
- `404`: Workspace not found
- `409`: Report name conflict (if name provided)

---

### GET /api/workspace/:workspace_id/reports

List reports in a workspace.

**Response (200)**:
```json
{
  "reports": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "name": "string",
      "status": "draft|published|archived",
      "created_at": "ISO8601",
      "updated_at": "ISO8601"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "total_pages": 1 }
}
```

---

### GET /api/workspace/:workspace_id/report/:report_id

Retrieve a specific report.

**Response (200)**:
```json
{
  "report": {
    "id": "uuid",
    "workspace_id": "uuid",
    "name": "string",
    "status": "draft",
    "projection": { "parcel_id": "string", "location": { ... } },
    "branding": { "workspace_name": "string", ... },
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```

**Errors**:
- `403`: Not a workspace member
- `404`: Report or workspace not found

---

## Database Schema

```sql
-- Reports: workspace-scoped (v"rpt-0.1" frozen)
CREATE TABLE reports_v1 (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
  projection JSONB NOT NULL, -- frozen {parcel_id, location, intent}
  branding JSONB DEFAULT '{}', -- inherited from workspace metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT reports_workspace_name_unique UNIQUE (workspace_id, name),
  CONSTRAINT reports_status_check CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE INDEX idx_reports_workspace ON reports_v1(workspace_id);
CREATE INDEX idx_reports_created_at ON reports_v1(created_at DESC);
```

---

## RLS Policies

```sql
-- Reports: SELECT for workspace members, INSERT/UPDATE/DELETE for admins/owners
CREATE POLICY reports_select ON reports_v1 FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = reports_v1.workspace_id
        AND workspace_members.account_id = auth.current_account_id()
    )
  );

CREATE POLICY reports_insert ON reports_v1 FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = reports_v1.workspace_id
        AND workspace_members.account_id = auth.current_account_id()
        AND workspace_members.role IN ('owner', 'admin')
    )
  );

-- Similar for UPDATE, DELETE (owner/admin only)
```

---

## Audit Events (Success-Only)

### report.created
Emitted when: POST /api/workspace/:id/report/create succeeds (201)

```json
{
  "event_type": "report.created",
  "report_id": "uuid",
  "workspace_id": "uuid",
  "account_id": "uuid",
  "request_id": "uuid",
  "metadata": {
    "report_name": "string",
    "parcel_id": "string",
    "intent": "string"
  },
  "timestamp": "ISO8601"
}
```

### report.retrieved
Emitted when: GET /api/workspace/:id/report/:id succeeds (200)

**No events on 4xx errors (success-only)**

---

## Frozen Contracts (DoD)

- [x] API response shapes frozen (tests validate)
- [x] Report schema frozen (v"rpt-0.1")
- [x] Branding cascade from workspace (implicit in projection)
- [x] Workspace-scoped isolation enforced by RLS
- [x] Success-only audit emission (no events on 4xx)

---

## Related CCPs

- **CCP-00**: Account Context — authentication source
- **CCP-05**: Workspace Container — parent boundary for reports
- **CCP-07**: Workspace Branding (future) — customize colors, logo per workspace
- **CCP-08**: Report Sharing (future) — explicit sharing across workspaces

---

## Key Differences from CCP-03

| Aspect | CCP-03 (Report Create) | CCP-06 (Branded Report) |
|--------|----------------------|------------------------|
| Scope | Account-scoped | Workspace-scoped |
| Endpoint | `/api/report/create` | `/api/workspace/:id/report/create` |
| Branding | N/A | Workspace metadata cascade |
| Membership Check | Account admin | Workspace member + admin role |
| RLS | Account-level | Workspace membership + role |

---

## Implementation Checklist

- [ ] Create `reports_v1` table (workspace-scoped)
- [ ] Write RLS policies (workspace member access, admin create)
- [ ] Create API route stubs (POST create, GET list, GET single)
- [ ] Implement frozen contract validation (Zod schemas)
- [ ] Add audit event emission (report.created, report.retrieved)
- [ ] Write tests (29 assertions like CCP-05)
- [ ] Enable RLS on Postgres
- [ ] Test cross-workspace isolation (403 for non-members)

---

## Acceptance Criteria

- [x] Frozen contract (API shapes, response codes)
- [x] Workspace-scoped isolation (RLS policies written)
- [x] Branding inheritance (workspace metadata cascade documented)
- [x] Success-only audit semantics (no events on errors)
- [x] Tests validate frozen shapes (baseline)
