# Bento Glass · 设计 Token 规范

> 健身饮食动态计划助手 · 统一视觉语言
> 风格：Bento Glass（便当玻璃）—— 模块化、毛玻璃、深空霓虹、数据驾驶舱

---

## 1. 设计哲学

把今天装进一格一格会发光的便当盒。

- **模块化**：所有信息以"格子"为单位组织，大小不一却严丝合缝。
- **毛玻璃**：卡片半透明，背景透上来，像浮在深空中的发光体。
- **数据驾驶舱**：等宽数字、精确对齐、霓虹高亮，像高端仪表盘。
- **呼吸感**：格子之间留缝隙，缝隙本身就是分割；状态变化伴随光感反馈。

每一层玻璃的折射都计算过，每一格的尺寸都来自 4 的倍数网格，每一次状态变化都伴随恰到好处的光感反馈。**科技感不等于花哨，真正的科技感是"精密到让人安心"。**

---

## 2. 色彩 Token

### 2.1 背景层

| Token | 值 | 用途 |
|---|---|---|
| `bg` | `#0B1120` | 深空蓝黑（页面底） |
| `bgGlow` | `#131C30` | 背景微光（顶部渐变终点） |
| `bgGradient` | `linear-gradient(180deg, #0B1120 0%, #131C30 100%)` | 页面背景渐变 |

### 2.2 玻璃层

| Token | 值 | 用途 |
|---|---|---|
| `glass` | `rgba(255,255,255,0.06)` | 毛玻璃卡片底色 |
| `glassRaised` | `rgba(255,255,255,0.09)` | 抬升玻璃（更亮） |
| `glassBorder` | `rgba(255,255,255,0.12)` | 玻璃 1px 内描边高光 |
| `glassBorderBright` | `rgba(255,255,255,0.20)` | 激活态描边 |
| `glassBlur` | `20px` | backdrop-filter 模糊量 |

### 2.3 文字层

| Token | 值 | 用途 |
|---|---|---|
| `ink` | `#F1F5F9` | 主文字 |
| `inkMute` | `#94A3B8` | 辅助文字 |
| `inkFaint` | `#64748B` | 次要/占位文字 |

### 2.4 强调色（霓虹）

| Token | 值 | 语义 | 用途 |
|---|---|---|---|
| `accent` | `#38BDF8` | 青蓝 | 核心强调（热量、主操作、当前态） |
| `accent2` | `#A78BFA` | 紫罗兰 | 次强调（训练、赤字） |
| `positive` | `#34D399` | 翡翠绿 | 达标/完成/在线 |
| `warn` | `#FB7185` | 玫红 | 超额/警告/不足 |
| `amber` | `#FBBF24` | 琥珀 | 接近上限/注意 |

### 2.5 数据语义映射

| 数据类型 | 强调色 |
|---|---|
| 热量 / 卡路里 | `accent` 青蓝 |
| 训练 / 消耗 | `accent2` 紫罗兰 |
| 蛋白质 | `accent` 青蓝 |
| 脂肪 | `accent2` 紫罗兰 |
| 碳水 | `positive` 翡翠绿 |
| 达标 / 完成 | `positive` |
| 超额 / 警告 | `warn` |
| 赤字 / 盈余 | `accent2` |

---

## 3. 排版 Token

### 3.1 字体族

| Token | 字体 | 用途 |
|---|---|---|
| `fontSans` | `Outfit` | 标题、正文（几何无衬线） |
| `fontMono` | `Geist Mono` | 一切数字、标签、刻度（等宽） |
| `fontCJK` | `Microsoft YaHei` / `PingFang SC` | 中文回退 |

### 3.2 字号阶梯

| Token | 大小 | 字重 | 行高 | 用途 |
|---|---|---|---|---|
| `display` | 48px | Mono 700 | 1.0 | 巨型数据（首页核心数字） |
| `h1` | 28px | Sans 700 | 1.2 | 页面标题 |
| `h2` | 22px | Sans 600 | 1.25 | 区块标题 |
| `h3` | 17px | Sans 600 | 1.3 | 卡片标题 |
| `body` | 14px | Sans 400 | 1.5 | 正文 |
| `bodyStrong` | 14px | Sans 600 | 1.5 | 正文强调 |
| `caption` | 12px | Sans 400 | 1.4 | 说明文字 |
| `label` | 11px | Mono 400 | 1.0 | 全大写标签 |
| `micro` | 10px | Mono 400 | 1.0 | 极小刻度 |

### 3.3 字距

| Token | 值 | 用途 |
|---|---|---|
| `trackingLabel` | `+0.08em` | 全大写标签 |
| `trackingMicro` | `+0.12em` | 极小刻度 |
| `trackingNormal` | `0` | 正文 |

### 3.4 数字规范

- **所有数字必须用等宽字体**（Geist Mono），保证一列列数据对齐。
- 大数字字重 700，标签数字字重 400。
- 数字单位（kcal / g / %）用 `caption` 字号、`inkMute` 色、紧跟数字。

---

## 4. 间距与网格 Token

### 4.1 基础间距（4 的倍数）

| Token | 值 | 用途 |
|---|---|---|
| `space0` | `0` | — |
| `space1` | `4px` | 极小（图标内） |
| `space2` | `8px` | 小（格子缝隙） |
| `space3` | `12px` | 中小 |
| `space4` | `16px` | 中（页面外边距、卡片内边距） |
| `space5` | `20px` | 中大 |
| `space6` | `24px` | 大（区块间距） |
| `space8` | `32px` | 更大 |
| `space10` | `40px` | 最大 |

### 4.2 Bento 网格

| Token | 值 | 用途 |
|---|---|---|
| `pagePadding` | `16px` | 页面左右外边距 |
| `tileGap` | `8px` | 格子之间缝隙 |
| `tileRadius` | `22px` | 标准格子圆角 |
| `tileRadiusSmall` | `18px` | 小格子圆角 |
| `tilePadding` | `16px` | 格子内边距 |

### 4.3 Bento 格子尺寸（390 宽屏幕）

- **大格**：占 2/3 宽（约 232px）
- **中格**：占 1/3 宽（约 116px）
- **横条格**：占满宽（约 358px）
- **三连格**：每格 1/3 宽（约 116px）
- 高度按内容自适应，常见档位：84 / 118 / 176 / 220

---

## 5. 圆角 Token

| Token | 值 | 用途 |
|---|---|---|
| `radiusNone` | `0` | — |
| `radiusSm` | `8px` | 小元素（tag） |
| `radiusMd` | `12px` | 输入框 |
| `radiusLg` | `18px` | 小玻璃格 |
| `radiusXl` | `22px` | 标准玻璃格 |
| `radiusPill` | `999px` | 胶囊按钮、进度条 |

---

## 6. 玻璃质感 Token

### 6.1 标准玻璃格

```css
background: rgba(255, 255, 255, 0.06);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.12);
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.15),   /* 顶光高光 */
  0 8px 32px rgba(0, 0, 0, 0.3);              /* 外阴影 */
```

### 6.2 抬升玻璃格（激活态）

```css
background: rgba(255, 255, 255, 0.09);
border: 1px solid rgba(255, 255, 255, 0.20);
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.22),
  0 12px 40px rgba(0, 0, 0, 0.4),
  0 0 24px rgba(56, 189, 248, 0.15);          /* 强调色微光 */
```

### 6.3 霓虹辉光（用于关键数据格）

| 强调色 | 辉光色 | 模糊半径 |
|---|---|---|
| `accent` | `rgba(56, 189, 248, 0.20)` | `16px` |
| `accent2` | `rgba(167, 139, 250, 0.20)` | `16px` |
| `positive` | `rgba(52, 211, 153, 0.20)` | `12px` |
| `warn` | `rgba(251, 113, 133, 0.20)` | `12px` |

---

## 7. 阴影 Token

| Token | 值 | 用途 |
|---|---|---|
| `shadowNone` | `none` | — |
| `shadowSm` | `0 2px 8px rgba(0,0,0,0.2)` | 小元素 |
| `shadowMd` | `0 8px 32px rgba(0,0,0,0.3)` | 标准玻璃格 |
| `shadowLg` | `0 12px 40px rgba(0,0,0,0.4)` | 抬升态 |
| `glowAccent` | `0 0 24px rgba(56,189,248,0.15)` | 青蓝辉光 |
| `glowAccent2` | `0 0 24px rgba(167,139,250,0.15)` | 紫罗兰辉光 |

---

## 8. 组件规范

### 8.1 玻璃格 GlassTile

- 默认：`glass` 底 + `glassBorder` 描边 + `radiusXl` + `shadowMd`
- 抬升：`glassRaised` 底 + `glassBorderBright` 描边 + `shadowLg` + 对应色辉光
- 内边距：`tilePadding` (16px)

### 8.2 进度环 ProgressRing

- 底环：`rgba(255,255,255,0.08)`，宽度 10px
- 进度：渐变（`accent` → `accent2`），宽度 10px，圆头
- 中心：`display` 数字 + `caption` 标签
- 接近 100% 时进度色变 `amber`

### 8.3 进度条 ProgressBar

- 底轨：`rgba(255,255,255,0.08)`，高 6px，`radiusPill`
- 填充：对应语义色，高 6px，`radiusPill`
- 超额时填充变 `warn` 并溢出显示

### 8.4 按钮

| 类型 | 样式 |
|---|---|
| Primary | 玻璃底 + `accent` 边光 + `accent` 文字 |
| Filled | `accent` 实底 + 白字 |
| Ghost | 透明 + `inkMute` 文字 |
| Pill | `radiusPill` + 玻璃底 |

### 8.5 输入框

- 玻璃底 + `glassBorder` 描边 + `radiusMd`
- 聚焦：`accent` 描边 + `glowAccent`
- 占位：`inkFaint`

### 8.6 标签 / 徽章

- 全大写 + `trackingLabel` + `label` 字号
- 玻璃底 + 对应语义色文字
- 圆角 `radiusSm`

### 8.7 底部 Tab Bar

- 整条玻璃带（`glassRaised` + `radiusXl`），浮于底部
- 4 个 tab：今日 / 饮食 / 训练 / 更多
- 当前态：文字 `accent` 色 + 下方 6px 圆点 `accent`

---

## 9. 动效 Token

| Token | 时长 | 缓动 | 用途 |
|---|---|---|---|
| `instant` | `0ms` | — | 即时 |
| `fast` | `150ms` | `ease-out` | 状态切换 |
| `normal` | `280ms` | `cubic-bezier(0.4,0,0.2,1)` | 标准过渡 |
| `slow` | `480ms` | `cubic-bezier(0.4,0,0.2,1)` | 进度填充 |
| `ring` | `680ms` | `cubic-bezier(0.4,0,0.2,1)` | 圆环填充 |

### 动效原则

- 数字滚动更新（计数动画）
- 进度环像能量条一样充能
- 玻璃格被关注时微微浮起 + 边光增强
- 状态翻转有 `fast` 过渡
- 无装饰性弹跳，一切动效服务于"系统在工作"

---

## 10. 页面布局规范

### 10.1 通用页面结构

```
┌─────────────────────────┐
│ 状态栏 (44px)            │
├─────────────────────────┤
│ 页面标题区               │  ← 顶部 padding 16
│   日期标签 (label)       │
│   页面标题 (h1)          │
│   右上角状态徽章          │
├─────────────────────────┤
│                         │
│   Bento 格子区           │  ← 格子间 8px 缝隙
│   (内容主体)             │
│                         │
├─────────────────────────┤
│ 底部 Tab Bar (浮玻璃)    │  ← 距底 12px
└─────────────────────────┘
```

### 10.2 Onboarding 页面

- 无底部 Tab Bar
- 顶部：步骤指示器（4 个圆点，当前态 `accent`）
- 底部：主操作按钮（Filled `accent`，占满宽）
- 中间：表单内容用玻璃格分组

### 10.3 今日推荐首页（核心）

- 顶部：日期 + "今日"标题 + 离线徽章
- Bento 网格：
  - 大格：热量环（占 2/3 宽）
  - 右上中格：消耗
  - 右下中格：赤字
  - 三连格：宏量营养（蛋/脂/碳）
  - 横条格：今日训练
  - 横条格：今日餐次
- 底部 Tab Bar

---

## 11. 无障碍

- 文字对比度：主文字 `ink` on `bg` ≥ 12:1（AAA）
- 辅助文字 `inkMute` on `glass` ≥ 4.5:1（AA）
- 最小可点击区域：44×44px
- 强调色不作为唯一信息载体，配合文字/图标
- 支持动态字体大小

---

## 12. 落地清单

- [ ] `shared/components` 实现 `GlassTile`、`ProgressRing`、`ProgressBar`、`Button`、`Input`、`Badge`、`TabBar`
- [ ] `apps/mobile` 全局样式替换为 `design-tokens.ts`
- [ ] 9 个 MVP 页面按本规范重做
- [ ] 深色模式为本风格默认；浅色模式作为后续扩展
