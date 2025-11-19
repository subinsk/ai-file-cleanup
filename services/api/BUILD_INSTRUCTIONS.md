# Docker Build Instructions for AI File Cleanup API

## Overview

The API service now uses Docker for deployment on Render. This allows us to include both Node.js (for Prisma client generation) and Python (for the FastAPI application) without requiring Node.js in local development.

## Local Testing (Optional)

To test the Docker build locally before deploying:

```bash
# From the repository root directory
docker build -f services/api/Dockerfile -t ai-cleanup-api .

# Test run locally (requires DATABASE_URL and other env vars)
docker run -p 3001:10000 \
  -e DATABASE_URL="your-database-url" \
  -e JWT_SECRET="your-secret" \
  ai-cleanup-api
```

**Note:** The build context must be the repository root (`.`) because the Dockerfile needs access to both:

- `packages/db/prisma/schema.prisma` (Prisma schema)
- `services/api/` (API application code)

## Deployment to Render

### Automatic Deployment

Once you push these changes to your Git repository:

1. **Render will automatically detect the Docker runtime**
2. **Build the multi-stage Docker image:**
   - Stage 1: Installs Node.js + Python, generates Prisma client
   - Stage 2: Creates final Python-only runtime image
3. **Deploy the container**

### Manual Deployment

You can also trigger a manual deploy from the Render Dashboard:

1. Go to your service: https://dashboard.render.com
2. Click "Manual Deploy" → "Deploy latest commit"

## What Changed

### Before (Native Python Runtime)

```yaml
runtime: python
buildCommand: pip install -r requirements.txt && prisma generate
startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- ❌ Failed because `prisma generate` needs Node.js/pnpm
- ❌ Render's Python runtime doesn't include Node.js

### After (Docker Runtime)

```yaml
runtime: docker
dockerfilePath: ./services/api/Dockerfile
dockerContext: ./
```

- ✅ Docker build includes Node.js for Prisma generation
- ✅ Final runtime image is Python-only (smaller, faster)
- ✅ Prisma client generates automatically during build

## File Structure

```
repository-root/
├── packages/
│   └── db/
│       └── prisma/
│           └── schema.prisma          ← Used during Docker build
├── services/
│   └── api/
│       ├── Dockerfile                 ← Multi-stage build definition
│       ├── .dockerignore              ← Optimizes build context
│       ├── render.yaml                ← Updated for Docker
│       ├── requirements.txt           ← Python dependencies
│       ├── run.py                     ← Application entrypoint
│       └── app/                       ← FastAPI application
```

## Troubleshooting

### Build fails with "schema.prisma not found"

- Ensure you're building from the repository root with context set to `.`
- Check that `packages/db/prisma/schema.prisma` exists

### Build fails with "Node.js not found"

- The Dockerfile should install Node.js in the builder stage
- Check that the NodeSource repository setup succeeded

### Runtime error: "Client hasn't been generated"

- This means Prisma generation failed during build
- Check build logs for errors in the `prisma generate` step

### Port binding issues

- The Dockerfile exposes port 10000 (Render's default)
- The `run.py` script reads the `PORT` environment variable
- Render will automatically set this

## Benefits of Docker Approach

- ✅ No Node.js required in local Python development
- ✅ Prisma generates automatically during deployment
- ✅ Consistent builds across all environments
- ✅ Smaller final image (Python-only runtime)
- ✅ Better isolation and reproducibility

## Next Steps

1. **Commit these changes:**

   ```bash
   git add services/api/Dockerfile
   git add services/api/.dockerignore
   git add services/api/render.yaml
   git add services/api/BUILD_INSTRUCTIONS.md
   git commit -m "Switch to Docker deployment for Prisma support"
   ```

2. **Push to trigger deployment:**

   ```bash
   git push origin dev
   ```

3. **Monitor the deployment:**
   - Go to Render Dashboard
   - Watch the build logs
   - Verify the deployment succeeds

## Support

If you encounter issues:

- Check Render build logs for detailed error messages
- Review this document for common troubleshooting steps
- Ensure all environment variables are set in Render Dashboard
