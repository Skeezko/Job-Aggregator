# ADR 0002 — Raw payload kept in `offers.raw` (JSONB)

- Status: accepted
- Date: 2026-05-21

## Context
The WeLoveDevs API returns a richer payload than our normalized schema can
hold (technologies, custom fields, free-form descriptions, etc.). We also
expect to evolve our normalization rules; today's mapping for, say,
`remotePolicy` may need to change.

If we only keep the normalized projection, reprocessing requires re-fetching
the whole API — costly, slow, and bound to the 1 req/s rate limit.

## Decision
Persist the full original payload alongside the normalized columns in a
`JSONB raw NOT NULL` column on `offers`.

## Consequences
- Pros:
  - Re-running normalization is a single `UPDATE … FROM offers, raw`; no
    network calls.
  - Easy to debug normalization bugs by querying `raw` directly.
  - Future features can pick up fields we don't expose today without a
    migration.
- Cons:
  - Table size grows (mitigated by Postgres TOAST compression).
  - JSONB lookups are slower than column access (acceptable; we mostly read
    normalized columns).
- Trade-offs accepted:
  - Storage overhead in exchange for reproducibility and debuggability.

## Alternatives considered
- **Drop `raw` after ingestion**: cheaper on disk but forces an API re-fetch
  for any reprocessing.
- **Store `raw` in a separate table joined by FK**: more JOINs and no real
  upside; JSONB on the same row is fine.
