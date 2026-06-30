import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function GoalScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding/body");
  }, [router]);

  return null;
}