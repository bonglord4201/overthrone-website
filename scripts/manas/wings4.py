# OVERTHRONE v4 wings for Manas Cosmetics (back slot). Built in the frame the mod expects for back models (see sim.py):
# Y up, the whole model below y=0 (so the mod flips it upright), -Z = away from the player's back (what you see from behind).
#
# Every wing has a 3-joint skeleton (shoulder -> elbow -> wrist) so the flap rolls along the wing, plus per-feather bones
# on the primaries that ripple. Clips: idle (slow breathing flap), walk, run (folded back), jump and fly (big strong
# flaps; the mod plays fly while gliding with an elytra). Effects are model pieces (falling feathers, embers, sparkles...)
# and glow textures (full-bright trims/runes + a soft see-through light behind magical wings).
import math, random
from bb import BB, Atlas
import paint as P
from fx import Kit, hang, seg, lerp3, Particles, clips, mir

# skeleton (right wing; the left is mirrored)
S = (2.0, -15.0, -1.2)      # shoulder
E = (6.5, -6.5, -1.8)       # elbow
W = (11.0, 1.5, -2.4)       # wrist (the top of the wing)
H = (17.0, 3.5, -2.9)       # end of the hand
D = 3                        # texture pixels per model unit (2-3x vanilla detail)

def X(p, s): return [p[0] * s, p[1], p[2]]

def skeleton(m, n, s, parent=None, pre='', pts=None):
    S_, E_, W_ = (pts or (S, E, W))[:3]
    wb = m.bone(pre + 'wing_' + n, X(S_, s), parent)
    mb = m.bone(pre + 'mid_' + n, X(E_, s), wb)
    hb = m.bone(pre + 'hand_' + n, X(W_, s), mb)
    return wb, mb, hb

# ---------------------------------------------------------------- animation
def flap_tracks(clip, n, s, prim_bones, style='feather', pre='', ph=0, amp=1.0):
    """Rotation tracks for one wing. Z = raise/lower, Y = sweep back (+ for the right wing tips go away from the back)."""
    heavy = style in ('mech', 'demon', 'bone')
    if clip == 'idle':  w, A, sw, base, sb = 95, 7, 5, 6, 12
    elif clip == 'walk': w, A, sw, base, sb = 130, 9, 6, 4, 16
    elif clip == 'run':  w, A, sw, base, sb = 200, 5, 4, -4, 38
    elif clip == 'jump': w, A, sw, base, sb = 330, 26, 10, 10, 6
    else:                w, A, sw, base, sb = 300, 30, 12, 12, 4     # fly / gliding
    if heavy: w = int(w * 0.85)
    tq = f'query.anim_time*{w}-{ph}' if ph else f'query.anim_time*{w}'
    A, sw = A * amp, sw * amp
    tr = {
        pre + 'wing_' + n: {'rotation': [(0, 0, f'{s}*({sb}+math.sin({tq}+70)*{sw})', f'{s}*({base}+math.sin({tq})*{A})')]},
        pre + 'mid_' + n: {'rotation': [(0, 0, f'{s}*(-6+math.sin({tq}-35)*{sw * 0.6:.1f})', f'{s}*(math.sin({tq}-40)*{A * 0.35:.1f})')]},
        pre + 'hand_' + n: {'rotation': [(0, 0, f'{s}*(-10+math.sin({tq}-75)*{sw * 0.8:.1f})', f'{s}*(math.sin({tq}-85)*{A * 0.5:.1f})')]},
    }
    rip = 3.0 if clip in ('idle', 'walk') else 6.0
    for i, b in enumerate(prim_bones):
        tr[b] = {'rotation': [(0, f'math.sin({tq}*1.7-{i * 28})*{rip}', 0, f'{s}*math.sin({tq}-{60 + i * 12})*{rip * 0.6:.1f}')]}
    return tr

# ---------------------------------------------------------------- feathered wings
def feathered(name, P_):
    """P_ keys: root, tip, edge, shaft, cov (covert colour), cov_tip, arm, gold (trim colour or None), glow (tip glow or None),
    soft (soft light colour or None), fx ('feathers'|'embers'|'sparkles'|'stars'|'snow'|'petals'|'souls'|None), fxcol,
    flame (flame-shaped tips), stars (star dots on the feathers, colour), kind2 (secondary feather tip band colour)."""
    m = BB(name, Atlas(512, 256)); k = Kit(m)
    root, tip, edge, shaft = P_['root'], P_['tip'], P_.get('edge'), P_.get('shaft')
    cov, cov_tip = P_.get('cov', P.shade(root, 1.08)), P_.get('cov_tip', P_.get('cov', root))
    glow, stars = P_.get('glow'), P_.get('stars')
    pk = 'flame' if P_.get('flame') else 'primary'
    mat = P_.get('mat', 'feather')
    box = mat == 'crystal'; twist = 45 if box else 0
    if mat == 'crystal':
        cg = P_.get('glow')
        body = k.main('cbody', P.facet(6, 24, P.shade(root, 1.05), P.mixc(root, tip, 0.75), hi=(255, 255, 255)))
        tipu = k.main('ctip', P.facet(6, 12, P.mixc(root, tip, 0.6), tip))
        gtip = k.glow('cglow', P.facet(6, 12, cg, P.shade(cg, 0.7))) if cg else None
        prim = prim2 = sec = ter = gcov = mcov = scl = (body, (tipu, gtip))
    elif mat == 'leaf':
        lf, vn = root, P_.get('vein', P.shade(root, 0.6))
        prim = k.sprite('prim', lambda: P.leaf(14, 66, lf, vn)); prim2 = k.sprite('prim2', lambda: P.leaf(14, 56, P.shade(lf, 1.1), vn))
        sec = k.sprite('sec', lambda: P.leaf(14, 48, P.mixc(lf, tip, 0.4), vn)); ter = k.sprite('ter', lambda: P.leaf(14, 38, tip, vn))
        gcov = k.sprite('gcov', lambda: P.leaf(12, 26, P.shade(tip, 1.1), vn)); mcov = k.sprite('mcov', lambda: P.leaf(10, 16, P.shade(lf, 1.2), vn))
        scl = k.sprite('scale', lambda: P.leaf(8, 10, P.shade(tip, 1.2), vn))
    else:
        prim = k.sprite('prim', lambda: P.feather(14, 78, root, tip, edge, shaft, pk, glow_tip=glow, stars=stars, seed=1))
        prim2 = k.sprite('prim2', lambda: P.feather(14, 66, P.mixc(root, tip, 0.1), tip, edge, shaft, pk, glow_tip=glow, stars=stars, seed=2))
        sec = k.sprite('sec', lambda: P.feather(14, 54, P.mixc(root, tip, 0.05), P.mixc(root, tip, 0.8), edge, shaft, 'secondary', glow_tip=glow if P_.get('flame') else None, stars=stars, seed=3))
        ter = k.sprite('ter', lambda: P.feather(14, 42, root, P.mixc(root, tip, 0.6), edge, shaft, 'secondary', stars=stars, seed=4))
        gcov = k.sprite('gcov', lambda: P.feather(12, 30, cov, cov_tip, edge, None, 'covert', stars=stars, seed=5))
        mcov = k.sprite('mcov', lambda: P.feather(10, 18, P.shade(cov, 1.05), cov_tip, edge, None, 'covert', seed=6))
        scl = k.sprite('scale', lambda: P.feather(8, 10, P.shade(cov, 1.1), cov, None, None, 'scale', seed=7))
    wmul = 1.0
    NP, NS, NG, NM, NSC = (8, 6, 10, 0, 0) if box else (10, 9, 16, 10, 9)
    twist = 45 if box else 0
    arm = k.main('arm', P.solid(P_['arm'])); arm_d = k.main('arm_d', P.solid(P.shade(P_['arm'], 0.7)))
    gold = P_.get('gold')
    tracks_prims = {}
    cnt = [0]
    def piece(bone_, R_, L_, w_, ang_, spr, s_):
        cnt[0] += 1
        if P_.get('tatter') and cnt[0] % 4 == 2: return
        if box:
            crystal_shard(m, bone_, R_, L_ * 0.95, w_ * 0.78, ang_, spr[0], spr[1][0], spr[1][1], s_)
        else:
            hang(m, bone_, R_, L_, w_, ang_, spr[0], spr[1], side=s_)
    for s, n in ((1, 'r'), (-1, 'l')):
        wb, mb, hb = skeleton(m, n, s)
        # bones under the coverts (mostly hidden, give the leading edge thickness)
        seg(m, wb, X(S, s), X(E, s), 1.6, arm, arm_d); seg(m, mb, X(E, s), X(W, s), 1.3, arm, arm_d); seg(m, hb, X(W, s), X(H, s), 1.0, arm, arm_d)
        prims = []
        # primaries: from the hand, fanning out and up; each on its own bone so it ripples
        for i in range(NP):
            t = i / (NP - 1)
            R = lerp3(W, H, 0.05 + 0.95 * t); R[2] += 0.35 + 0.03 * i
            ang = 30 + 92 * t ** 1.15
            L = 18 + 9 * math.sin(min(1, t * 1.1) * math.pi * 0.6) - (3 if i == NP - 1 else 0)
            pb = m.bone('p%d_%s' % (i, n), X(R, s), hb); prims.append(pb)
            uv = prim if i % 2 else prim2
            piece(pb, X(R, s), L, 4.6 * wmul, s * ang, uv, s)
        # secondaries: along the forearm
        for i in range(NS):
            t = i / (NS - 1)
            R = lerp3(E, W, 0.0 + 1.0 * t); R[2] += 0.25 - 0.02 * i
            piece(mb, X(R, s), 16 + 3 * t, 4.8 * wmul, s * (2 + 22 * t), sec, s)
        # tertials: along the upper arm, close to the body
        for i in range(4):
            t = 0.15 + 0.25 * i
            R = lerp3(S, E, t); R[2] += 0.15 - 0.02 * i
            piece(wb, X(R, s), 10 + 4 * t, 5.0 * wmul, s * (-4 + 6 * t), ter, s)
        # greater coverts: over the top half of the flight feathers
        for i in range(NG):
            t = i / (NG - 1); R = lerp3(S, H, 0.04 + 0.9 * t); R[2] -= 0.45 + 0.01 * i
            b = wb if t < 0.33 else (mb if t < 0.62 else hb)
            ang = (0 + 24 * (t / 0.62)) if t < 0.62 else (24 + 80 * (t - 0.62) / 0.38)
            piece(b, X(R, s), 8.5 + 3 * t, 4.0 * wmul, s * ang, gcov, s)
        # middle coverts
        for i in range(NM):
            t = i / (NM - 1); R = lerp3(S, H, 0.02 + 0.85 * t); R[2] -= 0.85 + 0.01 * i
            b = wb if t < 0.33 else (mb if t < 0.62 else hb)
            piece(b, X(R, s), 5.2, 3.4 * wmul, s * (2 + 70 * t ** 1.5), mcov, s)
        # marginal coverts (little scales) on the leading edge
        for i in range(NSC):
            t = i / max(1, NSC - 1); R = lerp3(S, H, 0.0 + 0.82 * t); R[1] += 0.9; R[2] -= 1.2
            b = wb if t < 0.36 else (mb if t < 0.66 else hb)
            piece(b, X(R, s), 3.2, 2.8 * wmul, s * (6 + 70 * t ** 1.5), scl, s)
        if gold is not None:
            ornament(m, k, s, n, wb, mb, hb, gold, P_.get('gem', (230, 20, 40)), P_.get('dark', (25, 20, 25)), P_.get('trim', 'light'))
        tracks_prims[n] = prims
    if P_.get('soft'): soft_glow(m, k, P_['soft'])
    fx = effects(m, k, P_)
    if P_.get('halo'): halo_piece(m, k, P_['halo'])
    def build(c):
        tr = {}
        for s, n in ((1, 'r'), (-1, 'l')): tr.update(flap_tracks(c, n, s, tracks_prims[n]))
        add_extra(tr, c, P_)
        return tr
    clips(m, build, 4.0, fx)
    place_back(m, halo=bool(P_.get('halo')))
    return m

def crystal_shard(m, bone, R, L, w, ang, body, tipu, gtip, side):
    """A solid 3D crystal hanging from R: a diamond-section body and two tapering tip blocks (the last one glows)."""
    rot = [0, 45, ang]
    def blk(y0, y1, ww, uv):
        m.box(bone, [R[0] - ww / 2, R[1] - y1, R[2] - ww / 2], [R[0] + ww / 2, R[1] - y0, R[2] + ww / 2], uv, uv, origin=list(R), rotation=rot)
    blk(0, L * 0.64, w, body)
    blk(L * 0.64, L * 0.86, w * 0.64, tipu)
    blk(L * 0.86, L, w * 0.3, gtip if gtip is not None else tipu)

def ornament(m, k, s, n, wb, mb, hb, gold, gem, dark, trim='light'):
    """Royal trim: gold bracer + gem at the wrist, gold pauldron plates on the shoulder, gold spine studs."""
    import armorart as AA
    g = k.main('gold', AA.gold(8, 8, {'gold': gold})[0]); gd = k.main('gold_d', AA.gold(8, 8, {'gold': P.shade(gold, 0.7)})[0])
    gem_g = k.glow('gem', P.solid(gem))
    plate_uv = k.sprite('pauldron', lambda: P.plate(12, 14, dark, gold, gem=gem))
    Wx = X(W, s)
    m.box(hb, [Wx[0] - 1.3, Wx[1] - 1.3, Wx[2] - 1.5], [Wx[0] + 1.3, Wx[1] + 1.3, Wx[2] + 0.6], g, gd)
    m.box(hb, [Wx[0] - 0.6, Wx[1] - 0.6, Wx[2] - 1.75], [Wx[0] + 0.6, Wx[1] + 0.6, Wx[2] - 1.45], gem_g, gem_g)
    Ex = X(E, s)
    m.box(mb, [Ex[0] - 1.1, Ex[1] - 1.1, Ex[2] - 1.35], [Ex[0] + 1.1, Ex[1] + 1.1, Ex[2] + 0.5], g, gd)
    for i in range(3 if trim == 'full' else 0):   # layered pauldron plates over the shoulder
        t = 0.1 + 0.28 * i; R = lerp3(S, E, t); R[1] += 1.2; R[2] -= 1.7 - 0.05 * i
        hang(m, wb, X(R, s), 4.6, 4.0, s * (8 + 10 * i), plate_uv[0], plate_uv[1], side=s)
    for i in range(5):   # studs along the leading edge
        t = (i + 0.5) / 5; R = lerp3(S, H, t); R[1] += 1.0
        b = wb if t < 0.33 else (mb if t < 0.62 else hb)
        Rx = X(R, s)
        m.box(b, [Rx[0] - 0.45, Rx[1] - 0.45, Rx[2] - 1.5], [Rx[0] + 0.45, Rx[1] + 0.45, Rx[2] - 0.6], g, gd, origin=Rx, rotation=[0, 0, 45])

def soft_glow(m, k, col):
    """A soft light behind each wing (between the wing and the back), pulsing slowly."""
    uv = k.soft('soft', P.soft(64, 64, col, peak=55))
    for s, n in ((1, 'r'), (-1, 'l')):
        c = lerp3(S, H, 0.5); c[1] -= 6; c[2] = 0.2
        cx = X(c, s)
        m.plate('wing_' + n, [cx[0] - 14, cx[1] - 13, cx[2] - 0.05], [cx[0] + 14, cx[1] + 13, cx[2] + 0.05], uv)

def add_extra(tr, clip, P_):
    if P_.get('soft'):
        pass
    if P_.get('halo'):
        tr['halo'] = {'rotation': [(0, 0, 'query.anim_time*40', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90)*0.5', 0)]}

# ---------------------------------------------------------------- effects
def effects(m, k, P_):
    kind = P_.get('fx')
    if not kind: return None
    col = P_.get('fxcol', (255, 230, 150))
    fx = Particles(m, None, 4.0)
    rnd = random.Random(m.name)
    if kind == 'feathers':
        uv = k.sprite('fxfeather', lambda: P.feather(6, 12, P_['root'], P_['tip'], P_.get('edge'), None, 'covert', seed=9))[0]
        for i in range(8):
            s = 1 if i % 2 else -1
            x = s * rnd.uniform(6, 20); y = rnd.uniform(-8, 0)
            fx.add([x, y, -3.0], [s * rnd.uniform(1, 4), -14, -2], 2.2, mir(uv, s), i / 8 + rnd.uniform(0, 0.05), sway=25, plate=True)
    elif kind in ('embers', 'souls'):
        gl = k.glow('ember', P.dot(col, 3, core=(255, 255, 220)))
        for i in range(12):
            s = 1 if i % 2 else -1
            x = s * rnd.uniform(4, 22); y = rnd.uniform(-20, -8)
            fx.add([x, y, -3.0], [s * rnd.uniform(0, 2), rnd.uniform(10, 16), -rnd.uniform(0, 2)], 0.7 if kind == 'embers' else 0.9, gl, i / 12, spin=180)
    elif kind in ('sparkles', 'stars'):
        gl = k.glow('spark', P.dot(col, 3, core=(255, 255, 255)))
        for i in range(12):
            s = 1 if i % 2 else -1
            x = s * rnd.uniform(5, 24); y = rnd.uniform(-18, 4)
            fx.add([x, y, -3.4], [0, rnd.uniform(0.5, 2.5), 0], 0.8, gl, i / 12, spin=90, fade_in=0.4, fade_out=0.6)
    elif kind in ('snow', 'petals'):
        if kind == 'snow': uv = k.glow('snow', P.dot(col, 2))
        else: uv = k.main('petal', P.dot(col, 2))
        for i in range(10):
            s = 1 if i % 2 else -1
            x = s * rnd.uniform(4, 22); y = rnd.uniform(-6, 2)
            fx.add([x, y, -3.2], [s * rnd.uniform(1, 3), -15, -1], 0.7, uv, i / 10, sway=30, rot=(0, 0, 45))
    return fx

# ---------------------------------------------------------------- a halo above the head (seraph wings)
def halo_piece(m, k, col):
    g = k.glow('halo', P.solid(col)); gs = k.glow('halo_d', P.solid(P.shade(col, 0.75)))
    sft = k.soft('halo_soft', P.soft(48, 48, col, peak=140, ring=(0.72, 0.16)))
    m.bone('halo', [0, 0, 2])
    r, n = 5.0, 24
    for i in range(n):
        a = math.radians(i * 360 / n); x, z = math.cos(a) * r, 2 + math.sin(a) * r
        m.box('halo', [x - 0.7, -0.35, z - 0.35], [x + 0.7, 0.35, z + 0.35], g if i % 2 else gs, gs, origin=[x, 0, z], rotation=[0, -math.degrees(a), 0])
    m.flat('halo', [-7.5, 0, 2 - 7.5], [7.5, 0.02, 2 + 7.5], sft)

def place_back(m, root_y=S[1], want=5.0, halo=False):
    """The mod centres a back model on its rest bounding box: model y lands at player y = -(y + lift), lift = -4 - centre
    (player y counts down from the neck). An invisible cube (no faces, still counted in the box) moves the centre so the
    wing roots (root_y) sit `want` px below the neck, on the shoulder blades. With halo, the 'halo' bone is first moved so
    it floats 3 px above the head (player y = -11)."""
    import sim
    lift = -want - root_y
    centre = -4 - lift
    if halo:
        hal = [e for e in m.elements if e['uuid'] in set(m.bones['halo']['children'])]
        want_y = 11 - lift
        cy = sum((e['from'][1] + e['to'][1]) / 2 for e in hal) / len(hal); dy = want_y - cy
        for e in hal:
            for kk in ('from', 'to', 'origin'): e[kk][1] = round(e[kk][1] + dy, 4)
        m.bones['halo']['origin'][1] = round(m.bones['halo']['origin'][1] + dy, 4)
    a = sim.Model(m.to_dict()).rest_aabb(); lo, hi = a[1], a[4]
    y = 2 * centre - hi if (lo + hi) / 2 > centre else 2 * centre - lo
    m.bone('anchor', [0, 0, 0])
    m.cube('anchor', [-0.01, y, 0], [0.01, y + 0.001, 0.01], {})

# ---------------------------------------------------------------- membrane (demon / bat / void / bone) wings
FINGERS = [(86, 15.0), (54, 22.0), (22, 23.5), (-12, 20.0)]     # (angle from +X, length) from the wrist

def bez(a, b, c, n=6):
    return [((1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]) for t in [(i + 1) / (n + 1) for i in range(n)]]

def scallop(a, b, toward, depth=0.32):
    mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    ctrl = (mid[0] + (toward[0] - mid[0]) * depth, mid[1] + (toward[1] - mid[1]) * depth)
    return bez(a, ctrl, b)

def membrane_wing(name, P_):
    """P_: mem (membrane colour), edge (outline colour), vein, bone (finger colour), claw, glow_vein (or None), soft,
    fx, fxcol, holes (tatter), stars (starfield), gold (armour trim) + dark/gem, spikes (colour), bones_style ('bone' = skeletal)."""
    m = BB(name, Atlas(512, 256)); k = Kit(m)
    Wp = (W[0], W[1]); tips = [(W[0] + math.cos(math.radians(a)) * L, W[1] + math.sin(math.radians(a)) * L) for a, L in FINGERS]
    B1, B0 = (16.0, -17.5), (3.2, -23.0)
    hand_poly = [Wp, tips[0]]
    for i in range(3): hand_poly += scallop(tips[i], tips[i + 1], Wp) + [tips[i + 1]]
    arm_poly = [(S[0], S[1] + 1.0), (E[0], E[1] + 0.6), (W[0], W[1] + 0.4), tips[3]] + scallop(tips[3], B1, Wp, 0.25) + [B1] + scallop(B1, B0, (S[0], S[1]), 0.25) + [B0]
    veins_h = [(Wp, t) for t in tips]
    veins_a = [((S[0], S[1]), (E[0], E[1])), ((E[0], E[1]), Wp), ((E[0], E[1]), B1), ((S[0], S[1]), B0), ((E[0], E[1]), ((B1[0] + tips[3][0]) / 2, (B1[1] + tips[3][1]) / 2))]
    holes = P_.get('holes', 0); stars = P_.get('stars', False)
    mh, gh, fh = P.membrane(hand_poly, veins_h, D, P_['mem'], P_['edge'], P_['vein'], P_.get('glow_vein'), holes=holes, stars=stars, seed=name + 'h')
    ma, ga, fa = P.membrane(arm_poly, veins_a, D, P.shade(P_['mem'], 0.9), P_['edge'], P_['vein'], P_.get('glow_vein'), holes=holes, stars=stars, seed=name + 'a')
    uh = m.atlas.add(mh); ua = m.atlas.add(ma)
    gh_uv = m.glow_atlas().add(gh) if gh is not None else None; ga_uv = m.glow_atlas().add(ga) if ga is not None else None
    bone = k.main('bone', P.solid(P_['bone'])); bone_d = k.main('bone_d', P.solid(P.shade(P_['bone'], 0.65)))
    claw = k.main('claw', P.solid(P_['claw'])); claw_g = k.glow('claw_g', P.solid(P_['glow_vein'])) if P_.get('glow_vein') else None
    for s, n in ((1, 'r'), (-1, 'l')):
        wb, mb, hb = skeleton(m, n, s)
        def panel(bone_, fr, uv, guv, z):
            x0, y0, x1, y1 = fr
            if s > 0: a, b = [x0, y0, z - 0.05], [x1, y1, z + 0.05]
            else: a, b = [-x1, y0, z - 0.05], [-x0, y1, z + 0.05]
            m.plate(bone_, a, b, mir(uv, s))
            if guv is not None: m.plate(bone_, [a[0], a[1], a[2] - 0.04], [b[0], b[1], b[2] + 0.04], mir(guv, s))
        panel(mb, fa, ua, ga_uv, -1.6)
        panel(hb, fh, uh, gh_uv, W[2])
        # arm + fingers (tapered, with knuckles and claws)
        skeletal = P_.get('bones_style') == 'bone'
        seg(m, wb, X(S, s), X(E, s), 1.7 if not skeletal else 1.3, bone, bone_d)
        seg(m, mb, X(E, s), X(W, s), 1.4 if not skeletal else 1.1, bone, bone_d)
        m.box(mb, [X(E, s)[0] - 1.0, E[1] - 1.0, E[2] - 1.0], [X(E, s)[0] + 1.0, E[1] + 1.0, E[2] + 1.0], bone, bone_d)
        m.box(hb, [X(W, s)[0] - 1.0, W[1] - 1.0, W[2] - 1.0], [X(W, s)[0] + 1.0, W[1] + 1.0, W[2] + 1.0], bone, bone_d)
        for fi, (a, L) in enumerate(FINGERS):
            d = (math.cos(math.radians(a)), math.sin(math.radians(a)))
            A = [W[0], W[1], W[2]]; M = [W[0] + d[0] * L * 0.55, W[1] + d[1] * L * 0.55, W[2]]; T = [W[0] + d[0] * L, W[1] + d[1] * L, W[2]]
            seg(m, hb, X(A, s), X(M, s), 0.9, bone, bone_d)
            seg(m, hb, X(M, s), X(T, s), 0.6, bone, bone_d)
            m.box(hb, [X(M, s)[0] - 0.55, M[1] - 0.55, M[2] - 0.55], [X(M, s)[0] + 0.55, M[1] + 0.55, M[2] + 0.55], bone, bone_d)
            # claw at the tip, curving on along the finger
            C1 = [T[0] + d[0] * 1.6, T[1] + d[1] * 1.6, T[2]]
            seg(m, hb, X(T, s), X(C1, s), 0.55, claw, claw, guv=claw_g if fi == 0 else None)
        # thumb claw: a hooked horn up out of the wrist
        h1 = [W[0] - 0.6, W[1] + 2.4, W[2] - 0.6]; h2 = [W[0] - 2.0, W[1] + 4.2, W[2] - 0.9]
        seg(m, hb, X(W, s), X(h1, s), 0.9, claw, claw); seg(m, hb, X(h1, s), X(h2, s), 0.6, claw, claw, guv=claw_g)
        if P_.get('spikes'):
            sp = k.main('spike', P.solid(P_['spikes'])); spd = k.main('spike_d', P.solid(P.shade(P_['spikes'], 0.6)))
            for i in range(5):
                t = (i + 0.5) / 5; R = lerp3(S, W, t); R[1] += 0.8
                b = wb if t < 0.5 else mb
                d0 = (-(W[1] - S[1]), W[0] - S[0]); dl = math.hypot(*d0); d0 = (d0[0] / dl, d0[1] / dl)   # normal, pointing up-in
                T2 = [R[0] + d0[0] * 2.6, R[1] + d0[1] * 2.6, R[2] - 0.2]
                seg(m, b, X(R, s), X(T2, s), 0.7, sp, spd)
        if P_.get('gold') is not None:
            ornament(m, k, s, n, wb, mb, hb, P_['gold'], P_.get('gem', (230, 20, 40)), P_.get('dark', (25, 20, 25)), P_.get('trim', 'light'))
    if P_.get('soft'): soft_glow(m, k, P_['soft'])
    fx = effects(m, k, P_)
    def build(c):
        tr = {}
        for s, n in ((1, 'r'), (-1, 'l')): tr.update(flap_tracks(c, n, s, [], 'demon'))
        return tr
    clips(m, build, 4.0, fx)
    place_back(m)
    return m

# ---------------------------------------------------------------- mech wings (armoured blades on hinges)
def mech_wing(name, P_):
    """P_: dark, light (metal), glow (energy colour), gold (trim or None), gem, fx ('flames'), soft."""
    m = BB(name, Atlas(512, 256)); k = Kit(m)
    dark, light, glow = P_['dark'], P_['light'], P_['glow']
    bl = k.sprite('blade', lambda: P.blade(12, 78, dark, light, glow=glow))
    bl2 = k.sprite('blade2', lambda: P.blade(12, 60, P.shade(dark, 1.15), light, glow=glow))
    pl = k.sprite('plate', lambda: P.plate(14, 16, dark, P_.get('gold') or light, gem=glow))
    met = k.main('metal', P.facet(4, 8, light, P.shade(light, 0.6))); met_d = k.main('metal_d', P.solid(P.shade(dark, 0.9)))
    core = k.glow('core', P.dot(glow, 4, core=(255, 255, 230)))
    gold = k.main('gold', P.solid(P_['gold'])) if P_.get('gold') else met
    blade_bones = {}
    for s, n in ((1, 'r'), (-1, 'l')):
        wb, mb, hb = skeleton(m, n, s)
        # armoured arm: chunky segments, piston, glowing joints
        seg(m, wb, X(S, s), X(E, s), 2.2, met, met_d, thz=2.0)
        seg(m, mb, X(E, s), X(W, s), 1.8, met, met_d, thz=1.6)
        seg(m, hb, X(W, s), X(H, s), 1.4, met, met_d, thz=1.3)
        for J, b in ((E, mb), (W, hb)):
            Jx = X(J, s)
            m.box(b, [Jx[0] - 1.4, J[1] - 1.4, J[2] - 1.3], [Jx[0] + 1.4, J[1] + 1.4, J[2] + 1.3], gold, met_d)
            m.box(b, [Jx[0] - 0.7, J[1] - 0.7, J[2] - 1.55], [Jx[0] + 0.7, J[1] + 0.7, J[2] - 1.25], core, core)
        # armour plates over the upper arm
        for i in range(4):
            t = 0.12 + 0.24 * i; R = lerp3(S, E, t); R[1] += 1.4; R[2] -= 1.4
            hang(m, wb, X(R, s), 4.4, 4.2, s * (14 + 6 * i), pl[0], pl[1], side=s)
        # the blade fan: 9 blades on their own hinges from the hand/forearm
        bones = []
        for i in range(9):
            t = i / 8
            R = lerp3(E, H, 0.15 + 0.85 * t); R[2] += 0.2 + 0.05 * i
            b = m.bone('bl%d_%s' % (i, n), X(R, s), hb if t > 0.4 else mb); bones.append(b)
            L = 16 + 10 * math.sin(t * math.pi * 0.75)
            hang(m, b, X(R, s), L, 4.2, s * (8 + 100 * t ** 1.2), (bl if i % 2 == 0 else bl2)[0], (bl if i % 2 == 0 else bl2)[1], side=s, th=0.3)
        blade_bones[n] = bones
        # thruster under the shoulder
        Tx = X((S[0] + 2.2, S[1] - 2.0, S[2] + 0.2), s)
        m.box(wb, [Tx[0] - 1.3, Tx[1] - 2.2, Tx[2] - 1.3], [Tx[0] + 1.3, Tx[1] + 1.0, Tx[2] + 1.3], met, met_d)
        m.box(wb, [Tx[0] - 0.8, Tx[1] - 2.5, Tx[2] - 0.8], [Tx[0] + 0.8, Tx[1] - 2.1, Tx[2] + 0.8], core, core)
    if P_.get('soft'): soft_glow(m, k, P_['soft'])
    fx = Particles(m, None, 2.0)
    fl = k.glow('flame', P.dot(glow, 3, core=(255, 255, 210)))
    rnd = random.Random(name)
    for i in range(10):
        s = 1 if i % 2 else -1
        x = s * (S[0] + 2.2 + rnd.uniform(-0.4, 0.4))
        fx.add([x, S[1] - 4.8, S[2] + 0.2], [s * rnd.uniform(0, 1.2), -rnd.uniform(5, 8), rnd.uniform(-0.8, 0.8)], 0.9 - 0.04 * i, fl, i / 10, spin=240, fade_in=0.05, fade_out=0.3)
    def build(c):
        tr = {}
        for s, n in ((1, 'r'), (-1, 'l')):
            tr.update(flap_tracks(c, n, s, [], 'mech'))
            w = 60 if c == 'idle' else (90 if c == 'walk' else 140)
            open_ = {'idle': 6, 'walk': 6, 'run': 14, 'jump': 10, 'fly': 10}[c]
            for i, b in enumerate(blade_bones[n]):   # the fan opens and closes like a breathing machine
                tr[b] = {'rotation': [(0, 0, 0, f'{s}*math.sin(query.anim_time*{w}-{i * 14})*{open_ * (0.3 + i / 9):.2f}')]}
        return tr
    clips(m, build, 2.0, fx)
    place_back(m)
    return m

# ---------------------------------------------------------------- fox tails (back slot)
def tails(name, P_):
    """P_: n (tail count), base, tip (fur colours), glow (fox-fire tip colour or None), fx, fxcol, soft."""
    m = BB(name, Atlas(256, 256)); k = Kit(m)
    nT = P_.get('n', 9); base, tipc, glow = P_['base'], P_['tip'], P_.get('glow')
    mixes = [0.0, 0.0, 0.05, 0.12, 0.45, 0.85]
    furs = [k.main('fur%d' % i, P.facet(8, 8, P.mixc(base, tipc, mixes[i]), P.shade(P.mixc(base, tipc, mixes[i]), 0.82))) for i in range(6)]
    tip_g = k.glow('tipg', P.facet(8, 8, glow, P.shade(glow, 0.8))) if glow else None
    root = (0.0, -20.0, -1.0)
    m.bone('tails', list(root))
    W_ = [2.6, 4.2, 5.2, 5.6, 5.0, 3.8, 2.2]; Ls = [4.0, 4.6, 5.0, 5.0, 4.6, 4.0, 3.0]
    chains = []
    for ti in range(nT):
        f = ti / max(1, nT - 1) - 0.5
        fan = -f * (130 if nT > 5 else 100)                         # spread left/right
        back = 32 + 10 * math.cos(f * math.pi)                       # lean back from the body
        parent = 'tails'; y = root[1]; z = root[2] - 0.2 * (ti % 2)
        chain = []
        for si in range(7):
            b = m.bone('t%d_%d' % (ti, si), [0, y, z], parent); chain.append(b)
            w = W_[si]; L = Ls[si]
            uv = tip_g if (glow and si >= 5) else furs[min(5, si)]
            m.box(b, [-w / 2, y, z - w / 2], [w / 2, y + L, z + w / 2], uv, uv)
            # tufts: a slightly bigger, flatter shell on alternate segments for a fluffy outline
            if si in (2, 4):
                m.box(b, [-w / 2 - 0.4, y + 0.6, z - w / 2 + 0.3], [w / 2 + 0.4, y + L - 0.6, z + w / 2 - 0.3], furs[min(5, si + 1)], furs[min(5, si + 1)])
            parent = b; y += L * 0.92
        chains.append((chain, fan, back, ti))
    if P_.get('soft'):
        su = k.soft('soft', P.soft(48, 48, P_['soft'], peak=60))
        m.plate('tails', [-16, -22, 0.2], [16, 6, 0.3], su)
    fx = None
    if P_.get('fx'):
        fx = Particles(m, None, 3.0)
        fl = k.glow('ff', P.dot(P_.get('fxcol', glow or (255, 255, 255)), 3, core=(255, 255, 255)))
        rnd = random.Random(name)
        for i in range(10):
            x = rnd.uniform(-16, 16); y = rnd.uniform(-8, 2)
            fx.add([x, y, -4.0], [rnd.uniform(-1, 1), rnd.uniform(6, 10), -1], 0.8, fl, i / 10, spin=200)
    def build(c):
        wv = {'idle': 70, 'walk': 100, 'run': 150, 'jump': 120, 'fly': 120}[c]
        amp = {'idle': 7, 'walk': 9, 'run': 6, 'jump': 12, 'fly': 10}[c]
        lean = {'idle': 0, 'walk': 5, 'run': 22, 'jump': 10, 'fly': 30}[c]
        tr = {}
        for chain, fan, back, ti in chains:
            for si, b in enumerate(chain):
                ph = si * 32 + ti * 47
                if si == 0:
                    tr[b] = {'rotation': [(0, f'-{back + lean}+math.sin(query.anim_time*{wv}*0.8-{ti * 40})*3', 0, f'{fan:.1f}+math.sin(query.anim_time*{wv}-{ti * 40})*{amp * 0.6:.1f}')]}
                else:   # curl back and sway in a travelling wave
                    tr[b] = {'rotation': [(0, f'6+math.sin(query.anim_time*{wv}*0.9-{ph})*4', 0, f'math.sin(query.anim_time*{wv}-{ph})*{amp}')]}
        return tr
    clips(m, build, 3.0, fx)
    place_back(m, root_y=-15.0, want=5.0)
    return m


# ---------------------------------------------------------------- DIVINE SOVEREIGN (flagship, in the style of layered
# seraph wings with gold blades and a rotating sigil): 3 pairs of feathered wings, gold blade arcs, a two-layer magic circle
# that counter-rotates, orbiting orbs, gold sparkles rising and feathers drifting down.
def xform(p, k, th, dy=0.0, dz=0.0):
    c, s_ = math.cos(math.radians(th)), math.sin(math.radians(th))
    x, y = (p[0] - S[0]) * k, (p[1] - S[1]) * k
    return [S[0] + x * c - y * s_, S[1] + x * s_ + y * c + dy, p[2] + dz]

def arc(m, bone, pts, w0, w1, uv, side, guv=None, z=0.0):
    """A tapered curved blade along a list of (x, y, z) points."""
    n = len(pts) - 1
    for i in range(n):
        t = i / max(1, n - 1); w = w0 + (w1 - w0) * t
        A = list(pts[i]); B = list(pts[i + 1]); A[2] += z; B[2] += z
        seg(m, bone, X(A, side), X(B, side), w, uv, uv, thz=0.6, guv=guv if t > 0.55 else None)

def bez3(a, b, c, n=10):
    return [[(1 - t) ** 2 * a[i] + 2 * (1 - t) * t * b[i] + t * t * c[i] for i in range(3)] for t in [j / n for j in range(n + 1)]]

def divine(name, P_):
    m = BB(name, Atlas(512, 512)); k = Kit(m)
    root, tip, streak, gold = P_['root'], P_['tip'], P_.get('streak'), P_['gold']
    light, dark = P_.get('gold_light', (255, 250, 200)), P_.get('gold_dark', (150, 95, 15))
    prim = k.sprite('prim', lambda: P.feather(12, 84, root, tip, (255, 255, 255), None, 'primary', glow_tip=P_.get('glow'), streak=streak, seed=1))
    sec = k.sprite('sec', lambda: P.feather(12, 64, root, P.mixc(root, tip, 0.8), (255, 255, 255), None, 'secondary', streak=streak, seed=2))
    cov = k.sprite('cov', lambda: P.feather(10, 32, (255, 255, 255), P.mixc(root, tip, 0.4), (255, 255, 255), None, 'covert', streak=streak, seed=3))
    small = k.sprite('small', lambda: P.feather(8, 14, (255, 255, 255), root, None, None, 'covert', seed=4))
    import armorart as AA
    gmain = k.main('gold', AA.gold(8, 16, {'gold': gold})[0]); gdark = k.main('golddk', AA.gold(8, 8, {'gold': P.shade(gold, 0.7)})[0])
    gglow = k.glow('goldg', AA.gold(8, 16, {'gold': gold})[0])
    layers = [('', 1.0, 0, 0.0, 0.0, (11, 9, 12, 8)), ('b', 0.8, -30, -1.5, 0.7, (9, 7, 9, 6)), ('c', 0.6, -64, -3.0, 1.3, (7, 5, 7, 0))]
    prims = {}
    for pre, kk, th, dy, dz, (NP, NS, NG, NM) in layers:
        Sx, Ex, Wx, Hx = [xform(p, kk, th, dy, dz) for p in (S, E, W, H)]
        for s, n in ((1, 'r'), (-1, 'l')):
            wb, mb, hb = skeleton(m, n, s, pre=pre, pts=(Sx, Ex, Wx))
            seg(m, wb, X(Sx, s), X(Ex, s), 1.4 * kk, gmain, gdark); seg(m, mb, X(Ex, s), X(Wx, s), 1.2 * kk, gmain, gdark); seg(m, hb, X(Wx, s), X(Hx, s), 1.0 * kk, gmain, gdark)
            pl = []
            for i in range(NP):
                t = i / (NP - 1); R = lerp3(Wx, Hx, 0.05 + 0.95 * t); R[2] += 0.35 + 0.03 * i
                pb = m.bone(pre + 'p%d_%s' % (i, n), X(R, s), hb); pl.append(pb)
                L = (20 + 11 * math.sin(min(1, t * 1.1) * math.pi * 0.6)) * kk
                hang(m, pb, X(R, s), L, 3.6 * max(0.8, kk), s * (28 + 98 * t ** 1.1 + th), prim[0], prim[1], side=s)
            prims[pre + n] = pl
            for i in range(NS):
                t = i / (NS - 1); R = lerp3(Ex, Wx, t); R[2] += 0.25 - 0.02 * i
                hang(m, mb, X(R, s), (17 + 4 * t) * kk, 3.8 * max(0.8, kk), s * (0 + 24 * t + th), sec[0], sec[1], side=s)
            for i in range(NG):
                t = i / (NG - 1); R = lerp3(Sx, Hx, 0.04 + 0.9 * t); R[2] -= 0.45 + 0.01 * i
                b = wb if t < 0.33 else (mb if t < 0.62 else hb)
                ang = (24 * t / 0.62) if t < 0.62 else (24 + 84 * (t - 0.62) / 0.38)
                hang(m, b, X(R, s), (9 + 3 * t) * kk, 3.4 * max(0.8, kk), s * (ang + th), cov[0], cov[1], side=s)
            for i in range(NM):
                t = i / max(1, NM - 1); R = lerp3(Sx, Hx, 0.02 + 0.8 * t); R[2] -= 0.85
                b = wb if t < 0.33 else (mb if t < 0.62 else hb)
                hang(m, b, X(R, s), 5 * kk, 3.0, s * (4 + 70 * t ** 1.5 + th), small[0], None, side=s)
            if pre in ('', 'b'):   # sweeping gold blades along the wing
                a1 = bez3(xform((E[0] - 1, E[1] + 1.5, E[2] - 1.7), kk, th, dy, dz), xform((W[0] + 4, W[1] + 9, W[2] - 1.7), kk, th, dy, dz), xform((35, 8, W[2] - 1.7), kk, th, dy, dz), 14)
                arc(m, hb, a1, 2.2 * kk, 0.4, gmain, s, gglow)
                a2 = bez3(xform((W[0] + 1, W[1] - 4, W[2] - 1.5), kk, th, dy, dz), xform((24, -2, W[2] - 1.5), kk, th, dy, dz), xform((33, -12, W[2] - 1.5), kk, th, dy, dz), 10)
                arc(m, hb, a2, 1.5 * kk, 0.3, gmain, s, gglow)
    # the sigil: two rotating glowing discs in front of the wing roots, a soft glow and four orbiting orbs
    cy, cz = -12.0, -6.0
    m.bone('sigil', [0, cy, cz]); m.bone('sig_o', [0, cy, cz], 'sigil'); m.bone('sig_i', [0, cy, cz], 'sigil')
    uo = k.glow('circ_o', P.magic_circle(112, gold, light, dark, 'outer'))
    ui = k.glow('circ_i', P.magic_circle(112, gold, light, dark, 'inner'))
    R1, R2 = 13.0, 9.5
    m.plate('sig_o', [-R1, cy - R1, cz - 0.05], [R1, cy + R1, cz + 0.05], uo)
    m.plate('sig_i', [-R2, cy - R2, cz - 0.25], [R2, cy + R2, cz - 0.15], ui)
    orb = k.glow('orb', P.dot(light, 3, core=(255, 255, 255)))
    for i in range(4):
        a = math.radians(45 + i * 90); x, y = math.cos(a) * (R1 + 1.6), cy + math.sin(a) * (R1 + 1.6)
        m.box('sig_o', [x - 0.8, y - 0.8, cz - 0.8], [x + 0.8, y + 0.8, cz + 0.8], orb, orb, origin=[x, y, cz], rotation=[0, 0, 45])
    sft = k.soft('sig_soft', P.soft(64, 64, gold, peak=70))
    m.plate('sigil', [-17, cy - 17, cz + 1.0], [17, cy + 17, cz + 1.1], sft)
    # particles: gold sparkles drifting up, white feathers drifting down
    fx = Particles(m, None, 4.0); rnd = random.Random(name)
    sp = k.glow('spark', P.dot((255, 225, 120), 3, core=(255, 255, 255)))
    for i in range(14):
        x = rnd.uniform(-28, 28); y = rnd.uniform(-26, 0)
        fx.add([x, y, -4.0], [rnd.uniform(-1, 1), rnd.uniform(5, 11), -rnd.uniform(0, 2)], 0.7, sp, i / 14, spin=150)
    fu = k.sprite('fxf', lambda: P.feather(6, 12, (255, 255, 255), root, None, None, 'covert', seed=9))[0]
    for i in range(6):
        s = 1 if i % 2 else -1
        fx.add([s * rnd.uniform(8, 24), rnd.uniform(-6, 2), -3.0], [s * rnd.uniform(1, 4), -15, -2], 2.2, mir(fu, s), i / 6 + 0.03, sway=25, plate=True)
    def build(c):
        tr = {}
        for li, (pre, kk, th, dy, dz, _) in enumerate(layers):
            for s, n in ((1, 'r'), (-1, 'l')):
                tr.update(flap_tracks(c, n, s, prims[pre + n], pre=pre, ph=li * 35, amp=1.0 - li * 0.2))
        spd = 2.0 if c in ('fly', 'jump') else 1.0
        tr['sig_o'] = {'rotation': [(0, 0, 0, f'query.anim_time*{18 * spd}')]}
        tr['sig_i'] = {'rotation': [(0, 0, 0, f'-query.anim_time*{30 * spd}')]}
        tr['sigil'] = {'position': [(0, 0, 'math.sin(query.anim_time*90)*0.4', 0)]}
        return tr
    clips(m, build, 4.0, fx)
    place_back(m)
    return m
