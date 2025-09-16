#!/bin/bash

echo "Installing AI File Management System (Simple Version)..."
echo

echo "Step 1: Setting up Python virtual environment..."
cd backend
python3 -m venv venv
source venv/bin/activate

echo
echo "Step 2: Installing clean requirements..."
pip install --upgrade pip
pip install -r requirements-clean.txt

echo
echo "Step 3: Setting up environment variables..."
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_file_cleanup" > .env
echo "REDIS_URL=redis://localhost:6379" >> .env
echo "JWT_SECRET=your-secret-key-change-in-production" >> .env

echo
echo "Step 4: Setting up frontend..."
cd ../frontend
npm install

echo
echo "Step 5: Starting services with Docker..."
cd ..
docker-compose up -d

echo
echo "Installation complete!"
echo
echo "Access the application at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:8000"
echo "- API Docs: http://localhost:8000/docs"
echo
echo "To start the backend manually:"
echo "cd backend"
echo "source venv/bin/activate"
echo "uvicorn app.main:app --reload"
echo
echo "To start the frontend manually:"
echo "cd frontend"
echo "npm start"
echo

