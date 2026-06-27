# QA 与安全检查

> 团队成员：严过关，QA/安全工程师  
> 审计日期：2026-06-27  
> 审计对象：`C:\Users\Administrator\Documents\健身日历` 当前未提交工作区快照  
> 评分：3.7/10  

## 1. 结论

项目当前没有发现会阻止 TypeScript 编译或食物解析测试运行的错误，但上线质量基线不足：没有全局错误边界，持久化异常会被吞掉，客户端公开配置容易被误当密钥，外部网络依赖没有产品级降级说明，测试集中在单一食物解析文件。

安全结论需要准确表述：当前代码通过 `EXPO_PUBLIC_*` 读取第三方 API key，且 `.env` 存在同名变量。它不属于源码里直接写死具体 key 的模式，但仍会进入客户端 bundle，不能承载秘密。`dangerouslySetInnerHTML` 当前注入的是静态 CSS 常量，风险低，但仍应避免扩大这种模式。

## 2. 已验证命令

```powershell
pnpm --recursive run typecheck
pnpm --recursive run test
```

结果：均通过，26 个测试全部通过。

未验证：

- 未跑覆盖率报告，因此不能给出精确覆盖率百分比。
- `pnpm audit --audit-level moderate` 本次超时，依赖漏洞状态未知。
- 未做真机、WebView、隐私模式、断网模式和 Playwright E2E 验证。

## 3. P0 问题

### P0-1 无全局 ErrorBoundary

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\_layout.tsx:22`  
证据：根布局只包含 ThemeProvider、WebFontLoader、StatusBar 和 Stack，未见全局错误边界。  
影响：渲染异常可能导致白屏或 App 闪退，用户没有恢复路径。  
建议：添加 app 级错误边界和页面级 fallback；错误信息写入本地日志，保留“重试/返回首页”按钮。

### P0-2 持久化错误被吞掉

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\store\fitness-store.ts:119`，`fitness-store.ts:170`  
证据：localStorage 读写没有 try-catch；IndexedDB 写入失败空 `catch { /* pass */ }`。  
影响：隐私模式、WebView、Native 环境或存储配额异常时，用户数据可能丢失且无提示。  
建议：所有存储操作加错误捕获；写失败时使用内存降级并提示“本次记录可能不会保存”。

### P0-3 Native 存储 API 不匹配

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\store\fitness-store.ts:113`  
证据：存储层只判断浏览器 API，未适配 React Native 持久化。  
影响：真机端核心数据无法可靠保存，是移动 App 上线阻断。  
建议：按平台注入存储实现，并补 Native 持久化测试或手工验证清单。

### P0-4 客户端 API Key 暴露

位置：`C:\Users\Administrator\Documents\健身日历\.env:1`，`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\train.tsx:41`  
证据：`.env` 存在 `EXPO_PUBLIC_WORKOUTX_API_KEY`，训练页读取后在 `train.tsx:239` 到 `train.tsx:242` 作为 `X-WorkoutX-Key` 发往 WorkoutX。  
影响：任何能拿到客户端包的用户都可能提取 key，造成配额滥用、账单风险或接口被冒用。  
建议：立即轮换当前 key；后续由后端代理 `/api/exercises` 调用 WorkoutX，服务端保存 key，并加 rate limit、缓存和脱敏日志。

## 4. P1 问题

### P1-1 宠物图片上传缺少大小和类型硬校验

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\more.tsx:116`，`C:\Users\Administrator\Documents\健身日历\apps\mobile\store\fitness-store.ts:380`  
证据：上传入口依赖 `accept="image/*"`，随后 `FileReader.readAsDataURL(file)` 并把 `customPet` 持久化；未限制文件大小、MIME allowlist、像素尺寸或压缩。  
影响：大图 Base64 膨胀后可能击穿 localStorage 配额，进而导致全局状态保存失败。  
建议：限制 MIME 和大小，例如 `image/jpeg/png/webp` 且小于 1MB；上传后压缩缩放；大对象放 IndexedDB 或文件存储，不放 Zustand persist 主状态。

### P1-2 外部请求缺少统一降级策略

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\train.tsx:239`，`train.tsx:1109`  
证据：训练页请求 WorkoutX 和 GitHub fallback；产品层没有明确“离线/联网增强”的状态说明。  
影响：断网或第三方失败会影响训练动作库体验，用户不知道数据是否完整。  
建议：默认本地库；联网增强失败时显示非阻断提示；记录请求错误便于排查。

### P1-3 Android 权限和备份策略过宽

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\android\app\src\main\AndroidManifest.xml:3`，`AndroidManifest.xml:14`  
证据：AndroidManifest 声明外部存储和悬浮窗相关权限，且 `android:allowBackup="true"`。  
影响：扩大隐私和应用商店审核面；备份可能带走本地健康、饮食和训练数据。  
建议：删除未使用权限；生产版禁用悬浮窗权限；设置 `allowBackup=false` 或配置 backup rules 排除敏感状态。

### P1-4 输入边界和数值校验不足

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\app\(tabs)\index.tsx:218`  
证据：自定义食物数值通过 `numberOr` 给默认值，缺少上限、异常值提示和单位校验。  
影响：用户可输入极端热量或宏量，污染计划和调整结果。  
建议：引入 schema 校验，限制 kcal/100g、蛋白、脂肪、碳水、每份克重上下界，并在 UI 显示错误。

### P1-5 动态正则风险

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\features\food-parser-engine.ts:606`  
证据：食物识别引擎存在动态模式匹配构造，若未来接入用户自定义别名或联网数据，需要防止正则注入和 ReDoS。  
影响：恶意或异常词条可能造成解析性能问题。  
建议：所有动态词条先 escape，再限制长度和字符集；长文本解析加最大输入长度。

### P1-6 测试覆盖面不足

位置：`C:\Users\Administrator\Documents\健身日历\apps\mobile\features\__tests__\food-intelligence-engine.test.ts:1`  
证据：当前只发现 1 个源测试文件，覆盖食物解析，未覆盖 store、持久化、路由、UI、训练、调整引擎和错误路径。  
影响：宏量置零、Native 持久化、route guard 缺失这类问题不会被现有测试捕获。  
建议：建立测试矩阵，至少覆盖 P0/P1 问题的回归用例。

## 5. P2 问题

- `C:\Users\Administrator\Documents\健身日历\apps\mobile\app\+html.tsx:18` 的 `dangerouslySetInnerHTML` 当前为静态 CSS，低风险；建议改普通样式或确保不接受用户输入。
- `C:\Users\Administrator\Documents\健身日历\apps\mobile\app\_layout.tsx:15` 动态注入 Google Fonts link，建议离线 MVP 使用本地字体或系统字体。
- `C:\Users\Administrator\Documents\健身日历\apps\mobile\android\app\debug.keystore` 等原生生成物当前在未跟踪区，需明确提交策略和忽略规则。

## 6. 建议测试矩阵

1. Store：Web、Native、localStorage 禁用、IndexedDB 失败、迁移版本。
2. Onboarding：首次进入、跳过、完成后进入首页、重启后保持状态。
3. 今日饮食：输入、未识别、极端数值、自定义食物、餐次汇总宏量。
4. 训练：本地动作库、断网、远程失败、训练反馈影响饮食赤字。
5. 调整：摄入超标、训练缺失、未来 N 天分摊、用户确认和取消。
6. E2E：首次引导 -> 记录饮食 -> 记录训练 -> 查看调整 -> 日历回看。
