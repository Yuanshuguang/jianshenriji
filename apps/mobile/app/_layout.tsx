import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppErrorBoundary } from "../components/AppErrorBoundary";
import { BentoThemeProvider } from "../components/bento";
import { useFitnessStore } from "../store/fitness-store";

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
