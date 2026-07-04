import type { ReactNode } from "react";
import { Pressable, type PressableProps, type PressableStateCallbackType, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { radius, type SemanticColor } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";
import { Text } from "./Text";

const BTN_SPRING = { damping: 12, stiffness: 150, mass: 0.5 };
const BTN_PRESS_SCALE = 0.94;

export type ButtonProps = Omit<PressableProps, "children"> & {
  variant?: "filled" | "glass" | "ghost";
  color?: SemanticColor;
  size?: "sm" | "md" | "lg";
  block?: boolean;
  children?: ReactNode;
  /** 是否启用 press 回弹动画，默认 true */
  animated?: boolean;
};

export function Button({
  variant = "glass",
  color = "accent",
  size = "md",
  block = false,
  disabled = false,
  animated = true,
  style,
  children,
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
  ...rest
}: ButtonProps) {
  const { colors } = useBentoTheme();
  const accentColor = colors[color];
  const heights = { sm: 34, md: 42, lg: 48 };
  const fontSizes = { sm: 12, md: 13, lg: 14 } as const;

  // ── 回弹动画 ──
  const scale = useSharedValue(1);
  const animatedBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }), [scale]);

  let baseStyle: ViewStyle = {
    height: heights[size],
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    opacity: disabled ? 0.5 : 1,
  };

  if (block) {
    baseStyle = { ...baseStyle, flex: 1 };
  }

  if (variant === "filled") {
    baseStyle = { ...baseStyle, backgroundColor: accentColor };
  } else if (variant === "glass") {
    baseStyle = {
      ...baseStyle,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    };
  } else {
    baseStyle = { ...baseStyle, backgroundColor: "transparent" };
  }

  const textColor = variant === "filled" ? "#FFFFFF" : variant === "glass" ? colors.ink : colors.inkMute;

  // Animated.View 包裹 Pressable — 回弹动画 + Pressable 的原生触摸
  return (
    <Animated.View style={animated ? animatedBtnStyle : undefined}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          if (animated && !disabled) scale.value = withSpring(BTN_PRESS_SCALE, BTN_SPRING);
          onPressIn?.({} as any);
        }}
        onPressOut={() => {
          if (animated && !disabled) scale.value = withSpring(1, BTN_SPRING);
          onPressOut?.({} as any);
        }}
        onLongPress={onLongPress}
        style={[baseStyle, typeof style === "function" ? style({ pressed: false } as PressableStateCallbackType) : style]}
        {...rest}
      >
        <Text weight="semibold" color={textColor} style={{ fontSize: fontSizes[size] }}>
          {children}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default Button;
