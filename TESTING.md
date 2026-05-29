# Testing

## Linting and type checks
```bash
pnpm lint
pnpm typecheck
```

## Unit and integration tests
```bash
pnpm test      # src/**/*.test.ts
pnpm test:api  # src/app/api/**/*.test.ts
```

## E2E smoke tests
```bash
EXECUTIVE_E2E_BASE_URL=http://localhost:3000 \
  node --import tsx --test tests/e2e/*.spec.ts
```

## Test locations
- `src/**/*.test.ts` — unit and integration tests.
- `src/app/api/**/*.test.ts` — API route tests.
- `tests/e2e/*.spec.ts` — Playwright e2e coverage.
