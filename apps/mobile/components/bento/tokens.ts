/**
 * Bento Glass · RN 端 Token 与样式工厂
 *
 * 从 shared 导入纯 token，组装成 RN 可用的 StyleSheet 与样式工厂。
 * 字体未加载时回退系统字体。
 */
import { StyleSheet } from "react-native";
import {
  bento as bentoTokens,
  colors as colorTokens,
  glows,
  radius as radiusTokens,
  spacing as spacingTokens,
  typography as typoTokens,
} from "@fitness-calendar/shared";
import type { ViewStyle, TextStyle } from "react-native";

export const colors = { ...colorTokens };
export { glows, spacingTokens as spacing, radiusTokens as radius, bentoTokens as bento, typoTokens as typography };

/** 语义色名 */
export type SemanticColor = "accent" | "accent2" | "positive" | "warn" | "amber";

/** 字体族（回退系统字体） */
export const fontFamilies = {
  sans: "System", // 后续加载 Outfit 后改为 "Outfit"
  mono: "System", // 后续加载 GeistMono 后改为 "GeistMono"
  cjk: "System",
} as const;

/** 玻璃格样式工厂 */
export function glassTileStyle(opts?: {
  raised?: boolean;
  glow?: SemanticColor;
  radius?: number;
  padding?: number;
}): ViewStyle {
  const raised = opts?.raised ?? false;
  const glow = opts?.glow;
  const radius = opts?.radius ?? bentoTokens.tileRadius;
  const padding = opts?.padding ?? bentoTokens.tilePadding;

  return {
    backgroundColor: raised ? colorTokens.glassRaised : colorTokens.glass,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: raised ? colorTokens.glassBorderBright : colorTokens.glassBorder,
    padding,
    shadowColor: glow ? glowRgb(glow) : "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: raised ? 0.4 : 0.3,
    shadowRadius: raised ? 20 : 16,
    elevation: raised ? 8 : 4,
    overflow: "hidden",
  };
}

/** 辉光 rgba → rgb（用于 shadowColor，RN shadowOpacity 控制透明度） */
function glowRgb(sem: SemanticColor): string {
  const map: Record<SemanticColor, string> = {
    accent: "56,189,248",
    accent2: "167,139,250",
    positive: "52,211,153",
    warn: "251,113,133",
    amber: "251,191,36",
  };
  return `rgb(${map[sem]})`;
}

/** 文本样式工厂 */
export function textStyle(opts?: {
  size?: number;
  weight?: keyof typeof typoTokens.weights;
  color?: string;
  mono?: boolean;
  tracking?: number;
  lineHeight?: number;
}): TextStyle {
  return {
    fontFamily: opts?.mono ? fontFamilies.mono : fontFamilies.sans,
    fontSize: opts?.size ?? typoTokens.sizes.body,
    fontWeight: opts?.weight ?? typoTokens.weights.regular,
    color: opts?.color ?? colorTokens.ink,
    lineHeight: Math.round((opts?.size ?? typoTokens.sizes.body) * (opts?.lineHeight ?? typoTokens.lineHeights.body)),
    letterSpacing: opts?.tracking ?? typoTokens.tracking.normal,
  };
}

/** 全局页面容器样式 */
export const screenContainer: ViewStyle = {
  flex: 1,
  backgroundColor: colorTokens.bg,
  paddingHorizontal: bentoTokens.pagePadding,
};

export const scrollViewContent: ViewStyle = {
  flexGrow: 1,
  gap: bentoTokens.tileGap,
  paddingBottom: 150,
};

export default StyleSheet.create({
  // 占位，保证有默认导出
  empty: {},
});
