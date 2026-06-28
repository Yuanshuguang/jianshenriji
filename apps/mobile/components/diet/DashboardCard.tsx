import { View } from "react-native";
import {
  Text as BentoText,
  ProgressBar,
  useBentoTheme,
  type SemanticColor,
} from "../bento";
import type { DashboardMetric } from "./types";

export function DashboardLegend() {
  const c = useBentoTheme().colors;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: "auto" }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <BentoText variant="micro" color={c.positive}>绿色</BentoText>
        <BentoText variant="micro" color={c.inkMute}>为目标数据</BentoText>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <BentoText variant="micro" color={c.accent}>蓝色</BentoText>
        <BentoText variant="micro" color={c.inkMute}>为实际数据</BentoText>
      </View>
    </View>
  );
}

export function DeficitHero({
  deficit,
  target,
}: {
  deficit: number;
  target: number;
}) {
  const c = useBentoTheme().colors;
  const remaining = Math.max(0, target - deficit);
  const hint = remaining > 0 ? `还需 ${Math.round(remaining)} kcal` : "已达成";
  const progress = target > 0 ? Math.min(1, deficit / target) : 0;
  const delta = deficit - target;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 2, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.glassBorder }}>
      <View style={{ width: 56, justifyContent: "center", gap: 3 }}>
        <BentoText variant="caption" color={c.inkMute} style={{ fontSize: 13, lineHeight: 16 }}>
          热量赤字
        </BentoText>
        <BentoText variant="micro" color={c.accent}>{hint}</BentoText>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <MetricDataRow label="目标" value={target} unit="kcal" textColor={c.positive} barColor="positive" percent={1} large />
        <MetricDataRow label="实际" value={deficit} unit="kcal" textColor={c.accent} barColor="accent" percent={progress} large />
      </View>
      <MetricDelta value={delta} />
    </View>
  );
}

export function MetricMini({ metric }: { metric: DashboardMetric }) {
  const c = useBentoTheme().colors;
  const delta = metric.actual - metric.target;
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, paddingVertical: 8 }}>
      <View style={{ width: 40, justifyContent: "center" }}>
        <BentoText variant="caption" color={c.inkMute} style={{ fontSize: 12, lineHeight: 14 }}>
          {metric.label}
        </BentoText>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <MetricDataRow label="目标" value={metric.target} unit={metric.unit} textColor={c.positive} barColor="positive" percent={1} />
        <MetricDataRow label="实际" value={metric.actual} unit={metric.unit} textColor={c.accent} barColor="accent" percent={metric.progress} />
      </View>
      <MetricDelta value={delta} compact />
    </View>
  );
}

export function MetricDelta({ value, compact = false }: { value: number; compact?: boolean }) {
  const c = useBentoTheme().colors;
  return (
    <BentoText
      mono
      weight="semibold"
      color={value >= 0 ? c.positive : c.warn}
      style={{ fontSize: compact ? 10 : 11, width: compact ? 34 : 52, textAlign: "right" }}
    >
      {value >= 0 ? "+" : ""}{Math.round(value)}
    </BentoText>
  );
}

export function MetricDataRow({
  value,
  unit,
  textColor,
  barColor,
  percent,
  large = false,
}: {
  label: string;
  value: number;
  unit: string;
  textColor: string;
  barColor: SemanticColor;
  percent: number;
  large?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: large ? 10 : 8 }}>
      <MetricValueRow value={value} unit={unit} color={textColor} large={large} />
      <View style={{ flex: 1, minWidth: large ? 92 : 72 }}>
        <ProgressBar percent={percent} color={barColor} height={large ? 7 : 6} />
      </View>
    </View>
  );
}

function MetricValueRow({
  label,
  value,
  unit,
  color,
  muted = false,
  large = false,
}: {
  label?: string;
  value: number;
  unit: string;
  color: string;
  muted?: boolean;
  large?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, opacity: muted ? 0.52 : 1 }}>
      {label ? <BentoText variant="micro" color={color} style={{ width: 28 }}>{label}</BentoText> : null}
      <BentoText mono weight="bold" color={color} style={{ fontSize: large ? 28 : 18, lineHeight: large ? 30 : 20 }}>
        {Math.round(value)}
      </BentoText>
      <BentoText mono color={color} style={{ fontSize: large ? 12 : 10 }}>{unit}</BentoText>
    </View>
  );
}

export function MacroRow({ metric }: { metric: DashboardMetric }) {
  const c = useBentoTheme().colors;
  const delta = metric.actual - metric.target;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <BentoText variant="caption" color={c.ink} style={{ width: 42 }}>
        {metric.label}
      </BentoText>
      <View style={{ flex: 1, gap: 4 }}>
        <MetricDataRow label="目标" value={metric.target} unit={metric.unit} textColor={c.positive} barColor="positive" percent={1} />
        <MetricDataRow label="实际" value={metric.actual} unit={metric.unit} textColor={c.accent} barColor="accent" percent={metric.progress} />
      </View>
      <MetricDelta value={delta} />
    </View>
  );
}
