# ADR 0015: Security Module Promoted to Crate Root

## Context
Initially, JWT generation and password hashing lived under `routes/security/`. As we added the `AuthUser` extractor, this organization became misleading: security primitives (JWT, hashing, authentication middleware) are not specific to any route — they are utilities consumed by handlers across the codebase.

## Decision
We moved the security module from `src/routes/security/` to `src/security/` at the crate root. The module now contains:
* `jwt.rs` — access and refresh token generation.
* `password.rs` — Argon2id hashing with pepper.
* `middleware.rs` — the `AuthUser` extractor.

`UserRole` remains in `routes/auth.rs` (where it was originally defined and where the `RegisterForm`/`LoginForm` DTOs live) to avoid a disruptive migration; it is imported by `security/jwt.rs` and `security/middleware.rs`. A future ADR may revisit this.

## Consequences
* **Pros:**
  * **Clear Responsibility:** `routes/` contains HTTP handlers only; `security/` contains reusable auth primitives.
  * **Natural Import Paths:** Future business modules (`routes/offers.rs`, `routes/dashboard.rs`) import `use crate::security::middleware::AuthUser` directly, without traversing `routes/`.
  * **Reuse-Friendly:** The `security/` module could be lifted into a shared workspace crate if we ever split the backend.
* **Cons:**
  * Minor coupling: `security/` imports `UserRole` from `routes/auth.rs`, which is technically a downward dependency. Accepted for now as a low-cost compromise.
