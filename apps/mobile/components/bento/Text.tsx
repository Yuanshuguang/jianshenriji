/**
 * Bento Glass · Text
 * 统一文本组件，封装字体族与默认色
 */
import { Text as RNText, type TextProps, type TextStyle } from "react-native";
import { colors, fontFamilies, typography } from "./tokens";
import { resolveThemeColor, useBentoTheme } from "./ThemeProvider";
import type { ReactNode } from "react";

export type BentoTextProps = TextProps & {
  variant?: keyof typeof typography.sizes;
  weight?: keyof typeof typography.weights;
  color?: string;
  mono?: boolean;
  tracking?: number;
  uppercase?: boolean;
  children?: ReactNode;
};

/** variant → lineHeights key 映射（lineHeights 没有 bodyStrong，归到 body） */
function lineHeightKey(variant: keyof typeof typography.sizes): keyof typeof typography.lineHeights {
  if (variant === "bodyStrong") return "body";
  return variant as keyof typeof typography.lineHeights;
}

export function Text({
  variant = "body",
  weight = "regular",
  color = colors.ink,
  mono = false,
  tracking,
  uppercase = false,
  style,
  children,
  ...rest
}: BentoTextProps) {
  const theme = useBentoTheme();
  const size = typography.sizes[variant];
  const lhKey = lineHeightKey(variant);
  const lineHeight = Math.round(size * typography.lineHeights[lhKey]);

  const base: TextStyle = {
    fontFamily: mono ? fontFamilies.mono : fontFamilies.sans,
    fontSize: size,
    fontWeight: typography.weights[weight],
    color: resolveThemeColor(color, theme) ?? theme.colors.ink,
    lineHeight,
    letterSpacing: tracking ?? typography.tracking.normal,
    textTransform: uppercase ? "uppercase" : "none",
  };

  return (
    <RNText style={[base, style]} {...rest}>
      {children}
    </RNText>
  );
}

export default Text;
