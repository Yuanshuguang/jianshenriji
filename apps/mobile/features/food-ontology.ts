import { getFoodCatalog, type Food, type FoodCategory } from "@fitness-calendar/shared";
import { getFoodVariantDetailStatus, type FoodVariantOption } from "./food-variant-options";

export type FoodOntologyGranularity =
  | "generic"
  | "ingredient"
  | "specific-food"
  | "prepared-dish"
  | "packaged-sku"
  | "supplement";

export type FoodOntologyMarketScope = "china-mainland" | "global-common" | "brand-or-sku" | "unknown";

export type FoodOntologySourceLayer =
  | "local-china-curated"
  | "local-global-generic"
  | "domestic-packaged"
  | "user-custom"
  | "online-temporary";

export type FoodOntologyDimensionKind =
  | "cooking"
  | "processing"
  | "flavor"
  | "filling"
  | "sweetness"
  | "fatLevel"
  | "topping"
  | "serving"
  | "brand";

export type FoodOntologyDimension = {
  key: FoodOntologyDimensionKind;
  label: string;
  required: boolean;
  reason: string;
  options: FoodVariantOption[];
};

export type FoodOntologyNode = {
  foodId: string;
  foodName: string;
  category: FoodCategory;
  granularity: FoodOntologyGranularity;
  marketScope: FoodOntologyMarketScope;
  sourceLayer: FoodOntologySourceLayer;
  aliases: string[];
  dimensions: FoodOntologyDimension[];
  defaultAssumption: string;
  isChinaPriority: boolean;
};

export type FoodOntologyContext = {
  inputText?: string;
  grams?: number;
  quantity?: number;
  unit?: string;
};

const dimensionKindByVariantKind: Record<FoodVariantOption["kind"], FoodOntologyDimensionKind> = {
  cooking: "cooking",
  processing: "processing",
  flavor: "flavor",
  filling: "filling",
  sweetness: "sweetness",
  fatLevel: "fatLevel",
  topping: "topping",
};

const chinaPreparedFoodHints = /饭|粥|粉|面|饺|馄饨|包子|馒头|烧饼|豆腐脑|豆花|螺蛳粉|麻辣|红烧|黄焖|宫保|回锅|卤|盐水鸭|烤鸭|小笼包|煎饼|油条|火锅|冒菜|麻辣烫/;
const globalCommonFoodHints = /香蕉|苹果|玉米|土豆|红薯|鸡蛋|牛肉|鸡胸肉|鱼|虾|牛奶|咖啡|可乐|汉堡|披萨|面包|燕麦|西兰花|菠菜|蓝莓|巧克力/;
const packagedFoodHints = /包|袋|盒|瓶|罐|条|听|支|薯片|饼干|干脆面|烤馍|黑巧|布朗尼|牛奶|酸奶|蛋白粉|奶片|奶皮子|品牌|sku|SKU/;

const genericFoodIds = new Set([
  "bread",
  "dumplings",
  "baozi",
  "wonton",
  "egg",
  "tofu",
  "peanuts",
  "nuts",
  "milk-tea",
  "coffee",
  "milk",
  "yogurt",
  "protein-powder",
  "chocolate",
  "congee",
  "noodles",
  "soup",
]);

const globalCommonFoodIds = new Set([
  "bread",
  "egg",
  "chicken-breast",
  "beef",
  "lean-beef",
  "fish",
  "shrimp",
  "milk",
  "yogurt",
  "banana",
  "apple",
  "orange",
  "grape",
  "watermelon",
  "corn",
  "potato",
  "sweet-potato",
  "broccoli",
  "spinach",
  "coffee",
  "americano",
  "latte",
  "cola",
  "hamburger",
  "pizza",
  "chocolate",
  "dark-chocolate",
]);

export function buildFoodOntology(customFoods: Food[] = []): FoodOntologyNode[] {
  return getFoodCatalog(customFoods).map((food) => classifyFoodOntology(food));
}

export function classifyFoodOntology(food: Food, context: FoodOntologyContext = {}): FoodOntologyNode {
  const detailStatus = getFoodVariantDetailStatus(food, context);
  const dimensions = buildOntologyDimensions(detailStatus);
  const granularity = inferFoodGranularity(food, context, dimensions);
  const marketScope = inferMarketScope(food, context);
  const sourceLayer = inferSourceLayer(food, marketScope);

  return {
    foodId: food.id,
    foodName: food.name,
    category: food.category,
    granularity,
    marketScope,
    sourceLayer,
    aliases: food.aliases,
    dimensions,
    defaultAssumption: buildDefaultAssumption(food, granularity, dimensions),
    isChinaPriority: marketScope === "china-mainland" || sourceLayer === "local-china-curated",
  };
}

export function foodNeedsOntologyClarification(node: FoodOntologyNode): boolean {
  return node.dimensions.some((dimension) => dimension.required);
}

function buildOntologyDimensions(detailStatus: ReturnType<typeof getFoodVariantDetailStatus>): FoodOntologyDimension[] {
  if (detailStatus.options.length === 0) return [];

  const firstKind = detailStatus.options[0]?.kind ?? "processing";
  const key = dimensionKindByVariantKind[firstKind];
  return [{
    key,
    label: detailStatus.groupLabel,
    required: detailStatus.needsDetails,
    reason: detailStatus.needsDetails
      ? `需要确认${detailStatus.groupLabel}，否则只能按默认类型估算`
      : `${detailStatus.groupLabel}已由食物名称或上下文收敛`,
    options: detailStatus.options,
  }];
}

function inferFoodGranularity(
  food: Food,
  context: FoodOntologyContext,
  dimensions: FoodOntologyDimension[]
): FoodOntologyGranularity {
  const text = ontologyText(food, context);
  if (food.category === "supplement") return "supplement";
  if (isPackagedFood(food, context)) return "packaged-sku";
  if (dimensions.some((dimension) => !dimension.required && dimension.options.length === 1)) return "specific-food";
  if (dimensions.some((dimension) => dimension.required) || genericFoodIds.has(food.id)) return "generic";
  if (food.category === "dish" || food.category === "fastfood") return "prepared-dish";
  if (/蒸蛋|鸡蛋羹|水煮蛋|煎蛋|卤蛋|炸蛋|甜豆腐脑|咸豆腐脑|全麦面包|菠萝包|黑巧克力|螺蛳粉/.test(text)) return "specific-food";
  return "ingredient";
}

function inferMarketScope(food: Food, context: FoodOntologyContext): FoodOntologyMarketScope {
  const text = ontologyText(food, context);
  if (isPackagedFood(food, context)) return "brand-or-sku";
  if (globalCommonFoodIds.has(food.id)) return "global-common";
  if (chinaPreparedFoodHints.test(text)) return "china-mainland";
  if (globalCommonFoodHints.test(text)) return "global-common";
  return "unknown";
}

function inferSourceLayer(food: Food, marketScope: FoodOntologyMarketScope): FoodOntologySourceLayer {
  if (food.source === "custom") return "user-custom";
  if (food.source === "online") return "online-temporary";
  if (marketScope === "brand-or-sku") return "domestic-packaged";
  if (marketScope === "global-common") return "local-global-generic";
  return "local-china-curated";
}

function buildDefaultAssumption(
  food: Food,
  granularity: FoodOntologyGranularity,
  dimensions: FoodOntologyDimension[]
): string {
  const required = dimensions.find((dimension) => dimension.required);
  if (required) return `暂按${required.options[0]?.label ?? food.name}估算，用户确认${required.label}后再修正`;
  if (granularity === "packaged-sku") return "暂按国内常见包装规格估算，后续可用品牌/SKU 或条码校准";
  if (granularity === "prepared-dish") return "暂按中国常见成品菜份量和做法估算";
  if (granularity === "supplement") return "暂按常见补剂营养成分估算，品牌配方可后续校准";
  return "暂按本地通用食物营养数据估算";
}

function isPackagedFood(food: Food, context: FoodOntologyContext): boolean {
  const text = ontologyText(food, context);
  const inputText = context.inputText ?? "";
  if (food.category === "supplement") return false;
  const hasPackageUnit = /(?:^|[0-9一二两三四五六七八九十半])\s*(包|袋|盒|瓶|罐|条|听|支)|SKU|sku/.test(inputText);
  return packagedFoodHints.test(text) && (food.category === "snack" || food.category === "drink" || hasPackageUnit);
}

function ontologyText(food: Food, context: FoodOntologyContext): string {
  return `${food.id} ${food.name} ${food.aliases.join(" ")} ${context.inputText ?? ""}`;
}
