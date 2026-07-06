import {
  exercises,
  resolveTrainingSchedule,
  type DietDayType,
  type DietPlanCycleSelection,
  type MuscleGroup,
} from "@fitness-calendar/shared";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import {
  Button,
  GlassTile,
  Label,
  Screen,
  ScreenHeader,
  SelectChip,
  Text as BentoText,
  bento,
  colors,
} from "../../components/bento";
import { dietDayTypeLabels, getDietPlanById } from "../../features/diet-plans";
import { muscleNameMap } from "../../features/today-plan";
import { useFitnessStore, type TrainingPreferenceDraft } from "../../store/fitness-store";

const muscleOptions: MuscleGroup[] = ["chest", "back", "legs", "shoulders", "arms", "core", "cardio"];
const frequencyOptions = [2, 3, 4, 5, 6];
const durationOptions = [30, 45, 60, 75, 90];

const equipmentLabels: Record<string, string> = {
  徒手: "徒手",
  哑铃: "哑铃",
  杠铃: "杠铃",
  健身房: "健身房",
  健身房器械: "器械",
  跑步机: "跑步机",
  单杠: "单杠",
};

const cardioOptions = [
  { label: "少量有氧", value: 0.1, note: "力量优先，适合增肌或常规塑形。" },
  { label: "力量均衡", value: 0.25, note: "力量为主，保留基础心肺。" },
  { label: "偏有氧", value: 0.4, note: "减脂期更友好，但不牺牲力量训练。" },
];

const dayTypeTone: Record<DietDayType, "accent" | "accent2" | "positive" | "warn" | "amber"> = {
  balanced: "positive",
  "high-carb": "accent",
  "medium-carb": "accent2",
  "low-carb": "amber",
  "very-low-carb": "warn",
  "depletion-carb": "warn",
  "fasting-low-calorie": "warn",
  "normal-eating": "positive",
};

export default function TrainingPreferenceScreen() {
  const router = useRouter();
  const preference = useFitnessStore((state) => state.trainingPreference);
  const selectedDietPlanId = useFitnessStore((state) => state.selectedDietPlanId);
  const selectedDietPlanVariantId = useFitnessStore((state) => state.selectedDietPlanVariantId);
  const setTrainingPreference = useFitnessStore((state) => state.setTrainingPreference);
  const [draft, setDraft] = useState<TrainingPreferenceDraft>(preference);

  const equipmentOptions = useMemo(() => {
    const values = Array.from(new Set(exercises.flatMap((exercise) => exercise.equipment)));
    return values.map((value) => ({
      value,
      label: equipmentLabels[value] ?? value,
    }));
  }, []);

  const selectedPlan = getDietPlanById(selectedDietPlanId);
  const cycleSelection: DietPlanCycleSelection = selectedDietPlanVariantId
    ? { variantId: selectedDietPlanVariantId }
    : {};
  const previewDays = useMemo(
    () => buildDietTrainingPreview(selectedDietPlanId, cycleSelection, draft),
    [selectedDietPlanId, selectedDietPlanVariantId, draft]
  );
  const currentSplit = getSplitLabel(draft.daysPerWeek);
  const selectedCardio = cardioOptions.find((item) => item.value === draft.cardioRatio) ?? cardioOptions[1];

  return (
    <Screen>
      <ScreenHeader
        kicker="ONBOARDING / 2 / 2"
        title="训练偏好"
      />

      <GlassTile glow="accent2" style={{ gap: 12 }}>
        <SectionTitle title="训练部位" />
        <ChipWrap>
          {muscleOptions.map((value) => (
            <SelectChip
              key={value}
              label={muscleNameMap[value]}
              active={draft.preferredMuscleGroups.includes(value)}
              color="accent2"
              onPress={() => setDraft({ ...draft, preferredMuscleGroups: toggleValue(draft.preferredMuscleGroups, value) })}
            />
          ))}
        </ChipWrap>
      </GlassTile>

      <GlassTile glow="accent" style={{ gap: 12 }}>
        <SectionTitle title="可用器材" />
        <ChipWrap>
          {equipmentOptions.map((item) => (
            <SelectChip
              key={item.value}
              label={item.label}
              active={draft.equipment.includes(item.value)}
              color="accent"
              onPress={() => setDraft({ ...draft, equipment: toggleValue(draft.equipment, item.value) })}
            />
          ))}
        </ChipWrap>
      </GlassTile>

      <GlassTile glow="positive" style={{ gap: 12 }}>
        <SectionTitle title="训练频率" />
        <ChipWrap>
          {frequencyOptions.map((value) => (
            <SelectChip
              key={value}
              label={`${value} 天/周`}
              active={draft.daysPerWeek === value}
              color="positive"
              onPress={() => setDraft({ ...draft, daysPerWeek: value })}
            />
          ))}
        </ChipWrap>
        <GlassTile padding={12} style={{ gap: 4, backgroundColor: `${colors.positive}10` }}>
          <BentoText weight="semibold" color={colors.ink}>
            {currentSplit.title}
          </BentoText>
        </GlassTile>
      </GlassTile>

      <View style={{ flexDirection: "row", gap: bento.tileGap }}>
        <GlassTile glow="amber" style={{ flex: 1, gap: 10 }}>
          <Label color={colors.inkMute} variant="label">
            单次时长
          </Label>
          <ChipWrap>
            {durationOptions.map((value) => (
              <SelectChip
                key={value}
                label={`${value}分`}
                active={draft.minutesPerSession === value}
                color="amber"
                size="sm"
                onPress={() => setDraft({ ...draft, minutesPerSession: value })}
              />
            ))}
          </ChipWrap>
        </GlassTile>

        <GlassTile glow="accent2" style={{ flex: 1, gap: 10 }}>
          <Label color={colors.inkMute} variant="label">
            有氧比例
          </Label>
          <ChipWrap>
            {cardioOptions.map((item) => (
              <SelectChip
                key={item.label}
                label={item.label}
                active={draft.cardioRatio === item.value}
                color="accent2"
                size="sm"
                onPress={() => setDraft({ ...draft, cardioRatio: item.value })}
              />
            ))}
          </ChipWrap>
        </GlassTile>
      </View>

      <GlassTile glow="accent" style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <View style={{ flex: 1, gap: 4 }}>
            <BentoText weight="bold" color={colors.ink}>
              饮食计划联动
            </BentoText>
            <BentoText variant="caption" color={colors.inkMute}>
              {selectedPlan ? `${selectedPlan.name}：按当天碳水日型调节训练强度。` : "未选饮食计划时，默认按均衡训练轮换。"}
            </BentoText>
          </View>
          <Label color={colors.inkMute} variant="label">
            预览
          </Label>
        </View>

        <View style={{ gap: 8 }}>
          {previewDays.map((item) => (
            <View
              key={item.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: `${colors[item.tone]}55`,
                backgroundColor: `${colors[item.tone]}12`,
                paddingHorizontal: 12,
                paddingVertical: 9,
              }}
            >
              <View style={{ width: 44 }}>
                <BentoText weight="bold" color={colors.ink}>
                  {item.dateLabel}
                </BentoText>
                <BentoText variant="caption" color={colors.inkMute}>
                  {item.weekLabel}
                </BentoText>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <BentoText weight="semibold" color={colors.ink}>
                  {item.dayLabel}
                </BentoText>
                <BentoText variant="caption" color={colors.inkMute}>
                  {item.rule}
                </BentoText>
              </View>
              <BentoText weight="bold" color={colors[item.tone]}>
                {item.focusLabel}
              </BentoText>
            </View>
          ))}
        </View>
      </GlassTile>

      <GlassTile style={{ gap: 6 }}>
        <BentoText weight="semibold" color={colors.ink}>
          生成规则
        </BentoText>
        <BentoText variant="caption" color={colors.inkMute}>
          2-3 天优先全身训练，4 天倾向上下肢，5-6 天倾向推拉腿或部位拆分；高碳日优先腿、背、胸等大肌群，低碳日安排核心、小肌群、有氧或恢复。
        </BentoText>
      </GlassTile>

      <Button
        variant="filled"
        color="positive"
        block
        onPress={() => {
          setTrainingPreference(normalizePreference(draft));
          router.replace("/plan");
        }}
      >
        保存训练偏好
      </Button>
    </Screen>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={{ gap: 4 }}>
      <BentoText weight="bold" color={colors.ink}>
        {title}
      </BentoText>
    </View>
  );
}

function ChipWrap({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>;
}

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function normalizePreference(draft: TrainingPreferenceDraft): TrainingPreferenceDraft {
  return {
    ...draft,
    daysPerWeek: Math.max(2, Math.min(6, draft.daysPerWeek || 4)),
    minutesPerSession: Math.max(30, Math.min(90, draft.minutesPerSession || 60)),
    cardioRatio: draft.cardioRatio || 0.25,
    preferredMuscleGroups: draft.preferredMuscleGroups.length > 0
      ? draft.preferredMuscleGroups
      : ["chest", "back", "legs", "shoulders"],
  };
}

function getSplitLabel(daysPerWeek: number) {
  if (daysPerWeek <= 2) {
    return {
      title: "全身训练",
      description: "每次覆盖主要肌群，适合新手、忙碌用户或恢复期。",
    };
  }
  if (daysPerWeek === 3) {
    return {
      title: "全身 / 推拉腿轻拆分",
      description: "一周三练，兼顾学习动作、力量进步和恢复。",
    };
  }
  if (daysPerWeek === 4) {
    return {
      title: "上下肢拆分",
      description: "上肢、下肢交替，适合大多数稳定训练用户。",
    };
  }
  return {
    title: "推拉腿 / 部位轮换",
    description: "高频训练需要更细的肌群轮换，并让低碳日承担轻训练。",
  };
}

function buildDietTrainingPreview(
  planId: string | null,
  selection: DietPlanCycleSelection,
  preference: TrainingPreferenceDraft
) {
  return resolveTrainingSchedule({
    planId,
    dietPlanSelection: selection,
    exercises,
    preference,
    pastDays: 0,
    futureDays: 3,
  }).map((entry) => ({
    key: entry.dateKey,
    dateLabel: `${entry.date.getMonth() + 1}/${entry.date.getDate()}`,
    weekLabel: getWeekLabel(entry.date),
    dayLabel: dietDayTypeLabels[entry.dietDayType],
    tone: dayTypeTone[entry.dietDayType],
    focusLabel: entry.focus ? muscleNameMap[entry.focus] : "休息",
    rule: entry.trainingType === "rest" ? entry.intensityLabel : `${entry.intensityLabel} · ${entry.minutes} 分钟`,
  }));
}

function getWeekLabel(date: Date): string {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
}
