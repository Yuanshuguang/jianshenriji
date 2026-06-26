import type { EnergyPlan, Gender, MuscleGroup, NutritionTotals } from "./index";

export type MealAdjustmentKey = "breakfast" | "lunch" | "dinner" | "snack";
export type NutritionAdjustmentKey = "calories" | "proteinG" | "fatG" | "carbsG";
export type TrainingAdjustmentKey = "calories" | "schedule" | "fatigue";

export type DynamicAdjustmentSettings = {
  nutrition: Record<NutritionAdjustmentKey, boolean>;
  meals: Record<MealAdjustmentKey, boolean>;
  training: Record<TrainingAdjustmentKey, boolean>;
  muscles: Record<MuscleGroup, boolean>;
};

export type UserProfileSnapshot = {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  trainingLevel: string;
};

export type GoalPlanSnapshot = {
  targetWeightKg: number;
  targetDays: number;
  targetBodyShapeId: string;
};

export type NutritionLedgerEntry = {
  target: EnergyPlan;
  actual: NutritionTotals;
  actualFoodIsDelta: boolean;
  mealDeltas: Array<{ id: MealAdjustmentKey; calories: number }>;
};

export type TrainingLedgerEntry = {
  plannedCalories: number;
  actualCalories: number;
  plannedFocus?: MuscleGroup;
  fatigue?: number;
};

export type DynamicPlanDatabases = {
  foodCount: number;
  exerciseCount: number;
};

export type AdjustmentRules = {
  settings: DynamicAdjustmentSettings;
  safetyFloorCalories: number;
  minAdjustmentDays: number;
  maxAdjustmentDays: number;
  caloriesPerAdjustmentDay: number;
  trainingDayCarbMultiplier: number;
  restDayCarbMultiplier: number;
  fatigueRecoveryThreshold: number;
};

export type DynamicPlanEngineInput = {
  userProfile: UserProfileSnapshot;
  goalPlan: GoalPlanSnapshot;
  nutritionLedger: NutritionLedgerEntry;
  trainingLedger: TrainingLedgerEntry;
  databases: DynamicPlanDatabases;
  adjustmentRules: AdjustmentRules;
};

export type DynamicPlanEngineResult = {
  foodDelta: number;
  trainingDelta: number;
  netDelta: number;
  days: number;
  adjustedDailyCalories: number;
  adjustedMacros: NutritionTotals;
  ignoredRules: string[];
  recoveryHint?: string;
};

export function createDefaultAdjustmentRules(settings: DynamicAdjustmentSettings, gender: Gender): AdjustmentRules {
  return {
    settings,
    safetyFloorCalories: gender === "female" ? 1200 : 1500,
    minAdjustmentDays: 3,
    maxAdjustmentDays: 7,
    caloriesPerAdjustmentDay: 180,
    trainingDayCarbMultiplier: 1.12,
    restDayCarbMultiplier: 0.88,
    fatigueRecoveryThreshold: 4
  };
}

export function calculateDynamicPlanAdjustment(input: DynamicPlanEngineInput): DynamicPlanEngineResult {
  const { nutritionLedger, trainingLedger, adjustmentRules } = input;
  const ignoredRules: string[] = [];
  const settings = adjustmentRules.settings;
  const actualIntake = nutritionLedger.actualFoodIsDelta
    ? nutritionLedger.target.calories + nutritionLedger.actual.calories
    : nutritionLedger.actual.calories;
  const totalFoodDelta = Math.round(actualIntake - nutritionLedger.target.calories);
  const foodDelta = settings.nutrition.calories
    ? Math.round(nutritionLedger.mealDeltas.reduce((sum, meal) => {
        if (!settings.meals[meal.id]) {
          ignoredRules.push(`meal:${meal.id}`);
          return sum;
        }
        return sum + meal.calories;
      }, 0) || totalFoodDelta)
    : 0;

  if (!settings.nutrition.calories) ignoredRules.push("nutrition:calories");

  const trainingFocusEnabled = !trainingLedger.plannedFocus || settings.muscles[trainingLedger.plannedFocus];
  const trainingDelta = settings.training.calories && trainingFocusEnabled
    ? Math.round(trainingLedger.plannedCalories - trainingLedger.actualCalories)
    : 0;

  if (!settings.training.calories) ignoredRules.push("training:calories");
  if (!trainingFocusEnabled && trainingLedger.plannedFocus) ignoredRules.push(`muscle:${trainingLedger.plannedFocus}`);

  const netDelta = foodDelta + trainingDelta;
  const days = clamp(
    Math.ceil(Math.abs(netDelta) / adjustmentRules.caloriesPerAdjustmentDay) || adjustmentRules.minAdjustmentDays,
    adjustmentRules.minAdjustmentDays,
    adjustmentRules.maxAdjustmentDays
  );
  const adjustedDailyCalories = Math.max(
    adjustmentRules.safetyFloorCalories,
    Math.round(nutritionLedger.target.calories - netDelta / days)
  );
  const adjustedMacros = adjustMacros(nutritionLedger.target, adjustedDailyCalories, trainingLedger, adjustmentRules);
  const recoveryHint = settings.training.fatigue && (trainingLedger.fatigue ?? 0) >= adjustmentRules.fatigueRecoveryThreshold
    ? "疲劳偏高，后续训练建议降低强度或安排恢复日。"
    : undefined;

  if (!settings.training.fatigue) ignoredRules.push("training:fatigue");

  return {
    foodDelta,
    trainingDelta,
    netDelta,
    days,
    adjustedDailyCalories,
    adjustedMacros,
    ignoredRules,
    recoveryHint
  };
}

function adjustMacros(target: NutritionTotals, calories: number, training: TrainingLedgerEntry, rules: AdjustmentRules): NutritionTotals {
  const proteinG = target.proteinG;
  const fatG = Math.max(35, Math.round(target.fatG * (calories / Math.max(1, target.calories))));
  const trainingMultiplier = training.plannedCalories > 0 ? rules.trainingDayCarbMultiplier : rules.restDayCarbMultiplier;
  const carbsFromCalories = Math.max(60, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  const carbsG = Math.max(60, Math.round(carbsFromCalories * trainingMultiplier));

  return {
    calories,
    proteinG,
    fatG,
    carbsG
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 从总热量目标计算各餐默认预算
 */
export function calculateDefaultMealBudgets(totalCalories: number): Record<"breakfast" | "lunch" | "dinner" | "snack", number> {
  return {
    breakfast: Math.round(totalCalories * 0.25),
    lunch: Math.round(totalCalories * 0.35),
    dinner: Math.round(totalCalories * 0.30),
    snack: Math.round(totalCalories * 0.10)
  };
}
