import test from "node:test";
import assert from "node:assert/strict";
import { executeFreeEnroll } from "@/lib/enrollment/strategies/free-enroll.strategy";
import { executePaidCheckoutInit } from "@/lib/enrollment/strategies/paid-checkout.strategy";
import { executeFormApplicationInit } from "@/lib/enrollment/strategies/form-application.strategy";
import { EnrollmentContext } from "@/lib/enrollment/types";
import { ApiRequestError } from "@/lib/api/courses.service";

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
    price: 0,
  },
};

test("executeFreeEnroll returns success payload", async () => {
  const fakeApi = {
    enrollFree: async () => ({
      message: "ok",
      data: { nextAction: "resume_learning" },
    }),
  };

  const result = await executeFreeEnroll(baseContext, fakeApi);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.mode, "free");
    assert.equal(result.nextAction, "resume_learning");
  }
});

test("executePaidCheckoutInit maps API failure", async () => {
  const fakeApi = {
    initPaidEnrollment: async () => {
      throw new ApiRequestError("payment missing", 400, "payment_unavailable");
    },
  };

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
  const fakeApi = {
    initApplicationEnrollment: async () => ({
      message: "application init",
      data: { applicationUrl: "/apply/course-1" },
    }),
  };

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
