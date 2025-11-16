# Terminal Logging Setup

This project now includes automatic logging for all terminal output, including the main `pnpm dev` command and individual Python services.

## Overview

All terminal output is automatically saved to timestamped log files **and** displayed in the console simultaneously. You can:

- Run `pnpm dev:log` to start all services with logging
- Use individual service `start.bat` scripts with built-in logging
- Use the wrapper scripts for custom commands

## Log Locations

### Root Development Logs (pnpm dev)

- **Directory:** `logs/` (project root)
- **Format:** `dev-YYYY-MM-DD-HHMM.log`
- **Example:** `dev-2025-11-16-1430.log`
- **Captured:** All services running via Turbo (web, desktop, API, ML)

### API Service

- **Directory:** `services/api/logs/`
- **Format:** `api-YYYY-MM-DD-HHMM.log`
- **Example:** `api-2025-11-16-1430.log`

### ML Service

- **Directory:** `services/ml-service/logs/`
- **Format:** `ml-service-YYYY-MM-DD-HHMM.log`
- **Example:** `ml-service-2025-11-16-1430.log`

## How It Works

1. **Start a service** using `start.bat`
2. **Logs directory is created** automatically if it doesn't exist
3. **New log file is created** with a timestamp in the filename
4. **All output goes to both:**
   - Your terminal (for real-time viewing)
   - The log file (for later reference)

## Usage Examples

### Option 1: Start All Services with Logging (Recommended)

```bash
# From project root - logs everything to logs/dev-YYYY-MM-DD-HHMM.log
pnpm dev:log

# Or use the batch file directly
dev-with-logging.bat

# Run other commands with logging
dev-with-logging.bat dev:frontend
dev-with-logging.bat dev:backend
```

### Option 2: Start Without Logging (Normal Mode)

```bash
# Standard dev command (no logging)
pnpm dev
```

### Option 3: Individual Services with Logging

```bash
# Navigate to service directory
cd services/api

# Run the start script (logging happens automatically)
start.bat
```

### Viewing Logs

#### View in Notepad

```bash
notepad services\api\logs\api-2025-11-16-1430.log
```

#### Tail (Follow) Logs in PowerShell

```powershell
# Show last 50 lines and follow new output
Get-Content services\api\logs\api-2025-11-16-1430.log -Wait -Tail 50
```

#### Search Logs for Errors

```powershell
# Find all lines containing "error" in today's API logs
Select-String -Path "services\api\logs\api-*.log" -Pattern "error" -CaseSensitive:$false
```

## What's Logged

### API Service

- Prisma client generation output
- Server startup messages
- HTTP requests and responses
- Database queries
- Error messages and stack traces
- All console output

### ML Service

- Server startup messages
- Model loading information
- Inference requests and predictions
- Error messages and stack traces
- All console output

## Log Management

### Automatic Cleanup Script

Use the included cleanup script to remove old logs:

```bash
# Remove logs older than 30 days (default)
.\cleanup-old-logs.bat

# Remove logs older than 7 days
.\cleanup-old-logs.bat 7

# Or use PowerShell directly
.\cleanup-old-logs.ps1 -DaysToKeep 7
```

This will clean logs from all locations:

- Root `logs/` directory
- `services/api/logs/`
- `services/ml-service/logs/`

### Manual Cleanup

```bash
# Remove all logs (use with caution!)
del services\api\logs\*.log
del services\ml-service\logs\*.log
```

## Important Notes

- ✅ Log files are automatically excluded from git (via `.gitignore`)
- ✅ A new log file is created each time you start a service
- ✅ Both stdout and stderr are captured
- ✅ Console output remains visible in real-time
- ⚠️ Logs are not automatically rotated or deleted
- ⚠️ Large log files may accumulate over time

## Troubleshooting

### Logs not being created?

- Ensure you're running `start.bat` (not directly calling `python run.py`)
- Check that you have write permissions in the service directory
- Verify PowerShell is available on your system

### Can't see real-time output?

- This is expected behavior - output goes to both console and file
- If you only see the log file path, check that the piping to PowerShell's `Tee-Object` is working

### Log file encoding issues?

- Log files use UTF-8 encoding
- If you see garbled characters, ensure your text editor supports UTF-8

## Customization

To modify logging behavior, edit the `start.bat` files in:

- `services/api/start.bat`
- `services/ml-service/start.bat`

### Change log filename format:

```batch
set logfile=logs\custom-name-%mydate%-%mytime%.log
```

### Change log location:

```batch
set logfile=C:\MyLogs\api-%mydate%-%mytime%.log
```

### Disable console output (file only):

```batch
python run.py > %logfile% 2>&1
```
