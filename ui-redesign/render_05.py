# -*- coding: utf-8 -*-
"""风格五：Organic Earth · 有机大地"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from render_common import *

def render():
    # 燕麦米底 + 极淡纸纹
    bg = vgradient((W, H), (245,239,230,255), (237,228,211,255))
    img = bg.copy()
    d = ImageDraw.Draw(img)
    ACC = (200,96,44,255)       # 赤陶橙
    SAGE = (124,144,112,255)    # 鼠尾草绿
    CLAY = (184,128,106,255)    # 陶土
    INK = (61,43,31,255)        # 深可可
    MUTE = (140,123,107,255)
    SURF = (251,247,240,255)    # 纸感卡片

    # 状态栏
    f_time = F("DengXian", 14)
    d.text((24, 16), "9:41", font=f_time, fill=INK)
    d.text((W-24, 16), "●●●", font=F("DengXian",13), fill=ACC, anchor="ra")

    # 日期（人文感）
    f_date = F("HanSerifHeavy", 13)
    d.text((24, 52), DATA["date"], font=f_date, fill=MUTE)
    # 波浪分割
    d.arc([24, 70, 60, 86], 180, 360, fill=(184,128,106,160), width=1)

    # 大标题（人文衬线）
    f_title = F("HanSerifHeavy", 32)
    d.text((24, 92), "今日", font=f_title, fill=INK)
    f_sub = F("DengXian", 13)
    d.text((24, 134), "慢慢来，长久地来", font=f_sub, fill=MUTE)

    # 圆形状态徽章
    d.ellipse([W-78, 92, W-34, 136], outline=(124,144,112,140), width=1)
    d.text((W-56, 114), "离线", font=F("DengXian",11), fill=SAGE, anchor="mm")

    # ===== 热量大卡（纸感 + 圆环）=====
    cy = 168
    rrect(d, [24, cy, W-24, cy+168], 20, fill=SURF)
    # 圆环
    rcx, rcy, rr = 96, cy+84, 46
    rs = 12
    d.ellipse([rcx-rr,rcy-rr,rcx+rr,rcy+rr], outline=(232,222,208,255), width=rs)
    pct = DATA["actual_cal"]/DATA["target_cal"]
    steps = max(1,int(360*pct/5))
    for i in range(steps):
        t0 = -90 - 360*pct*i/steps
        t1 = -90 - 360*pct*(i+1)/steps
        col = (int(200+(124-200)*i/steps), int(96+(144-96)*i/steps), int(44+(112-44)*i/steps))
        d.arc([rcx-rr,rcy-rr,rcx+rr,rcy+rr], t0, t1, fill=col, width=rs)
    f_rv = F("HanSerifHeavy", 30)
    d.text((rcx, rcy-4), str(DATA["remaining"]), font=f_rv, fill=INK, anchor="mm")
    d.text((rcx, rcy+18), "还可吃 kcal", font=F("DengXian",11), fill=MUTE, anchor="mm")

    # 右侧数据
    rx = 176
    f_rl = F("DengXian", 11)
    f_rv2 = F("HanSerifHeavy", 19)
    d.text((rx, cy+28), "目标", font=f_rl, fill=MUTE)
    d.text((rx, cy+44), str(DATA["target_cal"]), font=f_rv2, fill=INK)
    d.text((rx, cy+74), "实际", font=f_rl, fill=MUTE)
    d.text((rx, cy+90), str(DATA["actual_cal"]), font=f_rv2, fill=ACC)
    d.text((rx, cy+120), "消耗", font=f_rl, fill=MUTE)
    d.text((rx, cy+136), str(DATA["burn_cal"]), font=f_rv2, fill=INK)

    # 虚线分割
    for x in range(28, W-28, 6):
        d.point([x, cy+168+8], fill=(200,180,160,120))

    # ===== 宏量营养 =====
    y = 360
    f_sh = F("HanSerifHeavy", 16)
    d.text((24, y), "今日营养", font=f_sh, fill=INK)
    macros = [("蛋白质", DATA["protein_c"], DATA["protein_t"], SAGE),
              ("脂肪", DATA["fat_c"], DATA["fat_t"], ACC),
              ("碳水", DATA["carbs_c"], DATA["carbs_t"], CLAY)]
    f_ml = F("DengXian", 12)
    f_mv = F("DengXian", 12)
    for i,(n,c,t,col) in enumerate(macros):
        ry = y + 26 + i*30
        d.text((24, ry), n, font=f_ml, fill=INK)
        d.text((W-24, ry), f"{c} / {t}g", font=f_mv, fill=MUTE, anchor="ra")
        # 圆头细进度
        d.rounded_rectangle([92, ry+5, W-92, ry+11], 999, fill=(232,222,208,255))
        pc = c/max(1,t)
        d.rounded_rectangle([92, ry+5, 92+int((W-184)*pc), ry+11], 999, fill=col)

    # ===== 今日餐次（纸卡 + 椭圆 badge）=====
    y = 478
    d.text((24, y), "今日餐次", font=f_sh, fill=INK)
    meals = [("早餐", DATA["breakfast"], DATA["breakfast_kcal"], SAGE),
             ("午餐", DATA["lunch"], DATA["lunch_kcal"], ACC),
             ("晚餐", DATA["dinner"], DATA["dinner_kcal"], CLAY)]
    f_mn = F("HanSerifHeavy", 13)
    f_mf = F("DengXian", 11)
    f_mk = F("DengXian", 12)
    for i,(name, items, kcal, col) in enumerate(meals):
        ry = y + 26 + i*42
        rrect(d, [24, ry, W-24, ry+36], 14, fill=SURF)
        # 椭圆 badge
        d.ellipse([34, ry+8, 56, ry+28], fill=(col[0],col[1],col[2],45))
        d.text((45, ry+15), name[0], font=f_mn, fill=col, anchor="mm")
        line = " · ".join(f"{n} {g}" for n,g in items)
        d.text((66, ry+9), line, font=f_mf, fill=INK)
        d.text((W-36, ry+11), f"{kcal}", font=f_mk, fill=MUTE, anchor="ra")

    # ===== 今日训练（陶土色卡）=====
    y = 624
    rrect(d, [24, y, W-24, y+108], 18, fill=(184,128,106,255))
    d.text((40, y+14), "今日训练", font=F("DengXian",11), fill=(255,255,255,200))
    f_tw = F("HanSerifHeavy", 17)
    d.text((40, y+32), DATA["workout"], font=f_tw, fill=(255,255,255,255))
    f_ti = F("DengXian", 11)
    items_str = " · ".join(f"{n} {g}" for n,g in DATA["workout_items"][:2])
    d.text((40, y+62), items_str, font=f_ti, fill=(255,255,255,210))
    d.text((40, y+80), DATA["workout_items"][2][0]+" "+DATA["workout_items"][2][1], font=f_ti, fill=(255,255,255,180))
    d.text((W-40, y+32), DATA["workout_burn"], font=F("DengXian",13), fill=(255,255,255,230), anchor="ra")

    # 调整说明
    y = 748
    # 手札感引文
    d.text((24, y), "「", font=F("HanSerifHeavy",20), fill=(184,128,106,160))
    f_ad = F("HanSerifHeavy", 12)
    d.text((40, y+4), DATA["adjust"], font=f_ad, fill=MUTE)

    # 底部 tab
    y = H-58
    for x in range(28, W-28, 6):
        d.point([x, y], fill=(200,180,160,120))
    tabs = ["今日","饮食","训练","更多"]
    f_tab = F("DengXian", 12)
    for i,t in enumerate(tabs):
        tx = 24 + i*((W-48)//4) + (W-48)//8
        col = ACC if i==0 else MUTE
        d.text((tx, y+14), t, font=f_tab, fill=col, anchor="ma")
        if i==0:
            d.ellipse([tx-3, y+34, tx+3, y+40], fill=ACC)

    framed = phone_frame(img, frame_color=(225,212,195), bezel=11)
    framed.save(os.path.join(OUT, "05_organic_earth.png"))
    print("saved 05")

if __name__ == "__main__":
    render()
