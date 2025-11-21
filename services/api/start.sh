#!/bin/bash
echo "Starting API service..."

# Activate venv if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Generate Prisma client using Python CLI
python -m prisma generate --schema ../../packages/db/prisma/schema.prisma

# Start server
python run.py
