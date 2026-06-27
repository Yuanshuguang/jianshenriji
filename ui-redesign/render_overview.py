# -*- coding: utf-8 -*-
"""生成 5 套风格并排对比总览图"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

OUT = r"C:\Users\Administrator\.workbuddy\workspace\files\46340\b3ccd446-b1a6-4865-b5f8-df40a7de1901\ui-redesign"
FONT_CANVAS = r"C:\Users\Administrator\.workbuddy\skills\skill_2053081626394972160\canvas-fonts"
SYS = r"C:\Windows\Fonts"

def F(name, size):
    m = {
        "OutfitBold": os.path.join(FONT_CANVAS, "Outfit-Bold.ttf"),
        "Outfit": os.path.join(FONT_CANVAS, "Outfit-Regular.ttf"),
        "YaHeiBold": os.path.join(SYS, "msyhbd.ttc"),
        "YaHei": os.path.join(SYS, "msyh.ttc"),
        "DengXian": os.path.join(SYS, "Deng.ttf"),
        "GeistMono": os.path.join(FONT_CANVAS, "GeistMono-Bold.ttf"),
    }
    return ImageFont.truetype(m[name], size)

phones = [
    ("01_athletic_brutalism.png", "Athletic Brutalism", "竞技粗野", (255,90,31)),
    ("02_soft_gradient_wellness.png", "Soft Gradient Wellness", "柔和渐变康养", (255,138,91)),
    ("03_editorial_minimal.png", "Editorial Minimal", "编辑级极简", (67,56,202)),
    ("04_bento_glass.png", "Bento Glass", "便当玻璃", (56,189,248)),
    ("05_organic_earth.png", "Organic Earth", "有机大地", (200,96,44)),
]

imgs = []
for fname, en, cn, col in phones:
    img = Image.open(os.path.join(OUT, fname)).convert("RGBA")
    imgs.append((img, en, cn, col))

scale = 0.42
phone_h = int(imgs[0][0].height * scale)
phone_w = int(imgs[0][0].width * scale)
gap = 40
label_h = 80
pad = 60

total_w = len(imgs) * phone_w + (len(imgs)-1) * gap + pad*2
total_h = phone_h + label_h + pad * 2

# 深色背景
bg = Image.new("RGBA", (total_w, total_h), (22,20,28,255))
draw = ImageDraw.Draw(bg)

for i, (img, en, cn, col) in enumerate(imgs):
    scaled = img.resize((phone_w, phone_h), Image.LANCZOS)
    x = pad + i*(phone_w+gap)
    y = pad

    # 阴影
    sh = Image.new("RGBA", (phone_w+24, phone_h+24), (0,0,0,0))
    sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle([0,0,phone_w+23,phone_h+23], radius=26,
                        fill=(col[0],col[1],col[2],30))
    sh = sh.filter(ImageFilter.GaussianBlur(radius=18))
    bg.paste(sh, (x-12, y-12), sh)

    bg.paste(scaled, (x, y), scaled)

    # 编号圆
    draw.ellipse([x+10, y+10, x+36, y+36], fill=col+(255,))
    draw.text((x+23, y+23), str(i+1), font=F("OutfitBold",15),
              fill=(255,255,255,255), anchor="mm")

    # 标签
    ly = y + phone_h + 22
    draw.text((x+phone_w//2, ly), en, font=F("DengXian",14),
              fill=(230,230,240,255), anchor="ma")
    draw.text((x+phone_w//2, ly+20), cn, font=F("YaHeiBold",12),
              fill=col+(255,), anchor="ma")

# 底部标题
draw.text((total_w//2, total_h-36),
          "FITNESS APP  UI REDESIGN   5 STYLES",
          font=F("OutfitBold",18), fill=(160,160,175,255), anchor="mm",
          spacing=4)

bg.save(os.path.join(OUT, "00_comparison_overview.png"))
print(f"saved overview {total_w}x{total_h}")
