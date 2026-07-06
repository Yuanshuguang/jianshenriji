/**
 * 中国常见食物补充数据库
 * 数据来源：《中国食物成分表》第6版标准版/普及版
 * 覆盖：早餐面点、面条米粉、粥品、八大菜系代表菜、火锅干锅、烧烤、
 *       汤类、调味料酱料、饮品、零食小吃、豆制品、腌制腊味、外卖常见、
 *       地方特色、特殊食材、主食杂粮、蔬菜补充、水果补充、甜品糖水、速食
 * 共 167 种缺失食物
 */

import type { Food, FoodCategory, CookingMethod } from "../index";

type FoodDef = [
  id: string,
  name: string,
  aliases: string[],
  category: FoodCategory,
  caloriesPer100g: number,
  proteinPer100g: number,
  fatPer100g: number,
  carbsPer100g: number,
  defaultUnitGram: number,
  units: Array<[string, number]>,
  options?: {
    cookingOilPer100g?: number;
    cookingMethod?: CookingMethod;
    foodGranularity?: "generic" | "ingredient" | "specific-food" | "prepared-dish" | "packaged-sku";
    confidenceLevel?: "high" | "reference" | "estimate";
  }
];

function makeFood(def: FoodDef): Food {
  const [id, name, aliases, category, cal, protein, fat, carbs, defaultGram, units, options] = def;
  return {
    id, name, aliases, category,
    caloriesPer100g: cal,
    proteinPer100g: protein,
    fatPer100g: fat,
    carbsPer100g: carbs,
    defaultUnitGram: defaultGram,
    servingUnits: units.map(([n, g]) => ({ name: n, grams: g })),
    source: "builtin",
    confidenceLevel: options?.confidenceLevel ?? "reference",
    cookingOilPer100g: options?.cookingOilPer100g,
    cookingMethod: options?.cookingMethod,
    foodGranularity: options?.foodGranularity,
  };
}

const defs: FoodDef[] = [
  // ========== 早餐/面点 (12种) ==========
  ["wotou", "窝头", ["窝窝头", "玉米窝头"], "staple", 227, 7.2, 1.1, 48.0, 80, [["个", 80]], { cookingMethod: "steamed", foodGranularity: "specific-food" }],
  ["jiaoquan", "焦圈", ["焦圈儿"], "snack", 388, 7.5, 14.2, 56.8, 30, [["个", 30]], { cookingMethod: "deep-fried", foodGranularity: "specific-food" }],
  ["chaogan", "炒肝", ["北京炒肝"], "dish", 165, 8.2, 6.5, 18.3, 300, [["碗", 300]], { foodGranularity: "prepared-dish" }],
  ["miancha", "面茶", ["北京面茶"], "dish", 180, 5.0, 4.5, 28.0, 300, [["碗", 300]], { foodGranularity: "prepared-dish" }],
  ["chatang", "茶汤", ["北京茶汤"], "dish", 168, 5.2, 3.8, 27.5, 300, [["碗", 300]], { foodGranularity: "prepared-dish" }],
  ["aiwowo", "艾窝窝", ["艾窝窝"], "snack", 254, 5.0, 2.5, 50.0, 30, [["个", 30]], { foodGranularity: "specific-food" }],
  ["tangerduo", "糖耳朵", ["蜜麻花", "糖耳朵"], "snack", 368, 6.5, 10.2, 60.0, 40, [["个", 40]], { cookingMethod: "deep-fried", foodGranularity: "specific-food" }],
  ["wandouhuang", "豌豆黄", ["豌豆黄儿"], "snack", 133, 7.5, 0.5, 24.5, 100, [["块", 100]], { foodGranularity: "specific-food" }],
  ["qiegao", "切糕", ["年糕切糕", "糯米切糕"], "snack", 258, 4.5, 1.0, 55.0, 100, [["块", 100]], { foodGranularity: "specific-food" }],
  ["yutougao", "芋头糕", ["芋头糕", "芋糕"], "staple", 153, 3.8, 1.5, 30.0, 150, [["块", 150]], { cookingMethod: "steamed", foodGranularity: "specific-food" }],
  ["huangjingao", "黄金糕", ["黄金糕", "蜂窝糕"], "snack", 287, 5.2, 3.8, 55.0, 80, [["块", 80]], { foodGranularity: "specific-food" }],
  ["guihuagao", "桂花糕", ["桂花糕"], "snack", 231, 4.0, 1.8, 48.0, 60, [["块", 60]], { foodGranularity: "specific-food" }],

  // ========== 面条/米粉 (7种) ==========
  ["menmian", "焖面", ["豆角焖面", "排骨焖面"], "staple", 163, 5.5, 3.2, 27.5, 300, [["碗", 350]], { cookingOilPer100g: 5, cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["guitiao", "粿条", ["粄条", "河粉粿条"], "staple", 138, 3.2, 0.8, 28.5, 200, [["碗", 250]], { foodGranularity: "ingredient" }],
  ["tudoufen", "土豆粉", ["土豆粉丝", "马铃薯粉条"], "staple", 341, 2.5, 0.5, 83.0, 100, [["份", 200]], { foodGranularity: "ingredient" }],
  ["aozaomian", "奥灶面", ["奥灶面", "昆山奥灶面"], "staple", 145, 5.0, 3.5, 22.0, 300, [["碗", 350]], { cookingOilPer100g: 6, cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["yangchunmian", "阳春面", ["阳春面", "清汤面"], "staple", 138, 4.2, 2.8, 24.0, 250, [["碗", 300]], { cookingOilPer100g: 5, cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["chezaimian", "车仔面", ["车仔面"], "staple", 155, 4.5, 3.0, 26.5, 200, [["碗", 250]], { cookingOilPer100g: 4, cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["gongzaimian", "公仔面", ["公仔面", "香港公仔面"], "fastfood", 472, 9.0, 21.0, 61.0, 100, [["包", 100]], { foodGranularity: "packaged-sku" }],

  // ========== 粥品 (8种) ==========
  ["hongshuzhou", "红薯粥", ["地瓜粥", "红薯小米粥"], "staple", 58, 1.2, 0.2, 12.5, 300, [["碗", 300]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["lvdouzhou", "绿豆粥", ["绿豆粥", "绿豆稀饭"], "staple", 65, 2.0, 0.3, 13.5, 300, [["碗", 300]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["gouqizhou", "枸杞粥", ["枸杞粥", "枸杞小米粥"], "staple", 62, 1.5, 0.3, 13.0, 300, [["碗", 300]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["yinerzhou", "银耳粥", ["银耳粥", "白木耳粥"], "staple", 45, 0.8, 0.2, 10.5, 300, [["碗", 300]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["yanmaizhou", "燕麦粥", ["燕麦粥", "麦片粥"], "staple", 72, 2.5, 1.2, 13.0, 300, [["碗", 300]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["yumizhou", "玉米粥", ["玉米粥", "玉米糁粥"], "staple", 56, 1.5, 0.3, 12.0, 300, [["碗", 300]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["shanyaozhou", "山药粥", ["山药粥", "淮山粥"], "staple", 60, 1.3, 0.2, 13.5, 300, [["碗", 300]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["lianzizhou", "莲子粥", ["莲子粥", "莲子小米粥"], "staple", 63, 1.8, 0.3, 13.5, 300, [["碗", 300]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],

  // ========== 川菜 (7种) ==========
  ["suannibaairou", "蒜泥白肉", ["蒜泥白肉"], "dish", 248, 14.5, 18.0, 6.5, 200, [["份", 200], ["盘", 250]], { cookingOilPer100g: 8, cookingMethod: "cold-mixed", foodGranularity: "prepared-dish" }],
  ["zhangchaya", "樟茶鸭", ["樟茶鸭", "樟茶鸭子"], "dish", 265, 16.0, 20.0, 3.5, 300, [["份", 300]], { cookingMethod: "smoked", foodGranularity: "prepared-dish" }],
  ["dongpozhouzi", "东坡肘子", ["东坡肘子"], "dish", 295, 17.0, 23.0, 5.0, 300, [["份", 350]], { cookingMethod: "braised", foodGranularity: "prepared-dish" }],
  ["mayishangshu", "蚂蚁上树", ["蚂蚁上树", "肉末粉丝"], "dish", 196, 8.5, 10.5, 18.0, 250, [["份", 250]], { cookingOilPer100g: 10, cookingMethod: "stir-fried", foodGranularity: "prepared-dish" }],
  ["chuanchuanxiang", "串串香", ["串串", "冷锅串串"], "dish", 185, 9.0, 11.0, 14.0, 300, [["份", 300], ["串", 25]], { cookingOilPer100g: 8, cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["lengchitu", "冷吃兔", ["冷吃兔", "自贡冷吃兔"], "dish", 228, 18.0, 15.0, 4.5, 200, [["份", 200]], { cookingOilPer100g: 10, cookingMethod: "stir-fried", foodGranularity: "prepared-dish" }],
  ["tutou", "兔头", ["麻辣兔头", "兔头"], "dish", 185, 15.0, 12.0, 3.5, 100, [["个", 100]], { cookingOilPer100g: 8, cookingMethod: "braised", foodGranularity: "prepared-dish" }],

  // ========== 粤菜 (4种) ==========
  ["laohuoliangtang", "老火靓汤", ["老火汤", "煲汤"], "dish", 55, 3.5, 2.5, 4.5, 400, [["碗", 400]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["qingzhengluyu", "清蒸鲈鱼", ["清蒸鲈鱼"], "dish", 118, 18.5, 4.0, 0.5, 350, [["条", 500], ["份", 350]], { cookingOilPer100g: 3, cookingMethod: "steamed", foodGranularity: "prepared-dish" }],
  ["gulurou", "咕噜肉", ["咕噜肉", "咕老肉", "菠萝咕噜肉"], "dish", 228, 11.0, 12.0, 20.0, 250, [["份", 250]], { cookingOilPer100g: 12, cookingMethod: "deep-fried", foodGranularity: "prepared-dish" }],
  ["luoboniunai", "萝卜牛腩", ["萝卜牛腩", "牛腩萝卜"], "dish", 165, 12.0, 9.5, 6.0, 300, [["份", 300]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],

  // ========== 鲁菜 (9种) ==========
  ["tangculiyu", "糖醋鲤鱼", ["糖醋鲤鱼", "糖醋鱼"], "dish", 195, 16.5, 9.5, 10.0, 500, [["条", 600], ["份", 350]], { cookingOilPer100g: 10, cookingMethod: "deep-fried", foodGranularity: "prepared-dish" }],
  ["jiuzhuandachang", "九转大肠", ["九转大肠"], "dish", 285, 12.0, 23.0, 8.0, 200, [["份", 200]], { cookingOilPer100g: 12, cookingMethod: "braised", foodGranularity: "prepared-dish" }],
  ["congshaohaishen", "葱烧海参", ["葱烧海参"], "dish", 105, 8.5, 3.5, 8.0, 200, [["份", 200]], { cookingOilPer100g: 8, cookingMethod: "stir-fried", foodGranularity: "prepared-dish" }],
  ["youmendaxia", "油焖大虾", ["油焖大虾", "油焖虾"], "dish", 168, 14.0, 8.5, 6.0, 300, [["份", 300]], { cookingOilPer100g: 10, cookingMethod: "braised", foodGranularity: "prepared-dish" }],
  ["yipindoufu", "一品豆腐", ["一品豆腐"], "dish", 142, 10.5, 7.0, 8.5, 250, [["份", 250]], { cookingOilPer100g: 8, cookingMethod: "steamed", foodGranularity: "prepared-dish" }],
  ["muxurou", "木须肉", ["木须肉", "木樨肉"], "dish", 175, 10.0, 11.0, 8.0, 250, [["份", 250]], { cookingOilPer100g: 10, cookingMethod: "stir-fried", foodGranularity: "prepared-dish" }],
  ["dezhoubaji", "德州扒鸡", ["德州扒鸡", "扒鸡"], "dish", 215, 22.0, 13.0, 2.0, 300, [["只", 500], ["份", 300]], { cookingMethod: "braised", foodGranularity: "prepared-dish" }],
  ["sixiwanzi", "四喜丸子", ["四喜丸子", "红烧狮子头"], "dish", 245, 13.0, 18.0, 8.0, 200, [["个", 100], ["份", 300]], { cookingOilPer100g: 8, cookingMethod: "braised", foodGranularity: "prepared-dish" }],
  ["jianggutou", "酱骨架", ["酱骨架", "大骨肉"], "dish", 198, 16.0, 14.0, 2.5, 350, [["份", 350]], { cookingMethod: "braised", foodGranularity: "prepared-dish" }],

  // ========== 苏菜 (7种) ==========
  ["songshiguiyu", "松鼠桂鱼", ["松鼠桂鱼", "松鼠鱼"], "dish", 228, 16.5, 12.0, 13.0, 500, [["条", 600], ["份", 350]], { cookingOilPer100g: 15, cookingMethod: "deep-fried", foodGranularity: "prepared-dish" }],
  ["shizitou", "狮子头", ["狮子头", "蟹粉狮子头"], "dish", 265, 12.5, 21.0, 6.5, 100, [["个", 100], ["份", 300]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["biluoxiaren", "碧螺虾仁", ["碧螺虾仁", "碧螺春虾仁"], "dish", 128, 14.5, 5.5, 4.5, 200, [["份", 200]], { cookingOilPer100g: 6, cookingMethod: "stir-fried", foodGranularity: "prepared-dish" }],
  ["xiefenshizitou", "蟹粉狮子头", ["蟹粉狮子头", "蟹黄狮子头"], "dish", 278, 13.0, 22.5, 6.0, 100, [["个", 100], ["份", 300]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["wensidoufu", "文思豆腐", ["文思豆腐"], "dish", 85, 6.5, 4.0, 5.0, 250, [["碗", 250]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["dazhugansi", "大煮干丝", ["大煮干丝", "鸡汁煮干丝"], "dish", 128, 10.0, 6.5, 6.0, 250, [["份", 250]], { cookingOilPer100g: 5, cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["santaoya", "三套鸭", ["三套鸭"], "dish", 198, 16.0, 13.5, 3.0, 500, [["份", 500]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],

  // ========== 浙菜 (5种) ==========
  ["xihucuyu", "西湖醋鱼", ["西湖醋鱼", "糖醋草鱼"], "dish", 132, 15.5, 5.5, 6.0, 500, [["条", 600], ["份", 350]], { cookingOilPer100g: 5, cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["longjingxiaren", "龙井虾仁", ["龙井虾仁"], "dish", 125, 15.0, 5.0, 3.5, 200, [["份", 200]], { cookingOilPer100g: 5, cookingMethod: "stir-fried", foodGranularity: "prepared-dish" }],
  ["ganzhaxiangling", "干炸响铃", ["干炸响铃", "响铃"], "dish", 285, 12.0, 20.0, 17.0, 150, [["份", 150]], { cookingOilPer100g: 15, cookingMethod: "deep-fried", foodGranularity: "prepared-dish" }],
  ["heyefenzhengrou", "荷叶粉蒸肉", ["荷叶粉蒸肉", "粉蒸肉"], "dish", 235, 11.5, 16.0, 12.0, 250, [["份", 250]], { cookingMethod: "steamed", foodGranularity: "prepared-dish" }],
  ["songsaoyugeng", "宋嫂鱼羹", ["宋嫂鱼羹", "鱼羹"], "dish", 88, 8.0, 3.5, 6.0, 300, [["碗", 300]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],

  // ========== 闽菜 (6种) ==========
  ["fotiaoqiang", "佛跳墙", ["佛跳墙", "福寿全"], "dish", 185, 14.0, 11.0, 6.0, 300, [["盅", 300], ["份", 300]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["lizhirou", "荔枝肉", ["荔枝肉"], "dish", 248, 11.0, 14.0, 20.0, 250, [["份", 250]], { cookingOilPer100g: 12, cookingMethod: "deep-fried", foodGranularity: "prepared-dish" }],
  ["zuipaigu", "醉排骨", ["醉排骨"], "dish", 235, 13.0, 15.0, 12.0, 250, [["份", 250]], { cookingOilPer100g: 10, cookingMethod: "deep-fried", foodGranularity: "prepared-dish" }],
  ["hailijian", "海蛎煎", ["海蛎煎", "蚵仔煎"], "dish", 175, 10.5, 10.0, 10.0, 200, [["份", 200]], { cookingOilPer100g: 10, cookingMethod: "pan-fried", foodGranularity: "prepared-dish" }],
  ["shachamian", "沙茶面", ["沙茶面"], "staple", 165, 7.0, 6.0, 18.5, 300, [["碗", 350]], { cookingOilPer100g: 6, cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["tusundong", "土笋冻", ["土笋冻", "星虫冻"], "snack", 65, 6.5, 1.5, 6.0, 100, [["份", 100]], { cookingMethod: "boiled", foodGranularity: "specific-food" }],

  // ========== 湘菜 (6种) ==========
  ["duojiaoyutou", "剁椒鱼头", ["剁椒鱼头"], "dish", 128, 13.0, 6.5, 5.0, 500, [["份", 500]], { cookingOilPer100g: 8, cookingMethod: "steamed", foodGranularity: "prepared-dish" }],
  ["laweihezheng", "腊味合蒸", ["腊味合蒸"], "dish", 295, 16.0, 23.0, 5.0, 250, [["份", 250]], { cookingMethod: "steamed", foodGranularity: "prepared-dish" }],
  ["xiaochaohuangniurou", "小炒黄牛肉", ["小炒黄牛肉", "小炒牛肉"], "dish", 185, 16.0, 11.0, 5.5, 250, [["份", 250]], { cookingOilPer100g: 10, cookingMethod: "stir-fried", foodGranularity: "prepared-dish" }],
  ["xuebaya", "血粑鸭", ["血粑鸭", "洪江鸭"], "dish", 248, 14.0, 18.0, 8.0, 300, [["份", 300]], { cookingOilPer100g: 10, cookingMethod: "braised", foodGranularity: "prepared-dish" }],
  ["donganji", "东安鸡", ["东安鸡", "东安子鸡"], "dish", 165, 16.0, 9.5, 4.0, 300, [["份", 300]], { cookingOilPer100g: 8, cookingMethod: "stir-fried", foodGranularity: "prepared-dish" }],
  ["kouweixia", "口味虾", ["口味虾", "长沙口味虾"], "dish", 155, 14.5, 7.0, 6.5, 500, [["份", 500]], { cookingOilPer100g: 10, cookingMethod: "stir-fried", foodGranularity: "prepared-dish" }],

  // ========== 徽菜 (4种) ==========
  ["chouguiyu", "臭鳜鱼", ["臭鳜鱼", "腌鲜鳜鱼"], "dish", 175, 17.0, 9.5, 3.0, 500, [["条", 600], ["份", 350]], { cookingOilPer100g: 8, cookingMethod: "braised", foodGranularity: "prepared-dish" }],
  ["maodoufu", "毛豆腐", ["毛豆腐", "徽州毛豆腐"], "dish", 128, 9.5, 6.0, 6.5, 150, [["份", 150]], { cookingOilPer100g: 8, cookingMethod: "pan-fried", foodGranularity: "prepared-dish" }],
  ["huangshandunge", "黄山炖鸽", ["黄山炖鸽", "炖鸽"], "dish", 168, 17.5, 9.0, 2.0, 300, [["份", 300]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["huotuidunjiayu", "火腿炖甲鱼", ["火腿炖甲鱼", "甲鱼炖火腿"], "dish", 152, 14.0, 8.5, 4.0, 300, [["份", 300]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],

  // ========== 火锅/干锅 (9种) ==========
  ["echang", "鹅肠", ["鹅肠", "火锅鹅肠"], "protein", 98, 10.5, 3.5, 4.0, 100, [["份", 100]], { cookingMethod: "boiled", foodGranularity: "ingredient" }],
  ["qingtanghuoguo", "清汤火锅", ["清汤火锅", "清汤锅底"], "dish", 35, 1.5, 1.0, 5.0, 500, [["锅", 1000]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["fanqieguo", "番茄锅", ["番茄锅底", "番茄火锅"], "dish", 48, 1.2, 0.8, 9.0, 500, [["锅", 1000]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["juntangguo", "菌汤锅", ["菌汤锅底", "菌菇火锅"], "dish", 42, 1.8, 0.5, 7.5, 500, [["锅", 1000]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["galiguo", "咖喱锅", ["咖喱锅底", "咖喱火锅"], "dish", 85, 2.5, 3.5, 11.0, 500, [["锅", 1000]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["guanguxia", "干锅虾", ["干锅虾", "香辣干锅虾"], "dish", 175, 12.0, 10.0, 8.0, 300, [["份", 300]], { cookingOilPer100g: 12, cookingMethod: "stir-fried", foodGranularity: "prepared-dish" }],
  ["guanguobaocai", "干锅包菜", ["干锅包菜", "干锅卷心菜"], "dish", 125, 3.0, 8.5, 10.0, 250, [["份", 250]], { cookingOilPer100g: 10, cookingMethod: "stir-fried", foodGranularity: "prepared-dish" }],
  ["guanguopaigu", "干锅排骨", ["干锅排骨", "香辣干锅排骨"], "dish", 235, 14.0, 16.0, 8.0, 300, [["份", 300]], { cookingOilPer100g: 12, cookingMethod: "stir-fried", foodGranularity: "prepared-dish" }],
  ["qingyouhuoguo", "清油火锅", ["清油火锅", "清油锅底"], "dish", 120, 1.5, 8.0, 8.0, 500, [["锅", 1000]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],

  // ========== 烧烤 (2种) ==========
  ["kaonaohua", "烤脑花", ["烤脑花", "锡纸脑花"], "dish", 148, 11.0, 10.5, 2.0, 100, [["个", 100]], { cookingOilPer100g: 8, cookingMethod: "roasted", foodGranularity: "prepared-dish" }],
  ["kaojizhua", "烤鸡爪", ["烤鸡爪", "烧烤鸡爪"], "snack", 185, 15.0, 13.0, 2.0, 50, [["个", 50]], { cookingOilPer100g: 6, cookingMethod: "roasted", foodGranularity: "prepared-dish" }],

  // ========== 汤类 (12种) ==========
  ["paigulianoutang", "排骨莲藕汤", ["排骨莲藕汤", "莲藕排骨汤"], "dish", 95, 7.0, 5.5, 4.0, 350, [["碗", 350]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["yumipaigutang", "玉米排骨汤", ["玉米排骨汤"], "dish", 78, 5.5, 3.5, 6.0, 350, [["碗", 350]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["huashengzhujiaotang", "花生猪脚汤", ["花生猪脚汤", "猪脚花生汤"], "dish", 168, 10.0, 12.0, 4.5, 350, [["碗", 350]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["jiyudoufutang", "鲫鱼豆腐汤", ["鲫鱼豆腐汤", "鱼头豆腐汤"], "dish", 72, 8.5, 3.0, 2.0, 350, [["碗", 350]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["laoyatang", "老鸭汤", ["老鸭汤", "鸭汤"], "dish", 85, 7.5, 4.5, 3.0, 350, [["碗", 350]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["yangroutang", "羊肉汤", ["羊肉汤", "羊汤"], "dish", 92, 6.5, 6.0, 2.5, 350, [["碗", 350]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["niuroutang", "牛肉汤", ["牛肉汤", "清汤牛肉"], "dish", 78, 7.0, 4.0, 3.5, 350, [["碗", 350]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["gedatang", "疙瘩汤", ["疙瘩汤", "面疙瘩汤"], "dish", 85, 4.0, 2.5, 12.0, 300, [["碗", 300]], { cookingOilPer100g: 4, cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["siguatang", "丝瓜汤", ["丝瓜汤", "丝瓜蛋汤"], "dish", 35, 2.0, 1.0, 5.0, 300, [["碗", 300]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["haidaipaigutang", "海带排骨汤", ["海带排骨汤"], "dish", 68, 5.0, 3.0, 5.0, 350, [["碗", 350]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["wujitang", "乌鸡汤", ["乌鸡汤", "乌鸡滋补汤"], "dish", 88, 8.0, 4.5, 3.0, 350, [["碗", 350]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],
  ["jiaoyutang", "甲鱼汤", ["甲鱼汤", "老鳖汤"], "dish", 98, 9.5, 5.0, 2.0, 350, [["碗", 350]], { cookingMethod: "stewed", foodGranularity: "prepared-dish" }],

  // ========== 调味料/酱料 (16种) ==========
  ["tianmianjiang", "甜面酱", ["甜面酱", "甜酱"], "supplement", 136, 5.5, 0.8, 28.0, 15, [["勺", 15]], { foodGranularity: "ingredient" }],
  ["suanrongjiang", "蒜蓉酱", ["蒜蓉酱", "蒜蓉辣椒酱"], "supplement", 98, 3.5, 1.0, 18.0, 15, [["勺", 15]], { foodGranularity: "ingredient" }],
  ["shachajiang", "沙茶酱", ["沙茶酱", "沙爹酱"], "supplement", 348, 8.0, 28.0, 18.0, 15, [["勺", 15]], { foodGranularity: "packaged-sku" }],
  ["zhuhoujiang", "柱候酱", ["柱候酱"], "supplement", 168, 8.0, 2.0, 30.0, 15, [["勺", 15]], { foodGranularity: "packaged-sku" }],
  ["chaoshaojiang", "叉烧酱", ["叉烧酱"], "supplement", 198, 4.0, 1.5, 42.0, 15, [["勺", 15]], { foodGranularity: "packaged-sku" }],
  ["haixianjiang", "海鲜酱", ["海鲜酱"], "supplement", 168, 5.0, 1.0, 35.0, 15, [["勺", 15]], { foodGranularity: "packaged-sku" }],
  ["xojiang", "XO酱", ["XO酱", "XO海鲜酱"], "supplement", 235, 12.0, 15.0, 12.0, 15, [["勺", 15]], { foodGranularity: "packaged-sku" }],
  ["furu", "腐乳", ["腐乳", "豆腐乳", "红腐乳", "白腐乳"], "supplement", 135, 12.0, 5.5, 4.5, 15, [["块", 15]], { cookingMethod: "pickled", foodGranularity: "ingredient" }],
  ["shengchou", "生抽", ["生抽", "生抽酱油"], "supplement", 63, 8.0, 0.6, 4.8, 5, [["勺", 5]], { foodGranularity: "ingredient" }],
  ["laochou", "老抽", ["老抽", "老抽酱油"], "supplement", 78, 6.5, 0.5, 10.0, 5, [["勺", 5]], { foodGranularity: "ingredient" }],
  ["liaojiu", "料酒", ["料酒", " cooking wine", "黄酒料酒"], "supplement", 96, 0.5, 0, 4.0, 10, [["勺", 10]], { foodGranularity: "ingredient" }],
  ["huajiaoyou", "花椒油", ["花椒油", "藤椒油"], "supplement", 884, 0, 99.5, 0, 5, [["勺", 5]], { foodGranularity: "ingredient" }],
  ["tengjiaoyou", "藤椒油", ["藤椒油", "青花椒油"], "supplement", 884, 0, 99.5, 0, 5, [["勺", 5]], { foodGranularity: "ingredient" }],
  ["jiemo", "芥末", ["芥末", "wasabi", "山葵"], "supplement", 128, 5.5, 1.5, 22.0, 5, [["勺", 5]], { foodGranularity: "ingredient" }],
  ["tianlajiang", "甜辣酱", ["甜辣酱", "泰国甜辣酱"], "supplement", 152, 1.5, 0.5, 34.0, 15, [["勺", 15]], { foodGranularity: "packaged-sku" }],
  ["wuxiangfen", "五香粉", ["五香粉", "十三香"], "supplement", 256, 12.0, 6.0, 55.0, 2, [["勺", 2]], { foodGranularity: "ingredient" }],

  // ========== 饮品 (11种) ==========
  ["hetaonai", "核桃奶", ["核桃奶", "核桃牛奶"], "drink", 64, 2.0, 1.8, 9.5, 250, [["盒", 250]], { foodGranularity: "packaged-sku" }],
  ["xingrenlu", "杏仁露", ["杏仁露", "露露杏仁露"], "drink", 56, 1.5, 1.2, 10.0, 245, [["罐", 245]], { foodGranularity: "packaged-sku" }],
  ["huashengniunai", "花生牛奶", ["花生牛奶", "花生奶"], "drink", 68, 2.0, 1.5, 11.0, 245, [["罐", 245]], { foodGranularity: "packaged-sku" }],
  ["meinianda", "美年达", ["美年达", "芬达"], "drink", 43, 0, 0, 10.8, 330, [["瓶", 330]], { foodGranularity: "packaged-sku" }],
  ["beibingyang", "北冰洋", ["北冰洋", "北冰洋汽水"], "drink", 42, 0, 0, 10.5, 330, [["瓶", 330]], { foodGranularity: "packaged-sku" }],
  ["jianlibao", "健力宝", ["健力宝"], "drink", 45, 0, 0, 11.2, 330, [["罐", 330]], { foodGranularity: "packaged-sku" }],
  ["binglvcha", "冰绿茶", ["冰绿茶", "统一冰绿茶"], "drink", 38, 0, 0, 9.5, 500, [["瓶", 500]], { foodGranularity: "packaged-sku" }],
  ["longjingcha", "龙井茶", ["龙井茶", "西湖龙井"], "drink", 0, 0, 0, 0, 250, [["杯", 250]], { foodGranularity: "ingredient" }],
  ["huangjiu", "黄酒", ["黄酒", "绍兴黄酒", "绍兴酒"], "drink", 85, 3.5, 0.5, 8.0, 150, [["杯", 150]], { foodGranularity: "packaged-sku" }],
  ["yangmeijiu", "杨梅酒", ["杨梅酒", "浸泡杨梅酒"], "drink", 125, 0.2, 0, 15.0, 100, [["杯", 100]], { foodGranularity: "packaged-sku" }],

  // ========== 零食/小吃 (10种) ==========
  ["huamei", "话梅", ["话梅", "奶油话梅"], "snack", 256, 3.5, 2.0, 56.0, 15, [["颗", 5], ["包", 50]], { foodGranularity: "packaged-sku" }],
  ["mailisu", "麦丽素", ["麦丽素", "mylikes"], "snack", 512, 6.0, 26.0, 60.0, 10, [["颗", 10]], { foodGranularity: "packaged-sku" }],
  ["dabaitu", "大白兔", ["大白兔奶糖", "大白兔"], "snack", 420, 5.0, 12.0, 78.0, 5, [["颗", 5]], { foodGranularity: "packaged-sku" }],
  ["mimi", "咪咪", ["咪咪虾条", "咪咪"], "snack", 478, 6.5, 22.0, 60.0, 5, [["包", 5]], { foodGranularity: "packaged-sku" }],
  ["jiangmitiao", "江米条", ["江米条", "京果"], "snack", 408, 5.0, 8.0, 78.0, 20, [["根", 2], ["把", 50]], { foodGranularity: "specific-food" }],
  ["mahua", "麻花", ["麻花", "天津麻花", "什锦麻花"], "snack", 525, 7.5, 28.0, 60.0, 30, [["根", 30]], { cookingMethod: "deep-fried", foodGranularity: "specific-food" }],
  ["paicha", "排叉", ["排叉", "薄脆"], "snack", 468, 7.0, 20.0, 60.0, 10, [["片", 10]], { cookingMethod: "deep-fried", foodGranularity: "specific-food" }],
  ["sanzi", "馓子", ["馓子", "油炸馓子"], "snack", 475, 8.0, 22.0, 60.0, 20, [["把", 20]], { cookingMethod: "deep-fried", foodGranularity: "specific-food" }],
  ["maoerduo", "猫耳朵", ["猫耳朵", "油炸猫耳朵"], "snack", 435, 6.5, 18.0, 64.0, 20, [["把", 20]], { cookingMethod: "deep-fried", foodGranularity: "specific-food" }],
  ["shitoubing", "石头饼", ["石头饼", "石子馍"], "snack", 385, 8.5, 10.0, 64.0, 50, [["个", 50]], { cookingMethod: "roasted", foodGranularity: "specific-food" }],

  // ========== 豆制品 (2种) ==========
  ["meidoufu", "霉豆腐", ["霉豆腐", "毛霉豆腐"], "protein", 135, 12.0, 5.5, 4.5, 15, [["块", 15]], { cookingMethod: "pickled", foodGranularity: "ingredient" }],
  ["maodoufu-supplement", "徽州毛豆腐", ["徽州毛豆腐", "毛豆腐补充"], "protein", 128, 9.5, 6.0, 6.5, 100, [["份", 150]], { cookingOilPer100g: 8, cookingMethod: "pan-fried", foodGranularity: "prepared-dish" }],

  // ========== 腌制/腊味 (1种) ==========
  ["zaodan", "糟蛋", ["糟蛋", "糟鸡蛋"], "protein", 168, 13.0, 10.0, 5.0, 50, [["个", 50]], { cookingMethod: "pickled", foodGranularity: "specific-food" }],

  // ========== 外卖常见 (3种) ==========
  ["shaoefan", "烧鹅饭", ["烧鹅饭", "烧鹅饭"], "dish", 225, 14.0, 13.0, 12.0, 350, [["份", 350]], { cookingMethod: "roasted", foodGranularity: "prepared-dish" }],
  ["tiebanfan", "铁板饭", ["铁板饭", "铁板牛肉饭"], "dish", 195, 9.0, 8.0, 22.0, 350, [["份", 350]], { cookingOilPer100g: 8, cookingMethod: "pan-fried", foodGranularity: "prepared-dish" }],
  ["mutongfan", "木桶饭", ["木桶饭", "木桶牛肉饭"], "dish", 178, 8.0, 6.5, 22.0, 350, [["份", 350]], { cookingOilPer100g: 6, cookingMethod: "stir-fried", foodGranularity: "prepared-dish" }],

  // ========== 地方特色 (5种) ==========
  ["rouwanhulatang", "肉丸胡辣汤", ["肉丸胡辣汤", "西安胡辣汤"], "dish", 95, 5.5, 3.5, 10.0, 350, [["碗", 350]], { foodGranularity: "prepared-dish" }],
  ["zenggao", "甑糕", ["甑糕", "西安甑糕"], "snack", 215, 4.5, 1.0, 46.0, 200, [["份", 200]], { foodGranularity: "specific-food" }],
  ["remipi", "热米皮", ["热米皮", "汉中热米皮"], "dish", 155, 4.0, 4.5, 23.0, 250, [["碗", 250]], { cookingOilPer100g: 6, cookingMethod: "steamed", foodGranularity: "prepared-dish" }],
  ["caildoufu", "菜豆腐", ["菜豆腐", "汉中菜豆腐"], "dish", 68, 5.0, 2.0, 7.5, 300, [["碗", 300]], { cookingMethod: "boiled", foodGranularity: "prepared-dish" }],
  ["hetaomo", "核桃馍", ["核桃馍", "宁强核桃馍"], "staple", 342, 8.5, 12.0, 50.0, 60, [["个", 60]], { cookingMethod: "roasted", foodGranularity: "specific-food" }],

  // ========== 特殊食材 (8种) ==========
  ["gerou", "鸽肉", ["鸽肉", "鸽子肉"], "protein", 201, 16.5, 14.2, 1.7, 150, [["只", 200]], { cookingMethod: "stewed", foodGranularity: "ingredient" }],
  ["sherou", "蛇肉", ["蛇肉", "大王蛇肉"], "protein", 81, 15.7, 0.9, 5.0, 200, [["份", 200]], { foodGranularity: "ingredient" }],
  ["luotuorou", "骆驼肉", ["骆驼肉"], "protein", 160, 22.0, 7.0, 0, 200, [["份", 200]], { foodGranularity: "ingredient" }],
  ["tuoniaorou", "鸵鸟肉", ["鸵鸟肉", "鸵鸟肉"], "protein", 98, 20.5, 2.0, 0, 200, [["份", 200]], { foodGranularity: "ingredient" }],
  ["canyong", "蚕蛹", ["蚕蛹", "蚕虫"], "protein", 230, 51.0, 15.0, 6.0, 50, [["份", 50]], { cookingMethod: "deep-fried", foodGranularity: "ingredient" }],
  ["fengyong", "蜂蛹", ["蜂蛹", "蜜蜂蛹"], "protein", 168, 33.0, 6.0, 5.0, 50, [["份", 50]], { cookingMethod: "deep-fried", foodGranularity: "ingredient" }],
  ["zhuchong", "竹虫", ["竹虫", "竹蛆"], "protein", 215, 30.0, 10.0, 6.0, 30, [["份", 30]], { cookingMethod: "deep-fried", foodGranularity: "ingredient" }],
  ["zhiliaohou", "知了猴", ["知了猴", "金蝉", "爬叉"], "protein", 175, 21.0, 8.5, 4.0, 30, [["份", 30]], { cookingMethod: "deep-fried", foodGranularity: "ingredient" }],

  // ========== 主食杂粮 (3种) ==========
  ["youmian", "莜面", ["莜面", "莜麦面"], "staple", 385, 12.0, 7.0, 68.0, 100, [["份", 150]], { foodGranularity: "ingredient" }],
  ["youmiankaolaolao", "莜面栲栳栳", ["莜面栲栳栳", "莜面窝窝"], "staple", 215, 8.0, 3.5, 38.0, 150, [["份", 150]], { cookingMethod: "steamed", foodGranularity: "specific-food" }],
  ["mizimian", "糜子面", ["糜子面", "黄米面"], "staple", 348, 9.0, 3.5, 72.0, 100, [["份", 100]], { foodGranularity: "ingredient" }],

  // ========== 蔬菜补充 (2种) ==========
  ["zisu", "紫苏", ["紫苏", "紫苏叶", "苏子叶"], "vegetable", 37, 3.9, 1.3, 5.3, 10, [["把", 10]], { foodGranularity: "ingredient" }],
  ["huoxiang", "藿香", ["藿香", "藿香叶"], "vegetable", 32, 3.2, 1.0, 5.5, 10, [["把", 10]], { foodGranularity: "ingredient" }],

  // ========== 水果补充 (4种) ==========
  ["shumei", "树莓", ["树莓", "覆盆子"], "fruit", 52, 1.2, 0.7, 11.9, 100, [["把", 100]], { foodGranularity: "ingredient" }],
  ["heimei", "黑莓", ["黑莓", "黑莓"], "fruit", 43, 1.4, 0.5, 9.6, 100, [["把", 100]], { foodGranularity: "ingredient" }],
  ["emei", "鹅莓", ["鹅莓", "醋栗", "鹅莓"], "fruit", 44, 0.9, 0.6, 9.4, 100, [["把", 100]], { foodGranularity: "ingredient" }],
  ["renxinguo", "人心果", ["人心果", "人心果"], "fruit", 83, 0.4, 0.6, 19.9, 100, [["个", 100]], { foodGranularity: "ingredient" }],
  ["mangguo", "芒果", ["芒果", "mangguo", "mango", "芒果干", "芒果片"], "fruit", 60, 0.6, 0.2, 15.0, 100, [["个", 100]], { foodGranularity: "ingredient" }],
  ["xigua", "西瓜", ["西瓜", "黑美人西瓜"], "fruit", 31, 0.6, 0.2, 7.9, 100, [["块", 200], ["片", 100]], { foodGranularity: "ingredient" }],

  // ========== 甜品/糖水 (4种) ==========
  ["jiangzhuangnai", "姜撞奶", ["姜撞奶", "姜汁撞奶"], "snack", 88, 3.5, 3.0, 11.0, 200, [["碗", 200]], { foodGranularity: "prepared-dish" }],
  ["hetaohu", "核桃糊", ["核桃糊", "核桃露"], "snack", 175, 5.0, 8.0, 22.0, 200, [["碗", 200]], { foodGranularity: "prepared-dish" }],
  ["xingrenhu", "杏仁糊", ["杏仁糊", "杏仁茶"], "snack", 135, 3.5, 4.0, 20.0, 200, [["碗", 200]], { foodGranularity: "prepared-dish" }],
  ["huashenghu", "花生糊", ["花生糊", "花生汤"], "snack", 168, 5.5, 7.5, 20.0, 200, [["碗", 200]], { foodGranularity: "prepared-dish" }],

  // ========== 速食/方便食品 (1种) ==========
  ["daicangbang", "代餐棒", ["代餐棒", "能量棒", "代餐能量棒"], "supplement", 380, 20.0, 12.0, 45.0, 40, [["根", 40]], { foodGranularity: "packaged-sku" }],
];

export const chineseSupplementFoods: Food[] = defs.map(makeFood);
