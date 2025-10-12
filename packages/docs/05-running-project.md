# Running the Project

This guide covers starting all services and accessing the application.

## Quick Start

### All Services at Once

```bash
# From project root
pnpm dev
```

This starts:

- ✅ Next.js web app (http://localhost:3000)
- ✅ Python API service (http://localhost:3001)
- ✅ Python ML service (http://localhost:3002)

**Expected output:**

```
> ai-file-cleanup@1.0.0 dev
> turbo dev

• Packages in scope: @ai-cleanup/db, @ai-cleanup/types, @ai-cleanup/ui, web
• Running dev in 4 packages
web:dev: ▲ Next.js 14.0.4
web:dev: - Local: http://localhost:3000
```

## Running Services Individually

### 1. Web Application (Next.js)

```bash
# Terminal 1
cd apps/web
pnpm dev
```

Access at: **http://localhost:3000**

### 2. API Service (Python/FastAPI)

```bash
# Terminal 2
cd services/api

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Start server
python run.py
```

Access at: **http://localhost:3001**
API Docs: **http://localhost:3001/docs**

### 3. ML Service (Python/FastAPI)

```bash
# Terminal 3
cd services/ml-service

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Start server
python run.py
```

Access at: **http://localhost:3002**
API Docs: **http://localhost:3002/docs**

### 4. Database (PostgreSQL)

```bash
# Start database
docker compose up -d

# Verify running
docker compose ps
```

## Accessing the Application

### Web Application

Open your browser and navigate to:

```
http://localhost:3000
```

### First Time Setup

1. **Create an account:**
   - Click "Sign Up" in the header
   - Enter your email, name, and password
   - Click "Create Account"

2. **You'll be automatically logged in** and redirected to the home page

3. **Test the features:**
   - Click "Upload" to upload files
   - Visit "Licenses" to generate desktop license keys
   - Click "Download" to see desktop app info

## Verifying All Services

### Check Service Health

**Web App:**

```bash
curl http://localhost:3000
# Should return HTML
```

**API Service:**

```bash
curl http://localhost:3001/health
# Should return: {"status":"healthy"}
```

**ML Service:**

```bash
curl http://localhost:3002/health
# Should return: {"status":"healthy"}
```

**Database:**

```bash
docker compose exec postgres psql -U postgres -d ai_file_cleanup -c "SELECT 1;"
# Should return: 1
```

## Development Workflow

### Making Changes

The project uses hot reload, so changes are automatically reflected:

**Frontend (Next.js):**

- Edit files in `apps/web/src/`
- Browser auto-refreshes

**API Service:**

- Edit files in `services/api/app/`
- Server auto-restarts (uvicorn --reload)

**ML Service:**

- Edit files in `services/ml-service/app/`
- Server auto-restarts (uvicorn --reload)

### Viewing Logs

**All services:**

```bash
pnpm dev
# Logs from all services appear in same terminal
```

**Individual service logs:**

```bash
# Web app
cd apps/web && pnpm dev

# API service
cd services/api && python run.py

# ML service
cd services/ml-service && python run.py

# Database
docker compose logs -f postgres
```

### Database Management

**View database in GUI:**

```bash
# Install Prisma Studio
pnpm install -g prisma

# Open Studio
cd packages/db
pnpm db:studio
```

Access at: **http://localhost:5555**

## Common Development Tasks

### Add New Dependencies

**Frontend (Next.js):**

```bash
cd apps/web
pnpm add <package-name>
```

**API Service:**

```bash
cd services/api
# Activate venv first
pip install <package-name>
pip freeze > requirements.txt
```

### Update Database Schema

1. Edit `packages/db/prisma/schema.prisma`
2. Run migration:

```bash
cd packages/db
pnpm db:push
pnpm db:generate
```

### Reset Database

```bash
cd packages/db
pnpm db:reset
```

### Run Type Check

```bash
# From project root
pnpm typecheck
```

### Run Linting

```bash
# From project root
pnpm lint
```

### Build for Production

```bash
# From project root
pnpm build
```

## Stopping Services

### Stop All Services

```bash
# Press Ctrl+C in terminal running pnpm dev
# Or close all individual terminals
```

### Stop Database

```bash
docker compose down
```

### Stop and Remove Database Data

```bash
docker compose down -v
```

## Troubleshooting

### Issue: Port already in use

**Solution:** Kill process using the port:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Issue: Database connection failed

**Solution:**

```bash
# Restart database
docker compose restart postgres

# Check if running
docker compose ps
```

### Issue: Python virtual environment not activated

**Solution:**

```bash
# Windows
cd services/api
venv\Scripts\activate

# macOS/Linux
cd services/api
source venv/bin/activate
```

### Issue: Module not found errors

**Solution:**

```bash
# Reinstall dependencies
pnpm install

# For Python services
pip install -r requirements.txt
```

### Issue: Prisma client not generated

**Solution:**

```bash
cd packages/db
pnpm db:generate
```

---

## Development URLs Summary

| Service       | URL                        | Description         |
| ------------- | -------------------------- | ------------------- |
| Web App       | http://localhost:3000      | Next.js frontend    |
| API Service   | http://localhost:3001      | FastAPI backend     |
| API Docs      | http://localhost:3001/docs | Swagger UI          |
| ML Service    | http://localhost:3002      | ML inference API    |
| ML Docs       | http://localhost:3002/docs | Swagger UI          |
| Prisma Studio | http://localhost:5555      | Database GUI        |
| PostgreSQL    | localhost:5433             | Database (via psql) |

## Next Steps

- Explore the [API Documentation](http://localhost:3001/docs)
- Read about [Deployment](./06-deployment.md) for production setup
- Check [Troubleshooting Guide](./07-troubleshooting.md) for common issues
