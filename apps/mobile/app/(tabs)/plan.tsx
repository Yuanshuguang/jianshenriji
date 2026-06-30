import {
  calculateDietPlanMacroTargets,
  exercises,
  resolveDietPlanDay,
  resolveTrainingDietRecommendation,
  type DietPlanCycleSelection,
  type MuscleGroup
} from "@fitness-calendar/shared";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { Badge, Button, GlassTile, Label, MetricBarWithCursor, ProgressBar, Screen, ScreenHeader, Text as BentoText, radius, useBentoTheme } from "../../components/bento";
import { getDietPlanById } from "../../features/diet-plans";
import { exerciseNameMap, muscleNameMap } from "../../features/today-plan";
import { useCurrentEnergyPlan, useFitnessStore } from "../../store/fitness-store";

const trainingLevelLabels: Record<string, string> = {
  beginner: "新手",
  intermediate: "有基础",
  regular: "规律训练",
};

export default function PlanScreen() {
  const router = useRouter();
  const c = useBentoTheme().colors;
  const profile = useFitnessStore((state) => state.profile);
  const preference = useFitnessStore((state) => state.trainingPreference);
  const selectedDietPlanId = useFitnessStore((state) => state.selectedDietPlanId);
  const selectedDietPlanVariantId = useFitnessStore((state) => state.selectedDietPlanVariantId);
  const todayTrainingPlan = useFitnessStore((state) => state.todayTrainingPlan);
  const energyPlan = useCurrentEnergyPlan();
  const selectedDietPlan = getDietPlanById(selectedDietPlanId);

  const dietPlanCycleSelection: DietPlanCycleSelection = selectedDietPlanVariantId
    ? { variantId: selectedDietPlanVariantId }
    : {};
  const resolvedDietDay = resolveDietPlanDay(selectedDietPlanId, new Date(), dietPlanCycleSelection);
  const dietMacros = calculateDietPlanMacroTargets(selectedDietPlanId, energyPlan, {
    date: new Date(),
    dayType: resolvedDietDay.dayType,
    selection: dietPlanCycleSelection,
  });
  const macroTotalCalories = Math.max(1, dietMacros.calories);
  const macroRatio = {
    protein: Math.round((dietMacros.proteinG * 4 / macroTotalCalories) * 100),
    fat: Math.round((dietMacros.fatG * 9 / macroTotalCalories) * 100),
    carbs: Math.round((dietMacros.carbsG * 4 / macroTotalCalories) * 100),
  };

  const recommendedTraining = useMemo(() => {
    const recommendation = resolveTrainingDietRecommendation({
      planId: selectedDietPlanId,
      dayType: resolvedDietDay.dayType,
      exercises,
      preferredMuscleGroups: preference.preferredMuscleGroups,
      baseMinutes: preference.minutesPerSession,
      manualFocus: todayTrainingPlan.focus,
      manualMinutes: todayTrainingPlan.minutes
    });
    return {
      focus: recommendation.focus,
      minutes: recommendation.durationMinutes,
      status: resolvedDietDay.status,
      intensityLabel: recommendation.intensityLabel,
      actions: recommendation.exerciseIds
        .slice(0, 3)
        .map((exerciseId) => exerciseNameMap[exerciseId] ?? exerciseId),
    };
  }, [preference, resolvedDietDay.dayType, resolvedDietDay.status, selectedDietPlanId, todayTrainingPlan.focus, todayTrainingPlan.minutes]);

  return (
    <Screen>
      <ScreenHeader
        kicker="计划"
        title="今日目标与设置"
        subtitle="饮食是主线，训练作为每日参考。"
        badge={{ text: selectedDietPlan ? selectedDietPlan.name : "未选饮食方案", color: selectedDietPlan ? "accent" : "warn" }}
      />

      <View style={{ gap: 12 }}>
        <TodayDietCard
          calories={Math.round(dietMacros.calories)}
          protein={Math.round(dietMacros.proteinG)}
          fat={Math.round(dietMacros.fatG)}
          carbs={Math.round(dietMacros.carbsG)}
          ratio={macroRatio}
          status={resolvedDietDay.status}
          onPress={() => router.push("/")}
        />
        <TodayTrainingCard
          focus={muscleNameMap[recommendedTraining.focus as MuscleGroup]}
          minutes={recommendedTraining.minutes}
          status={recommendedTraining.status}
          intensity={recommendedTraining.intensityLabel}
          actions={recommendedTraining.actions}
          onPress={() => router.push("/train")}
        />
      </View>

      <SectionTitle title="基础设置" />
      <View style={{ gap: 10 }}>
        <ModernSettingCard
          icon="身"
          title="身体数据"
          subtitle={`${profile.weightKg} kg · ${profile.heightCm} cm · ${profile.age} 岁`}
          badge={trainingLevelLabels[profile.trainingLevel] ?? profile.trainingLevel}
          onPress={() => router.push("/onboarding/body")}
        />
        <ModernSettingCard
          icon="训"
          title="训练偏好"
          subtitle={`常练 ${preference.preferredMuscleGroups.map((item) => muscleNameMap[item]).join("、")} · 参考 ${preference.minutesPerSession} 分钟`}
          badge="不固定课表"
          onPress={() => router.push("/onboarding/training-preference")}
        />
        <ModernSettingCard
          icon="食"
          title="饮食方案"
          subtitle={selectedDietPlan ? `${selectedDietPlan.name} · ${resolvedDietDay.status}` : "选择一个适配健身目标的饮食策略"}
          badge={selectedDietPlan ? "已选择" : "待选择"}
          onPress={() => router.push("/diet-plan")}
        />
      </View>

      <View style={{ height: 40 }} />
    </Screen>
  );
}

function TodayDietCard({
  calories,
  protein,
  fat,
  carbs,
  ratio,
  status,
  onPress,
}: {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  ratio: { protein: number; fat: number; carbs: number };
  status: string;
  onPress: () => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <GlassTile glow="accent" padding={14} style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <View style={{ gap: 4, flex: 1 }}>
          <Label color={c.inkMute} variant="label">今日饮食目标</Label>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5 }}>
            <BentoText mono weight="bold" color={c.accent} style={{ fontSize: 32, lineHeight: 34 }}>{calories}</BentoText>
            <BentoText mono color={c.inkMute} style={{ fontSize: 12 }}>kcal</BentoText>
          </View>
        </View>
        <Badge color="accent" size="sm">{status}</Badge>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <MacroBar label="蛋白" value={protein} target={protein} percent={ratio.protein} color="positive" />
        <MacroBar label="脂肪" value={fat} target={fat} percent={ratio.fat} color="warn" />
        <MacroBar label="碳水" value={carbs} target={carbs} percent={ratio.carbs} color="accent2" />
      </View>
      <Button variant="filled" color="accent" size="sm" block onPress={onPress}>去记录饮食</Button>
    </GlassTile>
  );
}

function TodayTrainingCard({
  focus,
  minutes,
  status,
  intensity,
  actions,
  onPress,
}: {
  focus: string;
  minutes: number;
  status: string;
  intensity: string;
  actions: string[];
  onPress: () => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <GlassTile glow="accent2" padding={14} style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ gap: 4 }}>
          <Label color={c.inkMute} variant="label">今日训练建议</Label>
          <BentoText weight="bold" color={c.ink} style={{ fontSize: 22 }}>{focus}</BentoText>
        </View>
        <Badge color="accent2" size="sm">{minutes} 分钟</Badge>
      </View>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Badge color="accent" size="sm">{status}</Badge>
        <Badge color="positive" size="sm">{intensity}</Badge>
      </View>
      <BentoText variant="caption" color={c.inkMute} numberOfLines={2}>
        参考动作：{actions.length > 0 ? actions.join("、") : "打开动作库选择"}
      </BentoText>
      <Button variant="filled" color="accent2" size="sm" block onPress={onPress}>去看训练</Button>
    </GlassTile>
  );
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
  icon,
  title,
  subtitle,
  badge,
  onPress,
}: {
  icon: string;
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
        <BentoText weight="bold" color={c.accent}>{icon}</BentoText>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <BentoText weight="semibold" color={c.ink} style={{ fontSize: 15 }}>{title}</BentoText>
        <BentoText variant="micro" color={c.inkMute} numberOfLines={1}>{subtitle}</BentoText>
      </View>
      <Badge color="accent" size="sm">{badge}</Badge>
      <BentoText color={c.inkFaint} style={{ fontSize: 16 }}>{">"}</BentoText>
    </Pressable>
  );
}

function MacroBar({ label, value, target, percent: _percent, color }: { label: string; value: number; target: number; percent: number; color: "positive" | "warn" | "accent2" }) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ flex: 1, padding: 9, borderRadius: radius.md, backgroundColor: c.glassRaised, borderWidth: 1, borderColor: c.glassBorder }}>
      <MetricBarWithCursor
        label={label}
        actual={value}
        target={target}
        unit="g"
        baseColor={color}
        size="compact"
      />
    </View>
  );
}
