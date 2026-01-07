# HOA Packet Refactoring Workflow

**Goal:** Align implementation with detailed specifications  
**Scope:** Rename endpoints, add idempotency, normalize parcel refs, expand lib functions  
**Estimated Duration:** 4-6 hours  
**Risk Level:** Medium (breaking API changes, but webhook-based so backwards compatible)

---

## Phase 1: Library Foundation (1-1.5 hours)

**Objective:** Build robust, testable core functions in `lib/hoa-packet.ts`

```
┌─────────────────────────────────────────────────────────────────┐
│ lib/hoa-packet.ts (REFACTOR)                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ KEEP:                                                      │
│    • checkHoaPacketAccess(userId, parcelId)                   │
│    • getUserHoaPacketPurchases(userId)                        │
│    • recordHoaPacketDownload(purchaseId)                      │
│                                                                 │
│  ➕ ADD:                                                       │
│    1. normalizeParcelRef(input)                               │
│       Input: { parcel_id? } | { apn, jurisdiction }          │
│       Output: "parcel:40023" OR "apn:123|jur:TX"              │
│                                                                 │
│    2. createHoaPacketPurchase(params)                         │
│       Move from webhook → lib (single source of truth)        │
│       Input: { parcel_ref, stripe_session_id, ... }          │
│       Output: { purchase_id, stripe_session_id }              │
│                                                                 │
│    3. grantHoaPacketEntitlement(params)                       │
│       Input: { user_id, purchase_id, parcel_ref }            │
│       Output: void                                             │
│                                                                 │
│    4. revokeHoaPacketEntitlement(params)                      │
│       Input: { user_id, parcel_ref }                          │
│       Output: void (marks revoked_at)                         │
│                                                                 │
│    5. assertHoaPacketAccess(params)                           │
│       Input: { user_id, parcel_id }                           │
│       Output: { packet_id, parcel_ref } OR throws            │
│       (stricter than check—enforces access or fails)         │
│                                                                 │
│    6. getHoaPacketStatus(params)                              │
│       Input: { session_id }                                    │
│       Output: { state, entitled, packet_id?, download_url? }  │
│       (returns from DB, not Stripe)                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Dependencies: None (pure lib)
Tests: Add unit tests for normalizeParcelRef, access logic
Complexity: Medium (entitlement logic, error handling)
```

**Key Implementation Notes:**
- `normalizeParcelRef()` should be deterministic (always same output for same input)
- `createHoaPacketPurchase()` should handle idempotency via hash key
- `assertHoaPacketAccess()` should throw on access denied, return data on success
- All functions should use Supabase service role key (server-side only)

---

## Phase 2: API Endpoint Refactoring (2-2.5 hours)

### 2A: Rename & Restructure Checkout

```
BEFORE:
  POST /api/parcel/hoa-packet/create-checkout-session

AFTER:
  POST /api/parcel/hoa-packet/checkout

Request Body (NEW):
  {
    "parcel_ref": {
      "parcel_id": "40023"        // OR
      "apn": "123-45-678",
      "jurisdiction": "TX"
    },
    "workspace_id": "ws_123",     // optional
    "customer_email": "user@...", // optional
    "success_url": "...",         // client provides
    "cancel_url": "..."           // client provides
  }

Response (SAME):
  {
    "checkout_url": "https://checkout.stripe.com/...",
    "session_id": "cs_test_..."
  }

Metadata in Stripe Session (NEW):
  {
    "purchase_type": "hoa_packet",
    "parcel_ref": "parcel:40023",         // normalized
    "account_id": "user_123",             // if authed
    "workspace_id": "ws_123",             // if provided
    "sku": "hoa_packet_v1",
    "environment": "prod"
  }
```

**Changes Required:**
```typescript
// OLD ENDPOINT: app/api/parcel/hoa-packet/create-checkout-session/route.ts
// DELETE THIS FOLDER

// NEW ENDPOINT: app/api/parcel/hoa-packet/checkout/route.ts
// POST /api/parcel/hoa-packet/checkout
//
// Logic:
// 1. Parse & validate parcel_ref (call normalizeParcelRef)
// 2. Get current user (if authed)
// 3. Generate idempotency key: hash(user_id + parcel_ref + sku + day)
// 4. Check if session exists for this key → return existing (idempotent)
// 5. Validate rate limit (IP + account_id)
// 6. Create Stripe session with normalized metadata
// 7. Store intent record in DB (for tracking)
// 8. Return { checkout_url, session_id }
```

---

### 2B: Rename & Restructure Status

```
BEFORE:
  POST /api/parcel/hoa-packet/confirm-payment
  Body: { sessionId, parcelId }

AFTER:
  GET /api/parcel/hoa-packet/status?session_id=cs_test_...

Response (NEW):
  {
    "state": "created" | "pending_payment" | "paid" | "fulfilled" | "revoked",
    "entitled": true,
    "packet_id": "pkt_123",       // optional
    "download_url": "/api/parcel/hoa-packet/download?..."  // optional
  }
```

**Changes Required:**
```typescript
// OLD ENDPOINT: app/api/parcel/hoa-packet/confirm-payment/route.ts
// DELETE THIS FOLDER

// NEW ENDPOINT: app/api/parcel/hoa-packet/status/route.ts
// GET /api/parcel/hoa-packet/status?session_id=...
//
// Logic:
// 1. Validate session_id parameter
// 2. Query hoa_packet_purchases by stripe_session_id
// 3. Map status: completed → paid, refunded → revoked, etc.
// 4. Check if user has access (if authed)
// 5. Return { state, entitled, packet_id?, download_url? }
// 6. Never call Stripe (source of truth = DB)
```

---

### 2C: Enhance Download

```
BEFORE:
  GET /api/parcel/hoa-packet/download?sessionId=cs_test_...&parcelId=40023

AFTER:
  GET /api/parcel/hoa-packet/download?session_id=cs_test_...
  
  Authorization: Call assertHoaPacketAccess() FIRST
```

**Changes Required:**
```typescript
// app/api/parcel/hoa-packet/download/route.ts
// GET /api/parcel/hoa-packet/download?session_id=...
//
// Logic:
// 1. Get session_id from query params
// 2. Get current user (if authed) OR check bearer token (for share links)
// 3. Query purchase by stripe_session_id
// 4. Call assertHoaPacketAccess({ user_id, parcel_id }) → throws if denied
// 5. Record download (existing logic)
// 6. Stream PDF
//
// Deny if:
//   • No entitlement record
//   • entitlement.revoked_at is set
//   • User doesn't own purchase AND not basic_buyer tier AND not admin
```

---

## Phase 3: Update Page Components (30 mins)

### 3A: Purchase Page

```typescript
// app/parcel/hoa-packet/page.tsx
//
// OLD: POST to /api/parcel/hoa-packet/create-checkout-session
// NEW: POST to /api/parcel/hoa-packet/checkout
//
// Changes:
// - Parse query params: ?parcel_id=40023 OR ?apn=123&jurisdiction=TX
// - Call normalizeParcelRef() before sending
// - Build request body per new spec
// - Capture user email from session (if authed)
// - Handle workspace_id if available
// - Pass success_url + cancel_url explicitly
//
// No UI changes needed
```

### 3B: Success Page

```typescript
// app/parcel/hoa-packet/success/page.tsx
//
// OLD: POST to /api/parcel/hoa-packet/confirm-payment
// NEW: GET to /api/parcel/hoa-packet/status?session_id=...
//
// Changes:
// - Call useEffect with fetch GET instead of POST
// - Parse response shape: { state, entitled, packet_id, download_url }
// - Show "Payment Successful" when state === "paid"
// - Show "Processing..." when state === "pending_payment" OR "created"
// - Show "Payment Failed" when state === "revoked"
// - Link download to download_url from response (or construct)
//
// UI Enhancement:
// - Add spinner for "pending_payment" state
// - Show estimated time for async methods
```

---

## Phase 4: Update Webhook (30 mins)

```typescript
// app/api/webhooks/stripe/route.ts
//
// CHANGE: handleCheckoutSessionCompleted()
//
// OLD: Direct DB inserts, manual user creation
// NEW: Call lib functions
//
// Logic:
// 1. Extract metadata from session (parcel_ref, etc.)
// 2. Call lib.createHoaPacketPurchase(params)
// 3. Find or create user
// 4. Call lib.grantHoaPacketEntitlement(params)
// 5. Upgrade user to basic_buyer
//
// For refunds:
// OLD: Just mark refunded
// NEW: Call lib.revokeHoaPacketEntitlement(params)
```

---

## Phase 5: Testing & Validation (30 mins - 1 hour)

```
Test Cases:

1. IDEMPOTENCY ✓
   POST /checkout with same parcel_ref
   → Returns same session_id (not duplicate)

2. PARCEL_REF NORMALIZATION ✓
   POST /checkout with parcel_id
   → Metadata has "parcel:40023"
   POST /checkout with apn + jurisdiction
   → Metadata has "apn:123|jur:TX"

3. STATUS ENDPOINT ✓
   GET /status?session_id=cs_...
   → Returns correct state based on DB
   → Never calls Stripe API

4. ACCESS CONTROL ✓
   GET /download?session_id=...
   → User with access → 200 + PDF
   → User without access → 403
   → Revoked entitlement → 403

5. WEBHOOK FLOW ✓
   Mock checkout.session.completed
   → Purchase record created
   → User tier upgraded to basic_buyer
   → Entitlement record created
   → Download works

6. RATE LIMITING ✓
   Spam POST /checkout from same IP
   → After N requests, return 429
```

---

## Phase 6: Update Client Code (1 hour)

```
Files that call HOA packet endpoints:

1. app/parcel/hoa-packet/page.tsx
   - Update fetch URL
   - Update request body shape
   - Add workspace_id if available

2. app/parcel/hoa-packet/success/page.tsx
   - Change POST to GET
   - Update response parsing

3. (Optional) Add button to parcel summary page
   - app/(dashboard)/parcel/[id]/page.tsx OR
   - app/parcel/summary/page.tsx
   - Button: "Buy HOA Packet - $39"
   - Route: /parcel/hoa-packet?parcel_id=${id}
```

---

## Rollout Plan

### **Safe Approach (Recommended):**

```
Step 1: Deploy lib/hoa-packet.ts (backward compatible)
        ✓ New functions don't break existing code

Step 2: Deploy new endpoints alongside old ones
        ✓ POST /checkout works alongside create-checkout-session
        ✓ GET /status works alongside confirm-payment
        ✓ Both point to same DB

Step 3: Update pages to use new endpoints
        ✓ Can be rolled back if needed

Step 4: Monitor for 1-2 days
        ✓ Check logs for errors
        ✓ Validate webhook processing

Step 5: Delete old endpoints
        ✓ Remove /create-checkout-session
        ✓ Remove /confirm-payment
```

### **Timeline:**

```
Day 1:
  ✓ Phase 1 (lib): 1-1.5 hrs
  ✓ Phase 2 (endpoints): 2-2.5 hrs
  ✓ Commit & test locally

Day 2:
  ✓ Phase 3 (pages): 30 mins
  ✓ Phase 4 (webhook): 30 mins
  ✓ Phase 5 (testing): 1 hr
  ✓ Phase 6 (client): 1 hr
  ✓ Commit & push

Day 3:
  ✓ Manual QA testing
  ✓ E2E flow validation
  ✓ Monitor production logs
```

---

## Git Workflow

```bash
# Create feature branch
git checkout -b refactor/hoa-packet-spec-alignment

# Commit Phase 1 (lib)
git add lib/hoa-packet.ts
git commit -m "refactor: Expand lib/hoa-packet.ts with spec functions"

# Commit Phase 2 (endpoints)
git add app/api/parcel/hoa-packet/
git commit -m "refactor: Rename HOA packet endpoints to spec (checkout, status)"

# Commit Phase 3-4 (pages + webhook)
git add app/parcel/hoa-packet/ app/api/webhooks/stripe/
git commit -m "refactor: Update pages and webhook for new endpoints"

# Commit Phase 5 (tests)
git add tests/
git commit -m "test: Add HOA packet spec compliance tests"

# Push and PR
git push origin refactor/hoa-packet-spec-alignment
```

---

## Risks & Mitigation

| Risk | Mitigation |
|---|---|
| Breaking API changes | Deploy new endpoints first, keep old ones for 1 week |
| Webhook misalignment | Use feature flag to switch handlers during transition |
| Idempotency logic bugs | Test with duplicate requests before production |
| Database corruption | Backup DB before migration, test on staging first |
| User confusion (tier upgrade) | Webhook still auto-upgrades, UX consistent |

---

## Success Criteria

- [ ] All 6 lib functions implemented + tested
- [ ] New endpoints match spec exactly
- [ ] Idempotency key prevents duplicate sessions
- [ ] Parcel ref normalization works for parcel_id AND apn+jurisdiction
- [ ] Status endpoint reads from DB (not Stripe)
- [ ] Download endpoint calls assertHoaPacketAccess
- [ ] Pages updated to use new endpoints
- [ ] Webhook integration works end-to-end
- [ ] E2E test: Guest checkout → payment → basic_buyer upgrade → download
- [ ] Rate limiting implemented

---

## Next Steps

**Option A: Proceed with Refactoring**
- Ready to start Phase 1 immediately
- ~4-6 hours of focused work
- Increases code quality & future-proofs design

**Option B: Keep Current Implementation**
- Works for MVP
- Technical debt grows over time
- Future features (workspace routing, share links) harder to implement

**Recommendation:** 🟢 **Proceed with refactoring** — investment now saves pain later.
