#!/bin/bash

echo "🚀 Updating diagram definitions..."
echo

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js to use this script."
    exit 1
fi

echo "📝 Generating TypeScript definitions and markdown files..."
node generate-definitions.js

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate definitions!"
    exit 1
fi

echo
echo "✨ Diagram definitions updated successfully!"
echo
echo "📋 What was updated:"
echo "  - TypeScript definitions for React app"
echo "  - Markdown files with diagrams"
echo "  - Centralized documentation"
echo
echo "🎯 Next steps:"
echo "  - React app will automatically use new definitions"
echo "  - Markdown files are ready for documentation"
echo "  - All diagrams are synchronized from single source"
echo
