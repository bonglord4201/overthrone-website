# OVERTHRONE v6 pets: detailed baby dragons (rounded bodies, painted scales and belly plates, curved horns, frills, clawed
# legs, membrane wings with finger bones, a spiked tail with a fin tip, a jaw that opens), an abyssal jellyfish, and the
# 10 set pets. Frame: Y up from the feet, -Z = front; the mod shrinks pets over 16 px tall / 32 wide.
import math, random
from bb import BB, Atlas, UV
import paint as P
from art import Canvas, ramp, sh, lit
from fx import Kit, Particles, clips
from heads4 import rot_to, horn_path, crystal as crystal3d
import pets4 as P4

def mix_(a, b, t):
    import numpy as np
    return np.array(a, float) * (1 - t[..., None]) + np.array(b, float) * t[..., None]

def scales_tex(w, h, col, belly=False):
    import numpy as np
    c = Canvas(w, h, bg=col)
    Y, X = c.Y, c.X
    if belly:
        for y in range(2, h, 3): c.rgb[(np.abs(Y - y) < 0.5)] = sh(col, 0.72)
        c.rgb[:, 0] = sh(col, 0.65); c.rgb[:, -1] = sh(col, 0.65)
    else:
        cw, ch = 5.0, 3.0
        row = np.floor(Y / ch).astype(int); off = (row % 2) * cw / 2
        u = ((X + off) % cw) - cw / 2; v = (Y % ch)
        d = np.sqrt((u / (cw / 2)) ** 2 + ((v - ch) / ch) ** 2)          # overlapping round scales, pointing down
        base = np.where((d < 1.0)[..., None], mix_(lit(col, 0.2), sh(col, 0.8), np.clip(d, 0, 1)), sh(col, 0.62) * np.ones((h, w, 1)))
        base = np.where(((d > 0.82) & (d < 1.0))[..., None], sh(col, 0.6), base)
        c.rgb[:] = base
    c.a[:] = True; return c.images()[0]

def blob(m, bone, c, rx, ry, rz, uv, side=None, top=None):
    """A rounded volume: three crossing boxes (octagon-ish in every view)."""
    x, y, z = c
    m.box(bone, [x - rx, y - ry * 0.72, z - rz * 0.72], [x + rx, y + ry * 0.72, z + rz * 0.72], uv, side or uv, uv_top=top)
    m.box(bone, [x - rx * 0.72, y - ry, z - rz * 0.72], [x + rx * 0.72, y + ry, z + rz * 0.72], uv, side or uv, uv_top=top)
    m.box(bone, [x - rx * 0.72, y - ry * 0.72, z - rz], [x + rx * 0.72, y + ry * 0.72, z + rz], uv, side or uv, uv_top=top)

def dragon(name, body, belly, wing, horn, glow, iris, fx_col=None, frill=None, leafy=False):
    m = BB(name, Atlas(256, 256)); k = Kit(m)
    sc = k.main('scales', scales_tex(16, 16, body)); scd = k.main('scalesd', scales_tex(16, 16, P.shade(body, 0.75)))
    bl = k.main('belly', scales_tex(12, 16, belly, belly=True))
    hn = k.main('horn', P.facet(4, 8, P.shade(horn, 1.15), P.shade(horn, 0.7))); hd = k.main('hornd', P.facet(4, 8, horn, P.shade(horn, 0.5)))
    gl = k.glow('glow', P.facet(4, 4, P.mixc(glow, (255, 255, 255), 0.4), glow))
    claw = k.main('claw', P.facet(4, 4, (245, 240, 225), (180, 170, 150)))
    dark = k.main('dark', P.solid((20, 12, 14)))
    # body: rounded torso + chest, belly plates
    m.bone('body', [0, 6, 0])
    blob(m, 'body', (0, 5.6, 0.6), 2.9, 2.6, 3.4, sc, scd)
    blob(m, 'body', (0, 6.2, -2.2), 2.4, 2.4, 1.8, sc, scd)
    m.box('body', [-1.9, 3.4, -4.15], [1.9, 7.6, -3.7], bl, bl)
    m.box('body', [-2.1, 3.0, -3.2], [2.1, 3.6, 3.0], bl, bl)
    for i in range(5):   # glowing back spikes
        z = -2.4 + i * 1.3
        m.box('body', [-0.4, 8.0, z - 0.4], [0.4, 9.6 - i * 0.18, z + 0.4], gl if i % 2 == 0 else hn, hn, origin=[0, 8.0, z], rotation=[-25, 45, 0])
    # legs with claws
    legs = []
    for s in (-1, 1):
        for zz, nm in ((-2.2, 'f'), (2.2, 'b')):
            lb = m.bone('leg_%s%s' % (nm, 'r' if s > 0 else 'l'), [s * 2.0, 3.6, zz], 'body'); legs.append(lb)
            blob(m, lb, (s * 2.1, 2.6, zz), 1.0, 1.4, 1.0, sc, scd)
            m.box(lb, [s * 2.1 - 0.75, 0.0, zz - 1.2], [s * 2.1 + 0.75, 1.3, zz + 0.6], scd, scd)
            for t in (-0.45, 0, 0.45): m.box(lb, [s * 2.1 + t - 0.18, 0.0, zz - 1.6], [s * 2.1 + t + 0.18, 0.5, zz - 1.15], claw, claw)
    # neck + head + jaw
    m.bone('neck', [0, 7.4, -3.0], 'body')
    blob(m, 'neck', (0, 8.2, -3.4), 1.4, 1.4, 1.2, sc, scd)
    m.bone('head', [0, 9.0, -3.6], 'neck')
    face = k.main('face', P.facet(8, 8, P.shade(body, 1.18), body))
    m.cube('head', [-2.7, 8.6, -7.6], [2.7, 12.4, -3.2], {'north': P4.F(face), 'south': P4.F(sc), 'east': P4.F(sc), 'west': P4.F(sc), 'up': P4.F(sc), 'down': P4.F(bl)})
    m.box('head', [-2.2, 12.2, -6.8], [2.2, 12.8, -3.6], sc, sc)                                  # brow ridge
    m.cube('head', [-1.8, 8.9, -9.8], [1.8, 11.0, -7.4], {'north': P4.F(sc), 'south': P4.F(sc), 'east': P4.F(sc), 'west': P4.F(sc), 'up': P4.F(sc), 'down': P4.F(bl)})   # snout
    for s in (-1, 1): m.box('head', [s * 0.9 - 0.3, 10.3, -9.95], [s * 0.9 + 0.3, 10.7, -9.75], dark, dark)
    m.bone('jaw', [0, 8.9, -4.2], 'head')
    m.box('jaw', [-1.7, 8.0, -9.6], [1.7, 8.9, -4.2], bl, sc)
    for s in (-1, 1): m.box('jaw', [s * 1.2 - 0.18, 8.85, -9.3], [s * 1.2 + 0.18, 9.3, -8.9], claw, claw)   # fangs
    P4.eyes(m, k, 'eyes', [0, 11.0, -7.65], 5.2, 2.7, iris, 'sharp', 0.58, 0.34, 0.9, parent='head')
    for s in (-1, 1):   # curved horns + frill + cheek spikes
        horn_path(m, k, 'head', [(s * 1.7, 12.2, -4.6), (s * 2.2, 13.6, -3.4), (s * 2.4, 14.4, -1.6), (s * 2.0, 14.6, 0.0)], [1.0, 0.8, 0.5, 0.2], hn, hd, gl, n=8)
        m.box('head', [s * 2.7 - (0.0 if s > 0 else 1.6), 9.2, -4.6], [s * 2.7 + (1.6 if s > 0 else 0.0), 9.7, -3.6], hn, hn, origin=[s * 2.7, 9.4, -4.1], rotation=[0, 0, s * 20])
    if frill:
        fu = k.main('frill', P.facet(4, 8, frill, P.shade(frill, 0.6)))
        for s in (-1, 1):
            for i in range(3): m.box('head', [s * 2.6 - 0.15, 10.0 + i * 0.9, -4.2 + i * 0.3], [s * 2.6 + 0.15, 11.2 + i * 0.9, -2.6 + i * 0.3], fu, fu, origin=[s * 2.6, 10.0, -3.4], rotation=[-20, 0, s * 30])
    # membrane wings with finger bones and claws
    poly = [(0, 0), (3.5, 3.6), (8.0, 4.6), (10.0, 2.0), (8.0, 0.8), (9.0, -2.0), (6.0, -1.6), (5.6, -3.8), (2.4, -2.0)]
    veins = [((0, 0), (8.0, 4.6)), ((0, 0), (9.0, -2.0)), ((0, 0), (5.6, -3.8)), ((0, 0), (10.0, 2.0))]
    mm, gg, fr = P.membrane(poly, veins, 5, wing, P.shade(wing, 0.45), P.shade(wing, 0.55), glow_vein=glow, holes=0, seed=name)
    if leafy: mm, gg, fr = P.membrane(poly, veins, 5, wing, (40, 90, 30), (50, 120, 40), glow_vein=glow, seed=name)
    uw = m.atlas.add(mm); ug = m.glow_atlas().add(gg) if gg is not None else None
    for s, n in ((-1, 'l'), (1, 'r')):
        wb = m.bone('wing_' + n, [s * 2.3, 7.8, -0.2], 'body')
        off = (s * 2.3, 7.8, -0.2); x0, y0, x1, y1 = fr
        fa = [off[0] + (x0 if s > 0 else -x1), off[1] + y0, off[2] - 0.05]; fb = [off[0] + (x1 if s > 0 else -x0), off[1] + y1, off[2] + 0.05]
        m.plate(wb, fa, fb, uw if s > 0 else uw.mirrored(), origin=list(off), rotation=[0, -s * 25, 0])
        if ug is not None: m.plate(wb, [fa[0], fa[1], fa[2] - 0.04], [fb[0], fb[1], fb[2] + 0.04], ug if s > 0 else ug.mirrored(), origin=list(off), rotation=[0, -s * 25, 0])
    # tail: 6 segments with spikes and a glowing fin tip
    parent = 'body'; z = 3.6; tails = []
    for i, w in enumerate((2.0, 1.7, 1.4, 1.1, 0.8, 0.6)):
        b = m.bone('tail%d' % i, [0, 4.8 - i * 0.2, z], parent); tails.append(b)
        y = 4.8 - i * 0.2
        m.box(b, [-w / 2, y - w / 2, z], [w / 2, y + w / 2, z + 2.0], sc, scd)
        m.box(b, [-0.2, y + w / 2, z + 0.6], [0.2, y + w / 2 + 0.7, z + 1.2], hn, hn)
        parent = b; z += 1.85
    m.box(tails[-1], [-0.15, 3.0, z - 0.6], [0.15, 5.4, z + 1.8], gl, gl, origin=[0, 3.8, z], rotation=[0, 0, 0])
    m.box(tails[-1], [-1.2, 3.4, z], [1.2, 3.8, z + 1.6], gl, gl, origin=[0, 3.6, z], rotation=[0, 45, 0])
    sft = k.soft('aura', P.soft(48, 48, glow, peak=60)); m.flat('body', [-7, 0.05, -7], [7, 0.07, 7], sft)
    fx = None
    if fx_col:
        fx = Particles(m, None, 3.0); rnd = random.Random(name); sp = k.glow('sp', P.dot(fx_col, 3, core=(255, 255, 255)))
        for i in range(8): fx.add([rnd.uniform(-4, 4), rnd.uniform(5, 10), rnd.uniform(-5, 4)], [rnd.uniform(-0.5, 0.5), rnd.uniform(3, 6), 0], 0.5, sp, i / 8, spin=160)
    L = 4.0
    def build(c):
        fast = c in ('fly', 'walk', 'run')
        fl, amp = (520, 40) if fast else (200, 20)
        tr = {'eyes': {'scale': P4.blink_keys(L)},
              'wing_l': {'rotation': [(0, 0, f'math.sin(query.anim_time*{fl}+90)*8', f'-15-math.sin(query.anim_time*{fl})*{amp}')]},
              'wing_r': {'rotation': [(0, 0, f'-math.sin(query.anim_time*{fl}+90)*8', f'15+math.sin(query.anim_time*{fl})*{amp}')]},
              'neck': {'rotation': [(0, 'math.sin(query.anim_time*60)*4', 'math.sin(query.anim_time*35)*10', 0)]},
              'head': {'rotation': [(0, 'math.sin(query.anim_time*50+40)*5', 'math.sin(query.anim_time*30+30)*8', 'math.sin(query.anim_time*40)*4')]},
              'jaw': {'rotation': [(0, 0, 0, 0), (2.5, 0, 0, 0), (2.7, 14, 0, 0), (3.1, 14, 0, 0), (3.3, 0, 0, 0), (L, 0, 0, 0)]},
              'body': {'position': [(0, 0, f'math.sin(query.anim_time*{fl / 2})*0.8', 0)], 'scale': [(0, 1, '1+math.sin(query.anim_time*150)*0.02', 1)]}}
        for i, b in enumerate(tails): tr[b] = {'rotation': [(0, f'math.sin(query.anim_time*120-{i * 40})*6', f'math.sin(query.anim_time*90-{i * 45})*{10 + i * 2}', 0)]}
        if fast:
            for i, lb in enumerate(legs): tr[lb] = {'rotation': [(0, f'math.sin(query.anim_time*420+{(i % 2) * 180})*28' if c != 'fly' else 30, 0, 0)]}
        if c == 'special':   # roar: head up, jaw open, wings spread
            tr['head'] = {'rotation': [(0, 0, 0, 0), (0.3, -35, 0, 0), (1.4, -35, 0, 0), (1.7, 0, 0, 0), (L, 0, 0, 0)]}
            tr['jaw'] = {'rotation': [(0, 0, 0, 0), (0.3, 30, 0, 0), (1.4, 30, 0, 0), (1.7, 0, 0, 0), (L, 0, 0, 0)]}
            tr['wing_l'] = {'rotation': [(0, 0, 0, -15), (0.3, 0, 0, -60), (1.4, 0, 0, -60), (1.7, 0, 0, -15), (L, 0, 0, -15)]}
            tr['wing_r'] = {'rotation': [(0, 0, 0, 15), (0.3, 0, 0, 60), (1.4, 0, 0, 60), (1.7, 0, 0, 15), (L, 0, 0, 15)]}
        if c == 'special2':  # tail swish spin
            tr['body'] = {'rotation': [(0, 0, 0, 0), (1.0, 0, 360, 0), (L, 0, 360, 0)]}
        return tr
    clips(m, build, L, fx, names=('idle', 'walk', 'run', 'fly', 'special', 'special2'))
    return m

def jelly(name, bell, glow, tent):
    """Abyssal jellyfish: a glowing domed bell that pulses, swaying tentacles, orbiting bubbles."""
    m = BB(name, Atlas(256, 128)); k = Kit(m)
    bu = k.main('bell', P.facet(8, 8, P.mixc(bell, (255, 255, 255), 0.3), bell)); bd = k.main('belld', P.facet(8, 8, bell, P.shade(bell, 0.6)))
    gl = k.glow('g', P.facet(4, 4, P.mixc(glow, (255, 255, 255), 0.4), glow)); tu = k.main('t', P.facet(4, 8, tent, P.shade(tent, 0.6)))
    m.bone('bell', [0, 10, 0])
    for r, y0, y1 in ((5.2, 8.0, 10.2), (4.4, 10.2, 11.8), (3.2, 11.8, 12.9), (1.8, 12.9, 13.6)):
        c_ = r * 0.72
        m.box('bell', [-r, y0, -c_], [r, y1, c_], bu, bd); m.box('bell', [-c_, y0, -r], [c_, y1, r], bu, bd)
    for i in range(12):   # glowing rim dots + inner core
        a = 2 * math.pi * i / 12; x, z = math.cos(a) * 4.9, math.sin(a) * 4.9
        m.box('bell', [x - 0.35, 7.7, z - 0.35], [x + 0.35, 8.3, z + 0.35], gl, gl)
    m.box('bell', [-1.4, 9.0, -1.4], [1.4, 11.4, 1.4], gl, gl, origin=[0, 10.2, 0], rotation=[0, 45, 0])
    P4.eyes(m, k, 'eyes', [0, 9.6, -5.25], 4.4, 1.8, (255, 255, 255), 'round', 0.6, 0.3, 0.86, parent='bell')
    tents = []
    for i in range(8):
        a = 2 * math.pi * (i + 0.5) / 8; x, z = math.cos(a) * 3.2, math.sin(a) * 3.2
        parent = 'bell'; y = 8.0
        for j in range(4):
            b = m.bone('t%d_%d' % (i, j), [x, y, z], parent); tents.append((b, i, j))
            m.box(b, [x - 0.3, y - 1.8, z - 0.3], [x + 0.3, y, z + 0.3], gl if j == 3 else tu, gl if j == 3 else tu)
            parent = b; y -= 1.7
    m.plate('bell', [-8, 2, 4.0], [8, 16, 4.1], k.soft('aura', P.soft(48, 48, glow, peak=70)))
    fx = Particles(m, None, 3.0); rnd = random.Random(name); bb = k.glow('bub', P.dot(P.mixc(glow, (255, 255, 255), 0.5), 3))
    for i in range(8): fx.add([rnd.uniform(-5, 5), rnd.uniform(4, 9), rnd.uniform(-5, 5)], [0, rnd.uniform(4, 7), 0], 0.5, bb, i / 8)
    L = 3.0
    def build(c):
        tr = {'eyes': {'scale': P4.blink_keys(L)},
              'bell': {'scale': [(0, '1+math.sin(query.anim_time*240)*0.07', '1-math.sin(query.anim_time*240)*0.08', '1+math.sin(query.anim_time*240)*0.07')],
                       'position': [(0, 0, 'math.sin(query.anim_time*120)*1.2', 0)]}}
        for b, i, j in tents: tr[b] = {'rotation': [(0, f'math.sin(query.anim_time*160-{j * 50 + i * 45})*{6 + j * 4}', 0, f'math.sin(query.anim_time*130-{j * 45 + i * 30})*{5 + j * 4}')]}
        if c == 'special': tr['bell']['rotation'] = [(0, 0, 0, 0), (1.0, 0, 360, 0), (L, 0, 360, 0)]
        return tr
    clips(m, build, L, fx, names=('idle', 'walk', 'run', 'fly', 'special'))
    return m
