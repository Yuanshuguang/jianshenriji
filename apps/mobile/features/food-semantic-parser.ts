import { getFoodCatalog, type Food } from "@fitness-calendar/shared";
import type { FoodMealSlot } from "./food-parser-engine";

export type FoodSemanticTokenRole =
  | "time"
  | "action"
  | "quantity"
  | "weight"
  | "modifier"
  | "food"
  | "connector"
  | "noise"
  | "unknown";

export type FoodSemanticToken = {
  text: string;
  role: FoodSemanticTokenRole;
  start: number;
  end: number;
  meal?: FoodMealSlot;
  quantity?: number;
  unit?: string;
  foodId?: string;
};

export type FoodSemanticSegment = {
  rawText: string;
  normalizedText: string;
  meal: FoodMealSlot;
  start: number;
  end: number;
  marker?: FoodSemanticToken;
  tokens: FoodSemanticToken[];
};

export type FoodSemanticParseResult = {
  normalizedText: string;
  segments: FoodSemanticSegment[];
  tokens: FoodSemanticToken[];
  discardedText: string[];
};

type LexiconTerm = {
  text: string;
  food: Food;
};

const mealKeywords: Array<{ meal: FoodMealSlot; terms: string[] }> = [
  { meal: "breakfast", terms: ["早餐", "早饭", "早上", "早晨", "上午"] },
  { meal: "lunch", terms: ["午餐", "中餐", "中午", "午饭"] },
  { meal: "dinner", terms: ["晚餐", "晚饭", "晚上", "傍晚"] },
  { meal: "snack", terms: ["下午茶", "下午", "加餐", "零食", "夜宵", "宵夜"] },
];

const actionWords = [
  "吃了",
  "喝了",
  "吃",
  "喝",
  "加了",
  "加",
  "又吃了",
  "又喝了",
  "又",
  "还有",
  "以及",
  "外加",
  "准备",
  "记录",
];

const connectorWords = ["和", "跟", "与", "及", "以及", "加上", "然后", "再"];
const noiseWords = [
  "今天",
  "我",
  "实际",
  "随便",
  "顺手",
  "没忍住",
  "嘴馋",
  "有点饿",
  "差不多",
  "大概",
  "约",
  "了",
  "的",
];
const modifierWords = [
  "高蛋白",
  "低脂",
  "无糖",
  "少糖",
  "半糖",
  "全糖",
  "黑巧",
  "麻辣",
  "香辣",
  "原味",
  "炸蛋",
  "叉烧",
  "全麦",
  "脱脂",
  "低卡",
  "即食",
];

const countUnitPattern = "(个|颗|只|枚|根|条|片|块|份|顿|餐|碗|杯|瓶|罐|包|袋|把|串|勺|盒|盘|桶|锅|球|张|笼|拳头)";
const chineseDigitPattern = "[零一二两三四五六七八九十半]";
const quantityPattern = `([0-9]+(?:\\.[0-9]+)?|${chineseDigitPattern}+)\\s*(?:超大|大|小|中|中等|普通)?\\s*${countUnitPattern}`;
const explicitWeightPattern = `([0-9]+(?:\\.[0-9]+)?|${chineseDigitPattern}+)\\s*(kg|公斤|千克|斤|g|克)`;

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
  半: 0.5,
};

export function parseFoodSemantics(text: string, customFoods: Food[] = []): FoodSemanticParseResult {
  const normalizedText = normalizeSemanticText(text);
  if (!normalizedText) {
    return { normalizedText: "", segments: [], tokens: [], discardedText: [] };
  }

  const lexicon = buildFoodLexicon(customFoods);
  const allTokens = [
    ...detectMealTokens(normalizedText),
    ...detectPatternTokens(normalizedText, "weight", new RegExp(explicitWeightPattern, "g")),
    ...detectPatternTokens(normalizedText, "quantity", new RegExp(quantityPattern, "g")),
    ...detectWordTokens(normalizedText, actionWords, "action"),
    ...detectWordTokens(normalizedText, modifierWords, "modifier"),
    ...detectWordTokens(normalizedText, connectorWords, "connector"),
    ...detectWordTokens(normalizedText, noiseWords, "noise"),
    ...detectFoodTokens(normalizedText, lexicon),
  ];
  const tokens = mergeSemanticTokens(allTokens);
  const segments = buildSemanticSegments(normalizedText, tokens);
  const discardedText = tokens
    .filter((token) => token.role === "noise" || token.role === "connector" || token.role === "action")
    .map((token) => token.text);

  return {
    normalizedText,
    segments,
    tokens,
    discardedText: Array.from(new Set(discardedText)),
  };
}

export function normalizeSemanticText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[，。；：、,.!?:！？\n\r\t]/g, " ")
    .replace(/馅儿/g, "馅")
    .replace(/([早中晚])一个/g, "$1上")
    .replace(/\s+/g, " ")
    .trim();
}

function detectMealTokens(text: string): FoodSemanticToken[] {
  return mealKeywords.flatMap(({ meal, terms }) =>
    terms.flatMap((term) => findAllTerms(text, term).map(({ start, end }) => ({
      text: term,
      role: "time" as const,
      start,
      end,
      meal,
    })))
  );
}

function detectPatternTokens(text: string, role: "quantity" | "weight", pattern: RegExp): FoodSemanticToken[] {
  return Array.from(text.matchAll(pattern)).map((match) => ({
    text: match[0],
    role,
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
    quantity: parseQuantity(match[1] ?? "1"),
    unit: match[2],
  }));
}

function detectWordTokens(text: string, words: string[], role: FoodSemanticTokenRole): FoodSemanticToken[] {
  return words.flatMap((word) =>
    findAllTerms(text, word).map(({ start, end }) => ({
      text: word,
      role,
      start,
      end,
    }))
  );
}

function detectFoodTokens(text: string, lexicon: LexiconTerm[]): FoodSemanticToken[] {
  return lexicon.flatMap(({ text: term, food }) =>
    findAllTerms(text, term).map(({ start, end }) => ({
      text: term,
      role: "food" as const,
      start,
      end,
      foodId: food.id,
    }))
  );
}

function buildFoodLexicon(customFoods: Food[]): LexiconTerm[] {
  const seen = new Set<string>();
  return getFoodCatalog(customFoods)
    .flatMap((food) => [food.name, ...food.aliases].map((term) => ({ text: normalizeSemanticText(term), food })))
    .filter((item) => item.text.length >= 2)
    .filter((item) => {
      const key = `${item.text}:${item.food.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => right.text.length - left.text.length);
}

function buildSemanticSegments(text: string, tokens: FoodSemanticToken[]): FoodSemanticSegment[] {
  const markers = tokens
    .filter((token) => token.role === "time")
    .sort((left, right) => left.start - right.start || right.end - left.end);

  if (markers.length === 0) {
    return [{
      rawText: text,
      normalizedText: text,
      meal: "unknown",
      start: 0,
      end: text.length,
      tokens,
    }];
  }

  return markers.map((marker, index) => {
    const start = marker.start;
    const end = markers[index + 1]?.start ?? text.length;
    const segmentTokens = tokens.filter((token) => token.start >= start && token.end <= end);
    const rawText = text.slice(start, end).trim();

    return {
      rawText,
      normalizedText: rawText,
      meal: marker.meal ?? "unknown",
      start,
      end,
      marker,
      tokens: segmentTokens,
    };
  });
}

function mergeSemanticTokens(tokens: FoodSemanticToken[]): FoodSemanticToken[] {
  const priority: Record<FoodSemanticTokenRole, number> = {
    food: 9,
    weight: 8,
    quantity: 7,
    time: 6,
    modifier: 5,
    action: 4,
    connector: 3,
    noise: 2,
    unknown: 1,
  };
  const merged: FoodSemanticToken[] = [];

  for (const token of tokens.sort((left, right) =>
    left.start - right.start
      || right.end - left.end
      || priority[right.role] - priority[left.role]
  )) {
    const overlaps = merged.some((existing) => {
      const hasOverlap = token.start < existing.end && token.end > existing.start;
      if (!hasOverlap) return false;
      return !(token.role === "modifier" && existing.role === "food")
        && !(token.role === "food" && existing.role === "modifier");
    });
    if (!overlaps) merged.push(token);
  }

  return merged.sort((left, right) => left.start - right.start || left.end - right.end);
}

function findAllTerms(text: string, term: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  if (!term) return ranges;

  let offset = 0;
  while (offset < text.length) {
    const start = text.indexOf(term, offset);
    if (start < 0) break;
    ranges.push({ start, end: start + term.length });
    offset = start + term.length;
  }

  return ranges;
}

function parseQuantity(value: string): number {
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) return numeric;
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
