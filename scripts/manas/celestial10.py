# OVERTHRONE "Celestial Sovereign" v11 (2026-10-19). Built from the lesson of the Aurion reference video: the premium look
# comes from excellent pixel-art painting on well-placed surfaces, not from cube count.
#   wings: six painted feather TIERS per wing (plumage.py: individually outlined, varied feathers, ragged tips), each a
#          sheet with a shaded backing copy for edge thickness, set at different depths and angles on a three-joint
#          skeleton, with gold saber blades along the top and a wrist crest gem;
#   armour/helm: see armor() / helm() below.
import math, random
import numpy as np
from PIL import Image
from bb import BB, Atlas, UV
import paint as P
from fx import Kit, Particles, clips, lerp3
import plumage as PL
import vox
from vox import Sculptor, solid_uv
from sets6 import gem3d
import celestial9 as C9

GOLD, GEM = C9.GOLD, C9.GEM
TEX = 4

def F(u): return {'uv': [round(v, 4) for v in u], 'texture': u.tex}

def darker(img, k=0.72, tint=(120, 112, 170)):
    a = np.array(img).astype(float); a[..., :3] = a[..., :3] * k + np.array(tint) * (1 - k) * 0.4
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')

class Sheets:
    def __init__(self, m, k):
        self.m, self.k = m, k
    def add(self, bone, root, theta, sheet, s, z, tilt=0.0, glow=None, back=True, depth=0.3, key=''):
        """Place a painted sheet: its root point (texel (ox, oy)) at `root`, its top edge along angle theta (deg from +X),
        hanging below. Right wing s=1; the left wing is mirrored."""
        img, g, ox, oy = sheet
        uv = self.m.glow_atlas().add(img); ub = self.m.atlas.add(darker(img)) if back else None
        gu = self.m.glow_atlas().add(g) if g is not None else None
        W, H = img.width / TEX, img.height / TEX; ox, oy = ox / TEX, oy / TEX
        X0 = root[0] - ox if s > 0 else root[0] - (W - ox)
        f, t = [X0, root[1] + oy - H, root[2]], [X0 + W, root[1] + oy, root[2] + 0.04]
        rot = [tilt, 0, s * theta]
        front = UV((uv[2], uv[1], uv[0], uv[3]), uv.tex) if s > 0 else uv         # paint left->right towards the tip
        rear = UV((uv[0], uv[1], uv[2], uv[3]), uv.tex) if s > 0 else UV((uv[2], uv[1], uv[0], uv[3]), uv.tex)
        self.m.cube(bone, f, t, {'north': F(front), 'south': F(rear)}, list(root), rot)
        if back:
            bf = UV((ub[2], ub[1], ub[0], ub[3]), ub.tex) if s > 0 else ub
            br = rear   # the side seen from the front of the player: the bright painting, so the wings read white from both sides
            self.m.cube(bone, [f[0], f[1], f[2] + depth], [t[0], t[1], t[2] + depth], {'north': F(bf), 'south': F(br)}, list(root), rot)
        if gu is not None:
            gf = UV((gu[2], gu[1], gu[0], gu[3]), gu.tex) if s > 0 else gu
            self.m.cube(bone, [f[0], f[1], f[2] - 0.03], [t[0], t[1], f[2] - 0.01], {'north': F(gf)}, list(root), rot)

def make_tier(seed, n, span, length_fn, width, phi_fn, theta, tips=('point', 'round', 'split'), gold_every=0, cyan_every=0, tone=None):
    """phi_fn(t): wanted world angle of each feather from straight down (+ = outwards); converted to sheet space."""
    rng = random.Random(seed)
    fs, w, h, ox = PL.tier(n, span, length_fn, width, lambda t: phi_fn(t) - theta, rng, tex=TEX, tips=tips, gold_every=gold_every, cyan_every=cyan_every)
    kw = {} if tone is None else dict(base=tone[0], mid=tone[1], shade=tone[2])
    img, g = PL.paint_sheet(w, h, fs, gold=(236, 186, 70), cyan=GEM, **kw)
    return img, g, ox, 1.0 * TEX

def saber(m, S, bone, pts, w0, w1, s, key):
    """A long curved gold blade (bevelled, with a bright edge) following pts in the XY plane."""
    M = C9.Mat(S.k) if hasattr(S, 'k') else None

def wings(name):
    import wings4 as W4
    m = BB(name, Atlas(1024, 1024)); k = Kit(m); SH = Sheets(m, k); VS = Sculptor(m, k, ydown=False); M = C9.Mat(k)
    WS, WE, WW, WH = (2.0, -14.0, -1.0), (7.0, -4.5, -1.8), (10.5, 6.5, -2.6), (17.5, 12.0, -3.4)
    def ang(A, B): return math.degrees(math.atan2(B[1] - A[1], B[0] - A[0]))
    tE, tW, tH = ang(WS, WE), ang(WE, WW), ang(WW, WH)
    for s, n in ((1, 'r'), (-1, 'l')):
        wb, mb, hb = W4.skeleton(m, n, s, pts=(WS, WE, WW))
        X = lambda p, dz=0.0: [p[0] * s, p[1], p[2] + dz]
        span = lambda A, B: math.hypot(B[0] - A[0], B[1] - A[1])
        # flight feathers (back rows first)
        SH.add(hb, X(WW, 0.7), tH, make_tier(n + 'p1', 9, span(WW, WH) + 1, lambda t: 25 + 9 * math.sin(t * math.pi * 0.75), 5.2, lambda t: 10 + 56 * t ** 1.2, tH, gold_every=2, cyan_every=3), s, 0, tilt=-6)
        SH.add(hb, X(lerp3(WW, WH, 0.15), 0.45), tH, make_tier(n + 'p2', 7, span(WW, WH) * 0.8, lambda t: 17 + 6 * t, 4.8, lambda t: 6 + 40 * t, tH, gold_every=3), s, 0, tilt=-7)
        SH.add(mb, X(WE, 0.4), tW, make_tier(n + 's1', 10, span(WE, WW) + 0.5, lambda t: 22 + 5 * t, 5.4, lambda t: -2 + 12 * t, tW, gold_every=3), s, 0, tilt=-5)
        SH.add(wb, X(lerp3(WS, WE, 0.08), 0.3), tE, make_tier(n + 't1', 6, span(WS, WE) * 0.9, lambda t: 13 + 5 * t, 5.4, lambda t: -12 + 9 * t, tE), s, 0, tilt=-4)
        # coverts (front rows): greater, median, lesser; shorter, rounder, overlapping the flight feathers' roots
        cov_tone = ((255, 255, 255), (246, 245, 253), (222, 219, 242))
        for b, A, B, th in ((wb, WS, WE, tE), (mb, WE, WW, tW), (hb, WW, WH, tH)):
            ln = span(A, B)
            SH.add(b, X(lerp3(A, B, 0.02), -0.25), th, make_tier(n + 'g' + str(th), max(4, int(ln / 1.7)), ln, lambda t: 9.5 + 1.5 * math.sin(t * math.pi), 4.4, lambda t, th=th: (th - 90) * 0.15 + (8 if b is hb else 0) + 14 * t * (b is hb), th, tips=('round', 'point'), tone=cov_tone), s, 0, tilt=-8, depth=0.25)
            SH.add(b, X(lerp3(A, B, 0.0), -0.6), th, make_tier(n + 'm' + str(th), max(4, int(ln / 1.4)), ln, lambda t: 6.0, 3.8, lambda t, th=th: (th - 90) * 0.1 + 10 * t * (b is hb), th, tips=('round',), tone=cov_tone), s, 0, tilt=-10, depth=0.2)
        for b, A, B, th in ((wb, WS, WE, tE), (mb, WE, WW, tW)):
            ln = span(A, B)
            SH.add(b, X([A[0], A[1] + 0.6, A[2]], -0.95), th, make_tier(n + 'l' + str(th), max(4, int(ln / 1.1)), ln, lambda t: 3.6, 3.2, lambda t: 0, th, tips=('round',), tone=cov_tone), s, 0, tilt=-12, depth=0.2)
        # leading edge: a sculpted ivory-and-gold arm, two long gold sabers sweeping past the tip, a crest with the gem
        for b, A, B, wd in ((wb, WS, WE, 2.2), (mb, WE, WW, 2.0), (hb, WW, WH, 1.7)):
            A2, B2 = X([A[0], A[1] + 0.8, A[2]], -1.35), X([B[0], B[1] + 0.8, B[2]], -1.35)
            L = math.hypot(B2[0] - A2[0], B2[1] - A2[1]); a_ = math.degrees(math.atan2(B2[1] - A2[1], B2[0] - A2[0])) - 90
            VS.plate(b, ((A2[0] + B2[0]) / 2, (A2[1] + B2[1]) / 2, A2[2]), wd, L + 0.8, [[(0.5, 0.0), (1.0, 0.12), (0.85, 0.5), (1.0, 0.88), (0.5, 1.0), (0.0, 0.88), (0.15, 0.5), (0.0, 0.12)]], M.armour(t=0.7, inset=0.45, engrave=False), rot=(0, 0, a_), key='arm%d' % int(L * 4))
        for j, (P0, P1, P2) in enumerate((((WS[0] + 1, WS[1] + 3.0), (WW[0] - 1, WW[1] + 7.5), (WH[0] + 9, WH[1] + 6)), ((WE[0] + 1, WE[1] + 0.5), (WW[0] + 5, WW[1] - 1), (WH[0] + 10, WH[1] - 9)))):
            pts = [((1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]) for t in [i / 14 for i in range(15)]]
            for i in range(14):
                A, B = pts[i], pts[i + 1]; L = math.hypot(B[0] - A[0], B[1] - A[1]) + 0.3
                wd = (2.0 if j == 0 else 1.6) * (1 - i / 16) + 0.25
                a_ = math.degrees(math.atan2(B[1] - A[1], B[0] - A[0])) - 90
                bone_ = wb if i < 5 else (mb if i < 9 else hb)
                VS.plate(bone_, (s * (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, -4.6 - j * 0.5), wd, L, [[(0, 0), (1, 0), (1, 1), (0, 1)]],
                         [dict(inset=0, z=0, t=0.6, paint=vox.metal_paint(GOLD), side=M.gside, back=M.gback, step=4)], rot=(0, 0, s * a_), key='sab%d_%d' % (j, int(wd * 8)))
        crest = [(0.5, 0.0), (0.78, 0.28), (1.0, 0.62), (0.7, 0.8), (0.5, 1.0), (0.3, 0.8), (0.0, 0.62), (0.22, 0.28)]
        VS.plate(hb, X([WW[0], WW[1] + 2.6, WW[2]], -2.2), 4.6, 6.6, [crest], M.armour(t=0.8, inset=0.55, engrave=False), rot=(0, 0, s * -12), key='crest')
        gem3d(m, k, hb, X([WW[0] + 0.2, WW[1] + 2.0, WW[2]], -2.9), 1.6, GEM, rot=(0, 0, 45))
    # back harness joining the wing roots
    m.bone('harness', [0, -14, -0.8])
    VS.plate('harness', (0, -13.0, -1.1), 7.2, 8.6, [[(0.5, 0.0), (1.0, 0.18), (0.92, 0.6), (0.5, 1.0), (0.08, 0.6), (0.0, 0.18)]], M.armour(t=0.9), key='harness')
    gem3d(m, k, 'harness', [0, -12.4, -1.9], 1.7, GEM, rot=(0, 0, 45))
    def build(c):
        tr = {}
        for s, n in ((1, 'r'), (-1, 'l')): tr.update(W4.flap_tracks(c, n, s, [], 'feather', amp=0.85))
        return tr
    clips(m, build, 4.0, None)
    W4.place_back(m, root_y=WS[1])
    return m

def helm(name): return C9.helm(name)
def armor(name): return C9.armor(name)
def weapon(name): return C9.weapon(name)
