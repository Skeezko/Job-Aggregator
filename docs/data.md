# Data

## Sources

- Public job boards (API and/or scraping)
- Aggregator RSS feeds
- Manual imports (CSV)

## Core entities

- **Job** — title, company, location, remote policy, description, url, posted_at, source
- **Company** — name, domain, size (if known)
- **User** — account, profile, preferences
- **Application** — user ↔ job with status
- **Enrichment** — AI-generated fields attached to a Job (skills, seniority, tags)

## Pipeline

1. **Ingest** — adapters fetch and normalize offers into the Job table.
2. **Deduplicate** — match by canonical URL and fuzzy (title + company).
3. **Enrich** — AI worker attaches structured tags.
4. **Serve** — backend exposes filtered, ranked results to the frontend.

## Retention

- Raw payloads kept 30 days for reprocessing.
- Normalized jobs kept indefinitely, soft-deleted when source removes the posting.
