import assert from "node:assert/strict";
import test from "node:test";
import { exercises, type WorkoutPlan } from "@fitness-calendar/shared";
import { estimateTodayWorkoutCalories } from "../today-plan";

test("estimateTodayWorkoutCalories 直接使用完整 profile", () => {
  const exercise = exercises.find((item) => item.id === "run") ?? exercises[0];
  const workout: WorkoutPlan = {
    id: "test-workout",
    title: "Test",
    focus: "cardio",
    estimatedMinutes: 30,
    exercises: [{ exerciseId: exercise.id, minutes: 30, sets: 1, reps: "1" }]
  };

  const shortUser = estimateTodayWorkoutCalories(workout, { heightCm: 165, weightKg: 70 });
  const tallUser = estimateTodayWorkoutCalories(workout, { heightCm: 185, weightKg: 70 });

  assert.ok(shortUser > tallUser);
});
