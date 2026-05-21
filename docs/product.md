# Product

## 1. Problem statement

Junior tech candidates (students, apprentices, early-career engineers) face a
fragmented job market. Offers are scattered across job boards, company career
pages, Discord servers, and aggregators of variable quality. The cost is real:
- relevant offers get missed because each board uses its own filters and taxonomy;
- the same offer is reposted under different titles, polluting the feed;
- contract type, remote policy, and salary are often unclear or hidden behind
  marketing copy;
- candidates spend more time *searching* than they spend *applying*.

## 2. Target users

| Persona                | Need                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| Epitech student        | Find internships / apprenticeships matching their skills, fast       |
| Early-career engineer  | Compare salary, remote policy, and contract type across offers       |
| Platform administrator | Moderate offers (hide low-quality / duplicate entries), manage users |

The user role is the default; the admin role is held by the platform team.
Role enforcement happens server-side
([backend/src/routes/admin.rs](../backend/src/routes/admin.rs),
[backend/src/security/middleware.rs](../backend/src/security/middleware.rs)).

## 3. Value proposition

> A single, decluttered feed of standardized job and internship offers, with
> built-in personalization (relevance scoring) and clean controls (filtering,
> save list, admin moderation).

What makes the product credible:
- a real data source — the WeLoveDevs partnership, not synthetic data;
- AI features that solve concrete tasks (recommendation, deduplication,
  relevance scoring) and run locally under tight resource constraints;
- access control, secure auth, and a documented decision trail.

## 4. Prioritized pain points → product features

| Pain point                       | Feature                                                                        | Evidence                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Inconsistent offer schema        | Normalization pipeline (contract, remote, salary, location, dates)             | [ai-worker/src/etl/normalize.py](../ai-worker/src/etl/normalize.py)      |
| Cross-posted duplicates          | Embedding-based duplicate detection                                            | [ai-worker/src/ai/deduplicate.py](../ai-worker/src/ai/deduplicate.py)    |
| "Is this offer for me?"          | Per-user relevance scoring (0–100) using skills + desired role + embeddings    | [ai-worker/src/ai/scoring.py](../ai-worker/src/ai/scoring.py)            |
| Browsing fatigue                 | Top-K recommendation feed                                                      | [ai-worker/src/ai/recommend.py](../ai-worker/src/ai/recommend.py)        |
| Filter friction                  | Server-side filtering on contract type, remote policy, city                    | [backend/src/routes/offers.rs](../backend/src/routes/offers.rs)          |
| Lose interesting offers          | Saved offers with notes                                                        | [backend/src/routes/users.rs](../backend/src/routes/users.rs)            |
| Spam / dead offers in feed       | Admin soft-delete (`is_active = FALSE`)                                        | [backend/src/routes/admin.rs](../backend/src/routes/admin.rs)            |

## 5. Success metrics

| Metric                                       | Why it matters                                  | How it is measured                                |
| -------------------------------------------- | ----------------------------------------------- | ------------------------------------------------- |
| Time-to-first-applied-offer                  | Search→apply friction                           | Frontend instrumentation (out of scope for MVP)   |
| Recommendation top-10 hit rate (heuristic)   | Quality of AI scoring                           | Internal evaluation in [ai.md](./ai.md)           |
| Duplicate rate before vs. after dedup        | Cleanliness of feed                             | Cosine similarity ≥ 0.92 ratio over ingested set  |
| Mean ingestion run duration                  | Operational health                              | `ingestion_runs` table; see [data.md](./data.md)  |

## 6. Market scan (synthesis)

Existing actors:
- **Generalist aggregators** (Indeed, Welcome to the Jungle): broad but noisy
  for tech-specific candidates; no fine-grained skill matching.
- **Tech-focused** (WeLoveDevs, AngelList/Wellfound, HelloWork): better
  taxonomy, but each user must visit several to cover the market.
- **Communities** (Discord, Slack, Tally forms): high signal but unstructured
  and ephemeral.

Where this project sits: aggregator that consumes a tech-focused source
(WeLoveDevs) through its official API, normalizes it, and layers
personalization on top — built as an engineering deliverable rather than a
consumer product, but with a credible UX.

## 7. Rejected product directions

| Idea                                       | Why rejected                                                                |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| Resume parsing + autofill applications     | Scope creep; legal/PII risk; brief asks for one AI feature, not a suite     |
| LLM cover-letter generation                | Brief forbids outsourcing AI to a model API we do not control               |
| Multi-board crawling (LinkedIn etc.)       | Brittle, against ToS; WeLoveDevs API gives us real data legally             |
| Real-time alerts / email notifications     | Out of scope for MVP; useful as bonus                                       |

## 8. Wireframes

See [wireframes/](./wireframes). Key views: registration, login, dashboard,
offer search, offer details, admin moderation.
