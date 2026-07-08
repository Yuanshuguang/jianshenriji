// 批量生成器：根据定义列表生成 food() 调用
// 每个定义：[id, name, aliases_csv, category, kcal, protein, fat, carbs, defaultGram]
// 如果 aliases 为空字符串，使用空数组

type FoodDef = [string, string, string, string, number, number, number, number, number];

const defs: FoodDef[] = [
  // ========== 主食 ==========
  ["brown-rice", "糙米饭", "糙米", "staple", 123, 2.5, 0.9, 26, 150],
  ["mixed-grain-rice", "杂粮饭", "五谷饭,杂粮米饭", "staple", 130, 3, 1, 28, 150],
  ["black-rice", "紫米饭", "黑米饭,紫米", "staple", 120, 2.8, 0.8, 26, 150],
  ["black-rice-grain", "黑米", "黑香米,紫米", "staple", 333, 9, 2.5, 72, 100],
  ["jobstears", "薏米", "薏仁,薏苡仁", "staple", 357, 12, 3.3, 69, 50],
  ["sorghum", "高粱米", "高粱,蜀黍", "staple", 351, 10, 3.3, 70, 100],
  ["buckwheat", "荞麦", "荞麦米,甜荞", "staple", 324, 10, 2.5, 66, 100],
  ["naked-oats", "莜麦", "裸燕麦,油麦", "staple", 370, 13, 7, 65, 60],
  ["dried-noodle", "挂面", "干面条,干挂面", "staple", 346, 10, 1, 74, 100],
  ["handmade-noodle", "手擀面", "手工面,手擀面条", "staple", 135, 4, 1.5, 27, 200],
  ["noodle-sheet", "面片", "刀削面片,揪片", "staple", 130, 4, 1, 26, 200],
  ["dough-ball", "面疙瘩", "疙瘩汤,面疙瘩汤", "staple", 110, 3, 1.5, 22, 250],
  ["cats-ear-noodle", "猫耳朵", "山西猫耳朵", "staple", 140, 4.5, 1.5, 28, 200],
  ["baguette", "法棍", "法式长棍,法棍面包", "staple", 260, 9, 1.5, 53, 80],
  ["croissant", "牛角包", "可颂,羊角包", "staple", 380, 8, 20, 42, 60],
  ["bagel", "贝果", "百吉饼,贝果面包", "staple", 270, 10, 2, 53, 100],
  ["spring-pancake", "春饼", "春饼皮,薄饼", "staple", 230, 6, 4, 43, 120],
  ["layered-pancake", "千层饼", "千层酥饼", "staple", 310, 8, 12, 43, 100],
  ["raised-pancake", "发面饼", "发面大饼", "staple", 240, 7, 3, 46, 120],
  ["guokui", "锅盔", "陕西锅盔,硬面锅盔", "staple", 300, 8, 6, 52, 120],
  ["naan", "馕", "新疆馕,烤馕", "staple", 280, 9, 4, 50, 120],
  ["rice-noodle-strip", "米粉", "桂林米粉,湖南米粉", "staple", 108, 2.3, 0.6, 23, 200],
  ["erkuai", "饵块", "云南饵块,米饵块", "staple", 120, 2, 0.5, 27, 200],
  ["niangao", "年糕", "水磨年糕,炸年糕", "staple", 154, 3.3, 0.6, 34, 200],
  ["ciba", "糍粑", "糯米糍粑,红糖糍粑", "staple", 250, 4, 3, 52, 100],
  ["yuanxiao", "元宵", "汤圆,炸元宵", "staple", 250, 4, 10, 36, 200],
  ["qingtuan", "青团", "艾草青团,清明团", "staple", 230, 4, 8, 38, 80],
  ["qingming-guo", "清明粿", "清明果,艾粿", "staple", 220, 4, 7, 36, 80],
  ["wholemeal-bread", "全麦面包", "全麦吐司,全麦包", "staple", 240, 9, 3, 45, 80],

  // ========== 猪肉 ==========
  ["pork-belly", "五花肉", "猪五花,三层肉", "protein", 395, 13, 37, 0, 100],
  ["pork-tenderloin", "里脊肉", "猪里脊,瘦肉", "protein", 143, 20, 6.2, 1.5, 120],
  ["pork-collar", "梅花肉", "猪颈肉,梅花肉", "protein", 260, 17, 20, 0, 120],
  ["pork-front-leg", "前腿肉", "猪前腿,前夹肉", "protein", 190, 18, 12, 2, 120],
  ["pork-hind-leg", "后腿肉", "猪后腿,后臀尖", "protein", 180, 19, 11, 2, 120],
  ["pork-ear", "猪耳朵", "卤猪耳,猪耳", "protein", 210, 16, 15, 0, 60],
  ["pork-tail", "猪尾巴", "猪尾,红烧猪尾", "protein", 230, 14, 19, 0, 80],
  ["pig-blood", "猪血", "猪红,血豆腐", "protein", 55, 12, 0.3, 0.6, 150],
  ["pork-intestine", "猪肠", "肥肠,猪大肠", "protein", 196, 9, 18, 0.5, 100],
  ["pork-kidney", "猪腰", "猪肾,爆炒腰花", "protein", 100, 16, 3.5, 1, 100],
  ["pork-heart", "猪心", "猪心脏,卤猪心", "protein", 120, 17, 5, 2, 100],

  // ========== 鸡肉 ==========
  ["chicken-tender", "鸡里脊", "鸡小胸,鸡柳", "protein", 110, 23, 1.5, 0, 120],
  ["chicken-thigh-upper", "鸡上腿", "鸡大腿,手枪腿", "protein", 181, 19, 11, 0, 180],
  ["chicken-whole-leg", "鸡全腿", "鸡整腿,全鸡腿", "protein", 190, 18, 12, 0, 200],
  ["chicken-drumette", "鸡翅根", "翅根,小鸡腿", "protein", 195, 17, 14, 0, 80],
  ["chicken-heart", "鸡心", "鸡心脏,烤鸡心", "protein", 130, 16, 6, 1, 80],
  ["chicken-liver", "鸡肝", "鸡肝脏,炒鸡肝", "protein", 120, 17, 5, 3, 80],
  ["chicken-blood", "鸡血", "鸡红,血豆腐", "protein", 50, 10, 0.3, 0.5, 150],
  ["silkie", "乌鸡", "乌骨鸡,乌鸡", "protein", 110, 22, 2.5, 0, 200],
  ["yellow-feather-chicken", "三黄鸡", "三黄鸡,土鸡", "protein", 170, 20, 9, 0, 200],
  ["free-range-chicken", "土鸡", "柴鸡,走地鸡", "protein", 160, 22, 7, 0, 200],

  // ========== 鸭肉 ==========
  ["duck-breast", "鸭胸", "鸭胸肉,鸭大胸", "protein", 160, 20, 8, 0, 120],
  ["duck-tongue", "鸭舌", "酱鸭舌,卤鸭舌", "protein", 220, 16, 16, 4, 60],
  ["duck-intestine", "鸭肠", "烫鸭肠,卤鸭肠", "protein", 100, 14, 4, 2, 80],
  ["duck-blood", "鸭血", "鸭红,鸭血豆腐", "protein", 55, 14, 0.3, 0, 150],
  ["duck-heart", "鸭心", "鸭心脏,卤鸭心", "protein", 120, 15, 6, 1, 80],
  ["duck-liver", "鸭肝", "鸭肝脏", "protein", 130, 14, 7, 1.5, 80],
  ["salted-duck", "盐水鸭", "南京盐水鸭", "protein", 230, 18, 17, 2, 200],
  ["sauce-duck", "酱鸭", "酱板鸭,酱鸭", "protein", 260, 22, 18, 3, 200],

  // ========== 牛肉 ==========
  ["beef-tenderloin-cut", "牛里脊", "牛菲力,牛柳", "protein", 130, 22, 4, 2, 120],
  ["ox-tail", "牛尾", "牛尾巴,炖牛尾", "protein", 180, 17, 12, 2, 200],
  ["beef-heart", "牛心", "牛心脏", "protein", 120, 17, 5, 2, 100],
  ["beef-liver", "牛肝", "牛肝脏", "protein", 135, 20, 3.5, 5, 100],
  ["beef-tendon", "牛筋", "牛蹄筋,炖牛筋", "protein", 150, 33, 0.5, 3, 100],

  // ========== 羊肉 ==========
  ["lamb-leg", "羊腿肉", "羊后腿,烤羊腿", "protein", 190, 19, 12, 0, 120],
  ["lamb-tenderloin", "羊里脊", "羊菲力", "protein", 160, 20, 8, 1, 120],
  ["lamb-spine", "羊蝎子", "羊脊骨,羊羯子", "protein", 200, 16, 14, 1, 250],
  ["lamb-offal", "羊杂", "羊杂碎,羊杂汤", "protein", 130, 14, 7, 2, 200],
  ["lamb-kidney", "羊腰", "羊肾,烤羊腰", "protein", 100, 16, 3.5, 1, 80],
  ["lamb-blood", "羊血", "羊红,羊血豆腐", "protein", 50, 10, 0.3, 0.5, 150],

  // ========== 鱼肉 ==========
  ["snakehead-fish", "黑鱼", "乌鳢,财鱼", "protein", 90, 19, 1.3, 0, 150],
  ["tilapia", "罗非鱼", "非洲鲫鱼,福寿鱼", "protein", 98, 18, 2.5, 0, 150],
  ["yellow-croaker", "黄鱼", "大黄鱼,黄花鱼", "protein", 96, 18, 2.2, 0, 150],
  ["turbot", "多宝鱼", "比目鱼,大菱鲆", "protein", 90, 18, 1, 0, 150],
  ["grouper", "石斑鱼", "青斑,红斑", "protein", 92, 19, 1.5, 0, 150],
  ["basa", "巴沙鱼", "龙利鱼,巴沙鱼柳", "protein", 80, 16, 1.5, 0, 120],
  ["saury", "秋刀鱼", "烤秋刀鱼,刀鱼", "protein", 239, 18, 18, 0, 120],
  ["spanish-mackerel", "鲅鱼", "马鲛鱼,鲅鱼饺子", "protein", 140, 19, 6, 1, 120],
  ["pomfret", "鲳鱼", "银鲳,金鲳", "protein", 130, 18, 6, 0, 120],
  ["eel", "鳗鱼", "白鳗,河鳗", "protein", 230, 19, 16, 2, 100],
  ["loach", "泥鳅", "泥鳅鱼", "protein", 96, 18, 2, 0, 100],
  ["swamp-eel", "黄鳝", "鳝鱼,鳝丝", "protein", 95, 17, 2.5, 1, 120],
  ["softshell-turtle", "甲鱼", "鳖,水鱼", "protein", 120, 18, 4.5, 2, 150],

  // ========== 虾蟹贝 ==========
  ["tiger-prawn", "基围虾", "白虾,竹节虾", "protein", 90, 18, 1, 1, 120],
  ["giant-prawn", "对虾", "大明虾,青虾", "protein", 85, 17, 1, 1, 120],
  ["river-shrimp", "河虾", "淡水虾,小虾米", "protein", 85, 16, 1.5, 1.5, 80],
  ["crawfish-mala", "小龙虾", "麻辣小龙虾,克氏原螯虾", "protein", 90, 19, 1, 1, 300],
  ["mantis-shrimp", "皮皮虾", "濑尿虾,虾蛄", "protein", 80, 14, 1, 2, 200],
  ["king-crab", "帝王蟹", "阿拉斯加帝王蟹", "protein", 97, 19, 1.5, 0, 150],
  ["brown-crab", "面包蟹", "珍宝蟹", "protein", 90, 17, 1, 0, 150],
  ["crab-meat", "蟹肉", "蟹肉棒,拆蟹肉", "protein", 80, 16, 1, 1, 100],
  ["conch", "花螺", "海螺,东风螺", "protein", 90, 15, 1, 3, 100],
  ["razor-clam", "蛏子", "竹蛏,海蛏", "protein", 65, 12, 1, 2, 120],
  ["mussel", "海虹", "贻贝,淡菜", "protein", 80, 14, 2, 3, 100],
  ["abalone", "鲍鱼", "九孔鲍,鲜鲍", "protein", 84, 14, 1, 3, 50],
  ["sea-cucumber", "海参", "刺参,辽参", "protein", 55, 13, 0.3, 1, 80],
  ["sea-urchin", "海胆", "海胆黄,马粪海胆", "protein", 80, 10, 5, 3, 30],
  ["geoduck", "象拔蚌", "象鼻蚌", "protein", 80, 15, 1, 2, 100],
  ["arctic-surf-clam", "北极贝", "北寄贝", "protein", 85, 15, 1, 2, 60],

  // ========== 蛋类 ==========
  ["goose-egg", "鹅蛋", "鹅卵,鲜鹅蛋", "protein", 190, 13, 14, 3, 100],
  ["pigeon-egg", "鸽子蛋", "鸽蛋,乳鸽蛋", "protein", 140, 10, 10, 2, 25],
  ["century-egg", "松花蛋", "皮蛋,变蛋", "protein", 160, 14, 10, 1.5, 60],
  ["preserved-duck-egg", "咸蛋", "咸鸭蛋,咸蛋黄", "protein", 190, 13, 15, 1, 60],

  // ========== 加工肉 ==========
  ["jinhua-ham", "金华火腿", "金华火腿肉,南腿", "protein", 330, 18, 27, 4, 30],
  ["sausage-starch", "淀粉肠", "火腿肠,鸡肉肠", "protein", 200, 8, 12, 14, 60],
  ["grilled-sausage", "烤肠", "热狗肠,脆皮肠", "protein", 280, 11, 22, 10, 80],
  ["smoked-meat", "熏肉", "烟熏肉,熏猪肉", "protein", 300, 15, 25, 2, 60],
  ["braised-chicken-feet", "卤鸡爪", "卤凤爪,五香鸡爪", "protein", 200, 16, 14, 2, 100],
  ["braised-duck-neck", "卤鸭脖", "麻辣鸭脖,绝味鸭脖", "protein", 190, 18, 11, 3, 100],

  // ========== 叶菜 ==========
  ["pakchoi", "小白菜", "青菜,毛白菜", "vegetable", 15, 1.5, 0.3, 2.7, 200],
  ["shanghai-green", "上海青", "上海青菜,矮脚青", "vegetable", 13, 1.3, 0.2, 2.2, 200],
  ["youcai", "油菜", "小油菜,四季青", "vegetable", 15, 1.3, 0.3, 2.5, 200],
  ["ji-mao-cai", "鸡毛菜", "菜秧,小白菜秧", "vegetable", 13, 1.2, 0.2, 2, 200],
  ["leaf-mustard", "芥菜", "大芥菜,芥菜叶", "vegetable", 24, 1.8, 0.4, 4.5, 200],
  ["potherb-mustard", "雪里蕻", "雪菜,雪里红", "vegetable", 22, 1.5, 0.3, 4, 150],
  ["endive", "苦菊", "苦苣,苦菊叶", "vegetable", 20, 1.6, 0.3, 3.5, 100],
  ["shepherdspurse", "荠菜", "地菜,荠荠菜", "vegetable", 27, 2.4, 0.4, 5, 100],
  ["malantou", "马兰头", "马兰,马兰头菜", "vegetable", 22, 2, 0.3, 4, 100],
  ["goji-leaf", "枸杞叶", "枸杞菜,地骨皮叶", "vegetable", 25, 2.5, 0.5, 4, 100],
  ["sweet-potato-leaf", "番薯叶", "红薯叶,地瓜叶", "vegetable", 35, 2.8, 0.5, 6, 150],
  ["purslane", "马齿苋", "五行草,长寿菜", "vegetable", 26, 2.3, 0.3, 4.5, 100],

  // ========== 根茎 ==========
  ["purple-sweet-potato", "紫薯", "紫心番薯,紫地瓜", "staple", 82, 1.7, 0.1, 19, 150],
  ["cassava", "木薯", "木薯块,木薯粉原料", "staple", 160, 1.4, 0.3, 38, 150],
  ["jicama", "凉薯", "沙葛,豆薯", "vegetable", 38, 0.7, 0.2, 9, 150],
  ["water-caltrop", "菱角", "菱角米,水栗", "staple", 101, 4, 0.5, 21, 80],
  ["peanut-raw", "花生", "生花生,花生米", "snack", 563, 25, 44, 15, 25],

  // ========== 辣椒 ==========
  ["chili-pepper", "朝天椒", "指天椒,小米辣", "vegetable", 40, 1.9, 0.4, 9, 30],
  ["line-chili", "线椒", "长线椒,二荆条", "vegetable", 32, 1.5, 0.3, 7, 50],
  ["bell-pepper-color", "彩椒", "红椒,黄椒,彩色甜椒", "vegetable", 22, 1, 0.2, 5, 120],
  ["hangzhou-chili", "杭椒", "杭州青椒,微辣青椒", "vegetable", 25, 1.2, 0.3, 5.5, 80],

  // ========== 瓜类 ==========
  ["green-cucumber", "青瓜", "青黄瓜,水果黄瓜", "vegetable", 15, 0.8, 0.2, 3, 150],
  ["chayote", "佛手瓜", "合手瓜,隼人瓜", "vegetable", 19, 0.8, 0.2, 4.5, 150],

  // ========== 豆类 ==========
  ["edamame", "毛豆", "鲜毛豆,盐水毛豆", "vegetable", 131, 13, 5, 10, 120],
  ["snow-pea", "荷兰豆", "豌豆荚,雪豆", "vegetable", 42, 3.5, 0.2, 8, 150],
  ["flat-bean", "扁豆", "蛾眉豆,月亮菜", "vegetable", 43, 3.5, 0.3, 8, 150],
  ["pea", "豌豆", "豌豆粒,青豆", "vegetable", 105, 7, 0.4, 14, 100],
  ["broad-bean", "蚕豆", "蚕豆仁,胡豆", "vegetable", 110, 8, 0.5, 20, 100],
  ["chickpea", "鹰嘴豆", "鸡豆,波斯豆", "protein", 160, 9, 2.5, 27, 30],

  // ========== 菌菇 ==========
  ["beech-mushroom", "蟹味菇", "真姬菇,玉蕈", "vegetable", 25, 2.5, 0.3, 4.5, 120],
  ["seafood-mushroom", "海鲜菇", "鸿喜菇,蟹味菇", "vegetable", 25, 2.5, 0.3, 4, 120],
  ["matsutake", "松茸", "赤松茸,姬松茸", "vegetable", 28, 2.5, 0.5, 5, 60],
  ["porcini", "牛肝菌", "美味牛肝菌,白牛肝", "vegetable", 25, 2.8, 0.3, 4.5, 60],
  ["termite-mushroom", "鸡枞菌", "雞樅,鸡枞", "vegetable", 26, 2.6, 0.3, 4.3, 60],
  ["bamboo-fungus", "竹荪", "竹笙,竹笋菇", "vegetable", 20, 2.2, 0.2, 4, 30],
  ["lions-mane", "猴头菇", "猴头,猴头蘑", "vegetable", 25, 2.5, 0.3, 4.5, 80],
  ["cordyceps-flower", "虫草花", "蛹虫草,虫草菇", "vegetable", 28, 3, 0.5, 4, 30],
  ["oyster-mushroom-s", "茶树菇", "柱状田头菇,柳松菇", "vegetable", 24, 2.5, 0.3, 4, 100],

  // ========== 藻类 ==========
  ["kelp", "海带", "昆布,海带丝", "vegetable", 12, 1.2, 0.1, 2.3, 50],
  ["nori", "紫菜", "干紫菜,烤紫菜", "vegetable", 250, 29, 1, 40, 5],
  ["wakame", "裙带菜", "海芥菜,海裙菜", "vegetable", 14, 1.3, 0.2, 2.4, 50],
  ["seaweed", "海藻", "海藻丝,凉拌海藻", "vegetable", 18, 1.5, 0.2, 3, 80],

  // ========== 其他蔬菜 ==========
  ["zizania", "茭白", "茭瓜,高笋", "vegetable", 25, 1.5, 0.2, 5.5, 150],
  ["lily-bulb", "百合", "鲜百合,百合瓣", "vegetable", 166, 2, 0.2, 40, 80],
  ["fiddlehead", "蕨菜", "龙爪菜,如意菜", "vegetable", 35, 2.2, 0.4, 6, 120],
  ["toona", "香椿", "香椿芽,椿芽", "vegetable", 47, 5, 0.4, 9, 60],
  ["houttuynia", "折耳根", "鱼腥草,侧耳根", "vegetable", 20, 2, 0.3, 3, 80],
  ["daylily", "黄花菜", "金针菜,萱草花", "vegetable", 199, 11, 0.5, 37, 30],

  // ========== 水果 ==========
  ["fuji-apple", "红富士", "富士苹果,红富士苹果", "fruit", 53, 0.3, 0.2, 14, 200],
  ["green-apple", "青苹果", "青苹果,澳洲青苹", "fruit", 52, 0.3, 0.2, 14, 200],
  ["mandarin", "芦柑", "椪柑,芦柑橘子", "fruit", 44, 0.6, 0.2, 10, 200],
  ["ugly-orange", "丑橘", "不知火,丑柑", "fruit", 42, 0.8, 0.2, 10, 200],
  ["papa-orange", "耙耙柑", "春见,耙耙柑", "fruit", 42, 0.7, 0.2, 10, 200],
  ["kumquat", "金桔", "金橘,小金桔", "fruit", 55, 0.8, 0.2, 14, 60],
  ["finger-banana", "小米蕉", "皇帝蕉,小芭蕉", "fruit", 90, 1.3, 0.2, 22, 100],
  ["seedless-watermelon", "无籽西瓜", "无籽瓜", "fruit", 30, 0.6, 0.1, 7.5, 300],
  ["kirin-watermelon", "麒麟西瓜", "麒麟瓜,麒麟王", "fruit", 30, 0.5, 0.1, 7, 300],
  ["melon", "甜瓜", "香瓜,白兰瓜", "fruit", 28, 0.6, 0.1, 7, 200],
  ["netted-melon", "网纹瓜", "哈密瓜,网纹甜瓜", "fruit", 34, 0.5, 0.1, 8, 200],
  ["papaya", "木瓜", "番木瓜,番瓜", "fruit", 39, 0.6, 0.1, 9, 200],
  ["mangosteen-fruit", "山竹", "山竹子,凤果", "fruit", 69, 0.4, 0.2, 18, 100],
  ["longan", "龙眼", "桂圆,鲜桂圆", "fruit", 60, 1.2, 0.1, 16, 60],
  ["rambutan", "红毛丹", "毛荔枝,韶子", "fruit", 82, 0.9, 0.3, 20, 80],
  ["star-fruit", "杨桃", "五敛子,洋桃", "fruit", 31, 0.8, 0.3, 7, 150],
  ["plum-dry", "西梅", "加州西梅,欧洲李", "fruit", 47, 0.9, 0.2, 12, 80],
  ["kiwifruit-cn", "猕猴桃", "中华猕猴桃,阳桃", "fruit", 61, 1.1, 0.5, 15, 100],
  ["raisin", "葡萄干", "葡萄干果,提子干", "fruit", 300, 3, 0.5, 79, 20],
  ["dried-red-date", "红枣干", "干红枣,大枣干", "fruit", 276, 3, 0.5, 68, 20],
  ["goji-berry-dried", "枸杞干", "枸杞子,干枸杞", "fruit", 330, 12, 3, 63, 10],
  ["dried-persimmon", "柿饼", "柿干,吊柿", "fruit", 250, 1.8, 0.3, 62, 50],
  ["sour-jujube", "酸枣", "野枣,棘", "fruit", 80, 1.2, 1, 20, 30],
  ["gingko", "白果", "银杏,银杏果", "fruit", 355, 13, 1.3, 72, 20],
];

// Write the TypeScript file
const fs = require("fs");
const path = require("path");

const lines: string[] = [];
for (const def of defs) {
  const [id, name, aliasesRaw, category, kcal, protein, fat, carbs, grams] = def;
  const aliases = aliasesRaw ? aliasesRaw.split(",").map(a => a.trim()).filter(a => a) : [];
  const aliasesStr = aliases.length > 0 ? aliases.map(a => `"${a}"`).join(", ") : "";
  
  lines.push(`  food("${id}", "${name}", [${aliasesStr}], "${category}", ${kcal}, ${protein}, ${fat}, ${carbs}, ${grams}),`);
}

const output = `// Batch 2 — 大规模补全（算法生成）
// 覆盖：主食细类、肉类细分、蔬菜全类、水果、菌藻、水产
const batch2Foods = [
${lines.join("\n")}
];
`;

const outPath = path.resolve(__dirname, "../../shared/data/review-pool/pending-cn/new-foods-batch2.ts");
fs.writeFileSync(outPath, output, "utf-8");
console.log("Generated " + defs.length + " food entries -> " + outPath);
