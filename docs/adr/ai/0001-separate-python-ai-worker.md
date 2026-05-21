# ADR 0001 — Separate Python AI worker

- Status: accepted
- Date: 2026-05-21

## Context
The brief requires one lightweight AI feature, locally hosted, ≤ 500 MB on
disk, < 5 s per offer, no external API. The backend is Rust + Axum.

Practical options:
1. Embed the model inside the Rust backend (via `candle`, `tch`, or FFI to
   ONNX runtime).
2. Run a separate Python service that talks to Postgres directly.
3. Run a separate Python service exposed as an HTTP microservice and called
   by the backend.

## Decision
Run the AI as a **separate Python container** (`ai-worker`) that:
- reads and writes Postgres directly (the same store the backend uses),
- runs on demand (`profiles: ["jobs"]` in Compose), not continuously.

The `sentence-transformers` ecosystem is Python-native. The worker performs
ingestion + embedding in one process and exposes its results to the user
through the data already in the DB.

## Consequences
- Pros:
  - Uses the most mature embedding ecosystem (HuggingFace).
  - Backend image stays small and fast to build.
  - Failure of the model loader cannot crash the API.
- Cons:
  - Two languages to maintain.
  - The backend cannot synchronously ask the worker to "embed this string"
    without an RPC, so embeddings are computed in batch and read precomputed.
- Trade-offs accepted:
  - No real-time embedding on user-typed queries; we use the user profile
    (skills, desired role) which already exists, and the recommendation runs
    on the worker side when needed.

## Alternatives considered
- **Embed in Rust** (`candle` / `tch`): possible but the multilingual MiniLM
  weights are not first-class in those ecosystems; tooling for tokenizer
  parity is fragile.
- **HTTP microservice (FastAPI) called by the backend**: more moving parts;
  the brief asks for a *manual trigger*, not a synchronous user call, so the
  direct-DB approach matches the actual usage pattern.
