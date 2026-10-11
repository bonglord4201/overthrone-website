"""THRONEBREAKER drawing kit: silhouette anime characters with rim light, backgrounds, System windows, captions.
Every character is drawn from the same parametric body + fixed features, so they look identical in every shot."""
import math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

W, H = 1080, 1920
FONTS = os.environ.get('TB_FONTS', '/tmp/claude-0/anime/fonts')
BEBAS = os.path.join(FONTS, 'BebasNeue-Regular.ttf')
CINZEL = os.path.join(FONTS, 'Cinzel[wght].ttf')
_fc = {}
def font(path, size):
    k = (path, size)
    if k not in _fc:
        f = ImageFont.truetype(path, size)
        if path == CINZEL:
            try: f.set_variation_by_axes([700])
            except Exception: pass
        _fc[k] = f
    return _fc[k]

def hx(c): c = c.lstrip('#'); return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))
INK = hx('0a0910')
CRIMSON, GOLD, PURPLE, ICE, WHITE = hx('e0223a'), hx('f2c14e'), hx('9a4dff'), hx('7fd4ff'), (255, 255, 255)

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ease(x): x = clamp(x); return x * x * (3 - 2 * x)
def ease_out(x): x = clamp(x); return 1 - (1 - x) ** 3
def ease_in(x): x = clamp(x); return x ** 3
def lerp(a, b, t): return a + (b - a) * t

# ------------------------------------------------------------------ gradients and light
def vgrad(w, h, stops):
    """stops: [(pos 0..1, (r,g,b))] top to bottom."""
    ys = np.linspace(0, 1, h)
    out = np.zeros((h, w, 3), np.float32)
    ps = [p for p, _ in stops]; cs = np.array([c for _, c in stops], np.float32)
    for ch in range(3):
        out[:, :, ch] = np.interp(ys, ps, cs[:, ch])[:, None]
    return out

def radial(w, h, cx, cy, r, color, power=2.0):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    a = np.clip(1 - d, 0, 1) ** power
    return a[:, :, None] * np.array(color, np.float32)[None, None, :]

def to_img(a): return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
def arr(img): return np.asarray(img.convert('RGB')).astype(np.float32)

def glow(layer_rgba, radius, strength=1.0):
    """Additive bloom of an RGBA layer."""
    small = layer_rgba.resize((max(1, layer_rgba.width // 4), max(1, layer_rgba.height // 4)), Image.BILINEAR)
    b = small.filter(ImageFilter.GaussianBlur(radius / 4)).resize(layer_rgba.size, Image.BILINEAR)
    a = np.asarray(b).astype(np.float32)
    return a[:, :, :3] * (a[:, :, 3:4] / 255.0) * strength

def add(base, extra): return np.clip(base + extra, 0, 255)

def over(base_arr, layer_rgba, x=0, y=0, alpha=1.0):
    """Alpha-composite an RGBA PIL image onto a float RGB array at (x, y)."""
    if alpha <= 0: return base_arr
    la = np.asarray(layer_rgba).astype(np.float32)
    h, w = la.shape[:2]
    x0, y0 = max(0, x), max(0, y); x1, y1 = min(base_arr.shape[1], x + w), min(base_arr.shape[0], y + h)
    if x1 <= x0 or y1 <= y0: return base_arr
    src = la[y0 - y:y1 - y, x0 - x:x1 - x]
    a = src[:, :, 3:4] / 255.0 * alpha
    base_arr[y0:y1, x0:x1] = base_arr[y0:y1, x0:x1] * (1 - a) + src[:, :, :3] * a
    return base_arr

# ------------------------------------------------------------------ characters
# Pose joints in body units: feet at y=0, top of head at y=-1 (height 1), x to the right.
BASE = dict(head=(0, -0.925), neck=(0, -0.835), sh_l=(-0.105, -0.80), sh_r=(0.105, -0.80),
            el_l=(-0.135, -0.635), el_r=(0.135, -0.635), ha_l=(-0.14, -0.48), ha_r=(0.14, -0.48),
            hip_l=(-0.06, -0.50), hip_r=(0.06, -0.50), kn_l=(-0.07, -0.26), kn_r=(0.07, -0.26),
            ft_l=(-0.08, -0.02), ft_r=(0.08, -0.02))

def pose(**kw):
    p = dict(BASE); p.update(kw); return p

def side_walk(phase, run=False):
    """Side view walk/run cycle facing right."""
    s = math.sin(phase); c = math.cos(phase)
    a = 0.20 if run else 0.12
    lean = 0.06 if run else 0.01
    p = dict(head=(lean + 0.02, -0.90), neck=(lean, -0.80), sh_l=(lean - 0.01, -0.77), sh_r=(lean + 0.01, -0.77),
             hip_l=(0.0, -0.48), hip_r=(0.0, -0.48))
    p['kn_l'] = (a * s * 0.9 + 0.03, -0.26 + (0.05 if run and s > 0 else 0))
    p['kn_r'] = (-a * s * 0.9 + 0.03, -0.26 + (0.05 if run and s < 0 else 0))
    p['ft_l'] = (a * 1.3 * s, -0.0 - (0.08 * max(0, c) if run else 0.02 * max(0, c)))
    p['ft_r'] = (-a * 1.3 * s, -0.0 - (0.08 * max(0, -c) if run else 0.02 * max(0, -c)))
    p['el_l'] = (lean - a * 0.6 * s, -0.62); p['ha_l'] = (lean - a * 1.0 * s + (0.06 if run else 0), -0.48 - (0.08 if run else 0))
    p['el_r'] = (lean + a * 0.6 * s, -0.62); p['ha_r'] = (lean + a * 1.0 * s + (0.06 if run else 0), -0.48 - (0.08 if run else 0))
    return p

class Char:
    def __init__(self, name, height_px, hair, rim, accents):
        self.name, self.h, self.hair, self.rim, self.accents = name, height_px, hair, rim, accents

def draw_char(spec, p, cx, foot_y, scale=1.0, facing=1, rim_dir=(-1, -1), rim_color=None, extra=None, t=0.0):
    """Returns (RGBA layer, x0, y0). spec: dict with keys kind ('ren','aiko','hana','king','npc','statue')."""
    hp = spec['h'] * scale
    pad = int(hp * 0.6)
    ss = 2  # supersample
    Wc, Hc = int(hp * 1.6) * ss, int(hp * 1.5) * ss
    ox, oy = Wc / 2, Hc - pad * ss * 0.25
    m = Image.new('L', (Wc, Hc), 0); d = ImageDraw.Draw(m)
    def P(k):
        x, y = p[k]; return (ox + facing * x * hp * ss, oy + y * hp * ss)
    def dot(pt, w):
        x, y = pt; d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=255)
    def taper(a, b, w1, w2):
        (x1, y1), (x2, y2) = P(a), P(b)
        w1 *= hp * ss; w2 *= hp * ss
        L = math.hypot(x2 - x1, y2 - y1) or 1
        nx, ny = -(y2 - y1) / L, (x2 - x1) / L
        d.polygon([(x1 + nx * w1 / 2, y1 + ny * w1 / 2), (x2 + nx * w2 / 2, y2 + ny * w2 / 2),
                   (x2 - nx * w2 / 2, y2 - ny * w2 / 2), (x1 - nx * w1 / 2, y1 - ny * w1 / 2)], fill=255)
        dot((x1, y1), w1); dot((x2, y2), w2)
    kind = spec['kind']
    bulk = spec.get('bulk', 1.0)
    # legs: thigh -> knee -> ankle, tapered, plus a boot
    for s_ in ('l', 'r'):
        taper('hip_' + s_, 'kn_' + s_, 0.085 * bulk, 0.058 * bulk)
        taper('kn_' + s_, 'ft_' + s_, 0.058 * bulk, 0.040 * bulk)
        fx, fy = P('ft_' + s_); fw = 0.075 * hp * ss
        d.polygon([(fx - fw * 0.35, fy - fw * 0.55), (fx + facing * fw * 0.95, fy - fw * 0.1), (fx + facing * fw * 0.95, fy + fw * 0.12),
                   (fx - fw * 0.45, fy + fw * 0.12)], fill=255)
    # torso: broad shoulders, narrow waist, hips
    sl, sr, hl, hr = P('sh_l'), P('sh_r'), P('hip_l'), P('hip_r')
    u = hp * ss
    nk = P('neck')
    wx = ((sl[0] + sr[0]) / 2 * 0.4 + (hl[0] + hr[0]) / 2 * 0.6, (sl[1] + hl[1]) / 2 + 0.05 * u)
    sh_w = 0.045 * u * bulk
    d.polygon([(sl[0] - sh_w, sl[1] + 0.01 * u), (sl[0] - sh_w * 0.6, sl[1] - 0.025 * u), (nk[0], nk[1] - 0.005 * u),
               (sr[0] + sh_w * 0.6, sr[1] - 0.025 * u), (sr[0] + sh_w, sr[1] + 0.01 * u),
               (wx[0] + 0.07 * u * bulk, wx[1]), (hr[0] + 0.05 * u * bulk, hr[1] + 0.02 * u),
               (hl[0] - 0.05 * u * bulk, hl[1] + 0.02 * u), (wx[0] - 0.07 * u * bulk, wx[1])], fill=255)
    for k_ in ('sh_l', 'sh_r'): dot(P(k_), 0.062 * u * bulk)
    taper('neck', 'head', 0.05, 0.05)
    # long coat / cape
    if kind in ('ren', 'king'):
        flare = {'ren': 0.12, 'king': 0.20}[kind]
        length = {'ren': 0.30, 'king': 0.44}[kind]
        sway = math.sin(t * 3.0) * 0.02
        hx_, hy_ = (hl[0] + hr[0]) / 2, (hl[1] + hr[1]) / 2
        sx_, sy_ = (sl[0] + sr[0]) / 2, (sl[1] + sr[1]) / 2
        vx, vy = hx_ - sx_, hy_ - sy_; L = math.hypot(vx, vy) or 1; vx, vy = vx / L, vy / L   # down the torso
        nx, ny = -vy, vx                                                                       # across the body
        horizontal = abs(vy) < 0.6
        def Q(along, across): return (hx_ + vx * along * u + nx * across * u, hy_ + vy * along * u + ny * across * u)
        if not horizontal: d.polygon([Q(-0.12, -0.075), Q(-0.12, 0.075), Q(length, flare + sway), Q(length - 0.05, 0.03 + sway * 1.5),
                   Q(length, -(flare - sway))], fill=255)
    # arms
    for s_ in ('l', 'r'):
        taper('sh_' + s_, 'el_' + s_, 0.062 * bulk, 0.048 * bulk)
        taper('el_' + s_, 'ha_' + s_, 0.048 * bulk, 0.034 * bulk)
        dot(P('ha_' + s_), 0.045 * u)
    # head
    hx2, hy2 = P('head'); r = 0.066 * hp * ss * spec.get('head', 1.0)
    d.ellipse([hx2 - r * 0.92, hy2 - r * 1.05, hx2 + r * 0.92, hy2 + r * 0.95], fill=255)
    d.polygon([(hx2 - r * 0.85, hy2 + 0.2 * r), (hx2, hy2 + 1.25 * r), (hx2 + r * 0.85, hy2 + 0.2 * r)], fill=255)   # jaw
    # hair
    if kind == 'ren':   # spiky messy hair + hood behind the neck
        spikes = [(-1.15, -0.2), (-1.0, -1.1), (-0.55, -0.7), (-0.35, -1.45), (0.0, -0.95), (0.3, -1.5), (0.55, -0.9),
                  (0.95, -1.2), (1.15, -0.3), (1.1, 0.2), (-1.1, 0.2)]
        d.polygon([(hx2 + facing * a * r, hy2 + b * r) for a, b in spikes], fill=255)
        d.polygon([(hx2 - facing * 0.4 * r, hy2 + 0.9 * r), (hx2 - facing * 1.5 * r, hy2 + 0.6 * r), (hx2 - facing * 1.4 * r, hy2 + 1.6 * r),
                   (hx2 + facing * 0.2 * r, hy2 + 1.7 * r)], fill=255)
    elif kind == 'aiko':
        d.ellipse([hx2 - r * 1.15, hy2 - r * 1.2, hx2 + r * 1.15, hy2 + r * 0.6], fill=255)
        tail = [(hx2 - facing * 0.8 * r, hy2 + 0.3 * r), (hx2 - facing * 1.6 * r, hy2 + 1.2 * r), (hx2 - facing * 1.4 * r, hy2 + 3.2 * r),
                (hx2 - facing * 1.0 * r, hy2 + 3.4 * r), (hx2 - facing * 0.9 * r, hy2 + 1.2 * r)]
        d.polygon(tail, fill=255)
    elif kind == 'hana':
        d.polygon([(hx2 - 1.25 * r, hy2 + 0.85 * r), (hx2 - 1.2 * r, hy2 - 0.8 * r), (hx2, hy2 - 1.3 * r), (hx2 + 1.2 * r, hy2 - 0.8 * r),
                   (hx2 + 1.25 * r, hy2 + 0.85 * r), (hx2 + 0.9 * r, hy2 + 0.3 * r), (hx2 - 0.9 * r, hy2 + 0.3 * r)], fill=255)
    elif kind == 'king':
        d.polygon([(hx2 - 2.6 * r, hy2 + 2.0 * r), (hx2 - 1.3 * r, hy2 + 1.0 * r), (hx2 + 1.3 * r, hy2 + 1.0 * r), (hx2 + 2.6 * r, hy2 + 2.0 * r),
                   (hx2 + 1.6 * r, hy2 + 2.6 * r), (hx2 - 1.6 * r, hy2 + 2.6 * r)], fill=255)   # pauldrons
    elif kind == 'statue':
        d.polygon([(hx2 - 1.0 * r, hy2 - 0.6 * r), (hx2, hy2 - 2.0 * r), (hx2 + 1.0 * r, hy2 - 0.6 * r)], fill=255)   # horned helm
    if extra: extra(d, P, hp * ss, r)
    # rim light: pixels of the mask whose neighbour toward the light is empty
    m = m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))   # close seams between body parts
    ma = np.asarray(m).astype(np.float32) / 255
    k = max(2, int(0.006 * hp * ss))
    sh = np.zeros_like(ma)
    dx, dy = int(rim_dir[0] * k), int(rim_dir[1] * k)
    sh[max(0, dy):ma.shape[0] + min(0, dy), max(0, dx):ma.shape[1] + min(0, dx)] = \
        ma[max(0, -dy):ma.shape[0] - max(0, dy), max(0, -dx):ma.shape[1] - max(0, dx)]
    rim = np.clip(ma - sh, 0, 1)
    rc = np.array(rim_color or spec['rim'], np.float32)
    rgb = np.zeros(ma.shape + (3,), np.float32) + np.array(INK, np.float32)
    rgb = rgb * (1 - rim[:, :, None]) + rc * rim[:, :, None]
    rgba = np.dstack([rgb, ma * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, 'RGBA')
    # accents drawn on top (not masked): eyes, streak, ring, ribbon, blade, crown
    ad = ImageDraw.Draw(img)
    for acc in spec.get('accents', []):
        acc(ad, P, hp * ss, r, facing, t)
    img = img.resize((Wc // ss, Hc // ss), Image.LANCZOS)
    return img, int(cx - Wc / ss / 2), int(foot_y - oy / ss)

# accents --------------------------------------------------------------
def eyes(color, slit=True, size=1.0):
    def f(d, P, hp, r, facing, t):
        hx2, hy2 = P('head')
        for s in (-1, 1):
            ex = hx2 + facing * (0.35 + s * 0.38) * r
            w, h = 0.30 * r * size, 0.09 * r * size
            if facing != 0 and s == -1 and abs(facing) == 1 and False: continue
            d.polygon([(ex - w, hy2 + 0.05 * r), (ex, hy2 - h), (ex + w, hy2 + 0.02 * r), (ex, hy2 + h * 0.6)], fill=color + (255,))
    return f

def ren_streak(d, P, hp, r, facing, t):
    hx2, hy2 = P('head')
    pts = [(-0.55, -0.7), (-0.35, -1.45), (-0.15, -0.9), (-0.05, -0.2), (-0.35, -0.1)]
    d.polygon([(hx2 + facing * a * r, hy2 + b * r) for a, b in pts], fill=CRIMSON + (255,))

def ren_ring(d, P, hp, r, facing, t):
    x, y = P('ha_l'); s = 0.012 * hp
    d.ellipse([x - s, y - s, x + s, y + s], fill=CRIMSON + (255,))

def ren_lining(d, P, hp, r, facing, t):
    hl, hr = P('hip_l'), P('hip_r'); hx_, hy_ = (hl[0] + hr[0]) / 2, (hl[1] + hr[1]) / 2
    d.line([(hx_ + 0.02 * hp, hy_), (hx_ + 0.03 * hp, hy_ + 0.2 * hp)], fill=CRIMSON + (200,), width=max(2, int(0.008 * hp)))

def aiko_ribbon(d, P, hp, r, facing, t):
    hx2, hy2 = P('head'); x, y = hx2 - facing * 1.1 * r, hy2 + 0.6 * r; s = 0.35 * r
    d.polygon([(x, y), (x - s, y - s * 0.7), (x - s, y + s * 0.7)], fill=CRIMSON + (255,))
    d.polygon([(x, y), (x + s, y - s * 0.7), (x + s, y + s * 0.7)], fill=CRIMSON + (255,))

def hana_blade(d, P, hp, r, facing, t):
    x, y = P('ha_r'); L = 0.75 * hp
    ang = math.radians(-70 if facing > 0 else -110)
    d.line([(x, y), (x + math.cos(ang) * L * facing, y + math.sin(ang) * L)], fill=ICE + (255,), width=max(3, int(0.012 * hp)))

def king_crown(d, P, hp, r, facing, t):
    hx2, hy2 = P('head'); cy = hy2 - 2.2 * r + math.sin(t * 2) * 0.15 * r; w = 1.3 * r
    pts = [(-1, 0), (-1, -0.8), (-0.6, -0.3), (-0.25, -1.1), (0, -0.4), (0.3, -1.0), (0.55, -0.1), (1, -0.9), (1, 0)]
    d.polygon([(hx2 + a * w, cy + b * w * 0.7) for a, b in pts], fill=(30, 26, 34, 255), outline=GOLD + (255,), width=max(2, int(0.15 * r)))
    for s in (-1, 1):
        ex = hx2 + s * 0.38 * r
        d.ellipse([ex - 0.2 * r, hy2 - 0.15 * r, ex + 0.2 * r, hy2 + 0.15 * r], fill=CRIMSON + (255,))

REN = dict(kind='ren', h=900, rim=hx('ff4b5c'), accents=[ren_lining, ren_streak, ren_ring, eyes(hx('cfd6e6'))])
AIKO = dict(kind='aiko', h=700, head=0.92, rim=hx('ffb3c1'), accents=[aiko_ribbon])
HANA = dict(kind='hana', h=920, rim=ICE, accents=[hana_blade, eyes(ICE)])
KING = dict(kind='king', h=1300, rim=hx('ff3030'), bulk=1.7, head=0.9, accents=[king_crown])
NPC = dict(kind='npc', h=860, rim=hx('6b6f86'), accents=[])
STATUE = dict(kind='statue', h=1000, rim=hx('8a7a6a'), bulk=1.4, accents=[])

# ------------------------------------------------------------------ UI
def system_window(title, lines, w=860, buttons=None, progress=1.0, accent=CRIMSON):
    """Crimson/gold holographic System window. progress 0..1 reveals the text."""
    lh = 66
    hgt = 150 + lh * len(lines) + (130 if buttons else 0)
    img = Image.new('RGBA', (w, hgt), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w - 1, hgt - 1], fill=(14, 8, 18, 215))
    for i, a in ((0, 255), (6, 120)):
        d.rectangle([i, i, w - 1 - i, hgt - 1 - i], outline=accent + (a,), width=3)
    c = 34
    for x0, y0, sx, sy in ((0, 0, 1, 1), (w - 1, 0, -1, 1), (0, hgt - 1, 1, -1), (w - 1, hgt - 1, -1, -1)):
        d.line([(x0, y0 + sy * c), (x0, y0), (x0 + sx * c, y0)], fill=GOLD + (255,), width=6)
    d.text((w / 2, 62), title, font=font(CINZEL, 50), fill=GOLD + (255,), anchor='mm')
    d.line([(60, 106), (w - 60, 106)], fill=accent + (180,), width=2)
    total = sum(len(s) for s, _ in lines); shown = int(total * clamp(progress))
    y = 150
    for s, col in lines:
        n = max(0, min(len(s), shown)); shown -= len(s)
        d.text((w / 2, y), s[:n], font=font(CINZEL, 40), fill=(col or WHITE) + (255,), anchor='mm')
        y += lh
    if buttons and progress >= 1:
        bw = 230; gap = 60; x = (w - (bw * len(buttons) + gap * (len(buttons) - 1))) / 2
        for label, hot in buttons:
            d.rectangle([x, y + 10, x + bw, y + 90], fill=(accent + (90,)) if hot else (40, 30, 50, 160), outline=GOLD + (255,), width=3)
            d.text((x + bw / 2, y + 50), label, font=font(CINZEL, 40), fill=WHITE + (255,), anchor='mm')
            x += bw + gap
    return img

def caption(text, frac=1.0, size=88, color=WHITE, hl=None):
    """TikTok-style caption: words pop in by frac; hl = set of word indexes in gold."""
    words = text.split()
    n = max(1, math.ceil(len(words) * clamp(frac))) if frac > 0 else 0
    f = font(BEBAS, size)
    lines, cur = [], []
    maxw = W - 160
    tmp = ImageDraw.Draw(Image.new('L', (10, 10)))
    for i, wd in enumerate(words):
        test = ' '.join(x for _, x in cur + [(i, wd)])
        if tmp.textlength(test, font=f) > maxw and cur: lines.append(cur); cur = []
        cur.append((i, wd))
    if cur: lines.append(cur)
    img = Image.new('RGBA', (W, (size + 14) * len(lines) + 40), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    y = 20
    for ln in lines:
        full = ' '.join(x for _, x in ln); x = (W - tmp.textlength(full, font=f)) / 2
        for i, wd in ln:
            if i < n:
                col = GOLD if hl and i in hl else color
                d.text((x, y), wd, font=f, fill=col + (255,), stroke_width=7, stroke_fill=(0, 0, 0, 255))
            x += tmp.textlength(wd + ' ', font=f)
        y += size + 14
    return img

def speaker_tag(name, color):
    f = font(BEBAS, 54); tmp = ImageDraw.Draw(Image.new('L', (10, 10))); w = int(tmp.textlength(name, font=f)) + 50
    img = Image.new('RGBA', (w, 76), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w - 1, 75], fill=color + (230,)); d.text((25, 10), name, font=f, fill=(0, 0, 0, 255))
    return img

# ------------------------------------------------------------------ finishing
_rng = np.random.default_rng(7)
_grain = [(_rng.standard_normal((H // 2, W // 2)) * 6).astype(np.float32) for _ in range(6)]
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
_vig = np.clip(1 - 0.55 * (((_xx - W / 2) / (W * 0.75)) ** 2 + ((_yy - H / 2) / (H * 0.62)) ** 2), 0.25, 1)[:, :, None]

def finish(a, fi, bloom=0.35, grade=(1.0, 0.96, 1.04)):
    small = to_img(a).resize((W // 6, H // 6), Image.BILINEAR)
    s = np.asarray(small).astype(np.float32)
    bright = np.clip(s - 150, 0, 255) * 1.6
    b = np.asarray(to_img(bright).filter(ImageFilter.GaussianBlur(8)).resize((W, H), Image.BILINEAR)).astype(np.float32)
    a = a + b * bloom
    a = a * np.array(grade, np.float32) * _vig
    g = _grain[fi % len(_grain)]
    a = a + np.repeat(np.repeat(g, 2, 0), 2, 1)[:, :, None]
    return np.clip(a, 0, 255).astype(np.uint8)

def camera(bg, t, z0=1.0, z1=1.08, px=(0.5, 0.5), py=None, shake=0.0, fi=0):
    """bg: oversized PIL image. Crops a W×H window at zoom z (1.0 = fit) centred on px, moving to py."""
    z = lerp(z0, z1, ease(t))
    cx = lerp(px[0], (py or px)[0], ease(t)); cy = lerp(px[1], (py or px)[1], ease(t))
    bw, bh = bg.size
    sc = max(W / bw, H / bh) * z
    cw, ch = min(bw - 0.01, W / sc), min(bh - 0.01, H / sc)
    x0 = cx * bw - cw / 2; y0 = cy * bh - ch / 2
    if shake:
        r = np.random.default_rng(fi); x0 += r.uniform(-1, 1) * shake / sc; y0 += r.uniform(-1, 1) * shake / sc
    x0 = clamp(x0, 0, bw - cw); y0 = clamp(y0, 0, bh - ch)
    return arr(bg.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch)))


def kneel(lean=0.0):
    """Ren down on one knee, head bowed (facing right)."""
    return dict(head=(0.06 + lean, -0.66), neck=(0.04 + lean, -0.58), sh_l=(-0.04 + lean, -0.56), sh_r=(0.08 + lean, -0.55),
                el_l=(0.02, -0.40), el_r=(0.16, -0.40), ha_l=(0.10, -0.28), ha_r=(0.22, -0.30),
                hip_l=(-0.04, -0.30), hip_r=(0.04, -0.30), kn_l=(0.16, -0.30), kn_r=(-0.05, -0.02),
                ft_l=(0.17, -0.02), ft_r=(-0.22, -0.02))

def crawl(phase):
    s = math.sin(phase)
    return dict(head=(0.36, -0.36), neck=(0.30, -0.33), sh_l=(0.24, -0.32), sh_r=(0.26, -0.31),
                el_l=(0.34 + 0.05 * s, -0.18), el_r=(0.36 - 0.05 * s, -0.17), ha_l=(0.46 + 0.06 * s, -0.03), ha_r=(0.48 - 0.06 * s, -0.03),
                hip_l=(-0.10, -0.22), hip_r=(-0.08, -0.22), kn_l=(-0.02 + 0.04 * s, -0.05), kn_r=(-0.04 - 0.04 * s, -0.05),
                ft_l=(-0.30, -0.02), ft_r=(-0.32, -0.04))

def sit(): return dict(head=(0.0, -0.66), neck=(0, -0.58), sh_l=(-0.09, -0.56), sh_r=(0.09, -0.56), el_l=(-0.04, -0.42), el_r=(0.12, -0.40),
                       ha_l=(0.10, -0.36), ha_r=(0.20, -0.36), hip_l=(-0.04, -0.30), hip_r=(0.04, -0.30), kn_l=(0.22, -0.30), kn_r=(0.24, -0.31),
                       ft_l=(0.22, -0.02), ft_r=(0.26, -0.02))

def lying(): return dict(head=(-0.40, -0.10), neck=(-0.32, -0.09), sh_l=(-0.28, -0.09), sh_r=(-0.27, -0.10), el_l=(-0.12, -0.10), el_r=(-0.12, -0.12),
                         ha_l=(0.0, -0.10), ha_r=(0.0, -0.12), hip_l=(0.02, -0.08), hip_r=(0.02, -0.09), kn_l=(0.24, -0.08), kn_r=(0.24, -0.09),
                         ft_l=(0.45, -0.08), ft_r=(0.45, -0.09))

def pushup(y):
    """y 0 = up, 1 = down (side view, facing right)."""
    dy = 0.08 * y
    return dict(head=(0.48, -0.30 + dy), neck=(0.42, -0.27 + dy), sh_l=(0.36, -0.26 + dy), sh_r=(0.37, -0.25 + dy),
                el_l=(0.36 + 0.06 * y, -0.14 + dy * 0.4), el_r=(0.38 + 0.06 * y, -0.13 + dy * 0.4), ha_l=(0.37, -0.02), ha_r=(0.39, -0.02),
                hip_l=(0.02, -0.20 + dy * 0.7), hip_r=(0.03, -0.20 + dy * 0.7), kn_l=(-0.16, -0.12 + dy * 0.4), kn_r=(-0.15, -0.12 + dy * 0.4),
                ft_l=(-0.36, -0.03), ft_r=(-0.35, -0.03))

def draw_eye(w, iris=(140, 150, 170), reflect=None, glow_amt=0.0, open_=1.0):
    """Big anime eye close-up (RGBA). reflect: colour of a window reflected in the iris."""
    h = int(w * 0.55)
    ss = 2; Wd, Hd = w * ss, h * ss
    img = Image.new('RGBA', (Wd, Hd), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    cx, cy = Wd / 2, Hd / 2
    top = [(cx - Wd * 0.46, cy + Hd * 0.05), (cx - Wd * 0.25, cy - Hd * 0.32 * open_), (cx + Wd * 0.05, cy - Hd * 0.40 * open_),
           (cx + Wd * 0.33, cy - Hd * 0.28 * open_), (cx + Wd * 0.47, cy - Hd * 0.02)]
    bot = [(cx + Wd * 0.47, cy - Hd * 0.02), (cx + Wd * 0.25, cy + Hd * 0.22 * open_), (cx - Wd * 0.05, cy + Hd * 0.26 * open_),
           (cx - Wd * 0.32, cy + Hd * 0.18 * open_), (cx - Wd * 0.46, cy + Hd * 0.05)]
    mask = Image.new('L', (Wd, Hd), 0); ImageDraw.Draw(mask).polygon(top + bot, fill=255)
    eye = Image.new('RGBA', (Wd, Hd), (232, 228, 236, 255))
    ed = ImageDraw.Draw(eye)
    ir = Hd * 0.42
    for i in range(30):   # iris gradient: dark top, light bottom
        f = i / 29
        col = tuple(int(c * (0.35 + 0.75 * f)) for c in iris)
        rr = ir * (1 - f * 0.55)
        ed.ellipse([cx - rr * 0.92, cy - rr + Hd * 0.03, cx + rr * 0.92, cy + rr + Hd * 0.03], fill=col + (255,))
    ed.ellipse([cx - ir * 0.92, cy - ir + Hd * 0.03, cx + ir * 0.92, cy + ir + Hd * 0.03], outline=(20, 18, 26, 255), width=int(ss * 4))
    ed.ellipse([cx - ir * 0.38, cy - ir * 0.42, cx + ir * 0.38, cy + ir * 0.5], fill=(12, 10, 16, 255))   # pupil
    if reflect:
        ed.rectangle([cx - ir * 0.55, cy - ir * 0.15, cx + ir * 0.15, cy + ir * 0.25], outline=reflect + (230,), width=int(ss * 5))
        ed.line([(cx - ir * 0.45, cy + ir * 0.05), (cx + ir * 0.05, cy + ir * 0.05)], fill=reflect + (200,), width=int(ss * 3))
    ed.ellipse([cx + ir * 0.18, cy - ir * 0.62, cx + ir * 0.48, cy - ir * 0.32], fill=(255, 255, 255, 245))   # highlights
    ed.ellipse([cx - ir * 0.55, cy + ir * 0.3, cx - ir * 0.38, cy + ir * 0.47], fill=(255, 255, 255, 200))
    shade = Image.new('RGBA', (Wd, Hd), (0, 0, 0, 0)); ImageDraw.Draw(shade).polygon(top + [(cx + Wd * 0.47, cy + Hd * 0.12), (cx - Wd * 0.46, cy + Hd * 0.15)], fill=(40, 20, 50, 90))
    eye = Image.alpha_composite(eye, shade)
    img.paste(eye, (0, 0), mask)
    d.line(top, fill=(14, 10, 18, 255), width=int(ss * w * 0.035), joint='curve')   # upper lash line
    d.line([top[-2], (cx + Wd * 0.50, cy - Hd * 0.12)], fill=(14, 10, 18, 255), width=int(ss * w * 0.03))
    d.line(bot[1:-1], fill=(30, 20, 30, 200), width=int(ss * w * 0.008))
    brow = [(cx - Wd * 0.42, cy - Hd * 0.62), (cx, cy - Hd * 0.80), (cx + Wd * 0.45, cy - Hd * 0.66)]
    d.line(brow, fill=(14, 10, 18, 255), width=int(ss * w * 0.03), joint='curve')
    img = img.resize((w, h), Image.LANCZOS)
    return img

def glow_at(a, layer, x, y, radius, strength):
    full = Image.new('RGBA', (a.shape[1], a.shape[0]), (0, 0, 0, 0)); full.paste(layer, (int(x), int(y)), layer)
    return add(a, glow(full, radius, strength))
