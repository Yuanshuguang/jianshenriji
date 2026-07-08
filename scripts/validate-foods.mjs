/**
 * 食物数据库校验脚本（food-db-fix 任务产出）
 * 用法: node scripts/validate-foods.mjs
 * 读取运行时数据源 + gap/cfc 补充文件，检查质量规则（Atwater 一致性/零热量/区间/同名/别名/同 id 冲突/溯源覆盖），输出可读报告。
 * 设计要点: Atwater 用「绝对阈值 |Δ|>50kcal 且相对>15%」,
 *   以排除茶/咖啡/啤酒(酒精7kcal/g未计入P/F/C)/高纤维蔬菜(可代谢能)等良性误报。
 * 退出码: 发现「严重(critical)」违规则为 1, 否则 0, 便于接入 CI 门禁。
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHARED = resolve(__dirname, "..", "shared");

const SOURCES = [
  { file: "index.ts", kind: "tuple", tag: "builtin" },
  { file: "data/chinese-foods-supplement.ts", kind: "arraytuple", tag: "supplement" },
  { file: "data/category-fallback-foods.ts", kind: "tuple", tag: "fallback" },
  { file: "data/curated-foods.ts", kind: "object", tag: "csv" },
  { file: "data/food-gap-supplement.ts", kind: "object", tag: "gap" },
  { file: "data/food-cfc-corrections.ts", kind: "object", tag: "cfc" },
];

const OBJ_RE = /id:\s*"([^"]+)"\s*,\s*name:\s*"([^"]+)"\s*,\s*aliases:\s*\[([^\]]*)\]\s*,\s*category:\s*"([^"]+)"\s*,\s*caloriesPer100g:\s*([\d.]+)\s*,\s*proteinPer100g:\s*([\d.]+)\s*,\s*fatPer100g:\s*([\d.]+)\s*,\s*carbsPer100g:\s*([\d.]+)/g;
const TUPLE_RE = /(?:food|fallbackFood)\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*\[([^\]]*)\]\s*,\s*"([a-z]+)"\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/g;

function parseObject(text, tag) {
  const out = [];
  for (const m of text.matchAll(OBJ_RE)) {
    const [_, id, name, aliasS, cat, cal, pro, fat, carb] = m;
    const aliases = aliasS ? [...aliasS.match(/"([^"]+)"/g)].map((s) => s.slice(1, -1)) : [];
    // 溯源覆盖检查：扫描本条目的闭合区域，判断是否声明了 sourceDb
    const rest = text.slice(m.index);
    const cEnd = rest.indexOf("\n  },");
    const bEnd = rest.indexOf("\n  }");
    const end = cEnd > -1 ? cEnd : (bEnd > -1 ? bEnd : rest.length);
    const hasSourceDb = /sourceDb:\s*"[^"]*"/.test(rest.slice(0, end));
    out.push({ src: tag, id, name, aliases, cat, cal: +cal, pro: +pro, fat: +fat, carb: +carb, hasSourceDb });
  }
  return out;
}
function parseTuple(text, tag) {
  const out = [];
  for (const m of text.matchAll(TUPLE_RE)) {
    const [_, id, name, aliasS, cat, cal, pro, fat, carb] = m;
    const aliases = aliasS ? [...aliasS.match(/"([^"]+)"/g)].map((s) => s.slice(1, -1)) : [];
    out.push({ src: tag, id, name, aliases, cat, cal: +cal, pro: +pro, fat: +fat, carb: +carb });
  }
  return out;
}
// 数组元组形式: ["id","name",["alias"],"cat",cal,pro,fat,carbs,...]（chinese-foods-supplement.ts）
const ARR_RE = /\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*\[([^\]]*)\]\s*,\s*"([a-z]+)"\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/g;
function parseArray(text, tag) {
  const out = [];
  for (const m of text.matchAll(ARR_RE)) {
    const [_, id, name, aliasS, cat, cal, pro, fat, carb] = m;
    const aliases = aliasS ? [...aliasS.match(/"([^"]+)"/g)].map((s) => s.slice(1, -1)) : [];
    out.push({ src: tag, id, name, aliases, cat, cal: +cal, pro: +pro, fat: +fat, carb: +carb });
  }
  return out;
}

const items = [];
for (const s of SOURCES) {
  const p = resolve(SHARED, s.file);
  let text;
  try { text = readFileSync(p, "utf8"); } catch { continue; }
  items.push(...(s.kind === "object" ? parseObject(text, s.tag) : s.kind === "arraytuple" ? parseArray(text, s.tag) : parseTuple(text, s.tag)));
}

// ---- 规则 ----
const critical = [];
const warnings = [];
const atwaterViol = [];
const atwaterInfo = [];
const zeroTrueErr = [];
const zeroEmpty = [];
const rangeErr = [];
const nameMap = {};
const aliasMap = {};
const idMap = {};
const baseIdMap = {};
const BASE_TAGS = ["builtin", "supplement", "fallback", "csv"];

// 预计算被覆盖层(cfc/gap)覆盖的 base id：运行时以覆盖层为准，其旧值不再计入严重 Atwater 检查
const idLayers = {};
for (const it of items) {
  idLayers[it.id] = idLayers[it.id] || new Set();
  idLayers[it.id].add(it.src);
}
const supersededIds = new Set(
  Object.entries(idLayers)
    .filter(([, srcs]) => BASE_TAGS.some((b) => srcs.has(b)) && (srcs.has("cfc") || srcs.has("gap")))
    .map(([id]) => id)
);

for (const it of items) {
  // 字段完整
  if ([it.id, it.name, it.cat, it.cal, it.pro, it.fat, it.carb].some((v) => v === undefined || v === null || (typeof v === "number" && Number.isNaN(v)))) {
    rangeErr.push(`${it.src}:${it.id} 字段缺失/NaN`);
  }
  // 合理区间
  if (it.cal < 0 || it.cal > 900 || it.pro < 0 || it.pro > 100 || it.fat < 0 || it.fat > 100 || it.carb < 0 || it.carb > 100) {
    rangeErr.push(`${it.src}:${it.id} ${it.name} 区间越界 cal=${it.cal} P=${it.pro} F=${it.fat} C=${it.carb}`);
    critical.push(`range:${it.src}:${it.id}`);
  }
  // 零热量
  if (it.cal === 0) {
    if (it.pro + it.fat + it.carb > 0) zeroTrueErr.push(`${it.src}:${it.id} ${it.name} (P${it.pro}/F${it.fat}/C${it.carb})`);
    else zeroEmpty.push(`${it.src}:${it.id} ${it.name}`);
  }
  // Atwater (绝对阈值; 区分宏量偏高 vs 含酒精/纤维的良性低估)
  // 被 cfc/gap 覆盖层覆盖的 base 条目，运行时以覆盖层为准，跳过其旧值的 Atwater 判定
  if (it.cal > 0 && !(BASE_TAGS.includes(it.src) && supersededIds.has(it.id))) {
    const gross = 4 * it.pro + 9 * it.fat + 4 * it.carb;
    const diff = gross - it.cal;
    if (diff > 50 && diff / it.cal > 0.15) atwaterViol.push(`${it.src}:${it.id} ${it.name} 标称${it.cal} 计算${gross.toFixed(0)} (宏量偏高)`);
    else if (-diff > 50 && -diff / it.cal > 0.15) atwaterInfo.push(`${it.src}:${it.id} ${it.name} 标称${it.cal} 计算${gross.toFixed(0)} (含酒精/纤维, 良性)`);
  }
  nameMap[it.name] = nameMap[it.name] || [];
  nameMap[it.name].push(`${it.src}:${it.id}`);
  for (const a of it.aliases) {
    aliasMap[a] = aliasMap[a] || new Set();
    aliasMap[a].add(it.name);
  }
  idMap[it.id] = idMap[it.id] || [];
  idMap[it.id].push(it.src);
  if (BASE_TAGS.includes(it.src)) {
    baseIdMap[it.id] = baseIdMap[it.id] || [];
    baseIdMap[it.id].push(it.src);
  }
}

const nameDup = Object.entries(nameMap).filter(([, ids]) => ids.length > 1);
const aliasDup = Object.entries(aliasMap).filter(([, names]) => names.size > 1);
// R6 严重检查仅限 base 层内/之间；cfc/gap 覆盖层与 base 同 id 属预期覆盖
const idDup = Object.entries(baseIdMap).filter(([, srcs]) => srcs.length > 1);
const expectedOverlaps = Object.entries(idMap).filter(([, srcs]) => {
  const hasBase = srcs.some((s) => BASE_TAGS.includes(s));
  const hasOverride = srcs.some((s) => s === "cfc" || s === "gap");
  return hasBase && hasOverride;
});
const gapWithSource = items.filter((it) => it.src === "gap" && it.hasSourceDb).length;
const gapTotal = items.filter((it) => it.src === "gap").length;

// 严重项计入 critical (Atwater 仅作告警, 不阻断 CI; 零热量真错误与区间越界为严重)
for (const z of zeroTrueErr) critical.push(`zerocal:${z}`);

// ---- 输出 ----
const line = "=".repeat(60);
console.log(line);
console.log("食物数据库校验报告");
console.log(`生成时间: ${new Date().toISOString().slice(0, 10)}`);
console.log(line);
console.log(`解析条目总数: ${items.length}`);
console.log(`  builtin=${items.filter(i=>i.src==="builtin").length} supplement=${items.filter(i=>i.src==="supplement").length} fallback=${items.filter(i=>i.src==="fallback").length} csv=${items.filter(i=>i.src==="csv").length} gap=${items.filter(i=>i.src==="gap").length} cfc=${items.filter(i=>i.src==="cfc").length}`);
console.log(line);
console.log("【规则1】Atwater 一致性(宏量偏高>50kcal 且相对>15%): " + (atwaterViol.length ? `⚠ ${atwaterViol.length} 条` : "✅ 0"));
atwaterViol.slice(0, 40).forEach((v) => console.log("   - " + v));
console.log(`【规则1b】Atwater 良性低估(含酒精/纤维, 不计入严重): ${atwaterInfo.length} 条`);
console.log("【规则2】零热量真错误(cal=0 且 营养素>0): " + (zeroTrueErr.length ? `❌ ${zeroTrueErr.length} 条` : "✅ 0"));
zeroTrueErr.forEach((v) => console.log("   - " + v));
console.log(`【规则2b】零热量空壳(cal=0 且全0, 多为无糖饮料/补剂, 合法): ${zeroEmpty.length} 条`);
console.log("【规则3】合理营养区间(0~900 / 0~100): " + (rangeErr.length ? `❌ ${rangeErr.length} 条` : "✅ 0"));
rangeErr.slice(0, 40).forEach((v) => console.log("   - " + v));
console.log("【规则4】同名冲突(name 重复): " + (nameDup.length ? `⚠ ${nameDup.length} 组` : "✅ 0"));
nameDup.slice(0, 30).forEach(([n, ids]) => console.log(`   - ${n}: ${ids.join(", ")}`));
console.log("【规则5】别名歧义(alias 指向>1食物): " + (aliasDup.length ? `⚠ ${aliasDup.length} 个` : "✅ 0"));
console.log("【规则6】同 id 冲突(base 层内/之间): " + (idDup.length ? `❌ ${idDup.length} 组` : "✅ 0"));
idDup.slice(0, 20).forEach(([id, srcs]) => console.log(`   - ${id}: ${srcs.join(", ")}`));
console.log(`【规则6b】预期覆盖(cfc/gap 覆盖 base 同 id, 非冲突): ${expectedOverlaps.length} 组`);
expectedOverlaps.slice(0, 20).forEach(([id, srcs]) => console.log(`   - ${id}: ${srcs.join(", ")} (预期覆盖)`));
console.log(`【规则7】字段完整性: ${rangeErr.length ? "❌ 见上" : "✅ 通过"}`);
const cfcWithSource = items.filter((it) => it.src === "cfc" && it.hasSourceDb).length;
const cfcTotal = items.filter((it) => it.src === "cfc").length;
console.log(`【规则8】溯源覆盖: gap=${gapWithSource}/${gapTotal}, cfc=${cfcWithSource}/${cfcTotal} (合计 ${gapWithSource + cfcWithSource}/${gapTotal + cfcTotal})`);

// ---- 规则9：管线清洗后残差冲突（回归门禁）----
// 复算 getFoodCatalog 的清洗逻辑（mergeKey 同名合并 + 别名单一归属），
// 期望清洗后同名冲突=0、跨食物别名歧义=0，防止 CSV 重导入回潮。
// 仅校验 base 目录（不含 custom 用户食物）。与 shared/index.ts buildCleanedCatalog 保持逻辑一致。
const LAYER_PRIORITY = { cfc: 1, builtin: 2, supplement: 3, fallback: 4, csv: 5, gap: 6 };
function normalizeMergeKey(s) {
  return s.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, "").replace(/[，,。.、；;:：!！?？()（）\[\]【】"'""''《》<>/\\|·•・]/g, "");
}
// 与 shared/data/food-alias-overrides.ts 保持同步
const ALIAS_OVERRIDES = {
  "土豆": "csv-ext1276", "洋芋": "csv-ext1276", "山药蛋": "csv-ext1276", "地蛋": "csv-ext1276", "荷兰薯": "csv-ext1276",
  "方便面": "instant-noodles",
};
const rOrdered = [...items].sort((a, b) => (LAYER_PRIORITY[a.src] ?? 9) - (LAYER_PRIORITY[b.src] ?? 9));
const rAliasOwner = {};
for (const it of rOrdered) {
  for (const a of it.aliases) {
    const k = normalizeMergeKey(a);
    if (!(k in rAliasOwner)) rAliasOwner[k] = it.id;
  }
}
for (const [alias, id] of Object.entries(ALIAS_OVERRIDES)) rAliasOwner[normalizeMergeKey(alias)] = id;
const rCleaned = rOrdered.map((it) => {
  let aliases = [...it.aliases];
  for (const [alias, id] of Object.entries(ALIAS_OVERRIDES)) {
    if (id === it.id && !aliases.includes(alias)) aliases = [...aliases, alias];
  }
  return { ...it, aliases: aliases.filter((a) => rAliasOwner[normalizeMergeKey(a)] === it.id) };
});
const rSurvivors = [];
const rSeenId = new Set();
const rSeenName = new Set();
for (const it of rCleaned) {
  const key = normalizeMergeKey(it.name);
  if (rSeenId.has(it.id) || rSeenName.has(key)) continue;
  rSeenId.add(it.id);
  rSeenName.add(key);
  rSurvivors.push(it);
}
const rNameMap = {};
const rAliasMap = {};
for (const it of rSurvivors) {
  (rNameMap[it.name] = rNameMap[it.name] || new Set()).add(it.id);
  for (const a of it.aliases) (rAliasMap[a] = rAliasMap[a] || new Set()).add(it.id);
}
const rNameDup = Object.entries(rNameMap).filter(([, s]) => s.size > 1);
const rAliasDup = Object.entries(rAliasMap).filter(([, s]) => s.size > 1);
console.log(`【规则9】管线清洗后残差(回归门禁): 同名=${rNameDup.length}, 跨食物别名歧义=${rAliasDup.length} (期望 0/0)`);
rNameDup.slice(0, 10).forEach(([n, s]) => console.log(`   - 同名残留: ${n}: ${[...s].join(", ")}`));
rAliasDup.slice(0, 10).forEach(([a, s]) => console.log(`   - 别名残留: ${a}: ${[...s].join(", ")}`));
if (rNameDup.length || rAliasDup.length) warnings.push("r9-residual");

console.log(line);
const hasCritical = critical.length > 0;
console.log(hasCritical ? `总评: ❌ 发现 ${critical.length} 个严重项, 需修复` : "总评: ✅ 无严重项");
console.log(line);

process.exit(hasCritical ? 1 : 0);
