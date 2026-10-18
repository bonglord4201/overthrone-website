# OVERTHRONE v6 sets: painted armour (art.py / armorart.py) with sculpted layers, moving parts and particles.
# Same frames and slot rules as sets5.py (read its header). Every face of every piece gets its own painted texture,
# sized to the face (D px per model unit), so nothing is stretched or flat.
import math, random
from bb import BB, Atlas, UV
import paint as P
import armorart as AA
from art import Canvas, ramp, sh, lit
from fx import Kit, Particles, clips
from heads4 import rot_to
from sets5 import fit_centre

D = 4

def col_of(c):
    """A colour, or the colour of a (colour, rim, style) material spec."""
    return c[0] if isinstance(c[0], (tuple, list)) else c

def flipv(uv): return UV((uv[0], uv[3], uv[2], uv[1]), getattr(uv, 'tex', 0))

class Painted:
    """Adds boxes whose faces are painted by armorart functions. faces = {face: (fn, kwargs)} or a single (fn, kwargs)
    for all six. Glowing parts of a face go on a slightly bigger copy of the box drawn full bright."""
    def __init__(self, m, k, pal, ydown=True):
        self.m, self.k, self.p, self.ydown, self.cache = m, k, pal, ydown, {}
    def tex(self, fn, kw, w, h):
        key = (fn.__name__, tuple(sorted((a, str(b)) for a, b in kw.items())), w, h)
        if key not in self.cache:
            main, glow = fn(w, h, self.p, **kw)
            uv = self.m.atlas.add(main); g = self.m.glow_atlas().add(glow) if glow is not None else None
            self.cache[key] = (uv, g)
        return self.cache[key]
    def box(self, bone, f, t, faces, origin=None, rotation=None):
        dx, dy, dz = [abs(t[i] - f[i]) for i in range(3)]
        dims = {'north': (dx, dy), 'south': (dx, dy), 'east': (dz, dy), 'west': (dz, dy), 'up': (dx, dz), 'down': (dx, dz)}
        if not isinstance(faces, dict): faces = {k: faces for k in dims}
        main, glow = {}, {}
        for fc, (w, h) in dims.items():
            spec = faces.get(fc) or faces.get('*')
            if spec is None: continue
            fn, kw = spec
            px, py = max(2, min(64, int(round(w * D)))), max(2, min(64, int(round(h * D))))
            uv, g = self.tex(fn, kw, px, py)
            side = fc not in ('up', 'down')
            if self.ydown and side: uv = flipv(uv); g = flipv(g) if g is not None else None
            main[fc] = uv
            if g is not None: glow[fc] = g
        e = self.m.cube(bone, f, t, {k: {'uv': [round(v, 4) for v in uv], 'texture': uv.tex} for k, uv in main.items()}, origin, rotation)
        if glow:
            ee = 0.03
            self.m.cube(bone, [f[0] - ee, f[1] - ee, f[2] - ee], [t[0] + ee, t[1] + ee, t[2] + ee],
                        {k: {'uv': [round(v, 4) for v in uv], 'texture': uv.tex} for k, uv in glow.items()}, origin, rotation)
        return e

def gem_sprite(k, col, size=12):
    c = Canvas(size, size); c.gem(size / 2, size / 2, size * 0.42, col, 'diamond'); return c.images()

def metal_sprite(w, h, p, col=None):
    c = Canvas(w, h); c.metal(c.m_rect(0, 0, w, h), col or p['gold'], outline=False); return c.images()

def dark_sprite(w, h, p):
    return AA.darkface(w, h, p)

def gem3d(m, k, bone, c, size, col, setting=None, rot=(0, 0, 45)):
    """A 3D faceted gem (full bright) in an optional gold setting."""
    g = k.glow(('gem', tuple(int(v) for v in col)), gem_sprite(k, col)[1] or gem_sprite(k, col)[0])
    h = size / 2
    if setting is not None:
        st = k.main(('gset', tuple(int(v) for v in setting)), metal_sprite(8, 8, {'gold': setting})[0])
        m.box(bone, [c[0] - h * 1.4, c[1] - h * 1.4, c[2] - h * 0.55], [c[0] + h * 1.4, c[1] + h * 1.4, c[2] + h * 0.55], st, st, origin=list(c), rotation=list(rot))
    m.box(bone, [c[0] - h, c[1] - h, c[2] - h], [c[0] + h, c[1] + h, c[2] + h], g, g, origin=list(c), rotation=list(rot))

def spike(m, k, bone, base, d, L, w, col, tip=None, segs=3):
    r = rot_to(d)
    for i in range(segs):
        f0, f1 = i / segs, (i + 1) / segs; ww = w * (1 - 0.72 * f0)
        if tip is not None and i == segs - 1: uv = k.glow(('tipg', tuple(int(v) for v in tip)), metal_sprite(6, 8, {'gold': tip})[0])
        else: uv = k.main(('spk', tuple(int(v) for v in col)), metal_sprite(6, 12, {'gold': col})[0])
        m.box(bone, [base[0] - ww / 2, base[1] + L * f0, base[2] - ww / 2], [base[0] + ww / 2, base[1] + L * f1, base[2] + ww / 2], uv, uv, origin=list(base), rotation=r)

# ===================================================================== ARMOUR (armor_set)
def armor(name, A):
    m = BB(name, Atlas(512, 512)); k = Kit(m)
    p = dict(dark=A['main'], plate=A['panel'], gold=A['trim'], gem=A['gem'], energy=A.get('energy'), cloth=A.get('cloth', A['main']),
             accent=col_of(A.get('accent', A['panel'])), motif=A.get('motif', 'royal'))
    PB = Painted(m, k, p)
    st = A.get('pauldron', 'round')
    gold = (AA.gold, {}); dark = (AA.darkface, {}); plate = (AA.plate, {'gem': False}); plate_g = (AA.plate, {'gem': True}); plate_s = (AA.plate, {'gem': True, 'scroll': True})
    gplate = (AA.plate, {'col': p['gold'], 'gem': True})
    # ---------------- body
    m.bone('body', [0, 0, 0]); b = 'body'
    PB.box(b, [-4.3, -0.25, -2.35], [4.3, 12.25, 2.35], {'north': (AA.chest, {}), 'south': (AA.chest, {'back': True}), 'east': (AA.side, {}), 'west': (AA.side, {}), 'up': dark, 'down': dark})
    PB.box(b, [-3.7, -1.3, -2.8], [3.7, 0.3, 2.8], {'*': gold})                                       # gorget
    PB.box(b, [-4.55, 8.05, -2.65], [4.55, 9.25, 2.65], {'*': gold})                                  # belt
    PB.box(b, [-1.4, 7.8, -3.05], [1.4, 9.5, -2.6], {'north': gplate, '*': gold})                     # buckle
    PB.box(b, [-1.7, 1.5, -2.85], [1.7, 4.7, -2.4], {'north': gplate, '*': gold})                     # medallion frame
    for s in (-1, 1):                                                                                # front tassets
        x0, x1 = (s * 4.25, s * 0.5) if s < 0 else (0.5, 4.25)
        PB.box(b, [min(x0, x1), 9.25, -2.9], [max(x0, x1), 13.4, -2.5], {'north': plate_g, '*': gold})
        PB.box(b, [min(x0, x1), 13.2, -2.95], [max(x0, x1), 13.7, -2.45], {'*': gold})
    m.bone('body_core', [0, 3.1, -3.25], 'body')
    gem3d(m, k, 'body_core', [0, 3.1, -3.25], 1.5, p['gem'])
    m.bone('cape', [0, 9.0, 2.75], 'body')                                                          # cape (sways)
    PB.box('cape', [-3.4, 9.0, 2.65], [3.4, 19.0, 2.9], {'south': (AA.plate, {'col': p['cloth'], 'gem': True, 'scroll': True}), 'north': (AA.plate, {'col': p['cloth'], 'gem': False}), '*': gold})
    # ---------------- arms
    for s, n in ((-1, 'r'), (1, 'l')):
        a = m.bone('arm_' + n, [s * 5, 2, 0])
        lo, hi = (-8.3, -3.7) if s < 0 else (3.7, 8.3)
        outf, inf = ('west', 'east') if s < 0 else ('east', 'west')
        PB.box(a, [lo, -0.3, -2.3], [hi, 12.3, 2.3], {outf: (AA.arm, {'face': 'out'}), inf: (AA.arm, {'face': 'in'}), 'north': (AA.arm, {'face': 'front'}), 'south': (AA.arm, {'face': 'back'}), 'up': dark, 'down': dark})
        # layered pauldron: cap, two overlapping tiers, gold rims, a gem on the outside
        def X(a_, b_): return (min(s * a_, s * b_), max(s * a_, s * b_))
        x = X(9.0, 3.4); PB.box(a, [x[0], -2.5, -3.0], [x[1], -0.5, 3.0], {'up': (AA.plate, {'gem': False, 'scroll': True}), '*': plate})
        x = X(9.7, 4.6); PB.box(a, [x[0], -0.8, -3.25], [x[1], 1.5, 3.25], {outf: plate_s, '*': plate})
        x = X(9.75, 4.55); PB.box(a, [x[0], 1.4, -3.3], [x[1], 1.8, 3.3], {'*': gold})
        x = X(10.2, 5.6); PB.box(a, [x[0], 1.7, -3.4], [x[1], 3.5, 3.4], {outf: plate_g, '*': plate})
        x = X(10.25, 5.55); PB.box(a, [x[0], 3.4, -3.45], [x[1], 3.8, 3.45], {'*': gold})
        x = X(9.2, 3.3); PB.box(a, [x[0], -2.9, -2.4], [x[1], -2.4, 2.4], {'*': gold})
        orn = m.bone('orn_' + n, [s * 7.5, -2.0, 0.5], a)
        pauldron_ornament(m, k, PB, orn, s, st, p, A)
        x = X(8.6, 3.4); PB.box(a, [x[0], 7.0, -2.6], [x[1], 7.5, 2.6], {'*': gold}); PB.box(a, [x[0], 10.6, -2.6], [x[1], 11.1, 2.6], {'*': gold})
        gem3d(m, k, a, [s * 8.65, 8.9, 0], 0.8, p['gem'], setting=p['gold'], rot=(45, 0, 0))
    # ---------------- legs
    for s, n in ((-1, 'r'), (1, 'l')):
        g = m.bone('leg_' + n, [s * 1.9, 12, 0])
        lo, hi = (-4.3, 0.3) if s < 0 else (-0.3, 4.3)
        outf, inf = ('west', 'east') if s < 0 else ('east', 'west')
        PB.box(g, [lo, 11.8, -2.3], [hi, 24.25, 2.3], {'north': (AA.leg, {'face': 'front'}), 'south': (AA.leg, {'face': 'back'}), outf: (AA.leg, {'face': 'out'}), inf: (AA.leg, {'face': 'in'}), 'up': dark, 'down': dark})
        kx = s * 1.9
        PB.box(g, [kx - 1.35, 15.3, -2.8], [kx + 1.35, 17.6, -2.35], {'north': plate_g, '*': gold})
        PB.box(g, [lo - 0.2, 20.7, -2.5], [hi + 0.2, 21.3, 2.5], {'*': gold})
        PB.box(g, [kx - 1.7, 22.1, -3.5], [kx + 1.7, 24.25, -2.3], {'north': (AA.plate, {'col': p['dark'], 'gem': True}), 'up': gold, '*': dark})
        boot_ornament(m, k, PB, g, s, st, p, A, -4.4 if s < 0 else 4.4)
    # particles rising off the shoulders and the core (children of the body bone, so the mod draws them with the torso)
    fx = Particles(m, 'body', 3.0); rnd = random.Random(name)
    sp = k.glow('spark', P.dot(p['gem'], 3, core=(255, 255, 255)))
    for i in range(10):
        s = 1 if i % 2 else -1
        x = s * rnd.uniform(4.5, 9.5) if i < 6 else rnd.uniform(-2, 2)
        y = rnd.uniform(-2.5, 1.0) if i < 6 else rnd.uniform(2, 5)
        z = rnd.uniform(-3.5, 3.5) if i < 6 else -3.6
        fx.add([x, y, z], [rnd.uniform(-0.5, 0.5), -rnd.uniform(4, 7), rnd.uniform(-0.6, 0.6)], 0.45, sp, i / 10, spin=150)
    fit_centre(m, 'body')
    def build(c):
        wv = {'idle': 90, 'walk': 220, 'run': 330, 'jump': 200, 'fly': 260}[c]
        lift = {'idle': 4, 'walk': 10, 'run': 26, 'jump': 18, 'fly': 40}[c]
        tr = {'body_core': {'scale': [(0, '1+math.sin(query.anim_time*200)*0.15', '1+math.sin(query.anim_time*200)*0.15', '1+math.sin(query.anim_time*200)*0.15')],
                            'rotation': [(0, 0, 0, 'query.anim_time*60')]},
              'cape': {'rotation': [(0, f'{lift}+math.sin(query.anim_time*{wv})*{3 + lift * 0.25:.1f}', 0, f'math.sin(query.anim_time*{wv * 0.6:.0f})*3')]}}
        for n in ('r', 'l'): tr['orn_' + n] = {'rotation': [(0, f'math.sin(query.anim_time*140{"+90" if n == "l" else ""})*5', 0, f'math.sin(query.anim_time*110)*4')]}
        return tr
    clips(m, build, 3.0, fx)
    return m

def pauldron_ornament(m, k, PB, bone, s, st, p, A):
    """Shoulder decoration in arm space (Y down: -Y is up)."""
    if st == 'feathered':
        spr = k.sprite('pfeather', lambda: P.feather(10, 40, (255, 255, 255), P.mixc((255, 255, 255), A.get('feather_tip', (200, 210, 245)), 0.9), (255, 255, 255), p['gold'], 'primary', glow_tip=p['gem'], streak=A.get('streak', (40, 40, 80)), seed=11))
        for i, (ang, L) in enumerate(((-12, 8.0), (-30, 10.0), (-48, 9.5), (-66, 8.0), (-84, 6.0))):
            base = [s * 7.6, -1.6, 1.8 - i * 0.4]
            r = rot_to((s * math.sin(math.radians(-ang)), -math.cos(math.radians(ang)), 0.22))
            uv = flipv(spr[0]) if s < 0 else flipv(spr[0]).mirrored()
            m.plate(bone, [base[0] - 1.4, base[1], base[2] - 0.05], [base[0] + 1.4, base[1] + L, base[2] + 0.05], uv, origin=base, rotation=r)
            if spr[1] is not None:
                gv = flipv(spr[1]) if s < 0 else flipv(spr[1]).mirrored()
                m.plate(bone, [base[0] - 1.4, base[1], base[2] - 0.09], [base[0] + 1.4, base[1] + L, base[2] + 0.09], gv, origin=base, rotation=r)
        for i in range(2): spike(m, k, bone, [s * (5.6 + i * 2.2), -2.6, -0.4], (s * 0.3, -1, -0.15), 3.6 - i * 0.8, 0.9, p['gold'])
    elif st in ('spiked', 'horned', 'royal'):
        for i in range(3):
            spike(m, k, bone, [s * (5.2 + i * 1.8), -2.6, 0.6 - i * 0.6], (s * (0.25 + i * 0.25), -1, 0.15), 5.0 - i * 1.0, 1.2, p['dark'] if st != 'royal' else p['gold'], tip=p.get('energy') or p['gem'])
    elif st == 'crystal':
        from heads4 import crystal as c3
        body = k.main('pcb', P.facet(6, 24, P.shade(p['gem'], 1.3), P.shade(p['gem'], 0.75), hi=(255, 255, 255)))
        tip = k.main('pct', P.facet(6, 12, p['gem'], P.shade(p['gem'], 0.6))); gt = k.glow('pcg', P.facet(6, 12, (255, 255, 255), p['gem']))
        for i, (dx, h) in enumerate(((5.6, 5.0), (7.3, 6.8), (9.0, 4.4))):
            c3(m, bone, [s * dx, -2.2, 0.4 - i * 0.5], h, 1.6, body, tip, gt, d=(s * 0.3, -1, 0.1))
    elif st == 'dragon':
        for i in range(3):
            spike(m, k, bone, [s * (5.0 + i * 1.6), -2.6, 1.2 - i * 0.2], (s * 0.5, -1, 0.7), 4.6 - i * 0.8, 1.2, p['dark'], tip=p.get('energy') or p['gem'], segs=4)
    elif st == 'bone':
        for i in range(4):
            spike(m, k, bone, [s * (4.8 + i * 1.3), -2.6, 1.2 - i * 0.2], (s * (0.1 + i * 0.22), -1, 0.4), 3.4 + (i % 2) * 1.8, 0.85, p['accent'])
    elif st == 'leaf':
        spr = k.sprite('pleaf', lambda: P.leaf(10, 26, A.get('leaf', (90, 200, 90)), P.shade(A.get('leaf', (90, 200, 90)), 0.6)))
        for i, ang in enumerate((-10, -32, -54, -76)):
            base = [s * 7.6, -1.6, 1.2 - i * 0.3]; L = 7.0 - i * 0.6
            r = rot_to((s * math.sin(math.radians(-ang)), -math.cos(math.radians(ang)), 0.25))
            m.plate(bone, [base[0] - 1.5, base[1], base[2] - 0.05], [base[0] + 1.5, base[1] + L, base[2] + 0.05], flipv(spr[0]), origin=base, rotation=r)
        for i in range(2): spike(m, k, bone, [s * (5.5 + i * 2), -2.6, 0.4], (s * 0.2, -1, 0.6), 4.2, 0.8, p['gold'], tip=p.get('energy'))
    elif st == 'fin':
        mem, gm, fr = P.membrane([(0, 0), (6, 1), (9, 6), (7, 6.5), (5, 9), (2, 7), (0.5, 9.5)], [((0, 0), (9, 6)), ((0, 0), (5, 9)), ((0, 0), (0.5, 9.5))], 4,
                                 p['plate'], p['gem'], P.shade(p['plate'], 0.6), glow_vein=p['gem'], seed='pfin')
        uf = m.atlas.add(mem); ug = m.glow_atlas().add(gm) if gm is not None else None
        x0, y0, x1, y1 = fr; base = [s * 6.5, -2.0, 0.6]
        for uv, e in ((uf, 0.05), (ug, 0.09)):
            if uv is None: continue
            m.plate(bone, [base[0] + (x0 if s > 0 else -x1), base[1] - y1, base[2] - e], [base[0] + (x1 if s > 0 else -x0), base[1] - y0, base[2] + e], uv if s > 0 else uv.mirrored(), origin=base, rotation=[0, 0, -s * 10])

def boot_ornament(m, k, PB, g, s, st, p, A, ox):
    if st in ('feathered', 'leaf'):
        for i in range(2): spike(m, k, g, [ox + s * 0.2, 21.2, 0.8 - i * 1.0], (s * 0.8, -0.45, 0.6), 3.0 - i * 0.7, 0.7, p['gold'])
    elif st in ('spiked', 'horned', 'royal', 'dragon'):
        spike(m, k, g, [ox + s * 0.1, 21.8, 0.0], (s * 0.9, -0.2, 0.5), 2.8, 0.8, p['dark'], tip=p.get('energy') or p['gem'])
    elif st == 'crystal':
        spike(m, k, g, [ox + s * 0.1, 21.8, 0.2], (s * 0.8, -0.5, 0.2), 2.8, 0.9, p['gem'], tip=p['gem'])

# ===================================================================== HELMET (helmet slot, Y up)
def helm(name, H):
    import sets5 as S5
    m = BB(name, Atlas(512, 256)); k = Kit(m)
    p = dict(dark=H['main'], plate=H['panel'], gold=H['trim'], gem=H['gem'], energy=H.get('energy'), accent=col_of(H.get('accent', H['panel'])), motif=H.get('motif', 'royal'))
    PB = Painted(m, k, p, ydown=False)
    gold = (AA.gold, {}); dark = (AA.darkface, {}); side = (AA.helm_side, {}); plate_g = (AA.plate, {'gem': True})
    m.bone('helm', [0, 4, 0]); h = 'helm'
    PB.box(h, [-4.6, 0.2, 3.9], [4.6, 8.9, 4.6], {'south': side, 'north': dark, '*': gold})
    for s in (-1, 1):
        x0, x1 = (3.9, 4.6) if s > 0 else (-4.6, -3.9)
        PB.box(h, [x0, 0.2, -3.6], [x1, 8.9, 4.6], {'east' if s > 0 else 'west': side, '*': dark})
        cx0, cx1 = (2.7, 4.65) if s > 0 else (-4.65, -2.7)
        PB.box(h, [cx0, 0.2, -4.7], [cx1, 4.6, -3.6], {'north': (AA.plate, {'gem': False}), '*': gold})
        ex0, ex1 = (4.6, 5.05) if s > 0 else (-5.05, -4.6)
        PB.box(h, [ex0, 2.0, -3.4], [ex1, 7.6, 3.4], {'east' if s > 0 else 'west': (AA.plate, {'gem': True, 'scroll': True}), '*': gold})
    PB.box(h, [-4.6, 8.2, -4.6], [4.6, 9.1, 4.6], {'up': (AA.plate, {'gem': False, 'scroll': True}), '*': gold})
    PB.box(h, [-3.6, 9.1, -3.6], [3.6, 9.7, 3.6], {'*': (AA.plate, {'gem': False})})
    PB.box(h, [-4.8, 6.2, -4.85], [4.8, 8.3, -3.6], {'north': (AA.helm_brow, {}), '*': gold})
    PB.box(h, [-0.6, 3.6, -4.95], [0.6, 6.3, -4.4], {'*': gold})
    if H.get('visor') == 'skull':
        PB.box(h, [-3.9, 0.2, -4.65], [3.9, 6.2, -3.9], {'north': (skull_face, {}), '*': (AA.plate, {'col': p['accent'], 'gem': False, 'rim': False})})
    # the crown / horns / crest from v5, now standing on the painted helm
    M = S5.Mats(m, k, {'main': ('paint', AA.darkface, p), 'panel': ('paint', lambda w_, h_, pp: AA.plate(w_, h_, pp, gem=False), p), 'trim': ('paint', AA.gold, p),
                       'dark': (P.shade(H['main'], 0.7), None, 'dark'), 'gem': ('glow', H['gem']), 'energy': ('glow', H.get('energy') or H['gem']),
                       'accent': H.get('accent', (H['panel'], None, 'plate'))})
    m.bone('crown', [0, 9, 0], 'helm')
    S5.crown(m, k, M, 'crown', H)
    fx = Particles(m, 'helm', 3.0); rnd = random.Random(name)
    sp = k.glow('spark', P.dot(p['gem'], 3, core=(255, 255, 255)))
    for i in range(6): fx.add([rnd.uniform(-5, 5), rnd.uniform(9, 12), rnd.uniform(-5, 5)], [0, rnd.uniform(3, 5), 0], 0.4, sp, i / 6, spin=150)
    clips(m, lambda c: {'crown': {'position': [(0, 0, 'math.sin(query.anim_time*90)*0.08', 0)]}}, 3.0, fx, names=('idle',))
    return m

def skull_face(w, h, p):
    import numpy as np
    c = Canvas(w, h); c.fill(c.m_rect(0, 0, w, h), p['accent'], grad=0.3, bevel=True)
    for s in (-1, 1):
        mm = c.m_circle(w / 2 + s * w * 0.22, h * 0.42, min(w, h) * 0.17); c.rgb[mm] = (15, 10, 20); c.glow_mask(c.m_circle(w / 2 + s * w * 0.22, h * 0.42, min(w, h) * 0.08), p.get('energy') or p['gem'])
    c.fill(c.m_poly([(w / 2 - 1, h * 0.62), (w / 2 + 1, h * 0.62), (w / 2, h * 0.52)]), (20, 15, 25))
    for i in range(6): c.fill(c.m_rect(w * 0.22 + i * w * 0.1, h * 0.78, w * 0.22 + i * w * 0.1 + 1, h * 0.95), (20, 15, 25))
    c.a[:] = True; return c.images()

# ===================================================================== WEAPON (painted)
def weapon(name, Wd):
    """v5 geometry (grip anchor + orientation as the mod expects) with painted blade, wrapped grip and engraved gold."""
    import sets5 as S5
    p = dict(blade=Wd['blade'], edge=Wd['edge'], grip=Wd['grip'], gold=Wd['guard'], gem=Wd['gem'], dark=Wd['grip'], plate=Wd['blade'], motif='royal')
    pd = dict(p, edge=None)
    return S5.weapon(name, Wd, painted={'blade': ('paint', AA.blade_face, pd), 'grip': ('paint', AA.grip_face, p), 'guard': ('paint', AA.gold, p),
                                        'dark': ('paint', AA.grip_face, dict(p, grip=P.shade(Wd['grip'], 0.7)))})
