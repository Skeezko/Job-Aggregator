# ADR 0001 — PostgreSQL + pgvector as the single store

- Status: accepted
- Date: 2026-05-21

## Context
The project needs (a) relational integrity for users, roles, offers, and
saved offers, (b) vector similarity for the AI features (recommendation,
scoring, deduplication), and (c) survival across container restarts. The
brief allows either relational or document storage; it does not allow us to
outsource AI to an external API.

Options considered:
1. PostgreSQL + `pgvector` (one store)
2. PostgreSQL + a dedicated vector DB (Qdrant, Pinecone)
3. MongoDB + a separate vector index
4. SQLite (single-file)

## Decision
Use **PostgreSQL 18** with the **`pgvector`** extension as the single source
of truth. The Compose image is `pgvector/pgvector:pg18`. Vector column is
`vector(384)` matching MiniLM-L12; an `ivfflat` index with
`vector_cosine_ops` and 100 lists powers similarity search.

## Consequences
- Pros:
  - One operational service to monitor.
  - Foreign keys keep `saved_offers`, `refresh_tokens`, and `user_profiles`
    consistent.
  - SQL CHECK + ENUM enforce contract / remote policy / currency at write time.
  - Backend can join filtered offers and similarity results in a single query.
- Cons:
  - `ivfflat` is approximate; very large datasets may want HNSW (not yet GA in
    pgvector at our pinned version).
  - Re-indexing as the dataset grows requires manual `REINDEX`.
- Trade-offs accepted:
  - Slightly less raw vector-search throughput than a dedicated vector DB, in
    exchange for simpler ops and zero dual-write risk.

## Alternatives considered
- **Dedicated vector DB**: another service, another deployment surface; gain
  is marginal at our expected dataset size.
- **MongoDB**: weaker relational guarantees; would still need a separate
  vector index.
- **SQLite**: no concurrent writers from the AI worker and the backend.
