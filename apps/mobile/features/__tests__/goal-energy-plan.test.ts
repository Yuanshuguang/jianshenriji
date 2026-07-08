import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateGoalEnergyPlan, getFoodByIdFromCatalog } from "@fitness-calendar/shared";

describe("calculateGoalEnergyPlan 边界情况", () => {
  const baseInput = {
    currentWeightKg: 80,
    targetWeightKg: 75,
    heightCm: 175,
    age: 30,
    gender: "male" as const,
    activityFactor: 1.55,
  };

  it("天数=0 应使用 Math.max(1, days) 兜底，不抛异常", () => {
    assert.doesNotThrow(() => {
      calculateGoalEnergyPlan({ ...baseInput, days: 0 });
    });
  });

  it("天数=0 时实际相当于天数=1，每日热量缺口最大", () => {
    const plan = calculateGoalEnergyPlan({ ...baseInput, days: 0 });
    assert.ok(plan.calories > 0, "calories 应为正数");
    assert.ok(plan.dailyDeficit >= -300, "dailyDeficit 不应低于 -300（限幅）");
    assert.ok(plan.proteinG > 0, "proteinG 应为正数");
    assert.ok(plan.fatG > 0, "fatG 应为正数");
    assert.ok(plan.carbsG > 0, "carbsG 应为正数");
  });

  it("天数为负数时应同样兜底，不抛异常", () => {
    assert.doesNotThrow(() => {
      calculateGoalEnergyPlan({ ...baseInput, days: -5 });
    });
  });

  it("维持体重（current === target）应产生小热量缺口或无限趋近", () => {
    const plan = calculateGoalEnergyPlan({ ...baseInput, targetWeightKg: 80, days: 90 });
    assert.ok(Math.abs(plan.dailyDeficit) <= 100, "维持体重时每日缺口应接近 0");
  });

  it("增肌场景（target > current）产生正热量缺口（surplus）", () => {
    const plan = calculateGoalEnergyPlan({ ...baseInput, targetWeightKg: 85, days: 90 });
    assert.ok(plan.calories > plan.tdee || plan.dailyDeficit < 0, "增肌时热量应 >= TDEE");
  });

  it("女性安全下限 1200 kcal", () => {
    const plan = calculateGoalEnergyPlan({ ...baseInput, gender: "female", currentWeightKg: 50, targetWeightKg: 45, days: 30 });
    assert.ok(plan.calories >= 1200, "女性 calories 不应低于 1200");
  });

  it("男性安全下限 1500 kcal", () => {
    const plan = calculateGoalEnergyPlan({ ...baseInput, currentWeightKg: 50, targetWeightKg: 45, days: 30 });
    assert.ok(plan.calories >= 1500, "男性 calories 不应低于 1500");
  });

  it("体脂率可用时使用去脂体重估算 BMR", () => {
    const mifflin = calculateGoalEnergyPlan({ ...baseInput, bodyFatPercent: null, days: 90 });
    const katch = calculateGoalEnergyPlan({ ...baseInput, bodyFatPercent: 40, days: 90 });

    assert.ok(katch.bmr < mifflin.bmr, "高体脂用户应基于去脂体重得到更低 BMR");
  });

  it("体脂率异常时回退 Mifflin-St Jeor", () => {
    const baseline = calculateGoalEnergyPlan({ ...baseInput, bodyFatPercent: null, days: 90 });
    const invalid = calculateGoalEnergyPlan({ ...baseInput, bodyFatPercent: 80, days: 90 });

    assert.equal(invalid.bmr, baseline.bmr);
  });
});
