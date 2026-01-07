# Pages Enumeration

**Last Updated:** January 6, 2026  
**Purpose:** High-level enumeration of all routes/pages (distinct from components in COMPONENT_INVENTORY.md)  
**Format:** Pages are user-facing entry points, typically composed of multiple components

---

## Quick Reference by Category

| Category | Routes | Status | Notes |
|----------|--------|--------|-------|
| **Public & Entry** | `/`, `/landing`, `/mobile-landing`, `/faq`, `/pricing` | ✅ Exists | Entry funnel |
| **Core Product** | `/parcel/summary`, `/preview/components` | ✅ Exists | Product demo |
| **Sharing & Public Access** | `/shared/[token]`, `/share/[token]` | ✅ Exists | Public reports |
| **Authentication** | `/sign-in`, `/auth/callback` | ✅ Exists | Auth flow |
| **Dashboard Main** | `/dashboard-main-page` | ✅ Exists | Authenticated hub |
| **Activity & Reports** | `/dashboard/activity`, `/dashboard/reports`, `/dashboard/reports/[id]`, `/dashboard/reports/[id]/share` | ✅ Exists | Report management |
| **Settings & Account** | `/dashboard/general`, `/dashboard/security` | ✅ Exists | User config |
| **Onboarding & Choice** | `/continuation-choice`, `/mobile-onboarding-choice` | ✅ Exists | Flow routing |

---

## 📄 Detailed Page Specifications

### ✅ Public & Entry Surfaces

#### Root & Landing
| Route | Purpose | Component | Status | Notes |
|-------|---------|-----------|--------|-------|
| `/` | Home/root | TBD | Exists | Entry point |
| `/landing` | Desktop landing | TBD | Exists | Marketing |
| `/mobile-landing` | Mobile landing | TBD | Exists | Mobile variant |
| `/faq` | FAQ page | TBD | Exists | Help content |
| `/pricing` | Pricing table | C-056 PricingPage | ✅ Exists | 5 tiers (Pro, Pro+ CRM, Pro+ AI, Portfolio, Enterprise) |

---

### ✅ Core Product Surfaces

#### Parcel & Preview
| Route | Purpose | Component | Status | Feature Requirement |
|-------|---------|-----------|--------|---|
| `/parcel/summary` | Parcel details | TBD | Exists | None (free tier) |
| `/preview/components` | Component gallery | ComponentsGalleryPage | Exists | None (public demo) |

---

### ✅ Sharing & Public Access

#### Public Reports
| Route | Purpose | Component | Status | Auth | Notes |
|-------|---------|-----------|--------|------|-------|
| `/shared/[token]` | Shared report (token-based) | TBD | Exists | Token validation | Public access via token |
| `/share/[token]` | Share endpoint | TBD | Exists | Token validation | Same as `/shared/[token]` (variant) |

---

### ✅ Authentication & Session

#### Auth Flow
| Route | Purpose | Component | Status | Notes |
|-------|---------|-----------|--------|-------|
| `/sign-in` | Login page | TBD | Exists | Supabase auth |
| `/auth/callback` | Auth callback | TBD | Exists | OAuth/SAML redirect |

---

### ✅ Dashboard Area (Authenticated)

#### Main Dashboard
| Route | Purpose | Component | Status | Requirements |
|-------|---------|-----------|--------|---|
| `/dashboard-main-page` | Dashboard hub | TBD | Exists | Authenticated user |

#### Activity & Workspace
| Route | Purpose | Component | Status | Requirements |
|-------|---------|-----------|--------|---|
| `/dashboard/activity` | Activity feed | TBD | Exists | Authenticated user |

#### Reports & Insights
| Route | Purpose | Component | Status | Feature Requirements | Notes |
|-------|---------|-----------|--------|---|---|
| `/dashboard/reports` | Reports list | TBD | Exists | None (view own reports) | List all user's reports |
| `/dashboard/reports/[id]` | Report detail | TBD | Exists | `ccp-06:branded-reports` (for Pro+) | View single report |
| `/dashboard/reports/[id]/share` | Report sharing | TBD | Exists | `ccp-06:branded-reports` (for Pro+) | Configure sharing settings |

#### Settings & Account
| Route | Purpose | Component | Status | Requirements | Access |
|-------|---------|-----------|--------|---|---|
| `/dashboard/general` | Account settings | TBD | Exists | Authenticated user | User-scoped RLS |
| `/dashboard/security` | Security settings | TBD | Exists | Authenticated user | User-scoped RLS |

---

### ✅ Onboarding & Flow Control

#### User Choice Pages
| Route | Purpose | Component | Status | Flow Context |
|-------|---------|-----------|--------|---|
| `/continuation-choice` | Continue/signup choice | TBD | Exists | Post-parcel-summary (anonymous vs account) |
| `/mobile-onboarding-choice` | Mobile mode selection | TBD | Exists | Mobile entry onboarding (anonymous vs account) |

**Purpose:** Both routes let users choose between:
- **Anonymous Mode** — Explore instantly, results ephemeral (read-only, no save)
- **Account Mode** — Save results, share with team, preserve audit trail

---

## 🗂️ Page Hierarchy

```
ROOT
├── Public Entry (unauthenticated)
│   ├── / (home)
│   ├── /landing (desktop landing)
│   ├── /mobile-landing (mobile landing)
│   ├── /faq (help)
│   ├── /pricing (pricing table)
│   │
│   ├── /parcel/summary (product demo, free tier)
│   ├── /preview/components (component gallery)
│   │
│   └── /shared/[token], /share/[token] (public reports via token)
│
├── Authentication
│   ├── /sign-in (login)
│   └── /auth/callback (OAuth callback)
│
├── Onboarding Flows (pre-auth decision)
│   ├── /continuation-choice (post-demo: anonymous vs account)
│   └── /mobile-onboarding-choice (mobile entry: anonymous vs account)
│
└── Authenticated (dashboard & settings)
    ├── /dashboard-main-page (hub)
    ├── /dashboard/activity (activity feed)
    ├── /dashboard/reports (list reports)
    ├── /dashboard/reports/[id] (view report) [gated: ccp-06]
    ├── /dashboard/reports/[id]/share (share report) [gated: ccp-06]
    ├── /dashboard/general (account settings)
    └── /dashboard/security (security settings)
```

---

## 🔐 Authentication & Authorization Summary

| Route Group | Auth Required | Entitlements Gated | RLS Scope |
|---|---|---|---|
| Public/Entry | ❌ No | ❌ No | Public |
| Sharing (token) | ⚠️ Token | ❌ No | By token |
| Auth | ❌ No (during flow) | ❌ No | N/A |
| Onboarding | ⚠️ Optional | ❌ No (choice page) | N/A |
| Dashboard | ✅ Yes | ⚠️ Some (reports) | Workspace |
| Settings | ✅ Yes | ❌ No (user-owned) | User-scoped |

---

## 📊 Feature Gating Matrix

| Route | Free | Pro | Pro+ | Portfolio | Enterprise | Notes |
|---|---|---|---|---|---|---|
| `/pricing` | ✅ | ✅ | ✅ | ✅ | ✅ | Public |
| `/parcel/summary` | ✅ | ✅ | ✅ | ✅ | ✅ | Free tier feature |
| `/dashboard/reports` | ✅ | ✅ | ✅ | ✅ | ✅ | View own only |
| `/dashboard/reports/[id]` | ❌ | ✅ | ✅ | ✅ | ✅ | Gated: ccp-06 |
| `/dashboard/reports/[id]/share` | ❌ | ✅ | ✅ | ✅ | ✅ | Gated: ccp-06 |
| `/dashboard/activity` | ✅ | ✅ | ✅ | ✅ | ✅ | Basic activity |
| `/dashboard/general` | ✅ | ✅ | ✅ | ✅ | ✅ | User settings |
| `/dashboard/security` | ✅ | ✅ | ✅ | ✅ | ✅ | User security |

---

## 🚀 Testing Coverage Checklist

### Public Entry Flow
- [ ] `/` — Homepage loads
- [ ] `/landing` — Desktop landing renders
- [ ] `/mobile-landing` — Mobile landing responsive
- [ ] `/faq` — FAQ content displays
- [ ] `/pricing` — Stripe products load, 5 tiers visible

### Product Demo Flow
- [ ] `/parcel/summary` — Parcel data loads, map renders
- [ ] `/preview/components` — Component gallery loads, all components render

### Public Sharing Flow
- [ ] `/shared/[token]` — Valid token → report displays
- [ ] `/shared/[token]` — Invalid token → error page
- [ ] `/share/[token]` — Same as above (variant test)

### Authentication Flow
- [ ] `/sign-in` — Login form renders, Supabase integration works
- [ ] `/auth/callback` — Callback processes OAuth token, redirects to dashboard

### Onboarding Flow
- [ ] `/continuation-choice` — Both options visible (anonymous vs account)
- [ ] `/continuation-choice` → **Anonymous** → Redirects to `/parcel/summary` (or demo area)
- [ ] `/continuation-choice` → **Account** → Redirects to `/sign-in`
- [ ] `/mobile-onboarding-choice` — FAQ expandable, both options visible
- [ ] `/mobile-onboarding-choice` → **Anonymous** → Enters app in anonymous mode
- [ ] `/mobile-onboarding-choice` → **Account** → Redirects to `/sign-in`

### Dashboard Flow (Authenticated)
- [ ] `/dashboard-main-page` — Shows workspace overview
- [ ] `/dashboard/activity` — Shows recent activity
- [ ] `/dashboard/reports` — Lists user's reports
- [ ] `/dashboard/reports/[id]` — Free tier denied, Pro+ allowed
- [ ] `/dashboard/reports/[id]/share` — Free tier denied, Pro+ allowed

### Settings Flow (Authenticated)
- [ ] `/dashboard/general` — Shows account info, tier badge
- [ ] `/dashboard/security` — Shows password change, 2FA options

---

## 📋 Page Creation Status

| Route | Exists | Component | Notes |
|-------|--------|-----------|-------|
| `/` | ✅ | TBD | Home/landing |
| `/landing` | ✅ | TBD | Desktop variant |
| `/mobile-landing` | ✅ | TBD | Mobile variant |
| `/faq` | ✅ | TBD | Help content |
| `/pricing` | ✅ | C-056 PricingPage | Stripe integration |
| `/parcel/summary` | ✅ | TBD | Product demo |
| `/preview/components` | ✅ | ComponentsGalleryPage | Component showcase |
| `/shared/[token]` | ✅ | TBD | Public reports |
| `/share/[token]` | ✅ | TBD | Share variant |
| `/sign-in` | ✅ | TBD | Auth |
| `/auth/callback` | ✅ | TBD | Auth callback |
| `/dashboard-main-page` | ✅ | TBD | Dashboard hub |
| `/dashboard/activity` | ✅ | TBD | Activity feed |
| `/dashboard/reports` | ✅ | TBD | Reports list |
| `/dashboard/reports/[id]` | ✅ | TBD | Report detail |
| `/dashboard/reports/[id]/share` | ✅ | TBD | Share report |
| `/dashboard/general` | ✅ | TBD | Account settings |
| `/dashboard/security` | ✅ | TBD | Security settings |
| `/continuation-choice` | ✅ | TBD | Post-demo flow |
| `/mobile-onboarding-choice` | ✅ | TBD | Mobile entry choice |

---

## 🔗 Dependencies & Navigation

### Entry Points
- **Anonymous User** → `/landing` or `/mobile-landing` → `/parcel/summary` → `/continuation-choice` → Either anonymous explore OR `/sign-in`
- **Return User** → `/sign-in` → `/dashboard-main-page`
- **Pricing Shopper** → `/pricing` → `/sign-in` (on CTA click) → Checkout

### Within Dashboard
- **Hub** `/dashboard-main-page` → Sidebar navigation
  - → `/dashboard/activity`
  - → `/dashboard/reports`
  - → `/dashboard/general` (settings)
  - → `/dashboard/security` (settings)

### Report Detail Flow
- `/dashboard/reports` → Click report → `/dashboard/reports/[id]` [if entitled]
- `/dashboard/reports/[id]` → Click share → `/dashboard/reports/[id]/share` [if entitled]
- `/dashboard/reports/[id]/share` → Generate token → Copy link → Send

### Sharing Access
- External user → `/shared/[token]` → View report (no auth needed)

---

## 📱 Mobile-Specific Routes

| Route | Desktop | Mobile | Variant |
|-------|---------|--------|---------|
| `/landing` | ✅ | ✅ | Responsive |
| `/mobile-landing` | ❌ | ✅ | Mobile-only |
| `/mobile-onboarding-choice` | ⚠️ Works | ✅ | Mobile-optimized |
| `/pricing` | ✅ | ✅ | Responsive |
| `/parcel/summary` | ✅ | ✅ | Responsive (map scrollable) |
| `/dashboard/*` | ✅ | ✅ | Responsive (sidebar → mobile nav) |

---

## 🎯 Next Steps for Testing

1. **Enumerate Page Components** — For each page, list which components compose it
2. **Create Page Routes** — Ensure all routes in this list are implemented
3. **Test Feature Gating** — Verify CCP-05 entitlements work on gated pages
4. **Mobile Testing** — Test responsive behavior on all pages
5. **E2E Testing** — Create test suites for each user flow

---

**Document Version:** 1.0  
**Created:** January 6, 2026  
**Purpose:** High-level page enumeration distinct from component inventory
