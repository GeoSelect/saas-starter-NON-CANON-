# Strategy & Roadmap — GeoSelect.it / Telluride Hybrid

## Purpose
This document captures architectural decisions, repo workflow rules, and the current "One Happy Path" build targets for GitHub Copilot and contributors.

## Repo Workflow Rules (Frozen)

- **CCP-03 PR is intentionally narrow**: Report creation + contracts + tests only. No scope creep.
- **Supabase/CCP-00 work**: Keep on separate branch (product branch). Do not mix with upstream SaaS starter.
- **GitHub is the contractual boundary**: Nothing is "real" until merged upstream. All decisions are reversible until then.
- **Migrations are source of truth**: Database is derived state. Always track changes in `lib/db/migrations/`.
- **Branch strategy**: 
  - `feature/ccp03-contracts` → upstream PR (currently open)
  - `main` (product) → separate, for Supabase/auth/CCP-00 work
  - Feature branches for CCP-02, CCP-04, etc.

---

## What We Accomplished (Chronological)

### Phase 1: Repo & DB Workflow Foundations (2025-12-16 to 2025-12-19)
- Established repo structure guidance for `db/migrations`, seeds, and README patterns.
- Clarified that database dumps should be documented but not versioned in git.
- Implemented local Docker/Postgres operational commands and troubleshooting workflows.
- Validated branch protections on `main` and upstream settings.

### Phase 2: CCP "One Happy Path" Scaffolding (2026-01-02 to 2026-01-03)

#### Happy Path Model
```
bootstrap (public) 
  → authenticate/confirm session (blocking) 
  → parcel resolve (privileged) 
  → report create (privileged)
```

#### CCP-00: Account Context Resolve
- Supabase-oriented account/session bootstrap and telemetry concepts.
- RLS + table expectations discussion to support anonymous bootstrap without unsafe client writes.
- Status: Planned for product branch (not in upstream PR).

#### CCP-01: Location Resolve
- **Route**: `POST /api/location/resolve`
- **Status**: ✅ Implemented with frozen request/response contract tests.
- **Failure mode test**: `LOCATION_RESOLVE_CONTRACT` when required fields missing.
- **File**: `app/api/location/resolve/route.ts` + test suite.

#### CCP-03: Report Create (**PR Submitted**)
- **Route**: `POST /api/report/create`
- **Status**: ✅ Implemented with contract validation, parcel→report projection, frozen report skeleton.
- **Contracts**: 
  - `ParcelContext` → `ReportContext` projection (`projectParcelToReportContext`)
  - Frozen `Report` schema v"rpt-0.1" with sections (`overview`, `restrictions`, `process`)
  - `AuditEvent` factory and in-memory emitter
- **Audit behavior**: 
  - ✅ Emits `report.created` on success
  - ✅ **IMPORTANT FREEZE**: No audit events on contract failure
- **Test coverage**: Success and contract-failure modes.
- **PR link**: https://github.com/nextjs/saas-starter/compare/main...GeoSelect:feature/ccp03-contracts

---

## CCP Roadmap

### CCP-00: Account Bootstrap (Supabase + Auth)
- Define account/session schema and RLS rules.
- Implement `POST /api/session/bootstrap` (anonymous user creation).
- Implement `POST /api/session/confirm` (magic link verification).
- Target: Product branch (not upstream).

### CCP-01: Location Resolve ✅
- Reverse-geocode lat/lng to address components.
- Status: Done. Upstream if needed.

### CCP-02: Parcel Resolve (Geospatial Query)
- **Scope**: Query PostGIS DB for parcel geometries and metadata.
- **Route**: `POST /api/parcel/resolve`
- **Request**: `{ lat: number, lng: number, mode?: "point" | "area", ... }`
- **Response**: `{ ok: true, parcel: { id, geometry, owner, zoning, restrictions[], ... } }`
- **Key Decision**: Define minimum schema for `core.*` tables (parcels, owners, zoning) and `ref.*` tables (restriction types, reference data).
- **DB Verification**: Confirm QGIS-loaded fields match contract expectations.
- **Status**: Open (Phase 2b planning).

### CCP-03: Report Create ✅
- Status: PR submitted to upstream.
- Next: Await review/merge, then backport to product branch.

### CCP-04+: Advanced Analysis (Compliance, Risk, Recommendations)
- Planned for future phases based on CCP-02/CCP-03 foundation.

---

## Open Decisions

1. **CCP-02 Contract Shape**: Exact schema for parcel, owner, zoning, restrictions tables. Needs coordination with DB team.
   
2. **Supabase vs. PostGIS Trade-off**:
   - Supabase provides RLS, real-time subscriptions, but may not support advanced PostGIS queries.
   - PostGIS (raw) offers full geospatial power but requires custom RLS and auth logic.
   - Decision: Use Supabase as the primary store, mirror critical data to PostGIS for complex queries if needed.

3. **Vercel Agent Review Failure**: Tooling issue during PR checks. Code is valid; awaiting upstream maintainer review.

4. **Audit Emission DI Pattern**: Current implementation uses global `globalThis.__AUDIT_EVENTS` (test-friendly). For production, replace with dependency-injected emitter or event bus.

5. **Runtime Validation**: Should we add Zod schemas for all request/response contracts? Currently type-only contracts. Decision: Phase 2 enhancement.

---

## Key Terms & Definitions

- **CCP** = Capability Check Point (sellable capability or workflow milestone)
- **CTRL** = Control Point that enforces system behavior in the happy path.
- **Frozen Contract** = Immutable, versioned schema (e.g., `rpt-0.1`) that does not change within a version.
- **One Happy Path** = The primary, non-error workflow that demonstrates the product to users.
- **Supabase Product Branch** = Parallel development on `main` branch with Supabase/auth/CCP-00 integrations (not sent upstream).

---

## File Organization

```
lib/contracts/
  ├── ccp01/                      # Location resolve
  │   └── ...
  ├── ccp02/                      # Parcel resolve (planned)
  │   └── ...
  ├── ccp03/                      # Report create
  │   ├── parcel-to-report.ts     # Projection
  │   ├── report.schema.ts        # Frozen Report v"rpt-0.1"
  │   ├── auditEvent.schema.ts    # Audit event type + factory
  │   └── ccp03.fixture.ts        # Test fixture
  └── ...

app/api/
  ├── location/resolve/
  ├── parcel/resolve/             # CCP-02 (planned)
  └── report/create/
```

---

## Deployment & Environment Notes

- **Primary Target**: Upstream `nextjs/saas-starter` for portable, reusable code.
- **Product Target**: GeoSelect internal Supabase + custom auth (separate branch/repo).
- **Testing**: All code tested locally with Vitest before PR submission.
- **Database**: Local Docker Postgres + PostGIS for development; DigitalOcean managed for staging.

---

## Next Steps (Priority Order)

1. ✅ **CCP-03 PR Review**: Await upstream maintainers. Merge when approved.
2. 🔄 **CCP-02 Planning**: Define parcel schema, DB tables, contract shape. Coordinate with geospatial team.
3. 🔄 **Supabase Integration** (product branch): Implement CCP-00 bootstrap + session confirm + RLS rules.
4. ⏭️ **CCP-02 Implementation**: Implement `/api/parcel/resolve` with PostGIS queries.
5. ⏭️ **Audit Emission DI**: Replace global array with proper dependency injection for production.

---

*Last updated: Jan 3, 2026*  
*Authored by: GeoSelect team with GitHub Copilot*
