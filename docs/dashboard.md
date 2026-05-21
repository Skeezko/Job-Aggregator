# Dashboard & frontend UX

This document explains **what is on the dashboard, why, and which user
decision it supports** — as required by the brief's "dashboard choices"
section.

## 1. Views and ownership of brief requirements

| Brief view                                  | Implementation                                                       |
| ------------------------------------------- | -------------------------------------------------------------------- |
| Registration                                | [`frontend/aggregator/app/register/`](../frontend/aggregator/app/register) |
| Authentication                              | [`frontend/aggregator/app/login/`](../frontend/aggregator/app/login)        |
| User dashboard (data + AI output visible)   | [`frontend/aggregator/app/dashboard/`](../frontend/aggregator/app/dashboard) |
| Offer search & filtering                    | [`frontend/aggregator/app/offers/`](../frontend/aggregator/app/offers)      |
| Offer details                               | [`frontend/aggregator/app/offers/[id]/`](../frontend/aggregator/app/offers/[id]) |
| Admin moderation / management               | [`frontend/aggregator/app/admin/`](../frontend/aggregator/app/admin)         |
| Saved offers                                | [`frontend/aggregator/app/bookmarks/`](../frontend/aggregator/app/bookmarks) |

Components live under
[`frontend/aggregator/components/`](../frontend/aggregator/components)
(`dashboard/`, `layout/`, `offers/`, `ui/`). Pages are the App Router under
`app/`.

## 2. Dashboard widgets — Why each one exists

| Widget                          | Data source                                            | User decision it supports                                                              |
| ------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Top-K recommendations           | `recommend_for_user` (AI feature)                       | "Where do I look first?" — entry point to a short list of probably-relevant offers     |
| Offer filter bar (contract/remote/city) | `GET /offers?contract_type=&remote_policy=&city=` (data feature) | "I only want internships in Lyon, remote-friendly"                                  |
| Recent offers (paginated)       | `GET /offers` (default ordering by `posted_at DESC`)    | "What is new since my last visit?"                                                     |
| Saved offers shortcut           | `GET /users/saved-offers`                               | "Resume where I left off; what was I considering?"                                     |
| Per-offer relevance badge       | `score_user_offer` (AI feature)                         | "Is this specific posting worth my time?"                                              |

This satisfies the brief: the dashboard shows at least one **data feature
output** (filtered / sorted offers) and one **AI feature output** (top-K
recommendations + per-offer score) without further navigation.

## 3. Offer details page

Per the brief, the offer details page must show at minimum: title, company,
location, contract type, date, description, and salary when available. The
schema column for each is in [data.md](./data.md). The frontend page resolves
`/offers/[id]` and renders those fields plus the "Save" action (POST
`/offers/:id/save`) and, when available, the relevance score.

## 4. Admin interface

`app/admin/` is gated client-side and **enforced server-side**:
- `GET /admin/users` returns 403 unless the JWT carries `role = admin`
  ([`backend/src/routes/admin.rs:54`](../backend/src/routes/admin.rs));
- `PATCH /admin/offers/:id/disable` flips `is_active = FALSE` (soft delete),
  removing the offer from the public feed without losing history.

Admin actions covered: hide an offer (moderation), list users (management).

## 5. Accessibility (WCAG 2.1 AA)

Brief requirement: meet WCAG 2.1 Level AA on at least three core flows —
**registration**, **offer search**, **offer details**. Plus: document at least
one automated audit (Lighthouse, axe, or tota11y) in the repository.

### Planned audits and where evidence goes

| Flow             | Audit tool          | Evidence location                                                          |
| ---------------- | ------------------- | -------------------------------------------------------------------------- |
| Registration     | Lighthouse (CI)     | `docs/accessibility/lighthouse-registration.html` (TODO)                   |
| Offer search     | Lighthouse / axe    | `docs/accessibility/lighthouse-offers.html` (TODO)                         |
| Offer details    | Lighthouse / axe    | `docs/accessibility/lighthouse-offer-details.html` (TODO)                  |

### Built-in choices that help

| Choice                                          | A11y effect                                                                |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| Semantic HTML in App Router pages               | Native landmarks (`<main>`, `<nav>`, `<header>`)                            |
| Form labels bound to inputs via `htmlFor`       | Screen-reader announces field names                                         |
| Tailwind utility classes (`focus-visible`)      | Keyboard focus ring on every interactive element                            |
| Color contrast chosen ≥ 4.5:1 for body text     | Meets AA contrast baseline                                                 |
| `next/font` for non-system fonts                | Avoids layout shift; preserves text scaling                                 |
| Page titles and skip-link in layout             | Reduces friction for keyboard / AT users                                    |

## 6. Why / How / Trade-off

### 6.1 Next.js App Router
- **Why** — File-based routing, server-side rendering by default, clear
  separation between server and client components.
- **How** — `app/<route>/page.tsx`; layouts shared via `app/layout.tsx`.
- **Trade-off** — Next 16's API is breaking vs. older majors; mitigated by
  pinned versions and `tsc --noEmit` in CI.

### 6.2 Tailwind 4 over a CSS-in-JS library
- **Why** — Lower runtime cost, predictable bundle, easy to enforce a small
  design system through utility classes.
- **How** — Tailwind `@tailwindcss/postcss` in `postcss.config.mjs`; `globals.css`
  holds tokens.
- **Trade-off** — Component markup gets verbose; mitigated by extracting
  components under `components/ui/`.

### 6.3 Pages assume the API base via `NEXT_PUBLIC_API_URL`
- **Why** — Build-time baking so the production bundle ships with the right
  origin; avoids client-side env shims.
- **How** — Dockerfile `ARG NEXT_PUBLIC_API_URL`, Compose passes it.
- **Trade-off** — Cannot change API origin without rebuilding the image; we
  accept this for the simplicity it gives.

## 7. Wireframes

See [`wireframes/`](./wireframes). At minimum we expect: registration / login,
dashboard, offer search, offer details, admin moderation. Each wireframe
should label which widget answers which user decision (cf. §2 of this doc).
