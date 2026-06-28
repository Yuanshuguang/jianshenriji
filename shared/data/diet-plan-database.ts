import type { EnergyPlan, NutritionTotals } from "../index";

export type DietPlanCategory = "carb" | "fasting" | "balanced" | "niche";

export type DietDayType =
  | "balanced"
  | "high-carb"
  | "medium-carb"
  | "low-carb"
  | "very-low-carb"
  | "depletion-carb"
  | "fasting-low-calorie"
  | "normal-eating";

export type DietMacroRule = {
  caloriesMultiplier?: number;
  proteinMultiplier?: number;
  fatMultiplier?: number;
  carbsMultiplier?: number;
  minCalories?: number;
  minFatG?: number;
  minCarbsG?: number;
  maxCarbsG?: number;
};

export type DietCycleVariant = {
  id: string;
  name: string;
  description: string;
  cycleDays: DietDayType[];
  goalFit: string[];
  notes: string[];
};

export type DietPlan = {
  id: string;
  category: DietPlanCategory;
  name: string;
  tagline: string;
  logic: string;
  howToEat: string;
  pros: string[];
  cons: string[];
  suitableFor: string;
  formula: string;
  dayTypeRules: Partial<Record<DietDayType, DietMacroRule>>;
  defaultDayType: DietDayType;
  cycleVariants?: DietCycleVariant[];
};

export type DietPlanCycleSelection = {
  variantId?: string;
  customCycleDays?: DietDayType[];
};

export type DietPlanResolvedDay = {
  dayType: DietDayType;
  status: string;
  variantName?: string;
  cycleDayIndex?: number;
  cycleLength?: number;
  formula: string;
  notes: string[];
};

export const dietPlanCategoryLabels: Record<DietPlanCategory, string> = {
  balanced: "基础与宏量控制",
  carb: "碳水与训练日调控",
  fasting: "进食窗口控制",
  niche: "高级短期策略",
};

export const dietDayTypeLabels: Record<DietDayType, string> = {
  balanced: "均衡执行日",
  "high-carb": "高碳日",
  "medium-carb": "中碳日",
  "low-carb": "低碳日",
  "very-low-carb": "极低碳日",
  "depletion-carb": "断碳日",
  "fasting-low-calorie": "低热量日",
  "normal-eating": "正常饮食日",
};

const carbCyclingVariants: DietCycleVariant[] = [
  {
    id: "classic-3h-2m-2l",
    name: "经典三段式：三高两中两低",
    description: "7 天循环，高碳配大肌群或高强度力量训练，中碳配普通训练，低碳配休息日。",
    cycleDays: ["high-carb", "medium-carb", "low-carb", "high-carb", "medium-carb", "high-carb", "low-carb"],
    goalFit: ["新手减脂", "力量训练保肌", "塑形"],
    notes: ["高碳日建议安排腿、背或高消耗训练；低碳日避免连续超过 2 天。"],
  },
  {
    id: "classic-2h-3m-2l",
    name: "经典三段式：两高三中两低",
    description: "更温和的 7 天循环，适合训练频率较低、平台期恢复或女性塑形。",
    cycleDays: ["high-carb", "medium-carb", "low-carb", "medium-carb", "high-carb", "medium-carb", "low-carb"],
    goalFit: ["温和减脂", "上班族塑形", "平台期过渡"],
    notes: ["高碳日减少到 2 天，体重波动和饥饿感更可控。"],
  },
  {
    id: "two-stage-training-rest",
    name: "两段式：训练高碳 / 休息低碳",
    description: "只有高碳和低碳，计算简单，适合固定训练日和不想管理中碳日的人。",
    cycleDays: ["high-carb", "low-carb", "high-carb", "low-carb", "high-carb", "low-carb", "low-carb"],
    goalFit: ["上班族", "极简执行", "固定训练日"],
    notes: ["波动比三段式更大，低碳日后要防止暴食。"],
  },
  {
    id: "reverse-weekend-high",
    name: "反向碳循环：周初低碳 / 周末高碳",
    description: "先低后高，周末安排高碳恢复训练状态、代谢和心理压力。",
    cycleDays: ["low-carb", "low-carb", "medium-carb", "medium-carb", "high-carb", "high-carb", "low-carb"],
    goalFit: ["代谢偏低", "女生塑形", "减脂平台期"],
    notes: ["周末高碳仍然要在总热量预算内，不等于放纵餐。"],
  },
  {
    id: "ten-day-rolling",
    name: "轮动碳水循环：10 天周期",
    description: "拉长周期，适合大体重或长期减脂阶段，减少一周内波动。",
    cycleDays: ["low-carb", "medium-carb", "high-carb", "low-carb", "medium-carb", "low-carb", "high-carb", "medium-carb", "low-carb", "low-carb"],
    goalFit: ["大体重长期减脂", "长期执行", "降低周内波动"],
    notes: ["体重趋势建议按 10 天观察，不按单日体重判断。"],
  },
  {
    id: "periodic-depletion",
    name: "周期性断碳循环：每 2 周 1 次断碳日",
    description: "常规碳循环基础上加入极低断碳日，用于短期突破平台。",
    cycleDays: ["high-carb", "medium-carb", "low-carb", "high-carb", "medium-carb", "low-carb", "depletion-carb", "high-carb", "medium-carb", "low-carb", "high-carb", "medium-carb", "low-carb", "low-carb"],
    goalFit: ["短期平台突破", "执行力强的人"],
    notes: ["断碳日不建议频繁使用，训练强度、睡眠和情绪反馈要同步监控。"],
  },
];

export const dietPlans: DietPlan[] = [
  {
    id: "high-protein-balanced",
    category: "balanced",
    name: "高蛋白均衡饮食",
    tagline: "健身人群基础方案：蛋白充足，碳水和脂肪按目标回填",
    logic: "以热量目标和蛋白质优先为核心，先保证 1.8-2.2g/kg 左右蛋白，再分配碳水和脂肪。适合绝大多数增肌、减脂、塑形训练者。",
    howToEat: "每餐包含优质蛋白，主食粗细搭配，脂肪来源以鸡蛋、鱼类、坚果、橄榄油等为主，避免长期极端低碳。",
    pros: ["适用面最广", "训练状态稳定", "保肌肉", "容易长期坚持"],
    cons: ["减脂速度不激进", "需要持续记录总热量和蛋白"],
    suitableFor: "健身新手、力量训练者、减脂保肌、增肌期和长期塑形人群。",
    formula: "热量=目标热量；蛋白=基础蛋白*1.12；碳水和脂肪由剩余热量闭合。",
    defaultDayType: "balanced",
    dayTypeRules: { balanced: { proteinMultiplier: 1.12, minFatG: 30 } },
  },
  {
    id: "flexible-macro",
    category: "balanced",
    name: "灵活宏量饮食 / IIFYM",
    tagline: "按热量和三大营养素达标，不强制固定食物清单",
    logic: "用总热量、蛋白、脂肪、碳水作为硬约束，食物选择保留弹性。对健身人群来说，它比固定食谱更容易长期执行。",
    howToEat: "每天先完成蛋白和总热量，再按训练安排分配碳水。80%-90% 食物来自高质量食材，剩余少量留给社交和偏好。",
    pros: ["可持续性强", "社交成本低", "适合配合称重记录", "增肌减脂都能用"],
    cons: ["需要理解营养标签", "如果只看宏量可能忽略蔬菜、纤维和微量营养素"],
    suitableFor: "已经愿意记录饮食、需要长期增肌/减脂、经常外食但仍想控制体态的人群。",
    formula: "热量=目标热量；蛋白、脂肪、碳水沿用基础目标，并要求宏量热量闭合。",
    defaultDayType: "balanced",
    dayTypeRules: { balanced: {} },
  },
  {
    id: "carb-cycling",
    category: "carb",
    name: "碳循环饮食法",
    tagline: "训练日高碳、休息日低碳，按周期调节训练表现和热量缺口",
    logic: "根据训练强度安排碳水，高强度训练日补糖原，低强度或休息日降低碳水制造缺口。适合有规律训练且愿意记录的人。",
    howToEat: "选择三高两中两低、两高三中两低、两段式、反向碳循环、10 天轮动或周期性断碳。高碳日优先搭配腿、背、大重量训练。",
    pros: ["适合训练联动", "减脂时保训练表现", "平台期可调空间大"],
    cons: ["学习和记录成本高", "低碳日容易饥饿", "不适合完全不训练的人"],
    suitableFor: "规律力量训练者、减脂平台期、备赛/塑形、希望减脂但尽量保肌肉的人群。",
    formula: "基础热量不变；高碳=碳水*1.28；中碳=基础碳水；低碳=碳水*0.58；蛋白基本不变或略上调；脂肪由剩余热量闭合。",
    defaultDayType: "medium-carb",
    cycleVariants: carbCyclingVariants,
    dayTypeRules: {
      "high-carb": { carbsMultiplier: 1.28, proteinMultiplier: 1, minFatG: 25 },
      "medium-carb": { carbsMultiplier: 1, proteinMultiplier: 1, minFatG: 30 },
      "low-carb": { carbsMultiplier: 0.58, proteinMultiplier: 1.05, minFatG: 35 },
      "depletion-carb": { caloriesMultiplier: 0.85, carbsMultiplier: 0.2, proteinMultiplier: 1.05, maxCarbsG: 35, minFatG: 40 },
    },
  },
  {
    id: "low-carb",
    category: "carb",
    name: "低碳高蛋白饮食",
    tagline: "碳水 20-40%，蛋白提高，脂肪适量回填",
    logic: "降低碳水比例，提高蛋白和饱腹感，用稳定热量缺口减脂。更适合减脂期，不适合作为高强度增肌训练的长期默认方案。",
    howToEat: "主食集中在训练前后或早餐，其他餐以瘦肉、鱼虾、鸡蛋、豆制品、蔬菜和适量优质脂肪为主。",
    pros: ["饱腹感较强", "控食欲效果好", "适合减脂期"],
    cons: ["高强度训练可能乏力", "长期过低碳可能影响情绪、睡眠和训练表现"],
    suitableFor: "减脂期、久坐人群、容易被高碳水触发暴食但仍有训练安排的人。",
    formula: "热量=目标热量；蛋白=基础蛋白*1.05；碳水=max(80g, 基础碳水*0.62)；脂肪由剩余热量闭合。",
    defaultDayType: "low-carb",
    dayTypeRules: { "low-carb": { carbsMultiplier: 0.62, proteinMultiplier: 1.05, minCarbsG: 80, minFatG: 35 } },
  },
  {
    id: "keto",
    category: "carb",
    name: "生酮 / 极低碳饮食",
    tagline: "碳水 20-50g，适合短期控脂，不适合作为多数训练者默认方案",
    logic: "极低碳、高脂、蛋白适中，让身体更多依赖脂肪氧化。对力量和高强度训练表现可能不友好，应作为高级短期选项。",
    howToEat: "严格限制米面糖、豆类和大多数水果，以肉、蛋、鱼、低碳蔬菜、油脂类食物为主，并注意电解质和纤维。",
    pros: ["短期体重下降明显", "饱腹感强", "对部分人控食欲有效"],
    cons: ["训练表现可能下降", "执行难度高", "纤维和微量营养素风险高", "不适合长期盲目执行"],
    suitableFor: "有经验、能记录饮食并愿意监控训练表现的人；不建议孕妇、青少年、肝肾疾病或进食障碍风险人群使用。",
    formula: "热量=目标热量；蛋白=基础蛋白*1.05；碳水限制 20-50g；脂肪由剩余热量闭合。",
    defaultDayType: "very-low-carb",
    dayTypeRules: { "very-low-carb": { carbsMultiplier: 0.22, proteinMultiplier: 1.05, minCarbsG: 20, maxCarbsG: 50, minFatG: 45 } },
  },
  {
    id: "if-16-8",
    category: "fasting",
    name: "16+8 间歇性轻断食",
    tagline: "限制进食窗口，不主动改变当天宏量目标",
    logic: "把进食集中在 8 小时窗口内，剩余 16 小时不摄入有热量食物。它本质是时间管理，不是特殊宏量公式。",
    howToEat: "训练日优先把进食窗口覆盖训练前后，例如 10:00-18:00 或 12:00-20:00。窗口内仍然要完成蛋白和总热量。",
    pros: ["执行简单", "适合压缩进食次数", "对忙碌人群友好"],
    cons: ["不适合低血糖、胃病、暴食风险人群", "窗口内吃不够蛋白会影响恢复"],
    suitableFor: "上班族、习惯少餐、希望减少夜宵和零食，但仍能完成训练营养的人群。",
    formula: "进食窗口改变，不主动改变宏量；日目标=基础热量和三大营养素。",
    defaultDayType: "normal-eating",
    dayTypeRules: { "normal-eating": {} },
  },
];

export const dietPlansByCategory: Array<{ category: DietPlanCategory; label: string; plans: DietPlan[] }> = [
  { category: "balanced", label: dietPlanCategoryLabels.balanced, plans: dietPlans.filter((p) => p.category === "balanced") },
  { category: "carb", label: dietPlanCategoryLabels.carb, plans: dietPlans.filter((p) => p.category === "carb") },
  { category: "fasting", label: dietPlanCategoryLabels.fasting, plans: dietPlans.filter((p) => p.category === "fasting") },
];

export function getDietPlanById(id: string | null): DietPlan | undefined {
  if (!id) return undefined;
  return dietPlans.find((plan) => plan.id === id);
}

export function resolveDietPlanDay(
  planId: string | null,
  date: Date,
  selection: DietPlanCycleSelection = {},
): DietPlanResolvedDay {
  const plan = getDietPlanById(planId);
  if (!plan) {
    return {
      dayType: "balanced",
      status: "日常执行",
      formula: "默认使用基础热量和三大营养素目标。",
      notes: ["未选择饮食计划时，不套用特殊周期。"],
    };
  }

  const customCycleDays = selection.customCycleDays?.length ? selection.customCycleDays : undefined;
  const variant = plan.cycleVariants?.find((item) => item.id === selection.variantId) ?? plan.cycleVariants?.[0];
  const cycleDays = customCycleDays ?? variant?.cycleDays;

  if (cycleDays?.length) {
    const dayIndex = getCycleDayIndex(date, cycleDays.length);
    const dayType = cycleDays[dayIndex] ?? plan.defaultDayType;
    return {
      dayType,
      status: dietDayTypeLabels[dayType],
      variantName: customCycleDays ? "用户自定义周期" : variant?.name,
      cycleDayIndex: dayIndex,
      cycleLength: cycleDays.length,
      formula: plan.formula,
      notes: customCycleDays ? ["当前使用用户自定义高/中/低碳周期。"] : variant?.notes ?? [],
    };
  }

  return {
    dayType: plan.defaultDayType,
    status: dietDayTypeLabels[plan.defaultDayType],
    formula: plan.formula,
    notes: [],
  };
}

export function calculateDietPlanMacroTargets(
  planId: string | null,
  energyPlan: EnergyPlan,
  input: { date?: Date; dayType?: DietDayType; selection?: DietPlanCycleSelection } = {},
): NutritionTotals {
  const plan = getDietPlanById(planId);
  const base = roundTargets(energyPlan);
  if (!plan) return base;

  const dayType = input.dayType ?? resolveDietPlanDay(planId, input.date ?? new Date(), input.selection).dayType;
  const rule = plan.dayTypeRules[dayType] ?? plan.dayTypeRules[plan.defaultDayType] ?? {};
  return applyMacroRule(base, rule);
}

function getCycleDayIndex(date: Date, cycleLength: number): number {
  if (cycleLength === 7) {
    return (date.getDay() + 6) % 7;
  }

  const dateBucket = Math.floor(date.getTime() / 86400000);
  return ((dateBucket % cycleLength) + cycleLength) % cycleLength;
}

function applyMacroRule(base: NutritionTotals, rule: DietMacroRule): NutritionTotals {
  const calories = Math.max(
    rule.minCalories ?? 0,
    Math.round(base.calories * (rule.caloriesMultiplier ?? 1)),
  );
  const proteinG = Math.round(base.proteinG * (rule.proteinMultiplier ?? 1));
  const minCarbsG = rule.minCarbsG ?? 0;
  const maxCarbsG = rule.maxCarbsG ?? Number.POSITIVE_INFINITY;
  const rawCarbsG = Math.round(base.carbsG * (rule.carbsMultiplier ?? 1));
  let carbsG = clamp(rawCarbsG, minCarbsG, maxCarbsG);
  const explicitFatG = rule.fatMultiplier ? Math.round(base.fatG * rule.fatMultiplier) : undefined;
  const remainingFatG = Math.round((calories - proteinG * 4 - carbsG * 4) / 9);
  let fatG = Math.max(rule.minFatG ?? 25, explicitFatG ?? remainingFatG);

  // 当最低脂肪要求抬高脂肪时，回收碳水来维持总热量与宏量热量闭合。
  carbsG = clamp(Math.round((calories - proteinG * 4 - fatG * 9) / 4), minCarbsG, maxCarbsG);
  fatG = Math.max(rule.minFatG ?? 25, explicitFatG ?? Math.round((calories - proteinG * 4 - carbsG * 4) / 9));
  const closed = closeMacroTarget({
    calories,
    proteinG,
    carbsG,
    fatG,
    minCarbsG,
    maxCarbsG,
    minFatG: rule.minFatG ?? 25,
    lockedFatG: explicitFatG,
  });

  return {
    calories,
    proteinG,
    fatG: closed.fatG,
    carbsG: closed.carbsG,
  };
}

function closeMacroTarget(input: {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  minCarbsG: number;
  maxCarbsG: number;
  minFatG: number;
  lockedFatG?: number;
}): { carbsG: number; fatG: number } {
  const candidates: Array<{ carbsG: number; fatG: number; drift: number; distance: number }> = [];
  const fatStart = input.lockedFatG ?? Math.max(input.minFatG, input.fatG - 20);
  const fatEnd = input.lockedFatG ?? Math.max(input.minFatG, input.fatG + 20);

  for (let fatG = fatStart; fatG <= fatEnd; fatG += 1) {
    const carbsG = clamp(
      Math.round((input.calories - input.proteinG * 4 - fatG * 9) / 4),
      input.minCarbsG,
      input.maxCarbsG,
    );
    const drift = Math.abs(input.proteinG * 4 + fatG * 9 + carbsG * 4 - input.calories);
    const distance = Math.abs(fatG - input.fatG) + Math.abs(carbsG - input.carbsG);
    candidates.push({ carbsG, fatG, drift, distance });
  }

  candidates.sort((a, b) => a.drift - b.drift || a.distance - b.distance);
  return candidates[0] ?? { carbsG: input.carbsG, fatG: input.fatG };
}

function roundTargets(energyPlan: NutritionTotals): NutritionTotals {
  return {
    calories: Math.round(energyPlan.calories),
    proteinG: Math.round(energyPlan.proteinG),
    fatG: Math.round(energyPlan.fatG),
    carbsG: Math.round(energyPlan.carbsG),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
