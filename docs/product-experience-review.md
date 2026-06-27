# 产品体验评审

> 团队成员：许清楚，产品经理  
> 审计日期：2026-06-27  
> 审计对象：`C:\Users\Administrator\Documents\健身日历` 当前未提交工作区快照  
> 评分：4.0/10  

## 1. 结论

当前产品有可运行页面、饮食记录、训练记录、计划页和更多页设置，但 MVP 的核心体验还没有闭合。用户能输入“实际吃了什么”和“训练完成情况”，却看不到系统如何把这些实际数据转化为未来计划调整，也无法在历史里自然回看这条链路。

产品方向仍建议保持离线优先、本地公式引擎优先，AI 和联网动作库作为后续增强。当前不应扩展社区、课程、商城等外围功能，应先把 `recommend -> actual -> adjust` 做成用户能理解、能确认、能回看的闭环。

## 2. P0 问题

### P0-1 首次使用没有强制引导

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\_layout.tsx:22`  
证据：根布局只渲染 `<Stack screenOptions={{ headerShown: false }} />`。`C:\Users\Administrator\Documents\健身日历\apps\mobile\store\fitness-store.ts:319` 有 `isOnboardingComplete()`，但未在路由层消费。  
用户影响：新用户直接看到默认饮食和训练结果，不知道这些结果来自默认身体数据还是自己的目标。  
建议：未完成画像时进入 `/onboarding/body`；允许跳过，但首页必须显示“当前使用默认数据，建议完善资料”。

### P0-2 动态调整没有进入主流程

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\features\adjustments.ts:28`  
证据：`buildDailyAdjustmentSummary` 已存在，但静态检索未发现页面消费。  
用户影响：实际摄入、实际训练和未来计划之间没有可见反馈，产品核心卖点缺席。  
建议：首页底部新增“今日偏差与后续调整”卡片，训练页完成反馈后同步显示“已影响未来 N 天计划”。

### P0-3 今日记录没有自然落入历史

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\store\fitness-store.ts:312`  
证据：`saveDailyLog` 存在，但主饮食页和训练页没有自动调用；`CalendarHistoryPanel` 主要用于补录。  
用户影响：用户完成记录后不能形成日历趋势和复盘，闭环无法回看。  
建议：饮食 actual 更新、训练反馈保存后自动写入当天 `DailyLogEntry`；日历显示完成状态、热量偏差和训练完成率。

## 3. P1 问题

### P1-1 饮食与训练联动不可感知

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\index.tsx:119`  
证据：底层计算已经把 `actualTraining.calories` 加入今日消耗，但界面只显示合并数字。  
建议：在饮食页显示“基础消耗 + 训练消耗”的拆分条；在训练页显示“本次训练让今日赤字增加 X kcal”。

### P1-2 计划页定位混合

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\plan.tsx:66`  
证据：计划页同时承载长期目标、饮食方案、今日预算、训练跳转。  
建议：计划页定位为“策略配置中心”；今日执行留在饮食/训练页，避免多处显示同类数据。

### P1-3 离线优先表达被联网依赖削弱

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\train.tsx:37`，`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\_layout.tsx:15`  
证据：训练页默认配置远程 WorkoutX/GitHub 数据源，页面还加载 Google Fonts。  
建议：MVP 默认本地动作库和系统字体；联网动作库与远程字体作为增强项，不影响首屏与核心流程。

## 4. P2 问题

- `C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\more.tsx:439` 的动态调整设置过细，建议默认只展示“饮食调整、训练调整、安全保护”，高级设置折叠。
- `C:\Users\Administrator\Documents\健身日历\apps\mobile\components\CalendarHistoryPanel.tsx:121` 更像补录工具，不像趋势页，建议增加周/月视图。
- 饮食记录里的“准备吃”和“实际吃”概念可保留，但需要明确当前影响的是推荐、记录还是未来调整。

## 5. 产品优先级建议

1. 首次引导：身体数据、目标、训练偏好必须先完成。
2. 今日执行：首页记录实际饮食，训练页记录实际训练。
3. 即时解释：显示训练如何影响赤字，饮食如何影响营养差额。
4. 未来调整：展示未来 3-7 天热量或训练变化，并让用户确认。
5. 历史复盘：日历展示每日偏差、完成率和调整原因。

## 6. 验证

已验证：

```powershell
pnpm --recursive run typecheck
pnpm --recursive run test
```

未验证：未执行 Playwright 和截图审计。

