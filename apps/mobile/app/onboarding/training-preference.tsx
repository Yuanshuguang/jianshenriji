import { exercises, type MuscleGroup } from "@fitness-calendar/shared";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import {
  Button,
  GlassTile,
  Label,
  LabeledInput,
  Screen,
  ScreenHeader,
  SelectChip,
  Text as BentoText,
  bento,
  colors,
} from "../../components/bento";
import { muscleNameMap } from "../../features/today-plan";
import { useFitnessStore } from "../../store/fitness-store";

const muscleOptions: MuscleGroup[] = ["chest", "back", "legs", "shoulders", "arms", "core", "cardio"];

const equipmentFallbackLabels: Record<string, string> = {
  "杠铃": "杠铃",
  "哑铃": "哑铃",
  "徒手": "徒手",
  "健身房器械": "健身房器械",
  "跑步机": "跑步机",
};

export default function TrainingPreferenceScreen() {
  const router = useRouter();
  const preference = useFitnessStore((state) => state.trainingPreference);
  const setTrainingPreference = useFitnessStore((state) => state.setTrainingPreference);
  const [draft, setDraft] = useState(preference);
  const equipmentOptions = useMemo(() => {
    const values = Array.from(new Set(exercises.flatMap((exercise) => exercise.equipment)));
    return values.map((value) => ({
      value,
      label: equipmentFallbackLabels[value] ?? value
    }));
  }, []);

  return (
    <Screen>
      <ScreenHeader
        kicker="Onboarding / 3"
        title="训练偏好"
        subtitle="只记录训练方向，不给每天锁死动作、组数和固定课表；今日训练页会按饮食日和部位给参考建议。"
      />

      <GlassTile glow="accent2" style={{ gap: 10 }}>
        <Label color={colors.inkMute} variant="label">
          FOCUS / 常练部位
        </Label>
        <BentoText variant="caption" color={colors.inkMute}>
          选择你愿意轮换训练的部位，APP 只用它来推荐“今天适合练什么”。
        </BentoText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {muscleOptions.map((value) => (
            <SelectChip
              key={value}
              label={muscleNameMap[value]}
              active={draft.preferredMuscleGroups.includes(value)}
              color="accent2"
              onPress={() => setDraft({ ...draft, preferredMuscleGroups: toggleValue(draft.preferredMuscleGroups, value) })}
            />
          ))}
        </View>
      </GlassTile>

      <GlassTile glow="accent" style={{ gap: 10 }}>
        <Label color={colors.inkMute} variant="label">
          EQUIPMENT / 可用器材
        </Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {equipmentOptions.map((item) => (
            <SelectChip
              key={item.value}
              label={item.label}
              active={draft.equipment.includes(item.value)}
              color="accent"
              onPress={() => setDraft({ ...draft, equipment: toggleValue(draft.equipment, item.value) })}
            />
          ))}
        </View>
      </GlassTile>

      <View style={{ flexDirection: "row", gap: bento.tileGap }}>
        <View style={{ flex: 1 }}>
          <LabeledInput
            label="参考时长"
            keyboardType="numeric"
            value={String(draft.minutesPerSession)}
            onChangeText={(text) => setDraft({ ...draft, minutesPerSession: clampNumber(text, 15, 120) })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <LabeledInput
            label="有氧占比 0-1"
            keyboardType="numeric"
            value={String(draft.cardioRatio)}
            onChangeText={(text) => setDraft({ ...draft, cardioRatio: clampDecimal(text, 0, 1) })}
          />
        </View>
      </View>

      <GlassTile style={{ gap: 6 }}>
        <BentoText weight="semibold" color={colors.ink}>
          训练记录原则
        </BentoText>
        <BentoText variant="caption" color={colors.inkMute}>
          不记录固定课表、不要求组数。训练日只关心：今天建议练哪个部位、参考哪些动作、实际练了什么、练了多久。
        </BentoText>
      </GlassTile>

      <Button
        variant="filled"
        color="positive"
        block
        onPress={() => {
          setTrainingPreference({
            ...draft,
            daysPerWeek: Math.max(1, draft.daysPerWeek || 4),
            preferredMuscleGroups: draft.preferredMuscleGroups.length > 0 ? draft.preferredMuscleGroups : ["chest", "back", "legs"],
          });
          router.replace("/");
        }}
      >
        保存训练偏好
      </Button>
    </Screen>
  );
}

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function clampNumber(value: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function clampDecimal(value: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
}
