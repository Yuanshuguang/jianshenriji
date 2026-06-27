# -*- coding: utf-8 -*-
"""训练 · 推荐计划"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from bg_common import *

def render():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    status_bar(d)
    label_uc(d, (20, 48), "6月23日 · 训练", ls=1.5)
    d.text((20, 62), "今日推荐", font=F("OutfitBold", 26), fill=C["ink"])

    # 顶部训练总览
    y = 104
    glass_tile(img, [16, y, W-16, y+92], radius=22, glow=C["accent2"], glow_strength=6)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "TODAY / 今日训练", ls=1.2)
    d.text((32, y+36), "背部 + 轻有氧", font=F("YaHeiBold", 22), fill=C["accent2"])
    d.text((32, y+72), "恢复良好 · 部位间隔 72h", font=F("YaHei", 11), fill=C["inkMute"])
    d.text((W-32, y+40), "330–430", font=F("GeistMonoBold", 18), fill=C["accent"], anchor="ra")
    d.text((W-32, y+62), "kcal 预计消耗", font=F("GeistMono", 10), fill=C["inkMute"], anchor="ra")

    # 力量训练动作列表
    y = 212
    label_uc(d, (20, y), "STRENGTH / 力量训练", ls=1.2)
    y += 22
    exercises = [
        ("高位下拉", "背", "4 组 × 10 次", "40kg", C["accent2"]),
        ("坐姿划船", "背", "4 组 × 10 次", "35kg", C["accent2"]),
        ("哑铃划船", "背", "3 组 × 12 次", "12kg", C["accent2"]),
        ("面拉", "肩", "3 组 × 15 次", "轻", C["accent"]),
    ]
    for i,(name, part, sets, wt, col) in enumerate(exercises):
        glass_tile(img, [16, y, W-16, y+62], radius=14, raised=(i==0), glow=col if i==0 else None, glow_strength=4)
        d = ImageDraw.Draw(img)
        # 序号
        d.ellipse([32, y+18, 50, y+36], fill=(col[0],col[1],col[2],40), outline=col)
        d.text((41, y+27), str(i+1), font=F("GeistMonoBold", 12), fill=col, anchor="mm")
        # 名称
        d.text((60, y+14), name, font=F("YaHeiBold", 14), fill=C["ink"])
        d.text((60, y+34), sets, font=F("GeistMono", 11), fill=C["inkMute"])
        # 部位标签
        rrect(d, [W-130, y+16, W-100, y+38], RADIUS["sm"], fill=(col[0],col[1],col[2],40))
        d.text((W-115, y+22), part, font=F("YaHeiBold", 10), fill=col, anchor="mm")
        # 重量
        d.text((W-32, y+18), wt, font=F("GeistMonoBold", 14), fill=C["ink"], anchor="ra")
        d.text((W-32, y+38), "建议", font=F("GeistMono", 9), fill=C["inkMute"], anchor="ra")
        y += 62 + 8

    # 有氧
    y += 4
    glass_tile(img, [16, y, W-16, y+62], radius=14, glow=C["positive"], glow_strength=4)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "CARDIO / 有氧", ls=1.2)
    d.text((32, y+34), "跑步机快走 · 20 分钟", font=F("YaHeiBold", 14), fill=C["positive"])
    d.text((W-32, y+24), "~120", font=F("GeistMonoBold", 16), fill=C["positive"], anchor="ra")
    d.text((W-32, y+44), "kcal", font=F("GeistMono", 10), fill=C["inkMute"], anchor="ra")

    # 配套饮食提示
    y += 62 + 12
    glass_tile(img, [16, y, W-16, y+72], radius=18, glow=C["amber"], glow_strength=4)
    d = ImageDraw.Draw(img)
    d.ellipse([32, y+26, 44, y+38], fill=C["amber"])
    d.text((52, y+16), "训练日碳水保留", font=F("YaHeiBold", 12), fill=C["ink"])
    d.text((52, y+36), "今日无氧训练量足够，碳水目标不下调", font=F("YaHei", 11), fill=C["inkMute"])

    tab_bar(img, active=2)
    save(img, "page_08_training_plan.png")

if __name__ == "__main__":
    render()
