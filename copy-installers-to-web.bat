@echo off
REM Script to copy Windows installers from desktop build to web app download directory
REM Run this after building the desktop app with: pnpm package:desktop:win

echo Copying Windows installers to web app...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0copy-installers-to-web.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error occurred during copy process.
    pause
    exit /b 1
)

echo.
pause

