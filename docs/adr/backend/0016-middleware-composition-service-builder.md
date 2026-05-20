# ADR 0016: Middleware Composition via tower::ServiceBuilder

## Context
With more than ten middleware layers (CORS, compression, security headers, rate limiting, timeout, tracing, request ID, body limit), composition order matters and must be predictable. Two Axum patterns exist:
1. Direct `.layer()` chaining on the `Router` — layers apply in **reverse** declaration order, which is counter-intuitive.
2. Composition via `tower::ServiceBuilder` — layers apply in **declaration** order, matching how a reader expects code to be read top-down.

## Decision
We extracted all global middleware composition into `src/layers.rs`, where layers are stacked via `ServiceBuilder::new().layer(...).layer(...)`. The function `ft_middleware_layers(cors_origins) -> Router<AppState>` assembles routes and applies the middleware stack. `lib.rs` delegates entirely to this function and only injects state via `with_state(app)`.

This is the pattern explicitly recommended by the `tower::ServiceBuilder` documentation.

## Consequences
* **Pros:**
  * **Predictable Order:** Top-down reading matches execution order on the incoming request.
  * **Single Responsibility for lib.rs:** Reduced to `AppState` definition and a five-line `ft_app` assembler.
  * **Testable Composition:** `ft_middleware_layers` returns a `Router<AppState>` independently of state, allowing test setups with mock state.
* **Cons:**
  * Mixing `ServiceBuilder` and direct `Router::layer()` in the same codebase would create confusion. Convention must be enforced (currently only `ServiceBuilder` is used for global layers).
  * `ServiceBuilder`'s type signature is opaque; if extracted as a return type, requires `impl tower::Layer<...>` workarounds.
