import { View } from "react-native";
import {
  Badge,
  GlassTile,
  Label,
  Text as BentoText,
  useBentoTheme,
  type SemanticColor,
} from "../bento";

export function AdjustmentSummaryCard({ summary }: { summary: ReturnType<typeof import("../../features/adjustments").buildDailyAdjustmentSummary> }) {
  const c = useBentoTheme().colors;
  const color: SemanticColor = summary.netDelta > 0 ? "warn" : "positive";
  return (
    <GlassTile glow={color} style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Label color={c.inkMute} variant="label">ADJUST / 动态调整</Label>
          <BentoText weight="semibold" variant="caption" color={c[color]}>
            {summary.title}
          </BentoText>
        </View>
        <Badge color={color} size="sm">
          {summary.netDelta >= 0 ? "+" : ""}{summary.netDelta} kcal
        </Badge>
      </View>
      <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 20 }}>
        {summary.reason}
      </BentoText>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Badge color="accent" size="sm">分摊 {summary.days} 天</Badge>
        <Badge color="positive" size="sm">新目标 {summary.adjustedDailyCalories} kcal/天</Badge>
        <Badge color="accent2" size="sm">蛋白 {Math.round(summary.adjustedMacros.proteinG)}g</Badge>
      </View>
      {summary.warning ? (
        <BentoText variant="caption" color={c.warn}>{summary.warning}</BentoText>
      ) : null}
      {summary.dietQualityWarnings.slice(0, 3).map((warning) => (
        <BentoText key={warning} variant="caption" color={c.amber} style={{ lineHeight: 18 }}>
          {warning}
        </BentoText>
      ))}
    </GlassTile>
  );
}
