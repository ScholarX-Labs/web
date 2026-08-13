import { sql } from "drizzle-orm";
import { text, uuid, varchar, integer, boolean, timestamp, jsonb, index, uniqueIndex, check } from "drizzle-orm/pg-core";
import { user as dbUsers } from "@/db/schema/auth-schema";
import { dbCourses } from "@/db/schema/courses-db.schema";
import { dbLessons } from "@/db/schema/admin-db.schema";
import { coursesSchema } from "./namespaces";

export type TaskType = "mcq" | "written" | "swot" | "link";
export type TaskStatus = "draft" | "published" | "archived";
export type SubmissionStatus = "pending" | "correct" | "incorrect" | "skipped";

export const lessonTasks = coursesSchema.table("lesson_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id")
    .notNull()
    .references(() => dbLessons.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 16 }).$type<TaskType>().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  instructions: text("instructions"),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  isOptional: boolean("is_optional").notNull().default(true),
  sortIndex: integer("sort_index").notNull().default(0),
  status: varchar("status", { length: 16 })
    .$type<TaskStatus>()
    .notNull()
    .default("draft"),
  config: jsonb("config").$type<unknown>().notNull(),
  version: integer("version").notNull().default(0),
  createdBy: text("created_by").references(() => dbUsers.id, { onDelete: "set null" }),
  updatedBy: text("updated_by").references(() => dbUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  lessonTasksLessonSortUq: uniqueIndex("lesson_tasks_lesson_sort_uq")
    .on(table.lessonId, table.sortIndex),
  lessonTasksLessonStatusIdx: index("lesson_tasks_lesson_status_idx")
    .on(table.lessonId, table.status, table.sortIndex),
  lessonTasksPointsChk: check("lesson_tasks_points_chk",
    sql`${table.pointsAwarded} >= 0`),
}));

export const taskSubmissions = coursesSchema.table("task_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientEventId: uuid("client_event_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => dbUsers.id, { onDelete: "cascade" }),
  taskId: uuid("task_id")
    .notNull()
    .references(() => lessonTasks.id, { onDelete: "cascade" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => dbCourses.id, { onDelete: "cascade" }),
  answer: jsonb("answer").$type<unknown>().notNull(),
  status: varchar("status", { length: 16 })
    .$type<SubmissionStatus>()
    .notNull()
    .default("pending"),
  pointsEarned: integer("points_earned").notNull().default(0),
  taskSnapshot: jsonb("task_snapshot").$type<{ pointsAwarded: number; config: unknown }>()
    .notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  taskSubmissionsUserTaskUq: uniqueIndex("task_submissions_user_task_uq")
    .on(table.userId, table.taskId),
  taskSubmissionsUserClientEventUq: uniqueIndex("task_submissions_user_client_event_uq")
    .on(table.userId, table.clientEventId),
  taskSubmissionsTaskStatusIdx: index("task_submissions_task_status_idx")
    .on(table.taskId, table.status),
  taskSubmissionsPointsChk: check("task_submissions_points_chk",
    sql`${table.pointsEarned} >= 0`),
}));
