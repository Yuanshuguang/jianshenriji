import { Stack } from "expo-router";
import { BentoThemeProvider } from "../components/bento";

export default function RootLayout() {
  return (
    <BentoThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </BentoThemeProvider>
  );
}
