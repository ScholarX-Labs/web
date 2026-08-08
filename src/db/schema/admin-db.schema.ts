import {
  text,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user as dbUsers } from "@/db/schema/auth-schema";
import { dbCourses } from "@/db/schema/courses-db.schema";
import { authSchema, coursesSchema } from "./namespaces";

export const dbLessons = coursesSchema.table(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => dbCourses.id),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    content: text("content"),
    videoUrl: varchar("video_url", { length: 500 }),
    duration: integer("duration"),
    sortIndex: integer("sort_index").notNull().default(0),
    isPrivate: boolean("is_private").default(true),
    status: varchar("status", { length: 20 }).default("draft").notNull(),
    isArchived: boolean("is_archived").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    lessonsCourseIdIdx: index("lessons_course_id_idx").on(table.courseId),
    lessonsSortIdx: index("lessons_sort_idx").on(
      table.courseId,
      table.sortIndex,
    ),
    lessonsCourseSortUq: uniqueIndex("lessons_course_sort_uq").on(
      table.courseId,
      table.sortIndex,
    ),
  }),
);

export const adminAuditLog = authSchema.table(
  "admin_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: text("admin_id")
      .notNull()
      .references(() => dbUsers.id),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: varchar("entity_id", { length: 255 }),
    before: jsonb("before"),
    after: jsonb("after"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    auditLogActionIdx: index("admin_audit_log_action_idx").on(table.action),
    auditLogEntityIdx: index("admin_audit_log_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
    auditLogAdminIdx: index("admin_audit_log_admin_idx").on(table.adminId),
    auditLogCreatedAtIdx: index("admin_audit_log_created_at_idx").on(
      table.createdAt,
    ),
  }),
);
