/**
 * Bento Glass · Design Tokens（纯数据，无 RN 依赖）
 *
 * 健身饮食动态计划助手 · 统一视觉语言
 * 风格：Liquid Glass —— 模块化、磨砂玻璃、日夜外观、柔和彩色底图
 *
 * RN 特定样式（shadowOffset / elevation）请在 mobile 端 tokens.ts 里基于这些纯数据组装。
 */

export const colors = {
  // 背景层：统一为动作库式深蓝运动工具风。
  bg: "#17314B",
  bgGlow: "#244765",

  // 卡片层（rgba，便于叠加）
  glass: "rgba(31,61,91,0.94)",
  glassRaised: "rgba(49,82,113,0.96)",
  glassBorder: "rgba(152,190,224,0.22)",
  glassBorderBright: "rgba(188,222,252,0.34)",

  // 文字层
  ink: "#EFF7FF",
  inkMute: "#9DB8D1",
  inkFaint: "#6E8CA7",

  // 强调色
  accent: "#2F9DFF", // 蓝 · 数据 / 热量 / 主操作
  accent2: "#7866FF", // 紫蓝 · 训练 / 赤字
  positive: "#58D98B", // 薄荷绿 · 动作 / 达标 / 完成
  warn: "#FF6B86", // 红 · 超额 / 警告
  amber: "#FFC55C", // 琥珀 · 接近上限 / 注意
} as const;

export const darkColors = {
  bg: "#102840",
  bgGlow: "#183A58",
  glass: "rgba(30,60,90,0.96)",
  glassRaised: "rgba(48,82,114,0.98)",
  glassBorder: "rgba(154,190,224,0.22)",
  glassBorderBright: "rgba(189,222,252,0.34)",
  ink: "#F2F8FF",
  inkMute: "#A9BED2",
  inkFaint: "#7790A8",
  accent: "#35A8FF",
  accent2: "#8273FF",
  positive: "#5DE394",
  warn: "#FF728C",
  amber: "#FFD06A",
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
