#!/bin/bash
echo "Starting API service..."

# Activate venv if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Generate Prisma client
prisma generate

# Start server
python run.py
