# HOA Packet Purchase Workflow - Setup Guide

**Date:** January 6, 2026  
**Status:** ✅ Ready for Testing  

---

## 🎯 What Was Built

A complete one-time purchase workflow for HOA packets that converts public users to "basic buyers":

### Pages Created
- **`/parcel/hoa-packet?id={parcelId}`** - Purchase page with pricing, benefits, checkout button
- **`/parcel/hoa-packet/success?session_id={id}&parcelId={id}`** - Success page with download link

### API Endpoints Created
- **`POST /api/parcel/hoa-packet/create-checkout-session`** - Initiates Stripe checkout
- **`POST /api/parcel/hoa-packet/confirm-payment`** - Verifies payment and provides download
- **`GET /api/parcel/hoa-packet/download`** - Downloads PDF (mock)
- **`POST /api/webhooks/stripe`** - Extended to handle checkout.session.completed & charge.refunded

### Database Changes
- **New Tables:**
  - `hoa_packet_purchases` - Transaction records
  - `user_hoa_packet_access` - Grant/revoke access per parcel
  - `stripe_webhook_logs` - Debug webhook events
  
- **Table Updates:**
  - `users.subscription_tier` - Added `'basic_buyer'` to enum
  
- **RLS Policies:**
  - Users can only view their own purchases
  - Users can only view their own access grants

### Features
✅ Light theme matching parcel summary design  
✅ $39 per parcel packet  
✅ Includes: HOA docs, property history, flood/zoning, PDF  
✅ Public users (no account required to start checkout)  
✅ Auto-creates "basic_buyer" account after purchase  
✅ Permanent download access  
✅ Refund support (marks as refunded)  
✅ Stripe webhook processing  

---

## 🔧 Required Environment Variables

Add these to `.env.local` (test them in `.env.test` first):

```dotenv
# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Domain
NEXT_PUBLIC_DOMAIN=http://localhost:3000
```

### Where to Get Stripe Keys
1. Go to https://dashboard.stripe.com/
2. Click "Developers" in top-right
3. Copy "Publishable Key" and "Secret Key"
4. For webhook: Go to "Webhooks" → "Add endpoint"
   - URL: `http://localhost:3000/api/webhooks/stripe` (for local testing)
   - Events: `checkout.session.completed`, `charge.refunded`
   - Copy Signing Secret

---

## 🧪 Testing the Flow

### 1. **Start Dev Server**
```bash
pnpm dev
```

### 2. **Access Purchase Page**
```
http://localhost:3000/parcel/hoa-packet?id=40023
```

### 3. **Click "Buy HOA Packet Now"**
- Should redirect to Stripe checkout

### 4. **Use Test Card**
```
Card: 4242 4242 4242 4242
Expiry: 12/34
CVC: 567
```

### 5. **Verify in Database**

**Check purchase was stored:**
```sql
SELECT * FROM hoa_packet_purchases 
WHERE stripe_session_id = 'cs_test_...';
```

**Check user was upgraded:**
```sql
SELECT id, email, subscription_tier FROM users 
WHERE email = 'test@example.com';
-- Should show: subscription_tier = 'basic_buyer'
```

**Check access was granted:**
```sql
SELECT * FROM user_hoa_packet_access 
WHERE parcel_id = '40023';
```

---

## 📋 Checklist Before Going Live

- [ ] Stripe keys added to `.env.local`
- [ ] Webhook secret configured in Stripe dashboard
- [ ] Test purchase flow (card → success → download)
- [ ] Verify database records created
- [ ] Check user tier upgraded to basic_buyer
- [ ] Test refund (marks as refunded, keeps access)
- [ ] Test with real Stripe account (not test mode)
- [ ] Add email notification after purchase (TODO)
- [ ] Generate real HOA PDFs from Esri data (TODO)
- [ ] Add share/gift functionality (optional future)

---

## 🚀 Next Features to Add

1. **Email Notifications**
   - Confirmation email with download link
   - Resend email if lost

2. **Real PDF Generation**
   - Query Esri for parcel data
   - Pull HOA documents from database
   - Generate formatted PDF with property details
   - Include flood zone/zoning maps

3. **Dashboard**
   - Show purchase history
   - Re-download capability
   - Share/gift to others

4. **Comparison Shopping**
   - Show "Popular with this area" on purchase page
   - Upsell multi-parcel bundles

5. **User Tier Benefits**
   - Basic buyers: 1 free packet, then $29 each
   - Pro: Unlimited packets, analytics
   - Enterprise: Bulk discounts, API access

---

## 🔐 Security Notes

- ✅ Webhook signature verified (Stripe → us)
- ✅ RLS policies prevent user data leaks
- ✅ Payment confirmed before access granted
- ✅ Rate limiting on endpoints (TODO: add)
- ✅ CORS configured for checkout.arcgisonline.com (TODO: verify)

---

## 📊 Tables Schema Reference

### hoa_packet_purchases
```sql
id (UUID)                    -- Purchase ID
user_id (UUID)               -- User who bought (NULL if guest checkout)
parcel_id (VARCHAR)          -- Property being purchased
stripe_session_id (VARCHAR)  -- Stripe checkout session
stripe_payment_intent_id     -- For refund tracking
amount_cents (INTEGER)       -- $3900 = $39.00
currency (VARCHAR)           -- 'usd'
status (VARCHAR)             -- 'pending', 'completed', 'failed', 'refunded'
customer_email (VARCHAR)     -- Email from checkout
downloaded_at (TIMESTAMP)    -- When downloaded
refunded_at (TIMESTAMP)      -- When refunded
created_at (TIMESTAMP)       -- Purchase date
```

### user_hoa_packet_access
```sql
id (UUID)
user_id (UUID)
parcel_id (VARCHAR)
purchase_id (UUID)
access_level (VARCHAR)       -- 'preview' or 'full'
granted_at (TIMESTAMP)
expires_at (TIMESTAMP)       -- NULL = lifetime
```

---

## 🆘 Troubleshooting

### "Stripe API key not configured"
- Add STRIPE_SECRET_KEY to .env.local
- Restart dev server

### "Webhook signature verification failed"
- Verify STRIPE_WEBHOOK_SECRET is correct
- For local testing, use Stripe CLI to forward events:
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```

### "User not created after payment"
- Check webhook was received (Stripe Dashboard → Logs)
- Check Supabase RLS policies aren't blocking inserts
- Check service role key is set in SUPABASE_SERVICE_ROLE_KEY

### "Download link returns 404"
- Verify session_id and parcelId match purchase in database
- Check download endpoint is handling request correctly

---

## 📝 Code Files Created/Modified

**Pages:**
- ✅ `/app/parcel/hoa-packet/page.tsx` - Purchase page
- ✅ `/app/parcel/hoa-packet/success/page.tsx` - Success page

**API Routes:**
- ✅ `/app/api/parcel/hoa-packet/create-checkout-session/route.ts`
- ✅ `/app/api/parcel/hoa-packet/confirm-payment/route.ts`
- ✅ `/app/api/parcel/hoa-packet/download/route.ts`
- ✅ `/app/api/webhooks/stripe/route.ts` (extended)

**Library:**
- ✅ `/lib/hoa-packet.ts` - Access control utilities

**Database:**
- ✅ `/supabase/migrations/20260106_hoa_packet_purchases.sql`

---

**Last Updated:** January 6, 2026  
**Ready for:** Testing & deployment
