# 饮食智能识别：联网补充与 AI 兜底方案

## 当前阶段：离线规则引擎

当前实现目标：
- 不联网也能识别常见饮食输入。
- 支持餐次识别，例如早上、中午、晚上、加餐。
- 支持长词优先，避免把完整菜名拆成食材。
- 支持数量、单位、克重、抽象重量估算。
- 返回置信度，低置信度结果后续可进入确认流程。

核心模块：
- `apps/mobile/features/food-intelligence-engine.ts`

数据优先级：
1. 我的菜单
2. App 本地食物库
3. 联网补充
4. AI 辅助识别
5. 用户手动确认

## 联网补充方案

触发条件：
- `unmatched.length > 0`
- 或 `confidence < 0.72`
- 或用户点击“联网补充”

联网补充只负责补“营养数据”，不直接改用户记录。

推荐流程：
1. 用户输入自然语言。
2. 离线引擎解析。
3. 对未匹配词条调用联网补充。
4. 返回候选食物数据。
5. 生成待确认卡片。
6. 用户确认后写入 `customFoods` 或当天记录。

返回结构建议：

```ts
type OnlineFoodCandidate = {
  name: string;
  aliases: string[];
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  defaultUnitGram: number;
  sourceUrl?: string;
  confidence: number;
};
```

缓存策略：
- 确认过的联网食物进入“我的菜单”或本地缓存。
- 未确认候选只缓存短期，例如 7 天。
- 同一关键词不要重复联网请求，避免浪费。

安全策略：
- 联网返回的热量和营养素必须做范围校验。
- 异常值不自动入库，例如 100g 食物热量大于 900 kcal。
- 来源不明时标记为“估算”。

## AI 辅助识别方案

AI 不作为主流程，只作为低置信度兜底。

适合 AI 的场景：
- 复杂口语句子：例如“吃了点楼下那家鸡肉卷，差不多一个半”。
- 多食物混合描述：例如“一碗牛肉面加两个卤蛋，汤没喝完”。
- 图片识别食物。
- OCR 识别营养成分表。
- 地方菜、品牌食品、外卖新品。

不建议交给 AI 的场景：
- 常见食物名匹配。
- 明确克重计算。
- 已有本地库能确定的食物。
- 已经确认过的我的菜单食物。

AI 输出必须是结构化 JSON，不允许直接写入记录：

```ts
type AiFoodParseResult = {
  meal: "breakfast" | "lunch" | "dinner" | "snack" | "unknown";
  items: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    estimatedGrams?: number;
    calories?: number;
    proteinG?: number;
    fatG?: number;
    carbsG?: number;
    confidence: number;
    reason: string;
  }>;
  needsUserConfirmation: boolean;
};
```

推荐提示词原则：
- 只抽取饮食信息，不给健康建议。
- 不确定时必须降低置信度。
- 不允许凭空编造品牌营养数据。
- 如果是估算值，必须标记 reason。

## UI 交互建议

低置信度时不要直接记账，显示确认卡：

```text
我识别为：
早餐：猪肉大葱馅儿水饺 16个，约400g，约880 kcal

[确认] [修改]
```

确认后：
- 当天记录写入实际摄入。
- 如果是新食物，询问是否加入“我的菜单”。

## 后续实现顺序

1. 给离线引擎加单元测试。
2. UI 增加识别结果确认卡。
3. 联网补充改为候选结果，不直接记账。
4. 确认后写入我的菜单。
5. 接入 AI OCR / NLP，只处理低置信度场景。
