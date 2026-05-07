import test from "node:test";
import assert from "node:assert/strict";
import { executeFreeEnroll } from "@/lib/enrollment/strategies/free-enroll.strategy";
import { executePaidCheckoutInit } from "@/lib/enrollment/strategies/paid-checkout.strategy";
import { executeFormApplicationInit } from "@/lib/enrollment/strategies/form-application.strategy";
import { EnrollmentContext } from "@/lib/enrollment/types";
import { ApiRequestError, coursesService } from "@/lib/api/courses.service";

type ApiClient = typeof coursesService;

const baseContext: EnrollmentContext = {
  command: {
    courseId: "course-1",
    source: "course_card",
    correlationId: "corr-1",
    timestamp: Date.now(),
    viewport: "desktop",
    reducedMotion: false,
  },
  course: {
    id: "course-1",
    slug: "course-1",
    title: "Course",
    requiresForm: false,
    salesInquiry: false,
    price: 0,
  },
};

const createFakeApi = (overrides: Partial<ApiClient> = {}): ApiClient => ({
  list: async () => ({ items: [], pagination: { currentPage: 1, totalPages: 1, totalCourses: 0, hasNextPage: false, hasPreviousPage: false } }),
  getAll: async () => [],
  getFeatured: async () => ({ items: [], pagination: { currentPage: 1, totalPages: 1, totalCourses: 0, hasNextPage: false, hasPreviousPage: false } }),
  getScholarX: async () => ({ items: [], pagination: { currentPage: 1, totalPages: 1, totalCourses: 0, hasNextPage: false, hasPreviousPage: false } }),
  search: async () => ({ items: [], pagination: { currentPage: 1, totalPages: 1, totalCourses: 0, hasNextPage: false, hasPreviousPage: false } }),
  getById: async () => { throw new Error("not implemented"); },
  getBySlug: async () => { throw new Error("not implemented"); },
  getEnrollmentStatus: async () => null,
  enrollFree: async () => { throw new Error("not implemented"); },
  enrollPaid: async () => ({ clientSecret: "" }),
  initPaidEnrollment: async () => { throw new Error("not implemented"); },
  initApplicationEnrollment: async () => { throw new Error("not implemented"); },
  submitInquiry: async () => ({ inquiryId: "test", message: "ok" }),
  ...overrides,
});

test("executeFreeEnroll returns success payload", async () => {
  const fakeApi = createFakeApi({
    enrollFree: async () => ({
      requestId: "mock",
      success: true,
      code: "OK",
      message: "ok",
      data: {
        course: { id: "course-1", studentsCount: 0 },
        userId: "user-1",
        nextAction: "resume_learning",
      },
    }),
  });

  const result = await executeFreeEnroll(baseContext, fakeApi);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.mode, "free");
    assert.equal(result.nextAction, "resume_learning");
  }
});

test("executePaidCheckoutInit maps API failure", async () => {
  const fakeApi = createFakeApi({
    initPaidEnrollment: async () => {
      throw new ApiRequestError("payment missing", 400, "payment_unavailable");
    },
  });

  const result = await executePaidCheckoutInit(
    { ...baseContext, course: { ...baseContext.course, price: 10 } },
    fakeApi,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.mode, "paid");
    assert.equal(result.code, "payment_unavailable");
  }
});

test("executeFormApplicationInit returns application redirect", async () => {
  const fakeApi = createFakeApi({
    initApplicationEnrollment: async () => ({
      requestId: "mock",
      success: true,
      code: "OK",
      message: "application init",
      data: {
        courseId: "course-1",
        applicationUrl: "/apply/course-1",
        nextAction: "application",
      },
    }),
  });

  const result = await executeFormApplicationInit(
    {
      ...baseContext,
      course: { ...baseContext.course, requiresForm: true, price: 100 },
    },
    fakeApi,
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.mode, "application");
    assert.equal(result.applicationUrl, "/apply/course-1");
  }
});
