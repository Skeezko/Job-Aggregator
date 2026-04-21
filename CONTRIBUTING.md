# Contributing

## Workflow

1. Create a feature branch from `main`.
2. Make changes with clear, atomic commits.
3. Open a pull request using the template.
4. Ensure CI is green and request review.

## Branch naming

- `feat/<short-description>` — new feature
- `fix/<short-description>` — bug fix
- `chore/<short-description>` — tooling / docs
- `refactor/<short-description>` — non-behavioral change

## Commit messages

Use conventional-commit style:

```
<type>(<scope>): <subject>
```

Example: `feat(backend): add job ingestion endpoint`.

## Code review

- At least one approval before merge.
- CI must pass.
- Keep PRs focused; split large changes into reviewable pieces.
