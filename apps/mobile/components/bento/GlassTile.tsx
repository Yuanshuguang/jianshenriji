import type { ReactNode } from "react";
import { Platform, View, type ViewProps, type ViewStyle } from "react-native";
import { bento, type SemanticColor } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";

export type GlassTileProps = ViewProps & {
  raised?: boolean;
  glow?: SemanticColor;
  radius?: number;
  padding?: number;
  children?: ReactNode;
};

export function GlassTile({
  raised = false,
  glow,
  radius,
  padding,
  style,
  children,
  ...rest
}: GlassTileProps) {
  const theme = useBentoTheme();
  const shadowBase = theme.isDark ? "rgba(0,0,0,0.40)" : "rgba(15,23,42,0.10)";
  const shadowOpacity = theme.isDark ? (raised ? 0.34 : 0.24) : (raised ? 0.10 : 0.06);

  const shadowStyle: ViewStyle = Platform.OS === "web"
    ? {
        boxShadow: `0px ${raised ? 12 : 8}px ${raised ? 22 : 16}px ${glow ? `${theme.colors[glow]}18` : shadowBase}`,
      }
    : {
        shadowColor: glow ? theme.colors[glow] : "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity,
        shadowRadius: raised ? 20 : 14,
        elevation: raised ? 5 : 2,
      };

  const base: ViewStyle = {
    backgroundColor: raised
      ? theme.colors.glassRaised
      : theme.isDark
        ? theme.colors.glass
        : "#FFFFFF",
    borderRadius: radius ?? bento.tileRadius,
    borderWidth: 1,
    borderColor: raised
      ? theme.colors.glassBorderBright
      : theme.isDark
        ? theme.colors.glassBorder
        : "rgba(15,23,42,0.08)",
    padding: padding ?? bento.tilePadding,
    overflow: "hidden",
    ...shadowStyle,
  };

  return (
    <View style={[base, style]} {...rest}>
      {children}
    </View>
  );
}

export default GlassTile;
