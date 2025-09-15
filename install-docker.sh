#!/bin/bash

echo "Installing AI File Management System using Docker..."
echo

echo "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    echo "Please install Docker from https://www.docker.com/get-started"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed"
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

echo "Docker and Docker Compose are available"
echo

echo "Building and starting services..."
docker-compose up -d --build

echo
echo "Waiting for services to start..."
sleep 15

echo
echo "Checking service health..."
docker-compose ps

echo
echo "Services started! Access the application at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- API Documentation: http://localhost:8000/docs"
echo

echo "To stop the services, run: docker-compose down"
echo "To view logs, run: docker-compose logs -f"
echo
