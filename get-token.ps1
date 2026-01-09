#!/usr/bin/env pwsh

# ============================================================================
# Get Auth Token from Supabase (for testing)
# ============================================================================
# This script helps you get a valid auth token for testing
#
# Options:
# 1. Use existing browser session (grab from localStorage)
# 2. Create a test user and sign in
# 3. Use service role key for admin testing
# ============================================================================

Write-Host "🔐 Get Auth Token for CCP-06 Testing" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 1️⃣  - Get existing session from browser:" -ForegroundColor Green
Write-Host ""
Write-Host "   1. Open app in browser: http://localhost:3000" -ForegroundColor Gray
Write-Host "   2. Sign in with your account" -ForegroundColor Gray
Write-Host "   3. Open DevTools → Console" -ForegroundColor Gray
Write-Host "   4. Run this JavaScript:" -ForegroundColor Gray
Write-Host ""
Write-Host '   const session = localStorage.getItem("sb-[PROJECT_ID]-auth-token");' -ForegroundColor Yellow
Write-Host '   console.log(JSON.parse(session).access_token);' -ForegroundColor Yellow
Write-Host ""
Write-Host "   5. Copy the token and pass to smoke test:" -ForegroundColor Gray
Write-Host '   pwsh smoke-test.ps1 -Token "YOUR_TOKEN"' -ForegroundColor Yellow
Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 2️⃣  - Use Service Role Key (Admin)" -ForegroundColor Green
Write-Host ""
Write-Host "   If you have admin access to Supabase:" -ForegroundColor Gray
Write-Host "   1. Get SUPABASE_SERVICE_ROLE_KEY from .env.local" -ForegroundColor Gray
Write-Host "   2. Use as Bearer token:" -ForegroundColor Gray
Write-Host '   pwsh smoke-test.ps1 -Token $env:SUPABASE_SERVICE_ROLE_KEY' -ForegroundColor Yellow
Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 3️⃣  - Get token via API (recommended for CI/CD)" -ForegroundColor Green
Write-Host ""

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseAnonKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

if (-not $supabaseUrl) {
    Write-Host "   ❌ NEXT_PUBLIC_SUPABASE_URL not set in environment" -ForegroundColor Red
    Write-Host "   Set your Supabase credentials in .env.local first" -ForegroundColor Red
    exit 1
}

Write-Host "   Using Supabase project: $supabaseUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "   To sign in a test user and get token, run:" -ForegroundColor Gray
Write-Host ""
Write-Host '   @{' -ForegroundColor Yellow
Write-Host '       email = "test@example.com"' -ForegroundColor Yellow
Write-Host '       password = "TestPassword123!"' -ForegroundColor Yellow
Write-Host '   } | ConvertTo-Json | curl -s -X POST `' -ForegroundColor Yellow
Write-Host '       "$env:NEXT_PUBLIC_SUPABASE_URL/auth/v1/token?grant_type=password" `' -ForegroundColor Yellow
Write-Host '       -H "Content-Type: application/json" `' -ForegroundColor Yellow
Write-Host '       -H "apikey: $env:NEXT_PUBLIC_SUPABASE_ANON_KEY" -d @- | jq .access_token' -ForegroundColor Yellow
Write-Host ""

Write-Host "---" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 For smoke test, you need ONE of:" -ForegroundColor Cyan
Write-Host "   • Valid JWT from Supabase auth" -ForegroundColor Gray
Write-Host "   • Service role key (if admin)" -ForegroundColor Gray
Write-Host "   • Session cookie from signed-in user" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Once you have a token, run:" -ForegroundColor Cyan
Write-Host "   pwsh smoke-test.ps1 -Token 'YOUR_TOKEN_HERE'" -ForegroundColor Yellow
