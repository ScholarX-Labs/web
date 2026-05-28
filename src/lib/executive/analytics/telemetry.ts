type DeliveryOutcome = "success" | "failure";

type DeliveryCounterKey = `${string}:${DeliveryOutcome}`;

const deliveryCounters = new Map<DeliveryCounterKey, number>();

function toKey(context: string, outcome: DeliveryOutcome): DeliveryCounterKey {
  return `${context}:${outcome}`;
}

export function incrementDeliveryCounter(
  context: string,
  outcome: DeliveryOutcome,
): void {
  const key = toKey(context, outcome);
  deliveryCounters.set(key, (deliveryCounters.get(key) ?? 0) + 1);
}

export function getDeliveryCountersSnapshot(): Readonly<Record<string, number>> {
  return Object.fromEntries(deliveryCounters.entries());
}

export function resetDeliveryCounters(): void {
  deliveryCounters.clear();
}
