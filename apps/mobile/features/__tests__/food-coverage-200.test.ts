import test from "node:test";
import assert from "node:assert/strict";
import { getFoodByIdFromCatalog } from "@fitness-calendar/shared";
import { parseFoodIntelligence } from "../food-intelligence-engine";

type MealExpectation = "breakfast" | "lunch" | "dinner" | "snack";

type CoverageCase = {
  foodId: string;
  plainText: string;
};

function assertParsedFoodCase(foodId: string, prefix: string, expectedMeal: MealExpectation, plainText: string) {
  const food = getFoodByIdFromCatalog(foodId);
  assert.ok(food, `missing food catalog item: ${foodId}`);

  const plain = parseFoodIntelligence(plainText);
  const plainItem = plain.items.find((item) => item.food.id === foodId);
  assert.ok(plainItem, `plain parse failed: ${foodId} / ${plainText}`);

  const contextualInput = `${prefix}${plainText}`;
  const contextual = parseFoodIntelligence(contextualInput);
  const contextualItem = contextual.items.find((item) => item.food.id === foodId);
  assert.ok(contextualItem, `context parse failed: ${foodId} / ${contextualInput}`);
  assert.equal(contextualItem?.meal, expectedMeal, `${foodId} meal mismatch on ${contextualInput}`);
}

function runCoverageGroup(
  title: string,
  prefix: string,
  expectedMeal: MealExpectation,
  entries: CoverageCase[]
) {
  test(title, () => {
    assert.equal(entries.length, 20, `${title} should contain 20 cases`);
    for (const entry of entries) {
      assertParsedFoodCase(entry.foodId, prefix, expectedMeal, entry.plainText);
    }
  });
}

// 目标：补一组更贴近真实生活语境的回归样本。
// 这组样本不重复改业务逻辑，只验证不同场景、不同句式、不同餐次前缀是否都能稳定识别。
const sceneFoods: CoverageCase[] = [
  { foodId: "baozi", plainText: "包子" },
  { foodId: "youtiao", plainText: "油条" },
  { foodId: "doujiang", plainText: "豆浆" },
  { foodId: "egg", plainText: "鸡蛋" },
  { foodId: "milk", plainText: "牛奶" },
  { foodId: "banana", plainText: "香蕉" },
  { foodId: "apple", plainText: "苹果" },
  { foodId: "rice-cooked", plainText: "米饭" },
  { foodId: "chicken-breast", plainText: "鸡胸肉" },
  { foodId: "beef", plainText: "牛肉" },
  { foodId: "broccoli", plainText: "西兰花" },
  { foodId: "tomato-egg", plainText: "西红柿炒鸡蛋" },
  { foodId: "instant-noodles", plainText: "方便面" },
  { foodId: "wonton", plainText: "馄饨" },
  { foodId: "pizza", plainText: "披萨" },
  { foodId: "grilled-chicken-burger", plainText: "板烧鸡腿堡" },
  { foodId: "protein-bar", plainText: "蛋白棒" },
  { foodId: "high-protein-yogurt", plainText: "高蛋白酸奶" },
  { foodId: "konjac-noodles", plainText: "魔芋面" },
  { foodId: "light-meal-salad", plainText: "轻食沙拉" }
];

runCoverageGroup("解析覆盖 - 通勤早饭语境", "早上通勤路上吃了", "breakfast", sceneFoods);
runCoverageGroup("解析覆盖 - 办公午餐语境", "中午在公司吃了", "lunch", sceneFoods);
runCoverageGroup("解析覆盖 - 聚餐晚餐语境", "晚上和朋友聚餐吃了", "dinner", sceneFoods);
runCoverageGroup("解析覆盖 - 下午茶加餐语境", "下午茶加餐吃了", "snack", sceneFoods);
runCoverageGroup("解析覆盖 - 训练后补给语境", "训练后加餐吃了", "snack", sceneFoods);
