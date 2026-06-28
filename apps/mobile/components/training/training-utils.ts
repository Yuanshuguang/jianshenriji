import { exercises as sharedExercises, generateTrainingQueue, muscleGroupLabels, type MuscleGroup, type WorkoutPlan } from "@fitness-calendar/shared";
import { Platform } from "react-native";
import type { LibraryExercise, SupplementalExercise, SupplementalExerciseManifest, WorkoutXExercise } from "../../types/training";
import type { TodayTrainingCustomExercise, TrainingPreferenceDraft } from "../../store/fitness-store";
import type { TrainingTextExercise } from "../../features/today-plan";
import { buildExerciseSearchTerms, localizeExerciseName } from "../../features/exercise-localization";

const MAX_SUPPLEMENTAL_EXERCISES = 2000;
const MAX_EXERCISE_FIELD_LENGTH = 240;
const MAX_INSTRUCTIONS = 20;

const dataSourceRank: Record<LibraryExercise["source"], number> = {
  workoutx: 0,
  "research-gif-dataset": 1,
  local: 2,
};

const equipmentOrder = [
  "Barbell",
  "Dumbbell",
  "Kettlebell",
  "Cable",
  "Machine",
  "Leverage Machine",
  "Body Weight",
  "Assisted",
  "Band",
];

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || value === undefined || typeof value === "string";
}

function safeString(value: unknown, fallback: string | null = null): string | null {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return fallback;
  return value.length > MAX_EXERCISE_FIELD_LENGTH ? value.slice(0, MAX_EXERCISE_FIELD_LENGTH) : value;
}

function safeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .slice(0, MAX_INSTRUCTIONS)
    .map((item) => (item.length > MAX_EXERCISE_FIELD_LENGTH ? item.slice(0, MAX_EXERCISE_FIELD_LENGTH) : item));
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeSearchTerms(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim())
    )
  );
}

function bodyPartToMuscleGroup(bodyPart: string | null | undefined): MuscleGroup {
  const normalized = normalizeText(bodyPart ?? "");
  if (normalized.includes("chest")) return "chest";
  if (normalized.includes("back")) return "back";
  if (normalized.includes("shoulder")) return "shoulders";
  if (normalized.includes("upper arms") || normalized.includes("lower arms") || normalized.includes("arms")) return "arms";
  if (normalized.includes("upper legs") || normalized.includes("lower legs") || normalized.includes("legs")) return "legs";
  if (normalized.includes("waist") || normalized.includes("core") || normalized.includes("ab")) return "core";
  if (normalized.includes("cardio")) return "cardio";
  if (normalized.includes("neck")) return "core";
  return "core";
}

function inferMetForLibraryItem(item: Pick<LibraryExercise, "bodyPart" | "equipment" | "mediaType">): number {
  const muscleGroup = bodyPartToMuscleGroup(item.bodyPart);
  if (muscleGroup === "cardio") return 8;
  if (item.mediaType === "gif") return 5.5;
  if (item.equipment === "Body Weight") return 4.5;
  if (muscleGroup === "core") return 3.8;
  return 5.2;
}

function inferEquipmentLabel(equipment: string | null | undefined): string | null {
  if (!equipment) return null;
  const normalized = normalizeText(equipment);
  if (normalized.includes("barbell") || normalized.includes("杠铃")) return "Barbell";
  if (normalized.includes("dumbbell") || normalized.includes("哑铃")) return "Dumbbell";
  if (normalized.includes("kettlebell") || normalized.includes("壶铃")) return "Kettlebell";
  if (normalized.includes("cable") || normalized.includes("绳")) return "Cable";
  if (normalized.includes("machine") || normalized.includes("器械")) return "Machine";
  if (normalized.includes("band") || normalized.includes("弹力带")) return "Band";
  if (normalized.includes("body weight") || normalized.includes("徒手")) return "Body Weight";
  if (normalized.includes("assisted") || normalized.includes("助力")) return "Assisted";
  return equipment;
}

function inferBodyPartFromMuscleGroup(group: MuscleGroup): string {
  switch (group) {
    case "chest":
      return "Chest";
    case "back":
      return "Back";
    case "legs":
      return "Upper Legs";
    case "shoulders":
      return "Shoulders";
    case "arms":
      return "Upper Arms";
    case "core":
      return "Waist";
    case "cardio":
      return "Cardio";
    default:
      return "Waist";
  }
}

function normalizeLibraryBodyPart(bodyPart: string | null | undefined): string | null {
  if (!bodyPart) return null;
  const normalized = normalizeText(bodyPart);
  if (normalized === "chest") return "Chest";
  if (normalized === "back") return "Back";
  if (normalized === "shoulders" || normalized === "shoulder") return "Shoulders";
  if (normalized === "upper arms" || normalized === "upper arm") return "Upper Arms";
  if (normalized === "lower arms" || normalized === "lower arm") return "Lower Arms";
  if (normalized === "upper legs" || normalized === "upper leg") return "Upper Legs";
  if (normalized === "lower legs" || normalized === "lower leg") return "Lower Legs";
  if (normalized === "waist" || normalized === "core" || normalized === "abs") return "Waist";
  if (normalized === "cardio") return "Cardio";
  if (normalized === "neck") return "Neck";
  return bodyPart;
}

function normalizeSupplementalStepList(input: unknown): string[] {
  if (!isObject(input)) return [];
  return safeStringList(input.en);
}

export function validateSupplementalExercise(input: unknown): SupplementalExercise | null {
  if (!isObject(input)) return null;
  const name = safeString(input.name);
  if (!name) return null;
  return {
    id: safeString(input.id) ?? undefined,
    name,
    category: safeString(input.category) ?? undefined,
    body_part: safeString(input.body_part) ?? undefined,
    equipment: safeString(input.equipment) ?? undefined,
    target: safeString(input.target) ?? undefined,
    muscle_group: safeString(input.muscle_group) ?? undefined,
    secondary_muscles: safeStringList(input.secondary_muscles),
    image: safeString(input.image) ?? undefined,
    gif_url: safeString(input.gif_url) ?? undefined,
    instruction_steps: normalizeSupplementalStepList(input.instruction_steps).length > 0
      ? { en: normalizeSupplementalStepList(input.instruction_steps) }
      : undefined,
    instructions: isObject(input.instructions)
      ? { en: safeString(input.instructions.en, "") ?? "" }
      : undefined,
  };
}

export function validateSupplementalManifest(input: unknown): SupplementalExercise[] {
  const items = Array.isArray(input) ? input : isObject(input) && Array.isArray(input.items) ? input.items : [];
  const normalized = items
    .map((item) => validateSupplementalExercise(item))
    .filter((item): item is SupplementalExercise => item !== null);
  return normalized.slice(0, MAX_SUPPLEMENTAL_EXERCISES);
}

export function validateWorkoutXExercise(input: unknown): WorkoutXExercise | null {
  if (!isObject(input)) return null;
  const name = safeString(input.name ?? input.id ?? input.exerciseId);
  if (!name) return null;
  return {
    id: safeString(input.id ?? input.exerciseId) ?? undefined,
    exerciseId: safeString(input.exerciseId ?? input.id) ?? undefined,
    name,
    level: isStringOrNull(input.level) ? input.level : null,
    difficulty: isStringOrNull(input.difficulty) ? input.difficulty : null,
    equipment: isStringOrNull(input.equipment) ? input.equipment : null,
    category: isStringOrNull(input.category) ? input.category : null,
    bodyPart: isStringOrNull(input.bodyPart) ? input.bodyPart : null,
    target: isStringOrNull(input.target) ? input.target : null,
    gifUrl: isStringOrNull(input.gifUrl) ? input.gifUrl : null,
    videoUrl: isStringOrNull(input.videoUrl) ? input.videoUrl : null,
    primaryMuscles: safeStringList(input.primaryMuscles),
    secondaryMuscles: safeStringList(input.secondaryMuscles),
    instructions: (() => {
      const value = input.instructions;
      if (Array.isArray(value)) return safeStringList(value);
      if (typeof value === "string") return value.slice(0, MAX_EXERCISE_FIELD_LENGTH);
      return undefined;
    })(),
  };
}

export function normalizeWorkoutXExercises(payload: unknown): LibraryExercise[] {
  return extractWorkoutItems(payload)
    .map((item) => validateWorkoutXExercise(item))
    .filter((item): item is WorkoutXExercise => item !== null)
    .map((item) => workoutXToLibraryExercise(item))
    .filter((item): item is LibraryExercise => item !== null);
}

export function normalizeSupplementalExercises(payload: unknown): LibraryExercise[] {
  return validateSupplementalManifest(payload).map((item) => supplementalToLibraryExercise(item));
}

export async function loadSupplementalExerciseDataset(): Promise<SupplementalExerciseManifest | SupplementalExercise[]> {
  if (Platform.OS === "web") {
    try {
      const response = await fetch("/exercise-library/manifest.json");
      if (response.ok) {
        return (await response.json()) as SupplementalExerciseManifest;
      }
    } catch {
      // 回退到本地打包版本
    }
  }

  try {
    return require("../../../../shared/data/exercise-library/manifest.json") as SupplementalExerciseManifest;
  } catch {
    return { items: [] };
  }
}

export function mergeExerciseLibraries(...groups: LibraryExercise[][]): LibraryExercise[] {
  const merged = new Map<string, LibraryExercise>();
  for (const group of groups) {
    for (const item of group) {
      const key = libraryExerciseKey(item);
      const current = merged.get(key);
      if (!current || compareLibraryExercisePriority(item, current) < 0) {
        merged.set(key, item);
      }
    }
  }
  return [...merged.values()];
}

export function buildLocalExerciseFallback(): LibraryExercise[] {
  return sharedExercises.map((exercise) => {
    const bodyPart = inferBodyPartFromMuscleGroup(exercise.primaryMuscleGroup);
    const equipment = inferEquipmentLabel(exercise.equipment[0]);
    return {
      id: `local-${exercise.id}`,
      name: exercise.name,
      displayName: exercise.name,
      searchTerms: normalizeSearchTerms([
        exercise.name,
        ...exercise.aliases,
        bodyPart,
        exercise.primaryMuscleGroup,
        ...exercise.equipment,
      ]),
      source: "local",
      sourceId: exercise.id,
      license: "shared-builtin",
      mediaType: "none",
      level: null,
      equipment,
      category: null,
      bodyPart,
      gifUrl: null,
      primaryMuscles: [exercise.primaryMuscleGroup],
      secondaryMuscles: [],
      instructions: [],
    };
  });
}

export function buildCustomTrainingExercise(item: LibraryExercise): TodayTrainingCustomExercise {
  return {
    id: `custom-${item.source}-${item.sourceId}`,
    name: item.displayName,
    source: item.source,
    equipment: item.equipment,
    bodyPart: item.bodyPart,
    minutes: 0,
    sets: 0,
    reps: "参考动作",
  };
}

export function equipmentRank(equipment: string): number {
  const index = equipmentOrder.indexOf(equipment);
  return index >= 0 ? index : equipmentOrder.length + equipment.length;
}

export function buildTrainingTextReferences(customExercises: TodayTrainingCustomExercise[], libraryItems: LibraryExercise[]): TrainingTextExercise[] {
  const references = new Map<string, TrainingTextExercise>();
  for (const item of libraryItems) {
    const key = normalizeText(item.displayName);
    if (references.has(key)) continue;
    references.set(key, {
      id: item.id,
      name: item.displayName,
      aliases: item.searchTerms.filter((term) => normalizeText(term) !== key),
      primaryMuscleGroup: bodyPartToMuscleGroup(item.bodyPart),
      met: inferMetForLibraryItem(item),
    });
  }

  for (const item of customExercises) {
    const key = normalizeText(item.name);
    if (references.has(key)) continue;
    references.set(key, {
      id: item.id,
      name: item.name,
      aliases: [item.name],
      primaryMuscleGroup: bodyPartToMuscleGroup(item.bodyPart),
      met: bodyPartToMuscleGroup(item.bodyPart) === "cardio" ? 7 : 5,
    });
  }

  return [...references.values()];
}

export function buildWorkoutForSelection(focus: MuscleGroup, minutes: number, preference: TrainingPreferenceDraft): WorkoutPlan {
  const queue = generateTrainingQueue(sharedExercises, {
    ...preference,
    daysPerWeek: 1,
    minutesPerSession: Math.max(20, minutes),
    preferredMuscleGroups: [focus],
  });
  return queue[0] ?? {
    id: `workout-${focus}-fallback`,
    title: `${muscleGroupLabels[focus]}训练`,
    focus,
    estimatedMinutes: Math.max(20, minutes),
    exercises: [],
  };
}

export function nextInCycle<T>(values: readonly T[], current: T): T {
  if (values.length === 0) return current;
  const index = values.findIndex((item) => item === current);
  return index >= 0 ? values[(index + 1) % values.length] : values[0];
}

function extractWorkoutItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isObject(payload)) return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function workoutXToLibraryExercise(item: WorkoutXExercise): LibraryExercise | null {
  const sourceId = item.exerciseId ?? item.id ?? item.name ?? null;
  const name = item.name?.trim();
  if (!sourceId || !name) return null;

  const bodyPart = normalizeLibraryBodyPart(item.bodyPart);
  const equipment = inferEquipmentLabel(item.equipment);
  const displayName = localizeExerciseName({
    name,
    equipment,
    category: item.category,
    bodyPart,
    primaryMuscles: item.primaryMuscles ?? [],
    secondaryMuscles: item.secondaryMuscles ?? [],
    source: "workoutx"
  });
  const aliases = normalizeSearchTerms([
    item.name,
    displayName,
    item.target,
    item.category,
    item.equipment,
    item.bodyPart,
    ...(item.primaryMuscles ?? []),
    ...(item.secondaryMuscles ?? []),
    ...(Array.isArray(item.instructions) ? item.instructions : []),
  ]);

  return {
    id: `workoutx-${sourceId}`,
    name,
    displayName,
    searchTerms: normalizeSearchTerms([...aliases, ...buildExerciseSearchTerms({ name, equipment, category: item.category, bodyPart })]),
    source: "workoutx",
    sourceId,
    license: "WorkoutX",
    mediaType: item.gifUrl || item.videoUrl ? "gif" : "image",
    level: item.level ?? item.difficulty ?? null,
    equipment,
    category: item.category ?? null,
    bodyPart,
    gifUrl: item.gifUrl ?? item.videoUrl ?? null,
    primaryMuscles: item.primaryMuscles ?? [],
    secondaryMuscles: item.secondaryMuscles ?? [],
    instructions: Array.isArray(item.instructions) ? item.instructions : item.instructions ? [item.instructions] : [],
  };
}

function supplementalToLibraryExercise(item: SupplementalExercise): LibraryExercise {
  const sourceId = item.id ?? item.name ?? "supplemental";
  const name = item.name?.trim() || sourceId;
  const bodyPart = normalizeLibraryBodyPart(item.body_part);
  const equipment = inferEquipmentLabel(item.equipment);
  const displayName = localizeExerciseName({
    name,
    equipment,
    category: item.category,
    bodyPart,
    primaryMuscles: item.muscle_group ? [item.muscle_group] : [],
    secondaryMuscles: item.secondary_muscles ?? [],
    source: "research-gif-dataset"
  });
  return {
    id: `supplemental-${sourceId}`,
    name,
    displayName,
    searchTerms: normalizeSearchTerms([
      item.name,
      displayName,
      item.category,
      item.body_part,
      item.equipment,
      item.target,
      item.muscle_group,
      ...(item.secondary_muscles ?? []),
      ...(item.instruction_steps?.en ?? []),
      item.instructions?.en,
      ...buildExerciseSearchTerms({ name, equipment, category: item.category, bodyPart, primaryMuscles: item.muscle_group ? [item.muscle_group] : [], secondaryMuscles: item.secondary_muscles ?? [] }),
    ]),
    source: "research-gif-dataset",
    sourceId,
    license: "research-gif-dataset",
    mediaType: item.gif_url || item.image ? "gif" : "image",
    level: null,
    equipment,
    category: item.category ?? null,
    bodyPart,
    gifUrl: item.gif_url ?? item.image ?? null,
    primaryMuscles: item.muscle_group ? [item.muscle_group] : [],
    secondaryMuscles: item.secondary_muscles ?? [],
    instructions: item.instruction_steps?.en ?? (item.instructions?.en ? [item.instructions.en] : []),
  };
}

function libraryExerciseKey(item: LibraryExercise): string {
  return `${normalizeText(item.displayName)}|${normalizeText(item.bodyPart ?? "")}|${normalizeText(item.equipment ?? "")}`;
}

function compareLibraryExercisePriority(left: LibraryExercise, right: LibraryExercise): number {
  const leftRank = dataSourceRank[left.source];
  const rightRank = dataSourceRank[right.source];
  if (leftRank !== rightRank) return leftRank - rightRank;
  if (!!left.gifUrl !== !!right.gifUrl) return left.gifUrl ? -1 : 1;
  return left.displayName.localeCompare(right.displayName, "zh-Hans-CN");
}
