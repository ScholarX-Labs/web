# Contract: Executive Read Model

## Repository Port

The executive domain owns a typed read repository. It returns normalized records only, never raw
database rows.

```ts
interface ExecutiveReadRepository {
  getOverview(query: ExecutivePageQuery): Promise<OverviewReadModel>;
  getUsers(query: ExecutivePageQuery): Promise<UsersReadModel>;
  getCoursesLessons(query: ExecutivePageQuery): Promise<CoursesLessonsReadModel>;
  getLessonDrilldown(query: ExecutivePageQuery, courseId: string): Promise<LessonDrilldownReadModel>;
  getLearnerProgress(query: ExecutivePageQuery): Promise<LearnerProgressReadModel>;
  getOpportunitiesAi(query: ExecutivePageQuery): Promise<OpportunitiesAiReadModel>;
  getTechnicalHealth(query: ExecutivePageQuery): Promise<TechnicalHealthReadModel>;
  getPublicGrowth(query: ExecutivePageQuery): Promise<PublicGrowthReadModel>;
  getTeamOperations(query: ExecutivePageQuery): Promise<TeamOperationsReadModel>;
  getFinance(query: ExecutivePageQuery): Promise<FinanceReadModel>;
}
```

## Section State

Every section must carry state metadata:

```ts
type SectionStatus =
  | "ready"
  | "empty"
  | "data_gap"
  | "stale"
  | "partial"
  | "error"
  | "access_denied";

interface SectionState {
  status: SectionStatus;
  freshness: "current" | "stale" | "very_stale" | "unavailable";
  lastSuccessfulAt: string | null;
  message?: string;
  source?: string;
}
```

## Metric Definition

```ts
interface MetricDefinition {
  id: string;
  label: string;
  description: string;
  calculation: string;
  format: "number" | "currency" | "percent" | "duration";
  favorableDirection: "up" | "down" | "neutral";
  sensitivity: "public_safe" | "admin_only" | "executive_only" | "restricted";
}
```

## Metric Value

```ts
interface MetricValue {
  definitionId: string;
  value: number | string | null;
  previousValue: number | string | null;
  deltaValue: number | null;
  deltaPercent: number | null;
  state: SectionState;
}
```

## Chart Contract

Every chart DTO must include an accessibility summary.

```ts
interface ChartModel<TPoint> {
  id: string;
  title: string;
  chartType:
    | "line"
    | "area"
    | "bar"
    | "stacked_bar"
    | "horizontal_bar"
    | "donut"
    | "funnel"
    | "heatmap"
    | "waterfall";
  points: TPoint[];
  a11ySummary: string;
  state: SectionState;
  isZoomed: boolean;
}
```

## Data Integrity Rules

- Cards, drilldowns, and exports for the same metric must call the same service method or shared calculator.
- Date bucketing is daily for ranges <= 30 days, weekly for ranges <= 90 days, monthly for ranges > 90 days.
- True zero must return `value: 0` and `state.status: "empty"` only if the source query succeeded.
- Missing instrumentation must return `value: null` and `state.status: "data_gap"`.
- Restricted data must be removed before the route returns.
