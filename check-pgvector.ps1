# Check pgvector installation for PostgreSQL 17

Write-Host "Checking pgvector installation..." -ForegroundColor Cyan

# Check if files exist
$pgPath = "C:\Program Files\PostgreSQL\17"
$libPath = "$pgPath\lib\vector.dll"
$controlPath = "$pgPath\share\extension\vector.control"

Write-Host "`nChecking required files:" -ForegroundColor Yellow

if (Test-Path $libPath) {
    Write-Host "✓ vector.dll found at: $libPath" -ForegroundColor Green
} else {
    Write-Host "✗ vector.dll NOT found at: $libPath" -ForegroundColor Red
}

if (Test-Path $controlPath) {
    Write-Host "✓ vector.control found at: $controlPath" -ForegroundColor Green
} else {
    Write-Host "✗ vector.control NOT found at: $controlPath" -ForegroundColor Red
}

# List all vector-related files
$extensionPath = "$pgPath\share\extension"
if (Test-Path $extensionPath) {
    Write-Host "`nVector files in extension directory:" -ForegroundColor Yellow
    Get-ChildItem "$extensionPath\vector*" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Gray
    }
}

Write-Host "`n" -ForegroundColor Cyan
Write-Host "If files are missing, download from:" -ForegroundColor Yellow
Write-Host "https://github.com/pgvector/pgvector/releases/tag/v0.8.0" -ForegroundColor Cyan
Write-Host "`nDownload: pgvector-0.8.0-windows-x64-postgres17.zip" -ForegroundColor Cyan

