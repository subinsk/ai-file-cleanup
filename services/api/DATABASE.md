# Database Architecture

## Overview

The AI File Cleanup system uses a **hybrid approach** for database management:

- **Database Schema Management**: Prisma (in `packages/db/`)
- **API Database Queries**: SQLAlchemy (in `services/api/`)

## Architecture

```
┌─────────────────────────────────────────────┐
│            Neon PostgreSQL Database         │
│         (with pgvector extension)           │
└─────────────────────────────────────────────┘
           ▲                        ▲
           │                        │
           │                        │
    Schema Management         Query Operations
           │                        │
           │                        │
┌──────────┴────────────┐  ┌────────┴──────────┐
│   packages/db/        │  │  services/api/    │
│   - schema.prisma     │  │  - SQLAlchemy     │
│   - Prisma Migrate    │  │  - Python Models  │
└───────────────────────┘  └───────────────────┘
```

## Why This Approach?

**Problem**: Prisma Python requires Node.js for client generation, but Render's Python runtime doesn't include Node.js.

**Solution**:

- Use Prisma for schema definition and migrations (run locally with Node.js)
- Use SQLAlchemy for database queries (pure Python, no Node.js needed)
- Auto-generate SQLAlchemy models from Prisma schema

## Workflow

### When Schema Changes

1. **Edit Schema** (`packages/db/prisma/schema.prisma`):

   ```prisma
   model User {
     id String @id @default(uuid()) @db.Uuid
     email String @unique
     // ... more fields
   }
   ```

2. **Apply Changes to Database** (requires Node.js, run locally):

   ```bash
   cd packages/db
   npx prisma db push
   ```

   This updates your Neon database directly.

3. **Generate SQLAlchemy Models** (automated via pre-commit hook):

   ```bash
   node scripts/generate-db-models.js
   ```

   This creates/updates Python models in `services/api/app/models/`.

4. **Commit Everything**:
   ```bash
   git add packages/db/prisma/schema.prisma
   git add services/api/app/models/
   git commit -m "Update user model"
   ```

### Deployment to Render

**No Node.js Required!**

```yaml
# services/api/render.yaml
buildCommand: pip install -r requirements.txt
startCommand: python run.py
```

- Database already has correct schema (from `prisma db push`)
- API uses pre-generated SQLAlchemy models
- Pure Python runtime

## File Structure

```
├── packages/db/
│   └── prisma/
│       ├── schema.prisma          # Source of truth for DB schema
│       └── migrations/             # SQL migration history
│
├── services/api/
│   └── app/
│       ├── models/                 # Auto-generated SQLAlchemy models
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── file.py
│       │   └── ...
│       └── core/
│           └── database.py         # SQLAlchemy engine & session
│
└── scripts/
    └── generate-db-models.js       # Prisma → SQLAlchemy generator
```

## Using SQLAlchemy in Code

### Simple Query

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.core.database import get_session
from app.models.user import User

async def get_user(email: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    return user
```

### Create Record

```python
user = User(
    email="user@example.com",
    password_hash=hashed_password,
    name="John Doe"
)
session.add(user)
await session.flush()  # Get generated ID
```

### Update Record

```python
result = await session.execute(select(User).where(User.email == email))
user = result.scalar_one_or_none()

if user:
    user.name = "Jane Doe"
    await session.flush()
```

### Vector Similarity (pgvector)

```python
from pgvector.sqlalchemy import cosine_distance
from app.models.file_embedding import FileEmbedding

# Find similar embeddings
query = (
    select(FileEmbedding)
    .order_by(cosine_distance(FileEmbedding.embedding, target_vector))
    .limit(10)
)
result = await session.execute(query)
similar_embeddings = result.scalars().all()
```

## Database Connection

**Configuration** (`app/core/database.py`):

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Dependency for FastAPI
async def get_session():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

## Key Benefits

✅ **Clean Separation**: Prisma manages schema, SQLAlchemy handles queries  
✅ **No Node.js on Render**: Pure Python deployment  
✅ **Type Safety**: SQLAlchemy models provide type hints  
✅ **Single Source of Truth**: `schema.prisma` defines everything  
✅ **Auto-Generated Models**: Pre-commit hook keeps models in sync  
✅ **pgvector Support**: Native vector operations via `pgvector` library

## Troubleshooting

### Models Out of Sync

If you change `schema.prisma` without regenerating models:

```bash
node scripts/generate-db-models.js
```

### Database Not Updated

If schema changes aren't reflected in database:

```bash
cd packages/db
npx prisma db push
```

### Connection Issues

Check `DATABASE_URL` in environment:

```bash
# Render automatically provides this
echo $DATABASE_URL
```

## Migration from Prisma Python

This project migrated from Prisma Python to SQLAlchemy to enable deployment on Render's Python runtime without Node.js dependencies.

**What Changed**:

- Removed: `prisma==0.15.0` from requirements.txt
- Added: `sqlalchemy[asyncio]`, `asyncpg`, `pgvector`
- Replaced: Prisma queries with SQLAlchemy queries
- Created: Auto-generator for SQLAlchemy models

**What Stayed the Same**:

- Database schema (same tables, same structure)
- Prisma for schema management
- All API functionality
