import type {
  ExecutiveFreshnessStatus,
  ExecutiveSectionState,
} from "../contracts/executive-types";

export type FreshnessRecord = {
  sectionId: string;
  sourceKey: string;
  lastSuccessfulAt: Date | null;
  lastAttemptedAt: Date;
  status: ExecutiveFreshnessStatus;
  lastErrorCode?: string | null;
  lastQueryDurationMs?: number | null;
  rollingP95DurationMs?: number | null;
};

export interface FreshnessSink {
  record(record: FreshnessRecord): Promise<void>;
}

const FIVE_MINUTES_MS = 5 * 60 * 1_000;
const ONE_HOUR_MS = 60 * 60 * 1_000;

export class FreshnessService {
  constructor(private readonly sink?: FreshnessSink) {}

  classify(lastSuccessfulAt: Date | null, now: Date = new Date()): ExecutiveFreshnessStatus {
    if (!lastSuccessfulAt) return "unavailable";
    const ageMs = now.getTime() - lastSuccessfulAt.getTime();
    if (ageMs <= FIVE_MINUTES_MS) return "current";
    if (ageMs <= ONE_HOUR_MS) return "stale";
    return "very_stale";
  }

  toSectionState(record: FreshnessRecord): ExecutiveSectionState {
    return {
      status: record.status === "unavailable" ? "data_gap" : "ready",
      freshness: record.status,
      lastSuccessfulAt: record.lastSuccessfulAt?.toISOString() ?? null,
      source: record.sourceKey,
      ...(record.lastErrorCode ? { message: record.lastErrorCode } : {}),
    };
  }

  summarize(records: readonly FreshnessRecord[]): Record<ExecutiveFreshnessStatus, number> {
    return records.reduce(
      (summary, record) => {
        summary[record.status] += 1;
        return summary;
      },
      {
        current: 0,
        stale: 0,
        very_stale: 0,
        unavailable: 0,
      } satisfies Record<ExecutiveFreshnessStatus, number>,
    );
  }

  latencyStatus(record: Pick<FreshnessRecord, "lastQueryDurationMs" | "rollingP95DurationMs">): ExecutiveSectionState["status"] {
    const latest = record.lastQueryDurationMs ?? 0;
    const p95 = record.rollingP95DurationMs ?? latest;
    if (p95 >= 4_000 || latest >= 8_000) return "error";
    if (p95 >= 2_000 || latest >= 4_000) return "stale";
    return "ready";
  }

  async recordSuccess(
    sectionId: string,
    sourceKey: string,
    durationMs: number,
    now: Date = new Date(),
  ): Promise<FreshnessRecord> {
    const record: FreshnessRecord = {
      sectionId,
      sourceKey,
      lastSuccessfulAt: now,
      lastAttemptedAt: now,
      status: "current",
      lastQueryDurationMs: Math.max(0, Math.round(durationMs)),
    };
    await this.sink?.record(record);
    return record;
  }

  async recordFailure(
    sectionId: string,
    sourceKey: string,
    errorCode: string,
    previousSuccessAt: Date | null,
    now: Date = new Date(),
  ): Promise<FreshnessRecord> {
    const status = previousSuccessAt ? this.classify(previousSuccessAt, now) : "unavailable";
    const record: FreshnessRecord = {
      sectionId,
      sourceKey,
      lastSuccessfulAt: previousSuccessAt,
      lastAttemptedAt: now,
      status,
      lastErrorCode: errorCode,
    };
    await this.sink?.record(record);
    return record;
  }
}

export function createFreshnessService(sink?: FreshnessSink): FreshnessService {
  return new FreshnessService(sink);
}
