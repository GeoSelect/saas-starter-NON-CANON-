# 🔐 CCP-06 Authentication Guide

Your app uses **Supabase session-based cookie authentication**, not Bearer tokens.

---

## How Your App Authenticates

### Route Handler (Cookie-Based)

```typescript
// app/api/workspaces/[id]/branded-reports/route.ts
const cookieStore = await cookies();
const client = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) { /* ... */ },
    },
  }
);

const { data: { user } } = await client.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

**Key Point**: Routes read authentication from **HTTP cookies**, not `Authorization: Bearer` header.

---

## Testing Options

### Option 1: Session Cookies (Most Realistic) ✅ Recommended

This mimics how real users authenticate.

#### Step 1: Get session cookie from browser

```bash
# 1. Open app in browser
http://localhost:3000

# 2. Sign in with your account

# 3. Open DevTools → Application → Cookies

# 4. Find: sb-[YOUR_PROJECT_ID]-auth-token

# 5. Copy the value (full cookie string)
```

#### Step 2: Export cookie for testing

**Option A: Environment variable**
```powershell
$env:SUPABASE_SESSION_COOKIE = "eyJhbGc...full_cookie_value...xyz"
pwsh smoke-test-auth.ps1 -UseCookies
```

**Option B: File**
```powershell
# Save cookie to file
"eyJhbGc...full_cookie_value...xyz" | Out-File cookies.txt

# Run test (auto-reads cookies.txt)
pwsh smoke-test-auth.ps1 -UseCookies
```

#### Step 3: Run smoke test
```powershell
pwsh smoke-test-auth.ps1 -UseCookies
```

**Pros**:
- ✅ Tests real authentication flow
- ✅ Uses same auth as frontend
- ✅ Validates cookie handling in routes

**Cons**:
- ⚠️ Cookie expires (need to refresh periodically)
- ⚠️ Manual export required

---

### Option 2: Bearer JWT Token (Easier for Testing)

This requires adding a temporary dev endpoint.

#### Step 1: Add token exchange endpoint (optional, dev-only)

```typescript
// app/api/dev/get-token.ts (dev-only endpoint)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Security: Only in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const { email, password } = await request.json();

    const cookieStore = await cookies();
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      user: data.user,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

#### Step 2: Get token via API

```powershell
# Call dev endpoint with credentials
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/dev/get-token" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body @{ email = "your@email.com"; password = "password" } | ConvertFrom-Json

$token = $response.access_token
pwsh smoke-test-auth.ps1 -Token $token
```

#### Step 3: Run smoke test
```powershell
pwsh smoke-test-auth.ps1 -Token "eyJhbGc...token_value...xyz"
```

**Pros**:
- ✅ No manual cookie export
- ✅ Automated in CI/CD
- ✅ Can set long expiration

**Cons**:
- ⚠️ Requires extra endpoint
- ⚠️ Tests Bearer auth (not actual cookie flow)

---

### Option 3: Supabase Admin API (Bypass Auth)

For integration testing without UI login.

```bash
# Get service role JWT (from Supabase dashboard)
curl -X POST "https://[PROJECT].supabase.co/auth/v1/users" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","email_confirm":true}'
```

---

## Which Option Should You Use?

| Option | Use Case | Effort | Realism |
|--------|----------|--------|---------|
| **Option 1: Cookies** | Manual testing, smoke test | Medium | ⭐⭐⭐⭐⭐ |
| **Option 2: Bearer JWT** | CI/CD pipelines | High | ⭐⭐⭐ |
| **Option 3: Service Role** | Integration tests | Low | ⭐⭐ |

### Recommendation
- **Manual smoke test**: Option 1 (cookies) ← Most realistic
- **Automated tests**: Option 2 or 3 (bearer/service role)

---

## Smoke Test Scripts

### smoke-test-auth.ps1 (Supports both methods)

```powershell
# With session cookies
pwsh smoke-test-auth.ps1 -UseCookies

# With Bearer token
pwsh smoke-test-auth.ps1 -Token "YOUR_JWT_TOKEN"

# Custom settings
pwsh smoke-test-auth.ps1 -Token "YOUR_TOKEN" -WorkspaceId "my-ws" -BaseUrl "http://localhost:3001"
```

**Features**:
- ✅ Detects auth method (cookies or bearer)
- ✅ Explains which auth approach is being used
- ✅ Clear error messages
- ✅ Debugging tips

---

## Troubleshooting

### "Unauthorized" (401)

**Cause**: Invalid or expired session/token

**Fix**:
1. **Cookies**: Re-export fresh session cookie from browser
   ```powershell
   $env:SUPABASE_SESSION_COOKIE = "NEW_COOKIE_VALUE"
   pwsh smoke-test-auth.ps1 -UseCookies
   ```

2. **Bearer**: Get fresh JWT from dev endpoint
   ```powershell
   $token = "NEW_TOKEN_VALUE"
   pwsh smoke-test-auth.ps1 -Token $token
   ```

### "Forbidden" (403)

**Cause**: User exists but isn't admin of workspace

**Fix**:
- Make sure test user is admin: `SELECT role FROM workspace_members WHERE user_id = '...'`
- Or create new admin user: `UPDATE workspace_members SET role = 'admin' WHERE ...`

### Can't send Cookie header in PowerShell

PowerShell's `Invoke-WebRequest` doesn't expose raw Cookie headers easily.

**Solutions**:
1. Use Bearer token instead (Option 2)
2. Use bash/curl (easier for cookies):
   ```bash
   curl -b "sb-[PROJECT_ID]-auth-token=YOUR_COOKIE_VALUE" \
     http://localhost:3000/api/workspaces/test/branded-reports
   ```
3. Use C# `HttpClient` with `CookieContainer`

---

## How Routes Actually Read Auth

### Current Implementation (Cookie-Based)

```typescript
// ✅ CORRECT: Reads from cookies (your current implementation)
const { data: { user } } = await client.auth.getUser();
// Supabase reads cookies automatically from request
```

### If You Wanted Bearer Auth

```typescript
// ❌ This would require Bearer tokens instead of cookies
const { data: { user } } = await client.auth.getUser();
// Would still read from cookies, but you could also parse Authorization header:
const token = request.headers.get("Authorization")?.replace("Bearer ", "");
const { data: { user }, error } = await client.auth.getUser({ token });
```

---

## Summary

| Aspect | Current | Testing |
|--------|---------|---------|
| **Auth Type** | Supabase Session Cookies | Use same (cookies) or Bearer JWT |
| **How Routes Verify** | Read cookies from request | Send cookies or Bearer token |
| **Smoke Test** | `smoke-test-auth.ps1` | Supports both methods |
| **Best for manual testing** | Session cookies (realistic) | ✅ Use Option 1 |
| **Best for CI/CD** | Bearer JWT (automated) | ✅ Use Option 2 |

---

## Quick Start

### Session Cookies (Recommended for Manual Testing)
```bash
# 1. Get cookie from browser
Open DevTools → Application → Cookies → Copy sb-...-auth-token

# 2. Export
$env:SUPABASE_SESSION_COOKIE = "PASTE_HERE"

# 3. Run test
pwsh smoke-test-auth.ps1 -UseCookies
```

### Bearer Token (For CI/CD)
```bash
# 1. Create dev endpoint (see above)

# 2. Get token
$token = (Invoke-WebRequest -Uri "http://localhost:3000/api/dev/get-token" ...).access_token

# 3. Run test
pwsh smoke-test-auth.ps1 -Token $token
```

---

**Status**: Your app correctly uses cookie-based auth. Test scripts support both cookies and Bearer tokens.
