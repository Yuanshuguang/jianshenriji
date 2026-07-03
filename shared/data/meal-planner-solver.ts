import type { Food, FoodPortion, MuscleGroup, NutritionTotals } from "../index";

export type MealPlannerMeal = NonNullable<FoodPortion["meal"]>;

export type MealPlannerOptions = {
  enabledMeals?: Partial<Record<MealPlannerMeal, boolean>>;
  dayType?: string;
  trainingFocus?: MuscleGroup | null;
  adjustments?: MealPlannerAdjustments;
};

export type MealPlannerMacroKey = "calories" | "carbsG" | "proteinG" | "fatG";

export type MealPlannerAdjustments = {
  lockedMeals?: Partial<Record<MealPlannerMeal, boolean>>;
  foodGrams?: Record<string, number>;
  macroTargets?: Record<string, Partial<Record<MealPlannerMacroKey, number>>>;
};

export type MealPlannerInput = MealPlannerOptions & {
  foods: Food[];
  target: NutritionTotals;
};

export type MealPlannerResult = {
  portions: FoodPortion[];
  totals: NutritionTotals;
  score: number;
  warnings: string[];
};

type RoleShares = {
  protein: number;
  staple: number;
  vegetable: number;
  fat: number;
};

const mealOrder: MealPlannerMeal[] = ["breakfast", "lunch", "dinner", "snack"];

export function solveMealPlan(input: MealPlannerInput): MealPlannerResult {
  if (input.foods.length === 0) {
    return {
      portions: [],
      totals: zeroTotals(),
      score: Number.POSITIVE_INFINITY,
      warnings: ["储备食物为空，无法生成餐次计划。"]
    };
  }

  const activeMeals = resolveActiveMeals(input.enabledMeals);
  const portions = buildInitialPortions(input.foods, input.target, activeMeals, input);
  const closedPortions = closePlanMacros(portions, input.foods, input.target, input);
  const adjustedPortions = applyUserAdjustments(closedPortions, input.foods, activeMeals, input.adjustments);
  const totals = sumNutrition(adjustedPortions.map((portion) => portion.totals));
  const warnings = buildWarnings(adjustedPortions, input.foods, input.target, activeMeals, input);

  return {
    portions: adjustedPortions,
    totals,
    score: scorePlan(adjustedPortions, totals, input.target, activeMeals, warnings),
    warnings
  };
}

function buildInitialPortions(
  foods: Food[],
  target: NutritionTotals,
  activeMeals: MealPlannerMeal[],
  options: MealPlannerOptions
): FoodPortion[] {
  const targetCalories = Math.max(300, target.calories);
  const portions: FoodPortion[] = [];
  const flexibleFoods = foods.filter(canSplitForMealPlanning);
  const wholeServingFoods = foods.filter((item) => !canSplitForMealPlanning(item));
  const pools = {
    protein: flexibleFoods.filter((item) => item.category === "protein" || item.category === "supplement" || item.proteinPer100g >= 12),
    staple: flexibleFoods.filter((item) => item.category === "staple" || (item.carbsPer100g >= 16 && item.category !== "dish" && item.category !== "fastfood")),
    vegetable: flexibleFoods.filter((item) => item.category === "vegetable"),
    fruit: flexibleFoods.filter((item) => item.category === "fruit"),
    fat: flexibleFoods.filter((item) => item.fatPer100g >= 12 && item.category !== "fastfood" && item.category !== "dish"),
    drinkSnack: flexibleFoods.filter((item) => item.category === "drink" || item.category === "snack")
  };

  wholeServingFoods.forEach((foodItem, index) => {
    portions.push(buildPortion(foodItem, wholeServingGrams(foodItem), nearestActiveMeal(preferredWholeServingMeal(foodItem, index), activeMeals)));
  });

  buildMealBudgets(targetCalories, activeMeals, options).forEach(({ meal, calories }) => {
    if (meal === "snack") {
      const snackFood = pickNext([...pools.fruit, ...pools.drinkSnack, ...pools.fat, ...pools.protein], portions);
      if (snackFood) portions.push(buildPortion(snackFood, gramsForCalories(snackFood, calories * 0.72, meal), meal));
      return;
    }

    const role = mealRoleShares(meal, options);
    const protein = pickNext(pools.protein, portions);
    const staple = pickMealRoleFood(pools.staple, portions, meal, "staple", options);
    const vegetable = pickNext(pools.vegetable, portions);
    const fat = pickNext(pools.fat, portions);

    if (protein) portions.push(buildPortion(protein, gramsForCalories(protein, calories * role.protein, meal), meal));
    if (staple) portions.push(buildPortion(staple, gramsForCalories(staple, calories * role.staple, meal), meal));
    if (vegetable) portions.push(buildPortion(vegetable, gramsForCalories(vegetable, calories * role.vegetable, meal), meal));
    if (fat && fat.id !== protein?.id) portions.push(buildPortion(fat, gramsForCalories(fat, calories * role.fat, meal), meal));
  });

  if (portions.length > 0) return mergePortions(portions, foods);

  return foods.map((item, index) =>
    buildPortion(item, canSplitForMealPlanning(item) ? clampToServing(item, item.defaultUnitGram) : wholeServingGrams(item), activeMeals[index % activeMeals.length] ?? "lunch")
  );
}

function applyUserAdjustments(
  portions: FoodPortion[],
  foods: Food[],
  activeMeals: MealPlannerMeal[],
  adjustments?: MealPlannerAdjustments
): FoodPortion[] {
  if (!adjustments) return portions.filter((portion) => portion.grams > 0);
  const foodById = new Map(foods.map((item) => [item.id, item]));
  let next = portions.map((portion) => ({ ...portion }));
  const lockedMeals = adjustments.lockedMeals ?? {};

  Object.entries(adjustments.foodGrams ?? {}).forEach(([key, rawGrams]) => {
    const [meal, foodId] = key.split(":") as [MealPlannerMeal, string];
    if (!activeMeals.includes(meal) || lockedMeals[meal]) return;
    const index = next.findIndex((portion) => portion.meal === meal && portion.foodId === foodId);
    if (index < 0) return;
    const food = foodById.get(foodId);
    if (!food) return;
    const current = next[index];
    const grams = clamp(Math.round(Math.max(0, rawGrams) / 5) * 5, 0, planningMaxGrams(food, meal));
    const delta = current.grams - grams;
    next[index] = rebuildPortion(current, food, grams);
    next = redistributeFoodGrams(next, food, delta, meal, activeMeals, lockedMeals, adjustments.foodGrams ?? {});
  });

  Object.entries(adjustments.macroTargets ?? {}).forEach(([mealKey, targets]) => {
    const meal = mealKey as MealPlannerMeal;
    if (!activeMeals.includes(meal) || lockedMeals[meal]) return;
    (Object.entries(targets) as Array<[MealPlannerMacroKey, number]>).forEach(([macro, targetValue]) => {
      next = applyMacroTarget(next, foods, meal, macro, Math.max(0, targetValue), activeMeals, lockedMeals, adjustments.foodGrams ?? {});
    });
  });

  return mergePortions(next.filter((portion) => portion.grams > 0), foods);
}

function applyMacroTarget(
  portions: FoodPortion[],
  foods: Food[],
  meal: MealPlannerMeal,
  macro: MealPlannerMacroKey,
  targetValue: number,
  activeMeals: MealPlannerMeal[],
  lockedMeals: Partial<Record<MealPlannerMeal, boolean>>,
  foodOverrides: Record<string, number>
): FoodPortion[] {
  const foodById = new Map(foods.map((item) => [item.id, item]));
  let next = portions.map((portion) => ({ ...portion }));
  const currentTotals = sumNutrition(next.filter((portion) => portion.meal === meal).map((portion) => portion.totals));
  const currentValue = macroValue(currentTotals, macro);
  const diff = currentValue - targetValue;
  if (Math.abs(diff) < 1) return next;

  if (diff > 0) {
    let remaining = diff;
    const candidates = next
      .map((portion, index) => ({ portion, index, food: foodById.get(portion.foodId) }))
      .filter((item) => item.portion.meal === meal && item.food && macroPer100g(item.food, macro) > 0 && !foodOverrides[`${meal}:${item.portion.foodId}`])
      .sort((left, right) => macroPer100g(right.food!, macro) - macroPer100g(left.food!, macro));

    for (const item of candidates) {
      if (remaining <= 1) break;
      const food = item.food!;
      const per100 = macroPer100g(food, macro);
      const maxReduceValue = (item.portion.grams * per100) / 100;
      const reduceValue = Math.min(remaining, maxReduceValue);
      const reduceGrams = (reduceValue / Math.max(1, per100)) * 100;
      const grams = clamp(Math.round((item.portion.grams - reduceGrams) / 5) * 5, 0, item.portion.grams);
      const removedGrams = item.portion.grams - grams;
      next[item.index] = rebuildPortion(item.portion, food, grams);
      next = redistributeFoodGrams(next, food, removedGrams, meal, activeMeals, lockedMeals, foodOverrides);
      remaining -= (removedGrams * per100) / 100;
    }
    return next;
  }

  const candidates = next
    .map((portion, index) => ({ portion, index, food: foodById.get(portion.foodId) }))
    .filter((item) => item.portion.meal === meal && item.food && macroPer100g(item.food, macro) > 0 && !foodOverrides[`${meal}:${item.portion.foodId}`])
    .sort((left, right) => macroPer100g(right.food!, macro) - macroPer100g(left.food!, macro));
  const candidate = candidates[0];
  if (!candidate?.food) return next;
  const addValue = Math.abs(diff);
  const addGrams = (addValue / Math.max(1, macroPer100g(candidate.food, macro))) * 100;
  const grams = clamp(
    Math.round((candidate.portion.grams + addGrams) / 5) * 5,
    candidate.portion.grams,
    planningMaxGrams(candidate.food, meal)
  );
  next[candidate.index] = rebuildPortion(candidate.portion, candidate.food, grams);
  return next;
}

function redistributeFoodGrams(
  portions: FoodPortion[],
  food: Food,
  deltaGrams: number,
  sourceMeal: MealPlannerMeal,
  activeMeals: MealPlannerMeal[],
  lockedMeals: Partial<Record<MealPlannerMeal, boolean>>,
  foodOverrides: Record<string, number>
): FoodPortion[] {
  if (Math.abs(deltaGrams) < 1) return portions;
  const receivers = activeMeals.filter((meal) => meal !== sourceMeal && !lockedMeals[meal] && foodOverrides[`${meal}:${food.id}`] === undefined);
  if (receivers.length === 0) return portions;
  const next = portions.map((portion) => ({ ...portion }));

  if (deltaGrams > 0) {
    const gramsPerMeal = Math.round((deltaGrams / receivers.length) / 5) * 5;
    let remaining = deltaGrams;
    receivers.forEach((meal, receiverIndex) => {
      const add = receiverIndex === receivers.length - 1 ? remaining : Math.min(remaining, gramsPerMeal);
      if (add <= 0) return;
      const existingIndex = next.findIndex((portion) => portion.meal === meal && portion.foodId === food.id);
      if (existingIndex >= 0) {
        const existing = next[existingIndex];
        next[existingIndex] = rebuildPortion(existing, food, existing.grams + add);
      } else {
        next.push(buildPortion(food, add, meal));
      }
      remaining -= add;
    });
    return next;
  }

  let needToRemove = Math.abs(deltaGrams);
  const donors = next
    .map((portion, index) => ({ portion, index }))
    .filter((item) => receivers.includes(item.portion.meal ?? "lunch") && item.portion.foodId === food.id)
    .sort((left, right) => right.portion.grams - left.portion.grams);
  donors.forEach((donor) => {
    if (needToRemove <= 0) return;
    const remove = Math.min(donor.portion.grams, needToRemove);
    const grams = donor.portion.grams - remove;
    next[donor.index] = rebuildPortion(donor.portion, food, grams);
    needToRemove -= remove;
  });
  return next;
}

function rebuildPortion(portion: FoodPortion, food: Food, grams: number): FoodPortion {
  return {
    ...portion,
    grams,
    totals: calculateTotals(food, grams)
  };
}

function buildMealBudgets(
  targetCalories: number,
  activeMeals: MealPlannerMeal[],
  options: MealPlannerOptions
): Array<{ meal: MealPlannerMeal; calories: number }> {
  const highCarb = options.dayType === "high-carb";
  const lowCarb = isLowCarbDay(options.dayType);
  const baseWeights: Record<MealPlannerMeal, number> = {
    breakfast: 0.25,
    lunch: highCarb || options.trainingFocus === "legs" || options.trainingFocus === "back" ? 0.39 : 0.35,
    dinner: lowCarb ? 0.24 : 0.30,
    snack: 0.10
  };
  const sum = activeMeals.reduce((total, meal) => total + baseWeights[meal], 0) || 1;
  return activeMeals.map((meal) => ({
    meal,
    calories: targetCalories * (baseWeights[meal] / sum)
  }));
}

function mealRoleShares(meal: MealPlannerMeal, options: MealPlannerOptions): RoleShares {
  const lowCarb = isLowCarbDay(options.dayType);
  const highCarb = options.dayType === "high-carb";
  if (meal === "breakfast") {
    return { protein: 0.42, staple: lowCarb ? 0.20 : 0.34, vegetable: 0.10, fat: lowCarb ? 0.22 : 0.10 };
  }
  if (meal === "dinner") {
    return { protein: 0.42, staple: lowCarb ? 0.16 : highCarb ? 0.24 : 0.28, vegetable: 0.24, fat: lowCarb ? 0.18 : 0.10 };
  }
  if (meal === "snack") {
    return { protein: 0.42, staple: 0.18, vegetable: 0.00, fat: 0.25 };
  }
  return { protein: 0.36, staple: lowCarb ? 0.24 : highCarb ? 0.40 : 0.36, vegetable: 0.20, fat: lowCarb ? 0.16 : 0.10 };
}

function closePlanMacros(portions: FoodPortion[], foods: Food[], target: NutritionTotals, options: MealPlannerOptions): FoodPortion[] {
  if (!shouldEnforceMacroCaps(target, options)) {
    return closeCaloriesFlexible(portions, foods, target.calories);
  }
  let next = portions;
  for (let index = 0; index < 4; index += 1) {
    next = closeCarbs(next, foods, target);
    next = closeCalories(next, foods, target);
  }
  next = fillCarbsTowardTarget(closeCarbs(next, foods, target), foods, target);
  next = fillCaloriesWithLowCarbFoods(next, foods, target);
  next = rebalanceProteinToCarbs(next, foods, target);
  return closeCarbs(next, foods, target);
}

function shouldEnforceMacroCaps(target: NutritionTotals, options: MealPlannerOptions): boolean {
  return isLowCarbDay(options.dayType) || options.dayType === "high-carb" && target.carbsG >= 220;
}

function closeCaloriesFlexible(portions: FoodPortion[], foods: Food[], targetCalories: number): FoodPortion[] {
  const totalCalories = portions.reduce((sum, item) => sum + item.totals.calories, 0);
  if (totalCalories <= 0 || Math.abs(totalCalories - targetCalories) <= Math.max(25, targetCalories * 0.03)) {
    return portions;
  }

  const foodById = new Map(foods.map((item) => [item.id, item]));
  const targets = portions
    .map((portion, index) => ({ portion, index, food: foodById.get(portion.foodId) }))
    .filter((item) => item.food && canScaleForMacroClosure(item.food));
  if (targets.length === 0) return portions;

  const scalableCalories = targets.reduce((sum, item) => sum + item.portion.totals.calories, 0);
  if (scalableCalories <= 0) return portions;

  const scale = clamp(1 + (targetCalories - totalCalories) / scalableCalories, 0.45, 4);
  return portions.map((portion, index) => {
    const target = targets.find((item) => item.index === index);
    if (!target?.food) return portion;
    const grams = Math.max(portionMinGrams(target.food), Math.round((portion.grams * scale) / 5) * 5);
    return {
      ...portion,
      grams,
      totals: calculateTotals(target.food, grams)
    };
  });
}

function closeCalories(portions: FoodPortion[], foods: Food[], target: NutritionTotals): FoodPortion[] {
  const totalCalories = portions.reduce((sum, item) => sum + item.totals.calories, 0);
  if (totalCalories <= 0 || Math.abs(totalCalories - target.calories) <= Math.max(25, target.calories * 0.03)) {
    return portions;
  }

  const foodById = new Map(foods.map((item) => [item.id, item]));
  const totals = sumNutrition(portions.map((portion) => portion.totals));
  const carbTolerance = macroTolerance(target.carbsG);
  const needsCalories = target.calories - totalCalories;
  const targets = portions
    .map((portion, index) => ({ portion, index, food: foodById.get(portion.foodId) }))
    .filter((item) => {
      if (!item.food || !canScaleForMacroClosure(item.food)) return false;
      if (needsCalories > 0 && totals.carbsG >= target.carbsG - carbTolerance && item.food.carbsPer100g >= 12) return false;
      return true;
    })
    .sort((left, right) => macroClosureScore(left.food!, target, totals, needsCalories) - macroClosureScore(right.food!, target, totals, needsCalories));
  if (targets.length === 0) return portions;

  const scalableCalories = targets.reduce((sum, item) => sum + item.portion.totals.calories, 0);
  if (scalableCalories <= 0) return portions;

  const scale = clamp(1 + (target.calories - totalCalories) / scalableCalories, 0.45, 4);
  return portions.map((portion, index) => {
    const target = targets.find((item) => item.index === index);
    if (!target?.food) return portion;
    const grams = clamp(
      Math.round((portion.grams * scale) / 5) * 5,
      portionMinGrams(target.food),
      planningMaxGrams(target.food, portion.meal ?? "lunch")
    );
    return {
      ...portion,
      grams,
      totals: calculateTotals(target.food, grams)
    };
  });
}

function closeCarbs(portions: FoodPortion[], foods: Food[], target: NutritionTotals): FoodPortion[] {
  const totals = sumNutrition(portions.map((portion) => portion.totals));
  const tolerance = macroTolerance(target.carbsG);
  if (totals.carbsG <= target.carbsG + tolerance) return portions;

  const foodById = new Map(foods.map((item) => [item.id, item]));
  let remainingCarbsToCut = totals.carbsG - target.carbsG;
  const next = portions.map((portion) => ({ ...portion }));
  const carbTargets = next
    .map((portion, index) => ({ portion, index, food: foodById.get(portion.foodId) }))
    .filter((item) => item.food && item.food.carbsPer100g >= 12 && canScaleForMacroClosure(item.food))
    .sort((left, right) => right.food!.carbsPer100g - left.food!.carbsPer100g);

  for (const item of carbTargets) {
    if (remainingCarbsToCut <= tolerance) break;
    const food = item.food!;
    const minGrams = portionMinGrams(food);
    const currentGrams = item.portion.grams;
    if (currentGrams <= minGrams) continue;
    const maxCutCarbs = ((currentGrams - minGrams) * food.carbsPer100g) / 100;
    const cutCarbs = Math.min(remainingCarbsToCut, maxCutCarbs);
    const gramsToCut = (cutCarbs / Math.max(1, food.carbsPer100g)) * 100;
    const grams = clamp(Math.round((currentGrams - gramsToCut) / 5) * 5, minGrams, currentGrams);
    next[item.index] = {
      ...item.portion,
      grams,
      totals: calculateTotals(food, grams)
    };
    remainingCarbsToCut -= ((currentGrams - grams) * food.carbsPer100g) / 100;
  }

  return next;
}

function fillCaloriesWithLowCarbFoods(portions: FoodPortion[], foods: Food[], target: NutritionTotals): FoodPortion[] {
  const foodById = new Map(foods.map((item) => [item.id, item]));
  const next = portions.map((portion) => ({ ...portion }));
  const tolerance = Math.max(35, target.calories * 0.04);
  let totals = sumNutrition(next.map((portion) => portion.totals));
  if (target.calories - totals.calories <= tolerance) return next;

  const candidates = next
    .map((portion, index) => ({ portion, index, food: foodById.get(portion.foodId) }))
    .filter((item) => item.food && canScaleForMacroClosure(item.food) && item.food.carbsPer100g <= 8)
    .sort((left, right) => (right.food!.proteinPer100g + right.food!.fatPer100g) - (left.food!.proteinPer100g + left.food!.fatPer100g));

  for (const item of candidates) {
    totals = sumNutrition(next.map((portion) => portion.totals));
    const caloriesGap = target.calories - totals.calories;
    if (caloriesGap <= tolerance) break;
    const food = item.food!;
    const maxGrams = planningMaxGrams(food, item.portion.meal ?? "lunch");
    if (item.portion.grams >= maxGrams) continue;
    const gramsToAdd = (caloriesGap / Math.max(20, food.caloriesPer100g)) * 100;
    const grams = clamp(Math.round((item.portion.grams + gramsToAdd) / 5) * 5, item.portion.grams, maxGrams);
    next[item.index] = {
      ...item.portion,
      grams,
      totals: calculateTotals(food, grams)
    };
  }

  return next;
}

function fillCarbsTowardTarget(portions: FoodPortion[], foods: Food[], target: NutritionTotals): FoodPortion[] {
  const foodById = new Map(foods.map((item) => [item.id, item]));
  const next = portions.map((portion) => ({ ...portion }));
  const carbTolerance = macroTolerance(target.carbsG);
  const calorieTolerance = Math.max(35, target.calories * 0.04);
  let totals = sumNutrition(next.map((portion) => portion.totals));
  if (totals.carbsG >= target.carbsG - carbTolerance || totals.calories >= target.calories - calorieTolerance) return next;

  const candidates = next
    .map((portion, index) => ({ portion, index, food: foodById.get(portion.foodId) }))
    .filter((item) => item.food && canScaleForMacroClosure(item.food) && item.food.carbsPer100g >= 12 && item.portion.grams < portionMaxGrams(item.food, item.portion.meal ?? "lunch"))
    .sort((left, right) => {
      const mealScore = (right.portion.meal === "lunch" ? 2 : right.portion.meal === "breakfast" ? 1 : 0)
        - (left.portion.meal === "lunch" ? 2 : left.portion.meal === "breakfast" ? 1 : 0);
      return mealScore || right.food!.carbsPer100g - left.food!.carbsPer100g;
    });

  for (const item of candidates) {
    totals = sumNutrition(next.map((portion) => portion.totals));
    const carbsGap = target.carbsG - totals.carbsG;
    const caloriesGap = target.calories - totals.calories;
    if (carbsGap <= carbTolerance || caloriesGap <= calorieTolerance) break;
    const food = item.food!;
    const maxGrams = portionMaxGrams(food, item.portion.meal ?? "lunch");
    const gramsByCarbs = (carbsGap / Math.max(1, food.carbsPer100g)) * 100;
    const gramsByCalories = (caloriesGap / Math.max(20, food.caloriesPer100g)) * 100;
    const grams = clamp(
      Math.round((item.portion.grams + Math.min(gramsByCarbs, gramsByCalories)) / 5) * 5,
      item.portion.grams,
      maxGrams
    );
    next[item.index] = {
      ...item.portion,
      grams,
      totals: calculateTotals(food, grams)
    };
  }

  return next;
}

function rebalanceProteinToCarbs(portions: FoodPortion[], foods: Food[], target: NutritionTotals): FoodPortion[] {
  const foodById = new Map(foods.map((item) => [item.id, item]));
  let next = portions.map((portion) => ({ ...portion }));
  const proteinTolerance = Math.max(10, target.proteinG * 0.08);
  const carbTolerance = macroTolerance(target.carbsG);

  for (let step = 0; step < 5; step += 1) {
    const totals = sumNutrition(next.map((portion) => portion.totals));
    if (totals.proteinG <= target.proteinG + proteinTolerance || totals.carbsG >= target.carbsG - carbTolerance) break;

    const candidate = next
      .map((portion, index) => ({ portion, index, food: foodById.get(portion.foodId) }))
      .filter((item) => item.food && item.food.proteinPer100g >= 18 && item.food.carbsPer100g <= 8 && item.portion.grams > portionMinGrams(item.food))
      .sort((left, right) => {
        const mealScore = (left.portion.meal === "snack" ? -2 : left.portion.meal === "dinner" ? -1 : 0)
          - (right.portion.meal === "snack" ? -2 : right.portion.meal === "dinner" ? -1 : 0);
        return mealScore || right.portion.grams - left.portion.grams;
      })[0];
    if (!candidate?.food) break;

    const minGrams = portionMinGrams(candidate.food);
    const proteinExcess = totals.proteinG - target.proteinG;
    const reduceByProtein = (proteinExcess / Math.max(1, candidate.food.proteinPer100g)) * 100;
    const grams = clamp(
      Math.round((candidate.portion.grams - Math.min(80, reduceByProtein)) / 5) * 5,
      minGrams,
      candidate.portion.grams
    );
    if (grams === candidate.portion.grams) break;
    next[candidate.index] = {
      ...candidate.portion,
      grams,
      totals: calculateTotals(candidate.food, grams)
    };
    next = fillCarbsTowardTarget(next, foods, target);
  }

  return next;
}

function macroTolerance(targetValue: number): number {
  return Math.max(8, targetValue * 0.05);
}

function macroClosureScore(food: Food, target: NutritionTotals, totals: NutritionTotals, needsCalories: number): number {
  const carbPressure = totals.carbsG >= target.carbsG - macroTolerance(target.carbsG);
  if (needsCalories > 0 && carbPressure) {
    return food.carbsPer100g * 3 - food.proteinPer100g - food.fatPer100g;
  }
  if (needsCalories < 0 && totals.carbsG > target.carbsG) {
    return -food.carbsPer100g;
  }
  return 0;
}

function buildWarnings(portions: FoodPortion[], foods: Food[], target: NutritionTotals, activeMeals: MealPlannerMeal[], options: MealPlannerOptions): string[] {
  const warnings: string[] = [];
  const totals = sumNutrition(portions.map((portion) => portion.totals));
  const foodById = new Map(foods.map((item) => [item.id, item]));

  if (Math.abs(totals.calories - target.calories) > Math.max(80, target.calories * 0.08)) {
    warnings.push("当前储备食物无法在常识份量内闭合今日热量目标。");
  }
  if (shouldEnforceMacroCaps(target, options)) {
    if (Math.abs(totals.carbsG - target.carbsG) > Math.max(20, target.carbsG * 0.12)) {
      warnings.push("当前储备食物难以在常识份量内贴近今日碳水目标。");
    }
    if (Math.abs(totals.fatG - target.fatG) > Math.max(12, target.fatG * 0.25)) {
      warnings.push("当前储备食物脂肪来源不足或过多，难以贴近今日脂肪目标。");
    }
  }
  if (!foods.some((item) => item.category === "protein" || item.proteinPer100g >= 12)) {
    warnings.push("储备食物缺少优质蛋白，计划可能无法满足健身恢复需求。");
  }
  if (!foods.some((item) => item.category === "staple" || item.carbsPer100g >= 16)) {
    warnings.push("储备食物缺少主食，训练日碳水分配可能不足。");
  }
  portions.forEach((portion) => {
    const food = foodById.get(portion.foodId);
    if (!food) return;
    if (!activeMeals.includes(portion.meal ?? "lunch")) {
      warnings.push(`${portion.name} 被分配到了未启用餐次。`);
    }
    if (!canScaleForMacroClosure(food) && portion.grams > wholeServingGrams(food) * 1.5) {
      warnings.push(`${portion.name} 份量超过常见单份范围。`);
    }
  });

  return Array.from(new Set(warnings));
}

function scorePlan(portions: FoodPortion[], totals: NutritionTotals, target: NutritionTotals, activeMeals: MealPlannerMeal[], warnings: string[]): number {
  const macroScore =
    Math.abs(totals.calories - target.calories) / Math.max(1, target.calories)
    + Math.abs(totals.proteinG - target.proteinG) / Math.max(1, target.proteinG) * 0.9
    + Math.abs(totals.carbsG - target.carbsG) / Math.max(1, target.carbsG) * 0.45
    + Math.abs(totals.fatG - target.fatG) / Math.max(1, target.fatG) * 0.35;
  const disabledMealPenalty = portions.some((portion) => !activeMeals.includes(portion.meal ?? "lunch")) ? 10 : 0;
  return Math.round((macroScore + warnings.length * 0.35 + disabledMealPenalty) * 1000) / 1000;
}

function resolveActiveMeals(enabledMeals?: Partial<Record<MealPlannerMeal, boolean>>): MealPlannerMeal[] {
  if (!enabledMeals) return mealOrder;
  const active = mealOrder.filter((meal) => enabledMeals[meal] !== false);
  return active.length > 0 ? active : ["lunch"];
}

function nearestActiveMeal(meal: MealPlannerMeal, activeMeals: MealPlannerMeal[]): MealPlannerMeal {
  if (activeMeals.includes(meal)) return meal;
  if (meal === "breakfast") return activeMeals.includes("lunch") ? "lunch" : activeMeals[0] ?? "lunch";
  if (meal === "dinner") return activeMeals.includes("lunch") ? "lunch" : activeMeals[0] ?? "lunch";
  if (meal === "snack") return activeMeals.includes("dinner") ? "dinner" : activeMeals[0] ?? "lunch";
  return activeMeals[0] ?? "lunch";
}

function buildPortion(food: Food, grams: number, meal: MealPlannerMeal): FoodPortion {
  const roundedGrams = Math.max(5, Math.round(grams / 5) * 5);
  return {
    foodId: food.id,
    name: food.name,
    grams: roundedGrams,
    meal,
    totals: calculateTotals(food, roundedGrams)
  };
}

function calculateTotals(food: Food, grams: number): NutritionTotals {
  const factor = grams / 100;
  return {
    calories: Math.round(food.caloriesPer100g * factor),
    proteinG: round1(food.proteinPer100g * factor),
    fatG: round1(food.fatPer100g * factor),
    carbsG: round1(food.carbsPer100g * factor)
  };
}

function macroValue(totals: NutritionTotals, macro: MealPlannerMacroKey): number {
  return totals[macro];
}

function macroPer100g(food: Food, macro: MealPlannerMacroKey): number {
  if (macro === "calories") return food.caloriesPer100g;
  if (macro === "carbsG") return food.carbsPer100g;
  if (macro === "proteinG") return food.proteinPer100g;
  return food.fatPer100g;
}

function sumNutrition(values: NutritionTotals[]): NutritionTotals {
  return {
    calories: Math.round(values.reduce((sum, item) => sum + item.calories, 0)),
    proteinG: round1(values.reduce((sum, item) => sum + item.proteinG, 0)),
    fatG: round1(values.reduce((sum, item) => sum + item.fatG, 0)),
    carbsG: round1(values.reduce((sum, item) => sum + item.carbsG, 0))
  };
}

function mergePortions(portions: FoodPortion[], foods: Food[]): FoodPortion[] {
  const foodById = new Map(foods.map((item) => [item.id, item]));
  const merged = new Map<string, FoodPortion>();
  portions.forEach((portion) => {
    const key = `${portion.meal ?? ""}:${portion.foodId}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, portion);
      return;
    }
    const grams = existing.grams + portion.grams;
    const food = foodById.get(portion.foodId) ?? portionToFoodFallback(portion);
    merged.set(key, {
      ...existing,
      grams,
      totals: calculateTotals(food, grams)
    });
  });
  return Array.from(merged.values());
}

function pickNext(candidates: Food[], portions: FoodPortion[]): Food | undefined {
  if (candidates.length === 0) return undefined;
  const counts = new Map<string, number>();
  portions.forEach((portion) => counts.set(portion.foodId, (counts.get(portion.foodId) ?? 0) + 1));
  return candidates
    .slice()
    .sort((left, right) => (counts.get(left.id) ?? 0) - (counts.get(right.id) ?? 0))[0];
}

function pickMealRoleFood(
  candidates: Food[],
  portions: FoodPortion[],
  meal: MealPlannerMeal,
  role: "staple",
  options: MealPlannerOptions
): Food | undefined {
  if (role !== "staple" || candidates.length === 0) return pickNext(candidates, portions);
  const counts = new Map<string, number>();
  portions.forEach((portion) => counts.set(portion.foodId, (counts.get(portion.foodId) ?? 0) + 1));
  const lowCarbDinner = meal === "dinner" && isLowCarbDay(options.dayType);
  const lunchTrainingCarb = meal === "lunch" && (options.dayType === "high-carb" || options.trainingFocus === "legs" || options.trainingFocus === "back");

  return candidates
    .slice()
    .sort((left, right) => {
      const leftScore = stapleMealScore(left, counts.get(left.id) ?? 0, lowCarbDinner, lunchTrainingCarb);
      const rightScore = stapleMealScore(right, counts.get(right.id) ?? 0, lowCarbDinner, lunchTrainingCarb);
      return leftScore - rightScore;
    })[0];
}

function stapleMealScore(food: Food, count: number, lowCarbDinner: boolean, lunchTrainingCarb: boolean): number {
  if (lowCarbDinner) {
    return count * 0.5 + food.carbsPer100g / 10;
  }
  if (lunchTrainingCarb) {
    return count * 0.5 - food.carbsPer100g / 10;
  }
  return count;
}

function gramsForCalories(food: Food, calories: number, meal: MealPlannerMeal): number {
  const grams = (calories / Math.max(20, food.caloriesPer100g)) * 100;
  return clamp(grams, portionMinGrams(food), portionMaxGrams(food, meal));
}

function clampToServing(food: Food, grams: number): number {
  return clamp(grams, portionMinGrams(food), portionMaxGrams(food, "lunch"));
}

function wholeServingGrams(food: Food): number {
  return clampToServing(food, bestServingGram(food));
}

function bestServingGram(food: Food): number {
  const usefulUnit = food.servingUnits?.find((unit) => isWholeServingUnit(unit.name));
  return usefulUnit?.grams ?? food.defaultUnitGram;
}

function preferredWholeServingMeal(food: Food, index: number): MealPlannerMeal {
  if (food.category === "fruit" || food.category === "snack" || food.category === "drink") return "snack";
  if (food.category === "protein" || /鸡蛋|egg/i.test(foodDescriptorText(food))) return "breakfast";
  if (food.category === "staple" && /包子|馒头|烧饼|贝果|饭团|面包|bread|bagel/i.test(foodDescriptorText(food))) {
    return index % 2 === 0 ? "breakfast" : "lunch";
  }
  return index % 2 === 0 ? "lunch" : "dinner";
}

function canSplitForMealPlanning(food: Food): boolean {
  const text = foodDescriptorText(food);
  if (food.category === "vegetable") return true;
  if (food.category === "supplement") return true;
  if (food.category === "dish" || food.category === "fastfood") return isClearlyShareablePreparedFood(text);
  if (food.category === "fruit") return isShareableFruit(text, food);
  if (food.category === "snack") return isStorableSnack(text);
  if (food.category === "drink") return isResealableDrink(text, food);
  if (food.category === "protein") return !isSmallWholeUnit(food, text);
  if (food.category === "staple") return !isSmallWholeUnit(food, text) && !isCookedBowlFood(text);
  return true;
}

function canScaleForMacroClosure(food: Food): boolean {
  if (!canSplitForMealPlanning(food)) return false;
  if (food.category === "vegetable" || food.category === "fruit" || food.category === "snack" || food.category === "drink") return false;
  return food.category === "protein" || food.category === "staple" || food.category === "supplement" || food.proteinPer100g >= 12 || food.carbsPer100g >= 16;
}

function portionMinGrams(food: Food): number {
  if (food.category === "vegetable") return 80;
  if (food.category === "drink") return 150;
  if (food.category === "snack") return 20;
  if (food.category === "supplement") return 20;
  return 40;
}

function portionMaxGrams(food: Food, meal: MealPlannerMeal): number {
  if (food.category === "vegetable") return meal === "breakfast" ? 120 : 220;
  if (food.category === "fruit") return 200;
  if (food.category === "staple") return meal === "breakfast" ? 160 : 420;
  if (food.category === "protein") return meal === "breakfast" ? 140 : 320;
  if (food.category === "supplement") return 60;
  if (food.category === "drink") return 500;
  if (food.category === "snack") return 60;
  return 420;
}

function planningMaxGrams(food: Food, meal: MealPlannerMeal): number {
  const base = portionMaxGrams(food, meal);
  if (food.carbsPer100g <= 8 && (food.category === "protein" || food.proteinPer100g >= 12)) {
    return Math.round(base * 2.2);
  }
  return base;
}

function foodDescriptorText(food: Food): string {
  return [food.name, ...food.aliases, food.id, ...(food.servingUnits?.map((unit) => unit.name) ?? [])].join(" ");
}

function isClearlyShareablePreparedFood(text: string): boolean {
  return /披萨|比萨|pizza|烤鸡|炸鸡|火锅|冒菜/i.test(text);
}

function isShareableFruit(text: string, food: Food): boolean {
  if (/葡萄|西瓜|蓝莓|草莓|车厘子|樱桃|grape|berry|watermelon/i.test(text)) return true;
  return (food.servingUnits ?? []).some((unit) => /份|盒|串|把|盘/.test(unit.name));
}

function isStorableSnack(text: string): boolean {
  return /坚果|腰果|巴旦木|核桃|开心果|花生|麦片|燕麦|锅巴|薯片|饼干|巧克力|chocolate|nuts/i.test(text);
}

function isResealableDrink(text: string, food: Food): boolean {
  if (/蛋白|奶粉|咖啡粉|豆浆粉/i.test(text)) return true;
  return (food.servingUnits ?? []).some((unit) => /瓶|桶|壶/.test(unit.name));
}

function isSmallWholeUnit(food: Food, text: string): boolean {
  if (food.category === "protein" && food.proteinPer100g >= 18 && !/鸡蛋|鸭蛋|鹅蛋|egg/i.test(text)) return false;
  if (/鸡蛋|香蕉|苹果|橙子|汉堡|包子|馒头|烧饼|油条|egg|banana|apple|burger/i.test(text)) return true;
  return food.defaultUnitGram <= 130 && (food.servingUnits ?? []).some((unit) => isWholeServingUnit(unit.name));
}

function isCookedBowlFood(text: string): boolean {
  return /炒面|拌面|牛肉面|拉面|米线|粉丝|鸡汤面|馄饨|盖饭|炒饭|焖饭|方便面|泡面|桶面|杯面|instant/i.test(text);
}

function isWholeServingUnit(unitName: string): boolean {
  return /^(个|颗|只|枚|块|片|碗|份|盒|包|串|根|条|粒|勺|杯|瓶|罐|盘|锅|袋|双)$/i.test(unitName);
}

function isLowCarbDay(dayType?: string): boolean {
  return dayType === "low-carb" || dayType === "very-low-carb" || dayType === "depletion-carb";
}

function portionToFoodFallback(portion: FoodPortion): Food {
  const factor = Math.max(1, portion.grams) / 100;
  return {
    id: portion.foodId,
    name: portion.name,
    aliases: [],
    category: "dish",
    caloriesPer100g: portion.totals.calories / factor,
    proteinPer100g: portion.totals.proteinG / factor,
    fatPer100g: portion.totals.fatG / factor,
    carbsPer100g: portion.totals.carbsG / factor,
    defaultUnitGram: portion.grams
  };
}

function zeroTotals(): NutritionTotals {
  return { calories: 0, proteinG: 0, fatG: 0, carbsG: 0 };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
