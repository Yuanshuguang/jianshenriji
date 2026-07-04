import {
  calculateNutritionGap,
  calculateFoodTotals,
  calculateDietPlanMacroTargets,
  calculateDefaultMealBudgets,
  exercises,
  getFoodByIdFromCatalog,
  getFoodCatalog,
  recommendMacroAwarePortions,
  resolveTrainingDietRecommendation,
  resolveDietPlanDay,
  sumNutrition,
  type DailyLogEntry,
  type DietPlanCycleSelection,
  type EnergyPlan,
  type Food,
  type FoodPortion,
  type MealAdjustmentKey,
  type MealPlannerAdjustments,
  type MealPlannerMacroKey,
  type NutritionTotals,
} from "@fitness-calendar/shared";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { createElement, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Modal, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { CalendarHistoryPanel } from "../../components/CalendarHistoryPanel";
import { AsyncStatusBanner } from "../../components/shared/EmptyState";
import AppIcon from "../../components/bento/AppIcon";
import { MealRecordCard } from "../../components/diet/MealCompareRow";
import {
  Badge,
  Button,
  GlassTile,
  Label,
  ProgressRing,
  Screen,
  Text as BentoText,
  bento,
  colors,
  radius,
  type SemanticColor,
  useBentoTheme,
  type BentoThemeColors,
  MetricCompareBar,
} from "../../components/bento";
import { WeekDateRail } from "../../components/shared";
import {
  buildActualFoodPortionsFromText,
  buildMealPlan,
  estimateTodayWorkoutCalories,
  parseFoodText,
  type MealPlan,
} from "../../features/today-plan";
import { getFoodRecordStateCopy, resolveFoodRecordState } from "../../features/food-record-state";
import { buildDailyAdjustmentSummary, buildDebtSnapshot } from "../../features/adjustments";
import { getDietPlanById, type DietPlan } from "../../features/diet-plans";
import { getFoodVariantGroupLabel, getFoodVariantOptions, inferDefaultFoodVariant, resolveFoodByVariant } from "../../features/food-variant-options";
import { searchOnlineFood } from "../../features/food-online-search";
import { buildTrainingQueue, useCurrentEnergyPlan, useFitnessStore, type AiRecognizedMealFood } from "../../store/fitness-store";
import { resolveFoodNutrition } from "../../features/food-nutrition-resolver";
import { recognizeDishImage, resolveDishRecognitionFoods, type DishRecognitionCandidate } from "../../features/food-image-recognition";
import { buildCustomFoodFromNutritionLabel, recognizeNutritionLabelImage } from "../../features/nutrition-label-recognition";
import { prepareAiImageUploadFromBase64Asset, prepareAiImageUploadFromFile } from "../../features/ai-image-upload";

type FoodRecordMode = "actual" | "prepared";
type MealDisplayMode = "planned" | "actual";

type DashboardMetric = {
  key: string;
  label: string;
  unit: string;
  target: number;
  actual: number;
  color: SemanticColor;
  progress: number;
};

type DashboardDetailSource = {
  name: string;
  detail: string;
  value: string;
};

type DashboardDetailValueMode = "actual" | "target" | "diff";
type DashboardDetailBreakdownMode = "food" | "meal";

type DashboardDetailSourceGroups = {
  foodActual: DashboardDetailSource[];
  mealActual: DashboardDetailSource[];
  mealTarget: DashboardDetailSource[];
  mealDiff: DashboardDetailSource[];
};

type DashboardCell = {
  key: string;
  label: string;
  actual: number;
  target: number;
  unit: string;
  baseColor: SemanticColor;
};
type DashboardMetricDetail = {
  key: string;
  label: string;
  targetLine: string;
  targetReason: string;
  actualLine: string;
  diffLine: string;
  diffTone: SemanticColor;
  sourceTitle: string;
  emptySourceLabel: string;
  sources: DashboardDetailSource[];
  sourceGroups: DashboardDetailSourceGroups;
};

type FoodTagEdit = {
  key: string;
  label: string;
  calories: string;
  grams: string;
  foodName: string;
  foodId: string;
  foodCategory: Food["category"];
  defaultFilling: string;
  unitCalories: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  inputText?: string;
  displayAmount?: string;
  quantity?: number;
  unit?: string;
};

type FoodTagOverride = {
  hidden?: boolean;
  label?: string;
  calories?: number;
  grams?: number;
  filling?: string;
};

type FoodTagMatch = {
  input: string;
  food: Food;
  grams: number;
  quantity?: number;
  unit?: string;
  displayAmount?: string;
  meal?: MealAdjustmentKey | "unknown";
  confidence?: number;
  needsDetails?: boolean;
  detailHint?: string;
};

type ActualFoodPortionWithMeta = FoodPortion & {
  meal?: MealAdjustmentKey;
  displayAmount?: string;
  sourceIndex?: number;
};

type MealFoodTag = {
  key: string;
  label: string;
  calories: number;
  needsDetails?: boolean;
  match?: FoodTagMatch;
};

type DietPlanSummary = {
  name: string;
  status: string;
  sourceLabel: string;
  macroLabel: string;
  logic: string;
  allocation: string[];
};

const mealSlots: Array<{ id: MealAdjustmentKey; name: string }> = [
  { id: "breakfast", name: "早餐" },
  { id: "lunch", name: "午餐" },
  { id: "dinner", name: "晚餐" },
  { id: "snack", name: "加餐" },
];

export default function TodayScreen() {
  const router = useRouter();
  const energyPlan = useCurrentEnergyPlan();
  const c = useBentoTheme().colors;
  const selectedFoodIds = useFitnessStore((state) => state.selectedFoodIds);
  const preparedFoodText = useFitnessStore((state) => state.preparedFoodText);
  const actualFoodText = useFitnessStore((state) => state.actualFoodText);
  const actualMealTexts = useFitnessStore((state) => state.actualMealTexts);
  const actualMealImageFoods = useFitnessStore((state) => state.actualMealImageFoods);
  const customFoods = useFitnessStore((state) => state.customFoods);
  const menuFoods = useFitnessStore((state) => state.menuFoods);
  const actualTraining = useFitnessStore((state) => state.actualTraining);
  const profile = useFitnessStore((state) => state.profile);
  const goal = useFitnessStore((state) => state.goal);
  const trainingPreference = useFitnessStore((state) => state.trainingPreference);
  const dietPreference = useFitnessStore((state) => state.dietPreference);
  const mealPlanCustomAdjustment = useFitnessStore((state) => state.mealPlanCustomAdjustment);
  const todayTrainingPlan = useFitnessStore((state) => state.todayTrainingPlan);
  const dynamicAdjustmentSettings = useFitnessStore((state) => state.dynamicAdjustmentSettings);
  const dynamicAtonementPreference = useFitnessStore((state) => state.dynamicAtonementPreference);
  const selectedDietPlanId = useFitnessStore((state) => state.selectedDietPlanId);
  const selectedDietPlanVariantId = useFitnessStore((state) => state.selectedDietPlanVariantId);
  const setPreparedFoods = useFitnessStore((state) => state.setPreparedFoods);
  const setActualFoods = useFitnessStore((state) => state.setActualFoods);
  const setActualMealText = useFitnessStore((state) => state.setActualMealText);
  const addActualMealImageFoods = useFitnessStore((state) => state.addActualMealImageFoods);
  const addCustomFood = useFitnessStore((state) => state.addCustomFood);
  const removeCustomFood = useFitnessStore((state) => state.removeCustomFood);
  const addMenuFood = useFitnessStore((state) => state.addMenuFood);
  const removeMenuFood = useFitnessStore((state) => state.removeMenuFood);
  const setMealPlanCustomAdjustment = useFitnessStore((state) => state.setMealPlanCustomAdjustment);
  const saveDailyLog = useFitnessStore((state) => state.saveDailyLog);

  const [mealCalendarOpen, setMealCalendarOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [recordCollapsed, setRecordCollapsed] = useState(false);
  const [mealsCollapsed, setMealsCollapsed] = useState(false);
  const [menuCollapsed, setMenuCollapsed] = useState(true);
  const [foodRecordMode, setFoodRecordMode] = useState<FoodRecordMode>("actual");
  const [mealDisplayMode, setMealDisplayMode] = useState<MealDisplayMode>("actual");
  const [customMealAdjustmentOpen, setCustomMealAdjustmentOpen] = useState(false);
  const [customMealAdjustmentMode, setCustomMealAdjustmentMode] = useState<"food" | "macro">("food");
  const [menuName, setMenuName] = useState("");
  const [menuCalories, setMenuCalories] = useState("");
  const [menuProtein, setMenuProtein] = useState("");
  const [menuFat, setMenuFat] = useState("");
  const [menuCarbs, setMenuCarbs] = useState("");
  const [menuGram, setMenuGram] = useState("100");
  const [dishRecognitionMeal, setDishRecognitionMeal] = useState<MealAdjustmentKey>("lunch");
  const [dishRecognitionBusy, setDishRecognitionBusy] = useState(false);
  const [dishRecognitionMessage, setDishRecognitionMessage] = useState("");
  const [nutritionOcrBusy, setNutritionOcrBusy] = useState(false);
  const [nutritionOcrMessage, setNutritionOcrMessage] = useState("");
  const [foodTagEdits, setFoodTagEdits] = useState<Record<string, FoodTagOverride>>({});
  const [editingFoodTag, setEditingFoodTag] = useState<FoodTagEdit | null>(null);
  const [editingMealSlot, setEditingMealSlot] = useState<MealAdjustmentKey | null>(null);
  const [dietPlanLogicOpen, setDietPlanLogicOpen] = useState(false);
  const [dashboardDetailKey, setDashboardDetailKey] = useState<string | null>(null);
  const [onlineFoodLookup, setOnlineFoodLookup] = useState<Record<string, { loading?: boolean; message?: string }>>({});
  const dishImageInputRef = useRef<HTMLInputElement | null>(null);
  const nutritionLabelInputRef = useRef<HTMLInputElement | null>(null);
  const lastSavedDailyLogSignatureRef = useRef("");

  const today = new Date();
  const todayKey = formatDateKey(today);
  const selectedDietPlan = getDietPlanById(selectedDietPlanId);
  const dietPlanCycleSelection: DietPlanCycleSelection = selectedDietPlanVariantId
    ? { variantId: selectedDietPlanVariantId }
    : {};
  const resolvedDietDay = resolveDietPlanDay(selectedDietPlanId, today, dietPlanCycleSelection);
  const dietMacros = calculateDietPlanMacroTargets(selectedDietPlanId, energyPlan, {
    date: today,
    dayType: resolvedDietDay.dayType,
    selection: dietPlanCycleSelection,
  });
  const dietTarget: EnergyPlan = {
    ...dietMacros,
    bmr: energyPlan.bmr,
    tdee: energyPlan.tdee,
    dailyDeficit: energyPlan.dailyDeficit,
  };
  const recommendedTrainingQueue = buildTrainingQueue(exercises, trainingPreference);
  const recommendedWorkout = recommendedTrainingQueue[0];
  const dietTrainingRecommendation = resolveTrainingDietRecommendation({
    planId: selectedDietPlanId,
    dayType: resolvedDietDay.dayType,
    exercises,
    preferredMuscleGroups: trainingPreference.preferredMuscleGroups,
    baseMinutes: trainingPreference.minutesPerSession,
    manualFocus: todayTrainingPlan.focus,
    manualMinutes: todayTrainingPlan.minutes
  });
  const plannedTrainingFocus = dietTrainingRecommendation.focus;
  const plannedTrainingWorkout = buildTrainingQueue(exercises, {
    ...trainingPreference,
    daysPerWeek: 1,
    minutesPerSession: dietTrainingRecommendation.durationMinutes,
    preferredMuscleGroups: [dietTrainingRecommendation.focus]
  })[0] ?? recommendedWorkout;
  const plannedTrainingBaseCalories = estimateTodayWorkoutCalories(plannedTrainingWorkout, profile.weightKg);
  const plannedTrainingCalories =
    todayTrainingPlan.minutes && plannedTrainingWorkout?.estimatedMinutes
      ? Math.round(plannedTrainingBaseCalories * (todayTrainingPlan.minutes / Math.max(1, plannedTrainingWorkout.estimatedMinutes)))
      : plannedTrainingBaseCalories;

  const selectedFoods = selectedFoodIds.flatMap((foodId) => {
    const food = getFoodByIdFromCatalog(foodId, customFoods);
    return food ? [food] : [];
  });
  const enabledMeals = dietPreference.enabledMeals;
  const visibleMealSlots = mealSlots.filter((slot) => enabledMeals[slot.id] !== false);
  const activeMealSlots = visibleMealSlots.length > 0 ? visibleMealSlots : mealSlots.filter((slot) => slot.id === "lunch");
  const activeDishRecognitionMeal = enabledMeals[dishRecognitionMeal] === false
    ? activeMealSlots[0]?.id ?? "lunch"
    : dishRecognitionMeal;
  const plannedPortions = recommendMacroAwarePortions(selectedFoods, dietTarget, {
    enabledMeals,
    dayType: resolvedDietDay.dayType,
    trainingFocus: plannedTrainingFocus,
    adjustments: mealPlanCustomAdjustment
  });
  const plannedTotals = sumNutrition(plannedPortions.map((portion) => portion.totals));
  const preparedResult = parseFoodText(preparedFoodText, customFoods);
  const actualFood = buildActualFoodPortionsFromText(actualFoodText, customFoods, {
    dailyCalorieTarget: dietTarget.calories,
  });
  const aiImageMatches = buildAiImageFoodMatches(actualMealImageFoods, customFoods);
  const aiImagePortions = buildAiImageFoodPortions(aiImageMatches, actualFood.parsed.matched.length);
  const combinedActualMatches = [...actualFood.parsed.matched, ...aiImageMatches];
  const combinedActualPortions = [...actualFood.portions, ...aiImagePortions];
  const adjustedActualPortions = applyFoodTagOverrides(combinedActualPortions, combinedActualMatches, foodTagEdits);
  const actualTotals = sumNutrition(adjustedActualPortions.map((portion) => portion.totals));
  const actualIntake = Math.round(actualTotals.calories);
  const intakeDiff = Math.round(actualIntake - dietTarget.calories);
  const intakeDiffLabel = intakeDiff > 0
    ? `超出 ${Math.abs(intakeDiff)} kcal`
    : `还差 ${Math.abs(intakeDiff)} kcal`;
  const actualGap = calculateNutritionGap(dietTarget, actualTotals);
  const intakeColor: SemanticColor = intakeDiff > 0 ? "warn" : "accent";

  const dashboardCells: DashboardCell[] = [
    {
      key: "intake",
      label: "摄入",
      actual: actualIntake,
      target: dietTarget.calories,
      unit: "kcal",
      baseColor: intakeColor
    },
    {
      key: "protein",
      label: "蛋白",
      actual: Math.round(actualTotals.proteinG),
      target: dietTarget.proteinG,
      unit: "g",
      baseColor: "accent"
    },
    {
      key: "fat",
      label: "脂肪",
      actual: Math.round(actualTotals.fatG),
      target: dietTarget.fatG,
      unit: "g",
      baseColor: "accent2"
    },
    {
      key: "carbs",
      label: "碳水",
      actual: Math.round(actualTotals.carbsG),
      target: dietTarget.carbsG,
      unit: "g",
      baseColor: "positive"
    }
  ];
  const mealPlan = buildMealPlan(plannedPortions, customFoods);
  const actualMealPlan = buildMealPlan(adjustedActualPortions, customFoods);
  const mealRows = activeMealSlots.map(({ id, name }) => ({
    id,
    name,
    planned: mealPlan.find((meal) => meal.id === id),
    actual: actualMealPlan.find((meal) => meal.id === id),
    actualTags: buildMealFoodTags(actualMealPlan.find((meal) => meal.id === id), combinedActualMatches, foodTagEdits),
    actualText: actualMealTexts[id],
  }));
  const mealToneById: Record<MealAdjustmentKey, SemanticColor> = {
    breakfast: "positive",
    lunch: "warn",
    dinner: "accent2",
    snack: "accent",
  };
  const editingMealRow = editingMealSlot ? mealRows.find((row) => row.id === editingMealSlot) : undefined;
  const dietPlanSummary = buildDietPlanSummary(selectedDietPlan, energyPlan, today, dietPlanCycleSelection);
  const dashboardDetails = dashboardCells.map((cell) => buildDashboardMetricDetail({
    cell,
    portions: adjustedActualPortions,
    meals: actualMealPlan,
    energyPlan,
    dietTarget,
    dietPlanSummary,
    profileWeightKg: profile.weightKg,
    goalTargetWeightKg: goal.targetWeightKg,
    goalDays: goal.targetDays,
    actualTrainingCalories: actualTraining.calories,
    plannedTrainingCalories,
    actualIntake,
  }));
  const selectedDashboardDetail = dashboardDetails.find((item) => item.key === dashboardDetailKey) ?? null;
  const weekRailItems = buildHomeWeekRailItems(today);
  const mealBudgets = calculateDefaultMealBudgets(dietTarget.calories);
  const foodRecordState = resolveFoodRecordState({
    actualFoodText,
    actualIntake,
    actualMealTexts,
    recognizing: dishRecognitionBusy,
  });
  const foodRecordStateCopy = getFoodRecordStateCopy(foodRecordState);
  const mealDeltas = actualMealPlan.map((meal) => ({
    id: meal.id,
    calories: Math.round(meal.totals.calories - mealBudgets[meal.id]),
  }));
  const adjustmentSummary = useMemo(
    () => buildDailyAdjustmentSummary({
      target: dietTarget,
      actualTotals,
      actualFoodIsDelta: false,
      mealDeltas,
      plannedTrainingCalories,
      actualTrainingCalories: actualTraining.calories,
      plannedTrainingFocus,
      gender: profile.gender,
      userProfile: profile,
      goalPlan: goal,
      fatigue: actualTraining.fatigue,
      settings: dynamicAdjustmentSettings,
      atonementPreference: dynamicAtonementPreference
    }),
    [actualTotals, actualTraining.calories, actualTraining.fatigue, dietTarget, dynamicAdjustmentSettings, dynamicAtonementPreference, goal, mealDeltas, plannedTrainingCalories, plannedTrainingFocus, profile]
  );
  const hasFoodRecord = actualFoodText.trim().length > 0 || actualIntake > 0;
  const hasTrainingRecordToday = actualTraining.status !== "pending";
  const currentDebtPreview = useMemo<DailyLogEntry | null>(() => {
    if (!hasFoodRecord && !hasTrainingRecordToday) return null;
    return {
      date: todayKey,
      targetCalories: dietTarget.calories,
      targetMacros: dietTarget,
      actualIntake: actualTotals,
      actualFoodText,
      actualMealTexts,
      training: actualTraining,
      isComplete: hasFoodRecord && hasTrainingRecordToday,
      debtSnapshot: buildDebtSnapshot(adjustmentSummary)
    };
  }, [actualFoodText, actualMealTexts, actualTotals, actualTraining, adjustmentSummary, dietTarget, hasFoodRecord, hasTrainingRecordToday, todayKey]);

  useEffect(() => {
    if (!currentDebtPreview) return;
    const signature = JSON.stringify(currentDebtPreview);
    if (signature === lastSavedDailyLogSignatureRef.current) return;
    lastSavedDailyLogSignatureRef.current = signature;
    saveDailyLog(todayKey, currentDebtPreview);
  }, [currentDebtPreview, saveDailyLog, todayKey]);

  function updateActualFoods(text: string, extraFoods: Food[] = []) {
    const mergedCustomFoods = extraFoods.length > 0
      ? [...extraFoods, ...customFoods.filter((food) => !extraFoods.some((item) => item.id === food.id))]
      : customFoods;
    const result = buildActualFoodPortionsFromText(text, mergedCustomFoods, {
      dailyCalorieTarget: dietTarget.calories,
    });
    setFoodTagEdits({});
    setActualFoods(text, result.parsed.matched.map((item) => item.food.id));
  }

  function updatePreparedFoods(text: string) {
    const result = parseFoodText(text, customFoods);
    setPreparedFoods(text, result.matched.map((item) => item.food.id));
  }

  function updateActualMealFoods(meal: MealAdjustmentKey, text: string, extraFoods: Food[] = []) {
    setActualMealText(meal, text);
    const joined = activeMealSlots
      .map((slot) => (slot.id === meal ? text : actualMealTexts[slot.id]))
      .filter(Boolean)
      .join(" ");
    updateActualFoods(joined, extraFoods);
  }

  function startCustomFoodFromUnmatched(name: string) {
    setMenuName(name.trim());
    setMenuCollapsed(false);
  }

  async function searchFoodFromUnmatched(name: string) {
    const key = name.trim();
    if (!key) return;
    setOnlineFoodLookup((current) => ({ ...current, [key]: { loading: true, message: "正在联网搜索..." } }));
    const result = await searchOnlineFood(key);
    if (!result.food) {
      setOnlineFoodLookup((current) => ({ ...current, [key]: { loading: false, message: result.error ?? "未找到可用数据" } }));
      return;
    }
    addCustomFood(result.food);
    addMenuFood(result.food);
    setOnlineFoodLookup((current) => ({ ...current, [key]: { loading: false, message: "已补全到我的菜单" } }));
  }

  async function openDishImagePicker() {
    if (Platform.OS === "web") {
      dishImageInputRef.current?.click();
      return;
    }

    try {
      const asset = await pickNativeImage();
      if (!asset) return;
      await recognizeDishImageToMeal(asset.base64, asset.name);
    } catch (error) {
      setDishRecognitionMessage(error instanceof Error ? error.message : "菜品识别失败");
    }
  }

  const handleDishImageSelected = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const image = await prepareAiImageUploadFromFile(file);
      await recognizeDishImageToMeal(image.base64, image.name);
    } catch (error) {
      setDishRecognitionMessage(error instanceof Error ? error.message : "菜品识别失败");
    } finally {
      setDishRecognitionBusy(false);
      input.value = "";
    }
  };

  async function recognizeDishImageToMeal(base64: string, imageName: string) {
    setDishRecognitionBusy(true);
    setDishRecognitionMessage("正在识别菜品...");

    try {
      const result = await recognizeDishImage(base64, imageName);
      const mainCandidate = result.candidates[0];
      if (!mainCandidate) {
        setDishRecognitionMessage("未识别到有效菜品");
        return;
      }

      const recognizedFoods = resolveDishRecognitionFoods([mainCandidate], customFoods);
      recognizedFoods.forEach((food) => {
        if (food.source === "custom") {
          addCustomFood(food);
        }
        addMenuFood(food);
      });

      addActualMealImageFoods(activeDishRecognitionMeal, buildAiRecognizedMealFoods(activeDishRecognitionMeal, recognizedFoods, mainCandidate));
      setDishRecognitionMessage(`已将 ${activeMealSlots.find((slot) => slot.id === activeDishRecognitionMeal)?.name ?? "本餐"} 识别为 ${mainCandidate.name}`);
    } catch (error) {
      setDishRecognitionMessage(error instanceof Error ? error.message : "菜品识别失败");
    } finally {
      setDishRecognitionBusy(false);
    }
  }

  async function openNutritionLabelPicker() {
    if (Platform.OS === "web") {
      nutritionLabelInputRef.current?.click();
      return;
    }

    try {
      const asset = await pickNativeImage();
      if (!asset) return;
      await recognizeNutritionLabelToMenu(asset.base64, asset.name);
    } catch (error) {
      setNutritionOcrMessage(error instanceof Error ? error.message : "营养成分表识别失败");
    }
  }

  const handleNutritionLabelSelected = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const image = await prepareAiImageUploadFromFile(file);
      await recognizeNutritionLabelToMenu(image.base64, image.name);
    } catch (error) {
      setNutritionOcrMessage(error instanceof Error ? error.message : "营养成分表识别失败");
    } finally {
      input.value = "";
    }
  };

  async function recognizeNutritionLabelToMenu(base64: string, imageName: string) {
    setNutritionOcrBusy(true);
    setNutritionOcrMessage("正在识别营养成分表...");

    try {
      const result = await recognizeNutritionLabelImage(base64, imageName);
      const food = buildCustomFoodFromNutritionLabel(result.metrics);
      addCustomFood(food);
      addMenuFood(food);
      setMenuName(food.name);
      setMenuCalories(String(Math.round(food.caloriesPer100g)));
      setMenuProtein(String(food.proteinPer100g));
      setMenuFat(String(food.fatPer100g));
      setMenuCarbs(String(food.carbsPer100g));
      setMenuGram(String(food.defaultUnitGram));
      setMenuCollapsed(false);
      setNutritionOcrMessage(`已识别并保存：${food.name}`);
    } catch (error) {
      setNutritionOcrMessage(error instanceof Error ? error.message : "营养成分表识别失败");
    } finally {
      setNutritionOcrBusy(false);
    }
  }

  function saveCustomFood() {
    const name = menuName.trim();
    if (!name) return;
    const food: Food = {
      id: createCustomFoodId(),
      name,
      aliases: [],
      category: "dish",
      caloriesPer100g: numberOr(menuCalories, 120),
      proteinPer100g: numberOr(menuProtein, 6),
      fatPer100g: numberOr(menuFat, 4),
      carbsPer100g: numberOr(menuCarbs, 12),
      defaultUnitGram: numberOr(menuGram, 100),
      source: "custom",
    };
    addCustomFood(food);
    addMenuFood(food);
    setMenuName("");
    setMenuCalories("");
    setMenuProtein("");
    setMenuFat("");
    setMenuCarbs("");
    setMenuGram("100");
  }

  return (
    <Screen>
      <GlassTile glow="accent" raised padding={14} style={{ gap: 12 }}>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <BentoText weight="bold" style={{ fontSize: 26, lineHeight: 30, color: c.ink }}>
                今日饮食
              </BentoText>
              <BentoText variant="caption" color={c.inkMute}>
                估算 · 动态调整
              </BentoText>
            </View>
            <Pressable
              onPress={() => setMealCalendarOpen((value) => !value)}
            style={({ pressed }) => ({
                minHeight: 34,
                minWidth: 34,
                paddingHorizontal: 6,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.82 : 1,
              })}
            >
              <AppIcon name="calendar" size={18} color="accent" strokeWidth={2} />
            </Pressable>
          </View>
          <WeekDateRail items={weekRailItems} />

          <View style={{ flexDirection: "row", gap: 12, alignItems: "stretch" }}>
            <View style={{ width: 156, alignItems: "center", justifyContent: "center" }}>
              <View style={{ position: "relative", alignItems: "center", justifyContent: "center" }}>
                <ProgressRing
                  size={156}
                  stroke={12}
                  percent={Math.min(1, actualIntake / Math.max(1, dietTarget.calories))}
                  color="accent"
                  showLabel={false}
                />
                <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>
                  <BentoText variant="micro" color={c.inkMute}>
                    {actualIntake <= dietTarget.calories ? "还可继续" : "已超出"}
                  </BentoText>
                  <BentoText mono weight="bold" style={{ fontSize: 40, lineHeight: 42, color: c.ink }}>
                    {Math.abs(dietTarget.calories - actualIntake)}
                  </BentoText>
                  <BentoText mono color={c.inkMute} style={{ fontSize: 14, lineHeight: 16 }}>
                    kcal
                  </BentoText>
                </View>
              </View>
            </View>

            <View style={{ flex: 1, gap: 10, justifyContent: "center" }}>
              {dashboardCells.map((cell) => {
                const displayLabel = getDashboardMetricLabel(cell);
                const over = cell.actual > cell.target;
                const barColor: SemanticColor =
                  cell.key === "fat" ? "accent2" : cell.key === "carbs" ? "positive" : "accent";
                return (
                  <Pressable
                    key={cell.key}
                    onPress={() => setDashboardDetailKey(cell.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`查看${displayLabel}来源详情`}
                    style={({ pressed }) => ({
                      gap: 5,
                      borderRadius: 12,
                      paddingVertical: 3,
                      paddingHorizontal: 4,
                      opacity: pressed ? 0.78 : 1,
                      backgroundColor: pressed ? c.glass : "transparent",
                    })}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <View style={{ width: 9, height: 9, borderRadius: 999, backgroundColor: c[barColor] }} />
                        <BentoText weight="semibold" color={c.ink}>{displayLabel}</BentoText>
                      </View>
                      <BentoText mono weight="bold" color={c.ink} style={{ fontSize: 15 }}>
                        {Math.round(cell.actual)} / {Math.round(cell.target)}{cell.unit}
                      </BentoText>
                    </View>
                    <MetricCompareBar actual={cell.actual} target={cell.target} color={barColor} height={6} />
                    {over ? (
                      <BentoText variant="micro" color={c.warn}>
                        超出 {Math.round(cell.actual - cell.target)}{cell.unit}
                      </BentoText>
                    ) : (
                      <BentoText variant="micro" color={c.inkFaint}>
                        还差 {Math.round(cell.target - cell.actual)}{cell.unit}
                      </BentoText>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={() => setDashboardDetailKey("intake")}
            style={({ pressed }) => ({
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              paddingTop: 8,
              opacity: pressed ? 0.78 : 1,
            })}
          >
            <BentoText weight="semibold" color={c.inkMute}>
              查看日历记录
            </BentoText>
          </Pressable>
        </View>
      </GlassTile>
      {mealCalendarOpen ? <CalendarHistoryPanel /> : null}

      <GlassTile style={{ gap: 12 }}>
        <CardHeader
          title="饮食记录"
          collapsed={recordCollapsed}
          onToggle={() => setRecordCollapsed((value) => !value)}
          trailing={null}
        />
        {!recordCollapsed ? (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                variant={foodRecordMode === "prepared" ? "filled" : "glass"}
                color="accent"
                size="sm"
                block
                onPress={() => setFoodRecordMode("prepared")}
              >
                储备食物
              </Button>
              <Button
                variant={foodRecordMode === "actual" ? "filled" : "glass"}
                color="accent2"
                size="sm"
                block
                onPress={() => setFoodRecordMode("actual")}
              >
                实际饮食
              </Button>
            </View>
            {foodRecordMode === "actual" ? (
              <View style={{ gap: 10 }}>
                <RecordStateBanner state={foodRecordState} title={foodRecordStateCopy.title} subtitle={foodRecordStateCopy.subtitle} />
                <ActualFoodInputSection
                  text={actualFoodText}
                  onTextChange={updateActualFoods}
                  unmatched={actualFood.parsed.unmatched}
                  onAddUnmatchedFood={startCustomFoodFromUnmatched}
                  onlineFoodLookup={onlineFoodLookup}
                  onSearchUnmatchedFood={searchFoodFromUnmatched}
                />
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {activeMealSlots.map((slot) => (
                      <PillButton
                        key={slot.id}
                        label={slot.name}
                        color={activeDishRecognitionMeal === slot.id ? "accent" : "positive"}
                        onPress={() => setDishRecognitionMeal(slot.id)}
                      />
                    ))}
                  </View>
                  <Button variant="filled" color="accent2" block onPress={openDishImagePicker} disabled={dishRecognitionBusy}>
                    {dishRecognitionBusy ? "识别中..." : "AI 识别菜品"}
                  </Button>
                  <AsyncStatusBanner
                    status={dishRecognitionBusy ? "loading" : getAsyncStatusFromMessage(dishRecognitionMessage)}
                    message={dishRecognitionMessage}
                  />
                </View>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                  <TextInput
                    multiline
                    value={preparedFoodText}
                    onChangeText={updatePreparedFoods}
                    placeholder="示例：鸡蛋、米饭、鸡胸肉、青菜"
                    placeholderTextColor={c.inkFaint}
                    style={getInputStyle(c)}
                  />
                {preparedResult.unmatched.length > 0 ? (
                  <UnmatchedFoodActions
                    unmatched={preparedResult.unmatched}
                    lookup={onlineFoodLookup}
                    onManual={startCustomFoodFromUnmatched}
                    onSearch={searchFoodFromUnmatched}
                  />
                ) : null}
              </View>
            )}
          </View>
        ) : null}
      </GlassTile>

      <GlassTile style={{ gap: 12 }}>
        <CardHeader
          title={
            <View style={{ gap: 5 }}>
              <Label color={c.inkMute} variant="label">{"\u4eca\u65e5\u9910\u6b21"}</Label>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                <Badge color="accent" size="sm">{getDietDayTypeLabel(resolvedDietDay.dayType)}</Badge>
                <Badge color="positive" size="sm">{"\u76ee\u6807\u78b3\u6c34"} {Math.round(dietTarget.carbsG)}g</Badge>
              </View>
            </View>
          }
          collapsed={mealsCollapsed}
          onToggle={() => setMealsCollapsed((value) => !value)}
          onTitlePress={() => setDietPlanLogicOpen(true)}
          trailing={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Button variant="glass" color="accent2" size="sm" onPress={openDishImagePicker}>
                {dishRecognitionBusy ? "识别中..." : "AI 识别菜品"}
              </Button>
              <Button variant="glass" color="accent" size="sm" onPress={() => setCustomMealAdjustmentOpen(true)}>
                {"\u81ea\u5b9a\u4e49\u8c03\u6574"}
              </Button>
              <MealDisplaySwitch value={mealDisplayMode} onChange={setMealDisplayMode} />
            </View>
          }
        />
        {!mealsCollapsed ? (
          <View style={{ gap: 12 }}>
            {mealRows.map((row) => (
              <MealRecordCard
                key={row.id}
                slotId={row.id}
                name={row.name}
                tone={mealToneById[row.id]}
                mode={mealDisplayMode}
                planned={row.planned}
                actual={row.actual}
                actualTags={row.actualTags}
                onPressArrow={() => setEditingMealSlot(row.id)}
                onEditTag={(key, item, label, calories) => setEditingFoodTag(buildFoodTagEdit(key, item, label, calories))}
              />
            ))}
            <MealNutritionSummaryCard
              rows={mealRows}
              mode={mealDisplayMode}
            />
          </View>
        ) : null}
      </GlassTile>

      <GlassTile glow="accent" style={{ gap: 12 }}>
        <CardHeader
          title="我的菜单"
          collapsed={menuCollapsed}
          onToggle={() => setMenuCollapsed((value) => !value)}
          trailing={<BentoText mono color={c.inkMute} style={{ fontSize: 12 }}>菜单项 {menuFoods.length}</BentoText>}
        />
        {!menuCollapsed ? (
          <View style={{ gap: 8 }}>
            <TextInput value={menuName} onChangeText={setMenuName} placeholder="食物名称" placeholderTextColor={c.inkFaint} style={getInputStyle(c)} />
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <SmallInput label="千卡/100g" value={menuCalories} onChangeText={setMenuCalories} />
              <SmallInput label="蛋白/100g" value={menuProtein} onChangeText={setMenuProtein} />
              <SmallInput label="脂肪/100g" value={menuFat} onChangeText={setMenuFat} />
              <SmallInput label="碳水/100g" value={menuCarbs} onChangeText={setMenuCarbs} />
              <SmallInput label="克/份" value={menuGram} onChangeText={setMenuGram} />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button variant="filled" color="accent" block onPress={saveCustomFood}>保存到我的菜单</Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button variant="glass" color="accent" block onPress={openNutritionLabelPicker}>
                   {nutritionOcrBusy ? "识别中..." : "识别营养成分表"}
                </Button>
              </View>
            </View>
            {nutritionOcrMessage ? (
              <AsyncStatusBanner
                status={nutritionOcrBusy ? "loading" : getAsyncStatusFromMessage(nutritionOcrMessage)}
                message={nutritionOcrMessage}
              />
            ) : null}
            {menuFoods.map((food) => (
              <View key={food.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.glassBorder }}>
                <View style={{ flex: 1 }}>
                  <BentoText weight="semibold" variant="caption" color={c.ink}>{food.name}</BentoText>
                  <BentoText variant="micro" color={c.inkMute}>{Math.round(food.caloriesPer100g)} 千卡/100g</BentoText>
                </View>
                <Pressable onPress={() => { removeMenuFood(food.id); removeCustomFood(food.id); }}>
                  <BentoText variant="micro" color={c.warn}>删除</BentoText>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </GlassTile>

      {Platform.OS === "web"
        ? createElement("input", {
            ref: dishImageInputRef,
            type: "file",
            accept: "image/jpeg,image/png,image/webp",
            capture: "environment",
            onChange: handleDishImageSelected,
            style: { display: "none" },
          })
        : null}

      {Platform.OS === "web"
        ? createElement("input", {
            ref: nutritionLabelInputRef,
            type: "file",
            accept: "image/jpeg,image/png,image/webp",
            capture: "environment",
            onChange: handleNutritionLabelSelected,
            style: { display: "none" },
          })
        : null}

      <FoodTagEditorModal
        edit={editingFoodTag}
        onClose={() => setEditingFoodTag(null)}
        onSave={(next) => {
          setFoodTagEdits((state) => ({
            ...state,
            [next.key]: {
              hidden: false,
              label: next.label.trim(),
              calories: numberOr(next.calories, 0),
              grams: numberOr(next.grams, 1),
              filling: next.defaultFilling.trim(),
            },
          }));
          setEditingFoodTag(null);
        }}
        onDelete={(key) => {
          setFoodTagEdits((state) => ({
            ...state,
            [key]: { ...state[key], hidden: true },
          }));
          setEditingFoodTag(null);
        }}
      />
      <MealTextEditorModal
        visible={editingMealSlot !== null}
        mode={mealDisplayMode}
        slotId={editingMealSlot}
        meal={editingMealRow ? (mealDisplayMode === "planned" ? editingMealRow.planned : editingMealRow.actual) : undefined}
        actualTags={editingMealRow?.actualTags ?? []}
        text={editingMealSlot ? actualMealTexts[editingMealSlot] : ""}
        onChangeText={(text) => {
          if (editingMealSlot) updateActualMealFoods(editingMealSlot, text);
        }}
        onClose={() => setEditingMealSlot(null)}
      />
      <CustomMealAdjustmentModal
        visible={customMealAdjustmentOpen}
        mode={customMealAdjustmentMode}
        rows={mealRows}
        adjustment={mealPlanCustomAdjustment}
        onModeChange={setCustomMealAdjustmentMode}
        onChange={setMealPlanCustomAdjustment}
        updateLockedMeal={(mealId, locked) => {
          setMealPlanCustomAdjustment({
            ...mealPlanCustomAdjustment,
            lockedMeals: {
              ...mealPlanCustomAdjustment.lockedMeals,
              [mealId]: locked,
            },
          });
        }}
        updateFoodGrams={(mealId, foodId, grams) => {
          setMealPlanCustomAdjustment({
            ...mealPlanCustomAdjustment,
            foodGrams: {
              ...mealPlanCustomAdjustment.foodGrams,
              [`${mealId}:${foodId}`]: grams,
            },
          });
        }}
        updateMacroTarget={(mealId, key, value) => {
          setMealPlanCustomAdjustment({
            ...mealPlanCustomAdjustment,
            macroTargets: {
              ...mealPlanCustomAdjustment.macroTargets,
              [mealId]: {
                ...mealPlanCustomAdjustment.macroTargets?.[mealId],
                [key]: value,
              },
            },
          });
        }}
        macroAdjustmentItems={macroAdjustmentItems}
        onClose={() => setCustomMealAdjustmentOpen(false)}
      />
      <DietPlanLogicModal
        visible={dietPlanLogicOpen}
        summary={dietPlanSummary}
        onClose={() => setDietPlanLogicOpen(false)}
      />
      <DashboardMetricDetailModal
        detail={selectedDashboardDetail}
        onClose={() => setDashboardDetailKey(null)}
      />
    </Screen>
  );
}

function getInputStyle(c: BentoThemeColors) {
  return {
    minHeight: 56,
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: c.ink,
    fontSize: 14,
  } as const;
}

function getRecordInputStyle(c: BentoThemeColors) {
  return {
    minHeight: 28,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    color: c.ink,
    fontSize: 15,
  } as const;
}

function getDashboardMetricLabel(cell: DashboardCell): string {
  if (cell.key === "intake") return "热量";
  return cell.label;
}

function getMetricValue(totals: NutritionTotals, metricKey: string): number {
  if (metricKey === "protein") return totals.proteinG;
  if (metricKey === "fat") return totals.fatG;
  if (metricKey === "carbs") return totals.carbsG;
  return totals.calories;
}

function buildDashboardSourceGroups({
  cell,
  portions,
  meals,
  dietTarget,
}: {
  cell: DashboardCell;
  portions: FoodPortion[];
  meals: MealPlan[];
  dietTarget: NutritionTotals;
}): DashboardDetailSourceGroups {
  return {
    foodActual: buildFoodContributionSources(portions, cell.key, cell.unit),
    mealActual: buildMealContributionSources({ cell, meals, dietTarget, mode: "actual" }),
    mealTarget: buildMealContributionSources({ cell, meals, dietTarget, mode: "target" }),
    mealDiff: buildMealContributionSources({ cell, meals, dietTarget, mode: "diff" }),
  };
}

function buildMealContributionSources({
  cell,
  meals,
  dietTarget,
  mode,
}: {
  cell: DashboardCell;
  meals: MealPlan[];
  dietTarget: NutritionTotals;
  mode: DashboardDetailValueMode;
}): DashboardDetailSource[] {
  const mealBudgets = calculateDefaultMealBudgets(dietTarget.calories);
  return meals.map((meal) => {
    const actual = getMetricValue(meal.totals, cell.key);
    const calorieTarget = mealBudgets[meal.id];
    const calorieRatio = dietTarget.calories > 0 ? calorieTarget / dietTarget.calories : 0;
    const target = cell.key === "intake" ? calorieTarget : Math.round(cell.target * calorieRatio);
    const value = mode === "target" ? target : mode === "diff" ? actual - target : actual;
    return {
      name: meal.name,
      detail: mode === "actual" ? `${meal.foods.length} 项食物` : "按今日餐次预算分配",
      value: `${value > 0 && mode === "diff" ? "+" : ""}${formatDetailNumber(value)}${cell.unit}`,
    };
  });
}

function buildDashboardMetricDetail({
  cell,
  portions,
  meals,
  energyPlan,
  dietTarget,
  dietPlanSummary,
  profileWeightKg,
  goalTargetWeightKg,
  goalDays,
  actualTrainingCalories,
  plannedTrainingCalories,
  actualIntake,
}: {
  cell: DashboardCell;
  portions: FoodPortion[];
  meals: MealPlan[];
  energyPlan: EnergyPlan;
  dietTarget: EnergyPlan;
  dietPlanSummary: DietPlanSummary;
  profileWeightKg: number;
  goalTargetWeightKg: number;
  goalDays: number;
  actualTrainingCalories: number;
  plannedTrainingCalories: number;
  actualIntake: number;
}): DashboardMetricDetail {
  const label = getDashboardMetricLabel(cell);
  const targetLine = `目标 ${Math.round(cell.target)}${cell.unit}`;
  const actualLine = `实际 ${Math.round(cell.actual)}${cell.unit}`;
  const diff = Math.round(cell.actual - cell.target);
  const diffLine = diff > 0
    ? `超出 ${Math.abs(diff)}${cell.unit}`
    : `还差 ${Math.abs(diff)}${cell.unit}`;
  const diffTone: SemanticColor = diff > 0 ? "warn" : "positive";
  const foodSources = buildFoodContributionSources(portions, cell.key, cell.unit);
  const sourceGroups = buildDashboardSourceGroups({ cell, portions, meals, dietTarget });

  if (cell.key === "deficit") {
    return {
      key: cell.key,
      label,
      targetLine,
      actualLine,
      diffLine,
      diffTone,
      targetReason: `目标热量来自当前身体数据、目标周期和执行天数。系统先把脂肪能量换算成每日缺口，再对极端值做安全收敛。`,
      sourceTitle: "赤字计算",
      emptySourceLabel: "暂无饮食或训练记录。",
      sourceGroups,
      sources: [
        { name: "总消耗", detail: `基础消耗 ${Math.round(energyPlan.tdee)}kcal + 实际训练 ${Math.round(actualTrainingCalories)}kcal`, value: `+${Math.round(energyPlan.tdee + actualTrainingCalories)}kcal` },
        { name: "实际摄入", detail: "今日已识别并保留的食物标签", value: `-${Math.round(actualIntake)}kcal` },
      ],
    };
  }

  if (cell.key === "burn") {
    return {
      key: cell.key,
      label,
      targetLine,
      actualLine,
      diffLine,
      diffTone,
      targetReason: `消耗目标来自当前身体数据估算出的 TDEE。体重 ${profileWeightKg}kg 会影响基础代谢和运动消耗。`,
      sourceTitle: "消耗来源",
      emptySourceLabel: "暂无训练反馈。",
      sourceGroups,
      sources: [
        { name: "基础消耗", detail: "根据身体数据和活动水平估算", value: `${Math.round(energyPlan.tdee)}kcal` },
        { name: "今日训练", detail: `计划约 ${Math.round(plannedTrainingCalories)}kcal，实际反馈 ${Math.round(actualTrainingCalories)}kcal`, value: `${Math.round(actualTrainingCalories)}kcal` },
      ],
    };
  }

  if (cell.key === "intake") {
    return {
      key: cell.key,
      label,
      targetLine,
      actualLine,
      diffLine,
      diffTone,
      targetReason: `摄入目标来自身体数据、目标周期和已选饮食计划。系统先确定总热量，再拆分蛋白、脂肪和碳水。`,
      sourceTitle: `${label}来源`,
      emptySourceLabel: "暂无识别到实际餐食。",
      sources: foodSources,
      sourceGroups,
    };
  }

  const macroReason: Record<string, string> = {
    protein: `蛋白目标来自已选饮食计划、今日热量预算、体重 ${profileWeightKg}kg 和训练恢复需求。`,
    fat: `脂肪目标来自已选饮食计划。系统先锁定热量和蛋白，再按比例留出脂肪空间。`,
    carbs: `碳水目标来自已选饮食计划。热量、蛋白和脂肪固定后，剩余热量归入碳水。`,
  };

  return {
    key: cell.key,
    label,
    targetLine,
    actualLine,
    diffLine,
    diffTone,
    targetReason: macroReason[cell.key] ?? dietPlanSummary.logic,
    sourceTitle: `${label}来源`,
    emptySourceLabel: "暂无识别到实际餐食。",
    sources: foodSources,
    sourceGroups,
  };
}

function buildFoodContributionSources(portions: FoodPortion[], metricKey: string, unit: string): DashboardDetailSource[] {
  const mealLabels: Record<NonNullable<FoodPortion["meal"]>, string> = {
    breakfast: "早餐",
    lunch: "午餐",
    dinner: "晚餐",
    snack: "加餐",
  };
  return portions
    .map((portion) => {
      const totals = portion.totals;
      const value = metricKey === "protein"
        ? totals.proteinG
        : metricKey === "fat"
          ? totals.fatG
          : metricKey === "carbs"
            ? totals.carbsG
            : totals.calories;
      const displayAmount = (portion as FoodPortion & { displayAmount?: string }).displayAmount ?? `${Math.round(Math.abs(portion.grams))}g`;
      const mealLabel = portion.meal ? mealLabels[portion.meal] : "未分餐";
      return {
        name: `${mealLabel} · ${portion.name}`,
        detail: displayAmount,
        rawValue: value,
        value: `${formatDetailNumber(value)}${unit}`,
      };
    })
    .filter((item) => item.rawValue > 0.05)
    .sort((a, b) => b.rawValue - a.rawValue)
    .map(({ rawValue: _rawValue, ...item }) => item)
    .slice(0, 8);
}

function formatDetailNumber(value: number): string {
  if (Math.abs(value) >= 10) return String(Math.round(value));
  return String(Math.round(value * 10) / 10);
}

function DashboardMetricDetailModal({
  detail,
  onClose,
}: {
  detail: DashboardMetricDetail | null;
  onClose: () => void;
}) {
  const c = useBentoTheme().colors;
  const [valueMode, setValueMode] = useState<DashboardDetailValueMode>("actual");
  const [breakdownMode, setBreakdownMode] = useState<DashboardDetailBreakdownMode>("food");
  if (!detail) return null;
  const effectiveBreakdownMode = valueMode === "actual" ? breakdownMode : "meal";
  const activeSources = valueMode === "actual"
    ? (effectiveBreakdownMode === "food" ? detail.sourceGroups.foodActual : detail.sourceGroups.mealActual)
    : valueMode === "target"
      ? detail.sourceGroups.mealTarget
      : detail.sourceGroups.mealDiff;
  const valueModeOptions: Array<{ value: DashboardDetailValueMode; label: string }> = [
    { value: "actual", label: "实际" },
    { value: "target", label: "目标" },
    { value: "diff", label: "差额" },
  ];
  const breakdownModeOptions: Array<{ value: DashboardDetailBreakdownMode; label: string }> = [
    { value: "food", label: "按食物" },
    { value: "meal", label: "按餐次" },
  ];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "center", padding: 20 }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            alignSelf: "center",
            width: "100%",
            maxWidth: 420,
            maxHeight: "85%",
            borderRadius: 18,
            backgroundColor: c.bg,
            borderWidth: 1,
            borderColor: c.glassBorderBright,
            overflow: "hidden",
          }}
        >
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} style={{ width: "100%" }}>
            <View style={{ gap: 4 }}>
              <Label color={c.inkFaint} variant="micro">营养来源详情</Label>
              <BentoText weight="bold" color={c.ink} style={{ fontSize: 20, lineHeight: 24 }}>
                {detail.label}
              </BentoText>
            </View>

            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Badge color="accent" size="sm">{detail.actualLine}</Badge>
              <Badge color="positive" size="sm">{detail.targetLine}</Badge>
              <Badge color={detail.diffTone} size="sm">{detail.diffLine}</Badge>
            </View>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {valueModeOptions.map((option) => {
                  const active = option.value === valueMode;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setValueMode(option.value)}
                      style={({ pressed }) => ({
                        minHeight: 30,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: active ? c.accent : c.glass,
                        borderWidth: 1,
                        borderColor: active ? c.accent : c.glassBorder,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <BentoText weight="semibold" variant="micro" color={active ? c.bg : c.inkMute}>
                        {option.label}
                      </BentoText>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {breakdownModeOptions.map((option) => {
                  const disabled = valueMode !== "actual" && option.value === "food";
                  const active = option.value === effectiveBreakdownMode;
                  return (
                    <Pressable
                      key={option.value}
                      disabled={disabled}
                      onPress={() => setBreakdownMode(option.value)}
                      style={({ pressed }) => ({
                        minHeight: 28,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: active ? c.positive : c.glass,
                        borderWidth: 1,
                        borderColor: active ? c.positive : c.glassBorder,
                        opacity: disabled ? 0.35 : pressed ? 0.8 : 1,
                      })}
                    >
                      <BentoText weight="semibold" variant="micro" color={active ? c.bg : c.inkMute}>
                        {option.label}
                      </BentoText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: 6, padding: 12, borderRadius: 12, backgroundColor: c.glass, borderWidth: 1, borderColor: c.glassBorder }}>
              <BentoText weight="semibold" variant="caption" color={c.ink}>目标来源</BentoText>
              <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 18 }}>
                {detail.targetReason}
              </BentoText>
            </View>

            <View style={{ gap: 8 }}>
              <BentoText weight="semibold" variant="caption" color={c.ink}>{detail.sourceTitle}</BentoText>
              {activeSources.length > 0 ? activeSources.map((source) => (
                <View
                  key={`${source.name}-${source.detail}-${source.value}`}
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                    paddingVertical: 8,
                    borderTopWidth: 1,
                    borderTopColor: c.glassBorder,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <BentoText weight="semibold" variant="caption" color={c.ink}>{source.name}</BentoText>
                    <BentoText variant="micro" color={c.inkMute}>{source.detail}</BentoText>
                  </View>
                  <BentoText mono weight="bold" color={c.accent} style={{ fontSize: 14 }}>{source.value}</BentoText>
                </View>
              )) : (
                <BentoText variant="caption" color={c.inkFaint}>{detail.emptySourceLabel}</BentoText>
              )}
            </View>

            <Button variant="filled" color="accent" block onPress={onClose}>
              知道了
            </Button>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CardHeader({
  title,
  collapsed,
  onToggle,
  onTitlePress,
  trailing,
}: {
  title: ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  onTitlePress?: () => void;
  trailing?: ReactNode;
}) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ width: "100%", flexDirection: "row", alignItems: "center", gap: 10 }}>
      {typeof title === "string" ? (
        onTitlePress ? (
          <Pressable onPress={onTitlePress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Label color={c.inkMute} variant="label">{title}</Label>
          </Pressable>
        ) : (
          <Label color={c.inkMute} variant="label">{title}</Label>
        )
      ) : (
        onTitlePress ? (
          <Pressable onPress={onTitlePress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {title}
          </Pressable>
        ) : (
          title
        )
      )}
      <View style={{ flex: 1 }} />
      {trailing}
      <PillButton label={collapsed ? "展开" : "收起"} onPress={onToggle} color="accent" />
    </View>
  );
}

function MealDisplaySwitch({ value, onChange }: { value: MealDisplayMode; onChange: (value: MealDisplayMode) => void }) {
  const c = useBentoTheme().colors;
  const options: Array<{ value: MealDisplayMode; label: string }> = [
    { value: "planned", label: "储备食物" },
    { value: "actual", label: "实际饮食" },
  ];
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 2,
        borderRadius: 999,
        backgroundColor: c.glass,
        borderWidth: 1,
        borderColor: c.glassBorder,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({
              height: 24,
              paddingHorizontal: 9,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? c.accent : "transparent",
              opacity: pressed ? 0.82 : 1,
            })}
          >
            <BentoText weight="semibold" color={active ? c.bg : c.inkMute} style={{ fontSize: 10 }}>
              {option.label}
            </BentoText>
          </Pressable>
        );
      })}
    </View>
  );
}

function DashboardLegend() {
  const c = useBentoTheme().colors;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginLeft: "auto" }}>
      <BentoText variant="micro" color={c.inkMute}>主数值 = 实际</BentoText>
      <BentoText variant="micro" color={c.inkFaint}>目标写在进度条上方</BentoText>
    </View>
  );
}

function CustomMealAdjustmentModal({
  visible,
  onClose,
  rows,
  mode,
  onModeChange,
  adjustment,
  onChange,
  updateLockedMeal,
  updateFoodGrams,
  updateMacroTarget,
  macroAdjustmentItems,
}: {
  visible: boolean;
  onClose: () => void;
  rows: Array<{
    id: MealAdjustmentKey;
    name: string;
    planned?: MealPlan;
  }>;
  mode: "food" | "macro";
  onModeChange: (mode: "food" | "macro") => void;
  adjustment: MealPlannerAdjustments;
  onChange: (adjustment: MealPlannerAdjustments) => void;
  updateLockedMeal: (mealId: MealAdjustmentKey, locked: boolean) => void;
  updateFoodGrams: (mealId: MealAdjustmentKey, foodId: string, grams: number) => void;
  updateMacroTarget: (mealId: MealAdjustmentKey, key: MealPlannerMacroKey, value: number) => void;
  macroAdjustmentItems: (totals?: NutritionTotals) => Array<{ key: MealPlannerMacroKey; label: string; value: number; unit: string }>;
}) {
  if (!visible) return null;
  const c = useBentoTheme().colors;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(9,15,32,0.76)", justifyContent: "center", padding: 18 }}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            maxHeight: "88%",
            borderRadius: 20,
            backgroundColor: c.bg,
            borderWidth: 1,
            borderColor: c.glassBorderBright,
            padding: 14,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <BentoText weight="bold" color={c.ink} style={{ fontSize: 16, lineHeight: 20 }}>
                {"\u81ea\u5b9a\u4e49\u52a8\u6001\u8c03\u6574"}
              </BentoText>
              <BentoText variant="micro" color={c.inkMute} style={{ marginTop: 3 }}>
                {"\u9501\u5b9a\u7684\u9910\u6b21\u4e0d\u4f1a\u627f\u63a5\u5176\u4ed6\u9910\u6b21\u51cf\u5c11\u7684\u98df\u7269\u6216\u8425\u517b\u3002"}
              </BentoText>
            </View>
            <Button variant="glass" color="warn" size="sm" onPress={() => onChange({ lockedMeals: {}, foodGrams: {}, macroTargets: {} })}>
              {"\u91cd\u7f6e"}
            </Button>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button variant={mode === "food" ? "filled" : "glass"} color="accent" block onPress={() => onModeChange("food")}>
              {"\u6309\u98df\u7269"}
            </Button>
            <Button variant={mode === "macro" ? "filled" : "glass"} color="accent" block onPress={() => onModeChange("macro")}>
              {"\u6309\u8425\u517b"}
            </Button>
          </View>

          <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            {rows.map((row) => {
              const locked = Boolean(adjustment.lockedMeals?.[row.id]);
              return (
                <View key={row.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: locked ? `${c.warn}66` : c.glassBorder, backgroundColor: c.glass, padding: 10, gap: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <BentoText weight="bold" color={c.ink} style={{ fontSize: 14 }}>
                      {row.name}
                    </BentoText>
                    <Pressable
                      onPress={() => updateLockedMeal(row.id, !locked)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 10,
                        height: 28,
                        borderRadius: 999,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: locked ? `${c.warn}18` : c.bg,
                        borderWidth: 1,
                        borderColor: locked ? `${c.warn}88` : c.glassBorder,
                        opacity: pressed ? 0.78 : 1,
                      })}
                    >
                      <BentoText weight="semibold" color={locked ? c.warn : c.inkMute} style={{ fontSize: 11 }}>
                        {locked ? "\u5df2\u9501\u5b9a" : "\u9501\u5b9a"}
                      </BentoText>
                    </Pressable>
                  </View>

                  {mode === "food" ? (
                    <View style={{ gap: 8 }}>
                      {(row.planned?.foods ?? []).length > 0 ? row.planned!.foods.map((food) => {
                        const key = `${row.id}:${food.foodId}:${food.sourceIndex ?? food.name}`;
                        const overrideKey = `${row.id}:${food.foodId}`;
                        const value = adjustment.foodGrams?.[overrideKey] ?? food.grams;
                        const max = Math.max(100, food.grams * 2, value * 1.4);
                        return (
                          <AdjustmentSliderRow
                            key={key}
                            label={food.name}
                            value={value}
                            unit="g"
                            max={max}
                            step={5}
                            disabled={locked}
                            onChange={(next) => updateFoodGrams(row.id, food.foodId, next)}
                          />
                        );
                      }) : (
                        <BentoText variant="micro" color={c.inkFaint}>{"\u6682\u65e0\u53ef\u8c03\u6574\u98df\u7269"}</BentoText>
                      )}
                    </View>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {macroAdjustmentItems(row.planned?.totals).map((item) => {
                        const value = adjustment.macroTargets?.[row.id]?.[item.key] ?? item.value;
                        return (
                          <AdjustmentSliderRow
                            key={item.key}
                            label={item.label}
                            value={value}
                            unit={item.unit}
                            max={Math.max(item.value * 2, item.key === "calories" ? 300 : 80)}
                            step={item.key === "calories" ? 10 : 1}
                            disabled={locked}
                            onChange={(next) => updateMacroTarget(row.id, item.key, next)}
                          />
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <Button variant="filled" color="accent" block onPress={onClose}>
            {"\u5b8c\u6210"}
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AdjustmentSliderRow({
  label,
  value,
  unit,
  max,
  step,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const c = useBentoTheme().colors;
  const safeValue = Math.max(0, Math.min(max, value));
  return (
    <View style={{ gap: 6, opacity: disabled ? 0.45 : 1 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
        <BentoText color={c.ink} numberOfLines={1} style={{ flex: 1, fontSize: 12, lineHeight: 16 }}>
          {label}
        </BentoText>
        <BentoText mono weight="bold" color={c.accent} style={{ fontSize: 12, lineHeight: 16 }}>
          {Math.round(safeValue)}{unit}
        </BentoText>
      </View>
      {Platform.OS === "web" ? (
        createElement("input", {
          type: "range",
          min: 0,
          max: Math.round(max),
          step,
          value: Math.round(safeValue),
          disabled,
          onChange: (event: { currentTarget: { value: string } }) => onChange(Number(event.currentTarget.value)),
          style: { width: "100%", accentColor: c.accent },
        })
      ) : (
        <TextInput
          value={String(Math.round(safeValue))}
          editable={!disabled}
          keyboardType="numeric"
          onChangeText={(text) => onChange(numberOr(text, 0))}
          placeholder="0"
          placeholderTextColor={c.inkFaint}
          style={[getInputStyle(c), { minHeight: 38, paddingVertical: 6 }]}
        />
      )}
    </View>
  );
}

function macroAdjustmentItems(totals?: NutritionTotals): Array<{ key: MealPlannerMacroKey; label: string; value: number; unit: string }> {
  const value = totals ?? { calories: 0, carbsG: 0, proteinG: 0, fatG: 0 };
  return [
    { key: "calories", label: "热量", value: value.calories, unit: "kcal" },
    { key: "proteinG", label: "蛋白", value: value.proteinG, unit: "g" },
    { key: "carbsG", label: "碳水", value: value.carbsG, unit: "g" },
    { key: "fatG", label: "脂肪", value: value.fatG, unit: "g" },
  ];
}

function MealTextEditorModal({
  visible,
  mode,
  slotId,
  meal,
  actualTags,
  text,
  onChangeText,
  onClose,
}: {
  visible: boolean;
  mode: MealDisplayMode;
  slotId: MealAdjustmentKey | null;
  meal?: MealPlan;
  actualTags: MealFoodTag[];
  text: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
}) {
  const c = useBentoTheme().colors;
  if (!visible || !slotId) return null;
  const mealName = slotId === "breakfast" ? "早餐" : slotId === "lunch" ? "午餐" : slotId === "dinner" ? "晚餐" : "加餐";
  const detailFoods = (meal?.foods ?? []).map((item, index) => ({
    key: `${item.name}-${index}`,
    label: mode === "actual" ? normalizeMealTagLabel(actualTags[index]?.label, item.name) : item.name,
    calories: item.calories,
    proteinG: item.totals.proteinG,
    fatG: item.totals.fatG,
    carbsG: item.totals.carbsG,
    amountLabel: item.displayAmount ?? `${Math.round(item.grams)}g`,
  }));
  const mealTotals = meal?.totals ?? { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 };
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(9,15,32,0.72)", justifyContent: "center", padding: 18 }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            borderRadius: 20,
            backgroundColor: c.bg,
            borderWidth: 1,
            borderColor: c.glassBorderBright,
            padding: 16,
            gap: 14,
          }}
        >
          <View style={{ gap: 4 }}>
            <BentoText weight="bold" variant="caption" color={c.ink}>
              {mealName}
            </BentoText>
            <BentoText variant="micro" color={c.inkMute}>
              点击食物标签可查看或修改详情
            </BentoText>
          </View>

          <View
            style={{
              borderRadius: 16,
              padding: 12,
              gap: 8,
              backgroundColor: c.glass,
              borderWidth: 1,
              borderColor: c.glassBorder,
            }}
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {detailFoods.length > 0
                ? detailFoods.slice(0, 6).map((item) => (
                    <Badge key={item.key} color="accent" size="sm">
                      {item.label}
                    </Badge>
                  ))
                : null}
            </View>
            {detailFoods.length > 0 ? <MealNutritionTable foods={detailFoods} totals={mealTotals} /> : null}
            {mode === "actual" ? (
              <TextInput
                value={text}
                onChangeText={onChangeText}
                multiline
                placeholder="在这里输入本餐实际吃了什么"
                placeholderTextColor={c.inkFaint}
                style={{
                  minHeight: 92,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: c.glassBorder,
                  backgroundColor: c.bg,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: c.ink,
                  fontSize: 13,
                  lineHeight: 18,
                  textAlignVertical: "top",
                }}
              />
            ) : (
              <View style={{ minHeight: 92, borderRadius: 14, borderWidth: 1, borderColor: c.glassBorder, backgroundColor: c.bg, padding: 12, justifyContent: "center" }}>
              <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 18 }}>
                计划模式只展示当前餐次内容，不提供直接编辑。
              </BentoText>
              </View>
            )}
          </View>

          <Button variant="filled" color="accent" block onPress={onClose}>
            知道了
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MealNutritionSummaryCard({
  rows,
  mode,
}: {
  rows: Array<{
    id: MealAdjustmentKey;
    name: string;
    planned?: MealPlan;
    actual?: MealPlan;
  }>;
  mode: MealDisplayMode;
}) {
  const c = useBentoTheme().colors;
  const summaryRows = rows.map((row) => ({
    key: row.id,
    name: row.name,
    totals: (mode === "planned" ? row.planned : row.actual)?.totals ?? { calories: 0, carbsG: 0, proteinG: 0, fatG: 0 }
  }));
  const totals = sumNutrition(summaryRows.map((row) => row.totals));

  return (
    <GlassTile radius={bento.tileRadiusSmall} padding={0}>
      <View style={{ borderRadius: bento.tileRadiusSmall, overflow: "hidden", borderWidth: 1, borderColor: c.glassBorder }}>
        <View style={{ flexDirection: "row", paddingHorizontal: 10, paddingVertical: 8, backgroundColor: c.glass }}>
          <NutritionTableHeader label={"\u9910\u6b21"} flex={1.15} align="left" />
          <NutritionTableHeader label={"\u70ed\u91cf"} />
          <NutritionTableHeader label={"\u78b3\u6c34"} />
          <NutritionTableHeader label={"\u86cb\u767d"} />
          <NutritionTableHeader label={"\u8102\u80aa"} />
        </View>
        {summaryRows.map((row) => (
          <View key={row.key} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: c.glassBorder }}>
            <View style={{ flex: 1.15, minWidth: 0 }}>
              <BentoText weight="medium" color={c.ink} numberOfLines={1} style={{ fontSize: 12, lineHeight: 15 }}>
                {row.name}
              </BentoText>
            </View>
            <NutritionTableValue value={`${Math.round(row.totals.calories)}`} color="accent" />
            <NutritionTableValue value={`${round1(row.totals.carbsG)}g`} color="positive" />
            <NutritionTableValue value={`${round1(row.totals.proteinG)}g`} color="accent" />
            <NutritionTableValue value={`${round1(row.totals.fatG)}g`} color="accent2" />
          </View>
        ))}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.glassBorderBright, backgroundColor: c.glass }}>
          <View style={{ flex: 1.15, minWidth: 0 }}>
            <BentoText weight="bold" color={c.ink} numberOfLines={1} style={{ fontSize: 12, lineHeight: 15 }}>
              {"\u5408\u8ba1"}
            </BentoText>
          </View>
          <NutritionTableValue value={`${Math.round(totals.calories)}`} color="accent" bold />
          <NutritionTableValue value={`${round1(totals.carbsG)}g`} color="positive" bold />
          <NutritionTableValue value={`${round1(totals.proteinG)}g`} color="accent" bold />
          <NutritionTableValue value={`${round1(totals.fatG)}g`} color="accent2" bold />
        </View>
      </View>
    </GlassTile>
  );
}
function MealNutritionTable({
  foods,
  totals,
}: {
  foods: Array<{
    key: string;
    label: string;
    amountLabel: string;
    calories: number;
    carbsG: number;
    fatG: number;
    proteinG: number;
  }>;
  totals: NutritionTotals;
}) {
  const c = useBentoTheme().colors;
  return (
    <View
      style={{
        marginTop: 2,
        borderRadius: 14,
        backgroundColor: c.bg,
        borderWidth: 1,
        borderColor: c.glassBorder,
        overflow: "hidden",
      }}
    >
      <View style={{ paddingHorizontal: 10, paddingTop: 10, paddingBottom: 6 }}>
        <BentoText weight="bold" variant="caption" color={c.ink}>
          营养统计表
        </BentoText>
      </View>
      <View style={{ flexDirection: "row", paddingHorizontal: 10, paddingVertical: 7, backgroundColor: c.glass }}>
        <NutritionTableHeader label="食物" flex={1.55} align="left" />
        <NutritionTableHeader label="碳水" />
        <NutritionTableHeader label="脂肪" />
        <NutritionTableHeader label="蛋白" />
        <NutritionTableHeader label="热量" />
      </View>
      {foods.map((item) => (
        <View key={item.key} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: c.glassBorder }}>
          <View style={{ flex: 1.55, minWidth: 0, gap: 2 }}>
            <BentoText weight="medium" color={c.ink} numberOfLines={1} style={{ fontSize: 12, lineHeight: 15 }}>
              {item.label}
            </BentoText>
            <BentoText variant="micro" color={c.inkMute} numberOfLines={1} style={{ fontSize: 10, lineHeight: 12 }}>
              {item.amountLabel}
            </BentoText>
          </View>
          <NutritionTableValue value={`${round1(item.carbsG)}g`} />
          <NutritionTableValue value={`${round1(item.fatG)}g`} />
          <NutritionTableValue value={`${round1(item.proteinG)}g`} />
          <NutritionTableValue value={`${Math.round(item.calories)}`} color="accent" />
        </View>
      ))}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.glassBorderBright, backgroundColor: c.glass }}>
        <View style={{ flex: 1.55, minWidth: 0 }}>
          <BentoText weight="bold" color={c.ink} numberOfLines={1} style={{ fontSize: 12, lineHeight: 15 }}>
            本餐合计
          </BentoText>
        </View>
        <NutritionTableValue value={`${round1(totals.carbsG)}g`} color="positive" bold />
        <NutritionTableValue value={`${round1(totals.fatG)}g`} color="accent2" bold />
        <NutritionTableValue value={`${round1(totals.proteinG)}g`} color="accent" bold />
        <NutritionTableValue value={`${Math.round(totals.calories)}`} color="accent" bold />
      </View>
    </View>
  );
}

function getDietDayTypeLabel(dayType: string): string {
  if (dayType === "high-carb") return "高碳日";
  if (dayType === "medium-carb") return "中碳日";
  if (dayType === "low-carb") return "低碳日";
  if (dayType === "very-low-carb") return "极低碳日";
  if (dayType === "depletion-carb") return "断碳日";
  if (dayType === "fasting-low-calorie") return "低热量日";
  if (dayType === "normal-eating") return "正常饮食日";
  return "均衡日";
}

function NutritionTableHeader({ label, flex = 1, align = "right" }: { label: string; flex?: number; align?: "left" | "right" }) {
  const c = useBentoTheme().colors;
  return (
    <BentoText variant="micro" color={c.inkMute} style={{ flex, textAlign: align, fontSize: 10, lineHeight: 12 }}>
      {label}
    </BentoText>
  );
}

function NutritionTableValue({ value, color = "inkMute", bold = false }: { value: string; color?: SemanticColor | "inkMute"; bold?: boolean }) {
  const c = useBentoTheme().colors;
  const textColor = color === "inkMute" ? c.inkMute : c[color];
  return (
    <BentoText mono weight={bold ? "bold" : "medium"} color={textColor} numberOfLines={1} style={{ flex: 1, textAlign: "right", fontSize: 10, lineHeight: 13 }}>
      {value}
    </BentoText>
  );
}

function PillButton({ label, color, onPress }: { label: string; color: SemanticColor; onPress: () => void }) {
  const c = useBentoTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        height: 30,
        paddingHorizontal: 12,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.bg,
        borderWidth: 1,
        borderColor: c.glassBorder,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <BentoText weight="semibold" color={c[color]} style={{ fontSize: 11 }}>
        {label}
      </BentoText>
    </Pressable>
  );
}

function DietPlanLogicModal({
  visible,
  summary,
  onClose,
}: {
  visible: boolean;
  summary: DietPlanSummary;
  onClose: () => void;
}) {
  const router = useRouter();
  const c = useBentoTheme().colors;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "center", padding: 20 }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            alignSelf: "center",
            width: "100%",
            maxWidth: 420,
            maxHeight: "85%",
            borderRadius: 18,
            backgroundColor: c.bg,
            borderWidth: 1,
            borderColor: c.glassBorderBright,
            overflow: "hidden",
          }}
        >
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} style={{ width: "100%" }}>
            <View style={{ gap: 4 }}>
              <BentoText weight="bold" variant="caption" color={c.ink} style={{ flexShrink: 1, lineHeight: 18 }}>
                {summary.name} / {summary.status}
              </BentoText>
              <BentoText variant="micro" color={c.inkMute} style={{ flexShrink: 1, lineHeight: 16 }}>
                {summary.sourceLabel}
              </BentoText>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {summary.macroLabel.split(" · ").map((part) => (
                <Badge key={part.trim()} color="accent" size="sm">
                  {part.trim()}
                </Badge>
              ))}
            </View>
            <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 18 }}>
              {summary.logic}
            </BentoText>
            <View style={{ gap: 6 }}>
              <Label color={c.inkFaint} variant="micro">
                营养分配
              </Label>
              {summary.allocation.map((item) => (
                <BentoText key={item} variant="caption" color={c.ink} style={{ lineHeight: 18 }}>
                  {item}
                </BentoText>
              ))}
            </View>
            <View style={{ gap: 8, paddingTop: 4 }}>
              <Button
                variant="glass"
                color="accent"
                block
                onPress={() => {
                  onClose();
                  router.push("/diet-plan");
                }}
              >
                去看计划
              </Button>
              <Button variant="filled" color="accent" block onPress={onClose}>
                知道了
              </Button>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
function buildDietPlanSummary(
  plan: DietPlan | undefined,
  energyPlan: EnergyPlan,
  date: Date,
  selection: DietPlanCycleSelection = {},
): DietPlanSummary {
  const resolvedDay = resolveDietPlanDay(plan?.id ?? null, date, selection);
  const targets = calculateDietPlanMacroTargets(plan?.id ?? null, energyPlan, {
    date,
    dayType: resolvedDay.dayType,
    selection,
  });
  const name = plan?.name ?? "已选饮食计划";
  const logic = plan
    ? `${plan.logic} 当前规则${resolvedDay.variantName ? `（${resolvedDay.variantName}）` : "默认"}；公式：${resolvedDay.formula}`
    : "未选择长期饮食计划时，系统使用日常均衡分配：先按目标体重周期计算每日热量，再优先保证蛋白质，随后分配脂肪和碳水。";

  return {
    name,
    status: resolvedDay.status,
    sourceLabel: plan ? "来自已选饮食计划" : "默认方案",
    macroLabel: `${targets.calories} kcal · 蛋白 ${targets.proteinG}g · 脂肪 ${targets.fatG}g · 碳水 ${targets.carbsG}g`, 
    logic,
    allocation: [
      `热量：保持今日目标 ${targets.calories} kcal，不因切换方案突破总预算。`, 
      `蛋白质：${targets.proteinG}g，优先保证饱腹感和恢复。`, 
      `脂肪：${targets.fatG}g，由剩余热量回填。`, 
      `碳水：${targets.carbsG}g，${resolvedDay.status} 会影响碳水倾向。`, 
      ...resolvedDay.notes,
    ],
  };
}

function DeficitHero({
  deficit,
  target,
}: {
  deficit: number;
  target: number;
}) {
  const c = useBentoTheme().colors;
  const delta = deficit - target;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 2, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.glassBorder }}>
      <View style={{ width: 56, justifyContent: "center", gap: 3 }}>
        <BentoText variant="caption" color={c.inkMute} style={{ fontSize: 13, lineHeight: 16 }}>
          赤字
        </BentoText>
        <BentoText variant="micro" color={delta > 0 ? c.warn : c.accent}>
          {delta > 0 ? `+${Math.round(delta)} kcal` : `-${Math.round(Math.abs(delta))} kcal`}
        </BentoText>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <MetricCompareDataRow actual={deficit} target={target} unit="kcal" large />
      </View>
      <MetricDelta value={delta} />
    </View>
  );
}

function MetricMini({ metric }: { metric: DashboardMetric }) {
  const c = useBentoTheme().colors;
  const delta = metric.actual - metric.target;
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, paddingVertical: 8 }}>
      <View style={{ width: 40, justifyContent: "center" }}>
        <BentoText variant="caption" color={c.inkMute} style={{ fontSize: 12, lineHeight: 14 }}>
          {metric.label}
        </BentoText>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <MetricCompareDataRow actual={metric.actual} target={metric.target} unit={metric.unit} />
      </View>
      <MetricDelta value={delta} compact />
    </View>
  );
}

function MetricDelta({ value, compact = false }: { value: number; compact?: boolean }) {
  const c = useBentoTheme().colors;
  return (
    <BentoText
      mono
      weight="semibold"
      color={value >= 0 ? c.positive : c.warn}
      style={{ fontSize: compact ? 10 : 11, width: compact ? 34 : 52, textAlign: "right" }}
    >
      {value >= 0 ? "+" : ""}{Math.round(value)}
    </BentoText>
  );
}

function MetricCompareDataRow({
  actual,
  target,
  unit,
  large = false,
}: {
  actual: number;
  target: number;
  unit: string;
  large?: boolean;
}) {
  const c = useBentoTheme().colors;
  const delta = actual - target;
  return (
    <View style={{ gap: large ? 5 : 4 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <MetricValueRow value={actual} unit={unit} color={c.accent} large={large} />
        <BentoText mono color={delta > 0 ? c.warn : c.inkMute} style={{ fontSize: large ? 11 : 10 }}>
          目标 {Math.round(target)}{unit}
        </BentoText>
      </View>
      <MetricCompareBar actual={actual} target={target} height={large ? 7 : 6} />
    </View>
  );
}

function MetricValueRow({
  label,
  value,
  unit,
  color,
  muted = false,
  large = false,
}: {
  label?: string;
  value: number;
  unit: string;
  color: string;
  muted?: boolean;
  large?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, opacity: muted ? 0.52 : 1 }}>
      {label ? <BentoText variant="micro" color={color} style={{ width: 28 }}>{label}</BentoText> : null}
      <BentoText mono weight="bold" color={color} style={{ fontSize: large ? 28 : 18, lineHeight: large ? 30 : 20 }}>
        {Math.round(value)}
      </BentoText>
      <BentoText mono color={color} style={{ fontSize: large ? 12 : 10 }}>{unit}</BentoText>
    </View>
  );
}

function MacroRow({ metric }: { metric: DashboardMetric }) {
  const c = useBentoTheme().colors;
  const delta = metric.actual - metric.target;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <BentoText variant="caption" color={c.ink} style={{ width: 42 }}>
        {metric.label}
      </BentoText>
      <View style={{ flex: 1, gap: 4 }}>
        <MetricCompareDataRow actual={metric.actual} target={metric.target} unit={metric.unit} />
      </View>
      <MetricDelta value={delta} />
    </View>
  );
}

function ActualFoodInputSection({
  text,
  onTextChange,
  unmatched,
  onAddUnmatchedFood,
  onlineFoodLookup,
  onSearchUnmatchedFood,
}: {
  text: string;
  onTextChange: (text: string) => void;
  unmatched: string[];
  onAddUnmatchedFood: (name: string) => void;
  onlineFoodLookup: Record<string, { loading?: boolean; message?: string }>;
  onSearchUnmatchedFood: (name: string) => void;
}) {
  const c = useBentoTheme().colors;

  return (
    <View style={{ gap: 8 }}>
      <TextInput
        multiline
        value={text}
        onChangeText={onTextChange}
        placeholder="示例：鸡蛋、西红柿、黄瓜、鸡胸肉"
        placeholderTextColor={c.inkFaint}
        style={getRecordInputStyle(c)}
      />
      {unmatched.length > 0 ? (
        <UnmatchedFoodActions
          unmatched={unmatched}
          lookup={onlineFoodLookup}
          onManual={onAddUnmatchedFood}
          onSearch={onSearchUnmatchedFood}
        />
      ) : null}
    </View>
  );
}

function RecordStateBanner({
  state,
  title,
  subtitle,
}: {
  state: "empty" | "recognizing" | "recorded";
  title: string;
  subtitle: string;
}) {
  const c = useBentoTheme().colors;
  const color = state === "empty" ? c.inkMute : state === "recognizing" ? c.accent2 : c.positive;
  return (
    <View
      style={{
        borderRadius: 14,
        padding: 10,
        gap: 4,
        backgroundColor: `${color}12`, 
        borderWidth: 1,
        borderColor: `${color}44`, 
      }}
    >
      <BentoText weight="bold" variant="caption" color={color}>
        {title}
      </BentoText>
      <BentoText variant="micro" color={c.inkMute} style={{ lineHeight: 16 }}>
        {subtitle}
      </BentoText>
    </View>
  );
}

function getAsyncStatusFromMessage(message: string): "idle" | "loading" | "success" | "error" {
  if (!message) return "idle";
  if (message.includes("running") || message.includes("searching")) return "loading";
  if (message.includes("failed") || message.includes("unrecognized") || message.includes("not found") || message.includes("need")) return "error";
  return "success";
}

function UnmatchedFoodActions({
  unmatched,
  lookup,
  onManual,
  onSearch,
}: {
  unmatched: string[];
  lookup: Record<string, { loading?: boolean; message?: string }>;
  onManual: (name: string) => void;
  onSearch: (name: string) => void;
}) {
  const c = useBentoTheme().colors;
  const visibleUnmatched = unmatched.filter((name) => !isNoiseFoodToken(name));
  if (visibleUnmatched.length === 0) return null;
  return (
    <View style={{ gap: 6 }}>
      <BentoText variant="caption" color={c.warn}>Unrecognized food: {visibleUnmatched.join(", ")}</BentoText>
      <View style={{ gap: 6 }}>
        {visibleUnmatched.map((name) => {
          const state = lookup[name];
          return (
            <View key={name} style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <PillButton label={`手动补充 ${name}`} color="warn" onPress={() => onManual(name)} />
              <PillButton label={state?.loading ? "搜索中..." : "联网补全"} color="accent2" onPress={() => onSearch(name)} />
              {state?.message ? <BentoText variant="micro" color={c.inkMute}>{state.message}</BentoText> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function isNoiseFoodToken(value: string): boolean {
  const text = value.trim();
  if (!text) return true;
  return /^\d+(?:\.\d+)?\s*(?:kcal|千卡|cal|千焦|kj)$/i.test(text);
}

function buildAiRecognizedMealFoods(
  meal: MealAdjustmentKey,
  foods: Food[],
  candidate: DishRecognitionCandidate
): AiRecognizedMealFood[] {
  const now = new Date().toISOString();
  return foods.map((food, index) => {
    const grams = Math.max(1, food.defaultUnitGram);
    const totals = calculateFoodTotals(food, grams);
    return {
      key: `ai-${meal}-${food.id}-${Date.now()}-${index}`,
      meal,
      foodId: food.id,
      foodName: food.name,
      grams,
      displayAmount: `${Math.round(grams)}g`,
      calories: Math.round(totals.calories),
      candidateName: candidate.name,
      imageConfidence: candidate.confidence,
      source: candidate.source,
      createdAt: now
    };
  });
}

function buildAiImageFoodMatches(
  mealFoods: Record<MealAdjustmentKey, AiRecognizedMealFood[]>,
  customFoods: Food[]
): FoodTagMatch[] {
  return mealSlots.flatMap((slot) =>
    mealFoods[slot.id].flatMap((item) => {
      const food = getFoodByIdFromCatalog(item.foodId, customFoods);
      if (!food) return [];
      return [{
        input: item.candidateName,
        food,
        grams: item.grams,
        displayAmount: item.displayAmount,
        meal: item.meal,
        confidence: item.imageConfidence,
        needsDetails: true,
        detailHint: "图片识别结果，建议确认重量"
      }];
    })
  );
}

function buildAiImageFoodPortions(matches: FoodTagMatch[], startIndex: number): ActualFoodPortionWithMeta[] {
  return matches.map((match, index) => {
    const resolution = resolveFoodNutrition({
      food: match.food,
      grams: match.grams,
      rawText: match.input,
    });
    return {
      foodId: match.food.id,
      name: match.food.name,
      grams: match.grams,
      meal: match.meal && match.meal !== "unknown" ? match.meal : undefined,
      displayAmount: match.displayAmount,
      sourceIndex: startIndex + index,
      totals: resolution.totals,
    };
  });
}

function buildFoodTagEdit(key: string, item: FoodTagMatch, label: string, calories: string): FoodTagEdit {
  const variantContext = {
    inputText: item.input,
    grams: item.grams,
    quantity: item.quantity,
    unit: item.unit
  };
  const resolution = resolveFoodNutrition({
    food: item.food,
    grams: item.grams,
    rawText: item.input,
    quantity: item.quantity,
    unit: item.unit,
  });
  const defaultFilling = inferDefaultFoodVariant(item.food, variantContext);
  const caloriesNumber = numberOr(calories, resolution.totals.calories);
  const quantity = item.quantity && item.quantity > 0 ? item.quantity : undefined;
  return {
    key,
    label,
    calories: String(caloriesNumber),
    grams: String(Math.round(item.grams)),
    foodName: item.food.name,
    foodId: item.food.id,
    foodCategory: item.food.category,
    defaultFilling,
    unitCalories: quantity
      ? Math.round(resolution.totals.calories / quantity)
      : Math.round(calculateFoodTotals(resolution.resolvedFood, item.food.defaultUnitGram).calories),
    caloriesPer100g: resolution.resolvedFood.caloriesPer100g,
    proteinPer100g: resolution.resolvedFood.proteinPer100g,
    fatPer100g: resolution.resolvedFood.fatPer100g,
    carbsPer100g: resolution.resolvedFood.carbsPer100g,
    inputText: item.input,
    displayAmount: item.displayAmount,
    quantity,
    unit: item.unit
  };
}

function applyFoodTagOverrides(portions: FoodPortion[], matched: FoodTagMatch[], edits: Record<string, FoodTagOverride>): FoodPortion[] {
  return portions.flatMap((portion, index) => {
    const key = `${portion.foodId}-${index}`;
    const edit = edits[key];
    if (edit?.hidden) return [];
    if (!edit || (!edit.calories && !edit.grams && !edit.label && !edit.filling)) return [portion];

    const match = matched[index];
    const food = match ? resolveFoodByVariant(match.food, edit.filling) : undefined;
    const grams = edit.grams ?? Math.abs(portion.grams);
    const calculatedTotals = food ? calculateFoodTotals(food, grams) : portion.totals;
    const calories = edit.calories ?? calculatedTotals.calories;
    const scale = calculatedTotals.calories > 0 ? calories / calculatedTotals.calories : 1;

    return [{
      ...portion,
      name: edit.label?.trim() || portion.name,
      grams: portion.grams < 0 ? -grams : grams,
      displayAmount: edit.grams ? `${Math.round(grams)}g` : (portion as FoodPortion & { displayAmount?: string }).displayAmount,
      totals: {
        calories: Math.round(calories),
        proteinG: round1(calculatedTotals.proteinG * scale),
        fatG: round1(calculatedTotals.fatG * scale),
        carbsG: round1(calculatedTotals.carbsG * scale)
      }
    } as FoodPortion & { displayAmount?: string }];
  });
}

function buildMealFoodTags(meal: MealPlan | undefined, matched: FoodTagMatch[], edits: Record<string, FoodTagOverride>): MealFoodTag[] {
  if (!meal) return [];
  return meal.foods.flatMap((food, fallbackIndex) => {
    const sourceIndex = typeof food.sourceIndex === "number" ? food.sourceIndex : fallbackIndex;
    const match = matched[sourceIndex];
    const key = match ? `${match.food.id}-${sourceIndex}` : `${food.name}-${sourceIndex}`;
    const edit = edits[key];
    if (edit?.hidden) return [];

    const label = normalizeMealTagLabel(edit?.label, food.name);
    return [{
      key,
      label,
      calories: edit?.calories ?? food.calories,
      needsDetails: Boolean(match?.needsDetails && !edit),
      match,
    }];
  });
}

function normalizeMealTagLabel(label: string | undefined, fallback: string): string {
  const raw = (label ?? "").trim();
  if (!raw) return fallback;
  const stripped = raw
    .replace(
      /^\s*\d+(?:\.\d+)?\s*(?:g|kg|mg|ml|l|克|千克|毫升|斤|份|个|杯|碗|袋|块|片|只|勺|瓶|盘|盒|包|串|根|条|粒|枚)\s*/i,
      ""
    )
    .replace(/\s*\d+(?:\.\d+)?\s*(?:kcal|千卡|卡路里|cal|千焦|kj)\b/gi, " ")
    .replace(/[?？]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!stripped) return fallback;
  if (!/[\u4e00-\u9fa5]/.test(stripped)) return fallback;
  if (/[0-9]|kcal|千卡|卡路里|kj|g|kg|ml|l/i.test(stripped)) return fallback;
  return stripped;
}

function FoodTagEditorModal({
  edit,
  onClose,
  onSave,
  onDelete,
}: {
  edit: FoodTagEdit | null;
  onClose: () => void;
  onSave: (next: FoodTagEdit) => void;
  onDelete: (key: string) => void;
}) {
  const c = useBentoTheme().colors;
  const [label, setLabel] = useState(edit?.label ?? "");
  const [calories, setCalories] = useState(edit?.calories ?? "");
  const [grams, setGrams] = useState(edit?.grams ?? "");
  const [filling, setFilling] = useState(edit?.defaultFilling ?? "");
  const [caloriesTouched, setCaloriesTouched] = useState(false);
  const [resolvedNutrition, setResolvedNutrition] = useState(() => edit
    ? resolveFoodNutrition({
        food: {
          id: edit.foodId,
          name: edit.foodName,
          aliases: [],
          category: edit.foodCategory,
          caloriesPer100g: edit.caloriesPer100g,
          proteinPer100g: edit.proteinPer100g,
          fatPer100g: edit.fatPer100g,
          carbsPer100g: edit.carbsPer100g,
          defaultUnitGram: numberOr(edit.grams, 100),
        },
        grams: numberOr(edit.grams, 100),
        rawText: edit.inputText,
        quantity: edit.quantity,
        unit: edit.unit,
        selectedVariantLabel: edit.defaultFilling,
      })
    : undefined);

  useEffect(() => {
    if (!edit) return;
    setLabel(edit.label);
    setCalories(edit.calories);
    setGrams(edit.grams);
    setFilling(edit.defaultFilling);
    setCaloriesTouched(false);
    setResolvedNutrition(resolveFoodNutrition({
      food: {
        id: edit.foodId,
        name: edit.foodName,
        aliases: [],
        category: edit.foodCategory,
        caloriesPer100g: edit.caloriesPer100g,
        proteinPer100g: edit.proteinPer100g,
        fatPer100g: edit.fatPer100g,
        carbsPer100g: edit.carbsPer100g,
        defaultUnitGram: numberOr(edit.grams, 100),
      },
      grams: numberOr(edit.grams, 100),
      rawText: edit.inputText,
      quantity: edit.quantity,
      unit: edit.unit,
      selectedVariantLabel: edit.defaultFilling,
    }));
  }, [edit]);

  useEffect(() => {
    if (!edit || caloriesTouched) return;
    setResolvedNutrition(resolveFoodNutrition({
      food: {
        id: edit.foodId,
        name: edit.foodName,
        aliases: [],
        category: edit.foodCategory,
        caloriesPer100g: edit.caloriesPer100g,
        proteinPer100g: edit.proteinPer100g,
        fatPer100g: edit.fatPer100g,
        carbsPer100g: edit.carbsPer100g,
        defaultUnitGram: numberOr(edit.grams, 100),
      },
      grams: numberOr(grams, numberOr(edit.grams, 1)),
      rawText: edit.inputText,
      quantity: edit.quantity,
      unit: edit.unit,
      selectedVariantLabel: filling,
    }));
  }, [caloriesTouched, edit, filling, grams]);

  if (!edit) return null;

  const currentGrams = numberOr(grams, numberOr(edit.grams, 1));
  const calculatedCalories = resolvedNutrition?.totals.calories ?? numberOr(calories, 0);
  const nutritionTotals = resolvedNutrition?.totals ?? { calories: calculatedCalories, proteinG: 0, fatG: 0, carbsG: 0 };
  const finalCalories = numberOr(calories, calculatedCalories);
  const quantityLabel = edit.quantity ? `${edit.quantity}${edit.unit ?? ""}` : edit.displayAmount ?? `${Math.round(currentGrams)}g`;
  const fillingOptions = resolvedNutrition?.variantOptions ?? [];
  const variantGroupLabel = resolvedNutrition?.ontology.dimensions[0]?.label ?? getFoodVariantGroupLabel({
    id: edit.foodId,
    name: edit.foodName,
    aliases: [],
    category: edit.foodCategory
  }, { inputText: edit.inputText, grams: currentGrams, quantity: edit.quantity, unit: edit.unit });
  const selectedFilling = fillingOptions.find((option) => option.label === filling);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.28)", justifyContent: "center", padding: 20 }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ borderRadius: 18, backgroundColor: c.bg, borderWidth: 1, borderColor: c.glassBorderBright, padding: 16, gap: 14 }}>
          <View style={{ gap: 4 }}>
              <BentoText weight="bold" variant="caption" color={c.ink}>食物标签详情</BentoText>
              <BentoText variant="micro" color={c.inkMute}>识别出 {quantityLabel} {edit.foodName}，可调整类型和重量让估算更接近实际。</BentoText>
          </View>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <BentoText weight="bold" variant="caption" color={c.ink}>1. 细分类型</BentoText>
              <BentoText variant="micro" color={c.inkMute}>{variantGroupLabel}</BentoText>
            </View>
            {fillingOptions.length > 0 ? (
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {fillingOptions.map((option) => {
                  const active = option.label === filling;
                  return (
                    <Pressable
                      key={option.label}
                      onPress={() => { setFilling(option.label); setCaloriesTouched(false); }}
                      style={({ pressed }) => ({
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        borderRadius: 14,
                        backgroundColor: active ? c.accent : c.glass,
                        borderWidth: 1,
                        borderColor: active ? c.accent : c.glassBorderBright,
                        opacity: pressed ? 0.82 : 1,
                      })}
                    >
                      <BentoText weight="semibold" variant="caption" color={active ? "#FFFFFF" : c.ink}>
                        {option.label}
                      </BentoText>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <TextInput value={filling} onChangeText={(text) => { setFilling(text); setCaloriesTouched(false); }} placeholder={`默认细分${variantGroupLabel ? ` (${variantGroupLabel})` : ""}`} placeholderTextColor={c.inkFaint} style={getInputStyle(c)} />
            )}
            {selectedFilling ? (
              <BentoText variant="micro" color={c.inkMute} numberOfLines={2}>{selectedFilling.hint}</BentoText>
            ) : null}
          </View>

          <View style={{ gap: 6 }}>
            <BentoText weight="bold" variant="caption" color={c.ink}>2. 重量</BentoText>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <TextInput
                value={grams}
                onChangeText={(text) => { setGrams(text); setCaloriesTouched(false); }}
                keyboardType="numeric"
                placeholder="输入重量"
                placeholderTextColor={c.inkFaint}
                style={[getInputStyle(c), { flex: 1, minHeight: 50 }]}
              />
              <BentoText weight="bold" variant="caption" color={c.inkMute}>g</BentoText>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8, padding: 10, borderRadius: 12, backgroundColor: c.glass, borderWidth: 1, borderColor: c.glassBorder }}>
            <View style={{ flex: 1 }}>
          <BentoText variant="micro" color={c.inkMute}>估算热量</BentoText>
              <BentoText mono weight="bold" variant="h3" color={c.accent}>{finalCalories}</BentoText>
            </View>
            <View style={{ flex: 1 }}>
          <BentoText variant="micro" color={c.inkMute}>蛋白 / 脂肪 / 碳水</BentoText>
              <BentoText variant="caption" color={c.ink}>{round1(nutritionTotals.proteinG)} / {round1(nutritionTotals.fatG)} / {round1(nutritionTotals.carbsG)}g</BentoText>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button variant="glass" color="warn" block onPress={() => onDelete(edit.key)}>删除</Button>
            <Button variant="filled" color="accent" block onPress={() => onSave({ ...edit, label, calories, grams, defaultFilling: filling })}>保存并同步</Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MealCompareRow({
  name,
  mode,
  planned,
  actual,
  actualTags,
  actualText,
  onActualTextChange,
  onEditTag,
}: {
  name: string;
  mode: MealDisplayMode;
  planned?: MealPlan;
  actual?: MealPlan;
  actualTags: MealFoodTag[];
  actualText: string;
  onActualTextChange: (text: string) => void;
  onEditTag: (key: string, item: FoodTagMatch, label: string, calories: string) => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <GlassTile radius={bento.tileRadiusSmall} padding={10}>
      <View style={{ flexDirection: "row", alignItems: "stretch", gap: 10 }}>
        <View style={{ width: 44, justifyContent: "center", paddingRight: 2 }}>
          <BentoText weight="bold" variant="caption" color={c.ink}>{name}</BentoText>
        </View>
        <View style={{ flex: 1 }}>
          {mode === "planned" ? (
            <MealColumn meal={planned} />
          ) : (
            <MealActualColumn meal={actual} tags={actualTags} text={actualText} onChangeText={onActualTextChange} onEditTag={onEditTag} />
          )}
        </View>
      </View>
    </GlassTile>
  );
}

function MealColumn({ meal }: { meal?: MealPlan }) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <BentoText variant="caption" color={c.inkMute}>{formatMealFoods(meal)}</BentoText>
    </View>
  );
}

function MealActualColumn({
  meal,
  tags,
  text,
  onChangeText,
  onEditTag,
}: {
  meal?: MealPlan;
  tags: MealFoodTag[];
  text: string;
  onChangeText: (text: string) => void;
  onEditTag: (key: string, item: FoodTagMatch, label: string, calories: string) => void;
}) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ flex: 1, gap: 5 }}>
      {tags.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {tags.map((tag) => (
            <FoodMealTagBadge key={tag.key} tag={tag} onPress={tag.match ? () => onEditTag(tag.key, tag.match!, tag.label, String(Math.round(tag.calories))) : undefined} />
          ))}
        </View>
      ) : (
        <BentoText variant="caption" color={meal?.foods.length ? c.inkMute : c.inkFaint}>
          {formatMealFoods(meal)}
        </BentoText>
      )}
      <TextInput
        value={text}
        onChangeText={onChangeText}
        placeholder=""
        placeholderTextColor={c.inkFaint}
        style={{
          minHeight: 28,
          backgroundColor: "transparent",
          borderWidth: 0,
          paddingHorizontal: 0,
          paddingVertical: 4,
          color: c.ink,
          fontSize: 12
        }}
      />
    </View>
  );
}

function FoodMealTagBadge({ tag, onPress }: { tag: MealFoodTag; onPress?: () => void }) {
  const c = useBentoTheme().colors;
  const content = (
    <Badge color="accent" size="sm">
      {tag.label}
      {tag.needsDetails ? <BentoText weight="bold" color={c.warn} style={{ fontSize: 12 }}>{" ?"}</BentoText> : null}
    </Badge>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
      {content}
    </Pressable>
  );
}

function formatMealFoods(meal?: MealPlan): string {
  if (!meal || meal.foods.length === 0) return "-";
  return meal.foods.map((item) => `${item.name} ${item.displayAmount ?? item.grams + "g"}`).join(", ");
}

function SmallInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (text: string) => void }) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ flex: 1, minWidth: 86, gap: 4 }}>
      <BentoText variant="micro" color={c.inkMute}>{label}</BentoText>
      <TextInput keyboardType="numeric" value={value} onChangeText={onChangeText} placeholder="0" placeholderTextColor={c.inkFaint} style={[getInputStyle(c), { minHeight: 42, paddingVertical: 8 }]} />
    </View>
  );
}

function numberOr(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function pickNativeImage(): Promise<{ base64: string; name: string } | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    base64: true,
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const image = prepareAiImageUploadFromBase64Asset(asset);
  return { base64: image.base64, name: image.name };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function createCustomFoodId(): string {
  const randomUUID = globalThis.crypto?.randomUUID?.();
  if (randomUUID) return `custom-${randomUUID}`;
  return `custom-${Math.random().toString(36).slice(2)}-${new Date().getTime().toString(36)}`;
}

function AdjustmentSummaryInline({ summary }: { summary: ReturnType<typeof buildDailyAdjustmentSummary> }) {
  const c = useBentoTheme().colors;
  const color: SemanticColor = summary.netDelta > 0 ? "warn" : "positive";
  return (
    <View style={{ marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.glassBorder, gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <BentoText variant="micro" color={c.inkMute}>动态调整</BentoText>
          <BentoText weight="semibold" variant="caption" color={c[color]} numberOfLines={1}>
            {summary.title}
          </BentoText>
        </View>
        <Badge color={color} size="sm">
          {summary.netDelta >= 0 ? "+" : ""}{summary.netDelta} kcal
        </Badge>
      </View>
      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        <Badge color="accent" size="sm">分档 {summary.days} 天</Badge>
        <Badge color="positive" size="sm">新目标 {summary.adjustedDailyCalories} kcal/天</Badge>
        <Badge color="accent2" size="sm">{Math.round(summary.adjustedMacros.proteinG)}g</Badge>
      </View>
      {summary.warning ? (
        <BentoText variant="micro" color={c.warn} style={{ lineHeight: 16 }}>
          {summary.warning}
        </BentoText>
      ) : null}
    </View>
  );
}

function hasTrainingRecord(status: string): boolean {
  return status !== "pending";
}

function formatDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatHeroDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()} ${formatHeroWeekday(date)}`;
}

function formatHeroWeekday(date: Date): string {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
}

function buildHomeWeekRailItems(anchor: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const offset = index - 3;
    const next = new Date(anchor);
    next.setDate(anchor.getDate() + offset);
    return {
      key: formatDateKey(next),
      dateLabel: String(next.getDate()),
      weekdayLabel: formatHeroWeekday(next),
      active: offset === 0,
    };
  });
}
