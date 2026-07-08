# 食物数据库 · 同名/别名冲突管线级方案（2026-07-08）

> 由专家团 `food-db-cfc` 续推产出（用户授权"听你的、你去判断"）。
> 前置：上一轮已确立 CFC-6 铁律并完成 7 条营养修正（`food-cfc-correction-review-2026-07-08.md`）。
> 本报告覆盖"同名冲突 111 组 + 别名歧义 608 条"的管线级收敛方案。

## 一、根因（为什么不能手改）

- `curated-foods.ts` 是**自动生成文件**（`pnpm --dir shared import:curated-foods` 整体覆盖），手改会被重导入冲掉。
- CSV 生成器 `shared/scripts/import-curated-foods.js`：id 用 `csv-${foodCode}`，`name` 直抄 CSV，`aliases` 由 `uniqueTerms(foodName, alias, searchKeywords)` 构建，**零跨源校验** → 与内置同名物产生 111 组冗余副本。
- 别名无全局索引校验 → 同物多 SKU 共享通用别名（如 10 个康师傅/统一都别名"方便面"）、污染关键词（葵花子被注入奶油别名）共产生 608 条歧义。

## 二、专业判定（调研后的方案选择）

| 候选方案 | 取舍 |
|---|---|
| 源头 CSV 收敛（方案 B） | ✗ 需重生成生成文件，回归面大 |
| 纯搜索层消歧（方案 C） | △ 只修搜索，不修规范数据，其他消费点仍脏 |
| **合并层 mergeKey 同名合并 + 别名单一归属**（方案 A 升级） | ✅ **选定**：在 `getFoodCatalog` 运行时清洗，不碰生成文件，所有下游自动受益，最小爆破半径 |

**关键判定依据（运行时数据实测）**：
1. 113 组同名**全部为"同物冗余副本"**（builtin/fallback 权威项 vs CSV 副本），**无异物同名误合并风险** → `mergeKey=归一化name` 首现优先安全。
2. 608 条别名歧义**绝大多数是"同物的品牌/产地变体共享通用别名"**，属良性噪音 → 别名收敛到单一归属即可去噪，不丢数据。
3. 仅少数默认判定会选错（马铃薯家族默认选到"淀粉(马铃薯)"、方便面默认选到某品牌 SKU）→ 用非生成覆盖层 `food-alias-overrides.ts` 校正。

## 三、实现要点

### 3.1 不丢历史：idRedirect
被合并的冗余项**不物理删除**，而是登记 `idRedirect[droppedId]=survivorId`；`getFoodByIdFromCatalog` 跟随重定向 → 历史饮食记录的旧 CSV id 仍可解析为权威项（已验证 `csv-ext2332→instant-noodles`、`csv-ext2479→walnut`）。

### 3.2 目录层清洗（shared/index.ts `buildCleanedCatalog`）
1. 别名归属：每个别名按层序 `custom>cfc>builtin>supplement>fallback>csv>gap` 首现优先归属到唯一食物；再施加显式覆盖层。
2. 别名清洗：每个食物仅保留"自己拥有"的别名 → 歧义别名收敛到单一归属。
3. 同名合并 + id 去重：归一化 name（NFKC + 去空白/小写/去标点）作 mergeKey，首现优先；冗余项登记重定向。
4. **克隆不改源对象**，可随 CSV 重导入安全共存。

### 3.3 覆盖层（shared/data/food-alias-overrides.ts，非生成）
仅收录高置信度校正项（与 getFoodCatalog 逻辑同步）：
```
土豆/洋芋/山药蛋/地蛋/荷兰薯 → csv-ext1276（规范马铃薯）
方便面 → instant-noodles（内置通用）
```

### 3.4 下游自动受益
`food-semantic-parser.ts:217` 与 `food-parser-engine.ts:294` 的倒排索引直接读 `getFoodCatalog` → 目录清洗后搜索**自动去噪，无需逐个改消费点**（最小爆破半径的关键）。

### 3.5 CI 门禁（scripts/validate-foods.mjs 新增 R9）
复算清洗后残差：期望 **同名=0、跨食物别名歧义=0**，防止 CSV 重导入回潮。

## 四、验证结果（双门禁）

- 校验脚本 `node scripts/validate-foods.mjs`：**NODE_EXIT=0**
  - 【规则9】管线清洗后残差：**同名=0，跨食物别名歧义=0**（期望 0/0）✅
  - R1 剩 15 良性；R6 base 0；R6b 7 组；R8 gap=34/34 + cfc=7/7 ✅
- 运行时合并 `buildCleanedCatalog([])`（tsx）：
  - 清理后目录 **2728 条**（原 2851，折叠 123 冗余项）
  - `idRedirect` 130 条 = 123 真折叠 + 7 个 cfc/gap 覆盖同 id 基项的无害自重定向
  - CFC 修正完好：`doujiang` 31/3/1.6/1.2（第6版）、`csv-ext2021 麻辣豆腐` 133（第6版-组分重建）
  - 重定向生效：`csv-ext2332→instant-noodles`、`csv-ext2479→walnut`
  - 覆盖层生效：`csv-ext1276` 拥有 土豆/洋芋/山药蛋/地蛋/荷兰薯；`instant-noodles` 拥有 方便面
  - 污染修复：`csv-ext0329 葵花子` 的 黄油/白脱/乳脂/淡奶油 别名已被剥离

## 五、残留说明（良性，非冲突）

校验实测有 5 个"别名残留"误报，经核查为**单食物自身 aliases 数组内重复同一别名**（如 `shaoefan` 的"烧鹅饭"出现两次），并非跨食物歧义 → R9 用 id 集合去重后计为 0，真实跨食物歧义 = 0。

## 六、交付物

- `shared/data/food-alias-overrides.ts` — 别名归属覆盖层（非生成）
- `shared/index.ts` — 新增 `buildCleanedCatalog` + 重写 `getFoodCatalog`/`getFoodByIdFromCatalog`（id 重定向）
- `scripts/validate-foods.mjs` — 新增 R9 回归门禁
- 本报告

> 全程未提交 git（用户未要求）。冲突报告 `food-name-conflicts-2026-07-08.md` / `food-alias-conflicts-2026-07-08.md` 记录的 111 组 + 472 条，现已在运行时管线层闭环，无需手改生成文件。
