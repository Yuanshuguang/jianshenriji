import {
  calculateDynamicPlanAdjustment,
  createDefaultAdjustmentRules,
  foods,
  exercises,
  type AtonementPreference,
  type CalorieDebtSnapshot,
  type DynamicAdjustmentSettings,
  type DynamicAdjustmentMode,
  type GoalType,
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
  goalType: GoalType;
  deviationLevel: "none" | "mild" | "moderate" | "significant";
  netDelta: number;
  foodDelta: number;
  trainingDelta: number;
  mealDeltas: Array<{ id: MealAdjustmentKey; calories: number }>;
  userRepayDays: number;
  systemExtensionDays: number;
  totalAdjustmentDays: number;
  days: number;
  adjustmentMode: DynamicAdjustmentMode;
  dailyRepayCalories: number;
  deadlineExtensionDays: number;
  unresolvedCalories: number;
  adjustedDailyCalories: number;
  adjustedMacros: NutritionTotals;
  ignoredRules: string[];
  warning?: string;
  dietQualityWarnings: string[];
};

export function buildDailyAdjustmentSummary(input: {
  target: EnergyPlan;
  actualTotals: NutritionTotals;
  actualFoodIsDelta: boolean;
  mealDeltas?: Array<{ id: MealAdjustmentKey; calories: number }>;
  plannedTrainingCalories: number;
  actualTrainingCalories: number;
  plannedTrainingFocus?: MuscleGroup;
  gender: Gender;
  userProfile?: { age: number; heightCm: number; weightKg: number; trainingLevel: string };
  goalPlan?: { targetWeightKg: number; targetDays: number; targetBodyShapeId: string };
  fatigue?: number;
  settings: DynamicAdjustmentSettings;
  atonementPreference?: AtonementPreference;
  goalType?: GoalType;
}): DailyAdjustmentSummary {
  const goalType = resolveGoalType(input);
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
      actual: { calories: input.actualTotals.calories, proteinG: input.actualTotals.proteinG, fatG: input.actualTotals.fatG, carbsG: input.actualTotals.carbsG },
      actualFoodIsDelta: input.actualFoodIsDelta,
      mealDeltas: input.mealDeltas ?? []
    },
    trainingLedger: {
      plannedCalories: input.plannedTrainingCalories,
      actualCalories: input.actualTrainingCalories,
      plannedFocus: input.plannedTrainingFocus,
      fatigue: input.fatigue
    },
    databases: { foodCount: foods.length, exerciseCount: exercises.length },
    adjustmentRules: createDefaultAdjustmentRules(input.settings, input.gender),
    atonementPreference: input.atonementPreference
  });

  return {
    deviationLevel: resolveDeviationLevel(result.netDelta),
    title: buildAdjustmentTitle(result.adjustmentMode, result.netDelta, goalType),
    reason: buildAdjustmentReason(result, result.recoveryHint),
    goalType,
    netDelta: result.netDelta,
    foodDelta: result.foodDelta,
    trainingDelta: result.trainingDelta,
    mealDeltas: input.mealDeltas ?? [],
    userRepayDays: result.adjustmentMode === "extend-deadline" ? 0 : result.days,
    systemExtensionDays: result.deadlineExtensionDays,
    totalAdjustmentDays: result.adjustmentMode === "extend-deadline" ? result.deadlineExtensionDays : result.days + result.deadlineExtensionDays,
    days: result.days,
    adjustmentMode: result.adjustmentMode,
    dailyRepayCalories: result.dailyRepayCalories,
    deadlineExtensionDays: result.deadlineExtensionDays,
    unresolvedCalories: result.unresolvedCalories,
    adjustedDailyCalories: result.adjustedDailyCalories,
    adjustedMacros: result.adjustedMacros,
    ignoredRules: result.ignoredRules,
    warning: result.adjustedDailyCalories === createDefaultAdjustmentRules(input.settings, input.gender).safetyFloorCalories ? "已触发最低安全摄入保护。" : undefined,
    dietQualityWarnings: [],
  };
}

export function buildDebtSnapshot(summary: DailyAdjustmentSummary): CalorieDebtSnapshot {
  const sourceBreakdown: CalorieDebtSnapshot["sourceBreakdown"] = summary.mealDeltas
    .filter((item) => item.calories !== 0)
    .map((item) => ({ key: item.id, label: mealLabel(item.id), calories: item.calories }));
  if (summary.trainingDelta !== 0) {
    sourceBreakdown.push({ key: "training", label: "训练", calories: summary.trainingDelta });
  }
  if (sourceBreakdown.length === 0 && summary.netDelta !== 0) {
    sourceBreakdown.push({ key: "other", label: "未细分差额", calories: summary.netDelta });
  }
  return { foodDelta: summary.foodDelta, trainingDelta: summary.trainingDelta, netDelta: summary.netDelta, sourceBreakdown };
}

export function getNextWorkoutLabel(workout: WorkoutPlan | undefined): string {
  return workout?.title ?? "休息";
}

function resolveDeviationLevel(netDelta: number): "none" | "mild" | "moderate" | "significant" {
  const abs = Math.abs(netDelta);
  if (abs <= 150) return "none";
  if (abs <= 500) return "mild";
  if (abs <= 1200) return "moderate";
  return "significant";
}

function resolveGoalType(input: { goalPlan?: { targetWeightKg: number }; userProfile?: { weightKg: number } }): GoalType {
  const plan = input.goalPlan;
  const profile = input.userProfile;
  if (!plan || !profile) return "maintenance";
  const diff = profile.weightKg - plan.targetWeightKg;
  if (diff > 0.5) return "fat_loss";
  if (diff < -0.5) return "muscle_gain";
  return "maintenance";
}

function buildAdjustmentTitle(mode: DynamicAdjustmentMode, netDelta: number, goalType: GoalType): string {
  const abs = Math.abs(netDelta);
  if (abs <= 150) {
    if (goalType === "muscle_gain") return "增肌观察";
    return "执行良好";
  }
  if (netDelta <= 0) {
    if (goalType === "muscle_gain") return "增肌观察";
    if (goalType === "maintenance") return "趋势记录";
    return "低于目标";
  }
  if (goalType !== "fat_loss") {
    if (goalType === "muscle_gain") return "热量盈余";
    return "偏离维持区";
  }
  if (mode === "extend-deadline") return "系统延长";
  if (mode === "repay-by-days") return "用户自定义";
  return "混合调整";
}

function buildAdjustmentReason(result: {
  netDelta: number;
  foodDelta: number;
  trainingDelta: number;
  ignoredRules: string[];
  adjustmentMode: DynamicAdjustmentMode;
  days: number;
  dailyRepayCalories: number;
  deadlineExtensionDays: number;
  unresolvedCalories: number;
}, recoveryHint?: string): string {
  const { netDelta, foodDelta, trainingDelta, ignoredRules, adjustmentMode, days, dailyRepayCalories, deadlineExtensionDays } = result;
  if (Math.abs(netDelta) <= 150) return "今日执行偏差较小，继续按原目标进行即可。";
  if (ignoredRules.length > 0 && netDelta === 0) return "本次偏差命中了已关闭的动态范围，系统不会据此调整后续计划。";
  const sourceParts = [ foodDelta !== 0 ? "饮食 " + (foodDelta > 0 ? "+" : "") + foodDelta + " kcal" : "", trainingDelta !== 0 ? "训练 " + (trainingDelta > 0 ? "+" : "") + trainingDelta + " kcal" : "" ].filter(Boolean);
  const sourceText = sourceParts.length > 0 ? " · " + sourceParts.join(" · ") : "";
  if (netDelta < 0) return "净差 " + netDelta + " kcal" + sourceText;
  if (netDelta === 0) return "净差 0 kcal" + sourceText;
  if (adjustmentMode === "extend-deadline") return "净差 +" + netDelta + " kcal" + sourceText + " · 延长 " + deadlineExtensionDays + " 天";
  if (adjustmentMode === "repay-by-days") return "净差 +" + netDelta + " kcal" + sourceText + " · 自定义 " + days + " 天 · 每天 " + dailyRepayCalories + " kcal";
  return "净差 +" + netDelta + " kcal" + sourceText + " · 自定义 " + days + " 天 + 延长 " + deadlineExtensionDays + " 天";
}

function mealLabel(meal: MealAdjustmentKey): string {
  switch (meal) {
    case "breakfast": return "早餐";
    case "lunch": return "午餐";
    case "dinner": return "晚餐";
    case "snack": return "加餐";
  }
}
