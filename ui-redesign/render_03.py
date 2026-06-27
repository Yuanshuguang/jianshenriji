# -*- coding: utf-8 -*-
"""风格三：Editorial Minimal · 编辑级极简"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from render_common import *

def render():
    img = Image.new("RGBA", (W, H), (250,250,250,255))
    d = ImageDraw.Draw(img)
    ACC = (67,56,202,255)      # 靛蓝
    POS = (21,128,61,255)      # 深绿
    NEG = (185,28,28,255)      # 深红
    INK = (24,24,27,255)
    MUTE = (113,113,122,255)
    FAINT = (161,161,170,255)
    LINE = (228,228,231,255)

    # 状态栏
    f_time = F("InstrumentSansReg", 14)
    d.text((24, 16), "9:41", font=f_time, fill=INK)
    d.text((W-24, 16), "●●●", font=F("InstrumentSansReg",13), fill=INK, anchor="ra")

    # 刊头：细线 + 日期 + 期号感
    d.line([24, 46, W-24, 46], fill=LINE, width=1)
    f_kick = F("InstrumentSansReg", 10)
    d.text((24, 54), DATA["date"], font=f_kick, fill=MUTE)
    d.text((W-24, 54), "VOL.06 · 今日", font=f_kick, fill=FAINT, anchor="ra")
    d.line([24, 72, W-24, 72], fill=LINE, width=1)

    # 大标题（衬线）
    f_title = F("HanSerifHeavy", 34)
    d.text((24, 84), "今日", font=f_title, fill=INK)
    f_sub = F("InstrumentSerif", 16)
    d.text((24, 128), "Today's Plan — 6月23日", font=f_sub, fill=MUTE)

    # ===== 核心数据：编辑式三栏对齐 =====
    y = 176
    d.line([24, y, W-24, y], fill=LINE, width=1)
    f_col = F("InstrumentSansReg", 10)
    f_cv = F("HanSerifHeavy", 38)
    f_cu = F("InstrumentSansReg", 11)
    cols = [("目标摄入", str(DATA["target_cal"]), "kcal", INK),
            ("实际摄入", str(DATA["actual_cal"]), "kcal", ACC),
            ("还可吃", str(DATA["remaining"]), "kcal", INK)]
    for i,(l,v,u,col) in enumerate(cols):
        cx = 24 + i*((W-48)//3)
        d.text((cx, y+12), l, font=f_col, fill=MUTE)
        d.text((cx, y+28), v, font=f_cv, fill=col)
        d.text((cx, y+74), u, font=f_cu, fill=FAINT)
    d.line([24, y+96, W-24, y+96], fill=LINE, width=1)

    # 进度细线
    pct = DATA["actual_cal"]/DATA["target_cal"]
    d.line([24, y+104, W-24, y+104], fill=(235,235,238,255), width=3)
    d.line([24, y+104, 24+int((W-48)*pct), y+104], fill=ACC, width=3)
    f_pct = F("InstrumentSansReg", 10)
    d.text((24, y+112), "摄入进度", font=f_pct, fill=FAINT)
    d.text((W-24, y+112), f"{int(pct*100)}%", font=f_pct, fill=ACC, anchor="ra")

    # ===== 宏量营养：表格化 =====
    y = 312
    f_sh = F("HanSerifHeavy", 18)
    d.text((24, y), "宏量营养", font=f_sh, fill=INK)
    d.text((W-24, y+4), "g / 克", font=f_col, fill=FAINT, anchor="ra")
    d.line([24, y+30, W-24, y+30], fill=LINE, width=1)
    macros = [("蛋白质", DATA["protein_c"], DATA["protein_t"], ACC),
              ("脂肪", DATA["fat_c"], DATA["fat_t"], INK),
              ("碳水", DATA["carbs_c"], DATA["carbs_t"], INK)]
    f_ml = F("InstrumentSansReg", 14)
    f_mv = F("InstrumentSans", 16)
    for i,(n,c,t,col) in enumerate(macros):
        ry = y + 44 + i*36
        d.text((24, ry), n, font=f_ml, fill=INK)
        # 细进度
        d.line([110, ry+10, W-110, ry+10], fill=(235,235,238,255), width=4)
        pc = c/max(1,t)
        d.line([110, ry+10, 110+int((W-220)*pc), ry+10], fill=col, width=4)
        d.text((W-24, ry), f"{c}", font=f_mv, fill=col, anchor="ra")
        d.text((W-60, ry+2), f"/ {t}", font=f_col, fill=FAINT, anchor="ra")
    d.line([24, y+164, W-24, y+164], fill=LINE, width=1)

    # ===== 今日餐次：编辑列表 =====
    y = 500
    d.text((24, y), "今日餐次", font=f_sh, fill=INK)
    d.text((W-24, y+4), "kcal", font=f_col, fill=FAINT, anchor="ra")
    d.line([24, y+30, W-24, y+30], fill=LINE, width=1)
    meals = [("早餐", DATA["breakfast"], DATA["breakfast_kcal"]),
             ("午餐", DATA["lunch"], DATA["lunch_kcal"]),
             ("晚餐", DATA["dinner"], DATA["dinner_kcal"])]
    f_mn = F("HanSerifHeavy", 15)
    f_mf = F("InstrumentSansReg", 12)
    f_mk = F("InstrumentSans", 15)
    for i,(name, items, kcal) in enumerate(meals):
        ry = y + 46 + i*44
        d.text((24, ry), name, font=f_mn, fill=INK)
        line = " · ".join(f"{n} {g}" for n,g in items)
        d.text((24, ry+20), line, font=f_mf, fill=MUTE)
        d.text((W-24, ry+4), str(kcal), font=f_mk, fill=INK, anchor="ra")
        if i<2:
            d.line([24, ry+38, W-24, ry+38], fill=(242,242,245,255), width=1)

    # ===== 今日训练 =====
    y = 658
    d.line([24, y, W-24, y], fill=LINE, width=1)
    d.text((24, y+12), "今日训练", font=f_sh, fill=INK)
    f_tw = F("HanSerifHeavy", 20)
    d.text((24, y+40), DATA["workout"], font=f_tw, fill=ACC)
    f_ti = F("InstrumentSansReg", 12)
    items_str = "   ".join(f"{n} {g}" for n,g in DATA["workout_items"])
    d.text((24, y+70), items_str, font=f_ti, fill=MUTE)
    d.text((W-24, y+40), DATA["workout_burn"], font=f_mv, fill=INK, anchor="ra")

    # 调整说明
    y = 752
    d.line([24, y, W-24, y], fill=LINE, width=1)
    d.text((24, y+12), "动态调整", font=F("InstrumentSansReg",10), fill=FAINT)
    f_ad = F("InstrumentSerif", 13)
    d.text((24, y+28), DATA["adjust"], font=f_ad, fill=MUTE)

    # 底部 tab
    d.line([24, H-58, W-24, H-58], fill=LINE, width=1)
    tabs = ["今日","饮食","训练","更多"]
    f_tab = F("InstrumentSans", 12)
    for i,t in enumerate(tabs):
        tx = 24 + i*((W-48)//4) + (W-48)//8
        col = ACC if i==0 else FAINT
        d.text((tx, H-38), t, font=f_tab, fill=col, anchor="ma")
        if i==0:
            d.line([tx-10, H-22, tx+10, H-22], fill=ACC, width=2)

    framed = phone_frame(img, frame_color=(235,235,238), bezel=11)
    framed.save(os.path.join(OUT, "03_editorial_minimal.png"))
    print("saved 03")

if __name__ == "__main__":
    render()
