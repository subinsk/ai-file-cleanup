@echo off
setlocal enabledelayedexpansion
echo Starting ngrok tunnel for ML service...
echo.

REM Load environment variables from .env file if it exists
if exist .env (
    echo Loading environment variables from .env file...
    for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do (
        set "%%a=%%b"
    )
)

REM Check if ngrok is installed
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: ngrok is not installed or not in PATH
    echo Please install ngrok from https://ngrok.com/download
    exit /b 1
)

REM Check for required environment variables
if "%NGROK_AUTH_TOKEN%"=="" (
    echo ERROR: NGROK_AUTH_TOKEN environment variable is not set
    echo Please set it in your .env file or environment
    exit /b 1
)

if "%NGROK_STATIC_DOMAIN%"=="" (
    echo ERROR: NGROK_STATIC_DOMAIN environment variable is not set
    echo Please set it in your .env file or environment
    exit /b 1
)

echo Configuration:
echo   - Auth Token: %NGROK_AUTH_TOKEN:~0,10%...
echo   - Static Domain: %NGROK_STATIC_DOMAIN%
echo   - Target: localhost:3002
echo.

REM Create temporary config file with substituted values
set TEMP_CONFIG=%TEMP%\ngrok-temp-%RANDOM%.yml
(
    echo version: "2"
    echo authtoken: %NGROK_AUTH_TOKEN%
    echo.
    echo tunnels:
    echo   ml-service:
    echo     proto: http
    echo     addr: 3002
    echo     domain: %NGROK_STATIC_DOMAIN%
) > "%TEMP_CONFIG%"

echo Starting ngrok tunnel...
echo Press Ctrl+C to stop
echo.

REM Start ngrok with temporary config file
ngrok start --config "%TEMP_CONFIG%" ml-service

REM Cleanup temporary config file on exit
del "%TEMP_CONFIG%" 2>nul

