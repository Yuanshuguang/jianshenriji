import type { DailyLogEntry, NutritionTotals } from "./index";

export type MacroLedgerKey = "proteinG" | "fatG" | "carbsG";
export type MacroLedgerTone = "low" | "high" | "ok";

export type MacroLedgerStat = {
  key: MacroLedgerKey;
  label: string;
  unit: "g";
  target: number;
  actual: number;
  delta: number;
  averageDelta: number;
  tone: MacroLedgerTone;
  safeAdjustmentPerDay: number;
  advice: string;
};

export type CalorieLedgerDayEntry = {
  date: string;
  targetCalories: number;
  actualCalories: number;
  calorieDelta: number;
  runningNetCalories: number;
  targetMacros: NutritionTotals;
  actualMacros: NutritionTotals;
  macroStats: MacroLedgerStat[];
};

export type CalorieLedgerSummary = {
  startDate: string | null;
  endDate: string | null;
  days: number;
  today: CalorieLedgerDayEntry | null;
  totalOverCalories: number;
  totalUnderCalories: number;
  netCaloriesDelta: number;
  averageDailyCalorieDelta: number;
  suggestedDailyCalorieAdjustment: number;
  calorieAdvice: string;
  macroStats: MacroLedgerStat[];
  dayEntries: CalorieLedgerDayEntry[];
};

export type CalorieLedgerWindow = {
  startDate?: string;
  endDate?: string;
  limitDays?: number;
  targetNutritionFallback?: NutritionTotals;
};

const emptyTotals: NutritionTotals = { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 };

const macroMeta: Record<MacroLedgerKey, { label: string; safeAdjustmentPerDay: number; tolerance: number }> = {
  proteinG: { label: "蛋白质", safeAdjustmentPerDay: 25, tolerance: 10 },
  fatG: { label: "脂肪", safeAdjustmentPerDay: 10, tolerance: 5 },
  carbsG: { label: "碳水", safeAdjustmentPerDay: 35, tolerance: 15 }
};

export function buildCalorieLedgerTimeline(
  historyLogs: Record<string, DailyLogEntry>,
  window?: CalorieLedgerWindow
): CalorieLedgerSummary {
  const orderedEntries = Object.values(historyLogs)
    .filter((entry): entry is DailyLogEntry => Boolean(entry?.date))
    .sort((left, right) => left.date.localeCompare(right.date));

  const boundedEntries = orderedEntries.filter((entry) => {
    if (window?.startDate && entry.date < window.startDate) return false;
    if (window?.endDate && entry.date > window.endDate) return false;
    return true;
  });

  const selectedEntries = typeof window?.limitDays === "number" && Number.isFinite(window.limitDays) && window.limitDays > 0
    ? boundedEntries.slice(-Math.round(window.limitDays))
    : boundedEntries;

  let runningNetCalories = 0;
  let totalOverCalories = 0;
  let totalUnderCalories = 0;
  const macroActualTotals = { ...emptyTotals };
  const macroTargetTotals = { ...emptyTotals };
  const dayEntries: CalorieLedgerDayEntry[] = [];

  for (const entry of selectedEntries) {
    const targetMacros = normalizeTargetMacros(entry, window?.targetNutritionFallback);
    const actualMacros = normalizeTotals(entry.actualIntake);
    const calorieDelta = Math.round(actualMacros.calories - targetMacros.calories);
    runningNetCalories += calorieDelta;
    totalOverCalories += Math.max(0, calorieDelta);
    totalUnderCalories += Math.max(0, -calorieDelta);
    addTotals(macroActualTotals, actualMacros);
    addTotals(macroTargetTotals, targetMacros);

    dayEntries.push({
      date: entry.date,
      targetCalories: Math.round(targetMacros.calories),
      actualCalories: Math.round(actualMacros.calories),
      calorieDelta,
      runningNetCalories,
      targetMacros,
      actualMacros,
      macroStats: buildMacroStats(actualMacros, targetMacros, 1)
    });
  }

  const days = dayEntries.length;
  const netCaloriesDelta = totalOverCalories - totalUnderCalories;
  const suggestedDailyCalorieAdjustment = buildSuggestedDailyCalorieAdjustment(netCaloriesDelta);

  return {
    startDate: dayEntries[0]?.date ?? null,
    endDate: dayEntries.at(-1)?.date ?? null,
    days,
    today: dayEntries.at(-1) ?? null,
    totalOverCalories,
    totalUnderCalories,
    netCaloriesDelta,
    averageDailyCalorieDelta: days > 0 ? Math.round(netCaloriesDelta / days) : 0,
    suggestedDailyCalorieAdjustment,
    calorieAdvice: buildCalorieAdvice(netCaloriesDelta, suggestedDailyCalorieAdjustment),
    macroStats: buildMacroStats(macroActualTotals, macroTargetTotals, Math.max(1, days)),
    dayEntries
  };
}

/**
 * 兼容旧调用点；新 UI 应使用 buildCalorieLedgerTimeline。
 */
export const buildCalorieDebtTimeline = buildCalorieLedgerTimeline;

function normalizeTargetMacros(entry: DailyLogEntry, fallback?: NutritionTotals): NutritionTotals {
  return normalizeTotals(entry.targetMacros ?? fallback ?? {
    calories: entry.targetCalories,
    proteinG: 0,
    fatG: 0,
    carbsG: 0
  });
}

function normalizeTotals(totals: NutritionTotals): NutritionTotals {
  return {
    calories: finiteNumber(totals.calories),
    proteinG: finiteNumber(totals.proteinG),
    fatG: finiteNumber(totals.fatG),
    carbsG: finiteNumber(totals.carbsG)
  };
}

function addTotals(target: NutritionTotals, value: NutritionTotals) {
  target.calories += value.calories;
  target.proteinG += value.proteinG;
  target.fatG += value.fatG;
  target.carbsG += value.carbsG;
}

function buildMacroStats(actual: NutritionTotals, target: NutritionTotals, days: number): MacroLedgerStat[] {
  return (Object.keys(macroMeta) as MacroLedgerKey[]).map((key) => {
    const meta = macroMeta[key];
    const delta = Math.round(actual[key] - target[key]);
    const averageDelta = Math.round(delta / Math.max(1, days));
    const tone: MacroLedgerTone = Math.abs(averageDelta) <= meta.tolerance
      ? "ok"
      : averageDelta > 0
        ? "high"
        : "low";

    return {
      key,
      label: meta.label,
      unit: "g",
      target: Math.round(target[key]),
      actual: Math.round(actual[key]),
      delta,
      averageDelta,
      tone,
      safeAdjustmentPerDay: meta.safeAdjustmentPerDay,
      advice: buildMacroAdvice(key, tone, averageDelta, meta.safeAdjustmentPerDay)
    };
  });
}

function buildSuggestedDailyCalorieAdjustment(netCaloriesDelta: number): number {
  if (netCaloriesDelta === 0) return 0;
  const raw = Math.ceil(Math.abs(netCaloriesDelta) / 7);
  return Math.min(300, Math.max(50, raw));
}

function buildCalorieAdvice(netCaloriesDelta: number, dailyAdjustment: number): string {
  if (netCaloriesDelta > 0) {
    return `这段时间净多摄入 ${netCaloriesDelta} kcal，建议用每天约 ${dailyAdjustment} kcal 的温和缺口平滑处理。`;
  }
  if (netCaloriesDelta < 0) {
    return `这段时间净少摄入 ${Math.abs(netCaloriesDelta)} kcal，后续优先回到计划摄入，不建议用暴食补回。`;
  }
  return "这段时间热量基本贴近计划，继续按原目标执行。";
}

function buildMacroAdvice(key: MacroLedgerKey, tone: MacroLedgerTone, averageDelta: number, safeAdjustmentPerDay: number): string {
  if (tone === "ok") return "接近计划范围，继续按每日目标分配到各餐。";

  const abs = Math.abs(averageDelta);
  if (key === "proteinG") {
    return tone === "low"
      ? `平均每天少约 ${abs}g，不建议一次补齐；后续每天增加不超过 ${safeAdjustmentPerDay}g，并分到 2-4 餐。`
      : `平均每天多约 ${abs}g，通常不需要“抵扣”，后续回到目标范围即可。`;
  }

  if (key === "fatG") {
    return tone === "low"
      ? `平均每天少约 ${abs}g，优先恢复到每日目标附近，不要短期集中高脂补偿。`
      : `平均每天多约 ${abs}g，后续减少油脂、坚果、甜品等高脂来源即可。`;
  }

  return tone === "low"
    ? `平均每天少约 ${abs}g，可优先放在训练日前后补足，不需要一次性吃回。`
    : `平均每天多约 ${abs}g，后续按训练量下调主食和含糖饮品。`;
}

function finiteNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
