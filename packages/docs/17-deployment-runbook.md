# Deployment Runbook - AI File Cleanup

Complete deployment guide for web, API, and ML services to production environments.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Vercel Deployment (Web App)](#vercel-deployment-web-app)
3. [Render Deployment (API & ML)](#render-deployment-api--ml)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Health Checks](#health-checks)
7. [Rollback Procedures](#rollback-procedures)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Preparation

- [ ] All tests passing locally
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Security review completed
- [ ] Dependencies updated
- [ ] No console.log statements in production code
- [ ] Environment variables documented

### Database

- [ ] Migrations tested
- [ ] Backup strategy in place
- [ ] Connection pooling configured
- [ ] Indexes optimized
- [ ] PII data encrypted

### Security

- [ ] HTTPS configured
- [ ] CORS restricted to production domains
- [ ] Rate limiting enabled
- [ ] Authentication tested
- [ ] Secrets rotated
- [ ] Security headers configured

### Documentation

- [ ] API documentation updated
- [ ] Changelog updated
- [ ] README updated
- [ ] Runbook reviewed
- [ ] Monitoring dashboard configured

---

## Vercel Deployment (Web App)

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: `npm install -g vercel`
3. **GitHub Repository**: Connected to Vercel

### Initial Setup

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Link Project

```bash
cd apps/web
vercel link
```

Follow prompts:

- Select your account
- Link to existing project or create new
- Set project name: `ai-file-cleanup-web`

### Configuration

#### 4. Configure Build Settings

In Vercel Dashboard:

1. Go to Project Settings → General
2. Set **Framework Preset**: Next.js
3. Set **Root Directory**: `apps/web`
4. Set **Build Command**: `cd ../.. && pnpm turbo build --filter=@ai-cleanup/web...`
5. Set **Install Command**: `cd ../.. && pnpm install`
6. Set **Output Directory**: `.next`

#### 5. Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```env
# Production Environment Variables
NEXT_PUBLIC_API_URL=https://your-api.render.com
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate-strong-secret>
DATABASE_URL=<neon-database-url>
JWT_SECRET=<same-as-api>
```

**Generate Secrets:**

```bash
# Generate strong secrets
openssl rand -base64 32
```

### Deployment Steps

#### Method 1: Automatic (GitHub)

1. **Push to main branch**

```bash
git add .
git commit -m "Deploy: production release v1.0.0"
git push origin main
```

2. **Vercel auto-deploys** from main branch
3. **Monitor deployment** in Vercel dashboard

#### Method 2: Manual (CLI)

```bash
# From project root
cd apps/web

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Post-Deployment

#### 1. Verify Deployment

```bash
# Check deployment
curl -I https://your-app.vercel.app

# Expected: 200 OK
```

#### 2. Test Critical Paths

- [ ] Homepage loads
- [ ] Login/Register works
- [ ] File upload works
- [ ] Duplicate detection works
- [ ] Download works

#### 3. Check Logs

```bash
# View logs
vercel logs https://your-app.vercel.app

# Or in dashboard: Deployments → Select deployment → Logs
```

### Custom Domain (Optional)

1. **Go to** Project Settings → Domains
2. **Add** your custom domain
3. **Configure DNS** as instructed
4. **Wait** for DNS propagation (up to 24 hours)
5. **SSL** automatically provisioned

---

## Render Deployment (API & ML)

### Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Connected to Render
3. **Database**: Neon PostgreSQL or Render PostgreSQL

### API Service Deployment

#### 1. Create Web Service

1. **Login** to Render Dashboard
2. **Click** "New +" → "Web Service"
3. **Connect** GitHub repository
4. **Configure Service:**

```yaml
Name: ai-cleanup-api
Region: Oregon (or closest to users)
Branch: main
Root Directory: services/api
Runtime: Python 3.11
Build Command: pip install -r requirements.txt && prisma generate
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Plan: Starter (or higher)
```

#### 2. Environment Variables

In Render Dashboard → Environment:

```env
# Python
PYTHON_VERSION=3.11.0

# Node (for Prisma)
NODE_ENV=production
NODE_VERSION=18

# Application
PORT=10000
HOST=0.0.0.0
LOG_LEVEL=INFO

# Database
DATABASE_URL=<neon-or-render-postgres-url>

# Security
JWT_SECRET=<strong-secret-same-as-web>
SESSION_SECRET=<strong-secret>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080

# CORS
CORS_ORIGINS=https://your-app.vercel.app
ALLOWED_HOSTS=ai-cleanup-api.onrender.com

# File Upload
MAX_FILE_SIZE_MB=50
MAX_TOTAL_UPLOAD_SIZE_MB=500
MAX_FILES_PER_UPLOAD=100
UPLOAD_DIR=/tmp/uploads

# ML Service
ML_SERVICE_URL=https://ai-cleanup-ml.onrender.com
ML_SERVICE_TIMEOUT=30

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_SECONDS=60
```

#### 3. Health Check

```yaml
Health Check Path: /health
```

#### 4. Deploy

1. **Click** "Create Web Service"
2. **Monitor** build logs
3. **Wait** for deployment (5-10 minutes first time)

### ML Service Deployment

#### 1. Create Web Service

Same as API, but with:

```yaml
Name: ai-cleanup-ml
Root Directory: services/ml-service
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### 2. Environment Variables

```env
PYTHON_VERSION=3.11.0
NODE_ENV=production
PORT=10000
HOST=0.0.0.0
MODEL_CACHE_DIR=/opt/render/project/models_cache
BATCH_SIZE=32
MAX_CONCURRENT_REQUESTS=10
```

#### 3. Disk Storage

ML models need persistent storage:

1. **Go to** Service → Settings → Disks
2. **Add Disk**:
   - Name: `models_cache`
   - Mount Path: `/opt/render/project/models_cache`
   - Size: 10GB

### Post-Deployment

#### 1. Verify API

```bash
# Health check
curl https://ai-cleanup-api.onrender.com/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "version": "1.0.0"
}
```

#### 2. Verify ML Service

```bash
curl https://ai-cleanup-ml.onrender.com/health
```

#### 3. Test Integration

```bash
# From web app, test file upload
# Should connect to API → ML service
```

### Render Configuration Tips

#### Auto-Deploy

- **Main branch** auto-deploys by default
- **Preview deploys** for pull requests (optional)
- **Manual deploys** from dashboard

#### Logs

```bash
# View in dashboard
Services → Your Service → Logs

# Or use Render CLI
render logs <service-id>
```

#### Scaling

```yaml
# In dashboard: Settings → Scaling
Instances: 1 (free tier) or more (paid)
Auto-scaling: Configure based on CPU/memory
```

---

## Database Setup

### Neon PostgreSQL (Recommended)

#### 1. Create Database

1. **Sign up** at [neon.tech](https://neon.tech)
2. **Create Project**: "AI File Cleanup"
3. **Copy** connection string

#### 2. Enable Extensions

```sql
-- Connect to database
psql <connection-string>

-- Enable pgvector for embeddings (if needed later)
CREATE EXTENSION IF NOT EXISTS vector;

-- Exit
\q
```

#### 3. Run Migrations

```bash
cd packages/db

# Set DATABASE_URL
export DATABASE_URL="<neon-connection-string>"

# Run migrations
pnpm db:migrate:deploy

# Verify
pnpm db:studio
```

### Render PostgreSQL (Alternative)

1. **Create Database** in Render Dashboard
2. **Copy** Internal/External URLs
3. **Use Internal URL** for API service (faster)
4. **Run migrations** as above

### Database Configuration

#### Connection Pooling

```env
# Add to DATABASE_URL
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

#### Backup Strategy

1. **Neon**: Automatic backups included
2. **Render**: Configure in dashboard
3. **Manual Backup**:

```bash
# Export database
pg_dump <DATABASE_URL> > backup.sql

# Restore
psql <DATABASE_URL> < backup.sql
```

---

## Environment Configuration

### Production Environment Variables Summary

#### Web App (Vercel)

```env
NEXT_PUBLIC_API_URL=https://ai-cleanup-api.onrender.com
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<secret>
DATABASE_URL=<database-url>
JWT_SECRET=<secret>
```

#### API Service (Render)

```env
DATABASE_URL=<database-url>
JWT_SECRET=<secret>
SESSION_SECRET=<secret>
CORS_ORIGINS=https://your-app.vercel.app
ML_SERVICE_URL=https://ai-cleanup-ml.onrender.com
```

#### ML Service (Render)

```env
MODEL_CACHE_DIR=/opt/render/project/models_cache
```

### Secret Management

#### Generating Secrets

```bash
# JWT Secret (32 bytes)
openssl rand -base64 32

# Session Secret (32 bytes)
openssl rand -base64 32

# API Key (if needed)
openssl rand -hex 32
```

#### Rotating Secrets

1. **Generate** new secrets
2. **Update** in all environments
3. **Deploy** services in order: API → Web
4. **Verify** authentication still works
5. **Invalidate** old secrets

---

## Health Checks

### Automated Health Monitoring

#### API Health Check

```bash
#!/bin/bash
# healthcheck.sh

API_URL="https://ai-cleanup-api.onrender.com"

# Check API
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")

if [ "$response" != "200" ]; then
    echo "API health check failed: $response"
    exit 1
fi

echo "API health check passed"
```

#### Comprehensive Check

```bash
#!/bin/bash
# full-health-check.sh

WEB_URL="https://your-app.vercel.app"
API_URL="https://ai-cleanup-api.onrender.com"
ML_URL="https://ai-cleanup-ml.onrender.com"

# Check Web
echo "Checking Web..."
curl -f $WEB_URL || exit 1

# Check API
echo "Checking API..."
curl -f $API_URL/health || exit 1

# Check ML
echo "Checking ML..."
curl -f $ML_URL/health || exit 1

echo "All services healthy!"
```

### Monitoring Tools

#### UptimeRobot (Free)

1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitors for each URL
3. Set up email/SMS alerts

#### Better Stack (Paid)

- Advanced monitoring
- Log aggregation
- Error tracking
- Custom dashboards

---

## Rollback Procedures

### Vercel Rollback

#### Method 1: Dashboard

1. **Go to** Deployments
2. **Find** previous stable deployment
3. **Click** three dots → "Promote to Production"
4. **Confirm** rollback

#### Method 2: CLI

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote <deployment-url>
```

### Render Rollback

#### Dashboard Rollback

1. **Go to** Service → Deploys
2. **Find** previous deployment
3. **Click** "Rollback to this version"
4. **Confirm**

#### Manual Rollback

```bash
# Revert Git commit
git revert HEAD
git push origin main

# Render auto-deploys reverted version
```

### Database Rollback

**CAUTION**: Database rollbacks are risky!

#### Safe Approach

1. **Don't** rollback automatically
2. **Review** migration impact
3. **Test** on staging first
4. **Manual** rollback if necessary:

```bash
# Rollback last migration
cd packages/db
pnpm db:migrate rollback

# Or restore from backup
psql <DATABASE_URL> < backup-before-deploy.sql
```

### Emergency Rollback Checklist

When things go wrong:

1. [ ] **Verify** the issue (not false alarm)
2. [ ] **Notify** team/stakeholders
3. [ ] **Check** error logs
4. [ ] **Rollback Web** app (if needed)
5. [ ] **Rollback API** service (if needed)
6. [ ] **Check Database** integrity
7. [ ] **Verify** services after rollback
8. [ ] **Document** incident
9. [ ] **Post-mortem** meeting
10. [ ] **Fix** issue before re-deploying

---

## Monitoring & Alerts

### Application Monitoring

#### Render Metrics

- CPU usage
- Memory usage
- Response time
- Error rate

#### Vercel Analytics

- Page views
- Core Web Vitals
- Edge requests
- Bandwidth

### Custom Monitoring

#### Sentry (Error Tracking)

```bash
# Install
pnpm add @sentry/nextjs @sentry/node

# Configure
# apps/web/sentry.config.js
# services/api/sentry.py
```

#### LogTail (Log Aggregation)

```bash
# Configure in Render
# Environment → Add Source → Render
```

### Alert Configuration

#### Critical Alerts

- Service down (>1 minute)
- Error rate >5%
- Response time >2s
- Database connection failed

#### Warning Alerts

- CPU usage >80%
- Memory usage >80%
- Disk space <20%
- Rate limit triggered

### Alert Channels

- Email: team@aifilecleanup.com
- Slack: #alerts channel
- PagerDuty: For on-call team

---

## Troubleshooting

### Common Deployment Issues

#### 1. Build Fails on Vercel

**Error**: `Module not found: Can't resolve '@ai-cleanup/types'`

**Solution**:

```bash
# Update vercel.json build command
{
  "buildCommand": "cd ../.. && pnpm install && pnpm build:packages && pnpm turbo build --filter=@ai-cleanup/web..."
}
```

#### 2. API Service Won't Start on Render

**Error**: `ModuleNotFoundError: No module named 'prisma'`

**Solution**:

```bash
# Update build command in Render
pip install -r requirements.txt && npm install prisma && prisma generate
```

#### 3. Database Connection Timeout

**Error**: `Can't reach database server`

**Solution**:

- Check DATABASE_URL is correct
- Verify database is running
- Check IP whitelist (Neon)
- Increase connection timeout

#### 4. CORS Errors in Production

**Error**: `Access-Control-Allow-Origin error`

**Solution**:

```env
# Update API .env
CORS_ORIGINS=https://your-actual-domain.vercel.app
# Not http, not localhost, exact domain
```

#### 5. ML Service Out of Memory

**Error**: `Process killed (out of memory)`

**Solution**:

- Upgrade Render plan (more RAM)
- Reduce BATCH_SIZE
- Add swap space
- Optimize model loading

### Debug Commands

```bash
# Check Render logs
render logs ai-cleanup-api --tail

# Check Vercel logs
vercel logs https://your-app.vercel.app --follow

# Test API locally with production env
export $(cat .env.production | xargs)
uvicorn app.main:app

# Check database connection
psql $DATABASE_URL -c "SELECT version();"
```

### Getting Help

- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Render Support: [render.com/docs](https://render.com/docs)
- Project Issues: GitHub Issues
- Team Chat: Slack #deployment

---

## Deployment Checklist

### Pre-Deploy

- [ ] Code reviewed and approved
- [ ] Tests passing
- [ ] Security scan completed
- [ ] Database backup created
- [ ] Rollback plan prepared
- [ ] Team notified

### Deploy

- [ ] Deploy API service first
- [ ] Verify API health
- [ ] Deploy ML service
- [ ] Verify ML health
- [ ] Run database migrations
- [ ] Deploy Web app
- [ ] Verify web app

### Post-Deploy

- [ ] Smoke tests passed
- [ ] Health checks passing
- [ ] Monitoring active
- [ ] Performance metrics normal
- [ ] Error rate normal
- [ ] User testing completed
- [ ] Documentation updated
- [ ] Deployment logged

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Maintained by:** DevOps Team
