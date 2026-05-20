# ADR 0014: Authentication via FromRequestParts Extractor

## Context
We need a mechanism to protect routes such that authenticated user identity (id, role) is available in handlers. Two patterns exist in Axum:
1. A `tower::Layer` middleware (via `axum::middleware::from_fn`) that injects user data into request extensions, retrieved by handlers via `Extension<T>`.
2. A custom extractor implementing `FromRequestParts<S>`, used directly as a handler parameter (`user: AuthUser`).

## Decision
We implemented `AuthUser` as a custom extractor via `FromRequestParts<S>` where `AppState: FromRef<S>`. The extractor:
1. Reads the `Authorization` header.
2. Validates the `Bearer ` prefix.
3. Decodes the JWT with strict `Validation::new(Algorithm::HS256)` (algorithm pinning prevents the classic `alg: none` attack).
4. Returns `AuthUser { id, role }` on success or `AppError::Unauthorized` with a structured warn log on any failure.

This is the idiomatic pattern recommended by the Axum documentation.

## Consequences
* **Pros:**
  * **Compiler-Enforced Protection:** A route mentioning `user: AuthUser` is unconditionally protected. Cannot be forgotten when adding new routes.
  * **Composable:** Future extractors (`AdminUser`, `OwnerOf<Resource>`) can be built on top of `AuthUser` by reusing the same pattern.
  * **Algorithm Pinning:** Verified by test that `Algorithm::none` tokens are rejected, preventing JWT forgery.
  * **No Runtime Surprise:** Handlers receive a typed `AuthUser`, not an `Option`. The presence of the user is guaranteed by Axum's resolution.
* **Cons:**
  * Slightly more boilerplate than a middleware-injected extension.
  