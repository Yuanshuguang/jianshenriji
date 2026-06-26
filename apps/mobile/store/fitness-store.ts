import { calculateGoalEnergyPlan, generateTrainingQueue, type DailyLogEntry, type DynamicAdjustmentSettings, type Food, type Gender, type MealAdjustmentKey, type MuscleGroup, type NutritionAdjustmentKey, type TrainingAdjustmentKey } from "@fitness-calendar/shared";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { type CustomPet } from "../features/pet";

export type UserProfile = {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  trainingLevel: "beginner" | "intermediate" | "regular";
};

export type UserGoal = {
  targetWeightKg: number;
  targetDays: number;
  targetBodyShapeId: string;
};

export type TrainingPreferenceDraft = {
  daysPerWeek: number;
  minutesPerSession: number;
  equipment: string[];
  preferredMuscleGroups: MuscleGroup[];
  cardioRatio: number;
};

export type TodayTrainingPlanDraft = {
  focus: MuscleGroup | null;
  minutes: number | null;
  nextFocus: MuscleGroup | null;
  customExercises: TodayTrainingCustomExercise[];
};

export type TodayTrainingCustomExercise = {
  id: string;
  name: string;
  source: string;
  equipment: string | null;
  bodyPart: string | null;
  minutes: number;
  sets: number;
  reps: string;
};

export type ActualTrainingStatus = "pending" | "done" | "missed" | "changed";
export type AppearanceMode = "light" | "dark";

export type ActualTrainingFeedback = {
  status: ActualTrainingStatus;
  text: string;
  minutes: number;
  calories: number;
  fatigue: number;
};

type FitnessState = {
  profile: UserProfile;
  goal: UserGoal;
  trainingPreference: TrainingPreferenceDraft;
  selectedFoodIds: string[];
  preparedFoodText: string;
  actualFoodText: string;
  actualMealTexts: Record<MealAdjustmentKey, string>;
  actualFoodIds: string[];
  customFoods: Food[];
  menuFoods: Food[];
  actualTraining: ActualTrainingFeedback;
  todayTrainingPlan: TodayTrainingPlanDraft;
  /** 动态调整开关：控制长期计划是否根据每日偏差自动调整。默认开启。 */
  dynamicAdjustmentEnabled: boolean;
  /** 动态调整细分规则：控制哪些数据维度可以参与自动调整。 */
  dynamicAdjustmentSettings: DynamicAdjustmentSettings;
  /** 外观模式：日间或夜间。 */
  appearanceMode: AppearanceMode;
  /** 当前选中的饮食方案模板 id，null 表示未选择 */
  selectedDietPlanId: string | null;
  /** 选中的预设宠物 id，null 表示未选预设 */
  selectedPetId: string | null;
  /** 自定义宠物（若用户用照片创建），优先级高于 selectedPetId */
  customPet: CustomPet | null;
  /** 宠物功能开关：关闭后隐藏饮食/训练页宠物提醒，但保留已选择宠物。 */
  petEnabled: boolean;
  setProfile: (profile: UserProfile) => void;
  setGoal: (goal: UserGoal) => void;
  setTrainingPreference: (trainingPreference: TrainingPreferenceDraft) => void;
  setSelectedFoodIds: (selectedFoodIds: string[]) => void;
  setPreparedFoods: (preparedFoodText: string, selectedFoodIds: string[]) => void;
  setActualFoods: (actualFoodText: string, actualFoodIds: string[]) => void;
  setActualMealText: (meal: MealAdjustmentKey, text: string) => void;
  addCustomFood: (food: Food) => void;
  removeCustomFood: (foodId: string) => void;
  addMenuFood: (food: Food) => void;
  removeMenuFood: (foodId: string) => void;
  setActualTraining: (actualTraining: ActualTrainingFeedback) => void;
  setTodayTrainingPlan: (todayTrainingPlan: TodayTrainingPlanDraft) => void;
  setDynamicAdjustmentEnabled: (enabled: boolean) => void;
  setDynamicAdjustmentSettings: (settings: DynamicAdjustmentSettings) => void;
  setAppearanceMode: (mode: AppearanceMode) => void;
  setSelectedDietPlan: (planId: string | null) => void;
  setSelectedPet: (petId: string | null) => void;
  setCustomPet: (pet: CustomPet | null) => void;
  setPetEnabled: (enabled: boolean) => void;
  /** 历史日志：按日期 YYYY-MM-DD 索引 */
  historyLogs: Record<string, DailyLogEntry>;
  /** 保存或更新某日的日志 */
  saveDailyLog: (date: string, entry: DailyLogEntry) => void;
  /** 获取某日的日志 */
  getLogForDate: (date: string) => DailyLogEntry | undefined;
  isOnboardingComplete: () => boolean;
};

const browserStorage: StateStorage = {
  getItem: (name) => {
    if (typeof localStorage === "undefined") {
      return indexedStorage().getItem(name);
    }

    const value = localStorage.getItem(name);
    return value ?? indexedStorage().getItem(name);
  },
  setItem: (name, value) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(name, value);
    }
    indexedStorage().setItem(name, value);
  },
  removeItem: (name) => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(name);
    }
    indexedStorage().removeItem(name);
  }
};

/** IndexedDB 回退：localStorage 被清理或不可用时保留数据 */
let _dbPromise: Promise<IDBDatabase> | null = null;
function db() {
  if (!_dbPromise) {
    _dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open("fitness-calendar-state", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("store");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return _dbPromise;
}

function indexedStorage() {
  return {
    async getItem(name: string): Promise<string | null> {
      try {
        const d = await db();
        return new Promise((resolve) => {
          const tx = d.transaction("store", "readonly");
          const req = tx.objectStore("store").get(name);
          req.onsuccess = () => resolve(req.result ?? null);
          req.onerror = () => resolve(null);
        });
      } catch {
        return null;
      }
    },
    async setItem(name: string, value: string) {
      try {
        const d = await db();
        const tx = d.transaction("store", "readwrite");
        tx.objectStore("store").put(value, name);
      } catch { /* pass */ }
    },
    async removeItem(name: string) {
      try {
        const d = await db();
        const tx = d.transaction("store", "readwrite");
        tx.objectStore("store").delete(name);
      } catch { /* pass */ }
    }
  };
}

const defaultProfile: UserProfile = {
  gender: "male",
  age: 30,
  heightCm: 175,
  weightKg: 70,
  trainingLevel: "intermediate"
};

const defaultGoal: UserGoal = {
  targetWeightKg: 66,
  targetDays: 56,
  targetBodyShapeId: "slight-line"
};

const defaultTrainingPreference: TrainingPreferenceDraft = {
  daysPerWeek: 4,
  minutesPerSession: 60,
  equipment: ["徒手", "哑铃", "健身房", "健身房器械", "杠铃", "跑步机"],
  preferredMuscleGroups: ["chest", "back", "legs", "shoulders"],
  cardioRatio: 0.25
};

const defaultTodayTrainingPlan: TodayTrainingPlanDraft = {
  focus: null,
  minutes: null,
  nextFocus: null,
  customExercises: []
};

export const defaultDynamicAdjustmentSettings: DynamicAdjustmentSettings = {
  nutrition: {
    calories: true,
    proteinG: true,
    fatG: true,
    carbsG: true
  },
  meals: {
    breakfast: true,
    lunch: true,
    dinner: true,
    snack: true
  },
  training: {
    calories: true,
    schedule: true,
    fatigue: true
  },
  muscles: {
    chest: true,
    back: true,
    legs: true,
    shoulders: true,
    arms: true,
    core: true,
    cardio: true
  }
};

export const useFitnessStore = create<FitnessState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      historyLogs: {},
      goal: defaultGoal,
      trainingPreference: defaultTrainingPreference,
      selectedFoodIds: [],
      preparedFoodText: "",
      actualFoodText: "",
      actualMealTexts: {
        breakfast: "",
        lunch: "",
        dinner: "",
        snack: ""
      },
      actualFoodIds: [],
      customFoods: [],
      menuFoods: [],
      actualTraining: {
        status: "pending",
        text: "",
        minutes: 0,
        calories: 0,
        fatigue: 3
      },
      todayTrainingPlan: defaultTodayTrainingPlan,
      dynamicAdjustmentEnabled: true,
      dynamicAdjustmentSettings: defaultDynamicAdjustmentSettings,
      appearanceMode: "light",
      selectedDietPlanId: null,
      selectedPetId: null,
      customPet: null,
      petEnabled: true,
      setProfile: (profile) => set({ profile }),
      setGoal: (goal) => set({ goal }),
      setTrainingPreference: (trainingPreference) => set({ trainingPreference }),
      setSelectedFoodIds: (selectedFoodIds) => set({ selectedFoodIds }),
      setPreparedFoods: (preparedFoodText, selectedFoodIds) => set({ preparedFoodText, selectedFoodIds }),
      setActualFoods: (actualFoodText, actualFoodIds) => set({ actualFoodText, actualFoodIds }),
      setActualMealText: (meal, text) =>
        set((state) => ({
          actualMealTexts: {
            ...state.actualMealTexts,
            [meal]: text
          }
        })),
      addCustomFood: (food) =>
        set((state) => ({
          customFoods: [food, ...state.customFoods.filter((item) => item.id !== food.id)]
        })),
      removeCustomFood: (foodId) =>
        set((state) => ({
          customFoods: state.customFoods.filter((item) => item.id !== foodId)
        })),
      addMenuFood: (food) =>
        set((state) => ({
          menuFoods: [food, ...state.menuFoods.filter((item) => item.id !== food.id)]
        })),
      removeMenuFood: (foodId) =>
        set((state) => ({
          menuFoods: state.menuFoods.filter((item) => item.id !== foodId)
        })),
      setActualTraining: (actualTraining) => set({ actualTraining }),
      setTodayTrainingPlan: (todayTrainingPlan) => set({ todayTrainingPlan }),
      setDynamicAdjustmentEnabled: (enabled) => set({ dynamicAdjustmentEnabled: enabled }),
      setDynamicAdjustmentSettings: (dynamicAdjustmentSettings) => set({ dynamicAdjustmentSettings }),
      setAppearanceMode: (mode) => set({ appearanceMode: mode }),
      setSelectedDietPlan: (planId) => set({ selectedDietPlanId: planId }),
      setSelectedPet: (petId) => set({ selectedPetId: petId }),
      setCustomPet: (pet) => set({ customPet: pet }),
      setPetEnabled: (petEnabled) => set({ petEnabled }),
      saveDailyLog: (date, entry) =>
        set((state) => ({
          historyLogs: { ...state.historyLogs, [date]: entry }
        })),
      getLogForDate: (date) => {
        return get().historyLogs[date];
      },
      isOnboardingComplete: () => {
        const { profile, goal, trainingPreference } = get();
        return profile.age > 0 && profile.heightCm > 0 && profile.weightKg > 0 && goal.targetDays > 0 && trainingPreference.daysPerWeek > 0;
      }
    }),
    {
      name: "fitness-calendar-state",
      version: 5,
      storage: createJSONStorage(() => browserStorage),
      migrate: (persistedState) => {
        const state = persistedState as Partial<FitnessState>;
        const migratedState = {
          ...state,
          customFoods: state.customFoods ?? [],
          menuFoods: state.menuFoods ?? [],
          historyLogs: state.historyLogs ?? {},
          actualMealTexts: state.actualMealTexts ?? {
            breakfast: "",
            lunch: "",
            dinner: "",
            snack: ""
          },
          petEnabled: state.petEnabled ?? true,
          todayTrainingPlan: {
            ...defaultTodayTrainingPlan,
            ...state.todayTrainingPlan,
            customExercises: state.todayTrainingPlan?.customExercises ?? []
          },
          dynamicAdjustmentSettings: mergeDynamicAdjustmentSettings(state.dynamicAdjustmentSettings)
        };
        if (migratedState.actualTraining?.status === "done" && migratedState.actualTraining.minutes === 0 && migratedState.actualTraining.text.trim().length === 0) {
          return {
            ...migratedState,
            actualTraining: {
              ...migratedState.actualTraining,
              status: "pending" as const
            }
          };
        }

        return migratedState;
      },
      partialize: (state) => ({
        historyLogs: state.historyLogs,
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
        selectedDietPlanId: state.selectedDietPlanId,
        selectedPetId: state.selectedPetId,
        customPet: state.customPet,
        petEnabled: state.petEnabled
      })
    }
  )
);

export function useCurrentEnergyPlan() {
  const profile = useFitnessStore((state) => state.profile);
  const goal = useFitnessStore((state) => state.goal);

  return calculateGoalEnergyPlan({
    currentWeightKg: profile.weightKg,
    targetWeightKg: goal.targetWeightKg,
    days: goal.targetDays,
    heightCm: profile.heightCm,
    age: profile.age,
    gender: profile.gender,
    activityFactor: getActivityFactor(profile.trainingLevel)
  });
}

export function getActivityFactor(trainingLevel: UserProfile["trainingLevel"]): number {
  if (trainingLevel === "regular") {
    return 1.6;
  }

  if (trainingLevel === "intermediate") {
    return 1.45;
  }

  return 1.3;
}

export function buildTrainingQueue(exercises: Parameters<typeof generateTrainingQueue>[0], preference: TrainingPreferenceDraft) {
  return generateTrainingQueue(exercises, preference);
}

function mergeDynamicAdjustmentSettings(settings?: Partial<DynamicAdjustmentSettings>): DynamicAdjustmentSettings {
  return {
    nutrition: { ...defaultDynamicAdjustmentSettings.nutrition, ...settings?.nutrition },
    meals: { ...defaultDynamicAdjustmentSettings.meals, ...settings?.meals },
    training: { ...defaultDynamicAdjustmentSettings.training, ...settings?.training },
    muscles: { ...defaultDynamicAdjustmentSettings.muscles, ...settings?.muscles }
  };
}
