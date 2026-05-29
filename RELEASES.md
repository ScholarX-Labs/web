# 🏷️ RELEASES

## Release Tagging Convention

- Format: `vMAJOR.MINOR.PATCH`
- Example: `v1.4.2`

## Release Process

1. Ensure all required checks pass:
   - typecheck
   - unit/integration tests
   - E2E suite
2. Update `CHANGELOG.md` from `[Unreleased]` into a versioned section.
3. Create git tag:
   - `git tag vX.Y.Z`
   - `git push origin vX.Y.Z`
4. Publish GitHub release notes including:
   - user-facing changes
   - architecture/security/performance notes
   - migration/rollback considerations

## Release Quality Gate

- No critical failing tests
- No unresolved security blockers
- Analytics contract checks complete when instrumentation changed
- Deployment validation complete in production environment

