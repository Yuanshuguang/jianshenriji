import { createContext, useContext, useMemo, type ReactNode } from "react";
import { colors as lightColors, darkColors } from "@fitness-calendar/shared";
import { useFitnessStore, type AppearanceMode } from "../../store/fitness-store";
import { colors as mutableColors } from "./tokens";

export type BentoThemeColors = Record<keyof typeof lightColors, string>;

export type BentoTheme = {
  mode: AppearanceMode;
  isDark: boolean;
  colors: BentoThemeColors;
};

const lightToDarkColorMap = new Map<string, string>(
  Object.entries(lightColors).map(([key, value]) => [value, darkColors[key as keyof typeof darkColors]])
);

const BentoThemeContext = createContext<BentoTheme>({
  mode: "light",
  isDark: false,
  colors: lightColors as BentoThemeColors
});

export function BentoThemeProvider({ children }: { children: ReactNode }) {
  const appearanceMode = useFitnessStore((state) => state.appearanceMode);

  const theme = useMemo<BentoTheme>(() => {
    const isDark = appearanceMode === "dark";
    const nextColors = (isDark ? darkColors : lightColors) as BentoThemeColors;
    Object.assign(mutableColors, nextColors);

    return {
      mode: appearanceMode,
      isDark,
      colors: nextColors
    };
  }, [appearanceMode]);

  return <BentoThemeContext.Provider value={theme}>{children}</BentoThemeContext.Provider>;
}

export function useBentoTheme() {
  return useContext(BentoThemeContext);
}

export function useThemeColors() {
  return useBentoTheme().colors;
}

export function resolveThemeColor(color: string | undefined, theme: BentoTheme) {
  if (!color || theme.mode === "light") {
    return color;
  }

  return lightToDarkColorMap.get(color) ?? color;
}
