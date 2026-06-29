/**
 * DashboardGrid
 * 按用户选择的可视化方案（dashboardStyle）渲染 6 项核心指标。
 * 支持：
 *  - bullet: 子弹图，6 项 3×2 网格
 *  - barCursor: 单条 + 三角游标，每项独占一行（保留原行为）
 *  - kpiCards: 大卡片网格，每张含数字与条
 *  - rings: 6 个同心圆环
 */
import { View, useWindowDimensions } from "react-native";
import {
  BulletChart,
  GlassTile,
  Label,
  MetricBarWithCursor,
  ProgressRing,
  Text as BentoText,
  type SemanticColor,
  useBentoTheme,
} from "../bento";
import { computeMetricDisplay } from "../bento";
import type { DashboardMetric } from "./types";
import type { DashboardStyle } from "../../store/fitness-store";

export type DashboardCell = {
  key: string;
  label: string;
  actual: number;
  target: number;
  unit: string;
  baseColor: SemanticColor;
};

export type DashboardGridProps = {
  style: DashboardStyle;
  metrics: DashboardCell[];
};

export function DashboardGrid({ style, metrics }: DashboardGridProps) {
  if (style === "bullet") return <BulletGrid metrics={metrics} />;
  if (style === "kpiCards") return <KpiCardsGrid metrics={metrics} />;
  if (style === "rings") return <RingsGrid metrics={metrics} />;
  return <BarCursorList metrics={metrics} />;
}

// === bullet: 3×2 子弹图网格 ===
function BulletGrid({ metrics }: { metrics: DashboardCell[] }) {
  const { width } = useWindowDimensions();
  const columns = width >= 720 ? 3 : 2;
  const rows: DashboardCell[][] = [];
  for (let i = 0; i < metrics.length; i += columns) {
    rows.push(metrics.slice(i, i + columns));
  }
  return (
    <View style={{ gap: 10 }}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={{ flexDirection: "row", gap: 10 }}>
          {row.map((cell) => (
            <BulletCell key={cell.key} cell={cell} flex={1} />
          ))}
        </View>
      ))}
    </View>
  );
}

function BulletCell({ cell, flex }: { cell: DashboardCell; flex: number }) {
  const c = useBentoTheme().colors;
  return (
    <GlassTile radius={14} padding={10} style={{ flex, gap: 6, minHeight: 88 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Label color={c.inkMute} variant="label">{cell.label}</Label>
        <BentoText variant="micro" color={c.inkFaint} style={{ fontSize: 10 }}>
          目标 {Math.round(cell.target)}{cell.unit}
        </BentoText>
      </View>
      <BentoText mono weight="bold" color={c[cell.baseColor]} style={{ fontSize: 22, lineHeight: 24 }}>
        {Math.round(cell.actual)}
        <BentoText mono color={c.inkMute} style={{ fontSize: 11 }}> {cell.unit}</BentoText>
      </BentoText>
      <BulletChart
        label=""
        actual={cell.actual}
        target={cell.target}
        unit={cell.unit}
        baseColor={cell.baseColor}
      />
    </GlassTile>
  );
}

// === barCursor: 单条 + 游标，6 项堆叠 ===
function BarCursorList({ metrics }: { metrics: DashboardCell[] }) {
  return (
    <View style={{ gap: 10 }}>
      {metrics.map((cell) => (
        <MetricBarWithCursor
          key={cell.key}
          label={cell.label}
          actual={cell.actual}
          target={cell.target}
          unit={cell.unit}
          baseColor={cell.baseColor}
          size="full"
        />
      ))}
    </View>
  );
}

// === kpiCards: 2 列大卡片，每张含数字+条+差额 ===
function KpiCardsGrid({ metrics }: { metrics: DashboardCell[] }) {
  const { width } = useWindowDimensions();
  const columns = width >= 720 ? 3 : 2;
  const rows: DashboardCell[][] = [];
  for (let i = 0; i < metrics.length; i += columns) {
    rows.push(metrics.slice(i, i + columns));
  }
  return (
    <View style={{ gap: 10 }}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={{ flexDirection: "row", gap: 10 }}>
          {row.map((cell) => (
            <KpiCard key={cell.key} cell={cell} flex={1} />
          ))}
        </View>
      ))}
    </View>
  );
}

function KpiCard({ cell, flex }: { cell: DashboardCell; flex: number }) {
  const c = useBentoTheme().colors;
  const display = require("../bento").computeMetricDisplay({
    actual: cell.actual,
    target: cell.target,
    unit: cell.unit,
    baseColor: cell.baseColor
  });
  return (
    <GlassTile radius={16} padding={12} style={{ flex, gap: 8, minHeight: 124 }}>
      <Label color={c.inkMute} variant="label">{cell.label}</Label>
      <BentoText mono weight="bold" color={c[display.state === "over" ? "amber" : cell.baseColor]} style={{ fontSize: 28, lineHeight: 30 }}>
        {Math.round(cell.actual)}
        <BentoText mono color={c.inkMute} style={{ fontSize: 11 }}> {cell.unit}</BentoText>
      </BentoText>
      <BentoText variant="micro" color={c.inkMute} style={{ fontSize: 11 }}>
        目标 {Math.round(cell.target)}{cell.unit}
      </BentoText>
      <MetricBarWithCursor
        label=""
        actual={cell.actual}
        target={cell.target}
        unit={cell.unit}
        baseColor={cell.baseColor}
        size="compact"
        showSubtitle={false}
      />
      <BentoText variant="micro" color={(c as Record<string, string>)[display.subtitleTone]} style={{ fontSize: 11 }}>
        {display.subtitle}
      </BentoText>
    </GlassTile>
  );
}

// === rings: 6 个同心圆环 ===
function RingsGrid({ metrics }: { metrics: DashboardCell[] }) {
  const c = useBentoTheme().colors;
  const size = 200;
  const stroke = 14;
  const radius = (size - stroke) / 2 - 6;
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 8 }}>
      <View style={{ width: size, height: size }}>
        {metrics.map((cell, index) => {
          const offset = index * 12;
          const ringRadius = radius - offset;
          const circumference = 2 * Math.PI * ringRadius;
          const ratio = cell.target > 0 ? Math.min(1, cell.actual / cell.target) : 0;
          const dashOffset = circumference * (1 - ratio);
          const isOver = cell.actual > cell.target && cell.target > 0;
          const color = isOver ? c.amber : c[cell.baseColor];
          return (
            <View key={cell.key} style={{ position: "absolute", top: 0, left: 0 }} pointerEvents="none">
              <ProgressRing size={size} stroke={stroke} percent={ratio} color={cell.baseColor} showLabel={false} />
            </View>
          );
        })}
      </View>
      <BentoText variant="caption" color={c.inkMute} style={{ marginTop: 8 }}>
        从内到外：{metrics.map((cell) => cell.label).join(" / ")}
      </BentoText>
    </View>
  );
}

export function buildDashboardCells(metrics: DashboardMetric[]): DashboardCell[] {
  return metrics.map((metric) => ({
    key: metric.key,
    label: metric.label,
    actual: metric.actual,
    target: metric.target,
    unit: metric.unit,
    baseColor: metric.color
  }));
}

export default DashboardGrid;
