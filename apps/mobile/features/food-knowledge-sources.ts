import type { FoodMealSlot } from "./food-parser-engine";
import type { FoodOntologyNode, FoodOntologySourceLayer } from "./food-ontology";
import type { FoodSemanticParseResult, FoodSemanticTokenRole } from "./food-semantic-parser";

export type FoodKnowledgeSourceId =
  | "local-china-curated"
  | "baidu-dish-image"
  | "open-food-facts"
  | "usda-fdc"
  | "llm-structured-fallback";

export type FoodKnowledgeQueryIntent =
  | "chinese-prepared-dish"
  | "domestic-packaged-food"
  | "generic-natural-food"
  | "image-dish-recognition"
  | "ambiguous-text";

export type FoodKnowledgeFallbackInput = {
  rawText: string;
  normalizedText: string;
  reason: "unmatched" | "low-confidence" | "needs-details";
  ontology?: FoodOntologyNode;
  matchedFoodId?: string;
  matchedFoodName?: string;
  detailHint?: string;
};

export type FoodSemanticSummary = {
  meal: FoodMealSlot;
  foods: string[];
  quantities: string[];
  weights: string[];
  modifiers: string[];
  discardedText: string[];
};

export type FoodKnowledgeLookupRequest = {
  rawText: string;
  normalizedText: string;
  queryText: string;
  reason: FoodKnowledgeFallbackInput["reason"];
  intent: FoodKnowledgeQueryIntent;
  preferredSources: FoodKnowledgeSourceId[];
  semantic: FoodSemanticSummary;
  ontology?: FoodOntologyNode;
  matchedFoodId?: string;
  matchedFoodName?: string;
  detailHint?: string;
};

export type BaiduDishRecognitionCandidate = {
  name: string;
  calories?: number;
  confidence?: number;
  source: "baidu-dish-image";
};

type BaiduDishRecognitionRawItem = {
  name?: string;
  calorie?: string | number;
  calories?: string | number;
  probability?: string | number;
  score?: string | number;
};

type BaiduDishRecognitionRawResponse = {
  result?: BaiduDishRecognitionRawItem[];
};

const semanticRoles: Record<"foods" | "quantities" | "weights" | "modifiers", FoodSemanticTokenRole> = {
  foods: "food",
  quantities: "quantity",
  weights: "weight",
  modifiers: "modifier",
};

const packagedHints = /包|袋|盒|瓶|罐|条|听|支|康师傅|统一|蒙牛|伊利|三只松鼠|良品铺子|元气森林|可口可乐|百事|奥利奥|薯片|饼干|牛奶|酸奶|巧克力|布朗尼|蛋白粉/;
const globalNaturalFoodHints = /香蕉|苹果|玉米|土豆|红薯|鸡蛋|牛肉|鸡胸肉|西兰花|菠菜|蓝莓|草莓|牛奶|咖啡|可乐|汉堡/;
const chinesePreparedDishHints = /饭|粥|粉|面|饺|包子|馒头|炒|炖|卤|烧|蒸|煮|烤|炸|鸭|鸡|鱼|肉|豆腐脑|螺蛳粉|水饺|盐水鸭|麻辣|红烧|宫保|回锅|小笼包/;

export function buildFoodKnowledgeLookupRequests(
  fallbackRequests: FoodKnowledgeFallbackInput[],
  semantic: FoodSemanticParseResult
): FoodKnowledgeLookupRequest[] {
  return fallbackRequests.map((request) => {
    const semanticSummary = summarizeSemanticsForText(request.rawText, semantic);
    const queryText = buildKnowledgeQueryText(request, semanticSummary);
    const intent = inferKnowledgeIntent(queryText, semanticSummary, request.ontology);

    return {
      rawText: request.rawText,
      normalizedText: request.normalizedText,
      queryText,
      reason: request.reason,
      intent,
      preferredSources: preferredSourcesForIntent(intent, request.ontology),
      semantic: semanticSummary,
      ontology: request.ontology,
      matchedFoodId: request.matchedFoodId,
      matchedFoodName: request.matchedFoodName,
      detailHint: request.detailHint,
    };
  });
}

export function inferKnowledgeIntent(text: string, semantic: FoodSemanticSummary, ontology?: FoodOntologyNode): FoodKnowledgeQueryIntent {
  if (ontology?.sourceLayer === "domestic-packaged" || ontology?.marketScope === "brand-or-sku") return "domestic-packaged-food";
  if (ontology?.sourceLayer === "local-global-generic" || ontology?.marketScope === "global-common") return "generic-natural-food";
  if (ontology?.sourceLayer === "local-china-curated" || ontology?.marketScope === "china-mainland") return "chinese-prepared-dish";

  const haystack = `${text} ${semantic.foods.join(" ")} ${semantic.modifiers.join(" ")}`;
  if (packagedHints.test(haystack)) return "domestic-packaged-food";
  if (chinesePreparedDishHints.test(haystack)) return "chinese-prepared-dish";
  if (globalNaturalFoodHints.test(haystack)) return "generic-natural-food";
  return "ambiguous-text";
}

export function preferredSourcesForIntent(intent: FoodKnowledgeQueryIntent, ontology?: FoodOntologyNode): FoodKnowledgeSourceId[] {
  if (ontology) return preferredSourcesForOntology(ontology);

  switch (intent) {
    case "image-dish-recognition":
      return ["baidu-dish-image", "local-china-curated", "llm-structured-fallback"];
    case "domestic-packaged-food":
      return ["local-china-curated", "open-food-facts", "llm-structured-fallback"];
    case "generic-natural-food":
      return ["local-china-curated", "usda-fdc", "llm-structured-fallback"];
    case "chinese-prepared-dish":
      return ["local-china-curated", "llm-structured-fallback"];
    case "ambiguous-text":
    default:
      return ["local-china-curated", "llm-structured-fallback"];
  }
}

export function preferredSourcesForOntology(ontology: FoodOntologyNode): FoodKnowledgeSourceId[] {
  switch (ontology.sourceLayer) {
    case "domestic-packaged":
      return ["local-china-curated", "open-food-facts", "llm-structured-fallback"];
    case "local-global-generic":
      return ["local-china-curated", "usda-fdc", "llm-structured-fallback"];
    case "user-custom":
      return ["local-china-curated", "llm-structured-fallback"];
    case "online-temporary":
      return ["llm-structured-fallback", "local-china-curated"];
    case "local-china-curated":
    default:
      return ["local-china-curated", "llm-structured-fallback"];
  }
}

export function ontologySourceLayerToKnowledgeSource(sourceLayer: FoodOntologySourceLayer): FoodKnowledgeSourceId {
  switch (sourceLayer) {
    case "domestic-packaged":
      return "open-food-facts";
    case "local-global-generic":
      return "usda-fdc";
    case "online-temporary":
      return "llm-structured-fallback";
    case "user-custom":
    case "local-china-curated":
    default:
      return "local-china-curated";
  }
}

export function normalizeBaiduDishRecognitionResponse(response: BaiduDishRecognitionRawResponse): BaiduDishRecognitionCandidate[] {
  return (response.result ?? [])
    .map((item) => ({
      name: item.name?.trim() ?? "",
      calories: parseOptionalNumber(item.calorie ?? item.calories),
      confidence: parseOptionalNumber(item.probability ?? item.score),
      source: "baidu-dish-image" as const,
    }))
    .filter((item) => item.name.length > 0)
    .sort((left, right) => (right.confidence ?? 0) - (left.confidence ?? 0));
}

function summarizeSemanticsForText(rawText: string, semantic: FoodSemanticParseResult): FoodSemanticSummary {
  const exactTokens = semantic.tokens.filter((token) => rawText.includes(token.text));
  // 用 full-text tokens 作为后备，因为 rawText 可能只是食物短语的一部分（缺少前面的量词）
  const candidateTokens = exactTokens.length > 0 ? exactTokens : semantic.tokens;
  // quantities 和 weights 使用全部语义 tokens，避免漏掉来自前置量词的量词信息
  const allTokens = semantic.tokens;
  const meal = semantic.segments.find((segment) => rawText.includes(segment.rawText) || segment.rawText.includes(rawText))?.meal
    ?? candidateTokens.find((token) => token.meal)?.meal
    ?? "unknown";

  return {
    meal,
    foods: uniqueTexts(candidateTokens, semanticRoles.foods),
    quantities: uniqueTexts(allTokens, semanticRoles.quantities),
    weights: uniqueTexts(allTokens, semanticRoles.weights),
    modifiers: uniqueTexts(candidateTokens, semanticRoles.modifiers),
    discardedText: semantic.discardedText,
  };
}function buildKnowledgeQueryText(request: FoodKnowledgeFallbackInput, semantic: FoodSemanticSummary): string {
  const terms = [
    request.matchedFoodName,
    ...semantic.modifiers,
    ...semantic.foods,
    request.rawText,
  ].filter(Boolean);
  return Array.from(new Set(terms)).join(" ").trim() || request.rawText;
}

function uniqueTexts(tokens: FoodSemanticParseResult["tokens"], role: FoodSemanticTokenRole): string[] {
  return Array.from(new Set(
    tokens
      .filter((token) => token.role === role)
      .map((token) => token.text)
      .filter(Boolean)
  ));
}

function parseOptionalNumber(value: string | number | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}
