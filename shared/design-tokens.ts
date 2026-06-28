/**
 * Bento Glass · Design Tokens（纯数据，无 RN 依赖）
 *
 * 健身饮食动态计划助手 · 统一视觉语言
 * 风格：Liquid Glass —— 参考主流 APP 日间/夜间模式设计规范
 *
 * 日间模式：白底深字，清爽通透
 * 夜间模式：深色护眼，高对比度
 *
 * RN 特定样式（shadowOffset / elevation）请在 mobile 端 tokens.ts 里基于这些纯数据组装。
 */

export const colors = {
  // 背景层：日间 — 浅灰白底，清爽干净
  bg: "#F8F9FA",
  bgGlow: "#FFFFFF",

  // 卡片层：白色卡片 + 轻微阴影 + 微透明边框
  glass: "#FFFFFF",
  glassRaised: "#FFFFFF",
  glassBorder: "rgba(0,0,0,0.06)",
  glassBorderBright: "rgba(0,0,0,0.10)",

  // 文字层：深色文字，高可读性
  ink: "#1A1A1A",
  inkMute: "#666666",
  inkFaint: "#999999",

  // 强调色：日间饱和度适中
  accent: "#2F9DFF", // 蓝 · 数据 / 热量 / 主操作
  accent2: "#7866FF", // 紫蓝 · 训练 / 赤字
  positive: "#22B870", // 薄荷绿 · 动作 / 达标 / 完成
  warn: "#FF5266", // 红 · 超额 / 警告
  amber: "#FF9F0A", // 琥珀 · 接近上限 / 注意

  // 遮罩层：用于 Modal 背景
  scrim: "rgba(0,0,0,0.4)",
} as const;

export const darkColors = {
  // 背景层：夜间 — 深黑底，护眼
  bg: "#121212",
  bgGlow: "#1E1E1E",

  // 卡片层：深灰卡片 + 微透明边框
  glass: "#1E1E1E",
  glassRaised: "#2A2A2A",
  glassBorder: "rgba(255,255,255,0.08)",
  glassBorderBright: "rgba(255,255,255,0.14)",

  // 文字层：浅色文字，确保 WCAG AA 对比度（4.5:1 on #121212）
  // #FFFFFF on #121212 = 17.4:1 ✅
  // #CCCCCC on #121212 = 9.8:1 ✅
  // #888888 on #121212 = 4.6:1 ✅（勉强达标，用于 inkFaint）
  ink: "#FFFFFF",
  inkMute: "#CCCCCC",
  inkFaint: "#888888",

  // 强调色：夜间提高亮度确保对比度
  accent: "#4DB5FF", // 蓝 · 更亮
  accent2: "#9489FF", // 紫蓝 · 更亮
  positive: "#3FE088", // 薄荷绿 · 更亮
  warn: "#FF6B7D", // 红 · 更亮
  amber: "#FFB930", // 琥珀 · 更亮

  // 遮罩层：夜间更深的遮罩
  scrim: "rgba(0,0,0,0.6)",
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
  fontSans: "Barlow",
  fontMono: "Barlow Condensed",
  fontCJK: "Barlow",

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
  pagePadding: 14,
  tileGap: 10,
  tileRadius: 24,
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
