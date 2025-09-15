#!/bin/bash

echo "Starting AI File Management System..."
echo

echo "Starting Docker services..."
docker-compose up -d

echo
echo "Waiting for services to start..."
sleep 10

echo
echo "Services started! Access the application at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- API Documentation: http://localhost:8000/docs"
echo

echo "Press Ctrl+C to stop the services..."
trap 'echo "Stopping services..."; docker-compose down; exit' INT

# Keep the script running
while true; do
    sleep 1
done
