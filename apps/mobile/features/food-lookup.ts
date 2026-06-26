import type { Food } from "@fitness-calendar/shared";

export type FoodLookupResult = {
  food: Food;
  source: "online-estimate";
};

export async function lookupFoodOnline(term: string): Promise<FoodLookupResult> {
  const clean = cleanLookupTerm(term);
  const preset = estimateByName(clean);
  return {
    food: {
      id: `online-${slug(clean)}`,
      name: clean,
      aliases: [],
      category: preset.category,
      caloriesPer100g: preset.calories,
      proteinPer100g: preset.protein,
      fatPer100g: preset.fat,
      carbsPer100g: preset.carbs,
      defaultUnitGram: preset.grams,
      source: "online"
    },
    source: "online-estimate"
  };
}

function cleanLookupTerm(term: string): string {
  return term
    .trim()
    .replace(/^([0-9]+(?:\.[0-9]+)?|[零一二两三四五六七八九十半]+)\s*(个|颗|只|枚|根|片|块|份|碗|杯|瓶|罐|包|袋|串|勺|拳头|kg|g|克|斤|公斤|千克)/, "")
    .replace(/([0-9]+(?:\.[0-9]+)?|[零一二两三四五六七八九十半]+)\s*(个|颗|只|枚|根|片|块|份|碗|杯|瓶|罐|包|袋|串|勺|拳头|kg|g|克|斤|公斤|千克)$/, "")
    .trim() || term.trim();
}

function estimateByName(name: string) {
  if (/饮料|可乐|奶茶|咖啡|果汁|酒|啤/.test(name)) {
    return { category: "drink" as const, calories: 55, protein: 0.5, fat: 1, carbs: 10, grams: 330 };
  }
  if (/薯片|饼干|巧克力|糖|蛋糕|零食|辣条/.test(name)) {
    return { category: "snack" as const, calories: 480, protein: 6, fat: 24, carbs: 60, grams: 60 };
  }
  if (/鸡|牛|鱼|虾|蛋|肉|豆腐/.test(name)) {
    return { category: "protein" as const, calories: 150, protein: 18, fat: 7, carbs: 3, grams: 150 };
  }
  if (/菜|瓜|白菜|青菜|菠菜|生菜|西兰花/.test(name)) {
    return { category: "vegetable" as const, calories: 28, protein: 1.8, fat: 0.3, carbs: 5, grams: 180 };
  }
  if (/饭|面|粉|粥|包|馒头|红薯|玉米/.test(name)) {
    return { category: "staple" as const, calories: 150, protein: 4, fat: 1.5, carbs: 30, grams: 200 };
  }
  return { category: "dish" as const, calories: 140, protein: 7, fat: 6, carbs: 14, grams: 220 };
}

function slug(value: string): string {
  const ascii = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return ascii || encodeURIComponent(value).replace(/%/g, "").toLowerCase().slice(0, 32);
}
