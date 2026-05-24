export type CacheMetricSource = "cache" | "rate-limit" | "redis";

export type CacheMetricOutcome =
  | "hit"
  | "miss"
  | "set"
  | "delete"
  | "bypass"
  | "fallback"
  | "error"
  | "circuit_open"
  | "circuit_closed";

export interface CacheMetricEvent {
  source: CacheMetricSource;
  operation: string;
  outcome: CacheMetricOutcome;
  timestamp: string;
  durationMs?: number;
  context?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface CacheMetricsSnapshot {
  counts: Record<string, number>;
  recentEvents: CacheMetricEvent[];
}

const MAX_RECENT_EVENTS = 200;
const events: CacheMetricEvent[] = [];
const counts = new Map<string, number>();

function getCountKey(event: CacheMetricEvent): string {
  return `${event.source}:${event.operation}:${event.outcome}`;
}

export function emitCacheMetricEvent(
  event: Omit<CacheMetricEvent, "timestamp">,
): void {
  const timestamped: CacheMetricEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  events.push(timestamped);
  if (events.length > MAX_RECENT_EVENTS) {
    events.shift();
  }

  const countKey = getCountKey(timestamped);
  counts.set(countKey, (counts.get(countKey) ?? 0) + 1);

  if (process.env.NODE_ENV === "test") {
    return;
  }

  if (
    timestamped.outcome !== "error" &&
    timestamped.outcome !== "circuit_open"
  ) {
    return;
  }

  console.warn("[cache-metric]", {
    source: timestamped.source,
    operation: timestamped.operation,
    outcome: timestamped.outcome,
    durationMs: timestamped.durationMs,
    context: timestamped.context,
    metadata: timestamped.metadata,
    timestamp: timestamped.timestamp,
  });
}

export function getCacheMetricsSnapshot(): CacheMetricsSnapshot {
  return {
    counts: Object.fromEntries(counts.entries()),
    recentEvents: [...events],
  };
}

export function resetCacheMetricsForTests(): void {
  events.length = 0;
  counts.clear();
}
