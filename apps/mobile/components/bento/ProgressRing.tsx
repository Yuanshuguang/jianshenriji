/**
 * Bento Glass · ProgressRing
 * 渐变进度环（青蓝 → 紫罗兰），用于热量、完成度等核心指标
 */
import { View, type ViewProps } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors as defaultColors, type SemanticColor } from "./tokens";
import { resolveThemeColor, useBentoTheme } from "./ThemeProvider";
import { Text } from "./Text";

export type ProgressRingProps = ViewProps & {
  size?: number;
  stroke?: number;
  percent: number; // 0 ~ 1（可超过 1，会截断）
  color?: SemanticColor; // 单色；不传则用渐变
  trackColor?: string;
  showLabel?: boolean;
  label?: string;
  value?: string; // 中心数字
  animated?: boolean;
};

export function ProgressRing({
  size = 96,
  stroke = 10,
  percent,
  color,
  trackColor,
  showLabel = true,
  label,
  value,
  style,
  ...rest
}: ProgressRingProps) {
  const theme = useBentoTheme();
  const colors = theme.colors;
  const clamped = Math.min(1, Math.max(0, percent));
  const resolvedTrackColor = trackColor ?? (theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)");

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const strokeDashoffset = circumference * (1 - clamped);

  // 接近/超过 100% 用琥珀色
  const isFull = clamped >= 0.96;
  const strokeColor = color
    ? colors[color]
    : isFull
      ? colors.amber
      : colors.accent;

  return (
    <View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style]} {...rest}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={center} cy={center} r={radius} stroke={resolveThemeColor(resolvedTrackColor, theme) ?? defaultColors.glass} strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={strokeColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {showLabel ? (
        <View style={{ position: "absolute", alignItems: "center" }}>
          {value ? (
            <Text mono weight="bold" variant="h2" color={isFull ? colors.amber : strokeColor}>
              {value}
            </Text>
          ) : null}
          {label ? (
            <Text variant="micro" color={colors.inkMute} style={{ marginTop: 2 }}>
              {label}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default ProgressRing;
