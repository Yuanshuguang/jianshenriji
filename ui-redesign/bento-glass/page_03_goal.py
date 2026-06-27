# -*- coding: utf-8 -*-
"""Onboarding · 目标设置"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from bg_common import *

def render():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    status_bar(d)

    cur = 2
    sy = 52
    for i in range(4):
        cx = 20 + i*16
        col = C["accent"] if i==cur else (255,255,255,30)
        d.ellipse([cx,sy,cx+8,sy+8], fill=col)
    d.text((W-20, sy+4), "3 / 4", font=F("GeistMono",11), fill=C["inkMute"], anchor="ra")

    d.text((20, 78), "目标设置", font=F("OutfitBold", 28), fill=C["ink"])
    d.text((20, 116), "你想在多久内变成什么样", font=F("YaHei", 13), fill=C["inkMute"])

    # ===== 目标类型 4 连格 =====
    y = 158
    label_uc(d, (20, y), "GOAL TYPE / 目标类型", ls=1.2)
    y += 22
    tw = (W - 32 - 24) // 4
    goals = [("减脂", C["accent"], True), ("增肌", C["inkMute"], False), ("维持", C["inkMute"], False), ("塑形", C["inkMute"], False)]
    for i,(n,col,act) in enumerate(goals):
        tx = 16 + i*(tw+8)
        glass_tile(img, [tx, y, tx+tw, y+72], radius=14, raised=act, glow=C["accent"] if act else None, glow_strength=4)
        d = ImageDraw.Draw(img)
        d.text((tx+tw//2, y+36), n, font=F("YaHeiBold", 13), fill=col, anchor="mm")

    # ===== 目标体重 =====
    y = 268
    glass_tile(img, [16, y, W-16, y+118], radius=22, glow=C["accent"], glow_strength=7)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+16), "TARGET WEIGHT / 目标体重", ls=1.2)
    d.text((32, y+44), "68.0", font=F("GeistMonoBold", 48), fill=C["accent"])
    d.text((32, y+96), "kg · 当前 72.5 kg", font=F("YaHei", 11), fill=C["inkMute"])
    # 步进
    for i,(lbl,xx) in enumerate([("-",W-140),("+",W-64)]):
        d.ellipse([xx-16, y+44, xx+16, y+76], fill=(255,255,255,12), outline=C["glassBorder"])
        d.text((xx, y+60), lbl, font=F("OutfitBold", 22), fill=C["ink"], anchor="mm")

    # ===== 目标周期 =====
    y = 402
    label_uc(d, (20, y), "DURATION / 目标周期", ls=1.2)
    y += 22
    tw = (W - 32 - 16) // 3
    periods = [("4 周", C["inkMute"], False), ("8 周", C["accent"], True), ("12 周", C["inkMute"], False)]
    for i,(n,col,act) in enumerate(periods):
        tx = 16 + i*(tw+8)
        glass_tile(img, [tx, y, tx+tw, y+64], radius=14, raised=act, glow=C["accent"] if act else None, glow_strength=4)
        d = ImageDraw.Draw(img)
        d.text((tx+tw//2, y+32), n, font=F("OutfitBold", 15), fill=col, anchor="mm")

    # ===== 系统计算结果 =====
    y = 502
    glass_tile(img, [16, y, W-16, y+158], radius=22, glow=C["accent2"], glow_strength=6)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+16), "SYSTEM CALC / 系统计算", ls=1.2)
    # 三栏
    f_cv = F("GeistMonoBold", 24)
    f_cl = F("YaHei", 11)
    cols = [("每周减重", "0.55", "kg", C["positive"]),
            ("每日目标", "1650", "kcal", C["accent"]),
            ("周期判定", "合理", "", C["positive"])]
    for i,(l,v,u,col) in enumerate(cols):
        cx = 32 + i*((W-64)//3)
        d.text((cx, y+44), l, font=f_cl, fill=C["inkMute"])
        d.text((cx, y+62), v, font=f_cv, fill=col)
        if u:
            d.text((cx, y+92), u, font=F("GeistMono", 10), fill=C["inkMute"])
    # 营养目标
    d.line([32, y+116, W-32, y+116], fill=(255,255,255,20), width=1)
    macros = [("蛋白 118g",C["accent"]),("脂肪 43g",C["accent2"]),("碳水 165g",C["positive"])]
    for i,(m,col) in enumerate(macros):
        cx = 32 + i*((W-64)//3)
        d.text((cx, y+132), m, font=F("GeistMono", 11), fill=col)

    # ===== 目标体态 =====
    y = 678
    glass_tile(img, [16, y, W-16, y+56], radius=18)
    d = ImageDraw.Draw(img)
    d.text((32, y+18), "目标体态", font=F("YaHei", 13), fill=C["ink"])
    d.text((W-32, y+24), "马甲线明显 ›", font=F("YaHeiBold", 13), fill=C["accent"], anchor="ra")

    # ===== 底部按钮 =====
    y = H - 96
    glass_tile(img, [16, y, W-16, y+52], radius=18, raised=True, glow=C["accent"], glow_strength=10)
    d = ImageDraw.Draw(img)
    d.text((W//2, y+26), "下一步 · 训练习惯", font=F("YaHeiBold", 15), fill=C["accent"], anchor="mm")

    save(img, "onboarding_03_goal.png")

if __name__ == "__main__":
    render()
