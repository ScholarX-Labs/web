import type { ExecutiveExportPayload } from "@/domain/executive/contracts/export-renderer.contract";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString("en-US") : value.toFixed(2);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function rowsFromSection(section: Record<string, unknown>): readonly Record<string, unknown>[] {
  if (Array.isArray(section.rows)) return section.rows.filter(isRecord);
  if (Array.isArray(section.points)) return section.points.filter(isRecord);
  return [];
}

function label(value: string): string {
  return escapeHtml(value.replaceAll("_", " "));
}

function valueCell(value: unknown): string {
  return escapeHtml(formatValue(value));
}

function renderSummaryGrid(entries: readonly [string, unknown][]): string {
  if (entries.length === 0) return "";
  return `<div class="meta-grid">${entries
    .map(([key, value]) => (
      `<div><div class="label">${label(key)}</div><div class="value">${valueCell(value)}</div></div>`
    ))
    .join("")}</div>`;
}

function renderRowsTable(sectionId: string, rows: readonly Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows.reduce(
    (acc, row) => ({ ...acc, ...row }),
    {} as Record<string, unknown>,
  )).sort((left, right) => left.localeCompare(right));

  return `<table><thead><tr>${keys
    .map((key) => `<th>${escapeHtml(key)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((row, index) => (
      `<tr data-row="${escapeHtml(`${sectionId}-${index}`)}">${keys
        .map((key) => `<td>${valueCell(row[key])}</td>`)
        .join("")}</tr>`
    ))
    .join("")}</tbody></table>`;
}

function renderRedactionNotes(notes: readonly string[]): string {
  if (notes.length === 0) {
    return `<p class="muted">No export-specific omissions were applied.</p>`;
  }
  return `<ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`;
}

function renderSections(payload: ExecutiveExportPayload): string {
  return Object.entries(payload.sections)
    .map(([sectionId, section]) => {
      const recordSection = isRecord(section) ? section : { value: section };
      const rows = rowsFromSection(recordSection);
      const summaryRows = Object.entries(recordSection).filter(
        ([key, value]) =>
          key !== "rows"
          && key !== "points"
          && !Array.isArray(value)
          && !isRecord(value),
      );

      return `<section class="section"><h2>${label(sectionId)}</h2>${renderSummaryGrid(summaryRows)}${renderRowsTable(sectionId, rows)}</section>`;
    })
    .join("");
}

const styles = `
  :root { color-scheme: light; }
  body { font-family: Arial, sans-serif; margin: 0; color: #0f172a; background: #f8fafc; }
  main { max-width: 1080px; margin: 0 auto; padding: 32px; }
  h1, h2, h3 { margin: 0; }
  .header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
  .meta, .summary, .section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
  .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; margin-top: 16px; }
  .stack { display: grid; gap: 16px; margin-top: 24px; }
  .label { font-size: 12px; text-transform: uppercase; color: #64748b; }
  .value { font-size: 16px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
  th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
  th { background: #f8fafc; }
  ul { margin: 12px 0 0; padding-left: 18px; }
  .muted { color: #64748b; font-size: 12px; }
`;

export async function renderExecutiveSnapshot(payload: ExecutiveExportPayload): Promise<string> {
  const freshnessEntries = Object.entries(payload.freshnessSummary);

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(payload.pageTitle)} export</title><style>${styles}</style></head><body><main><div class="header"><div><p class="label">ScholarX executive export</p><h1>${escapeHtml(payload.pageTitle)}</h1><p class="muted">${escapeHtml(payload.query.from)} to ${escapeHtml(payload.query.to)}</p></div><div class="summary"><div class="meta-grid"><div><div class="label">Format</div><div class="value">${escapeHtml(payload.format)}</div></div><div><div class="label">Generated</div><div class="value">${escapeHtml(payload.generatedAt)}</div></div></div></div></div><div class="stack"><section class="meta"><h2>Freshness summary</h2><div class="grid">${freshnessEntries.map(([key, value]) => `<div><div class="label">${label(key)}</div><div class="value">${valueCell(value)}</div></div>`).join("")}</div></section><section class="meta"><h2>Redaction notes</h2>${renderRedactionNotes(payload.redactionNotes)}</section>${renderSections(payload)}</div></main></body></html>`;
}
