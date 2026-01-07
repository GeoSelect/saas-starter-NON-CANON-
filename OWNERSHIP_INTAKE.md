# GeoSelect Enterprise — Ownership Intake Summary

## Purpose

Clear ownership boundaries for GeoSelect Enterprise.  
Each surface has **one primary owner** responsible for correctness and outcomes.  
Other roles may contribute but do not own final decisions.

---

## Ownership Domains

### 🔒 Platform / Backend

**Owner**: Backend / SRE  
**Accountability**: Enforcement, correctness, durability

**Owns**:
- C001 AppShell (server context, lifecycle)
- Entitlements model & enforcement
- Audit schema & immutable writes
- RLS policies (Supabase / Postgres)
- Frozen contracts (report, workspace, audit)
- CCP correctness at API + data layer

**Does NOT own**:
- UI behavior or copy
- Visual explanation of rules

---

### 🎨 Frontend / UI

**Owner**: Frontend / UI  
**Accountability**: Clarity, affordance, trust signaling

**Owns**:
- BlockedExplain
- TrustSignal
- WorkspaceSwitcher
- Feature-gated UI states
- Loading / empty / error states
- Mobile + desktop parity

**Does NOT own**:
- Enforcement logic
- Security or permissions

---

### 📊 Product / Design

**Owner**: Product + Design  
**Accountability**: Meaning, narrative, decision quality

**Owns**:
- Message copy & CTAs
- UX microcopy
- Flow coherence across CCPs
- "Why this matters" explanations

**Does NOT own**:
- Technical enforcement
- Data correctness

---

### 🛠️ SRE / Ops

**Owner**: Ops / SRE  
**Accountability**: Availability, recoverability, hygiene

**Owns**:
- Monitoring & alerting
- DB roles & environment separation
- Secrets management
- Backups & restores
- Runtime configuration

**Does NOT own**:
- Feature behavior
- UI or product decisions

---

### 🔐 Security / Compliance

**Owner**: Security  
**Accountability**: Risk containment, auditability

**Owns**:
- Data retention policies
- Access reviews
- Role audits
- Compliance mappings (SOC-lite → SOC2)
- Incident response playbooks

**Does NOT own**:
- Feature velocity
- UI or UX

---

## CCP Ownership Mapping

| CCP | Feature | Primary Owner | Secondary | Status |
|-----|---------|---------------|-----------|--------|
| **CCP-00** | Account Context | Backend / SRE | Security | ✅ Ownership Clear |
| **CCP-01** | Location Resolve | Frontend / UI | Product | ✅ Ownership Clear |
| **CCP-03** | Report Create | Backend / SRE | Product | ✅ Ownership Clear |
| **CCP-05** | Workspace Create | Backend / SRE | Security | ✅ Ownership Clear |
| **CCP-06** | Branded Report | Product / Design | Frontend | ✅ Ownership Clear |
| **CCP-07** | Report Retrieval | Frontend / UI | Backend | ✅ Ownership Clear |
| **CCP-08** | Share | Security | Backend | ✅ Ownership Clear |

---

## Cross-Domain Coordination

### Audit System (Backend/Security Joint)

**Primary Owner**: Backend / SRE  
**Secondary Owner**: Security / Compliance

| Aspect | Owner | Reason |
|--------|-------|--------|
| Schema design & immutability | Backend | Enforces at DB layer |
| Constraint checks | Backend | Technical correctness |
| Archival strategy | Backend | Data durability |
| Partitioning & scaling | Backend | Operational performance |
| Retention policies | Security | Compliance requirements |
| Deletion requests (GDPR) | Security | Regulatory authority |
| Audit logging & forensics | Security | Incident investigation |
| Monitoring & alerting | SRE | Operational health |

**Decision Process**:
1. Backend designs schema (immutable, enforced)
2. Security specifies retention requirements
3. SRE deploys and monitors
4. Security audits access quarterly

---

### Workspace Switching (Frontend/Backend Joint)

**Primary Owner**: Frontend / UI  
**Secondary Owner**: Backend / SRE

| Aspect | Owner | Reason |
|--------|-------|--------|
| UI dropdown / selection | Frontend | User affordance |
| Loading / error states | Frontend | User feedback |
| Cookie management | Backend | Security & durability |
| Context resolution | Backend | Data correctness |
| RLS enforcement | Backend | Permission enforcement |
| Monitoring workspace switches | Backend | Audit trail |

**Decision Process**:
1. Frontend implements UX (with BackendSwitcher)
2. Backend handles cookie + server context
3. Backend logs to audit trail
4. Security reviews access patterns monthly

---

### Entitlements (Backend/Product Joint)

**Primary Owner**: Backend / SRE  
**Secondary Owner**: Product / Design

| Aspect | Owner | Reason |
|--------|-------|--------|
| Entitlement model | Backend | Technical correctness |
| Permission enforcement | Backend | Security boundary |
| Paywall logic | Product | Business rules |
| UnlockPremium messaging | Product | Narrative clarity |
| Entitlement cache | Backend | Performance |
| Compliance audit | Security | SOC2 mapping |

**Decision Process**:
1. Product defines feature tier mapping
2. Backend implements enforcement
3. Backend caches for performance
4. Security validates compliance quarterly

---

## Decision Rights Framework

### When to Escalate

| Scenario | Owner | Process |
|----------|-------|---------|
| Schema change touches audit | Backend | Run by Security team review |
| Feature gating logic | Backend + Product | Both must agree on rules |
| UI message for blocked state | Product | Backend provides reason string |
| Retention policy change | Security | Run by Backend for feasibility |
| RLS policy change | Backend | Run by Security for correctness |
| Access review finding | Security | Run by Backend for fix |

### Approval Matrix

| Decision | Backend | Frontend | Product | Security | SRE |
|----------|---------|----------|---------|----------|-----|
| API schema | ✅ Final | — | 👀 | 👀 | — |
| RLS policy | ✅ Final | — | — | 👀 | — |
| Audit schema | ✅ Final | — | — | ✅ Final | 👀 |
| UI component | — | ✅ Final | 👀 | — | — |
| Messaging | — | 👀 | ✅ Final | — | — |
| Infrastructure | — | — | — | — | ✅ Final |
| Retention policy | 👀 | — | — | ✅ Final | — |
| Monitoring alerts | 👀 | — | — | 👀 | ✅ Final |

Legend: ✅ Final = Final approval, 👀 = Consult

---

## Handoff Checklist (New Features)

### Phase 1: Design (Product + Backend)
- [ ] Product writes narrative (why this matters)
- [ ] Backend designs API contract (frozen)
- [ ] Security identifies audit requirements
- [ ] All agree on ownership boundaries

### Phase 2: Backend Implementation
- [ ] Backend implements API + RLS
- [ ] Backend adds audit triggers if applicable
- [ ] Security reviews for compliance gaps
- [ ] SRE tests in staging

### Phase 3: Frontend Implementation
- [ ] Frontend implements UI with trust signals
- [ ] Frontend handles loading/error states
- [ ] Frontend calls Backend API (no enforcement)
- [ ] Product validates messaging clarity

### Phase 4: Validation
- [ ] Backend validates in audit trail
- [ ] Frontend validates UI affordance
- [ ] Product validates narrative coherence
- [ ] Security validates compliance
- [ ] SRE validates in production

---

## Audit System Ownership

The audit system lives at the **Backend/Security boundary**:

### Backend Responsibilities
- ✅ Immutable table design (append-only)
- ✅ Constraint enforcement (triggers)
- ✅ Archive strategy (technical)
- ✅ Partitioning & scaling
- ✅ Performance monitoring
- ✅ RLS policies on audit tables

### Security Responsibilities
- ✅ Retention policy definition
- ✅ GDPR/CCPA compliance
- ✅ Deletion request approval
- ✅ Access review schedules
- ✅ Incident response with audit trail
- ✅ Compliance mapping (SOC2)

### SRE Responsibilities
- ✅ Cron job scheduling (archive, partitions)
- ✅ Monitoring & alerting
- ✅ Backup/restore procedures
- ✅ Environment separation (dev/staging/prod)
- ✅ Secrets for service accounts

### NOT Owned
- ❌ Product does NOT decide audit retention
- ❌ Frontend does NOT implement audit tables
- ❌ Product does NOT configure compliance mode

---

## Team Contacts

| Domain | Owner | Email | Slack |
|--------|-------|-------|-------|
| Platform / Backend | [Backend Lead] | backend@geoselect.io | #engineering-backend |
| Frontend / UI | [Frontend Lead] | frontend@geoselect.io | #engineering-frontend |
| Product / Design | [Product Lead] | product@geoselect.io | #product |
| SRE / Ops | [SRE Lead] | sre@geoselect.io | #ops |
| Security / Compliance | [Security Lead] | security@geoselect.io | #security |

---

## Revision History

| Date | Change | Owner |
|------|--------|-------|
| 2026-01-07 | Initial ownership framework | Security |
| — | — | — |

---

## FAQ

**Q: Who decides if a feature is behind a paywall?**  
A: Product (with Backend enforcing via entitlements)

**Q: Who decides if audit events are deleted?**  
A: Security (with Backend implementing)

**Q: Who decides the audit table schema?**  
A: Backend (with Security validating compliance)

**Q: Who decides the UI copy for blocked features?**  
A: Product (with Backend providing the reason string)

**Q: Who decides monitoring thresholds?**  
A: SRE (with input from Backend on expected volume)

**Q: Who decides if data is backed up?**  
A: SRE (with input from Security on retention needs)

---

**Status**: Active  
**Last Updated**: 2026-01-07  
**Review Cycle**: Quarterly
