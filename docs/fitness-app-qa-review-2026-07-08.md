# 健身日历 App 完整 QA 审查报告

**测试团**：健身APP测试天团
- 主理人 / 运动营养专家：**伍均衡**（牵头营养逻辑审计 + 调度 + 报告汇总）
- **强训之**（健身专家 · 训练科学）
- **庞减之**（超级肥胖减脂用户）
- **苗壮之**（瘦弱增肌 hardgainer 用户）
- **兼得之**（增肌又减脂 recomp 用户）

**方法**：团队 SOP —— Phase 1 四角色并行走查（注册→设目标→记录饮食→记录训练→赎罪/动态调整→计划→我的→看板，覆盖 8 种动态调整情形）→ Phase 2 主理人营养专业审计 + 健身专家训练补充审计 + 交叉验证 → Phase 3 本报告汇编。
成员基于真实代码走查：`apps/mobile/`（UI）、`shared/`（营养/动态引擎）、`shared/data/`（食物库、训练规则）。

**前提**：食物数据库已就绪（2026-07-04 审计后约 2815 条，中文覆盖 99.7%）。本报告不重复审计食物库，聚焦**逻辑、规则、流程与体验**。

---

## 总体结论

底层工程完成度高、营养计算内核科学稳健（Mifflin-St Jeor、体脂可用时 Katch-McArdle 变体、安全下限 1500/1200、缺口封顶 750、疲劳≥4 强制延长均到位）。**但产品几乎完全以「减脂用户」为唯一默认假设**：目标表达层缺重组模型、进度展示层无体成分、呈现层多处把增肌/维持用户当减脂对待、训练推荐无体重门控、全站「赎罪」措辞带 diet-culture 风险。

**核心风险不是算错，而是「对不同目标用户说了减脂的话」**；再叠加两处逻辑缺陷（赎罪页同屏自相矛盾、连续偏差不滚存修正），会系统性侵蚀减脂/增肌达成率与留存。

**严重度统计**：🔴 严重 **6** 项 · 🟡 中等 **12** 项 · 🟢 轻微 **8** 项（已合并重复项）。

---

## 一、🔴 严重（必须修）

### C1 · 赎罪页同屏自相矛盾：引擎「只观察」 vs 账本「建议制造缺口」
- **现象**：recomp / 增肌 / 维持用户某日多吃，赎罪页上方引擎卡片显示「偏离维持区 / 净差 +X / 多吃后只回到原计划观察趋势」，下方热量账本却显示「净多摄入 X kcal，建议用每天约 300 kcal 的温和缺口平滑处理」——同屏两条相反建议。
- **复现路径**：`app/(tabs)/atonement.tsx:164-185`（同时渲染 `AtonementAdjustmentCard` + `CalorieLedgerPanel`）；`shared/calorie-debt-ledger.ts:189-197`（`buildCalorieAdvice` 只收 `netCaloriesDelta`，不收 `goalType`，净多一律减脂话术）；`shared/dynamic-plan-engine.ts:283-292`（dailyDeficit<=0 早返回「只观察不偿还」）。
- **根因**：账本与引擎两套口径打架——`buildCalorieLedgerTimeline` 不接收 `goalType`，对净多摄入统一给减脂式缺口建议。
- **修复**：`buildCalorieAdvice` / `buildCalorieLedgerTimeline` 注入 `goalType`；`maintenance / recomp / muscle_gain` 下改为「回到目标/维持区间即可，无需制造缺口」，移除 warn 警示色。
- **量化影响**：recomp 用户照账本执行 → 月均被动制造 ~300 kcal/天缺口 → 约掉 1kg+，直接破坏重组；且与引擎结论矛盾，可信度崩塌。提出：兼得之、苗壮之。

### C2 · 无「增肌减脂（重组 recomp）」目标模型，GoalType 仅靠体重差推断
- **现象**：Onboarding 只能设「目标体重 + 周期 + 体型美观」；`UserGoal` 无 `goalType` 字段；`resolveGoalType` 用 `profile.weightKg − goal.targetWeightKg` 判定（>0.5→fat_loss，<-0.5→muscle_gain，否则 maintenance），重组（目标=当前）必然归 maintenance，lean-recomp 设略低于当前则被标 fat_loss 按减脂处理。
- **复现路径**：`app/onboarding/body.tsx:425-470`；`app/onboarding/goal.tsx:1-12`（直接 replace 到 body，无类型页）；`store/fitness-store.ts:69-72`（`UserGoal`）；`features/adjustments.ts:194-202`（`resolveGoalType`）；`shared/dynamic-plan-engine.ts:4`（`GoalType` 枚举无 recomp）。
- **根因**：目标被建模为「纯体重差值 + 体型美观」，无 recomposition 概念；类型枚举有 fat_loss/maintenance/muscle_gain 却无 recomp。
- **修复**：增加显式目标类型（减脂 / 增肌 / 增肌减脂重组 / 维持）；重组下目标体重可等于当前体重并附「目标体脂率/围度」；引擎据此给增肌侧重（更高蛋白上限、允许训练日盈余）。
- **量化影响**：100% 重组用户无法准确表达意图，肌肉侧目标在系统中完全消失；重组被错误归类比例高，训练/营养无任何增肌侧重。提出：兼得之、苗壮之。

### C3 · 训练推荐不看 BMI/体重，120kg 用户被推荐「跑步」（运动安全硬风险）
- **现象**：训练建议引擎只按「日型 + 训练部位」排动作，对体重/BMI 零判断；动作库仅 `running`(MET 8) 与 `cycling`(MET 7) 两种有氧，无「步行/快走」。低/极低碳日、断碳日、低热量日的 exercisePriority 直接含 running。结果：120kg、膝踝承压极高、几乎不运动的用户被建议「跑步」。
- **复现路径**：`shared/data/training-diet-rules.ts`（dayTypeProfiles 各日型 exercisePriority/caution 无 weightKg/BMI 分支）；`shared/index.ts:401-417`（exercises 列表无 walking）；`app/(tabs)/train.tsx:207-255`（推荐动作卡片）。
- **根因**：动作库与推荐规则按「通用健身者」设计，未接入 `userProfile.weightKg/heightCm` 做高 BMI 降级。
- **修复**：① `resolveTrainingDietRecommendation` 注入 BMI/体重阈值，BMI≥30 剔除 running，改「步行/快走/椭圆机/坐姿单车/游泳」；② 动作库补低冲击有氧；③ 高危动作（squat/deadlift/pull-up/bench-press）加「新手退阶/辅助器械」提示，BMI≥30 标注「先以低冲击+自重退阶为主」。
- **量化影响**：120kg 跑步膝关节峰值负荷达体重 2.5–3 倍（≈300–360kg/步），属明确高损伤/心血管风险；App 零拦截。提出：庞减之、强训之（F5/F6）。

### C4 · 心理安全与包容：全站「赎罪」措辞 + 目标体型只有「马甲线」+ 开场自拍体脂
- **现象**：① 底部导航第三项叫「赎罪」（闪电图标），页面大标题「赎罪」，副文案「赎罪 = 动态调整目标偏差」，设置里却叫「动态调整」——同一功能两套叫法，且把「吃超了」框定为「需要赎罪」。② 目标体型仅 4 档「腹部更平 / 马甲线隐约可见 / 较明显 / 非常明显」，默认预置 slight-line；120kg 用户在开场就被要求勾选「马甲线非常明显」。③ 高级数据区引导上传自拍/训练照/短视频，再选「腰腹偏软/腹部平坦/线条可见/肌肉线条清晰」粗估体脂率。
- **复现路径**：`app/(tabs)/_layout.tsx:21,62`；`app/(tabs)/atonement.tsx:153,179`；`shared/index.ts:165-170`（`bodyShapeOptions`）；`app/onboarding/body.tsx:50-55,454-469`；`app/onboarding/body.tsx:550-590` + `features/body-image-recognition.ts:29-43,112-138`。
- **根因**：产品早期用词未做减脂用户心理安全评审；目标设定只服务「练出腹肌」审美叙事；把视觉体脂粗估做成 onboarding 主路径。
- **修复**：① 全站统一中性词「差额补偿 / 动态调整 / 热量账本」，删除「赎罪」及所有罪感暗示。② 目标维度改健康/功能导向多选（健康体重区间 / 提升体力 / 改善慢病指标 / 日常活动更轻松 / 腹肌线条），BMI≥30 默认进入健康目标流。③ 体脂率默认走公式估算（Deurenberg，已结合 BMI/年龄），自拍估算降级为「可选·默认折叠」，视觉等级文案中性化（「整体偏胖/适中/精瘦」），明确「自拍不入库不上传」。
- **量化影响**：对大基数/有进食障碍倾向者强化羞耻、诱发暴食—节食循环（diet-culture 公认高危语言）；120kg 用户开场即被排斥与强触发。提出：庞减之、兼得之、苗壮之。

### C5 · 训练页把增肌用户当减脂：「热量赤字」语义错位（虚假赤字）
- **现象**：增肌用户训练日吃够目标 2449 kcal、训练消耗 400 kcal，训练页显示「热量赤字 100 kcal / 目标 0 kcal」并标绿色「达标」。增肌本应看「盈余/净平衡」，却显示虚假赤字。
- **复现路径**：`app/(tabs)/train.tsx:96-98`（`burnCalories = tdee + 训练`；`deficit = max(0, burn − 摄入)`）；`:357-402`（TrainingEnergySummary）；`deficitTarget:199 = Math.max(0, round(energyPlan.dailyDeficit))`（增肌 dailyDeficit=-300 → 0）。
- **根因**：能量平衡写死「赤字 = 消耗 − 摄入」且目标被 `Math.max(0,...)` 钳掉；未传 goalType，未用含盈余的目标热量做基准，盈余目标（负值 dailyDeficit）被吃掉。
- **修复**：按 goalType 切换——增肌期显示「净盈余/净平衡 = 实际摄入 − 目标热量(含盈余)」或「摄入 − TDEE 的盈余」；至少把 `deficitTarget` 用真实 dailyDeficit（可负），文案改为「盈余目标 +300」。
- **量化影响**：100% 训练日的增肌用户被显示虚假「热量赤字 100 kcal」；长期误导其误判能量状态。提出：苗壮之。

### C6 · 看板无体成分进度维度，recomp 进度（体重不变但体脂↓/肌肉↑）不可见
- **现象**：体脂%、骨骼肌、水分仅在 Onboarding 录入一次，从未形成趋势图；「我的」页只有设置项重置；饮食/计划页无体成分图表。recomp 用户唯一可见信号是体重（持平），易被误判为「没效果」。
- **复现路径**：`app/(tabs)/more.tsx`（仅 reset/settings）；`app/(tabs)/index.tsx`、`plan.tsx` 无体成分图表；`components/CalorieLedgerPanel.tsx` 仅热量/宏量账本。
- **根因**：进度维度只有热量账本，缺体成分/围度/照片时间序列。
- **修复**：增加体脂% / 腰围 / 体重趋势卡 + 照片对比；重组看板以「体脂↓、围度↓、体重≈」为正向指标。
- **量化影响**：重组用户因看不到正向反馈而放弃比例极高（recomp 本就慢、体重不动）。提出：兼得之。

---

## 二、🟡 中等（应修）

### M1 · 目标体重/周期无交叉可行性校验，激进计划被静默封顶仍显示可行
- **复现**：`app/onboarding/body.tsx:441`（targetWeightKg 30–300）、`:449`（targetDays 14–365）；`shared/index.ts:432`（dailyDeficit 封顶 750 无提示）；`app/(tabs)/plan.tsx:177-179`（无条件展示目标体重+周期）。
- **根因**：能量计划算完即渲染，缺「目标可行性」校验与「已安全收敛」明示。
- **修复**：目标体重下限按身高做最低健康 BMI（≥18.5）校验；dailyDeficit 被封顶时在计划页明示「按安全上限 X kcal/天，预计约 Y 天达成，您设的 Z 天偏激进」；超级肥胖提示合理减脂速度（0.5–1% 体重/周）。
- **量化影响**：120→80kg 真实需 40–80 周；误以为 14 天可达者首周掉 1–2kg 后强烈失望弃用。提出：庞减之。

### M2 · 赎罪页对增肌用户「空转」且无说明
- **复现**：`shared/dynamic-plan-engine.ts:283-292`（dailyDeficit<=0 整体短路返回零，不进任何模式分支）；`features/adjustments.ts:204-222`（增肌标题为「增肌观察/热量盈余」，但 mode 选择无效）；`app/(tabs)/atonement.tsx:204-216`（模式切换 UI）。
- **根因**：动态引擎以减脂为核心，增肌期 dailyDeficit<=0 被短路，模式参数（repayDays/adjustmentMode）无作用域。
- **修复**：增肌期隐藏/禁用赎罪模式切换并说明原因；或重新定义增肌语义（如「吃少/练多」的正向补偿方案）。
- **量化影响**：100% 增肌用户看到可交互按钮但结果不变，制造「功能坏了」错觉。提出：苗壮之。

### M3 · 盈余上限 +300 且周期越长盈余越小，hardgainer 无法设 +500
- **复现**：`shared/index.ts:431-434`（`dailyDeficitRaw` clamp 到 `Math.max(-300, Math.min(750, raw))`；`calories = max(安全线, tdee − dailyDeficit)`）。例：目标 65kg/300 天 → raw≈-218 → 盈余仅 218。
- **根因**：盈余完全由体重差/天数公式推导并被钳制，无「bulk surplus」独立参数。
- **修复**：增肌用户给盈余档位（+250/+350/+500）或把上限从 -300 提到 -500；避免「周期越长盈余越小」（增肌应固定或给下限）。
- **量化影响**：175/55→65 用户无论怎么设都拿不到 >+300 盈余；想 +500 的 hardgainer 完全无法满足；长周期用户被压到 +218 更难长肉。提出：苗壮之。

### M4 · 训练多了反而抬高热量目标，对吃不够的人雪上加霜
- **复现**：`shared/dynamic-plan-engine.ts:383-392`（`computeTrainingCompensation`：dailyDeficit<-100 时 ratio=0.6，补偿 = min(额外×0.6, 目标×0.15, 350)）；`:142-145`（adjustedDailyCalories = 目标 − 还款 + 补偿）。
- **根因**：训练补偿逻辑为「减脂用户多吃回训练消耗」设计，对增肌用户同样抬高门槛，未考虑其本就接近摄入上限。
- **修复**：增肌期训练补偿以「建议加餐/蛋白饮」提示呈现，而非提高硬性日目标；或对该群体补偿封顶更低（目标×0.08）。
- **量化影响**：多练 400 kcal 的增肌用户目标被抬高约 240 kcal，本就难吃够的人更难达标。提出：苗壮之。

### M5 · 训练消耗在首页被重复计入（TDEE 已含训练，又叠加 actualTraining）
- **复现**：`app/(tabs)/train.tsx:97-98`（`burnCalories = energyPlan.tdee + actualTraining.calories`）；TDEE 来源 `calculateGoalEnergyPlan`（活动系数已含训练能量，`fitness-store.ts:766-781`）。
- **根因**：TDEE 的活动系数已含训练能量，又在其上叠加整段 actualTraining.calories，双重计数。
- **修复**：消耗展示用「去训练」活动系数（BMR×日常 NEAT≈1.2–1.3）再单独加 actualTraining；或只叠加「实际−计划」差额；或直接只展示 TDEE，避免与饮食目标（energyPlan.calories，已单次计入）口径打架。
- **量化影响**：所有训练 Tab 用户读数误导（4×60 训练者约虚高 300–450 kcal/天），可能诱导多吃。提出：强训之（F1）。

### M6 · 训练热量 MET 估算偏高且计划/实际两套标尺
- **复现**：`apps/mobile/components/training/training-utils.ts:79-86`（gif→5.5、有氧→8、徒手→4.5、默认5.2，拉伸/平板/瑜伽等低强度动图也按 5.5）；`features/today-plan.ts:315-317`（公式正确，但阻力训练含组间休息按全程连续计，无休息折扣）；`shared/index.ts:401-417`（计划侧用内置更细 MET，深蹲6.5 vs 库内 gif→5.5 不一致）。
- **根因**：MET 按「媒体类型/肌群」粗分无强度分层；阻力训练未扣休息；计划与实际不同数据源。
- **修复**：按 Compendium of Physical Activities 给动作补真实 MET/强度分级；阻力训练乘 0.6–0.7 有效活动系数扣休息；计划与实际统一同一 MET 表。
- **量化影响**：全体记录训练者；减脂用户最受影响（多练被过度奖励→多喂→掉秤慢）。提出：强训之（F2）。

### M7 · 动态调整对训练侧偏差纠正过弱且连续偏差不滚存
- **复现**：`shared/dynamic-plan-engine.ts:373-381`（`computeTrainingWeight`：少练 planned>actual 时权重仅 0.25–0.3）；`:383-392`（多练给满额奖励 + 降债 + 加餐）；`calorie-debt-ledger.ts:78-125`（`runningNetCalories` 跨天累加但「仅展示不自动改次日目标」）。
- **根因**：对训练热量估计不信任→少练惩罚打折；多练给满额奖励；日度引擎只看当日 delta，跨天累积债不进入次日目标。
- **修复**：少练/多练用对称、可解释折减（统一按训练热量不确定度 0.5）；`runningNetCalories` 超阈值（如 >3×日赤字）时自动把部分债摊入后续每日目标，否则「赎罪」对连续偏差无效；UI 明确区分「当日调整」与「累计债」。
- **量化影响**：减脂&维持用户，长期少练/连续多吃者——目标赤字被系统性侵蚀却无纠正。提出：强训之（F3）。

### M8 · 训练日/休息日碳水乘量反转且近乎无效
- **复现**：`shared/dynamic-plan-engine.ts:182-186`（`trainingMultiplier` 取 1.12/0.88，但代码 `fatBase` 在训练日用 `scaledFatG / trainingMultiplier`、休息日用 `scaledFatG × 0.88`——两种情形脂肪都被压低、碳水被动抬高；训练日 fatBase≈scaledFat×0.893、休息日≈×0.88，差异仅 ~1.5%）。
- **根因**：把「碳水乘数」误用在脂肪上，且休息分支把 0.88 乘到脂肪而非碳水；训练日高碳水/休息日低碳水的意图未实现。
- **修复**：直接对碳水应用乘数（trainingDay carbs=base×1.12，restDay×0.88），脂肪按剩余能量分配；或显式按碳期化设定训练/休息日碳水占比。
- **量化影响**：选择高碳/低碳饮食方案+训练联动的用户（recomp/减脂），营养时机失效。提出：强训之（F4）。

### M9 · 动作库无难度/风险分级，新手可自选高危动作
- **复现**：`shared/data/exercise-library/manifest.json:21524-21552`（front lever / back lever / frog planche / one-arm snatch 等高危动作与入门动作平铺，条目无 level/difficulty 字段）；`app/exercise-library/index.tsx:127-147`（仅按部位/器械筛选）；`train.tsx:445-472`（建议列表只按部位+优先级排序，不按训练水平门控）。`LibraryExercise` 类型有 level 字段（`types/training.ts:12`）但数据源不填、UI 不展示。
- **根因**：外部数据集无难度元数据；产品未做难度分级与新手门控。
- **修复**：标注难度（初/中/高）与风险标签；新手/大基数默认只展示与推荐初/中级、自重/器械友好动作；高危动作加「需基础/需护具/易受伤」警示与进阶前置。
- **量化影响**：浏览/自选动作的全部用户，新手、大基数、伤后回归者风险最高。提出：强训之（F5）。

### M10 · 计划生成不区分训练水平，无渐进超负荷进阶曲线
- **复现**：`shared/data/training-diet-rules.ts:251-266`（`pickExerciseIds` 仅按 primaryMuscleGroup+强度档取前 N，不参考 trainingLevel）；`shared/index.ts:603-647`；`train.tsx:77-89 / index.tsx:252-262`（generateTrainingQueue 只按部位 slice(0,4)）。
- **根因**：自动计划引擎不接收/不使用 trainingLevel 与历史负荷，缺周期化（progressive overload）逻辑。
- **修复**：计划生成接收 trainingLevel，按水平决定动作难度池与容量（组数/动作数/强度%）；引入多周 mesocycle，容量/强度按周微增（+2.5–5%/周）并提供 deload 周；大基数/伤后给低冲击替代。
- **量化影响**：全部自动生成计划用户；新手最易「练废/受伤/劝退」。提出：强训之（F6）。

### M11 · 实际训练未记录默认回退为计划值，掩盖真实少练
- **复现**：`app/(tabs)/train.tsx:139-150`（用户未输入训练文本时，actualTraining.calories 回退为 estimateTodayWorkoutCalories = 计划值）；仅手动标 missed 才归零。
- **根因**：默认回退把「未记录」等同于「按计划完成」。
- **修复**：未记录时默认 0（或明确标「未完成/未记录」），区分 missed 与未输入；仅当用户明确填了训练内容才用估算。与 M7 叠加会放大赤字侵蚀。
- **量化影响**：习惯不填训练记录的用户——少练不被纠正。提出：强训之（F9）。

### M12 · 首页「超出=红 / 还可继续=正向」二元框架，对暴食/限制倾向不利
- **复现**：`app/(tabs)/index.tsx:656-657`（已超出/还可继续）、`:699-707`（超出红色、还差浅灰）；配合「赎罪」叙事把「吃多」标记为失败。
- **根因**：通用减脂叙事，未考虑进食障碍风险人群。
- **修复**：弱化「超标=错误」的视觉惩罚，补中性引导（「偶尔超出很正常，看周趋势即可」），与热量账本的「温和缺口」口径一致。
- **量化影响**：每日红色「超出」提示累积焦虑，是减脂 App 高弃用因素之一。提出：庞减之。

---

## 三、🟢 轻微（可排期）

| ID | 问题 | 复现路径 | 修复建议 | 提出 |
|----|------|----------|----------|------|
| G1 | hybrid 还款比例与「默认补 50%」不符（≤150 仅 0.15、≤500 仅 0.25、>500 才 0.5） | `dynamic-plan-engine.ts:403-407` `resolveHybridRatio` | 统一文档与实现；或在 UI 解释「小额轻处理、大额补 50%」 | 强训之（F7） |
| G2 | getActivityFactor 按 trainingLevel 默认值反直觉（regular=1.6 > intermediate=1.45 > 新手=1.3） | `fitness-store.ts:754-764` | 校正映射或统一只用基于天/分钟的因子，标签改直观 | 强训之（F8） |
| G3 | 蛋白固定 1.8g/kg 处科学区间下沿，未用已知体脂率转瘦体重、未对增肌/重组上浮 | `shared/index.ts:435,970-975` | bodyFatPercent 已知时按瘦体重×(1.8~2.2)，重组可至 2.0 | 兼得之、苗壮之 |
| G4 | 宏量「偏高」建议对增肌不友好 + suggested 与 advice 口径矛盾 | `calorie-debt-ledger.ts:199-218`（buildMacroAdvice）、`:183-187` | 增肌期宏量「偏高」改「维持/继续」；统一 suggested 与 advice 口径 | 苗壮之（问题9） |
| G5 | 赎罪「新目标」卡在无效时也显示未变目标值，略误导 | `app/(tabs)/atonement.tsx:209-216` | 增肌期无调整时隐藏两张卡或注「维持原计划」 | 苗壮之（问题8） |
| G6 | 体重录入上限 300kg、身高下限 120cm，超极端大基数/特殊身高被排除 | `app/onboarding/body.tsx:411,421` | 体重上限放宽到 400–500kg；超阈值引导线下就医+专业处方 | 庞减之（问题7） |
| G7 | 无「日常活动量（NEAT/职业）」采集，久坐者 TDEE 仅靠训练档位推断 | `fitness-store.ts:754-781`；onboarding 无对应项 | 增加「久坐/轻度/中度/重体力」职业档，区分「不健身但走很多」 | 庞减之（问题8） |
| G8 | GoalType 枚举与实现不一致（含 fat_loss/maintenance/muscle_gain 却无 recomp） | `shared/dynamic-plan-engine.ts:4` | 补全 recomp 类型并在 resolveGoalType / UI 贯通（与 C2 同源） | 兼得之（问题9） |

---

## 四、专项交叉验证结论（营养 × 训练）

主理人基于代码复核，确认用户画像反馈的高频问题**确源于底层逻辑错误**，而非偶发 UI bug：

1. **赎罪页自相矛盾**（C1）→ 根因 `buildCalorieAdvice` / `buildCalorieLedgerTimeline` 不接收 `goalType`，而 `resolveGoalType` 也无 recomp（逻辑缺陷）。
2. **重组模型缺失**（C2）→ `UserGoal` 无 `goalType` 字段、`resolveGoalType` 仅按体重差推断（逻辑+UX 缺陷）。
3. **大基数跑步**（C3）→ `training-diet-rules.ts` 无 BMI 门控 + 动作库无低冲击有氧（逻辑+安全缺陷）。
4. **增肌虚假赤字**（C5）→ `train.tsx` 能量平衡写死「赤字=消耗−摄入」且 `Math.max(0, dailyDeficit)` 吃掉盈余（逻辑+UX 缺陷）。
5. **连续偏差不修正**（M7）→ `runningNetCalories` 仅展示不回灌目标 + `computeTrainingWeight` 欠训惩罚仅 0.25–0.3（逻辑缺陷）。
6. **碳水乘量反转**（M8）→ adjustMacros 把碳水乘数误用于脂肪（逻辑缺陷，经主理人复核确认）。

---

## 五、正面发现（保留项）

1. **营养计算内核科学**：Mifflin-St Jeor + 体脂可用时 Katch-McArdle 变体（`shared/index.ts:449-456`）；肥胖者蛋白参考体重改用理想体重避免虚高（`resolveProteinReferenceWeight`，`:970-975`）；安全下限 1500/1200、缺口封顶 750 稳健。
2. **动态引擎护栏到位**：疲劳≥4 强制 extend-deadline（`dynamic-plan-engine.ts:133,393`）、actual<安全线×0.7 红标、hybrid 默认、safetyFloor 兜底。
3. **吃少不记债**：`buildAtonementPlan` netDelta<=0 直接返回零，计划不被失真扭曲，设计正确。
4. **食物库体量大、中文饮食记录低摩擦**（自然语言+份量+菜单），对普通用户顺手；含高热量便捷项（蛋白粉/即食鸡胸/坚果/牛油果/全脂奶）可达盈余。
5. **存在「大体重长期减脂」饮食方案**与「按 10 天看趋势」的健康引导方向（`diet-plan-database.ts`）。
6. **动作中英本地化翻译系统完善**，工程质量高；引用 ISSN/ACSM/NSCA 等权威证据源，专业感好。

---

## 六、优先修复路线图（食物库已就绪前提下）

### P0 · 上线前必修（按依赖顺序）
1. **C1 赎罪页同屏自相矛盾**：`buildCalorieAdvice` / `buildCalorieLedgerTimeline` 注入 `goalType`；非 fat_loss 改为「回到目标/维持区间即可，无需制造缺口」，去 warn 色。一处逻辑修复消除有害自相矛盾，并连带解决增肌吃超给缺口建议（M2 类）。
2. **C4 全站「赎罪」措辞统一中性化 + 目标体型改健康/功能导向**：删除罪感暗示，BMI≥30 默认健康流。心理安全/包容底线。
3. **C3 + M9/M10 安全部分 训练推荐接入 BMI 门控、补低冲击有氧、高危动作加退阶**：BMI≥30 剔除 running，补 walking/elliptical/seated-cycle/swimming；动作库补难度标签与新手门控。运动安全硬风险。
4. **C5 训练页能量平衡按 goalType 切换**：增肌显示净盈余/净平衡，吃够即达标。消除最脆弱增肌人群误导。

### P1 · 核心 KPI 修复
5. **C2 增 recomp 目标模型 + GoalType recomp 枚举**：onboarding 增类型选择，引擎给增肌侧重（更高蛋白上限、允许训练日盈余）。
6. **C6 看板补体成分进度**：体脂%/腰围/体重趋势卡 + 照片对比，recomp 以「体脂↓围度↓体重≈」为正向。
7. **M7/M11/M8 动态引擎纠正训练侧偏差并滚存**：runningNetCalories 超阈值摊入后续目标；未记录训练默认 0；修正碳水乘量反转。
8. **M3/M1 增肌盈余档位 + 目标可行性校验**：盈余 +250/+350/+500 或上限 -500，周期与盈余解耦；目标体重 BMI 下限校验 + 封顶明示。

### P2 · 体验打磨
9. MET 统一与休息折扣（M6）、TDEE 重复计入修正（M5）、计划进阶曲线（M10）、自拍体脂折叠（C4③）、NEAT 采集（G7）、蛋白上浮（G3）、hybrid 比例文案（G1）等。

---

> 报告校验：所有 🔴/🟡 项均经主理人（运动营养专家）对照源码复核根因；训练侧科学审计由强训之在 Phase 1/2 完成并交叉验证。复现路径已标注到文件与大致行号，可直接定位修复。
