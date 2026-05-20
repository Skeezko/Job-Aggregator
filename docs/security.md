# Security

This document describes the security principles and threat model for the jobaggr backend. Specific architectural decisions are documented in `docs/adr/`.

## Principles

- Least privilege for every service account
- Secrets in environment variables or a vault, never in git
- All external traffic over TLS (production)
- Defense in depth: multiple independent layers of protection

## Threat model

### Account takeover
- Passwords hashed with **Argon2id + HMAC-SHA256 pepper** (see ADR 0004)
- Two-tier rate limiting on auth routes (see ADR 0010): strict 6/min on `/login` and `/register`
- Refresh token rotation with reuse detection (see ADR 0003): a single reused token invalidates all user sessions
- JWT access tokens with strict `Algorithm::HS256` pinning to prevent the `alg: none` forgery attack (see ADR 0014)

### Injection
- All SQL queries parameterized via `sqlx` macros, validated against the live database at compile-time (see ADR 0002)
- Input validation on API boundaries via the `validator` crate (length, email format)
- Password strength enforced via `zxcvbn` to reject common and personal patterns

### Scraping & abuse
- Rate limiting via tower-governor with per-IP keying through `SmartIpKeyExtractor` (see ADR 0010, 0011)
- Body size limit aligned on memory pages (4 KB) to prevent DoS via oversized payloads (see ADR 0007)
- Request timeout (10s) to prevent slow-connection attacks (see ADR 0013)

### Information disclosure
- Centralized error handling with opaque, JSON-typed responses (see ADR 0006)
- Anti-enumeration on `/register` and `/login` (timing-safe with fake hash on missing user)
- Browser-level hardening via security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` (see ADR 0008)

### Dependency risk
- Automated vulnerability scanning in CI via `cargo audit`
- All dependencies pinned in `Cargo.lock`

### Reverse proxy spoofing
- Real client IP extracted from `X-Forwarded-For` / `X-Real-IP` (see ADR 0011)
- Currently trusts proxy headers naively; to be hardened with `TRUST_PROXY_HEADERS` or a proxy IP whitelist before production

## Data protection

- Passwords never stored in plain text; only Argon2id hashes
- Refresh tokens stored as SHA256 hashes; raw tokens never persisted
- Passwords, tokens, and secrets never appear in logs (verified by review)
- User-controlled fields (`email`, `firstname`, `lastname`) are logged in structured fields for audit; deletion procedure to be defined per GDPR

## Observability for security investigations

- Each request tagged with a unique `request_id` (UUID v4), propagated to the response header and visible in every server log line (see ADR 0012)
- Structured warn logs on auth failures include `ip`, `email`, `reason` for forensic analysis

## Incident response

- On suspected breach:
  - Rotate the `PEPPER` and `JWT_SECRET` environment variables (forces re-login of all users, invalidates all leaked tokens)
  - Invalidate all sessions via `UPDATE refresh_tokens SET revoked_at = NOW()`
  - Identify affected users via log audit on `request_id` and `ip`
  - Notify affected users per GDPR (within 72 hours of breach awareness)
- Post-mortem required within 1 week
- ADRs created for any architectural change resulting from the post-mortem
