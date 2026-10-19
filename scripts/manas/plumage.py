# Feather-sheet painter (OVERTHRONE v11). What makes the reference wings (Polygony "Aurion") read as premium is the
# painting, not the cube count: each wing tier is one surface carrying many individually outlined feathers, shaded
# white -> lavender, with ragged uneven tips, stacked in tiers at different angles. This paints one tier as a sprite.
#
# Sheet space: x right (towards the wing tip), y down (root edge at y=0), units = texels. Feathers are drawn back to front
# so every feather keeps its own outline where it overlaps the next one.
import math
import numpy as np
from PIL import Image

def _poly_mask(X, Y, pts):
    inside = np.zeros(X.shape, bool); n = len(pts)
    for i in range(n):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % n]
        inside ^= ((y1 > Y) != (y2 > Y)) & (X < (x2 - x1) * (Y - y1) / ((y2 - y1) + 1e-12) + x1)
    return inside

def feather_poly(rx, ry, L, w, ang, tip='point', notch=None):
    """Outline of one feather hanging from root (rx, ry), length L, width w, leaning `ang` degrees (+ = towards +x).
    tip: point | round | split. Asymmetric: the leading vane (towards -x) is narrower."""
    a = math.radians(ang); d = (math.sin(a), math.cos(a)); n = (math.cos(a), -math.sin(a))
    prof = []   # (t along, half-width lead, half-width trail)
    for t in (0.0, 0.08, 0.2, 0.5, 0.72, 0.86, 0.95, 1.0):
        if t <= 0.2: k = 0.35 + 0.65 * t / 0.2
        elif t <= 0.72: k = 1.0
        else: k = max(0.0, 1.0 - (t - 0.72) / 0.28) ** (0.7 if tip == 'round' else 1.0)
        prof.append((t, w * 0.38 * k, w * 0.62 * k))
    left = [(rx + d[0] * L * t - n[0] * hl, ry + d[1] * L * t - n[1] * hl) for t, hl, ht in prof]
    right = [(rx + d[0] * L * t + n[0] * ht, ry + d[1] * L * t + n[1] * ht) for t, hl, ht in prof]
    if tip == 'split':   # a little V cut in the tip
        tx, ty = rx + d[0] * L * 0.9, ry + d[1] * L * 0.9
        right = right[:-1] + [(tx, ty)] + right[-1:]
    if notch is not None:   # a step cut in the trailing vane
        t0 = notch; i = 4
        nx, ny = rx + d[0] * L * t0 + n[0] * w * 0.3, ry + d[1] * L * t0 + n[1] * w * 0.3
        right = right[:i] + [(nx, ny)] + right[i:]
    return left + right[::-1]

def paint_sheet(w, h, feathers, base=(255, 255, 255), mid=(242, 241, 252), shade=(212, 208, 238), line=(150, 142, 196),
                shaft=(252, 244, 222), gold=None, cyan=None):
    """feathers: list of dict(rx, ry, L, w, ang, tip, notch, tone) in texels, drawn in order (first = furthest back).
    Returns (main RGBA, glow RGBA or None)."""
    Y, X = np.mgrid[0:h, 0:w].astype(float); X += 0.5; Y += 0.5
    rgb = np.zeros((h, w, 3)); a = np.zeros((h, w), bool)
    grgb = np.zeros((h, w, 3)); ga = np.zeros((h, w), bool)
    B, M_, S_, LN, SH = (np.array(c, float) for c in (base, mid, shade, line, shaft))
    for f in feathers:
        pts = feather_poly(f['rx'], f['ry'], f['L'], f['w'], f['ang'], f.get('tip', 'point'), f.get('notch'))
        m = _poly_mask(X, Y, pts)
        if not m.any(): continue
        ar = math.radians(f['ang']); dx, dy = math.sin(ar), math.cos(ar)
        t = np.clip(((X - f['rx']) * dx + (Y - f['ry']) * dy) / f['L'], 0, 1)            # along the feather
        s = ((X - f['rx']) * dy - (Y - f['ry']) * dx) / (f['w'] * 0.5)                  # across (+ = trailing vane)
        tone = f.get('tone', 0.0)
        # three flat value bands along the feather + the trailing vane in shade (pixel-art banding, no noise)
        band = np.where(t < 0.35, 0, np.where(t < 0.75, 1, 2))
        col = np.where((band == 0)[..., None], B, np.where((band == 1)[..., None], M_, S_ * 1.04))
        col = np.where((s > 0.45)[..., None], col * 0.94 + S_ * 0.06, col)
        col = col * (1 - tone) + S_ * tone
        barb = (((t * f['L'] - np.abs(s) * f['w'] * 0.45) % 2.6) < 0.8) & (np.abs(s) > 0.25)
        col = np.where(barb[..., None], col * 0.97, col)
        col = np.where(((np.abs(s) < 0.12) & (t < 0.9))[..., None], SH, col)               # shaft
        rgb[m] = col[m]; a |= m
        e = m & ~(_shift(m, 1, 0) & _shift(m, -1, 0) & _shift(m, 0, 1) & _shift(m, 0, -1))
        rgb[e] = LN                                                                        # crisp outline
        if gold is not None and f.get('gold'):
            ge = e & (t > 0.8) & (s > 0); rgb[ge] = np.array(gold, float)
        if cyan is not None and f.get('cyan'):   # a thin glowing line inside the tip, not a blob
            ce = m & ~e & (t > 0.84) & (t < 0.95) & (np.abs(s) < 0.14); rgb[ce] = np.array(cyan, float); grgb[ce] = np.array(cyan, float); ga |= ce
    out = np.zeros((h, w, 4), np.uint8); out[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8); out[..., 3] = np.where(a, 255, 0)
    g = None
    if ga.any():
        go = np.zeros((h, w, 4), np.uint8); go[..., :3] = np.clip(grgb, 0, 255).astype(np.uint8); go[..., 3] = np.where(ga, 255, 0); g = Image.fromarray(go, 'RGBA')
    return Image.fromarray(out, 'RGBA'), g

def _shift(m, dy, dx):
    o = np.zeros_like(m); h, w = m.shape
    ys = slice(max(0, dy), h + min(0, dy)); yd = slice(max(0, -dy), h + min(0, -dy))
    xs = slice(max(0, dx), w + min(0, dx)); xd = slice(max(0, -dx), w + min(0, -dx))
    o[ys, xs] = m[yd, xd]; return o

def tier(n, span, length_fn, width, ang_fn, rng, tex=4, y0=1.0, tips=('point', 'round', 'split'), gold_every=0, cyan_every=0, jitter=0.12):
    """A tier of n feathers whose roots run along the top edge over `span` px. length_fn(t), ang_fn(t) in px / degrees.
    Returns (feathers in texels, sheet w, sheet h in texels, root x offset in texels)."""
    fs = []
    for i in range(n):
        t = i / max(1, n - 1)
        L = length_fn(t) * (1 + rng.uniform(-jitter, jitter)); ang = ang_fn(t) + rng.uniform(-3, 3)
        fw = width * (1 + rng.uniform(-0.15, 0.15))
        fs.append(dict(rx=span * t * tex, ry=y0 * tex, L=L * tex, w=fw * tex, ang=ang, tip=tips[(i * 7 + rng.randint(0, 2)) % len(tips)],
                       notch=rng.uniform(0.5, 0.8) if rng.random() < 0.45 else None, tone=rng.uniform(0.0, 0.12),
                       gold=bool(gold_every and i % gold_every == 0), cyan=bool(cyan_every and i % cyan_every == 0)))
    # bounding box (in texels) of all feathers, with a margin
    xs, ys = [], []
    for f in fs:
        for x, y in feather_poly(f['rx'], f['ry'], f['L'], f['w'], f['ang']): xs.append(x); ys.append(y)
    x0, x1, y1 = min(xs) - 2, max(xs) + 2, max(ys) + 2
    for f in fs: f['rx'] -= x0
    return fs, int(math.ceil(x1 - x0)), int(math.ceil(y1)), -x0
