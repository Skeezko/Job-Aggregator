# AI worker

Asynchronous enrichment pipeline for job data.

## Responsibilities

- Consume enrichment tasks dispatched by the backend
- Call LLMs / ML models to extract skills, seniority, remote policy
- Write structured enrichments back to the database
- Maintain evaluation datasets and metrics

## Layout

```
ai-worker/
├── Dockerfile
├── src/        # worker & prompt code
├── data/       # datasets, fixtures, eval sets
└── tests/      # unit tests + golden prompt tests
```

## Local dev

```bash
docker compose up ai-worker
```

Model provider keys are read from environment variables (see `.env.example`).
