import type { ReactNode } from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";
import { radius, type SemanticColor } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";
import { Text } from "./Text";

export type BadgeProps = ViewProps & {
  color?: SemanticColor;
  size?: "sm" | "md";
  children?: ReactNode;
};

export function Badge({
  color = "accent",
  size = "md",
  style,
  children,
  ...rest
}: BadgeProps) {
  const { colors } = useBentoTheme();
  const accentColor = colors[color];
  const heights = { sm: 22, md: 26 };
  const fontSizes = { sm: 10, md: 11 } as const;
  const pad = { sm: 8, md: 10 } as const;

  const base: ViewStyle = {
    height: heights[size],
    paddingHorizontal: pad[size],
    borderRadius: radius.pill,
    backgroundColor: `${accentColor}14`,
    borderWidth: 1,
    borderColor: `${accentColor}28`,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    alignSelf: "flex-start",
  };

  return (
    <View style={[base, style]} {...rest}>
      <Text weight="semibold" color={accentColor} style={{ fontSize: fontSizes[size] }}>
        {children}
      </Text>
    </View>
  );
}

export default Badge;
