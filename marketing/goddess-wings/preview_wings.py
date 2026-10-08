"""Renders a front + back preview of Goddess Aeonia with the feather wings from make_wings.py."""
import importlib.util, math, os, re
from PIL import Image, ImageDraw, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
skins = os.path.join(HERE, "..", "npc-skins")
ms = load("ms", os.path.join(skins, "make_skins.py"))
gd = load("gd", os.path.join(skins, "make_goddess.py"))
skin = Image.open(os.path.join(skins, "divine_goddess.png")).convert("RGBA")

# a 16x16 feather sprite in the style of the vanilla item (quill bottom-left -> tip top-right)
def feather_sprite(gold=False):
    im = Image.new("RGBA", (16, 16), (0, 0, 0, 0)); d = im.putpixel
    vane, shade, quill = ((255, 236, 150), (222, 178, 60), (150, 110, 30)) if gold else ((250, 250, 252), (205, 214, 228), (120, 120, 132))
    for i in range(2, 15):
        x, y = i, 15 - i
        width = 0 if i < 4 else min(3, (i - 2) // 2 + 1) if i < 12 else max(0, 15 - i)
        for k in range(1, width + 1):
            if 0 <= x - k < 16: d((x - k, y), (*shade, 255))
            if 0 <= y - k < 16: d((x, y - k), (*vane, 255))
        d((x, y), (*quill, 255))
    return im

S = 110                       # pixels per block
W, H = 520, 340
def render(view):
    img = Image.new("RGBA", (W, H), (34, 30, 40, 255))
    dr = ImageDraw.Draw(img)
    for i in range(0, H, 2):  # soft sky gradient
        dr.line([(0, i), (W, i)], fill=(34 + i // 12, 30 + i // 14, 48 + i // 10, 255))
    ox, oy = W // 2, H - 20   # feet position on screen
    body = (ms.front_view(skin) if view == "front" else gd.back_view(skin)).resize((int(0.5 * S), int(2.0 * S)), Image.NEAREST)
    feathers = []
    for line in open(os.path.join(HERE, "goddess_wings.mcfunction")):
        if "summon item_display" not in line: continue
        q = [float(v.rstrip("f")) for v in re.search(r"left_rotation:\[([^\]]+)\]", line).group(1).split(",")]
        t = [float(v.rstrip("f")) for v in re.search(r"translation:\[([^\]]+)\]", line).group(1).split(",")]
        sc = [float(v.rstrip("f")) for v in re.search(r"scale:\[([^\]]+)\]", line).group(1).split(",")]
        gold = "gold_nugget" in line
        feathers.append((q, t, sc, gold))
    def draw_feathers():
        for q, t, sc, gold in feathers:
            spr = feather_sprite(gold).resize((64, 64), Image.NEAREST)
            a = 2 * math.atan2(q[2], q[3])                      # rotation about Z
            ca, sa = math.cos(a), math.sin(a)
            # sprite px (0..64) -> local units: 64px = 0.5 block * scale, centered
            k = 0.5 / 64
            def to_screen(px, py):
                u, v = (px - 32) * k * sc[0], (32 - py) * k * sc[1]
                X = ca * u - sa * v + t[0]; Y = sa * u + ca * v + t[1]
                Xs = X if view == "front" else -X
                return ox + Xs * S, oy - (1.35 + Y) * S
            # affine: screen = A * sprite + b ; PIL needs inverse
            x0, y0 = to_screen(0, 0); x1, y1 = to_screen(1, 0); x2, y2 = to_screen(0, 1)
            a11, a21, a12, a22 = x1 - x0, y1 - y0, x2 - x0, y2 - y0
            det = a11 * a22 - a12 * a21
            inv = (a22 / det, -a12 / det, 0, -a21 / det, a11 / det, 0)
            inv = (inv[0], inv[1], -(inv[0] * x0 + inv[1] * y0), inv[3], inv[4], -(inv[3] * x0 + inv[4] * y0))
            layer = spr.transform((W, H), Image.AFFINE, inv, resample=Image.NEAREST)
            img.alpha_composite(layer)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); gdw = ImageDraw.Draw(glow)
    gdw.ellipse([ox - 30, oy - 2.15 * S - 30, ox + 30, oy - 2.15 * S + 30], fill=(255, 240, 160, 90))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(12)))
    if view == "front": draw_feathers()
    img.alpha_composite(body, (ox - body.width // 2, oy - body.height))
    if view == "back": draw_feathers()
    for (dx, dy) in [(-18, -2.35), (12, -2.5), (-4, -2.62), (22, -2.28), (-26, -2.55)]:  # crown sparkles
        x, y = ox + dx, oy + dy * S
        dr.line([(x - 3, y), (x + 3, y)], fill=(255, 255, 255, 255)); dr.line([(x, y - 3), (x, y + 3)], fill=(255, 255, 255, 255))
    dr.text((10, 8), view.upper(), fill=(230, 220, 200, 255))
    return img

out = Image.new("RGBA", (W * 2 + 10, H), (20, 18, 24, 255))
out.alpha_composite(render("front"), (0, 0)); out.alpha_composite(render("back"), (W + 10, 0))
out.save(os.path.join(HERE, "wings-preview.png")); print("ok")
