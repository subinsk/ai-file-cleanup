# System Architecture

This document provides an overview of the AI File Cleanup system architecture.

## Overview

AI File Cleanup is a **monorepo-based web application** that uses AI to detect and manage duplicate files. The system follows a **microservices architecture** with separate services for the web frontend, API backend, and ML inference.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Clients                             │
│  ┌───────────────────┐          ┌───────────────────┐          │
│  │   Web Browser     │          │  Desktop App      │          │
│  │ (localhost:3000)  │          │   (Electron)      │          │
│  └────────┬──────────┘          └────────┬──────────┘          │
└───────────┼─────────────────────────────┼────────────────────────┘
            │                             │
            │ HTTPS/HTTP                  │ HTTPS/HTTP
            │ JWT Auth                    │ License Key + JWT
            ▼                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Web App                             │
│                    (Frontend + SSR)                              │
│  - React 18 + TypeScript                                        │
│  - NextAuth.js (Authentication)                                 │
│  - Tailwind CSS + shadcn/ui                                     │
│  - Zustand (State Management)                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ REST API
                             │ Rate Limited (100 req/min)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Python API Service                          │
│                    (http://localhost:3001)                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Security Layer                                            │ │
│  │ - JWT Verification                                        │ │
│  │ - Input Validation & Sanitization                        │ │
│  │ - Rate Limiting (3-tier)                                 │ │
│  │ - CORS Protection                                        │ │
│  │ - File Upload Security (MIME validation)                │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Business Logic                                           │ │
│  │ - Authentication (JWT + bcrypt)                         │ │
│  │ - File Processing Pipeline                              │ │
│  │ - Duplicate Detection                                   │ │
│  │ - User Quota Management                                 │ │
│  │ - License Key Validation                                │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────┬───────────────────────────┘
                  │                   │
                  │ REST API          │ Prisma ORM (SQL Protection)
                  ▼                   ▼
┌────────────────────────┐  ┌────────────────────────────────────┐
│   ML Service           │  │   PostgreSQL 15 + pgvector         │
│ (localhost:3002)       │  │   (localhost:5432)                 │
│ - PyTorch              │  │ - User Data & Auth                 │
│ - Transformers         │  │ - License Keys                     │
│ - DistilBERT (Text)    │  │ - File Metadata                    │
│ - CLIP (Images)        │  │ - Upload Sessions                  │
│ - Embedding Cache      │  │ - Vector Embeddings (pgvector)     │
│ - Batch Processing     │  │ - Dedupe Groups                    │
└────────────────────────┘  └────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Library:** React 18
- **Styling:** Tailwind CSS + shadcn/ui
- **Authentication:** NextAuth.js
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)

### Backend (API Service)

- **Framework:** FastAPI (Python)
- **Language:** Python 3.10+
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt
- **Database ORM:** Prisma (Python Client)
- **Validation:** Pydantic

### ML Service

- **Framework:** FastAPI (Python)
- **ML Library:** PyTorch
- **Models:** Hugging Face Transformers
  - **Text Embeddings:** DistilBERT
  - **Image Embeddings:** CLIP
- **Device:** CPU (configurable to GPU/CUDA)

### Database

- **DBMS:** PostgreSQL 15+
- **Extension:** pgvector (for vector similarity search)
- **ORM:** Prisma
- **Migrations:** Prisma Migrate

### DevOps & Tools

- **Monorepo:** TurboRepo
- **Package Manager:** pnpm
- **Containerization:** Docker & Docker Compose
- **Process Manager:** PM2 (optional, for production)

## Project Structure

```
ai-file-cleanup/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── src/
│   │   │   ├── app/            # Next.js App Router pages
│   │   │   ├── components/     # React components
│   │   │   ├── lib/            # Utilities & clients
│   │   │   └── middleware.ts   # Route protection
│   │   ├── vercel.json         # Vercel deployment config
│   │   └── package.json
│   │
│   └── desktop/                # Electron desktop application
│       ├── electron/           # Electron main process
│       │   ├── main.ts         # Main process logic
│       │   └── preload.ts      # Preload script
│       ├── src/                # React renderer
│       │   ├── pages/          # Application pages
│       │   └── lib/            # Desktop utilities
│       └── package.json
│
├── packages/
│   ├── db/                     # Database package
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── migrations/     # Database migrations
│   │   └── package.json
│   │
│   ├── core/                   # Core deduplication logic
│   │   └── src/
│   │       ├── dedupe/         # Duplicate detection
│   │       ├── hash/           # Hashing utilities
│   │       ├── preprocessing/  # File preprocessing
│   │       └── similarity/     # Similarity algorithms
│   │
│   ├── docs/                   # Documentation
│   │   ├── 00-architecture.md
│   │   ├── 01-prerequisites.md
│   │   ├── 02-installation.md
│   │   ├── 03-environment-setup.md
│   │   ├── 04-database-setup.md
│   │   ├── 05-running-project.md
│   │   └── 06-deployment.md
│   │
│   ├── types/                  # Shared TypeScript types
│   │   └── src/
│   │
│   └── ui/                     # Shared UI components
│       └── src/
│           └── components/     # Reusable components
│
├── services/
│   ├── api/                    # Python FastAPI service
│   │   ├── app/
│   │   │   ├── api/            # API routes
│   │   │   │   ├── auth.py     # Authentication
│   │   │   │   ├── license.py  # License management
│   │   │   │   ├── dedupe.py   # Deduplication
│   │   │   │   ├── files.py    # File operations
│   │   │   │   ├── quota.py    # User quotas
│   │   │   │   ├── desktop.py  # Desktop endpoints
│   │   │   │   └── health.py   # Health checks
│   │   │   │
│   │   │   ├── core/           # Core utilities
│   │   │   │   ├── config.py   # Configuration
│   │   │   │   ├── security.py # JWT & passwords
│   │   │   │   └── database.py # Database client
│   │   │   │
│   │   │   ├── middleware/     # Middleware
│   │   │   │   ├── auth.py     # Auth middleware
│   │   │   │   ├── rate_limit.py # Rate limiting
│   │   │   │   └── validation.py # Input validation
│   │   │   │
│   │   │   ├── services/       # Business logic
│   │   │   │   ├── file_processor.py # File processing
│   │   │   │   ├── quota_manager.py  # Quota tracking
│   │   │   │   ├── ml_client.py      # ML service client
│   │   │   │   └── embedding_cache.py # Embedding cache
│   │   │   │
│   │   │   ├── utils/          # Utilities
│   │   │   │   └── file_security.py # Security utils
│   │   │   │
│   │   │   └── main.py         # FastAPI app
│   │   │
│   │   ├── requirements.txt
│   │   ├── render.yaml         # Render deployment config
│   │   └── run.py
│   │
│   └── ml-service/             # Python ML service
│       ├── app/
│       │   ├── api/            # ML API routes
│       │   ├── core/           # Model loading
│       │   ├── services/       # Embedding generation
│       │   └── main.py
│       ├── requirements.txt
│       ├── render.yaml         # Render deployment config
│       └── run.py
│
├── demo_dataset/               # Demo files for testing
│   ├── scenario_1_exact_duplicates/
│   ├── scenario_2_similar_images/
│   ├── scenario_3_text_similarity/
│   ├── scenario_4_pdf_comparison/
│   ├── scenario_5_mixed_types/
│   └── edge_cases/
│
├── docker-compose.yml          # PostgreSQL with pgvector
├── turbo.json                  # TurboRepo config
├── pnpm-workspace.yaml         # pnpm workspaces
│
├── API_DOCUMENTATION.md        # Complete API reference
├── DEVELOPER_SETUP_GUIDE.md    # Setup instructions
├── USER_GUIDE.md               # User documentation
├── DEPLOYMENT_RUNBOOK.md       # Deployment procedures
├── SECURITY_REVIEW.md          # Security audit
├── BUG_SWEEP_REPORT.md         # Quality assurance
├── PROFESSOR_PRESENTATION.md   # Demo script
│
└── package.json                # Root package.json
```

## Data Flow

### 1. User Authentication Flow

```
User (Browser)
    │
    ├─> Login/Register Form
    │
    ├─> POST /api/auth/login
    │       │
    │       ├─> Python API: /auth/login
    │       │       │
    │       │       ├─> Verify credentials (bcrypt)
    │       │       ├─> Generate JWT token
    │       │       └─> Set httpOnly cookie
    │       │
    │       └─> NextAuth session created
    │
    └─> Authenticated requests with cookie
```

### 2. File Deduplication Flow

```
User uploads files
    │
    ├─> Frontend: File validation
    │
    ├─> POST /dedupe/preview
    │       │
    │       ├─> Python API receives files
    │       │       │
    │       │       ├─> Calculate SHA-256 hashes
    │       │       ├─> Calculate pHashes (images)
    │       │       │
    │       │       ├─> ML Service: Generate embeddings
    │       │       │       │
    │       │       │       ├─> Text files → DistilBERT
    │       │       │       └─> Images → CLIP
    │       │       │
    │       │       ├─> Store in PostgreSQL
    │       │       ├─> Vector similarity search (pgvector)
    │       │       └─> Group duplicates
    │       │
    │       └─> Return duplicate groups
    │
    └─> User reviews and downloads results
```

### 3. License Key Generation Flow

```
User requests license
    │
    ├─> POST /license/generate
    │       │
    │       ├─> Python API verifies auth
    │       │       │
    │       │       ├─> Generate UUID
    │       │       ├─> Store in database
    │       │       └─> Return license key
    │       │
    │       └─> Display to user
    │
    └─> User activates desktop app
```

## Security Architecture

### Authentication & Authorization

1. **Session Management:**
   - NextAuth.js manages frontend sessions
   - JWT tokens stored in httpOnly cookies (XSS protection)
   - Secure flag enabled in production (HTTPS only)
   - SameSite=strict in production (CSRF protection)
   - 7-day token expiration

2. **Password Security:**
   - bcrypt hashing with salt rounds
   - Password requirements:
     - Minimum 8 characters
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one digit
   - No password storage in plain text
   - No password exposure in logs

3. **API Security:**
   - JWT verification on protected routes
   - CORS configuration for trusted origins only
   - Rate limiting (3-tier):
     - General API: 100 requests per 60 seconds
     - Authentication: 10 attempts per 5 minutes
     - File Upload: 20 uploads per 5 minutes
   - Request size validation (100MB max)
   - IP and user-based rate tracking

4. **Input Validation:**
   - Multi-layer validation pipeline:
     - File extension whitelist (.jpg, .png, .pdf, .txt, .csv)
     - MIME type validation against file content
     - Filename sanitization (path traversal prevention)
     - File size limits (50MB per file, 500MB total)
     - XSS prevention (HTML tag removal)
     - SQL injection pattern blocking
   - python-magic for MIME detection
   - Comprehensive error handling

5. **Database Security:**
   - Parameterized queries (via Prisma ORM)
   - No raw SQL injection points
   - User data isolation by userId
   - Connection pooling with limits
   - Encrypted connections in production

6. **File Upload Security:**
   - File count limits (100 files max)
   - Per-file size validation (50MB)
   - Total upload size validation (500MB)
   - MIME type verification
   - Path traversal prevention
   - Safe filename generation
   - Temporary file cleanup

7. **User Quotas:**
   - Storage quota: 1GB per user
   - Upload count limit: 50 per user
   - Real-time quota enforcement
   - Quota endpoint for monitoring

### Network Security

```
┌─────────────────────────────────────────────┐
│  Frontend (Next.js)                         │
│  - CSP headers                              │
│  - HTTPS only (production)                  │
└─────────────────┬───────────────────────────┘
                  │
                  │ Authenticated requests
                  │ (JWT in httpOnly cookie)
                  │
┌─────────────────▼───────────────────────────┐
│  API Service (FastAPI)                      │
│  - JWT verification                         │
│  - CORS whitelist                           │
│  - Input validation (Pydantic)              │
└─────────────────┬───────────────────────────┘
                  │
                  │ Internal network
                  │
┌─────────────────▼───────────────────────────┐
│  Database (PostgreSQL)                      │
│  - Network isolation                        │
│  - Authentication required                  │
└─────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

**users**

- `id` (UUID, PK)
- `email` (unique)
- `name`
- `passwordHash`
- `createdAt`, `updatedAt`

**license_keys**

- `key` (UUID, PK)
- `userId` (FK → users)
- `createdAt`
- `revoked` (boolean)

**uploads**

- `id` (UUID, PK)
- `userId` (FK → users)
- `totalFiles`
- `createdAt`

**files**

- `id` (UUID, PK)
- `uploadId` (FK → uploads)
- `fileName`, `mimeType`, `sizeBytes`
- `sha256`, `phash`
- `createdAt`

**file_embeddings**

- `fileId` (UUID, PK, FK → files)
- `kind` (enum: text/image)
- `embedding` (vector[768]) - Text embedding
- `embeddingImg` (vector[512]) - Image embedding

**dedupe_groups**

- `id` (UUID, PK)
- `uploadId` (FK → uploads)
- `groupIndex`
- `keptFileId` (FK → files)

## Deployment Architecture

### Development

```
Local Machine
├── Next.js (localhost:3000)
├── Python API (localhost:3001)
├── ML Service (localhost:3002)
└── PostgreSQL (localhost:5433, Docker)
```

### Production (Recommended)

```
┌─────────────────────────┐
│   Vercel (Next.js)      │
│   - Edge Network        │
│   - Auto-scaling        │
└───────────┬─────────────┘
            │
            │ HTTPS
            ▼
┌─────────────────────────┐
│   Render (Python API)   │
│   - Auto-deploy         │
│   - Health checks       │
└───────────┬─────────────┘
            │
            ├─────────────┐
            │             │
            ▼             ▼
┌──────────────────┐  ┌──────────────────┐
│ Render (ML)      │  │ Neon (PostgreSQL)│
│ - GPU optional   │  │ - Managed DB     │
│ - Auto-scale     │  │ - Auto-backup    │
└──────────────────┘  └──────────────────┘
```

## Scalability Considerations

### Horizontal Scaling

- **API Service:** Stateless, can run multiple instances
- **ML Service:** Independent, can scale separately
- **Database:** Managed PostgreSQL with read replicas

### Performance Optimization

- **Caching:** Redis for session/token caching (future)
- **CDN:** Static assets served via Vercel Edge
- **Database:** Indexed queries, connection pooling
- **ML:** Model caching, batch processing

### Monitoring

- **Application:** Logging via FastAPI
- **Database:** Query performance monitoring
- **Infrastructure:** Health checks, uptime monitoring

## Current Status (January 2025)

### ✅ Implemented Features

1. **Desktop Application** ✅
   - Electron-based cross-platform app (Windows, macOS, Linux)
   - Local directory scanning
   - License key activation and validation
   - Native file operations (move to trash)
   - Offline processing capabilities

2. **Security Hardening** ✅
   - Multi-layer input validation
   - Rate limiting (3-tier)
   - MIME type validation
   - Path traversal prevention
   - SQL injection protection
   - XSS prevention
   - Authentication security improvements

3. **User Quotas** ✅
   - Storage limits (1GB per user)
   - Upload count limits (50 per user)
   - Real-time quota tracking
   - Quota API endpoint

4. **Comprehensive Documentation** ✅
   - API Documentation (30+ pages)
   - Developer Setup Guide (25+ pages)
   - User Guide (20+ pages)
   - Deployment Runbook (20+ pages)
   - Security Review (15+ pages)
   - Bug Sweep Report (10+ pages)

5. **Production Ready** ✅
   - Vercel deployment configuration
   - Render deployment configuration
   - Health check endpoints
   - Error handling and logging
   - Rollback procedures documented

## Future Enhancements

1. **Testing & Quality**
   - E2E testing framework (Playwright/Cypress)
   - Integration test suite
   - Cross-platform testing automation
   - Load testing and performance benchmarks

2. **Real-time Processing**
   - WebSocket connections for live updates
   - Background job queue (Celery/BullMQ)
   - Progress tracking for long operations

3. **Advanced ML**
   - Fine-tuned models for specific file types
   - Video duplicate detection
   - Audio file similarity
   - Custom similarity threshold configuration

4. **Collaboration Features**
   - Team workspaces
   - Shared file collections
   - Role-based access control
   - Activity logs and audit trails

5. **Enterprise Features**
   - Redis-based rate limiting (distributed)
   - Token revocation mechanism
   - Advanced analytics dashboard
   - GDPR compliance tools (data export/deletion)
   - SSO integration (OAuth, SAML)

---

## Additional Resources

- [Prerequisites](./01-prerequisites.md)
- [Installation Guide](./02-installation.md)
- [Environment Setup](./03-environment-setup.md)
- [Database Setup](./04-database-setup.md)
- [Running Project](./05-running-project.md)
- [Deployment Guide](./06-deployment.md)
