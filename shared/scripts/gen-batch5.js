const fs = require("fs");
const indexContent = fs.readFileSync("C:/Users/Administrator/Documents/健身日历/shared/index.ts", "utf-8");
const knownIds = new Set();
const foodRegex = /food\("([^"]+)"/g;
let m;
while ((m = foodRegex.exec(indexContent)) !== null) knownIds.add(m[1]);

const defs = [
  // ---- 日料 ----
  ["salmon-sashimi","三文鱼刺身","三文鱼生鱼片","protein",208,20,13,0,80],
  ["tuna-sashimi","金枪鱼刺身","吞拿鱼刺身","protein",144,23,5,0,80],
  ["sweet-shrimp-sashimi","甜虾刺身","甜虾生鱼片","protein",90,18,1,1,60],
  ["arctic-clam-sashimi","北极贝刺身","北寄贝刺身","protein",85,15,1,2,60],
  ["octopus-sashimi","章鱼刺身","章鱼生鱼片","protein",82,15,1,2,60],
  ["sea-bream-sashimi","鲷鱼刺身","鲷鱼生鱼片","protein",110,20,3,0,60],
  ["sashimi-platter","综合刺身","刺身拼盘,综合生鱼片","protein",150,18,7,1,150],
  ["nigiri","握寿司","握寿司","staple",150,5,2,28,150],
  ["gunkan","军舰寿司","军舰卷","staple",160,6,3,27,150],
  ["hand-roll","手卷","手卷寿司","staple",170,6,4,27,120],
  ["futomaki","太卷","太卷寿司","staple",160,5,3,28,150],
  ["vegetable-tempura","蔬菜天妇罗","蔬菜天妇罗","snack",180,3,9,22,120],
  ["shrimp-tempura","炸虾天妇罗","炸虾天妇罗","snack",230,8,12,22,120],
  ["tonkotsu-ramen","豚骨拉面","豚骨拉面,猪骨拉面","dish",170,8,6,20,400],
  ["miso-ramen","味噌拉面","味噌拉面","dish",160,8,5,22,400],
  ["shio-ramen","盐味拉面","盐味拉面","dish",150,7,4,22,400],
  ["shoyu-ramen","酱油拉面","酱油拉面","dish",160,7,5,22,400],
  ["takoyaki","章鱼小丸子","章鱼烧","snack",160,6,6,20,80],
  ["okonomiyaki","大阪烧","大阪烧","fastfood",200,8,10,20,200],
  ["japanese-curry-rice","日式咖喱饭","日式咖喱饭","dish",210,10,8,24,350],
  ["tonkatsu-curry","炸猪排咖喱","炸猪排咖喱饭","dish",280,15,15,22,400],
  ["oyakodon","亲子丼","鸡肉鸡蛋盖饭","dish",190,15,8,16,350],
  ["gyudon","牛丼","牛肉盖饭,日式牛丼","dish",220,16,10,18,350],
  ["katsudon","胜丼","猪排盖饭","dish",260,16,14,20,350],
  ["unagi-don","鳗鱼饭","鳗丼,蒲烧鳗鱼饭","dish",280,15,14,24,350],
  ["udon","乌冬面","乌冬,乌冬面条","staple",130,4,1,27,300],
  ["curry-udon","咖喱乌冬","咖喱乌冬面","dish",200,6,6,32,400],
  ["beef-udon","牛肉乌冬","牛肉乌冬面","dish",180,10,4,28,400],
  ["soba","荞麦面","荞麦,冷荞麦","staple",120,5,1,24,250],
  ["japanese-fried-chicken","日式炸鸡","唐扬鸡块","snack",260,18,15,14,150],
  ["croquette","可乐饼","土豆可乐饼,日式可乐饼","snack",220,5,12,24,100],

  // ---- 韩餐 ----
  ["beef-bibimbap","牛肉拌饭","牛肉石锅拌饭","dish",220,14,8,22,400],
  ["pork-bibimbap","猪肉拌饭","猪肉石锅拌饭","dish",210,12,10,22,400],
  ["tuna-bibimbap","金枪鱼拌饭","金枪鱼石锅拌饭","dish",190,12,6,24,400],
  ["korean-fried-chicken","韩式炸鸡","韩式炸鸡块","fastfood",300,18,18,16,200],
  ["sweet-spicy-chicken","甜辣炸鸡","甜辣韩式炸鸡","fastfood",320,17,19,20,200],
  ["honey-butter-chicken","蜂蜜黄油炸鸡","蜂蜜黄油鸡","fastfood",340,16,22,20,200],
  ["soybean-paste-soup","大酱汤","大酱汤","dish",60,3,2,7,300],
  ["soft-tofu-soup","嫩豆腐汤","韩式嫩豆腐汤","dish",55,4,2,6,300],
  ["kimchi-jjigae","泡菜汤","韩式泡菜锅","dish",65,4,3,6,300],
  ["budae-jjigae","部队火锅","部队锅,火腿肠火锅","fastfood",180,10,10,14,500],
  ["rice-cake-soup","辣炒年糕","韩式辣炒年糕","snack",220,4,5,40,300],
  ["cheese-rice-cake","芝士年糕","芝士辣年糕","snack",250,6,8,38,250],
  ["korean-bbq-pork-belly","烤五花肉","韩式烤五花肉","dish",350,15,30,2,150],
  ["korean-bbq-tongue","烤牛舌","韩式烤牛舌","dish",220,18,16,1,100],
  ["cold-noodle","冷面","水冷面,韩式冷面","staple",110,4,1,22,350],
  ["mixed-cold-noodle","拌冷面","韩式拌冷面","staple",130,5,3,22,300],
  ["kimbap","紫菜包饭","紫菜包饭","staple",180,5,4,30,200],
  ["tuna-kimbap","金枪鱼紫菜包饭","金枪鱼紫菜包饭","staple",190,7,5,28,200],
  ["beef-kimbap","牛肉紫菜包饭","牛肉紫菜包饭","staple",200,8,6,28,200],

  // ---- 西餐 ----
  ["filet-steak","菲力牛排","菲力牛排","protein",210,28,10,0,200],
  ["sirloin-steak","西冷牛排","西冷牛排","protein",230,26,13,0,200],
  ["ribeye-steak","肉眼牛排","肉眼牛排","protein",270,24,18,0,200],
  ["tbone-steak","T骨牛排","T骨牛排","protein",250,25,16,0,300],
  ["tomahawk-steak","战斧牛排","战斧牛排","protein",280,26,18,0,500],
  ["bolognese","肉酱意面","肉酱意面,番茄肉酱意面","dish",220,10,9,26,350],
  ["carbonara","奶油培根意面","白酱意面","dish",280,12,16,24,350],
  ["pesto-pasta","青酱意面","青酱意面","dish",250,10,14,24,350],
  ["seafood-pasta","海鲜意面","海鲜意面","dish",230,14,8,26,350],
  ["lasagna","千层面","意大利千层面","dish",260,14,14,22,350],
  ["margherita-pizza","玛格丽特披萨","玛格丽特披萨","fastfood",260,10,10,32,200],
  ["hawaiian-pizza","夏威夷披萨","夏威夷披萨","fastfood",240,10,8,34,200],
  ["bacon-pizza","培根披萨","培根披萨","fastfood",300,14,16,28,200],
  ["seafood-pizza","海鲜披萨","海鲜披萨","fastfood",260,12,10,30,200],
  ["durian-pizza","榴莲披萨","榴莲披萨","fastfood",280,8,12,36,200],
  ["beef-burger","牛肉汉堡","牛肉汉堡","fastfood",280,16,14,24,200],
  ["cheese-burger","芝士汉堡","芝士汉堡","fastfood",300,18,16,24,200],
  ["caesar-salad","凯撒沙拉","凯撒沙拉","vegetable",120,6,8,8,200],
  ["tuna-salad","金枪鱼沙拉","金枪鱼沙拉","vegetable",90,10,4,6,200],
  ["chicken-caesar-salad","鸡肉凯撒沙拉","鸡肉凯撒沙拉","vegetable",150,15,7,8,250],
  ["fish-and-chips","炸鱼薯条","英式炸鱼薯条","fastfood",280,12,15,26,250],
  ["roast-spring-chicken","烤春鸡","迷迭香烤鸡","dish",220,24,13,2,300],

  // ---- 东南亚 ----
  ["tom-yum","冬阴功汤","冬阴功汤,冬阴功海鲜汤","dish",70,8,3,4,350],
  ["green-curry-chicken","绿咖喱鸡","绿咖喱鸡","dish",200,14,12,8,300],
  ["red-curry-beef","红咖喱牛肉","红咖喱牛肉","dish",210,15,13,7,300],
  ["yellow-curry-shrimp","黄咖喱虾","黄咖喱虾","dish",180,14,10,8,300],
  ["vietnam-pho","越南河粉","越南河粉,火车头河粉","staple",120,8,3,18,400],
  ["beef-pho","牛肉河粉","牛肉河粉","staple",130,9,3,18,400],
  ["vietnam-spring-roll","越南春卷","鲜虾春卷,越南春卷","snack",80,6,2,12,100],
  ["hainan-chicken-rice","海南鸡饭","新加坡海南鸡饭","dish",170,14,6,20,350],
  ["bak-kut-teh","肉骨茶","马来西亚肉骨茶","dish",120,10,6,8,350],
  ["satay-beef","沙爹牛肉","沙爹牛肉串","protein",200,18,10,8,120],
  ["satay-chicken","沙爹鸡肉","沙爹鸡肉串","protein",180,16,8,8,120],
  ["mango-sticky-rice","芒果糯米饭","泰式芒果饭","snack",200,4,5,37,200],
  ["pad-thai","泰式炒河粉","pad thai,帕泰","staple",200,8,8,26,300],
  ["gaprao-pork","打抛猪肉","打抛猪肉饭","dish",220,12,14,14,350],
  ["laksa","叻沙","咖喱叻沙","dish",200,10,12,14,400],
  ["nasi-goreng","印尼炒饭","印尼炒饭","staple",220,8,9,28,350],
  ["pineapple-fried-rice","菠萝炒饭","泰式菠萝饭","dish",230,8,8,32,350],

  // ---- 各地菜系精选 ----
  ["rosemary-soy-chicken","玫瑰豉油鸡","豉油鸡","dish",220,22,13,3,300],
  ["siu-yuk","烧肉","脆皮烧肉","protein",330,18,27,2,150],
  ["siu-paigu","烧排骨","烤排骨,烧骨","protein",280,18,22,4,200],
  ["char-siu-sou","叉烧酥","叉烧酥","snack",350,7,22,35,60],
  ["pineapple-bun","菠萝包","菠萝面包","staple",320,8,12,46,80],
  ["cocktail-bun","鸡尾包","鸡尾面包","staple",300,7,10,46,80],
  ["chili-fish-head","剁椒鱼头","酱椒鱼头","dish",150,16,7,6,400],
  ["pepper-pork","辣椒炒肉","小炒肉","dish",200,14,13,8,200],
  ["sauteed-beef","小炒黄牛肉","小炒黄牛肉","dish",190,18,10,6,200],
  ["farmhouse-bowl","农家一碗香","农家小炒肉","dish",220,14,14,10,200],
  ["dry-pot-intestine","干锅肥肠","干锅肥肠","dish",250,12,18,10,250],
  ["dry-pot-frog","干锅牛蛙","干锅牛蛙","dish",160,16,6,10,250],
  ["mao-braised-pork","毛氏红烧肉","毛氏红烧肉","dish",390,14,33,8,200],
  ["lei-pepper-egg","擂辣椒皮蛋","擂辣椒茄子皮蛋","dish",140,9,9,8,150],
  ["duo-pepper-ribs","剁椒蒸排骨","剁椒蒸排骨","dish",200,15,13,6,200],
  ["duo-pepper-chicken","剁椒蒸鸡","剁椒蒸鸡","dish",190,18,11,4,250],
  ["sour-spicy-gizzard","酸辣鸡杂","酸辣鸡杂","dish",160,16,8,6,200],
  ["blood-duck","血鸭","永州血鸭","dish",180,16,10,6,250],
  ["stinky-tofu","臭豆腐","长沙臭豆腐","snack",150,8,10,8,100],
  ["sugar-oil-baba","糖油粑粑","糖油粑粑","snack",280,3,8,50,60],
  ["kouwei-shrimp","口味虾","湖南口味虾","dish",180,16,10,6,300],
  ["scallion-sea-cucumber","葱烧海参","葱烧海参","dish",100,13,4,4,200],
  ["braised-prawn","油焖大虾","油焖大虾","dish",200,16,12,7,250],
  ["sweet-sour-carp","糖醋鲤鱼","糖醋鲤鱼","dish",190,16,8,14,250],
  ["nine-turn-intestine","九转大肠","九转大肠","dish",280,12,22,8,200],
  ["four-happiness-meatball","四喜丸子","红烧狮子头","dish",300,14,22,12,200],
  ["dezhou-braised-chicken","德州扒鸡","德州扒鸡","dish",250,24,15,4,300],
  ["pan-fried-tofu","锅塌豆腐","锅塌豆腐","dish",140,9,8,8,200],
  ["caramel-sweet-potato","拔丝地瓜","拔丝红薯","snack",250,2,6,48,200],
  ["large-dried-tofu","大煮干丝","烫干丝,大煮干丝","dish",100,10,4,5,250],
  ["crab-lion-head","清炖蟹粉狮子头","蟹粉狮子头","dish",280,14,22,8,200],
  ["squirrel-fish","松鼠鳜鱼","松鼠鱼,松鼠桂鱼","dish",200,16,8,16,300],
  ["crab-meat-tofu","蟹粉豆腐","蟹粉豆腐","dish",130,8,8,6,250],
  ["oil-eel","响油鳝糊","炒鳝糊","dish",200,16,12,8,200],
  ["yangzhou-fried-rice","扬州炒饭","什锦炒饭","staple",200,8,7,26,350],
  ["wensi-tofu","文思豆腐","文思豆腐","dish",70,6,2,6,250],

  // ---- 闽菜/徽菜/地方特色 ----
  ["fotiaoqiang","佛跳墙","佛跳墙","dish",180,16,10,8,400],
  ["lizhi-rou","荔枝肉","荔枝肉","dish",210,12,12,14,200],
  ["zuipaigu","醉排骨","醉排骨","dish",240,16,16,8,250],
  ["oyster-pancake","海蛎煎","蚵仔煎,海蛎煎","dish",220,10,12,18,200],
  ["satay-noodle","沙茶面","沙茶面","staple",190,9,8,22,350],
  ["tusundong","土笋冻","土笋冻","snack",50,8,1,3,80],
  ["fuzhou-fish-ball","福州鱼丸","包心鱼丸","protein",90,10,3,6,100],
  ["mee-sua","面线糊","闽南面线糊","staple",80,4,2,14,300],
  ["ginger-duck","姜母鸭","闽南姜母鸭","dish",260,18,18,4,300],
  ["stinky-mandarin-fish","臭鳜鱼","徽州臭鳜鱼","dish",170,18,9,4,250],
  ["mao-tofu","毛豆腐","毛豆腐","protein",130,12,7,5,150],

  // ---- 东北菜 ----
  ["liurouduan","溜肉段","溜肉段","dish",240,14,14,14,200],
  ["liuganjian","溜肝尖","溜肝尖","dish",150,18,6,6,200],
  ["liuyaohua","溜腰花","溜腰花","dish",140,16,5,6,200],
  ["luan-dun","乱炖","东北乱炖","dish",120,6,6,12,300],
  ["pork-vermicelli-stew","猪肉炖粉条","猪肉炖粉条","dish",200,10,10,18,350],
  ["chicken-mushroom-stew","小鸡炖蘑菇","小鸡炖蘑菇","dish",180,18,8,10,350],
  ["ribs-beans-stew","排骨炖豆角","排骨炖豆角","dish",220,14,12,12,300],
  ["pickled-cabbage-stew","酸菜炖粉条","酸菜炖粉条","dish",120,5,6,18,300],
  ["jiang-gujia","酱骨架","酱骨棒","dish",250,22,16,4,250],
  ["dongbei-lapi","东北大拉皮","五彩大拉皮","dish",80,2,3,12,200],
  ["dongbei-dip","东北蘸酱菜","大丰收","vegetable",30,2,1,5,150],
  ["shazhucai","杀猪菜","白肉血肠","dish",250,14,20,4,300],
];

const toInsert = [];
for (const def of defs) {
  const [id, name, aliasesRaw, category, kcal, protein, fat, carbs, grams] = def;
  if (knownIds.has(id)) continue;
  const aliases = aliasesRaw ? aliasesRaw.split(",").map(a => a.trim()).filter(a => a && a !== name) : [];
  const aliasesStr = aliases.length > 0 ? aliases.map(a => '"' + a + '"').join(", ") : "";
  toInsert.push('  food("' + id + '", "' + name + '", [' + aliasesStr + '], "' + category + '", ' + kcal + ', ' + protein + ', ' + fat + ', ' + carbs + ', ' + grams + '),');
}

console.log("Generated:", defs.length, "| Inserting:", toInsert.length);

const lines = indexContent.split("\n");
let lastFood = -1, closeIdx = -1;
for (let i = 0; i < lines.length; i++) { if (lines[i].trimStart().startsWith("food(")) lastFood = i; }
for (let i = lastFood; i < lines.length; i++) { if (lines[i].trim() === "];") { closeIdx = i; break; } }
const before = lines.slice(0, closeIdx).join("\n");
const after = lines.slice(closeIdx).join("\n");
const result = before + "\n  // === Round 5: 日料/韩餐/西餐/东南亚/地方菜 ===\n" + toInsert.join("\n") + "\n" + after;
fs.writeFileSync("C:/Users/Administrator/Documents/健身日历/shared/index.ts", Buffer.from(result, "utf-8"));
console.log("Done!");