import assert from "node:assert/strict";
import test from "node:test";
import { ActionCenterRules } from "../application/action-center-rules";
import { ExecutiveDashboardService } from "../application/executive-dashboard.service";
import type { ExecutivePageQuery } from "../contracts/executive-query.schemas";

const query: ExecutivePageQuery = {
  from: "2026-05-01",
  to: "2026-05-25",
  page: 1,
  pageSize: 25,
  direction: "desc",
};

test("inquiry pipeline flags pending inquiries past the SLA", () => {
  const service = new ExecutiveDashboardService();
  const model = service.buildTeamOperationsReadModel({
    query,
    generatedAt: new Date("2026-05-25T12:00:00.000Z"),
    inquiries: [
      {
        inquiryId: "inq-1",
        courseId: "course-1",
        courseTitle: "Scholarship Strategy",
        status: "pending",
        assignedOwnerId: null,
        sourceChannel: "course_modal",
        submittedAt: "2026-05-22T10:00:00.000Z",
        updatedAt: "2026-05-22T10:00:00.000Z",
      },
      {
        inquiryId: "inq-2",
        courseId: "course-1",
        courseTitle: "Scholarship Strategy",
        status: "converted",
        assignedOwnerId: "owner-1",
        sourceChannel: "course_modal",
        submittedAt: "2026-05-24T10:00:00.000Z",
        updatedAt: "2026-05-24T14:00:00.000Z",
      },
    ],
  });

  assert.equal(model.pageId, "team_operations");
  assert.equal(model.sections.inquiryPipelineSummary.totalInquiries, 2);
  assert.equal(model.sections.inquiryPipelineSummary.slaBreaches, 1);
  assert.equal(model.sections.inquiryPipelineSummary.conversionRate, 0.5);
  assert.equal(model.sections.inquiryPipeline.rows[0]?.isSlaBreached, true);
  assert.equal(model.sections.inquiryPipeline.rows[0]?.severity, "high");
});

test("inquiry SLA rule escalates breaches over two SLA windows", () => {
  const rules = new ActionCenterRules();
  const signal = rules.inquirySlaBreach({
    inquiryId: "inq-1",
    courseTitle: "Scholarship Strategy",
    hoursSinceSubmission: 120,
    nextFollowUpDueAt: "2026-05-24T10:00:00.000Z",
  });

  assert.equal(signal.ruleId, "inquiry-sla-breach");
  assert.equal(signal.entityType, "inquiry");
  assert.equal(signal.sourcePage, "action_center");
  assert.equal(signal.sourceSection, "salesSupportPipeline");
  assert.equal(signal.severity, "critical");
});
