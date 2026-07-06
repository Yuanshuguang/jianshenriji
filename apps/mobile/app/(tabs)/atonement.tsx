import {
  calculateDefaultMealBudgets,
  calculateDietPlanMacroTargets,
  exercises,
  resolveDietPlanDay,
  resolveTrainingDietRecommendation,
  sumNutrition,
  type DailyLogEntry,
  type DietPlanCycleSelection,
  type DynamicAdjustmentMode,
  type EnergyPlan,
} from "@fitness-calendar/shared";
import { useMemo } from "react";
import { Pressable, TextInput, View } from "react-native";
import { CalorieLedgerPanel } from "../../components/CalorieLedgerPanel";
import {
  Badge,
  GlassTile,
  Screen,
  Text as BentoText,
  type SemanticColor,
  useBentoTheme,
} from "../../components/bento";
import { buildDailyAdjustmentSummary, buildDebtSnapshot } from "../../features/adjustments";
import { buildActualFoodPortionsFromText, buildMealPlan, estimateTodayWorkoutCalories } from "../../features/today-plan";
import { buildTrainingQueue, useCurrentEnergyPlan, useFitnessStore } from "../../store/fitness-store";

export default function AtonementScreen() {
  const c = useBentoTheme().colors;
  const energyPlan = useCurrentEnergyPlan();
  const profile = useFitnessStore((state) => state.profile);
  const goal = useFitnessStore((state) => state.goal);
  const customFoods = useFitnessStore((state) => state.customFoods);
  const actualFoodText = useFitnessStore((state) => state.actualFoodText);
  const actualMealTexts = useFitnessStore((state) => state.actualMealTexts);
  const actualTraining = useFitnessStore((state) => state.actualTraining);
  const trainingPreference = useFitnessStore((state) => state.trainingPreference);
  const todayTrainingPlan = useFitnessStore((state) => state.todayTrainingPlan);
  const historyLogs = useFitnessStore((state) => state.historyLogs);
  const selectedDietPlanId = useFitnessStore((state) => state.selectedDietPlanId);
  const selectedDietPlanVariantId = useFitnessStore((state) => state.selectedDietPlanVariantId);
  const dynamicAdjustmentEnabled = useFitnessStore((state) => state.dynamicAdjustmentEnabled);
  const dynamicAdjustmentSettings = useFitnessStore((state) => state.dynamicAdjustmentSettings);
  const dynamicAtonementPreference = useFitnessStore((state) => state.dynamicAtonementPreference);
  const setDynamicAtonementPreference = useFitnessStore((state) => state.setDynamicAtonementPreference);

  const today = new Date();
  const todayKey = formatDateKey(today);
  const dietPlanCycleSelection: DietPlanCycleSelection = selectedDietPlanVariantId
    ? { variantId: selectedDietPlanVariantId }
    : {};
  const resolvedDietDay = resolveDietPlanDay(selectedDietPlanId, today, dietPlanCycleSelection);
  const dietMacros = calculateDietPlanMacroTargets(selectedDietPlanId, energyPlan, {
    date: today,
    dayType: resolvedDietDay.dayType,
    selection: dietPlanCycleSelection,
  });
  const dietTarget: EnergyPlan = {
    ...dietMacros,
    bmr: energyPlan.bmr,
    tdee: energyPlan.tdee,
    dailyDeficit: energyPlan.dailyDeficit,
  };

  const recommendedTrainingQueue = buildTrainingQueue(exercises, trainingPreference);
  const recommendedWorkout = recommendedTrainingQueue[0];
  const dietTrainingRecommendation = resolveTrainingDietRecommendation({
    planId: selectedDietPlanId,
    dayType: resolvedDietDay.dayType,
    exercises,
    preferredMuscleGroups: trainingPreference.preferredMuscleGroups,
    baseMinutes: trainingPreference.minutesPerSession,
    manualFocus: todayTrainingPlan.focus,
    manualMinutes: todayTrainingPlan.minutes,
  });
  const plannedTrainingFocus = dietTrainingRecommendation.focus;
  const plannedTrainingWorkout = buildTrainingQueue(exercises, {
    ...trainingPreference,
    daysPerWeek: 1,
    minutesPerSession: dietTrainingRecommendation.durationMinutes,
    preferredMuscleGroups: [dietTrainingRecommendation.focus],
  })[0] ?? recommendedWorkout;
  const plannedTrainingBaseCalories = estimateTodayWorkoutCalories(plannedTrainingWorkout, profile.weightKg);
  const plannedTrainingCalories =
    todayTrainingPlan.minutes && plannedTrainingWorkout?.estimatedMinutes
      ? Math.round(plannedTrainingBaseCalories * (todayTrainingPlan.minutes / Math.max(1, plannedTrainingWorkout.estimatedMinutes)))
      : plannedTrainingBaseCalories;

  const parsedActual = buildActualFoodPortionsFromText(actualFoodText, customFoods, {
    dailyCalorieTarget: dietTarget.calories,
  });
  const actualTotals = sumNutrition(parsedActual.portions.map((portion) => portion.totals));
  const actualMealPlan = buildMealPlan(parsedActual.portions, customFoods);
  const mealBudgets = calculateDefaultMealBudgets(dietTarget.calories);
  const mealDeltas = actualMealPlan.map((meal) => ({
    id: meal.id,
    calories: Math.round(meal.totals.calories - mealBudgets[meal.id]),
  }));

  const adjustmentSummary = useMemo(
    () => buildDailyAdjustmentSummary({
      target: dietTarget,
      actualTotals,
      actualFoodIsDelta: false,
      mealDeltas,
      plannedTrainingCalories,
      actualTrainingCalories: actualTraining.calories,
      plannedTrainingFocus,
      gender: profile.gender,
      userProfile: profile,
      goalPlan: goal,
      fatigue: actualTraining.fatigue,
      settings: dynamicAdjustmentSettings,
      atonementPreference: dynamicAtonementPreference,
    }),
    [
      actualTotals,
      actualTraining.calories,
      actualTraining.fatigue,
      dietTarget,
      dynamicAdjustmentSettings,
      dynamicAtonementPreference,
      goal,
      mealDeltas,
      plannedTrainingCalories,
      plannedTrainingFocus,
      profile,
    ]
  );

  const previewEntry = useMemo<DailyLogEntry | undefined>(() => {
    const stored = historyLogs[todayKey];
    if (stored) return stored;
    if (!actualFoodText.trim() && actualTraining.status === "pending") return undefined;
    return {
      date: todayKey,
      targetCalories: dietTarget.calories,
      targetMacros: dietTarget,
      actualIntake: actualTotals,
      actualFoodText,
      actualMealTexts,
      training: actualTraining,
      isComplete: Boolean(actualFoodText.trim()) && actualTraining.status !== "pending",
      debtSnapshot: buildDebtSnapshot(adjustmentSummary),
    };
  }, [actualFoodText, actualMealTexts, actualTotals, actualTraining, adjustmentSummary, dietTarget, historyLogs, todayKey]);

  return (
    <Screen>
      <GlassTile glow="warn" raised style={{ gap: 10 }}>
        <View style={{ gap: 4 }}>
          <BentoText weight="bold" style={{ fontSize: 26, lineHeight: 30, color: c.ink }}>
            赎罪
          </BentoText>
          <BentoText variant="caption" color={c.inkMute}>
            热量账本 · 动态调整
          </BentoText>
        </View>
        <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 20 }}>
          热量差额可跨天平滑处理；蛋白、脂肪、碳水只做趋势查看，不做短期硬补。
        </BentoText>
      </GlassTile>

      {dynamicAdjustmentEnabled ? (
        <AtonementAdjustmentCard
          summary={adjustmentSummary}
          mode={adjustmentSummary.adjustmentMode}
          repayDays={dynamicAtonementPreference.repayDays}
          onModeChange={(adjustmentMode) => setDynamicAtonementPreference({ ...dynamicAtonementPreference, adjustmentMode })}
          onRepayDaysChange={(repayDays) => setDynamicAtonementPreference({ ...dynamicAtonementPreference, repayDays })}
        />
      ) : (
        <GlassTile style={{ gap: 8 }}>
          <BentoText weight="semibold" color={c.ink}>动态调整已关闭</BentoText>
          <BentoText variant="caption" color={c.inkMute}>可在“更多”里重新开启动态调整规则。</BentoText>
        </GlassTile>
      )}

      <BentoText variant="micro" color={c.inkFaint} style={{lineHeight:16,marginBottom:6}}>赎罪 = 动态调整目标偏差，系统会把差额重新分配回计划轨道。</BentoText>
      <CalorieLedgerPanel
        historyLogs={historyLogs}
        previewEntry={previewEntry}
        targetNutrition={dietTarget}
      />
    </Screen>
  );
}

function AtonementAdjustmentCard({
  summary,
  mode,
  repayDays,
  onModeChange,
  onRepayDaysChange,
}: {
  summary: ReturnType<typeof buildDailyAdjustmentSummary>;
  mode: DynamicAdjustmentMode;
  repayDays: number;
  onModeChange: (mode: DynamicAdjustmentMode) => void;
  onRepayDaysChange: (days: number) => void;
}) {
  const c = useBentoTheme().colors;
  const color: SemanticColor = summary.netDelta > 0 ? "warn" : "positive";
  const modeOptions: Array<{ mode: DynamicAdjustmentMode; label: string }> = [
    { mode: "extend-deadline", label: "延长目标天数" },
    { mode: "repay-by-days", label: "往后天数分摊" },
    { mode: "hybrid", label: "延长加分摊" },
  ];
  const statCards = [
    { label: "净差", value: `${summary.netDelta >= 0 ? "+" : ""}${summary.netDelta} kcal`, tone: color, show: true },
    { label: "用户自定义", value: summary.userRepayDays > 0 ? `${summary.userRepayDays} 天` : "-", tone: "accent" as const, show: summary.adjustmentMode !== "extend-deadline" },
    { label: "系统延长", value: summary.systemExtensionDays > 0 ? `${summary.systemExtensionDays} 天` : "-", tone: "accent2" as const, show: summary.adjustmentMode !== "repay-by-days" },
    { label: "混合总天数", value: summary.totalAdjustmentDays > 0 ? `${summary.totalAdjustmentDays} 天` : "-", tone: "positive" as const, show: summary.adjustmentMode === "hybrid" },
    { label: "每日调整", value: summary.netDelta > 0 ? `${summary.dailyRepayCalories} kcal` : "-", tone: "positive" as const, show: summary.netDelta > 0 },
    { label: "新目标", value: summary.netDelta > 0 ? `${summary.adjustedDailyCalories} kcal/天` : "-", tone: "warn" as const, show: summary.netDelta > 0 },
  ];

  return (
    <GlassTile glow={color} padding={12} style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <BentoText variant="micro" color={c.inkMute}>动态调整</BentoText>
          <BentoText weight="semibold" variant="caption" color={c[color]} numberOfLines={1}>
            {summary.title}
          </BentoText>
        </View>
        <Badge color={color} size="sm">
          {summary.netDelta >= 0 ? "+" : ""}{summary.netDelta} kcal
        </Badge>
      </View>

      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {modeOptions.map((option) => {
          const active = option.mode === mode;
          return (
            <Pressable
              key={option.mode}
              onPress={() => onModeChange(option.mode)}
              style={({ pressed }) => ({
                minHeight: 30,
                paddingHorizontal: 10,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? c[color] : c.glass,
                borderWidth: 1,
                borderColor: active ? c[color] : c.glassBorder,
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <BentoText weight="semibold" variant="micro" color={active ? c.bg : c.inkMute}>
                {option.label}
              </BentoText>
            </Pressable>
          );
        })}
      </View>

      {mode !== "extend-deadline" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <BentoText variant="micro" color={c.inkMute}>天数</BentoText>
          <TextInput
            keyboardType="numeric"
            value={String(repayDays)}
            onChangeText={(text) => onRepayDaysChange(repayDaysOr(text, repayDays))}
            placeholder="5"
            placeholderTextColor={c.inkFaint}
            style={{
              width: 64,
              minHeight: 34,
              height: 34,
              textAlign: "center",
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 12,
              color: c.ink,
              backgroundColor: c.glass,
              borderWidth: 1,
              borderColor: c.glassBorder,
            }}
          />
          <BentoText variant="micro" color={c.inkMute}>天</BentoText>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {statCards.filter((item) => item.show).map((item) => (
          <View
            key={item.label}
            style={{
              minWidth: 96,
              flexGrow: 1,
              flexBasis: "30%",
              paddingHorizontal: 10,
              paddingVertical: 9,
              borderRadius: 14,
              backgroundColor: c.glass,
              borderWidth: 1,
              borderColor: c.glassBorder,
              gap: 2,
            }}
          >
            <BentoText variant="micro" color={c.inkMute}>{item.label}</BentoText>
            <BentoText weight="semibold" variant="caption" color={c[item.tone]}>{item.value}</BentoText>
          </View>
        ))}
      </View>

      {summary.warning ? (
        <BentoText variant="micro" color={c.warn} style={{ lineHeight: 16 }}>
          {summary.warning}
        </BentoText>
      ) : null}
    </GlassTile>
  );
}

function repayDaysOr(value: string, fallback: number): number {
  const parsed = Math.round(Number(value));
  const safeFallback = Number.isFinite(fallback) ? fallback : 5;
  if (!Number.isFinite(parsed)) return safeFallback;
  return Math.max(1, Math.min(30, parsed));
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
