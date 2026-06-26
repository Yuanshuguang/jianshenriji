/**
 * fetch-off-foods.ts
 * 从 Open Food Facts API 批量抓取食品数据
 * 目标：包装食品、饮品、零食、调味品
 * 
 * 用法：npx tsx shared/scripts/fetch-off-foods.ts
 */

import * as https from "https";
import * as fs from "fs";
import * as path from "path";

const OFF_BASE = "https://world.openfoodfacts.org";
const OUTPUT_DIR = path.resolve(__dirname, "../../shared/data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "off-foods-raw.json");

// 中国常见食品搜索关键词（按类别）
const SEARCH_TERMS: Record<string, string[]> = {
  // 主食相关
  staple: ["rice", "noodle", "bread", "steamed bun", "mantou", "congee", "oat", "corn", "sweet potato", "millet"],
  // 蛋白质
  protein: ["chicken breast", "beef", "pork", "fish", "shrimp", "tofu", "egg", "duck", "lamb", "sausage", "ham", "bacon"],
  // 蔬菜（包装/冷冻）
  vegetable: ["broccoli", "spinach", "carrot", "tomato", "cucumber", "cabbage", "lettuce", "green bean", "pea", "corn cooked"],
  // 水果
  fruit: ["apple", "banana", "orange", "grape", "watermelon", "mango", "strawberry", "blueberry", "peach", "pear", "kiwi", "cherry", "dragon fruit", "lychee", "durian", "pineapple"],
  // 饮品
  drink: ["milk", "yogurt", "soy milk", "orange juice", "cola", "sprite", "tea", "coffee", "beer", "coconut water", "lemonade", "energy drink", "sports drink"],
  // 零食
  snack: ["chips", "chocolate", "cookie", "biscuit", "cracker", "ice cream", "cake", "candy", "nuts", "peanut", "sunflower seed", "popcorn", "mooncake"],
  // 调味品
  condiment: ["soy sauce", "vinegar", "cooking oil", "olive oil", "sesame oil", "chili sauce", "ketchup", "mayonnaise", "peanut butter", "jam", "honey"],
  // 方便食品
  instant: ["instant noodle", "frozen dumpling", "canned food", "frozen pizza", "protein bar", "meal replacement"],
};

interface OffProduct {
  product_name: string;
  brands: string;
  categories_tags: string[];
  nutriments: Record<string, number>;
}

interface RawFoodEntry {
  name: string;
  nameEn: string;
  brand: string;
  category: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  source: "open-food-facts";
  sourceUrl: string;
}

function fetchPage(term: string, page: number): Promise<{ products: OffProduct[]; count: number }> {
  return new Promise((resolve, reject) => {
    const url = `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&json=1&page_size=50&page=${page}&sort_by=unique_scans_n`;
    https.get(url, { headers: { "User-Agent": "FitnessCalendar/0.1 (food-db-importer)" } }, (res) => {
      let data = "";
      res.on("data", (chunk: Buffer) => (data += chunk.toString()));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ products: [], count: 0 });
        }
      });
    }).on("error", reject);
  });
}

function mapCategory(offCategories: string[]): string {
  const tags = offCategories.join(",").toLowerCase();
  if (/beverage|drink|milk|juice|tea|coffee|soda|cola/.test(tags)) return "drink";
  if (/snack|chip|cookie|biscuit|cracker|candy|chocolate|confectionery/.test(tags)) return "snack";
  if (/fruit|vegetable|plant/.test(tags) && !/snack|drink/.test(tags)) return "fruit";
  if (/meat|fish|seafood|egg|poultry|tofu|protein/.test(tags)) return "protein";
  if (/bread|rice|pasta|noodle|cereal|grain|flour/.test(tags)) return "staple";
  if (/sauce|condiment|oil|vinegar|spread/.test(tags)) return "snack";
  if (/fast.food|pizza|burger|fries/.test(tags)) return "fastfood";
  if (/supplement|protein.powder|vitamin/.test(tags)) return "supplement";
  return "dish";
}

function isValidEntry(entry: RawFoodEntry): boolean {
  if (!entry.name || entry.name.length < 2) return false;
  if (entry.name.length > 80) return false;
  // 过滤离谱数据
  if (entry.caloriesPer100g < 0 || entry.caloriesPer100g > 900) return false;
  if (entry.proteinPer100g < 0 || entry.proteinPer100g > 100) return false;
  if (entry.fatPer100g < 0 || entry.fatPer100g > 100) return false;
  if (entry.carbsPer100g < 0 || entry.carbsPer100g > 100) return false;
  return true;
}

function normalizeProduct(p: OffProduct, term: string): RawFoodEntry | null {
  const n = p.nutriments || {};
  const kcal = n["energy-kcal_100g"] ?? n["energy-kcal_value"] ?? (n["energy_100g"] ? n["energy_100g"] / 4.184 : 0);
  const entry: RawFoodEntry = {
    name: p.product_name?.trim() || term,
    nameEn: p.product_name?.trim() || term,
    brand: p.brands?.split(",")[0]?.trim() || "",
    category: mapCategory(p.categories_tags || []),
    caloriesPer100g: Math.round(kcal),
    proteinPer100g: Math.round((n.proteins_100g ?? 0) * 10) / 10,
    fatPer100g: Math.round((n.fat_100g ?? 0) * 10) / 10,
    carbsPer100g: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
    source: "open-food-facts",
    sourceUrl: "",
  };
  return isValidEntry(entry) ? entry : null;
}

async function main() {
  console.log("🍔 开始从 Open Food Facts 抓取食品数据...\n");

  const allEntries: RawFoodEntry[] = [];
  const seen = new Set<string>();

  let totalFetched = 0;

  for (const [category, terms] of Object.entries(SEARCH_TERMS)) {
    console.log(`📂 类别: ${category} (${terms.length} 个搜索词)`);

    for (const term of terms) {
      try {
        const result = await fetchPage(term, 1);
        totalFetched += result.products.length;

        for (const product of result.products) {
          if (!product.product_name || !product.nutriments) continue;
          const entry = normalizeProduct(product, term);
          if (!entry) continue;

          const dedupeKey = entry.nameEn.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);

          allEntries.push(entry);
        }

        console.log(`  ✓ "${term}" -> ${result.products.length} 结果`);
        // 节制请求频率
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.log(`  ✗ "${term}" -> 错误: ${err}`);
      }
    }
  }

  console.log(`\n📊 统计:`);
  console.log(`  总抓取: ${totalFetched} 条`);
  console.log(`  去重后: ${allEntries.length} 条`);

  // 按类别统计
  const catCount: Record<string, number> = {};
  allEntries.forEach((e) => (catCount[e.category] = (catCount[e.category] || 0) + 1));
  console.log("  类别分布:");
  Object.entries(catCount).forEach(([c, n]) => console.log(`    ${c}: ${n}`));

  // 写入文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allEntries, null, 2), "utf-8");
  console.log(`\n💾 数据已保存到: ${OUTPUT_FILE}`);
}

main().catch(console.error);
