import { ListChecks } from "lucide-react";
import { createActionCenterService } from "@/domain/executive/application/action-center.service";
import { createExecutiveDomain } from "@/domain/executive";
import { executivePageQuerySchema } from "@/domain/executive/contracts/executive-query.schemas";
import type { ActionCenterReadModel } from "@/domain/executive/contracts/action-center-repository.contract";
import type { TeamOperationsReadModel } from "@/domain/executive/contracts/executive-read-repository.contract";
import type { ExecutiveFreshnessStatus } from "@/domain/executive/contracts/executive-types";
import { ActionItemsTable } from "@/components/executive/tables/action-items-table";
import { FreshnessBadge } from "@/components/executive/sections/freshness-badge";
import { ExportButton } from "@/components/executive/sections/export-button";
import { SalesPipelineTable } from "@/components/executive/tables/sales-pipeline-table";

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
  return { from: isoDate(from), to: isoDate(to), preset: "last_30_days" };
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function readActionCenter(
  searchParams: PageProps["searchParams"],
): Promise<{
  actionCenter: ActionCenterReadModel;
  teamOperations: TeamOperationsReadModel;
}> {
  const params = (await searchParams) ?? {};
  const parsedQuery = executivePageQuerySchema.safeParse({
    ...defaultQuery(),
    ...Object.fromEntries(
      Object.entries(params)
        .map(([key, value]) => [key, firstValue(value)])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    ),
  });
  const query = parsedQuery.success ? parsedQuery.data : defaultQuery();
  const domain = createExecutiveDomain();
  const [actionCenter, teamOperations] = await Promise.all([
    createActionCenterService(domain.repositories.actionCenter).getActionCenter(query),
    domain.repositories.read.getTeamOperations(query),
  ]);
  return { actionCenter, teamOperations };
}

function deriveFreshnessStatus(
  freshnessSummary: ActionCenterReadModel["freshnessSummary"],
): ExecutiveFreshnessStatus {
  if (freshnessSummary.unavailable > 0) return "unavailable";
  if (freshnessSummary.very_stale > 0) return "very_stale";
  if (freshnessSummary.stale > 0) return "stale";
  return "current";
}

export default async function ExecutiveActionCenterPage({
  searchParams,
}: PageProps) {
  const { actionCenter, teamOperations } = await readActionCenter(searchParams);
  const summary = actionCenter.sections.severitySummary;
  const freshnessStatus = deriveFreshnessStatus(actionCenter.freshnessSummary);

  return (
    <main className="space-y-6 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-700">
            <ListChecks className="size-4" aria-hidden="true" />
            Executive dashboard
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Action Center
          </h1>
          <p className="max-w-3xl text-sm text-slate-500">
            Prioritized operational queue for unresolved executive signals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton pageId="action_center" query={teamOperations.query} />
          <FreshnessBadge status={freshnessStatus} lastSuccessfulAt={actionCenter.generatedAt} />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Action Center severity summary">
        {(["critical", "high", "medium", "low"] as const).map((severity) => (
          <div key={severity} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-slate-400">{severity}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {summary[severity].toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      <SalesPipelineTable
        rows={teamOperations.sections.inquiryPipeline.rows}
        workloadRows={teamOperations.sections.salesSupportWorkload.rows}
      />

      <ActionItemsTable items={actionCenter.sections.actionItems} />
    </main>
  );
}
