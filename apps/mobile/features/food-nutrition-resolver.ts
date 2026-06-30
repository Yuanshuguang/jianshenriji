import { calculateFoodTotals, type Food, type NutritionTotals } from "@fitness-calendar/shared";
import { classifyFoodOntology, type FoodOntologyNode } from "./food-ontology";
import { getFoodVariantDetailStatus, resolveFoodByVariant, type FoodVariantOption } from "./food-variant-options";

export type FoodNutritionResolveInput = {
  food: Food;
  grams: number;
  rawText?: string;
  quantity?: number;
  unit?: string;
  selectedVariantLabel?: string;
  selectedGrams?: number;
};

export type FoodNutritionResolution = {
  foodId: string;
  foodName: string;
  grams: number;
  baseFood: Food;
  resolvedFood: Food;
  ontology: FoodOntologyNode;
  selectedVariantLabel?: string;
  defaultVariantLabel?: string;
  variantOptions: FoodVariantOption[];
  totals: NutritionTotals;
  assumption: string;
  needsUserInput: boolean;
};

export function resolveFoodNutrition(input: FoodNutritionResolveInput): FoodNutritionResolution {
  const grams = normalizeGrams(input.selectedGrams ?? input.grams);
  const context = {
    inputText: input.rawText,
    grams,
    quantity: input.quantity,
    unit: input.unit,
  };
  const ontology = classifyFoodOntology(input.food, context);
  const detailStatus = getFoodVariantDetailStatus(input.food, context);
  const defaultVariantLabel = inferDefaultVariantLabel(detailStatus.options);
  const selectedVariantLabel = input.selectedVariantLabel ?? defaultVariantLabel;
  const resolvedFood = resolveFoodByVariant(input.food, selectedVariantLabel);
  const totals = calculateFoodTotals(resolvedFood, grams);

  return {
    foodId: input.food.id,
    foodName: input.food.name,
    grams,
    baseFood: input.food,
    resolvedFood,
    ontology,
    selectedVariantLabel: input.selectedVariantLabel,
    defaultVariantLabel,
    variantOptions: detailStatus.options,
    totals,
    assumption: buildNutritionAssumption(input.food, grams, detailStatus.needsDetails, input.selectedVariantLabel, defaultVariantLabel),
    needsUserInput: detailStatus.needsDetails && !input.selectedVariantLabel,
  };
}

export function resolveFoodNutritionFromSelection(
  base: FoodNutritionResolution,
  selectedVariantLabel?: string,
  selectedGrams?: number
): FoodNutritionResolution {
  return resolveFoodNutrition({
    food: base.baseFood,
    grams: base.grams,
    rawText: selectedVariantLabel ?? base.selectedVariantLabel ?? base.defaultVariantLabel ?? base.foodName,
    selectedVariantLabel: selectedVariantLabel ?? base.selectedVariantLabel,
    selectedGrams: selectedGrams ?? base.grams,
  });
}

function inferDefaultVariantLabel(options: FoodVariantOption[]): string | undefined {
  return options[0]?.label;
}

function buildNutritionAssumption(
  food: Food,
  grams: number,
  needsDetails: boolean,
  selectedVariantLabel?: string,
  defaultVariantLabel?: string
): string {
  if (selectedVariantLabel) return `按用户选择“${selectedVariantLabel}”和 ${grams}g 重新估算`;
  if (needsDetails && defaultVariantLabel) return `暂按“${defaultVariantLabel}”和 ${grams}g 估算，用户确认细分后再修正`;
  if (defaultVariantLabel) return `按“${defaultVariantLabel}”和 ${grams}g 估算`;
  return `按“${food.name}”和 ${grams}g 估算`;
}

function normalizeGrams(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.round(value));
}
