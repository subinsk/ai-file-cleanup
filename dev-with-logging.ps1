# dev-with-logging.ps1
# Runs pnpm dev with automatic logging

param(
    [string]$Command = "dev"
)

# Create logs directory if it doesn't exist
$logsDir = "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

# Generate timestamp for log filename
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$logfile = "$logsDir\$Command-$timestamp.log"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI File Cleanup - Development Mode" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting: pnpm $Command" -ForegroundColor White
Write-Host "Logging to: $logfile" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Log session start
"========================================" | Out-File -FilePath $logfile -Encoding UTF8
"Session started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File -FilePath $logfile -Append -Encoding UTF8
"Command: pnpm $Command" | Out-File -FilePath $logfile -Append -Encoding UTF8
"========================================" | Out-File -FilePath $logfile -Append -Encoding UTF8
"" | Out-File -FilePath $logfile -Append -Encoding UTF8

# Run pnpm with tee to both console and file
# Use ForEach-Object to properly handle encoding and write to file
pnpm $Command 2>&1 | ForEach-Object {
    $line = $_.ToString()
    Write-Host $line
    Add-Content -Path $logfile -Value $line -Encoding UTF8
}

# Log session end
"" | Out-File -FilePath $logfile -Append -Encoding UTF8
"========================================" | Out-File -FilePath $logfile -Append -Encoding UTF8
"Session ended: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File -FilePath $logfile -Append -Encoding UTF8
"========================================" | Out-File -FilePath $logfile -Append -Encoding UTF8

