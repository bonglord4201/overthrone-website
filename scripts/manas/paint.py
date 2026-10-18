# Procedural pixel-art painters for the OVERTHRONE v4 cosmetics. Every painter returns (main, glow): two RGBA PIL images of
# the same size. main = lit, opaque (alpha 0 or 255 only, so the mod draws it as cutout with depth); glow = full-bright
# overlay (also alpha 0/255) or None. Sprite space: x right, y down; the TOP row is the root of a feather/blade.
import math
import numpy as np
from PIL import Image

def C(c): return np.array(c[:3], float)
def mixc(a, b, t):
    t = np.clip(np.asarray(t, float), 0, 1)[..., None] if np.ndim(t) else max(0.0, min(1.0, t))
    return C(a) * (1 - t) + C(b) * t
def shade(c, k): return np.clip(C(c) * k, 0, 255)

def erode(mask):
    m = mask.copy()
    m[1:, :] &= mask[:-1, :]; m[:-1, :] &= mask[1:, :]; m[:, 1:] &= mask[:, :-1]; m[:, :-1] &= mask[:, 1:]
    m[0, :] = m[-1, :] = False; m[:, 0] = m[:, -1] = False
    return m

def to_img(rgb, mask):
    h, w = mask.shape
    out = np.zeros((h, w, 4), np.uint8)
    out[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8); out[..., 3] = np.where(mask, 255, 0)
    return Image.fromarray(out, 'RGBA')

def grid(w, h):
    y, x = np.mgrid[0:h, 0:w]
    return x + 0.5, y + 0.5

def rng(seed): return np.random.default_rng(abs(hash(seed)) % (2 ** 32))

def finish(rgb, inside, outline_col=None, outline_k=0.45):
    """Dark 1-pixel outline around the shape (what makes pixel art readable at a distance)."""
    edge = inside & ~erode(inside)
    if outline_col is None: rgb[edge] = rgb[edge] * outline_k
    else: rgb[edge] = C(outline_col)
    return rgb

# ---------------------------------------------------------------- feathers
def feather(w, h, root, tip, edge=None, shaft=None, kind='primary', glow_tip=None, tip_band=None, jag=False, seed=0, stars=None, outline_k=0.62, streak=None):
    """w x h pixels. kind: primary (asymmetric, long), secondary, covert (short, round), scale (tiny round), flame
    (tip splits into flame tongues). glow_tip: colour of a glowing tip (goes on the glow layer). tip_band: solid tip colour."""
    X, Y = grid(w, h); u = (X / w) * 2 - 1; t = Y / h
    if kind in ('covert', 'scale'):
        half = np.where(t < 0.12, 0.55 + t * 3.5, np.sqrt(np.clip(1 - np.clip((t - 0.12) / 0.88, 0, 1) ** 2.2, 0, 1)))
        half = np.minimum(half, 0.98); cen = 0.0
    else:
        rise = np.clip((t - 0.03) / 0.22, 0, 1) ** 0.6
        half = 0.24 + 0.74 * rise - 0.08 * np.clip((t - 0.3) / 0.3, 0, 1)
        taper = np.sqrt(np.clip(1 - ((t - 0.55) / 0.45) ** 2, 0, 1))
        half = np.where(t > 0.55, half * taper, half)
        cen = (-0.16 if kind == 'primary' else -0.05) + 0.1 * t * t          # rachis nearer the leading (left) edge, curved
    inside = np.abs(u - cen) <= half
    if kind == 'flame':
        tongue = (np.sin(u * 7.0 + 1.3) * 0.5 + 0.5) * 0.18
        inside &= t < 0.97 - tongue
    if jag:
        inside &= ~((((Y.astype(int) + (u > 0) * 2) % 6) == 0) & (np.abs(u - cen) > half * 0.7))
    k = np.clip(t * 1.05, 0, 1) ** 0.85
    rgb = mixc(root, tip, k)
    lead = u < cen
    rgb = np.where(lead[..., None], rgb * 1.08, rgb * 0.92)                      # lit leading vane, shaded trailing vane
    barb = ((Y * 0.5 + np.abs(u - cen) * w * 0.5) % 4.0) < 0.9                 # diagonal barb lines
    rgb = np.where((barb & (np.abs(u - cen) > 0.12))[..., None], rgb * 0.95, rgb)
    if streak is not None:   # dark accent streaks in the trailing vane (lower half)
        sm = (~lead) & (t > 0.42) & (t < 0.86) & (np.abs(u - cen - 0.42) < 0.13)
        rgb[sm] = C(streak)
    if tip_band is not None:
        rgb = np.where((t > 0.84)[..., None], C(tip_band) * np.ones_like(rgb), rgb)
    if edge is not None:                                                        # bright rim on the leading edge
        rim = inside & ~erode(inside) & lead
        rgb[rim] = C(edge)
    if shaft is not None and kind not in ('scale',):
        sh = (np.abs(u - cen) < 1.2 / w) & (t < 0.9)
        rgb[sh] = C(shaft)
    rgb = finish(rgb, inside, outline_k=outline_k)
    if edge is not None:
        rim2 = inside & ~erode(inside) & lead & (t > 0.1)
        rgb[rim2] = C(edge)
    main = to_img(rgb, inside)
    glow = None
    gm = np.zeros_like(inside); g = np.zeros(rgb.shape)
    if glow_tip is not None:
        tm = inside & (t > (0.8 if kind != 'flame' else 0.62))
        gm |= tm; g = np.where(tm[..., None], mixc(glow_tip, (255, 255, 230), np.clip((t - 0.8) * 3, 0, 1)), g)
    if stars is not None:
        r = rng(('fst', w, h, seed)); sm = inside & erode(inside) & (r.random((h, w)) > 0.94)
        gm |= sm; g = np.where(sm[..., None], C(stars), g)
    if gm.any(): glow = to_img(g, gm)
    return main, glow

# ---------------------------------------------------------------- crystals / blades / plates
def crystal(w, h, core, edge, glow=None, stars=False, seed=0):
    """Long faceted crystal (pointed at the bottom, flat-ish top). Two facets + a bright ridge; glowing core line."""
    X, Y = grid(w, h); u = (X / w) * 2 - 1; t = Y / h
    half = np.where(t < 0.08, 0.55 + t * 5.5, np.where(t < 0.55, 1.0, 1 - (t - 0.55) / 0.45))
    inside = np.abs(u) <= half * 0.98
    left = u < 0
    rgb = np.where(left[..., None], mixc(edge, core, 0.85 - np.abs(u) * 0.5) * 1.15, mixc(edge, core, 0.55 - np.abs(u) * 0.4) * 0.8)
    ridge = np.abs(u) < 1.0 / w * 1.6
    rgb[ridge & inside] = mixc(core, (255, 255, 255), 0.6)
    band = (((Y + X * 0.6) % 9) < 1.2) & left            # glints
    rgb[band & inside] = rgb[band & inside] * 1.2 + 25
    if stars:
        r = rng(('st', w, h, seed)); st = r.random((h, w)) > 0.93
        rgb[st & inside] = (255, 255, 255)
    rgb = finish(rgb, inside, outline_col=shade(edge, 0.5))
    main = to_img(rgb, inside)
    g = None
    if glow is not None:
        gm = inside & (np.abs(u + 0.25) < 0.1) & (t > 0.18) & (t < 0.7)
        g = to_img(np.where(gm[..., None], mixc(glow, (255, 255, 255), 0.35 - np.abs(u)), 0), gm)
    return main, g

def blade(w, h, dark, light, glow=None, seed=0):
    """Armoured metal blade: bevelled plate, panel lines, rivets; glowing cutting edge on the glow layer."""
    X, Y = grid(w, h); u = (X / w) * 2 - 1; t = Y / h
    half = np.where(t < 0.62, 1.0, 1 - (t - 0.62) / 0.38 * 0.95)
    inside = (u >= -0.98) & (u <= -0.98 + 1.96 * half)                         # straight left (spine), angled right edge to a point
    rgb = mixc(dark, light, 0.25 + (1 - t) * 0.25) * np.ones((h, w, 1))
    spine = inside & (u < -0.6)
    rgb[spine] = shade(light, 0.9)
    lines = inside & ((np.abs((t * h) % (h / 3.5)) < 0.9))
    rgb[lines] = rgb[lines] * 0.6
    riv = inside & (np.abs(u + 0.79) < 1.0 / w * 1.5) & (np.abs(((t * h) % (h / 3.5)) - 3) < 0.8)
    rgb[riv] = shade(light, 1.3)
    rgb = finish(rgb, inside)
    main = to_img(rgb, inside)
    g = None
    if glow is not None:
        e = inside & ~erode(inside) & (u > -0.5)
        e2 = e | (inside & (np.abs(u - (-0.98 + 1.96 * half) + 2.0 / w) < 1.0 / w) )
        g = to_img(np.where(e2[..., None], C(glow), 0), e2)
    return main, g

def plate(w, h, dark, rim, gem=None, seed=0):
    """Armour plate / scale: rounded bottom, bevel, coloured rim; optional gem (glow)."""
    X, Y = grid(w, h); u = (X / w) * 2 - 1; t = Y / h
    half = np.where(t < 0.55, 1.0, np.sqrt(np.clip(1 - ((t - 0.55) / 0.45) ** 2, 0, 1)))
    inside = np.abs(u) <= half * 0.98
    rgb = mixc(shade(dark, 1.5), dark, t) * np.ones((h, w, 1))
    rgb = np.where((u < 0)[..., None], rgb * 1.15, rgb * 0.85)
    ring = inside & ~erode(erode(inside))
    rgb[ring] = C(rim)
    rgb = finish(rgb, inside)
    main = to_img(rgb, inside)
    g = None
    if gem is not None:
        gm = (np.abs(u) < 0.32) & (np.abs(t - 0.45) < 0.18)
        g = to_img(np.where(gm[..., None], C(gem), 0), gm)
    return main, g

def leaf(w, h, base, vein, seed=0):
    X, Y = grid(w, h); u = (X / w) * 2 - 1; t = Y / h
    half = np.sin(np.pi * np.clip(t * 1.03, 0, 1)) ** 0.8
    inside = np.abs(u) <= half * 0.98
    rgb = mixc(shade(base, 1.2), shade(base, 0.8), t) * np.ones((h, w, 1))
    rgb = np.where((u < 0)[..., None], rgb * 1.1, rgb * 0.9)
    v = inside & ((np.abs(u) < 1.0 / w * 1.4) | (np.abs(np.abs(u) - (t - 0.15) * 1.6 % 0.5) < 0.06))
    rgb[v] = C(vein)
    rgb = finish(rgb, inside)
    return to_img(rgb, inside), None

def fur(w, h, base, tip, glow=None, seed=0):
    """Fluffy tail segment: oval with strand texture, light belly, coloured tip toward the bottom."""
    X, Y = grid(w, h); u = (X / w) * 2 - 1; t = Y / h
    half = np.sqrt(np.clip(1 - ((t - 0.5) / 0.5) ** 2, 0, 1)) * 0.98 + 0.02
    r = rng(('fur', w, h, seed)); jit = r.random((h, w)) * 0.1
    inside = np.abs(u) <= half - jit * (np.abs(u) > half - 0.15)
    rgb = mixc(base, tip, np.clip((t - 0.45) * 2.0, 0, 1)) * np.ones((h, w, 1))
    strands = ((X * 1.3 + np.sin(Y * 0.9) * 1.5) % 3) < 1
    rgb = np.where(strands[..., None], rgb * 0.88, rgb * 1.05)
    rgb = finish(rgb, inside, outline_k=0.6)
    main = to_img(rgb, inside)
    g = None
    if glow is not None:
        gm = inside & (t > 0.7) & erode(inside)
        g = to_img(np.where(gm[..., None], mixc(glow, (255, 255, 255), (t - 0.7) * 1.5), 0), gm)
    return main, g

def soft(w, h, col, peak=150, ring=None):
    """Soft see-through light blob (alpha 1..peak) for the soft-glow texture. ring=(r0, r1) makes a glowing ring."""
    X, Y = grid(w, h); u = (X / w) * 2 - 1; v = (Y / h) * 2 - 1; d = np.sqrt(u * u + v * v)
    if ring: a = np.exp(-((d - ring[0]) / ring[1]) ** 2)
    else: a = np.clip(1 - d, 0, 1) ** 1.6
    a = (a * peak).astype(int); a = np.where(a > 2, np.clip(a, 3, 254), 0)
    out = np.zeros((h, w, 4), np.uint8); out[..., :3] = C(col).astype(np.uint8); out[..., 3] = a
    return Image.fromarray(out, 'RGBA')

def solid(c, n=2): return Image.new('RGBA', (n, n), tuple(int(v) for v in c[:3]) + (255,))

def dot(c, n=3, core=None):
    """A tiny glowing particle sprite (square with a brighter centre)."""
    a = np.zeros((n, n, 4), np.uint8); a[..., :3] = C(c); a[..., 3] = 255
    if core is not None and n >= 3: a[n // 2, n // 2, :3] = C(core)
    return Image.fromarray(a, 'RGBA')

# ---------------------------------------------------------------- polygon panels painted in model space
def point_in_poly(px, py, poly):
    inside = np.zeros(px.shape, bool); n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % n]
        cond = ((y1 > py) != (y2 > py)) & (px < (x2 - x1) * (py - y1) / ((y2 - y1) + 1e-12) + x1)
        inside ^= cond
    return inside

def seg_dist(px, py, a, b):
    ax, ay = a; bx, by = b; dx, dy = bx - ax, by - ay
    L2 = dx * dx + dy * dy + 1e-12
    t = np.clip(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1)
    return np.hypot(px - (ax + t * dx), py - (ay + t * dy))

def membrane(poly, veins, D, base, edge_col, vein_col, glow_vein=None, holes=0, stars=False, seed=0, frame=None):
    """Paints a wing membrane in MODEL units. poly: [(x, y)] (Y up). veins: [((x,y),(x,y))]. D: pixels per unit.
    Returns (main, glow, (x0, y0, x1, y1)) where the image's column 0 is at x1 (the north/back face shows u0 at +x)
    and row 0 at y1 (top)."""
    xs = [p[0] for p in poly]; ys = [p[1] for p in poly]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    if frame: x0, y0, x1, y1 = frame
    w = max(2, int(math.ceil((x1 - x0) * D))); h = max(2, int(math.ceil((y1 - y0) * D)))
    x1 = x0 + w / D; y1 = y0 + h / D
    C_, R_ = np.meshgrid(np.arange(w) + 0.5, np.arange(h) + 0.5)
    px = x1 - C_ / D; py = y1 - R_ / D
    inside = point_in_poly(px, py, poly)
    r = rng(('mem', seed))
    if holes:   # tears: ragged bites out of the free (lowest) edge plus a few small rips near it
        edge_pts = sorted(poly, key=lambda p: p[1])[:max(3, len(poly) // 2)]
        for i in range(holes):
            ex, ey = edge_pts[r.integers(len(edge_pts))]
            hr = r.uniform(0.8, 2.0) if i % 3 else r.uniform(0.4, 0.8)
            hx = ex + r.uniform(-1.5, 1.5); hy = ey + r.uniform(0.0, 2.5) * (1 if i % 3 else 2)
            inside &= np.hypot((px - hx) * 1.0, (py - hy) * 1.6) > hr
    vd = np.full(px.shape, 99.0)
    for a, b in veins: vd = np.minimum(vd, seg_dist(px, py, a, b))
    rgb = mixc(shade(base, 1.35), shade(base, 0.7), np.clip(vd / 4.0, 0, 1)) * np.ones((h, w, 1))
    tex = (np.sin(px * 3.1 + py * 1.7) * np.sin(py * 2.3 - px * 0.7)) > 0.55
    rgb = np.where(tex[..., None], rgb * 0.92, rgb)
    vm = inside & (vd < 0.32)
    rgb[vm] = C(vein_col)
    if stars:
        st = r.random((h, w)) > 0.965
        rgb[st & inside] = rgb[st & inside] * 0.5 + 120
    rgb = finish(rgb, inside, outline_col=edge_col)
    main = to_img(rgb, inside)
    g = None
    if glow_vein is not None or stars:
        gm = np.zeros_like(inside)
        if glow_vein is not None: gm |= inside & (vd < 0.22)
        if stars: gm |= inside & (r.random((h, w)) > 0.985)
        gc = C(glow_vein if glow_vein is not None else (255, 255, 255))
        g = to_img(np.where(gm[..., None], gc, 0), gm)
    return main, g, (x0, y0, x1, y1)

def facet(w, h, top, bottom, hi=None):
    """Fully opaque gradient for solid 3D crystal blocks: light streak on the left, darker right edge."""
    X, Y = grid(w, h); t = Y / h; u = X / w
    rgb = mixc(top, bottom, t) * np.ones((h, w, 1))
    rgb = np.where((u < 0.3)[..., None], np.clip(rgb * 1.18 + 12, 0, 255), rgb)
    rgb = np.where((u > 0.8)[..., None], rgb * 0.78, rgb)
    if hi is not None: rgb[(np.abs(u - 0.18) < 0.1) & (t < 0.8)] = C(hi)
    return to_img(rgb, np.ones((h, w), bool))

def magic_circle(n, gold, light, dark, part='outer', seed=0):
    """n x n glowing sigil. part='outer': double ring with a band of runes; 'inner': hexagram, inner rings, sun."""
    X, Y = grid(n, n); u = X / n * 2 - 1; v = Y / n * 2 - 1
    r = np.sqrt(u * u + v * v); a = (np.degrees(np.arctan2(v, u)) + 360) % 360
    px = 2.0 / n                                    # one pixel in these units
    on = np.zeros((n, n), bool); hi = np.zeros((n, n), bool)
    if part == 'outer':
        on |= (r > 0.93) & (r < 0.99); hi |= (r > 0.95) & (r < 0.97)
        on |= (r > 0.79) & (r < 0.82)
        rr = rng(('runes', seed)); bins = 36
        bits = rr.random((bins, 3, 3)) > 0.45
        bi = (a / (360 / bins)).astype(int) % bins
        lu = ((a % (360 / bins)) / (360 / bins) * 4 - 0.5); lv = (r - 0.835) / 0.085 * 3
        gu = np.floor(lu).astype(int); gv = np.floor(lv).astype(int)
        ok = (gu >= 0) & (gu < 3) & (gv >= 0) & (gv < 3) & (r > 0.835) & (r < 0.92)
        on |= ok & bits[bi, np.clip(gv, 0, 2), np.clip(gu, 0, 2)]
        for k in range(8):                           # small knots on the outer ring
            ang = math.radians(k * 45 + 22.5); cx, cy = math.cos(ang) * 0.96, math.sin(ang) * 0.96
            d = np.hypot(u - cx, v - cy); on |= d < 0.05; hi |= d < 0.025
    else:
        for rot in (90, 270):                        # hexagram: two triangles
            pts = [(math.cos(math.radians(rot + k * 120)) * 0.76, math.sin(math.radians(rot + k * 120)) * 0.76) for k in range(3)]
            for k in range(3):
                d = seg_dist(u, v, pts[k], pts[(k + 1) % 3]); on |= d < px * 1.3
        for k in range(6):
            ang = math.radians(90 + k * 60); cx, cy = math.cos(ang) * 0.76, math.sin(ang) * 0.76
            d = np.hypot(u - cx, v - cy); on |= (d > 0.06) & (d < 0.06 + px * 1.6); hi |= d < 0.03
        on |= (r > 0.40) & (r < 0.40 + px * 1.8); on |= (r > 0.30) & (r < 0.30 + px * 1.2)
        on |= r < 0.12; hi |= r < 0.06
        for k in range(12):                          # rays of the inner sun
            ang = math.radians(k * 30); d = seg_dist(u, v, (math.cos(ang) * 0.14, math.sin(ang) * 0.14), (math.cos(ang) * 0.27, math.sin(ang) * 0.27))
            on |= d < px * (1.2 if k % 2 else 0.8)
    rgb = np.where(hi[..., None], C(light) * np.ones((n, n, 1)), C(gold) * np.ones((n, n, 1)))
    edge = on & ~erode(on); rgb[edge] = C(dark)
    rgb[hi & on] = C(light)
    return to_img(rgb, on)

def eyes_sprite(w, h, iris, style='round', sep=0.5, ew=0.32, eh=0.62, pupil=(15, 12, 25), lid=None):
    """Two big glossy chibi eyes on a transparent sprite (w x h px). style: round | tall (slime) | sharp (dragon/fox)."""
    X, Y = grid(w, h); u = X / w; v = Y / h
    on = np.zeros((h, w), bool); rgb = np.zeros((h, w, 3))
    for cx in (0.5 - sep / 2, 0.5 + sep / 2):
        du = (u - cx) / (ew / 2); dv = (v - 0.5) / (eh / 2)
        if style == 'sharp':
            inside = (du ** 2 + dv ** 2 < 1) & (dv > -0.75 + 0.5 * np.abs(du))
        else:
            inside = du ** 2 + dv ** 2 < 1
        on |= inside
        d = np.sqrt(du ** 2 + dv ** 2)
        col = np.where((d < 0.78)[..., None], mixc(P_shade(iris, 1.35), P_shade(iris, 0.7), np.clip((dv + 1) / 2, 0, 1)), C(pupil) * np.ones((h, w, 1)))
        col = np.where(((np.abs(du) < 0.3) & (np.abs(dv) < 0.42))[..., None], C(pupil) * np.ones((h, w, 1)), col)
        rgb = np.where(inside[..., None], col, rgb)
        hl = (((du + 0.35) ** 2 + (dv + 0.38) ** 2) < 0.07) | (((du - 0.3) ** 2 + (dv - 0.35) ** 2) < 0.025)
        rgb[inside & hl] = (255, 255, 255)
    edge = on & ~erode(on); rgb[edge] = C(pupil)
    return to_img(rgb, on)

def P_shade(c, k): return shade(c, k)

def face_marks(w, h, blush=(255, 140, 160), mouth=(60, 30, 35), kind='w'):
    """Blush + a tiny mouth on a transparent sprite (placed just under the eyes)."""
    X, Y = grid(w, h); u = X / w; v = Y / h
    on = np.zeros((h, w), bool); rgb = np.zeros((h, w, 3))
    for cx in (0.18, 0.82):
        b = ((u - cx) / 0.12) ** 2 + ((v - 0.35) / 0.18) ** 2 < 1
        on |= b; rgb[b] = C(blush)
    if kind == 'w':
        mth = (np.abs(v - (0.45 + np.abs(((u - 0.5) * 8) % 2 - 1) * 0.18)) < 0.08) & (np.abs(u - 0.5) < 0.12)
    else:
        mth = (np.abs(v - (0.45 + np.abs(u - 0.5) * 1.2)) < 0.09) & (np.abs(u - 0.5) < 0.1)
    on |= mth; rgb[mth] = C(mouth)
    return to_img(rgb, on)

def panel(w, h, base, rim=None, style='plate', seed=0):
    """A w x h px armour face, top row = top of the face. style:
    plate  - bevelled metal: light top/left edge, dark bottom/right edge, engraved inner line, rivets in the corners
    trim   - polished gold/silver: bright streak, darker lower half
    dark   - plain dark metal with faint brushed lines
    cloth  - woven fabric
    scale  - overlapping scales (dragon/fish)
    bone   - pitted bone"""
    X, Y = grid(w, h); u = X / w; v = Y / h
    b = C(base)
    if style == 'trim':
        rgb = mixc(shade(base, 1.35), shade(base, 0.8), v) * np.ones((h, w, 1))
        rgb[(np.abs(v - 0.3) < 0.5 / h + 0.06)] = np.clip(shade(base, 1.6), 0, 255)
    elif style == 'cloth':
        rgb = b * (0.92 + 0.12 * (((X + Y) % 2) == 0))[..., None] * np.ones((h, w, 1))
    elif style == 'scale':
        rr = ((Y % 4) * 0 + ((X + (Y // 3 % 2) * 2) % 4))
        rgb = mixc(shade(base, 1.25), shade(base, 0.75), (Y % 3) / 3.0) * np.ones((h, w, 1))
        rgb[(Y.astype(int) % 3 == 2)] = shade(base, 0.55)
    elif style == 'bone':
        r = rng(('bone', w, h, seed)); pits = r.random((h, w)) > 0.9
        rgb = mixc(shade(base, 1.1), shade(base, 0.85), v) * np.ones((h, w, 1)); rgb[pits] = shade(base, 0.7)
    else:
        rgb = mixc(shade(base, 1.2), shade(base, 0.82), v) * np.ones((h, w, 1))
        if style == 'dark':
            rgb[(Y.astype(int) % 3 == 0)] *= 0.94
    if style in ('plate', 'scale', 'dark', 'bone') and w >= 3 and h >= 3:
        rgb[0, :] = np.clip(rgb[0, :] * 1.25 + 10, 0, 255); rgb[:, 0] = np.clip(rgb[:, 0] * 1.15 + 6, 0, 255)
        rgb[-1, :] *= 0.62; rgb[:, -1] *= 0.72
    if style == 'plate' and w >= 8 and h >= 8:
        ln = ((np.abs(X - 2.5) < 0.5) | (np.abs(X - (w - 2.5)) < 0.5)) & (Y > 2) & (Y < h - 2)
        ln |= ((np.abs(Y - 2.5) < 0.5) | (np.abs(Y - (h - 2.5)) < 0.5)) & (X > 2) & (X < w - 2)
        rgb[ln] *= 0.8
        for cx, cy in ((1.5, 1.5), (w - 1.5, 1.5), (1.5, h - 1.5), (w - 1.5, h - 1.5)):
            rv = (np.abs(X - cx) < 0.6) & (np.abs(Y - cy) < 0.6)
            rgb[rv] = C(rim) if rim is not None else shade(base, 1.5)
    if rim is not None and style in ('plate', 'dark', 'scale') and w >= 4 and h >= 4:
        e = np.zeros((h, w), bool); e[0, :] = e[-1, :] = True; e[:, 0] = e[:, -1] = True
        rgb[e] = C(rim); rgb[0, :] = np.clip(C(rim) * 1.2, 0, 255)
    return to_img(np.clip(rgb, 0, 255), np.ones((h, w), bool))
