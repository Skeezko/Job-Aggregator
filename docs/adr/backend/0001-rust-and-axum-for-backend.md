# ADR 0001: Rust and Axum for the Core Backend

## Context
We needed to choose the core technology stack for the backend API. The requirements were high performance, strong type safety, and memory safety. We considered Node.js (Express/NestJS) and various Rust frameworks (Rocket, Actix-web, Axum).

## Decision
We chose **Rust** with the **Axum** framework.

## Consequences
* **Pros:**
  * **Memory Safety & Performance:** Rust eliminates entire classes of memory bugs (null pointers, data races) at compile time while delivering C-like performance.
  * **Ecosystem Alignment:** Axum is maintained by the `tokio` team, ensuring flawless integration with Rust's standard async runtime and ecosystem (Tower middleware, Tracing).
  * **Ergonomics:** Axum's macro-free, extractor-based API makes routing and state management highly predictable.
* **Cons:**
  * Steeper learning curve compared to Node.js/TypeScript.
  * Longer compile times, especially with large dependencies.