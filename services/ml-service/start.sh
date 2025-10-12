#!/bin/bash
echo "Starting ML service..."

# Activate venv if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Start server
python run.py
