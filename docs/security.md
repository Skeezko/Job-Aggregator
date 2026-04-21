# Security

## Principles

- Least privilege for every service account
- Secrets in environment variables or a vault, never in git
- All external traffic over TLS

## Threat model (summary)

- **Scraping bans** — respect `robots.txt`, rate-limit adapters
- **Account takeover** — password hashing (argon2/bcrypt), rate-limited auth
- **Injection** — parameterized queries, input validation on API boundaries
- **Dependency risk** — automated vulnerability scanning in CI

## Data protection

- User PII encrypted at rest (database-level)
- Logs scrubbed of email addresses and tokens
- Retention policies documented in `data.md`

## Incident response

- On suspected breach: rotate secrets, invalidate sessions, notify affected users
- Post-mortem required within 1 week
