import assert from "node:assert/strict";
import test from "node:test";
import { ExecutiveDashboardService } from "../application/executive-dashboard.service";
import { createFinanceFixture, executiveBaseQuery } from "./fixtures/executive-fixtures";

const query = {
  ...executiveBaseQuery,
  courseId: "course-1",
};

test("finance read model calculates revenue, refund, split, and selected course metrics", () => {
  const service = new ExecutiveDashboardService();
  const fixture = createFinanceFixture();
  const model = service.buildFinanceReadModel({
    query,
    generatedAt: new Date("2026-05-25T12:00:00.000Z"),
    current: fixture.current,
    previous: fixture.previous,
    courses: fixture.courses,
    selectedCourse: fixture.selectedCourse,
  });

  assert.equal(model.pageId, "finance");
  assert.equal(model.sections.financeSummary.netRevenue, 11_000);
  assert.equal(model.sections.financeSummary.refundRate, 1_000 / 12_000);
  assert.equal(model.sections.financeSummary.averageRevenuePerActiveLearner, 600);
  assert.equal(model.sections.courseBusinessPerformance.rows[0].highRefundRate, true);
  assert.equal(model.sections.selectedCourseDetail?.courseId, "course-1");
  assert.ok((model.sections.selectedCourseDetail?.profitabilityProxy ?? 0) > 0);
});
