# -*- coding: utf-8 -*-
"""历史趋势"""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from bg_common import *

def render():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    status_bar(d)
    label_uc(d, (20, 48), "HISTORY · 历史", ls=1.5)
    d.text((20, 62), "趋势", font=F("OutfitBold", 26), fill=C["ink"])

    # 顶部：体重趋势大格 + 当前值
    y = 104
    big_w = int((W - 32 - 8) * 0.55)
    glass_tile(img, [16, y, 16+big_w, y+150], radius=22, glow=C["accent"], glow_strength=6)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "WEIGHT / 体重", ls=1.2)
    d.text((32, y+38), "72.5", font=F("GeistMonoBold", 36), fill=C["accent"])
    d.text((32, y+82), "kg · 目标 68.0", font=F("YaHei", 11), fill=C["inkMute"])
    # 迷你趋势线
    pts = [73.2, 73.0, 72.9, 72.8, 72.7, 72.6, 72.5]
    px0, py0, px1, py1 = 32, y+108, 16+big_w-16, y+140
    for i in range(len(pts)-1):
        xa = px0 + (px1-px0)*i/(len(pts)-1)
        xb = px0 + (px1-px0)*(i+1)/(len(pts)-1)
        ya = py1 - (pts[i]-72.4)/(73.3-72.4)*(py1-py0)
        yb = py1 - (pts[i+1]-72.4)/(73.3-72.4)*(py1-py0)
        d.line([xa,ya,xb,yb], fill=C["accent"], width=2)
    # 右上：周/月切换
    glass_tile(img, [24+big_w, y, W-16, y+150], radius=22, glow=C["positive"], glow_strength=5)
    d = ImageDraw.Draw(img)
    label_uc(d, (40+big_w, y+14), "DELTA / 周变化", ls=1.2)
    d.text((40+big_w, y+38), "-0.5", font=F("GeistMonoBold", 32), fill=C["positive"])
    d.text((40+big_w, y+82), "kg / 周", font=F("YaHei", 11), fill=C["inkMute"])
    d.text((40+big_w, y+108), "符合目标 0.55", font=F("YaHei", 11), fill=C["positive"])

    # 7 天热量柱状图
    y = 270
    glass_tile(img, [16, y, W-16, y+168], radius=22, glow=C["accent"], glow_strength=5)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "CALORIES · 7 天热量", ls=1.2)
    d.text((W-32, y+18), "目标 1650", font=F("GeistMono", 10), fill=C["inkMute"], anchor="ra")
    # 柱状
    data = [1620, 1700, 1580, 1820, 1600, 1500, 980]
    days = ["17","18","19","20","21","22","今"]
    bx0, by0, bx1, by1 = 32, y+44, W-32, y+140
    goal_y = by1 - (1650-1400)/(1900-1400)*(by1-by0)
    d.line([bx0, goal_y, bx1, goal_y], fill=(251,191,36,120), width=1)
    bw = (bx1-bx0) / len(data) - 6
    for i,v in enumerate(data):
        cx = bx0 + i*((bx1-bx0)/len(data)) + 3
        bh = max(2, (max(1400,v)-1400)/(1900-1400)*(by1-by0))
        col = C["warn"] if v > 1700 else (C["positive"] if v < 1650 else C["accent"])
        d.rounded_rectangle([cx, by1-bh, cx+bw, by1-2], 4, fill=col)
        d.text((cx+bw//2, by1+6), days[i], font=F("GeistMono", 9), fill=C["inkMute"], anchor="ma")
        if i == len(data)-1:
            d.text((cx+bw//2, by1-bh-12), str(v), font=F("GeistMonoBold", 10), fill=col, anchor="ma")

    # 宏量达成率
    y = 454
    label_uc(d, (20, y), "MACROS ACHIEVEMENT / 营养达成", ls=1.2)
    y += 22
    tw = (W - 32 - 16) // 3
    macros = [("蛋白质", 0.92, C["accent"]), ("脂肪", 0.85, C["accent2"]), ("碳水", 0.78, C["positive"])]
    for i,(n,pct,col) in enumerate(macros):
        tx = 16 + i*(tw+8)
        glass_tile(img, [tx, y, tx+tw, y+100], radius=18, glow=col, glow_strength=4)
        d = ImageDraw.Draw(img)
        d.text((tx+tw//2, y+18), n, font=F("YaHei", 11), fill=C["inkMute"], anchor="ma")
        # 环
        rcx, rcy, rr = tx+tw//2, y+58, 24
        progress_ring(d, rcx, rcy, rr, pct, stroke=6, color=col)
        d.text((rcx, rcy), f"{int(pct*100)}%", font=F("GeistMonoBold", 11), fill=col, anchor="mm")

    # 训练完成度
    y = 588
    glass_tile(img, [16, y, W-16, y+92], radius=22, glow=C["accent2"], glow_strength=5)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "TRAINING / 本周训练", ls=1.2)
    d.text((32, y+38), "4 / 5", font=F("GeistMonoBold", 28), fill=C["accent2"])
    d.text((32, y+74), "天完成 · 1 天顺延", font=F("YaHei", 11), fill=C["inkMute"])
    # 周历
    days = [("一",1),("二",1),("三",0),("四",1),("五",1),("六",1),("日",0)]
    for i,(dn,st) in enumerate(days):
        cx = 200 + i*22
        col = C["accent2"] if st==1 else (255,255,255,20)
        d.ellipse([cx-7, y+44, cx+7, y+58], fill=col)
        d.text((cx, y+66), dn, font=F("YaHei", 8), fill=C["inkMute"], anchor="mm")

    # 连续天数
    y = 692
    glass_tile(img, [16, y, W-16, y+62], radius=18, glow=C["amber"], glow_strength=4)
    d = ImageDraw.Draw(img)
    d.text((32, y+16), "🔥", font=F("YaHei", 20), fill=C["amber"])
    d.text((62, y+14), "连续 12 天", font=F("YaHeiBold", 14), fill=C["amber"])
    d.text((62, y+36), "保持记录", font=F("YaHei", 11), fill=C["inkMute"])
    d.text((W-32, y+24), "查看全部 ›", font=F("YaHei", 12), fill=C["accent"], anchor="ra")

    tab_bar(img, active=3)
    save(img, "page_11_history.png")

if __name__ == "__main__":
    render()
