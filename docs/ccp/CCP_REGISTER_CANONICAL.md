# Canonical CCP Milestone Register

Capability Check Points (CCPs) describe sellable capabilities. Each CCP is a milestone that should be accepted via:
(a) frozen API contract(s), (b) tests, (c) auditable failure modes, and (d) clear non-goals.

---

## Authoritative CCP List

- **CCP-00_ACCOUNT_CONTEXT_RESOLVE** — establish trusted account context (user/account/role/entitlements). Blocking for all privileged CCPs.
- **CCP-01_LOCATION_RESOLVE** — resolve user input (point/address) to normalized location context suitable for parcel resolution.
- **CCP-02_PARCEL_RESOLVE** — resolve a location/geometry to the authoritative parcel identity and derived jurisdictional contexts.
- **CCP-03_REPORT_CREATE** — deterministically project parcel context into a canonical report object; emit audit on success only; no persistence.
- **CCP-04_REPORT_SNAPSHOT** — persist a report snapshot (immutability, versioning, retrieval) with audit/provenance hooks.
- **CCP-05_WORKSPACE_CREATE** — create workspace/project container for collaboration, routing, and scoped permissions.
- **CCP-06_BRANDED_REPORT** — apply branding/template rules to a report artifact (not just rendering).
- **CCP-07_DATA_PROVENANCE_ACCESS** — expose data sources/lineage/"why we think this" for report facts.
- **CCP-08_PARCEL_SAVE** — save parcel to user/workspace with metadata, tags, and retrieval semantics.
- **CCP-09_CONTACTS_ACCESS** — contacts entity access + permissioned association to reports/workspaces.
- **CCP-10_NOTE_ANNOTATE** — create structured notes/annotations tied to report/parcel/entities, with audit.
- **CCP-11_EVENT_CREATE** — create governance events (ARC request, violation, decision) as first-class objects.
- **CCP-12_EVENT_ASSOCIATION** — associate events to parcels, reports, people, documents; maintain referential integrity.
- **CCP-13_EVENT_VISUALIZATION** — visualize event timelines/status/state transitions (UI + API support).
- **CCP-14_WHITE_LABEL** — tenant-level theming, domains, templates, and branded experience boundaries.
- **CCP-15_EVENT_PROVENANCE** — provenance for events: source docs, who/when, change log, defensibility.
- **CCP-16_REPORT_RENDER_ADVANCED** — advanced rendering pipeline (PDF/HTML packages, annexes, exhibits, maps).

---

## Usage Rules (Apply Consistently)

### A. Labels (one-time)
Create these labels (names): `ccp-00`, `ccp-01`, ..., `ccp-16`  
Additional labels: `capability`, `contract-frozen`, `tests-required`, `audit-events`

### B. Milestones
Create a GitHub milestone for every CCP with:
- **Title**: `CCP-03_REPORT_CREATE`
- **Description**: one-line definition (from the register above)
- **Completion criteria** (put in milestone body): `frozen contract + tests + failure modes + audit semantics`

### C. PR / Issue Title Prefix
Use square-bracket CCP prefix in titles, e.g.:
```
[CCP-03] Freeze report create contract + tests
[CCP-02] Parcel resolve endpoint + Phase 2b join spine
```

### D. Commit Footer (high-signal)
Add a footer line to commits/PR descriptions containing CCP metadata. Example:
```
CCP: CCP-03_REPORT_CREATE
CTRL: CTRL-A04_PARCEL_CONTEXT_LOAD     # optional control points
Contract: frozen
Audit: success-only
```

Example commit message:
```
feat(api): implement report create projection + audit

CCP: CCP-03_REPORT_CREATE
Contract: frozen
Audit: success-only
```

---

## Copilot Context Block (Paste Verbatim)

```
CCP Operating Model (Context Block)

Capability Check Points (CCPs) are the product milestone system for GeoSelect.it. 
A CCP represents a sellable capability. Each CCP is "done" only when:
- API contract is frozen (request/response JSON)
- Tests exist for success + contract failure modes
- Audit event semantics are correct
- PR is narrowly scoped to that CCP

CCPs must be referenced in PR titles and commit footers as CCP: <ID>.

Authoritative CCP list:
CCP-00_ACCOUNT_CONTEXT_RESOLVE
CCP-01_LOCATION_RESOLVE
CCP-02_PARCEL_RESOLVE
CCP-03_REPORT_CREATE
CCP-04_REPORT_SNAPSHOT
CCP-05_WORKSPACE_CREATE
CCP-06_BRANDED_REPORT
CCP-07_DATA_PROVENANCE_ACCESS
CCP-08_PARCEL_SAVE
CCP-09_CONTACTS_ACCESS
CCP-10_NOTE_ANNOTATE
CCP-11_EVENT_CREATE
CCP-12_EVENT_ASSOCIATION
CCP-13_EVENT_VISUALIZATION
CCP-14_WHITE_LABEL
CCP-15_EVENT_PROVENANCE
CCP-16_REPORT_RENDER_ADVANCED

Implementation rule: keep each CCP PR narrowly scoped to that CCP's contract + tests + minimal implementation.
```

---

*Last updated: Jan 3, 2026*
