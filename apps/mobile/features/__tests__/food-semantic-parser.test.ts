import test from "node:test";
import assert from "node:assert/strict";
import { parseFoodIntelligencePipeline, parseFoodSemantics } from "../food-intelligence-engine";

test("语义解析先行：先区分餐次、数量、食物、修饰词和噪音词", () => {
  const result = parseFoodSemantics(`下午：
今天有点饿，吃了两斤高蛋白鸡胸肉丸、一盒蓝莓、一个黑巧布朗尼。

晚上：
又吃了一个盐水鸭、半包干脆面。`);

  assert.equal(result.segments.length, 2);
  assert.equal(result.segments[0]?.meal, "snack");
  assert.equal(result.segments[1]?.meal, "dinner");

  const roles = result.tokens.map((token) => [token.text, token.role, token.meal, token.quantity, token.unit, token.foodId]);
  assert.ok(roles.some(([text, role, meal]) => text === "下午" && role === "time" && meal === "snack"));
  assert.ok(roles.some(([text, role, meal]) => text === "晚上" && role === "time" && meal === "dinner"));
  assert.ok(roles.some(([text, role, , quantity, unit]) => text === "两斤" && role === "weight" && quantity === 2 && unit === "斤"));
  assert.ok(roles.some(([text, role, , quantity, unit]) => text === "一盒" && role === "quantity" && quantity === 1 && unit === "盒"));
  assert.ok(roles.some(([text, role, , , , foodId]) => text === "高蛋白鸡胸肉丸" && role === "food" && foodId === "high-protein-chicken-meatballs"));
  assert.ok(roles.some(([text, role, , , , foodId]) => text === "黑巧布朗尼" && role === "food" && foodId === "dark-chocolate-brownie"));
  assert.ok(roles.some(([text, role, , , , foodId]) => text === "干脆面" && role === "food" && foodId === "crispy-noodles"));
  assert.ok(roles.some(([text, role]) => text === "高蛋白" && role === "modifier"));
  assert.ok(result.discardedText.includes("今天"));
  assert.ok(result.discardedText.includes("有点饿"));
});

test("语义解析先行：连续量词保留在语义层，供后续份量确认", () => {
  const result = parseFoodSemantics("下午茶喝了3杯3勺蛋白粉，一碗螺蛳粉");
  const quantities = result.tokens.filter((token) => token.role === "quantity");
  const foods = result.tokens.filter((token) => token.role === "food");

  assert.ok(quantities.some((token) => token.text === "3杯" && token.quantity === 3 && token.unit === "杯"));
  assert.ok(quantities.some((token) => token.text === "3勺" && token.quantity === 3 && token.unit === "勺"));
  assert.ok(foods.some((token) => token.text === "蛋白粉" && token.foodId === "protein-powder"));
  assert.ok(foods.some((token) => token.text === "螺蛳粉" && token.foodId === "luo-si-fan"));

  const pipeline = parseFoodIntelligencePipeline("下午茶喝了3杯3勺蛋白粉，一碗螺蛳粉");
  assert.equal(pipeline.semantic.segments[0]?.meal, "snack");
  assert.equal(pipeline.items.find((item) => item.food.id === "protein-powder")?.needsDetails, true);
});
