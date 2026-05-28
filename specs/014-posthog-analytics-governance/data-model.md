# Data Model: PostHog Analytics Governance

## 1) EventDefinition
- Purpose: Canonical definition for each tracked behavior.
- Fields:
  - eventName (string, required, unique, lower_snake_case)
  - domain (enum: website|funnel|opportunity|search_ai|course|engagement|admin_internal)
  - description (string, required)
  - ownerTeam (string, required)
  - version (integer, required, starts at 1)
  - status (enum: active|deprecated|sunset)
  - firstReleaseAt (datetime, required)
  - deprecatedAt (datetime, nullable)
  - kpiMappings (array<KpiMappingRef>, required)
  - requiredProperties (array<PropertyRef>, required)
  - optionalProperties (array<PropertyRef>, optional)

Validation rules:
- eventName must be stable once active; rename requires deprecate+replace process.
- active definitions must have at least one owner and one required property.

## 2) EventPropertyContract
- Purpose: Field-level constraints used at emission and ingestion boundaries.
- Fields:
  - propertyName (string, required)
  - dataType (enum: string|number|boolean|datetime|enum|object)
  - required (boolean)
  - allowedValues (array<string>, optional for enum)
  - maxLength (number, optional)
  - nullable (boolean, default false)
  - privacyClass (enum: public|internal|sensitive_forbidden)
  - transformRule (string, optional; e.g., bucketize, hash, truncate)

Validation rules:
- sensitive_forbidden properties cannot be emitted.
- required properties cannot be null/empty at transmission boundary.

## 3) EventPayload
- Purpose: Runtime event instance emitted by client/server surfaces.
- Fields:
  - eventName (string, required)
  - occurredAt (datetime, required)
  - eventId (string, required, unique-ish for dedupe window)
  - sessionId (string, optional)
  - anonymousId (string, optional)
  - userId (string, optional)
  - surface (string, required)
  - path (string, optional)
  - attribution (AttributionContext, optional)
  - properties (object, required)
  - ingestionTarget (enum: posthog_only|posthog_and_internal)

Validation rules:
- eventName must match active EventDefinition unless explicitly allowlisted for staged rollout.
- posthog_and_internal requires KPI mapping and internal-safe property subset.

State transitions:
- assembled -> validated -> queued -> sent
- queued -> dropped (bounded retry exceeded or invalid payload)

## 4) AttributionContext
- Purpose: Source context for growth attribution.
- Fields:
  - sourceClass (enum: direct|organic|referral|campaign|internal)
  - mediumClass (enum: none|search|social|email|partner|other)
  - campaignLabel (string, optional)
  - referrerHostClass (string, optional)
  - landingPath (string, optional)

Validation rules:
- unknown values normalize to "other" classes.

## 5) IdentityLinkRecord
- Purpose: Anonymous-to-authenticated linkage record for funnel continuity.
- Fields:
  - anonymousId (string, required)
  - userId (string, required)
  - linkedAt (datetime, required)
  - linkMethod (enum: signup|login|server_association)

Validation rules:
- duplicate links for same anonymousId are last-write-wins with audit trail.

## 6) KpiMapping
- Purpose: Mapping contract from events to executive dashboard metrics.
- Fields:
  - metricId (string, required)
  - sourceEvent (string, required)
  - filterPredicate (string, optional)
  - aggregation (enum: count|unique_users|rate_component)
  - internalMirrorRequired (boolean, required)

Validation rules:
- rate_component mappings must define numerator/denominator pairing at metric level.

## 7) GovernanceChangeRecord
- Purpose: Change control audit for analytics definitions.
- Fields:
  - changeId (string, required)
  - changeType (enum: add|update|deprecate|rename)
  - targetEvent (string, required)
  - requestedBy (string, required)
  - approvedBy (string, required)
  - effectiveDate (date, required)
  - impactSummary (string, required)

Validation rules:
- any update/deprecate/rename affecting KPI-mapped events requires impactSummary.

## Relationships
- EventDefinition 1..* -> EventPropertyContract
- EventDefinition 1..* -> KpiMapping
- EventPayload *..1 -> EventDefinition
- EventPayload 0..1 -> AttributionContext
- IdentityLinkRecord links anonymous and authenticated EventPayload contexts
- GovernanceChangeRecord *..1 -> EventDefinition
