import {
  calculateFoodTotals,
  exercises,
  getFoodCatalog,
  muscleGroupLabels,
  sumNutrition,
  type Food,
  type FoodPortion,
  type MuscleGroup,
  type NutritionTotals,
  type WorkoutPlan
} from "@fitness-calendar/shared";
import { parseFoodIntelligence, type FoodMealSlot, type FoodServingContext } from "./food-intelligence-engine";
import type { ActualTrainingStatus } from "../store/fitness-store";

export type FoodTextMatch = {
  input: string;
  food: Food;
  grams: number;
  quantity?: number;
  unit?: string;
  displayAmount?: string;
  isDelta: boolean;
  meal?: FoodMealSlot;
  confidence?: number;
  needsConfirmation?: boolean;
};

export type ParsedFoodText = {
  matched: FoodTextMatch[];
  unmatched: string[];
};

export type ActualFoodPortionResult = {
  parsed: ParsedFoodText;
  portions: FoodPortion[];
};

export type MealFood = {
  name: string;
  grams: number;
  calories: number;
  displayAmount?: string;
};

export type MealPlan = {
  id: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  foods: MealFood[];
  totals: NutritionTotals;
};

type MealId = MealPlan["id"];
type FoodPortionWithMeal = FoodPortion & { meal?: FoodMealSlot; displayAmount?: string };

export const muscleNameMap: Record<MuscleGroup, string> = muscleGroupLabels;
export const exerciseNameMap = Object.fromEntries(exercises.map((item) => [item.id, item.name])) as Record<string, string>;

const mealSlots: MealPlan[] = [
  emptyMeal("breakfast", "早餐"),
  emptyMeal("lunch", "午餐"),
  emptyMeal("dinner", "晚餐"),
  emptyMeal("snack", "加餐")
];

export function parseFoodText(text: string, customFoods: Food[] = [], servingContext: FoodServingContext = {}): ParsedFoodText {
  const result = parseFoodIntelligence(text, customFoods, servingContext);
  return {
    matched: result.items.map((item) => ({
      input: item.food.name,
      food: item.food,
      grams: item.grams,
      quantity: item.quantity,
      unit: item.unit,
      displayAmount: formatDisplayAmount(item.quantity, item.unit, item.grams),
      isDelta: item.isDelta,
      meal: item.meal,
      confidence: item.confidence,
      needsConfirmation: item.needsConfirmation
    })),
    unmatched: result.unmatched
  };
}

export function buildActualFoodPortionsFromText(text: string, customFoods: Food[] = [], servingContext: FoodServingContext = {}): ActualFoodPortionResult {
  const parsed = parseFoodText(text, customFoods, servingContext);
  const portions: FoodPortionWithMeal[] = parsed.matched.map((match) => {
    const multiplier = isNegativeDelta(text, match.input) ? -1 : 1;
    const grams = Math.max(1, match.grams) * multiplier;
    return {
      foodId: match.food.id,
      name: match.food.name,
      grams,
      meal: match.meal,
      displayAmount: match.displayAmount,
      totals: calculateFoodTotals(match.food, grams)
    };
  });

  return { parsed, portions };
}

export function buildMealPlan(portions: FoodPortion[], customFoods: Food[] = []): MealPlan[] {
  const meals = mealSlots.map((meal) => emptyMeal(meal.id, meal.name));
  const catalog = getFoodCatalog(customFoods);

  portions.forEach((portion, index) => {
    const food = catalog.find((item) => item.id === portion.foodId);
    const meal = meals[getMealIndex(food, index, (portion as FoodPortionWithMeal).meal)];
    meal.foods.push({
      name: portion.name,
      grams: Math.round(Math.abs(portion.grams)),
      calories: Math.round(portion.totals.calories),
      displayAmount: (portion as FoodPortionWithMeal).displayAmount
    });
  });

  return meals.map((meal) => ({
    ...meal,
    totals: sumNutrition(meal.foods.map((item) => ({
      calories: item.calories,
      proteinG: 0,
      fatG: 0,
      carbsG: 0
    })))
  }));
}

export function estimateTodayWorkoutCalories(workout: WorkoutPlan | undefined, bodyWeightKg: number): number {
  if (!workout) return 0;
  const total = workout.exercises.reduce((sum, item) => {
    const exercise = exercises.find((entry) => entry.id === item.exerciseId);
    const met = exercise?.met ?? 5;
    return sum + caloriesByMet(met, bodyWeightKg, item.minutes);
  }, 0);
  return Math.round(total);
}

export function estimateActualTrainingCalories(text: string, minutes: number, bodyWeightKg: number, fallbackWorkout?: WorkoutPlan): number {
  const normalized = normalize(text);
  const duration = minutes > 0 ? minutes : inferMinutes(normalized) || fallbackWorkout?.estimatedMinutes || 0;
  if (duration <= 0) return 0;

  const segments = extractTrainingSegments(normalized);
  if (segments.length === 0) {
    const met = fallbackWorkout ? averageWorkoutMet(fallbackWorkout) : 5;
    return Math.round(caloriesByMet(met, bodyWeightKg, duration));
  }

  const explicitMinutes = segments.reduce((sum, item) => sum + item.minutes, 0);
  const remainingMinutes = Math.max(0, duration - explicitMinutes);
  const defaultMinutes = remainingMinutes > 0 ? remainingMinutes / segments.length : 0;
  const total = segments.reduce((sum, item) => {
    const segmentMinutes = item.minutes > 0 ? item.minutes : defaultMinutes;
    return sum + caloriesByMet(item.exercise.met * item.intensityMultiplier, bodyWeightKg, segmentMinutes);
  }, 0);

  return Math.round(total);
}

export function getNextWorkoutAfterFeedback(queue: WorkoutPlan[], status: ActualTrainingStatus): WorkoutPlan | undefined {
  if (queue.length === 0) return undefined;
  if (status === "missed" || status === "pending") return queue[0];
  return queue[1] ?? queue[0];
}

function emptyMeal(id: MealId, name: string): MealPlan {
  return {
    id,
    name,
    foods: [],
    totals: { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 }
  };
}

function formatDisplayAmount(quantity: number | undefined, unit: string | undefined, grams: number): string | undefined {
  if (quantity === undefined || !unit) return undefined;
  const formattedQuantity = Number.isInteger(quantity) ? String(quantity) : String(Math.round(quantity * 10) / 10);
  return formattedQuantity + unit;
}

function getMealIndex(food: Food | undefined, index: number, parsedMeal?: FoodMealSlot): number {
  if (parsedMeal && parsedMeal !== "unknown") {
    return mealSlots.findIndex((meal) => meal.id === parsedMeal);
  }
  if (!food) return index % 4;
  if (food.category === "fruit" || food.category === "snack" || food.category === "drink" || food.category === "supplement") return 3;
  if (food.category === "protein" && index % 3 === 0) return 0;
  if (food.category === "fastfood" || food.category === "dish") return index % 2 === 0 ? 1 : 2;
  return index % 3;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[，。；、,.；;\n\r\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNegativeDelta(text: string, input: string): boolean {
  const normalized = normalize(text);
  const index = normalized.indexOf(normalize(input));
  const context = index >= 0
    ? normalized.slice(Math.max(0, index - 10), Math.min(normalized.length, index + input.length + 10))
    : normalized;
  return /少吃|少了|没吃|不吃|剩下|没喝|少喝/.test(context);
}

function inferMinutes(text: string): number {
  const match = text.match(/([0-9]+)\s*(分钟|分|min)/i);
  return match ? Number(match[1]) : 0;
}

function caloriesByMet(met: number, bodyWeightKg: number, minutes: number): number {
  return met * 3.5 * bodyWeightKg / 200 * minutes;
}

function extractTrainingSegments(text: string): Array<{ exercise: typeof exercises[number]; minutes: number; intensityMultiplier: number }> {
  const matches = exercises
    .flatMap((exercise) => [exercise.name, ...exercise.aliases].map((term) => ({
      exercise,
      term: normalize(term)
    })))
    .filter((item) => item.term.length > 0)
    .flatMap((item) => {
      const index = text.indexOf(item.term);
      return index >= 0 ? [{ ...item, index }] : [];
    })
    .sort((a, b) => {
      if (a.index !== b.index) return a.index - b.index;
      return b.term.length - a.term.length;
    });

  const segments: Array<{ exercise: typeof exercises[number]; minutes: number; intensityMultiplier: number }> = [];
  const usedRanges: Array<[number, number]> = [];
  for (const match of matches) {
    if (rangesOverlap(usedRanges, match.index, match.index + match.term.length)) continue;
    const context = text.slice(Math.max(0, match.index - 18), Math.min(text.length, match.index + match.term.length + 28));
    segments.push({
      exercise: match.exercise,
      minutes: inferMinutes(context),
      intensityMultiplier: inferIntensity(context)
    });
    usedRanges.push([match.index, match.index + match.term.length]);
  }
  return segments;
}

function inferIntensity(text: string): number {
  if (/大重量|高强度|力竭|冲刺|很累/.test(text)) return 1.18;
  if (/轻松|低强度|恢复|慢/.test(text)) return 0.82;
  return 1;
}

function averageWorkoutMet(workout: WorkoutPlan): number {
  if (workout.exercises.length === 0) return 5;
  const total = workout.exercises.reduce((sum, item) => {
    const exercise = exercises.find((entry) => entry.id === item.exerciseId);
    return sum + (exercise?.met ?? 5);
  }, 0);
  return total / workout.exercises.length;
}

function rangesOverlap(ranges: Array<[number, number]>, start: number, end: number): boolean {
  return ranges.some(([rangeStart, rangeEnd]) => start < rangeEnd && end > rangeStart);
}
