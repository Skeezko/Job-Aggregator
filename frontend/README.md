# Frontend

Web dashboard for the job aggregator.

## Responsibilities

- Render the job feed, detail, saved, applications, and profile views
- Talk only to the backend API
- Handle auth flows (login, session refresh)

## Layout

```
frontend/
├── Dockerfile
├── src/        # application code
└── tests/      # unit & e2e tests
```

## Local dev

```bash
docker compose up frontend
```

API base URL is read from the `API_URL` environment variable.
