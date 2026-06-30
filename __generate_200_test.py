#!/usr/bin/env python3
from pathlib import Path
import json

dst = Path(r"C:\Users\Administrator\Documents\健身日历\apps\mobile\features\__tests__\food-regression-200.test.ts")
lines = []

def j(v):
    return json.dumps(v, ensure_ascii=False)

lines.append('import test from "node:test";')
lines.append('import assert from "node:assert/strict";')
lines.append('import { parseFoodIntelligence } from "../food-intelligence-engine";')
lines.append("")

# 1. Meal scenarios (50)
meal = [
    ["早上吃了两个包子一杯豆浆", {"baozi":"breakfast","soy-milk":"breakfast"}],
    ["早晨一碗皮蛋瘦肉粥一根油条", {"preserved-egg-pork-congee":"breakfast","youtiao":"breakfast"}],
    ["早上一杯黑咖啡", {"americano":"breakfast"}],
    ["早上两个蒸蛋一杯豆浆", {"steamed-egg":"breakfast","soy-milk":"breakfast"}],
    ["早餐一碗白粥一个水煮蛋", {"congee":"breakfast","egg":"breakfast"}],
    ["晚饭一盘清蒸鱼一份西兰花", {"steamed-fish":"dinner","broccoli":"dinner"}],
    ["宵夜一碗螺蛳粉", {"luo-si-fan":"snack"}],
    ["夜宵三串烤串一罐啤酒", {"lamb-skewers":"snack","beer":"snack"}],
]

# add more quickly
more_meals = [
    ["早饭一碗小馄饨", {"wonton":"breakfast"}],
    ["早上三个猪肉大葱馅儿水饺", {"pork-scallion-dumplings":"breakfast"}],
    ["早上一个红薯一杯拿铁", {"sweet-potato":"breakfast","latte":"breakfast"}],
    ["早上一杯酸奶半碗燕麦", {"yogurt":"breakfast","oatmeal":"breakfast"}],
    ["中午一碗米饭一份西红柿炒鸡蛋", {"rice-cooked":"lunch","tomato-egg":"lunch"}],
    ["午饭一份黄焖鸡米饭一瓶可乐", {"huangmenji":"lunch","cola":"lunch"}],
    ["中午一个大汉堡一份薯条", {"hamburger":"lunch","kfc-fries":"lunch"}],
    ["午饭一份蛋炒饭加一个卤蛋", {"fried-rice":"lunch","egg":"lunch"}],
    ["中饭一份凉皮一个肉夹馍", {"liangpi":"lunch","chinese-burger":"lunch"}],
    ["中午一份石锅拌饭", {"bibimbap":"lunch"}],
    ["午餐一碗贵州米粉", {"rice-noodle":"lunch"}],
    ["中午一份卤肉饭", {"braised-pork-rice":"lunch"}],
    ["中午一份牛肉面", {"beef-noodle-soup":"lunch"}],
    ["午饭一份番茄牛腩饭", {"tomato-beef-rice":"lunch"}],
    ["晚上一碗饭一份辣椒炒肉", {"rice-cooked":"dinner","pepper-pork":"dinner"}],
    ["晚饭一份红烧牛肉一份白菜", {"beef-brisket-braise":"dinner","cabbage":"dinner"}],
    ["晚上一个土豆炖牛肉", {"beef-stew":"dinner"}],
    ["晚上半斤白切鸡一碗饭", {"white-cut-chicken":"dinner","rice-cooked":"dinner"}],
    ["晚饭两串烤鸡翅一罐冰可乐", {"bbq-wing":"dinner","cola":"dinner"}],
    ["晚上一份麻婆豆腐", {"mapo-tofu":"dinner"}],
    ["晚饭吃了五串羊肉串", {"lamb-skewers":"dinner"}],
    ["晚上一顿火锅", {"hotpot":"dinner"}],
    ["晚餐一份水煮鱼", {"boiled-fish":"dinner"}],
    ["下午吃了一个苹果和一把腰果", {"apple":"snack","cashew":"snack"}],
    ["下午一包薯片半杯奶茶", {"chips":"snack","milk-tea":"snack"}],
    ["下午茶半块蛋糕一杯美式", {"cake":"snack","americano":"snack"}],
    ["下午一瓶元气森林一包坚果", {"sugar-free-soda":"snack","nuts":"snack"}],
    ["下午喝了半杯伯牙绝弦", {"milk-tea":"snack"}],
    ["加餐一根香蕉一盒蓝莓", {"banana":"snack","blueberry":"snack"}],
    ["下午一杯拿铁一块黑巧克力", {"latte":"snack","dark-chocolate":"snack"}],
    ["加餐吃了一个橘子一盒酸奶", {"orange":"snack","yogurt":"snack"}],
    ["早上一个鸡蛋一碗粥 中午一份红烧肉一碗饭", {"egg":"breakfast","congee":"breakfast"}],
    ["中午一碗米饭一份青菜 晚上一块鸡胸肉一份西兰花", {"rice-cooked":"lunch"}],
    ["早上两个包子 下午一杯咖啡 晚上一份火锅", {"baozi":"breakfast","coffee":"snack","hotpot":"dinner"}],
    ["早上一个鸡蛋 中午一碗饭 晚上一块牛排 下午一杯奶茶", {"egg":"breakfast","rice-cooked":"lunch","milk-tea":"snack"}],
    ["中午一碗牛肉面 下午一个橙子 晚上一份沙拉", {"beef-noodle-soup":"lunch","orange":"snack","salad":"dinner"}],
    ["中午一份黄焖鸡 下午一杯气泡水 晚上一份沙拉", {"huangmenji":"lunch","sugar-free-soda":"snack","salad":"dinner"}],
    ["早上两个蒸蛋 中午一份卤肉饭 下午一包薯片 晚上一份酸菜鱼", {"steamed-egg":"breakfast","braised-pork-rice":"lunch","chips":"snack","boiled-fish":"dinner"}],
    ["早上一杯豆浆 中午一份凉皮 下午一根玉米 晚上一份水煮鱼", {"soy-milk":"breakfast","liangpi":"lunch","corn":"snack","boiled-fish":"dinner"}],
    ["中午一份披萨 下午两个猕猴桃 晚上半斤盐水鸭", {"pizza":"lunch","kiwi":"snack","salted-duck":"dinner"}],
    ["早晨一杯牛奶两片全麦面包", {"milk":"breakfast","oat-bread":"breakfast"}],
]

meal.extend(more_meals)

lines.append(f"// 餐次归属共 {len(meal)} 条")
lines.append('test("回归-餐次归属", () => {')
lines.append("  const cases = [")
for inp, exp in meal:
    lines.append(f"    {{ input: {j(inp)}, expected: {j(exp)} }},")
lines.append("  ];")
lines.append(f'  assert.equal(cases.length, {len(meal)});')
lines.append("  for (const s of cases) {")
lines.append("    const r = parseFoodIntelligence(s.input);")
lines.append("    const m = new Map(r.items.map(i=>[i.food.id,i.meal]));")
lines.append("    let ok=true;let msg='';")
lines.append("    for(const[id,meal]of Object.entries(s.expected)){")
lines.append("      const a=m.get(id);")
lines.append("      if(!a){ok=false;msg='missing '+id;break}")
lines.append("      if(a!==meal){ok=false;msg=id+'='+a+' exp '+meal;break}")
lines.append("    }")
lines.append("    if(!ok){")
lines.append("      const got=[...m.entries()].map(([k,v])=>k+'='+v).join(',');")
lines.append("      assert.equal(ok,true,s.input+': '+msg+', got ['+got+']');")
lines.append("    }")
lines.append("  }")
lines.append("});")

dst.write_text("\n".join(lines), encoding="utf-8")
print(f"Done: {len(lines)} lines, {len(meal)} meal cases")
