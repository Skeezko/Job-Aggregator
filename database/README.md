# Database

PostgreSQL schema and migrations.

## Layout

```
database/
├── README.md
└── migrations/   # ordered SQL migration files
```

## Conventions

- Migration filenames are prefixed with a zero-padded sequence: `0001_initial.sql`, `0002_add_applications.sql`, ...
- Migrations are forward-only. A rollback is a new migration.
- `docker-compose` mounts `migrations/` into the Postgres init directory for local bootstrap.

## Applying migrations

For development the database container applies `migrations/` on first start.
For production, use the migration runner defined by the backend service (TBD).
