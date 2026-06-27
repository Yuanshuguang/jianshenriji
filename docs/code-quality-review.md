# 代码质量评审

> 团队成员：寇豆码，工程师  
> 审计日期：2026-06-27  
> 审计对象：`C:\Users\Administrator\Documents\健身日历` 当前未提交工作区快照  
> 评分：4.3/10  

## 1. 结论

当前代码可以通过 TypeScript 检查和现有测试，说明基础语法和食物解析主路径没有立即崩坏。但工程质量仍处于原型阶段：移动端持久化没有适配 Native，API 子项目脚本不可用，页面文件过大，渲染期间重复执行昂贵计算，测试归属不清。

## 2. 已验证命令

```powershell
pnpm --recursive run typecheck
pnpm --recursive run test
```

结果：均通过。测试输出显示 26 个测试全部通过，集中在食物识别与餐次解析。

未完成：`pnpm audit --audit-level moderate` 本次超时，不能给出依赖漏洞结论。

## 3. P0 问题

### P0-1 Native 端状态持久化不成立

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\store\fitness-store.ts:113`  
证据：`browserStorage` 只使用 `localStorage` 和 `indexedDB`。React Native iOS/Android 没有这些浏览器 API。`fitness-store.ts:170` 和 `fitness-store.ts:177` 的 IndexedDB 写入失败被空 `catch` 吞掉。  
影响：用户数据可能在真机上无法保存，且没有错误提示。  
建议：引入平台存储 adapter：Web 使用 localStorage/IndexedDB，Native 使用 AsyncStorage 或 MMKV；持久化失败时记录日志并显示降级提示。

### P0-2 API 脚本不可执行

位置：`C:\Users\Administrator\Documents\健身日历\package.json:8`  
证据：根脚本 `dev:api` 指向 `apps/api`，但该目录没有 `package.json`。  
影响：后端代理、密钥保护和服务端校验无法按脚本启动。  
建议：补齐 API 包工程配置，或在 API 成熟前移除根脚本。

## 4. P1 问题

### P1-1 餐次宏量营养汇总错误

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\features\today-plan.ts:120`  
证据：`buildMealPlan` 汇总时把每个 food item 的 `proteinG`、`fatG`、`carbsG` 固定为 0。  
影响：餐次营养展示和动态调整输入错误。  
建议：在 `meal.foods` 中保留完整 `NutritionTotals`，或通过 `portion.totals` 汇总。

### P1-2 首页重复执行食物解析和营养计算

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\index.tsx:113`  
证据：`parseFoodText`、`buildActualFoodPortionsFromText`、`sumNutrition`、`buildMealPlan` 等在渲染体中直接执行。  
影响：任意 UI state 改变都会触发全量重算，输入时尤其明显。  
建议：按依赖使用 `useMemo`；输入解析加 debounce；食物候选表按 `customFoods` 缓存。

### P1-3 Zustand selector 过多且分散

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\index.tsx:74`  
证据：首页连续读取约 15 个 store selector。  
影响：store 任意变更都会引发多次 selector 检查，复杂页面更容易重渲染。  
建议：按页面所需聚合 selector，配合 shallow comparison；可把事件 action 和展示 state 分组。

### P1-4 训练动作库 Web 逻辑和 Native 逻辑混用

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\train.tsx:315`  
证据：训练页对 GIF 执行 `fetch(...).blob()` 并创建 object URL，这是 Web 逻辑。  
影响：Native 端不应依赖 object URL；大量 GIF 资源也会造成包体和加载压力。  
建议：Native 用 `<Image source={{ uri }}>` 或 `expo-image` 缓存；列表使用虚拟化；本地动作库按需加载。

### P1-5 测试归属不清

位置：`C:\Users\Administrator\Documents\健身日历\shared\package.json:10`，`C:\Users\Administrator\Documents\健身日历\apps\mobile\features\__tests__\food-intelligence-engine.test.ts:1`  
证据：测试文件在 mobile 包内，却由 shared 包脚本执行；mobile package 没有 `test` 脚本。  
影响：模块责任不清，CI 难扩展，移动端新增测试不自然。  
建议：在 `apps/mobile/package.json` 增加 `test`，shared 只测试 shared 领域模块。

## 5. P2 问题

- `C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\index.tsx:214` 使用 `Date.now()` 生成自定义食物 ID，建议改 UUID。
- `C:\Users\Administrator\Documents\健身日历\shared\index.ts:318` 的 `getFoodCatalog` 会合并大食物库，搜索链路建议预构建 `Map` 和 normalized index。
- `C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\_layout.tsx:62` 日历页存在但 `href: null` 且自定义 TabBar 不含 calendar，用户无法从底部 Tab 进入。
- 根 `.gitignore` 对 Android/iOS build、本地配置、截图 artifacts 覆盖不足，当前工作区已有大量未跟踪生成物。

## 6. 建议

1. 先修 Native 持久化、API 脚本和宏量营养置零。
2. 再做首页和训练页拆分，保持每个页面只做路由和组装。
3. 把测试移动到真实所属包，补 store、plan engine、today-plan 和 route guard 测试。
4. 建立 `lint`、`format`、`test:coverage` 和 CI 脚本。

