# AI File Cleanup - Documentation

Welcome to the AI File Cleanup documentation! This guide will help you set up and run the project.

## Quick Navigation

1. [Prerequisites](./01-prerequisites.md) - Required software and tools
2. [Installation](./02-installation.md) - Installing dependencies
3. [Environment Setup](./03-environment-setup.md) - Configuring environment variables
4. [Database Setup](./04-database-setup.md) - Setting up PostgreSQL with Docker
5. [Running Project](./05-running-project.md) - Starting all services

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
