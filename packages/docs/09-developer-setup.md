# Developer Setup Guide - AI File Cleanup

Complete guide for setting up the AI File Cleanup system for development across Windows, macOS, and Linux.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Platform-Specific Setup](#platform-specific-setup)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)
7. [Development Workflow](#development-workflow)

---

## Prerequisites

### Required Software

| Software   | Version | Purpose                |
| ---------- | ------- | ---------------------- |
| Node.js    | 18.0.0+ | Frontend & Build tools |
| Python     | 3.10+   | API & ML services      |
| PostgreSQL | 14+     | Database               |
| pnpm       | 8.0.0+  | Package manager        |
| Git        | Latest  | Version control        |

### Optional Software

| Software       | Purpose                   |
| -------------- | ------------------------- |
| Docker Desktop | Database containerization |
| VS Code        | Recommended IDE           |
| Postman        | API testing               |

---

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd ai-file-cleanup
```

### 2. Install Dependencies

```bash
# Install pnpm globally (if not installed)
npm install -g pnpm

# Install all project dependencies
pnpm install
```

### 3. Setup Environment Variables

```bash
# Root directory
cp env.example .env

# Web app
cp apps/web/env.example apps/web/.env.local

# Desktop app
cp apps/desktop/env.example apps/desktop/.env

# API service
cp services/api/.env.example services/api/.env  # Create if doesn't exist

# ML service
cp services/ml-service/.env.example services/ml-service/.env  # Create if doesn't exist
```

### 4. Start Database

```bash
# Using Docker (recommended)
docker compose up -d

# Verify database is running
docker ps
```

### 5. Setup Database Schema

```bash
cd packages/db
pnpm db:push
pnpm db:generate
cd ../..
```

### 6. Install Python Dependencies

#### For API Service:

```bash
cd services/api
python -m venv venv

# Activate virtual environment (see platform-specific commands below)
pip install -r requirements.txt
cd ../..
```

#### For ML Service:

```bash
cd services/ml-service
python -m venv venv

# Activate virtual environment
pip install -r requirements.txt
cd ../..
```

### 7. Build Packages

```bash
pnpm build:packages
```

### 8. Start Development Servers

```bash
# Start all services
pnpm dev

# Or with logging
pnpm dev:log
```

---

## Platform-Specific Setup

### Windows Setup

#### 1. Install Node.js

Download from [nodejs.org](https://nodejs.org/) or use winget:

```powershell
winget install OpenJS.NodeJS
```

#### 2. Install Python

Download from [python.org](https://python.org/) or use winget:

```powershell
winget install Python.Python.3.11
```

**Important:** Check "Add Python to PATH" during installation.

#### 3. Install PostgreSQL

Download from [postgresql.org](https://www.postgresql.org/download/windows/) or use Docker:

```powershell
# Using Docker Desktop (recommended)
docker compose up -d
```

#### 4. Install pnpm

```powershell
npm install -g pnpm
```

#### 5. Activate Python Virtual Environment

```powershell
# In services/api directory
.\venv\Scripts\Activate.ps1

# If you get execution policy error:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 6. Install Build Tools (if needed)

Some Python packages may require build tools:

```powershell
# Install Visual Studio Build Tools
winget install Microsoft.VisualStudio.2022.BuildTools

# Or install Windows SDK
winget install Microsoft.WindowsSDK
```

#### 7. Windows-Specific Environment Variables

Create `.env` files with Windows paths:

```env
UPLOAD_DIR=C:\Temp\uploads
DATABASE_URL=postgresql://user:password@localhost:5432/ai_cleanup
```

### macOS Setup

#### 1. Install Homebrew (if not installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2. Install Node.js

```bash
brew install node@18
```

#### 3. Install Python

```bash
brew install python@3.11
```

#### 4. Install PostgreSQL

```bash
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14

# Or using Docker (recommended)
docker compose up -d
```

#### 5. Install pnpm

```bash
npm install -g pnpm
```

#### 6. Activate Python Virtual Environment

```bash
# In services/api directory
source venv/bin/activate
```

#### 7. Install System Dependencies

```bash
# For image processing (if needed)
brew install libmagic

# For OpenCV
brew install opencv
```

### Linux (Ubuntu/Debian) Setup

#### 1. Update System

```bash
sudo apt update
sudo apt upgrade -y
```

#### 2. Install Node.js

```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### 3. Install Python

```bash
sudo apt install -y python3.11 python3.11-venv python3-pip
```

#### 4. Install PostgreSQL

```bash
# Using apt
sudo apt install -y postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Or using Docker (recommended)
docker compose up -d
```

#### 5. Install pnpm

```bash
npm install -g pnpm
```

#### 6. Activate Python Virtual Environment

```bash
# In services/api directory
source venv/bin/activate
```

#### 7. Install System Dependencies

```bash
# For image processing
sudo apt install -y libmagic1

# For OpenCV
sudo apt install -y python3-opencv

# For PDF processing
sudo apt install -y poppler-utils
```

### Linux (Fedora/RHEL) Setup

#### 1. Install Node.js

```bash
sudo dnf install -y nodejs
```

#### 2. Install Python

```bash
sudo dnf install -y python3.11 python3-pip
```

#### 3. Install PostgreSQL

```bash
sudo dnf install -y postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 4. Install System Dependencies

```bash
sudo dnf install -y file-libs opencv python3-opencv
```

---

## Configuration

### Environment Variables

#### Root `.env`

```env
# Node environment
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_cleanup

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SESSION_SECRET=your-super-secret-session-key-change-in-production
```

#### Web App `.env.local`

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_cleanup
```

#### Desktop App `.env`

```env
# API URL
VITE_API_URL=http://localhost:3001
```

#### API Service `.env`

```env
# Environment
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=INFO

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_cleanup

# Security
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
ALLOWED_HOSTS=*

# File Upload
MAX_FILE_SIZE_MB=50
MAX_TOTAL_UPLOAD_SIZE_MB=500
MAX_FILES_PER_UPLOAD=100
UPLOAD_DIR=/tmp/uploads

# ML Service
ML_SERVICE_URL=http://localhost:3002
ML_SERVICE_TIMEOUT=30

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_SECONDS=60
```

#### ML Service `.env`

```env
# Environment
NODE_ENV=development
PORT=3002
HOST=0.0.0.0

# Model Configuration
MODEL_CACHE_DIR=./models_cache
BATCH_SIZE=32
MAX_CONCURRENT_REQUESTS=10
```

### Database Setup

#### Option 1: Docker (Recommended)

```yaml
# docker-compose.yml (already configured)
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ai_cleanup
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

```bash
# Start database
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs postgres

# Stop database
docker compose down
```

#### Option 2: Local PostgreSQL

##### Windows

```powershell
# Using pgAdmin or psql
psql -U postgres
CREATE DATABASE ai_cleanup;
\q
```

##### macOS/Linux

```bash
# Create database
createdb ai_cleanup

# Or using psql
psql -U postgres
CREATE DATABASE ai_cleanup;
\q
```

#### Run Migrations

```bash
cd packages/db

# Push schema to database
pnpm db:push

# Or create migration
pnpm db:migrate

# Generate Prisma client
pnpm db:generate

# Open Prisma Studio (database GUI)
pnpm db:studio
```

---

## Running the Application

### Start All Services

```bash
# Development mode (terminal output)
pnpm dev

# Development mode with logging (saves to log files)
pnpm dev:log
```

This starts:

- Web App: http://localhost:3000
- Desktop App: Electron window
- API Service: http://localhost:3001
- ML Service: http://localhost:3002

### Start Individual Services

```bash
# Web app only
pnpm dev:web

# Desktop app only
pnpm dev:desktop

# API service only
pnpm dev:api

# ML service only
pnpm dev:ml

# Just packages
pnpm dev:packages
```

### Production Build

```bash
# Build everything
pnpm build

# Build specific apps
pnpm build:web
pnpm build:desktop
pnpm build:packages

# Package desktop app
pnpm package:desktop:win  # Windows
pnpm package:desktop:mac  # macOS
pnpm package:desktop:linux  # Linux
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Symptom:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

#### 2. Python Virtual Environment Not Activating

**Windows:**

```powershell
# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then activate
.\venv\Scripts\Activate.ps1
```

**macOS/Linux:**

```bash
# Make sure script is executable
chmod +x venv/bin/activate

# Then activate
source venv/bin/activate
```

#### 3. Database Connection Failed

**Symptom:** `Error: Can't reach database server`

**Solution:**

```bash
# Check if PostgreSQL is running
docker ps  # If using Docker
# or
systemctl status postgresql  # Linux
# or
brew services list  # macOS

# Check connection string
psql postgresql://postgres:postgres@localhost:5432/ai_cleanup

# Verify DATABASE_URL in .env files
```

#### 4. Prisma Client Not Generated

**Symptom:** `Cannot find module '@prisma/client'`

**Solution:**

```bash
cd packages/db
pnpm db:generate
cd ../..

# If still failing, try
pnpm clean
pnpm install
pnpm build:packages
```

#### 5. Python Packages Install Fails

**Windows:**

```powershell
# Install Visual Studio Build Tools
winget install Microsoft.VisualStudio.2022.BuildTools

# Or install specific package from wheel
pip install --only-binary :all: <package-name>
```

**macOS:**

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install with verbose output to see errors
pip install -r requirements.txt -v
```

**Linux:**

```bash
# Install development headers
sudo apt install python3-dev build-essential

# Install package-specific dependencies
sudo apt install libpq-dev  # For psycopg2
sudo apt install libmagic-dev  # For python-magic
```

#### 6. Module Not Found Errors

**Symptom:** `Module not found: Can't resolve '@ai-cleanup/types'`

**Solution:**

```bash
# Rebuild packages
pnpm build:packages

# Clear cache and reinstall
pnpm clean
rm -rf node_modules
pnpm install
```

#### 7. Electron App Won't Start

**Symptom:** Electron window doesn't open

**Solution:**

```bash
cd apps/desktop

# Rebuild Electron
pnpm rebuild

# Clear dist and rebuild
rm -rf dist
pnpm build
pnpm dev
```

#### 8. Hot Reload Not Working

**Solution:**

```bash
# Check if using correct port
# Web: http://localhost:3000 (not 127.0.0.1)

# Restart development server
# Ctrl+C to stop, then
pnpm dev
```

#### 9. CORS Errors

**Symptom:** `Access-Control-Allow-Origin` errors in browser

**Solution:**

1. Check CORS_ORIGINS in `services/api/.env`:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

2. Restart API service:

```bash
pnpm dev:api
```

#### 10. ML Service Timeout

**Symptom:** `ML service request timeout`

**Solution:**

```bash
# Check if ML service is running
curl http://localhost:3002/health

# Increase timeout in API .env
ML_SERVICE_TIMEOUT=60

# Check ML service logs
cd services/ml-service
source venv/bin/activate
python run.py
```

### Performance Issues

#### Slow Build Times

```bash
# Use Turbo cache
turbo run build --cache-dir=.turbo

# Build only changed packages
turbo run build --filter=...changes
```

#### High Memory Usage

```bash
# Increase Node memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Windows
set NODE_OPTIONS=--max-old-space-size=4096
```

### Debugging

#### Enable Debug Logging

```bash
# Set in .env
LOG_LEVEL=DEBUG

# Or set environment variable
DEBUG=* pnpm dev
```

#### API Request Logging

```bash
# Watch API logs
tail -f services/api/logs/api.log

# Watch all logs
tail -f logs/dev-*.log
```

#### Database Queries

```bash
# Enable Prisma query logging
# In packages/db/.env
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=5&pool_timeout=2&schema_public&log_queries=true"

# Or use Prisma Studio
cd packages/db
pnpm db:studio
```

---

## Development Workflow

### 1. Daily Development

```bash
# Start database
docker compose up -d

# Start development servers
pnpm dev:log

# Make changes...

# Run linter
pnpm lint

# Type check
pnpm typecheck

# Run tests
pnpm test
```

### 2. Making Database Changes

```bash
# 1. Modify schema
vim packages/db/prisma/schema.prisma

# 2. Create migration
cd packages/db
pnpm db:migrate

# 3. Generate client
pnpm db:generate

# 4. Restart services
cd ../..
pnpm dev
```

### 3. Adding Dependencies

```bash
# Root workspace dependency
pnpm add <package> -w

# Specific package
pnpm add <package> --filter=@ai-cleanup/web

# Dev dependency
pnpm add -D <package> --filter=@ai-cleanup/api
```

### 4. Code Quality

```bash
# Format code
pnpm format

# Check formatting
pnpm format:check

# Lint and fix
pnpm lint:fix

# Type check all
pnpm typecheck
```

### 5. Testing

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test packages/core

# Watch mode
pnpm test --watch
```

---

## IDE Setup

### VS Code (Recommended)

#### Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "bradlc.vscode-tailwindcss"
  ]
}
```

#### Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["javascript", "typescript", "typescriptreact"],
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black"
}
```

### PyCharm/WebStorm

1. Enable ESLint
2. Enable Prettier
3. Set Python interpreter to venv
4. Enable Prisma plugin

---

## Next Steps

1. Read [API Documentation](./API_DOCUMENTATION.md)
2. Review [Architecture Documentation](./packages/docs/00-architecture.md)
3. Check [Security Review](./SECURITY_REVIEW.md)
4. See [Bug Sweep Report](./BUG_SWEEP_REPORT.md)

---

## Getting Help

- Check [Troubleshooting](#troubleshooting) section
- Review [GitHub Issues](repository-url/issues)
- Read [Contributing Guide](./CONTRIBUTING.md)
- Contact: dev@aifilecleanup.com

---

**Last Updated:** January 2025  
**Maintained by:** AI File Cleanup Team
