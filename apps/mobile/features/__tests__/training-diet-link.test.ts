import assert from "node:assert/strict";
import test from "node:test";
import {
  exercises,
  resolveTrainingDietRecommendation,
} from "@fitness-calendar/shared";

test("碳循环高碳日：推荐高强度大肌群和复合动作", () => {
  const result = resolveTrainingDietRecommendation({
    planId: "carb-cycling",
    dayType: "high-carb",
    exercises,
    preferredMuscleGroups: ["arms", "core"],
    baseMinutes: 60,
  });

  assert.equal(result.intensity, "heavy");
  assert.ok(["legs", "back", "chest"].includes(result.focus));
  assert.equal(result.focus, "legs");
  assert.ok(result.exerciseIds.includes("squat"));
  assert.ok(result.exerciseIds.includes("deadlift"));
  assert.ok(!result.exerciseIds.includes("bench-press"));
  assert.ok(!result.exerciseIds.includes("row"));
  assert.ok(!result.exerciseIds.includes("pull-up"));
});

test("leg focus only recommends leg reference exercises", () => {
  const result = resolveTrainingDietRecommendation({
    planId: "high-protein-balanced",
    dayType: "balanced",
    exercises,
    preferredMuscleGroups: ["chest", "back"],
    manualFocus: "legs",
    baseMinutes: 60,
  });

  assert.equal(result.focus, "legs");
  assert.ok(result.exerciseIds.length > 0);
  assert.deepEqual(
    result.exerciseIds.filter((exerciseId) => ["bench-press", "row", "pull-up"].includes(exerciseId)),
    []
  );
  assert.ok(result.exerciseIds.every((exerciseId) => {
    const exercise = exercises.find((item) => item.id === exerciseId);
    return exercise?.primaryMuscleGroup === "legs";
  }));
});

test("低碳和生酮日：不默认推荐大重量大肌群", () => {
  const lowCarb = resolveTrainingDietRecommendation({
    planId: "low-carb",
    dayType: "low-carb",
    exercises,
    preferredMuscleGroups: ["legs", "back", "chest"],
    baseMinutes: 60,
  });
  const keto = resolveTrainingDietRecommendation({
    planId: "keto",
    dayType: "very-low-carb",
    exercises,
    preferredMuscleGroups: ["legs", "back", "chest"],
    baseMinutes: 60,
  });

  assert.equal(lowCarb.intensity, "light");
  assert.equal(keto.intensity, "recovery");
  assert.ok(!lowCarb.exerciseIds.includes("deadlift"));
  assert.ok(!keto.exerciseIds.includes("squat"));
});

test("大体重或新手用户：默认避开跑步并优先低冲击有氧", () => {
  const result = resolveTrainingDietRecommendation({
    planId: "keto",
    dayType: "very-low-carb",
    exercises,
    preferredMuscleGroups: ["cardio"],
    baseMinutes: 45,
    safetyProfile: { heightCm: 170, weightKg: 105, trainingLevel: "beginner" },
  });

  assert.equal(result.focus, "cardio");
  assert.ok(result.exerciseIds.includes("walking"));
  assert.ok(!result.exerciseIds.includes("running"));
  assert.match(result.caution, /默认避开跑步/);
});

test("16+8：保持常规训练，但提示靠近进食窗口", () => {
  const result = resolveTrainingDietRecommendation({
    planId: "if-16-8",
    dayType: "normal-eating",
    exercises,
    preferredMuscleGroups: ["chest"],
    baseMinutes: 45,
  });

  assert.equal(result.intensity, "moderate");
  assert.equal(result.focus, "chest");
  assert.match(result.caution, /进食窗口/);
});
