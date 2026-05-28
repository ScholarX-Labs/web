export function calculateVariancePercent(
  sourceCount: number,
  mirroredCount: number,
): number {
  if (sourceCount <= 0) return mirroredCount === 0 ? 0 : 100;
  return Math.abs(sourceCount - mirroredCount) / sourceCount * 100;
}

export function isWithinVarianceThreshold(
  sourceCount: number,
  mirroredCount: number,
  thresholdPercent = 5,
): boolean {
  return calculateVariancePercent(sourceCount, mirroredCount) <= thresholdPercent;
}

