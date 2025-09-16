@echo off
echo Installing AI File Management System using Docker...
echo.

echo Checking Docker installation...
docker --version
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo.
echo Building and starting services...
docker-compose up -d --build

echo.
echo Waiting for services to start...
timeout /t 15 /nobreak > nul

echo.
echo Checking service health...
docker-compose ps

echo.
echo Services started! Access the application at:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo - API Documentation: http://localhost:8000/docs
echo.

echo To stop the services, run: docker-compose down
echo To view logs, run: docker-compose logs -f
echo.

pause

