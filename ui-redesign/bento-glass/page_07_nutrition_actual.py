# -*- coding: utf-8 -*-
"""饮食 · 实际补充"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from bg_common import *

def render():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    status_bar(d)
    label_uc(d, (20, 48), "6月23日 · 实际饮食", ls=1.5)
    d.text((20, 62), "补充今日", font=F("OutfitBold", 26), fill=C["ink"])

    # 偏差汇总横条
    y = 104
    glass_tile(img, [16, y, W-16, y+84], radius=22, glow=C["warn"], glow_strength=5)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "DEVIATION / 今日偏差", ls=1.2)
    d.text((32, y+36), "+180", font=F("GeistMonoBold", 30), fill=C["warn"])
    d.text((32, y+68), "kcal · 多吃", font=F("YaHei", 11), fill=C["inkMute"])
    # 右侧：分摊说明
    d.text((W-32, y+38), "分摊未来 3 天", font=F("YaHei", 12), fill=C["accent"], anchor="ra")
    d.text((W-32, y+58), "每日 -60 kcal", font=F("GeistMono", 11), fill=C["inkMute"], anchor="ra")

    # 已补充列表
    y = 204
    label_uc(d, (20, y), "LOGGED / 已补充", ls=1.2)
    y += 22
    items = [
        ("午餐", "米饭 +50g", 70, C["amber"], "多吃"),
        ("下午", "蛋挞 1个", 280, C["warn"], "多吃"),
        ("晚餐", "鸡胸肉 -50g", -60, C["positive"], "少吃"),
    ]
    for i,(meal, food, kcal, col, tag) in enumerate(items):
        glass_tile(img, [16, y, W-16, y+58], radius=14, raised=(i==1), glow=col if i==1 else None, glow_strength=4)
        d = ImageDraw.Draw(img)
        d.text((32, y+14), meal, font=F("YaHeiBold", 12), fill=C["inkMute"])
        d.text((32, y+32), food, font=F("YaHei", 13), fill=C["ink"])
        # 标签
        rrect(d, [W-120, y+16, W-72, y+38], RADIUS["sm"], fill=(col[0],col[1],col[2],40))
        d.text((W-96, y+22), tag, font=F("YaHeiBold", 10), fill=col, anchor="mm")
        # 热量
        sign = "+" if kcal > 0 else ""
        d.text((W-32, y+18), f"{sign}{kcal}", font=F("GeistMonoBold", 16), fill=col, anchor="ra")
        d.text((W-32, y+38), "kcal", font=F("GeistMono", 9), fill=C["inkMute"], anchor="ra")
        y += 58 + 8

    # 添加输入框
    y += 8
    glass_tile(img, [16, y, W-16, y+72], radius=18, raised=True, glow=C["accent"], glow_strength=5)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "ADD / 添加补充", ls=1.2)
    d.text((32, y+38), "晚餐多吃一碗米饭", font=F("YaHei", 14), fill=C["inkFaint"])
    # 麦克风按钮
    d.ellipse([W-56, y+22, W-32, y+46], fill=(C["accent"][0],C["accent"][1],C["accent"][2],40), outline=C["accent"])
    d.text((W-44, y+34), "🎤", font=F("YaHei", 14), fill=C["accent"], anchor="mm")

    # 快捷标签
    y += 72 + 12
    label_uc(d, (20, y), "QUICK / 快捷补充", ls=1.2)
    y += 22
    quicks = [("米饭一碗",C["accent"]),("鸡蛋一个",C["positive"]),("牛奶一杯",C["accent2"]),
              ("鸡胸100g",C["accent"]),("蛋挞一个",C["warn"]),("可乐一罐",C["warn"])]
    tx, ty = 16, y
    for name, col in quicks:
        f = F("YaHeiBold", 11)
        tw = f.getbbox(name)[2] + 24
        if tx + tw > W-16:
            tx = 16
            ty += 36
        glass_tile(img, [tx, ty, tx+tw, ty+28], radius=14, glow=col, glow_strength=3)
        d = ImageDraw.Draw(img)
        d.text((tx+tw//2, ty+14), name, font=f, fill=col, anchor="mm")
        tx += tw + 8

    # 提交按钮
    y = H - 96
    glass_tile(img, [16, y, W-16, y+52], radius=18, raised=True, glow=C["accent"], glow_strength=10)
    d = ImageDraw.Draw(img)
    d.text((W//2, y+26), "保存并重排未来 3 天", font=F("YaHeiBold", 15), fill=C["accent"], anchor="mm")

    save(img, "page_07_nutrition_actual.png")

if __name__ == "__main__":
    render()
