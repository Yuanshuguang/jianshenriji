# -*- coding: utf-8 -*-
"""首页 · 今日推荐（精修版）"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from bg_common import *

def render():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    status_bar(d)

    # 日期 + 标题 + 离线徽章
    label_uc(d, (20, 48), "6月23日 周二", ls=1.5)
    d.text((20, 62), "今日", font=F("OutfitBold", 26), fill=C["ink"])
    glass_tile(img, [W-92, 56, W-18, 84], radius=14, glow=C["positive"], glow_strength=4)
    d = ImageDraw.Draw(img)
    d.text((W-55, 70), "离线", font=F("YaHei", 11), fill=C["positive"], anchor="mm")

    # ===== Bento 网格 =====
    pad = 16
    gap = 8
    r1y = 104
    big_w = int((W - pad*2 - gap) * 0.62)

    # 大格：热量环
    glass_tile(img, [pad, r1y, pad+big_w, r1y+176], radius=22, glow=C["accent"], glow_strength=8)
    d = ImageDraw.Draw(img)
    label_uc(d, (pad+16, r1y+14), "CALORIES / 热量", ls=1.5)
    rcx, rcy, rr = pad+60, r1y+104, 42
    progress_ring(d, rcx, rcy, rr, 980/1650, stroke=10)
    d.text((rcx, rcy-4), "670", font=F("GeistMonoBold", 22), fill=C["ink"], anchor="mm")
    d.text((rcx, rcy+14), "还可吃", font=F("YaHei", 9), fill=C["inkMute"], anchor="mm")
    # 右侧数据
    rx = pad+big_w-110
    f_dl = F("GeistMono", 9)
    f_dv = F("GeistMonoBold", 18)
    for i,(l,v,col) in enumerate([("目标","1650",C["ink"]),("实际","980",C["accent"]),("消耗","2150",C["ink"])]):
        ry = r1y+44+i*30
        d.text((rx, ry), l, font=f_dl, fill=C["inkMute"])
        d.text((rx, ry+14), v, font=f_dv, fill=col)

    # 右上：消耗
    glass_tile(img, [pad+big_w+gap, r1y, W-pad, r1y+84], radius=18, glow=C["positive"], glow_strength=5)
    d = ImageDraw.Draw(img)
    label_uc(d, (pad+big_w+gap+14, r1y+14), "BURN / 消耗", ls=1.2)
    d.text((pad+big_w+gap+14, r1y+38), "2150", font=F("GeistMonoBold", 28), fill=C["positive"])
    d.text((pad+big_w+gap+14, r1y+70), "kcal", font=f_dl, fill=C["inkMute"])

    # 右下：赤字
    glass_tile(img, [pad+big_w+gap, r1y+84+gap, W-pad, r1y+176], radius=18, glow=C["accent2"], glow_strength=5)
    d = ImageDraw.Draw(img)
    label_uc(d, (pad+big_w+gap+14, r1y+98), "DEFICIT / 赤字", ls=1.2)
    d.text((pad+big_w+gap+14, r1y+122), "+1170", font=F("GeistMonoBold", 28), fill=C["accent2"])

    # 三连：宏量
    r2y = r1y + 176 + gap
    cw = (W - pad*2 - gap*2)//3
    macros = [("蛋白质", 78, 118, C["accent"], "P"),
              ("脂肪", 28, 43, C["accent2"], "F"),
              ("碳水", 102, 165, C["positive"], "C")]
    for i,(n,c,t,col,tag) in enumerate(macros):
        cx0 = pad + i*(cw+gap)
        glass_tile(img, [cx0, r2y, cx0+cw, r2y+86], radius=18, glow=col, glow_strength=4)
        d = ImageDraw.Draw(img)
        text(d, (cx0+12, r2y+12), tag, F("GeistMonoBold", 11), col, ls=1)
        d.text((cx0+12, r2y+30), str(c), font=F("GeistMonoBold", 22), fill=C["ink"])
        d.text((cx0+12, r2y+58), f"/ {t}g", font=f_dl, fill=C["inkMute"])
        progress_bar(d, [cx0+12, r2y+74, cx0+cw-12, r2y+78], c/max(1,t), col, height=4)

    # 训练横条
    r3y = r2y + 86 + gap
    glass_tile(img, [pad, r3y, W-pad, r3y+118], radius=22, glow=C["accent2"], glow_strength=6)
    d = ImageDraw.Draw(img)
    label_uc(d, (pad+16, r3y+14), "TRAINING / 今日训练", ls=1.5)
    d.text((pad+16, r3y+34), "背部 + 轻有氧", font=F("YaHeiBold", 17), fill=C["accent2"])
    items = "高位下拉 4×10   坐姿划船 4×10   哑铃划船 3×12"
    d.text((pad+16, r3y+62), items, font=F("YaHei", 11), fill=C["ink"])
    d.text((pad+16, r3y+86), "跑步机快走 20min", font=F("YaHei", 11), fill=C["inkMute"])
    d.text((W-pad-16, r3y+34), "330–430", font=F("GeistMonoBold", 14), fill=C["accent"], anchor="ra")
    d.text((W-pad-16, r3y+54), "kcal", font=f_dl, fill=C["inkMute"], anchor="ra")

    # 餐次横条
    r4y = r3y + 118 + gap
    glass_tile(img, [pad, r4y, W-pad, r4y+96], radius=22)
    d = ImageDraw.Draw(img)
    label_uc(d, (pad+16, r4y+14), "MEALS / 今日餐次", ls=1.5)
    meals = [("早",320),("午",480),("晚",360)]
    mw = (W - pad*2 - gap*2)//3
    for i,(s,k) in enumerate(meals):
        mx = pad + i*(mw+gap) + mw//2
        d.text((mx, r4y+44), s, font=F("YaHeiBold", 12), fill=C["inkMute"], anchor="ma")
        d.text((mx, r4y+62), str(k), font=F("GeistMonoBold", 16), fill=C["ink"], anchor="ma")
        d.text((mx, r4y+82), "kcal", font=f_dl, fill=C["inkMute"], anchor="ma")

    # 调整提示横条
    r5y = r4y + 96 + gap
    glass_tile(img, [pad, r5y, W-pad, r5y+54], radius=18, glow=C["amber"], glow_strength=4)
    d = ImageDraw.Draw(img)
    d.ellipse([pad+16, r5y+18, pad+28, r5y+30], fill=C["amber"])
    d.text((pad+38, r5y+18), "明日计划已根据今日多摄入调整", font=F("YaHei", 12), fill=C["ink"])

    tab_bar(img, active=0)
    save(img, "page_05_today.png")

if __name__ == "__main__":
    render()
