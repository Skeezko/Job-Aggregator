# AI

## Features

- Skill extraction from free-text job descriptions
- Seniority classification (intern / junior / mid / senior / lead)
- Remote-policy detection (on-site / hybrid / remote)
- Candidate ↔ job matching score

## Models

- Default: hosted LLM (provider configurable via env)
- Evaluated alternatives: open-weights models running in-worker

## Prompts

Prompt templates live in `ai-worker/src/prompts/`. Each prompt has:
- a version identifier
- a golden test set under `ai-worker/tests/`

## Evaluation

- Accuracy tracked on a labeled holdout set
- Drift monitored per source and per week

## Safety

- PII stripped from prompt inputs
- Outputs validated against JSON schemas before persistence
