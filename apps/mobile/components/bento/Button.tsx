/**
 * Bento Glass · Button
 * 玻璃按钮族：Filled / Glass / Ghost
 */
import { Pressable, type PressableProps, type PressableStateCallbackType, type StyleProp, type ViewStyle } from "react-native";
import { radius, type SemanticColor } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";
import { Text } from "./Text";
import type { ReactNode } from "react";

export type ButtonProps = Omit<PressableProps, "children"> & {
  variant?: "filled" | "glass" | "ghost";
  color?: SemanticColor;
  size?: "sm" | "md" | "lg";
  block?: boolean; // 占满宽度
  children?: ReactNode;
};

export function Button({
  variant = "glass",
  color = "accent",
  size = "md",
  block = false,
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  const { colors } = useBentoTheme();
  const accentColor = colors[color];
  const heights = { sm: 36, md: 44, lg: 52 };
  const fontSizes = { sm: 13, md: 14, lg: 15 } as const;

  let baseStyle: ViewStyle = {
    height: heights[size],
    borderRadius: radius.lg,
    paddingHorizontal: 16,
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
      backgroundColor: colors.glassRaised,
      borderWidth: 1,
      borderColor: colors.glassBorderBright,
    };
  } else {
    // ghost
    baseStyle = { ...baseStyle, backgroundColor: "transparent" };
  }

  const textColor = variant === "filled" ? "#FFFFFF" : variant === "glass" ? accentColor : colors.inkMute;

  return (
    <Pressable
      disabled={disabled}
      style={(state: PressableStateCallbackType): StyleProp<ViewStyle> => {
        const extraStyle = typeof style === "function" ? style(state) : style;
        return [baseStyle, state.pressed && { opacity: 0.84 }, extraStyle];
      }}
      {...rest}
    >
      <Text weight="semibold" color={textColor} style={{ fontSize: fontSizes[size] }}>
        {children}
      </Text>
    </Pressable>
  );
}

export default Button;
