# 架构评审

> 团队成员：高见远，架构师  
> 审计日期：2026-06-27  
> 审计对象：`C:\Users\Administrator\Documents\健身日历` 当前未提交工作区快照  
> 评分：4.4/10  

## 1. 结论

项目选型方向基本正确：Monorepo、Expo Router、Zustand、`shared` 包和离线数据包适合当前 MVP。但实际实现没有守住模块边界：`shared/index.ts` 变成万能入口，`shared/domain` 和 `shared/components` 基本空置，页面文件承担 UI、状态、业务计算、网络请求、缓存和数据归一化。

架构上最需要先处理的是“分层落地”，不是引入更复杂框架。短期目标应是把页面瘦身、把类型和领域算法从聚合入口拆出来、让基础组件与业务 store 解耦。

## 2. 当前架构事实

- `C:\Users\Administrator\Documents\健身日历\shared\index.ts`：484 行，混合类型、数据导入、营养公式、训练计划生成、聚合导出。
- `C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\index.tsx`：972 行，饮食首页含大量 selector、计算和内联子组件。
- `C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\train.tsx`：1261 行，训练页含外部 API、GIF 处理、本地/远程 fallback、UI 状态和归一化逻辑。
- `C:\Users\Administrator\Documents\健身日历\shared\domain\nutrition`、`shared\domain\plan-engine`、`shared\domain\training`、`shared\components`：目录存在但当前无源码文件。
- `C:\Users\Administrator\Documents\健身日历\shared\data`：承载大体积食品和动作数据，含运行数据、生成数据、备份副本混杂。

## 3. P0 问题

本轮架构审查没有发现“项目无法编译或无法运行测试”的 P0。`pnpm --recursive run typecheck` 和 `pnpm --recursive run test` 均通过。

但以下 P1 问题会直接阻碍后续扩展，建议按上线阻断处理。

## 4. P1 问题

### P1-1 `shared/index.ts` 职责过载

位置：`C:\Users\Administrator\Documents\健身日历\shared\index.ts:1`  
证据：同一文件导出类型、设计 token、动态计划引擎、食物数据、身体目标选项、营养公式和训练生成函数。  
风险：任何模块 import `@fitness-calendar/shared` 都可能拉入不必要的大数据和领域逻辑，难以按需加载和测试隔离。  
建议：拆分为：

- `shared/types`：`Food`、`NutritionTotals`、`TrainingPreference` 等类型。
- `shared/data`：只放运行时数据入口。
- `shared/domain/nutrition`：BMR/TDEE、宏量营养、食物汇总。
- `shared/domain/training`：训练队列、动作选择。
- `shared/domain/plan-engine`：跨天调整、余额账本、解释文本。

### P1-2 shared 内部存在反向依赖趋势

位置：`C:\Users\Administrator\Documents\健身日历\shared\dynamic-plan-engine.ts:1`，`C:\Users\Administrator\Documents\健身日历\shared\data\category-fallback-foods.ts:1`  
证据：领域引擎和数据文件从 `index` 引类型，而 `index` 又聚合导入数据。  
风险：后续拆包时容易形成循环依赖，类型改动会牵连数据和业务。  
建议：所有类型移动到 `shared/types`，data 和 domain 只依赖 types，不依赖 facade。

### P1-3 页面组件承担过多职责

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\train.tsx:239`，`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\train.tsx:1109`  
证据：训练页直接请求 WorkoutX、请求 GitHub fallback、处理 GIF blob、归一化动作库并渲染 UI。  
风险：外部服务变化、缓存策略和 UI 状态互相影响，难做单元测试。  
建议：抽出 `features/training/exercise-library-service.ts`、`features/training/useExerciseLibrary.ts` 和纯展示组件。

### P1-4 基础 UI 组件依赖业务 store

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\components\bento\ThemeProvider.tsx:3`  
证据：ThemeProvider 直接 import `useFitnessStore`。  
风险：基础组件无法独立移动到 `shared/components`，也不能脱离当前 store 复用。  
建议：ThemeProvider 接收 `mode` prop 或通过 app adapter 注入；公共组件不直接依赖业务 store。

### P1-5 领域 feature 依赖 store 类型

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\features\today-plan.ts:14`  
证据：`today-plan.ts` 从 `../store/fitness-store` 引入 `ActualTrainingStatus`。  
风险：纯计算模块被状态实现污染，未来迁移到 shared/domain 会被阻塞。  
建议：训练状态类型放到 `shared/types/training.ts` 或 feature 本地 types。

## 5. P2 问题

- `C:\Users\Administrator\Documents\健身日历\shared\data\curated-foods.ts` 约 738KB，`off-foods-generated.ts` 约 257KB，建议区分运行数据、导入原始数据和备份归档。
- `C:\Users\Administrator\Documents\健身日历\apps\mobile\components\bento` 中原子组件应逐步迁移到 `shared/components`，业务卡片留在 app 层。
- 多处中文内容在 PowerShell 默认读取下出现乱码，需统一 UTF-8 读写与数据生成链路，并增加 mojibake 检查。

## 6. 推荐目标架构

```text
apps/mobile
  app/                路由与页面组装
  features/           移动端交互 hooks 与业务卡片
  store/              Zustand 状态和持久化 adapter

shared
  components/         不依赖业务 store 的 UI 原子组件
  types/              跨端类型
  data/               精简运行数据入口
  domain/nutrition    纯营养计算
  domain/training     纯训练计划计算
  domain/plan-engine  recommend -> actual -> adjust 引擎
```

## 7. 验证

已验证：

```powershell
pnpm --recursive run typecheck
pnpm --recursive run test
```

未验证：未执行 bundle 分析、依赖图可视化、真机运行。

