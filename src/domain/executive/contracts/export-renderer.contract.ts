import type {
  ExecutiveExportRequest,
  ExecutivePageQuery,
} from "./executive-query.schemas";
import type { ExecutivePageId } from "./executive-types";

export type ExecutiveExportFormat = "csv" | "snapshot";

export type ExecutiveExportActor = {
  userId: string;
  role: "admin";
  ipAddress?: string;
  userAgent?: string;
};

export type ExecutiveExportPayload = {
  pageId: ExecutivePageId;
  format: ExecutiveExportFormat;
  query: ExecutivePageQuery;
  sectionIds?: readonly string[];
  generatedAt: string;
  redactionNotes: readonly string[];
};

export type ExecutiveExportResult = {
  exportId: string;
  fileName: string;
  contentType: "text/csv" | "text/html";
  body: string;
  generatedAt: string;
  auditId: string;
  redactionNotes: readonly string[];
};

export interface ExecutiveExportRenderer {
  renderCsv(payload: ExecutiveExportPayload): Promise<string>;
  renderSnapshot(payload: ExecutiveExportPayload): Promise<string>;
}

export interface ExecutiveExportServicePort {
  generate(
    actor: ExecutiveExportActor,
    request: ExecutiveExportRequest,
  ): Promise<ExecutiveExportResult>;
}
