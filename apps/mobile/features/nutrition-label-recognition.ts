import type { Food } from "@fitness-calendar/shared";

export type NutritionLabelMetrics = {
  name?: string;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbsPer100g?: number;
  defaultUnitGram?: number;
};

export type NutritionLabelRecognitionResponse = {
  mode: "nutrition-label";
  rawText: string;
  lines: string[];
  metrics: NutritionLabelMetrics;
};

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8787";
const nutritionLabelRecognitionUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/ai/nutrition-label-recognition`;

export async function recognizeNutritionLabelImage(imageBase64: string, imageName?: string): Promise<NutritionLabelRecognitionResponse> {
  const response = await fetch(nutritionLabelRecognitionUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      imageBase64,
      imageName,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<NutritionLabelRecognitionResponse>;
}

export function buildCustomFoodFromNutritionLabel(metrics: NutritionLabelMetrics, fallbackName = "OCR 自定义食物"): Food {
  const name = metrics.name?.trim() || fallbackName;
  return {
    id: createCustomFoodId(name),
    name,
    aliases: [],
    category: "dish",
    caloriesPer100g: metrics.caloriesPer100g ?? 120,
    proteinPer100g: metrics.proteinPer100g ?? 0,
    fatPer100g: metrics.fatPer100g ?? 0,
    carbsPer100g: metrics.carbsPer100g ?? 0,
    defaultUnitGram: metrics.defaultUnitGram ?? 100,
    source: "custom",
    confidenceLevel: "estimate",
  };
}

function createCustomFoodId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
  const suffix = Date.now().toString(36);
  return `ocr-food-${slug || "custom"}-${suffix}`;
}
