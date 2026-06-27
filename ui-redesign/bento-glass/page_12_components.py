# -*- coding: utf-8 -*-
"""组件库展示页"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from bg_common import *

def render():
    # 用 2 倍宽画布展示组件
    CW, CH = 780, 1800
    bg = vgradient((CW, CH), C["bg"], C["bgGlow"])
    img = bg.copy()
    d = ImageDraw.Draw(img)

    # 标题
    d.text((32, 32), "Bento Glass", font=F("OutfitBold", 36), fill=C["ink"])
    d.text((32, 78), "Component Library · 组件库", font=F("YaHei", 16), fill=C["inkMute"])
    label_uc(d, (32, 110), "DESIGN SYSTEM · v1.0", ls=2, size=11)

    # ===== 色板 =====
    y = 150
    label_uc(d, (32, y), "01 · COLOR PALETTE / 色板", ls=1.5, size=12)
    y += 28
    palette = [("bg",C["bg"]),("bgGlow",C["bgGlow"]),("glass",C["glass"]),("ink",C["ink"]),
               ("inkMute",C["inkMute"]),("accent",C["accent"]),("accent2",C["accent2"]),
               ("positive",C["positive"]),("warn",C["warn"]),("amber",C["amber"])]
    for i,(name,col) in enumerate(palette):
        r,c = i//5, i%5
        cx = 32 + c*144
        cy = y + r*84
        # 色块（带玻璃感）
        glass_tile(img, [cx, cy, cx+128, cy+64], radius=14, glow=col if name in ["accent","accent2","positive","warn","amber"] else None, glow_strength=4)
        d = ImageDraw.Draw(img)
        d.rounded_rectangle([cx+8, cy+8, cx+56, cy+56], 10, fill=col)
        d.text((cx+68, cy+14), name, font=F("GeistMonoBold", 11), fill=C["ink"])
        # 色值
        if len(col)==4:
            hexv = f"#{col[0]:02X}{col[1]:02X}{col[2]:02X}"
            d.text((cx+68, cy+32), hexv, font=F("GeistMono", 9), fill=C["inkMute"])
            d.text((cx+68, cy+46), f"a{col[3]}", font=F("GeistMono", 9), fill=C["inkFaint"])
    y += 84*2 + 16

    # ===== 字体阶梯 =====
    label_uc(d, (32, y), "02 · TYPOGRAPHY / 字体阶梯", ls=1.5, size=12)
    y += 28
    fonts = [("Display 48 · GeistMono Bold", "1650", "OutfitBold" if False else "GeistMonoBold", 48),
             ("H1 28 · Outfit Bold", "今日", "OutfitBold", 28),
             ("H2 22 · Outfit SemiBold", "背部训练", "OutfitBold", 22),
             ("H3 17 · Outfit SemiBold", "高位下拉", "OutfitBold", 17),
             ("Body 14 · Outfit Regular", "蛋白质优先保留", "YaHei", 14),
             ("Caption 12 · YaHei", "系统根据偏差重排", "YaHei", 12),
             ("Label 11 · GeistMono", "CALORIES / 热量", "GeistMono", 11),
             ("Micro 10 · GeistMono", "0.08em TRACKING", "GeistMono", 10)]
    for desc, sample, fnt, sz in fonts:
        d.text((32, y), sample, font=F(fnt, sz), fill=C["ink"])
        d.text((400, y+sz-12), desc, font=F("GeistMono", 10), fill=C["inkMute"])
        y += sz + 18

    # ===== 玻璃格变体 =====
    y += 8
    label_uc(d, (32, y), "03 · GLASS TILES / 玻璃格", ls=1.5, size=12)
    y += 28
    tiles = [("Default", False, None), ("Raised", True, None),
             ("Accent Glow", False, C["accent"]), ("Warn Glow", True, C["warn"])]
    for i,(name, raised, glow) in enumerate(tiles):
        r,c = i//2, i%2
        tx = 32 + c*360
        ty = y + r*100
        glass_tile(img, [tx, ty, tx+340, ty+84], radius=18, raised=raised, glow=glow, glow_strength=6)
        d = ImageDraw.Draw(img)
        d.text((tx+16, ty+16), name, font=F("YaHeiBold", 14), fill=C["ink"])
        d.text((tx+16, ty+40), f"raised={raised}", font=F("GeistMono", 10), fill=C["inkMute"])
        if glow:
            d.text((tx+16, ty+58), f"glow={glow[:3]}", font=F("GeistMono", 10), fill=glow)
    y += 100*2 + 16

    # ===== 进度组件 =====
    label_uc(d, (32, y), "04 · PROGRESS / 进度组件", ls=1.5, size=12)
    y += 28
    # 环
    glass_tile(img, [32, y, 372, y+130], radius=18, glow=C["accent"], glow_strength=4)
    d = ImageDraw.Draw(img)
    label_uc(d, (48, y+14), "PROGRESS RING", ls=1.2, size=10)
    progress_ring(d, 130, y+78, 36, 0.65, stroke=8)
    d.text((130, y+74), "65%", font=F("GeistMonoBold", 16), fill=C["ink"], anchor="mm")
    progress_ring(d, 240, y+78, 36, 0.92, stroke=8, color=C["positive"])
    d.text((240, y+74), "92%", font=F("GeistMonoBold", 16), fill=C["positive"], anchor="mm")
    progress_ring(d, 340, y+78, 30, 1.0, stroke=6, color=C["amber"])
    d.text((340, y+74), "100", font=F("GeistMonoBold", 12), fill=C["amber"], anchor="mm")
    # 条
    glass_tile(img, [392, y, 748, y+130], radius=18)
    d = ImageDraw.Draw(img)
    label_uc(d, (408, y+14), "PROGRESS BAR", ls=1.2, size=10)
    bars = [("蛋白质", 0.66, C["accent"]), ("脂肪", 0.85, C["accent2"]), ("碳水", 1.0, C["warn"])]
    for i,(n,pct,col) in enumerate(bars):
        ry = y + 40 + i*28
        d.text((408, ry), n, font=F("YaHei", 11), fill=C["inkMute"])
        d.text((732, ry), f"{int(pct*100)}%", font=F("GeistMonoBold", 11), fill=col, anchor="ra")
        progress_bar(d, [460, ry+4, 700, ry+10], pct, col, height=6)
    y += 130 + 16

    # ===== 按钮 =====
    label_uc(d, (32, y), "05 · BUTTONS / 按钮", ls=1.5, size=12)
    y += 28
    btns = [("Primary Filled", C["accent"], True, False),
            ("Glass Primary", C["accent"], False, True),
            ("Accent2 Glow", C["accent2"], False, True),
            ("Positive", C["positive"], True, False),
            ("Ghost", C["inkMute"], False, False),
            ("Warn", C["warn"], False, True)]
    for i,(name, col, filled, glow_on) in enumerate(btns):
        r,c = i//3, i%3
        tx = 32 + c*240
        ty = y + r*64
        if filled:
            d.rounded_rectangle([tx, ty, tx+220, ty+48], 14, fill=col)
            d.text((tx+110, ty+24), name, font=F("YaHeiBold", 13), fill=(11,17,32,255), anchor="mm")
        else:
            glass_tile(img, [tx, ty, tx+220, ty+48], radius=14, raised=True, glow=col if glow_on else None, glow_strength=4)
            d = ImageDraw.Draw(img)
            d.text((tx+110, ty+24), name, font=F("YaHeiBold", 13), fill=col, anchor="mm")
    y += 64*2 + 16

    # ===== 徽章 / 标签 =====
    label_uc(d, (32, y), "06 · BADGES / 徽章", ls=1.5, size=12)
    y += 28
    badges = [("达标", C["positive"]), ("多吃", C["warn"]), ("少吃", C["positive"]),
              ("完成", C["accent"]), ("跳过", C["warn"]), ("顺延", C["accent2"]),
              ("合理", C["positive"]), ("注意", C["amber"])]
    tx, ty = 32, y
    for name, col in badges:
        f = F("YaHeiBold", 11)
        tw = f.getbbox(name)[2] + 24
        if tx + tw > CW-32:
            tx = 32
            ty += 40
        glass_tile(img, [tx, ty, tx+tw, ty+28], radius=10, glow=col, glow_strength=3)
        d = ImageDraw.Draw(img)
        d.text((tx+tw//2, ty+14), name, font=f, fill=col, anchor="mm")
        tx += tw + 10
    y = ty + 28 + 24

    # ===== 输入框 =====
    label_uc(d, (32, y), "07 · INPUTS / 输入框", ls=1.5, size=12)
    y += 28
    # 默认
    glass_tile(img, [32, y, 372, y+56], radius=14)
    d = ImageDraw.Draw(img)
    d.text((48, y+18), "输入食物名称", font=F("YaHei", 13), fill=C["inkFaint"])
    d.text((356, y+22), "›", font=F("YaHei", 16), fill=C["inkMute"], anchor="ra")
    # 聚焦
    glass_tile(img, [392, y, 748, y+56], radius=14, raised=True, glow=C["accent"], glow_strength=5)
    d = ImageDraw.Draw(img)
    d.text((408, y+18), "米饭一碗", font=F("YaHei", 13), fill=C["ink"])
    d.line([408, y+44, 732, y+44], fill=C["accent"], width=1)
    y += 56 + 16

    # ===== Tab Bar =====
    label_uc(d, (32, y), "08 · TAB BAR / 底部导航", ls=1.5, size=12)
    y += 28
    glass_tile(img, [32, y, 748, y+72], radius=20, raised=True, glow=C["accent"], glow_strength=4)
    d = ImageDraw.Draw(img)
    tabs = [("今日",C["accent"]),("饮食",C["inkMute"]),("训练",C["inkMute"]),("更多",C["inkMute"]),
            ("历史",C["inkMute"]),("设置",C["inkMute"])]
    for i,(t,col) in enumerate(tabs):
        tx = 32 + 30 + i*((748-32-60)//6) + (748-32-60)//12
        d.text((tx, y+22), t, font=F("YaHeiBold", 11), fill=col, anchor="ma")
        if i==0:
            d.ellipse([tx-3, y+44, tx+3, y+50], fill=C["accent"])

    img.save(os.path.join(OUT, "components_library.png"))
    print("saved components_library.png")

if __name__ == "__main__":
    render()
