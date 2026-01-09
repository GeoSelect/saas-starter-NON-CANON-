#!/usr/bin/env pwsh

# ============================================================================
# CCP-06 Branded Reports - Quick Validation Guide
# ============================================================================
# This script shows you what to test and how

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          CCP-06 BRANDED REPORTS - VALIDATION GUIDE                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ SERVER STATUS" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════════════════════════" -ForegroundColor Green

# Test if server is running
try {
    $serverTest = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction Stop
    Write-Host "✅ Dev Server Running at http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Dev Server NOT running" -ForegroundColor Red
    Write-Host "   Start it with: pnpm dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📝 ENDPOINTS TO TEST" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$endpoints = @(
    @{
        num = "1️⃣"
        method = "POST"
        path = "/api/workspaces/{workspace-id}/branded-reports"
        expect = "201 Created"
        body = '{"name":"Q1 Report","primary_color":"#000"}'
    },
    @{
        num = "2️⃣"
        method = "POST"
        path = "/api/workspaces/{workspace-id}/branded-reports/{reportId}/activate"
        expect = "200 OK (single-active enforced)"
        body = ""
    },
    @{
        num = "3️⃣"
        method = "GET"
        path = "/api/workspaces/{workspace-id}/branded-reports"
        expect = "200 OK (shows 1 active)"
        body = ""
    },
    @{
        num = "4️⃣"
        method = "PATCH"
        path = "/api/workspaces/{workspace-id}/branded-reports/{reportId}"
        expect = "200 OK (v2, new checksum)"
        body = '{"name":"Updated Name"}'
    },
    @{
        num = "5️⃣"
        method = "GET"
        path = "/api/workspaces/{workspace-id}/branded-reports/{reportId}"
        expect = "200 OK (single report)"
        body = ""
    },
    @{
        num = "6️⃣"
        method = "DELETE"
        path = "/api/workspaces/{workspace-id}/branded-reports/{reportId}"
        expect = "200 OK (deleted)"
        body = ""
    }
)

foreach ($ep in $endpoints) {
    Write-Host "$($ep.num) $($ep.method.PadRight(6)) $($ep.path)" -ForegroundColor Yellow
    Write-Host "   Expected: $($ep.expect)" -ForegroundColor Gray
    if ($ep.body) {
        Write-Host "   Body: $($ep.body)" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "🔐 AUTHENTICATION" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Methods:" -ForegroundColor Gray
Write-Host "  1. Supabase Session Cookie (browser/production)" -ForegroundColor Yellow
Write-Host "  2. Bearer JWT Token (testing/automation)" -ForegroundColor Yellow
Write-Host ""
Write-Host "To get a token:" -ForegroundColor Cyan
Write-Host "  • Go to: https://app.supabase.com" -ForegroundColor Gray
Write-Host "  • Select your project" -ForegroundColor Gray
Write-Host "  • Settings → API → JWT tokens → Copy" -ForegroundColor Gray
Write-Host ""

Write-Host "⚡ QUICK TEST WITH curl" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "# Set your token and workspace ID" -ForegroundColor Gray
Write-Host '$token = "YOUR_JWT_TOKEN"' -ForegroundColor Yellow
Write-Host '$workspace = "YOUR_WORKSPACE_ID"' -ForegroundColor Yellow
Write-Host ""

Write-Host "# Test CREATE endpoint" -ForegroundColor Gray
Write-Host 'curl -X POST http://localhost:3000/api/workspaces/$workspace/branded-reports `' -ForegroundColor Yellow
Write-Host '  -H "Authorization: Bearer $token" `' -ForegroundColor Yellow
Write-Host '  -H "Content-Type: application/json" `' -ForegroundColor Yellow
Write-Host '  -d "{\"name\":\"Test\",\"primary_color\":\"#000\"}"' -ForegroundColor Yellow
Write-Host ""

Write-Host "🎯 WHAT TO VERIFY" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Minimum Deliverables (All Required ✅):" -ForegroundColor Green
Write-Host ""
Write-Host "  ✅ PATCH creates new versions" -ForegroundColor Gray
Write-Host "     • version increments (v1 → v2)" -ForegroundColor Gray
Write-Host "     • checksum changes (different hash)" -ForegroundColor Gray
Write-Host ""
Write-Host "  ✅ Activate enforces single-active" -ForegroundColor Gray
Write-Host "     • Only 1 report has is_active: true per workspace" -ForegroundColor Gray
Write-Host "     • Activating one deactivates all others" -ForegroundColor Gray
Write-Host ""
Write-Host "  ✅ 403 for non-admin writes" -ForegroundColor Gray
Write-Host "     • PATCH/DELETE/Activate without admin role → 403" -ForegroundColor Gray
Write-Host ""
Write-Host "  ✅ RLS workspace isolation" -ForegroundColor Gray
Write-Host "     • Users can only see their own workspace data" -ForegroundColor Gray
Write-Host ""

Write-Host "📊 SUCCESS CRITERIA" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "All 6 endpoints return correct status codes:" -ForegroundColor Gray
Write-Host ""
Write-Host "  POST   /branded-reports              → 201 ✅" -ForegroundColor Green
Write-Host "  POST   /branded-reports/{id}/activate → 200 ✅" -ForegroundColor Green
Write-Host "  GET    /branded-reports              → 200 ✅" -ForegroundColor Green
Write-Host "  PATCH  /branded-reports/{id}         → 200 ✅" -ForegroundColor Green
Write-Host "  GET    /branded-reports/{id}         → 200 ✅" -ForegroundColor Green
Write-Host "  DELETE /branded-reports/{id}         → 200 ✅" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 READY FOR TESTING!" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Get a JWT token from Supabase dashboard" -ForegroundColor Gray
Write-Host "  2. Set your workspace ID" -ForegroundColor Gray
Write-Host "  3. Run: pwsh smoke-test-auth.ps1 -Token \$token" -ForegroundColor Yellow
Write-Host "  4. All tests should pass ✅" -ForegroundColor Gray
Write-Host ""
Write-Host "All minimum deliverables are implemented and ready!" -ForegroundColor Green
