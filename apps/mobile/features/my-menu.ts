import type { Food } from "@fitness-calendar/shared";

export type MyMenuDraft = {
  name: string;
  aliases: string;
  labelText: string;
  caloriesPer100g: string;
  proteinPer100g: string;
  fatPer100g: string;
  carbsPer100g: string;
  defaultUnitGram: string;
};

export function createEmptyMenuDraft(): MyMenuDraft {
  return {
    name: "",
    aliases: "",
    labelText: "",
    caloriesPer100g: "",
    proteinPer100g: "",
    fatPer100g: "",
    carbsPer100g: "",
    defaultUnitGram: "100"
  };
}

export function buildCustomFoodFromDraft(draft: MyMenuDraft): Food | null {
  const name = draft.name.trim();
  if (!name) return null;

  return {
    id: `custom-${slug(name)}`,
    name,
    aliases: draft.aliases.split(/[\s,，、]+/).map((item) => item.trim()).filter(Boolean),
    category: "dish",
    caloriesPer100g: numberOr(draft.caloriesPer100g, 120),
    proteinPer100g: numberOr(draft.proteinPer100g, 6),
    fatPer100g: numberOr(draft.fatPer100g, 4),
    carbsPer100g: numberOr(draft.carbsPer100g, 12),
    defaultUnitGram: numberOr(draft.defaultUnitGram, 100),
    source: "custom"
  };
}

export function applyNutritionLabelToDraft(draft: MyMenuDraft): MyMenuDraft {
  const text = draft.labelText;
  return {
    ...draft,
    caloriesPer100g: draft.caloriesPer100g || String(extractCalories(text) ?? ""),
    proteinPer100g: draft.proteinPer100g || String(extractGram(text, /蛋白质|蛋白|protein/i) ?? ""),
    fatPer100g: draft.fatPer100g || String(extractGram(text, /脂肪|fat/i) ?? ""),
    carbsPer100g: draft.carbsPer100g || String(extractGram(text, /碳水化合物|碳水|carb/i) ?? "")
  };
}

export function inferNameFromImageFileName(fileName: string): string {
  return fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/[0-9]/g, "")
    .trim();
}

function extractCalories(text: string): number | null {
  const kcal = text.match(/(?:能量|热量|calories|kcal)[^\d]{0,8}([0-9]+(?:\.[0-9]+)?)/i);
  if (!kcal) return null;
  const value = Number(kcal[1]);
  if (/千焦|kj/i.test(text.slice(Math.max(0, kcal.index ?? 0), (kcal.index ?? 0) + 24))) {
    return Math.round(value / 4.184);
  }
  return Math.round(value);
}

function extractGram(text: string, label: RegExp): number | null {
  const index = text.search(label);
  if (index < 0) return null;
  const match = text.slice(index, index + 40).match(/([0-9]+(?:\.[0-9]+)?)\s*(g|克)/i);
  return match ? Number(match[1]) : null;
}

function numberOr(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function slug(value: string): string {
  const ascii = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return ascii || encodeURIComponent(value).replace(/%/g, "").toLowerCase().slice(0, 32);
}
