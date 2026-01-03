# CCP Register — Authoritative Capability Check Point Definitions

This document defines all Capability Check Points (CCPs) for GeoSelect.it. Each CCP is a sellable capability and represents a product milestone. A CCP is "done" when:

1. **API contract is frozen** (request/response JSON shapes are immutable within that version)
2. **Tests exist** for success and contract failure modes
3. **Audit event semantics are correct** (success-only, no-emit-on-failure, etc.)
4. **PR is narrowly scoped** to that CCP only (no scope creep)

---

## CCP Definitions

| ID | Title | Description | Status | Contract | Tests | Audit |
|---|---|---|---|---|---|---|
| CCP-00 | Account Context Resolve | Supabase session bootstrap + account creation | Planned | - | - | - |
| CCP-01 | Location Resolve | Reverse-geocode lat/lng to address | ✅ Done | Frozen | ✅ | N/A |
| CCP-02 | Parcel Resolve | PostGIS query for parcel geometries + metadata | Open | - | - | - |
| CCP-03 | Report Create | Project parcel context → frozen report skeleton | 🔄 PR | Frozen | ✅ | Success-only |
| CCP-04 | Report Snapshot | Save report snapshot to DB | Planned | - | - | - |
| CCP-05 | Workspace Create | Create a workspace for collaboration | Planned | - | - | - |
| CCP-06 | Branded Report | Apply custom branding to report | Planned | - | - | - |
| CCP-07 | Data Provenance Access | Query data source audit trail | Planned | - | - | - |
| CCP-08 | Parcel Save | Save parcel to user's workspace | Planned | - | - | - |
| CCP-09 | Contacts Access | Query contact list from workspace | Planned | - | - | - |
| CCP-10 | Note Annotate | Add notes/annotations to report | Planned | - | - | - |
| CCP-11 | Event Create | Create domain event in audit log | Planned | - | - | - |
| CCP-12 | Event Association | Link events to parcels/reports | Planned | - | - | - |
| CCP-13 | Event Visualization | Render event timeline UI | Planned | - | - | - |
| CCP-14 | White Label | Apply white-label branding + domains | Planned | - | - | - |
| CCP-15 | Event Provenance | Query event source/lineage | Planned | - | - | - |
| CCP-16 | Report Render Advanced | Advanced rendering (PDF, multi-format) | Planned | - | - | - |

---

## CCP-00: Account Context Resolve

**Description**: Supabase session bootstrap + account context creation for anonymous→authenticated flow.

**Epic**: CCP-00_ACCOUNT_CONTEXT_RESOLVE

**Happy Path**:
```
POST /api/session/bootstrap
  → { ok: true, session: { id, key, created_at } }
POST /api/session/confirm
  → { ok: true, account: { id, email, workspace_id } }
```

**Failure Modes**:
- ACCOUNT_CONTEXT_CONTRACT (missing fields)
- SESSION_EXPIRED (invalid session)

**Audit Events**: `session.created`, `account.confirmed`

**Dependencies**: Supabase Auth + RLS rules

**Status**: Planned for product branch (CCP-00 branch)

---

## CCP-01: Location Resolve

**Description**: Reverse-geocode lat/lng to address components (street, city, zip, etc.).

**Epic**: CCP-01_LOCATION_RESOLVE

**Route**: `POST /api/location/resolve`

**Contract** (Frozen):
```typescript
Request: { mode: "point" | "area", lat: number, lng: number, source?: string, confidence?: number }
Response: { ok: true, location: { street, city, state, zip, country, raw_address } }
Error: { ok: false, error: "LOCATION_RESOLVE_CONTRACT", code: "INVALID_COORDS" }
```

**Audit Events**: `location.resolved` (success-only)

**Implementation**: `app/api/location/resolve/route.ts`

**Tests**: `app/api/location/resolve/route.test.ts` ✅

**Status**: ✅ Complete

---

## CCP-02: Parcel Resolve

**Description**: Query PostGIS database for parcel geometries, ownership, zoning, and restrictions based on lat/lng or parcel ID.

**Epic**: CCP-02_PARCEL_RESOLVE

**Route**: `POST /api/parcel/resolve`

**Contract** (Open for definition):
```typescript
Request: { mode: "point" | "id", lat?: number, lng?: number, parcel_id?: string, include?: ["geometry", "owner", "zoning", "restrictions"] }
Response: { ok: true, parcel: { id, geometry, owner: { name, email }, zoning, restrictions: [] } }
Error: { ok: false, error: "PARCEL_RESOLVE_CONTRACT", code: "PARCEL_NOT_FOUND" }
```

**Key Decisions**:
- Define minimum schema for `core.*` tables: parcels, owners, zoning
- Define minimum schema for `ref.*` tables: restriction types, reference data
- Verify QGIS-loaded fields match contract expectations
- PostGIS vs. Supabase trade-off: Use Supabase RLS + mirror to PostGIS if needed

**Audit Events**: `parcel.resolved` (success-only)

**Implementation**: `app/api/parcel/resolve/route.ts`

**Tests**: `app/api/parcel/resolve/route.test.ts` (TODO)

**Status**: Open (Phase 2b planning)

---

## CCP-03: Report Create

**Description**: Project ParcelContext → ReportContext and create a frozen Report skeleton with audit event emission.

**Epic**: CCP-03_REPORT_CREATE

**Route**: `POST /api/report/create`

**Contract** (Frozen v"rpt-0.1"):
```typescript
Request: { parcel_context, intent: { mode }, report_id?: string, request_id?: string, actor?: { actor_type, actor_id, account_id } }
Response: { ok: true, report: { id, version: "rpt-0.1", sections: [{ type, blocks: [] }] } }
Error (contract): { ok: false, error: "REPORT_CREATE_CONTRACT", code: "MISSING_PARCEL" }
Error (server): { ok: false, error: "REPORT_CREATE_FAILED", code: "REPORT_CREATE_FAILED" }
```

**Audit Events**:
- ✅ `report.created` emitted on success
- ✅ **NO events** emitted on contract failure (frozen behavior)

**Implementation**:
- `app/api/report/create/route.ts`
- `lib/contracts/parcel-to-report.ts` (projection)
- `lib/contracts/report.schema.ts` (frozen Report v"rpt-0.1")
- `lib/contracts/auditEvent.schema.ts` (audit factory)

**Tests**: `app/api/report/create/route.test.ts` ✅

**PR**: https://github.com/nextjs/saas-starter/compare/main...GeoSelect:feature/ccp03-contracts

**Status**: 🔄 PR submitted (awaiting upstream review)

---

## CCP-04 through CCP-16

*Placeholder descriptions—to be detailed as CCPs approach development.*

| CCP | Summary | Status |
|---|---|---|
| CCP-04 | Report Snapshot — save report to DB | Planned |
| CCP-05 | Workspace Create — create collaboration workspace | Planned |
| CCP-06 | Branded Report — apply custom branding | Planned |
| CCP-07 | Data Provenance Access — query audit trail | Planned |
| CCP-08 | Parcel Save — save parcel to workspace | Planned |
| CCP-09 | Contacts Access — query contacts | Planned |
| CCP-10 | Note Annotate — add notes to report | Planned |
| CCP-11 | Event Create — log domain event | Planned |
| CCP-12 | Event Association — link events to entities | Planned |
| CCP-13 | Event Visualization — render timeline | Planned |
| CCP-14 | White Label — custom branding + domains | Planned |
| CCP-15 | Event Provenance — query event lineage | Planned |
| CCP-16 | Report Render Advanced — PDF + multi-format | Planned |

---

## GitHub Labels (To Create)

Use these labels to tag issues and PRs by CCP and capability type:

- `ccp-00`, `ccp-01`, ..., `ccp-16` — CCP identifier
- `capability` — marks issues/PRs that add sellable capability
- `contract-frozen` — contract is immutable (design complete)
- `tests-required` — PR must include tests
- `audit-events` — PR affects audit semantics

---

## GitHub Milestones (To Create)

Create one milestone per CCP:

**Milestone Title**: `CCP-03_REPORT_CREATE`

**Description**: 
```
Freeze report create contract (request/response JSON).
Implement parcel → report projection.
Emit audit events (success-only).
Add tests for success + contract failure modes.
```

**Completion Criteria**:
- [ ] API contract frozen (JSON shapes immutable)
- [ ] Tests for success path
- [ ] Tests for contract failure path
- [ ] Audit event semantics correct
- [ ] PR merged (or ready for merge)

---

## PR Title & Commit Footer Convention

### PR Title Format
```
[CCP-03] Freeze report create contract + tests
```

### Commit Footer Format
```
feat(api): implement report create projection + audit

<body>

CCP: CCP-03_REPORT_CREATE
CTRL: CTRL-A04_PARCEL_CONTEXT_LOAD
Contract: frozen
Audit: success-only
```

This metadata makes Copilot far more likely to understand your capability system from repo history.

---

## Related Files

- `docs/copilot-context.md` — Technical reference (architecture, endpoints, testing)
- `docs/strategy.md` — Strategic roadmap & decisions (phases, workflow rules)
- `CONTRIBUTING.md` — Contribution guidelines (reference CCP system)

---

*Last updated: Jan 3, 2026*
