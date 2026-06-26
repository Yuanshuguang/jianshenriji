import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { colors, GlassTile, Text as BentoText, type SemanticColor } from "./bento";
import type { DailyLogEntry } from "@fitness-calendar/shared";

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

export function CalendarGrid({
  year, month, logs, onSelectDate, selectedDate, todayStr
}: {
  year: number; month: number;
  logs: Record<string, DailyLogEntry>;
  onSelectDate: (ds: string) => void;
  selectedDate: string | null;
  todayStr: string;
}) {
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const firstDayOfWeek = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month]);
  const weeks = useMemo(() => {
    const result: Array<Array<{day: number; dateStr: string; isToday: boolean}>> = [];
    let week: Array<{day: number; dateStr: string; isToday: boolean}> = [];
    for (let i = 0; i < firstDayOfWeek; i++) week.push({ day: 0, dateStr: "", isToday: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = formatDateStr(new Date(year, month - 1, d));
      week.push({ day: d, dateStr: ds, isToday: ds === todayStr });
      if (week.length === 7) { result.push(week); week = []; }
    }
    if (week.length > 0) result.push(week);
    return result;
  }, [daysInMonth, firstDayOfWeek, year, month, todayStr]);

  const weekHeaders = ["日", "一", "二", "三", "四", "五", "六"];
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row" }}>
        {weekHeaders.map((weekDay, index) => (
          <View key={`${weekDay}-${index}`} style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}>
            <BentoText variant="micro" color={colors.inkMute} style={{ fontSize: 11 }}>{weekDay}</BentoText>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: "row" }}>
          {week.map((cell, ci) => {
            if (cell.day === 0) return <View key={"e"+ci} style={{flex:1}} />;
            const hl = logs[cell.dateStr] && logs[cell.dateStr].isComplete;
            const hp = logs[cell.dateStr] && !logs[cell.dateStr].isComplete;
            const sel = cell.dateStr === selectedDate;
            return (
              <Pressable key={cell.dateStr} onPress={() => onSelectDate(cell.dateStr)}
                style={{flex:1,alignItems:"center",paddingVertical:6,borderRadius:8,backgroundColor:sel?colors.accent+"22":"transparent"}}>
                <BentoText weight={cell.isToday?"bold":"regular"} color={sel?colors.accent:cell.isToday?colors.positive:colors.ink} style={{fontSize:14,lineHeight:18}}>{cell.day}</BentoText>
                {hl || hp ? <View style={{width:5,height:5,borderRadius:3,backgroundColor:hl?colors.positive:colors.accent2,marginTop:2}} /> : <View style={{width:5,height:5,marginTop:2}} />}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function DaySummaryCard({ dateStr, entry, energyPlan, onEditDiet, onEditTraining }: {
  dateStr: string;
  entry: DailyLogEntry | undefined;
  energyPlan: { calories: number };
  onEditDiet: () => void;
  onEditTraining: () => void;
}) {
  const dateLabel = useMemo(() => {
    const d = new Date(dateStr + "T00:00:00");
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    return (d.getMonth() + 1) + "月" + d.getDate() + "日 周" + weekDays[d.getDay()];
  }, [dateStr]);
  if (!entry) return (
    <GlassTile style={{gap:10}}>
      <BentoText weight="bold" color={colors.ink}>{dateLabel}</BentoText>
      <BentoText variant="caption" color={colors.inkFaint}>该日暂无记录</BentoText>
    </GlassTile>
  );
  const ac = entry.actualIntake.calories;
  const tc = entry.targetCalories || energyPlan.calories;
  const diff = ac - tc;
  const cc: SemanticColor = Math.abs(diff) < 100 ? "positive" : diff > 0 ? "warn" : "accent";
  return (
    <GlassTile style={{gap:10}}>
      <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
        <BentoText weight="bold" color={colors.ink}>{dateLabel}</BentoText>
        {entry.isComplete ? <BentoText variant="micro" color={colors.positive}>已确认</BentoText> : <BentoText variant="micro" color={colors.accent2}>待补充</BentoText>}
      </View>
      <View style={{flexDirection:"row",gap:12}}>
        <View style={{flex:1}}><BentoText variant="micro" color={colors.inkMute}>目标</BentoText><BentoText mono weight="bold" color={colors.positive}>{Math.round(tc)} kcal</BentoText></View>
        <View style={{flex:1}}><BentoText variant="micro" color={colors.inkMute}>实际</BentoText><BentoText mono weight="bold" color={colors[cc]}>{Math.round(ac)} kcal</BentoText></View>
        <View style={{flex:1}}><BentoText variant="micro" color={colors.inkMute}>差值</BentoText><BentoText mono weight="bold" color={colors[cc]}>{(diff>0?"+":"")+Math.round(diff)}</BentoText></View>
      </View>
      {entry.actualFoodText ? <View><BentoText variant="micro" color={colors.inkMute}>饮食记录</BentoText><BentoText variant="caption" color={colors.ink} numberOfLines={2}>{entry.actualFoodText}</BentoText></View> : null}
      {entry.training.status !== "pending" ? <View style={{flexDirection:"row",gap:8}}><BentoText variant="caption" color={colors.inkMute}>训练: {entry.training.minutes}分 / {Math.round(entry.training.calories)} kcal</BentoText></View> : null}
      <View style={{flexDirection:"row",gap:8}}>
        <Pressable onPress={onEditDiet} style={{paddingVertical:6,paddingHorizontal:14,borderRadius:20,backgroundColor:colors.glass,borderWidth:1,borderColor:colors.glassBorder}}><BentoText variant="caption" weight="semibold" color={colors.accent}>补充饮食</BentoText></Pressable>
        <Pressable onPress={onEditTraining} style={{paddingVertical:6,paddingHorizontal:14,borderRadius:20,backgroundColor:colors.glass,borderWidth:1,borderColor:colors.glassBorder}}><BentoText variant="caption" weight="semibold" color={colors.accent2}>补充训练</BentoText></Pressable>
      </View>
    </GlassTile>
  );
}

export function MonthNavigator({ year, month, onPrev, onNext }: {
  year: number; month: number; onPrev: () => void; onNext: () => void;
}) {
  const label = year + "年" + month + "月";
  return (
    <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
      <Pressable onPress={onPrev} style={{paddingHorizontal:12,paddingVertical:6}}><BentoText color={colors.accent} weight="bold" style={{fontSize:16}}>{String.fromCharCode(8249)}</BentoText></Pressable>
      <BentoText weight="bold" color={colors.ink} style={{fontSize:16}}>{label}</BentoText>
      <Pressable onPress={onNext} style={{paddingHorizontal:12,paddingVertical:6}}><BentoText color={colors.accent} weight="bold" style={{fontSize:16}}>{String.fromCharCode(8250)}</BentoText></Pressable>
    </View>
  );
}
