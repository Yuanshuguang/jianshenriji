import {
  bodyShapeOptions,
  exercises,
  resolveTrainingSchedule,
  type DietPlanCycleSelection,
  type TrainingScheduleEntry,
} from "@fitness-calendar/shared";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { Badge, Screen, ScreenHeader, AppIcon, type AppIconName, Text as BentoText, useBentoTheme } from "../../components/bento";
import { WeekDateRail, type WeekDateRailItem } from "../../components/shared";
import { getDietPlanById } from "../../features/diet-plans";
import { muscleNameMap } from "../../features/today-plan";
import { useFitnessStore } from "../../store/fitness-store";

const trainingLevelLabels: Record<string, string> = {
  beginner: "新手",
  intermediate: "有基础",
  regular: "规律训练",
};

export default function PlanScreen() {
  const router = useRouter();
  const profile = useFitnessStore((state) => state.profile);
  const goal = useFitnessStore((state) => state.goal);
  const preference = useFitnessStore((state) => state.trainingPreference);
  const todayTrainingPlan = useFitnessStore((state) => state.todayTrainingPlan);
  const selectedDietPlanId = useFitnessStore((state) => state.selectedDietPlanId);
  const selectedDietPlanVariantId = useFitnessStore((state) => state.selectedDietPlanVariantId);
  const selectedDietPlan = getDietPlanById(selectedDietPlanId);

  const dietPlanCycleSelection: DietPlanCycleSelection = selectedDietPlanVariantId
    ? { variantId: selectedDietPlanVariantId }
    : {};
  const trainingSchedule = useMemo(() => resolveTrainingSchedule({
    planId: selectedDietPlanId,
    dietPlanSelection: dietPlanCycleSelection,
    exercises,
    preference,
    anchorDate: new Date(),
    manualTodayFocus: todayTrainingPlan.focus,
    manualTodayMinutes: todayTrainingPlan.minutes,
  }), [selectedDietPlanId, selectedDietPlanVariantId, preference, todayTrainingPlan.focus, todayTrainingPlan.minutes]);
  const selectedDietPlanVariant = selectedDietPlan?.cycleVariants?.find((item) => item.id === selectedDietPlanVariantId)?.name ?? null;
  const goalShape = bodyShapeOptions.find((item) => item.id === goal.targetBodyShapeId)?.label ?? "未设置";
  const weekTrainingDays = trainingSchedule.filter((item) => item.trainingType !== "rest").length;

  return (
    <Screen>
      <ScreenHeader
        kicker="计划"
        title="当前计划总览"
        subtitle="饮食方案、训练频率、目标周期和 7 日安排集中在这里。"
        badge={{ text: selectedDietPlan ? selectedDietPlan.name : "未选饮食方案", color: selectedDietPlan ? "accent" : "warn" }}
      />

      <CurrentPlanCard
        selectedDietPlanName={selectedDietPlan?.name ?? null}
        selectedDietPlanVariant={selectedDietPlanVariant}
        daysPerWeek={preference.daysPerWeek}
        weekTrainingDays={weekTrainingDays}
        targetWeightKg={goal.targetWeightKg}
        targetDays={goal.targetDays}
        goalShape={goalShape}
        schedule={trainingSchedule}
        onPickDietPlan={() => router.push("/diet-plan")}
      />

      <SectionTitle title="基础设置" />
      <View style={{ gap: 10 }}>
        <ModernSettingCard
          iconName="body"
          title="身体数据"
          subtitle={`${profile.weightKg} kg · ${profile.heightCm} cm · ${profile.age} 岁`}
          badge={trainingLevelLabels[profile.trainingLevel] ?? profile.trainingLevel}
          onPress={() => router.push("/onboarding/body")}
        />
        <ModernSettingCard
          iconName="train"
          title="训练计划"
          subtitle={`每周 ${preference.daysPerWeek} 天 · 常练 ${preference.preferredMuscleGroups.map((item) => muscleNameMap[item]).join("、")} · 参考 ${preference.minutesPerSession} 分钟`}
          badge="动态生成"
          onPress={() => router.push("/onboarding/training-preference")}
        />
        <ModernSettingCard
          iconName="food"
          title="饮食方案"
          subtitle={selectedDietPlan ? selectedDietPlan.name : "选择一个适配健身目标的饮食策略"}
          badge={selectedDietPlan ? "已选择" : "待选择"}
          onPress={() => router.push("/diet-plan")}
        />
      </View>

      <View style={{ height: 40 }} />
    </Screen>
  );
}

function CurrentPlanCard({
  selectedDietPlanName,
  selectedDietPlanVariant,
  daysPerWeek,
  weekTrainingDays,
  targetWeightKg,
  targetDays,
  goalShape,
  schedule,
  onPickDietPlan,
}: {
  selectedDietPlanName: string | null;
  selectedDietPlanVariant: string | null;
  daysPerWeek: number;
  weekTrainingDays: number;
  targetWeightKg: number;
  targetDays: number;
  goalShape: string;
  schedule: TrainingScheduleEntry[];
  onPickDietPlan: () => void;
}) {
  const c = useBentoTheme().colors;
  const railItems: WeekDateRailItem[] = schedule.slice(0, 7).map((item) => ({
    key: item.dateKey,
    dateLabel: String(item.date.getDate()),
    weekdayLabel: formatWeekday(item.date),
    title: item.trainingType === "rest" ? "休息" : (muscleNameMap[item.focus ?? "cardio"] ?? "训练"),
    subtitle: item.dietLabel,
    active: item.isToday,
    tone: item.trainingType === "rest" ? "positive" : item.dietDayType === "high-carb" ? "warn" : "accent",
  }));
  return (
    <View style={{ gap: 10, borderRadius: 18, padding: 14, backgroundColor: c.glassRaised, borderWidth: 1, borderColor: selectedDietPlanName ? c.glassBorderBright : c.warn }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <BentoText weight="bold" color={c.ink} style={{ fontSize: 18 }}>
            {selectedDietPlanName ?? "先选择饮食方案"}
          </BentoText>
          <BentoText variant="caption" color={c.inkMute}>
            {selectedDietPlanName
              ? `${selectedDietPlanVariant ?? "默认周期"} · 每周计划训练 ${daysPerWeek} 天，当前 7 日安排 ${weekTrainingDays} 天`
              : "饮食方案会影响热量目标和训练日程联动，建议先完成选择。"}
          </BentoText>
        </View>
        <Pressable
          onPress={onPickDietPlan}
          style={({ pressed }) => ({
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 7,
            backgroundColor: selectedDietPlanName ? c.glass : c.warn,
            opacity: pressed ? 0.76 : 1,
          })}
        >
          <BentoText weight="bold" variant="micro" color={selectedDietPlanName ? c.accent : c.bg}>
            {selectedDietPlanName ? "调整" : "去选择"}
          </BentoText>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <SummaryPill label="目标体重" value={`${targetWeightKg}kg`} />
        <SummaryPill label="周期" value={`${targetDays}天`} />
        <SummaryPill label="体型" value={goalShape} />
      </View>

      <WeekDateRail items={railItems} />
    </View>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ flex: 1, minWidth: 0, borderRadius: 12, padding: 9, backgroundColor: c.glass, borderWidth: 1, borderColor: c.glassBorder }}>
      <BentoText variant="micro" color={c.inkMute}>{label}</BentoText>
      <BentoText weight="bold" variant="caption" color={c.ink} numberOfLines={1}>{value}</BentoText>
    </View>
  );
}

function formatScheduleDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatWeekday(date: Date): string {
  return ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
}

function SectionTitle({ title }: { title: string }) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ paddingTop: 10, paddingHorizontal: 2 }}>
      <BentoText weight="semibold" variant="micro" color={c.inkMute}>{title}</BentoText>
    </View>
  );
}

function ModernSettingCard({
  iconName,
  title,
  subtitle,
  badge,
  onPress,
}: {
  iconName: AppIconName;
  title: string;
  subtitle: string;
  badge: string;
  onPress: () => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.76 : 1,
        borderRadius: 16,
        padding: 12,
        backgroundColor: c.glass,
        borderWidth: 1,
        borderColor: c.glassBorder,
        flexDirection: "row",
        alignItems: "center",
        gap: 12
      })}
    >
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${c.accent}18`, alignItems: "center", justifyContent: "center" }}>
        <AppIcon name={iconName} size={20} color="accent" />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <BentoText weight="semibold" color={c.ink} style={{ fontSize: 15 }}>{title}</BentoText>
        <BentoText variant="micro" color={c.inkMute} numberOfLines={1}>{subtitle}</BentoText>
      </View>
      <Badge color="accent" size="sm">{badge}</Badge>
      <AppIcon name="chevronRight" size={16} color={c.inkFaint} />
    </Pressable>
  );
}
