import type { Food } from "@fitness-calendar/shared";

export type FoodVariantProfile = Pick<Food, "caloriesPer100g" | "proteinPer100g" | "fatPer100g" | "carbsPer100g">;

export type FoodVariantOption = {
  label: string;
  profile?: FoodVariantProfile;
};

function getFoodSearchText(food: Pick<Food, "id" | "name" | "aliases">): string {
  return `${food.id} ${food.name} ${food.aliases.join(" ")}`;
}

export function getFoodVariantOptions(food: Pick<Food, "id" | "name" | "aliases" | "category">): FoodVariantOption[] {
  const text = getFoodSearchText(food);

  if (/包子|baozi|肉包|饺|水饺|dumpling/i.test(text)) {
    return [
      { label: "猪肉大葱馅", profile: { caloriesPer100g: 244, proteinPer100g: 9, fatPer100g: 8, carbsPer100g: 34 } },
      { label: "素馅", profile: { caloriesPer100g: 180, proteinPer100g: 6, fatPer100g: 4, carbsPer100g: 30 } },
      { label: "地三鲜馅", profile: { caloriesPer100g: 205, proteinPer100g: 6, fatPer100g: 6, carbsPer100g: 34 } },
      { label: "牛肉馅", profile: { caloriesPer100g: 245, proteinPer100g: 11, fatPer100g: 9, carbsPer100g: 31 } }
    ];
  }

  if (/馄饨|云吞/i.test(text)) {
    return [
      { label: "猪肉馅", profile: { caloriesPer100g: 210, proteinPer100g: 9, fatPer100g: 6, carbsPer100g: 30 } },
      { label: "虾仁馅", profile: { caloriesPer100g: 185, proteinPer100g: 11, fatPer100g: 4, carbsPer100g: 28 } },
      { label: "鲜肉虾仁馅", profile: { caloriesPer100g: 205, proteinPer100g: 10, fatPer100g: 6, carbsPer100g: 29 } }
    ];
  }

  if (/花生|peanut/i.test(text) && !/花生酱|花生油|花生汤|汤圆|protein|bar|巧克力|三明治/i.test(text)) {
    return [
      { label: "生花生", profile: { caloriesPer100g: 563, proteinPer100g: 25, fatPer100g: 44, carbsPer100g: 15 } },
      { label: "水煮花生", profile: { caloriesPer100g: 313, proteinPer100g: 12, fatPer100g: 25.4, carbsPer100g: 13 } },
      { label: "炒花生", profile: { caloriesPer100g: 589, proteinPer100g: 24.1, fatPer100g: 44.3, carbsPer100g: 21.7 } },
      { label: "油炸花生", profile: { caloriesPer100g: 583, proteinPer100g: 22.2, fatPer100g: 47.1, carbsPer100g: 26.2 } }
    ];
  }

  return [];
}

export function inferDefaultFoodVariant(food: Pick<Food, "id" | "name" | "aliases" | "category">): string {
  const options = getFoodVariantOptions(food);
  if (options.length > 0) return options[0].label;
  return food.category === "dish" || food.category === "fastfood" ? "APP默认做法" : "标准食物数据";
}

export function resolveFoodByVariant(food: Food, variant?: string): Food {
  if (!variant || variant === "APP默认做法" || variant === "标准食物数据") return food;

  const option = getFoodVariantOptions(food).find((item) => item.label === variant);
  if (!option?.profile) return food;

  return {
    ...food,
    ...option.profile
  };
}
