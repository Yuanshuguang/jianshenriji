import { exercises, type MuscleGroup } from "@fitness-calendar/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, TextInput, View } from "react-native";
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
  ProgressRing,
  Screen,
  ScreenHeader,
  SelectChip,
  Text as BentoText,
  radius,
  type SemanticColor
} from "../../components/bento";
import {
  estimateActualTrainingCalories,
  estimateTodayWorkoutCalories,
  exerciseNameMap,
  muscleNameMap
} from "../../features/today-plan";
import { type ActualTrainingStatus, buildTrainingQueue, type TodayTrainingCustomExercise, useFitnessStore } from "../../store/fitness-store";

const statusOptions: Array<{ value: ActualTrainingStatus; label: string; color: SemanticColor }> = [
  { value: "done", label: "完成计划", color: "positive" },
  { value: "missed", label: "今天没练", color: "warn" },
  { value: "changed", label: "改练了", color: "accent2" }
];
const focusOptions: MuscleGroup[] = ["chest", "back", "legs", "shoulders", "arms", "core", "cardio"];
const durationOptions = [30, 45, 60, 75, 90];
const exerciseLibraryBaseUrl = "https://api.workoutxapp.com/v1/exercises";
const localSupplementalExerciseDatasetUrl = "/exercise-library/manifest.json";
const supplementalExerciseDatasetUrl = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";
const supplementalExerciseAssetBaseUrl = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";
const workoutXApiKey = process.env.EXPO_PUBLIC_WORKOUTX_API_KEY ?? "";
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
        return [
          item.name,
          item.equipment ?? "",
          item.category ?? "",
          item.bodyPart ?? "",
          ...item.primaryMuscles,
          ...item.secondaryMuscles
        ].some((value) => value.toLowerCase().includes(query));
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
    if (!workoutXApiKey) {
      setLibraryItems(buildLocalExerciseFallback());
      setLibraryTotal(exercises.length);
      setLibraryError("缺少 WorkoutX API key，已显示 APP 本地动作兜底。");
      setLibraryLoading(false);
      return;
    }

    const query = new URLSearchParams({ offset: String(offset) });
    if (bodyPart !== "all") query.set("bodyPart", bodyPart);

    fetch(`${exerciseLibraryBaseUrl}?${query.toString()}`, {
      headers: {
        "X-WorkoutX-Key": workoutXApiKey
      }
    })
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

    Promise.all(
      previewItems.map((item) =>
        fetch(item.gifUrl!, {
          headers: item.source === "workoutx" && workoutXApiKey
            ? { "X-WorkoutX-Key": workoutXApiKey }
            : undefined
        })
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
    const calories =
      next.status === "missed"
        ? 0
        : next.status === "done" && next.text.trim().length === 0
          ? plannedTrainingCalories
          : estimateActualTrainingCalories(next.text, next.minutes, profile.weightKg, todayWorkout);

    setActualTraining({
      ...next,
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

      {/* ===== 双环仪表盘 ===== */}
      <GlassTile glow="accent2" style={{ gap: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Label color={colors.inkMute} variant="label">
            DASHBOARD / 消耗仪表盘
          </Label>
          <Badge color={completionPercent >= 1 ? "positive" : completionPercent > 0.5 ? "accent2" : "warn"} size="sm">
            {completionPercent >= 1 ? "已达标" : completionPercent > 0.5 ? "进行中" : "待训练"}
          </Badge>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Pressable
            onPress={() => setTrainingCalendarOpen((v) => !v)}
            style={({ pressed }) => ({
              height: 26,
              paddingHorizontal: 10,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.glass,
              borderWidth: 1,
              borderColor: colors.glassBorderBright,
              opacity: pressed ? 0.82 : 1
            })}
          >
            <BentoText weight="semibold" color={colors.accent2} style={{ fontSize: 11 }}>
              {trainingCalendarOpen ? "收起日历" : "历史日历"}
            </BentoText>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center", gap: 8 }}>
          {/* 目标消耗环 */}
          <View style={{ alignItems: "center", gap: 6 }}>
            <View style={{
              width: 112,
              height: 112,
              borderRadius: 56,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(167,139,250,0.06)",
              borderWidth: 1,
              borderColor: "rgba(167,139,250,0.18)"
            }}>
              <ProgressRing
                size={96}
                stroke={10}
                percent={1}
                value={String(Math.round(plannedTrainingCalories))}
                label="目标 kcal"
                color="accent2"
                trackColor="rgba(167,139,250,0.18)"
              />
            </View>
            <BentoText variant="micro" color={colors.inkMute}>
              今日目标
            </BentoText>
          </View>

          {/* 实际消耗环 */}
          <View style={{ alignItems: "center", gap: 6 }}>
            <View style={{
              width: 112,
              height: 112,
              borderRadius: 56,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: completionPercent >= 0.8 ? "rgba(52,211,153,0.08)" : "rgba(251,113,133,0.06)",
              borderWidth: 1,
              borderColor: completionPercent >= 0.8 ? "rgba(52,211,153,0.22)" : "rgba(251,113,133,0.18)"
            }}>
              <ProgressRing
                size={96}
                stroke={10}
                percent={completionPercent}
                value={String(Math.round(actualTraining.calories))}
                label={hasTrainingFeedback ? "实际 kcal" : "待记录"}
                color={completionPercent >= 0.8 ? "positive" : "warn"}
                trackColor={completionPercent >= 0.8 ? "rgba(52,211,153,0.16)" : "rgba(251,113,133,0.14)"}
              />
            </View>
            <BentoText variant="micro" color={colors.inkMute}>
              实际消耗
            </BentoText>
          </View>
        </View>

        {/* 底部信息行 */}
        <View style={{ flexDirection: "row", justifyContent: "space-around", paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.glassBorder }}>
          <View style={{ alignItems: "center", gap: 2, flex: 1 }}>
            <BentoText variant="micro" color={colors.inkMute}>
              完成情况
            </BentoText>
            <BentoText mono weight="bold" color={hasTrainingFeedback ? (actualTraining.calories >= plannedTrainingCalories ? colors.positive : colors.warn) : colors.inkMute} style={{ fontSize: 14 }}>
              {hasTrainingFeedback ? `${actualTraining.calories - plannedTrainingCalories >= 0 ? "+" : ""}${Math.round(actualTraining.calories - plannedTrainingCalories)}` : "—"}
            </BentoText>
          </View>
          <View style={{ width: 1, backgroundColor: colors.glassBorder }} />
          <DashboardSelectMetric
            label="今日部位"
            value={muscleNameMap[selectedFocus]}
            color="accent2"
            onPress={() => updatePlanSelection({ focus: nextInCycle(focusOptions, selectedFocus) })}
          />
          <View style={{ width: 1, backgroundColor: colors.glassBorder }} />
          <DashboardSelectMetric
            label="时长"
            value={`${selectedMinutes}分`}
            color="ink"
            onPress={() => updatePlanSelection({ minutes: nextInCycle(durationOptions, selectedMinutes) })}
          />
          <View style={{ width: 1, backgroundColor: colors.glassBorder }} />
          <DashboardSelectMetric
            label="下一次"
            value={`${muscleNameMap[selectedNextFocus]}训练`}
            color="accent"
            onPress={() => updatePlanSelection({ nextFocus: nextInCycle(focusOptions, selectedNextFocus) })}
          />
        </View>
      {trainingCalendarOpen ? <CalendarHistoryPanel /> : null}
      </GlassTile>

      <GlassTile
        glow="accent2"
        style={{
          gap: 12,
          padding: 14,
          backgroundColor: "#222329",
          borderColor: "#34363d"
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
              backgroundColor: "#3a3b42",
              borderWidth: 1,
              borderColor: "#4b4d55",
              opacity: pressed ? 0.78 : 1
            })}
          >
            <BentoText weight="semibold" style={{ color: "#58d774", fontSize: 11 }}>
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
                placeholder="输入动作名字搜索"
                placeholderTextColor="#a3a4aa"
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 22,
                  paddingHorizontal: 18,
                  backgroundColor: "#3a3b42",
                  color: "#f7f7f9",
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
                  backgroundColor: "#2f3732",
                  opacity: pressed ? 0.72 : 1
                })}
              >
                <BentoText weight="bold" style={{ fontSize: 28, color: "#58d774", lineHeight: 30 }}>+</BentoText>
              </Pressable>
            </View>

            {selectedLibraryExercise ? (
              <View style={{ gap: 8, padding: 10, borderRadius: 14, backgroundColor: "#303138", borderWidth: 1, borderColor: "#3f4149" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <BentoText weight="bold" style={{ color: "#f7f7f9", fontSize: 14 }} numberOfLines={1}>
                      {selectedLibraryExercise.name}
                    </BentoText>
                    <BentoText variant="micro" style={{ color: "#a3a4aa" }} numberOfLines={1}>
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
                  <BentoText weight="bold" style={{ color: "#f7f7f9", fontSize: 15 }}>
                    {selectedLibraryBodyPart === "all" ? "全部动作" : `${bodyPartLabels[selectedLibraryBodyPart] ?? selectedLibraryBodyPart}动作`}
                  </BentoText>
                  <BentoText mono variant="micro" color="#58d774">
                    {filteredLibraryItems.length}/{Math.max(libraryTotal, combinedLibraryItems.length)} 项
                  </BentoText>
                </View>

                {libraryError ? (
                  <BentoText variant="caption" color={colors.warn}>{libraryError}</BentoText>
                ) : null}

                {libraryLoading ? (
                  <BentoText variant="caption" color="#a3a4aa">正在加载动作库...</BentoText>
                ) : (
                  <View style={{ gap: 18, paddingRight: 6 }}>
                    {supplementalLibraryLoading ? (
                      <BentoText variant="micro" color="#a3a4aa">正在补充内部测试 GIF 动作...</BentoText>
                    ) : null}
                    {groupedLibraryItems.map((group) => (
                      <View key={group.title} style={{ gap: 10 }}>
                        <BentoText weight="bold" style={{ color: "#f7f7f9", fontSize: 24 }}>
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
                          backgroundColor: "#303138",
                          opacity: pressed || libraryLoading ? 0.72 : 1
                        })}
                      >
                        <BentoText weight="semibold" variant="caption" color="#58d774">
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

      {/* ===== 训练计划 ===== */}
      {todayWorkout ? (
        <GlassTile glow="accent2" style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Label color={colors.inkMute} variant="label">
              PLAN / 今日训练计划
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

        {/* 状态切换 */}
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
          <View style={{ gap: 10 }}>
            <TextInput
              value={actualTraining.text}
              onChangeText={(text) => updateActualTraining({ status: "changed", text })}
              placeholder="例如：跑步30分钟、卧推60kg 5组、深蹲40分钟"
              placeholderTextColor={colors.inkFaint}
              style={[inputStyle, { height: 56, textAlignVertical: "top", paddingVertical: 12 }]}
              multiline
            />
            <BentoRow>
              <BentoTile flex={1}>
                <LabeledInput
                  label="实际分钟"
                  keyboardType="numeric"
                  value={String(actualTraining.minutes)}
                  onChangeText={(text) => updateActualTraining({ status: "changed", minutes: Number(text) || 0 })}
                />
              </BentoTile>
              <BentoTile flex={1}>
                <LabeledInput
                  label="疲劳 1-5"
                  keyboardType="numeric"
                  value={String(actualTraining.fatigue)}
                  onChangeText={(text) => updateActualTraining({ fatigue: Math.max(1, Math.min(5, Number(text) || 1)) })}
                />
              </BentoTile>
            </BentoRow>
          </View>
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
        borderLeftColor: active ? "#58d774" : "transparent",
        backgroundColor: "transparent",
        opacity: pressed ? 0.72 : 1
      })}
    >
      <BentoText
        weight={active ? "bold" : "medium"}
        style={{ color: active ? "#f7f7f9" : "#a3a4aa", fontSize: 15 }}
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
        backgroundColor: active ? "#4a4b52" : "#3a3b42",
        opacity: pressed ? 0.76 : 1
      })}
    >
      <BentoText weight="bold" variant="caption" style={{ color: active ? "#58d774" : "#7fd88e" }} numberOfLines={1}>
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
        backgroundColor: active ? "#373a3d" : "#303138",
        borderWidth: active ? 1 : 0,
        borderColor: "#58d774",
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
          backgroundColor: "#58d774"
        }}
      >
        <BentoText weight="bold" variant="micro" style={{ color: "#17311d" }}>
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
          backgroundColor: "#f4f4f5"
        }}
      >
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} resizeMode="cover" style={{ width: 76, height: 76 }} />
        ) : (
          <BentoText variant="micro" color="#74767d">GIF</BentoText>
        )}
      </View>
      <BentoText weight="medium" style={{ color: "#f7f7f9", fontSize: 14, textAlign: "center", lineHeight: 19 }} numberOfLines={2}>
        {item.name}
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
        backgroundColor: "#3a3b42",
        borderWidth: 1,
        borderColor: "#4b4d55",
        opacity: pressed ? 0.76 : 1
      })}
    >
      <BentoText weight="bold" variant="micro" style={{ color: "#58d774" }} numberOfLines={1}>
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
          {item.name}
        </BentoText>
        <BentoText mono color={colors.inkMute} style={{ fontSize: 11 }} numberOfLines={1}>
          {item.sets} x {item.reps} · {item.minutes} min · {[item.equipment, item.bodyPart].filter(Boolean).join(" / ") || item.source}
        </BentoText>
      </View>
    </View>
  );
}

function LibraryEquipmentRail({ options }: { options: string[] }) {
  const text = options.slice(0, 9).map((item) => equipmentLabels[item] ?? item).join("");
  if (!text) return null;
  return (
    <View style={{ width: 20, alignItems: "center", paddingTop: 132 }}>
      <BentoText weight="bold" style={{ color: "#58d774", fontSize: 12, lineHeight: 22, textAlign: "center" }}>
        {text.split("").join("\n")}
      </BentoText>
    </View>
  );
}

function DashboardSelectMetric({ label, value, color, onPress }: { label: string; value: string; color: SemanticColor | "ink"; onPress: () => void }) {
  const textColor = color === "ink" ? colors.ink : colors[color];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 42,
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
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
      <BentoText mono weight="bold" color={textColor} style={{ fontSize: 14 }} numberOfLines={1}>
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
    return {
      id: item.id ?? item.exerciseId ?? `${item.name ?? "workoutx"}-${index}`,
      name: item.name ?? "Unnamed Exercise",
      source: "workoutx",
      sourceId: item.id ?? item.exerciseId ?? `${item.name ?? "workoutx"}-${index}`,
      license: "WorkoutX API",
      mediaType: item.gifUrl || item.videoUrl ? "gif" : "none",
      level: item.level ?? item.difficulty ?? null,
      equipment: item.equipment ?? null,
      category: item.category ?? item.bodyPart ?? null,
      bodyPart: item.bodyPart ?? null,
      gifUrl: item.gifUrl ?? item.videoUrl ?? null,
      primaryMuscles,
      secondaryMuscles: arrayOrSingle(item.secondaryMuscles),
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
    return {
      id: `research-gif-${sourceId}`,
      name: item.name ?? "Unnamed Exercise",
      source: "research-gif-dataset",
      sourceId,
      license: "Research/internal non-commercial dataset",
      mediaType: gifUrl ? "gif" : imageUrl ? "image" : "none",
      level: "research",
      equipment: normalizeExerciseEquipment(item.equipment),
      category: normalizeExerciseBodyPart(item.category ?? item.body_part),
      bodyPart: normalizeExerciseBodyPart(item.body_part ?? item.category),
      gifUrl: gifUrl ?? imageUrl,
      primaryMuscles: [item.target, item.muscle_group, item.body_part].filter(Boolean) as string[],
      secondaryMuscles: arrayOrSingle(item.secondary_muscles),
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
    name: item.name,
    source: item.source,
    equipment: item.equipment,
    bodyPart: item.bodyPart,
    minutes: 8,
    sets: 3,
    reps: item.bodyPart === "Cardio" ? "8 min" : "10-12"
  };
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
