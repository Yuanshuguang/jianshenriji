import assert from "node:assert/strict";
import test from "node:test";
import { buildCustomFoodFromNutritionLabel } from "../nutrition-label-recognition";

test("nutrition label recognition builds custom food for menu library", () => {
  const food = buildCustomFoodFromNutritionLabel({
    name: "全麦蛋白棒",
    caloriesPer100g: 401.5,
    proteinPer100g: 22.5,
    fatPer100g: 12,
    carbsPer100g: 46.5,
    defaultUnitGram: 50,
  });

  assert.equal(food.name, "全麦蛋白棒");
  assert.equal(food.source, "custom");
  assert.equal(food.caloriesPer100g, 401.5);
  assert.equal(food.defaultUnitGram, 50);
});
