# UX User Journey Tree - GeoSelect Telluride SaaS

**Last Updated:** January 6, 2026  
**Purpose:** Visual representation of user flows through authentication, workspace selection, and feature access

---

## 🌳 Master User Journey Tree

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         🌐 GeoSelect Entry Point                        │
│                     http://localhost:3000/                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
         ┌──────────▼──────────┐       ┌──────────▼──────────┐
         │ NOT AUTHENTICATED   │       │   AUTHENTICATED     │
         │  (Anonymous User)   │       │   (Signed-in User)  │
         └──────────┬──────────┘       └──────────┬──────────┘
                    │                               │
        ┌───────────▼───────────┐       ┌───────────▼───────────┐
        │  Demo: ?demo=          │       │  Fetch Auth Context   │
        │  not-signed-in         │       │  (Real Supabase)      │
        │                        │       │                       │
        │ ✓ Sign-In Screen       │       │ ✓ Check User Session  │
        │ ✓ Sign-Up Link         │       │ ✓ Load Account Data   │
        │ ✓ Social Login         │       │ ✓ Load Workspace List │
        └───────────┬───────────┘       └───────────┬───────────┘
                    │                               │
                    │               ┌───────────────┴───────────────┐
                    │               │                               │
                    │    ┌──────────▼──────────┐       ┌──────────▼──────────┐
                    │    │ NO WORKSPACE        │       │ HAS WORKSPACES      │
                    │    │ (Selected Account)  │       │ (User member)       │
                    │    └──────────┬──────────┘       └──────────┬──────────┘
                    │               │                               │
                    │    ┌──────────▼──────────┐       ┌──────────▼──────────┐
                    │    │ Demo:              │       │ Demo:              │
                    │    │ ?demo=no-workspace │       │ ?demo=authenticated │
                    │    │                    │       │ &workspace=ws-id    │
                    │    │ ✓ Create/Select    │       │                    │
                    │    │   Workspace        │       │ ✓ Workspace Selected│
                    │    │ ✓ Onboarding Flow  │       │ ✓ Sidebar Loaded   │
                    │    │ ✓ Invite Team      │       │ ✓ Navigation Menu  │
                    │    └──────────┬──────────┘       └──────────┬──────────┘
                    │               │                               │
                    │               └───────────────┬───────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │   📊 DASHBOARD ACCESS        │
                    │   (Workspace Available)       │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────▼────────┐      ┌──────────▼──────────┐     ┌──────────▼──────────┐
│ FREE TIER      │      │   PRO TIER         │     │  ENTERPRISE TIER   │
│ (Base Access)  │      │  (Mid Features)    │     │  (All Features)    │
└───────┬────────┘      └──────────┬──────────┘     └──────────┬──────────┘
        │                          │                           │
        │               ┌──────────▼──────────┐     ┌──────────▼──────────┐
        │               │ Entitlement Check   │     │ Entitlement Check   │
        │               │ (C046 UnlockDetails)│     │ (C046 UnlockDetails)│
        │               │                     │     │                     │
        │               │ ccp-03:report-      │     │ ✓ All CCP features  │
        │               │ generation          │     │ ✓ Custom workflows  │
        │               │ ccp-04:report-      │     │ ✓ Admin controls    │
        │               │ sharing             │     │ ✓ Audit logs        │
        │               │ ccp-06:branded-     │     │ ✓ Unlimited exports │
        │               │ reports             │     │ ✓ Priority support  │
        │               │ ccp-09:crm-sync     │     └──────────┬──────────┘
        │               │ ccp-15:export       │                │
        │               └──────────┬──────────┘                │
        │                          │                           │
        └──────────┬───────────────┼───────────────────────────┘
                   │               │
        ┌──────────▼───────────────▼────────────┐
        │   Conditional Page Rendering          │
        │   (C046 UnlockDetails Gating)         │
        └──────────┬───────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼────┐ ┌─────▼──────┐ ┌────▼──────┐
│Pricing │ │ Parcels/   │ │Additional │
│Page    │ │ Data       │ │Features   │
└────────┘ └────────────┘ └───────────┘

```

---

## 🎯 Detailed Journey Flows

### Flow 1️⃣: New User (Not Signed In)

```
START: Unauthenticated visitor
   │
   ├─ URL: http://localhost:3000/
   │   Demo Mode: ?demo=not-signed-in
   │
   ├─ Component: Sign-In Screen
   │   ├─ Display: Sign-in form, Social login options, Sign-up link
   │   ├─ Actions:
   │   │  ├─ Enter email/password → Authenticate
   │   │  ├─ Google/GitHub OAuth → Authenticate
   │   │  └─ "Don't have account?" → Sign-up flow
   │   │
   │   └─ Validation:
   │      ├─ Check: getAuthContextServerSide() returns null/undefined
   │      ├─ Result: Show sign-in UI
   │      └─ Status: ✅ IMPLEMENTED
   │
   ├─ POST: /api/auth/sign-in
   │   ├─ Input: { email, password }
   │   ├─ Process: Supabase auth.signInWithPassword()
   │   ├─ Output: { user, session }
   │   └─ Redirect: /dashboard/workspace-select (if no active workspace)
   │
   └─ Result: ✅ Authenticated

```

### Flow 2️⃣: User Without Active Workspace

```
START: Authenticated, no workspace selected
   │
   ├─ URL: http://localhost:3000/dashboard/workspace-select
   │   Demo Mode: ?demo=no-workspace
   │
   ├─ Component: Workspace Selection / Onboarding
   │   ├─ Step 1: Check workspace list
   │   │  ├─ GET /api/workspaces
   │   │  ├─ Filter: workspaces where user is member
   │   │  └─ Result: List existing workspaces
   │   │
   │   ├─ Step 2: Display options
   │   │  ├─ If workspaces exist:
   │   │  │  ├─ Show workspace cards with select buttons
   │   │  │  ├─ Each shows: name, members count, created date
   │   │  │  └─ Select → Set active workspace → Navigate to dashboard
   │   │  │
   │   │  └─ If no workspaces:
   │   │     ├─ Show "Create Workspace" form
   │   │     ├─ Fields: Name, Description, Industry
   │   │     ├─ Button: "Create Workspace"
   │   │     └─ Action: POST /api/workspaces → Set active → Redirect
   │   │
   │   └─ Status: 🚀 PLANNED (C-115)
   │
   ├─ POST: /api/workspaces/[id]/set-active
   │   ├─ Input: { workspace_id }
   │   ├─ Process: Update user's active_workspace_id
   │   ├─ Output: { workspace }
   │   └─ Redirect: /parcels/page/1 (dashboard)
   │
   └─ Result: ✅ Workspace Selected

```

### Flow 3️⃣: User With Active Workspace (Dashboard)

```
START: Authenticated with active workspace
   │
   ├─ URL: http://localhost:3000/parcels/page/1
   │   Demo Mode: ?demo=authenticated&workspace=ws-123
   │
   ├─ Component: AppShell + Parcels Page
   │   ├─ Sidebar: Workspace selector, navigation menu
   │   ├─ Header: Workspace name, user profile, settings
   │   └─ Main: Parcels list with pagination
   │
   ├─ Server Load: getAuthContextServerSide()
   │   ├─ Fetch: User session, account, workspace, entitlements
   │   ├─ Process: Validate user has workspace access
   │   ├─ Result: { user, account, workspace, entitlements }
   │   └─ Status: ✅ IMPLEMENTED
   │
   ├─ Feature Check: Entitlement validation (C046)
   │   ├─ Check: can('ccp-03:report-generation')?
   │   ├─ Free tier: Only basic parcels view
   │   ├─ Pro tier: Full features unlocked
   │   └─ Enterprise: All features + admin controls
   │
   ├─ Content Rendering
   │   ├─ Free Tier Display:
   │   │  ├─ Parcels list (read-only, first 100)
   │   │  ├─ Basic search
   │   │  ├─ Paywall: "Analytics locked - Upgrade to Pro"
   │   │  └─ "Upgrade" button → /dashboard/pricing
   │   │
   │   ├─ Pro Tier Display:
   │   │  ├─ Parcels list (full access, search/filter)
   │   │  ├─ Pagination controls
   │   │  ├─ Edit/Delete actions (where permitted)
   │   │  ├─ Export option (if ccp-15 enabled)
   │   │  └─ Analytics link (if ccp-03 enabled)
   │   │
   │   └─ Enterprise Display:
   │      ├─ All Pro features
   │      ├─ CRM sync tab (ccp-09)
   │      ├─ Workflows builder (ccp-09)
   │      ├─ Audit logs (admin-only, RLS enforced)
   │      └─ Custom integrations
   │
   └─ Status: ✅ IMPLEMENTED (demo mode), 🚀 REAL AUTH (in progress)

```

### Flow 4️⃣: Feature Access with Paywall (C046)

```
START: User accesses gated feature
   │
   ├─ URL: http://localhost:3000/dashboard/branded-reports
   │   Feature: ccp-06:branded-reports
   │   Tier: Pro+ (minimum)
   │
   ├─ Component: Server page component
   │   ├─ Step 1: Fetch AppShell
   │   │  ├─ GET: getAuthContextServerSide()
   │   │  ├─ Data: { user, workspace, entitlements }
   │   │  └─ Check: workspace loaded and valid
   │   │
   │   ├─ Step 2: Check entitlement
   │   │  ├─ Call: appShell.can('ccp-06:branded-reports')
   │   │  ├─ Result: boolean (true/false)
   │   │  └─ Decision point ➡️ Branch A or B
   │   │
   │   └─ Status: ✅ FRAMEWORK READY (C046 module exists)
   │
   ├─ BRANCH A: User HAS entitlement (Pro+ tier)
   │   ├─ Render: <BrandedReportsList />
   │   ├─ Features:
   │   │  ├─ List all branded reports for workspace
   │   │  ├─ Search/Filter by name, status, created date
   │   │  ├─ Actions: View, Edit, Duplicate, Delete
   │   │  ├─ Create new button
   │   │  └─ Pagination (if 100+ reports)
   │   │
   │   ├─ GET /api/workspaces/[ws_id]/branded-reports
   │   │   ├─ Response: Array of reports with metadata
   │   │   ├─ RLS: Workspace-scoped (only workspace members see)
   │   │   └─ Status: 🚀 PLANNED (C-092)
   │   │
   │   └─ Result: ✅ Full feature access
   │
   ├─ BRANCH B: User LACKS entitlement (Free/insufficient tier)
   │   ├─ Render: <UnlockDetails feature="ccp-06:branded-reports" />
   │   ├─ Display:
   │   │  ├─ Feature description: "Advanced branded reports"
   │   │  ├─ Benefits: Custom branding, email delivery, etc.
   │   │  ├─ Required tier: Pro+
   │   │  ├─ Current tier: Free (or Pro without CRM)
   │   │  ├─ Upgrade CTA button: "Upgrade Now"
   │   │  └─ Alternative: "Learn more"
   │   │
   │   ├─ POST /api/blocked-access (audit logging)
   │   │  ├─ Log: User attempted feature without entitlement
   │   │  ├─ Data: { feature_id, user_id, workspace_id, timestamp }
   │   │  └─ Status: ✅ IMPLEMENTED (C046 audit table)
   │   │
   │   ├─ Navigate: User clicks "Upgrade Now"
   │   │  └─ Redirect: /dashboard/pricing?feature=ccp-06
   │   │
   │   └─ Result: ✅ Paywall shown, upgrade path offered
   │
   └─ Status: ✅ READY TO INTEGRATE (C046 module completed)

```

### Flow 5️⃣: Pricing & Upgrade Path

```
START: User accesses pricing page
   │
   ├─ URL: http://localhost:3000/dashboard/pricing
   │   Optional: ?feature=ccp-06 (upgrade for specific feature)
   │
   ├─ Component: PricingPage (C-056)
   │   ├─ Server Load: getStripePrices(), getStripeProducts()
   │   ├─ Render: 5 pricing cards
   │   │  ├─ Card 1: Pro ($29/mo)
   │   │  │  ├─ Features: Basic reports, Parcel access, Search
   │   │  │  ├─ Includes: ccp-03:report-generation
   │   │  │  └─ Button: "Get Started"
   │   │  │
   │   │  ├─ Card 2: Pro+ CRM ($49/mo)
   │   │  │  ├─ Features: Pro + CRM sync, Workflows, Automations
   │   │  │  ├─ Includes: ccp-09:crm-sync, ccp-05:report-sharing
   │   │  │  └─ Button: "Get Started"
   │   │  │
   │   │  ├─ Card 3: Pro+ AI ($79/mo)
   │   │  │  ├─ Features: Pro + AI-powered insights, Advanced analytics
   │   │  │  ├─ Includes: ccp-03:report-generation + AI
   │   │  │  └─ Button: "Get Started"
   │   │  │
   │   │  ├─ Card 4: Portfolio ($199/mo)
   │   │  │  ├─ Features: All Pro features + White-label + Custom domains
   │   │  │  ├─ Includes: All CCPs + branding
   │   │  │  └─ Button: "Contact Sales"
   │   │  │
   │   │  └─ Card 5: Enterprise (Custom)
   │   │     ├─ Features: Dedicated support, SLA, Custom integration
   │   │     ├─ Includes: All features + admin controls
   │   │     └─ Button: "Contact Sales"
   │   │
   │   └─ Status: ✅ IMPLEMENTED (C-056, C-057)
   │
   ├─ CTA: User clicks "Get Started" on Pro plan
   │   ├─ Action: <SubmitButton>
   │   ├─ POST: /api/stripe/checkout-session
   │   │  ├─ Input: { price_id, customer_id, workspace_id }
   │   │  ├─ Process: Create Stripe checkout session
   │   │  ├─ Output: { sessionId, url }
   │   │  └─ Status: ✅ IMPLEMENTED (C-055)
   │   │
   │   ├─ Redirect: Stripe hosted checkout page
   │   │  ├─ User fills: Card details, billing address
   │   │  ├─ Stripe confirms payment
   │   │  └─ Redirect: /dashboard/onboarding/success
   │   │
   │   └─ Backend: Stripe webhook → Update workspace tier
   │      ├─ Event: payment_intent.succeeded
   │      ├─ Action: Update workspace.stripe_subscription_id
   │      ├─ Action: Create entitlements for purchased CCPs
   │      ├─ Action: Send confirmation email
   │      └─ User relaunches app → New features unlocked ✅
   │
   └─ Result: ✅ Subscription activated

```

---

## 📊 Page Route Map

### Public Routes
```
┌─ / (Landing Page)
│  └─ demo=not-signed-in (Sign-in screen)
│
└─ /dashboard/pricing
   └─ GET /api/stripe/prices
      GET /api/stripe/products
```

### Protected Routes (Authenticated Required)
```
┌─ /dashboard
│  ├─ /workspace-select (No workspace yet)
│  │  └─ demo=no-workspace
│  │
│  ├─ /pricing (Feature upgrade)
│  │  └─ ?feature=ccp-06 (specific feature context)
│  │
│  ├─ /settings
│  │  ├─ /profile
│  │  ├─ /workspace
│  │  └─ /billing
│  │
│  └─ [WORKSPACE-SCOPED ROUTES]
│     ├─ /parcels/page/[pageNum]
│     │  ├─ demo=authenticated (Read-only demo)
│     │  ├─ Entitlement: Free (basic)
│     │  └─ Pagination: Previous/Next
│     │
│     ├─ /parcels/[id]
│     │  └─ Entitlement: Free (basic)
│     │
│     ├─ /branded-reports (C046 gated)
│     │  ├─ Entitlement: ccp-06:branded-reports
│     │  ├─ GET /api/workspaces/[ws_id]/branded-reports
│     │  └─ Fallback: UnlockDetails paywall
│     │
│     ├─ /branded-reports/[id] (C046 gated)
│     │  ├─ Entitlement: ccp-06:branded-reports
│     │  ├─ GET /api/workspaces/[ws_id]/branded-reports/[id]
│     │  └─ Fallback: UnlockDetails paywall
│     │
│     ├─ /branded-reports/new (C046 gated)
│     │  ├─ Entitlement: ccp-06:branded-reports
│     │  └─ POST /api/workspaces/[ws_id]/branded-reports
│     │
│     ├─ /crm (C046 gated)
│     │  ├─ Entitlement: ccp-09:crm-sync
│     │  ├─ Sub-routes:
│     │  │  ├─ /connections (Salesforce, HubSpot, Pipedrive)
│     │  │  ├─ /sync-logs
│     │  │  └─ /field-mapping
│     │  └─ Fallback: UnlockDetails paywall
│     │
│     ├─ /workflows (C046 gated)
│     │  ├─ Entitlement: ccp-09:crm-sync
│     │  ├─ Builder: Drag-drop workflow canvas
│     │  └─ Fallback: UnlockDetails paywall
│     │
│     ├─ /analytics (C046 gated)
│     │  ├─ Entitlement: ccp-03:report-generation
│     │  ├─ Charts: Parcel trends, market insights, ROI
│     │  └─ Fallback: UnlockDetails paywall
│     │
│     ├─ /export (C046 gated)
│     │  ├─ Entitlement: ccp-15:export-workspace
│     │  ├─ Formats: CSV, JSON, Parquet
│     │  └─ Fallback: UnlockDetails paywall
│     │
│     └─ /audit-logs (Admin-only, no C046)
│        ├─ RLS: workspace_role = 'admin' OR 'owner'
│        ├─ Data: blocked_access_logs from C046 audit
│        └─ Access check: getAuthContextServerSide() + RLS
```

---

## 🎬 Demo Mode URL Guide

Test different user journeys without auth:

```
# Not signed in
http://localhost:3000/parcels/page/1?demo=not-signed-in

# Signed in, no workspace selected
http://localhost:3000/parcels/page/1?demo=no-workspace

# Signed in, workspace selected, reading parcel data
http://localhost:3000/parcels/page/1?demo=authenticated

# Signed in, custom workspace
http://localhost:3000/parcels/page/1?demo=authenticated&workspace=custom-workspace-id

# Feature access test (hardcode entitlement in demo)
http://localhost:3000/parcels/page/1?demo=authenticated&entitlement=ccp-06:branded-reports
```

---

## 🔄 State Machine: Authentication Lifecycle

```
                        ┌─────────────────┐
                        │  UNAUTHENTICATED │
                        └────────┬─────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Show Sign-In Screen    │
                    │  - Email/Password Form  │
                    │  - Social OAuth Options │
                    │  - Sign-Up Link         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ POST /api/auth/sign-in  │
                    │ - Validate credentials  │
                    │ - Create session        │
                    │ - Return user+session   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼──────────────────┐
                    │   AUTHENTICATED               │
                    │   (No workspace selected)     │
                    └────────────┬──────────────────┘
                                 │
                    ┌────────────▼─────────────────┐
                    │ Check Workspace List         │
                    │ - GET /api/workspaces        │
                    │ - Fetch: user_workspace_map  │
                    └────────────┬─────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
        ┌────────▼──────────────┐  ┌────────────▼─────────┐
        │ ZERO WORKSPACES       │  │ HAS WORKSPACES       │
        │ (New user)            │  │ (Existing member)    │
        └────────┬──────────────┘  └────────────┬─────────┘
                 │                               │
        ┌────────▼──────────────┐                │
        │ WORKSPACE CREATION    │                │
        │ - Show creation form  │                │
        │ - Input: Name, desc   │                │
        │ - POST /workspaces    │                │
        └────────┬──────────────┘                │
                 │                   ┌───────────▼──────────┐
                 │                   │ WORKSPACE SELECTION  │
                 │                   │ - List workspace cards
                 │                   │ - Click to select     │
                 │                   │ - Update active_ws    │
                 │                   └───────────┬───────────┘
                 │                               │
                 └───────────────┬───────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │ WORKSPACE ACTIVE          │
                    │ - Set workspace context   │
                    │ - Load sidebar + nav      │
                    │ - Load entitlements       │
                    └────────────┬──────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │ DASHBOARD READY           │
                    │ - Parcels page loaded     │
                    │ - Feature gates applied   │
                    │ - C046 paywalls shown     │
                    └──────────────────────────┘
```

---

## 🛡️ Security Layers

### Layer 1: Authentication
- ✅ Supabase auth (email/password, OAuth)
- ✅ Session storage (HTTP-only cookies)
- ✅ CSRF protection (SameSite, token-based)

### Layer 2: Workspace Access (RLS)
- ✅ User must be in `workspace_members`
- ✅ RLS policy checks: `auth.uid()` in workspace members
- ✅ Workspace scoping: All queries filtered by `workspace_id`

### Layer 3: Feature Entitlements (C046)
- ✅ Stripe subscription → Entitlements table
- ✅ `appShell.can(feature_id)` checks in-memory
- ✅ Server-side validation: `getAuthContextServerSide()`
- ✅ Audit logging: `blocked_access_logs` table

### Layer 4: Admin Controls (RLS)
- ✅ Audit logs: `workspace_role = 'admin'` only
- ✅ Billing: Account owner only
- ✅ Team management: Admin/owner roles only

---

## 🚀 Implementation Progress

| Component | Status | Owner | ETA |
|-----------|--------|-------|-----|
| Auth (Sign-in/up) | 🚀 Planned | DevOps | Jan 15 |
| Workspace selection | 🚀 Planned | C-115 | Jan 20 |
| Parcels page (real data) | ✅ Demo ready | Session today | ✅ Live |
| Pricing page | ✅ Implemented | C-056 | ✅ Live |
| Branded reports list (C046) | 🚀 Planned | C-092 | Jan 30 |
| Branded reports detail (C046) | 🚀 Planned | C-093 | Feb 5 |
| CRM page (C046) | 🚀 Planned | TBD | Feb 10 |
| Workflows (C046) | 🚀 Planned | TBD | Feb 15 |
| Analytics (C046) | 🚀 Planned | TBD | Feb 20 |
| Audit logs (Admin) | 🚀 Planned | TBD | Feb 25 |

---

**Document Status:** Complete (User Journey Tree)  
**Last Updated:** January 6, 2026  
**Next Review:** After auth implementation phase

