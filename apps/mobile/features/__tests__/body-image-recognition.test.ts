import assert from "node:assert/strict";
import test from "node:test";
import { calculateBmi, defaultBodyFatVisualQualitySignals, estimateBodyFatFromProfile, estimateBodyFatFromVisualInput } from "../body-image-recognition";

test("body image helper calculates bmi from height and weight", () => {
  assert.equal(calculateBmi(175, 70), 22.9);
});

test("body image helper estimates body fat from profile", () => {
  const estimate = estimateBodyFatFromProfile({
    gender: "male",
    age: 30,
    heightCm: 175,
    weightKg: 70,
  });

  assert.equal(estimate, 18.1);
});

test("body image helper applies visual correction and returns a range", () => {
  const estimate = estimateBodyFatFromVisualInput({
    gender: "male",
    age: 30,
    heightCm: 175,
    weightKg: 70,
  }, "defined", {
    mediaType: "image",
    qualitySignals: defaultBodyFatVisualQualitySignals,
  });

  assert.equal(estimate?.basePercent, 18.1);
  assert.equal(estimate?.percent, 11.1);
  assert.equal(estimate?.min, 8.1);
  assert.equal(estimate?.max, 14.1);
  assert.match(estimate?.reason ?? "", /BMI 基准 18.1%/);
});

test("body image helper widens range when visual quality is not confirmed", () => {
  const estimate = estimateBodyFatFromVisualInput({
    gender: "male",
    age: 30,
    heightCm: 175,
    weightKg: 70,
  }, "defined", {
    mediaType: "image",
    qualitySignals: [],
  });

  assert.equal(estimate?.qualitySpread, 5);
  assert.equal(estimate?.min, 6.1);
  assert.equal(estimate?.max, 16.1);
});

test("body image helper uses smaller visual correction for female defined lines", () => {
  const estimate = estimateBodyFatFromVisualInput({
    gender: "female",
    age: 30,
    heightCm: 165,
    weightKg: 55,
  }, "defined", {
    mediaType: "video",
    qualitySignals: [...defaultBodyFatVisualQualitySignals, "tightClothing"],
  });

  assert.equal(estimate?.visualAdjustment, -5);
  assert.equal(estimate?.qualitySpread, 2);
});
