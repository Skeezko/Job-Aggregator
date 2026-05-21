# Data

## 1. Source: WeLoveDevs (mandatory)

WeLoveDevs is the required data source for this project (Epitech partnership).
The integration uses the official API at `https://epi-api.welovedevs.com/v1`,
authenticated with an `X-API-Key` header.

- Client: [`ai-worker/src/etl/data_api.py`](../ai-worker/src/etl/data_api.py)
- API key: read from `API_KEY` env var, never hardcoded (see
  [`.env.example`](../.env.example) and [security.md](./security.md))
- Pagination: `size=50` per page; the client follows `values` until an empty
  page is returned
- **Rate limit handling**: `time.sleep(1)` between pages
  ([`data_api.py:55`](../ai-worker/src/etl/data_api.py)) — matches the
  partner's "1 request/second/student" rule. **Why** explicit sleep instead
  of a token bucket: the ingestion is a batch one-shot, so a hard pause is
  simpler and impossible to misuse; **trade-off** is slightly slower full
  sync, which is acceptable since ingestion is manually triggered.

Adding more sources is **optional** per the brief. None is wired today; the
adapter shape (`fetch_all() -> list[dict]` + a `normalize_*` function) leaves
room to add one without changing downstream code.

## 2. Schema (source of truth: SQL migrations)

The database schema lives in [`backend/migrations/`](../backend/migrations).
Migrations are applied at backend startup
([`backend/src/main.rs:30`](../backend/src/main.rs)).

### 2.1 Tables

| Table             | Purpose                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| `users`           | Accounts (email, hashed password, firstname, lastname, role)               |
| `refresh_tokens`  | Opaque refresh tokens (hashed), per user, with device + IP + expiry        |
| `offers`          | Normalized offers from WeLoveDevs (+ raw JSONB, embedding vector(384))     |
| `user_profiles`   | Skills, desired role, experience, location preferences (for AI scoring)    |
| `saved_offers`    | User → offer bookmarks with optional notes                                 |
| `ingestion_runs`  | Audit of each ingestion: counts, timings, status, error message            |

### 2.2 Required offer fields (brief vs. schema)

| Brief requires | Schema column                                | Notes                                     |
| -------------- | -------------------------------------------- | ----------------------------------------- |
| title          | `offers.title`                               | CHECK length 1..500                       |
| company        | `offers.company`                             | nullable (WeLoveDevs may omit)            |
| location       | `offers.location_city`, `location_country`   | parsed from `formattedPlaces`             |
| contract type  | `offers.contract_type` (ENUM)                | internship/apprenticeship/full_time/freelance/unknown |
| date           | `offers.posted_at`                           | parsed from `publishDate` (µs timestamp)  |
| description    | `offers.description`                         | CHECK length 1..50000                     |
| salary         | `offers.salary_min`, `salary_max`, `salary_currency` | yearly recurrence is × 1000        |

`raw` (JSONB) keeps the original payload so we can reprocess without re-fetching.

### 2.3 Data integrity constraints

- `UNIQUE (source, source_id)` on `offers` → idempotent upserts
- `CHECK (length(title) BETWEEN 1 AND 500)` and similar on description
- `CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)`
- `CHECK (salary_currency ~ '^[A-Z]{3}$')` (ISO 4217)
- Email format `CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')` on `users`
- `ON DELETE CASCADE` from `users` → `refresh_tokens`, `saved_offers`, `user_profiles`
- Roles modelled as an ENUM type (`user_role`), not free text

### 2.4 Persistence

Postgres data is mounted on the named volume `postgres_data`
([`docker-compose.yml:11`](../docker-compose.yml)), so it survives container
restart and `docker compose down` (but not `docker compose down -v`, which is
the standard reset).

## 3. Ingestion pipeline

```
   ┌──────────────────────────┐
   │ run_ingestion (manual)   │
   └────────────┬─────────────┘
                ▼
   WeLoveDevsClient.fetch_all()        ← 1 req/s, paginated
                │
                ▼
   normalize_offer(raw)                ← contract/remote/location/salary/date
                │  raises ValueError if title or description missing
                ▼
   list[NormalizedOffer]               ← Pydantic model, strict types
                │
                ▼
   upsert_offers(...)                  ← ON CONFLICT (source, source_id) DO UPDATE
                │
                ▼
   offers table                        ← embedding column initially NULL
                │
                ▼
   (later) AI worker computes
   embedding and UPDATEs the row
```

Entry point: [`ai-worker/src/etl/pipeline.py`](../ai-worker/src/etl/pipeline.py).

### 3.1 Normalization rules

[`normalize.py`](../ai-worker/src/etl/normalize.py) handles:

- **Contract type** — case-insensitive mapping; `permanent|cdi|fulltime` →
  `full_time`, `stage` → `internship`, `alternance` → `apprenticeship`,
  unknown → `unknown`.
- **Remote policy** — reads `details.remotePolicy.frequency`; `full|fulltime`
  → `remote`, `partial` → `hybrid`, `none` → `onsite`.
- **Salary** — `details.salary.{min,max,currency,recurrence}`; if
  `recurrence == "year"` the API returns values in k€ so we multiply by 1000.
  Currency symbols (`€$£`) are normalized to ISO codes.
- **Location** — `formattedPlaces` (list[str]); one item → country only, more
  → first is city, last is country.
- **Dates** — accepts microsecond Unix timestamps, ISO strings, or `datetime`.
- **Validation** — empty title or description raises and the offer is skipped
  with a warning; `errors` count is reported.

## 4. Manual trigger (mandatory per brief)

The brief requires an on-demand trigger for ingestion. Today it runs as a
one-shot container under the `jobs` Compose profile:

```bash
docker compose --profile jobs run --rm ai-worker
```

This starts a fresh container that runs
`python -m src.etl.pipeline` (the Dockerfile's `CMD`), which calls
`run_ingestion()`. Database connectivity is wired through env vars from
`.env`. The job exits when the run is complete and writes counters to logs:

```
Fetched N raw offers
Normalized M offers (E errors)
DB: inserted=I, updated=U
```

The `ingestion_runs` table is the place to record those counts persistently
(structure already in place via migration 002; wiring from the worker is a
documented follow-up).

## 5. Why / How / Trade-off for the main choices

### 5.1 Raw payload kept in `offers.raw` (JSONB)
- **Why** — Reprocess if we change normalization rules; debug surprising values
  without re-hitting the API.
- **How** — JSONB column, full row preserved on upsert.
- **Trade-off** — Larger table size; mitigated by Postgres' TOAST compression.

### 5.2 Upsert on `(source, source_id)` instead of delete+insert
- **Why** — Preserves UUID primary keys, so foreign keys from `saved_offers`
  remain valid across ingestions.
- **How** — `ON CONFLICT (source, source_id) DO UPDATE SET …` in
  [`load.py:24`](../ai-worker/src/etl/load.py); `xmax = 0` discriminates
  inserts from updates for counters.
- **Trade-off** — A user who saved an offer keeps the bookmark even if
  WeLoveDevs edits the title; that is the desired behavior.

### 5.3 Hard sleep for rate limit
- **Why** — 1 req/s/student is a partner-imposed limit; missing it gets us
  blocked.
- **How** — `time.sleep(1)` between pages in the client.
- **Trade-off** — Sequential, slower than a parallel client; the brief's data
  volume makes this irrelevant in practice.

### 5.4 No automatic schedule (manual trigger only)
- **Why** — Brief explicitly says "manual trigger on demand". Avoids surprise
  load on the partner API.
- **How** — Compose profile keeps the worker dormant by default.
- **Trade-off** — Stale data between manual runs; the admin role is expected
  to trigger ingestion on a cadence.

## 6. Rejected data alternatives

| Alternative                                  | Why rejected                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| MongoDB / document store                     | Relational integrity (FK, ENUMs, CHECK) is a better fit for offers+users     |
| Store embeddings in a separate vector DB     | Adds an extra service for marginal benefit; pgvector covers the brief        |
| Delete + reinsert offers on each ingestion   | Would break foreign keys from `saved_offers`                                  |
| Real-time webhook subscription               | WeLoveDevs API is polled; webhooks are out of scope for this partnership     |
