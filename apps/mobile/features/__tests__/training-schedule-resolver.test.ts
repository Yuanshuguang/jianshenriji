import assert from "node:assert/strict";
import test from "node:test";
import {
  exercises,
  resolveTrainingSchedule,
  type TrainingSchedulePreference,
} from "@fitness-calendar/shared";

const basePreference: TrainingSchedulePreference = {
  daysPerWeek: 5,
  minutesPerSession: 60,
  equipment: ["徒手", "哑铃", "杠铃", "健身房器械", "跑步机"],
  preferredMuscleGroups: ["chest", "back", "legs", "shoulders", "arms", "core"],
  cardioRatio: 0.25,
};

test("碳循环五天一练：7 天日程只安排 5 个训练日", () => {
  const schedule = resolveTrainingSchedule({
    planId: "carb-cycling",
    dietPlanSelection: { variantId: "classic-3h-2m-2l" },
    exercises,
    preference: basePreference,
    anchorDate: new Date("2026-07-01"),
  });

  assert.equal(schedule.length, 7);
  assert.equal(schedule.filter((entry) => entry.trainingType !== "rest").length, 5);
  assert.equal(schedule.filter((entry) => entry.trainingType === "rest").length, 2);
});

test("碳循环：高碳日优先排大肌群，低碳日不排腿背胸大负荷", () => {
  const schedule = resolveTrainingSchedule({
    planId: "carb-cycling",
    dietPlanSelection: { variantId: "classic-3h-2m-2l" },
    exercises,
    preference: basePreference,
    anchorDate: new Date("2026-07-01"),
  });

  const highCarbTraining = schedule.filter((entry) => entry.dietDayType === "high-carb" && entry.trainingType !== "rest");
  const lowCarbEntries = schedule.filter((entry) => entry.dietDayType === "low-carb");

  assert.ok(highCarbTraining.length > 0);
  assert.ok(highCarbTraining.every((entry) => entry.focus && ["legs", "back", "chest"].includes(entry.focus)));
  assert.ok(lowCarbEntries.every((entry) => entry.trainingType === "rest" || !["legs", "back", "chest"].includes(entry.focus ?? "")));
});

test("低碳方案：可以训练但默认只给轻训练，不安排腿背大重量", () => {
  const schedule = resolveTrainingSchedule({
    planId: "low-carb",
    exercises,
    preference: basePreference,
    anchorDate: new Date("2026-07-01"),
  });

  const trainingDays = schedule.filter((entry) => entry.trainingType !== "rest");
  assert.equal(trainingDays.length, 5);
  assert.ok(trainingDays.every((entry) => entry.trainingType === "light"));
  assert.ok(trainingDays.every((entry) => !["legs", "back", "chest"].includes(entry.focus ?? "")));
});

test("生酮方案：训练日降为恢复强度，不出现高强度腿背安排", () => {
  const schedule = resolveTrainingSchedule({
    planId: "keto",
    exercises,
    preference: { ...basePreference, daysPerWeek: 4 },
    anchorDate: new Date("2026-07-01"),
  });

  const trainingDays = schedule.filter((entry) => entry.trainingType !== "rest");
  assert.equal(trainingDays.length, 4);
  assert.ok(trainingDays.every((entry) => entry.trainingType === "recovery"));
  assert.ok(trainingDays.every((entry) => !["legs", "back", "chest"].includes(entry.focus ?? "")));
});

test("均衡饮食：尊重用户训练频率，不再默认七天全练", () => {
  const schedule = resolveTrainingSchedule({
    planId: "high-protein-balanced",
    exercises,
    preference: { ...basePreference, daysPerWeek: 3 },
    anchorDate: new Date("2026-07-01"),
  });

  assert.equal(schedule.filter((entry) => entry.trainingType !== "rest").length, 3);
  assert.equal(schedule.filter((entry) => entry.trainingType === "rest").length, 4);
});
