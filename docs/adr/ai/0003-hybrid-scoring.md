# ADR 0003 — Hybrid semantic + lexical scoring

- Status: accepted
- Date: 2026-05-21

## Context
The per-offer relevance score is shown to end users. Pure cosine similarity
between a "user query" (skills + desired role) and an offer embedding has two
known failure modes that are very visible to users:
- the score is low when the title literally contains a user skill (e.g.
  "Rust" is in the user's skill list and in the title, but a generic
  embedding doesn't push the score high enough);
- the score is high for legitimately related but off-target offers (e.g.
  "Backend Engineer" with no Rust at all).

We wanted a small, explainable adjustment that addresses the first case
without introducing a heavy reranking step.

## Decision
Compute `semantic_score = max(0, int(cosine * 100))`. Then add a **bounded
lexical bonus**: `+5` per user skill that appears verbatim in the offer
title, capped at `+20`. Total clamped to 100. Implementation in
[`ai-worker/src/ai/scoring.py`](../../../ai-worker/src/ai/scoring.py).

## Consequences
- Pros:
  - Explainable: "your skill X is in the title".
  - Cheap: pure string operations on top of one DB read.
  - Bounded: lexical signal cannot dominate the semantic one.
- Cons:
  - Biased toward titles; skills hidden in the description are not boosted.
- Trade-offs accepted:
  - Title-only lexical matching in exchange for predictable runtime; we
    expect to revisit this if offer titles get noisier.

## Alternatives considered
- **BM25 reranker on the description**: more accurate but adds an index and
  a heavier per-request cost.
- **Cross-encoder reranker**: out of the 5 s/offer budget on CPU at our
  scale.
- **Pure cosine, no bonus**: tested in development; users were surprised when
  obvious keyword matches scored mid-tier.
