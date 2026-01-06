# Layout & Shell Components Inventory

**Generated:** January 6, 2026  
**Scope:** AppShell, Navigation, Layout, Header, Footer, and all shell-related components  
**Status:** Comprehensive codebase survey completed

---

## 📋 Executive Summary

### AppShell (C-019 / C001)
- **Status:** ✅ Live & Production
- **Files:** `app/C001-AppShell.tsx`, `lib/context/AppShellContext.tsx`
- **Role:** Root platform container & authentication context provider
- **Purpose:** Single source of truth for account, workspace, and entitlement context

### Navigation Components
- **PublicNavigation** — Top-level navigation for public/authenticated/dashboard routes
- **Header** — Workspace header with user profile & settings
- **BottomNavigation** — Mobile-first primary navigation (bottom bar)
- **Footer** — Global footer with links and brand info

### Design System Status
- **Navigation Components:** ✅ Have Already (5/6 implemented)
- **Layout Integrations:** ✅ Partial (scattered across pages)
- **Component Registry:** ✅ COMPONENT_INVENTORY.md (comprehensive)

---

## 🎯 C-019 AppShell: Complete Specification

### File Locations

| Component | Path | Type | Status |
|-----------|------|------|--------|
| **AppShell Root** | [app/C001-AppShell.tsx](app/C001-AppShell.tsx) | Server Component | ✅ Live |
| **AppShell Context** | [lib/context/AppShellContext.tsx](lib/context/AppShellContext.tsx) | Client Context | ✅ Live |
| **Account Contract** | [lib/contracts/account.ts](lib/contracts/account.ts) | Type Definition | ✅ Live |
| **Workspace Contract** | [lib/contracts/workspace.ts](lib/contracts/workspace.ts) | Type Definition | ✅ Live |
| **Entitlements Contract** | [lib/contracts/entitlements.ts](lib/contracts/entitlements.ts) | Type Definition | ✅ Live |
| **Spec Document** | [docs/C001-APPSHELL-HARDENING.md](docs/C001-APPSHELL-HARDENING.md) | Documentation | ✅ Complete |

### AppShell Architecture

```
app/C001-AppShell.tsx (Server Component)
  └─ Fetches server-side session via getServerSession()
     ├─ Gets authenticated user from Supabase
     ├─ Builds Account object (id, email, roles)
     └─ Provides initial workspace (TODO: fetch default workspace)

AppShellProvider (Client Context)
  ├─ Initial state from server (account, workspace)
  ├─ Refresh mechanism via /api/user endpoint
  ├─ Feature check: can(featureId: FeatureId) -> boolean
  └─ Exports useAppShell() hook for all child components
```

### Core Functions & Contracts

#### Account Contract
```typescript
interface Account {
  id: string;              // UUID from Supabase auth.users.id
  email: string;
  emailVerified: boolean;
  roles: AccountRole[];    // 'admin' | 'owner' | 'member' | 'guest'
  metadata?: {
    displayName?: string;
    profileUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

#### Workspace Contract
```typescript
interface Workspace {
  id: string;              // UUID
  slug: string;            // human-readable, unique per account
  name: string;
  tier: SubscriptionTier;  // 'free' | 'pro' | 'enterprise'
  members: WorkspaceMember[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    defaultParcelView?: 'map' | 'list';
  };
}

interface AnonymousWorkspace {
  id: null;                // For unauthenticated users
}
```

#### Entitlements Contract
```typescript
type FeatureId = string;  // e.g., 'ccp-06:branded-reports'

function can(
  featureId: FeatureId,
  account: Account | null,
  workspace: Workspace | null
): boolean
```

### Context Hook

```typescript
interface AppShellContextValue {
  account: Account | null;
  workspace: Workspace | null;
  loading: boolean;
  error: Error | null;
  can: (featureId: FeatureId) => boolean;
  refresh: () => Promise<void>;
}

// Usage in components
const { account, workspace, can } = useAppShell();
```

### Key Acceptance Criteria (Hardening)

✅ Account resolution: `useAppShell().account` returns `null` or `Account` (never undefined)  
✅ Workspace resolution: `useAppShell().workspace` returns `null`, `Workspace`, or `AnonymousWorkspace`  
✅ Entitlement query: `useAppShell().can(featureId)` returns deterministic boolean  
✅ No split auth: No component fetches workspace/account independently  
✅ Single client fetch: AppShell calls Supabase once at mount  
✅ TypeScript contracts: All types exported from `lib/contracts/`  

---

## 🧭 Navigation Components Inventory

### 1. PublicNavigation (C-001)
| Property | Value |
|----------|-------|
| **Path** | [components/PublicNavigation.tsx](components/PublicNavigation.tsx) |
| **Type** | Client Component (`'use client'`) |
| **Purpose** | Dynamic top-level navigation for public/authenticated/dashboard routes |
| **Status** | ✅ Have Already |
| **Used In** | [app/page.tsx](app/page.tsx) (homepage) |
| **Configuration** | `navigationConfig` object with 3 route groups |
| **Features** | Desktop menu + mobile hamburger, role-based rendering |
| **Dependencies** | `next/navigation`, `next/link`, `lucide-react` |

**Navigation Routes by Context:**
- **Public (unauthenticated):** Home, Explore, Pricing, Docs, Blog, API, Community
- **Authenticated:** Dashboard, Explore, Pricing, Chat, Audit
- **Dashboard:** Home, Parcels, Chat, Details, Audit, Feature Gating, CRM, Settings, Team, Billing

### 2. Header (C-002)
| Property | Value |
|----------|-------|
| **Path** | [components/Header.tsx](components/Header.tsx) |
| **Type** | Client Component |
| **Purpose** | Display workspace name, user profile, settings |
| **Status** | ✅ Have Already |
| **Used In** | Dashboard pages: [app/chat/page.tsx](app/chat/page.tsx), [app/details/page.tsx](app/details/page.tsx), [app/(dashboard)/audit/page.tsx](app/(dashboard)/audit/page.tsx) |
| **Features** | User profile display, workspace context, settings access |
| **Dependencies** | AppShell context |

### 3. Footer (C-003)
| Property | Value |
|----------|-------|
| **Path** | [components/Footer.tsx](components/Footer.tsx) |
| **Type** | Client Component |
| **Purpose** | Global footer with links and brand info |
| **Status** | ✅ Have Already |
| **Used In** | Multiple pages: homepage, chat, details, audit, pricing, documentation |
| **Features** | Links to Home, Pricing, Sign In, Explore, Docs, Support |
| **Dependencies** | `next/link` |

**Import References:**
- [app/page.tsx](app/page.tsx) — Homepage footer
- [app/chat/page.tsx](app/chat/page.tsx) — Dashboard footer
- [app/details/page.tsx](app/details/page.tsx) — Details footer
- [app/(dashboard)/audit/page.tsx](app/(dashboard)/audit/page.tsx) — Audit footer
- [app/(dashboard)/pricing/enhanced-page.tsx](app/(dashboard)/pricing/enhanced-page.tsx) — Pricing footer
- [app/documentation/page.tsx](app/documentation/page.tsx) — Docs footer

### 4. BottomNavigation (C-004)
| Property | Value |
|----------|-------|
| **Path** | [components/BottomNavigation.tsx](components/BottomNavigation.tsx) |
| **Type** | Client Component |
| **Purpose** | Mobile-first primary navigation bar (bottom) |
| **Status** | ✅ Have Already |
| **Used In** | Dashboard pages: [app/chat/page.tsx](app/chat/page.tsx), [app/details/page.tsx](app/details/page.tsx), [app/(dashboard)/audit/page.tsx](app/(dashboard)/audit/page.tsx), [app/workspaces/create/page.tsx](app/workspaces/create/page.tsx) |
| **Features** | Router push buttons for: Parcels, Chat, Details |
| **Mobile Focus** | Fixed bottom positioning, responsive touch targets |
| **Dependencies** | `useRouter` from `next/navigation` |

**Navigation Buttons:**
- Parcels → `/parcels/page/1?demo=authenticated`
- Chat → `/chat?demo=authenticated`
- Details → `/details?demo=authenticated`

---

## 📐 Layout Structure

### Page Composition Patterns

**Pattern 1: Dashboard Pages (with Header + Footer + BottomNav)**
```typescript
// e.g., app/chat/page.tsx
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BottomNavigation } from '@/components/BottomNavigation';

export default function ChatPage() {
  return (
    <div>
      <Header />
      {/* Page Content */}
      <Footer />
      <BottomNavigation />
    </div>
  );
}
```

**Pattern 2: Public Pages (with PublicNav + Footer)**
```typescript
// e.g., app/page.tsx
import { PublicNavigation } from '@/components/PublicNavigation';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <div>
      <PublicNavigation />
      {/* Page Content */}
      <Footer />
    </div>
  );
}
```

**Pattern 3: Pricing Page (custom layout)**
```typescript
// e.g., app/(dashboard)/pricing/page.tsx
import { Footer } from '@/components/Footer';

// Uses enhanced-page.tsx with custom header + Footer
export default function PricingPage() {
  return <EnhancedPricingPage />;
}
```

### Current Page Layouts Audit

| Route | Header | Footer | BottomNav | Layout Type |
|-------|--------|--------|-----------|-------------|
| `/` | PublicNav | ✅ | ❌ | Public Landing |
| `/chat` | ✅ | ✅ | ✅ | Dashboard |
| `/details` | ✅ | ✅ | ✅ | Dashboard |
| `/audit` | ✅ | ✅ | ✅ | Dashboard |
| `/workspaces/create` | ✅ | ❌ | ✅ | Workspace Setup |
| `/pricing` | ❌ (custom) | ✅ | ❌ | Pricing Page |
| `/documentation` | ❌ | ✅ | ❌ | Documentation |
| `/sign-in` | ❌ (custom) | ❌ | ❌ | Auth Form |

---

## 📦 Component Inventory from COMPONENT_INVENTORY.md

### UI Foundation Components (CCP-00)

| ID | Component | Type | Status | Purpose |
|----|-----------|------|--------|---------|
| C-001 | AppShell | Platform Foundation | ✅ Must Have | Workspace orchestration, auth context |
| C-002 | BottomNav | UI Foundation | ✅ Have Already | Mobile-first primary navigation |
| C-003 | BottomNavHome | UI Foundation | ✅ Have Already | Home access from navigation |
| C-012 | BackButton | UX Utility | ✅ Have Already | Navigation utility |
| C-014 | BottomNavHelp | UX Polish | 🎯 Want | Support access |
| C-019 | TopNav | UI Foundation | ✅ Have Already | Global navigation |

### Parcel Flow Components (CCP-01, CCP-02)

| ID | Component | Type | Status | Purpose |
|----|-----------|------|--------|---------|
| C-023 | BottomNavMap | Parcel Flow | ✅ Have Already | Map-first parcel exploration |
| C-024 | BottomNavListView | Parcel Flow | ✅ Have Already | List-based parcel browsing |
| C-025 | BottomNavDetails | UI Foundation | ✅ Have Already | Detail navigation |

### Feature Components (CCP-05, CCP-06, etc.)

| ID | Component | Path | Status | Purpose |
|----|-----------|------|--------|---------|
| C-046 | UnlockDetails | [lib/components/C046-UnlockDetails.tsx](lib/components/C046-UnlockDetails.tsx) | ✅ Have Already | Feature paywall gate |
| C-055 | SubmitButton | [app/(dashboard)/pricing/submit-button.tsx](app/(dashboard)/pricing/submit-button.tsx) | ✅ Have Already | Form submit with loading state |
| C-056 | PricingPage | [app/(dashboard)/pricing/page.tsx](app/(dashboard)/pricing/page.tsx) | ✅ Have Already | Pricing tiers display |
| C-057 | PricingCard | [app/(dashboard)/pricing/enhanced-page.tsx](app/(dashboard)/pricing/enhanced-page.tsx) | ✅ Have Already | Individual pricing plan card |

---

## 🔐 Design System & Documentation

### Component Registry
- **File:** [COMPONENT_INVENTORY.md](COMPONENT_INVENTORY.md)
- **Size:** 640 lines
- **Governance:** "No new component may be implemented without being added to this registry"
- **ID Format:** `C-NNN-CCPXX` (Component#-CCPReference)
- **Categories:** UI Components, Feature Components, Page Components, API Components, Utilities

### AppShell Specifications
- **Hardening Doc:** [docs/C001-APPSHELL-HARDENING.md](docs/C001-APPSHELL-HARDENING.md) (798 lines)
  - Acceptance criteria (machine-checkable)
  - Invariants (must always be true)
  - Contract definitions (Account, Workspace, Entitlements)
  - TypeScript enforcement patterns
  - Task breakdown (Phases 1-4)

### CCP Progress & Gates
- **Assessment:** [docs/CCP-PROGRESS-ASSESSMENT.md](docs/CCP-PROGRESS-ASSESSMENT.md)
- **CCP-00 Status:** 60% Complete (Core working, needs test coverage & gate docs)
- **CCP-05 Status:** 80% Complete (Phase 1 ready for Phase 2 integration)

### Navigation & Layout Documentation
- **UX Journey Map:** [UX_USER_JOURNEY_TREE.md](UX_USER_JOURNEY_TREE.md)
  - Sidebar: Workspace selector, navigation menu
  - Header: Workspace name, user profile, settings
  - BottomNav: Mobile navigation
- **Page Structure:** [PAGES.md](PAGES.md)
  - Responsive layout (sidebar → mobile nav)
  - Deep link support
  - Breadcrumb navigation

---

## 🔗 API & Service Integration

### AppShell Data Fetching

**Server-side (at mount):**
```typescript
// app/C001-AppShell.tsx
async function getServerSession() {
  // Creates Supabase server client
  // Calls auth.getUser()
  // Returns { account, workspace }
}
```

**Client-side refresh:**
```typescript
// lib/context/AppShellContext.tsx
const refresh = async () => {
  const res = await fetch('/api/user', { credentials: 'include' });
  // Updates account & workspace state
}
```

### Related APIs
- **Entitlements:** `/api/workspaces/[workspace_id]/entitlements/[feature]`
- **User Session:** `/api/user`
- **Workspace Active:** `/api/workspace/active`

---

## 🛠️ Tech Stack Summary

### Navigation Components
| Component | Client/Server | Framework | Icons | State |
|-----------|---------------|-----------|-------|-------|
| PublicNavigation | Client | React | lucide-react | useRouter, usePathname |
| Header | Client | React | lucide-react | useAppShell() |
| Footer | Client | React | — | Static links |
| BottomNavigation | Client | React | lucide-react | useRouter |

### Context & Auth
| Module | Type | Purpose |
|--------|------|---------|
| AppShell | Server + Client | Root wrapper, session initialization |
| AppShellContext | React Context | Client-side auth state & hooks |
| useAppShell | Hook | Access account, workspace, entitlements |

---

## ✅ Complete File Paths Summary

### Core Shell Components
```
app/
  ├─ C001-AppShell.tsx .......................... Root AppShell (server component)
  ├─ (dashboard)/
  │  ├─ pricing/
  │  │  ├─ page.tsx ........................... Pricing page wrapper
  │  │  ├─ enhanced-page.tsx .................. Full pricing UI with Footer
  │  │  └─ submit-button.tsx .................. Form submit button
  │  ├─ audit/page.tsx ........................ Audit trail page
  │  └─ branded-reports/ ...................... Branded reports (CCP-06)
  ├─ (login)/sign-in/page.tsx ................. Sign-in form
  ├─ chat/page.tsx ........................... Chat page (Header + Footer + BottomNav)
  ├─ details/page.tsx ........................ Details page (Header + Footer + BottomNav)
  ├─ workspaces/create/page.tsx .............. Workspace creation (Header + BottomNav)
  ├─ page.tsx ............................... Homepage (PublicNav + Footer)
  ├─ documentation/page.tsx .................. Documentation (Footer)
  └─ parcels/page/[pageNum]/page.tsx ........ Parcel list (pagination)

components/
  ├─ Header.tsx ............................. Dashboard header
  ├─ Footer.tsx ............................. Global footer
  ├─ BottomNavigation.tsx ................... Mobile nav bar
  ├─ PublicNavigation.tsx ................... Top-level public/auth/dashboard nav
  └─ ... (100+ other UI components)

lib/
  ├─ context/
  │  └─ AppShellContext.tsx ................. React context provider
  ├─ contracts/
  │  ├─ account.ts ......................... Account shape & validation
  │  ├─ workspace.ts ....................... Workspace shape & validation
  │  └─ entitlements.ts .................... Feature gating contracts
  ├─ components/
  │  ├─ C046-UnlockDetails.tsx ............. Feature paywall
  │  ├─ BrandedReportEditor.tsx ............ Report editor
  │  └─ ... (20+ feature components)
  ├─ hooks/
  │  ├─ useAppShell.ts ..................... Hook to access context
  │  └─ ... (utility hooks)
  └─ services/
     └─ entitlements.ts .................... Entitlement checking logic

docs/
  ├─ C001-APPSHELL-HARDENING.md ............ Full AppShell specification
  ├─ CCP-PROGRESS-ASSESSMENT.md ........... CCP status & progress
  ├─ CCP-00-AUTH-APPSHELL.md .............. Auth specification
  └─ ... (50+ documentation files)
```

---

## 🎯 Key Takeaways

### What Exists ✅
1. **AppShell (C-019)** — Production-ready platform foundation
   - Server-side session initialization
   - Client-side React context with hooks
   - Full TypeScript contracts
   - Comprehensive hardening spec

2. **Navigation System** — 4 components covering all route types
   - PublicNavigation (top-level routing)
   - Header (workspace context)
   - Footer (global links)
   - BottomNavigation (mobile nav)

3. **Component Registry** — Single source of truth
   - COMPONENT_INVENTORY.md with 640+ lines
   - Governance rules enforced
   - ID format: C-NNN-CCPXX

4. **Contracts & Types** — Strict TypeScript enforcement
   - Account, Workspace, Entitlements shapes
   - Validation functions
   - Error handling

### What Needs Integration
1. **Sidebar Component** — Mentioned in docs, not in file list
   - Used by `/dashboard/*` routes
   - Workspace selector + navigation menu
   - Currently inline in pages

2. **Layout Consolidation** — Patterns repeated across pages
   - Header + Footer + BottomNav composition
   - Could benefit from a DashboardLayout wrapper

3. **Test Coverage** — Hardening spec incomplete
   - CCP-00: Needs sentinel tests
   - CCP-05: Phase 2 integration pending
   - AppShell refresh endpoint needs tests

4. **Documentation** — Some gaps in guides
   - Implementation guide for AppShell
   - Merge gate checklist
   - Component extraction patterns

---

## 📊 Statistics

- **Total Navigation Components:** 4 (PublicNav, Header, Footer, BottomNav)
- **Layout Patterns:** 3 main types (Public, Dashboard, Auth)
- **Component Registry Size:** 640 lines
- **Spec Documents:** 798 lines (C001-APPSHELL-HARDENING)
- **Pages Using Header:** 5+
- **Pages Using Footer:** 7+
- **Pages Using BottomNav:** 4+
- **Production Status:** ✅ Live on main branch

