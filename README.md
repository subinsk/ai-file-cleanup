# AI File Cleanup

🤖 AI-powered file deduplication system with intelligent similarity detection, available as both a web application and desktop app.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- pnpm 8+

### One Command Setup

```bash
# Install pnpm if you haven't
npm install -g pnpm

# Clone and setup
git clone <your-repo-url>
cd ai-file-cleanup

# Setup everything and start development
pnpm dev
```

That's it! This will:

- Install all dependencies
- Setup environment files
- Build all packages
- Start API server, Desktop app, and Web app

## 📖 Documentation

- **[Development Guide](DEV-GUIDE.md)** - Complete development workflow
- **[Environment Setup](ENVIRONMENT-SETUP.md)** - Configuration guide
- **[Start Dev Servers](START-DEV-SERVERS.md)** - Manual server startup
- **[Desktop App Setup](apps/desktop/ENV-SETUP.md)** - Desktop-specific guide

## 🏗️ Architecture

### Applications

- **🖥️ Desktop App** - Electron-based desktop application
- **🌐 Web App** - Next.js web application
- **🔌 API Service** - FastAPI backend
- **🤖 ML Service** - Machine learning model service

### Packages

- **@ai-cleanup/types** - Shared TypeScript types
- **@ai-cleanup/core** - Core deduplication logic
- **@ai-cleanup/db** - Prisma database layer
- **@ai-cleanup/ui** - Shared UI components

## 🎯 Features

- ✨ AI-powered duplicate detection
- 🖼️ Image similarity analysis
- 📄 PDF content comparison
- 📝 Text file deduplication
- 🎨 Beautiful modern UI
- 🔐 User authentication
- 📊 Visual grouping of duplicates
- 🗑️ Safe file deletion (to trash)
- 💾 Desktop and cloud options

## 🛠️ Development

### Start Everything

```bash
# Development mode (no logging)
pnpm dev

# Development mode with logging (saves to logs/dev-YYYY-MM-DD-HHMM.log)
pnpm dev:log
```

### Individual Services

```bash
pnpm dev:desktop-only    # API + Desktop
pnpm dev:web             # Web app only
pnpm dev:api             # API only
```

### Database

```bash
pnpm db:push             # Push schema
pnpm db:migrate          # Create migration
pnpm db:seed             # Seed data
pnpm db:studio           # Open Prisma Studio
```

### Logging

Terminal output can be automatically saved to log files:

```bash
# Start with logging enabled (recommended for debugging)
pnpm dev:log

# Logs are saved to:
# - Root: logs/dev-YYYY-MM-DD-HHMM.log (all services)
# - API: services/api/logs/api-YYYY-MM-DD-HHMM.log
# - ML: services/ml-service/logs/ml-service-YYYY-MM-DD-HHMM.log

# Clean up old logs (removes files older than 30 days)
.\cleanup-old-logs.bat

# View detailed logging documentation
See LOGGING.md for more information
```

### Build

```bash
pnpm build               # Build everything
pnpm build:desktop       # Desktop app
pnpm build:web           # Web app
```

## 📦 Tech Stack

### Frontend

- React 18
- TypeScript
- Tailwind CSS
- Radix UI
- Zustand

### Desktop

- Electron 28
- Vite

### Web

- Next.js 14
- NextAuth.js

### Backend

- FastAPI
- Python 3.10+
- PostgreSQL
- Prisma

### ML/AI

- TensorFlow
- CLIP
- Sentence Transformers

## 🚢 Deployment

### Desktop App

```bash
cd apps/desktop
pnpm build
pnpm package:win  # or :mac, :linux
```

### Web App

```bash
cd apps/web
pnpm build
# Deploy to Vercel or Netlify
```

### API Service

Deploy to Railway, Render, or any Python hosting service.

## 🧪 Testing

```bash
pnpm test
pnpm typecheck
pnpm lint
```

## 📝 Environment Variables

See [ENVIRONMENT-SETUP.md](ENVIRONMENT-SETUP.md) for detailed configuration.

Quick setup:

```bash
# Root
cp env.example .env

# Web
cp apps/web/env.example apps/web/.env.local

# Desktop
cp apps/desktop/env.example apps/desktop/.env
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

[Your License Here]

## 🆘 Support

- **Issues:** [GitHub Issues](your-repo-url/issues)
- **Docs:** Check the `/docs` folder
- **API Docs:** http://localhost:3001/docs (when running)

---

Made with ❤️ by [Your Name]
