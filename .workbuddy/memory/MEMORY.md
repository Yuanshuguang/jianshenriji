# 项目长期记忆

## 信息架构（Tab 结构）
- 三个 Tab：**饮食 / 训练 / 更多**（不可改名）
- 饮食 tab = 今日饮食相关（饮食记录、推荐餐次、热量仪表盘、动态调整卡）
- 训练 tab = 今日训练相关（训练计划、实际训练反馈、消耗进度）
- 更多 tab = 长期设置（我的菜单、动态调整开关、身体数据、减重目标、训练习惯、健身目标）
- **禁止把「饮食」改名为「今日」或其他**，用户明确纠正过
- **饮食页只放和吃有关的内容**，今日训练横条已移至训练页

## 动态调整机制
- 已有机制：用户某天没按计划饮食/训练时，后续计划自动调整弥补偏差
- 新增开关：`dynamicAdjustmentEnabled`（默认 true），放在「更多」页
- 开关关闭时：饮食页不显示「后续调整」卡，后续计划保持固定
- Store 字段：`fitness-store.ts` 的 `dynamicAdjustmentEnabled` + `setDynamicAdjustmentEnabled`
- 已加入 persist partialize，跨会话保留

## 文件路径说明
- 用户项目根：`C:\Users\Administrator\Documents\健身日历\`
- Bash 工作目录：`c:\Users\Administrator\.workbuddy\workspace\files\46340\b3ccd446-b1a6-4865-b5f8-df40a7de1901\`
- 两处需手动同步（cp），部分文件（store/features）只在 workbuddy workspace 存在
- Web 预览服务器从 workbuddy workspace 的 `ui-redesign/preview/index.html` 读取

## UI 设计决策 (2025-06)
- **营养数据卡片改为左右分栏对比式**：每张早/中/晚/加餐卡片内部分为左(计划推荐) + 右(实际记录)，中间渐隐竖线分隔
- **顶部热量三合一**：摄入/消耗/赤字整合到一张总览卡片，右侧保留目标值+迷你进度环
- **数字对比度修复**：深色背景上 kcal 数字使用亮白色 (#F1F5F9)，偏差数字用语义色（多吃=红/少吃=绿）
- **底部差值指示器**：每张卡片右下角 ▲▼ 箭头 + 差值数字
- 渲染脚本：`ui-redesign/bento-glass/page_06_nutrition_split.py` → 输出 `page_06_nutrition_split_v2.png`

## 数据联动现状（2026-06-23 排查）
- **底层联动仍在**：index.tsx 第87-94行 burnCalories/deficit/adjustment 仍读取训练页 actualTraining 数据（Zustand响应式）
- **视觉联动断裂**：改版删除了饮食页「今日训练」横条（旧版file-history `97c1be34f7b40f4d@v1` 第302-321行），饮食页与训练页失去视觉桥梁，"今日消耗"数字看不出来源
- **核心引擎未实现**：PRD第7节 Flexible Plan Engine 完全未做，`shared/domain/plan-engine/` 为空目录。缺跨天热量余额、营养余额、训练恢复管理、训练日联动饮食宏量
## 全维度软件开发审计（2026-06-27）
- **综合评分 4.1/10**，不建议上线
- **TOP10最严重问题**：Plan Engine空壳、宏量硬编码零、视觉联动断裂、无ErrorBoundary、渲染链无memo、API Key暴露、persist async/sync不兼容、错误静默吞没、页面巨型化(972/1266行)、无Onboarding守卫
- **四大根因**：核心引擎未落地、设计vs实现偏离、安全基础设施缺失、质量保障空白(测试覆盖率≈2%)
- **修复路线**：Phase1紧急止血(5.5天)→Phase2架构对齐(2-4周)→Phase3质量体系(4-8周)
- 审计报告5份：docs/full-audit-overview.md（综合）、product-experience-review.md、architecture-review.md、code-quality-review.md、qa-security-review.md

## 字体缩放系统 (2026-06-28)
- **Store**: `fontScale: FontScaleLevel` ("small"|"normal"|"large"|"xlarge")，version 6，含 migrate
- **数值映射**: small=0.85, normal=1.0, large=1.15, xlarge=1.3
- **ThemeProvider**: Context 新增 `fontScale: number` + `fontScaleLevel`，`useFontScale()` hook 导出
- **核心机制**: Text.tsx 的 `scaleStyle()` 统一处理 variant 基础字号 + style prop 的 fontSize/lineHeight
  - 覆盖所有 BentoText 组件（含 Button/Badge/TabBar/MetricBlock 的硬编码 fontSize）
- **TextInput 单独处理**: LabeledInput + index.tsx(5处) + train.tsx(2处) + CalendarHistoryPanel(2处)
- **UI入口**: 更多页「外观模式」下方的 FontScaleCard，四档按钮+实时预览
- **日间/夜间兼容**: ThemeProvider useMemo 同时依赖 appearanceMode + fontScale，切换模式不影响字体大小
