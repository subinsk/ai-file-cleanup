#!/bin/bash
set -e

echo "=================================================="
echo "Building AI File Cleanup API Service"
echo "=================================================="

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "ℹ️  Prisma client should be pre-generated and committed to repo"
echo "ℹ️  If missing, generate locally: python -m prisma generate --schema ../../packages/db/prisma/schema.prisma"

echo ""
echo "✅ Build complete!"
echo "=================================================="

