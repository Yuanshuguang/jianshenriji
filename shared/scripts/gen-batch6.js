const fs = require("fs");
const indexContent = fs.readFileSync("C:/Users/Administrator/Documents/健身日历/shared/index.ts", "utf-8");
const knownIds = new Set();
const foodRegex = /food\("([^"]+)"/g;
let m;
while ((m = foodRegex.exec(indexContent)) !== null) knownIds.add(m[1]);

const defs = [
  // ---- 西北菜 ----
  ["yangrou-paomo","羊肉泡馍","羊肉泡馍","dish",200,12,8,22,500],
  ["niurou-paomo","牛肉泡馍","牛肉泡馍","dish",190,13,7,22,500],
  ["xiaochao-paomo","小炒泡馍","小炒泡馍","dish",220,14,10,20,500],
  ["laotongguan-roujiamo","老潼关肉夹馍","老潼关肉夹馍","staple",260,13,10,30,200],
  ["ganmianpi","擀面皮","擀面皮","staple",120,3,2,24,250],
  ["dapanji-ext","大盘鸡","新疆大盘鸡","dish",200,16,12,10,400],
  ["jiaomaji","椒麻鸡","椒麻鸡","dish",220,22,13,4,300],
  ["lamb-skewer-bbq","烤羊肉串","烤羊肉串","dish",250,20,17,3,120],
  ["hongliu-skewer","红柳烤肉","红柳烤肉","dish",250,20,17,3,120],
  ["roast-lamb-ribs","烤羊排","烤羊排","dish",280,19,22,0,250],
  ["roast-lamb-leg","烤羊腿","烤羊腿","dish",260,22,18,0,300],
  ["roast-whole-lamb","烤全羊","烤全羊","dish",280,22,20,0,500],
  ["lamb-pilaf","手抓饭","羊肉抓饭","staple",220,10,10,24,350],
  ["su-pilaf","素抓饭","素抓饭","staple",160,3,5,28,350],
  ["xinjiang-fried-rice-noodle","炒米粉","新疆炒米粉","staple",190,8,8,24,350],
  ["mixed-rice-noodle","拌米粉","拌米粉","staple",170,7,7,22,350],
  ["roast-baozi","烤包子","烤包子","staple",280,12,14,28,120],
  ["thin-skin-baozi","薄皮包子","薄皮包子","staple",250,10,11,28,100],
  ["laghman","拉条子","新疆拉条子","staple",180,7,5,28,300],
  ["guoyourou-noodle","过油肉拌面","过油肉拌面","staple",220,10,10,24,350],
  ["dingding-noodle","丁丁炒面","丁丁炒面","staple",200,8,8,26,300],
  ["clear-stew-lamb","清炖羊肉","清炖羊肉","dish",180,18,11,2,250],
  ["hand-grab-lamb","手抓羊肉","手抓羊肉","dish",190,20,12,0,250],
  ["hulatang-beef","牛肉胡辣汤","牛肉胡辣汤","dish",60,4,2,8,300],
  ["hulatang-lamb","羊肉胡辣汤","羊肉胡辣汤","dish",65,5,3,7,300],
  ["kaifeng-soup-dumpling","灌汤包","开封灌汤包","staple",220,8,9,26,200],
  ["lamb-stewed-noodle","羊肉烩面","郑州烩面","staple",160,8,5,22,400],

  // ---- 云南菜 ----
  ["little-pot-rice-noodle","小锅米线","小锅米线","staple",120,5,3,20,350],
  ["tofu-pudding-rice-noodle","豆花米线","豆花米线","staple",130,6,4,20,350],
  ["steam-pot-chicken","汽锅鸡","云南汽锅鸡","dish",110,20,3,2,300],
  ["xuanwei-ham","宣威火腿","宣威火腿","protein",350,18,28,5,50],
  ["roast-erkuai","烧饵块","烧饵块","staple",150,3,3,28,150],
  ["roast-rushan","烤乳扇","烤乳扇","snack",300,14,22,12,60],
  ["fried-rushan","炸乳扇","炸乳扇","snack",350,14,28,10,60],
  ["lemongrass-roast-fish","香茅草烤鱼","傣味烤鱼","dish",140,18,5,4,250],
  ["ghost-chicken","景颇鬼鸡","傣味柠檬鸡","dish",180,22,8,3,200],
  ["wild-mushroom-hotpot","野生菌火锅","菌子火锅","dish",80,5,3,10,500],

  // ---- 贵州菜 ----
  ["sour-soup-fish","酸汤鱼","红酸汤鱼","dish",100,14,3,4,400],
  ["guizhou-spicy-chicken","贵州辣子鸡","贵州辣子鸡","dish",230,20,14,6,250],
  ["si-wawa","丝娃娃","丝娃娃","dish",90,3,3,14,200],
  ["luoguo","烙锅","烙锅","fastfood",150,8,8,14,300],
  ["changwang-noodle","肠旺面","肠旺面","staple",190,8,10,20,350],
  ["guizhou-beef-noodle","牛肉粉","贵州牛肉粉","staple",160,8,4,24,350],

  // ---- 广西菜 ----
  ["dry-luosifen","干捞螺蛳粉","干捞螺蛳粉","staple",160,6,7,20,350],
  ["guilin-mifen-guo","锅烧米粉","桂林锅烧米粉","staple",170,7,8,22,350],
  ["laoyou-fen","老友粉","老友粉","staple",140,6,5,22,350],
  ["lemon-duck","柠檬鸭","柠檬鸭","dish",230,20,15,4,250],
  ["wuzhou-paper-chicken","纸包鸡","梧州纸包鸡","dish",210,22,12,4,250],

  // ---- 海南菜 ----
  ["wenchang-chicken","文昌鸡","文昌鸡","dish",200,22,12,1,300],
  ["jiaji-duck","加积鸭","加积鸭","dish",230,18,17,2,300],
  ["dongshan-lamb","东山羊","东山羊","dish",180,20,10,2,250],
  ["hele-crab","和乐蟹","和乐蟹","protein",95,14,2,3,200],
  ["coconut-chicken-hotpot","椰子鸡火锅","椰子鸡","dish",120,16,5,4,400],
  ["qingbuliang","清补凉","椰奶清补凉","drink",80,2,2,14,300],
  ["baoluo-noodle","抱罗粉","抱罗粉","staple",130,5,3,22,350],

  // ---- 早餐店详细 ----
  ["sweet-soymilk","甜豆浆","甜豆浆","drink",30,1.8,0.7,5,250],
  ["salty-soymilk","咸豆浆","咸豆浆","drink",35,1.8,1,5,250],
  ["sweet-tofu-pudding","甜豆腐脑","甜豆花","protein",47,2.6,1.8,5,250],
  ["salty-tofu-pudding","咸豆腐脑","咸豆花","protein",50,3,1.8,6,250],
  ["crab-roe-soup-dumpling","蟹黄汤包","蟹黄小笼","staple",250,10,12,26,150],
  ["cifantuan","粢饭团","上海粢饭团","staple",230,6,8,35,200],
  ["cifangao","粢饭糕","粢饭糕","staple",280,4,14,36,80],
  ["radish-cake","萝卜丝饼","萝卜丝饼","staple",220,3,12,26,80],
  ["meat-bun","肉包","肉包子","staple",230,9,7,33,100],
  ["vegetable-bun","菜包","菜包子","staple",180,6,5,28,100],
  ["sand-ding-bun","三丁包","三丁包子","staple",240,9,8,33,100],
  ["meigancai-bun","梅干菜包","梅干菜包子","staple",220,6,7,34,100],
  ["vermicelli-bun","粉丝包","粉丝包子","staple",200,5,5,35,100],
  ["sugar-roll","糖卷","糖花卷","staple",250,6,4,48,100],
  ["sugar-cake","糖糕","糖糕","snack",320,5,14,45,80],
  ["sesame-ball","麻球","芝麻球","snack",360,5,16,50,80],
  ["oil-dunzi","油墩子","油墩子","snack",300,5,18,30,80],
  ["white-boiled-egg","白水蛋","水煮蛋","protein",144,13,9,3,55],
  ["fried-egg","荷包蛋","煎荷包蛋","protein",190,13,14,2,55],
  ["sugar-youbing","糖油饼","糖油饼","staple",420,8,24,44,120],
  ["yellow-rice-fry-cake","黄米炸糕","黄米炸糕","snack",350,5,18,42,80],
  ["big-wonton","大馄饨","大馄饨","dish",180,7,6,26,300],
  ["small-wonton","小馄饨","小馄饨","dish",140,5,4,22,200],
  ["vegetable-pork-wonton","菜肉馄饨","菜肉馄饨","dish",160,7,6,22,250],
  ["shrimp-wonton","鲜虾馄饨","鲜虾馄饨","dish",170,8,6,22,250],

  // ---- 烧烤 ----
  ["bbq-lamb-skewer","羊肉串","羊肉串","protein",250,18,19,1,100],
  ["bbq-beef-skewer","牛肉串","牛肉串","protein",220,22,13,2,100],
  ["bbq-pork-skewer","猪肉串","猪肉串","protein",280,16,23,1,100],
  ["bbq-pork-belly-skewer","五花肉串","五花肉串","protein",350,13,33,0,100],
  ["bbq-chicken-wing-stick","鸡翅串","烤鸡翅","protein",250,18,18,2,120],
  ["bbq-chicken-heart","烤鸡心","烤鸡心","protein",150,16,8,2,80],
  ["bbq-chicken-gizzard","烤鸡胗","烤鸡胗","protein",140,19,5,2,80],
  ["bbq-chicken-skin","烤鸡皮","烤鸡皮","protein",380,10,38,1,60],
  ["bbq-lamb-kidney","烤羊腰","烤羊腰","protein",120,16,5,2,100],
  ["bbq-fish","烤鱼","烤全鱼","dish",160,18,7,5,400],
  ["bbq-eggplant","烤茄子","烤蒜蓉茄子","vegetable",55,2,3,7,200],
  ["bbq-chive","烤韭菜","烤韭菜","vegetable",45,2,2.5,5,80],
  ["bbq-enoki","烤金针菇","烤金针菇","vegetable",40,2.5,2,5,100],
  ["bbq-corn-cob","烤玉米","烤玉米","staple",150,4,2,30,250],
  ["bbq-mantou-slice","烤馒头片","烤馒头片","staple",250,7,3,48,60],
  ["bbq-scallop","烤扇贝","烤蒜蓉扇贝","protein",100,14,2,4,80],
  ["bbq-shrimp","烤大虾","烤大虾","protein",120,20,2,2,120],
  ["bbq-squid","烤鱿鱼","烤大鱿鱼","protein",140,20,4,3,150],
  ["foil-clam","锡纸花甲","锡纸花甲","protein",90,12,3,4,150],
  ["foil-enoki","锡纸金针菇","锡纸金针菇","vegetable",50,3,3,6,120],

  // ---- 便利店（罗森/全家/7-11） ----
  ["tuna-onigiri","金枪鱼饭团","金枪鱼饭团","staple",180,6,4,30,110],
  ["salmon-onigiri","三文鱼饭团","三文鱼饭团","staple",180,6,5,28,110],
  ["ebi-mayo-onigiri","蛋黄酱虾仁饭团","虾仁饭团","staple",190,6,6,28,110],
  ["egg-sandwich","鸡蛋三明治","鸡蛋三明治","staple",250,10,10,30,120],
  ["ham-sandwich","火腿三明治","火腿三明治","staple",260,11,11,28,120],
  ["tuna-sandwich","金枪鱼三明治","金枪鱼三明治","staple",240,12,9,28,120],
  ["blt-sandwich","BLT三明治","培根生菜番茄三明治","staple",270,12,14,26,120],
  ["teriyaki-bento","照烧鸡排饭","照烧鸡排便当","dish",240,16,9,24,400],
  ["katsu-curry-bento","咖喱猪排饭","咖喱猪排便当","dish",280,16,12,28,400],
  ["mapo-tofu-bento","麻婆豆腐饭","麻婆豆腐便当","dish",200,10,10,18,400],
  ["konnyaku-knot","魔芋结","魔芋丝结","vegetable",10,0.2,0,2,30],
  ["konbu","昆布","海带结","vegetable",12,1.2,0.1,2.3,30],
  ["chikuwa","竹轮","竹轮鱼糕","protein",80,10,2,6,50],
  ["meat-bun-convenience","酱肉包","酱肉包子","staple",240,9,8,33,100],
  ["mushroom-green-bun","香菇青菜包","香菇青菜包","staple",190,6,4,33,100],
  ["cup-noodle-seafood","合味道","合味道杯面","fastfood",450,9,20,58,80],
  ["ansung-tangmyun","辛拉面","辛拉面","fastfood",440,9,20,58,120],
  ["buldak-ramen","火鸡面","火鸡面","fastfood",460,10,22,58,140],
  ["nongshim-ramen","农心拉面","农心拉面","fastfood",440,9,20,58,120],
  ["red-bean-bun","红豆包","红豆面包","staple",280,8,6,50,100],
  ["cream-bun","奶油面包","奶油包","staple",300,7,10,46,100],
  ["donut","甜甜圈","甜甜圈","snack",380,5,20,46,60],
  ["swiss-roll","瑞士卷","瑞士卷","snack",320,5,16,40,80],

  // ---- 轻食/沙拉 ----
  ["avocado-salad","牛油果沙拉","牛油果沙拉","vegetable",150,3,12,8,200],
  ["quinoa-salad","藜麦沙拉","藜麦沙拉","vegetable",140,5,6,18,200],
  ["cobb-salad","考伯沙拉","考伯沙拉","vegetable",180,15,12,6,250],
  ["poke-bowl","波奇饭","三文鱼波奇饭","dish",200,14,9,18,350],
  ["tuna-poke","金枪鱼波奇饭","金枪鱼波奇饭","dish",190,14,7,20,350],
  ["acai-bowl","巴西莓碗","莓果碗","snack",180,4,6,30,200],
  ["wholemeal-sandwich","全麦三明治","全麦三明治","staple",220,10,7,30,120],
  ["chicken-wrap","鸡肉卷","鸡肉卷饼","staple",240,15,8,28,200],
  ["veggie-wrap","全素卷","全素卷","staple",180,6,6,28,200],

  // ---- 茶饮/甜品 ----
  ["cheese-tea","芝士奶盖茶","芝士茶","drink",100,2,5,14,500],
  ["cheese-strawberry","芝士莓莓","芝士莓莓","drink",120,1.5,4,22,500],
  ["cheese-mango","芝士芒芒","芝士芒芒","drink",120,1.5,4,22,500],
  ["fruit-tea","水果茶","超级水果茶","drink",60,0.3,0,15,700],
  ["lemon-tea","柠檬茶","手打柠檬茶","drink",45,0,0,11,500],
  ["duck-shit-lemon","鸭屎香柠檬茶","鸭屎香柠檬茶","drink",40,0,0,10,500],
  ["thai-green-lemon","泰绿柠檬茶","泰绿柠檬茶","drink",40,0,0,10,500],
  ["oat-milk-latte","燕麦拿铁","燕麦拿铁","drink",70,2,3,9,350],
  ["osmanthus-latte","桂花拿铁","桂花拿铁","drink",80,2.5,3,11,350],
  ["silk-stocking-tea","丝袜奶茶","港式奶茶","drink",80,2,4,10,350],
  ["hk-milk-tea","港式奶茶","港奶","drink",80,2,4,10,350],
  ["signature-tofu","招牌烧仙草","招牌烧仙草","drink",70,1,1,15,500],
  ["taro-ball-tofu","芋圆烧仙草","芋圆烧仙草","drink",90,1,2,18,500],
  ["mango-coconut","芒果西米露","芒果西米露","drink",100,1.5,3,18,350],
  ["mango-shuangpinai","芒果双皮奶","芒果双皮奶","drink",120,4,5,16,250],
  ["coconut-jelly","椰子冻","原味椰子冻","drink",90,1,3,15,200],
  ["mango-coconut-jelly","芒果椰子冻","芒果椰子冻","drink",100,1,3,17,200],
  ["mango-shave-ice","芒果绵绵冰","芒果绵绵冰","drink",150,3,4,28,300],
  ["matcha-shave-ice","抹茶绵绵冰","抹茶绵绵冰","drink",140,3,4,25,300],
  ["mousse-cake","慕斯蛋糕","慕斯蛋糕","snack",320,5,18,36,80],
  ["cheese-cake","芝士蛋糕","芝士蛋糕","snack",340,7,22,30,100],
  ["tiramisu","提拉米苏","提拉米苏","snack",300,5,18,30,100],
  ["black-forest","黑森林","黑森林蛋糕","snack",320,5,18,36,100],
  ["red-velvet","红丝绒","红丝绒蛋糕","snack",350,5,20,38,100],
  ["cream-puff","泡芙","酥皮泡芙","snack",320,6,20,30,60],
  ["almond-croissant","杏仁可颂","杏仁可颂","snack",390,8,22,40,80],
  ["macaron","马卡龙","法式马卡龙","snack",380,6,14,58,20],
  ["caramel-pudding","焦糖布丁","焦糖布丁","snack",120,3,4,18,120],
  ["matcha-pudding","抹茶布丁","抹茶布丁","snack",110,3,3,18,120],
  ["xue-meiniang","雪媚娘","雪媚娘","snack",240,2,12,32,60],
  ["daifuku","大福","草莓大福","snack",220,2,8,36,60],

  // ---- 酒类 ----
  ["ipa-beer","IPA","IPA精酿","drink",50,0.5,0,4,330],
  ["stout-beer","世涛","世涛啤酒","drink",50,0.5,0,5,330],
  ["lager-beer","拉格","拉格啤酒","drink",43,0.3,0,3.5,330],
  ["dry-red-wine","干红","干红葡萄酒","drink",85,0.1,0,2.5,150],
  ["dry-white-wine","干白","干白葡萄酒","drink",80,0.1,0,2,150],
  ["rose-wine","桃红","桃红葡萄酒","drink",75,0.1,0,2,150],
  ["champagne","香槟","香槟酒","drink",85,0.1,0,2,150],
  ["maotai","茅台","茅台酒","drink",290,0,0,0,50],
  ["wuliangye","五粮液","五粮液","drink",290,0,0,0,50],
  ["erguotou","二锅头","二锅头","drink",290,0,0,0,50],
  ["whisky","威士忌","威士忌","drink",250,0,0,0,50],
  ["brandy","白兰地","白兰地","drink",250,0,0,0,50],
  ["vodka","伏特加","伏特加","drink",230,0,0,0,50],
  ["rum","朗姆酒","朗姆酒","drink",230,0,0,0,50],
  ["tequila","龙舌兰","龙舌兰酒","drink",230,0,0,0,50],
  ["huadiao","花雕","花雕酒","drink",65,1.5,0,4,100],
  ["nuoerhong","女儿红","女儿红酒","drink",65,1.5,0,4,100],
  ["zhuangyuanhong","状元红","状元红酒","drink",65,1.5,0,4,100],

  // ---- 中式滋补 ----
  ["black-truffle","黑松露","松露","vegetable",50,3,0.5,8,10],
  ["birds-nest","燕窝","即食燕窝","supplement",30,5,0,3,50],
  ["fish-maw","花胶","鱼胶","protein",340,84,0.5,0,20],
  ["peach-gum","桃胶","桃胶","supplement",30,1,0,6,10],
  ["snow-lotus-seed","雪莲子","皂角米","staple",350,5,1,80,20],
  ["snow-swallow","雪燕","雪燕","supplement",25,0.5,0,6,5],
  ["qianshi","芡实","鸡头米","staple",350,8,1,78,20],
  ["fuling","茯苓","茯苓","supplement",20,1,0,4,10],
  ["ejiao-cake","阿胶糕","阿胶糕","snack",350,12,15,45,30],

  // ---- 婴儿辅食 ----
  ["baby-rice-cereal","婴儿米粉","高铁米粉","staple",380,7,2,80,25],
  ["apple-puree","苹果泥","苹果果泥","fruit",50,0.3,0.1,12,100],
  ["banana-puree","香蕉泥","香蕉果泥","fruit",60,0.5,0.1,15,100],
  ["chicken-puree","鸡肉泥","鸡肉肉泥","protein",100,15,3,2,80],
  ["beef-puree","牛肉泥","牛肉肉泥","protein",110,16,4,1,80],
  ["teething-biscuit","磨牙棒","磨牙饼干","snack",380,8,5,75,20],
  ["baby-puff","溶豆","溶豆","snack",390,7,5,80,15],
  ["star-puff","星星泡芙","星星泡芙","snack",380,6,4,82,15],
  ["finger-biscuit","手指饼干","手指饼干","snack",390,8,6,76,20],
];

const toInsert = []; let dupes = 0;
for (const def of defs) {
  const [id, name, aliasesRaw, category, kcal, protein, fat, carbs, grams] = def;
  if (knownIds.has(id)) { dupes++; continue; }
  const aliases = aliasesRaw ? aliasesRaw.split(",").map(a => a.trim()).filter(a => a && a !== name) : [];
  const aliasesStr = aliases.length > 0 ? aliases.map(a => '"' + a + '"').join(", ") : "";
  toInsert.push('  food("' + id + '", "' + name + '", [' + aliasesStr + '], "' + category + '", ' + kcal + ', ' + protein + ', ' + fat + ', ' + carbs + ', ' + grams + '),');
}

console.log("Total:", defs.length, "| Dupes:", dupes, "| Insert:", toInsert.length);

const lines = indexContent.split("\n");
let lastFood = -1, closeIdx = -1;
for (let i = 0; i < lines.length; i++) { if (lines[i].trimStart().startsWith("food(")) lastFood = i; }
for (let i = lastFood; i < lines.length; i++) { if (lines[i].trim() === "];") { closeIdx = i; break; } }
const before = lines.slice(0, closeIdx).join("\n");
const after = lines.slice(closeIdx).join("\n");
const result = before + "\n  // === Round 6: 西北/云南/贵州/广西/海南/早餐/烧烤/便利店/轻食/茶饮/酒类/滋补/辅食 ===\n" + toInsert.join("\n") + "\n" + after;
fs.writeFileSync("C:/Users/Administrator/Documents/健身日历/shared/index.ts", Buffer.from(result, "utf-8"));
console.log("Done! New total:", (indexContent.match(/food\("([^"]+)"/g) || []).length + toInsert.length);