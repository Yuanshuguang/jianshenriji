import { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { type MuscleGroup } from "@fitness-calendar/shared";
import { muscleNameMap } from "../../features/today-plan";
import { GlassTile, Text as BentoText, useBentoTheme } from "../bento";

type TrainingPlanItem = {
  dateLabel: string;
  focus: MuscleGroup;
};

type TrainingPlanOverviewProps = {
  currentFocus: MuscleGroup;
  focusSequence: readonly MuscleGroup[];
};

export function TrainingPlanOverview({ currentFocus, focusSequence }: TrainingPlanOverviewProps) {
  const router = useRouter();
  const c = useBentoTheme().colors;
  const schedule = useMemo(() => buildTrainingSchedule(currentFocus, focusSequence), [currentFocus, focusSequence]);

  return (
    <GlassTile glow="accent2" padding={8} style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <BentoText weight="bold" color={c.ink} style={{ fontSize: 19, lineHeight: 22 }}>
          训练计划
        </BentoText>
        <Pressable
          onPress={() => router.push("/more")}
          style={({ pressed }) => ({
            minHeight: 34,
            paddingHorizontal: 14,
            borderRadius: 999,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: c.glassBorder,
            backgroundColor: c.bg,
            opacity: pressed ? 0.84 : 1,
          })}
        >
          <BentoText weight="semibold" color={c.ink} style={{ fontSize: 13 }}>
            计划设置
          </BentoText>
        </Pressable>
      </View>

      <View
        style={{
          borderRadius: 24,
          paddingHorizontal: 8,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: c.bg,
          borderWidth: 1,
          borderColor: c.glassBorder,
          overflow: "hidden",
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={74}
          snapToAlignment="start"
          contentOffset={{ x: 74 * 3, y: 0 }}
          contentContainerStyle={{ paddingHorizontal: 2 }}
        >
          <View style={{ flexDirection: "row", gap: 4 }}>
            {schedule.map((item) => (
              <TrainingTick key={item.dateLabel} item={item} currentFocus={currentFocus} />
            ))}
          </View>
        </ScrollView>
      </View>
    </GlassTile>
  );
}

function TrainingTick({ item, currentFocus }: { item: TrainingPlanItem; currentFocus: MuscleGroup }) {
  const c = useBentoTheme().colors;
  const active = item.focus === currentFocus;
  const weekday = formatWeekday(item.dateLabel);
  const dateOnly = formatDateOnly(item.dateLabel);

  return (
    <View
      style={{
        width: 70,
        alignItems: "center",
        gap: 8,
      }}
    >
      <BentoText weight={active ? "semibold" : "medium"} color={active ? c.accent : c.inkMute} style={{ fontSize: 12, lineHeight: 14 }}>
        {weekday}
      </BentoText>

      <View style={{ minHeight: 68, alignItems: "center", justifyContent: "center" }}>
        <View style={{ alignItems: "center", gap: 6 }}>
          <View style={{ width: 2, height: 16, borderRadius: 999, backgroundColor: active ? c.accent : c.glassBorder }} />
          <View
            style={{
              minWidth: 58,
              paddingHorizontal: active ? 12 : 8,
              paddingVertical: active ? 7 : 6,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? c.accent : "transparent",
            }}
          >
            <BentoText
              weight="semibold"
              color={active ? "#FFFFFF" : c.ink}
              numberOfLines={1}
              style={{ fontSize: active ? 18 : 16, lineHeight: active ? 22 : 20 }}
            >
              {dateOnly}
            </BentoText>
          </View>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: active ? c.accent : c.glassBorderBright }} />
        </View>
      </View>

      <View style={{ minHeight: 28, alignItems: "center", justifyContent: "flex-start" }}>
        <BentoText
          weight={active ? "bold" : "semibold"}
          color={c.accent2}
          numberOfLines={1}
          style={{ fontSize: active ? 14 : 13, lineHeight: 16, textAlign: "center" }}
        >
          {muscleNameMap[item.focus]}
        </BentoText>
      </View>
    </View>
  );
}

function buildTrainingSchedule(currentFocus: MuscleGroup, focusSequence: readonly MuscleGroup[]): TrainingPlanItem[] {
  const today = new Date();
  return [
    createScheduleItem(today, -3, shiftFocus(currentFocus, focusSequence, -3)),
    createScheduleItem(today, -2, shiftFocus(currentFocus, focusSequence, -2)),
    createScheduleItem(today, -1, shiftFocus(currentFocus, focusSequence, -1)),
    createScheduleItem(today, 0, currentFocus),
    createScheduleItem(today, 1, shiftFocus(currentFocus, focusSequence, 1)),
    createScheduleItem(today, 2, shiftFocus(currentFocus, focusSequence, 2)),
    createScheduleItem(today, 3, shiftFocus(currentFocus, focusSequence, 3)),
  ];
}

function createScheduleItem(baseDate: Date, offsetDays: number, focus: MuscleGroup): TrainingPlanItem {
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() + offsetDays);
  return {
    dateLabel: formatDateLabel(date),
    focus,
  };
}

function shiftFocus(currentFocus: MuscleGroup, focusSequence: readonly MuscleGroup[], offset: number): MuscleGroup {
  if (focusSequence.length === 0) {
    return currentFocus;
  }

  const currentIndex = focusSequence.indexOf(currentFocus);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeIndex + offset) % focusSequence.length;
  return focusSequence[(nextIndex + focusSequence.length) % focusSequence.length];
}

function formatDateLabel(date: Date): string {
  const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
  return `${date.getMonth() + 1}/${date.getDate()} ${weekday}`;
}

function formatWeekday(label: string): string {
  return label.split(" ")[1] ?? "";
}

function formatDateOnly(label: string): string {
  return label.split(" ")[0] ?? label;
}
