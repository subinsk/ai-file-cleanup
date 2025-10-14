# Check if development services are running

Write-Host "`n🔍 Checking Development Services...`n" -ForegroundColor Cyan

# Check API Service (Port 3001)
Write-Host "Checking API Service (port 3001)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/docs" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host " ✅ Running" -ForegroundColor Green
    $apiRunning = $true
} catch {
    Write-Host " ❌ Not Running" -ForegroundColor Red
    $apiRunning = $false
}

# Check Web App (Port 3000)
Write-Host "Checking Web App (port 3000)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host " ✅ Running" -ForegroundColor Green
} catch {
    Write-Host " ❌ Not Running" -ForegroundColor Yellow
}

# Check Desktop Renderer (Port 5173)
Write-Host "Checking Desktop Renderer (port 5173)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host " ✅ Running" -ForegroundColor Green
} catch {
    Write-Host " ❌ Not Running" -ForegroundColor Yellow
}

# Check PostgreSQL (Port 5432)
Write-Host "Checking PostgreSQL (port 5432)..." -NoNewline
$pg = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if ($pg) {
    Write-Host " ✅ Running" -ForegroundColor Green
} else {
    Write-Host " ❌ Not Running" -ForegroundColor Red
}

Write-Host "`n" -NoNewline

# Provide recommendations
if (-not $apiRunning) {
    Write-Host "⚠️  API Service is required for desktop and web apps!" -ForegroundColor Yellow
    Write-Host "`nTo start API service:" -ForegroundColor Cyan
    Write-Host "  cd services/api" -ForegroundColor Gray
    Write-Host "  python run.py`n" -ForegroundColor Gray
}

Write-Host "📚 For detailed setup instructions, see: START-DEV-SERVERS.md`n" -ForegroundColor Cyan

