# ADR 0013: Compression and Request Timeout Layers

## Context
Response payloads will grow as we add business routes (offer listings, dashboard stats). Without compression, JSON responses are sent verbatim, wasting bandwidth. Without a timeout, slow database queries or attacker-induced delays (e.g., Slowloris-style requests) can hold connections open indefinitely.

## Decision
We added two tower-http layers globally:
1. `CompressionLayer::new()` — compresses responses (gzip/brotli/deflate) when the client sends `Accept-Encoding`. Small payloads (< ~32 bytes by default) are skipped automatically.
2. `TimeoutLayer::new(Duration::from_secs(10))` — aborts requests that exceed 10 seconds, returning a `408 Request Timeout`.

## Consequences
* **Pros:**
  * **Bandwidth Savings:** Larger JSON responses (offer lists, dashboard data) will be compressed transparently.
  * **Slow-Connection Protection:** Aborts hung handlers (slow DB queries, infinite loops, etc.) preventing resource exhaustion.
  * **Out-of-the-Box:** Default settings work without per-route configuration.
* **Cons:**
  * Compression has a CPU cost on response generation; negligible for our scale.
  * 10-second timeout may be tight if Argon2 hashing is reconfigured with higher cost (currently completes in ~500ms).
