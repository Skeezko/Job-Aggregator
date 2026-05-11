# ADR 0003: JWT Access Tokens with Opaque Refresh Tokens

## Context
We need to authenticate users in a stateless API while maintaining the ability to forcefully revoke sessions (logout or security breach).

## Decision
We implemented a dual-token strategy:
1. **Access Token (JWT):** Short-lived (15 minutes), signed with HMAC-SHA256. Sent by the client in the `Authorization` header.
2. **Refresh Token (Opaque):** Long-lived (30 days), randomly generated 32-byte string. Hashed with SHA256 and stored in the database. Sent to the client as an `HttpOnly`, `Secure`, `SameSite=Strict` cookie.

## Consequences
* **Pros:**
  * High performance: API routes only verify the JWT signature (no DB lookup needed).
  * High security: XSS attacks cannot steal the refresh token (HttpOnly cookie).
  * Revocable: We can invalidate sessions by deleting the refresh token in the database.
  * Reuse detection: Using a revoked refresh token automatically invalidates all user sessions.
* **Cons:**
  * Increased complexity in the authentication flow.