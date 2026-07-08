import {
  calculateFoodTotals,
  calculateNutritionGap,
  getFoodByIdFromCatalog,
  recommendMacroAwarePortions,
  sumNutrition,
  type DietDayType,
  type Food,
  type FoodPortion,
  type MealAdjustmentKey,
  type MealPlannerAdjustments,
  type MuscleGroup,
  type NutritionTotals
} from "@fitness-calendar/shared";
import type { AiRecognizedMealFood } from "../store/fitness-store";
import { resolveFoodByVariant } from "./food-variant-options";
import { resolveFoodNutrition } from "./food-nutrition-resolver";
import { buildActualFoodPortionsFromText, parseFoodText, type ParsedFoodText, type ActualFoodPortionResult } from "./today-plan";

export type FoodTagOverride = {
  hidden?: boolean;
  label?: string;
  calories?: number;
  grams?: number;
  filling?: string;
};

export type FoodTagMatch = {
  input: string;
  food: Food;
  grams: number;
  quantity?: number;
  unit?: string;
  displayAmount?: string;
  meal?: MealAdjustmentKey | "unknown";
  confidence?: number;
  needsDetails?: boolean;
  detailHint?: string;
};

export type ActualFoodPortionWithMeta = FoodPortion & {
  meal?: MealAdjustmentKey;
  displayAmount?: string;
  sourceIndex?: number;
};

export type TodayFoodStateInput = {
  selectedFoodIds: string[];
  customFoods: Food[];
  dietTarget: NutritionTotals;
  enabledMeals: Record<MealAdjustmentKey, boolean>;
  dayType: DietDayType;
  trainingFocus: MuscleGroup;
  mealPlanCustomAdjustment: MealPlannerAdjustments;
  actualFoodText: string;
  actualMealImageFoods: Record<MealAdjustmentKey, AiRecognizedMealFood[]>;
  foodTagEdits: Record<string, FoodTagOverride>;
};

export type TodayFoodState = {
  selectedFoods: Food[];
  plannedPortions: FoodPortion[];
  plannedTotals: NutritionTotals;
  preparedResult: ParsedFoodText;
  actualFood: ActualFoodPortionResult;
  aiImageMatches: FoodTagMatch[];
  aiImagePortions: ActualFoodPortionWithMeta[];
  combinedActualMatches: FoodTagMatch[];
  combinedActualPortions: FoodPortion[];
  adjustedActualPortions: FoodPortion[];
  actualTotals: NutritionTotals;
  actualIntake: number;
  actualGap: ReturnType<typeof calculateNutritionGap>;
};

const mealOrder: MealAdjustmentKey[] = ["breakfast", "lunch", "dinner", "snack"];

export function buildTodayFoodState(input: TodayFoodStateInput): TodayFoodState {
  const selectedFoods = input.selectedFoodIds.flatMap((foodId) => {
    const food = getFoodByIdFromCatalog(foodId, input.customFoods);
    return food ? [food] : [];
  });

  const plannedPortions = recommendMacroAwarePortions(selectedFoods, input.dietTarget, {
    enabledMeals: input.enabledMeals,
    dayType: input.dayType,
    trainingFocus: input.trainingFocus,
    adjustments: input.mealPlanCustomAdjustment
  });
  const plannedTotals = sumNutrition(plannedPortions.map((portion) => portion.totals));
  const preparedResult = parseFoodText(input.actualFoodText, input.customFoods);
  const actualFood = buildActualFoodPortionsFromText(input.actualFoodText, input.customFoods, {
    dailyCalorieTarget: input.dietTarget.calories
  });
  const aiImageMatches = buildAiImageFoodMatches(input.actualMealImageFoods, input.customFoods);
  const aiImagePortions = buildAiImageFoodPortions(aiImageMatches, actualFood.parsed.matched.length);
  const combinedActualMatches = [...actualFood.parsed.matched, ...aiImageMatches];
  const combinedActualPortions = [...actualFood.portions, ...aiImagePortions];
  const adjustedActualPortions = applyFoodTagOverrides(combinedActualPortions, combinedActualMatches, input.foodTagEdits);
  const actualTotals = sumNutrition(adjustedActualPortions.map((portion) => portion.totals));

  return {
    selectedFoods,
    plannedPortions,
    plannedTotals,
    preparedResult,
    actualFood,
    aiImageMatches,
    aiImagePortions,
    combinedActualMatches,
    combinedActualPortions,
    adjustedActualPortions,
    actualTotals,
    actualIntake: Math.round(actualTotals.calories),
    actualGap: calculateNutritionGap(input.dietTarget, actualTotals)
  };
}

function buildAiImageFoodMatches(
  mealFoods: Record<MealAdjustmentKey, AiRecognizedMealFood[]>,
  customFoods: Food[]
): FoodTagMatch[] {
  return mealOrder.flatMap((slot) =>
    mealFoods[slot].flatMap((item) => {
      const food = getFoodByIdFromCatalog(item.foodId, customFoods);
      if (!food) return [];
      return [{
        input: item.candidateName,
        food,
        grams: item.grams,
        displayAmount: item.displayAmount,
        meal: item.meal,
        confidence: item.imageConfidence,
        needsDetails: true,
        detailHint: "图片识别结果，建议确认重量"
      }];
    })
  );
}

function buildAiImageFoodPortions(matches: FoodTagMatch[], startIndex: number): ActualFoodPortionWithMeta[] {
  return matches.map((match, index) => {
    const resolution = resolveFoodNutrition({
      food: match.food,
      grams: match.grams,
      rawText: match.input,
    });
    return {
      foodId: match.food.id,
      name: match.food.name,
      grams: match.grams,
      meal: match.meal && match.meal !== "unknown" ? match.meal : undefined,
      displayAmount: match.displayAmount,
      sourceIndex: startIndex + index,
      totals: resolution.totals,
    };
  });
}

function applyFoodTagOverrides(portions: FoodPortion[], matched: FoodTagMatch[], edits: Record<string, FoodTagOverride>): FoodPortion[] {
  return portions.flatMap((portion, index) => {
    const key = `${portion.foodId}-${index}`;
    const edit = edits[key];
    if (edit?.hidden) return [];
    if (!edit || (!edit.calories && !edit.grams && !edit.label && !edit.filling)) return [portion];

    const match = matched[index];
    const food = match ? resolveFoodByVariant(match.food, edit.filling) : undefined;
    const grams = edit.grams ?? Math.abs(portion.grams);
    const calculatedTotals = food ? calculateFoodTotals(food, grams) : portion.totals;
    const calories = edit.calories ?? calculatedTotals.calories;
    const scale = calculatedTotals.calories > 0 ? calories / calculatedTotals.calories : 1;

    return [{
      ...portion,
      name: edit.label?.trim() || portion.name,
      grams: portion.grams < 0 ? -grams : grams,
      displayAmount: edit.grams ? `${Math.round(grams)}g` : (portion as FoodPortion & { displayAmount?: string }).displayAmount,
      totals: {
        calories: Math.round(calories),
        proteinG: round1(calculatedTotals.proteinG * scale),
        fatG: round1(calculatedTotals.fatG * scale),
        carbsG: round1(calculatedTotals.carbsG * scale)
      }
    } as FoodPortion & { displayAmount?: string }];
  });
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}





