const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "../..");
const databaseDir = path.join(repoRoot, "数据库");
const outputFile = path.join(repoRoot, "shared/data/curated-foods.ts");

const appCategories = new Map([
  ["谷薯及主食", "staple"],
  ["蔬菜", "vegetable"],
  ["菌藻类", "vegetable"],
  ["水果", "fruit"],
  ["畜肉", "protein"],
  ["禽肉", "protein"],
  ["水产", "protein"],
  ["蛋类", "protein"],
  ["豆类及豆制品", "protein"],
  ["奶及乳制品", "drink"],
  ["饮料", "drink"],
  ["酒类", "drink"],
  ["零食甜品", "snack"],
  ["坚果及种子", "snack"],
  ["油脂", "snack"],
  ["餐饮菜品", "dish"],
  ["预包装食品", "fastfood"],
  ["运动营养", "supplement"],
  ["调味品", "dish"],
  ["其他", "dish"]
]);

const genericNameOverrides = new Map([
  ["珍珠奶茶", { id: "milk-tea", grams: 500, units: [["杯", 500]] }],
  ["奶茶", { id: "milk-tea", grams: 500, units: [["杯", 500]] }],
  ["薯片", { id: "chips", grams: 50, units: [["包", 70], ["袋", 70], ["份", 50]] }],
  ["腰果", { id: "nuts", grams: 30, units: [["把", 25], ["包", 30], ["份", 30]] }],
  ["坚果", { id: "nuts", grams: 30, units: [["把", 25], ["包", 30], ["份", 30]] }],
  ["螺蛳粉", { id: "luo-si-fan", grams: 400, units: [["碗", 400], ["份", 400]] }],
  ["酸辣粉", { id: "suanlafen", grams: 350, units: [["碗", 350], ["份", 350]] }],
  ["茶叶蛋", { id: "tea-egg", grams: 60, units: [["个", 60], ["只", 60], ["枚", 60]] }],
  ["炼乳", { id: "lianru", grams: 15, units: [["勺", 15], ["份", 15]] }]
]);

const servingRules = {
  staple: { grams: 200, units: [["份", 200], ["碗", 250]] },
  protein: { grams: 120, units: [["份", 120], ["块", 50]] },
  vegetable: { grams: 150, units: [["份", 150]] },
  fruit: { grams: 150, units: [["个", 150], ["份", 150]] },
  snack: { grams: 50, units: [["份", 50], ["包", 50]] },
  drink: { grams: 250, units: [["杯", 250], ["瓶", 500], ["罐", 330]] },
  dish: { grams: 300, units: [["份", 300], ["碗", 300]] },
  fastfood: { grams: 250, units: [["份", 250], ["个", 200]] },
  supplement: { grams: 30, units: [["份", 30], ["勺", 30]] }
};

function findCsvFile() {
  const files = fs.readdirSync(databaseDir).filter((name) => name.toLowerCase().endsWith(".csv"));
  if (files.length === 0) throw new Error("未找到 CSV 食物数据库文件");
  const preferred = files.find((name) => name.includes("健身APP食物数据库"));
  return path.join(databaseDir, preferred || files[0]);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === "\"" && next === "\"") {
        cell += "\"";
        i += 1;
      } else if (char === "\"") {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift() || [];
  return rows
    .filter((item) => item.some((value) => value.trim()))
    .map((item) => Object.fromEntries(headers.map((header, index) => [header, item[index] || ""])));
}

function uniqueTerms(foodName, alias, searchKeywords) {
  const terms = [alias, searchKeywords]
    .flatMap((value) => value.split(/[，,、;；|]/g))
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => value !== foodName)
    .filter(isUsefulSearchTerm);

  return Array.from(new Set(terms)).slice(0, 12);
}

function isUsefulSearchTerm(value) {
  if (value.length < 2) return false;
  if (/^[\d.]+$/.test(value)) return false;
  if (/[（(][^）)]*$/.test(value) || /^[^（(]*[）)]$/.test(value)) return false;
  if (/^(鲜|干|蒸|煮|熟|生|全脂|低脂|脱脂)$/.test(value)) return false;
  return true;
}

function numberValue(value) {
  const num = Number(String(value).trim());
  return Number.isFinite(num) ? Math.round(num * 10) / 10 : 0;
}

function inferServing(row, category) {
  const name = row.foodName;
  const primary = row.primaryCategory;
  const secondary = row.secondaryCategory;
  const base = servingRules[category] || servingRules.dish;
  const generic = genericNameOverrides.get(row.standardName) || genericNameOverrides.get(name);
  if (generic) return { grams: generic.grams, units: generic.units };

  if (primary === "蛋类" || /蛋/.test(name)) return { grams: 60, units: [["个", 60], ["份", 60]] };
  if (primary === "酒类") return { grams: 330, units: [["杯", 250], ["瓶", 500], ["罐", 330]] };
  if (primary === "油脂" || secondary.includes("油脂")) return { grams: 10, units: [["勺", 10], ["份", 10]] };
  if (primary === "调味品") return { grams: 15, units: [["勺", 15], ["份", 15]] };
  if (secondary.includes("奶粉") || primary === "运动营养") return { grams: 30, units: [["勺", 30], ["份", 30]] };
  if (/炼乳|奶片|奶贝/.test(name)) return { grams: 20, units: [["份", 20], ["片", 5], ["勺", 15]] };
  if (/奶皮|奶酪|干酪|芝士|乳酪/.test(name)) return { grams: 30, units: [["份", 30], ["片", 20], ["块", 30]] };
  if (/薯片|锅巴|饼干|奥利奥|辣条|零食/.test(name)) return { grams: 60, units: [["包", 60], ["袋", 60], ["份", 50]] };
  if (secondary.includes("面食") || secondary.includes("米饭") || secondary.includes("粥")) return { grams: 350, units: [["碗", 350], ["份", 350]] };
  if (secondary.includes("快餐") || secondary.includes("套餐")) return { grams: 400, units: [["份", 400]] };
  if (secondary.includes("小吃")) return { grams: 200, units: [["份", 200], ["个", 100]] };
  if (primary === "坚果及种子") return { grams: 30, units: [["把", 30], ["份", 30]] };
  if (primary === "饮料" || primary === "奶及乳制品") return { grams: 250, units: [["杯", 250], ["瓶", 500]] };

  return base;
}

function refineCategory(row) {
  const name = row.foodName;
  if (/奶片|奶贝|炼乳|薯片|锅巴|饼干|奥利奥|辣条|巧克力/.test(name)) return "snack";
  if (/奶酪|干酪|芝士|乳酪/.test(name)) return "protein";
  return appCategories.get(row.primaryCategory) || "dish";
}

function toFood(row) {
  const generic = genericNameOverrides.get(row.standardName) || genericNameOverrides.get(row.foodName);
  const category = refineCategory(row);
  const serving = inferServing(row, category);
  return {
    id: generic ? `csv-${row.foodCode.toLowerCase()}-${generic.id}` : `csv-${row.foodCode.toLowerCase()}`,
    name: row.foodName,
    aliases: uniqueTerms(row.foodName, row.alias, row.searchKeywords),
    category,
    caloriesPer100g: numberValue(row.energyKCal),
    proteinPer100g: numberValue(row.protein),
    fatPer100g: numberValue(row.fat),
    carbsPer100g: numberValue(row.carbohydrate),
    defaultUnitGram: serving.grams,
    servingUnits: serving.units.map(([name, grams]) => ({ name, grams })),
    source: "builtin",
    confidenceLevel: "reference"
  };
}

function passesQualityGate(row) {
  const energy = numberValue(row.energyKCal);
  const protein = numberValue(row.protein);
  const fat = numberValue(row.fat);
  const carbs = numberValue(row.carbohydrate);
  if (energy < 0 || energy > 900) return false;
  if (protein < 0 || protein > 100 || fat < 0 || fat > 100 || carbs < 0 || carbs > 100) return false;
  if (/零热量但营养素非零|有热量但三大营养素全零|油脂分类零热量/.test(row.qualityFlags)) return false;
  if (energy === 0 && protein === 0 && fat === 0 && carbs === 0 && !["饮料", "运动营养"].includes(row.primaryCategory)) return false;
  return true;
}

// 生成期校验：在写出 curated-foods.ts 前，拦截 CSV 内部的数据噪声。
// - 重复 ID 是致命 bug（运行时按 id 去重会静默丢数据），直接阻断生成。
// - 同名冲突 / 别名歧义属软冲突（运行时 buildCleanedCatalog 按 mergeKey 首现优先折叠），
//   仅告警暴露，不阻断重生成。
function validateGeneratedFoods(foods) {
  const norm = (s) => String(s == null ? "" : s).trim().toLowerCase().replace(/\s+/g, "");
  const idCount = new Map();
  const nameMap = new Map();
  const aliasMap = new Map();

  for (const f of foods) {
    idCount.set(f.id, (idCount.get(f.id) || 0) + 1);
    const nk = norm(f.name);
    if (!nameMap.has(nk)) nameMap.set(nk, []);
    nameMap.get(nk).push(f.id);
    for (const a of (f.aliases || [])) {
      const ak = norm(a);
      if (!aliasMap.has(ak)) aliasMap.set(ak, new Set());
      aliasMap.get(ak).add(f.id);
    }
  }

  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);
  const dupNames = [...nameMap.entries()].filter(([, ids]) => ids.length > 1);
  const ambAliases = [...aliasMap.entries()].filter(([, ids]) => ids.size > 1);
  return { dupIds, dupNames, ambAliases, total: foods.length };
}

function js(value) {
  return JSON.stringify(value);
}

function generateFoods(foods, sourceFile) {
  const lines = [
    "// 自动生成：由数据库/健身APP食物数据库_优化修复版_V3 .csv 转换而来。",
    "// 只导入 isActive=是 的记录；份量单位由 APP 运行规则补齐。",
    "// 更新 CSV 后运行：pnpm --dir shared import:curated-foods",
    "import type { Food } from \"../index\";",
    "",
    `export const curatedFoodSourceFile = ${js(path.relative(repoRoot, sourceFile).replace(/\\/g, "/"))};`,
    "",
    "export const csvGeneratedFoods: Food[] = ["
  ];

  for (const food of foods) {
    lines.push("  {");
    lines.push(`    id: ${js(food.id)},`);
    lines.push(`    name: ${js(food.name)},`);
    lines.push(`    aliases: ${js(food.aliases)},`);
    lines.push(`    category: ${js(food.category)},`);
    lines.push(`    caloriesPer100g: ${food.caloriesPer100g},`);
    lines.push(`    proteinPer100g: ${food.proteinPer100g},`);
    lines.push(`    fatPer100g: ${food.fatPer100g},`);
    lines.push(`    carbsPer100g: ${food.carbsPer100g},`);
    lines.push(`    defaultUnitGram: ${food.defaultUnitGram},`);
    lines.push(`    servingUnits: ${js(food.servingUnits)},`);
    lines.push(`    source: ${js(food.source)}`);
    lines.push("  },");
  }

  lines.push("];");
  lines.push("");
  return lines.join("\n");
}

const csvFile = findCsvFile();
const raw = fs.readFileSync(csvFile, "utf8").replace(/^\uFEFF/, "");
const rows = parseCsv(raw);
const activeRows = rows.filter((row) => row.isActive === "是" && passesQualityGate(row));
const csvFoods = activeRows.map(toFood);
/* === 7 种区域小吃补全（已有 CSV 数据中缺失的品牌类） === */
const regionalSnacks = [
  { id: "bon-bon-ji", name: "钵钵鸡", aliases: ["乐山钵钵鸡", "冷锅串串"], category: "dish", kcal: 75, protein: 5.5, fat: 4.5, carbs: 4, grams: 250, units: [["份", 250], ["碗", 200]] },
  { id: "xie-fen-xiaolong", name: "蟹粉小笼", aliases: ["蟹黄汤包", "蟹肉小笼"], category: "dish", kcal: 210, protein: 9, fat: 10, carbs: 24, grams: 200, units: [["笼", 200], ["个", 25]] },
  { id: "jipai-fan", name: "鸡排饭", aliases: ["炸鸡排便当", "照烧鸡排饭"], category: "dish", kcal: 210, protein: 14, fat: 9, carbs: 22, grams: 400, units: [["份", 400]] },
  { id: "jiao-hua-ji", name: "叫花鸡", aliases: ["叫化鸡", "荷叶叫花鸡"], category: "dish", kcal: 190, protein: 20, fat: 11, carbs: 2, grams: 300, units: [["份", 300], ["只", 800]] },
  { id: "lu-zhu", name: "卤煮", aliases: ["卤煮火烧", "卤煮小肠"], category: "dish", kcal: 160, protein: 10, fat: 8, carbs: 14, grams: 400, units: [["碗", 400], ["份", 400]] },
  { id: "zui-xia", name: "醉虾", aliases: ["花雕醉虾", "冰醉虾"], category: "dish", kcal: 90, protein: 14, fat: 2, carbs: 5, grams: 150, units: [["份", 150], ["只", 15]] },
  { id: "zao-lu", name: "糟卤", aliases: ["糟卤鸡爪", "糟卤毛豆", "糟卤一切"], category: "dish", kcal: 80, protein: 6, fat: 4, carbs: 5, grams: 150, units: [["份", 150]] }
];
const snacks = regionalSnacks.map((s) => ({
  id: `csv-snack-${s.id}`, name: s.name, aliases: s.aliases, category: s.category,
  caloriesPer100g: s.kcal, proteinPer100g: s.protein, fatPer100g: s.fat, carbsPer100g: s.carbs,
  defaultUnitGram: s.grams,
  servingUnits: s.units.map(([name, grams]) => ({ name, grams })),
  source: "builtin",
  confidenceLevel: "reference"
}));
const foods = [...csvFoods, ...snacks];

const report = validateGeneratedFoods(foods);
console.log("--- 生成期校验 ---");
console.log(`食物总数: ${report.total}`);
console.log(`重复 ID（阻断）: ${report.dupIds.length}`);
for (const [id, c] of report.dupIds.slice(0, 10)) console.log(`  x ${id} x${c}`);
console.log(`同名冲突（告警）: ${report.dupNames.length}`);
for (const [name, ids] of report.dupNames.slice(0, 10)) console.log(`  ! "${name}" -> ${ids.join(", ")}`);
console.log(`别名歧义（告警）: ${report.ambAliases.length}`);
for (const [alias, ids] of report.ambAliases.slice(0, 10)) console.log(`  ? "${alias}" -> ${[...ids].join(", ")}`);

if (report.dupIds.length > 0) {
  console.error("生成中止：存在重复 ID，请先清理 CSV 源数据（不同食物不能共用同一 foodCode）。");
  process.exit(1);
}

fs.writeFileSync(outputFile, generateFoods(foods, csvFile), "utf8");

console.log(`CSV rows: ${rows.length}`);
console.log(`Active foods generated: ${foods.length}`);
console.log(`Rows excluded by quality gate: ${rows.filter((row) => row.isActive === "是").length - foods.length}`);
console.log(`Output: ${outputFile}`);
