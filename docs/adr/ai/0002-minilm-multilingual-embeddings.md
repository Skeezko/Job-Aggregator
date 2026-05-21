# ADR 0002 — Multilingual MiniLM embeddings

- Status: accepted
- Date: 2026-05-21

## Context
We needed an embedding model that:
- handles **French and English** (WeLoveDevs offers mix both languages);
- fits in **≤ 500 MB on disk** (brief constraint);
- encodes a short text in well under **5 s on CPU** (brief constraint);
- requires **no fine-tuning at startup** (brief constraint);
- is permissively licensed.

Candidates:
1. `sentence-transformers/all-MiniLM-L6-v2` — English-only, ~22 MB, 384-D.
2. `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` — 50+
   languages, ~118 MB, 384-D.
3. `intfloat/e5-small-v2` — strong on retrieval but English-only.
4. `BAAI/bge-m3` — multilingual and strong, but ~2.3 GB.

## Decision
Use **`paraphrase-multilingual-MiniLM-L12-v2`**. Load it once via
`@lru_cache` and L2-normalize outputs so cosine becomes a dot product.

## Consequences
- Pros:
  - Covers French/English without preprocessing.
  - 118 MB leaves ample headroom under the 500 MB budget.
  - ~30 ms per short text on CPU, well under 5 s.
- Cons:
  - Lower English-only retrieval quality than mono-English alternatives.
- Trade-offs accepted:
  - We prefer broader language coverage to a few percentage points of
    English benchmark score.

## Alternatives considered
- **`all-MiniLM-L6-v2`**: tiny and fast but mono-English; would force us to
  detect language and possibly translate.
- **`bge-m3`**: 2.3 GB, blows the 500 MB budget.
- **OpenAI / Cohere / Voyage embeddings**: forbidden by the brief.
