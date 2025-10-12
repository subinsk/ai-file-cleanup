# Setup Guide - AI File Cleanup System

Quick guide to get the system running on your machine.

## Prerequisites

✅ Already installed:
- Node.js 18+
- pnpm
- Project dependencies (you've run `pnpm install`)

🔲 Need to install:
- PostgreSQL with pgvector extension

---

## Step 1: Setup PostgreSQL Database

### Option A: Docker (Recommended - Easiest)

```bash
# Pull and run PostgreSQL with pgvector
docker run -d \
  --name ai-cleanup-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_cleanup_dev \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# Verify it's running
docker ps
```

### Option B: Local PostgreSQL Installation

If you have PostgreSQL installed locally:

1. **Create database:**
```sql
CREATE DATABASE ai_cleanup_dev;
```

2. **Enable pgvector extension:**
```sql
\c ai_cleanup_dev
CREATE EXTENSION IF NOT EXISTS vector;
```

3. **Update connection string** in `packages/db/.env` with your credentials

---

## Step 2: Configure Environment Variables

The `.env` file has been created at `packages/db/.env` with:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_cleanup_dev?schema=public"
```

**If you're using different credentials, update this file!**

Common scenarios:
- Different password: Change `postgres:postgres` to `postgres:YOUR_PASSWORD`
- Different port: Change `5432` to your port
- Different database name: Change `ai_cleanup_dev` to your database name

---

## Step 3: Initialize Database

Now run these commands to set up the database schema:

```bash
# Generate Prisma Client
pnpm --filter @ai-cleanup/db db:generate

# Push schema to database (creates tables)
pnpm --filter @ai-cleanup/db db:push

# Seed test data
pnpm --filter @ai-cleanup/db db:seed
```

**Expected output:**
- ✅ Prisma Client generated
- ✅ Tables created (Users, LicenseKeys, Files, etc.)
- ✅ Test users seeded

---

## Step 4: Build All Packages

```bash
pnpm build
```

This should complete in ~3-4 seconds.

---

## Step 5: Start the Services

Open **3 separate terminal windows** and run:

### Terminal 1 - API Service
```bash
cd D:\projects\ai-file-cleanup
pnpm --filter @ai-cleanup/api dev
```
Should start on **http://localhost:3001**

### Terminal 2 - Model Worker
```bash
cd D:\projects\ai-file-cleanup
pnpm --filter @ai-cleanup/model-worker dev
```
Should start on **http://localhost:3002**
*Note: First run downloads AI models (~500MB), takes 2-5 minutes*

### Terminal 3 - Web Application
```bash
cd D:\projects\ai-file-cleanup
pnpm --filter @ai-cleanup/web dev
```
Should start on **http://localhost:3000**

---

## Step 6: Test the Application

### Test Web App
1. Open http://localhost:3000
2. Click "Login"
3. Use test credentials:
   - Email: `test@example.com`
   - Password: `password123`
4. Try uploading some files!

### Test API
```bash
# Health check
curl http://localhost:3001/healthz

# Should return: {"status":"healthy","timestamp":"..."}
```

### Test Model Worker
```bash
# Health check
curl http://localhost:3002/health

# Should return: {"status":"healthy","models":{"text":"ready","image":"ready"}}
```

---

## Step 7: (Optional) Run Desktop App

```bash
pnpm --filter @ai-cleanup/desktop dev
```

This will:
1. Start Vite dev server
2. Launch Electron window
3. You'll need to enter a license key (generate one from the web app first)

---

## Troubleshooting

### Database Connection Failed

**Error:** `Can't reach database server at localhost:5432`

**Solution:**
1. Make sure PostgreSQL is running:
   ```bash
   # If using Docker:
   docker ps
   
   # If not running:
   docker start ai-cleanup-postgres
   ```

2. Test connection:
   ```bash
   # Windows (if psql is installed)
   psql -h localhost -U postgres -d ai_cleanup_dev
   
   # Or use Docker:
   docker exec -it ai-cleanup-postgres psql -U postgres -d ai_cleanup_dev
   ```

### Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
pnpm --filter @ai-cleanup/db db:generate
```

### Port Already in Use

**Error:** `Port 3001 is already in use`

**Solution:**
1. Find and kill the process using that port:
   ```bash
   # Windows
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   
   # Or change the port in services/api/src/config/env.ts
   ```

### Model Download Issues

**Error:** `Failed to download model`

**Solution:**
- Check internet connection
- Models are ~500MB total
- Clear cache and retry: `rm -rf node_modules/.cache`

---

## Quick Reference

### Test Credentials
```
Email: test@example.com
Password: password123

Email: demo@example.com  
Password: demo123

Email: admin@example.com
Password: admin123
```

### Default Ports
- Web App: http://localhost:3000
- API: http://localhost:3001  
- Model Worker: http://localhost:3002
- PostgreSQL: localhost:5432

### Useful Commands
```bash
# Rebuild everything
pnpm build

# Clean and rebuild
pnpm clean && pnpm build

# Check for type errors
pnpm typecheck

# Run linter
pnpm lint

# Database management
pnpm --filter @ai-cleanup/db db:studio  # Open Prisma Studio
pnpm --filter @ai-cleanup/db db:reset   # Reset database (WARNING: deletes data)
```

---

## Next Steps

Once everything is running:

1. **Test the web app** - Upload some files and see duplicate detection
2. **Generate a license key** - Use the web app (login, navigate to licenses)
3. **Test desktop app** - Use the license key to activate
4. **Explore the API** - Check out the Swagger docs (if configured)

---

## Need Help?

- Check `README.md` for architecture overview
- Check `PROJECT_COMPLETE.md` for full feature list
- Check individual package READMEs in `packages/` and `apps/`
- Review error logs in each terminal window

---

**You're all set! Enjoy using the AI File Cleanup System!** 🚀

