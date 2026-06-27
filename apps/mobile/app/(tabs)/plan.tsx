import { exercises, type MuscleGroup } from "@fitness-calendar/shared";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { getDietPlanById } from "../../features/diet-plans";
import { estimateTodayWorkoutCalories, muscleNameMap } from "../../features/today-plan";
import { buildTrainingQueue, useCurrentEnergyPlan, useFitnessStore } from "../../store/fitness-store";
import {
  Badge,
  Button,
  Screen,
  ScreenHeader,
  Text as BentoText,
  bento,
  radius,
  useBentoTheme,
} from "../../components/bento";

const trainingLevelLabels: Record<string, string> = {
  beginner: "新手",
  intermediate: "有基础",
  regular: "规律训练",
};

/* ── 微信风格行组件 ─────────────────────────────────────────────── */

function SettingsRow({
  icon,
  label,
  subtitle,
  trailing,
  onPress,
  showArrow = true,
  dangerous = false,
}: {
  icon?: string;
  label: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showArrow?: boolean;
  dangerous?: boolean;
}) {
  const theme = useBentoTheme();
  const c = theme.colors;
  const isPressable = !!onPress;

  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        paddingHorizontal: 16,
        gap: 12,
        minHeight: 52,
      }}
    >
      {icon ? <BentoText style={{ fontSize: 22, width: 28, textAlign: "center" }}>{icon}</BentoText> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <BentoText weight="medium" variant="body" color={dangerous ? "warn" : undefined} style={{ fontSize: 15 }}>
          {label}
        </BentoText>
        {subtitle ? (
          <BentoText variant="micro" color={dangerous ? "warn" : "inkMute"} numberOfLines={1}>
            {subtitle}
          </BentoText>
        ) : null}
      </View>
      {trailing}
      {showArrow && onPress ? (
        <BentoText style={{ fontSize: 16, color: c.inkFaint, width: 16, textAlign: "center" }}>
          {">"}
        </BentoText>
      ) : null}
    </View>
  );

  if (!isPressable) return <View style={{ backgroundColor: c.glass, borderBottomWidth: 1, borderBottomColor: c.glassBorder }}>{content}</View>;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1, backgroundColor: c.glass })}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: c.glassBorder }}>{content}</View>
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  const theme = useBentoTheme();
  const c = theme.colors;
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 6 }}>
      <BentoText weight="semibold" variant="micro" color="inkMute" style={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
        {title}
      </BentoText>
    </View>
  );
}

/* ── 主页面 ─────────────────────────────────────────────────────── */

export default function PlanScreen() {
  const theme = useBentoTheme();
  const c = theme.colors;
  const router = useRouter();
  const profile = useFitnessStore((state) => state.profile);
  const goal = useFitnessStore((state) => state.goal);
  const preference = useFitnessStore((state) => state.trainingPreference);
  const selectedDietPlanId = useFitnessStore((state) => state.selectedDietPlanId);
  const selectedDietPlan = getDietPlanById(selectedDietPlanId);
  const setSelectedDietPlan = useFitnessStore((state) => state.setSelectedDietPlan);
  const todayTrainingPlan = useFitnessStore((state) => state.todayTrainingPlan);
  const energyPlan = useCurrentEnergyPlan();

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

  /* 今日饮食预算摘要 */
  const macroRatio = energyPlan.calories > 0
    ? {
        protein: Math.round((energyPlan.proteinG * 4 / energyPlan.calories) * 100),
        fat: Math.round((energyPlan.fatG * 9 / energyPlan.calories) * 100),
        carbs: Math.round((energyPlan.carbsG * 4 / energyPlan.calories) * 100),
      }
    : { protein: 0, fat: 0, carbs: 0 };

  /* ── 渲染 ─────────────────────────────────────────────────────── */
  return (
    <Screen>
      <ScreenHeader
        kicker="计划"
        title=""
        subtitle="长期方向稳定，短期执行可随每天记录动态调整"
        badge={{ text: selectedDietPlan ? selectedDietPlan.name : "未选饮食方案", color: "accent" }}
      />

      {/* ── 长期计划分组 ──────────────────────────────────────── */}
      <SectionHeader title="LONG TERM / 长期计划" />

      <View style={{ borderRadius: bento.tileRadius, overflow: "hidden", marginHorizontal: 0 }}>
        <SettingsRow
          icon="⚖️"
          label="身体数据"
          subtitle={`${profile.weightKg} kg · ${profile.heightCm} cm · ${profile.age} 岁`}
          trailing={<Badge color="accent" size="sm">{trainingLevelLabels[profile.trainingLevel] ?? profile.trainingLevel}</Badge>}
          onPress={() => router.push("/onboarding/body")}
        />
        <SettingsRow
          icon="🎯"
          label="减重目标"
          subtitle={`目标 ${goal.targetWeightKg} kg · ${goal.targetDays} 天 · 周变化 ${weeklyWeightPace >= 0 ? "+" : ""}${weeklyWeightPace.toFixed(2)} kg`}
          trailing={<BentoText mono weight="semibold" color="accent" style={{ fontSize: 14 }}>{Math.round(energyPlan.calories)} kcal</BentoText>}
          onPress={() => router.push("/onboarding/goal")}
        />
        <SettingsRow
          icon="🏋️"
          label="训练习惯"
          subtitle={`${preference.daysPerWeek} 天/周 · 每次 ${preference.minutesPerSession} 分钟 · 有氧 ${Math.round(preference.cardioRatio * 100)}%`}
          trailing={<Badge color="accent2" size="sm">{preference.preferredMuscleGroups.map((m) => muscleNameMap[m]).join(" ")}</Badge>}
          onPress={() => router.push("/onboarding/training-preference")}
        />
      </View>

      {/* ── 饮食方案分组 ──────────────────────────────────────── */}
      <SectionHeader title="DIET STRATEGY / 饮食方案" />

      <View style={{ borderRadius: bento.tileRadius, overflow: "hidden", marginHorizontal: 0 }}>
        <SettingsRow
          icon="🥗"
          label="饮食方案"
          subtitle={selectedDietPlan ? selectedDietPlan.name : "选择一个饮食策略"}
          trailing={
            <Badge color={selectedDietPlan ? "accent" : "warn"} size="sm">
              {selectedDietPlan ? "已选用" : "待选择"}
            </Badge>
          }
          onPress={() => router.push("/diet-plan")}
        />
      </View>

      {/* ── 短期计划分组 ──────────────────────────────────────── */}
      <SectionHeader title="SHORT TERM / 短期计划" />

      <View style={{ borderRadius: bento.tileRadius, overflow: "hidden", marginHorizontal: 0 }}>
        {/* 今日饮食预算 */}
        <View style={{ backgroundColor: c.glass, borderBottomWidth: 1, borderBottomColor: c.glassBorder, padding: 14, gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <BentoText weight="semibold" variant="body" style={{ fontSize: 15 }}>今日饮食预算</BentoText>
            <BentoText mono weight="bold" color="accent" style={{ fontSize: 18 }}>
              {Math.round(energyPlan.calories)} kcal
            </BentoText>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <MacroPill label="蛋白质" value={Math.round(energyPlan.proteinG)} unit="g" sub={`${macroRatio.protein}%`} color="positive" />
            <MacroPill label="脂肪" value={Math.round(energyPlan.fatG)} unit="g" sub={`${macroRatio.fat}%`} color="warn" />
            <MacroPill label="碳水" value={Math.round(energyPlan.carbsG)} unit="g" sub={`${macroRatio.carbs}%`} color="accent2" />
          </View>
          <Button variant="filled" color="accent" size="sm" block onPress={() => router.push("/")}>
            去记录今日餐次
          </Button>
        </View>

        {/* 今日训练安排 */}
        <View style={{ backgroundColor: c.glass, padding: 14, gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <BentoText weight="semibold" variant="body" style={{ fontSize: 15 }}>今日训练安排</BentoText>
            <Badge color="accent2" size="sm">{muscleNameMap[recommendedWorkout.focus as MuscleGroup]}</Badge>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <MiniStat label="建议时长" value={`${recommendedWorkout.minutes} 分钟`} />
            <MiniStat label="预估消耗" value={`${trainingCalories} kcal`} />
          </View>
          <BentoText variant="micro" color="inkMute" numberOfLines={2}>
            本周节奏：{preference.daysPerWeek} 次训练 · 每次约 {preference.minutesPerSession} 分钟
          </BentoText>
          <Button variant="filled" color="accent2" size="sm" block onPress={() => router.push("/train")}>
            去记录今日训练
          </Button>
        </View>
      </View>

      {/* 底部留白 */}
      <View style={{ height: 40 }} />
    </Screen>
  );
}

/* ── 辅助小组件 ────────────────────────────────────────────────── */

function MacroPill({ label, value, unit, sub, color }: { label: string; value: number; unit: string; sub: string; color: string }) {
  const theme = useBentoTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        flex: 1,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: c.glassBorder,
        backgroundColor: theme.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        padding: 8,
        gap: 2,
      }}
    >
      <BentoText variant="micro" color="inkMute">{label}</BentoText>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
        <BentoText mono weight="bold" color={color} style={{ fontSize: 16 }}>
          {value}
        </BentoText>
        <BentoText variant="micro" color="inkFaint">{unit}</BentoText>
      </View>
      <BentoText variant="micro" color="inkFaint">{sub}</BentoText>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <BentoText variant="micro" color="inkFaint">{label}</BentoText>
      <BentoText weight="semibold" variant="body" style={{ fontSize: 15 }}>{value}</BentoText>
    </View>
  );
}

