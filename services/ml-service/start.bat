@echo off
echo Starting ML service...

REM Activate venv if exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Start server
python run.py
