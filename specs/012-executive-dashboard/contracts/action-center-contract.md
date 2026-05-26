# Contract: Action Center

## Purpose

The Action Center aggregates operational work from analytics signals and lets authorized users track
ownership and resolution. It does not perform automated learner contact, record edits, or external
side effects.

## Action Item

```ts
interface ActionItem {
  id: string;
  ruleId: string;
  sourceKey: string;
  severity: "critical" | "high" | "medium" | "low";
  sourcePage: string;
  sourceSection: string;
  entityType:
    | "learner"
    | "course"
    | "lesson"
    | "inquiry"
    | "email_delivery"
    | "certificate"
    | "opportunity"
    | "ai_query"
    | "security_signal"
    | "data_freshness";
  entityId: string;
  title: string;
  recommendedAction: string;
  assignedOwnerId: string | null;
  dueAt: string | null;
  status: "open" | "in_progress" | "resolved" | "dismissed" | "escalated";
  firstSeenAt: string;
  lastSeenAt: string;
  dismissedAt: string | null;
  resolvedAt: string | null;
  reopenedCount: number;
  updatedAt: string;
  state: SectionState;
}
```

## Source Key

`sourceKey = {ruleId}:{entityType}:{entityId}:{version}`

Examples:

- `stalled-learner:learner:user_123:2026-05-24`
- `critical-drop:lesson:lesson_uuid:v1`
- `inquiry-sla:inquiry:inquiry_uuid:v1`

## Rule Inputs

Phase 1 rule strategies:

- Stalled learners: active subscription + no progress event in 14 days.
- Low-completion courses: enrollment threshold + completion rate threshold.
- Critical-drop lessons: > 20 percentage point completion drop from previous lesson.
- SLA-breached inquiries: no first response within 48 hours by default.
- Failed email deliveries: failed or circuit-open providers in selected period.
- Pending certificates: completed/eligible progress without issued certificate.
- Expiring opportunities: 7/14/30-day deadlines where data exists.
- Data freshness failures: stale, very stale, or unavailable critical sections.
- Security spikes: banned/unverified/session anomaly thresholds.

## Status Transitions

Valid transitions:

- `open -> in_progress`
- `open -> dismissed`
- `open -> escalated`
- `in_progress -> resolved`
- `in_progress -> escalated`
- `escalated -> in_progress`
- `escalated -> resolved`

All status changes write an admin audit event.

## Reopening

- Dismissed items reopen to `open` when the source rule still holds at the next evaluation.
- Resolved items reopen to `open` when the source rule recurs within 30 days.
- Resolved items create a new item when the source rule recurs after 30 days.
- Reopened items increment `reopenedCount` and keep their audit history.

## Sorting

Default sort:

1. Severity: critical, high, medium, low
2. Unassigned before assigned at same severity
3. Due date ascending
4. Last seen descending

## Audit Event

Action item updates write:

- `action`: `executive.action_item.status_changed` or related specific action
- `entityType`: `action_item`
- `entityId`: Action item id or source key
- `before`: previous status/owner/due date
- `after`: new status/owner/due date/resolution note
- `adminId`: acting user id
