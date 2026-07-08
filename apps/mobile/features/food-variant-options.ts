import type { Food } from "@fitness-calendar/shared";

export type FoodVariantProfile = Pick<Food, "caloriesPer100g" | "proteinPer100g" | "fatPer100g" | "carbsPer100g">;

export type FoodVariantKind = "processing" | "filling" | "sweetness" | "cooking" | "flavor" | "fatLevel" | "topping";

export type FoodVariantOption = {
  label: string;
  kind: FoodVariantKind;
  hint: string;
  profile?: FoodVariantProfile;
};

export type FoodVariantContext = {
  inputText?: string;
  grams?: number;
  quantity?: number;
  unit?: string;
};

type FoodVariantFamily =
  | "egg-cooking"
  | "tofu-pudding-flavor"
  | "tofu-product"
  | "raw-protein-cooking"
  | "peanut-processing"
  | "nut-processing"
  | "dumpling-filling"
  | "bun-filling"
  | "wonton-filling"
  | "bread-type"
  | "protein-powder-type"
  | "chocolate-cacao"
  | "brownie-type"
  | "milk-tea-sweetness"
  | "drink-sweetness"
  | "coffee-sweetness"
  | "milk-fat"
  | "yogurt-sweetness"
  | "popcorn-processing"
  | "fried-skewer-type"
  | "hotpot-ingredient-type"
  | "hotpot-spicy"
  | "luosifen-topping"
  | "congee-flavor"
  | "soup-base"
  | "noodle-style"
  | "sauce-type"
  | "cake-dessert-type"
  | "sausage-processing"
  | "rice-cooking-method"
  | "hotpot-broth-type"
  | "stir-fry-oil-level"
  | "porridge-type"
  | "chinese-pickle-type";

type FoodForVariant = Pick<Food, "id" | "name" | "aliases" | "category">;

export type FoodVariantDetailStatus = {
  groupLabel: string;
  options: FoodVariantOption[];
  needsDetails: boolean;
  detailHint?: string;
};

type FamilyRule = {
  family: FoodVariantFamily;
  terms: string[];
  exclude?: string[];
  categories?: Food["category"][];
  requireContextTerm?: boolean;
};

const defaultDishVariant = "APP默认做法";
const defaultFoodVariant = "标准食物数据";

const foodVariantFamilyLabels: Record<FoodVariantFamily, string> = {
  "egg-cooking": "鸡蛋做法",
  "tofu-pudding-flavor": "豆腐脑口味",
  "tofu-product": "豆制品类型",
  "raw-protein-cooking": "蛋白质做法",
  "peanut-processing": "花生加工方式",
  "nut-processing": "坚果加工方式",
  "dumpling-filling": "水饺馅料",
  "bun-filling": "包子馅料",
  "wonton-filling": "馄饨馅料",
  "bread-type": "面包类型",
  "protein-powder-type": "蛋白粉类型",
  "chocolate-cacao": "巧克力可可含量",
  "brownie-type": "布朗尼类型",
  "milk-tea-sweetness": "奶茶糖度/小料",
  "drink-sweetness": "饮品糖度",
  "coffee-sweetness": "咖啡糖度",
  "milk-fat": "牛奶脂肪类型",
  "yogurt-sweetness": "酸奶类型",
  "popcorn-processing": "爆米花口味",
  "fried-skewer-type": "炸串食材类型",
  "hotpot-ingredient-type": "火锅食材类型",
  "hotpot-spicy": "火锅汤底/蘸料",
  "luosifen-topping": "螺蛳粉加料",
  "congee-flavor": "粥品类型",
  "soup-base": "汤品类型",
  "noodle-style": "面食做法",
  "sauce-type": "酱料类型",
  "cake-dessert-type": "甜品类型",
  "sausage-processing": "肠类加工类型",
  "rice-cooking-method": "米饭做法",
  "hotpot-broth-type": "火锅锅底类型",
  "stir-fry-oil-level": "炒菜油量",
  "porridge-type": "粥品类型",
  "chinese-pickle-type": "腌制食品类型",
};

const foodVariantFamilies: Record<FoodVariantFamily, FoodVariantOption[]> = {
  "egg-cooking": [
    variant("水煮蛋", "cooking", "水煮鸡蛋，不额外引入烹调用油", { caloriesPer100g: 151, proteinPer100g: 12.8, fatPer100g: 10.5, carbsPer100g: 1.1 }),
    variant("煎蛋", "cooking", "煎制会带入少量油脂", { caloriesPer100g: 199, proteinPer100g: 13.6, fatPer100g: 15.3, carbsPer100g: 1.5 }),
    variant("炸蛋", "cooking", "油炸吸油，热量明显高于水煮蛋", { caloriesPer100g: 245, proteinPer100g: 13, fatPer100g: 20, carbsPer100g: 1.7 }),
    variant("卤蛋", "cooking", "卤汁和调味料会影响钠和少量热量", { caloriesPer100g: 170, proteinPer100g: 13, fatPer100g: 11.5, carbsPer100g: 2 }),
    variant("蒸蛋", "cooking", "也叫鸡蛋羹或水蒸蛋，含水量高，单位重量热量低于整颗鸡蛋", { caloriesPer100g: 62, proteinPer100g: 5.5, fatPer100g: 4, carbsPer100g: 1.2 }),
  ],
  "tofu-pudding-flavor": [
    variant("咸豆腐脑", "flavor", "北方常见咸卤版本，卤汁和配料会增加碳水和钠", { caloriesPer100g: 48, proteinPer100g: 2.6, fatPer100g: 1.8, carbsPer100g: 5.4 }),
    variant("甜豆腐脑", "flavor", "加糖浆或糖水，热量主要受糖量影响", { caloriesPer100g: 70, proteinPer100g: 2.4, fatPer100g: 1.6, carbsPer100g: 11 }),
    variant("原味豆花", "flavor", "不额外加糖或咸卤，按豆制品本体估算", { caloriesPer100g: 35, proteinPer100g: 2.8, fatPer100g: 1.5, carbsPer100g: 2.5 }),
    variant("辣卤豆腐脑", "flavor", "咸卤基础上加入辣油或调味料，脂肪更高", { caloriesPer100g: 78, proteinPer100g: 2.8, fatPer100g: 4.2, carbsPer100g: 6 }),
  ],
  "tofu-product": [
    variant("嫩豆腐", "processing", "包含内酯豆腐、绢豆腐等含水量高的嫩豆腐，适合凉拌、蒸或汤菜估算", { caloriesPer100g: 50, proteinPer100g: 5.0, fatPer100g: 1.9, carbsPer100g: 3.3 }),
    variant("老豆腐", "processing", "包含北豆腐、卤水豆腐等质地更紧实的豆腐，蛋白和热量略高", { caloriesPer100g: 98, proteinPer100g: 12.2, fatPer100g: 4.8, carbsPer100g: 1.5 }),
    variant("豆腐干", "processing", "也叫香干或豆干，脱水后单位重量蛋白和热量更高", { caloriesPer100g: 160, proteinPer100g: 17, fatPer100g: 9, carbsPer100g: 4 }),
    variant("油豆腐", "processing", "也叫豆泡，油炸豆制品，脂肪明显高于普通豆腐", { caloriesPer100g: 245, proteinPer100g: 17, fatPer100g: 17, carbsPer100g: 5 }),
    variant("豆腐皮", "processing", "也叫千张、百叶或干豆腐，薄片豆制品，蛋白密度高", { caloriesPer100g: 260, proteinPer100g: 24, fatPer100g: 15, carbsPer100g: 6 }),
  ],
  "raw-protein-cooking": [
    variant("水煮", "cooking", "水煮少油，适合减脂估算"),
    variant("清蒸", "cooking", "清蒸少油，适合保留食物本身热量"),
    variant("煎炒", "cooking", "会增加烹调用油"),
    variant("油炸", "cooking", "吸油后热量明显升高"),
    variant("卤制", "cooking", "卤汁和盐分会影响估算"),
    variant("酱烧", "cooking", "酱汁和糖盐会影响热量"),
  ],
  "peanut-processing": [
    variant("生花生", "processing", "未经烹调，热量接近坚果原始值", { caloriesPer100g: 563, proteinPer100g: 25, fatPer100g: 44, carbsPer100g: 15 }),
    variant("水煮花生", "processing", "含水量更高，单位重量热量更低", { caloriesPer100g: 313, proteinPer100g: 12, fatPer100g: 25.4, carbsPer100g: 13 }),
    variant("炒花生", "processing", "干炒或少油炒制", { caloriesPer100g: 589, proteinPer100g: 24.1, fatPer100g: 44.3, carbsPer100g: 21.7 }),
    variant("油炸花生", "processing", "吸油后脂肪和热量更高", { caloriesPer100g: 583, proteinPer100g: 22.2, fatPer100g: 47.1, carbsPer100g: 26.2 }),
  ],
  "nut-processing": [
    variant("原味坚果", "processing", "不额外加糖盐，按坚果本体估算"),
    variant("盐焗坚果", "processing", "钠更高，热量接近原味"),
    variant("糖衣坚果", "processing", "蜂蜜或糖衣会增加碳水和热量"),
    variant("裹粉油炸坚果", "processing", "额外油脂或裹粉会显著增加热量"),
  ],
  "dumpling-filling": [
    variant("猪肉大葱馅", "filling", "肉馅含脂肪，热量通常更高", { caloriesPer100g: 244, proteinPer100g: 9, fatPer100g: 8, carbsPer100g: 34 }),
    variant("素馅", "filling", "以蔬菜和主食皮为主", { caloriesPer100g: 180, proteinPer100g: 6, fatPer100g: 4, carbsPer100g: 30 }),
    variant("三鲜馅", "filling", "通常含蛋、虾仁或韭菜，蛋白略高", { caloriesPer100g: 205, proteinPer100g: 9, fatPer100g: 6, carbsPer100g: 30 }),
    variant("牛肉馅", "filling", "蛋白更高，脂肪取决于肥瘦", { caloriesPer100g: 245, proteinPer100g: 11, fatPer100g: 9, carbsPer100g: 31 }),
    variant("虾仁馅", "filling", "蛋白较高，脂肪较低", { caloriesPer100g: 185, proteinPer100g: 11, fatPer100g: 4, carbsPer100g: 28 }),
  ],
  "bun-filling": [
    variant("猪肉馅", "filling", "肉馅包子脂肪更高", { caloriesPer100g: 240, proteinPer100g: 9, fatPer100g: 8, carbsPer100g: 34 }),
    variant("牛肉馅", "filling", "蛋白更高，热量取决于肥瘦", { caloriesPer100g: 245, proteinPer100g: 11, fatPer100g: 9, carbsPer100g: 31 }),
    variant("素菜馅", "filling", "蔬菜馅热量通常低于肉馅", { caloriesPer100g: 180, proteinPer100g: 6, fatPer100g: 4, carbsPer100g: 30 }),
    variant("豆沙馅", "filling", "甜馅主要增加碳水和糖", { caloriesPer100g: 250, proteinPer100g: 6, fatPer100g: 4, carbsPer100g: 48 }),
    variant("奶黄馅", "filling", "含糖和油脂，热量通常较高", { caloriesPer100g: 285, proteinPer100g: 7, fatPer100g: 10, carbsPer100g: 42 }),
    variant("流沙馅", "filling", "流沙馅通常含咸蛋黄、糖和油脂，热量较高", { caloriesPer100g: 310, proteinPer100g: 7, fatPer100g: 13, carbsPer100g: 42 }),
  ],
  "wonton-filling": [
    variant("鲜肉馅", "filling", "常规猪肉馄饨估算", { caloriesPer100g: 210, proteinPer100g: 9, fatPer100g: 6, carbsPer100g: 30 }),
    variant("虾仁馅", "filling", "蛋白较高，脂肪较低", { caloriesPer100g: 185, proteinPer100g: 11, fatPer100g: 4, carbsPer100g: 28 }),
    variant("菜肉馅", "filling", "蔬菜和肉混合，热量介于素馅和肉馅之间", { caloriesPer100g: 195, proteinPer100g: 8, fatPer100g: 5, carbsPer100g: 30 }),
  ],
  "bread-type": [
    variant("白吐司", "processing", "普通切片吐司，按常见软面包估算", { caloriesPer100g: 265, proteinPer100g: 9, fatPer100g: 3.2, carbsPer100g: 49 }),
    variant("全麦面包", "processing", "全麦或杂粮面包，纤维更多，热量略低", { caloriesPer100g: 240, proteinPer100g: 9, fatPer100g: 3, carbsPer100g: 45 }),
    variant("甜面包", "processing", "豆沙、奶酥、菠萝包等含糖和油脂更多", { caloriesPer100g: 360, proteinPer100g: 8, fatPer100g: 14, carbsPer100g: 50 }),
    variant("欧包/法棍", "processing", "硬质面包，通常油糖较少但单位重量较实", { caloriesPer100g: 270, proteinPer100g: 9, fatPer100g: 1.5, carbsPer100g: 56 }),
    variant("贝果", "processing", "贝果密度高，一个通常接近 90g", { caloriesPer100g: 250, proteinPer100g: 10, fatPer100g: 3, carbsPer100g: 46 }),
    variant("餐包", "processing", "小圆餐包或软欧小面包，按单个小面包估算", { caloriesPer100g: 300, proteinPer100g: 8, fatPer100g: 7, carbsPer100g: 52 }),
    variant("夹心/奶油面包", "processing", "夹心、奶油或肉松类，糖油明显更高", { caloriesPer100g: 390, proteinPer100g: 8, fatPer100g: 18, carbsPer100g: 50 }),
  ],
  "protein-powder-type": [
    variant("乳清蛋白", "processing", "常规乳清蛋白粉，按健身补剂常见配方估算", { caloriesPer100g: 390, proteinPer100g: 75, fatPer100g: 6, carbsPer100g: 8 }),
    variant("分离乳清蛋白", "processing", "蛋白占比更高，脂肪和碳水通常更低", { caloriesPer100g: 370, proteinPer100g: 86, fatPer100g: 2, carbsPer100g: 4 }),
    variant("酪蛋白", "processing", "缓释蛋白粉，宏量营养接近乳清但吸收节奏不同", { caloriesPer100g: 380, proteinPer100g: 78, fatPer100g: 4, carbsPer100g: 8 }),
    variant("植物蛋白", "processing", "豌豆、大豆等植物蛋白，碳水略高", { caloriesPer100g: 380, proteinPer100g: 70, fatPer100g: 6, carbsPer100g: 10 }),
    variant("酵母蛋白", "processing", "酵母蛋白粉或片剂，蛋白占比通常低于分离乳清", { caloriesPer100g: 370, proteinPer100g: 55, fatPer100g: 6, carbsPer100g: 22 }),
  ],
  "chocolate-cacao": [
    variant("70%黑巧", "processing", "高可可黑巧，脂肪高、糖低于牛奶巧克力", { caloriesPer100g: 580, proteinPer100g: 8, fatPer100g: 43, carbsPer100g: 34 }),
    variant("85%黑巧", "processing", "更高可可含量，脂肪更高、糖更低", { caloriesPer100g: 600, proteinPer100g: 10, fatPer100g: 48, carbsPer100g: 24 }),
    variant("牛奶巧克力", "processing", "含奶粉和糖更多，碳水高于高可可黑巧", { caloriesPer100g: 546, proteinPer100g: 5, fatPer100g: 31, carbsPer100g: 61 }),
    variant("夹心巧克力", "processing", "夹心、坚果或饼干会改变热量结构", { caloriesPer100g: 560, proteinPer100g: 6, fatPer100g: 34, carbsPer100g: 56 }),
  ],
  "brownie-type": [
    variant("原味布朗尼", "processing", "按常见巧克力布朗尼估算", { caloriesPer100g: 420, proteinPer100g: 6, fatPer100g: 22, carbsPer100g: 50 }),
    variant("黑巧布朗尼", "processing", "黑巧比例更高，脂肪略高、甜度略低", { caloriesPer100g: 430, proteinPer100g: 6, fatPer100g: 24, carbsPer100g: 48 }),
    variant("坚果布朗尼", "topping", "加入核桃等坚果，脂肪和热量更高", { caloriesPer100g: 460, proteinPer100g: 7, fatPer100g: 28, carbsPer100g: 46 }),
    variant("低糖布朗尼", "processing", "低糖版本，碳水通常略低", { caloriesPer100g: 360, proteinPer100g: 8, fatPer100g: 18, carbsPer100g: 36 }),
  ],
  "milk-tea-sweetness": [
    variant("无糖", "sweetness", "不额外加糖，不含额外小料", { caloriesPer100g: 28, proteinPer100g: 0.8, fatPer100g: 1.2, carbsPer100g: 3 }),
    variant("少糖", "sweetness", "糖量较低，不含额外小料", { caloriesPer100g: 35, proteinPer100g: 0.8, fatPer100g: 1.2, carbsPer100g: 5 }),
    variant("标准糖", "sweetness", "按常规含糖奶茶估算", { caloriesPer100g: 62, proteinPer100g: 1.1, fatPer100g: 1.8, carbsPer100g: 10.5 }),
    variant("加小料", "topping", "珍珠、椰果、奶盖会显著增加热量", { caloriesPer100g: 86, proteinPer100g: 1.3, fatPer100g: 2.8, carbsPer100g: 14 }),
  ],
  "drink-sweetness": [
    variant("无糖", "sweetness", "不额外加糖，饮品热量主要来自原料本身"),
    variant("三分糖", "sweetness", "少量加糖，适合用户没有给出精确糖量时估算"),
    variant("五分糖", "sweetness", "中等甜度，热量比无糖明显更高"),
    variant("七分糖", "sweetness", "偏甜版本，糖带来的热量需要计入"),
    variant("全糖", "sweetness", "按常规高糖饮品估算"),
  ],
  "coffee-sweetness": [
    variant("无糖", "sweetness", "不额外加糖，按咖啡和奶本身估算"),
    variant("加糖", "sweetness", "加入糖浆或砂糖，热量随糖量上升"),
    variant("半糖", "sweetness", "糖量低于常规甜咖啡"),
    variant("全糖", "sweetness", "按常规甜咖啡估算"),
  ],
  "milk-fat": [
    variant("全脂", "fatLevel", "全脂奶脂肪和热量更高", { caloriesPer100g: 61, proteinPer100g: 3.2, fatPer100g: 3.4, carbsPer100g: 4.8 }),
    variant("低脂", "fatLevel", "低脂奶减少部分脂肪", { caloriesPer100g: 45, proteinPer100g: 3.4, fatPer100g: 1.5, carbsPer100g: 5 }),
    variant("脱脂", "fatLevel", "脱脂奶脂肪较低，热量更低", { caloriesPer100g: 34, proteinPer100g: 3.4, fatPer100g: 0.2, carbsPer100g: 5 }),
  ],
  "yogurt-sweetness": [
    variant("无糖酸奶", "sweetness", "不额外加糖，按酸奶本体估算", { caloriesPer100g: 60, proteinPer100g: 4, fatPer100g: 3, carbsPer100g: 4 }),
    variant("低糖酸奶", "sweetness", "糖量低于常规风味酸奶", { caloriesPer100g: 72, proteinPer100g: 3.5, fatPer100g: 2.7, carbsPer100g: 8.5 }),
    variant("风味酸奶", "sweetness", "含糖或果酱，碳水更高", { caloriesPer100g: 95, proteinPer100g: 3, fatPer100g: 2.5, carbsPer100g: 15 }),
    variant("希腊酸奶", "processing", "蛋白密度更高，需按是否加糖再估算", { caloriesPer100g: 90, proteinPer100g: 8, fatPer100g: 4, carbsPer100g: 4 }),
  ],
  "popcorn-processing": [
    variant("原味无油", "processing", "少油少糖版本", { caloriesPer100g: 375, proteinPer100g: 12, fatPer100g: 4, carbsPer100g: 74 }),
    variant("焦糖爆米花", "processing", "糖浆会显著增加热量", { caloriesPer100g: 430, proteinPer100g: 6, fatPer100g: 12, carbsPer100g: 74 }),
    variant("黄油爆米花", "processing", "黄油提高脂肪和热量", { caloriesPer100g: 520, proteinPer100g: 7, fatPer100g: 31, carbsPer100g: 52 }),
  ],
  "fried-skewer-type": [
    variant("蔬菜串", "filling", "蔬菜为主，热量主要来自油炸吸油"),
    variant("肉串", "filling", "肉类蛋白更多，脂肪取决于部位"),
    variant("豆制品串", "filling", "豆皮、豆泡等吸油差异较大"),
    variant("主食串", "filling", "年糕、面筋等碳水更高"),
  ],
  "hotpot-ingredient-type": [
    variant("鲜肉卷", "filling", "肥牛卷、肥羊卷等脂肪差异大", { caloriesPer100g: 295, proteinPer100g: 15, fatPer100g: 26, carbsPer100g: 1 }),
    variant("丸滑类", "filling", "牛肉丸、鱼丸、虾滑等含淀粉和调味", { caloriesPer100g: 150, proteinPer100g: 12, fatPer100g: 6, carbsPer100g: 10 }),
    variant("内脏脆口", "filling", "毛肚、鸭肠等蛋白高，热量主要受蘸料影响", { caloriesPer100g: 105, proteinPer100g: 14, fatPer100g: 5, carbsPer100g: 1 }),
    variant("豆制品", "filling", "油豆腐、腐竹、豆皮等吸汤吸油后热量变化明显", { caloriesPer100g: 220, proteinPer100g: 16, fatPer100g: 13, carbsPer100g: 9 }),
    variant("蔬菜菌菇", "filling", "蔬菜和菌菇本体热量低，主要看锅底和蘸料", { caloriesPer100g: 35, proteinPer100g: 2, fatPer100g: 1, carbsPer100g: 6 }),
  ],
  "hotpot-spicy": [
    variant("清汤", "flavor", "汤底油脂较低", { caloriesPer100g: 140, proteinPer100g: 7.5, fatPer100g: 7.0, carbsPer100g: 11.0 }),
    variant("菌汤", "flavor", "菌汤汤底油脂通常较低，但需注意额外蘸料", { caloriesPer100g: 150, proteinPer100g: 7.8, fatPer100g: 7.5, carbsPer100g: 11.0 }),
    variant("番茄汤", "flavor", "番茄汤底中等热量", { caloriesPer100g: 165, proteinPer100g: 7.8, fatPer100g: 8.0, carbsPer100g: 14.0 }),
    variant("麻辣红油", "flavor", "红油汤底会显著增加脂肪", { caloriesPer100g: 220, proteinPer100g: 8.0, fatPer100g: 15.0, carbsPer100g: 11.0 }),
    variant("蘸料多", "topping", "芝麻酱、油碟和花生碎会增加热量", { caloriesPer100g: 250, proteinPer100g: 8.5, fatPer100g: 20.0, carbsPer100g: 12.0 }),
  ],
  "luosifen-topping": [
    variant("原味螺蛳粉", "flavor", "不额外加炸蛋、叉烧等高热量加料", { caloriesPer100g: 130, proteinPer100g: 3, fatPer100g: 4, carbsPer100g: 22 }),
    variant("炸蛋螺蛳粉", "topping", "炸蛋吸油，会显著增加脂肪和热量", { caloriesPer100g: 165, proteinPer100g: 5, fatPer100g: 7, carbsPer100g: 22 }),
    variant("叉烧螺蛳粉", "topping", "加入叉烧或肉类浇头，蛋白和脂肪更高", { caloriesPer100g: 155, proteinPer100g: 6, fatPer100g: 6, carbsPer100g: 21 }),
    variant("加腐竹花生", "topping", "腐竹和花生会增加脂肪、蛋白和总热量", { caloriesPer100g: 170, proteinPer100g: 6, fatPer100g: 8, carbsPer100g: 20 }),
    variant("重油辣螺蛳粉", "flavor", "红油更多，脂肪和热量更高", { caloriesPer100g: 180, proteinPer100g: 4, fatPer100g: 9, carbsPer100g: 22 }),
  ],
  "congee-flavor": [
    variant("白粥", "flavor", "不含额外肉蛋配料", { caloriesPer100g: 46, proteinPer100g: 1.1, fatPer100g: 0.1, carbsPer100g: 10.0 }),
    variant("皮蛋瘦肉粥", "flavor", "含皮蛋和瘦肉，蛋白和脂肪更高", { caloriesPer100g: 68, proteinPer100g: 3.5, fatPer100g: 1.5, carbsPer100g: 9.5 }),
    variant("海鲜粥", "flavor", "海鲜提高蛋白，油脂通常较低", { caloriesPer100g: 62, proteinPer100g: 4.0, fatPer100g: 0.8, carbsPer100g: 9.5 }),
    variant("甜粥", "flavor", "加糖或红豆等配料，碳水更高", { caloriesPer100g: 65, proteinPer100g: 1.2, fatPer100g: 0.2, carbsPer100g: 14.5 }),
  ],
  "soup-base": [
    variant("清汤", "flavor", "油脂较低，主要按汤料本体估算", { caloriesPer100g: 28, proteinPer100g: 1.2, fatPer100g: 0.4, carbsPer100g: 4.0 }),
    variant("肉汤", "flavor", "排骨汤、鸡汤等肉汤脂肪和蛋白更高", { caloriesPer100g: 42, proteinPer100g: 2.2, fatPer100g: 1.6, carbsPer100g: 4.5 }),
    variant("奶白浓汤", "flavor", "乳化脂肪更多，热量更高", { caloriesPer100g: 68, proteinPer100g: 2.4, fatPer100g: 4.2, carbsPer100g: 5.0 }),
    variant("酸辣汤", "flavor", "酸辣调味和淀粉可能增加热量", { caloriesPer100g: 52, proteinPer100g: 1.8, fatPer100g: 1.8, carbsPer100g: 7.0 }),
    variant("麻辣汤", "flavor", "麻辣调味油会提高脂肪和热量", { caloriesPer100g: 75, proteinPer100g: 2.0, fatPer100g: 5.0, carbsPer100g: 5.5 }),
  ],
  "noodle-style": [
    variant("清汤", "flavor", "汤底油脂较低", { caloriesPer100g: 110, proteinPer100g: 3.8, fatPer100g: 0.8, carbsPer100g: 22 }),
    variant("红烧面", "flavor", "红烧汤底和浇头含油盐糖", { caloriesPer100g: 135, proteinPer100g: 4.2, fatPer100g: 2.5, carbsPer100g: 24 }),
    variant("酱香面", "flavor", "酱料会影响热量和钠", { caloriesPer100g: 140, proteinPer100g: 4.0, fatPer100g: 3.0, carbsPer100g: 24 }),
    variant("拌面", "flavor", "酱料和拌油会影响热量", { caloriesPer100g: 150, proteinPer100g: 4.0, fatPer100g: 4.5, carbsPer100g: 24 }),
    variant("炒面", "cooking", "烹调用油会显著增加热量", { caloriesPer100g: 180, proteinPer100g: 4.2, fatPer100g: 6.0, carbsPer100g: 25 }),
    variant("炒粉", "cooking", "烹调用油会显著增加热量", { caloriesPer100g: 175, proteinPer100g: 3.8, fatPer100g: 5.5, carbsPer100g: 26 }),
  ],
  "sauce-type": [
    variant("芝麻酱/麻酱", "processing", "芝麻本体脂肪高，一小勺也会明显增加热量", { caloriesPer100g: 630, proteinPer100g: 18, fatPer100g: 54, carbsPer100g: 19 }),
    variant("油碟/香油", "processing", "基本按食用油估算，热量密度最高", { caloriesPer100g: 880, proteinPer100g: 0, fatPer100g: 100, carbsPer100g: 0 }),
    variant("沙拉酱", "processing", "常见蛋黄酱基底，脂肪和糖都需要计入", { caloriesPer100g: 480, proteinPer100g: 1, fatPer100g: 45, carbsPer100g: 18 }),
    variant("蛋黄酱", "processing", "脂肪密度高，重量小但热量高", { caloriesPer100g: 680, proteinPer100g: 1, fatPer100g: 75, carbsPer100g: 2 }),
    variant("花生酱", "processing", "坚果酱脂肪高，也有一定蛋白质", { caloriesPer100g: 600, proteinPer100g: 24, fatPer100g: 50, carbsPer100g: 22 }),
    variant("辣椒油/红油", "processing", "主要按油脂估算，少量即可增加热量", { caloriesPer100g: 880, proteinPer100g: 0, fatPer100g: 100, carbsPer100g: 0 }),
  ],
  "cake-dessert-type": [
    variant("奶油蛋糕", "processing", "奶油和糖较多，脂肪和碳水都高", { caloriesPer100g: 330, proteinPer100g: 5, fatPer100g: 20, carbsPer100g: 34 }),
    variant("芝士蛋糕", "processing", "奶酪和黄油更多，脂肪较高", { caloriesPer100g: 350, proteinPer100g: 7, fatPer100g: 26, carbsPer100g: 22 }),
    variant("慕斯/提拉米苏", "processing", "奶油、奶酪和糖为主，按甜品估算", { caloriesPer100g: 320, proteinPer100g: 6, fatPer100g: 20, carbsPer100g: 28 }),
    variant("蛋挞", "processing", "酥皮和蛋奶馅都贡献热量", { caloriesPer100g: 310, proteinPer100g: 5, fatPer100g: 18, carbsPer100g: 32 }),
    variant("冰淇淋/雪糕", "processing", "奶脂和糖为主，品牌差异较大", { caloriesPer100g: 200, proteinPer100g: 4, fatPer100g: 10, carbsPer100g: 24 }),
    variant("中式甜品", "processing", "双皮奶、龟苓膏等含水高，主要看糖量和奶量", { caloriesPer100g: 95, proteinPer100g: 3, fatPer100g: 3, carbsPer100g: 15 }),
  ],
  "sausage-processing": [
    variant("鸡肉肠", "processing", "健身低脂款通常蛋白较高、脂肪较低", { caloriesPer100g: 150, proteinPer100g: 18, fatPer100g: 7, carbsPer100g: 4 }),
    variant("火腿肠", "processing", "常规即食火腿肠脂肪和淀粉都需要计入", { caloriesPer100g: 220, proteinPer100g: 12, fatPer100g: 16, carbsPer100g: 8 }),
    variant("烤肠/香肠", "processing", "油脂更高，街边烤肠按高脂估算", { caloriesPer100g: 260, proteinPer100g: 12, fatPer100g: 20, carbsPer100g: 8 }),
    variant("低脂高蛋白肠", "processing", "蛋白更高、脂肪较低，但仍需看包装配方", { caloriesPer100g: 130, proteinPer100g: 20, fatPer100g: 4, carbsPer100g: 4 }),
  ],
  "rice-cooking-method": [
    variant("白米饭", "cooking", "标准蒸白米饭，不加调料", { caloriesPer100g: 116, proteinPer100g: 2.6, fatPer100g: 0.3, carbsPer100g: 25.9 }),
    variant("蛋炒饭", "cooking", "含鸡蛋和油脂，热量和脂肪升高", { caloriesPer100g: 163, proteinPer100g: 5.5, fatPer100g: 5.0, carbsPer100g: 24.0 }),
    variant("酱油炒饭", "cooking", "酱油调味，油脂含量适中", { caloriesPer100g: 155, proteinPer100g: 4.0, fatPer100g: 4.5, carbsPer100g: 24.5 }),
    variant("咖喱饭", "cooking", "含咖喱酱汁，脂肪和碳水升高", { caloriesPer100g: 145, proteinPer100g: 4.5, fatPer100g: 4.0, carbsPer100g: 22.5 }),
    variant("拌饭/盖浇饭", "cooking", "带浇头和酱汁，热量取决于浇头", { caloriesPer100g: 155, proteinPer100g: 5.0, fatPer100g: 4.5, carbsPer100g: 23.0 }),
    variant("焖饭/煲仔饭", "cooking", "底部有锅巴，油脂偏多", { caloriesPer100g: 168, proteinPer100g: 5.5, fatPer100g: 6.0, carbsPer100g: 23.5 }),
  ],
  "hotpot-broth-type": [
    variant("牛油麻辣锅", "flavor", "牛油底料脂肪极高，100g底料约450kcal", { caloriesPer100g: 145, proteinPer100g: 1.5, fatPer100g: 12.0, carbsPer100g: 6.0 }),
    variant("清油麻辣锅", "flavor", "植物油底料，比牛油略低", { caloriesPer100g: 120, proteinPer100g: 1.5, fatPer100g: 8.0, carbsPer100g: 8.0 }),
    variant("番茄锅", "flavor", "番茄底料，低脂低热量", { caloriesPer100g: 48, proteinPer100g: 1.2, fatPer100g: 0.8, carbsPer100g: 9.0 }),
    variant("菌汤锅", "flavor", "菌菇底料，清淡低热量", { caloriesPer100g: 42, proteinPer100g: 1.8, fatPer100g: 0.5, carbsPer100g: 7.5 }),
    variant("清汤锅", "flavor", "骨汤或清水底，热量最低", { caloriesPer100g: 35, proteinPer100g: 1.5, fatPer100g: 1.0, carbsPer100g: 5.0 }),
    variant("咖喱锅", "flavor", "咖喱椰浆底料，脂肪和碳水较高", { caloriesPer100g: 85, proteinPer100g: 2.5, fatPer100g: 3.5, carbsPer100g: 11.0 }),
    variant("椰子鸡锅", "flavor", "椰子水底，清甜低脂", { caloriesPer100g: 55, proteinPer100g: 2.0, fatPer100g: 1.5, carbsPer100g: 8.5 }),
  ],
  "stir-fry-oil-level": [
    variant("少油版", "fatLevel", "家庭少油炒法，油脂减半", { caloriesPer100g: 0, proteinPer100g: 0, fatPer100g: -5, carbsPer100g: 0 }),
    variant("正常油量", "fatLevel", "标准餐厅炒菜油量，约10-15g/100g", { caloriesPer100g: 0, proteinPer100g: 0, fatPer100g: 0, carbsPer100g: 0 }),
    variant("多油版", "fatLevel", "油量偏多，脂肪增加约50%", { caloriesPer100g: 0, proteinPer100g: 0, fatPer100g: 7, carbsPer100g: 0 }),
    variant("重油版", "fatLevel", "油量大，如水煮类浇热油，脂肪翻倍", { caloriesPer100g: 0, proteinPer100g: 0, fatPer100g: 15, carbsPer100g: 0 }),
  ],
  "porridge-type": [
    variant("白粥", "flavor", "纯大米粥，热量密度低", { caloriesPer100g: 46, proteinPer100g: 1.1, fatPer100g: 0.1, carbsPer100g: 10.0 }),
    variant("肉粥", "flavor", "含肉末或肉丝，蛋白和热量升高", { caloriesPer100g: 68, proteinPer100g: 3.5, fatPer100g: 1.5, carbsPer100g: 9.5 }),
    variant("甜粥", "flavor", "加糖或红枣/红豆，碳水升高", { caloriesPer100g: 65, proteinPer100g: 1.2, fatPer100g: 0.2, carbsPer100g: 14.5 }),
    variant("杂粮粥", "flavor", "多种谷物混合，纤维丰富", { caloriesPer100g: 58, proteinPer100g: 1.8, fatPer100g: 0.5, carbsPer100g: 12.0 }),
    variant("海鲜粥", "flavor", "含虾/蟹/鱼，蛋白较高", { caloriesPer100g: 62, proteinPer100g: 4.0, fatPer100g: 0.8, carbsPer100g: 9.5 }),
  ],
  "chinese-pickle-type": [
    variant("泡菜/酸菜", "processing", "发酵腌制，低热量高钠", { caloriesPer100g: 22, proteinPer100g: 1.2, fatPer100g: 0.3, carbsPer100g: 4.0 }),
    variant("酱菜/咸菜", "processing", "酱料腌制，钠含量高", { caloriesPer100g: 35, proteinPer100g: 2.0, fatPer100g: 0.5, carbsPer100g: 6.5 }),
    variant("榨菜", "processing", "茎用芥菜腌制，含辣椒油", { caloriesPer100g: 33, proteinPer100g: 2.1, fatPer100g: 0.8, carbsPer100g: 5.4 }),
    variant("糖蒜/腊八蒜", "processing", "糖醋腌制，含糖量较高", { caloriesPer100g: 68, proteinPer100g: 1.5, fatPer100g: 0.2, carbsPer100g: 15.0 }),
  ],
};

const familyRules: FamilyRule[] = [
  {
    family: "tofu-pudding-flavor",
    terms: ["豆腐脑", "豆腐花", "豆花", "dounao", "tofu pudding"],
    exclude: ["豆花米线", "豆花面", "杏仁豆腐"],
  },
  {
    family: "egg-cooking",
    terms: ["鸡蛋羹", "蒸蛋", "水蒸蛋", "炖蛋", "水煮蛋", "煮鸡蛋", "白煮蛋", "煎蛋", "荷包蛋", "炸蛋", "卤蛋", "茶叶蛋", "鸡蛋", "蛋", "egg"],
    exclude: ["蛋糕", "蛋挞", "蛋白棒", "蛋白粉", "蛋卷", "蛋黄酥", "蛋黄酱", "鸡肉肠", "火腿肠", "烤肠", "香肠", "皮蛋瘦肉粥", "紫菜蛋花汤", "番茄炒蛋", "西红柿炒鸡蛋", "韭菜炒蛋", "虾仁滑蛋"],
  },
  {
    family: "peanut-processing",
    terms: ["水煮花生", "煮花生", "油炸花生", "炸花生", "炒花生", "生花生", "花生", "花生米", "落花生", "peanut", "peanuts"],
    exclude: ["花生酱", "花生油", "花生汤", "汤圆", "蛋白棒", "巧克力", "三明治", "螺蛳粉"],
  },
  {
    family: "popcorn-processing",
    terms: ["爆米花", "popcorn"],
  },
  {
    family: "milk-tea-sweetness",
    terms: ["奶茶", "伯牙绝弦", "茶拿铁", "奶盖", "芝士茶", "珍珠奶茶", "水果茶", "柠檬茶"],
  },
  {
    family: "coffee-sweetness",
    terms: ["咖啡", "coffee", "拿铁", "美式", "黑咖啡", "卡布奇诺", "摩卡", "生椰拿铁"],
    exclude: ["咖啡豆", "咖啡粉"],
  },
  {
    family: "drink-sweetness",
    terms: ["豆浆", "豆奶", "椰汁", "冰红茶", "绿茶", "乌龙茶", "果茶", "凉茶", "柠檬水", "饮料", "汽水"],
  },
  {
    family: "milk-fat",
    terms: ["牛奶", "鲜奶", "纯牛奶", "脱脂奶", "低脂奶", "全脂奶"],
    exclude: ["奶茶", "奶盖", "奶油", "奶酪", "奶片", "奶豆腐", "巧克力"],
  },
  {
    family: "yogurt-sweetness",
    terms: ["酸奶", "希腊酸奶", "酸乳", "yogurt"],
  },
  {
    family: "dumpling-filling",
    terms: ["水饺", "饺子", "蒸饺", "煎饺", "锅贴", "速冻水饺", "dumpling"],
    exclude: ["汤圆", "章鱼小丸子"],
  },
  {
    family: "wonton-filling",
    terms: ["馄饨", "云吞", "抄手", "扁食", "wonton"],
  },
  {
    family: "bread-type",
    terms: ["面包", "吐司", "切片面包", "全麦面包", "黑麦面包", "杂粮面包", "甜面包", "菠萝包", "豆沙面包", "奶酥面包", "欧包", "法棍", "贝果", "餐包", "奶油面包", "肉松面包", "bread", "toast", "bagel"],
    exclude: ["面包干", "蒜香面包干", "烤面包干", "汉堡", "汉堡包"],
  },
  {
    family: "protein-powder-type",
    terms: ["蛋白粉", "乳清蛋白", "分离乳清", "酪蛋白", "植物蛋白", "酵母蛋白", "protein powder"],
  },
  {
    family: "brownie-type",
    terms: ["布朗尼", "黑巧布朗尼", "brownie"],
  },
  {
    family: "chocolate-cacao",
    terms: ["黑巧克力", "黑巧", "巧克力", "牛奶巧克力", "chocolate"],
    exclude: ["布朗尼", "巧克力曲奇", "巧克力饼干", "巧克力威化"],
  },
  {
    family: "bun-filling",
    terms: ["包子", "肉包", "菜包", "豆沙包", "奶黄包", "流沙包", "叉烧包", "小笼包", "汤包", "baozi"],
    exclude: ["面包", "汉堡包"],
  },
  {
    family: "tofu-product",
    terms: ["内酯豆腐", "嫩豆腐", "老豆腐", "北豆腐", "南豆腐", "豆腐干", "香干", "豆干", "油豆腐", "豆泡", "豆腐皮", "千张", "干豆腐", "豆腐"],
    exclude: ["豆腐脑", "豆腐花", "豆花", "麻婆豆腐", "家常豆腐", "皮蛋豆腐", "臭豆腐", "鱼豆腐", "杏仁豆腐", "豆花米线", "豆腐汤"],
  },
  {
    family: "hotpot-spicy",
    terms: ["火锅", "麻辣烫", "冒菜", "麻辣香锅", "串串"],
    exclude: ["芝麻酱", "麻酱", "油碟", "沙拉酱", "蛋黄酱", "美乃滋", "花生酱", "辣椒油", "红油"],
  },
  {
    family: "luosifen-topping",
    terms: ["螺蛳粉", "柳州螺蛳粉", "原味螺蛳粉"],
  },
  {
    family: "fried-skewer-type",
    terms: ["炸串", "油炸串"],
  },
  {
    family: "hotpot-ingredient-type",
    terms: ["虾滑", "鱼滑", "牛肉丸", "鱼丸", "贡丸", "蟹棒", "蟹柳", "毛肚", "鸭肠", "肥牛卷", "肥羊卷", "腐竹", "油豆腐", "魔芋结", "竹轮"],
    exclude: ["螺蛳粉"],
  },
  {
    family: "sauce-type",
    terms: ["芝麻酱", "麻酱", "油碟", "香油碟", "沙拉酱", "蛋黄酱", "美乃滋", "花生酱", "辣椒油", "红油", "油泼辣子"],
  },
  {
    family: "cake-dessert-type",
    terms: ["蛋糕", "芝士蛋糕", "巴斯克蛋糕", "提拉米苏", "慕斯", "蛋挞", "双皮奶", "龟苓膏", "冰淇淋", "冰激凌", "雪糕", "冰棍", "甜筒"],
    exclude: ["蛋黄酥", "月饼"],
  },
  {
    family: "sausage-processing",
    terms: ["鸡肉肠", "低脂鸡肉肠", "高蛋白鸡肉肠", "火腿肠", "烤肠", "香肠", "热狗肠"],
  },
  {
    family: "congee-flavor",
    terms: ["粥", "白粥", "皮蛋瘦肉粥", "海鲜粥", "小米粥", "八宝粥"],
  },
  {
    family: "noodle-style",
    terms: ["面条", "拉面", "牛肉面", "热干面", "冷面", "炒面", "拌面", "米线", "酸辣粉", "螺蛳粉", "面"],
    exclude: ["面包", "方便面包", "螺蛳粉", "干脆面"],
  },
  {
    family: "soup-base",
    terms: ["汤", "排骨汤", "鸡汤", "鱼汤", "酸辣汤", "紫菜蛋花汤", "豆腐汤", "味噌汤"],
    exclude: ["奶茶", "花生汤圆", "汤面", "拉面", "牛肉面", "米线", "酸辣粉", "螺蛳粉"],
  },
  {
    family: "nut-processing",
    terms: ["坚果", "腰果", "巴旦木", "杏仁", "核桃", "开心果", "榛子", "夏威夷果", "每日坚果"],
    exclude: ["布朗尼", "巧克力"],
  },
  {
    family: "raw-protein-cooking",
    terms: ["鸡胸", "鸡胸肉", "鸡腿", "鸡肉", "牛肉", "瘦牛肉", "猪肉", "瘦肉", "鱼肉", "鱼片", "虾", "虾仁", "三文鱼", "鳕鱼", "鱿鱼", "蛤蜊", "生蚝", "扇贝", "螃蟹"],
    categories: ["protein"],
    exclude: ["卤牛肉", "酱牛肉", "炸鸡", "烤鸭", "白切鸡", "红烧", "清蒸", "水煮鱼", "酸菜鱼", "糖醋鱼", "鱼香肉丝", "宫保鸡丁", "黄焖鸡", "鸡肉肠", "即食鸡胸肉", "牛肉干", "猪肉脯", "鱼豆腐"],
  },
  {
    family: "rice-cooking-method",
    terms: ["米饭", "炒饭", "蛋炒饭", "盖浇饭", "拌饭", "焖饭", "煲仔饭", "咖喱饭", "饭"],
    exclude: ["饭团", "糯米饭", "抓饭", "手抓饭", "石锅拌饭"],
    requireContextTerm: true,
  },
  {
    family: "hotpot-broth-type",
    terms: ["火锅锅底", "火锅底料", "牛油火锅", "清油火锅", "番茄锅", "菌汤锅", "清汤火锅", "咖喱锅", "椰子鸡"],
    exclude: ["火锅食材", "火锅丸子"],
  },
  {
    family: "stir-fry-oil-level",
    terms: ["少油", "多油", "重油", "油大", "少油版", "多油版"],
    requireContextTerm: true,
  },
  {
    family: "porridge-type",
    terms: ["白粥", "肉粥", "甜粥", "杂粮粥", "海鲜粥", "红薯粥", "绿豆粥", "南瓜粥", "腊八粥"],
    exclude: ["粥底火锅"],
  },
  {
    family: "chinese-pickle-type",
    terms: ["泡菜", "酸菜", "酱菜", "咸菜", "榨菜", "糖蒜", "腊八蒜", "腌萝卜", "腌黄瓜"],
    exclude: ["泡菜饼", "酸菜鱼", "榨菜肉丝"],
  },
];

const explicitVariantTerms: Partial<Record<FoodVariantFamily, Array<{ label: string; terms: string[] }>>> = {
  "egg-cooking": [
    { label: "蒸蛋", terms: ["蒸蛋", "水蒸蛋", "鸡蛋羹", "炖蛋"] },
    { label: "水煮蛋", terms: ["水煮蛋", "煮鸡蛋", "白煮蛋"] },
    { label: "煎蛋", terms: ["煎蛋", "荷包蛋"] },
    { label: "炸蛋", terms: ["炸蛋", "油炸蛋"] },
    { label: "卤蛋", terms: ["卤蛋", "茶叶蛋"] },
  ],
  "tofu-pudding-flavor": [
    { label: "咸豆腐脑", terms: ["咸豆腐脑", "带卤", "咸豆花", "卤豆腐脑"] },
    { label: "甜豆腐脑", terms: ["甜豆腐脑", "甜豆花", "加糖", "糖水豆花"] },
    { label: "原味豆花", terms: ["原味豆花", "原味豆腐脑"] },
    { label: "辣卤豆腐脑", terms: ["辣豆腐脑", "辣卤", "麻辣豆花"] },
  ],
  "tofu-product": [
    { label: "嫩豆腐", terms: ["嫩豆腐", "内酯豆腐", "绢豆腐"] },
    { label: "老豆腐", terms: ["老豆腐", "北豆腐", "卤水豆腐"] },
    { label: "豆腐干", terms: ["豆腐干", "香干", "豆干"] },
    { label: "油豆腐", terms: ["油豆腐", "豆泡", "炸豆腐"] },
    { label: "豆腐皮", terms: ["豆腐皮", "千张", "干豆腐", "百叶"] },
  ],
  "raw-protein-cooking": [
    { label: "水煮", terms: ["水煮"] },
    { label: "清蒸", terms: ["清蒸", "蒸"] },
    { label: "煎炒", terms: ["煎", "炒"] },
    { label: "油炸", terms: ["油炸", "炸"] },
    { label: "卤制", terms: ["卤"] },
    { label: "酱烧", terms: ["酱烧", "红烧"] },
  ],
  "peanut-processing": [
    { label: "水煮花生", terms: ["水煮花生", "煮花生"] },
    { label: "油炸花生", terms: ["油炸花生", "炸花生"] },
    { label: "炒花生", terms: ["炒花生", "熟花生"] },
    { label: "生花生", terms: ["生花生"] },
  ],
  "nut-processing": [
    { label: "原味坚果", terms: ["原味", "无盐"] },
    { label: "盐焗坚果", terms: ["盐焗", "咸味", "海盐"] },
    { label: "糖衣坚果", terms: ["蜂蜜", "糖衣", "琥珀"] },
    { label: "裹粉油炸坚果", terms: ["油炸", "裹粉", "蟹黄味"] },
  ],
  "dumpling-filling": [
    { label: "猪肉大葱馅", terms: ["猪肉大葱", "猪肉馅", "鲜肉"] },
    { label: "素馅", terms: ["素馅", "素饺", "韭菜鸡蛋"] },
    { label: "三鲜馅", terms: ["三鲜"] },
    { label: "牛肉馅", terms: ["牛肉"] },
    { label: "虾仁馅", terms: ["虾仁"] },
  ],
  "bun-filling": [
    { label: "猪肉馅", terms: ["猪肉", "鲜肉", "肉包"] },
    { label: "牛肉馅", terms: ["牛肉"] },
    { label: "素菜馅", terms: ["素菜", "菜包", "素馅"] },
    { label: "豆沙馅", terms: ["豆沙", "红豆"] },
    { label: "奶黄馅", terms: ["奶黄"] },
    { label: "流沙馅", terms: ["流沙"] },
  ],
  "wonton-filling": [
    { label: "鲜肉馅", terms: ["鲜肉", "猪肉"] },
    { label: "虾仁馅", terms: ["虾仁", "鲜虾"] },
    { label: "菜肉馅", terms: ["菜肉", "荠菜"] },
  ],
  "bread-type": [
    { label: "白吐司", terms: ["吐司", "白吐司", "切片面包"] },
    { label: "全麦面包", terms: ["全麦", "黑麦", "杂粮"] },
    { label: "甜面包", terms: ["甜面包", "豆沙", "奶酥", "菠萝包", "蜜瓜包", "毛毛虫"] },
    { label: "欧包/法棍", terms: ["欧包", "法棍", "硬欧"] },
    { label: "贝果", terms: ["贝果", "bagel"] },
    { label: "餐包", terms: ["餐包", "小面包", "小圆包"] },
    { label: "夹心/奶油面包", terms: ["夹心", "奶油", "肉松", "椰蓉"] },
  ],
  "protein-powder-type": [
    { label: "乳清蛋白", terms: ["乳清蛋白", "乳清蛋白粉"] },
    { label: "分离乳清蛋白", terms: ["分离乳清", "分离乳清蛋白"] },
    { label: "酪蛋白", terms: ["酪蛋白", "酪蛋白粉"] },
    { label: "植物蛋白", terms: ["植物蛋白", "豌豆蛋白", "大豆蛋白"] },
    { label: "酵母蛋白", terms: ["酵母蛋白"] },
  ],
  "chocolate-cacao": [
    { label: "70%黑巧", terms: ["黑巧", "黑巧克力", "70%"] },
    { label: "85%黑巧", terms: ["85%", "高可可"] },
    { label: "牛奶巧克力", terms: ["牛奶巧克力"] },
    { label: "夹心巧克力", terms: ["夹心", "威化", "饼干"] },
  ],
  "brownie-type": [
    { label: "黑巧布朗尼", terms: ["黑巧布朗尼", "黑巧克力布朗尼"] },
    { label: "坚果布朗尼", terms: ["坚果", "核桃"] },
    { label: "低糖布朗尼", terms: ["低糖", "无糖"] },
    { label: "原味布朗尼", terms: ["原味布朗尼"] },
  ],
  "milk-tea-sweetness": [
    { label: "无糖", terms: ["无糖"] },
    { label: "少糖", terms: ["少糖", "三分糖", "3分糖"] },
    { label: "标准糖", terms: ["标准糖", "正常糖", "全糖"] },
    { label: "加小料", terms: ["加小料", "珍珠", "椰果", "奶盖", "波波"] },
  ],
  "drink-sweetness": [
    { label: "无糖", terms: ["无糖", "不加糖", "0糖", "零糖"] },
    { label: "三分糖", terms: ["三分糖", "3分糖", "少糖"] },
    { label: "五分糖", terms: ["五分糖", "5分糖", "半糖"] },
    { label: "七分糖", terms: ["七分糖", "7分糖"] },
    { label: "全糖", terms: ["全糖", "正常糖", "标准糖"] },
  ],
  "coffee-sweetness": [
    { label: "无糖", terms: ["无糖", "不加糖", "黑咖啡", "美式"] },
    { label: "加糖", terms: ["加糖", "糖浆"] },
    { label: "半糖", terms: ["半糖", "五分糖", "5分糖"] },
    { label: "全糖", terms: ["全糖", "标准糖", "正常糖"] },
  ],
  "milk-fat": [
    { label: "全脂", terms: ["全脂"] },
    { label: "低脂", terms: ["低脂"] },
    { label: "脱脂", terms: ["脱脂"] },
  ],
  "yogurt-sweetness": [
    { label: "无糖酸奶", terms: ["无糖"] },
    { label: "低糖酸奶", terms: ["低糖"] },
    { label: "风味酸奶", terms: ["风味", "果粒", "黄桃", "草莓"] },
    { label: "希腊酸奶", terms: ["希腊"] },
  ],
  "popcorn-processing": [
    { label: "原味无油", terms: ["原味", "无油"] },
    { label: "焦糖爆米花", terms: ["焦糖"] },
    { label: "黄油爆米花", terms: ["黄油", "奶油"] },
  ],
  "hotpot-ingredient-type": [
    { label: "鲜肉卷", terms: ["肥牛卷", "肥羊卷", "肥牛", "肥羊", "雪花肥牛"] },
    { label: "丸滑类", terms: ["虾滑", "鱼滑", "牛肉丸", "鱼丸", "贡丸", "蟹棒", "蟹柳"] },
    { label: "内脏脆口", terms: ["毛肚", "鸭肠"] },
    { label: "豆制品", terms: ["腐竹", "油豆腐", "豆泡", "魔芋结", "竹轮"] },
    { label: "蔬菜菌菇", terms: ["金针菇", "蘑菇", "青菜", "娃娃菜"] },
  ],
  "hotpot-spicy": [
    { label: "清汤", terms: ["清汤"] },
    { label: "菌汤", terms: ["菌汤"] },
    { label: "番茄汤", terms: ["番茄"] },
    { label: "麻辣红油", terms: ["麻辣", "红油", "牛油"] },
    { label: "蘸料多", terms: ["油碟", "麻酱", "蘸料", "干碟"] },
  ],
  "luosifen-topping": [
    { label: "原味螺蛳粉", terms: ["原味螺蛳粉"] },
    { label: "炸蛋螺蛳粉", terms: ["炸蛋"] },
    { label: "叉烧螺蛳粉", terms: ["叉烧"] },
    { label: "加腐竹花生", terms: ["腐竹", "花生"] },
    { label: "重油辣螺蛳粉", terms: ["重油", "加辣", "麻辣"] },
  ],
  "congee-flavor": [
    { label: "白粥", terms: ["白粥"] },
    { label: "皮蛋瘦肉粥", terms: ["皮蛋瘦肉"] },
    { label: "海鲜粥", terms: ["海鲜", "虾", "蟹"] },
    { label: "甜粥", terms: ["甜粥", "八宝", "红豆"] },
  ],
  "soup-base": [
    { label: "清汤", terms: ["清汤"] },
    { label: "肉汤", terms: ["排骨", "鸡汤", "肉汤", "骨汤"] },
    { label: "奶白浓汤", terms: ["奶白", "浓汤"] },
    { label: "酸辣汤", terms: ["酸辣"] },
    { label: "麻辣汤", terms: ["麻辣"] },
  ],
  "noodle-style": [
    { label: "清汤", terms: ["清汤"] },
    { label: "红烧面", terms: ["红烧"] },
    { label: "酱香面", terms: ["酱香", "炸酱"] },
    { label: "拌面", terms: ["拌面", "干拌", "热干"] },
    { label: "炒面", terms: ["炒面"] },
    { label: "炒粉", terms: ["炒粉"] },
  ],
  "sauce-type": [
    { label: "芝麻酱/麻酱", terms: ["芝麻酱", "麻酱"] },
    { label: "油碟/香油", terms: ["油碟", "香油碟", "香油"] },
    { label: "沙拉酱", terms: ["沙拉酱", "凯撒酱", "千岛酱"] },
    { label: "蛋黄酱", terms: ["蛋黄酱", "美乃滋"] },
    { label: "花生酱", terms: ["花生酱"] },
    { label: "辣椒油/红油", terms: ["辣椒油", "红油", "油泼辣子"] },
  ],
  "cake-dessert-type": [
    { label: "奶油蛋糕", terms: ["奶油蛋糕", "黑森林", "红丝绒"] },
    { label: "芝士蛋糕", terms: ["芝士蛋糕", "巴斯克"] },
    { label: "慕斯/提拉米苏", terms: ["慕斯", "提拉米苏"] },
    { label: "蛋挞", terms: ["蛋挞"] },
    { label: "冰淇淋/雪糕", terms: ["冰淇淋", "冰激凌", "雪糕", "冰棍", "甜筒"] },
    { label: "中式甜品", terms: ["双皮奶", "龟苓膏", "烧仙草"] },
  ],
  "sausage-processing": [
    { label: "鸡肉肠", terms: ["鸡肉肠"] },
    { label: "火腿肠", terms: ["火腿肠"] },
    { label: "烤肠/香肠", terms: ["烤肠", "香肠", "热狗肠"] },
    { label: "低脂高蛋白肠", terms: ["低脂", "高蛋白"] },
  ],
  "rice-cooking-method": [
    { label: "白米饭", terms: ["白米饭", "白饭"] },
    { label: "蛋炒饭", terms: ["蛋炒饭", "鸡蛋炒饭"] },
    { label: "酱油炒饭", terms: ["酱油炒饭", "老干妈炒饭"] },
    { label: "咖喱饭", terms: ["咖喱饭", "咖喱鸡肉饭"] },
    { label: "拌饭/盖浇饭", terms: ["拌饭", "盖浇饭", "浇头饭"] },
    { label: "焖饭/煲仔饭", terms: ["焖饭", "煲仔饭", "石锅饭"] },
  ],
  "hotpot-broth-type": [
    { label: "牛油麻辣锅", terms: ["牛油", "麻辣锅底"] },
    { label: "清油麻辣锅", terms: ["清油", "植物油锅底"] },
    { label: "番茄锅", terms: ["番茄锅", "番茄底料"] },
    { label: "菌汤锅", terms: ["菌汤", "菌菇锅"] },
    { label: "清汤锅", terms: ["清汤锅", "骨汤锅"] },
    { label: "咖喱锅", terms: ["咖喱锅", "咖喱底料"] },
    { label: "椰子鸡锅", terms: ["椰子鸡", "椰子水锅"] },
  ],
  "stir-fry-oil-level": [
    { label: "少油版", terms: ["少油", "低油", "减油"] },
    { label: "正常油量", terms: ["正常", "标准"] },
    { label: "多油版", terms: ["多油", "油大", "油多"] },
    { label: "重油版", terms: ["重油", "大油", "宽油"] },
  ],
  "porridge-type": [
    { label: "白粥", terms: ["白粥", "清粥"] },
    { label: "肉粥", terms: ["肉粥", "瘦肉粥", "皮蛋瘦肉粥"] },
    { label: "甜粥", terms: ["甜粥", "红枣粥", "红豆粥"] },
    { label: "杂粮粥", terms: ["杂粮粥", "八宝粥", "腊八粥"] },
    { label: "海鲜粥", terms: ["海鲜粥", "虾粥"] },
  ],
  "chinese-pickle-type": [
    { label: "泡菜/酸菜", terms: ["泡菜", "酸菜", "辣白菜"] },
    { label: "酱菜/咸菜", terms: ["酱菜", "咸菜", "腌菜"] },
    { label: "榨菜", terms: ["榨菜", "涪陵榨菜"] },
    { label: "糖蒜/腊八蒜", terms: ["糖蒜", "腊八蒜"] },
  ],
};

function variant(label: string, kind: FoodVariantKind, hint: string, profile?: FoodVariantProfile): FoodVariantOption {
  return { label, kind, hint, profile };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function getFoodSearchText(food: FoodForVariant): string {
  return normalize(`${food.id} ${food.name} ${food.aliases.join(" ")}`);
}

function getContextText(context?: FoodVariantContext): string {
  return normalize(`${context?.inputText ?? ""} ${context?.quantity ?? ""}${context?.unit ?? ""} ${context?.grams ?? ""}g`);
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(normalize(term)));
}

function matchesRule(rule: FamilyRule, food: FoodForVariant, foodText: string, contextText: string): boolean {
  if (rule.categories && !rule.categories.includes(food.category)) return false;

  const searchText = rule.requireContextTerm ? contextText : `${foodText} ${contextText}`;
  if (!hasAny(searchText, rule.terms)) return false;
  if (rule.family === "raw-protein-cooking") {
    return !rule.exclude || !hasAny(contextText, rule.exclude);
  }
  return !rule.exclude || !hasAny(`${foodText} ${contextText}`, rule.exclude);
}

function inferVariantFamily(food: FoodForVariant, context?: FoodVariantContext): FoodVariantFamily | undefined {
  const foodText = getFoodSearchText(food);
  const contextText = getContextText(context);
  const matchedRule = familyRules.find((rule) => matchesRule(rule, food, foodText, contextText));
  if (matchedRule) return matchedRule.family;

  // 兜底只能给真正的“未加工原料蛋白”使用，不能对 dish/fastfood/snack 成品套鸡蛋或豆腐那套做法。
  if (food.category === "protein" && !hasAny(foodText, finishedProteinTerms)) {
    return "raw-protein-cooking";
  }
  return undefined;
}

function refineByExplicitContext(family: FoodVariantFamily, options: FoodVariantOption[], contextText: string): FoodVariantOption[] {
  if (!contextText) return options;

  const rules = explicitVariantTerms[family];
  if (!rules) return options;

  const matchedLabels = rules
    .filter((rule) => hasAny(contextText, rule.terms))
    .map((rule) => rule.label);
  if (matchedLabels.length === 0) return options;

  const narrowed = options.filter((option) => matchedLabels.includes(option.label));
  return narrowed.length > 0 ? narrowed : options;
}

function isAmbiguousBaseFood(family: FoodVariantFamily, food: FoodForVariant): boolean {
  const text = getFoodSearchText({ ...food, aliases: [] });
  switch (family) {
    case "egg-cooking":
      return /(^| )(egg|鸡蛋|蛋)($| )/.test(text);
    case "tofu-pudding-flavor":
      return /豆腐脑|豆腐花|豆花|tofu-pudding/.test(text);
    case "tofu-product":
      return /豆腐$|tofu$/.test(text);
    case "raw-protein-cooking":
      return food.category === "protein";
    case "peanut-processing":
      return /花生$|peanuts?$/.test(text);
    case "nut-processing":
      return /坚果$|nuts?$/.test(text);
    case "dumpling-filling":
      return /水饺|饺子|dumpling/.test(text);
    case "bun-filling":
      return /包子|baozi/.test(text);
    case "wonton-filling":
      return /馄饨|云吞|抄手|wonton/.test(text);
    case "bread-type":
      return /(^| )(bread|面包)($| )/.test(text);
    case "protein-powder-type":
      return /蛋白粉|protein-powder/.test(text);
    case "chocolate-cacao":
      return /巧克力|chocolate/.test(text);
    case "brownie-type":
      return /布朗尼|brownie/.test(text);
    case "milk-tea-sweetness":
    case "drink-sweetness":
    case "coffee-sweetness":
    case "yogurt-sweetness":
      return true;
    case "milk-fat":
      return /牛奶|鲜奶/.test(text);
    case "popcorn-processing":
      return /爆米花|popcorn/.test(text);
    case "fried-skewer-type":
      return /炸串/.test(text);
    case "hotpot-ingredient-type":
      return /丸|滑|卷|毛肚|鸭肠|火锅食材/.test(text);
    case "hotpot-spicy":
      return /火锅|麻辣烫|冒菜/.test(text);
    case "luosifen-topping":
      return /螺蛳粉/.test(text);
    case "congee-flavor":
      return /^(congee|白粥|甜粥|粥)$/.test(text);
    case "soup-base":
      return /汤$/.test(text);
    case "noodle-style":
      return /面条|面食|noodles?/.test(text);
    case "sauce-type":
      return /酱$|油$|油碟|麻酱/.test(text);
    case "cake-dessert-type":
      return /蛋糕|甜品|冰淇淋|冰激凌|雪糕/.test(text);
    case "sausage-processing":
      return /肠$/.test(text);
    default:
      return false;
  }
}

export function getFoodVariantDetailStatus(food: FoodForVariant, context?: FoodVariantContext): FoodVariantDetailStatus {
  const family = inferVariantFamily(food, context);
  if (!family) {
    return {
      groupLabel: "自定义细分",
      options: [],
      needsDetails: false,
    };
  }

  const groupLabel = foodVariantFamilyLabels[family];
  const baseOptions = foodVariantFamilies[family] ?? [];
  const options = refineByExplicitContext(family, baseOptions, getContextText(context));
  const narrowedByInput = baseOptions.length > 1 && options.length === 1;

  if (family === "cake-dessert-type" && options.length > 0) {
    return {
      groupLabel,
      options,
      needsDetails: true,
      detailHint: `需要确认${groupLabel}`,
    };
  }

  if (narrowedByInput) {
    return {
      groupLabel,
      options,
      needsDetails: false,
    };
  }

  if (options.length <= 1) {
    return {
      groupLabel,
      options,
      needsDetails: false,
    };
  }

  if (!isAmbiguousBaseFood(family, food)) {
    return {
      groupLabel,
      options,
      needsDetails: false,
    };
  }

  return {
    groupLabel,
    options,
    needsDetails: true,
    detailHint: `需要确认${groupLabel}`,
  };
}

const finishedProteinTerms = [
  "豆腐脑",
  "豆腐花",
  "豆花",
  "卤牛肉",
  "酱牛肉",
  "茶叶蛋",
  "卤蛋",
  "炸鸡",
  "烤鸡",
  "白切鸡",
  "烤鸭",
  "牛肉干",
  "猪肉脯",
  "鸡肉肠",
  "即食鸡胸肉",
  "鱼豆腐",
  "虾滑",
  "鱼滑",
  "牛肉丸",
  "鱼丸",
  "贡丸",
  "蟹棒",
  "蟹柳",
  "毛肚",
  "鸭肠",
  "肥牛卷",
  "肥羊卷",
  "鸡肉肠",
  "火腿肠",
  "烤肠",
  "香肠",
  "臭豆腐",
  "油豆腐",
  "豆腐干",
  "豆腐皮",
];

export function getFoodVariantOptions(food: FoodForVariant, context?: FoodVariantContext): FoodVariantOption[] {
  return getFoodVariantDetailStatus(food, context).options;
}

export function getFoodVariantGroupLabel(food: FoodForVariant, context?: FoodVariantContext): string {
  const family = inferVariantFamily(food, context);
  return family ? foodVariantFamilyLabels[family] : "自定义细分";
}

export function inferDefaultFoodVariant(food: FoodForVariant, context?: FoodVariantContext): string {
  const options = getFoodVariantOptions(food, context);
  if (options.length > 0) return options[0].label;
  return food.category === "dish" || food.category === "fastfood" ? defaultDishVariant : defaultFoodVariant;
}

function clampNutrition(n: {
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
}) {
  return {
    caloriesPer100g: Math.max(0, n.caloriesPer100g),
    proteinPer100g: Math.max(0, n.proteinPer100g),
    fatPer100g: Math.max(0, n.fatPer100g),
    carbsPer100g: Math.max(0, n.carbsPer100g),
  };
}

// 变体解析后的营养自洽校验（仅告警，不改变数值，避免破坏既有变体测试）
// 阈值：Atwater 计算值比标称高出 >100kcal 且相对 >50%，判定宏量严重偏高
function warnIfVariantNutritionUnsane(food: Food, ctx: string) {
  if (food.caloriesPer100g <= 0) return;
  const gross = 4 * food.proteinPer100g + 9 * food.fatPer100g + 4 * food.carbsPer100g;
  const diff = gross - food.caloriesPer100g;
  if (diff > 100 && diff / food.caloriesPer100g > 0.5) {
    console.warn(
      `[food-variant] 变体「${ctx}」营养不自洽: 标称${food.caloriesPer100g}kcal, Atwater计算${gross.toFixed(0)}kcal`
    );
  }
}

export function resolveFoodByVariant(food: Food, variantLabel?: string): Food {
  if (!variantLabel || variantLabel === defaultDishVariant || variantLabel === defaultFoodVariant) return food;

  const family = inferVariantFamily(food, { inputText: variantLabel });
  const familyOptions = family ? foodVariantFamilies[family] : [];
  const option = familyOptions.find((item) => item.label === variantLabel)
    ?? getFoodVariantOptions(food).find((item) => item.label === variantLabel);
  if (!option?.profile) return food;

  // 油量变体使用增量叠加（而非覆盖），因为不同炒菜的基准油量不同
  if (family === "stir-fry-oil-level") {
    const oilDelta = option.profile.fatPer100g ?? 0;
    const oilCalorieDelta = oilDelta * 9; // 脂肪 9kcal/g
    const resolved = {
      ...food,
      caloriesPer100g: Math.max(0, food.caloriesPer100g + oilCalorieDelta),
      fatPer100g: Math.max(0, Math.round((food.fatPer100g + oilDelta) * 10) / 10),
    };
    return { ...resolved, ...clampNutrition(resolved) };
  }

  const resolved = {
    ...food,
    ...option.profile,
  };
  warnIfVariantNutritionUnsane(resolved, variantLabel);
  return { ...resolved, ...clampNutrition(resolved) };
}
