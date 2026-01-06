# Pages Enumeration: Implementation Checklist

**Last Updated:** January 6, 2026  
**Purpose:** Detailed implementation plan for pagination, page routing, entitlements, and audit trails  
**Status:** Planning → Ready for Implementation  
**Related:** [PAGES.md](PAGES.md) (high-level route enumeration)

---

## 📋 Implementation Phases

### Phase 0: Type Definitions & Contracts (Pre-Req)
### Phase 1: Route Patterns & Server Validation
### Phase 2: UI Components & Client-Side
### Phase 3: Testing (Unit, E2E, Accessibility)
### Phase 4: Documentation & Audit

---

## 🔷 Phase 0: Type Definitions & Contracts

**Deliverable:** `lib/contracts/pages.ts`  
**Owner:** Type Safety Lead  
**Dependencies:** None  
**Blocking:** Phases 1, 2, 3

### Task 0.1: Define Page Contracts
- [ ] **File:** Create `lib/contracts/pages.ts`
- [ ] **Types to Define:**
  ```typescript
  // Pagination metadata
  interface PageMetadata {
    resourceId: string;      // Workspace ID, report ID, etc.
    pageNumber: number;      // Current page (1-indexed)
    totalPages: number;      // Total pages available
    pageSize: number;        // Items per page (default: 20)
    sortBy?: 'date' | 'name' | 'modified'; // Sort column
    sortOrder?: 'asc' | 'desc';           // Sort direction
  }

  // Step/wizard state
  interface StepMetadata {
    resourceId: string;      // Wizard session ID
    stepName: string;        // Step identifier (e.g., 'branding', 'content', 'preview')
    stepNumber: number;      // Sequence number (1-indexed)
    totalSteps: number;      // Total steps in wizard
    isComplete: boolean;     // Has step been saved/validated?
  }

  // Snapshot for state restoration
  interface SnapshotMetadata {
    resourceId: string;      // What this snapshot is for
    snapshotHash: string;    // SHA-256 of state (for cache validation)
    createdAt: Date;        // When snapshot was created
    expiresAt: Date;        // Cache expiration
    userId: string;         // Who created it
  }

  // Combined page state
  interface PageState {
    metadata: PageMetadata | StepMetadata;
    snapshot?: SnapshotMetadata;
    entitlement?: {
      feature: string;      // Feature ID (ccp-06:branded-reports, etc.)
      allowed: boolean;     // Is this page accessible?
      reason?: string;      // Why denied (if applicable)
    };
  }
  ```

- [ ] **Export:** 
  - Type definitions (above)
  - Constants: `DEFAULT_PAGE_SIZE = 20`, `SNAPSHOT_CACHE_TTL = 3600`
  - Validators: `isValidPageNumber(page, total)`, `isValidStepName(name)`

### Task 0.2: Define Route Param Types
- [ ] **Extend `lib/contracts/pages.ts`:**
  ```typescript
  // Dynamic route parameters
  interface PageRouteParams {
    resourceId: string;      // [workspace_id], [report_id], [session_id]
    pageNum?: string;        // [pageNum] (optional, dynamic)
    stepNum?: string;        // [stepNum] (optional, dynamic)
  }

  // Query string parameters
  interface PageQueryParams {
    sort?: string;           // Sort column
    order?: 'asc' | 'desc';
    limit?: string;          // Items per page
    offset?: string;         // Pagination offset
    search?: string;         // Search filter
  }
  ```

- [ ] **Export Zod schemas** for validation:
  ```typescript
  export const PageMetadataSchema = z.object({
    resourceId: z.string().uuid(),
    pageNumber: z.number().int().positive(),
    totalPages: z.number().int().positive(),
    ...
  });
  ```

---

## 🔷 Phase 1: Route Patterns & Server Validation

**Deliverable:** Dynamic routes + API handlers  
**Owner:** Backend/Routing Lead  
**Dependencies:** Phase 0  
**Blocking:** Phase 2

### Task 1.1: Create Dynamic Route Patterns
- [ ] **Pattern 1: Paginated List Routes**
  - Route: `/dashboard/reports`
  - Variant: `/dashboard/reports?page=2&sort=modified&order=desc`
  - Dynamic: `/dashboard/reports/[pageNum]` (optional, for deep linking)
  - File: `app/(dashboard)/reports/page.tsx` + optional `[pageNum]/page.tsx`

- [ ] **Pattern 2: Paginated Detail Routes**
  - Route: `/dashboard/reports/[id]`
  - Variant: `/dashboard/reports/[id]/share?page=1`
  - Dynamic: `/dashboard/reports/[id]/share/[pageNum]` (if multi-page sharing)
  - File: `app/(dashboard)/reports/[id]/share/page.tsx`

- [ ] **Pattern 3: Wizard/Step Routes**
  - Route: `/dashboard/branded-reports/new`
  - Steps: `/dashboard/branded-reports/new/step/[stepNum]` (e.g., `step/1`, `step/2`)
  - File: `app/(dashboard)/branded-reports/new/step/[stepNum]/page.tsx`

- [ ] **Pattern 4: Shared Reports with Pagination**
  - Route: `/shared/[token]`
  - Variant: `/shared/[token]?page=1`
  - Dynamic: `/shared/[token]/page/[pageNum]`
  - File: `app/shared/[token]/page/[pageNum]/page.tsx`

**Success Criteria:**
- All routes render 200 (no missing pages)
- Dynamic params correctly parsed
- Query string preserved in navigation

### Task 1.2: Implement Server-Side Validation & Entitlements
- [ ] **File:** `lib/services/page-access.ts` (new)
  - Function: `validatePageAccess(resourceId, pageNum, userId, featureId)`
  - Returns: `{ allowed: boolean, reason?: string, canonicalUrl?: string }`
  - Logic:
    1. Verify user owns/can access resource
    2. Check entitlement (if feature-gated)
    3. Validate page number (1 ≤ pageNum ≤ totalPages)
    4. Return 403 or redirect to canonical URL

- [ ] **File:** `lib/services/snapshot-manager.ts` (new)
  - Function: `getSnapshot(resourceId, snapshotHash)`
  - Returns: Cached state or null (if expired/invalid)
  - Function: `saveSnapshot(resourceId, state)`
  - Returns: snapshotHash for URL state preservation

- [ ] **API Route:** `app/api/workspaces/[workspace_id]/pages/validate/route.ts`
  - Endpoint: `POST /api/workspaces/[workspace_id]/pages/validate`
  - Request: `{ resourceId, pageNum, featureId }`
  - Response: `{ allowed: boolean, reason?, canonicalUrl?, nextUrl?, prevUrl? }`
  - Used by: UI for client-side validation before navigation

- [ ] **API Route:** `app/api/workspaces/[workspace_id]/pages/snapshot/route.ts`
  - Endpoint: `POST /api/workspaces/[workspace_id]/pages/snapshot`
  - Request: `{ resourceId, state }`
  - Response: `{ snapshotHash, expiresAt }`
  - Used by: Wizard steps to restore state on back-navigation

### Task 1.3: Implement Canonical Redirects
- [ ] **Middleware:** `lib/middleware/page-redirect.ts` (new)
  - Intercept: Routes with invalid page numbers
  - Action: Redirect `/dashboard/reports/99` → `/dashboard/reports?page=1` (if 99 > totalPages)
  - Logic: Check against canonical page count

- [ ] **Server Component:** Wrap page components to validate before render
  ```typescript
  // app/(dashboard)/reports/page.tsx
  export default async function ReportsPage(props) {
    const { pageNum } = props.params;
    const validation = await validatePageAccess('workspace-1', pageNum, 'user-1', 'ccp-06');
    
    if (!validation.allowed) {
      if (validation.canonicalUrl) {
        redirect(validation.canonicalUrl);
      }
      return <AccessDenied reason={validation.reason} />;
    }
    
    return <ReportsListPage pageNum={pageNum} />;
  }
  ```

**Success Criteria:**
- Invalid page numbers redirect to canonical URL
- Entitlements checked before rendering
- 403 returned (not 404) for denied access
- API validates and returns next/prev URLs

---

## 🔷 Phase 2: UI Components & Client-Side

**Deliverable:** Reusable pagination/stepper components  
**Owner:** Frontend Lead  
**Dependencies:** Phase 0, 1  
**Blocking:** Phase 3

### Task 2.1: Create PageNumber Component
- [ ] **File:** `components/pagination/PageNumber.tsx`
  - Props: `{ currentPage, totalPages }`
  - Renders: "Page X of Y"
  - Styling: Badge or label
  - Example:
    ```tsx
    <PageNumber currentPage={2} totalPages={5} />
    // → "Page 2 of 5"
    ```

- [ ] **File:** `components/pagination/PageNavigation.tsx`
  - Props: `{ currentPage, totalPages, onPageChange, disabled?, isLoading? }`
  - Renders: Previous button, PageNumber, Next button
  - Behavior:
    - Disable Previous on page 1
    - Disable Next on final page
    - Call `onPageChange(newPage)` on click
    - Show loading state during transition

- [ ] **File:** `components/pagination/PaginationInfo.tsx`
  - Props: `{ from, to, total }`
  - Renders: "Showing 1-20 of 100 items"

**Success Criteria:**
- Components render correctly
- Navigation buttons disabled appropriately
- Accessible (aria-labels, keyboard support)

### Task 2.2: Create ProgressStepper Component
- [ ] **File:** `components/wizard/ProgressStepper.tsx`
  - Props: `{ steps: Step[], currentStep: number }`
  - Interface Step: `{ name, title, icon?, isComplete? }`
  - Renders: Horizontal/vertical step indicator
  - Features:
    - Visual indicator of current step
    - Show completed steps with checkmark
    - Disabled steps (not reached yet)
    - Tooltips on hover
  - Accessibility: aria-current="step", semantic HTML

- [ ] **File:** `components/wizard/StepIndicator.tsx`
  - Props: `{ step, isActive, isComplete }`
  - Renders: Single step in progress stepper
  - Styling: Color-coded (active=blue, complete=green, disabled=gray)

**Success Criteria:**
- Steppers render all steps
- Current step highlighted
- Completed steps marked
- Keyboard accessible

### Task 2.3: Create Back/Next Controls (Wizard Navigation)
- [ ] **File:** `components/wizard/WizardNavigation.tsx`
  - Props: `{ currentStep, totalSteps, onBack, onNext, onSave?, nextLoading?, backDisabled? }`
  - Renders: Back button, [Save & Continue button], Next button
  - Behavior:
    - Back: Disabled on step 1
    - Next: Disabled on final step
    - Save: Optional (for persist-before-next)
    - Confirm on last step: "Complete" instead of "Next"
  - Example:
    ```tsx
    <WizardNavigation 
      currentStep={1} 
      totalSteps={3}
      onBack={() => router.back()}
      onNext={() => moveToStep(2)}
      onSave={() => saveFormData()}
    />
    ```

- [ ] **File:** `components/wizard/StepContent.tsx`
  - Props: `{ step, children, isLoading? }`
  - Renders: Wrapper with step info + content
  - Transitions: Fade/slide animation on step change (optional)

**Success Criteria:**
- Navigation buttons functional
- Save handler called before next
- Loading states shown
- Keyboard accessible (Tab order, Enter to submit)

### Task 2.4: EntitlementGate Integration
- [ ] **Update:** `components/EntitlementGate.tsx` (if exists) or create wrapper
  - **Use Case:** Gate paginated/wizard content
  - Props: `{ feature, children, fallback }`
  - Logic:
    ```tsx
    if (!can(feature)) {
      return fallback || <UnlockDetails feature={feature} />;
    }
    return children;
    ```

- [ ] **Integration in Page:** Wrap pagination controls
  ```tsx
  <EntitlementGate feature="ccp-06:branded-reports">
    <PageNavigation currentPage={page} ... />
  </EntitlementGate>
  ```

- [ ] **Integration in Wizard:** Gate specific steps
  ```tsx
  <ProgressStepper steps={steps.map((s) => ({
    ...s,
    isDisabled: !can('ccp-06:branded-reports'),
  }))} />
  ```

**Success Criteria:**
- Paywalled pages show unlock UI
- Gated steps visually disabled
- Proper fallback rendering

---

## 🔷 Phase 3: Testing (Unit, E2E, Accessibility)

**Deliverable:** Comprehensive test suite  
**Owner:** QA Lead  
**Dependencies:** Phases 1, 2  
**Blocking:** Phase 4

### Task 3.1: Unit Tests for Route Validation

**File:** `tests/services/page-access.test.ts`

- [ ] **Test:** `validatePageAccess()` with valid params
  - Given: resourceId, pageNum=1, userId, feature
  - When: User has entitlement
  - Then: Returns `{ allowed: true }`

- [ ] **Test:** `validatePageAccess()` with invalid pageNum
  - Given: pageNum=99 but totalPages=5
  - When: Validation called
  - Then: Returns `{ allowed: true, canonicalUrl: '?page=5' }`

- [ ] **Test:** `validatePageAccess()` with denied entitlement
  - Given: feature='ccp-06', user tier='free'
  - When: Validation called
  - Then: Returns `{ allowed: false, reason: 'TIER_INSUFFICIENT' }`

- [ ] **Test:** Snapshot hash validation
  - Given: snapshotHash, state
  - When: Hash recomputed
  - Then: Matches original (deterministic)

**Success Criteria:**
- 100% coverage on `page-access.ts`
- All edge cases tested
- Mock entitlement checks

### Task 3.2: Component Unit Tests

**File:** `tests/components/pagination.test.tsx`

- [ ] **Test:** `PageNumber` component
  - Props: currentPage=2, totalPages=5
  - Expect: Renders "Page 2 of 5"

- [ ] **Test:** `PageNavigation` component
  - Props: currentPage=1, totalPages=3
  - Action: Click "Next"
  - Expect: `onPageChange(2)` called

- [ ] **Test:** `ProgressStepper` component
  - Props: 3 steps, currentStep=2
  - Expect: Step 2 highlighted, step 1 marked complete, step 3 disabled

**Success Criteria:**
- All components render correctly
- Props update re-render appropriately
- Event handlers called on user actions

### Task 3.3: E2E Tests for Deep Linking

**File:** `e2e/pagination.spec.ts` (Playwright)

- [ ] **Test:** Paginated list deep link
  - Navigate: `http://localhost:3000/dashboard/reports?page=2`
  - Expect: Page 2 loads with correct data
  - Expect: "Page 2 of 5" displayed

- [ ] **Test:** Invalid page number redirect
  - Navigate: `http://localhost:3000/dashboard/reports?page=99`
  - Expect: Redirects to `?page=5` (canonical)

- [ ] **Test:** Wizard step deep link
  - Navigate: `http://localhost:3000/dashboard/branded-reports/new/step/2`
  - Expect: Step 2 renders with previous step data restored

- [ ] **Test:** Entitlement gate on paginated page
  - User: Free tier
  - Navigate: `http://localhost:3000/dashboard/reports/[id]` (gated: ccp-06)
  - Expect: UnlockDetails shown, pagination hidden

- [ ] **Test:** Page navigation flow
  - Load: Page 1
  - Click: Next
  - Expect: URL changes to `?page=2`
  - Expect: Content updated

**Success Criteria:**
- All deep links work
- Invalid pages redirect
- Entitlements enforced
- Browser back/forward work

### Task 3.4: Accessibility Tests

**File:** `e2e/pagination-a11y.spec.ts` (Playwright with axe)

- [ ] **Test:** Keyboard navigation (Tab through pagination)
  - Start: Focus on page 1
  - Tab: Focus on "Next" button
  - Tab: Focus on page 2
  - Tab: Focus on page 3
  - Expected: Tab order logical

- [ ] **Test:** Screen reader announcements
  - Element: PageNumber component
  - Expected: Announces "Page 2 of 5"
  - Element: PageNavigation "Next" button
  - Expected: Announces "Next page" or similar

- [ ] **Test:** Focus management on page change
  - Action: Click "Next"
  - Expected: Focus returned to page content (not lost)

- [ ] **Test:** Keyboard shortcuts
  - Implement: Left/Right arrow to previous/next page (optional)
  - Expected: Works when focus on pagination

- [ ] **Test:** Color contrast
  - Check: Pagination buttons, stepper indicators
  - Expected: WCAG AA compliant (4.5:1 for text)

**Success Criteria:**
- All accessibility tests pass (axe, Pa11y)
- Keyboard navigation works
- Screen reader announces pagination state
- Focus management correct

---

## 🔷 Phase 4: Documentation & Audit

**Deliverable:** Updated docs, audit fields, capability matrix  
**Owner:** Tech Writing Lead  
**Dependencies:** Phases 1-3

### Task 4.1: Update `docs/capabilities.md`

- [ ] **Add Section:** "Page & Pagination Patterns"
  - Patterns: List pagination, step wizards, deep linking
  - Supported routes: List all from PAGES.md
  - Example URLs:
    - `/dashboard/reports?page=2&sort=modified`
    - `/dashboard/branded-reports/new/step/2`
    - `/shared/[token]/page/3`

- [ ] **Add Section:** "Entitlements on Paginated Pages"
  - Explain: How feature gates work on multi-page content
  - Example: Free tier sees "Page 1 of 3" but button to page 2 locked
  - Rules: Entire resource gated vs. individual pages

- [ ] **Add Section:** "State Preservation"
  - Explain: Snapshot hashing, snapshot TTL, state restoration
  - Use case: Back button restores form state in wizard
  - Limitations: Snapshots expire in 1 hour

### Task 4.2: Update `docs/master-components.md`

- [ ] **Add Component Docs:**
  - `PageNumber` — Props, usage, examples
  - `PageNavigation` — Props, behavior, customization
  - `ProgressStepper` — Step definition, styling, theming
  - `WizardNavigation` — Props, step lifecycle, save handlers

- [ ] **Add Section:** "URL Conventions"
  - Query string params: `?page=N`, `?sort=column`, `?order=asc|desc`
  - Dynamic params: `/[pageNum]`, `/step/[stepNum]`
  - Canonical URLs: Always prefer query strings over dynamic routes

- [ ] **Add Section:** "Pagination Best Practices"
  - Do: Use query strings for page/sort filters
  - Don't: Encode page state in URL (use snapshots instead)
  - Do: Show total pages + current page
  - Don't: Lazy-load too many items per page (performance)

### Task 4.3: Add Audit Fields to Database

- [ ] **Migration:** Add audit columns to relevant tables
  - Tables: `reports`, `branded_reports`, `wizard_sessions`
  - Columns:
    ```sql
    viewed_pages INTEGER DEFAULT 0,      -- Pages visited in session
    last_page_viewed INTEGER,            -- Last page number viewed
    viewed_at TIMESTAMP,                 -- When last viewed
    deep_link_source VARCHAR,            -- How user arrived (URL, email, etc.)
    ```

- [ ] **API Logging:** Track page accesses
  - Log: User, resourceId, pageNum, timestamp, IP
  - Use: For analytics, audit trail, user journey tracking

- [ ] **Analytics:** Dashboard metrics
  - Metric: Average pages per session
  - Metric: Most-viewed pages (% of users viewing page 2, 3, etc.)
  - Metric: Deep link conversion (users arriving via deep link vs. navigation)

### Task 4.4: Create URL Convention Reference

**File:** `docs/URL-CONVENTIONS.md` (new)

- [ ] **Section:** "Page & Pagination URL Patterns"
  ```
  Pattern: /[resource-type]/[resource-id]?page=N&sort=column&order=asc
  
  Examples:
  - /dashboard/reports?page=1
  - /dashboard/reports?page=2&sort=modified&order=desc
  - /dashboard/reports/[id]/share?page=1
  - /shared/[token]?page=2
  ```

- [ ] **Section:** "Wizard/Step URL Patterns"
  ```
  Pattern: /[resource-type]/[resource-id]/step/[stepNum]
  
  Examples:
  - /dashboard/branded-reports/new/step/1
  - /dashboard/branded-reports/new/step/2
  - /dashboard/branded-reports/[id]/edit/step/1
  ```

- [ ] **Section:** "Query String Parameters"
  ```
  ?page=N           — Current page (1-indexed)
  ?sort=column      — Sort by column
  ?order=asc|desc   — Sort direction
  ?limit=20         — Items per page (default: 20)
  ?search=query     — Search/filter
  ?snapshot=hash    — Restore saved state
  ```

- [ ] **Section:** "Canonical URL Rules"
  - Always redirect invalid page numbers to last valid page
  - Always redirect missing sort param to default (modified DESC)
  - Always preserve search/filter params on page navigation

---

## ✅ Acceptance Criteria by Phase

### Phase 0 Completion
- [ ] `lib/contracts/pages.ts` created with all types
- [ ] Zod schemas validate all contract types
- [ ] Types exported and usable in phases 1-3

### Phase 1 Completion
- [ ] All route patterns in PAGES.md have corresponding files
- [ ] Server validation implemented for all routes
- [ ] API endpoints return correct response format
- [ ] Invalid pages redirect to canonical URLs
- [ ] Entitlements checked on server (not client)

### Phase 2 Completion
- [ ] All UI components render without errors
- [ ] Pagination/stepper components update on prop changes
- [ ] EntitlementGate works on paginated content
- [ ] Navigation buttons call correct handlers
- [ ] Keyboard navigation works (Tab, Enter, Arrow keys optional)

### Phase 3 Completion
- [ ] Unit tests: 100% coverage on validation logic
- [ ] Component tests: All components render correctly
- [ ] E2E tests: Deep links, redirects, entitlements work
- [ ] A11y tests: Keyboard nav, screen reader, contrast pass
- [ ] No test warnings or errors

### Phase 4 Completion
- [ ] Docs updated with patterns, examples, best practices
- [ ] URL conventions documented
- [ ] Audit fields added to database
- [ ] Analytics dashboard shows page metrics
- [ ] All code comments updated

---

## 🚀 Implementation Timeline

| Phase | Tasks | Est. Duration | Depends On |
|-------|-------|---|---|
| **0** | Type contracts (4 subtasks) | 2-4 hours | None |
| **1** | Routes + validation + API (3 subtasks) | 6-8 hours | Phase 0 |
| **2** | UI components + integration (4 subtasks) | 8-10 hours | Phases 0, 1 |
| **3** | Tests (4 subtasks) | 8-12 hours | Phases 1, 2 |
| **4** | Docs + audit (4 subtasks) | 4-6 hours | All phases |
| **TOTAL** | — | **28-40 hours** | — |

---

## 📊 Checksum Tracking

After each phase, create a summary:

```markdown
## Phase 0 Complete ✅
- Types: 5 interfaces, 8 constants, 3 validators defined
- Contracts: Exported from lib/contracts/pages.ts
- Test: All types validate with Zod schemas

## Phase 1 Complete ✅
- Routes: 4 patterns implemented (list, detail, wizard, sharing)
- API: 2 validation endpoints created
- Validation: 100% of pages validated server-side

## Phase 2 Complete ✅
- Components: 5 new components (PageNumber, PageNav, Stepper, etc.)
- Integration: EntitlementGate works on paginated content
- Accessibility: Basic (will complete in phase 3)

## Phase 3 Complete ✅
- Unit tests: 15 test cases (100% coverage)
- E2E tests: 8 scenarios (deep links, redirects, entitlements)
- A11y tests: 5 tests (keyboard, screen reader, contrast)

## Phase 4 Complete ✅
- Docs: docs/capabilities.md, docs/master-components.md, docs/URL-CONVENTIONS.md
- Audit: Database columns added, logging implemented
- Analytics: Page view metrics available
```

---

**Status:** Ready for Refinement & Implementation  
**Next:** Assign phases to team members, schedule sprints, create detailed subtasks in issue tracker  
**Questions?** See linked PAGES.md for high-level route enumeration, COMPONENT_INVENTORY.md for component tracking
