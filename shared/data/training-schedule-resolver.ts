import type { Exercise, MuscleGroup } from "../index";
import type { DietDayType, DietPlanCycleSelection } from "./diet-plan-database";
import { dietDayTypeLabels, resolveDietPlanDay } from "./diet-plan-database";
import {
  resolveTrainingDietRecommendation,
  type TrainingDietIntensity,
} from "./training-diet-rules";

export type TrainingScheduleType = TrainingDietIntensity | "rest";

export type TrainingSchedulePreference = {
  daysPerWeek: number;
  minutesPerSession: number;
  equipment?: string[];
  preferredMuscleGroups: MuscleGroup[];
  cardioRatio: number;
};

export type TrainingScheduleEntry = {
  date: Date;
  dateKey: string;
  offsetDays: number;
  isToday: boolean;
  dietDayType: DietDayType;
  dietLabel: string;
  trainingType: TrainingScheduleType;
  intensityLabel: string;
  focus: MuscleGroup | null;
  focusCandidates: MuscleGroup[];
  minutes: number;
  exerciseIds: string[];
  reason: string;
};

export type ResolveTrainingScheduleInput = {
  planId: string | null;
  dietPlanSelection?: DietPlanCycleSelection;
  exercises: Exercise[];
  preference: TrainingSchedulePreference;
  anchorDate?: Date;
  pastDays?: number;
  futureDays?: number;
  manualTodayFocus?: MuscleGroup | null;
  manualTodayMinutes?: number | null;
};

type Candidate = {
  date: Date;
  dateKey: string;
  offsetDays: number;
  index: number;
  dietDayType: DietDayType;
  dietLabel: string;
  capacityScore: number;
  recommendation: ReturnType<typeof resolveTrainingDietRecommendation>;
};

const highLoadFocus: MuscleGroup[] = ["legs", "back", "chest"];
const lowLoadFocus: MuscleGroup[] = ["core", "arms", "shoulders", "cardio"];

const dayTypeCapacity: Record<DietDayType, number> = {
  "high-carb": 100,
  "medium-carb": 82,
  balanced: 76,
  "normal-eating": 72,
  "low-carb": 42,
  "very-low-carb": 18,
  "depletion-carb": 14,
  "fasting-low-calorie": 16,
};

export function resolveTrainingSchedule(input: ResolveTrainingScheduleInput): TrainingScheduleEntry[] {
  const pastDays = Math.max(0, input.pastDays ?? 3);
  const futureDays = Math.max(0, input.futureDays ?? 3);
  const totalDays = pastDays + futureDays + 1;
  const trainingTarget = clamp(Math.round(input.preference.daysPerWeek || 4), 1, totalDays);
  const anchorDate = stripTime(input.anchorDate ?? new Date());
  const candidates = buildCandidates(input, anchorDate, pastDays, futureDays);
  const selectedKeys = pickTrainingDays(candidates, trainingTarget);
  let previousFocus: MuscleGroup | null = null;

  return candidates.map((candidate) => {
    const selected = selectedKeys.has(candidate.dateKey);
    if (!selected) {
      return buildRestEntry(candidate, "按每周训练频率保留恢复日。");
    }

    const focus = pickFocusForDay(candidate, previousFocus);
    previousFocus = focus;
    const recommendation = candidate.recommendation;

    return {
      date: candidate.date,
      dateKey: candidate.dateKey,
      offsetDays: candidate.offsetDays,
      isToday: candidate.offsetDays === 0,
      dietDayType: candidate.dietDayType,
      dietLabel: candidate.dietLabel,
      trainingType: recommendation.intensity,
      intensityLabel: recommendation.intensityLabel,
      focus,
      focusCandidates: candidate.recommendation.focusCandidates,
      minutes: recommendation.durationMinutes,
      exerciseIds: focus === recommendation.focus
        ? recommendation.exerciseIds
        : pickExerciseIdsForFocus(input.exercises, focus, recommendation.exerciseIds),
      reason: buildReason(candidate.dietDayType, recommendation.intensity),
    };
  });
}

export function getTodayTrainingScheduleEntry(entries: TrainingScheduleEntry[]): TrainingScheduleEntry {
  return entries.find((entry) => entry.isToday) ?? entries[Math.floor(entries.length / 2)] ?? {
    date: stripTime(new Date()),
    dateKey: formatDateKey(new Date()),
    offsetDays: 0,
    isToday: true,
    dietDayType: "balanced",
    dietLabel: dietDayTypeLabels.balanced,
    trainingType: "rest",
    intensityLabel: "休息",
    focus: null,
    focusCandidates: [],
    minutes: 0,
    exerciseIds: [],
    reason: "暂无训练计划。",
  };
}

function buildCandidates(
  input: ResolveTrainingScheduleInput,
  anchorDate: Date,
  pastDays: number,
  futureDays: number,
): Candidate[] {
  const result: Candidate[] = [];
  const selection = input.dietPlanSelection ?? {};

  for (let offset = -pastDays; offset <= futureDays; offset += 1) {
    const date = addDays(anchorDate, offset);
    const dietDay = resolveDietPlanDay(input.planId, date, selection);
    const recommendation = resolveTrainingDietRecommendation({
      planId: input.planId,
      dayType: dietDay.dayType,
      exercises: input.exercises,
      preferredMuscleGroups: input.preference.preferredMuscleGroups,
      baseMinutes: input.preference.minutesPerSession,
      manualFocus: offset === 0 ? input.manualTodayFocus ?? null : null,
      manualMinutes: offset === 0 ? input.manualTodayMinutes ?? null : null,
    });

    result.push({
      date,
      dateKey: formatDateKey(date),
      offsetDays: offset,
      index: offset + pastDays,
      dietDayType: dietDay.dayType,
      dietLabel: dietDayTypeLabels[dietDay.dayType] ?? dietDay.status,
      capacityScore: dayTypeCapacity[dietDay.dayType] ?? 60,
      recommendation,
    });
  }

  return result;
}

function pickTrainingDays(candidates: Candidate[], trainingTarget: number): Set<string> {
  const idealSlots = getIdealSlotSet(candidates.length, trainingTarget);
  const ranked = candidates
    .map((candidate) => ({
      candidate,
      score:
        candidate.capacityScore * 10
        + (idealSlots.has(candidate.index) ? 3 : 0)
        + (candidate.offsetDays === 0 ? 2 : 0),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return Math.abs(left.candidate.offsetDays) - Math.abs(right.candidate.offsetDays);
    });

  return new Set(ranked.slice(0, trainingTarget).map((item) => item.candidate.dateKey));
}

function getIdealSlotSet(totalDays: number, trainingTarget: number): Set<number> {
  if (totalDays !== 7) {
    return new Set(Array.from({ length: trainingTarget }, (_, index) => Math.round((index * (totalDays - 1)) / Math.max(1, trainingTarget - 1))));
  }

  const byTarget: Record<number, number[]> = {
    1: [3],
    2: [1, 4],
    3: [0, 3, 5],
    4: [0, 2, 4, 6],
    5: [0, 1, 3, 4, 6],
    6: [0, 1, 2, 3, 4, 6],
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  return new Set(byTarget[clamp(trainingTarget, 1, 7)] ?? byTarget[4]);
}

function pickFocusForDay(candidate: Candidate, previousFocus: MuscleGroup | null): MuscleGroup {
  const candidates = normalizeFocusCandidates(candidate);
  const nonRepeat = candidates.find((focus) => focus !== previousFocus);
  return nonRepeat ?? candidates[0] ?? "chest";
}

function normalizeFocusCandidates(candidate: Candidate): MuscleGroup[] {
  const preferred = candidate.recommendation.focusCandidates.length
    ? candidate.recommendation.focusCandidates
    : [candidate.recommendation.focus];

  if (candidate.dietDayType === "low-carb") {
    return [...lowLoadFocus, ...preferred].filter(uniqueFocus);
  }

  if (candidate.dietDayType === "very-low-carb" || candidate.dietDayType === "depletion-carb" || candidate.dietDayType === "fasting-low-calorie") {
    const recoveryFocus: MuscleGroup[] = ["cardio", "core", ...preferred];
    return recoveryFocus.filter(uniqueFocus);
  }

  if (candidate.dietDayType === "high-carb") {
    return [...highLoadFocus, ...preferred].filter(uniqueFocus);
  }

  return preferred.filter(uniqueFocus);
}

function buildRestEntry(candidate: Candidate, reason: string): TrainingScheduleEntry {
  return {
    date: candidate.date,
    dateKey: candidate.dateKey,
    offsetDays: candidate.offsetDays,
    isToday: candidate.offsetDays === 0,
    dietDayType: candidate.dietDayType,
    dietLabel: candidate.dietLabel,
    trainingType: "rest",
    intensityLabel: "休息",
    focus: null,
    focusCandidates: [],
    minutes: 0,
    exerciseIds: [],
    reason,
  };
}

function buildReason(dayType: DietDayType, intensity: TrainingDietIntensity): string {
  if (dayType === "high-carb") return "高碳日优先承接大肌群和复合力量训练。";
  if (dayType === "medium-carb") return "中碳日适合中等训练量，保持训练节奏。";
  if (dayType === "low-carb") return "低碳日降低糖原消耗，优先小肌群、核心或低强度有氧。";
  if (dayType === "very-low-carb" || dayType === "depletion-carb" || dayType === "fasting-low-calorie") return "低能量日优先恢复，不默认安排高强度力量训练。";
  if (dayType === "normal-eating") return "轻断食方案下优先靠近进食窗口训练。";
  return intensity === "heavy" ? "训练负荷较高，注意恢复。" : "均衡饮食日按用户偏好轮换训练。";
}

function pickExerciseIdsForFocus(exercises: Exercise[], focus: MuscleGroup, fallback: string[]): string[] {
  const ids = exercises.filter((exercise) => exercise.primaryMuscleGroup === focus).map((exercise) => exercise.id);
  return ids.length ? ids.slice(0, Math.max(3, Math.min(5, fallback.length || 4))) : fallback;
}

function uniqueFocus(value: MuscleGroup, index: number, array: MuscleGroup[]): boolean {
  return array.indexOf(value) === index;
}

function addDays(date: Date, offset: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + offset);
  return stripTime(next);
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
