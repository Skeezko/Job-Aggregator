# ADR 0006: Opaque and Centralized Error Handling

## Context
When an API encounters an error (e.g., a database constraint violation, bad credentials, or an invalid token), returning raw error messages to the frontend can leak sensitive infrastructure details to attackers.

## Decision
We implemented a centralized error handling system using a custom `AppError` enum that implements Axum's `IntoResponse`. 
Furthermore, all security-sensitive routes return opaque, standardized JSON responses. For example, the `/login` route executes a "fake" Argon2 hash calculation when an email is not found to ensure timing-safe responses.

## Consequences
* **Pros:**
  * **Zero Information Leakage:** Clients never see SQL errors or stack traces.
  * **Anti-Enumeration:** Attackers cannot use response times or error messages to guess registered emails.
  * **Consistent API Contract:** The frontend always receives a predictable `{"error": {"code": "...", "message": "..."}}` format.
* **Cons:**
  * Developers must remember to map every new internal error to an `AppError` variant.