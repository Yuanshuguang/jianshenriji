import type { EnergyPlan, Gender, MuscleGroup, NutritionTotals } from "./index";

export type MealAdjustmentKey = "breakfast" | "lunch" | "dinner" | "snack";
export type GoalType = "fat_loss" | "maintenance" | "muscle_gain";
export type NutritionAdjustmentKey = "calories" | "proteinG" | "fatG" | "carbsG";
export type TrainingAdjustmentKey = "calories" | "schedule" | "fatigue";
export type DynamicAdjustmentMode = "repay-by-days" | "extend-deadline" | "hybrid";

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

export type AtonementPreference = {
  adjustmentMode: DynamicAdjustmentMode;
  repayDays: number;
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
  maxDailyRepayCalories: number;
  maxDailyRepayRatio: number;
  hybridRepayRatio: number;
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
  atonementPreference?: AtonementPreference;
};

export type DynamicPlanEngineResult = {
  foodDelta: number;
  trainingDelta: number;
  netDelta: number;
  days: number;
  adjustmentMode: DynamicAdjustmentMode;
  dailyRepayCalories: number;
  deadlineExtensionDays: number;
  unresolvedCalories: number;
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
    maxDailyRepayCalories: 400,
    maxDailyRepayRatio: 0.2,
    hybridRepayRatio: 0.5,
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
    ? computeFoodDelta(settings.meals, nutritionLedger.mealDeltas, totalFoodDelta, ignoredRules)
    : 0;

  if (!settings.nutrition.calories) ignoredRules.push("nutrition:calories");

  const trainingFocusEnabled = !trainingLedger.plannedFocus || settings.muscles[trainingLedger.plannedFocus];
  const trainingDelta = settings.training.calories && trainingFocusEnabled
    ? Math.round(trainingLedger.plannedCalories - trainingLedger.actualCalories)
    : 0;

  if (!settings.training.calories) ignoredRules.push("training:calories");
  if (!trainingFocusEnabled && trainingLedger.plannedFocus) ignoredRules.push(`muscle:${trainingLedger.plannedFocus}`);

  const trainingWeight = computeTrainingWeight(adjustmentRules, trainingLedger, nutritionLedger.target);
  const netDelta = foodDelta + Math.round(trainingDelta * trainingWeight);
  const highFatigue = settings.training.fatigue && (trainingLedger.fatigue ?? 0) >= adjustmentRules.fatigueRecoveryThreshold;
  const atonement = buildAtonementPlan({
    netDelta,
    target: nutritionLedger.target,
    rules: adjustmentRules,
    preference: input.atonementPreference,
    forceExtendDeadline: highFatigue || hasRedFlag(input, adjustmentRules)
  });
  const adjustedDailyCalories = Math.max(
    adjustmentRules.safetyFloorCalories,
    Math.round(nutritionLedger.target.calories - atonement.dailyRepayCalories)
  );
  const adjustedMacros = adjustMacros(nutritionLedger.target, adjustedDailyCalories, trainingLedger, adjustmentRules);
  const recoveryHint = highFatigue
    ? netDelta > 0
      ? "疲劳偏高，今天的差额优先顺延，不建议继续压低摄入或加练。"
      : "疲劳偏高，后续训练建议降低强度或安排恢复日。"
    : undefined;

  if (!settings.training.fatigue) ignoredRules.push("training:fatigue");

  return {
    foodDelta,
    trainingDelta,
    netDelta,
    days: atonement.days,
    adjustmentMode: atonement.adjustmentMode,
    dailyRepayCalories: atonement.dailyRepayCalories,
    deadlineExtensionDays: atonement.deadlineExtensionDays,
    unresolvedCalories: atonement.unresolvedCalories,
    adjustedDailyCalories,
    adjustedMacros,
    ignoredRules,
    recoveryHint
  };
}

export function adjustMacros(target: NutritionTotals, calories: number, training: TrainingLedgerEntry, rules: AdjustmentRules): NutritionTotals {
  // 蛋白优先，但不能把低热量日挤成低脂、极高蛋白方案。
  const minFatG = 35;
  const minCarbsG = 60;
  const proteinByTarget = rules.settings.nutrition.proteinG
    ? Math.max(target.proteinG, Math.round((calories * 0.25) / 4))
    : target.proteinG;
  const maxProteinByShare = Math.floor((calories * 0.35) / 4);
  const maxProteinByFloor = Math.floor((calories - minFatG * 9 - minCarbsG * 4) / 4);
  const proteinG = Math.max(0, Math.min(proteinByTarget, maxProteinByShare, maxProteinByFloor));

  const trainingMultiplier = training.plannedCalories > 0 ? rules.trainingDayCarbMultiplier : rules.restDayCarbMultiplier;
  const scaledFatG = Math.max(minFatG, target.fatG * (calories / Math.max(1, target.calories)));
  const fatBase = training.plannedCalories > 0
    ? Math.max(minFatG, scaledFatG / trainingMultiplier)
    : Math.max(minFatG, scaledFatG * rules.restDayCarbMultiplier);
  const maxFatG = Math.floor((calories - proteinG * 4 - minCarbsG * 4) / 9);
  const macroPair = chooseFatCarbPair({
    calories,
    proteinG,
    desiredFatG: rules.settings.nutrition.fatG ? Math.round(fatBase) : target.fatG,
    minFatG: rules.settings.nutrition.fatG ? minFatG : target.fatG,
    maxFatG: rules.settings.nutrition.fatG ? maxFatG : target.fatG,
    minCarbsG
  });
  const fatG = macroPair.fatG;
  const finalCarbsG = macroPair.carbsG;

  return {
    calories,
    proteinG,
    fatG,
    carbsG: finalCarbsG
  };
}

function chooseFatCarbPair(input: {
  calories: number;
  proteinG: number;
  desiredFatG: number;
  minFatG: number;
  maxFatG: number;
  minCarbsG: number;
}): { fatG: number; carbsG: number } {
  const minFatG = Math.max(0, Math.min(input.minFatG, input.maxFatG));
  const maxFatG = Math.max(minFatG, input.maxFatG);
  let best = {
    fatG: minFatG,
    carbsG: input.minCarbsG,
    drift: Number.POSITIVE_INFINITY,
    fatDistance: Number.POSITIVE_INFINITY
  };

  for (let fatG = minFatG; fatG <= maxFatG; fatG += 1) {
    const carbsG = Math.max(input.minCarbsG, Math.round((input.calories - input.proteinG * 4 - fatG * 9) / 4));
    const macroCalories = input.proteinG * 4 + fatG * 9 + carbsG * 4;
    const drift = Math.abs(macroCalories - input.calories);
    const fatDistance = Math.abs(fatG - input.desiredFatG);
    if (drift < best.drift || (drift === best.drift && fatDistance < best.fatDistance)) {
      best = { fatG, carbsG, drift, fatDistance };
    }
  }

  return {
    fatG: best.fatG,
    carbsG: best.carbsG
  };
}

function buildAtonementPlan(input: {
  netDelta: number;
  target: EnergyPlan;
  rules: AdjustmentRules;
  preference?: AtonementPreference;
  forceExtendDeadline?: boolean;
}): {
  adjustmentMode: DynamicAdjustmentMode;
  days: number;
  dailyRepayCalories: number;
  deadlineExtensionDays: number;
  unresolvedCalories: number;
} {
  const { netDelta, target, rules } = input;
  const requestedMode = input.preference?.adjustmentMode ?? "hybrid";
  const adjustmentMode = input.forceExtendDeadline && netDelta > 0 ? "extend-deadline" : requestedMode;
  const preferredDays = clampFinite(Math.round(input.preference?.repayDays ?? rules.minAdjustmentDays), 1, 30, rules.minAdjustmentDays);
  const defaultDays = clamp(
    Math.ceil(Math.abs(netDelta) / rules.caloriesPerAdjustmentDay) || rules.minAdjustmentDays,
    rules.minAdjustmentDays,
    rules.maxAdjustmentDays
  );

  if (netDelta <= 0) {
    return {
      adjustmentMode,
      days: 0,
      dailyRepayCalories: 0,
      deadlineExtensionDays: 0,
      unresolvedCalories: 0
    };
  }

  const safeDailyCap = Math.max(
    0,
    Math.min(
      rules.maxDailyRepayCalories,
      Math.floor(target.calories * rules.maxDailyRepayRatio),
      target.calories - rules.safetyFloorCalories
    )
  );
  const dailyDeficit = Math.round(target.dailyDeficit || 0);

  if (dailyDeficit <= 0) {
    // 维持期和增肌期没有“目标截止日赤字”，多吃后只回到原计划观察趋势。
    return {
      adjustmentMode,
      days: 0,
      dailyRepayCalories: 0,
      deadlineExtensionDays: 0,
      unresolvedCalories: netDelta
    };
  }

  if (adjustmentMode === "extend-deadline") {
    return {
      adjustmentMode,
      days: 0,
      dailyRepayCalories: 0,
      deadlineExtensionDays: Math.ceil(netDelta / dailyDeficit),
      unresolvedCalories: netDelta
    };
  }

  const days = adjustmentMode === "repay-by-days" || adjustmentMode === "hybrid"
    ? preferredDays
    : defaultDays;
  const targetRepayCalories = adjustmentMode === "hybrid"
    ? Math.round(netDelta * resolveHybridRatio(netDelta, rules.hybridRepayRatio))
    : netDelta;
  const dailyRepayCalories = Math.min(safeDailyCap, Math.ceil(targetRepayCalories / Math.max(1, days)));
  const repaidCalories = dailyRepayCalories * days;
  const unresolvedCalories = Math.max(0, netDelta - repaidCalories);

  return {
    adjustmentMode,
    days,
    dailyRepayCalories,
    deadlineExtensionDays: unresolvedCalories > 0 ? Math.ceil(unresolvedCalories / dailyDeficit) : 0,
    unresolvedCalories
  };
}
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampFinite(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return clamp(value, min, max);
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

function computeFoodDelta(
  mealSettings: DynamicAdjustmentSettings["meals"],
  mealDeltas: Array<{ id: MealAdjustmentKey; calories: number }>,
  totalFoodDelta: number,
  ignoredRules: string[]
): number {
  let enabledSum = 0;
  let hasDisabled = false;
  for (const meal of mealDeltas) {
    if (!mealSettings[meal.id]) {
      ignoredRules.push(`meal:${meal.id}`);
      hasDisabled = true;
      continue;
    }
    enabledSum += meal.calories;
  }
  if (!hasDisabled && mealDeltas.length > 0) {
    const mismatch = Math.abs(enabledSum - totalFoodDelta);
    if (mismatch > Math.max(75, Math.abs(totalFoodDelta) * 0.15)) {
      ignoredRules.push("meal-delta:incomplete");
      return totalFoodDelta;
    }
  }
  if (hasDisabled || mealDeltas.length > 0) {
    return Math.round(enabledSum);
  }
  return totalFoodDelta;
}


function computeTrainingWeight(rules: AdjustmentRules, training: TrainingLedgerEntry, target: EnergyPlan): number {
  if (!rules.settings.training.calories) return 0;
  const fatigue = training.fatigue ?? 0;
  // only fat-loss low-fatigue allow partial
  const diff = (target.dailyDeficit ?? 0);
  if (diff <= 0 && training.plannedCalories > training.actualCalories) {
    // maintenance or muscle gain: training deficit doesnt reduce food
    return 0;
  }
  if (fatigue >= rules.fatigueRecoveryThreshold) return 0;
  return 0.5;
}
function hasRedFlag(input: DynamicPlanEngineInput, rules: AdjustmentRules): boolean {
  const nutrition = input.nutritionLedger;
  const actual = nutrition.actualFoodIsDelta
    ? nutrition.target.calories + nutrition.actual.calories
    : nutrition.actual.calories;
  if (actual < rules.safetyFloorCalories * 0.7) return true;
  const weightDiff = input.userProfile.weightKg - input.goalPlan.targetWeightKg;
  if (weightDiff > 0 && (weightDiff / Math.max(1, input.goalPlan.targetDays)) > 0.15) return true;
  return false;
}
function resolveHybridRatio(netDelta: number, baseRatio: number): number {
  if (netDelta <= 150) return 0.15;
  if (netDelta <= 500) return 0.25;
  if (netDelta <= 1200) return baseRatio;
  if (netDelta <= 2500) return 0.35;
  return 0.2;
}
