# 健身饮食动态计划助手技术方案

## 1. 技术方向

产品目标是移动优先、离线优先的轻量级健身助手，建议采用：

- 客户端：React Native + Expo + TypeScript
- 路由：Expo Router
- 本地状态：Zustand
- 本地数据：内置 TypeScript 数据表，后续可迁移 SQLite
- 校验：Zod
- 可选后端：Node.js + Hono，仅用于未来同步、备份或 AI 增强

当前技术判断：

- MVP 核心能力必须在 App 本地运行。
- 食品库、动作库、公式引擎、动态调整引擎都放在本地共享模块。
- API 服务保留为未来扩展，不作为核心流程依赖。
- AI 不进入 MVP 主链路，只作为未来增强能力。

## 2. 当前仓库结构

```text
C:\Users\Administrator\Documents\健身日历
├── apps
│   ├── mobile
│   └── api
├── shared
│   ├── components
│   ├── data
│   ├── domain
│   ├── ai
│   └── types
├── docs
├── PRD.md
├── TECHNICAL_PLAN.md
└── MVP_BUILD_PLAN.md
```

目录边界：

- `apps/mobile`：移动端页面、交互、本地状态和离线主流程。
- `apps/api`：未来同步、备份、AI 增强或管理接口；MVP 不依赖它。
- `shared/components`：公共 UI 组件。
- `shared/data`：食品库、动作库、体态选项、默认配置。
- `shared/domain`：热量、营养、训练、动态调整等纯本地规则逻辑。
- `shared/ai`：未来 AI 增强预留的 schema 和 prompt，不进入 MVP 主链路。
- `shared/types`：跨端共享类型。

## 3. 模块划分

### 3.1 Onboarding 模块

负责：

- 身体数据录入
- 体态图选择或手动体脂率填写
- 目标体重和目标周期设置
- 目标体态选择
- 训练习惯设置

输出：

- 用户身体档案
- 用户目标档案
- 训练偏好档案

### 3.2 Nutrition 模块

负责：

- 从内置食品库匹配用户选择或输入的食物
- 自动分配每种食物重量
- 记录实际摄入
- 计算热量和宏量营养偏差
- 生成未来饮食调整

核心规则：

- 蛋白质目标优先保留。
- 脂肪不低于安全下限。
- 碳水根据训练日和休息日浮动。
- 超额热量分摊到未来多天。

### 3.3 Training 模块

负责：

- 根据训练习惯生成训练队列
- 每日推荐训练内容
- 记录用户实际训练
- 估算训练消耗
- 调整后续训练安排

核心规则：

- 未完成训练优先顺延。
- 避免同一部位连续高强度训练。
- 根据训练量和疲劳估算调整后续强度。
- 无氧训练日可保留更多碳水。

### 3.4 Flexible Plan Engine

核心模块路径：

```text
C:\Users\Administrator\Documents\健身日历\shared\domain\plan-engine
```

负责统一处理：

- 热量余额
- 营养余额
- 训练余额
- 未来 3 到 7 天动态重排
- 调整原因生成
- 风险提示

## 4. 本地公式与数据库分工

### 4.1 内置数据库负责

- 食品名称、别名、默认单位、每 100g 营养。
- 训练动作、别名、主要肌群、次要肌群、器材、估算 MET。
- 体态选项和体脂率估算区间。
- 默认训练模板和训练恢复间隔。

### 4.2 公式引擎负责

- BMR / TDEE 计算。
- 每日热量目标。
- 蛋白质、脂肪、碳水目标。
- 食物克数分配。
- 热量偏差分摊。
- 训练消耗估算。
- 训练队列重排。
- 安全边界。

### 4.3 AI 未来增强

AI 只做增强，不做 MVP 依赖：

- 自然语言解析。
- 语音转文字后的文本解析。
- 拍照估算体脂。
- 更自然的解释文案。

所有 AI 输出未来也必须经过 schema 校验后再进入公式引擎。

## 5. 离线饮食流程

用户选择或输入：

```text
米饭、鸡胸肉、鸡蛋、牛奶、香蕉
```

流程：

1. App 本地用食品库名称和别名匹配食物。
2. 未匹配项提示用户选择相近食物或暂时手动输入热量。
3. 公式引擎读取当天热量和宏量目标。
4. 营养模块按目标分配食物克数。
5. App 展示推荐餐次和预计营养。
6. 用户补充实际摄入后，本地计算偏差。
7. 计划引擎重排未来 3 到 7 天。

## 6. 离线训练流程

用户选择或输入训练：

```text
卧推 60kg 5 组 8 次，跑步 30 分钟
```

MVP 流程：

1. App 通过动作库选择动作。
2. 用户填写重量、组数、次数、时长。
3. 动作库匹配训练部位和估算 MET。
4. 训练模块估算消耗和训练量。
5. 计划引擎更新训练队列。
6. 计划引擎联动饮食热量和碳水目标。

自然语言直接解析可以后续再做。

## 7. 核心数据模型

### 7.1 用户身体档案

- id
- userId
- gender
- age
- heightCm
- weightKg
- estimatedBodyFatPercent
- bodyFatSource
- trainingLevel
- waistCm
- createdAt
- updatedAt

### 7.2 用户目标

- id
- userId
- goalType
- targetWeightKg
- targetBodyShapeId
- targetDate
- weeklyWeightChangeKg
- baseDailyCalories
- proteinTargetG
- fatTargetG
- carbsTargetG
- createdAt
- updatedAt

### 7.3 食品

- id
- name
- aliases
- caloriesPer100g
- proteinPer100g
- fatPer100g
- carbsPer100g
- defaultUnit
- defaultUnitGram
- source
- updatedAt

### 7.4 训练动作

- id
- name
- aliases
- primaryMuscleGroup
- secondaryMuscleGroups
- equipment
- difficulty
- estimatedMet

### 7.5 每日计划

- id
- userId
- date
- plannedCalories
- plannedMacros
- plannedMeals
- actualMeals
- plannedWorkout
- actualWorkout
- calorieDelta
- macroDelta
- trainingDelta
- adjustmentSummary
- createdAt
- updatedAt

## 8. MVP 页面结构

移动端建议页面：

```text
app/
├── _layout.tsx
├── onboarding/
│   ├── body.tsx
│   ├── body-shape.tsx
│   ├── goal.tsx
│   └── training-preference.tsx
├── index.tsx
├── nutrition/
│   ├── plan.tsx
│   └── actual.tsx
├── training/
│   ├── plan.tsx
│   └── actual.tsx
├── adjustment.tsx
└── history.tsx
```

首页是核心页面，应展示：

- 今日饮食推荐
- 今日训练推荐
- 今日剩余热量
- 今日偏差状态
- 明日是否已重排

## 9. 初始食品库策略

MVP 不做复杂菜谱，但需要内置基础食品热量库。

第一版食品类型：

- 主食：米饭、面条、馒头、燕麦、红薯、土豆
- 蛋白质：鸡胸肉、鸡蛋、牛肉、鱼、虾、豆腐、牛奶、酸奶
- 脂肪：坚果、花生酱、橄榄油、牛油果
- 水果：香蕉、苹果、橙子、蓝莓
- 常见外食：牛肉面、鸡排、奶茶、蛋挞、汉堡、炸鸡

策略：

- 先覆盖高频食物。
- 支持别名匹配。
- 对模糊食物给出估算区间。
- 未命中时允许用户手动输入热量，后续可保存为自定义食物。

## 10. 初始动作库策略

第一版动作类型：

- 胸：卧推、俯卧撑、哑铃飞鸟
- 背：高位下拉、坐姿划船、哑铃划船、引体向上
- 腿：深蹲、腿举、硬拉、弓步蹲
- 肩：推举、侧平举、面拉
- 手臂：弯举、臂屈伸、下压
- 腹：卷腹、平板支撑、悬垂举腿
- 有氧：跑步、快走、椭圆机、骑车、跳绳

策略：

- 动作库只服务计划和估算，不做教学内容生态。
- 每个动作绑定主要肌群、次要肌群、器材和估算强度。

## 11. 安全策略

必须实现：

- 最低热量保护。
- 蛋白质下限保护。
- 脂肪下限保护。
- 连续多日大幅热量赤字预警。
- 训练过量预警。
- 伤病和疾病人群保守提示。

禁止输出：

- 极端节食建议。
- 惩罚式运动建议。
- 短期过度减重承诺。
- 医疗诊断。

## 12. 第一阶段完成标准

第一阶段技术实现完成时，应满足：

1. 用户可以完成身体、目标、训练习惯设置。
2. 系统能离线生成今日饮食推荐。
3. 系统能根据用户给定食物推荐克数。
4. 用户能补充实际摄入。
5. 系统能计算热量和营养偏差。
6. 系统能重排未来 3 到 7 天饮食。
7. 系统能离线生成今日训练推荐。
8. 用户能补充实际训练。
9. 系统能估算训练消耗并调整训练队列。
10. 每次调整都有可读解释。
