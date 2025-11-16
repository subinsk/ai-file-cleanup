# CI/CD Pipeline Configuration Guide

## Overview

This guide explains the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the AI File Cleanup project using GitHub Actions.

---

## Pipeline Overview

The CI/CD pipeline automates:

- ✅ Code quality checks (linting, type checking)
- ✅ Unit testing (API, services)
- ✅ E2E testing (web app)
- ✅ Building (web app, desktop installers)
- ✅ Deployment (Vercel for web, Render for API/ML)
- ✅ Release creation (GitHub Releases)

---

## Workflow Stages

### 1. **Code Quality** (Always)

- Lint TypeScript/Python code
- Type checking
- Format validation
- **Triggers:** All push/PR events
- **Duration:** ~2-3 minutes

### 2. **Unit Tests** (Always)

- API endpoint tests
- Service logic tests
- Database integration tests
- **Triggers:** All push/PR events
- **Duration:** ~5-10 minutes
- **Requirements:** PostgreSQL database

### 3. **E2E Tests** (Always)

- Full user workflow testing
- Browser compatibility (Chromium, Firefox, WebKit)
- Mobile responsiveness
- **Triggers:** All push/PR events
- **Duration:** ~10-15 minutes
- **Requirements:** All services running

### 4. **Build** (Always)

- Web app build (.next artifacts)
- Desktop app build (Windows, macOS, Linux)
- **Triggers:** All push/PR events (after tests pass)
- **Duration:** ~10-20 minutes
- **Outputs:** Artifacts for deployment/release

### 5. **Deploy** (Main branch & tags only)

- Web app → Vercel
- API service → Render
- ML service → Render
- **Triggers:** Push to `main` or version tags (`v*`)
- **Duration:** ~5-10 minutes
- **Requirements:** Deployment credentials

### 6. **Release** (Version tags only)

- Create GitHub Release
- Upload desktop installers
- Generate release notes
- **Triggers:** Version tags (`v1.0.0`, etc.)
- **Duration:** ~2-3 minutes

---

## Configuration File

### Location

`.github/workflows/ci-cd.yml`

### Key Components

```yaml
# Trigger events
on:
  push:
    branches: [main, develop]
    tags: ['v*']
  pull_request:
    branches: [main, develop]

# Environment variables
env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.10'
  PNPM_VERSION: '8'

# Jobs (run in parallel where possible)
jobs:
  lint: # Code quality
  test-unit: # Unit tests
  test-e2e: # E2E tests
  build-web: # Build web app
  build-desktop: # Build desktop (matrix: Win/Mac/Linux)
  deploy-web: # Deploy to Vercel
  deploy-api: # Deploy API to Render
  deploy-ml: # Deploy ML to Render
  release: # Create GitHub Release
  notify: # Send notifications
```

---

## GitHub Secrets Required

### Vercel Deployment

```bash
# Get from Vercel dashboard
VERCEL_TOKEN=xxx
VERCEL_ORG_ID=xxx
VERCEL_PROJECT_ID=xxx
```

**How to obtain:**

1. Go to https://vercel.com/account/tokens
2. Create new token
3. Get Org ID and Project ID from project settings

### Render Deployment

```bash
# Get from Render dashboard
RENDER_API_KEY=xxx
RENDER_API_SERVICE_ID=xxx
RENDER_ML_SERVICE_ID=xxx
```

**How to obtain:**

1. Go to https://dashboard.render.com/account
2. Create API key
3. Get Service IDs from each service settings

### Code Signing (Optional)

```bash
# For Windows code signing
CSC_LINK=base64_encoded_certificate
CSC_KEY_PASSWORD=certificate_password

# For macOS code signing
APPLE_ID=your_apple_id
APPLE_ID_PASSWORD=app_specific_password
```

### Setting Secrets in GitHub

```bash
# Via GitHub UI:
# Repository → Settings → Secrets and variables → Actions → New repository secret

# Or via GitHub CLI:
gh secret set VERCEL_TOKEN --body "your-token"
gh secret set RENDER_API_KEY --body "your-key"
```

---

## Workflow Details

### Lint Job

```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - Checkout code
    - Setup Node.js + pnpm
    - Install dependencies
    - Run lint
    - Run type-check
```

**What it checks:**

- ESLint rules
- TypeScript errors
- Code formatting (Prettier)
- Import ordering

### Test-Unit Job

```yaml
test-unit:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:15
  steps:
    - Setup environment
    - Install dependencies (Node + Python)
    - Run pytest tests
```

**What it tests:**

- API endpoints
- Database operations
- Service functions
- Error handling

### Test-E2E Job

```yaml
test-e2e:
  runs-on: ubuntu-latest
  steps:
    - Setup environment
    - Install Playwright + browsers
    - Start all services
    - Run E2E tests
    - Upload test reports
```

**What it tests:**

- User registration/login
- File upload
- Duplicate detection
- Download functionality
- Quota management

### Build-Web Job

```yaml
build-web:
  needs: [lint, test-unit]
  steps:
    - Build Next.js app
    - Upload .next artifacts
```

**Outputs:**

- `.next/` directory (production build)
- Static assets
- Server bundles

### Build-Desktop Job

```yaml
build-desktop:
  strategy:
    matrix:
      os: [windows-latest, macos-latest, ubuntu-latest]
  steps:
    - Build Electron app
    - Package for OS
    - Upload installers
```

**Outputs:**

- Windows: `.exe` installer
- macOS: `.dmg` installer
- Linux: `.AppImage` installer

### Deploy-Web Job

```yaml
deploy-web:
  needs: [build-web, test-e2e]
  if: github.ref == 'refs/heads/main'
  steps:
    - Download build artifacts
    - Deploy to Vercel
```

**Deployment target:**

- Production: `https://your-app.vercel.app`
- Preview: `https://your-app-git-branch.vercel.app`

### Deploy-API Job

```yaml
deploy-api:
  needs: [test-unit]
  if: github.ref == 'refs/heads/main'
  steps:
    - Trigger Render deployment via API
```

**Deployment process:**

1. Render pulls latest code from Git
2. Installs dependencies
3. Runs database migrations
4. Starts service

### Release Job

```yaml
release:
  needs: [build-desktop, deploy-web, deploy-api, deploy-ml]
  if: startsWith(github.ref, 'refs/tags/v')
  steps:
    - Download all installers
    - Create GitHub Release
    - Upload installers as assets
```

**Creates:**

- GitHub Release page
- Changelog from commits
- Downloadable installers

---

## Triggering the Pipeline

### On Push to Main

```bash
git push origin main
```

**What runs:**

- Lint, test, build
- Deploy to production

### On Pull Request

```bash
git push origin feature-branch
# Open PR on GitHub
```

**What runs:**

- Lint, test, build
- No deployment

### On Version Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

**What runs:**

- Lint, test, build
- Deploy to production
- Create GitHub Release

### Manual Trigger

```bash
# Via GitHub UI:
# Actions tab → Select workflow → Run workflow

# Via GitHub CLI:
gh workflow run ci-cd.yml
```

---

## Monitoring Pipeline

### Via GitHub UI

1. Go to **Actions** tab
2. See all workflow runs
3. Click run to see details
4. View logs for each job

### Via GitHub CLI

```bash
# List recent runs
gh run list

# View specific run
gh run view <run-id>

# Watch live
gh run watch <run-id>

# View logs
gh run view <run-id> --log
```

### Status Badge

Add to README:

```markdown
![CI/CD](https://github.com/your-username/ai-file-cleanup/workflows/CI%2FCD%20Pipeline/badge.svg)
```

---

## Handling Failures

### Lint Failures

**Common issues:**

- ESLint errors
- TypeScript errors
- Formatting issues

**Fix:**

```bash
pnpm lint --fix
pnpm format
```

### Test Failures

**Common issues:**

- API endpoint changes
- Database schema changes
- Environment variables missing

**Fix:**

```bash
# Run tests locally
cd services/api
pytest tests/ -v

# Update tests or fix code
```

### Build Failures

**Common issues:**

- Dependency conflicts
- Missing environment variables
- Out of memory

**Fix:**

```bash
# Build locally first
pnpm build

# Check logs in GitHub Actions
# Increase memory if needed
```

### Deployment Failures

**Common issues:**

- Invalid credentials
- Service unavailable
- Environment mismatch

**Fix:**

```bash
# Verify secrets
gh secret list

# Check Vercel/Render status
# Redeploy manually if needed
```

---

## Best Practices

### 1. Branch Protection

Enable in GitHub settings:

- ✅ Require status checks before merging
- ✅ Require branches to be up to date
- ✅ Require review from code owners
- ✅ Restrict push to main branch

### 2. Environment Variables

**Development:**

```bash
# .env.local (not committed)
DATABASE_URL=postgresql://localhost:5432/dev
```

**CI:**

```yaml
# GitHub Actions environment
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
```

**Production:**

```bash
# Vercel/Render environment variables
DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 3. Caching

**Already implemented:**

```yaml
- uses: actions/setup-node@v3
  with:
    cache: 'pnpm' # Cache node_modules

- uses: actions/setup-python@v4
  with:
    cache: 'pip' # Cache Python packages
```

**Benefits:**

- 2-3x faster builds
- Reduced GitHub Actions minutes
- More reliable builds

### 4. Artifact Retention

**Current settings:**

```yaml
retention-days: 30  # Desktop installers
retention-days: 7   # Web build artifacts
```

**Adjust based on needs:**

- Increase for releases
- Decrease for PR builds

### 5. Parallel Jobs

**Maximize parallelism:**

```yaml
build-desktop:
  strategy:
    matrix:
      os: [windows, macos, linux]
  # Runs 3 jobs in parallel
```

---

## Cost Optimization

### GitHub Actions Minutes

**Free tier:**

- 2,000 minutes/month for private repos
- Unlimited for public repos

**Current usage estimate:**

- Per push: ~30-40 minutes
- Per PR: ~30-40 minutes
- Per tag: ~40-50 minutes

**Optimization:**

1. Skip jobs on paths

   ```yaml
   on:
     push:
       paths-ignore:
         - 'docs/**'
         - '**.md'
   ```

2. Cancel previous runs

   ```yaml
   concurrency:
     group: ${{ github.workflow }}-${{ github.ref }}
     cancel-in-progress: true
   ```

3. Use self-hosted runners (for heavy workloads)

---

## Deployment Rollback

### Web App (Vercel)

```bash
# Via Vercel CLI
vercel rollback

# Or via dashboard:
# Deployments → Previous → Promote to Production
```

### API (Render)

```bash
# Via Render dashboard:
# Service → Deploys → Previous Deploy → Redeploy
```

### Manual Rollback

```bash
# Revert commit
git revert <commit-hash>
git push origin main

# Or create hotfix tag
git tag v1.0.1
git push origin v1.0.1
```

---

## Advanced Configuration

### Matrix Builds

**Test multiple versions:**

```yaml
test:
  strategy:
    matrix:
      node: [16, 18, 20]
      os: [ubuntu, windows, macos]
```

### Conditional Jobs

**Skip deploy on draft PRs:**

```yaml
deploy:
  if: github.event.pull_request.draft == false
```

### Composite Actions

**Reusable steps:**

```yaml
# .github/actions/setup/action.yml
name: 'Setup'
runs:
  using: 'composite'
  steps:
    - uses: pnpm/action-setup@v2
    - uses: actions/setup-node@v3
```

### Scheduled Runs

**Nightly builds:**

```yaml
on:
  schedule:
    - cron: '0 2 * * *' # 2 AM daily
```

---

## Troubleshooting

### Pipeline Stuck

**Symptoms:** Job runs forever

**Solution:**

1. Check logs for hanging process
2. Add timeout:
   ```yaml
   timeout-minutes: 30
   ```
3. Cancel and retry

### Secrets Not Working

**Symptoms:** Deployment fails with auth error

**Solution:**

1. Verify secret exists: `gh secret list`
2. Check secret name matches exactly
3. Regenerate secret if expired

### Build Out of Memory

**Symptoms:** "JavaScript heap out of memory"

**Solution:**

```yaml
- name: Build
  run: NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

---

## Metrics and Reporting

### Test Coverage

**Add to workflow:**

```yaml
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage.xml
```

### Performance Monitoring

**Add to workflow:**

```yaml
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: 'https://your-app.vercel.app'
```

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Render API Documentation](https://api-docs.render.com/)
- [Playwright CI Guide](https://playwright.dev/docs/ci)

---

**Last Updated:** January 2025  
**Status:** ✅ Ready for Implementation  
**Estimated Setup Time:** 2-4 hours
