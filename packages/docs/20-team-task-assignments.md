# Project Timeline & Team Task Assignments

## Team Members & Roles

| Name     | Role      | Responsibilities                                           |
| -------- | --------- | ---------------------------------------------------------- |
| Vibhor   | Leader    | Project coordination, ML & backend development, deployment |
| Hritik   | Architect | System design, infrastructure, architecture decisions      |
| Subin    | Developer | Frontend implementation, desktop app, integration work     |
| Subhadip | Tester    | QA, testing, validation, bug fixing                        |
| Kamlesh  | Analyst   | Documentation, analysis, metrics, requirements             |

---

## Phase 1: Project Setup & Foundation (13/10)

| Task                                                                | Assigned To |
| ------------------------------------------------------------------- | ----------- |
| Initialize monorepo using TurboRepo + pnpm                          | Hritik      |
| Create shared packages (ui, core, db, types)                        | Hritik      |
| Initialize Neon Postgres with pgvector enabled                      | Hritik      |
| Design DB schema (users, license_keys, uploads, files, embeddings)  | Hritik      |
| Setup Prisma/Kysely migrations and test local DB                    | Vibhor      |
| Implement license_key API and seed test users                       | Vibhor      |
| Setup Next.js web app scaffold with Tailwind & shadcn/ui            | Subin       |
| Build Login + License generation page                               | Subin       |
| Setup Electron base app with directory picker UI                    | Subin       |
| Configure GitHub Actions CI (lint, build, type-check)               | Hritik      |
| Create project documentation skeleton (README + structure overview) | Kamlesh     |

---

## Phase 2: Core AI & API Integration (27/10)

| Task                                                                    | Assigned To |
| ----------------------------------------------------------------------- | ----------- |
| Integrate Hugging Face models: DistilBERT (text), CLIP (image)          | Vibhor      |
| Setup Model Worker (Node + transformers.js) service                     | Vibhor      |
| Build /dedupe/preview API with Fastify                                  | Vibhor      |
| Implement PDF text extraction (pdf-parse) & image normalization (sharp) | Vibhor      |
| Compute cosine similarity + grouping logic for duplicates               | Vibhor      |
| Create initial UI for group display (web + desktop)                     | Subin       |
| Connect Electron app → API for preview results                          | Subin       |
| Store embeddings temporarily in Neon for verification                   | Vibhor      |
| Validate license key flow on both platforms                             | Subhadip    |
| Add health checks, /version endpoint, and basic error handling          | Vibhor      |

---

## Phase 3: UX Enhancement & Core Completion (03/11)

| Task                                                        | Assigned To |
| ----------------------------------------------------------- | ----------- |
| Add tie-breaker logic (hash, resolution, modified time)     | Vibhor      |
| Implement file selection toggles (keep/unselect) in UI      | Subin       |
| Improve accessibility and responsive design across screens  | Subin       |
| Implement ZIP generation endpoint for selected files        | Vibhor      |
| Connect client-side ZIP download flow in Next.js            | Subin       |
| Integrate Recycle Bin support in Electron using trash npm   | Subin       |
| Add loading indicators, progress bars, and error boundaries | Subin       |
| Conduct internal QA with 20–30 mixed file samples           | Subhadip    |
| Finalize MVP workflow (Upload → Dedupe → Result → Action)   | Vibhor      |
| Review all flows for consistency between web and desktop    | Subhadip    |

---

## Phase 4: Performance & Stability (10/11)

| Task                                                            | Assigned To |
| --------------------------------------------------------------- | ----------- |
| Implement SHA-256 caching for embeddings to avoid recomputation | Vibhor      |
| Add batch inference for efficient embedding generation          | Vibhor      |
| Optimize pgvector queries (index tuning, retrieval limits)      | Hritik      |
| Add pagination & virtualized lists for large datasets           | Subin       |
| Implement rate limiting and request validation                  | Vibhor      |
| Add QA test suite (API + React components)                      | Subhadip    |
| Integrate pino logging + metrics dashboard                      | Kamlesh     |
| Conduct load & stress tests for 500+ files                      | Subhadip    |
| Begin minor UI polish and animation refinements                 | Subin       |

---

## Phase 5: Stabilization & Documentation (17/11)

| Task                                                               | Assigned To |
| ------------------------------------------------------------------ | ----------- |
| Conduct full bug sweep and cross-platform testing                  | Subhadip    |
| Review security & privacy (input validation, file size limits)     | Hritik      |
| Write detailed documentation (API docs, developer setup, runbooks) | Kamlesh     |
| Prepare demo dataset for professor review                          | Kamlesh     |
| Package Windows installer (MSI/NSIS)                               | Subin       |
| Create E2E tests covering web + desktop                            | Subhadip    |
| Deploy beta on Vercel (web) and Render (API)                       | Vibhor      |
| Conduct user acceptance testing (UAT)                              | Subhadip    |

---

## Phase 6: Final Submission (24/11)

| Task                                                            | Assigned To |
| --------------------------------------------------------------- | ----------- |
| Deliver production-ready MVP deployment: Vercel + Render + Neon | Vibhor      |
| Create final walkthrough script and demo video                  | Kamlesh     |
| Prepare presentation slides for professor evaluation            | Kamlesh     |
| Submit source code with README and setup guide                  | Vibhor      |
| Provide sample credentials & license keys                       | Kamlesh     |
| Conduct final live demo showcasing full end-to-end flow         | Vibhor      |
