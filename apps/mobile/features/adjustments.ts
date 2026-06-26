import {
  calculateDynamicPlanAdjustment,
  createDefaultAdjustmentRules,
  foods,
  exercises,
  type DynamicAdjustmentSettings,
  type EnergyPlan,
  type Gender,
  type MealAdjustmentKey,
  type MuscleGroup,
  type NutritionTotals,
  type WorkoutPlan
} from "@fitness-calendar/shared";

export type DailyAdjustmentSummary = {
  title: string;
  reason: string;
  netDelta: number;
  foodDelta: number;
  trainingDelta: number;
  days: number;
  adjustedDailyCalories: number;
  adjustedMacros: NutritionTotals;
  ignoredRules: string[];
  warning?: string;
};

export function buildDailyAdjustmentSummary(input: {
  target: EnergyPlan;
  actualTotals: { calories: number };
  actualFoodIsDelta: boolean;
  mealDeltas?: Array<{ id: MealAdjustmentKey; calories: number }>;
  plannedTrainingCalories: number;
  actualTrainingCalories: number;
  plannedTrainingFocus?: MuscleGroup;
  gender: Gender;
  userProfile?: {
    age: number;
    heightCm: number;
    weightKg: number;
    trainingLevel: string;
  };
  goalPlan?: {
    targetWeightKg: number;
    targetDays: number;
    targetBodyShapeId: string;
  };
  fatigue?: number;
  settings: DynamicAdjustmentSettings;
}): DailyAdjustmentSummary {
  const result = calculateDynamicPlanAdjustment({
    userProfile: {
      gender: input.gender,
      age: input.userProfile?.age ?? 30,
      heightCm: input.userProfile?.heightCm ?? 170,
      weightKg: input.userProfile?.weightKg ?? 65,
      trainingLevel: input.userProfile?.trainingLevel ?? "intermediate"
    },
    goalPlan: {
      targetWeightKg: input.goalPlan?.targetWeightKg ?? 0,
      targetDays: input.goalPlan?.targetDays ?? 0,
      targetBodyShapeId: input.goalPlan?.targetBodyShapeId ?? ""
    },
    nutritionLedger: {
      target: input.target,
      actual: {
        calories: input.actualTotals.calories,
        proteinG: 0,
        fatG: 0,
        carbsG: 0
      },
      actualFoodIsDelta: input.actualFoodIsDelta,
      mealDeltas: input.mealDeltas ?? []
    },
    trainingLedger: {
      plannedCalories: input.plannedTrainingCalories,
      actualCalories: input.actualTrainingCalories,
      plannedFocus: input.plannedTrainingFocus,
      fatigue: input.fatigue
    },
    databases: {
      foodCount: foods.length,
      exerciseCount: exercises.length
    },
    adjustmentRules: createDefaultAdjustmentRules(input.settings, input.gender)
  });

  return {
    title: result.netDelta > 0 ? "后续轻微回收热量" : "后续可适当放宽",
    reason: buildAdjustmentReason(result.netDelta, result.foodDelta, result.trainingDelta, result.ignoredRules, result.recoveryHint),
    netDelta: result.netDelta,
    foodDelta: result.foodDelta,
    trainingDelta: result.trainingDelta,
    days: result.days,
    adjustedDailyCalories: result.adjustedDailyCalories,
    adjustedMacros: result.adjustedMacros,
    ignoredRules: result.ignoredRules,
    warning: result.adjustedDailyCalories === createDefaultAdjustmentRules(input.settings, input.gender).safetyFloorCalories ? "已触发最低安全摄入保护。" : undefined
  };
}

export function getNextWorkoutLabel(workout: WorkoutPlan | undefined): string {
  return workout?.title ?? "休息";
}

function buildAdjustmentReason(netDelta: number, foodDelta: number, trainingDelta: number, ignoredRules: string[], recoveryHint?: string): string {
  if (ignoredRules.length > 0 && netDelta === 0) {
    return "本次偏差命中了已关闭的动态范围，系统不会据此调整后续计划。";
  }

  const base = netDelta > 0
    ? "今天摄入偏高或训练消耗偏低，后续几天平均摊回。"
    : "今天执行情况优于目标，后续不需要额外压低摄入。";
  const parts = [
    foodDelta !== 0 ? `饮食 ${foodDelta > 0 ? "+" : ""}${foodDelta} kcal` : "",
    trainingDelta !== 0 ? `训练 ${trainingDelta > 0 ? "+" : ""}${trainingDelta} kcal` : ""
  ].filter(Boolean);
  const detail = parts.length > 0 ? `来源：${parts.join("，")}。` : "";

  return `${base}${detail}${recoveryHint ?? ""}`;
}
