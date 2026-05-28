import assert from "node:assert/strict";
import test from "node:test";
import { getWebsiteAnalyticsSnapshot } from "../analytics-event.repository";

type ThenableRows<T> = {
  then: (onFulfilled: (value: T[]) => unknown, onRejected?: (reason: unknown) => unknown) => unknown;
  from: (...args: unknown[]) => ThenableRows<T>;
  where: (...args: unknown[]) => ThenableRows<T>;
  groupBy: (...args: unknown[]) => ThenableRows<T>;
  orderBy: (...args: unknown[]) => ThenableRows<T>;
  limit: (...args: unknown[]) => ThenableRows<T>;
};

function makeThenableRows<T>(rows: T[]): ThenableRows<T> {
  let chain: ThenableRows<T>;
  chain = {
    then(onFulfilled: (value: T[]) => unknown) {
      return Promise.resolve(rows).then(onFulfilled);
    },
    from: () => chain,
    where: () => chain,
    groupBy: () => chain,
    orderBy: () => chain,
    limit: () => chain,
  };
  return chain;
}

test("getWebsiteAnalyticsSnapshot maps and normalizes aggregated analytics rows", async () => {
  const selectResults = [
    makeThenableRows([{ label: "google", visits: 10 }]),
    makeThenableRows([{ label: "mobile", visits: 7 }]),
    makeThenableRows([{ label: "spring", visits: 4 }]),
    makeThenableRows([{ ctaId: "hero", label: "Hero CTA", clicks: 3 }]),
    makeThenableRows([{ eventType: "cta_click", value: 3 }]),
  ] as const;

  let call = 0;
  const fakeDb = {
    select: (..._args: unknown[]) => {
      const result = selectResults[call];
      call += 1;
      return result;
    },
  };

  const snapshot = await getWebsiteAnalyticsSnapshot(
    new Date("2026-05-01T00:00:00.000Z"),
    new Date("2026-05-25T23:59:59.999Z"),
    fakeDb,
  );

  assert.deepEqual(snapshot.trafficSources, [{ label: "google", visits: 10 }]);
  assert.deepEqual(snapshot.deviceBreakdown, [{ label: "mobile", visits: 7 }]);
  assert.deepEqual(snapshot.campaignPerformance, [{ label: "spring", visits: 4 }]);
  assert.deepEqual(snapshot.ctaPerformance, [{ ctaId: "hero", label: "Hero CTA", clicks: 3 }]);
  assert.equal(snapshot.ctaClicks, 3);
});
