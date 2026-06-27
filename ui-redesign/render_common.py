# -*- coding: utf-8 -*-
"""
健身 APP 五套 UI 风格渲染器
渲染「今日推荐首页」在五种当代风格下的高保真手机效果图。
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ============ 字体 ============
FONT_DIR_CANVAS = r"C:\Users\Administrator\.workbuddy\skills\skill_2053081626394972160\canvas-fonts"
SYS_FONT_DIR = r"C:\Windows\Fonts"

def F(name, size):
    """加载字体，优先 canvas-fonts，其次系统 CJK 字体。"""
    candidates = {
        # 英文 / 数字字体
        "BigShoulders": os.path.join(FONT_DIR_CANVAS, "BigShoulders-Bold.ttf"),
        "BigShouldersReg": os.path.join(FONT_DIR_CANVAS, "BigShoulders-Regular.ttf"),
        "Outfit": os.path.join(FONT_DIR_CANVAS, "Outfit-Bold.ttf"),
        "OutfitReg": os.path.join(FONT_DIR_CANVAS, "Outfit-Regular.ttf"),
        "InstrumentSans": os.path.join(FONT_DIR_CANVAS, "InstrumentSans-Bold.ttf"),
        "InstrumentSansReg": os.path.join(FONT_DIR_CANVAS, "InstrumentSans-Regular.ttf"),
        "InstrumentSerif": os.path.join(FONT_DIR_CANVAS, "InstrumentSerif-Regular.ttf"),
        "Jura": os.path.join(FONT_DIR_CANVAS, "Jura-Medium.ttf"),
        "JuraLight": os.path.join(FONT_DIR_CANVAS, "Jura-Light.ttf"),
        "GeistMonoBold": os.path.join(FONT_DIR_CANVAS, "GeistMono-Bold.ttf"),
        "GeistMono": os.path.join(FONT_DIR_CANVAS, "GeistMono-Bold.ttf"),
        "GeistMonoReg": os.path.join(FONT_DIR_CANVAS, "GeistMono-Regular.ttf"),
        "WorkSans": os.path.join(FONT_DIR_CANVAS, "WorkSans-Bold.ttf"),
        "WorkSansReg": os.path.join(FONT_DIR_CANVAS, "WorkSans-Regular.ttf"),
        "Bricolage": os.path.join(FONT_DIR_CANVAS, "BricolageGrotesque-Bold.ttf"),
        "BricolageReg": os.path.join(FONT_DIR_CANVAS, "BricolageGrotesque-Regular.ttf"),
        "Tektur": os.path.join(FONT_DIR_CANVAS, "Tektur-Medium.ttf"),
        # CJK
        "YaHei": os.path.join(SYS_FONT_DIR, "msyh.ttc"),
        "YaHeiBold": os.path.join(SYS_FONT_DIR, "msyhbd.ttc"),
        "YaHeiLight": os.path.join(SYS_FONT_DIR, "msyhl.ttc"),
        "SimHei": os.path.join(SYS_FONT_DIR, "simhei.ttf"),
        "DengXian": os.path.join(SYS_FONT_DIR, "Deng.ttf"),
        "DengXianBold": os.path.join(SYS_FONT_DIR, "Dengb.ttf"),
        "HanSerifHeavy": os.path.join(SYS_FONT_DIR, "Source Han Serif SC Heavy (TrueType).ttf"),
    }
    return ImageFont.truetype(candidates[name], size)

# ============ 通用绘制 ============
def text(draw, xy, s, font, fill, anchor=None, spacing=0, ls=None):
    """带可选字距的文本绘制。ls=letter spacing px。"""
    if ls:
        x, y = xy
        for ch in s:
            draw.text((x, y), ch, font=font, fill=fill, anchor=None)
            bbox = font.getbbox(ch)
            w = bbox[2] - bbox[0]
            x += w + ls
    else:
        draw.text(xy, s, font=font, fill=fill, anchor=anchor, spacing=spacing)

def text_w(s, font):
    bbox = font.getbbox(s)
    return bbox[2] - bbox[0]

def rrect(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def vgradient(size, c1, c2, vertical=True):
    """生成垂直/水平渐变。c1,c2 为 (r,g,b) 或 (r,g,b,a)。"""
    w, h = size
    base = Image.new("RGBA", size, c1)
    top = Image.new("RGBA", size, c2)
    mask = Image.new("L", size)
    md = mask.load()
    for i in range(h if vertical else w):
        t = i / max(1, (h-1 if vertical else w-1))
        v = int(255 * t)
        if vertical:
            for j in range(w):
                md[j, i] = v
        else:
            for j in range(h):
                md[i, j] = v
    base.paste(top, (0, 0), mask)
    return base

def lgradient(size, c1, c2):
    return vgradient(size, c1, c2, vertical=False)

# ============ 手机外框 ============
def phone_frame(content_img, frame_color=(10,10,12), bezel=10):
    """给内容图加手机外框（深色边 + 圆角）。返回带框图。"""
    w, h = content_img.size
    fw, fh = w + bezel*2, h + bezel*2
    frame = Image.new("RGBA", (fw, fh), (0,0,0,0))
    fd = ImageDraw.Draw(frame)
    fd.rounded_rectangle([0,0,fw-1,fh-1], radius=44, fill=frame_color)
    frame.paste(content_img, (bezel, bezel), content_img if content_img.mode=="RGBA" else None)
    return frame

# ============ 内容数据（五套共用）============
DATA = {
    "date": "6月23日 周二",
    "title": "今日",
    "target_cal": 1650,
    "actual_cal": 980,
    "burn_cal": 2150,
    "remaining": 670,
    "protein_c": 78, "protein_t": 118,
    "fat_c": 28, "fat_t": 43,
    "carbs_c": 102, "carbs_t": 165,
    "breakfast": [("鸡蛋", "2 个"), ("牛奶", "300ml"), ("香蕉", "1 根")],
    "lunch": [("米饭", "180g"), ("鸡胸肉", "180g")],
    "dinner": [("米饭", "120g"), ("鸡胸肉", "150g")],
    "breakfast_kcal": 320,
    "lunch_kcal": 480,
    "dinner_kcal": 360,
    "workout": "背部 + 轻有氧",
    "workout_items": [("高位下拉", "4×10"), ("坐姿划船", "4×10"), ("哑铃划船", "3×12"), ("跑步机快走", "20min")],
    "workout_burn": "330–430 kcal",
    "adjust": "明日计划已根据今日多摄入调整",
}

W, H = 390, 844
OUT = r"C:\Users\Administrator\.workbuddy\workspace\files\46340\b3ccd446-b1a6-4865-b5f8-df40a7de1901\ui-redesign"
os.makedirs(OUT, exist_ok=True)

print("renderer loaded")
