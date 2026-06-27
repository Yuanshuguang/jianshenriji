# -*- coding: utf-8 -*-
"""动态调整说明"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from bg_common import *

def render():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    status_bar(d)
    label_uc(d, (20, 48), "6月23日 · 动态调整", ls=1.5)
    d.text((20, 62), "为什么这样调", font=F("OutfitBold", 26), fill=C["ink"])
    d.text((20, 100), "系统根据今日实际偏差重排了未来 3 天", font=F("YaHei", 12), fill=C["inkMute"])

    # 顶部：今日偏差总结
    y = 128
    glass_tile(img, [16, y, W-16, y+92], radius=22, glow=C["warn"], glow_strength=5)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "TODAY DELTA / 今日偏差", ls=1.2)
    d.text((32, y+38), "+180", font=F("GeistMonoBold", 32), fill=C["warn"])
    d.text((32, y+76), "kcal · 多摄入", font=F("YaHei", 11), fill=C["inkMute"])
    # 右侧来源
    d.text((W-32, y+38), "蛋挞 +280", font=F("GeistMono", 12), fill=C["warn"], anchor="ra")
    d.text((W-32, y+58), "鸡胸-50g -60", font=F("GeistMono", 12), fill=C["positive"], anchor="ra")
    d.text((W-32, y+78), "米饭+50g +70", font=F("GeistMono", 12), fill=C["amber"], anchor="ra")

    # 调整原则（3 条）
    y = 236
    label_uc(d, (20, y), "PRINCIPLES / 调整原则", ls=1.2)
    y += 22
    principles = [
        ("01", "蛋白质目标优先保留", "118g 不变，避免肌肉流失", C["accent"]),
        ("02", "脂肪不低于安全下限", "43g 维持，不从脂肪扣除", C["accent2"]),
        ("03", "超额热量分摊多天", "+180 kcal 分摊至未来 3 天", C["amber"]),
    ]
    for i,(num, title, desc, col) in enumerate(principles):
        glass_tile(img, [16, y, W-16, y+72], radius=14, glow=col, glow_strength=3)
        d = ImageDraw.Draw(img)
        d.text((32, y+16), num, font=F("GeistMonoBold", 16), fill=col)
        d.text((68, y+16), title, font=F("YaHeiBold", 14), fill=C["ink"])
        d.text((68, y+38), desc, font=F("YaHei", 11), fill=C["inkMute"])
        y += 72 + 8

    # 未来 3 天重排预览
    y += 4
    label_uc(d, (20, y), "RESCHEDULE / 未来 3 天", ls=1.2)
    y += 22
    days = [("明天", 1590, -60, C["accent"]), ("后天", 1590, -60, C["accent"]), ("大后天", 1590, -60, C["accent"])]
    tw = (W - 32 - 16) // 3
    for i,(name, cal, delta, col) in enumerate(days):
        tx = 16 + i*(tw+8)
        glass_tile(img, [tx, y, tx+tw, y+108], radius=18, glow=col, glow_strength=4)
        d = ImageDraw.Draw(img)
        d.text((tx+tw//2, y+18), name, font=F("YaHeiBold", 13), fill=C["inkMute"], anchor="ma")
        d.text((tx+tw//2, y+48), str(cal), font=F("GeistMonoBold", 22), fill=col, anchor="ma")
        d.text((tx+tw//2, y+76), "kcal", font=F("GeistMono", 10), fill=C["inkMute"], anchor="ma")
        d.text((tx+tw//2, y+94), f"{delta}", font=F("GeistMonoBold", 12), fill=C["positive"], anchor="ma")

    # 训练队列调整
    y += 108 + 12
    glass_tile(img, [16, y, W-16, y+82], radius=18, glow=C["accent2"], glow_strength=4)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "TRAINING / 训练队列", ls=1.2)
    d.text((32, y+36), "面拉顺延至明日", font=F("YaHeiBold", 14), fill=C["accent2"])
    d.text((32, y+58), "背训强度下调 10% · 明日优先补肩", font=F("YaHei", 11), fill=C["inkMute"])

    # 安全提示
    y += 82 + 12
    glass_tile(img, [16, y, W-16, y+58], radius=14)
    d = ImageDraw.Draw(img)
    d.ellipse([32, y+22, 44, y+34], fill=C["positive"])
    d.text((52, y+14), "仍在安全范围", font=F("YaHeiBold", 12), fill=C["positive"])
    d.text((52, y+34), "无极端节食，无过量训练", font=F("YaHei", 11), fill=C["inkMute"])

    tab_bar(img, active=3)
    save(img, "page_10_adjustment.png")

if __name__ == "__main__":
    render()
