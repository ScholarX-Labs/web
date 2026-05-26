import { Clock, Users } from "lucide-react";
import { createExecutiveDomain } from "@/domain/executive";
import { executivePageQuerySchema } from "@/domain/executive/contracts/executive-query.schemas";
import type { UsersReadModel } from "@/domain/executive/contracts/executive-read-repository.contract";
import { MetricCard } from "@/components/executive/sections/metric-card";
import { FreshnessBadge } from "@/components/executive/sections/freshness-badge";
import { ExportButton } from "@/components/executive/sections/export-button";
import { SectionState } from "@/components/executive/sections/section-state";
import { BarChart } from "@/components/executive/charts/bar-chart";
import { Heatmap } from "@/components/executive/charts/heatmap";
import { UserManagementTable } from "@/components/executive/tables/user-management-table";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const metricPresentation = {
  "users.new_users": {
    label: "New users",
    format: "number",
    favorableDirection: "up",
  },
  "users.active_users": {
    label: "Active users",
    format: "number",
    favorableDirection: "up",
  },
  "users.verified_email_rate": {
    label: "Verified email rate",
    format: "percent",
    favorableDirection: "up",
  },
  "users.banned_users": {
    label: "Banned users",
    format: "number",
    favorableDirection: "down",
  },
} as const;
type MetricPresentationKey = keyof typeof metricPresentation;

function isMetricPresentationKey(id: string): id is MetricPresentationKey {
  return id in metricPresentation;
}

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

async function readUsers(searchParams: PageProps["searchParams"]): Promise<UsersReadModel> {
  const params = (await searchParams) ?? {};
  const query = executivePageQuerySchema.parse({
    ...defaultQuery(),
    ...Object.fromEntries(
      Object.entries(params)
        .map(([key, value]) => [key, firstValue(value)])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    ),
  });

  return createExecutiveDomain().repositories.read.getUsers(query);
}

export default async function ExecutiveUsersPage({ searchParams }: PageProps) {
  const users = await readUsers(searchParams);
  const peak = users.sections.peakActivity;

  return (
    <main className="space-y-6 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-700">
            <Users className="size-4" aria-hidden="true" />
            Executive dashboard
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Users and activity
          </h1>
          <p className="max-w-3xl text-sm text-slate-500">
            {users.query.from} to {users.query.to}
            {users.query.userRole ? ` · Role: ${users.query.userRole}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton pageId="users" query={users.query} />
          <FreshnessBadge
            status={users.sections.growthTrend.state.freshness}
            lastSuccessfulAt={users.sections.growthTrend.state.lastSuccessfulAt}
          />
        </div>
      </header>

      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        aria-label="User analytics key metrics"
      >
        {users.sections.kpis.map((kpi) => {
          const presentation = isMetricPresentationKey(kpi.definitionId)
            ? metricPresentation[kpi.definitionId]
            : undefined;
          return (
            <MetricCard
              key={kpi.definitionId}
              label={presentation?.label ?? kpi.definitionId}
              value={kpi.value}
              format={presentation?.format ?? "number"}
              deltaPercent={kpi.deltaPercent}
              favorableDirection={presentation?.favorableDirection ?? "neutral"}
              state={kpi.state}
            />
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
        <SectionState state={users.sections.growthTrend.state} title="User growth">
          <BarChart chart={users.sections.growthTrend} />
        </SectionState>
        <SectionState state={users.sections.roleDistribution.state} title="Role distribution">
          <BarChart
            chart={users.sections.roleDistribution}
            labelForPoint={(point) => point.role}
          />
        </SectionState>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <SectionState state={users.sections.activityHeatmap.state} title="24x7 activity heatmap">
          <Heatmap chart={users.sections.activityHeatmap} />
        </SectionState>
        <section
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          aria-labelledby="peak-activity"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="peak-activity" className="text-sm font-semibold text-slate-950">
              Peak activity
            </h2>
            <Clock className="size-4 text-slate-400" aria-hidden="true" />
          </div>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Peak day</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">
                {peak.peakDayOfWeek === null ? "No activity" : dayLabels[peak.peakDayOfWeek]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Peak hour</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">
                {peak.peakHour === null ? "No activity" : `${peak.peakHour}:00 UTC`}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Peak month</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">
                {peak.peakMonth ?? "No activity"}
              </dd>
            </div>
          </dl>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionState state={users.sections.monthlyActivity.state} title="Monthly activity">
          <BarChart
            chart={users.sections.monthlyActivity}
            labelForPoint={(point) => point.month}
          />
        </SectionState>
        <SectionState state={users.sections.registrationTimeline.state} title="Registration timeline">
          <BarChart chart={users.sections.registrationTimeline} />
        </SectionState>
      </section>

      <UserManagementTable rows={users.sections.managementTable.rows} />
    </main>
  );
}
