import { type MealAdjustmentKey } from "@fitness-calendar/shared";
import { View, Switch } from "react-native";
import { Badge, Screen, ScreenHeader, Text as BentoText, useBentoTheme } from "../components/bento";
import { SectionHeader, SettingsGroup, SettingsRow } from "../components/shared";
import { useFitnessStore } from "../store/fitness-store";

const mealPreferenceOptions: Array<{ key: MealAdjustmentKey; label: string }> = [
  { key: "breakfast", label: "早餐" },
  { key: "lunch", label: "午餐" },
  { key: "dinner", label: "晚餐" },
  { key: "snack", label: "加餐" },
];

export default function DietPreferenceScreen() {
  const c = useBentoTheme().colors;
  const dietPreference = useFitnessStore((state) => state.dietPreference);
  const setDietPreference = useFitnessStore((state) => state.setDietPreference);

  const enabledCount = Object.values(dietPreference.enabledMeals).filter(Boolean).length;

  const toggleMeal = (meal: MealAdjustmentKey, value: boolean) => {
    const nextEnabledMeals = {
      ...dietPreference.enabledMeals,
      [meal]: value,
    };
    if (!Object.values(nextEnabledMeals).some(Boolean)) {
      nextEnabledMeals.lunch = true;
    }
    setDietPreference({ enabledMeals: nextEnabledMeals });
  };

  return (
    <Screen>
      <ScreenHeader
        kicker="设置"
        title="饮食偏好"
        subtitle="选择哪些餐次参与今日餐次和储备食物分配。"
        badge={{ text: `${enabledCount}/4`, color: enabledCount === 4 ? "accent" : "warn" }}
      />

      <View style={{ gap: 12 }}>
        <View
          style={{
            borderRadius: 16,
            padding: 12,
            backgroundColor: c.glass,
            borderWidth: 1,
            borderColor: c.glassBorder,
            gap: 4,
          }}
        >
          <BentoText weight="semibold" color={c.ink}>
            当前启用 {enabledCount}/4 餐
          </BentoText>
          <BentoText variant="micro" color={c.inkMute}>
            至少保留一餐开启，避免计划无法分配。
          </BentoText>
        </View>

        <SectionHeader title="餐次开关" />
        <SettingsGroup>
          {mealPreferenceOptions.map((item) => {
            const enabled = dietPreference.enabledMeals[item.key] !== false;
            return (
              <SettingsRow
                key={item.key}
                iconName="food"
                label={item.label}
                subtitle={enabled ? "参与今日餐次分配" : "不参与今日餐次分配"}
                trailing={(
                  <Switch
                    value={enabled}
                    onValueChange={(value) => toggleMeal(item.key, value)}
                    trackColor={{ false: "#2A3140", true: "#4B8BFF" }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel={`${item.label}饮食偏好开关`}
                  />
                )}
                showArrow={false}
              />
            );
          })}
        </SettingsGroup>
      </View>
    </Screen>
  );
}
