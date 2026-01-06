# Pages Inventory

**Last Updated:** January 6, 2026  
**Purpose:** Catalog all pages/routes with feature requirements for C046 UnlockDetails integration

---

## 🎯 Quick Reference

| Route | Page Component | Features Required | Status | Gating with C046 |
|-------|---|---|---|---|
| `/dashboard/pricing` | C-056 PricingPage | None (public) | ✅ Exists | ❌ No |
| `/dashboard/branded-reports` | TBD | `ccp-06:branded-reports` | 🚀 Planned | ✅ **YES** |
| `/dashboard/reports/[id]` | TBD | `ccp-06:branded-reports` | 🚀 Planned | ✅ **YES** |
| `/dashboard/crm` | TBD | `ccp-09:crm-sync` | 🚀 Planned | ✅ **YES** |
| `/dashboard/export` | TBD | `ccp-15:export-workspace` | 🚀 Planned | ✅ **YES** |
| `/dashboard/analytics` | TBD | `ccp-03:report-generation` | 🚀 Planned | ✅ **YES** |
| `/dashboard/workflows` | TBD | `ccp-09:crm-sync` | 🚀 Planned | ✅ **YES** |
| `/dashboard/audit-logs` | TBD | `ccp-07:audit` | 🚀 Planned | ⚠️ ADMIN ONLY |

---

## 📄 Detailed Page Specifications

### ✅ Existing Pages

#### `GET /dashboard/pricing`
**Component:** C-056 PricingPage  
**File:** `app/(dashboard)/pricing/page.tsx`  
**Type:** Server Component (async)  
**Feature Requirement:** None (public tier showcase)  
**Gating:** ❌ Not applicable (all users see pricing)  
**Dependencies:**
- C-055 SubmitButton
- C-057 PricingCard (internal)
- `lib/payments/stripe` (getStripePrices, getStripeProducts)

**Current Flow:**
1. Fetches Stripe products & prices on server
2. Maps plan configs to Stripe data
3. Renders 5 pricing cards (Pro, Pro+ CRM, Pro+ AI, Portfolio, Enterprise)
4. Submit button triggers checkout action

**UnlockDetails Integration:** ❌ Not needed (pricing page is free tier)

---

### 🚀 Planned Pages (CCP-06+)

#### `GET /dashboard/branded-reports`
**Component:** C-046 (to implement) - UnlockDetails-gated List Page  
**File:** `app/(dashboard)/branded-reports/page.tsx` (create)  
**Type:** Server Component (async)  
**Feature Requirement:** `ccp-06:branded-reports` (Pro tier minimum)  
**Gating:** ✅ **Use C046 UnlockDetails**

**Proposed Flow:**
1. Server fetches AppShell (account, workspace, can())
2. If `appShell.can('ccp-06:branded-reports')` → render list
3. Else → render C046 UnlockDetails with upgrade option
4. List shows: branded reports with edit/delete actions

**Child Components:**
- C046 UnlockDetails (paywall gate)
- BrandedReportList (new component, C-101 proposal)
- BrandedReportCard (new component, C-102 proposal)

**API Calls:**
- `GET /api/workspaces/[workspace_id]/branded-reports` (C-092)

**Implementation Checklist:**
- [ ] Create `app/(dashboard)/branded-reports/page.tsx`
- [ ] Wrap list in C046 UnlockDetails
- [ ] Pass feature: `'ccp-06:branded-reports'`
- [ ] Provide fallback UI in error state
- [ ] Test with free & pro users

---

#### `GET /dashboard/branded-reports/[id]`
**Component:** TBD - UnlockDetails-gated Detail Page  
**File:** `app/(dashboard)/branded-reports/[id]/page.tsx` (create)  
**Type:** Server Component (async)  
**Feature Requirement:** `ccp-06:branded-reports` (Pro tier minimum)  
**Gating:** ✅ **Use C046 UnlockDetails**

**Proposed Flow:**
1. Fetch report by ID
2. Check entitlement: `appShell.can('ccp-06:branded-reports')`
3. If yes → render report editor
4. Else → render C046 UnlockDetails

**Child Components:**
- C046 UnlockDetails (paywall gate)
- BrandedReportEditor (new component)
- BrandingCustomizer (new component)

**API Calls:**
- `GET /api/workspaces/[workspace_id]/branded-reports/[report_id]` (C-093)
- `PUT /api/workspaces/[workspace_id]/branded-reports/[report_id]` (C-094)

**Implementation Checklist:**
- [ ] Create `app/(dashboard)/branded-reports/[id]/page.tsx`
- [ ] Wrap editor in C046 UnlockDetails
- [ ] Handle 404 (missing report) vs 403 (insufficient tier)
- [ ] Test upgrade path from detail page

---

#### `POST /dashboard/branded-reports/new`
**Component:** TBD - UnlockDetails-gated Creation Page  
**File:** `app/(dashboard)/branded-reports/new/page.tsx` (create)  
**Type:** Server Component (async)  
**Feature Requirement:** `ccp-06:branded-reports`  
**Gating:** ✅ **Use C046 UnlockDetails**

**Proposed Flow:**
1. Check entitlement upfront
2. If allowed → show creation form
3. Else → show C046 UnlockDetails
4. On success → redirect to `/branded-reports/[id]`

---

#### `GET /dashboard/crm`
**Component:** TBD - UnlockDetails-gated CRM Hub  
**File:** `app/(dashboard)/crm/page.tsx` (create)  
**Type:** Server Component (async)  
**Feature Requirement:** `ccp-09:crm-sync` (Pro+ CRM tier minimum)  
**Gating:** ✅ **Use C046 UnlockDetails**

**Proposed Flow:**
1. Check `appShell.can('ccp-09:crm-sync')`
2. If yes → render CRM dashboard (Salesforce, HubSpot, Pipedrive sync status)
3. Else → C046 UnlockDetails (upgrade to Pro+ CRM)

**Features Behind Gate:**
- CRM connection status
- Sync logs
- Mapping configuration
- Webhooks

---

#### `GET /dashboard/workflows`
**Component:** TBD - UnlockDetails-gated Automation Hub  
**File:** `app/(dashboard)/workflows/page.tsx` (create)  
**Type:** Server Component (async)  
**Feature Requirement:** `ccp-09:crm-sync` (Pro+ CRM tier minimum, includes workflow builder)  
**Gating:** ✅ **Use C046 UnlockDetails**

**Proposed Flow:**
1. Check `appShell.can('ccp-09:crm-sync')`
2. If yes → show workflow builder & templates
3. Else → C046 UnlockDetails upgrade prompt

---

#### `GET /dashboard/export`
**Component:** TBD - UnlockDetails-gated Data Export  
**File:** `app/(dashboard)/export/page.tsx` (create)  
**Type:** Server Component (async)  
**Feature Requirement:** `ccp-15:export-workspace` (Pro+ tier minimum)  
**Gating:** ✅ **Use C046 UnlockDetails**

**Proposed Flow:**
1. Check `appShell.can('ccp-15:export-workspace')`
2. If yes → show format options (CSV, JSON, Parquet)
3. Else → C046 UnlockDetails

**Export Formats:**
- CSV (for spreadsheet compatibility)
- JSON (for data pipeline integration)
- Parquet (for analytics tools)

---

#### `GET /dashboard/analytics`
**Component:** TBD - UnlockDetails-gated Advanced Analytics  
**File:** `app/(dashboard)/analytics/page.tsx` (create)  
**Type:** Server Component (async)  
**Feature Requirement:** `ccp-03:report-generation` (Pro tier minimum)  
**Gating:** ✅ **Use C046 UnlockDetails**

**Proposed Flow:**
1. Check `appShell.can('ccp-03:report-generation')`
2. If yes → render analytics charts + drill-down
3. Else → C046 UnlockDetails

**Sub-features:**
- Custom report builder
- Scheduled reports (ccp-04: report-sharing)
- Data export (ccp-15: export-workspace)

---

#### `GET /dashboard/audit-logs`
**Component:** TBD - RLS-gated Admin Audit View  
**File:** `app/(dashboard)/audit-logs/page.tsx` (create)  
**Type:** Server Component (async)  
**Feature Requirement:** None (RLS enforces access; admin-only via workspace role)  
**Gating:** ⚠️ **API-level RLS only (no C046)**

**Proposed Flow:**
1. Check workspace role: admin/owner required
2. If yes → show `blocked_access_logs` from C046 audit table
3. Else → 403 error (not unauthorized tier, but insufficient role)

**Data Visible:**
- Blocked access attempts (from C046)
- User actions (from C007)
- API calls (from middleware logging)
- Workspace membership changes

**Access Control:**
- Admin/Owner only (via RLS policy)
- Workspace-scoped (via RLS policy on `blocked_access_logs`)
- Read-only (compliance audit trail)

---

## 🎯 C046 Integration Checklist

### For Each Gated Page:

- [ ] **Import C046:** `import { UnlockDetails } from '@/lib/components/C046-UnlockDetails'`
- [ ] **Check AppShell:** `const appShell = useAppShell()` (client) OR fetch from context (server)
- [ ] **Conditional Render:**
  ```tsx
  if (!appShell.can(featureId)) {
    return <UnlockDetails feature={featureId} />;
  }
  return <YourPageContent />;
  ```
- [ ] **Feature ID Mapping:** Map each page to one of:
  - `'ccp-03:report-generation'` → Analytics
  - `'ccp-06:branded-reports'` → Branded Reports
  - `'ccp-09:crm-sync'` → CRM + Workflows
  - `'ccp-15:export-workspace'` → Data Export
- [ ] **Test Scenarios:**
  - Free tier user → sees UnlockDetails
  - Insufficient tier → sees UnlockDetails with upgrade path
  - Correct tier → sees content
  - Anonymous user → sees UnlockDetails with login prompt
- [ ] **Add to CI:** Update `.github/workflows/ccp-06-checks.yml` to test page integration

---

## 📊 Feature-to-CCP Mapping

| Feature ID | Feature Name | Min Tier | CCPs | Example Pages |
|---|---|---|---|---|
| `ccp-03:report-generation` | Report Generation | Pro | CCP-03, CCP-05 | `/dashboard/analytics` |
| `ccp-04:report-sharing` | Report Sharing | Pro | CCP-04, CCP-05 | `/dashboard/reports/share` |
| `ccp-06:branded-reports` | Branded Reports | Pro | CCP-06, CCP-14 | `/dashboard/branded-reports` |
| `ccp-09:crm-sync` | CRM Sync | Pro+ CRM | CCP-09, CCP-05 | `/dashboard/crm`, `/dashboard/workflows` |
| `ccp-15:export-workspace` | Data Export | Pro+ | CCP-15, CCP-05 | `/dashboard/export` |

---

## 🚀 Implementation Priority

### Phase 1 (Sprint N): Core Pages
- [ ] `/dashboard/branded-reports` (C-056 PricingPage already exists; build list)
- [ ] `/dashboard/branded-reports/[id]` (detail editor)
- [ ] `/dashboard/branded-reports/new` (creation flow)

### Phase 2 (Sprint N+1): Extended Pages
- [ ] `/dashboard/crm` (CRM hub)
- [ ] `/dashboard/workflows` (automation builder)
- [ ] `/dashboard/analytics` (advanced charts)

### Phase 3 (Sprint N+2): Admin & Export
- [ ] `/dashboard/export` (data export formats)
- [ ] `/dashboard/audit-logs` (admin-only compliance view)

---

## 🔗 Dependencies

### C046 UnlockDetails depends on:
- C001 AppShell (for account/workspace/entitlements)
- C045 BlockedExplain (fallback UI component)
- `/api/upgrade-option` endpoint (C046 API)
- `/api/audit/blocked-access` endpoint (C046 API)

### Pages depend on:
- C046 UnlockDetails (paywall gate)
- AppShell context (account, workspace, can())
- Feature-specific API routes (C-091 through C-095 for branded reports, etc.)

---

## 📋 File Creation Tracking

| File | Purpose | Status |
|------|---------|--------|
| `app/(dashboard)/branded-reports/page.tsx` | List gated page | Not Started |
| `app/(dashboard)/branded-reports/[id]/page.tsx` | Detail gated page | Not Started |
| `app/(dashboard)/branded-reports/new/page.tsx` | Creation gated page | Not Started |
| `app/(dashboard)/crm/page.tsx` | CRM hub | Not Started |
| `app/(dashboard)/workflows/page.tsx` | Automation hub | Not Started |
| `app/(dashboard)/analytics/page.tsx` | Analytics dashboard | Not Started |
| `app/(dashboard)/export/page.tsx` | Data export | Not Started |
| `app/(dashboard)/audit-logs/page.tsx` | Admin audit | Not Started |

---

**Document Version:** 1.0  
**Created:** January 6, 2026  
**Maintainer:** Engineering Team (CCP-06 Owner)
