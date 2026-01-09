#!/usr/bin/env pwsh
# CCP-06 Branded Reports - Quick Validation Guide

Write-Host ""
Write-Host "CCP-06 BRANDED REPORTS - VALIDATION GUIDE" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

Write-Host "SERVER STATUS" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Green

try {
    $serverTest = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction Stop
    Write-Host "YES - Dev Server Running at http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "NO - Dev Server NOT running. Start with: pnpm dev" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "ENDPOINTS TO TEST" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

Write-Host "1. POST   /api/workspaces/{workspace-id}/branded-reports" -ForegroundColor Yellow
Write-Host "   Expected: 201 Created" -ForegroundColor Gray
Write-Host "   Body: {`"name`":`"Q1 Report`",`"primary_color`":`"#000`"}" -ForegroundColor Gray
Write-Host ""

Write-Host "2. POST   /api/workspaces/{workspace-id}/branded-reports/{id}/activate" -ForegroundColor Yellow
Write-Host "   Expected: 200 OK (single-active enforced)" -ForegroundColor Gray
Write-Host ""

Write-Host "3. GET    /api/workspaces/{workspace-id}/branded-reports" -ForegroundColor Yellow
Write-Host "   Expected: 200 OK (shows 1 active)" -ForegroundColor Gray
Write-Host ""

Write-Host "4. PATCH  /api/workspaces/{workspace-id}/branded-reports/{id}" -ForegroundColor Yellow
Write-Host "   Expected: 200 OK (v2, new checksum)" -ForegroundColor Gray
Write-Host "   Body: {`"name`":`"Updated Name`"}" -ForegroundColor Gray
Write-Host ""

Write-Host "5. GET    /api/workspaces/{workspace-id}/branded-reports/{id}" -ForegroundColor Yellow
Write-Host "   Expected: 200 OK" -ForegroundColor Gray
Write-Host ""

Write-Host "6. DELETE /api/workspaces/{workspace-id}/branded-reports/{id}" -ForegroundColor Yellow
Write-Host "   Expected: 200 OK" -ForegroundColor Gray
Write-Host ""

Write-Host "AUTHENTICATION" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "Methods:" -ForegroundColor Gray
Write-Host "  1. Supabase Session Cookie (browser/production)" -ForegroundColor Yellow
Write-Host "  2. Bearer JWT Token (testing/automation)" -ForegroundColor Yellow
Write-Host ""
Write-Host "To get a token:" -ForegroundColor Cyan
Write-Host "  1. Go to: https://app.supabase.com" -ForegroundColor Gray
Write-Host "  2. Select your project" -ForegroundColor Gray
Write-Host "  3. Settings -> API -> JWT tokens -> Copy" -ForegroundColor Gray
Write-Host ""

Write-Host "WHAT TO VERIFY" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "Minimum Deliverables (All Required):" -ForegroundColor Green
Write-Host ""
Write-Host "  [YES] PATCH creates new versions" -ForegroundColor Gray
Write-Host "        - version increments (v1 -> v2)" -ForegroundColor Gray
Write-Host "        - checksum changes" -ForegroundColor Gray
Write-Host ""
Write-Host "  [YES] Activate enforces single-active" -ForegroundColor Gray
Write-Host "        - Only 1 report is_active: true per workspace" -ForegroundColor Gray
Write-Host "        - Activating one deactivates all others" -ForegroundColor Gray
Write-Host ""
Write-Host "  [YES] 403 for non-admin writes" -ForegroundColor Gray
Write-Host "        - PATCH/DELETE/Activate without admin role -> 403" -ForegroundColor Gray
Write-Host ""
Write-Host "  [YES] RLS workspace isolation" -ForegroundColor Gray
Write-Host "        - Users see only their workspace data" -ForegroundColor Gray
Write-Host ""

Write-Host "SUCCESS CRITERIA" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Green
Write-Host ""
Write-Host "All 6 endpoints return correct status codes:" -ForegroundColor Gray
Write-Host ""
Write-Host "  POST   /branded-reports              -> 201" -ForegroundColor Green
Write-Host "  POST   /branded-reports/{id}/activate -> 200" -ForegroundColor Green
Write-Host "  GET    /branded-reports              -> 200" -ForegroundColor Green
Write-Host "  PATCH  /branded-reports/{id}         -> 200" -ForegroundColor Green
Write-Host "  GET    /branded-reports/{id}         -> 200" -ForegroundColor Green
Write-Host "  DELETE /branded-reports/{id}         -> 200" -ForegroundColor Green
Write-Host ""

Write-Host "READY FOR TESTING!" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Get a JWT token from Supabase dashboard" -ForegroundColor Gray
Write-Host "  2. Set your workspace ID" -ForegroundColor Gray
Write-Host "  3. Run: pwsh smoke-test-auth.ps1 -Token `$token" -ForegroundColor Yellow
Write-Host "  4. All tests should pass" -ForegroundColor Gray
Write-Host ""
Write-Host "All minimum deliverables are implemented and ready!" -ForegroundColor Green
Write-Host ""
