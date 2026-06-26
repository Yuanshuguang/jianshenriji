/**
 * Bento Glass · ProgressBar
 * 胶囊进度条，用于宏量营养、分摊等
 */
import { useEffect, useRef } from "react";
import { Animated, View, type ViewProps, type ViewStyle } from "react-native";
import { radius, type SemanticColor } from "./tokens";
import { resolveThemeColor, useBentoTheme } from "./ThemeProvider";

export type ProgressBarProps = ViewProps & {
  percent: number; // 0 ~ 1（超过 1 显示 warn 色）
  color?: SemanticColor;
  trackColor?: string;
  height?: number;
  animated?: boolean;
};

export function ProgressBar({
  percent,
  color = "accent",
  trackColor = "rgba(255,255,255,0.08)",
  height = 6,
  animated = true,
  style,
  ...rest
}: ProgressBarProps) {
  const theme = useBentoTheme();
  const colors = theme.colors;
  const progress = useRef(new Animated.Value(0)).current;
  const over = percent > 1;
  const clamped = Math.min(1, Math.max(0, percent));
  const fillColor = over ? colors.warn : colors[color];

  useEffect(() => {
    if (!animated) {
      progress.setValue(clamped);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: clamped,
      duration: 480,
      useNativeDriver: false,
    }).start();
  }, [clamped, animated, progress]);

  const container: ViewStyle = {
    width: "100%",
    height,
    borderRadius: radius.pill,
    backgroundColor: resolveThemeColor(trackColor, theme) ?? colors.glass,
    overflow: "hidden",
  };

  return (
    <View style={[container, style]} {...rest}>
      <Animated.View
        style={{
          height: "100%",
          borderRadius: radius.pill,
          backgroundColor: fillColor,
          width: progress.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
        }}
      />
    </View>
  );
}

export default ProgressBar;
