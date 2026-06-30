import test from "node:test";
import assert from "node:assert/strict";
import { parseFoodIntelligence } from "../food-intelligence-engine";
import { getFoodVariantDetailStatus } from "../food-variant-options";

function parseIds(input: string): string[] {
  return parseFoodIntelligence(input).items.map((item) => item.food.id);
}

function expectFood(input: string, expectedId: string, forbiddenIds: string[] = []) {
  const ids = parseIds(input);
  assert.ok(ids.includes(expectedId), `${input}: expected ${expectedId}, got ${ids.join(",")}`);
  forbiddenIds.forEach((id) => {
    assert.equal(ids.includes(id), false, `${input}: should not match ${id}, got ${ids.join(",")}`);
  });
}

function expectVariantGroup(input: string, expectedId: string, expectedGroup: string) {
  const result = parseFoodIntelligence(input);
  const item = result.items.find((entry) => entry.food.id === expectedId);
  assert.ok(item, `${input}: expected ${expectedId}`);
  const detail = getFoodVariantDetailStatus(item.food, {
    inputText: input,
    grams: item.grams,
    quantity: item.quantity,
    unit: item.unit,
  });
  assert.equal(detail.groupLabel, expectedGroup, `${input}: wrong group`);
  assert.ok(detail.options.length > 0, `${input}: expected variant options`);
}

test("batch3 covers Chinese local high-frequency foods without falling back to unrelated generic foods", () => {
  const cases: Array<[string, string, string[]?]> = [
    ["早餐吃了一个手抓饼一杯豆浆", "fallback-b3-hand-grab-pancake"],
    ["早上一个鸡蛋灌饼一碗胡辣汤", "fallback-b3-egg-filled-pancake", ["egg"]],
    ["一碗河南胡辣汤", "fallback-b3-hulatang"],
    ["中午一份鱼香肉丝盖饭", "yuxiang-rousi", ["rice-cooked"]],
    ["中午一份宫保鸡丁盖饭", "kungpao-chicken", ["chicken-breast"]],
    ["晚餐吃酸菜鱼", "fallback-b3-sauerkraut-fish", ["fish"]],
    ["晚餐一份水煮鱼", "boiled-fish", ["fish"]],
    ["下午吃了一份钵钵鸡", "fallback-b3-bobo-chicken"],
    ["夜宵一份关东煮", "guandong-cook"],
    ["一份锅包肉", "fallback-b3-guobaorou"],
    ["一份地三鲜", "eggplant-garlic"],
    ["一份溜肉段", "fallback-b3-liurouduan"],
    ["一份小鸡炖蘑菇", "fallback-b3-chicken-mushroom-stew"],
    ["一碗重庆小面", "fallback-b3-chongqing-noodle", ["noodles"]],
    ["一碗豌杂面", "fallback-b3-wanza-noodle", ["noodles"]],
    ["一碗臊子面", "fallback-b3-saozi-noodle", ["noodles"]],
    ["一碗刀削面", "fallback-b3-knife-cut-noodle", ["noodles"]],
    ["一碗米粉", "fallback-b3-rice-noodle-generic", ["noodles"]],
    ["一碗酸辣粉", "suanlafen", ["noodles"]],
    ["一份卤肉饭", "braised-pork-rice"],
    ["一份照烧鸡饭", "fallback-b3-teriyaki-chicken-rice"],
    ["一份咖喱鸡饭", "fallback-b3-curry-chicken-rice"],
    ["一份牛肉饭", "fallback-b3-beef-rice"],
    ["一份麻辣拌", "fallback-b3-mala-mix", ["hotpot"]],
    ["一份鸡公煲", "fallback-b3-chicken-pot"],
    ["一份凉皮", "liangpi"],
    ["一份凉面", "fallback-b3-cold-noodle"],
    ["一份驴肉火烧", "fallback-b3-donkey-burger"],
    ["一份锅盔", "fallback-b3-guokui"],
    ["两个烧麦", "fallback-b3-shaomai"],
    ["一份春卷", "fallback-b3-spring-roll"],
    ["一个韭菜盒子", "fallback-b3-chive-pie"],
    ["一份虾滑", "shrimp-paste", ["shrimp"]],
    ["一份牛肉丸", "low-fat-beef-ball", ["beef"]],
    ["一份鱼丸", "fallback-b3-fish-ball", ["fish"]],
    ["一份蟹棒", "fallback-b3-crab-stick"],
    ["一份毛肚", "fallback-b3-tripe"],
    ["一份鸭肠", "fallback-b3-duck-intestine"],
    ["一份肥牛卷", "beef-belly-skewer", ["beef"]],
    ["一份肥羊卷", "fallback-b3-fat-lamb-roll"],
    ["一碟麻酱", "fallback-b3-sesame-paste", ["nuts"]],
    ["一碟油碟", "fallback-b3-oil-dip"],
    ["一勺沙拉酱", "fallback-b3-salad-dressing"],
    ["一勺蛋黄酱", "fallback-b3-mayonnaise", ["egg"]],
    ["一勺花生酱", "fallback-b3-peanut-butter", ["peanuts"]],
    ["一勺辣椒油", "fallback-b3-chili-oil"],
    ["两个蛋挞", "fallback-b3-egg-tart", ["egg"]],
    ["一份提拉米苏", "csv-ext2076"],
    ["一块巴斯克蛋糕", "fallback-b3-basque-cheesecake"],
    ["一份双皮奶", "fallback-b3-double-skin-milk"],
    ["一碗龟苓膏", "fallback-b3-guilinggao"],
    ["一份冰淇淋", "ice-cream"],
    ["一根雪糕", "ice-cream"],
    ["一根蛋白棒", "protein-bar", ["protein-powder", "egg"]],
    ["一包低脂鸡肉肠", "chicken-sausage", ["chicken-breast"]],
    ["一根火腿肠", "sausage"],
    ["一根烤肠", "fallback-b3-grilled-sausage"],
    ["一份卤猪蹄", "fallback-b3-pork-trotter"],
    ["一份猪耳朵", "fallback-b3-pork-ear"],
    ["一份夫妻肺片", "fallback-b3-fuqi-feipian"],
    ["一包威化饼干", "wafer-biscuit"],
    ["一包苏打饼干", "soda-cracker"],
    ["一瓶无糖可乐", "sugar-free-soda", ["cola"]],
    ["一瓶东方树叶", "fallback-b3-bottled-unsweetened-tea"],
    ["一杯生椰拿铁", "fallback-b3-coconut-latte", ["latte"]],
    ["一杯厚乳拿铁", "fallback-b3-thick-milk-latte", ["latte"]],
    ["一盒魔芋面", "konjac-noodles", ["noodles"]],
    ["一个梨", "pear"],
    ["一个桃子", "peach"],
    ["一个山竹", "mangosteen"],
    ["一份榴莲", "fallback-b3-durian"],
    ["一份菠萝", "fallback-b3-pineapple"],
    ["一份哈密瓜", "fallback-b3-hami-melon"],
    ["一份荔枝", "lychee"],
    ["一份龙眼", "fallback-b3-longan"],
  ];

  cases.forEach(([input, expected, forbidden]) => expectFood(input, expected, forbidden ?? []));
});

test("batch3 foods expose suitable variant groups instead of unrelated detail categories", () => {
  const cases: Array<[string, string, string]> = [
    ["一份虾滑", "shrimp-paste", "火锅食材类型"],
    ["一份肥牛卷", "beef-belly-skewer", "火锅食材类型"],
    ["一碟麻酱", "fallback-b3-sesame-paste", "酱料类型"],
    ["一勺蛋黄酱", "fallback-b3-mayonnaise", "酱料类型"],
    ["一份提拉米苏", "csv-ext2076", "甜品类型"],
    ["两个蛋挞", "fallback-b3-egg-tart", "甜品类型"],
    ["一根低脂鸡肉肠", "chicken-sausage", "肠类加工类型"],
  ];

  cases.forEach(([input, expectedId, group]) => expectVariantGroup(input, expectedId, group));
});
