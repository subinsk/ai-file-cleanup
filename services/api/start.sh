#!/bin/bash
echo "Starting API service..."

# Activate venv if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Prisma client should be pre-generated (committed to repo)
# If you need to regenerate, run: python -m prisma generate --schema ../../packages/db/prisma/schema.prisma

# Start server
python run.py
