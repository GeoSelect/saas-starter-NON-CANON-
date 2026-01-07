# Route Comparison: Intended vs. Implemented

## Summary
- **Total Intended Routes**: 20
- **Implemented**: 7 ✅
- **Missing**: 13 ❌
- **Extra (Not on List)**: 15+ 🔵

---

## PUBLIC & ENTRY SURFACES

### ✅ Implemented
- `http://localhost:3000/` - Home page (exists as app/page.tsx)
- `http://localhost:3000/landing` - Landing page (exists in app/landing/)
- `http://localhost:3000/mobile-landing` - Mobile landing (exists in app/mobile-landing/page.tsx)
- `http://localhost:3000/pricing` - Pricing page (exists in app/(dashboard)/pricing/enhanced-page.tsx)

### ❌ Missing
- `http://localhost:3000/faq` - FAQ page **NOT FOUND** - needs creation

---

## CORE PRODUCT SURFACES (Launch-Relevant)

### ✅ Implemented
- `http://localhost:3000/parcel/summary` - Parcel details with 3D topo map (fully working)
- `http://localhost:3000/preview/components` - Component showcase (exists)

---

## SHARING & PUBLIC ACCESS

### ❌ Missing (Not Implemented)
- `http://localhost:3000/shared/[token]` - Shared parcel view **NOT IMPLEMENTED**
- `http://localhost:3000/share/[token]` - Public share link **NOT IMPLEMENTED**

---

## AUTHENTICATION & SESSION

### ✅ Implemented
- `http://localhost:3000/sign-in` - Sign in page (exists in app/(login)/sign-in/)

### ❌ Missing
- `http://localhost:3000/auth/callback` - OAuth/auth callback **NOT FOUND**
  - Note: Found references to /choose-plan which may be part of auth flow

---

## DASHBOARD AREA — Authenticated

### ❌ Missing (All Dashboard Routes)
- `http://localhost:3000/dashboard-main-page` - Main dashboard **NOT FOUND**
- `http://localhost:3000/dashboard/activity` - Activity log **NOT FOUND**

### 🔵 Found But Not on List
- `http://localhost:3000/dashboard` - Main dashboard (unknown status)
- `http://localhost:3000/dashboard/crm/import` - CRM import (exists in app/(dashboard)/crm/import/)

---

## REPORTS

### ❌ Missing (All Report Routes)
- `http://localhost:3000/dashboard/reports` - Reports list **NOT FOUND**
- `http://localhost:3000/dashboard/reports/[id]` - Report detail **NOT FOUND**
- `http://localhost:3000/dashboard/reports/[id]/share` - Report share **NOT FOUND**

### 🔵 Found But Not on List
- `http://localhost:3000/dashboard/branded-reports` - Branded reports (referenced but status unknown)
- `http://localhost:3000/dashboard/branded-reports/new` - New report (referenced but status unknown)
- `http://localhost:3000/dashboard/branded-reports/[id]` - Edit report (referenced but status unknown)

---

## SETTINGS & ACCOUNT

### ❌ Missing (All Settings Routes)
- `http://localhost:3000/dashboard/general` - General settings **NOT FOUND**
- `http://localhost:3000/dashboard/security` - Security settings **NOT FOUND**

---

## ONBOARDING & FLOW CONTROL

### ❌ Missing (All Onboarding Routes)
- `http://localhost:3000/continuation-choice` - Continuation choice **NOT FOUND**
- `http://localhost:3000/mobile-onboarding-choice` - Mobile onboarding **NOT FOUND**

### 🔵 Found But Not on List
- `http://localhost:3000/choose-plan` - Plan selection (referenced in /sign-in)
- `http://localhost:3000/workspaces/create` - Workspace creation (exists)

---

## EXTRA ROUTES FOUND IN CODEBASE (Not on Your List)

### 🔵 Additional Routes Discovered
- `/search` - Property search with interactive map (core feature!)
- `/property-search` - Alternative search interface
- `/search/view` - Search view variant
- `/parcel/details` - Parcel detail page
- `/parcel/hoa-packet` - HOA packet page
- `/parcels/page/[pageNum]` - Paginated parcel listing
- `/parcel-resolve` - Mobile parcel resolve (in (mobile) group)
- `/chat` - Chat page
- `/documentation` - Documentation
- `/details` - Details page
- `/all-components` - Component showcase
- `/audit-demo` - Audit demo
- `/audit` - Audit activity
- `/terms` - Terms of service
- `/feature-gating` - Feature matrix

---

## NAVIGATION FLOWS IDENTIFIED IN CODEBASE

### Flow 1: Property Discovery (Most Complete)
```
/ or /mobile-landing 
  → /search (address lookup)
  → /parcel/summary?id={parcelId} (auto-navigates)
  → /parcel/details or /parcel/hoa-packet
```
Status: ✅ **FULLY WORKING**

### Flow 2: Authentication & Signup
```
/ → /sign-up 
  → /choose-plan (NOT FOUND)
  → /pricing
  → /dashboard (unknown)
```
Status: 🟡 **BROKEN** - Missing /choose-plan

### Flow 3: Admin/Workspace
```
/workspaces/create 
  → /parcels/page/1
  → /dashboard/branded-reports (unknown status)
```
Status: 🟡 **PARTIAL** - Create works, reports unknown

---

## PRIORITY RECOMMENDATIONS

### 🔴 CRITICAL (Required for Launch)

1. **Create Missing Public Pages** (Day 1)
   - [ ] `/faq` - FAQ page
   - [ ] `/auth/callback` - Auth callback handler
   - [ ] `/terms` - Terms of service (referenced in /sign-in)

2. **Implement Sharing** (Day 2)
   - [ ] `/share/[token]` - Generate shareable parcel links
   - [ ] `/shared/[token]` - View shared parcel with token

3. **Create Dashboard Structure** (Day 2-3)
   - [ ] `/dashboard-main-page` or `/dashboard` - Main entry point
   - [ ] `/dashboard/activity` - Activity timeline
   - [ ] `/dashboard/general` - General settings
   - [ ] `/dashboard/security` - Security settings

### 🟠 HIGH PRIORITY (Needed for Beta)

4. **Implement Reports System** (Week 1)
   - [ ] `/dashboard/reports` - Reports list
   - [ ] `/dashboard/reports/[id]` - Report detail view
   - [ ] `/dashboard/reports/[id]/share` - Share report
   - [ ] Integrate with existing `/dashboard/branded-reports`

5. **Create Onboarding Flow** (Week 1)
   - [ ] `/continuation-choice` - Navigation after signup
   - [ ] `/mobile-onboarding-choice` - Mobile-specific onboarding
   - [ ] Verify `/choose-plan` flow

6. **Verify/Fix Dashboard Routes** (Week 1)
   - [ ] Test `/dashboard/branded-reports`
   - [ ] Test `/dashboard/branded-reports/[id]`
   - [ ] Test `/dashboard/crm/import`

### 🟡 MEDIUM PRIORITY (Nice to Have)

7. **Optimize Extra Routes** (Week 2)
   - [ ] Verify `/documentation` exists and is complete
   - [ ] Verify `/all-components` works
   - [ ] Test `/parcel-resolve` on mobile
   - [ ] Consider consolidating `/search` and `/property-search`

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Fix Broken Links (2-3 hours)
```
□ Create /faq page
□ Create /auth/callback endpoint
□ Create /terms page
□ Fix /choose-plan link in sign-in
□ Test /sign-up → /choose-plan → /pricing flow
```

### Phase 2: Implement Sharing (4-5 hours)
```
□ Create /share/[token] route
□ Create /shared/[token] route
□ Add share functionality to parcel service
□ Add "Share" button to /parcel/summary
□ Generate and store tokens
□ Verify shared parcels display correctly
```

### Phase 3: Dashboard Foundation (6-8 hours)
```
□ Create /dashboard-main-page
□ Create /dashboard/activity
□ Create /dashboard/general
□ Create /dashboard/security
□ Create navigation between dashboard sections
□ Connect to user authentication
□ Link from /pricing flow
```

### Phase 4: Reports System (8-10 hours)
```
□ Create /dashboard/reports list view
□ Create /dashboard/reports/[id] detail view
□ Create /dashboard/reports/[id]/share endpoint
□ Integrate with branded-reports or consolidate
□ Add report creation flow
□ Add sharing functionality
```

### Phase 5: Onboarding (4-6 hours)
```
□ Create /continuation-choice
□ Create /mobile-onboarding-choice
□ Integrate with signup flow
□ Test complete user journey
□ Add analytics tracking
```

---

## FILE STRUCTURE RECOMMENDATION

```
app/
├── (auth)/
│   ├── auth/
│   │   └── callback/
│   │       └── page.tsx          ← /auth/callback
│   ├── sign-in/
│   │   └── page.tsx              ✅ (exists)
│   └── sign-up/
│       └── page.tsx
├── (public)/
│   ├── faq/
│   │   └── page.tsx              ← /faq (NEW)
│   ├── terms/
│   │   └── page.tsx              ← /terms (NEW)
│   ├── pricing/
│   │   └── page.tsx              ✅ (exists)
│   └── ...
├── (dashboard)/
│   ├── dashboard-main-page/
│   │   └── page.tsx              ← /dashboard-main-page (NEW)
│   ├── dashboard/
│   │   ├── activity/
│   │   │   └── page.tsx          ← /dashboard/activity (NEW)
│   │   ├── reports/
│   │   │   ├── page.tsx          ← /dashboard/reports (NEW)
│   │   │   └── [id]/
│   │   │       ├── page.tsx      ← /dashboard/reports/[id] (NEW)
│   │   │       └── share/
│   │   │           └── page.tsx  ← /dashboard/reports/[id]/share (NEW)
│   │   ├── general/
│   │   │   └── page.tsx          ← /dashboard/general (NEW)
│   │   └── security/
│   │       └── page.tsx          ← /dashboard/security (NEW)
│   ├── branded-reports/
│   │   └── ...                   ✅ (exists - may consolidate with reports)
│   └── crm/
│       └── import/
│           └── page.tsx          ✅ (exists)
├── (mobile)/
│   ├── parcel-resolve/
│   │   └── page.tsx              ✅ (exists)
│   └── mobile-onboarding-choice/
│       └── page.tsx              ← /mobile-onboarding-choice (NEW)
├── onboarding/
│   ├── continuation-choice/
│   │   └── page.tsx              ← /continuation-choice (NEW)
│   └── mobile-onboarding-choice/
│       └── page.tsx              ← /mobile-onboarding-choice (NEW)
├── parcel/
│   ├── summary/
│   │   └── page.tsx              ✅ (exists)
│   ├── details/
│   │   └── page.tsx              ✅ (exists)
│   ├── hoa-packet/
│   │   └── page.tsx              ✅ (exists)
│   └── share/
│       └── [token]/
│           └── page.tsx          ← /share/[token] (NEW)
├── shared/
│   └── [token]/
│       └── page.tsx              ← /shared/[token] (NEW)
├── search/
│   ├── page.tsx                  ✅ (exists - may rename from /search)
│   └── ...
└── ...
```

---

## CURRENT COVERAGE ANALYSIS

| Category | Total | Implemented | Missing | % Complete |
|----------|-------|-------------|---------|-----------|
| Public Entry | 5 | 4 | 1 | 80% |
| Core Product | 2 | 2 | 0 | 100% |
| Sharing | 2 | 0 | 2 | 0% |
| Auth & Session | 2 | 1 | 1 | 50% |
| Dashboard | 2 | 0 | 2 | 0% |
| Reports | 3 | 0 | 3 | 0% |
| Settings | 2 | 0 | 2 | 0% |
| Onboarding | 2 | 0 | 2 | 0% |
| **TOTAL** | **20** | **7** | **13** | **35%** |

---

## ACTION ITEMS

**Immediate** (This Week):
1. Create `/faq` page
2. Create `/auth/callback` endpoint
3. Implement `/share/[token]` and `/shared/[token]`
4. Create basic `/dashboard` structure
5. Verify sign-up flow works end-to-end

**Short Term** (Next 2 Weeks):
1. Build complete dashboard with activity, settings
2. Implement reports system
3. Create onboarding flow
4. Test all user journeys

**Testing**:
- [ ] Verify each route returns 200 status
- [ ] Test navigation between routes
- [ ] Check for broken internal links
- [ ] Validate on mobile and desktop
- [ ] Test with real data
