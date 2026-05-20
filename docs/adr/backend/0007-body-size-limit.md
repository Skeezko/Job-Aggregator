# ADR 0007: Body Size Limit Aligned on Memory Page

## Context
Without an explicit limit, the server accepts request bodies of arbitrary size. An attacker could send multi-gigabyte JSON payloads to trigger memory exhaustion (OOM crash) on our backend. Our current routes are all authentication endpoints with small JSON payloads (~200-600 bytes maximum).

## Decision
We applied a global `RequestBodyLimitLayer::new(4096)` (4 KB), which corresponds to one Linux memory page. Routes requiring larger payloads (file uploads, bulk imports) will declare their own limit via `route_layer` with a higher threshold.

## Consequences
* **Pros:**
  * **DoS Protection:** Rejects oversized requests before they consume server memory.
  * **OS-Aligned Allocation:** A single memory page handles each request, optimizing kernel-level resource usage.
  * **Generous Margin:** 4 KB is 7-20× our largest legitimate payload, leaving room for evolution.
* **Cons:**
  * The 413 response from tower-http is not JSON-typed like our `AppError` responses, introducing a minor format inconsistency.
  * Future upload routes must remember to override the limit explicitly.
