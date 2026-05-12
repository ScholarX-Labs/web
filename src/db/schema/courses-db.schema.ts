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
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
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
  lastLessonIndex: integer("last_lesson_index").notNull().default(0),
  urgencyText: varchar("urgency_text", { length: 255 }),
  tags: jsonb("tags").$type<string[] | null>(),
  requiresForm: boolean("requires_form"),
  salesInquiry: boolean("sales_inquiry"),
  isArchived: boolean("is_archived").default(false),
  seoDescription: text("seo_description"),
  seoKeywords: varchar("seo_keywords", { length: 500 }),
  updatedBy: text("updated_by").references(() => dbUsers.id),
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

export const dbLessonProgress = coursesSchema.table(
  "lesson_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => dbUsers.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id").notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => dbCourses.id, { onDelete: "cascade" }),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completed_at"),
    watchedPercentage: integer("watched_percentage").default(0).notNull(),
    lastPosition: integer("last_position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    progressUserLessonUq: uniqueIndex("progress_user_lesson_uq").on(
      table.userId,
      table.lessonId,
    ),
    progressCourseUserIdx: index("progress_course_user_idx").on(
      table.courseId,
      table.userId,
    ),
  }),
);

export const dbInquiries = coursesSchema.table(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => dbCourses.id),
    userId: text("user_id")
      .notNull()
      .references(() => dbUsers.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    message: text("message"),
    status: varchar("status", { length: 50 }).default("pending").notNull(),
    sourceSurface: varchar("source_surface", { length: 50 }),
    idempotencyKey: varchar("idempotency_key", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (inquiries) => ({
    inquiryUq: uniqueIndex("inquiries_course_user_idempotency_uq").on(
      inquiries.courseId,
      inquiries.userId,
      inquiries.idempotencyKey,
    ),
    inquiryLookupIdx: index("inquiries_course_user_status_idx").on(
      inquiries.courseId,
      inquiries.userId,
      inquiries.status,
    ),
    inquiryCreatedAtIdx: index("inquiries_created_at_idx").on(
      inquiries.createdAt,
    ),
  }),
);
export { dbUsers };
