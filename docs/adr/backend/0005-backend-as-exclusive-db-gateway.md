# ADR 0005: Backend as Exclusive Database Gateway

## Context
The architecture includes asynchronous AI workers (e.g., parsing jobs, running ML models). We needed to decide whether these external workers should connect directly to the PostgreSQL database or communicate via the Rust backend API.

## Decision
The Rust Backend will serve as the **Exclusive Gateway** to the database. The AI workers will **never** touch PostgreSQL directly; they will push/pull data via internal HTTP/REST endpoints exposed by the Rust API.

## Consequences
* **Pros:**
  * **Single Source of Truth:** Business logic, data validation, and database constraints are centralized in the Rust backend. 
  * **Security:** Database credentials are only exposed to one service (the backend).
  * **Decoupling:** We can change the database schema without breaking the AI worker's code.
* **Cons:**
  * Slight latency overhead (Worker -> API -> DB instead of Worker -> DB).
  * Requires building and maintaining dedicated API endpoints for the AI workers.