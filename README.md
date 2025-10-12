# AI File Cleanup System

An intelligent file deduplication system powered by AI, featuring both web and desktop applications for managing duplicate files efficiently.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development mode
pnpm dev
```

### 🌐 Deploy to Production

**Recommended Stack:** Python (Render) + Next.js (Vercel) + PostgreSQL (Neon)

**📖 Full deployment guide: Visit `/docs` page in the web app or see [packages/docs/06-deployment.md](./packages/docs/06-deployment.md)**

**Total Cost:** Free tier available | ~$53/month for production

## 📚 Documentation

Access comprehensive documentation at `http://localhost:3000/docs` or browse markdown files:

- **[Architecture](./packages/docs/00-architecture.md)** - System overview and design
- **[Prerequisites](./packages/docs/01-prerequisites.md)** - Required software
- **[Installation](./packages/docs/02-installation.md)** - Setup instructions
- **[Environment Setup](./packages/docs/03-environment-setup.md)** - Configuration
- **[Database Setup](./packages/docs/04-database-setup.md)** - PostgreSQL + pgvector
- **[Running Project](./packages/docs/05-running-project.md)** - Start development
- **[Deployment](./packages/docs/06-deployment.md)** - Production deployment

## 🏗️ Project Structure

```
ai-file-cleanup/
├── packages/
│   ├── types/          # TypeScript types & Zod schemas
│   ├── core/           # Deduplication algorithms
│   ├── db/             # Database layer (Prisma + pgvector)
│   └── ui/             # Shared UI components
├── services/
│   ├── api/            # REST API (Fastify, Node.js)
│   └── ml-service/     # AI inference service (FastAPI, Python)
├── apps/
│   ├── web/            # Next.js web application
│   └── desktop/        # Electron desktop application
├── docs/               # Project documentation
└── diagrams/           # UML diagrams
```

## ✨ Features

### Web Application

- 🔐 User authentication with license key management
- 📤 File upload and processing
- 🔍 AI-powered duplicate detection
- 🎨 Modern UI with Tailwind CSS
- 📊 Visual duplicate review interface

### Desktop Application

- 🗂️ Local directory scanning
- 🖼️ Image, PDF, and text file analysis
- 🤖 AI-based similarity detection
- ♻️ Safe file cleanup (moves to recycle bin)
- 🔑 License key activation

### Core Technology

- **Database:** PostgreSQL with pgvector for vector similarity search
- **AI Models:** Sentence Transformers (text), CLIP (images) via Python + PyTorch
- **ML Service:** FastAPI + Transformers + PyTorch (Python)
- **Monorepo:** TurboRepo + pnpm workspaces
- **Type Safety:** TypeScript with Zod runtime validation
- **CI/CD:** GitHub Actions for automated testing and builds

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS, shadcn/ui
- **Desktop:** Electron, Vite
- **API:** Fastify, Node.js
- **ML Service:** FastAPI, Python, PyTorch, Transformers
- **Database:** PostgreSQL with pgvector extension
- **Build:** TurboRepo, pnpm, TypeScript

## 📦 Packages

| Package               | Description                   | Status |
| --------------------- | ----------------------------- | ------ |
| `@ai-cleanup/types`   | Shared TypeScript types       | ✅     |
| `@ai-cleanup/core`    | Deduplication algorithms      | ✅     |
| `@ai-cleanup/db`      | Database layer                | ✅     |
| `@ai-cleanup/ui`      | UI component library          | ✅     |
| `@ai-cleanup/api`     | REST API service              | ✅     |
| `ml-service`          | AI inference service (Python) | ✅     |
| `@ai-cleanup/web`     | Web application               | ✅     |
| `@ai-cleanup/desktop` | Desktop application           | ✅     |

## 🧪 Development

### Install & Build

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Run Individual Apps/Services

```bash
# Web application (Next.js)
pnpm dev:web

# Desktop application (Electron)
pnpm dev:desktop

# API service (Fastify)
pnpm dev:api

# Model worker (AI inference)
pnpm dev:model-worker

# Run all services (TurboRepo parallel mode)
pnpm dev
```

### Database Commands

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed test data
pnpm db:seed

# Open Prisma Studio (GUI)
pnpm db:studio
```

### Code Quality

```bash
# Lint code
pnpm lint

# Type check
pnpm typecheck

# Format code
pnpm format

# Check formatting
pnpm format:check
```

## 🚀 Running the Application

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL with pgvector extension

### Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed test data
pnpm db:seed
```

### Start Services

```bash
# Terminal 1 - API Service
pnpm dev:api

# Terminal 2 - Model Worker
pnpm dev:model-worker

# Terminal 3 - Web App
pnpm dev:web

# Terminal 4 - Desktop App (optional)
pnpm dev:desktop
```

### Access Applications

- **Web App:** http://localhost:3000
- **API:** http://localhost:3001
- **ML Service:** http://localhost:3002
- **API Docs (ML):** http://localhost:3002/docs

### Test Credentials

```
Email: test@example.com
Password: password123
```

## 📊 Project Status

✅ **Foundation Complete** (Oct 12, 2025)

- All 11 foundation tasks completed
- License management system implemented
- GitHub Actions CI/CD configured
- All packages building successfully

See [Foundation Complete](./docs/FOUNDATION_COMPLETE.md) for detailed status.

## 📄 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]

---

**Built with ❤️ using modern web technologies**
