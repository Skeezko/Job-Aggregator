# Architecture

## 1. High-level shape

```
                +---------------------+
                |    Frontend         |  Next.js 16 (React 19)
                |    (port 3000)      |
                +----------+----------+
                           |  HTTPS / JSON
                           v
                +---------------------+
                |    Backend API      |  Rust + Axum
                |    (port 8080)      |  JWT + opaque refresh
                +----+----------+-----+
                     |          |
              SQL    |          |  SQL
                     v          v
                +---------------------+
                |   PostgreSQL 18     |  with pgvector
                |    (port 5434)      |  source of truth
                +----------+----------+
                           ^
                           |   batch upsert / read
                +----------+----------+
                |   AI worker         |  Python 3.12, on-demand profile
                |   (one-shot job)    |  WeLoveDevs ingestion + embeddings
                +---------------------+
```

Source: [`docker-compose.yml`](../docker-compose.yml).

## 2. Services

| Service     | Tech                        | Responsibility                                              |
| ----------- | --------------------------- | ----------------------------------------------------------- |
| `frontend`  | Next.js 16, React 19, Tailwind | UI: auth, dashboard, search, offer details, admin        |
| `backend`   | Rust 1.95, Axum 0.8, sqlx   | REST API, auth, authorization, DB gateway                   |
| `ai-worker` | Python 3.12, sentence-transformers, psycopg2 | Ingest, normalize, embed, upsert; recommend/score/dedup    |
| `db`        | `pgvector/pgvector:pg18`    | Persistence; vector index for similarity                    |

The AI worker is declared under the `jobs` Compose profile, so it runs only
when invoked (one-shot ingestion), not continuously. See
[data.md](./data.md) for the manual trigger procedure.

## 3. Request flow

```
Browser ──login──▶ /login                ──┐
                                           │   sets refresh_token (cookie)
        ◀──access_token + cookie───────────┘   returns access_token (JSON)

Browser ──GET /offers?contract_type=internship──▶ Backend
                                                  │  AuthUser extractor decodes JWT
                                                  ▼
                                                Postgres (filtered SQL)
                                                  │
                                                  ▼
                                                JSON response
```

- Access tokens: short-lived JWT (HS256, 15 min) in `Authorization: Bearer`
  header (`backend/src/security/jwt.rs:21`).
- Refresh tokens: 32-byte random, hashed (SHA-256) in DB, sent as HttpOnly +
  Secure + SameSite=Strict cookie (`backend/src/routes/auth.rs:194`). Rotation
  on every refresh; reuse detection revokes all sessions of the user.
- Authorization extractor: `AuthUser` implements `FromRequestParts`, so any
  handler that takes `user: AuthUser` is automatically protected
  (`backend/src/security/middleware.rs:18`). Admin routes check
  `user.role != UserRole::Admin` explicitly.

## 4. Data flow (ingestion)

```
WeLoveDevs API  ──fetch_page (1 req/s)──▶ ai-worker/etl/data_api.py
                                              │
                                              ▼
                                       normalize_offer (Pydantic NormalizedOffer)
                                              │
                                              ▼
                                       upsert_offers (ON CONFLICT source+source_id)
                                              │
                                              ▼
                                       Postgres (offers table; embedding nullable)
                                              │
                                  (later async) embedding compute + UPDATE
```

See [data.md](./data.md) and [ai.md](./ai.md).

## 5. Why / How / Trade-off for the main choices

### 5.1 Rust + Axum for the backend
- **Why** — Memory safety, predictable performance, strong type system; the
  brief stresses realistic technical constraints and clear product choices.
- **How** — Axum extractors (`State`, `Json`, `AuthUser`) keep handlers small
  and testable; sqlx gives compile-time SQL checking against the live schema
  (offline cache in `.sqlx/` for CI without DB).
- **Trade-off** — Slower compile times; steeper learning curve. Documented in
  [adr/backend/0001-rust-and-axum-for-backend.md](./adr/backend/0001-rust-and-axum-for-backend.md).

### 5.2 PostgreSQL + pgvector as a single store
- **Why** — One source of truth simplifies operations and avoids dual-write
  bugs. Vector search is needed for AI features (recommend, score, dedup);
  pgvector keeps it in-database.
- **How** — `vector(384)` column on `offers`, `ivfflat` index with cosine
  ops (`backend/migrations/002_offers.sql:67`). Embeddings are computed by the
  AI worker and written back into the same table.
- **Trade-off** — pgvector's `ivfflat` requires re-indexing as the data grows;
  not as fast as a dedicated vector DB at scale, but sufficient for the
  expected dataset. Documented in
  [adr/data/0001-postgres-and-pgvector.md](./adr/data/0001-postgres-and-pgvector.md).

### 5.3 Separate AI worker process (Python) instead of in-backend AI
- **Why** — Embedding models live in the Python ML ecosystem
  (`sentence-transformers`). Embedding inside the Rust process would force a
  bindings detour and bloat the backend image.
- **How** — `ai-worker` reads/writes Postgres directly; backend never imports
  the model. Worker runs on demand (`profiles: ["jobs"]`).
- **Trade-off** — Two languages to maintain; backend cannot synchronously
  invoke "embed this string". For the brief's scope (batch ingestion +
  precomputed embeddings), this trade-off is acceptable. Documented in
  [adr/ai/0001-separate-python-ai-worker.md](./adr/ai/0001-separate-python-ai-worker.md).

### 5.4 Next.js 16 + Tailwind for the frontend
- **Why** — SSR/SSG out of the box, file-based routing, mature TypeScript
  story; Tailwind for fast, consistent styling.
- **How** — App Router under `frontend/aggregator/app/`; pages cover auth
  (`login/`, `register/`), `dashboard/`, `offers/`, `offers/[id]/`,
  `bookmarks/`, `admin/`.
- **Trade-off** — Next 16 introduces breaking API changes from earlier
  versions; the frontend pins exact versions (`next 16.2.4`, `react 19.2.4`)
  and runs `tsc --noEmit` in CI to catch drift. Documented in
  [adr/frontend/0001-nextjs-app-router.md](./adr/frontend/0001-nextjs-app-router.md).

## 6. Rejected architectural alternatives

| Alternative                                  | Why rejected                                                                                       |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Node.js / Express backend                    | Brief stresses realistic constraints; we wanted memory safety, strict typing, and stronger SQL story |
| ORM (Diesel, SeaORM) instead of sqlx         | Compile-time SQL checking gives us real query validation against the schema; ORMs hide that        |
| Dedicated vector DB (Qdrant, Pinecone)       | One more service for marginal benefit at our scale; pgvector covers the brief                       |
| Calling an external LLM API                  | Forbidden by the brief ("not allowed to outsource the AI feature to a model API you do not control") |
| Microservices split (separate auth service)  | Premature for a 4-service stack; would only add network hops and devops cost                       |

## 7. Project layout

```
backend/        Rust API (Axum, sqlx, JWT)
  migrations/   SQL migrations applied at boot
  src/
    routes/     auth, offers, users, admin
    security/   JWT, password, AuthUser middleware
    models/     offer, user, pagination
ai-worker/      Python ETL + embeddings
  src/
    etl/        data_api (WeLoveDevs client), normalize, load, pipeline
    ai/         backbone (model loader), deduplicate, recommend, scoring
  tests/        pytest unit tests
frontend/
  aggregator/   Next.js 16 app
docs/           This documentation
.github/
  workflows/    backend.yml, frontend.yml, ai-worker.yml
docker-compose.yml
```

## 8. Cross-cutting concerns

- **Configuration** — All secrets and per-environment values come from `.env`
  (see `.env.example`); nothing is hardcoded. Compose injects them into each
  service. See [security.md](./security.md).
- **Observability** — Backend uses `tracing` with `EnvFilter`; each request
  gets an `x-request-id` (propagated in response). See
  [adr/backend/0012-observability-request-correlation.md](./adr/backend/0012-observability-request-correlation.md).
- **Errors** — Backend has a centralized `AppError` enum that maps to JSON
  bodies with `code` + `message`, never leaking internals
  (`backend/src/error.rs`).
- **CI** — Per-service workflows under `.github/workflows/`. See
  [ci.md](./ci.md).
