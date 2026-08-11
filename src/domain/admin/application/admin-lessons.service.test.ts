import test from "node:test";
import assert from "node:assert/strict";
import { createAdminLessonsService } from "@/domain/admin/application/admin-lessons.service";
import { AdminError, AdminErrors } from "@/domain/admin/application/admin-errors";
import type { AdminRepository } from "@/domain/admin/contracts/admin-repository.contract";
import type { AuditLogEntry } from "@/domain/admin/infrastructure/audit/audit-logger";
import type { AdminSession } from "@/domain/admin/contracts/admin-types";
import { CourseCountersSyncService } from "@/domain/admin/application/course-counters-sync.service";

const makeSession = (overrides: Partial<AdminSession> = {}): AdminSession => ({
  userId: "admin-1",
  role: "admin",
  ipAddress: "127.0.0.1",
  userAgent: "test",
  ...overrides,
});

const makeRepo = (overrides: Partial<AdminRepository> = {}): AdminRepository => ({
  listCourses: async () => ({ items: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }),
  getCourse: async () => null,
  createCourse: async (data) => ({ id: "course-1", ...data }),
  updateCourse: async (id, data) => ({ id, ...data }),
  updateCourseStatus: async (id, status) => ({ id, status }),
  archiveCourse: async () => undefined,
  enrollUser: async () => undefined,
  revokeUser: async () => undefined,
  listLessons: async () => [],
  getLesson: async () => null,
  createLesson: async (courseId, data) => ({ id: "lesson-1", courseId, ...data }),
  updateLesson: async (id, data) => ({ id, ...data }),
  toggleLessonVisibility: async (id) => ({ id, isPrivate: true }),
  archiveLesson: async () => undefined,
  reorderLessons: async (courseId, lessonIds) => lessonIds.map((id) => ({ id })),
  listUsers: async () => ({ items: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }),
  getUser: async () => null,
  updateUser: async (id, data) => ({ id, ...data }),
  setUserRole: async (id, role) => ({ id, role }),
  blockUser: async (id, reason) => ({ id, banned: true, banReason: reason }),
  unblockUser: async (id) => ({ id, banned: false }),
  suspendUser: async () => undefined,
  getUserByEmail: async () => null,
  setMustChangePassword: async () => undefined,
  enrollUserWithPayment: async () => ({ id: "enrollment-1" }),
  syncStudentsCount: async () => 0,
  syncLessonsCount: async () => 0,
  listEnrollmentsByCourse: async () => ({ items: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }),
  listSubscriptions: async () => ({ items: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }),
  getSubscription: async () => null,
  updateSubscription: async (id, data) => ({ id, ...data }),
  listInquiries: async () => ({ items: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }),
  getInquiry: async () => null,
  updateInquiryStatus: async (id, status) => ({ id, status }),
  getOverviewStats: async () => ({ totalCourses: 0, totalUsers: 0, totalRevenue: 0, totalSubscriptions: 0, activeSubscriptions: 0, totalInquiries: 0, pendingInquiries: 0, recentInquiries: 0, revenueThisMonth: 0, newUsersThisMonth: 0 }),
  getRevenueReport: async () => ({ totalRevenue: 0, periodRevenue: 0, subscriptions: 0, refunds: 0, byMonth: [], byCourse: [] }),
  getUserReport: async () => ({ totalUsers: 0, newUsers: 0, activeUsers: 0, byMonth: [], byRole: [] }),
  getCourseReport: async () => ({ totalCourses: 0, newCourses: 0, publishedCourses: 0, byCategory: [], topEnrolled: [], averageCompletionRate: 0 }),
  ...overrides,
});

const makeAudit = () => {
  const logs: AuditLogEntry[] = [];
  return {
    log: async (entry: AuditLogEntry) => { logs.push(entry); },
    logs,
  };
};

const makeCounterSync = () => {
  const calls: Array<{ method: string; courseId: string }> = [];
  const stubRepo = makeRepo({
    syncStudentsCount: async (courseId) => { calls.push({ method: "syncStudentsCount", courseId }); return 0; },
    syncLessonsCount: async (courseId) => { calls.push({ method: "syncLessonsCount", courseId }); return 0; },
  });
  return Object.assign(new CourseCountersSyncService(stubRepo), { calls });
};

test("admin lessons service", async (t) => {
  await t.test("list delegates to repository", async () => {
    const repo = makeRepo({ listLessons: async (courseId) => [{ id: "l-1", courseId, title: "Lesson 1" }] });
    const service = createAdminLessonsService(repo, makeAudit(), makeCounterSync());
    const result = await service.list("c-1");
    assert.equal(result.length, 1);
    assert.equal(result[0].id, "l-1");
  });

  await t.test("getById throws notFound when missing", async () => {
    const service = createAdminLessonsService(makeRepo(), makeAudit(), makeCounterSync());
    await assert.rejects(() => service.getById("missing"), (err: AdminError) => {
      assert.equal(err.code, "RESOURCE_NOT_FOUND");
      return true;
    });
  });

  await t.test("getById returns lesson when found", async () => {
    const repo = makeRepo({ getLesson: async () => ({ id: "l-1", title: "Test Lesson" }) });
    const service = createAdminLessonsService(repo, makeAudit(), makeCounterSync());
    const lesson = await service.getById("l-1");
    assert.equal(lesson.title, "Test Lesson");
  });

  await t.test("update throws conflict when two updates use the same expected version", async () => {
    let currentLesson = {
      id: "lesson-1",
      title: "Initial Title",
      courseId: "course-1",
      updatedAt: new Date("2026-08-10T20:00:00.000Z"),
    };

    const repo = makeRepo({
      getLesson: async (id) => (currentLesson && currentLesson.id === id ? currentLesson : null),
      updateLesson: async (id, data, expectedVersion) => {
        if (expectedVersion && currentLesson.updatedAt.getTime() !== expectedVersion.getTime()) {
          throw AdminErrors.conflict("Lesson was modified by another user. Please refresh and try again.");
        }
        currentLesson = {
          ...currentLesson,
          ...data,
          updatedAt: new Date("2026-08-10T20:05:00.000Z"),
        };
        return currentLesson;
      },
    });

    const service = createAdminLessonsService(repo, makeAudit(), makeCounterSync());
    const expectedVersion = "2026-08-10T20:00:00.000Z";

    // First update with expectedVersion succeeds
    const updated1 = await service.update(makeSession(), "lesson-1", {
      title: "First Update",
      expectedVersion,
    });
    assert.equal(updated1.title, "First Update");

    // Second update with the SAME expectedVersion fails with conflict
    await assert.rejects(
      () =>
        service.update(makeSession(), "lesson-1", {
          title: "Second Update",
          expectedVersion,
        }),
      (err: AdminError) => {
        assert.equal(err.code, "CONCURRENCY_CONFLICT");
        assert.equal(err.statusCode, 409);
        return true;
      },
    );
  });

  await t.test("create triggers syncOnLessonCreated", async () => {
    const repo = makeRepo({
      getCourse: async () => ({ id: "c-1", slug: "test-course" }),
      createLesson: async (courseId, data) => ({ id: "l-new", courseId, ...data }),
    });
    const counterSync = makeCounterSync();
    const service = createAdminLessonsService(repo, makeAudit(), counterSync);
    await service.create(makeSession(), "c-1", { title: "New Lesson" });
    assert.ok(
      counterSync.calls.some((c) => c.method === "syncLessonsCount" && c.courseId === "c-1"),
      "syncLessonsCount should be called after lesson creation",
    );
  });

  await t.test("archive triggers syncOnLessonRemoved", async () => {
    const repo = makeRepo({
      getLesson: async () => ({ id: "l-1", courseId: "c-1", title: "Lesson" }),
      getCourse: async () => ({ id: "c-1", slug: "test-course" }),
    });
    const counterSync = makeCounterSync();
    const service = createAdminLessonsService(repo, makeAudit(), counterSync);
    await service.archive(makeSession(), "l-1");
    assert.ok(
      counterSync.calls.some((c) => c.method === "syncLessonsCount" && c.courseId === "c-1"),
      "syncLessonsCount should be called after lesson archive",
    );
  });

  await t.test("toggleVisibility does NOT trigger counter sync", async () => {
    const repo = makeRepo({
      getLesson: async () => ({ id: "l-1", courseId: "c-1", isPrivate: false }),
      getCourse: async () => ({ id: "c-1", slug: "test-course" }),
    });
    const counterSync = makeCounterSync();
    const service = createAdminLessonsService(repo, makeAudit(), counterSync);
    await service.toggleVisibility(makeSession(), "l-1");
    assert.equal(
      counterSync.calls.length, 0,
      "No counter sync should occur for visibility toggle — it doesn't change lesson count",
    );
  });
});
