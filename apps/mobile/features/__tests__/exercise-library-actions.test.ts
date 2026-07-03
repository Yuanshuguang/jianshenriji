import assert from "node:assert/strict";
import test from "node:test";
import { exerciseCardActionA11yLabel } from "../exercise-library-actions";

test("动作卡片必须保留显性操作入口，不能只依赖长按", () => {
  assert.equal(exerciseCardActionA11yLabel, "打开动作操作菜单");
});
