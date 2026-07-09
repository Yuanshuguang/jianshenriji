/**
 * CFC-6 权威溯源覆盖层（food-db-cfc 任务产出）
 * 数据源：《中国食物成分表》第6版（杨月欣，中国疾控中心营养与健康所，2018/2019）。
 * 用途：对 7 条"营养数据偏差较大"的食物，用权威值做覆盖修正（内置 1 条 + CSV 生成 6 条）。
 * 覆盖机制：getFoodCatalog() 合并时以最高优先级（仅低于用户自定义食物 customFoods）
 *   按 id 覆盖 base 条目（foods / csvGeneratedFoods 等），由 seen Set 首现优先实现。
 * ⚠ 本文件非自动生成，不会被 CSV 重导入覆盖；绝不手改生成文件 curated-foods.ts 或 index.ts 中的 foods 数组。
 * 最后核验：2026-07-08
 */
import type { Food } from "../index";

const VERIFIED_AT = "2026-07-08";

export const cfcCorrections: Food[] = [
  // ===== 内置项覆盖（shared/index.ts:239 doujiang）=====
  {
    id: "doujiang",
    name: "豆浆",
    aliases: ["豆奶", "黄豆豆浆", "无糖豆浆", "甜豆浆", "原味豆浆"],
    category: "drink",
    caloriesPer100g: 31,
    proteinPer100g: 3.0,
    fatPer100g: 1.6,
    carbsPer100g: 1.2,
    defaultUnitGram: 250,
    servingUnits: [
      { name: "杯", grams: 250 },
      { name: "碗", grams: 250 },
      { name: "袋", grams: 200 },
      { name: "盒", grams: 250 },
    ],
    foodGranularity: "specific-food",
    sourceDb: "CFC-6",
    sourceVersion: "第6版",
    lastVerifiedAt: VERIFIED_AT,
  },

  // ===== CSV 生成项覆盖（name/aliases/category/defaultUnitGram/servingUnits 原样保留，仅覆盖 4 个营养字段 + 补溯源）=====
  {
    id: "csv-ext2021",
    name: "麻辣豆腐",
    aliases: ["家常麻辣豆腐", "红烧豆腐"],
    category: "dish",
    caloriesPer100g: 133,
    proteinPer100g: 9.5,
    fatPer100g: 8.5,
    carbsPer100g: 4.5,
    defaultUnitGram: 300,
    servingUnits: [
      { name: "份", grams: 300 },
      { name: "碗", grams: 300 },
    ],
    foodGranularity: "prepared-dish",
    sourceDb: "CFC-6",
    sourceVersion: "第6版-组分重建",
    lastVerifiedAt: VERIFIED_AT,
  },
  {
    id: "fallback-b3-guilinggao",
    name: "龟苓膏",
    aliases: ["龟苓膏冻", "草本龟苓膏", "Guilinggao", "清热龟苓膏", "生和堂龟苓膏"],
    category: "snack",
    caloriesPer100g: 57,
    proteinPer100g: 0.1,
    fatPer100g: 0,
    carbsPer100g: 13.5,
    defaultUnitGram: 50,
    servingUnits: [
      { name: "份", grams: 50 },
      { name: "包", grams: 50 },
    ],
    foodGranularity: "prepared-dish",
    sourceDb: "CFC-6",
    sourceVersion: "第6版", // 注：市售加糖版热量可至~139，本层按原味57修正
    lastVerifiedAt: VERIFIED_AT,
  },
  {
    id: "csv-ext1204",
    name: "小旋花（鲜）[狗儿蔓]",
    aliases: ["狗儿蔓"],
    category: "vegetable",
    caloriesPer100g: 40,
    proteinPer100g: 4.5,
    fatPer100g: 0.5,
    carbsPer100g: 9.0,
    defaultUnitGram: 150,
    servingUnits: [{ name: "份", grams: 150 }],
    foodGranularity: "ingredient",
    sourceDb: "CFC-6",
    sourceVersion: "第6版-组分重建",
    lastVerifiedAt: VERIFIED_AT,
  },
  {
    id: "csv-ext1950",
    name: "三明治(烤牛肉) (通用)",
    aliases: [],
    category: "protein",
    caloriesPer100g: 251,
    proteinPer100g: 14.0,
    fatPer100g: 10.0,
    carbsPer100g: 24.0,
    defaultUnitGram: 120,
    servingUnits: [
      { name: "份", grams: 120 },
      { name: "块", grams: 50 },
    ],
    foodGranularity: "prepared-dish",
    sourceDb: "CFC-6",
    sourceVersion: "第6版-组分重建",
    lastVerifiedAt: VERIFIED_AT,
  },
  {
    id: "csv-ext1955",
    name: "三明治(鸡蛋沙拉) (通用)",
    aliases: [],
    category: "protein",
    caloriesPer100g: 305,
    proteinPer100g: 13.0,
    fatPer100g: 16.0,
    carbsPer100g: 25.0,
    defaultUnitGram: 60,
    servingUnits: [
      { name: "个", grams: 60 },
      { name: "份", grams: 60 },
    ],
    foodGranularity: "prepared-dish",
    sourceDb: "CFC-6",
    sourceVersion: "第6版-组分重建",
    lastVerifiedAt: VERIFIED_AT,
  },
  {
    id: "csv-ext2511",
    name: "鸡肉卷",
    aliases: ["jiroujuan"],
    category: "protein",
    caloriesPer100g: 225,
    proteinPer100g: 18.0,
    fatPer100g: 10.0,
    carbsPer100g: 22.0,
    defaultUnitGram: 120,
    servingUnits: [
      { name: "份", grams: 120 },
      { name: "块", grams: 50 },
    ],
    foodGranularity: "prepared-dish",
    sourceDb: "CFC-6",
    sourceVersion: "第6版-组分重建",
    lastVerifiedAt: VERIFIED_AT,
  },
];
