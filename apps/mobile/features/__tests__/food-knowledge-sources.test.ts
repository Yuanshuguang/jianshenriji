import test from "node:test";
import assert from "node:assert/strict";
import {
  inferKnowledgeIntent,
  normalizeBaiduDishRecognitionResponse,
  ontologySourceLayerToKnowledgeSource,
  parseFoodIntelligencePipeline,
  preferredSourcesForOntology,
  preferredSourcesForIntent,
  type FoodSemanticSummary,
} from "../food-intelligence-engine";

const emptySemantic: FoodSemanticSummary = {
  meal: "unknown",
  foods: [],
  quantities: [],
  weights: [],
  modifiers: [],
  discardedText: [],
};

test("知识源策略：中国菜和国内口语表达优先走本地中国库，不直接套国外品牌库", () => {
  const intent = inferKnowledgeIntent("一碗螺蛳粉", { ...emptySemantic, foods: ["螺蛳粉"] });

  assert.equal(intent, "chinese-prepared-dish");
  assert.deepEqual(preferredSourcesForIntent(intent), ["local-china-curated", "llm-structured-fallback"]);
});

test("知识源策略：包装食品才允许进入 Open Food Facts，天然通用食物才允许进入 USDA", () => {
  const packaged = inferKnowledgeIntent("一包薯片", { ...emptySemantic, quantities: ["一包"], foods: ["薯片"] });
  const natural = inferKnowledgeIntent("一个香蕉", { ...emptySemantic, quantities: ["一个"], foods: ["香蕉"] });

  assert.equal(packaged, "domestic-packaged-food");
  assert.deepEqual(preferredSourcesForIntent(packaged), ["local-china-curated", "open-food-facts", "llm-structured-fallback"]);
  assert.equal(natural, "generic-natural-food");
  assert.deepEqual(preferredSourcesForIntent(natural), ["local-china-curated", "usda-fdc", "llm-structured-fallback"]);
});

test("识别管线：fallback 请求携带语义摘要和数据源优先级，供后续 AI/联网兜底使用", () => {
  const result = parseFoodIntelligencePipeline("下午茶喝了3杯3勺蛋白粉，一碗螺蛳粉，神秘太空食物");
  const proteinPowder = result.knowledgeLookupRequests.find((item) => item.matchedFoodId === "protein-powder");
  const unmatched = result.knowledgeLookupRequests.find((item) => item.reason === "unmatched");

  assert.ok(proteinPowder);
  assert.equal(proteinPowder?.intent, "chinese-prepared-dish");
  assert.equal(proteinPowder?.ontology?.granularity, "supplement");
  assert.equal(proteinPowder?.ontology?.sourceLayer, "local-china-curated");
  assert.equal(proteinPowder?.semantic.meal, "snack");
  assert.ok(proteinPowder?.semantic.quantities.includes("3杯"));
  assert.ok(proteinPowder?.semantic.quantities.includes("3勺"));
  assert.deepEqual(proteinPowder?.preferredSources, ["local-china-curated", "llm-structured-fallback"]);

  assert.ok(unmatched);
  assert.equal(unmatched?.reason, "unmatched");
  assert.ok(unmatched?.preferredSources.includes("llm-structured-fallback"));
});

test("知识源策略：ontology 优先级高于正则猜测，避免面包/蛋白粉等词被误路由", () => {
  const result = parseFoodIntelligencePipeline("3个面包，半包干脆面，一碗螺蛳粉");
  const bread = result.knowledgeLookupRequests.find((item) => item.matchedFoodId === "bread");
  const crispyNoodles = result.knowledgeLookupRequests.find((item) => item.matchedFoodId === "crispy-noodles");
  const luosifen = result.knowledgeLookupRequests.find((item) => item.matchedFoodId === "luo-si-fan");

  assert.equal(bread?.ontology?.granularity, "generic");
  assert.equal(bread?.intent, "generic-natural-food");
  assert.deepEqual(bread?.preferredSources, ["local-china-curated", "usda-fdc", "llm-structured-fallback"]);

  assert.equal(crispyNoodles, undefined, "干脆面已是明确包装食品且无需补细分时，不应进入 fallback");
  assert.equal(luosifen?.ontology?.sourceLayer, "local-china-curated");
  assert.equal(luosifen?.intent, "chinese-prepared-dish");
  assert.deepEqual(luosifen?.preferredSources, ["local-china-curated", "llm-structured-fallback"]);
});

test("知识源策略：ontology sourceLayer 可稳定映射到外部数据源", () => {
  const result = parseFoodIntelligencePipeline("3个面包，半包干脆面");
  const bread = result.reviewItems.find((item) => item.foodId === "bread")?.ontology;
  const crispyNoodles = result.reviewItems.find((item) => item.foodId === "crispy-noodles")?.ontology;

  assert.ok(bread);
  assert.ok(crispyNoodles);
  assert.deepEqual(preferredSourcesForOntology(bread), ["local-china-curated", "usda-fdc", "llm-structured-fallback"]);
  assert.equal(ontologySourceLayerToKnowledgeSource(bread.sourceLayer), "usda-fdc");
  assert.deepEqual(preferredSourcesForOntology(crispyNoodles), ["local-china-curated", "open-food-facts", "llm-structured-fallback"]);
  assert.equal(ontologySourceLayerToKnowledgeSource(crispyNoodles.sourceLayer), "open-food-facts");
});

test("百度菜品识别适配层：只做结构化归一化，不把图片结果直接写入本地库", () => {
  const candidates = normalizeBaiduDishRecognitionResponse({
    result: [
      { name: "螺蛳粉", calorie: "520", probability: "0.81" },
      { name: "米线", calorie: "420", probability: "0.52" },
    ],
  });

  assert.deepEqual(candidates, [
    { name: "螺蛳粉", calories: 520, confidence: 0.81, source: "baidu-dish-image" },
    { name: "米线", calories: 420, confidence: 0.52, source: "baidu-dish-image" },
  ]);
});
