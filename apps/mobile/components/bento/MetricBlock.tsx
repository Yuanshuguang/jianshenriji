/**
 * Bento Glass · MetricBlock
 * 玻璃格内的「标签 + 大数字 + 单位」组合，仪表盘核心单元
 */
import { View, type ViewProps } from "react-native";
import { type SemanticColor } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";
import { Text } from "./Text";
import { Label } from "./Label";
import type { ReactNode } from "react";

export type MetricBlockProps = ViewProps & {
  label?: string; // 全大写小标签
  value: string | number;
  unit?: string;
  color?: SemanticColor;
  valueSize?: "h2" | "h1" | "display";
  detail?: string;
  children?: ReactNode;
};

export function MetricBlock({
  label,
  value,
  unit,
  color = "accent",
  valueSize = "h2",
  detail,
  style,
  children,
}: MetricBlockProps) {
  const { colors } = useBentoTheme();
  const accentColor = colors[color];
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? (
        <Label color={colors.inkMute} variant="label">
          {label}
        </Label>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
        <Text mono weight="bold" variant={valueSize} color={accentColor}>
          {value}
        </Text>
        {unit ? (
          <Text mono color={colors.inkMute} style={{ fontSize: 11 }}>
            {unit}
          </Text>
        ) : null}
      </View>
      {detail ? (
        <Text variant="caption" color={colors.inkMute}>
          {detail}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

export default MetricBlock;
