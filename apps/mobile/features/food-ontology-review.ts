import type { Food } from "@fitness-calendar/shared";
import { resolveFoodNutrition, type FoodNutritionResolution } from "./food-nutrition-resolver";
import type { FoodIntelligenceItem } from "./food-parser-engine";
import { classifyFoodOntology, type FoodOntologyNode } from "./food-ontology";
import { getFoodVariantDetailStatus, type FoodVariantOption } from "./food-variant-options";

export type FoodMissingFieldKind =
  | "variant"
  | "serving"
  | "brand"
  | "sweetness"
  | "cooking"
  | "filling"
  | "processing";

export type FoodMissingField = {
  key: FoodMissingFieldKind;
  label: string;
  required: boolean;
  reason: string;
};

export type FoodDefaultAssumption = {
  label: string;
  description: string;
  grams: number;
};

export type FoodNutritionEstimate = {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

export type FoodRecognitionReview = {
  rawText: string;
  foodId: string;
  foodName: string;
  title: string;
  estimateLabel: "估算";
  grams: number;
  quantity?: number;
  unit?: string;
  meal: FoodIntelligenceItem["meal"];
  needsReview: boolean;
  missingFields: FoodMissingField[];
  defaultAssumption: FoodDefaultAssumption;
  ontology: FoodOntologyNode;
  nutritionResolution: FoodNutritionResolution;
  variantGroupLabel?: string;
  variantOptions: FoodVariantOption[];
  nutrition: FoodNutritionEstimate;
};

const kindByVariantKind: Record<FoodVariantOption["kind"], FoodMissingFieldKind> = {
  processing: "processing",
  filling: "filling",
  sweetness: "sweetness",
  cooking: "cooking",
  flavor: "variant",
  fatLevel: "variant",
  topping: "variant",
};

export function buildFoodRecognitionReviews(items: FoodIntelligenceItem[]): FoodRecognitionReview[] {
  return items.map(buildFoodRecognitionReview);
}

export function buildFoodRecognitionReview(item: FoodIntelligenceItem): FoodRecognitionReview {
  const detailStatus = getFoodVariantDetailStatus(item.food, {
    inputText: item.rawText,
    grams: item.grams,
    quantity: item.quantity,
    unit: item.unit,
  });
  const ontology = classifyFoodOntology(item.food, {
    inputText: item.rawText,
    grams: item.grams,
    quantity: item.quantity,
    unit: item.unit,
  });
  const nutritionResolution = resolveFoodNutrition({
    food: item.food,
    grams: item.grams,
    rawText: item.rawText,
    quantity: item.quantity,
    unit: item.unit,
  });
  const missingFields = buildMissingFields(item, detailStatus);
  const totals = nutritionResolution.totals;

  return {
    rawText: item.rawText,
    foodId: item.food.id,
    foodName: item.food.name,
    title: `${item.food.name}估算`,
    estimateLabel: "估算",
    grams: item.grams,
    quantity: item.quantity,
    unit: item.unit,
    meal: item.meal,
    needsReview: missingFields.length > 0 || item.needsDetails,
    missingFields,
    defaultAssumption: buildDefaultAssumption(item, detailStatus.options),
    ontology,
    nutritionResolution,
    variantGroupLabel: detailStatus.options.length > 0 ? detailStatus.groupLabel : undefined,
    variantOptions: detailStatus.options,
    nutrition: {
      calories: totals.calories,
      proteinG: totals.proteinG,
      fatG: totals.fatG,
      carbsG: totals.carbsG,
    },
  };
}

function buildMissingFields(
  item: FoodIntelligenceItem,
  detailStatus: ReturnType<typeof getFoodVariantDetailStatus>
): FoodMissingField[] {
  const fields: FoodMissingField[] = [];

  if (detailStatus.needsDetails && detailStatus.options.length > 0) {
    const firstKind = detailStatus.options[0]?.kind ?? "processing";
    fields.push({
      key: kindByVariantKind[firstKind],
      label: detailStatus.groupLabel,
      required: true,
      reason: item.detailHint ?? `需要确认${detailStatus.groupLabel}，否则只能按默认值估算`,
    });
  }

  if (shouldReviewServing(item)) {
    fields.push({
      key: "serving",
      label: "份量",
      required: false,
      reason: "当前份量来自常见默认值，用户补充重量后估算会更接近真实摄入",
    });
  }

  return dedupeMissingFields(fields);
}

function buildDefaultAssumption(item: FoodIntelligenceItem, options: FoodVariantOption[]): FoodDefaultAssumption {
  const variantLabel = item.needsDetails && options.length > 0 ? `，细分暂按“${options[0].label}”` : "";
  const servingText = item.unit && item.quantity
    ? `按 ${item.quantity}${item.unit} 约 ${item.grams}g`
    : `按约 ${item.grams}g`;

  return {
    label: `${item.food.name}默认估算`,
    description: `${servingText}${variantLabel} 计算；用户补充分量或细分后再修正。`,
    grams: item.grams,
  };
}

function shouldReviewServing(item: FoodIntelligenceItem): boolean {
  if (item.quantity || item.unit) return false;
  return item.reason === "default-food-serving";
}

function dedupeMissingFields(fields: FoodMissingField[]): FoodMissingField[] {
  const seen = new Set<string>();
  return fields.filter((field) => {
    const key = `${field.key}:${field.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
