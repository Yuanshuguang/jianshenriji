import assert from "node:assert/strict";
import test from "node:test";
import { buildCalorieLedgerTimeline, buildCalorieDebtTimeline } from "./calorie-debt-ledger";
import type { DailyLogEntry, NutritionTotals } from "./index";

const target: NutritionTotals = { calories: 2000, proteinG: 150, fatG: 60, carbsG: 220 };

function makeLog(entry: Partial<DailyLogEntry> & Pick<DailyLogEntry, "date" | "actualIntake">): DailyLogEntry {
  return {
    date: entry.date,
    targetCalories: entry.targetCalories ?? target.calories,
    targetMacros: entry.targetMacros ?? target,
    actualIntake: entry.actualIntake,
    actualFoodText: entry.actualFoodText ?? "",
    actualMealTexts: entry.actualMealTexts ?? { breakfast: "", lunch: "", dinner: "", snack: "" },
    training: entry.training ?? { status: "pending", text: "", minutes: 0, calories: 0, fatigue: 3 },
    isComplete: entry.isComplete ?? true,
    debtSnapshot: entry.debtSnapshot
  };
}

test("热量账本按区间统计多摄入、少摄入和净差", () => {
  const ledger = buildCalorieLedgerTimeline({
    "2026-07-01": makeLog({ date: "2026-07-01", actualIntake: { calories: 3000, proteinG: 160, fatG: 80, carbsG: 360 } }),
    "2026-07-02": makeLog({ date: "2026-07-02", actualIntake: { calories: 1700, proteinG: 130, fatG: 50, carbsG: 180 } }),
    "2026-07-03": makeLog({ date: "2026-07-03", actualIntake: { calories: 2300, proteinG: 150, fatG: 70, carbsG: 250 } })
  });

  assert.equal(ledger.totalOverCalories, 1300);
  assert.equal(ledger.totalUnderCalories, 300);
  assert.equal(ledger.netCaloriesDelta, 1000);
  assert.equal(ledger.suggestedDailyCalorieAdjustment, 143);
  assert.match(ledger.calorieAdvice, /每天约 143 kcal/);
});

test("热量账本对非减脂目标不建议制造额外缺口", () => {
  const ledger = buildCalorieLedgerTimeline({
    "2026-07-01": makeLog({ date: "2026-07-01", actualIntake: { calories: 2300, proteinG: 160, fatG: 70, carbsG: 260 } })
  }, { goalType: "recomp" });

  assert.match(ledger.calorieAdvice, /回到目标区间/);
  assert.doesNotMatch(ledger.calorieAdvice, /温和缺口/);
});

test("蛋白质亏空只给分餐补足建议，不生成一次性补偿任务", () => {
  const ledger = buildCalorieLedgerTimeline({
    "2026-07-01": makeLog({ date: "2026-07-01", actualIntake: { calories: 1800, proteinG: 0, fatG: 60, carbsG: 220 } }),
    "2026-07-02": makeLog({ date: "2026-07-02", actualIntake: { calories: 1800, proteinG: 0, fatG: 60, carbsG: 220 } }),
    "2026-07-03": makeLog({ date: "2026-07-03", actualIntake: { calories: 2000, proteinG: 150, fatG: 60, carbsG: 220 } })
  });

  const protein = ledger.macroStats.find((item) => item.key === "proteinG");
  assert.equal(protein?.delta, -300);
  assert.equal(protein?.tone, "low");
  assert.equal(protein?.safeAdjustmentPerDay, 25);
  assert.match(protein?.advice ?? "", /不建议一次补齐/);
  assert.match(protein?.advice ?? "", /2-4 餐/);
});

test("脂肪连续偏低时提示恢复日目标，不要求短期集中高脂补偿", () => {
  const logs: Record<string, DailyLogEntry> = {};
  for (let day = 1; day <= 7; day += 1) {
    logs[`2026-07-0${day}`] = makeLog({
      date: `2026-07-0${day}`,
      actualIntake: { calories: 1700, proteinG: 150, fatG: 0, carbsG: 220 }
    });
  }

  const ledger = buildCalorieLedgerTimeline(logs);
  const fat = ledger.macroStats.find((item) => item.key === "fatG");
  assert.equal(fat?.delta, -420);
  assert.equal(fat?.tone, "low");
  assert.match(fat?.advice ?? "", /不要短期集中高脂补偿/);
});

test("训练记录不会作为热量账本的补偿来源累计", () => {
  const ledger = buildCalorieLedgerTimeline({
    "2026-07-01": makeLog({
      date: "2026-07-01",
      actualIntake: { calories: 2000, proteinG: 150, fatG: 60, carbsG: 220 },
      training: { status: "missed", text: "没练", minutes: 0, calories: 0, fatigue: 3 }
    })
  });

  assert.equal(ledger.netCaloriesDelta, 0);
  assert.equal(ledger.totalOverCalories, 0);
  assert.equal(ledger.totalUnderCalories, 0);
});

test("旧函数名仍兼容，但返回热量账本语义", () => {
  const ledger = buildCalorieDebtTimeline({
    "2026-07-01": makeLog({ date: "2026-07-01", actualIntake: { calories: 2100, proteinG: 150, fatG: 60, carbsG: 220 } })
  });

  assert.equal(ledger.netCaloriesDelta, 100);
  assert.equal(ledger.totalOverCalories, 100);
});
