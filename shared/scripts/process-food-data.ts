/**
 * process-food-data.ts
 * 处理从 Open Food Facts 抓取的原始数据，去重、分类修正、过滤，
 * 并生成 TypeScript food() 调用代码
 * 
 * 用法：npx tsx shared/scripts/process-food-data.ts
 */

import * as fs from "fs";
import * as path from "path";

const RAW_FILE = path.resolve(__dirname, "../../shared/data/off-foods-raw.json");
const OUTPUT_TS = path.resolve(__dirname, "../../shared/data/off-foods-generated.ts");
const OUTPUT_LOG = path.resolve(__dirname, "../../shared/data/off-foods-import-log.md");

interface RawFoodEntry {
  name: string;
  nameEn: string;
  brand: string;
  category: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  source: string;
  sourceUrl: string;
}

interface ProcessedFood {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  defaultUnitGram: number;
  servingUnits: Array<{ name: string; grams: number }>;
  source: string;
}

// ============ 类别重新映射 ============

// 食品名称中英文关键词重映射
const CATEGORY_KEYWORDS: Array<{ cat: string; patterns: RegExp[] }> = [
  {
    cat: "staple",
    patterns: [
      /rice|noodle|pasta|bread|bun|mantou|congee|porridge|oat|cereal|grain|cracker|flour|wheat|starch|bao|bapao/i,
    ],
  },
  {
    cat: "protein",
    patterns: [
      /chicken|beef|pork|lamb|duck|fish|shrimp|tofu|egg|ham|sausage|meat|steak|bacon|seafood|turkey|meatball|gyoza|dumpling|won ton|dim sum/i,
    ],
  },
  {
    cat: "vegetable",
    patterns: [/broccoli|spinach|carrot|tomato|cucumber|cabbage|lettuce|pea|green.bean|cauliflower|salad|vegetable/i],
  },
  {
    cat: "fruit",
    patterns: [/apple|banana|orange|grape|watermelon|mango|strawberry|blueberry|peach|pear|kiwi|cherry|dragon.fruit|lychee|durian|pineapple|fruit|berry/i],
  },
  {
    cat: "drink",
    patterns: [
      /milk|yogurt|juice|cola|sprite|tea|coffee|beer|water|drink|smoothie|shake|lemonade|soda|wine|liquor|alcohol|beverage|latte|cappuccino|espresso/i,
    ],
  },
  {
    cat: "snack",
    patterns: [/chip|cookie|biscuit|cracker|chocolate|candy|ice.cream|cake|popcorn|nut|peanut|sunflower|crisp|bar(?!.*protein)/i],
  },
  {
    cat: "fastfood",
    patterns: [/pizza|burger|fries|nugget|fried.chicken|instant.noodle|hot.dog|taco|burrito|kebab|sandwich/i],
  },
  { cat: "supplement", patterns: [/protein.bar|protein.powder|whey|creatine|supplement|vitamin|meal.replacement|huel|soylent/i] },
  { cat: "dish", patterns: [/quiche|gratin|stew|soup|curry|stir.fry|roast|grill|bake|casserole|pie(?![a-z])/i] },
];

function recategorize(entry: RawFoodEntry): string {
  const text = (entry.name + " " + entry.nameEn + " " + entry.brand).toLowerCase();

  for (const group of CATEGORY_KEYWORDS) {
    for (const pattern of group.patterns) {
      if (pattern.test(text)) return group.cat;
    }
  }
  return "dish";
}

// ============ 特殊黑名单 ============

// 这些词出现在食品名中说明不是标准食物，应该过滤
const BLACKLIST_PATTERNS = [
  /pet.food|dog|cat|bird/i,
  /sauce(?!.*pasta|.*rice)/i, // 纯调味酱（非菜品）
  /stock|cube$/i, // 高汤块
  /seasoning|flavouring/i,
  /syrup|topping/i,
  /mix(?!.*cake|.*cookie)/i, // 混合粉
  /yeast|baking.powder|gelatin/i,
  /baby.formula|infant/i, // 婴儿食品
  /dietary.supplement|multivitamin/i,
  /gum\b|mint\b|breath/i, // 口香糖
  /^[a-z]+ flavor/i, // 纯口味名
  /uncategorized/i,
];

// ============ 去重 & 清洗 ============

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function extractChineseAlias(name: string): string {
  // 如果名称包含中文字符，提取中文部分作为别名
  const chineseMatch = name.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/g);
  return chineseMatch ? chineseMatch.join("") : "";
}

function cleanName(name: string): string {
  return name
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\b\d+x\d+\b/g, "")
    .replace(/\b\d+%?\b/g, "")
    .replace(/\bg\b|\bml\b|\bkg\b|\bl\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function processEntry(entry: RawFoodEntry, seen: Set<string>): ProcessedFood | null {
  // 黑名单过滤
  if (BLACKLIST_PATTERNS.some((p) => p.test(entry.name) || p.test(entry.nameEn))) return null;

  // 名称过短或过长
  const name = cleanName(entry.nameEn);
  if (name.length < 3 || name.length > 60) return null;

  // 营养数据异常
  if (entry.caloriesPer100g <= 0 && entry.proteinPer100g <= 0 && entry.fatPer100g <= 0 && entry.carbsPer100g <= 0) return null;

  // 去重
  const key = slugify(name);
  if (seen.has(key)) return null;
  seen.add(key);

  // 重新分类
  const category = recategorize(entry);

  // 提取中文别名
  const alias = extractChineseAlias(entry.name);
  const aliases: string[] = [];
  if (alias && alias.length > 1 && alias !== name) {
    aliases.push(alias);
  }

  // 估算默认份量
  const defaultUnitGram = estimateDefaultUnitGram(category, entry);

  return {
    id: "off-" + slugify(name),
    name: name,
    aliases,
    category,
    caloriesPer100g: entry.caloriesPer100g,
    proteinPer100g: entry.proteinPer100g,
    fatPer100g: entry.fatPer100g,
    carbsPer100g: entry.carbsPer100g,
    defaultUnitGram,
    servingUnits: [],
    source: "open-food-facts",
  };
}

function estimateDefaultUnitGram(category: string, entry: RawFoodEntry): number {
  switch (category) {
    case "drink":
      return 250;
    case "snack":
      return 30;
    case "protein":
      return 120;
    case "vegetable":
      return 150;
    case "fruit":
      return 150;
    case "staple":
      return 150;
    case "fastfood":
      return 200;
    case "dish":
      return 250;
    default:
      return 100;
  }
}

// ============ 生成 TypeScript 代码 ============

function generateFoodCall(food: ProcessedFood): string {
  const aliasesStr = food.aliases.length > 0
    ? food.aliases.map((a) => `"${a}"`).join(", ")
    : "";

  return [
    `  food(`,
    `    "${food.id}",`,
    `    "${food.name}",`,
    `    [${aliasesStr}],`,
    `    "${food.category}",`,
    `    ${food.caloriesPer100g},`,
    `    ${food.proteinPer100g},`,
    `    ${food.fatPer100g},`,
    `    ${food.carbsPer100g},`,
    `    ${food.defaultUnitGram}`,
    `  ),`,
  ].join("\n");
}

function generateTypeScript(foods: ProcessedFood[]): string {
  const lines: string[] = [
    "// 自动生成 — 数据来源：Open Food Facts",
    "// 生成时间：" + new Date().toISOString(),
    "// 如需重新生成：npx tsx shared/scripts/process-food-data.ts (需先运行 fetch-off-foods.ts)",
    "",
    "import type { Food } from \"../index\";",
    "",
    "export const offFoods: Food[] = [",
  ];

  foods.forEach((f) => {
    lines.push(generateFoodCall(f));
  });

  lines.push("];");
  return lines.join("\n");
}

function generateMarkdownReport(foods: ProcessedFood[], totalRaw: number): string {
  const catCount: Record<string, number> = {};
  foods.forEach((f) => (catCount[f.category] = (catCount[f.category] || 0) + 1));

  const lines: string[] = [
    "# Open Food Facts 数据导入报告",
    "",
    `生成时间：${new Date().toISOString()}`,
    "",
    "## 统计",
    "",
    `| 项目 | 数量 |`,
    `|------|------|`,
    `| 原始抓取 | ${totalRaw} |`,
    `| 清洗后 | ${foods.length} |`,
    `| 过滤率 | ${Math.round((1 - foods.length / totalRaw) * 100)}% |`,
    "",
    "## 类别分布",
    "",
    "| 类别 | 数量 |",
    "|------|------|",
  ];

  Object.entries(catCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([c, n]) => lines.push(`| ${c} | ${n} |`));

  lines.push("", "## 新增食物清单", "");

  Object.entries(catCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([c]) => {
      lines.push(`### ${c}`, "");
      foods
        .filter((f) => f.category === c)
        .forEach((f) => lines.push(`- ${f.name} (${f.caloriesPer100g} kcal/100g) [${f.id}]`));
      lines.push("");
    });

  return lines.join("\n");
}

// ============ 主流程 ============

async function main() {
  console.log("🔧 开始处理 Open Food Facts 原始数据...\n");

  if (!fs.existsSync(RAW_FILE)) {
    console.error("❌ 找不到原始数据文件: " + RAW_FILE);
    console.error("   请先运行: npx tsx shared/scripts/fetch-off-foods.ts");
    process.exit(1);
  }

  const rawData: RawFoodEntry[] = JSON.parse(fs.readFileSync(RAW_FILE, "utf-8"));
  console.log(`📥 读取原始数据: ${rawData.length} 条\n`);

  const seen = new Set<string>();
  const processed = rawData
    .map((e) => processEntry(e, seen))
    .filter((e): e is ProcessedFood => e !== null);

  console.log(`✅ 清洗后数据: ${processed.length} 条`);
  console.log(`❌ 过滤掉: ${rawData.length - processed.length} 条`);

  // 重新按类别统计
  const catCount: Record<string, number> = {};
  processed.forEach((f) => (catCount[f.category] = (catCount[f.category] || 0) + 1));
  console.log("\n📊 类别分布:");
  Object.entries(catCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([c, n]) => console.log(`  ${c}: ${n}`));

  // 生成 TypeScript
  const tsCode = generateTypeScript(processed);
  fs.writeFileSync(OUTPUT_TS, tsCode, "utf-8");
  console.log(`\n💾 TypeScript 已生成: ${OUTPUT_TS}`);

  // 生成报告
  const report = generateMarkdownReport(processed, rawData.length);
  fs.writeFileSync(OUTPUT_LOG, report, "utf-8");
  console.log(`📝 报告已生成: ${OUTPUT_LOG}`);
}

main().catch(console.error);
