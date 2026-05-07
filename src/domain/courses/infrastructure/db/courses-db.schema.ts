import {
  pgSchema,
  text,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user as dbUsers } from "@/db/schema/auth-schema";

export const coursesSchema = pgSchema("courses");

export const dbCourses = coursesSchema.table("courses", {
  id: uuid("id").primaryKey(),
  slug: varchar("slug", { length: 255 }),
  title: varchar("title", { length: 100 }).notNull(),
  description: varchar("description", { length: 2000 }).notNull(),
  imageUrl: varchar("image_url", { length: 1000 }),
  videoPreviewUrl: varchar("video_preview_url", { length: 1000 }),
  category: varchar("category", { length: 50 }).notNull(),
  level: varchar("level", { length: 50 }),
  currentPrice: integer("current_price").notNull(),
  originalPrice: integer("original_price"),
  instructorId: text("instructor_id").references(() => dbUsers.id),
  status: varchar("status", { length: 50 }).notNull(),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  totalRatings: integer("total_ratings"),
  duration: varchar("duration", { length: 100 }),
  lessonsCount: integer("lessons_count"),
  videosCount: integer("videos_count"),
  studentsCount: integer("students_count"),
  isBestseller: boolean("is_bestseller"),
  urgencyText: varchar("urgency_text", { length: 255 }),
  tags: jsonb("tags").$type<string[] | null>(),
  requiresForm: boolean("requires_form"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const dbSubscriptions = coursesSchema.table("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => dbUsers.id, { onDelete: "cascade" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => dbCourses.id),
  amount: integer("amount"),
  status: varchar("status", { length: 50 }),
  isActive: boolean("is_active"),
  paymentId: varchar("payment_id", { length: 255 }),
  enrolledAt: timestamp("enrolled_at"),
});

export const dbCourseCompletions = coursesSchema.table(
  "course_completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => dbUsers.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => dbCourses.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    certificateId: varchar("certificate_id", { length: 60 }).notNull().unique(),
    completionPercentage: integer("completion_percentage").notNull().default(0),
    completedLessons: integer("completed_lessons").notNull().default(0),
  },
  (table) => [
    uniqueIndex("course_completions_user_course_uidx").on(
      table.userId,
      table.courseId,
    ),
    check(
      "completion_percentage_range",
      sql`${table.completionPercentage} >= 0 AND ${table.completionPercentage} <= 100`,
    ),
    check(
      "completed_lessons_non_negative",
      sql`${table.completedLessons} >= 0`,
    ),
  ],
);

export { dbUsers };
