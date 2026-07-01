function toSafeNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function getMetricCompareParts(actual: number, target: number) {
  const safeActual = toSafeNumber(actual);
  const safeTarget = toSafeNumber(target);
  const max = Math.max(safeActual, safeTarget);

  if (safeTarget <= 0 || max <= 0) {
    return {
      actualPercent: 0,
      targetPercent: 0,
      overflowStartPercent: 0,
      overflowPercent: 0,
    };
  }

  const actualPercent = safeActual / max;
  const targetPercent = safeTarget / max;

  return {
    actualPercent,
    targetPercent,
    overflowStartPercent: Math.min(actualPercent, targetPercent),
    overflowPercent: Math.max(0, actualPercent - targetPercent),
  };
}
