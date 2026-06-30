import assert from "node:assert/strict";
import test from "node:test";
import { extractBodyReportMetrics } from "./body-report.js";

test("body report OCR parser extracts common composition metrics", () => {
  const metrics = extractBodyReportMetrics(`
    BMI 23.4
    体脂率：18.6%
    骨骼肌 31.2kg
    身体水分 56.8%
    基础代谢 1562 kcal
  `);

  assert.equal(metrics.bmi, 23.4);
  assert.equal(metrics.bodyFatPercent, 18.6);
  assert.equal(metrics.skeletalMuscleKg, 31.2);
  assert.equal(metrics.waterPercent, 56.8);
  assert.equal(metrics.basalMetabolismKcal, 1562);
});

test("body report OCR parser leaves bmi empty when the field is missing", () => {
  const metrics = extractBodyReportMetrics("体脂率 19.2%");
  assert.equal(metrics.bmi, undefined);
  assert.equal(metrics.bodyFatPercent, 19.2);
});
