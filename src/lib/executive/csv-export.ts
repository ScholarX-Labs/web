import type { ExecutiveExportPayload } from "@/domain/executive/contracts/export-renderer.contract";

type Scalar = string | number | boolean | null | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function escapeCsv(value: Scalar): string {
  const normalized = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }
  return normalized;
}

function toScalar(value: unknown): Scalar {
  if (
    value === null
    || value === undefined
    || typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean"
  ) {
    return value;
  }
  return JSON.stringify(value);
}

function stableKeys(rows: readonly Record<string, unknown>[]): string[] {
  return Array.from(
    rows.reduce((keys, row) => {
      for (const key of Object.keys(row)) keys.add(key);
      return keys;
    }, new Set<string>()),
  ).sort((left, right) => left.localeCompare(right));
}

function renderTable(title: string, rows: readonly Record<string, unknown>[]): string {
  if (rows.length === 0) {
    return [`${title}`, "status", "empty", ""].join("\n");
  }
  const headers = stableKeys(rows);
  const body = rows.map((row) => headers.map((header) => escapeCsv(toScalar(row[header]))).join(","));
  return [title, headers.join(","), ...body, ""].join("\n");
}

function renderSummary(title: string, section: Record<string, unknown>): string {
  const rows = Object.entries(section)
    .filter(([, value]) => !Array.isArray(value) && !isRecord(value))
    .map(([key, value]) => ({ key, value: toScalar(value) }));

  return renderTable(title, rows);
}

function renderSection(sectionId: string, section: unknown): string[] {
  if (Array.isArray(section) && section.every(isRecord)) {
    return [renderTable(sectionId, section)];
  }
  if (isRecord(section)) {
    const blocks: string[] = [];

    if (Array.isArray(section.rows) && section.rows.every(isRecord)) {
      blocks.push(renderTable(`${sectionId}.rows`, section.rows));
    }
    if (Array.isArray(section.points) && section.points.every(isRecord)) {
      blocks.push(renderTable(`${sectionId}.points`, section.points));
    }

    const nestedArrays = Object.entries(section).filter(
      ([key, value]) =>
        key !== "rows"
        && key !== "points"
        && Array.isArray(value)
        && value.every(isRecord),
    );
    for (const [key, value] of nestedArrays) {
      blocks.push(renderTable(`${sectionId}.${key}`, value as readonly Record<string, unknown>[]));
    }

    blocks.push(renderSummary(`${sectionId}.summary`, section));
    return blocks;
  }

  return [renderTable(sectionId, [{ value: toScalar(section) }])];
}

export async function renderExecutiveCsv(payload: ExecutiveExportPayload): Promise<string> {
  const blocks: string[] = [];
  blocks.push(
    renderTable("export.metadata", [
      {
        pageId: payload.pageId,
        pageTitle: payload.pageTitle,
        format: payload.format,
        from: payload.query.from,
        to: payload.query.to,
        generatedAt: payload.generatedAt,
      },
    ]),
  );
  blocks.push(
    renderTable(
      "export.redaction_notes",
      payload.redactionNotes.map((note) => ({ note })),
    ),
  );
  blocks.push(
    renderTable("export.freshness_summary", [
      payload.freshnessSummary,
    ]),
  );

  for (const [sectionId, section] of Object.entries(payload.sections)) {
    blocks.push(...renderSection(sectionId, section));
  }

  return blocks.join("\n");
}
