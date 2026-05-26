import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { dbLessons } from "@/db/schema/admin-db.schema";
import {
  dbCourseProgress,
  dbCourses,
  dbInquiries,
  dbProgressSyncEvents,
  dbSubscriptions,
} from "@/db/schema/courses-db.schema";
import {
  dbExecutiveAnalyticsEvents,
  dbExecutiveMetricFreshness,
} from "@/db/schema/executive-analytics.schema";
import {
  createExecutiveSeedFixtureBundle,
  type ExecutiveSeedFixtureBundle,
} from "../fixtures/executive-fixtures";

type SeededExecutiveFixtures = {
  bundle: ExecutiveSeedFixtureBundle;
  teardown: () => Promise<void>;
};

function nonEmpty<T>(values: readonly T[]): values is [T, ...T[]] {
  return values.length > 0;
}

export async function teardownExecutiveFixtures(
  bundle: ExecutiveSeedFixtureBundle,
): Promise<void> {
  await db.transaction(async (tx) => {
    const freshnessIds = bundle.metricFreshness.map((row) => row.sectionId);
    if (nonEmpty(freshnessIds)) {
      await tx
        .delete(dbExecutiveMetricFreshness)
        .where(inArray(dbExecutiveMetricFreshness.sectionId, freshnessIds));
    }

    const analyticsIds = bundle.analyticsEvents.map((row) => row.id).filter((value): value is string => Boolean(value));
    if (nonEmpty(analyticsIds)) {
      await tx
        .delete(dbExecutiveAnalyticsEvents)
        .where(inArray(dbExecutiveAnalyticsEvents.id, analyticsIds));
    }

    const inquiryIds = bundle.inquiries.map((row) => row.id).filter((value): value is string => Boolean(value));
    if (nonEmpty(inquiryIds)) {
      await tx
        .delete(dbInquiries)
        .where(inArray(dbInquiries.id, inquiryIds));
    }

    const progressEventIds = bundle.progressEvents.map((row) => row.id).filter((value): value is string => Boolean(value));
    if (nonEmpty(progressEventIds)) {
      await tx
        .delete(dbProgressSyncEvents)
        .where(inArray(dbProgressSyncEvents.id, progressEventIds));
    }

    const progressIds = bundle.courseProgress.map((row) => row.id).filter((value): value is string => Boolean(value));
    if (nonEmpty(progressIds)) {
      await tx
        .delete(dbCourseProgress)
        .where(inArray(dbCourseProgress.id, progressIds));
    }

    const subscriptionIds = bundle.subscriptions.map((row) => row.id).filter((value): value is string => Boolean(value));
    if (nonEmpty(subscriptionIds)) {
      await tx
        .delete(dbSubscriptions)
        .where(inArray(dbSubscriptions.id, subscriptionIds));
    }

    const lessonIds = bundle.lessons.map((row) => row.id).filter((value): value is string => Boolean(value));
    if (nonEmpty(lessonIds)) {
      await tx
        .delete(dbLessons)
        .where(inArray(dbLessons.id, lessonIds));
    }

    const courseIds = bundle.courses.map((row) => row.id).filter((value): value is string => Boolean(value));
    if (nonEmpty(courseIds)) {
      await tx
        .delete(dbCourses)
        .where(inArray(dbCourses.id, courseIds));
    }

    const userIds = bundle.users.map((row) => row.id).filter((value): value is string => Boolean(value));
    if (nonEmpty(userIds)) {
      await tx
        .delete(user)
        .where(inArray(user.id, userIds));
    }
  });
}

export async function seedExecutiveFixtures(
  bundle: ExecutiveSeedFixtureBundle = createExecutiveSeedFixtureBundle(),
): Promise<SeededExecutiveFixtures> {
  await db.transaction(async (tx) => {
    if (bundle.users.length > 0) {
      await tx.insert(user).values(bundle.users);
    }
    if (bundle.courses.length > 0) {
      await tx.insert(dbCourses).values(bundle.courses);
    }
    if (bundle.lessons.length > 0) {
      await tx.insert(dbLessons).values(bundle.lessons);
    }
    if (bundle.subscriptions.length > 0) {
      await tx.insert(dbSubscriptions).values(bundle.subscriptions);
    }
    if (bundle.courseProgress.length > 0) {
      await tx.insert(dbCourseProgress).values(bundle.courseProgress);
    }
    if (bundle.progressEvents.length > 0) {
      await tx.insert(dbProgressSyncEvents).values(bundle.progressEvents);
    }
    if (bundle.inquiries.length > 0) {
      await tx.insert(dbInquiries).values(bundle.inquiries);
    }
    if (bundle.analyticsEvents.length > 0) {
      await tx.insert(dbExecutiveAnalyticsEvents).values(bundle.analyticsEvents);
    }
    if (bundle.metricFreshness.length > 0) {
      await tx.insert(dbExecutiveMetricFreshness).values(bundle.metricFreshness);
    }
  });

  return {
    bundle,
    teardown: () => teardownExecutiveFixtures(bundle),
  };
}
