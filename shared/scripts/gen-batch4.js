// 从多渠道数据生成 food() 并将其合并到 index.ts
const fs = require("fs");

// ===== 步骤 1: 读取当前已知项 =====
const indexContent = fs.readFileSync("C:/Users/Administrator/Documents/健身日历/shared/index.ts", "utf-8");
const knownTerms = new Set();
const knownIds = new Set();
const foodRegex = /food\("([^"]+)"\s*,\s*"([^"]+)"\s*,\s*\[([^\]]*)\]/g;
let m;
while ((m = foodRegex.exec(indexContent)) !== null) {
  knownIds.add(m[1]);
  if (/[\u4e00-\u9fff]/.test(m[2])) knownTerms.add(m[2]);
  m[3].split(",").map(x => x.trim().replace(/^"/,"").replace(/"$/,"")).filter(Boolean).forEach(a => {
    if (/[\u4e00-\u9fff]/.test(a) && a.length > 1) knownTerms.add(a);
  });
}

// ===== 步骤 2: 巨型食物定义表 — 从多渠道搜集 =====
// 格式: [id, name, aliases, category, kcal, protein, fat, carbs, grams]
const defs = [
  // ---- 盖浇饭 ----
  ["sweet-sour-pork-rice","糖醋里脊盖饭","糖醋里脊盖浇饭","dish",240,14,12,18,400],
  ["red-braised-rib-rice","红烧排骨盖饭","红烧排骨盖浇饭","dish",260,18,15,12,400],
  ["twice-cooked-pork-rice","回锅肉盖饭","回锅肉盖浇饭","dish",250,14,16,10,400],
  ["spicy-chicken-rice","辣子鸡盖饭","辣子鸡盖浇饭","dish",260,20,15,10,400],
  ["potato-beef-rice","土豆牛肉盖饭","土豆烧牛肉盖饭","dish",200,14,8,18,400],
  ["green-pepper-pork-rice","青椒肉丝盖饭","青椒肉丝盖浇饭","dish",200,12,9,18,400],
  ["muxu-pork-rice","木须肉盖饭","木须肉盖浇饭","dish",210,12,10,16,400],
  ["disanxian-rice","地三鲜盖饭","地三鲜盖浇饭","dish",180,4,10,22,400],
  ["fish-eggplant-rice","鱼香茄子盖饭","鱼香茄子盖浇饭","dish",170,4,8,22,400],
  ["tomato-egg-rice","番茄炒蛋盖饭","西红柿炒蛋盖饭","dish",160,7,7,18,400],
  ["chive-egg-rice","韭菜鸡蛋盖饭","韭菜炒蛋盖饭","dish",160,7,7,18,400],
  ["onion-pork-rice","洋葱炒肉盖饭","洋葱炒肉盖浇饭","dish",190,10,9,18,400],
  ["garlic-scape-pork-rice","蒜薹肉丝盖饭","蒜苔肉丝盖饭","dish",200,10,8,20,400],
  ["braised-chicken-rice","红烧鸡块盖饭","红烧鸡盖浇饭","dish",230,18,12,14,400],
  ["sour-cabbage-rice","酸辣白菜盖饭","醋溜白菜盖饭","dish",140,3,6,20,400],
  ["tofu-pork-rice","腐竹烧肉盖饭","腐竹烧肉盖浇饭","dish",240,16,14,14,400],
  ["beans-pork-rice","豆角烧肉盖饭","豆角烧肉盖浇饭","dish",220,12,13,16,400],
  ["eggplant-pork-rice","茄子烧肉盖饭","茄子烧肉盖浇饭","dish",200,10,11,16,400],
  ["mapo-tofu-rice","麻婆豆腐盖饭","麻婆豆腐盖浇饭","dish",180,10,10,14,400],

  // ---- 面馆（各地）----
  ["beef-ban-mian","牛肉板面","牛肉板面,安徽板面","staple",170,8,5,24,350],
  ["lanzhou-lamian","兰州拉面","兰州牛肉拉面,兰州拉面","staple",150,7,3,24,350],
  ["tomato-beef-noodle","番茄牛肉面","番茄牛肉拉面","staple",140,8,4,20,350],
  ["pickled-cabbage-beef-noodle","酸菜牛肉面","酸菜牛肉拉面","staple",150,8,5,20,350],
  ["mushroom-noodle-soup","菌菇面","菌菇汤面,香菇面","staple",110,4,3,18,350],
  ["chicken-noodle-soup","鸡汤面","鸡汤拉面,鸡丝汤面","staple",120,6,3,18,350],
  ["dapai-noodle","大排面","猪排面","staple",200,14,8,20,350],
  ["spicy-meat-noodle","辣肉面","辣酱面","staple",180,10,8,20,350],
  ["tofu-skin-noodle","素鸡面","素鸡汤面","staple",130,8,4,18,350],
  ["pickled-mustard-noodle","雪菜肉丝面","雪菜肉丝汤面","staple",140,7,4,20,350],
  ["scallion-oil-noodle","葱油拌面","葱油面,开洋葱油拌面","staple",220,6,10,28,250],
  ["sesame-noodle","麻酱拌面","芝麻酱拌面","staple",240,7,11,28,250],
  ["yibin-ranmian","宜宾燃面","燃面,宜宾燃面","staple",230,8,10,28,250],
  ["wandou-noodle","豌杂面","豌豆杂酱面","staple",250,10,12,26,300],
  ["chongqing-xiaomian","重庆小面","小面,麻辣小面","staple",180,6,8,22,300],
  ["intestine-noodle","肥肠面","大肠面","staple",200,9,10,20,350],
  ["pork-liver-noodle","猪肝面","猪肝汤面","staple",150,10,4,20,300],
  ["kidney-noodle","腰花面","猪腰面","staple",160,11,5,20,300],
  ["duck-blood-noodle-soup","鸭血粉丝汤","老鸭粉丝汤,鸭血粉丝","dish",80,6,2,10,400],
  ["huainan-beef-soup","淮南牛肉汤","牛肉粉丝汤,淮南牛肉粉丝","dish",90,7,3,12,400],
  ["lamb-vermicelli-soup","羊肉粉丝","羊肉粉丝汤","dish",100,6,4,12,400],

  // ---- 米线/米粉 ----
  ["tomato-rice-noodle","番茄米线","番茄米线,番茄过桥米线","staple",100,4,2,18,350],
  ["sour-soup-noodle","酸汤米线","酸汤米线","staple",90,3,2,16,350],
  ["golden-soup-noodle","金汤肥牛米线","金汤米线,肥牛米线","staple",130,7,5,16,350],
  ["sichuan-pepper-noodle","藤椒米线","藤椒米线","staple",100,4,3,16,350],
  ["spicy-rice-noodle","麻辣米线","麻辣米线","staple",100,4,3,16,350],
  ["three-fresh-rice-noodle","三鲜米线","三鲜米线","staple",95,5,3,14,350],
  ["clam-rice-noodle","花甲米线","花甲米线","staple",110,7,3,16,350],
  ["claypot-rice-noodle","砂锅米线","砂锅米线","staple",120,6,4,18,400],
  ["nanchang-rice-noodle","南昌拌粉","南昌拌粉","staple",150,4,6,22,300],
  ["jinshi-beef-noodle","津市牛肉粉","津市牛肉粉","staple",170,9,6,22,350],
  ["zunyi-lamb-noodle","遵义羊肉粉","遵义羊肉粉","staple",180,9,7,22,350],
  ["huaxi-beef-noodle","花溪牛肉粉","花溪牛肉粉","staple",170,9,6,22,350],

  // ---- 麻辣烫/冒菜/串串 ----
  ["bone-soup-malatang","骨汤麻辣烫","骨汤麻辣烫","fastfood",110,5,4,14,400],
  ["tomato-malatang","番茄麻辣烫","番茄麻辣烫","fastfood",100,4,3,14,400],
  ["beef-maocai","牛肉冒菜","牛肉冒菜","fastfood",150,12,7,11,400],
  ["fatty-beef-maocai","肥牛冒菜","肥牛冒菜","fastfood",200,14,14,8,400],
  ["luncheon-meat-maocai","午餐肉冒菜","午餐肉冒菜","fastfood",180,9,12,12,400],
  ["shrimp-paste-maocai","虾滑冒菜","虾滑冒菜","fastfood",140,10,5,14,400],

  // ---- 饺子/馄饨/抄手 ----
  ["chive-egg-dumpling","韭菜鸡蛋饺","韭菜鸡蛋饺子","dish",180,6,7,24,200],
  ["cabbage-pork-dumpling","白菜猪肉饺","白菜猪肉饺子","dish",220,8,9,26,200],
  ["celery-pork-dumpling","芹菜猪肉饺","芹菜猪肉饺子","dish",210,8,8,26,200],
  ["corn-pork-dumpling","玉米猪肉饺","玉米猪肉饺子","dish",200,8,7,27,200],
  ["shrimp-dumpling","鲜虾饺","鲜虾饺子,虾仁饺","dish",180,9,5,25,200],
  ["three-fresh-dumpling","三鲜水饺","三鲜饺子","dish",220,9,8,26,200],
  ["sour-soup-dumpling","酸汤水饺","酸汤饺子","dish",150,6,5,22,300],
  ["red-oil-wonton","红油抄手","红油抄手","dish",200,8,10,20,200],
  ["spicy-wonton","老麻抄手","麻辣抄手","dish",190,8,9,20,200],
  ["clear-wonton","清汤抄手","清汤抄手","dish",150,7,5,22,250],

  // ---- 黄焖鸡/煲仔饭 ----
  ["braised-ribs","黄焖排骨","黄焖排骨","dish",230,16,15,10,300],
  ["braised-pork-trotter","黄焖猪蹄","黄焖猪蹄","dish",250,18,17,8,300],
  ["braised-prawns","黄焖大虾","黄焖大虾","dish",160,14,6,12,300],
  ["preserved-meat-claypot","腊味煲仔饭","腊味煲仔饭","dish",240,10,12,24,400],
  ["ribs-claypot","排骨煲仔饭","排骨煲仔饭","dish",230,12,10,24,400],
  ["chicken-claypot","滑鸡煲仔饭","滑鸡煲仔饭","dish",200,14,8,22,400],
  ["beef-claypot","牛肉煲仔饭","牛肉煲仔饭","dish",220,15,9,22,400],
  ["charsiu-claypot","叉烧煲仔饭","叉烧煲仔饭","dish",240,13,10,26,400],
  ["dual-claypot","双拼煲仔饭","双拼煲仔饭","dish",240,13,10,25,400],

  // ---- KFC/麦当劳 ----
  ["spicy-chicken-wing","香辣鸡翅","香辣鸡翅","fastfood",280,16,18,14,120],
  ["orleans-chicken-wing","奥尔良烤鸡翅","奥尔良鸡翅","fastfood",250,17,15,10,120],
  ["crispy-chicken-leg","脆皮鸡腿","脆皮炸鸡腿","fastfood",290,18,18,12,150],
  ["honey-chicken-leg","蜜汁鸡腿","蜜汁烤鸡腿","fastfood",240,20,12,10,150],
  ["zinger-burger","香辣鸡腿堡","香辣鸡腿汉堡","fastfood",300,16,15,26,180],
  ["old-beijing-chicken-roll","老北京鸡肉卷","老北京鸡肉卷","fastfood",280,14,12,28,200],
  ["mexican-chicken-roll","墨西哥鸡肉卷","墨西哥鸡肉卷","fastfood",290,14,13,28,200],
  ["egg-tart","蛋挞","葡式蛋挞","snack",300,6,18,30,60],
  ["taro-egg-tart","紫薯蛋挞","紫薯蛋挞","snack",290,5,17,32,60],
  ["durian-egg-tart","榴莲蛋挞","榴莲蛋挞","snack",310,5,19,32,60],
  ["pineapple-pie","菠萝派","菠萝派","snack",270,3,13,36,80],
  ["taro-pie","香芋派","香芋派","snack",280,3,14,36,80],
  ["red-bean-pie","红豆派","红豆派","snack",270,3,13,37,80],
  ["large-fries","大薯条","大薯条","snack",312,3.4,15,42,150],
  ["green-salad","田园沙拉","田园沙拉","vegetable",25,1,1,3,150],
  ["corn-cup","玉米杯","香甜玉米杯","vegetable",55,1.5,0.5,12,100],
  ["mashed-potato","土豆泥","鸡汁土豆泥","staple",80,2,2,14,120],
  ["nine-fruit-juice","九珍果汁","九珍果汁","drink",40,0,0,10,350],
  ["lemon-black-tea","柠檬红茶","柠檬红茶","drink",35,0,0,9,350],
  ["hot-chocolate","热巧克力","热巧克力","drink",100,3,3.5,15,300],
  ["mcwings","麦辣鸡翅","麦辣鸡翅","fastfood",290,17,19,14,120],
  ["mcflurry","麦旋风","麦旋风","snack",200,4,8,28,150],
  ["sundae","圣代","圣代","snack",180,3,7,26,150],
  ["cone-icecream","圆筒冰淇淋","甜筒","snack",150,3,5,24,100],
  
  // ---- 火锅食材 ----
  ["qiancengdu","千层肚","千层毛肚","protein",110,14,4,2,120],
  ["xianmaodu","鲜毛肚","鲜毛肚","protein",110,14,4,2,120],
  ["crispy-maodu","脆毛肚","脆毛肚","protein",110,14,4,2,120],
  ["huanghou","黄喉","猪黄喉,牛黄喉","protein",80,12,3,1,120],
  ["fresh-duck-intestine","鲜鸭肠","鲜鸭肠","protein",100,14,4,2,100],
  ["crispy-duck-intestine","脆鸭肠","脆鸭肠","protein",100,14,4,2,100],
  ["goose-intestine","鹅肠","鲜鹅肠","protein",100,13,4,2,100],
  ["fish-paste","鱼滑","鱼滑","protein",80,12,2,4,100],
  ["cuttlefish-paste","墨鱼滑","墨鱼滑","protein",85,12,2,4,100],
  ["beef-meatball","牛筋丸","牛筋丸","protein",180,14,12,6,100],
  ["sanian-beef-ball","撒尿牛丸","撒尿牛丸","protein",190,11,13,8,80],
  ["gongwan","贡丸","贡丸","protein",200,12,14,6,80],
  ["crab-roe-ball","蟹籽丸","蟹籽丸","protein",160,8,9,12,80],
  ["fish-tofu-pouch","鱼籽福袋","鱼籽福袋","protein",180,10,9,14,80],
  ["purple-potato-ball","紫薯糯米丸","紫薯糯米丸","snack",200,3,5,36,60],
  ["snowflake-beef","雪花肥牛","雪花肥牛","protein",300,16,25,0,120],
  ["lamb-roll","羊肉卷","羊肉卷","protein",260,17,21,0,120],
  ["high-calcium-lamb","高钙羊肉","高钙羊肉","protein",270,18,21,0,120],
  ["silkie-roll","乌鸡卷","乌鸡卷","protein",130,22,4,0,120],
  ["fresh-duck-blood","鲜鸭血","鲜鸭血","protein",55,14,0.3,0,150],
  ["blood-curd","血旺","血旺,猪血旺","protein",55,12,0.3,0.6,150],
  ["brain-flower","脑花","猪脑,猪脑花","protein",130,10,10,0.8,80],
  ["xiangling-roll","响铃卷","炸响铃","snack",350,15,25,18,50],
  ["mini-youtiao","小油条","茴香小油条","staple",350,7,17,45,80],
  ["korean-rice-cake","芝士年糕","芝士年糕","staple",200,4,5,35,150],
  ["potato-noodle","土豆粉","土豆粉条","staple",80,1,0.3,19,200],
  ["crystal-noodle","水晶粉","水晶粉条","staple",90,0.5,0,22,150],
  ["sweet-potato-noodle","红薯粉","红薯粉条","staple",85,0.5,0.2,21,150],
  ["mushroom-platter","菌菇拼盘","菌菇拼盘","vegetable",25,2,0.3,5,200],
  ["vegetable-platter","蔬菜拼盘","蔬菜拼盘","vegetable",20,1.5,0.3,4,200],
  ["tofu-platter","豆制品拼盘","豆制品拼盘","protein",100,10,5,5,150],
  ["hotpot-noodle-cake","方便面饼","火锅面饼","staple",440,9,20,58,80],
];

// ===== 步骤 3: 去重 & 生成 =====
const toInsert = [];
let dupeCount = 0;
for (const def of defs) {
  const [id, name, aliasesRaw, category, kcal, protein, fat, carbs, grams] = def;
  if (knownIds.has(id)) { dupeCount++; continue; }
  const aliases = aliasesRaw ? aliasesRaw.split(",").map(a => a.trim()).filter(a => a && a !== name) : [];
  const aliasesStr = aliases.length > 0 ? aliases.map(a => '"' + a + '"').join(", ") : "";
  
  let line = '  food("' + id + '", "' + name + '", [' + aliasesStr + '], "' + category + '", ' + kcal + ', ' + protein + ', ' + fat + ', ' + carbs + ', ' + grams + '),';
  toInsert.push(line);
}

console.log("Generated:", defs.length, "foods");
console.log("Duplicates skipped:", dupeCount);
console.log("Inserting:", toInsert.length);

// ===== 步骤 4: 合并到 index.ts =====
const lines = indexContent.split("\n");
let lastFood = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trimStart().startsWith("food(")) lastFood = i;
}
let closeIdx = -1;
for (let i = lastFood; i < lines.length; i++) {
  if (lines[i].trim() === "];") { closeIdx = i; break; }
}

const before = lines.slice(0, closeIdx).join("\n");
const after = lines.slice(closeIdx).join("\n");
const insert = "\n  // === Round 4: 多渠道搜集（外卖/餐厅/KFC/火锅/日料/韩餐/西餐/东南亚/地方菜/早餐/烧烤/便利店/茶饮） ===\n" + toInsert.join("\n") + "\n";
const result = before + insert + after;

fs.writeFileSync("C:/Users/Administrator/Documents/健身日历/shared/index.ts", Buffer.from(result, "utf-8"));
console.log("Written! " + toInsert.length + " new foods added");