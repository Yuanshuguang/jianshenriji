/**
 * DashboardGrid
 * 按用户选择的可视化方案（dashboardStyle）渲染 6 项核心指标。
 * 支持：
 *  - bullet: 子弹图，6 项 3×2 网格
 *  - barCursor: 单条 + 三角游标，每项独占一行（保留原行为）
 *  - kpiCards: 大卡片网格，每张含数字与条
 *  - rings: 6 个环形进度卡片
 */
import { Pressable, View, useWindowDimensions } from "react-native";
import {
  GlassTile,
  Label,
  MetricBarWithCursor,
  ProgressBar,
  ProgressRing,
  Text as BentoText,
  type SemanticColor,
  useBentoTheme,
} from "../bento";
import { computeMetricDisplay } from "../bento";
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
  onMetricPress?: (cell: DashboardCell) => void;
};

export function DashboardGrid({ style, metrics, onMetricPress }: DashboardGridProps) {
  if (style === "bullet") return <BulletGrid metrics={metrics} onMetricPress={onMetricPress} />;
  if (style === "kpiCards") return <KpiCardsGrid metrics={metrics} onMetricPress={onMetricPress} />;
  if (style === "rings") return <RingsGrid metrics={metrics} onMetricPress={onMetricPress} />;
  return <BarCursorList metrics={metrics} onMetricPress={onMetricPress} />;
}

// === bullet: 首页默认仪表盘，保留子弹图判断，去掉重复数值 ===
function BulletGrid({ metrics, onMetricPress }: { metrics: DashboardCell[]; onMetricPress?: (cell: DashboardCell) => void }) {
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
            <Pressable
              key={cell.key}
              accessibilityRole="button"
              accessibilityLabel={`查看${cell.label}详情`}
              onPress={() => onMetricPress?.(cell)}
              style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.82 : 1 })}
            >
              <BulletCell cell={cell} flex={1} />
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

function BulletCell({ cell, flex }: { cell: DashboardCell; flex: number }) {
  const c = useBentoTheme().colors;
  const display = computeMetricDisplay({
    actual: cell.actual,
    target: cell.target,
    unit: cell.unit,
    baseColor: cell.baseColor
  });
  const valueColor = display.state === "over" ? c.amber : c[cell.baseColor];
  const statusColor = display.state === "over" ? c.amber : display.state === "met" ? c.positive : c.inkMute;
  const targetLabel = display.hasTarget ? `目标 ${Math.round(cell.target)}${cell.unit}` : "未设目标";

  return (
    <GlassTile radius={14} padding={10} style={{ flex, gap: 8, minHeight: 104 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Label color={c.inkMute} variant="label" style={{ flexShrink: 1 }}>{cell.label}</Label>
        <View
          style={{
            paddingHorizontal: 7,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: c.glass,
            borderWidth: 1,
            borderColor: display.state === "under" ? c.glassBorder : statusColor,
          }}
        >
          <BentoText variant="micro" color={statusColor} style={{ fontSize: 10, lineHeight: 12 }} numberOfLines={1}>
            {display.subtitle}
          </BentoText>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5 }}>
        <BentoText mono weight="bold" color={valueColor} style={{ fontSize: 27, lineHeight: 29 }}>
          {Math.round(cell.actual)}
        </BentoText>
        <BentoText mono color={c.inkMute} style={{ fontSize: 11 }}>{cell.unit}</BentoText>
      </View>
      <View style={{ gap: 5 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <BentoText variant="micro" color={c.inkMute} style={{ fontSize: 11 }} numberOfLines={1}>
            {targetLabel}
          </BentoText>
          <BentoText mono color={c.inkFaint} style={{ fontSize: 10 }}>
            {Math.round(display.ratio * 100)}%
          </BentoText>
        </View>
        <ProgressBar percent={display.percent} color={display.fillColor} height={7} />
      </View>
    </GlassTile>
  );
}

// === barCursor: 单条 + 游标，6 项堆叠 ===
function BarCursorList({ metrics, onMetricPress }: { metrics: DashboardCell[]; onMetricPress?: (cell: DashboardCell) => void }) {
  return (
    <View style={{ gap: 10 }}>
      {metrics.map((cell) => (
        <Pressable
          key={cell.key}
          accessibilityRole="button"
          accessibilityLabel={`查看${cell.label}详情`}
          onPress={() => onMetricPress?.(cell)}
          style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
        >
          <MetricBarWithCursor
            label={cell.label}
            actual={cell.actual}
            target={cell.target}
            unit={cell.unit}
            baseColor={cell.baseColor}
            size="full"
          />
        </Pressable>
      ))}
    </View>
  );
}

// === kpiCards: 2 列大卡片，每张含数字+条+差额 ===
function KpiCardsGrid({ metrics, onMetricPress }: { metrics: DashboardCell[]; onMetricPress?: (cell: DashboardCell) => void }) {
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
            <Pressable
              key={cell.key}
              accessibilityRole="button"
              accessibilityLabel={`查看${cell.label}详情`}
              onPress={() => onMetricPress?.(cell)}
              style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.82 : 1 })}
            >
              <KpiCard cell={cell} flex={1} />
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

function KpiCard({ cell, flex }: { cell: DashboardCell; flex: number }) {
  const c = useBentoTheme().colors;
  const display = computeMetricDisplay({
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

// === rings: 6 个环形进度卡片 ===
function RingsGrid({ metrics, onMetricPress }: { metrics: DashboardCell[]; onMetricPress?: (cell: DashboardCell) => void }) {
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
            <Pressable
              key={cell.key}
              accessibilityRole="button"
              accessibilityLabel={`查看${cell.label}详情`}
              onPress={() => onMetricPress?.(cell)}
              style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.82 : 1 })}
            >
              <RingCard cell={cell} flex={1} />
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

function RingCard({ cell, flex }: { cell: DashboardCell; flex: number }) {
  const c = useBentoTheme().colors;
  const ratio = cell.target > 0 ? cell.actual / cell.target : 0;
  const display = computeMetricDisplay({
    actual: cell.actual,
    target: cell.target,
    unit: cell.unit,
    baseColor: cell.baseColor
  });

  return (
    <GlassTile radius={16} padding={12} style={{ flex, minHeight: 132, alignItems: "center", gap: 8 }}>
      <ProgressRing
        size={76}
        stroke={9}
        percent={ratio}
        color={display.state === "over" ? "amber" : cell.baseColor}
        value={`${Math.round(Math.min(999, ratio * 100))}%`}
      />
      <View style={{ alignItems: "center", gap: 2 }}>
        <Label color={c.inkMute} variant="label">{cell.label}</Label>
        <BentoText variant="micro" color={c.inkMute}>
          {Math.round(cell.actual)} / {Math.round(cell.target)} {cell.unit}
        </BentoText>
      </View>
    </GlassTile>
  );
}

export default DashboardGrid;
