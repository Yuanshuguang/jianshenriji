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
  type NutritionTotals,
} from "@fitness-calendar/shared";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { createElement, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Modal, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { CalendarHistoryPanel } from "../../components/CalendarHistoryPanel";
import {
  Badge,
  Button,
  GlassTile,
  Label,
  ProgressBar,
  Screen,
  ScreenHeader,
  Text as BentoText,
  bento,
  colors,
  radius,
  type SemanticColor,
  useBentoTheme,
  type BentoThemeColors,
} from "../../components/bento";
import {
  buildActualFoodPortionsFromText,
  buildMealPlan,
  estimateTodayWorkoutCalories,
  parseFoodText,
  type MealPlan,
} from "../../features/today-plan";
import { buildDailyAdjustmentSummary } from "../../features/adjustments";
import { getDietPlanById, type DietPlan } from "../../features/diet-plans";
import { getFoodVariantGroupLabel, getFoodVariantOptions, inferDefaultFoodVariant, resolveFoodByVariant } from "../../features/food-variant-options";
import { searchOnlineFood } from "../../features/food-online-search";
import { buildTrainingQueue, useCurrentEnergyPlan, useFitnessStore } from "../../store/fitness-store";
import { DashboardGrid, type DashboardCell } from "../../components/diet/DashboardGrid";
import { resolveFoodNutrition } from "../../features/food-nutrition-resolver";
import { recognizeDishImage, resolveDishRecognitionFoods } from "../../features/food-image-recognition";
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

type DashboardMetricDetail = {
  key: string;
  label: string;
  targetLine: string;
  targetReason: string;
  actualLine: string;
  sourceTitle: string;
  emptySourceLabel: string;
  sources: DashboardDetailSource[];
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
  confidence?: number;
  needsDetails?: boolean;
  detailHint?: string;
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
  const customFoods = useFitnessStore((state) => state.customFoods);
  const menuFoods = useFitnessStore((state) => state.menuFoods);
  const actualTraining = useFitnessStore((state) => state.actualTraining);
  const profile = useFitnessStore((state) => state.profile);
  const goal = useFitnessStore((state) => state.goal);
  const trainingPreference = useFitnessStore((state) => state.trainingPreference);
  const todayTrainingPlan = useFitnessStore((state) => state.todayTrainingPlan);
  const dynamicAdjustmentEnabled = useFitnessStore((state) => state.dynamicAdjustmentEnabled);
  const dynamicAdjustmentSettings = useFitnessStore((state) => state.dynamicAdjustmentSettings);
  const selectedDietPlanId = useFitnessStore((state) => state.selectedDietPlanId);
  const selectedDietPlanVariantId = useFitnessStore((state) => state.selectedDietPlanVariantId);
  const setPreparedFoods = useFitnessStore((state) => state.setPreparedFoods);
  const setActualFoods = useFitnessStore((state) => state.setActualFoods);
  const setActualMealText = useFitnessStore((state) => state.setActualMealText);
  const addCustomFood = useFitnessStore((state) => state.addCustomFood);
  const removeCustomFood = useFitnessStore((state) => state.removeCustomFood);
  const addMenuFood = useFitnessStore((state) => state.addMenuFood);
  const removeMenuFood = useFitnessStore((state) => state.removeMenuFood);
  const saveDailyLog = useFitnessStore((state) => state.saveDailyLog);
  const dashboardStyle = useFitnessStore((state) => state.dashboardStyle);

  const [dashboardCollapsed, setDashboardCollapsed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [recordCollapsed, setRecordCollapsed] = useState(false);
  const [mealsCollapsed, setMealsCollapsed] = useState(true);
  const [mealCalendarOpen, setMealCalendarOpen] = useState(false);
  const [menuCollapsed, setMenuCollapsed] = useState(true);
  const [foodRecordMode, setFoodRecordMode] = useState<FoodRecordMode>("actual");
  const [mealDisplayMode, setMealDisplayMode] = useState<MealDisplayMode>("planned");
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
  const [dietPlanLogicOpen, setDietPlanLogicOpen] = useState(false);
  const [dashboardDetailKey, setDashboardDetailKey] = useState<string | null>(null);
  const [onlineFoodLookup, setOnlineFoodLookup] = useState<Record<string, { loading?: boolean; message?: string }>>({});
  const dishImageInputRef = useRef<HTMLInputElement | null>(null);
  const nutritionLabelInputRef = useRef<HTMLInputElement | null>(null);

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
  const plannedPortions = recommendMacroAwarePortions(selectedFoods, dietTarget);
  const plannedTotals = sumNutrition(plannedPortions.map((portion) => portion.totals));
  const preparedResult = parseFoodText(preparedFoodText, customFoods);
  const actualFood = buildActualFoodPortionsFromText(actualFoodText, customFoods, {
    dailyCalorieTarget: dietTarget.calories,
  });
  const adjustedActualPortions = applyFoodTagOverrides(actualFood.portions, actualFood.parsed.matched, foodTagEdits);
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
      label: "摄入热量",
      actual: actualIntake,
      target: dietTarget.calories,
      unit: "kcal",
      baseColor: intakeColor
    },
    {
      key: "protein",
      label: "蛋白质",
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
  const mealRows = mealSlots.map(({ id, name }) => ({
    id,
    name,
    planned: mealPlan.find((meal) => meal.id === id),
    actual: actualMealPlan.find((meal) => meal.id === id),
    actualTags: buildMealFoodTags(actualMealPlan.find((meal) => meal.id === id), actualFood.parsed.matched, foodTagEdits),
    actualText: actualMealTexts[id],
  }));
  const dietPlanSummary = buildDietPlanSummary(selectedDietPlan, energyPlan, today, dietPlanCycleSelection);
  const dashboardDetails = dashboardCells.map((cell) => buildDashboardMetricDetail({
    cell,
    portions: adjustedActualPortions,
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
  const mealBudgets = calculateDefaultMealBudgets(dietTarget.calories);
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
      settings: dynamicAdjustmentSettings
    }),
    [actualTotals, actualTraining.calories, actualTraining.fatigue, dietTarget, dynamicAdjustmentSettings, goal, mealDeltas, plannedTrainingCalories, plannedTrainingFocus, profile]
  );

  useEffect(() => {
    const hasFoodRecord = actualFoodText.trim().length > 0 || actualIntake > 0;
    const hasTrainingRecord = actualTraining.status !== "pending";
    if (!hasFoodRecord && !hasTrainingRecord) return;

    const entry: DailyLogEntry = {
      date: todayKey,
      targetCalories: dietTarget.calories,
      actualIntake: actualTotals,
      actualFoodText,
      actualMealTexts,
      training: actualTraining,
      isComplete: hasFoodRecord && hasTrainingRecord
    };
    saveDailyLog(todayKey, entry);
  }, [actualFoodText, actualIntake, actualMealTexts, actualTotals, actualTraining, dietTarget.calories, saveDailyLog, todayKey]);

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
    const joined = mealSlots
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
    setOnlineFoodLookup((current) => ({ ...current, [key]: { loading: true, message: "联网搜索中..." } }));
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

      updateActualMealFoods(dishRecognitionMeal, mainCandidate.name, recognizedFoods);
      setDishRecognitionMessage(`已识别并写入 ${mealSlots.find((slot) => slot.id === dishRecognitionMeal)?.name ?? "餐次"}：${mainCandidate.name}`);
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
      setNutritionOcrMessage(error instanceof Error ? error.message : "营养表识别失败");
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
      setNutritionOcrMessage(error instanceof Error ? error.message : "营养表识别失败");
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

  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 · 今日 · 历史`;

  return (
    <Screen>
      <ScreenHeader
        kicker={dateStr}
        onKickerPress={() => setMealCalendarOpen((value) => !value)}
        title=""
        subtitle=""
        badge={{ text: "离线", color: "positive" }}
      />
      {mealCalendarOpen ? <CalendarHistoryPanel /> : null}

      <GlassTile glow={intakeColor} padding={12} style={{ gap: 10 }}>
        <CardHeader
          title="今日饮食"
          collapsed={dashboardCollapsed}
          onToggle={() => setDashboardCollapsed((value) => !value)}
          trailing={dashboardCollapsed ? null : <DashboardLegend />}
        />
        {!dashboardCollapsed ? (
          <View style={{ gap: 8 }}>
            <DashboardGrid
              style={dashboardStyle}
              metrics={dashboardCells}
              onMetricPress={(cell) => setDashboardDetailKey(cell.key)}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
              <PillButton label="更换样式" onPress={() => router.push("/more")} color="accent" />
            </View>
          </View>
        ) : null}
      </GlassTile>

      {dynamicAdjustmentEnabled && (actualIntake > 0 || hasTrainingRecord(actualTraining.status)) ? (
        <AdjustmentSummaryCard summary={adjustmentSummary} />
      ) : null}

      <GlassTile style={{ gap: 12 }}>
        <CardHeader
          title="饮食记录"
          collapsed={recordCollapsed}
          onToggle={() => setRecordCollapsed((value) => !value)}
          trailing={<BentoText mono color={c.inkMute} style={{ fontSize: 12 }}>{actualIntake} kcal</BentoText>}
        />
        {!recordCollapsed ? (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button variant={foodRecordMode === "prepared" ? "filled" : "glass"} color="accent" size="sm" block onPress={() => setFoodRecordMode("prepared")}>
                准备吃什么
              </Button>
              <Button variant={foodRecordMode === "actual" ? "filled" : "glass"} color="accent2" size="sm" block onPress={() => setFoodRecordMode("actual")}>
                实际吃了什么
              </Button>
            </View>
            {foodRecordMode === "actual" ? (
              <View style={{ gap: 10 }}>
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
                    {mealSlots.map((slot) => (
                      <PillButton
                        key={slot.id}
                        label={slot.name}
                        color={dishRecognitionMeal === slot.id ? "accent" : "positive"}
                        onPress={() => setDishRecognitionMeal(slot.id)}
                      />
                    ))}
                  </View>
                  <Button variant="filled" color="accent2" block onPress={openDishImagePicker} disabled={dishRecognitionBusy}>
                    {dishRecognitionBusy ? "识别中..." : "AI 识别菜品"}
                  </Button>
                  {dishRecognitionMessage ? (
                    <BentoText variant="micro" color={c.inkMute}>
                      {dishRecognitionMessage}
                    </BentoText>
                  ) : null}
                </View>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <TextInput
                  multiline
                  value={preparedFoodText}
                  onChangeText={updatePreparedFoods}
                  placeholder="鸡蛋 西红柿 黄瓜 黄焖鸡"
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
          title={<PillButton label={`餐次计划 · ${dietPlanSummary.status}`} onPress={() => setDietPlanLogicOpen(true)} color="accent" />}
          collapsed={mealsCollapsed}
          onToggle={() => setMealsCollapsed((value) => !value)}
          trailing={<MealDisplaySwitch value={mealDisplayMode} onChange={setMealDisplayMode} />}
        />
        {!mealsCollapsed ? (
          <View style={{ gap: 8 }}>
            {mealRows.map((row) => (
              <MealCompareRow
                key={row.id}
                name={row.name}
                mode={mealDisplayMode}
                planned={row.planned}
                actual={row.actual}
                actualTags={row.actualTags}
                actualText={row.actualText}
                onActualTextChange={(text) => updateActualMealFoods(row.id, text)}
                onEditTag={(key, item, label, calories) => setEditingFoodTag(buildFoodTagEdit(key, item, label, calories))}
              />
            ))}
            {mealDisplayMode === "actual" ? (
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", paddingTop: 2 }}>
                <Badge color={intakeDiff > 0 ? "warn" : "positive"} size="sm">{`实际摄入 ${Math.round(actualIntake)} kcal`}</Badge>
                <Badge color={intakeDiff > 0 ? "warn" : "accent"} size="sm">{intakeDiffLabel}</Badge>
                <Badge color="accent" size="sm">蛋白差 {Math.round(actualGap.proteinG)}g</Badge>
              </View>
            ) : (
              <View style={{ gap: 8, paddingTop: 2 }}>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  <Badge color="positive" size="sm">{`计划摄入 ${Math.round(plannedTotals.calories)} kcal`}</Badge>
                  <Badge color="accent" size="sm">{`目标 ${dietTarget.calories} kcal`}</Badge>
                  <Badge color="accent2" size="sm">{dietPlanSummary.status}</Badge>
                </View>
              </View>
            )}
          </View>
        ) : null}
      </GlassTile>

      <GlassTile glow="accent" style={{ gap: 12 }}>
        <CardHeader
          title="MY MENU / 我的菜单"
          collapsed={menuCollapsed}
          onToggle={() => setMenuCollapsed((value) => !value)}
          trailing={<BentoText mono color={c.inkMute} style={{ fontSize: 12 }}>本模块上传 {menuFoods.length} 个</BentoText>}
        />
        {!menuCollapsed ? (
          <View style={{ gap: 8 }}>
            <TextInput value={menuName} onChangeText={setMenuName} placeholder="食物名称" placeholderTextColor={c.inkFaint} style={getInputStyle(c)} />
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <SmallInput label="kcal/100g" value={menuCalories} onChangeText={setMenuCalories} />
              <SmallInput label="蛋白g" value={menuProtein} onChangeText={setMenuProtein} />
              <SmallInput label="脂肪g" value={menuFat} onChangeText={setMenuFat} />
              <SmallInput label="碳水g" value={menuCarbs} onChangeText={setMenuCarbs} />
              <SmallInput label="每份g" value={menuGram} onChangeText={setMenuGram} />
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button variant="filled" color="accent" block onPress={saveCustomFood}>保存到我的菜单</Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button variant="glass" color="accent" block onPress={openNutritionLabelPicker}>
                  {nutritionOcrBusy ? "识别中..." : "识别营养表"}
                </Button>
              </View>
            </View>
            {nutritionOcrMessage ? (
              <BentoText variant="micro" color={nutritionOcrMessage.includes("失败") ? c.warn : c.inkMute}>
                {nutritionOcrMessage}
              </BentoText>
            ) : null}
            {menuFoods.map((food) => (
              <View key={food.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.glassBorder }}>
                <View style={{ flex: 1 }}>
                  <BentoText weight="semibold" variant="caption" color={c.ink}>{food.name}</BentoText>
                  <BentoText variant="micro" color={c.inkMute}>{Math.round(food.caloriesPer100g)} kcal/100g</BentoText>
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

function buildDashboardMetricDetail({
  cell,
  portions,
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
  const targetLine = `目标 ${Math.round(cell.target)}${cell.unit}`;
  const actualLine = `实际 ${Math.round(cell.actual)}${cell.unit}`;
  const foodSources = buildFoodContributionSources(portions, cell.key, cell.unit);

  if (cell.key === "deficit") {
    return {
      key: cell.key,
      label: cell.label,
      targetLine,
      actualLine,
      targetReason: `热量赤字目标来自身体数据中的当前体重、目标体重 ${goalTargetWeightKg}kg 和周期 ${goalDays} 天。系统按脂肪能量折算出每日需要的缺口，并用安全范围限制极端值。`,
      sourceTitle: "赤字计算",
      emptySourceLabel: "还没有饮食和训练记录。",
      sources: [
        { name: "总消耗", detail: `基础日消耗 ${Math.round(energyPlan.tdee)}kcal + 实际训练 ${Math.round(actualTrainingCalories)}kcal`, value: `+${Math.round(energyPlan.tdee + actualTrainingCalories)}kcal` },
        { name: "实际摄入", detail: "来自今天已经识别和保留的饮食标签", value: `-${Math.round(actualIntake)}kcal` },
      ],
    };
  }

  if (cell.key === "burn") {
    return {
      key: cell.key,
      label: cell.label,
      targetLine,
      actualLine,
      targetReason: `消耗目标来自当前身体数据估算出的 TDEE。体重 ${profileWeightKg}kg 会影响基础代谢和运动消耗估算。`,
      sourceTitle: "消耗来源",
      emptySourceLabel: "还没有训练反馈。",
      sources: [
        { name: "基础日消耗", detail: "由身体数据和活动水平估算", value: `${Math.round(energyPlan.tdee)}kcal` },
        { name: "今日训练", detail: `计划约 ${Math.round(plannedTrainingCalories)}kcal，实际反馈 ${Math.round(actualTrainingCalories)}kcal`, value: `${Math.round(actualTrainingCalories)}kcal` },
      ],
    };
  }

  if (cell.key === "intake") {
    return {
      key: cell.key,
      label: cell.label,
      targetLine,
      actualLine,
      targetReason: `摄入目标来自身体数据、体重目标周期和当前饮食方案「${dietPlanSummary.name} / ${dietPlanSummary.status}」。系统先确定今日总热量，再分配蛋白质、脂肪和碳水。`,
      sourceTitle: "摄入来源",
      emptySourceLabel: "还没有识别到实际饮食。",
      sources: foodSources,
    };
  }

  const macroReason: Record<string, string> = {
    protein: `蛋白质目标来自当前饮食方案「${dietPlanSummary.name} / ${dietPlanSummary.status}」、今日 ${dietTarget.calories}kcal 热量预算、体重 ${profileWeightKg}kg 和训练恢复需求。`,
    fat: `脂肪目标来自当前饮食方案「${dietPlanSummary.name} / ${dietPlanSummary.status}」。系统先锁定热量与蛋白质，再按方案比例给脂肪留出预算。`,
    carbs: `碳水目标来自当前饮食方案「${dietPlanSummary.name} / ${dietPlanSummary.status}」。在热量、蛋白质和脂肪确定后，剩余热量折算为碳水。`,
  };

  return {
    key: cell.key,
    label: cell.label,
    targetLine,
    actualLine,
    targetReason: macroReason[cell.key] ?? dietPlanSummary.logic,
    sourceTitle: "食物贡献",
    emptySourceLabel: "还没有识别到实际饮食。",
    sources: foodSources,
  };
}

function buildFoodContributionSources(portions: FoodPortion[], metricKey: string, unit: string): DashboardDetailSource[] {
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
      return {
        name: portion.name,
        detail: `${displayAmount} · ${Math.round(totals.calories)}kcal`,
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
  if (!detail) return null;

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
              <Label color={c.inkFaint} variant="micro">指标详情</Label>
              <BentoText weight="bold" color={c.ink} style={{ fontSize: 20, lineHeight: 24 }}>
                {detail.label}
              </BentoText>
            </View>

            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Badge color="accent" size="sm">{detail.actualLine}</Badge>
              <Badge color="positive" size="sm">{detail.targetLine}</Badge>
            </View>

            <View style={{ gap: 6, padding: 12, borderRadius: 12, backgroundColor: c.glass, borderWidth: 1, borderColor: c.glassBorder }}>
              <BentoText weight="semibold" variant="caption" color={c.ink}>为什么目标是这个数？</BentoText>
              <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 18 }}>
                {detail.targetReason}
              </BentoText>
            </View>

            <View style={{ gap: 8 }}>
              <BentoText weight="semibold" variant="caption" color={c.ink}>{detail.sourceTitle}</BentoText>
              {detail.sources.length > 0 ? detail.sources.map((source) => (
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
  trailing,
}: {
  title: ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  trailing?: ReactNode;
}) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ width: "100%", flexDirection: "row", alignItems: "center", gap: 8 }}>
      {typeof title === "string" ? <Label color={c.inkMute} variant="label">{title}</Label> : title}
      <View style={{ flex: 1 }} />
      {trailing}
      <PillButton label={collapsed ? "展开" : "收起"} onPress={onToggle} color="accent" />
    </View>
  );
}

function MealDisplaySwitch({ value, onChange }: { value: MealDisplayMode; onChange: (value: MealDisplayMode) => void }) {
  const c = useBentoTheme().colors;
  const options: Array<{ value: MealDisplayMode; label: string }> = [
    { value: "planned", label: "计划饮食" },
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
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: "auto" }}>
      <BentoText variant="micro" color={c.inkMute}>主数字=实际</BentoText>
      <BentoText variant="micro" color={c.inkFaint}>目标写在进度条上方</BentoText>
    </View>
  );
}

function PillButton({ label, color, onPress }: { label: string; color: SemanticColor; onPress: () => void }) {
  const c = useBentoTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        height: 26,
        paddingHorizontal: 10,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.glass,
        borderWidth: 1,
        borderColor: c.glassBorderBright,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <BentoText weight="semibold" color={c[color]} style={{ fontSize: 11 }}>{label}</BentoText>
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
              {summary.macroLabel.split("路").map((part) => (
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
                营养数据分配逻辑
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
                改变饮食计划
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
  const name = plan?.name ?? "日常饮食计划";
  const logic = plan
    ? `${plan.logic} 当前使用${resolvedDay.variantName ? `「${resolvedDay.variantName}」` : "该方案默认规则"}，公式：${resolvedDay.formula}`
    : "未选择长期饮食方案时，系统使用日常均衡分配：先按目标体重周期计算每日热量，再保证蛋白质，随后分配脂肪和碳水。";

  return {
    name,
    status: resolvedDay.status,
    sourceLabel: plan ? "来自计划页已选择的饮食计划" : "未选择计划时的默认方案",
    macroLabel: `${targets.calories} kcal · 蛋白 ${targets.proteinG}g · 脂肪 ${targets.fatG}g · 碳水 ${targets.carbsG}g`,
    logic,
    allocation: [
      `热量：沿用今日目标 ${targets.calories} kcal，不因为切换饮食法自动突破总预算。`,
      `蛋白质：${targets.proteinG}g，优先保证饱腹感和训练恢复。`,
      `脂肪：${targets.fatG}g，由热量扣除蛋白和碳水后回填。`,
      `碳水：${targets.carbsG}g，${resolvedDay.status} 会影响碳水倾斜程度。`,
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
  const remaining = Math.max(0, target - deficit);
  const hint = remaining > 0 ? `还需 ${Math.round(remaining)} kcal` : "已达成";
  const progress = target > 0 ? Math.min(1, deficit / target) : 0;
  const delta = deficit - target;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 2, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.glassBorder }}>
      <View style={{ width: 56, justifyContent: "center", gap: 3 }}>
        <BentoText variant="caption" color={c.inkMute} style={{ fontSize: 13, lineHeight: 16 }}>
          热量赤字
        </BentoText>
        <BentoText variant="micro" color={c.accent}>{hint}</BentoText>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <MetricDataRow label="目标" value={target} unit="kcal" textColor={c.positive} barColor="positive" percent={1} large />
        <MetricDataRow label="实际" value={deficit} unit="kcal" textColor={c.accent} barColor="accent" percent={progress} large />
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
        <MetricDataRow label="目标" value={metric.target} unit={metric.unit} textColor={c.positive} barColor="positive" percent={1} />
        <MetricDataRow label="实际" value={metric.actual} unit={metric.unit} textColor={c.accent} barColor="accent" percent={metric.progress} />
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

function MetricDataRow({
  value,
  unit,
  textColor,
  barColor,
  percent,
  large = false,
}: {
  label: string;
  value: number;
  unit: string;
  textColor: string;
  barColor: SemanticColor;
  percent: number;
  large?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: large ? 10 : 8 }}>
      <MetricValueRow value={value} unit={unit} color={textColor} large={large} />
      <View style={{ flex: 1, minWidth: large ? 92 : 72 }}>
        <ProgressBar percent={percent} color={barColor} height={large ? 7 : 6} />
      </View>
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
        <MetricDataRow label="目标" value={metric.target} unit={metric.unit} textColor={c.positive} barColor="positive" percent={1} />
        <MetricDataRow label="实际" value={metric.actual} unit={metric.unit} textColor={c.accent} barColor="accent" percent={metric.progress} />
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
        placeholder="一碗面 两棵拳头大的西红柿"
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
  return (
    <View style={{ gap: 6 }}>
      <BentoText variant="caption" color={c.warn}>未识别：{unmatched.join("、")}</BentoText>
      <View style={{ gap: 6 }}>
        {unmatched.map((name) => {
          const state = lookup[name];
          return (
            <View key={name} style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <PillButton label={`手动补充 ${name}`} color="warn" onPress={() => onManual(name)} />
              <PillButton label={state?.loading ? "搜索中" : "联网补全"} color="accent2" onPress={() => onSearch(name)} />
              {state?.message ? <BentoText variant="micro" color={c.inkMute}>{state.message}</BentoText> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
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

    const amountLabel = edit?.grams
      ? `${Math.round(edit.grams)}g`
      : food.displayAmount ?? `${Math.round(food.grams)}g`;
    const label = edit?.label?.trim() || `${amountLabel} ${edit?.filling ? edit.filling + " " : ""}${food.name}`;
    return [{
      key,
      label,
      calories: edit?.calories ?? food.calories,
      needsDetails: Boolean(match?.needsDetails && !edit),
      match,
    }];
  });
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
            <BentoText variant="micro" color={c.inkMute}>识别为 {quantityLabel} {edit.foodName}，可调整类型和重量让估算更接近实际。</BentoText>
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
              <TextInput value={filling} onChangeText={(text) => { setFilling(text); setCaloriesTouched(false); }} placeholder={`填写${variantGroupLabel}`} placeholderTextColor={c.inkFaint} style={getInputStyle(c)} />
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
                placeholder="重量"
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
            <Button variant="glass" color="warn" block onPress={() => onDelete(edit.key)}>删除标签</Button>
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
      {`${tag.label} ${Math.round(tag.calories)} kcal`}
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
  return meal.foods.map((item) => `${item.name} ${item.displayAmount ?? item.grams + "g"}`).join(" · ");
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

function AdjustmentSummaryCard({ summary }: { summary: ReturnType<typeof buildDailyAdjustmentSummary> }) {
  const c = useBentoTheme().colors;
  const color: SemanticColor = summary.netDelta > 0 ? "warn" : "positive";
  return (
    <GlassTile glow={color} style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Label color={c.inkMute} variant="label">ADJUST / 动态调整</Label>
          <BentoText weight="semibold" variant="caption" color={c[color]}>
            {summary.title}
          </BentoText>
        </View>
        <Badge color={color} size="sm">
          {summary.netDelta >= 0 ? "+" : ""}{summary.netDelta} kcal
        </Badge>
      </View>
      <BentoText variant="caption" color={c.inkMute} style={{ lineHeight: 20 }}>
        {summary.reason}
      </BentoText>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Badge color="accent" size="sm">分摊 {summary.days} 天</Badge>
        <Badge color="positive" size="sm">新目标 {summary.adjustedDailyCalories} kcal/天</Badge>
        <Badge color="accent2" size="sm">蛋白 {Math.round(summary.adjustedMacros.proteinG)}g</Badge>
      </View>
      {summary.warning ? (
        <BentoText variant="caption" color={c.warn}>{summary.warning}</BentoText>
      ) : null}
    </GlassTile>
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
