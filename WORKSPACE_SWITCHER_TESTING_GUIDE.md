# WorkspaceSwitcher + Server Auth Context - Testing Guide

## Overview

This guide covers testing the complete flow from workspace selection in the UI through cookie validation to server-side context resolution.

## Test Flow Diagram

```
User selects workspace in dropdown
  ↓ (WorkspaceSwitcherDropdown onChange)
  ↓ selectWorkspace(workspaceId) called
  ↓ (workspace-client.ts)
  ↓ POST /api/workspaces/select with { workspace_id }
  ↓ (Server validates + sets cookie)
  ↓ Response: { success: true, workspace_id }
  ↓ router.refresh() called
  ↓ Server components re-render
  ↓ getAuthContextServerSide() reads cookie
  ↓ validateWorkspaceMembership() checks DB
  ↓ Page renders with new workspace context
  ↓ Success! User sees workspace switched
```

## Manual Testing (Start Here)

### Setup
1. Start your dev server: `pnpm dev`
2. Log in with a test account
3. Ensure you have at least 2 workspaces

### Test 1: Basic Workspace Switch

**Steps:**
1. Navigate to `/dashboard/audit` (Account Console)
2. Look for workspace switcher in header
3. Note current active workspace
4. Select a different workspace from dropdown

**Expected Results:**
- ✅ Dropdown shows list of all workspaces
- ✅ Current workspace is pre-selected
- ✅ "Switching..." indicator appears briefly
- ✅ Page refreshes
- ✅ Header shows new workspace
- ✅ Account Console displays new workspace details

**Verify in Browser DevTools:**

Open **Application → Cookies**:
- ✅ `active_workspace` cookie exists
- ✅ Cookie value = selected workspace ID
- ✅ Cookie has `HttpOnly` flag (can't see value in console)
- ✅ Cookie has `Secure` flag (HTTPS only in production)
- ✅ Cookie `Path` = `/`
- ✅ Cookie `SameSite` = `Lax`

### Test 2: Cookie Persistence

**Steps:**
1. Switch to workspace A
2. Verify cookie is set (DevTools → Application)
3. Hard refresh page (Ctrl+Shift+R or Cmd+Shift+R)
4. Verify page still shows workspace A

**Expected Results:**
- ✅ Cookie persists across page refresh
- ✅ Server reads cookie on page load
- ✅ Server validates membership
- ✅ Page loads with workspace A context

### Test 3: Invalid Cookie Handling

**Steps:**
1. Open DevTools → Application → Cookies
2. Manually edit `active_workspace` cookie to invalid ID: `invalid-workspace-id`
3. Hard refresh page

**Expected Results:**
- ✅ Server detects invalid workspace
- ✅ Server logs warning: `[AUTH] Security: User ... has invalid active_workspace cookie`
- ✅ Page either:
   - Falls back to primary workspace, OR
   - Redirects to workspace selection, OR
   - Shows error message
- ✅ Invalid cookie doesn't cause server crash

**Check Logs:**
```
[AUTH] Security: User abc123 has invalid active_workspace cookie: invalid-workspace-id (not a member)
```

### Test 4: Membership Validation

**Steps:**
1. Get another user's workspace ID
2. Manually set `active_workspace` cookie to that workspace ID
3. Hard refresh

**Expected Results:**
- ✅ Server rejects access
- ✅ Page redirects to workspace selection or shows error
- ✅ Server logs security warning
- ✅ No data leak

### Test 5: Missing Cookie (New User/New Browser)

**Steps:**
1. Delete all cookies for the site
2. Hard refresh dashboard page

**Expected Results:**
- ✅ Server falls back to primary workspace from database
- ✅ Page loads with user's default workspace
- ✅ Cookie is set for future requests
- ✅ No errors shown to user

### Test 6: Multiple Workspaces

**Steps:**
1. Have user with 3+ workspaces
2. Switch through each workspace
3. Verify each switch works correctly

**Expected Results:**
- ✅ All workspaces appear in dropdown
- ✅ Each switch sets correct cookie
- ✅ Each switch validates membership
- ✅ Page data updates for each workspace

## Integration Tests (Code Level)

### Test Auth Context Resolution

```typescript
// __tests__/lib/auth/server-context.test.ts
import { getAuthContextServerSide } from '@/lib/auth/server-context';

describe('getAuthContextServerSide', () => {
  test('returns user from session', async () => {
    const request = createMockRequest({
      session: { user: { id: 'user-123', email: 'test@example.com' } }
    });

    const context = await getAuthContextServerSide(request);

    expect(context.user).toBeDefined();
    expect(context.user?.id).toBe('user-123');
  });

  test('resolves workspace from database primary', async () => {
    const request = createMockRequest({
      session: { user: { id: 'user-123' } }
    });

    const context = await getAuthContextServerSide(request);

    expect(context.workspaceId).toBeDefined();
    expect(context.source).toBe('database_primary');
  });

  test('resolves workspace from active_workspace cookie', async () => {
    const request = createMockRequest({
      session: { user: { id: 'user-123' } },
      cookies: { active_workspace: 'workspace-456' }
    });

    const context = await getAuthContextServerSide(request);

    expect(context.workspaceId).toBe('workspace-456');
    expect(context.source).toBe('cookie_active_workspace');
  });

  test('rejects invalid workspace cookie', async () => {
    const request = createMockRequest({
      session: { user: { id: 'user-123' } },
      cookies: { active_workspace: 'invalid-workspace' }
    });

    // Mock validateWorkspaceMembership to return false
    mockValidateMembership.mockResolvedValueOnce(false);

    const context = await getAuthContextServerSide(request);

    // Should fall back to primary or return null
    expect(context.workspaceId).not.toBe('invalid-workspace');
  });

  test('respects dev query param only in development', async () => {
    process.env.NODE_ENV = 'development';
    
    const request = createMockRequest({
      session: { user: { id: 'user-123' } },
      url: 'http://localhost:3000/page?workspace=dev-workspace'
    });

    const context = await getAuthContextServerSide(request);

    expect(context.source).toBe('dev_query_param');
  });

  test('ignores dev param in production', async () => {
    process.env.NODE_ENV = 'production';
    
    const request = createMockRequest({
      session: { user: { id: 'user-123' } },
      url: 'http://example.com/page?workspace=dev-workspace'
    });

    const context = await getAuthContextServerSide(request);

    expect(context.source).not.toBe('dev_query_param');
  });
});
```

### Test Workspace Switcher Component

```typescript
// __tests__/components/WorkspaceSwitcherDropdown.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkspaceSwitcherDropdown from '@/components/WorkspaceSwitcherDropdown';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn()
  })
}));

describe('WorkspaceSwitcherDropdown', () => {
  test('renders select element with workspaces', async () => {
    render(<WorkspaceSwitcherDropdown />);

    const select = screen.getByLabelText('Select workspace');
    expect(select).toBeInTheDocument();
  });

  test('calls selectWorkspace on workspace change', async () => {
    const mockSelectWorkspace = jest.fn();

    render(<WorkspaceSwitcherDropdown />);

    const select = screen.getByLabelText('Select workspace');
    fireEvent.change(select, { target: { value: 'workspace-2' } });

    await waitFor(() => {
      expect(mockSelectWorkspace).toHaveBeenCalledWith('workspace-2');
    });
  });

  test('shows loading state while switching', async () => {
    render(<WorkspaceSwitcherDropdown />);

    const select = screen.getByLabelText('Select workspace');
    fireEvent.change(select, { target: { value: 'workspace-2' } });

    await waitFor(() => {
      expect(screen.getByText('Switching…')).toBeInTheDocument();
    });
  });

  test('calls router.refresh after switch', async () => {
    const mockRouter = { refresh: jest.fn() };
    jest.mock('next/navigation', () => ({
      useRouter: () => mockRouter
    }));

    render(<WorkspaceSwitcherDropdown />);

    const select = screen.getByLabelText('Select workspace');
    fireEvent.change(select, { target: { value: 'workspace-2' } });

    await waitFor(() => {
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  test('displays error state on failure', async () => {
    // Mock selectWorkspace to throw error
    jest.mock('@/lib/workspace-client', () => ({
      selectWorkspace: jest.fn().mockRejectedValueOnce(
        new Error('Switch failed')
      )
    }));

    render(<WorkspaceSwitcherDropdown />);

    const select = screen.getByLabelText('Select workspace');
    fireEvent.change(select, { target: { value: 'workspace-2' } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to load workspaces');
    });
  });
});
```

### Test API Endpoint

```typescript
// __tests__/api/workspaces/select.test.ts
import { POST } from '@/app/api/workspaces/select/route';

describe('POST /api/workspaces/select', () => {
  test('sets active_workspace cookie on success', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { workspace_id: 'workspace-123' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Check cookie header
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('active_workspace=workspace-123');
    expect(setCookie).toContain('HttpOnly');
  });

  test('returns 401 if user not authenticated', async () => {
    const request = createMockRequest({
      session: null,
      body: { workspace_id: 'workspace-123' }
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  test('returns 403 if user not member', async () => {
    const request = createMockRequest({
      session: { user: { id: 'user-123' } },
      body: { workspace_id: 'workspace-not-member' }
    });

    mockValidateMembership.mockResolvedValueOnce(false);

    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  test('returns 404 if workspace not found', async () => {
    const request = createMockRequest({
      session: { user: { id: 'user-123' } },
      body: { workspace_id: 'nonexistent-workspace' }
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
  });

  test('logs audit event WORKSPACE_SWITCH', async () => {
    const mockInsertAudit = jest.fn();

    const request = createMockRequest({
      session: { user: { id: 'user-123' } },
      body: { workspace_id: 'workspace-456' }
    });

    await POST(request);

    expect(mockInsertAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: 'workspace_switch'
      })
    );
  });
});
```

## End-to-End Testing (Playwright/Cypress)

```typescript
// e2e/workspace-switcher.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Workspace Switcher', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard/audit');
  });

  test('should switch workspaces', async ({ page }) => {
    // Get initial workspace
    const initialWorkspace = await page
      .locator('[aria-label="Select workspace"]')
      .inputValue();

    // Open dropdown and select different workspace
    await page.click('[aria-label="Select workspace"]');
    const secondWorkspace = await page
      .locator('option')
      .nth(1)
      .textContent();

    await page.selectOption('[aria-label="Select workspace"]', secondWorkspace!);

    // Verify loading state
    expect(await page.locator('text=Switching…').isVisible()).toBeTruthy();

    // Wait for page to refresh
    await page.waitForLoadState('networkidle');

    // Verify new workspace is selected
    const selectedWorkspace = await page
      .locator('[aria-label="Select workspace"]')
      .inputValue();

    expect(selectedWorkspace).not.toBe(initialWorkspace);
  });

  test('should persist workspace across page reload', async ({ page }) => {
    // Switch workspace
    await page.click('[aria-label="Select workspace"]');
    await page.selectOption('[aria-label="Select workspace"]', '1');

    // Get workspace value
    const workspace = await page
      .locator('[aria-label="Select workspace"]')
      .inputValue();

    // Hard refresh
    await page.reload({ waitUntil: 'networkidle' });

    // Verify same workspace
    const reloadedWorkspace = await page
      .locator('[aria-label="Select workspace"]')
      .inputValue();

    expect(reloadedWorkspace).toBe(workspace);
  });

  test('should set httpOnly cookie', async ({ page, context }) => {
    // Switch workspace
    await page.selectOption('[aria-label="Select workspace"]', '1');
    await page.waitForLoadState('networkidle');

    // Get cookies
    const cookies = await context.cookies();
    const activeWorkspaceCookie = cookies.find(c => c.name === 'active_workspace');

    expect(activeWorkspaceCookie).toBeDefined();
    expect(activeWorkspaceCookie?.httpOnly).toBe(true);
    expect(activeWorkspaceCookie?.secure).toBe(true); // In HTTPS
    expect(activeWorkspaceCookie?.sameSite).toBe('Lax');
  });

  test('should show account console with correct workspace', async ({ page }) => {
    const workspace = await page
      .locator('text=Active Workspace').locator('..').locator('h3')
      .textContent();

    const selectedWorkspace = await page
      .locator('[aria-label="Select workspace"] option:checked')
      .textContent();

    expect(workspace).toContain(selectedWorkspace!);
  });

  test('should handle switch errors gracefully', async ({ page }) => {
    // Intercept and fail the API call
    await page.route('/api/workspaces/select', route => {
      route.abort('failed');
    });

    // Try to switch workspace
    await page.selectOption('[aria-label="Select workspace"]', '1');

    // Should show error (component implementation dependent)
    await page.waitForTimeout(1000);

    // Verify page is still functional
    expect(await page.locator('[aria-label="Select workspace"]').isEnabled()).toBeTruthy();
  });
});
```

## Debugging Checklist

When something doesn't work, check:

### 1. Cookie Not Being Set
- [ ] API endpoint `/api/workspaces/select` being called?
- [ ] Check Network tab → Response headers for `Set-Cookie`
- [ ] Is response status 200?
- [ ] Check server logs for errors

### 2. Cookie Not Being Sent with Requests
- [ ] Check Network tab → Request headers for `Cookie: active_workspace=...`
- [ ] Is cookie's `Domain` correct?
- [ ] Is `Path` set to `/`?
- [ ] Is cookie expired? Check `Max-Age` or `Expires`

### 3. Server Not Reading Cookie
- [ ] Add debug log: `console.log('Cookies:', request.headers.get('cookie'))`
- [ ] Is `getActiveWorkspaceFromCookie()` being called?
- [ ] Check server logs for `[AUTH]` messages

### 4. Membership Validation Failing
- [ ] Verify user exists in `users_workspaces` table
- [ ] Check workspace_id matches exactly (UUID format)
- [ ] Is RLS policy allowing the query?

### 5. Source Not What Expected
- [ ] Check server logs: `[AUTH] User ... resolved via ...`
- [ ] Is database primary lookup working?
- [ ] Does cookie exist and is valid?
- [ ] Is dev query param being used?

## Logging Commands

### Server Logs
```bash
# Watch auth logs
tail -f logs/auth.log | grep "\[AUTH\]"

# Watch all logs
pnpm dev 2>&1 | grep -E "\[AUTH\]|\[ERROR\]"
```

### Browser Console (Client Side)
```javascript
// Check if cookie exists
document.cookie

// Parse active_workspace
document.cookie.split('; ').find(row => row.startsWith('active_workspace'))

// Simulate API call
fetch('/api/workspaces/select', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ workspace_id: 'YOUR_WORKSPACE_ID' })
}).then(r => r.json()).then(console.log)
```

### Database Validation
```sql
-- Check user's workspaces
SELECT * FROM workspaces WHERE owner_id = 'user-id' OR id IN (
  SELECT workspace_id FROM users_workspaces WHERE user_id = 'user-id'
);

-- Check workspace membership
SELECT * FROM users_workspaces 
WHERE user_id = 'user-id' AND workspace_id = 'workspace-id';

-- Check recent audit events
SELECT * FROM audit_events 
WHERE user_id = 'user-id' AND action_type = 'workspace_switch'
ORDER BY created_at DESC LIMIT 10;
```

## Test Checklist

- [ ] Basic workspace switch works
- [ ] Cookie is set with correct flags (HttpOnly, Secure, SameSite)
- [ ] Cookie persists across page reload
- [ ] Invalid cookie is rejected with security warning
- [ ] Unauthorized workspace access is blocked
- [ ] Missing cookie falls back to primary workspace
- [ ] Multiple workspace switches work in sequence
- [ ] Audit log records WORKSPACE_SWITCH event
- [ ] Server logs show correct resolution source
- [ ] Error states are handled gracefully
- [ ] Dev query param works in development
- [ ] Dev query param is ignored in production
- [ ] Page data updates for new workspace
- [ ] Account Console shows correct workspace
- [ ] Workspace settings are workspace-scoped
- [ ] Team members are workspace-scoped
- [ ] Activity log is workspace-scoped

## Summary

The complete flow is:
1. **UI**: User selects workspace in dropdown
2. **Client**: Calls `selectWorkspace()` → POST to API
3. **Server**: Validates membership → Sets httpOnly cookie
4. **Client**: Calls `router.refresh()`
5. **Server Components**: Call `getAuthContextServerSide()`
6. **Server**: Reads cookie → Validates → Returns workspace context
7. **Page**: Renders with new workspace data
8. **Audit**: `WORKSPACE_SWITCH` event logged

Each layer is independently testable and validates the next layer.
