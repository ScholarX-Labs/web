import { renderToStaticMarkup } from "react-dom/server";
import type { ExecutiveExportPayload } from "@/domain/executive/contracts/export-renderer.contract";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") return Number.isInteger(value) ? value.toLocaleString("en-US") : value.toFixed(2);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function rowsFromSection(section: Record<string, unknown>): readonly Record<string, unknown>[] {
  if (Array.isArray(section.rows)) return section.rows.filter(isRecord);
  if (Array.isArray(section.points)) return section.points.filter(isRecord);
  return [];
}

function SnapshotDocument({ payload }: { payload: ExecutiveExportPayload }) {
  return (
    <html lang="en">
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta charSet="utf-8" />
        <title>{payload.pageTitle} export</title>
        <style>{`
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
        `}</style>
      </head>
      <body>
        <main>
          <div className="header">
            <div>
              <p className="label">ScholarX executive export</p>
              <h1>{payload.pageTitle}</h1>
              <p className="muted">
                {payload.query.from} to {payload.query.to}
              </p>
            </div>
            <div className="summary">
              <div className="meta-grid">
                <div>
                  <div className="label">Format</div>
                  <div className="value">{payload.format}</div>
                </div>
                <div>
                  <div className="label">Generated</div>
                  <div className="value">{payload.generatedAt}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="stack">
            <section className="meta">
              <h2>Freshness summary</h2>
              <div className="grid" style={{ marginTop: 16 }}>
                {Object.entries(payload.freshnessSummary).map(([key, value]) => (
                  <div key={key}>
                    <div className="label">{key.replaceAll("_", " ")}</div>
                    <div className="value">{formatValue(value)}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="meta">
              <h2>Redaction notes</h2>
              {payload.redactionNotes.length === 0 ? (
                <p className="muted">No export-specific omissions were applied.</p>
              ) : (
                <ul>
                  {payload.redactionNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
            </section>

            {Object.entries(payload.sections).map(([sectionId, section]) => {
              const recordSection = isRecord(section) ? section : { value: section };
              const rows = rowsFromSection(recordSection);
              const summaryRows = Object.entries(recordSection).filter(
                ([key, value]) =>
                  key !== "rows"
                  && key !== "points"
                  && !Array.isArray(value)
                  && !isRecord(value),
              );

              return (
                <section key={sectionId} className="section">
                  <h2>{sectionId.replaceAll("_", " ")}</h2>
                  {summaryRows.length > 0 ? (
                    <div className="meta-grid">
                      {summaryRows.map(([key, value]) => (
                        <div key={key}>
                          <div className="label">{key.replaceAll("_", " ")}</div>
                          <div className="value">{formatValue(value)}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {rows.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          {Object.keys(rows.reduce((acc, row) => ({ ...acc, ...row }), {} as Record<string, unknown>))
                            .sort((left, right) => left.localeCompare(right))
                            .map((key) => (
                              <th key={key}>{key}</th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => {
                          const keys = Object.keys(rows.reduce((acc, current) => ({ ...acc, ...current }), {} as Record<string, unknown>))
                            .sort((left, right) => left.localeCompare(right));
                          return (
                            <tr key={`${sectionId}-${index}`}>
                              {keys.map((key) => (
                                <td key={key}>{formatValue(row[key])}</td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : null}
                </section>
              );
            })}
          </div>
        </main>
      </body>
    </html>
  );
}

export async function renderExecutiveSnapshot(payload: ExecutiveExportPayload): Promise<string> {
  return `<!DOCTYPE html>${renderToStaticMarkup(<SnapshotDocument payload={payload} />)}`;
}
