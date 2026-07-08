import {
  calculateFoodTotals,
  type Exercise,
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
import { resolveFoodNutrition } from "./food-nutrition-resolver";
import {
  parseFoodIntelligencePipeline,
  type FoodIntelligenceFallbackRequest,
  type FoodMealSlot,
  type FoodServingContext
} from "./food-intelligence-engine";
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
  needsDetails?: boolean;
  detailHint?: string;
};

export type ParsedFoodText = {
  matched: FoodTextMatch[];
  unmatched: string[];
  fallbackRequests: FoodIntelligenceFallbackRequest[];
};

export type ActualFoodPortionResult = {
  parsed: ParsedFoodText;
  portions: FoodPortion[];
};

export type TrainingCalorieProfile = {
  heightCm: number;
  weightKg: number;
};

export type TrainingTextExercise = Pick<Exercise, "id" | "name" | "aliases" | "primaryMuscleGroup" | "met">;

export type TrainingTextMatch = {
  input: string;
  exercise: TrainingTextExercise;
  minutes: number;
  calories: number;
  intensityMultiplier: number;
};

export type ParsedTrainingText = {
  matched: TrainingTextMatch[];
  unmatched: string[];
  totalMinutes: number;
  totalCalories: number;
};

export type MealFood = {
  foodId: string;
  name: string;
  grams: number;
  calories: number;
  totals: NutritionTotals;
  displayAmount?: string;
  sourceIndex?: number;
};

export type MealPlan = {
  id: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  foods: MealFood[];
  totals: NutritionTotals;
};

type MealId = MealPlan["id"];
type FoodPortionWithMeal = FoodPortion & { meal?: FoodMealSlot; displayAmount?: string; sourceIndex?: number };

export const muscleNameMap: Record<MuscleGroup, string> = muscleGroupLabels;
export const exerciseNameMap = Object.fromEntries(exercises.map((item) => [item.id, item.name])) as Record<string, string>;

const mealSlots: MealPlan[] = [
  emptyMeal("breakfast", "早餐"),
  emptyMeal("lunch", "午餐"),
  emptyMeal("dinner", "晚餐"),
  emptyMeal("snack", "加餐")
];

export function parseFoodText(text: string, customFoods: Food[] = [], servingContext: FoodServingContext = {}): ParsedFoodText {
  const result = parseFoodIntelligencePipeline(text, customFoods, servingContext);
  return {
    matched: result.items.map((item) => ({
      input: item.rawText || item.food.name,
      food: item.food,
      grams: item.grams,
      quantity: item.quantity,
      unit: item.unit,
      displayAmount: formatDisplayAmount(item.quantity, item.unit, item.grams),
      isDelta: item.isDelta,
      meal: item.meal,
      confidence: item.confidence,
      needsConfirmation: item.needsConfirmation,
      needsDetails: item.needsDetails,
      detailHint: item.detailHint
    })),
    unmatched: result.unmatched,
    fallbackRequests: result.fallbackRequests
  };
}

export function buildActualFoodPortionsFromText(text: string, customFoods: Food[] = [], servingContext: FoodServingContext = {}): ActualFoodPortionResult {
  const parsed = parseFoodText(text, customFoods, servingContext);
  const portions: FoodPortionWithMeal[] = parsed.matched.map((match, index) => {
    const multiplier = isNegativeDelta(text, match.input) ? -1 : 1;
    const grams = Math.max(1, match.grams) * multiplier;
    const resolution = resolveFoodNutrition({
      food: match.food,
      grams: Math.abs(grams),
      rawText: match.input,
      quantity: match.quantity,
      unit: match.unit,
    });
    return {
      foodId: match.food.id,
      name: match.food.name,
      grams,
      meal: match.meal && match.meal !== "unknown" ? match.meal : undefined,
      displayAmount: match.displayAmount,
      sourceIndex: index,
      totals: grams < 0
        ? calculateFoodTotals(resolution.resolvedFood, Math.abs(grams))
        : resolution.totals,
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
      foodId: portion.foodId,
      name: portion.name,
      grams: Math.round(Math.abs(portion.grams)),
      calories: Math.round(portion.totals.calories),
      totals: {
        calories: Math.round(portion.totals.calories),
        proteinG: portion.totals.proteinG,
        fatG: portion.totals.fatG,
        carbsG: portion.totals.carbsG
      },
      displayAmount: (portion as FoodPortionWithMeal).displayAmount,
      sourceIndex: (portion as FoodPortionWithMeal).sourceIndex ?? index
    });
  });

  return meals.map((meal) => ({
    ...meal,
    totals: sumNutrition(meal.foods.map((item) => item.totals))
  }));
}

export function estimateTodayWorkoutCalories(workout: WorkoutPlan | undefined, profile: TrainingCalorieProfile): number {
  if (!workout) return 0;
  const total = workout.exercises.reduce((sum, item) => {
    const exercise = exercises.find((entry) => entry.id === item.exerciseId);
    const met = exercise?.met ?? 5;
    return sum + caloriesByMet(met, profile, item.minutes);
  }, 0);
  return Math.round(total);
}

export function estimateActualTrainingCalories(text: string, minutes: number, profile: TrainingCalorieProfile, fallbackWorkout?: WorkoutPlan): number {
  return parseTrainingText(text, minutes, profile, fallbackWorkout).totalCalories;
}

export function estimateActualTrainingCaloriesWithProfile(text: string, minutes: number, profile: TrainingCalorieProfile, fallbackWorkout?: WorkoutPlan): number {
  return parseTrainingText(text, minutes, profile, fallbackWorkout).totalCalories;
}

export function parseTrainingText(
  text: string,
  minutes: number,
  profile: TrainingCalorieProfile,
  fallbackWorkout?: WorkoutPlan,
  extraExercises: TrainingTextExercise[] = []
): ParsedTrainingText {
  const normalized = normalize(text);
  const duration = minutes > 0 ? minutes : inferMinutes(normalized) || fallbackWorkout?.estimatedMinutes || 0;
  if (duration <= 0) {
    return {
      matched: [],
      unmatched: text.trim() ? [text.trim()] : [],
      totalMinutes: 0,
      totalCalories: 0
    };
  }

  const referenceExercises = mergeTrainingReferences(exercises, extraExercises);
  const segments = extractTrainingSegments(normalized, referenceExercises);
  if (segments.length === 0) {
    const met = fallbackWorkout ? averageWorkoutMet(fallbackWorkout) : 5;
    const totalCalories = Math.round(caloriesByMet(met, profile, duration));
    return {
      matched: text.trim()
        ? [{
            input: text.trim(),
            exercise: buildFallbackExercise(fallbackWorkout, met),
            minutes: duration,
            calories: totalCalories,
            intensityMultiplier: 1
          }]
        : [],
      unmatched: text.trim() ? [text.trim()] : [],
      totalMinutes: duration,
      totalCalories
    };
  }

  const explicitMinutes = segments.reduce((sum, item) => sum + item.minutes, 0);
  const remainingMinutes = Math.max(0, duration - explicitMinutes);
  const defaultMinutes = remainingMinutes > 0 ? remainingMinutes / segments.length : 0;
  const matched = segments.map((item) => {
    const segmentMinutes = item.minutes > 0 ? item.minutes : defaultMinutes;
    const calories = Math.round(caloriesByMet(item.exercise.met * item.intensityMultiplier, profile, segmentMinutes));
    return {
      input: item.term,
      exercise: item.exercise,
      minutes: Math.round(segmentMinutes),
      calories,
      intensityMultiplier: item.intensityMultiplier
    };
  });
  const totalCalories = matched.reduce((sum, item) => sum + item.calories, 0);

  return {
    matched,
    unmatched: extractUnmatchedTrainingText(normalized, segments.map((item) => [item.index, item.index + item.term.length])),
    totalMinutes: matched.reduce((sum, item) => sum + item.minutes, 0),
    totalCalories
  };
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

function caloriesByMet(met: number, profile: TrainingCalorieProfile, minutes: number): number {
  return met * 3.5 * profile.weightKg * getBodySizeFactor(profile) / 200 * minutes;
}

function extractTrainingSegments(text: string, referenceExercises: TrainingTextExercise[]): Array<{ exercise: TrainingTextExercise; term: string; index: number; minutes: number; intensityMultiplier: number }> {
  const matches = referenceExercises
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

  const segments: Array<{ exercise: TrainingTextExercise; term: string; index: number; minutes: number; intensityMultiplier: number }> = [];
  const usedRanges: Array<[number, number]> = [];
  for (const match of matches) {
    if (rangesOverlap(usedRanges, match.index, match.index + match.term.length)) continue;
    const context = text.slice(Math.max(0, match.index - 18), Math.min(text.length, match.index + match.term.length + 28));
    segments.push({
      exercise: match.exercise,
      term: match.term,
      index: match.index,
      minutes: inferSegmentMinutes(text, match.index, match.term.length),
      intensityMultiplier: inferIntensity(context)
    });
    usedRanges.push([match.index, match.index + match.term.length]);
  }
  return segments;
}

function mergeTrainingReferences(baseExercises: TrainingTextExercise[], extraExercises: TrainingTextExercise[]): TrainingTextExercise[] {
  const byName = new Map<string, TrainingTextExercise>();
  [...baseExercises, ...extraExercises, ...genericTrainingExercises].forEach((item) => {
    const key = normalize(item.name);
    if (!key || byName.has(key)) return;
    byName.set(key, item);
  });
  return [...byName.values()];
}

const genericTrainingExercises: TrainingTextExercise[] = [
  { id: "generic-stretch", name: "拉伸", aliases: ["拉伸", "放松", "拉伸放松"], primaryMuscleGroup: "core", met: 2.5 },
  { id: "generic-warmup", name: "热身", aliases: ["热身", "动态热身"], primaryMuscleGroup: "core", met: 3 }
];

function inferSegmentMinutes(text: string, index: number, termLength: number): number {
  const after = text.slice(index + termLength, Math.min(text.length, index + termLength + 24)).split(/[，。；、,.]/)[0] ?? "";
  const afterAmountMinutes = inferFirstWorkAmountMinutes(after);
  if (afterAmountMinutes > 0) return afterAmountMinutes;
  const before = (text.slice(Math.max(0, index - 16), index).split(/[，。；、,.]/).pop() ?? "");
  return inferFirstWorkAmountMinutes(before);
}

function inferSetMinutes(text: string): number {
  const match = text.match(/([0-9]+)\s*(组|set|sets)/i);
  if (!match) return 0;
  return Math.max(3, Math.min(45, Number(match[1]) * 3));
}

function inferFirstWorkAmountMinutes(text: string): number {
  const minuteMatch = text.match(/([0-9]+)\s*(分钟|分|min)/i);
  const setMatch = text.match(/([0-9]+)\s*(组|set|sets)/i);
  if (minuteMatch && (!setMatch || minuteMatch.index! <= setMatch.index!)) return Number(minuteMatch[1]);
  if (setMatch) return Math.max(3, Math.min(45, Number(setMatch[1]) * 3));
  return 0;
}

function buildFallbackExercise(fallbackWorkout: WorkoutPlan | undefined, met: number): TrainingTextExercise {
  const firstExercise = fallbackWorkout?.exercises[0]
    ? exercises.find((entry) => entry.id === fallbackWorkout.exercises[0].exerciseId)
    : undefined;
  return firstExercise ?? {
    id: "unknown-training",
    name: "训练",
    aliases: [],
    primaryMuscleGroup: "core",
    met
  };
}

function extractUnmatchedTrainingText(text: string, matchedRanges: Array<[number, number]>): string[] {
  if (!text.trim()) return [];
  let remainder = "";
  for (let index = 0; index < text.length; index += 1) {
    const inMatch = matchedRanges.some(([start, end]) => index >= start && index < end);
    remainder += inMatch ? " " : text[index];
  }
  return remainder
    .replace(/[0-9]+\s*(分钟|分|min|kg|公斤|千克|组|次)/gi, " ")
    .replace(/(今天|最后|然后|接着|另外|做了|练了|训练|实际|大概|左右)/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
    .filter((item) => !/^[0-9]+$/.test(item))
    .slice(0, 6);
}

function getBodySizeFactor(profile: TrainingCalorieProfile): number {
  const heightM = Math.max(1.2, profile.heightCm / 100);
  const bmi = profile.weightKg / (heightM * heightM);
  return Math.max(0.9, Math.min(1.12, Math.sqrt(bmi / 22)));
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
