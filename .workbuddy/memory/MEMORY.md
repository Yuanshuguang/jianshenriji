# 项目长期记忆

## 信息架构（Tab 结构）
- 三个 Tab：**饮食 / 训练 / 更多**（不可改名）
- 饮食 tab = 今日饮食相关；训练 tab = 今日训练相关；更多 tab = 长期设置
- **禁止把「饮食」改名为「今日」**，用户明确纠正过

## 动态调整机制（已实现，2026-07-05 复核）
- **核心实现**：`shared/dynamic-plan-engine.ts`(306行) + `shared/calorie-debt-ledger.ts`(223行) + `apps/mobile/features/adjustments.ts`(215行)
- 注意：`shared/domain/plan-engine/` 仍为空目录，实现散落在上述三处（非 domain 目录）
- Store 字段：`dynamicAdjustmentEnabled` + `dynamicAdjustmentSettings`(nutrition/meals/training/muscles) + `dynamicAtonementPreference`(mode+repayDays)
- 三种弥补模式：extend-deadline / repay-by-days / hybrid（默认，只补50%）
- 差额口径：**仅热量级**，宏量差额仅展示不弥补（PRD第7.2节"营养余额"未落地）
- 上限保护：min(400kcal, 目标×20%, safetyFloor兜底)，疲劳≥4强制extend-deadline
- 跨天滚存：`runningNetCalories` 累加，但仅展示不自动改次日目标

## 关键代码位置
- BMR/TDEE/赤字：`shared/index.ts:410-432` `calculateGoalEnergyPlan`（Mifflin-St Jeor）
- 宏量硬编码：`shared/index.ts:427-429`（蛋白1.8g/kg, 脂肪25%热量, 碳水剩余）
- 训练日碳水乘数：`dynamic-plan-engine.ts:102-103`（训练1.12/休息0.88）+ `adjustMacros:181`
- 餐次规划：`shared/data/meal-planner-solver.ts` `solveMealPlan:56`
- 角色池：protein/staple/vegetable/fruit/fat/drinkSnack，每餐选4角色
- 活动系数：`fitness-store.ts:752-762`（beginner1.3/intermediate1.45/regular1.6）

## 文件路径说明
- 用户项目根：`C:\Users\Administrator\Documents\健身日历\`
- Bash 工作目录：`c:\Users\Administrator\.workbuddy\workspace\files\46340\b3ccd446-b1a6-4865-b5f8-df40a7de1901\`
- 两处需手动同步（cp）

## 食物数据库（2026-07-04 审计+修复）
- 审计报告：`docs/food-nutrition-audit-report.md`（4.8/10）
- 内置388条 + 兜底267 + CSV2160 ≈ 2815条；中国食物覆盖率66.5%→99.7%
- 新增：`shared/data/chinese-foods-supplement.ts`（167种CFC第6版）
- Food类型扩展：`cookingOilPer100g`/`cookingMethod`(12种)/`foodGranularity`
- `getFoodCatalog()`合并：custom→foods→chineseSupplement→categoryFallback→csvGenerated

## UI/UX 已完成项
- **全维度审计(2026-06-27)**：4.1/10，报告5份在 docs/，修复路线Phase1-3
- **UI审计全部完成**：train.tsx/index.tsx拆分、动作库独立页、44px触摸、空状态、Modal遮罩、基础动画
- **字体缩放**：fontScale四档(0.85/1.0/1.15/1.3)，Text.tsx scaleStyle()统一处理，11pt下限
- **等宽数字**：tabular-nums；字号阶梯收敛（display40/h1 24/h2 18/h3 15/micro 11）
- **CJK字体**：系统回退（iOS PingFang SC / Android厂商字体），expo-font仅加载Barlow
- **图标系统**：lucide-react-native，24个AppIcon，中文字符/ASCII/Emoji全部消除
- **动画引擎**：react-native-reanimated v4.4.1（新架构），按钮回弹/列表入场/加载→对勾/页面转场
- **LoadingToSuccess**：AI识别+联网搜索3场景接入，busy→对勾1.2s
