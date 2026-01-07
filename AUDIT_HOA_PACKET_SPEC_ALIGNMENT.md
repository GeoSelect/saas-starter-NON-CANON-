# HOA Packet Implementation Audit

**Date:** January 6, 2026  
**Status:** Implementation exists, review against detailed specs provided  
**Overall Alignment:** ~80% (functional, but several refinements needed)

---

## Executive Summary

The HOA packet purchase workflow is **functionally complete** with pages, API routes, webhooks, and database integration. However, the implementation diverges from the detailed specification in several key areas:

| Spec Requirement | Current Implementation | Gap | Severity |
|---|---|---|---|
| **Endpoint naming** | `create-checkout-session`, `confirm-payment`, `download` | Uses names not in spec (spec: `checkout`, `status`) | Medium |
| **Request/response shapes** | Custom shapes without explicit validation | Should match spec exactly | Medium |
| **Idempotency key** | Not implemented | Prevents duplicate sessions | Medium |
| **Metadata structure** | Partial (parcelId as string, not normalized ref) | Missing `parcel_ref` normalization, `sku`, `environment` | Medium |
| **Access control policy** | Implemented but minimal | Covers tier + purchase + admin | Low |
| **Error handling** | Basic error messages | Some leaks internal state | Low |

---

## 1. Pages Review

### ✅ `app/parcel/hoa-packet/page.tsx` (Purchase Page)

**Strengths:**
- Clean UI with property address display
- Handles `parcelId` from query params (`?id=40023`)
- Shows loading state during checkout
- Error messaging for safe user feedback
- 4-benefit grid with icons (FileText, Home, MapPin, Lock)
- Sticky pricing box in right column
- Trust badges (Stripe, SSL)
- FAQ section

**Gaps vs Spec:**
- ❌ Spec says: accept `parcel_id` OR `apn + jurisdiction` → Only handles `parcelId`
- ❌ Spec says: optional `workspace_id` support → Not implemented
- ❌ Spec says: deterministic handling of anonymous + authenticated → No auth check
- ⚠️ POST endpoint name: `create-checkout-session` (spec: `checkout`)

**Audit Notes:**
- The page works, but doesn't prepare for multi-tenant workspace routing
- If workspace doctrine is important, need to add workspace awareness
- Query param handling is fragile (no fallback if `?id` not provided)

---

### ✅ `app/parcel/hoa-packet/success/page.tsx` (Success Page)

**Strengths:**
- ✅ Accepts `session_id` from Stripe redirect
- ✅ Calls confirmation endpoint on mount (useEffect)
- ✅ Shows "Payment Successful" with green checkmark
- ✅ Download section with filename and date
- ✅ "What's Next?" with navigation options
- ✅ User upgrade notice ("Welcome to Basic Buyer!")
- ✅ Error state with fallback link

**Gaps vs Spec:**
- ❌ Spec says: POST to `/api/parcel/hoa-packet/status?session_id=...` → Currently calls `confirm-payment` (POST)
- ❌ Spec says: GET not POST → Implementation uses POST
- ⚠️ No handling for "still processing" state (async payment methods not shown)
- ⚠️ `parcelId` hardcoded fallback to `40023` if not in params

**Audit Notes:**
- The success page is well-designed and UX-friendly
- The "Basic Buyer" upgrade notice is a nice touch
- However, it needs to match spec's GET /status endpoint for idempotency

---

## 2. API Routes Review

### Route A: Checkout (Create Session)

**Endpoint:** `POST /api/parcel/hoa-packet/create-checkout-session`  
**Spec says:** `POST /api/parcel/hoa-packet/checkout`

**Request Body (Current):**
```json
{
  "parcelId": "40023",
  "property": { "address": "...", "city": "...", "state": "...", "zip": "..." },
  "priceInCents": 3900
}
```

**Request Body (Spec expects):**
```json
{
  "parcel_ref": { "parcel_id": "40023" },  // OR { "apn": "...", "jurisdiction": "..." }
  "workspace_id": "optional",
  "customer_email": "optional",
  "success_url": "...",
  "cancel_url": "..."
}
```

**Gaps:**
- ❌ No `parcel_ref` normalization (`parcel:<id>` or `apn:<apn>|jur:<jurisdiction>`)
- ❌ Missing idempotency key (hash of account + parcel_ref + sku + day)
- ❌ `property` object in request is frontend detail, not API contract
- ❌ No rate-limiting by IP + account
- ❌ No `workspace_id` support

**Metadata (Current):**
```json
{
  "parcelId": "40023",
  "propertyAddress": "...",
  "propertyCity": "...",
  "propertyState": "...",
  "propertyZip": "..."
}
```

**Metadata (Spec expects):**
```json
{
  "purchase_type": "hoa_packet",
  "parcel_ref": "parcel:40023",  // normalized
  "account_id": "optional",
  "workspace_id": "optional",
  "sku": "hoa_packet_v1",
  "environment": "dev|prod"
}
```

**Response (Current):**
```json
{
  "sessionId": "cs_test_...",
  "sessionUrl": "https://checkout.stripe.com/..."
}
```

**Response (Spec expects):** ✅ **Matches!**
- ✅ `checkout_url` (or `sessionUrl` is acceptable)
- ✅ `session_id`

---

### Route B: Status (Confirm Payment)

**Endpoint:** `POST /api/parcel/hoa-packet/confirm-payment`  
**Spec says:** `GET /api/parcel/hoa-packet/status`

**Gaps:**
- ❌ Wrong HTTP method (should be GET for idempotent status check)
- ❌ Missing session_id as query param
- ⚠️ Response includes DB state, but doesn't follow spec shape exactly

**Current Response:**
```json
{
  "sessionId": "cs_test_...",
  "status": "paid",
  "amount": 3900,
  "currency": "usd",
  "customerEmail": "...",
  "parcelId": "40023",
  "downloadLink": "/api/parcel/hoa-packet/download?sessionId=...&parcelId=..."
}
```

**Spec expects:**
```json
{
  "state": "created|pending_payment|paid|fulfilled|revoked",
  "entitled": true,
  "packet_id": "optional",
  "download_url": "optional"
}
```

**Critical Issue:**
- Endpoint needs to read from `hoa_packet_purchases` table, not call Stripe directly
- Currently it's a transaction endpoint, should be a status endpoint (immutable query)

---

### Route C: Download

**Endpoint:** `GET /api/parcel/hoa-packet/download`

**Current behavior:** ✅ Largely correct
- ✅ Calls `recordHoaPacketDownload()`
- ✅ Verifies purchase exists in DB
- ✅ Returns PDF with proper headers
- ✅ Mock PDF for development

**Gaps:**
- ⚠️ Uses query params (sessionId, parcelId) instead of path params
- ⚠️ Doesn't call `assertHoaPacketAccess()` from lib/hoa-packet.ts (spec requirement)
- ⚠️ No authorization check for authenticated users
- ⚠️ Mock PDF is very minimal

**Should match spec:**
```
GET /api/parcel/hoa-packet/download?session_id=...
- Returns PDF stream OR { signed_url }
- Calls assertHoaPacketAccess() first
- Deny if: no entitlement, revoked, wrong account/workspace
```

---

## 3. Webhook Review

### ✅ `app/api/webhooks/stripe/route.ts`

**Current handlers:**
1. `customer.subscription.updated` (for subscriptions, not HOA)
2. `customer.subscription.deleted` (for subscriptions)
3. `checkout.session.completed` ✅
4. `charge.refunded` ✅

**Checkout Session Completed Handler:**

**Spec requires:** Mark purchase paid, mint entitlement, optionally enqueue fulfillment

**Current implementation:** ✅ Nearly perfect
- ✅ Verifies signature
- ✅ Extracts parcelId and customerEmail from metadata
- ✅ Creates `hoa_packet_purchases` record with `status: 'completed'`
- ✅ Auto-creates user if guest checkout
- ✅ Upgrades user to `basic_buyer` tier
- ✅ Grants access via `user_hoa_packet_access`
- ✅ Updates purchase with user_id

**Gaps:**
- ⚠️ Metadata schema doesn't match spec (missing `parcel_ref` normalization, `sku`, `environment`)
- ⚠️ No fulfillment enqueue (PDF generation)

**Charge Refunded Handler:** ✅ Good
- ✅ Marks purchase as refunded
- ⚠️ Doesn't revoke entitlement (access still granted)

---

## 4. Library (`lib/hoa-packet.ts`)

**Current exports:**
- `checkHoaPacketAccess(userId, parcelId)` → boolean
- `getUserHoaPacketPurchases(userId)` → array
- `recordHoaPacketDownload(purchaseId)` → void

**Spec expects:**
- `normalizeParcelRef(input)` → string ❌ **Missing**
- `createHoaPacketPurchase(params)` → Promise ❌ **Missing** (done in webhook)
- `grantHoaPacketEntitlement(params)` → Promise ❌ **Missing** (done in webhook)
- `revokeHoaPacketEntitlement(params)` → Promise ❌ **Missing**
- `assertHoaPacketAccess(ctx)` → Promise ❌ **Missing** (only checkHoaPacketAccess exists)
- `getHoaPacketStatus(ctx)` → Promise ❌ **Missing**

**Current Access Policy:**
```typescript
if (user.role === 'admin') return true;
if (['basic_buyer', 'pro', 'enterprise'].includes(user.subscription_tier)) return true;
if (user_hoa_packet_access exists for parcelId) return true;
return false;
```

✅ **Good alignment** with spec's pragmatic default

**Gaps:**
- Missing `normalizeParcelRef()` (critical for idempotency)
- Missing `assertHoaPacketAccess()` (should throw/return null)
- Missing entitlement lifecycle functions (should be in lib, not webhook)
- Missing test coverage

---

## 5. Database Schema

✅ **Tables match spec requirements:**

```sql
hoa_packet_purchases (
  id, created_at, account_id, workspace_id, parcel_ref,
  stripe_session_id, status, amount, currency
)

user_hoa_packet_access (
  id, purchase_id, account_id, workspace_id, parcel_ref,
  packet_id, revoked_at
)
```

✅ **RLS policies in place**  
✅ **Indexes for performance**

---

## 6. Error Handling & Safety

**Current:**
- ✅ Safe error messages (don't leak stack traces)
- ❌ Some endpoints return internal session IDs in responses
- ⚠️ No validation of parcelId format
- ⚠️ No rate limiting

**Spec concerns:**
- "never leaks internal IDs or stack traces" — mostly ok, but sessionId in response is acceptable

---

## 7. Testing & Validation

**Missing test coverage:**
- ❌ Idempotency (duplicate requests should return same session)
- ❌ Webhook signature verification tests
- ❌ Access control boundary tests
- ❌ Refund flow end-to-end

---

## Summary Table: Spec Compliance

| Component | Spec | Current | Status |
|---|---|---|---|
| **Pages** | ✅ Purchase + Success | ✅ Implemented | **Good** |
| **POST /checkout** | ✅ Create session | ⚠️ create-checkout-session | **Rename** |
| **GET /status** | ✅ Query status | ❌ POST confirm-payment | **Refactor** |
| **GET /download** | ✅ Stream PDF | ⚠️ Works but missing auth | **Add auth** |
| **Webhook** | ✅ Handle events | ✅ Implemented | **Good** |
| **lib/hoa-packet.ts** | ✅ 6 functions | ⚠️ 3 functions | **Expand** |
| **Parcel normalization** | ✅ parcel:<id> OR apn:<apn>\|jur:<jurisdiction> | ❌ Not implemented | **Add** |
| **Idempotency** | ✅ Hash-based key | ❌ Not implemented | **Add** |
| **Metadata** | ✅ Structured schema | ⚠️ Custom schema | **Align** |
| **Rate limiting** | ✅ Required | ❌ Not implemented | **Add** |

---

## Recommended Refactoring Priority

### High Priority (Breaking Changes)
1. **Rename endpoints** to match spec:
   - `create-checkout-session` → `checkout`
   - `confirm-payment` → `status`
2. **Change HTTP method** for status: POST → GET
3. **Add parcel_ref normalization** in lib/hoa-packet.ts
4. **Add idempotency key logic** to checkout endpoint

### Medium Priority (Functional)
5. **Update metadata schema** to spec format
6. **Expand lib/hoa-packet.ts** with missing functions
7. **Add authorization checks** to download endpoint
8. **Add rate limiting** (IP + account_id)

### Low Priority (Polish)
9. Add test coverage for critical flows
10. Add input validation for parcelId/apn/jurisdiction
11. Implement async payment method support
12. Enqueue PDF generation (fulfillment)

---

## Conclusion

The implementation is **functionally solid** with good UX and database design. The main gaps are:

1. **Endpoint naming and HTTP methods** (spec vs implementation mismatch)
2. **Parcel reference normalization** (critical for multi-format support)
3. **Idempotency** (prevents duplicate sessions)
4. **Complete lib/hoa-packet.ts** (access control centralization)

**Effort to align:** ~4-6 hours for a careful refactor.

**Recommendation:** Perform the refactoring to match spec exactly, as it enables future features (workspace routing, bulk operations, share links) that depend on these contracts.
