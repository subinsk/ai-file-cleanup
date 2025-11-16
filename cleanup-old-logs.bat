@echo off
REM Wrapper for cleanup-old-logs.ps1
REM Usage: cleanup-old-logs.bat [days]
REM Example: cleanup-old-logs.bat 7

if "%1"=="" (
    powershell -ExecutionPolicy Bypass -File "%~dp0cleanup-old-logs.ps1"
) else (
    powershell -ExecutionPolicy Bypass -File "%~dp0cleanup-old-logs.ps1" -DaysToKeep %1
)

