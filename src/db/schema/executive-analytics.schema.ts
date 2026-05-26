import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user as dbUsers } from "@/db/schema/auth-schema";

export const executiveSchema = pgSchema("executive");

export type ExecutiveAnalyticsEventType =
  | "website_visit"
  | "cta_click"
  | "signup_started"
  | "ai_search"
  | "opportunity_apply_click"
  | "opportunity_link_check"
  | "ai_feedback";

export type ExecutiveFreshnessStatus =
  | "current"
  | "stale"
  | "very_stale"
  | "unavailable";

export type ExecutiveActionSeverity = "critical" | "high" | "medium" | "low";

export type ExecutiveActionStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "dismissed"
  | "escalated";

export type PublicImpactApprovalStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "published"
  | "rejected"
  | "expired"
  | "manual_override";

export const dbExecutiveAnalyticsEvents = executiveSchema.table(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: varchar("event_type", { length: 64 })
      .$type<ExecutiveAnalyticsEventType>()
      .notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    userId: text("user_id").references(() => dbUsers.id, {
      onDelete: "set null",
    }),
    sessionIdHash: varchar("session_id_hash", { length: 128 }),
    entityType: varchar("entity_type", { length: 64 }),
    entityId: varchar("entity_id", { length: 255 }),
    source: varchar("source", { length: 255 }),
    medium: varchar("medium", { length: 255 }),
    campaign: varchar("campaign", { length: 255 }),
    deviceType: varchar("device_type", { length: 64 }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    eventTypeOccurredIdx: index("exec_analytics_events_type_occurred_idx").on(
      table.eventType,
      table.occurredAt,
    ),
    userOccurredIdx: index("exec_analytics_events_user_occurred_idx")
      .on(table.userId, table.occurredAt)
      .where(sql`${table.userId} is not null`),
    sessionOccurredIdx: index("exec_analytics_events_session_occurred_idx")
      .on(table.sessionIdHash, table.occurredAt)
      .where(sql`${table.sessionIdHash} is not null`),
  }),
);

export const dbExecutiveActionItemStates = executiveSchema.table(
  "action_item_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ruleId: varchar("rule_id", { length: 80 }).notNull(),
    sourceKey: varchar("source_key", { length: 255 }).notNull(),
    severity: varchar("severity", { length: 16 })
      .$type<ExecutiveActionSeverity>()
      .notNull(),
    sourcePage: varchar("source_page", { length: 64 }).notNull(),
    sourceSection: varchar("source_section", { length: 80 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: varchar("entity_id", { length: 255 }).notNull(),
    assignedOwnerId: text("assigned_owner_id").references(() => dbUsers.id, {
      onDelete: "set null",
    }),
    status: varchar("status", { length: 16 })
      .$type<ExecutiveActionStatus>()
      .notNull()
      .default("open"),
    dueAt: timestamp("due_at"),
    resolutionNote: text("resolution_note"),
    firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
    dismissedAt: timestamp("dismissed_at"),
    resolvedAt: timestamp("resolved_at"),
    reopenedCount: integer("reopened_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    sourceKeyUq: uniqueIndex("exec_action_item_states_source_key_uq").on(
      table.sourceKey,
    ),
    severityStatusIdx: index("exec_action_item_states_severity_status_idx")
      .on(table.severity, table.status, table.dueAt)
      .where(sql`${table.status} in ('open', 'in_progress', 'escalated')`),
  }),
);

export const dbExecutiveMetricFreshness = executiveSchema.table(
  "metric_freshness",
  {
    sectionId: varchar("section_id", { length: 120 }).primaryKey(),
    sourceKey: varchar("source_key", { length: 120 }).notNull(),
    lastSuccessfulAt: timestamp("last_successful_at"),
    lastAttemptedAt: timestamp("last_attempted_at").notNull(),
    status: varchar("status", { length: 16 })
      .$type<ExecutiveFreshnessStatus>()
      .notNull(),
    lastErrorCode: varchar("last_error_code", { length: 120 }),
    lastQueryDurationMs: integer("last_query_duration_ms"),
    rollingP95DurationMs: integer("rolling_p95_duration_ms"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    sourceStatusIdx: index("exec_metric_freshness_source_status_idx").on(
      table.sourceKey,
      table.status,
    ),
  }),
);

export const dbExecutivePublicImpactMetrics = executiveSchema.table(
  "public_impact_metrics",
  {
    metricId: varchar("metric_id", { length: 120 }).primaryKey(),
    label: varchar("label", { length: 255 }).notNull(),
    computedValue: integer("computed_value").notNull(),
    manualOverrideValue: integer("manual_override_value"),
    sourceDescription: text("source_description").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => dbUsers.id),
    approvalStatus: varchar("approval_status", { length: 32 })
      .$type<PublicImpactApprovalStatus>()
      .notNull()
      .default("draft"),
    proposedBy: text("proposed_by").references(() => dbUsers.id, {
      onDelete: "set null",
    }),
    approvedBy: text("approved_by").references(() => dbUsers.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at"),
    rejectedBy: text("rejected_by").references(() => dbUsers.id, {
      onDelete: "set null",
    }),
    rejectedAt: timestamp("rejected_at"),
    rejectionReason: text("rejection_reason"),
    auditTrail: jsonb("audit_trail")
      .$type<readonly Record<string, unknown>[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    autoPublish: boolean("auto_publish").notNull().default(false),
    freshnessAt: timestamp("freshness_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    statusFreshnessIdx: index("exec_public_impact_status_freshness_idx").on(
      table.approvalStatus,
      table.freshnessAt,
    ),
    ownerStatusIdx: index("exec_public_impact_owner_status_idx").on(
      table.ownerId,
      table.approvalStatus,
    ),
  }),
);
