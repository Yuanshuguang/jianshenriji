export * from "./design-tokens";
export * from "./dynamic-plan-engine";
export * from "./data/diet-plan-database";
export * from "./data/training-diet-rules";
import { categoryFallbackFoods } from "./data/category-fallback-foods";
import { csvGeneratedFoods } from "./data/curated-foods";

export type Gender = "male" | "female";
export type MuscleGroup = "chest" | "back" | "legs" | "shoulders" | "arms" | "core" | "cardio";

export type NutritionTotals = {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

export type FoodCategory =
  | "staple"
  | "protein"
  | "vegetable"
  | "fruit"
  | "snack"
  | "drink"
  | "dish"
  | "fastfood"
  | "supplement";

export type ServingUnit = {
  name: string;
  grams: number;
  aliases?: string[];
};

export type Food = {
  id: string;
  name: string;
  aliases: string[];
  category: FoodCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  defaultUnitGram: number;
  servingUnits?: ServingUnit[];
  source?: "builtin" | "custom" | "online";
  confidenceLevel?: "high" | "reference" | "estimate";
};

export type FoodConfidenceLevel = "high" | "reference" | "estimate";

export type FoodPortion = {
  foodId: string;
  name: string;
  grams: number;
  totals: NutritionTotals;
  meal?: "breakfast" | "lunch" | "dinner" | "snack";
};

export type EnergyPlan = NutritionTotals & {
  bmr: number;
  tdee: number;
  dailyDeficit: number;
};

export type DailyLogEntry = {
  date: string;
  targetCalories: number;
  actualIntake: NutritionTotals;
  actualFoodText: string;
  actualMealTexts: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snack: string;
  };
  training: {
    status: "done" | "missed" | "pending" | "changed";
    text: string;
    minutes: number;
    calories: number;
    fatigue: number;
  };
  isComplete: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  aliases: string[];
  primaryMuscleGroup: MuscleGroup;
  equipment: string[];
  met: number;
};

export type TrainingPlanItem = {
  exerciseId: string;
  sets: number;
  reps: string;
  minutes: number;
};

export type WorkoutPlan = {
  id: string;
  title: string;
  focus: MuscleGroup;
  estimatedMinutes: number;
  exercises: TrainingPlanItem[];
};

export const bodyShapeOptions = [
  { id: "flat-belly", label: "腹部变平" },
  { id: "slight-line", label: "马甲线隐约可见" },
  { id: "clear-line", label: "马甲线比较明显" },
  { id: "very-clear-line", label: "马甲线非常明显" }
];

export const foods: Food[] = [
  food("rice-cooked", "米饭", ["白米饭", "米", "饭"], "staple", 116, 2.6, 0.3, 25.9, 150, [["碗", 150]]),
  food("noodles", "面条", ["面", "汤面", "拌面"], "staple", 110, 3.8, 0.8, 22, 200, [["碗", 250]]),
  food("instant-noodles", "方便面", ["泡面", "桶面", "杯面", "速食面"], "fastfood", 472, 9, 21, 61, 100, [["包", 100], ["桶", 110], ["碗", 110]]),
  food("mantou", "馒头", ["白馒头"], "staple", 223, 7, 1.1, 47, 100, [["个", 100]]),
  food("bread", "面包", ["吐司", "切片面包"], "staple", 265, 9, 3.2, 49, 60, [["片", 30]]),
  food("oatmeal", "燕麦", ["燕麦片"], "staple", 380, 13, 7, 67, 40, [["勺", 10], ["碗", 45]]),
  food("sweet-potato", "红薯", ["地瓜", "番薯"], "staple", 86, 1.6, 0.1, 20, 150, [["个", 150], ["根", 150]]),
  food("corn", "玉米", ["玉米棒"], "staple", 112, 4, 1.2, 22, 180, [["根", 180]]),
  food("egg", "鸡蛋", ["蛋", "水煮蛋", "煎蛋"], "protein", 144, 13.3, 8.8, 2.8, 55, [["个", 55], ["颗", 55], ["只", 55]]),
  food("chicken-breast", "鸡胸肉", ["鸡胸", "鸡肉"], "protein", 133, 24, 2.5, 0, 120, [["块", 120]]),
  food("beef", "牛肉", ["熟牛肉", "卤牛肉", "酱牛肉"], "protein", 220, 26, 12, 1, 120, [["块", 120], ["份", 120]]),
  food("lean-beef", "瘦牛肉", ["牛里脊", "牛腱子", "低脂牛肉"], "protein", 125, 20, 4.2, 1, 120, [["块", 120], ["份", 120]]),
  food("pork-lean", "瘦猪肉", ["瘦肉", "猪肉"], "protein", 143, 20, 6.2, 1.5, 100, [["块", 100]]),
  food("fish", "鱼肉", ["鱼", "鱼片"], "protein", 110, 18, 3, 0, 120, [["块", 120], ["条", 300]]),
  food("shrimp", "虾", ["虾仁", "大虾"], "protein", 99, 20, 1.5, 1, 120, [["只", 20]]),
  food("tofu", "豆腐", ["嫩豆腐", "老豆腐"], "protein", 82, 8, 4.8, 3.4, 150, [["块", 150]]),
  food("milk", "牛奶", ["纯牛奶"], "drink", 54, 3.2, 3.2, 3.4, 250, [["杯", 250], ["盒", 250]]),
  food("yogurt", "酸奶", ["无糖酸奶", "希腊酸奶"], "drink", 72, 3.5, 2.7, 8.5, 180, [["杯", 180], ["盒", 180]]),
  food("protein-powder", "蛋白粉", ["乳清蛋白", "蛋白饮"], "supplement", 390, 75, 6, 8, 30, [["勺", 30]]),
  food("tomato", "西红柿", ["番茄"], "vegetable", 15, 0.9, 0.2, 3.3, 180, [["个", 180], ["颗", 180], ["拳头", 160]]),
  food("cucumber", "黄瓜", ["青瓜"], "vegetable", 16, 0.8, 0.2, 3.6, 150, [["根", 150], ["条", 150]]),
  food("cabbage", "白菜", ["大白菜", "娃娃菜"], "vegetable", 20, 1.6, 0.2, 3.4, 200, [["颗", 600], ["份", 200]]),
  food("lettuce", "生菜", ["油麦菜"], "vegetable", 16, 1.4, 0.2, 2.1, 150, [["份", 150]]),
  food("broccoli", "西兰花", ["绿花菜"], "vegetable", 34, 2.8, 0.4, 6.6, 150, [["份", 150], ["碗", 160]]),
  food("spinach", "菠菜", ["绿叶菜"], "vegetable", 23, 2.9, 0.4, 3.6, 150, [["份", 150]]),
  food("carrot", "胡萝卜", ["红萝卜"], "vegetable", 41, 0.9, 0.2, 9.6, 120, [["根", 120]]),
  food("potato", "土豆", ["马铃薯"], "staple", 77, 2, 0.1, 17, 180, [["个", 180]]),
  food("banana", "香蕉", ["蕉"], "fruit", 93, 1.4, 0.2, 22, 120, [["根", 120], ["个", 120], ["中等", 120]]),
  food("apple", "苹果", ["红苹果"], "fruit", 53, 0.3, 0.2, 14, 180, [["个", 180]]),
  food("orange", "橙子", ["橙", "橘子"], "fruit", 48, 0.8, 0.2, 11, 180, [["个", 180]]),
  food("grape", "葡萄", ["提子"], "fruit", 45, 0.4, 0.2, 10.3, 150, [["串", 150]]),
  food("watermelon", "西瓜", ["瓜"], "fruit", 31, 0.6, 0.1, 7.9, 300, [["块", 300]]),
  food("tomato-egg", "西红柿炒鸡蛋", ["番茄炒蛋", "番茄炒鸡蛋"], "dish", 95, 5.6, 6.2, 4.3, 250, [["盘", 300], ["份", 250]]),
  food("pork-scallion-dumplings", "猪肉大葱水饺", ["猪肉大葱馅水饺", "猪肉大葱馅儿水饺", "猪肉大葱饺子", "猪肉大葱馅饺子", "水饺", "饺子"], "dish", 220, 8, 8, 28, 250, [["个", 25], ["只", 25], ["盘", 250], ["份", 250]]),
  food("preserved-egg-pork-congee", "皮蛋瘦肉粥", ["皮蛋粥", "瘦肉粥"], "dish", 65, 3.5, 2.2, 8, 300, [["碗", 300], ["份", 300]]),
  food("huangmenji", "黄焖鸡", ["黄焖鸡米饭"], "fastfood", 168, 11, 8.5, 12, 350, [["份", 450]]),
  food("fried-rice", "蛋炒饭", ["炒饭"], "fastfood", 188, 6, 7, 26, 350, [["份", 400], ["碗", 300]]),
  food("hotpot", "火锅", ["麻辣烫", "冒菜"], "fastfood", 160, 8, 9, 11, 500, [["份", 500], ["碗", 500]]),
  food("grilled-chicken-burger", "板烧鸡腿堡", ["板烧堡", "鸡腿堡", "板烧鸡腿汉堡"], "fastfood", 255, 13, 11, 27, 190, [["个", 190], ["份", 190]]),
  food("shaobing", "烧饼", ["芝麻烧饼", "油酥烧饼", "吊炉烧饼"], "staple", 260, 7, 8, 40, 100, [["个", 100], ["张", 100]]),
  food("hamburger", "汉堡", ["牛肉堡", "鸡腿汉堡"], "fastfood", 260, 13, 12, 25, 180, [["个", 180]]),
  food("pizza", "披萨", ["比萨"], "fastfood", 266, 11, 10, 33, 120, [["块", 120], ["片", 120]]),
  food("cola", "可乐", ["汽水", "碳酸饮料"], "drink", 43, 0, 0, 10.6, 330, [["瓶", 500], ["罐", 330]]),
  food("milk-tea", "奶茶", ["珍珠奶茶", "果茶", "伯牙绝弦", "霸王茶姬", "霸王茶姬伯牙绝弦", "原叶鲜奶茶"], "drink", 70, 1.2, 2.4, 11, 500, [["杯", 500]]),
  food("americano", "美式咖啡", ["美式", "黑咖啡"], "drink", 3, 0.2, 0, 0, 300, [["杯", 300], ["瓶", 300]]),
  food("latte", "拿铁", ["拿铁咖啡"], "drink", 50, 2.8, 2, 4.8, 300, [["杯", 300], ["瓶", 300]]),
  food("coffee", "咖啡", ["咖啡饮品"], "drink", 35, 1.8, 1.4, 4, 300, [["杯", 300]]),
  food("chips", "薯片", ["膨化食品"], "snack", 548, 6.8, 35, 52, 50, [["包", 70], ["袋", 70]]),
  food("chocolate", "巧克力", ["黑巧", "牛奶巧克力"], "snack", 546, 5, 31, 61, 30, [["块", 30]]),
  food("cashew", "腰果", ["腰果仁"], "snack", 560, 17, 44, 30, 25, [["把", 25], ["包", 30], ["袋", 80]]),
  food("almond", "巴旦木", ["杏仁", "扁桃仁"], "snack", 580, 21, 50, 22, 25, [["把", 25], ["包", 30], ["袋", 80]]),
  food("walnut", "核桃", ["核桃仁"], "snack", 646, 15, 65, 14, 25, [["把", 25], ["包", 30], ["个", 8]]),
  food("pistachio", "开心果", ["开心果仁"], "snack", 560, 20, 45, 28, 25, [["把", 25], ["包", 30], ["袋", 80]]),
  food("nuts", "坚果", ["混合坚果", "每日坚果"], "snack", 600, 18, 50, 22, 25, [["把", 25], ["包", 30]]),
  food("wonton", "馄饨", ["云吞", "抄手", "扁食"], "dish", 180, 7, 6, 24, 250, [["碗", 350], ["份", 250], ["个", 20]]),
  food("baozi", "包子", ["肉包", "菜包", "豆沙包", "奶黄包", "灌汤包", "叉烧包"], "staple", 220, 8, 5, 35, 200, [["个", 100], ["只", 100]]),
  food("xiaolongbao", "小笼包", ["汤包", "南翔小笼", "小笼汤包"], "dish", 180, 8, 6, 24, 160, [["笼", 160], ["个", 20], ["只", 20]]),
  food("duck-blood-vermicelli-soup", "鸭血粉丝汤", ["鸭血粉丝", "南京鸭血粉丝汤"], "dish", 60, 4, 2, 7, 350, [["碗", 350], ["份", 350]]),
  food("jianbing", "煎饼", ["煎饼果子", "杂粮煎饼", "山东煎饼"], "staple", 240, 7, 9, 35, 200, [["个", 200], ["份", 200]]),
  food("youtiao", "油条", ["油炸鬼", "炸油条", "脆油条"], "staple", 386, 7, 17, 51, 100, [["根", 50], ["条", 50]]),
  food("doujiang", "豆浆", ["豆奶", "黄豆豆浆", "无糖豆浆", "甜豆浆", "原味豆浆"], "drink", 32, 1.8, 0.7, 1.1, 250, [["杯", 250], ["碗", 250], ["袋", 200], ["盒", 250]]),
  food("wonton-soup", "馄饨汤", ["大馄饨汤", "小馄饨汤", "鲜肉馄饨", "菜肉馄饨"], "dish", 80, 4, 2, 10, 300, [["碗", 300], ["份", 300]]),
  food("lamian", "拉面", ["兰州拉面", "牛肉拉面", "牛肉面", "兰州牛肉面", "汤面"], "staple", 130, 5, 3, 22, 200, [["碗", 400], ["份", 400]]),
  food("hot-dry-noodles", "热干面", ["武汉热干面", "热干面一碗"], "staple", 152, 5, 4, 24, 200, [["碗", 400], ["份", 400]]),
  food("dapanji", "大盘鸡", ["新疆大盘鸡", "皮带面"], "dish", 170, 11, 9, 12, 400, [["份", 500], ["盘", 500]]),
  food("shaxian-snacks", "沙县小吃", ["沙县拌面", "沙县蒸饺", "沙县炖罐", "沙县拌云吞"], "fastfood", 200, 7, 8, 26, 350, [["份", 350]]),
  food("guoba", "锅巴", ["小米锅巴", "大米锅巴", "锅巴零食"], "snack", 480, 7, 22, 65, 100, [["袋", 100], ["包", 100]]),
  food("boba-tea", "珍珠奶茶", ["波霸奶茶", "珍珠奶绿", "奶绿"], "drink", 95, 1.5, 3, 16, 500, [["杯", 500], ["瓶", 500]]),
  food("orange-juice", "橙汁", ["鲜橙汁", "橙汁饮料", "汇源橙汁"], "drink", 45, 0.5, 0, 11, 250, [["杯", 250], ["瓶", 500], ["盒", 250]]),
  food("sprite", "雪碧", ["柠檬汽水", "雪碧汽水"], "drink", 40, 0, 0, 10, 330, [["瓶", 500], ["罐", 330], ["杯", 250]]),
  food("fanta", "芬达", ["橙味汽水", "芬达橙"], "drink", 48, 0, 0, 12, 330, [["瓶", 500], ["罐", 330], ["杯", 250]]),
  food("red-bull", "红牛", ["红牛饮料", "红牛能量"], "drink", 45, 0, 0, 11, 250, [["罐", 250], ["瓶", 250]]),
  food("rice-wine", "米酒", ["甜米酒", "米酿", "米酒饮品"], "drink", 65, 0.4, 0, 14, 250, [["杯", 250], ["碗", 250], ["瓶", 500]]),
  food("jiuniang", "酒酿", ["酒酿圆子", "甜酒酿", "醪糟"], "drink", 80, 2, 0.5, 18, 250, [["碗", 250], ["杯", 250]]),
  food("tangyuan", "汤圆", ["芝麻汤圆", "花生汤圆", "豆沙汤圆"], "staple", 250, 4, 11, 36, 200, [["碗", 200], ["个", 15]]),
  food("mooncake", "月饼", ["五仁月饼", "蛋黄莲蓉月饼", "豆沙月饼"], "snack", 430, 6, 22, 60, 100, [["个", 100], ["块", 100]]),
  food("huangzhuang-mooncake", "黄庄月饼", ["黄庄小月饼", "迷你月饼"], "snack", 400, 6, 20, 55, 45, [["个", 45], ["块", 45]]),
  food("egg-yolk-pastry-light", "蛋黄酥饼", ["蛋黄酥", "小蛋黄酥"], "snack", 333, 7, 18, 36, 45, [["个", 45], ["只", 45]]),
  food("hunan-chili-fried-pork", "辣椒炒肉", ["湖南辣椒炒肉", "农家辣椒炒肉", "小炒肉", "湘味小炒肉"], "dish", 185, 12, 13, 5, 300, [["份", 300], ["盘", 300]]),
  food("chicken-oat-onigiri", "鸡肉燕麦饭团", ["鸡肉饭团", "燕麦饭团", "健身饭团", "鸡胸肉燕麦饭团"], "staple", 185, 9, 4, 28, 110, [["个", 110], ["只", 110]]),
  food("spicy-peanuts", "麻辣花生米", ["麻辣花生", "香辣花生米", "香辣花生", "酒鬼花生"], "snack", 590, 24, 46, 22, 30, [["把", 25], ["包", 80], ["袋", 80]]),
  food("peanuts", "花生", ["花生米", "落花生"], "snack", 567, 25.8, 49.2, 16.1, 30, [["把", 30], ["份", 30]]),
  food("boiled-peanuts", "水煮花生", ["煮花生", "盐水花生"], "snack", 313, 12, 25.4, 13, 30, [["把", 30], ["份", 30]]),
  food("fried-peanuts", "油炸花生", ["炸花生", "油炸花生米"], "snack", 583, 22.2, 47.1, 26.2, 30, [["把", 30], ["份", 30]]),
  food("garlic-bread-crisps", "蒜香面包干", ["蒜香面包片", "蒜香法棍片", "面包干", "烤面包干"], "snack", 400, 9, 12, 66, 30, [["包", 30], ["袋", 30], ["小包", 30], ["片", 10]]),
  food("generic-riceball", "饭团", ["便利店饭团", "日式饭团", "海苔饭团"], "staple", 180, 5, 4, 30, 110, [["个", 110], ["只", 110]]),
  food("qiaoguo", "巧克力曲奇", ["巧克力饼干", "趣多多", "趣多多的曲奇"], "snack", 510, 6, 25, 65, 100, [["包", 100], ["袋", 100], ["块", 12]]),
  food("oreo", "奥利奥", ["奥利奥饼干", "夹心饼干", "黑白配"], "snack", 480, 5, 20, 70, 100, [["包", 100], ["袋", 100], ["块", 12]]),
  food("spicy-strips", "辣条", ["辣片", "大辣片", "卫龙辣条", "麻辣条"], "snack", 430, 5, 17, 65, 100, [["包", 100], ["袋", 100]]),
  food("tea-egg", "茶叶蛋", ["茶蛋", "卤蛋"], "protein", 155, 13, 11, 2, 60, [["个", 60], ["只", 60]]),
  food("mangguo", "芒果", ["小台农", "凯特芒", "贵妃芒"], "fruit", 60, 0.8, 0.4, 15, 200, [["个", 200]]),
  food("caomei", "草莓", ["奶油草莓", "丹东草莓", "99草莓"], "fruit", 32, 1, 0.3, 7, 200, [["颗", 20], ["盒", 200], ["份", 200]]),
  food("xigua", "西瓜", ["麒麟瓜", "甘美西瓜", "黑美人西瓜"], "fruit", 31, 0.6, 0.1, 7.9, 300, [["块", 300]]),
  food("white-cut-chicken", "白切鸡", ["白斩鸡", "湛江白切鸡", "广东白切鸡"], "dish", 200, 20, 11, 1, 300, [["份", 300], ["只", 600], ["盘", 300]]),
  food("roast-duck", "烤鸭", ["北京烤鸭", "广式烧鸭", "片皮鸭", "烧鸭饭"], "dish", 240, 19, 19, 0, 300, [["份", 300], ["只", 1500], ["盘", 300]]),
  food("kungpao-chicken", "宫保鸡丁", ["宫保鸡", "宫保鸡丁饭", "宫保鸡丁盖饭"], "dish", 180, 14, 10, 12, 300, [["份", 300], ["盘", 300], ["碗", 300]]),
  food("yuxiang-rousi", "鱼香肉丝", ["鱼香肉丝盖饭", "鱼香肉丝饭"], "dish", 165, 9, 9, 13, 300, [["份", 300], ["盘", 300]]),
  food("mapo-tofu", "麻婆豆腐", ["麻婆豆腐盖饭", "陈麻婆豆腐"], "dish", 130, 9, 8, 7, 300, [["份", 300], ["盘", 300]]),
  food("beef-noodle-soup", "牛肉面", ["红烧牛肉面", "牛肉汤面", "牛杂面", "牛肉拉面"], "dish", 130, 6, 4, 19, 350, [["碗", 350], ["份", 350]]),
  food("suanlafen", "酸辣粉", ["红薯酸辣粉"], "staple", 120, 4, 5, 16, 350, [["份", 350], ["碗", 350]]),
  food("braised-pork-rice", "卤肉饭", ["台湾卤肉饭", "卤肉盖饭", "卤肉拌饭"], "dish", 200, 8, 12, 18, 350, [["份", 400], ["碗", 400]]),
  food("dumplings-soup", "水饺汤", ["饺子汤", "水饺带汤"], "dish", 110, 4, 4, 15, 300, [["碗", 300], ["份", 300]]),
  food("rice-noodle", "米线", ["过桥米线", "云南米线", "小锅米线", "米线一碗"], "staple", 95, 2, 1, 20, 200, [["碗", 400], ["份", 400]]),
  food("liangpi", "凉皮", ["陕西凉皮", "麻酱凉皮", "擀面皮"], "staple", 130, 2.5, 2, 27, 200, [["碗", 300], ["份", 300]]),
  food("cold-noodles", "冷面", ["延吉冷面", "韩式冷面", "朝鲜冷面"], "staple", 130, 3, 1, 27, 300, [["碗", 400], ["份", 400]]),
  food("hongshao-rou", "红烧肉", ["红烧肉饭", "红烧肉盖饭", "毛氏红烧肉"], "dish", 380, 18, 30, 8, 300, [["份", 350], ["块", 50]]),
  food("tomato-beef", "西红柿牛腩", ["番茄牛腩", "番茄炖牛腩", "西红柿炖牛腩", "牛腩汤"], "dish", 120, 9, 6, 8, 300, [["碗", 300], ["份", 300]]),
  food("eggplant-garlic", "鱼香茄子", ["蒜泥茄子", "红烧茄子", "地三鲜"], "dish", 110, 2, 7, 12, 300, [["份", 300], ["盘", 300]]),
  food("sushi", "寿司", ["加州卷", "三文鱼寿司", "鳗鱼寿司"], "staple", 150, 4, 2, 30, 200, [["个", 30], ["份", 200], ["盘", 200]]),
  food("bibimbap", "石锅拌饭", ["韩式拌饭", "拌饭", "石锅饭"], "dish", 180, 7, 6, 24, 350, [["份", 400], ["碗", 400]]),
  food("ramen", "日式拉面", ["豚骨拉面", "味噌拉面", "酱油拉面", "豚骨汤拉面"], "dish", 160, 8, 6, 21, 350, [["碗", 400], ["份", 400]]),
  food("jianbing-guozi", "煎饼果子", ["煎饼一套", "一套煎饼", "天津煎饼果子"], "staple", 240, 7, 9, 35, 200, [["个", 200], ["份", 200], ["套", 200]]),
  food("kfc-fries", "薯条", ["肯德基薯条", "麦当劳薯条", "薯条大份", "薯条中份"], "fastfood", 312, 3.4, 15, 42, 100, [["份", 100], ["包", 100]]),
  food("fried-chicken", "炸鸡", ["炸鸡块", "炸鸡腿", "炸鸡翅", "韩式炸鸡", "吮指原味鸡"], "fastfood", 290, 18, 18, 11, 200, [["块", 60], ["个", 200], ["份", 200], ["只", 100]]),
  food("popcorn-chicken", "鸡米花", ["盐酥鸡", "鸡块", "鸡球"], "fastfood", 280, 16, 17, 15, 100, [["份", 100], ["袋", 100]]),
  food("ice-cream", "冰激凌", ["冰淇淋", "雪糕", "甜筒", "双球冰激凌"], "snack", 207, 3.5, 11, 24, 100, [["个", 80], ["球", 60], ["支", 60], ["杯", 100]]),
  food("cake", "蛋糕", ["奶油蛋糕", "芝士蛋糕", "慕斯蛋糕", "提拉米苏", "千层蛋糕", "生日蛋糕"], "snack", 350, 5, 18, 42, 200, [["块", 100], ["片", 100], ["份", 200]]),
  // 电商食品类目兜底：优先承接用户说品牌但库里没有精确 SKU 的常见食品。
  food("soda-cracker", "苏打饼干", ["梳打饼干", "咸苏打饼干", "三加二苏打饼干", "3+2苏打饼干", "三+二苏打饼干"], "snack", 430, 8, 12, 72, 60, [["包", 60], ["袋", 60], ["片", 10], ["份", 50]]),
  food("sandwich-biscuit", "夹心饼干", ["夹心曲奇", "奶油夹心饼干", "巧克力夹心饼干"], "snack", 485, 5, 22, 68, 60, [["包", 60], ["袋", 60], ["块", 12], ["份", 50]]),
  food("wafer-biscuit", "威化饼干", ["威化", "威化棒", "巧克力威化"], "snack", 520, 6, 28, 62, 50, [["包", 50], ["袋", 50], ["条", 15], ["份", 50]]),
  food("egg-roll", "蛋卷", ["鸡蛋卷", "脆皮蛋卷"], "snack", 470, 8, 20, 64, 50, [["包", 50], ["根", 15], ["份", 50]]),
  food("sachima", "沙琪玛", ["萨其马", "沙其马"], "snack", 420, 6, 16, 64, 50, [["块", 50], ["包", 100], ["份", 50]]),
  food("pineapple-cake", "凤梨酥", ["菠萝酥"], "snack", 430, 5, 20, 58, 40, [["个", 40], ["块", 40], ["盒", 200]]),
  food("mung-bean-cake", "绿豆糕", ["绿豆饼"], "snack", 360, 7, 9, 64, 40, [["块", 40], ["个", 40], ["盒", 200]]),
  food("yeast-protein", "酵母蛋白", ["酵母蛋白粉", "酵母蛋白片"], "supplement", 370, 55, 6, 22, 30, [["勺", 30], ["份", 30], ["片", 5]]),
  food("plant-protein", "植物蛋白", ["植物蛋白粉", "豌豆蛋白", "大豆蛋白"], "supplement", 380, 70, 6, 10, 30, [["勺", 30], ["份", 30]]),
  food("meal-replacement-powder", "代餐粉", ["代餐奶昔粉", "营养代餐粉"], "supplement", 380, 25, 8, 48, 40, [["勺", 40], ["份", 40], ["袋", 40]]),
  food("black-sesame-paste", "黑芝麻糊", ["芝麻糊", "冲调芝麻糊"], "snack", 420, 12, 12, 66, 40, [["袋", 40], ["杯", 40], ["碗", 40]]),
  food("lotus-root-powder", "藕粉", ["冲调藕粉", "坚果藕粉"], "snack", 360, 1, 0.5, 88, 35, [["袋", 35], ["碗", 35], ["份", 35]]),
  food("ready-chicken-breast", "即食鸡胸肉", ["低脂鸡胸肉", "袋装鸡胸肉", "代餐鸡胸肉", "健身鸡胸肉", "奥尔良鸡胸肉"], "protein", 120, 24, 2.5, 2, 100, [["袋", 100], ["包", 100], ["块", 100], ["份", 100]]),
  food("chicken-sausage", "鸡肉肠", ["低脂鸡肉肠", "鸡胸肉肠", "健身鸡肉肠", "高蛋白鸡肉肠"], "protein", 155, 16, 7, 6, 40, [["根", 40], ["支", 40], ["包", 80]]),
  food("protein-bar", "蛋白棒", ["高蛋白棒", "乳清蛋白棒", "健身蛋白棒", "代餐蛋白棒"], "supplement", 380, 30, 12, 38, 50, [["根", 50], ["条", 50], ["支", 50]]),
  food("high-protein-yogurt", "高蛋白酸奶", ["蛋白酸奶", "希腊高蛋白酸奶", "健身酸奶"], "drink", 80, 8, 2, 7, 200, [["盒", 200], ["杯", 200], ["瓶", 230]]),
  food("konjac-noodles", "魔芋面", ["魔芋凉皮", "魔芋粉丝", "低卡魔芋面", "即食魔芋面"], "staple", 25, 0.5, 0.2, 5, 200, [["包", 200], ["袋", 200], ["份", 200]]),
  food("buckwheat-noodles-light", "荞麦面", ["低卡荞麦面", "全麦荞麦面", "健身荞麦面"], "staple", 115, 5, 1, 22, 200, [["包", 200], ["袋", 200], ["份", 200], ["碗", 250]]),
  food("instant-oatmeal", "即食燕麦片", ["无糖燕麦片", "原味燕麦片", "免煮燕麦片"], "staple", 380, 13, 7, 67, 40, [["袋", 40], ["包", 40], ["勺", 10], ["碗", 45]]),
  food("tuna-can", "金枪鱼罐头", ["水浸金枪鱼", "即食金枪鱼", "低脂金枪鱼罐头"], "protein", 110, 23, 1, 0, 120, [["罐", 120], ["盒", 120], ["份", 120]]),
  food("light-meal-salad", "轻食沙拉", ["鸡胸肉沙拉", "健身沙拉", "低脂沙拉", "代餐沙拉"], "dish", 95, 8, 4, 8, 300, [["盒", 300], ["份", 300], ["碗", 300]]),
  food("quinoa-chicken-bowl", "藜麦鸡胸碗", ["藜麦鸡胸饭", "鸡胸藜麦碗", "健身藜麦饭"], "dish", 145, 12, 4, 16, 350, [["盒", 350], ["份", 350], ["碗", 350]]),
  food("brown-rice-meal", "糙米饭", ["糙米饭团", "糙米鸡胸饭", "健身糙米饭"], "staple", 115, 2.7, 1, 23, 150, [["碗", 150], ["盒", 300], ["份", 150]]),
  food("low-fat-beef-ball", "低脂牛肉丸", ["健身牛肉丸", "高蛋白牛肉丸", "牛肉丸"], "protein", 160, 18, 6, 8, 100, [["颗", 25], ["个", 25], ["包", 100], ["份", 100]]),
  food("chicken-breast-wrap", "鸡胸肉卷", ["低脂鸡肉卷", "全麦鸡肉卷", "健身鸡肉卷"], "staple", 185, 14, 6, 20, 180, [["个", 180], ["份", 180]]),
  food("whole-wheat-bagel", "全麦贝果", ["黑麦贝果", "低脂贝果", "健身贝果"], "staple", 250, 10, 3, 46, 90, [["个", 90], ["只", 90]]),
  food("egg-white-liquid", "蛋清液", ["液体蛋清", "巴氏杀菌蛋清", "健身蛋清液"], "protein", 52, 11, 0.2, 0.7, 100, [["盒", 250], ["杯", 100], ["份", 100]]),
  food("bread-bun", "甜面包", ["豆沙面包", "奶酥面包", "菠萝包", "蜜瓜包", "毛毛虫面包"], "staple", 360, 8, 14, 50, 100, [["个", 100]]),
  food("jiaozi-shanghai", "上海生煎", ["生煎包", "生煎馒头", "小杨生煎"], "dish", 230, 9, 11, 24, 200, [["个", 50], ["只", 50], ["份", 200]]),
  food("hummus", "鹰嘴豆泥", ["鹰嘴豆", "泥"], "snack", 166, 8, 10, 14, 100, [["盒", 100], ["份", 100]]),
  food("avocado", "牛油果", ["鳄梨", "avocado"], "fruit", 160, 2, 15, 9, 200, [["个", 200]]),
  food("oat-bread", "全麦面包", ["全麦吐司", "黑麦面包", "杂粮面包"], "staple", 240, 9, 3, 45, 100, [["片", 30], ["个", 100]]),
  food("sugar-free-soda", "无糖可乐", ["零度可乐", "健怡可乐", "零卡可乐"], "drink", 0, 0, 0, 0, 330, [["瓶", 500], ["罐", 330], ["杯", 250]]),
  food("wheat-barley-tea", "大麦茶", ["麦茶", "冰大麦茶"], "drink", 3, 0, 0, 0, 500, [["瓶", 500], ["杯", 300]]),
  food("tea", "茶", ["绿茶", "红茶", "普洱茶", "乌龙茶", "铁观音", "菊花茶"], "drink", 1, 0, 0, 0, 250, [["杯", 250], ["壶", 500]]),
  food("spicy-hotpot", "麻辣锅", ["九宫格火锅", "鸳鸯锅", "牛油火锅"], "fastfood", 220, 9, 14, 14, 500, [["份", 500], ["锅", 500]]),
  food("guandong-cook", "关东煮", ["便利店关东煮"], "fastfood", 95, 5, 3, 12, 200, [["串", 60], ["份", 200]]),
  food("tanghulu", "糖葫芦", ["山楂糖葫芦", "草莓糖葫芦"], "snack", 200, 1, 0, 50, 100, [["串", 100]]),
  food("jian-dumpling", "煎饺", ["锅贴", "生煎锅贴"], "dish", 220, 8, 9, 26, 200, [["个", 25], ["只", 25], ["份", 200]]),
  food("shanghai-riceball", "粢饭团", ["上海粢饭团", "粢饭糕"], "staple", 230, 6, 8, 35, 200, [["个", 200]]),
  food("congee", "白粥", ["大米粥", "白米粥", "清粥", "米粥"], "staple", 46, 0.9, 0.1, 10, 250, [["碗", 250], ["份", 250]]),
  food("sweet-congee", "甜粥", ["红枣粥", "南瓜粥", "小米粥", "八宝粥"], "staple", 70, 1.5, 0.5, 16, 250, [["碗", 250], ["份", 250]]),
  food("white-radish-soup", "萝卜汤", ["白萝卜汤", "萝卜丝汤", "排骨萝卜汤"], "dish", 35, 1.5, 1, 5, 300, [["碗", 300], ["份", 300]]),
  food("tomato-soup", "西红柿蛋汤", ["番茄蛋汤", "番茄鸡蛋汤", "西红柿蛋花汤"], "dish", 45, 2, 2, 4, 300, [["碗", 300], ["份", 300]]),
  food("seaweed-soup", "紫菜蛋花汤", ["紫菜汤", "蛋花汤"], "dish", 30, 2, 1, 3, 300, [["碗", 300], ["份", 300]]),
  food("steamed-egg", "蒸蛋", ["水蒸蛋", "鸡蛋羹", "日式茶碗蒸"], "dish", 75, 6, 5, 1, 200, [["碗", 200], ["份", 200]]),
  food("chinese-burger", "肉夹馍", ["腊汁肉夹馍", "陕西肉夹馍", "潼关肉夹馍"], "staple", 280, 10, 12, 30, 200, [["个", 200]]),
  food("lamb-skewers", "羊肉串", ["烤羊肉串", "新疆羊肉串"], "dish", 215, 18, 14, 0, 200, [["串", 30], ["份", 200]]),
  food("bbq-wing", "烤翅", ["烤鸡翅", "蜜汁烤翅", "麻辣烤翅"], "dish", 230, 22, 13, 3, 100, [["个", 100], ["只", 100], ["份", 200]]),
  food("luo-si-fan", "螺蛳粉", ["柳州螺蛳粉", "广西螺蛳粉"], "staple", 130, 3, 4, 22, 250, [["碗", 400], ["份", 400]]),
  food("shaanxi-mian", "油泼面", ["biangbiang面", "裤带面", "陕西油泼面"], "staple", 150, 5, 5, 22, 250, [["碗", 400], ["份", 400]]),
  food("guangzhou-rice-roll", "肠粉", ["广式肠粉", "广州肠粉", "鲜虾肠粉"], "staple", 130, 3, 2, 24, 200, [["条", 100], ["份", 200]]),
  food("jian-jiao-rice", "煲仔饭", ["腊味煲仔饭", "广东煲仔饭"], "dish", 180, 6, 8, 22, 350, [["份", 400], ["锅", 400]]),
  food("crawfish", "小龙虾", ["麻辣小龙虾", "蒜蓉小龙虾", "十三香小龙虾"], "dish", 90, 19, 1, 1, 200, [["只", 30], ["份", 400]]),
  food("mangosteen-mangosteen", "芒果饭", ["泰式芒果饭", "芒果糯米饭"], "dish", 180, 3, 5, 32, 200, [["份", 200]]),
  food("mangosteen", "山竹", ["泰国山竹"], "fruit", 69, 0.4, 0.2, 18, 100, [["个", 100]]),
  food("lychee", "荔枝", ["妃子笑", "糯米糍荔枝"], "fruit", 66, 0.8, 0.2, 17, 100, [["个", 20]]),
  food("mango", "芒果", ["台农芒果", "凯特芒"], "fruit", 60, 0.8, 0.4, 15, 200, [["个", 200]]),
  food("pear", "梨", ["雪梨", "鸭梨", "香梨", "皇冠梨"], "fruit", 44, 0.4, 0.2, 11, 200, [["个", 200]]),
  food("peach", "桃子", ["水蜜桃", "蟠桃", "黄桃"], "fruit", 48, 0.9, 0.3, 11, 200, [["个", 200]]),
  food("cherry", "樱桃", ["车厘子", "大樱桃", "美早樱桃"], "fruit", 46, 1, 0.2, 10, 100, [["颗", 8], ["盒", 200]]),
  food("blueberry", "蓝莓", ["新鲜蓝莓", "蓝莓一盒"], "fruit", 57, 0.7, 0.3, 14, 100, [["盒", 100], ["颗", 1], ["把", 30]]),
  food("dragon-fruit", "火龙果", ["红心火龙果", "白心火龙果"], "fruit", 51, 1.2, 0.2, 13, 300, [["个", 300], ["块", 100]]),
  food("kiwi", "猕猴桃", ["奇异果", "kiwi"], "fruit", 61, 1.1, 0.5, 15, 100, [["个", 100]]),
  food("beef-belly-skewer", "肥牛", ["肥牛卷", "雪花肥牛", "和牛肉眼"], "protein", 250, 17, 19, 0, 200, [["片", 30], ["份", 200]]),
  food("fried-dough-strips", "油条豆浆", ["油条配豆浆", "豆浆油条", "一份油条豆浆"], "staple", 220, 6, 14, 22, 250, [["份", 250]])
,

];

export const recognizableFoodTermCount = foods.reduce((sum, item) => sum + 1 + item.aliases.length, 0);

export const exercises: Exercise[] = [
  exercise("push-up", "俯卧撑", ["俯卧撑"], "chest", ["徒手"], 6),
  exercise("bench-press", "卧推", ["杠铃卧推", "哑铃卧推"], "chest", ["杠铃", "哑铃", "健身房器械"], 6),
  exercise("pull-up", "引体向上", ["引体", "单杠"], "back", ["徒手", "健身房器械"], 8),
  exercise("row", "划船", ["哑铃划船", "坐姿划船"], "back", ["哑铃", "健身房器械"], 6),
  exercise("deadlift", "硬拉", ["杠铃硬拉", "罗马尼亚硬拉"], "legs", ["杠铃", "哑铃", "健身房器械"], 6.8),
  exercise("squat", "深蹲", ["杠铃深蹲", "徒手深蹲"], "legs", ["徒手", "杠铃", "哑铃"], 6.5),
  exercise("lunge", "弓步蹲", ["箭步蹲"], "legs", ["徒手", "哑铃"], 5.5),
  exercise("shoulder-press", "推举", ["肩推", "哑铃推举"], "shoulders", ["哑铃", "杠铃"], 5.5),
  exercise("lateral-raise", "侧平举", ["哑铃侧平举"], "shoulders", ["哑铃"], 4),
  exercise("curl", "弯举", ["二头弯举"], "arms", ["哑铃", "杠铃"], 4),
  exercise("triceps-extension", "臂屈伸", ["三头下压"], "arms", ["徒手", "健身房器械"], 4.5),
  exercise("plank", "平板支撑", ["平板"], "core", ["徒手"], 3.5),
  exercise("crunch", "卷腹", ["仰卧卷腹"], "core", ["徒手"], 3.8),
  exercise("running", "跑步", ["慢跑", "跑步机"], "cardio", ["跑步机", "徒手"], 8),
  exercise("cycling", "动感单车", ["骑车", "单车"], "cardio", ["健身房器械"], 7)
];

export function calculateGoalEnergyPlan(input: {
  currentWeightKg: number;
  targetWeightKg: number;
  days: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityFactor: number;
}): EnergyPlan {
  const bmr =
    input.gender === "male"
      ? 10 * input.currentWeightKg + 6.25 * input.heightCm - 5 * input.age + 5
      : 10 * input.currentWeightKg + 6.25 * input.heightCm - 5 * input.age - 161;
  const tdee = Math.round(bmr * input.activityFactor);
  const dailyDeficitRaw = ((input.currentWeightKg - input.targetWeightKg) * 7700) / Math.max(1, input.days);
  const dailyDeficit = Math.round(Math.max(-300, Math.min(750, dailyDeficitRaw)));
  const calories = Math.max(1200, Math.round(tdee - dailyDeficit));
  const proteinG = Math.round(input.currentWeightKg * 1.8);
  const fatG = Math.round(Math.max(40, (calories * 0.25) / 9));
  const carbsG = Math.round(Math.max(80, (calories - proteinG * 4 - fatG * 9) / 4));

  return { calories, proteinG, fatG, carbsG, bmr: Math.round(bmr), tdee, dailyDeficit };
}

export function getFoodByIdFromCatalog(id: string, customFoods: Food[] = []): Food | undefined {
  return getFoodCatalog(customFoods).find((item) => item.id === id);
}

export function getFoodCatalog(customFoods: Food[] = []): Food[] {
  const seen = new Set<string>();
  return [...customFoods, ...foods, ...categoryFallbackFoods, ...csvGeneratedFoods].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function calculateFoodTotals(food: Food, grams: number): NutritionTotals {
  const factor = grams / 100;
  return {
    calories: Math.round(food.caloriesPer100g * factor),
    proteinG: round1(food.proteinPer100g * factor),
    fatG: round1(food.fatPer100g * factor),
    carbsG: round1(food.carbsPer100g * factor)
  };
}

export function sumNutrition(values: NutritionTotals[]): NutritionTotals {
  return {
    calories: Math.round(values.reduce((sum, item) => sum + item.calories, 0)),
    proteinG: round1(values.reduce((sum, item) => sum + item.proteinG, 0)),
    fatG: round1(values.reduce((sum, item) => sum + item.fatG, 0)),
    carbsG: round1(values.reduce((sum, item) => sum + item.carbsG, 0))
  };
}

export function calculateNutritionGap(target: NutritionTotals, actual: NutritionTotals): NutritionTotals {
  return {
    calories: Math.round(target.calories - actual.calories),
    proteinG: round1(target.proteinG - actual.proteinG),
    fatG: round1(target.fatG - actual.fatG),
    carbsG: round1(target.carbsG - actual.carbsG)
  };
}

export function recommendMacroAwarePortions(selectedFoods: Food[], energyPlan: NutritionTotals): FoodPortion[] {
  if (selectedFoods.length === 0) return [];

  const targetCalories = Math.max(300, energyPlan.calories);
  const portions: FoodPortion[] = [];
  const flexibleFoods = selectedFoods.filter(canSplitForMealPlanning);
  const wholeServingFoods = selectedFoods.filter((item) => !canSplitForMealPlanning(item));
  const mealBudgets = [
    { meal: "breakfast" as const, calories: targetCalories * 0.25 },
    { meal: "lunch" as const, calories: targetCalories * 0.35 },
    { meal: "dinner" as const, calories: targetCalories * 0.30 },
    { meal: "snack" as const, calories: targetCalories * 0.10 }
  ];
  const pools = {
    protein: flexibleFoods.filter((item) => item.category === "protein" || item.category === "supplement" || item.proteinPer100g >= 12),
    staple: flexibleFoods.filter((item) => item.category === "staple" || (item.carbsPer100g >= 16 && item.category !== "dish" && item.category !== "fastfood")),
    vegetable: flexibleFoods.filter((item) => item.category === "vegetable"),
    fruit: flexibleFoods.filter((item) => item.category === "fruit"),
    fat: flexibleFoods.filter((item) => item.fatPer100g >= 12 && item.category !== "fastfood" && item.category !== "dish"),
    drinkSnack: flexibleFoods.filter((item) => item.category === "drink" || item.category === "snack")
  };

  wholeServingFoods.forEach((foodItem, index) => {
    portions.push(buildPortion(foodItem, wholeServingGrams(foodItem), preferredWholeServingMeal(foodItem, index)));
  });

  mealBudgets.forEach(({ meal, calories }) => {
    if (meal === "snack") {
      const snackFood = pickNext([...pools.fruit, ...pools.drinkSnack, ...pools.fat, ...pools.protein], portions);
      if (snackFood) portions.push(buildPortion(snackFood, gramsForCalories(snackFood, calories * 0.75, meal), meal));
      return;
    }

    const protein = pickNext(pools.protein, portions);
    const staple = pickNext(pools.staple, portions);
    const vegetable = pickNext(pools.vegetable, portions);
    const fat = pickNext(pools.fat, portions);

    if (protein) portions.push(buildPortion(protein, gramsForCalories(protein, calories * 0.38, meal), meal));
    if (staple) portions.push(buildPortion(staple, gramsForCalories(staple, calories * 0.35, meal), meal));
    if (vegetable) portions.push(buildPortion(vegetable, gramsForCalories(vegetable, calories * 0.18, meal), meal));
    if (fat && fat.id !== protein?.id) portions.push(buildPortion(fat, gramsForCalories(fat, calories * 0.10, meal), meal));
  });

  if (portions.length > 0) return mergePortions(portions);

  return selectedFoods.map((item, index) =>
    buildPortion(item, canSplitForMealPlanning(item) ? clampToServing(item, item.defaultUnitGram) : wholeServingGrams(item), index % 2 === 0 ? "lunch" : "dinner")
  );
}

export function generateTrainingQueue(allExercises: Exercise[], preference: {
  daysPerWeek: number;
  minutesPerSession: number;
  equipment: string[];
  preferredMuscleGroups: MuscleGroup[];
  cardioRatio: number;
}): WorkoutPlan[] {
  const focusList = preference.preferredMuscleGroups.length > 0
    ? preference.preferredMuscleGroups
    : (["chest", "back", "legs", "shoulders", "core"] as MuscleGroup[]);
  const minutes = Math.max(20, preference.minutesPerSession || 45);
  const available = allExercises.filter((item) =>
    preference.equipment.length === 0 || item.equipment.some((entry) => preference.equipment.includes(entry))
  );

  return focusList.slice(0, Math.max(1, preference.daysPerWeek || 4)).map((focus, index) => {
    const pool = available.filter((item) => item.primaryMuscleGroup === focus);
    const fallback = available.filter((item) => item.primaryMuscleGroup !== "cardio");
    const picked = (pool.length > 0 ? pool : fallback).slice(0, 4);
    const cardio = available.find((item) => item.primaryMuscleGroup === "cardio");
    const items = picked.map((item) => ({
      exerciseId: item.id,
      sets: 0,
      reps: "参考动作",
      minutes: Math.max(6, Math.round((minutes * (1 - preference.cardioRatio)) / Math.max(1, picked.length)))
    }));

    if (cardio && preference.cardioRatio > 0.1) {
      items.push({
        exerciseId: cardio.id,
        sets: 0,
        reps: "参考有氧",
        minutes: Math.max(8, Math.round(minutes * preference.cardioRatio))
      });
    }

    return {
      id: `workout-${focus}-${index}`,
      title: `${muscleGroupLabels[focus]}训练`,
      focus,
      estimatedMinutes: minutes,
      exercises: items
    };
  });
}

export const muscleGroupLabels: Record<MuscleGroup, string> = {
  chest: "胸部",
  back: "背部",
  legs: "腿部",
  shoulders: "肩部",
  arms: "手臂",
  core: "核心",
  cardio: "有氧"
};

function food(
  id: string,
  name: string,
  aliases: string[],
  category: FoodCategory,
  caloriesPer100g: number,
  proteinPer100g: number,
  fatPer100g: number,
  carbsPer100g: number,
  defaultUnitGram: number,
  units: Array<[string, number]> = []
): Food {
  return {
    id,
    name,
    aliases,
    category,
    caloriesPer100g,
    proteinPer100g,
    fatPer100g,
    carbsPer100g,
    defaultUnitGram,
    servingUnits: units.map(([unitName, grams]) => ({ name: unitName, grams })),
    source: "builtin",
    confidenceLevel: "high"
  };
}

function exercise(id: string, name: string, aliases: string[], primaryMuscleGroup: MuscleGroup, equipment: string[], met: number): Exercise {
  return { id, name, aliases, primaryMuscleGroup, equipment, met };
}

function foodPriorityWeight(foodItem: Food): number {
  switch (foodItem.category) {
    case "protein":
      return 1.35;
    case "vegetable":
      return 0.65;
    case "fruit":
      return 0.55;
    case "drink":
      return 0.45;
    case "snack":
      return 0.35;
    case "fastfood":
      return 1.1;
    default:
      return 1;
  }
}

function buildPortion(foodItem: Food, grams: number, meal: NonNullable<FoodPortion["meal"]>): FoodPortion {
  const roundedGrams = Math.max(5, Math.round(grams / 5) * 5);
  return {
    foodId: foodItem.id,
    name: foodItem.name,
    grams: roundedGrams,
    meal,
    totals: calculateFoodTotals(foodItem, roundedGrams)
  };
}

function canSplitForMealPlanning(foodItem: Food): boolean {
  const text = foodDescriptorText(foodItem);

  // 生活常识规则：能稳定保存、能按克取用的食物才拆分；单个成品、现做碗餐和易坏整果按一份处理。
  if (foodItem.category === "vegetable") return true;
  if (foodItem.category === "supplement") return true;
  if (foodItem.category === "dish" || foodItem.category === "fastfood") return isClearlyShareablePreparedFood(text);
  if (foodItem.category === "fruit") return isShareableFruit(text, foodItem);
  if (foodItem.category === "snack") return isStorableSnack(text);
  if (foodItem.category === "drink") return isResealableDrink(text, foodItem);
  if (foodItem.category === "protein") return !isSmallWholeUnit(foodItem, text);
  if (foodItem.category === "staple") return !isSmallWholeUnit(foodItem, text) && !isCookedBowlFood(text);
  return true;
}

function wholeServingGrams(foodItem: Food): number {
  return clampToServing(foodItem, bestServingGram(foodItem));
}

function bestServingGram(foodItem: Food): number {
  const usefulUnit = foodItem.servingUnits?.find((unit) => isWholeServingUnit(unit.name));
  return usefulUnit?.grams ?? foodItem.defaultUnitGram;
}

function preferredWholeServingMeal(foodItem: Food, index: number): NonNullable<FoodPortion["meal"]> {
  if (foodItem.category === "fruit" || foodItem.category === "snack" || foodItem.category === "drink") return "snack";
  if (foodItem.category === "protein" || /蛋|egg/i.test(foodDescriptorText(foodItem))) return "breakfast";
  if (foodItem.category === "staple" && /包子|馒头|烧饼|贝果|饭团|面包|bread|bagel/i.test(foodDescriptorText(foodItem))) {
    return index % 2 === 0 ? "breakfast" : "lunch";
  }
  return index % 2 === 0 ? "lunch" : "dinner";
}

function foodDescriptorText(foodItem: Food): string {
  return [foodItem.name, ...foodItem.aliases, foodItem.id, ...(foodItem.servingUnits?.map((unit) => unit.name) ?? [])].join(" ");
}

function isClearlyShareablePreparedFood(text: string): boolean {
  if (/披萨|比萨|pizza|烤鸡|炸鸡|火锅|冒菜/i.test(text)) return true;
  return false;
}

function isShareableFruit(text: string, foodItem: Food): boolean {
  if (/西瓜|哈密瓜|蜜瓜|榴莲|菠萝|葡萄|蓝莓|草莓|樱桃|莓|瓜|melon|berry|grape/i.test(text)) return true;
  if (/香蕉|苹果|橙|橘|梨|桃|芒果|猕猴桃|奇异果|火龙果|山竹|banana|apple|orange|kiwi|mango/i.test(text)) return false;
  return foodItem.defaultUnitGram >= 250 && !isSmallWholeUnit(foodItem, text);
}

function isStorableSnack(text: string): boolean {
  if (/冰淇淋|雪糕|蛋糕|奶油|布丁|果冻|龟苓膏|烧仙草|月饼|蛋黄酥|包子|热食/i.test(text)) return false;
  if (/饼干|曲奇|威化|薯片|锅巴|仙贝|雪饼|米饼|坚果|花生|腰果|杏仁|核桃|开心果|肉干|肉脯|牛肉干|猪肉脯|海苔|果干|芒果干|辣条|魔芋爽|面包干|膨化|干|biscuit|cookie|chips|nuts/i.test(text)) return true;
  return false;
}

function isResealableDrink(text: string, foodItem: Food): boolean {
  if (/奶茶|豆浆|咖啡|拿铁|酸奶|杯|罐|milk.?tea|latte|coffee|yogurt/i.test(text)) return false;
  return Boolean(foodItem.servingUnits?.some((unit) => /瓶|盒|carton|bottle/i.test(unit.name)));
}

function isSmallWholeUnit(foodItem: Food, text: string): boolean {
  if (/米饭|面条|燕麦|土豆|红薯|玉米|rice|noodle|oat/i.test(text)) return false;
  if (/包子|馒头|烧饼|汉堡|贝果|饭团|鸡蛋|鸭蛋|蛋白棒|香肠|热干面|豌杂面|牛肉面|拉面|米线|粉丝|方便面|泡面|桶面|杯面|instant/i.test(text)) return true;
  if (foodItem.servingUnits?.some((unit) => isWholeServingUnit(unit.name) && unit.grams <= 180)) return true;
  return false;
}

function isCookedBowlFood(text: string): boolean {
  return /热干面|豌杂面|牛肉面|拉面|米线|粉丝|粥|汤面|拌面|炒饭|盖饭|饭团|方便面|泡面|桶面|杯面|instant/i.test(text);
}

function isWholeServingUnit(unitName: string): boolean {
  return /个|根|颗|只|枚|块|片|包|袋|桶|碗|份|杯|罐|瓶|盒/.test(unitName);
}

function gramsForCalories(foodItem: Food, calories: number, meal: NonNullable<FoodPortion["meal"]>): number {
  const grams = (calories / Math.max(20, foodItem.caloriesPer100g)) * 100;
  const max = portionMaxGrams(foodItem, meal);
  const min = portionMinGrams(foodItem);
  return clamp(grams, min, max);
}

function clampToServing(foodItem: Food, grams: number): number {
  return clamp(grams, portionMinGrams(foodItem), portionMaxGrams(foodItem, "lunch"));
}

function portionMinGrams(foodItem: Food): number {
  if (foodItem.category === "vegetable") return 80;
  if (foodItem.category === "drink") return 150;
  if (foodItem.category === "snack") return 20;
  if (foodItem.category === "supplement") return 20;
  return 40;
}

function portionMaxGrams(foodItem: Food, meal: NonNullable<FoodPortion["meal"]>): number {
  if (foodItem.category === "vegetable") return meal === "breakfast" ? 120 : 220;
  if (foodItem.category === "fruit") return 200;
  if (foodItem.category === "staple") return meal === "breakfast" ? 160 : 260;
  if (foodItem.category === "protein") return meal === "breakfast" ? 120 : 180;
  if (foodItem.category === "supplement") return 40;
  if (foodItem.category === "drink") return 500;
  if (foodItem.category === "snack") return 60;
  return 420;
}

function pickNext(candidates: Food[], portions: FoodPortion[]): Food | undefined {
  if (candidates.length === 0) return undefined;
  const counts = new Map<string, number>();
  portions.forEach((portion) => counts.set(portion.foodId, (counts.get(portion.foodId) ?? 0) + 1));
  return candidates
    .slice()
    .sort((left, right) => (counts.get(left.id) ?? 0) - (counts.get(right.id) ?? 0))[0];
}

function mergePortions(portions: FoodPortion[]): FoodPortion[] {
  const merged = new Map<string, FoodPortion>();
  portions.forEach((portion) => {
    const key = `${portion.meal ?? ""}:${portion.foodId}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, portion);
      return;
    }
    const grams = existing.grams + portion.grams;
    const foodItem = foods.find((item) => item.id === portion.foodId) ?? portionToFoodFallback(portion);
    merged.set(key, {
      ...existing,
      grams,
      totals: calculateFoodTotals(foodItem, grams)
    });
  });
  return Array.from(merged.values());
}

function portionToFoodFallback(portion: FoodPortion): Food {
  const factor = Math.max(1, portion.grams) / 100;
  return {
    id: portion.foodId,
    name: portion.name,
    aliases: [],
    category: "dish",
    caloriesPer100g: portion.totals.calories / factor,
    proteinPer100g: portion.totals.proteinG / factor,
    fatPer100g: portion.totals.fatG / factor,
    carbsPer100g: portion.totals.carbsG / factor,
    defaultUnitGram: portion.grams
  };
}
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
