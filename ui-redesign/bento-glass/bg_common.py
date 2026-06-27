# -*- coding: utf-8 -*-
"""
Bento Glass · 通用渲染框架
所有页面共享的玻璃质感、字体、配色、组件原语。
"""
import math, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ============ 字体 ============
FONT_CANVAS = r"C:\Users\Administrator\.workbuddy\skills\skill_2053081626394972160\canvas-fonts"
SYS = r"C:\Windows\Fonts"

def F(name, size):
    m = {
        "OutfitBold": os.path.join(FONT_CANVAS, "Outfit-Bold.ttf"),
        "Outfit": os.path.join(FONT_CANVAS, "Outfit-Regular.ttf"),
        "GeistMonoBold": os.path.join(FONT_CANVAS, "GeistMono-Bold.ttf"),
        "GeistMono": os.path.join(FONT_CANVAS, "GeistMono-Regular.ttf"),
        "Jura": os.path.join(FONT_CANVAS, "Jura-Medium.ttf"),
        "JuraLight": os.path.join(FONT_CANVAS, "Jura-Light.ttf"),
        "YaHeiBold": os.path.join(SYS, "msyhbd.ttc"),
        "YaHei": os.path.join(SYS, "msyh.ttc"),
        "YaHeiLight": os.path.join(SYS, "msyhl.ttc"),
        "DengXian": os.path.join(SYS, "Deng.ttf"),
    }
    return ImageFont.truetype(m[name], size)

# ============ Token ============
C = {
    "bg": (11,17,32,255),
    "bgGlow": (19,28,48,255),
    "glass": (255,255,255,16),
    "glassRaised": (255,255,255,24),
    "glassBorder": (255,255,255,32),
    "glassBorderBright": (255,255,255,52),
    "ink": (241,245,249,255),
    "inkMute": (148,163,184,255),
    "inkFaint": (100,116,139,255),
    "accent": (56,189,248,255),
    "accent2": (167,139,250,255),
    "positive": (52,211,153,255),
    "warn": (251,113,133,255),
    "amber": (251,191,36,255),
}
RADIUS = {"sm":8, "md":12, "lg":18, "xl":22, "pill":999}
SP = {1:4,2:8,3:12,4:16,5:20,6:24,8:32,10:40}
W, H = 390, 844
OUT = r"C:\Users\Administrator\.workbuddy\workspace\files\46340\b3ccd446-b1a6-4865-b5f8-df40a7de1901\ui-redesign\bento-glass"

def text(draw, xy, s, font, fill, anchor=None, ls=None):
    if ls:
        x, y = xy
        for ch in s:
            draw.text((x, y), ch, font=font, fill=fill, anchor=None)
            bbox = font.getbbox(ch)
            x += (bbox[2]-bbox[0]) + ls
    else:
        draw.text(xy, s, font=font, fill=fill, anchor=anchor)

def rrect(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def vgradient(size, c1, c2):
    w, h = size
    base = Image.new("RGBA", size, c1)
    top = Image.new("RGBA", size, c2)
    mask = Image.new("L", size)
    md = mask.load()
    for i in range(h):
        v = int(255 * i / max(1,h-1))
        for j in range(w):
            md[j, i] = v
    base.paste(top, (0,0), mask)
    return base

def glass_tile(base_img, box, radius=22, raised=False, glow=None, glow_strength=8):
    """在 base_img 上画一块毛玻璃卡片。glow=(r,g,b,a) 卡片辉光色。"""
    x0,y0,x1,y1 = box
    w,h = x1-x0, y1-y0
    fill = C["glassRaised"] if raised else C["glass"]
    border = C["glassBorderBright"] if raised else C["glassBorder"]

    # 辉光层
    if glow:
        gc = glow
        gs = glow_strength
        glayer = Image.new("RGBA", (w+gs*4, h+gs*4), (0,0,0,0))
        gd = ImageDraw.Draw(glayer)
        gd.rounded_rectangle([gs*2,gs*2,gs*2+w-1,gs*2+h-1], radius=radius, fill=(gc[0],gc[1],gc[2],50))
        glayer = glayer.filter(ImageFilter.GaussianBlur(gs))
        base_img.alpha_composite(glayer, (x0-gs*2, y0-gs*2))

    # 卡片本体
    tile = Image.new("RGBA", (w,h), (0,0,0,0))
    td = ImageDraw.Draw(tile)
    td.rounded_rectangle([0,0,w-1,h-1], radius=radius, fill=fill)
    # 顶光渐变（上亮下暗，模拟玻璃折光）
    top_glow = vgradient((w, max(1,h//2)), (255,255,255,22), (255,255,255,0))
    tile.paste(top_glow, (0,0), top_glow)
    # 描边
    td.rounded_rectangle([0,0,w-1,h-1], radius=radius, outline=border, width=1)
    base_img.alpha_composite(tile, (x0,y0))

def progress_ring(draw, cx, cy, r, pct, stroke=10, color=None, track=None):
    """绘制进度环。pct 0~1。color 为渐变(青蓝→紫罗兰)。"""
    track_c = track or (255,255,255,20)
    draw.ellipse([cx-r,cy-r,cx+r,cy+r], outline=track_c, width=stroke)
    if pct <= 0: return
    steps = max(1, int(360*pct/4))
    for i in range(steps):
        t0 = -90 - 360*pct*i/steps
        t1 = -90 - 360*pct*(i+1)/steps
        if color:
            col = color
        else:
            # 渐变 accent → accent2
            col = (int(56+(167-56)*i/steps), int(189+(139-189)*i/steps), int(248+(250-248)*i/steps), 255)
        draw.arc([cx-r,cy-r,cx+r,cy+r], t0, t1, fill=col, width=stroke)

def progress_bar(draw, box, pct, color, track=(255,255,255,20), height=6):
    """绘制进度条。box=[x0,y0,x1,y1]"""
    x0,y0,x1,y1 = box
    draw.rounded_rectangle([x0,y0,x1,y0+height], RADIUS["pill"], fill=track)
    if pct > 0:
        draw.rounded_rectangle([x0,y0,x0+int((x1-x0)*min(1,pct)),y0+height], RADIUS["pill"], fill=color)

def label_uc(draw, xy, s, fill=None, ls=1.0, size=10):
    """全大写标签"""
    f = F("GeistMono", size)
    text(draw, xy, s.upper(), f, fill or C["inkMute"], ls=ls)

def phone_frame(content_img, bezel=11, frame_color=(8,12,24)):
    w,h = content_img.size
    fw,fh = w+bezel*2, h+bezel*2
    frame = Image.new("RGBA", (fw,fh), (0,0,0,0))
    fd = ImageDraw.Draw(frame)
    fd.rounded_rectangle([0,0,fw-1,fh-1], radius=46, fill=frame_color)
    frame.paste(content_img, (bezel,bezel), content_img if content_img.mode=="RGBA" else None)
    return frame

def new_canvas():
    """新建深空渐变背景画布"""
    bg = vgradient((W,H), C["bg"], C["bgGlow"])
    return bg.copy()

def status_bar(draw):
    """顶部状态栏"""
    draw.text((22,16), "9:41", font=F("GeistMono",13), fill=C["ink"])
    draw.text((W-22,16), "●●●", font=F("GeistMono",12), fill=C["accent"], anchor="ra")

def tab_bar(base_img, active=0):
    """底部浮玻璃 Tab Bar"""
    y = H - 70
    glass_tile(base_img, [16, y, W-16, H-12], radius=20, raised=True)
    draw = ImageDraw.Draw(base_img)
    tabs = [("今日",C["accent"]),("饮食",C["inkMute"]),("训练",C["inkMute"]),("更多",C["inkMute"])]
    for i,(t,col) in enumerate(tabs):
        tx = 16 + 20 + i*((W-32-40)//4) + (W-32-40)//8
        draw.text((tx, y+22), t, font=F("YaHeiBold",11), fill=col, anchor="ma")
        if i==active:
            draw.ellipse([tx-3, y+40, tx+3, y+46], fill=C["accent"])

def page_header(draw, date_str, title, subtitle=None, badge=None):
    """标准页面头部"""
    label_uc(draw, (20, 48), date_str, ls=1.5)
    draw.text((20, 62), title, font=F("OutfitBold", 26), fill=C["ink"])
    if subtitle:
        draw.text((20, 96), subtitle, font=F("YaHei", 12), fill=C["inkMute"])
    if badge:
        # 右上角徽章
        bw, bh = 76, 28
        bx, by = W-20-bw, 56
        glass_tile(draw._image if hasattr(draw,'_image') else None, [bx,by,bx+bw,by+bh], radius=14,
                   fill_color=(badge.get("color",C["positive"])[:3]+(28,)))

def save(img, name):
    path = os.path.join(OUT, name)
    framed = phone_frame(img)
    framed.save(path)
    print(f"saved {name}")
    return path

print("bento glass framework loaded")
