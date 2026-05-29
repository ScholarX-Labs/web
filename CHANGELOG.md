# 📜 CHANGELOG

All notable changes to ScholarX are documented in this file.

The format follows Keep a Changelog principles and semantic-style release intent.

## [Unreleased]

### Added
- Production-grade analytics governance docs and contracts.
- Same-origin PostHog ingestion path (`/ingest/*`) for reliability.
- Event registry and contract completeness tests.
- Executive analytics tracking for growth/opportunity/search paths.

### Changed
- Hardened middleware/proxy behavior for analytics ingress.
- Improved analytics privacy sanitization and structured error logging.
- Expanded documentation set (system design, architecture, API, security, performance, roadmap).

### Fixed
- Build/runtime inconsistencies for PostHog public env usage.
- Suspense boundary issues around `useSearchParams` in global tracking path.
- Non-blocking analytics dispatch behavior in server-side search tracking.

