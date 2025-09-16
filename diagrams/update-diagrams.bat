@echo off
echo 🚀 Updating diagram definitions from centralized mermaid files...
echo.

REM Check if Node.js is available
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js to use this script.
    echo You can download it from: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found ✓
echo.
echo 📝 Generating TypeScript definitions and markdown files...
node generate-definitions.js

if errorlevel 1 (
    echo ❌ Failed to generate definitions!
    pause
    exit /b 1
)

echo.
echo ✨ Diagram definitions updated successfully!
echo.
echo 📋 What was updated:
echo   - frontend/src/utils/diagramDefinitions.ts (for React app)
echo   - Updated markdown files with embedded diagrams
echo   - Centralized documentation in README.md
echo.
echo 🎯 Next steps:
echo   1. React app will automatically use new definitions
echo   2. Visit http://localhost:3000/uml-diagrams to see updated diagrams
echo   3. Markdown files are ready for documentation
echo   4. All diagrams are synchronized from mermaid/ source files
echo.
echo 💡 To edit diagrams:
echo   1. Edit files in diagrams/mermaid/ directory
echo   2. Run this script again to update everywhere
echo.
pause
