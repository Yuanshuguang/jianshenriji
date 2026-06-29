import { calculateGoalEnergyPlan, generateTrainingQueue, type DailyLogEntry, type DynamicAdjustmentSettings, type Food, type Gender, type MealAdjustmentKey, type MuscleGroup, type NutritionAdjustmentKey, type TrainingAdjustmentKey } from "@fitness-calendar/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
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

/** 仪表盘可视化方案 */
export type DashboardStyle = "bullet" | "barCursor" | "kpiCards" | "rings";

export const dashboardStyleLabels: Record<DashboardStyle, string> = {
  bullet: "子弹图",
  barCursor: "单条 + 游标",
  kpiCards: "卡片网格",
  rings: "环形进度"
};

export const dashboardStyleDescriptions: Record<DashboardStyle, string> = {
  bullet: "6 项并列一行，目标线 + 实际填充，密度最高",
  barCursor: "每项独占一行 + 三角游标，最熟悉",
  kpiCards: "2~3 列大卡片，每张含数字与条",
  rings: "6 个同心圆环，对标 Apple Health"
};

/** 字体缩放档位 */
export type FontScaleLevel = "small" | "normal" | "large" | "xlarge";

/** 档位 → 数值映射 */
export const fontScaleValues: Record<FontScaleLevel, number> = {
  small: 0.85,
  normal: 1.0,
  large: 1.15,
  xlarge: 1.3,
};

/** 档位 → 中文标签 */
export const fontScaleLabels: Record<FontScaleLevel, string> = {
  small: "紧凑",
  normal: "标准",
  large: "放大",
  xlarge: "超大",
};

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
  /** 字体缩放档位：紧凑/标准/放大/超大，默认标准。 */
  fontScale: FontScaleLevel;
  /** 仪表盘可视化方案：默认子弹图。 */
  dashboardStyle: DashboardStyle;
  /** 当前选中的饮食方案模板 id，null 表示未选择 */
  selectedDietPlanId: string | null;
  selectedDietPlanVariantId: string | null;
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
  setFontScale: (level: FontScaleLevel) => void;
  setDashboardStyle: (style: DashboardStyle) => void;
  setSelectedDietPlan: (planId: string | null) => void;
  setSelectedDietPlanVariant: (variantId: string | null) => void;
  setSelectedPet: (petId: string | null) => void;
  setCustomPet: (pet: CustomPet | null) => void;
  setPetEnabled: (enabled: boolean) => void;
  /** 历史日志：按日期 YYYY-MM-DD 索引 */
  historyLogs: Record<string, DailyLogEntry>;
  /** 保存或更新某日的日志 */
  saveDailyLog: (date: string, entry: DailyLogEntry) => void;
  /** 获取某日的日志 */
  getLogForDate: (date: string) => DailyLogEntry | undefined;
  /** 重置健康数据 */
  resetHealthData: () => void;
  isOnboardingComplete: () => boolean;
};

function reportStorageError(operation: string, error: unknown) {
  console.error(`[fitness-store] ${operation} failed`, error);
}

const nativeStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => {
    void AsyncStorage.setItem(name, value).catch((error: unknown) => reportStorageError("native setItem", error));
  },
  removeItem: (name) => {
    void AsyncStorage.removeItem(name).catch((error: unknown) => reportStorageError("native removeItem", error));
  }
};

const browserStorage: StateStorage = {
  getItem: (name) => {
    try {
      if (typeof localStorage === "undefined") {
        return null;
      }

      return localStorage.getItem(name);
    } catch (error) {
      reportStorageError("web getItem", error);
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(name, value);
      }
    } catch (error) {
      reportStorageError("web setItem", error);
    }
    void indexedStorage().setItem(name, value);
  },
  removeItem: (name) => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(name);
      }
    } catch (error) {
      reportStorageError("web removeItem", error);
    }
    void indexedStorage().removeItem(name);
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
      } catch (error) {
        reportStorageError("indexedDB getItem", error);
        return null;
      }
    },
    async setItem(name: string, value: string) {
      try {
        const d = await db();
        const tx = d.transaction("store", "readwrite");
        tx.objectStore("store").put(value, name);
      } catch (error) {
        reportStorageError("indexedDB setItem", error);
      }
    },
    async removeItem(name: string) {
      try {
        const d = await db();
        const tx = d.transaction("store", "readwrite");
        tx.objectStore("store").delete(name);
      } catch (error) {
        reportStorageError("indexedDB removeItem", error);
      }
    }
  };
}

const appStorage = Platform.OS === "web" ? browserStorage : nativeStorage;

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
      appearanceMode: "dark",
      fontScale: "normal",
      dashboardStyle: "bullet",
      selectedDietPlanId: null,
      selectedDietPlanVariantId: null,
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
      setFontScale: (fontScale) => set({ fontScale }),
      setDashboardStyle: (dashboardStyle) => set({ dashboardStyle }),
      setSelectedDietPlan: (planId) => set({ selectedDietPlanId: planId }),
      setSelectedDietPlanVariant: (variantId) => set({ selectedDietPlanVariantId: variantId }),
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
      resetHealthData: () =>
        set((state) => ({
          profile: defaultProfile,
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
          historyLogs: {},
          selectedDietPlanId: null,
          selectedDietPlanVariantId: null,
          customPet: state.customPet,
          selectedPetId: state.selectedPetId,
          petEnabled: state.petEnabled,
          appearanceMode: state.appearanceMode,
          fontScale: state.fontScale,
          dynamicAdjustmentEnabled: state.dynamicAdjustmentEnabled,
          dynamicAdjustmentSettings: state.dynamicAdjustmentSettings
        })),
      isOnboardingComplete: () => {
        const { profile, goal, trainingPreference } = get();
        return profile.age > 0 && profile.heightCm > 0 && profile.weightKg > 0 && goal.targetDays > 0 && trainingPreference.daysPerWeek > 0;
      }
    }),
    {
      name: "fitness-calendar-state",
      version: 6,
      storage: createJSONStorage(() => appStorage),
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
          dynamicAdjustmentSettings: mergeDynamicAdjustmentSettings(state.dynamicAdjustmentSettings),
          fontScale: state.fontScale ?? "normal",
          selectedDietPlanVariantId: state.selectedDietPlanVariantId ?? null
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
        fontScale: state.fontScale,
        dashboardStyle: state.dashboardStyle,
        selectedDietPlanId: state.selectedDietPlanId,
        selectedDietPlanVariantId: state.selectedDietPlanVariantId,
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
