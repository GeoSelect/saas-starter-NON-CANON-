# Workspace Switcher - Visual Debugging Guide

## DevTools Navigation

### Check 1: Verify Cookie is Set

**Steps in Chrome/Firefox DevTools:**
1. Open **F12** → **Application** tab
2. Left sidebar → **Cookies**
3. Select your domain (e.g., `localhost:3000`)
4. Look for `active_workspace` cookie

**What to Look For:**

```
Name:        active_workspace
Value:       [workspace-id-uuid]
Domain:      localhost
Path:        /
Expires:     [1 year from now]
Size:        [workspace-id length]
HttpOnly:    ✓ (checked)
Secure:      ✓ (checked in HTTPS)
SameSite:    Lax
```

**If Missing:**
- [ ] Cookie not being set by API
- [ ] API returning non-200 status
- [ ] Wrong domain
- [ ] Cookie deleted by policy

### Check 2: Verify Cookie is Sent with Requests

**Steps:**
1. Open **Network** tab (F12)
2. Do action: switch workspace in dropdown
3. Look for request to `/api/workspaces/select`
4. Click on that request
5. Go to **Request Headers** section
6. Find `Cookie` header

**What to Look For:**

```
Cookie: active_workspace=abc123-uuid; other_cookies=...
```

**If Missing:**
- [ ] Cookie domain doesn't match
- [ ] Cookie path is wrong
- [ ] Cookie expired
- [ ] Request is to different domain

### Check 3: See API Response Headers

**In same Network request:**
1. Click `/api/workspaces/select` request
2. Go to **Response Headers** tab
3. Find `Set-Cookie` header

**What to Look For:**

```
Set-Cookie: active_workspace=abc123-uuid; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax
```

### Check 4: Monitor Network Traffic During Switch

**Steps:**
1. Open Network tab
2. Set filter to **XHR** (XMLHttpRequest)
3. Select workspace in dropdown
4. Watch requests in real-time

**Expected Flow:**
```
1. POST /api/workspaces/select
   ↓ Status: 200
   ↓ Response: { success: true, workspace_id: "..." }
   ↓ Headers: Set-Cookie: active_workspace=...

2. (Automatic) GET /dashboard/audit (after router.refresh)
   ↓ Status: 200
   ↓ Page reloads with new workspace context
```

### Check 5: See Server Logs

**Open Terminal Where Dev Server Runs:**

Look for patterns:

```bash
# Successful workspace switch
[AUTH] User abc123 resolved via cookie_active_workspace: workspace-456

# Attempted invalid access
[AUTH] Security: User abc123 has invalid active_workspace cookie: invalid-id (not a member)

# Server-side validation
[AUTH] User abc123 resolved via database_primary: workspace-123
```

### Check 6: Inspect Request/Response Body

**In Network Tab:**
1. Click `/api/workspaces/select` request
2. Go to **Request** section

**Request Body Should Be:**
```json
{
  "workspace_id": "12345678-1234-5678-1234-567812345678"
}
```

**Response Body Should Be:**
```json
{
  "success": true,
  "workspace_id": "12345678-1234-5678-1234-567812345678",
  "message": "Workspace switched successfully"
}
```

### Check 7: Storage Tab (View All Cookies at Once)

**Steps:**
1. Open DevTools → **Storage** tab (Firefox) or **Application** tab (Chrome)
2. Left sidebar → **Cookies**
3. Click domain
4. See all cookies with their properties in table format

**Look For:**
- `active_workspace` exists
- Value is a valid UUID
- HttpOnly and Secure flags enabled
- Path is `/`

## Common Issues & Solutions

### Issue: Cookie Not Appearing

**Diagnosis Steps:**
1. [ ] Check Network tab → `/api/workspaces/select` response status
   - Should be 200
   - Should have `Set-Cookie` header
2. [ ] Check server console for errors
   - Look for `[AUTH]` error messages
3. [ ] Verify workspace ID is valid UUID
4. [ ] Verify user is member of workspace

**Solutions:**
```javascript
// In browser console, manually test API:
fetch('/api/workspaces/select', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ workspace_id: 'YOUR_WORKSPACE_UUID' })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e))
```

### Issue: Cookie Set But Not Sent Back

**Check:**
1. [ ] Cookie domain matches current domain
2. [ ] Cookie path is `/`
3. [ ] Cookie not expired
4. [ ] Cookie not SameSite=Strict (only Lax or None allowed)

**Test:**
```javascript
// In browser console:
console.log('Cookies:', document.cookie)
```

Should show: `active_workspace=abc123...`

### Issue: Server Not Reading Cookie

**Check Server Logs:**
```
[AUTH] Failed to read active_workspace cookie: ...
```

**Fix:**
1. Verify `getActiveWorkspaceFromCookie()` is being called
2. Add debug log to see raw headers:
   ```typescript
   console.log('Raw headers:', request.headers.get('cookie'));
   ```
3. Check if request object is correct type

### Issue: Membership Validation Fails

**Server Log Shows:**
```
[AUTH] Security: User abc123 has invalid active_workspace cookie: workspace-456 (not a member)
```

**Solutions:**
1. [ ] Verify user is in `users_workspaces` table:
   ```sql
   SELECT * FROM users_workspaces 
   WHERE user_id = 'your-user-id' AND workspace_id = 'workspace-456';
   ```
2. [ ] Check workspace exists:
   ```sql
   SELECT * FROM workspaces WHERE id = 'workspace-456';
   ```
3. [ ] Check RLS policies allow the query
4. [ ] Verify UUID format matches exactly

### Issue: Page Doesn't Refresh After Switch

**Check:**
1. [ ] Browser console for errors
2. [ ] `router.refresh()` being called:
   ```javascript
   // In WorkspaceSwitcherDropdown.tsx
   console.log('About to call router.refresh()');
   router.refresh();
   ```
3. [ ] Network tab shows request after switch

**If Not Refreshing:**
```javascript
// Manually trigger in console:
window.location.reload();
```

## Step-by-Step Debugging Flow

### When Switch Doesn't Work

**Step 1: Did the API request get made?**
- Open Network tab
- Look for `/api/workspaces/select`
- If not there: UI not calling API

**Step 2: What's the response status?**
- If 401: User not authenticated
- If 403: User not member of workspace
- If 404: Workspace doesn't exist
- If 500: Server error

**Step 3: Is the cookie being set?**
- Check Response Headers for `Set-Cookie`
- Check Cookies tab for `active_workspace`

**Step 4: Is the page refreshing?**
- Check Network tab for new page request after API response
- If not: `router.refresh()` not being called

**Step 5: Does server see the cookie?**
- Check server logs for `[AUTH]` messages
- Should show workspace resolved via `cookie_active_workspace`

**Step 6: Does server validate membership?**
- Should see validation success in logs
- If fails: User not in `users_workspaces` table

### When Page Has Wrong Workspace

**Step 1: What workspace ID is in the cookie?**
```javascript
// Console:
document.cookie.split('; ').find(c => c.startsWith('active_workspace'))
```

**Step 2: Is the server reading it?**
- Check server logs
- Should show: `[AUTH] User ... resolved via cookie_active_workspace: ...`

**Step 3: Is server validating correctly?**
- Check if user is actually member of that workspace:
  ```sql
  SELECT * FROM users_workspaces WHERE workspace_id = 'cookie-workspace';
  ```

**Step 4: Is database primary overriding?**
- Server might have found primary first
- Check logs for `resolved via database_primary`

## Quick Test Commands

### Browser Console

```javascript
// View all cookies
document.cookie

// Check specific cookie
document.cookie.split('; ').find(c => c.startsWith('active_workspace'))

// Test API
fetch('/api/workspaces/select', {
  method: 'POST',
  body: JSON.stringify({ workspace_id: 'WORKSPACE_ID' })
}).then(r => r.json()).then(console.log)

// Manually read cookie value
new URLSearchParams(new URLSearchParams(document.cookie.split('; ').find(c => c.startsWith('active_workspace'))).toString()).get('value')

// Trigger page refresh
location.reload()
```

### SQL Queries (In Database Tool)

```sql
-- See user's workspaces
SELECT w.*, uw.role FROM workspaces w
LEFT JOIN users_workspaces uw ON w.id = uw.workspace_id
WHERE w.owner_id = 'USER_ID' OR uw.user_id = 'USER_ID';

-- Check if user is member
SELECT * FROM users_workspaces 
WHERE user_id = 'USER_ID' AND workspace_id = 'WORKSPACE_ID';

-- See recent switches
SELECT * FROM audit_events 
WHERE action_type = 'workspace_switch'
ORDER BY created_at DESC LIMIT 10;
```

### Server CLI

```bash
# Grep for auth errors
pnpm dev 2>&1 | grep "\[AUTH\]"

# Watch specific user
pnpm dev 2>&1 | grep "USER_ID"

# Watch all errors
pnpm dev 2>&1 | grep -E "\[ERROR\]|\[WARN\]"
```

## Healthy System Indicators

When everything is working correctly, you should see:

✅ **Cookies Tab:**
- `active_workspace` cookie visible
- HttpOnly: yes
- Secure: yes  
- SameSite: Lax
- Path: /

✅ **Network Tab (POST request):**
- `/api/workspaces/select` returns 200
- Response has `Set-Cookie` header
- Request body has valid workspace_id

✅ **Server Logs:**
```
[AUTH] User [id] resolved via cookie_active_workspace: [workspace-id]
```

✅ **Page Behavior:**
- Dropdown shows "Switching..." briefly
- Page refreshes
- New workspace data appears
- No console errors

## Still Stuck?

**Collect This Info:**
1. Network request/response (screenshot)
2. Cookie details (screenshot from DevTools)
3. Server log output (paste)
4. Browser console errors (screenshot)
5. Database query results (paste)

Then check the [full testing guide](WORKSPACE_SWITCHER_TESTING_GUIDE.md) for comprehensive troubleshooting.
