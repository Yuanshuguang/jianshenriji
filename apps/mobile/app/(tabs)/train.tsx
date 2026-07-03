import {
  exercises,
  getTodayTrainingScheduleEntry,
  resolveTrainingSchedule,
  sumNutrition,
  type DietPlanCycleSelection,
  type MuscleGroup
} from "@fitness-calendar/shared";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, View } from "react-native";
import {
  Badge,
  Button,
  GlassTile,
  Label,
  MetricCompareBar,
  Screen,
  SelectChip,
  Text as BentoText,
  radius,
  type SemanticColor,
  useBentoTheme,
} from "../../components/bento";
import { ActualTrainingInputSection } from "../../components/training/ActualTrainingInputSection";
import { CustomTrainingExerciseRow } from "../../components/training/CustomTrainingExerciseRow";
import { TrainingPlanOverview } from "../../components/training/TrainingPlanOverview";
import {
  buildLocalExerciseFallback,
  buildTrainingTextReferences,
  buildWorkoutForSelection,
  loadSupplementalExerciseDataset,
  mergeExerciseLibraries,
  normalizeSupplementalExercises,
} from "../../components/training/training-utils";
import {
  buildActualFoodPortionsFromText,
  estimateTodayWorkoutCalories,
  exerciseNameMap,
  muscleNameMap,
  parseTrainingText,
} from "../../features/today-plan";
import { type ActualTrainingStatus, useCurrentEnergyPlan, useFitnessStore } from "../../store/fitness-store";
import type { LibraryExercise } from "../../types/training";

const statusOptions: Array<{ value: ActualTrainingStatus; label: string; color: SemanticColor }> = [
  { value: "done", label: "已记录训练", color: "positive" },
  { value: "missed", label: "今天休息", color: "warn" },
];

export default function TrainScreen() {
  const router = useRouter();
  const c = useBentoTheme().colors;
  const [referenceCollapsed, setReferenceCollapsed] = useState(true);
  const [libraryItems, setLibraryItems] = useState<LibraryExercise[]>([]);
  const [supplementalLibraryItems, setSupplementalLibraryItems] = useState<LibraryExercise[]>([]);

  const energyPlan = useCurrentEnergyPlan();
  const profile = useFitnessStore((state) => state.profile);
  const preference = useFitnessStore((state) => state.trainingPreference);
  const actualTraining = useFitnessStore((state) => state.actualTraining);
  const setActualTraining = useFitnessStore((state) => state.setActualTraining);
  const actualFoodText = useFitnessStore((state) => state.actualFoodText);
  const customFoods = useFitnessStore((state) => state.customFoods);
  const todayTrainingPlan = useFitnessStore((state) => state.todayTrainingPlan);
  const selectedDietPlanId = useFitnessStore((state) => state.selectedDietPlanId);
  const selectedDietPlanVariantId = useFitnessStore((state) => state.selectedDietPlanVariantId);

  const today = new Date();
  const dietPlanCycleSelection: DietPlanCycleSelection = selectedDietPlanVariantId
    ? { variantId: selectedDietPlanVariantId }
    : {};
  const trainingSchedule = useMemo(() => resolveTrainingSchedule({
    planId: selectedDietPlanId,
    dietPlanSelection: dietPlanCycleSelection,
    exercises,
    preference,
    anchorDate: today,
    manualTodayFocus: todayTrainingPlan.focus,
    manualTodayMinutes: todayTrainingPlan.minutes
  }), [selectedDietPlanId, selectedDietPlanVariantId, preference, todayTrainingPlan.focus, todayTrainingPlan.minutes]);
  const todayScheduleEntry = getTodayTrainingScheduleEntry(trainingSchedule);
  const selectedFocus: MuscleGroup = todayScheduleEntry.focus ?? "cardio";
  const selectedMinutes = todayScheduleEntry.minutes;
  const todayWorkout = buildWorkoutForSelection(selectedFocus, selectedMinutes, preference);
  const customTrainingExercises = todayTrainingPlan.customExercises ?? [];
  const actualTrainingCalories = Math.round(actualTraining.calories);
  const actualFood = useMemo(
    () => buildActualFoodPortionsFromText(actualFoodText, customFoods, { dailyCalorieTarget: energyPlan.calories }),
    [actualFoodText, customFoods, energyPlan.calories]
  );
  const actualIntake = Math.round(sumNutrition(actualFood.portions.map((portion) => portion.totals)).calories);
  const burnCalories = Math.round(energyPlan.tdee + actualTraining.calories);
  const deficit = Math.max(0, burnCalories - actualIntake);

  const combinedLibraryItems = useMemo(
    () => mergeExerciseLibraries(libraryItems, supplementalLibraryItems),
    [libraryItems, supplementalLibraryItems]
  );
  const suggestedLibraryExercises = useMemo(
    () => todayScheduleEntry.trainingType === "rest"
      ? []
      : buildSuggestedLibraryExercises({
          focus: selectedFocus,
          libraryItems: combinedLibraryItems,
          workout: todayWorkout,
          extraExerciseIds: todayScheduleEntry.exerciseIds,
        }),
    [selectedFocus, combinedLibraryItems, todayWorkout, todayScheduleEntry.exerciseIds, todayScheduleEntry.trainingType]
  );
  const trainingTextReferences = useMemo(
    () => buildTrainingTextReferences(customTrainingExercises, combinedLibraryItems),
    [customTrainingExercises, combinedLibraryItems]
  );
  const actualTrainingParsed = useMemo(
    () => parseTrainingText(
      actualTraining.text,
      actualTraining.minutes,
      { heightCm: profile.heightCm, weightKg: profile.weightKg },
      todayWorkout,
      trainingTextReferences
    ),
    [actualTraining.text, actualTraining.minutes, profile.heightCm, profile.weightKg, todayWorkout, trainingTextReferences]
  );

  const updateActualTraining = (patch: Partial<typeof actualTraining>) => {
    const next = { ...actualTraining, ...patch };
    const parsedTraining = parseTrainingText(
      next.text,
      next.minutes,
      { heightCm: profile.heightCm, weightKg: profile.weightKg },
      todayWorkout,
      trainingTextReferences
    );
    const calories =
      next.status === "missed"
        ? 0
        : next.text.trim().length > 0 || parsedTraining.totalMinutes > 0
          ? parsedTraining.totalCalories
          : estimateTodayWorkoutCalories(todayWorkout, profile.weightKg);

    setActualTraining({
      ...next,
      minutes: next.text.trim().length > 0 && parsedTraining.totalMinutes > 0 ? parsedTraining.totalMinutes : next.minutes,
      calories
    });
  };

  const inputStyle = {
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    color: c.ink,
    fontSize: 14,
    height: 44
  } as const;

  useEffect(() => {
    let cancelled = false;
    setLibraryItems(buildLocalExerciseFallback());
    loadSupplementalExerciseDataset()
      .then((payload) => {
        if (!cancelled) setSupplementalLibraryItems(normalizeSupplementalExercises(payload));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const actualWeightLevel = fatigueToWeightLevel(actualTraining.fatigue);
  const isRestDay = todayScheduleEntry.trainingType === "rest";

  return (
    <Screen>

      <TrainingPlanOverview
        schedule={trainingSchedule}
      />

      {isRestDay ? (
        <RestDaySummary
          dietLabel={todayScheduleEntry.dietLabel}
          reason={todayScheduleEntry.reason}
          baseBurnCalories={Math.round(energyPlan.tdee)}
          intakeCalories={actualIntake}
        />
      ) : (
        <TrainingEnergySummary
          burnCalories={burnCalories}
          burnTarget={Math.round(energyPlan.tdee)}
          deficit={deficit}
          deficitTarget={Math.max(0, Math.round(energyPlan.dailyDeficit))}
          intakeCalories={actualIntake}
          trainingCalories={actualTrainingCalories}
        />
      )}

      <GlassTile glow="accent2" style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Label color={c.inkMute} variant="label">动作参考</Label>
            <BentoText variant="micro" color={c.inkMute}>推荐 {suggestedLibraryExercises.length} 个 · 已加入 {customTrainingExercises.length} 个</BentoText>
          </View>
          <Button variant="glass" color="accent2" size="sm" onPress={() => setReferenceCollapsed((value) => !value)}>
            {referenceCollapsed ? "展开" : "收起"}
          </Button>
          <Button variant="glass" color="positive" size="sm" onPress={() => router.push("/exercise-library")}>
            动作库
          </Button>
        </View>

        {!referenceCollapsed ? (
          <>
            {customTrainingExercises.length > 0 ? (
              <View style={{ gap: 8 }}>
                <BentoText variant="caption" color={c.inkMute}>你从动作库加入的参考动作</BentoText>
                {customTrainingExercises.map((item) => (
                  <CustomTrainingExerciseRow key={item.id} item={item} />
                ))}
              </View>
            ) : null}

            <View style={{ gap: 8 }}>
              <BentoText variant="caption" color={c.inkMute}>APP 推荐参考动作</BentoText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {suggestedLibraryExercises.map((item, index) => (
                  <ReferenceExerciseCard
                    key={`${item.exerciseId}-${index}`}
                    item={item}
                    onPress={() => router.push("/exercise-library")}
                  />
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {suggestedLibraryExercises.slice(0, 3).map((item, index) => (
              <Badge key={`${item.exerciseId}-${index}`} color="accent2" size="sm">
                {item.displayName}
              </Badge>
            ))}
          </View>
        )}
      </GlassTile>

      <GlassTile glow="accent" style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {statusOptions.map((item) => (
                <SelectChip
                  key={item.value}
                  label={item.label}
                  active={actualTraining.status === item.value}
                  color={item.color}
                  size="sm"
                  onPress={() =>
                    updateActualTraining({
                      status: item.value,
                      minutes: item.value === "done" ? selectedMinutes : actualTraining.minutes
                    })
                  }
                />
              ))}
            </View>
            <BentoText mono weight="semibold" color={c.accent} style={{ fontSize: 13 }}>
              {actualTrainingCalories} kcal
            </BentoText>
          </View>
        </View>

        {actualTraining.status !== "missed" && !isRestDay ? (
          <ActualTrainingInputSection
            text={actualTraining.text}
            parsed={actualTrainingParsed}
            actualCalories={actualTraining.calories}
            minutes={actualTraining.minutes}
            weightLevel={actualWeightLevel}
            inputStyle={inputStyle}
            onTextChange={(text) => updateActualTraining({ status: text.trim() ? "changed" : "pending", text })}
            onMinutesChange={(minutes) => updateActualTraining({ status: "changed", minutes })}
            onWeightLevelChange={(weightLevel) => updateActualTraining({ fatigue: weightLevelToFatigue(weightLevel) })}
          />
        ) : (
          <BentoText variant="caption" color={c.warn}>
            今天按恢复日处理。饮食联动会把实际训练消耗按 0 处理；如有散步、拉伸或临时训练，可切换为“已记录训练”后补充。
          </BentoText>
        )}
      </GlassTile>
    </Screen>
  );
}

function RestDaySummary({
  dietLabel,
  reason,
  baseBurnCalories,
  intakeCalories,
}: {
  dietLabel: string;
  reason: string;
  baseBurnCalories: number;
  intakeCalories: number;
}) {
  const c = useBentoTheme().colors;
  return (
    <GlassTile glow="amber" padding={12} style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Label color={c.inkMute} variant="label">今日恢复日</Label>
          <BentoText weight="bold" color={c.ink} style={{ fontSize: 18 }}>
            不安排正式训练
          </BentoText>
        </View>
        <Badge color="amber" size="sm">{dietLabel}</Badge>
      </View>
      <BentoText variant="caption" color={c.inkMute}>
        {reason}
      </BentoText>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1, borderRadius: 12, padding: 9, backgroundColor: c.glass, borderWidth: 1, borderColor: c.glassBorder }}>
          <BentoText variant="micro" color={c.inkMute}>基础日消耗</BentoText>
          <BentoText mono weight="bold" color={c.accent} style={{ fontSize: 20 }}>{baseBurnCalories} kcal</BentoText>
        </View>
        <View style={{ flex: 1, borderRadius: 12, padding: 9, backgroundColor: c.glass, borderWidth: 1, borderColor: c.glassBorder }}>
          <BentoText variant="micro" color={c.inkMute}>今日已摄入</BentoText>
          <BentoText mono weight="bold" color={c.accent} style={{ fontSize: 20 }}>{Math.round(intakeCalories)} kcal</BentoText>
        </View>
      </View>
    </GlassTile>
  );
}

function TrainingEnergySummary({
  burnCalories,
  burnTarget,
  deficit,
  deficitTarget,
  intakeCalories,
  trainingCalories,
}: {
  burnCalories: number;
  burnTarget: number;
  deficit: number;
  deficitTarget: number;
  intakeCalories: number;
  trainingCalories: number;
}) {
  const c = useBentoTheme().colors;
  const deficitColor: SemanticColor = deficit >= deficitTarget ? "positive" : "accent";

  return (
    <GlassTile glow={deficitColor} padding={10} style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Label color={c.inkMute} variant="label">训练消耗与赤字</Label>
        <Badge color={trainingCalories > 0 ? "positive" : "amber"} size="sm">
          训练 {Math.round(trainingCalories)} kcal
        </Badge>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <EnergyMetric
          label="消耗热量"
          value={burnCalories}
          target={burnTarget}
          unit="kcal"
        />
        <EnergyMetric
          label="热量赤字"
          value={deficit}
          target={deficitTarget}
          unit="kcal"
        />
      </View>
      <BentoText variant="micro" color={c.inkMute}>
        消耗 = 基础日消耗 + 实际训练；赤字 = 消耗 - 饮食页实际摄入 {Math.round(intakeCalories)} kcal。
      </BentoText>
    </GlassTile>
  );
}

function EnergyMetric({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ flex: 1, minWidth: 0, borderRadius: 12, padding: 9, gap: 6, backgroundColor: c.glass, borderWidth: 1, borderColor: c.glassBorder }}>
      <BentoText variant="micro" color={c.inkMute}>{label}</BentoText>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
        <BentoText mono weight="bold" color={c.accent} style={{ fontSize: 22, lineHeight: 24 }}>
          {Math.round(value)}
        </BentoText>
        <BentoText mono color={c.inkMute} style={{ fontSize: 10 }}>{unit}</BentoText>
      </View>
      <MetricCompareBar actual={value} target={target} height={6} />
      <BentoText variant="micro" color={c.inkFaint}>
        目标 {Math.round(target)}{unit}
      </BentoText>
    </View>
  );
}

function fatigueToWeightLevel(fatigue: number): number {
  if (fatigue <= 2) return 1;
  if (fatigue <= 4) return 2;
  return 3;
}

function weightLevelToFatigue(weightLevel: number): number {
  if (weightLevel <= 1) return 1;
  if (weightLevel === 2) return 3;
  return 5;
}

function buildSuggestedLibraryExercises({
  focus,
  libraryItems,
  workout,
  extraExerciseIds,
}: {
  focus: MuscleGroup;
  libraryItems: LibraryExercise[];
  workout: ReturnType<typeof buildWorkoutForSelection> | undefined;
  extraExerciseIds: string[];
}): RecommendedLibraryExercise[] {
  const workoutExerciseIds = new Set(workout?.exercises.map((item) => item.exerciseId) ?? []);
  const priorityExerciseIds = new Set(extraExerciseIds);
  const scored = exercises
    .map((exercise) => {
      let score = 100;
      if (exercise.primaryMuscleGroup === focus) score -= 40;
      if (priorityExerciseIds.has(exercise.id)) score -= 30;
      if (workoutExerciseIds.has(exercise.id)) score -= 20;
      if (exercise.primaryMuscleGroup === "core" && focus === "core") score -= 10;
      return { exercise, score };
    })
    .sort((left, right) => left.score - right.score || left.exercise.name.localeCompare(right.exercise.name))
    .slice(0, 9)
    .map(({ exercise }) => resolveRecommendedLibraryExercise(exercise.id, libraryItems));

  return scored;
}
type RecommendedLibraryExercise = {
  exerciseId: string;
  displayName: string;
  muscle: MuscleGroup;
  bodyPart: string | null;
  equipment: string | null;
  gifUrl: string | null;
};

function ReferenceExerciseCard({ item, onPress }: { item: RecommendedLibraryExercise; onPress: () => void }) {
  const c = useBentoTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: "31.5%",
        minHeight: 146,
        borderRadius: 14,
        padding: 9,
        gap: 8,
        backgroundColor: c.glass,
        borderWidth: 1,
        borderColor: c.glassBorder,
        opacity: pressed ? 0.78 : 1
      })}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          minWidth: 38,
          height: 24,
          paddingHorizontal: 8,
          borderTopLeftRadius: 14,
          borderBottomRightRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.accent2
        }}
      >
        <BentoText weight="bold" variant="micro" style={{ color: c.bg }}>
          {muscleNameMap[item.muscle].slice(0, 1)}
        </BentoText>
      </View>
      <View
        style={{
          height: 86,
          borderRadius: 12,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${c.ink}12`
        }}
      >
        {item.gifUrl ? (
          <Image source={{ uri: item.gifUrl }} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
        ) : (
          <BentoText variant="micro" color={c.inkFaint}>GIF</BentoText>
        )}
      </View>
      <View style={{ gap: 3 }}>
        <BentoText weight="semibold" variant="caption" color={c.ink} numberOfLines={2}>
          {item.displayName}
        </BentoText>
        <BentoText variant="micro" color={c.inkMute} numberOfLines={1}>
          {muscleNameMap[item.muscle]} · {formatLibraryMeta(item)}
        </BentoText>
      </View>
    </Pressable>
  );
}

function resolveRecommendedLibraryExercise(exerciseId: string, libraryItems: LibraryExercise[]): RecommendedLibraryExercise {
  const source = exercises.find((item) => item.id === exerciseId);
  const preferredNames = exerciseLibraryNameHints[exerciseId] ?? [source?.name ?? exerciseId];
  const matched = findLibraryExercise(preferredNames, libraryItems);
  return {
    exerciseId,
    displayName: source?.name ?? matched?.displayName ?? exerciseNameMap[exerciseId] ?? exerciseId,
    muscle: source?.primaryMuscleGroup ?? inferMuscleFromLibraryBodyPart(matched?.bodyPart) ?? "core",
    bodyPart: matched?.bodyPart ?? null,
    equipment: matched?.equipment ?? source?.equipment[0] ?? null,
    gifUrl: matched?.gifUrl ?? null
  };
}

const exerciseLibraryNameHints: Record<string, string[]> = {
  squat: ["barbell full squat", "barbell squat", "squat"],
  deadlift: ["barbell deadlift", "deadlift", "stiff leg deadlift"],
  "bench-press": ["barbell bench press", "bench press"],
  row: ["barbell bent over row", "dumbbell bent over row", "row"],
  "pull-up": ["pull-up", "pull up"],
  "push-up": ["push-up", "push up"],
  "shoulder-press": ["barbell seated overhead press", "shoulder press", "military press"],
  "lateral-raise": ["dumbbell lateral raise", "lateral raise"],
  curl: ["barbell curl", "dumbbell curl"],
  "triceps-extension": ["triceps dip", "triceps extension"],
  plank: ["front plank with twist", "plank"],
  crunch: ["crunch", "bicycle crunch"],
  running: ["run", "running"],
  cycling: ["stationary bike run", "stationary bike", "bike"]
};

function findLibraryExercise(names: string[], libraryItems: LibraryExercise[]): LibraryExercise | undefined {
  const normalizedNames = names.map(normalizeExerciseName);
  const exact = libraryItems.find((item) => normalizedNames.includes(normalizeExerciseName(item.name)));
  if (exact?.gifUrl) return exact;
  const contains = libraryItems.find((item) => {
    const name = normalizeExerciseName(item.name);
    return normalizedNames.some((candidate) => name.includes(candidate) || candidate.includes(name));
  });
  return contains ?? exact;
}

function inferMuscleFromLibraryBodyPart(bodyPart?: string | null): MuscleGroup | undefined {
  const normalized = (bodyPart ?? "").toLowerCase();
  if (normalized.includes("chest")) return "chest";
  if (normalized.includes("back")) return "back";
  if (normalized.includes("shoulder")) return "shoulders";
  if (normalized.includes("upper arms") || normalized.includes("lower arms") || normalized.includes("arms")) return "arms";
  if (normalized.includes("upper legs") || normalized.includes("lower legs") || normalized.includes("legs")) return "legs";
  if (normalized.includes("waist") || normalized.includes("core") || normalized.includes("ab")) return "core";
  if (normalized.includes("cardio")) return "cardio";
  return undefined;
}

function normalizeExerciseName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function formatLibraryMeta(item: RecommendedLibraryExercise): string {
  return [translateEquipment(item.equipment), translateBodyPart(item.bodyPart)].filter(Boolean).join(" / ") || "动作库参考";
}

function translateEquipment(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes("barbell")) return "杠铃";
  if (normalized.includes("dumbbell")) return "哑铃";
  if (normalized.includes("body weight") || normalized.includes("bodyweight")) return "徒手";
  if (normalized.includes("cable")) return "绳索";
  if (normalized.includes("machine")) return "器械";
  if (normalized.includes("band")) return "弹力带";
  if (normalized.includes("kettlebell")) return "壶铃";
  if (normalized.includes("assisted")) return "辅助";
  return value;
}

function translateBodyPart(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes("chest")) return "胸部";
  if (normalized.includes("back")) return "背部";
  if (normalized.includes("shoulder")) return "肩部";
  if (normalized.includes("upper arms")) return "上臂";
  if (normalized.includes("lower arms")) return "前臂";
  if (normalized.includes("upper legs")) return "大腿";
  if (normalized.includes("lower legs")) return "小腿";
  if (normalized.includes("waist") || normalized.includes("core")) return "核心";
  if (normalized.includes("cardio")) return "有氧";
  if (normalized.includes("neck")) return "颈部";
  return value;
}

