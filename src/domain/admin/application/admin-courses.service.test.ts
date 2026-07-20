import test from "node:test";
import assert from "node:assert/strict";
import { createAdminCoursesService } from "@/domain/admin/application/admin-courses.service";
import { AdminError } from "@/domain/admin/application/admin-errors";
import type { AdminRepository } from "@/domain/admin/contracts/admin-repository.contract";
import type { AuditLogEntry } from "@/domain/admin/infrastructure/audit/audit-logger";
import type { AdminSession } from "@/domain/admin/contracts/admin-types";
import { ZodError } from "zod";

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
  toggleLessonVisibility: async (id) => ({ id, isPublished: true }),
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

const validCreateInput = {
  title: "Test Course Title",
  slug: "test-course-title",
  description: "This is a test course with enough description text.",
};

const validUpdateInput = {
  title: "Updated Title",
  expectedVersion: new Date().toISOString(),
};

const validEnrollInput = { email: "student@test.com" };

test("admin courses service", async (t) => {
  await t.test("list delegates to repository", async () => {
    const repo = makeRepo({ listCourses: async () => ({ items: [{ id: "1" }], pagination: { page: 1, limit: 20, total: 1, pages: 1 } }) });
    const audit = makeAudit();
    const service = createAdminCoursesService(repo, audit);
    const result = await service.list({});
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].id, "1");
  });

  await t.test("getById throws notFound when missing", async () => {
    const service = createAdminCoursesService(makeRepo(), makeAudit());
    await assert.rejects(() => service.getById("missing"), (err: AdminError) => {
      assert.equal(err.code, "RESOURCE_NOT_FOUND");
      return true;
    });
  });

  await t.test("getById returns course when found", async () => {
    const repo = makeRepo({ getCourse: async () => ({ id: "c-1", title: "Test" }) });
    const service = createAdminCoursesService(repo, makeAudit());
    const course = await service.getById("c-1");
    assert.equal(course.title, "Test");
  });

  await t.test("create validates input (throws ZodError for missing required fields)", async () => {
    const service = createAdminCoursesService(makeRepo(), makeAudit());
    await assert.rejects(() => service.create(makeSession(), {}), ZodError);
  });

  await t.test("create writes audit log", async () => {
    const repo = makeRepo({ createCourse: async (data) => ({ id: "c-new", ...data, slug: "test-course-title" }) });
    const audit = makeAudit();
    const service = createAdminCoursesService(repo, audit);
    await service.create(makeSession(), validCreateInput);
    assert.equal(audit.logs.length, 1);
    assert.equal(audit.logs[0].action, "course.create");
    assert.equal(audit.logs[0].adminId, "admin-1");
  });

  await t.test("update throws notFound when missing", async () => {
    const repo = makeRepo({ getCourse: async () => null, updateCourse: async () => null });
    const service = createAdminCoursesService(repo, makeAudit());
    await assert.rejects(() => service.update(makeSession(), "missing", validUpdateInput), (err: AdminError) => {
      assert.equal(err.code, "RESOURCE_NOT_FOUND");
      return true;
    });
  });

  await t.test("update validates input (throws ZodError for invalid data)", async () => {
    const repo = makeRepo({ getCourse: async () => ({ id: "c-1" }) });
    const service = createAdminCoursesService(repo, makeAudit());
    await assert.rejects(() => service.update(makeSession(), "c-1", { invalid: true }), ZodError);
  });

  await t.test("update writes audit log with before/after", async () => {
    const existing = { id: "c-1", title: "Old Title", status: "active" };
    const repo = makeRepo({
      getCourse: async () => existing,
      updateCourse: async (id, data) => ({ ...existing, ...data }),
    });
    const audit = makeAudit();
    const service = createAdminCoursesService(repo, audit);
    await service.update(makeSession(), "c-1", validUpdateInput);
    assert.equal(audit.logs.length, 1);
    assert.equal(audit.logs[0].before?.title, "Old Title");
    assert.equal(audit.logs[0].after?.title, "Updated Title");
  });

  await t.test("updateStatus writes audit log", async () => {
    const repo = makeRepo({ getCourse: async () => ({ id: "c-1", status: "draft" }) });
    const audit = makeAudit();
    const service = createAdminCoursesService(repo, audit);
    await service.updateStatus(makeSession(), "c-1", { status: "active" });
    assert.equal(audit.logs.length, 1);
    assert.equal(audit.logs[0].before?.status, "draft");
    assert.equal(audit.logs[0].after?.status, "active");
  });

  await t.test("archive throws notFound when missing", async () => {
    const service = createAdminCoursesService(makeRepo(), makeAudit());
    await assert.rejects(() => service.archive(makeSession(), "missing"), (err: AdminError) => {
      assert.equal(err.code, "RESOURCE_NOT_FOUND");
      return true;
    });
  });

  await t.test("archive writes audit log", async () => {
    const repo = makeRepo({ getCourse: async () => ({ id: "c-1", status: "active" }) });
    const audit = makeAudit();
    const service = createAdminCoursesService(repo, audit);
    await service.archive(makeSession(), "c-1");
    assert.equal(audit.logs.length, 1);
    assert.equal(audit.logs[0].action, "course.archive");
    assert.equal(audit.logs[0].after?.status, "archived");
  });

  await t.test("enrollUser validates input (throws ZodError for missing email)", async () => {
    const repo = makeRepo({ getCourse: async () => ({ id: "c-1" }) });
    const service = createAdminCoursesService(repo, makeAudit());
    await assert.rejects(() => service.enrollUser(makeSession(), "c-1", {}), ZodError);
  });

  await t.test("enrollUser writes audit log", async () => {
    const repo = makeRepo({ getCourse: async () => ({ id: "c-1" }) });
    const audit = makeAudit();
    const service = createAdminCoursesService(repo, audit);
    await service.enrollUser(makeSession(), "c-1", validEnrollInput);
    assert.equal(audit.logs.length, 1);
    assert.equal(audit.logs[0].action, "course.enroll_user");
  });
});

test("admin errors", async (t) => {
  const { AdminErrors, isAdminError } = await import("@/domain/admin/application/admin-errors");

  await t.test("unauthorized", () => {
    const err = AdminErrors.unauthorized();
    assert.equal(err.code, "ADMIN_UNAUTHORIZED");
    assert.equal(err.statusCode, 403);
  });

  await t.test("notFound", () => {
    const err = AdminErrors.notFound("Course");
    assert.equal(err.code, "RESOURCE_NOT_FOUND");
    assert.equal(err.statusCode, 404);
    assert.ok(err.message.includes("Course"));
  });

  await t.test("validation", () => {
    const err = AdminErrors.validation({ field: "title" });
    assert.equal(err.code, "VALIDATION_ERROR");
    assert.equal(err.statusCode, 422);
    assert.deepEqual(err.details, { field: "title" });
  });

  await t.test("conflict", () => {
    const err = AdminErrors.conflict("Stale data");
    assert.equal(err.code, "CONCURRENCY_CONFLICT");
    assert.equal(err.statusCode, 409);
  });

  await t.test("isAdminError guard", () => {
    assert.ok(isAdminError(AdminErrors.notFound("X")));
    assert.ok(!isAdminError(new Error("generic")));
    assert.ok(!isAdminError("string"));
    assert.ok(!isAdminError(null));
  });
});
