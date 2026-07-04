# 动态调整机制 · 复查报告（第二轮）

> 复查日期：2026-07-05（第二轮）
> 视角：食物营养数据分析师
> 对比基准：第一轮报告（2026-07-05 早些时候，12 项问题）
> 复查代码：`shared/index.ts`、`shared/dynamic-plan-engine.ts`、`shared/calorie-debt-ledger.ts`、`shared/data/meal-planner-solver.ts`

---

## 一、修复进度总览

| 状态 | 数量 | 说明 |
|---|---|---|
| ✅ 已修复 | 4 项 | P1-4、P2-9 + 2 项新增保护 |
| 🟡 部分修复 | 1 项 | P0-1（展示层做了，联动层没做） |
| ❌ 未修复 | 4 项 | P0-2、P0-3、P1-5、P1-6 |
| ⚠️ 新引入问题 | 4 项 | 详见第四节 |

**进度评价**：方向对，动了关键几处（蛋白 BMI 分档、adjustMacros 重写、宏量统计），但**3 个 P0 里还有 2 个没动**，且宏量弥补只做了"展示"没做"联动"。整体进度约 40%。

---

## 二、已修复项详情 ✅

### 1. P1-4 蛋白按 BMI 分档（已修复）
`shared/index.ts:867-872` 新增 `resolveProteinReferenceWeight`：
```ts
if (bmi >= 30) { return 24 * ((heightCm/100) ** 2); }        // 肥胖：用理想体重
if (bmi >= 25) { return (weightKg + idealWeight) / 2; }      // 超重：取中位
return weightKg;                                              // 正常：用实际体重
```
**营养学评价**：✅ 完全符合建议。100kg/BMI≥30 的人不再被算成 180g 蛋白，按理想体重（如 75kg）算 135g，合理。

### 2. P2-9 adjustMacros 反推链（已修复）
`dynamic-plan-engine.ts:206-237` 新增 `chooseFatCarbPair` 枚举搜索：
- 消除了原来的 `void trainingMultiplier` / `void carbsG` 反推链
- 改为遍历 fatG ∈ [minFatG, maxFatG]，找 drift 最小且最接近 desiredFatG 的组合
- **代码可读性大幅提升**，训练日/休息日差异能正确生效

**配合的 protein 上限保护**（174-179行）：
```ts
const maxProteinByShare = Math.floor((calories * 0.35) / 4);      // 蛋白不超过35%热量
const maxProteinByFloor = Math.floor((calories - minFatG*9 - minCarbsG*4) / 4);  // 不挤占脂肪/碳水下限
const proteinG = Math.max(0, Math.min(proteinByTarget, maxProteinByShare, maxProteinByFloor));
```
**营养学评价**：✅ 优秀。35% 上限符合 ISSN 建议，floor 保护避免了低热量日蛋白挤占脂肪/碳水。

### 3. P0-1 宏量统计展示层（部分修复）
`calorie-debt-ledger.ts` 新增：
- `MacroLedgerStat` 类型（protein/fat/carbs 各自的 target/actual/delta/tone/advice）
- `buildMacroStats` 计算每日宏量缺口
- `buildMacroAdvice` 生成营养建议（如"蛋白平均每天少 25g，后续每天增加不超过 25g，分到 2-4 餐"）

**营养学评价**：🟡 展示和建议做得不错，建议文案符合营养师常识（不暴食补回、分餐补足、训练日前后补碳水）。**但** `dynamic-plan-engine.ts` 的 `calculateDynamicPlanAdjustment` 仍只处理 `netDelta`（热量级），宏量缺口没有进入 `buildAtonementPlan` 的弥补逻辑。**展示层和联动层脱节。**

### 4. 新增的保护设计（额外加分）
- **`hasRedFlag` 红牌保护**（384-393行）：实际摄入 < safetyFloor×0.7 或减重速度 > 0.2kg/天 → 强制 extend-deadline
- **`resolveHybridRatio` 分档**（394-400行）：小差额不补、大差额降比例
- **`computeTrainingWeight` 精细化**（372-383行）：维持/增肌期训练未完成不减食物、疲劳时返回0

---

## 三、未修复项详情 ❌

### P0-2 · 7700 线性假设（未修复）
`shared/index.ts:425`：
```ts
const dailyDeficitRaw = ((input.currentWeightKg - input.targetWeightKg) * 7700) / Math.max(1, input.days);
```
**仍是固定 7700 系数，无代谢适应修正。** 长期目标天数估算仍会偏差 20-30%。

**建议修法**（最低成本）：
```ts
const weightLost = Math.max(0, startWeightKg - currentWeightKg);
const adaptationFactor = Math.max(0.75, 1 - weightLost * 0.02);  // 每减1kg衰减2%，最低0.75
const dailyDeficitRaw = (weightDiff * 7700 * adaptationFactor) / days;
```

### P0-3 · 热量下限 1200 性别不一致（未修复）
`shared/index.ts:427`：
```ts
const calories = Math.max(1200, Math.round(tdee - dailyDeficit));  // 固定1200
```
而 `dynamic-plan-engine.ts:96`：
```ts
safetyFloorCalories: gender === "female" ? 1200 : 1500
```
**两处仍不一致。** 男性用户初始目标可能 = 1200，但动态调整却认为 1500 才安全。

**建议修法**：
```ts
const safetyFloor = input.gender === "female" ? 1300 : 1500;  // 女性提至1300
const calories = Math.max(safetyFloor, Math.round(tdee - dailyDeficit));
```
注意：`calculateGoalEnergyPlan` 目前不接收 startWeightKg，需扩展入参或从外部传入 safetyFloor。

### P1-5 · 训练日碳水乘数 1.12（未修复）
`dynamic-plan-engine.ts:103-104` 仍固定 1.12/0.88。虽然 `adjustMacros` 重写后差异能正确生效，但 **1.12 倍对腿部/背部大肌群训练日仍偏小**。

实测（1800kcal、蛋白120g，新 adjustMacros）：
| 场景 | 蛋白 | 脂肪 | 碳水 |
|---|---|---|---|
| 训练日(×1.12) | 120 | 50 | 207 |
| 休息日(×0.88) | 120 | 63 | 178 |

差异比旧版大（碳水差 29g → 14%），但仍小于运动科学建议的 30-50%。

**建议修法**：
```ts
// createDefaultAdjustmentRules 增加按部位的乘数表
carbMultiplierByMuscle: {
  legs: 1.35, back: 1.25, chest: 1.15,
  shoulders: 1.10, arms: 1.05, core: 1.08, cardio: 1.20
}
// adjustMacros 根据 training.plannedFocus 选取
```

### P1-6 · 蔬菜非硬约束（未修复）
`meal-planner-solver.ts:115` 仍 `pickNext(pools.vegetable, portions)` 可空。
`buildWarnings`（731-783行）检查了蛋白/主食/脂肪缺失，**但唯独没有蔬菜缺失的警告**。

**建议修法**：
```ts
// buildWarnings 增加
if (!foods.some((item) => item.category === "vegetable")) {
  warnings.push("储备食物缺少蔬菜，正餐膳食纤维和维生素摄入可能不足，建议添加菠菜、西兰花、番茄等。");
}
// buildInitialPortions 午餐/晚餐蔬菜池为空时阻断
```

---

## 四、修改引入的新问题 ⚠️

### 新问题 1 · resolveHybridRatio 小差额永不补 🟡中
`dynamic-plan-engine.ts:394-400`：
```ts
if (netDelta <= 150) return 0;  // hybrid ratio = 0，完全不补
```
**场景**：用户每天都多吃 150kcal，连续 30 天累积 4500kcal（≈0.6kg脂肪）。
- 每天 hybrid ratio = 0 → 不触发弥补
- `runningNetCalories` 累加到 4500，但**仅展示不自动改次日目标**
- 结果：用户开了"动态调整"，但 APP 对这种慢性超量毫无干预

**营养学风险**：减脂期最常见的就是"每天多吃一点点"的慢性超量，这正是最需要干预的场景。

**建议修法**：
```ts
// 引入滚动窗口的累积差额
if (netDelta <= 150) {
  // 看过去7天累积，超过500就启动小幅补偿
  return recentCumulativeDelta > 500 ? 0.2 : 0;
}
```
或在 `calculateDynamicPlanAdjustment` 入口检查 `runningNetCalories`，超过阈值时强制 repay-by-days。

### 新问题 2 · hasRedFlag 减重速度阈值偏宽松 🟡中
`dynamic-plan-engine.ts:390-391`：
```ts
if (weightDiff > 0 && (weightDiff / Math.max(1, input.goalPlan.targetDays)) > 0.2) return true;
```
0.2kg/天 = 1.4kg/周。对 70kg 人 = 每周 2%，**超过 ACSM 建议的 1%/周 一倍**。

**营养学评价**：
- 对 BMI≥30 的重度肥胖者，1.4kg/周 可接受
- 对 BMI 24-28 的轻度超重者，1.4kg/周 偏激进，肌肉流失风险上升
- 建议按 BMI 分档：`bmi >= 30 ? 0.25 : bmi >= 27 ? 0.15 : 0.10`

### 新问题 3 · chooseFatCarbPair O(n) 循环 🟢低
`dynamic-plan-engine.ts:223`：
```ts
for (let fatG = minFatG; fatG <= maxFatG; fatG += 1) { ... }
```
maxFatG 在高热量日可达 200+，每次 adjustMacrors 循环 200 次。单次不慢，但若批量计算（如生成 30 天计划）会累积。

**建议**（非阻塞，可后续优化）：drift = |protein*4 + fat*9 + carbs*4 - calories|，carbs 受 minCarbs 约束，最优 fat 在边界附近，可数学求解无需枚举。

### 新问题 4 · computeTrainingWeight 减脂期训练未完成只折算 50% 🟢低
`dynamic-plan-engine.ts:372-383`：
```ts
if (fatigue >= rules.fatigueRecoveryThreshold) return 0;
return 0.5;  // 减脂期，训练未完成的少消耗只按50%计入netDelta
```
**场景**：计划训练消耗 400kcal，实际只消耗 100kcal，少消耗 300kcal。
- `trainingDelta = 400 - 100 = 300`
- `netDelta += 300 * 0.5 = 150`（只计 150）
- 其余 150kcal 被忽略

**营养学评价**：设计意图可能是"避免过度惩罚用户没完成训练"，但**营养学上这 300kcal 是真实没消耗的**，不计入弥补会让减脂进度滞后。建议折算比例提到 0.7-0.8，或允许用户配置。

---

## 五、第二轮问题优先级矩阵

| # | 问题 | 来源 | 严重度 | 状态 |
|---|---|---|---|---|
| 1 | P0-1 宏量缺口未进入弥补逻辑 | 旧 | 🔴高 | 🟡 部分修复 |
| 2 | P0-2 7700 线性假设 | 旧 | 🔴高 | ❌ 未修复 |
| 3 | P0-3 热量下限 1200 性别不一致 | 旧 | 🔴高 | ❌ 未修复 |
| 4 | 新-1 小差额永不补（resolveHybridRatio） | 新 | 🔴高 | ⚠️ 新引入 |
| 5 | P1-5 训练日碳水乘数 1.12 | 旧 | 🟡中 | ❌ 未修复 |
| 6 | P1-6 蔬菜非硬约束 | 旧 | 🟡中 | ❌ 未修复 |
| 7 | 新-2 hasRedFlag 阈值偏宽松 | 新 | 🟡中 | ⚠️ 新引入 |
| 8 | 新-4 训练未完成只折算 50% | 新 | 🟢低 | ⚠️ 新引入 |
| 9 | 新-3 chooseFatCarbPair 性能 | 新 | 🟢低 | ⚠️ 新引入 |
| 10 | P2-8 缺奶制品/豆制品角色 | 旧 | 🟡中 | ❌ 未修复 |
| 11 | P2-10 补偿上限按 TDEE | 旧 | 🟢低 | ❌ 未修复 |
| 12 | P2-12 solver 接入 cookingMethod | 旧 | 🟢低 | ❌ 未修复 |

---

## 六、复查结论

### 做得好的部分
1. **蛋白 BMI 分档** —— 干净利落，符合营养学建议
2. **adjustMacros 重写** —— 消除了 void 反推链，新增 protein 上限保护，代码质量和营养合理性都提升
3. **宏量统计展示层** —— MacroLedgerStat + buildMacroAdvice 文案专业
4. **hasRedFlag 红牌保护** —— 思路正确，阈值需微调
5. **resolveHybridRatio 分档** —— 思路正确，但小差额档位有漏洞

### 仍需补的关键环节
1. **宏量缺口联动**（最紧迫）—— `calculateDynamicPlanAdjustment` 要把 proteinDelta/carbsDelta 接入 `buildAtonementPlan`，不能只展示不弥补
2. **7700 代谢适应** —— 长期目标天数估算偏差问题没动
3. **热量下限性别统一** —— 一行代码的事，但影响女性用户健康
4. **小差额漏洞** —— resolveHybridRatio 的 `≤150 → 0` 需要配合累积窗口

### 食物搭配常识再核查
- ✅ 蛋白按 BMI 分档后，肥胖者不再蛋白过高，符合常识
- ✅ adjustMacros 的 protein 35% 上限 + floor 保护，符合常识
- ❌ 蔬菜仍可缺失，buildWarnings 唯独没检查蔬菜，**不符合中餐正餐常识**
- ❌ 训练日碳水增幅仍不足，腿部训练日碳水不够仍是问题

**一句话**：修改有诚意，动了该动的地方，但 P0 还剩 2 个没动 + 新引入 1 个高优先级漏洞。建议下一轮聚焦"宏量联动 + 7700 代谢适应 + 小差额累积 + 蔬菜警告"这四件事，能把机制从 6.3 分推到 7.5 分。

---

*复查基于代码静态分析 + 营养学常识验证。热量估算固有误差 ±15-20%。*
