import test from "node:test";
import assert from "node:assert/strict";
import { buildExerciseSearchTerms, localizeExerciseName } from "../exercise-localization";

test("exercise localization maps common English names to Chinese labels", () => {
  const names = [
    localizeExerciseName({ name: "Dumbbell Bench Press" }),
    localizeExerciseName({ name: "Seated Cable Row" }),
    localizeExerciseName({ name: "Incline Dumbbell Shoulder Press" }),
    localizeExerciseName({ name: "Band Y-Raise", equipment: "band" }),
    localizeExerciseName({ name: "Barbell Seated Twist", equipment: "barbell" }),
    localizeExerciseName({ name: "Battle Rope" }),
    localizeExerciseName({ name: "45° side bend", bodyPart: "waist", equipment: "body weight" }),
    localizeExerciseName({ name: "band alternating v-up", bodyPart: "waist", equipment: "band" }),
    localizeExerciseName({ name: "Band assisted wheel rollerout", bodyPart: "waist", equipment: "band" }),
    localizeExerciseName({ name: "Assisted hanging knee raise", bodyPart: "waist", equipment: "assisted" }),
    localizeExerciseName({ name: "Unknown Drill", bodyPart: "waist", equipment: "body weight" })
  ];

  assert.equal(names[0], "哑铃卧推");
  assert.equal(names[1], "坐姿绳索划船");
  assert.equal(names[2], "上斜哑铃推举");
  assert.equal(names[3], "弹力带平举");
  assert.equal(names[4], "坐姿杠铃转体");
  assert.equal(names[5], "战绳");
  assert.equal(names[6], "徒手侧屈");
  assert.equal(names[7], "弹力带交替Ⅴ字收腹");
  assert.equal(names[8], "弹力带辅助健腹轮");
  assert.equal(names[9], "辅助举膝");
  assert.equal(names[10], "徒手核心训练");
  assert.ok(!/[A-Za-z]/.test(names.join("")), "display names must not contain Latin letters");
  assert.ok(/[\u4e00-\u9fff]/.test(names[3]), "fallback display name must still be Chinese");
  assert.notEqual(names[10], "训练动作");
});

test("exercise search terms keep raw and localized names together", () => {
  const terms = buildExerciseSearchTerms({
    name: "Dumbbell Lateral Raise",
    equipment: "Dumbbell",
    bodyPart: "Shoulders",
    category: "Shoulders"
  });

  assert.ok(terms.includes("Dumbbell Lateral Raise"));
  assert.ok(terms.includes("哑铃侧平举"));
  assert.ok(terms.includes("Dumbbell"));
});
