import { getFoodCatalog, type Food } from "@fitness-calendar/shared";

export type FoodMealSlot = "breakfast" | "lunch" | "dinner" | "snack" | "unknown";

export type FoodServingContext = {
  dailyCalorieTarget?: number;
  defaultMeal?: FoodMealSlot;
};

export type FoodIntelligenceItem = {
  rawText: string;
  food: Food;
  grams: number;
  quantity?: number;
  unit?: string;
  meal: FoodMealSlot;
  confidence: number;
  needsConfirmation: boolean;
  source: "custom" | "builtin" | "online";
  reason: string;
  isDelta: boolean;
};

export type FoodIntelligenceResult = {
  normalizedText: string;
  items: FoodIntelligenceItem[];
  unmatched: string[];
  meal: FoodMealSlot;
  confidence: number;
};

type Candidate = {
  food: Food;
  normalizedTerm: string;
  sourceRank: number;
  categoryRank: number;
};

type MatchRange = {
  start: number;
  end: number;
  candidate: Candidate;
};

type MealMarker = {
  meal: FoodMealSlot;
  start: number;
  end: number;
};

const mealKeywords: Array<{ meal: FoodMealSlot; terms: string[] }> = [
  { meal: "breakfast", terms: ["早餐", "早饭", "早上", "早晨", "上午"] },
  { meal: "lunch", terms: ["午餐", "中餐", "中午", "午饭"] },
  { meal: "dinner", terms: ["晚餐", "晚饭", "晚上", "傍晚"] },
  { meal: "snack", terms: ["加餐", "零食", "夜宵", "宵夜", "下午茶", "下午"] }
];

const actionWords = [
  "今天",
  "准备",
  "实际",
  "记录",
  "早上",
  "早餐",
  "早饭",
  "上午",
  "中午",
  "午餐",
  "午饭",
  "晚上",
  "晚餐",
  "晚饭",
  "下午",
  "加餐",
  "零食",
  "夜宵",
  "宵夜",
  "吃了",
  "吃",
  "喝了",
  "喝",
  "还有",
  "又",
  "再",
  "和",
  "以及",
  "加上",
  "我",
  "了",
  "的"
];

const countUnits = ["个", "颗", "只", "枚", "根", "条", "片", "块", "份", "顿", "餐", "碗", "杯", "瓶", "罐", "包", "袋", "把", "串", "勺", "盒", "盘", "桶", "球", "张", "笼", "拳头"];
const countUnitPattern = "(个|颗|只|枚|根|条|片|块|份|顿|餐|碗|杯|瓶|罐|包|袋|把|串|勺|盒|盘|桶|球|张|笼|拳头)";
const chineseDigitPattern = "[零一二两三四五六七八九十半]";
const quantityPattern = `([0-9]+(?:\\.[0-9]+)?|${chineseDigitPattern}+)\\s*${countUnitPattern}`;
const pureQuantityPattern = new RegExp(`^${quantityPattern}$`);

const chineseDigits: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  半: 0.5
};

/** 常见手机型号参考重量（含外壳），用于「和 iPhone XX 一样重」类用户输入 */
const phoneWeightGrams: Record<string, number> = {
  "iphone 16 pro max": 227,
  "iphone 16 pro": 199,
  "iphone 16 plus": 199,
  "iphone 16": 170,
  "iphone 15 pro max": 221,
  "iphone 15 pro": 187,
  "iphone 15 plus": 201,
  "iphone 15": 171,
  "iphone 14 pro max": 240,
  "iphone 14 pro": 206,
  "iphone 14": 172,
  "iphone se 3": 144,
  "iphone se": 148,
  "iphone 13 mini": 141,
  "iphone 13": 174,
  "samsung galaxy s24 ultra": 232,
  "samsung s24 ultra": 232,
  "samsung s24+": 196,
  "samsung s24": 167,
  "samsung galaxy s25 ultra": 218,
  "xiaomi 14 ultra": 224,
  "xiaomi 14": 193,
  "oneplus 12": 220,
  "huawei mate 60 pro": 225,
  "huawei p60 pro": 200,
};

function detectPhoneGrams(text: string): number | null {
  let raw = text.toLowerCase();
  raw = raw.replace(/iphone(\d+)\s*pro\s*max/gi, "iphone $1 pro max");
  raw = raw.replace(/iphone(\d+)\s*pro/gi, "iphone $1 pro");
  raw = raw.replace(/iphone(\d+)/gi, "iphone $1");
  const cleaned = raw.replace(/[^a-z0-9\s+]/g, " ").replace(/\s+/g, " ").replace(/\s+/g, " ").trim();
  const sorted = Object.keys(phoneWeightGrams).sort((a, b) => b.length - a.length);
  for (const model of sorted) {
    const grams = phoneWeightGrams[model];
    /* 优先用原始文本子串匹配（保留完整型号），再试清洗后的 */
    if (raw.includes(model)) return grams;
    if (cleaned.includes(model.replace(/[^a-z0-9\s+]/g, " ").replace(/\s+/g, " ").trim())) return grams;
  }
  return null;
}

/** 模糊前缀增量：一大碗、大碗、超大份等 */
function detectSizeModifier(text: string): number {
  const matched = text.match(/(超?大?)(碗|份|块|盘|杯|瓶|个|根|条|片|把|包|袋)/);
  if (!matched) return 1;
  const sizeWord = matched[1] || "";
  if (sizeWord.includes("超大")) return 2;
  if (sizeWord.includes("大")) return 1.5;
  return 1;
}

export function parseFoodIntelligence(text: string, customFoods: Food[] = [], servingContext: FoodServingContext = {}): FoodIntelligenceResult {
  const normalizedText = normalizeFoodText(text);
  if (!normalizedText) {
    return { normalizedText: "", items: [], unmatched: [], meal: "unknown", confidence: 0 };
  }

  const mealMarkers = detectMealMarkers(normalizedText);
  const fallbackMeal = mealMarkers[0]?.meal ?? servingContext.defaultMeal ?? "unknown";
  const candidates = buildCandidates(customFoods);
  const ranges = findFoodRanges(normalizedText, candidates);
  const items = ranges.map((range, index) => buildItem(normalizedText, range, ranges, index, mealMarkers, fallbackMeal, servingContext, normalizedText));
  const unmatched = extractUnmatched(normalizedText, ranges);
  const confidence = items.length === 0
    ? 0
    : round2(items.reduce((sum, item) => sum + item.confidence, 0) / items.length);

  return {
    normalizedText,
    items,
    unmatched,
    meal: fallbackMeal,
    confidence
  };
}

export function normalizeFoodText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[，。；、,.!?！？\n\r\t]/g, " ")
    .replace(/馅儿/g, "馅")
    .replace(/([早中晚])一个/g, "$1上")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCandidates(customFoods: Food[]): Candidate[] {
  return getFoodCatalog(customFoods)
    .flatMap((food) => [food.name, ...food.aliases].map((term) => ({
      food,
      normalizedTerm: normalizeFoodText(term),
      sourceRank: food.source === "custom" ? 4 : food.id.startsWith("csv-") ? 2 : food.source === "builtin" || !food.source ? 3 : 1,
      categoryRank: food.category === "dish" || food.category === "fastfood" ? 2 : 1
    })))
    .filter((item) => item.normalizedTerm.length > 0 && !isInvalidFoodTerm(item.normalizedTerm))
    .sort((a, b) => {
      if (a.normalizedTerm.length !== b.normalizedTerm.length) return b.normalizedTerm.length - a.normalizedTerm.length;
      if (a.sourceRank !== b.sourceRank) return b.sourceRank - a.sourceRank;
      return b.categoryRank - a.categoryRank;
    });
}

function isInvalidFoodTerm(term: string): boolean {
  const normalized = normalizeFoodText(term);
  if (!normalized) return true;
  if (mealKeywords.some((item) => item.terms.includes(normalized))) return true;
  if (actionWords.includes(normalized)) return true;
  if (pureQuantityPattern.test(normalized)) return true;
  if (/^[0-9.]+$/.test(normalized)) return true;
  if (/^(kg|g|克|斤|公斤|千克)$/.test(normalized)) return true;
  return false;
}

function findFoodRanges(text: string, candidates: Candidate[]): MatchRange[] {
  const ranges: MatchRange[] = [];

  for (const candidate of candidates) {
    const variants = Array.from(new Set([
      candidate.normalizedTerm,
      candidate.normalizedTerm.replace(/儿/g, ""),
      candidate.normalizedTerm.replace(/馅/g, "馅儿")
    ])).filter(Boolean);

    for (const variant of variants) {
      let offset = 0;
      while (offset < text.length) {
        const start = text.indexOf(variant, offset);
        if (start < 0) break;
        const end = start + variant.length;
        if (!ranges.some((range) => start < range.end && end > range.start)) {
          ranges.push({ start, end, candidate });
        }
        offset = end;
      }
    }
  }

  return ranges.sort((a, b) => a.start - b.start);
}

function buildItem(
  text: string,
  range: MatchRange,
  ranges: MatchRange[],
  index: number,
  mealMarkers: MealMarker[],
  fallbackMeal: FoodMealSlot,
  servingContext: FoodServingContext,
  fullText: string
): FoodIntelligenceItem {
  const food = range.candidate.food;
  const mealMarker = nearestMealMarkerBefore(range.start, mealMarkers);
  const meal = mealMarker?.meal ?? fallbackMeal;
  const context = getFoodPhraseContext(text, range, ranges[index - 1], ranges[index + 1], mealMarker);
  const serving = estimateServing(context, food, meal, servingContext, fullText);
  const source = food.source === "custom" ? "custom" : food.source === "online" ? "online" : "builtin";
  const confidence = scoreConfidence(food, serving, range.candidate.normalizedTerm, context, meal);

  return {
    rawText: context,
    food,
    grams: serving.grams,
    quantity: serving.quantity,
    unit: serving.unit,
    meal,
    confidence,
    needsConfirmation: confidence < 0.72,
    source,
    reason: serving.reason,
    isDelta: /多吃|额外|加餐|少吃|少了|没吃|不吃/.test(context)
  };
}

function detectMealMarkers(text: string): MealMarker[] {
  const markers: MealMarker[] = [];
  for (const group of mealKeywords) {
    for (const term of group.terms) {
      let offset = 0;
      while (offset < text.length) {
        const start = text.indexOf(term, offset);
        if (start < 0) break;
        markers.push({ meal: group.meal, start, end: start + term.length });
        offset = start + term.length;
      }
    }
  }
  return markers.sort((a, b) => a.start - b.start);
}

function nearestMealMarkerBefore(foodStart: number, mealMarkers: MealMarker[]): MealMarker | undefined {
  return [...mealMarkers].reverse().find((marker) => marker.start <= foodStart);
}

function getFoodPhraseContext(
  text: string,
  range: MatchRange,
  previousRange: MatchRange | undefined,
  nextRange: MatchRange | undefined,
  mealMarker: MealMarker | undefined
): string {
  const hardLeft = Math.max(previousRange?.end ?? 0, mealMarker?.end ?? 0, lastSeparatorIndex(text, range.start - 1) + 1);
  const hardRight = Math.min(
    nextRange ? (findQuantityPrefixStart(text, nextRange.start, range.end) ?? nextRange.start) : text.length,
    nextSeparatorIndex(text, range.end) ?? text.length
  );
  const ownQuantityStart = findQuantityPrefixStart(text, range.start, hardLeft);
  const left = ownQuantityStart ?? trimLeadingActionWords(text, hardLeft, range.start);
  return text.slice(left, hardRight).trim();
}

function trimLeadingActionWords(text: string, left: number, foodStart: number): number {
  let prefix = text.slice(left, foodStart);
  let moved = left;
  let changed = true;
  while (changed) {
    changed = false;
    const next = prefix.trimStart();
    moved += prefix.length - next.length;
    prefix = next;
    for (const word of actionWords) {
      if (prefix.startsWith(word)) {
        moved += word.length;
        prefix = prefix.slice(word.length);
        changed = true;
        break;
      }
    }
  }
  return moved;
}

function lastSeparatorIndex(text: string, beforeIndex: number): number {
  return Math.max(
    text.lastIndexOf(" ", beforeIndex),
    text.lastIndexOf("，", beforeIndex),
    text.lastIndexOf("。", beforeIndex),
    text.lastIndexOf("；", beforeIndex),
    text.lastIndexOf("、", beforeIndex)
  );
}

function nextSeparatorIndex(text: string, afterIndex: number): number | null {
  const indexes = [" ", "，", "。", "；", "、"]
    .map((separator) => text.indexOf(separator, afterIndex))
    .filter((item) => item >= 0);
  return indexes.length > 0 ? Math.min(...indexes) : null;
}

function findQuantityPrefixStart(text: string, foodStart: number, minStart: number): number | null {
  const prefix = text.slice(minStart, foodStart);
  const match = prefix.match(new RegExp(`(?:${actionWords.join("|")})*\\s*${quantityPattern}(?:和手机差不多重的|差不多重的|拳头大的|拳头大|大的|大|的)?$`));
  return match?.index === undefined ? null : minStart + match.index;
}

function estimateServing(context: string, food: Food, meal: FoodMealSlot, servingContext: FoodServingContext, fullText: string): { grams: number; quantity?: number; unit?: string; reason: string } {
  /* 手机型号锚定重量 */
  const phoneGrams = detectPhoneGrams(fullText || context);
  if (phoneGrams) {
    const percentMatch = context.match(/重(\d+)\s*%/);
    const lighterMatch = context.match(/轻(\d+)\s*%/);
    const activePercent = percentMatch || lighterMatch;
    const multiplier = activePercent ? 1 + (Number(activePercent[1]) / 100) * (lighterMatch ? -1 : 1) : 1;
    const isSimilar = context.includes("差不多") || context.includes("一样");
    if (isSimilar && !activePercent) return { grams: Math.round(phoneGrams), unit: "手机", reason: "abstract-phone-anchor" };
    return { grams: Math.round(phoneGrams * multiplier), unit: "手机", reason: "abstract-phone-anchor" };
  }

  const explicitWeight = context.match(/([0-9]+(?:\.[0-9]+)?)\s*(kg|公斤|千克|斤|g|克)/i);
  if (explicitWeight) {
    const value = Number(explicitWeight[1]);
    const unit = explicitWeight[2].toLowerCase();
    if (unit === "kg" || unit === "公斤" || unit === "千克") return { grams: Math.round(value * 1000), unit, reason: "explicit-weight" };
    if (unit === "斤") return { grams: Math.round(value * 500), unit, reason: "explicit-weight" };
    return { grams: Math.round(value), unit, reason: "explicit-weight" };
  }

  const count = extractCountAndUnit(context);
  if (count) {
    if (isSemanticMealUnit(count.unit)) {
      const semanticServing = estimateSemanticMealServing(food, meal, count.quantity, servingContext);
      if (semanticServing) {
        return {
          grams: semanticServing,
          quantity: count.quantity,
          unit: count.unit,
          reason: "semantic-meal-serving"
        };
      }
    }

    if (/拳头/.test(context)) {
      return {
        grams: Math.round(160 * count.quantity),
        quantity: count.quantity,
        unit: count.unit,
        reason: "abstract-size"
      };
    }

    const servingUnit = findServingUnit(food, count.unit);
    if (servingUnit) {
      const sizeMod = detectSizeModifier(context);
      return {
        grams: Math.round(servingUnit.grams * count.quantity * sizeMod),
        quantity: count.quantity,
        unit: count.unit,
        reason: "food-serving-unit"
      };
    }

    const unitGram = commonUnitGram(count.unit, food.defaultUnitGram);
    const sizeMod = detectSizeModifier(context);
    return {
      grams: Math.round(unitGram * count.quantity * sizeMod),
      quantity: count.quantity,
      unit: count.unit,
      reason: "common-unit"
    };
  }

  if (/拳头/.test(context)) return { grams: 160, unit: "拳头", reason: "abstract-size" };
  if (/中等|普通|正常/.test(context)) return { grams: Math.round(food.defaultUnitGram), reason: "default-medium-size" };

  return { grams: Math.round(food.defaultUnitGram), reason: "default-food-serving" };
}

function extractCountAndUnit(context: string): { quantity: number; unit: string } | null {
  const matches = Array.from(context.matchAll(new RegExp(quantityPattern, "g")));
  const digit = matches.at(-1);
  if (digit) return { quantity: parseQuantity(digit[1]), unit: digit[2] };

  const unitOnly = context.match(new RegExp(`^\\s*${countUnitPattern}`));
  if (unitOnly) return { quantity: 1, unit: unitOnly[1] };
  return null;
}

function parseQuantity(value: string): number {
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) return numeric;
  return parseChineseNumber(value);
}

function parseChineseNumber(value: string): number {
  if (value === "半") return 0.5;
  if (value === "十") return 10;
  if (value.includes("十")) {
    const [tensRaw, onesRaw] = value.split("十");
    const tens = tensRaw ? chineseDigits[tensRaw] ?? 1 : 1;
    const ones = onesRaw ? chineseDigits[onesRaw] ?? 0 : 0;
    return tens * 10 + ones;
  }
  return chineseDigits[value] ?? 1;
}

function findServingUnit(food: Food, unit: string) {
  return food.servingUnits?.find((entry) => {
    const aliases = [entry.name, ...(entry.aliases ?? [])];
    return aliases.some((alias) => normalizeFoodText(alias) === normalizeFoodText(unit));
  });
}

function commonUnitGram(unit: string, fallback: number): number {
  const map: Record<string, number> = {
    个: fallback,
    颗: fallback,
    只: fallback,
    枚: fallback,
    根: fallback,
    条: fallback,
    片: Math.min(fallback, 60),
    块: fallback,
    份: fallback,
    顿: fallback,
    餐: fallback,
    碗: 250,
    杯: 250,
    瓶: 500,
    罐: 330,
    包: fallback,
    袋: fallback,
    把: Math.min(fallback, 30),
    串: fallback,
    勺: 10,
    盒: fallback,
    盘: fallback,
    桶: fallback,
    球: Math.min(fallback, 60),
    张: fallback,
    笼: fallback,
    拳头: 160
  };
  return map[unit] ?? fallback;
}

function isSemanticMealUnit(unit: string): boolean {
  return unit === "顿" || unit === "餐";
}

function estimateSemanticMealServing(food: Food, meal: FoodMealSlot, quantity: number, context: FoodServingContext): number | null {
  if (!context.dailyCalorieTarget || context.dailyCalorieTarget <= 0 || food.caloriesPer100g <= 0) return null;
  const ratio = semanticMealRatio(meal);
  const targetCalories = context.dailyCalorieTarget * ratio * quantity;
  const rawGrams = (targetCalories / food.caloriesPer100g) * 100;
  const bounds = semanticServingBounds(food);
  const grams = Math.max(bounds.min, Math.min(bounds.max, rawGrams));
  return Math.max(1, Math.round(grams / 10) * 10);
}

function semanticMealRatio(meal: FoodMealSlot): number {
  switch (meal) {
    case "breakfast":
      return 0.25;
    case "lunch":
      return 0.35;
    case "dinner":
      return 0.3;
    case "snack":
      return 0.1;
    default:
      return 0.3;
  }
}

function semanticServingBounds(food: Food): { min: number; max: number } {
  if (/火锅|麻辣烫|冒菜/.test(food.name)) return { min: 350, max: 900 };
  switch (food.category) {
    case "dish":
    case "fastfood":
      return { min: 250, max: 800 };
    case "staple":
      return { min: 250, max: 700 };
    case "protein":
      return { min: 120, max: 350 };
    case "vegetable":
      return { min: 150, max: 500 };
    case "fruit":
      return { min: 120, max: 400 };
    case "snack":
      return { min: 50, max: 200 };
    case "drink":
      return { min: 250, max: 600 };
    case "supplement":
      return { min: 30, max: 80 };
    default:
      return { min: 100, max: 500 };
  }
}

function scoreConfidence(food: Food, serving: { reason: string }, term: string, context: string, meal: FoodMealSlot): number {
  let score = 0.52;
  if (food.source === "custom") score += 0.16;
  if (food.source === "builtin" || !food.source) score += 0.1;
  if (food.confidenceLevel === "high") score += 0.06;
  if (food.category === "dish" || food.category === "fastfood") score += 0.06;
  if (term.length >= 4) score += 0.12;
  if (serving.reason === "explicit-weight" || serving.reason === "food-serving-unit") score += 0.16;
  if (serving.reason === "semantic-meal-serving") score += 0.12;
  if (serving.reason === "common-unit") score += 0.08;
  if (meal !== "unknown") score += 0.04;
  if (context.length > term.length) score += 0.02;
  return Math.min(0.98, round2(score));
}

function extractUnmatched(text: string, ranges: MatchRange[]): string[] {
  let remainder = text;
  for (const range of [...ranges].sort((a, b) => b.start - a.start)) {
    remainder = `${remainder.slice(0, range.start)} ${remainder.slice(range.end)}`;
  }

  for (const word of actionWords.flatMap((word) => [word, normalizeFoodText(word)])) {
    if (word) remainder = remainder.replace(new RegExp(word, "g"), " ");
  }

  for (const group of mealKeywords) {
    for (const term of group.terms) {
      remainder = remainder.replace(new RegExp(term, "g"), " ");
    }
  }

  remainder = remainder.replace(new RegExp(quantityPattern, "g"), " ");

  return Array.from(new Set(
    remainder
      .split(/\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 2 && !/^[0-9.]+$/.test(item))
  )).slice(0, 8);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
