/**
 * Bento Glass · BulletChart
 * 子弹图：单行显示 6 项并列指标的目标 vs 实际。
 * 目标位置：细竖线参考。
 * 实际位置：填充条 + 末端三角游标。
 * 紧凑、低高度，适合 3×2 网格。
 */
import { View, type ViewStyle } from "react-native";
import Svg, { Polygon, Line } from "react-native-svg";
import { Text } from "./Text";
import { type SemanticColor } from "./tokens";
import { useBentoTheme, resolveThemeColor } from "./ThemeProvider";
import { computeMetricDisplay } from "./metric-display";

export type BulletChartProps = {
  label: string;
  actual: number;
  target: number;
  unit?: string;
  baseColor?: SemanticColor;
  width?: number;
  style?: ViewStyle;
};

export function BulletChart({
  label,
  actual,
  target,
  unit = "",
  baseColor = "accent",
  width,
  style,
}: BulletChartProps) {
  const { colors, isDark } = useBentoTheme();
  const display = computeMetricDisplay({ actual, target, unit, baseColor });
  const trackColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)";
  const fill = resolveThemeColor(colors[display.cursorColor], { colors, isDark } as any) ?? colors[display.cursorColor];
  const cursorWidth = 8;
  const cursorHeight = 10;
  const barHeight = 8;
  const targetMarkerHeight = 14;

  const percent = display.percent;
  const cursorPercent = display.cursorPercent;

  // 计算各 SVG 元素位置
  const cursorXPercent = `${cursorPercent * 100}%` as unknown as number;
  const targetMarkerLeft = 100;

  return (
    <View style={[{ gap: 4 }, style]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text variant="micro" color={colors.inkMute} style={{ fontSize: 11 }} numberOfLines={1}>
          {label}
        </Text>
        <Text variant="micro" color={colors[display.subtitleTone]} numberOfLines={1} style={{ fontSize: 11 }}>
          {display.subtitle}
        </Text>
      </View>
      <View style={{ position: "relative", height: targetMarkerHeight }}>
        <Svg
          width="100%"
          height={targetMarkerHeight}
          viewBox={`0 0 100 ${targetMarkerHeight}`}
          preserveAspectRatio="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0 }}
        >
          <Line x1="0" y1={targetMarkerHeight / 2} x2="100" y2={targetMarkerHeight / 2} stroke={trackColor} strokeWidth={barHeight} strokeLinecap="round" />
          {percent > 0 ? (
            <Line
              x1="0"
              y1={targetMarkerHeight / 2}
              x2={percent * 100}
              y2={targetMarkerHeight / 2}
              stroke={fill}
              strokeWidth={barHeight}
              strokeLinecap="round"
            />
          ) : null}
          <Line
            x1="100"
            y1="0"
            x2="100"
            y2={targetMarkerHeight}
            stroke={colors.inkMute}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </Svg>
        <View
          style={[
            {
              position: "absolute",
              top: -2,
              left: cursorXPercent,
              marginLeft: -cursorWidth / 2,
              width: cursorWidth,
              height: cursorHeight,
              zIndex: 2,
            },
            { pointerEvents: "none" },
          ]}
        >
          <Svg width={cursorWidth} height={cursorHeight} viewBox={`0 0 ${cursorWidth} ${cursorHeight}`}>
            <Polygon
              points={`0,0 ${cursorWidth},0 ${cursorWidth / 2},${cursorHeight}`}
              fill={fill}
            />
          </Svg>
        </View>
      </View>
    </View>
  );
}

export default BulletChart;
