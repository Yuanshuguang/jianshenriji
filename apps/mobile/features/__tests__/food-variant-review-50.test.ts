import assert from "node:assert/strict";
import test from "node:test";
import type { Food } from "@fitness-calendar/shared";
import { getFoodVariantOptions } from "../food-variant-options";

type VariantReviewCase = {
  name: string;
  inputText: string;
  food: Food;
  expectedLabels: string[];
  forbidden?: RegExp;
};

const cases: VariantReviewCase[] = [
  review("早餐泛化鸡蛋", "早上赶时间吃了两个鸡蛋", food("egg", "鸡蛋", ["蛋"], "protein"), ["水煮蛋", "煎蛋", "炸蛋", "卤蛋", "蒸蛋"]),
  review("早餐蒸蛋", "早餐一碗蒸蛋", food("egg", "鸡蛋", ["蒸蛋"], "protein"), ["蒸蛋"], /煎|炸|卤制|酱烧/),
  review("便利店茶叶蛋", "便利店买了两颗茶叶蛋", food("tea-egg", "茶叶蛋", ["卤蛋"], "protein"), ["卤蛋"], /煎|炸/),
  review("家庭煎蛋", "晚上加了一个煎蛋", food("egg", "鸡蛋", ["煎蛋"], "protein"), ["煎蛋"]),
  review("北方豆腐脑", "早上来一碗豆腐脑", food("tofu-pudding", "豆腐脑", ["豆腐花", "豆花"], "dish"), ["咸豆腐脑", "甜豆腐脑", "原味豆花", "辣卤豆腐脑"], /水煮|清蒸|煎炒|油炸|卤制|酱烧/),
  review("甜豆花", "下午吃了碗甜豆花", food("tofu-pudding", "豆腐脑", ["甜豆花"], "dish"), ["甜豆腐脑"]),
  review("咸豆腐脑", "早餐咸豆腐脑加点葱花", food("tofu-pudding", "豆腐脑", ["咸豆腐脑"], "dish"), ["咸豆腐脑"]),
  review("嫩豆腐", "晚饭切了一盒嫩豆腐", food("tofu", "豆腐", ["嫩豆腐", "老豆腐"], "protein"), ["嫩豆腐"]),
  review("老豆腐", "中午吃了两块老豆腐", food("tofu", "豆腐", ["老豆腐"], "protein"), ["老豆腐"]),
  review("香干", "加餐吃了几片香干", food("dried-tofu", "豆腐干", ["香干", "豆干"], "protein"), ["豆腐干"]),
  review("豆泡", "火锅里加了几个豆泡", food("fried-tofu-puff", "油豆腐", ["豆泡"], "protein"), ["油豆腐"]),
  review("千张", "凉拌千张吃了一份", food("tofu-skin", "豆腐皮", ["千张", "干豆腐"], "protein"), ["豆腐皮"]),
  review("成品麻婆豆腐", "外卖点了一份麻婆豆腐", food("mapo-tofu", "麻婆豆腐", ["麻婆豆腐盖饭"], "dish"), [], /水煮|煎炒|油炸|豆腐干/),
  review("成品炸鸡", "夜宵吃了一份炸鸡", food("fried-chicken", "炸鸡", ["韩式炸鸡"], "fastfood"), [], /水煮|清蒸|卤制|酱烧/),
  review("原料牛肉", "中午自己煮了200g牛肉", food("beef", "牛肉", ["牛腱子"], "protein"), ["水煮", "清蒸", "煎炒", "油炸", "卤制", "酱烧"]),
  review("成品卤牛肉", "晚上切了100g卤牛肉", food("braised-beef", "卤牛肉", ["酱牛肉"], "protein"), [], /水煮|清蒸|煎炒|油炸/),
  review("水煮鸡胸", "训练后吃了水煮鸡胸肉", food("chicken-breast", "鸡胸肉", ["鸡胸"], "protein"), ["水煮"]),
  review("炸虾仁", "聚餐吃了油炸虾仁", food("shrimp", "虾仁", ["虾"], "protein"), ["油炸"]),
  review("泛化花生", "下午随手抓了一把花生", food("peanuts", "花生", ["花生米"], "snack"), ["生花生", "水煮花生", "炒花生", "油炸花生"]),
  review("水煮花生", "夜宵半斤水煮花生", food("peanuts", "花生", ["水煮花生"], "snack"), ["水煮花生"], /炒花生|油炸花生|生花生/),
  review("泛化坚果", "办公室吃了包每日坚果", food("nuts", "坚果", ["每日坚果"], "snack"), ["原味坚果", "盐焗坚果", "糖衣坚果", "裹粉油炸坚果"]),
  review("蜂蜜核桃", "下午吃了点蜂蜜核桃", food("walnut", "核桃", ["核桃仁"], "snack"), ["糖衣坚果"]),
  review("盐焗开心果", "看电影吃了盐焗开心果", food("pistachio", "开心果", ["开心果仁"], "snack"), ["盐焗坚果"]),
  review("泛化爆米花", "看电影买了一桶爆米花", food("popcorn", "爆米花", ["popcorn"], "snack"), ["原味无油", "焦糖爆米花", "黄油爆米花"]),
  review("焦糖爆米花", "电影开场前吃了焦糖爆米花", food("popcorn", "爆米花", ["焦糖爆米花"], "snack"), ["焦糖爆米花"]),
  review("泛化奶茶", "下午喝了一杯奶茶", food("milk-tea", "奶茶", ["珍珠奶茶"], "drink"), ["无糖", "少糖", "标准糖", "加小料"]),
  review("无糖奶茶", "点了一杯无糖奶茶", food("milk-tea", "奶茶", ["无糖奶茶"], "drink"), ["无糖"]),
  review("珍珠奶茶", "下午茶喝了珍珠奶茶", food("boba-tea", "珍珠奶茶", ["波霸奶茶"], "drink"), ["加小料"]),
  review("泛化豆浆", "早餐喝了一杯豆浆", food("soy-milk", "豆浆", ["豆奶"], "drink"), ["无糖", "三分糖", "五分糖", "七分糖", "全糖"]),
  review("无糖豆浆", "早餐无糖豆浆300ml", food("soy-milk", "豆浆", ["无糖豆浆"], "drink"), ["无糖"]),
  review("半糖冰红茶", "下午喝了瓶半糖冰红茶", food("iced-tea", "冰红茶", ["红茶饮料"], "drink"), ["五分糖"]),
  review("七分糖凉茶", "加班喝了七分糖凉茶", food("herbal-tea", "凉茶", ["草本凉茶"], "drink"), ["七分糖"]),
  review("泛化咖啡", "早上喝了一杯咖啡", food("coffee", "咖啡", ["咖啡饮品"], "drink"), ["无糖", "加糖", "半糖", "全糖"]),
  review("美式咖啡", "训练前喝了杯美式咖啡", food("americano", "美式咖啡", ["美式", "黑咖啡"], "drink"), ["无糖"]),
  review("半糖拿铁", "早餐半糖拿铁一杯", food("latte", "拿铁", ["拿铁咖啡"], "drink"), ["半糖"]),
  review("泛化牛奶", "睡前喝了杯牛奶", food("milk", "牛奶", ["纯牛奶"], "drink"), ["全脂", "低脂", "脱脂"]),
  review("脱脂牛奶", "早上脱脂牛奶一盒", food("milk", "牛奶", ["脱脂牛奶"], "drink"), ["脱脂"]),
  review("无糖酸奶", "加餐吃了无糖酸奶", food("yogurt", "酸奶", ["无糖酸奶"], "drink"), ["无糖酸奶"]),
  review("希腊酸奶", "训练后希腊酸奶一杯", food("greek-yogurt", "酸奶", ["希腊酸奶"], "drink"), ["希腊酸奶"]),
  review("泛化水饺", "中午吃了一盘水饺", food("dumpling", "水饺", ["饺子"], "dish"), ["猪肉大葱馅", "素馅", "三鲜馅", "牛肉馅", "虾仁馅"]),
  review("牛肉饺子", "晚上煮了牛肉饺子", food("dumpling", "水饺", ["饺子"], "dish"), ["牛肉馅"]),
  review("三鲜水饺", "食堂吃了三鲜水饺", food("dumpling", "水饺", ["三鲜水饺"], "dish"), ["三鲜馅"]),
  review("菜包", "早餐一个菜包", food("baozi", "包子", ["菜包"], "staple"), ["素菜馅"]),
  review("流沙包", "早茶吃了两个流沙包", food("baozi", "包子", ["流沙包"], "staple"), ["流沙馅"]),
  review("虾仁馄饨", "夜宵一碗虾仁馄饨", food("wonton", "馄饨", ["云吞"], "dish"), ["虾仁馅"]),
  review("麻辣火锅", "周末聚餐吃了一顿麻辣火锅", food("hotpot", "火锅", ["麻辣烫"], "fastfood"), ["麻辣红油"]),
  review("皮蛋瘦肉粥", "早餐一碗皮蛋瘦肉粥", food("congee", "粥", ["白粥", "皮蛋瘦肉粥"], "dish"), ["皮蛋瘦肉粥"]),
  review("炒面", "晚上路边摊吃了一碗炒面", food("noodles", "面条", ["炒面", "汤面"], "staple"), ["炒面"]),
  review("排骨汤", "晚饭喝了一碗排骨汤", food("soup", "汤", ["排骨汤", "鸡汤"], "dish"), ["肉汤"]),
  review("清汤面", "中午来了一碗清汤面", food("noodles", "面条", ["汤面", "清汤面"], "staple"), ["清汤"]),
];

test("食物标签细分复测：50 条多场景口语化输入都落在正确细分维度", () => {
  assert.equal(cases.length, 50);

  for (const item of cases) {
    const labels = getFoodVariantOptions(item.food, { inputText: item.inputText }).map((option) => option.label);
    assert.deepEqual(labels, item.expectedLabels, item.name);
    assert.equal(labels.some((label) => /[\/／]/.test(label)), false, `${item.name} 出现了合并式标签: ${labels.join(", ")}`);
    if (item.forbidden) {
      assert.equal(labels.some((label) => item.forbidden?.test(label)), false, `${item.name} 出现了禁用候选: ${labels.join(", ")}`);
    }
  }
});

function review(name: string, inputText: string, food: Food, expectedLabels: string[], forbidden?: RegExp): VariantReviewCase {
  return { name, inputText, food, expectedLabels, forbidden };
}

function food(id: string, name: string, aliases: string[], category: Food["category"]): Food {
  return {
    id,
    name,
    aliases,
    category,
    caloriesPer100g: 100,
    proteinPer100g: 5,
    fatPer100g: 3,
    carbsPer100g: 10,
    defaultUnitGram: 100,
  };
}
