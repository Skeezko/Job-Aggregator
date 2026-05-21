# Security

This document maps each brief-mandated security concern to a concrete control
in the codebase and, where applicable, to the deeper ADR that explains the
trade-offs.

## 1. Threat model in one page

| Threat                          | Impact                                                | Primary control                                                       |
| ------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| Credential stuffing / brute force | Account takeover                                    | Rate limit + slow hashing (Argon2id) + reuse detection                |
| Password leak from DB           | Mass takeover                                         | Argon2id + HMAC pepper kept outside DB                                |
| SQL injection                   | Data theft / corruption                               | `sqlx` parameterized queries (compile-checked) + validator crate      |
| Token theft (XSS / browser leak)| Session hijack                                        | HttpOnly + Secure + SameSite=Strict cookie for refresh; short JWT TTL |
| Token replay                    | Persistent hijack                                     | Refresh rotation + reuse detection revokes all sessions               |
| User enumeration                | Targeted attack prep                                  | Identical timing + generic message on login + register                |
| DoS via oversized body          | Resource exhaustion                                   | 4 KB body limit + 10 s timeout                                        |
| Reverse-proxy header spoofing   | Bypass IP-based rate limiting                         | `SmartIpKeyExtractor`; hardening before production                    |
| Information disclosure in errors| Implementation leakage                                | Centralized `AppError` → opaque JSON; internal causes never surfaced  |
| Dependency vulnerability        | Supply-chain compromise                               | Pinned `Cargo.lock`; `cargo audit` is the planned CI step             |

## 2. Brief mandate → implementation

### 2.1 Secret management
- **Why** — Hardcoded secrets are the most common cause of catastrophic leaks.
- **How** — Every secret comes from environment variables loaded by `dotenvy`
  in [`backend/src/main.rs`](../backend/src/main.rs). Compose injects them.
  In-process, secrets are wrapped in `secrecy::Secret<String>` so they don't
  appear in `Debug` output. `.env` is git-ignored; only `.env.example`
  (without values) is committed.
- **Secrets list** — `POSTGRES_PASSWORD`, `JWT_SECRET` (HS256 key, 64 bytes),
  `PEPPER` (32 bytes, HMAC-SHA256 input), `API_KEY` (WeLoveDevs).
- **Trade-off** — `.env` files are convenient but easy to misuse (committed
  by accident). The committed `.env.example` documents how each value must be
  generated (`openssl rand -hex 32` etc.).

### 2.2 Injection protection (at least one type)
- **Why** — SQL injection is the canonical web exploit; even one
  string-concatenated query is a foothold.
- **How** — All queries use `sqlx` macros or `QueryBuilder` with
  `push_bind`, so every variable becomes a bound parameter. The macro form is
  checked against the live schema at compile time; an offline cache
  (`backend/.sqlx/`) lets CI build without DB.
- **Bonus** — Input validation via the `validator` crate (`#[validate(email)]`,
  `#[validate(length(...))]`) at handler boundaries
  ([`backend/src/routes/auth.rs:27`](../backend/src/routes/auth.rs)); password
  strength enforced via `zxcvbn` (rejects weak / personal patterns).
- **Trade-off** — sqlx adds compile-time complexity (need to either have a DB
  or have the cache); we accept this for the static guarantee.

### 2.3 Brute-force mitigation
- **Why** — `/login` and `/register` are obvious targets.
- **How** — Two-tier rate limit via `tower_governor`
  ([`backend/src/layers.rs:25`](../backend/src/layers.rs)):
  - strict — 10 req/s, burst 6, applied to `/login` and `/register`;
  - permissive — 1 req/s, burst 60, applied to `/refresh` and `/logout`.
  Key extractor is `SmartIpKeyExtractor` so each IP is throttled independently.
- **Cost on the server** — Argon2id is intentionally slow (~50 ms per check),
  putting a hard ceiling on guessing speed.
- **Trade-off** — Rate limits live in process memory; resets on container
  restart. Acceptable for the deliverable; would move to Redis at scale.
- Details: [adr/backend/0010-rate-limiting-two-tier.md](./adr/backend/0010-rate-limiting-two-tier.md).

### 2.4 Route / session / token security
- **Why** — Auth-protected routes must be enforceable without the developer
  remembering to add a check; sessions must survive theft attempts.
- **How** —
  - **Route protection**: `AuthUser` implements `FromRequestParts`
    ([`backend/src/security/middleware.rs:18`](../backend/src/security/middleware.rs)).
    Any handler with a `user: AuthUser` parameter is automatically protected.
    Missing this parameter == public route (only `/login`, `/register`, and
    `/refresh` are public).
  - **Access tokens**: HS256 JWT, 15-minute TTL, claims `(sub, role, exp,
    iat, jti)`. Algorithm pinned (`Algorithm::HS256`) to defeat `alg: none`
    forgery
    ([`backend/src/security/middleware.rs:36`](../backend/src/security/middleware.rs)).
  - **Refresh tokens**: 32 random bytes, base64url, sent only in a
    `HttpOnly; Secure; SameSite=Strict` cookie
    ([`backend/src/routes/auth.rs:194`](../backend/src/routes/auth.rs)).
    Stored as SHA-256 hashes in `refresh_tokens` — the DB never sees the raw
    value.
  - **Rotation + reuse detection**: every `/refresh` revokes the presented
    token and issues a new one. If a *revoked* token is presented again, we
    revoke **all** of the user's refresh tokens — symptomatic of theft.
- **Trade-off** — Short JWT TTL means more `/refresh` calls; that is the cost
  of small exposure window.
- Details: [adr/backend/0003-jwt-and-opaque-refresh-tokens.md](./adr/backend/0003-jwt-and-opaque-refresh-tokens.md), [adr/backend/0014-auth-via-from-request-parts.md](./adr/backend/0014-auth-via-from-request-parts.md).

### 2.5 Secure authentication flow
- **Why** — Even with hashes, weak or guessable passwords + naive endpoints
  invite takeover.
- **How** —
  - Password length 12–128, complexity check via `zxcvbn` (rejects score < 3),
    plus literal rejection of email / firstname / lastname substrings.
  - Argon2id hashing with HMAC-SHA256 **pepper** stored outside the DB
    ([`backend/src/security/password.rs`](../backend/src/security/password.rs)).
    Even a full DB dump cannot be cracked offline without `PEPPER`.
  - Timing-safe failure on `/login`: if the user does not exist, we still
    spend the same time computing Argon2 against a fake hash, so response
    time does not leak existence
    ([`backend/src/routes/auth.rs:155`](../backend/src/routes/auth.rs)).
  - On register conflict, we **don't** signal "email already used" — we log
    it server-side and return the same 201 the happy path returns. The
    enumeration vector is closed.
  - Hashing runs on `tokio::task::spawn_blocking` to keep the async runtime
    responsive.
- **Trade-off** — Slow auth (~50–100 ms by design); fast-path optimization is
  not the goal here.
- Details: [adr/backend/0004-argon2id-with-hmac-pepper.md](./adr/backend/0004-argon2id-with-hmac-pepper.md).

### 2.6 Authorization (role-based access control)
- **Why** — Admin actions (moderate offers, list users) must be enforced
  server-side; the frontend cannot be trusted.
- **How** — The user's `role` is part of the JWT claims, propagated into
  `AuthUser`. Admin handlers
  ([`backend/src/routes/admin.rs`](../backend/src/routes/admin.rs)) check
  `user.role != UserRole::Admin` and return 403 otherwise. The role is set
  in the DB; clients cannot escalate via the API.
- **Trade-off** — Inline checks rather than per-route middleware; explicit but
  must be remembered. Compensated by the small number of admin routes.

### 2.7 Data in transit and at rest
- **Why** — Confidentiality and integrity end-to-end.
- **In transit** — Refresh cookie `Secure=true` requires HTTPS. CORS is a
  strict whitelist (`CORS_ALLOWED_ORIGINS`) with `allow_credentials=true`
  ([`backend/src/layers.rs:18`](../backend/src/layers.rs)). Browsers hardened
  via `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`.
- **At rest** — Passwords stored only as Argon2 hashes; refresh tokens only as
  SHA-256 hashes; raw secrets only in env / Compose, never in DB.
- **Trade-off** — TLS termination is the host's responsibility (reverse proxy
  in production); the Compose stack assumes a proxy in front of the backend
  for production deployments.

### 2.8 Custom error middleware + centralized validation
- **Why** — The brief explicitly mentions this as a security and
  maintainability win.
- **How** — Single `AppError` enum
  ([`backend/src/error.rs`](../backend/src/error.rs)) maps every failure to
  `(status, code, message)`. Internal causes (DB, JWT, hash) are collapsed
  into `internal_error`; the original error is logged with `tracing::error!`
  but never sent to the client. Validation happens at handler boundary with
  the `validator` crate; a `ValidationError` becomes a 400 with a clean
  message.
- **Trade-off** — Less helpful error messages on the wire; deliberately so.
- Details: [adr/backend/0006-opaque-and-centralized-error-handling.md](./adr/backend/0006-opaque-and-centralized-error-handling.md).

## 3. Observability for forensics

- Each request gets an `x-request-id` (UUID v4) at the edge
  ([`backend/src/layers.rs:50`](../backend/src/layers.rs)), included in the
  response and every log line for that request.
- Auth failures log `ip`, `email`, and reason at `warn` level.
- See [adr/backend/0012-observability-request-correlation.md](./adr/backend/0012-observability-request-correlation.md).

## 4. Known gaps / future work

| Gap                                                | Plan                                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------------- |
| Proxy header trust is naive                        | Add `TRUST_PROXY_HEADERS` flag + IP whitelist before going to production    |
| `cargo audit` job not yet in CI                    | Add as a separate workflow                                                  |
| Rate-limit state in-memory only                    | Move to Redis if we deploy more than one backend replica                    |
| No GDPR-style account deletion endpoint            | Add `DELETE /users/me` with cascading deletes (FK already supports it)      |

## 5. Incident response

On suspected breach:
- Rotate `PEPPER` and `JWT_SECRET` (forces re-login of every user).
- `UPDATE refresh_tokens SET revoked_at = NOW()` to revoke active sessions.
- Audit logs by `request_id`, `ip`, `user_id`.
- Notify affected users (GDPR 72-hour window).
- Post-mortem; if architectural, file a new ADR.
