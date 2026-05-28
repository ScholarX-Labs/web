# Contract: Event Dictionary (v1)

## Purpose
Define the canonical analytics events and required properties for ScholarX growth and executive alignment.

## Global Envelope
All events MUST include:
- event_name
- occurred_at (ISO-8601 UTC)
- event_id
- surface
- properties (object)

Optional global context:
- session_id
- anonymous_id
- user_id
- path
- attribution.source_class
- attribution.medium_class
- attribution.campaign_label

## P1 Events and Required Properties

### website_visit
- Required: path, device_category, source_class
- Optional: medium_class, campaign_label, referrer_host_class
- Internal mirror: yes

### cta_click
- Required: cta_id, cta_label, cta_placement, destination_type, path
- Optional: destination_id
- Internal mirror: yes

### signup_started
- Required: entry_surface, path
- Optional: cta_id
- Internal mirror: yes

### signup_completed
- Required: auth_method, entry_surface
- Optional: verification_state
- Internal mirror: yes

### first_value_action
- Required: action_type
- Optional: entity_type, entity_id
- Internal mirror: yes

### opportunity_view
- Required: opportunity_id, opportunity_source
- Optional: ranking_bucket
- Internal mirror: no

### opportunity_save
- Required: opportunity_id
- Optional: save_surface
- Internal mirror: no

### opportunity_apply_click
- Required: opportunity_id, apply_target_type
- Optional: apply_target_host_class
- Internal mirror: yes

### search_performed
- Required: query_intent_category, result_count_bucket, latency_bucket
- Optional: zero_result (boolean)
- Internal mirror: no

### ai_search_performed
- Required: query_intent_category, result_count_bucket, latency_bucket
- Optional: zero_result (boolean), feedback_prompted (boolean)
- Internal mirror: yes (aggregated-safe subset)

## Forbidden Properties
Do not emit:
- access tokens, refresh tokens, session internals
- raw secrets or env values
- free-form personal message bodies
- full PII beyond approved stable IDs

## Validation Rules
- Unknown event_name rejected in strict mode (or logged+drop in shadow mode).
- Required properties missing => payload dropped and quality metric incremented.
- Enum-like fields normalized to controlled vocabulary.
- Duplicate event_id inside dedupe window MAY be collapsed for mirrored counters.
