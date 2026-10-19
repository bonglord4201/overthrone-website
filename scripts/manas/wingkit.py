# OVERTHRONE wing system v12 (2026-10-19). One builder for every feathered-family wing (angelic, flame, crystal, leaf,
# dark), built from what the in-game tests and the Aurion reference taught us:
#   - the premium look is PAINTING on well-placed surfaces: each wing layer is a sheet of individually outlined feathers
#     with varied shapes (paint_layer), not one block stack per feather;
#   - Manas Cosmetics draws every face from both sides and the vanilla entity shader shades every face by its normal,
#     full-bright textures too (vertical faces get ~74%, faces turned up get 100%), so layers are tilted to catch light;
#   - each layer hangs on its own bone and ripples a little behind the main flap (real, renderer-supported bone
#     animation: idle / walk / run / jump / fly clips);
#   - effects are animated model particles (glowing pieces moved by keyframes; the mod has no particle emitter for back
#     cosmetics), designed per theme: shed feathers, embers, frost glints, petals, sparks, soul wisps, wingtip trails.
import math, random
import numpy as np
from PIL import Image
from bb import BB, Atlas, UV
import paint as P
from art import Canvas, erode
from fx import Kit, Particles, clips, lerp3
import vox
from vox import Sculptor, solid_uv
from sets6 import gem3d
import wings4 as W4

TEX = 4
def F(u): return {'uv': [round(v, 4) for v in u], 'texture': u.tex}
def C(c): return np.array(c[:3], float)

# ===================================================================== painted layers
def _mask(X, Y, pts):
    inside = np.zeros(X.shape, bool); n = len(pts)
    for i in range(n):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % n]
        inside ^= ((y1 > Y) != (y2 > Y)) & (X < (x2 - x1) * (Y - y1) / ((y2 - y1) + 1e-12) + x1)
    return inside

def _shift(m, dy, dx):
    o = np.zeros_like(m); h, w = m.shape
    o[max(0, dy):h + min(0, dy), max(0, dx):w + min(0, dx)] = m[max(0, -dy):h + min(0, -dy), max(0, -dx):w + min(0, -dx)]; return o

def outline(rx, ry, L, w, ang, shape):
    """Feather / shard / leaf / flame outline hanging from (rx, ry), leaning ang deg (+ towards +x)."""
    a = math.radians(ang); d = (math.sin(a), math.cos(a)); n = (math.cos(a), -math.sin(a))
    if shape == 'shard':   # crystal: angular, straight taper, a facet kink
        prof = [(0.0, 0.3), (0.1, 0.9), (0.45, 1.0), (0.7, 0.62), (1.0, 0.0)]; lead = 0.5
    elif shape == 'leaf':
        prof = [(t, math.sin(math.pi * min(1, t * 1.05)) ** 0.8 if t < 0.97 else 0.0) for t in (0, 0.1, 0.25, 0.45, 0.65, 0.82, 0.93, 1.0)]; lead = 0.5
    elif shape == 'flame':   # flame tongue: widest low, wavy taper
        prof = [(0.0, 0.4), (0.15, 0.95), (0.35, 1.0), (0.55, 0.78), (0.68, 0.86), (0.82, 0.42), (0.9, 0.5), (1.0, 0.0)]; lead = 0.45
    elif shape == 'tatter':   # dark ragged feather: uneven, bitten edge
        prof = [(0.0, 0.35), (0.12, 0.9), (0.4, 1.0), (0.55, 0.7), (0.62, 0.95), (0.78, 0.6), (0.86, 0.75), (1.0, 0.0)]; lead = 0.4
    else:   # 'feather' (point/round tips alternate via the caller), asymmetric vanes
        rnd = shape == 'round'
        prof = [(0.0, 0.35), (0.08, 0.7), (0.2, 1.0), (0.72, 1.0), (0.86, 0.62 if rnd else 0.45), (0.95, 0.35 if rnd else 0.15), (1.0, 0.0)]; lead = 0.38
    left = [(rx + d[0] * L * t - n[0] * w * lead * k, ry + d[1] * L * t - n[1] * w * lead * k) for t, k in prof]
    right = [(rx + d[0] * L * t + n[0] * w * (1 - lead) * k, ry + d[1] * L * t + n[1] * w * (1 - lead) * k) for t, k in prof]
    return left + right[::-1]

def paint_layer(feathers, style, pal):
    """feathers: dict(rx, ry, L, w, ang, shape, accent, tone) in texels. style: angel | flame | crystal | leaf | dark.
    pal: base, mid, shade, line, shaft, tip (accent at the tip), glow (glowing accent). Returns (main, glow) images."""
    xs, ys = [], []
    for f in feathers:
        for x, y in outline(f['rx'], f['ry'], f['L'], f['w'], f['ang'], f['shape']): xs.append(x); ys.append(y)
    x0, y1 = min(xs) - 2, max(ys) + 2; w = int(math.ceil(max(xs) + 2 - x0)); h = int(math.ceil(y1))
    for f in feathers: f['rx'] -= x0
    Y, X = np.mgrid[0:h, 0:w].astype(float); X += 0.5; Y += 0.5
    rgb = np.zeros((h, w, 3)); a = np.zeros((h, w), bool); grgb = np.zeros((h, w, 3)); ga = np.zeros((h, w), bool)
    B, M_, S_, LN, SH = (C(pal[k]) for k in ('base', 'mid', 'shade', 'line', 'shaft'))
    for f in feathers:
        m = _mask(X, Y, outline(f['rx'], f['ry'], f['L'], f['w'], f['ang'], f['shape']))
        if not m.any(): continue
        ar = math.radians(f['ang']); dx, dy = math.sin(ar), math.cos(ar)
        t = np.clip(((X - f['rx']) * dx + (Y - f['ry']) * dy) / f['L'], 0, 1)
        s = ((X - f['rx']) * dy - (Y - f['ry']) * dx) / (f['w'] * 0.5)
        tone = f.get('tone', 0.0)
        if style == 'crystal':      # facets: light lead face, mid centre, dark trailing face; bright facet seams
            col = np.where((s < -0.15)[..., None], B, np.where((s < 0.35)[..., None], M_, S_)) * np.ones((h, w, 1))
            col = np.where((np.abs(s + 0.15) < 0.12)[..., None] | (np.abs(t - 0.45) < 0.025)[..., None], np.clip(B * 1.08 + 20, 0, 255), col)
            hl = (s < -0.3) & (t > 0.12) & (t < 0.4); col[hl] = np.clip(B + 40, 0, 255)
        elif style == 'mech':       # armoured blade plates: bright leading bevel, dark trailing face, rivets, an energy seam
            col = np.where((s < -0.25)[..., None], B, np.where((s < 0.4)[..., None], M_, S_)) * np.ones((h, w, 1))
            col = np.where((np.abs(t - 0.3) < 0.02)[..., None] | (np.abs(t - 0.62) < 0.02)[..., None], S_ * 0.8, col)
            riv = ((np.abs(t - 0.3) < 0.03) | (np.abs(t - 0.62) < 0.03)) & (np.abs(s + 0.55) < 0.12); col[riv] = np.clip(B + 40, 0, 255)
        elif style == 'leaf':
            col = np.where((t < 0.5)[..., None], B, M_) * np.ones((h, w, 1))
            col = np.where((s > 0.2)[..., None], col * 0.88 + S_ * 0.12, col)
            vein = (np.abs(s) < 0.1) | ((((t * f['L'] * 0.5 - np.abs(s) * f['w'] * 0.25) % 3.2) < 0.7) & (np.abs(s) < 0.75))
            col = np.where(vein[..., None], SH, col)
        elif style == 'flame':      # hot core -> outer colour, tips burning
            heat = np.clip(1 - np.abs(s) * 0.9 - t * 0.35, 0, 1)
            col = (B * heat[..., None] + M_ * (1 - heat[..., None])) * np.where((t > 0.7)[..., None], 0.85, 1.0)
            col = np.where((t > 0.78)[..., None], col * 0.5 + S_ * 0.5, col)
        else:                       # angel / dark: three value bands along the feather, trailing vane shaded, barbs, shaft
            band = np.where(t < 0.35, 0, np.where(t < 0.75, 1, 2))
            col = np.where((band == 0)[..., None], B, np.where((band == 1)[..., None], M_, S_)) * np.ones((h, w, 1))
            col = np.where((s > 0.45)[..., None], col * 0.93 + S_ * 0.07, col)
            barb = (((t * f['L'] - np.abs(s) * f['w'] * 0.45) % 2.6) < 0.8) & (np.abs(s) > 0.25)
            col = np.where(barb[..., None], col * 0.95, col)
            col = np.where(((np.abs(s) < 0.12) & (t < 0.9))[..., None], SH, col)
        col = col * (1 - tone) + S_ * tone
        rgb[m] = col[m]; a |= m
        e = m & ~(_shift(m, 1, 0) & _shift(m, -1, 0) & _shift(m, 0, 1) & _shift(m, 0, -1))
        rgb[e] = LN if style != 'crystal' else np.clip(B * 1.1 + 25, 0, 255)
        if f.get('accent') and pal.get('tip') is not None:          # coloured edge on the tip (gold / ember / frost)
            te = e & (t > 0.72); rgb[te] = C(pal['tip'])
        if f.get('accent') and pal.get('glow') is not None:         # a glowing line inside the tip (full bright)
            if style == 'flame': gl = m & (t > 0.55)
            elif style == 'mech': gl = m & ~e & (np.abs(s - 0.05) < 0.12) & (t > 0.12) & (t < 0.85)
            else: gl = m & ~e & (t > 0.84) & (t < 0.94) & (np.abs(s) < 0.09)
            gc = C(pal['glow']) if style != 'flame' else np.clip(col * 1.15 + 30, 0, 255)
            rgb[gl] = gc if style != 'flame' else gc[gl]; grgb[gl] = gc if style != 'flame' else gc[gl]; ga |= gl
    out = np.zeros((h, w, 4), np.uint8); out[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8); out[..., 3] = np.where(a, 255, 0)
    g = None
    if ga.any():
        go = np.zeros((h, w, 4), np.uint8); go[..., :3] = np.clip(grgb, 0, 255).astype(np.uint8); go[..., 3] = np.where(ga, 255, 0); g = Image.fromarray(go, 'RGBA')
    return Image.fromarray(out, 'RGBA'), g, -x0

def make_layer(seed, n, span, len_fn, width, phi_fn, theta, style, pal, shapes, accent_every=0, jitter=0.12):
    """A row of n feathers whose roots run `span` px along the layer's top edge (at angle theta). phi_fn(t) = wanted world
    angle from straight down (+ = outwards). Returns (img, glow, ox, oy) with the root origin in texels."""
    rng = random.Random(seed); fs = []
    for i in range(n):
        t = i / max(1, n - 1)
        fs.append(dict(rx=span * t * TEX, ry=TEX, L=len_fn(t) * (1 + rng.uniform(-jitter, jitter)) * TEX, w=width * (1 + rng.uniform(-0.15, 0.15)) * TEX,
                       ang=phi_fn(t) - theta + rng.uniform(-3, 3), shape=shapes[(i * 5 + rng.randint(0, 3)) % len(shapes)],
                       accent=bool(accent_every and i % accent_every == 0), tone=rng.uniform(0.0, 0.1)))
    img, g, ox = paint_layer(fs, style, pal)
    return img, g, ox, TEX

class Layers:
    """Places painted layers. A layer hangs on its own bone (for the ripple) under a skeleton bone."""
    def __init__(self, m, k, emissive=True):
        self.m, self.k, self.emissive, self.n = m, k, emissive, 0
        self.tilt_k = 0.8
        self.bones = []
    def add(self, parent, root, theta, layer, s, tilt=-14.0, depth=0.3, ripple=1.0):
        img, g, ox, oy = layer
        atlas = self.m.glow_atlas() if self.emissive else self.m.atlas
        uv = atlas.add(img); gu = self.m.glow_atlas().add(g) if (g is not None and not self.emissive) else None
        W, H = img.width / TEX, img.height / TEX; ox, oy = ox / TEX, oy / TEX
        X0 = root[0] - ox if s > 0 else root[0] - (W - ox)
        f, t = [X0, root[1] + oy - H, root[2]], [X0 + W, root[1] + oy, root[2] + 0.04]
        self.n += 1; bn = 'lay%d_%s' % (self.n, 'r' if s > 0 else 'l')
        self.m.bone(bn, list(root), parent); self.bones.append((bn, s, ripple))
        rot = [-tilt * self.tilt_k, 0, s * theta]   # back-facing side turned up towards the light (wings are mostly seen from behind)
        # Both faces of a sheet are drawn (the mod emits every face double-sided) and they sit 0.04 px apart, so the
        # north face needs its u range reversed relative to the south face or one of them shows a mirror image.
        sf = uv if s > 0 else UV((uv[2], uv[1], uv[0], uv[3]), uv.tex)
        nf = UV((sf[2], sf[1], sf[0], sf[3]), uv.tex)
        self.m.cube(bn, f, t, {'north': F(nf), 'south': F(sf)}, list(root), rot)
        if depth:   # a second copy behind, for edge thickness from the side
            self.m.cube(bn, [f[0], f[1], f[2] + depth], [t[0], t[1], t[2] + depth], {'north': F(nf), 'south': F(sf)}, list(root), rot)
        if gu is not None:
            gs = gu if s > 0 else UV((gu[2], gu[1], gu[0], gu[3]), gu.tex)
            self.m.cube(bn, [f[0], f[1], f[2] - 0.03], [t[0], t[1], f[2] - 0.01], {'north': F(UV((gs[2], gs[1], gs[0], gs[3]), gu.tex)), 'south': F(gs)}, list(root), rot)
    def ripple_tracks(self, clip):
        w = {'idle': 110, 'walk': 160, 'run': 220, 'jump': 300, 'fly': 330}.get(clip, 120)
        amp = {'idle': 2.5, 'walk': 3.0, 'run': 4.5, 'jump': 6.0, 'fly': 6.5}.get(clip, 3)
        tr = {}
        for i, (bn, s, r) in enumerate(self.bones):
            tr[bn] = {'rotation': [(0, 'math.sin(query.anim_time*%d-%d)*%.1f' % (w, (i % 8) * 37, amp * r), 0, '%d*math.sin(query.anim_time*%d-%d)*%.1f' % (s, int(w * 0.8), (i % 8) * 29, amp * 0.5 * r))]}
        return tr

def saber_sheet(pts, w0, w1, col, gem=None):
    """A smooth painted curved blade along pts (model px, x outwards, y up): bevelled metal band that tapers to a point,
    bright upper edge, dark lower edge, engraved centre line, a gem at the base. Returns (img, glow, x0, y1) where
    (x0, y1) is the model position of the image's top-left corner."""
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]; pad = max(w0, 2) + 1
    x0, x1, y0, y1 = min(xs) - pad, max(xs) + pad, min(ys) - pad, max(ys) + pad
    w, h = int((x1 - x0) * TEX), int((y1 - y0) * TEX)
    Y, X = np.mgrid[0:h, 0:w].astype(float); X = x0 + (X + 0.5) / TEX; Y = y1 - (Y + 0.5) / TEX
    best = np.full((h, w), 1e9); tt = np.zeros((h, w)); side = np.zeros((h, w))
    n = len(pts)
    for i in range(n - 1):
        (ax, ay), (bx, by) = pts[i], pts[i + 1]; dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy + 1e-9
        u = np.clip(((X - ax) * dx + (Y - ay) * dy) / L2, 0, 1)
        px, py = ax + u * dx, ay + u * dy; dist = np.hypot(X - px, Y - py)
        sg = np.sign((X - ax) * dy - (Y - ay) * dx)
        upd = dist < best; best = np.where(upd, dist, best); tt = np.where(upd, (i + u) / (n - 1), tt); side = np.where(upd, sg, side)
    half = (w0 + (w1 - w0) * tt) / 2 * np.where(tt > 0.85, np.clip((1 - tt) / 0.15, 0, 1), 1)
    m = best < half
    r = [C(col) * k for k in (0.42, 0.68, 1.0)] + [np.clip(C(col) + (255 - C(col)) * k, 0, 255) for k in (0.3, 0.62)]
    q = best / np.maximum(half, 1e-3)
    rgb = np.where(((side < 0) & (q > 0.45))[..., None], r[3], np.where(((side > 0) & (q > 0.45))[..., None], r[1], r[2] * np.ones((h, w, 1))))
    rgb = np.where(((side < 0) & (q > 0.8))[..., None], r[4], rgb)
    rgb = np.where((q < 0.12)[..., None] & (tt < 0.8)[..., None], r[1], rgb)
    e = m & ~(_shift(m, 1, 0) & _shift(m, -1, 0) & _shift(m, 0, 1) & _shift(m, 0, -1)); rgb[e] = r[0]
    out = np.zeros((h, w, 4), np.uint8); out[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8); out[..., 3] = np.where(m, 255, 0)
    g = None
    if gem is not None:   # the cutting edge glows faintly near the tip
        ge = m & (tt > 0.6) & (side < 0) & (q > 0.75)
        go = np.zeros((h, w, 4), np.uint8); go[..., :3] = np.where(ge[..., None], C(gem), 0).astype(np.uint8); go[..., 3] = np.where(ge, 255, 0); g = Image.fromarray(go, 'RGBA')
    return Image.fromarray(out, 'RGBA'), g, x0, y1

# ===================================================================== effects (animated model particles)
def effects(m, k, theme, col, col2, span=24, top=10, name='fx'):
    """Themes: angel (shed feathers + rising light motes + wingtip sparkle trails), flame (embers + flickers), frost (snow
    + ice glints), leaf (drifting leaves + motes), storm (sparks + glints), void (dark wisps + sparks), blood (embers +
    drops). All glowing pieces are full-bright; counts kept small (about 30 moving pieces)."""
    fx = Particles(m, None, 4.0, name); rr = random.Random(m.name + name)
    dot = k.glow(name + 'dot', P.dot(col, 4, core=(255, 255, 255))); dot2 = k.glow(name + 'dot2', P.dot(col2, 4, core=(255, 255, 255)))
    def tips(n, uv, size, fall=True):
        for i in range(n):
            s = 1 if i % 2 else -1
            p = [s * rr.uniform(span * 0.75, span * 1.05), rr.uniform(top - 14, top + 4), -3.6]
            d = [s * rr.uniform(1, 3), -rr.uniform(6, 11) if fall else rr.uniform(4, 8), -rr.uniform(1, 3)]
            fx.add(p, d, size, uv, i / n, spin=170)
    def rising(n, uv, size):
        for i in range(n):
            s = 1 if i % 2 else -1
            fx.add([s * rr.uniform(3, span * 0.85), rr.uniform(-22, top - 6), -3.8], [s * rr.uniform(-0.5, 1.5), rr.uniform(6, 12), -rr.uniform(0, 2)], size, uv, i / n, spin=150)
    if theme == 'angel':
        fe = k.glow(name + 'fea', paint_layer([dict(rx=6, ry=1, L=22, w=8, ang=0, shape='feather')], 'angel',
                     dict(base=(255, 255, 255), mid=(246, 246, 255), shade=(220, 218, 245), line=(170, 165, 210), shaft=(252, 244, 222)))[0])
        for i in range(6):
            s = 1 if i % 2 else -1
            fx.add([s * rr.uniform(8, span * 0.9), rr.uniform(-10, 2), -3.2], [s * rr.uniform(2, 5), -rr.uniform(14, 18), -2], 2.4, fe, i / 6 + 0.04, sway=28, plate=True, spin=60)
        rising(10, dot2, 1.0); tips(12, dot, 0.9)
    elif theme == 'flame':
        rising(16, dot, 1.1); tips(10, dot2, 0.9, fall=False)
    elif theme == 'frost':
        snow = k.glow(name + 'snow', P.dot((235, 250, 255), 2))
        for i in range(12):
            s = 1 if i % 2 else -1
            fx.add([s * rr.uniform(3, span), rr.uniform(-6, top), -3.4], [s * rr.uniform(0.5, 2.5), -rr.uniform(12, 16), -1], 0.8, snow, i / 12, sway=30, rot=(0, 0, 45))
        tips(10, dot, 0.9)
    elif theme == 'leaf':
        lf = k.main(name + 'leaf', paint_layer([dict(rx=4, ry=1, L=12, w=7, ang=0, shape='leaf')], 'leaf',
                     dict(base=col2, mid=tuple(int(v * 0.85) for v in col2), shade=tuple(int(v * 0.6) for v in col2), line=tuple(int(v * 0.45) for v in col2), shaft=tuple(int(v * 0.55) for v in col2)))[0])
        for i in range(8):
            s = 1 if i % 2 else -1
            fx.add([s * rr.uniform(6, span), rr.uniform(-8, top - 2), -3.2], [s * rr.uniform(2, 5), -rr.uniform(12, 17), -2], 1.6, lf, i / 8, sway=35, plate=True, spin=90)
        rising(8, dot, 0.9)
    elif theme == 'storm':
        tips(12, dot, 0.8, fall=False); rising(8, dot2, 0.8)
    elif theme == 'void':
        wisp = k.glow(name + 'wisp', P.dot(col2, 4, core=col))
        rising(12, wisp, 1.3); tips(8, dot, 0.8)
    elif theme == 'blood':
        rising(12, dot, 1.0)
        drop = k.glow(name + 'drop', P.dot(col2, 2))
        for i in range(6):
            s = 1 if i % 2 else -1
            fx.add([s * rr.uniform(10, span), rr.uniform(-14, -2), -3.4], [0, -rr.uniform(10, 14), 0], 0.7, drop, i / 6)
    return fx

# ===================================================================== the builder
STYLES = {
    # style: (feather shapes for flight rows, covert shapes, painted style)
    'angel': (('feather', 'round', 'feather'), ('round',), 'angel'),
    'dark': (('tatter', 'feather', 'tatter'), ('round', 'tatter'), 'angel'),
    'flame': (('flame', 'feather', 'flame'), ('round', 'flame'), 'flame'),
    'crystal': (('shard',), ('shard',), 'crystal'),
    'leaf': (('leaf',), ('leaf',), 'leaf'),
    'mech': (('shard',), ('shard',), 'mech'),
}

def build(name, spec):
    """spec keys:
      style: angel|dark|flame|crystal|leaf;  pal: flight-feather palette;  cpal: covert palette (default pal)
      size: 1.0 scale of the skeleton;  shape: 'tall' | 'wide' | 'swept'
      frame: (main col, rim col) of the sculpted leading edge or None;  gem: crest gem colour or None
      sabers: colour of two long sweeping blades or None;  harness: True
      fx: effects theme;  fxcol, fxcol2: particle colours;  soft: colour of a soft light behind or None
      halo: colour of a floating ring between the wings or None"""
    m = BB(name, Atlas(1024, 1024)); k = Kit(m); LY = Layers(m, k, emissive=spec.get('emissive', True)); VS = Sculptor(m, k, ydown=False)
    sz = spec.get('size', 1.0); shape = spec.get('shape', 'tall')
    if shape == 'wide': WS, WE, WW, WH = (2.0, -14.0, -1.0), (8.0, -7.0, -1.8), (13.5, 0.5, -2.6), (20.0, 2.5, -3.4)
    elif shape == 'swept': WS, WE, WW, WH = (2.0, -14.0, -1.0), (6.5, -5.0, -1.8), (10.0, 5.5, -2.6), (17.0, 9.0, -3.4)
    else: WS, WE, WW, WH = (2.0, -14.0, -1.0), (7.0, -4.5, -1.8), (10.5, 6.5, -2.6), (17.5, 12.0, -3.4)
    sc = lambda p: [WS[0] + (p[0] - WS[0]) * sz, WS[1] + (p[1] - WS[1]) * sz, p[2]]
    WE, WW, WH = sc(WE), sc(WW), sc(WH)
    pal = spec['pal']; cpal = spec.get('cpal', pal)
    fshapes, cshapes, pstyle = STYLES[spec.get('style', 'angel')]
    ang = lambda A, B: math.degrees(math.atan2(B[1] - A[1], B[0] - A[0]))
    span = lambda A, B: math.hypot(B[0] - A[0], B[1] - A[1])
    tE, tW, tH = ang(WS, WE), ang(WE, WW), ang(WW, WH)
    L = lambda base: base * sz
    gm = spec.get('gem')
    for s, n in ((1, 'r'), (-1, 'l')):
        wb, mb, hb = W4.skeleton(m, n, s, pts=(WS, WE, WW))
        X = lambda p, dz=0.0: [p[0] * s, p[1], p[2] + dz]
        sd = name + n
        # flight feathers (back rows first), then coverts in front
        LY.add(hb, X(WW, 0.8), tH, make_layer(sd + 'p1', 9, span(WW, WH) + 1, lambda t: L(24 + 9 * math.sin(t * math.pi * 0.75)), 5.2 * sz, lambda t: 10 + 56 * t ** 1.2, tH, pstyle, pal, fshapes, accent_every=2), s, tilt=-16, ripple=1.3)
        LY.add(hb, X(lerp3(WW, WH, 0.12), 0.5), tH, make_layer(sd + 'p2', 7, span(WW, WH) * 0.82, lambda t: L(17 + 6 * t), 4.9 * sz, lambda t: 6 + 42 * t, tH, pstyle, pal, fshapes, accent_every=3), s, tilt=-15, ripple=1.1)
        LY.add(mb, X(WE, 0.4), tW, make_layer(sd + 's1', 10, span(WE, WW) + 0.5, lambda t: L(22 + 5 * t), 5.4 * sz, lambda t: -2 + 12 * t, tW, pstyle, pal, fshapes, accent_every=3), s, tilt=-14, ripple=0.9)
        LY.add(wb, X(lerp3(WS, WE, 0.08), 0.3), tE, make_layer(sd + 't1', 6, span(WS, WE) * 0.9, lambda t: L(14 + 5 * t), 5.6 * sz, lambda t: -12 + 9 * t, tE, pstyle, pal, fshapes), s, tilt=-12, ripple=0.6)
        for b, A, B, th in ((wb, WS, WE, tE), (mb, WE, WW, tW), (hb, WW, WH, tH)):
            ln = span(A, B); hand = b is hb
            LY.add(b, X(lerp3(A, B, 0.02), -0.3), th, make_layer(sd + 'g%d' % int(th), max(4, int(ln / 1.7)), ln, lambda t: L(10 + 1.5 * math.sin(t * math.pi)), 4.5 * sz,
                   lambda t, th=th, hand=hand: (th - 90) * 0.15 + (8 + 16 * t if hand else 0), th, pstyle, cpal, cshapes), s, tilt=-18, depth=0.25, ripple=0.7)
            LY.add(b, X(A, -0.65), th, make_layer(sd + 'm%d' % int(th), max(4, int(ln / 1.4)), ln, lambda t: L(6.2), 3.9 * sz,
                   lambda t, th=th, hand=hand: (th - 90) * 0.1 + (10 * t if hand else 0), th, pstyle, cpal, cshapes), s, tilt=-22, depth=0.2, ripple=0.5)
        for b, A, B, th in ((wb, WS, WE, tE), (mb, WE, WW, tW)):
            ln = span(A, B)
            LY.add(b, X([A[0], A[1] + 0.6, A[2]], -1.0), th, make_layer(sd + 'l%d' % int(th), max(4, int(ln / 1.1)), ln, lambda t: L(3.8), 3.3 * sz, lambda t: 0, th, pstyle, cpal, cshapes), s, tilt=-26, depth=0.2, ripple=0.3)
        fr = spec.get('frame')
        if fr:   # sculpted leading edge: rim-coloured frame with a main-coloured inset, joints capped
            lay = lambda t_: [dict(inset=0, z=0, t=t_, paint=vox.metal_paint(fr[1]), side=solid_uv(k, 'frs', tuple(int(v * 0.7) for v in fr[1])), back=solid_uv(k, 'frb', tuple(int(v * 0.5) for v in fr[1]))),
                              dict(inset=0.45, z=-0.3, t=0.4, paint=vox.bevel_paint(fr[0], tuple(int(v * 0.8) for v in fr[0]), False), side=solid_uv(k, 'fri', tuple(int(v * 0.85) for v in fr[0])))]
            for b, A, B, wd in ((wb, WS, WE, 2.2), (mb, WE, WW, 2.0), (hb, WW, WH, 1.6)):
                A2, B2 = X([A[0], A[1] + 0.8, A[2]], -1.4), X([B[0], B[1] + 0.8, B[2]], -1.4)
                Ln = math.hypot(B2[0] - A2[0], B2[1] - A2[1]); a_ = math.degrees(math.atan2(B2[1] - A2[1], B2[0] - A2[0])) - 90
                VS.plate(b, ((A2[0] + B2[0]) / 2, (A2[1] + B2[1]) / 2, A2[2]), wd, Ln + 0.8, [[(0.5, 0.0), (1.0, 0.12), (0.85, 0.5), (1.0, 0.88), (0.5, 1.0), (0.0, 0.88), (0.15, 0.5), (0.0, 0.12)]], lay(0.7), rot=(0, 0, a_), key='arm%d' % int(Ln * 4))
            crest = [(0.5, 0.0), (0.78, 0.28), (1.0, 0.62), (0.7, 0.8), (0.5, 1.0), (0.3, 0.8), (0.0, 0.62), (0.22, 0.28)]
            VS.plate(hb, X([WW[0], WW[1] + 2.6, WW[2]], -2.2), 4.4, 6.4, [crest], lay(0.8), rot=(0, 0, s * -12), key='crest')
            if gm: gem3d(m, k, hb, X([WW[0] + 0.2, WW[1] + 2.0, WW[2]], -2.95), 1.6, gm, rot=(0, 0, 45))
        if spec.get('sabers'):   # two long smooth painted blades sweeping past the wing tip, crystal-tipped
            sc_ = spec['sabers']
            for j, (P0, P1, P2) in enumerate((((WS[0] + 1, WS[1] + 3.0), (WW[0] - 1, WW[1] + 8.0), (WH[0] + 9, WH[1] + 6)), ((WE[0] + 1, WE[1] + 0.5), (WW[0] + 5, WW[1] - 1), (WH[0] + 10, WH[1] - 9)))):
                pts = [((1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]) for t in [i / 24 for i in range(25)]]
                img, g, x0, y1 = saber_sheet(pts, 2.2 if j == 0 else 1.7, 0.6, sc_, gm)
                uv = m.atlas.add(img); W_, H_ = img.width / TEX, img.height / TEX
                sf = uv if s > 0 else UV((uv[2], uv[1], uv[0], uv[3]), uv.tex); nf = UV((sf[2], sf[1], sf[0], sf[3]), uv.tex)
                xa = x0 if s > 0 else -(x0 + W_); z = -4.4 - j * 0.6
                for dz in (0.0, 0.45):
                    m.cube(mb, [xa, y1 - H_, z + dz], [xa + W_, y1, z + dz + 0.04], {'north': F(nf), 'south': F(sf)})
                if g is not None:
                    gu = m.glow_atlas().add(g); gs = gu if s > 0 else UV((gu[2], gu[1], gu[0], gu[3]), gu.tex)
                    m.cube(mb, [xa, y1 - H_, z - 0.03], [xa + W_, y1, z - 0.01], {'north': F(UV((gs[2], gs[1], gs[0], gs[3]), gu.tex)), 'south': F(gs)})
                if gm:
                    import heads4 as H4
                    cry = k.main('cry', P.facet(4, 8, tuple(min(255, int(v * 1.3) + 40) for v in gm), tuple(int(v * 0.7) for v in gm))); cryg = k.glow('cryg', P.facet(4, 4, (255, 255, 255), gm))
                    H4.crystal(m, mb, [s * pts[-1][0], pts[-1][1], z + 0.2], 2.6, 0.9, cry, cry, cryg, d=(s * (pts[-1][0] - pts[-3][0]), pts[-1][1] - pts[-3][1], 0))
    if spec.get('harness', True) and spec.get('frame'):
        fr = spec['frame']
        lay = [dict(inset=0, z=0, t=0.9, paint=vox.metal_paint(fr[1]), side=solid_uv(k, 'frs', tuple(int(v * 0.7) for v in fr[1])), back=solid_uv(k, 'frb', tuple(int(v * 0.5) for v in fr[1]))),
               dict(inset=0.6, z=-0.3, t=0.4, paint=vox.bevel_paint(fr[0], tuple(int(v * 0.8) for v in fr[0]), True), side=solid_uv(k, 'fri', tuple(int(v * 0.85) for v in fr[0])))]
        m.bone('harness', [0, -14, -0.8])
        VS.plate('harness', (0, -13.0, -1.1), 7.2, 8.6, [[(0.5, 0.0), (1.0, 0.18), (0.92, 0.6), (0.5, 1.0), (0.08, 0.6), (0.0, 0.18)]], lay, key='harness')
        if gm: gem3d(m, k, 'harness', [0, -12.4, -1.9], 1.7, gm, rot=(0, 0, 45))
    if spec.get('soft'): W4.soft_glow(m, k, spec['soft'])
    fx = effects(m, k, spec.get('fx', 'angel'), spec.get('fxcol', (120, 230, 255)), spec.get('fxcol2', (255, 225, 140)), span=WH[0] + 8, top=WH[1])
    def anim(c):
        tr = {}
        for s, n in ((1, 'r'), (-1, 'l')): tr.update(wrap_tracks(c, n, s))
        tr.update(LY.ripple_tracks(c))
        if spec.get('frame'): tr['harness'] = {'position': [(0, 0, 'math.sin(query.anim_time*90)*0.12', 0)]}
        return tr
    clips(m, anim, 4.0, fx)
    W4.place_back(m, root_y=WS[1])
    return m

# ===================================================================== wrap-around wing motion
# Rest pose (owner's reference: angel wings arching over the shoulders and curving forward around the body): the
# wing folds forward from the shoulder, more at the elbow, most at the wrist (negative Y = the tip comes forward). The
# motion is a wave: each joint follows the one before it with a lag, so the movement rolls along the wing instead of the
# whole wing swinging as one board. Per state: idle breathes wrapped, walk sways, run sweeps back, jump beats open,
# fly spreads wide with big strokes.
WRAP = {   # clip: (speed deg/s, raise amplitude, sweep amplitude, raise base, shoulder Y, elbow Y, wrist Y)
    'idle': (70, 6, 7, 4, -20, -36, -46),
    'walk': (110, 8, 8, 2, -16, -30, -38),
    'run': (160, 5, 5, -6, 30, 10, 0),
    'jump': (260, 24, 14, 12, -6, -16, -20),
    'fly': (280, 26, 14, 6, 4, -8, -12),
}
def wrap_tracks(clip, n, s, k=1.0, pre=''):
    w, A, sw, zb, y0, y1, y2 = WRAP.get(clip, WRAP['idle'])
    A, sw = A * k, sw * k
    q = 'query.anim_time*%d' % w
    return {
        pre + 'wing_' + n: {'rotation': [(0, 'math.sin(%s+20)*%.1f' % (q, A * 0.15), '%d*(%d+math.sin(%s+70)*%.1f)' % (s, y0, q, sw), '%d*(%d+math.sin(%s)*%.1f)' % (s, zb, q, A))]},
        pre + 'mid_' + n: {'rotation': [(0, 'math.sin(%s-20)*%.1f' % (q, A * 0.12), '%d*(%d+math.sin(%s+20)*%.1f)' % (s, y1 - y0, q, sw * 0.8), '%d*(math.sin(%s-45)*%.1f)' % (s, q, A * 0.45))]},
        pre + 'hand_' + n: {'rotation': [(0, 'math.sin(%s-60)*%.1f' % (q, A * 0.1), '%d*(%d+math.sin(%s-30)*%.1f)' % (s, y2 - y1, q, sw), '%d*(math.sin(%s-95)*%.1f)' % (s, q, A * 0.6))]},
    }

# ===================================================================== MEMBRANE family (demon / void / bone / dragon / storm)
def paint_membrane(poly, bones, base, dark, rim, vein, glow=None, scales=False, tears=0, seed=0):
    """Paint a membrane panel (model px, x outwards, y up). Dark next to the bones -> base colour in the middle, a dark
    stepped rim, branching veins, optional scale pattern (dragons), tears in the free edge, glowing veins.
    Returns (img, glow img or None, x0, y1)."""
    xs = [p[0] for p in poly]; ys = [p[1] for p in poly]
    x0, x1, y0, y1 = min(xs) - 0.5, max(xs) + 0.5, min(ys) - 0.5, max(ys) + 0.5
    w, h = int(math.ceil((x1 - x0) * TEX)), int(math.ceil((y1 - y0) * TEX))
    Y, X = np.mgrid[0:h, 0:w].astype(float); X = x0 + (X + 0.5) / TEX; Y = y1 - (Y + 0.5) / TEX
    m = _mask(X, Y, poly)
    rng = np.random.default_rng(abs(hash(('mem', seed))) % (2 ** 32))
    for _ in range(tears):      # bites out of the free (lower / outer) edge
        i = rng.integers(len(poly)); px, py = poly[i]
        r = rng.uniform(0.6, 1.6); m &= np.hypot(X - px - rng.uniform(-1, 1), (Y - py + rng.uniform(0, 1.5)) * 1.4) > r
    dist = np.full((h, w), 99.0)
    for (ax, ay), (bx, by) in bones:
        dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy + 1e-9
        u = np.clip(((X - ax) * dx + (Y - ay) * dy) / L2, 0, 1); dist = np.minimum(dist, np.hypot(X - ax - u * dx, Y - ay - u * dy))
    t = np.clip(dist / 4.0, 0, 1)[..., None]
    col = C(dark) * (1 - t) + C(base) * t
    col = np.where((dist > 6)[..., None], col * 0.92, col)
    if scales:   # small overlapping round scales, darker crescents
        row = np.floor(Y / 1.0); off = (row % 2) * 0.6; u = ((X + off) % 1.2) - 0.6; v = Y % 1.0
        ring = (np.hypot(u / 0.6, (v - 1.0)) > 0.78) & (np.hypot(u / 0.6, (v - 1.0)) < 1.0)
        col = np.where(ring[..., None], col * 0.8, col)
    vm = np.zeros((h, w), bool)
    cx_, cy_ = sum(xs) / len(xs), sum(ys) / len(ys)
    def seg_(x0_, y0_, x1_, y1_, wd):
        dx, dy = x1_ - x0_, y1_ - y0_; L2 = dx * dx + dy * dy + 1e-9
        u = np.clip(((X - x0_) * dx + (Y - y0_) * dy) / L2, 0, 1); return np.hypot(X - x0_ - u * dx, Y - y0_ - u * dy) < wd
    for (ax, ay), (bx, by) in bones:   # a few long veins from each bone into the panel, curving, forking near the edge
        for f in (0.35, 0.7):
            sx_, sy_ = ax + (bx - ax) * f, ay + (by - ay) * f
            dx, dy = cx_ - sx_, cy_ - sy_; dl = math.hypot(dx, dy) or 1; dx, dy = dx / dl, dy / dl
            L_ = rng.uniform(6, 10); bend = rng.uniform(-0.35, 0.35)
            mx_, my_ = sx_ + dx * L_ * 0.55, sy_ + dy * L_ * 0.55
            ex, ey = mx_ + (dx * math.cos(bend) - dy * math.sin(bend)) * L_ * 0.45, my_ + (dx * math.sin(bend) + dy * math.cos(bend)) * L_ * 0.45
            vm |= seg_(sx_, sy_, mx_, my_, 0.2) | seg_(mx_, my_, ex, ey, 0.16)
            fx_, fy_ = mx_ + (dx * math.cos(bend + 0.6) - dy * math.sin(bend + 0.6)) * L_ * 0.35, my_ + (dx * math.sin(bend + 0.6) + dy * math.cos(bend + 0.6)) * L_ * 0.35
            vm |= seg_(mx_, my_, fx_, fy_, 0.13)
    vm &= m
    col = np.where(vm[..., None], C(vein), col)
    inner = m & _shift(m, 1, 0) & _shift(m, -1, 0) & _shift(m, 0, 1) & _shift(m, 0, -1)
    inner2 = inner & _shift(inner, 1, 0) & _shift(inner, -1, 0) & _shift(inner, 0, 1) & _shift(inner, 0, -1)
    col = np.where((m & ~inner2)[..., None], C(rim) * 0.85, col); col = np.where((m & ~inner)[..., None], C(rim) * 0.6, col)
    out = np.zeros((h, w, 4), np.uint8); out[..., :3] = np.clip(col, 0, 255).astype(np.uint8); out[..., 3] = np.where(m, 255, 0)
    g = None
    if glow is not None:
        gm = vm | ((m & ~inner) & (rng.random((h, w)) < 0.0))
        go = np.zeros((h, w, 4), np.uint8); go[..., :3] = np.where(gm[..., None], C(glow), 0).astype(np.uint8); go[..., 3] = np.where(gm, 255, 0); g = Image.fromarray(go, 'RGBA')
    return Image.fromarray(out, 'RGBA'), g, x0, y1

def _sheet(m, bone, img, g, x0, y1, z, s, depth=0.3, emissive=False):
    uv = (m.glow_atlas() if emissive else m.atlas).add(img); W_, H_ = img.width / TEX, img.height / TEX
    sf = uv if s > 0 else UV((uv[2], uv[1], uv[0], uv[3]), uv.tex); nf = UV((sf[2], sf[1], sf[0], sf[3]), uv.tex)
    xa = x0 if s > 0 else -(x0 + W_)
    m.cube(bone, [xa, y1 - H_, z], [xa + W_, y1, z + 0.04], {'north': F(nf), 'south': F(sf)})
    if depth: m.cube(bone, [xa, y1 - H_, z + depth], [xa + W_, y1, z + depth + 0.04], {'north': F(nf), 'south': F(sf)})
    if g is not None:
        gu = m.glow_atlas().add(g); gs = gu if s > 0 else UV((gu[2], gu[1], gu[0], gu[3]), gu.tex)
        m.cube(bone, [xa, y1 - H_, z - 0.03], [xa + W_, y1, z - 0.01], {'north': F(UV((gs[2], gs[1], gs[0], gs[3]), gu.tex)), 'south': F(gs)})
        m.cube(bone, [xa, y1 - H_, z + depth + 0.05], [xa + W_, y1, z + depth + 0.07], {'north': F(UV((gs[2], gs[1], gs[0], gs[3]), gu.tex)), 'south': F(gs)})

def _scallop(a, b, toward, depth=0.3, n=5):
    mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); c = (mid[0] + (toward[0] - mid[0]) * depth, mid[1] + (toward[1] - mid[1]) * depth)
    return [((1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]) for t in [(i + 1) / (n + 1) for i in range(n)]]

def build_membrane(name, spec):
    """spec: mem (membrane), dark (near the bones), rim, vein, glow (glowing veins or None), bone (bone main), bone_rim,
    claw, spikes (colour or None), scales (bool), tears (int), size, fingers (list of (angle, length)), gem, fx, fxcol,
    fxcol2, soft."""
    m = BB(name, Atlas(1024, 1024)); k = Kit(m); VS = Sculptor(m, k, ydown=False)
    sz = spec.get('size', 1.0)
    S0, E0, W0 = (2.0, -14.0, -1.0), (7.5, -5.5, -1.8), (12.0, 4.0, -2.6)
    E0 = [S0[0] + (E0[0] - S0[0]) * sz, S0[1] + (E0[1] - S0[1]) * sz, E0[2]]; W0 = [S0[0] + (W0[0] - S0[0]) * sz, S0[1] + (W0[1] - S0[1]) * sz, W0[2]]
    fingers = [(a, L * sz) for a, L in spec.get('fingers', [(66, 18.0), (40, 26.0), (14, 28.0), (-14, 24.0)])]
    tips = [(W0[0] + math.cos(math.radians(a)) * L, W0[1] + math.sin(math.radians(a)) * L) for a, L in fingers]
    bone_c, rim_c = spec['bone'], spec.get('bone_rim', spec['bone'])
    def blay(t_=0.9):
        return [dict(inset=0, z=0, t=t_, paint=vox.bevel_paint(rim_c, tuple(int(v * 0.6) for v in rim_c), False), side=solid_uv(k, 'brs', tuple(int(v * 0.6) for v in rim_c)), back=solid_uv(k, 'brb', tuple(int(v * 0.45) for v in rim_c))),
                dict(inset=0.4, z=-0.3, t=0.4, paint=vox.bevel_paint(bone_c, tuple(int(v * 0.7) for v in bone_c), False), side=solid_uv(k, 'bis', tuple(int(v * 0.75) for v in bone_c)))]
    def limb(bone, A, B, w0, w1, z, s, key):
        L_ = math.hypot(B[0] - A[0], B[1] - A[1]); a_ = math.degrees(math.atan2(B[1] - A[1], B[0] - A[0])) - 90
        poly = [(0.5 - w0 / max(w0, w1) / 2, 0.0), (0.5 + w0 / max(w0, w1) / 2, 0.0), (0.5 + w1 / max(w0, w1) / 2, 1.0), (0.5 - w1 / max(w0, w1) / 2, 1.0)]
        cx, cy = (A[0] + B[0]) / 2, (A[1] + B[1]) / 2
        VS.plate(bone, (s * cx, cy, z), max(w0, w1), L_ + 0.6, [poly], blay(), rot=(0, 0, s * a_), key=key)
    claw = spec.get('claw', (230, 222, 205))
    for s, n in ((1, 'r'), (-1, 'l')):
        wb, mb, hb = W4.skeleton(m, n, s, pts=(S0, E0, W0))
        zb = W0[2] - 0.9
        # membrane panels: the arm panel on the forearm bone, one panel per finger gap on its own finger bone
        B1, B0 = (W0[0] + 4.0 * sz, S0[1] - 2.0 * sz), (S0[0] + 1.0, S0[1] - 6.0 * sz)
        arm_poly = [(S0[0], S0[1] + 0.6), (E0[0], E0[1] + 0.5), (W0[0], W0[1]), tips[-1]] + _scallop(tips[-1], B1, (W0[0], W0[1])) + [B1] + _scallop(B1, B0, (S0[0], S0[1])) + [B0]
        img, g, x0, y1 = paint_membrane(arm_poly, [((S0[0], S0[1]), (E0[0], E0[1])), ((E0[0], E0[1]), (W0[0], W0[1])), ((W0[0], W0[1]), tips[-1])], spec['mem'], spec['dark'], spec['rim'], spec['vein'], spec.get('glow'), spec.get('scales'), spec.get('tears', 0), seed=name + n + 'a')
        _sheet(m, mb, img, g, x0, y1, W0[2], s)
        fbones = []
        for i in range(len(fingers)):
            fb = m.bone('fin%d_%s' % (i, n), [s * W0[0], W0[1], W0[2]], hb); fbones.append(fb)
        for i in range(len(fingers) - 1):
            a, b = tips[i], tips[i + 1]
            poly = [(W0[0], W0[1]), a] + _scallop(a, b, (W0[0], W0[1]), 0.34) + [b]
            img, g, x0, y1 = paint_membrane(poly, [((W0[0], W0[1]), a), ((W0[0], W0[1]), b)], spec['mem'], spec['dark'], spec['rim'], spec['vein'], spec.get('glow'), spec.get('scales'), spec.get('tears', 0), seed=name + n + str(i))
            _sheet(m, fbones[i + 1], img, g, x0, y1, W0[2] + 0.05 * i, s)
        # bones: chunky sculpted arm, fingers tapering, joint caps, claws, thumb hook
        limb(wb, S0, E0, 3.4, 2.8, zb, s, 'ua'); limb(mb, E0, W0, 2.8, 2.2, zb, s, 'fa')
        for i, (fb, t_) in enumerate(zip(fbones, tips)):
            mid = (W0[0] + (t_[0] - W0[0]) * 0.55, W0[1] + (t_[1] - W0[1]) * 0.55)
            limb(fb, (W0[0], W0[1]), mid, 2.0, 1.6, zb + 0.2, s, 'f%da' % i); limb(fb, mid, t_, 1.6, 0.6, zb + 0.2, s, 'f%db' % i)
            ca = math.atan2(t_[1] - W0[1], t_[0] - W0[0]); ct = (t_[0] + math.cos(ca) * 2.2, t_[1] + math.sin(ca) * 2.2)
            VS.plate(fb, (s * (t_[0] + ct[0]) / 2, (t_[1] + ct[1]) / 2, zb + 0.2), 0.9, 2.6, [[(0.0, 0.0), (1.0, 0.0), (0.5, 1.0)]],
                     [dict(inset=0, z=0, t=0.6, paint=vox.bevel_paint(claw, tuple(int(v * 0.7) for v in claw), False), side=solid_uv(k, 'cls', tuple(int(v * 0.7) for v in claw)))], rot=(0, 0, s * (math.degrees(ca) - 90)), key='claw')
        for b_, c_, r_ in ((mb, E0, 1.9), (hb, W0, 2.1)):
            VS.plate(b_, (s * c_[0], c_[1], zb - 0.2), r_ * 2, r_ * 2, [[(0.5, 0.0), (1.0, 0.5), (0.5, 1.0), (0.0, 0.5)]], blay(1.0), key='joint')
        th0, th1 = (W0[0], W0[1]), (W0[0] - 1.6, W0[1] + 4.2)
        limb(hb, th0, th1, 1.2, 0.4, zb - 0.1, s, 'thumb')
        if spec.get('gem'): gem3d(m, k, hb, [s * W0[0], W0[1], zb - 1.2], 1.4, spec['gem'], rot=(0, 0, 45))
        if spec.get('spikes'):   # a row of spikes along the top of the arm
            sp = spec['spikes']
            for i in range(5):
                t_ = (i + 0.5) / 5; R = (S0[0] + (W0[0] - S0[0]) * t_, S0[1] + (W0[1] - S0[1]) * t_ + 0.9)
                nrm = (-(W0[1] - S0[1]), W0[0] - S0[0]); nl = math.hypot(*nrm); nrm = (nrm[0] / nl, nrm[1] / nl)
                bone_ = wb if t_ < 0.5 else mb
                VS.plate(bone_, (s * (R[0] + nrm[0] * 1.4), R[1] + nrm[1] * 1.4, zb), 1.2, 3.0, [[(0.0, 1.0), (0.5, 0.0), (1.0, 1.0)]],
                         [dict(inset=0, z=0, t=0.7, paint=vox.bevel_paint(sp, tuple(int(v * 0.6) for v in sp), False), side=solid_uv(k, 'sps', tuple(int(v * 0.6) for v in sp)))],
                         rot=(0, 0, s * (math.degrees(math.atan2(nrm[1], nrm[0])) - 90)), key='spike')
    if spec.get('soft'): W4.soft_glow(m, k, spec['soft'])
    fx = effects(m, k, spec.get('fx', 'blood'), spec.get('fxcol', (255, 60, 40)), spec.get('fxcol2', (255, 180, 80)), span=W0[0] + 22 * sz, top=W0[1] + 12)
    def anim(c):
        tr = {}
        for s, n in ((1, 'r'), (-1, 'l')):
            tr.update(wrap_tracks(c, n, s, 0.9))
            w = {'idle': 90, 'walk': 130, 'run': 180, 'jump': 280, 'fly': 300}.get(c, 100)
            spread = {'idle': 4, 'walk': 5, 'run': -8, 'jump': 10, 'fly': 9}.get(c, 4)
            for i in range(len(fingers)):   # fingers spread and close a little, the outer ones more (the membrane billows)
                tr['fin%d_%s' % (i, n)] = {'rotation': [(0, 'math.sin(query.anim_time*%d-%d)*%.1f' % (w, i * 30, 2 + i), 0, '%d*(%.1f+math.sin(query.anim_time*%d-%d)*%.1f)' % (s, spread * (i - 1.5) / 1.5, w, 40 + i * 25, 2.5 + i * 1.2))]}
        return tr
    clips(m, anim, 4.0, fx)
    W4.place_back(m, root_y=S0[1])
    return m
