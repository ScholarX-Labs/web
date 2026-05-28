# Contract: Executive KPI Mapping

## Purpose
Define deterministic mapping from tracked events to executive dashboard metrics.

## Metric Mapping Table

| Metric ID | Source Events | Aggregation | Filters | Notes |
|---|---|---|---|---|
| growth.website_visits | website_visit | count | public surfaces only | Primary top-of-funnel traffic |
| growth.cta_clicks_total | cta_click | count | public surfaces only | Includes all tracked acquisition CTAs |
| growth.signup_starts | signup_started | count | none | Funnel numerator |
| growth.signup_completions | signup_completed | count | none | Funnel progression |
| growth.signup_conversion_rate | signup_completed, website_visit | rate_component | shared window | completion / visits |
| growth.opportunity_actions | opportunity_apply_click | count | none | Opportunity intent signal |
| ai.total_searches | ai_search_performed | count | none | Usage volume |
| ai.zero_result_searches | ai_search_performed | count | zero_result=true | Quality risk signal |
| ai.zero_result_rate | ai_search_performed | rate_component | shared window | zero-result / total |

## Reconciliation Requirements
- Date window and timezone normalization must be identical across systems.
- Internal mirror counters should reconcile with external tracking counts within approved variance.
- Any event definition update affecting mapped metrics requires change record and effective date.

## Segmentation Rules
- Admin/internal traffic excluded from growth KPI defaults.
- Segment toggles should allow explicit inclusion for diagnostics.

## Data Gap Behavior
- Missing instrumentation for a metric must render as data_gap state, not zero.
- True zero is only valid when source event is instrumented and observed count is zero.
