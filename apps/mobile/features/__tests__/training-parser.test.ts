import test from "node:test";
import assert from "node:assert/strict";
import { parseTrainingText } from "../today-plan";

test("训练自然语言：动作、分钟、组数和拉伸可被识别并估算热量", () => {
  const result = parseTrainingText(
    "今天跑步30分钟，卧推60kg 5组，深蹲40分钟，最后拉伸10分钟",
    0,
    { heightCm: 175, weightKg: 70 }
  );

  assert.deepEqual(result.matched.map((item) => item.exercise.name), ["跑步", "卧推", "深蹲", "拉伸"]);
  assert.deepEqual(result.matched.map((item) => item.minutes), [30, 15, 40, 10]);
  assert.equal(result.totalMinutes, 95);
  assert.ok(result.totalCalories > 700);
  assert.equal(result.unmatched.length, 0);
});

test("训练自然语言：同体重不同身高会影响体型校正后的热量估算", () => {
  const shortUser = parseTrainingText("跑步30分钟", 0, { heightCm: 165, weightKg: 70 });
  const tallUser = parseTrainingText("跑步30分钟", 0, { heightCm: 185, weightKg: 70 });

  assert.equal(shortUser.matched[0]?.exercise.name, "跑步");
  assert.equal(tallUser.matched[0]?.exercise.name, "跑步");
  assert.ok(shortUser.totalCalories > tallUser.totalCalories);
});
