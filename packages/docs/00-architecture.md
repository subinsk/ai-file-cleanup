# System Architecture

This document provides an overview of the AI File Cleanup system architecture.

## Overview

AI File Cleanup is a **monorepo-based web application** that uses AI to detect and manage duplicate files. The system follows a **microservices architecture** with separate services for the web frontend, API backend, and ML inference.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│                    (http://localhost:3000)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS/HTTP
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Web App                             │
│                    (Frontend + SSR)                              │
│  - React 18 + TypeScript                                        │
│  - NextAuth.js (Authentication)                                 │
│  - Tailwind CSS + shadcn/ui                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Python API Service                          │
│                    (http://localhost:3001)                       │
│  - FastAPI Framework                                            │
│  - JWT Authentication                                           │
│  - Business Logic                                               │
│  - File Management                                              │
└─────────────────┬───────────────────┬───────────────────────────┘
                  │                   │
                  │ REST API          │ Prisma ORM
                  ▼                   ▼
┌────────────────────────┐  ┌────────────────────────────────────┐
│   ML Service           │  │   PostgreSQL + pgvector            │
│ (localhost:3002)       │  │   (localhost:5433)                 │
│ - PyTorch              │  │ - User Data                        │
│ - Transformers         │  │ - License Keys                     │
│ - DistilBERT (Text)    │  │ - File Metadata                    │
│ - CLIP (Images)        │  │ - Vector Embeddings                │
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
│   └── web/                    # Next.js web application
│       ├── src/
│       │   ├── app/            # Next.js App Router pages
│       │   ├── components/     # React components
│       │   ├── lib/            # Utilities & clients
│       │   └── middleware.ts   # Route protection
│       └── package.json
│
├── packages/
│   ├── db/                     # Database package
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   └── package.json
│   │
│   ├── docs/                   # Documentation
│   │   ├── 00-architecture.md
│   │   ├── 01-prerequisites.md
│   │   ├── 02-installation.md
│   │   ├── 03-environment-setup.md
│   │   ├── 04-database-setup.md
│   │   └── 05-running-project.md
│   │
│   ├── types/                  # Shared TypeScript types
│   │   └── src/
│   │
│   └── ui/                     # Shared UI components
│       └── src/
│
├── services/
│   ├── api/                    # Python FastAPI service
│   │   ├── app/
│   │   │   ├── api/            # API routes
│   │   │   │   ├── auth.py
│   │   │   │   ├── license.py
│   │   │   │   └── dedupe.py
│   │   │   ├── core/           # Core utilities
│   │   │   │   ├── config.py
│   │   │   │   ├── security.py
│   │   │   │   └── database.py
│   │   │   ├── middleware/     # Middleware
│   │   │   └── main.py         # FastAPI app
│   │   ├── requirements.txt
│   │   └── run.py
│   │
│   └── ml-service/             # Python ML service
│       ├── app/
│       │   ├── api/            # ML API routes
│       │   ├── core/           # Model loading
│       │   ├── services/       # Embedding generation
│       │   └── main.py
│       ├── requirements.txt
│       └── run.py
│
├── docker-compose.yml          # PostgreSQL with pgvector
├── turbo.json                  # TurboRepo config
├── pnpm-workspace.yaml         # pnpm workspaces
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
   - JWT tokens stored in httpOnly cookies
   - 7-day token expiration

2. **Password Security:**
   - bcrypt hashing with salt rounds
   - Minimum password length enforcement
   - No password storage in plain text

3. **API Security:**
   - JWT verification on protected routes
   - CORS configuration for trusted origins
   - Request rate limiting (production)

4. **Database Security:**
   - Parameterized queries (via Prisma)
   - No raw SQL injection points
   - User data isolation

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

## Future Enhancements

1. **Desktop Application**
   - Electron-based cross-platform app
   - Local file scanning
   - License key activation

2. **Real-time Processing**
   - WebSocket connections
   - Live progress updates
   - Background job queue

3. **Advanced ML**
   - Fine-tuned models for better accuracy
   - Support for more file types
   - Custom similarity thresholds

4. **Collaboration**
   - Team workspaces
   - Shared file collections
   - Role-based access control

---

## Additional Resources

- [Prerequisites](./01-prerequisites.md)
- [Installation Guide](./02-installation.md)
- [Environment Setup](./03-environment-setup.md)
- [Database Setup](./04-database-setup.md)
- [Running Project](./05-running-project.md)
- [Deployment Guide](./06-deployment.md)
