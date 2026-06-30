import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { type MuscleGroup } from "@fitness-calendar/shared";
import { muscleNameMap } from "../../features/today-plan";
import { Badge, GlassTile, Label, Text as BentoText, useBentoTheme } from "../bento";

type TrainingPlanItem = {
  label: string;
  dateLabel: string;
  focus: MuscleGroup;
};

type TrainingPlanOverviewProps = {
  currentFocus: MuscleGroup;
  nextFocus: MuscleGroup;
  focusSequence: readonly MuscleGroup[];
  selectedMinutes: number;
  intensityLabel: string;
};

export function TrainingPlanOverview({
  currentFocus,
  nextFocus,
  focusSequence,
  selectedMinutes,
  intensityLabel,
}: TrainingPlanOverviewProps) {
  const c = useBentoTheme().colors;
  const [expanded, setExpanded] = useState(false);

  const schedule = useMemo(() => buildTrainingSchedule(currentFocus, nextFocus, focusSequence), [currentFocus, nextFocus, focusSequence]);

  return (
    <GlassTile glow="accent2" padding={10} style={{ gap: 10 }}>
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => ({
          gap: 8,
          opacity: pressed ? 0.9 : 1
        })}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <Label color={c.inkMute} variant="label">
            训练计划
          </Label>
          <Badge color="accent2" size="sm">
            {expanded ? "收起" : "展开"}
          </Badge>
        </View>
        <BentoText weight="bold" color={c.ink} style={{ fontSize: 22, lineHeight: 26 }}>
          {muscleNameMap[currentFocus]}
        </BentoText>
        <BentoText variant="micro" color={c.inkMute}>
          参考时长 {selectedMinutes} 分钟 · {intensityLabel} · 点击查看前天到未来 7 天
        </BentoText>
      </Pressable>

      {expanded ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <BentoText variant="caption" color={c.inkMute}>
              日程表
            </BentoText>
            <BentoText variant="micro" color={c.inkFaint}>
              仅显示日期和训练部位
            </BentoText>
          </View>

          <View style={{ gap: 8 }}>
            {schedule.slice(0, 4).map((item) => (
              <TrainingPlanRow key={item.label} item={item} />
            ))}
          </View>

          <View style={{ gap: 8 }}>
            <BentoText variant="caption" color={c.inkMute}>
              未来 7 天
            </BentoText>
            {schedule.slice(4).map((item) => (
              <TrainingPlanRow key={item.label} item={item} />
            ))}
          </View>
        </View>
      ) : null}
    </GlassTile>
  );
}

function TrainingPlanRow({ item }: { item: TrainingPlanItem }) {
  const c = useBentoTheme().colors;
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: c.glass,
        borderWidth: 1,
        borderColor: c.glassBorder
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <BentoText weight="semibold" color={c.ink} numberOfLines={1}>
          {item.label}
        </BentoText>
        <BentoText variant="micro" color={c.inkFaint} numberOfLines={1}>
          {item.dateLabel}
        </BentoText>
      </View>
      <BentoText weight="bold" color={c.accent2} numberOfLines={1}>
        {muscleNameMap[item.focus]}
      </BentoText>
    </View>
  );
}

function buildTrainingSchedule(
  currentFocus: MuscleGroup,
  nextFocus: MuscleGroup,
  focusSequence: readonly MuscleGroup[]
): TrainingPlanItem[] {
  const today = new Date();
  return [
    createScheduleItem(today, -2, "前天", shiftFocus(currentFocus, focusSequence, -2)),
    createScheduleItem(today, -1, "昨天", shiftFocus(currentFocus, focusSequence, -1)),
    createScheduleItem(today, 0, "今天", currentFocus),
    createScheduleItem(today, 1, "明天", nextFocus),
    createScheduleItem(today, 2, "后天", shiftFocus(currentFocus, focusSequence, 2)),
    createScheduleItem(today, 3, "3天后", shiftFocus(currentFocus, focusSequence, 3)),
    createScheduleItem(today, 4, "4天后", shiftFocus(currentFocus, focusSequence, 4)),
    createScheduleItem(today, 5, "5天后", shiftFocus(currentFocus, focusSequence, 5)),
    createScheduleItem(today, 6, "6天后", shiftFocus(currentFocus, focusSequence, 6)),
    createScheduleItem(today, 7, "7天后", shiftFocus(currentFocus, focusSequence, 7)),
    createScheduleItem(today, 8, "8天后", shiftFocus(currentFocus, focusSequence, 8)),
  ];
}

function createScheduleItem(baseDate: Date, offsetDays: number, label: string, focus: MuscleGroup): TrainingPlanItem {
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() + offsetDays);
  return {
    label,
    dateLabel: formatDateLabel(date),
    focus
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
