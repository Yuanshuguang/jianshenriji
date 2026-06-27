# 健身日历 APP 软件开发综合审计报告

> 团队：software-fitness-app-review  
> 审计日期：2026-06-27  
> 审计对象：`C:\Users\Administrator\Documents\健身日历` 当前未提交工作区快照  
> 审计方式：只读代码审查 + 本地命令验证 + 四角色并行评审  
> 验证状态：`pnpm --recursive run typecheck` 通过；`pnpm --recursive run test` 通过，26 个食物解析测试通过；未执行 Playwright 截图审计  

## 1. 总评分

综合评分：4.1/10。不建议按当前状态对外上线，可作为内部原型继续验证。

| 维度 | 负责人 | 评分 | 结论 |
| --- | --- | ---: | --- |
| 产品体验 | 许清楚 | 4.0/10 | 离线优先方向清楚，但 `recommend -> actual -> adjust` 闭环没有被用户感知和确认 |
| 架构设计 | 高见远 | 4.4/10 | Monorepo 方向合理，但 shared/domain、shared/components 基本未落地，页面和 shared/index.ts 过重 |
| 代码质量 | 寇豆码 | 4.3/10 | 类型检查通过，但存在 Native 持久化、API 脚本、性能和测试归属问题 |
| QA 与安全 | 严过关 | 3.7/10 | 错误边界、输入校验、持久化异常、公开客户端配置和测试覆盖不足 |
| 综合 | 齐活林 | 4.1/10 | 能运行，但核心价值链、稳定性和上线安全基线不足 |

## 2. 核心结论

项目已经有 Expo Router、Zustand、shared 包、食物解析测试和本地动作库等基础骨架，`typecheck` 与现有测试都通过。问题不是“完全不可运行”，而是产品核心闭环和工程边界没有形成稳定系统：计算、页面、状态、数据、外部请求混在少数大文件中，错误和持久化失败缺少兜底，当前测试只覆盖食物解析窄范围。

本报告修正了旧报告里的几处不准确表述：`train.tsx` 当前通过 `process.env.EXPO_PUBLIC_WORKOUTX_API_KEY` 读取 key，且根目录 `.env` 存在同名变量；风险应表述为 Expo public env 会进入客户端 bundle，不能承载秘密。饮食页底层已读取 `actualTraining.calories`，问题是跨 Tab 视觉解释不足；测试覆盖率没有覆盖率报告，不能写成确定的 2%，只能说“仅 1 个源测试文件，覆盖面明显不足”。

## 3. P0 上线阻断

### P0-1 新用户没有 onboarding 守卫

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\_layout.tsx:22`  
证据：根布局只渲染 `Stack`，没有读取 `isOnboardingComplete()` 并重定向。`C:\Users\Administrator\Documents\健身日历\apps\mobile\store\fitness-store.ts:319` 已实现完成度判断，但没有被路由守卫消费。  
影响：新用户会直接进入默认数据计划，不知道当前方案依据，核心推荐结果可信度下降。  
建议：在 app 层增加首次进入守卫，未完成时进入 `/onboarding/body`；允许跳过时明确标注“使用默认数据”。

### P0-2 动态调整结果没有进入主体验

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\features\adjustments.ts:28`  
证据：`buildDailyAdjustmentSummary` 只在自身文件内被定义，静态检索未发现页面消费。  
影响：用户记录实际饮食和训练后，看不到“偏差如何影响未来计划”，核心闭环断开。  
建议：首页或训练页加入“今日偏差 -> 未来调整”卡片，展示 `foodDelta`、`trainingDelta`、`days`、`adjustedDailyCalories`、`warning`，并提供确认/保持原计划。

### P0-3 Native 端状态持久化不可用或静默失败

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\store\fitness-store.ts:113`  
证据：持久化只使用 `localStorage` 与 `indexedDB`，React Native iOS/Android 默认没有这些浏览器 API；`indexedStorage()` 的写入失败在 `fitness-store.ts:170` 和 `fitness-store.ts:177` 被空 `catch` 吞掉。  
影响：用户画像、目标、饮食、训练和历史记录在真机上可能无法保存，且用户和开发者都看不到错误。  
建议：按平台拆分存储层，Native 使用 `@react-native-async-storage/async-storage` 或 MMKV，Web 保留 localStorage/IndexedDB，并统一错误日志和降级提示。

### P0-4 API 子项目脚本不可用

位置：`C:\Users\Administrator\Documents\健身日历\package.json:8`  
证据：根脚本 `dev:api` 指向 `pnpm --dir apps/api dev`，但 `C:\Users\Administrator\Documents\健身日历\apps\api\package.json` 不存在。  
影响：团队会误以为后端可启动；后续把 WorkoutX 代理、密钥保护或服务端校验放进 API 时没有可靠工程入口。  
建议：补齐 `apps/api/package.json`、`tsconfig`、`dev/typecheck/test` 脚本和依赖，或在 API 未成形前移除根脚本。

### P0-5 客户端公开 API Key 存在滥用风险

位置：`C:\Users\Administrator\Documents\健身日历\.env:1`，`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\train.tsx:41`  
证据：`.env` 存在 `EXPO_PUBLIC_WORKOUTX_API_KEY`，训练页读取后在 `train.tsx:239` 到 `train.tsx:242` 作为 `X-WorkoutX-Key` 发往第三方 API。  
影响：`EXPO_PUBLIC_*` 会进入客户端包，用户可从 Web bundle 或移动端包提取 key，造成配额滥用、账单风险或第三方接口冒用。  
建议：立即轮换当前 key；通过 `apps/api` 或 serverless 代理访问 WorkoutX；服务端加缓存、速率限制和错误降级。

## 4. P1 高优先级问题

### P1-1 宏量营养在餐次计划中被置零

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\features\today-plan.ts:120`  
证据：`buildMealPlan` 汇总餐次 totals 时把 `proteinG`、`fatG`、`carbsG` 写成 0。  
影响：餐次计划的蛋白、脂肪、碳水展示和后续调整计算失真。  
建议：`MealPlan.foods` 保存每个食物的完整 totals，汇总时使用真实宏量数据；补测试覆盖 buildMealPlan 宏量汇总。

### P1-2 页面巨型化且渲染计算未隔离

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\index.tsx:72`，文件 972 行；`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\train.tsx:145`，文件 1261 行。  
证据：首页存在 15 个左右独立 Zustand selector，渲染体中直接执行食物解析、餐次计划、营养差异、日期和方案摘要计算。  
影响：输入文字或折叠卡片会触发大量重算；组件难测试、难复用、难定位问题。  
建议：按功能拆 `features/today`、`features/training` hooks 和纯组件；昂贵计算使用 `useMemo`；selector 合并并使用 shallow comparison。

### P1-3 shared 架构边界没有落地

位置：`C:\Users\Administrator\Documents\健身日历\shared\index.ts:1`，文件 484 行。  
证据：`shared/index.ts` 同时承载类型、静态数据、营养公式、训练生成和聚合导出；`shared/domain/nutrition`、`shared/domain/plan-engine`、`shared/domain/training` 与 `shared/components` 当前无源码文件。  
影响：模块依赖方向不清，移动端 import shared 时容易把大数据和无关逻辑一起带入。  
建议：建立 `shared/types`、`shared/domain/nutrition`、`shared/domain/training`、`shared/domain/plan-engine`，`shared/index.ts` 仅作为稳定 facade。

### P1-4 饮食与训练联动存在但不可感知

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\index.tsx:119`，`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\train.tsx:380`。  
证据：饮食页底层用 `energyPlan.tdee + actualTraining.calories` 计算消耗，但界面没有明确说明训练消耗如何影响今日赤字；训练页也没有反馈“已影响饮食预算”。  
影响：产品卖点被隐藏，用户会认为两个 Tab 相互独立。  
建议：两页都增加来源条和反馈卡，例如“基础消耗 1800 + 训练 320 = 今日消耗 2120”。

### P1-5 远程动作库策略风险

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\train.tsx:37`。  
证据：WorkoutX URL 和 GitHub 数据集 URL 位于客户端页面；第 239 行发起 WorkoutX 请求，第 1109 行本地 manifest 失败后请求 GitHub。  
影响：离线优先 MVP 会受网络、第三方服务、限流和合规影响。  
建议：MVP 默认只读本地动作库；远程增强放到显式开关后。

## 5. P2 改进项

- `C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\index.tsx:214` 使用 `custom-${Date.now()}`，快速重复添加存在 ID 碰撞风险，建议改 UUID。
- `C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\more.tsx:116` 到 `more.tsx:140` 的宠物图片上传直接读取 Data URL 并进入持久化 store，建议限制 MIME、大小、像素并压缩后存储。
- `C:\Users\Administrator\Documents\健身日历\apps\mobile\android\app\src\main\AndroidManifest.xml:3` 到 `AndroidManifest.xml:14` 声明外部存储、悬浮窗权限且 `allowBackup=true`，建议按实际使用裁剪权限并排除敏感健康数据备份。
- `C:\Users\Administrator\Documents\健身日历\apps\mobile\app\+html.tsx:18` 使用 `dangerouslySetInnerHTML` 注入静态 CSS，当前内容为常量，风险低；仍建议改为普通样式文件或注明静态常量。
- `C:\Users\Administrator\Documents\健身日历\apps\mobile\app\_layout.tsx:15` 和 `+html.tsx:11` 依赖 Google Fonts，离线优先 MVP 应改系统字体或本地字体。
- `C:\Users\Administrator\Documents\健身日历\apps\mobile\components\bento` 可复用组件仍在 app 内，和“公共组件放 shared/components”规则不一致。
- `C:\Users\Administrator\Documents\健身日历\apps\mobile\features\__tests__\food-intelligence-engine.test.ts` 是唯一源测试文件；缺少 store、UI、持久化、训练页、调整引擎、路由守卫和 E2E 测试。
- 根目录 `.gitignore` 未充分覆盖原生 build、本地配置和生成 artifact；`apps/mobile/android/gitignore` 不是 `.gitignore`，不会生效。

## 6. 建议修复路线

### Phase 1：上线阻断修复，预计 3-5 天

1. 增加 onboarding guard 和跳过提示。
2. 修复 Native 持久化层，补错误日志和降级 UI。
3. 补齐或移除 `apps/api` 启动脚本。
4. 修复 `buildMealPlan` 宏量营养汇总。
5. 把动态调整摘要接入首页或训练页。
6. 明确离线动作库默认策略，远程增强默认关闭。

### Phase 2：架构和性能整理，预计 2-3 周

1. 拆分 `shared/index.ts`，将类型、数据、领域公式分层。
2. 首页和训练页瘦身到组装层，提取 hooks 和 feature 组件。
3. 食物解析候选表缓存，输入 debounce，食物 ID 查找改 Map。
4. 迁移可复用 Bento 组件到 `shared/components`，业务卡片留在 app/feature。

### Phase 3：质量体系，预计 2-4 周

1. 建立移动端测试脚本归属和覆盖率报告。
2. 补 store 持久化、调整引擎、onboarding、训练反馈和餐次汇总单测。
3. 引入 Playwright 或 Expo E2E 冒烟：首次进入、记录饮食、记录训练、查看调整、历史回看。
4. 建立依赖审计、CI typecheck/test、artifact ignore 规则。

## 7. 验证记录

已通过：

```powershell
pnpm --recursive run typecheck
pnpm --recursive run test
```

已确认失败或未完成：

- `pnpm dev:api` 预期失败，因为 `apps/api/package.json` 不存在。
- `pnpm audit --audit-level moderate` 本次超时，未得到有效结果。
- 未跑 Playwright/截图验证，因为本次审查保持只读且避免生成更多 artifacts。
