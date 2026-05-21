# Continuous Integration

The brief requires GitHub Actions, automatic runs on PRs and pushes to `main`,
and at least build / lint / tests covering **two backend API routes** and
**one data normalization function**. Each service has its own workflow so a
change in one area does not rebuild the others.

## 1. Workflows

| File                                            | Triggers                                                     | Jobs                                       |
| ----------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------ |
| [`.github/workflows/backend.yml`](../.github/workflows/backend.yml)       | push to `main`, PRs touching `backend/**`                | fmt check, clippy, build, test against ephemeral Postgres |
| [`.github/workflows/frontend.yml`](../.github/workflows/frontend.yml)     | push to `main`, PRs touching `frontend/**`               | npm install, lint, type-check, build       |
| [`.github/workflows/ai-worker.yml`](../.github/workflows/ai-worker.yml)   | push to `main`, PRs touching `ai-worker/**`              | venv install, ruff lint, pytest             |

Paths-filtered triggers mean a frontend-only PR does not spend minutes
building Rust; concurrency on `backend-ci` cancels superseded runs of the
backend pipeline (but not the others).

## 2. What each pipeline checks

### 2.1 Backend (`backend.yml`)
1. **Rust cache** — `Swatinem/rust-cache@v2` reuses `target/` and the
   registry across runs.
2. **Ephemeral Postgres** — starts `pgvector/pgvector:pg18` as a Docker
   container, waits for `pg_isready`, applies every migration in
   `backend/migrations/`. This catches broken migrations and guarantees
   the test schema matches production.
3. **`cargo fmt --all -- --check`** — code style.
4. **`cargo clippy --all-targets`** — lints (treated as build break).
5. **`cargo build --verbose`** — full compile.
6. **`cargo test --verbose`** — backend test suite (sqlx queries are checked
   against the live Postgres because the offline cache is enforced via
   `SQLX_OFFLINE=true`).
7. Always tears down the Postgres container.

### 2.2 AI worker (`ai-worker.yml`)
1. **Python venv** + install pinned `requirements.txt`, plus `ruff` and
   `pytest`.
2. **`ruff check src/ tests/`** — lint.
3. **`pytest tests/`** — covers:
   - `tests/test_normalize.py` → the required **data normalization function**;
   - `tests/test_recommend.py`, `test_scoring.py`, `test_deduplicate.py`,
     `test_load.py` → the AI feature surface.

### 2.3 Frontend (`frontend.yml`)
1. `npm ci` — exact `package-lock.json` install.
2. `npm run lint` — ESLint.
3. `npm run type-check` — `tsc --noEmit`. Important because the frontend pins
   Next.js 16, whose types diverge from earlier majors.
4. `npm run build` — Next.js production build.

## 3. Coverage of the brief's minimum

| Brief asks                                | Where it lives                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Build checks                              | `cargo build` (backend), `npm run build` (frontend), `pip install` (ai-worker)                  |
| Lint / quality checks                     | `cargo fmt`, `cargo clippy`, `npm run lint`, `npm run type-check`, `ruff check`                 |
| Tests on ≥ 2 backend API routes           | Backend `tests/` (see open follow-up — currently empty; see §5)                                  |
| Test on ≥ 1 data normalization function   | `ai-worker/tests/test_normalize.py`                                                              |

## 4. Runner strategy

> **⚠ Compliance note.** The project brief states:
> *"All GitHub Actions workflows must specify `runs-on: self-hosted`."*
>
> The current workflows use `runs-on: ubuntu-latest`. This was a temporary
> switch (commit `3ec0370`) to unblock CI while a self-hosted runner is being
> stood up. **Before final submission**, every workflow must be reverted to
> `runs-on: self-hosted`. The job definitions are otherwise unchanged, so the
> flip is a single-line edit per file.

### Why / How / Trade-off

- **Why self-hosted (per brief)** — Faster runs, no public minute quota, full
  control over the build environment.
- **How** — Replace `runs-on: ubuntu-latest` with `runs-on: self-hosted` in
  all three workflows; ensure the runner has Docker (for the Postgres
  container in the backend job), Rust 1.95, Node 22, Python 3.12 available.
- **Trade-off** — Self-hosted runners require maintenance (security updates,
  disk pressure). The brief's evaluation explicitly requires this trade-off.

## 5. Known follow-ups

| Item                                                       | Notes                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `backend/tests/` is currently empty                        | Add integration tests for two routes (e.g. `/login` and `/offers`) using sqlx + axum's `oneshot` |
| Restore `runs-on: self-hosted` before submission           | See §4                                                                  |
| Add `cargo audit` job                                      | Optional but cheap; surfaces vulnerable dependencies                    |
| Add Lighthouse / axe accessibility audit to frontend job   | Brief asks for at least one automated audit; can run on the built Next.js artifact |
| Wire Compose validation as a smoke job (`docker compose config`) | Catches typos and missing variables in `docker-compose.yml`         |

## 6. Repository hygiene (brief requirements)

- Frequent, descriptive commits (visible via `git log`).
- Clean structure — services live under `backend/`, `frontend/aggregator/`,
  `ai-worker/`; documentation under `docs/`.
- No large binaries — `.gitignore` rules out `target/`, `node_modules/`,
  `.venv/`, model caches.
- Setup and run docs — top-level [`README.md`](../README.md) gives the one-liner;
  per-service `README.md` adds details where needed.
