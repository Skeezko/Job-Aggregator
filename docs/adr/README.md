# Architecture Decision Records (ADRs)

Each significant architectural decision is recorded as a numbered, one-page
Markdown file. The format follows the standard from
[adr.github.io](https://adr.github.io).

## Format

```
NNNN-short-title.md
```

Template:

```markdown
# NNNN - Short title

- Status: proposed | accepted | superseded
- Date: YYYY-MM-DD

## Context
What problem are we solving? What constraints apply?

## Decision
What did we choose, in one or two sentences?

## Consequences
- Pros:
- Cons:
- Trade-offs accepted:

## Alternatives considered
Brief mention of the options we rejected and why.
```

## Index

### Backend (Rust + Axum)

- [0001 — Rust and Axum for the backend](./backend/0001-rust-and-axum-for-backend.md)
- [0002 — sqlx over an ORM](./backend/0002-sqlx-over-orm.md)
- [0003 — JWT access + opaque refresh tokens](./backend/0003-jwt-and-opaque-refresh-tokens.md)
- [0004 — Argon2id + HMAC pepper for passwords](./backend/0004-argon2id-with-hmac-pepper.md)
- [0005 — Backend as exclusive DB gateway](./backend/0005-backend-as-exclusive-db-gateway.md)
- [0006 — Opaque, centralized error handling](./backend/0006-opaque-and-centralized-error-handling.md)
- [0007 — Body-size limit](./backend/0007-body-size-limit.md)
- [0008 — Security headers](./backend/0008-security-headers.md)
- [0009 — CORS strict whitelist](./backend/0009-cors-strict-whitelist.md)
- [0010 — Two-tier rate limiting](./backend/0010-rate-limiting-two-tier.md)
- [0011 — Client IP extraction](./backend/0011-client-ip-extraction.md)
- [0012 — Observability + request correlation](./backend/0012-observability-request-correlation.md)
- [0013 — Compression + timeout](./backend/0013-compression-and-timeout.md)
- [0014 — Auth via `FromRequestParts`](./backend/0014-auth-via-from-request-parts.md)
- [0015 — Security module at the crate root](./backend/0015-security-module-crate-root.md)
- [0016 — Middleware composition with `ServiceBuilder`](./backend/0016-middleware-composition-service-builder.md)

### Data

- [0001 — PostgreSQL + pgvector as single store](./data/0001-postgres-and-pgvector.md)
- [0002 — Raw payload kept in `offers.raw` JSONB](./data/0002-jsonb-raw-payload.md)
- [0003 — Idempotent upsert on `(source, source_id)`](./data/0003-upsert-on-source.md)

### AI

- [0001 — Separate Python AI worker](./ai/0001-separate-python-ai-worker.md)
- [0002 — Multilingual MiniLM embeddings](./ai/0002-minilm-multilingual-embeddings.md)
- [0003 — Hybrid semantic + lexical scoring](./ai/0003-hybrid-scoring.md)

### Frontend

- [0001 — Next.js 16 App Router](./frontend/0001-nextjs-app-router.md)

### CI

- [0001 — Per-service workflows on filtered paths](./ci/0001-per-service-workflows.md)
