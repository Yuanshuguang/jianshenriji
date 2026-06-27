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
        boxShadow: `0px ${raised ? 14 : 10}px ${raised ? 28 : 20}px ${glow ? `${theme.colors[glow]}24` : "rgba(0,0,0,0.22)"}`,
      }
    : {
        shadowColor: glow ? theme.colors[glow] : "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: raised ? 0.32 : 0.22,
        shadowRadius: raised ? 28 : 20,
        elevation: raised ? 7 : 3,
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
