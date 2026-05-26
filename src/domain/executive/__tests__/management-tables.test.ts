import assert from "node:assert/strict";
import test from "node:test";
import { ExecutiveDashboardService } from "../application/executive-dashboard.service";
import type { ExecutivePageQuery } from "../contracts/executive-query.schemas";

const query: ExecutivePageQuery = {
  from: "2026-05-01",
  to: "2026-05-25",
  page: 1,
  pageSize: 25,
  direction: "desc",
};

test("users read model includes management table rows and admin links", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildUsersReadModel({
    query,
    current: { newUsers: 10, totalUsers: 100, activeUsers: 30, verifiedUsers: 80, bannedUsers: 2 },
    previous: { newUsers: 8, totalUsers: 90, activeUsers: 24, verifiedUsers: 70, bannedUsers: 2 },
    registrationTrend: [{ date: "2026-05-01", newUsers: 4 }],
    roleDistribution: [{ role: "admin", value: 10 }, { role: "user", value: 90 }],
    activityEvents: [{ occurredAt: "2026-05-03T09:00:00.000Z" }],
    monthlyActivity: [{ month: "2026-05", value: 1 }],
    managementRows: [{
      userId: "user-1",
      email: "u1@example.com",
      name: "User One",
      role: "user",
      createdAt: "2026-05-02T10:00:00.000Z",
      isEmailVerified: true,
      isBanned: false,
    }],
  });

  assert.equal(model.sections.managementTable.rows.length, 1);
  assert.equal(model.sections.managementTable.rows[0].adminHref, "/admin/users/user-1");
});

test("courses read model includes management table completion rate and links", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildCoursesLessonsReadModel({
    query,
    current: { totalCourses: 2, activeCourses: 1, totalLessons: 8, totalEnrollments: 20, totalCompletions: 10 },
    previous: { totalCourses: 1, activeCourses: 1, totalLessons: 6, totalEnrollments: 12, totalCompletions: 6 },
    leaderboard: [{
      courseId: "course-1",
      title: "Data Science",
      category: "STEM",
      status: "active",
      enrollments: 20,
      completions: 10,
      completionRate: 0.5,
      revenue: 1000,
      qualityFlags: [],
    }],
    categoryDistribution: [{ category: "STEM", value: 2 }],
    managementRows: [{
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
    }],
  });

  assert.equal(model.sections.managementTable.rows.length, 1);
  assert.equal(model.sections.managementTable.rows[0].completionRate, 0.5);
  assert.equal(model.sections.managementTable.rows[0].adminHref, "/admin/courses/course-1");
});
