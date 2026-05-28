import { ANALYTICS_EVENTS } from "@/lib/executive/analytics/constants";
import { trackClientEvent } from "@/lib/executive/analytics/client";

function latencyBucket(ms: number): string {
  if (ms < 500) return "lt_500ms";
  if (ms < 1500) return "500_1500ms";
  if (ms < 3000) return "1500_3000ms";
  return "gte_3000ms";
}

function resultCountBucket(count: number): string {
  if (count <= 0) return "zero";
  if (count <= 3) return "one_to_three";
  if (count <= 10) return "four_to_ten";
  return "gt_ten";
}

export function trackAiSearchResult(input: {
  query: string;
  resultCount: number;
  latencyMs: number;
  ok: boolean;
}): void {
  void trackClientEvent({
    event: ANALYTICS_EVENTS.AI_SEARCH,
    properties: {
      query_intent_category: input.query.trim() ? "general" : "empty",
      result_count_bucket: resultCountBucket(input.resultCount),
      latency_bucket: latencyBucket(input.latencyMs),
      resultCount: input.resultCount,
      latencyMs: input.latencyMs,
      zeroResults: input.resultCount === 0,
      status: input.ok ? "ok" : "failed",
    },
  });
}

