import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { buildCalorieLedgerTimeline, type DailyLogEntry, type NutritionTotals, type MacroLedgerStat } from "@fitness-calendar/shared";
import { Badge, Button, GlassTile, MetricCompareBar, Text as BentoText, useBentoTheme, type SemanticColor } from "./bento";

type LedgerWindowKey = "7" | "14" | "30" | "all";

const windowOptions: Array<{ key: LedgerWindowKey; label: string; limitDays?: number }> = [
  { key: "7", label: "近 7 天", limitDays: 7 },
  { key: "14", label: "近 14 天", limitDays: 14 },
  { key: "30", label: "近 30 天", limitDays: 30 },
  { key: "all", label: "全部" }
];

export function CalorieLedgerPanel({
  historyLogs,
  previewEntry,
  targetNutrition,
}: {
  historyLogs: Record<string, DailyLogEntry>;
  previewEntry?: DailyLogEntry;
  targetNutrition: NutritionTotals;
}) {
  const c = useBentoTheme().colors;
  const [expanded, setExpanded] = useState(false);
  const [windowKey, setWindowKey] = useState<LedgerWindowKey>("7");

  const todayLedger = useMemo(() => {
    if (!previewEntry) return null;
    return buildCalorieLedgerTimeline({ [previewEntry.date]: previewEntry }, { targetNutritionFallback: targetNutrition });
  }, [previewEntry, targetNutrition]);

  const rangeLedger = useMemo(() => {
    const mergedLogs = previewEntry ? { ...historyLogs, [previewEntry.date]: previewEntry } : historyLogs;
    const option = windowOptions.find((item) => item.key === windowKey);
    return buildCalorieLedgerTimeline(mergedLogs, {
      limitDays: option?.limitDays,
      targetNutritionFallback: targetNutrition
    });
  }, [historyLogs, previewEntry, targetNutrition, windowKey]);

  const today = todayLedger?.today ?? null;
  const calorieDelta = today?.calorieDelta ?? 0;
  const hasTodayRecord = Boolean(today);
  const calorieTone: SemanticColor = !hasTodayRecord ? "accent" : calorieDelta > 0 ? "warn" : calorieDelta < 0 ? "accent2" : "positive";
  const calorieStatus = !hasTodayRecord
    ? "今日还没有饮食记录"
    : calorieDelta > 0
    ? `今日多摄入 ${Math.round(calorieDelta)} kcal`
    : calorieDelta < 0
      ? `今日少摄入 ${Math.abs(Math.round(calorieDelta))} kcal`
      : "今日热量贴近计划";

  return (
    <GlassTile glow={calorieTone} style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <BentoText variant="micro" color={c.inkMute}>热量账本</BentoText>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <BentoText weight="semibold" color={c[calorieTone]}>{calorieStatus}</BentoText>
            <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 18 }}>
              热量可以跨天温和平滑；蛋白、脂肪、碳水只看趋势，不做短期硬补。
            </BentoText>
          </View>
          <Badge color={calorieTone} size="sm">
            {hasTodayRecord ? `${calorieDelta > 0 ? "+" : ""}${Math.round(calorieDelta)} kcal` : "待记录"}
          </Badge>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <BentoText variant="caption" color={c.inkMute}>今日摄入</BentoText>
          <BentoText weight="semibold" variant="caption" color={c.ink}>
            {hasTodayRecord ? Math.round(today?.actualCalories ?? 0) : "-"} / {Math.round(targetNutrition.calories)} kcal
          </BentoText>
        </View>
        <MetricCompareBar actual={hasTodayRecord ? today?.actualCalories ?? 0 : 0} target={targetNutrition.calories} color={calorieTone} height={7} />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {(today?.macroStats ?? buildEmptyMacroStats()).map((stat) => (
          <Badge key={stat.key} color={macroToneColor(stat)} size="sm">
            {stat.label} {hasTodayRecord ? `${stat.delta > 0 ? "+" : ""}${Math.round(stat.delta)}g` : "待记录"}
          </Badge>
        ))}
      </View>

      <Button size="sm" color="accent" variant="glass" onPress={() => setExpanded((value) => !value)}>
        {expanded ? "收起" : "查看更多"}
      </Button>

      {expanded ? (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {windowOptions.map((option) => {
              const active = option.key === windowKey;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setWindowKey(option.key)}
                  style={({ pressed }) => ({
                    minHeight: 30,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? c.accent : c.glass,
                    borderWidth: 1,
                    borderColor: active ? c.accent : c.glassBorder,
                    opacity: pressed ? 0.8 : 1
                  })}
                >
                  <BentoText weight="semibold" variant="micro" color={active ? c.bg : c.inkMute}>{option.label}</BentoText>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <Badge color="warn" size="sm">多摄入 {Math.round(rangeLedger.totalOverCalories)} kcal</Badge>
            <Badge color="accent2" size="sm">少摄入 {Math.round(rangeLedger.totalUnderCalories)} kcal</Badge>
            <Badge color={rangeLedger.netCaloriesDelta > 0 ? "warn" : rangeLedger.netCaloriesDelta < 0 ? "accent2" : "positive"} size="sm">
              净差 {rangeLedger.netCaloriesDelta > 0 ? "+" : ""}{Math.round(rangeLedger.netCaloriesDelta)} kcal
            </Badge>
          </View>

          <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 18 }}>
            {rangeLedger.calorieAdvice}
          </BentoText>

          <View style={{ gap: 8 }}>
            <BentoText variant="micro" color={c.inkMute}>宏量营养趋势</BentoText>
            {rangeLedger.macroStats.map((stat) => (
              <MacroTrendRow key={stat.key} stat={stat} />
            ))}
          </View>
        </View>
      ) : null}
    </GlassTile>
  );
}

function MacroTrendRow({ stat }: { stat: MacroLedgerStat }) {
  const c = useBentoTheme().colors;
  const color = macroToneColor(stat);
  return (
    <View style={{ gap: 4, borderWidth: 1, borderColor: c.glassBorder, borderRadius: 10, padding: 10, backgroundColor: c.glass }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <BentoText weight="semibold" variant="caption" color={c.ink}>{stat.label}</BentoText>
        <BentoText weight="semibold" variant="caption" color={c[color]}>
          {stat.delta > 0 ? "+" : ""}{Math.round(stat.delta)}g
        </BentoText>
      </View>
      <BentoText variant="micro" color={c.inkMute}>
        平均每天 {stat.averageDelta > 0 ? "+" : ""}{Math.round(stat.averageDelta)}g
      </BentoText>
      <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 18 }}>
        {stat.advice}
      </BentoText>
    </View>
  );
}

function macroToneColor(stat: MacroLedgerStat): SemanticColor {
  if (stat.tone === "ok") return "positive";
  return stat.tone === "high" ? "warn" : "accent2";
}

function buildEmptyMacroStats(): MacroLedgerStat[] {
  return [
    emptyMacro("proteinG", "蛋白质"),
    emptyMacro("fatG", "脂肪"),
    emptyMacro("carbsG", "碳水")
  ];
}

function emptyMacro(key: MacroLedgerStat["key"], label: string): MacroLedgerStat {
  return {
    key,
    label,
    unit: "g",
    target: 0,
    actual: 0,
    delta: 0,
    averageDelta: 0,
    tone: "ok",
    safeAdjustmentPerDay: 0,
    advice: "接近计划范围，继续按每日目标分配到各餐。"
  };
}
