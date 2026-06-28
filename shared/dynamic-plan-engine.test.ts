import assert from "node:assert/strict";
import test from "node:test";
import { calculateDynamicPlanAdjustment, createDefaultAdjustmentRules, adjustMacros } from "./dynamic-plan-engine";
import type { DynamicAdjustmentSettings } from "./dynamic-plan-engine";

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

test("宏量热量闭合：训练日和休息日的目标 calories 与三大营养素反算热量一致", () => {
  const rules = createDefaultAdjustmentRules(settings, "male");
  const target = { calories: 2200, proteinG: 130, fatG: 70, carbsG: 280 };

  const trainingDay = adjustMacros(target, 2200, { plannedCalories: 400, actualCalories: 0 }, rules);
  assert.equal(trainingDay.calories, 2200);
  const t = trainingDay.proteinG * 4 + trainingDay.fatG * 9 + trainingDay.carbsG * 4; assert.ok(Math.abs(t - 2200) <= 1, `trainingDay drifted: ${t}`);

  const restDay = adjustMacros(target, 1800, { plannedCalories: 0, actualCalories: 0 }, rules);
  assert.equal(restDay.calories, 1800);
  const r = restDay.proteinG * 4 + restDay.fatG * 9 + restDay.carbsG * 4; assert.ok(Math.abs(r - 1800) <= 1, `restDay drifted: ${r}`);
});

test("动态调整后的 adjustedDailyCalories 与 macros 热量一致", () => {
  const result = calculateDynamicPlanAdjustment({
    userProfile: { gender: "male", age: 30, heightCm: 175, weightKg: 70, trainingLevel: "intermediate" },
    goalPlan: { targetWeightKg: 65, targetDays: 56, targetBodyShapeId: "slight-line" },
    nutritionLedger: {
      target: { calories: 2000, proteinG: 120, fatG: 65, carbsG: 250 },
      actual: { calories: 2400, proteinG: 120, fatG: 70, carbsG: 300 },
      actualFoodIsDelta: false,
      mealDeltas: [
        { id: "breakfast", calories: 100 },
        { id: "lunch", calories: 200 },
        { id: "dinner", calories: 100 }
      ]
    },
    trainingLedger: { plannedCalories: 400, actualCalories: 250, plannedFocus: "chest", fatigue: 3 },
    databases: { foodCount: 100, exerciseCount: 50 },
    adjustmentRules: createDefaultAdjustmentRules(settings, "male")
  });

  const macroCalories = result.adjustedMacros.proteinG * 4 + result.adjustedMacros.fatG * 9 + result.adjustedMacros.carbsG * 4;
  assert.equal(result.adjustedMacros.calories, result.adjustedDailyCalories);
  assert.ok(Math.abs(macroCalories - result.adjustedDailyCalories) <= 2, `macro vs target: ${macroCalories} vs ${result.adjustedDailyCalories}`);
});
