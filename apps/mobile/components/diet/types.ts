import type { SemanticColor } from "../bento";
import type { NutritionTotals, EnergyPlan, MealAdjustmentKey } from "@fitness-calendar/shared";

export type FoodRecordMode = "actual" | "prepared";

export type DashboardMetric = {
  key: string;
  label: string;
  unit: string;
  target: number;
  actual: number;
  color: SemanticColor;
  progress: number;
};

export type FoodTagEdit = {
  key: string;
  label: string;
  calories: string;
};

export type DietPlanSummary = {
  name: string;
  status: string;
  sourceLabel: string;
  macroLabel: string;
  logic: string;
  allocation: string[];
};

export type { NutritionTotals, EnergyPlan, MealAdjustmentKey };

export const mealSlots: Array<{ id: MealAdjustmentKey; name: string }> = [
  { id: "breakfast", name: "早餐" },
  { id: "lunch", name: "午餐" },
  { id: "dinner", name: "晚餐" },
  { id: "snack", name: "加餐" },
];
