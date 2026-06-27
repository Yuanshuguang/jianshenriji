import { exercises, type MuscleGroup } from "@fitness-calendar/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Platform, Pressable, ScrollView, TextInput, View, type StyleProp, type TextStyle } from "react-native";
import { buildExerciseSearchTerms, localizeExerciseName } from "../../features/exercise-localization";
import { generateTrainingReminder, getPresetPetById, type ActivePet } from "../../features/pet";
import { CalendarHistoryPanel } from "../../components/CalendarHistoryPanel";
import {
  Badge,
  BentoRow,
  BentoTile,
  colors,
  GlassTile,
  Label,
  LabeledInput,
  PetReminderCard,
  Screen,
  ScreenHeader,
  SelectChip,
  Text as BentoText,
  radius,
  type SemanticColor
} from "../../components/bento";
import {
  estimateTodayWorkoutCalories,
  exerciseNameMap,
  muscleNameMap,
  parseTrainingText,
  type ParsedTrainingText,
  type TrainingTextExercise
} from "../../features/today-plan";
import { type ActualTrainingStatus, buildTrainingQueue, type TodayTrainingCustomExercise, useFitnessStore } from "../../store/fitness-store";

const statusOptions: Array<{ value: ActualTrainingStatus; label: string; color: SemanticColor }> = [
  { value: "done", label: "按目标完成", color: "positive" },
  { value: "missed", label: "今天没练", color: "warn" },
];
const focusOptions: MuscleGroup[] = ["chest", "back", "legs", "shoulders", "arms", "core", "cardio"];
const durationOptions = [30, 45, 60, 75, 90];
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
const exerciseLibraryProxyUrl = apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, "")}/api/exercises` : "";
const exerciseLibraryBaseUrl = exerciseLibraryProxyUrl;
const localSupplementalExerciseDatasetUrl = "/exercise-library/manifest.json";
const supplementalExerciseAssetBaseUrl = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";
const supplementalExerciseDatasetUrl = localSupplementalExerciseDatasetUrl;
const bodyPartOrder = ["Chest", "Back", "Upper Arms", "Lower Arms", "Shoulders", "Waist", "Upper Legs", "Lower Legs", "Cardio", "Neck"] as const;
const bodyPartLabels: Record<string, string> = {
  Chest: "胸",
  Back: "背",
  Shoulders: "肩",
  "Upper Arms": "上臂",
  "Lower Arms": "前臂",
  Waist: "核心",
  "Upper Legs": "大腿",
  "Lower Legs": "小腿",
  Cardio: "有氧",
  Neck: "颈部"
};
const equipmentPriority = ["Barbell", "Dumbbell", "Kettlebell", "Cable", "Machine", "Leverage Machine", "Body Weight", "Assisted", "Band"] as const;
const equipmentLabels: Record<string, string> = {
  Barbell: "杠铃",
  Dumbbell: "哑铃",
  Kettlebell: "壶铃",
  Cable: "绳索",
  Machine: "器械",
  "Leverage Machine": "器械",
  "Body Weight": "徒手",
  Assisted: "辅助",
  Band: "弹力带"
};

type LibraryExercise = {
  id: string;
  name: string;
  displayName: string;
  searchTerms: string[];
  source: "workoutx" | "research-gif-dataset" | "local";
  sourceId: string;
  license: string;
  mediaType: "gif" | "image" | "none";
  level: string | null;
  equipment: string | null;
  category: string | null;
  bodyPart: string | null;
  gifUrl: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
};

type WorkoutXExercise = {
  id?: string;
  exerciseId?: string;
  name?: string;
  level?: string | null;
  difficulty?: string | null;
  equipment?: string | null;
  category?: string | null;
  bodyPart?: string | null;
  target?: string | null;
  gifUrl?: string | null;
  videoUrl?: string | null;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[] | string;
};

type WorkoutXListResponse = {
  total?: number;
  count?: number;
  data?: WorkoutXExercise[];
  results?: WorkoutXExercise[];
};

type SupplementalExercise = {
  id?: string;
  name?: string;
  category?: string;
  body_part?: string;
  equipment?: string;
  target?: string;
  muscle_group?: string;
  secondary_muscles?: string[];
  image?: string;
  gif_url?: string;
  instruction_steps?: {
    en?: string[];
  };
  instructions?: {
    en?: string;
  };
};

type SupplementalExerciseManifest = {
  items?: SupplementalExercise[];
};

export default function TrainScreen() {
  const [trainingCalendarOpen, setTrainingCalendarOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryExercise[]>([]);
  const [supplementalLibraryItems, setSupplementalLibraryItems] = useState<LibraryExercise[]>([]);
  const [libraryTotal, setLibraryTotal] = useState(0);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [supplementalLibraryLoading, setSupplementalLibraryLoading] = useState(false);
  const [supplementalLibraryReady, setSupplementalLibraryReady] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [selectedLibraryEquipment, setSelectedLibraryEquipment] = useState("all");
  const [selectedLibraryBodyPart, setSelectedLibraryBodyPart] = useState("Chest");
  const [selectedLibraryExercise, setSelectedLibraryExercise] = useState<LibraryExercise | null>(null);
  const [libraryThumbUris, setLibraryThumbUris] = useState<Record<string, string>>({});
  const [libraryVisibleLimit, setLibraryVisibleLimit] = useState(24);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const profile = useFitnessStore((state) => state.profile);
  const preference = useFitnessStore((state) => state.trainingPreference);
  const actualTraining = useFitnessStore((state) => state.actualTraining);
  const setActualTraining = useFitnessStore((state) => state.setActualTraining);
  const todayTrainingPlan = useFitnessStore((state) => state.todayTrainingPlan);
  const setTodayTrainingPlan = useFitnessStore((state) => state.setTodayTrainingPlan);
  const selectedPetId = useFitnessStore((state) => state.selectedPetId);
  const customPet = useFitnessStore((state) => state.customPet);
  const petEnabled = useFitnessStore((state) => state.petEnabled);
  const recommendedQueue = buildTrainingQueue(exercises, preference);
  const recommendedWorkout = recommendedQueue[0];
  const recommendedNextWorkout = recommendedQueue[1] ?? recommendedQueue[0];
  const selectedFocus = todayTrainingPlan.focus ?? recommendedWorkout?.focus ?? preference.preferredMuscleGroups[0] ?? "chest";
  const selectedMinutes = todayTrainingPlan.minutes ?? recommendedWorkout?.estimatedMinutes ?? preference.minutesPerSession;
  const selectedNextFocus = todayTrainingPlan.nextFocus ?? recommendedNextWorkout?.focus ?? selectedFocus;
  const todayWorkout = buildWorkoutForSelection(selectedFocus, selectedMinutes, preference);
  const customTrainingExercises = todayTrainingPlan.customExercises ?? [];
  const plannedTrainingCalories = estimateTodayWorkoutCalories(todayWorkout, profile.weightKg);
  const hasTrainingFeedback = actualTraining.status !== "pending";
  const completionPercent = hasTrainingFeedback && plannedTrainingCalories > 0
    ? Math.min(1, actualTraining.calories / plannedTrainingCalories)
    : 0;
  const combinedLibraryItems = useMemo(
    () => mergeExerciseLibraries(libraryItems, supplementalLibraryItems),
    [libraryItems, supplementalLibraryItems]
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
  const libraryBodyParts = useMemo(() => {
    const dynamicParts = combinedLibraryItems.map((item) => item.bodyPart).filter(Boolean) as string[];
    return Array.from(new Set([...bodyPartOrder, ...dynamicParts]));
  }, [combinedLibraryItems]);
  const libraryEquipmentOptions = useMemo(() => {
    const dynamicEquipment = combinedLibraryItems.map((item) => item.equipment).filter(Boolean) as string[];
    const ordered = equipmentPriority.filter((item) => dynamicEquipment.includes(item));
    const rest = dynamicEquipment.filter((item) => !ordered.includes(item as typeof equipmentPriority[number]));
    return Array.from(new Set([...ordered, ...rest]));
  }, [combinedLibraryItems]);
  const filteredLibraryItems = useMemo(() => {
    const query = librarySearch.trim().toLowerCase();
    return combinedLibraryItems
      .filter((item) => selectedLibraryBodyPart === "all" || item.bodyPart === selectedLibraryBodyPart)
      .filter((item) => selectedLibraryEquipment === "all" || item.equipment === selectedLibraryEquipment)
      .filter((item) => {
        if (!query) return true;
        return [item.displayName, item.name, ...item.searchTerms].some((value) => value.toLowerCase().includes(query));
      });
  }, [combinedLibraryItems, selectedLibraryBodyPart, selectedLibraryEquipment, librarySearch]);
  const groupedLibraryItems = useMemo(() => {
    const grouped: Array<{ title: string; items: LibraryExercise[] }> = [];
    filteredLibraryItems.slice(0, libraryVisibleLimit).forEach((item) => {
      const title = item.equipment ?? "其他";
      const existing = grouped.find((group) => group.title === title);
      if (existing) {
        existing.items.push(item);
      } else {
        grouped.push({ title, items: [item] });
      }
    });
    return grouped.sort((left, right) => equipmentRank(left.title) - equipmentRank(right.title));
  }, [filteredLibraryItems, libraryVisibleLimit]);

  useEffect(() => {
    if (filteredLibraryItems.length === 0) return;
    if (!selectedLibraryExercise || !filteredLibraryItems.some((item) => item.id === selectedLibraryExercise.id)) {
      setSelectedLibraryExercise(filteredLibraryItems[0]);
    }
  }, [filteredLibraryItems, selectedLibraryExercise]);

  useEffect(() => {
    setLibraryVisibleLimit(24);
  }, [librarySearch, selectedLibraryBodyPart, selectedLibraryEquipment]);

  const loadLibraryPage = useCallback((bodyPart: string, offset: number, append: boolean) => {
    setLibraryLoading(true);
    if (!exerciseLibraryProxyUrl) {
      setLibraryItems(buildLocalExerciseFallback());
      setLibraryTotal(exercises.length);
      setLibraryError("缺少 WorkoutX API key，已显示 APP 本地动作兜底。");
      setLibraryLoading(false);
      return;
    }

    const query = new URLSearchParams({ offset: String(offset) });
    if (bodyPart !== "all") query.set("bodyPart", bodyPart);

    fetch(`${exerciseLibraryBaseUrl}?${query.toString()}`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<WorkoutXListResponse>;
      })
      .then((payload) => {
        const items = normalizeWorkoutXExercises(payload.data ?? payload.results ?? []);
        setLibraryTotal(payload.total ?? items.length);
        setLibraryItems((current) => append ? [...current, ...items] : items);
        setSelectedLibraryExercise((current) => append && current ? current : items[0] ?? null);
        setLibraryError("");
      })
      .catch(() => {
        setLibraryItems(buildLocalExerciseFallback());
        setLibraryTotal(exercises.length);
        setLibraryError("WorkoutX 动作库暂时无法加载，已显示 APP 本地动作兜底。");
      })
      .finally(() => {
        setLibraryLoading(false);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setSupplementalLibraryLoading(true);
    setSupplementalLibraryReady(false);

    loadSupplementalExerciseDataset()
      .then((payload) => {
        if (cancelled) return;
        setSupplementalLibraryItems(normalizeSupplementalExercises(payload));
      })
      .catch(() => {
        if (!cancelled) {
          setLibraryError((current) => current || "本地补充 GIF 动作库暂时无法加载，且远程兜底失败。");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSupplementalLibraryLoading(false);
          setSupplementalLibraryReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedLibraryEquipment("all");
    if (!supplementalLibraryReady) return;
    if (supplementalLibraryItems.length > 0) {
      setLibraryItems([]);
      setLibraryTotal(supplementalLibraryItems.length);
      setLibraryLoading(false);
      return;
    }
    loadLibraryPage(selectedLibraryBodyPart, 0, false);
  }, [loadLibraryPage, selectedLibraryBodyPart, supplementalLibraryItems.length, supplementalLibraryReady]);

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];
    const previewItems = filteredLibraryItems.slice(0, libraryVisibleLimit).filter((item) => item.gifUrl);
    if (previewItems.length === 0) {
      setLibraryThumbUris({});
      return;
    }
    if (Platform.OS !== "web") {
      setLibraryThumbUris(
        previewItems.reduce<Record<string, string>>((result, item) => {
          if (item.gifUrl) result[item.id] = item.gifUrl;
          return result;
        }, {})
      );
      return;
    }

    Promise.all(
      previewItems.map((item) =>
        fetch(item.gifUrl!)
          .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.blob();
          })
          .then((blob) => {
            const objectUrl = URL.createObjectURL(blob);
            objectUrls.push(objectUrl);
            return [item.id, objectUrl] as const;
          })
          .catch(() => [item.id, ""] as const)
      )
    ).then((entries) => {
      if (cancelled) return;
      setLibraryThumbUris(
        entries.reduce<Record<string, string>>((result, [id, uri]) => {
          if (uri) result[id] = uri;
          return result;
        }, {})
      );
    });

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filteredLibraryItems, libraryVisibleLimit]);

  // 宠物提醒
  const activePet: ActivePet = petEnabled
    ? customPet
      ? { kind: "custom", pet: customPet }
      : selectedPetId
        ? { kind: "preset", pet: getPresetPetById(selectedPetId)! }
        : null
    : null;
  const trainingReminder = activePet
    ? generateTrainingReminder(activePet, {
        plannedTitle: todayWorkout?.title ?? null,
        plannedCalories: plannedTrainingCalories,
        status: actualTraining.status,
        actualCalories: actualTraining.calories
      })
    : null;

  const updatePlanSelection = (patch: Partial<typeof todayTrainingPlan>) => {
    const nextPlan = { ...todayTrainingPlan, ...patch };
    const nextFocus = nextPlan.focus ?? recommendedWorkout?.focus ?? preference.preferredMuscleGroups[0] ?? "chest";
    const nextMinutes = nextPlan.minutes ?? recommendedWorkout?.estimatedMinutes ?? preference.minutesPerSession;
    const nextWorkoutForSelection = buildWorkoutForSelection(nextFocus, nextMinutes, preference);
    setTodayTrainingPlan(nextPlan);

    if (actualTraining.status === "done" && actualTraining.text.trim().length === 0) {
      setActualTraining({
        ...actualTraining,
        minutes: nextMinutes,
        calories: estimateTodayWorkoutCalories(nextWorkoutForSelection, profile.weightKg)
      });
    }
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
        : next.status === "done" && next.text.trim().length === 0
          ? plannedTrainingCalories
          : parsedTraining.totalCalories;

    setActualTraining({
      ...next,
      minutes: next.text.trim().length > 0 && parsedTraining.totalMinutes > 0 ? parsedTraining.totalMinutes : next.minutes,
      calories
    });
  };

  const addSelectedLibraryExerciseToPlan = () => {
    if (!selectedLibraryExercise) return;
    const customExercise = buildCustomTrainingExercise(selectedLibraryExercise);
    setTodayTrainingPlan({
      ...todayTrainingPlan,
      customExercises: [
        ...customTrainingExercises.filter((item) => item.id !== customExercise.id),
        customExercise
      ]
    });
  };

  const replacePlanWithSelectedLibraryExercise = () => {
    if (!selectedLibraryExercise) return;
    setTodayTrainingPlan({
      ...todayTrainingPlan,
      customExercises: [buildCustomTrainingExercise(selectedLibraryExercise)]
    });
  };

  const inputStyle = {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    color: colors.ink,
    fontSize: 14,
    height: 44
  } as const;

  return (
    <Screen>
      <ScreenHeader
        kicker="今日训练"
        title="训练"
        subtitle="按真实状态反馈，系统顺延未完成项并联动饮食"
        badge={{ text: hasTrainingFeedback ? "已记录" : "待记录", color: hasTrainingFeedback ? "positive" : "amber" }}
      />

      {/* ===== 宠物提醒 ===== */}
      <PetReminderCard reminder={trainingReminder} />

      {/* ===== 紧凑消耗仪表盘 ===== */}
      <GlassTile glow="accent2" padding={12} style={{ gap: 9 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <Label color={colors.inkMute} variant="label">
            DASHBOARD / 消耗
          </Label>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Badge color={completionPercent >= 1 ? "positive" : completionPercent > 0.5 ? "accent2" : "warn"} size="sm">
              {completionPercent >= 1 ? "已达标" : completionPercent > 0.5 ? "进行中" : "待训练"}
            </Badge>
            <Pressable
              onPress={() => setTrainingCalendarOpen((v) => !v)}
              style={({ pressed }) => ({
                height: 24,
                paddingHorizontal: 9,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.glass,
                borderWidth: 1,
                borderColor: colors.glassBorderBright,
                opacity: pressed ? 0.82 : 1
              })}
            >
              <BentoText weight="semibold" color={colors.accent2} style={{ fontSize: 10 }}>
                {trainingCalendarOpen ? "收起" : "历史"}
              </BentoText>
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "stretch", gap: 6 }}>
          <CompactTrainingMetric label="目标" value={Math.round(plannedTrainingCalories)} unit="kcal" color={colors.accent2} />
          <CompactTrainingMetric label="实际" value={Math.round(actualTraining.calories)} unit="kcal" color={hasTrainingFeedback ? colors.positive : colors.warn} />
          <CompactTrainingMetric
            label="差值"
            value={hasTrainingFeedback ? Math.round(actualTraining.calories - plannedTrainingCalories) : "—"}
            unit={hasTrainingFeedback ? "kcal" : ""}
            color={hasTrainingFeedback ? (actualTraining.calories >= plannedTrainingCalories ? colors.positive : colors.warn) : colors.inkMute}
          />
          <DashboardSelectMetric
            label="部位"
            value={muscleNameMap[selectedFocus]}
            color="accent2"
            compact
            onPress={() => updatePlanSelection({ focus: nextInCycle(focusOptions, selectedFocus) })}
          />
          <DashboardSelectMetric
            label="时长"
            value={`${selectedMinutes}分`}
            color="ink"
            compact
            onPress={() => updatePlanSelection({ minutes: nextInCycle(durationOptions, selectedMinutes) })}
          />
          <DashboardSelectMetric
            label="下次"
            value={muscleNameMap[selectedNextFocus]}
            color="accent"
            compact
            onPress={() => updatePlanSelection({ nextFocus: nextInCycle(focusOptions, selectedNextFocus) })}
          />
        </View>

        <View style={{ height: 5, borderRadius: 999, backgroundColor: colors.glassRaised, overflow: "hidden" }}>
          <View
            style={{
              width: `${Math.max(4, Math.min(100, completionPercent * 100))}%`,
              height: "100%",
              borderRadius: 999,
              backgroundColor: completionPercent >= 0.8 ? colors.positive : colors.warn
            }}
          />
        </View>
      {trainingCalendarOpen ? <CalendarHistoryPanel /> : null}
      </GlassTile>

      {/* ===== 目标训练 ===== */}
      {todayWorkout ? (
        <GlassTile glow="accent2" style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Label color={colors.inkMute} variant="label">
              TARGET / 目标训练
            </Label>
            <Badge color="accent2" size="sm">
              {todayWorkout.exercises.length + customTrainingExercises.length} 个动作
            </Badge>
          </View>
          {customTrainingExercises.map((item) => (
            <CustomTrainingExerciseRow key={item.id} item={item} />
          ))}
          {todayWorkout.exercises.map((item, index) => {
            const exercise = exercises.find((entry) => entry.id === item.exerciseId);
            const muscle = exercise?.primaryMuscleGroup ?? "core";
            const muscleTag = muscleNameMap[muscle].slice(0, 1);
            return (
              <View
                key={`${item.exerciseId}-${index}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 4,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: `${colors.accent2}22`,
                    borderWidth: 1,
                    borderColor: colors.accent2,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BentoText weight="bold" color={colors.accent2} style={{ fontSize: 12 }}>
                    {muscleTag}
                  </BentoText>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <BentoText weight="semibold" variant="caption" color={colors.ink}>
                    {exerciseNameMap[item.exerciseId] ?? item.exerciseId}
                  </BentoText>
                  <BentoText mono color={colors.inkMute} style={{ fontSize: 11 }}>
                    {item.sets} × {item.reps} · {item.minutes} 分钟
                  </BentoText>
                </View>
              </View>
            );
          })}
        </GlassTile>
      ) : null}

      <GlassTile
        glow="accent2"
        style={{
          gap: 12,
          padding: 14,
          backgroundColor: colors.glass,
          borderColor: colors.glassBorderBright
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Label color={colors.inkMute} variant="label">LIBRARY / 动作库</Label>
          <Pressable
            onPress={() => setLibraryOpen((value) => !value)}
            style={({ pressed }) => ({
              height: 28,
              paddingHorizontal: 12,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.glassRaised,
              borderWidth: 1,
              borderColor: colors.glassBorderBright,
              opacity: pressed ? 0.78 : 1
            })}
          >
            <BentoText weight="semibold" style={{ color: colors.positive, fontSize: 11 }}>
              {libraryOpen ? "收起动作库" : "展开动作库"}
            </BentoText>
          </Pressable>
        </View>

        {libraryOpen ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TextInput
                value={librarySearch}
                onChangeText={setLibrarySearch}
                placeholder="输入中英文动作名搜索"
                placeholderTextColor={colors.inkFaint}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 22,
                  paddingHorizontal: 18,
                  backgroundColor: colors.glassRaised,
                  color: colors.ink,
                  fontSize: 14,
                  borderWidth: 0
                }}
              />
              <Pressable
                onPress={addSelectedLibraryExerciseToPlan}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: `${colors.positive}1F`,
                  opacity: pressed ? 0.72 : 1
                })}
              >
                <BentoText weight="bold" style={{ fontSize: 28, color: colors.positive, lineHeight: 30 }}>+</BentoText>
              </Pressable>
            </View>

            {selectedLibraryExercise ? (
              <View style={{ gap: 8, padding: 10, borderRadius: 14, backgroundColor: colors.glassRaised, borderWidth: 1, borderColor: colors.glassBorder }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <BentoText weight="bold" style={{ color: colors.ink, fontSize: 14 }} numberOfLines={1}>
                      {selectedLibraryExercise.displayName}
                    </BentoText>
                    <BentoText variant="micro" style={{ color: colors.inkMute }} numberOfLines={1}>
                      {[selectedLibraryExercise.equipment, selectedLibraryExercise.bodyPart].filter(Boolean).join(" ? ") || "动作库"}
                    </BentoText>
                  </View>
                  <Badge color="accent2" size="sm">已选</Badge>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <LibraryPlanButton label="加入今日训练" onPress={addSelectedLibraryExerciseToPlan} />
                  <LibraryPlanButton label="替换自选动作" onPress={replacePlanWithSelectedLibraryExercise} />
                </View>
              </View>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
              <LibraryEquipmentChip
                label="置顶"
                active={selectedLibraryEquipment === "all"}
                onPress={() => setSelectedLibraryEquipment("all")}
              />
              {libraryEquipmentOptions.map((equipment) => (
                <LibraryEquipmentChip
                  key={equipment}
                  label={equipmentLabels[equipment] ?? equipment}
                  active={selectedLibraryEquipment === equipment}
                  onPress={() => setSelectedLibraryEquipment(equipment)}
                />
              ))}
            </ScrollView>

            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
              <ScrollView
                style={{ width: 62, maxWidth: 62, flexBasis: 62, flexGrow: 0, flexShrink: 0, maxHeight: 580 }}
                contentContainerStyle={{ paddingTop: 2, paddingBottom: 18, gap: 4 }}
                showsVerticalScrollIndicator={false}
              >
                {libraryBodyParts.map((part) => (
                  <LibraryBodyPartTab
                    key={part}
                    label={bodyPartLabels[part] ?? part}
                    active={selectedLibraryBodyPart === part}
                    onPress={() => setSelectedLibraryBodyPart(part)}
                  />
                ))}
              </ScrollView>

              <View style={{ flex: 1, minHeight: 460 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <BentoText weight="bold" style={{ color: colors.ink, fontSize: 15 }}>
                    {selectedLibraryBodyPart === "all" ? "全部动作" : `${bodyPartLabels[selectedLibraryBodyPart] ?? selectedLibraryBodyPart}动作`}
                  </BentoText>
                  <BentoText mono variant="micro" color={colors.positive}>
                    {filteredLibraryItems.length}/{Math.max(libraryTotal, combinedLibraryItems.length)} 项
                  </BentoText>
                </View>

                {libraryError ? (
                  <BentoText variant="caption" color={colors.warn}>{libraryError}</BentoText>
                ) : null}

                {libraryLoading ? (
                  <BentoText variant="caption" color={colors.inkMute}>正在加载动作库...</BentoText>
                ) : (
                  <View style={{ gap: 18, paddingRight: 6 }}>
                    {supplementalLibraryLoading ? (
                      <BentoText variant="micro" color={colors.inkMute}>正在补充内部测试 GIF 动作...</BentoText>
                    ) : null}
                    {groupedLibraryItems.map((group) => (
                      <View key={group.title} style={{ gap: 10 }}>
                        <BentoText weight="bold" style={{ color: colors.ink, fontSize: 24 }}>
                          {equipmentLabels[group.title] ?? group.title}
                        </BentoText>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                          {group.items.map((item) => (
                            <LibraryExerciseCard
                              key={item.id}
                              item={item}
                              active={selectedLibraryExercise?.id === item.id}
                              thumbUri={libraryThumbUris[item.id]}
                              onPress={() => setSelectedLibraryExercise(item)}
                            />
                          ))}
                        </View>
                      </View>
                    ))}
                    {libraryVisibleLimit < filteredLibraryItems.length || libraryItems.length < libraryTotal ? (
                      <Pressable
                        onPress={() => {
                          if (libraryVisibleLimit < filteredLibraryItems.length) {
                            setLibraryVisibleLimit((current) => current + 24);
                            return;
                          }
                          loadLibraryPage(selectedLibraryBodyPart, libraryItems.length, true);
                        }}
                        disabled={libraryLoading}
                        style={({ pressed }) => ({
                          height: 42,
                          borderRadius: 14,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: colors.glassRaised,
                          opacity: pressed || libraryLoading ? 0.72 : 1
                        })}
                      >
                        <BentoText weight="semibold" variant="caption" color={colors.positive}>
                          {libraryLoading ? "加载中..." : libraryVisibleLimit < filteredLibraryItems.length ? "显示更多本地动作" : "远程补充更多"}
                        </BentoText>
                      </Pressable>
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          </>
        ) : null}
      </GlassTile>

      {/* ===== 实际训练 ===== */}
      <GlassTile glow="accent" style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Label color={colors.inkMute} variant="label">
            ACTUAL / 实际训练
          </Label>
          <BentoText mono weight="semibold" color={colors.accent} style={{ fontSize: 13 }}>
            {Math.round(actualTraining.calories)} kcal
          </BentoText>
        </View>

        {/* 快捷状态 */}
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
                  minutes: item.value === "done" ? todayWorkout?.estimatedMinutes ?? selectedMinutes : actualTraining.minutes
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
            targetCalories={plannedTrainingCalories}
            minutes={actualTraining.minutes}
            fatigue={actualTraining.fatigue}
            inputStyle={inputStyle}
            onTextChange={(text) => updateActualTraining({ status: text.trim() ? "changed" : "pending", text })}
            onMinutesChange={(minutes) => updateActualTraining({ status: "changed", minutes })}
            onFatigueChange={(fatigue) => updateActualTraining({ fatigue })}
          />
        ) : (
          <BentoText variant="caption" color={colors.warn}>
            今天休息，未完成的训练会自动顺延到下一次
          </BentoText>
        )}
      </GlassTile>
    </Screen>
  );
}

function LibraryBodyPartTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 42,
        paddingHorizontal: 6,
        justifyContent: "center",
        borderLeftWidth: 5,
        borderLeftColor: active ? colors.positive : "transparent",
        backgroundColor: "transparent",
        opacity: pressed ? 0.72 : 1
      })}
    >
      <BentoText
        weight={active ? "bold" : "medium"}
        style={{ color: active ? colors.ink : colors.inkMute, fontSize: 15 }}
        numberOfLines={1}
      >
        {label}
      </BentoText>
    </Pressable>
  );
}

function LibraryEquipmentChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: 92,
        height: 42,
        paddingHorizontal: 18,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? colors.glassRaised : colors.glass,
        opacity: pressed ? 0.76 : 1
      })}
    >
      <BentoText weight="bold" variant="caption" style={{ color: active ? colors.positive : `${colors.positive}CC` }} numberOfLines={1}>
        {label}
      </BentoText>
    </Pressable>
  );
}

function LibraryExerciseCard({
  item,
  active,
  thumbUri,
  onPress
}: {
  item: LibraryExercise;
  active: boolean;
  thumbUri?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: "47%",
        minHeight: 166,
        borderRadius: 16,
        padding: 10,
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: active ? colors.glassRaised : colors.glass,
        borderWidth: active ? 1 : 0,
        borderColor: colors.positive,
        opacity: pressed ? 0.78 : 1
      })}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          minWidth: 40,
          height: 28,
          paddingHorizontal: 8,
          borderTopLeftRadius: 16,
          borderBottomRightRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.positive
        }}
      >
        <BentoText weight="bold" variant="micro" style={{ color: colors.bg }}>
          讲解
        </BentoText>
      </View>
      <View
        style={{
          width: 76,
          height: 76,
          marginTop: 12,
          borderRadius: 38,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${colors.ink}E8`
        }}
      >
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} resizeMode="cover" style={{ width: 76, height: 76 }} />
        ) : (
          <BentoText variant="micro" color={colors.inkFaint}>GIF</BentoText>
        )}
      </View>
      <BentoText weight="medium" style={{ color: colors.ink, fontSize: 14, textAlign: "center", lineHeight: 19 }} numberOfLines={2}>
        {item.displayName}
      </BentoText>
    </Pressable>
  );
}

function LibraryPlanButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 34,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.glassRaised,
        borderWidth: 1,
        borderColor: colors.glassBorderBright,
        opacity: pressed ? 0.76 : 1
      })}
    >
      <BentoText weight="bold" variant="micro" style={{ color: colors.positive }} numberOfLines={1}>
        {label}
      </BentoText>
    </Pressable>
  );
}

function CustomTrainingExerciseRow({ item }: { item: TodayTrainingCustomExercise }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 5,
        paddingHorizontal: 6,
        borderRadius: 12,
        backgroundColor: `${colors.accent2}10`,
        borderWidth: 1,
        borderColor: `${colors.accent2}33`
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: `${colors.accent2}22`,
          borderWidth: 1,
          borderColor: colors.accent2,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <BentoText weight="bold" color={colors.accent2} style={{ fontSize: 12 }}>
          库
        </BentoText>
      </View>
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <BentoText weight="semibold" variant="caption" color={colors.ink} numberOfLines={1}>
          {localizeExerciseName({ name: item.name, equipment: item.equipment, bodyPart: item.bodyPart, source: item.source })}
        </BentoText>
        <BentoText mono color={colors.inkMute} style={{ fontSize: 11 }} numberOfLines={1}>
          {item.sets} x {item.reps} · {item.minutes} min · {[item.equipment, item.bodyPart].filter(Boolean).join(" / ") || item.source}
        </BentoText>
      </View>
    </View>
  );
}

function ActualTrainingInputSection({
  text,
  parsed,
  actualCalories,
  targetCalories,
  minutes,
  fatigue,
  inputStyle,
  onTextChange,
  onMinutesChange,
  onFatigueChange
}: {
  text: string;
  parsed: ParsedTrainingText;
  actualCalories: number;
  targetCalories: number;
  minutes: number;
  fatigue: number;
  inputStyle: StyleProp<TextStyle>;
  onTextChange: (text: string) => void;
  onMinutesChange: (minutes: number) => void;
  onFatigueChange: (fatigue: number) => void;
}) {
  const diff = Math.round(actualCalories - targetCalories);

  return (
    <View style={{ gap: 10 }}>
      <TextInput
        value={text}
        onChangeText={onTextChange}
        placeholder="例如：跑步30分钟，卧推60kg 5组，深蹲4组，最后拉伸10分钟"
        placeholderTextColor={colors.inkFaint}
        style={[inputStyle, { minHeight: 74, textAlignVertical: "top", paddingVertical: 12 }]}
        multiline
      />

      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Badge color="accent" size="sm">{`实际 ${Math.round(actualCalories)} kcal`}</Badge>
        <Badge color={diff >= 0 ? "positive" : "warn"} size="sm">{`差值 ${diff >= 0 ? "+" : ""}${diff} kcal`}</Badge>
        <Badge color="accent2" size="sm">{`识别 ${parsed.matched.length} 个动作`}</Badge>
        <Badge color="accent2" size="sm">{`总时长 ${parsed.totalMinutes || minutes} 分钟`}</Badge>
      </View>

      {parsed.matched.length > 0 ? (
        <View style={{ gap: 6 }}>
          {parsed.matched.map((item, index) => (
            <View
              key={`${item.exercise.id}-${index}`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingVertical: 7,
                paddingHorizontal: 9,
                borderRadius: 12,
                backgroundColor: `${colors.accent}12`,
                borderWidth: 1,
                borderColor: `${colors.accent}33`
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <BentoText weight="semibold" variant="caption" color={colors.ink} numberOfLines={1}>
                  {item.exercise.name}
                </BentoText>
                <BentoText mono variant="micro" color={colors.inkMute}>
                  {item.minutes} 分钟 · MET {Math.round(item.exercise.met * item.intensityMultiplier * 10) / 10}
                </BentoText>
              </View>
              <BentoText mono weight="bold" color={colors.accent} style={{ fontSize: 12 }}>
                {item.calories} kcal
              </BentoText>
            </View>
          ))}
        </View>
      ) : text.trim() ? (
        <BentoText variant="caption" color={colors.warn}>
          暂未识别到具体动作，会按目标训练平均强度估算。建议写成“动作 + 分钟/组数”，例如“跑步30分钟、卧推5组”。
        </BentoText>
      ) : null}

      {parsed.unmatched.length > 0 && parsed.matched.length > 0 ? (
        <BentoText variant="micro" color={colors.inkMute}>
          未识别：{parsed.unmatched.join("、")}
        </BentoText>
      ) : null}

      <BentoRow>
        <BentoTile flex={1}>
          <LabeledInput
            label="实际分钟"
            keyboardType="numeric"
            value={String(minutes)}
            onChangeText={(value) => onMinutesChange(Number(value) || 0)}
          />
        </BentoTile>
        <BentoTile flex={1}>
          <LabeledInput
            label="疲劳 1-5"
            keyboardType="numeric"
            value={String(fatigue)}
            onChangeText={(value) => onFatigueChange(Math.max(1, Math.min(5, Number(value) || 1)))}
          />
        </BentoTile>
      </BentoRow>
    </View>
  );
}

function LibraryEquipmentRail({ options }: { options: string[] }) {
  const text = options.slice(0, 9).map((item) => equipmentLabels[item] ?? item).join("");
  if (!text) return null;
  return (
    <View style={{ width: 20, alignItems: "center", paddingTop: 132 }}>
      <BentoText weight="bold" style={{ color: colors.positive, fontSize: 12, lineHeight: 22, textAlign: "center" }}>
        {text.split("").join("\n")}
      </BentoText>
    </View>
  );
}

function CompactTrainingMetric({ label, value, unit, color }: { label: string; value: number | string; unit: string; color: string }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 38,
        justifyContent: "center",
        gap: 1,
        paddingHorizontal: 7,
        borderRadius: radius.md,
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassBorder
      }}
    >
      <BentoText variant="micro" color={colors.inkMute} numberOfLines={1}>
        {label}
      </BentoText>
      <BentoText mono weight="bold" color={color} style={{ fontSize: 13 }} numberOfLines={1}>
        {value}{unit ? <BentoText mono color={color} style={{ fontSize: 9 }}> {unit}</BentoText> : null}
      </BentoText>
    </View>
  );
}

function DashboardSelectMetric({ label, value, color, onPress, compact = false }: { label: string; value: string; color: SemanticColor | "ink"; onPress: () => void; compact?: boolean }) {
  const textColor = color === "ink" ? colors.ink : colors[color];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: compact ? 38 : 42,
        justifyContent: "center",
        alignItems: "center",
        gap: compact ? 1 : 2,
        paddingHorizontal: compact ? 4 : 0,
        borderRadius: radius.md,
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        opacity: pressed ? 0.76 : 1
      })}
    >
      <BentoText variant="micro" color={colors.inkMute}>
        {label}
      </BentoText>
      <BentoText mono weight="bold" color={textColor} style={{ fontSize: compact ? 12 : 14 }} numberOfLines={1}>
        {value}
      </BentoText>
    </Pressable>
  );
}

function normalizeWorkoutXExercises(items: WorkoutXExercise[]): LibraryExercise[] {
  return items.map((item, index) => {
    const primaryMuscles = arrayOrSingle(item.primaryMuscles).length > 0
      ? arrayOrSingle(item.primaryMuscles)
      : [item.target, item.bodyPart].filter(Boolean) as string[];
    const name = item.name ?? "Unnamed Exercise";
    const equipment = item.equipment ?? null;
    const category = item.category ?? item.bodyPart ?? null;
    const bodyPart = item.bodyPart ?? null;
    const secondaryMuscles = arrayOrSingle(item.secondaryMuscles);
    return {
      id: item.id ?? item.exerciseId ?? `${item.name ?? "workoutx"}-${index}`,
      name,
      displayName: localizeExerciseName({
        name,
        equipment,
        category,
        bodyPart,
        primaryMuscles,
        secondaryMuscles
      }),
      searchTerms: buildExerciseSearchTerms({
        name,
        equipment,
        category,
        bodyPart,
        primaryMuscles,
        secondaryMuscles
      }),
      source: "workoutx",
      sourceId: item.id ?? item.exerciseId ?? `${item.name ?? "workoutx"}-${index}`,
      license: "WorkoutX API",
      mediaType: item.gifUrl || item.videoUrl ? "gif" : "none",
      level: item.level ?? item.difficulty ?? null,
      equipment,
      category,
      bodyPart,
      gifUrl: item.gifUrl ?? item.videoUrl ?? null,
      primaryMuscles,
      secondaryMuscles,
      instructions: Array.isArray(item.instructions)
        ? item.instructions
        : item.instructions
          ? [item.instructions]
          : []
    };
  });
}

function loadSupplementalExerciseDataset() {
  return fetch(localSupplementalExerciseDatasetUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<SupplementalExerciseManifest>;
    })
    .then((manifest) => manifest.items ?? [])
    .catch(() =>
      fetch(supplementalExerciseDatasetUrl)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json() as Promise<SupplementalExercise[]>;
        })
    );
}

function normalizeSupplementalExercises(items: SupplementalExercise[]): LibraryExercise[] {
  return items.map((item, index) => {
    const sourceId = item.id ?? `research-gif-${index}`;
    const gifUrl = resolveSupplementalAssetUrl(item.gif_url);
    const imageUrl = resolveSupplementalAssetUrl(item.image);
    const name = item.name ?? "Unnamed Exercise";
    const equipment = normalizeExerciseEquipment(item.equipment);
    const category = normalizeExerciseBodyPart(item.category ?? item.body_part);
    const bodyPart = normalizeExerciseBodyPart(item.body_part ?? item.category);
    const primaryMuscles = [item.target, item.muscle_group, item.body_part].filter(Boolean) as string[];
    const secondaryMuscles = arrayOrSingle(item.secondary_muscles);
    return {
      id: `research-gif-${sourceId}`,
      name,
      displayName: localizeExerciseName({
        name,
        equipment,
        category,
        bodyPart,
        primaryMuscles,
        secondaryMuscles
      }),
      searchTerms: buildExerciseSearchTerms({
        name,
        equipment,
        category,
        bodyPart,
        primaryMuscles,
        secondaryMuscles
      }),
      source: "research-gif-dataset",
      sourceId,
      license: "Research/internal non-commercial dataset",
      mediaType: gifUrl ? "gif" : imageUrl ? "image" : "none",
      level: "research",
      equipment,
      category,
      bodyPart,
      gifUrl: gifUrl ?? imageUrl,
      primaryMuscles,
      secondaryMuscles,
      instructions: item.instruction_steps?.en ?? (item.instructions?.en ? [item.instructions.en] : [])
    };
  });
}

function resolveSupplementalAssetUrl(value: string | null | undefined) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) return value;
  return `${supplementalExerciseAssetBaseUrl}${value}`;
}

function mergeExerciseLibraries(primary: LibraryExercise[], supplemental: LibraryExercise[]) {
  const seen = new Set<string>();
  const result: LibraryExercise[] = [];

  [...primary, ...supplemental].forEach((item) => {
    const key = `${item.name.toLowerCase().trim()}::${(item.equipment ?? "").toLowerCase().trim()}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });

  return result;
}

function buildLocalExerciseFallback(): LibraryExercise[] {
  return exercises.map((item) => ({
    id: item.id,
    name: item.name,
    displayName: item.name,
    searchTerms: buildExerciseSearchTerms({
      name: item.name,
      equipment: item.equipment.join(" / "),
      category: muscleNameMap[item.primaryMuscleGroup] ?? item.primaryMuscleGroup,
      bodyPart: muscleNameMap[item.primaryMuscleGroup] ?? item.primaryMuscleGroup,
      primaryMuscles: [item.primaryMuscleGroup],
      secondaryMuscles: []
    }),
    source: "local",
    sourceId: item.id,
    license: "APP built-in",
    mediaType: "none",
    level: "app",
    equipment: item.equipment.join(" / "),
    category: "local fallback",
    bodyPart: muscleNameMap[item.primaryMuscleGroup] ?? item.primaryMuscleGroup,
    gifUrl: null,
    primaryMuscles: [item.primaryMuscleGroup],
    secondaryMuscles: [],
    instructions: item.aliases.length > 0 ? [`别名：${item.aliases.join("、")}`] : []
  }));
}

function buildCustomTrainingExercise(item: LibraryExercise): TodayTrainingCustomExercise {
  return {
    id: `library-${item.id}`,
    name: item.displayName,
    source: item.source,
    equipment: item.equipment,
    bodyPart: item.bodyPart,
    minutes: 8,
    sets: 3,
    reps: item.bodyPart === "Cardio" ? "8 min" : "10-12"
  };
}

function buildTrainingTextReferences(customExercises: TodayTrainingCustomExercise[], libraryItems: LibraryExercise[]): TrainingTextExercise[] {
  const customReferences = customExercises.map((item) => ({
    id: item.id,
    name: item.name,
    aliases: [item.name],
    primaryMuscleGroup: normalizeMuscleGroupFromBodyPart(item.bodyPart),
    met: estimateMetFromBodyPart(item.bodyPart)
  }));
  const libraryReferences = libraryItems.map((item) => ({
    id: item.id,
    name: item.displayName,
    aliases: [item.name, item.displayName, ...item.searchTerms],
    primaryMuscleGroup: normalizeMuscleGroupFromBodyPart(item.bodyPart ?? item.category),
    met: estimateMetFromBodyPart(item.bodyPart ?? item.category)
  }));
  return [...customReferences, ...libraryReferences];
}

function normalizeMuscleGroupFromBodyPart(value: string | null | undefined): MuscleGroup {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("chest") || normalized.includes("胸")) return "chest";
  if (normalized.includes("back") || normalized.includes("背")) return "back";
  if (normalized.includes("shoulder") || normalized.includes("肩")) return "shoulders";
  if (normalized.includes("arm") || normalized.includes("臂")) return "arms";
  if (normalized.includes("leg") || normalized.includes("腿") || normalized.includes("glute") || normalized.includes("臀")) return "legs";
  if (normalized.includes("cardio") || normalized.includes("有氧")) return "cardio";
  return "core";
}

function estimateMetFromBodyPart(value: string | null | undefined): number {
  const muscle = normalizeMuscleGroupFromBodyPart(value);
  if (muscle === "cardio") return 7.5;
  if (muscle === "legs" || muscle === "back") return 6.5;
  if (muscle === "chest" || muscle === "shoulders") return 5.8;
  if (muscle === "arms") return 4.5;
  return 4.8;
}

function normalizeExerciseBodyPart(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  const map: Record<string, string> = {
    chest: "Chest",
    back: "Back",
    shoulders: "Shoulders",
    shoulder: "Shoulders",
    "upper arms": "Upper Arms",
    arms: "Upper Arms",
    "lower arms": "Lower Arms",
    forearms: "Lower Arms",
    waist: "Waist",
    core: "Waist",
    abs: "Waist",
    "upper legs": "Upper Legs",
    legs: "Upper Legs",
    "lower legs": "Lower Legs",
    cardio: "Cardio",
    neck: "Neck"
  };
  return map[normalized] ?? value;
}

function normalizeExerciseEquipment(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  const map: Record<string, string> = {
    barbell: "Barbell",
    dumbbell: "Dumbbell",
    kettlebell: "Kettlebell",
    cable: "Cable",
    machine: "Machine",
    "leverage machine": "Leverage Machine",
    "body weight": "Body Weight",
    bodyweight: "Body Weight",
    assisted: "Assisted",
    band: "Band",
    "resistance band": "Band"
  };
  return map[normalized] ?? value;
}

function arrayOrSingle(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function equipmentRank(equipment: string) {
  const index = equipmentPriority.findIndex((item) => item === equipment);
  return index === -1 ? equipmentPriority.length + 1 : index;
}

function buildWorkoutForSelection(focus: MuscleGroup, minutes: number, preference: { equipment: string[]; cardioRatio: number }) {
  return buildTrainingQueue(exercises, {
    daysPerWeek: 1,
    minutesPerSession: minutes,
    equipment: preference.equipment,
    preferredMuscleGroups: [focus],
    cardioRatio: focus === "cardio" ? 1 : preference.cardioRatio
  })[0];
}

function nextInCycle<T>(items: T[], current: T): T {
  const index = items.indexOf(current);
  return items[(index + 1) % items.length] ?? current;
}
