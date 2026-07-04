import { test } from "node:test";
import assert from "node:assert/strict";
import {
  foods,
  solveMealPlan,
  type Food,
  type FoodPortion,
  type MealPlannerMeal,
  type NutritionTotals
} from "@fitness-calendar/shared";

const target: NutritionTotals = {
  calories: 1700,
  proteinG: 130,
  fatG: 45,
  carbsG: 180
};

function food(id: string): Food {
  const item = foods.find((entry) => entry.id === id);
  assert.ok(item, `missing food fixture: ${id}`);
  return item;
}

function mealSet(portions: FoodPortion[]): Set<MealPlannerMeal | undefined> {
  return new Set(portions.map((portion) => portion.meal));
}

function mealCalories(portions: FoodPortion[], meal: MealPlannerMeal): number {
  return portions
    .filter((portion) => portion.meal === meal)
    .reduce((sum, portion) => sum + portion.totals.calories, 0);
}

function portionGrams(portions: FoodPortion[], id: string, meal?: MealPlannerMeal): number {
  return portions
    .filter((portion) => portion.foodId === id && (!meal || portion.meal === meal))
    .reduce((sum, portion) => sum + Math.abs(portion.grams), 0);
}

function expectCaloriesClose(actual: number, expected: number, tolerance = 0.12) {
  assert.ok(Math.abs(actual - expected) <= expected * tolerance, `${actual} should be close to ${expected}`);
}

test("正常四餐：主食、蛋白、蔬菜、水果按餐次角色分配", () => {
  const result = solveMealPlan({
    foods: [food("chicken-breast"), food("rice-cooked"), food("broccoli"), food("apple")],
    target
  });
  const meals = mealSet(result.portions);

  assert.equal(meals.has("breakfast"), true);
  assert.equal(meals.has("lunch"), true);
  assert.equal(meals.has("dinner"), true);
  assert.equal(meals.has("snack"), true);
  expectCaloriesClose(result.totals.calories, target.calories);
});

test("不吃早餐：不生成早餐，热量归一到剩余餐次", () => {
  const result = solveMealPlan({
    foods: [food("chicken-breast"), food("rice-cooked"), food("broccoli"), food("banana")],
    target,
    enabledMeals: { breakfast: false, lunch: true, dinner: true, snack: true }
  });
  const meals = mealSet(result.portions);

  assert.equal(meals.has("breakfast"), false);
  assert.equal(meals.has("lunch"), true);
  assert.equal(meals.has("dinner"), true);
  expectCaloriesClose(result.totals.calories, target.calories);
});

test("不吃晚餐：不生成晚餐，计划提前到早餐、午餐和加餐", () => {
  const result = solveMealPlan({
    foods: [food("egg"), food("chicken-breast"), food("potato"), food("broccoli"), food("apple")],
    target,
    enabledMeals: { breakfast: true, lunch: true, dinner: false, snack: true }
  });
  const meals = mealSet(result.portions);

  assert.equal(meals.has("dinner"), false);
  assert.equal(meals.has("breakfast"), true);
  assert.equal(meals.has("lunch"), true);
  expectCaloriesClose(result.totals.calories, target.calories);
});

test("只吃午晚两餐：只分配到午餐和晚餐", () => {
  const result = solveMealPlan({
    foods: [food("chicken-breast"), food("rice-cooked"), food("broccoli"), food("tofu")],
    target,
    enabledMeals: { breakfast: false, lunch: true, dinner: true, snack: false }
  });
  const meals = mealSet(result.portions);

  assert.deepEqual(Array.from(meals).sort(), ["dinner", "lunch"]);
  expectCaloriesClose(result.totals.calories, target.calories);
});

test("高碳日练腿：午餐承接更多能量和主食", () => {
  const result = solveMealPlan({
    foods: [food("chicken-breast"), food("rice-cooked"), food("potato"), food("broccoli"), food("banana")],
    target,
    dayType: "high-carb",
    trainingFocus: "legs"
  });

  assert.ok(mealCalories(result.portions, "lunch") >= mealCalories(result.portions, "dinner"));
  assert.ok(portionGrams(result.portions, "rice-cooked", "lunch") >= portionGrams(result.portions, "rice-cooked", "dinner"));
});

test("低碳休息日：晚餐主食不应高于午餐", () => {
  const result = solveMealPlan({
    foods: [food("chicken-breast"), food("rice-cooked"), food("potato"), food("broccoli")],
    target,
    dayType: "low-carb",
    trainingFocus: null
  });

  assert.ok(portionGrams(result.portions, "rice-cooked", "dinner") <= portionGrams(result.portions, "rice-cooked", "lunch"));
});

test("只有蔬菜水果：不为了闭合硬造离谱份量，并返回不可闭合提示", () => {
  const result = solveMealPlan({
    foods: [food("broccoli"), food("cabbage"), food("banana"), food("apple")],
    target
  });

  assert.ok(result.totals.calories < target.calories * 0.75);
  assert.ok(result.warnings.some((warning) => warning.includes("无法")));
  assert.ok(portionGrams(result.portions, "broccoli") <= 440);
  assert.ok(portionGrams(result.portions, "banana") <= 120);
});

test("有主食蛋白蔬菜：在常识份量内合理闭合", () => {
  const result = solveMealPlan({
    foods: [food("chicken-breast"), food("rice-cooked"), food("potato"), food("broccoli"), food("protein-powder")],
    target
  });

  expectCaloriesClose(result.totals.calories, target.calories);
  assert.equal(result.warnings.some((warning) => warning.includes("无法")), false);
  assert.ok(portionGrams(result.portions, "broccoli") <= 560);
});

test("成品菜不拆分：方便面只作为一份进入一个餐次", () => {
  const result = solveMealPlan({
    foods: [food("instant-noodles")],
    target
  });

  assert.equal(result.portions.filter((portion) => portion.foodId === "instant-noodles").length, 1);
});

test("整份食品：鸡蛋和香蕉不会为了闭合热量无限放大", () => {
  const result = solveMealPlan({
    foods: [food("egg"), food("banana")],
    target
  });

  assert.equal(portionGrams(result.portions, "egg"), 55);
  assert.equal(portionGrams(result.portions, "banana"), 120);
  assert.ok(result.warnings.some((warning) => warning.includes("无法")));
});

test("极端快餐池：可以估算热量，但必须提示蛋白不足和脂肪偏高", () => {
  const result = solveMealPlan({
    foods: [food("hamburger"), food("chips"), food("cola")],
    target: { calories: 2200, proteinG: 130, fatG: 70, carbsG: 280 }
  });

  assert.ok(result.totals.proteinG < 130 * 0.75);
  assert.ok(result.warnings.some((warning) => warning.includes("蛋白质明显不足")));
  assert.ok(result.warnings.some((warning) => warning.includes("脂肪明显偏高")));
});

test("极端主食池：不能把低蛋白低脂搭配包装成正常健身餐", () => {
  const result = solveMealPlan({
    foods: [food("rice-cooked"), food("noodles"), food("mantou")],
    target: { calories: 2200, proteinG: 130, fatG: 70, carbsG: 280 }
  });

  assert.ok(result.warnings.some((warning) => warning.includes("缺少优质蛋白")));
  assert.ok(result.warnings.some((warning) => warning.includes("脂肪过低")));
  assert.ok(result.warnings.some((warning) => warning.includes("不适合作为默认健身餐")));
});

test("极端蛋白池：蛋白粉或鸡胸肉份量过大时必须预警", () => {
  const result = solveMealPlan({
    foods: [food("chicken-breast"), food("beef"), food("protein-powder")],
    target: { calories: 2200, proteinG: 130, fatG: 70, carbsG: 280 }
  });

  assert.ok(result.totals.carbsG < 60);
  assert.ok(result.warnings.some((warning) => warning.includes("碳水明显不足")));
  assert.ok(result.warnings.some((warning) => warning.includes("不适合作为默认健身餐")));
});
