# Prisma Client Setup for Pure Python Deployment

## The Problem

Prisma Python (`prisma-client-py`) **requires Node.js** to generate the client. It internally calls `pnpm add prisma@5.17.0` during generation, which fails in pure Python environments like Render.

## The Solution

**Automatic Generation on Commit** - A git pre-commit hook automatically generates the Prisma client before each commit, ensuring it's always up-to-date in the repo.

## How It Works

1. **Pre-commit Hook** - When you commit, the hook automatically:
   - Generates the Prisma client using Python (requires Node.js locally)
   - Stages the generated files
   - Includes them in your commit

2. **Deployment** - On Render/Railway:
   - Build only installs Python packages (no generation needed)
   - Uses the pre-generated client from the repo
   - No Node.js required at runtime

## Manual Generation

If you need to generate manually:

```bash
# From project root
pnpm api:generate-prisma

# Or from services/api directory
python -m prisma generate --schema ../../packages/db/prisma/schema.prisma
```

## Current Configuration

- **Pre-commit Hook:** Automatically generates Prisma client before commit
- **Build:** Only installs Python packages (`pip install -r requirements.txt`)
- **Start:** Runs the Python app directly (`python run.py`)
- **No generation during deployment** - uses pre-generated client from repo

## Troubleshooting

### Hook not running?

- Make sure Husky is installed: `pnpm install`
- Check hook is executable: `ls -la .husky/pre-commit`

### Generation fails?

- Ensure Python is installed and in PATH
- Ensure Node.js and pnpm are installed (needed for generation)
- Check schema exists: `packages/db/prisma/schema.prisma`

### Generated files not staged?

- The hook tries to auto-stage, but you may need to manually:
  ```bash
  git add services/api/prisma/
  git add services/api/.prisma/
  ```

## Alternative Solutions

If automatic generation doesn't work:

1. Generate manually before committing
2. Use a CI/CD pipeline with Node.js to generate before deployment
3. Switch to a pure Python ORM (SQLAlchemy, Tortoise ORM, etc.)
