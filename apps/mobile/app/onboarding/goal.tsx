import { bodyShapeOptions } from "@fitness-calendar/shared";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import {
  Button,
  colors,
  GlassTile,
  Label,
  LabeledInput,
  Screen,
  ScreenHeader,
  SelectChip,
  bento
} from "../../components/bento";
import { useFitnessStore } from "../../store/fitness-store";

const bodyShapeLabels: Record<string, string> = {
  "flat-belly": "腹部变平",
  "slight-line": "马甲线隐约可见",
  "clear-line": "马甲线比较明显",
  "very-clear-line": "马甲线非常明显"
};

export default function GoalScreen() {
  const router = useRouter();
  const goal = useFitnessStore((state) => state.goal);
  const setGoal = useFitnessStore((state) => state.setGoal);
  const [draft, setDraft] = useState(goal);

  return (
    <Screen>
      <ScreenHeader
        kicker="Onboarding · 2 / 3"
        title="目标"
        subtitle="如果减重速度过快，本地公式会自动压到安全范围内，不做极端计划"
      />

      {/* 目标体重 + 周期 */}
      <View style={{ flexDirection: "row", gap: bento.tileGap }}>
        <View style={{ flex: 1 }}>
          <LabeledInput
            label="目标体重 kg"
            keyboardType="numeric"
            value={String(draft.targetWeightKg)}
            onChangeText={(text) => setDraft({ ...draft, targetWeightKg: Number(text) || 0 })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <LabeledInput
            label="周期 天"
            keyboardType="numeric"
            value={String(draft.targetDays)}
            onChangeText={(text) => setDraft({ ...draft, targetDays: Number(text) || 0 })}
          />
        </View>
      </View>

      {/* 目标体型 */}
      <GlassTile glow="positive" style={{ gap: 10 }}>
        <Label color={colors.inkMute} variant="label">
          BODY SHAPE / 目标体型
        </Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {bodyShapeOptions.map((option) => (
            <SelectChip
              key={option.id}
              label={bodyShapeLabels[option.id] ?? option.id}
              active={draft.targetBodyShapeId === option.id}
              color="positive"
              onPress={() => setDraft({ ...draft, targetBodyShapeId: option.id })}
            />
          ))}
        </View>
      </GlassTile>

      <Button
        variant="filled"
        color="positive"
        block
        onPress={() => {
          setGoal(draft);
          router.push("/onboarding/training-preference");
        }}
      >
        保存并继续
      </Button>
    </Screen>
  );
}
