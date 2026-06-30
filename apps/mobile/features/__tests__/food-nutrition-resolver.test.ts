import assert from "node:assert/strict";
import test from "node:test";
import { getFoodCatalog } from "@fitness-calendar/shared";
import {
  parseFoodIntelligencePipeline,
  resolveFoodNutrition,
  resolveFoodNutritionFromSelection,
} from "../food-intelligence-engine";

function foodById(id: string) {
  const food = getFoodCatalog().find((item) => item.id === id);
  assert.ok(food, `missing food ${id}`);
  return food;
}

test("Nutrition Resolver：泛化食物默认按第一个细分项估算，并标记仍需用户确认", () => {
  const bread = resolveFoodNutrition({
    food: foodById("bread"),
    grams: 240,
    rawText: "3个面包",
  });

  assert.equal(bread.defaultVariantLabel, "白吐司");
  assert.equal(bread.needsUserInput, true);
  assert.equal(bread.resolvedFood.caloriesPer100g, 265);
  assert.equal(bread.totals.calories, 636);
  assert.match(bread.assumption, /暂按“白吐司”/);
});

test("Nutrition Resolver：用户选择细分类型后，热量和宏量营养跟随 profile 改变", () => {
  const genericBread = resolveFoodNutrition({
    food: foodById("bread"),
    grams: 240,
    rawText: "3个面包",
  });
  const wholeWheat = resolveFoodNutritionFromSelection(genericBread, "全麦面包", 240);
  const sweetBread = resolveFoodNutritionFromSelection(genericBread, "甜面包", 240);

  assert.equal(wholeWheat.needsUserInput, false);
  assert.equal(wholeWheat.resolvedFood.caloriesPer100g, 240);
  assert.equal(wholeWheat.totals.calories, 576);
  assert.equal(sweetBread.resolvedFood.caloriesPer100g, 360);
  assert.equal(sweetBread.totals.calories, 864);
  assert.ok(sweetBread.totals.fatG > wholeWheat.totals.fatG);
});

test("Nutrition Resolver：同一食物不同做法必须产生不同热量", () => {
  const egg = foodById("egg");
  const boiled = resolveFoodNutrition({ food: egg, grams: 55, rawText: "一个鸡蛋", selectedVariantLabel: "水煮蛋" });
  const fried = resolveFoodNutrition({ food: egg, grams: 55, rawText: "一个鸡蛋", selectedVariantLabel: "煎蛋" });
  const steamed = resolveFoodNutrition({ food: egg, grams: 110, rawText: "两个蒸蛋", selectedVariantLabel: "蒸蛋" });

  assert.equal(boiled.totals.calories, 83);
  assert.equal(fried.totals.calories, 109);
  assert.equal(steamed.totals.calories, 68);
  assert.ok(fried.totals.fatG > boiled.totals.fatG);
});

test("Nutrition Resolver：餐品详情 review 使用 resolver 后，默认营养与 defaultAssumption 保持一致", () => {
  const result = parseFoodIntelligencePipeline("一个鸡蛋，两个蒸蛋，3个面包，一碗甜豆腐脑");
  const byId = new Map(result.reviewItems.map((item) => [item.foodId, item]));
  const egg = byId.get("egg");
  const steamedEgg = byId.get("steamed-egg");
  const bread = byId.get("bread");
  const tofuPudding = byId.get("tofu-pudding");

  assert.equal(egg?.nutritionResolution.defaultVariantLabel, "水煮蛋");
  assert.equal(egg?.nutrition.calories, egg?.nutritionResolution.totals.calories);
  assert.equal(steamedEgg?.nutritionResolution.defaultVariantLabel, "蒸蛋");
  assert.equal(steamedEgg?.nutritionResolution.needsUserInput, false);
  assert.equal(bread?.nutritionResolution.defaultVariantLabel, "白吐司");
  assert.equal(bread?.nutritionResolution.needsUserInput, true);
  assert.equal(tofuPudding?.nutritionResolution.defaultVariantLabel, "甜豆腐脑");
  assert.equal(tofuPudding?.nutritionResolution.needsUserInput, false);
});
