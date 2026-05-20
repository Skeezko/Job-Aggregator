# ADR 0009: CORS Strict with Environment-Driven Whitelist

## Context
The frontend (Next.js, `localhost:3000` in development) calls the backend (`localhost:8080`) cross-origin. Without explicit CORS configuration, browsers block these requests. A naive `Any` origin policy would expose the API to any malicious site.

## Decision
We use a strict CORS policy with an explicit whitelist parsed from the `CORS_ALLOWED_ORIGINS` environment variable, comma-separated. We allow credentials (cookies) cross-origin via `allow_credentials(true)`, which is required for our refresh token cookie. The allowed methods are `GET`, `POST`, `PATCH`, `DELETE`, and headers are restricted to `Content-Type`, `Authorization`, `Accept`.

## Consequences
* **Pros:**
  * **Origin Isolation:** Only declared frontends can call the API; arbitrary websites are blocked by the browser.
  * **Cookies Cross-Origin:** Refresh token cookie flows correctly between frontend and backend.
  * **Per-Environment Configuration:** Production, staging, and development each declare their own origins via env vars.
* **Cons:**
  * `allow_credentials(true)` is incompatible with `allow_origin(Any)`, so wildcard CORS is permanently impossible. This is intentional.
  * Every new frontend origin requires an environment variable update.
