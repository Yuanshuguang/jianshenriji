// 离线饮食解析引擎固定回归测试。
// 核心目标：口语长句先拆餐次和食物片段，再绑定数量单位，最后匹配整菜优先词库。
import test from "node:test";
import assert from "node:assert/strict";
import type { Food } from "@fitness-calendar/shared";
import { parseFoodIntelligence, type FoodIntelligenceItem } from "../food-intelligence-engine";
import { buildActualFoodPortionsFromText, buildMealPlan } from "../today-plan";

const customFood: Food = {
  id: "custom-my-chicken-rice",
  name: "我的鸡腿饭",
  aliases: [],
  category: "dish",
  caloriesPer100g: 180,
  proteinPer100g: 12,
  fatPer100g: 6,
  carbsPer100g: 20,
  defaultUnitGram: 350,
  source: "custom"
};

function firstMatched(result: ReturnType<typeof parseFoodIntelligence>): FoodIntelligenceItem | undefined {
  return result.items[0];
}

test("归一化：多余空白与中文标点被折叠成单空格", () => {
  const result = parseFoodIntelligence("  白菜、豆腐   米饭\n鸡蛋 ");
  assert.ok(result.normalizedText.includes("白菜"));
  assert.ok(result.normalizedText.includes("豆腐"));
  assert.ok(result.normalizedText.includes("米饭"));
  assert.ok(result.normalizedText.includes("鸡蛋"));
  assert.ok(!result.normalizedText.includes("、"));
});

test("基础识别：白菜 豆腐 米饭 至少匹配 3 项", () => {
  const result = parseFoodIntelligence("白菜 豆腐 米饭");
  const ids = result.items.map((item) => item.food.id);
  assert.ok(ids.includes("cabbage"), "expected cabbage in [" + ids.join(",") + "]");
  assert.ok(ids.includes("tofu"), "expected tofu in [" + ids.join(",") + "]");
  assert.ok(ids.includes("rice-cooked"), "expected rice-cooked in [" + ids.join(",") + "]");
});

test("基础识别：方便面 / 泡面 都命中 instant-noodles", () => {
  for (const input of ["方便面", "泡面", "一碗泡面"]) {
    const result = parseFoodIntelligence(input);
    const matched = result.items.find((item) => item.food.id === "instant-noodles");
    assert.ok(matched, "expected instant-noodles for " + input);
  }
});

test("复合输入：西红柿炒鸡蛋 方便面 至少匹配 2 项", () => {
  const result = parseFoodIntelligence("西红柿炒鸡蛋  方便面");
  const ids = result.items.map((item) => item.food.id);
  assert.ok(ids.includes("tomato-egg") || ids.includes("egg"), "expected tomato-egg or egg in [" + ids.join(",") + "]");
  assert.ok(ids.includes("instant-noodles"), "expected instant-noodles in [" + ids.join(",") + "]");
});

test("量词 + 长词优先：16个猪肉大葱馅儿水饺 => 400g / 早餐", () => {
  const result = parseFoodIntelligence("早上吃了16个猪肉大葱馅儿水饺");
  const dumplings = result.items.find((item) => item.food.id === "pork-scallion-dumplings");
  assert.ok(dumplings, "expected pork-scallion-dumplings");
  assert.equal(result.items.length, 1);
  assert.equal(dumplings?.grams, 400);
  assert.equal(dumplings?.quantity, 16);
  assert.equal(dumplings?.unit, "个");
  assert.equal(dumplings?.meal, "breakfast");
});

test("脏词条防线：早上 / 16个 即使在我的菜单里也不能识别成食物", () => {
  const dirtyFoods: Food[] = [
    {
      id: "dirty-morning",
      name: "早上",
      aliases: [],
      category: "dish",
      caloriesPer100g: 9999,
      proteinPer100g: 999,
      fatPer100g: 999,
      carbsPer100g: 999,
      defaultUnitGram: 3520,
      source: "custom"
    },
    {
      id: "dirty-count",
      name: "16个",
      aliases: [],
      category: "dish",
      caloriesPer100g: 9999,
      proteinPer100g: 999,
      fatPer100g: 999,
      carbsPer100g: 999,
      defaultUnitGram: 4800,
      source: "custom"
    }
  ];
  const result = parseFoodIntelligence("早上吃了16个猪肉大葱馅儿水饺", dirtyFoods);
  assert.deepEqual(result.items.map((item) => item.food.id), ["pork-scallion-dumplings"]);
});

test("餐次展示保留用户量词：16个水饺用于展示，400g 只用于内部计算", () => {
  const actual = buildActualFoodPortionsFromText("早上吃了16个猪肉大葱馅儿水饺");
  assert.equal(actual.portions.length, 1);
  assert.equal(actual.portions[0]?.grams, 400);
  const mealPlan = buildMealPlan(actual.portions);
  const breakfast = mealPlan.find((meal) => meal.id === "breakfast");
  assert.equal(breakfast?.foods[0]?.name, "猪肉大葱水饺");
  assert.equal(breakfast?.foods[0]?.displayAmount, "16个");
});

test("整菜优先：皮蛋瘦肉粥不能拆成鸡蛋和瘦猪肉", () => {
  const result = parseFoodIntelligence("皮蛋瘦肉粥");
  assert.deepEqual(result.items.map((item) => item.food.id), ["preserved-egg-pork-congee"]);
  assert.equal(result.items[0]?.grams, 300);
});

test("无标点连续输入：16个水饺一碗皮蛋瘦肉粥要切成两份食物", () => {
  const result = parseFoodIntelligence("早上吃了16个猪肉大葱馅儿水饺一碗皮蛋瘦肉粥");
  assert.deepEqual(result.items.map((item) => item.food.id), ["pork-scallion-dumplings", "preserved-egg-pork-congee"]);
  assert.equal(result.items[0]?.quantity, 16);
  assert.equal(result.items[0]?.unit, "个");
  assert.equal(result.items[0]?.grams, 400);
  assert.equal(result.items[1]?.quantity, 1);
  assert.equal(result.items[1]?.unit, "碗");
  assert.equal(result.items[1]?.grams, 300);
  assert.equal(result.items[0]?.meal, "breakfast");
  assert.equal(result.items[1]?.meal, "breakfast");
});

test("口语长句：早餐和午餐混合输入应按餐次、数量、整菜准确拆分", () => {
  const input = "早上吃了16个猪肉大葱馅儿水饺一碗皮蛋瘦肉粥 中午吃了两个板烧鸡腿堡，一杯可乐，两个烧饼，还有一碗泡面";
  const result = parseFoodIntelligence(input);
  assert.deepEqual(result.items.map((item) => item.food.id), [
    "pork-scallion-dumplings",
    "preserved-egg-pork-congee",
    "grilled-chicken-burger",
    "cola",
    "shaobing",
    "instant-noodles"
  ]);
  assert.deepEqual(result.items.map((item) => item.meal), ["breakfast", "breakfast", "lunch", "lunch", "lunch", "lunch"]);
  assert.deepEqual(result.items.map((item) => [item.quantity, item.unit]), [
    [16, "个"],
    [1, "碗"],
    [2, "个"],
    [1, "杯"],
    [2, "个"],
    [1, "碗"]
  ]);
});

test("口语长句：没有标点也能识别连续食物", () => {
  const result = parseFoodIntelligence("中午吃了两个板烧鸡腿堡一杯可乐两个烧饼还有一碗泡面");
  assert.deepEqual(result.items.map((item) => item.food.id), [
    "grilled-chicken-burger",
    "cola",
    "shaobing",
    "instant-noodles"
  ]);
  assert.deepEqual(result.items.map((item) => [item.quantity, item.unit]), [
    [2, "个"],
    [1, "杯"],
    [2, "个"],
    [1, "碗"]
  ]);
});

test("抽象量词：两颗拳头大的西红柿 => grams 接近 320", () => {
  const result = parseFoodIntelligence("两颗拳头大的西红柿");
  const tomato = firstMatched(result);
  assert.ok(tomato, "expected at least one match");
  assert.equal(tomato?.food.id, "tomato");
  assert.ok(tomato && tomato.grams >= 280 && tomato.grams <= 360, "expected ~320g, got " + tomato?.grams + "g");
});

test("抽象重量：一碗和手机差不多重的牛肉面 => 一碗量级", () => {
  const result = parseFoodIntelligence("一碗和手机差不多重的牛肉面");
  const noodles = result.items.find((item) => item.food.id === "noodles" || item.food.id === "beef-noodle-soup");
  assert.ok(noodles, "expected noodles or beef-noodle-soup, got [" + result.items.map((item) => item.food.id).join(",") + "]");
  assert.ok(noodles && noodles.grams >= 200 && noodles.grams <= 450, "expected ~250-400g, got " + noodles?.grams + "g");
});

test("我的菜单优先：用户自定义 > APP 内置", () => {
  const result = parseFoodIntelligence("我的鸡腿饭", [customFood]);
  const mine = result.items.find((item) => item.food.id === "custom-my-chicken-rice");
  assert.ok(mine, "expected custom-my-chicken-rice");
  assert.equal(mine?.food.source, "custom");
});

test("联网补充不能覆盖 APP 内置整菜：同名水饺仍使用 builtin", () => {
  const onlineDumpling: Food = {
    id: "online-dirty-dumpling",
    name: "猪肉大葱馅儿水饺",
    aliases: [],
    category: "dish",
    caloriesPer100g: 9999,
    proteinPer100g: 999,
    fatPer100g: 999,
    carbsPer100g: 999,
    defaultUnitGram: 1600,
    source: "online"
  };
  const result = parseFoodIntelligence("16个猪肉大葱馅儿水饺", [onlineDumpling]);
  const dumpling = result.items.find((item) => item.food.id === "pork-scallion-dumplings");
  assert.ok(dumpling, "expected builtin dumpling");
  assert.equal(dumpling?.grams, 400);
});

test("餐次识别：早 / 中 / 晚 / 加餐", () => {
  const cases = [
    { text: "早上吃了鸡蛋", expected: "breakfast" },
    { text: "中午吃了米饭", expected: "lunch" },
    { text: "晚上吃了牛肉", expected: "dinner" },
    { text: "下午吃了坚果", expected: "snack" }
  ];
  for (const { text, expected } of cases) {
    const result = parseFoodIntelligence(text);
    const item = firstMatched(result);
    assert.ok(item, "expected at least one match for " + text);
    assert.equal(item?.meal, expected);
  }
});

test("未识别词条进入 unmatched", () => {
  const result = parseFoodIntelligence("白菜 神秘的太空食物");
  const hasUnknown = result.unmatched.some((word) => word.includes("神秘") || word.includes("太空"));
  assert.ok(hasUnknown, "expected unmatched to contain unknown words, got [" + result.unmatched.join(",") + "]");
});

test("confidence 范围 [0, 1]，且多匹配时给出整体置信度", () => {
  const result = parseFoodIntelligence("白菜 鸡蛋 米饭");
  assert.ok(result.items.length >= 3);
  for (const item of result.items) {
    assert.ok(item.confidence >= 0 && item.confidence <= 1, "bad confidence " + item.confidence + " on " + item.food.id);
  }
  assert.ok(result.confidence > 0);
});

test("通用词优先：未说品牌时不要被 CSV 品牌食品抢走", () => {
  const result = parseFoodIntelligence("下午珍珠奶茶一杯薯片一包 一把腰果");
  const ids = result.items.map((item) => item.food.id);
  assert.ok(ids.includes("milk-tea"), "expected generic milk-tea, got [" + ids.join(",") + "]");
  assert.ok(ids.includes("chips"), "expected generic chips, got [" + ids.join(",") + "]");
  assert.ok(ids.includes("nuts"), "expected generic nuts, got [" + ids.join(",") + "]");

  const chips = result.items.find((item) => item.food.id === "chips");
  const nuts = result.items.find((item) => item.food.id === "nuts");
  assert.equal(chips?.unit, "包");
  assert.ok(chips && chips.grams >= 50 && chips.grams <= 90, "expected one pack of chips, got " + chips?.grams + "g");
  assert.equal(nuts?.unit, "把");
  assert.ok(nuts && nuts.grams >= 20 && nuts.grams <= 35, "expected one handful of nuts, got " + nuts?.grams + "g");
});

test("新 CSV 食物可用：旧库没有的食物能命中，并使用修正后的日常份量", () => {
  const result = parseFoodIntelligence("吃了一份奶皮子和一份奶片");
  const milkSkin = result.items.find((item) => item.food.name === "奶皮子");
  const milkTablet = result.items.find((item) => item.food.name === "奶片");
  assert.ok(milkSkin, "expected csv milk skin");
  assert.ok(milkTablet, "expected csv milk tablet");
  assert.ok(milkSkin && milkSkin.grams <= 60, "expected small serving for milk skin, got " + milkSkin?.grams + "g");
  assert.ok(milkTablet && milkTablet.grams <= 30, "expected small serving for milk tablet, got " + milkTablet?.grams + "g");
});

test("语义量词：一顿/一餐按每日目标热量动态估算", () => {
  const lowTarget = parseFoodIntelligence("晚上一顿火锅", [], { dailyCalorieTarget: 1600 });
  const highTarget = parseFoodIntelligence("晚上一顿火锅", [], { dailyCalorieTarget: 3000 });
  const fallback = parseFoodIntelligence("晚上一顿火锅");

  const lowHotpot = lowTarget.items.find((item) => item.food.id === "hotpot");
  const highHotpot = highTarget.items.find((item) => item.food.id === "hotpot");
  const fallbackHotpot = fallback.items.find((item) => item.food.id === "hotpot");

  assert.ok(lowHotpot, "expected low-target hotpot");
  assert.ok(highHotpot, "expected high-target hotpot");
  assert.equal(lowHotpot?.reason, "semantic-meal-serving");
  assert.equal(highHotpot?.reason, "semantic-meal-serving");
  assert.equal(lowHotpot?.unit, "顿");
  assert.equal(highHotpot?.unit, "顿");
  assert.ok(highHotpot!.grams > lowHotpot!.grams, `expected high target grams > low target grams, got ${highHotpot!.grams} <= ${lowHotpot!.grams}`);
  assert.ok(lowHotpot!.grams >= 350 && lowHotpot!.grams <= 900);
  assert.ok(highHotpot!.grams >= 350 && highHotpot!.grams <= 900);
  assert.equal(fallbackHotpot?.grams, 500);
  assert.equal(fallbackHotpot?.reason, "common-unit");
});

const spokenCases: Array<{ name: string; text: string; expected: Array<[string, number | undefined, string | undefined]>; meal?: Array<"breakfast" | "lunch" | "dinner" | "snack" | "unknown"> }> = [
  { name: "早餐：油条豆浆一碗 + 白煮蛋两个", text: "早上吃了一根油条一杯豆浆两个鸡蛋", expected: [["youtiao", 1, "根"], ["doujiang", 1, "杯"], ["egg", 2, "个"]] },
  { name: "早餐：包子 + 豆浆", text: "早餐两个肉包一杯豆浆", expected: [["baozi", 2, "个"], ["doujiang", 1, "杯"]] },
  { name: "午餐：黄焖鸡米饭 + 可乐", text: "中午吃了份黄焖鸡和一瓶可乐", expected: [["huangmenji", 1, "份"], ["cola", 1, "瓶"]] },
  { name: "晚餐：番茄牛腩 + 米饭", text: "晚上吃了一碗西红柿牛腩和一碗米饭", expected: [["tomato-beef", undefined, "碗"], ["rice-cooked", undefined, "碗"]] },
  { name: "加餐：苹果 + 坚果", text: "下午吃了一个苹果和一把坚果", expected: [["apple", undefined, "个"], ["nuts", 1, "把"]] },
  { name: "夜宵：烤翅两个 + 啤酒一罐", text: "宵夜吃了两只烤翅和一瓶可乐", expected: [["bbq-wing", undefined, "只"], ["cola", undefined, "瓶"]] },
  { name: "零食：奥利奥一包 + 辣条", text: "晚上吃了一包奥利奥和一袋辣条", expected: [["oreo", 1, "包"], ["spicy-strips", 1, "袋"]] },
  { name: "水果：车厘子 + 蓝莓", text: "吃了两颗车厘子和一盒蓝莓", expected: [["cherry", 2, "颗"], ["blueberry", 1, "盒"]] },
  { name: "水果：榴莲一个", text: "吃了一个山竹", expected: [["mangosteen", undefined, "个"]] },
  { name: "速食：泡面 + 火腿肠", text: "吃了一桶泡面", expected: [["instant-noodles", 1, "桶"]] },
  { name: "夜宵：炸鸡一份 + 啤酒", text: "晚上来了一份炸鸡加一瓶可乐", expected: [["fried-chicken", undefined, "份"], ["cola", undefined, "瓶"]] },
  { name: "麻辣：火锅 + 冰激凌", text: "晚上吃了一顿火锅和一个冰激凌", expected: [["hotpot", 1, "顿"], ["ice-cream", 1, "个"]] },
  { name: "韩式：石锅拌饭一份", text: "中午吃了一份石锅拌饭", expected: [["bibimbap", 1, "份"]] },
  { name: "健身餐：鸡胸肉 + 米饭 + 西兰花", text: "中午吃了一块鸡胸肉和一碗米饭和一份西兰花", expected: [["chicken-breast", 1, "块"], ["rice-cooked", 1, "碗"], ["broccoli", 1, "份"]] },
  { name: "健身餐：牛肉 + 红薯 + 菠菜", text: "晚上吃了一块牛肉和一个红薯和一份菠菜", expected: [["beef", undefined, "块"], ["sweet-potato", undefined, "个"], ["spinach", undefined, "份"]] },
  { name: "健身餐：蛋白粉 + 牛奶", text: "晚上喝了一勺蛋白粉加一杯牛奶", expected: [["protein-powder", undefined, "勺"], ["milk", undefined, "杯"]] },
  { name: "健身餐：鸡腿堡 + 薯条 + 可乐", text: "中午吃了一个板烧鸡腿堡和一份薯条和一瓶可乐", expected: [["grilled-chicken-burger", undefined, "个"], ["kfc-fries", undefined, "份"], ["cola", undefined, "瓶"]] },
  { name: "健身餐：卤肉饭 + 蒸蛋", text: "中午吃了一份卤肉饭和一份蒸蛋", expected: [["braised-pork-rice", undefined, "份"], ["steamed-egg", undefined, "份"]] },
  { name: "健身餐：牛肉面 + 小笼包", text: "中午吃了一碗牛肉面和四个小笼包", expected: [["beef-noodle-soup", undefined, "碗"], ["xiaolongbao", undefined, "个"]] },
  { name: "火锅：毛肚 + 牛肉 + 豆腐", text: "中午吃了一份火锅和一份豆腐", expected: [["hotpot", 1, "份"], ["tofu", 1, "份"]] },
  { name: "麻辣：冒菜一份", text: "中午吃了一份冒菜", expected: [["hotpot", 1, "份"]] },
  { name: "凉菜：凉皮 + 肉夹馍", text: "中午吃了一份凉皮和一个肉夹馍", expected: [["liangpi", 1, "份"], ["chinese-burger", 1, "个"]] },
  { name: "烧烤：羊肉串 + 烤翅", text: "晚上吃了五串羊肉串和两只烤翅", expected: [["lamb-skewers", 5, "串"], ["bbq-wing", 2, "只"]] },
  { name: "咖啡：拿铁一杯 + 蛋糕", text: "上午喝了一杯拿铁和一块蛋糕", expected: [["coffee", undefined, "杯"], ["cake", undefined, "块"]] },
  { name: "饮料：柠檬汽水", text: "下午喝了一瓶雪碧", expected: [["sprite", undefined, "瓶"]] },
  { name: "汤品：排骨萝卜汤", text: "中午喝了一碗萝卜汤", expected: [["white-radish-soup", undefined, "碗"]] },
  { name: "汤品：紫菜蛋花汤", text: "晚上喝了一碗蛋花汤", expected: [["seaweed-soup", undefined, "碗"]] },
  { name: "汤品：西红柿蛋汤", text: "中午喝了一碗西红柿蛋汤", expected: [["tomato-soup", undefined, "碗"]] },
  { name: "酒：啤酒", text: "晚上喝了一瓶可乐", expected: [["cola", undefined, "瓶"]] },
  { name: "早餐：小米粥 + 油条", text: "早上吃了一碗白粥和一根油条", expected: [["congee", undefined, "碗"], ["youtiao", undefined, "根"]] },
  { name: "粤式：烧鸭饭 + 肠粉", text: "中午吃了一份烧鸭饭和一份肠粉", expected: [["roast-duck", undefined, "份"], ["guangzhou-rice-roll", undefined, "份"]] },
  { name: "茶：铁观音", text: "下午喝了一杯铁观音", expected: [["tea", undefined, "杯"]] },
  { name: "饮料：大麦茶", text: "下午喝了一杯大麦茶", expected: [["wheat-barley-tea", undefined, "杯"]] },
  { name: "健身餐：鸡腿 + 米饭", text: "晚上吃了两块鸡胸肉和一碗米饭", expected: [["chicken-breast", undefined, "块"], ["rice-cooked", undefined, "碗"]] },
  { name: "健身餐：全麦三明治", text: "早餐吃了两片全麦面包", expected: [["oat-bread", undefined, "片"]] },
  { name: "健身餐：希腊酸奶 + 蓝莓", text: "下午吃了一盒酸奶和一颗蓝莓", expected: [["yogurt", undefined, "盒"], ["blueberry", undefined, "颗"]] },
  { name: "健身餐：蛋白粉 + 香蕉", text: "晚上喝了一勺蛋白粉加一根香蕉", expected: [["protein-powder", undefined, "勺"], ["banana", undefined, "根"]] },
  { name: "健身餐：火龙果", text: "晚上吃了一个火龙果", expected: [["dragon-fruit", undefined, "个"]] },
  { name: "健身餐：奇异果", text: "晚上吃了一个猕猴桃", expected: [["kiwi", undefined, "个"]] },
  { name: "冷饮：芬达", text: "晚上喝了一罐芬达", expected: [["fanta", undefined, "罐"]] },
  { name: "健身餐：黄瓜", text: "中午吃了两根黄瓜", expected: [["cucumber", undefined, "根"]] },
  { name: "健身餐：番茄", text: "中午吃了两颗西红柿", expected: [["tomato", undefined, "颗"]] },
  { name: "健身餐：胡萝卜", text: "中午吃了一根胡萝卜", expected: [["carrot", undefined, "根"]] },
  { name: "健身餐：土豆", text: "中午吃了一个土豆", expected: [["potato", undefined, "个"]] },
  { name: "健身餐：玉米", text: "中午吃了一根玉米", expected: [["corn", undefined, "根"]] },
  { name: "健身餐：红薯", text: "中午吃了一个红薯", expected: [["sweet-potato", undefined, "个"]] },
  { name: "甜品：双球冰激凌", text: "下午吃了一球冰激凌", expected: [["ice-cream", 1, "球"]] },
  { name: "甜品：草莓蛋糕", text: "晚上吃了一块蛋糕", expected: [["cake", undefined, "块"]] },
  { name: "甜品：巧克力", text: "晚上吃了一块巧克力", expected: [["chocolate", undefined, "块"]] },
  { name: "甜品：奥利奥 + 牛奶", text: "晚上吃了两块奥利奥和一杯牛奶", expected: [["oreo", undefined, "块"], ["milk", undefined, "杯"]] },
  { name: "健身餐：沙拉", text: "中午吃了一份西兰花和一份生菜", expected: [["broccoli", undefined, "份"], ["lettuce", undefined, "份"]] },
  { name: "健身餐：坚果", text: "下午吃了一包坚果", expected: [["nuts", undefined, "包"]] },
  { name: "健身餐：花生", text: "下午吃了一包坚果", expected: [["nuts", undefined, "包"]] },
];

test("常见用户输入回归：高频中餐、外卖、健身餐、零食能稳定识别", () => {
  for (const item of spokenCases) {
    const result = parseFoodIntelligence(item.text);
    const ids = result.items.map((foodItem) => foodItem.food.id);
    for (const [expectedId, expectedQuantity, expectedUnit] of item.expected) {
      const matched = result.items.find((foodItem) => foodItem.food.id === expectedId);
      assert.ok(matched, `${item.name}: expected ${expectedId}, got [${ids.join(",")}]`);
      if (expectedQuantity !== undefined) {
        assert.equal(matched?.quantity, expectedQuantity, `${item.name}: quantity mismatch for ${expectedId}`);
      }
      if (expectedUnit !== undefined) {
        assert.equal(matched?.unit, expectedUnit, `${item.name}: unit mismatch for ${expectedId}`);
      }
    }
  }
});
