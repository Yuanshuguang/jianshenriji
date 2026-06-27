# -*- coding: utf-8 -*-
"""训练 · 实际补充"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from bg_common import *

def render():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    status_bar(d)
    label_uc(d, (20, 48), "6月23日 · 实际训练", ls=1.5)
    d.text((20, 62), "补充今日", font=F("OutfitBold", 26), fill=C["ink"])

    # 完成度环
    y = 104
    gw = int((W - 32 - 8) * 0.5)
    # 左：完成度
    glass_tile(img, [16, y, 16+gw, y+130], radius=22, glow=C["positive"], glow_strength=6)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "COMPLETION / 完成度", ls=1.2)
    rcx, rcy, rr = 16+gw//2, y+82, 38
    progress_ring(d, rcx, rcy, rr, 0.75, stroke=10, color=C["positive"])
    d.text((rcx, rcy-4), "75%", font=F("GeistMonoBold", 20), fill=C["positive"], anchor="mm")
    d.text((rcx, rcy+14), "完成", font=F("YaHei", 9), fill=C["inkMute"], anchor="mm")
    # 右：消耗
    glass_tile(img, [24+gw, y, W-16, y+130], radius=22, glow=C["accent"], glow_strength=6)
    d = ImageDraw.Draw(img)
    label_uc(d, (40+gw, y+14), "BURN / 实际消耗", ls=1.2)
    d.text((40+gw, y+42), "380", font=F("GeistMonoBold", 40), fill=C["accent"])
    d.text((40+gw, y+88), "kcal · 预计 330–430", font=F("YaHei", 11), fill=C["inkMute"])

    # 实际训练记录
    y = 246
    label_uc(d, (20, y), "LOGGED / 实际训练", ls=1.2)
    y += 22
    logs = [
        ("高位下拉", "4 × 10", "40kg", C["positive"], "完成"),
        ("坐姿划船", "4 × 10", "35kg", C["positive"], "完成"),
        ("哑铃划船", "3 × 8", "12kg", C["amber"], "少做"),
        ("面拉", "—", "—", C["warn"], "跳过"),
        ("跑步机快走", "30 min", "—", C["positive"], "完成"),
    ]
    for i,(name, sets, wt, col, tag) in enumerate(logs):
        glass_tile(img, [16, y, W-16, y+54], radius=12, raised=(tag=="跳过"), glow=col if tag=="跳过" else None, glow_strength=3)
        d = ImageDraw.Draw(img)
        d.text((32, y+12), name, font=F("YaHeiBold", 13), fill=C["ink"])
        d.text((32, y+30), sets, font=F("GeistMono", 11), fill=C["inkMute"])
        d.text((W-130, y+14), wt, font=F("GeistMonoBold", 12), fill=C["ink"], anchor="ma")
        rrect(d, [W-100, y+14, W-40, y+36], RADIUS["sm"], fill=(col[0],col[1],col[2],40))
        d.text((W-70, y+20), tag, font=F("YaHeiBold", 10), fill=col, anchor="mm")
        y += 54 + 6

    # 疲劳度
    y += 8
    glass_tile(img, [16, y, W-16, y+72], radius=18, glow=C["accent2"], glow_strength=4)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "FATIGUE / 主观疲劳", ls=1.2)
    d.text((32, y+36), "中等", font=F("YaHeiBold", 16), fill=C["accent2"])
    # 1-10 滑块
    d.rounded_rectangle([120, y+44, W-32, y+50], RADIUS["pill"], fill=(255,255,255,20))
    d.rounded_rectangle([120, y+44, 120+int((W-152)*0.6), y+50], RADIUS["pill"], fill=C["accent2"])
    d.ellipse([120+int((W-152)*0.6)-8, y+38, 120+int((W-152)*0.6)+8, y+56], fill=C["ink"], outline=C["accent2"], width=2)

    # 后续调整提示
    y += 72 + 12
    glass_tile(img, [16, y, W-16, y+72], radius=18, glow=C["amber"], glow_strength=4)
    d = ImageDraw.Draw(img)
    d.ellipse([32, y+26, 44, y+38], fill=C["amber"])
    d.text((52, y+16), "面拉顺延至明日", font=F("YaHeiBold", 12), fill=C["ink"])
    d.text((52, y+36), "背训强度下调 10%，明日优先补肩", font=F("YaHei", 11), fill=C["inkMute"])

    # 提交按钮
    y = H - 96
    glass_tile(img, [16, y, W-16, y+52], radius=18, raised=True, glow=C["accent2"], glow_strength=10)
    d = ImageDraw.Draw(img)
    d.text((W//2, y+26), "保存并重排训练队列", font=F("YaHeiBold", 15), fill=C["accent2"], anchor="mm")

    save(img, "page_09_training_actual.png")

if __name__ == "__main__":
    render()
