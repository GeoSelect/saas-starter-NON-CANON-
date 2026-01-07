# HOA Packet Purchase - Deployment Checklist

## Pre-Launch Tasks

### ✅ Development Complete
- [x] Frontend page `/parcel/hoa-packet` with light theme design
- [x] Stripe checkout integration
- [x] Success page with download link
- [x] Webhook handlers for payment completion
- [x] Database schema for purchases & access
- [x] Access control functions
- [x] Mock PDF download endpoint
- [x] Environment variables configured

### 📋 Before Testing with Stripe

**Step 1: Get Stripe Test Keys**
1. Go to https://dashboard.stripe.com/apikeys
2. Make sure you're in "Test mode" (toggle upper right)
3. Copy "Publishable key" → `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`
4. Copy "Secret key" → `STRIPE_SECRET_KEY`
5. Go to Webhooks → "Add endpoint"
   - URL: `http://localhost:3000/api/webhooks/stripe`
   - Events to send: Select `checkout.session.completed` and `charge.refunded`
   - Copy "Signing secret" → `STRIPE_WEBHOOK_SECRET`

**Step 2: Update .env.local**
```dotenv
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_KEY_HERE
```

**Step 3: Restart Dev Server**
```bash
pnpm dev
```

### 🧪 Testing Steps

**Test 1: Purchase Flow**
```
1. Open http://localhost:3000/parcel/hoa-packet?id=40023
2. Verify page loads with $39 price
3. Click "Buy HOA Packet Now"
4. Should redirect to Stripe checkout
5. Enter email: test@example.com
6. Card: 4242 4242 4242 4242
7. Expiry: 12/34
8. CVC: 567
9. Click "Pay"
10. Should redirect to success page
11. See "Payment Successful!"
12. Click download button
13. Should save PDF to computer
```

**Test 2: Database Records**
```bash
# Check purchase was stored
SELECT * FROM hoa_packet_purchases 
WHERE stripe_session_id LIKE 'cs_test%';

# Should show: id, user_id, parcel_id='40023', status='completed'

# Check user was created/upgraded
SELECT id, email, subscription_tier FROM users 
WHERE email = 'test@example.com';

# Should show: subscription_tier = 'basic_buyer'

# Check access was granted
SELECT * FROM user_hoa_packet_access 
WHERE parcel_id = '40023';

# Should show: access_level = 'full'
```

**Test 3: Webhook Processing**
```bash
# Check webhook was received
SELECT * FROM stripe_webhook_logs 
WHERE event_type = 'checkout.session.completed' 
ORDER BY created_at DESC 
LIMIT 1;

# Should show: status = 'processed' (not 'failed')
```

**Test 4: Refund Handling**
```bash
# In Stripe Dashboard → Payments → (Find test payment)
# Click "Refund" button
# Then in database:
SELECT * FROM hoa_packet_purchases 
WHERE stripe_session_id = 'cs_test_...' 
AND status = 'refunded';

# Should show refunded_at timestamp
```

### 🐛 Troubleshooting

**Stripe checkout returns 403**
- [ ] Check `STRIPE_SECRET_KEY` is correct (sk_test_...)
- [ ] Verify it's in .env.local, not .env
- [ ] Restart dev server after changes

**Webhook signature verification fails**
- [ ] Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- [ ] For local testing, use `stripe listen`:
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```

**User not created in database**
- [ ] Check `SUPABASE_SERVICE_ROLE_KEY` is set in server environment
- [ ] Verify RLS is enabled on tables
- [ ] Check webhook logs: `stripe_webhook_logs` table for errors

**Download returns 404**
- [ ] Verify `sessionId` and `parcelId` match the purchase record
- [ ] Check `session.payment_status == 'paid'`

**Page doesn't load**
- [ ] Clear .next cache: `rm -rf .next`
- [ ] Restart: `pnpm dev`
- [ ] Check console for errors (F12)

### 📝 Acceptance Criteria

**Must Pass Before Going Live:**
- [ ] Purchase page loads at `/parcel/hoa-packet?id=TEST_PARCEL`
- [ ] Stripe checkout redirects correctly
- [ ] Payment processes with test card
- [ ] User created in database with `basic_buyer` tier
- [ ] Purchase record stored correctly
- [ ] Access grant created
- [ ] Webhook processed successfully
- [ ] Download endpoint returns PDF
- [ ] Refund marks purchase as refunded
- [ ] No errors in browser console
- [ ] No errors in server logs

### 🚀 Production Deployment

**Before Going Live:**
1. Get Stripe Live keys from https://dashboard.stripe.com/apikeys
2. Update .env.local with live keys (`pk_live_...` and `sk_live_...`)
3. Add webhook endpoint in Stripe with production URL
4. Update `NEXT_PUBLIC_DOMAIN` to production domain
5. Test one real payment with small amount ($1)
6. Monitor: Stripe Dashboard → Payments
7. Monitor: Supabase → Tables for records
8. Set up email notifications (TODO)

### 🔗 Add to Parcel Summary Page

Once tested, add button to `/app/parcel/summary/page.tsx`:

```tsx
<button
  onClick={() => router.push(`/parcel/hoa-packet?id=${parcelId}`)}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
>
  💼 Buy HOA Packet - $39
</button>
```

---

## File Checklist

### Pages Created
- [x] `/app/parcel/hoa-packet/page.tsx` (Purchase landing)
- [x] `/app/parcel/hoa-packet/success/page.tsx` (Post-purchase)

### API Routes Created
- [x] `/app/api/parcel/hoa-packet/create-checkout-session/route.ts`
- [x] `/app/api/parcel/hoa-packet/confirm-payment/route.ts`
- [x] `/app/api/parcel/hoa-packet/download/route.ts`

### Files Modified
- [x] `/app/api/webhooks/stripe/route.ts` (Added HOA handlers)
- [x] `/.env.local` (Added Stripe keys)

### Files Created
- [x] `/lib/hoa-packet.ts` (Access control)
- [x] `/supabase/migrations/20260106_hoa_packet_purchases.sql` (DB schema)
- [x] `/docs/HOA_PACKET_PURCHASE_SETUP.md` (Setup guide)
- [x] `/docs/HOA_PACKET_WORKFLOW_SUMMARY.md` (Architecture)
- [x] `/docs/HOA_PACKET_CHECKLIST.md` (This file)

---

## 📊 Key Metrics After Launch

Monitor in first week:
- [ ] Total purchases
- [ ] Conversion rate (visit → purchase)
- [ ] Average checkout time
- [ ] Error rate (failed sessions)
- [ ] Refund rate
- [ ] User satisfaction (if surveys added)

---

## Questions?

Refer to:
1. **Setup Guide:** `/docs/HOA_PACKET_PURCHASE_SETUP.md`
2. **Architecture:** `/docs/HOA_PACKET_WORKFLOW_SUMMARY.md`
3. **Code Comments:** Check individual files

---

**Last Updated:** January 6, 2026  
**Status:** Ready for testing
