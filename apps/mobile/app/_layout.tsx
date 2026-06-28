import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppErrorBoundary } from "../components/AppErrorBoundary";
import { BentoThemeProvider } from "../components/bento";
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

  useEffect(() => {
    return useFitnessStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  if (hydrated && !inOnboarding && !isOnboardingComplete()) {
    return <Redirect href="/onboarding/body" />;
  }

  return (
    <AppErrorBoundary>
      <BentoThemeProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </BentoThemeProvider>
    </AppErrorBoundary>
  );
}
