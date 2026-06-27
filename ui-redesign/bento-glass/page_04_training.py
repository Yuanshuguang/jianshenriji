# -*- coding: utf-8 -*-
"""Onboarding · 训练习惯"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from bg_common import *

def render():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    status_bar(d)

    cur = 3
    sy = 52
    for i in range(4):
        cx = 20 + i*16
        col = C["accent"] if i==cur else (255,255,255,30)
        d.ellipse([cx,sy,cx+8,sy+8], fill=col)
    d.text((W-20, sy+4), "4 / 4", font=F("GeistMono",11), fill=C["inkMute"], anchor="ra")

    d.text((20, 78), "训练习惯", font=F("OutfitBold", 28), fill=C["ink"])
    d.text((20, 116), "系统会按你的节奏排训练队列", font=F("YaHei", 13), fill=C["inkMute"])

    # ===== 每周训练天数 =====
    y = 158
    glass_tile(img, [16, y, W-16, y+92], radius=18, glow=C["accent2"], glow_strength=5)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "DAYS / 每周训练", ls=1.2)
    d.text((32, y+42), "4", font=F("GeistMonoBold", 36), fill=C["accent2"])
    d.text((32, y+82), "天 / 周", font=F("YaHei", 11), fill=C["inkMute"])
    # 周历点
    days = [("一",True),("二",False),("三",True),("四",False),("五",True),("六",True),("日",False)]
    for i,(dn,act) in enumerate(days):
        cx = 130 + i*32
        col = C["accent2"] if act else (255,255,255,20)
        d.ellipse([cx-10, y+38, cx+10, y+58], fill=col)
        d.text((cx, y+66), dn, font=F("YaHei", 9), fill=C["inkMute"], anchor="mm")

    # ===== 每次时长 =====
    y = 266
    glass_tile(img, [16, y, W-16, y+80], radius=18, glow=C["accent"], glow_strength=5)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "DURATION / 每次时长", ls=1.2)
    d.text((32, y+36), "60", font=F("GeistMonoBold", 30), fill=C["accent"])
    d.text((32, y+68), "分钟", font=F("YaHei", 11), fill=C["inkMute"])
    # slider 轨道
    d.rounded_rectangle([130, y+44, W-32, y+50], RADIUS["pill"], fill=(255,255,255,20))
    d.rounded_rectangle([130, y+44, 130+int((W-162)*0.6), y+50], RADIUS["pill"], fill=C["accent"])
    d.ellipse([130+int((W-162)*0.6)-8, y+38, 130+int((W-162)*0.6)+8, y+56], fill=C["ink"], outline=C["accent"], width=2)

    # ===== 有氧 / 无氧偏好 =====
    y = 362
    label_uc(d, (20, y), "RATIO / 有氧无氧偏好", ls=1.2)
    y += 22
    glass_tile(img, [16, y, W-16, y+72], radius=18)
    d = ImageDraw.Draw(img)
    # 双向条
    d.rounded_rectangle([32, y+30, W-32, y+42], RADIUS["pill"], fill=(255,255,255,12))
    # 无氧 70%
    w_ana = int((W-64)*0.7)
    d.rounded_rectangle([32, y+30, 32+w_ana, y+42], RADIUS["pill"], fill=C["accent2"])
    d.text((40, y+12), "无氧 70%", font=F("YaHeiBold", 11), fill=C["accent2"])
    d.text((W-40, y+12), "有氧 30%", font=F("YaHeiBold", 11), fill=C["accent"], anchor="ra")

    # ===== 可用器材（标签云）=====
    y = 470
    label_uc(d, (20, y), "EQUIPMENT / 可用器材", ls=1.2)
    y += 22
    tags = [("徒手",True),("哑铃",True),("杠铃",True),("器械",True),("跑步机",True),("椭圆机",False),("弹力带",False)]
    tx, ty = 16, y
    for name, act in tags:
        f = F("YaHeiBold", 12)
        tw = f.getbbox(name)[2] + 28
        if tx + tw > W-16:
            tx = 16
            ty += 38
        glass_tile(img, [tx, ty, tx+tw, ty+30], radius=15, raised=act, glow=C["accent"] if act else None, glow_strength=3)
        d = ImageDraw.Draw(img)
        col = C["accent"] if act else C["inkMute"]
        d.text((tx+tw//2, ty+15), name, font=f, fill=col, anchor="mm")
        tx += tw + 8

    # ===== 偏好部位（多选）=====
    y = 590
    label_uc(d, (20, y), "MUSCLE / 偏好部位", ls=1.2)
    y += 22
    parts = [("臀腿",True),("背",True),("胸",False),("肩",True),("腹",False),("有氧",True)]
    tw = (W - 32 - 16) // 3
    for i,(n,act) in enumerate(parts):
        r,c = i//3, i%3
        tx = 16 + c*(tw+8)
        ty = y + r*(40+8)
        glass_tile(img, [tx, ty, tx+tw, ty+40], radius=14, raised=act, glow=C["accent"] if act else None, glow_strength=3)
        d = ImageDraw.Draw(img)
        col = C["accent"] if act else C["inkMute"]
        d.text((tx+tw//2, ty+20), n, font=F("YaHeiBold", 13), fill=col, anchor="mm")

    # ===== 底部按钮 =====
    y = H - 96
    glass_tile(img, [16, y, W-16, y+52], radius=18, raised=True, glow=C["positive"], glow_strength=10)
    d = ImageDraw.Draw(img)
    d.text((W//2, y+26), "完成 · 生成计划", font=F("YaHeiBold", 15), fill=C["positive"], anchor="mm")

    save(img, "onboarding_04_training.png")

if __name__ == "__main__":
    render()
