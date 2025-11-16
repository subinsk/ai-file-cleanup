# cleanup-old-logs.ps1
# Removes log files older than a specified number of days

param(
    [int]$DaysToKeep = 30
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Log Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$cutoffDate = (Get-Date).AddDays(-$DaysToKeep)
Write-Host "Removing log files older than: $cutoffDate" -ForegroundColor Yellow
Write-Host ""

# Function to clean logs in a directory
function Clean-LogDirectory {
    param(
        [string]$Path,
        [string]$ServiceName
    )
    
    if (Test-Path $Path) {
        $logFiles = Get-ChildItem "$Path\*.log" -ErrorAction SilentlyContinue
        $oldLogs = $logFiles | Where-Object { $_.LastWriteTime -lt $cutoffDate }
        
        if ($oldLogs) {
            Write-Host "[$ServiceName] Found $($oldLogs.Count) old log file(s)" -ForegroundColor White
            
            foreach ($log in $oldLogs) {
                $sizeKB = [math]::Round($log.Length / 1KB, 2)
                Write-Host "  - Removing: $($log.Name) ($sizeKB KB) - Last modified: $($log.LastWriteTime)" -ForegroundColor Gray
                Remove-Item $log.FullName -Force
            }
            
            Write-Host "  ✓ Cleaned up $($oldLogs.Count) file(s)" -ForegroundColor Green
        } else {
            Write-Host "[$ServiceName] No old log files to remove" -ForegroundColor Green
        }
        
        # Show current log count
        $remainingLogs = Get-ChildItem "$Path\*.log" -ErrorAction SilentlyContinue
        if ($remainingLogs) {
            $totalSizeMB = [math]::Round(($remainingLogs | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
            Write-Host "  → $($remainingLogs.Count) log file(s) remaining ($totalSizeMB MB)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "[$ServiceName] Logs directory not found: $Path" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

# Clean root development logs
Clean-LogDirectory -Path "logs" -ServiceName "Development (Root)"

# Clean API logs
Clean-LogDirectory -Path "services\api\logs" -ServiceName "API Service"

# Clean ML service logs
Clean-LogDirectory -Path "services\ml-service\logs" -ServiceName "ML Service"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cleanup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Usage examples:" -ForegroundColor White
Write-Host "  .\cleanup-old-logs.ps1              # Remove logs older than 30 days (default)" -ForegroundColor Gray
Write-Host "  .\cleanup-old-logs.ps1 -DaysToKeep 7   # Remove logs older than 7 days" -ForegroundColor Gray
Write-Host ""

