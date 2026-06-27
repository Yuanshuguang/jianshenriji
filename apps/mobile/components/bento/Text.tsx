/**
 * Bento Glass · Text
 * 统一文本组件，封装字体族与默认色
 * 支持全局字体缩放：通过 ThemeProvider 的 fontScale 自动缩放所有文本
 */
import { StyleSheet, Text as RNText, type TextProps, type TextStyle } from "react-native";
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

function fontFamilyFor(variant: keyof typeof typography.sizes, mono: boolean) {
  if (mono || variant === "display" || variant === "h1" || variant === "h2" || variant === "h3") {
    return fontFamilies.mono;
  }

  return fontFamilies.sans;
}

/**
 * 对传入的 style prop 进行字体缩放处理。
 * - fontSize: 始终乘以 fontScale
 * - lineHeight: 仅当值 > 2（像素值）时缩放；<= 2 视为 CSS 倍率，不处理
 */
function scaleStyle(
  style: TextProps["style"],
  fontScale: number
): TextStyle {
  if (!style) return {};
  const flat = StyleSheet.flatten(style);
  if (!flat) return {};

  const result: TextStyle = { ...flat };
  if (typeof result.fontSize === "number") {
    result.fontSize = Math.round(result.fontSize * fontScale);
  }
  if (typeof result.lineHeight === "number" && result.lineHeight > 2) {
    result.lineHeight = Math.round(result.lineHeight * fontScale);
  }
  return result;
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
  const fontScale = theme.fontScale;

  // 缩放 variant 基础字号
  const rawSize = typography.sizes[variant];
  const size = Math.round(rawSize * fontScale);
  const lhKey = lineHeightKey(variant);
  const lineHeight = Math.round(size * typography.lineHeights[lhKey]);

  // 缩放传入 style 中的 fontSize / lineHeight
  const scaledStyle = scaleStyle(style, fontScale);

  const base: TextStyle = {
    fontFamily: fontFamilyFor(variant, mono),
    fontSize: size,
    fontWeight: typography.weights[weight],
    color: resolveThemeColor(color, theme) ?? theme.colors.ink,
    lineHeight,
    letterSpacing: tracking ?? typography.tracking.normal,
    textTransform: uppercase ? "uppercase" : "none",
  };

  return (
    <RNText style={[base, scaledStyle]} {...rest}>
      {children}
    </RNText>
  );
}

export default Text;
