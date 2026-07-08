import assert from "node:assert/strict";
import test from "node:test";

import { buildDailyAdjustmentSummary } from "../adjustments";
import type { DynamicAdjustmentSettings } from "@fitness-calendar/shared";

const settings: DynamicAdjustmentSettings = {
  nutrition: { calories: true, proteinG: true, fatG: true, carbsG: true },
  meals: { breakfast: true, lunch: true, dinner: true, snack: true },
  training: { calories: true, schedule: true, fatigue: true },
  muscles: {
    chest: true,
    back: true,
    legs: true,
    shoulders: true,
    arms: true,
    core: true,
    cardio: true
  }
};

test("buildDailyAdjustmentSummary returns readable diet quality warnings", () => {
  const summary = buildDailyAdjustmentSummary({
    target: { calories: 2200, proteinG: 140, fatG: 70, carbsG: 260, bmr: 1700, tdee: 2600, dailyDeficit: 400 },
    actualTotals: { calories: 1300, proteinG: 60, fatG: 20, carbsG: 120 },
    actualFoodIsDelta: false,
    plannedTrainingCalories: 200,
    actualTrainingCalories: 500,
    gender: "male",
    settings
  });

  assert.ok(summary.dietQualityWarnings.some((warning) => warning.includes("最低安全线")));
  assert.ok(summary.dietQualityWarnings.some((warning) => warning.includes("蛋白质明显不足")));
  assert.ok(summary.dietQualityWarnings.some((warning) => warning.includes("脂肪摄入偏低")));
  assert.ok(summary.dietQualityWarnings.some((warning) => warning.includes("碳水偏低")));
});
