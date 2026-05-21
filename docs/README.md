# Job Aggregator — Documentation

Decision-oriented documentation for the Job Aggregator platform. Each major
choice is recorded with **Why / How / Trade-off** and linked to evidence (code
path, workflow file, screenshot, or test).

## Quick index

| Domain        | Document                                | Scope                                                              |
| ------------- | --------------------------------------- | ------------------------------------------------------------------ |
| Product       | [product.md](./product.md)              | Target users, pain points, value proposition, success metrics      |
| Architecture  | [architecture.md](./architecture.md)    | Stack, services, request flow, rejected alternatives               |
| Data          | [data.md](./data.md)                    | WeLoveDevs integration, normalization, manual ingestion trigger    |
| AI            | [ai.md](./ai.md)                        | Embedding model, recommend / score / deduplicate, constraints      |
| Security      | [security.md](./security.md)            | Threats considered and implemented controls                        |
| CI            | [ci.md](./ci.md)                        | GitHub Actions pipeline, what is automated and why                 |
| Dashboard     | [dashboard.md](./dashboard.md)          | Widget rationale, decisions supported, accessibility evidence      |
| ADRs          | [adr/README.md](./adr/README.md)        | One-page records per architectural decision                        |
| Wireframes    | [wireframes/](./wireframes)             | Key view mockups                                                   |

## Mapping to the project brief

The brief requires a Why / How / Trade-off for every major choice, at least one
rejected alternative for architecture/data/AI, and links from claims to
evidence. The table below points each requirement to where it is addressed.

| Brief requirement                              | Where it is documented                                    |
| ---------------------------------------------- | --------------------------------------------------------- |
| Product choices (users, pain, value)           | [product.md](./product.md)                                |
| Dashboard widget rationale                     | [dashboard.md](./dashboard.md)                            |
| Architecture choices + rejected alternatives   | [architecture.md](./architecture.md), [adr/](./adr/)      |
| WeLoveDevs ingestion + rate-limit handling     | [data.md](./data.md)                                      |
| AI method, size, latency, evaluation           | [ai.md](./ai.md)                                          |
| Security threats and implemented controls      | [security.md](./security.md)                              |
| CI: what is automated and why                  | [ci.md](./ci.md)                                          |
| Wireframes / market scan                       | [product.md](./product.md), [wireframes/](./wireframes)   |

## Reading order for the jury

1. [product.md](./product.md) — why this platform exists
2. [architecture.md](./architecture.md) — how the system is shaped
3. [data.md](./data.md) + [ai.md](./ai.md) — the data and AI features
4. [security.md](./security.md) + [ci.md](./ci.md) — engineering safeguards
5. [adr/](./adr/) — every major decision in one page
