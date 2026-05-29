# Deployment

## Environments
ScholarX is deployed on Azure Container Apps. The web application and certificate worker are built as separate Docker images.

## CI/CD workflows
- **Web app:** `.github/workflows/deploy-aca.yml` builds the image, runs migrations, and deploys the Next.js app.
- **Worker:** `.github/workflows/deploy-worker-aca.yml` runs lint/typecheck/tests, builds the worker image, runs migrations, and deploys the worker.

## Local build
```bash
pnpm build
```

## Environment configuration
Copy `.env.example` to `.env` and supply required variables (database, auth, email, Redis, analytics, Sentry). See README for the full list.
