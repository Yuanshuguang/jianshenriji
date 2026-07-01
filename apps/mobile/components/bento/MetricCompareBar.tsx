import { View, type ViewProps, type ViewStyle } from "react-native";
import { type SemanticColor } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";
import { getMetricCompareParts } from "./metric-compare";

export type MetricCompareBarProps = ViewProps & {
  actual: number;
  target: number;
  color?: SemanticColor;
  overflowColor?: SemanticColor;
  height?: number;
  showTargetMarker?: boolean;
};

export function MetricCompareBar({
  actual,
  target,
  color = "accent",
  overflowColor = "warn",
  height = 6,
  showTargetMarker = true,
  style,
  ...rest
}: MetricCompareBarProps) {
  const { colors } = useBentoTheme();
  const parts = getMetricCompareParts(actual, target);
  const markerLeft = `${parts.targetPercent * 100}%`;

  const container: ViewStyle = {
    position: "relative",
    width: "100%",
    height,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.12)",
    overflow: "hidden",
  };

  return (
    <View style={[container, style]} {...rest}>
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: `${parts.actualPercent * 100}%`,
          borderRadius: 999,
          backgroundColor: colors[color],
        }}
      />
      {parts.overflowPercent > 0 ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${parts.overflowStartPercent * 100}%`,
            width: `${parts.overflowPercent * 100}%`,
            backgroundColor: colors[overflowColor],
          }}
        />
      ) : null}
      {showTargetMarker ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: markerLeft as unknown as number,
            width: 2,
            marginLeft: -1,
            backgroundColor: colors[color],
            borderWidth: 1,
            borderColor: colors.bg,
            shadowColor: colors[color],
            shadowOpacity: 0.35,
            shadowRadius: 4,
          }}
        />
      ) : null}
    </View>
  );
}

export default MetricCompareBar;
