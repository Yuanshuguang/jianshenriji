import {
  exercises,
  resolveDietPlanDay,
  resolveTrainingDietRecommendation,
  type DietPlanCycleSelection,
  type MuscleGroup
} from "@fitness-calendar/shared";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { CalendarHistoryPanel } from "../../components/CalendarHistoryPanel";
import {
  Badge,
  Button,
  GlassTile,
  Label,
  PetReminderCard,
  Screen,
  SelectChip,
  Text as BentoText,
  radius,
  type SemanticColor,
  useBentoTheme,
} from "../../components/bento";
import { ActualTrainingInputSection } from "../../components/training/ActualTrainingInputSection";
import { CustomTrainingExerciseRow } from "../../components/training/CustomTrainingExerciseRow";
import {
  buildLocalExerciseFallback,
  buildTrainingTextReferences,
  buildWorkoutForSelection,
  loadSupplementalExerciseDataset,
  mergeExerciseLibraries,
  normalizeSupplementalExercises,
  nextInCycle,
} from "../../components/training/training-utils";
import { generateTrainingReminder, getPresetPetById, type ActivePet } from "../../features/pet";
import {
  estimateTodayWorkoutCalories,
  exerciseNameMap,
  muscleNameMap,
  parseTrainingText,
} from "../../features/today-plan";
import { type ActualTrainingStatus, useFitnessStore } from "../../store/fitness-store";
import type { LibraryExercise } from "../../types/training";

const statusOptions: Array<{ value: ActualTrainingStatus; label: string; color: SemanticColor }> = [
  { value: "done", label: "已记录训练", color: "positive" },
  { value: "missed", label: "今天休息", color: "warn" },
];

const focusOptions: MuscleGroup[] = ["chest", "back", "legs", "shoulders", "arms", "core", "cardio"];
const durationOptions = [20, 30, 45, 60, 75, 90];

export default function TrainScreen() {
  const router = useRouter();
  const c = useBentoTheme().colors;
  const [trainingCalendarOpen, setTrainingCalendarOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryExercise[]>([]);
  const [supplementalLibraryItems, setSupplementalLibraryItems] = useState<LibraryExercise[]>([]);

  const profile = useFitnessStore((state) => state.profile);
  const preference = useFitnessStore((state) => state.trainingPreference);
  const actualTraining = useFitnessStore((state) => state.actualTraining);
  const setActualTraining = useFitnessStore((state) => state.setActualTraining);
  const todayTrainingPlan = useFitnessStore((state) => state.todayTrainingPlan);
  const setTodayTrainingPlan = useFitnessStore((state) => state.setTodayTrainingPlan);
  const selectedDietPlanId = useFitnessStore((state) => state.selectedDietPlanId);
  const selectedDietPlanVariantId = useFitnessStore((state) => state.selectedDietPlanVariantId);
  const selectedPetId = useFitnessStore((state) => state.selectedPetId);
  const customPet = useFitnessStore((state) => state.customPet);
  const petEnabled = useFitnessStore((state) => state.petEnabled);

  const today = new Date();
  const dietPlanCycleSelection: DietPlanCycleSelection = selectedDietPlanVariantId
    ? { variantId: selectedDietPlanVariantId }
    : {};
  const resolvedDietDay = resolveDietPlanDay(selectedDietPlanId, today, dietPlanCycleSelection);
  const dietTrainingRecommendation = resolveTrainingDietRecommendation({
    planId: selectedDietPlanId,
    dayType: resolvedDietDay.dayType,
    exercises,
    preferredMuscleGroups: preference.preferredMuscleGroups,
    baseMinutes: preference.minutesPerSession,
    manualFocus: todayTrainingPlan.focus,
    manualMinutes: todayTrainingPlan.minutes
  });
  const selectedFocus = dietTrainingRecommendation.focus;
  const selectedMinutes = dietTrainingRecommendation.durationMinutes;
  const selectedNextFocus = todayTrainingPlan.nextFocus ?? dietTrainingRecommendation.nextFocus ?? selectedFocus;
  const todayWorkout = buildWorkoutForSelection(selectedFocus, selectedMinutes, preference);
  const customTrainingExercises = todayTrainingPlan.customExercises ?? [];
  const suggestedExerciseIds = dietTrainingRecommendation.exerciseIds.length > 0
    ? dietTrainingRecommendation.exerciseIds
    : todayWorkout.exercises.slice(0, 4).map((item) => item.exerciseId);
  const actualTrainingCalories = Math.round(actualTraining.calories);
  const hasTrainingFeedback = actualTraining.status !== "pending";

  const combinedLibraryItems = useMemo(
    () => mergeExerciseLibraries(libraryItems, supplementalLibraryItems),
    [libraryItems, supplementalLibraryItems]
  );
  const suggestedLibraryExercises = useMemo(
    () => suggestedExerciseIds.map((exerciseId) => resolveRecommendedLibraryExercise(exerciseId, combinedLibraryItems)),
    [suggestedExerciseIds, combinedLibraryItems]
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

  useEffect(() => {
    let cancelled = false;
    setLibraryItems(buildLocalExerciseFallback());
    loadSupplementalExerciseDataset()
      .then((payload) => {
        if (!cancelled) setSupplementalLibraryItems(normalizeSupplementalExercises(payload));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const activePet: ActivePet = petEnabled
    ? customPet
      ? { kind: "custom", pet: customPet }
      : selectedPetId
        ? { kind: "preset", pet: getPresetPetById(selectedPetId)! }
        : null
    : null;
  const trainingReminder = activePet
    ? generateTrainingReminder(activePet, {
        plannedTitle: `${muscleNameMap[selectedFocus]}参考训练`,
        plannedCalories: estimateTodayWorkoutCalories(todayWorkout, profile.weightKg),
        status: actualTraining.status,
        actualCalories: actualTraining.calories
      })
    : null;

  const updatePlanSelection = (patch: Partial<typeof todayTrainingPlan>) => {
    setTodayTrainingPlan({ ...todayTrainingPlan, ...patch });
  };

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

  return (
    <Screen>
      <PetReminderCard reminder={trainingReminder} />

      <GlassTile glow="accent2" padding={10} style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <Label color={c.inkMute} variant="label">今日建议练</Label>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Badge color={hasTrainingFeedback ? "positive" : "amber"} size="sm">
              {hasTrainingFeedback ? "已记录" : "待记录"}
            </Badge>
            <Pressable
              onPress={() => setTrainingCalendarOpen((value) => !value)}
              hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
            >
              <BentoText weight="semibold" color={c.accent2} style={{ fontSize: 12 }}>
                {trainingCalendarOpen ? "收起" : "历史"}
              </BentoText>
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          <PlanChip
            label="部位"
            value={muscleNameMap[selectedFocus]}
            onPress={() => updatePlanSelection({ focus: nextInCycle(dietTrainingRecommendation.focusCandidates.length ? dietTrainingRecommendation.focusCandidates : focusOptions, selectedFocus) })}
          />
          <PlanChip
            label="参考时长"
            value={`${selectedMinutes} 分钟`}
            onPress={() => updatePlanSelection({ minutes: nextInCycle(durationOptions, selectedMinutes) })}
          />
          <PlanChip
            label="下次优先"
            value={muscleNameMap[selectedNextFocus]}
            onPress={() => updatePlanSelection({ nextFocus: nextInCycle(focusOptions, selectedNextFocus) })}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          <Badge color={dietTrainingRecommendation.intensity === "heavy" ? "warn" : dietTrainingRecommendation.intensity === "recovery" ? "positive" : "accent2"} size="sm">
            {resolvedDietDay.status} · {dietTrainingRecommendation.intensityLabel}
          </Badge>
          <Badge color="accent" size="sm">{dietTrainingRecommendation.movementPattern}</Badge>
        </View>
        {trainingCalendarOpen ? <CalendarHistoryPanel /> : null}
      </GlassTile>

      <GlassTile glow="accent2" style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <Label color={c.inkMute} variant="label">动作参考</Label>
          <Button variant="glass" color="positive" size="sm" onPress={() => router.push("/exercise-library")}>
            打开动作库
          </Button>
        </View>

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
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {suggestedLibraryExercises.map((item, index) => (
              <ReferenceExerciseCard
                key={`${item.exerciseId}-${index}`}
                item={item}
                onPress={() => router.push("/exercise-library")}
              />
            ))}
          </View>
        </View>
      </GlassTile>

      <GlassTile glow="accent" style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Label color={c.inkMute} variant="label">我今天练了什么</Label>
          <BentoText mono weight="semibold" color={c.accent} style={{ fontSize: 13 }}>
            {actualTrainingCalories} kcal
          </BentoText>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
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

        {actualTraining.status !== "missed" ? (
          <ActualTrainingInputSection
            text={actualTraining.text}
            parsed={actualTrainingParsed}
            actualCalories={actualTraining.calories}
            minutes={actualTraining.minutes}
            fatigue={actualTraining.fatigue}
            inputStyle={inputStyle}
            onTextChange={(text) => updateActualTraining({ status: text.trim() ? "changed" : "pending", text })}
            onMinutesChange={(minutes) => updateActualTraining({ status: "changed", minutes })}
            onFatigueChange={(fatigue) => updateActualTraining({ fatigue })}
          />
        ) : (
          <BentoText variant="caption" color={c.warn}>
            今天作为休息日记录。饮食联动会把实际训练消耗按 0 处理。
          </BentoText>
        )}
      </GlassTile>
    </Screen>
  );
}

function PlanChip({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const c = useBentoTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: 86,
        flexGrow: 1,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: c.glassRaised,
        borderWidth: 1,
        borderColor: c.glassBorderBright,
        opacity: pressed ? 0.78 : 1,
        gap: 2,
      })}
    >
      <BentoText variant="micro" color={c.inkFaint}>{label}</BentoText>
      <BentoText weight="bold" color={c.ink} numberOfLines={1}>{value}</BentoText>
    </Pressable>
  );
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
        width: "47%",
        minHeight: 154,
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
