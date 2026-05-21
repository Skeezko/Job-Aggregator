# ADR 0001 — Per-service GitHub Actions workflows on filtered paths

- Status: accepted
- Date: 2026-05-21

## Context
The repository contains three deployable services (backend, frontend,
ai-worker) plus shared infrastructure. The brief mandates GitHub Actions,
automatic runs on PRs and pushes to `main`, and a minimum of build/lint/test
coverage. It also mandates `runs-on: self-hosted`.

A single mega-workflow would rebuild everything on every PR; that wastes
runner time and slows feedback.

## Decision
Split CI into three workflows:
- [`.github/workflows/backend.yml`](../../../.github/workflows/backend.yml)
- [`.github/workflows/frontend.yml`](../../../.github/workflows/frontend.yml)
- [`.github/workflows/ai-worker.yml`](../../../.github/workflows/ai-worker.yml)

Each is filtered by `paths:` so it only fires on changes that affect it.
Inside each workflow, jobs run build + lint + test. The backend job
provisions an ephemeral `pgvector/pgvector:pg18` container, applies every
migration, and runs `cargo test` against it.

## Consequences
- Pros:
  - Feedback time scales with the change size, not the repo size.
  - Each service owns its own pipeline; teams can iterate independently.
  - The ephemeral Postgres step double-checks migrations on every change.
- Cons:
  - Three files to keep in sync if shared steps (e.g., self-hosted setup)
    evolve.
- Trade-offs accepted:
  - A pure-docs change still triggers no CI; we accept the lack of an
    explicit "docs lint" step for now.

## Alternatives considered
- **One monolithic workflow** with conditional jobs: hard to read, slow
  feedback.
- **Matrix workflow** over service names: doesn't help when the test setup is
  fundamentally different per language (Rust + ephemeral Postgres vs.
  Node vs. Python).

## Open compliance item
The current `runs-on: ubuntu-latest` must be reverted to `runs-on:
self-hosted` before final submission, per brief. See
[../../ci.md](../../ci.md) §4.
