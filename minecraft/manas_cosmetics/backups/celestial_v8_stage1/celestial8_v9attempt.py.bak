# OVERTHRONE "Celestial Sovereign" v9: complete redesign (2026-10-19, owner rejected v8 as blocky armour + spike-fan wings).
# Design rules taken from concept sheet #1 and the Aurion reference:
#   - dark central body; ivory plates ON TOP, each a SHAPED plate (pixel-art silhouette cut out of the texture) set at a
#     deliberate angle, never a stack of boxes; gold edging follows each plate's outline (painted on the plate's border,
#     plus a gold backing plate behind it, so the edge has real thickness from the side);
#   - one cyan focal gem per region (sternum core, shoulders, belt, knees, crown), clean flat pixel-art shading (bands,
#     no noise);
#   - helm: dark mask with glowing eyes, angled ivory cheek guards, V brow, tall spiked crown;
#   - wings: tall, rising from a designed back harness to a gold wrist crest above the head, long layered feathers
#     falling towards the ground (primaries, secondaries, tertials, three covert rows), each feather a shaped plate on a
#     solid rachis, broad and overlapping, curving back.
# Frames (sim.py / mod code): armor_set = player space Y DOWN, -Z front; helmet = Y up from the neck, -Z face;
# back = wings4 frame (Y up, -Z away from the back, needs_y_flip true).
import math, random
import numpy as np
from PIL import Image
from bb import BB, Atlas, UV
import paint as P
from art import Canvas, ramp, sh, lit, mix, C, erode
from fx import Kit, Particles, clips, lerp3
import wings4 as W4
import sets5 as S5
from sets6 import gem3d

IVORY, IVORY_L, IVORY_D = (238, 236, 230), (252, 251, 248), (200, 198, 222)
NAVY, NAVY_L, NAVY_D = (30, 32, 54), (48, 52, 84), (16, 17, 30)
GOLD, GEM = (240, 192, 70), (80, 232, 255)
TD = 4   # texels per model pixel (64x)

def flipv(uv): return UV((uv[0], uv[3], uv[2], uv[1]), uv.tex)

# ===================================================================== shaped plate painter
def paint_shape(tw, th, poly, style='ivory', gem=None, gem_r=0.16, inner=True, glow_edge=None):
    """poly in 0..1 (x right, y down). style: ivory | navy | gold. Banded pixel-art shading, 2-px gold rim on the outline,
    an engraved inner line, an optional cyan gem in a gold setting at gem=(x, y)."""
    c = Canvas(tw, th)
    m = c.m_poly([(x * tw, y * th) for x, y in poly])
    if not m.any(): m = c.m_rect(0, 0, tw, th)
    ys = np.where(m.any(1))[0]; y0, y1 = ys.min(), ys.max() + 1
    t = (c.Y - y0) / max(1, y1 - y0)
    if style == 'gold':
        c.metal(m, GOLD, outline=False)
    else:
        L, B, D = (IVORY_L, IVORY, IVORY_D) if style == 'ivory' else (NAVY_L, NAVY, NAVY_D)
        col = np.where((t < 0.28)[..., None], C(L), np.where((t < 0.72)[..., None], C(B), C(D))) * np.ones((th, tw, 1))
        c.rgb[m] = col[m]; c.a |= m
        if inner:
            e3 = erode(erode(erode(m))); e4 = erode(e3); line = e3 & ~e4
            c.rgb[line] = c.rgb[line] * (0.86 if style == 'ivory' else 1.35)
        r1 = m & ~erode(m); r2 = erode(m) & ~erode(erode(m))
        rg = ramp(GOLD)
        c.rgb[r2] = rg[3]; c.rgb[r1] = rg[1]
        c.rgb[r1 & (c.Y < th * 0.5)] = rg[2]
    if gem is not None:
        c.gem(gem[0] * tw, gem[1] * th, gem_r * min(tw, th) * 2.2, GEM, 'diamond', setting=GOLD)
    if glow_edge is not None:
        e = m & ~erode(m); c.glow_mask(e, glow_edge)
    return c.images()

class Plates:
    """Shaped plates: an alpha-cut painted face + a gold backing plate (same silhouette) behind it for edge thickness."""
    def __init__(self, m, k, ydown):
        self.m, self.k, self.ydown, self.cache = m, k, ydown, {}
    def tex(self, key, w, h, poly, style, gem, gem_r):
        ck = (key, round(w, 2), round(h, 2), style, gem)
        if ck not in self.cache:
            tw, th = max(4, int(round(w * TD))), max(4, int(round(h * TD)))
            main, glow = paint_shape(tw, th, poly, style, gem, gem_r)
            back, _ = paint_shape(tw, th, poly, 'gold', None, inner=False)
            uv = self.m.atlas.add(main); bu = self.m.atlas.add(back)
            g = self.m.glow_atlas().add(glow) if glow is not None else None
            self.cache[ck] = (uv, bu, g)
        return self.cache[ck]
    def add(self, bone, c, w, h, poly, style='ivory', rot=(0, 0, 0), gem=None, gem_r=0.16, depth=0.35, key=None, mirror=False, back=True):
        """Plate in the XY plane centred at c (w across X, h along Y), its face towards -Z, rotated by rot about c."""
        uv, bu, g = self.tex(key or str(poly), w, h, poly, style, gem, gem_r)
        if self.ydown: uv, bu = flipv(uv), flipv(bu); g = flipv(g) if g is not None else None
        if mirror: uv, bu = uv.mirrored(), bu.mirrored(); g = g.mirrored() if g is not None else None
        x0, x1, y0, y1 = c[0] - w / 2, c[0] + w / 2, c[1] - h / 2, c[1] + h / 2
        F = lambda u: {'uv': [round(v, 4) for v in u], 'texture': u.tex}
        self.m.cube(bone, [x0, y0, c[2] - 0.04], [x1, y1, c[2] + 0.04], {'north': F(uv), 'south': F(bu.mirrored())}, list(c), list(rot))
        if back and depth > 0:
            self.m.cube(bone, [x0, y0, c[2] + depth - 0.04], [x1, y1, c[2] + depth + 0.04], {'north': F(bu), 'south': F(bu.mirrored())}, list(c), list(rot))
        if g is not None:
            self.m.cube(bone, [x0, y0, c[2] - 0.09], [x1, y1, c[2] - 0.05], {'north': F(g)}, list(c), list(rot))

def mirror_poly(poly): return [(1 - x, y) for x, y in poly]

# common silhouettes (x right, y down, 0..1)
SHIELD = [(0.0, 0.0), (1.0, 0.0), (1.0, 0.55), (0.5, 1.0), (0.0, 0.55)]
LEAF = [(0.15, 0.0), (0.85, 0.0), (1.0, 0.35), (0.75, 0.8), (0.5, 1.0), (0.25, 0.8), (0.0, 0.35)]
DIAMOND = [(0.5, 0.0), (1.0, 0.5), (0.5, 1.0), (0.0, 0.5)]
ROUND = [(0.2, 0.0), (0.8, 0.0), (1.0, 0.2), (1.0, 0.8), (0.8, 1.0), (0.2, 1.0), (0.0, 0.8), (0.0, 0.2)]
SPIKE = [(0.5, 0.0), (0.82, 0.42), (0.72, 1.0), (0.28, 1.0), (0.18, 0.42)]
TRAP_DN = [(0.18, 0.0), (0.82, 0.0), (1.0, 1.0), (0.0, 1.0)]      # narrow top, wide bottom
TRAP_UP = [(0.0, 0.0), (1.0, 0.0), (0.82, 1.0), (0.18, 1.0)]
CHEVRON = [(0.0, 0.0), (0.5, 0.42), (1.0, 0.0), (1.0, 0.55), (0.5, 1.0), (0.0, 0.55)]
STAR8 = [(0.5 + 0.5 * math.cos(math.pi * i / 8 - math.pi / 2) * (1.0 if i % 2 == 0 else 0.48), 0.5 + 0.5 * math.sin(math.pi * i / 8 - math.pi / 2) * (1.0 if i % 2 == 0 else 0.48)) for i in range(16)]
PEC_R = [(0.0, 0.06), (0.7, 0.0), (1.0, 0.16), (0.98, 0.6), (0.72, 0.9), (0.34, 1.0), (0.06, 0.8)]   # right-hand pec, inner edge at x=0

def shell_tex(w, h, kind):
    """Painted base layer (mostly hidden): dark navy suit, clean lines, an ivory panel on the sides / shins."""
    c = Canvas(w, h); m = c.m_rect(0, 0, w, h)
    c.rgb[m] = C(NAVY); c.a |= m
    for x in range(3, w - 1, 4): c.rgb[:, x] = C(NAVY_D) * 1.1
    rg = ramp(GOLD)
    if kind == 'side':
        p = c.m_poly([(w * 0.2, h * 0.04), (w * 0.8, h * 0.04), (w * 0.8, h * 0.6), (w * 0.5, h * 0.7), (w * 0.2, h * 0.6)])
        c.rgb[p] = C(IVORY); e = p & ~erode(p); c.rgb[e] = rg[2]
    if kind == 'shin':
        p = c.m_rect(0, h * 0.5, w, h); c.rgb[p] = C(IVORY); c.rgb[p & (c.Y > h * 0.8)] = C(IVORY_D)
    if kind in ('belt',):
        c.rgb[c.m_rect(0, h * 0.74, w, h * 0.83)] = rg[2]
    return c.images()[0]

def solid_tex(col, w=4, h=4):
    c = Canvas(w, h); c.rgb[:] = C(col); c.a[:] = True; return c.images()[0]

# ===================================================================== ARMOUR (armor_set, Y down)
def armor(name):
    m = BB(name, Atlas(1024, 1024)); k = Kit(m); PL = Plates(m, k, ydown=True)
    F = lambda u: {'uv': [round(v, 4) for v in u], 'texture': u.tex}
    def shell(bone, f, t, front, side, back=None):
        dx, dy, dz = [abs(t[i] - f[i]) for i in range(3)]
        fu = flipv(k.main(('sh', front, dx, dy), shell_tex(int(dx * TD), int(dy * TD), front)))
        su = flipv(k.main(('sh', side, dz, dy), shell_tex(int(dz * TD), int(dy * TD), side)))
        bu = flipv(k.main(('sh', back or front, dx, dy), shell_tex(int(dx * TD), int(dy * TD), back or front)))
        cap = k.main('navycap', solid_tex(NAVY_D))
        m.cube(bone, f, t, {'north': F(fu), 'south': F(bu), 'east': F(su), 'west': F(su), 'up': F(cap), 'down': F(cap)})
    # ---------------- torso
    m.bone('body', [0, 0, 0]); b = 'body'
    shell(b, [-4.25, -0.25, -2.25], [4.25, 12.25, 2.25], 'belt', 'side', 'belt')
    for s in (-1, 1):   # angled pec plates forming a shallow V around the core
        PL.add(b, (s * 2.3, 3.0, -2.75), 4.7, 6.2, PEC_R if s > 0 else mirror_poly(PEC_R), 'ivory', rot=(0, s * 10, 0), key='pec' + str(s))
        PL.add(b, (s * 2.55, 7.7, -2.5), 3.1, 2.7, [(0.0, 0.0), (1.0, 0.1), (0.85, 1.0), (0.1, 0.85)] if s > 0 else mirror_poly([(0.0, 0.0), (1.0, 0.1), (0.85, 1.0), (0.1, 0.85)]), 'ivory', rot=(0, s * 10, 0), key='abd' + str(s), depth=0.25)
        PL.add(b, (s * 2.2, -0.5, -2.45), 3.8, 2.0, TRAP_UP, 'ivory', rot=(28, 0, s * -6), key='collar')          # flared gorget
        PL.add(b, (s * 4.45, 2.6, 0.0), 4.4, 5.4, SHIELD, 'ivory', rot=(0, s * -90, 0), key='ribs', depth=0.3)          # side plates
    PL.add(b, (0, 3.2, -3.2), 5.0, 6.4, [(0.5, 0.0), (0.8, 0.2), (1.0, 0.5), (0.8, 0.8), (0.5, 1.0), (0.2, 0.8), (0.0, 0.5), (0.2, 0.2)], 'gold', key='core_set', depth=0.35)   # gold core setting
    m.bone('core', [0, 3.3, -3.6], b)
    gem3d(m, k, 'core', [0, 3.2, -3.75], 2.9, GEM, rot=(0, 0, 45))
    PL.add(b, (0, 9.8, -2.55), 8.9, 1.3, ROUND, 'gold', key='belt', depth=0.2)                                     # belt + gem plate
    PL.add(b, (0, 9.8, -2.8), 2.6, 2.6, [(0.5, 0), (1, 0.28), (1, 0.72), (0.5, 1), (0, 0.72), (0, 0.28)], 'gold', gem=(0.5, 0.5), gem_r=0.2, key='buckle', depth=0.2)
    PL.add(b, (0, 15.0, -2.62), 2.9, 9.4, [(0, 0), (1, 0), (1, 0.85), (0.5, 1), (0, 0.85)], 'navy', key='tabard')   # dark centre tabard
    for s in (-1, 1):   # flared front hip plates (tassets) and side tassets
        PL.add(b, (s * 2.75, 12.9, -2.75), 3.5, 5.8, LEAF, 'ivory', rot=(-8, 0, s * -12), key='tasset')
        PL.add(b, (s * 4.6, 12.6, 0.0), 4.2, 5.0, LEAF, 'ivory', rot=(0, s * -90, s * 10), key='stasset')
    PL.add(b, (0, 3.6, 2.75), 7.6, 7.4, [(0, 0), (1, 0), (1, 0.6), (0.5, 1), (0, 0.6)], 'ivory', rot=(0, 180, 0), gem=(0.5, 0.3), gem_r=0.1, key='backplate')
    m.bone('tab_b', [0, 9.8, 2.7], b)
    PL.add('tab_b', (0, 15.4, 2.7), 5.6, 10.6, [(0, 0), (1, 0), (1, 0.82), (0.5, 1), (0, 0.82)], 'ivory', rot=(0, 180, 0), key='rtabard')
    # ---------------- arms
    for s, n in ((-1, 'r'), (1, 'l')):
        a = m.bone('arm_' + n, [s * 5, 2, 0])
        lo, hi = (-8.25, -3.75) if s < 0 else (3.75, 8.25)
        shell(a, [lo, -0.25, -2.25], [hi, 12.25, 2.25], 'shin', 'shin')
        cx = s * 6.0
        PL.add(a, (cx, -2.55, 0.0), 6.4, 6.6, ROUND, 'ivory', rot=(90, 0, s * -10), key='pcap', depth=0.3)              # shoulder cap
        for i, (yy, hh, ww, ang) in enumerate(((-1.2, 3.8, 6.6, 26), (0.9, 3.4, 6.0, 18), (2.8, 3.0, 5.2, 10))):       # layered drop plates
            PL.add(a, (s * (8.95 + i * 0.15), yy, 0.0), ww, hh, SHIELD, 'ivory', rot=(0, s * -90, s * -ang), gem=(0.5, 0.35) if i == 0 else None, gem_r=0.13, key='pdrop%d' % i)
        PL.add(a, (s * 7.4, -5.0, 0.6), 4.6, 4.4, [(0.35, 0.0), (0.75, 0.25), (1.0, 1.0), (0.0, 1.0), (0.15, 0.45)], 'ivory', rot=(0, s * -90, s * 14), key='pfin')   # rising fin
        gem3d(m, k, a, [s * 9.75, -1.4, 0.0], 1.3, GEM, setting=GOLD, rot=(45, 0, 0))
        for zz, ry in ((-3.2, 0), (3.2, 180)):   # front/back faces of the pauldron, tilted with the drop plates
            PL.add(a, (s * 6.6, -0.7, zz), 5.6, 4.8, [(0.0, 0.0), (1.0, 0.0), (1.0, 0.45), (0.7, 1.0), (0.25, 0.85), (0.0, 0.5)] if s > 0 else mirror_poly([(0.0, 0.0), (1.0, 0.0), (1.0, 0.45), (0.7, 1.0), (0.25, 0.85), (0.0, 0.5)]), 'ivory', rot=(0, ry, s * -14 if ry == 0 else s * 14), key='pfront' + str(s) + str(ry))
        PL.add(a, (s * 8.55, 6.2, 1.0), 3.0, 2.6, DIAMOND, 'ivory', rot=(0, s * -90, 0), key='elbow', depth=0.25)
        PL.add(a, (s * 8.6, 9.4, 0.0), 4.8, 4.4, TRAP_DN, 'ivory', rot=(0, s * 90, s * -7), gem=(0.5, 0.45), gem_r=0.12, key='vam_o')   # flared vambrace
        PL.add(a, (s * 6.0, 9.4, -2.6), 4.4, 4.4, TRAP_DN, 'ivory', rot=(7, 0, 0), key='vam_f')
        PL.add(a, (s * 6.0, 9.4, 2.6), 4.4, 4.4, TRAP_DN, 'ivory', rot=(-7, 180, 0), key='vam_f')
        PL.add(a, (s * 6.0, 11.8, -2.45), 4.6, 0.9, ROUND, 'gold', key='cuff', depth=0.15)
    # ---------------- legs
    for s, n in ((-1, 'r'), (1, 'l')):
        g = m.bone('leg_' + n, [s * 1.9, 12, 0])
        lo, hi = (-4.25, 0.25) if s < 0 else (-0.25, 4.25)
        shell(g, [lo, 11.75, -2.25], [hi, 24.25, 2.25], 'shin', 'shin')
        x = s * 1.9; xo = s * 4.45
        PL.add(g, (x, 17.4, -2.8), 3.4, 3.8, DIAMOND, 'ivory', rot=(-12, 0, 0), gem=(0.5, 0.5), gem_r=0.18, key='knee')
        PL.add(g, (x, 20.5, -2.6), 3.8, 3.6, [(0.5, 0.0), (1.0, 0.3), (1.0, 1.0), (0.0, 1.0), (0.0, 0.3)], 'ivory', key='greave')
        PL.add(g, (xo, 20.3, 0.0), 4.0, 3.8, [(0.5, 0.0), (1.0, 0.3), (1.0, 1.0), (0.0, 1.0), (0.0, 0.3)], 'ivory', rot=(0, s * -90, 0), key='greave_o')
        # boot: solid ivory boot with a flared cuff, a pointed toe and a gold heel wing
        bt = k.main('boot', paint_shape(18, 8, ROUND, 'ivory', inner=False)[0]); btt = k.main('boot_t', solid_tex(IVORY_L)); sole = k.main('sole', solid_tex(NAVY_D))
        m.cube(g, [lo - 0.2, 22.2, -2.6], [hi + 0.2, 24.3, 2.5], {'north': F(flipv(bt)), 'south': F(flipv(bt)), 'east': F(flipv(bt)), 'west': F(flipv(bt)), 'up': F(btt), 'down': F(sole)})
        m.cube(g, [x - 1.6, 23.0, -3.6], [x + 1.6, 24.3, -2.6], {'north': F(flipv(bt)), 'east': F(flipv(bt)), 'west': F(flipv(bt)), 'up': F(btt), 'down': F(sole)}, [x, 24.3, -2.6], [-14, 0, 0])
        PL.add(g, (x, 22.0, -2.9), 4.6, 1.6, TRAP_UP, 'ivory', rot=(-22, 0, 0), key='cuff_f', depth=0.2)
        PL.add(g, (xo + s * 0.25, 22.0, 0.0), 5.0, 1.6, TRAP_UP, 'ivory', rot=(0, s * -90, s * 18), key='cuff_o', depth=0.2)
        PL.add(g, (xo + s * 0.3, 22.4, 1.8), 3.2, 2.0, [(0.0, 1.0), (0.2, 0.3), (1.0, 0.0), (0.7, 0.6), (1.0, 1.0)], 'gold', rot=(0, s * -90, 0), key='heelwing', depth=0.0, back=False)
        m.cube(g, [lo - 0.25, 24.0, -3.0], [hi + 0.25, 24.35, 2.55], {'north': F(k.main('gold_s', solid_tex(GOLD))), 'east': F(k.main('gold_s', solid_tex(GOLD))), 'west': F(k.main('gold_s', solid_tex(GOLD))), 'south': F(k.main('gold_s', solid_tex(GOLD)))})
    S5.fit_centre(m, 'body')
    fx = Particles(m, 'body', 3.0, 'af'); rr = random.Random(name)
    sp = k.glow('spark', P.dot(GEM, 3, core=(255, 255, 255)))
    for i in range(5): fx.add([rr.uniform(-1.2, 1.2), rr.uniform(2.4, 4.2), -3.8], [rr.uniform(-0.6, 0.6), -rr.uniform(3, 5), -rr.uniform(0.2, 1.0)], 0.4, sp, i / 5, spin=140)
    def build(c):
        sw = {'idle': (90, 2), 'walk': (240, 7), 'run': (330, 14), 'jump': (200, 9), 'fly': (260, 18)}[c]
        return {'core': {'scale': [(0, 'math.sin(query.anim_time*180)*0.07+1', 'math.sin(query.anim_time*180)*0.07+1', 'math.sin(query.anim_time*180)*0.07+1')],
                         'rotation': [(0, 0, 0, 'math.sin(query.anim_time*90)*8')]},
                'tab_b': {'rotation': [(0, '%d+math.sin(query.anim_time*%d+40)*%d' % (sw[1] if c in ('run', 'fly') else 0, sw[0], sw[1]), 0, 0)]}}
    clips(m, build, 3.0, fx)
    return m

# ===================================================================== HELM (helmet, Y up, -Z face)
def helm_front(w, h):
    c = Canvas(w, h); m = c.m_rect(0, 0, w, h)
    c.rgb[m] = C(NAVY_D); c.a |= m
    c.rgb[c.m_rect(0, 0, w, h * 0.12)] = C(IVORY)
    for s in (-1, 1):                                   # glowing eye slits, angled
        e = c.m_poly([(w / 2 + s * w * 0.08, h * 0.5), (w / 2 + s * w * 0.36, h * 0.43), (w / 2 + s * w * 0.36, h * 0.5), (w / 2 + s * w * 0.1, h * 0.56)])
        c.rgb[e] = C(GEM); c.glow_mask(e, GEM)
    c.rgb[c.m_rect(w / 2 - 0.6, h * 0.58, w / 2 + 0.6, h * 0.9)] = C(NAVY_L)
    return c.images()

def helm(name):
    m = BB(name, Atlas(512, 512)); k = Kit(m); PL = Plates(m, k, ydown=False)
    F = lambda u: {'uv': [round(v, 4) for v in u], 'texture': u.tex}
    m.bone('helm', [0, 4, 0]); h = 'helm'
    fr = helm_front(36, 36); fu = k.main('hfront', fr[0]); fg = k.glow('hfront_g', fr[1])
    side = k.main('hside', paint_shape(36, 36, ROUND, 'ivory')[0]); top = k.main('htop', paint_shape(36, 36, ROUND, 'ivory', inner=False)[0])
    m.cube(h, [-4.35, -0.2, -4.35], [4.35, 8.4, 4.35], {'north': F(fu), 'south': F(side), 'east': F(side), 'west': F(side), 'up': F(top), 'down': F(top)})
    m.cube(h, [-4.36, -0.2, -4.4], [4.36, 8.4, -4.36], {'north': F(fg)})
    for s in (-1, 1):   # angled cheek guards and ear plates
        cp = [(0.55, 0.0), (1.0, 0.0), (1.0, 0.55), (0.25, 1.0), (0.0, 0.8)]
        PL.add(h, (s * 3.0, 1.8, -4.75), 2.9, 3.6, cp if s > 0 else mirror_poly(cp), 'ivory', rot=(0, s * -24, 0), key='cheek' + str(s))
        PL.add(h, (s * 4.7, 3.6, 0.6), 6.4, 6.0, SHIELD, 'ivory', rot=(0, s * -90, 0), gem=(0.5, 0.32), gem_r=0.1, key='ear')
        for i in range(2):   # swept wing crests at the temples
            PL.add(h, (s * 4.95, 6.6 + i * 1.3, 2.4 + i * 0.9), 6.6 - i * 1.2, 2.0, [(0.0, 0.5), (0.25, 0.0), (1.0, 0.2), (0.85, 0.75), (0.2, 1.0)], 'ivory', rot=(-18 - i * 14, s * -90, 0), key='hwing%d' % i, depth=0.25)
    PL.add(h, (0, 6.4, -4.85), 9.4, 2.8, [(0.0, 0.0), (1.0, 0.0), (1.0, 0.4), (0.5, 1.0), (0.0, 0.4)], 'gold', gem=(0.5, 0.42), gem_r=0.2, key='brow', depth=0.25)
    gold = k.main('hgold', paint_shape(16, 8, ROUND, 'gold', inner=False)[0])
    m.cube(h, [-4.6, 7.6, -4.6], [4.6, 8.7, 4.6], {fc: F(gold) for fc in ('north', 'south', 'east', 'west', 'up')})   # crown band
    # crown: tall centre spike with the cyan gem, flanking and side spikes, a lower crown at the back
    PL.add(h, (0, 11.6, -3.9), 3.2, 7.6, SPIKE, 'ivory', rot=(-8, 0, 0), gem=(0.5, 0.62), gem_r=0.22, key='spike_c')
    for s in (-1, 1):
        PL.add(h, (s * 2.7, 10.4, -3.6), 2.6, 5.4, SPIKE, 'ivory', rot=(-6, 0, s * -14), gem=(0.5, 0.66), gem_r=0.16, key='spike_f')
        PL.add(h, (s * 4.3, 9.6, -1.4), 2.4, 4.0, SPIKE, 'ivory', rot=(0, s * -62, s * -10), key='spike_s')
        PL.add(h, (s * 3.0, 9.4, 3.5), 2.4, 3.6, SPIKE, 'ivory', rot=(0, 180 + s * 20, s * 8), key='spike_b')
    PL.add(h, (0, 1.0, 4.75), 8.4, 2.6, TRAP_UP, 'ivory', rot=(-14, 180, 0), key='nape', depth=0.25)
    gem3d(m, k, h, [0, 11.0, -4.35], 1.3, GEM, rot=(0, 0, 45))
    fx = Particles(m, 'helm', 3.0, 'hf'); rr = random.Random(name)
    sp = k.glow('spark', P.dot(GEM, 3, core=(255, 255, 255)))
    for i in range(3): fx.add([rr.uniform(-1, 1), 14.5, -3.8], [rr.uniform(-1, 1), rr.uniform(2, 3), 0], 0.4, sp, i / 3, spin=140)
    clips(m, lambda c: {}, 3.0, fx, names=('idle',))
    return m

# ===================================================================== WINGS (back slot, wings4 frame)
def feather_tex(w, h, kind='prim', seed=1):
    """A feather face, root at the top row, rounded asymmetric tip; clean bands, no noise. Transparent outside."""
    c = Canvas(w, h)
    X, Y = c.X, c.Y; t = Y / h; sx = w * 0.42
    if kind == 'cov': prof = np.clip(np.minimum(t / 0.15, 1) * np.sqrt(np.clip(1 - ((t - 0.5) / 0.52) ** 2, 0, 1)) * 1.1, 0, 1)
    else: prof = np.clip(np.minimum(t / 0.1, 1) * np.where(t < 0.7, 1.0, np.sqrt(np.clip(1 - ((t - 0.7) / 0.31) ** 2, 0, 1))), 0, 1)
    lead = (sx - 0.4) * prof + 0.35; trail = (w - sx - 0.4) * prof + 0.35
    u = X - sx; m = ((u < 0) & (-u <= lead)) | ((u >= 0) & (u <= trail))
    if kind != 'cov':   # jagged trailing vane: stepped notches (pixel-art serration)
        rr = np.random.default_rng(seed); cuts = rr.uniform(0.25, 0.85, 4)
        for cy in cuts: m &= ~((u > trail * 0.55) & (Y > cy * h) & (Y < cy * h + 3) & (u > trail * 0.55 + (Y - cy * h) * 0.9))
    col = np.where((u > trail * 0.5)[..., None], C((246, 245, 250)), C((255, 255, 255))) * np.ones((h, w, 1))
    col = np.where(((u > trail * 0.82) | (t > 0.85))[..., None], C((222, 220, 238)), col)
    col = np.where(((((Y - np.abs(u) * 0.7) % 4.0) < 1.0) & (np.abs(u) > 1))[..., None], col * 0.95, col)
    col = np.where((np.abs(u) < 0.55)[..., None], C((246, 222, 160)), col)
    c.rgb[m] = col[m]; c.a |= m
    e = m & ~erode(m); c.rgb[e] = C((168, 164, 198))
    if kind == 'prim':
        tipm = e & (t > 0.72); c.rgb[tipm] = ramp(GOLD)[2]
        e2 = erode(m) & ~erode(erode(m)) & (t > 0.86); c.rgb[e2] = C(GEM)
    return c.images()[0]

# wing skeleton: tall wings. Root on the upper back, elbow up/out, wrist crest above the head, hand going out and down.
WS, WE, WW, WH = (2.0, -15.0, -1.0), (6.0, -7.0, -1.9), (11.0, 4.5, -2.8), (16.5, 9.0, -4.2)

def feather(m, bone, R, L, w, ang, uv, side_uv, s, tilt=0.0, twist=0.0, rachis=True):
    """A feather hanging down from R: a shaped plate (the vanes) on a solid rachis box (real thickness from the side)."""
    F = lambda u: {'uv': [round(v, 4) for v in u], 'texture': u.tex}
    fu = uv if s > 0 else uv.mirrored()
    rot = [tilt, twist * s, ang]
    m.cube(bone, [R[0] - w / 2, R[1] - L, R[2] - 0.05], [R[0] + w / 2, R[1], R[2] + 0.05], {'north': F(fu), 'south': F(fu.mirrored())}, list(R), rot)
    if rachis:
        rx = R[0] + (-0.08 * w) * s
        m.cube(bone, [rx - 0.28, R[1] - L * 0.86, R[2] - 0.28], [rx + 0.28, R[1], R[2] + 0.28], {f: F(side_uv) for f in ('north', 'south', 'east', 'west', 'down')}, list(R), rot)

def wings(name):
    m = BB(name, Atlas(512, 512)); k = Kit(m); PL = Plates(m, k, ydown=False)
    F = lambda u: {'uv': [round(v, 4) for v in u], 'texture': u.tex}
    # feather faces are full bright (luminous ivory, as in the concept); the solid rachis and gold frame keep the shading
    prim = k.glow('fprim', feather_tex(20, 104, 'prim')); prim2 = k.glow('fprim2', feather_tex(20, 104, 'prim', seed=2)); sec = k.glow('fsec', feather_tex(20, 84, 'sec'))
    ter = k.glow('fter', feather_tex(20, 60, 'sec')); gcov = k.glow('fgcov', feather_tex(18, 44, 'cov'))
    mcov = k.glow('fmcov', feather_tex(16, 28, 'cov')); lcov = k.glow('flcov', feather_tex(14, 16, 'cov'))
    rach = k.main('rach', solid_tex((246, 236, 214)))
    gb = k.main('gbar', paint_shape(8, 24, [(0, 0), (1, 0), (1, 1), (0, 1)], 'gold', inner=False)[0])
    ivb = k.main('ivbar', paint_shape(8, 24, [(0, 0), (1, 0), (1, 1), (0, 1)], 'ivory', inner=False)[0])
    prims = {}
    for s, n in ((1, 'r'), (-1, 'l')):
        wb, mb, hb = W4.skeleton(m, n, s, pts=(WS, WE, WW))
        X = lambda p: [p[0] * s, p[1], p[2]]
        # leading edge: an ivory arm with a gold edge, a gold wrist crest with the cyan gem (the wing's focal point)
        for bone_, A, B, wd in ((wb, WS, WE, 2.0), (mb, WE, WW, 1.8), (hb, WW, WH, 1.4)):
            A2, B2 = X([A[0], A[1] + 0.4, A[2] - 0.7]), X([B[0], B[1] + 0.4, B[2] - 0.7])
            from celestial7 import seg3d
            seg3d(m, bone_, A2, B2, wd, wd * 0.9, ivb)
            seg3d(m, bone_, [A2[0], A2[1] + wd * 0.45, A2[2] - 0.2], [B2[0], B2[1] + wd * 0.45, B2[2] - 0.2], wd * 0.45, wd * 0.6, gb)
        PL.add(hb, X([WW[0] + 0.2, WW[1] + 3.0, WW[2] - 1.6]), 5.4, 7.0, [(0.5, 0.0), (0.82, 0.3), (1.0, 0.75), (0.5, 1.0), (0.0, 0.75), (0.18, 0.3)], 'gold', rot=(0, 0, s * -18), gem=(0.5, 0.58), gem_r=0.22, key='crest', depth=0.4)
        gem3d(m, k, hb, X([WW[0] + 0.5, WW[1] + 2.4, WW[2] - 2.2]), 1.5, GEM, rot=(0, 0, 45))
        PL.add(mb, X([WE[0] + 0.4, WE[1] + 1.4, WE[2] - 1.4]), 3.0, 3.4, DIAMOND, 'gold', gem=(0.5, 0.5), gem_r=0.24, key='elbow', depth=0.3)
        pl = []
        # primaries: from the wrist out to the tip, hanging down and fanning outward; long, broad, curved back
        NP = 10; rv = random.Random(name + n)
        for i in range(NP):
            t = i / (NP - 1); R = lerp3(WW, WH, t); R[2] += 0.5 + 0.12 * i
            L = 30.0 + 5.0 * math.sin(t * math.pi * 0.75) + rv.uniform(-1.2, 1.2)
            pb = m.bone('p%d_%s' % (i, n), X(R), hb); pl.append(pb)
            feather(m, pb, X(R), L, 5.8 + rv.uniform(-0.4, 0.5), s * (8 + 56 * t ** 1.25), prim if i % 2 else prim2, rach, s, tilt=-8 - 8 * t, twist=8 + 10 * t)
        for i in range(7):   # primary coverts: a second, shorter layer over the primaries (layering, no gaps)
            t = (i + 0.5) / 7; R = lerp3(WW, WH, t); R[2] -= 0.15
            feather(m, hb, X(R), 17.0 + 3.0 * t, 5.2, s * (6 + 48 * t ** 1.25), sec, rach, s, tilt=-9, rachis=False)
        prims[n] = pl
        for i in range(9):   # secondaries along the forearm, hanging nearly straight down, overlapping
            t = i / 8; R = lerp3(WE, WW, t); R[2] += 0.32 - 0.02 * i
            feather(m, mb, X(R), 22.0 + 8.0 * t, 5.8, s * (-4 + 12 * t), sec, rach, s, tilt=-5, twist=4)
        for i in range(5):   # tertials near the body, a little shorter, angled in
            t = 0.1 + 0.2 * i; R = lerp3(WS, WE, t); R[2] += 0.2
            feather(m, wb, X(R), 16.0 + 6.0 * t, 5.8, s * (-12 + 7 * t), ter, rach, s, tilt=-3)
        for i in range(11):  # greater coverts: over the upper half of the flight feathers
            t = i / 10; R = lerp3(WS, WH, 0.06 + 0.84 * t); R[1] -= 0.6; R[2] -= 0.35
            bone_ = wb if t < 0.3 else (mb if t < 0.62 else hb)
            ang = -8 + 14 * t if t < 0.62 else 6 + 44 * ((t - 0.62) / 0.38) ** 1.2
            feather(m, bone_, X(R), 12.5 + 2.5 * math.sin(t * math.pi), 5.0, s * ang, gcov, rach, s, tilt=-8, rachis=False)
        for i in range(10):  # median coverts
            t = i / 9; R = lerp3(WS, WH, 0.04 + 0.82 * t); R[1] -= 0.1; R[2] -= 0.8
            bone_ = wb if t < 0.3 else (mb if t < 0.62 else hb)
            feather(m, bone_, X(R), 7.5, 4.4, s * (-6 + 46 * t ** 1.6), mcov, rach, s, tilt=-10, rachis=False)
        for i in range(10):  # lesser coverts: small rounded scales along the leading edge, root to wrist
            t = i / 9; R = lerp3(WS, WW, 0.02 + 0.98 * t); R[1] += 0.3; R[2] -= 1.25
            bone_ = wb if t < 0.45 else mb
            feather(m, bone_, X(R), 3.6, 3.4, s * (-4 + 10 * t), lcov, rach, s, tilt=-12, rachis=False)
    # back harness: a shaped ivory/gold crest plate on the upper back joining both wing roots, with the cyan core
    m.bone('harness', [0, -14, -0.6])
    PL.add('harness', (0, -13.0, -0.7), 7.4, 8.0, [(0.5, 0.0), (1.0, 0.2), (0.9, 0.62), (0.5, 1.0), (0.1, 0.62), (0.0, 0.2)], 'ivory', gem=(0.5, 0.42), gem_r=0.16, key='harness', depth=0.4)
    for s in (-1, 1):
        PL.add('harness', (s * 3.2, -14.0, -1.0), 3.4, 3.4, ROUND, 'gold', key='hub', depth=0.4)
    gem3d(m, k, 'harness', [0, -12.6, -1.4], 1.6, GEM, rot=(0, 0, 45))
    fx = Particles(m, None, 4.0, 'wf'); rr = random.Random(name)
    mote = k.glow('wmote', P.dot(GEM, 3, core=(255, 255, 255)))
    for i in range(6):
        s = 1 if i % 2 else -1
        fx.add([s * rr.uniform(10, 12), rr.uniform(1, 4), -3.4], [s * rr.uniform(0, 2), rr.uniform(3, 6), -rr.uniform(0, 1.5)], 0.5, mote, i / 6, spin=140)
    flake = k.main('flake', feather_tex(6, 14, 'cov'))
    for i in range(4):
        s = 1 if i % 2 else -1
        fx.add([s * rr.uniform(8, 16), rr.uniform(-20, -12), -2.8], [s * rr.uniform(1, 3), -10, -1.5], 1.4, flake, i / 4 + 0.05, sway=25, plate=True)
    def build(c):
        tr = {}
        for s, n in ((1, 'r'), (-1, 'l')): tr.update(W4.flap_tracks(c, n, s, prims[n], 'feather', amp=0.8))
        tr['harness'] = {'position': [(0, 0, 'math.sin(query.anim_time*90)*0.1', 0)]}
        return tr
    clips(m, build, 4.0, fx)
    W4.place_back(m, root_y=WS[1])
    return m

def weapon(name):
    import celestial7 as C7
    return C7.weapon(name)
