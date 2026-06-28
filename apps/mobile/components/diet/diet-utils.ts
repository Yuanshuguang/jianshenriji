import type { DietPlan } from "../../features/diet-plans";
import {
  calculateDietPlanMacroTargets,
  resolveDietPlanDay,
  type EnergyPlan,
  type NutritionTotals,
} from "@fitness-calendar/shared";
import type { DietPlanSummary } from "./types";

export function buildDietPlanSummary(plan: DietPlan | undefined, energyPlan: EnergyPlan, date: Date): DietPlanSummary {
  const resolvedDay = resolveDietPlanDay(plan?.id ?? null, date);
  const targets = calculateDietPlanMacroTargets(plan?.id ?? null, energyPlan, {
    date,
    dayType: resolvedDay.dayType,
  });
  const name = plan?.name ?? "日常饮食计划";
  const logic = plan
    ? `${plan.logic} 当前使用${resolvedDay.variantName ? `「${resolvedDay.variantName}」` : "该方案默认规则"}，公式：${resolvedDay.formula}`
    : "未选择长期饮食方案时，系统使用日常均衡分配：先按目标体重周期计算每日热量，再保证蛋白质，随后分配脂肪和碳水。";

  return {
    name,
    status: resolvedDay.status,
    sourceLabel: plan ? "来自计划页已选择的饮食计划" : "未选择计划时的默认方案",
    macroLabel: `${targets.calories} kcal · 蛋白 ${targets.proteinG}g · 脂肪 ${targets.fatG}g · 碳水 ${targets.carbsG}g`,
    logic,
    allocation: [
      `热量：沿用今日目标 ${targets.calories} kcal，不因为切换饮食法自动突破总预算。`,
      `蛋白质：${targets.proteinG}g，优先保证饱腹感和训练恢复。`,
      `脂肪：${targets.fatG}g，由热量扣除蛋白和碳水后回填。`,
      `碳水：${targets.carbsG}g，${resolvedDay.status} 会影响碳水倾斜程度。`,
      ...resolvedDay.notes,
    ],
  };
}

export function numberOr(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createCustomFoodId(): string {
  const randomUUID = globalThis.crypto?.randomUUID?.();
  if (randomUUID) return `custom-${randomUUID}`;
  return `custom-${Math.random().toString(36).slice(2)}-${new Date().getTime().toString(36)}`;
}

export function hasTrainingRecord(status: string): boolean {
  return status !== "pending";
}

export function formatDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatMealFoods(meal?: { foods: Array<{ name: string; displayAmount?: string; grams: number }> }): string {
  if (!meal || meal.foods.length === 0) return "-";
  return meal.foods.map((item) => `${item.name} ${item.displayAmount ?? item.grams + "g"}`).join(" · ");
}
