#!/bin/bash
set -e

echo "=================================================="
echo "Building AI File Cleanup API Service"
echo "=================================================="

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Generate Prisma client
echo ""
echo "🔄 Generating Prisma Python client..."

# Set environment variables to prevent Node.js installation attempts
export PRISMA_SKIP_POSTINSTALL_GENERATE=1
export PRISMA_CLI_BINARY_TARGETS=native

# Get the schema path
SCHEMA_PATH="../../packages/db/prisma/schema.prisma"

# Generate using Python Prisma
if python -m prisma generate --schema "$SCHEMA_PATH"; then
    echo "✅ Prisma client generated successfully!"
else
    echo "⚠️  Prisma generation had issues, but continuing..."
    echo "ℹ️  Client will attempt to generate on first use"
fi

echo ""
echo "✅ Build complete!"
echo "=================================================="

