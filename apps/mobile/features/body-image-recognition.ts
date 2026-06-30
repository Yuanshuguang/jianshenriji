import type { BodyFatEvidenceMediaType, BodyFatVisualLevel, BodyFatVisualQualitySignal, UserProfile } from "../store/fitness-store";

export type BodyReportRecognitionMetrics = {
  bmi?: number;
  bodyFatPercent?: number;
  skeletalMuscleKg?: number;
  waterPercent?: number;
  basalMetabolismKcal?: number;
};

export type BodyReportRecognitionResponse = {
  mode: "report";
  rawText: string;
  lines: string[];
  metrics: BodyReportRecognitionMetrics;
};

export type BodyFatVisualEstimate = {
  percent: number;
  min: number;
  max: number;
  basePercent: number;
  visualAdjustment: number;
  qualitySpread: number;
  label: string;
  reason: string;
};

export const bodyFatVisualLevelLabels: Record<BodyFatVisualLevel, string> = {
  unknown: "不确定",
  soft: "腰腹偏软",
  flat: "腹部平坦",
  lines: "线条可见",
  defined: "肌肉线条清晰",
};

const visualLevelAdjustments: Record<BodyFatVisualLevel, number> = {
  unknown: 0,
  soft: 3,
  flat: 0,
  lines: -3,
  defined: -6,
};

const maleVisualLevelAdjustments: Record<BodyFatVisualLevel, number> = {
  unknown: 0,
  soft: 4,
  flat: 1,
  lines: -4,
  defined: -7,
};

const femaleVisualLevelAdjustments: Record<BodyFatVisualLevel, number> = {
  unknown: 0,
  soft: 3,
  flat: 0,
  lines: -3,
  defined: -5,
};

export const bodyFatVisualQualityLabels: Record<BodyFatVisualQualitySignal, string> = {
  frontVisible: "正面清晰",
  waistVisible: "腰腹可见",
  lightingOk: "光线正常",
  tightClothing: "衣物贴身",
};

export const defaultBodyFatVisualQualitySignals: BodyFatVisualQualitySignal[] = [
  "frontVisible",
  "waistVisible",
  "lightingOk",
];

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8787";
const bodyReportRecognitionUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/ai/body-report-recognition`;

export async function recognizeBodyReportImage(imageBase64: string, imageName?: string): Promise<BodyReportRecognitionResponse> {
  const response = await fetch(bodyReportRecognitionUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      imageBase64,
      imageName,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<BodyReportRecognitionResponse>;
}

export function estimateBodyFatFromProfile(profile: Pick<UserProfile, "gender" | "age" | "heightCm" | "weightKg">): number | null {
  if (!profile.heightCm || !profile.weightKg || !profile.age) {
    return null;
  }

  const heightM = profile.heightCm / 100;
  if (heightM <= 0) return null;

  const bmi = profile.weightKg / (heightM * heightM);
  const sexOffset = profile.gender === "male" ? 1 : 0;
  const estimated = 1.2 * bmi + 0.23 * profile.age - 10.8 * sexOffset - 5.4;

  return clamp(Math.round(estimated * 10) / 10, 5, 45);
}

export function estimateBodyFatFromVisualInput(
  profile: Pick<UserProfile, "gender" | "age" | "heightCm" | "weightKg">,
  visualLevel: BodyFatVisualLevel,
  options: {
    mediaType?: BodyFatEvidenceMediaType;
    qualitySignals?: BodyFatVisualQualitySignal[];
  } = {}
): BodyFatVisualEstimate | null {
  const basePercent = estimateBodyFatFromProfile(profile);
  if (basePercent === null) return null;

  const adjustmentMap = profile.gender === "female" ? femaleVisualLevelAdjustments : maleVisualLevelAdjustments;
  const visualAdjustment = adjustmentMap[visualLevel] ?? visualLevelAdjustments[visualLevel] ?? 0;
  const percent = clamp(Math.round((basePercent + visualAdjustment) * 10) / 10, 5, 45);
  const qualitySpread = calculateVisualEstimateSpread(visualLevel, options.mediaType ?? null, options.qualitySignals ?? []);

  return {
    percent,
    min: clamp(Math.round((percent - qualitySpread) * 10) / 10, 5, 45),
    max: clamp(Math.round((percent + qualitySpread) * 10) / 10, 5, 45),
    basePercent,
    visualAdjustment,
    qualitySpread,
    label: bodyFatVisualLevelLabels[visualLevel],
    reason: buildBodyFatEstimateReason(basePercent, visualAdjustment, qualitySpread, visualLevel, options.mediaType ?? null, options.qualitySignals ?? []),
  };
}

export function calculateBmi(heightCm: number, weightKg: number): number | null {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  if (heightM <= 0) return null;
  const bmi = weightKg / (heightM * heightM);
  return clamp(Math.round(bmi * 10) / 10, 10, 60);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function calculateVisualEstimateSpread(
  visualLevel: BodyFatVisualLevel,
  mediaType: BodyFatEvidenceMediaType,
  qualitySignals: BodyFatVisualQualitySignal[]
): number {
  if (visualLevel === "unknown") return 5;

  const requiredSignals = defaultBodyFatVisualQualitySignals.length;
  const matchedSignals = defaultBodyFatVisualQualitySignals.filter((signal) => qualitySignals.includes(signal)).length;
  const missingSignals = Math.max(0, requiredSignals - matchedSignals);
  const tightClothingBonus = qualitySignals.includes("tightClothing") ? -0.5 : 0;
  const mediaBonus = mediaType === "video" && missingSignals <= 1 ? -0.5 : 0;

  return clamp(3 + missingSignals * 0.75 + tightClothingBonus + mediaBonus, 2, 5);
}

function buildBodyFatEstimateReason(
  basePercent: number,
  visualAdjustment: number,
  qualitySpread: number,
  visualLevel: BodyFatVisualLevel,
  mediaType: BodyFatEvidenceMediaType,
  qualitySignals: BodyFatVisualQualitySignal[]
): string {
  const mediaText = mediaType === "video" ? "视频画面" : mediaType === "image" ? "图片画面" : "当前画面";
  const qualityText = qualitySignals.length > 0
    ? qualitySignals.map((signal) => bodyFatVisualQualityLabels[signal]).join("、")
    : "画面质量未确认";
  const adjustmentText = visualAdjustment === 0 ? "不额外修正" : `${visualAdjustment > 0 ? "+" : ""}${visualAdjustment}% 修正`;

  return `${mediaText}特征：${bodyFatVisualLevelLabels[visualLevel]}；质量：${qualityText}；BMI 基准 ${basePercent}% 后 ${adjustmentText}，区间半径约 ${qualitySpread}%。`;
}
