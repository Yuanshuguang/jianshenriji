import type { Food } from "@fitness-calendar/shared";

type OpenFoodFactsProduct = {
  product_name?: string;
  product_name_zh?: string;
  generic_name?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "energy-kcal"?: number;
    proteins_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
  };
  serving_quantity?: string;
};

type OpenFoodFactsResponse = {
  products?: OpenFoodFactsProduct[];
};

export type OnlineFoodSearchResult = {
  query: string;
  food?: Food;
  error?: string;
};

export async function searchOnlineFood(query: string): Promise<OnlineFoodSearchResult> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return { query, error: "请输入食物名称" };

  const params = new URLSearchParams({
    search_terms: normalizedQuery,
    search_simple: "1",
    json: "1",
    page_size: "8",
    sort_by: "unique_scans_n",
    fields: "product_name,product_name_zh,generic_name,nutriments,serving_quantity"
  });

  try {
    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`);
    if (!response.ok) return { query, error: `联网搜索失败：HTTP ${response.status}` };
    const payload = (await response.json()) as OpenFoodFactsResponse;
    const product = (payload.products ?? []).find(hasUsableNutrition);
    if (!product) return { query, error: "没有找到可用营养数据" };

    const nutriments = product.nutriments ?? {};
    const name = product.product_name_zh || product.product_name || product.generic_name || normalizedQuery;
    return {
      query,
      food: {
        id: createOnlineFoodId(normalizedQuery),
        name: normalizedQuery,
        aliases: Array.from(new Set([name, product.generic_name].filter((item): item is string => Boolean(item && item !== normalizedQuery)))),
        category: "dish",
        caloriesPer100g: round1(nutriments["energy-kcal_100g"] ?? nutriments["energy-kcal"] ?? 120),
        proteinPer100g: round1(nutriments.proteins_100g ?? 0),
        fatPer100g: round1(nutriments.fat_100g ?? 0),
        carbsPer100g: round1(nutriments.carbohydrates_100g ?? 0),
        defaultUnitGram: parseServingGram(product.serving_quantity) ?? 100,
        source: "custom"
      }
    };
  } catch {
    return { query, error: "联网搜索暂时不可用" };
  }
}

function hasUsableNutrition(product: OpenFoodFactsProduct): boolean {
  const nutriments = product.nutriments;
  if (!nutriments) return false;
  return Number.isFinite(nutriments["energy-kcal_100g"] ?? nutriments["energy-kcal"]);
}

function parseServingGram(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.max(1, Math.min(1000, Math.round(parsed)));
}

function createOnlineFoodId(query: string): string {
  return `online-${query.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
