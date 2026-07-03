import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getFoodCatalog,
  recommendMacroAwarePortions,
  sumNutrition,
  type Food,
  type MealAdjustmentKey
} from "@fitness-calendar/shared";

const target = {
  calories: 1700,
  proteinG: 130,
  fatG: 45,
  carbsG: 180
};

function pickFood(name: string): Food {
  const food = getFoodCatalog().find((item) => item.name === name || item.aliases.includes(name));
  assert.ok(food, `missing food fixture: ${name}`);
  return food;
}

function assertClosedEnough(calories: number) {
  assert.ok(Math.abs(calories - target.calories) <= target.calories * 0.12, `calories ${calories} should stay close to ${target.calories}`);
}

test("储备食物：不吃早餐时不分配早餐，同时保持总量接近目标", () => {
  const portions = recommendMacroAwarePortions(
    [pickFood("鸡蛋"), pickFood("土豆"), pickFood("西兰花"), pickFood("香蕉")],
    target,
    {
      enabledMeals: { breakfast: false, lunch: true, dinner: true, snack: true },
      dayType: "balanced"
    }
  );
  const meals = new Set(portions.map((portion) => portion.meal));
  const totals = sumNutrition(portions.map((portion) => portion.totals));

  assert.equal(meals.has("breakfast"), false);
  assert.equal(meals.has("lunch"), true);
  assert.equal(meals.has("dinner"), true);
  assertClosedEnough(totals.calories);
});

test("储备食物：不吃晚餐时不分配晚餐，同时保持总量接近目标", () => {
  const portions = recommendMacroAwarePortions(
    [pickFood("鸡胸肉"), pickFood("米饭"), pickFood("西兰花"), pickFood("苹果")],
    target,
    {
      enabledMeals: { breakfast: true, lunch: true, dinner: false, snack: true },
      dayType: "high-carb"
    }
  );
  const meals = new Set(portions.map((portion) => portion.meal));
  const totals = sumNutrition(portions.map((portion) => portion.totals));

  assert.equal(meals.has("dinner"), false);
  assert.equal(meals.has("breakfast"), true);
  assert.equal(meals.has("lunch"), true);
  assertClosedEnough(totals.calories);
});

test("储备食物：极端关闭全部餐次时至少保留午餐兜底", () => {
  const enabledMeals = {
    breakfast: false,
    lunch: false,
    dinner: false,
    snack: false
  } satisfies Record<MealAdjustmentKey, boolean>;
  const portions = recommendMacroAwarePortions([pickFood("鸡胸肉"), pickFood("米饭")], target, { enabledMeals });
  const meals = new Set(portions.map((portion) => portion.meal));

  assert.deepEqual(Array.from(meals), ["lunch"]);
});
