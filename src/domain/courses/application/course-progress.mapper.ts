const toIsoOrNull = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
};

export const dateToIsoOrNull = toIsoOrNull;

export const clampPercentage = (value: number | undefined): number =>
  Math.min(100, Math.max(0, Math.round(value ?? 0)));

export const clampPosition = (value: number | undefined): number =>
  Math.max(0, Math.round(value ?? 0));
