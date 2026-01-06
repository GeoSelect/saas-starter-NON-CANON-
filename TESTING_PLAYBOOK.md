# Testing Playbook - User Journey Systematic Flow

**Date:** January 6, 2026  
**Purpose:** Step-by-step testing guide for all pages and user journeys  
**Status:** Ready for Testing (Dev Server Running on port 3000)

---

## 🎯 Quick Start

**Dev Server:** `http://localhost:3000`  
**Status:** ✅ Running with demo mode support

---

## 📋 Test Execution Checklist

### Phase 1️⃣: Unauthenticated User Journey (NOT SIGNED IN)

#### Test 1.1: Landing Page - Not Authenticated
```
URL: http://localhost:3000/parcels/page/1?demo=not-signed-in
Expected Behavior:
  ✓ Sign-in screen displays
  ✓ Email/password form visible
  ✓ "Sign Up" link present
  ✓ Social OAuth buttons visible (if configured)
  ✓ No dashboard content shown
  ✓ No sidebar or workspace selector
Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

#### Test 1.2: Pricing Page - Anonymous Access
```
URL: http://localhost:3000/dashboard/pricing
Expected Behavior:
  ✓ Pricing page loads (public, no auth required)
  ✓ 5 pricing cards visible:
    - Basic ($74.99/mo)
    - Pro+ CRM ($199/mo)
    - Pro+ AI ($299/mo)
    - Portfolio ($499/mo)
    - Enterprise (Custom)
  ✓ "Get Started" buttons active
  ✓ Feature lists display correctly
  ✓ Stripe checkout ready (or dev mode disabled)
Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

---

### Phase 2️⃣: Authenticated User - No Workspace

#### Test 2.1: Workspace Selection Screen
```
URL: http://localhost:3000/parcels/page/1?demo=no-workspace
Expected Behavior:
  ✓ Workspace selection/creation screen displays
  ✓ "Create Workspace" form visible if no workspaces
  ✓ Workspace name input field present
  ✓ Workspace description field present
  ✓ "Create" button active
  ✓ Onboarding messaging clear
  ✓ User appears authenticated (no sign-in prompt)
Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

---

### Phase 3️⃣: Authenticated User WITH Workspace - Full Dashboard Access

#### Test 3.1: Dashboard - Parcels Page (Authenticated)
```
URL: http://localhost:3000/parcels/page/1?demo=authenticated
Expected Behavior:
  ✓ Dashboard layout loads
  ✓ Sidebar visible with workspace selector
  ✓ Navigation menu present
  ✓ Parcels list displays (mock data)
  ✓ Pagination controls visible (Previous/Next)
  ✓ Search functionality present
  ✓ Parcel cards show: name, address, status
  ✓ No paywall visible (demo unlocks all features)
Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

#### Test 3.2: Custom Workspace Demo
```
URL: http://localhost:3000/parcels/page/1?demo=authenticated&workspace=my-custom-workspace
Expected Behavior:
  ✓ Same as Test 3.1
  ✓ Workspace ID in URL: "my-custom-workspace"
  ✓ Workspace selector shows custom name
  ✓ All data context-aware
Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

---

### Phase 4️⃣: Feature Access & Entitlements (C046 UnlockDetails Gating)

#### Test 4.1: Analytics Page (ccp-03:report-generation)
```
URL: http://localhost:3000/dashboard/analytics?demo=authenticated
Expected Behavior - FREE TIER:
  ⚠ [FUTURE] UnlockDetails paywall shows
  ✓ Feature name: "Advanced Analytics"
  ✓ Current tier: Free
  ✓ Required tier: Pro
  ✓ "Upgrade Now" button visible
  ✓ Alternative: "Learn More" button

Expected Behavior - PRO TIER (when entitlements active):
  ✓ Analytics dashboard displays
  ✓ Charts/graphs visible
  ✓ Report builder interface
  ✓ No paywall blocking content

Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

#### Test 4.2: Branded Reports List (ccp-06:branded-reports)
```
URL: http://localhost:3000/dashboard/branded-reports?demo=authenticated
Expected Behavior - FREE TIER:
  ⚠ [FUTURE] UnlockDetails paywall shows
  ✓ Feature: "Branded Reports"
  ✓ Locked behind Pro tier
  ✓ Upgrade path clear

Expected Behavior - PRO TIER:
  ✓ List of branded reports displays
  ✓ Search/filter controls visible
  ✓ "Create New" button active
  ✓ Edit/Delete actions per report
  ✓ Pagination (if 100+ reports)

Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

#### Test 4.3: Branded Reports - Detail Page
```
URL: http://localhost:3000/dashboard/branded-reports/[id]?demo=authenticated
Expected Behavior - FREE TIER:
  ⚠ [FUTURE] UnlockDetails paywall shows

Expected Behavior - PRO TIER:
  ✓ Report editor loads
  ✓ Branding customizer visible
  ✓ Save button active
  ✓ Preview panel shows changes live

Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

#### Test 4.4: Branded Reports - Create Page
```
URL: http://localhost:3000/dashboard/branded-reports/new?demo=authenticated
Expected Behavior - FREE TIER:
  ⚠ [FUTURE] UnlockDetails paywall shows

Expected Behavior - PRO TIER:
  ✓ Creation form displays
  ✓ Name/description inputs
  ✓ "Create" button triggers API call
  ✓ Redirect to detail page on success

Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

#### Test 4.5: CRM Hub (ccp-09:crm-sync)
```
URL: http://localhost:3000/dashboard/crm?demo=authenticated
Expected Behavior - FREE TIER:
  ⚠ [FUTURE] UnlockDetails paywall shows
  ✓ Feature: "CRM Sync"
  ✓ Required tier: Pro+ CRM
  ✓ "Upgrade Now" button visible

Expected Behavior - PRO+ CRM TIER:
  ✓ CRM dashboard displays
  ✓ Connection status visible (Salesforce, HubSpot, Pipedrive)
  ✓ Sync logs tab
  ✓ Field mapping interface
  ✓ Webhook configuration

Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

#### Test 4.6: Workflows (ccp-09:crm-sync)
```
URL: http://localhost:3000/dashboard/workflows?demo=authenticated
Expected Behavior - FREE TIER:
  ⚠ [FUTURE] UnlockDetails paywall shows

Expected Behavior - PRO+ CRM TIER:
  ✓ Workflow builder loads
  ✓ Canvas area for drag-drop
  ✓ Trigger templates visible
  ✓ Action nodes available
  ✓ Save workflow button

Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

#### Test 4.7: Export (ccp-15:export-workspace)
```
URL: http://localhost:3000/dashboard/export?demo=authenticated
Expected Behavior - FREE TIER:
  ⚠ [FUTURE] UnlockDetails paywall shows
  ✓ Feature: "Data Export"
  ✓ Required tier: Pro+
  ✓ "Upgrade Now" button visible

Expected Behavior - PRO+ TIER:
  ✓ Export format selector
  ✓ Options: CSV, JSON, Parquet
  ✓ Filter/date range controls
  ✓ "Export" button triggers download
  ✓ Progress indicator for large exports

Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

#### Test 4.8: Audit Logs (Admin Only - No C046)
```
URL: http://localhost:3000/dashboard/audit-logs?demo=authenticated
Expected Behavior - NON-ADMIN:
  ❌ [FUTURE] 403 Forbidden error
  ✓ Message: "Admin access required"
  ✓ No data visible

Expected Behavior - ADMIN/OWNER:
  ✓ Audit logs table displays
  ✓ Columns: timestamp, user, action, resource, status
  ✓ Filters: date range, user, action type
  ✓ "Blocked Access" tab shows C046 audit entries
  ✓ Read-only interface (no edit/delete)

Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

---

## 🔄 State Transition Tests

### Tier Upgrade Flow
```
Scenario: User upgrades from Free → Pro
Steps:
  1. Start on parcels page (free tier): /parcels/page/1?demo=authenticated
  2. Try to access /dashboard/analytics
  3. See UnlockDetails paywall
  4. Click "Upgrade Now" → redirects to /dashboard/pricing?feature=ccp-03
  5. Click "Get Started" on Pro plan
  6. [Stripe checkout simulation]
  7. Return to app → entitlements updated
  8. Navigate back to /dashboard/analytics
  9. Verify: Analytics dashboard now accessible ✓

Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

### Feature Flag Toggle
```
Scenario: C046 UnlockDetails shows/hides based on entitlements
Steps:
  1. With free tier: /dashboard/analytics shows paywall
  2. Grant ccp-03 entitlement (admin update)
  3. Refresh page
  4. Analytics content now visible
  5. Remove entitlement
  6. Refresh page
  7. Paywall re-appears ✓

Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

---

## 🧪 Edge Cases & Error States

### Test E.1: Missing Workspace
```
URL: http://localhost:3000/parcels/page/1?demo=authenticated&workspace=nonexistent
Expected: 
  ✓ Handle gracefully (show selection screen or 404)
  ✓ No console errors
  ✓ User can navigate away safely

Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

### Test E.2: Invalid Page Number
```
URL: http://localhost:3000/parcels/page/999?demo=authenticated
Expected:
  ✓ Show empty state or last valid page
  ✓ Pagination controls disabled appropriately
  ✓ No crash

Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

### Test E.3: Network Error Handling
```
Steps:
  1. Open DevTools Network tab
  2. Simulate offline: Network tab → Throttling → Offline
  3. Try to navigate to authenticated page
  4. Expected: Graceful error message or loading state
  5. Re-enable network
  6. Page loads normally

Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

### Test E.4: Concurrent Workspace Switch
```
Steps:
  1. Load /parcels/page/1?demo=authenticated&workspace=ws-1
  2. Immediately change URL to workspace=ws-2
  3. Expected: Smooth transition, no race conditions
  4. Verify: Correct workspace data loads

Status: [ ] Pass [ ] Fail [ ] Pending
Notes: _________________________________
```

---

## 📊 Demo Mode URL Reference

### Single Page Tests
```
# Authentication states
http://localhost:3000/parcels/page/1?demo=not-signed-in
http://localhost:3000/parcels/page/1?demo=no-workspace
http://localhost:3000/parcels/page/1?demo=authenticated

# Custom workspace
http://localhost:3000/parcels/page/1?demo=authenticated&workspace=custom-ws-id

# Pagination
http://localhost:3000/parcels/page/2?demo=authenticated
http://localhost:3000/parcels/page/3?demo=authenticated
```

### Feature Access Tests
```
# Locked features (C046 paywall expected)
http://localhost:3000/dashboard/analytics?demo=authenticated
http://localhost:3000/dashboard/branded-reports?demo=authenticated
http://localhost:3000/dashboard/crm?demo=authenticated
http://localhost:3000/dashboard/workflows?demo=authenticated
http://localhost:3000/dashboard/export?demo=authenticated

# Admin only
http://localhost:3000/dashboard/audit-logs?demo=authenticated

# Public (no auth needed)
http://localhost:3000/dashboard/pricing
```

---

## 🎨 Visual Regression Tests

### Layout Consistency
- [ ] Sidebar width consistent across all pages
- [ ] Header height consistent
- [ ] Content padding uniform
- [ ] Mobile responsive (test at 375px, 768px, 1024px widths)

### Component Styling
- [ ] Buttons have correct hover states
- [ ] Links properly underlined/styled
- [ ] Form inputs have proper focus states
- [ ] Loading spinners animate smoothly
- [ ] Toast notifications positioned correctly
- [ ] Modals have proper backdrop/overlay

### Accessibility
- [ ] Tab order logical
- [ ] Form labels associated with inputs
- [ ] Alt text on images
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works (no trap)

---

## 🔍 Browser DevTools Checklist

### Console (F12 → Console tab)
- [ ] No red errors
- [ ] No unhandled promise rejections
- [ ] No 404 resource loads (except intentional)
- [ ] Auth tokens not logged

### Network (F12 → Network tab)
- [ ] All XHR calls complete successfully
- [ ] No 5xx errors from API
- [ ] Asset loading < 2s total
- [ ] Images optimized (no oversized assets)

### Performance (F12 → Performance tab)
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 3s
- [ ] Cumulative Layout Shift < 0.1

### Application (F12 → Application tab)
- [ ] Cookies set correctly (HttpOnly for auth)
- [ ] LocalStorage has expected values
- [ ] No sensitive data in storage

---

## ✅ Sign-Off Checklist

### Phase 1 - Not Signed In
- [ ] Sign-in screen displays correctly
- [ ] Pricing page accessible without auth
- [ ] No protected content visible
- [ ] Navigation clear and intuitive

### Phase 2 - Workspace Selection
- [ ] Workspace selection UI appears
- [ ] User can create new workspace
- [ ] User can select from existing workspaces
- [ ] Transition to authenticated state smooth

### Phase 3 - Authenticated
- [ ] Dashboard loads all content
- [ ] Sidebar navigation works
- [ ] Workspace selector functional
- [ ] Pagination controls work
- [ ] Search/filter functional

### Phase 4 - Feature Gating (C046)
- [ ] UnlockDetails paywall displays for locked features
- [ ] Feature descriptions clear and compelling
- [ ] Upgrade paths visible
- [ ] No content leakage (locked features invisible)
- [ ] Pro/Pro+ content accessible when entitled

### Phase 5 - Admin Features
- [ ] Audit logs visible to admins only
- [ ] Non-admins see appropriate 403 error
- [ ] Audit data searchable and filterable
- [ ] Timestamps and user info correct

---

## 📝 Test Results Log

### Session 1: [Date]
```
Tester: _______________
Duration: ___ minutes
Tests Passed: ___ / ___
Tests Failed: ___ / ___
Blockers: 
  - ________________________
  - ________________________

Notes:
________________________
________________________
```

### Session 2: [Date]
```
[Same format as above]
```

---

## 🚀 Next Steps After Testing

1. **If All Tests Pass:**
   - ✅ Mark demo mode as ready for stakeholder review
   - ✅ Create test evidence document (screenshots)
   - ✅ Plan real auth integration (Phase 2)

2. **If Tests Fail:**
   - 🔧 Log issues in separate document
   - 🔧 Prioritize by severity (blocker/major/minor)
   - 🔧 Create GitHub issues for each
   - 🔧 Assign to dev queue for fixes

3. **Real Auth Integration (Future):**
   - [ ] Replace demo mode with actual Supabase auth
   - [ ] Test email/password sign-in
   - [ ] Test OAuth (Google, GitHub)
   - [ ] Test password reset flow
   - [ ] Test session persistence
   - [ ] Test logout flow

4. **Production Readiness:**
   - [ ] Performance optimization
   - [ ] Security audit
   - [ ] Accessibility audit (WCAG AA)
   - [ ] Load testing (concurrent users)
   - [ ] Error handling & fallbacks
   - [ ] Monitoring & logging setup

---

**Document Version:** 1.0  
**Created:** January 6, 2026  
**Maintainer:** QA Team  
**Ready for Testing:** ✅ YES (Dev Server Running)

