import { integer, pgEnum, pgTable, timestamp, uuid, varchar, text, primaryKey, index, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth-schema"; 
import { dbCourses } from "./courses-db.schema";

export const activityTypeEnum = pgEnum("activity_type", [
  "quiz",
  "exam",
  "forum_post",
  "assignment_submit",
  "lesson_completion",
  "course_completion",
  "lesson_task",
]);

export const pointEvents = pgTable(
  "point_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => dbCourses.id, { onDelete: "cascade" }),
    activityType: activityTypeEnum("activity_type").notNull(),
    activityId: uuid("activity_id"),
    points: integer("points").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    courseWindowIdx: index("pe_course_window_idx").on(
      table.courseId,
      table.createdAt,
      table.userId,
      table.activityType,
    ),
    userCourseIdx: index("pe_user_course_idx").on(table.userId, table.courseId),
    idempotencyIdx: uniqueIndex("pe_idempotency_key_idx").on(
      table.idempotencyKey,
    ),
  }),
);

export const leaderboardOptOuts = pgTable(
  "leaderboard_opt_outs",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => dbCourses.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.courseId] }),
  }),
);
