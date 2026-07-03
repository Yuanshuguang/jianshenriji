import assert from "node:assert/strict";
import test from "node:test";
import { calculateFoodTotals } from "@fitness-calendar/shared";
import { resolveDishRecognitionFoods } from "../food-image-recognition";

test("image recognition resolves known dishes into catalog foods", () => {
  const foods = resolveDishRecognitionFoods(
    [{ name: "螺蛳粉", calories: 520, confidence: 0.81, source: "baidu-dish-image" }],
    []
  );

  assert.equal(foods[0]?.name, "螺蛳粉");
  assert.equal(foods[0]?.source, "builtin");
});

test("image recognition creates custom foods when local catalog cannot match", () => {
  const foods = resolveDishRecognitionFoods(
    [{ name: "神秘太空菜", calories: 390, confidence: 0.63, source: "baidu-dish-image" }],
    []
  );

  assert.equal(foods[0]?.name, "神秘太空菜");
  assert.equal(foods[0]?.source, "custom");
  assert.equal(foods[0]?.caloriesPer100g, 390);
});

test("image recognition candidate can be converted into editable meal nutrition", () => {
  const foods = resolveDishRecognitionFoods(
    [{ name: "宫保鸡丁", calories: 540, confidence: 0.9, source: "baidu-dish-image" }],
    []
  );
  const food = foods[0];
  assert.ok(food);

  const grams = food.defaultUnitGram;
  const totals = calculateFoodTotals(food, grams);

  assert.equal(food.id, "kungpao-chicken");
  assert.equal(grams, 300);
  assert.equal(Math.round(totals.calories), 540);
});
