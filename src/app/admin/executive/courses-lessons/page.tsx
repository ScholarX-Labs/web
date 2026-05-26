import { AlertTriangle, BookOpen } from "lucide-react";
import { createExecutiveDomain } from "@/domain/executive";
import { executivePageQuerySchema } from "@/domain/executive/contracts/executive-query.schemas";
import type {
  CoursesLessonsReadModel,
  LessonDrilldownReadModel,
} from "@/domain/executive/contracts/executive-read-repository.contract";
import { MetricCard } from "@/components/executive/sections/metric-card";
import { FreshnessBadge } from "@/components/executive/sections/freshness-badge";
import { ExportButton } from "@/components/executive/sections/export-button";
import { BarChart } from "@/components/executive/charts/bar-chart";
import { FunnelChart } from "@/components/executive/charts/funnel-chart";
import { CourseLeaderboardTable } from "@/components/executive/tables/course-leaderboard-table";
import { LessonAnalyticsTable } from "@/components/executive/tables/lesson-analytics-table";
import { CourseManagementTable } from "@/components/executive/tables/course-management-table";
import { ContentQualityChecklist } from "@/components/executive/sections/content-quality-checklist";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const metricPresentation = {
  "courses.total_courses": { label: "Total courses", format: "number", favorableDirection: "up" },
  "courses.active_courses": { label: "Active courses", format: "number", favorableDirection: "up" },
  "courses.total_enrollments": { label: "Enrollments", format: "number", favorableDirection: "up" },
  "courses.completion_rate": { label: "Completion rate", format: "percent", favorableDirection: "up" },
} as const;
type MetricPresentationKey = keyof typeof metricPresentation;

function isMetricPresentationKey(id: string): id is MetricPresentationKey {
  return id in metricPresentation;
}

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

async function readPage(searchParams: PageProps["searchParams"]): Promise<{
  courses: CoursesLessonsReadModel;
  drilldown: LessonDrilldownReadModel | null;
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
  const courses = await domain.repositories.read.getCoursesLessons(query);
  const drilldown = query.courseId
    ? await domain.repositories.read.getLessonDrilldown(query, query.courseId)
    : null;
  return { courses, drilldown };
}

export default async function CoursesLessonsPage({ searchParams }: PageProps) {
  const { courses, drilldown } = await readPage(searchParams);
  const leaderboardRows =
    drilldown && courses.query.courseId
      ? courses.sections.courseLeaderboard.rows.map((row) => {
          if (row.courseId !== courses.query.courseId) return row;
          const qualityFlags = new Set(row.qualityFlags);
          if (drilldown.sections.criticalDropFlags.length > 0) {
            qualityFlags.add("critical_drop");
          }
          return {
            ...row,
            qualityFlags: Array.from(qualityFlags),
          };
        })
      : courses.sections.courseLeaderboard.rows;

  return (
    <main className="space-y-6 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-700">
            <BookOpen className="size-4" aria-hidden="true" />
            Executive dashboard
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Courses and lessons
          </h1>
          <p className="max-w-3xl text-sm text-slate-500">
            {courses.query.from} to {courses.query.to}
            {courses.query.courseCategory ? ` · Category: ${courses.query.courseCategory}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton pageId="courses_lessons" query={courses.query} />
          <FreshnessBadge
            status={courses.sections.courseLeaderboard.state.freshness}
            lastSuccessfulAt={courses.sections.courseLeaderboard.state.lastSuccessfulAt}
          />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Course analytics key metrics">
        {courses.sections.kpis.map((kpi) => {
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

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.65fr)]">
        <CourseLeaderboardTable rows={leaderboardRows} />
        <BarChart
          chart={{
            ...courses.sections.categoryDistribution,
            points: courses.sections.categoryDistribution.points.map((point) => ({
              label: point.category,
              value: point.value,
            })),
          }}
          labelForPoint={(point) => point.label}
        />
      </section>

      <section
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        aria-labelledby="problem-course-signals"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="problem-course-signals" className="text-sm font-semibold text-slate-950">
            Problem course signals
          </h2>
          <span className="text-xs font-medium uppercase text-slate-400">
            {courses.sections.problemCourseSignals.length} open
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {courses.sections.problemCourseSignals.length === 0 ? (
            <p className="text-sm text-slate-500">No course-level signals detected.</p>
          ) : (
            courses.sections.problemCourseSignals.map((signal) => (
              <div key={`${signal.courseId}-${signal.message}`} className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-700" aria-hidden="true" />
                  <p className="font-medium text-slate-950">{signal.title}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">{signal.message}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {drilldown ? (
        <section className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.65fr)]">
          <LessonAnalyticsTable rows={drilldown.sections.lessonTable.rows} />
          <FunnelChart chart={drilldown.sections.completionFunnel} />
          </div>
          <ContentQualityChecklist rows={drilldown.sections.contentQualityChecklist.rows} />
        </section>
      ) : null}

      <CourseManagementTable rows={courses.sections.managementTable.rows} />
    </main>
  );
}
