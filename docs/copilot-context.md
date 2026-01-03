# Copilot Context: GeoSelect SaaS Starter

## Project Overview
NextJS SaaS starter with geospatial features. Currently implementing CCP-03 (Comprehensive Context Pipeline v0.3) contracts for report generation and parcel analysis.

## Architecture

### Frozen Contracts Pattern
We use immutable, versioned contract schemas to enable parallel development. Each contract is frozen to a specific version and not mutated.

- **Report Schema** (`lib/contracts/report.schema.ts`): `version: "rpt-0.1"`
  - Structure: `{ id, report_id, request_id, version, sections: Section[], created_at }`
  - Sections: `overview`, `restrictions`, `process` (fixed types)
  - Factory: `createReportSkeleton(report_id, request_id, context)` → frozen Report

- **ParcelContext → ReportContext Projection** (`lib/contracts/parcel-to-report.ts`)
  - Function: `projectParcelToReportContext(parcel: any, intent: any) → ReportContext`
  - Transforms parcel data + intent into report building context

- **AuditEvent Schema** (`lib/contracts/auditEvent.schema.ts`)
  - Type: `{ type: string, actor: Actor | null, report_id: string | null, request_id: string | null, payload: any | null, created_at: string }`
  - Factory: `makeAuditEvent(fields) → AuditEvent`
  - Emission: stored in `globalThis.__AUDIT_EVENTS` (in-memory, for tests and observability)

### CCP-03 Contract
- **File**: `lib/contracts/ccp03.ts` with parser function
- **Fixture**: `lib/contracts/ccp03.fixture.ts` exports `PCX_FIXTURE` (ParcelContext test data)
- Used to validate parcel data before projection

## Key Endpoints

### POST /api/report/create
**Route**: `app/api/report/create/route.ts`

**Request body**:
```typescript
{
  parcel_context: Record<string, any>,      // Required; validated against CCP-03
  intent?: { mode: string, ... },            // Required for report context
  report_id?: string,                        // Optional; generated if missing
  request_id?: string,                       // Optional; null if missing
  actor?: { actor_type: string, actor_id: string, account_id: string }  // Optional
}
```

**Success Response** (200):
```json
{
  "ok": true,
  "report": { "id": "...", "report_id": "...", "version": "rpt-0.1", "sections": [...] }
}
```

**Contract Failure** (400):
```json
{
  "ok": false,
  "error": "REPORT_CREATE_CONTRACT",
  "code": "MISSING_PARCEL"
}
```

**Server Error** (500):
```json
{
  "ok": false,
  "error": "REPORT_CREATE_FAILED",
  "code": "REPORT_CREATE_FAILED"
}
```

**Behavior**:
1. Validates `parcel_context` is present and is an object
2. Validates `intent` is defined (422 if missing)
3. Projects parcel → report context
4. Creates frozen Report skeleton
5. Emits audit event: `{ type: "report.created", report_id, request_id, payload: { intent } }`
6. Returns frozen Report shape

**Tests** (`app/api/report/create/route.test.ts`):
- ✅ Success: emits `report.created` event on valid input
- ✅ Contract failure: emits NO events on missing `parcel_context`

## Testing

**Framework**: Vitest v4.0.16  
**Command**: `pnpm test --run`  
**Current Status**: 7 tests passing (4 test files)

### Test Files
- `__tests__/ccp03.report.test.ts` — CCP-03 fixture parsing
- `__tests__/report.create.test.ts` — Report creation logic
- `app/api/report/create/route.test.ts` — Endpoint behavior & audit emission
- `app/api/location/resolve/route.test.ts` — Location resolution (pre-existing)

### Test Utilities
- `makeReq(json)` helper to construct Request objects for route handlers
- Global audit sink: `globalThis.__AUDIT_EVENTS` (reset in `beforeEach`)

## Project Structure
```
lib/contracts/
  ├── ccp03.ts                     # CCP-03 parser
  ├── ccp03.fixture.ts             # Test fixture (PCX_FIXTURE)
  ├── parcel-to-report.ts          # Projection: ParcelContext → ReportContext
  ├── report.schema.ts             # Frozen Report v"rpt-0.1" + skeleton factory
  └── auditEvent.schema.ts         # AuditEvent type + factory

app/api/report/create/
  ├── route.ts                     # POST /api/report/create handler
  └── route.test.ts                # Endpoint tests (audit emission + failure modes)
```

## Git Workflow

**Current Status**:
- Feature branch: `feature/ccp03-contracts` (based on `upstream/main`)
- PR submitted: https://github.com/nextjs/saas-starter/pulls
- Status: Awaiting review (Vercel agent review had service issue, but PR is valid)

**Key Commits**:
- `d7c420c`: test(report): add CCP-03 audit emission and failure tests for /api/report/create

**Remotes**:
- `origin`: https://github.com/GeoSelect/saas-starter.git (your fork)
- `upstream`: https://github.com/nextjs/saas-starter.git (official)

## Next Steps

1. **PR Review & Merge**: Await upstream maintainers
2. **Audit Emission DI**: Replace global array with dependency-injected emitter (production-ready)
3. **Runtime Validation**: Add Zod schemas for Request/Response contracts
4. **CCP-02 Implementation**: Parallel work on compliance/restrictions analysis

## Conventions

- **Import paths**: Use relative imports in tests (Vitest compatibility), `@/lib` in production code
- **Contract naming**: `<domain>.<entity>.schema.ts` for frozen schemas, `.ts` for parsers
- **Audit events**: Always include `type`, optionally `actor`, `report_id`, `request_id`, `payload`, `created_at`
- **Error responses**: Return `{ ok: false, error: CODE, [code: CODE] }` (contract-style errors)

## Dependencies
- **Next.js 15+** (App Router)
- **TypeScript**
- **Vitest** (testing)
- **Zod** (optional; for runtime validation)
- **PostGIS** (optional; for geospatial DB operations)

## Contact & Context
- **User**: GeoSelect team
- **Database**: Local Docker Postgres with PostGIS (DigitalOcean import via QGIS)
- **Environment**: Windows PowerShell, VS Code

---

*Last updated: Jan 3, 2026*
