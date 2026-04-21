# Architecture

## High-level components

```
+-----------+      +-----------+      +-------------+
| Frontend  | <--> |  Backend  | <--> |  Database   |
+-----------+      +-----------+      +-------------+
                        ^                   ^
                        |                   |
                   +---------+              |
                   | AI      |--------------+
                   | worker  |
                   +---------+
```

- **Frontend** — web dashboard served to end users.
- **Backend** — REST/GraphQL API, auth, business logic, ingestion orchestration.
- **AI worker** — async enrichment jobs (skill extraction, tagging, matching).
- **Database** — PostgreSQL, source of truth for jobs, users, events.

## Deployment

Dockerized services orchestrated with `docker-compose` locally; production target TBD (see ADRs).

## Cross-cutting concerns

- Logging and metrics: centralized
- Config via environment variables (`.env`)
- Secrets never committed (see `security.md`)
