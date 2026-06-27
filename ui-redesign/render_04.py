# -*- coding: utf-8 -*-
"""风格四：Bento Glass · 便当玻璃"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from render_common import *

def glass_tile(base_img, box, radius=22, fill=(255,255,255,18), border=(255,255,255,32), glow=None):
    """在 base_img 上画一块毛玻璃卡片。glow=(color, strength)"""
    x0,y0,x1,y1 = box
    w,h = x1-x0, y1-y0
    # 卡片层
    tile = Image.new("RGBA", (w,h), (0,0,0,0))
    td = ImageDraw.Draw(tile)
    td.rounded_rectangle([0,0,w-1,h-1], radius=radius, fill=fill)
    # 顶光渐变
    top_glow = vgradient((w, h//2), (255,255,255,18), (255,255,255,0))
    tile.paste(top_glow, (0,0), top_glow)
    # 描边
    td.rounded_rectangle([0,0,w-1,h-1], radius=radius, outline=border, width=1)
    if glow:
        gc, gs = glow
        glayer = Image.new("RGBA", (w+gs*4, h+gs*4), (0,0,0,0))
        gd = ImageDraw.Draw(glayer)
        gd.rounded_rectangle([gs*2,gs*2,gs*2+w-1,gs*2+h-1], radius=radius, fill=(gc[0],gc[1],gc[2],60))
        glayer = glayer.filter(ImageFilter.GaussianBlur(gs))
        base_img.alpha_composite(glayer, (x0-gs*2, y0-gs*2))
    base_img.alpha_composite(tile, (x0,y0))

def render():
    # 深空背景 + 微光
    bg = vgradient((W, H), (11,17,32,255), (19,28,48,255))
    img = bg.copy()
    d = ImageDraw.Draw(img)
    ACC = (56,189,248,255)      # 青蓝霓虹
    ACC2 = (167,139,250,255)    # 紫罗兰
    POS = (52,211,153,255)      # 翡翠
    WARN = (251,113,133,255)    # 玫红
    INK = (241,245,249,255)
    MUTE = (148,163,184,255)
    GLASS = (255,255,255,16)
    BORDER = (255,255,255,30)

    # 状态栏
    f_time = F("GeistMonoReg", 13)
    d.text((22, 16), "9:41", font=f_time, fill=INK)
    d.text((W-22, 16), "●●●", font=F("GeistMonoReg",12), fill=ACC, anchor="ra")

    # 日期 + 标题
    f_kick = F("GeistMonoReg", 10)
    text(d, (20, 48), DATA["date"].upper(), f_kick, MUTE, ls=1.5)
    f_title = F("Outfit", 24)
    d.text((20, 62), "今日", font=f_title, fill=INK)
    # 状态徽章小格
    glass_tile(img, [W-92, 56, W-18, 84], radius=14, fill=(52,211,153,28), border=(52,211,153,60))
    d = ImageDraw.Draw(img)
    d.text((W-55, 66), "离线", font=F("YaHei",11), fill=(52,211,153,255), anchor="mm")

    # ===== Bento 网格布局 =====
    pad = 16
    gap = 8
    # 第一行：大热量格(左,2/3宽) + 剩余格(右,1/3)
    r1y = 104
    big_w = int((W - pad*2 - gap) * 0.62)
    small_w = W - pad*2 - gap - big_w
    # 大格：热量环
    glass_tile(img, [pad, r1y, pad+big_w, r1y+176], radius=22, glow=(ACC,8))
    d = ImageDraw.Draw(img)
    f_lbl = F("GeistMonoReg", 9)
    text(d, (pad+16, r1y+14), "CALORIES / 热量", f_lbl, MUTE, ls=1.5)
    # 圆环
    rcx, rcy, rr = pad+60, r1y+104, 42
    d.ellipse([rcx-rr,rcy-rr,rcx+rr,rcy+rr], outline=(255,255,255,20), width=10)
    pct = DATA["actual_cal"]/DATA["target_cal"]
    steps = max(1,int(360*pct/4))
    for i in range(steps):
        t0 = -90 - 360*pct*i/steps
        t1 = -90 - 360*pct*(i+1)/steps
        col = (int(56+(167-56)*i/steps), int(189+(139-189)*i/steps), int(248+(250-248)*i/steps))
        d.arc([rcx-rr,rcy-rr,rcx+rr,rcy+rr], t0, t1, fill=col, width=10)
    f_rv = F("GeistMonoBold", 22)
    f_rl = F("YaHei", 9)
    d.text((rcx, rcy-4), str(DATA["remaining"]), font=f_rv, fill=INK, anchor="mm")
    d.text((rcx, rcy+14), "还可吃", font=f_rl, fill=MUTE, anchor="mm")
    # 右侧数据
    rx = pad+big_w-110
    f_dl = F("GeistMonoReg", 9)
    f_dv = F("GeistMonoBold", 18)
    d.text((rx, r1y+44), "目标", font=f_dl, fill=MUTE)
    d.text((rx, r1y+58), str(DATA["target_cal"]), font=f_dv, fill=INK)
    d.text((rx, r1y+88), "实际", font=f_dl, fill=MUTE)
    d.text((rx, r1y+102), str(DATA["actual_cal"]), font=f_dv, fill=ACC)
    d.text((rx, r1y+132), "消耗", font=f_dl, fill=MUTE)
    d.text((rx, r1y+146), str(DATA["burn_cal"]), font=f_dv, fill=INK)

    # 右上小格：消耗
    glass_tile(img, [pad+big_w+gap, r1y, W-pad, r1y+84], radius=22, glow=(POS,6))
    d = ImageDraw.Draw(img)
    text(d, (pad+big_w+gap+14, r1y+14), "BURN / 消耗", f_lbl, MUTE, ls=1.5)
    f_sv = F("GeistMonoBold", 28)
    d.text((pad+big_w+gap+14, r1y+38), str(DATA["burn_cal"]), font=f_sv, fill=POS)
    d.text((pad+big_w+gap+14, r1y+70), "kcal", font=f_dl, fill=MUTE)

    # 右中小格：赤字
    glass_tile(img, [pad+big_w+gap, r1y+84+gap, W-pad, r1y+176], radius=22)
    d = ImageDraw.Draw(img)
    deficit = DATA["burn_cal"] - DATA["actual_cal"]
    text(d, (pad+big_w+gap+14, r1y+98), "DEFICIT / 赤字", f_lbl, MUTE, ls=1.5)
    d.text((pad+big_w+gap+14, r1y+122), f"+{deficit}", font=f_sv, fill=ACC2)

    # 第二行：宏量营养三连格
    r2y = r1y + 176 + gap
    cw = (W - pad*2 - gap*2)//3
    macros = [("蛋白质", DATA["protein_c"], DATA["protein_t"], ACC, "P"),
              ("脂肪", DATA["fat_c"], DATA["fat_t"], ACC2, "F"),
              ("碳水", DATA["carbs_c"], DATA["carbs_t"], POS, "C")]
    for i,(n,c,t,col,tag) in enumerate(macros):
        cx0 = pad + i*(cw+gap)
        glass_tile(img, [cx0, r2y, cx0+cw, r2y+86], radius=18, glow=(col,5))
        d = ImageDraw.Draw(img)
        text(d, (cx0+12, r2y+12), tag, F("GeistMonoBold",11), col, ls=1)
        f_nv = F("GeistMonoBold", 22)
        d.text((cx0+12, r2y+30), str(c), font=f_nv, fill=INK)
        d.text((cx0+12, r2y+58), f"/ {t}g", font=f_dl, fill=MUTE)
        # 底部细进度
        pc = c/max(1,t)
        d.rounded_rectangle([cx0+12, r2y+74, cx0+cw-12, r2y+78], 999, fill=(255,255,255,20))
        d.rounded_rectangle([cx0+12, r2y+74, cx0+12+int((cw-24)*pc), r2y+78], 999, fill=col)

    # 第三行：今日训练横条格
    r3y = r2y + 86 + gap
    glass_tile(img, [pad, r3y, W-pad, r3y+118], radius=22, glow=(ACC2,6))
    d = ImageDraw.Draw(img)
    text(d, (pad+16, r3y+14), "TRAINING / 今日训练", f_lbl, MUTE, ls=1.5)
    f_tw = F("YaHeiBold", 17)
    d.text((pad+16, r3y+34), DATA["workout"], font=f_tw, fill=ACC2)
    f_ti = F("YaHei", 11)
    items_str = "   ".join(f"{n} {g}" for n,g in DATA["workout_items"][:3])
    d.text((pad+16, r3y+62), items_str, font=f_ti, fill=INK)
    f_tb = F("GeistMonoBold", 14)
    d.text((W-pad-16, r3y+34), DATA["workout_burn"], font=f_tb, fill=ACC, anchor="ra")
    # 第四项
    d.text((pad+16, r3y+86), DATA["workout_items"][3][0]+" "+DATA["workout_items"][3][1], font=f_ti, fill=MUTE)

    # 第四行：餐次小格 + 调整格
    r4y = r3y + 118 + gap
    glass_tile(img, [pad, r4y, W-pad, r4y+96], radius=22)
    d = ImageDraw.Draw(img)
    text(d, (pad+16, r4y+14), "MEALS / 今日餐次", f_lbl, MUTE, ls=1.5)
    meals = [("早",DATA["breakfast_kcal"]),("午",DATA["lunch_kcal"]),("晚",DATA["dinner_kcal"])]
    mw = (W - pad*2 - gap*2)//3
    f_mk = F("YaHeiBold",12)
    f_mv = F("GeistMonoBold",16)
    for i,(s,k) in enumerate(meals):
        mx = pad + i*(mw+gap) + mw//2
        d.text((mx, r4y+44), s, font=f_mk, fill=MUTE, anchor="ma")
        d.text((mx, r4y+62), str(k), font=f_mv, fill=INK, anchor="ma")
        d.text((mx, r4y+82), "kcal", font=f_dl, fill=MUTE, anchor="ma")

    # 底部 tab
    r5y = H - 70
    glass_tile(img, [pad, r5y, W-pad, H-12], radius=20, fill=(255,255,255,10))
    d = ImageDraw.Draw(img)
    tabs = [("今日",ACC),("饮食",MUTE),("训练",MUTE),("更多",MUTE)]
    for i,(t,col) in enumerate(tabs):
        tx = pad + 20 + i*((W-pad*2-40)//4) + (W-pad*2-40)//8
        d.text((tx, r5y+22), t, font=F("YaHeiBold",11), fill=col, anchor="ma")
        if i==0:
            d.ellipse([tx-3, r5y+38, tx+3, r5y+44], fill=ACC)

    framed = phone_frame(img, frame_color=(8,12,24), bezel=11)
    framed.save(os.path.join(OUT, "04_bento_glass.png"))
    print("saved 04")

if __name__ == "__main__":
    render()
