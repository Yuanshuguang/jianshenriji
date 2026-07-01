// MetricBarWithCursor 的核心纯函数回归测试。
// 覆盖：未达成 / 已达成 / 超额 / target=0 / NaN / 超额阈值。
import test from "node:test";
import assert from "node:assert/strict";
import { computeMetricDisplay } from "../../components/bento/metric-display";
import { getMetricCompareParts } from "../../components/bento/metric-compare";

test("未达成：actual=92, target=140, unit=g", () => {
  const d = computeMetricDisplay({ actual: 92, target: 140, unit: "g", baseColor: "accent" });
  assert.equal(d.state, "under");
  assert.equal(d.fillColor, "accent");
  assert.equal(d.cursorColor, "accent");
  assert.equal(d.hasTarget, true);
  assert.ok(Math.abs(d.percent - 92 / 140) < 1e-6);
  assert.equal(d.cursorPercent, 1);
  assert.equal(d.subtitle, "还差 48g");
  assert.equal(d.subtitleTone, "inkMute");
  assert.ok(d.ratio > 0.65 && d.ratio < 0.7);
});

test("已达成：actual=140, target=140, unit=g（>= 99.9% 视为 met）", () => {
  const d = computeMetricDisplay({ actual: 140, target: 140, unit: "g" });
  assert.equal(d.state, "met");
  assert.equal(d.fillColor, "accent");
  assert.equal(d.subtitle, "已达成");
  assert.equal(d.subtitleTone, "positive");
});

test("已达成边界：99.9% 仍判为 met", () => {
  const d = computeMetricDisplay({ actual: 139.86, target: 140, unit: "g" });
  assert.equal(d.state, "met");
});

test("超额：actual=148, target=140, unit=g", () => {
  const d = computeMetricDisplay({ actual: 148, target: 140, unit: "g" });
  assert.equal(d.state, "over");
  assert.equal(d.fillColor, "accent");
  assert.equal(d.cursorColor, "accent");
  assert.equal(d.percent, 1);
  assert.ok(Math.abs(d.cursorPercent - 140 / 148) < 1e-6);
  assert.equal(d.subtitle, "超 8g");
  assert.equal(d.subtitleTone, "warn");
});

test("严重超额：actual=200, target=140, unit=g，sub 仍然显示差额", () => {
  const d = computeMetricDisplay({ actual: 200, target: 140, unit: "g" });
  assert.equal(d.state, "over");
  assert.equal(d.percent, 1);
  assert.equal(d.cursorPercent, 0.7);
  assert.equal(d.subtitle, "超 60g");
});

test("target=0 退化：actual=300, target=0, unit=kcal", () => {
  const d = computeMetricDisplay({ actual: 300, target: 0, unit: "kcal" });
  assert.equal(d.hasTarget, false);
  assert.equal(d.percent, 0);
  assert.equal(d.cursorPercent, 0);
  assert.equal(d.state, "under");
  assert.equal(d.subtitle, "未设目标");
  assert.equal(d.subtitleTone, "inkMute");
});

test("target=0 且 actual=0：同样退化", () => {
  const d = computeMetricDisplay({ actual: 0, target: 0, unit: "kcal" });
  assert.equal(d.hasTarget, false);
  assert.equal(d.subtitle, "未设目标");
});

test("actual=0：未达成", () => {
  const d = computeMetricDisplay({ actual: 0, target: 140, unit: "g" });
  assert.equal(d.state, "under");
  assert.equal(d.percent, 0);
  assert.equal(d.subtitle, "还差 140g");
});

test("NaN 输入：实际和目标都被夹紧为 0", () => {
  const d = computeMetricDisplay({ actual: Number.NaN, target: 140, unit: "g" });
  assert.equal(d.hasTarget, true);
  assert.equal(d.percent, 0);
  assert.equal(d.cursorPercent, 1);
  assert.equal(d.subtitle, "还差 140g");
});

test("超量阈值：overThreshold=1.05 时 104% 仍为 under，106% 为 over", () => {
  const near = computeMetricDisplay({ actual: 104, target: 100, unit: "g", overThreshold: 1.05 });
  assert.equal(near.state, "met");
  const over = computeMetricDisplay({ actual: 106, target: 100, unit: "g", overThreshold: 1.05 });
  assert.equal(over.state, "over");
  assert.equal(over.fillColor, "accent");
});

test("无 unit 时副标题只显示数字", () => {
  const d = computeMetricDisplay({ actual: 50, target: 100 });
  assert.equal(d.subtitle, "还差 50");
});

test("自定义 baseColor：未超额时 fillColor 等于 baseColor", () => {
  const d = computeMetricDisplay({ actual: 50, target: 100, baseColor: "positive" });
  assert.equal(d.fillColor, "positive");
  assert.equal(d.cursorColor, "positive");
});

test("超量但仅 1%：sub 仍显示\"超 1g\"", () => {
  const d = computeMetricDisplay({ actual: 101, target: 100, unit: "g" });
  assert.equal(d.state, "over");
  assert.equal(d.subtitle, "超 1g");
});

test("极端超额：实际 5 倍目标，目标刻度按比例退到 20%", () => {
  const d = computeMetricDisplay({ actual: 500, target: 100, unit: "kcal" });
  assert.equal(d.percent, 1);
  assert.equal(d.cursorPercent, 0.2);
  assert.equal(d.subtitle, "超 400kcal");
});

test("比较条：超出目标时只把超出段标为红色区间", () => {
  const parts = getMetricCompareParts(1826, 1713);
  assert.equal(parts.actualPercent, 1);
  assert.ok(Math.abs(parts.targetPercent - 1713 / 1826) < 1e-6);
  assert.ok(Math.abs(parts.overflowStartPercent - 1713 / 1826) < 1e-6);
  assert.ok(Math.abs(parts.overflowPercent - 113 / 1826) < 1e-6);
});
