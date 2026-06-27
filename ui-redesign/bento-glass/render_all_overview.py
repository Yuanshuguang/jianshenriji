# -*- coding: utf-8 -*-
"""全部页面并排总览图"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

OUT = r"C:\Users\Administrator\.workbuddy\workspace\files\46340\b3ccd446-b1a6-4865-b5f8-df40a7de1901\ui-redesign\bento-glass"
FONT_CANVAS = r"C:\Users\Administrator\.workbuddy\skills\skill_2053081626394972160\canvas-fonts"
SYS = r"C:\Windows\Fonts"

def F(name, size):
    m = {
        "OutfitBold": os.path.join(FONT_CANVAS, "Outfit-Bold.ttf"),
        "GeistMono": os.path.join(FONT_CANVAS, "GeistMono-Bold.ttf"),
        "YaHeiBold": os.path.join(SYS, "msyhbd.ttc"),
        "YaHei": os.path.join(SYS, "msyh.ttc"),
    }
    return ImageFont.truetype(m[name], size)

pages = [
    ("onboarding_01_body.png", "01", "Onboarding · Body", "身体数据", (56,189,248)),
    ("onboarding_02_body_shape.png", "02", "Onboarding · Shape", "体态选择", (167,139,250)),
    ("onboarding_03_goal.png", "03", "Onboarding · Goal", "目标设置", (52,211,153)),
    ("onboarding_04_training.png", "04", "Onboarding · Training", "训练习惯", (167,139,250)),
    ("page_05_today.png", "05", "Today · Home", "今日推荐", (56,189,248)),
    ("page_06_nutrition_plan.png", "06", "Nutrition · Plan", "饮食推荐", (52,211,153)),
    ("page_07_nutrition_actual.png", "07", "Nutrition · Actual", "实际饮食", (251,113,133)),
    ("page_08_training_plan.png", "08", "Training · Plan", "训练推荐", (167,139,250)),
    ("page_09_training_actual.png", "09", "Training · Actual", "实际训练", (167,139,250)),
    ("page_10_adjustment.png", "10", "Adjustment", "动态调整", (251,191,36)),
    ("page_11_history.png", "11", "History", "历史趋势", (56,189,248)),
]

imgs = []
for fname, num, en, cn, col in pages:
    img = Image.open(os.path.join(OUT, fname)).convert("RGBA")
    imgs.append((img, num, en, cn, col))

scale = 0.36
ph = int(imgs[0][0].height * scale)
pw = int(imgs[0][0].width * scale)
cols = 4
rows = (len(imgs) + cols - 1) // cols
gap = 28
label_h = 70
pad = 50

total_w = cols * pw + (cols-1) * gap + pad*2
total_h = rows * (ph + label_h) + (rows-1) * gap + pad*2 + 90

bg = Image.new("RGBA", (total_w, total_h), (15,20,35,255))
d = ImageDraw.Draw(bg)
# 顶部渐变光
for y in range(120):
    a = int(40 * (1 - y/120))
    d.rectangle([0, y, total_w, y+1], fill=(56,189,248,a))

# 标题
d.text((pad, 32), "BENTO GLASS · FITNESS APP", font=F("OutfitBold", 28), fill=(241,245,249,255))
d.text((pad, 68), "11 Pages · Complete UI Redesign", font=F("GeistMono", 13), fill=(148,163,184,255))

for i, (img, num, en, cn, col) in enumerate(imgs):
    r, c = i // cols, i % cols
    scaled = img.resize((pw, ph), Image.LANCZOS)
    x = pad + c * (pw + gap)
    y = pad + 90 + r * (ph + label_h + gap)

    # 阴影
    sh = Image.new("RGBA", (pw+24, ph+24), (0,0,0,0))
    sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle([0,0,pw+23,ph+23], radius=26, fill=(col[0],col[1],col[2],30))
    sh = sh.filter(ImageFilter.GaussianBlur(radius=16))
    bg.paste(sh, (x-12, y-12), sh)
    bg.paste(scaled, (x, y), scaled)

    # 编号
    d.ellipse([x+10, y+10, x+38, y+38], fill=col+(255,))
    d.text((x+24, y+24), num, font=F("OutfitBold", 13), fill=(255,255,255,255), anchor="mm")

    # 标签
    ly = y + ph + 12
    d.text((x + pw//2, ly), en, font=F("GeistMono", 11), fill=(200,210,225,255), anchor="ma")
    d.text((x + pw//2, ly+18), cn, font=F("YaHeiBold", 13), fill=col+(255,), anchor="ma")

bg.save(os.path.join(OUT, "00_all_pages_overview.png"))
print(f"saved overview {total_w}x{total_h}")
