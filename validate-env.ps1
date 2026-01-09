#!/usr/bin/env pwsh

# ============================================================================
# CCP-06 Environment Validator
# ============================================================================
# Checks that everything is ready for smoke testing
# ============================================================================

Write-Host "✅ CCP-06 Environment Validator" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# 1. Check dev server is running
Write-Host "1️⃣  Checking dev server..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Dev server running on port 3000" -ForegroundColor Green
} catch {
    $errors += "Dev server not running. Run: pnpm dev"
}

# 2. Check API routes are accessible
Write-Host "2️⃣  Checking API routes..." -ForegroundColor Gray

$testRoutes = @(
    "/api/workspaces/test/branded-reports",
    "/api/workspaces/test/branded-reports/test-id",
    "/api/workspaces/test/branded-reports/test-id/activate"
)

foreach ($route in $testRoutes) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000$route" -TimeoutSec 2 -ErrorAction Stop
        # 401 is OK (means route exists but needs auth)
        Write-Host "   ✅ $route (responds, needs auth)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "   ✅ $route (responds, needs auth)" -ForegroundColor Green
        } elseif ($statusCode -eq 404) {
            $errors += "Route not found: $route"
        } else {
            Write-Host "   ⚠️  $route (status: $statusCode)" -ForegroundColor Yellow
        }
    }
}

# 3. Check environment variables
Write-Host "3️⃣  Checking environment..." -ForegroundColor Gray

$envVars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
)

foreach ($var in $envVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "User")
    if ($value) {
        Write-Host "   ✅ $var is set" -ForegroundColor Green
    } else {
        $warnings += "$var not set (needed for auth)"
    }
}

# 4. Check Node/npm
Write-Host "4️⃣  Checking tools..." -ForegroundColor Gray

try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    $errors += "Node.js not installed or not in PATH"
}

try {
    $npmVersion = npm --version
    Write-Host "   ✅ npm $npmVersion" -ForegroundColor Green
} catch {
    $errors += "npm not installed or not in PATH"
}

# 5. Check auth token
Write-Host "5️⃣  Checking authentication..." -ForegroundColor Gray

$token = $env:AUTH_TOKEN
if ($token) {
    Write-Host "   ✅ AUTH_TOKEN is set in environment" -ForegroundColor Green
} else {
    $warnings += "AUTH_TOKEN not set. Run: pwsh get-token.ps1"
}

# 6. Check test files exist
Write-Host "6️⃣  Checking test files..." -ForegroundColor Gray

$files = @(
    "smoke-test.ps1",
    "smoke-test.sh",
    "get-token.ps1",
    "SMOKE-TEST-README.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
    } else {
        $warnings += "$file not found"
    }
}

# Summary
Write-Host ""
Write-Host "📊 Summary" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ All systems ready for smoke testing!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Next step:" -ForegroundColor Cyan
    Write-Host "   pwsh smoke-test.ps1 -Token `"YOUR_TOKEN`"" -ForegroundColor Yellow
    exit 0
}

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Warnings ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "   • $warning" -ForegroundColor Yellow
    }
}

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Errors ($($errors.Count)):" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   • $error" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Fix errors before running smoke test." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Ready to proceed (warnings are non-blocking)" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Run smoke test:" -ForegroundColor Cyan
Write-Host "   pwsh smoke-test.ps1 -Token `"YOUR_TOKEN`"" -ForegroundColor Yellow
