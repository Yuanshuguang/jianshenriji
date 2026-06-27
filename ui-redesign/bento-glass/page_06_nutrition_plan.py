# -*- coding: utf-8 -*-
"""饮食 · 推荐计划"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from bg_common import *

def render():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    status_bar(d)
    label_uc(d, (20, 48), "6月23日 · 饮食", ls=1.5)
    d.text((20, 62), "今日推荐", font=F("OutfitBold", 26), fill=C["ink"])
    glass_tile(img, [W-92, 56, W-18, 84], radius=14, glow=C["accent"], glow_strength=4)
    d = ImageDraw.Draw(img)
    d.text((W-55, 70), "1630", font=F("GeistMonoBold", 13), fill=C["accent"], anchor="mm")

    # 顶部热量汇总横条
    y = 104
    glass_tile(img, [16, y, W-16, y+92], radius=22, glow=C["accent"], glow_strength=6)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "TOTAL / 今日总热量", ls=1.2)
    d.text((32, y+36), "1630", font=F("GeistMonoBold", 32), fill=C["accent"])
    d.text((32, y+74), "kcal · 目标 1650", font=F("YaHei", 11), fill=C["inkMute"])
    # 宏量迷你
    f_ml = F("GeistMono", 10)
    macros = [("P 118g",C["accent"]),("F 43g",C["accent2"]),("C 165g",C["positive"])]
    for i,(m,col) in enumerate(macros):
        cx = 200 + i*55
        d.text((cx, y+38), m, font=f_ml, fill=col)
        progress_bar(d, [cx, y+56, cx+48, y+60], [118,43,165][i]/[118,43,165][i], col, height=4)

    # 三餐卡片
    meals = [
        ("早", "breakfast", "鸡蛋 2个 · 牛奶 300ml · 香蕉 1根", 320, C["positive"]),
        ("午", "lunch", "米饭 180g · 鸡胸肉 180g", 480, C["accent"]),
        ("晚", "dinner", "米饭 120g · 鸡胸肉 150g", 360, C["accent2"]),
    ]
    y = 212
    for i,(short, mid, items, kcal, col) in enumerate(meals):
        glass_tile(img, [16, y, W-16, y+118], radius=22, glow=col, glow_strength=5)
        d = ImageDraw.Draw(img)
        label_uc(d, (32, y+14), f"{mid.upper()} / {'早中晚'[i]}餐", ls=1.2)
        d.text((32, y+38), short, font=F("OutfitBold", 28), fill=col)
        d.text((32, y+76), items, font=F("YaHei", 12), fill=C["ink"])
        d.text((W-32, y+44), str(kcal), font=F("GeistMonoBold", 24), fill=C["ink"], anchor="ra")
        d.text((W-32, y+72), "kcal", font=F("GeistMono", 10), fill=C["inkMute"], anchor="ra")
        # 编辑按钮
        d.ellipse([W-56, y+90, W-40, y+106], fill=(255,255,255,12), outline=C["glassBorder"])
        d.text((W-48, y+98), "✎", font=F("Outfit", 12), fill=C["inkMute"], anchor="mm")
        y += 118 + 8

    # 调整说明
    y += 4
    glass_tile(img, [16, y, W-16, y+64], radius=18, glow=C["amber"], glow_strength=4)
    d = ImageDraw.Draw(img)
    d.ellipse([32, y+22, 44, y+34], fill=C["amber"])
    d.text((52, y+14), "蛋白质优先保留", font=F("YaHeiBold", 12), fill=C["ink"])
    d.text((52, y+34), "碳水将根据今日训练量动态浮动", font=F("YaHei", 11), fill=C["inkMute"])

    tab_bar(img, active=1)
    save(img, "page_06_nutrition_plan.png")

if __name__ == "__main__":
    render()
