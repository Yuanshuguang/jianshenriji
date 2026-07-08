/**
 * 别名归属覆盖层（food-db-cfc 管线级方案产出）
 * 数据源：运行时冲突分析（scripts/_alias_analysis.ts / validate-foods.mjs R5）。
 *
 * 用途：当某个别名被多个食物共享（歧义）时，显式指定其规范归属食物 id，
 *       覆盖 getFoodCatalog 默认的"层级优先级首现"判定。
 *
 * 机制：本文件为非生成文件，不会被 CSV 重导入覆盖；按 alias -> canonicalFoodId 映射。
 *       仅收录"高置信度、默认判定会选错"的少数案例；其余歧义由 getFoodCatalog
 *       的层级优先级首现规则自动收敛，不在此手工列举。
 *
 * 注意：被指向的 canonicalFoodId 必须存在于目录中（内置 id 或 csv id 均可）。
 *       若该 canonical 原本不含此别名，getFoodCatalog 会自动把别名补回它身上。
 *
 * 最后核验：2026-07-08
 */
export const aliasOwnerOverrides: Record<string, string> = {
  // —— 马铃薯家族 ——
  // 默认首现会选到"淀粉(马铃薯)"(csv-ext1270)，规范项应为 plain 马铃薯(马铃薯[土豆、洋芋])。
  "土豆": "csv-ext1276",
  "洋芋": "csv-ext1276",
  "山药蛋": "csv-ext1276",
  "地蛋": "csv-ext1276",
  "荷兰薯": "csv-ext1276",

  // —— 方便面 ——
  // 默认首现会选到某个品牌 SKU（康师傅/统一），规范项应为内置通用方便面。
  "方便面": "instant-noodles",
};
