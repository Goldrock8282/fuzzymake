#!/usr/bin/env python3
"""
Fuzzy Wire Tutorial Image Generator

Görsellerdeki stil (pastel renkler, 6 adımlı infografik düzeni, Polaroid fotoğraf
çerçevesi, dekoratif elementler) ile yeni çiçek türleri için otomatik tutorial
görseli üretir.

Kullanım:
    python generator.py rose
    python generator.py sunflower --output gunes_cicegi.png
    python generator.py dahlia
    python generator.py lily
    python generator.py --list
    python generator.py --all
"""

import argparse
import math
import os
import sys
from dataclasses import dataclass, field
from typing import Optional

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow gerekli: pip install Pillow")

# ─────────────────────────────────────────────────────────────────────────────
# Sabitler
# ─────────────────────────────────────────────────────────────────────────────

W, H = 720, 980
STEP_COLS = 2
STEP_ROWS = 3
HEADER_H = 235

# ─────────────────────────────────────────────────────────────────────────────
# Renk Temaları
# ─────────────────────────────────────────────────────────────────────────────

THEMES: dict[str, dict] = {
    "rose": {
        "bg_top":      (252, 215, 218),
        "bg_bottom":   (255, 250, 250),
        "primary":     (186, 80, 105),
        "circle":      (172, 68,  92),
        "step_bg":     (255, 246, 248),
        "step_border": (238, 210, 220),
        "title":       (148, 60,  85),
        "subtitle":    (172, 100, 118),
        "tagline":     (148, 60,  85),
        "dark":        (80,  45,  58),
        "deco":        (220, 150, 170),
        "muted":       (200, 155, 168),
        "wire":        [(235, 175, 190), (210, 125, 150), (140, 175, 140), (90, 90, 90)],
    },
    "sunflower": {
        "bg_top":      (255, 245, 205),
        "bg_bottom":   (255, 252, 232),
        "primary":     (185, 135,  25),
        "circle":      (158, 110,  15),
        "step_bg":     (255, 251, 228),
        "step_border": (240, 225, 178),
        "title":       (138, 100,  18),
        "subtitle":    (172, 130,  32),
        "tagline":     (138, 100,  18),
        "dark":        (68,  52,   18),
        "deco":        (218, 178,  68),
        "muted":       (195, 165,  80),
        "wire":        [(240, 200, 50), (190, 140, 25), (140, 175, 140), (100, 60, 30), (90, 90, 90)],
    },
    "lily": {
        "bg_top":      (250, 222, 228),
        "bg_bottom":   (255, 252, 253),
        "primary":     (175, 110, 135),
        "circle":      (160,  95, 118),
        "step_bg":     (255, 248, 250),
        "step_border": (238, 212, 222),
        "title":       (138,  84, 108),
        "subtitle":    (162, 108, 128),
        "tagline":     (138,  84, 108),
        "dark":        (75,   48,  60),
        "deco":        (210, 158, 175),
        "muted":       (190, 150, 165),
        "wire":        [(255, 255, 255), (235, 170, 185), (238, 215, 90), (140, 175, 140), (90, 90, 90)],
    },
    "dahlia": {
        "bg_top":      (252, 210, 225),
        "bg_bottom":   (255, 248, 252),
        "primary":     (208,  82, 128),
        "circle":      (192,  68, 112),
        "step_bg":     (255, 244, 248),
        "step_border": (240, 200, 220),
        "title":       (164,  58, 100),
        "subtitle":    (190,  85, 125),
        "tagline":     (164,  58, 100),
        "dark":        (85,   42,  65),
        "deco":        (228, 148, 178),
        "muted":       (205, 148, 175),
        "wire":        [(235, 140, 175), (210, 100, 145), (180, 68, 120), (140, 175, 140), (90, 90, 90)],
    },
    "lavender": {
        "bg_top":      (235, 225, 250),
        "bg_bottom":   (248, 245, 255),
        "primary":     (130,  90, 185),
        "circle":      (115,  75, 168),
        "step_bg":     (248, 245, 255),
        "step_border": (218, 208, 240),
        "title":       (105,  65, 160),
        "subtitle":    (130,  95, 185),
        "tagline":     (105,  65, 160),
        "dark":        (60,   40,  90),
        "deco":        (190, 165, 225),
        "muted":       (170, 148, 210),
        "wire":        [(200, 175, 235), (160, 120, 210), (140, 175, 140), (90, 90, 90)],
    },
    "tulip": {
        "bg_top":      (255, 220, 215),
        "bg_bottom":   (255, 250, 248),
        "primary":     (210,  75,  75),
        "circle":      (192,  60,  60),
        "step_bg":     (255, 245, 244),
        "step_border": (240, 205, 202),
        "title":       (175,  55,  55),
        "subtitle":    (200,  85,  85),
        "tagline":     (175,  55,  55),
        "dark":        (85,   38,  38),
        "deco":        (230, 155, 148),
        "muted":       (210, 140, 135),
        "wire":        [(240, 150, 145), (215, 100, 95), (140, 175, 140), (90, 90, 90)],
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# Çiçek Konfigürasyonları
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class FlowerConfig:
    name: str
    theme: str
    tag1: str
    tag2: str
    subtitle: str
    finish_msg: str
    materials: list
    petal_desc: str
    petal_count: str
    step3_name: str
    step3_desc: str
    step3_layers: list
    step4_desc: str
    step5_desc: str
    extra_note: str = ""


FLOWERS: dict[str, FlowerConfig] = {
    "rose": FlowerConfig(
        name="Rose",
        theme="rose",
        tag1="classic", tag2="elegant",
        subtitle="A timeless rose you can make!",
        finish_msg="Your rose is\nready to\nbloom!",
        materials=["Pink fuzzy wires", "Green fuzzy wires", "Floral wire", "Floral tape", "Scissors"],
        petal_desc="Fold the pink fuzzy wire\ninto a loop, twist the base.",
        petal_count="Make 10-12 petals.",
        step3_name="LAYERING",
        step3_desc="Layer petals from small to large,\nstaggering each layer to\ncreate a full bloom.",
        step3_layers=["Small inner layer", "Medium middle layer", "Large outer layer"],
        step4_desc="Attach each layer of petals\naround the center, shaping\nas you go.\nKeep adjusting for fullness!",
        step5_desc="Wrap the stem with green\nfloral tape. Add leaves\nusing green fuzzy wire,\ntwist and shape.",
    ),
    "sunflower": FlowerConfig(
        name="Sunflower",
        theme="sunflower",
        tag1="bright", tag2="happy",
        subtitle="A little sunshine you can make!",
        finish_msg="Your sunflower\nis ready to\nbrighten\nany day!",
        materials=["Yellow fuzzy wires", "Brown fuzzy wires", "Green fuzzy wires",
                   "Floral wire", "Floral tape", "Scissors"],
        petal_desc="Fold the yellow fuzzy wire\ninto a loop, twist the base.",
        petal_count="Make 12-16 petals.",
        step3_name="CENTER",
        step3_desc="Cut brown wires into short pieces,\ntwist onto a floral wire base\nto form a full center.",
        step3_layers=[],
        step4_desc="Attach each petal around\nthe center, layer by layer\nuntil it looks full and natural.",
        step5_desc="Wrap the stem with green tape.\nMake leaves with green fuzzy\nwire, twist and shape.\nAttach leaves to the stem.",
    ),
    "lily": FlowerConfig(
        name="Lily",
        theme="lily",
        tag1="elegant", tag2="soft",
        subtitle="Simple steps to create a blooming lily!",
        finish_msg="Your lily is\nready to\nbloom!",
        materials=["White fuzzy wires", "Pink fuzzy wires", "Yellow fuzzy wires",
                   "Green fuzzy wires", "Floral wire", "Floral tape", "Scissors"],
        petal_desc="Fold the white fuzzy wire\ninto a petal shape, twist\nthe base.",
        petal_count="Make 6 petals.",
        step3_name="LAYERING",
        step3_desc="Layer the petals in a staggered\narrangement for a full bloom.",
        step3_layers=["First layer: 3 petals", "Second layer: 3 petals\n(staggered)"],
        step4_desc="Attach the stamen in the center,\nthen secure the layered\npetals around it.",
        step5_desc="Wrap the stem with green tape.\nAdd leaves using green fuzzy\nwire, twist and shape.",
    ),
    "dahlia": FlowerConfig(
        name="Dahlia",
        theme="dahlia",
        tag1="simple", tag2="fluffy",
        subtitle="Let's bloom something wonderful!",
        finish_msg="Your Dahlia\nis ready to\nbloom!",
        materials=["Pink fuzzy wires", "Green fuzzy wires", "Floral wire", "Floral tape", "Scissors"],
        petal_desc="Fold the pink fuzzy wire\ninto a loop, twist the base.",
        petal_count="Make 18-24 petals.",
        step3_name="LAYERING",
        step3_desc="Sort petals by size for\na full and natural bloom.",
        step3_layers=["Large outer layer", "Medium middle layer", "Small inner layer"],
        step4_desc="Attach petals layer by layer,\nrotating as you go.\nKeep adding for fullness!",
        step5_desc="Wrap the stem with green\nfloral tape. Add leaves\nusing green fuzzy wire.",
        extra_note="fluffy\n& soft",
    ),
    "lavender": FlowerConfig(
        name="Lavender",
        theme="lavender",
        tag1="calming", tag2="delicate",
        subtitle="A soothing bloom you can make!",
        finish_msg="Your lavender\nis ready to\nrelax you!",
        materials=["Purple fuzzy wires", "Lilac fuzzy wires", "Green fuzzy wires",
                   "Floral wire", "Floral tape", "Scissors"],
        petal_desc="Cut purple fuzzy wire into\nshort pieces, fold and\ntwist around floral wire.",
        petal_count="Make 5-7 stem clusters.",
        step3_name="CLUSTERING",
        step3_desc="Group small buds tightly\nalong the stem to create\na full lavender spike.",
        step3_layers=["Tip buds (smallest)", "Middle section", "Base buds (largest)"],
        step4_desc="Attach bud clusters along\nthe stem from top to bottom,\ngradually increasing size.",
        step5_desc="Wrap with green floral tape.\nAdd long narrow leaves\nusing green fuzzy wire.",
    ),
    "tulip": FlowerConfig(
        name="Tulip",
        theme="tulip",
        tag1="bold", tag2="graceful",
        subtitle="A classic tulip you can make!",
        finish_msg="Your tulip is\nready to\nshine!",
        materials=["Red fuzzy wires", "Green fuzzy wires", "Floral wire", "Floral tape", "Scissors"],
        petal_desc="Fold the red fuzzy wire\ninto a cup shape, curve\nthe edges gently.",
        petal_count="Make 6 petals.",
        step3_name="LAYERING",
        step3_desc="Layer 3 inner petals,\nthen add 3 outer petals\naround them.",
        step3_layers=["3 inner petals", "3 outer petals"],
        step4_desc="Cup the petals upward\naround the center,\nshaping as you go.",
        step5_desc="Wrap the long stem with\ngreen floral tape. Add\nbroad leaves using green\nfuzzy wire.",
    ),
}

# ─────────────────────────────────────────────────────────────────────────────
# Font Yardımcıları
# ─────────────────────────────────────────────────────────────────────────────

_FONT_PATHS = {
    "regular":      "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "bold":         "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "italic":       "/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf",
    "bold_italic":  "/usr/share/fonts/truetype/liberation/LiberationSans-BoldItalic.ttf",
    "serif":        "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
    "serif_bold":   "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
    "serif_italic": "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf",
}

_font_cache: dict = {}


def font(style: str = "regular", size: int = 14) -> ImageFont.FreeTypeFont:
    key = (style, size)
    if key not in _font_cache:
        path = _FONT_PATHS.get(style, _FONT_PATHS["regular"])
        if os.path.exists(path):
            _font_cache[key] = ImageFont.truetype(path, size)
        else:
            _font_cache[key] = ImageFont.load_default()
    return _font_cache[key]


def txt_size(draw: ImageDraw.ImageDraw, text: str, fnt) -> tuple[int, int]:
    bb = draw.textbbox((0, 0), text, font=fnt)
    return bb[2] - bb[0], bb[3] - bb[1]


def draw_text_centered(draw, cx, y, text, fnt, fill):
    w, h = txt_size(draw, text, fnt)
    draw.text((cx - w // 2, y), text, font=fnt, fill=fill)
    return h


# ─────────────────────────────────────────────────────────────────────────────
# Çizim Primitifleri
# ─────────────────────────────────────────────────────────────────────────────

def draw_gradient_bg(img: Image.Image, theme: dict) -> None:
    draw = ImageDraw.Draw(img)
    top, bot = theme["bg_top"], theme["bg_bottom"]
    for y in range(H):
        t = y / H
        color = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3))
        draw.line([(0, y), (W, y)], fill=color)


def draw_sparkle(draw, cx, cy, size, color, width=2):
    s = size
    draw.line([(cx - s, cy), (cx + s, cy)], fill=color, width=width)
    draw.line([(cx, cy - s), (cx, cy + s)], fill=color, width=width)
    d = int(s * 0.55)
    draw.line([(cx - d, cy - d), (cx + d, cy + d)], fill=color, width=1)
    draw.line([(cx - d, cy + d), (cx + d, cy - d)], fill=color, width=1)


def draw_heart(draw, cx, cy, size, color):
    pts = []
    for i in range(360):
        a = math.radians(i)
        x = size * (16 * math.sin(a) ** 3) / 16
        y = -size * (13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a)) / 16
        pts.append((cx + x, cy + y))
    draw.polygon(pts, fill=color)


def draw_step_circle(draw, cx, cy, r, num, theme):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=theme["circle"])
    fnt = font("bold", 15)
    txt = str(num)
    w, h = txt_size(draw, txt, fnt)
    draw.text((cx - w // 2, cy - h // 2), txt, font=fnt, fill="white")


def draw_dashed_line(draw, x1, y1, x2, y2, color, dash=6, gap=4, width=1):
    dx, dy = x2 - x1, y2 - y1
    length = math.hypot(dx, dy)
    if length == 0:
        return
    ux, uy = dx / length, dy / length
    pos, drawing = 0.0, True
    while pos < length:
        end = min(pos + (dash if drawing else gap), length)
        if drawing:
            draw.line(
                [(x1 + ux * pos, y1 + uy * pos), (x1 + ux * end, y1 + uy * end)],
                fill=color, width=width,
            )
        pos = end
        drawing = not drawing


def darker(color: tuple, amount: int = 30) -> tuple:
    return tuple(max(0, c - amount) for c in color)


def lighter(color: tuple, amount: int = 25) -> tuple:
    return tuple(min(255, c + amount) for c in color)


# ─────────────────────────────────────────────────────────────────────────────
# Polaroid Çerçeve
# ─────────────────────────────────────────────────────────────────────────────

def draw_polaroid(draw, x, y, w, h, theme):
    tape_color = (205, 190, 175)
    draw.rectangle([x + w // 2 - 22, y - 9, x + w // 2 + 22, y + 9], fill=tape_color)

    # Gölge
    draw.rectangle([x + 4, y + 4, x + w + 4, y + h + 4], fill=(200, 195, 192))
    # Beyaz çerçeve
    draw.rectangle([x, y, x + w, y + h], fill=(255, 255, 255))

    # İç resim alanı
    pad, bot_pad = 8, 26
    inner = [x + pad, y + pad, x + w - pad, y + h - bot_pad]
    draw.rectangle(inner, fill=lighter(theme["bg_top"], 15))

    # Basit çiçek silueti
    icx = (inner[0] + inner[2]) // 2
    icy = (inner[1] + inner[3]) // 2
    r = min(inner[2] - inner[0], inner[3] - inner[1]) // 3
    petal_col = theme["wire"][0]
    center_col = theme["wire"][1] if len(theme["wire"]) > 1 else darker(petal_col, 20)

    for i in range(6):
        a = math.radians(i * 60)
        px = icx + int(r * 0.75 * math.cos(a))
        py = icy + int(r * 0.75 * math.sin(a))
        pr = r // 2
        draw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=petal_col)

    cr = r // 3
    draw.ellipse([icx - cr, icy - cr, icx + cr, icy + cr], fill=center_col)

    # Yeşil sap
    draw.line([(icx, icy + cr), (icx, inner[3])], fill=(120, 160, 120), width=3)


# ─────────────────────────────────────────────────────────────────────────────
# Adım İllüstrasyonları
# ─────────────────────────────────────────────────────────────────────────────

def illus_materials(draw, x, y, w, h, cfg: FlowerConfig, theme: dict):
    cx = x + w // 2
    colors = theme["wire"]
    bar_h, bar_w = 7, int(w * 0.42)
    bx = cx - bar_w // 2 - 18

    for i, col in enumerate(colors):
        by = y + 8 + i * (bar_h + 4)
        for j in range(3):
            draw.rounded_rectangle(
                [bx + j * 2, by + j, bx + bar_w + j * 2, by + bar_h + j],
                radius=3, fill=col, outline=darker(col, 20), width=1,
            )

    # Bant rulosu
    tr_cx = bx + bar_w + 30
    tr_cy = y + (len(colors) * (bar_h + 4)) // 2 + 4
    tr_r = 20
    draw.ellipse([tr_cx - tr_r, tr_cy - tr_r, tr_cx + tr_r, tr_cy + tr_r],
                 fill=(80, 108, 80), outline=(60, 88, 60), width=2)
    draw.ellipse([tr_cx - tr_r + 6, tr_cy - tr_r + 6, tr_cx + tr_r - 6, tr_cy + tr_r - 6],
                 fill=(100, 130, 100))

    # Çiçek teli
    wire_y = y + len(colors) * (bar_h + 4) + 14
    for i in range(3):
        wx = bx + i * 9
        draw.line([(wx, wire_y), (wx + 3, wire_y + 32)], fill=(50, 50, 50), width=2)


def illus_petal_forming(draw, x, y, w, h, cfg: FlowerConfig, theme: dict):
    col = theme["wire"][0]
    cx = x + w // 2

    # U şekli (kıvrılmış tel)
    ux, uy, ur = x + 28, y + 16, 18
    draw.arc([ux - ur, uy, ux + ur, uy + ur * 2], start=0, end=180, fill=col, width=5)
    draw.line([(ux - ur, uy + ur), (ux - ur, uy + 2)], fill=col, width=5)
    draw.line([(ux + ur, uy + ur), (ux + ur, uy + 2)], fill=col, width=5)

    # Ok
    ax = ux + ur + 10
    ay = uy + ur
    draw.line([(ax, ay), (ax + 18, ay)], fill=theme["muted"], width=2)
    draw.polygon([(ax + 16, ay - 4), (ax + 24, ay), (ax + 16, ay + 4)], fill=theme["muted"])

    # Taç yaprakları (5 adet teardrop)
    px_start = ax + 30
    pw, ph = 14, 46
    for i in range(5):
        px = px_start + i * 22
        draw.ellipse([px, y + 4, px + pw, y + ph],
                     fill=col, outline=darker(col, 25), width=1)
        for j in range(3):
            ty = y + ph - 14 + j * 4
            draw.line([(px + 2, ty), (px + pw - 2, ty)], fill=darker(col, 35), width=1)


def illus_layering(draw, x, y, w, h, cfg: FlowerConfig, theme: dict):
    col = theme["wire"][0]
    cx = x + w // 2

    if cfg.step3_name == "CENTER":
        # Ayçiçeği merkezi
        brown = theme["wire"][3] if len(theme["wire"]) > 3 else (100, 60, 30)
        ccy = y + 38

        # Halka
        ring_r = 24
        for i in range(12):
            a = math.radians(i * 30)
            sx = cx - 28 + int(ring_r * math.cos(a))
            sy = ccy + int(ring_r * math.sin(a))
            draw.line([(sx, sy), (sx + int(7 * math.cos(a)), sy + int(7 * math.sin(a)))],
                      fill=brown, width=4)
        draw.ellipse([cx - 28 - ring_r, ccy - ring_r, cx - 28 + ring_r, ccy + ring_r],
                     outline=brown, width=2)

        # Top (dolu merkez)
        bcx, bcy, br = cx + 42, ccy, 22
        draw.ellipse([bcx - br, bcy - br, bcx + br, bcy + br],
                     fill=brown, outline=darker(brown, 20), width=2)
        for i in range(7):
            a = math.radians(i * 51)
            sx = bcx + int((br - 6) * math.cos(a))
            sy = bcy + int((br - 6) * math.sin(a))
            draw.ellipse([sx - 3, sy - 3, sx + 3, sy + 3], fill=darker(brown, 15))
    else:
        # Katmanlı yapraklar (3 katman)
        layer_cols = [darker(col, 30), col, lighter(col, 20)]
        for li, (ly_off, lcol) in enumerate(zip([0, 22, 42], layer_cols)):
            ly = y + ly_off
            count = max(3, 5 - li)
            pw, ph = 15, 34
            total = count * (pw + 4)
            lx = cx - total // 2
            for pi in range(count):
                px = lx + pi * (pw + 4)
                draw.ellipse([px, ly, px + pw, ly + ph],
                             fill=lcol, outline=darker(lcol, 20), width=1)

        # Katman etiketleri
        if cfg.step3_layers:
            lbl_fnt = font("regular", 9)
            for li, lbl in enumerate(cfg.step3_layers[:3]):
                lly = y + li * 22 + 8
                draw_dashed_line(draw, cx + 38, lly + 6, cx + 52, lly + 6,
                                 theme["muted"], dash=4, gap=3)
                draw.text((cx + 54, lly - 1), lbl.split("\n")[0], font=lbl_fnt, fill=theme["dark"])


def illus_assembly(draw, x, y, w, h, cfg: FlowerConfig, theme: dict):
    col = theme["wire"][0]
    ctr = theme["wire"][1] if len(theme["wire"]) > 1 else darker(col, 20)
    green = (120, 158, 120)
    cx = x + w // 2

    def simple_flower(fcx, fcy, radius, petals, stem_len=0):
        if stem_len:
            draw.line([(fcx, fcy + radius), (fcx, fcy + radius + stem_len)], fill=green, width=4)
        for i in range(petals):
            a = math.radians(i * (360 / petals))
            px = fcx + int(radius * 0.72 * math.cos(a))
            py = fcy + int(radius * 0.72 * math.sin(a))
            pr = radius // 2
            draw.ellipse([px - pr, py - pr, px + pr, py + pr],
                         fill=col, outline=darker(col, 20), width=1)
        cr = radius // 3
        draw.ellipse([fcx - cr, fcy - cr, fcx + cr, fcy + cr], fill=ctr)

    bud_cx, bud_cy = cx - 44, y + 42
    simple_flower(bud_cx, bud_cy, 18, 5, stem_len=28)

    draw.line([(cx - 18, bud_cy), (cx + 6, bud_cy)], fill=theme["muted"], width=2)
    draw.polygon([(cx + 4, bud_cy - 4), (cx + 12, bud_cy), (cx + 4, bud_cy + 4)],
                 fill=theme["muted"])

    simple_flower(cx + 50, bud_cy, 30, 8, stem_len=24)


def illus_stem_leaves(draw, x, y, w, h, cfg: FlowerConfig, theme: dict):
    col = theme["wire"][0]
    ctr = theme["wire"][1] if len(theme["wire"]) > 1 else darker(col, 20)
    green = (125, 165, 125)
    dgreen = (85, 128, 85)
    cx = x + w // 2

    stem_top, stem_bot = y + 14, y + h - 8
    draw.line([(cx, stem_top), (cx, stem_bot)], fill=dgreen, width=5)

    # Yapraklar
    for leaf_y, side in [(y + int(h * 0.38), -1), (y + int(h * 0.62), 1)]:
        pts = [
            (cx + side * 8, leaf_y),
            (cx + side * 38, leaf_y - 13),
            (cx + side * 48, leaf_y),
            (cx + side * 38, leaf_y + 13),
        ]
        draw.polygon(pts, fill=green, outline=dgreen, width=1)

    # Tepede küçük çiçek
    for i in range(6):
        a = math.radians(i * 60)
        pr = 10
        px = cx + int(18 * math.cos(a))
        py = stem_top + 14 + int(18 * math.sin(a))
        draw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=col)
    draw.ellipse([cx - 8, stem_top + 6, cx + 8, stem_top + 22], fill=ctr)


def illus_finishing(draw, x, y, w, h, cfg: FlowerConfig, theme: dict):
    cx = x + w // 2
    draw_dashed_line(draw, x + 12, y + 10, x + w - 12, y + 10, theme["deco"], dash=8, gap=5)

    inst_fnt = font("regular", 11)
    iy = y + 18
    for line in ["Wrap everything", "neatly with", "floral tape."]:
        draw_text_centered(draw, cx, iy, line, inst_fnt, theme["dark"])
        iy += 15

    script_fnt = font("serif_italic", 14)
    iy += 6
    for line in cfg.finish_msg.split("\n"):
        draw_text_centered(draw, cx, iy, line, script_fnt, theme["title"])
        iy += 18

    draw_heart(draw, cx, iy + 8, 6, theme["deco"])

    # "You did it!" rozeti
    bx, by = x + w - 78, y + h - 28
    draw.rounded_rectangle([bx, by, bx + 72, by + 26], radius=8, fill=theme["circle"])
    bf = font("bold", 10)
    bw, bh = txt_size(draw, "You did it!", bf)
    draw.text((bx + (72 - bw) // 2, by + (26 - bh) // 2), "You did it!", font=bf, fill="white")


# ─────────────────────────────────────────────────────────────────────────────
# Adım Kutuları
# ─────────────────────────────────────────────────────────────────────────────

_STEP_DEFS = [
    ("MATERIALS",                illus_materials),
    ("PETAL FORMING\n& TWISTING", illus_petal_forming),
    (None,                        illus_layering),
    ("ASSEMBLY",                  illus_assembly),
    ("STEM & LEAVES",             illus_stem_leaves),
    ("FINISHING TOUCH",           illus_finishing),
]

_STEP_DESCS = [
    None,           # 1: materials listesi zaten illüstrasyonda
    "petal_desc",
    "step3_desc",
    "step4_desc",
    "step5_desc",
    None,           # 6: illüstrasyon içinde yazılıyor
]


def draw_step_box(draw, num, sx, sy, sw, sh, cfg: FlowerConfig, theme: dict):
    pad = 7

    draw.rounded_rectangle(
        [sx + pad, sy + pad, sx + sw - pad, sy + sh - pad],
        radius=14, fill=theme["step_bg"], outline=theme["step_border"], width=1,
    )

    # Numara çemberi
    cr, cy_c = 12, sy + pad + 14
    draw_step_circle(draw, sx + pad + 15, cy_c, cr, num, theme)

    # Başlık
    title_raw, draw_fn = _STEP_DEFS[num - 1]
    title = cfg.step3_name if (title_raw is None) else title_raw
    title_fnt = font("bold", 11)
    tx, ty = sx + pad + 31, sy + pad + 5
    for tline in title.split("\n"):
        draw.text((tx, ty), tline, font=title_fnt, fill=theme["primary"])
        _, th = txt_size(draw, tline, title_fnt)
        ty += th + 1

    # İllüstrasyon alanı
    desc_reserve = 0 if num in (1, 6) else 58
    illus_top = sy + pad + cr * 2 + 8
    illus_h = sh - (illus_top - sy) - desc_reserve - pad
    draw_fn(draw, sx + pad + 5, illus_top, sw - pad * 2 - 10, illus_h, cfg, theme)

    # Açıklama metni
    if num == 1:
        # Malzeme listesi
        desc_y = illus_top + illus_h + 2
        list_fnt = font("regular", 10)
        for item in cfg.materials[:5]:
            draw.text((sx + pad + 10, desc_y), f"• {item}", font=list_fnt, fill=theme["dark"])
            desc_y += 12
    elif num not in (6,):
        desc_key = _STEP_DESCS[num - 1]
        if desc_key:
            desc_text = getattr(cfg, desc_key, "")
            if num == 2:
                desc_text = cfg.petal_desc + "\n" + cfg.petal_count
            desc_y = sy + sh - desc_reserve + 4
            desc_fnt = font("regular", 10)
            for line in desc_text.split("\n"):
                draw.text((sx + pad + 8, desc_y), line, font=desc_fnt, fill=theme["dark"])
                desc_y += 13

    # Ekstra not (dahlia için)
    if num == 5 and cfg.extra_note:
        note_fnt = font("serif_italic", 11)
        draw.text((sx + sw - pad - 52, sy + pad + 28), cfg.extra_note,
                  font=note_fnt, fill=theme["subtitle"])


# ─────────────────────────────────────────────────────────────────────────────
# Başlık Bölümü
# ─────────────────────────────────────────────────────────────────────────────

def draw_header(draw, cfg: FlowerConfig, theme: dict) -> int:
    cx = W // 2

    # "FUZZY WIRE TUTORIAL"
    hdr_fnt = font("bold", 13)
    hdr_txt = "FUZZY WIRE TUTORIAL"
    hw, hh = txt_size(draw, hdr_txt, hdr_fnt)
    hy = 18
    hx = cx - hw // 2
    line_y = hy + hh // 2
    draw.line([(30, line_y), (hx - 15, line_y)], fill=theme["muted"], width=1)
    draw.line([(hx + hw + 15, line_y), (W - 30, line_y)], fill=theme["muted"], width=1)
    draw.polygon([(hx - 10, line_y), (hx - 20, line_y - 4), (hx - 20, line_y + 4)],
                 fill=theme["muted"])
    draw.polygon([(hx + hw + 10, line_y), (hx + hw + 20, line_y - 4), (hx + hw + 20, line_y + 4)],
                 fill=theme["muted"])
    draw.text((hx, hy), hdr_txt, font=hdr_fnt, fill=theme["primary"])
    draw_heart(draw, cx, hy + hh + 5, 5, theme["deco"])

    # Çiçek adı (büyük serif)
    name_fnt = font("serif_bold", 70)
    nw, nh = txt_size(draw, cfg.name, name_fnt)
    ny = hy + hh + 16
    nx = max(20, min(cx - nw // 2, W - 170 - nw))
    draw.text((nx, ny), cfg.name, font=name_fnt, fill=theme["title"])

    # Etiket satırı: "tag1 • tag2 • handmade"
    tag_fnt = font("serif_italic", 13)
    tag_txt = f"{cfg.tag1}  •  {cfg.tag2}  •  handmade"
    tw, th = txt_size(draw, tag_txt, tag_fnt)
    tag_y = ny + nh + 2
    pill = (cx - tw // 2 - 14, tag_y - 5, cx + tw // 2 + 14, tag_y + th + 5)
    draw.rounded_rectangle(list(pill), radius=12, fill=lighter(theme["bg_top"], 18))
    draw.text((cx - tw // 2, tag_y), tag_txt, font=tag_fnt, fill=theme["tagline"])
    draw_heart(draw, pill[2] + 6, tag_y + th // 2, 4, theme["deco"])

    # Alt başlık
    sub_fnt = font("regular", 13)
    sub_txt = cfg.subtitle + "  ♥"
    sw2, sh2 = txt_size(draw, sub_txt, sub_fnt)
    sub_y = pill[3] + 8
    draw.text((cx - sw2 // 2, sub_y), sub_txt, font=sub_fnt, fill=theme["dark"])

    # Polaroid çerçeve (sağ üst)
    draw_polaroid(draw, W - 158, 18, 132, 142, theme)

    # Dekoratif parlama noktaları
    for (dx, dy, ds) in [(42, 52, 8), (W - 48, 82, 6), (82, 145, 5), (W - 188, 178, 7), (162, 28, 4)]:
        draw_sparkle(draw, dx, dy, ds, theme["deco"])
    draw_heart(draw, 35, 95, 5, theme["deco"])
    draw_heart(draw, W - 32, 48, 4, theme["deco"])

    return sub_y + sh2 + 14


# ─────────────────────────────────────────────────────────────────────────────
# Ana Üretici
# ─────────────────────────────────────────────────────────────────────────────

def generate(cfg: FlowerConfig, output: Optional[str] = None) -> str:
    theme = THEMES.get(cfg.theme, THEMES["rose"])

    img = Image.new("RGB", (W, H), (255, 255, 255))
    draw_gradient_bg(img, theme)
    draw = ImageDraw.Draw(img)

    header_bottom = draw_header(draw, cfg, theme)
    grid_top = max(header_bottom, HEADER_H)

    # Adımlar arasındaki bölücü çizgi
    draw_dashed_line(draw, 20, grid_top - 3, W - 20, grid_top - 3,
                     theme["deco"], dash=10, gap=6, width=1)

    available_h = H - grid_top - 8
    sh = available_h // STEP_ROWS
    sw = W // STEP_COLS

    for i in range(6):
        row, col = divmod(i, STEP_COLS)
        draw_step_box(draw, i + 1, col * sw, grid_top + row * sh, sw, sh, cfg, theme)

    if output is None:
        output = f"{cfg.name.lower()}_tutorial.png"

    img.save(output, "PNG")
    return output


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Fuzzy Wire Tutorial görseli üret",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Mevcut çiçekler: " + ", ".join(FLOWERS.keys()),
    )
    parser.add_argument("flower", nargs="?", help="Çiçek türü")
    parser.add_argument("--output", "-o", help="Çıktı PNG dosyası")
    parser.add_argument("--list", "-l", action="store_true", help="Tüm çiçekleri listele")
    parser.add_argument("--all", "-a", action="store_true", help="Tümünü üret")
    args = parser.parse_args()

    if args.list or (not args.flower and not args.all):
        print("Mevcut çiçek tutorialları:")
        for name, cfg in FLOWERS.items():
            print(f"  {name:<12}  —  {cfg.subtitle}")
        if not args.list:
            print("\nKullanım: python generator.py <çiçek> [--output dosya.png]")
        return

    if args.all:
        for name, cfg in FLOWERS.items():
            out = generate(cfg)
            print(f"Oluşturuldu: {out}")
        return

    flower = args.flower.lower()
    if flower not in FLOWERS:
        print(f"Bilinmeyen çiçek '{flower}'. Mevcut: {', '.join(FLOWERS.keys())}")
        sys.exit(1)

    out = generate(FLOWERS[flower], args.output)
    print(f"Oluşturuldu: {out}")


if __name__ == "__main__":
    main()
