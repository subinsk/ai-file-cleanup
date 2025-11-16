# Quick Start: Logging 🪵

## TL;DR

```bash
# Start with logging enabled
pnpm dev:log

# All output saved to: logs/dev-YYYY-MM-DD-HHMM.log
# Still shows in terminal too!
```

## Why Use Logging?

✅ **Debug issues later** - Review what happened after the fact  
✅ **Share logs** - Send log files to teammates or support  
✅ **Track changes** - Compare logs before/after changes  
✅ **Find patterns** - Search across multiple sessions

## Three Ways to Log

### 1. Full Development Mode (All Services)

```bash
pnpm dev:log
```

**Logs to:** `logs/dev-YYYY-MM-DD-HHMM.log`  
**Includes:** Web app, Desktop app, API, ML service, all builds

### 2. Individual Python Services

```bash
cd services/api
start.bat
```

**Logs to:** `services/api/logs/api-YYYY-MM-DD-HHMM.log`  
**Includes:** API service only

```bash
cd services/ml-service
start.bat
```

**Logs to:** `services/ml-service/logs/ml-service-YYYY-MM-DD-HHMM.log`  
**Includes:** ML service only

### 3. Custom Commands

```bash
# Any pnpm command with logging
dev-with-logging.bat dev:frontend
dev-with-logging.bat dev:backend
dev-with-logging.bat build
```

## Without Logging (Normal Mode)

```bash
# Standard mode - no log files created
pnpm dev
pnpm dev:web
pnpm dev:api
```

## Viewing Logs

### While Running

Just look at your terminal - everything shows in real-time!

### After the Fact

```bash
# Open in notepad
notepad logs\dev-2025-11-16-1430.log

# Open in VS Code
code logs\dev-2025-11-16-1430.log

# Tail in PowerShell (live view)
Get-Content logs\dev-2025-11-16-1430.log -Wait -Tail 50
```

## Finding Errors

```powershell
# Search for errors in today's logs
Select-String -Path "logs\*.log" -Pattern "error" -CaseSensitive:$false

# Find API errors specifically
Select-String -Path "services\api\logs\*.log" -Pattern "error"

# Show context around errors (5 lines before/after)
Select-String -Path "logs\*.log" -Pattern "error" -Context 5
```

## Cleanup

```bash
# Remove logs older than 30 days
.\cleanup-old-logs.bat

# Remove logs older than 7 days
.\cleanup-old-logs.bat 7
```

## Quick Tips

💡 **Log files are in .gitignore** - They won't be committed  
💡 **New log per session** - Each run creates a new timestamped file  
💡 **Both stdout & stderr** - All output types are captured  
💡 **No performance impact** - Runs just as fast as normal mode

## Common Scenarios

### Debugging a Crash

```bash
# Run with logging
pnpm dev:log

# When it crashes, check the log
notepad logs\dev-2025-11-16-1430.log
# Search for "error", "exception", "failed"
```

### Comparing Before/After

```bash
# Before changes
pnpm dev:log
# ... make your changes ...
# After changes
pnpm dev:log
# Compare the two log files
```

### Sharing with Team

```bash
pnpm dev:log
# When issue occurs, send them: logs\dev-YYYY-MM-DD-HHMM.log
```

## Questions?

See [LOGGING.md](LOGGING.md) for complete documentation.

---

**Happy logging! 🎉**
