# @ai-cleanup/db

Database layer with Prisma ORM and pgvector for vector similarity search.

## Features

- **PostgreSQL** with pgvector extension for vector embeddings
- **Prisma ORM** for type-safe database access
- **Repository pattern** for clean data access layer
- **Vector similarity search** using cosine distance
- **Migrations** for schema versioning
- **Seed script** for test data

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Database

Create `.env` file:

```bash
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

For local development with Docker:

```bash
docker run --name ai-cleanup-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_cleanup_dev \
  -p 5432:5432 \
  -d pgvector/pgvector:pg16
```

### 3. Enable pgvector Extension

```bash
pnpm db:generate
# Then in your app or migration
import { enablePgVector } from '@ai-cleanup/db';
await enablePgVector();
```

### 4. Run Migrations

```bash
# Push schema to database (development)
pnpm db:push

# Or create and run migrations (production)
pnpm db:migrate
```

### 5. Create Vector Indexes

```bash
# In your app initialization
import { createVectorIndexes } from '@ai-cleanup/db';
await createVectorIndexes();
```

### 6. Seed Database

```bash
pnpm db:seed
```

## Usage

### Basic CRUD Operations

```typescript
import { userRepository, licenseRepository } from '@ai-cleanup/db';

// Create user
const user = await userRepository.create({
  email: 'test@example.com',
  passwordHash: 'hashed_password',
});

// Generate license key
const license = await licenseRepository.create(user.id);

// Validate license
const validLicense = await licenseRepository.validate(license.key);
```

### Vector Similarity Search

```typescript
import { embeddingRepository } from '@ai-cleanup/db';

// Store embedding
await embeddingRepository.upsert({
  fileId: 'file-uuid',
  kind: 'text',
  embedding: [0.1, 0.2, ...], // 768-dim vector
});

// Find similar files
const similar = await embeddingRepository.findSimilarByTextEmbedding(
  queryEmbedding,
  0.85, // threshold
  10    // limit
);
```

### File Management

```typescript
import { fileRepository, uploadRepository } from '@ai-cleanup/db';

// Create upload session
const upload = await uploadRepository.create({
  userId: user.id,
  totalFiles: 5,
});

// Add files
const file = await fileRepository.create({
  uploadId: upload.id,
  fileName: 'image.png',
  mimeType: 'image/png',
  sizeBytes: BigInt(1024),
  sha256: 'abc123...',
});

// Find duplicates by hash
const duplicates = await fileRepository.findExactDuplicates(upload.id);
```

## Schema

### Users
- Authentication and user management
- License key ownership

### License Keys
- Desktop app license management
- Validation and revocation

### Uploads
- Session tracking for web uploads
- File grouping

### Files
- File metadata (name, size, hash, MIME type)
- Perceptual hash for images
- Text excerpts for PDFs/text files

### File Embeddings
- Vector embeddings (pgvector)
- Text embeddings: 768-dimensional (DistilBERT)
- Image embeddings: 512-dimensional (CLIP)
- Cosine similarity search

### Dedupe Groups
- Duplicate file groupings
- Keep file selection

## Scripts

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (dev)
pnpm db:push

# Create migration
pnpm db:migrate

# Deploy migrations (production)
pnpm db:migrate:deploy

# Open Prisma Studio (GUI)
pnpm db:studio

# Seed database
pnpm db:seed

# Build TypeScript
pnpm build
```

## Repositories

### UserRepository
- `findById(id)` - Find user by ID
- `findByEmail(email)` - Find user by email
- `create(data)` - Create user
- `update(id, data)` - Update user
- `delete(id)` - Delete user

### LicenseRepository
- `findByKey(key)` - Find license by key
- `findByUserId(userId)` - Find user's licenses
- `create(userId)` - Generate new license
- `revoke(key)` - Revoke license
- `validate(key)` - Validate license

### UploadRepository
- `findById(id)` - Find upload session
- `create(data)` - Create upload session
- `findByUserId(userId)` - Find user's uploads
- `delete(id)` - Delete upload

### FileRepository
- `findById(id)` - Find file
- `findBySha256(hash)` - Find by hash
- `findByUploadId(uploadId)` - Find upload files
- `create(data)` - Create file record
- `findExactDuplicates(uploadId)` - Group by hash

### EmbeddingRepository
- `upsert(data)` - Create/update embedding
- `findSimilarByTextEmbedding(embedding, threshold, limit)` - Text similarity search
- `findSimilarByImageEmbedding(embedding, threshold, limit)` - Image similarity search
- `computePairwiseSimilarities(fileIds, kind, threshold)` - Batch similarity

## Vector Search

The package uses pgvector's IVFFlat index with cosine distance for efficient similarity search:

```sql
-- Text embeddings (768-dimensional)
CREATE INDEX file_embeddings_embedding_idx 
ON file_embeddings 
USING ivfflat (embedding vector_cosine_ops);

-- Image embeddings (512-dimensional)
CREATE INDEX file_embeddings_embedding_img_idx 
ON file_embeddings 
USING ivfflat (embedding_img vector_cosine_ops);
```

Similarity search returns scores from 0 to 1 (1 = identical).

## Development

```bash
# Watch mode
pnpm dev

# Lint
pnpm lint

# Type check
pnpm typecheck
```

