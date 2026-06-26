/**
 * Bento Glass · GlassTile
 * 毛玻璃卡片，Bento 风格的核心容器
 */
import { Platform, View, type ViewProps, type ViewStyle } from "react-native";
import { bento, type SemanticColor } from "./tokens";
import { useBentoTheme } from "./ThemeProvider";
import type { ReactNode } from "react";

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
  const shadowStyle: ViewStyle = Platform.OS === "web"
    ? {
        boxShadow: `0px 8px ${raised ? 20 : 16}px ${glow ? `${theme.colors[glow]}29` : "rgba(0,0,0,0.14)"}`,
      }
    : {
        shadowColor: glow ? theme.colors[glow] : "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: theme.isDark ? (raised ? 0.45 : 0.35) : (raised ? 0.22 : 0.16),
        shadowRadius: raised ? 20 : 16,
        elevation: raised ? 8 : 4,
      };

  const base: ViewStyle = {
    backgroundColor: raised ? theme.colors.glassRaised : theme.colors.glass,
    borderRadius: radius ?? bento.tileRadius,
    borderWidth: 1,
    borderColor: raised ? theme.colors.glassBorderBright : theme.colors.glassBorder,
    padding: padding ?? bento.tilePadding,
    overflow: "hidden",
    ...shadowStyle
  };
  return (
    <View style={[base, style]} {...rest}>
      {children}
    </View>
  );
}

export default GlassTile;
