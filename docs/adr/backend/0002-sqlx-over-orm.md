# ADR 0002: Use sqlx over ORMs (Diesel/Prisma)

## Status
Accepted

## Context
We need a way to interact with our PostgreSQL database. We evaluated heavy ORMs like Diesel or Prisma Client Rust versus the lightweight async query builder `sqlx`.

## Decision
We decided to use `sqlx`.

## Consequences
* **Pros:** * Queries are written in pure SQL, making them highly optimized and easy to debug.
  * Queries are validated at compile-time against the live database, preventing runtime SQL errors.
  * Full control over database migrations (`init.sql`).
* **Cons:** * Requires writing raw SQL instead of using programmatic Rust structs for complex queries.
  * Slower compilation times due to the compile-time database checks.