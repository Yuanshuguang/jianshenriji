import assert from "node:assert/strict";
import test from "node:test";
import {
  buildResetDevelopmentDataState,
  buildResetHealthDataState,
  buildResetTodayRecordsState,
  createDefaultActualMealImageFoods,
  createDefaultActualMealTexts,
  createDefaultActualTraining,
  defaultDietPreference,
  defaultDynamicAdjustmentSettings,
  defaultDynamicAtonementPreference,
  getActivityFactorFromPreference,
  migrateFitnessStoreState
} from "./fitness-store";

test("migrateFitnessStoreState fills legacy gaps and normalizes empty done training to pending", () => {
  const migrated = migrateFitnessStoreState({
    actualTraining: {
      status: "done",
      text: "",
      minutes: 0,
      calories: 120,
      fatigue: 2
    },
    selectedDietPlanVariantId: undefined
  });

  assert.equal(migrated.actualTraining?.status, "pending");
  assert.deepEqual(migrated.actualMealTexts, createDefaultActualMealTexts());
  assert.deepEqual(migrated.actualMealImageFoods, createDefaultActualMealImageFoods());
  assert.equal(migrated.fontScale, "normal");
  assert.equal(migrated.dashboardStyle, "bullet");
  assert.equal(migrated.selectedDietPlanVariantId, null);
});

test("buildResetHealthDataState preserves appearance and adjustment settings while clearing health data", () => {
  const resetState = buildResetHealthDataState({
    dietPreference: defaultDietPreference,
    appearanceMode: "light",
    fontScale: "large",
    dashboardStyle: "rings",
    dynamicAdjustmentEnabled: false,
    dynamicAdjustmentSettings: defaultDynamicAdjustmentSettings,
    dynamicAtonementPreference: defaultDynamicAtonementPreference
  });

  assert.equal(resetState.profile?.heightCm, 175);
  assert.equal(resetState.goal?.targetDays, 56);
  assert.deepEqual(resetState.actualMealTexts, createDefaultActualMealTexts());
  assert.deepEqual(resetState.actualMealImageFoods, createDefaultActualMealImageFoods());
  assert.deepEqual(resetState.actualTraining, createDefaultActualTraining());
  assert.equal(resetState.appearanceMode, "light");
  assert.equal(resetState.fontScale, "large");
  assert.equal(resetState.dashboardStyle, "rings");
});

test("buildResetTodayRecordsState clears only today data", () => {
  const resetState = buildResetTodayRecordsState();

  assert.equal(resetState.preparedFoodText, "");
  assert.deepEqual(resetState.actualMealTexts, createDefaultActualMealTexts());
  assert.deepEqual(resetState.actualMealImageFoods, createDefaultActualMealImageFoods());
  assert.deepEqual(resetState.actualTraining, createDefaultActualTraining());
});

test("buildResetDevelopmentDataState clears dev caches and logs", () => {
  const resetState = buildResetDevelopmentDataState();

  assert.deepEqual(resetState.actualMealTexts, createDefaultActualMealTexts());
  assert.deepEqual(resetState.actualMealImageFoods, createDefaultActualMealImageFoods());
  assert.equal(resetState.customFoods?.length, 0);
  assert.equal(resetState.menuFoods?.length, 0);
  assert.equal(resetState.historyLogs && Object.keys(resetState.historyLogs).length, 0);
});

test("getActivityFactorFromPreference uses actual weekly training volume", () => {
  const light = getActivityFactorFromPreference("intermediate", {
    daysPerWeek: 2,
    minutesPerSession: 30,
    cardioRatio: 0.2,
    equipment: [],
    preferredMuscleGroups: []
  });
  const heavy = getActivityFactorFromPreference("intermediate", {
    daysPerWeek: 6,
    minutesPerSession: 90,
    cardioRatio: 0.5,
    equipment: [],
    preferredMuscleGroups: []
  });

  assert.ok(light < heavy);
  assert.ok(light >= 1.25);
  assert.ok(heavy <= 1.75);
});
