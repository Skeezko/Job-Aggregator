# ADR 0008: Minimal OWASP Security Headers

## Context
Browsers apply permissive defaults for backward compatibility, exposing applications to MIME-sniffing, clickjacking, and referrer leakage attacks. We need to harden response headers without breaking functionality.

## Decision
We apply three security headers globally on every response via `SetResponseHeaderLayer`:
1. `X-Content-Type-Options: nosniff` — prevents MIME-type guessing.
2. `X-Frame-Options: DENY` — blocks clickjacking via iframe embedding.
3. `Referrer-Policy: strict-origin-when-cross-origin` — limits URL leakage in cross-origin navigations.

We explicitly chose not to add:
* `Strict-Transport-Security`: irrelevant in HTTP development environment.
* `Cross-Origin-Embedder/Opener/Resource Policy`: risk of breaking legitimate cross-origin integrations without measurable benefit for our scope.

## Consequences
* **Pros:**
  * **Defense in Depth:** Blocks well-known browser-level attack vectors at zero cost.
  * **Conservative:** No risk of breaking the frontend or third-party integrations.
  * **Auditable:** Each header has a clear, single security purpose.
* **Cons:**
  * Headers added on every response, even error responses (acceptable overhead).
  * `Permissions-Policy` deferred until we know the frontend's needs.
