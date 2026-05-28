# Analytics Governance Contracts

This folder defines the source contracts for ScholarX PostHog analytics governance.

## Files
- `event-dictionary.md`: Canonical event names, required properties, and privacy boundaries.
- `kpi-mapping.md`: Mapping from tracked events to executive dashboard metrics.
- `change-log-template.md`: Required format for contract-impacting changes.
- `release-checklist.md`: Release gate for analytics contract updates.

## Contract Ownership
- Primary owner: Product Engineering (Executive Analytics)
- Secondary owner: Data Platform

## Update Rules
1. Any event definition, required-property, or KPI mapping update must be logged using `change-log-template.md`.
2. Changes must be validated by registry completeness tests before merge.
3. Release notes for analytics-impacting changes must include effective date and rollback plan.
