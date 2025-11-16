@echo off
REM dev-with-logging.bat
REM Wrapper to run pnpm dev with logging

REM Parse arguments (default to "dev" if none provided)
if "%1"=="" (
    set COMMAND=dev
) else (
    set COMMAND=%1
)

REM Run PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0dev-with-logging.ps1" -Command %COMMAND%

