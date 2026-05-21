import {
  sql,
} from "drizzle-orm";
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
  check,
} from "drizzle-orm/pg-core";
import { user as dbUsers } from "@/db/schema/auth-schema";

export const coursesSchema = pgSchema("courses");

export const dbCourseCategories = coursesSchema.table(
  "course_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 80 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    iconKey: varchar("icon_key", { length: 50 }).notNull().default("tag"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    courseCategoriesNameUq: uniqueIndex("course_categories_name_uq").on(
      table.name,
    ),
    courseCategoriesSlugUq: uniqueIndex("course_categories_slug_uq").on(
      table.slug,
    ),
    courseCategoriesActiveSortIdx: index(
      "course_categories_active_sort_idx",
    ).on(table.isActive, table.sortOrder),
  }),
);

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
  curriculumVersion: integer("curriculum_version").notNull().default(1),
  requiredLessonsCount: integer("required_lessons_count")
    .notNull()
    .default(0),
  certificateEnabled: boolean("certificate_enabled").notNull().default(true),
  urgencyText: varchar("urgency_text", { length: 255 }),
  tags: jsonb("tags").$type<string[] | null>(),
  requiresForm: boolean("requires_form"),
  autoApproveApplications: boolean("auto_approve_applications")
    .notNull()
    .default(false),
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
    lastClientEventId: uuid("last_client_event_id"),
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
    progressUserCourseCompletedIdx: index(
      "progress_user_course_completed_idx",
    ).on(table.userId, table.courseId, table.completed),
    lessonProgressWatchedPctChk: check(
      "lesson_progress_watched_percentage_chk",
      sql`${table.watchedPercentage} BETWEEN 0 AND 100`,
    ),
    lessonProgressLastPositionChk: check(
      "lesson_progress_last_position_chk",
      sql`${table.lastPosition} >= 0`,
    ),
  }),
);

export type CourseProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "stale_after_curriculum_change"
  | "revoked";

export type ProgressSyncEventType =
  | "heartbeat"
  | "pause"
  | "seek"
  | "completion"
  | "manual_complete";

export type CertificateCompletionSource =
  | "normal"
  | "backfill_approximate"
  | "admin_override";

export interface CertificateMetadata {
  learnerDisplayName: string;
  courseTitle: string;
  completionDate: string;
  completionSource: CertificateCompletionSource;
  ruleVersion: string;
  requiredLessonCount: number;
  certificateTemplateVersion: string;
}

export const dbCourseProgress = coursesSchema.table(
  "course_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => dbUsers.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => dbCourses.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 32 })
      .$type<CourseProgressStatus>()
      .notNull()
      .default("not_started"),
    completedLessons: integer("completed_lessons").notNull().default(0),
    requiredLessons: integer("required_lessons").notNull().default(0),
    progressPercentage: integer("progress_percentage").notNull().default(0),
    completedAt: timestamp("completed_at"),
    certificateEligibleAt: timestamp("certificate_eligible_at"),
    lastLessonId: uuid("last_lesson_id"),
    lastPosition: integer("last_position").notNull().default(0),
    version: integer("version").notNull().default(0),
    curriculumVersion: integer("curriculum_version").notNull().default(1),
    ruleVersion: varchar("rule_version", { length: 32 })
      .notNull()
      .default("v1"),
    completedByBackfill: boolean("completed_by_backfill")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    courseProgressUserCourseUq: uniqueIndex(
      "course_progress_user_course_uq",
    ).on(table.userId, table.courseId),
    courseProgressCompletedUserCourseIdx: index(
      "course_progress_completed_user_course_idx",
    )
      .on(table.userId, table.courseId)
      .where(sql`${table.status} = 'completed'`),
    courseProgressPctChk: check(
      "course_progress_percentage_chk",
      sql`${table.progressPercentage} BETWEEN 0 AND 100`,
    ),
    courseProgressCompletedLessonsChk: check(
      "course_progress_completed_lessons_chk",
      sql`${table.completedLessons} >= 0`,
    ),
    courseProgressRequiredLessonsChk: check(
      "course_progress_required_lessons_chk",
      sql`${table.requiredLessons} >= 0`,
    ),
    courseProgressLastPositionChk: check(
      "course_progress_last_position_chk",
      sql`${table.lastPosition} >= 0`,
    ),
    courseProgressVersionChk: check(
      "course_progress_version_chk",
      sql`${table.version} >= 0`,
    ),
  }),
);

export const dbProgressSyncEvents = coursesSchema.table(
  "progress_sync_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientEventId: uuid("client_event_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => dbUsers.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => dbCourses.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id").notNull(),
    eventType: varchar("event_type", { length: 32 })
      .$type<ProgressSyncEventType>()
      .notNull(),
    requestHash: varchar("request_hash", { length: 128 }).notNull(),
    responseSnapshot: jsonb("response_snapshot"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    progressSyncEventsUserClientEventUq: uniqueIndex(
      "progress_sync_events_user_client_event_uq",
    ).on(table.userId, table.clientEventId),
    progressSyncEventsCreatedAtIdx: index(
      "progress_sync_events_created_at_idx",
    ).on(table.createdAt),
  }),
);

export const dbCertificates = coursesSchema.table(
  "certificates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    certificateNumber: varchar("certificate_number", {
      length: 64,
    }).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => dbUsers.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => dbCourses.id, { onDelete: "cascade" }),
    courseProgressId: uuid("course_progress_id")
      .notNull()
      .references(() => dbCourseProgress.id),
    issuedAt: timestamp("issued_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
    revocationReason: text("revocation_reason"),
    metadata: jsonb("metadata").$type<CertificateMetadata>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    certificatesNumberUq: uniqueIndex("certificates_number_uq").on(
      table.certificateNumber,
    ),
    certificatesUserCourseUq: uniqueIndex("certificates_user_course_uq").on(
      table.userId,
      table.courseId,
    ),
    certificatesCourseProgressIdx: index(
      "certificates_course_progress_idx",
    ).on(table.courseProgressId),
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

export type CourseApplicationStatus =
  | "pending"
  | "reviewing"
  | "approved"
  | "rejected"
  | "waitlisted"
  | "withdrawn";

export type LearnerStatus =
  | "high_school"
  | "undergraduate"
  | "graduate"
  | "professional";

export const dbCourseApplications = coursesSchema.table(
  "course_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => dbCourses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => dbUsers.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 32 })
      .$type<CourseApplicationStatus>()
      .notNull()
      .default("pending"),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    age: integer("age").notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    learnerStatus: varchar("learner_status", { length: 32 })
      .$type<LearnerStatus>()
      .notNull(),
    highSchoolName: varchar("high_school_name", { length: 255 }),
    university: varchar("university", { length: 255 }),
    faculty: varchar("faculty", { length: 255 }),
    graduationYear: integer("graduation_year"),
    workField: varchar("work_field", { length: 255 }),
    yearsOfExperience: integer("years_of_experience"),
    personalStatement: text("personal_statement").notNull(),
    learningGoals: text("learning_goals").notNull(),
    background: text("background").notNull(),
    formVersion: varchar("form_version", { length: 32 }).notNull().default("v1"),
    extraAnswers: jsonb("extra_answers").$type<Record<string, unknown> | null>(),
    sourceSurface: varchar("source_surface", { length: 50 }),
    idempotencyKey: varchar("idempotency_key", { length: 255 }),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: text("reviewed_by").references(() => dbUsers.id, {
      onDelete: "set null",
    }),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    courseApplicationsActiveUq: uniqueIndex(
      "course_applications_active_user_course_uq",
    )
      .on(table.courseId, table.userId)
      .where(
        sql`${table.status} in ('pending','reviewing','approved','waitlisted')`,
      ),
    courseApplicationsLookupIdx: index(
      "course_applications_user_course_idx",
    ).on(table.userId, table.courseId),
    courseApplicationsAdminCourseStatusIdx: index(
      "course_applications_course_status_submitted_idx",
    ).on(table.courseId, table.status, table.submittedAt),
    courseApplicationsAdminStatusIdx: index(
      "course_applications_status_submitted_idx",
    ).on(table.status, table.submittedAt),
    courseApplicationsLearnerStatusIdx: index(
      "course_applications_learner_status_submitted_idx",
    ).on(table.learnerStatus, table.submittedAt),
    courseApplicationsIdempotencyIdx: uniqueIndex(
      "course_applications_user_course_idempotency_uq",
    )
      .on(table.userId, table.courseId, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
    courseApplicationsAgeChk: check(
      "course_applications_age_chk",
      sql`${table.age} between 10 and 100`,
    ),
    courseApplicationsExperienceChk: check(
      "course_applications_years_of_experience_chk",
      sql`${table.yearsOfExperience} is null or ${table.yearsOfExperience} >= 0`,
    ),
  }),
);
export { dbUsers };
