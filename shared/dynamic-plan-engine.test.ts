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

test("宏量分配：训练日提高碳水，休息日相对降低碳水", () => {
  const rules = createDefaultAdjustmentRules(settings, "male");
  const target = { calories: 2200, proteinG: 130, fatG: 70, carbsG: 280 };

  const trainingDay = adjustMacros(target, 2200, { plannedCalories: 400, actualCalories: 0 }, rules);
  const restDay = adjustMacros(target, 2200, { plannedCalories: 0, actualCalories: 0 }, rules);

  assert.ok(trainingDay.carbsG > restDay.carbsG, `expected training carbs > rest carbs, got ${trainingDay.carbsG} <= ${restDay.carbsG}`);
  assert.ok(trainingDay.fatG < restDay.fatG, `expected training fat < rest fat, got ${trainingDay.fatG} >= ${restDay.fatG}`);
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

test("弹性调整：用户选择 5 天分摊时，2000 kcal 均摊为每天 400 kcal", () => {
  const result = calculateDynamicPlanAdjustment({
    userProfile: { gender: "male", age: 30, heightCm: 175, weightKg: 70, trainingLevel: "intermediate" },
    goalPlan: { targetWeightKg: 65, targetDays: 60, targetBodyShapeId: "slight-line" },
    nutritionLedger: {
      target: { calories: 2200, proteinG: 130, fatG: 70, carbsG: 280, bmr: 1700, tdee: 2700, dailyDeficit: 500 },
      actual: { calories: 4200, proteinG: 130, fatG: 70, carbsG: 780 },
      actualFoodIsDelta: false,
      mealDeltas: [{ id: "dinner", calories: 2000 }]
    },
    trainingLedger: { plannedCalories: 0, actualCalories: 0, fatigue: 2 },
    databases: { foodCount: 100, exerciseCount: 50 },
    adjustmentRules: createDefaultAdjustmentRules(settings, "male"),
    atonementPreference: { adjustmentMode: "repay-by-days", repayDays: 5 }
  });

  assert.equal(result.adjustmentMode, "repay-by-days");
  assert.equal(result.days, 5);
  assert.equal(result.dailyRepayCalories, 400);
  assert.equal(result.adjustedDailyCalories, 1800);
  assert.equal(result.deadlineExtensionDays, 0);
});

test("弹性调整：顺延目标时不压低后续每日摄入", () => {
  const result = calculateDynamicPlanAdjustment({
    userProfile: { gender: "male", age: 30, heightCm: 175, weightKg: 70, trainingLevel: "intermediate" },
    goalPlan: { targetWeightKg: 65, targetDays: 60, targetBodyShapeId: "slight-line" },
    nutritionLedger: {
      target: { calories: 2200, proteinG: 130, fatG: 70, carbsG: 280, bmr: 1700, tdee: 2700, dailyDeficit: 500 },
      actual: { calories: 4200, proteinG: 130, fatG: 70, carbsG: 780 },
      actualFoodIsDelta: false,
      mealDeltas: [{ id: "dinner", calories: 2000 }]
    },
    trainingLedger: { plannedCalories: 0, actualCalories: 0, fatigue: 2 },
    databases: { foodCount: 100, exerciseCount: 50 },
    adjustmentRules: createDefaultAdjustmentRules(settings, "male"),
    atonementPreference: { adjustmentMode: "extend-deadline", repayDays: 5 }
  });

  assert.equal(result.adjustmentMode, "extend-deadline");
  assert.equal(result.dailyRepayCalories, 0);
  assert.equal(result.adjustedDailyCalories, 2200);
  assert.equal(result.deadlineExtensionDays, 4);
  assert.equal(result.unresolvedCalories, 2000);
});

test("弹性调整：默认混合处理会部分扣减并把剩余差额顺延", () => {
  const result = calculateDynamicPlanAdjustment({
    userProfile: { gender: "male", age: 30, heightCm: 175, weightKg: 70, trainingLevel: "intermediate" },
    goalPlan: { targetWeightKg: 65, targetDays: 60, targetBodyShapeId: "slight-line" },
    nutritionLedger: {
      target: { calories: 2200, proteinG: 130, fatG: 70, carbsG: 280, bmr: 1700, tdee: 2700, dailyDeficit: 500 },
      actual: { calories: 4200, proteinG: 130, fatG: 70, carbsG: 780 },
      actualFoodIsDelta: false,
      mealDeltas: [{ id: "dinner", calories: 2000 }]
    },
    trainingLedger: { plannedCalories: 0, actualCalories: 0, fatigue: 2 },
    databases: { foodCount: 100, exerciseCount: 50 },
    adjustmentRules: createDefaultAdjustmentRules(settings, "male"),
    atonementPreference: { adjustmentMode: "hybrid", repayDays: 5 }
  });

  assert.equal(result.adjustmentMode, "hybrid");
  assert.equal(result.days, 5);
  assert.equal(result.dailyRepayCalories, 200);
  assert.equal(result.unresolvedCalories, 1000);
  assert.equal(result.deadlineExtensionDays, 2);
  assert.equal(result.adjustedDailyCalories, 2200 - result.dailyRepayCalories);
});

test("弹性调整：混合模式也要尊重用户指定的分摊天数", () => {
  const result = calculateDynamicPlanAdjustment({
    userProfile: { gender: "male", age: 30, heightCm: 175, weightKg: 70, trainingLevel: "intermediate" },
    goalPlan: { targetWeightKg: 65, targetDays: 60, targetBodyShapeId: "slight-line" },
    nutritionLedger: {
      target: { calories: 2200, proteinG: 130, fatG: 70, carbsG: 280, bmr: 1700, tdee: 2700, dailyDeficit: 500 },
      actual: { calories: 4200, proteinG: 130, fatG: 70, carbsG: 780 },
      actualFoodIsDelta: false,
      mealDeltas: [{ id: "dinner", calories: 2000 }]
    },
    trainingLedger: { plannedCalories: 0, actualCalories: 0, fatigue: 2 },
    databases: { foodCount: 100, exerciseCount: 50 },
    adjustmentRules: createDefaultAdjustmentRules(settings, "male"),
    atonementPreference: { adjustmentMode: "hybrid", repayDays: 5 }
  });

  assert.equal(result.adjustmentMode, "hybrid");
  assert.equal(result.days, 5);
  assert.equal(result.dailyRepayCalories, 200);
  assert.equal(result.deadlineExtensionDays, 2);
});

test("弹性调整：非法天数不会污染动态调整结果", () => {
  const result = calculateDynamicPlanAdjustment({
    userProfile: { gender: "male", age: 30, heightCm: 175, weightKg: 70, trainingLevel: "intermediate" },
    goalPlan: { targetWeightKg: 65, targetDays: 60, targetBodyShapeId: "slight-line" },
    nutritionLedger: {
      target: { calories: 2200, proteinG: 130, fatG: 70, carbsG: 280, bmr: 1700, tdee: 2700, dailyDeficit: 500 },
      actual: { calories: 4200, proteinG: 130, fatG: 70, carbsG: 780 },
      actualFoodIsDelta: false,
      mealDeltas: [{ id: "dinner", calories: 2000 }]
    },
    trainingLedger: { plannedCalories: 0, actualCalories: 0, fatigue: 2 },
    databases: { foodCount: 100, exerciseCount: 50 },
    adjustmentRules: createDefaultAdjustmentRules(settings, "male"),
    atonementPreference: { adjustmentMode: "repay-by-days", repayDays: Number.NaN }
  });

  assert.equal(result.days, 3);
  assert.equal(result.dailyRepayCalories, 400);
  assert.equal(result.adjustedDailyCalories, 1800);
  assert.ok(Number.isFinite(result.deadlineExtensionDays));
});

test("弹性调整：低于目标时进入恢复观察，不奖励性补吃", () => {
  const result = calculateDynamicPlanAdjustment({
    userProfile: { gender: "male", age: 30, heightCm: 175, weightKg: 70, trainingLevel: "intermediate" },
    goalPlan: { targetWeightKg: 65, targetDays: 30, targetBodyShapeId: "slight-line" },
    nutritionLedger: {
      target: { calories: 2200, proteinG: 130, fatG: 70, carbsG: 280, bmr: 1700, tdee: 2700, dailyDeficit: 500 },
      actual: { calories: 1500, proteinG: 120, fatG: 50, carbsG: 160 },
      actualFoodIsDelta: false,
      mealDeltas: [{ id: "dinner", calories: -700 }]
    },
    trainingLedger: { plannedCalories: 0, actualCalories: 0, fatigue: 2 },
    databases: { foodCount: 100, exerciseCount: 50 },
    adjustmentRules: createDefaultAdjustmentRules(settings, "male"),
    atonementPreference: { adjustmentMode: "repay-by-days", repayDays: 5 }
  });

  assert.equal(result.netDelta, -700);
  assert.equal(result.days, 0);
  assert.equal(result.dailyRepayCalories, 0);
  assert.equal(result.adjustedDailyCalories, 2200);
});

test("训练补偿：增肌期额外训练消耗允许保守补回", () => {
  const result = calculateDynamicPlanAdjustment({
    userProfile: { gender: "male", age: 30, heightCm: 175, weightKg: 70, trainingLevel: "intermediate" },
    goalPlan: { targetWeightKg: 75, targetDays: 60, targetBodyShapeId: "muscle" },
    nutritionLedger: {
      target: { calories: 2600, proteinG: 140, fatG: 80, carbsG: 330, bmr: 1700, tdee: 2400, dailyDeficit: -200 },
      actual: { calories: 2600, proteinG: 140, fatG: 80, carbsG: 330 },
      actualFoodIsDelta: false,
      mealDeltas: []
    },
    trainingLedger: { plannedCalories: 200, actualCalories: 700, fatigue: 2 },
    databases: { foodCount: 100, exerciseCount: 50 },
    adjustmentRules: createDefaultAdjustmentRules(settings, "male")
  });

  assert.equal(result.netDelta, -300);
  assert.equal(result.adjustedDailyCalories, 2900);
});

test("弹性调整：疲劳偏高时优先顺延目标", () => {
  const result = calculateDynamicPlanAdjustment({
    userProfile: { gender: "male", age: 30, heightCm: 175, weightKg: 70, trainingLevel: "intermediate" },
    goalPlan: { targetWeightKg: 65, targetDays: 30, targetBodyShapeId: "slight-line" },
    nutritionLedger: {
      target: { calories: 2200, proteinG: 130, fatG: 70, carbsG: 280, bmr: 1700, tdee: 2700, dailyDeficit: 500 },
      actual: { calories: 4200, proteinG: 130, fatG: 70, carbsG: 780 },
      actualFoodIsDelta: false,
      mealDeltas: [{ id: "dinner", calories: 2000 }]
    },
    trainingLedger: { plannedCalories: 0, actualCalories: 0, fatigue: 5 },
    databases: { foodCount: 100, exerciseCount: 50 },
    adjustmentRules: createDefaultAdjustmentRules(settings, "male"),
    atonementPreference: { adjustmentMode: "repay-by-days", repayDays: 5 }
  });

  assert.equal(result.adjustmentMode, "extend-deadline");
  assert.equal(result.dailyRepayCalories, 0);
  assert.equal(result.adjustedDailyCalories, 2200);
  assert.equal(result.deadlineExtensionDays, 4);
  assert.match(result.recoveryHint ?? "", /疲劳偏高/);
});

test("营养子开关：关闭碳水和脂肪调整时仍保持宏量热量闭合", () => {
  const lockedMacroSettings: DynamicAdjustmentSettings = {
    ...settings,
    nutrition: { calories: true, proteinG: true, fatG: false, carbsG: false }
  };
  const result = calculateDynamicPlanAdjustment({
    userProfile: { gender: "male", age: 30, heightCm: 175, weightKg: 70, trainingLevel: "intermediate" },
    goalPlan: { targetWeightKg: 65, targetDays: 30, targetBodyShapeId: "slight-line" },
    nutritionLedger: {
      target: { calories: 2200, proteinG: 130, fatG: 70, carbsG: 280, bmr: 1700, tdee: 2700, dailyDeficit: 500 },
      actual: { calories: 2600, proteinG: 130, fatG: 90, carbsG: 320 },
      actualFoodIsDelta: false,
      mealDeltas: [{ id: "dinner", calories: 400 }]
    },
    trainingLedger: { plannedCalories: 0, actualCalories: 0, fatigue: 2 },
    databases: { foodCount: 100, exerciseCount: 50 },
    adjustmentRules: createDefaultAdjustmentRules(lockedMacroSettings, "male"),
    atonementPreference: { adjustmentMode: "repay-by-days", repayDays: 4 }
  });

  assert.equal(result.adjustedMacros.fatG, 70);
  const macroCalories = result.adjustedMacros.proteinG * 4 + result.adjustedMacros.fatG * 9 + result.adjustedMacros.carbsG * 4;
  assert.ok(Math.abs(macroCalories - result.adjustedDailyCalories) <= 2, `macro vs target: ${macroCalories} vs ${result.adjustedDailyCalories}`);
});

test("动态宏量：低热量高蛋白目标不能挤掉脂肪和碳水底线", () => {
  const result = calculateDynamicPlanAdjustment({
    userProfile: { gender: "female", age: 30, heightCm: 162, weightKg: 55, trainingLevel: "intermediate" },
    goalPlan: { targetWeightKg: 52, targetDays: 56, targetBodyShapeId: "slight-line" },
    nutritionLedger: {
      target: { calories: 1400, proteinG: 180, fatG: 45, carbsG: 90, bmr: 1350, tdee: 1900, dailyDeficit: 500 },
      actual: { calories: 2200, proteinG: 180, fatG: 65, carbsG: 190 },
      actualFoodIsDelta: false,
      mealDeltas: [{ id: "dinner", calories: 800 }]
    },
    trainingLedger: { plannedCalories: 0, actualCalories: 0, fatigue: 2 },
    databases: { foodCount: 100, exerciseCount: 50 },
    adjustmentRules: createDefaultAdjustmentRules(settings, "female"),
    atonementPreference: { adjustmentMode: "repay-by-days", repayDays: 3 }
  });

  const macroCalories = result.adjustedMacros.proteinG * 4 + result.adjustedMacros.fatG * 9 + result.adjustedMacros.carbsG * 4;
  assert.equal(result.adjustedDailyCalories, 1200);
  assert.ok(result.adjustedMacros.proteinG <= 105, `protein too high: ${result.adjustedMacros.proteinG}`);
  assert.ok(result.adjustedMacros.fatG >= 30, `fat too low: ${result.adjustedMacros.fatG}`);
  assert.ok(result.adjustedMacros.carbsG >= 60, `carbs too low: ${result.adjustedMacros.carbsG}`);
  assert.ok(Math.abs(macroCalories - result.adjustedDailyCalories) <= 2, `macro vs target: ${macroCalories} vs ${result.adjustedDailyCalories}`);
});

test("弹性调整：维持期多吃不生成伪顺延天数", () => {
  const result = calculateDynamicPlanAdjustment({
    userProfile: { gender: "male", age: 30, heightCm: 175, weightKg: 70, trainingLevel: "intermediate" },
    goalPlan: { targetWeightKg: 70, targetDays: 56, targetBodyShapeId: "slight-line" },
    nutritionLedger: {
      target: { calories: 2400, proteinG: 140, fatG: 75, carbsG: 290, bmr: 1750, tdee: 2400, dailyDeficit: 0 },
      actual: { calories: 3000, proteinG: 140, fatG: 95, carbsG: 390 },
      actualFoodIsDelta: false,
      mealDeltas: [{ id: "dinner", calories: 600 }]
    },
    trainingLedger: { plannedCalories: 0, actualCalories: 0, fatigue: 2 },
    databases: { foodCount: 100, exerciseCount: 50 },
    adjustmentRules: createDefaultAdjustmentRules(settings, "male")
  });

  assert.equal(result.dailyRepayCalories, 0);
  assert.equal(result.deadlineExtensionDays, 0);
  assert.equal(result.unresolvedCalories, 600);
  assert.equal(result.adjustedDailyCalories, 2400);
});

test("餐次差额：明细不完整时回退到实际总差额", () => {
  const result = calculateDynamicPlanAdjustment({
    userProfile: { gender: "male", age: 30, heightCm: 175, weightKg: 70, trainingLevel: "intermediate" },
    goalPlan: { targetWeightKg: 65, targetDays: 56, targetBodyShapeId: "slight-line" },
    nutritionLedger: {
      target: { calories: 2200, proteinG: 130, fatG: 70, carbsG: 280, bmr: 1700, tdee: 2700, dailyDeficit: 500 },
      actual: { calories: 2700, proteinG: 130, fatG: 80, carbsG: 360 },
      actualFoodIsDelta: false,
      mealDeltas: [{ id: "lunch", calories: 200 }]
    },
    trainingLedger: { plannedCalories: 0, actualCalories: 0, fatigue: 2 },
    databases: { foodCount: 100, exerciseCount: 50 },
    adjustmentRules: createDefaultAdjustmentRules(settings, "male")
  });

  assert.equal(result.foodDelta, 500);
  assert.ok(result.ignoredRules.includes("meal-delta:incomplete"));
});
