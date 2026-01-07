# Architecture File Ownership Mapping

## Purpose

Maps all existing architecture files to ownership domains.  
Clarifies which team owns each deliverable.

---

## Files by Owner

### Backend / SRE Owned Files

#### Core Authentication & Context
- **`apps/web/src/lib/auth/server-context.ts`** ✅
  - Owner: Backend
  - Responsibility: Server-side workspace resolution
  - Contains: `getAuthContextServerSide()`, validation, guards
  - Audit: Logs access attempts

#### Audit System (Primary Backend, Secondary Security)
- **`migrations/010_audit_trail_production.sql`** ✅
  - Owner: Backend (Security validates)
  - Responsibility: Immutable audit schema, constraints, triggers
  - Contains: 5 tables, 7 constraints, automatic logging
  - Monitoring: SRE monitors archive/partition jobs

- **`migrations/011_workspace_audit_triggers.sql`** (Planned)
  - Owner: Backend (Security specifies requirements)
  - Responsibility: Automatic workspace/membership logging
  - Contains: 6 triggers, auto-logging on changes

- **`AUDIT_IMPLEMENTATION_GUIDE.md`** 📖
  - Owner: Backend (Primary documentation)
  - Purpose: Step-by-step implementation
  - Audience: Backend engineers, DBAs

- **`AUDIT_QUICK_REFERENCE.md`** 📖
  - Owner: Backend (Reference for engineers)
  - Purpose: Quick lookup for audit queries
  - Audience: All engineers

#### Workspace Management
- **`apps/web/src/hooks/useWorkspaces.ts`** ✅
  - Owner: Backend (via API endpoint)
  - Responsibility: Orchestration layer
  - Frontend wrapper: Frontend implements UI

- **`apps/api/routes/workspaces/select`** (Implied)
  - Owner: Backend
  - Responsibility: Set active workspace cookie + audit log
  - Returns: Workspace context, triggers router.refresh()

#### Entitlements
- **`lib/services/entitlements.ts`** (Existing)
  - Owner: Backend
  - Responsibility: Permission enforcement, caching
  - Audit: Logs entitlement checks

---

### Frontend / UI Owned Files

#### Workspace Switching
- **`apps/web/src/components/WorkspaceSwitcherDropdown.tsx`** ✅
  - Owner: Frontend
  - Responsibility: UI affordance for workspace selection
  - Calls: Backend API (selectWorkspace)
  - Does NOT: Enforce permissions

- **`apps/web/src/components/Header.tsx`** ✅
  - Owner: Frontend
  - Responsibility: Navigation container
  - Contains: WorkspaceSwitcherDropdown

- **`apps/web/src/components/DashboardLayout.tsx`** ✅
  - Owner: Frontend
  - Responsibility: Layout wrapper
  - Uses: Header + main content

#### Account Console (Frontend + Product)
- **`app/(dashboard)/audit/page.tsx`** ✅
  - Owner: Frontend (primary), Product (secondary)
  - Responsibility: UI for workspace/team/account settings
  - Calls: Backend APIs (Backend enforces)
  - Does NOT: Validate permissions

#### Trust Signals (Not Yet Created)
- **`BlockedExplain` component** (Future)
  - Owner: Frontend
  - Responsibility: Explain why feature is blocked
  - Receives: Backend-provided reason string

- **`TrustSignal` component** (Future)
  - Owner: Frontend
  - Responsibility: Show user why they can trust this
  - Examples: "Certified SOC2", "Encrypted"

---

### Product / Design Owned Files

#### Messaging & Narrative
- **`PRODUCT_NARRATIVE.md`** (Should create)
  - Owner: Product
  - Contains: Why each CCP matters, customer value
  - References: OWNERSHIP_INTAKE.md

- **`UX_MICROCOPY.md`** (Should create)
  - Owner: Product
  - Contains: Copy for CTAs, explanations, errors
  - Reviewed by: Frontend for implementation

#### Account Console Copy (Shared with Frontend)
- `app/(dashboard)/audit/page.tsx` (Product owns copy)
  - Owner: Product (copy & messaging)
  - Owner: Frontend (implementation)

---

### Security / Compliance Owned Files

#### Audit & Compliance
- **`OWNERSHIP_INTAKE.md`** ✅
  - Owner: Security
  - Responsibility: Define ownership boundaries
  - Reviews: Quarterly

- **Audit Retention Policies** (DB config)
  - Owner: Security
  - Responsibility: Define hot/warm/cold retention
  - Sets: `audit_retention_policies` per workspace

- **Compliance Mappings** (Should create)
  - Owner: Security
  - Contains: SOC2, GDPR, CCPA mappings
  - References: Audit system capabilities

---

### SRE / Ops Owned Files

#### Deployment & Monitoring
- **`AUDIT_DEPLOYMENT_CHECKLIST.md`** 📖
  - Owner: SRE (Primary), Backend (Secondary)
  - Responsibility: Deployment procedures, verification
  - Audience: SRE, DevOps

- **`AUDIT_QUICK_START.md`** 📖
  - Owner: SRE (Quick deployment)
  - Purpose: 30-minute deployment path
  - Audience: SRE, ops engineers

- **Monitoring & Alerting Config** (Should create)
  - Owner: SRE
  - Responsibility: Archive job alerts, partition health
  - Tools: Datadog, New Relic, etc.

---

## Documentation Files

### Navigation & Overview
- **`AUDIT_INDEX.md`** 📖
  - Owner: Backend (primary)
  - Purpose: Guide readers to right docs
  - Audience: Everyone

- **`AUDIT_SYSTEM_COMPLETE.md`** 📖
  - Owner: Backend (primary)
  - Purpose: Architecture overview
  - Audience: Decision makers, engineers

- **`AUDIT_DELIVERY_SUMMARY.md`** 📖
  - Owner: Backend (primary)
  - Purpose: What was delivered
  - Audience: Project leads, stakeholders

- **`AUDIT_DELIVERY_COMPLETE.md`** 📖
  - Owner: Backend (primary)
  - Purpose: Delivery checklist
  - Audience: Project leads

- **`WORKSPACE_AUDIT_TRIGGERS.md`** 📖
  - Owner: Backend (primary)
  - Purpose: Trigger implementation guide
  - Audience: Backend engineers

---

## Ownership Summary by Domain

```
BACKEND / SRE (40 responsibilities)
├── Audit schema & enforcement (6 files)
├── Workspace context & switching (3 files)
├── Entitlements enforcement (1 file)
├── API contracts (implied, 3+ endpoints)
├── RLS policies (implied)
├── Deployment documentation (2 files)
└── Technical guides (5 files)

FRONTEND / UI (10 responsibilities)
├── Workspace switcher component (1 file)
├── Header & layout (2 files)
├── Account console UI (1 file)
├── Trust signal components (future, 2 files)
└── Integration with Backend APIs (no files, responsibility)

PRODUCT / DESIGN (8 responsibilities)
├── Feature tier messaging (future file)
├── UX microcopy (future file)
├── Account console copy (shared, 1 file)
├── CCP narrative (future file)
└── Flow coherence (responsibility)

SECURITY / COMPLIANCE (6 responsibilities)
├── Ownership framework (1 file: OWNERSHIP_INTAKE.md)
├── Retention policies (DB config)
├── Compliance mappings (future file)
├── Access reviews (process, no files)
└── Incident response (process, no files)

SRE / OPS (5 responsibilities)
├── Deployment procedures (1 file)
├── Quick start (1 file)
├── Monitoring config (future file)
├── Backup/restore (process, no files)
└── Environment separation (process, no files)
```

---

## File Status by Ownership

### Backend-Owned (Primary)
| File | Status | Notes |
|------|--------|-------|
| `migrations/010_audit_trail_production.sql` | ✅ Complete | 1200 lines, tested |
| `migrations/011_workspace_audit_triggers.sql` | 📋 Designed | Ready for implementation |
| `server-context.ts` | ✅ Complete | Hierarchical resolver |
| `useWorkspaces.ts` | ✅ Complete | Hook wrapper |
| `workspace API routes` | ⚠️ Partial | selectWorkspace exists |

### Frontend-Owned (Primary)
| File | Status | Notes |
|------|--------|-------|
| `WorkspaceSwitcherDropdown.tsx` | ✅ Complete | Native select |
| `Header.tsx` | ✅ Complete | Navigation container |
| `DashboardLayout.tsx` | ✅ Complete | Layout wrapper |
| `account console` | ✅ Complete | UI for settings |
| `BlockedExplain` | 🔄 Future | Needs design spec |
| `TrustSignal` | 🔄 Future | Needs design spec |

### Product-Owned (Primary)
| File | Status | Notes |
|------|--------|-------|
| UX Narrative | 🔄 Pending | Should create |
| UX Microcopy | 🔄 Pending | Should create |
| Product Decisions | ✅ Implicit | In code, not documented |

### Security-Owned (Primary)
| File | Status | Notes |
|------|--------|-------|
| `OWNERSHIP_INTAKE.md` | ✅ Complete | This file |
| Compliance Mappings | 🔄 Pending | SOC2, GDPR, CCPA |
| Retention Policies | ⚠️ Partial | Defaults set, not reviewed |

### SRE-Owned (Primary)
| File | Status | Notes |
|------|--------|-------|
| `AUDIT_DEPLOYMENT_CHECKLIST.md` | ✅ Complete | 9 phases |
| `AUDIT_QUICK_START.md` | ✅ Complete | 30-min path |
| Monitoring Config | 🔄 Pending | Alerts not set up |
| Backup/Restore | ⚠️ Partial | Standard procedures |

---

## Gaps & Actions

### Missing Files (Should Create)

**Product** 🔴
- [ ] Create: `PRODUCT_NARRATIVE.md` - Why each CCP matters
- [ ] Create: `UX_MICROCOPY.md` - Copy for all states
- Owner: Product / Design

**Security** 🔴
- [ ] Create: `COMPLIANCE_MAPPING.md` - SOC2, GDPR, CCPA
- [ ] Create: `DATA_RETENTION_POLICY.md` - Per-workspace config
- Owner: Security / Compliance

**SRE** 🟡
- [ ] Create: `MONITORING_ALERTS.md` - Archive job, partitions
- [ ] Create: `BACKUP_RESTORE_RUNBOOK.md` - Disaster recovery
- Owner: SRE / Ops

**Backend** 🟡
- [ ] Implement: Workspace audit triggers (designed, not yet deployed)
- [ ] Implement: Missing workspace API routes (marked ⚠️ Partial)
- [ ] Document: API contract for each endpoint
- Owner: Backend

---

## Cross-Ownership Coordination Points

### Backend ↔ Security
- **Touchpoint**: Audit system design
- **Process**: Backend designs, Security validates compliance
- **Review Cycle**: Quarterly
- **Escalation**: [Security Lead]

### Frontend ↔ Backend
- **Touchpoint**: UI calls API, Backend enforces
- **Process**: Frontend builds UI, Backend provides API contract
- **Review Cycle**: Per sprint
- **Escalation**: [Backend Lead]

### Product ↔ Frontend
- **Touchpoint**: Copy, messaging, flow
- **Process**: Product writes narrative, Frontend implements
- **Review Cycle**: Per feature
- **Escalation**: [Product Lead]

### Backend ↔ SRE
- **Touchpoint**: Deployment, monitoring, alerting
- **Process**: Backend provides runbook, SRE deploys & monitors
- **Review Cycle**: Per release
- **Escalation**: [SRE Lead]

---

## Approval Gates

When merging code that touches shared boundaries:

```
Backend merges auth/audit code
  → Security reviews for compliance
  → SRE reviews for operational impact
  
Frontend merges blocked state UI
  → Backend provides reason string
  → Product validates messaging
  
Product finalizes messaging
  → Frontend implements & tests
  → Validated by security review
```

---

**Status**: Active  
**Created**: 2026-01-07  
**Review Cycle**: Quarterly (January, April, July, October)  
**Last Reviewed**: 2026-01-07
