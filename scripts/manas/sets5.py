# OVERTHRONE premium armour & wing SETS (Manas Cosmetics). Each set = wings (back), helmet (helmet), armour (armor_set),
# weapon skin (weapon, sword type), ground sigil (ground); the set's aura + weapon aura are written by build-manas-auras.py.
#
# Frames (from the mod's code, see sim.py):
#   armor_set : player model space, Y DOWN, -Z = front, neck at the origin: head y -8..0, body x -4..4 y 0..12 z -2..2,
#               right arm x -8..-4 (bone pivot -5,2,0), left arm x 4..8, right leg x -4..0 (pivot -1.9,12,0), legs y 12..24.
#               The mod binds each top-level bone to the limb its name says (body / arm_r / arm_l / leg_r / leg_l), so
#               pauldrons and vambraces swing with the arms and greaves walk with the legs. No flip (needs_y_flip false);
#               it lifts the model by 12 - centre of the cube box, so a faceless cube keeps that centre at exactly 12.
#   helmet    : Y up, head x/z -4..4 y 0..8, -Z = the face.
#   weapon    : the grip at the origin, the blade along +Y (points forward from the hand), edges along Z, flat along X.
#   ground    : a flat decal (up face) at the feet; it turns with the bone animation.
import math, random
from bb import BB, Atlas, UV
import paint as P
from fx import Kit, Particles, clips, hang, seg, lerp3, mir
import wings4 as W4
from heads4 import rot_to, crystal as crystal3d

D = 3

def flipv(uv): return UV((uv[0], uv[3], uv[2], uv[1]), getattr(uv, 'tex', 0))

class Mats:
    """Named materials -> face-sized textures. mats[name] = (base, rim, style) for lit metal/cloth/etc, or ('glow', colour)."""
    def __init__(self, m, k, mats, ydown=False):
        self.m, self.k, self.mats, self.ydown = m, k, mats, ydown
    def uv(self, name, w, h):
        spec = self.mats[name]
        if isinstance(spec[0], str) and spec[0] == 'paint':      # ('paint', painter(w, h, pal) -> (main, glow), pal)
            px = max(2, min(48, int(round(w * 4)))); py = max(2, min(48, int(round(h * 4))))
            return self.k.main(('p', name, px, py), spec[1](px, py, spec[2])[0])
        if isinstance(spec[0], str) and spec[0] == 'glow':
            return self.k.glow('g_' + name, P.facet(4, 4, P.mixc(spec[1], (255, 255, 255), 0.35), spec[1]))
        base, rim, style = spec
        px = max(2, min(40, int(round(w * D)))); py = max(2, min(40, int(round(h * D))))
        return self.k.main(('m', name, px, py), P.panel(px, py, base, rim, style))
    def box(self, bone, f, t, name, origin=None, rotation=None, top=None):
        dx, dy, dz = [abs(t[i] - f[i]) for i in range(3)]
        side = lambda w, h: (flipv(self.uv(name, w, h)) if self.ydown else self.uv(name, w, h))
        faces = {'north': side(dx, dy), 'south': side(dx, dy), 'east': side(dz, dy), 'west': side(dz, dy),
                 'up': self.uv(top or name, dx, dz), 'down': self.uv(top or name, dx, dz)}
        return self.m.cube(bone, f, t, {k: {'uv': [round(v, 4) for v in uv], 'texture': uv.tex} for k, uv in faces.items()}, origin, rotation)
    def spike(self, bone, base, d, L, w, name, tip=None, segs=3):
        """A tapering spike from base along direction d (any frame)."""
        r = rot_to(d)
        for i in range(segs):
            f0, f1 = i / segs, (i + 1) / segs; ww = w * (1 - 0.72 * f0)
            self.box(bone, [base[0] - ww / 2, base[1] + L * f0, base[2] - ww / 2], [base[0] + ww / 2, base[1] + L * f1, base[2] + ww / 2],
                     tip if (tip and i == segs - 1) else name, origin=list(base), rotation=r)
    def gem(self, bone, c, size, glow_name, setting=None, rot=None):
        h = size / 2
        if setting:
            self.box(bone, [c[0] - h * 1.45, c[1] - h * 1.45, c[2] - h * 0.6], [c[0] + h * 1.45, c[1] + h * 1.45, c[2] + h * 0.6], setting, origin=list(c), rotation=rot or [0, 0, 45])
        self.box(bone, [c[0] - h, c[1] - h, c[2] - h], [c[0] + h, c[1] + h, c[2] + h], glow_name, origin=list(c), rotation=rot or [0, 0, 45])

def fit_centre(m, bone, target=12.0):
    """armor_set: the mod lifts by 12 - centre of the raw cube box; add a faceless cube so the centre is exactly 12."""
    ys = [v for e in m.elements for v in (e['from'][1], e['to'][1])]
    lo, hi = min(ys), max(ys)
    if (lo + hi) / 2 > target: y = 2 * target - hi
    else: y = 2 * target - lo
    m.cube(bone, [-0.01, y, -0.01], [0.01, y, 0.01], {})

# ===================================================================== ARMOUR (armor_set)
def armor(name, A):
    """A: main, panel, trim, gem (colours), energy (glow colour or None), cloth, pauldron (style), accents."""
    m = BB(name, Atlas(512, 256)); k = Kit(m)
    mats = {'main': (A['main'], A.get('main_rim'), A.get('main_style', 'plate')), 'panel': (A['panel'], A['trim'], 'plate'),
            'trim': (A['trim'], None, 'trim'), 'dark': (P.shade(A['main'], 0.7), None, 'dark'), 'cloth': (A.get('cloth', A['main']), A['trim'], 'cloth'),
            'gem': ('glow', A['gem']), 'energy': ('glow', A.get('energy') or A['gem'])}
    if A.get('accent'): mats['accent'] = A['accent']
    M = Mats(m, k, mats, ydown=True)
    pst = A.get('pauldron', 'round')
    # ---------------- body
    m.bone('body', [0, 0, 0])
    b = 'body'
    for zf, zb in ((-2.95, -2.2), (2.2, 2.95)):                                   # collar
        M.box(b, [-3.6, -1.2, zf], [3.6, 0.6, zb], 'main')
    for s in (-1, 1): M.box(b, [s * 3.6 if s > 0 else -4.3, -1.2, -2.95], [4.3 if s > 0 else -3.6, 0.6, 2.95], 'main')
    M.box(b, [-3.7, -1.5, -3.05], [3.7, -1.1, -2.65], 'trim'); M.box(b, [-3.7, -1.5, 2.65], [3.7, -1.1, 3.05], 'trim')
    M.box(b, [-4.4, 0.4, -2.95], [4.4, 7.4, -2.2], 'main')                       # breastplate
    M.box(b, [-3.1, 0.9, -3.35], [3.1, 6.6, -2.95], 'panel')                      # raised panel
    M.box(b, [-1.9, 1.6, -3.6], [1.9, 5.6, -3.35], 'trim')                        # gem frame
    for s in (-1, 1):   # V trims from the shoulders to the core
        x0 = s * 3.6
        M.box(b, [x0 - 0.22, 0.5, -3.5], [x0 + 0.22, 4.6, -3.3], 'trim', origin=[x0, 0.5, -3.4], rotation=[0, 0, -s * 30])
    M.box(b, [-4.3, 7.4, -2.85], [4.3, 8.8, -2.2], 'main'); M.box(b, [-4.1, 8.8, -2.75], [4.1, 10.0, -2.2], 'main')      # abdomen bands
    M.box(b, [-4.35, 8.65, -2.95], [4.35, 8.95, -2.75], 'trim')
    M.box(b, [-4.5, 10.0, -3.0], [4.5, 11.6, -2.2], 'trim'); M.box(b, [-4.5, 10.0, 2.2], [4.5, 11.6, 3.0], 'trim')          # belt
    for s in (-1, 1): M.box(b, [s * 4.5 if s < 0 else 4.1, 10.0, -3.0], [-4.1 if s < 0 else 4.5, 11.6, 3.0], 'trim')
    M.box(b, [-1.3, 9.7, -3.45], [1.3, 11.9, -3.0], 'panel'); M.gem(b, [0, 10.8, -3.55], 0.9, 'gem')
    M.box(b, [-4.4, 0.4, 2.2], [4.4, 10.0, 2.95], 'main')                         # back plate, raised panel, spine ridge
    M.box(b, [-3.2, 1.0, 2.95], [3.2, 8.6, 3.3], 'panel')
    M.box(b, [-0.6, 0.6, 3.3], [0.6, 9.6, 3.7], 'trim')
    for s in (-1, 1):
        x0 = s * 3.0
        M.box(b, [x0 - 0.22, 1.0, 3.3], [x0 + 0.22, 6.2, 3.5], 'trim', origin=[x0, 1.0, 3.4], rotation=[0, 0, -s * 28])
        M.gem(b, [s * 1.9, 2.2, 3.55], 0.55, 'gem')
    for s in (-1, 1): M.box(b, [4.2 if s > 0 else -4.65, 0.5, -2.2], [4.65 if s > 0 else -4.2, 10.0, 2.2], 'main')     # sides
    if A.get('tabard', True):
        M.box(b, [-2.3, 11.6, -2.95], [2.3, 16.4, -2.65], 'cloth'); M.box(b, [-2.3, 16.0, -3.0], [2.3, 16.6, -2.6], 'trim')
        M.box(b, [-2.3, 11.6, 2.65], [2.3, 15.4, 2.95], 'cloth'); M.box(b, [-2.3, 15.0, 2.6], [2.3, 15.6, 3.0], 'trim')
    # chest core: its own bone so it can pulse
    m.bone('body_core', [0, 3.6, -3.9], 'body')
    M.gem('body_core', [0, 3.6, -3.95], 1.6, 'gem', setting='trim')
    for s in (-1, 1): M.gem(b, [s * 2.3, 1.7, -3.5], 0.6, 'gem')
    if A.get('energy'):   # glowing energy channels down the abdomen
        for s in (-1, 1): M.box(b, [s * 1.6 - 0.15, 7.6, -2.95], [s * 1.6 + 0.15, 9.9, -2.82], 'energy')
        M.box(b, [-0.15, 5.6, -3.42], [0.15, 9.9, -2.82], 'energy')
    # ---------------- arms
    for s, n in ((-1, 'r'), (1, 'l')):
        a = m.bone('arm_' + n, [s * 5, 2, 0])
        X0, X1 = (s * 8.3, s * 3.7) if s < 0 else (3.7, 8.3)
        lo, hi = min(X0, X1), max(X0, X1)
        out = s * 8.3     # outer surface x
        # pauldron: three layered plates + cap + trim + gem
        M.box(a, [min(s * 9.4, s * 3.4), -1.6, -3.0], [max(s * 9.4, s * 3.4), 2.3, 3.0], 'main')
        M.box(a, [min(s * 9.9, s * 5.0), 1.6, -3.2], [max(s * 9.9, s * 5.0), 3.7, 3.2], 'panel')
        M.box(a, [min(s * 10.1, s * 5.6), 3.4, -3.3], [max(s * 10.1, s * 5.6), 3.9, 3.3], 'trim')
        M.box(a, [min(s * 8.7, s * 4.2), -2.4, -2.5], [max(s * 8.7, s * 4.2), -1.5, 2.5], 'panel')
        M.box(a, [min(s * 9.5, s * 9.3), -1.4, -3.05], [max(s * 9.5, s * 9.3), 2.2, 3.05], 'trim')
        M.gem(a, [s * 9.75, 0.3, 0], 0.9, 'gem', setting='trim', rot=[45, 0, 0])
        pauldron_ornament(m, k, M, a, s, pst, A)
        M.box(a, [lo, 2.2, -2.35], [hi, 7.6, 2.35], 'main')                       # rerebrace (full wrap, no gaps)
        M.box(a, [lo - 0.1, 5.2, -2.45], [hi + 0.1, 5.6, 2.45], 'trim')
        M.box(a, [min(s * 8.5, s * 6.3), 5.8, -1.6], [max(s * 8.5, s * 6.3), 7.6, 1.6], 'panel')   # elbow cop
        M.box(a, [lo - 0.05, 7.4, -2.4], [hi + 0.05, 11.2, 2.4], 'main')          # vambrace
        M.box(a, [lo - 0.15, 7.3, -2.5], [hi + 0.15, 7.8, 2.5], 'trim'); M.box(a, [lo - 0.15, 10.8, -2.5], [hi + 0.15, 11.3, 2.5], 'trim')
        M.gem(a, [s * 8.55, 9.1, 0], 0.7, 'gem', rot=[45, 0, 0])
        if A.get('energy'): M.box(a, [min(out, out + s * 0.12), 8.0, -1.4], [max(out, out + s * 0.12), 10.2, -1.1], 'energy')
        M.box(a, [lo, 11.2, -2.35], [hi, 12.4, 2.35], 'dark')                     # gauntlet
        M.box(a, [lo + 0.3, 11.3, -2.65], [hi - 0.3, 12.2, -2.35], 'trim')
    # ---------------- legs
    for s, n in ((-1, 'r'), (1, 'l')):
        g = m.bone('leg_' + n, [s * 1.9, 12, 0])
        lo, hi = (-4.4, 0.4) if s < 0 else (-0.4, 4.4)
        ox = -4.45 if s < 0 else 4.45
        M.box(g, [lo, 11.8, -2.65], [hi, 15.6, -2.15], 'main')                    # tasset (front) + outer side
        M.box(g, [min(ox, ox + s * 0.4), 11.8, -2.2], [max(ox, ox + s * 0.4), 15.6, 2.2], 'main')
        M.box(g, [lo, 15.3, -2.75], [hi, 15.8, -2.1], 'trim')
        M.box(g, [lo + 0.1, 15.6, -2.35], [hi - 0.1, 17.0, 2.35], 'dark')
        kx = s * 1.9
        M.box(g, [kx - 1.3, 16.3, -2.95], [kx + 1.3, 18.5, -2.3], 'panel')        # knee cop
        M.gem(g, [kx, 17.4, -3.05], 0.6, 'gem')
        M.box(g, [lo, 18.4, -2.4], [hi, 21.6, 2.4], 'main')                       # greave + shin ridge
        M.box(g, [kx - 0.5, 18.6, -2.75], [kx + 0.5, 21.4, -2.4], 'trim')
        M.box(g, [lo - 0.1, 21.3, -2.55], [hi + 0.1, 21.9, 2.55], 'trim')         # boot cuff
        M.box(g, [lo - 0.05, 21.9, -2.5], [hi + 0.05, 24.0, 2.5], 'dark')         # boot
        M.box(g, [kx - 1.6, 22.6, -3.65], [kx + 1.6, 24.0, -2.5], 'trim')         # toe cap
        M.box(g, [lo - 0.15, 23.6, -3.75], [hi + 0.15, 24.2, 2.65], 'dark')       # sole
        boot_ornament(m, k, M, g, s, pst, A, ox)
    fit_centre(m, 'body')
    def build(c):
        return {'body_core': {'scale': [(0, '1+math.sin(query.anim_time*180)*0.12', '1+math.sin(query.anim_time*180)*0.12', '1+math.sin(query.anim_time*180)*0.12')],
                              'rotation': [(0, 0, 0, 'query.anim_time*45')]}}
    clips(m, build, 4.0, None, names=('idle',))
    return m

def pauldron_ornament(m, k, M, a, s, st, A):
    """Shoulder decoration per set style (Y-down arm space: -Y is up)."""
    if st == 'feathered':      # white feathers fanning up/out from the shoulder, gold-tipped (the reference look)
        spr = k.sprite('pfeather', lambda: P.feather(10, 36, A.get('feather', (250, 250, 255)), P.mixc(A.get('feather', (250, 250, 255)), A['gem'], 0.5), (255, 255, 255), A['trim'], 'primary', glow_tip=A['gem'], seed=11))
        for i, (ang, L) in enumerate(((-15, 7.5), (-35, 9.0), (-55, 8.0), (-75, 6.0))):
            base = [s * 8.0, -1.4, 1.6 - i * 0.35]
            d = (s * math.sin(math.radians(-ang)), -math.cos(math.radians(ang)), 0.25)
            r = rot_to(d)
            m.plate(a, [base[0] - 1.3, base[1], base[2] - 0.05], [base[0] + 1.3, base[1] + L, base[2] + 0.05], flipv(spr[0]) if s < 0 else flipv(spr[0]).mirrored(), origin=base, rotation=r)
            if spr[1] is not None: m.plate(a, [base[0] - 1.3, base[1], base[2] - 0.09], [base[0] + 1.3, base[1] + L, base[2] + 0.09], flipv(spr[1]) if s < 0 else flipv(spr[1]).mirrored(), origin=base, rotation=r)
        for i in range(2): M.spike(a, [s * (6.0 + i * 2.0), -2.2, -0.2], (s * 0.35, -1, -0.1), 3.4 - i * 0.8, 0.9, 'trim')
    elif st in ('spiked', 'horned'):
        for i in range(3):
            M.spike(a, [s * (5.4 + i * 1.7), -2.2, 0.6 - i * 0.6], (s * (0.25 + i * 0.25), -1, 0.15), 4.6 - i * 0.9, 1.2, 'main', tip='energy' if A.get('energy') else 'trim')
    elif st == 'crystal':
        body = k.main('pcb', P.facet(6, 24, P.shade(A['gem'], 1.3), P.shade(A['gem'], 0.75), hi=(255, 255, 255)))
        tip = k.main('pct', P.facet(6, 12, A['gem'], P.shade(A['gem'], 0.6))); gt = k.glow('pcg', P.facet(6, 12, (255, 255, 255), A['gem']))
        for i, (dx, h) in enumerate(((5.6, 4.8), (7.2, 6.4), (8.8, 4.2))):
            crystal3d(m, a, [s * dx, -1.8, 0.4 - i * 0.5], h, 1.5, body, tip, gt, d=(s * 0.3, -1, 0.1))
    elif st == 'dragon':      # overlapping scales down the pauldron + a horn
        for row in range(3):
            for col in range(3):
                x = s * (5.0 + col * 1.6); y = -1.8 + row * 1.5
                M.box(a, [x - 0.9, y, -3.25 - row * 0.05], [x + 0.9, y + 1.6, -2.95], 'panel', origin=[x, y, -3.1], rotation=[0, 0, 45])
        M.spike(a, [s * 8.0, -2.0, 0.8], (s * 0.6, -1, 0.5), 5.0, 1.3, 'main', tip='energy')
    elif st == 'bone':
        for i in range(4):
            M.spike(a, [s * (4.8 + i * 1.3), -2.0, 1.2 - i * 0.2], (s * (0.1 + i * 0.22), -1, 0.4), 3.2 + (i % 2) * 1.6, 0.8, 'accent' if 'accent' in M.mats else 'panel')
        M.box(a, [min(s * 9.0, s * 6.2), -3.2, -1.6], [max(s * 9.0, s * 6.2), -1.6, 1.6], 'accent' if 'accent' in M.mats else 'panel')     # skull cap
        M.gem(a, [s * 7.6, -2.4, -1.75], 0.45, 'gem'); M.gem(a, [s * 7.6, -2.4, -1.75], 0.45, 'gem')
    elif st == 'leaf':
        spr = k.sprite('pleaf', lambda: P.leaf(10, 26, A.get('leaf', (90, 200, 90)), P.shade(A.get('leaf', (90, 200, 90)), 0.6)))
        for i, ang in enumerate((-10, -32, -54, -76)):
            base = [s * 7.6, -1.4, 1.2 - i * 0.3]; L = 6.5 - i * 0.6
            r = rot_to((s * math.sin(math.radians(-ang)), -math.cos(math.radians(ang)), 0.25))
            m.plate(a, [base[0] - 1.4, base[1], base[2] - 0.05], [base[0] + 1.4, base[1] + L, base[2] + 0.05], flipv(spr[0]), origin=base, rotation=r)
        for i in range(2): M.spike(a, [s * (5.5 + i * 2), -2.2, 0.4], (s * 0.2, -1, 0.6), 4.0, 0.8, 'trim')     # golden antler-like tines
    elif st == 'fin':
        spr = k.sprite('pfin', lambda: P.membrane([(0, 0), (6, 1), (9, 6), (7, 6.5), (5, 9), (2, 7), (0.5, 9.5)], [((0, 0), (9, 6)), ((0, 0), (5, 9)), ((0, 0), (0.5, 9.5))], 3,
                                                   A['panel'], A['gem'], P.shade(A['panel'], 0.6), glow_vein=A['gem'], seed=name_seed(A))[:2])
        base = [s * 7.0, -1.6, 0.5]
        m.plate(a, [base[0] - 4.5, base[1] - 9.5, base[2] - 0.05], [base[0] + 4.5, base[1], base[2] + 0.05], spr[0] if s > 0 else spr[0].mirrored(), origin=base, rotation=[0, 0, -s * 25])
    elif st == 'royal':
        for i in range(3):
            M.spike(a, [s * (5.0 + i * 1.8), -2.2, 0.6 - i * 0.5], (s * (0.2 + i * 0.3), -1, 0.2), 5.6 - i * 1.4, 1.3, 'main', tip='energy')
        M.box(a, [min(s * 10.4, s * 9.6), -1.8, -2.6], [max(s * 10.4, s * 9.6), 3.0, 2.6], 'trim')
        M.gem(a, [s * 10.6, 0.6, 0], 1.0, 'gem', rot=[45, 0, 0])

def name_seed(A): return str(sorted(A.items()))[:40]

def boot_ornament(m, k, M, g, s, st, A, ox):
    if st in ('feathered', 'leaf'):
        for i in range(2):   # little wings on the boot sides
            base = [ox + s * 0.3, 21.8, 0.6 - i * 1.0]
            M.spike(g, base, (s * 0.8, -0.4, 0.6), 3.0 - i * 0.7, 0.7, 'trim')
    elif st in ('spiked', 'horned', 'royal', 'dragon'):
        M.spike(g, [ox + s * 0.2, 22.4, 0.0], (s * 0.9, -0.2, 0.5), 2.6, 0.8, 'main', tip='trim')
    elif st == 'crystal':
        M.spike(g, [ox + s * 0.2, 22.4, 0.2], (s * 0.8, -0.5, 0.2), 2.6, 0.9, 'gem')

# ===================================================================== HELMET (helmet slot, Y up)
def helm(name, H):
    """H: main, panel, trim, gem, crown (style), visor ('open' | 'skull'), feather/leaf/energy colours."""
    m = BB(name, Atlas(512, 256)); k = Kit(m)
    mats = {'main': (H['main'], None, 'plate'), 'panel': (H['panel'], H['trim'], 'plate'), 'trim': (H['trim'], None, 'trim'),
            'dark': (P.shade(H['main'], 0.7), None, 'dark'), 'gem': ('glow', H['gem']), 'energy': ('glow', H.get('energy') or H['gem'])}
    if H.get('accent'): mats['accent'] = H['accent']
    M = Mats(m, k, mats)
    m.bone('helm', [0, 4, 0]); h = 'helm'
    M.box(h, [-4.6, 0.2, 3.9], [4.6, 8.9, 4.6], 'main')                                  # back
    for s in (-1, 1):
        M.box(h, [s * 3.9 if s > 0 else -4.6, 0.2, -3.6], [4.6 if s > 0 else -3.9, 8.9, 4.6], 'main')       # sides
        M.box(h, [s * 2.7 if s > 0 else -4.65, 0.2, -4.7], [4.65 if s > 0 else -2.7, 4.6, -3.6], 'panel')   # cheek guards
        M.box(h, [s * 4.6 if s > 0 else -4.95, 2.0, -3.4], [4.95 if s > 0 else -4.6, 7.6, 3.4], 'panel')    # ear plates
    M.box(h, [-4.6, 8.2, -4.6], [4.6, 9.1, 4.6], 'main')                                  # top
    M.box(h, [-3.6, 9.1, -3.6], [3.6, 9.7, 3.6], 'panel')
    M.box(h, [-4.75, 6.3, -4.8], [4.75, 8.3, -3.6], 'trim')                               # brow band
    M.box(h, [-0.6, 3.6, -4.95], [0.6, 6.4, -4.4], 'trim')                                # nose guard
    M.gem(h, [0, 7.3, -4.95], 1.0, 'gem', setting='panel')
    if H.get('visor') == 'skull':   # skull face plate with glowing eye sockets (covers the face)
        M.box(h, [-3.9, 0.2, -4.65], [3.9, 6.3, -3.9], 'accent' if 'accent' in mats else 'panel')
        for s in (-1, 1): M.box(h, [s * 1.6 - 1.0, 3.2, -4.75], [s * 1.6 + 1.0, 4.8, -4.6], 'energy')
        M.box(h, [-0.5, 2.0, -4.75], [0.5, 2.9, -4.6], 'dark')
        for i in range(5): M.box(h, [-2.0 + i * 0.85, 0.3, -4.75], [-1.6 + i * 0.85, 1.4, -4.6], 'dark')
    crown(m, k, M, h, H)
    clips(m, lambda c: {'helm': {'position': [(0, 0, 0, 0)]}}, 4.0, None, names=('idle',))
    return m

def crown(m, k, M, h, H):
    st = H['crown']
    if st == 'royal':             # gold crown points + white side wings (reference)
        for i, x in enumerate((-3.4, -1.7, 0, 1.7, 3.4)):
            hh = 3.6 if i == 2 else (2.6 if i in (1, 3) else 2.0)
            M.spike(h, [x, 9.0, -4.0], (0, 1, -0.15), hh, 1.1, 'trim')
            if i % 2 == 0: M.gem(h, [x, 8.1, -4.9], 0.45, 'gem')
        spr = k.sprite('hwing', lambda: P.feather(10, 34, H.get('feather', (250, 250, 255)), P.mixc(H.get('feather', (250, 250, 255)), H['gem'], 0.45), (255, 255, 255), H['trim'], 'primary', glow_tip=H['gem'], seed=21))
        for s in (-1, 1):
            for i, (ang, L) in enumerate(((20, 8.0), (38, 9.5), (56, 7.5))):
                base = [s * 4.8, 5.5 + i * 0.4, 1.0 + i * 0.8]
                r = rot_to((s * math.sin(math.radians(ang)), math.cos(math.radians(ang)), 0.45))
                uv = spr[0] if s > 0 else spr[0].mirrored()
                m.plate(h, [base[0] - 1.2, base[1], base[2] - 0.05], [base[0] + 1.2, base[1] + L, base[2] + 0.05], flipv(uv), origin=base, rotation=r)
                if spr[1] is not None: m.plate(h, [base[0] - 1.2, base[1], base[2] - 0.09], [base[0] + 1.2, base[1] + L, base[2] + 0.09], flipv(spr[1] if s > 0 else spr[1].mirrored()), origin=base, rotation=r)
    elif st == 'horned':          # black crown spikes + big curved horns
        for i, x in enumerate((-3.6, -1.8, 0, 1.8, 3.6)):
            M.spike(h, [x, 9.0, -3.8 + abs(x) * 0.2], (x * 0.06, 1, -0.1), 3.0 + (2.2 if i == 2 else 0) - abs(x) * 0.25, 1.0, 'main', tip='energy')
        for s in (-1, 1):
            pts = [(s * 4.6, 7.0, 0.5), (s * 7.2, 9.0, 1.5), (s * 8.4, 12.5, 2.5), (s * 7.6, 15.5, 1.5)]
            ws = [1.9, 1.5, 1.0, 0.5]
            for i in range(3):
                a_, b_ = pts[i], pts[i + 1]; d = [b_[j] - a_[j] for j in range(3)]; L = math.sqrt(sum(v * v for v in d)) * 1.1
                M.box(h, [a_[0] - ws[i] / 2, a_[1], a_[2] - ws[i] / 2], [a_[0] + ws[i] / 2, a_[1] + L, a_[2] + ws[i] / 2], 'energy' if i == 2 else 'main', origin=list(a_), rotation=rot_to(d))
    elif st == 'solar':           # half sun of gold rays behind the head
        for i in range(11):
            ang = -75 + i * 15; L = 5.5 if i % 2 == 0 else 3.6
            M.spike(h, [math.sin(math.radians(ang)) * 3.2, 6.0 + math.cos(math.radians(ang)) * 3.2, 4.4], (math.sin(math.radians(ang)), math.cos(math.radians(ang)), 0.15), L, 1.0, 'trim', tip='energy')
        M.gem(h, [0, 10.4, -4.2], 1.6, 'energy', setting='trim')
        M.spike(h, [0, 11.0, -4.2], (0, 1, 0), 3.0, 1.0, 'trim', tip='energy')
    elif st == 'frost':           # frozen diadem: crystals of different heights
        body = k.main('hcb', P.facet(6, 24, P.shade(H['gem'], 1.3), P.shade(H['gem'], 0.75), hi=(255, 255, 255)))
        tip = k.main('hct', P.facet(6, 12, H['gem'], P.shade(H['gem'], 0.6))); gt = k.glow('hcg', P.facet(6, 12, (255, 255, 255), H['gem']))
        for i, (x, hh) in enumerate(((-3.6, 3.0), (-2.2, 4.6), (-0.9, 3.4), (0, 6.4), (0.9, 3.4), (2.2, 4.6), (3.6, 3.0))):
            crystal3d(m, h, [x, 8.6, -4.2 + abs(x) * 0.1], hh, 1.2, body, tip, gt, d=(x * 0.05, 1, -0.12))
        for s in (-1, 1): crystal3d(m, h, [s * 4.6, 6.0, 2.0], 4.0, 1.1, body, tip, gt, d=(s * 0.8, 0.6, 0.3))
    elif st == 'dragon':          # dragon helm: snout ridge, swept-back horns, cyan eye gems
        M.box(h, [-1.2, 8.3, -4.9], [1.2, 9.8, 1.0], 'panel')
        for i in range(4): M.spike(h, [0, 9.6, -3.6 + i * 2.0], (0, 1, 0.5), 2.2 - i * 0.3, 0.9, 'main', tip='energy')
        for s in (-1, 1):
            M.spike(h, [s * 3.2, 8.4, -1.0], (s * 0.35, 0.55, 1), 8.5, 1.5, 'main', tip='energy', segs=4)
            M.spike(h, [s * 4.6, 5.0, 0.5], (s * 0.6, 0.15, 1), 4.0, 0.9, 'main', tip='trim')
            M.gem(h, [s * 2.4, 7.3, -4.95], 0.55, 'energy')
    elif st == 'demon':
        for s in (-1, 1):
            pts = [(s * 4.4, 7.5, -1.0), (s * 7.5, 9.5, -1.5), (s * 9.0, 13.0, -0.5), (s * 8.0, 16.5, -2.5)]
            ws = [2.2, 1.7, 1.1, 0.5]
            for i in range(3):
                a_, b_ = pts[i], pts[i + 1]; d = [b_[j] - a_[j] for j in range(3)]; L = math.sqrt(sum(v * v for v in d)) * 1.1
                M.box(h, [a_[0] - ws[i] / 2, a_[1], a_[2] - ws[i] / 2], [a_[0] + ws[i] / 2, a_[1] + L, a_[2] + ws[i] / 2], 'energy' if i == 2 else 'main', origin=list(a_), rotation=rot_to(d))
        for i, x in enumerate((-2.6, -1.3, 0, 1.3, 2.6)):
            M.spike(h, [x, 9.0, -4.0], (x * 0.12, 1, -0.2), 2.0 + (1.6 if i == 2 else 0), 0.8, 'trim', tip='energy')
    elif st == 'fin':             # sea crown: a fan of fin rays on top + side fins
        mem, gm, fr = P.membrane([(0, 0), (-7, 4), (-6.5, 7), (-4, 9.5), (0, 11), (4, 9.5), (6.5, 7), (7, 4)], [((0, 0), (-6.5, 7)), ((0, 0), (-4, 9.5)), ((0, 0), (0, 11)), ((0, 0), (4, 9.5)), ((0, 0), (6.5, 7))],
                                 4, H['panel'], H['gem'], P.shade(H['panel'], 0.6), glow_vein=H['gem'], seed='hfin')
        uf = m.atlas.add(mem); ug = m.glow_atlas().add(gm) if gm is not None else None
        x0, y0, x1, y1 = fr
        m.bone('fin', [0, 9.0, 0.5], 'helm')
        m.plate('fin', [x0, 9 + y0, 0.45], [x1, 9 + y1, 0.55], uf, origin=[0, 9, 0.5], rotation=[0, 90, 0])
        if ug is not None: m.plate('fin', [x0, 9 + y0, 0.41], [x1, 9 + y1, 0.59], ug, origin=[0, 9, 0.5], rotation=[0, 90, 0])
        for s in (-1, 1):
            M.spike(h, [s * 4.7, 4.5, 0.5], (s * 0.8, 0.5, 0.6), 4.5, 1.0, 'panel', tip='energy')
            M.spike(h, [s * 4.7, 6.5, 1.0], (s * 0.7, 0.7, 0.7), 5.0, 1.0, 'panel', tip='energy')
    elif st == 'antlers':
        for s in (-1, 1):
            base = [s * 3.4, 8.8, 0.5]
            M.spike(h, base, (s * 0.5, 1, 0.4), 7.5, 1.2, 'trim', segs=4)
            for j, (f, d) in enumerate(((0.35, (s * 1, 0.6, -0.3)), (0.6, (s * 0.4, 1, -0.6)), (0.8, (s * 1, 0.7, 0.4)))):
                p = [base[0] + s * 0.5 * 7.5 * f / 1.18, base[1] + 7.5 * f / 1.18, base[2] + 0.4 * 7.5 * f / 1.18]
                M.spike(h, p, d, 3.0 - j * 0.6, 0.7, 'trim', tip='energy')
        spr = k.sprite('hleaf', lambda: P.leaf(10, 20, H.get('leaf', (90, 200, 90)), P.shade(H.get('leaf', (90, 200, 90)), 0.6)))
        for i in range(7):
            ang = -60 + i * 20; base = [math.sin(math.radians(ang)) * 4.7, 8.4, -math.cos(math.radians(ang)) * 4.7 * 0.95]
            m.plate(h, [base[0] - 1.0, base[1], base[2] - 0.05], [base[0] + 1.0, base[1] + 4.0, base[2] + 0.05], flipv(spr[0]), origin=base, rotation=[-15, -ang, 0])
    elif st == 'skull':
        for i, x in enumerate((-3.4, -1.7, 0, 1.7, 3.4)):
            M.spike(h, [x, 9.0, -3.2], (x * 0.05, 1, 0.3), 2.0 + (1.8 if i == 2 else 0.6 * (i % 2)), 0.9, 'accent' if 'accent' in M.mats else 'panel')
        M.gem(h, [0, 10.6, -3.8], 1.0, 'energy')
    elif st == 'imperial':        # Thronebreaker: tall royal crown + horns + a crimson crest crystal
        for i, x in enumerate((-3.8, -2.5, -1.25, 0, 1.25, 2.5, 3.8)):
            hh = [2.4, 3.4, 4.6, 6.4, 4.6, 3.4, 2.4][i]
            M.spike(h, [x, 9.0, -4.1], (x * 0.04, 1, -0.12), hh, 1.0, 'trim', tip='energy' if i == 3 else None)
            if i % 2 == 1: M.gem(h, [x, 8.2, -5.0], 0.5, 'gem')
        M.box(h, [-4.7, 9.0, -4.7], [4.7, 9.9, -3.9], 'trim')
        for s in (-1, 1):
            pts = [(s * 4.4, 7.0, 0.5), (s * 7.0, 8.8, 2.0), (s * 8.2, 12.2, 3.6), (s * 7.2, 15.6, 2.6)]
            ws = [1.9, 1.5, 1.0, 0.5]
            for i in range(3):
                a_, b_ = pts[i], pts[i + 1]; d = [b_[j] - a_[j] for j in range(3)]; L = math.sqrt(sum(v * v for v in d)) * 1.1
                M.box(h, [a_[0] - ws[i] / 2, a_[1], a_[2] - ws[i] / 2], [a_[0] + ws[i] / 2, a_[1] + L, a_[2] + ws[i] / 2], 'trim' if i == 2 else 'main', origin=list(a_), rotation=rot_to(d))
        m.bone('crest', [0, 17.0, -1.0], 'helm')
        body = k.main('icb', P.facet(6, 24, P.shade(H['gem'], 1.3), P.shade(H['gem'], 0.7), hi=(255, 255, 255)))
        tip = k.main('ict', P.facet(6, 12, H['gem'], P.shade(H['gem'], 0.55))); gt = k.glow('icg', P.facet(6, 12, (255, 220, 220), H['gem']))
        crystal3d(m, 'crest', [0, 15.5, -1.0], 3.6, 1.5, body, tip, gt, both=True)

def F(uv): return {'uv': [round(v, 4) for v in uv], 'texture': getattr(uv, 'tex', 0)}

# ===================================================================== WEAPON (weapon slot, sword type)
def weapon(name, Wd, painted=None):
    """Wd: shape (long|great|crystal|dragon|jagged|trident|scythe|leaf|spear|royal), blade, edge (glow), guard, grip, gem."""
    m = BB(name, Atlas(256, 256)); k = Kit(m)
    mats = {'blade': (Wd['blade'], None, 'trim'), 'guard': (Wd['guard'], None, 'trim'), 'grip': (Wd['grip'], None, 'cloth'),
            'dark': (P.shade(Wd['grip'], 0.8), None, 'dark'), 'edge': ('glow', Wd['edge']), 'gem': ('glow', Wd['gem'])}
    if painted: mats.update(painted)
    M = Mats(m, k, mats)
    m.bone('grip', [0, 0, 0])                          # first bone = grip anchor (pivot 0 -> held at the origin)
    g = 'grip'
    shape = Wd['shape']
    big = shape in ('great', 'royal')
    gl = 7.0 if big else 5.0
    for i in range(int(gl)):                            # wrapped grip
        M.box(g, [-0.55, -1.0 + i, -0.55], [0.55, i, 0.55], 'grip' if i % 2 == 0 else 'dark')
    M.box(g, [-0.85, -2.6, -0.85], [0.85, -1.0, 0.85], 'guard'); M.gem(g, [0, -2.0, 0], 0.7, 'gem', rot=[45, 45, 0])   # pommel
    gy = gl - 1.0
    if shape == 'trident':
        M.box(g, [-0.45, gy, -0.45], [0.45, gy + 12, 0.45], 'dark')              # long shaft
        gy += 12
    # guard: wide crossguard with swept wings + centre gem
    gw = 5.0 if big else 4.0
    M.box(g, [-0.8, gy, -gw], [0.8, gy + 1.6, gw], 'guard')
    for s in (-1, 1):
        M.spike(g, [0, gy + 0.8, s * gw], (0, 0.55, s * 1), 2.6 if big else 2.0, 1.0, 'guard')
    M.gem(g, [0, gy + 0.8, 0], 1.1 if big else 0.9, 'gem', setting='guard', rot=[0, 90, 45])
    y0 = gy + 1.6
    if shape in ('long', 'great', 'royal', 'jagged', 'dragon', 'leaf'):
        L = {'long': 18, 'great': 22, 'royal': 24, 'jagged': 19, 'dragon': 20, 'leaf': 17}[shape]
        w0 = {'long': 2.4, 'great': 3.6, 'royal': 3.8, 'jagged': 2.8, 'dragon': 3.0, 'leaf': 2.0}[shape]
        n = 8
        for i in range(n):
            t0, t1 = i / n, (i + 1) / n
            w = w0 * (1 - 0.15 * t0) if shape != 'leaf' else w0 * (0.8 + 0.7 * math.sin(math.pi * min(1, t0 * 1.2)))
            if i >= n - 2: w *= (1 - (t0 - (n - 2) / n) * 3.2)
            M.box(g, [-0.35, y0 + L * t0, -w / 2], [0.35, y0 + L * t1 + 0.05, w / 2], 'blade')
            if shape == 'jagged' and i % 2 == 1:
                M.spike(g, [0, y0 + L * t0, w / 2], (0, 0.6, 1), 1.6, 0.6, 'blade', segs=2)
            if shape == 'dragon' and i % 2 == 0 and i < n - 2:
                M.spike(g, [0, y0 + L * t0 + 0.6, -w / 2], (0, 0.7, -1), 1.4, 0.6, 'guard', segs=2)
        M.box(g, [-0.42, y0 + 0.5, -0.25], [0.42, y0 + L * 0.82, 0.25], 'edge')  # glowing fuller
        M.spike(g, [0, y0 + L - 0.3, 0], (0, 1, 0), 2.2, w0 * 0.42, 'blade', segs=2)
    elif shape == 'crystal':
        body = k.main('wcb', P.facet(6, 24, P.shade(Wd['blade'], 1.25), P.shade(Wd['blade'], 0.75), hi=(255, 255, 255)))
        tip = k.main('wct', P.facet(6, 12, Wd['blade'], P.shade(Wd['blade'], 0.6))); gt = k.glow('wcg', P.facet(6, 12, (255, 255, 255), Wd['edge']))
        crystal3d(m, g, [0, y0, 0], 21, 2.6, body, tip, gt)
        for s in (-1, 1): crystal3d(m, g, [0, y0 + 1, s * 1.4], 5.0, 1.0, body, tip, gt, d=(0, 1, s * 0.5))
    elif shape == 'trident':
        M.box(g, [-0.4, y0, -0.4], [0.4, y0 + 8, 0.4], 'blade')
        M.spike(g, [0, y0 + 7.6, 0], (0, 1, 0), 4.5, 1.4, 'blade', tip='edge')
        for s in (-1, 1):
            M.box(g, [-0.35, y0 + 1.0, s * 0.4 if s > 0 else -3.2], [0.35, y0 + 1.8, 3.2 if s > 0 else -0.4], 'blade')
            M.spike(g, [0, y0 + 1.4, s * 3.0], (0, 1, s * 0.15), 6.0, 1.1, 'blade', tip='edge')
    elif shape == 'scythe':
        M.box(g, [-0.45, y0, -0.45], [0.45, y0 + 14, 0.45], 'dark')
        top = y0 + 14
        pts = [(0, top, 0.5), (0, top + 1.5, -4), (0, top + 1.2, -9), (0, top - 0.8, -13), (0, top - 3.5, -15)]
        ws = [2.4, 2.2, 1.8, 1.2, 0.5]
        for i in range(4):
            a_, b_ = pts[i], pts[i + 1]; d = [b_[j] - a_[j] for j in range(3)]; Ls = math.sqrt(sum(v * v for v in d)) * 1.08
            M.box(g, [a_[0] - 0.3, a_[1], a_[2] - ws[i] / 2], [a_[0] + 0.3, a_[1] + Ls, a_[2] + ws[i] / 2], 'blade', origin=list(a_), rotation=rot_to(d))
            M.box(g, [a_[0] - 0.36, a_[1], a_[2] - ws[i] / 2 - 0.25], [a_[0] + 0.36, a_[1] + Ls, a_[2] - ws[i] / 2 + 0.2], 'edge', origin=list(a_), rotation=rot_to(d))
        M.gem(g, [0, top, 0], 1.2, 'gem', setting='guard', rot=[0, 90, 45])
    elif shape == 'spear':
        M.box(g, [-0.42, y0, -0.42], [0.42, y0 + 12, 0.42], 'dark')
        M.spike(g, [0, y0 + 12, 0], (0, 1, 0), 7.0, 2.4, 'blade', tip='edge', segs=4)
        for i in range(6):   # sun disc at the base of the head
            a = i * 60; M.spike(g, [0, y0 + 12, 0], (0, math.cos(math.radians(a)), math.sin(math.radians(a))), 2.6, 0.7, 'guard', tip='edge', segs=2)
    # floating rune bits for the endgame blade
    if shape == 'royal':
        m.bone('runes', [0, y0 + 12, 0], 'grip')
        for i in range(3):
            a = i * 120; z = math.cos(math.radians(a)) * 4.0; x = math.sin(math.radians(a)) * 4.0
            M.gem('runes', [x, y0 + 12, z], 0.8, 'gem')
    def build(c):
        tr = {}
        if shape == 'royal': tr['runes'] = {'rotation': [(0, 0, 'query.anim_time*120', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90)*1.2', 0)]}
        else: tr['grip'] = {'position': [(0, 0, 0, 0)]}
        return tr
    clips(m, build, 3.0, None, names=('idle',))
    return m

# ===================================================================== GROUND SIGIL (ground slot)
def sigil(name, Gd):
    m = BB(name, Atlas(256, 256)); k = Kit(m)
    col, light, dark = Gd['col'], Gd.get('light', P.mixc(Gd['col'], (255, 255, 255), 0.6)), Gd.get('dark', P.shade(Gd['col'], 0.45))
    R = Gd.get('r', 15.0)
    m.bone('ring_o', [0, 0, 0]); m.bone('ring_i', [0, 0, 0])
    m.flat('ring_o', [-R, 0, -R], [R, 0.01, R], m.glow_atlas().add(P.magic_circle(128, col, light, dark, 'outer', seed=hash(name) % 97)))
    m.flat('ring_i', [-R * 0.72, 0.02, -R * 0.72], [R * 0.72, 0.03, R * 0.72], m.glow_atlas().add(P.magic_circle(112, col, light, dark, 'inner', seed=hash(name) % 89)))
    def build(c):
        sp = 1.8 if c in ('walk', 'run') else 1.0
        return {'ring_o': {'rotation': [(0, 0, f'query.anim_time*{14 * sp:.1f}', 0)]}, 'ring_i': {'rotation': [(0, 0, f'-query.anim_time*{24 * sp:.1f}', 0)]}}
    clips(m, build, 4.0, None, names=('idle', 'walk', 'run'))
    return m

# ===================================================================== WINGS (back): layered composite
def wings(name, Wg):
    """Wg: layers = [dict(kind=feather|plate|crystal|leaf|membrane, k, th, dy, dz, pal)], arcs (gold blade colour or None),
    gems (glow colour for wrist/elbow gems or None), float_crystals (colour or None), soft (colour), fx (kind), fxcol."""
    m = BB(name, Atlas(512, 512)); k = Kit(m)
    prims = {}
    arc_col = Wg.get('arcs')
    import armorart as AA
    gmain = k.main('arc', AA.gold(8, 16, {'gold': arc_col})[0]) if arc_col else None          # painted, engraved gold
    gdark = k.main('arcd', AA.gold(8, 8, {'gold': P.shade(arc_col, 0.7)})[0]) if arc_col else None
    gglow = k.glow('arcg', AA.gold(8, 16, {'gold': arc_col})[0]) if arc_col else None
    for li, L in enumerate(Wg['layers']):
        pre = 'L%d' % li; kk, th, dy, dz, pal = L.get('k', 1.0), L.get('th', 0), L.get('dy', 0), L.get('dz', 0), L['pal']
        pts = [W4.xform(p, kk, th, dy, dz) for p in (W4.S, W4.E, W4.W, W4.H)]
        if L['kind'] == 'membrane':
            membrane_layer(m, k, pre, kk, th, dy, dz, pal); prims[pre] = None; continue
        spr = layer_sprites(k, pre, L['kind'], pal)
        Sx, Ex, Wx, Hx = pts
        cnt = L.get('counts', (11, 9, 12, 8))
        for s, n in ((1, 'r'), (-1, 'l')):
            wb, mb, hb = W4.skeleton(m, n, s, pre=pre, pts=(Sx, Ex, Wx))
            bonec = pal.get('bone', arc_col or (60, 60, 70))
            bu = k.main(pre + 'bone', P.facet(4, 8, P.shade(bonec, 1.2), bonec)); bd = k.main(pre + 'boned', P.solid(P.shade(bonec, 0.6)))
            seg(m, wb, W4.X(Sx, s), W4.X(Ex, s), 1.5 * kk, bu, bd); seg(m, mb, W4.X(Ex, s), W4.X(Wx, s), 1.25 * kk, bu, bd); seg(m, hb, W4.X(Wx, s), W4.X(Hx, s), 1.0 * kk, bu, bd)
            pl = []
            NP, NS, NG, NM = cnt
            for i in range(NP):
                t = i / (NP - 1); R = lerp3(Wx, Hx, 0.05 + 0.95 * t); R[2] += 0.35 + 0.03 * i
                pb = m.bone(pre + 'p%d_%s' % (i, n), W4.X(R, s), hb); pl.append(pb)
                Lf = (19 + 10 * math.sin(min(1, t * 1.1) * math.pi * 0.6)) * kk * L.get('len', 1.0)
                piece(m, pb, W4.X(R, s), Lf, 4.2 * max(0.8, kk) * L.get('wid', 1.0), s * (26 + 96 * t ** 1.1 + th), spr['prim'] if i % 2 else spr['prim2'], s, L['kind'])
            prims[pre + n] = pl
            for i in range(NS):
                t = i / max(1, NS - 1); R = lerp3(Ex, Wx, t); R[2] += 0.25 - 0.02 * i
                piece(m, mb, W4.X(R, s), (16 + 4 * t) * kk * L.get('len', 1.0), 4.4 * max(0.8, kk) * L.get('wid', 1.0), s * (0 + 24 * t + th), spr['sec'], s, L['kind'])
            for i in range(NG):
                t = i / max(1, NG - 1); R = lerp3(Sx, Hx, 0.04 + 0.9 * t); R[2] -= 0.45 + 0.01 * i
                b = wb if t < 0.33 else (mb if t < 0.62 else hb)
                ang = (24 * t / 0.62) if t < 0.62 else (24 + 84 * (t - 0.62) / 0.38)
                piece(m, b, W4.X(R, s), (9 + 3 * t) * kk, 3.6 * max(0.8, kk), s * (ang + th), spr['cov'], s, L['kind'])
            for i in range(NM):
                t = i / max(1, NM - 1); R = lerp3(Sx, Hx, 0.02 + 0.8 * t); R[2] -= 0.85
                b = wb if t < 0.33 else (mb if t < 0.62 else hb)
                piece(m, b, W4.X(R, s), 5 * kk, 3.0, s * (4 + 70 * t ** 1.5 + th), spr['small'], s, L['kind'])
            if arc_col and L.get('arcs', li == 0):
                a1 = W4.bez3(W4.xform((W4.E[0] - 1, W4.E[1] + 1.5, W4.E[2] - 1.7), kk, th, dy, dz), W4.xform((W4.W[0] + 4, W4.W[1] + 9, W4.W[2] - 1.7), kk, th, dy, dz), W4.xform((35, 8, W4.W[2] - 1.7), kk, th, dy, dz), 14)
                W4.arc(m, hb, a1, 2.2 * kk, 0.4, gmain, s, gglow)
                a2 = W4.bez3(W4.xform((W4.W[0] + 1, W4.W[1] - 4, W4.W[2] - 1.5), kk, th, dy, dz), W4.xform((24, -2, W4.W[2] - 1.5), kk, th, dy, dz), W4.xform((33, -12, W4.W[2] - 1.5), kk, th, dy, dz), 10)
                W4.arc(m, hb, a2, 1.5 * kk, 0.3, gmain, s, gglow)
            if Wg.get('gems') and li == 0:
                gm = k.glow('wgem', P.dot(Wg['gems'], 4, core=(255, 255, 255)))
                for J, bn in ((Wx, hb), (Ex, mb)):
                    Jx = W4.X(J, s)
                    m.box(bn, [Jx[0] - 1.3, Jx[1] - 1.3, Jx[2] - 1.3], [Jx[0] + 1.3, Jx[1] + 1.3, Jx[2] + 0.6], gmain or bu, gdark or bd)
                    m.box(bn, [Jx[0] - 0.7, Jx[1] - 0.7, Jx[2] - 1.6], [Jx[0] + 0.7, Jx[1] + 0.7, Jx[2] - 1.3], gm, gm, origin=Jx, rotation=[0, 0, 45])
    if Wg.get('soft'):
        uv = k.soft('soft', P.soft(64, 64, Wg['soft'], peak=55))
        for s, n in ((1, 'r'), (-1, 'l')):
            c = lerp3(W4.S, W4.H, 0.5); c[1] -= 6; c[2] = 0.2; cx = W4.X(c, s)
            m.plate('L0wing_' + n, [cx[0] - 15, cx[1] - 14, cx[2] - 0.05], [cx[0] + 15, cx[1] + 14, cx[2] + 0.05], uv)
    if Wg.get('float_crystals'):
        col = Wg['float_crystals']
        body = k.main('fcb', P.facet(6, 24, P.shade(col, 1.3), P.shade(col, 0.7), hi=(255, 255, 255)))
        tip = k.main('fct', P.facet(6, 12, col, P.shade(col, 0.55))); gt = k.glow('fcg', P.facet(6, 12, (255, 230, 230), col))
        m.bone('fcr', [0, -6, -3])
        for i in range(8):
            s = 1 if i % 2 else -1
            x = s * (14 + (i // 2) * 5.5); y = -2 + (i // 2) * 2.0 - (i % 3) * 3
            b = m.bone('fc%d' % i, [x, y, -4], 'fcr')
            crystal3d(m, b, [x, y - 1.6, -4], 3.6 - (i // 2) * 0.3, 1.3, body, tip, gt, both=True)
    # sparkles shedding off the wings (a second particle stream), in the gem / trim colour
    shed = Wg.get('gems') or Wg.get('arcs')
    if shed is not None:
        fs = Particles(m, None, 2.5, name='shed'); rnd = random.Random(name + 'shed')
        sg = k.glow('shed', P.dot(shed, 3, core=(255, 255, 255)))
        for i in range(14):
            sd = 1 if i % 2 else -1
            fs.add([sd * rnd.uniform(10, 30), rnd.uniform(-14, 6), -rnd.uniform(2.5, 4.5)], [sd * rnd.uniform(0.5, 2.5), -rnd.uniform(3, 8), -rnd.uniform(0, 2)], 0.55, sg, i / 14, spin=200, fade_in=0.1, fade_out=0.5)
    else: fs = None
    fx = W4.effects(m, k, dict(fx=Wg.get('fx'), fxcol=Wg.get('fxcol', (255, 230, 150)), root=Wg['layers'][0]['pal'].get('root', (255, 255, 255)),
                               tip=Wg['layers'][0]['pal'].get('tip', (200, 200, 255)), edge=(255, 255, 255)))
    def build(c):
        tr = {}
        for li, L in enumerate(Wg['layers']):
            pre = 'L%d' % li
            for s, n in ((1, 'r'), (-1, 'l')):
                tr.update(W4.flap_tracks(c, n, s, prims.get(pre + n) or [], 'demon' if L['kind'] == 'membrane' else 'feather', pre=pre, ph=li * 35, amp=1.0 - li * 0.18))
        if Wg.get('float_crystals'):
            for i in range(8): tr['fc%d' % i] = {'position': [(0, 0, f'math.sin(query.anim_time*100+{i * 45})*1.4', 0)], 'rotation': [(0, 0, f'query.anim_time*{60 + i * 10}', 0)]}
        return tr
    def build2(c):
        tr = build(c)
        if fs is not None: fs.add_tracks(tr)
        return tr
    clips(m, build2, 4.0, fx)
    W4.place_back(m)
    return m

def layer_sprites(k, pre, kind, pal):
    root, tip = pal.get('root', (255, 255, 255)), pal.get('tip', (200, 200, 255))
    edge, glow, streak = pal.get('edge'), pal.get('glow'), pal.get('streak')
    if kind == 'feather':
        pk = 'flame' if pal.get('flame') else 'primary'
        return {'prim': k.sprite(pre + 'prim', lambda: P.feather(12, 84, root, tip, edge, pal.get('shaft'), pk, glow_tip=glow, streak=streak, stars=pal.get('stars'), seed=1)),
                'prim2': k.sprite(pre + 'prim2', lambda: P.feather(12, 72, P.mixc(root, tip, 0.1), tip, edge, pal.get('shaft'), pk, glow_tip=glow, streak=streak, stars=pal.get('stars'), seed=2)),
                'sec': k.sprite(pre + 'sec', lambda: P.feather(12, 60, root, P.mixc(root, tip, 0.8), edge, pal.get('shaft'), 'secondary', streak=streak, seed=3)),
                'cov': k.sprite(pre + 'cov', lambda: P.feather(10, 32, pal.get('cov', root), P.mixc(pal.get('cov', root), tip, 0.4), edge, None, 'covert', streak=streak, seed=4)),
                'small': k.sprite(pre + 'small', lambda: P.feather(8, 14, pal.get('cov', root), root, None, None, 'covert', seed=5))}
    if kind == 'plate':
        dark, light, g = pal['dark'], pal['light'], pal.get('glow')
        return {'prim': k.sprite(pre + 'prim', lambda: P.blade(12, 80, dark, light, glow=g)), 'prim2': k.sprite(pre + 'prim2', lambda: P.blade(12, 70, P.shade(dark, 1.15), light, glow=g)),
                'sec': k.sprite(pre + 'sec', lambda: P.blade(12, 58, dark, light, glow=g)), 'cov': k.sprite(pre + 'cov', lambda: P.plate(12, 26, dark, pal.get('rim', light), gem=g)),
                'small': k.sprite(pre + 'small', lambda: P.plate(10, 12, dark, pal.get('rim', light)))}
    if kind == 'leaf':
        v = pal.get('vein', P.shade(root, 0.6))
        return {'prim': k.sprite(pre + 'prim', lambda: P.leaf(14, 70, root, v)), 'prim2': k.sprite(pre + 'prim2', lambda: P.leaf(14, 60, P.shade(root, 1.1), v)),
                'sec': k.sprite(pre + 'sec', lambda: P.leaf(14, 50, P.mixc(root, tip, 0.4), v)), 'cov': k.sprite(pre + 'cov', lambda: P.leaf(12, 28, tip, v)),
                'small': k.sprite(pre + 'small', lambda: P.leaf(8, 12, P.shade(tip, 1.15), v))}
    if kind == 'crystal':
        body = k.main(pre + 'cbody', P.facet(6, 24, P.shade(root, 1.05), P.mixc(root, tip, 0.75), hi=(255, 255, 255)))
        tu = k.main(pre + 'ctip', P.facet(6, 12, P.mixc(root, tip, 0.6), tip))
        gt = k.glow(pre + 'cglow', P.facet(6, 12, glow, P.shade(glow, 0.7))) if glow else None
        sp = (body, (tu, gt))
        return {'prim': sp, 'prim2': sp, 'sec': sp, 'cov': sp, 'small': sp}

def piece(m, bone, R, L, w, ang, spr, s, kind):
    if kind == 'crystal':
        W4.crystal_shard(m, bone, R, L * 0.95, w * 0.78, ang, spr[0], spr[1][0], spr[1][1], s)
    else:
        hang(m, bone, R, L, w, ang, spr[0], spr[1], side=s, th=0.3 if kind == 'plate' else 0.1)

def membrane_layer(m, k, pre, kk, th, dy, dz, pal):
    """A bat/dragon/fin membrane layer (ported from wings4.membrane_wing) on a scaled/rotated skeleton."""
    fingers = pal.get('fingers', W4.FINGERS)
    xf = lambda p: W4.xform(p, kk, th, dy, dz)
    Wp3 = xf(W4.W); Wp = (Wp3[0], Wp3[1])
    tips3 = [xf((W4.W[0] + math.cos(math.radians(a)) * L, W4.W[1] + math.sin(math.radians(a)) * L, W4.W[2])) for a, L in fingers]
    tips = [(t[0], t[1]) for t in tips3]
    B1 = xf((16.0, -17.5, 0)); B0 = xf((3.2, -23.0, 0)); S3, E3 = xf(W4.S), xf(W4.E)
    B1, B0 = (B1[0], B1[1]), (B0[0], B0[1])
    hand_poly = [Wp, tips[0]]
    for i in range(len(tips) - 1): hand_poly += W4.scallop(tips[i], tips[i + 1], Wp, pal.get('depth', 0.32)) + [tips[i + 1]]
    arm_poly = [(S3[0], S3[1] + 1.0), (E3[0], E3[1] + 0.6), (Wp[0], Wp[1] + 0.4), tips[-1]] + W4.scallop(tips[-1], B1, Wp, 0.25) + [B1] + W4.scallop(B1, B0, (S3[0], S3[1]), 0.25) + [B0]
    veins_h = [(Wp, t) for t in tips]
    veins_a = [((S3[0], S3[1]), (E3[0], E3[1])), ((E3[0], E3[1]), Wp), ((E3[0], E3[1]), B1), ((S3[0], S3[1]), B0)]
    mh, gh, fh = P.membrane(hand_poly, veins_h, W4.D, pal['mem'], pal['edge'], pal['vein'], pal.get('glow_vein'), holes=pal.get('holes', 0), stars=pal.get('stars', False), seed=m.name + pre + 'h')
    ma, ga, fa = P.membrane(arm_poly, veins_a, W4.D, P.shade(pal['mem'], 0.9), pal['edge'], pal['vein'], pal.get('glow_vein'), holes=pal.get('holes', 0), stars=pal.get('stars', False), seed=m.name + pre + 'a')
    uh = m.atlas.add(mh); ua = m.atlas.add(ma)
    gh_uv = m.glow_atlas().add(gh) if gh is not None else None; ga_uv = m.glow_atlas().add(ga) if ga is not None else None
    bone = k.main(pre + 'bone', P.facet(4, 8, P.shade(pal['bone'], 1.2), pal['bone'])); bone_d = k.main(pre + 'bone_d', P.solid(P.shade(pal['bone'], 0.65)))
    claw = k.main(pre + 'claw', P.facet(4, 8, P.shade(pal['claw'], 1.2), pal['claw']))
    claw_g = k.glow(pre + 'claw_g', P.solid(pal['glow_vein'])) if pal.get('glow_vein') else None
    for s, n in ((1, 'r'), (-1, 'l')):
        wb, mb, hb = W4.skeleton(m, n, s, pre=pre, pts=(S3, E3, Wp3))
        def panel(bone_, fr, uv, guv, z):
            x0, y0, x1, y1 = fr
            a, b = ([x0, y0, z - 0.05], [x1, y1, z + 0.05]) if s > 0 else ([-x1, y0, z - 0.05], [-x0, y1, z + 0.05])
            m.plate(bone_, a, b, mir(uv, s))
            if guv is not None: m.plate(bone_, [a[0], a[1], a[2] - 0.04], [b[0], b[1], b[2] + 0.04], mir(guv, s))
        panel(mb, fa, ua, ga_uv, -1.6 + dz); panel(hb, fh, uh, gh_uv, Wp3[2])
        seg(m, wb, W4.X(S3, s), W4.X(E3, s), 1.6 * kk, bone, bone_d); seg(m, mb, W4.X(E3, s), W4.X(Wp3, s), 1.3 * kk, bone, bone_d)
        for J, b_ in ((E3, mb), (Wp3, hb)):
            Jx = W4.X(J, s); r = 1.0 * kk
            m.box(b_, [Jx[0] - r, J[1] - r, J[2] - r], [Jx[0] + r, J[1] + r, J[2] + r], bone, bone_d)
        for fi, t3 in enumerate(tips3):
            A = list(Wp3); T = list(t3); Mid = lerp3(A, T, 0.55)
            seg(m, hb, W4.X(A, s), W4.X(Mid, s), 0.9 * kk, bone, bone_d); seg(m, hb, W4.X(Mid, s), W4.X(T, s), 0.6 * kk, bone, bone_d)
            d = [T[0] - A[0], T[1] - A[1]]; dl = math.hypot(*d) or 1
            C1 = [T[0] + d[0] / dl * 1.8, T[1] + d[1] / dl * 1.8, T[2]]
            seg(m, hb, W4.X(T, s), W4.X(C1, s), 0.55, claw, claw, guv=claw_g if fi == 0 else None)
        if pal.get('spikes'):
            for i in range(5):
                t = (i + 0.5) / 5; R = lerp3(S3, Wp3, t); R[1] += 0.8
                b_ = wb if t < 0.5 else mb
                d0 = (-(Wp3[1] - S3[1]), Wp3[0] - S3[0]); dl = math.hypot(*d0); d0 = (d0[0] / dl, d0[1] / dl)
                T2 = [R[0] + d0[0] * 2.6, R[1] + d0[1] * 2.6, R[2] - 0.2]
                seg(m, b_, W4.X(R, s), W4.X(T2, s), 0.7, claw, claw)
