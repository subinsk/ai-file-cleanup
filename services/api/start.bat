@echo off
echo Starting API service...

REM Activate venv if exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Generate Prisma client
prisma generate

REM Start server
python run.py
