import { exercises, type MuscleGroup } from "@fitness-calendar/shared";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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

const muscleOptions: Array<[MuscleGroup, string]> = [
  ["chest", "胸部"],
  ["back", "背部"],
  ["legs", "腿部"],
  ["shoulders", "肩部"],
  ["arms", "手臂"],
  ["core", "核心"],
  ["cardio", "有氧"]
];

const equipmentLabels = ["杠铃", "健身房", "徒手", "哑铃", "器械", "跑步机"];

export default function TrainingPreferenceScreen() {
  const router = useRouter();
  const preference = useFitnessStore((state) => state.trainingPreference);
  const setTrainingPreference = useFitnessStore((state) => state.setTrainingPreference);
  const [draft, setDraft] = useState(preference);
  const equipmentOptions = useMemo(() => {
    const values = Array.from(new Set(exercises.flatMap((exercise) => exercise.equipment)));
    return values.map((value, index) => ({
      value,
      label: equipmentLabels[index] ?? `器材 ${index + 1}`
    }));
  }, []);

  return (
    <Screen>
      <ScreenHeader
        kicker="Onboarding · 3 / 3"
        title="训练习惯"
        subtitle="器材、时长、部位偏好会决定训练队列；没练的项目后续顺延"
      />

      {/* 每周天数 + 每次分钟 */}
      <View style={{ flexDirection: "row", gap: bento.tileGap }}>
        <View style={{ flex: 1 }}>
          <LabeledInput
            label="每周天数"
            keyboardType="numeric"
            value={String(draft.daysPerWeek)}
            onChangeText={(text) => setDraft({ ...draft, daysPerWeek: Number(text) || 0 })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <LabeledInput
            label="每次分钟"
            keyboardType="numeric"
            value={String(draft.minutesPerSession)}
            onChangeText={(text) => setDraft({ ...draft, minutesPerSession: Number(text) || 0 })}
          />
        </View>
      </View>

      <LabeledInput
        label="有氧比例 0-1"
        keyboardType="numeric"
        value={String(draft.cardioRatio)}
        onChangeText={(text) => setDraft({ ...draft, cardioRatio: Number(text) || 0 })}
      />

      {/* 可用器材 */}
      <GlassTile glow="accent2" style={{ gap: 10 }}>
        <Label color={colors.inkMute} variant="label">
          EQUIPMENT / 可用器材
        </Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {equipmentOptions.map((item) => (
            <SelectChip
              key={item.value}
              label={item.label}
              active={draft.equipment.includes(item.value)}
              color="accent2"
              onPress={() => setDraft({ ...draft, equipment: toggleValue(draft.equipment, item.value) })}
            />
          ))}
        </View>
      </GlassTile>

      {/* 偏好部位 */}
      <GlassTile glow="accent" style={{ gap: 10 }}>
        <Label color={colors.inkMute} variant="label">
          MUSCLE / 偏好部位
        </Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {muscleOptions.map(([value, title]) => (
            <SelectChip
              key={value}
              label={title}
              active={draft.preferredMuscleGroups.includes(value)}
              color="accent"
              onPress={() => setDraft({ ...draft, preferredMuscleGroups: toggleValue(draft.preferredMuscleGroups, value) })}
            />
          ))}
        </View>
      </GlassTile>

      <Button
        variant="filled"
        color="positive"
        block
        onPress={() => {
          setTrainingPreference(draft);
          router.replace("/");
        }}
      >
        生成今日计划
      </Button>
    </Screen>
  );
}

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
