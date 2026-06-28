import type { DailyLogEntry, DynamicAdjustmentSettings, Food } from "@fitness-calendar/shared";
import type { AppearanceMode, ActualTrainingFeedback, FontScaleLevel, TodayTrainingCustomExercise, TrainingPreferenceDraft, UserGoal, UserProfile } from "../store/fitness-store";

export type HealthDataSnapshot = {
  exportedAt: string;
  profile: UserProfile;
  goal: UserGoal;
  trainingPreference: TrainingPreferenceDraft;
  selectedFoodIds: string[];
  preparedFoodText: string;
  actualFoodText: string;
  actualMealTexts: Record<string, string>;
  actualFoodIds: string[];
  customFoods: Food[];
  menuFoods: Food[];
  actualTraining: ActualTrainingFeedback;
  todayTrainingPlan: {
    focus: string | null;
    minutes: number | null;
    nextFocus: string | null;
    customExercises: TodayTrainingCustomExercise[];
  };
  dynamicAdjustmentEnabled: boolean;
  dynamicAdjustmentSettings: DynamicAdjustmentSettings;
  appearanceMode: AppearanceMode;
  fontScale: FontScaleLevel;
  selectedDietPlanId: string | null;
  selectedDietPlanVariantId: string | null;
  historyLogs: Record<string, DailyLogEntry>;
};

export function buildHealthDataSnapshot(state: {
  profile: UserProfile;
  goal: UserGoal;
  trainingPreference: TrainingPreferenceDraft;
  selectedFoodIds: string[];
  preparedFoodText: string;
  actualFoodText: string;
  actualMealTexts: Record<string, string>;
  actualFoodIds: string[];
  customFoods: Food[];
  menuFoods: Food[];
  actualTraining: ActualTrainingFeedback;
  todayTrainingPlan: {
    focus: string | null;
    minutes: number | null;
    nextFocus: string | null;
    customExercises: TodayTrainingCustomExercise[];
  };
  dynamicAdjustmentEnabled: boolean;
  dynamicAdjustmentSettings: DynamicAdjustmentSettings;
  appearanceMode: AppearanceMode;
  fontScale: FontScaleLevel;
  selectedDietPlanId: string | null;
  selectedDietPlanVariantId: string | null;
  historyLogs: Record<string, DailyLogEntry>;
}): HealthDataSnapshot {
  return {
    exportedAt: new Date().toISOString(),
    profile: state.profile,
    goal: state.goal,
    trainingPreference: state.trainingPreference,
    selectedFoodIds: state.selectedFoodIds,
    preparedFoodText: state.preparedFoodText,
    actualFoodText: state.actualFoodText,
    actualMealTexts: state.actualMealTexts,
    actualFoodIds: state.actualFoodIds,
    customFoods: state.customFoods,
    menuFoods: state.menuFoods,
    actualTraining: state.actualTraining,
    todayTrainingPlan: state.todayTrainingPlan,
    dynamicAdjustmentEnabled: state.dynamicAdjustmentEnabled,
    dynamicAdjustmentSettings: state.dynamicAdjustmentSettings,
    appearanceMode: state.appearanceMode,
    fontScale: state.fontScale,
    selectedDietPlanId: state.selectedDietPlanId,
    selectedDietPlanVariantId: state.selectedDietPlanVariantId,
    historyLogs: state.historyLogs,
  };
}
