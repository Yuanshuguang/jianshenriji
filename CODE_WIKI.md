# 健身日历 · Code Wiki

> 轻量级、离线优先的健身饮食动态计划助手

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈与架构](#2-技术栈与架构)
3. [项目结构](#3-项目结构)
4. [核心模块详解](#4-核心模块详解)
5. [数据模型与类型定义](#5-数据模型与类型定义)
6. [状态管理](#6-状态管理)
7. [UI 组件库](#7-ui-组件库)
8. [核心算法与公式](#8-核心算法与公式)
9. [依赖关系图](#9-依赖关系图)
10. [项目运行方式](#10-项目运行方式)
11. [开发规范与约定](#11-开发规范与约定)

---

## 1. 项目概述

### 1.1 产品定位

健身日历是一个**移动优先、离线优先**的轻量级健身饮食动态计划助手。用户提供身体数据、目标、饮食和训练执行情况后，App 基于内置食品库、训练动作库和计算公式，实时给出饮食克数、训练安排和后续动态调整。

### 1.2 核心差异化

- **离线优先**：核心能力完全本地运行，不依赖联网或 AI
- **动态调整**：根据每日实际摄入和训练情况，自动调整后续 3-7 天计划
- **智能解析**：自然语言输入食物和训练，自动识别匹配营养数据
- **宠物陪伴**：20 个预设宠物 + 自定义宠物，根据饮食/训练数据生成个性化提醒

### 1.3 MVP 核心闭环

```
用户设置身体/目标/训练习惯
    ↓
系统生成当日饮食+训练推荐
    ↓
用户选择食物 / 补充实际摄入
    ↓
系统计算热量和营养偏差
    ↓
动态调整未来 3-7 天饮食
    ↓
用户补充实际训练
    ↓
系统估算消耗并调整训练队列
    ↓
输出可解释的调整原因
```

---

## 2. 技术栈与架构

### 2.1 整体架构

采用 **Monorepo** 架构（pnpm workspace），分为三层：

```
┌─────────────────────────────────────────┐
│              apps/mobile                │  ← 移动端应用（React Native + Expo）
├─────────────────────────────────────────┤
│               apps/api                  │  ← 后端 API（Hono，预留扩展）
├─────────────────────────────────────────┤
│                shared                   │  ← 共享模块（类型、数据、引擎）
└─────────────────────────────────────────┘
```

### 2.2 技术栈详情

| 层级 | 技术选型 | 版本 | 用途 |
|------|---------|------|------|
| 移动端框架 | React Native | 0.85.3 | 跨平台移动应用 |
| 移动端平台 | Expo | 56.0.12 | 开发工具链与运行时 |
| 路由 | Expo Router | 56.2.11 | 文件式路由 |
| 状态管理 | Zustand | 5.0.9 | 全局状态 + 持久化 |
| 语言 | TypeScript | 6.0.3 | 类型安全 |
| UI 库 | 自研 Bento Glass | — | 玻璃态设计组件库 |
| 后端框架 | Hono | — | 轻量级 API 服务 |
| 包管理 | pnpm | 11.5.2 | Monorepo 包管理 |
| 图标 | SVG | — | 内置 SVG 图标库 |

### 2.3 架构设计原则

1. **离线优先**：MVP 核心能力完全本地运行，API 服务仅用于未来扩展
2. **数据与逻辑分离**：公式引擎、食品库、动作库全部在 `shared` 层
3. **状态集中管理**：Zustand 单 store 管理全局状态，支持持久化
4. **组件化设计**：Bento Glass 组件库提供统一视觉语言
5. **可解释性**：每次动态调整都必须有可读的解释文案

---

## 3. 项目结构

### 3.1 目录树

```
健身日历/
├── apps/
│   ├── mobile/                    # 移动端应用
│   │   ├── app/                   # Expo Router 页面
│   │   │   ├── _layout.tsx        # 根布局
│   │   │   ├── (tabs)/            # 底部导航 Tab
│   │   │   │   ├── _layout.tsx    # Tab 布局
│   │   │   │   ├── index.tsx      # 饮食页（首页）
│   │   │   │   ├── train.tsx      # 训练页
│   │   │   │   ├── plan.tsx       # 计划页
│   │   │   │   ├── calendar.tsx   # 日历页
│   │   │   │   └── more.tsx       # 更多页
│   │   │   └── onboarding/        # 引导流程
│   │   │       ├── body.tsx       # 身体数据录入
│   │   │       ├── goal.tsx       # 目标设置
│   │   │       └── training-preference.tsx  # 训练偏好
│   │   ├── components/            # UI 组件
│   │   │   ├── bento/             # Bento Glass 组件库
│   │   │   ├── Calendar.tsx       # 日历组件
│   │   │   └── CalendarHistoryPanel.tsx  # 日历历史面板
│   │   ├── features/              # 业务逻辑层
│   │   │   ├── food-intelligence-engine.ts  # 食物智能引擎（入口）
│   │   │   ├── food-parser-engine.ts        # 食物解析引擎
│   │   │   ├── food-lookup.ts               # 在线食物查询
│   │   │   ├── today-plan.ts                # 今日计划
│   │   │   ├── adjustments.ts               # 每日调整摘要
│   │   │   ├── diet-plans.ts                # 饮食方案模板库
│   │   │   ├── my-menu.ts                   # 自定义食物
│   │   │   ├── pet.ts                       # 宠物系统
│   │   │   └── __tests__/                   # 单元测试
│   │   ├── store/                 # 状态管理
│   │   │   └── fitness-store.ts   # Zustand Store
│   │   ├── app.json               # Expo 配置
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── api/                       # API 服务（预留）
│       └── src/
│           ├── routes/
│           │   └── health.ts      # 健康检查路由
│           └── index.ts           # 服务入口
├── shared/                        # 共享模块
│   ├── data/                      # 数据层
│   │   ├── curated-foods.ts       # 精选食物库（CSV 导入）
│   │   ├── off-foods-generated.ts # OFF 数据库生成的食物
│   │   ├── new-foods-batch*.ts    # 分批食物数据
│   │   └── scripts/               # 数据处理脚本
│   ├── design-tokens.ts           # 设计令牌（纯数据）
│   ├── dynamic-plan-engine.ts     # 动态计划引擎
│   ├── index.ts                   # 类型定义 + 食物库 + 动作库 + 核心公式
│   └── package.json
├── docs/                          # 项目文档
├── ui-redesign/                   # UI 设计探索（Python 渲染）
├── fitness-calendar-apple-style/  # Apple 风格设计原型
├── package.json                   # 根 package.json
├── pnpm-workspace.yaml           # pnpm workspace 配置
├── PRD.md                         # 产品需求文档
├── TECHNICAL_PLAN.md              # 技术方案
└── MVP_BUILD_PLAN.md              # MVP 构建计划
```

### 3.2 模块职责划分

| 目录 | 职责 | 依赖 |
|------|------|------|
| `apps/mobile/app` | 页面路由与 UI 渲染 | components, features, store, shared |
| `apps/mobile/components` | 可复用 UI 组件 | shared (design-tokens) |
| `apps/mobile/features` | 业务逻辑与计算 | shared, store |
| `apps/mobile/store` | 全局状态管理 | shared |
| `shared` | 共享类型、数据、公式引擎 | 无外部业务依赖 |
| `apps/api` | 后端 API 服务 | 独立运行 |

---

## 4. 核心模块详解

### 4.1 共享模块 (shared)

#### 4.1.1 核心入口 — index.ts

**位置**：[shared/index.ts](file:///c:/Users/Administrator/Documents/健身日历/shared/index.ts)

**核心职责**：
- 导出所有公共类型定义
- 内置食物库（130+ 种食物）
- 内置训练动作库（14 个基础动作）
- 核心计算公式函数

**关键类型**：

| 类型 | 描述 |
|------|------|
| `Food` | 食物数据结构（营养成分、别名、份量单位等） |
| `FoodPortion` | 食物份量（食物 ID + 克数 + 营养总量） |
| `NutritionTotals` | 营养总量（热量、蛋白质、脂肪、碳水） |
| `EnergyPlan` | 能量计划（BMR、TDEE、每日赤字、宏量营养素） |
| `Exercise` | 训练动作（肌群、器材、MET 值） |
| `WorkoutPlan` | 训练计划（动作列表、预估时长） |
| `DailyLogEntry` | 每日日志记录 |

**核心函数**：

| 函数 | 签名 | 功能 |
|------|------|------|
| `calculateGoalEnergyPlan` | `(input) => EnergyPlan` | 根据身体数据和目标计算能量计划 |
| `getFoodCatalog` | `(customFoods?) => Food[]` | 获取完整食物目录（内置+自定义） |
| `calculateFoodTotals` | `(food, grams) => NutritionTotals` | 计算食物份量的营养总量 |
| `sumNutrition` | `(values) => NutritionTotals` | 汇总多项营养数据 |
| `calculateNutritionGap` | `(target, actual) => NutritionTotals` | 计算目标与实际的营养差距 |
| `recommendMacroAwarePortions` | `(selectedFoods, energyPlan) => FoodPortion[]` | 根据宏量目标智能分配食物份量 |
| `generateTrainingQueue` | `(allExercises, preference) => WorkoutPlan[]` | 生成训练计划队列 |

#### 4.1.2 动态计划引擎 — dynamic-plan-engine.ts

**位置**：[shared/dynamic-plan-engine.ts](file:///c:/Users/Administrator/Documents/健身日历/shared/dynamic-plan-engine.ts)

**核心职责**：
- 计算每日饮食和训练偏差
- 动态调整后续 3-7 天的热量和宏量目标
- 支持细粒度的调整规则开关

**核心类型**：

| 类型 | 描述 |
|------|------|
| `DynamicAdjustmentSettings` | 动态调整开关（营养/餐次/训练/肌群） |
| `AdjustmentRules` | 调整规则参数（安全下限、分摊天数等） |
| `DynamicPlanEngineInput` | 引擎输入（用户信息、营养台账、训练台账） |
| `DynamicPlanEngineResult` | 引擎输出（调整后目标、分摊天数、忽略规则） |

**核心函数**：

| 函数 | 功能 |
|------|------|
| `createDefaultAdjustmentRules` | 创建默认调整规则（按性别设置安全下限） |
| `calculateDynamicPlanAdjustment` | 核心计算函数，输出动态调整结果 |
| `calculateDefaultMealBudgets` | 按比例分配各餐热量预算（早25%/午35%/晚30%/加餐10%） |

**调整逻辑**：

1. 计算饮食偏差（实际摄入 vs 目标）
2. 计算训练偏差（实际消耗 vs 计划消耗）
3. 合并净偏差 = 饮食偏差 + 训练偏差
4. 按 `caloriesPerAdjustmentDay`（默认 180kcal/天）分摊到 3-7 天
5. 调整后热量不低于安全下限（男 1500 / 女 1200）
6. 宏量营养素按比例调整，蛋白质优先保留

#### 4.1.3 设计令牌 — design-tokens.ts

**位置**：[shared/design-tokens.ts](file:///c:/Users/Administrator/Documents/健身日历/shared/design-tokens.ts)

**核心职责**：
- 定义统一的视觉设计语言
- 纯数据，无 React Native 依赖，可跨端复用

**包含内容**：

| 类别 | 内容 |
|------|------|
| 颜色系统 | 日间/夜间主题、玻璃态层、文字层、强调色、辉光色 |
| 排版系统 | 字体族、字号阶梯、字重、行高、字间距 |
| 间距系统 | 4px 基准的 8 级间距 |
| 圆角系统 | 6 级圆角（sm → pill） |
| Bento 布局 | 页面内边距、卡片间距、卡片圆角 |
| 动画系统 | 时长、缓动函数 |
| 数据色映射 | 数据语义 → 强调色映射表 |

---

### 4.2 移动端业务逻辑层 (features)

#### 4.2.1 食物智能解析引擎

**入口**：[features/food-intelligence-engine.ts](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/features/food-intelligence-engine.ts)
**核心实现**：[features/food-parser-engine.ts](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/features/food-parser-engine.ts)

**核心功能**：
- 自然语言食物输入解析
- 智能匹配食物库（名称 + 别名）
- 自动识别份量（数量 + 单位 + 语义估算）
- 餐次识别（早/午/晚/加餐）
- 置信度评分与确认提示

**解析流程**：

```
原始文本输入
    ↓
normalizeFoodText — 文本归一化（小写、标点转空格、简繁统一）
    ↓
detectMealMarkers — 识别餐次关键词
    ↓
buildCandidates — 构建候选食物列表（名称+别名）
    ↓
findFoodRanges — 在文本中查找食物匹配区间
    ↓
buildItem — 逐个构建解析结果
    ├─ 识别所属餐次
    ├─ estimateServing — 估算份量
    │   ├─ 显式重量（g/kg/斤）
    │   ├─ 数量 + 食物单位（个/碗/杯）
    │   ├─ 数量 + 通用单位（份/盘）
    │   ├─ 语义餐次估算（按餐次热量比例）
    │   ├─ 抽象尺寸（拳头、手机重量锚定）
    │   └─ 默认份量
    └─ scoreConfidence — 计算置信度
    ↓
返回 FoodIntelligenceResult
```

**关键类型**：

| 类型 | 描述 |
|------|------|
| `FoodIntelligenceItem` | 单个食物解析结果 |
| `FoodIntelligenceResult` | 完整解析结果（匹配项、未匹配项、置信度） |
| `FoodMealSlot` | 餐次时段（breakfast/lunch/dinner/snack/unknown） |
| `FoodServingContext` | 份量估算上下文（每日热量目标、默认餐次） |

#### 4.2.2 今日计划 — today-plan.ts

**位置**：[features/today-plan.ts](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/features/today-plan.ts)

**核心职责**：
- 食物文本解析结果到业务模型的转换
- 餐次分配与餐计划构建
- 训练消耗估算
- 训练队列推进逻辑

**核心函数**：

| 函数 | 功能 |
|------|------|
| `parseFoodText` | 解析食物文本为匹配列表 |
| `buildActualFoodPortionsFromText` | 从文本构建实际食物份量 |
| `buildMealPlan` | 将食物份量分配到各餐，生成餐计划 |
| `estimateTodayWorkoutCalories` | 估算今日计划训练消耗 |
| `estimateActualTrainingCalories` | 估算实际训练消耗（支持文本描述） |
| `getNextWorkoutAfterFeedback` | 根据训练反馈获取下一个训练计划 |

#### 4.2.3 每日调整摘要 — adjustments.ts

**位置**：[features/adjustments.ts](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/features/adjustments.ts)

**核心职责**：
- 封装动态计划引擎调用
- 生成人类可读的调整原因文案
- 安全边界警告

**核心函数**：

| 函数 | 功能 |
|------|------|
| `buildDailyAdjustmentSummary` | 构建每日调整摘要（标题、原因、数值） |
| `getNextWorkoutLabel` | 获取下一个训练的显示标签 |

#### 4.2.4 宠物系统 — pet.ts

**位置**：[features/pet.ts](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/features/pet.ts)

**核心职责**：
- 20 个预设宠物数据（10 全球最萌 + 10 短视频热门）
- 自定义宠物支持
- 基于饮食/训练数据生成个性化提醒
- 4 种性格语气（温柔/活泼/严厉/卖萌）

**核心类型**：

| 类型 | 描述 |
|------|------|
| `PresetPet` | 预设宠物（ID、名称、emoji、性格、口头禅） |
| `CustomPet` | 自定义宠物（名称、emoji、性格、照片） |
| `PetReminder` | 宠物提醒（图标、标题、正文、语气类型） |
| `DietReminderContext` | 饮食提醒上下文（摄入数据、目标数据） |
| `TrainingReminderContext` | 训练提醒上下文（计划状态、实际状态） |

**提醒生成逻辑**：

饮食提醒优先级（从高到低）：
1. 未记录任何摄入 → 鼓励记录
2. 热量严重超标 (>115%) → 警告
3. 蛋白质不足 (<70%) → 建议补充
4. 脂肪过多 (>120%) → 警告
5. 碳水不足 (<60%) → 提示
6. 接近达标 (85%-105%) → 表扬
7. 默认 → 进度提示

训练提醒：
- 待训练 + 有计划 → 鼓励开始
- 待训练 + 无计划 → 休息日提示
- 已完成 → 表扬
- 未完成 → 温和提醒
- 已更改 → 灵活调整鼓励

#### 4.2.5 饮食方案模板库 — diet-plans.ts

**位置**：[features/diet-plans.ts](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/features/diet-plans.ts)

**核心职责**：
- 提供 4 大类 13 种饮食健身方案
- 供用户在「更多」页选择套用

**方案分类**：

| 类别 | 方案数量 | 代表方案 |
|------|---------|---------|
| 碳水调控类 | 6 | 均衡高碳、碳循环、低碳、生酮、碳水后置、慢碳 |
| 时间限制性断食 | 3 | 16+8、5+2、隔日断食 |
| 均衡健康类 | 2 | 高蛋白均衡、地中海饮食 |
| 小众短期减脂 | 2 | 原始人饮食、3日军人饮食 |

#### 4.2.6 自定义食物 — my-menu.ts

**位置**：[features/my-menu.ts](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/features/my-menu.ts)

**核心职责**：
- 自定义食物表单数据模型
- 从营养标签文本自动提取营养数据
- 从图片文件名推断食物名称

#### 4.2.7 在线食物查询 — food-lookup.ts

**位置**：[features/food-lookup.ts](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/features/food-lookup.ts)

**核心职责**：
- 当本地食物库未命中时的后备方案
- 基于关键词规则的粗粒度营养估算

---

### 4.3 状态管理 (store)

#### 4.3.1 全局 Store — fitness-store.ts

**位置**：[apps/mobile/store/fitness-store.ts](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/store/fitness-store.ts)

**技术选型**：Zustand + persist 中间件

**存储策略**：
- 主存储：localStorage（Web 端）
- 回退存储：IndexedDB（防止 localStorage 被清理）
- 存储键名：`fitness-calendar-state`
- 版本：5（支持迁移）

**状态结构**：

```typescript
FitnessState {
  // 用户档案
  profile: UserProfile           // 身体数据（性别、年龄、身高、体重、训练水平）
  goal: UserGoal                 // 目标数据（目标体重、天数、目标体态）
  trainingPreference: TrainingPreferenceDraft  // 训练偏好
  
  // 饮食相关
  selectedFoodIds: string[]      // 已选食物ID
  preparedFoodText: string       // 准备吃的食物文本
  actualFoodText: string         // 实际摄入食物文本
  actualMealTexts: Record<MealAdjustmentKey, string>  // 各餐实际文本
  actualFoodIds: string[]        // 实际食物ID
  customFoods: Food[]            // 自定义食物列表
  
  // 训练相关
  actualTraining: ActualTrainingFeedback   // 实际训练反馈
  todayTrainingPlan: TodayTrainingPlanDraft // 今日训练计划
  
  // 设置
  dynamicAdjustmentEnabled: boolean        // 动态调整总开关
  dynamicAdjustmentSettings: DynamicAdjustmentSettings  // 细分调整开关
  appearanceMode: AppearanceMode           // 外观模式（日间/夜间）
  selectedDietPlanId: string | null        // 选中的饮食方案
  selectedPetId: string | null             // 选中的预设宠物
  customPet: CustomPet | null              // 自定义宠物
  petEnabled: boolean                      // 宠物功能开关
  
  // 历史
  historyLogs: Record<string, DailyLogEntry>  // 按日期索引的历史日志
  
  // Actions
  setProfile, setGoal, setTrainingPreference, ...
  saveDailyLog, getLogForDate,
  isOnboardingComplete
}
```

**核心派生 Hook**：

| Hook | 功能 |
|------|------|
| `useCurrentEnergyPlan` | 根据当前 profile + goal 计算能量计划 |

**辅助函数**：

| 函数 | 功能 |
|------|------|
| `getActivityFactor` | 根据训练水平获取活动系数（新手1.3 / 有基础1.45 / 规律1.6） |
| `buildTrainingQueue` | 构建训练队列 |
| `isOnboardingComplete` | 判断引导流程是否完成 |

---

### 4.4 UI 组件库 (Bento Glass)

**位置**：[apps/mobile/components/bento/](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento)

**设计风格**：Liquid Glass — 模块化磨砂玻璃、柔和彩色底图、日夜双主题

#### 4.4.1 组件清单

| 组件 | 文件 | 描述 |
|------|------|------|
| `Text` | [Text.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/Text.tsx) | 基础文本组件（多级变体） |
| `Label` | [Label.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/Label.tsx) | 标签文本（小号大写） |
| `GlassTile` | [GlassTile.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/GlassTile.tsx) | 玻璃态卡片容器 |
| `ProgressRing` | [ProgressRing.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/ProgressRing.tsx) | 环形进度条 |
| `ProgressBar` | [ProgressBar.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/ProgressBar.tsx) | 线性进度条 |
| `Button` | [Button.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/Button.tsx) | 按钮组件 |
| `Badge` | [Badge.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/Badge.tsx) | 徽章组件 |
| `Screen` | [Screen.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/Screen.tsx) | 页面容器 + 头部 |
| `BentoGrid` | [BentoGrid.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/BentoGrid.tsx) | Bento 网格布局 |
| `BentoTabBar` | [TabBar.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/TabBar.tsx) | 底部导航栏 |
| `MetricBlock` | [MetricBlock.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/MetricBlock.tsx) | 指标展示块 |
| `LabeledInput` | [LabeledInput.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/LabeledInput.tsx) | 带标签输入框 |
| `SelectChip` | [SelectChip.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/SelectChip.tsx) | 选择芯片 |
| `CollapsibleCard` | [CollapsibleCard.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/CollapsibleCard.tsx) | 可折叠卡片 |
| `Switch` | [Switch.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/Switch.tsx) | 开关组件 |
| `PetReminderCard` | [PetReminderCard.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/PetReminderCard.tsx) | 宠物提醒卡片 |
| `ThemeProvider` | [ThemeProvider.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/components/bento/ThemeProvider.tsx) | 主题提供者 |

#### 4.4.2 主题系统

**日间主色**：
- 背景：`#EEF6FF`（淡蓝）
- 玻璃层：`rgba(255,255,255,0.48)`
- 主文字：`#142033`（深蓝黑）
- 主强调：`#008CFF`（iOS 蓝）
- 次强调：`#7357FF`（柔紫）
- 成功：`#00A978`（绿）
- 警告：`#E4435E`（红）

**夜间主色**：
- 背景：`#101827`（深灰蓝）
- 玻璃层：`rgba(255,255,255,0.12)`
- 主文字：`#F4F8FF`（近白）

---

### 4.5 页面结构

#### 4.5.1 引导流程 (onboarding)

| 页面 | 文件 | 内容 |
|------|------|------|
| 身体数据 | [onboarding/body.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/app/onboarding/body.tsx) | 性别、年龄、身高、体重、训练水平 |
| 目标设置 | [onboarding/goal.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/app/onboarding/goal.tsx) | 目标体重、目标周期、目标体态 |
| 训练偏好 | [onboarding/training-preference.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/app/onboarding/training-preference.tsx) | 频率、时长、器材、偏好部位、有氧比例 |

#### 4.5.2 底部导航 (tabs)

| Tab | 文件 | 核心功能 |
|-----|------|---------|
| 饮食 | `index.tsx`（首页） | 今日饮食推荐、实际摄入记录、营养偏差 |
| 训练 | [train.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/app/(tabs)/train.tsx) | 今日训练推荐、训练记录、消耗估算 |
| 计划 | [plan.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/app/(tabs)/plan.tsx) | 动态调整说明、未来计划预览 |
| 日历 | [calendar.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/app/(tabs)/calendar.tsx) | 历史日历、每日详情 |
| 更多 | [more.tsx](file:///c:/Users/Administrator/Documents/健身日历/apps/mobile/app/(tabs)/more.tsx) | 设置、饮食方案、宠物、自定义食物 |

---

## 5. 数据模型与类型定义

### 5.1 核心数据模型

#### UserProfile — 用户身体档案

```typescript
{
  gender: "male" | "female"           // 性别
  age: number                          // 年龄
  heightCm: number                     // 身高(cm)
  weightKg: number                     // 体重(kg)
  trainingLevel: "beginner" | "intermediate" | "regular"  // 训练水平
}
```

#### Food — 食物

```typescript
{
  id: string                           // 唯一标识
  name: string                         // 名称
  aliases: string[]                    // 别名列表
  category: FoodCategory               // 分类
  caloriesPer100g: number              // 每100g热量(kcal)
  proteinPer100g: number               // 每100g蛋白质(g)
  fatPer100g: number                   // 每100g脂肪(g)
  carbsPer100g: number                 // 每100g碳水(g)
  defaultUnitGram: number              // 默认份量(g)
  servingUnits?: ServingUnit[]         // 常用单位列表
  source?: "builtin" | "custom" | "online"  // 来源
  confidenceLevel?: "high" | "reference" | "estimate"  // 置信度
}
```

#### FoodCategory — 食物分类

| 分类 | 描述 | 示例 |
|------|------|------|
| `staple` | 主食 | 米饭、面条、馒头、红薯 |
| `protein` | 蛋白质 | 鸡胸肉、鸡蛋、牛肉、鱼虾 |
| `vegetable` | 蔬菜 | 西兰花、菠菜、黄瓜、番茄 |
| `fruit` | 水果 | 香蕉、苹果、橙子、草莓 |
| `snack` | 零食 | 薯片、巧克力、坚果、蛋糕 |
| `drink` | 饮料 | 牛奶、可乐、奶茶、咖啡 |
| `dish` | 菜肴 | 西红柿炒蛋、红烧肉、宫保鸡丁 |
| `fastfood` | 快餐 | 汉堡、炸鸡、披萨、火锅 |
| `supplement` | 补剂 | 蛋白粉 |

#### Exercise — 训练动作

```typescript
{
  id: string                           // 唯一标识
  name: string                         // 名称
  aliases: string[]                    // 别名
  primaryMuscleGroup: MuscleGroup      // 主要肌群
  equipment: string[]                  // 所需器材
  met: number                          // 代谢当量（用于消耗计算）
}
```

#### MuscleGroup — 肌群

| 肌群 | 中文 | 代表动作 |
|------|------|---------|
| `chest` | 胸部 | 俯卧撑、卧推 |
| `back` | 背部 | 引体向上、划船 |
| `legs` | 腿部 | 深蹲、弓步蹲 |
| `shoulders` | 肩部 | 推举、侧平举 |
| `arms` | 手臂 | 弯举、臂屈伸 |
| `core` | 核心 | 平板支撑、卷腹 |
| `cardio` | 有氧 | 跑步、动感单车 |

#### EnergyPlan — 能量计划

```typescript
{
  calories: number                     // 每日目标热量(kcal)
  proteinG: number                     // 蛋白质目标(g)
  fatG: number                         // 脂肪目标(g)
  carbsG: number                       // 碳水目标(g)
  bmr: number                          // 基础代谢率
  tdee: number                         // 总日能量消耗
  dailyDeficit: number                 // 每日热量赤字(kcal)
}
```

#### DailyLogEntry — 每日日志

```typescript
{
  date: string                         // 日期 (YYYY-MM-DD)
  targetCalories: number               // 目标热量
  actualIntake: NutritionTotals        // 实际摄入
  actualFoodText: string               // 实际摄入原始文本
  actualMealTexts: {                   // 各餐实际文本
    breakfast: string
    lunch: string
    dinner: string
    snack: string
  }
  training: {                          // 训练情况
    status: "done" | "missed" | "pending" | "changed"
    text: string
    minutes: number
    calories: number
    fatigue: number
  }
  isComplete: boolean                  // 当日是否完整记录
}
```

---

## 6. 状态管理

### 6.1 Zustand Store 架构

```
useFitnessStore
    ├── State
    │   ├── profile (UserProfile)
    │   ├── goal (UserGoal)
    │   ├── trainingPreference (TrainingPreferenceDraft)
    │   ├── 饮食状态 (selectedFoodIds, preparedFoodText, actualFoodText, ...)
    │   ├── 训练状态 (actualTraining, todayTrainingPlan)
    │   ├── 设置 (dynamicAdjustment, appearanceMode, pet, ...)
    │   └── historyLogs (Record<string, DailyLogEntry>)
    ├── Actions (setters + saveDailyLog + getLogForDate + ...)
    └── Selectors (派生数据 Hook)
        └── useCurrentEnergyPlan
```

### 6.2 持久化策略

- **中间件**：`persist` from `zustand/middleware`
- **序列化**：JSON
- **存储键**：`fitness-calendar-state`
- **版本管理**：version 5 + migrate 函数
- **双存储机制**：
  1. localStorage（主，快速访问）
  2. IndexedDB（备，防止被清理）

### 6.3 数据流转

```
用户输入 → Action 更新 Store → 持久化到存储
                            ↓
                  组件通过 selector 订阅 → UI 重新渲染
```

---

## 7. UI 组件库

### 7.1 Bento Glass 设计语言

**核心概念**：
- **玻璃态 (Glassmorphism)**：半透明背景 + 模糊 + 细边框
- **Bento 布局**：模块化卡片网格，信息密度高
- **霓虹辉光**：强调色阴影，营造科技感
- **双主题**：日间明亮清爽 / 夜间深邃柔和

### 7.2 组件使用约定

```tsx
// 页面结构
<Screen title="今日饮食">
  <ScrollView contentContainerStyle={scrollViewContent}>
    
    {/* 指标卡片 */}
    <BentoRow>
      <BentoCol>
        <MetricBlock label="热量" value={calories} ... />
      </BentoCol>
    </BentoRow>
    
    {/* 玻璃卡片 */}
    <GlassTile raised>
      <Text variant="h3">标题</Text>
    </GlassTile>
    
  </ScrollView>
</Screen>
```

---

## 8. 核心算法与公式

### 8.1 BMR 计算（Mifflin-St Jeor 公式）

```
男性: BMR = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 + 5
女性: BMR = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 - 161
```

### 8.2 TDEE 计算

```
TDEE = BMR × 活动系数

活动系数：
- 新手 (beginner): 1.3
- 有基础 (intermediate): 1.45
- 规律训练 (regular): 1.6
```

### 8.3 目标热量计算

```
每日赤字 = (当前体重 - 目标体重) × 7700 / 目标天数
限制：每日赤字在 [-300, 750] kcal 范围内
目标热量 = max(1200, TDEE - 每日赤字)
```

> 7700 kcal ≈ 1kg 脂肪

### 8.4 宏量营养素分配

```
蛋白质 = 体重(kg) × 1.8 g
脂肪 = max(40g, 目标热量 × 25% / 9)
碳水 = max(80g, (目标热量 - 蛋白质×4 - 脂肪×9) / 4)
```

### 8.5 训练消耗估算（MET 法）

```
消耗热量(kcal) = MET × 3.5 × 体重(kg) / 200 × 分钟数
```

### 8.6 动态调整分摊

```
净偏差 = 饮食偏差 + 训练偏差
分摊天数 = clamp(ceil(|净偏差| / 180), 3, 7)
调整后每日热量 = max(安全下限, 原目标 - 净偏差/天数)
```

### 8.7 食物份量智能分配

```
对每种食物计算优先级权重：
- 蛋白质类: 1.35
- 快餐/菜肴: 1.1
- 主食/其他: 1.0
- 蔬菜: 0.65
- 水果: 0.55
- 饮料: 0.45
- 零食: 0.35

按权重比例分配总热量，换算成克数，限制在合理范围。
```

---

## 9. 依赖关系图

### 9.1 模块依赖

```
apps/mobile
    ├── @fitness-calendar/shared (workspace:*)
    ├── expo / expo-router
    ├── react / react-native
    ├── zustand
    └── react-native-svg (图表)

apps/api
    └── hono (Web 框架)

shared
    └── (纯 TypeScript，无运行时外部依赖)
```

### 9.2 内部依赖方向

```
app (页面)
    ↓ 调用
components (UI) + features (业务逻辑)
    ↓ 依赖
store (状态)
    ↓ 依赖
shared (数据/公式/类型)
```

**依赖规则**：
- 上层可以依赖下层，下层不能依赖上层
- shared 层不依赖任何 UI 框架或状态管理
- features 层只依赖 shared 和 store 类型，不依赖组件
- components 层只依赖 shared 的 design-tokens

---

## 10. 项目运行方式

### 10.1 环境要求

- Node.js >= 18
- pnpm 11.5.2
- （可选）Expo Go App 或 iOS/Android 模拟器

### 10.2 安装依赖

```bash
# 安装所有包
pnpm install
```

### 10.3 开发命令

```bash
# 启动移动端开发服务器
pnpm dev:mobile

# 启动 API 服务（可选）
pnpm dev:api

# 类型检查（全项目）
pnpm typecheck

# 运行测试
pnpm test

# 运行食物解析冒烟测试
pnpm smoke
# 或
pnpm food:smoke
```

### 10.4 移动端运行方式

1. 运行 `pnpm dev:mobile` 启动 Expo 开发服务器
2. 用手机 Expo Go 扫描二维码，或
3. 按 `a` 在 Android 模拟器运行，或
4. 按 `i` 在 iOS 模拟器运行

### 10.5 Web 预览

```bash
# 在 apps/mobile 目录下
pnpm export:web
```

### 10.6 数据脚本

```bash
# 导入精选食物数据
pnpm --dir shared import:curated-foods

# 运行共享模块测试
pnpm --dir shared test
```

---

## 11. 开发规范与约定

### 11.1 命名约定

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `GlassTile.tsx` |
| 页面文件 | kebab-case | `training-preference.tsx` |
| 工具/逻辑文件 | kebab-case | `food-parser-engine.ts` |
| 组件名 | PascalCase | `ProgressRing` |
| 函数名 | camelCase | `calculateGoalEnergyPlan` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_CALORIES` |
| 类型/接口 | PascalCase | `UserProfile` |
| Hook | use + PascalCase | `useCurrentEnergyPlan` |

### 11.2 代码组织原则

1. **数据与视图分离**：业务逻辑放 `features/`，UI 放 `components/` 和 `app/`
2. **纯函数优先**：核心计算逻辑尽量写成纯函数，便于测试
3. **类型前置**：所有公共 API 必须有完整 TypeScript 类型
4. **渐进增强**：核心功能先跑通，再逐步添加体验优化

### 11.3 安全边界

应用内置多项安全保护：

| 保护项 | 阈值 | 说明 |
|--------|------|------|
| 最低热量（男） | 1500 kcal/天 | 防止过度节食 |
| 最低热量（女） | 1200 kcal/天 | 防止过度节食 |
| 每日赤字上限 | 750 kcal/天 | 防止激进减重 |
| 蛋白质下限 | 1.8g/kg 体重 | 保证肌肉保留 |
| 脂肪下限 | 40g/天 | 保证基础激素需求 |
| 连续多日预警 | 动态调整提示 | 疲劳偏高时提醒恢复 |

### 11.4 食物库扩展

1. 在 `shared/data/` 添加新的食物批次文件
2. 使用 `shared/scripts/` 中的脚本处理和合并数据
3. 在 `shared/index.ts` 中导入并合并到 `foods` 数组
4. 运行测试验证解析正确性

---

## 附录

### A. 相关文档

- [PRD.md](file:///c:/Users/Administrator/Documents/健身日历/PRD.md) — 产品需求文档
- [TECHNICAL_PLAN.md](file:///c:/Users/Administrator/Documents/健身日历/TECHNICAL_PLAN.md) — 技术方案
- [MVP_BUILD_PLAN.md](file:///c:/Users/Administrator/Documents/健身日历/MVP_BUILD_PLAN.md) — MVP 构建计划

### B. 食物库规模

- 内置食物：130+ 种
- 覆盖分类：主食、蛋白质、蔬菜、水果、零食、饮料、菜肴、快餐、补剂
- 每个食物含多个别名，支持模糊匹配

### C. 训练动作库

- 基础动作：14 个
- 覆盖肌群：胸、背、腿、肩、臂、核心、有氧
- 每个动作绑定 MET 值用于消耗估算
