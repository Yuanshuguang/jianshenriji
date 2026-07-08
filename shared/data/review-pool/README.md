# 食物数据待审核池

这个目录保存尚未进入运行时食物库的数据。这里的文件不能被 `getFoodCatalog()` 直接导入。

## pending-cn

`pending-cn/` 保存历史批量补充的中国本地食物数据。导入前必须逐条完成：

1. 按最新《中国食物成分表》校准热量和宏量营养。
2. 与 `shared/index.ts`、`curated-foods.ts`、`chinese-foods-supplement.ts` 去重。
3. 确认默认份量符合日常食用场景。
4. 补充或确认 `source` 说明。

## foreign-source-quarantine

`foreign-source-quarantine/` 保存 Open Food Facts 等非中国来源数据。默认不进入运行时食物库。

只有包装食品确实缺少中国数据，且能明确标注来源时，才允许按单条审核后转入运行时目录。
