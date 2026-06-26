import {
  calculateNutritionGap,
  getFoodByIdFromCatalog,
  getFoodCatalog,
  recommendMacroAwarePortions,
  sumNutrition,
  type Food,
  type MealAdjustmentKey,
  type NutritionTotals,
} from "@fitness-calendar/shared";
import { useEffect, useState, type ReactNode } from "react";
import { Modal, Platform, Pressable, TextInput, View } from "react-native";
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
} from "../../components/bento";
import {
  buildActualFoodPortionsFromText,
  buildMealPlan,
  parseFoodText,
  type MealPlan,
} from "../../features/today-plan";
import { useCurrentEnergyPlan, useFitnessStore } from "../../store/fitness-store";

type FoodRecordMode = "actual" | "prepared";
type DashboardMode = "actual" | "target";

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
};

const mealSlots: Array<{ id: MealAdjustmentKey; name: string }> = [
  { id: "breakfast", name: "早餐" },
  { id: "lunch", name: "午餐" },
  { id: "dinner", name: "晚餐" },
  { id: "snack", name: "加餐" },
];

export default function TodayScreen() {
  const energyPlan = useCurrentEnergyPlan();
  const selectedFoodIds = useFitnessStore((state) => state.selectedFoodIds);
  const preparedFoodText = useFitnessStore((state) => state.preparedFoodText);
  const actualFoodText = useFitnessStore((state) => state.actualFoodText);
  const actualMealTexts = useFitnessStore((state) => state.actualMealTexts);
  const customFoods = useFitnessStore((state) => state.customFoods);
  const menuFoods = useFitnessStore((state) => state.menuFoods);
  const actualTraining = useFitnessStore((state) => state.actualTraining);
  const setPreparedFoods = useFitnessStore((state) => state.setPreparedFoods);
  const setActualFoods = useFitnessStore((state) => state.setActualFoods);
  const setActualMealText = useFitnessStore((state) => state.setActualMealText);
  const addCustomFood = useFitnessStore((state) => state.addCustomFood);
  const removeCustomFood = useFitnessStore((state) => state.removeCustomFood);
  const addMenuFood = useFitnessStore((state) => state.addMenuFood);
  const removeMenuFood = useFitnessStore((state) => state.removeMenuFood);

  const [dashboardCollapsed, setDashboardCollapsed] = useState(false);
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>("actual");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [recordCollapsed, setRecordCollapsed] = useState(false);
  const [mealsCollapsed, setMealsCollapsed] = useState(false);
  const [mealCalendarOpen, setMealCalendarOpen] = useState(false);
  const [menuCollapsed, setMenuCollapsed] = useState(true);
  const [foodRecordMode, setFoodRecordMode] = useState<FoodRecordMode>("actual");
  const [menuName, setMenuName] = useState("");
  const [menuCalories, setMenuCalories] = useState("");
  const [menuProtein, setMenuProtein] = useState("");
  const [menuFat, setMenuFat] = useState("");
  const [menuCarbs, setMenuCarbs] = useState("");
  const [menuGram, setMenuGram] = useState("100");
  const [foodTagEdits, setFoodTagEdits] = useState<Record<string, { hidden?: boolean; label?: string; calories?: number }>>({});
  const [editingFoodTag, setEditingFoodTag] = useState<FoodTagEdit | null>(null);

  const selectedFoods = selectedFoodIds.flatMap((foodId) => {
    const food = getFoodByIdFromCatalog(foodId, customFoods);
    return food ? [food] : [];
  });
  const plannedPortions = recommendMacroAwarePortions(selectedFoods, energyPlan);
  const plannedTotals = sumNutrition(plannedPortions.map((portion) => portion.totals));
  const preparedResult = parseFoodText(preparedFoodText, customFoods);
  const actualFood = buildActualFoodPortionsFromText(actualFoodText, customFoods, {
    dailyCalorieTarget: energyPlan.calories,
  });
  const actualTotals = sumNutrition(actualFood.portions.map((portion) => portion.totals));
  const actualIntake = Math.round(actualTotals.calories);
  const burnCalories = Math.round(energyPlan.tdee + actualTraining.calories);
  const deficit = Math.round(burnCalories - actualIntake);
  const intakeDiff = Math.round(actualIntake - energyPlan.calories);
  const intakeDiffLabel = intakeDiff > 0
    ? `超出 ${Math.abs(intakeDiff)} kcal`
    : `还差 ${Math.abs(intakeDiff)} kcal`;
  const actualGap = calculateNutritionGap(energyPlan, actualTotals);
  const balanceColor: SemanticColor = deficit >= energyPlan.dailyDeficit ? "positive" : "accent";
  const intakeColor: SemanticColor = intakeDiff > 0 ? "warn" : "accent";

  const intakeMetric: DashboardMetric = {
    key: "intake",
    label: "摄入热量",
    unit: "kcal",
    target: energyPlan.calories,
    actual: actualIntake,
    color: intakeColor,
    progress: actualIntake / Math.max(1, energyPlan.calories),
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
      target: energyPlan.proteinG,
      actual: Math.round(actualTotals.proteinG),
      color: "accent",
      progress: actualTotals.proteinG / Math.max(1, energyPlan.proteinG),
    },
    {
      key: "fat",
      label: "脂肪",
      unit: "g",
      target: energyPlan.fatG,
      actual: Math.round(actualTotals.fatG),
      color: "accent2",
      progress: actualTotals.fatG / Math.max(1, energyPlan.fatG),
    },
    {
      key: "carbs",
      label: "碳水",
      unit: "g",
      target: energyPlan.carbsG,
      actual: Math.round(actualTotals.carbsG),
      color: "positive",
      progress: actualTotals.carbsG / Math.max(1, energyPlan.carbsG),
    },
  ];

  const mealPlan = buildMealPlan(plannedPortions, customFoods);
  const actualMealPlan = buildMealPlan(actualFood.portions, customFoods);
  const mealRows = mealSlots.map(({ id, name }) => ({
    id,
    name,
    planned: mealPlan.find((meal) => meal.id === id),
    actual: actualMealPlan.find((meal) => meal.id === id),
    actualText: actualMealTexts[id],
  }));

  function updateActualFoods(text: string) {
    const result = buildActualFoodPortionsFromText(text, customFoods, {
      dailyCalorieTarget: energyPlan.calories,
    });
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

  function saveCustomFood() {
    const name = menuName.trim();
    if (!name) return;
    const food: Food = {
      id: `custom-${Date.now()}`,
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

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 · 今日`;

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

      <GlassTile glow={balanceColor} padding={12} style={{ gap: 10 }}>
        <CardHeader
          title="DASHBOARD / 今日仪表盘"
          collapsed={dashboardCollapsed}
          onToggle={() => setDashboardCollapsed((value) => !value)}
          trailing={(
            <View style={{ flexDirection: "row", gap: 6, marginLeft: "auto" }}>
              <Button
                variant={dashboardMode === "target" ? "filled" : "glass"}
                color="positive"
                size="sm"
                onPress={() => setDashboardMode("target")}
              >
                目标
              </Button>
              <Button
                variant={dashboardMode === "actual" ? "filled" : "glass"}
                color="accent"
                size="sm"
                onPress={() => setDashboardMode("actual")}
              >
                实际
              </Button>
            </View>
          )}
        />
        {!dashboardCollapsed ? (
          <View style={{ gap: 10 }}>
            <DeficitHero
              deficit={Math.max(0, deficit)}
              target={Math.max(0, energyPlan.dailyDeficit)}
              color={balanceColor}
              mode={dashboardMode}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <MetricMini metric={intakeMetric} mode={dashboardMode} />
              <MetricMini metric={burnMetric} mode={dashboardMode} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <BentoText variant="caption" color={colors.inkMute}>{intakeDiffLabel}</BentoText>
              <PillButton label={detailsOpen ? "收起" : "查看更多"} onPress={() => setDetailsOpen((value) => !value)} color="accent" />
            </View>
            {detailsOpen ? (
              <View style={{ gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.glassBorder }}>
                {macroMetrics.map((metric) => <MacroRow key={metric.key} metric={metric} />)}
              </View>
            ) : null}
          </View>
        ) : null}
      </GlassTile>

      <GlassTile style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <CardHeader title="RECORD / 饮食记录" collapsed={recordCollapsed} onToggle={() => setRecordCollapsed((value) => !value)} />
          <BentoText mono color={colors.inkMute} style={{ fontSize: 12 }}>{actualIntake} kcal</BentoText>
        </View>
        {!recordCollapsed ? (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button variant={foodRecordMode === "actual" ? "filled" : "glass"} color="accent2" size="sm" block onPress={() => setFoodRecordMode("actual")}>
                实际吃了什么
              </Button>
              <Button variant={foodRecordMode === "prepared" ? "filled" : "glass"} color="accent" size="sm" block onPress={() => setFoodRecordMode("prepared")}>
                准备吃什么
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
                onEditTag={(key, label, calories) => setEditingFoodTag({ key, label, calories })}
              />
            ) : (
              <View style={{ gap: 8 }}>
                <TextInput
                  multiline
                  value={preparedFoodText}
                  onChangeText={updatePreparedFoods}
                  placeholder="鸡蛋 西红柿 黄瓜 黄焖鸡"
                  placeholderTextColor={colors.inkFaint}
                  style={inputStyle}
                />
                {preparedResult.unmatched.length > 0 ? (
                  <BentoText variant="caption" color={colors.warn}>未识别：{preparedResult.unmatched.join("、")}</BentoText>
                ) : null}
              </View>
            )}
          </View>
        ) : null}
      </GlassTile>

      <GlassTile style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <CardHeader title="MEALS / 今日餐次" collapsed={mealsCollapsed} onToggle={() => setMealsCollapsed((value) => !value)} />
          <BentoText variant="caption" color={colors.inkMute}>计划 / 实际</BentoText>
        </View>
        {!mealsCollapsed ? (
          <View style={{ gap: 8 }}>
            {mealRows.map((row) => (
              <MealCompareRow
                key={row.id}
                name={row.name}
                planned={row.planned}
                actual={row.actual}
                actualText={row.actualText}
                onActualTextChange={(text) => updateActualMealFoods(row.id, text)}
              />
            ))}
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", paddingTop: 2 }}>
              <Badge color={intakeDiff > 0 ? "warn" : "positive"} size="sm">{`实际摄入 ${Math.round(actualIntake)} kcal`}</Badge>
              <Badge color={intakeDiff > 0 ? "warn" : "accent"} size="sm">{intakeDiffLabel}</Badge>
              <Badge color="accent" size="sm">蛋白差 {Math.round(actualGap.proteinG)}g</Badge>
            </View>
          </View>
        ) : null}
      </GlassTile>

      <GlassTile glow="accent" style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <CardHeader title="MY MENU / 我的菜单" collapsed={menuCollapsed} onToggle={() => setMenuCollapsed((value) => !value)} />
          <BentoText mono color={colors.inkMute} style={{ fontSize: 12 }}>本模块上传 {menuFoods.length} 个</BentoText>
        </View>
        {!menuCollapsed ? (
          <View style={{ gap: 8 }}>
            <TextInput value={menuName} onChangeText={setMenuName} placeholder="食物名称" placeholderTextColor={colors.inkFaint} style={inputStyle} />
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <SmallInput label="kcal/100g" value={menuCalories} onChangeText={setMenuCalories} />
              <SmallInput label="蛋白g" value={menuProtein} onChangeText={setMenuProtein} />
              <SmallInput label="脂肪g" value={menuFat} onChangeText={setMenuFat} />
              <SmallInput label="碳水g" value={menuCarbs} onChangeText={setMenuCarbs} />
              <SmallInput label="每份g" value={menuGram} onChangeText={setMenuGram} />
            </View>
            <Button variant="filled" color="accent" block onPress={saveCustomFood}>保存到我的菜单</Button>
            {menuFoods.map((food) => (
              <View key={food.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.glassBorder }}>
                <View style={{ flex: 1 }}>
                  <BentoText weight="semibold" variant="caption" color={colors.ink}>{food.name}</BentoText>
                  <BentoText variant="micro" color={colors.inkMute}>{Math.round(food.caloriesPer100g)} kcal/100g</BentoText>
                </View>
                <Pressable onPress={() => { removeMenuFood(food.id); removeCustomFood(food.id); }}>
                  <BentoText variant="micro" color={colors.warn}>删除</BentoText>
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
    </Screen>
  );
}

const inputStyle = {
  minHeight: 56,
  backgroundColor: colors.glass,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  borderRadius: radius.md,
  paddingHorizontal: 12,
  paddingVertical: 12,
  color: colors.ink,
  fontSize: 14,
} as const;

function CardHeader({
  title,
  collapsed,
  onToggle,
  trailing,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  trailing?: ReactNode;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Label color={colors.inkMute} variant="label">{title}</Label>
      {trailing}
      <PillButton label={collapsed ? "展开" : "收起"} onPress={onToggle} color="accent" />
    </View>
  );
}

function PillButton({ label, color, onPress }: { label: string; color: SemanticColor; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        height: 26,
        paddingHorizontal: 10,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassBorderBright,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <BentoText weight="semibold" color={colors[color]} style={{ fontSize: 11 }}>{label}</BentoText>
    </Pressable>
  );
}

function DeficitHero({
  deficit,
  target,
  mode,
}: {
  deficit: number;
  target: number;
  color: SemanticColor;
  mode: DashboardMode;
}) {
  const remaining = Math.max(0, target - deficit);
  const hint = remaining > 0 ? `还需 ${Math.round(remaining)} kcal` : "已达成";
  return (
    <View style={{ gap: 6, borderRadius: 18, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorderBright, padding: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <BentoText variant="micro" color={colors.inkMute}>{mode === "target" ? "目标热量赤字 · TARGET" : "热量赤字 · DEFICIT"}</BentoText>
        <BentoText variant="micro" color={colors.accent}>{hint}</BentoText>
      </View>
      <View style={{ gap: 1 }}>
        <MetricValueLine label="目标" value={target} unit="kcal" color={colors.positive} muted />
        <MetricValueLine label="实际" value={deficit} unit="kcal" color={colors.accent} large />
      </View>
      <ProgressBar percent={target > 0 ? deficit / target : 0} color="accent" height={4} />
    </View>
  );
}

function MetricMini({ metric, mode }: { metric: DashboardMetric; mode: DashboardMode }) {
  return (
    <View style={{ flex: 1, gap: 4, padding: 10, borderRadius: 14, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder }}>
      <BentoText variant="micro" color={colors.inkMute}>{metric.label}</BentoText>
      <View style={{ gap: 1 }}>
        <MetricValueLine label="目标" value={metric.target} unit={metric.unit} color={colors.positive} muted />
        <MetricValueLine label="实际" value={metric.actual} unit={metric.unit} color={colors.accent} />
      </View>
      <ProgressBar percent={metric.progress} color="accent" height={3} />
    </View>
  );
}

function MetricValueLine({
  label,
  value,
  unit,
  color,
  muted = false,
  large = false,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  muted?: boolean;
  large?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, opacity: muted ? 0.52 : 1 }}>
      <BentoText variant="micro" color={color} style={{ width: 26 }}>{label}</BentoText>
      <BentoText mono weight="bold" color={color} style={{ fontSize: large ? 30 : 18, lineHeight: large ? 32 : 21 }}>
        {Math.round(value)}
      </BentoText>
      <BentoText mono color={color} style={{ fontSize: large ? 12 : 10 }}>{unit}</BentoText>
    </View>
  );
}

function MacroRow({ metric }: { metric: DashboardMetric }) {
  const delta = metric.actual - metric.target;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ flex: 1, gap: 3 }}>
        <BentoText variant="caption" color={colors.ink}>{metric.label}</BentoText>
        <ProgressBar percent={metric.progress} color={metric.color} height={3} />
      </View>
      <BentoText mono weight="bold" color={colors[metric.color]} style={{ fontSize: 13 }}>
        {Math.round(metric.actual)}/{Math.round(metric.target)}{metric.unit}
      </BentoText>
      <BentoText mono weight="semibold" color={delta >= 0 ? colors.positive : colors.warn} style={{ fontSize: 11, width: 52, textAlign: "right" }}>
        {delta >= 0 ? "+" : ""}{Math.round(delta)}
      </BentoText>
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
}: {
  text: string;
  onTextChange: (text: string) => void;
  matched: Array<{ food: Food; grams: number; quantity?: number; unit?: string; displayAmount?: string; confidence?: number }>;
  unmatched: string[];
  actualIntakeCalories: number;
  intakeDiff: number;
  intakeDiffLabel: string;
  actualGap: NutritionTotals;
  foodTagEdits: Record<string, { hidden?: boolean; label?: string; calories?: number }>;
  onEditTag: (key: string, label: string, calories: string) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <TextInput
        multiline
        value={text}
        onChangeText={onTextChange}
        placeholder="一碗面 两棵拳头大的西红柿"
        placeholderTextColor={colors.inkFaint}
        style={inputStyle}
      />
      {matched.length > 0 ? (
          <View style={{ gap: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.glassBorder }}>
            <Label color={colors.inkMute} variant="label">
              {`识别结果 ${matched.length} 项${unmatched.length > 0 ? " · " + unmatched.length + " 项待补充" : ""}`}
            </Label>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {matched.map((item, index) => {
                const key = `${item.food.id}-${index}`;
                const edit = foodTagEdits[key];
                if (edit?.hidden) return null;
                const label = edit?.label ?? `${item.displayAmount ?? (item.quantity ? `${item.quantity}${item.unit ?? ""}` : `${Math.round(item.grams)}g`)} ${item.food.name}`;
                const calories = edit?.calories ?? Math.round((item.grams * item.food.caloriesPer100g) / 100);
                return (
                  <Pressable key={key} onPress={() => onEditTag(key, label, String(calories))}>
                    <Badge color="accent" size="sm">
                      {`${label} ${calories} kcal`}
                    </Badge>
                  </Pressable>
                );
              })}
            </View>
        </View>
      ) : unmatched.length > 0 ? (
        <BentoText variant="caption" color={colors.warn}>未识别：{unmatched.join("、")}</BentoText>
      ) : null}
    </View>
  );
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
  const [label, setLabel] = useState(edit?.label ?? "");
  const [calories, setCalories] = useState(edit?.calories ?? "");

  useEffect(() => {
    if (!edit) return;
    setLabel(edit.label);
    setCalories(edit.calories);
  }, [edit]);

  if (!edit) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.28)", justifyContent: "center", padding: 20 }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ borderRadius: 18, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.glassBorderBright, padding: 16, gap: 10 }}>
          <BentoText weight="bold" variant="caption" color={colors.ink}>编辑识别标签</BentoText>
          <TextInput value={label} onChangeText={setLabel} placeholder="标签文本" placeholderTextColor={colors.inkFaint} style={inputStyle} />
          <TextInput value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="热量 kcal" placeholderTextColor={colors.inkFaint} style={inputStyle} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button variant="glass" color="warn" block onPress={() => onDelete(edit.key)}>删除标签</Button>
            <Button variant="filled" color="accent" block onPress={() => onSave({ key: edit.key, label, calories })}>保存更正</Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MealCompareRow({
  name,
  planned,
  actual,
  actualText,
  onActualTextChange,
}: {
  name: string;
  planned?: MealPlan;
  actual?: MealPlan;
  actualText: string;
  onActualTextChange: (text: string) => void;
}) {
  return (
    <GlassTile radius={bento.tileRadiusSmall} padding={10}>
      <View style={{ flexDirection: "row", alignItems: "stretch", gap: 10 }}>
        <View style={{ width: 44, justifyContent: "center", paddingRight: 2 }}>
          <BentoText weight="bold" variant="caption" color={colors.ink}>{name}</BentoText>
        </View>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <MealColumn meal={planned} />
        </View>
        <View
          style={{
            width: 3,
            alignSelf: "stretch",
            marginVertical: 2,
            borderRadius: 999,
            backgroundColor: colors.accent,
            ...(Platform.OS === "web"
              ? { boxShadow: `0px 0px 4px ${colors.accent}73` }
              : {
                  shadowColor: colors.accent,
                  shadowOpacity: 0.45,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 0 },
                }),
          }}
        />
        <View style={{ flex: 1, paddingLeft: 10 }}>
          <MealActualColumn meal={actual} text={actualText} onChangeText={onActualTextChange} />
        </View>
      </View>
    </GlassTile>
  );
}

function MealColumn({ meal }: { meal?: MealPlan }) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <BentoText variant="caption" color={colors.inkMute}>{formatMealFoods(meal)}</BentoText>
    </View>
  );
}

function MealActualColumn({ meal, text, onChangeText }: { meal?: MealPlan; text: string; onChangeText: (text: string) => void }) {
  return (
    <View style={{ flex: 1, gap: 5 }}>
      <BentoText variant="caption" color={meal?.foods.length ? colors.inkMute : colors.inkFaint}>
        {formatMealFoods(meal)}
      </BentoText>
      <TextInput
        value={text}
        onChangeText={onChangeText}
        placeholder="本餐实际"
        placeholderTextColor={colors.inkFaint}
        style={{
          minHeight: 32,
          borderRadius: 10,
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          paddingHorizontal: 8,
          paddingVertical: 5,
          color: colors.ink,
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
  return (
    <View style={{ flex: 1, minWidth: 86, gap: 4 }}>
      <BentoText variant="micro" color={colors.inkMute}>{label}</BentoText>
      <TextInput keyboardType="numeric" value={value} onChangeText={onChangeText} placeholder="0" placeholderTextColor={colors.inkFaint} style={[inputStyle, { minHeight: 42, paddingVertical: 8 }]} />
    </View>
  );
}

function numberOr(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
