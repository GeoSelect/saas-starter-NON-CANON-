#!/usr/bin/env pwsh

Write-Host "🚀 Testing CCP-06 Branded Reports Endpoints" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Wait for server to start
Write-Host "`n⏳ Waiting for dev server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Test endpoints
$baseUrl = "http://localhost:3000"
$endpoints = @(
    @{ Method = "GET"; Path = "/api/workspaces/test/branded-reports"; Desc = "List all branded reports" },
    @{ Method = "POST"; Path = "/api/workspaces/test/branded-reports"; Desc = "Create branded report" }
)

foreach ($endpoint in $endpoints) {
    Write-Host "`n📌 Testing: $($endpoint.Desc)" -ForegroundColor Cyan
    Write-Host "   $($endpoint.Method) $baseUrl$($endpoint.Path)" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$($endpoint.Path)" -Method $endpoint.Method -ErrorAction Stop
        Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Response: $($response.Content | ConvertFrom-Json | ConvertTo-Json)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   ⚠️  Status: $statusCode" -ForegroundColor Yellow
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $content = $reader.ReadToEnd()
            Write-Host "   Response: $content" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n✅ Test Complete!" -ForegroundColor Green
