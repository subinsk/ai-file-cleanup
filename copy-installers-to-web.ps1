# Script to copy Windows installers from desktop build to web app download directory
# Run this after building the desktop app with: pnpm package:desktop:win

$ErrorActionPreference = "Stop"

Write-Host "Copying Windows installers to web app..." -ForegroundColor Cyan

$desktopDistPath = "apps\desktop\dist-package"
$webDownloadsPath = "apps\web\public\downloads"

# Check if build files exist
if (-not (Test-Path "$desktopDistPath\AI File Cleanup-1.0.0.msi") -and -not (Test-Path "$desktopDistPath\AI File Cleanup-1.0.0.exe")) {
    Write-Host "Error: Desktop build not found. Please run 'pnpm package:desktop:win' first." -ForegroundColor Red
    exit 1
}

# Create downloads directory if it doesn't exist
if (-not (Test-Path $webDownloadsPath)) {
    New-Item -ItemType Directory -Path $webDownloadsPath -Force | Out-Null
}

Write-Host ""
Write-Host "1. Copying NSIS installer..." -ForegroundColor Yellow
if (Test-Path "$desktopDistPath\AI File Cleanup-1.0.0.exe") {
    Copy-Item "$desktopDistPath\AI File Cleanup-1.0.0.exe" "$webDownloadsPath\AI-File-Cleanup-1.0.0.exe" -Force
    Write-Host "   OK AI-File-Cleanup-1.0.0.exe" -ForegroundColor Green
} else {
    Write-Host "   WARNING NSIS installer not found, skipping..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Copying MSI installer..." -ForegroundColor Yellow
if (Test-Path "$desktopDistPath\AI File Cleanup-1.0.0.msi") {
    Copy-Item "$desktopDistPath\AI File Cleanup-1.0.0.msi" "$webDownloadsPath\AI-File-Cleanup-1.0.0.msi" -Force
    Write-Host "   OK AI-File-Cleanup-1.0.0.msi" -ForegroundColor Green
} else {
    Write-Host "   WARNING MSI installer not found, skipping..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "3. Copying portable executable..." -ForegroundColor Yellow
Copy-Item "$desktopDistPath\win-unpacked\AI File Cleanup.exe" "$webDownloadsPath\AI-File-Cleanup-1.0.0-Portable.exe" -Force
Write-Host "   OK AI-File-Cleanup-1.0.0-Portable.exe" -ForegroundColor Green

Write-Host ""
Write-Host "4. Creating ZIP archive..." -ForegroundColor Yellow
Compress-Archive -Path "$desktopDistPath\win-unpacked\*" -DestinationPath "$webDownloadsPath\AI-File-Cleanup-1.0.0-win.zip" -Force
Write-Host "   OK AI-File-Cleanup-1.0.0-win.zip" -ForegroundColor Green

Write-Host ""
Write-Host "Summary of downloaded files:" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------------" -ForegroundColor DarkGray

Get-ChildItem "$webDownloadsPath\*.msi", "$webDownloadsPath\*.exe", "$webDownloadsPath\*.zip" | ForEach-Object {
    $sizeInMB = [math]::Round($_.Length / 1MB, 2)
    $name = $_.Name.PadRight(40)
    Write-Host "  $name $sizeInMB MB" -ForegroundColor White
}

Write-Host "--------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "OK All installers copied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Files are now available at:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000/api/download/AI-File-Cleanup-1.0.0.exe (NSIS)" -ForegroundColor Gray
Write-Host "  http://localhost:3000/api/download/AI-File-Cleanup-1.0.0.msi (MSI)" -ForegroundColor Gray
Write-Host "  http://localhost:3000/api/download/AI-File-Cleanup-1.0.0-Portable.exe" -ForegroundColor Gray
Write-Host "  http://localhost:3000/api/download/AI-File-Cleanup-1.0.0-win.zip" -ForegroundColor Gray
Write-Host ""
Write-Host "View the download page at:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000/download" -ForegroundColor Gray
Write-Host ""
