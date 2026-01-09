# Pricing Page ↔ CCP-10 Integration: Manual Test Checklist

**Date**: January 9, 2026  
**Status**: Ready for Testing  
**Tested By**: _________________  
**Environment**: _________________

---

## 📋 Test Prerequisites

- [ ] Server running locally or in test environment
- [ ] Database migrations applied (including 009_ccp05_entitlements.sql)
- [ ] Test workspaces created for each tier (Home, Studio, Portfolio)
- [ ] Test user accounts with access to each workspace
- [ ] API endpoints accessible

---

## 1️⃣ Pricing Page Display Tests

### Plan Cards Rendering

- [ ] **Home plan card displays**
  - Price: $29/mo
  - Description visible
  - Features list shows (check first 8)
  - "Get Started" button present
  
- [ ] **Studio plan card displays**
  - Price: $79/mo
  - Description visible
  - Features list shows
  - "Get Started" button present
  
- [ ] **Portfolio plan card displays**
  - Price: $199/mo (or $2,388/year if annual billing)
  - "Most Popular" badge visible
  - Description visible
  - Features list includes collaboration features
  - "Get Started" button present with orange styling

### Feature Matrix

- [ ] **Feature Comparison Table visible**
  - Click "View Complete Feature Matrix" link
  - Table displays all plans as columns
  - CCP-10 features clearly marked
  
- [ ] **CCP-10 features show correct availability**
  - Share Links row shows ✓ for Portfolio, ✗ for Home/Studio
  - Role-based access row shows ✓ for Portfolio only
  - Audit trail row shows ✓ for Portfolio only

### Billing Toggle

- [ ] **Monthly/Annual toggle works**
  - Click "Annual (Save 20%)"
  - Prices update to annual equivalents
  - Savings amount shows below price
  - Click "Monthly" to switch back

### FAQ Section

- [ ] **FAQ answers visible**
  - "Can I change plans?" explains upgrade/downgrade
  - "Do you offer refunds?" mentions 30-day guarantee
  - "What's included in support?" mentions Portfolio support level
  - "Need a custom plan?" shows enterprise contact info

---

## 2️⃣ API Entitlement Enforcement Tests

### Create Share Link (POST /api/share-links)

#### Test with Home Plan Workspace

```bash
# Replace $TOKEN with actual JWT token
# Replace $WORKSPACE_ID with Home plan workspace ID

curl -X POST http://localhost:3000/api/share-links \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "$WORKSPACE_ID",
    "snapshot_id": "test-snapshot-123",
    "options": {
      "expiresAt": "2026-02-01T00:00:00Z"
    }
  }'
```

**Expected Result:**
- [ ] HTTP Status: 402 Payment Required
- [ ] Response includes `error: "Feature not available"`
- [ ] Response includes `reason: "TIER_INSUFFICIENT"`
- [ ] Response includes `upgrade.currentTier: "home"`
- [ ] Response includes `upgrade.requiredTier: "portfolio"` (or `pro_plus`)
- [ ] Response includes `upgrade.upgradeUrl` with feature parameter

#### Test with Studio Plan Workspace

```bash
# Same as above but with Studio workspace ID
```

**Expected Result:**
- [ ] HTTP Status: 402 Payment Required
- [ ] Reason: TIER_INSUFFICIENT

#### Test with Portfolio Plan Workspace

```bash
# Same as above but with Portfolio workspace ID
```

**Expected Result:**
- [ ] HTTP Status: 201 Created
- [ ] Response includes `share_link` object
- [ ] Share link has `token`, `short_code`, `workspace_id`, `snapshot_id`
- [ ] `expires_at` is set correctly
- [ ] No error messages

---

### List Share Links (GET /api/share-links)

#### Test with Home Plan Workspace

```bash
curl "http://localhost:3000/api/share-links?workspace_id=$WORKSPACE_ID_HOME" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- [ ] HTTP Status: 402 Payment Required
- [ ] Error message about tier requirement

#### Test with Portfolio Plan Workspace

```bash
curl "http://localhost:3000/api/share-links?workspace_id=$WORKSPACE_ID_PORTFOLIO" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- [ ] HTTP Status: 200 OK
- [ ] Response includes `share_links` array (may be empty)
- [ ] Response includes `count`, `limit`, `offset`

---

### Access Share Link (GET /api/share-links/[token]) - PUBLIC

#### Test with valid token (created by Portfolio workspace)

```bash
# No authentication required
curl http://localhost:3000/api/share-links/abc123XY
```

**Expected Result:**
- [ ] HTTP Status: 200 OK
- [ ] Response includes `share_link` object
- [ ] Response includes `validation.isValid: true`
- [ ] No tier check (public access)

#### Test with expired/revoked token

```bash
curl http://localhost:3000/api/share-links/expired-token
```

**Expected Result:**
- [ ] HTTP Status: 410 Gone (or 404 Not Found)
- [ ] Error explains link status (expired, revoked, etc.)

---

### Revoke Share Link (DELETE /api/share-links/[token])

#### Test with Home Plan Workspace

```bash
curl -X DELETE http://localhost:3000/api/share-links/$TOKEN_FROM_PORTFOLIO_LINK \
  -H "Authorization: Bearer $TOKEN_HOME_USER"
```

**Expected Result:**
- [ ] HTTP Status: 402 Payment Required (if user's workspace is Home plan)
- [ ] OR 403 Forbidden (if not a member of the workspace that created the link)

#### Test with Portfolio Plan Workspace (creator)

```bash
curl -X DELETE http://localhost:3000/api/share-links/$TOKEN \
  -H "Authorization: Bearer $TOKEN_PORTFOLIO_USER"
```

**Expected Result:**
- [ ] HTTP Status: 200 OK
- [ ] Response includes `revoked_at` timestamp
- [ ] Response includes `revoked_by` user ID
- [ ] Message: "Share link revoked successfully"

---

### View Audit Trail (GET /api/share-links/[id]/events)

#### Test with Home Plan Workspace

```bash
curl "http://localhost:3000/api/share-links/$LINK_ID/events" \
  -H "Authorization: Bearer $TOKEN_HOME"
```

**Expected Result:**
- [ ] HTTP Status: 402 Payment Required
- [ ] Error about tier requirement

#### Test with Portfolio Plan Workspace

```bash
curl "http://localhost:3000/api/share-links/$LINK_ID/events?limit=100" \
  -H "Authorization: Bearer $TOKEN_PORTFOLIO"
```

**Expected Result:**
- [ ] HTTP Status: 200 OK
- [ ] Response includes `events` array
- [ ] Each event has: `event_type`, `actor_user_id`, `created_at`, etc.
- [ ] Events are ordered newest first

---

## 3️⃣ Upgrade Flow Tests

### Upgrade URL Generation

- [ ] **402 response includes correct upgrade URL**
  - Format: `/pricing?feature=ccp-10:collaboration&current=[tier]&required=portfolio`
  - Feature parameter is URL-encoded correctly
  - Current tier matches workspace tier
  - Required tier is 'portfolio' or 'pro_plus'

### Pricing Page with Feature Parameter

- [ ] **Navigate to pricing page with feature param**
  ```
  /pricing?feature=ccp-10:collaboration&current=home&required=portfolio
  ```
  - Page loads successfully
  - Portfolio plan is visually highlighted (check for `ring` or `scale` classes)
  - Feature comparison shows CCP-10 features
  - Call-to-action emphasizes Portfolio benefits

---

## 4️⃣ Entitlements Service Tests

### Database Queries

- [ ] **Entitlements table has CCP-10 rows**
  ```sql
  SELECT * FROM entitlements 
  WHERE feature = 'ccp-10:collaboration'
  LIMIT 5;
  ```
  - Rows exist for different workspaces
  - `enabled` column is boolean
  - `tier` column matches workspace tier
  - `reason_code` is set for disabled features

- [ ] **Billing state table is populated**
  ```sql
  SELECT workspace_id, tier, status 
  FROM billing_state 
  LIMIT 5;
  ```
  - Workspaces have tier assignments
  - Status is 'active', 'trial', etc.

### Entitlement Check Logging

- [ ] **Entitlement checks are logged**
  ```sql
  SELECT * FROM entitlement_checks 
  WHERE feature = 'ccp-10:collaboration'
  ORDER BY created_at DESC
  LIMIT 10;
  ```
  - Logs show recent checks
  - `result` column shows true/false
  - `reason_code` shows 'TIER_INSUFFICIENT' for denied checks
  - `user_id` and `workspace_id` are captured

---

## 5️⃣ User Experience Tests

### Paywall Component (if implemented)

- [ ] **Home user sees upgrade prompt**
  - Button/link to create share link triggers paywall
  - Paywall shows Portfolio benefits
  - Paywall shows current plan (Home $29/mo)
  - Paywall shows required plan (Portfolio $199/mo)
  - "Upgrade Now" button redirects to pricing page

### Error Messages

- [ ] **Clear error messages shown to users**
  - "Feature not available" or similar
  - Explains tier requirement (Portfolio or higher)
  - Provides actionable next step (upgrade link)
  - No technical jargon (no mention of 402 status codes)

### Success Flow

- [ ] **Portfolio user can share successfully**
  - Click "Share" button
  - Share dialog opens (no paywall)
  - Enter share link options (expiration, max views, etc.)
  - Click "Create Share Link"
  - Share link displayed with copy button
  - Success message confirms link created

---

## 6️⃣ Edge Cases & Error Handling

### Database Connection Failure

- [ ] **Entitlement check fails gracefully**
  - Temporarily disconnect database
  - Attempt to create share link
  - Should return 500 or 402 with SYSTEM_MAINTENANCE reason
  - Should NOT crash the application

### Invalid Workspace ID

- [ ] **API returns appropriate error**
  ```bash
  curl -X POST http://localhost:3000/api/share-links \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"workspace_id": "invalid-id", "snapshot_id": "test"}'
  ```
  - HTTP Status: 400 Bad Request or 404 Not Found
  - Error explains workspace not found

### Missing Authentication

- [ ] **API requires authentication**
  ```bash
  curl -X POST http://localhost:3000/api/share-links \
    -H "Content-Type: application/json" \
    -d '{"workspace_id": "ws-123", "snapshot_id": "snap-123"}'
  ```
  - HTTP Status: 401 Unauthorized
  - Error: "Authentication required"

### Expired JWT Token

- [ ] **API rejects expired tokens**
  - Use an expired JWT token
  - Attempt API call
  - HTTP Status: 401 Unauthorized

---

## 7️⃣ Performance Tests

### API Response Times

- [ ] **Entitlement checks are fast**
  - Create share link request completes < 500ms
  - List share links request completes < 300ms
  - Database query time logged (check server logs)

### Pricing Page Load Time

- [ ] **Pricing page loads quickly**
  - Initial page load < 2 seconds
  - Feature matrix renders without layout shift
  - Plan cards appear simultaneously (no popping in)

---

## 8️⃣ Accessibility Tests

### Keyboard Navigation

- [ ] **Pricing page is keyboard accessible**
  - Tab through plan cards
  - Tab through feature comparison table
  - Tab to "Get Started" buttons
  - Press Enter to activate buttons

### Screen Reader

- [ ] **Content is screen-reader friendly**
  - Plan names are announced
  - Prices are announced correctly
  - Feature availability (✓/✗) is announced
  - Error messages are announced

---

## 9️⃣ Mobile Responsiveness

### Pricing Page on Mobile

- [ ] **Plan cards stack vertically**
  - Single column layout on mobile
  - Cards are readable without horizontal scroll
  - "Get Started" buttons are tappable (min 44x44px)

### Feature Matrix on Mobile

- [ ] **Table is horizontally scrollable**
  - Swipe left/right to view all columns
  - Headers remain visible
  - Content doesn't overflow

---

## 🔟 Documentation Verification

### Code Comments

- [ ] **API routes have clear comments**
  - CCP-10 tier requirement documented in header
  - Entitlement check logic explained
  - Error responses documented

### README/Markdown Files

- [ ] **CCP-10 documentation exists**
  - [CCP-10-TIER-GATING.md](CCP-10-TIER-GATING.md) is complete
  - [CCP-10-COMPLETE.md](CCP-10-COMPLETE.md) is accurate
  - Examples are up-to-date

---

## ✅ Final Checklist

- [ ] All pricing plans display correctly
- [ ] Feature matrix accurately reflects CCP-10 availability
- [ ] Home plan users blocked from CCP-10 (402 error)
- [ ] Studio plan users blocked from CCP-10 (402 error)
- [ ] Portfolio plan users can use CCP-10 (201/200 responses)
- [ ] Upgrade URLs redirect to pricing page correctly
- [ ] Public share link access works (no tier check)
- [ ] Audit trail requires Portfolio tier
- [ ] Error messages are clear and actionable
- [ ] Performance is acceptable (< 500ms API responses)

---

## 🐛 Issues Found

| Issue # | Description | Severity | Status |
|---------|-------------|----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## 📝 Notes

<!-- Add any additional observations or notes here -->

---

## Sign-Off

**Tested By**: _________________  
**Date**: _________________  
**Approved**: ☐ Yes ☐ No (see issues)

**Next Steps**:
- [ ] Fix any issues found
- [ ] Re-test failed cases
- [ ] Deploy to staging environment
- [ ] Conduct user acceptance testing (UAT)
