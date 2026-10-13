# Detailed (painted-style) category icons for the Tebex cosmetics, transparent PNG 512x512.
# Drawn at 4x and scaled down for smooth edges.  Run: python3 make-icons-hd.py  -> icons/*.png
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import math, os, random
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons")
os.makedirs(OUT, exist_ok=True)
S = 2048  # working size

def new(): return Image.new("RGBA", (S, S), (0, 0, 0, 0))
def mask(): return Image.new("L", (S, S), 0)
def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))

def lin_grad(c1, c2, angle=90, stops=None):
    """full-canvas linear gradient (angle 90 = top->bottom)"""
    g = Image.new("RGBA", (S, S))
    px = g.load()
    a = math.radians(angle); dx, dy = math.cos(a), math.sin(a)
    cols = stops or [c1, c2]
    # build a 1D ramp then rotate-sample
    ramp = []
    for i in range(1024):
        t = i / 1023 * (len(cols) - 1); k = min(len(cols) - 2, int(t))
        ramp.append(lerp(cols[k], cols[k + 1], t - k))
    small = Image.new("RGBA", (256, 256)); sp = small.load()
    for y in range(256):
        for x in range(256):
            u = ((x / 255 - .5) * dx + (y / 255 - .5) * dy) / (abs(dx) * .5 + abs(dy) * .5) * .5 + .5
            sp[x, y] = ramp[max(0, min(1023, int(u * 1023)))]
    return small.resize((S, S), Image.BICUBIC)

def radial(c_in, c_out, cx, cy, r):
    small = Image.new("RGBA", (256, 256)); sp = small.load()
    for y in range(256):
        for x in range(256):
            d = math.hypot(x * S / 256 - cx, y * S / 256 - cy) / r
            sp[x, y] = lerp(c_in, c_out, max(0, min(1, d)))
    return small.resize((S, S), Image.BICUBIC)

def fill(base, m, src):
    """paint src onto base through mask m"""
    layer = new(); layer.paste(src, (0, 0), m); base.alpha_composite(layer)

def solid(c): return Image.new("RGBA", (S, S), c)

def outline(base, m, width=18, color=(20, 12, 14, 255)):
    d = m.filter(ImageFilter.MaxFilter(width * 2 + 1))
    ring = ImageChops.subtract(d, m)
    fill(base, ring, solid(color))

def shade(base, m, top=(255, 255, 255, 70), bottom=(0, 0, 0, 110), angle=90):
    """darken bottom / lighten top inside m"""
    g = lin_grad(top, bottom, angle)
    layer = new(); layer.paste(g, (0, 0), m); base.alpha_composite(layer)

def blur_mask(m, r): return m.filter(ImageFilter.GaussianBlur(r))

def highlight(base, box, alpha=110, blur=30):
    m = mask(); ImageDraw.Draw(m).ellipse(box, fill=alpha)
    fill(base, blur_mask(m, blur), solid((255, 255, 255, 255)))

def sparkle(base, cx, cy, r, col=(255, 255, 255, 255)):
    m = mask(); d = ImageDraw.Draw(m)
    w = r * .22
    d.polygon([(cx, cy - r), (cx + w, cy - w), (cx + r, cy), (cx + w, cy + w), (cx, cy + r), (cx - w, cy + w), (cx - r, cy), (cx - w, cy - w)], fill=255)
    glow = blur_mask(m, r * .5)
    fill(base, glow, solid(col[:3] + (150,)))
    fill(base, m, solid(col))

def glow_behind(img, color, radius=60, strength=1.5):
    a = img.split()[3]
    g = blur_mask(a.point(lambda v: 255 if v > 10 else 0), radius).point(lambda v: min(255, int(v * strength)))
    under = new(); under.paste(solid(color + (255,)), (0, 0), g)
    under.alpha_composite(img)
    return under

def save(img, name, glow):
    img = glow_behind(img, glow, radius=70, strength=.9)
    bbox = img.getbbox()
    img = img.crop(bbox)
    side = int(max(img.size) * 1.06)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0)); sq.alpha_composite(img, ((side - img.width) // 2, (side - img.height) // 2))
    sq.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, name + ".png"))
    print("icons/" + name + ".png")

RAINBOW = [(235, 40, 55, 255), (255, 140, 30, 255), (255, 215, 40, 255), (60, 200, 80, 255), (40, 130, 240, 255), (150, 60, 220, 255)]

# ------------------------------------------------------------------ Gradient Bundles: sack with rainbow ribbons
def gradient_bundles():
    img = new()
    # sack body
    body = mask(); d = ImageDraw.Draw(body)
    d.ellipse((380, 760, 1670, 1920), fill=255)
    d.polygon([(620, 900), (1430, 900), (1290, 640), (760, 640)], fill=255)
    outline(img, body, 24)
    fill(img, body, lin_grad(None, None, 110, [(170, 118, 70, 255), (120, 78, 45, 255), (70, 42, 25, 255)]))
    for x0 in (640, 900, 1180, 1420):   # cloth folds
        f = mask(); ImageDraw.Draw(f).line([(x0, 980), (x0 - 60 + (x0 % 7) * 10, 1820)], fill=110, width=50)
        fill(img, blur_mask(f, 22), solid((45, 25, 14, 255)))
    highlight(img, (520, 980, 860, 1600), 80, 70)
    # frilly top of the sack
    top = mask(); dt = ImageDraw.Draw(top)
    for i in range(7):
        x = 700 + i * 110
        dt.polygon([(x - 70, 640), (x, 470 + (i % 2) * 50), (x + 70, 640)], fill=255)
    outline(img, top, 18)
    fill(img, top, lin_grad(None, None, 90, [(185, 135, 85, 255), (120, 78, 45, 255)]))
    # ribbons: wide flat bands spilling from the top down over the sack
    for i, col in enumerate(RAINBOW):
        r = mask(); d = ImageDraw.Draw(r)
        x = 720 + i * 112
        pts = []
        for t in range(0, 101, 2):
            tt = t / 100
            px = x + math.sin(tt * 5.5 + i * .9) * 55 + (i - 2.5) * 55 * tt
            py = 470 + tt * (1180 + (i % 3) * 110)
            pts.append((px, py))
        d.line(pts, fill=255, width=104, joint="curve")
        # forked ribbon end
        ex, ey = pts[-1]
        d.polygon([(ex - 52, ey - 20), (ex + 52, ey - 20), (ex + 52, ey + 70), (ex, ey + 25), (ex - 52, ey + 70)], fill=255)
        outline(img, r, 14)
        fill(img, r, lin_grad(None, None, 0, [lerp(col, (0, 0, 0, 255), .18), lerp(col, (255, 255, 255, 255), .25), col, lerp(col, (0, 0, 0, 255), .25)]))
        sh = mask(); ImageDraw.Draw(sh).line([(px - 22, py) for (px, py) in pts[:-3]], fill=120, width=16, joint="curve")
        fill(img, blur_mask(sh, 8), solid((255, 255, 255, 255)))
    # rope tie over the ribbons
    rope = mask(); ImageDraw.Draw(rope).rounded_rectangle((640, 820, 1410, 920), 50, fill=255)
    outline(img, rope, 16); fill(img, rope, lin_grad(None, None, 90, [(235, 200, 130, 255), (170, 128, 70, 255)]))
    for x in range(670, 1390, 60):
        st = mask(); ImageDraw.Draw(st).line((x, 830, x + 36, 910), fill=255, width=12)
        fill(img, st, solid((135, 98, 52, 255)))
    knot = mask(); ImageDraw.Draw(knot).ellipse((960, 800, 1090, 940), fill=255)
    outline(img, knot, 14); fill(img, knot, radial((240, 210, 145, 255), (160, 118, 62, 255), 1010, 845, 90))
    for (x, y, r) in [(380, 560, 75), (1700, 600, 60), (1580, 380, 40), (300, 1080, 45), (1760, 1300, 50)]:
        sparkle(img, x, y, r)
    save(img, "gradient-bundles", (200, 120, 255))

# ------------------------------------------------------------------ Custom Tags: red leather tag
def custom_tags():
    img = new()
    tag = mask(); d = ImageDraw.Draw(tag)
    d.rounded_rectangle((330, 640, 1720, 1560), 90, fill=255)
    d.polygon([(330, 900), (150, 1100), (330, 1300)], fill=255)
    outline(img, tag, 24)
    fill(img, tag, lin_grad(None, None, 100, [(240, 70, 70, 255), (200, 30, 40, 255), (120, 10, 20, 255)]))
    # stitching
    st = mask(); ds = ImageDraw.Draw(st)
    for x in range(420, 1650, 70):
        ds.line((x, 720, x + 36, 720), fill=255, width=14); ds.line((x, 1480, x + 36, 1480), fill=255, width=14)
    for y in range(760, 1460, 70):
        ds.line((1640, y, 1640, y + 36), fill=255, width=14)
    fill(img, st, solid((255, 210, 140, 255)))
    highlight(img, (430, 680, 1500, 900), 70, 50)
    # parchment label
    lab = mask(); ImageDraw.Draw(lab).rounded_rectangle((640, 860, 1560, 1340), 40, fill=255)
    outline(img, lab, 14)
    fill(img, lab, lin_grad(None, None, 90, [(255, 248, 225, 255), (230, 205, 160, 255)]))
    # gold "name" scribble
    sc = mask(); dsc = ImageDraw.Draw(sc)
    pts = [(720 + t * 7.5, 1100 + math.sin(t / 7) * 60 + math.sin(t / 2.3) * 22) for t in range(0, 105)]
    dsc.line(pts, fill=255, width=34, joint="curve")
    fill(img, sc, lin_grad(None, None, 0, [(150, 40, 40, 255), (90, 20, 30, 255)]))
    # gold eyelet + string
    ey = mask(); ImageDraw.Draw(ey).ellipse((290, 1010, 470, 1190), fill=255)
    outline(img, ey, 14); fill(img, ey, radial((255, 240, 160, 255), (190, 130, 30, 255), 360, 1070, 120))
    hole = mask(); ImageDraw.Draw(hole).ellipse((345, 1065, 415, 1135), fill=255); fill(img, hole, solid((40, 20, 15, 255)))
    s = mask(); ImageDraw.Draw(s).line([(380, 1100), (300, 760), (420, 420), (640, 300)], fill=255, width=34, joint="curve")
    outline(img, s, 10); fill(img, s, lin_grad(None, None, 0, [(230, 230, 235, 255), (170, 170, 180, 255)]))
    for (x, y, r) in [(1700, 560, 60), (1820, 820, 40), (200, 600, 45)]:
        sparkle(img, x, y, r)
    save(img, "custom-tags", (255, 70, 70))

# ------------------------------------------------------------------ Statuses: wooden plaque with glowing text
def statuses():
    img = new()
    post = mask(); ImageDraw.Draw(post).rectangle((930, 1250, 1120, 1900), fill=255)
    outline(img, post, 20); fill(img, post, lin_grad(None, None, 0, [(150, 100, 55, 255), (110, 70, 35, 255), (80, 50, 25, 255)]))
    board = mask(); ImageDraw.Draw(board).rounded_rectangle((250, 420, 1800, 1320), 60, fill=255)
    outline(img, board, 24)
    fill(img, board, lin_grad(None, None, 95, [(215, 165, 100, 255), (175, 125, 70, 255), (130, 85, 45, 255)]))
    # wood grain
    for y in range(500, 1260, 90):
        g = mask(); ImageDraw.Draw(g).line([(300 + (i * 50), y + math.sin(i) * 12) for i in range(31)], fill=70, width=10)
        fill(img, blur_mask(g, 2), solid((90, 55, 25, 255)))
    # inner frame
    fr = mask(); ImageDraw.Draw(fr).rounded_rectangle((330, 500, 1720, 1240), 40, outline=255, width=26)
    fill(img, fr, solid((110, 70, 35, 255)))
    # glowing gradient text lines
    for (y, cols, w) in [(640, [(255, 70, 160, 255), (255, 170, 60, 255), (255, 235, 80, 255)], 1100), (880, [(70, 230, 140, 255), (60, 170, 255, 255), (190, 110, 255, 255)], 900), (1090, [(255, 255, 255, 255), (255, 220, 120, 255)], 650)]:
        ln = mask(); ImageDraw.Draw(ln).rounded_rectangle((1025 - w // 2, y, 1025 + w // 2, y + 110), 55, fill=255)
        fill(img, blur_mask(ln, 40), solid(cols[0][:3] + (160,)))
        fill(img, ln, lin_grad(None, None, 0, cols))
        highlight(img, (1025 - w // 2 + 30, y + 10, 1025 + w // 2 - 30, y + 45), 120, 8)
    # nails
    for (x, y) in [(330, 500), (1720, 500), (330, 1240), (1720, 1240)]:
        n = mask(); ImageDraw.Draw(n).ellipse((x - 40, y - 40, x + 40, y + 40), fill=255)
        outline(img, n, 8); fill(img, n, radial((240, 240, 245, 255), (120, 120, 130, 255), x - 10, y - 10, 50))
    for (x, y, r) in [(220, 360, 60), (1850, 420, 50), (1780, 1450, 45), (300, 1450, 40)]:
        sparkle(img, x, y, r)
    save(img, "statuses", (255, 180, 90))

# ------------------------------------------------------------------ Join & Quit: scroll with wax seal and arrows
def join_quit():
    img = new()
    paper = mask(); ImageDraw.Draw(paper).rectangle((430, 500, 1620, 1600), fill=255)
    outline(img, paper, 20)
    fill(img, paper, lin_grad(None, None, 0, [(225, 200, 150, 255), (250, 235, 200, 255), (225, 200, 150, 255)]))
    for (y0, y1) in [(380, 560), (1540, 1720)]:
        roll = mask(); ImageDraw.Draw(roll).rounded_rectangle((330, y0, 1720, y1), 90, fill=255)
        outline(img, roll, 20); fill(img, roll, lin_grad(None, None, 90, [(245, 225, 185, 255), (200, 165, 110, 255), (150, 115, 70, 255)]))
        highlight(img, (380, y0 + 20, 1650, y0 + 70), 90, 15)
        for x in (330, 1720):
            k = mask(); ImageDraw.Draw(k).ellipse((x - 70, y0 - 10, x + 70, y1 + 10), fill=255)
            outline(img, k, 14); fill(img, k, radial((200, 140, 60, 255), (120, 70, 25, 255), x - 20, (y0 + y1) / 2 - 20, 110))
    # arrows: green in, red out
    def arrow(y, col, right):
        a = mask(); d = ImageDraw.Draw(a)
        if right:
            d.rectangle((560, y - 55, 1250, y + 55), fill=255); d.polygon([(1250, y - 150), (1480, y), (1250, y + 150)], fill=255)
        else:
            d.rectangle((800, y - 55, 1490, y + 55), fill=255); d.polygon([(800, y - 150), (570, y), (800, y + 150)], fill=255)
        outline(img, a, 16); fill(img, a, lin_grad(None, None, 90, [lerp(col, (255, 255, 255, 255), .35), col, lerp(col, (0, 0, 0, 255), .3)]))
    arrow(840, (60, 200, 90, 255), True)
    arrow(1240, (225, 55, 60, 255), False)
    # wax seal
    seal = mask(); ImageDraw.Draw(seal).ellipse((1330, 1330, 1730, 1730), fill=255)
    outline(img, seal, 16); fill(img, seal, radial((240, 70, 80, 255), (130, 15, 25, 255), 1480, 1480, 260))
    cr = mask(); ImageDraw.Draw(cr).polygon([(1430, 1600), (1440, 1460), (1490, 1530), (1530, 1440), (1570, 1530), (1620, 1460), (1630, 1600)], fill=255)
    fill(img, cr, solid((255, 205, 90, 255)))
    for (x, y, r) in [(250, 300, 55), (1850, 900, 45), (230, 1250, 45)]:
        sparkle(img, x, y, r)
    save(img, "join-quit-messages", (255, 215, 120))

# ------------------------------------------------------------------ Name Colors: paint palette + brush
def name_colors():
    img = new()
    pal = mask(); d = ImageDraw.Draw(pal)
    d.ellipse((260, 460, 1760, 1660), fill=255)
    hole = mask(); ImageDraw.Draw(hole).ellipse((1300, 1150, 1520, 1370), fill=255)
    pal = ImageChops.subtract(pal, hole)
    outline(img, pal, 22)
    fill(img, pal, lin_grad(None, None, 100, [(225, 175, 110, 255), (185, 130, 75, 255), (140, 90, 45, 255)]))
    highlight(img, (400, 560, 1200, 900), 80, 60)
    for i, (x, y) in enumerate([(560, 760), (840, 620), (1160, 640), (1440, 820), (520, 1080), (760, 1340)]):
        col = RAINBOW[i]
        b = mask(); ImageDraw.Draw(b).ellipse((x - 130, y - 110, x + 130, y + 110), fill=255)
        outline(img, b, 12); fill(img, b, radial(lerp(col, (255, 255, 255, 255), .45), col, x - 40, y - 40, 170))
        highlight(img, (x - 80, y - 80, x - 10, y - 30), 160, 10)
    # brush
    br = mask(); ImageDraw.Draw(br).line([(1180, 1050), (1820, 1800)], fill=255, width=110)
    outline(img, br, 16); fill(img, br, lin_grad(None, None, 45, [(180, 120, 70, 255), (110, 65, 35, 255)]))
    fe = mask(); ImageDraw.Draw(fe).polygon([(1060, 900), (1210, 1000), (1260, 1130), (1150, 1090)], fill=255)
    fe2 = mask(); ImageDraw.Draw(fe2).line([(1120, 980), (1250, 1130)], fill=255, width=150)
    ferr = mask(); ImageDraw.Draw(ferr).line([(1150, 1020), (1260, 1150)], fill=255, width=130)
    outline(img, ferr, 14); fill(img, ferr, lin_grad(None, None, 45, [(230, 230, 240, 255), (140, 140, 155, 255)]))
    tip = mask(); ImageDraw.Draw(tip).polygon([(900, 760), (1180, 960), (1100, 1080)], fill=255)
    tip = blur_mask(tip, 3)
    outline(img, tip.point(lambda v: 255 if v > 128 else 0), 14)
    fill(img, tip, lin_grad(None, None, 45, [(255, 80, 170, 255), (160, 80, 255, 255), (60, 200, 255, 255)]))
    for (x, y, r) in [(300, 400, 55), (1780, 420, 50), (220, 1500, 40)]:
        sparkle(img, x, y, r)
    save(img, "name-colors", (255, 120, 200))

# ------------------------------------------------------------------ Chat Colors: glossy speech bubble
def chat_colors():
    img = new()
    b = mask(); d = ImageDraw.Draw(b)
    d.rounded_rectangle((250, 380, 1800, 1400), 200, fill=255)
    d.polygon([(560, 1300), (500, 1720), (900, 1360)], fill=255)
    outline(img, b, 24)
    fill(img, b, lin_grad(None, None, 90, [(255, 255, 255, 255), (225, 232, 245, 255), (185, 195, 220, 255)]))
    rows = [[(235, 40, 55, 255), (255, 140, 30, 255), (255, 215, 40, 255)], [(60, 200, 80, 255), (40, 130, 240, 255), (150, 60, 220, 255)], [(40, 200, 220, 255), (255, 90, 170, 255)]]
    for i, (y, w) in enumerate([(640, 1150), (880, 1250), (1120, 800)]):
        x = 430
        cols = rows[i]
        seg = w // len(cols)
        for j, col in enumerate(cols):
            ln = mask(); ImageDraw.Draw(ln).rounded_rectangle((x, y, x + seg - 40, y + 120), 60, fill=255)
            outline(img, ln, 10); fill(img, ln, lin_grad(None, None, 90, [lerp(col, (255, 255, 255, 255), .35), col, lerp(col, (0, 0, 0, 255), .25)]))
            highlight(img, (x + 30, y + 15, x + seg - 70, y + 50), 140, 6)
            x += seg
    for (x, y, r) in [(1850, 300, 60), (200, 260, 45), (1880, 1300, 45)]:
        sparkle(img, x, y, r)
    save(img, "chat-colors", (120, 200, 255))

# ------------------------------------------------------------------ Glow Colors: glowing crystal orb with rays
def glow_colors():
    img = new()
    rays = mask(); d = ImageDraw.Draw(rays)
    for k in range(12):
        a = k * math.pi / 6
        L = 820 if k % 2 == 0 else 640
        d.polygon([(1024, 1024), (1024 + math.cos(a - .06) * L, 1024 + math.sin(a - .06) * L), (1024 + math.cos(a + .06) * L, 1024 + math.sin(a + .06) * L)], fill=200)
    fill(img, blur_mask(rays, 6), solid((255, 225, 110, 255)))
    halo = mask(); ImageDraw.Draw(halo).ellipse((470, 470, 1578, 1578), fill=170)
    fill(img, blur_mask(halo, 60), solid((255, 210, 90, 255)))
    orb = mask(); ImageDraw.Draw(orb).ellipse((560, 560, 1488, 1488), fill=255)
    outline(img, orb, 22, (90, 50, 10, 255))
    fill(img, orb, radial((255, 255, 235, 255), (255, 160, 30, 255), 900, 880, 620))
    # rainbow ring inside
    for i, col in enumerate(RAINBOW):
        a0 = i * 60
        r = mask(); ImageDraw.Draw(r).arc((660, 660, 1388, 1388), a0, a0 + 55, fill=255, width=60)
        fill(img, blur_mask(r, 6), solid(col[:3] + (200,)))
    highlight(img, (700, 650, 1000, 880), 200, 25)
    for (x, y, r) in [(330, 330, 80), (1750, 400, 60), (1700, 1700, 70), (330, 1650, 50), (1024, 220, 50)]:
        sparkle(img, x, y, r)
    save(img, "glow-colors", (255, 220, 100))

import sys
ONLY = sys.argv[1:]
for f in (gradient_bundles, custom_tags, statuses, join_quit, name_colors, chat_colors, glow_colors):
    if not ONLY or f.__name__ in ONLY:
        f()
