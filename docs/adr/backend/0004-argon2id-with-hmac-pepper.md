# ADR 0004: Argon2id with HMAC-SHA256 Pepper

## Context
We need to securely hash user passwords before storing them in the database to prevent credential compromise in case of a data breach.

## Decision
We chose `Argon2id` as our hashing algorithm, combined with an `HMAC-SHA256` pepper.
1. The raw password is first hashed using HMAC-SHA256 with a secret "Pepper" loaded from environment variables (`Arc<Secret<String>>`).
2. The resulting bytes are then hashed using Argon2id with an auto-generated per-user salt.

## Consequences
* **Pros:**
  * Argon2id is the current OWASP recommendation, highly resistant to GPU and ASIC cracking.
  * The pepper adds a crucial layer of defense: if an attacker steals the database but not the server environment variables, they cannot crack *any* passwords, even weak ones.
* **Cons:**
  * CPU and Memory intensive (intentional, to slow down attackers).
  * If the pepper environment variable is lost, all user passwords are permanently invalidated.