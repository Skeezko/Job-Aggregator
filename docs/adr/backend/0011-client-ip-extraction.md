# ADR 0011: Client IP Extraction Supporting Reverse Proxy Headers

## Context
The backend will be deployed behind a reverse proxy (Caddy or Nginx). In that setup, the TCP socket peer IP is the proxy's, not the real client's. Without explicit handling, all clients appear to share the same IP, which would break rate limiting (one bucket for everyone), brute-force detection, and audit logs.

## Decision
We implemented a `ft_get_ip(headers, socket_addr)` helper in `utils/ip.rs` with the following priority chain:
1. `X-Forwarded-For` header (first valid IP in the comma-separated chain).
2. `X-Real-IP` header (used by some Nginx configurations).
3. Fallback: the TCP socket peer IP from `ConnectInfo<SocketAddr>`.

This helper is used in all authentication handlers for logging (`ip = %raw_ip`) and database persistence (`refresh_tokens.ip_address`). The rate limiter uses `SmartIpKeyExtractor` from tower-governor, which implements the same priority chain independently.

## Consequences
* **Pros:**
  * **Reverse-Proxy Ready:** Logs and rate limiter see the real client IP when deployed behind Caddy/Nginx/Cloudflare.
  * **Local-Friendly:** Falls back gracefully to socket IP when no proxy headers are present (development).
  * **Functional Style:** Uses idiomatic `Option::and_then` chaining, isolating each header source in its own helper for testability.
* **Cons:**
  * **Trust Naïveté:** Currently trusts forwarded headers unconditionally. An attacker sending `X-Forwarded-For: 1.2.3.4` directly to the backend would spoof their IP. To be hardened in production via a `TRUST_PROXY_HEADERS` flag or a proxy IP whitelist.
  * Minor redundancy with `SmartIpKeyExtractor` (both implement similar logic). Accepted to decouple application code from the rate-limiting library.
