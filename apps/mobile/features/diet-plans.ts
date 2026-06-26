/**
 * 饮食健身方案模板库
 * 4 大类 13 个方案，供用户在「更多」页选择套用
 */

export type DietPlanCategory = "carb" | "fasting" | "balanced" | "niche";

export type DietPlan = {
  id: string;
  category: DietPlanCategory;
  name: string;
  /** 一句话核心逻辑，列表页展示 */
  tagline: string;
  /** 核心逻辑详述 */
  logic: string;
  /** 怎么吃 */
  howToEat: string;
  /** 优点 */
  pros: string[];
  /** 缺点 */
  cons: string[];
  /** 适合人群 */
  suitableFor: string;
};

export const dietPlanCategoryLabels: Record<DietPlanCategory, string> = {
  carb: "碳水调控类",
  fasting: "时间限制性断食",
  balanced: "均衡健康类",
  niche: "小众短期减脂"
};

export const dietPlans: DietPlan[] = [
  // ===== 碳水调控类 =====
  {
    id: "balanced-high-carb",
    category: "carb",
    name: "均衡高碳饮食法",
    tagline: "碳水 45-60%，蛋白足量、脂肪适度压低",
    logic: "碳水供能占每日总热量 45%~60%，蛋白质足量、脂肪适度压低，三大营养素均衡偏高碳。",
    howToEat: "主食以糙米、燕麦、红薯、米饭为主，三餐都安排主食；蛋白质 1.6~2.2g/kg 体重，少油烹饪。",
    pros: ["训练精力足、不掉力量", "不容易暴食", "保护基础代谢"],
    cons: ["减脂速度偏慢", "必须严格控制总热量", "吃多容易热量超标"],
    suitableFor: "力量训练爱好者、学生上班族、减脂新手、怕冷、代谢偏低人群"
  },
  {
    id: "carb-cycling",
    category: "carb",
    name: "碳循环饮食法",
    tagline: "训练日高碳、休息日低碳，周期性调整",
    logic: "根据训练强度安排碳水，训练日高碳、休息日中低碳，通过周期性调整碳水，既保证训练表现，又防止代谢适应停滞。",
    howToEat: "周循环：3 天高碳 + 2 天中碳 + 2 天低碳。高碳日碳水 4~6g/kg，低碳日 1.5~2.5g/kg，蛋白质全天统一。",
    pros: ["减脂不乏力", "不容易平台期", "最大限度保住肌肉"],
    cons: ["需要精准计算热量和营养素", "操作繁琐", "不适合懒人"],
    suitableFor: "有一定健身基础、减脂遇到平台、不想掉肌肉的力量训练者"
  },
  {
    id: "low-carb",
    category: "carb",
    name: "低碳饮食法",
    tagline: "碳水 20-40%，拉高蛋白、适量优质脂肪",
    logic: "碳水供能 20%~40%，拉高蛋白质、适量优质脂肪，大幅度减少精米白面甜食。",
    howToEat: "主食少量放在早餐或训练后，大量蔬菜 + 鸡胸肉、鱼虾、牛肉、鸡蛋。",
    pros: ["饱腹感强、控饿效果好", "掉秤速度快", "胰岛素平稳", "水肿下降明显"],
    cons: ["训练无力", "情绪容易烦躁", "长期低碳容易脱发、姨妈紊乱（女生）"],
    suitableFor: "大基数体重、久坐少运动、爱吃甜食容易暴饮暴食人群"
  },
  {
    id: "keto",
    category: "carb",
    name: "生酮饮食",
    tagline: "每日碳水 20-50g，高脂高蛋白供能",
    logic: "每日总碳水 20~50g 以内，几乎戒掉所有主食，依靠高脂肪 + 高蛋白供能，让身体燃烧脂肪产生酮体供能。",
    howToEat: "五花肉、肥牛、牛油果、橄榄油、鸡蛋、绿叶菜，杜绝米面糖、豆类、大部分水果。",
    pros: ["极强饱腹感", "前期掉秤速度极快", "抑制食欲"],
    cons: ["初期酮流感（乏力、头晕、便秘口臭）", "很难长期坚持", "反弹风险高", "不适合肝肾不好、孕妇、青少年"],
    suitableFor: "小基数短期冲刺刷脂、顽固性肥胖、胰岛素抵抗人群"
  },
  {
    id: "carb-backloading",
    category: "carb",
    name: "碳水后置饮食法",
    tagline: "白天少吃主食，训练后晚餐集中摄入碳水",
    logic: "白天尽量少吃主食，把全天大部分碳水放在力量训练之后的晚餐摄入。训练后胰岛素敏感性最高，碳水优先用来恢复肌肉糖原，不容易转化成脂肪储存。",
    howToEat: "白天蛋白质 + 蔬菜 + 少量脂肪，训练后晚餐摄入全天大部分碳水（米饭、红薯、燕麦等）。",
    pros: ["保留训练状态", "腹部不容易堆积脂肪", "适合晚上训练的上班族"],
    cons: ["白天容易饥饿、乏力", "早起空腹有氧人群不友好"],
    suitableFor: "晚上训练的上班族、想保肌肉又控体脂的人群"
  },
  {
    id: "slow-carb",
    category: "carb",
    name: "慢碳饮食法",
    tagline: "精制碳水全替换为低 GI 粗粮，不算热量",
    logic: "不刻意减少碳水总量，只把精制碳水（白米饭、面条、糕点、含糖饮料）全部替换为低 GI 粗粮慢碳。",
    howToEat: "可选主食：燕麦、糙米、藜麦、玉米、红薯、山药、杂豆。",
    pros: ["不用计算热量，上手最简单", "血糖平稳", "不容易馋甜食"],
    cons: ["减脂速度温和", "必须戒掉所有精加工甜食饮料才会见效"],
    suitableFor: "懒人减脂、日常不怎么健身，只想健康慢慢瘦的人"
  },

  // ===== 时间限制性断食 =====
  {
    id: "if-16-8",
    category: "fasting",
    name: "16+8 间歇性轻断食",
    tagline: "8 小时进食窗，16 小时空腹，热度第一",
    logic: "一天 24 小时里，只在连续 8 小时内吃完所有食物，剩下 16 小时只喝无糖液体（水、黑咖啡、无糖茶）。",
    howToEat: "常见吃法：10:00-18:00 进食，其余时间空腹。",
    pros: ["操作最简单，不用算三大营养素", "自然压缩总进食量", "改善胰岛素抵抗", "省时省事"],
    cons: ["空腹时间长容易饥饿、低血糖", "不适合三餐不规律、胃病、低血糖、女生生理期"],
    suitableFor: "上班族、懒人减脂、爱吃宵夜人群"
  },
  {
    id: "if-5-2",
    category: "fasting",
    name: "5+2 轻断食",
    tagline: "5 天正常吃，2 天低热量（男≤600/女≤500）",
    logic: "一周 5 天正常均衡饮食，不需要刻意节食；剩余 2 天非连续日低热量进食（男性≤600 大卡，女性≤500 大卡）。",
    howToEat: "5 天正常均衡饮食；2 天非连续低热量日，男≤600 kcal / 女≤500 kcal。",
    pros: ["不用压缩每日吃饭时间", "社交聚餐更容易坚持", "对代谢伤害小"],
    cons: ["断食日容易饥饿乏力", "需要简单控制热量"],
    suitableFor: "经常聚餐、无法固定吃饭时间、上班族"
  },
  {
    id: "if-alt-day",
    category: "fasting",
    name: "隔日断食",
    tagline: "一天正常吃，下一天 300-500 kcal 或全断",
    logic: "一天正常吃，下一天只吃 300~500 大卡或者全天只喝水。",
    howToEat: "交替进行：正常日随意，断食日 300-500 kcal 或仅喝水。",
    pros: ["减脂速度最快"],
    cons: ["执行难度极高", "极易暴食、乏力掉肌肉", "只适合短期冲刺，不推荐长期"],
    suitableFor: "短期冲刺减脂、意志力极强的人群"
  },

  // ===== 均衡健康类 =====
  {
    id: "high-protein-balanced",
    category: "balanced",
    name: "高蛋白均衡饮食",
    tagline: "蛋白 1.8-2.2g/kg，三餐均衡少油少糖，新手万能",
    logic: "蛋白质拉满（1.8~2.2g/kg 体重），碳水、脂肪合理分配，三餐均衡，少油少糖。",
    howToEat: "三餐均衡，每餐都含优质蛋白（鸡胸、鱼、蛋、奶、豆制品），主食粗细搭配，少油少糖烹饪。",
    pros: ["容错率最高", "不伤代谢", "保肌肉", "不容易反弹", "几乎没有禁忌人群"],
    cons: ["减脂速度平缓", "需要长期坚持"],
    suitableFor: "几乎所有人群，尤其是减脂新手、怕反弹、追求健康的人群"
  },
  {
    id: "mediterranean",
    category: "balanced",
    name: "地中海饮食",
    tagline: "全球公认最健康，蔬果全谷深海鱼坚果橄榄油",
    logic: "大量蔬果、全谷物、深海鱼、坚果、橄榄油，少量红肉。全球公认最健康饮食模式。",
    howToEat: "每天大量蔬菜水果 + 全谷物主食 + 深海鱼每周 2-3 次 + 坚果一把 + 橄榄油烹饪，红肉少量。",
    pros: ["抗炎", "保护心血管", "养胃", "适合长期生活化减脂"],
    cons: ["减脂速度慢", "偏向健康塑形而非快速掉秤"],
    suitableFor: "追求长期健康、心血管亚健康、中老年人群、生活化减脂"
  },

  // ===== 小众短期减脂 =====
  {
    id: "paleo",
    category: "niche",
    name: "原始人饮食",
    tagline: "戒精加工/谷物/乳制品/豆类，只吃肉蛋鱼蔬果坚果",
    logic: "戒掉所有精加工食品、谷物、乳制品、豆类，只吃肉类、蛋类、鱼虾、蔬菜、坚果、低糖水果。",
    howToEat: "允许：肉、蛋、鱼虾、蔬菜、坚果、低糖水果；禁止：精加工食品、谷物、乳制品、豆类。",
    pros: ["戒精加工食品", "适合麸质乳糖不耐", "减少炎症水肿"],
    cons: ["饮食选择受限", "社交不便", "长期执行难度中等"],
    suitableFor: "麸质乳糖不耐、容易炎症水肿肥胖人群"
  },
  {
    id: "military-3day",
    category: "niche",
    name: "3 日军人饮食",
    tagline: "3 天严格极低热量固定食谱，快速脱水掉秤",
    logic: "3 天严格极低热量饮食，搭配固定食谱快速脱水掉秤，属于短期应急减脂，不能长期做，极易反弹。",
    howToEat: "3 天固定食谱（冰激凌、热狗、金枪鱼、鸡蛋等组合），每日约 1000-1400 kcal，之后恢复正常饮食。",
    pros: ["3 天快速掉秤", "食谱固定不用动脑"],
    cons: ["极易反弹", "营养不均衡", "不能长期执行", "主要为脱水而非减脂"],
    suitableFor: "短期应急（如婚礼前 3 天）、需要快速掉水重的人群"
  }
];

/** 按 category 分组 */
export const dietPlansByCategory: Array<{ category: DietPlanCategory; label: string; plans: DietPlan[] }> = [
  { category: "carb", label: dietPlanCategoryLabels.carb, plans: dietPlans.filter((p) => p.category === "carb") },
  { category: "fasting", label: dietPlanCategoryLabels.fasting, plans: dietPlans.filter((p) => p.category === "fasting") },
  { category: "balanced", label: dietPlanCategoryLabels.balanced, plans: dietPlans.filter((p) => p.category === "balanced") },
  { category: "niche", label: dietPlanCategoryLabels.niche, plans: dietPlans.filter((p) => p.category === "niche") }
];

export function getDietPlanById(id: string | null): DietPlan | undefined {
  if (!id) return undefined;
  return dietPlans.find((p) => p.id === id);
}
