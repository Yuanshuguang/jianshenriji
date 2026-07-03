/**
 * Bento Glass · MetricBarWithCursor
 * 单条进度条 + 向下三角游标，同时表示"目标"和"实际"。
 * 纯函数逻辑在 metric-display.ts，方便 Node 测。
 */
import { useMemo, type ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { Text } from "./Text";
import { Label } from "./Label";
import { MetricCompareBar } from "./MetricCompareBar";
import { type SemanticColor } from "./tokens";
import { useBentoTheme, resolveThemeColor } from "./ThemeProvider";
import { computeMetricDisplay, type MetricDisplay, type MetricState } from "./metric-display";

export { computeMetricDisplay };
export type { MetricDisplay, MetricState };

export type MetricBarSize = "hero" | "full" | "compact";

export type MetricBarWithCursorProps = {
  label: string;
  actual: number;
  target: number;
  unit?: string;
  baseColor?: SemanticColor;
  size?: MetricBarSize;
  trailing?: ReactNode;
  actualText?: string;
  targetText?: string;
  showSubtitle?: boolean;
  style?: ViewStyle;
};

export function MetricBarWithCursor({
  label,
  actual,
  target,
  unit = "",
  baseColor = "accent",
  size = "full",
  trailing,
  actualText,
  targetText,
  showSubtitle = true,
  style,
}: MetricBarWithCursorProps) {
  const { colors, isDark } = useBentoTheme();
  const display = useMemo(
    () => computeMetricDisplay({ actual, target, unit, baseColor }),
    [actual, target, unit, baseColor]
  );

  const dim = sizeDims[size];
  const cursorPixelX = `${display.cursorPercent * 100}%`;
  const actualLabel = actualText ?? `${Math.round(actual)}${unit}`;
  const targetLabel = targetText ?? `${Math.round(target)}${unit}`;

  return (
    <View style={[{ gap: dim.gap }, style]}>
      <View style={{ flexDirection: "row", alignItems: dim.labelAlign, gap: 10 }}>
        {size === "compact" ? null : (
          <Label color={colors.inkMute} variant={dim.labelVariant} style={{ minWidth: dim.labelMinWidth }}>
            {label}
          </Label>
        )}
        <View style={{ flex: 1, flexDirection: "row", alignItems: "baseline", gap: 4 }}>
          <Text
            mono
            weight="bold"
            color={colors[baseColor]}
            style={{ fontSize: dim.actualFontSize, lineHeight: dim.actualFontSize + 2 }}
          >
            {actualLabel}
          </Text>
          {size === "compact" ? (
            <Text mono color={colors.inkMute} style={{ fontSize: dim.unitFontSize }}>
              / {targetLabel}
            </Text>
          ) : (
            <Text mono color={colors.inkMute} style={{ fontSize: dim.unitFontSize }}>
              {unit} · 目标 {targetLabel}
            </Text>
          )}
        </View>
        {size === "compact" ? (
          <Text
            variant="micro"
            color={colors[display.subtitleTone]}
            style={{ fontSize: 11, lineHeight: 13 }}
          >
            {label}
          </Text>
        ) : null}
        {trailing}
      </View>
      <View style={{ position: "relative", paddingTop: dim.cursorHeight + 2 }}>
        <View
          style={[
            {
              position: "absolute",
              top: 0,
              left: cursorPixelX as unknown as number,
              marginLeft: -dim.cursorWidth / 2,
              width: dim.cursorWidth,
              height: dim.cursorHeight,
              zIndex: 2,
            },
            { pointerEvents: "none" },
          ]}
        >
          <Svg width={dim.cursorWidth} height={dim.cursorHeight} viewBox={"0 0 " + dim.cursorWidth + " " + dim.cursorHeight}>
            <Polygon
              points={"0,0 " + dim.cursorWidth + ",0 " + (dim.cursorWidth / 2) + "," + dim.cursorHeight}
              fill={resolveThemeColor(colors[display.cursorColor], { colors, isDark } as any) ?? colors[display.cursorColor]}
            />
          </Svg>
        </View>
        <MetricCompareBar
          actual={actual}
          target={target}
          color={display.fillColor}
          height={dim.barHeight}
          showTargetMarker={false}
        />
      </View>
      {showSubtitle ? (
        <Text
          variant="caption"
          color={colors[display.subtitleTone]}
          style={{ fontSize: dim.subtitleFontSize, lineHeight: dim.subtitleFontSize + 4 }}
        >
          {display.subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const sizeDims: Record<MetricBarSize, {
  gap: number;
  barHeight: number;
  cursorWidth: number;
  cursorHeight: number;
  actualFontSize: number;
  unitFontSize: number;
  subtitleFontSize: number;
  labelVariant: "label" | "micro";
  labelMinWidth: number;
  labelAlign: "baseline" | "center";
}> = {
  hero:    { gap: 8, barHeight: 9, cursorWidth: 14, cursorHeight: 8, actualFontSize: 28, unitFontSize: 12, subtitleFontSize: 12, labelVariant: "label", labelMinWidth: 56, labelAlign: "baseline" },
  full:    { gap: 6, barHeight: 7, cursorWidth: 12, cursorHeight: 7, actualFontSize: 20, unitFontSize: 11, subtitleFontSize: 12, labelVariant: "label", labelMinWidth: 56, labelAlign: "baseline" },
  compact: { gap: 5, barHeight: 6, cursorWidth: 10, cursorHeight: 6, actualFontSize: 15, unitFontSize: 10, subtitleFontSize: 11, labelVariant: "micro", labelMinWidth: 0,  labelAlign: "baseline" },
};

export default MetricBarWithCursor;
