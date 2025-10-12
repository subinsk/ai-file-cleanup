# Installation Guide

This guide will walk you through setting up the AI File Cleanup project on your local machine.

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd ai-file-cleanup
```

If you downloaded the project as a ZIP, extract it and navigate to the project directory.

## Step 2: Install Node.js Dependencies

Our project uses pnpm workspaces for efficient dependency management.

```bash
# Install all dependencies (root + all packages)
pnpm install
```

This will install dependencies for:

- Root workspace
- `apps/web` - Next.js web application
- `packages/db` - Prisma database package
- `packages/ui` - Shared UI components
- `packages/types` - Shared TypeScript types

**Expected output:**

```
Progress: resolved X, reused Y, downloaded Z, added A
Done in Xs
```

## Step 3: Install Python Dependencies

### For API Service

```bash
# Navigate to API service
cd services/api

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Return to root
cd ../..
```

### For ML Service

```bash
# Navigate to ML service
cd services/ml-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Return to root
cd ../..
```

## Step 4: Verify Installation

Run these commands to verify everything is installed correctly:

```bash
# Check Node.js packages
pnpm list --depth=0

# Check Python packages (from services/api with venv activated)
pip list
```

## Troubleshooting

### Issue: `pnpm: command not found`

**Solution:** Install pnpm globally:

```bash
npm install -g pnpm
```

### Issue: Python dependencies fail to install

**Solution:**

1. Ensure Python 3.10+ is installed
2. Update pip: `python -m pip install --upgrade pip`
3. On Windows, install Visual C++ Build Tools if needed

### Issue: Node modules installation errors

**Solution:**

```bash
# Clear caches and reinstall
pnpm store prune
rm -rf node_modules
pnpm install
```

---

## Next Steps

After successful installation, proceed to [Environment Setup](./03-environment-setup.md) to configure your environment variables.
