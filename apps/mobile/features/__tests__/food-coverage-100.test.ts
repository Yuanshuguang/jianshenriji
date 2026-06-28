import test from "node:test";
import assert from "node:assert/strict";
import { getFoodByIdFromCatalog } from "@fitness-calendar/shared";
import { parseFoodIntelligence } from "../food-intelligence-engine";

type MealExpectation = "breakfast" | "lunch" | "dinner" | "snack";

function assertParsedFoodCase(foodId: string, prefix: string, expectedMeal: MealExpectation, plainText?: string) {
  const food = getFoodByIdFromCatalog(foodId);
  assert.ok(food, `missing food catalog item: ${foodId}`);

  const label = plainText ?? food.name;
  const plain = parseFoodIntelligence(label);
  const plainItem = plain.items.find((item) => item.food.id === foodId);
  assert.ok(plainItem, `plain parse failed: ${foodId} / ${label}`);
  assert.equal(plainItem?.food.id, foodId);

  const contextualInput = `${prefix}${label}`;
  const contextual = parseFoodIntelligence(contextualInput);
  const contextualItem = contextual.items.find((item) => item.food.id === foodId);
  assert.ok(contextualItem, `context parse failed: ${foodId} / ${contextualInput}`);
  assert.equal(contextualItem?.food.id, foodId);
  assert.equal(contextualItem?.meal, expectedMeal, `${foodId} meal mismatch on ${contextualInput}`);
}

function runCoverageGroup(title: string, entries: Array<{ foodId: string; prefix: string; expectedMeal: MealExpectation; plainText?: string }>) {
  test(title, () => {
    for (const entry of entries) {
      assertParsedFoodCase(entry.foodId, entry.prefix, entry.expectedMeal, entry.plainText);
    }
  });
}

// 目标：把更多场景和更多食物品类一次性拉进回归，避免只覆盖少量示例。
runCoverageGroup("解析覆盖 - 主食与早餐常见项", [
  { foodId: "rice-cooked", prefix: "早餐吃了", expectedMeal: "breakfast" },
  { foodId: "noodles", prefix: "早餐吃了", expectedMeal: "breakfast" },
  { foodId: "instant-noodles", prefix: "早餐吃了", expectedMeal: "breakfast" },
  { foodId: "mantou", prefix: "早餐吃了", expectedMeal: "breakfast" },
  { foodId: "bread", prefix: "早餐吃了", expectedMeal: "breakfast" },
  { foodId: "oatmeal", prefix: "早餐吃了", expectedMeal: "breakfast" },
  { foodId: "sweet-potato", prefix: "早餐吃了", expectedMeal: "breakfast" },
  { foodId: "corn", prefix: "早餐吃了", expectedMeal: "breakfast" },
  { foodId: "baozi", prefix: "早餐吃了", expectedMeal: "breakfast" },
  { foodId: "shaobing", prefix: "早餐吃了", expectedMeal: "breakfast" },
  { foodId: "jianbing", prefix: "早餐吃了", expectedMeal: "breakfast" },
  { foodId: "youtiao", prefix: "早餐吃了", expectedMeal: "breakfast" }
]);

runCoverageGroup("解析覆盖 - 蛋白质与训练餐", [
  { foodId: "egg", prefix: "晚餐吃了", expectedMeal: "dinner" },
  { foodId: "chicken-breast", prefix: "晚餐吃了", expectedMeal: "dinner" },
  { foodId: "beef", prefix: "晚餐吃了", expectedMeal: "dinner" },
  { foodId: "lean-beef", prefix: "晚餐吃了", expectedMeal: "dinner" },
  { foodId: "pork-lean", prefix: "晚餐吃了", expectedMeal: "dinner" },
  { foodId: "fish", prefix: "晚餐吃了", expectedMeal: "dinner" },
  { foodId: "shrimp", prefix: "晚餐吃了", expectedMeal: "dinner" },
  { foodId: "tofu", prefix: "晚餐吃了", expectedMeal: "dinner" },
  { foodId: "tea-egg", prefix: "晚餐吃了", expectedMeal: "dinner" },
  { foodId: "ready-chicken-breast", prefix: "加餐吃了", expectedMeal: "snack" }
]);

runCoverageGroup("解析覆盖 - 蔬菜与家常菜", [
  { foodId: "tomato", prefix: "午餐吃了", expectedMeal: "lunch" },
  { foodId: "cucumber", prefix: "午餐吃了", expectedMeal: "lunch" },
  { foodId: "cabbage", prefix: "午餐吃了", expectedMeal: "lunch" },
  { foodId: "broccoli", prefix: "午餐吃了", expectedMeal: "lunch" },
  { foodId: "spinach", prefix: "午餐吃了", expectedMeal: "lunch" },
  { foodId: "carrot", prefix: "午餐吃了", expectedMeal: "lunch" },
  { foodId: "tomato-egg", prefix: "午餐吃了", expectedMeal: "lunch" },
  { foodId: "pork-scallion-dumplings", prefix: "午餐吃了", expectedMeal: "lunch" },
  { foodId: "preserved-egg-pork-congee", prefix: "午餐吃了", expectedMeal: "lunch" },
  { foodId: "hotpot", prefix: "午餐吃了", expectedMeal: "lunch" }
]);

runCoverageGroup("解析覆盖 - 水果与加餐", [
  { foodId: "banana", prefix: "加餐吃了", expectedMeal: "snack" },
  { foodId: "apple", prefix: "加餐吃了", expectedMeal: "snack" },
  { foodId: "orange", prefix: "加餐吃了", expectedMeal: "snack" },
  { foodId: "grape", prefix: "加餐吃了", expectedMeal: "snack" },
  { foodId: "watermelon", prefix: "加餐吃了", expectedMeal: "snack" },
  { foodId: "mangguo", prefix: "加餐吃了", expectedMeal: "snack" },
  { foodId: "caomei", prefix: "加餐吃了", expectedMeal: "snack" },
  { foodId: "xigua", prefix: "加餐吃了", expectedMeal: "snack", plainText: "黑美人西瓜" }
]);

runCoverageGroup("解析覆盖 - 零食与分享型包装食品", [
  { foodId: "chips", prefix: "下午茶吃了", expectedMeal: "snack" },
  { foodId: "chocolate", prefix: "下午茶吃了", expectedMeal: "snack" },
  { foodId: "cashew", prefix: "下午茶吃了", expectedMeal: "snack" },
  { foodId: "almond", prefix: "下午茶吃了", expectedMeal: "snack" },
  { foodId: "walnut", prefix: "下午茶吃了", expectedMeal: "snack" },
  { foodId: "pistachio", prefix: "下午茶吃了", expectedMeal: "snack" },
  { foodId: "nuts", prefix: "下午茶吃了", expectedMeal: "snack" },
  { foodId: "guoba", prefix: "下午茶吃了", expectedMeal: "snack" },
  { foodId: "oreo", prefix: "下午茶吃了", expectedMeal: "snack" },
  { foodId: "spicy-strips", prefix: "下午茶吃了", expectedMeal: "snack" },
  { foodId: "ice-cream", prefix: "下午茶吃了", expectedMeal: "snack" },
  { foodId: "cake", prefix: "下午茶吃了", expectedMeal: "snack" }
]);

runCoverageGroup("解析覆盖 - 饮品与液体摄入", [
  { foodId: "milk", prefix: "早餐喝了", expectedMeal: "breakfast" },
  { foodId: "yogurt", prefix: "早餐喝了", expectedMeal: "breakfast" },
  { foodId: "cola", prefix: "早餐喝了", expectedMeal: "breakfast" },
  { foodId: "milk-tea", prefix: "早餐喝了", expectedMeal: "breakfast" },
  { foodId: "americano", prefix: "早餐喝了", expectedMeal: "breakfast" },
  { foodId: "latte", prefix: "早餐喝了", expectedMeal: "breakfast" },
  { foodId: "coffee", prefix: "早餐喝了", expectedMeal: "breakfast" },
  { foodId: "boba-tea", prefix: "下午茶吃了", expectedMeal: "snack", plainText: "波霸奶茶" },
  { foodId: "orange-juice", prefix: "下午喝了", expectedMeal: "snack" },
  { foodId: "sprite", prefix: "下午喝了", expectedMeal: "snack" },
  { foodId: "fanta", prefix: "下午喝了", expectedMeal: "snack" },
  { foodId: "red-bull", prefix: "下午喝了", expectedMeal: "snack" },
  { foodId: "rice-wine", prefix: "下午喝了", expectedMeal: "snack" },
  { foodId: "jiuniang", prefix: "下午喝了", expectedMeal: "snack" },
  { foodId: "doujiang", prefix: "下午喝了", expectedMeal: "snack" },
  { foodId: "wheat-barley-tea", prefix: "下午喝了", expectedMeal: "snack", plainText: "大麦茶" },
  { foodId: "protein-powder", prefix: "加餐喝了", expectedMeal: "snack", plainText: "蛋白粉" },
  { foodId: "congee", prefix: "早餐吃了", expectedMeal: "breakfast", plainText: "白粥" },
  { foodId: "sweet-congee", prefix: "早餐吃了", expectedMeal: "breakfast", plainText: "八宝粥" },
  { foodId: "bbq-wing", prefix: "晚上吃了", expectedMeal: "dinner", plainText: "烤翅" }
]);

runCoverageGroup("解析覆盖 - 主菜与外卖/快餐", [
  { foodId: "fried-rice", prefix: "中午点了", expectedMeal: "lunch" },
  { foodId: "grilled-chicken-burger", prefix: "中午点了", expectedMeal: "lunch" },
  { foodId: "pizza", prefix: "中午点了", expectedMeal: "lunch" },
  { foodId: "wonton", prefix: "中午点了", expectedMeal: "lunch" },
  { foodId: "xiaolongbao", prefix: "中午点了", expectedMeal: "lunch" },
  { foodId: "duck-blood-vermicelli-soup", prefix: "中午点了", expectedMeal: "lunch" },
  { foodId: "jianbing-guozi", prefix: "中午点了", expectedMeal: "lunch", plainText: "天津煎饼果子" },
  { foodId: "white-cut-chicken", prefix: "中午点了", expectedMeal: "lunch" },
  { foodId: "roast-duck", prefix: "中午点了", expectedMeal: "lunch" },
  { foodId: "dapanji", prefix: "中午点了", expectedMeal: "lunch" },
  { foodId: "shaxian-snacks", prefix: "中午点了", expectedMeal: "lunch" },
  { foodId: "braised-pork-rice", prefix: "中午点了", expectedMeal: "lunch" }
]);

runCoverageGroup("解析覆盖 - 健身补给与低碳/高蛋白食品", [
  { foodId: "protein-bar", prefix: "加餐吃了", expectedMeal: "snack" },
  { foodId: "high-protein-yogurt", prefix: "加餐吃了", expectedMeal: "snack" },
  { foodId: "meal-replacement-powder", prefix: "加餐吃了", expectedMeal: "snack" },
  { foodId: "konjac-noodles", prefix: "加餐吃了", expectedMeal: "snack" },
  { foodId: "black-sesame-paste", prefix: "加餐吃了", expectedMeal: "snack" },
  { foodId: "lotus-root-powder", prefix: "加餐吃了", expectedMeal: "snack" },
  { foodId: "instant-oatmeal", prefix: "早餐吃了", expectedMeal: "breakfast" },
  { foodId: "tuna-can", prefix: "晚餐吃了", expectedMeal: "dinner" },
  { foodId: "light-meal-salad", prefix: "中午吃了", expectedMeal: "lunch" },
  { foodId: "quinoa-chicken-bowl", prefix: "中午吃了", expectedMeal: "lunch" },
  { foodId: "brown-rice-meal", prefix: "中午吃了", expectedMeal: "lunch" },
  { foodId: "low-fat-beef-ball", prefix: "晚餐吃了", expectedMeal: "dinner" },
  { foodId: "chicken-breast-wrap", prefix: "中午吃了", expectedMeal: "lunch" },
  { foodId: "whole-wheat-bagel", prefix: "早餐吃了", expectedMeal: "breakfast" }
]);
