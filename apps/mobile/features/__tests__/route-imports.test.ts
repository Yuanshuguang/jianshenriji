/**
 * 路由级静态 smoke 测试：通过文件源码 grep 验证关键导出与函数存在
 * 避免直接 import 路由（tsx 处理不了 react-native 的 Flow 代码）
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");

const checks: Array<[string, string, RegExp]> = [
  [
    "今日首页",
    "app/(tabs)/index.tsx",
    /export default function (Today|Home|Diet)Screen/
  ],
  ["计划页", "app/(tabs)/plan.tsx", /export default function \w+Screen/],
  ["训练页", "app/(tabs)/train.tsx", /export default function \w+Screen/],
  ["赎罪页", "app/(tabs)/atonement.tsx", /export default function \w+Screen/],
  ["更多页", "app/(tabs)/more.tsx", /export default function \w+Screen/],
  ["动作库", "app/exercise-library/index.tsx", /export default function \w+Screen/],
  ["饮食计划列表", "app/diet-plan/index.tsx", /export default function \w+Screen/],
  ["onboarding 身体页", "app/onboarding/body.tsx", /export default function \w+Screen/],
  [
    "onboarding 训练偏好页",
    "app/onboarding/training-preference.tsx",
    /export default function \w+Screen/
  ],
  [
    "动作库排序函数 getLibrarySortRank 定义",
    "app/exercise-library/index.tsx",
    /function getLibrarySortRank\(/
  ]
];

for (const [label, rel, pattern] of checks) {
  test(`路由静态 smoke: ${label}`, () => {
    const fp = resolve(ROOT, rel);
    const content = readFileSync(fp, "utf-8");
    assert.match(content, pattern, `${rel} 应当包含 ${pattern}`);
  });
}
