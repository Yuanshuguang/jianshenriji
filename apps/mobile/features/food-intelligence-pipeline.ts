import type { Food } from "@fitness-calendar/shared";
import { classifyFoodOntology, type FoodOntologyNode } from "./food-ontology";
import { parseFoodIntelligence, type FoodIntelligenceResult, type FoodServingContext } from "./food-parser-engine";
import { buildFoodKnowledgeLookupRequests, type FoodKnowledgeLookupRequest } from "./food-knowledge-sources";
import { buildFoodRecognitionReviews, type FoodRecognitionReview } from "./food-ontology-review";

export type FoodIntelligenceFallbackReason = "unmatched" | "low-confidence" | "needs-details";

export type FoodIntelligenceFallbackRequest = {
  rawText: string;
  normalizedText: string;
  reason: FoodIntelligenceFallbackReason;
  ontology?: FoodOntologyNode;
  matchedFoodId?: string;
  matchedFoodName?: string;
  confidence?: number;
  detailHint?: string;
};

export type FoodIntelligencePipelineResult = FoodIntelligenceResult & {
  fallbackRequests: FoodIntelligenceFallbackRequest[];
  knowledgeLookupRequests: FoodKnowledgeLookupRequest[];
  reviewItems: FoodRecognitionReview[];
};

export type TemporaryFoodRule = {
  phrase: string;
  food: Food;
  reason: FoodIntelligenceFallbackReason;
  createdAt: string;
};

export function parseFoodIntelligencePipeline(
  text: string,
  customFoods: Food[] = [],
  servingContext: FoodServingContext = {}
): FoodIntelligencePipelineResult {
  const result = parseFoodIntelligence(text, customFoods, servingContext);
  const fallbackRequests = buildFoodIntelligenceFallbackRequests(result);
  return {
    ...result,
    fallbackRequests,
    knowledgeLookupRequests: buildFoodKnowledgeLookupRequests(fallbackRequests, result.semantic),
    reviewItems: buildFoodRecognitionReviews(result.items),
  };
}

export function buildFoodIntelligenceFallbackRequests(result: FoodIntelligenceResult): FoodIntelligenceFallbackRequest[] {
  const unmatchedRequests = result.unmatched.map((rawText) => ({
    rawText,
    normalizedText: rawText,
    reason: "unmatched" as const,
  }));

  const matchedRequests = result.items
    .filter((item) => item.confidence < 0.72 || item.needsDetails)
    .map((item) => ({
      rawText: item.rawText,
      normalizedText: result.normalizedText,
      reason: item.needsDetails ? "needs-details" as const : "low-confidence" as const,
      ontology: classifyFoodOntology(item.food, {
        inputText: item.rawText,
        grams: item.grams,
        quantity: item.quantity,
        unit: item.unit,
      }),
      matchedFoodId: item.food.id,
      matchedFoodName: item.food.name,
      confidence: item.confidence,
      detailHint: item.detailHint,
    }));

  return [...unmatchedRequests, ...matchedRequests];
}

export function createTemporaryFoodRuleFromFallback(
  request: FoodIntelligenceFallbackRequest,
  food: Food,
  now: Date = new Date()
): TemporaryFoodRule {
  return {
    phrase: request.rawText,
    food: {
      ...food,
      aliases: Array.from(new Set([request.rawText, ...food.aliases].filter(Boolean))),
      source: food.source ?? "online",
    },
    reason: request.reason,
    createdAt: now.toISOString(),
  };
}
