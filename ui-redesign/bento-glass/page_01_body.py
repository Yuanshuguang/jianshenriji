# -*- coding: utf-8 -*-
"""Onboarding · 身体数据录入"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from bg_common import *

def render():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    status_bar(d)

    # 步骤指示器
    steps = [1,2,3,4]
    cur = 0
    sy = 52
    for i,s in enumerate(steps):
        cx = 20 + i*16
        col = C["accent"] if i==cur else (255,255,255,30)
        d.ellipse([cx,sy,cx+8,sy+8], fill=col)
    d.text((W-20, sy+4), "1 / 4", font=F("GeistMono",11), fill=C["inkMute"], anchor="ra")

    # 标题
    d.text((20, 78), "身体数据", font=F("OutfitBold", 28), fill=C["ink"])
    d.text((20, 116), "先告诉系统你的起点", font=F("YaHei", 13), fill=C["inkMute"])

    # ===== 性别选择格 =====
    y = 162
    label_uc(d, (20, y), "GENDER / 性别", ls=1.5)
    y += 22
    gw = (W - 32 - 8) // 2
    # 男（选中）
    glass_tile(img, [16, y, 16+gw, y+72], radius=18, raised=True, glow=C["accent"], glow_strength=6)
    d = ImageDraw.Draw(img)
    d.text((32, y+18), "男", font=F("YaHeiBold", 18), fill=C["accent"])
    d.text((32, y+46), "Male", font=F("GeistMono", 10), fill=C["inkMute"])
    d.ellipse([16+gw-36, y+18, 16+gw-12, y+42], outline=C["accent"], width=2)
    d.ellipse([16+gw-30, y+24, 16+gw-18, y+36], fill=C["accent"])
    # 女
    glass_tile(img, [24+gw, y, W-16, y+72], radius=18)
    d = ImageDraw.Draw(img)
    d.text((40+gw, y+18), "女", font=F("YaHeiBold", 18), fill=C["inkMute"])
    d.text((40+gw, y+46), "Female", font=F("GeistMono", 10), fill=C["inkFaint"])
    d.ellipse([W-36, y+18, W-12, y+42], outline=(255,255,255,40), width=2)

    # ===== 年龄 + 身高 双格 =====
    y = 258
    gw = (W - 32 - 8) // 2
    # 年龄
    glass_tile(img, [16, y, 16+gw, y+108], radius=18, glow=C["accent2"], glow_strength=5)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "AGE / 年龄", ls=1.2)
    d.text((32, y+38), "28", font=F("GeistMonoBold", 40), fill=C["ink"])
    d.text((32, y+86), "岁", font=F("YaHei", 11), fill=C["inkMute"])
    # 身高
    glass_tile(img, [24+gw, y, W-16, y+108], radius=18, glow=C["accent"], glow_strength=5)
    d = ImageDraw.Draw(img)
    label_uc(d, (40+gw, y+14), "HEIGHT / 身高", ls=1.2)
    d.text((40+gw, y+38), "175", font=F("GeistMonoBold", 40), fill=C["accent"])
    d.text((40+gw, y+86), "cm", font=F("GeistMono", 11), fill=C["inkMute"])

    # ===== 当前体重（大格 + 步进）=====
    y = 382
    glass_tile(img, [16, y, W-16, y+124], radius=22, glow=C["accent"], glow_strength=7)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+16), "CURRENT WEIGHT / 当前体重", ls=1.2)
    d.text((32, y+44), "72.5", font=F("GeistMonoBold", 52), fill=C["accent"])
    d.text((32, y+102), "kg", font=F("GeistMono", 13), fill=C["inkMute"])
    # 步进按钮
    for i,(lbl,xx) in enumerate([("-",W-140),("+",W-64)]):
        d.ellipse([xx-16, y+44, xx+16, y+76], fill=(255,255,255,12), outline=C["glassBorder"], width=1)
        d.text((xx, y+60), lbl, font=F("OutfitBold", 22), fill=C["ink"], anchor="mm")

    # ===== 训练水平（三连格）=====
    y = 522
    label_uc(d, (20, y), "TRAINING LEVEL / 训练水平", ls=1.2)
    y += 22
    tw = (W - 32 - 16) // 3
    levels = [("新手", C["inkMute"], False), ("有基础", C["accent"], True), ("规律训练", C["inkMute"], False)]
    for i,(n,col,act) in enumerate(levels):
        tx = 16 + i*(tw+8)
        glass_tile(img, [tx, y, tx+tw, y+84], radius=18, raised=act, glow=C["accent"] if act else None, glow_strength=5)
        d = ImageDraw.Draw(img)
        d.text((tx+tw//2, y+30), n, font=F("YaHeiBold", 14), fill=col, anchor="mm")
        if act:
            d.ellipse([tx+tw//2-3, y+64, tx+tw//2+3, y+70], fill=C["accent"])

    # ===== 可选：腰围输入 =====
    y = 642
    glass_tile(img, [16, y, W-16, y+72], radius=18)
    d = ImageDraw.Draw(img)
    d.text((32, y+16), "腰围", font=F("YaHei", 13), fill=C["ink"])
    d.text((32, y+40), "可选 · 用于更精确估算", font=F("YaHei", 11), fill=C["inkFaint"])
    d.text((W-32, y+28), "82", font=F("GeistMonoBold", 24), fill=C["ink"], anchor="ra")
    d.text((W-32, y+54), "cm", font=F("GeistMono", 10), fill=C["inkMute"], anchor="ra")

    # ===== 底部主按钮 =====
    y = H - 96
    glass_tile(img, [16, y, W-16, y+52], radius=18, raised=True, glow=C["accent"], glow_strength=10)
    d = ImageDraw.Draw(img)
    d.text((W//2, y+26), "下一步 · 目标设置", font=F("YaHeiBold", 15), fill=C["accent"], anchor="mm")

    save(img, "onboarding_01_body.png")

if __name__ == "__main__":
    render()
