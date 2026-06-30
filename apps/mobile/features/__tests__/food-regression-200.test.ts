// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";
import { parseFoodIntelligence } from "../food-intelligence-engine";

// regression: 107 cases
// 01-meal: 25 cases
test("01-meal", () => {
  const c = [["早上吃了两个包子一杯豆浆", {"baozi": "breakfast", "doujiang": "breakfast"}], ["早晨一碗皮蛋瘦肉粥一根油条", {"preserved-egg-pork-congee": "breakfast", "youtiao": "breakfast"}], ["早上一杯黑咖啡", {"americano": "breakfast"}], ["早上两个蒸蛋一杯豆浆", {"steamed-egg": "breakfast", "doujiang": "breakfast"}], ["早餐一碗白粥一个水煮蛋", {"congee": "breakfast", "egg": "breakfast"}], ["早饭一碗小馄饨", {"fallback-b2-small-wonton": "breakfast"}], ["早上三个猪肉大葱馅儿水饺", {"pork-scallion-dumplings": "breakfast"}], ["早上一个红薯一杯拿铁", {"sweet-potato": "breakfast", "latte": "breakfast"}], ["早上一杯酸奶半碗燕麦", {"yogurt": "breakfast", "oatmeal": "breakfast"}], ["中午一碗米饭一份西红柿炒鸡蛋", {"rice-cooked": "lunch", "tomato-egg": "lunch"}], ["午饭一份黄焖鸡米饭一瓶可乐", {"huangmenji": "lunch", "cola": "lunch"}], ["中午一个大汉堡一份薯条", {"hamburger": "lunch", "kfc-fries": "lunch"}], ["午饭一份蛋炒饭加一个卤蛋", {"fried-rice": "lunch", "tea-egg": "lunch"}], ["中午一份石锅拌饭", {"bibimbap": "lunch"}], ["中午一份牛肉面", {"beef-noodle-soup": "lunch"}], ["晚饭一盘清蒸鱼一份西兰花", {"fish": "dinner", "broccoli": "dinner"}], ["晚上一个土豆炖牛肉", {"beef-stew": "dinner"}], ["晚上半斤白切鸡一碗饭", {"white-cut-chicken": "dinner", "rice-cooked": "dinner"}], ["晚上一份麻婆豆腐", {"mapo-tofu": "dinner"}], ["晚上一顿火锅", {"hotpot": "dinner"}], ["加餐一根香蕉一盒蓝莓", {"banana": "snack", "blueberry": "snack"}], ["下午一杯拿铁一块黑巧克力", {"latte": "snack", "dark-chocolate": "snack"}], ["宵夜一碗螺蛳粉", {"luo-si-fan": "snack"}], ["早上两个包子 下午一杯咖啡 晚上一份火锅", {"baozi": "breakfast", "coffee": "snack", "hotpot": "dinner"}], ["中午一份披萨 下午两个猕猴桃 晚上半斤盐水鸭", {"pizza": "lunch", "kiwi": "snack", "salted-duck": "dinner"}]];
  for (const [input, expected] of c) {
    const r = parseFoodIntelligence(input);
    const m = new Map(r.items.map(x => [x.food.id, x.meal]));
    let ok = true; let msg = "";
    for (const [id, meal] of Object.entries(expected)) {
      const a = m.get(id);
      if (!a) { ok = false; msg = "missing " + id; break; }
      if (a !== meal) { ok = false; msg = id + "=" + a + " exp " + meal; break; }
    }
    if (!ok) {
      const got = [...m.entries()].map(([k, v]) => k + "=" + v).join(",");
      assert.equal(ok, true, input + ": " + msg + " [" + got + "]");
    }
  }
});

// 02-generic: 13 cases
test("02-generic", () => {
  const c = [["3个面包", "bread", "面包类型"], ["一碗水饺", "dumplings", "水饺馅料"], ["两个包子", "baozi", "包子馅料"], ["半斤花生", "peanuts", "花生加工方式"], ["一个鸡蛋", "egg", "鸡蛋做法"], ["一碗豆腐脑", "tofu-pudding", "豆腐脑口味"], ["一块豆腐", "tofu", "豆制品类型"], ["一包坚果", "nuts", "坚果加工方式"], ["一杯奶茶", "milk-tea", "奶茶糖度/小料"], ["一杯豆浆", "doujiang", "饮品糖度"], ["一杯咖啡", "coffee", "咖啡糖度"], ["一碗面条", "noodles", "面食做法"], ["一杯牛奶", "milk", "牛奶脂肪类型"]];
  for (const [input, fid, grp] of c) {
    const r = parseFoodIntelligence(input);
    const m = r.items.find(x => x.food.id === fid);
    assert.ok(m, input + ": expected " + fid);
    assert.equal(m.needsDetails, true, input + ": generic needs details");
    if (grp) assert.match(m.detailHint ?? "", new RegExp(grp), input + ": hint");
  }
});

// 03-specific: 19 cases
test("03-specific", () => {
  const c = [["两个蒸蛋", "steamed-egg"], ["一碗鸡蛋羹", "steamed-egg"], ["甜豆腐脑", "tofu-pudding"], ["咸豆花", "tofu-pudding"], ["菠萝包", "bread-bun"], ["清蒸鱼肉", "fish"], ["水煮花生", "boiled-peanuts"], ["油炸花生", "fried-peanuts"], ["皮蛋瘦肉粥", "preserved-egg-pork-congee"], ["鸡蛋羹", "steamed-egg"], ["无糖酸奶", "yogurt"], ["美式咖啡", "americano"], ["黑巧克力", "dark-chocolate"], ["盐焙腰果", "cashew"], ["无糖奶茶", "milk-tea"], ["无糖豆浆", "doujiang"], ["一个水煮蛋", "egg"], ["一个煎蛋", "egg"], ["红烧牛肉面", "beef-noodle-soup"]];
  for (const [input, fid] of c) {
    const r = parseFoodIntelligence(input);
    const m = r.items.find(x => x.food.id === fid);
    assert.ok(m, input + ": expected " + fid);
    assert.equal(m.needsDetails, false, input + ": specific NOT need details");
  }
});

// 04-intact: 16 cases
test("04-intact", () => {
  const c = [["皮蛋瘦肉粥", ["preserved-egg-pork-congee"], ["egg", "pork-lean"]], ["西红柿炒鸡蛋", ["tomato-egg"], ["tomato", "egg"]], ["高蛋白鸡胸肉丸", ["high-protein-chicken-meatballs"], ["egg", "chicken-breast"]], ["黑巧布朗尼", ["dark-chocolate-brownie"], ["chocolate"]], ["板烧鸡腿堡", ["grilled-chicken-burger"], ["hamburger", "chicken-breast"]], ["蛋炒饭", ["fried-rice"], ["egg", "rice-cooked"]], ["麻婆豆腐", ["mapo-tofu"], ["tofu"]], ["黄焖鸡米饭", ["huangmenji"], []], ["卤牛肉", ["beef"], []], ["炸鸡", ["fried-chicken"], []], ["蒜香面包干", ["garlic-bread-crisps"], ["bread"]], ["干脆面", ["crispy-noodles"], ["noodles"]], ["烤馍", ["roasted-mantou"], ["mantou", "bread"]], ["猪肉大葱水饺", ["pork-scallion-dumplings"], ["dumplings"]], ["白切鸡", ["white-cut-chicken"], []], ["牛肉面", ["beef-noodle-soup"], []]];
  for (const [input, exp, forbid] of c) {
    const r = parseFoodIntelligence(input);
    const ids = r.items.map(x => x.food.id);
    for (const id of exp) assert.ok(ids.includes(id), input + ": missing " + id);
    for (const id of forbid) assert.equal(ids.includes(id), false, input + ": forbid " + id);
  }
});

// 05-noisy: 6 cases
test("05-noisy", () => {
  const c = [["早上啃了一个玉米喝了杯拿铁", ["corn", "latte"]], ["中午食堂打饭一碗米饭一份番茄炒蛋一盘西兰花", ["rice-cooked", "tomato-egg", "broccoli"]], ["练完吃一块鸡胸肉喝一勺蛋白粉", ["chicken-breast", "protein-powder"]], ["健身前吃了一根香蕉喝了半勺蛋白粉", ["banana", "protein-powder"]], ["今天有点饿吃了一包薯片一杯奶茶", ["chips", "milk-tea"]], ["今天管不住嘴吃了两块黑巧克力和半包坚果", ["dark-chocolate", "nuts"]]];
  for (const [input, exp] of c) {
    const r = parseFoodIntelligence(input);
    const ids = r.items.map(x => x.food.id);
    for (const id of exp) assert.ok(ids.includes(id), input + ": missing " + id);
  }
});

// 06-portion: 12 cases
test("06-portion", () => {
  const c = [["一大碗米饭", "rice-cooked", 220], ["一小碗面条", "noodles", 140], ["三大块西瓜", "watermelon", 700], ["三个橘子", "orange", 350], ["四根黄瓜", "cucumber", 400], ["半斤麻辣花生", "spicy-peanuts", 200], ["一个很大的红薯", "sweet-potato", 100], ["两杯拿铁", "latte", 400], ["半串葡萄", "grape", 60], ["半只烤鸭", "roast-duck", 500], ["一大块卤牛肉", "beef", 150], ["三个中等土豆", "potato", 350]];
  for (const [input, fid, mn] of c) {
    const r = parseFoodIntelligence(input);
    const m = r.items.find(x => x.food.id === fid);
    assert.ok(m, input + ": expected " + fid);
    assert.ok(m.grams >= mn, input + ": grams=" + m.grams + " less than " + mn);
  }
});

// 07-abstract: 5 cases
test("07-abstract", () => {
  const c = [["两颗拳头大的西红柿", "tomato", 250], ["一碗和手机差不多重的牛肉面", "beef-noodle-soup", 200], ["三个拳头大的西瓜块", "watermelon", 350], ["两个拳头大的土豆", "potato", 200], ["一大块拳头大小的鸡胸肉", "chicken-breast", 120]];
  for (const [input, fid, mn] of c) {
    const r = parseFoodIntelligence(input);
    const m = r.items.find(x => x.food.id === fid);
    assert.ok(m, input + ": expected " + fid);
    assert.ok(m.grams >= mn, input + ": grams=" + m.grams + " less than " + mn);
  }
});

// 08-long: 5 cases
test("08-long", () => {
  const c = [["早上：两个包子一杯豆浆。中午：一碗米饭一份红烧肉一盘青菜。午后：一包坚果一杯咖啡。晚上：一碗饭一份鱼肉一盘西兰花。", 8], ["早上两个蒸蛋一碗小米粥。中午一份麻辣香锅一碗米饭。午后两个猕猴桃一包每日坚果。晚上半斤白灼虾一份蒜蓉生菜。", 8], ["减脂日：早上两个水煮蛋一杯黑咖啡。中午150g鸡胸肉一碗沙拉。午后一个苹果半勺蛋白粉。晚餐150g鱼一份西兰花。", 7], ["第一次吃：早上一个餥头一个茶叶蛋。中午一份青椒肉丝盖饭。午后一包辣条一杯毋橄水。晚上一盆酸菜鱼一碗饭。", 7], ["办公室日常：早上地铁口买了一个煎饼果子一杯豆浆。中午和同事拼单外卖红烧牛肉面加卤蛋。午后三点困了喝杯拿铁。", 5]];
  for (const [input, mn] of c) {
    const r = parseFoodIntelligence(input);
    assert.ok(r.items.length >= mn, input + ": items=" + r.items.length + " less than " + mn);
  }
});

// 09-unknown: 2 cases
test("09-unknown", () => {
  const c = [["不知名的神秘太空食物", 1], ["一碗神秘的异世界汤", 1]];
  for (const [input, um] of c) {
    const r = parseFoodIntelligence(input);
    if (um > 0) assert.ok(r.unmatched.length >= um, input + ": unmatched=" + r.unmatched.length + " less than " + um);
  }
});

// 10-user: 4 cases
test("10-user", () => {
  const c = [["一个鸡蛋，两个蒸蛋，一碗南瓜粥，一碗豆腐脑", ["egg", "steamed-egg", "pumpkin-congee", "tofu-pudding"], []], ["中午吃了半斤瘦肉、一份菠菜、3个面包、一碗水饺", ["pork-lean", "spinach", "bread", "dumplings"], []], ["一碗水饺", ["dumplings"], ["pork-scallion-dumplings"]], ["甜豆腐脑", ["tofu-pudding"], []]];
  for (const [input, exp, forbid] of c) {
    const r = parseFoodIntelligence(input);
    const ids = r.items.map(x => x.food.id);
    for (const id of exp) assert.ok(ids.includes(id), input + ": missing " + id);
    for (const id of forbid) assert.equal(ids.includes(id), false, input + ": forbid " + id);
  }
});
