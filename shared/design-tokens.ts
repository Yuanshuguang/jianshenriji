/**
 * Bento Glass · Design Tokens（纯数据，无 RN 依赖）
 *
 * 健身饮食动态计划助手 · 统一视觉语言
 * 风格：Liquid Glass —— 模块化、磨砂玻璃、日夜外观、柔和彩色底图
 *
 * RN 特定样式（shadowOffset / elevation）请在 mobile 端 tokens.ts 里基于这些纯数据组装。
 */

export const colors = {
  // 背景层（日间）
  bg: "#EEF6FF",
  bgGlow: "#F8FBFF",

  // 玻璃层（rgba，便于叠加）
  glass: "rgba(255,255,255,0.48)",
  glassRaised: "rgba(255,255,255,0.66)",
  glassBorder: "rgba(255,255,255,0.54)",
  glassBorderBright: "rgba(255,255,255,0.86)",

  // 文字层
  ink: "#142033",
  inkMute: "#617188",
  inkFaint: "#94A1B3",

  // 强调色
  accent: "#008CFF", // iOS 蓝 · 热量 / 主操作
  accent2: "#7357FF", // 柔紫 · 训练 / 赤字
  positive: "#00A978", // 绿 · 达标 / 完成
  warn: "#E4435E", // 红 · 超额 / 警告
  amber: "#C47B00", // 琥珀 · 接近上限 / 注意
} as const;

export const darkColors = {
  bg: "#101827",
  bgGlow: "#1A2436",
  glass: "rgba(255,255,255,0.12)",
  glassRaised: "rgba(255,255,255,0.18)",
  glassBorder: "rgba(255,255,255,0.20)",
  glassBorderBright: "rgba(255,255,255,0.36)",
  ink: "#F4F8FF",
  inkMute: "#B7C3D4",
  inkFaint: "#7F8CA1",
  accent: "#41B6FF",
  accent2: "#A893FF",
  positive: "#48D6AC",
  warn: "#FF7188",
  amber: "#FFB84D",
} as const;

/** 辉光色（用于阴影 / 光晕，rgba 字符串） */
export const glows = {
  accent: "rgba(56,189,248,0.20)",
  accent2: "rgba(167,139,250,0.20)",
  positive: "rgba(52,211,153,0.20)",
  warn: "rgba(251,113,133,0.20)",
  amber: "rgba(251,191,36,0.20)",
} as const;

export const typography = {
  // 字体族（在 RN 端通过 expo-font 加载后映射；未加载时回退系统字体）
  fontSans: "Outfit",
  fontMono: "GeistMono",
  fontCJK: "PingFang SC",

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

/** 进度环渐变色（青蓝 → 紫罗兰） */
export const ringGradient = [colors.accent, colors.accent2] as const;

/**
 * 数据语义 → 强调色映射
 * 用于根据数据类型选择对应霓虹色
 */
export const dataColor = {
  calories: colors.accent,
  training: colors.accent2,
  protein: colors.accent,
  fat: colors.accent2,
  carbs: colors.positive,
  positive: colors.positive,
  warn: colors.warn,
  amber: colors.amber,
  deficit: colors.accent2,
} as const;

/** 语义色名 → 辉光色 */
export const semanticGlow = {
  accent: glows.accent,
  accent2: glows.accent2,
  positive: glows.positive,
  warn: glows.warn,
  amber: glows.amber,
} as const;

export type DesignTokens = typeof colors &
  typeof typography &
  typeof spacing;

export const designTokens = {
  colors,
  darkColors,
  glows,
  typography,
  spacing,
  radius,
  bento,
  motion,
  ringGradient,
  dataColor,
  semanticGlow,
};
