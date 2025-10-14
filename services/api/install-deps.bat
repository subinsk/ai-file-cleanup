@echo off
echo ====================================
echo Installing Python API Dependencies
echo ====================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing/Updating dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo ====================================
echo Dependencies installed successfully!
echo ====================================
echo.
echo To run the API server:
echo   1. cd services\api
echo   2. venv\Scripts\activate
echo   3. python run.py
echo.
pause

