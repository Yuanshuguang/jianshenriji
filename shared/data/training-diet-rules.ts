import type { DietDayType } from "./diet-plan-database";
import type { Exercise, MuscleGroup } from "../index";

export type TrainingDietIntensity = "heavy" | "moderate" | "light" | "recovery";

export type TrainingDietEvidence = {
  id: string;
  label: string;
  url: string;
  summary: string;
};

export type TrainingDietRecommendation = {
  planId: string | null;
  dayType: DietDayType;
  intensity: TrainingDietIntensity;
  intensityLabel: string;
  focus: MuscleGroup;
  nextFocus: MuscleGroup;
  focusCandidates: MuscleGroup[];
  durationMinutes: number;
  exerciseIds: string[];
  movementPattern: string;
  rationale: string;
  caution: string;
  evidenceIds: string[];
};

export type TrainingDietRecommendationInput = {
  planId: string | null;
  dayType: DietDayType;
  exercises: Exercise[];
  preferredMuscleGroups?: MuscleGroup[];
  baseMinutes?: number;
  manualFocus?: MuscleGroup | null;
  manualMinutes?: number | null;
  safetyProfile?: {
    heightCm: number;
    weightKg: number;
    trainingLevel?: string;
  };
};

export const trainingDietEvidence: TrainingDietEvidence[] = [
  {
    id: "issn-nutrient-timing",
    label: "ISSN 营养时机立场声明",
    url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0189-4",
    summary: "高训练量和高强度运动依赖碳水化合物可用性，训练前后碳水有助于维持糖原和训练质量。"
  },
  {
    id: "acsm-nutrition-performance",
    label: "ACSM/AND/DC 运动营养立场声明",
    url: "https://pubmed.ncbi.nlm.nih.gov/26920240/",
    summary: "运动员饮食应按训练负荷调整能量、碳水、蛋白和脂肪，碳水可用性需要匹配训练强度和时长。"
  },
  {
    id: "issn-protein-exercise",
    label: "ISSN 蛋白质与运动立场声明",
    url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8",
    summary: "阻力训练人群需要足量蛋白支持肌肉修复和适应，但训练表现仍需结合总能量与碳水供给。"
  },
  {
    id: "nsca-resistance-training",
    label: "NSCA 阻力训练进阶模型",
    url: "https://journals.lww.com/nsca-jscr/fulltext/2009/03000/progression_models_in_resistance_training_for.26.aspx",
    summary: "力量训练计划需要按目标安排多关节动作、训练量、强度和恢复，不能脱离疲劳与恢复状态硬排。"
  },
  {
    id: "low-carb-performance-review",
    label: "低碳/生酮与高强度表现综述",
    url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-020-00362-9",
    summary: "低碳或生酮策略可用于体重管理，但对高强度、糖酵解依赖训练的表现可能不友好。"
  }
];

const dayTypeProfiles: Record<DietDayType, {
  intensity: TrainingDietIntensity;
  focusCandidates: MuscleGroup[];
  exercisePriority: string[];
  durationFactor: number;
  movementPattern: string;
  rationale: string;
  caution: string;
  evidenceIds: string[];
}> = {
  "high-carb": {
    intensity: "heavy",
    focusCandidates: ["legs", "back", "chest"],
    exercisePriority: ["squat", "deadlift", "bench-press", "row", "pull-up", "push-up"],
    durationFactor: 1.1,
    movementPattern: "大肌群 / 复合力量 / 高训练质量",
    rationale: "高碳日碳水可用性更高，适合安排更依赖糖原的大肌群和复合力量训练。",
    caution: "仍然按个人技术和恢复决定重量，不把高碳日等同于必须冲极限重量。",
    evidenceIds: ["issn-nutrient-timing", "acsm-nutrition-performance", "nsca-resistance-training"]
  },
  "medium-carb": {
    intensity: "moderate",
    focusCandidates: ["chest", "back", "shoulders", "legs"],
    exercisePriority: ["bench-press", "row", "shoulder-press", "squat", "pull-up", "lateral-raise"],
    durationFactor: 1,
    movementPattern: "中等强度力量 / 技术练习 / 普通训练日",
    rationale: "中碳日适合保持训练节奏，强度中等，不追求最高训练量。",
    caution: "如果前一天训练疲劳明显，优先降低训练量而不是强行补动作。",
    evidenceIds: ["acsm-nutrition-performance", "nsca-resistance-training"]
  },
  balanced: {
    intensity: "moderate",
    focusCandidates: ["chest", "back", "legs", "shoulders"],
    exercisePriority: ["bench-press", "row", "squat", "shoulder-press", "pull-up", "push-up"],
    durationFactor: 1,
    movementPattern: "常规力量 / 均衡训练",
    rationale: "均衡饮食日没有特殊碳水波动，适合按用户偏好轮换常规力量训练。",
    caution: "训练建议仍以实际睡眠、疲劳和动作技术为先。",
    evidenceIds: ["issn-protein-exercise", "nsca-resistance-training"]
  },
  "normal-eating": {
    intensity: "moderate",
    focusCandidates: ["chest", "back", "legs", "shoulders"],
    exercisePriority: ["bench-press", "row", "squat", "shoulder-press", "pull-up", "push-up"],
    durationFactor: 0.95,
    movementPattern: "常规训练 / 进食窗口内优先",
    rationale: "间歇性轻断食主要改变进食窗口，训练最好靠近进食窗口，保证训练前后蛋白和碳水补给。",
    caution: "长时间空腹时不默认推荐大重量腿背训练；如要高强度，优先安排在进食窗口附近。",
    evidenceIds: ["acsm-nutrition-performance", "issn-nutrient-timing"]
  },
  "low-carb": {
    intensity: "light",
    focusCandidates: ["core", "arms", "shoulders", "cardio"],
    exercisePriority: ["plank", "crunch", "curl", "lateral-raise", "walking", "cycling", "elliptical"],
    durationFactor: 0.8,
    movementPattern: "轻中强度 / 小肌群 / 核心 / 低强度有氧",
    rationale: "低碳日更适合作为热量缺口和恢复控制日，不默认安排高糖原消耗的大重量大肌群。",
    caution: "不建议把低碳日排成高容量腿部、硬拉或高强度间歇日。",
    evidenceIds: ["acsm-nutrition-performance", "low-carb-performance-review"]
  },
  "very-low-carb": {
    intensity: "recovery",
    focusCandidates: ["cardio", "core"],
    exercisePriority: ["walking", "cycling", "elliptical", "plank", "crunch"],
    durationFactor: 0.6,
    movementPattern: "恢复 / 步行或低强度有氧 / 轻核心",
    rationale: "极低碳或生酮日不适合作为默认高强度糖酵解训练日，优先恢复和低强度活动。",
    caution: "避免大重量深蹲、硬拉、冲刺间歇；如头晕乏力应停止训练。",
    evidenceIds: ["low-carb-performance-review", "acsm-nutrition-performance"]
  },
  "depletion-carb": {
    intensity: "recovery",
    focusCandidates: ["cardio", "core"],
    exercisePriority: ["walking", "cycling", "elliptical", "plank", "crunch"],
    durationFactor: 0.55,
    movementPattern: "断碳恢复 / 低强度活动",
    rationale: "断碳日用于短期平台突破时，应避免叠加高强度力量压力。",
    caution: "不建议安排大重量大肌群训练，也不建议频繁使用断碳日。",
    evidenceIds: ["low-carb-performance-review", "nsca-resistance-training"]
  },
  "fasting-low-calorie": {
    intensity: "recovery",
    focusCandidates: ["cardio", "core"],
    exercisePriority: ["walking", "cycling", "elliptical", "plank", "crunch"],
    durationFactor: 0.55,
    movementPattern: "低热量日 / 恢复或轻活动",
    rationale: "低热量日训练恢复资源有限，适合低强度活动，不适合追求训练表现。",
    caution: "如果当天能量摄入很低，不建议硬排大重量或高强度间歇。",
    evidenceIds: ["acsm-nutrition-performance", "nsca-resistance-training"]
  }
};

const planOverrides: Record<string, Partial<Record<DietDayType, Partial<typeof dayTypeProfiles[DietDayType]>>>> = {
  "high-protein-balanced": {
    balanced: {
      rationale: "高蛋白均衡饮食适合稳定推进力量训练，优先常规复合动作和足量恢复。",
      evidenceIds: ["issn-protein-exercise", "nsca-resistance-training"]
    }
  },
  "flexible-macro": {
    balanced: {
      rationale: "灵活宏量饮食的关键是当天宏量达标；训练建议按用户偏好和实际摄入完成度微调。",
      caution: "如果当天碳水明显没吃够，不建议临时追加高容量腿背训练。",
      evidenceIds: ["acsm-nutrition-performance", "issn-nutrient-timing"]
    }
  },
  "low-carb": {
    "low-carb": {
      focusCandidates: ["core", "arms", "shoulders", "cardio"],
      exercisePriority: ["plank", "crunch", "curl", "lateral-raise", "cycling"],
      caution: "低碳方案下可以训练，但默认不把腿背大重量放在最低碳、最低能量状态。"
    }
  },
  keto: {
    "very-low-carb": {
      focusCandidates: ["cardio", "core"],
      exercisePriority: ["cycling", "plank", "crunch"],
      durationFactor: 0.5,
      caution: "生酮/极低碳阶段尤其不建议默认推高强度糖酵解训练。"
    }
  },
  "if-16-8": {
    "normal-eating": {
      caution: "16+8 不禁止力量训练，但建议靠近进食窗口，并保证训练前后蛋白和碳水。"
    }
  }
};

const intensityLabels: Record<TrainingDietIntensity, string> = {
  heavy: "高强度",
  moderate: "中等强度",
  light: "轻中强度",
  recovery: "恢复日"
};

export function resolveTrainingDietRecommendation(input: TrainingDietRecommendationInput): TrainingDietRecommendation {
  const baseProfile = dayTypeProfiles[input.dayType] ?? dayTypeProfiles.balanced;
  const planOverride = input.planId ? planOverrides[input.planId]?.[input.dayType] : undefined;
  const profile = applySafetyProfile({ ...baseProfile, ...planOverride }, input.safetyProfile);
  const preferred = input.preferredMuscleGroups?.length ? input.preferredMuscleGroups : profile.focusCandidates;
  const focusCandidates = mergeFocusCandidates(profile.focusCandidates, preferred);
  const manualFocusAllowed = input.manualFocus && focusCandidates.includes(input.manualFocus);
  const focus = manualFocusAllowed ? input.manualFocus! : focusCandidates[0] ?? "chest";
  const nextFocus = focusCandidates.find((item) => item !== focus) ?? focus;
  const durationMinutes = input.manualMinutes && input.manualMinutes > 0
    ? input.manualMinutes
    : clampToFiveMinutes((input.baseMinutes ?? 45) * profile.durationFactor);
  const exerciseIds = pickExerciseIds(input.exercises, profile.exercisePriority, focus, profile.intensity);

  return {
    planId: input.planId,
    dayType: input.dayType,
    intensity: profile.intensity,
    intensityLabel: intensityLabels[profile.intensity],
    focus,
    nextFocus,
    focusCandidates,
    durationMinutes,
    exerciseIds,
    movementPattern: profile.movementPattern,
    rationale: profile.rationale,
    caution: profile.caution,
    evidenceIds: profile.evidenceIds
  };
}

function applySafetyProfile(
  profile: typeof dayTypeProfiles[DietDayType],
  safetyProfile?: TrainingDietRecommendationInput["safetyProfile"]
): typeof dayTypeProfiles[DietDayType] {
  if (!shouldUseLowImpactCardio(safetyProfile)) return profile;
  const exercisePriority = profile.exercisePriority.filter((id) => id !== "running");
  return {
    ...profile,
    intensity: profile.intensity === "heavy" ? "moderate" : profile.intensity,
    focusCandidates: prioritizeFocus(["cardio", "core", ...profile.focusCandidates]),
    exercisePriority: prioritizeUnique(["walking", "cycling", "elliptical", ...exercisePriority]),
    movementPattern: `${profile.movementPattern} / 低冲击优先`,
    caution: `${profile.caution} 大体重或新手阶段默认避开跑步、跳跃和冲刺，优先快走、椭圆机、单车或低冲击动作。`,
  };
}

function shouldUseLowImpactCardio(profile?: TrainingDietRecommendationInput["safetyProfile"]): boolean {
  if (!profile) return false;
  const heightM = profile.heightCm > 0 ? profile.heightCm / 100 : 0;
  const bmi = heightM > 0 ? profile.weightKg / (heightM * heightM) : 0;
  return bmi >= 30 || profile.weightKg >= 100 || profile.trainingLevel === "beginner";
}

function prioritizeFocus(items: MuscleGroup[]): MuscleGroup[] {
  return Array.from(new Set(items));
}

function prioritizeUnique(items: string[]): string[] {
  return Array.from(new Set(items));
}

export function getTrainingDietEvidence(ids: string[]): TrainingDietEvidence[] {
  const wanted = new Set(ids);
  return trainingDietEvidence.filter((item) => wanted.has(item.id));
}

function mergeFocusCandidates(primary: MuscleGroup[], preferred: MuscleGroup[]): MuscleGroup[] {
  const result: MuscleGroup[] = [];
  [...primary, ...preferred].forEach((item) => {
    if (!result.includes(item)) result.push(item);
  });
  return result.length > 0 ? result : ["chest"];
}

function pickExerciseIds(
  exercises: Exercise[],
  priority: string[],
  focus: MuscleGroup,
  intensity: TrainingDietIntensity
): string[] {
  const focusMatches = exercises
    .filter((item) => item.primaryMuscleGroup === focus)
    .map((item) => item.id);
  const priorityRank = new Map(priority.map((id, index) => [id, index]));
  const combined = focusMatches
    .slice()
    .sort((left, right) => (priorityRank.get(left) ?? 999) - (priorityRank.get(right) ?? 999));
  const limit = intensity === "heavy" ? 5 : intensity === "moderate" ? 4 : 3;
  return combined.slice(0, limit);
}

function clampToFiveMinutes(value: number): number {
  const rounded = Math.round(value / 5) * 5;
  return Math.max(15, Math.min(90, rounded));
}
