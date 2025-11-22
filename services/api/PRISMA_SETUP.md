# Database Setup

**Note**: This project has migrated from Prisma Python to SQLAlchemy for API queries while maintaining Prisma for schema management.

## Current Architecture

See **[DATABASE.md](./DATABASE.md)** for complete documentation.

### Quick Overview

- **Schema Management**: Prisma (in `packages/db/`)
- **API Queries**: SQLAlchemy (pure Python, no Node.js needed)
- **Deployment**: Pure Python on Render (no Node.js required)

### Key Points

✅ Database schema managed by Prisma  
✅ Migrations run locally with `prisma db push`  
✅ SQLAlchemy models auto-generated from Prisma schema  
✅ Pure Python deployment (no Node.js on Render)

## When Schema Changes

1. Edit `packages/db/prisma/schema.prisma`
2. Run `npx prisma db push` (updates database)
3. Pre-commit hook auto-generates SQLAlchemy models
4. Commit schema + generated models

## Why SQLAlchemy?

**Problem**: Prisma Python requires Node.js for client generation, but Render's Python runtime doesn't include Node.js.

**Solution**: Use SQLAlchemy for queries (pure Python) while keeping Prisma for schema management.

## Migration Details

For full migration details and usage examples, see **[DATABASE.md](./DATABASE.md)**.
