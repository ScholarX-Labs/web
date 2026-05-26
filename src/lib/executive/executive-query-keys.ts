import type { ExecutivePageId } from "@/domain/executive/contracts/executive-types";

export type ExecutiveQueryInput = Readonly<Record<string, unknown>>;

export const executiveQueryKeys = {
  all: ["executive"] as const,
  pages: () => [...executiveQueryKeys.all, "pages"] as const,
  page: (pageId: ExecutivePageId, query: ExecutiveQueryInput) =>
    [...executiveQueryKeys.pages(), pageId, query] as const,
  actionCenter: {
    all: () => [...executiveQueryKeys.all, "action-center"] as const,
    list: (query: ExecutiveQueryInput) =>
      [...executiveQueryKeys.actionCenter.all(), "list", query] as const,
    item: (itemId: string) =>
      [...executiveQueryKeys.actionCenter.all(), "item", itemId] as const,
  },
  exports: {
    all: () => [...executiveQueryKeys.all, "exports"] as const,
    request: (pageId: ExecutivePageId, query: ExecutiveQueryInput) =>
      [...executiveQueryKeys.exports.all(), pageId, query] as const,
  },
  publicImpact: {
    all: () => [...executiveQueryKeys.all, "public-impact"] as const,
    metrics: () => [...executiveQueryKeys.publicImpact.all(), "metrics"] as const,
    metric: (metricId: string) =>
      [...executiveQueryKeys.publicImpact.metrics(), metricId] as const,
  },
} as const;
