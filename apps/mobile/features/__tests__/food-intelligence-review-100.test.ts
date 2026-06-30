// 食物智能识别 100 条复测：覆盖多角色、多口语表达、细分标签与营养数据合理性。
import test from "node:test";
import assert from "node:assert/strict";
import { calculateFoodTotals, getFoodCatalog, type Food } from "@fitness-calendar/shared";
import { parseFoodIntelligence } from "../food-intelligence-engine";
import { getFoodVariantDetailStatus, resolveFoodByVariant } from "../food-variant-options";

type RecognitionCase = {
  role: string;
  input: string;
  expectedId: string;
  expectedUnit?: string;
  needsDetails?: boolean;
};

type VariantCase = {
  role: string;
  foodId: string;
  input: string;
  expectedLabelIncludes?: string[];
  expectedSingleLabel?: string;
  expectedGroup: string;
  needsDetails: boolean;
  forbidden?: RegExp;
};

type NutritionCase = {
  role: string;
  foodId: string;
  input: string;
  grams: number;
  minCalories: number;
  maxCalories: number;
  variantLabel?: string;
  expectedCaloriesPer100g?: number;
};

const recognitionCases: RecognitionCase[] = [
  { role: "减脂用户早餐", input: "早上赶时间，一个鸡蛋一杯豆浆", expectedId: "egg", expectedUnit: "个", needsDetails: true },
  { role: "减脂用户早餐", input: "早上赶时间，一个鸡蛋一杯豆浆", expectedId: "doujiang", expectedUnit: "杯" },
  { role: "健身新手早餐", input: "早餐两个蒸蛋加一碗南瓜粥", expectedId: "steamed-egg", expectedUnit: "个", needsDetails: false },
  { role: "健身新手早餐", input: "早餐两个蒸蛋加一碗南瓜粥", expectedId: "pumpkin-congee", expectedUnit: "碗", needsDetails: false },
  { role: "北方早餐", input: "来一碗豆腐脑和两个肉包", expectedId: "tofu-pudding", expectedUnit: "碗", needsDetails: true },
  { role: "北方早餐", input: "来一碗豆腐脑和两个肉包", expectedId: "baozi", expectedUnit: "个" },
  { role: "明确口味早餐", input: "早餐一碗咸豆腐脑", expectedId: "tofu-pudding", expectedUnit: "碗", needsDetails: false },
  { role: "学生午餐", input: "中午吃了黄焖鸡米饭，顺手买了瓶可乐", expectedId: "huangmenji" },
  { role: "学生午餐", input: "中午吃了黄焖鸡米饭，顺手买了瓶可乐", expectedId: "cola", expectedUnit: "瓶" },
  { role: "办公室午餐", input: "午饭一碗番茄牛腩一碗米饭", expectedId: "tomato-beef", expectedUnit: "碗" },
  { role: "办公室午餐", input: "午饭一碗番茄牛腩一碗米饭", expectedId: "rice-cooked", expectedUnit: "碗" },
  { role: "加餐", input: "下午吃了一个苹果和一把腰果", expectedId: "apple", expectedUnit: "个" },
  { role: "加餐", input: "下午吃了一个苹果和一把腰果", expectedId: "cashew", expectedUnit: "把" },
  { role: "夜宵", input: "夜宵两只烤翅一罐无糖可乐", expectedId: "bbq-wing", expectedUnit: "只" },
  { role: "夜宵", input: "夜宵两只烤翅一罐无糖可乐", expectedId: "sugar-free-soda", expectedUnit: "罐" },
  { role: "追剧零食", input: "看剧吃了一包奥利奥和一袋辣条", expectedId: "oreo", expectedUnit: "包" },
  { role: "追剧零食", input: "看剧吃了一包奥利奥和一袋辣条", expectedId: "spicy-strips", expectedUnit: "袋" },
  { role: "水果加餐", input: "刚才吃了两颗车厘子和一盒蓝莓", expectedId: "cherry", expectedUnit: "颗" },
  { role: "水果加餐", input: "刚才吃了两颗车厘子和一盒蓝莓", expectedId: "blueberry", expectedUnit: "盒" },
  { role: "便利店晚餐", input: "便利店买了一桶泡面和一根鸡肉肠", expectedId: "instant-noodles", expectedUnit: "桶" },
  { role: "便利店晚餐", input: "便利店买了一桶泡面和一根鸡肉肠", expectedId: "chicken-sausage", expectedUnit: "根" },
  { role: "聚餐", input: "晚上吃了一顿火锅，还吃了一个冰激凌", expectedId: "hotpot", expectedUnit: "顿" },
  { role: "聚餐", input: "晚上吃了一顿火锅，还吃了一个冰激凌", expectedId: "ice-cream", expectedUnit: "个" },
  { role: "韩式快餐", input: "午餐一份石锅拌饭", expectedId: "bibimbap", expectedUnit: "份" },
  { role: "训练餐", input: "练完吃一块鸡胸肉一碗米饭一份西兰花", expectedId: "chicken-breast", expectedUnit: "块", needsDetails: true },
  { role: "训练餐", input: "练完吃一块鸡胸肉一碗米饭一份西兰花", expectedId: "rice-cooked", expectedUnit: "碗" },
  { role: "训练餐", input: "练完吃一块鸡胸肉一碗米饭一份西兰花", expectedId: "broccoli", expectedUnit: "份" },
  { role: "增肌晚餐", input: "晚上一块牛肉一个红薯一份菠菜", expectedId: "beef", expectedUnit: "块", needsDetails: true },
  { role: "增肌晚餐", input: "晚上一块牛肉一个红薯一份菠菜", expectedId: "sweet-potato", expectedUnit: "个" },
  { role: "增肌晚餐", input: "晚上一块牛肉一个红薯一份菠菜", expectedId: "spinach", expectedUnit: "份" },
  { role: "补剂", input: "睡前一勺蛋白粉加一杯牛奶", expectedId: "protein-powder", expectedUnit: "勺" },
  { role: "补剂", input: "睡前一勺蛋白粉加一杯牛奶", expectedId: "milk", expectedUnit: "杯" },
  { role: "快餐", input: "中午一个板烧鸡腿堡一份薯条一瓶可乐", expectedId: "grilled-chicken-burger", expectedUnit: "个" },
  { role: "快餐", input: "中午一个板烧鸡腿堡一份薯条一瓶可乐", expectedId: "kfc-fries", expectedUnit: "份" },
  { role: "快餐", input: "中午一个板烧鸡腿堡一份薯条一瓶可乐", expectedId: "cola", expectedUnit: "瓶" },
  { role: "盖饭", input: "中午一份卤肉饭加一份蒸蛋", expectedId: "braised-pork-rice", expectedUnit: "份" },
  { role: "盖饭", input: "中午一份卤肉饭加一份蒸蛋", expectedId: "steamed-egg", expectedUnit: "份", needsDetails: false },
  { role: "面食", input: "午饭一碗牛肉面四个小笼包", expectedId: "beef-noodle-soup", expectedUnit: "碗" },
  { role: "面食", input: "午饭一碗牛肉面四个小笼包", expectedId: "xiaolongbao", expectedUnit: "个" },
  { role: "外卖", input: "外卖一份冒菜，一份豆腐", expectedId: "hotpot", expectedUnit: "份" },
  { role: "外卖", input: "外卖一份冒菜，一份豆腐", expectedId: "tofu", expectedUnit: "份", needsDetails: true },
  { role: "小吃", input: "中午一份凉皮一个肉夹馍", expectedId: "liangpi", expectedUnit: "份" },
  { role: "小吃", input: "中午一份凉皮一个肉夹馍", expectedId: "chinese-burger", expectedUnit: "个" },
  { role: "烧烤", input: "晚上五串羊肉串一只烤翅", expectedId: "lamb-skewers", expectedUnit: "串" },
  { role: "烧烤", input: "晚上五串羊肉串一只烤翅", expectedId: "bbq-wing", expectedUnit: "只" },
  { role: "咖啡下午茶", input: "下午一杯拿铁一块蛋糕", expectedId: "latte", expectedUnit: "杯" },
  { role: "咖啡下午茶", input: "下午一杯拿铁一块蛋糕", expectedId: "cake", expectedUnit: "块" },
  { role: "饮料", input: "下午喝了一瓶雪碧", expectedId: "sprite", expectedUnit: "瓶" },
  { role: "汤品", input: "中午一碗萝卜汤", expectedId: "white-radish-soup", expectedUnit: "碗" },
  { role: "汤品", input: "晚上一碗紫菜蛋花汤", expectedId: "seaweed-soup", expectedUnit: "碗" },
  { role: "汤品", input: "中午一碗西红柿蛋汤", expectedId: "tomato-soup", expectedUnit: "碗" },
  { role: "喝茶", input: "下午一杯铁观音", expectedId: "tea", expectedUnit: "杯" },
  { role: "饮品", input: "下午一杯大麦茶", expectedId: "wheat-barley-tea", expectedUnit: "杯" },
  { role: "饮品", input: "早上一杯米酒", expectedId: "rice-wine", expectedUnit: "杯" },
  { role: "水果", input: "晚上一个火龙果一个猕猴桃", expectedId: "dragon-fruit", expectedUnit: "个" },
  { role: "水果", input: "晚上一个火龙果一个猕猴桃", expectedId: "kiwi", expectedUnit: "个" },
  { role: "蔬菜", input: "中午两根黄瓜两颗西红柿", expectedId: "cucumber", expectedUnit: "根" },
  { role: "蔬菜", input: "中午两根黄瓜两颗西红柿", expectedId: "tomato", expectedUnit: "颗" },
  { role: "粗粮", input: "中午一根玉米一个土豆", expectedId: "corn", expectedUnit: "根" },
  { role: "粗粮", input: "中午一根玉米一个土豆", expectedId: "potato", expectedUnit: "个" },
  { role: "甜品", input: "下午一球冰激凌一块巧克力", expectedId: "ice-cream", expectedUnit: "球" },
  { role: "甜品", input: "下午一球冰激凌一块巧克力", expectedId: "chocolate", expectedUnit: "块" },
  { role: "沙拉", input: "午饭一份西兰花一份生菜", expectedId: "broccoli", expectedUnit: "份" },
  { role: "沙拉", input: "午饭一份西兰花一份生菜", expectedId: "lettuce", expectedUnit: "份" },
  { role: "坚果", input: "下午一包坚果", expectedId: "nuts", expectedUnit: "包", needsDetails: true },
  { role: "粥", input: "早上一碗皮蛋瘦肉粥", expectedId: "preserved-egg-pork-congee", expectedUnit: "碗", needsDetails: false },
  { role: "粥", input: "早上一碗白粥一根油条", expectedId: "congee", expectedUnit: "碗" },
  { role: "粥", input: "早上一碗白粥一根油条", expectedId: "youtiao", expectedUnit: "根" },
  { role: "茶饮", input: "下午半杯伯牙绝弦", expectedId: "milk-tea", expectedUnit: "杯", needsDetails: true },
  { role: "坚果", input: "半斤水煮花生", expectedId: "boiled-peanuts", needsDetails: false },
];

const variantCases: VariantCase[] = [
  { role: "泛化鸡蛋", foodId: "egg", input: "一个鸡蛋", expectedGroup: "鸡蛋做法", expectedLabelIncludes: ["水煮蛋", "煎蛋", "炸蛋", "卤蛋", "蒸蛋"], needsDetails: true },
  { role: "明确蒸蛋", foodId: "steamed-egg", input: "两个蒸蛋", expectedGroup: "鸡蛋做法", expectedSingleLabel: "蒸蛋", needsDetails: false, forbidden: /煎蛋|炸蛋|卤蛋/ },
  { role: "明确鸡蛋羹", foodId: "steamed-egg", input: "一碗鸡蛋羹", expectedGroup: "鸡蛋做法", expectedSingleLabel: "蒸蛋", needsDetails: false, forbidden: /煎蛋|炸蛋|卤蛋/ },
  { role: "泛化豆腐脑", foodId: "tofu-pudding", input: "一碗豆腐脑", expectedGroup: "豆腐脑口味", expectedLabelIncludes: ["咸豆腐脑", "甜豆腐脑"], needsDetails: true, forbidden: /水煮|清蒸|煎炒|油炸|卤制|酱烧/ },
  { role: "咸豆腐脑", foodId: "tofu-pudding", input: "咸豆腐脑", expectedGroup: "豆腐脑口味", expectedSingleLabel: "咸豆腐脑", needsDetails: false },
  { role: "甜豆腐脑", foodId: "tofu-pudding", input: "甜豆腐脑", expectedGroup: "豆腐脑口味", expectedSingleLabel: "甜豆腐脑", needsDetails: false },
  { role: "普通豆腐", foodId: "tofu", input: "一块豆腐", expectedGroup: "豆制品类型", expectedLabelIncludes: ["嫩豆腐", "老豆腐", "豆腐干", "油豆腐", "豆腐皮"], needsDetails: true },
  { role: "嫩豆腐", foodId: "tofu", input: "一块嫩豆腐", expectedGroup: "豆制品类型", expectedSingleLabel: "嫩豆腐", needsDetails: false },
  { role: "泛化牛肉", foodId: "beef", input: "200g牛肉", expectedGroup: "蛋白质做法", expectedLabelIncludes: ["水煮", "清蒸", "煎炒", "油炸", "卤制", "酱烧"], needsDetails: true },
  { role: "清蒸鱼", foodId: "fish", input: "清蒸鱼肉", expectedGroup: "蛋白质做法", expectedSingleLabel: "清蒸", needsDetails: false },
  { role: "泛化花生", foodId: "peanuts", input: "半斤花生", expectedGroup: "花生加工方式", expectedLabelIncludes: ["生花生", "水煮花生", "炒花生", "油炸花生"], needsDetails: true },
  { role: "水煮花生", foodId: "boiled-peanuts", input: "水煮花生", expectedGroup: "花生加工方式", expectedSingleLabel: "水煮花生", needsDetails: false },
  { role: "油炸花生", foodId: "fried-peanuts", input: "油炸花生", expectedGroup: "花生加工方式", expectedSingleLabel: "油炸花生", needsDetails: false },
  { role: "泛化坚果", foodId: "nuts", input: "一包坚果", expectedGroup: "坚果加工方式", expectedLabelIncludes: ["原味坚果", "盐焗坚果", "糖衣坚果", "裹粉油炸坚果"], needsDetails: true },
  { role: "盐焗腰果", foodId: "cashew", input: "盐焗腰果", expectedGroup: "坚果加工方式", expectedSingleLabel: "盐焗坚果", needsDetails: false },
  { role: "泛化水饺", foodId: "dumplings", input: "一盘水饺", expectedGroup: "水饺馅料", expectedLabelIncludes: ["猪肉大葱馅", "素馅", "三鲜馅", "牛肉馅"], needsDetails: true },
  { role: "牛肉饺子", foodId: "dumplings", input: "牛肉饺子", expectedGroup: "水饺馅料", expectedSingleLabel: "牛肉馅", needsDetails: false },
  { role: "泛化面包", foodId: "bread", input: "3个面包", expectedGroup: "面包类型", expectedLabelIncludes: ["白吐司", "全麦面包", "甜面包", "欧包/法棍", "贝果"], needsDetails: true },
  { role: "全麦面包", foodId: "bread", input: "两片全麦面包", expectedGroup: "面包类型", expectedSingleLabel: "全麦面包", needsDetails: false },
  { role: "泛化包子", foodId: "baozi", input: "两个包子", expectedGroup: "包子馅料", expectedLabelIncludes: ["猪肉馅", "牛肉馅", "素菜馅", "豆沙馅"], needsDetails: true },
  { role: "豆沙包", foodId: "baozi", input: "豆沙包", expectedGroup: "包子馅料", expectedSingleLabel: "豆沙馅", needsDetails: false },
  { role: "泛化馄饨", foodId: "wonton", input: "一碗馄饨", expectedGroup: "馄饨馅料", expectedLabelIncludes: ["鲜肉馅", "虾仁馅", "菜肉馅"], needsDetails: true },
  { role: "虾仁馄饨", foodId: "wonton", input: "虾仁馄饨", expectedGroup: "馄饨馅料", expectedSingleLabel: "虾仁馅", needsDetails: false },
  { role: "泛化奶茶", foodId: "milk-tea", input: "一杯奶茶", expectedGroup: "奶茶糖度/小料", expectedLabelIncludes: ["无糖", "少糖", "标准糖", "加小料"], needsDetails: true },
  { role: "无糖奶茶", foodId: "milk-tea", input: "无糖奶茶", expectedGroup: "奶茶糖度/小料", expectedSingleLabel: "无糖", needsDetails: false },
  { role: "泛化豆浆", foodId: "doujiang", input: "一杯豆浆", expectedGroup: "饮品糖度", expectedLabelIncludes: ["无糖", "三分糖", "五分糖", "七分糖", "全糖"], needsDetails: true },
  { role: "无糖豆浆", foodId: "doujiang", input: "无糖豆浆", expectedGroup: "饮品糖度", expectedSingleLabel: "无糖", needsDetails: false },
  { role: "泛化咖啡", foodId: "coffee", input: "一杯咖啡", expectedGroup: "咖啡糖度", expectedLabelIncludes: ["无糖", "加糖", "半糖", "全糖"], needsDetails: true },
  { role: "美式咖啡", foodId: "americano", input: "美式咖啡", expectedGroup: "咖啡糖度", expectedSingleLabel: "无糖", needsDetails: false },
  { role: "牛奶", foodId: "milk", input: "脱脂牛奶", expectedGroup: "牛奶脂肪类型", expectedSingleLabel: "脱脂", needsDetails: false },
  { role: "酸奶", foodId: "yogurt", input: "无糖酸奶", expectedGroup: "酸奶类型", expectedSingleLabel: "无糖酸奶", needsDetails: false },
  { role: "火锅", foodId: "hotpot", input: "一顿麻辣火锅", expectedGroup: "火锅汤底/蘸料", expectedSingleLabel: "麻辣红油", needsDetails: false },
];

const nutritionCases: NutritionCase[] = [
  { role: "鸡蛋做法", foodId: "egg", input: "一个水煮蛋", grams: 55, minCalories: 70, maxCalories: 90, variantLabel: "水煮蛋", expectedCaloriesPer100g: 151 },
  { role: "鸡蛋做法", foodId: "egg", input: "一个煎蛋", grams: 55, minCalories: 100, maxCalories: 120, variantLabel: "煎蛋", expectedCaloriesPer100g: 199 },
  { role: "蒸蛋", foodId: "steamed-egg", input: "一碗蒸蛋", grams: 200, minCalories: 130, maxCalories: 160 },
  { role: "花生做法", foodId: "peanuts", input: "100g水煮花生", grams: 100, minCalories: 300, maxCalories: 330, variantLabel: "水煮花生", expectedCaloriesPer100g: 313 },
  { role: "花生做法", foodId: "peanuts", input: "100g油炸花生", grams: 100, minCalories: 560, maxCalories: 600, variantLabel: "油炸花生", expectedCaloriesPer100g: 583 },
  { role: "豆腐脑口味", foodId: "tofu-pudding", input: "一碗甜豆腐脑", grams: 250, minCalories: 160, maxCalories: 185, variantLabel: "甜豆腐脑", expectedCaloriesPer100g: 70 },
  { role: "豆腐脑口味", foodId: "tofu-pudding", input: "一碗咸豆腐脑", grams: 250, minCalories: 110, maxCalories: 130, variantLabel: "咸豆腐脑", expectedCaloriesPer100g: 48 },
  { role: "南瓜粥", foodId: "pumpkin-congee", input: "一碗南瓜粥", grams: 300, minCalories: 125, maxCalories: 145 },
  { role: "饮品糖度", foodId: "milk-tea", input: "500g标准糖奶茶", grams: 500, minCalories: 300, maxCalories: 320, variantLabel: "标准糖", expectedCaloriesPer100g: 62 },
  { role: "牛奶脂肪", foodId: "milk", input: "250g脱脂牛奶", grams: 250, minCalories: 80, maxCalories: 90, variantLabel: "脱脂", expectedCaloriesPer100g: 34 },
];

test("食物识别精准性复测：70 条多角色、多口语表达输入", () => {
  assert.equal(recognitionCases.length, 70);

  for (const item of recognitionCases) {
    const result = parseFoodIntelligence(item.input);
    const matched = result.items.find((entry) => entry.food.id === item.expectedId);
    const ids = result.items.map((entry) => entry.food.id).join(", ");

    assert.ok(matched, `${item.role}: ${item.input} expected ${item.expectedId}, got [${ids}]`);
    if (item.expectedUnit) {
      assert.equal(matched.unit, item.expectedUnit, `${item.role}: ${item.expectedId} unit`);
    }
    if (item.needsDetails !== undefined) {
      assert.equal(matched.needsDetails, item.needsDetails, `${item.role}: ${item.expectedId} needsDetails`);
    }
  }
});

test("食物标签分类合理性复测：32 条 family 与候选项审查", () => {
  assert.equal(variantCases.length, 32);

  for (const item of variantCases) {
    const food = mustFood(item.foodId);
    const status = getFoodVariantDetailStatus(food, { inputText: item.input });
    const labels = status.options.map((option) => option.label);
    const labelText = labels.join("、");

    assert.equal(status.groupLabel, item.expectedGroup, `${item.role}: group`);
    assert.equal(status.needsDetails, item.needsDetails, `${item.role}: needsDetails`);
    if (item.expectedSingleLabel) {
      assert.deepEqual(labels, [item.expectedSingleLabel], `${item.role}: single label`);
    }
    for (const expected of item.expectedLabelIncludes ?? []) {
      assert.ok(labels.includes(expected), `${item.role}: expected ${expected} in [${labelText}]`);
    }
    if (item.forbidden) {
      assert.equal(item.forbidden.test(labelText), false, `${item.role}: forbidden labels in [${labelText}]`);
    }
  }
});

test("分类营养数据准确性复测：10 条细分 profile 与热量区间", () => {
  assert.equal(nutritionCases.length, 10);

  for (const item of nutritionCases) {
    const baseFood = mustFood(item.foodId);
    const food = item.variantLabel ? resolveFoodByVariant(baseFood, item.variantLabel) : baseFood;
    const totals = calculateFoodTotals(food, item.grams);

    if (item.expectedCaloriesPer100g !== undefined) {
      assert.equal(food.caloriesPer100g, item.expectedCaloriesPer100g, `${item.role}: caloriesPer100g`);
    }
    assert.ok(
      totals.calories >= item.minCalories && totals.calories <= item.maxCalories,
      `${item.role}: ${item.input} expected ${item.minCalories}-${item.maxCalories} kcal, got ${totals.calories}`
    );
    assert.ok(food.proteinPer100g >= 0 && food.fatPer100g >= 0 && food.carbsPer100g >= 0, `${item.role}: macro should be non-negative`);
  }
});

function mustFood(id: string): Food {
  const food = getFoodCatalog().find((item) => item.id === id);
  assert.ok(food, `missing food ${id}`);
  return food;
}
