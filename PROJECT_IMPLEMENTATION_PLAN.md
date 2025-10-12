# AI File Cleanup System - Detailed Implementation Plan

## Project Overview
Building an AI-powered file deduplication system with:
- **Web App** (Next.js) - Upload files, AI-based duplicate detection, ZIP export
- **Desktop App** (Electron) - Local file scanning, duplicate detection, Recycle Bin integration
- **Backend API** (Fastify) - Handles embeddings, similarity detection, license management
- **Database** (Neon Postgres + pgvector) - User management, vector similarity search
- **AI Models** (Hugging Face) - DistilBERT (text), CLIP (images)

---

## 📋 Todo List

### Phase 1: Project Foundation & Infrastructure

#### 1.1 Monorepo Setup
- [ ] **Initialize TurboRepo monorepo**
  - Install `turbo`, `pnpm` globally
  - Create `turbo.json` with build pipelines
  - Configure `pnpm-workspace.yaml` for workspace packages
  - Setup root `package.json` with workspace scripts
  - Configure `.gitignore` for node_modules, dist, .env files

- [ ] **Setup TypeScript configuration**
  - Create root `tsconfig.json` with strict mode enabled
  - Create `tsconfig.base.json` for shared compiler options
  - Setup path aliases (`@/`, `~/`) for each workspace
  - Configure incremental builds for faster compilation

- [ ] **Setup ESLint and Prettier**
  - Install ESLint, Prettier, typescript-eslint
  - Create `.eslintrc.js` with TypeScript, React, Node rules
  - Create `.prettierrc` with consistent formatting (2 spaces, single quotes, trailing commas)
  - Add `lint` and `format` scripts to root package.json
  - Setup pre-commit hooks with husky and lint-staged

- [ ] **Create folder structure**
  ```
  ai-file-cleanup/
  ├─ apps/
  │  ├─ web/
  │  └─ desktop/
  ├─ services/
  │  ├─ api/
  │  └─ model-worker/
  ├─ packages/
  │  ├─ ui/
  │  ├─ core/
  │  ├─ db/
  │  └─ types/
  ├─ infra/
  ├─ scripts/
  └─ .github/workflows/
  ```

#### 1.2 Environment Configuration
- [ ] **Create environment variable templates**
  - Create `.env.example` in root with all required variables
  - Create `.env.local.example` for local development
  - Document each environment variable with comments
  - Setup environment validation using Zod or envalid

- [ ] **Configure dotenv loading**
  - Install `dotenv` package
  - Create `packages/config/` for centralized env management
  - Export typed environment config from `packages/config`
  - Add runtime validation for required variables

---

### Phase 2: Database Setup (Neon Postgres + pgvector)

#### 2.1 Database Provisioning
- [ ] **Setup Neon Postgres account**
  - Create Neon account and project
  - Enable pgvector extension in Neon dashboard
  - Configure connection pooling settings
  - Get connection string and save to `.env`

- [ ] **Initialize database client package**
  - Create `packages/db/` workspace
  - Install `pg`, `@neondatabase/serverless`, or Prisma/Kysely
  - Create `packages/db/package.json` with dependencies
  - Setup TypeScript config for db package

#### 2.2 Schema Design & Migrations
- [ ] **Design and implement Users table**
  ```sql
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
  - Add unique index on email
  - Add validation constraints
  - Create TypeScript type definition

- [ ] **Design and implement License Keys table**
  ```sql
  CREATE TABLE license_keys (
    key UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    revoked BOOLEAN DEFAULT FALSE
  );
  ```
  - Add index on user_id
  - Add index on (revoked, created_at)
  - Create TypeScript type definition

- [ ] **Design and implement Uploads table**
  ```sql
  CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    total_files INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
  - Add index on (user_id, created_at)
  - Create TypeScript type definition

- [ ] **Design and implement Files table**
  ```sql
  CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    sha256 TEXT NOT NULL,
    phash TEXT,
    text_excerpt TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
  - Add index on upload_id
  - Add index on sha256 for fast duplicate lookup
  - Add index on phash for image similarity
  - Create TypeScript type definition

- [ ] **Design and implement File Embeddings table**
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE TABLE file_embeddings (
    file_id UUID PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,
    kind TEXT CHECK (kind IN ('image','text')) NOT NULL,
    embedding vector(768),
    embedding_img vector(512)
  );
  ```
  - Create IVFFlat index on embedding for cosine similarity
  - Create IVFFlat index on embedding_img for cosine similarity
  - Add partial indexes for each kind
  - Create TypeScript type definition with vector types

- [ ] **Design and implement Dedupe Groups table**
  ```sql
  CREATE TABLE dedupe_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
    group_index INT NOT NULL,
    kept_file_id UUID REFERENCES files(id)
  );
  ```
  - Add index on upload_id
  - Add unique index on (upload_id, group_index)
  - Create TypeScript type definition

- [ ] **Setup migration system**
  - Choose migration tool (Prisma Migrate, node-pg-migrate, or Kysely)
  - Create initial migration files for all tables
  - Create rollback migrations
  - Add migration scripts to `packages/db/package.json`
  - Test migrations on local Postgres instance

#### 2.3 Database Access Layer
- [ ] **Create database connection module**
  - Create `packages/db/src/client.ts` with connection pooling
  - Implement connection retry logic
  - Add health check function
  - Export typed client instance

- [ ] **Create query builders/repositories**
  - Create `packages/db/src/repositories/users.ts` with CRUD operations
  - Create `packages/db/src/repositories/licenses.ts` with CRUD operations
  - Create `packages/db/src/repositories/uploads.ts` with CRUD operations
  - Create `packages/db/src/repositories/files.ts` with CRUD operations
  - Create `packages/db/src/repositories/embeddings.ts` with vector search
  - Add JSDoc comments for all public methods
  - Add TypeScript generics for type safety

- [ ] **Create vector similarity functions**
  - Implement `findSimilarByTextEmbedding(vector, threshold, limit)`
  - Implement `findSimilarByImageEmbedding(vector, threshold, limit)`
  - Implement `batchInsertEmbeddings(embeddings[])`
  - Add cosine distance calculation utilities
  - Test with sample vectors

---

### Phase 3: Shared Packages

#### 3.1 Types Package (`packages/types`)
- [ ] **Setup types package structure**
  - Create `packages/types/package.json`
  - Configure TypeScript for type declarations only
  - Setup build script to emit .d.ts files

- [ ] **Define core domain types**
  - Create `packages/types/src/user.ts` (User, UserCreate, UserUpdate)
  - Create `packages/types/src/license.ts` (LicenseKey, LicenseValidation)
  - Create `packages/types/src/file.ts` (FileMetadata, FileType, MimeType)
  - Create `packages/types/src/embedding.ts` (Embedding, EmbeddingKind)
  - Create `packages/types/src/dedupe.ts` (DedupeGroup, DuplicateMatch, Similarity)

- [ ] **Define API request/response types**
  - Create `packages/types/src/api/auth.ts` (LoginRequest, LoginResponse, etc.)
  - Create `packages/types/src/api/dedupe.ts` (PreviewRequest, PreviewResponse, ZipRequest)
  - Create `packages/types/src/api/desktop.ts` (ValidateLicenseRequest, ScanResult)
  - Add Zod schemas for runtime validation

- [ ] **Define constants and enums**
  - Create `packages/types/src/constants.ts` with file types, thresholds
  - Define `SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif']`
  - Define `SUPPORTED_PDF_EXTENSIONS = ['.pdf']`
  - Define `SUPPORTED_TEXT_EXTENSIONS = ['.txt']`
  - Define similarity thresholds: `EXACT_MATCH >= 0.98`, `HIGH_SIMILARITY >= 0.90`, `MEDIUM_SIMILARITY >= 0.85`

#### 3.2 Core Package (`packages/core`)
- [ ] **Setup core package structure**
  - Create `packages/core/package.json`
  - Install dependencies: `sharp`, `crypto`, `image-hash`
  - Configure TypeScript with strict mode

- [ ] **Implement file hashing utilities**
  - Create `packages/core/src/hash/sha256.ts` with stream-based SHA-256 calculation
  - Create `packages/core/src/hash/perceptual.ts` with pHash for images using `image-hash`
  - Add buffer and stream support for both utilities
  - Add unit tests for hash consistency

- [ ] **Implement file preprocessing**
  - Create `packages/core/src/preprocessing/image.ts`
    - Implement `normalizeImage(buffer, targetSize=224)` using sharp
    - Resize to target size, maintain aspect ratio
    - Convert to RGB, normalize pixel values [0,1]
    - Return preprocessed buffer or tensor
  - Create `packages/core/src/preprocessing/text.ts`
    - Implement `cleanText(text: string)` - trim whitespace, normalize unicode
    - Implement `extractPdfText(buffer: Buffer)` using `pdf-parse`
    - Handle multi-page PDFs, extract up to N pages or size limit
    - Fallback to empty string if extraction fails
  - Create `packages/core/src/preprocessing/mime.ts`
    - Implement `detectMimeType(buffer: Buffer, filename: string)`
    - Use magic bytes and file extension
    - Validate against supported types

- [ ] **Implement similarity calculation**
  - Create `packages/core/src/similarity/cosine.ts`
    - Implement `cosineSimilarity(vec1: number[], vec2: number[]): number`
    - Implement `batchCosineSimilarity(vectors: number[][]): number[][]`
    - Optimize with typed arrays for performance
  - Create `packages/core/src/similarity/clustering.ts`
    - Implement `clusterSimilarItems(items: Item[], threshold: number)`
    - Use single-linkage clustering or DBSCAN
    - Return groups with similarity scores
    - Add unit tests with known clusters

- [ ] **Implement deduplication logic**
  - Create `packages/core/src/dedupe/grouper.ts`
    - Implement `groupDuplicates(files: FileWithEmbedding[], threshold: number)`
    - Apply clustering on embeddings
    - Merge exact hash matches automatically
    - Return groups with keep/duplicate candidates
  - Create `packages/core/src/dedupe/tie-breaker.ts`
    - Implement `selectKeepFile(files: File[]): File`
    - Priority: exact hash match > higher resolution > newer modified time
    - For images, prefer higher pixel dimensions
    - Add explanatory reason string
  - Create `packages/core/src/dedupe/explainer.ts`
    - Implement `explainMatch(file1: File, file2: File, score: number): string`
    - Return reasons: "Exact hash match", "Visual similarity: 95%", "Text similarity: 92%"

#### 3.3 UI Package (`packages/ui`)
- [ ] **Setup UI package with React**
  - Create `packages/ui/package.json`
  - Install React, TypeScript, Tailwind CSS
  - Install shadcn/ui CLI and initialize
  - Configure Tailwind with shared theme

- [ ] **Install and configure shadcn/ui components**
  - Add Button component via `npx shadcn-ui add button`
  - Add Card component
  - Add Badge component
  - Add Dialog component
  - Add Progress component
  - Add Accordion component
  - Add Checkbox component
  - Add Tooltip component
  - Customize theme colors in `tailwind.config.js`

- [ ] **Create custom shared components**
  - Create `packages/ui/src/FileCard.tsx`
    - Display file name, type, size, preview thumbnail
    - Show selected/unselected state with checkbox
    - Emit onToggle event
    - Add loading skeleton variant
  - Create `packages/ui/src/SimilarityBadge.tsx`
    - Display similarity percentage or match type
    - Color-code by threshold (green=exact, yellow=high, red=medium)
    - Show tooltip with explanation
  - Create `packages/ui/src/FileDropzone.tsx`
    - Drag-and-drop upload zone
    - File type validation
    - Size limit validation
    - Show upload progress
    - Display file list with remove option
  - Create `packages/ui/src/GroupAccordion.tsx`
    - Display dedupe group with keep file highlighted
    - Show duplicate files in list
    - Toggle selection for each file
    - Display similarity scores
  - Create `packages/ui/src/LoadingSpinner.tsx`
    - Configurable size and color
    - Accessible with aria labels
  - Create `packages/ui/src/ErrorBoundary.tsx`
    - Catch React errors
    - Display user-friendly error message
    - Provide retry option

- [ ] **Create utility hooks**
  - Create `packages/ui/src/hooks/useFileUpload.ts`
    - Handle multipart file uploads
    - Track upload progress
    - Handle cancellation
  - Create `packages/ui/src/hooks/useDebounce.ts`
  - Create `packages/ui/src/hooks/useLocalStorage.ts`

---

### Phase 4: Backend API Service (`services/api`)

#### 4.1 API Setup and Configuration
- [ ] **Initialize Fastify application**
  - Create `services/api/package.json`
  - Install Fastify, @fastify/cors, @fastify/cookie, @fastify/multipart
  - Create `services/api/src/server.ts` with Fastify instance
  - Configure CORS for web and desktop origins
  - Configure cookie settings (httpOnly, sameSite, secure)
  - Add request logging with pino
  - Add graceful shutdown handlers

- [ ] **Setup request validation**
  - Install Zod and @fastify/type-provider-zod
  - Configure Zod as schema validator
  - Create validation error handler
  - Add global error handler with proper status codes

- [ ] **Configure file upload handling**
  - Configure @fastify/multipart with size limits
  - Set max file size (e.g., 10MB per file, 100MB total)
  - Configure allowed MIME types
  - Implement stream-based file processing (no disk writes)

- [ ] **Setup rate limiting**
  - Install @fastify/rate-limit
  - Configure per-IP rate limits
  - Configure per-user rate limits (after auth)
  - Add custom rate limit error responses

#### 4.2 Authentication and Session Management
- [ ] **Implement password hashing**
  - Create `services/api/src/auth/hash.ts`
  - Use bcrypt or argon2 for password hashing
  - Implement `hashPassword(password: string): Promise<string>`
  - Implement `verifyPassword(password: string, hash: string): Promise<boolean>`
  - Set appropriate cost factor (e.g., bcrypt rounds=12)

- [ ] **Implement session management**
  - Create `services/api/src/auth/session.ts`
  - Install @fastify/session or implement JWT-based sessions
  - Generate secure session tokens
  - Store session data (in-memory for MVP, Redis for production)
  - Implement session expiration (e.g., 7 days)

- [ ] **Create authentication routes**
  - Create `services/api/src/routes/auth.ts`
  - `POST /auth/login` endpoint:
    - Validate email and password
    - Query user from database
    - Verify password hash
    - Create session and set cookie
    - Return user info (without password)
  - `POST /auth/logout` endpoint:
    - Clear session
    - Clear cookie
    - Return success
  - `GET /auth/me` endpoint:
    - Check session validity
    - Return current user info
    - Return 401 if not authenticated

- [ ] **Create authentication middleware**
  - Create `services/api/src/middleware/auth.ts`
  - Implement `requireAuth` decorator
  - Check session/cookie validity
  - Attach user to request object
  - Return 401 for unauthenticated requests

#### 4.3 License Management Routes
- [ ] **Implement license generation**
  - Create `services/api/src/routes/license.ts`
  - `POST /license/generate` endpoint:
    - Require authentication
    - Generate UUIDv4 license key
    - Associate with current user
    - Insert into license_keys table
    - Return license key

- [ ] **Implement license validation**
  - `POST /desktop/validate-license` endpoint:
    - Accept license key in body
    - Query license_keys table
    - Check if key exists and not revoked
    - Return validation result and user info
    - Rate limit this endpoint aggressively

- [ ] **Implement license revocation**
  - `DELETE /license/:key` endpoint:
    - Require authentication
    - Check ownership (user_id matches)
    - Set revoked=true in database
    - Return success

#### 4.4 File Upload and Processing Routes
- [ ] **Implement file upload endpoint**
  - Create `services/api/src/routes/dedupe.ts`
  - `POST /dedupe/preview` endpoint (multipart):
    - Require authentication
    - Accept files[] in multipart/form-data
    - Validate file types against whitelist
    - Validate file sizes
    - Create upload record in database
    - For each file:
      - Read file buffer from stream
      - Calculate SHA-256 hash
      - Calculate pHash (for images)
      - Extract text (for PDFs/TXT)
      - Store file metadata in files table
      - Send to model worker for embeddings
      - Store embeddings in file_embeddings table
    - Call deduplication logic
    - Return grouped results

- [ ] **Implement deduplication logic orchestration**
  - Create `services/api/src/services/dedupe-service.ts`
  - `async processDedupe(uploadId: string)`:
    - Query all files and embeddings for upload
    - Group by file type (images, PDFs, text)
    - Run similarity calculation for each type
    - Apply clustering algorithm
    - Apply tie-breaker logic for each group
    - Store results in dedupe_groups table
    - Return grouped results with keep/duplicate flags

- [ ] **Implement ZIP generation endpoint**
  - `POST /dedupe/zip` endpoint:
    - Require authentication
    - Accept `{ uploadId, selectedFileIds[] }` in body
    - Validate ownership of uploadId
    - Query file metadata for selectedFileIds
    - Note: Files are already deleted from temp storage
    - Return error: "Files no longer available for download"
    - OR: Modify upload flow to keep files in memory/temp for X minutes
    - Stream ZIP file back to client using archiver or jszip
    - Delete temp files after streaming

- [ ] **Implement desktop-specific endpoints**
  - `POST /desktop/dedupe/preview`:
    - Validate license key
    - Accept file metadata list (path, mime, size, sha256, phash)
    - Option A: Desktop sends small file samples for embedding
    - Option B: Desktop sends pre-computed embeddings (future)
    - Return deduplication groups
    - Cache results by SHA-256 for performance

#### 4.5 Health and Monitoring
- [ ] **Implement health check endpoints**
  - Create `services/api/src/routes/health.ts`
  - `GET /healthz`:
    - Check database connection
    - Check model worker connection
    - Return status: "ok" or "degraded"
  - `GET /version`:
    - Return API version and build info

- [ ] **Setup structured logging**
  - Configure pino logger with JSON output
  - Log all requests with request ID
  - Log errors with stack traces
  - Log performance metrics (response time, file size)
  - Add correlation IDs for request tracing

- [ ] **Setup metrics collection**
  - Create `services/api/src/metrics/collector.ts`
  - Track request count by endpoint
  - Track response times (p50, p95, p99)
  - Track file processing count and sizes
  - Track embedding generation time
  - Track error rates
  - Expose `/metrics` endpoint (Prometheus format)

---

### Phase 5: AI Model Worker (`services/model-worker`)

#### 5.1 Model Worker Setup
- [ ] **Initialize model worker service**
  - Create `services/model-worker/package.json`
  - Install Fastify (or Express) for HTTP API
  - Install `@xenova/transformers` (transformers.js)
  - Install `sharp` for image preprocessing
  - Configure TypeScript

- [ ] **Configure transformers.js**
  - Create `services/model-worker/src/config.ts`
  - Set model cache directory
  - Configure ONNX runtime settings
  - Set device (CPU for free tier, GPU if available)
  - Configure memory limits

- [ ] **Download and cache models on startup**
  - Create `services/model-worker/src/models/loader.ts`
  - Download DistilBERT: `sentence-transformers/distilbert-base-nli-stsb-mean-tokens`
  - Download CLIP: `sentence-transformers/clip-ViT-B-32`
  - Verify models load successfully
  - Add retry logic for downloads
  - Cache models to disk for reuse

#### 5.2 Text Embedding Service
- [ ] **Implement text embedding endpoint**
  - Create `services/model-worker/src/routes/embeddings.ts`
  - `POST /embed/text`:
    - Accept `{ texts: string[] }` in body
    - Validate input (max length, max batch size)
    - Tokenize texts using DistilBERT tokenizer
    - Run inference through model
    - Apply mean pooling on token embeddings
    - Normalize embeddings (L2 norm)
    - Return 768-dimensional vectors
    - Add request logging and timing

- [ ] **Optimize text embedding performance**
  - Implement batching for multiple texts
  - Set optimal batch size (e.g., 8-16 texts)
  - Add request queuing for high load
  - Implement caching by text hash (for repeated texts)
  - Monitor memory usage

#### 5.3 Image Embedding Service
- [ ] **Implement image preprocessing**
  - Create `services/model-worker/src/preprocessing/images.ts`
  - `async preprocessImage(buffer: Buffer)`:
    - Decode image using sharp
    - Resize to 224x224 (CLIP input size)
    - Convert to RGB
    - Normalize pixel values to [-1, 1] or [0, 1] (model-specific)
    - Return tensor-ready buffer

- [ ] **Implement image embedding endpoint**
  - `POST /embed/image`:
    - Accept `{ images: base64[] }` in body OR multipart files
    - Validate input (max size, max batch size)
    - Decode base64 to buffers
    - Preprocess each image
    - Run inference through CLIP model
    - Normalize embeddings (L2 norm)
    - Return 512-dimensional vectors
    - Add request logging and timing

- [ ] **Optimize image embedding performance**
  - Implement batching for multiple images
  - Set optimal batch size (e.g., 4-8 images)
  - Add request queuing
  - Implement caching by image hash
  - Monitor memory usage and add memory clearing

#### 5.4 Model Worker API
- [ ] **Create unified embedding endpoint**
  - `POST /embed/batch`:
    - Accept `{ items: Array<{id, type, content}> }`
    - Route to text or image embedding based on type
    - Process in parallel where possible
    - Return array of `{ id, embedding: number[] }`
    - Handle partial failures gracefully

- [ ] **Add health check**
  - `GET /health`:
    - Check if models are loaded
    - Check memory usage
    - Return status and model info

- [ ] **Add model warm-up**
  - Create `services/model-worker/src/warmup.ts`
  - Run dummy inference on startup
  - Ensures models are fully loaded
  - Reduces first-request latency

#### 5.5 Error Handling and Monitoring
- [ ] **Implement robust error handling**
  - Handle model loading errors
  - Handle inference errors (OOM, timeout)
  - Handle preprocessing errors (corrupt images, invalid text)
  - Return structured error responses
  - Log all errors with context

- [ ] **Add performance monitoring**
  - Track inference time per request
  - Track memory usage before/after inference
  - Track queue length and wait times
  - Expose metrics endpoint
  - Add alerts for high memory usage

---

### Phase 6: Web Frontend (`apps/web`)

#### 6.1 Next.js Setup
- [ ] **Initialize Next.js app**
  - Create `apps/web/` directory
  - Run `npx create-next-app@latest` with TypeScript, Tailwind, App Router
  - Install dependencies: `@tanstack/react-query`, `zod`, `axios`
  - Configure `next.config.js` with environment variables
  - Setup `tsconfig.json` with path aliases

- [ ] **Configure Tailwind CSS**
  - Extend Tailwind config with custom theme
  - Configure dark mode support
  - Import shadcn/ui theme from `packages/ui`
  - Add custom utilities and components

- [ ] **Setup React Query**
  - Create `apps/web/src/lib/query-client.ts`
  - Configure default options (retry, staleTime, etc.)
  - Create QueryClientProvider wrapper
  - Add React Query DevTools for development

- [ ] **Setup API client**
  - Create `apps/web/src/lib/api-client.ts`
  - Configure axios with base URL
  - Add request interceptors (auth token, request ID)
  - Add response interceptors (error handling)
  - Create typed API functions using generated types

#### 6.2 Authentication Pages
- [ ] **Create login page**
  - Create `apps/web/src/app/login/page.tsx`
  - Build login form with email and password fields
  - Use react-hook-form for form management
  - Add Zod validation
  - Call `POST /auth/login` on submit
  - Store session cookie
  - Redirect to `/dedupe` on success
  - Display error messages on failure

- [ ] **Create authentication context**
  - Create `apps/web/src/contexts/auth-context.tsx`
  - Implement `useAuth` hook
  - Store current user state
  - Provide login, logout, checkAuth methods
  - Protect routes with auth check

- [ ] **Create protected route wrapper**
  - Create `apps/web/src/components/ProtectedRoute.tsx`
  - Check authentication status
  - Redirect to login if not authenticated
  - Show loading state while checking
  - Wrap protected pages with this component

#### 6.3 License Management Page
- [ ] **Create license page**
  - Create `apps/web/src/app/license/page.tsx`
  - Display "Generate License Key" button
  - Call `POST /license/generate` on click
  - Display generated key in copyable text field
  - Show list of existing license keys
  - Add "Revoke" button for each key
  - Show creation date for each key
  - Add success/error toast notifications

#### 6.4 File Upload and Deduplication Page
- [ ] **Create main dedupe page**
  - Create `apps/web/src/app/dedupe/page.tsx`
  - Use FileDropzone component from `packages/ui`
  - Show upload progress during file upload
  - Display file list with type icons and sizes
  - Add "Analyze for Duplicates" button
  - Show loading state during analysis
  - Display results in groups after analysis

- [ ] **Create file upload logic**
  - Create `apps/web/src/hooks/useFileUpload.ts`
  - Implement multipart file upload
  - Track upload progress per file
  - Handle upload cancellation
  - Validate file types and sizes before upload
  - Call `POST /dedupe/preview` with FormData

- [ ] **Create deduplication results view**
  - Create `apps/web/src/components/DedupeResults.tsx`
  - Display groups using GroupAccordion component
  - Highlight "keep" file in each group
  - Show similarity scores with SimilarityBadge
  - Allow toggling keep/duplicate for each file
  - Show total files kept vs. removed
  - Show total size saved

- [ ] **Implement file selection management**
  - Create `apps/web/src/hooks/useFileSelection.ts`
  - Track selected/unselected state for each file
  - Allow toggle individual files
  - Allow "Select All" / "Deselect All" per group
  - Calculate statistics (files kept, size saved)

- [ ] **Implement ZIP download**
  - Add "Download Selected Files" button
  - Call `POST /dedupe/zip` with selectedFileIds
  - Handle file download response
  - Show download progress
  - Handle download errors
  - Auto-cleanup state after download

#### 6.5 UI Polish and UX
- [ ] **Add loading states**
  - Show skeleton loaders for all async operations
  - Add spinner for button actions
  - Show progress bars for uploads and downloads
  - Add loading overlay for full-page operations

- [ ] **Add error handling**
  - Create error boundary components
  - Show user-friendly error messages
  - Add retry buttons for failed operations
  - Log errors to console for debugging
  - Add toast notifications for errors

- [ ] **Add empty states**
  - "No files uploaded yet" empty state
  - "No duplicates found" success state
  - "Upload failed" error state
  - Add illustrations or icons for each

- [ ] **Improve accessibility**
  - Add ARIA labels to all interactive elements
  - Ensure keyboard navigation works
  - Add focus indicators
  - Test with screen readers
  - Add alt text to images

- [ ] **Add responsive design**
  - Test on mobile, tablet, desktop breakpoints
  - Adjust layout for small screens
  - Use responsive Tailwind classes
  - Test touch interactions on mobile

#### 6.6 Testing
- [ ] **Setup testing infrastructure**
  - Install Vitest and React Testing Library
  - Configure test environment
  - Create test utilities and mocks
  - Setup coverage reporting

- [ ] **Write component tests**
  - Test FileDropzone upload validation
  - Test FileCard selection toggle
  - Test GroupAccordion expand/collapse
  - Test login form validation
  - Aim for >80% component coverage

- [ ] **Write integration tests**
  - Test full upload → dedupe → download flow
  - Test authentication flow
  - Test error scenarios
  - Mock API responses

---

### Phase 7: Desktop App (`apps/desktop`)

#### 7.1 Electron Setup
- [ ] **Initialize Electron app**
  - Create `apps/desktop/` directory
  - Install Electron, electron-builder
  - Create `apps/desktop/package.json`
  - Setup electron-builder configuration for Windows
  - Configure TypeScript for main and renderer processes

- [ ] **Create Electron main process**
  - Create `apps/desktop/src/main/index.ts`
  - Initialize Electron app
  - Create main browser window
  - Load renderer HTML
  - Setup IPC handlers
  - Add app lifecycle management (ready, quit, etc.)

- [ ] **Create Electron preload script**
  - Create `apps/desktop/src/preload/index.ts`
  - Expose safe IPC methods to renderer
  - Create contextBridge API
  - Add TypeScript definitions for exposed API

- [ ] **Setup renderer process**
  - Create `apps/desktop/src/renderer/` with React app
  - Use Vite for renderer bundling
  - Configure Vite for Electron environment
  - Setup hot reload for development

#### 7.2 License Validation
- [ ] **Create license input screen**
  - Create `apps/desktop/src/renderer/pages/License.tsx`
  - Show input field for license key
  - Add "Validate" button
  - Call API via main process to validate
  - Store valid license in encrypted local storage
  - Redirect to main app on success

- [ ] **Implement license storage**
  - Use electron-store for persistent storage
  - Encrypt license key before storing
  - Decrypt on app startup
  - Validate license on each app launch
  - Clear license on revocation

- [ ] **Create license validation IPC**
  - Add IPC handler in main process
  - `ipcMain.handle('validate-license', async (key) => ...)`
  - Call `POST /desktop/validate-license`
  - Return validation result
  - Handle network errors gracefully

#### 7.3 Directory Selection and Scanning
- [ ] **Create directory picker UI**
  - Create `apps/desktop/src/renderer/pages/Scan.tsx`
  - Add "Select Folder" button
  - Use dialog.showOpenDialog for folder selection
  - Display selected folder path
  - Add "Start Scan" button

- [ ] **Implement file scanning**
  - Create `apps/desktop/src/main/scanner.ts`
  - Use `fast-glob` to find files recursively
  - Filter by supported extensions: `**/*.{png,jpg,jpeg,webp,gif,pdf,txt}`
  - Get file stats (size, modified time)
  - Calculate SHA-256 hash for each file
  - Calculate pHash for images
  - Return file metadata array

- [ ] **Add scanning progress UI**
  - Show progress bar during scan
  - Display "X files scanned" counter
  - Show current file being processed
  - Allow cancellation of scan
  - Handle scan errors (permission denied, etc.)

- [ ] **Categorize scanned files**
  - Group files by type: Images, PDFs, Text, Other
  - Display category counts
  - Show total size per category
  - Allow filtering by category

#### 7.4 Duplicate Detection Integration
- [ ] **Send files to API for analysis**
  - Create `apps/desktop/src/main/dedupe-client.ts`
  - Prepare file metadata for API
  - For large files, send small sample (first N bytes or downsampled image)
  - Call `POST /desktop/dedupe/preview`
  - Handle response with duplicate groups
  - Cache results by SHA-256 to avoid re-analysis

- [ ] **Display duplicate groups**
  - Create `apps/desktop/src/renderer/components/DesktopGroupList.tsx`
  - Reuse GroupAccordion from `packages/ui`
  - Show local file paths instead of filenames
  - Display file previews (thumbnails for images, icons for PDFs/TXT)
  - Highlight "keep" file
  - Show similarity scores

- [ ] **Implement file preview**
  - Create preview pane in UI
  - For images: show thumbnail using `sharp` or native preview
  - For PDFs: show first page thumbnail
  - For text: show first few lines
  - Add "Open in Explorer" button
  - Add "Open File" button to open with default app

#### 7.5 File Operations (Recycle Bin)
- [ ] **Implement Recycle Bin integration**
  - Install `trash` npm package
  - Create `apps/desktop/src/main/file-operations.ts`
  - Implement `async moveToRecycleBin(filePaths: string[])`
  - Add error handling for locked files
  - Add progress tracking for batch operations

- [ ] **Create confirmation dialog**
  - Show summary before deletion:
    - "X files will be moved to Recycle Bin"
    - "Y MB will be freed"
  - List files to be deleted
  - Add "Cancel" and "Move to Recycle Bin" buttons
  - Add "Don't ask again" checkbox for future sessions

- [ ] **Implement dry-run mode**
  - Add toggle for "Dry Run" mode
  - When enabled, log what would be deleted without actual deletion
  - Show dry-run results in UI
  - Useful for testing and user confidence

- [ ] **Add post-deletion summary**
  - Show success message with stats
  - "X files moved to Recycle Bin"
  - "Y MB freed"
  - Add "Undo" button (open Recycle Bin in Explorer)
  - Add "Scan Again" button

#### 7.6 Settings and Configuration
- [ ] **Create settings page**
  - Create `apps/desktop/src/renderer/pages/Settings.tsx`
  - Add similarity threshold sliders
  - Add file size limits configuration
  - Add excluded directories list
  - Add "Reset to Defaults" button
  - Save settings to electron-store

- [ ] **Add auto-update configuration**
  - Integrate electron-updater
  - Check for updates on startup
  - Show notification when update available
  - Add "Check for Updates" in settings
  - Implement automatic download and install

#### 7.7 Desktop App Build and Packaging
- [ ] **Configure electron-builder**
  - Create `apps/desktop/electron-builder.json5`
  - Configure Windows target (NSIS installer)
  - Set app name, version, description
  - Configure installer options (install per user/machine)
  - Add app icon (create .ico file)
  - Configure file associations for supported types

- [ ] **Create build scripts**
  - Add `build` script to package.json
  - Add `pack` script for testing (unpacked build)
  - Add `dist` script for production installer
  - Configure code signing (optional for MVP)

- [ ] **Test installer**
  - Build installer on Windows
  - Test installation process
  - Test app launch after install
  - Test uninstallation
  - Test upgrade from previous version

---

### Phase 8: Integration Testing

#### 8.1 API Integration Tests
- [ ] **Setup API testing framework**
  - Install Supertest for HTTP testing
  - Install Vitest or Jest as test runner
  - Create test database (separate from dev)
  - Create test fixtures and seed data

- [ ] **Write API endpoint tests**
  - Test `POST /auth/login` (success and failure cases)
  - Test `POST /license/generate` (authenticated)
  - Test `POST /desktop/validate-license`
  - Test `POST /dedupe/preview` (with sample files)
  - Test `POST /dedupe/zip`
  - Test rate limiting
  - Test error responses

- [ ] **Write model worker integration tests**
  - Test text embedding endpoint with sample texts
  - Test image embedding endpoint with sample images
  - Verify embedding dimensions (768 for text, 512 for images)
  - Test batch processing
  - Test error handling

- [ ] **Write database integration tests**
  - Test all repository methods
  - Test vector similarity queries
  - Test transactions and rollbacks
  - Test cascading deletes
  - Verify indexes are used (EXPLAIN ANALYZE)

#### 8.2 End-to-End Tests
- [ ] **Setup E2E testing framework**
  - Install Playwright for web E2E tests
  - Configure test environment
  - Create test accounts and licenses
  - Setup test data cleanup

- [ ] **Write web app E2E tests**
  - Test login flow
  - Test license generation
  - Test file upload and dedupe flow
  - Test file selection and ZIP download
  - Test error scenarios
  - Test responsive design

- [ ] **Write desktop app E2E tests**
  - Use Spectron or Playwright for Electron
  - Test license validation
  - Test directory scanning
  - Test duplicate detection
  - Test Recycle Bin operation (in dry-run mode)
  - Test settings persistence

#### 8.3 Performance Testing
- [ ] **Setup performance testing**
  - Install k6 or Artillery for load testing
  - Create test scripts for key endpoints
  - Setup performance benchmarks

- [ ] **Test API performance**
  - Load test `/dedupe/preview` with 50, 100, 500 files
  - Measure response times (p50, p95, p99)
  - Test concurrent users (10, 50, 100)
  - Identify bottlenecks
  - Test rate limiting effectiveness

- [ ] **Test model worker performance**
  - Benchmark embedding generation time
  - Test memory usage under load
  - Test queue behavior with many requests
  - Optimize batch sizes

- [ ] **Test database performance**
  - Benchmark vector similarity queries
  - Test with 1K, 10K, 100K embeddings
  - Verify index usage
  - Optimize slow queries

---

### Phase 9: Deployment

#### 9.1 Database Deployment (Neon)
- [ ] **Setup production database**
  - Create production Neon project
  - Enable pgvector extension
  - Configure connection pooling
  - Set up automated backups
  - Get connection string for production

- [ ] **Run migrations on production**
  - Test migrations on staging first
  - Run migrations on production database
  - Verify all tables and indexes created
  - Seed production with initial data (if needed)

- [ ] **Configure database security**
  - Restrict IP access (if possible)
  - Use SSL connections
  - Create read-only user for analytics
  - Setup monitoring and alerts

#### 9.2 API Deployment (Render)
- [ ] **Create Render account and project**
  - Sign up for Render
  - Connect GitHub repository
  - Create Web Service for API

- [ ] **Configure API service on Render**
  - Set build command: `pnpm install && pnpm build:api`
  - Set start command: `node services/api/dist/server.js`
  - Configure environment variables:
    - DATABASE_URL (from Neon)
    - SESSION_SECRET (generate secure random string)
    - MODEL_WORKER_URL
    - CORS_ORIGINS
  - Set instance type (free tier for MVP)
  - Enable auto-deploy on push to main

- [ ] **Create Model Worker service on Render**
  - Create separate Web Service for model worker
  - Set build command: `pnpm install && pnpm build:model-worker`
  - Set start command: `node services/model-worker/dist/server.js`
  - Configure environment variables
  - Set instance type with sufficient RAM (at least 2GB)
  - Enable auto-deploy

- [ ] **Test deployed API**
  - Verify health check endpoint
  - Test authentication endpoints
  - Test file upload and dedupe with real files
  - Check logs for errors
  - Test from different IP addresses

#### 9.3 Web App Deployment (Vercel)
- [ ] **Create Vercel account and project**
  - Sign up for Vercel
  - Connect GitHub repository
  - Import `apps/web` directory

- [ ] **Configure Vercel deployment**
  - Set framework preset to Next.js
  - Set build command: `cd ../.. && pnpm build:web`
  - Set output directory: `apps/web/.next`
  - Configure environment variables:
    - NEXT_PUBLIC_API_URL (Render API URL)
    - NEXT_PUBLIC_APP_ENV=production
  - Enable auto-deploy on push to main

- [ ] **Configure custom domain (optional)**
  - Add custom domain in Vercel dashboard
  - Configure DNS records
  - Enable HTTPS

- [ ] **Test deployed web app**
  - Verify all pages load correctly
  - Test login and license flows
  - Test file upload and dedupe
  - Check browser console for errors
  - Test on multiple browsers

#### 9.4 Desktop App Distribution
- [ ] **Build production desktop app**
  - Build for Windows (NSIS installer)
  - Test installer on clean Windows machine
  - Verify app works after installation
  - Test auto-update functionality

- [ ] **Setup distribution method**
  - Option A: Host installer on GitHub Releases
  - Option B: Host on website with download link
  - Create download page with instructions
  - Add system requirements
  - Add installation guide

- [ ] **Configure auto-updates**
  - Setup update server (can use GitHub Releases)
  - Configure electron-updater with update URL
  - Test update notification
  - Test automatic download and install

---

### Phase 10: Documentation and Polish

#### 10.1 Code Documentation
- [ ] **Add JSDoc comments**
  - Document all public functions with JSDoc
  - Add parameter descriptions
  - Add return type descriptions
  - Add usage examples for complex functions
  - Document edge cases and error conditions

- [ ] **Create inline code comments**
  - Explain complex algorithms
  - Explain non-obvious design decisions
  - Add TODO comments for future improvements
  - Add FIXME comments for known issues

#### 10.2 User Documentation
- [ ] **Create main README.md**
  - Project overview and features
  - Screenshots of web and desktop app
  - Technology stack
  - Link to setup guide for developers
  - Link to user guide
  - License information

- [ ] **Create developer setup guide**
  - Prerequisites (Node.js, pnpm, etc.)
  - Installation steps
  - Environment variables setup
  - How to run locally
  - How to run tests
  - How to build for production
  - Troubleshooting common issues

- [ ] **Create user guide**
  - How to use web app
  - How to install desktop app
  - How to generate license key
  - How to scan for duplicates
  - How to review results
  - How to export/delete files
  - FAQ section

- [ ] **Create API documentation**
  - Use OpenAPI/Swagger for API docs
  - Document all endpoints
  - Add request/response examples
  - Document authentication
  - Document error codes
  - Host API docs at `/api-docs`

#### 10.3 Architecture Documentation
- [ ] **Create architecture diagram**
  - Create diagram showing all components
  - Show data flow between components
  - Document deployment architecture
  - Add to `docs/architecture.md`

- [ ] **Document design decisions**
  - Why pgvector for similarity search
  - Why Fastify vs Express
  - Why transformers.js vs Python
  - Why monorepo structure
  - Add to `docs/design-decisions.md`

- [ ] **Create database schema documentation**
  - Document all tables and relationships
  - Explain indexes and their purpose
  - Document migration strategy
  - Add ER diagram

#### 10.4 Final Testing and QA
- [ ] **Conduct full QA pass**
  - Test all features in web app
  - Test all features in desktop app
  - Test on different screen sizes
  - Test on different Windows versions
  - Create bug list and prioritize

- [ ] **Fix critical bugs**
  - Fix all P0 (critical) bugs
  - Fix P1 (high priority) bugs
  - Document known issues (P2, P3)
  - Create issues for future fixes

- [ ] **Conduct security review**
  - Review authentication implementation
  - Check for SQL injection vulnerabilities
  - Check for XSS vulnerabilities
  - Review file upload security
  - Check for exposed secrets
  - Review CORS configuration

- [ ] **Conduct accessibility audit**
  - Test with keyboard navigation
  - Test with screen reader
  - Check color contrast ratios
  - Verify ARIA labels
  - Fix accessibility issues

#### 10.5 Demo Preparation
- [ ] **Create demo dataset**
  - Prepare set of sample files with obvious duplicates
  - Include images, PDFs, and text files
  - Include edge cases (near-duplicates, false positives)
  - Package in a ZIP file

- [ ] **Create demo script**
  - Write step-by-step demo walkthrough
  - Practice demo run
  - Time the demo (keep under 10 minutes)
  - Prepare talking points for each feature

- [ ] **Create presentation slides**
  - Project overview slide
  - Problem statement
  - Solution architecture
  - Technology stack
  - Live demo
  - Results and metrics
  - Future roadmap
  - Q&A

- [ ] **Record demo video**
  - Record screen capture of web app demo
  - Record screen capture of desktop app demo
  - Add voiceover explaining features
  - Edit and polish video
  - Upload to YouTube (unlisted) or host on website

---

### Phase 11: Final Submission Checklist

- [ ] **Code Quality**
  - All TypeScript errors resolved
  - All ESLint warnings addressed
  - All tests passing (>80% coverage)
  - No console.errors in production builds
  - Dead code removed
  - Unused dependencies removed

- [ ] **Deployments**
  - Web app deployed and accessible on Vercel
  - API deployed and accessible on Render
  - Model worker deployed and accessible on Render
  - Database running on Neon with pgvector
  - All deployments verified working

- [ ] **Desktop App**
  - Windows installer built and tested
  - Installer uploaded to distribution platform
  - Installation guide published
  - Auto-update tested

- [ ] **Documentation**
  - README.md complete with screenshots
  - Developer setup guide complete
  - User guide complete
  - API documentation complete
  - Architecture documentation complete

- [ ] **Demo Materials**
  - Demo dataset prepared
  - Demo script written and practiced
  - Presentation slides complete
  - Demo video recorded (optional)

- [ ] **Credentials and Access**
  - Sample user accounts created
  - Sample license keys generated
  - Test credentials documented
  - Access credentials for professor prepared

- [ ] **Repository Cleanup**
  - All secrets removed from git history
  - .gitignore properly configured
  - All branches merged or cleaned up
  - Final commit with "Release v1.0.0" message
  - Git tag created: `v1.0.0`

- [ ] **Final Verification**
  - Fresh clone and setup works
  - Web app works end-to-end
  - Desktop app works end-to-end
  - All documentation links work
  - All demo materials accessible

---

## 📊 Progress Tracking

### Milestone 1 (13/10) - Foundation
**Status:** Not Started  
**Completion:** 0%

Key Deliverables:
- Monorepo initialized
- Database schema designed and migrated
- Basic auth and license endpoints
- Next.js app scaffold
- Electron app scaffold

### Milestone 2 (27/10) - Core AI Integration
**Status:** Not Started  
**Completion:** 0%

Key Deliverables:
- AI models integrated
- Embedding generation working
- Deduplication logic implemented
- Basic UI for groups

### Milestone 3 (03/11) - UX and Completion
**Status:** Not Started  
**Completion:** 0%

Key Deliverables:
- File selection UI complete
- ZIP download working
- Recycle Bin integration
- Full workflow functional

### Milestone 4 (10/11) - Performance
**Status:** Not Started  
**Completion:** 0%

Key Deliverables:
- Caching implemented
- Performance optimizations
- Load testing complete
- QA test suite

### Milestone 5 (17/11) - Stabilization
**Status:** Not Started  
**Completion:** 0%

Key Deliverables:
- Bug fixes complete
- Documentation complete
- Security review done
- Beta deployment

### Milestone 6 (24/11) - Final Submission
**Status:** Not Started  
**Completion:** 0%

Key Deliverables:
- Production deployment
- Demo materials complete
- Final presentation ready
- Live demo conducted

---

## 🎯 Key Design Principles

1. **Modularity**: Each package/service is independent and reusable
2. **Type Safety**: Full TypeScript coverage with strict mode
3. **Error Handling**: Comprehensive error handling at every layer
4. **Performance**: Optimize for 500+ files, use caching, batch processing
5. **Security**: Validate all inputs, use secure defaults, no file persistence
6. **User Experience**: Loading states, error messages, progress indicators
7. **Testability**: Write tests alongside code, aim for >80% coverage
8. **Documentation**: Document as you build, not after
9. **Scalability**: Design for future growth (Redis cache, GPU support, etc.)
10. **Simplicity**: Keep MVP scope tight, defer nice-to-haves

---

## 🔄 Iterative Development Workflow

For each feature:
1. **Design**: Write types and interfaces first
2. **Implement**: Write minimal working code
3. **Test**: Write unit tests
4. **Document**: Add JSDoc comments and usage examples
5. **Integrate**: Connect with dependent components
6. **Review**: Check for errors, edge cases, performance
7. **Refactor**: Clean up, extract reusable parts
8. **Commit**: Commit with descriptive message

---

## 📝 Notes

- This plan is intentionally detailed to serve as a reference during implementation
- Each todo item should be completable in 1-4 hours
- Update completion status as you progress
- Add notes for any blockers or decisions made
- Keep the README updated with setup instructions
- Regular commits with clear messages for tracking progress
- Use feature branches for major features, squash before merging
- Tag releases for each milestone

---

**Last Updated:** October 6, 2025  
**Project Start Date:** October 6, 2025  
**Target Completion Date:** November 24, 2025  
**Total Duration:** 7 weeks

