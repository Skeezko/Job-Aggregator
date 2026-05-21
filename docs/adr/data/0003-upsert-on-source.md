# ADR 0003 — Idempotent upsert on `(source, source_id)`

- Status: accepted
- Date: 2026-05-21

## Context
Ingestion runs on demand and is expected to be repeated regularly. The same
offer must end up as a single row, identified consistently across runs, so
that:
- counters in `ingestion_runs` mean what they say,
- foreign keys (e.g. `saved_offers.offer_id`) keep pointing at the same row
  even if WeLoveDevs edits the offer.

Options considered:
1. Delete + insert all offers per run.
2. Upsert on `(source, source_id)`.
3. Upsert with content hash as the key.

## Decision
Use `INSERT … ON CONFLICT (source, source_id) DO UPDATE` with a `RETURNING
(xmax = 0) AS inserted` clause to split the counters.

## Consequences
- Pros:
  - UUID primary keys remain stable; FKs from `saved_offers` keep working.
  - Idempotent: re-running ingestion does not duplicate data.
  - `xmax = 0` cleanly separates inserts from updates without an extra query.
- Cons:
  - We must remember to add new columns to *both* the `INSERT` list and the
    `DO UPDATE SET` clause.
- Trade-offs accepted:
  - Slightly more verbose SQL in `load.py` in exchange for safe re-runs.

## Alternatives considered
- **Delete + insert**: would break foreign keys; users would lose bookmarks
  on every ingestion.
- **Content hash key**: a typo or whitespace change would create a duplicate;
  the partner's `source_id` is the right identity.
