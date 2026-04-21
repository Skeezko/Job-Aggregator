# Backend

API service for the job aggregator.

## Responsibilities

- Expose the public API consumed by the frontend
- Orchestrate ingestion from external job sources
- Persist data to the database
- Dispatch enrichment jobs to the AI worker

## Layout

```
backend/
├── Dockerfile
├── src/        # application code
└── tests/      # unit & integration tests
```

## Local dev

```bash
docker compose up backend
```

Environment variables live in the root `.env` (see `.env.example`).
