# AI File Cleanup System — MVP Technical Plan

## 1) Product Overview

**Goal:** Help users clean duplicate files via an AI-based similarity engine.

**Surfaces**

- **Web UI (Next.js)**
  - **Test login** with seeded credentials (no third‑party auth in MVP).
  - **License key** generator (UUIDv4) and key→user association.
  - **Upload & review** image/PDF/TXT files.
  - **AI dedupe preview:** UI shows **Selected (keep)** vs **Unselected (duplicate)**; user can toggle.
  - **Export ZIP** of selected (keep) files.
- **Windows Desktop App (Electron + React)**
  - Select a directory; scan and categorize (Images, PDFs, Text, Other/Ignored).
  - Detect near‑duplicates using the same AI logic.
  - UI shows **Selected (keep)** vs **Unselected (duplicate)** per group.
  - On **Done**, move unselected files to **Recycle Bin** (safe, reversible).

**File types (MVP):** `.png, .jpg, .jpeg, .webp, .gif`, `.pdf`, `.txt`.

---

## 2) Tech Stack (Free & MVP‑friendly)

**Frontend (Web):** Next.js (React), TypeScript, Tailwind CSS, shadcn/ui, Vite for desktop UI.

**Desktop:** Electron (free), React (TypeScript), Node.js runtime APIs, `trash` npm for Recycle Bin (MIT), `fast-glob` for scanning.

**Backend:** Node.js + Fastify (or Express) on Render Free tier.

**DB:** Postgres on **Neon** (Free tier) + **pgvector** extension for vector search.

**AI Models (Hugging Face, free):**

- **Text/PDF:** `sentence-transformers/distilbert-base-nli-stsb-mean-tokens` (DistilBERT) for 768‑dim embeddings.
- **Images:** `sentence-transformers/clip-ViT-B-32` for 512‑dim embeddings.
- Optional fast classic signals: perceptual hash (`image-hash`/`sharp`) + SHA‑256.

**Vector Runtime:** Use server-side `transformers.js` **or** `sentence-transformers` (Python microservice optional). For simplicity, MVP uses **Node + transformers.js** with ONNX backends; fall back to a lightweight Python worker (free on Render) if needed.

**Storage:**

- **Uploads:** Process **in-memory/streamed**; do not persist server-side (MVP). Temporary disk only for zipping.
- **ZIP delivery:** Stream back to client.

**Deployment:**

- **Vercel**: Web (Next.js) static/SSR.
- **Render**: API service + (optional) model worker.
- **Neon**: Postgres + pgvector.\
  All are free-tier capable.

---

## 3) High-Level Architecture

```
[Web (Next.js)]  ──►  [API (Fastify on Render)] ──► [Neon Postgres + pgvector]
       ▲                     │                         ▲
       │                     │                         │
       │                     ├──► [Model Worker (Node/ONNX, HF models)]
       │                     │
[Electron App] ──────────────┘  (same API & model endpoints)
```

- **Embedding flow:** client uploads/streams → API validates & extracts → Model Worker returns embeddings → API groups duplicates (cosine) → response groups → client UI toggles → API streams ZIP (web) or desktop moves to Recycle Bin.

---

## 4) Data Model (Neon / Postgres)

```sql
-- Users (seeded test accounts in MVP)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- License keys
CREATE TABLE license_keys (
  key UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked BOOLEAN DEFAULT FALSE
);

-- Upload sessions (web) for auditability
CREATE TABLE uploads (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total_files INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Files catalog (ephemeral for MVP)
CREATE TABLE files (
  id UUID PRIMARY KEY,
  upload_id UUID REFERENCES uploads(id),
  file_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  sha256 TEXT,
  phash TEXT,              -- for images
  text_excerpt TEXT,        -- for PDF/TXT
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vector table (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE file_embeddings (
  file_id UUID PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,
  kind TEXT CHECK (kind IN ('image','text')),
  embedding vector(768),   -- DistilBERT/text
  embedding_img vector(512) -- CLIP/image (nullable)
);

-- Duplicate groups (for UX replay)
CREATE TABLE dedupe_groups (
  id UUID PRIMARY KEY,
  upload_id UUID REFERENCES uploads(id),
  group_index INT,
  kept_file_id UUID REFERENCES files(id)
);

CREATE INDEX ON file_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON file_embeddings USING ivfflat (embedding_img vector_cosine_ops);
```

---

## 5) API Design (Fastify)

**Auth (MVP test mode):**

- `POST /auth/login` → issue HTTP-only session cookie (seed users in DB).
- `POST /license/generate` → returns UUIDv4; stores `license_keys` with `user_id`.

**AI & Files:**

- `POST /dedupe/preview` (multipart): files[] (img/pdf/txt)
  - Server extracts text (PDF: `pdf-parse`), normalizes images (`sharp`).
  - Runs embeddings (text→DistilBERT, image→CLIP), optional SHA/PHASH.
  - Computes cosine similarity; clusters groups by threshold (e.g., **≥ 0.90** same, **0.80–0.90** review).
  - Returns: groups with suggested **keep** candidate, others as **duplicate**.
- `POST /dedupe/zip` (JSON): `{ uploadId, selectedFileIds[] }` → streams ZIP.

**Desktop endpoints:**

- `POST /desktop/validate-license` (body: license key).
- `POST /desktop/dedupe/preview` (JSON): metadata list `{ files: [{ path, mime, size, sha256, phash? }], samples?: presigned uploads }`
  - Option A: desktop sends minimal file bytes for embedding.
  - Option B: desktop computes embeddings locally (future) and posts vectors.

**Admin/testing:**

- `GET /healthz`, `GET /version`.

---

## 6) Duplicate Detection Logic (MVP → Prod‑ready path)

1. **Preprocessing**
   - **Images:** load via `sharp` → resize longest side 224 → normalize.
   - **PDF:** extract text (first N pages or all under size threshold), fallback to image rendering if no text.
   - **TXT:** read UTF‑8; trim whitespace & boilerplate.
2. **Embeddings**
   - **Text:** DistilBERT (HF) mean‑pool → 768‑dim.
   - **Images:** CLIP ViT‑B/32 → 512‑dim.
3. **Similarity**
   - Cosine similarity in pgvector (server) **or** in-memory for current batch.
   - Thresholds (tunable): `same ≥0.90`, `likely duplicate 0.85–0.90`, `distinct <0.85`.
   - Use **tie‑breakers**: exact hash match → auto‑duplicate; newer file **kept** by default; higher resolution (images) preferred.
4. **Clustering**
   - Single‑link or DBSCAN over cosine distances to form groups.
5. **UX rules**
   - One **auto‑selected keep** per group; allow user overrides.
   - Explainability chip: “Matched by **hash** / **visual** / **text** similarity”.

---

## 7) Desktop App (Electron) Details

- **Scan**: `fast-glob` by extensions; categorize by mime.
- **Hashes**: SHA‑256 (crypto), **pHash** for images (`image-hash`).
- **AI**: call API for embeddings (MVP) to keep installer small; cache results by SHA‑256.
- **UI**: groups accordion; preview pane; select keep/unselect duplicates.
- **Recycle Bin**: `trash` npm moves files to Windows Recycle Bin; dry‑run mode supported.
- **License**: stored locally (encrypted) after `/desktop/validate-license`.

---

## 8) Web UI (Next.js) Details

- Pages: `/login`, `/license`, `/dedupe`.
- Components: FileDropzone, GroupList, FileCard, SimilarityBadge, ZipButton.
- State: React Query (TanStack) for API calls; Zod for validation.
- Uploads: chunked upload, client size guard, progress UI.

---

## 9) Monorepo & Folder Structure (pnpm + TurboRepo)

```
ai-file-cleanup/
├─ apps/
│  ├─ web/                    # Next.js (Vercel)
│  └─ desktop/                # Electron + React (Windows)
├─ services/
│  ├─ api/                    # Fastify/Express (Render)
│  └─ model-worker/           # Node + transformers.js (Render)
├─ packages/
│  ├─ ui/                     # Shared components (React)
│  ├─ core/                   # Dedupe algorithms, thresholds, schemas
│  ├─ db/                     # Prisma or Kysely schema + migrations
│  └─ types/                  # Shared TypeScript types
├─ infra/
│  ├─ vercel.json
│  ├─ render.yaml
│  ├─ prisma/ (if Prisma)
│  └─ docker/ (for local dev of API/worker)
├─ scripts/                   # seed users, generate test data
└─ .github/workflows/         # CI: lint, typecheck, build, tests
```

---

## 10) Security & Privacy (MVP)

- HTTPS only; HTTP‑only, SameSite cookies.
- File content processed in memory; no long‑term storage.
- Size caps & antivirus scan hook (optional ClamAV container on Render).
- Rate limits per user/license key.

---

## 11) Observability & QA

- Logging: pino (JSON) + Render logs.
- Metrics: basic counters (requests, embeddings/sec).
- Tests: unit (Vitest/Jest), API contract tests (Supertest), snapshot tests for grouping.

---

## 12) Deployment Notes

- **Web** → Vercel (envs: API\_BASE\_URL, PUBLIC thresholds).
- **API** → Render (Docker or native Node). Enable pgvector on Neon.
- **DB** → Neon (set pooling; run migrations on deploy).
- **Keys** → UUIDv4 from API; DO NOT expose DB writes to client.

---

## 13) Clear MVP Scope

- ✔ Test login + license generation.
- ✔ Upload (web), scan (desktop).
- ✔ AI dedupe preview (batch‑only; no persistent file store).
- ✔ ZIP export (web) / Recycle Bin (desktop).
- ✖ No third‑party auth, no orgs/teams, no cloud persistence of files.

---

## 14) Milestone Plan (Professor Review)

| Date      | Detailed Deliverables                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |                                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **13/10** | **Project Setup & Foundation:**• Initialize **monorepo** using TurboRepo + pnpm.• Create shared packages (`ui`, `core`, `db`, `types`).• Initialize **Neon Postgres** with **pgvector** enabled.• Design **DB schema** (users, license\_keys, uploads, files, embeddings).• Setup **Prisma/Kysely migrations** and test local DB.• Implement `license_key` API and seed test users.• Setup **Next.js web app** scaffold with Tailwind & shadcn/ui.• Build **Login + License generation** page.• Setup **Electron base app** with directory picker UI.• Configure **GitHub Actions CI** (lint, build, type-check).• Create project documentation skeleton (README + structure overview). |                                                                                                                                                         |
| **27/10** | **Core AI & API Integration:**• Integrate **Hugging Face models**: DistilBERT (text), CLIP (image).• Setup **Model Worker (Node + transformers.js)** service.• Build `/dedupe/preview` API with **Fastify**.• Implement **PDF text extraction** (pdf-parse) & **image normalization** (sharp).• Compute **cosine similarity** + grouping logic for duplicates.• Create **initial UI for group display** (web + desktop).• Connect **Electron app → API** for preview results.• Store embeddings temporarily in Neon for verification.• Validate **license key flow** on both platforms.• Add **health checks**, `/version` endpoint, and basic error handling.                          |                                                                                                                                                         |
| **03/11** | **UX Enhancement & Core Completion:**• Add **tie-breaker logic** (hash, resolution, modified time).• Implement **file selection toggles** (keep/unselect) in UI.• Improve **accessibility** and **responsive design** across screens.• Implement **ZIP generation endpoint** for selected files.• Connect client-side **ZIP download flow** in Next.js.• Integrate **Recycle Bin** support in Electron using `trash` npm.• Add **loading indicators**, progress bars, and error boundaries.• Conduct **internal QA** with 20–30 mixed file samples.• Finalize **MVP workflow** (Upload → Dedupe → Result → Action).• Review all flows for consistency between web and desktop.          |                                                                                                                                                         |
| **10/11** | **Performance & Stability:**• Implement **SHA-256 caching** for embeddings to avoid recomputation.• Add **batch inference** for efficient embedding generation.• Optimize **pgvector queries** (index tuning, retrieval limits).• Add **pagination** & **virtualized lists** for large datasets.• Implement **rate limiting** and request validation.• Add **QA test suite** (API + React components).• Integrate **pino logging** + metrics dashboard.• Conduct **load & stress tests** for 500+ files.• Begin minor UI polish and animation refinements.                                                                                                                              |                                                                                                                                                         |
| **17/11** | **Stabilization & Documentation:**• Conduct **full bug sweep** and **cross-platform testing**.• Review **security & privacy** (input validation, file size limits).• Write detailed **documentation** (API docs, developer setup, runbooks).• Prepare **demo dataset** for professor review.• Package **Windows installer** (MSI/NSIS).• Create **E2E tests** covering web + desktop.• Deploy **beta** on Vercel (web) and Render (API).• Conduct **user acceptance testing (UAT)**.                                                                                                                                                                                                    |                                                                                                                                                         |
| **24/11** | **Final Submission:**• Deliver **production-ready MVP deployment**: Vercel (web) + Render (API/worker) + Neon (DB).• Create **final walkthrough script** and demo video.• Prepare **presentation slides** for professor evaluation.• Submit **source code** with README and setup guide.• Provide **sample credentials & license keys**.• Conduct **final live demo** showcasing full end-to-end flow (web + desktop).                                                                                                                                                                                                                                                                  | **Final submission**: deployed Web on Vercel + API/Worker on Render + Neon DB; walkthrough script; sample licenses; showcase full flow (web + desktop). |

---

## 15) Key Implementation Snippets (Pseudo‑APIs)

```ts
// /license/generate
POST -> { key: uuidv4(), userId }

// /dedupe/preview multipart
-> returns: {
  groups: [
    { id, reason: 'hash|visual|text', keep: fileId, duplicates: [fileId, ...], scores: {...} }
  ]
}

// Desktop recycle (Node)
import trash from 'trash';
await trash(["C:\\Users\\me\\Pictures\\dup1.jpg"]);
```

> This plan keeps everything free-tier compatible, MVP-focused, and scalable: pgvector for AI similarity, Render for API/worker, Vercel for web, Electron for Windows, with Hugging Face models at the core.

