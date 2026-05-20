# ADR 0012: End-to-End Observability via Request ID Propagation

## Context
With multiple concurrent requests, logs become impossible to correlate without a unique identifier per request. When a user reports a bug, we need to retrieve every log line related to their specific request, including across span boundaries (middleware, handler, error response).

## Decision
We use `tracing-subscriber` with `EnvFilter` (configurable via `RUST_LOG`) and `fmt::layer().pretty()` for human-readable output. We compose three layers for request correlation:
1. `SetRequestIdLayer` generates a UUID v4 for each incoming request via `MakeRequestUuid`.
2. `TraceLayer::new_for_http()` uses a custom `make_span_with` that includes `method`, `uri`, and `request_id` in every span.
3. `PropagateRequestIdLayer` echoes the `x-request-id` header back in the response.

Structured logs in handlers include contextual fields (`ip`, `email`, `user_id`, `reason`) via `tracing::warn!` and `tracing::info!` macros, without ever logging passwords, tokens, or secrets.

## Consequences
* **Pros:**
  * **Full Request Correlation:** Every log line in a request shares the same `request_id`, enabling targeted log searches.
  * **Client-Side Debugging:** The `x-request-id` returned in the response header allows users to report an exact request ID when contacting support.
  * **Filterable Logs:** Structured fields enable queries like "count password_mismatch events per IP per minute" for security analysis.
  * **Production-Ready:** Switching to JSON output (`fmt::json`) and shipping to Loki/Datadog requires changing one line.
* **Cons:**
  * Custom `make_span_with` adds a small amount of complexity in `layers.rs`.
  * No automatic sensitive header redaction yet (deferred until any middleware logs request headers).
