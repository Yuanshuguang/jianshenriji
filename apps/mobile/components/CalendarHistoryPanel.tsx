import { useCallback, useState } from "react";
import { TextInput, View } from "react-native";
import type { DailyLogEntry } from "@fitness-calendar/shared";
import {
  Button,
  colors,
  GlassTile,
  Label,
  useBentoTheme,
} from "./bento";
import { CalendarGrid, DaySummaryCard, MonthNavigator } from "./Calendar";
import { buildActualFoodPortionsFromText } from "../features/today-plan";
import { useCurrentEnergyPlan, useFitnessStore } from "../store/fitness-store";

type BackfillMode = "diet" | "training" | null;

function todayStr(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function CalendarHistoryPanel() {
  const { fontScale } = useBentoTheme();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr());
  const [backfillDietText, setBackfillDietText] = useState("");
  const [backfillTrainingText, setBackfillTrainingText] = useState("");
  const [backfillMode, setBackfillMode] = useState<BackfillMode>(null);

  const historyLogs = useFitnessStore((s) => s.historyLogs);
  const saveDailyLog = useFitnessStore((s) => s.saveDailyLog);
  const customFoods = useFitnessStore((s) => s.customFoods);
  const profile = useFitnessStore((s) => s.profile);
  const energyPlan = useCurrentEnergyPlan();

  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 1) {
      setViewYear((year) => year - 1);
      setViewMonth(12);
      return;
    }
    setViewMonth((month) => month - 1);
  }, [viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 12) {
      setViewYear((year) => year + 1);
      setViewMonth(1);
      return;
    }
    setViewMonth((month) => month + 1);
  }, [viewMonth]);

  const selectedEntry = selectedDate ? historyLogs[selectedDate] : undefined;

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setBackfillMode(null);
    setBackfillDietText("");
    setBackfillTrainingText("");
  }, []);

  const handleSaveDiet = useCallback(() => {
    if (!selectedDate || !backfillDietText.trim()) return;
    const existing = historyLogs[selectedDate];
    const parsed = buildActualFoodPortionsFromText(backfillDietText, customFoods);
    const sum = (key: "calories" | "proteinG" | "fatG" | "carbsG") =>
      parsed.portions.reduce((total, portion) => total + portion.totals[key], 0);
    const entry: DailyLogEntry = {
      date: selectedDate,
      targetCalories: energyPlan.calories,
      actualIntake: {
        calories: sum("calories"),
        proteinG: sum("proteinG"),
        fatG: sum("fatG"),
        carbsG: sum("carbsG"),
      },
      actualFoodText: backfillDietText,
      actualMealTexts: existing?.actualMealTexts ?? { breakfast: "", lunch: "", dinner: "", snack: "" },
      training: existing?.training ?? { status: "pending", text: "", minutes: 0, calories: 0, fatigue: 3 },
      isComplete: existing?.training.status !== "pending",
    };
    saveDailyLog(selectedDate, entry);
    setBackfillDietText("");
    setBackfillMode(null);
  }, [selectedDate, backfillDietText, historyLogs, customFoods, energyPlan.calories, saveDailyLog]);

  const handleSaveTraining = useCallback(() => {
    if (!selectedDate || !backfillTrainingText.trim()) return;
    const existing = historyLogs[selectedDate];
    const minutesMatch = backfillTrainingText.match(/(\d+)\s*(分钟|分|min)/i);
    const minutes = minutesMatch ? Number(minutesMatch[1]) : 30;
    const calories = Math.round(0.086 * profile.weightKg * minutes);
    const entry: DailyLogEntry = {
      date: selectedDate,
      targetCalories: energyPlan.calories,
      actualIntake: existing?.actualIntake ?? { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 },
      actualFoodText: existing?.actualFoodText ?? "",
      actualMealTexts: existing?.actualMealTexts ?? { breakfast: "", lunch: "", dinner: "", snack: "" },
      training: { status: "done", text: backfillTrainingText, minutes, calories, fatigue: 3 },
      isComplete: Boolean(existing?.actualFoodText),
    };
    saveDailyLog(selectedDate, entry);
    setBackfillTrainingText("");
    setBackfillMode(null);
  }, [selectedDate, backfillTrainingText, historyLogs, profile.weightKg, energyPlan.calories, saveDailyLog]);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 8 }}>
        <MonthNavigator year={viewYear} month={viewMonth} onPrev={handlePrevMonth} onNext={handleNextMonth} />
        <CalendarGrid
          year={viewYear}
          month={viewMonth}
          logs={historyLogs}
          selectedDate={selectedDate}
          todayStr={todayStr()}
          onSelectDate={handleSelectDate}
        />
      </View>
      {selectedDate ? (
        <DaySummaryCard
          dateStr={selectedDate}
          entry={selectedEntry}
          energyPlan={energyPlan}
          onEditDiet={() => setBackfillMode(backfillMode === "diet" ? null : "diet")}
          onEditTraining={() => setBackfillMode(backfillMode === "training" ? null : "training")}
        />
      ) : null}
      {backfillMode === "diet" && selectedDate ? (
        <GlassTile style={{ gap: 10 }}>
          <Label color={colors.accent}>饮食补填</Label>
          <TextInput
            multiline
            value={backfillDietText}
            onChangeText={setBackfillDietText}
            placeholder="输入那天的饮食，例如：一碗面 两个鸡蛋"
            placeholderTextColor={colors.inkFaint}
            style={{
              minHeight: 60,
              backgroundColor: colors.glass,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              borderRadius: 10,
              padding: 10,
              color: colors.ink,
              fontSize: Math.round(14 * fontScale),
            }}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button size="sm" color="accent" onPress={handleSaveDiet} disabled={!backfillDietText.trim()}>
              保存饮食
            </Button>
            <Button size="sm" color="accent2" variant="glass" onPress={() => setBackfillMode(null)}>
              取消
            </Button>
          </View>
        </GlassTile>
      ) : null}
      {backfillMode === "training" && selectedDate ? (
        <GlassTile style={{ gap: 10 }}>
          <Label color={colors.accent2}>训练补填</Label>
          <TextInput
            multiline
            value={backfillTrainingText}
            onChangeText={setBackfillTrainingText}
            placeholder="输入那天的训练，例如：卧推 30分钟"
            placeholderTextColor={colors.inkFaint}
            style={{
              minHeight: 60,
              backgroundColor: colors.glass,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              borderRadius: 10,
              padding: 10,
              color: colors.ink,
              fontSize: Math.round(14 * fontScale),
            }}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button size="sm" color="accent2" onPress={handleSaveTraining} disabled={!backfillTrainingText.trim()}>
              保存训练
            </Button>
            <Button size="sm" color="accent2" variant="glass" onPress={() => setBackfillMode(null)}>
              取消
            </Button>
          </View>
        </GlassTile>
      ) : null}
    </View>
  );
}
