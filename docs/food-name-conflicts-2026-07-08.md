# 食物数据库 · 同名冲突检测报告（2026-07-08）

> 由专家团 `food-db-fix` 任务产出，配合 `scripts/validate-foods.mjs` 规则4生成。
> 完整机器可读列表见该校验脚本输出。

## 一、结论

运行时合并后的食物库（builtin + supplement + fallback + csv + gap，共 **2689** 条）中，存在 **111 组 `name` 重复**（同一中文名对应多个不同 id，分属 builtin 与 csv 两层）。

**性质判定**：绝大多数为"内置权威条目 vs CSV 冗余副本"（如 方便面/面包/酸奶/核桃/可乐…），并非数据错误，而是**搜索噪音**——用户搜"核桃"会同时看到 `walnut`(内置) 与 `csv-ext2479`(CSV) 两条。

**严重度**：🟡 P2（体验/搜索优化，非计算正确性）。**不建议本次手改**，原因见第三节。

## 二、典型冲突样本（共 111 组，节选）

| 食物名 | 内置 id | CSV id |
|--------|---------|--------|
| 方便面 | instant-noodles | csv-ext2332 |
| 面包 | bread | csv-ext2396 |
| 豆腐脑 | tofu-pudding | csv-ext2140 |
| 酸奶 | yogurt | csv-ext0225 |
| 胡萝卜 | carrot | csv-ext1055 |
| 西红柿炒鸡蛋 | tomato-egg | csv-ext2373 |
| 水饺 | dumplings | csv-ext2462 |
| 黄焖鸡 | huangmenji | csv-ext1988 |
| 蛋炒饭 | fried-rice | csv-ext2436 |
| 披萨 | pizza | csv-ext2114 |
| 可乐 | cola | csv-ext2524 |
| 核桃 | walnut | csv-ext2479 |
| 包子 | baozi | csv-ext2440 |
| 烤鸭 | roast-duck | csv-ext2341 |
| 白切鸡 | white-cut-chicken | csv-ext2342 |

（其余 96 组由 `node scripts/validate-foods.mjs` 规则4 完整枚举）

## 三、为什么不能直接手改（关键约束）

`curated-foods.ts` 是**自动生成文件**（文件头注明：更新 CSV 后运行 `pnpm --dir shared import:curated-foods` 重新生成）。若直接编辑该文件删除/合并 CSV 重复条目，**下一次 CSV 重导入会被整体覆盖、改动丢失**。

因此同名冲突的收敛必须走以下任一**管线级**方案，而非手动 patch 生成文件：

### 方案 A（推荐）：合并去重改用 `mergeKey`
在 `getFoodCatalog()` 合并时，不再仅靠 `id` 去重，引入 `mergeKey`（如"标准中文名 + 大类"或权威成分表编码）。同 `mergeKey` 的条目按**数据来源权重**保留一条（builtin/supplement 优先，csv/fallback 下沉），其余标记不活跃。这样无需改生成文件，去重逻辑集中在合并层。

### 方案 B：源头收敛
在源 CSV（`数据库/健身APP食物数据库_优化修复版_V3 .csv`）中合并重复行，再重跑导入。适合一次性大批量清理，但需重新生成 `curated-foods.ts` 并回归测试。

### 方案 C：别名/同义归并层
新增 `food_synonym` 映射表，把 CSV 冗余条目指向内置标准 id，搜索与选择时只呈现标准条目。

## 四、建议落地节奏

1. **短期（可立即做，零风险）**：本报告仅作记录；搜索排序时对"同 name"分组只展示来源置信度最高的一条（在 UI/搜索层处理，不动数据）。
2. **中期**：实施方案 A（mergeKey + 来源权重），一次性消除 111 组噪音。
3. **长期**：结合 `scripts/validate-foods.mjs` 规则4 做 CI 监控，防止新增重复。

## 五、需人工 sign-off 项

- 111 组同名冲突的"保留哪条/合并哪条"需产品/营养负责人确认（尤其品牌 SKU 与通用物的取舍）。
- 方案 A/B/C 的选择需架构确认。

> 本报告为治理建议文档，本轮未对任何生成文件做手动修改。
