# -*- coding: utf-8 -*-
"""风格二：Soft Gradient Wellness · 柔和渐变康养"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from render_common import *

def render():
    # 暖白渐变背景
    bg = vgradient((W, H), (255,248,243,255), (255,241,234,255))
    img = bg.copy()
    d = ImageDraw.Draw(img)
    ACC = (255,138,91,255)       # 暖橙
    ACC2 = (255,176,136,255)     # 桃
    MINT = (123,216,181,255)     # 薄荷
    SKY = (142,201,240,255)      # 天蓝
    INK = (45,36,30,255)
    MUTE = (138,123,110,255)
    SURF = (255,255,255,255)

    # 状态栏
    f_time = F("OutfitReg", 14)
    d.text((24, 16), "9:41", font=f_time, fill=INK)
    d.text((W-24, 16), "●●●", font=F("OutfitReg",13), fill=ACC, anchor="ra")

    # 日期
    f_date = F("OutfitReg", 13)
    d.text((24, 54), DATA["date"], font=f_date, fill=MUTE)

    # 标题
    f_title = F("Outfit", 30)
    d.text((24, 72), "今日", font=f_title, fill=INK)
    f_sub = F("YaHeiLight", 13)
    d.text((24, 110), "慢慢来，长久地来", font=f_sub, fill=MUTE)

    # 状态药丸
    rrect(d, [W-118, 52, W-24, 76], 999, fill=(123,216,181,40))
    f_pill = F("OutfitReg", 11)
    d.text((W-71, 60), "离线可用", font=f_pill, fill=(90,170,140,255), anchor="ma")

    # ===== 卡路里大卡 + 圆环 =====
    cy = 200
    rrect(d, [24, cy, W-24, cy+200], 28, fill=SURF)
    # 柔阴影模拟
    shadow = Image.new("RGBA", (W, H), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([24, cy+4, W-24, cy+204], 28, fill=(200,150,120,18))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    img = Image.alpha_composite(img, shadow)
    d = ImageDraw.Draw(img)

    # 渐变圆环
    ring_cx, ring_cy, ring_r = 110, cy+100, 52
    ring_stroke = 14
    pct = DATA["actual_cal"]/DATA["target_cal"]
    # 底环
    d.ellipse([ring_cx-ring_r, ring_cy-ring_r, ring_cx+ring_r, ring_cy+ring_r],
              outline=(245,235,228,255), width=ring_stroke)
    # 进度弧（渐变色用两段近似）
    start = -90
    extent = -360*pct
    # 用多段近似渐变弧
    steps = max(1, int(abs(extent)/6))
    for i in range(steps):
        t0 = start + extent*i/steps
        t1 = start + extent*(i+1)/steps
        r = int(255 - (255-255)*i/steps)
        g = int(138 + (176-138)*i/steps)
        b = int(91 + (136-91)*i/steps)
        d.arc([ring_cx-ring_r, ring_cy-ring_r, ring_cx+ring_r, ring_cy+ring_r],
              t0, t1, fill=(r,g,b,255), width=ring_stroke)
    f_ring_v = F("Outfit", 32)
    f_ring_l = F("YaHei", 11)
    d.text((ring_cx, ring_cy-6), str(DATA["remaining"]), font=f_ring_v, fill=INK, anchor="mm")
    d.text((ring_cx, ring_cy+16), "还可吃 kcal", font=f_ring_l, fill=MUTE, anchor="mm")

    # 右侧数据
    f_rl = F("YaHei", 11)
    f_rv = F("Outfit", 20)
    rx = 200
    d.text((rx, cy+30), "目标", font=f_rl, fill=MUTE)
    d.text((rx, cy+46), str(DATA["target_cal"]), font=f_rv, fill=INK)
    d.text((rx, cy+80), "实际", font=f_rl, fill=MUTE)
    d.text((rx, cy+96), str(DATA["actual_cal"]), font=f_rv, fill=ACC)
    d.text((rx, cy+130), "消耗", font=f_rl, fill=MUTE)
    d.text((rx, cy+146), str(DATA["burn_cal"]), font=f_rv, fill=INK)

    # ===== 宏量营养：圆润进度 =====
    y = 426
    rrect(d, [24, y, W-24, y+118], 24, fill=SURF)
    f_mh = F("YaHeiBold", 13)
    d.text((40, y+16), "今日营养", font=f_mh, fill=INK)
    macros = [("蛋白质", DATA["protein_c"], DATA["protein_t"], MINT),
              ("脂肪", DATA["fat_c"], DATA["fat_t"], ACC),
              ("碳水", DATA["carbs_c"], DATA["carbs_t"], SKY)]
    f_ml = F("YaHei", 12)
    f_mv = F("OutfitReg", 12)
    for i,(n,c,t,col) in enumerate(macros):
        ry = y + 42 + i*24
        d.text((40, ry), n, font=f_ml, fill=INK)
        d.text((W-40, ry), f"{c} / {t}g", font=f_mv, fill=MUTE, anchor="ra")
        d.rounded_rectangle([100, ry+3, W-110, ry+9], 999, fill=(245,235,228,255))
        pct = c/max(1,t)
        d.rounded_rectangle([100, ry+3, 100+int((W-210)*pct), ry+9], 999, fill=col)

    # ===== 今日餐次 =====
    y = 568
    f_sh = F("YaHeiBold", 14)
    d.text((24, y), "今日餐次", font=f_sh, fill=INK)
    meals = [("早餐", DATA["breakfast"], DATA["breakfast_kcal"], MINT),
             ("午餐", DATA["lunch"], DATA["lunch_kcal"], ACC),
             ("晚餐", DATA["dinner"], DATA["dinner_kcal"], ACC2)]
    f_mn = F("YaHeiBold", 13)
    f_mf = F("YaHei", 11)
    f_mk = F("Outfit", 13)
    for i,(name, items, kcal, col) in enumerate(meals):
        ry = y + 24 + i*44
        rrect(d, [24, ry, W-24, ry+38], 18, fill=SURF)
        # 圆形 badge
        d.ellipse([36, ry+9, 56, ry+29], fill=(col[0],col[1],col[2],40))
        d.text((46, ry+13), name[0], font=f_mn, fill=col, anchor="mm")
        line = " · ".join(f"{n} {g}" for n,g in items)
        d.text((68, ry+8), line, font=f_mf, fill=INK)
        d.text((W-40, ry+10), f"{kcal} kcal", font=f_mk, fill=MUTE, anchor="ra")

    # ===== 今日训练（渐变卡）=====
    y = 712
    grad_card = vgradient((W-48, 92), (255,138,91,255), (255,176,136,255))
    img.paste(grad_card, (24, y), grad_card)
    d = ImageDraw.Draw(img)
    f_tw = F("YaHeiBold", 16)
    d.text((40, y+16), "今日训练", font=F("YaHei",11), fill=(255,255,255,200))
    d.text((40, y+34), DATA["workout"], font=f_tw, fill=(255,255,255,255))
    f_ti = F("YaHei", 11)
    items_str = " · ".join(f"{n} {g}" for n,g in DATA["workout_items"][:2])
    d.text((40, y+62), items_str, font=f_ti, fill=(255,255,255,200))
    d.text((W-40, y+38), DATA["workout_burn"], font=F("Outfit",13), fill=(255,255,255,230), anchor="ra")

    # 底部 tab
    d.rounded_rectangle([W//2-70, H-50, W//2+70, H-18], 999, fill=(255,138,91,255))
    d.text((W//2, H-34), "今日", font=F("YaHeiBold",13), fill=(255,255,255,255), anchor="mm")
    for i,(t,x) in enumerate([("饮食",W*0.25),("训练",W*0.75)]):
        d.text((x, H-34), t, font=F("YaHei",12), fill=MUTE, anchor="mm")

    framed = phone_frame(img, frame_color=(240,225,215), bezel=11)
    framed.save(os.path.join(OUT, "02_soft_gradient_wellness.png"))
    print("saved 02")

if __name__ == "__main__":
    render()
