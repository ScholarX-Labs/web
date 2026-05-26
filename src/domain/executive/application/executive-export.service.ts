import { createActionCenterService } from "./action-center.service";
import { ExecutiveError } from "./executive-errors";
import type { ExecutiveDomain } from "../factory/executive-domain.factory";
import type {
  ExecutiveExportActor,
  ExecutiveExportPayload,
  ExecutiveExportRenderer,
  ExecutiveExportResult,
  ExecutiveExportServicePort,
} from "../contracts/export-renderer.contract";
import type { ExecutiveExportRequest, ExecutivePageQuery } from "../contracts/executive-query.schemas";
import type { ExecutivePageId } from "../contracts/executive-types";

type AuditWriterInput = {
  actor: ExecutiveExportActor;
  exportId: string;
  payload: ExecutiveExportPayload;
};

type AuditWriter = (input: AuditWriterInput) => Promise<string>;

const maxExportRangeDays = 365;
const maxExportRows = 50_000;

const pageTitleById: Record<ExecutivePageId, string> = {
  overview: "Business health overview",
  users: "Users and activity",
  courses_lessons: "Courses and lessons",
  learner_progress: "Learner progress",
  opportunities_ai: "Opportunities and AI",
  technical_health: "Technical health",
  action_center: "Action Center",
  public_growth: "Public website and growth",
  team_operations: "Team operations",
  finance: "Finance and unit economics",
};

function endOfDay(date: string): number {
  return new Date(`${date}T23:59:59.999Z`).getTime();
}

function rangeInDays(query: ExecutivePageQuery): number {
  const start = new Date(`${query.from}T00:00:00.000Z`).getTime();
  const end = endOfDay(query.to);
  return Math.floor((end - start) / 86_400_000) + 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function countExportRows(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length + value.reduce<number>((sum, entry) => sum + countExportRows(entry), 0);
  }
  if (isRecord(value)) {
    return Object.values(value).reduce<number>((sum, entry) => sum + countExportRows(entry), 0);
  }
  return 0;
}

async function readPage(
  domain: ExecutiveDomain,
  pageId: ExecutivePageId,
  query: ExecutivePageQuery,
) {
  switch (pageId) {
    case "overview":
      return domain.repositories.read.getOverview(query);
    case "users":
      return domain.repositories.read.getUsers(query);
    case "courses_lessons":
      return domain.repositories.read.getCoursesLessons(query);
    case "learner_progress":
      return domain.repositories.read.getLearnerProgress(query);
    case "opportunities_ai":
      return domain.repositories.read.getOpportunitiesAi(query);
    case "technical_health":
      return domain.repositories.read.getTechnicalHealth(query);
    case "action_center":
      return createActionCenterService(domain.repositories.actionCenter).getActionCenter(query);
    case "public_growth":
      return domain.repositories.read.getPublicGrowth(query);
    case "team_operations":
      return domain.repositories.read.getTeamOperations(query);
    case "finance":
      return domain.repositories.read.getFinance(query);
  }
}

function pickSections(
  sections: Record<string, unknown>,
  sectionIds?: readonly string[],
): Record<string, unknown> {
  if (!sectionIds || sectionIds.length === 0) return sections;
  const selected = sectionIds.reduce<Record<string, unknown>>((acc, sectionId) => {
    if (sectionId in sections) acc[sectionId] = sections[sectionId];
    return acc;
  }, {});
  return Object.keys(selected).length > 0 ? selected : sections;
}

export class ExecutiveExportService implements ExecutiveExportServicePort {
  constructor(
    private readonly domain: ExecutiveDomain,
    private readonly renderer: ExecutiveExportRenderer,
    private readonly writeAudit: AuditWriter,
  ) {}

  async generate(
    actor: ExecutiveExportActor,
    request: ExecutiveExportRequest,
  ): Promise<ExecutiveExportResult> {
    if (rangeInDays(request.query) > maxExportRangeDays) {
      throw new ExecutiveError(
        "PAYLOAD_TOO_LARGE",
        413,
        "Exports cannot exceed 365 days in a single request.",
      );
    }

    const page = await readPage(this.domain, request.pageId, request.query);
    const sections = pickSections(page.sections as Record<string, unknown>, request.sectionIds);
    const payload: ExecutiveExportPayload = {
      pageId: request.pageId,
      pageTitle: pageTitleById[request.pageId],
      format: request.format,
      query: request.query,
      sections,
      freshnessSummary: page.freshnessSummary,
      sectionIds: request.sectionIds,
      generatedAt: page.generatedAt,
      redactionNotes: page.redactionNotes,
    };

    if (countExportRows(payload.sections) > maxExportRows) {
      throw new ExecutiveError(
        "PAYLOAD_TOO_LARGE",
        413,
        "Exports cannot exceed 50000 rendered rows in a single request.",
      );
    }

    const body = request.format === "csv"
      ? await this.renderer.renderCsv(payload)
      : await this.renderer.renderSnapshot(payload);
    const exportId = crypto.randomUUID();
    const auditId = await this.writeAudit({ actor, exportId, payload });
    const extension = request.format === "csv" ? "csv" : "html";

    return {
      exportId,
      fileName: `${request.pageId}-${request.query.from}-to-${request.query.to}.${extension}`,
      contentType: request.format === "csv" ? "text/csv" : "text/html",
      body,
      generatedAt: payload.generatedAt,
      auditId,
      redactionNotes: payload.redactionNotes,
    };
  }
}

export function createExecutiveExportService(input: {
  domain: ExecutiveDomain;
  renderer: ExecutiveExportRenderer;
  writeAudit: AuditWriter;
}): ExecutiveExportService {
  return new ExecutiveExportService(input.domain, input.renderer, input.writeAudit);
}
