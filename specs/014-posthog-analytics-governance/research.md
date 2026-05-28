# Research: PostHog Analytics Governance

## Decision 1: Canonical event taxonomy with strict naming and versioning
- Decision: Maintain a single canonical event dictionary in-repo, with event names in lower_snake_case, stable semantic meaning, and explicit deprecation lifecycle.
- Rationale: Prevents analytics drift, enables cross-team consistency, and provides durable contracts for downstream dashboards.
- Alternatives considered:
  - Ad-hoc event naming by feature teams (rejected: high entropy, non-reconcilable KPIs)
  - Tool-only tracking plan outside repo (rejected: weak change control and reviewability)

## Decision 2: Hybrid analytics architecture (PostHog as source + curated internal mirror)
- Decision: Use PostHog as primary collection/analysis platform and mirror a curated subset of events into internal executive analytics storage.
- Rationale: Preserves rapid product analytics capabilities while maintaining continuity for existing executive dashboard KPI contracts.
- Alternatives considered:
  - Internal-only analytics pipeline (rejected: slower iteration, higher operational burden)
  - Vendor-only analytics with no internal mirror (rejected: weak internal dashboard alignment and governance risk)

## Decision 3: Typed event contract boundary with compile-time and runtime validation
- Decision: Define event schemas as typed contracts at emission boundaries, including required properties and normalization rules.
- Rationale: Ensures type safety, prevents malformed payloads, and raises quality before production ingestion.
- Alternatives considered:
  - Runtime-only validation (rejected: weaker developer feedback loop)
  - Compile-time-only checks (rejected: cannot protect dynamic payload and user-agent variability)

## Decision 4: Fail-open delivery with bounded retry and dedupe keys
- Decision: Event emission must never block product workflows; use best-effort delivery, bounded retries, and optional dedupe keys for sensitive counters.
- Rationale: Protects user experience and aligns with non-negotiable reliability constraints.
- Alternatives considered:
  - Strict guaranteed delivery on user request path (rejected: unacceptable UX and reliability coupling)
  - No retry policy (rejected: unnecessary data loss during transient failures)

## Decision 5: Identity stitching policy (anonymous to authenticated)
- Decision: Capture anonymous session identity first, then stitch to authenticated identity at login/signup completion using approved linkage policy.
- Rationale: Enables complete funnel analysis while preserving privacy and role separation.
- Alternatives considered:
  - Authenticated-only tracking (rejected: misses critical top-of-funnel behavior)
  - Persistent device fingerprinting (rejected: privacy and governance concerns)

## Decision 6: PII and sensitive-data guardrails at payload assembly
- Decision: Apply an allowlist property strategy and explicit forbidden-field checks before transmission and before internal mirroring.
- Rationale: Reduces privacy leakage risk and simplifies compliance reviews.
- Alternatives considered:
  - Blocklist-only filtering (rejected: easier to bypass with new fields)
  - Raw payload forwarding (rejected: violates security/privacy principles)

## Decision 7: Observability and data-quality SLOs
- Decision: Track analytics pipeline health with delivery success rate, required-property completeness, and reconciliation variance against executive metrics.
- Rationale: Makes analytics reliability measurable and actionable.
- Alternatives considered:
  - No explicit SLOs (rejected: hidden quality degradation)
  - Manual spot checks only (rejected: non-scalable)

## Decision 8: Rollout via phased feature flags and backfill-safe introduction
- Decision: Roll out by surface (public pages, funnel, opportunities, search/AI) behind flags with staged verification; avoid historical backfill assumptions.
- Rationale: Limits blast radius and supports operational confidence.
- Alternatives considered:
  - Big-bang rollout (rejected: high regression risk)
  - Full historical backfill mandate (rejected: low ROI for initial production launch)
