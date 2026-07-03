import type { MuscleGroup, TrainingScheduleEntry } from "@fitness-calendar/shared";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { muscleNameMap } from "../../features/today-plan";
import { GlassTile, Text as BentoText, useBentoTheme } from "../bento";
import { WeekDateRail, type WeekDateRailItem } from "../shared";

type TrainingPlanOverviewProps = {
  schedule: TrainingScheduleEntry[];
};

export function TrainingPlanOverview({ schedule }: TrainingPlanOverviewProps) {
  const router = useRouter();
  const c = useBentoTheme().colors;
  const railItems: WeekDateRailItem[] = schedule.slice(0, 7).map((item) => ({
    key: item.dateKey,
    dateLabel: String(item.date.getDate()),
    weekdayLabel: formatWeekday(item.date),
    title: item.trainingType === "rest" ? "休息" : (muscleNameMap[item.focus as MuscleGroup] ?? "训练"),
    subtitle: item.dietLabel,
    active: item.isToday,
    tone: item.trainingType === "rest" ? "positive" : item.dietLabel.includes("高碳") ? "warn" : "accent",
    onPress: () => router.push("/plan"),
  }));

  return (
    <GlassTile glow="accent" raised padding={12} style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <BentoText weight="bold" color={c.ink} style={{ fontSize: 20, lineHeight: 24 }}>
            训练计划
          </BentoText>
          <BentoText variant="micro" color={c.inkMute}>
            点击日期查看对应日程
          </BentoText>
        </View>
        <Pressable
          onPress={() => router.push("/plan")}
          style={({ pressed }) => ({
            minHeight: 32,
            paddingHorizontal: 12,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${c.accent}18`,
            borderWidth: 1,
            borderColor: c.glassBorderBright,
            opacity: pressed ? 0.82 : 1,
          })}
        >
          <BentoText weight="semibold" color={c.accent} style={{ fontSize: 12 }}>
            查看计划
          </BentoText>
        </Pressable>
      </View>

      <WeekDateRail items={railItems} />
    </GlassTile>
  );
}

function formatWeekday(date: Date): string {
  return ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
}

export default TrainingPlanOverview;
