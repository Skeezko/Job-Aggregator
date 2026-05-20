# ADR 0010: Two-Tier Rate Limiting with tower-governor

## Context
Authentication endpoints (`/login`, `/register`) are prime targets for brute-force attacks and account enumeration. Without rate limiting, an attacker can test thousands of passwords per second. However, applying strict limits everywhere would penalize legitimate users who refresh tokens frequently in multi-tab SPAs.

## Decision
We implemented two distinct rate limiters via `tower-governor` (GCRA algorithm), each on its own sub-router:
* **Strict** on `/login` and `/register`: burst 6, refill 1 token per 10 seconds (≈6 requests/min). Blocks brute-force while tolerating typos.
* **Permissive** on `/refresh` and `/logout`: burst 60, refill 1 token per second (≈60 requests/min). Handles SPA token refresh bursts.

Both limiters key requests by real client IP via `SmartIpKeyExtractor` (X-Forwarded-For aware) to remain accurate behind a reverse proxy.

## Consequences
* **Pros:**
  * **Brute-Force Mitigation:** At 6/min, testing one million passwords takes 115 days — impractical for attackers.
  * **Fair to Users:** GCRA refills progressively (per-token), avoiding harsh blocking on legitimate sporadic bursts.
  * **Per-Risk Calibration:** Limits scale with the security risk of each route.
  * **Reverse-Proxy Ready:** IP-based keying works correctly behind Caddy, Nginx, or Cloudflare.
* **Cons:**
  * Per-IP buckets are stored in memory — does not scale across multiple backend instances without a shared store (e.g., Redis). Acceptable for current single-instance deployment.
  * Aggressive users on shared IPs (corporate NAT, large CGNAT) may hit limits together.
