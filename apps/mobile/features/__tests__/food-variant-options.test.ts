import assert from "node:assert/strict";
import test from "node:test";
import type { Food } from "@fitness-calendar/shared";
import { getFoodVariantOptions, inferDefaultFoodVariant, resolveFoodByVariant } from "../food-variant-options";

const peanut: Food = {
  id: "peanuts",
  name: "花生",
  aliases: ["花生米", "落花生"],
  category: "snack",
  caloriesPer100g: 567,
  proteinPer100g: 25.8,
  fatPer100g: 49.2,
  carbsPer100g: 16.1,
  defaultUnitGram: 30
};

const dumpling: Food = {
  id: "pork-scallion-dumplings",
  name: "猪肉大葱水饺",
  aliases: ["水饺", "饺子"],
  category: "dish",
  caloriesPer100g: 220,
  proteinPer100g: 8,
  fatPer100g: 8,
  carbsPer100g: 28,
  defaultUnitGram: 250
};

test("食物细分类型：花生只展示花生相关做法，不混入馅料", () => {
  const labels = getFoodVariantOptions(peanut).map((option) => option.label);

  assert.deepEqual(labels, ["生花生", "水煮花生", "炒花生", "油炸花生"]);
  assert.equal(labels.some((label) => /馅/.test(label)), false);
  assert.equal(inferDefaultFoodVariant(peanut), "生花生");
});

test("食物细分类型：包子/饺子类才展示馅料候选", () => {
  const labels = getFoodVariantOptions(dumpling).map((option) => option.label);

  assert.ok(labels.includes("猪肉大葱馅"));
  assert.ok(labels.includes("素馅"));
});

test("食物细分类型：选择花生做法会同步热量模型", () => {
  const boiled = resolveFoodByVariant(peanut, "水煮花生");
  const fried = resolveFoodByVariant(peanut, "油炸花生");

  assert.equal(boiled.caloriesPer100g, 313);
  assert.equal(fried.caloriesPer100g, 583);
  assert.equal(resolveFoodByVariant(peanut, "猪肉大葱馅").caloriesPer100g, peanut.caloriesPer100g);
});
