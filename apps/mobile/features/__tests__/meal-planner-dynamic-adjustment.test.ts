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

function food(id: string): Food {
  const item = foods.find((entry) => entry.id === id);
  assert.ok(item, `missing food fixture: ${id}`);
  return item;
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

test("高碳日储备食物分配不能为了热量闭合无限放大土豆导致碳水超标", () => {
  const target: NutritionTotals = {
    calories: 1713,
    proteinG: 135,
    fatG: 48,
    carbsG: 237
  };
  const result = solveMealPlan({
    foods: [food("egg"), food("chicken-breast"), food("potato"), food("broccoli")],
    target,
    dayType: "high-carb",
    trainingFocus: "legs"
  });

  assert.ok(Math.abs(result.totals.carbsG - target.carbsG) <= 5, `carbs ${result.totals.carbsG} should match target ${target.carbsG}`);
  assert.ok(Math.abs(result.totals.proteinG - target.proteinG) <= 8, `protein ${result.totals.proteinG} should match target ${target.proteinG}`);
  assert.ok(Math.abs(result.totals.fatG - target.fatG) <= 6, `fat ${result.totals.fatG} should match target ${target.fatG}`);
  assert.ok(portionGrams(result.portions, "potato", "lunch") <= 610);
  assert.ok(portionGrams(result.portions, "potato", "dinner") <= 610);
  assert.ok(portionGrams(result.portions, "cooking-oil") <= 25);
  assert.ok(mealCalories(result.portions, "lunch") >= mealCalories(result.portions, "dinner"));
});

test("用户把午餐鸡胸肉滑到 0 后，鸡胸肉会重分配到其他未锁定餐次", () => {
  const target: NutritionTotals = {
    calories: 1713,
    proteinG: 135,
    fatG: 48,
    carbsG: 237
  };
  const base = solveMealPlan({
    foods: [food("egg"), food("chicken-breast"), food("potato"), food("broccoli")],
    target,
    dayType: "high-carb",
    trainingFocus: "legs"
  });
  const adjusted = solveMealPlan({
    foods: [food("egg"), food("chicken-breast"), food("potato"), food("broccoli")],
    target,
    dayType: "high-carb",
    trainingFocus: "legs",
    adjustments: {
      foodGrams: {
        "lunch:chicken-breast": 0
      }
    }
  });

  assert.equal(portionGrams(adjusted.portions, "chicken-breast", "lunch"), 0);
  assert.ok(portionGrams(adjusted.portions, "chicken-breast") >= portionGrams(base.portions, "chicken-breast") - 5);
  assert.ok(portionGrams(adjusted.portions, "chicken-breast", "dinner") > portionGrams(base.portions, "chicken-breast", "dinner"));
});

test("锁定早餐后，午餐减少的鸡胸肉不会分配到早餐", () => {
  const target: NutritionTotals = {
    calories: 1713,
    proteinG: 135,
    fatG: 48,
    carbsG: 237
  };
  const base = solveMealPlan({
    foods: [food("egg"), food("chicken-breast"), food("potato"), food("broccoli")],
    target,
    dayType: "high-carb",
    trainingFocus: "legs"
  });
  const adjusted = solveMealPlan({
    foods: [food("egg"), food("chicken-breast"), food("potato"), food("broccoli")],
    target,
    dayType: "high-carb",
    trainingFocus: "legs",
    adjustments: {
      lockedMeals: { breakfast: true },
      foodGrams: {
        "lunch:chicken-breast": 0
      }
    }
  });

  assert.equal(portionGrams(adjusted.portions, "chicken-breast", "lunch"), 0);
  assert.equal(portionGrams(adjusted.portions, "chicken-breast", "breakfast"), portionGrams(base.portions, "chicken-breast", "breakfast"));
  assert.ok(portionGrams(adjusted.portions, "chicken-breast", "dinner") + portionGrams(adjusted.portions, "chicken-breast", "snack") > portionGrams(base.portions, "chicken-breast", "dinner") + portionGrams(base.portions, "chicken-breast", "snack"));
});
