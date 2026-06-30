import assert from "node:assert/strict";
import test from "node:test";
import { getFoodByIdFromCatalog } from "@fitness-calendar/shared";
import { estimateBodyFatFromVisualInput, defaultBodyFatVisualQualitySignals } from "../body-image-recognition";
import { resolveDishRecognitionFoods } from "../food-image-recognition";
import { buildCustomFoodFromNutritionLabel } from "../nutrition-label-recognition";
import { parseFoodText, parseTrainingText } from "../today-plan";

test("核心流程：文字饮食记录能识别餐次、食物和份量", () => {
  const result = parseFoodText("早餐吃了一个鸡蛋，中午一碗南瓜粥，晚上吃一碗水饺", [], {
    dailyCalorieTarget: 1800,
  });

  assert.equal(result.unmatched.length, 0);
  assert.ok(result.matched.some((item) => item.meal === "breakfast" && item.food.name.includes("鸡蛋")));
  assert.ok(result.matched.some((item) => item.meal === "lunch" && item.food.name.includes("南瓜粥")));
  assert.ok(result.matched.some((item) => item.meal === "dinner" && item.food.name.includes("水饺")));
});

test("核心流程：菜品图片识别候选能落到本地食物库或自定义食物", () => {
  const foods = resolveDishRecognitionFoods([
    { name: "螺蛳粉", calories: 520, confidence: 0.86, source: "baidu-dish-image" },
    { name: "测试不存在菜品", calories: 233, confidence: 0.61, source: "baidu-dish-image" },
  ], []);

  assert.equal(foods[0]?.source, "builtin");
  assert.equal(foods[0]?.name, getFoodByIdFromCatalog(foods[0]?.id ?? "")?.name);
  assert.equal(foods[1]?.source, "custom");
  assert.equal(foods[1]?.caloriesPer100g, 233);
});

test("核心流程：营养成分表 OCR 结果能生成我的菜单食物", () => {
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

test("核心流程：自拍/视频体脂估算输出可编辑的体脂区间", () => {
  const estimate = estimateBodyFatFromVisualInput({
    gender: "male",
    age: 30,
    heightCm: 175,
    weightKg: 70,
  }, "lines", {
    mediaType: "video",
    qualitySignals: [...defaultBodyFatVisualQualitySignals, "tightClothing"],
  });

  assert.ok(estimate);
  assert.equal(estimate.label, "线条可见");
  assert.ok(estimate.min < estimate.percent);
  assert.ok(estimate.max > estimate.percent);
  assert.match(estimate.reason, /BMI 基准/);
});

test("核心流程：训练自然语言记录能估算分钟和消耗", () => {
  const result = parseTrainingText("今天跑步30分钟，卧推5组，最后拉伸10分钟", 0, {
    heightCm: 175,
    weightKg: 70,
  });

  assert.ok(result.totalMinutes >= 40);
  assert.ok(result.totalCalories > 250);
  assert.equal(result.unmatched.length, 0);
});
