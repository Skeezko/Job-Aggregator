# CI / CD

## Continuous integration

GitHub Actions workflow in `.github/workflows/ci.yml` runs on every PR and push to `main`:

- Build each service Docker image
- Validate `docker-compose.yml`
- (TODO) run per-service unit tests
- (TODO) run lint / type-check

## Branch protection

- `main` requires passing CI and one review.
- Force-push disabled.

## Releases

- Tags follow `vMAJOR.MINOR.PATCH`.
- Release notes generated from conventional commits.
