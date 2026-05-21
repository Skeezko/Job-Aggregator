# AI

## 1. The chosen feature

We implement **embedding-based semantic matching** that powers three concrete
user-facing capabilities:

| Capability             | Function                                                                          | User-facing role                                                  |
| ---------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Recommendation         | [`recommend.recommend_for_user`](../ai-worker/src/ai/recommend.py)                | "Top-K offers for you" feed based on skills + desired role        |
| Relevance scoring      | [`scoring.score_user_offer`](../ai-worker/src/ai/scoring.py)                      | "How well does offer X match my profile" — 0–100 score on details |
| Duplicate detection    | [`deduplicate.find_duplicates`](../ai-worker/src/ai/deduplicate.py)               | Surfaces cross-posts so admins can hide them                      |

The brief asks for **one** AI feature. Recommendation is the primary one; the
other two reuse the same backbone at near-zero extra cost, so we kept them.

## 2. Model

| Property        | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| Model           | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`      |
| Architecture    | DistilBERT-like, multilingual                                      |
| Dim             | 384                                                                |
| Disk size       | ~118 MB (well under the brief's 500 MB cap)                        |
| Loaded from     | HuggingFace cache; volume `ai_data` keeps it across container runs |
| Loader          | [`backbone.get_model`](../ai-worker/src/ai/backbone.py) (`lru_cache`) |

Embeddings are L2-normalized at encode time
([`backbone.encode`](../ai-worker/src/ai/backbone.py)) so cosine similarity is
just a dot product downstream.

### Compliance with the brief's constraints

| Constraint                                            | How we meet it                                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Must not outsource to an API we do not control        | Model runs locally inside `ai-worker`. No external inference calls.                                  |
| ≤ 500 MB on disk                                      | MiniLM-L12 is ~118 MB.                                                                               |
| < 5 s per offer                                       | CPU encode: ~30 ms per short text. Scoring query is a single SQL with pgvector ANN index.            |
| No fine-tuning at container startup                   | We use the pre-trained checkpoint as-is. Startup only loads the weights from cache.                   |

## 3. How each capability works

### 3.1 Recommendation
1. Build a query string `"{desired_role} skills: {skill1, skill2, …}"`.
2. Encode it with the backbone → 384-D vector.
3. ANN search against `offers.embedding` using cosine distance
   ([`recommend.py:11`](../ai-worker/src/ai/recommend.py)).
4. Return the top-K with `score = 1 - cosine_distance`.

### 3.2 Per-offer relevance scoring
1. Fetch `offer.embedding` and `offer.title` from DB.
2. Encode the user query the same way.
3. `semantic_score = max(0, int(dot(user_vec, offer_vec) * 100))`.
4. Add a small lexical bonus: +5 per user skill that appears verbatim in the
   title, capped at +20.
5. Clamp to 100.

The hybrid is deliberate: the lexical bonus rewards literal matches (the user
sees "React" in the title and the score reflects it), the semantic part
captures paraphrases ("front-end engineer" ≈ "React developer").

### 3.3 Duplicate detection
1. Take the embedding of one offer.
2. Find other offers with `1 - cosine_distance >= 0.92`
   ([`deduplicate.py:5`](../ai-worker/src/ai/deduplicate.py)).
3. Return the top-10 with similarity.

The 0.92 threshold was picked because at lower values the result set
includes legitimately similar but distinct postings (e.g., two front-end roles
in the same company); 0.92+ tends to mean reposted text.

## 4. Vector storage

Embeddings live in `offers.embedding vector(384)`, with an `ivfflat` index
using `vector_cosine_ops` and 100 lists
([`backend/migrations/002_offers.sql:67`](../backend/migrations/002_offers.sql)).
`ivfflat` is approximate; we accept the tradeoff because the lists count is
tuned for our expected dataset and the top-K we return is small.

## 5. Evaluation approach

| What we measure              | How                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| Backbone correctness         | Unit tests assert `dot(encode(x), encode(x)) ≈ 1` and shape == 384                   |
| Normalization correctness    | [`tests/test_normalize.py`](../ai-worker/tests/test_normalize.py) over fixture inputs |
| Recommend / score / dedup    | [`tests/test_recommend.py`](../ai-worker/tests/test_recommend.py), [`test_scoring.py`](../ai-worker/tests/test_scoring.py), [`test_deduplicate.py`](../ai-worker/tests/test_deduplicate.py) |
| Real-world quality (manual)  | Spot-check top-10 for fixture users against the live feed                            |

Expected limitations (documented honestly):
- Multilingual MiniLM is small; it captures broad semantics but can be fooled
  by very domain-specific jargon (rare frameworks, internal company names).
- The scoring lexical bonus is biased toward titles only; skills hidden in the
  description are not given the same boost.
- Dedup threshold is global; outlier sources with verbose templates may need
  per-source tuning.

## 6. Why / How / Trade-off

### 6.1 Embeddings instead of a classifier or LLM
- **Why** — One backbone serves three features (recommend, score, dedup) and
  fits the size/latency budget; classifiers would need labeled data we don't have.
- **How** — Encode once at ingestion; reuse for every query.
- **Trade-off** — Cannot answer "is this offer fraudulent?" or other tasks a
  fine-tuned classifier would. Acceptable: the brief asks for one lightweight
  AI feature.

### 6.2 MiniLM-L12 multilingual specifically
- **Why** — Offers are mostly French (sometimes English); a multilingual
  encoder avoids per-language preprocessing. 118 MB fits the budget with room
  to spare.
- **How** — Drop-in HuggingFace checkpoint via `sentence-transformers`.
- **Trade-off** — Slightly lower English-only performance than mono-English
  MiniLM, but worth the multilingual coverage. Documented in
  [adr/ai/0002-minilm-multilingual-embeddings.md](./adr/ai/0002-minilm-multilingual-embeddings.md).

### 6.3 Hybrid (semantic + lexical) scoring
- **Why** — Pure cosine often misses obvious-to-the-user keyword matches
  (e.g., "Rust" listed as a skill but offer titled "Backend engineer").
- **How** — Capped +5/+20 bonus per literal title match.
- **Trade-off** — Slight bias against descriptions that don't repeat skills in
  the title. Cap prevents the lexical term from dominating.

## 7. Rejected AI alternatives

| Alternative                                  | Why rejected                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| OpenAI / Anthropic / Google embeddings API   | Brief: "not allowed to outsource the AI feature to a model API you do not control"     |
| Local LLM (Llama, Mistral) for matching      | > 500 MB; > 5 s per offer on CPU                                                        |
| Skill extraction via spaCy + regex           | Brittle, no semantic generalization                                                     |
| Fine-tuning at container startup             | Forbidden by the brief; would also blow up startup time                                 |
| Cohere / Voyage embeddings                   | Same outsourcing constraint                                                             |
