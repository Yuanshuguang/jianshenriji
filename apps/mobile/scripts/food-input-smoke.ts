/**
 * 饮食输入冒烟测试。
 * 当前根脚本 `pnpm food:smoke` 已改为运行 node:test 固定回归套件；
 * 保留这个脚本用于人工快速查看解析结果。
 *
 * 运行：pnpm --dir shared exec tsx ../apps/mobile/scripts/food-input-smoke.ts
 */
import { getFoodCatalog, type Food } from "@fitness-calendar/shared";
import { buildActualFoodPortionsFromText, buildMealPlan, parseFoodText } from "../features/today-plan";

const customFoods: Food[] = [
  {
    id: "custom-my-chicken-rice",
    name: "我的鸡腿饭",
    aliases: ["常吃鸡腿饭"],
    category: "dish",
    caloriesPer100g: 180,
    proteinPer100g: 12,
    fatPer100g: 6,
    carbsPer100g: 20,
    defaultUnitGram: 350,
    source: "custom"
  }
];

function printCase(label: string, input: string) {
  const parsed = parseFoodText(input, customFoods);
  console.log(`\n${label}`);
  console.log(`输入：${input}`);
  console.log("匹配：", parsed.matched.map((item) => ({
    id: item.food.id,
    name: item.food.name,
    grams: item.grams,
    meal: item.meal,
    confidence: item.confidence
  })));
  console.log("未识别：", parsed.unmatched);
}

printCase("基础识别", "白菜 豆腐 米饭 鸡蛋");
printCase("复合输入", "西红柿炒鸡蛋 方便面");
printCase("量词 + 长词优先", "早上吃了16个猪肉大葱馅儿水饺");
printCase("抽象量词", "两颗拳头大的西红柿");
printCase("我的菜单优先", "我的鸡腿饭");

const actual = buildActualFoodPortionsFromText("早上吃了16个猪肉大葱馅儿水饺，下午吃了坚果", customFoods);
const mealPlan = buildMealPlan(actual.portions, customFoods);

console.log("\n餐次分配：", mealPlan.map((meal) => ({
  meal: meal.name,
  foods: meal.foods
})));

const catalog = getFoodCatalog(customFoods);
console.log(`\n食物库总量：${catalog.length} 项（含我的菜单 ${customFoods.length} 项）`);
