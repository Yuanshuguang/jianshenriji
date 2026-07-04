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

/** 字体族（回退系统字体；CJK 使用平台系统字体——零体积、最高用户熟悉度）
 *
 * 策略 3：系统回退 + Barlow
 * - 拉丁/数字 → Barlow / Barlow Condensed（打包，品牌辨识度）
 * - 中文 → 系统字体（PingFang SC on iOS / 厂商字体 on Android），零包体积
 * - 中国用户每天在微信/支付宝/抖音看到的正是这些系统字体
 */
import { Platform } from "react-native";

export const fontFamilies = {
  sans: "Barlow",
  mono: "Barlow Condensed",
  cjk: Platform.select({
    ios: "PingFang SC",
    android: "System",  // Android 会自动使用厂商系统字体（华为=HarmonyOS Sans / 小米=MiSans / OPPO=OPPO Sans）
    default: "System",
  }) ?? "System",
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
  cjk?: boolean;
  tracking?: number;
  lineHeight?: number;
}): TextStyle {
  const fontFamily = opts?.cjk
    ? fontFamilies.cjk
    : opts?.mono
      ? fontFamilies.mono
      : fontFamilies.sans;
  return {
    fontFamily,
    fontSize: opts?.size ?? typoTokens.sizes.body,
    fontVariant: ["tabular-nums"],
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
