# Database Setup

This guide covers setting up PostgreSQL with pgvector extension using Docker.

## Overview

We use PostgreSQL with the pgvector extension for:

- User data storage
- License key management
- File metadata storage
- Vector embeddings for AI similarity search

## Step 1: Start PostgreSQL with Docker

We'll use Docker Compose to run PostgreSQL with pgvector pre-installed.

The `docker-compose.yml` file is already included in the project root.

### Start the Database

```bash
# From project root
docker compose up -d

# Verify it's running
docker compose ps
```

**Expected output:**

```
✔ Container ai-file-cleanup-db  Started
```

You can verify it's running:

```bash
docker compose ps
```

**Expected:**

```
NAME                   STATUS      PORTS
ai-file-cleanup-db     running     0.0.0.0:5433->5432/tcp
```

### Verify Database Connection

```bash
# Test connection
docker exec -it ai-file-cleanup-db psql -U postgres -d ai_file_cleanup -c "SELECT 1;"
```

**Expected output:**

```
 ?column?
----------
        1
(1 row)
```

This confirms PostgreSQL is running and accessible.

## Step 2: Run Database Migrations

Now that PostgreSQL is running, create the database schema.

### Generate Prisma Client

```bash
# From project root
cd packages/db

# Generate Prisma clients (both JS and Python)
pnpm db:generate
```

**Expected output:**

```
✔ Generated Prisma Client (JavaScript)
✔ Generated Prisma Client (Python)
```

### Push Schema to Database

```bash
# Still in packages/db
pnpm db:push
```

**Expected output:**

```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Database synchronized with schema
✨ Done in 2s
```

This will:

- Create all tables (users, license_keys, files, etc.)
- Set up pgvector extension
- Create indexes and relations

### Verify Tables Created

```bash
# List tables
docker exec -it ai-file-cleanup-db psql -U postgres -d ai_file_cleanup -c "\dt"
```

**Expected output:**

```
                List of relations
 Schema |       Name        | Type  |  Owner
--------+-------------------+-------+----------
 public | dedupe_groups     | table | postgres
 public | file_embeddings   | table | postgres
 public | files             | table | postgres
 public | license_keys      | table | postgres
 public | uploads           | table | postgres
 public | users             | table | postgres
```

All tables are created successfully! ✅

## Step 3: Seed Database (Optional)

For development, you can seed the database with test data.

```bash
# From packages/db
pnpm db:seed
```

This will create:

- Test user account
- Sample license keys
- Mock file data

## Database Commands Reference

### Start Database

```bash
docker compose up -d
```

### Stop Database

```bash
docker compose down
```

### Stop and Remove Data

```bash
docker compose down -v
```

### View Logs

```bash
docker compose logs -f postgres
```

### Restart Database

```bash
docker compose restart postgres
```

### Access Database Shell

```bash
docker exec -it ai-file-cleanup-db psql -U postgres -d ai_file_cleanup
```

### Backup Database

```bash
docker exec ai-file-cleanup-db pg_dump -U postgres ai_file_cleanup > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker exec -i ai-file-cleanup-db psql -U postgres -d ai_file_cleanup
```

## Database Schema Overview

### Tables

**users**

- Stores user accounts
- Fields: id, email, name, passwordHash, createdAt, updatedAt

**license_keys**

- Stores desktop app licenses
- Fields: key (UUID), userId, createdAt, revoked

**uploads**

- Tracks file upload sessions
- Fields: id, userId, totalFiles, createdAt

**files**

- Stores file metadata
- Fields: id, uploadId, fileName, mimeType, sizeBytes, sha256, phash

**file_embeddings**

- Stores vector embeddings for AI similarity
- Fields: fileId, kind, embedding (vector), embeddingImg (vector)

**dedupe_groups**

- Groups duplicate files together
- Fields: id, uploadId, groupIndex, keptFileId

## Troubleshooting

### Issue: Port 5433 already in use

**Solution:** Change port in docker-compose.yml and DATABASE_URL:

```yaml
ports:
  - '5434:5432' # Changed from 5433
```

### Issue: pgvector extension not available

**Solution:** Ensure you're using `ankane/pgvector` Docker image

### Issue: Permission denied

**Solution:** Run Docker with sudo or add user to docker group:

```bash
sudo usermod -aG docker $USER
# Logout and login again
```

### Issue: Prisma migration fails

**Solution:**

```bash
# Reset database and try again
pnpm db:reset
pnpm db:push
```

---

## Next Steps

After database setup is complete, proceed to [Running the Project](./05-running-project.md).
