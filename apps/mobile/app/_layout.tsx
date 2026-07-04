import "react-native-reanimated";
import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppErrorBoundary } from "../components/AppErrorBoundary";
import { BentoThemeProvider } from "../components/bento";
import { useAppFonts } from "../components/bento/font-loader";
import { useFitnessStore } from "../store/fitness-store";

// 拦截 expo-router 内部的 getThemeColors 错误（仅在开发模式）
if (process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    // 过滤掉 expo-router 的 getThemeColors 错误
    if (typeof args[0] === "string" && args[0].includes("[getThemeColors]")) {
      return;
    }
    originalError.apply(console, args);
  };
}

export default function RootLayout() {
  const segments = useSegments();
  const isOnboardingComplete = useFitnessStore((state) => state.isOnboardingComplete);
  const [hydrated, setHydrated] = useState(useFitnessStore.persist.hasHydrated());
  const inOnboarding = segments[0] === "onboarding";

  // 字体加载（字体文件尚未下载时回退系统字体，不影响运行）
  const [fontsLoaded] = useAppFonts();

  useEffect(() => {
    return useFitnessStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  if (!fontsLoaded || !hydrated) {
    // 等待字体加载和 Zustand 水合完成
    return null;
  }

  if (hydrated && !inOnboarding && !isOnboardingComplete()) {
    return <Redirect href="/onboarding/body" />;
  }

  return (
    <AppErrorBoundary>
      <BentoThemeProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 280,
        }} />
      </BentoThemeProvider>
    </AppErrorBoundary>
  );
}
