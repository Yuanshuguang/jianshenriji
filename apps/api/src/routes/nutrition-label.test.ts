import assert from "node:assert/strict";
import test from "node:test";
import { extractNutritionLabelMetrics } from "./nutrition-label.js";

test("nutrition label parser extracts Chinese nutrition table per 100g", () => {
  const metrics = extractNutritionLabelMetrics(`
    产品名称 全麦蛋白棒
    营养成分表 每100克
    能量 1680千焦
    蛋白质 22.5克
    脂肪 12.0克
    碳水化合物 46.5克
    净含量 50克
  `);

  assert.equal(metrics.name, "全麦蛋白棒");
  assert.equal(metrics.caloriesPer100g, 401.5);
  assert.equal(metrics.proteinPer100g, 22.5);
  assert.equal(metrics.fatPer100g, 12);
  assert.equal(metrics.carbsPer100g, 46.5);
  assert.equal(metrics.defaultUnitGram, 50);
});

test("nutrition label parser uses image name when product name is missing", () => {
  const metrics = extractNutritionLabelMetrics("热量 320kcal 蛋白质 8g 脂肪 5g 碳水 54g", "燕麦片.jpg");
  assert.equal(metrics.name, "燕麦片");
  assert.equal(metrics.caloriesPer100g, 320);
});
