# Job Aggregator

Aggregated job-search platform that collects offers from multiple sources, enriches them with AI, and presents them through a unified dashboard.

## Stack

- **Backend** — API service (see `backend/`)
- **Frontend** — Web dashboard (see `frontend/`)
- **AI Worker** — Enrichment / classification pipeline (see `ai-worker/`)
- **Database** — Schema and migrations (see `database/`)

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

## Documentation

See [`docs/`](./docs) for product, architecture, data, AI, security, CI, and dashboard docs.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).
