"""Reusable THRONEBREAKER backgrounds and set pieces (each returns a PIL RGB image or draws onto an array)."""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from art import *

R = np.random.default_rng(11)

def stars(a, n=260, seed=3, top=0.55):
    r = np.random.default_rng(seed)
    h, w = a.shape[:2]
    for _ in range(n):
        x, y = int(r.uniform(0, w)), int(r.uniform(0, h * top)); b = r.uniform(80, 230)
        a[y:y + 2, x:x + 2] = np.maximum(a[y:y + 2, x:x + 2], b)
    return a

def skyline(w, h, base_y, seed, color, lit=(255, 200, 120), density=1.0, tall=1.0):
    """RGBA layer of building silhouettes with lit windows."""
    r = np.random.default_rng(seed)
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    x = -20
    while x < w:
        bw = int(r.uniform(70, 170)); bh = int(r.uniform(250, 900) * tall)
        top = base_y - bh
        d.rectangle([x, top, x + bw, h], fill=color + (255,))
        if r.random() < 0.3: d.rectangle([x + bw * 0.4, top - 60, x + bw * 0.45, top], fill=color + (255,))   # antenna
        for wy in range(int(top + 20), h - 20, 34):
            for wx in range(int(x + 12), int(x + bw - 14), 26):
                if r.random() < 0.18 * density:
                    d.rectangle([wx, wy, wx + 10, wy + 14], fill=lit + (int(r.uniform(90, 220)),))
        x += bw + int(r.uniform(-10, 25))
    return img

def gate_ring(size, inner, outer, swirl_t=0.0):
    """A glowing portal ring (RGBA), elliptical, with swirling inside."""
    w, h = size, int(size * 0.62)
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    for i in range(18):
        f = i / 17
        c = tuple(int(lerp(o, n, f)) for o, n in zip(outer, inner))
        m = f * w * 0.36
        d.ellipse([m, m * 0.62, w - m, h - m * 0.62], fill=c + (int(60 + 150 * f),))
    for k in range(9):   # swirl arcs
        a0 = (swirl_t * 90 + k * 40) % 360
        m = w * (0.08 + 0.035 * k)
        d.arc([m, m * 0.62, w - m, h - m * 0.62], a0, a0 + 70, fill=(255, 255, 255, 70), width=6)
    d.ellipse([4, 4, w - 4, h - 4], outline=outer + (255,), width=14)
    d.ellipse([18, 14, w - 18, h - 14], outline=(255, 255, 255, 160), width=4)
    return img

def lightning(a, x0, y0, length, color, seed, width=5):
    r = np.random.default_rng(seed)
    img = Image.new('RGBA', (a.shape[1], a.shape[0]), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    pts = [(x0, y0)]; x, y = x0, y0
    for _ in range(12):
        x += r.uniform(-60, 60); y += length / 12; pts.append((x, y))
    d.line(pts, fill=color + (255,), width=width, joint='curve')
    d.line(pts, fill=(255, 255, 255, 255), width=max(1, width // 3))
    a = over(a, img); a = add(a, glow(img, 40, 1.4))
    return a

class Embers:
    def __init__(self, n=90, color=(255, 90, 60), seed=5, rise=110):
        r = np.random.default_rng(seed)
        self.p = np.column_stack([r.uniform(0, W, n), r.uniform(0, H, n), r.uniform(0.5, 1.5, n), r.uniform(2, 6, n), r.uniform(0, 6.28, n)])
        self.color, self.rise = color, rise
    def draw(self, a, sec, alpha=1.0):
        img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
        for x, y, sp, sz, ph in self.p:
            yy = (y - sec * self.rise * sp) % H; xx = x + math.sin(sec * 1.3 + ph) * 25
            fl = 0.5 + 0.5 * math.sin(sec * 6 + ph * 3)
            d.ellipse([xx - sz, yy - sz, xx + sz, yy + sz], fill=self.color + (int(200 * fl * alpha),))
        a = over(a, img); return add(a, glow(img, 18, 1.2 * alpha))

def throne_shape(w, h, edge=(255, 60, 70)):
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    cx = w / 2
    back = [(cx - w * 0.30, h * 0.62), (cx - w * 0.34, h * 0.18), (cx - w * 0.22, h * 0.28), (cx - w * 0.16, h * 0.02), (cx - w * 0.06, h * 0.20),
            (cx, h * -0.05), (cx + w * 0.06, h * 0.20), (cx + w * 0.16, h * 0.02), (cx + w * 0.22, h * 0.28), (cx + w * 0.34, h * 0.18), (cx + w * 0.30, h * 0.62)]
    d.polygon(back, fill=(8, 6, 10, 255), outline=edge + (255,))
    d.rectangle([cx - w * 0.40, h * 0.58, cx + w * 0.40, h * 0.70], fill=(8, 6, 10, 255), outline=edge + (255,))   # seat + arms
    d.rectangle([cx - w * 0.44, h * 0.50, cx - w * 0.30, h * 0.72], fill=(8, 6, 10, 255), outline=edge + (255,))
    d.rectangle([cx + w * 0.30, h * 0.50, cx + w * 0.44, h * 0.72], fill=(8, 6, 10, 255), outline=edge + (255,))
    for i in range(4):   # steps
        sw = w * (0.46 + 0.07 * i)
        d.rectangle([cx - sw, h * (0.72 + 0.07 * i), cx + sw, h * (0.79 + 0.07 * i)], fill=(14, 10, 16, 255), outline=edge + (120,))
    d.ellipse([cx - w * 0.05, h * 0.30, cx + w * 0.05, h * 0.37], fill=edge + (255,))   # gem
    return img

def door_panels(a, close):
    """Two huge temple doors sliding shut from the sides (close 0..1)."""
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    gx = int(W / 2 * ease_in(close))
    for side in (0, 1):
        x0, x1 = (0, gx) if side == 0 else (W - gx, W)
        if x1 <= x0: continue
        d.rectangle([x0, 0, x1, H], fill=(20, 14, 18, 255))
        for k in range(6):
            yy = 160 + k * 300; d.rectangle([x0 + 30, yy, x1 - 30, yy + 220], outline=(90, 60, 50, 255), width=6)
    return over(a, img)
