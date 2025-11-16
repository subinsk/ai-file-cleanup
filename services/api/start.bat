@echo off
echo Starting API service...

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

REM Set log filename with timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ("%TIME%") do (set mytime=%%a%%b)
set mytime=%mytime: =0%
set logfile=logs\api-%mydate%-%mytime%.log

REM Activate venv if exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Generate Prisma client
echo [%date% %time%] Generating Prisma client... >> %logfile% 2>&1
prisma generate --schema=..\..\packages\db\prisma\schema.prisma >> %logfile% 2>&1

REM Start server with logging
echo [%date% %time%] Starting API service... >> %logfile% 2>&1
echo.
echo ========================================
echo Logging to: %logfile%
echo Press Ctrl+C to stop the service
echo ========================================
echo.

REM Run Python with output to both console and file
python run.py 2>&1 | powershell -Command "Tee-Object -FilePath '%logfile%' -Append"
