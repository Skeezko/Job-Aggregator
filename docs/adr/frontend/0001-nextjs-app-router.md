# ADR 0001 — Next.js 16 App Router

- Status: accepted
- Date: 2026-05-21

## Context
The brief requires a responsive, accessible interface with registration,
authentication, dashboard, search, offer details, and an admin surface.
WCAG 2.1 AA must hold on three core flows.

Options considered:
1. Next.js 16 (App Router) — server components by default, file-based routing.
2. Vite + React Router — fully client-side SPA.
3. Remix — strong data loaders, server-first like Next.
4. SvelteKit — smaller bundle, smaller talent pool.

## Decision
Use **Next.js 16 with the App Router** under
`frontend/aggregator/app/`. Pin exact versions (`next 16.2.4`, `react
19.2.4`) and enforce `tsc --noEmit` in CI to catch breaking changes early.

## Consequences
- Pros:
  - File-based routing matches the brief's view checklist one-to-one.
  - Server components let us keep auth cookies on the server when needed.
  - Tailwind, ESLint, and `eslint-config-next` are first-class.
- Cons:
  - Next 16 introduces breaking changes from earlier majors; older Next docs
    do not apply (see `frontend/aggregator/AGENTS.md`).
  - SSR adds operational surface (the Compose container runs `node server.js`).
- Trade-offs accepted:
  - Larger framework footprint than a Vite SPA in exchange for SSR, routing,
    and an opinionated structure that maps cleanly to brief requirements.

## Alternatives considered
- **Vite SPA**: simpler runtime, no SSR, but loses the file-based routing and
  server-component story.
- **Remix**: equivalent on paper; the team had more familiarity with Next.
- **SvelteKit**: smaller bundle but smaller team familiarity and ecosystem.
