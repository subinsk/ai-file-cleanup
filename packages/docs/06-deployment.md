# Deployment Guide

This guide covers deploying the AI File Cleanup system to production using free/affordable cloud services.

## Recommended Stack

- **Frontend (Next.js):** Vercel
- **API Service (Python):** Render
- **ML Service (Python):** Render
- **Database (PostgreSQL + pgvector):** Neon
- **GitHub:** For code repository and CI/CD

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ Render account (sign up at [render.com](https://render.com))
- ✅ Neon account (sign up at [neon.tech](https://neon.tech))
- ✅ Project pushed to GitHub

---

## Step 1: Deploy Database (Neon)

### 1.1 Create Neon Project

1. Go to [Neon Console](https://console.neon.tech)
2. Click **"Create a project"**
3. Configure:
   - **Name:** `ai-file-cleanup-db`
   - **Region:** Choose closest to your users
   - **Postgres version:** 15 or 16
4. Click **"Create project"**

### 1.2 Enable pgvector Extension

```sql
-- Run this in Neon SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

**Steps:**

1. Open your Neon project
2. Go to **"SQL Editor"**
3. Paste the above SQL
4. Click **"Run"**

### 1.3 Get Connection String

1. In Neon Console, go to **"Dashboard"**
2. Copy the **"Connection string"**
3. It looks like: `postgresql://user:password@host/dbname?sslmode=require`
4. Save this - you'll need it for API and ML services

### 1.4 Run Database Migrations

**From your local machine:**

```bash
# Set the DATABASE_URL to your Neon connection string
cd packages/db

# Create .env file
echo "DATABASE_URL=your-neon-connection-string" > .env

# Run migrations
npx prisma migrate deploy
```

**Expected output:**

```
Applying migration `20240101000000_init`
The following migration(s) have been applied:

migrations/
  └─ 20240101000000_init/
    └─ migration.sql

✅ All migrations have been successfully applied.
```

---

## Step 2: Deploy Python API Service (Render)

### 2.1 Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `ai-file-cleanup-api`
   - **Region:** Same as Neon database
   - **Branch:** `main`
   - **Root Directory:** `services/api`
   - **Runtime:** `Python 3`
   - **Build Command:** `chmod +x build.sh && ./build.sh`
   - **Start Command:** `python run.py`
   - **Instance Type:** `Free` (or `Starter` for better performance)

### 2.2 Environment Variables

Add these environment variables in Render:

| Key              | Value                                    | Description                                      |
| ---------------- | ---------------------------------------- | ------------------------------------------------ |
| `DATABASE_URL`   | `your-neon-connection-string`            | From Neon dashboard                              |
| `JWT_SECRET`     | `your-random-32-char-secret`             | Generate with: `openssl rand -hex 32`            |
| `SESSION_SECRET` | `your-random-32-char-secret`             | Generate with: `openssl rand -hex 32`            |
| `NODE_ENV`       | `production`                             | Environment                                      |
| `PORT`           | `3001`                                   | API port                                         |
| `CORS_ORIGINS`   | `["https://your-vercel-app.vercel.app"]` | Your frontend URL (add after deploying frontend) |
| `ML_SERVICE_URL` | `https://your-ml-service.onrender.com`   | ML service URL (add after deploying ML service)  |

**To generate secrets:**

```bash
# On Linux/Mac
openssl rand -hex 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 255 }))
```

### 2.3 Deploy

1. Click **"Create Web Service"**
2. Wait for build to complete (5-10 minutes)
3. Copy the service URL (e.g., `https://ai-file-cleanup-api.onrender.com`)

### 2.4 Verify Deployment

Test the health endpoint:

```bash
curl https://your-api-service.onrender.com/health
```

**Expected response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Step 3: Deploy ML Service (Render)

### 3.1 Create Web Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect same GitHub repository
3. Configure:
   - **Name:** `ai-file-cleanup-ml`
   - **Region:** Same as API service
   - **Branch:** `main`
   - **Root Directory:** `services/ml-service`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free` (or `Starter` with 1GB+ RAM recommended)

### 3.2 Environment Variables

| Key         | Value     | Description                          |
| ----------- | --------- | ------------------------------------ |
| `HOST`      | `0.0.0.0` | Listen on all interfaces             |
| `PORT`      | `3002`    | ML service port                      |
| `DEVICE`    | `cpu`     | Use CPU (or `cuda` if GPU available) |
| `LOG_LEVEL` | `info`    | Logging level                        |

### 3.3 Deploy

1. Click **"Create Web Service"**
2. Wait for build (10-15 minutes - models need to download)
3. Copy the service URL

### 3.4 Update API Service

Go back to your API service in Render and update:

- `ML_SERVICE_URL` → `https://your-ml-service.onrender.com`

---

## Step 4: Deploy Frontend (Vercel)

### 4.1 Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `apps/web`
   - **Build Command:** `pnpm build` (or `npm run build`)
   - **Output Directory:** `.next`
   - **Install Command:** `pnpm install` (or `npm install`)

### 4.2 Environment Variables

Add these in Vercel:

| Key                   | Value                                   | Description                 |
| --------------------- | --------------------------------------- | --------------------------- |
| `NEXTAUTH_SECRET`     | `your-random-32-char-secret`            | Generate new secret         |
| `NEXTAUTH_URL`        | `https://your-app.vercel.app`           | Your Vercel URL (auto-set)  |
| `NEXT_PUBLIC_API_URL` | `https://your-api-service.onrender.com` | API service URL from Step 2 |

### 4.3 Deploy

1. Click **"Deploy"**
2. Wait for build (3-5 minutes)
3. Copy your Vercel URL (e.g., `https://ai-file-cleanup.vercel.app`)

### 4.4 Update API CORS

Go back to Render API service and update:

- `CORS_ORIGINS` → `["https://your-vercel-app.vercel.app"]`

---

## Step 5: Verify Full Deployment

### 5.1 Test Frontend

1. Visit your Vercel URL
2. Sign up for a new account
3. Verify email/password login works

### 5.2 Test API

```bash
# Health check
curl https://your-api-service.onrender.com/health

# Test registration
curl -X POST https://your-api-service.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234","name":"Test User"}'
```

### 5.3 Test ML Service

```bash
# Health check
curl https://your-ml-service.onrender.com/health

# Test text embedding
curl -X POST https://your-ml-service.onrender.com/embeddings/text \
  -H "Content-Type: application/json" \
  -d '{"texts":["Hello world"]}'
```

### 5.4 Test License Generation

1. Log in to your deployed app
2. Go to **"Licenses"** page
3. Click **"Generate License Key"**
4. Verify license key is created and displayed

---

## Step 6: Custom Domain (Optional)

### 6.1 Add Domain to Vercel

1. Go to your Vercel project settings
2. Navigate to **"Domains"**
3. Add your custom domain (e.g., `app.yourdomain.com`)
4. Follow DNS configuration instructions

### 6.2 Update Environment Variables

Update these URLs with your custom domain:

- Vercel: `NEXTAUTH_URL` → `https://app.yourdomain.com`
- Render API: `CORS_ORIGINS` → `["https://app.yourdomain.com"]`

---

## Monitoring & Maintenance

### Logging

**Vercel (Frontend):**

- View logs in Vercel Dashboard → Your Project → Deployments → Logs

**Render (API & ML):**

- View logs in Render Dashboard → Your Service → Logs

### Health Checks

Set up automated health checks:

```bash
# Create a simple monitoring script
#!/bin/bash

# Check API
curl -f https://your-api.onrender.com/health || echo "API DOWN"

# Check ML
curl -f https://your-ml.onrender.com/health || echo "ML DOWN"

# Check Frontend
curl -f https://your-app.vercel.app || echo "FRONTEND DOWN"
```

Run this with a cron job or use services like:

- **UptimeRobot** (free)
- **Pingdom**
- **Better Uptime**

### Database Backups

Neon automatically backs up your database. To restore:

1. Go to Neon Console
2. Navigate to **"Backups"**
3. Select a backup point
4. Click **"Restore"**

### Scaling Considerations

**Free Tier Limits:**

- **Render:** Services sleep after 15 min of inactivity
- **Neon:** 512 MB storage limit
- **Vercel:** 100 GB bandwidth/month

**To upgrade:**

- Render: Upgrade to Starter ($7/month per service)
- Neon: Pro plan ($19/month)
- Vercel: Pro plan ($20/month)

---

## Troubleshooting

### API Service Build Fails (Prisma Error)

**Issue:** Build fails with `pnpm add prisma` error or "Command failed with exit code 1"

**Solution:**
This happens when Prisma tries to install Node.js dependencies in a Python-only environment.

**✅ Fixed in latest code!** The startup script now:

1. Generates Prisma client BEFORE importing any modules
2. Handles Python-only environments gracefully
3. Shows clear status messages

**Just push and redeploy:**

```bash
git add .
git commit -m "Fix Prisma generation for Render"
git push origin main
```

Render will auto-deploy and you should see:

```
📦 Checking Prisma client...
✅ Prisma client generated successfully!
🚀 Starting server on port 10000...
```

### API Service Won't Start

**Issue:** Service starts but crashes immediately

**Solution:**

1. Check Render logs for errors
2. Verify all environment variables are set
3. Ensure `DATABASE_URL` is correct and includes `?sslmode=require`
4. Check database is accessible from Render

### ML Service Out of Memory

**Issue:** Service crashes with memory errors

**Solution:**

1. Upgrade to Starter plan (1GB+ RAM)
2. Or reduce model size in `services/ml-service/app/core/models.py`:
   ```python
   # Use smaller models
   TEXT_MODEL = "distilbert-base-uncased"  # Instead of large models
   ```

### CORS Errors

**Issue:** Frontend can't connect to API

**Solution:**

1. Verify `CORS_ORIGINS` in API includes your Vercel URL
2. Ensure URLs don't have trailing slashes
3. Check browser console for exact error

### Database Connection Failed

**Issue:** API can't connect to Neon

**Solution:**

1. Verify `DATABASE_URL` in Render
2. Ensure `?sslmode=require` is at end of connection string
3. Check Neon database is not paused (free tier pauses after 7 days inactivity)

### NextAuth Errors

**Issue:** Login/logout doesn't work

**Solution:**

1. Verify `NEXTAUTH_SECRET` is set in Vercel
2. Ensure `NEXTAUTH_URL` matches your domain
3. Check `NEXT_PUBLIC_API_URL` points to correct API

---

## Security Checklist

Before going live, ensure:

- ✅ All secrets are randomly generated (32+ characters)
- ✅ `NODE_ENV=production` in API service
- ✅ CORS is restricted to your frontend domain only
- ✅ Database backups are enabled
- ✅ HTTPS is enforced (automatic on Vercel/Render)
- ✅ Rate limiting is configured (add in production)
- ✅ No `.env` files committed to Git
- ✅ API keys are in environment variables only

---

## CI/CD Pipeline

All deployments are automatic when you push to GitHub:

1. **Push to `main` branch**
2. **Vercel** automatically deploys frontend
3. **Render** automatically deploys API and ML services
4. **Migrations** run automatically on API service startup

**To disable auto-deploy:**

- Vercel: Project Settings → Git → Disable "Auto-deploy"
- Render: Service Settings → Build & Deploy → Set to "Manual"

---

## Cost Estimation

**Free Tier (Good for testing):**

- Neon: $0
- Render: $0 (2 services)
- Vercel: $0
- **Total: $0/month**

**Production (Recommended):**

- Neon Pro: $19/month
- Render Starter (API): $7/month
- Render Starter (ML): $7/month
- Vercel Pro: $20/month
- **Total: ~$53/month**

---

## Next Steps

After successful deployment:

1. **Set up monitoring** - Use UptimeRobot or similar
2. **Configure analytics** - Add Vercel Analytics or Google Analytics
3. **Add error tracking** - Integrate Sentry or similar
4. **Set up staging environment** - Create separate Render/Vercel environments
5. **Document your deployment** - Save all URLs and credentials securely

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

**Need help?** Check our [GitHub Issues](https://github.com/your-repo/issues) or join our community discussions.
