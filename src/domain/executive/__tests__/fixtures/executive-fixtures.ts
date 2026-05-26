import { randomUUID } from "node:crypto";
import type { ExecutivePageQuery } from "../../contracts/executive-query.schemas";
import type {
  CoursesManagementSnapshot,
  FinanceAggregateSnapshot,
  FinanceCourseSnapshot,
  OverviewAggregateSnapshot,
  OverviewTrendSnapshot,
  RegisteredEventSnapshot,
  UsersManagementSnapshot,
} from "../../application/executive-dashboard.service";
import { dbCourseProgress, dbCourses, dbInquiries, dbProgressSyncEvents, dbSubscriptions } from "@/db/schema/courses-db.schema";
import { dbLessons } from "@/db/schema/admin-db.schema";
import { dbExecutiveAnalyticsEvents, dbExecutiveMetricFreshness } from "@/db/schema/executive-analytics.schema";
import { user } from "@/db/schema/auth-schema";

export const executiveBaseQuery: ExecutivePageQuery = {
  from: "2026-05-01",
  to: "2026-05-25",
  page: 1,
  pageSize: 25,
  direction: "desc",
};

export function createOverviewFixture(): {
  current: OverviewAggregateSnapshot;
  previous: OverviewAggregateSnapshot;
  trends: readonly OverviewTrendSnapshot[];
} {
  return {
    current: {
      grossRevenue: 12_000,
      subscriptions: 100,
      activeSubscriptions: 82,
      cancelledSubscriptions: 8,
      users: 140,
      courseCompletions: 35,
      activeCourses: 12,
    },
    previous: {
      grossRevenue: 10_000,
      subscriptions: 80,
      activeSubscriptions: 72,
      cancelledSubscriptions: 4,
      users: 120,
      courseCompletions: 20,
      activeCourses: 10,
    },
    trends: [
      { date: "2026-05-01", revenue: 500, completions: 2 },
      { date: "2026-05-02", revenue: 700, completions: 4 },
    ],
  };
}

export function createFinanceFixture(): {
  current: FinanceAggregateSnapshot;
  previous: FinanceAggregateSnapshot;
  courses: readonly FinanceCourseSnapshot[];
  selectedCourse: FinanceCourseSnapshot;
} {
  const selectedCourse: FinanceCourseSnapshot = {
    courseId: "course-1",
    title: "Data Science",
    category: "STEM",
    grossRevenue: 9_000,
    refundedRevenue: 2_500,
    enrollments: 30,
    completions: 12,
    supportInquiryCount: 6,
  };

  return {
    current: {
      grossRevenue: 12_000,
      refundedRevenue: 1_000,
      enrollments: 40,
      paidEnrollments: 30,
      manualEnrollments: 10,
      activeLearners: 20,
      completions: 18,
      supportInquiries: 8,
    },
    previous: {
      grossRevenue: 10_000,
      refundedRevenue: 500,
      enrollments: 30,
      paidEnrollments: 22,
      manualEnrollments: 8,
      activeLearners: 16,
      completions: 12,
      supportInquiries: 5,
    },
    courses: [
      selectedCourse,
      {
        courseId: "course-2",
        title: "Cloud Basics",
        category: "Ops",
        grossRevenue: 3_000,
        refundedRevenue: 100,
        enrollments: 10,
        completions: 6,
        supportInquiryCount: 2,
      },
    ],
    selectedCourse,
  };
}

export function createRegisteredEventsFixture(): readonly RegisteredEventSnapshot[] {
  return [
    {
      eventId: "evt-1",
      title: "ScholarX Mentorship Kickoff",
      registrations: 120,
      attendanceTracked: false,
      attendees: null,
      postEventSignups: null,
      postEventEnrollments: null,
    },
    {
      eventId: "evt-2",
      title: "AI for Students Workshop",
      registrations: 45,
      attendanceTracked: true,
      attendees: 30,
      postEventSignups: 8,
      postEventEnrollments: 3,
    },
  ];
}

export function createManagementFixture(): {
  users: readonly UsersManagementSnapshot[];
  courses: readonly CoursesManagementSnapshot[];
} {
  return {
    users: [
      {
        userId: "user-1",
        email: "u1@example.com",
        name: "User One",
        role: "user",
        createdAt: "2026-05-02T10:00:00.000Z",
        isEmailVerified: true,
        isBanned: false,
      },
    ],
    courses: [
      {
        courseId: "course-1",
        title: "Data Science",
        category: "STEM",
        status: "active",
        ownerId: "owner-1",
        createdAt: "2026-05-01T00:00:00.000Z",
        updatedAt: "2026-05-10T00:00:00.000Z",
        lessons: 12,
        enrollments: 20,
        completions: 10,
      },
    ],
  };
}

export type ExecutiveSeedFixtureBundle = {
  users: Array<typeof user.$inferInsert>;
  courses: Array<typeof dbCourses.$inferInsert>;
  lessons: Array<typeof dbLessons.$inferInsert>;
  subscriptions: Array<typeof dbSubscriptions.$inferInsert>;
  courseProgress: Array<typeof dbCourseProgress.$inferInsert>;
  progressEvents: Array<typeof dbProgressSyncEvents.$inferInsert>;
  inquiries: Array<typeof dbInquiries.$inferInsert>;
  analyticsEvents: Array<typeof dbExecutiveAnalyticsEvents.$inferInsert>;
  metricFreshness: Array<typeof dbExecutiveMetricFreshness.$inferInsert>;
};

export function createExecutiveSeedFixtureBundle(): ExecutiveSeedFixtureBundle {
  const adminId = `admin-${randomUUID()}`;
  const learnerId = `learner-${randomUUID()}`;
  const courseId = randomUUID();
  const lessonId = randomUUID();
  const subscriptionId = randomUUID();
  const progressId = randomUUID();

  return {
    users: [
      {
        id: adminId,
        name: "Admin User",
        email: `${adminId}@example.com`,
        emailVerified: true,
        role: "admin",
        firstName: "Admin",
        lastName: "User",
        createdAt: new Date("2026-05-01T09:00:00.000Z"),
        updatedAt: new Date("2026-05-01T09:00:00.000Z"),
      },
      {
        id: learnerId,
        name: "Learner User",
        email: `${learnerId}@example.com`,
        emailVerified: true,
        role: "user",
        firstName: "Learner",
        lastName: "User",
        registeredEvents: ["evt-1", "evt-2"],
        createdAt: new Date("2026-05-02T09:00:00.000Z"),
        updatedAt: new Date("2026-05-02T09:00:00.000Z"),
      },
    ],
    courses: [
      {
        id: courseId,
        slug: `course-${courseId}`,
        title: "Executive Analytics Foundations",
        description: "Fixture course for executive analytics tests.",
        category: "STEM",
        currentPrice: 300,
        instructorId: adminId,
        status: "active",
        createdAt: new Date("2026-05-01T09:00:00.000Z"),
        updatedAt: new Date("2026-05-10T09:00:00.000Z"),
      },
    ],
    lessons: [
      {
        id: lessonId,
        courseId,
        title: "Dashboard Fundamentals",
        sortIndex: 0,
        status: "active",
        isArchived: false,
        createdAt: new Date("2026-05-01T09:00:00.000Z"),
        updatedAt: new Date("2026-05-10T09:00:00.000Z"),
      },
    ],
    subscriptions: [
      {
        id: subscriptionId,
        userId: learnerId,
        courseId,
        amount: 300,
        status: "active",
        isActive: true,
        enrolledAt: new Date("2026-05-03T10:00:00.000Z"),
      },
    ],
    courseProgress: [
      {
        id: progressId,
        userId: learnerId,
        courseId,
        status: "completed",
        completedLessons: 1,
        requiredLessons: 1,
        progressPercentage: 100,
        completedAt: new Date("2026-05-12T10:00:00.000Z"),
        createdAt: new Date("2026-05-03T10:00:00.000Z"),
        updatedAt: new Date("2026-05-12T10:00:00.000Z"),
      },
    ],
    progressEvents: [
      {
        id: randomUUID(),
        clientEventId: randomUUID(),
        userId: learnerId,
        courseId,
        lessonId,
        eventType: "completion",
        requestHash: `hash-${randomUUID()}`,
        responseSnapshot: { completion: true },
        createdAt: new Date("2026-05-12T10:00:00.000Z"),
      },
    ],
    inquiries: [
      {
        id: randomUUID(),
        courseId,
        userId: learnerId,
        name: "Learner User",
        email: `${learnerId}@example.com`,
        status: "pending",
        sourceSurface: "course_page",
        createdAt: new Date("2026-05-15T10:00:00.000Z"),
        updatedAt: new Date("2026-05-15T10:00:00.000Z"),
      },
    ],
    analyticsEvents: [
      {
        id: randomUUID(),
        eventType: "website_visit",
        occurredAt: new Date("2026-05-05T08:00:00.000Z"),
        userId: learnerId,
        source: "home",
        medium: "organic",
        campaign: "spring",
        deviceType: "desktop",
        metadata: {},
        createdAt: new Date("2026-05-05T08:00:00.000Z"),
      },
      {
        id: randomUUID(),
        eventType: "ai_search",
        occurredAt: new Date("2026-05-16T08:00:00.000Z"),
        userId: learnerId,
        entityType: "query",
        entityId: "ai-query-1",
        source: "opportunities_ai",
        medium: "internal",
        campaign: null,
        deviceType: "desktop",
        metadata: { query: "scholarships" },
        createdAt: new Date("2026-05-16T08:00:00.000Z"),
      },
    ],
    metricFreshness: [
      {
        sectionId: "overview.revenue",
        sourceKey: "courses.subscriptions",
        lastSuccessfulAt: new Date("2026-05-25T12:00:00.000Z"),
        lastAttemptedAt: new Date("2026-05-25T12:00:00.000Z"),
        status: "current",
        lastQueryDurationMs: 125,
        rollingP95DurationMs: 140,
        updatedAt: new Date("2026-05-25T12:00:00.000Z"),
      },
    ],
  };
}
