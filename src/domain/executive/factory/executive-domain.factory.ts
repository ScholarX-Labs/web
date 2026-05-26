import { createActionCenterRepository } from "@/domain/executive/infrastructure/db/action-center.repository";
import { createAnalyticsEventRepository } from "@/domain/executive/infrastructure/db/analytics-event.repository";
import { createExecutiveReadRepository } from "@/domain/executive/infrastructure/db/executive.repository";
import { createChartSeriesMapper } from "@/domain/executive/application/chart-series.mapper";
import { createFreshnessService } from "@/domain/executive/application/freshness.service";
import { createMetricCalculationPolicy } from "@/domain/executive/application/metric-calculation.policy";
import { createMetricDefinitionRegistry } from "@/domain/executive/application/metric-definition.registry";
import { createExecutiveRedactionPolicy } from "@/domain/executive/application/redaction.policy";

export const createExecutiveDomain = () => {
  const readRepository = createExecutiveReadRepository();
  const actionCenterRepository = createActionCenterRepository();
  const analyticsEventRepository = createAnalyticsEventRepository();

  return {
    repositories: {
      read: readRepository,
      actionCenter: actionCenterRepository,
      analyticsEvents: analyticsEventRepository,
    },
    policies: {
      calculations: createMetricCalculationPolicy(),
      redaction: createExecutiveRedactionPolicy(),
    },
    services: {
      freshness: createFreshnessService(),
    },
    mappers: {
      charts: createChartSeriesMapper(),
    },
    registries: {
      metrics: createMetricDefinitionRegistry(),
    },
  };
};

export type ExecutiveDomain = ReturnType<typeof createExecutiveDomain>;
