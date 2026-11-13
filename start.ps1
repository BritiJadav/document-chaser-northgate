# Northgate Bank Document Chaser Copilot - Local Launcher
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Northgate Bank Document Chaser Copilot - Local Launcher       " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$backendDir = Join-Path $PSScriptRoot "backend"
$frontendDir = Join-Path $PSScriptRoot "frontend"

$pythonExe = "C:\Python315\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = (Get-Command python -ErrorAction SilentlyContinue).Source
}

# 1. Start or Verify Backend
$backendOk = $false
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get -TimeoutSec 1 2>$null
    if ($res.status -eq "ok") {
        $backendOk = $true
        Write-Host "FastAPI Backend is active on http://127.0.0.1:8000" -ForegroundColor Green
    }
} catch {}

if (-not $backendOk) {
    Write-Host "Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
    Start-Process -FilePath $pythonExe -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory $backendDir
    
    # Wait up to 5 seconds for backend to become ready
    for ($i = 0; $i -lt 10; $i++) {
        Start-Sleep -Milliseconds 500
        try {
            $check = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get -TimeoutSec 1 2>$null
            if ($check.status -eq "ok") {
                $backendOk = $true
                Write-Host "Backend started successfully!" -ForegroundColor Green
                break
            }
        } catch {}
    }
}

# 2. Start Frontend
Write-Host "`nStarting Vite React Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $frontendDir

Start-Sleep -Seconds 3

Write-Host "`nOpening application in browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "SUCCESS! App is running at: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend API & Docs at:     http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
