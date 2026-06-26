import { exercises, type MuscleGroup } from "@fitness-calendar/shared";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { dietPlansByCategory, getDietPlanById } from "../../features/diet-plans";
import { estimateTodayWorkoutCalories, muscleNameMap } from "../../features/today-plan";
import { buildTrainingQueue, useCurrentEnergyPlan, useFitnessStore } from "../../store/fitness-store";
import {
  Badge,
  Button,
  colors,
  GlassTile,
  Label,
  Screen,
  ScreenHeader,
  Text as BentoText,
  bento,
  radius,
  type SemanticColor,
} from "../../components/bento";

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
  const selectedDietPlanId = useFitnessStore((state) => state.selectedDietPlanId);
  const setSelectedDietPlan = useFitnessStore((state) => state.setSelectedDietPlan);
  const todayTrainingPlan = useFitnessStore((state) => state.todayTrainingPlan);
  const selectedDietPlan = getDietPlanById(selectedDietPlanId);
  const energyPlan = useCurrentEnergyPlan();
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(selectedDietPlanId);

  const recommendedWorkout = useMemo(() => {
    const queue = buildTrainingQueue(exercises, preference);
    const fallbackFocus = preference.preferredMuscleGroups[0] ?? "chest";
    const focus = todayTrainingPlan.focus ?? queue[0]?.focus ?? fallbackFocus;
    const workout = queue[0];
    return {
      focus,
      minutes: todayTrainingPlan.minutes ?? queue[0]?.estimatedMinutes ?? preference.minutesPerSession,
      calories: estimateTodayWorkoutCalories(workout, profile.weightKg),
    };
  }, [preference, profile.weightKg, todayTrainingPlan.focus, todayTrainingPlan.minutes]);

  const trainingCalories = recommendedWorkout.calories > 0
    ? recommendedWorkout.calories
    : Math.round(estimateTodayWorkoutCalories(undefined, profile.weightKg));

  const weightDelta = goal.targetWeightKg - profile.weightKg;
  const weeklyWeightPace = goal.targetDays > 0 ? (weightDelta / goal.targetDays) * 7 : 0;
  const macroRatio = energyPlan.calories > 0
    ? {
        protein: Math.round((energyPlan.proteinG * 4 / energyPlan.calories) * 100),
        fat: Math.round((energyPlan.fatG * 9 / energyPlan.calories) * 100),
        carbs: Math.round((energyPlan.carbsG * 4 / energyPlan.calories) * 100),
      }
    : { protein: 0, fat: 0, carbs: 0 };

  return (
    <Screen>
      <ScreenHeader
        kicker="计划"
        title=""
        subtitle="长期方向稳定，短期执行可随每天记录动态调整"
        badge={{ text: selectedDietPlan ? selectedDietPlan.name : "未选饮食方案", color: "accent" }}
      />

      <PlanSectionTitle
        label="LONG TERM / 长期计划"
        title="目标、身体数据和长期策略"
        subtitle="这些决定系统每天怎么给你分配热量、训练量和饮食方向。"
      />

      <GlassTile style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <PlanMetric label="当前体重" value={`${profile.weightKg} kg`} color="accent" />
          <PlanMetric label="目标体重" value={`${goal.targetWeightKg} kg`} color="positive" />
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <PlanMetric label="周期" value={`${goal.targetDays} 天`} color="accent2" />
          <PlanMetric label="周变化" value={`${weeklyWeightPace >= 0 ? "+" : ""}${weeklyWeightPace.toFixed(2)} kg`} color={weeklyWeightPace <= 0 ? "positive" : "warn"} />
        </View>
        <BentoText variant="caption" color={colors.inkMute}>
          {profile.age} 岁 · {profile.heightCm} cm · {trainingLevelLabels[profile.trainingLevel] ?? profile.trainingLevel}
        </BentoText>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button variant="glass" color="accent" size="sm" block onPress={() => router.push("/onboarding/body")}>
            修改身体数据
          </Button>
          <Button variant="glass" color="positive" size="sm" block onPress={() => router.push("/onboarding/goal")}>
            修改目标
          </Button>
        </View>
      </GlassTile>

      <GlassTile style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Label color={colors.inkMute} variant="label">
            TRAINING STRATEGY / 长期训练习惯
          </Label>
          <Badge color="accent2" size="sm">
            {preference.daysPerWeek} 天/周
          </Badge>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <PlanMetric label="每次时长" value={`${preference.minutesPerSession} 分钟`} color="accent2" />
          <PlanMetric label="有氧比例" value={`${Math.round(preference.cardioRatio * 100)}%`} color="accent" />
        </View>
        <BentoText variant="caption" color={colors.inkMute} numberOfLines={2}>
          优先部位：{preference.preferredMuscleGroups.map((item) => muscleNameMap[item]).join("、") || "未设置"}
        </BentoText>
        <Button variant="glass" color="accent2" size="sm" block onPress={() => router.push("/onboarding/training-preference")}>
          修改训练习惯
        </Button>
      </GlassTile>

      <GlassTile style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Label color={colors.inkMute} variant="label">
            DIET STRATEGY / 长期饮食方案
          </Label>
          <Badge color={selectedDietPlan ? "accent" : "warn"} size="sm">
            {selectedDietPlan ? "已选用" : "待选择"}
          </Badge>
        </View>
        <BentoText variant="caption" color={colors.inkMute}>
          {selectedDietPlan ? selectedDietPlan.name : "选择一套长期可坚持的饮食方法，作为系统推荐的偏好依据。"}
        </BentoText>

        {dietPlansByCategory.map((group) => (
          <View key={group.category} style={{ gap: 6 }}>
            <Label color={colors.inkFaint} variant="micro" style={{ marginTop: 4 }}>
              {group.label}
            </Label>
            {group.plans.map((plan) => {
              const isSelected = plan.id === selectedDietPlanId;
              const isExpanded = plan.id === expandedPlanId;
              return (
                <View key={plan.id} style={{ gap: 0 }}>
                  <Pressable
                    onPress={() => {
                      setSelectedDietPlan(isSelected ? null : plan.id);
                      setExpandedPlanId(isExpanded ? null : plan.id);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      paddingVertical: 10,
                      paddingHorizontal: 10,
                      borderRadius: bento.tileRadiusSmall,
                      backgroundColor: isSelected ? "rgba(56,189,248,0.10)" : pressed ? "rgba(255,255,255,0.10)" : "transparent",
                      borderWidth: 1,
                      borderColor: isSelected ? colors.accent : colors.glassBorder,
                    })}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: isSelected ? colors.accent : colors.inkFaint,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent }} /> : null}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <BentoText weight="semibold" variant="caption" color={isSelected ? colors.accent : colors.ink}>
                        {plan.name}
                      </BentoText>
                      <BentoText variant="micro" color={colors.inkMute} numberOfLines={isExpanded ? undefined : 1}>
                        {plan.tagline}
                      </BentoText>
                    </View>
                    <BentoText color={colors.inkFaint} style={{ fontSize: 14 }}>
                      {isExpanded ? "收起" : "详情"}
                    </BentoText>
                  </Pressable>

                  {isExpanded ? (
                    <View style={{ paddingVertical: 10, paddingHorizontal: 14, gap: 8 }}>
                      <DetailSection label="核心逻辑" text={plan.logic} color="accent" />
                      <DetailSection label="怎么吃" text={plan.howToEat} color="positive" />
                      <DetailList label="优点" items={plan.pros} color="positive" />
                      <DetailList label="缺点" items={plan.cons} color="warn" />
                      <DetailSection label="适合人群" text={plan.suitableFor} color="accent2" />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </GlassTile>

      <PlanSectionTitle
        label="SHORT TERM / 短期计划"
        title="今天和本周怎么执行"
        subtitle="这里不是重新设目标，而是把长期目标拆成今天能记录、能调整的行动。"
      />

      <GlassTile glow="accent" style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Label color={colors.inkMute} variant="label">
            TODAY DIET / 今日饮食预算
          </Label>
          <BentoText mono weight="bold" color={colors.accent} style={{ fontSize: 18 }}>
            {Math.round(energyPlan.calories)} kcal
          </BentoText>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <PlanMetric label="蛋白质" value={`${Math.round(energyPlan.proteinG)}g`} sub={`${macroRatio.protein}%`} color="positive" />
          <PlanMetric label="脂肪" value={`${Math.round(energyPlan.fatG)}g`} sub={`${macroRatio.fat}%`} color="warn" />
          <PlanMetric label="碳水" value={`${Math.round(energyPlan.carbsG)}g`} sub={`${macroRatio.carbs}%`} color="accent2" />
        </View>
        <Button variant="filled" color="accent" size="sm" block onPress={() => router.push("/")}>
          去记录今日餐次
        </Button>
      </GlassTile>

      <GlassTile glow="accent2" style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Label color={colors.inkMute} variant="label">
            TODAY TRAINING / 今日训练安排
          </Label>
          <Badge color="accent2" size="sm">
            {muscleNameMap[recommendedWorkout.focus as MuscleGroup]}
          </Badge>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <PlanMetric label="建议时长" value={`${recommendedWorkout.minutes} 分钟`} color="accent2" />
          <PlanMetric label="预估消耗" value={`${trainingCalories} kcal`} color="positive" />
        </View>
        <BentoText variant="caption" color={colors.inkMute}>
          本周节奏：{preference.daysPerWeek} 次训练 · 每次约 {preference.minutesPerSession} 分钟。实际完成后会影响后续动态调整。
        </BentoText>
        <Button variant="filled" color="accent2" size="sm" block onPress={() => router.push("/train")}>
          去记录今日训练
        </Button>
      </GlassTile>
    </Screen>
  );
}

function PlanSectionTitle({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <View style={{ gap: 4, paddingTop: 4 }}>
      <Label color={colors.inkMute} variant="label">
        {label}
      </Label>
      <BentoText weight="bold" color={colors.ink} style={{ fontSize: 18 }}>
        {title}
      </BentoText>
      <BentoText variant="caption" color={colors.inkMute}>
        {subtitle}
      </BentoText>
    </View>
  );
}

function PlanMetric({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: SemanticColor;
}) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 68,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glass,
        paddingHorizontal: 10,
        paddingVertical: 10,
        justifyContent: "space-between",
      }}
    >
      <BentoText variant="micro" color={colors.inkMute}>
        {label}
      </BentoText>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
        <BentoText mono weight="bold" color={colors[color]} style={{ fontSize: 16 }} numberOfLines={1}>
          {value}
        </BentoText>
        {sub ? (
          <BentoText variant="micro" color={colors.inkFaint}>
            {sub}
          </BentoText>
        ) : null}
      </View>
    </View>
  );
}

function DetailSection({ label, text, color }: { label: string; text: string; color: "accent" | "positive" | "accent2" }) {
  return (
    <View style={{ gap: 4 }}>
      <Label color={colors[color]} variant="micro">
        {label}
      </Label>
      <BentoText variant="micro" color={colors.inkMute} style={{ lineHeight: 18 }}>
        {text}
      </BentoText>
    </View>
  );
}

function DetailList({ label, items, color }: { label: string; items: string[]; color: "positive" | "warn" }) {
  return (
    <View style={{ gap: 4 }}>
      <Label color={colors[color]} variant="micro">
        {label}
      </Label>
      {items.map((item) => (
        <BentoText key={item} variant="micro" color={colors.inkMute} style={{ lineHeight: 18 }}>
          · {item}
        </BentoText>
      ))}
    </View>
  );
}
