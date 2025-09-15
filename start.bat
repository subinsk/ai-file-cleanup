@echo off
echo Starting AI File Management System...
echo.

echo Starting Docker services...
docker-compose up -d

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak > nul

echo.
echo Services started! Access the application at:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo - API Documentation: http://localhost:8000/docs
echo.

echo Press any key to stop the services...
pause > nul

echo.
echo Stopping services...
docker-compose down
