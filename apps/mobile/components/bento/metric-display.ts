// 纯函数：从 actual / target 推出 MetricBarWithCursor 需要的所有渲染状态。
// 不依赖 React Native，可在 Node 测环境下直接 import。
import type { SemanticColor } from "./tokens";

export type MetricState = "under" | "met" | "over";

export type MetricDisplay = {
  percent: number;
  cursorPercent: number;
  state: MetricState;
  fillColor: SemanticColor;
  cursorColor: SemanticColor;
  subtitle: string;
  subtitleTone: SemanticColor | "inkMute";
  ratio: number;
  hasTarget: boolean;
};

export function computeMetricDisplay(args: {
  actual: number;
  target: number;
  unit?: string;
  baseColor?: SemanticColor;
  overThreshold?: number;
}): MetricDisplay {
  const {
    actual,
    target,
    unit = "",
    baseColor = "accent",
    overThreshold = 1,
  } = args;

  const safeActual = Number.isFinite(actual) ? Math.max(0, actual) : 0;
  const safeTarget = Number.isFinite(target) ? Math.max(0, target) : 0;
  const hasTarget = safeTarget > 0;
  const ratio = hasTarget ? safeActual / safeTarget : 0;

  let state: MetricState;
  if (!hasTarget) state = "under";
  else if (ratio > overThreshold) state = "over";
  else if (ratio >= 0.999) state = "met";
  else state = "under";

  const percent = hasTarget ? Math.min(1, ratio) : 0;
  const cursorPercent = percent;

  const fillColor: SemanticColor = state === "over" ? "amber" : baseColor;
  const cursorColor: SemanticColor = state === "over" ? "amber" : baseColor;

  const formatUnit = (value: number) => {
    const rounded = Math.round(value);
    return unit ? `${rounded}${unit}` : String(rounded);
  };

  let subtitle: string;
  let subtitleTone: SemanticColor | "inkMute";
  if (!hasTarget) {
    subtitle = "未设目标";
    subtitleTone = "inkMute";
  } else if (state === "met") {
    subtitle = "已达成";
    subtitleTone = "positive";
  } else if (state === "over") {
    subtitle = `超 ${formatUnit(safeActual - safeTarget)}`;
    subtitleTone = "amber";
  } else {
    subtitle = `还差 ${formatUnit(safeTarget - safeActual)}`;
    subtitleTone = "inkMute";
  }

  return {
    percent,
    cursorPercent,
    state,
    fillColor,
    cursorColor,
    subtitle,
    subtitleTone,
    ratio,
    hasTarget,
  };
}