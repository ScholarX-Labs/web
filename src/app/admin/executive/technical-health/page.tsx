import { Activity, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { createExecutiveDomain } from "@/domain/executive";
import { executivePageQuerySchema } from "@/domain/executive/contracts/executive-query.schemas";
import type { TechnicalHealthReadModel } from "@/domain/executive/contracts/executive-read-repository.contract";
import { FreshnessBadge } from "@/components/executive/sections/freshness-badge";
import { ExportButton } from "@/components/executive/sections/export-button";
import { FreshnessGrid } from "@/components/executive/sections/freshness-grid";
import { AdminAuditTable } from "@/components/executive/tables/admin-audit-table";
import { BarChart } from "@/components/executive/charts/bar-chart";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultQuery() {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(to.getUTCDate() - 29);
  return {
    from: isoDate(from),
    to: isoDate(to),
    preset: "last_30_days",
  };
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function readTechnicalHealth(
  searchParams: PageProps["searchParams"],
): Promise<TechnicalHealthReadModel> {
  const params = (await searchParams) ?? {};
  const query = executivePageQuerySchema.parse({
    ...defaultQuery(),
    ...Object.fromEntries(
      Object.entries(params)
        .map(([key, value]) => [key, firstValue(value)])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    ),
  });

  return createExecutiveDomain().repositories.read.getTechnicalHealth(query);
}

function HealthStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "good" | "warning";
}) {
  const color =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warning"
        ? "text-amber-700"
        : "text-slate-950";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

export default async function ExecutiveTechnicalHealthPage({
  searchParams,
}: PageProps) {
  const health = await readTechnicalHealth(searchParams);
  const latencyChart = {
    ...health.sections.queryLatency,
    points: health.sections.queryLatency.points.map((point) => ({
      label: point.sectionId,
      value: point.rollingP95DurationMs ?? point.lastQueryDurationMs ?? 0,
    })),
  };

  return (
    <main className="space-y-6 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-700">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Executive dashboard
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Technical health
          </h1>
          <p className="max-w-3xl text-sm text-slate-500">
            {health.query.from} to {health.query.to}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton pageId="technical_health" query={health.query} />
          <FreshnessBadge
            status={health.sections.freshnessGrid.state.freshness}
            lastSuccessfulAt={health.sections.freshnessGrid.state.lastSuccessfulAt}
          />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Technical health counters">
        <HealthStat
          label="Progress events"
          value={health.sections.pipelineHealth.progressEvents}
          tone="good"
        />
        <HealthStat
          label="Open action items"
          value={health.sections.pipelineHealth.openActionItems}
          tone={health.sections.pipelineHealth.openActionItems > 0 ? "warning" : "good"}
        />
        <HealthStat
          label="Email failures"
          value={health.sections.emailPipelineHealth.failed}
          tone={health.sections.emailPipelineHealth.failed > 0 ? "warning" : "good"}
        />
        <HealthStat
          label="Active sessions"
          value={health.sections.platformUsage.activeSessions}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.65fr)]">
        <FreshnessGrid rows={health.sections.freshnessGrid.rows} />
        <section
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          aria-labelledby="pipeline-health"
        >
          <div className="flex items-center gap-2">
            {health.sections.pipelineHealth.state.status === "ready" ? (
              <CheckCircle2 className="size-4 text-emerald-700" aria-hidden="true" />
            ) : (
              <AlertTriangle className="size-4 text-amber-700" aria-hidden="true" />
            )}
            <h2 id="pipeline-health" className="text-sm font-semibold text-slate-950">
              Pipeline health
            </h2>
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Queued email</dt>
              <dd className="font-semibold text-slate-950">
                {health.sections.pipelineHealth.emailQueued}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Failed email</dt>
              <dd className="font-semibold text-slate-950">
                {health.sections.pipelineHealth.emailFailed}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Banned users</dt>
              <dd className="font-semibold text-slate-950">
                {health.sections.securitySignals.bannedUsers}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Unverified users</dt>
              <dd className="font-semibold text-slate-950">
                {health.sections.securitySignals.unverifiedUsers}
              </dd>
            </div>
          </dl>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <BarChart
          chart={latencyChart}
          labelForPoint={(point) => point.label}
        />
        <section
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          aria-labelledby="email-health"
        >
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-blue-700" aria-hidden="true" />
            <h2 id="email-health" className="text-sm font-semibold text-slate-950">
              Email pipeline health
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {health.sections.emailPipelineHealth.providers.length === 0 ? (
              <p className="text-sm text-slate-500">No provider circuit states recorded.</p>
            ) : (
              health.sections.emailPipelineHealth.providers.map((provider) => (
                <div
                  key={provider.provider}
                  className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-950">{provider.provider}</p>
                    <span className="text-xs font-semibold uppercase text-slate-500">
                      {provider.state}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Failures {provider.failureCount} · Successes {provider.successCount}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <AdminAuditTable rows={health.sections.adminAuditLog.rows} />
    </main>
  );
}
