# OVERTHRONE cosmetic designs (v3) for Manas Cosmetics. Each function builds one .bbmodel.
# Authoring frames, matching how the mod places each slot (see sim.py, from the mod's code):
#   back       : Y up, -Z = away from the player's back. The whole model sits below y=0 so the mod flips it upright
#                (it flips back models whose average cube height is < 0) and then centres it on the upper back.
#   helmet     : Y up, the head is x/z -4..4, y 0..8, -Z = the face.
#   above_head : same frame as helmet (things must be authored above y=8 themselves).
#   orbit      : Y DOWN (the mod doesn't flip it), origin = 8 px below the neck.
#   pet        : Y up from the pet's feet (y=0), -Z = the pet's front.
# Animations: the mod plays the clip named for the state (idle / walk / fly ...); keyframes use Molang
# (math.sin in degrees, query.anim_time in seconds). Loop lengths are multiples of every period used, so loops are seamless.
import math
from bb import BB, Atlas, feather_sprite, crystal_sprite, blade_sprite, leaf_sprite, ring_sprite, runes_sprite, lerp, shade

def seg(m, bone, A, B, th, uv, uv_side=None):
    """A cube from point A to point B (in the XY plane, z = average), thickness th."""
    cx, cy, cz = [(A[i] + B[i]) / 2 for i in range(3)]
    L = math.hypot(B[0] - A[0], B[1] - A[1]); ang = math.degrees(math.atan2(B[1] - A[1], B[0] - A[0]))
    return m.box(bone, [cx - L / 2, cy - th / 2, cz - th / 2], [cx + L / 2, cy + th / 2, cz + th / 2], uv, uv_side, origin=[cx, cy, cz], rotation=[0, 0, ang])

def hang(m, bone, R, L, w, th, ang, uv, uv_side=None, tilt=0):
    """A feather/blade hanging DOWN from root R, swung outwards by ang degrees (+ = towards +X)."""
    return m.box(bone, [R[0] - w / 2, R[1] - L, R[2] - th / 2], [R[0] + w / 2, R[1], R[2] + th / 2], uv, uv_side, origin=list(R), rotation=[tilt, 0, ang])

def mirror_side(v, s): return [v[0] * s, v[1], v[2]]

# =========================================================================================== WINGS (back)
FLAP = 150   # degrees per second -> 2.4 s per flap
def wing_anim(m, amp=16, sweep=20, lift=7, fore=12, extra=None):
    tr = {}
    for s, n in ((1, 'r'), (-1, 'l')):
        tr['wing_' + n] = {'rotation': [(0, 0, f'{s}*({sweep}+math.sin(query.anim_time*{FLAP})*{amp})', f'{s}*({lift}+math.sin(query.anim_time*{FLAP}+60)*{lift})')]}
        tr['fore_' + n] = {'rotation': [(0, 0, f'{s}*math.sin(query.anim_time*{FLAP}-40)*6', f'{s}*math.sin(query.anim_time*{FLAP}-30)*{fore}')]}
    if extra: tr.update(extra)
    m.anim('idle', 4.8, tr)

def build_wing(name, style, P):
    """P: palette dict. style: feather | demon | crystal | galaxy | shatter | mech | goldmech | leaf | bone | phoenix"""
    at = Atlas(256, 128); m = BB(name, at)
    Y0 = -16                                    # keep the whole model below y=0 (so the mod flips it upright)
    S, E, W = (1.5, Y0, -0.8), (9.0, Y0 + 9, -1.8), (20.0, Y0 + 16, -3.0)
    arm_uv = at.solid(P['arm']); arm_side = at.solid(shade(P['arm'], 0.7))
    if style in ('crystal', 'galaxy', 'frost'):
        spr = [at.add(crystal_sprite(P['core'], P['edge'], 6, 24, stars=(style == 'galaxy'))), at.add(crystal_sprite(shade(P['core'], 0.8), P['edge'], 6, 18, stars=(style == 'galaxy')))]
    elif style in ('mech', 'goldmech', 'shatter'):
        spr = [at.add(blade_sprite(P['dark'], P['glow'], 6, 28)), at.add(blade_sprite(shade(P['dark'], 1.3), P['glow'], 6, 22))]
    elif style == 'leaf':
        spr = [at.add(leaf_sprite(P['leaf'], P['vein'])), at.add(leaf_sprite(shade(P['leaf'], 1.2), P['vein']))]
    else:
        jag = style in ('demon', 'bone')
        spr = [at.add(feather_sprite(P['root'], P['tip'], P['edge'], P.get('shaft'), 6, 28, jag=jag)),
               at.add(feather_sprite(lerp(P['root'], P['tip'], 0.2), P['tip'], P['edge'], P.get('shaft'), 6, 22, jag=jag)),
               at.add(feather_sprite(lerp(P['root'], (255, 255, 255), 0.15), lerp(P['root'], P['tip'], 0.5), P['edge'], None, 6, 14))]
    side_uv = at.solid(P.get('edge', P.get('glow', (255, 255, 255))))
    accent = at.solid(P.get('accent', P.get('glow', P.get('edge', (255, 255, 255)))))
    for s, n in ((1, 'r'), (-1, 'l')):
        wb = m.bone('wing_' + n, mirror_side(S, s)); fb = m.bone('fore_' + n, mirror_side(E, s), 'wing_' + n)
        A, B, C = mirror_side(S, s), mirror_side(E, s), mirror_side(W, s)
        if style not in ('mech', 'goldmech'):
            seg(m, wb, A, B, 1.7, arm_uv, arm_side); seg(m, fb, B, C, 1.3, arm_uv, arm_side)
        if style in ('demon', 'bone', 'goldmech'):   # claw at the elbow
            hang(m, fb, list(B), 2.8, 0.9, 0.9, 180 - s * 20, accent)          # points up out of the elbow
        if style in ('mech', 'goldmech'):
            # radial blades from a glowing core at the elbow (art 9 / 20)
            m.box(wb, [B[0] - 1.6, B[1] - 1.6, B[2] - 1.0], [B[0] + 1.6, B[1] + 1.6, B[2] + 1.0], accent)
            seg(m, wb, A, B, 2.0, arm_uv, arm_side)
            for i in range(8):   # blades radiating out and UP from the core, longest in the middle (art 9 / 20)
                t = i / 7; ang = 55 + 120 * t; L = 22 - abs(t - 0.5) * 14
                hang(m, fb, [B[0], B[1], B[2] - 0.2 * i], L, 2.4, 0.8, s * ang, spr[i % 2], side_uv)
            continue
        # secondaries (inner, from the arm), primaries (outer, from the forearm), coverts (short, on top)
        z = lambda R, dz: [R[0], R[1], R[2] + dz]
        n_sec, n_pri = (7, 10) if style != 'leaf' else (9, 12)
        for i in range(n_sec):
            t = (i + 0.5) / n_sec; R = [A[k] + (B[k] - A[k]) * t for k in range(3)]
            if (style == 'shatter' or P.get('tatter')) and i % 3 == 1: continue
            hang(m, wb, z(R, -0.1 - 0.05 * i), (12 + 5 * t) * P.get('len', 1.0), 3.0, 0.6, s * (2 + 12 * t), spr[1 if len(spr) > 1 else 0], side_uv)
        for i in range(n_pri):
            t = (i + 0.5) / n_pri; R = [B[k] + (C[k] - B[k]) * t for k in range(3)]
            if (style == 'shatter' or P.get('tatter')) and i % 3 == 2: continue
            hang(m, fb, z(R, 0.15 + 0.05 * i), (16 + 11 * t) * P.get('len', 1.0), 2.8, 0.6, s * (14 + 50 * t), spr[0], side_uv)
        if style in ('feather', 'demon', 'phoenix', 'bone', 'galaxy', 'crystal', 'frost'):
            for i in range(13):
                t = (i + 0.5) / 13; R = [A[k] + (C[k] - A[k]) * t for k in range(3)]
                hang(m, wb if t < 0.42 else fb, z(R, -0.6), 6 + 4 * t, 3.0, 0.7, s * (6 + 34 * t), spr[-1], side_uv)
        if P.get('plates'):   # armour plates over the arm: black with a gold rim (OVERTHRONE look)
            pl = at.add(feather_sprite(P['plates'][0], shade(P['plates'][0], 0.8), P['plates'][1], None, 6, 12))
            for i in range(9):
                t = (i + 0.5) / 9; R = [A[k] + (C[k] - A[k]) * t for k in range(3)]
                hang(m, wb if t < 0.42 else fb, z(R, -0.95), 4.5 + 2 * t, 3.4, 0.9, s * (4 + 30 * t), pl, at.solid(P['plates'][1]))
        if style == 'leaf':   # flowers on the vine
            for i in range(4):
                t = 0.15 + 0.25 * i; R = [A[k] + (C[k] - A[k]) * t for k in range(3)]
                m.box(fb if t > 0.45 else wb, [R[0] - 0.9, R[1] - 0.9, R[2] - 1.3], [R[0] + 0.9, R[1] + 0.9, R[2] - 0.7], accent)
    extra = None
    if style in ('crystal', 'galaxy', 'frost', 'shatter'):
        # floating shards around the wings, slowly bobbing (art 3, 4, 6, 7)
        m.bone('shards', [0, Y0, -2])
        for i in range(10):
            a = i * 36; r = 14 + (i % 3) * 5; x, y = math.cos(math.radians(a)) * r, Y0 + math.sin(math.radians(a)) * r * 0.8
            sz = 0.6 + (i % 3) * 0.35
            m.box('shards', [x - sz / 2, y - sz, -3 - sz / 2], [x + sz / 2, y + sz, -3 + sz / 2], spr[0], side_uv, rotation=[0, 45, 20 * i])
        extra = {'shards': {'position': [(0, 0, 'math.sin(query.anim_time*75)*1.2', 0)]}}
    if P.get('halo'):   # a halo floating above the head (placed by place_back_halo once the wing's size is known)
        hu = at.solid(P['halo']); hs = at.solid(shade(P['halo'], 0.7))
        m.bone('halo', [0, 0, 2])
        ring(m, 'halo', 0, 5.0, 24, hu); ring(m, 'halo', 0, 5.0, 12, hs, size=(0.6, 0.9, 0.9))
        extra = dict(extra or {}); extra['halo'] = {'rotation': [(0, 0, 'query.anim_time*45', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90)*0.5', 0)]}
    wing_anim(m, amp=12 if style in ('mech', 'goldmech') else 16, extra=extra)
    if P.get('halo'): place_back_halo(m)
    return m

def place_back_halo(m):
    """Moves the 'halo' bone so it floats ~3 px above the head. The mod centres back models on their height
    (lift = -4 - centre y, see sim.slot_matrix), so the halo's spot depends on the whole model: iterate."""
    import sim
    hal = [e for e in m.elements if e['uuid'] in m.bones['halo']['children']]
    for _ in range(6):
        mod = sim.Model(m.to_dict()); a = mod.rest_aabb(); lift = -4 - (a[1] + a[4]) / 2
        want_y = 11 - lift                      # model y = -(y + lift) -> 11 px above the neck (3 above the head)
        cy = sum((e['from'][1] + e['to'][1]) / 2 for e in hal) / len(hal); dy = want_y - cy
        if abs(dy) < 0.05: break
        for e in hal:
            for k in ('from', 'to', 'origin'): e[k][1] = round(e[k][1] + dy, 4)
        m.bones['halo']['origin'][1] = round(m.bones['halo']['origin'][1] + dy, 4)

WINGS = {
    'demon_lord_wings': ('Demon Lord Wings', 'demon', dict(root=(120, 10, 20), tip=(25, 0, 5), edge=(255, 200, 70), shaft=(70, 0, 10), arm=(30, 10, 10), accent=(255, 190, 60))),
    'seraph_wings': ('Seraph Wings', 'feather', dict(root=(255, 252, 240), tip=(235, 230, 215), edge=(255, 210, 110), arm=(255, 205, 90))),
    'dragon_wings': ('Aqua Spirit Wings', 'feather', dict(root=(120, 255, 255), tip=(20, 170, 210), edge=(220, 255, 255), arm=(80, 220, 240))),
    'shadow_monarch_wings': ('Shattered Monarch Wings', 'shatter', dict(dark=(20, 8, 12), glow=(230, 30, 40), arm=(25, 10, 15), edge=(200, 20, 30), accent=(255, 60, 60))),
    'archangel_wings': ('Archangel Wings', 'feather', dict(root=(255, 240, 190), tip=(240, 190, 70), edge=(255, 255, 230), arm=(255, 215, 90), len=1.1)),
    'galaxy_wings': ('Galaxy Wings', 'galaxy', dict(core=(170, 80, 255), edge=(60, 10, 120), arm=(80, 30, 140))),
    'frost_wings': ('Frost Crystal Wings', 'frost', dict(core=(220, 245, 255), edge=(80, 150, 230), arm=(150, 200, 240))),
    'nature_wings': ('Nature Wings', 'leaf', dict(leaf=(70, 170, 50), vein=(40, 110, 30), arm=(100, 70, 40), accent=(255, 250, 230))),
    'mech_wings': ('Mech Wings', 'mech', dict(dark=(25, 25, 30), glow=(255, 40, 40), arm=(45, 45, 52), accent=(255, 30, 30), edge=(255, 60, 60))),
    'bone_wings': ('Bone Demon Wings', 'bone', dict(root=(170, 20, 25), tip=(70, 0, 5), edge=(240, 225, 200), shaft=(240, 225, 200), arm=(235, 225, 205), accent=(240, 225, 200))),
    'golden_demon_wings': ('Golden Demon Wings', 'goldmech', dict(dark=(30, 25, 20), glow=(255, 200, 60), arm=(200, 150, 40), accent=(230, 20, 40), edge=(255, 210, 90))),
    'phoenix_wings': ('Phoenix Wings', 'phoenix', dict(root=(255, 220, 80), tip=(220, 40, 10), edge=(255, 250, 200), arm=(255, 160, 40))),
    'void_wings': ('Void Wings', 'demon', dict(root=(60, 20, 90), tip=(5, 0, 15), edge=(230, 90, 255), arm=(25, 10, 40), accent=(230, 90, 255))),
}

# =========================================================================================== KITSUNE TAILS (back)
def kitsune_tails(name, base=(120, 190, 255), tip=(240, 250, 255), flame=None):
    at = Atlas(64, 64); m = BB(name, at)
    Y0 = -10
    segs = [at.solid(lerp(base, tip, k / 4)) for k in range(5)]
    if flame: segs[-1] = at.solid(flame); segs[-2] = at.solid(lerp(tip, flame, 0.5))
    m.bone('tails', [0, Y0, -1])
    for i in range(9):
        a = -72 + i * 18   # fan from -72 to +72 degrees
        prev = 'tails'; R = [0, Y0, -1.5 - (i % 2) * 0.6]
        for k in range(5):
            bn = f't{i}_{k}'
            m.bone(bn, list(R), prev, rotation=(0, 0, 0))
            L = 4.6; w = [2.6, 3.6, 4.1, 3.6, 2.4][k]
            ang = -a * (1 + 0.12 * k)          # each segment curls a little further out
            m.box(bn, [R[0] - w / 2, R[1], R[2] - w / 2], [R[0] + w / 2, R[1] + L, R[2] + w / 2], segs[k], origin=list(R), rotation=[0, 0, ang])
            dx = -math.sin(math.radians(ang)) * L; dy = math.cos(math.radians(ang)) * L
            R = [R[0] + dx, R[1] + dy, R[2]]; prev = bn
    tr = {}
    for i in range(9):
        for k in range(1, 5):
            tr[f't{i}_{k}'] = {'rotation': [(0, f'math.sin(query.anim_time*90+{i * 40 + k * 25})*6', 0, f'math.sin(query.anim_time*90+{i * 40 + k * 25})*{6 + k * 2}')]}
    m.anim('idle', 4.0, tr)
    return m

# =========================================================================================== HALOS / ABOVE HEAD
def ring(m, bone, y, r, n, uv, size=(1.3, 0.7, 0.7), tilt=0, skip=()):
    for i in range(n):
        if i in skip: continue
        a = 360 * i / n; x, z = math.cos(math.radians(a)) * r, math.sin(math.radians(a)) * r
        m.box(bone, [x - size[0] / 2, y - size[1] / 2, z - size[2] / 2], [x + size[0] / 2, y + size[1] / 2, z + size[2] / 2], uv, origin=[x, y, z], rotation=[tilt, -a + 90, 0])

def crystal_at(m, bone, x, y, z, h, w, uv, side):
    m.box(bone, [x - w / 2, y - h / 2, z - w / 2], [x + w / 2, y + h / 2, z + w / 2], uv, side, origin=[x, y, z], rotation=[0, 45, 0])
    m.box(bone, [x - w / 4, y + h / 2, z - w / 4], [x + w / 4, y + h / 2 + w * 0.6, z + w / 4], uv, side, origin=[x, y, z], rotation=[0, 45, 0])
    m.box(bone, [x - w / 4, y - h / 2 - w * 0.6, z - w / 4], [x + w / 4, y - h / 2, z + w / 4], uv, side, origin=[x, y, z], rotation=[0, 45, 0])

def halo(name, inner, outer, broken=False, crystals=None, double=False, gems=None):
    at = Atlas(128, 64); m = BB(name, at)
    glow = at.add(ring_sprite(inner, outer, 32, cut=[(20, 50), (200, 225)] if broken else None))
    seg_uv = at.solid(outer); seg2 = at.solid(inner)
    m.bone('halo', [0, 11.5, 0])
    m.flat('halo', [-7, 11.5, -7], [7, 11.5, 7], glow)
    ring(m, 'halo', 11.5, 5.6, 26, seg_uv, skip=(3, 4, 15) if broken else ())
    ring(m, 'halo', 11.5, 5.6, 13, seg2, size=(0.6, 0.9, 0.9))
    tr = {'halo': {'rotation': [(0, 0, 'query.anim_time*45', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90)*0.5', 0)]}}
    if double:
        m.bone('halo2', [0, 14, 0])
        ring(m, 'halo2', 14, 7.2, 30, seg2, tilt=0)
        m.flat('halo2', [-9, 14, -9], [9, 14, 9], at.add(ring_sprite(outer, inner, 32)))
        tr['halo2'] = {'rotation': [(0, 'math.sin(query.anim_time*45)*8', '-query.anim_time*30', 0)]}
    if gems or crystals:
        cu = at.solid(crystals[0] if crystals else gems); cs = at.solid(shade(crystals[0] if crystals else gems, 0.65))
        m.bone('gems', [0, 12, 0])
        for i in range(4):
            a = math.radians(i * 90 + 45); crystal_at(m, 'gems', math.cos(a) * 9, 12, math.sin(a) * 9, 3.2 if crystals else 1.6, 1.4 if crystals else 1.0, cu, cs)
        if crystals: crystal_at(m, 'gems', 0, 17.5, 0, 4.5, 1.8, cu, cs)
        tr['gems'] = {'rotation': [(0, 0, '-query.anim_time*25', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90+90)*0.8', 0)]}
    m.anim('idle', 8.0, tr)
    return m

def crystal_ring(name, col):
    at = Atlas(64, 64); m = BB(name, at); cu = at.solid(col); cs = at.solid(shade(col, 0.6)); dark = at.solid((30, 10, 15))
    m.bone('ring', [0, 4, 0])
    ring(m, 'ring', 4, 8.5, 32, dark, size=(1.7, 0.3, 0.3))
    for i in range(6):
        a = math.radians(i * 60); crystal_at(m, 'ring', math.cos(a) * 8.5, 4 + (i % 2) * 1.5, math.sin(a) * 8.5, 3.2, 1.3, cu, cs)
    m.anim('idle', 8.0, {'ring': {'rotation': [(0, 0, 'query.anim_time*45', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90)*0.6', 0)]}})
    return m

def sigil(name, col):
    at = Atlas(64, 64); m = BB(name, at); uv = at.add(runes_sprite(col, 64))
    m.bone('sigil', [0, 13, 0]); m.flat('sigil', [-8, 13, -8], [8, 13, 8], uv)
    m.anim('idle', 8.0, {'sigil': {'rotation': [(0, 0, '-query.anim_time*45', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90)*0.5', 0)]}})
    return m

# =========================================================================================== CROWNS / HORNS (helmet)
def crown(name, metal, light, gems, tall=1.0, shard=False, float_shards=False):
    at = Atlas(64, 32); m = BB(name, at)
    band = at.solid(metal); band_l = at.solid(light); dark = at.solid(shade(metal, 0.6)); gem_uv = [at.solid(g) for g in gems]
    m.bone('crown', [0, 8, 0])
    s, y0 = 4.4, 7.2
    for (f, t) in [([-s, y0, -s - 0.7], [s, y0 + 1.8, -s]), ([-s, y0, s], [s, y0 + 1.8, s + 0.7]), ([-s - 0.7, y0, -s - 0.7], [-s, y0 + 1.8, s + 0.7]), ([s, y0, -s - 0.7], [s + 0.7, y0 + 1.8, s + 0.7])]:
        m.box('crown', f, t, band, dark, uv_top=band_l)
    k = 0
    for side in range(4):
        for j, off in enumerate((-2.9, 0, 2.9)):
            h = (3.0 if j == 1 else 2.0) * tall
            pos = {0: (off, -s - 0.35), 1: (off, s + 0.35), 2: (-s - 0.35, off), 3: (s + 0.35, off)}[side]
            if shard:
                crystal_at(m, 'crown', pos[0], y0 + 1.8 + h / 2, pos[1], h, 1.2, gem_uv[k % len(gem_uv)], dark)
            else:
                for st in range(3):
                    w = 1.4 - st * 0.45; yb = y0 + 1.8 + st * h / 3
                    m.box('crown', [pos[0] - w / 2, yb, pos[1] - w / 2], [pos[0] + w / 2, yb + h / 3, pos[1] + w / 2], band_l if st == 2 else band, dark)
            g = gem_uv[k % len(gem_uv)]; k += 1
            gp = {0: (off, -s - 0.95), 1: (off, s + 0.95), 2: (-s - 0.95, off), 3: (s + 0.95, off)}[side]
            m.box('crown', [gp[0] - 0.45, y0 + 0.45, gp[1] - 0.45], [gp[0] + 0.45, y0 + 1.35, gp[1] + 0.45], g)
    tr = {'crown': {'position': [(0, 0, 'math.sin(query.anim_time*90)*0.12', 0)]}}
    if float_shards:
        m.bone('shards', [0, 13, 0])
        for i in range(6):
            a = math.radians(i * 60 + 30); crystal_at(m, 'shards', math.cos(a) * 6.5, 13 + (i % 2) * 1.5, math.sin(a) * 6.5, 2.2, 0.9, gem_uv[i % len(gem_uv)], dark)
        tr['shards'] = {'rotation': [(0, 0, 'query.anim_time*30', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90)*0.7', 0)]}
    m.anim('idle', 4.0, tr)
    return m

def horns(name, base, tip, glow=None, path='demon', scale=1.0):
    at = Atlas(64, 16); m = BB(name, at)
    cols = [at.solid(lerp(base, tip, k / 13)) for k in range(14)]
    ridge = [at.solid(shade(lerp(base, tip, k / 13), 0.75)) for k in range(14)]
    gl = at.solid(glow) if glow else None
    for s in (1, -1):
        bn = m.bone('horn_' + ('r' if s > 0 else 'l'), [s * 2.6, 7.6, 0])
        pts = []
        n = 14
        for i in range(n):
            t = i / (n - 1)
            if path == 'demon':     # out, up, then curling forward (art 14)
                x = 2.6 + 6.0 * math.sin(t * 1.5) * scale; y = 7.6 + 9.0 * t * scale; z = -0.2 - 3.5 * t * t * scale
            elif path == 'oni':
                x = 2.0 + 0.8 * t; y = 7.6 + 5.5 * t; z = 0.2 * t
            else:                   # ram: curl down around the ear
                a = math.radians(i * 26); r = 3.2 - i * 0.14
                x = 4.6 + math.cos(a) * r * 0.25 + 0.4; y = 8.6 + math.sin(a) * r; z = -0.4 + math.cos(a) * r
            sz = (2.2 - 1.7 * t) * (scale if path == 'demon' else 1)
            pts.append((s * x, y, z, sz))
        for i, (x, y, z, sz) in enumerate(pts):
            nx = pts[min(i + 1, n - 1)]; pv = pts[max(i - 1, 0)]
            ang = math.degrees(math.atan2((nx[0] - pv[0]), (nx[1] - pv[1])))
            uv = gl if (gl and i >= n - 2) else (ridge[i] if i % 2 else cols[i])
            m.box(bn, [x - sz / 2, y - sz * 0.65, z - sz / 2], [x + sz / 2, y + sz * 0.65, z + sz / 2], uv, origin=[x, y, z], rotation=[0, 0, -ang])
    return m

def circlet(name, metal=(220, 170, 50), dark=(25, 15, 20), gem=(220, 20, 40)):
    """A thin gold-and-black band across the forehead with crimson rune stones and a teardrop crystal on the front."""
    at = Atlas(64, 16); m = BB(name, at)
    M, Dk, G, Gl = at.solid(metal), at.solid(dark), at.solid(gem), at.solid(lerp(gem, (255, 255, 255), 0.4))
    m.bone('circlet', [0, 5.5, 0])
    s, y0, y1 = 4.25, 5.0, 6.2
    for (f, t) in [([-s, y0, -s - 0.35], [s, y1, -s]), ([-s, y0, s], [s, y1, s + 0.35]), ([-s - 0.35, y0, -s - 0.35], [-s, y1, s + 0.35]), ([s, y0, -s - 0.35], [s + 0.35, y1, s + 0.35])]:
        m.box('circlet', f, t, M, Dk)
    for (f, t) in [([-s, y0 + 0.4, -s - 0.45], [s, y0 + 0.8, -s - 0.35]), ([-s, y0 + 0.4, s + 0.35], [s, y0 + 0.8, s + 0.45])]:
        m.box('circlet', f, t, Dk)
    for x in (-3, -1.5, 1.5, 3):   # rune stones on the front band
        m.box('circlet', [x - 0.35, y0 + 0.25, -s - 0.6], [x + 0.35, y1 - 0.25, -s - 0.35], G)
    crystal_at(m, 'circlet', 0, y1 + 0.4, -s - 0.75, 2.6, 1.1, Gl, G)   # centre crystal over the brow
    m.anim('idle', 4.0, {'circlet': {'position': [(0, 0, 'math.sin(query.anim_time*90)*0.05', 0)]}})
    return m

def throne_halo(name, gold=(255, 205, 70), light=(255, 245, 190), gem=(220, 20, 40)):
    """A gold halo crowned with small spikes and crimson gems, turning slowly above the head."""
    at = Atlas(64, 32); m = BB(name, at)
    G, L, R, Dk = at.solid(gold), at.solid(light), at.solid(gem), at.solid(shade(gold, 0.65))
    glow = at.add(ring_sprite(light, gold, 32))
    m.bone('halo', [0, 12, 0])
    m.flat('halo', [-7.5, 12, -7.5], [7.5, 12, 7.5], glow)
    ring(m, 'halo', 12, 6.0, 28, G); ring(m, 'halo', 12, 6.0, 14, L, size=(0.6, 0.95, 0.95))
    for i in range(8):
        a = math.radians(i * 45); x, z = math.cos(a) * 6.0, math.sin(a) * 6.0
        h = 2.6 if i % 2 == 0 else 1.6
        m.box('halo', [x - 0.35, 12.3, z - 0.35], [x + 0.35, 12.3 + h, z + 0.35], L, Dk, origin=[x, 12.3, z], rotation=[0, 45, 0])
        if i % 2 == 0: m.box('halo', [x - 0.45, 12.4, z - 0.45], [x + 0.45, 13.3, z + 0.45], R, origin=[x, 12.4, z], rotation=[0, 45, 0])
    m.anim('idle', 8.0, {'halo': {'rotation': [(0, 0, 'query.anim_time*45', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90)*0.5', 0)]}})
    return m

def crystal_orbit(name, col=(235, 30, 55)):
    """Five large crimson crystals circling the head on a tilted path."""
    at = Atlas(32, 16); m = BB(name, at); cu = at.solid(col); cs = at.solid(shade(col, 0.6)); hi = at.solid(lerp(col, (255, 255, 255), 0.5))
    m.bone('tilt', [0, 11, 0], rotation=(14, 0, 8))
    m.bone('orbit', [0, 11, 0], 'tilt')
    for i in range(5):
        a = math.radians(i * 72); crystal_at(m, 'orbit', math.cos(a) * 9.5, 11, math.sin(a) * 9.5, 4.2, 1.7, cu if i % 2 else hi, cs)
    m.anim('idle', 8.0, {'orbit': {'rotation': [(0, 0, 'query.anim_time*45', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90)*0.6', 0)]}})
    return m

# =========================================================================================== ORBIT (Y down!)
def soul_crystals(name, col=(190, 120, 255)):
    at = Atlas(32, 16); m = BB(name, at); cu = at.solid(col); cs = at.solid(shade(col, 0.6))
    m.bone('orbit', [0, -5, 0])
    for i in range(3):
        a = math.radians(i * 120); crystal_at(m, 'orbit', math.cos(a) * 11, -5, math.sin(a) * 11, 3.6, 1.6, cu, cs)
    m.anim('idle', 8.0, {'orbit': {'rotation': [(0, 0, 'query.anim_time*45', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90)*1.2', 0)]}})
    return m

# =========================================================================================== PETS (Y up from the feet, -Z = front)
def eyes(m, bone, at, x0, y, z, gap=1.4, size=1.2):
    white = at.solid((255, 255, 255)); black = at.solid((15, 15, 25))
    for s in (-1, 1):
        x = x0 + s * gap
        m.box(bone, [x - size / 2, y - size / 2, z - 0.1], [x + size / 2, y + size / 2, z], black)
        m.box(bone, [x - size / 2 + 0.15, y + 0.05, z - 0.15], [x - size / 2 + 0.55, y + size / 2 - 0.1, z - 0.05], white)

def pet_slime(name, col=(80, 170, 255)):
    at = Atlas(32, 16); m = BB(name, at); body = at.solid(col); light = at.solid(lerp(col, (255, 255, 255), 0.45)); dark = at.solid(shade(col, 0.75))
    m.bone('body', [0, 0, 0])
    m.box('body', [-4.5, 0, -4.5], [4.5, 5, 4.5], body, dark, uv_top=light)
    m.box('body', [-3.5, 5, -3.5], [3.5, 6.5, 3.5], body, dark, uv_top=light)
    m.box('body', [-1.6, 6.5, -1.6], [-0.4, 7.2, -0.4], light)
    eyes(m, 'body', at, 0, 3.6, -4.5, gap=1.6, size=1.4)
    m.anim('idle', 2.0, {'body': {'scale': [(0, '1+math.sin(query.anim_time*360)*0.05', '1-math.sin(query.anim_time*360)*0.07', '1+math.sin(query.anim_time*360)*0.05')]}})
    m.anim('walk', 1.0, {'body': {'position': [(0, 0, 'math.abs(math.sin(query.anim_time*360))*2.2', 0)],
                                 'scale': [(0, 1, '1+math.abs(math.sin(query.anim_time*360))*0.1', 1)]}})
    return m

def pet_dragon(name, body=(60, 170, 110), belly=(230, 220, 160), wing=(40, 120, 90), horn=(240, 235, 220)):
    at = Atlas(32, 16); m = BB(name, at)
    B, Bl, D, Wg, H = at.solid(body), at.solid(belly), at.solid(shade(body, 0.7)), at.solid(wing), at.solid(horn)
    m.bone('body', [0, 6, 0])
    m.box('body', [-2.2, 4, -3], [2.2, 8, 3], B, D, uv_top=B)
    m.box('body', [-1.6, 4.2, -3.2], [1.6, 6.6, 2.5], Bl)
    m.bone('head', [0, 8, -2.6], 'body')
    m.box('head', [-1.8, 7.5, -6.2], [1.8, 10.6, -2.4], B, D)
    m.box('head', [-1.2, 7.6, -7.6], [1.2, 9.4, -6.2], B, D)
    for s in (-1, 1):
        m.box('head', [s * 1.1 - 0.35, 10.4, -4.0], [s * 1.1 + 0.35, 12.2, -3.3], H, rotation=[-25, 0, 0], origin=[s * 1.1, 10.4, -3.6])
    eyes(m, 'head', at, 0, 9.6, -6.25, gap=1.05, size=0.8)
    for s, n in ((1, 'r'), (-1, 'l')):
        m.bone('wing_' + n, [s * 2.0, 7.6, -0.5], 'body')
        m.box('wing_' + n, [s * 2.0, 7.4, -1.5] if s > 0 else [s * 8.0, 7.4, -1.5], [s * 8.0, 7.8, 1.5] if s > 0 else [s * 2.0, 7.8, 1.5], Wg)
        m.box('wing_' + n, [s * 2.0, 7.3, -1.6] if s > 0 else [s * 8.2, 7.3, -1.6], [s * 8.2, 7.9, -1.0] if s > 0 else [s * 2.0, 7.9, -1.0], H)
    m.bone('tail', [0, 6, 3], 'body')
    m.box('tail', [-1, 5, 3], [1, 6.8, 7], B, D); m.box('tail', [-0.6, 5.2, 7], [0.6, 6.4, 9.5], B, D); m.box('tail', [-0.9, 5.0, 9.5], [0.9, 6.6, 10.3], H)
    for s in (-1, 1):
        m.box('body', [s * 1.6 - 0.7, 1.5, -2.2], [s * 1.6 + 0.7, 4.2, -0.8], D); m.box('body', [s * 1.6 - 0.7, 1.5, 1.0], [s * 1.6 + 0.7, 4.2, 2.4], D)
    flap = {'wing_r': {'rotation': [(0, 0, 0, 'math.sin(query.anim_time*360)*35')]}, 'wing_l': {'rotation': [(0, 0, 0, '-math.sin(query.anim_time*360)*35')]},
            'tail': {'rotation': [(0, 0, 'math.sin(query.anim_time*180)*15', 0)]}, 'head': {'rotation': [(0, 'math.sin(query.anim_time*90)*4', 'math.sin(query.anim_time*45)*8', 0)]},
            'body': {'position': [(0, 0, 'math.sin(query.anim_time*180)*0.8', 0)]}}
    m.anim('idle', 4.0, flap); m.anim('fly', 4.0, flap); m.anim('walk', 4.0, flap)
    return m

def pet_wisp(name, core=(40, 0, 60), flame=(170, 80, 255), eye=(255, 230, 255)):
    at = Atlas(32, 16); m = BB(name, at); C, F, F2, E = at.solid(core), at.solid(flame), at.solid(lerp(flame, (255, 255, 255), 0.4)), at.solid(eye)
    m.bone('body', [0, 6, 0])
    m.box('body', [-3, 3, -3], [3, 9, 3], C, F)
    for i in range(5):
        a = math.radians(i * 72); x, z = math.cos(a) * 2, math.sin(a) * 2
        m.box('body', [x - 0.8, 8.5, z - 0.8], [x + 0.8, 10.5 + (i % 2) * 1.5, z + 0.8], F, F2)
    m.box('body', [-0.9, 9, -0.9], [0.9, 13, 0.9], F2)
    for s in (-1, 1): m.box('body', [s * 1.3 - 0.5, 6.2, -3.1], [s * 1.3 + 0.5, 7.6, -3.0], E)
    m.bone('bits', [0, 6, 0])
    for i in range(4):
        a = math.radians(i * 90); x, z = math.cos(a) * 5, math.sin(a) * 5
        m.box('bits', [x - 0.5, 5.5, z - 0.5], [x + 0.5, 6.5, z + 0.5], F2, rotation=[45, 45, 0])
    an = {'body': {'position': [(0, 0, 'math.sin(query.anim_time*180)*0.8', 0)]}, 'bits': {'rotation': [(0, 0, 'query.anim_time*90', 0)]}}
    m.anim('idle', 4.0, an); m.anim('fly', 4.0, an); m.anim('walk', 4.0, an)
    return m

def pet_phoenix(name, body=(255, 140, 30), head=(255, 210, 70), tail=(220, 40, 20)):
    at = Atlas(32, 16); m = BB(name, at); Bd, Hd, Tl, Bk = at.solid(body), at.solid(head), at.solid(tail), at.solid((255, 230, 120))
    m.bone('body', [0, 6, 0])
    m.box('body', [-2, 4, -2.5], [2, 8, 2.5], Bd)
    m.bone('head', [0, 8, -1.5], 'body'); m.box('head', [-1.6, 8, -3.5], [1.6, 11, -0.5], Hd); m.box('head', [-0.5, 9, -4.6], [0.5, 9.8, -3.5], Bk)
    for i in range(3): m.box('head', [-0.3 + (i - 1) * 0.8, 11, -2.2], [0.3 + (i - 1) * 0.8, 12.8 - abs(i - 1) * 0.6, -1.6], Tl)
    eyes(m, 'head', at, 0, 10, -3.55, gap=0.9, size=0.7)
    for s, n in ((1, 'r'), (-1, 'l')):
        m.bone('wing_' + n, [s * 2, 7, 0], 'body')
        for k in range(3):
            x0, x1 = (2, 6.5 - k) if s > 0 else (-(6.5 - k), -2)
            m.box('wing_' + n, [x0, 7 - k * 0.8, -2 + k * 0.4], [x1, 7.6 - k * 0.8, 2 - k * 0.4], Tl if k == 2 else Bd)
    m.bone('tail', [0, 5, 2.5], 'body')
    for i in range(3): m.box('tail', [-0.5 + (i - 1) * 1.1, 4.5 - i * 0.3, 2.5], [0.5 + (i - 1) * 1.1, 5.5 - i * 0.3, 8 - abs(i - 1)], Tl, rotation=[-20, (i - 1) * 12, 0], origin=[0, 5, 2.5])
    an = {'wing_r': {'rotation': [(0, 0, 0, 'math.sin(query.anim_time*360)*40')]}, 'wing_l': {'rotation': [(0, 0, 0, '-math.sin(query.anim_time*360)*40')]},
          'tail': {'rotation': [(0, 'math.sin(query.anim_time*180)*10', 0, 0)]}, 'body': {'position': [(0, 0, 'math.sin(query.anim_time*180)*0.7', 0)]}}
    m.anim('idle', 4.0, an); m.anim('fly', 4.0, an); m.anim('walk', 4.0, an)
    return m

def pet_fox(name, fur=(240, 140, 50), white=(250, 245, 235), tails=3):
    at = Atlas(32, 16); m = BB(name, at); F, Wt, D, N = at.solid(fur), at.solid(white), at.solid(shade(fur, 0.7)), at.solid((30, 25, 25))
    m.bone('body', [0, 5, 0])
    m.box('body', [-2, 3.5, -3.5], [2, 7, 3.5], F, D)
    m.bone('head', [0, 7, -3.5], 'body')
    m.box('head', [-2.4, 6, -7], [2.4, 10, -3.2], F, D); m.box('head', [-1.1, 6, -8.6], [1.1, 7.8, -7], Wt); m.box('head', [-0.4, 7.3, -8.7], [0.4, 7.9, -8.55], N)
    for s in (-1, 1): m.box('head', [s * 1.7 - 0.8, 10, -5], [s * 1.7 + 0.8, 12, -4.2], F)
    eyes(m, 'head', at, 0, 8.6, -7.05, gap=1.2, size=0.8)
    legs = []
    for i, (lx, lz) in enumerate([(-1.2, -2.6), (1.2, -2.6), (-1.2, 2.4), (1.2, 2.4)]):
        bn = m.bone(f'leg{i}', [lx, 3.5, lz], 'body'); legs.append(bn)
        m.box(bn, [lx - 0.6, 0, lz - 0.6], [lx + 0.6, 3.6, lz + 0.6], F if i < 2 else D, uv_top=F)
    for t in range(tails):
        bn = m.bone(f'tail{t}', [0, 6, 3.5], 'body')
        a = (t - (tails - 1) / 2) * 25
        m.box(bn, [-1, 5.5, 3.5], [1, 7.5, 8.5], F, D, origin=[0, 6, 3.5], rotation=[-30, a, 0])
        m.box(bn, [-0.8, 5.7, 8.3], [0.8, 7.3, 10.3], Wt, origin=[0, 6, 3.5], rotation=[-30, a, 0])
    idle = {f'tail{t}': {'rotation': [(0, 0, f'math.sin(query.anim_time*90+{t * 60})*12', 0)]} for t in range(tails)}
    idle['head'] = {'rotation': [(0, 0, 'math.sin(query.anim_time*45)*10', 0)]}
    walk = dict(idle)
    for i, bn in enumerate(legs): walk[bn] = {'rotation': [(0, f'math.sin(query.anim_time*360+{180 if i in (1, 2) else 0})*30', 0, 0)]}
    m.anim('idle', 8.0, idle); m.anim('walk', 8.0, walk)
    return m

PETS = {
    'pet_rimuru': ('Rimuru Slime', lambda n: pet_slime(n, (80, 170, 255)), False),
    'pet_crimson_slime': ('Crimson Slime', lambda n: pet_slime(n, (220, 40, 60)), False),
    'pet_storm_dragon': ('Baby Storm Dragon', lambda n: pet_dragon(n, (60, 150, 220), (210, 235, 255), (40, 100, 180), (240, 250, 255)), True),
    'pet_ember_dragon': ('Baby Ember Dragon', lambda n: pet_dragon(n, (200, 50, 30), (255, 200, 120), (140, 30, 20), (40, 30, 30)), True),
    'pet_shadow_wisp': ('Shadow Wisp', lambda n: pet_wisp(n), True),
    'pet_phoenix': ('Phoenix Chick', lambda n: pet_phoenix(n), True),
    'pet_kitsune': ('Kitsune', lambda n: pet_fox(n, (240, 140, 50), tails=3), False),
    'pet_spirit_fox': ('Spirit Fox', lambda n: pet_fox(n, (140, 200, 255), (255, 255, 255), tails=9), False),
}
