# 健身日历 APP — UI 设计系统审阅报告

**审阅人**: UI Designer  
**日期**: 2026-06-28  
**审阅范围**: 饮食页 / 训练页 / 计划页 / 更多页 / 饮食方案选择页 + 核心组件库

---

## 一、总体评价

| 维度 | 评分 | 说明 |
|------|------|------|
| 视觉一致性 | 3/10 | 两种设计语言混用，页面间割裂感明显 |
| 主题系统 | 4/10 | train.tsx 仍有 80+ 处 colors. 直接引用，夜间模式存在大面积失效风险 |
| 信息架构 | 5/10 | 计划页和更多页已统一为微信风格，饮食页和训练页仍是旧版卡片堆砌 |
| 可访问性 | 2/10 | 触控目标过小、无 ARIA 标签、无焦点管理 |
| 代码可维护性 | 3/10 | 单文件超 1000 行，子组件全堆在一个文件里 |
| 组件复用 | 3/10 | SettingsRow 在 plan.tsx 和 more.tsx 各定义了一份，完全不共享 |

**一句话结论**: 计划页和更多页的微信风格重构方向是对的，但饮食页和训练页还停留在旧的 GlassTile 卡片堆砌模式，整个 APP 呈现出**两种割裂的设计语言**。当务之急不是继续加功能，而是统一设计语言 + 修复 train.tsx 的主题 bug。

---

## 二、严重问题 (P0 — 必须立即修复)

### 2.1 train.tsx 夜间模式系统性失效

**问题**: `train.tsx` 有 **80+ 处** 直接使用模块级 `colors.` 引用，包括组件级常量 `inputStyle`（第 436-445 行）和所有子组件（`LibraryBodyPartTab`、`LibraryEquipmentChip`、`LibraryExerciseCard`、`CustomTrainingExerciseRow`、`ActualTrainingInputSection`、`CompactTrainingMetric`、`DashboardSelectMetric`）。

**影响**: 虽然理论上 `ThemeProvider` 通过 `Object.assign` 会 mutate `colors` 对象，但：
1. 组件级 `const inputStyle = { ... colors.glass ... }` 在每次渲染时重新读取，看起来可以工作
2. 但子组件中通过 `colors.accent2` 传给 `BentoText` 的 `color` prop 走的是 `resolveThemeColor()`，它依赖 `lightToDarkColorMap` —— 如果传入的是已经被 mutate 过的 dark 值（如 `#9489FF`），map 里找不到，就直接返回原值，在夜间模式下显示正确
3. 但传入 `${colors.accent2}22` 这种拼接色值（第 568、986、996 行）完全无法被 `resolveThemeColor` 处理，夜间模式下会用日间色值拼接

**修复方案**: 
- 将 `train.tsx` 的 `TrainScreen` 组件内添加 `const c = useBentoTheme().colors;`
- 所有 `colors.` 替换为 `c.`
- `inputStyle` 改为函数 `getInputStyle(c)` 或移入组件内
- 所有子组件内部添加 `useBentoTheme()` 钩子
- 参照 `index.tsx` 的修复模式（已完成）

### 2.2 设计语言割裂 — 两套 UI 系统并存

| 页面 | 设计风格 | 容器组件 | 行组件 | 标题组件 |
|------|---------|---------|--------|---------|
| 饮食页 (index.tsx) | 旧 GlassTile 卡片 | `GlassTile` + `CardHeader` + `PillButton` | `MealCompareRow` | `CardHeader` title |
| 训练页 (train.tsx) | 旧 GlassTile 卡片 | `GlassTile` + inline `Label` | `LibraryExerciseCard` | `Label` variant="label" |
| 计划页 (plan.tsx) | 新微信分组列表 | `View` + `SettingsRow` | `SettingsRow` | `SectionHeader` |
| 更多页 (more.tsx) | 新微信分组列表 | `SettingsGroup` + `SettingsRow` | `ExpandableRow` | `SectionHeader` |
| 饮食方案页 | 新自定义列表 | `Pressable` row | 自定义行 | `ScreenHeader` |

**问题清单**:
- `SettingsRow` 在 `plan.tsx` 和 `more.tsx` **各定义了一份**，签名不同、样式不同
- `SectionHeader` 在 `plan.tsx`、`more.tsx`、`diet-plan/index.tsx` **各定义了一份**
- 饮食页的 `CardHeader` 带「展开/收起」按钮，训练页用 `Label` 做标题——完全不同的视觉语言
- 训练页的动作库区域把搜索栏 + 器械筛选条 + 左侧身体部位 tab + 右侧网格卡片 **全塞进一个 GlassTile**，信息密度爆炸

### 2.3 触控目标严重不足

| 组件 | 位置 | 高度 | WCAG 要求 |
|------|------|------|-----------|
| `PillButton` | index.tsx | 26px | 44px ❌ |
| `MetricDelta` (compact) | index.tsx | ~14px (fontSize 10) | 44px ❌ |
| 「详情」文字按钮 | diet-plan/index.tsx | ~20px | 44px ❌ |
| 「删除」文字 | index.tsx | ~14px (fontSize micro) | 44px ❌ |
| 历史按钮 | train.tsx | 24px | 44px ❌ |
| 收起/展开文字 | train.tsx | 28px | 44px ❌ |

---

## 三、重要问题 (P1 — 尽快修复)

### 3.1 单文件巨型化

| 文件 | 行数 | 子组件数 | 问题描述 |
|------|------|---------|---------|
| `train.tsx` | 1470 | 10+ | 动作库 API 逻辑 + UI 组件 + 工具函数全混在一起 |
| `index.tsx` | 1110 | 15+ | 15 个子组件 + 业务逻辑 + Modal 全在一个文件 |

**建议拆分**:
```
components/
  shared/
    SettingsRow.tsx      ← 统一的微信风格行组件
    SectionHeader.tsx     ← 统一的分组标题
    SettingsGroup.tsx     ← 统一的分组容器
  diet/
    DashboardCard.tsx
    MealCompareRow.tsx
    RecordSection.tsx
    MenuManager.tsx
  training/
    TrainingDashboard.tsx
    ExerciseLibrary.tsx   ← 独立动作库组件
    ActualTrainingSection.tsx
```

### 3.2 Emoji 图标 vs SVG 线条图标

设计 token 文档明确要求 SVG 线条图标，但实际代码中全部使用 Emoji：
- `⚖️🎯🏋️🥗🌓🔤⚡⚙️🐾` — 跨平台渲染不一致
- `> ` 字符做箭头（plan.tsx 第 73 行）— 不同字体下宽度/位置不一致
- `› / ⌄` 字符做展开指示（more.tsx 第 623 行）— 同上

**建议**: 抽象出统一的 `Icon` 组件，使用 SVG path 或 expo-vector-icons。

### 3.3 Modal 遮罩色硬编码

```tsx
// index.tsx 第 568 行 — 硬编码 rgba
backgroundColor: "rgba(15,23,42,0.55)"

// index.tsx 第 944 行 — 另一个不同的硬编码 rgba  
backgroundColor: "rgba(15,23,42,0.28)"
```

两个 Modal 的遮罩色不一致，且不随主题变化。夜间模式下应该更深。

### 3.4 无加载状态和空状态

| 场景 | 当前表现 | 应有表现 |
|------|---------|---------|
| 饮食页无数据 | 显示 `-` 和空卡片 | 引导用户「开始记录第一餐」 |
| 训练页动作库加载中 | 文字「正在加载动作库...」 | Skeleton 骨架屏 |
| 训练页无动作 | 空白 | 空状态插画 + 引导文案 |
| 饮食页无识别结果 | 不显示任何内容 | 「输入食物名称，自动识别热量」提示 |

### 3.5 Typography 尺度混乱

设计 token 定义了 8 级字号（display 48 → micro 10），但代码中大量使用内联 `style={{ fontSize: N }}` 绕过 system：

```
train.tsx 内联 fontSize 统计:
  10, 11, 12, 13, 14, 15, 22, 24, 28 — 共 9 种不同的内联字号

index.tsx 内联 fontSize 统计:
  10, 11, 12, 13, 14, 15, 18, 28 — 共 8 种

合计出现 40+ 处 style={{ fontSize: N }}
```

**建议**: 所有字号必须走 `variant` system，禁止内联 `fontSize`。

---

## 四、改进建议 (P2 — 体验提升)

### 4.1 统一 SettingsRow 组件

当前 `plan.tsx` 和 `more.tsx` 各有一份 `SettingsRow`，签名和行为不同。应提取到 `components/shared/SettingsRow.tsx`，支持：
- `icon` (SVG)、`label`、`subtitle`、`trailing`、`onPress`、`showArrow`
- 统一的 52px 最小高度、16px 水平 padding
- 统一的按下态 opacity 0.72
- 统一的底部 0.5px 分隔线

### 4.2 饮食页和训练页重构为微信风格

**饮食页重构方案**:
```
─── TODAY / 今日饮食 ───
  [热量仪表盘行] → 点击展开详情
  [饮食记录行]   → 点击展开输入区
  [饮食计划行]   → 点击展开餐次对比
  [我的菜单行]   → 跳转 /my-menu 页面

─── ADJUST / 动态调整 ───
  [调整摘要行]   → 仅在有偏差时显示
```

**训练页重构方案**:
```
─── TODAY / 今日训练 ───
  [消耗仪表盘行] → 点击展开详情
  [目标训练行]   → 点击展开动作列表
  [实际训练行]   → 点击展开输入区

─── LIBRARY / 动作库 ───
  [动作库行]     → 跳转 /exercise-library 独立页面
```

### 4.3 动作库独立成页面

`train.tsx` 的动作库（第 593-780 行，约 190 行）信息密度过高：
- 搜索栏 + 器械筛选条 + 左侧身体部位 tab + 右侧网格卡片
- 全部塞在训练页的一个 GlassTile 里

**建议**: 将动作库提取为独立页面 `/exercise-library`，训练页只放一个 `SettingsRow` 入口。

### 4.4 添加 motion 动画

设计 token 定义了完整的 `motion` 系统（fast 150ms / normal 280ms / slow 480ms），但代码中**零使用**。

**建议优先添加**:
- 卡片展开/收起动画（`Animated.View` height 0 → auto）
- 按下态缩放微动画（`transform: scale(0.98)`）
- 页面切换过渡（Expo Router transition）
- 数字滚动动画（热量/kcal 变化时）

### 4.5 统一 ScreenHeader

当前两种模式并存：
- 饮食/训练/计划/饮食方案页：使用 `<ScreenHeader kicker title subtitle badge />`
- 更多页：使用 `<BentoText variant="h2" weight="bold">设置</BentoText>`（无 ScreenHeader）

**建议**: 所有页面统一使用 `ScreenHeader`，更多页改为：
```tsx
<ScreenHeader kicker="设置" title="" subtitle="外观、计划和宠物伴侣" />
```

### 4.6 颜色拼接陷阱

代码中大量使用 `` `${colors.accent2}22` `` 拼接透明度，这种写法有两个问题：
1. `resolveThemeColor` 无法处理带后缀的色值
2. 夜间模式下 `accent2` 从 `#7866FF` 变为 `#9489FF`，拼接后变成 `#9489FF22`——色相虽然对了，但无法被 theme system 统一管理

**建议**: 使用 `rgba()` 函数或设计 token 中的 `glows` 系统。

---

## 五、修复优先级

| 优先级 | 任务 | 工作量 | 影响 |
|--------|------|--------|------|
| **P0-1** | 修复 train.tsx 的 colors. 直接引用（80+ 处） | 2h | 夜间模式正常显示 |
| **P0-2** | 提取统一的 SettingsRow / SectionHeader / SettingsGroup 到 shared/ | 1h | 消除重复代码 |
| **P1-1** | 拆分 train.tsx（1470行 → 3-4 个文件） | 3h | 可维护性 |
| **P1-2** | 拆分 index.tsx（1110行 → 4-5 个文件） | 3h | 可维护性 |
| **P1-3** | 动作库独立成页面 | 2h | 训练页信息密度降低 |
| **P1-4** | 触控目标修复（26px → 44px） | 1h | 可访问性合规 |
| **P2-1** | 饮食页/训练页重构为微信风格 | 4h | 设计语言统一 |
| **P2-2** | 添加加载/空状态 | 2h | 用户体验 |
| **P2-3** | 禁止内联 fontSize，统一走 variant | 2h | Typography 一致性 |
| **P2-4** | Emoji 替换为 SVG 图标 | 3h | 跨平台一致性 |
| **P2-5** | Modal 遮罩色主题感知 | 0.5h | 夜间模式完善 |
| **P2-6** | 添加 motion 动画 | 3h | 交互体验 |

**总工作量**: 约 26.5 小时

---

## 六、设计系统建议架构

```
components/
  bento/                    ← 基础设计系统（已有）
    Text.tsx
    GlassTile.tsx
    Button.tsx
    Screen.tsx
    ThemeProvider.tsx
    tokens.ts
    
  shared/                   ← 跨页面共享组件（新建）
    SettingsRow.tsx         ← 统一微信风格行
    SectionHeader.tsx       ← 统一分组标题
    SettingsGroup.tsx       ← 统一分组容器
    ExpandableRow.tsx       ← 统一可展开行
    Modal.tsx               ← 统一 Modal（主题感知遮罩）
    Icon.tsx                ← 统一图标组件（SVG）
    EmptyState.tsx          ← 空状态组件
    Skeleton.tsx            ← 骨架屏组件
    
  diet/                     ← 饮食页专用组件（新建）
    DashboardCard.tsx
    MealCompareRow.tsx
    RecordSection.tsx
    MenuManager.tsx
    FoodTagEditor.tsx
    
  training/                 ← 训练页专用组件（新建）
    TrainingDashboard.tsx
    TargetTraining.tsx
    ActualTrainingSection.tsx
    ExerciseLibrary.tsx     ← 独立页面组件
```

---

**审阅完毕。** 以上问题按优先级排列，建议从 P0 开始逐项修复。核心思路是：先修 bug（train.tsx 主题失效），再统一设计语言（提取共享组件），最后提升体验（动画、空状态、SVG 图标）。
