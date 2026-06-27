/**
 * Bento Glass · Design Tokens
 * 健身饮食动态计划助手 · 统一视觉语言
 *
 * 可直接用于 React Native（StyleSheet）或 Web（CSS-in-JS）。
 * 颜色统一用 hex 或 rgba 字符串；RN 端 backdrop-filter 用 expo-blur。
 */

export const colors = {
  // 背景层
  bg: "#0B1120",
  bgGlow: "#131C30",

  // 玻璃层
  glass: "rgba(255,255,255,0.06)",
  glassRaised: "rgba(255,255,255,0.09)",
  glassBorder: "rgba(255,255,255,0.12)",
  glassBorderBright: "rgba(255,255,255,0.20)",

  // 文字层
  ink: "#F1F5F9",
  inkMute: "#94A3B8",
  inkFaint: "#64748B",

  // 强调色（霓虹）
  accent: "#38BDF8", // 青蓝 · 热量/主操作
  accent2: "#A78BFA", // 紫罗兰 · 训练/赤字
  positive: "#34D399", // 翡翠绿 · 达标/完成
  warn: "#FB7185", // 玫红 · 超额/警告
  amber: "#FBBF24", // 琥珀 · 接近上限

  // 辉光（rgba，用于阴影/光晕）
  glowAccent: "rgba(56,189,248,0.20)",
  glowAccent2: "rgba(167,139,250,0.20)",
  glowPositive: "rgba(52,211,153,0.20)",
  glowWarn: "rgba(251,113,133,0.20)",
} as const;

export const typography = {
  fontSans: "Outfit",
  fontMono: "GeistMono",
  fontCJK: "PingFang SC", // iOS；Android 回退到系统 sans

  sizes: {
    display: 48,
    h1: 28,
    h2: 22,
    h3: 17,
    body: 14,
    bodyStrong: 14,
    caption: 12,
    label: 11,
    micro: 10,
  },

  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },

  lineHeights: {
    display: 1.0,
    h1: 1.2,
    h2: 1.25,
    h3: 1.3,
    body: 1.5,
    caption: 1.4,
    label: 1.0,
    micro: 1.0,
  },

  tracking: {
    label: 0.08, // +0.08em
    micro: 0.12, // +0.12em
    normal: 0,
  },
} as const;

export const spacing = {
  space0: 0,
  space1: 4,
  space2: 8,
  space3: 12,
  space4: 16,
  space5: 20,
  space6: 24,
  space8: 32,
  space10: 40,
} as const;

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const bento = {
  pagePadding: 16,
  tileGap: 8,
  tileRadius: 22,
  tileRadiusSmall: 18,
  tilePadding: 16,
} as const;

export const shadows = {
  none: "none",
  sm: "0 2px 8px rgba(0,0,0,0.2)",
  md: "0 8px 32px rgba(0,0,0,0.3)",
  lg: "0 12px 40px rgba(0,0,0,0.4)",
  glowAccent: "0 0 24px rgba(56,189,248,0.15)",
  glowAccent2: "0 0 24px rgba(167,139,250,0.15)",
  glowPositive: "0 0 20px rgba(52,211,153,0.15)",
  glowWarn: "0 0 20px rgba(251,113,133,0.15)",
} as const;

export const motion = {
  instant: 0,
  fast: 150,
  normal: 280,
  slow: 480,
  ring: 680,
  // 缓动：cubic-bezier(0.4, 0, 0.2, 1) 标准
  easingStandard: [0.4, 0, 0.2, 1] as const,
  easingOut: [0, 0, 0.2, 1] as const,
} as const;

/**
 * 玻璃格样式工厂
 * 用法：StyleSheet.create({ card: glassTileStyle({ raised: true, glow: colors.glowAccent }) })
 */
export function glassTileStyle(opts?: {
  raised?: boolean;
  glow?: string;
}) {
  const raised = opts?.raised ?? false;
  const glow = opts?.glow;
  return {
    backgroundColor: raised ? colors.glassRaised : colors.glass,
    borderRadius: bento.tileRadius,
    borderWidth: 1,
    borderColor: raised ? colors.glassBorderBright : colors.glassBorder,
    padding: bento.tilePadding,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: raised ? 0.4 : 0.3,
    shadowRadius: raised ? 20 : 16,
    elevation: raised ? 8 : 4,
    ...(glow
      ? {
          // RN 不支持多重 shadow，辉光用第二层叠加或 expo-linear-gradient 模拟
        }
      : {}),
  };
}

/**
 * 进度环渐变色（青蓝 → 紫罗兰）
 */
export const ringGradient = [colors.accent, colors.accent2] as const;

/**
 * 数据语义 → 强调色映射
 */
export const dataColor = {
  calories: colors.accent,
  training: colors.accent2,
  protein: colors.accent,
  fat: colors.accent2,
  carbs: colors.positive,
  positive: colors.positive,
  warn: colors.warn,
  deficit: colors.accent2,
} as const;

export type Theme = typeof colors & typeof typography & typeof spacing;
export const theme = { ...colors, ...typography, ...spacing, radius, bento, shadows, motion };
