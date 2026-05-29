# 🧪 TESTING

## Test Strategy
ScholarX uses layered testing:
- Unit tests for utilities/policies/contracts
- Integration tests for route/service interactions
- E2E tests for user-critical journeys

## Commands
- Typecheck: `pnpm typecheck`
- Unit/integration: `pnpm test`
- API-focused: `pnpm test:api`
- E2E: `node --import tsx --test tests/e2e/**/*.spec.ts`

## Coverage Priorities
1. Auth and access boundaries
2. Analytics schema/privacy/fail-open behavior
3. Executive read-model semantics (especially data-gap vs true-zero)
4. Critical user flows:
   - Signup flow
   - Opportunity actions
   - AI search lifecycle

## Release Validation
Before release:
- All required test suites pass
- Analytics governance checklist is completed
- Migration and deployment steps validated

