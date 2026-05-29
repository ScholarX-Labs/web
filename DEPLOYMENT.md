# 🚢 DEPLOYMENT

## Platform
- Azure Container Apps (ACA)
- Docker standalone Next.js build
- CI/CD via GitHub Actions

## Workflows
- Web: `.github/workflows/deploy-aca.yml`
- Worker: `.github/workflows/deploy-worker-aca.yml`

## Deployment Steps (Web)
1. Checkout + registry login
2. Docker build + push
3. Production DB migrations
4. Deploy image to ACA revision

## Critical Build-Time Requirement
Public client vars must be present during image build:
- `NEXT_PUBLIC_POSTHOG_KEY` (or `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`)
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_POSTHOG_UI_HOST`
- `NEXT_PUBLIC_SENTRY_DSN`

Runtime-only injection is not sufficient for `NEXT_PUBLIC_*` values.

## Post-Deploy Validation Checklist
1. App starts and health checks pass
2. Authenticated + public routes render correctly
3. `/ingest/*` analytics requests are not redirected by middleware
4. Core events visible in PostHog
5. Executive dashboard endpoints load with expected state

