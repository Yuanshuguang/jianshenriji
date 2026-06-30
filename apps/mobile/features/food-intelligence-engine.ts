export {
  normalizeFoodText,
  parseFoodIntelligence,
  type FoodIntelligenceItem,
  type FoodIntelligenceResult,
  type FoodMealSlot,
  type FoodServingContext
} from "./food-parser-engine";

export {
  buildFoodIntelligenceFallbackRequests,
  createTemporaryFoodRuleFromFallback,
  parseFoodIntelligencePipeline,
  type FoodIntelligenceFallbackReason,
  type FoodIntelligenceFallbackRequest,
  type FoodIntelligencePipelineResult,
  type TemporaryFoodRule
} from "./food-intelligence-pipeline";

export {
  buildFoodRecognitionReview,
  buildFoodRecognitionReviews,
  type FoodDefaultAssumption,
  type FoodMissingField,
  type FoodMissingFieldKind,
  type FoodNutritionEstimate,
  type FoodRecognitionReview
} from "./food-ontology-review";

export {
  resolveFoodNutrition,
  resolveFoodNutritionFromSelection,
  type FoodNutritionResolveInput,
  type FoodNutritionResolution
} from "./food-nutrition-resolver";

export {
  buildFoodOntology,
  classifyFoodOntology,
  foodNeedsOntologyClarification,
  type FoodOntologyContext,
  type FoodOntologyDimension,
  type FoodOntologyDimensionKind,
  type FoodOntologyGranularity,
  type FoodOntologyMarketScope,
  type FoodOntologyNode,
  type FoodOntologySourceLayer
} from "./food-ontology";

export {
  buildFoodKnowledgeLookupRequests,
  inferKnowledgeIntent,
  normalizeBaiduDishRecognitionResponse,
  ontologySourceLayerToKnowledgeSource,
  preferredSourcesForOntology,
  preferredSourcesForIntent,
  type BaiduDishRecognitionCandidate,
  type FoodKnowledgeFallbackInput,
  type FoodKnowledgeLookupRequest,
  type FoodKnowledgeQueryIntent,
  type FoodKnowledgeSourceId,
  type FoodSemanticSummary
} from "./food-knowledge-sources";

export {
  normalizeSemanticText,
  parseFoodSemantics,
  type FoodSemanticParseResult,
  type FoodSemanticSegment,
  type FoodSemanticToken,
  type FoodSemanticTokenRole
} from "./food-semantic-parser";