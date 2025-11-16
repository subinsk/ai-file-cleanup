# AI File Cleanup - Documentation

Welcome to the AI File Cleanup documentation! This guide will help you set up and run the project.

## Quick Navigation

### Getting Started

1. [Architecture](./00-architecture.md) - System architecture and design
2. [Prerequisites](./01-prerequisites.md) - Required software and tools
3. [Installation](./02-installation.md) - Installing dependencies
4. [Environment Setup](./03-environment-setup.md) - Configuring environment variables
5. [Database Setup](./04-database-setup.md) - Setting up PostgreSQL with Docker
6. [Running Project](./05-running-project.md) - Starting all services

### Deployment & Operations

7. [Deployment](./06-deployment.md) - Production deployment guide
8. [Deployment Instructions](./16-deployment-instructions.md) - Detailed deployment steps
9. [Deployment Runbook](./17-deployment-runbook.md) - Operational runbook

### Development Guides

10. [API Documentation](./07-api-documentation.md) - API reference and endpoints
11. [Developer Setup](./09-developer-setup.md) - Developer onboarding guide
12. [Desktop Build](./19-desktop-build.md) - Building desktop application
13. [Windows Installer](./14-windows-installer.md) - Creating Windows installer

### Testing & Quality

14. [Testing](./11-testing.md) - E2E testing guide
15. [Cross-Platform Testing](./12-cross-platform-testing.md) - Cross-platform testing guide

### Operations & Monitoring

16. [Logging](./15-logging.md) - Logging system documentation
17. [Quick Start Logging](./18-quick-start-logging.md) - Quick logging setup
18. [CI/CD](./13-cicd.md) - CI/CD pipeline configuration

### User Documentation

19. [User Guide](./08-user-guide.md) - End-user instructions
20. [Security](./10-security.md) - Security guidelines and best practices

## Quick Start

For experienced developers, here's the TL;DR:

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables (see 03-environment-setup.md)
cp packages/db/.env.example packages/db/.env
cp apps/web/.env.example apps/web/.env.local
cp services/api/.env.example services/api/.env
cp services/ml-service/.env.example services/ml-service/.env

# 3. Start database
docker compose up -d

# 4. Setup database schema
cd packages/db
pnpm db:push
pnpm db:generate
cd ../..

# 5. Install Python dependencies
cd services/api && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && cd ../..
cd services/ml-service && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && cd ../..

# 6. Start all services
pnpm dev

# 7. Access at http://localhost:3000
```

## Project Structure

```
ai-file-cleanup/
├── apps/
│   └── web/              # Next.js web application
├── packages/
│   ├── db/               # Prisma database package
│   ├── docs/             # Documentation (you are here!)
│   ├── types/            # Shared TypeScript types
│   └── ui/               # Shared UI components
├── services/
│   ├── api/              # Python FastAPI service
│   └── ml-service/       # Python ML inference service
└── docker-compose.yml    # PostgreSQL with pgvector
```

## Technology Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS
- **NextAuth.js** - Authentication

### Backend

- **FastAPI** - Python web framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database with pgvector
- **JWT** - Token-based authentication

### ML/AI

- **PyTorch** - Deep learning framework
- **Transformers** - Hugging Face models
- **DistilBERT** - Text embeddings
- **CLIP** - Image embeddings

### DevOps

- **Docker** - Containerization
- **TurboRepo** - Monorepo build system
- **pnpm** - Package manager

## Getting Help

- **Issues**: Report bugs or request features on GitHub
- **Documentation**: Read the step-by-step guides
- **API Docs**: Visit http://localhost:3001/docs when services are running

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary software. See LICENSE file for details.
