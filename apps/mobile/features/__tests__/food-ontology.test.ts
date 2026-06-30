import assert from "node:assert/strict";
import test from "node:test";
import { getFoodCatalog } from "@fitness-calendar/shared";
import {
  buildFoodOntology,
  classifyFoodOntology,
  foodNeedsOntologyClarification,
  parseFoodIntelligencePipeline,
} from "../food-intelligence-engine";

function catalogFood(id: string) {
  const food = getFoodCatalog().find((item) => item.id === id);
  assert.ok(food, `missing food ${id}`);
  return food;
}

test("中国本地 FoodOntology：泛化食物必须带可追问维度，不能直接硬算成具体类型", () => {
  const bread = classifyFoodOntology(catalogFood("bread"), { inputText: "3个面包" });
  const dumplings = classifyFoodOntology(catalogFood("dumplings"), { inputText: "一碗水饺" });

  assert.equal(bread.granularity, "generic");
  assert.equal(bread.dimensions[0]?.label, "面包类型");
  assert.equal(bread.dimensions[0]?.required, true);
  assert.ok(bread.dimensions[0]?.options.some((option) => option.label === "全麦面包"));

  assert.equal(dumplings.granularity, "generic");
  assert.equal(dumplings.marketScope, "china-mainland");
  assert.equal(dumplings.sourceLayer, "local-china-curated");
  assert.equal(dumplings.dimensions[0]?.label, "水饺馅料");
  assert.equal(foodNeedsOntologyClarification(dumplings), true);
});

test("中国本地 FoodOntology：明确食物只保留已收敛维度，不继续追问同义做法", () => {
  const steamedEgg = classifyFoodOntology(catalogFood("egg"), { inputText: "两个蒸蛋" });

  assert.equal(steamedEgg.granularity, "specific-food");
  assert.equal(steamedEgg.dimensions[0]?.label, "鸡蛋做法");
  assert.equal(steamedEgg.dimensions[0]?.required, false);
  assert.deepEqual(steamedEgg.dimensions[0]?.options.map((option) => option.label), ["蒸蛋"]);
  assert.equal(foodNeedsOntologyClarification(steamedEgg), false);
});

test("中国本地 FoodOntology：成品菜、包装食品、补剂分层，后续可走不同数据源", () => {
  const luosifen = classifyFoodOntology(catalogFood("luo-si-fan"), { inputText: "一碗螺蛳粉" });
  const crispyNoodles = classifyFoodOntology(catalogFood("crispy-noodles"), { inputText: "半包干脆面" });
  const proteinPowder = classifyFoodOntology(catalogFood("protein-powder"), { inputText: "3勺蛋白粉" });

  assert.equal(luosifen.marketScope, "china-mainland");
  assert.equal(luosifen.sourceLayer, "local-china-curated");
  assert.equal(luosifen.dimensions[0]?.label, "螺蛳粉加料");

  assert.equal(crispyNoodles.granularity, "packaged-sku");
  assert.equal(crispyNoodles.marketScope, "brand-or-sku");
  assert.equal(crispyNoodles.sourceLayer, "domestic-packaged");

  assert.equal(proteinPowder.granularity, "supplement");
  assert.equal(proteinPowder.dimensions[0]?.label, "蛋白粉类型");
});

test("识别管线：reviewItems 携带 ontology，UI 和后续 AI 兜底不再重新猜分类", () => {
  const result = parseFoodIntelligencePipeline("一个鸡蛋，两个蒸蛋，3个面包，一碗水饺，半包干脆面");
  const byId = new Map(result.reviewItems.map((item) => [item.foodId, item]));

  assert.equal(byId.get("egg")?.ontology.dimensions[0]?.label, "鸡蛋做法");
  assert.equal(byId.get("egg")?.ontology.dimensions[0]?.required, true);
  assert.equal(byId.get("bread")?.ontology.granularity, "generic");
  assert.equal(byId.get("dumplings")?.ontology.sourceLayer, "local-china-curated");
  assert.equal(byId.get("crispy-noodles")?.ontology.sourceLayer, "domestic-packaged");
});

test("中国本地 FoodOntology：可从运行时食物库批量生成节点，并覆盖核心类型", () => {
  const nodes = buildFoodOntology();
  const ids = new Set(nodes.map((node) => node.foodId));

  assert.ok(nodes.length >= getFoodCatalog().length);
  assert.ok(ids.has("dumplings"));
  assert.ok(ids.has("bread"));
  assert.ok(ids.has("luo-si-fan"));
  assert.ok(ids.has("protein-powder"));
});
