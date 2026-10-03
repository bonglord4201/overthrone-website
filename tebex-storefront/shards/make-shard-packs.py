# Makes Throne Shard package images from the owner's "500 Throne Shards" artwork:
# the "500" is removed from the plaque and the new amount is set in matching metallic numerals.
#   python3 make-shard-packs.py <500-shards-image>
import sys, os
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

AMOUNTS = ["1,000", "2,500", "5,500", "9,000", "15,000", "25,000", "50,000"]
FONT = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
DIGITS = (378, 700, 908, 912)        # box around the original "500"
CENTER_X, BASELINE = 643, 897        # where the original numerals sit
MAX_W, MAX_H = 640, 182              # largest the new numerals may be

src = Image.open(sys.argv[1]).convert("RGBA")
out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "packs")
os.makedirs(out_dir, exist_ok=True)

# 1. remove the old numerals: mask the bright silver/glow pixels in the box and inpaint the plaque behind them
rgb = np.array(src.convert("RGB"))
x0, y0, x1, y1 = DIGITS
box = rgb[y0:y1, x0:x1].astype(int)
lum = box.mean(axis=2)
glow = (box[:, :, 0] > 150) & (box[:, :, 0] - box[:, :, 2] > 60)
mask = np.zeros(rgb.shape[:2], np.uint8)
mask[y0:y1, x0:x1] = ((lum > 70) | glow).astype(np.uint8) * 255
mask = cv2.dilate(mask, np.ones((9, 9), np.uint8))
clean = cv2.inpaint(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), mask, 9, cv2.INPAINT_TELEA)
base = Image.fromarray(cv2.cvtColor(clean, cv2.COLOR_BGR2RGB)).convert("RGBA")
base.putalpha(src.getchannel("A"))



def metal(mask):
    """Silver dragon-scale face with a chiselled bevel, lit from the top left like the original numerals."""
    w, h = mask.size
    rng = np.random.default_rng(7)
    noise = np.array(Image.fromarray((rng.random((h, w)) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0)), float)
    y = np.linspace(0, 1, h)[:, None]
    face = 232 - 95 * np.exp(-((y - 0.55) / 0.22) ** 2) + np.zeros((h, w))   # bright rims, darker steel band
    face += (noise - 128) * 0.3
    # scale pattern: rows of overlapping arcs
    sc = Image.new("L", (w, h), 0)
    sd = ImageDraw.Draw(sc)
    r = 15
    for row, yy in enumerate(range(-r, h + r, r)):
        off = r if row % 2 else 0
        for xx in range(-2 * r + off, w + 2 * r, 2 * r):
            sd.arc((xx - r, yy - r, xx + r, yy + r), 20, 160, fill=255, width=2)
    face -= np.array(sc.filter(ImageFilter.GaussianBlur(0.6)), float) * 0.28
    # bevel
    soft = np.array(mask.filter(ImageFilter.GaussianBlur(5)), float)
    light = soft - np.roll(np.roll(soft, 5, 0), 5, 1)
    face = np.clip(face + light * 0.7, 0, 255).astype(np.uint8)
    f = Image.fromarray(face)
    return Image.merge("RGB", (f.point(lambda v: min(255, v + 12)), f, f.point(lambda v: min(255, v + 6))))


for amount in AMOUNTS:
    # fit the text inside the plaque
    for size in range(330, 80, -2):
        font = ImageFont.truetype(FONT, size)
        l, t, r, b = font.getbbox(amount)
        if r - l <= MAX_W and b - t <= MAX_H:
            break
    l, t, r, b = font.getbbox(amount)
    tw, th = r - l, b - t
    pad = 60
    W, H = tw + pad * 2, th + pad * 2
    m = Image.new("L", (W, H))
    ImageDraw.Draw(m).text((pad - l, pad - t), amount, font=font, fill=255)
    # widen the numerals to match the original's broad serif style
    stretch = min(1.18, (MAX_W + pad * 2) / W)
    W = round(W * stretch)
    m = m.resize((W, H), Image.LANCZOS)

    outline = m.filter(ImageFilter.MaxFilter(7))
    rim = outline.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(7))
    haze = outline.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(26))
    inner = ImageChops.subtract(m, m.filter(ImageFilter.MinFilter(9))).filter(ImageFilter.GaussianBlur(2.5))

    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste((255, 30, 25, 255), (0, 0), haze.point(lambda v: int(v * 0.35)))
    layer.alpha_composite(Image.composite(Image.new("RGBA", (W, H), (255, 45, 35, 255)), Image.new("RGBA", (W, H), (0, 0, 0, 0)), rim.point(lambda v: int(v * 0.75))))
    layer.paste((255, 70, 60, 255), (0, 0), outline)
    layer.paste((60, 6, 8, 255), (0, 0), m.filter(ImageFilter.MaxFilter(3)))
    face = metal(m)
    face.paste((215, 40, 45), (0, 0), inner.point(lambda v: int(v * 0.55)))
    layer.paste(face, (0, 0), m)

    ox = CENTER_X - W // 2
    oy = BASELINE - th - pad
    img = base.copy()
    img.alpha_composite(layer, (ox, oy))
    name = amount.replace(",", "")
    img.save(os.path.join(out_dir, f"throne-shards-{name}.png"))
    print("wrote", amount, "font", size)
