import { createContext, useContext, useMemo, type ReactNode } from "react";
import { colors as lightColors, darkColors } from "@fitness-calendar/shared";
import { useFitnessStore, type AppearanceMode, type FontScaleLevel, fontScaleValues } from "../../store/fitness-store";
import { colors as mutableColors } from "./tokens";

export type BentoThemeColors = Record<keyof typeof lightColors, string>;

export type BentoTheme = {
  mode: AppearanceMode;
  isDark: boolean;
  colors: BentoThemeColors;
  /** 字体缩放数值（1.0 = 标准） */
  fontScale: number;
  /** 字体缩放档位 */
  fontScaleLevel: FontScaleLevel;
};

const lightToDarkColorMap = new Map<string, string>(
  Object.entries(lightColors).map(([key, value]) => [value, darkColors[key as keyof typeof darkColors]])
);

const BentoThemeContext = createContext<BentoTheme>({
  mode: "light",
  isDark: false,
  colors: lightColors as BentoThemeColors,
  fontScale: 1.0,
  fontScaleLevel: "normal"
});

export function BentoThemeProvider({ children }: { children: ReactNode }) {
  const appearanceMode = useFitnessStore((state) => state.appearanceMode);
  const fontScaleLevel = useFitnessStore((state) => state.fontScale);

  const theme = useMemo<BentoTheme>(() => {
    const isDark = appearanceMode === "dark";
    const nextColors = (isDark ? darkColors : lightColors) as BentoThemeColors;
    Object.assign(mutableColors, nextColors);

    return {
      mode: appearanceMode,
      isDark,
      colors: nextColors,
      fontScale: fontScaleValues[fontScaleLevel],
      fontScaleLevel
    };
  }, [appearanceMode, fontScaleLevel]);

  return <BentoThemeContext.Provider value={theme}>{children}</BentoThemeContext.Provider>;
}

export function useBentoTheme() {
  return useContext(BentoThemeContext);
}

export function useThemeColors() {
  return useBentoTheme().colors;
}

/** 获取当前字体缩放数值 */
export function useFontScale() {
  return useBentoTheme().fontScale;
}

export function resolveThemeColor(color: string | undefined, theme: BentoTheme) {
  if (!color || theme.mode === "light") {
    return color;
  }

  return lightToDarkColorMap.get(color) ?? color;
}
