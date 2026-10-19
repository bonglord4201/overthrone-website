# OVERTHRONE v4 head pieces for Manas Cosmetics.
#   helmet     : Y up, the head is x/z -4..4, y 0..8, -Z = the face.
#   above_head : same frame (halos float at y ~11-14).
#   orbit      : Y DOWN, origin 8 px below the neck (soul crystals).
# Glow textures make rings/gems/runes full bright; soft textures add bloom; small model pieces act as particles.
import math, random
import armorart as AA
from bb import BB, Atlas
import paint as P
from fx import Kit, Particles, clips

GOLD, GOLD_L, GOLD_D = (255, 200, 60), (255, 245, 190), (150, 95, 15)

def rot_to(d):
    """Cube rotation [x, 0, z] that turns +Y into direction d (the mod applies Z, then Y, then X)."""
    L = math.sqrt(sum(v * v for v in d)) or 1; dx, dy, dz = d[0] / L, d[1] / L, d[2] / L
    a = math.degrees(math.asin(max(-1, min(1, dz)))); c = math.degrees(math.atan2(-dx, dy))
    return [a, 0, c]

def ring(m, bone, y, r, n, uv, side=None, w=1.0, h=0.8, skip=(), tilt=0.0):
    for i in range(n):
        if i in skip: continue
        a = 2 * math.pi * i / n; x, z = math.cos(a) * r, math.sin(a) * r
        L = 2 * math.pi * r / n * 1.08
        m.box(bone, [x - L / 2, y - h / 2, z - w / 2], [x + L / 2, y + h / 2, z + w / 2], uv, side or uv, origin=[x, y, z], rotation=[tilt, -math.degrees(a) + 90, 0])

def crystal(m, bone, p, h, w, body, tip, gtip=None, d=(0, 1, 0), both=False):
    """A 3D crystal standing at p along direction d: diamond-section body + two tapering tip blocks (last one glows)."""
    r = rot_to(d); r[1] = 45 if abs(d[1]) > 0.9 else 0
    def blk(y0, y1, ww, uv):
        m.box(bone, [p[0] - ww / 2, p[1] + y0, p[2] - ww / 2], [p[0] + ww / 2, p[1] + y1, p[2] + ww / 2], uv, uv, origin=list(p), rotation=r)
    blk(0 if not both else -h * 0.3, h * 0.6, w, body); blk(h * 0.6, h * 0.84, w * 0.62, tip); blk(h * 0.84, h, w * 0.28, gtip or tip)
    if both: blk(-h * 0.5, -h * 0.3, w * 0.55, tip)

def flat_disc(m, bone, y, R, uv, z0=0.0):
    m.flat(bone, [-R, y, z0 - R], [R, y + 0.02, z0 + R], uv)

def vdisc(m, bone, c, R, uv):
    m.plate(bone, [c[0] - R, c[1] - R, c[2] - 0.05], [c[0] + R, c[1] + R, c[2] + 0.05], uv)

def sparkles(m, k, col, n, region, L=3.0, rise=(2, 5), size=0.6, name='spark'):
    fx = Particles(m, None, L); rnd = random.Random(m.name + name)
    g = k.glow(name, P.dot(col, 3, core=(255, 255, 255)))
    (x0, x1), (y0, y1), (z0, z1) = region
    for i in range(n):
        fx.add([rnd.uniform(x0, x1), rnd.uniform(y0, y1), rnd.uniform(z0, z1)], [rnd.uniform(-0.6, 0.6), rnd.uniform(*rise), rnd.uniform(-0.6, 0.6)], size, g, i / n, spin=160)
    return fx

def spin_bob(bone, speed=40, bob=0.5, wob=0):
    tr = {'rotation': [(0, f'math.sin(query.anim_time*60)*{wob}' if wob else 0, f'query.anim_time*{speed}', 0)]}
    if bob: tr['position'] = [(0, 0, f'math.sin(query.anim_time*90)*{bob}', 0)]
    return {bone: tr}

def simple_clips(m, tracks, fx, L=3.0):
    clips(m, lambda c: {k: v for k, v in tracks.items()}, L, fx, names=('idle',))

# ================================================================== HALOS (above_head)
def halo_basic(name, col, light, dark, bloom=None, broken=False, sigil=None, crystals=None, double=False, rays=False, orbs=None, fx=None, tilt=0.0):
    m = BB(name, Atlas(256, 256)); k = Kit(m)
    gl = k.glow('ring', AA.gold(8, 8, {'gold': col})[0]); gd = k.main('ringd', AA.gold(8, 8, {'gold': P.mixc(col, dark, 0.5)})[0])
    y = 12.0
    m.bone('tilt', [0, y, 0], rotation=(tilt, 0, tilt * 0.6))
    m.bone('halo', [0, y, 0], 'tilt')
    skip = (2, 3, 13, 21, 22) if broken else ()
    ring(m, 'halo', y, 5.8, 32, gl if not broken else gd, gd, w=1.1, h=0.9, skip=skip)
    ring(m, 'halo', y, 5.8, 16, gd, gd, w=1.35, h=0.5, skip=tuple(i // 2 for i in skip))
    if broken:   # cracks glow, broken chunks drift beside the gaps
        for i in (5, 9, 17, 26, 29):
            a = 2 * math.pi * i / 32; x, z = math.cos(a) * 5.8, math.sin(a) * 5.8
            m.box('halo', [x - 0.3, y - 0.55, z - 0.7], [x + 0.3, y + 0.55, z + 0.7], gl, gl, origin=[x, y, z], rotation=[0, -math.degrees(a) + 90, 0])
        for j, i in enumerate((2.5, 13.2, 21.5)):
            a = 2 * math.pi * i / 32; x, z = math.cos(a) * 6.6, math.sin(a) * 6.6
            b = m.bone('chunk%d' % j, [x, y, z], 'tilt')
            m.box(b, [x - 0.8, y - 0.45, z - 0.55], [x + 0.8, y + 0.45, z + 0.55], gd, gd, origin=[x, y, z], rotation=[20 * j, -math.degrees(a) + 90, 15])
    if bloom:
        sft = k.soft('bloom', P.soft(48, 48, bloom, peak=110, ring=(0.72, 0.13)))
        flat_disc(m, 'halo', y - 0.01, 8.2, sft)
    tr = {}
    tr.update(spin_bob('halo', 40, 0.5))
    if broken:
        for j in range(3): tr['chunk%d' % j] = {'position': [(0, 0, f'math.sin(query.anim_time*110+{j * 120})*0.6', 0)], 'rotation': [(0, 0, f'math.sin(query.anim_time*70+{j * 90})*20', 0)]}
    if sigil:
        m.bone('sig', [0, y + 0.1, 0], 'tilt')
        flat_disc(m, 'sig', y + 0.1, 4.8, k.glow('sig', P.magic_circle(80, sigil, P.mixc(sigil, (255, 255, 255), 0.6), P.shade(sigil, 0.5), 'inner')))
        tr.update(spin_bob('sig', -60, 0))
    if double:
        m.bone('halo2', [0, y + 2.2, 0], 'tilt')
        gl2 = k.glow('ring2', P.facet(4, 8, (255, 255, 255), light))
        ring(m, 'halo2', y + 2.2, 7.4, 36, gl2, gl2, w=0.7, h=0.6)
        tr['halo2'] = {'rotation': [(0, 'math.sin(query.anim_time*45)*10', '-query.anim_time*28', 'math.cos(query.anim_time*45)*6')]}
    if rays:
        rb = k.glow('ray', P.facet(4, 16, (255, 255, 255), col))
        for i in range(12):
            a = 2 * math.pi * i / 12; L = 3.2 if i % 2 else 5.0
            x, z = math.cos(a) * (6.6 + L / 2), math.sin(a) * (6.6 + L / 2)
            m.box('halo', [x - L / 2, y - 0.15, z - 0.35], [x + L / 2, y + 0.15, z + 0.35], rb, rb, origin=[x, y, z], rotation=[0, -math.degrees(a), 0])
    if crystals:
        body = k.main('cb', P.facet(6, 24, P.shade(crystals, 1.15), P.shade(crystals, 0.7), hi=(255, 255, 255)))
        tip = k.main('ct', P.facet(6, 12, crystals, P.shade(crystals, 0.6))); gt = k.glow('cg', P.facet(6, 12, P.mixc(crystals, (255, 255, 255), 0.4), crystals))
        for i in range(8):
            a = 2 * math.pi * (i + 0.5) / 8; x, z = math.cos(a) * 5.8, math.sin(a) * 5.8
            h = 4.4 if i % 2 == 0 else 2.8
            crystal(m, 'halo', [x, y + 0.3, z], h, 1.4, body, tip, gt, d=(math.cos(a) * 0.35, 1, math.sin(a) * 0.35))
    if orbs:
        m.bone('orbs', [0, y, 0], 'tilt')
        og = k.glow('orb', P.dot(orbs, 4, core=(255, 255, 255))); od = k.main('orbd', P.solid((20, 10, 30)))
        for i in range(3):
            a = 2 * math.pi * i / 3; x, z = math.cos(a) * 8.0, math.sin(a) * 8.0
            m.box('orbs', [x - 0.9, y - 0.9, z - 0.9], [x + 0.9, y + 0.9, z + 0.9], od, od)
            m.box('orbs', [x - 0.5, y - 0.5, z - 1.0], [x + 0.5, y + 0.5, z + 1.0], og, og)
        tr['orbs'] = {'rotation': [(0, 0, '-query.anim_time*70', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*120)*0.8', 0)]}
    fxo = None
    if fx == 'sparkles': fxo = sparkles(m, k, light, 8, ((-7, 7), (y - 1, y + 1), (-7, 7)), rise=(1, 4))
    elif fx == 'drips': fxo = sparkles(m, k, col, 6, ((-6, 6), (y - 1, y), (-6, 6)), rise=(-9, -6), size=0.5, name='drip')
    elif fx == 'embers': fxo = sparkles(m, k, (255, 140, 40), 8, ((-6, 6), (y, y + 1), (-6, 6)), rise=(3, 7), size=0.5, name='ember')
    elif fx == 'stars': fxo = sparkles(m, k, (255, 255, 255), 8, ((-8, 8), (y - 2, y + 3), (-8, 8)), rise=(0.5, 2), size=0.5, name='star')
    simple_clips(m, tr, fxo)
    return m

def sigil_halo(name, col, fx='embers'):
    """A big rune circle floating flat above the head: outer ring and inner seal turn in opposite directions."""
    m = BB(name, Atlas(256, 256)); k = Kit(m); y = 12.5
    m.bone('sig_o', [0, y, 0]); m.bone('sig_i', [0, y + 0.1, 0])
    light, dark = P.mixc(col, (255, 255, 255), 0.6), P.shade(col, 0.45)
    flat_disc(m, 'sig_o', y, 8.5, k.glow('o', P.magic_circle(112, col, light, dark, 'outer')))
    flat_disc(m, 'sig_i', y + 0.1, 6.2, k.glow('i', P.magic_circle(96, col, light, dark, 'inner')))
    import essence   # v14: solid 3D bands so the sigil has depth and is seen from the side (a flat disc vanishes edge-on)
    essence.torus(m, k, 'sig_o', y - 1.0, 7.9, h=2.8, w=1.5, col=col, light=light, dark=dark, n=36, key='so3')
    essence.torus(m, k, 'sig_i', y - 0.6, 4.2, h=2.0, w=1.1, col=col, light=light, dark=dark, n=24, key='si3')
    flat_disc(m, 'sig_o', y - 0.05, 9.5, k.soft('b', P.soft(48, 48, col, peak=80, ring=(0.75, 0.2))))
    tr = {}; tr.update(spin_bob('sig_o', 25, 0.4)); tr.update(spin_bob('sig_i', -45, 0.4))
    fxo = sparkles(m, k, P.mixc(col, (255, 220, 120), 0.5), 10, ((-7, 7), (y, y + 0.5), (-7, 7)), rise=(3, 7), size=0.5, name='ember')
    simple_clips(m, tr, fxo)
    return m

def sunburst(name, gold=GOLD, gem=(220, 20, 40)):
    """Throne halo: a vertical golden sunburst behind the head, turning slowly, with crimson gems."""
    m = BB(name, Atlas(256, 256)); k = Kit(m)
    c = [0, 6.0, 5.2]
    m.bone('sun', list(c))
    vdisc(m, 'sun', c, 8.0, k.glow('sun', P.magic_circle(112, gold, GOLD_L, GOLD_D, 'outer', seed=3)))
    vdisc(m, 'sun', [c[0], c[1], c[2] + 0.2], 5.6, k.glow('sun_i', P.magic_circle(96, gold, GOLD_L, GOLD_D, 'inner', seed=4)))
    rb = k.glow('ray', AA.gold(6, 16, {'gold': gold})[0]); gm = k.glow('gem', P.dot(gem, 4, core=(255, 150, 150)))
    for i in range(16):
        a = 2 * math.pi * i / 16; L = 2.6 if i % 2 else 4.2
        x, yy = math.cos(a) * (8.4 + L / 2), c[1] + math.sin(a) * (8.4 + L / 2)
        m.box('sun', [x - 0.3, yy - L / 2, c[2] - 0.2], [x + 0.3, yy + L / 2, c[2] + 0.2], rb, rb, origin=[x, yy, c[2]], rotation=[0, 0, math.degrees(a) - 90])
        if i % 4 == 0:
            gx, gy = math.cos(a) * 8.0, c[1] + math.sin(a) * 8.0
            m.box('sun', [gx - 0.7, gy - 0.7, c[2] - 0.5], [gx + 0.7, gy + 0.7, c[2] + 0.1], gm, gm, origin=[gx, gy, c[2]], rotation=[0, 0, 45])
    vdisc(m, 'sun', [c[0], c[1], c[2] + 0.6], 11.5, k.soft('b', P.soft(48, 48, gold, peak=70)))
    tr = {'sun': {'rotation': [(0, 0, 0, 'query.anim_time*12')], 'position': [(0, 0, 'math.sin(query.anim_time*90)*0.3', 0)]}}
    fxo = sparkles(m, k, GOLD_L, 8, ((-9, 9), (-2, 12), (5, 6)), rise=(1, 3), size=0.5)
    simple_clips(m, tr, fxo)
    return m

def crystal_orbit(name, col, n=6, y=10.5, r=9.0, tilt=(14, 0, 8), slot_down=False, fx='sparkles'):
    """Crystals circling the head (or the body for the orbit slot, which is authored Y-down)."""
    m = BB(name, Atlas(256, 128)); k = Kit(m)
    body = k.main('cb', P.facet(6, 24, P.shade(col, 1.2), P.shade(col, 0.65), hi=(255, 255, 255)))
    tip = k.main('ct', P.facet(6, 12, col, P.shade(col, 0.55))); gt = k.glow('cg', P.facet(6, 12, P.mixc(col, (255, 255, 255), 0.5), col))
    m.bone('tilt', [0, y, 0], rotation=tilt); m.bone('orbit', [0, y, 0], 'tilt')
    up = -1 if slot_down else 1
    for i in range(n):
        a = 2 * math.pi * i / n; x, z = math.cos(a) * r, math.sin(a) * r
        b = m.bone('c%d' % i, [x, y, z], 'orbit')
        h = 4.6 if i % 2 == 0 else 3.4
        crystal(m, b, [x, y - up * h * 0.25, z], h, 1.6, body, tip, gt, d=(0, up, 0), both=True)
    soft = k.soft('b', P.soft(32, 32, col, peak=90))
    for i in range(n):
        a = 2 * math.pi * i / n; x, z = math.cos(a) * r, math.sin(a) * r
        m.plate('c%d' % i, [x - 2.2, y - 2.2, z], [x + 2.2, y + 2.2, z + 0.02], soft)
    tr = {'orbit': {'rotation': [(0, 0, 'query.anim_time*50', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90)*0.6', 0)]}}
    for i in range(n): tr['c%d' % i] = {'rotation': [(0, 0, f'-query.anim_time*90+{i * 30}', 0)], 'position': [(0, 0, f'math.sin(query.anim_time*140+{i * 60})*0.7', 0)]}
    fxo = sparkles(m, k, P.mixc(col, (255, 255, 255), 0.5), 8, ((-r, r), (y - 2, y + 2), (-r, r)), rise=((-2, -0.5) if slot_down else (0.5, 2)), size=0.5) if fx else None
    simple_clips(m, tr, fxo)
    return m

# ================================================================== CROWNS (helmet)
def band(m, bone, y0, h, uv, side, s=4.45, t=0.6):
    for (f, to) in [([-s, y0, -s - t], [s, y0 + h, -s]), ([-s, y0, s], [s, y0 + h, s + t]), ([-s - t, y0, -s - t], [-s, y0 + h, s + t]), ([s, y0, -s - t], [s + t, y0 + h, s + t])]:
        m.box(bone, f, to, uv, side)

def around(s=4.45, n_side=3):
    """Points spread around a square band: (x, z, outward normal)."""
    out = []
    offs = [(-1 + 2 * (i + 0.5) / n_side) * s * 0.92 for i in range(n_side)]
    for o in offs: out.append((o, -s - 0.3, (0, -1)))
    for o in offs: out.append((s + 0.3, o, (1, 0)))
    for o in offs: out.append((-o, s + 0.3, (0, 1)))
    for o in offs: out.append((-s - 0.3, -o, (-1, 0)))
    return out

def crown(name, style, metal, light, dark, gem_cols, tall=1.0, fx=None, accent=None, points=2):
    """style: royal | demon | ice | shard | void."""
    m = BB(name, Atlas(256, 128)); k = Kit(m)
    met = k.main('met', AA.gold(8, 8, {'gold': metal})[0]); met_d = k.main('metd', AA.gold(8, 8, {'gold': dark})[0])
    gems = [k.glow('gem%d' % i, P.dot(g, 4, core=P.mixc(g, (255, 255, 255), 0.6))) for i, g in enumerate(gem_cols)]
    m.bone('crown', [0, 8, 0])
    y0 = 6.3
    band(m, 'crown', y0, 2.0, met, met_d)
    band(m, 'crown', y0 + 0.35, 0.35, met_d, met_d, s=4.5, t=0.75)            # engraved line
    pts = around(4.45, points)
    tr = {'crown': {'position': [(0, 0, 'math.sin(query.anim_time*90)*0.1', 0)]}}
    if style in ('ice', 'shard', 'void'):
        cc = gem_cols[0]
        body = k.main('cb', P.facet(6, 24, P.shade(cc, 1.25), P.shade(cc, 0.7), hi=(255, 255, 255)))
        tip = k.main('ct', P.facet(6, 12, cc, P.shade(cc, 0.6))); gt = k.glow('cg', P.facet(6, 12, P.mixc(cc, (255, 255, 255), 0.5), cc))
    for i, (x, z, nrm) in enumerate(pts):
        mid = (i % points == points // 2) if points % 2 else True
        h = (4.6 if mid else 3.0) * tall
        if style == 'royal':
            # tapered point with a pearl ball on top, gem at its base
            for st, (w, f0, f1) in enumerate([(1.6, 0, 0.45), (1.0, 0.45, 0.8), (0.55, 0.8, 1.0)]):
                m.box('crown', [x - w / 2, y0 + 2 + h * f0, z - w / 2], [x + w / 2, y0 + 2 + h * f1, z + w / 2], met, met_d, origin=[x, y0 + 2, z], rotation=[0, 45, 0])
            pearl = k.main('pearl', P.facet(4, 4, (255, 255, 255), (220, 220, 235)))
            m.box('crown', [x - 0.55, y0 + 2 + h, z - 0.55], [x + 0.55, y0 + 3.1 + h, z + 0.55], pearl, pearl)
        elif style == 'demon':
            lean = 14
            r = [-(nrm[1]) * lean, 0, nrm[0] * lean]
            for st, (w, f0, f1) in enumerate([(1.5, 0, 0.5), (0.95, 0.5, 0.82), (0.5, 0.82, 1.0)]):
                m.box('crown', [x - w / 2, y0 + 2 + h * 1.3 * f0, z - w / 2], [x + w / 2, y0 + 2 + h * 1.3 * f1, z + w / 2], gems[0] if st == 2 else met, met_d, origin=[x, y0 + 2, z], rotation=r)
        else:
            crystal(m, 'crown', [x, y0 + 1.6, z], h * (1.25 if style == 'ice' else 1.0), 1.4 if mid else 1.1, body, tip, gt, d=(nrm[0] * 0.25, 1, nrm[1] * 0.25))
        if True:   # gem set in the band under each point
            gx, gz = x + nrm[0] * 0.25, z + nrm[1] * 0.25
            g = gems[i % len(gems)]
            m.box('crown', [gx - 0.5, y0 + 0.55, gz - 0.5], [gx + 0.5, y0 + 1.55, gz + 0.5], g, g)
    if style == 'royal':   # velvet cap and a cross on top
        vel = k.main('vel', P.facet(4, 4, (200, 20, 40), (120, 0, 20)))
        m.box('crown', [-3.9, y0 + 1.8, -3.9], [3.9, y0 + 4.2, 3.9], vel, vel)
        m.box('crown', [-2.6, y0 + 4.2, -2.6], [2.6, y0 + 5.2, 2.6], vel, vel)
        m.box('crown', [-0.4, y0 + 5.2, -0.4], [0.4, y0 + 8.4, 0.4], met, met_d); m.box('crown', [-1.3, y0 + 6.9, -0.4], [1.3, y0 + 7.7, 0.4], met, met_d)
        m.box('crown', [-0.45, y0 + 7.0, -0.55], [0.45, y0 + 7.6, -0.4], gems[0], gems[0])
    if style == 'demon':   # back-swept horns
        for s in (1, -1):
            horn_path(m, k, 'crown', [(s * 4.0, y0 + 1.5, 1.5), (s * 6.0, y0 + 4, 3.5), (s * 6.5, y0 + 8, 6.5), (s * 5.5, y0 + 11, 8.0)], [1.6, 1.2, 0.8, 0.3], met, met_d, gems[0])
    if style in ('shard', 'void'):   # shards floating above, turning
        m.bone('float', [0, 13.5, 0], 'crown')
        for i in range(6):
            a = 2 * math.pi * i / 6; x, z = math.cos(a) * 5.5, math.sin(a) * 5.5
            crystal(m, 'float', [x, 12.5 + (i % 2) * 1.2, z], 3.0, 1.0, body, tip, gt, both=True)
        tr['float'] = {'rotation': [(0, 0, 'query.anim_time*35', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90)*0.7', 0)]}
    if style == 'void':   # a dark orb with a glowing core above the crown
        m.bone('orb', [0, 16.5, 0], 'crown')
        od = k.main('orbd', P.facet(4, 4, (40, 20, 60), (10, 0, 20))); og = k.glow('orbg', P.dot(accent or gem_cols[0], 4, core=(255, 255, 255)))
        m.box('orb', [-1.4, 15.1, -1.4], [1.4, 17.9, 1.4], od, od, rotation=[45, 45, 0], origin=[0, 16.5, 0])
        m.box('orb', [-0.6, 15.9, -1.75], [0.6, 17.1, 1.75], og, og)
        m.box('orb', [-1.75, 15.9, -0.6], [1.75, 17.1, 0.6], og, og)
        tr['orb'] = {'rotation': [(0, 0, 'query.anim_time*90', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*120)*0.6', 0)]}
    fxo = None
    if fx == 'sparkles': fxo = sparkles(m, k, GOLD_L, 6, ((-5, 5), (9, 12), (-5, 5)), rise=(1, 3), size=0.45)
    elif fx == 'embers': fxo = sparkles(m, k, (255, 90, 40), 8, ((-5, 5), (10, 14), (-5, 5)), rise=(3, 6), size=0.5, name='ember')
    elif fx == 'snow': fxo = sparkles(m, k, (240, 250, 255), 8, ((-6, 6), (12, 14), (-6, 6)), rise=(-6, -4), size=0.45, name='snow')
    elif fx == 'void': fxo = sparkles(m, k, accent or gem_cols[0], 8, ((-6, 6), (10, 16), (-6, 6)), rise=(1, 3), size=0.5, name='vstar')
    simple_clips(m, tr, fxo)
    return m

def horn_path(m, k, bone, ctrl, widths, uv, side, gtip=None, n=12, cracks=None):
    """A smooth horn through control points (Catmull-Rom), tapering by `widths`; ridges every other segment."""
    pts = []
    for i in range(n + 1):
        t = i / n * (len(ctrl) - 1); j = min(int(t), len(ctrl) - 2); f = t - j
        p0 = ctrl[max(0, j - 1)]; p1 = ctrl[j]; p2 = ctrl[j + 1]; p3 = ctrl[min(len(ctrl) - 1, j + 2)]
        pt = [0.5 * ((2 * p1[a]) + (-p0[a] + p2[a]) * f + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * f * f + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * f ** 3) for a in range(3)]
        wt = i / n * (len(widths) - 1); wj = min(int(wt), len(widths) - 2); w = widths[wj] + (widths[wj + 1] - widths[wj]) * (wt - wj)
        pts.append((pt, w))
    for i in range(n):
        (a, wa), (b, wb) = pts[i], pts[i + 1]
        d = [b[q] - a[q] for q in range(3)]; L = math.sqrt(sum(v * v for v in d)) * 1.15
        w = (wa + wb) / 2
        uvx = gtip if (gtip is not None and i >= n - 2) else (cracks if (cracks is not None and i % 3 == 1) else (uv if i % 2 == 0 else side))
        m.box(bone, [a[0] - w / 2, a[1], a[2] - w / 2], [a[0] + w / 2, a[1] + L, a[2] + w / 2], uvx, uvx, origin=list(a), rotation=rot_to(d))

def horns(name, kind, base, tip, glow=None, fx=None):
    """kind: demon (big, out-up-back with lava cracks) | oni (two straight horns on the forehead) | ram (spiral curls)."""
    m = BB(name, Atlas(256, 64)); k = Kit(m)
    a = k.main('h0', P.facet(4, 8, P.shade(base, 1.2), P.mixc(base, tip, 0.3))); b = k.main('h1', P.facet(4, 8, P.shade(base, 1.1), P.mixc(base, tip, 0.35)))
    g = k.glow('tip', P.facet(4, 8, glow, P.shade(glow, 0.7))) if glow else k.main('tipm', P.facet(4, 8, tip, P.shade(tip, 0.8)))
    cr = k.glow('crack', P.facet(4, 8, glow, P.shade(glow, 0.6))) if glow else None
    m.bone('horns', [0, 7, 0])
    for s in (1, -1):
        if kind == 'demon':
            ctrl = [(s * 3.0, 7.0, 0.5), (s * 6.0, 9.0, 1.5), (s * 7.6, 12.0, 3.2), (s * 7.2, 15.0, 4.0), (s * 5.8, 17.0, 2.6)]
            horn_path(m, k, 'horns', ctrl, [2.4, 2.0, 1.4, 0.8, 0.3], a, b, g, n=16)
        elif kind == 'oni':
            ctrl = [(s * 2.2, 7.6, -2.6), (s * 2.6, 10.0, -3.4), (s * 3.0, 12.5, -3.6), (s * 3.2, 14.2, -3.2)]
            horn_path(m, k, 'horns', ctrl, [1.6, 1.2, 0.7, 0.2], a, b, g, n=10)
            gr = k.main('goldring', P.facet(4, 4, GOLD_L, GOLD))
            m.box('horns', [s * 2.2 - 0.95, 8.2, -2.6 - 0.95], [s * 2.2 + 0.95, 8.8, -2.6 + 0.95], gr, gr)
        else:
            ctrl = [(s * 3.2, 7.0, 0.0), (s * 5.5, 9.0, 1.0), (s * 7.0, 7.0, 2.5), (s * 6.0, 4.0, 1.5), (s * 5.0, 3.0, -1.0), (s * 6.0, 4.5, -2.5), (s * 7.2, 6.0, -1.5)]
            horn_path(m, k, 'horns', ctrl, [2.2, 2.0, 1.7, 1.4, 1.1, 0.8, 0.4], a, b, g, n=20)
    tr = {'horns': {'position': [(0, 0, 'math.sin(query.anim_time*90)*0.05', 0)]}}
    fxo = None
    if fx == 'embers': fxo = sparkles(m, k, (255, 110, 40), 8, ((-9, 9), (14, 19), (0, 4)), rise=(3, 6), size=0.45, name='ember')
    simple_clips(m, tr, fxo)
    return m

def circlet(name, metal=GOLD, dark=(25, 15, 20), gem=(220, 20, 40)):
    """Thin dark band with glowing crimson runes, a gold rim, a teardrop gem over the brow and rune glyphs orbiting."""
    m = BB(name, Atlas(256, 64)); k = Kit(m)
    met = k.main('met', AA.gold(8, 8, {'gold': metal})[0]); dk = k.main('dk', P.solid(dark))
    gl = k.glow('rune', P.facet(4, 4, P.mixc(gem, (255, 255, 255), 0.3), gem))
    m.bone('c', [0, 5.5, 0])
    band(m, 'c', 5.0, 1.3, dk, dk, s=4.3, t=0.45)
    band(m, 'c', 6.2, 0.25, met, met, s=4.3, t=0.55); band(m, 'c', 4.8, 0.25, met, met, s=4.3, t=0.55)
    for i, (x, z, nrm) in enumerate(around(4.3, 4)):
        gx, gz = x + nrm[0] * 0.1, z + nrm[1] * 0.1
        h = 0.7 if i % 2 else 0.45
        m.box('c', [gx - 0.25, 5.65 - h / 2, gz - 0.25], [gx + 0.25, 5.65 + h / 2, gz + 0.25], gl, gl)
    body = k.main('cb', P.facet(6, 24, P.shade(gem, 1.3), P.shade(gem, 0.7), hi=(255, 255, 255))); tip = k.main('ct', P.facet(6, 12, gem, P.shade(gem, 0.6)))
    gt = k.glow('cg', P.facet(6, 12, P.mixc(gem, (255, 255, 255), 0.5), gem))
    crystal(m, 'c', [0, 5.6, -4.95], 3.2, 1.3, body, tip, gt, both=True)
    m.bone('runes', [0, 6, 0], 'c')
    for i in range(3):
        a = 2 * math.pi * i / 3; x, z = math.cos(a) * 6.5, math.sin(a) * 6.5
        m.box('runes', [x - 0.5, 5.2, z - 0.1], [x + 0.5, 6.8, z + 0.1], gl, gl, origin=[x, 6, z], rotation=[0, -math.degrees(a) + 90, 0])
        m.box('runes', [x - 0.9, 6.3, z - 0.1], [x + 0.9, 6.6, z + 0.1], gl, gl, origin=[x, 6, z], rotation=[0, -math.degrees(a) + 90, 0])
    tr = {'runes': {'rotation': [(0, 0, 'query.anim_time*60', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*120)*0.4', 0)]}}
    simple_clips(m, tr, None)
    return m
