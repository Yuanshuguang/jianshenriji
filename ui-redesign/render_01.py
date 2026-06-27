# -*- coding: utf-8 -*-
"""风格一：Athletic Brutalism · 竞技粗野"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from render_common import *

def render():
    img = Image.new("RGBA", (W, H), (10,10,11,255))
    d = ImageDraw.Draw(img)
    ACC = (255,90,31,255)      # 电光橙
    ACC2 = (204,255,0,255)     # 荧光黄绿
    INK = (255,255,255,255)
    MUTE = (138,138,146,255)
    LINE = (38,38,42,255)
    RAISED = (20,20,22,255)

    # 顶部状态栏
    f_time = F("GeistMonoReg", 14)
    d.text((24, 16), "9:41", font=f_time, fill=INK)
    d.text((W-24, 16), "●●●", font=f_time, fill=ACC, anchor="ra")

    # 日期标签（全大写字距）
    f_kick = F("GeistMonoReg", 11)
    text(d, (24, 50), DATA["date"].upper(), f_kick, MUTE, ls=2)

    # 巨型标题
    f_title = F("BigShoulders", 84)
    d.text((22, 62), "TODAY", font=f_title, fill=INK)
    f_cn = F("YaHeiBold", 26)
    d.text((24, 150), "今日", font=f_cn, fill=INK)

    # 顶部强调色条
    d.rectangle([24, 188, W-24, 190], fill=ACC)

    # ===== 核心热量块：黑底 + 巨型数字 =====
    y = 206
    f_lbl = F("GeistMonoReg", 10)
    text(d, (24, y), "REMAINING / 还可吃", f_lbl, MUTE, ls=2)
    f_big = F("BigShoulders", 96)
    d.text((20, y+14), str(DATA["remaining"]), font=f_big, fill=ACC)
    f_unit = F("GeistMonoReg", 16)
    d.text((24, y+128), "KCAL", font=f_unit, fill=INK)

    # 右侧三列数据
    col_x = [225, 285, 345]
    col_lbl = ["目标", "实际", "消耗"]
    col_val = [str(DATA["target_cal"]), str(DATA["actual_cal"]), str(DATA["burn_cal"])]
    f_cv = F("BigShoulders", 30)
    for i in range(3):
        text(d, (col_x[i], y+14), col_lbl[i], f_lbl, MUTE, ls=1)
        d.text((col_x[i], y+30), col_val[i], font=f_cv, fill=INK)

    # 粗分割线
    d.rectangle([24, y+150, W-24, y+152], fill=LINE)

    # ===== 宏量营养：粗实心进度条 =====
    y = 386
    text(d, (24, y), "MACROS / 宏量营养", f_lbl, MUTE, ls=2)
    macros = [("蛋白质", DATA["protein_c"], DATA["protein_t"], ACC),
              ("脂肪", DATA["fat_c"], DATA["fat_t"], ACC2),
              ("碳水", DATA["carbs_c"], DATA["carbs_t"], INK)]
    f_ml = F("YaHeiBold", 13)
    f_mv = F("GeistMonoReg", 13)
    f_mv2 = F("GeistMonoBold", 16)
    for i,(n,c,t,col) in enumerate(macros):
        ry = y + 22 + i*46
        d.text((24, ry), n, font=f_ml, fill=INK)
        d.text((W-24, ry), f"{c}/{t}g", font=f_mv, fill=MUTE, anchor="ra")
        # 粗进度条
        d.rectangle([24, ry+22, W-24, ry+30], fill=(30,30,34,255))
        pct = c/max(1,t)
        d.rectangle([24, ry+22, 24+int((W-48)*pct), ry+30], fill=col)

    # ===== 今日餐次 =====
    y = 548
    text(d, (24, y), "MEALS / 今日餐次", f_lbl, MUTE, ls=2)
    f_mn = F("YaHeiBold", 15)
    f_mf = F("YaHei", 12)
    f_mk = F("GeistMonoBold", 14)
    meals = [("早", DATA["breakfast"], DATA["breakfast_kcal"]),
             ("午", DATA["lunch"], DATA["lunch_kcal"]),
             ("晚", DATA["dinner"], DATA["dinner_kcal"])]
    for i,(short, items, kcal) in enumerate(meals):
        ry = y + 22 + i*54
        # 左侧色块标签
        d.rectangle([24, ry, 64, ry+38], fill=RAISED)
        d.rectangle([24, ry, 26, ry+38], fill=ACC)
        f_short = F("BigShoulders", 26)
        d.text((34, ry+6), short, font=f_short, fill=INK)
        # 食物
        line = "  ·  ".join(f"{n} {g}" for n,g in items)
        d.text((76, ry+4), line, font=f_mf, fill=INK)
        d.text((W-24, ry+4), f"{kcal}", font=f_mk, fill=ACC, anchor="ra")
        d.text((W-24, ry+22), "kcal", font=f_lbl, fill=MUTE, anchor="ra")

    # ===== 今日训练 =====
    y = 736
    d.rectangle([24, y, W-24, y+2], fill=LINE)
    text(d, (24, y+12), "TRAINING / 今日训练", f_lbl, MUTE, ls=2)
    f_tw = F("YaHeiBold", 18)
    d.text((24, y+30), DATA["workout"], font=f_tw, fill=ACC2)
    f_ti = F("YaHei", 12)
    items_str = "   ".join(f"{n} {g}" for n,g in DATA["workout_items"])
    # 截断过长
    d.text((24, y+56), items_str[:30], font=f_ti, fill=INK)
    d.text((W-24, y+30), DATA["workout_burn"], font=f_mv, fill=MUTE, anchor="ra")

    # ===== 底部 tab bar =====
    d.rectangle([0, H-64, W, H-62], fill=LINE)
    tabs = ["今日", "饮食", "训练", "更多"]
    f_tab = F("YaHeiBold", 12)
    for i, t in enumerate(tabs):
        tx = 24 + i*((W-48)//4) + (W-48)//8
        col = ACC if i==0 else MUTE
        d.text((tx, H-44), t, font=f_tab, fill=col, anchor="ma")
        if i==0:
            d.rectangle([tx-14, H-22, tx+14, H-20], fill=ACC)

    framed = phone_frame(img, frame_color=(8,8,10), bezel=11)
    framed.save(os.path.join(OUT, "01_athletic_brutalism.png"))
    print("saved 01")

if __name__ == "__main__":
    render()
