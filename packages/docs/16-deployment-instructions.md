# Step-by-Step Deployment Instructions

**Target:** Production Deployment on Vercel + Render  
**Estimated Time:** 4-6 hours (first time)  
**Prerequisites:** GitHub repository, payment method

---

## Pre-Deployment Checklist

- [ ] All code committed and pushed to GitHub
- [ ] `.env` files are NOT committed (in `.gitignore`)
- [ ] Database schema is up to date
- [ ] All tests passing locally
- [ ] Documentation reviewed
- [ ] Demo completed successfully

---

## Part 1: Database Setup (30 minutes)

### Option A: Neon (Recommended - Free Tier Available)

1. **Create Neon Account**

   ```
   Go to: https://neon.tech/
   Sign up with GitHub
   ```

2. **Create Database**
   - Click "Create Project"
   - Name: `ai-file-cleanup-prod`
   - Region: Choose closest to your users
   - PostgreSQL version: 15

3. **Enable pgvector Extension**

   ```sql
   -- In Neon SQL Editor
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

4. **Get Connection String**

   ```
   Format: postgresql://user:password@host/dbname?sslmode=require

   Save this - you'll need it for Render
   ```

### Option B: Render PostgreSQL

1. **Go to Render Dashboard**

   ```
   https://dashboard.render.com/
   ```

2. **New > PostgreSQL**
   - Name: `ai-file-cleanup-db`
   - Database: `aifilecleanup`
   - User: `aifilecleanup_user`
   - Region: Oregon (US West)
   - Plan: Free (for testing) or Starter ($7/mo)

3. **Wait for Creation** (~5 minutes)

4. **Enable pgvector**
   - Connect tab > External Connection String
   - Use `psql` to connect:

   ```bash
   psql postgresql://user:password@host/db
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

5. **Save Connection String**
   - Internal: Use for Render services
   - External: Use for local testing

---

## Part 2: Deploy ML Service (1-2 hours)

**Why first?** API service depends on ML service URL

### Step 1: Create Render Service

1. **Go to Render Dashboard**

   ```
   https://dashboard.render.com/
   ```

2. **New > Web Service**
   - Connect your GitHub repository
   - Name: `ai-file-cleanup-ml`
   - Root Directory: `services/ml-service`
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Configure Settings**
   - Region: Oregon (US West) - same as database
   - Plan: Starter ($7/mo) - Free tier too slow for ML
   - Branch: `main`
   - Auto-Deploy: Yes

### Step 2: Environment Variables

Add these in Render dashboard:

```bash
# Python environment
PYTHON_VERSION=3.10

# Application settings
NODE_ENV=production
PORT=10000

# Device (CPU for Render, GPU if available)
DEVICE=cpu

# Model cache
TRANSFORMERS_CACHE=/opt/render/.cache

# Logging
LOG_LEVEL=info
```

### Step 3: Deploy

1. Click "Create Web Service"
2. Wait for build (~10-15 minutes first time)
3. Watch logs for errors
4. Test health endpoint:
   ```bash
   curl https://ai-file-cleanup-ml.onrender.com/health
   ```

### Step 4: Save ML Service URL

```
ML_SERVICE_URL=https://ai-file-cleanup-ml.onrender.com
```

**Note:** Free tier services sleep after 15 min inactivity. Upgrade to Starter plan for production.

---

## Part 3: Deploy API Service (1-2 hours)

### Step 1: Create Render Service

1. **New > Web Service**
   - Repository: Your GitHub repo
   - Name: `ai-file-cleanup-api`
   - Root Directory: `services/api`
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

2. **Settings**
   - Region: Same as database
   - Plan: Starter ($7/mo minimum)
   - Branch: `main`
   - Auto-Deploy: Yes

### Step 2: Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host/db?sslmode=require

# API Settings
NODE_ENV=production
PORT=10000
API_URL=https://ai-file-cleanup-api.onrender.com

# ML Service
ML_SERVICE_URL=https://ai-file-cleanup-ml.onrender.com

# Security
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_GENERAL_MAX=100
RATE_LIMIT_GENERAL_WINDOW=60
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_AUTH_WINDOW=300
RATE_LIMIT_UPLOAD_MAX=20
RATE_LIMIT_UPLOAD_WINDOW=300

# File Upload
MAX_FILE_SIZE_MB=50
MAX_TOTAL_UPLOAD_SIZE_MB=500
MAX_FILES_PER_UPLOAD=100

# User Quotas
MAX_STORAGE_PER_USER_MB=1024
MAX_UPLOADS_PER_USER=50

# CORS
CORS_ORIGINS=https://your-app.vercel.app,https://www.your-domain.com

# Logging
LOG_LEVEL=info
```

**Important:** Generate secure JWT_SECRET:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 3: Run Database Migrations

1. **Wait for API service to build**

2. **Connect to Render Shell**
   - In Render dashboard: Service > Shell

   ```bash
   cd services/api
   prisma migrate deploy
   ```

3. **Verify Database**
   ```bash
   prisma studio
   # Check tables created
   ```

### Step 4: Test API

```bash
# Health check
curl https://ai-file-cleanup-api.onrender.com/health

# API docs
open https://ai-file-cleanup-api.onrender.com/docs
```

---

## Part 4: Deploy Web App to Vercel (30 minutes)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Link Project

```bash
cd apps/web
vercel link
```

Follow prompts:

- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- Project name? **ai-file-cleanup**
- Directory? **apps/web**

### Step 4: Set Environment Variables

```bash
# Via Vercel CLI
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://ai-file-cleanup-api.onrender.com

vercel env add NEXTAUTH_URL production
# Enter: https://your-app.vercel.app

vercel env add NEXTAUTH_SECRET production
# Enter: (generate with: openssl rand -base64 32)

vercel env add DATABASE_URL production
# Enter: Your database connection string
```

**Or via Vercel Dashboard:**

1. Go to Project Settings > Environment Variables
2. Add all variables
3. Select "Production" environment

### Step 5: Deploy

```bash
# From apps/web directory
vercel --prod
```

Wait for deployment (~2-5 minutes)

### Step 6: Configure Custom Domain (Optional)

1. **Vercel Dashboard > Domains**
2. **Add Domain:** `your-domain.com`
3. **Update DNS:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. **Wait for SSL** (~5 minutes)

### Step 7: Test Web App

```bash
# Open in browser
open https://your-app.vercel.app

# Test registration
# Test file upload
# Test duplicate detection
```

---

## Part 5: Post-Deployment Configuration (30 minutes)

### Update CORS Settings

1. **API Service > Environment Variables**

   ```bash
   CORS_ORIGINS=https://your-app.vercel.app,https://www.your-domain.com
   ```

2. **Redeploy API Service**

### Set Up Monitoring

**Vercel Analytics:**

```bash
cd apps/web
npm install @vercel/analytics
```

```javascript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Render Monitoring:**

- Built-in metrics available in dashboard
- Set up alerts for downtime

### Configure Backups

**Database Backups:**

- Neon: Automatic daily backups (free tier)
- Render: Enable automatic backups in settings

### Set Up Alerts

**Render:**

1. Service Settings > Notifications
2. Add email for:
   - Deploy failures
   - Service downtime
   - High memory usage

**Vercel:**

1. Project Settings > Notifications
2. Enable deployment notifications

---

## Part 6: Verify Deployment (15 minutes)

### End-to-End Test

1. **Registration Flow**

   ```
   - Navigate to https://your-app.vercel.app
   - Click Sign Up
   - Create account
   - Verify email received (if enabled)
   - Auto-login after registration
   ```

2. **Upload Flow**

   ```
   - Upload test files
   - Wait for processing
   - Check duplicate detection
   - Download cleaned ZIP
   ```

3. **API Direct Test**

   ```bash
   curl https://ai-file-cleanup-api.onrender.com/health
   # Should return: {"status": "healthy"}
   ```

4. **ML Service Test**
   ```bash
   curl https://ai-file-cleanup-ml.onrender.com/health
   # Should return: {"status": "healthy"}
   ```

### Performance Check

```bash
# Test response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-app.vercel.app
```

Create `curl-format.txt`:

```
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

**Expected:**

- Web app: < 2s
- API health: < 500ms
- ML health: < 1s (first request may be slower)

---

## Part 7: Enable CI/CD (30 minutes)

### Set GitHub Secrets

```bash
# Via GitHub CLI
gh secret set VERCEL_TOKEN --body "your-vercel-token"
gh secret set VERCEL_ORG_ID --body "your-org-id"
gh secret set VERCEL_PROJECT_ID --body "your-project-id"
gh secret set RENDER_API_KEY --body "your-render-key"
gh secret set RENDER_API_SERVICE_ID --body "api-service-id"
gh secret set RENDER_ML_SERVICE_ID --body "ml-service-id"
```

**Get Vercel Tokens:**

1. Vercel Dashboard > Settings > Tokens
2. Create token with deployment permissions
3. Get Org ID and Project ID from project settings

**Get Render Tokens:**

1. Render Dashboard > Account Settings > API Keys
2. Create new API key
3. Get Service IDs from each service settings

### Test CI/CD

```bash
# Make a small change
git commit -m "Test CI/CD"
git push origin main

# Watch GitHub Actions
gh run watch
```

### Verify Auto-Deploy

- GitHub Actions should trigger
- Tests should run
- Deployments should succeed
- Services should update automatically

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptoms:** API health check fails with DB error

**Solutions:**

```bash
# Verify connection string format
postgresql://user:password@host/dbname?sslmode=require

# Test connection
psql $DATABASE_URL

# Check Render service logs
render logs api-service-name
```

#### 2. ML Service Timeout

**Symptoms:** Slow duplicate detection, timeouts

**Solutions:**

- Upgrade to Starter plan (Free tier sleeps)
- Increase timeout in API service
- Add model warming endpoint

#### 3. CORS Errors

**Symptoms:** "CORS policy blocked" in browser

**Solutions:**

```bash
# Update API CORS_ORIGINS
CORS_ORIGINS=https://your-app.vercel.app

# Redeploy API service
```

#### 4. Environment Variables Not Loading

**Symptoms:** Features not working, "undefined" errors

**Solutions:**

- Verify all variables set in dashboard
- Restart service after adding variables
- Check for typos in variable names

#### 5. Build Failures

**Symptoms:** Deployment fails during build

**Solutions:**

```bash
# Check build logs
vercel logs

# Test build locally
cd apps/web
pnpm build

# Verify dependencies
pnpm install
```

---

## Rollback Procedures

### Web App (Vercel)

**Via Dashboard:**

1. Deployments tab
2. Find previous successful deployment
3. Click "Promote to Production"

**Via CLI:**

```bash
vercel rollback
```

### API/ML (Render)

**Via Dashboard:**

1. Service > Deploys
2. Find previous deploy
3. Click "Redeploy"

**Via API:**

```bash
curl -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services/$SERVICE_ID/deploys/$DEPLOY_ID/redeploy
```

### Database (Emergency)

**Point-in-Time Recovery:**

1. Render Dashboard > Database > Backups
2. Select backup
3. Restore to point in time

**Manual Backup:**

```bash
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

---

## Cost Estimation

### Free Tier (Testing)

| Service    | Plan  | Cost         |
| ---------- | ----- | ------------ |
| Vercel     | Hobby | $0           |
| Render API | Free  | $0           |
| Render ML  | Free  | $0           |
| Neon DB    | Free  | $0           |
| **Total**  |       | **$0/month** |

**Limitations:**

- Services sleep after 15 min
- Slow cold starts
- Limited compute
- 1GB database storage

### Production Tier

| Service    | Plan    | Cost          |
| ---------- | ------- | ------------- |
| Vercel     | Pro     | $20/month     |
| Render API | Starter | $7/month      |
| Render ML  | Starter | $7/month      |
| Neon DB    | Scale   | $19/month     |
| **Total**  |         | **$53/month** |

**Benefits:**

- Always on
- Fast performance
- 10GB database
- Auto-scaling
- Better support

---

## Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] Database uses SSL (sslmode=require)
- [ ] CORS_ORIGINS set correctly
- [ ] Rate limiting enabled
- [ ] File upload limits enforced
- [ ] User quotas active
- [ ] Sensitive data not in logs
- [ ] HTTPS enforced (automatic on Vercel/Render)
- [ ] Environment variables not committed
- [ ] API keys rotated regularly

---

## Monitoring & Maintenance

### Daily

- [ ] Check service health
- [ ] Review error logs
- [ ] Monitor response times

### Weekly

- [ ] Check database size
- [ ] Review security logs
- [ ] Update dependencies (if needed)

### Monthly

- [ ] Review costs
- [ ] Check backups
- [ ] Update documentation
- [ ] Performance optimization

---

## Success Criteria

Deployment is successful when:

✅ Web app loads at public URL  
✅ Users can register and login  
✅ File upload works  
✅ Duplicate detection works  
✅ Download works  
✅ All health checks passing  
✅ No errors in logs  
✅ Response times acceptable  
✅ CI/CD pipeline working  
✅ Monitoring configured

---

## Next Steps After Deployment

1. **Run UAT** - Follow UAT_PLAN.md
2. **Monitor for 1 week** - Watch for issues
3. **Collect feedback** - From real users
4. **Optimize** - Based on metrics
5. **Document issues** - Update documentation
6. **Plan next iteration** - Feature requests

---

**Questions?** Check DEPLOYMENT_RUNBOOK.md for detailed procedures.

**Need Help?** Review troubleshooting section or check service logs.

**Ready?** Follow this guide step-by-step. Allow 4-6 hours for first deployment.
