import assert from "node:assert/strict";
import test from "node:test";
import { getFoodRecordStateCopy, resolveFoodRecordState } from "../food-record-state";

test("饮食记录状态：空状态不把示例当成真实记录", () => {
  const state = resolveFoodRecordState({
    actualFoodText: "",
    actualIntake: 0,
    actualMealTexts: { breakfast: "", lunch: "", dinner: "", snack: "" },
    recognizing: false,
  });

  assert.equal(state, "empty");
  assert.match(getFoodRecordStateCopy(state).subtitle, /不会把示例当成真实记录/);
});

test("饮食记录状态：AI 图片识别中优先显示识别状态", () => {
  assert.equal(resolveFoodRecordState({
    actualFoodText: "鸡蛋",
    actualIntake: 80,
    actualMealTexts: { lunch: "鸡蛋" },
    recognizing: true,
  }), "recognizing");
});

test("饮食记录状态：文本、餐次或热量任一存在都算今日已记录", () => {
  assert.equal(resolveFoodRecordState({
    actualFoodText: "",
    actualIntake: 0,
    actualMealTexts: { lunch: "一碗米饭" },
    recognizing: false,
  }), "recorded");

  assert.equal(resolveFoodRecordState({
    actualFoodText: "",
    actualIntake: 120,
    actualMealTexts: {},
    recognizing: false,
  }), "recorded");
});
