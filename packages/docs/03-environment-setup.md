# Environment Setup

This guide covers creating and configuring all necessary environment variables for the project.

## Overview

The project requires environment variables in multiple locations:

1. `packages/db/.env` - Database connection
2. `apps/web/.env.local` - Next.js web app
3. `services/api/.env` - Python API service
4. `services/ml-service/.env` - Python ML service

## 1. Database Environment (`packages/db/.env`)

**Location:** `packages/db/.env`

**Create the file:**

```bash
# From project root
cd packages/db
```

**Content:**

```env
# PostgreSQL Connection
DATABASE_URL=postgresql://postgres:admin@localhost:5433/ai_file_cleanup
```

**Variables explained:**

- `DATABASE_URL`: PostgreSQL connection string
  - `postgres`: Username (default)
  - `admin`: Password (set in docker compose)
  - `localhost:5433`: Host and port (5433 to avoid conflicts)
  - `ai_file_cleanup`: Database name

## 2. Web App Environment (`apps/web/.env.local`)

**Location:** `apps/web/.env.local`

**Create the file:**

```bash
# From project root
cd apps/web
```

**Content:**

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-nextauth-key-change-this-min-32-chars-please
NEXTAUTH_URL=http://localhost:3000

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Variables explained:**

- `NEXTAUTH_SECRET`: Secret key for NextAuth sessions (min 32 characters)
  - Generate with: `openssl rand -base64 32` (on macOS/Linux)
  - Or use any random 32+ character string
- `NEXTAUTH_URL`: URL where Next.js app runs (usually http://localhost:3000)
- `NEXT_PUBLIC_API_URL`: URL of Python API (publicly accessible in browser)

**⚠️ Security Note:** Never commit `.env.local` to version control!

## 3. API Service Environment (`services/api/.env`)

**Location:** `services/api/.env`

**Create the file:**

```bash
# From project root
cd services/api
```

**Content:**

```env
# Environment
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:admin@localhost:5433/ai_file_cleanup

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-change-this-min-32-characters-please
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080

# Session
SESSION_SECRET=your-super-secret-session-key-min-32-characters-please-change

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# ML Service URL
ML_SERVICE_URL=http://localhost:3002

# Logging
LOG_LEVEL=INFO
```

**Variables explained:**

- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Port where API runs (3001)
- `DATABASE_URL`: Same as packages/db
- `JWT_SECRET`: Secret for JWT token generation (min 32 chars, different from NEXTAUTH_SECRET)
- `SESSION_SECRET`: Secret for session cookies (min 32 chars)
- `CORS_ORIGINS`: Allowed origins for CORS (JSON array format)
- `ML_SERVICE_URL`: URL of ML service
- `LOG_LEVEL`: Logging verbosity (DEBUG/INFO/WARNING/ERROR)

## 4. ML Service Environment (`services/ml-service/.env`)

**Location:** `services/ml-service/.env`

**Create the file:**

```bash
# From project root
cd services/ml-service
```

**Content:**

```env
# Server Configuration
HOST=0.0.0.0
PORT=3002

# ML Configuration
DEVICE=cpu
MODEL_CACHE_DIR=./model_cache

# Logging
LOG_LEVEL=INFO
```

**Variables explained:**

- `HOST`: Host to bind (0.0.0.0 allows external connections)
- `PORT`: Port where ML service runs (3002)
- `DEVICE`: Device for ML inference (cpu/cuda)
  - Use `cpu` for development
  - Use `cuda` if you have NVIDIA GPU with CUDA installed
- `MODEL_CACHE_DIR`: Directory to cache downloaded ML models
- `LOG_LEVEL`: Logging verbosity

## Quick Setup Script

Create all environment files at once:

**Windows (PowerShell):**

```powershell
# Run from project root
.\setup-env.ps1
```

**macOS/Linux (Bash):**

```bash
# Run from project root
chmod +x setup-env.sh
./setup-env.sh
```

Or manually create each file as shown above.

## Verification

Verify your environment setup:

```bash
# Check if all .env files exist
ls packages/db/.env
ls apps/web/.env.local
ls services/api/.env
ls services/ml-service/.env
```

All files should exist before proceeding.

---

## Security Best Practices

1. ✅ **Never commit `.env` files** to version control
2. ✅ **Use different secrets** for each service
3. ✅ **Use strong secrets** (min 32 characters, random)
4. ✅ **Rotate secrets** regularly in production
5. ✅ **Use environment-specific** values (dev/staging/prod)

## Next Steps

After setting up environment variables, proceed to [Database Setup](./04-database-setup.md).
