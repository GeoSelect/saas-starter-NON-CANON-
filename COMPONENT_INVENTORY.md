# Component Inventory

**Last Updated:** January 6, 2026  
**Purpose:** Catalog all reusable and specialized components across the project, regardless of folder structure

---

## 🚨 GOVERNANCE RULE

**No new component may be implemented without being added to this registry with an ID, CCP association, and status.**

This document serves as a contract for all development.

---

## Classification Levels

- **UI Components**: Reusable presentational components (buttons, cards, forms)
- **Feature Components**: Business logic components handling specific features
- **Page Components**: Full-page components mapped to routes
- **API Components**: Server-side API endpoint handlers
- **Utility Functions**: Database helpers, data manipulation, business logic

---

## Component ID Format

**Pattern**: `C-NNN-CCPXX` where:
- `C` = Component prefix
- `NNN` = Sequential number (001–999)
- `CCPXX` = Primary CCP reference (CCP00, CCP01, etc.)
- Components spanning multiple CCPs list primary first

Example: `C-042-CCP05` = Component 42, primarily in CCP-05 (Monetization)

---

## 🎨 UI Components

### C-055-CCP05 | SubmitButton
| Property | Value |
|----------|-------|
| **Path** | [`app/(dashboard)/pricing/submit-button.tsx`](app/(dashboard)/pricing/submit-button.tsx) |
| **Type** | Client Component (`'use client'`) |
| **Purpose** | Form submit button with loading state for async actions |
| **Props** | `disabled?: boolean` (from form context via `useFormStatus()`) |
| **Dependencies** | `@/components/ui/button`, `lucide-react`, `react-dom` |
| **Status** | ✅ Have Already |
| **Reuse Locations** | Pricing checkout, registration, login, settings, contact forms |
| **CCPs** | CCP-05 (Billing), CCP-14 (Premium) |

---

## 📄 Page Components

### C-056-CCP05 | PricingPage
| Property | Value |
|----------|-------|
| **Path** | [`app/(dashboard)/pricing/page.tsx`](app/(dashboard)/pricing/page.tsx) |
| **Type** | Server Component (async) |
| **Purpose** | Display pricing tiers with Stripe integration |
| **Data Fetching** | Stripe products & prices via `getStripeProducts()`, `getStripePrices()` |
| **Child Components** | `C-057` (PricingCard), `C-055` (SubmitButton) |
| **Status** | ✅ Have Already |
| **Route** | `/dashboard/pricing` |
| **CCPs** | CCP-05 (Billing), CCP-14 (Premium) |

### C-057-CCP05 | PricingCard (Internal)
| Property | Value |
|----------|-------|
| **Path** | [`app/(dashboard)/pricing/page.tsx#L47`](app/(dashboard)/pricing/page.tsx#L47) |
| **Type** | Presentational component (defined within PricingPage) |
| **Purpose** | Display individual pricing plan with features checklist |
| **Props** | `name`, `price`, `interval`, `trialDays`, `features`, `priceId` |
| **Child Components** | `Check` icon (lucide), `C-055` (SubmitButton) |
| **Status** | ✅ Have Already |
| **Extraction Candidate** | Move to `components/pricing/pricing-card.tsx` if reused |
| **CCPs** | CCP-05 (Billing), CCP-14 (Premium) |

---

## 📄 Page Components (Phase 1: CCP-06 Branded Reports)

### C-096-CCP06 | BrandedReportsListPage
| Property | Value |
|----------|-------|
| **Path** | [`app/(dashboard)/branded-reports/page.tsx`](app/(dashboard)/branded-reports/page.tsx) |
| **Type** | Server Component (async) |
| **Purpose** | List all branded reports in workspace with C046 paywall gate |
| **Route** | `/dashboard/branded-reports` |
| **Feature Gate** | `ccp-06:branded-reports` (C046 UnlockDetails) |
| **Child Components** | C046 UnlockDetails, C-098 BrandedReportList |
| **Status** | ✅ Have Already (Phase 1) |
| **CCPs** | CCP-06 (Branded Reports), CCP-14 (Premium) |

### C-097-CCP06 | BrandedReportDetailPage
| Property | Value |
|----------|-------|
| **Path** | [`app/(dashboard)/branded-reports/[id]/page.tsx`](app/(dashboard)/branded-reports/[id]/page.tsx) |
| **Type** | Server Component (async) with dynamic route |
| **Purpose** | Edit a specific branded report with C046 paywall gate |
| **Route** | `/dashboard/branded-reports/[id]` |
| **Feature Gate** | `ccp-06:branded-reports` (C046 UnlockDetails) |
| **Child Components** | C046 UnlockDetails, C-099 BrandedReportEditor |
| **Props** | `reportId` (UUID from dynamic route) |
| **Validation** | UUID format validation + 404 on not found |
| **Status** | ✅ Have Already (Phase 1) |
| **CCPs** | CCP-06 (Branded Reports), CCP-14 (Premium) |

### C-098-CCP06 | BrandedReportCreationPage
| Property | Value |
|----------|-------|
| **Path** | [`app/(dashboard)/branded-reports/new/page.tsx`](app/(dashboard)/branded-reports/new/page.tsx) |
| **Type** | Server Component (async) |
| **Purpose** | Create new branded report with C046 paywall gate |
| **Route** | `/dashboard/branded-reports/new` |
| **Feature Gate** | `ccp-06:branded-reports` (C046 UnlockDetails) |
| **Child Components** | C046 UnlockDetails, C-101 BrandedReportCreator |
| **Status** | ✅ Have Already (Phase 1) |
| **CCPs** | CCP-06 (Branded Reports), CCP-14 (Premium) |

---

## 🎨 UI Components (Phase 1: CCP-06 Branded Reports)

### C-099-CCP06 | BrandedReportList
| Property | Value |
|----------|-------|
| **Path** | [`lib/components/BrandedReportList.tsx`](lib/components/BrandedReportList.tsx) |
| **Type** | Client Component (`'use client'`) |
| **Purpose** | Fetch and display grid of branded reports with edit/delete actions |
| **Props** | None (uses AppShell context) |
| **State** | `reports[]`, `loading`, `error` |
| **Data Fetching** | SWR via `useAppShell()` + `GET /api/workspaces/[id]/branded-reports` |
| **Child Components** | C-100 ReportCard, `lucide-react` icons (Plus, FileText, Edit, Trash2) |
| **Actions** | Create new, edit, delete |
| **Status** | ✅ Have Already (Phase 1) |
| **Dependencies** | AppShell, useBlockedAudit hook |
| **CCPs** | CCP-06 (Branded Reports), CCP-14 (Premium) |

### C-100-CCP06 | ReportCard
| Property | Value |
|----------|-------|
| **Path** | [`lib/components/BrandedReportList.tsx#L73`](lib/components/BrandedReportList.tsx#L73) |
| **Type** | Presentational component (defined within BrandedReportList) |
| **Purpose** | Display individual report card with edit/delete actions |
| **Props** | `report: BrandedReport` |
| **Actions** | Edit (navigate to detail), Delete (with confirmation) |
| **Status** | ✅ Have Already (Phase 1) |
| **CCPs** | CCP-06 (Branded Reports) |

### C-101-CCP06 | BrandedReportEditor
| Property | Value |
|----------|-------|
| **Path** | [`lib/components/BrandedReportEditor.tsx`](lib/components/BrandedReportEditor.tsx) |
| **Type** | Client Component (`'use client'`) |
| **Purpose** | Edit branded report name, description, and branding settings |
| **Props** | `reportId: string` |
| **State** | `report`, `formData`, `loading`, `saving`, `error` |
| **Data Fetching** | `GET /api/workspaces/[id]/branded-reports/[reportId]` on mount |
| **Mutations** | `PUT /api/workspaces/[id]/branded-reports/[reportId]` on save |
| **Form Fields** | name, description, (placeholder: branding, preview) |
| **Actions** | Save, Cancel |
| **Validation** | Report exists + user has access (RLS) |
| **Status** | ✅ Have Already (Phase 1) |
| **CCPs** | CCP-06 (Branded Reports), CCP-14 (Premium) |

### C-102-CCP06 | BrandedReportCreator
| Property | Value |
|----------|-------|
| **Path** | [`lib/components/BrandedReportCreator.tsx`](lib/components/BrandedReportCreator.tsx) |
| **Type** | Client Component (`'use client'`) |
| **Purpose** | Create new branded report with form validation and redirect on success |
| **Props** | None (uses AppShell context) |
| **State** | `formData`, `loading`, `error` |
| **Mutations** | `POST /api/workspaces/[id]/branded-reports` |
| **Form Fields** | name (required), description (optional) |
| **Validation** | Name required, form validation |
| **Actions** | Create (submits), Cancel (redirect to list) |
| **On Success** | Redirect to `/dashboard/branded-reports/[id]` for editing |
| **Status** | ✅ Have Already (Phase 1) |
| **CCPs** | CCP-06 (Branded Reports), CCP-14 (Premium) |

---

## 🔧 Utility & Service Components

### C-080-CCP06 | Branded Reports Helpers
| Property | Value |
|----------|-------|
| **Path** | [`lib/db/helpers/branded-reports.ts`](lib/db/helpers/branded-reports.ts) |
| **Type** | TypeScript utility module |
| **Purpose** | CCP-06 branded reports database operations (FROZEN API v1.0) |
| **Exports** | 6 async functions |
| **Access Control** | Workspace isolation via RLS, schema validation via Zod |
| **Status** | ✅ Have Already |
| **CCPs** | CCP-06 (Branded Reports) |

#### Exported Functions:
| ID | Function | Purpose | Access Control |
|----|----------|---------|-----------------|
| C-081 | `createBrandedReport(input)` | Create new report in workspace | Workspace admin/owner required |
| C-082 | `getBrandedReport(id, workspace_id)` | Fetch single report | Workspace membership required |
| C-083 | `listBrandedReports(options)` | List workspace reports with pagination | Workspace membership required |
| C-084 | `updateBrandedReport(input)` | Update report name/status/branding | Workspace admin/owner required |
| C-085 | `deleteBrandedReport(id, workspace_id)` | Delete report and cleanup | Workspace admin/owner required |
| C-086 | `getAllReportsForWorkspace(workspace_id)` | Get all reports for workspace | Workspace membership required |

---

## 🔌 API Route Components

### C-090-CCP06 | Branded Reports API Routes
| Property | Value |
|----------|-------|
| **Type** | API Route Handlers |
| **Purpose** | RESTful CRUD operations for branded reports |
| **Base Path** | `/api/workspaces/[workspace_id]/branded-reports` |
| **Status** | ✅ Have Already |
| **CCPs** | CCP-06 (Branded Reports) |

#### C-091-CCP06 | POST /api/workspaces/[workspace_id]/branded-reports
| Property | Value |
|----------|-------|
| **Path** | [`app/api/workspaces/[workspace_id]/branded-reports/route.ts`](app/api/workspaces/[workspace_id]/branded-reports/route.ts) |
| **Purpose** | Create new branded report |
| **Request** | POST with JSON body containing report data |
| **Response** | `CREATE_REPORT_RESPONSE` (200) or error (400/401/403/500) |
| **Auth** | User must be workspace member |
| **Uses** | `C-081` createBrandedReport() helper |

#### C-092-CCP06 | GET /api/workspaces/[workspace_id]/branded-reports
| Property | Value |
|----------|-------|
| **Path** | [`app/api/workspaces/[workspace_id]/branded-reports/route.ts`](app/api/workspaces/[workspace_id]/branded-reports/route.ts) |
| **Purpose** | List all branded reports in workspace |
| **Request** | GET with optional query: `status`, `limit`, `offset` |
| **Response** | `LIST_REPORTS_RESPONSE` (200) or error |
| **Auth** | User must be workspace member |
| **Uses** | `C-083` listBrandedReports() helper |

#### C-093-CCP06 | GET /api/workspaces/[workspace_id]/branded-reports/[report_id]
| Property | Value |
|----------|-------|
| **Path** | [`app/api/workspaces/[workspace_id]/branded-reports/[report_id]/route.ts`](app/api/workspaces/[workspace_id]/branded-reports/[report_id]/route.ts) |
| **Purpose** | Fetch single report by ID |
| **Request** | GET with UUID validation |
| **Response** | `GET_REPORT_RESPONSE` (200) or error |
| **Auth** | User must be workspace member |
| **Uses** | `C-082` getBrandedReport() helper |

#### C-094-CCP06 | PUT /api/workspaces/[workspace_id]/branded-reports/[report_id]
| Property | Value |
|----------|-------|
| **Path** | [`app/api/workspaces/[workspace_id]/branded-reports/[report_id]/route.ts`](app/api/workspaces/[workspace_id]/branded-reports/[report_id]/route.ts) |
| **Purpose** | Update report name, status, or branding |
| **Request** | PUT with JSON body |
| **Response** | Updated report or error |
| **Auth** | User must be workspace admin/owner |
| **Uses** | `C-084` updateBrandedReport() helper |

#### C-095-CCP06 | DELETE /api/workspaces/[workspace_id]/branded-reports/[report_id]
| Property | Value |
|----------|-------|
| **Path** | [`app/api/workspaces/[workspace_id]/branded-reports/[report_id]/route.ts`](app/api/workspaces/[workspace_id]/branded-reports/[report_id]/route.ts) |
| **Purpose** | Delete report and related data |
| **Request** | DELETE with report ID |
| **Response** | Success message or error |
| **Auth** | User must be workspace admin/owner |
| **Uses** | `C-085` deleteBrandedReport() helper |

---

## 📋 Master Component Registry (v1.0)

| ID | Component | CCP | Status | Category | Description |
|----|-----------|----|--------|----------|-------------|
| C001 | AppShell | CCP-00 | 🚨 Must Have | Platform Foundation | Workspace orchestration |
| C002 | BackButton | CCP-00 | ✅ Have Already | UX Utility | Navigation |
| C003 | BottomNav | CCP-00 | ✅ Have Already | UI Foundation | Mobile-first primary navigation |
| C004 | BottomNavHelp | CCP-00 | 🎯 Want | UX Polish | Support access |
| C005 | BottomNavHome | CCP-00 | ✅ Have Already | UI Foundation | Home access |
| C006 | Continue | CCP-00 | ✅ Have Already | Entry Flow | Progress continuation |
| C007 | ContinueNoAccount | CCP-00 | ✅ Have Already | Entry Flow | Anonymous exploration without signup |
| C008 | EnterEmail | CCP-00 | ✅ Have Already | Auth | Identity capture |
| C009 | FAQs | CCP-00 | 🎯 Want | Support | Self-serve help |
| C010 | ForgotPwd | CCP-00 | ✅ Have Already | Auth | Account recovery |
| C011 | NeedHelp | CCP-00 | 🎯 Want | Support | User assistance |
| C012 | RetryButton | CCP-00 | ✅ Have Already | UX Utility | Error recovery |
| C013 | SignIn | CCP-00 | ✅ Have Already | Auth | Secure user authentication |
| C014 | TopNav | CCP-00 | ✅ Have Already | UI Foundation | Global navigation across product surfaces |
| C015 | ViewSample | CCP-00 | 🎯 Want | Marketing / GTM | Product preview |
| C016 | WelcomeBack | CCP-00 | ✅ Have Already | Entry Flow | Seamless session resumption |
| C017 | WhatIsThis | CCP-00 | 🎯 Want | Education | Explain product concepts |
| C018 | xOut | CCP-00 | ✅ Have Already | UX Utility | Dismiss flows |
| C019 | MapContainer | CCP-01 | ✅ Have Already | Parcel Flow | Spatial parcel visualization |
| C020 | SearchForParcel | CCP-01 | ✅ Have Already | Parcel Flow | Parcel discovery by address/APN |
| C021 | UseMyLocation | CCP-01 | ✅ Have Already | Parcel Flow | Location-based parcel lookup |
| C022 | BottomNavListView | CCP-01, CCP-02 | ✅ Have Already | Parcel Flow | List-based parcel browsing |
| C023 | BottomNavMap | CCP-01, CCP-02 | ✅ Have Already | Parcel Flow | Map-first parcel exploration |
| C024 | BottomNavDetails | CCP-02 | ✅ Have Already | UI Foundation | Detail navigation |
| C025 | ConfirmParcel | CCP-02 | ✅ Have Already | Parcel Flow | Deterministic parcel selection |
| C026 | GoogleStreetViewAPI | CCP-02 | ✅ Have Already | Parcel Context | Ground-truth, real-world parcel context |
| C027 | ParcelCard | CCP-02 | ✅ Have Already | Parcel Flow | At-a-glance parcel summary |
| C028 | GenerateReport | CCP-03 | ✅ Have Already | Report Flow | Report creation |
| C029 | GenerateReport | CCP-03 | ✅ Have Already | Report Flow | Automated report creation |
| C030 | StartReport | CCP-03 | ✅ Have Already | Report Flow | Initiation of report generation |
| C031 | ParcelReport | CCP-04 | ✅ Have Already | Reporting | Immutable, shareable report artifact |
| C032 | ReportDetailsCarrot | CCP-04 | 🎯 Want | Reporting | Disclosure |
| C033 | ReportDetailsDropdown | CCP-04 | 🎯 Want | Reporting | Detail expansion |
| C034 | ReportPopout | CCP-04 | 🎯 Want | UX Polish | Focused report review experience |
| C035 | SaveOpenReport | CCP-04 | ✅ Have Already | Reporting | Report persistence |
| C036 | BasicButton | CCP-05 | ✅ Have Already | Pricing | Tier selection |
| C037 | ChooseYourPlan | CCP-05 | ✅ Have Already | Pricing | Plan selection and monetization entry |
| C038 | ContinuePayment | CCP-05 | ✅ Have Already | Billing | Checkout flow |
| C039 | EnterCardDetails | CCP-05 | ✅ Have Already | Billing | Payment capture |
| C040 | MemberSince | CCP-05 | 🎯 Want | Account Mgmt | Account context |
| C041 | NameAddressZipState | CCP-05 | ✅ Have Already | Billing | Billing identity |
| C042 | ProButton | CCP-05 | ✅ Have Already | Pricing | Tier selection |
| C043 | ProfileOrgInfo | CCP-05 | 🎯 Want | Account Mgmt | Org-level metadata |
| C044 | ProPlusButton | CCP-05 | 🎯 Want | Pricing | Tier expansion |
| C045 | BlockedExplain | CCP-06 | 🚨 Must Have | Trust / UX | Explain access limits |
| C046 | UnlockDetails | CCP-06, CCP-14 | 🚨 Must Have | Monetization | Paywall enforcement |
| C047 | DataSourceError | CCP-07 | ✅ Have Already | Provenance | Data integrity signaling |
| C048 | DataSourcesLink | CCP-07 | ✅ Have Already | Provenance | Source transparency |
| C049 | DocumentDetailsCarrot | CCP-07 | 🎯 Want | Workspace UI | Disclosure |
| C050 | DocumentDetailsDropdown | CCP-07 | 🎯 Want | Workspace UI | Detail expansion |
| C051 | DocumentsTitleBlock | CCP-07 | 🎯 Want | Workspace UI | Document organization |
| C052 | MoreTrust | CCP-07 | ❓ Haven't Considered Yet | Trust | Reinforce credibility |
| C053 | TrustSignal | CCP-07 | ❓ Haven't Considered Yet | Trust | Data confidence signaling |
| C054 | AuditRecentActivity | CCP-07, CCP-15 | 🚨 Must Have | Compliance | Auditability |
| C055 | BookmarksCarrot | CCP-08 | 🎯 Want | UX | Saved items affordance |
| C056 | BookmarksDropdown | CCP-08 | 🎯 Want | UX | Saved item access |
| C057 | BookparkParcel | CCP-08 | 🎯 Want | Parcel Mgmt | Save/bookmark parcels |
| C058 | ParcelsDetailsCarrot | CCP-08 | ✅ Have Already | Workspace UI | Disclosure control |
| C059 | ParcelsDetailsDropdown | CCP-08 | ✅ Have Already | Workspace UI | Detail expansion |
| C060 | ParcelsTitleBlock | CCP-08 | ✅ Have Already | Workspace UI | Section framing |
| C061 | ContactsUploaded | CCP-09 | 🎯 Want | CRM | Contact ingestion |
| C062 | MyContactsLink | CCP-09, CCP-12 | 🎯 Want | Sharing | Contact-based sharing |
| C063 | NotesSection | CCP-10 | 🎯 Want | Collaboration | Annotations |
| C064 | EventsDetailsCarrot | CCP-11 | 🎯 Want | Events | Disclosure |
| C065 | EventsDetailsDropdown | CCP-11 | 🎯 Want | Events | Detail expansion |
| C066 | EventsTitleBlock | CCP-11 | 🎯 Want | Events | Event grouping |
| C067 | RecentLinks | CCP-12 | 🎯 Want | Sharing | Share audit |
| C068 | SendArrow | CCP-12 | ✅ Have Already | Sharing UX | Action affordance |
| C069 | ShareMyReport | CCP-12 | ✅ Have Already | Sharing | External distribution |
| C070 | SubjectLine | CCP-12 | 🎯 Want | Sharing UX | Contextual sharing |
| C071 | UnlockPremium | CCP-14 | 🚨 Must Have | Monetization | Upgrade trigger |
| C072 | ExportWorkspace | CCP-15 | 🚨 Must Have | Enterprise | Data portability |
| C096 | BrandedReportsListPage | CCP-06 | ✅ Have Already | Page Component | Phase 1 list page with C046 gate |
| C097 | BrandedReportDetailPage | CCP-06 | ✅ Have Already | Page Component | Phase 1 detail page with C046 gate |
| C098 | BrandedReportCreationPage | CCP-06 | ✅ Have Already | Page Component | Phase 1 creation page with C046 gate |
| C099 | BrandedReportList | CCP-06 | ✅ Have Already | UI Component | Client list with fetch & CRUD |
| C100 | ReportCard | CCP-06 | ✅ Have Already | UI Component | Individual report card |
| C101 | BrandedReportEditor | CCP-06 | ✅ Have Already | UI Component | Report editor form |
| C102 | BrandedReportCreator | CCP-06 | ✅ Have Already | UI Component | Report creation form |
| C103 | CSVContactUpload | CCP-09 | ✅ Have Already | UI Component | CSV file upload with validation |
| C104 | useContactAudit | CCP-09, CCP-07 | ✅ Have Already | Hook | Audit logging hook for uploads |
| C105 | POST /contacts/import | CCP-09 | ✅ Have Already | API Route | Server-authoritative CSV import endpoint |
| C106 | POST /audit/contact-upload | CCP-09, CCP-07 | ✅ Have Already | API Route | Append-only audit trail endpoint |
| C107 | parseAndValidateCSV | CCP-09 | ✅ Have Already | Utility | Deterministic CSV validation parser |

---

## 📈 Component Status Summary

| Status | Count | Details |
|--------|-------|---------|
| ✅ Have Already | 51 | Implemented & in production (Phase 1 added 12 components: 7 branded-reports, 5 CSV upload) |
| 🎯 Want | 26 | High priority, planned phases |
| 🚨 Must Have | 6 | Critical, blocking other work |
| ❓ Haven't Considered Yet | 2 | Future evaluation |
| **Total** | **85** | Complete capabilities inventory
| C-002 | BottomNav | UI Foundation | ✅ Have Already | Mobile-first navigation |
| C-003 | BottomNavHome | UI Foundation | ✅ Have Already | Home access |
| C-004 | WelcomeBack | Entry Flow | ✅ Have Already | Session resume |
| C-005 | Continue | Entry Flow | ✅ Have Already | Progress continuation |
| C-006 | ContinueNoAccount | Entry Flow | ✅ Have Already | Anonymous exploration |
| C-007 | SignIn | Auth | ✅ Have Already | User authentication |
| C-008 | CreateAccount | Auth | ✅ Have Already | Account creation |
| C-009 | ForgotPwd | Auth | ✅ Have Already | Account recovery |
| C-010 | EnterEmail | Auth | ✅ Have Already | Identity capture |
| C-011 | RetryButton | UX Utility | ✅ Have Already | Error recovery |
| C-012 | BackButton | UX Utility | ✅ Have Already | Navigation |
| C-013 | xOut | UX Utility | ✅ Have Already | Dismiss flows |
| C-014 | BottomNavHelp | UX Polish | 🎯 Want | Support access |
| C-015 | ViewSample | Marketing / GTM | 🎯 Want | Product preview |
| C-016 | NeedHelp | Support | 🎯 Want | User assistance |
| C-017 | WhatIsThis | Education | 🎯 Want | Explain concepts |
| C-018 | FAQs | Support | 🎯 Want | Self-serve help |
| C-019 | AppShell | Platform Foundation | 🚨 Must Have | Stable app context, auth + workspace orchestration |

### CCP-01: Parcel Discovery
| ID | Component | Category | Status | Notes |
|----|-----------|---------|---------|----|
| C-020 | SearchForParcel | Parcel Flow | ✅ Have Already | Parcel discovery |
| C-021 | MapContainer | Parcel Flow | ✅ Have Already | Spatial visualization |
| C-022 | UseMyLocation | Parcel Flow | ✅ Have Already | GNSS-based lookup |
| C-023 | BottomNavMap | Parcel Flow | ✅ Have Already | Map-first parcel exploration |

### CCP-02: Parcel Context
| ID | Component | Category | Status | Notes |
|----|-----------|---------|---------|----|
| C-024 | BottomNavListView | Parcel Flow | ✅ Have Already | List-based parcel browsing |
| C-025 | BottomNavDetails | UI Foundation | ✅ Have Already | Detail navigation |
| C-026 | ConfirmParcel | Parcel Flow | ✅ Have Already | Parcel resolution |
| C-027 | ParcelCard | Parcel Flow | ✅ Have Already | Parcel summary |
| C-028 | GoogleStreetViewAPI | Parcel Context | ✅ Have Already | Ground-truth visualization |

### CCP-03: Report Generation
| ID | Component | Category | Status | Notes |
|----|-----------|---------|---------|----|
| C-029 | StartReport | Report Flow | ✅ Have Already | Report initiation |
| C-030 | GenerateReport | Report Flow | ✅ Have Already | Report creation |

### CCP-04: Report Viewing & Persistence
| ID | Component | Category | Status | Notes |
|----|-----------|---------|---------|----|
| C-031 | ParcelReport | Reporting | ✅ Have Already | Immutable report artifact |
| C-032 | SaveOpenReport | Reporting | ✅ Have Already | Persistence |
| C-033 | ReportPopout | UX Polish | 🎯 Want | Focused report viewing |
| C-034 | ReportDetailsCarrot | Reporting | 🎯 Want | Disclosure |
| C-035 | ReportDetailsDropdown | Reporting | 🎯 Want | Detail expansion |

### CCP-05: Monetization & Billing
| ID | Component | Category | Status | Notes |
|----|-----------|---------|---------|----|
| C-036 | BasicButton | Pricing | ✅ Have Already | Tier selection |
| C-037 | ProButton | Pricing | ✅ Have Already | Tier selection |
| C-038 | ContinuePayment | Billing | ✅ Have Already | Checkout flow |
| C-039 | EnterCardDetails | Billing | ✅ Have Already | Payment capture |
| C-040 | NameAddressZipState | Billing | ✅ Have Already | Billing identity |
| C-041 | ProfileOrgInfo | Account Mgmt | 🎯 Want | Org-level metadata |
| C-042 | MemberSince | Account Mgmt | 🎯 Want | Account context |
| C-043 | ProPlusButton | Pricing | 🎯 Want | Tier expansion |
| C-044 | ChooseYourPlan | Pricing | ✅ Have Already | Plan selection |
| C-055 | SubmitButton | Billing | ✅ Have Already | Form submission with loading |
| C-056 | PricingPage | Billing | ✅ Have Already | Pricing page with Stripe |
| C-057 | PricingCard | Pricing | ✅ Have Already | Individual plan card |

### CCP-06: Branded Reports
| ID | Component | Category | Status | Notes |
|----|-----------|---------|---------|----|
| C-045 | BlockedExplain | Trust / UX | 🚨 Must Have | Explain access limits |
| C-046 | UnlockDetails | Monetization | 🚨 Must Have | Paywall enforcement |
| C-080 | Branded Reports Helpers | Utilities | ✅ Have Already | Database operations (FROZEN v1.0) |
| C-081 | createBrandedReport() | DB Function | ✅ Have Already | Create report |
| C-082 | getBrandedReport() | DB Function | ✅ Have Already | Fetch single report |
| C-083 | listBrandedReports() | DB Function | ✅ Have Already | List with pagination |
| C-084 | updateBrandedReport() | DB Function | ✅ Have Already | Update report |
| C-085 | deleteBrandedReport() | DB Function | ✅ Have Already | Delete report |
| C-086 | getAllReportsForWorkspace() | DB Function | ✅ Have Already | Get all workspace reports |
| C-091 | POST /branded-reports | API Route | ✅ Have Already | Create via API |
| C-092 | GET /branded-reports | API Route | ✅ Have Already | List via API |
| C-093 | GET /branded-reports/[id] | API Route | ✅ Have Already | Fetch single via API |
| C-094 | PUT /branded-reports/[id] | API Route | ✅ Have Already | Update via API |
| C-095 | DELETE /branded-reports/[id] | API Route | ✅ Have Already | Delete via API |

### CCP-07: Data Sources & Compliance
| ID | Component | Category | Status | Notes |
|----|-----------|---------|---------|----|
| C-047 | DataSourcesLink | Provenance | ✅ Have Already | Source transparency |
| C-048 | DataSourceError | Provenance | ✅ Have Already | Data integrity signaling |
| C-049 | TrustSignal | Trust | ❓ Haven't Considered Yet | Data confidence signaling |
| C-050 | MoreTrust | Trust | ❓ Haven't Considered Yet | Reinforce credibility |
| C-051 | DocumentsTitleBlock | Workspace UI | 🎯 Want | Document organization |
| C-052 | DocumentDetailsCarrot | Workspace UI | 🎯 Want | Disclosure |
| C-053 | DocumentDetailsDropdown | Workspace UI | 🎯 Want | Detail expansion |
| C-054 | AuditRecentActivity | Compliance | 🚨 Must Have | Auditability |

### CCP-08: Workspace Management
| ID | Component | Category | Status | Notes |
|----|-----------|---------|---------|----|
| C-058 | ParcelsTitleBlock | Workspace UI | ✅ Have Already | Section framing |
| C-059 | ParcelsDetailsCarrot | Workspace UI | ✅ Have Already | Disclosure control |
| C-060 | ParcelsDetailsDropdown | Workspace UI | ✅ Have Already | Detail expansion |
| C-061 | BookparkParcel | Parcel Mgmt | 🎯 Want | Save/bookmark parcels |
| C-062 | BookmarksCarrot | UX | 🎯 Want | Saved items affordance |
| C-063 | BookmarksDropdown | UX | 🎯 Want | Saved item access |

### CCP-09: CRM Integration
| ID | Component | Category | Status | Notes |
|----|-----------|---------|---------|----|
| C-064 | ContactsUploaded | CRM | 🎯 Want | Contact ingestion |
| C-065 | MyContactsLink | Sharing | 🎯 Want | Contact-based sharing |

### CCP-10: Collaboration
| ID | Component | Category | Status | Notes |
|----|-----------|---------|---------|----|
| C-066 | NotesSection | Collaboration | 🎯 Want | Annotations |

### CCP-11: Events
| ID | Component | Category | Status | Notes |
|----|-----------|---------|---------|----|
| C-067 | EventsTitleBlock | Events | 🎯 Want | Event grouping |
| C-068 | EventsDetailsCarrot | Events | 🎯 Want | Disclosure |
| C-069 | EventsDetailsDropdown | Events | 🎯 Want | Detail expansion |

### CCP-12: Sharing
| ID | Component | Category | Status | Notes |
|----|-----------|---------|---------|----|
| C-070 | ShareMyReport | Sharing | ✅ Have Already | External distribution |
| C-071 | SendArrow | Sharing UX | ✅ Have Already | Action affordance |
| C-072 | SubjectLine | Sharing UX | 🎯 Want | Contextual sharing |
| C-073 | RecentLinks | Sharing | 🎯 Want | Share audit |

### CCP-14: Premium Features
| ID | Component | Category | Status | Notes |
|----|-----------|---------|---------|----|
| C-074 | UnlockPremium | Monetization | 🚨 Must Have | Upgrade trigger |

### CCP-15: Enterprise
| ID | Component | Category | Status | Notes |
|----|-----------|---------|---------|----|
| C-075 | ExportWorkspace | Enterprise | 🚨 Must Have | Data portability |

---

## 📈 Component Status Summary

| Status | Count | Details |
|--------|-------|---------|
| ✅ Have Already | 40 | Implemented & in production |
| 🎯 Want | 28 | High priority, planned phases |
| 🚨 Must Have | 8 | Critical, blocking other work |
| ❓ Haven't Considered Yet | 2 | Future evaluation |
| **Total** | **78** | Full capabilities inventory |

```
PricingPage (Page)
├── getStripeProducts()
├── getStripePrices()
└── PricingCard (Internal Component)
    ├── SubmitButton
    │   ├── @/components/ui/button
    │   ├── lucide-react (ArrowRight, Loader2)
    │   └── react-dom (useFormStatus)
    └── lucide-react (Check)

API: Branded Reports Routes
├── createBrandedReport()
├── listBrandedReports()
├── getBrandedReport()
├── updateBrandedReport()
└── deleteBrandedReport()
    └── All use Supabase Server Client + RLS
```

---

## 🗂️ Folder Structure vs Component Organization

### Current Folder Structure
```
app/
├── (dashboard)/
│   └── pricing/
│       ├── page.tsx (PricingPage)
│       └── submit-button.tsx (SubmitButton)
└── api/
    └── workspaces/[workspace_id]/
        └── branded-reports/
            ├── route.ts (POST/GET)
            └── [report_id]/route.ts (GET/PUT/DELETE)

lib/
└── db/
    └── helpers/
        └── branded-reports.ts (Database utilities)
```

### Logical Component Organization (by feature)
```
PRICING FEATURE:
├── UI: SubmitButton
├── Page: PricingPage
└── Internal: PricingCard

BRANDED REPORTS FEATURE:
├── API Routes: 5 endpoints
├── Helpers: 6 database functions
└── Contracts: Zod schemas, error codes
```

---

## 📊 Component Statistics

| Category | Count | Details |
|----------|-------|---------|
| UI Components | 1 | SubmitButton (reusable) |
| Page Components | 1 | PricingPage |
| Internal Components | 1 | PricingCard |
| API Routes | 5 | Branded reports endpoints |
| Utility Modules | 1 | Branded reports helpers (6 functions) |
| **Total Logical Components** | **9** | Across 5 physical files |

---

## 🎯 Reusability Matrix

| Component | Reusable? | Current Uses | Potential Uses |
|-----------|-----------|--------------|-----------------|
| SubmitButton | ✅ High | Pricing checkout form | Any form (auth, settings, contact) |
| PricingCard | ⚠️ Medium | Pricing page | Other pricing pages, comparisons |
| PricingPage | ❌ Low | Route-specific | N/A |
| Branded Reports Helpers | ✅ High | API routes | Frontend components, admin dashboards |
| Branded Reports Routes | ✅ Medium | Report CRUD ops | Client apps consuming the API |

---

## 📝 Component Maintenance Notes

### Frozen APIs
- **Branded Reports Helpers**: v1.0 (FROZEN)
  - Do not modify without version bump
  - Database schema locked (Zod schemas)
  - Access control enforced via RLS

### Candidates for Extraction
1. **PricingCard**: Move to `components/pricing/pricing-card.tsx` if used elsewhere
2. **API Response Types**: Extract to `lib/contracts/ccp06/` (already partially done)

### Gaps to Fill
- [ ] Create shared form components library
- [ ] Create dashboard card components
- [ ] Create data table components
- [ ] Create navigation/layout components
- [ ] Create authentication UI components

---

## 🔍 How to Use This Inventory

1. **Adding a new component**: Update this file with the new entry
2. **Finding a component**: Search by feature area (PRICING, BRANDED_REPORTS, etc.)
3. **Checking reusability**: Look at the Reusability Matrix
4. **Understanding dependencies**: Check the Dependency Graph
5. **Planning refactors**: Use the Candidates for Extraction list
