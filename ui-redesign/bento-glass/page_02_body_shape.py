# -*- coding: utf-8 -*-
"""Onboarding · 体态图选择"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from bg_common import *

def render():
    img = new_canvas()
    d = ImageDraw.Draw(img)
    status_bar(d)

    # 步骤指示器
    cur = 1
    sy = 52
    for i in range(4):
        cx = 20 + i*16
        col = C["accent"] if i==cur else (255,255,255,30)
        d.ellipse([cx,sy,cx+8,sy+8], fill=col)
    d.text((W-20, sy+4), "2 / 4", font=F("GeistMono",11), fill=C["inkMute"], anchor="ra")

    d.text((20, 78), "体态选择", font=F("OutfitBold", 28), fill=C["ink"])
    d.text((20, 116), "选一个最接近的现状，用于估算体脂", font=F("YaHei", 13), fill=C["inkMute"])

    # ===== 体态图网格 3x2 =====
    y = 158
    gw = (W - 32 - 8) // 2
    gh = 130
    shapes = [
        ("体脂偏高", "腹部圆润", 28, C["inkMute"], False),
        ("腹部变平", "轮廓收紧", 24, C["accent"], True),
        ("马甲线隐约", "线条初现", 20, C["inkMute"], False),
        ("马甲线明显", "线条清晰", 17, C["inkMute"], False),
        ("线条分明", "体脂较低", 14, C["inkMute"], False),
        ("精瘦", "竞技状态", 11, C["inkMute"], False),
    ]
    for i,(name, desc, bf, col, act) in enumerate(shapes):
        r, c = i//2, i%2
        tx = 16 + c*(gw+8)
        ty = y + r*(gh+8)
        glass_tile(img, [tx, ty, tx+gw, ty+gh], radius=18, raised=act, glow=C["accent"] if act else None, glow_strength=5)
        d = ImageDraw.Draw(img)
        # 简化人体轮廓 SVG-like（用椭圆+矩形示意）
        bx = tx + gw//2
        # 头
        d.ellipse([bx-10, ty+18, bx+10, ty+38], outline=col, width=2)
        # 肩到腰（梯形）
        d.polygon([(bx-22,ty+42),(bx+22,ty+42),(bx+16,ty+82),(bx-16,ty+82)], outline=col, width=2)
        # 标签
        d.text((bx, ty+92), name, font=F("YaHeiBold", 12), fill=col, anchor="mm")
        d.text((bx, ty+108), f"~{bf}% · {desc}", font=F("YaHei", 10), fill=C["inkMute"], anchor="mm")
        if act:
            d.ellipse([tx+gw-22, ty+12, tx+gw-10, ty+24], fill=C["accent"])

    # ===== 当前估算 =====
    y = 560
    glass_tile(img, [16, y, W-16, y+84], radius=18, glow=C["accent2"], glow_strength=6)
    d = ImageDraw.Draw(img)
    label_uc(d, (32, y+14), "ESTIMATED / 估算体脂", ls=1.2)
    d.text((32, y+36), "24", font=F("GeistMonoBold", 32), fill=C["accent2"])
    d.text((32, y+72), "%", font=F("GeistMono", 12), fill=C["inkMute"])
    d.text((W-32, y+44), "基于体态图", font=F("YaHei", 11), fill=C["inkMute"], anchor="ra")
    d.text((W-32, y+62), "可手动覆盖", font=F("YaHei", 10), fill=C["inkFaint"], anchor="ra")

    # ===== 手动覆盖输入 =====
    y = 660
    glass_tile(img, [16, y, W-16, y+56], radius=18)
    d = ImageDraw.Draw(img)
    d.text((32, y+18), "手动输入体脂率", font=F("YaHei", 13), fill=C["ink"])
    d.text((W-72, y+16), "— —", font=F("GeistMonoBold", 20), fill=C["inkFaint"])
    d.text((W-32, y+22), "%", font=F("GeistMono", 11), fill=C["inkMute"], anchor="ra")

    # ===== 底部主按钮 =====
    y = H - 96
    glass_tile(img, [16, y, W-16, y+52], radius=18, raised=True, glow=C["accent"], glow_strength=10)
    d = ImageDraw.Draw(img)
    d.text((W//2, y+26), "下一步 · 训练习惯", font=F("YaHeiBold", 15), fill=C["accent"], anchor="mm")

    save(img, "onboarding_02_body_shape.png")

if __name__ == "__main__":
    render()
