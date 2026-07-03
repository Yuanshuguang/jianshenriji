import assert from "node:assert/strict";
import test from "node:test";
import { parseFoodIntelligence } from "../food-parser-engine";

const foodCases = [
  ["米饭", "rice-cooked"],
  ["面条", "noodles"],
  ["方便面", "instant-noodles"],
  ["干脆面", "crispy-noodles"],
  ["馒头", "mantou"],
  ["烤馍", "roasted-mantou"],
  ["面包", "bread"],
  ["燕麦", "oatmeal"],
  ["红薯", "sweet-potato"],
  ["玉米", "corn"],
  ["鸡蛋", "egg"],
  ["鸡胸肉", "chicken-breast"],
  ["瘦牛肉", "lean-beef"],
  ["卤牛肉", "beef"],
  ["瘦猪肉", "pork-lean"],
  ["鱼肉", "fish"],
  ["虾仁", "shrimp"],
  ["豆腐", "tofu"],
  ["豆腐脑", "tofu-pudding"],
  ["牛奶", "milk"],
  ["酸奶", "yogurt"],
  ["蛋白粉", "protein-powder"],
  ["西红柿", "tomato"],
  ["黄瓜", "cucumber"],
  ["白菜", "cabbage"],
  ["生菜", "lettuce"],
  ["西兰花", "broccoli"],
  ["菠菜", "spinach"],
  ["胡萝卜", "carrot"],
  ["土豆", "potato"],
  ["香蕉", "banana"],
  ["苹果", "apple"],
  ["橙子", "orange"],
  ["葡萄", "grape"],
  ["西瓜", "watermelon"],
  ["西红柿炒鸡蛋", "tomato-egg"],
  ["水饺", "dumplings"],
  ["猪肉大葱水饺", "pork-scallion-dumplings"],
  ["皮蛋瘦肉粥", "preserved-egg-pork-congee"],
  ["黄焖鸡", "huangmenji"],
  ["蛋炒饭", "fried-rice"],
  ["火锅", "hotpot"],
  ["板烧鸡腿堡", "grilled-chicken-burger"],
  ["烧饼", "shaobing"],
  ["汉堡", "hamburger"],
  ["披萨", "pizza"],
  ["可乐", "cola"],
  ["奶茶", "milk-tea"],
  ["伯牙绝弦", "milk-tea"],
  ["美式咖啡", "americano"],
  ["拿铁", "latte"],
  ["薯片", "chips"],
  ["黑巧布朗尼", "dark-chocolate-brownie"],
  ["黑巧克力", "dark-chocolate"],
  ["腰果", "cashew"],
  ["花生", "peanuts"],
  ["水煮花生", "boiled-peanuts"],
  ["麻辣花生", "spicy-peanuts"],
  ["饭团", "rice-ball"],
  ["金枪鱼饭团", "rice-ball"],
  ["烤冷面", "fried-cold-noodles"],
  ["蒜香面包干", "garlic-bread-crisps"],
  ["小笼包", "xiaolongbao"],
  ["鸭血粉丝汤", "duck-blood-vermicelli-soup"],
  ["盐水鸭", "salted-duck"],
  ["麻辣鸭腿", "spicy-duck-leg"],
  ["宫保鸡丁", "kungpao-chicken"],
  ["牛肉面", "beef-noodle-soup"],
  ["螺蛳粉", "luo-si-fan"],
  ["南瓜粥", "pumpkin-congee"],
] as const;

const phraseTemplates = [
  (name: string) => `早餐随手吃了${name}`,
  (name: string) => `中午点了一份${name}`,
  (name: string) => `下午加餐来点${name}`,
  (name: string) => `训练后补了${name}`,
  (name: string) => `晚上简单吃点${name}`,
] as const;

test("中文真实口语回归集：不少于 300 条基础食物识别稳定", () => {
  const cases = foodCases.flatMap(([name, expectedId]) =>
    phraseTemplates.map((buildPhrase) => ({
      input: buildPhrase(name),
      expectedId,
    }))
  );

  assert.ok(cases.length >= 300);

  const failures: string[] = [];
  for (const item of cases) {
    const result = parseFoodIntelligence(item.input);
    const ids = result.items.map((entry) => entry.food.id);
    if (!ids.includes(item.expectedId)) {
      failures.push(`${item.input}: expected ${item.expectedId}, got [${ids.join(",")}]`);
    }
  }

  assert.deepEqual(failures, []);
});
