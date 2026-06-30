import assert from "node:assert/strict";
import test from "node:test";
import { getFoodCatalog, type Food } from "@fitness-calendar/shared";
import { parseFoodIntelligence } from "../food-intelligence-engine";
import { getFoodVariantGroupLabel, getFoodVariantOptions, inferDefaultFoodVariant, resolveFoodByVariant } from "../food-variant-options";

const peanut: Food = {
  id: "peanuts",
  name: "花生",
  aliases: ["花生米", "落花生"],
  category: "snack",
  caloriesPer100g: 567,
  proteinPer100g: 25.8,
  fatPer100g: 49.2,
  carbsPer100g: 16.1,
  defaultUnitGram: 30
};

const dumpling: Food = {
  id: "dumplings",
  name: "水饺",
  aliases: ["水饺", "饺子"],
  category: "dish",
  caloriesPer100g: 210,
  proteinPer100g: 8,
  fatPer100g: 7,
  carbsPer100g: 28,
  defaultUnitGram: 250
};

const bread: Food = {
  id: "bread",
  name: "面包",
  aliases: ["吐司", "切片面包"],
  category: "staple",
  caloriesPer100g: 265,
  proteinPer100g: 9,
  fatPer100g: 3.2,
  carbsPer100g: 49,
  defaultUnitGram: 80
};

const egg: Food = {
  id: "egg",
  name: "鸡蛋",
  aliases: ["蛋", "鸡子"],
  category: "protein",
  caloriesPer100g: 151,
  proteinPer100g: 12.8,
  fatPer100g: 10.5,
  carbsPer100g: 1.1,
  defaultUnitGram: 50
};

const soyMilk: Food = {
  id: "soy-milk",
  name: "豆浆",
  aliases: ["soymilk"],
  category: "drink",
  caloriesPer100g: 31,
  proteinPer100g: 2.6,
  fatPer100g: 1.6,
  carbsPer100g: 1.2,
  defaultUnitGram: 300
};

const coffee: Food = {
  id: "coffee",
  name: "咖啡",
  aliases: ["coffee"],
  category: "drink",
  caloriesPer100g: 2,
  proteinPer100g: 0.1,
  fatPer100g: 0,
  carbsPer100g: 0,
  defaultUnitGram: 300
};

const tofuBrain: Food = {
  id: "dounao",
  name: "豆腐脑",
  aliases: ["豆腐花", "豆花", "咸豆花", "甜豆花"],
  category: "protein",
  caloriesPer100g: 47,
  proteinPer100g: 2.6,
  fatPer100g: 1.8,
  carbsPer100g: 5.4,
  defaultUnitGram: 250
};

const tofu: Food = {
  id: "tofu",
  name: "豆腐",
  aliases: ["嫩豆腐", "老豆腐"],
  category: "protein",
  caloriesPer100g: 82,
  proteinPer100g: 8,
  fatPer100g: 4.8,
  carbsPer100g: 3.4,
  defaultUnitGram: 150
};

const mapoTofu: Food = {
  id: "mapo-tofu",
  name: "麻婆豆腐",
  aliases: ["麻婆豆腐盖饭"],
  category: "dish",
  caloriesPer100g: 130,
  proteinPer100g: 9,
  fatPer100g: 8,
  carbsPer100g: 7,
  defaultUnitGram: 300
};

const milk: Food = {
  id: "milk",
  name: "牛奶",
  aliases: ["纯牛奶", "脱脂牛奶", "全脂牛奶"],
  category: "drink",
  caloriesPer100g: 54,
  proteinPer100g: 3.2,
  fatPer100g: 3.2,
  carbsPer100g: 3.4,
  defaultUnitGram: 250
};

const yogurt: Food = {
  id: "yogurt",
  name: "酸奶",
  aliases: ["无糖酸奶", "希腊酸奶"],
  category: "drink",
  caloriesPer100g: 72,
  proteinPer100g: 3.5,
  fatPer100g: 2.7,
  carbsPer100g: 8.5,
  defaultUnitGram: 180
};

const beef: Food = {
  id: "beef",
  name: "牛肉",
  aliases: ["熟牛肉", "牛腱子"],
  category: "protein",
  caloriesPer100g: 220,
  proteinPer100g: 26,
  fatPer100g: 12,
  carbsPer100g: 1,
  defaultUnitGram: 120
};

const braisedBeef: Food = {
  id: "braised-beef",
  name: "卤牛肉",
  aliases: ["酱牛肉"],
  category: "protein",
  caloriesPer100g: 180,
  proteinPer100g: 28,
  fatPer100g: 7,
  carbsPer100g: 2,
  defaultUnitGram: 100
};

const friedChicken: Food = {
  id: "fried-chicken",
  name: "炸鸡",
  aliases: ["炸鸡块", "韩式炸鸡"],
  category: "fastfood",
  caloriesPer100g: 290,
  proteinPer100g: 18,
  fatPer100g: 18,
  carbsPer100g: 11,
  defaultUnitGram: 200
};

const congee: Food = {
  id: "congee",
  name: "粥",
  aliases: ["白粥", "小米粥", "皮蛋瘦肉粥"],
  category: "dish",
  caloriesPer100g: 65,
  proteinPer100g: 3.5,
  fatPer100g: 2.2,
  carbsPer100g: 8,
  defaultUnitGram: 300
};

const noodle: Food = {
  id: "noodles",
  name: "面条",
  aliases: ["汤面", "拌面", "炒面"],
  category: "staple",
  caloriesPer100g: 110,
  proteinPer100g: 3.8,
  fatPer100g: 0.8,
  carbsPer100g: 22,
  defaultUnitGram: 200
};

const hotpot: Food = {
  id: "hotpot",
  name: "火锅",
  aliases: ["麻辣烫", "冒菜"],
  category: "fastfood",
  caloriesPer100g: 160,
  proteinPer100g: 8,
  fatPer100g: 9,
  carbsPer100g: 11,
  defaultUnitGram: 500
};

test("食物细分类型：花生只展示花生相关做法，不混入馅料", () => {
  const labels = getFoodVariantOptions(peanut).map((option) => option.label);

  assert.deepEqual(labels, ["生花生", "水煮花生", "炒花生", "油炸花生"]);
  assert.equal(labels.some((label) => /馅/.test(label)), false);
  assert.equal(inferDefaultFoodVariant(peanut), "生花生");
});

test("食物细分类型：包子/饺子类才展示馅料候选", () => {
  const labels = getFoodVariantOptions(dumpling).map((option) => option.label);

  assert.ok(labels.includes("猪肉大葱馅"));
  assert.ok(labels.includes("素馅"));
});

test("食物细分类型：泛化面包提供主流面包类型，明确类型时收敛", () => {
  const genericLabels = getFoodVariantOptions(bread, { inputText: "3个面包" }).map((option) => option.label);
  const wholeWheatLabels = getFoodVariantOptions(bread, { inputText: "两片全麦面包" }).map((option) => option.label);
  const sweetLabels = getFoodVariantOptions(bread, { inputText: "一个菠萝包" }).map((option) => option.label);

  assert.deepEqual(genericLabels, ["白吐司", "全麦面包", "甜面包", "欧包/法棍", "贝果", "餐包", "夹心/奶油面包"]);
  assert.deepEqual(wholeWheatLabels, ["全麦面包"]);
  assert.deepEqual(sweetLabels, ["甜面包"]);
});

test("食物细分类型：泛化水饺不默认猪肉大葱，明确馅料才收敛", () => {
  const genericLabels = getFoodVariantOptions(dumpling, { inputText: "一碗水饺" }).map((option) => option.label);
  const beefLabels = getFoodVariantOptions(dumpling, { inputText: "牛肉饺子" }).map((option) => option.label);

  assert.deepEqual(genericLabels, ["猪肉大葱馅", "素馅", "三鲜馅", "牛肉馅", "虾仁馅"]);
  assert.deepEqual(beefLabels, ["牛肉馅"]);
});

test("食物细分类型：选择花生做法会同步热量模型", () => {
  const boiled = resolveFoodByVariant(peanut, "水煮花生");
  const fried = resolveFoodByVariant(peanut, "油炸花生");

  assert.equal(boiled.caloriesPer100g, 313);
  assert.equal(fried.caloriesPer100g, 583);
  assert.equal(resolveFoodByVariant(peanut, "猪肉大葱馅").caloriesPer100g, peanut.caloriesPer100g);
});

test("食物细分类型：明确水煮花生时不再展示其他加工方式", () => {
  const labels = getFoodVariantOptions(peanut, { inputText: "250g水煮花生" }).map((option) => option.label);

  assert.deepEqual(labels, ["水煮花生"]);
  assert.equal(labels.some((label) => /生花生|炒花生|油炸花生/.test(label)), false);
});

test("食物细分类型：蒸蛋是确定做法，不展示煎炸卤等候选", () => {
  const labels = getFoodVariantOptions(egg, { inputText: "早餐吃了100g蒸蛋" }).map((option) => option.label);

  assert.deepEqual(labels, ["蒸蛋"]);
  assert.equal(labels.some((label) => /煎|炒|油炸|炸|卤|酱烧/.test(label)), false);
  assert.equal(inferDefaultFoodVariant(egg, { inputText: "蒸蛋" }), "蒸蛋");
});

test("食物细分类型：泛化鸡蛋保留主流做法选择", () => {
  const labels = getFoodVariantOptions(egg, { inputText: "鸡蛋" }).map((option) => option.label);

  assert.deepEqual(labels, ["水煮蛋", "煎蛋", "炸蛋", "卤蛋", "蒸蛋"]);
});

test("食物细分类型：饮品明确糖度时只保留对应糖度", () => {
  const labels = getFoodVariantOptions(soyMilk, { inputText: "无糖豆浆 300ml", quantity: 300, unit: "ml" }).map((option) => option.label);

  assert.deepEqual(labels, ["无糖"]);
  assert.equal(labels.some((label) => /五分糖|七分糖|全糖/.test(label)), false);
});

test("食物细分类型：泛化咖啡提供糖度选择，明确无糖咖啡只保留无糖", () => {
  const coffeeLabels = getFoodVariantOptions(coffee, { inputText: "咖啡" }).map((option) => option.label);
  const unsweetenedLabels = getFoodVariantOptions(coffee, { inputText: "无糖咖啡" }).map((option) => option.label);

  assert.deepEqual(coffeeLabels, ["无糖", "加糖", "半糖", "全糖"]);
  assert.deepEqual(unsweetenedLabels, ["无糖"]);
});

test("食物细分类型：豆腐脑使用甜咸口味维度，不套普通蛋白烹饪方式", () => {
  const labels = getFoodVariantOptions(tofuBrain, { inputText: "一碗豆腐脑", quantity: 1, unit: "碗" }).map((option) => option.label);

  assert.deepEqual(labels, ["咸豆腐脑", "甜豆腐脑", "原味豆花", "辣卤豆腐脑"]);
  assert.equal(labels.some((label) => /水煮|清蒸|煎|炒|油炸|卤制|酱烧/.test(label)), false);
});

test("食物细分类型：真实输入一碗豆腐脑能从运行时食物库识别并使用豆腐脑细分", () => {
  const result = parseFoodIntelligence("一碗豆腐脑");
  const match = result.items.find((item) => item.food.name === "豆腐脑");
  const catalogFood = getFoodCatalog().find((food) => food.id === "tofu-pudding");

  assert.ok(catalogFood);
  assert.ok(match);
  assert.equal(match.unit, "碗");
  assert.deepEqual(
    getFoodVariantOptions(match.food, { inputText: match.rawText, grams: match.grams, quantity: match.quantity, unit: match.unit }).map((option) => option.label),
    ["咸豆腐脑", "甜豆腐脑", "原味豆花", "辣卤豆腐脑"]
  );
});

test("食物细分类型：明确甜/咸豆腐脑时只保留对应口味", () => {
  assert.deepEqual(getFoodVariantOptions(tofuBrain, { inputText: "甜豆腐脑" }).map((option) => option.label), ["甜豆腐脑"]);
  assert.deepEqual(getFoodVariantOptions(tofuBrain, { inputText: "咸豆花" }).map((option) => option.label), ["咸豆腐脑"]);
});

test("食物细分类型：普通豆腐走豆制品形态，成品麻婆豆腐不再给原料做法", () => {
  const tofuLabels = getFoodVariantOptions(tofu, { inputText: "一块豆腐" }).map((option) => option.label);
  const mapoLabels = getFoodVariantOptions(mapoTofu, { inputText: "一份麻婆豆腐" }).map((option) => option.label);

  assert.ok(tofuLabels.includes("嫩豆腐"));
  assert.ok(tofuLabels.includes("油豆腐"));
  assert.deepEqual(mapoLabels, []);
});

test("食物细分类型：牛奶和酸奶有自己的细分维度，不进入饮品糖度兜底", () => {
  assert.deepEqual(getFoodVariantOptions(milk, { inputText: "脱脂牛奶" }).map((option) => option.label), ["脱脂"]);
  assert.deepEqual(getFoodVariantOptions(yogurt, { inputText: "无糖酸奶" }).map((option) => option.label), ["无糖酸奶"]);
});

test("食物细分类型：原料牛肉可选做法，卤牛肉和炸鸡这类成品不再套原料做法", () => {
  const beefLabels = getFoodVariantOptions(beef, { inputText: "200g牛肉" }).map((option) => option.label);

  assert.deepEqual(beefLabels, ["水煮", "清蒸", "煎炒", "油炸", "卤制", "酱烧"]);
  assert.deepEqual(getFoodVariantOptions(braisedBeef, { inputText: "100g卤牛肉" }).map((option) => option.label), []);
  assert.deepEqual(getFoodVariantOptions(friedChicken, { inputText: "一份炸鸡" }).map((option) => option.label), []);
});

test("食物细分类型：主流成品按自己的维度细分", () => {
  assert.deepEqual(getFoodVariantOptions(congee, { inputText: "一碗皮蛋瘦肉粥" }).map((option) => option.label), ["皮蛋瘦肉粥"]);
  assert.deepEqual(getFoodVariantOptions(noodle, { inputText: "一碗炒面" }).map((option) => option.label), ["炒面"]);
  assert.deepEqual(getFoodVariantOptions(hotpot, { inputText: "一顿麻辣火锅" }).map((option) => option.label), ["麻辣红油"]);
});

test("食物细分标题：详情页显示具体分类标题，不再使用泛化做法/类型", () => {
  assert.equal(getFoodVariantGroupLabel(egg, { inputText: "蒸蛋" }), "鸡蛋做法");
  assert.equal(getFoodVariantGroupLabel(tofuBrain, { inputText: "一碗豆腐脑" }), "豆腐脑口味");
  assert.equal(getFoodVariantGroupLabel(soyMilk, { inputText: "无糖豆浆" }), "饮品糖度");
  assert.equal(getFoodVariantGroupLabel(milk, { inputText: "脱脂牛奶" }), "牛奶脂肪类型");
  assert.equal(getFoodVariantGroupLabel(dumpling, { inputText: "牛肉饺子" }), "水饺馅料");
  assert.equal(getFoodVariantGroupLabel(beef, { inputText: "200g牛肉" }), "蛋白质做法");
  assert.equal(getFoodVariantGroupLabel(mapoTofu, { inputText: "麻婆豆腐" }), "自定义细分");
});
