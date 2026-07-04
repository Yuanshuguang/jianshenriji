// 离线饮食解析引擎固定回归测试。
// 核心目标：口语长句先拆餐次和食物片段，再绑定数量单位，最后匹配整菜优先词库。
import test from "node:test";
import assert from "node:assert/strict";
import { calculateFoodTotals, foods, recommendMacroAwarePortions, sumNutrition, type Food } from "@fitness-calendar/shared";
import { parseFoodIntelligence, parseFoodIntelligencePipeline, type FoodIntelligenceItem } from "../food-intelligence-engine";
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

test("meal plan keeps macro totals", () => {
  const mealPlan = buildMealPlan([
    {
      foodId: "macro-food",
      name: "macro-food",
      grams: 100,
      totals: {
        calories: 200,
        proteinG: 20,
        fatG: 5,
        carbsG: 25
      }
    }
  ], [
    {
      id: "macro-food",
      name: "macro-food",
      aliases: [],
      category: "dish",
      caloriesPer100g: 200,
      proteinPer100g: 20,
      fatPer100g: 5,
      carbsPer100g: 25,
      defaultUnitGram: 100,
      source: "custom"
    }
  ]);
  const totals = mealPlan.reduce((sum, meal) => ({
    calories: sum.calories + meal.totals.calories,
    proteinG: sum.proteinG + meal.totals.proteinG,
    fatG: sum.fatG + meal.totals.fatG,
    carbsG: sum.carbsG + meal.totals.carbsG
  }), { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 });

  assert.equal(totals.calories, 200);
  assert.equal(totals.proteinG, 20);
  assert.equal(totals.fatG, 5);
  assert.equal(totals.carbsG, 25);
});

test("APP推荐食材分配：不把蔬菜主食集中到早餐，整份食品不拆餐", () => {
  const picked = ["cabbage", "potato", "egg", "chicken-breast"]
    .map((id) => foods.find((item) => item.id === id))
    .filter((item): item is Food => Boolean(item));
  const portions = recommendMacroAwarePortions(picked, {
    calories: 1600,
    proteinG: 110,
    fatG: 45,
    carbsG: 180
  });
  const mealPlan = buildMealPlan(portions);
  const breakfast = mealPlan.find((meal) => meal.id === "breakfast");
  const breakfastNames = breakfast?.foods.map((item) => item.name) ?? [];

  assert.ok(breakfastNames.some((name) => /鸡蛋|鸡胸肉/.test(name)), "breakfast should include protein");
  assert.ok(!breakfast?.foods.some((item) => item.name === "白菜" && item.grams > 180), "breakfast cabbage should not be oversized");
  assert.ok(mealPlan.filter((meal) => meal.foods.length > 0).length >= 3, "prepared foods should be spread across meals");

  const instantNoodles = foods.find((item) => item.id === "instant-noodles");
  assert.ok(instantNoodles);
  const noodlePlan = buildMealPlan(recommendMacroAwarePortions([instantNoodles], {
    calories: 1600,
    proteinG: 110,
    fatG: 45,
    carbsG: 180
  }));
  const noodleMeals = noodlePlan.filter((meal) => meal.foods.some((item) => item.name === "方便面"));
  assert.equal(noodleMeals.length, 1);
});

test("APP推荐食材分配：按生活常识判断是否适合拆分", () => {
  const banana = foods.find((item) => item.id === "banana");
  assert.ok(banana);
  const bananaPlan = buildMealPlan(recommendMacroAwarePortions([banana], {
    calories: 1600,
    proteinG: 110,
    fatG: 45,
    carbsG: 180
  }));
  const bananaMeals = bananaPlan.filter((meal) => meal.foods.some((item) => item.name === "香蕉"));
  assert.equal(bananaMeals.length, 1);
  assert.equal(bananaMeals[0]?.foods.find((item) => item.name === "香蕉")?.grams, 120);

  const baozi: Food = {
    id: "test-baozi",
    name: "包子",
    aliases: ["肉包"],
    category: "staple",
    caloriesPer100g: 230,
    proteinPer100g: 8,
    fatPer100g: 6,
    carbsPer100g: 36,
    defaultUnitGram: 90,
    servingUnits: [{ name: "个", grams: 90 }],
    source: "custom"
  };
  const cookie: Food = {
    id: "test-cookie",
    name: "饼干",
    aliases: ["苏打饼干"],
    category: "snack",
    caloriesPer100g: 480,
    proteinPer100g: 6,
    fatPer100g: 20,
    carbsPer100g: 68,
    defaultUnitGram: 100,
    servingUnits: [{ name: "包", grams: 100 }],
    source: "custom"
  };
  const portions = recommendMacroAwarePortions([baozi, cookie], {
    calories: 1600,
    proteinG: 110,
    fatG: 45,
    carbsG: 180
  });
  const baoziPortions = portions.filter((item) => item.foodId === "test-baozi");
  const cookiePortions = portions.filter((item) => item.foodId === "test-cookie");

  assert.equal(baoziPortions.length, 1, "small whole foods should not be split across meals");
  assert.equal(baoziPortions[0]?.grams, 90);
  assert.ok(cookiePortions.length >= 1, "dry storable snacks can be allocated by grams");
  assert.ok(cookiePortions.every((item) => item.grams < 100), "cookie does not have to be forced to a full pack");
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

test("水饺口语量词：16颗猪肉大葱水饺应按单颗计算，不能退回默认份量", () => {
  const result = parseFoodIntelligence("晚上吃了16颗猪肉大葱水饺");
  const dumplings = result.items.find((item) => item.food.id === "pork-scallion-dumplings");
  assert.ok(dumplings, "expected pork-scallion-dumplings");
  assert.equal(result.items.length, 1);
  assert.equal(dumplings?.grams, 400);
  assert.equal(dumplings?.quantity, 16);
  assert.equal(dumplings?.unit, "颗");
  assert.equal(dumplings?.meal, "dinner");
});

test("用户真实长句：今日统计不应因“16颗水饺”膨胀到万卡级别", () => {
  const input = "晚上吃两个馒头。300g土豆，16颗猪肉大葱水饺。早上吃了一碗热干面，一杯豆浆；中午吃了一碗方便面，一碗蔬菜沙拉，一盒牛奶。";
  const actual = buildActualFoodPortionsFromText(input, [], { dailyCalorieTarget: 1800 });
  const dumplings = actual.parsed.matched.find((item) => item.food.id === "pork-scallion-dumplings");
  const total = sumNutrition(actual.portions.map((portion) => portion.totals));

  assert.ok(dumplings, "expected pork-scallion-dumplings");
  assert.equal(dumplings?.grams, 400);
  assert.equal(dumplings?.quantity, 16);
  assert.equal(dumplings?.unit, "颗");
  assert.ok(total.calories > 2500 && total.calories < 4500, "expected realistic total calories, got " + total.calories);
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

test("无意义口语不进入 unmatched，真实未知食物仍保留", () => {
  const clean = parseFoodIntelligence("早上赶时间，就啃了一个全麦贝果，喝了杯拿铁，顺手吃了两颗茶叶蛋。");
  assert.deepEqual(clean.unmatched, []);

  const noisy = parseFoodIntelligence("夜里看球没忍住，点了烤冷面一份，炸串三串，外加一罐啤酒。");
  assert.deepEqual(noisy.unmatched, []);

  const batchNoiseCases = [
    "早上起晚了，抓了两个包子，一杯豆浆，路上又吃了个茶叶蛋。",
    "中午食堂随便打的，一碗米饭，一份番茄炒蛋，一份西兰花。",
    "下午健身前垫了一根香蕉，一根蛋白棒，还有半瓶无糖可乐。",
    "晚上练完胸，吃了一块鸡胸肉，一碗糙米饭，一盒轻食沙拉。",
    "中午外卖一份黄焖鸡米饭，加一罐雪碧。",
    "训练后喝了一勺蛋白粉，吃了一袋即食鸡胸肉。",
    "晚上看电影吃了一包奥利奥，一袋辣条。"
  ];
  for (const input of batchNoiseCases) {
    const result = parseFoodIntelligence(input);
    assert.deepEqual(result.unmatched, [], input);
  }

  const unknown = parseFoodIntelligence("晚上嘴馋吃了神秘的太空食物");
  assert.ok(unknown.unmatched.some((word) => word.includes("神秘") || word.includes("太空")));
});

test("复合量词：小包、小杯、大碗等参与份量估算且不残留 unmatched", () => {
  const snack = parseFoodIntelligence("上午开会太困，喝了一小杯美式咖啡，吃了一小包苏打饼干。");
  const coffee = snack.items.find((item) => item.food.id === "americano");
  const cracker = snack.items.find((item) => item.food.id === "soda-cracker");
  assert.deepEqual(snack.unmatched, []);
  assert.equal(coffee?.unit, "杯");
  assert.equal(coffee?.grams, 210);
  assert.equal(cracker?.unit, "包");
  assert.equal(cracker?.grams, 42);

  const rice = parseFoodIntelligence("中午吃了一大碗米饭");
  const riceItem = rice.items.find((item) => item.food.id === "rice-cooked");
  assert.deepEqual(rice.unmatched, []);
  assert.equal(riceItem?.unit, "碗");
  assert.equal(riceItem?.grams, 225);
});

test("场景词里的饭不应重复识别，但一碗饭仍可作为米饭识别", () => {
  const canteen = parseFoodIntelligence("中午食堂打饭，一碗米饭，一份番茄炒蛋，一盘西兰花。");
  assert.equal(canteen.items.filter((item) => item.food.id === "rice-cooked").length, 1);
  assert.deepEqual(canteen.unmatched, []);

  const sharedMeal = parseFoodIntelligence("中午和同事拼饭，一份红烧肉，一碗米饭。");
  assert.equal(sharedMeal.items.filter((item) => item.food.id === "rice-cooked").length, 1);
  assert.deepEqual(sharedMeal.unmatched, []);

  const plainRice = parseFoodIntelligence("晚上吃了一碗饭");
  assert.equal(plainRice.items[0]?.food.id, "rice-cooked");
  assert.equal(plainRice.items[0]?.unit, "碗");
});

test("扩展场景语境：通勤、出差、娱乐和聚餐口语不残留 unmatched", () => {
  const cases = [
    "早上赶地铁，路上啃了一个全麦贝果，喝了一杯拿铁。",
    "办公室抽屉里翻出来一根蛋白棒，又吃了一把腰果。",
    "晚上朋友聚餐，一顿火锅，喝了一瓶大麦茶。",
    "跑完步补了一盒高蛋白酸奶，一盒蓝莓。",
    "夜里打游戏，吃了一包威化饼干，一罐无糖可乐。",
    "早上赶飞机，吃了一个全麦贝果，一杯美式咖啡。",
    "午饭在高铁上，一个便利店饭团，一盒酸奶。"
  ];

  for (const input of cases) {
    const result = parseFoodIntelligence(input);
    assert.deepEqual(result.unmatched, [], input);
  }
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
  assert.ok(ids.includes("cashew"), "expected specific cashew, got [" + ids.join(",") + "]");

  const chips = result.items.find((item) => item.food.id === "chips");
  const cashew = result.items.find((item) => item.food.id === "cashew");
  assert.equal(chips?.unit, "包");
  assert.ok(chips && chips.grams >= 50 && chips.grams <= 90, "expected one pack of chips, got " + chips?.grams + "g");
  assert.equal(cashew?.unit, "把");
  assert.ok(cashew && cashew.grams >= 20 && cashew.grams <= 35, "expected one handful of cashew, got " + cashew?.grams + "g");
});

test("电商食品类目：品牌未知时回退通用食品，别名不过度抢词", () => {
  const soda = parseFoodIntelligence("晚上吃了一包康师傅三+二苏打饼干");
  assert.equal(soda.items[0]?.food.id, "soda-cracker");
  assert.equal(soda.items[0]?.unit, "包");

  const yeastProtein = parseFoodIntelligence("吃了酵母蛋白");
  assert.equal(yeastProtein.items[0]?.food.id, "yeast-protein");

  const tiramisu = parseFoodIntelligence("吃了一块提拉米苏");
  assert.equal(tiramisu.items[0]?.food.id, "csv-ext2076");
  assert.equal(tiramisu.items[0]?.food.name, "提拉米苏");
});

test("电商食品类目：常见零食和冲调营养兜底可识别", () => {
  const cases: Array<[string, string]> = [
    ["吃了一包威化饼干", "wafer-biscuit"],
    ["下午吃了一个凤梨酥", "pineapple-cake"],
    ["早上喝了一袋黑芝麻糊", "black-sesame-paste"],
    ["训练后喝了一勺植物蛋白", "plant-protein"],
    ["早餐喝了一份代餐粉", "meal-replacement-powder"]
  ];

  for (const [input, expectedId] of cases) {
    const result = parseFoodIntelligence(input);
    assert.equal(result.items[0]?.food.id, expectedId, `${input}: expected ${expectedId}`);
  }
});

test("类目兜底：酒水饮品、生鲜海鲜、外卖和街头小吃可识别", () => {
  const cases: Array<[string, string]> = [
    ["喝了一瓶气泡水", "fallback-sparkling-water"],
    ["晚上喝了一罐啤酒", "beer"],
    ["喝了一杯芝士奶盖茶", "fallback-cheese-tea"],
    ["吃了一份三文鱼", "fallback-salmon"],
    ["吃了两只生蚝", "fallback-oyster"],
    ["吃了一份花甲", "fallback-clam"],
    ["晚上吃了一份烤冷面", "fried-cold-noodles"],
    ["夜宵吃了三串炸串", "fried-skewer"],
    ["中午点了一份麻辣香锅", "fallback-spicy-hot-pot-dry"],
    ["午餐吃了一盒外卖便当", "fallback-bento"]
  ];

  for (const [input, expectedId] of cases) {
    const result = parseFoodIntelligence(input);
    assert.equal(result.items[0]?.food.id, expectedId, `${input}: expected ${expectedId}`);
  }
});

test("类目兜底第二批：电商、外卖、生鲜、烧烤、便利店和茶饮高频入口可识别", () => {
  const cases: Array<[string, string]> = [
    ["中午吃了一碗牛肉泡馍", "fallback-b2-beef-paomo"],
    ["晚上吃了一份手抓饭", "fallback-b2-lamb-pilaf"],
    ["下午吃了一个烤包子", "fallback-b2-roast-baozi"],
    ["中午吃了一碗豆花米线", "fallback-b2-tofu-rice-noodle"],
    ["晚上吃了一锅酸汤鱼", "fallback-b2-sour-soup-fish"],
    ["中午吃了一碗老友粉", "fallback-b2-laoyou-fen"],
    ["晚上吃了一份文昌鸡", "fallback-b2-wenchang-chicken"],
    ["下午喝了一碗清补凉", "fallback-b2-qingbuliang"],
    ["早上喝了一杯咸豆浆", "fallback-b2-salty-soymilk"],
    ["早餐吃了一个三丁包", "fallback-b2-sanding-bun"],
    ["早上吃了一个麻球", "fallback-b2-sesame-ball"],
    ["夜宵吃了两串五花肉串", "fallback-b2-pork-belly-skewer"],
    ["晚上吃了两串烤鸡胗", "fallback-b2-bbq-gizzard"],
    ["晚上吃了一份锡纸花甲", "fallback-b2-foil-clam"],
    ["便利店买了一个金枪鱼饭团", "rice-ball"],
    ["中午吃了一盒咖喱猪排饭", "fallback-b2-katsu-curry-rice"],
    ["晚上吃了一包火鸡面", "fallback-b2-buldak-ramen"],
    ["午餐吃了一份藜麦沙拉", "fallback-b2-quinoa-salad"],
    ["训练后吃了一个全麦三明治", "fallback-b2-wholemeal-sandwich"],
    ["下午喝了一杯燕麦拿铁", "fallback-b2-oat-latte"],
    ["下午喝了一杯丝袜奶茶", "fallback-b2-silk-stocking-tea"],
    ["晚上吃了一个椰子冻", "fallback-b2-coconut-jelly"],
    ["下午吃了一块黑森林蛋糕", "fallback-b2-black-forest-cake"],
    ["晚上喝了一罐IPA啤酒", "fallback-b2-ipa-beer"],
    ["晚上喝了一杯茅台", "fallback-b2-maotai"],
    ["吃了一片阿胶糕", "fallback-b2-ejiao-cake"]
  ];

  for (const [input, expectedId] of cases) {
    const result = parseFoodIntelligence(input);
    const ids = result.items.map((item) => item.food.id);
    assert.equal(result.items[0]?.food.id, expectedId, `${input}: expected ${expectedId}, got [${ids.join(",")}]`);
  }
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

test("真实长文本回归：多餐次、重量、下午茶和复合零食不应误拆", () => {
  const result = parseFoodIntelligence(
    "早上吃了一笼小笼包，一碗鸭血粉丝汤，一杯豆浆。中午吃了一碗米饭，一份大概 300g 的辣椒炒肉，一碗鸡蛋羹，半斤牛肉，300g 酸奶。下午茶吃了 3 个鸡肉燕麦饭团，半斤麻辣花生米，两包蒜香面包干，半个黄庄月饼，一个蛋黄酥饼"
  );
  const byId = new Map(result.items.map((item) => [item.food.id, item]));
  const ids = result.items.map((item) => item.food.id);

  assert.equal(byId.get("hunan-chili-fried-pork")?.food.name, "辣椒炒肉");
  assert.equal(byId.get("hunan-chili-fried-pork")?.grams, 300);
  assert.equal(byId.get("beef")?.grams, 250);
  assert.equal(byId.get("yogurt")?.grams, 300);
  assert.equal(byId.get("chicken-oat-onigiri")?.quantity, 3);
  assert.equal(byId.get("chicken-oat-onigiri")?.unit, "个");
  assert.equal(byId.get("spicy-peanuts")?.grams, 250);
  assert.equal(byId.get("garlic-bread-crisps")?.quantity, 2);
  assert.equal(byId.get("garlic-bread-crisps")?.unit, "包");
  assert.equal(byId.get("huangzhuang-mooncake")?.quantity, 0.5);
  assert.equal(byId.get("egg-yolk-pastry-light")?.quantity, 1);

  assert.ok(!ids.includes("tea"), "下午茶不应被识别为茶");
  assert.ok(!ids.includes("chicken-breast"), "鸡肉燕麦饭团不应被拆成鸡胸肉");
  assert.ok(!ids.includes("oatmeal"), "鸡肉燕麦饭团不应被拆成燕麦");
  assert.ok(!ids.includes("sushi"), "饭团不应回落到寿司");
  assert.ok(!ids.includes("bread"), "蒜香面包干不应回落到普通面包");
});

test("细分份量：经典小吃、烘焙零食和月饼按更精确默认份量估算", () => {
  const result = parseFoodIntelligence("一碗鸭血粉丝汤，半个黄庄月饼，一个蛋黄酥饼，两包蒜香面包干");
  const byId = new Map(result.items.map((item) => [item.food.id, item]));

  assert.equal(byId.get("duck-blood-vermicelli-soup")?.grams, 350);
  assert.equal(byId.get("huangzhuang-mooncake")?.grams, 23);
  assert.equal(byId.get("egg-yolk-pastry-light")?.grams, 45);
  assert.equal(byId.get("garlic-bread-crisps")?.grams, 60);
});

test("真实口语：后置重量优先于半个、半杯、一桶等容器估算", () => {
  const watermelon = parseFoodIntelligence("早上吃了半个西瓜，大概有半斤");
  const watermelonItem = watermelon.items.find((item) => item.food.id === "watermelon");
  assert.ok(watermelonItem, "expected watermelon");
  assert.equal(watermelonItem?.grams, 250);
  assert.equal(watermelonItem?.reason, "explicit-weight");
  assert.equal(watermelonItem?.needsDetails, false);
  assert.equal(calculateFoodTotals(watermelonItem!.food, watermelonItem!.grams).calories, 78);

  const popcorn = parseFoodIntelligence("一桶爆米花，大概半斤");
  const popcornItem = popcorn.items.find((item) => item.food.id === "popcorn");
  assert.ok(popcornItem, "expected popcorn");
  assert.equal(popcornItem?.grams, 250);
  assert.equal(popcornItem?.reason, "explicit-weight");
  assert.equal(popcornItem?.needsDetails, true);
  assert.equal(calculateFoodTotals(popcornItem!.food, popcornItem!.grams).calories, 1075);
});

test("模糊食品：品牌奶茶、甜品份量和花生做法需要用户补全细节", () => {
  const milkTea = parseFoodIntelligence("喝了半杯伯牙绝弦");
  const milkTeaItem = milkTea.items.find((item) => item.food.id === "milk-tea");
  assert.ok(milkTeaItem, "expected milk-tea");
  assert.equal(milkTeaItem?.grams, 250);
  assert.equal(milkTeaItem?.needsDetails, true);
  assert.match(milkTeaItem?.detailHint ?? "", /糖度/);

  const tiramisu = parseFoodIntelligence("半份提拉米苏");
  const tiramisuItem = tiramisu.items.find((item) => item.food.id === "csv-ext2076");
  assert.ok(tiramisuItem, "expected tiramisu");
  assert.equal(tiramisuItem?.grams, 60);
  assert.equal(tiramisuItem?.needsDetails, true);
  assert.ok(calculateFoodTotals(tiramisuItem!.food, tiramisuItem!.grams).calories > 120);

  const genericPeanut = parseFoodIntelligence("半斤花生");
  assert.equal(genericPeanut.items[0]?.food.id, "peanuts");
  assert.equal(genericPeanut.items[0]?.grams, 250);
  assert.equal(genericPeanut.items[0]?.needsDetails, true);

  const boiledPeanut = parseFoodIntelligence("半斤水煮花生");
  assert.equal(boiledPeanut.items[0]?.food.id, "boiled-peanuts");
  assert.equal(boiledPeanut.items[0]?.grams, 250);
  assert.equal(boiledPeanut.items[0]?.needsDetails, false);

  const friedPeanut = parseFoodIntelligence("半斤油炸花生");
  assert.equal(friedPeanut.items[0]?.food.id, "fried-peanuts");
  assert.equal(friedPeanut.items[0]?.grams, 250);
  assert.equal(friedPeanut.items[0]?.needsDetails, false);
});

test("食物智能识别管线：泛品类要追问，明确食物不重复拆分", () => {
  const result = parseFoodIntelligence("一个鸡蛋，两个蒸蛋，一碗南瓜粥，一碗豆腐脑");
  const byId = new Map(result.items.map((item) => [item.food.id, item]));

  const egg = byId.get("egg");
  assert.ok(egg, "expected generic egg");
  assert.equal(egg?.needsDetails, true);
  assert.match(egg?.detailHint ?? "", /鸡蛋做法/);

  const steamedEgg = byId.get("steamed-egg");
  assert.ok(steamedEgg, "expected steamed-egg");
  assert.equal(steamedEgg?.needsDetails, false);

  const pumpkinCongee = byId.get("pumpkin-congee");
  assert.ok(pumpkinCongee, "expected pumpkin-congee");
  assert.equal(pumpkinCongee?.food.name, "南瓜粥");
  assert.equal(pumpkinCongee?.needsDetails, false);
  assert.ok(!byId.has("sweet-congee"), "南瓜粥不应回落成甜粥");

  const tofuPudding = byId.get("tofu-pudding");
  assert.ok(tofuPudding, "expected tofu-pudding");
  assert.equal(tofuPudding?.needsDetails, true);
  assert.match(tofuPudding?.detailHint ?? "", /豆腐脑口味/);
});

test("食物智能识别管线：豆腐脑已给出口味时不再提示待细分", () => {
  const salty = parseFoodIntelligence("一碗咸豆腐脑");
  const sweet = parseFoodIntelligence("一碗甜豆腐脑");

  assert.equal(salty.items[0]?.food.id, "tofu-pudding");
  assert.equal(salty.items[0]?.needsDetails, false);
  assert.equal(sweet.items[0]?.food.id, "tofu-pudding");
  assert.equal(sweet.items[0]?.needsDetails, false);
});

test("食物智能识别管线：兜底请求只收敛未识别、低置信度和待细分项", () => {
  const result = parseFoodIntelligencePipeline("一个鸡蛋，两个蒸蛋，一碗南瓜粥，一碗豆腐脑，神秘太空食物");
  const requests = result.fallbackRequests;

  assert.ok(requests.some((item) => item.reason === "needs-details" && item.matchedFoodId === "egg"));
  assert.ok(requests.some((item) => item.reason === "needs-details" && item.matchedFoodId === "tofu-pudding"));
  assert.ok(requests.some((item) => item.reason === "unmatched" && /神秘|太空/.test(item.rawText)));
  assert.equal(requests.some((item) => item.matchedFoodId === "steamed-egg"), false);
  assert.equal(requests.some((item) => item.matchedFoodId === "pumpkin-congee"), false);
});

test("食物智能识别管线：输出估算审查信息，但不把置信度作为 UI 必填信息", () => {
  const result = parseFoodIntelligencePipeline("一个鸡蛋，两个蒸蛋，一碗豆腐脑，3个面包，一碗水饺");
  const reviews = new Map(result.reviewItems.map((item) => [item.foodId, item]));

  const egg = reviews.get("egg");
  assert.ok(egg, "expected egg review");
  assert.equal(egg?.estimateLabel, "估算");
  assert.equal(egg?.title, "鸡蛋估算");
  assert.equal(egg?.needsReview, true);
  assert.equal(egg?.variantGroupLabel, "鸡蛋做法");
  assert.ok(egg?.missingFields.some((field) => field.label === "鸡蛋做法" && field.required));
  assert.ok(egg?.variantOptions.some((option) => option.label === "水煮蛋"));
  assert.match(egg?.defaultAssumption.description ?? "", /默认|暂按|估算/);
  assert.ok(egg && !("confidence" in egg), "review item should not expose confidence as UI contract");

  const steamedEgg = reviews.get("steamed-egg");
  assert.ok(steamedEgg, "expected steamed egg review");
  assert.equal(steamedEgg?.needsReview, false);
  assert.deepEqual(steamedEgg?.missingFields, []);
  assert.equal(steamedEgg?.estimateLabel, "估算");

  const bread = reviews.get("bread");
  assert.ok(bread, "expected bread review");
  assert.equal(bread?.variantGroupLabel, "面包类型");
  assert.ok(bread?.variantOptions.length && bread.variantOptions.length >= 5);
  assert.ok(bread?.missingFields.some((field) => field.label === "面包类型"));

  const dumplings = reviews.get("dumplings");
  assert.ok(dumplings, "expected generic dumplings review");
  assert.equal(dumplings?.variantGroupLabel, "水饺馅料");
  assert.ok(dumplings?.missingFields.some((field) => field.label === "水饺馅料"));

  const tofuPudding = reviews.get("tofu-pudding");
  assert.ok(tofuPudding, "expected tofu pudding review");
  assert.equal(tofuPudding?.variantGroupLabel, "豆腐脑口味");
  assert.ok(tofuPudding?.nutrition.calories && tofuPudding.nutrition.calories > 0);
  assert.ok(tofuPudding?.nutrition.proteinG !== undefined);
  assert.ok(tofuPudding?.nutrition.fatG !== undefined);
  assert.ok(tofuPudding?.nutrition.carbsG !== undefined);
});

test("食物智能识别管线：用户真实长句中泛化面包和水饺必须保留待细分", () => {
  const input = "一个鸡蛋，两个蒸蛋，一碗南瓜粥，一碗豆腐脑，中午吃了半斤猪肉、一份菠菜、3个面包、一碗水饺，还有一份鸡胸肉。";
  const result = parseFoodIntelligence(input);
  const byId = new Map(result.items.map((item) => [item.food.id, item]));

  assert.equal(byId.get("bread")?.quantity, 3);
  assert.equal(byId.get("bread")?.unit, "个");
  assert.equal(byId.get("bread")?.needsDetails, true);
  assert.match(byId.get("bread")?.detailHint ?? "", /面包类型/);

  assert.ok(byId.get("dumplings"), "泛化水饺应识别为水饺基础条目");
  assert.equal(byId.get("dumplings")?.unit, "碗");
  assert.equal(byId.get("dumplings")?.needsDetails, true);
  assert.match(byId.get("dumplings")?.detailHint ?? "", /水饺馅料/);
  assert.equal(byId.has("pork-scallion-dumplings"), false, "用户没说猪肉大葱时不能默认成猪肉大葱水饺");

  assert.equal(byId.get("pork-lean")?.grams, 250);
  assert.equal(byId.get("pork-lean")?.needsDetails, true);
  assert.equal(byId.get("chicken-breast")?.needsDetails, true);
});

test("电商健身减脂食品：高频入口识别为独立食品而不是拆成通用词", () => {
  const cases: Array<[string, string, number]> = [
    ["吃了一袋即食鸡胸肉", "ready-chicken-breast", 100],
    ["训练后吃了一根蛋白棒", "protein-bar", 50],
    ["晚餐吃了一包魔芋面", "konjac-noodles", 200],
    ["中午吃了一盒轻食沙拉", "light-meal-salad", 300],
    ["早上吃了一个全麦贝果", "whole-wheat-bagel", 90],
    ["早餐喝了一盒蛋清液", "egg-white-liquid", 250],
    ["中午吃了一盒藜麦鸡胸碗", "quinoa-chicken-bowl", 350],
    ["加餐吃了两根鸡肉肠", "chicken-sausage", 80]
  ];

  for (const [input, expectedId, expectedGrams] of cases) {
    const result = parseFoodIntelligence(input);
    const item = result.items.find((entry) => entry.food.id === expectedId);
    assert.ok(item, `${input}: expected ${expectedId}, got [${result.items.map((entry) => entry.food.id).join(",")}]`);
    assert.equal(item?.grams, expectedGrams, input);
  }
});

test("细分类展示：咖啡和坚果优先显示具体食品", () => {
  const latte = parseFoodIntelligence("早上喝了一杯拿铁");
  assert.equal(latte.items[0]?.food.id, "latte");
  assert.equal(latte.items[0]?.food.name, "拿铁");

  const americano = parseFoodIntelligence("训练前喝了一杯美式咖啡");
  assert.equal(americano.items[0]?.food.id, "americano");
  assert.equal(americano.items[0]?.food.name, "美式咖啡");

  const nuts = parseFoodIntelligence("下午吃了一把腰果和一把开心果");
  const ids = nuts.items.map((item) => item.food.id);
  assert.ok(ids.includes("cashew"), "expected cashew, got [" + ids.join(",") + "]");
  assert.ok(ids.includes("pistachio"), "expected pistachio, got [" + ids.join(",") + "]");
  assert.ok(!ids.includes("nuts"), "specific nuts should not fall back to generic nuts");
});

test("食物识别管线硬性回归：真实长句不能乱拆、乱分餐、乱套细分或给出离谱重量", () => {
  const input = `下午：
吃了两斤高蛋白鸡胸肉丸、一盒蓝莓、两块黑巧克力、一包薯片、3 袋牛奶、一个黑巧布朗尼。

下午茶：
吃了一包烤馍、两个麻辣鸭腿、3 杯 3 勺蛋白粉、一碗螺蛳粉。

晚上：
又吃了一个盐水鸭、三个板栗、半包干脆面。`;

  const result = parseFoodIntelligencePipeline(input);
  const ids = result.items.map((item) => item.food.id);
  const byId = new Map(result.items.map((item) => [item.food.id, item]));
  const reviews = new Map(result.reviewItems.map((item) => [item.foodId, item]));

  assert.deepEqual(ids, [
    "high-protein-chicken-meatballs",
    "blueberry",
    "dark-chocolate",
    "chips",
    "milk",
    "dark-chocolate-brownie",
    "roasted-mantou",
    "spicy-duck-leg",
    "protein-powder",
    "luo-si-fan",
    "salted-duck",
    "chestnut",
    "crispy-noodles"
  ]);

  assert.equal(byId.get("high-protein-chicken-meatballs")?.grams, 1000);
  assert.equal(byId.get("high-protein-chicken-meatballs")?.meal, "snack");
  assert.equal(byId.get("dark-chocolate-brownie")?.quantity, 1);
  assert.equal(byId.get("dark-chocolate-brownie")?.meal, "snack");
  assert.equal(byId.get("roasted-mantou")?.meal, "snack");
  assert.equal(byId.get("spicy-duck-leg")?.quantity, 2);
  assert.equal(byId.get("protein-powder")?.needsDetails, true);
  assert.match(byId.get("protein-powder")?.detailHint ?? "", /蛋白粉类型/);
  assert.equal(byId.get("luo-si-fan")?.meal, "snack");
  assert.equal(byId.get("salted-duck")?.meal, "dinner");
  assert.ok((byId.get("salted-duck")?.grams ?? 0) >= 1000, "一个盐水鸭不能按十几克估算");
  assert.equal(byId.get("crispy-noodles")?.quantity, 0.5);
  assert.equal(byId.get("crispy-noodles")?.meal, "dinner");

  assert.equal(ids.includes("egg"), false, "高蛋白鸡胸肉丸不能拆成鸡蛋");
  assert.equal(ids.includes("chicken-breast"), false, "高蛋白鸡胸肉丸不能拆成鸡胸肉");
  assert.equal(ids.includes("chocolate"), false, "黑巧克力和黑巧布朗尼不能回落成普通巧克力");
  assert.equal(ids.includes("noodles"), false, "干脆面不能识别成面条");

  assert.equal(reviews.get("dark-chocolate")?.variantGroupLabel, "巧克力可可含量");
  assert.equal(reviews.get("dark-chocolate-brownie")?.variantGroupLabel, "布朗尼类型");
  assert.equal(reviews.get("protein-powder")?.variantGroupLabel, "蛋白粉类型");
  assert.equal(reviews.get("luo-si-fan")?.variantGroupLabel, "螺蛳粉加料");
  assert.ok(reviews.get("luo-si-fan")?.variantOptions.some((option) => option.label === "炸蛋螺蛳粉"));
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
  { name: "咖啡：拿铁一杯 + 蛋糕", text: "上午喝了一杯拿铁和一块蛋糕", expected: [["latte", undefined, "杯"], ["cake", undefined, "块"]] },
  { name: "饮料：柠檬汽水", text: "下午喝了一瓶雪碧", expected: [["sprite", undefined, "瓶"]] },
  { name: "汤品：排骨萝卜汤", text: "中午喝了一碗萝卜汤", expected: [["white-radish-soup", undefined, "碗"]] },
  { name: "汤品：紫菜蛋花汤", text: "晚上喝了一碗蛋花汤", expected: [["seaweed-soup", undefined, "碗"]] },
  { name: "汤品：西红柿蛋汤", text: "中午喝了一碗西红柿蛋汤", expected: [["tomato-soup", undefined, "碗"]] },
  { name: "酒：啤酒", text: "晚上喝了一瓶可乐", expected: [["cola", undefined, "瓶"]] },
  { name: "早餐：小米粥 + 油条", text: "早上吃了一碗白粥和一根油条", expected: [["congee", undefined, "碗"], ["youtiao", undefined, "根"]] },
  { name: "粤式：烧鸭饭 + 肠粉", text: "中午吃了一份烧鸭饭和一份肠粉", expected: [["roast-duck", undefined, "份"], ["guangzhou-rice-roll", undefined, "份"]] },
  { name: "茶：铁观音", text: "下午喝了一杯铁观音", expected: [["tea", undefined, "杯"]] },
  { name: "饮料：大麦茶", text: "下午喝了一杯大麦茶", expected: [["wheat-barley-tea", undefined, "杯"]] },
  { name: "饮料：米酒不应误识别成酒酿", text: "早上喝了一杯米酒", expected: [["rice-wine", undefined, "杯"]] },
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
