import type { Food } from "@fitness-calendar/shared";
import { parseFoodText } from "./today-plan";

export type DishRecognitionCandidate = {
  name: string;
  calories?: number;
  confidence?: number;
  source: "baidu-dish-image";
};

export type DishRecognitionResponse = {
  candidates: DishRecognitionCandidate[];
};

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8787";
const dishRecognitionUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/ai/dish-recognition`;

export async function recognizeDishImage(imageBase64: string, imageName?: string): Promise<DishRecognitionResponse> {
  const response = await fetch(dishRecognitionUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      imageBase64,
      imageName,
      topNum: 5,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<DishRecognitionResponse>;
}

export function resolveDishRecognitionFoods(
  candidates: DishRecognitionCandidate[],
  customFoods: Food[]
): Food[] {
  const foods: Food[] = [];

  for (const candidate of candidates) {
    const parsed = parseFoodText(candidate.name, customFoods);
    const matchedFood = parsed.matched[0]?.food;
    if (matchedFood) {
      foods.push(matchedFood);
      continue;
    }

    foods.push({
      id: createDishFoodId(candidate.name),
      name: candidate.name,
      aliases: [],
      category: "dish",
      caloriesPer100g: candidate.calories ?? 120,
      proteinPer100g: 6,
      fatPer100g: 4,
      carbsPer100g: 12,
      defaultUnitGram: 100,
      source: "custom",
      confidenceLevel: "estimate",
    });
  }

  return dedupeFoods(foods);
}

function createDishFoodId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
  return `ai-dish-${slug || Date.now().toString(36)}`;
}

function dedupeFoods(foods: Food[]): Food[] {
  const seen = new Set<string>();
  return foods.filter((food) => {
    if (seen.has(food.id)) return false;
    seen.add(food.id);
    return true;
  });
}
