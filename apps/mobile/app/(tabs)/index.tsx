import {
  calculateNutritionGap,
  calculateFoodTotals,
  calculateDietPlanMacroTargets,
  calculateDefaultMealBudgets,
  exercises,
  getFoodByIdFromCatalog,
  getFoodCatalog,
  recommendMacroAwarePortions,
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
import { useEffect, useMemo, useState, type ReactNode } from "react";
 import { Modal, Pressable, ScrollView, TextInput, View } from "react-native";
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
import { buildTrainingQueue, useCurrentEnergyPlan, useFitnessStore } from "../../store/fitness-store";

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

type FoodTagEdit = {
  key: string;
  label: string;
  calories: string;
  grams: string;
  foodName: string;
  foodId: string;
  defaultFilling: string;
  unitCalories: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
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
  food: Food;
  grams: number;
  quantity?: number;
  unit?: string;
  displayAmount?: string;
  confidence?: number;
  needsDetails?: boolean;
  detailHint?: string;
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

  const [dashboardCollapsed, setDashboardCollapsed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [recordCollapsed, setRecordCollapsed] = useState(false);
  const [mealsCollapsed, setMealsCollapsed] = useState(false);
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
  const [foodTagEdits, setFoodTagEdits] = useState<Record<string, FoodTagOverride>>({});
  const [editingFoodTag, setEditingFoodTag] = useState<FoodTagEdit | null>(null);
  const [dietPlanLogicOpen, setDietPlanLogicOpen] = useState(false);

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
  const plannedTrainingFocus = todayTrainingPlan.focus ?? recommendedWorkout?.focus;
  const plannedTrainingBaseCalories = estimateTodayWorkoutCalories(recommendedWorkout, profile.weightKg);
  const plannedTrainingCalories =
    todayTrainingPlan.minutes && recommendedWorkout?.estimatedMinutes
      ? Math.round(plannedTrainingBaseCalories * (todayTrainingPlan.minutes / Math.max(1, recommendedWorkout.estimatedMinutes)))
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
  const burnCalories = Math.round(energyPlan.tdee + actualTraining.calories);
  const deficit = Math.round(burnCalories - actualIntake);
  const intakeDiff = Math.round(actualIntake - dietTarget.calories);
  const intakeDiffLabel = intakeDiff > 0
    ? `超出 ${Math.abs(intakeDiff)} kcal`
    : `还差 ${Math.abs(intakeDiff)} kcal`;
  const actualGap = calculateNutritionGap(dietTarget, actualTotals);
  const balanceColor: SemanticColor = deficit >= energyPlan.dailyDeficit ? "positive" : "accent";
  const intakeColor: SemanticColor = intakeDiff > 0 ? "warn" : "accent";

  const intakeMetric: DashboardMetric = {
    key: "intake",
    label: "摄入热量",
    unit: "kcal",
    target: dietTarget.calories,
    actual: actualIntake,
    color: intakeColor,
    progress: actualIntake / Math.max(1, dietTarget.calories),
  };
  const burnMetric: DashboardMetric = {
    key: "burn",
    label: "消耗热量",
    unit: "kcal",
    target: energyPlan.tdee,
    actual: burnCalories,
    color: "positive",
    progress: burnCalories / Math.max(1, energyPlan.tdee),
  };
  const macroMetrics: DashboardMetric[] = [
    {
      key: "protein",
      label: "蛋白质",
      unit: "g",
      target: dietTarget.proteinG,
      actual: Math.round(actualTotals.proteinG),
      color: "accent",
      progress: actualTotals.proteinG / Math.max(1, dietTarget.proteinG),
    },
    {
      key: "fat",
      label: "脂肪",
      unit: "g",
      target: dietTarget.fatG,
      actual: Math.round(actualTotals.fatG),
      color: "accent2",
      progress: actualTotals.fatG / Math.max(1, dietTarget.fatG),
    },
    {
      key: "carbs",
      label: "碳水",
      unit: "g",
      target: dietTarget.carbsG,
      actual: Math.round(actualTotals.carbsG),
      color: "positive",
      progress: actualTotals.carbsG / Math.max(1, dietTarget.carbsG),
    },
  ];
  const mealPlan = buildMealPlan(plannedPortions, customFoods);
  const actualMealPlan = buildMealPlan(adjustedActualPortions, customFoods);
  const mealRows = mealSlots.map(({ id, name }) => ({
    id,
    name,
    planned: mealPlan.find((meal) => meal.id === id),
    actual: actualMealPlan.find((meal) => meal.id === id),
    actualText: actualMealTexts[id],
  }));
  const dietPlanSummary = buildDietPlanSummary(selectedDietPlan, energyPlan, today, dietPlanCycleSelection);
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

  function updateActualFoods(text: string) {
    const result = buildActualFoodPortionsFromText(text, customFoods, {
      dailyCalorieTarget: dietTarget.calories,
    });
    setFoodTagEdits({});
    setActualFoods(text, result.parsed.matched.map((item) => item.food.id));
  }

  function updatePreparedFoods(text: string) {
    const result = parseFoodText(text, customFoods);
    setPreparedFoods(text, result.matched.map((item) => item.food.id));
  }

  function updateActualMealFoods(meal: MealAdjustmentKey, text: string) {
    setActualMealText(meal, text);
    const joined = mealSlots
      .map((slot) => (slot.id === meal ? text : actualMealTexts[slot.id]))
      .filter(Boolean)
      .join(" ");
    updateActualFoods(joined);
  }

  function startCustomFoodFromUnmatched(name: string) {
    setMenuName(name.trim());
    setMenuCollapsed(false);
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

      <GlassTile glow={balanceColor} padding={12} style={{ gap: 8 }}>
        <CardHeader
          title="DASHBOARD / 今日仪表盘"
          collapsed={dashboardCollapsed}
          onToggle={() => setDashboardCollapsed((value) => !value)}
          trailing={<DashboardLegend />}
        />
        {!dashboardCollapsed ? (
          <View style={{ gap: 8 }}>
            <DeficitHero
              deficit={Math.max(0, deficit)}
              target={Math.max(0, energyPlan.dailyDeficit)}
            />
            <View style={{ flexDirection: "row", alignItems: "stretch" }}>
              <MetricMini metric={intakeMetric} />
              <View style={{ width: 1, marginVertical: 8, backgroundColor: c.glassBorder }} />
              <MetricMini metric={burnMetric} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <BentoText variant="caption" color={c.inkMute}>{intakeDiffLabel}</BentoText>
              <PillButton label={detailsOpen ? "收起" : "查看更多"} onPress={() => setDetailsOpen((value) => !value)} color="accent" />
            </View>
            {detailsOpen ? (
              <View style={{ gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.glassBorder }}>
                {macroMetrics.map((metric) => <MacroRow key={metric.key} metric={metric} />)}
              </View>
            ) : null}
          </View>
        ) : null}
      </GlassTile>

      {dynamicAdjustmentEnabled && (actualIntake > 0 || hasTrainingRecord(actualTraining.status)) ? (
        <AdjustmentSummaryCard summary={adjustmentSummary} />
      ) : null}

      <GlassTile style={{ gap: 12 }}>
        <CardHeader
          title="RECORD / 饮食记录"
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
              <ActualFoodInputSection
                text={actualFoodText}
                onTextChange={updateActualFoods}
                matched={actualFood.parsed.matched}
                unmatched={actualFood.parsed.unmatched}
                actualIntakeCalories={actualIntake}
                intakeDiff={intakeDiff}
                intakeDiffLabel={intakeDiffLabel}
                actualGap={actualGap}
                foodTagEdits={foodTagEdits}
                onEditTag={(key, item, label, calories) => setEditingFoodTag(buildFoodTagEdit(key, item, label, calories))}
                onAddUnmatchedFood={startCustomFoodFromUnmatched}
              />
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
                  <View style={{ gap: 6 }}>
                    <BentoText variant="caption" color={c.warn}>未识别：{preparedResult.unmatched.join("、")}</BentoText>
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                      {preparedResult.unmatched.map((name) => (
                        <PillButton key={name} label={`补充 ${name}`} color="warn" onPress={() => startCustomFoodFromUnmatched(name)} />
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        ) : null}
      </GlassTile>

      <GlassTile style={{ gap: 12 }}>
        <CardHeader
          title={<PillButton label={`${dietPlanSummary.name} / ${dietPlanSummary.status}`} onPress={() => setDietPlanLogicOpen(true)} color="accent" />}
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
                actualText={row.actualText}
                onActualTextChange={(text) => updateActualMealFoods(row.id, text)}
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
            <Button variant="filled" color="accent" block onPress={saveCustomFood}>保存到我的菜单</Button>
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
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <BentoText variant="micro" color={c.positive}>绿色</BentoText>
        <BentoText variant="micro" color={c.inkMute}>为目标数据</BentoText>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <BentoText variant="micro" color={c.accent}>蓝色</BentoText>
        <BentoText variant="micro" color={c.inkMute}>为实际数据</BentoText>
      </View>
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
  matched,
  unmatched,
  actualIntakeCalories,
  intakeDiff,
  intakeDiffLabel,
  actualGap,
  foodTagEdits,
  onEditTag,
  onAddUnmatchedFood,
}: {
  text: string;
  onTextChange: (text: string) => void;
  matched: FoodTagMatch[];
  unmatched: string[];
  actualIntakeCalories: number;
  intakeDiff: number;
  intakeDiffLabel: string;
  actualGap: NutritionTotals;
  foodTagEdits: Record<string, FoodTagOverride>;
  onEditTag: (key: string, item: FoodTagMatch, label: string, calories: string) => void;
  onAddUnmatchedFood: (name: string) => void;
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
      {matched.length > 0 ? (
        <View style={{ gap: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: c.glassBorder }}>
          <Label color={c.inkMute} variant="label">
            {`识别结果 ${matched.length} 项${unmatched.length > 0 ? " · " + unmatched.length + " 项待补充" : ""}`}
          </Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {matched.map((item, index) => {
              const key = `${item.food.id}-${index}`;
              const edit = foodTagEdits[key];
              if (edit?.hidden) return null;
              const amountLabel = edit?.grams ? `${Math.round(edit.grams)}g` : item.displayAmount ?? (item.quantity ? `${item.quantity}${item.unit ?? ""}` : `${Math.round(item.grams)}g`);
              const label = edit?.label ?? `${amountLabel} ${edit?.filling ? edit.filling + " " : ""}${item.food.name}`;
              const calories = edit?.calories ?? Math.round((item.grams * item.food.caloriesPer100g) / 100);
              const needsDetails = item.needsDetails && !edit;
              return (
                <Pressable key={key} onPress={() => onEditTag(key, item, label, String(calories))}>
                  <Badge color="accent" size="sm">
                    {`${label} ${calories} kcal`}
                    {needsDetails ? (
                      <BentoText weight="bold" color={c.warn} style={{ fontSize: 10 }}>
                        {" ?"}
                      </BentoText>
                    ) : null}
                  </Badge>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : unmatched.length > 0 ? (
        <View style={{ gap: 6 }}>
          <BentoText variant="caption" color={c.warn}>未识别：{unmatched.join("、")}</BentoText>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {unmatched.map((name) => (
              <PillButton key={name} label={`补充 ${name}`} color="warn" onPress={() => onAddUnmatchedFood(name)} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function buildFoodTagEdit(key: string, item: FoodTagMatch, label: string, calories: string): FoodTagEdit {
  const defaultFilling = inferDefaultFilling(item.food);
  const caloriesNumber = numberOr(calories, Math.round((item.grams * item.food.caloriesPer100g) / 100));
  const quantity = item.quantity && item.quantity > 0 ? item.quantity : undefined;
  return {
    key,
    label,
    calories: String(caloriesNumber),
    grams: String(Math.round(item.grams)),
    foodName: item.food.name,
    foodId: item.food.id,
    defaultFilling,
    unitCalories: quantity ? Math.round(caloriesNumber / quantity) : Math.round(calculateFoodTotals(resolveFoodByFilling(item.food, defaultFilling), item.food.defaultUnitGram).calories),
    caloriesPer100g: item.food.caloriesPer100g,
    proteinPer100g: item.food.proteinPer100g,
    fatPer100g: item.food.fatPer100g,
    carbsPer100g: item.food.carbsPer100g,
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
    const food = match ? resolveFoodByFilling(match.food, edit.filling) : undefined;
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

function inferDefaultFilling(food: Food): string {
  const text = `${food.id} ${food.name} ${food.aliases.join(" ")}`;
  if (/包子|baozi|肉包/i.test(text)) return "猪肉大葱馅";
  if (/饺|水饺|dumpling/i.test(text)) return "猪肉大葱馅";
  if (/馄饨|云吞/i.test(text)) return "猪肉馅";
  return food.category === "dish" || food.category === "fastfood" ? "APP默认做法" : "标准食物数据";
}

function resolveFoodByFilling(food: Food, filling?: string): Food {
  if (!filling || filling === inferDefaultFilling(food)) return food;
  const profile = getFillingNutritionProfile(food, filling);
  if (!profile) return food;
  return {
    ...food,
    caloriesPer100g: profile.caloriesPer100g,
    proteinPer100g: profile.proteinPer100g,
    fatPer100g: profile.fatPer100g,
    carbsPer100g: profile.carbsPer100g
  };
}

function getFillingNutritionProfile(food: Food, filling?: string): Pick<Food, "caloriesPer100g" | "proteinPer100g" | "fatPer100g" | "carbsPer100g"> | undefined {
  const text = `${food.id} ${food.name} ${food.aliases.join(" ")}`;
  if (!/包子|baozi|肉包/i.test(text)) return undefined;
  const normalized = filling ?? "";
  if (/素|蔬菜|青菜/i.test(normalized)) {
    return { caloriesPer100g: 180, proteinPer100g: 6, fatPer100g: 4, carbsPer100g: 30 };
  }
  if (/地三鲜|土豆|茄子|青椒/i.test(normalized)) {
    return { caloriesPer100g: 205, proteinPer100g: 6, fatPer100g: 6, carbsPer100g: 34 };
  }
  if (/牛肉/i.test(normalized)) {
    return { caloriesPer100g: 245, proteinPer100g: 11, fatPer100g: 9, carbsPer100g: 31 };
  }
  return { caloriesPer100g: 244, proteinPer100g: 9, fatPer100g: 8, carbsPer100g: 34 };
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

  useEffect(() => {
    if (!edit) return;
    setLabel(edit.label);
    setCalories(edit.calories);
    setGrams(edit.grams);
    setFilling(edit.defaultFilling);
    setCaloriesTouched(false);
  }, [edit]);

  useEffect(() => {
    if (!edit || caloriesTouched) return;
    const previewFood = resolveFoodByFilling({
      id: edit.foodId,
      name: edit.foodName,
      aliases: [],
      category: "dish",
      caloriesPer100g: edit.caloriesPer100g,
      proteinPer100g: edit.proteinPer100g,
      fatPer100g: edit.fatPer100g,
      carbsPer100g: edit.carbsPer100g,
      defaultUnitGram: numberOr(edit.grams, 100)
    }, filling);
    setCalories(String(calculateFoodTotals(previewFood, numberOr(grams, numberOr(edit.grams, 1))).calories));
  }, [caloriesTouched, edit, filling, grams]);

  if (!edit) return null;

  const currentGrams = numberOr(grams, numberOr(edit.grams, 1));
  const previewFood = resolveFoodByFilling({
    id: edit.foodId,
    name: edit.foodName,
    aliases: [],
    category: "dish",
    caloriesPer100g: edit.caloriesPer100g,
    proteinPer100g: edit.proteinPer100g,
    fatPer100g: edit.fatPer100g,
    carbsPer100g: edit.carbsPer100g,
    defaultUnitGram: currentGrams
  }, filling);
  const calculatedCalories = calculateFoodTotals(previewFood, currentGrams).calories;
  const finalCalories = numberOr(calories, calculatedCalories);
  const quantityLabel = edit.quantity ? `${edit.quantity}${edit.unit ?? ""}` : edit.displayAmount ?? `${Math.round(currentGrams)}g`;
  const unitCalories = edit.quantity && edit.quantity > 0
    ? Math.round(finalCalories / edit.quantity)
    : Math.round(calculateFoodTotals(previewFood, previewFood.defaultUnitGram).calories);
  const fillingOptions = ["猪肉大葱馅", "素馅", "地三鲜馅", "牛肉馅"];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.28)", justifyContent: "center", padding: 20 }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ borderRadius: 18, backgroundColor: c.bg, borderWidth: 1, borderColor: c.glassBorderBright, padding: 16, gap: 10 }}>
          <BentoText weight="bold" variant="caption" color={c.ink}>食物标签详情</BentoText>
          <View style={{ gap: 5, padding: 10, borderRadius: 12, backgroundColor: c.glass, borderWidth: 1, borderColor: c.glassBorder }}>
            <BentoText variant="caption" color={c.ink}>APP 识别：{quantityLabel} {edit.foodName}</BentoText>
            <BentoText variant="micro" color={c.inkMute}>默认类型：{filling || edit.defaultFilling}</BentoText>
            <BentoText variant="micro" color={c.inkMute}>单个估算：{unitCalories} kcal{edit.quantity ? `，共 ${edit.quantity}${edit.unit ?? ""}` : ""}</BentoText>
            <BentoText variant="micro" color={c.inkMute}>计算：{Math.round(previewFood.caloriesPer100g)} kcal/100g × {Math.round(currentGrams)}g ÷ 100 = {calculatedCalories} kcal</BentoText>
          </View>
          <BentoText weight="bold" variant="caption" color={c.ink}>编辑识别标签</BentoText>
      <TextInput value={label} onChangeText={setLabel} placeholder="标签文本" placeholderTextColor={c.inkFaint} style={getInputStyle(c)} />
      <TextInput value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="热量 kcal" placeholderTextColor={c.inkFaint} style={getInputStyle(c)} />
          <View style={{ gap: 6 }}>
            <BentoText variant="micro" color={c.inkMute}>馅料 / 类型</BentoText>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {fillingOptions.map((option) => (
                <PillButton key={option} label={option} color={option === filling ? "accent" : "accent2"} onPress={() => { setFilling(option); setCaloriesTouched(false); }} />
              ))}
            </View>
            <TextInput value={filling} onChangeText={(text) => { setFilling(text); setCaloriesTouched(false); }} placeholder="自定义馅料/做法" placeholderTextColor={c.inkFaint} style={getInputStyle(c)} />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <SmallInput label="重量 g" value={grams} onChangeText={(text) => { setGrams(text); setCaloriesTouched(false); }} />
            <SmallInput label="最终 kcal" value={calories} onChangeText={(text) => { setCalories(text); setCaloriesTouched(true); }} />
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
  actualText,
  onActualTextChange,
}: {
  name: string;
  mode: MealDisplayMode;
  planned?: MealPlan;
  actual?: MealPlan;
  actualText: string;
  onActualTextChange: (text: string) => void;
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
            <MealActualColumn meal={actual} text={actualText} onChangeText={onActualTextChange} />
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

function MealActualColumn({ meal, text, onChangeText }: { meal?: MealPlan; text: string; onChangeText: (text: string) => void }) {
  const c = useBentoTheme().colors;
  return (
    <View style={{ flex: 1, gap: 5 }}>
      <BentoText variant="caption" color={meal?.foods.length ? c.inkMute : c.inkFaint}>
        {formatMealFoods(meal)}
      </BentoText>
      <TextInput
        value={text}
        onChangeText={onChangeText}
        placeholder="本餐实际"
        placeholderTextColor={c.inkFaint}
        style={{
          minHeight: 32,
          borderRadius: 10,
          backgroundColor: c.glass,
          borderWidth: 1,
          borderColor: c.glassBorder,
          paddingHorizontal: 8,
          paddingVertical: 5,
          color: c.ink,
          fontSize: 12
        }}
      />
    </View>
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
