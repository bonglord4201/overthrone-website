# OVERTHRONE v7 pets: rebuilt so they really move.
# What the mod does with a pet (manas_cosmetics 1.0.6, PetCosmeticEntity + PlayerAnimContext.fromEntity + PetCosmeticRenderer):
#   - "floats": true -> no gravity, flying navigation: the pet is always airborne, so it only ever plays "fly".
#   - floats false  -> it walks after you on the ground: "idle" / "walk" (speed > 0.02) / "run" (> 0.18), "fly" while it is
#     in the air (jumping down, or the mod's own short flight after it keeps teleporting), "swim" in water.
#   - "special" / "special2" play now and then while it stands still (or hovers), once, for the clip's length.
# So ground animals (foxes, dragonlings, slimes) are NOT floats now and get real gaits; birds/spirits/jellies float and get
# a fly clip that looks right both hovering and moving.
# Frame: Y up from the feet (y=0), -Z = the pet's front. Kept inside 16 px tall / 32 px long (the mod shrinks bigger pets).
# Bone rotations here (checked in sim.py): +X pitches the -Z end UP (nose up), swings a leg's foot FORWARD, tips an ear BACK,
# and opens a jaw when NEGATIVE.
import math, random
import numpy as np
from PIL import Image
from bb import BB, Atlas, UV
import paint as P
from fx import Kit, Particles, clips
from heads4 import horn_path
import pets4 as P4
import pets6 as P6

S = 'math.sin(query.anim_time*%s)'
def sn(freq, ph=0, amp=1.0, off=0.0):
    """Molang: off + amp*sin(t*freq + ph) (degrees)."""
    e = 'math.sin(query.anim_time*%g%s)' % (freq, ('+%g' % ph) if ph else '')
    return ('%g+%s*%g' % (off, e, amp)) if off else ('%s*%g' % (e, amp))
def up(freq, ph=0, amp=1.0, off=0.0):
    """Molang: off + amp*max(0, sin(t*freq + ph)) (the lifting half of a stride)."""
    e = 'math.clamp(math.sin(query.anim_time*%g%s))' % (freq, ('+%g' % ph) if ph else '')
    return ('%g+%s*%g' % (off, e, amp)) if off else ('%s*%g' % (e, amp))

# ------------------------------------------------------------------ painted skins
def _rng(seed): return np.random.default_rng(abs(hash(('p7', seed))) % (2 ** 32))
def _img(rgb): a = np.clip(rgb, 0, 255).astype(np.uint8); return Image.fromarray(np.dstack([a, np.full(a.shape[:2], 255, np.uint8)]), 'RGBA')
def fur_tex(w, h, base, light, dark, seed=0, face='side'):
    """Soft fur: lit from above, darker underneath, fine hair strands and a few tufts."""
    r = _rng((seed, w, h, face)); Y, X = np.mgrid[0:h, 0:w].astype(float); t = Y / max(1, h - 1)
    b, l, d = (np.array(c, float) for c in (base, light, dark))
    if face == 'top': col = l * 0.55 + b * 0.45 + 0 * Y[..., None]
    elif face == 'bot': col = d * 0.7 + b * 0.3 + 0 * Y[..., None]
    else: col = (l * (1 - t[..., None]) * 0.5 + b * 0.5 + b * 0.25 * (1 - t[..., None])) * (1 - 0.18 * t[..., None])
    strand = ((X + np.sin(Y * 1.3 + r.random() * 6) * 1.2 + r.random((h, w)) * 0.8) % 3.0) < 1.0
    col = np.where(strand[..., None], col * 0.86, col * 1.04)
    tuft = r.random((h, w)) > 0.93
    col = np.where(tuft[..., None], col * 1.15 + 10, col)
    return _img(col)

def scale_tex(w, h, base, seed=0, face='side'):
    img = P6.scales_tex(w, h, base if face != 'bot' else P.shade(base, 0.7))
    return img

class Skin:
    """Per-face textures for one material: side (top-lit gradient), top (light), bot (dark), and an optional front."""
    def __init__(self, k, key, base, light=None, dark=None, kind='fur', glow=False, seed=0):
        light = light or tuple(int(v) for v in P.mixc(base, (255, 255, 255), 0.35)); dark = dark or tuple(int(v) for v in P.shade(base, 0.6))
        add = k.glow if glow else k.main
        if kind == 'fur':
            self.side = add(key + 's', fur_tex(16, 16, base, light, dark, seed, 'side'))
            self.top = add(key + 't', fur_tex(16, 16, base, light, dark, seed, 'top'))
            self.bot = add(key + 'b', fur_tex(16, 16, base, light, dark, seed, 'bot'))
        elif kind == 'scale':
            self.side = add(key + 's', scale_tex(16, 16, base, seed)); self.top = add(key + 't', scale_tex(16, 16, tuple(int(v) for v in P.mixc(base, light, 0.3)), seed))
            self.bot = add(key + 'b', scale_tex(16, 16, base, seed, 'bot'))
        else:   # flat facet (horns, claws, glow)
            self.side = add(key + 's', P.facet(4, 8, light, dark)); self.top = add(key + 't', P.facet(4, 4, light, base)); self.bot = add(key + 'b', P.facet(4, 4, base, dark))
        self.front = self.side
def cub(m, bone, f, t, sk, front=None, back=None, origin=None, rotation=None):
    F = P4.F
    faces = {'north': F(front or sk.front), 'south': F(back or sk.side), 'east': F(sk.side), 'west': F(sk.side), 'up': F(sk.top), 'down': F(sk.bot)}
    return m.cube(bone, [min(f[i], t[i]) for i in range(3)], [max(f[i], t[i]) for i in range(3)], faces, origin, rotation)
def rnd_box(m, bone, c, r, sk, k=0.7):
    """Rounded volume (3 crossing boxes)."""
    x, y, z = c; rx, ry, rz = r
    cub(m, bone, [x - rx, y - ry * k, z - rz * k], [x + rx, y + ry * k, z + rz * k], sk)
    cub(m, bone, [x - rx * k, y - ry, z - rz * k], [x + rx * k, y + ry, z + rz * k], sk)
    cub(m, bone, [x - rx * k, y - ry * k, z - rz], [x + rx * k, y + ry * k, z + rz], sk)

def sparks(m, k, col, n, region, rise, size=0.5, L=3.0, name='p', spin=160):
    fx = Particles(m, None, L, name); rr = random.Random(m.name + name)
    g = k.glow(name + 'dot', P.dot(col, 3, core=(255, 255, 255)))
    (x0, x1), (y0, y1), (z0, z1) = region
    for i in range(n):
        fx.add([rr.uniform(x0, x1), rr.uniform(y0, y1), rr.uniform(z0, z1)], [rr.uniform(-0.8, 0.8), rr.uniform(*rise), rr.uniform(-0.6, 1.2)], size, g, i / n, spin=spin)
    return fx

class Multi:
    """Several Particles groups added to every clip."""
    def __init__(self, *groups): self.g = [x for x in groups if x is not None]
    def add_tracks(self, tr):
        for x in self.g: x.add_tracks(tr)
        return tr

def blink(L, at): return P4.blink_keys(L, at)

# ================================================================== QUADRUPED (fox / kitsune / dragonling)
def _leg(m, bone_name, parent, hip, length, w, sk, paw_sk, claw=None, front=True, toes=True):
    """Two-part leg: upper (pivot at the hip/shoulder) and lower (pivot at the knee), paw with toes. Returns (upper, lower)."""
    x, y, z = hip
    ub = m.bone(bone_name, [x, y, z], parent)
    knee = y - length * 0.52
    cub(m, ub, [x - w * 0.62, knee - 0.2, z - w * 0.7], [x + w * 0.62, y + 0.6, z + w * 0.7], sk)              # thigh / upper arm
    lb = m.bone(bone_name + '_lo', [x, knee, z + (0.2 if front else -0.2)], ub)
    cub(m, lb, [x - w * 0.45, 0.7, z - w * 0.45], [x + w * 0.45, knee + 0.2, z + w * 0.45], sk)                # shin
    cub(m, lb, [x - w * 0.55, 0.0, z - w * 0.85], [x + w * 0.55, 0.8, z + w * 0.5], paw_sk)                     # paw
    if toes:
        for tx in (-0.32, 0.0, 0.32):
            cub(m, lb, [x + tx * w - 0.17, 0.0, z - w * 0.98], [x + tx * w + 0.17, 0.45, z - w * 0.8], claw or paw_sk)
    return ub, lb

def gait_tracks(tr, legs, clip, stride=480, amp=24):
    """legs: list of (upper, lower, phase_deg, front). Walk: diagonal pairs; run: bounding gallop."""
    for ub, lb, ph, front in legs:
        if clip == 'walk':
            tr[ub] = {'rotation': [(0, sn(stride, ph, amp), 0, 0)]}
            tr[lb] = {'rotation': [(0, up(stride, ph + (90 if front else -90), -30 if front else -26), 0, 0)]}
        elif clip == 'run':
            tr[ub] = {'rotation': [(0, sn(stride, ph, amp * 1.7), 0, 0)]}
            tr[lb] = {'rotation': [(0, up(stride, ph + (90 if front else -90), -48 if front else -42), 0, 0)]}
        elif clip == 'swim':
            tr[ub] = {'rotation': [(0, sn(stride * 1.2, ph, 35, 15), 0, 0)]}
            tr[lb] = {'rotation': [(0, up(stride * 1.2, ph + 90, -40), 0, 0)]}

def fox7(name, fur, light, dark, iris, tails=1, glow=None, spirit=False, socks=None, ear_tip=None, fx='foxfire'):
    m = BB(name, Atlas(256, 256)); k = Kit(m)
    sk = Skin(k, 'fur', fur, seed=1); lt = Skin(k, 'lt', light, seed=2); dk = Skin(k, 'dk', socks or dark, seed=3)
    gl = Skin(k, 'gl', glow, kind='flat', glow=True) if glow else lt
    pink = k.main('pink', P.facet(4, 4, (255, 190, 200), (230, 130, 150))); nose = k.main('nose', P.facet(4, 4, (70, 50, 60), (15, 10, 15)))
    face = k.main('face', fur_tex(16, 16, P.shade(fur, 1.08), P.mixc(fur, (255, 255, 255), 0.4), fur, 9, 'side'))
    # ---- body (root bone, pivot at the hips' height so it pitches nicely)
    m.bone('body', [0, 6.0, 0])
    rnd_box(m, 'body', (0, 6.2, -0.4), (2.3, 1.9, 3.6), sk, 0.78)                     # torso
    rnd_box(m, 'body', (0, 6.4, 2.4), (2.4, 2.0, 1.6), sk, 0.8)                       # haunches
    cub(m, 'body', [-1.7, 4.3, -3.8], [1.7, 7.3, -2.6], lt)                            # chest ruff
    cub(m, 'body', [-1.3, 3.9, -3.6], [1.3, 4.6, -1.0], lt)
    cub(m, 'body', [-1.6, 4.25, -1.5], [1.6, 4.6, 2.6], lt)                            # belly
    cub(m, 'body', [-0.9, 8.05, -2.6], [0.9, 8.3, 2.8], Skin(k, 'stripe', P.shade(fur, 0.82), seed=4))   # darker back stripe
    if spirit:
        for z in (-1.6, 0.4, 2.2): cub(m, 'body', [-0.35, 8.2, z - 0.35], [0.35, 8.45, z + 0.35], gl)
        for s in (-1, 1): cub(m, 'body', [s * 2.35 - 0.1, 6.0, -1.8], [s * 2.35 + 0.1, 6.4, 1.6], gl)
    legs = []
    for s, n in ((-1, 'l'), (1, 'r')):
        ub, lb = _leg(m, 'leg_f' + n, 'body', (s * 1.35, 5.4, -2.3), 5.4, 1.5, sk, dk, front=True); legs.append((ub, lb, 0 if s < 0 else 180, True))
        ub, lb = _leg(m, 'leg_b' + n, 'body', (s * 1.5, 5.8, 2.6), 5.8, 1.8, sk, dk, front=False); legs.append((ub, lb, 180 if s < 0 else 0, False))
    # ---- neck + head
    m.bone('neck', [0, 7.4, -3.0], 'body')
    cub(m, 'neck', [-2.0, 6.6, -4.6], [2.0, 9.4, -2.6], lt)                            # neck ruff
    cub(m, 'neck', [-1.6, 8.6, -4.2], [1.6, 9.9, -2.8], sk)
    m.bone('head', [0, 9.4, -4.2], 'neck')
    cub(m, 'head', [-2.5, 8.3, -7.3], [2.5, 12.0, -3.7], sk, front=face)               # skull
    cub(m, 'head', [-2.1, 11.9, -6.8], [2.1, 12.4, -4.0], sk)                          # crown
    for s in (-1, 1):                                                                   # cheek fluff (layered)
        cub(m, 'head', [s * 2.4 - 0.45, 8.1, -6.4], [s * 2.4 + 0.45, 10.0, -4.2], lt)
        cub(m, 'head', [s * 2.85 - 0.3, 8.0, -5.6], [s * 2.85 + 0.3, 9.2, -4.6], lt)
    cub(m, 'head', [-1.35, 8.3, -9.5], [1.35, 9.7, -7.2], lt, front=lt.side)            # muzzle
    cub(m, 'head', [-1.0, 9.6, -9.0], [1.0, 10.1, -7.2], sk)                            # bridge
    cub(m, 'head', [-0.5, 9.25, -9.7], [0.5, 9.85, -9.45], Skin(k, 'nose', (40, 28, 34), kind='flat'), front=nose)
    m.bone('jaw', [0, 8.6, -7.2], 'head')
    cub(m, 'jaw', [-1.15, 8.05, -9.2], [1.15, 8.55, -7.2], lt)
    P4.eyes(m, k, 'eyes', [0, 10.45, -7.33], 4.6, 1.9, iris, 'sharp', 0.58, 0.33, 0.9, parent='head')
    if spirit:
        cub(m, 'head', [-0.3, 11.0, -7.36], [0.3, 11.9, -7.3], gl)
        for s in (-1, 1): cub(m, 'head', [s * 1.9 - 0.25, 8.9, -7.36], [s * 1.9 + 0.25, 9.6, -7.3], gl)
    tip = Skin(k, 'eartip', ear_tip or dark, kind='flat', glow=bool(glow and spirit)) if (ear_tip or True) else dk
    for s, n in ((-1, 'l'), (1, 'r')):
        eb = m.bone('ear_' + n, [s * 1.55, 12.0, -5.2], 'head')
        cub(m, eb, [s * 1.55 - 1.15, 11.9, -5.85], [s * 1.55 + 1.15, 13.3, -4.75], sk)
        cub(m, eb, [s * 1.55 - 0.8, 13.3, -5.7], [s * 1.55 + 0.8, 14.4, -4.85], sk)
        cub(m, eb, [s * 1.55 - 0.42, 14.4, -5.55], [s * 1.55 + 0.42, 15.2, -5.0], tip)
        m.plate(eb, [s * 1.55 - 0.7, 12.1, -5.92], [s * 1.55 + 0.7, 14.1, -5.86], pink if not spirit else (gl.side if glow else pink))
    # ---- tails: fanned chains, getting fluffier then a bright tip
    tl = []
    for ti in range(tails):
        f = (ti / (tails - 1) - 0.5) if tails > 1 else 0.0
        base = m.bone('tail%d' % ti, [0, 7.2, 3.6], 'body')   # fan angle comes from the clips (animated bones keep no rest rotation)
        y, z, par, chain = 7.2, 3.6, base, []
        for si, (wd, ln) in enumerate([(1.3, 1.6), (2.0, 2.0), (2.6, 2.2), (2.7, 2.2), (2.2, 1.8), (1.3, 1.4)]):
            b = base if si == 0 else m.bone('tail%d_%d' % (ti, si), [0, y, z], par)
            msk = (gl if (glow and spirit) else lt) if si >= 4 else sk
            cub(m, b, [-wd / 2, y - wd / 2, z], [wd / 2, y + wd / 2, z + ln], msk)
            if si in (2, 3): cub(m, b, [-wd / 2 - 0.25, y - wd / 2 + 0.3, z + 0.3], [wd / 2 + 0.25, y + wd / 2 - 0.3, z + ln - 0.3], msk)   # side fluff
            chain.append(b); par = b; z += ln * 0.92
        tl.append((chain, ti, f))
    m.flat('body', [-6, 0.05, -7], [6, 0.07, 7], k.soft('shadow', P.soft(32, 32, glow or (0, 0, 0), peak=70 if glow else 55)))
    fxo = None
    if fx == 'foxfire' and glow:
        fxo = Multi(sparks(m, k, glow, 7, ((-4, 4), (7, 12), (4, 12)), (2, 4), 0.6, name='ff'),
                    sparks(m, k, P.mixc(glow, (255, 255, 255), 0.6), 4, ((-2, 2), (3, 6), (-3, 3)), (1, 3), 0.4, name='fs'))
    L = 3.0

    def tails_tr(tr, freq, amp, lift, stream=0):
        for chain, ti, f in tl:
            for si, b in enumerate(chain):
                ph = si * 32 + ti * 47
                if si == 0:
                    tr[b] = {'rotation': [(0, sn(freq * 0.5, ti * 40, 5, -lift), sn(freq, -ti * 35, amp * 0.6, f * 70), 0)]}
                else:
                    tr[b] = {'rotation': [(0, sn(freq * 0.5, -ph, 4, stream - 4), sn(freq, -ph, amp * (0.5 + si * 0.15)), 0)]}

    def build(c):
        tr = {'eyes': {'scale': blink(L, 0.45)}}
        if c == 'idle':
            tr['body'] = {'scale': [(0, 1, sn(120, 0, 0.018, 1), 1)]}
            tr['neck'] = {'rotation': [(0, 0, 0, 0), (0.6, 0, 18, 0), (1.3, 0, 18, 0), (1.6, -6, -12, 6), (2.4, -6, -12, 6), (L, 0, 0, 0)]}
            tr['head'] = {'rotation': [(0, 0, 0, 0), (1.6, 0, 0, 0), (1.8, 0, 0, 12), (2.4, 0, 0, 12), (2.6, 0, 0, 0), (L, 0, 0, 0)]}
            tr['ear_l'] = {'rotation': [(0, 0, 0, 0), (0.9, 0, 0, 0), (0.98, 18, 0, -14), (1.1, 0, 0, 0), (L, 0, 0, 0)]}
            tr['ear_r'] = {'rotation': [(0, 0, 0, 0), (2.1, 0, 0, 0), (2.18, 18, 0, 14), (2.3, 0, 0, 0), (L, 0, 0, 0)]}
            tails_tr(tr, 120, 14, 20)
        elif c in ('walk', 'run', 'swim'):
            fr = {'walk': 480, 'run': 840, 'swim': 360}[c]
            gl_ = [(u, l_, (ph if c != 'run' else (0 if fr_ else 180) + (30 if 'r' == u[-1] else 0)), fr_) for (u, l_, ph, fr_) in legs]
            gait_tracks(tr, gl_, c, fr, 24)
            if c == 'walk':
                tr['body'] = {'position': [(0, 0, 'math.abs(%s)*0.35' % (S % fr), 0)], 'rotation': [(0, 0, 0, sn(fr, 0, 2.2))]}
                tr['neck'] = {'rotation': [(0, sn(fr * 2, 40, 2.5), sn(fr, 90, 4), 0)]}
                tails_tr(tr, fr, 16, 18)
                tr['ear_l'] = {'rotation': [(0, sn(fr * 2, 0, 4, 6), 0, 0)]}; tr['ear_r'] = {'rotation': [(0, sn(fr * 2, 0, 4, 6), 0, 0)]}
            elif c == 'run':
                tr['body'] = {'position': [(0, 0, sn(fr, 0, 0.7, 0.5), 0)], 'rotation': [(0, sn(fr, 90, 7), 0, 0)]}
                tr['neck'] = {'rotation': [(0, sn(fr, 270, 6, 8), 0, 0)]}
                tails_tr(tr, fr, 8, -10, stream=-6)
                tr['ear_l'] = {'rotation': [(0, 35, 0, -12)]}; tr['ear_r'] = {'rotation': [(0, 35, 0, 12)]}
            else:   # swim: low in the water, head up, paddling
                tr['body'] = {'position': [(0, 0, sn(240, 0, 0.3, -2.4), 0)], 'rotation': [(0, 8, 0, 0)]}
                tr['neck'] = {'rotation': [(0, 12, 0, 0)]}
                tails_tr(tr, 240, 20, 0)
        elif c == 'fly':   # in the air (jumping down / the mod's catch-up flight): legs stretched, tails streaming
            for ub, lb, ph, front in legs:
                tr[ub] = {'rotation': [(0, sn(300, ph, 8, 45 if front else -45), 0, 0)]}
                tr[lb] = {'rotation': [(0, -20 if front else 0, 0, 0)]}
            tr['body'] = {'rotation': [(0, sn(150, 0, 4, -6), 0, sn(120, 0, 4))], 'position': [(0, 0, sn(150, 0, 0.6), 0)]}
            tr['neck'] = {'rotation': [(0, 8, 0, 0)]}
            tr['ear_l'] = {'rotation': [(0, 40, 0, -10)]}; tr['ear_r'] = {'rotation': [(0, 40, 0, 10)]}
            tails_tr(tr, 300, 12, -20, stream=-8)
        elif c == 'special':   # sits down, tilts its head, wags its tail(s), stands back up
            K = [(0, 0), (0.35, 1), (2.3, 1), (2.7, 0), (L, 0)]
            def key(v): return [(t, round(v[0] * a, 2), round(v[1] * a, 2), round(v[2] * a, 2)) for t, a in K]
            tr['body'] = {'rotation': key((28, 0, 0)), 'position': key((0, -1.4, 0.6))}
            tr['neck'] = {'rotation': key((-14, 0, 0))}
            tr['head'] = {'rotation': [(0, 0, 0, 0), (0.6, 0, 0, 0), (0.8, 0, 0, 18), (1.4, 0, 0, 18), (1.6, 0, 0, -14), (2.1, 0, 0, -14), (2.3, 0, 0, 0), (L, 0, 0, 0)]}
            for ub, lb, ph, front in legs:
                tr[ub] = {'rotation': key((-28, 0, 0) if front else (40, 0, 0))}
                tr[lb] = {'rotation': key((0, 0, 0) if front else (-80, 0, 0))}
            tails_tr(tr, 900, 26, 5)
            tr['jaw'] = {'rotation': [(0, 0, 0, 0), (0.9, 0, 0, 0), (1.0, -14, 0, 0), (1.3, -14, 0, 0), (1.4, 0, 0, 0), (L, 0, 0, 0)]}
        elif c == 'special2':   # play bow, a little hop and a happy spin
            tr['body'] = {'rotation': [(0, 0, 0, 0), (0.3, -18, 0, 0), (1.0, -18, 0, 0), (1.25, 0, 0, 0), (1.5, 0, -180, 0), (1.8, 0, -360, 0), (L, 0, -360, 0)],
                          'position': [(0, 0, 0, 0), (0.3, 0, -0.8, 0), (1.0, 0, -0.8, 0), (1.25, 0, 0, 0), (1.5, 0, 3.0, 0), (1.8, 0, 0, 0), (2.0, 0, 0.6, 0), (2.15, 0, 0, 0), (L, 0, 0, 0)]}
            for ub, lb, ph, front in legs:
                if front:
                    tr[ub] = {'rotation': [(0, 0, 0, 0), (0.3, 62, 0, 0), (1.0, 62, 0, 0), (1.25, 0, 0, 0), (L, 0, 0, 0)]}
                    tr[lb] = {'rotation': [(0, 0, 0, 0), (0.3, 10, 0, 0), (1.0, 10, 0, 0), (1.25, 0, 0, 0), (L, 0, 0, 0)]}
                else:
                    tr[ub] = {'rotation': [(0, 0, 0, 0), (1.25, 0, 0, 0), (1.5, -30, 0, 0), (1.8, 0, 0, 0), (L, 0, 0, 0)]}
            tr['neck'] = {'rotation': [(0, 0, 0, 0), (0.3, -20, 0, 0), (1.0, -20, 0, 0), (1.25, 0, 0, 0), (L, 0, 0, 0)]}
            tails_tr(tr, 960, 28, 30)
        return tr
    clips(m, build, L, fxo, names=('idle', 'walk', 'run', 'fly', 'swim', 'special', 'special2'))
    return m

# ------------------------------------------------------------------ dragonling (walks; flaps when airborne)
def dragon7(name, body, belly, wing, horn, glow, iris, fx_col=None, frill=None):
    m = BB(name, Atlas(256, 256)); k = Kit(m)
    sc = Skin(k, 'sc', body, kind='scale'); bl = Skin(k, 'bl', belly, kind='fur', seed=5)
    bl.side = bl.top = bl.bot = bl.front = k.main('belly', P6.scales_tex(12, 16, belly, belly=True))
    hn = Skin(k, 'hn', horn, kind='flat'); gl = Skin(k, 'gl', glow, kind='flat', glow=True)
    claw = Skin(k, 'claw', (235, 228, 210), kind='flat'); dark = Skin(k, 'dark', (22, 14, 16), kind='flat')
    face = k.main('face', P6.scales_tex(16, 16, tuple(int(v) for v in P.shade(body, 1.12))))
    m.bone('body', [0, 6.2, 0])
    rnd_box(m, 'body', (0, 6.3, 0.5), (2.6, 2.2, 3.4), sc, 0.75)
    rnd_box(m, 'body', (0, 6.6, -2.3), (2.3, 2.2, 1.7), sc, 0.75)                     # chest
    cub(m, 'body', [-1.8, 4.1, -3.9], [1.8, 7.8, -3.5], bl); cub(m, 'body', [-1.9, 3.95, -3.4], [1.9, 4.45, 3.0], bl)
    spikes = []
    for i in range(6):   # back spikes: alternate glowing ones, tilted back
        z = -2.6 + i * 1.15
        h_ = 1.6 - abs(i - 2) * 0.18
        cub(m, 'body', [-0.32, 8.2, z - 0.4], [0.32, 8.4 + h_, z + 0.4], gl if i % 2 == 0 else hn, origin=[0, 8.3, z], rotation=[-28, 0, 0])
    legs = []
    for s, n in ((-1, 'l'), (1, 'r')):
        ub, lb = _leg(m, 'leg_f' + n, 'body', (s * 1.75, 5.5, -2.4), 5.5, 1.7, sc, sc, claw, front=True); legs.append((ub, lb, 0 if s < 0 else 180, True))
        ub, lb = _leg(m, 'leg_b' + n, 'body', (s * 1.85, 5.8, 2.5), 5.8, 2.1, sc, sc, claw, front=False); legs.append((ub, lb, 180 if s < 0 else 0, False))
    # neck (2 segments) + head with an opening jaw
    m.bone('neck', [0, 7.6, -3.4], 'body'); rnd_box(m, 'neck', (0, 8.3, -3.9), (1.45, 1.4, 1.2), sc)
    m.bone('neck2', [0, 9.0, -4.4], 'neck'); rnd_box(m, 'neck2', (0, 9.4, -4.6), (1.3, 1.2, 1.1), sc)
    for i in range(2): cub(m, 'neck2' if i else 'neck', [-0.25, 9.6 + i * 1.0, -4.1 - i * 0.6], [0.25, 10.5 + i * 1.0, -3.5 - i * 0.6], gl if i == 0 else hn)
    m.bone('head', [0, 10.0, -5.0], 'neck2')
    cub(m, 'head', [-2.4, 9.1, -8.2], [2.4, 12.4, -4.4], sc, front=face)
    cub(m, 'head', [-2.0, 12.2, -7.5], [2.0, 12.8, -4.8], sc)                                     # brow ridge
    for s in (-1, 1): cub(m, 'head', [s * 1.5 - 0.55, 11.9, -8.25], [s * 1.5 + 0.55, 12.6, -6.9], sc)   # brow bumps over the eyes
    cub(m, 'head', [-1.6, 9.4, -10.6], [1.6, 11.3, -8.1], sc)                                    # snout
    cub(m, 'head', [-1.1, 11.25, -10.2], [1.1, 11.6, -8.3], sc)
    for s in (-1, 1): cub(m, 'head', [s * 0.75 - 0.25, 10.6, -10.68], [s * 0.75 + 0.25, 10.95, -10.58], dark)   # nostrils
    m.bone('jaw', [0, 9.3, -4.9], 'head')
    cub(m, 'jaw', [-1.5, 8.5, -10.3], [1.5, 9.35, -4.8], bl, front=sc.side)
    for s in (-1, 1):
        cub(m, 'jaw', [s * 1.05 - 0.16, 9.3, -10.1], [s * 1.05 + 0.16, 9.75, -9.7], claw)           # lower fangs
        cub(m, 'head', [s * 1.15 - 0.16, 9.0, -9.9], [s * 1.15 + 0.16, 9.45, -9.5], claw)           # upper fangs
    m.bone('tongue', [0, 9.0, -7.0], 'jaw'); cub(m, 'tongue', [-0.5, 9.0, -9.2], [0.5, 9.25, -6.5], Skin(k, 'tg', (210, 70, 90), kind='flat'))
    P4.eyes(m, k, 'eyes', [0, 11.2, -8.23], 4.6, 2.3, iris, 'sharp', 0.6, 0.34, 0.9, parent='head')
    hu, hd = hn.side, k.main('hornd', P.facet(4, 8, horn, P.shade(horn, 0.45)))
    for s in (-1, 1):
        horn_path(m, k, 'head', [(s * 1.6, 12.4, -5.6), (s * 2.1, 13.5, -4.5), (s * 2.3, 14.3, -3.0), (s * 1.9, 14.6, -1.6)], [1.0, 0.8, 0.5, 0.22], hu, hd, gl.side, n=8)
        cub(m, 'head', [s * 2.45 - 0.2, 9.8, -5.6], [s * 2.45 + 0.2, 10.3, -4.0], hn, origin=[s * 2.45, 10.0, -4.8], rotation=[0, 0, s * 18])   # cheek spikes
    if frill:
        fsk = Skin(k, 'fr', frill, kind='flat')
        for s in (-1, 1):
            fb = m.bone('frill_' + ('r' if s > 0 else 'l'), [s * 2.3, 10.8, -4.6], 'head')
            for i in range(3): cub(m, fb, [s * 2.4 - 0.12, 10.1 + i * 0.8, -4.9 + i * 0.35], [s * 2.4 + 0.12, 11.4 + i * 0.8, -3.6 + i * 0.35], fsk, origin=[s * 2.4, 10.6, -4.2], rotation=[-20, 0, s * 32])
    # wings: shoulder bone + membrane (folded along the back at rest, spread in flight)
    poly = [(0, 0), (3.4, 3.4), (7.6, 4.4), (9.6, 2.0), (7.6, 0.8), (8.4, -1.8), (5.6, -1.4), (5.2, -3.4), (2.2, -1.8)]
    veins = [((0, 0), (7.6, 4.4)), ((0, 0), (8.4, -1.8)), ((0, 0), (5.2, -3.4)), ((0, 0), (9.6, 2.0))]
    mm, gg, fr = P.membrane(poly, veins, 5, wing, P.shade(wing, 0.45), P.shade(wing, 0.55), glow_vein=glow, seed=name)
    uw = m.atlas.add(mm); ug = m.glow_atlas().add(gg) if gg is not None else None
    for s, n in ((-1, 'l'), (1, 'r')):
        off = (s * 2.0, 8.0, -1.2)
        wb = m.bone('wing_' + n, list(off), 'body')
        x0, y0, x1, y1 = fr
        fa = [off[0] + (x0 if s > 0 else -x1), off[1] + y0, off[2] - 0.05]; fb = [off[0] + (x1 if s > 0 else -x0), off[1] + y1, off[2] + 0.05]
        m.plate(wb, fa, fb, uw if s > 0 else uw.mirrored(), origin=list(off), rotation=[0, 0, 0])
        if ug is not None: m.plate(wb, [fa[0], fa[1], fa[2] - 0.04], [fb[0], fb[1], fb[2] + 0.04], ug if s > 0 else ug.mirrored(), origin=list(off), rotation=[0, 0, 0])
        cub(m, wb, [off[0] - 0.4, off[1] - 0.4, off[2] - 0.4], [off[0] + 0.4, off[1] + 0.4, off[2] + 0.4], sc)       # shoulder joint
        A = (off[0], off[1] + 0.1, off[2]); B = (off[0] + s * 7.6, off[1] + 4.4, off[2])                              # leading arm bone
        L_ = math.hypot(B[0] - A[0], B[1] - A[1]); ang = math.degrees(math.atan2(B[1] - A[1], B[0] - A[0]))
        cx, cy = (A[0] + B[0]) / 2, (A[1] + B[1]) / 2
        cub(m, wb, [cx - L_ / 2, cy - 0.28, off[2] - 0.28], [cx + L_ / 2, cy + 0.28, off[2] + 0.28], hn, origin=[cx, cy, off[2]], rotation=[0, 0, ang])
        cub(m, wb, [B[0] - 0.25, B[1] - 0.1, off[2] - 0.25], [B[0] + 0.25, B[1] + 0.9, off[2] + 0.25], claw, origin=list(B), rotation=[0, 0, -s * 30])   # thumb claw
    # tail: 7 segments, spikes, glowing spade
    par, z, y, tails = 'body', 3.6, 6.0, []
    for i, w in enumerate((2.1, 1.8, 1.5, 1.2, 0.95, 0.75, 0.6)):
        b = m.bone('tail%d' % i, [0, y, z], par); tails.append(b)
        cub(m, b, [-w / 2, y - w / 2, z], [w / 2, y + w / 2, z + 1.9], sc)
        cub(m, b, [-0.18, y + w / 2, z + 0.5], [0.18, y + w / 2 + 0.6 - i * 0.05, z + 1.1], gl if i % 2 else hn)
        par = b; z += 1.75; y -= 0.35
    cub(m, tails[-1], [-1.3, y - 0.2, z - 0.3], [1.3, y + 0.2, z + 1.4], gl, origin=[0, y, z + 0.5], rotation=[0, 45, 0])
    cub(m, tails[-1], [-0.2, y - 1.0, z], [0.2, y + 1.0, z + 1.8], gl)
    m.flat('body', [-7, 0.05, -8], [7, 0.07, 8], k.soft('aura', P.soft(48, 48, glow, peak=60)))
    amb = sparks(m, k, fx_col or glow, 6, ((-4, 4), (6, 11), (-4, 6)), (2, 5), 0.5, name='am') if fx_col else None
    # fire/frost breath for the roar: a cone of glowing puffs out of the mouth (only shown in "special")
    br = Particles(m, 'head', 1.2, 'br'); rr = random.Random(name + 'br')
    puff = k.glow('puff', P.dot(fx_col or glow, 3, core=(255, 255, 255)))
    for i in range(10): br.add([0, 9.6, -10.4], [rr.uniform(-2.5, 2.5), rr.uniform(-1.0, 2.5), -rr.uniform(6, 9)], rr.uniform(0.7, 1.2), puff, i / 10, spin=200)
    L = 3.0
    def wings(tr, c):
        if c == 'fly':   # big flaps; the body bobs against them
            for s, n in ((-1, 'l'), (1, 'r')):
                tr['wing_' + n] = {'rotation': [(0, sn(600, 90, 10), s * -10, sn(600, 0, s * 45, s * 18))]}
        elif c in ('special',):
            for s, n in ((-1, 'l'), (1, 'r')):
                tr['wing_' + n] = {'rotation': [(0, 0, s * -60, s * 70), (0.3, 0, s * -10, s * -40), (1.6, 0, s * -10, s * -40), (2.0, 0, s * -60, s * 70), (L, 0, s * -60, s * 70)]}
        elif c == 'special2':   # stretch both wings, a little shake
            for s, n in ((-1, 'l'), (1, 'r')):
                tr['wing_' + n] = {'rotation': [(0, 0, s * -60, s * 70), (0.4, 0, s * -15, s * -25), (1.4, 0, s * -15, sn(1440, 0, 8, s * -25)), (1.8, 0, s * -60, s * 70), (L, 0, s * -60, s * 70)]}
        else:   # folded along the back, a slight flutter
            fr_ = 120 if c == 'idle' else 480
            for s, n in ((-1, 'l'), (1, 'r')):
                tr['wing_' + n] = {'rotation': [(0, 0, s * -60, sn(fr_, 0, s * 4, s * 70))]}
    def tail_tr(tr, freq, amp, lift=0):
        for i, b in enumerate(tails): tr[b] = {'rotation': [(0, sn(freq * 0.5, -i * 30, 3, lift if i == 0 else 2), sn(freq, -i * 38, amp * (0.6 + i * 0.12)), 0)]}
    def build(c):
        tr = {'eyes': {'scale': blink(L, 0.6)}}
        for sb in br.tracks:   # breath only in the roar
            if 'brs' in sb: tr[sb] = {'scale': [(0, 0, 0, 0)]}
        wings(tr, c)
        if c == 'idle':
            tr['body'] = {'scale': [(0, 1, sn(120, 0, 0.02, 1), 1)]}
            tr['neck'] = {'rotation': [(0, sn(120, 0, 3), sn(120, 90, 10), 0)]}
            tr['head'] = {'rotation': [(0, sn(240, 30, 3), sn(120, 150, 8), sn(120, 60, 4))]}
            tr['jaw'] = {'rotation': [(0, 0, 0, 0), (1.9, 0, 0, 0), (2.05, -12, 0, 0), (2.35, -12, 0, 0), (2.5, 0, 0, 0), (L, 0, 0, 0)]}
            tail_tr(tr, 120, 14, 8)
        elif c in ('walk', 'run', 'swim'):
            fr = {'walk': 480, 'run': 840, 'swim': 360}[c]
            gl_ = [(u, l_, (ph if c != 'run' else (0 if fr_ else 180) + (25 if 'r' == u[-1] else 0)), fr_) for (u, l_, ph, fr_) in legs]
            gait_tracks(tr, gl_, c, fr, 22)
            if c == 'walk':
                tr['body'] = {'position': [(0, 0, 'math.abs(%s)*0.3' % (S % fr), 0)], 'rotation': [(0, 0, sn(fr, 0, 3), sn(fr, 0, 2.5))]}
                tr['neck'] = {'rotation': [(0, sn(fr * 2, 60, 3), sn(fr, 180, 5), 0)]}
                tail_tr(tr, fr, 18, 6)
            elif c == 'run':
                tr['body'] = {'position': [(0, 0, sn(fr, 0, 0.7, 0.5), 0)], 'rotation': [(0, sn(fr, 90, 6), 0, 0)]}
                tr['neck'] = {'rotation': [(0, sn(fr, 270, 5, 10), 0, 0)]}
                tail_tr(tr, fr, 10, -6)
            else:
                tr['body'] = {'position': [(0, 0, sn(240, 0, 0.3, -2.4), 0)], 'rotation': [(0, 8, 0, 0)]}
                tr['neck'] = {'rotation': [(0, 14, 0, 0)]}
                tail_tr(tr, 360, 26, 0)
        elif c == 'fly':
            for ub, lb, ph, front in legs:
                tr[ub] = {'rotation': [(0, -20 if front else -50, 0, 0)]}; tr[lb] = {'rotation': [(0, -60 if front else 30, 0, 0)]}
            tr['body'] = {'position': [(0, 0, sn(600, 180, 0.9, 0.5), 0)], 'rotation': [(0, sn(300, 0, 3, -6), 0, sn(150, 0, 4))]}
            tr['neck'] = {'rotation': [(0, sn(600, 90, 4, 6), 0, 0)]}
            tail_tr(tr, 300, 12, -8)
        elif c == 'special':   # rears up and roars a breath of fire/frost
            K = [(0, 0), (0.35, 1), (1.7, 1), (2.1, 0), (L, 0)]
            def key(v): return [(t, round(v[0] * a, 2), round(v[1] * a, 2), round(v[2] * a, 2)) for t, a in K]
            tr['body'] = {'rotation': key((26, 0, 0)), 'position': key((0, 0.6, 1.0))}
            for ub, lb, ph, front in legs:
                if front: tr[ub] = {'rotation': key((30, 0, 0))}; tr[lb] = {'rotation': key((-55, 0, 0))}
                else: tr[ub] = {'rotation': key((-26, 0, 0))}
            tr['neck'] = {'rotation': key((6, 0, 0))}
            tr['head'] = {'rotation': [(0, 0, 0, 0), (0.35, -14, 0, 0), (0.55, -6, 0, 0), (1.6, -6, 0, 0), (2.0, 0, 0, 0), (L, 0, 0, 0)]}
            tr['jaw'] = {'rotation': [(0, 0, 0, 0), (0.45, 0, 0, 0), (0.6, -32, 0, 0), (1.6, -32, 0, 0), (1.8, 0, 0, 0), (L, 0, 0, 0)]}
            tail_tr(tr, 600, 14, 10)
            for sb, v in br.tracks.items():
                if 'brs' in sb:   # visible from 0.55 to 1.65 s
                    sc_ = v['scale']; tr[sb] = {'scale': [(0, 0, 0, 0), (0.54, 0, 0, 0)] + [(round(0.55 + t_ * 1.1 / 1.2, 3), *xyz) for (t_, *xyz) in sc_ if t_ <= 1.2] + [(1.66, 0, 0, 0), (L, 0, 0, 0)]}
                    if 'rotation' in v: tr[sb]['rotation'] = v['rotation']
                else: tr[sb] = v
        elif c == 'special2':   # wing stretch + a dog-like shake
            tr['body'] = {'rotation': [(0, 0, 0, 0), (1.4, 0, 0, 0), (1.45, 0, 0, sn(1800, 0, 14)), (2.1, 0, 0, sn(1800, 0, 14)), (2.2, 0, 0, 0), (L, 0, 0, 0)]}
            tr['neck'] = {'rotation': [(0, 0, 0, 0), (0.4, 20, 0, 0), (1.3, 20, 0, 0), (1.6, 0, 0, 0), (L, 0, 0, 0)]}
            tr['jaw'] = {'rotation': [(0, 0, 0, 0), (0.4, -24, 0, 0), (1.1, -24, 0, 0), (1.3, 0, 0, 0), (L, 0, 0, 0)]}   # yawn
            tail_tr(tr, 360, 18, 10)
        return tr
    clips(m, build, L, Multi(amb), names=('idle', 'walk', 'run', 'fly', 'swim', 'special', 'special2'))
    return m

# ================================================================== FLYING PETS (floats: true -> always "fly")
def phoenix7(name, body=(255, 95, 25), head=(255, 150, 40), tail=(220, 30, 10), glow=(255, 210, 70)):
    m = BB(name, Atlas(256, 256)); k = Kit(m)
    bd = Skin(k, 'bd', body, seed=11); hd = Skin(k, 'hd', head, seed=12)
    belly = Skin(k, 'belly', tuple(int(v) for v in P.mixc(head, (255, 245, 210), 0.6)), seed=13)
    beak = Skin(k, 'beak', (250, 200, 80), kind='flat'); gl = Skin(k, 'gl', glow, kind='flat', glow=True)
    fth = k.sprite('fth', lambda: P.feather(10, 30, head, tail, (255, 250, 200), None, 'flame', glow_tip=glow, seed=1))
    cov = k.sprite('cov', lambda: P.feather(10, 22, P.mixc(head, body, 0.5), body, (255, 240, 200), None, 'covert', glow_tip=None, seed=3))
    tlf = k.sprite('tlf', lambda: P.feather(12, 56, body, tail, (255, 250, 210), None, 'flame', glow_tip=glow, seed=2))
    m.bone('body', [0, 8.0, 0])
    rnd_box(m, 'body', (0, 7.8, 0.3), (2.6, 2.6, 3.0), bd, 0.74)                    # round body
    rnd_box(m, 'body', (0, 7.2, -1.4), (2.0, 2.2, 1.6), belly, 0.74)                # puffed chest
    cub(m, 'body', [-0.9, 6.6, -3.05], [0.9, 6.9, -2.9], gl)                          # glowing chest flame mark
    cub(m, 'body', [-0.35, 6.9, -3.05], [0.35, 7.8, -2.9], gl)
    m.bone('head', [0, 10.0, -1.2], 'body')
    rnd_box(m, 'head', (0, 11.4, -1.6), (1.9, 1.8, 1.9), hd, 0.75)
    cub(m, 'head', [-0.7, 10.7, -4.6], [0.7, 11.6, -3.3], beak)                     # upper beak
    cub(m, 'head', [-0.45, 10.35, -4.3], [0.45, 10.75, -3.3], beak)                 # lower beak
    cub(m, 'head', [-0.3, 11.0, -5.0], [0.3, 11.5, -4.55], beak)                    # hook
    P4.eyes(m, k, 'eyes', [0, 11.8, -3.55], 3.8, 1.5, (30, 15, 10), 'round', 0.62, 0.26, 0.86, parent='head')
    for s in (-1, 1): cub(m, 'head', [s * 1.7 - 0.12, 11.3, -3.2], [s * 1.7 + 0.12, 11.7, -1.8], gl)    # glowing eye streaks
    m.bone('crest', [0, 13.0, -1.4], 'head')
    for i, a in enumerate((-30, -10, 10, 30)):
        P4.hang_up(m, 'crest', [a / 30 * 0.8, 12.9, -1.2 + abs(a) / 30 * 0.8], 4.4 - abs(a) / 30 * 1.4, 2.2, a, fth)
    # wings: arm (coverts) + hand (primaries), so the flap has a wrist
    wingb = []
    for s, n in ((-1, 'l'), (1, 'r')):
        arm = m.bone('wing_' + n, [s * 2.4, 9.0, -0.2], 'body')
        for i in range(4):
            R = [s * (2.4 + i * 1.0), 9.2 - i * 0.1, -0.4 + i * 0.25]
            P4.hang_side(m, arm, R, 3.6 - i * 0.2, 2.0, s, 80 - i * 4, cov)
        hand = m.bone('hand_' + n, [s * 6.2, 9.0, 0.4], arm)
        for i in range(5):
            R = [s * (6.0 + i * 0.7), 9.1 - i * 0.15, 0.2 + i * 0.4]
            P4.hang_side(m, hand, R, 6.2 - i * 0.6, 2.2, s, 70 + i * 7, fth)
        wingb.append((arm, hand, s))
    # tail: 3 long streamers, each a 3-part chain that ripples
    streams = []
    for j, a in enumerate((-18, 0, 18)):
        par, z = 'body', 3.0
        ch = []
        for q in range(3):
            b = m.bone('st%d_%d' % (j, q), [a / 18 * 0.8, 6.6 - q * 0.4, z], par); ch.append(b)
            spr = tlf if q == 2 else fth
            m.plate(b, [a / 18 * 0.8 - 1.1, 6.6 - q * 0.4 - 0.05, z], [a / 18 * 0.8 + 1.1, 6.6 - q * 0.4 + 0.05, z + 4.0 + q], spr[0], origin=[a / 18 * 0.8, 6.6, z], rotation=[0, 0, 0])
            if spr[1] is not None: m.plate(b, [a / 18 * 0.8 - 1.1, 6.6 - q * 0.4 - 0.1, z], [a / 18 * 0.8 + 1.1, 6.6 - q * 0.4 + 0.1, z + 4.0 + q], spr[1])
            par = b; z += 3.6 + q * 0.6
        streams.append((ch, a))
    for s in (-1, 1):   # tucked talons
        cub(m, 'body', [s * 1.0 - 0.3, 4.9, -0.3], [s * 1.0 + 0.3, 5.6, 0.5], beak)
        for t in (-0.25, 0.25): cub(m, 'body', [s * 1.0 + t - 0.12, 4.6, -0.6], [s * 1.0 + t + 0.12, 5.0, 0.1], beak)
    m.plate('body', [-8, 0, 3.4], [8, 16, 3.5], k.soft('aura', P.soft(48, 48, glow, peak=70)))
    fxo = Multi(sparks(m, k, glow, 8, ((-5, 5), (5, 10), (1, 8)), (-3, 2), 0.55, name='em', spin=220),
                sparks(m, k, P.mixc(glow, (255, 80, 20), 0.5), 6, ((-2, 2), (5, 8), (6, 14)), (-1, 2), 0.5, name='tr'))
    # flame burst for special2: a glow shell that blooms
    m.bone('burst', [0, 8, 0], 'body'); bsoft = k.soft('burst', P.soft(48, 48, glow, peak=140, ring=(0.6, 0.2)))
    m.plate('burst', [-6, 2, 0], [6, 14, 0.05], bsoft); m.plate('burst', [-6, 2, 0], [6, 14, 0.05], bsoft, origin=[0, 8, 0], rotation=[0, 90, 0])
    L = 3.0
    def flap(tr, fr, amp, base=10):
        for arm, hand, s in wingb:
            tr[arm] = {'rotation': [(0, sn(fr, 90, 8), sn(fr, 90, s * 10), sn(fr, 0, s * -amp, s * -base))]}
            tr[hand] = {'rotation': [(0, 0, sn(fr, 60, s * 8), sn(fr, -50, s * -amp * 0.6))]}
    def build(c):
        tr = {'eyes': {'scale': blink(L, 0.5)}, 'burst': {'scale': [(0, 0, 0, 0)]}}
        fr = 720
        flap(tr, fr, 46)
        tr['body'] = {'position': [(0, 0, sn(fr, 180, 0.9, 0), 0)], 'rotation': [(0, sn(240, 0, 4, -8), 0, sn(120, 0, 5))]}
        tr['head'] = {'rotation': [(0, sn(fr, 90, 3, 8), sn(120, 0, 14), sn(120, 40, 5))]}
        tr['crest'] = {'rotation': [(0, sn(fr, 180, 8, -6), 0, 0)]}
        for j, (ch, a) in enumerate(streams):
            for q, b in enumerate(ch): tr[b] = {'rotation': [(0, sn(360, -q * 50 - j * 40, 8 + q * 4, -10 if q == 0 else 0), sn(240, -q * 45 - j * 60, 6 + q * 3, a if q == 0 else 0), 0)]}
        if c == 'special':   # loop-the-loop
            tr['body']['rotation'] = [(0, 0, 0, 0), (0.9, 360, 0, 0), (L, 360, 0, 0)]
            tr['body']['position'] = [(0, 0, 0, 0), (0.45, 0, 4, 2), (0.9, 0, 0, 0), (L, 0, 0, 0)]
        if c == 'special2':  # wings spread wide, flame burst
            for arm, hand, s in wingb:
                tr[arm] = {'rotation': [(0, 0, 0, s * -10), (0.3, 0, s * -20, s * 40), (1.5, 0, s * -20, s * 40), (1.9, 0, 0, s * -10), (L, 0, 0, s * -10)]}
                tr[hand] = {'rotation': [(0, 0, 0, 0), (0.3, 0, 0, s * 20), (1.5, 0, 0, s * 20), (1.9, 0, 0, 0), (L, 0, 0, 0)]}
            tr['burst'] = {'scale': [(0, 0, 0, 0), (0.4, 0, 0, 0), (0.55, 0.6, 0.6, 0.6), (1.2, 1.6, 1.6, 1.6), (1.5, 0, 0, 0), (L, 0, 0, 0)],
                           'rotation': [(0, 0, 'query.anim_time*200', 0)]}
            tr['head'] = {'rotation': [(0, 0, 0, 0), (0.3, 25, 0, 0), (1.5, 25, 0, 0), (1.9, 0, 0, 0), (L, 0, 0, 0)]}
        return tr
    clips(m, build, L, fxo, names=('idle', 'fly', 'special', 'special2'))
    return m

def flame_tex(w, h, outer, inner, seed=0):
    """A flame tongue sprite: soft-edged teardrop, white-hot core, flickery top."""
    Y, X = np.mgrid[0:h, 0:w].astype(float); u = (X + 0.5) / w * 2 - 1; t = (Y + 0.5) / h
    r = _rng(('fl', seed, w, h))
    half = np.clip(np.sin(np.clip(1 - t, 0, 1) ** 0.7 * math.pi * 0.95), 0, 1) * (0.55 + 0.45 * t) + r.random((h, w)) * 0.08
    on = np.abs(u) < half
    d = np.abs(u) / np.maximum(half, 1e-3)
    col = np.array(outer, float) * d[..., None] + np.array(inner, float) * (1 - d[..., None])
    col = np.where((d < 0.35)[..., None] & (t > 0.45)[..., None], np.array((255, 255, 240), float), col)
    a = np.where(on, 255, 0).astype(np.uint8)
    return Image.fromarray(np.dstack([np.clip(col, 0, 255).astype(np.uint8), a]), 'RGBA')

def wisp7(name, core=(30, 10, 45), flame=(170, 80, 255), eye=(255, 240, 255), lantern=False):
    """A living flame spirit: dark core with glowing eyes inside rings of flickering flame tongues, wispy tail, orbiting souls."""
    m = BB(name, Atlas(256, 128)); k = Kit(m)
    cd = Skin(k, 'cd', core, light=tuple(int(v) for v in P.mixc(core, flame, 0.35)), seed=21)
    fl = Skin(k, 'fl', flame, kind='flat', glow=True)
    big = k.glow('fbig', flame_tex(12, 24, flame, P.mixc(flame, (255, 255, 255), 0.6), 1))
    sm = k.glow('fsm', flame_tex(8, 16, flame, P.mixc(flame, (255, 255, 255), 0.6), 2))
    m.bone('body', [0, 8.5, 0])
    rnd_box(m, 'body', (0, 8.6, 0), (3.0, 3.0, 3.0), cd, 0.72)
    eu = k.glow('eyes', P.eyes_sprite(32, 20, eye, 'sharp', 0.55, 0.34, 0.86, pupil=tuple(int(v) for v in P.shade(flame, 0.5))))
    m.bone('eyes', [0, 8.9, -3.05], 'body'); m.plate('eyes', [-2.6, 7.9, -3.07], [2.6, 9.9, -3.03], eu, back=eu)
    fm = k.glow('mouth', P.face_marks(24, 8, blush=tuple(int(v) for v in P.mixc(flame, (255, 255, 255), 0.3)), mouth=tuple(int(v) for v in P.mixc(flame, (255, 255, 255), 0.6)), kind='v'))
    m.plate('body', [-2.4, 6.9, -3.07], [2.4, 7.9, -3.03], fm, back=fm)
    if lantern:   # an iron lantern cage round the flame, with a ring on top
        ir = Skin(k, 'iron', (70, 66, 74), kind='flat')
        for x, z in ((-3.3, -3.3), (3.3, -3.3), (-3.3, 3.3), (3.3, 3.3)): cub(m, 'body', [x - 0.3, 5.2, z - 0.3], [x + 0.3, 12.2, z + 0.3], ir)
        for y in (5.0, 12.0): cub(m, 'body', [-3.6, y, -3.6], [3.6, y + 0.4, 3.6], ir)
        cub(m, 'body', [-1.0, 12.4, -0.3], [1.0, 13.8, 0.3], ir)
    # flame rings: crossed tongues, each its own bone so it flickers on its own
    tongues = []
    for ring, (rad, y0, ln, w, n, spr) in enumerate(((2.4, 9.8, 5.0, 2.6, 6, big), (1.2, 10.8, 4.0, 1.8, 4, sm), (3.0, 7.0, 3.0, 1.8, 6, sm))):
        for i in range(n):
            a = 2 * math.pi * (i + ring * 0.5) / n; x, z = math.cos(a) * rad, math.sin(a) * rad
            if ring == 2 and z < -1.0: continue   # keep the face clear
            b = m.bone('fl%d_%d' % (ring, i), [x, y0, z], 'body'); tongues.append((b, ring, i))
            yaw = -math.degrees(a) + 90
            m.plate(b, [x - w / 2, y0, z - 0.02], [x + w / 2, y0 + ln, z + 0.02], spr, origin=[x, y0, z], rotation=[0, yaw, -math.cos(a) * 12 if ring == 2 else 0])
            m.plate(b, [x - w / 2, y0, z - 0.02], [x + w / 2, y0 + ln, z + 0.02], spr, origin=[x, y0, z], rotation=[0, yaw + 90, 0])
    # wispy tail
    par, y, tl = 'body', 6.0, []
    for i, r in enumerate((2.4, 1.9, 1.4, 1.0, 0.6)):
        b = m.bone('wt%d' % i, [0, y, 0.5 * i], par); tl.append(b)
        cub(m, b, [-r, y - 1.4, -r + 0.5 * i], [r, y, r + 0.5 * i], cd if i < 2 else fl)
        par = b; y -= 1.3
    m.bone('souls', [0, 9, 0])
    for i in range(3):
        a = 2 * math.pi * i / 3; x, z = math.cos(a) * 6.0, math.sin(a) * 6.0
        cub(m, 'souls', [x - 0.6, 8.4, z - 0.6], [x + 0.6, 9.6, z + 0.6], fl, origin=[x, 9, z], rotation=[45, 45, 0])
        m.plate('souls', [x - 0.9, 8.6, z], [x + 0.9, 12.2, z + 0.02], sm, origin=[x, 8.6, z], rotation=[0, -math.degrees(a), 0])
    m.plate('body', [-7, 2, 3.4], [7, 16, 3.5], k.soft('aura', P.soft(48, 48, flame, peak=70)))
    fxo = sparks(m, k, flame, 9, ((-3, 3), (11, 14), (-3, 3)), (3, 6), 0.55, name='sp')
    L = 3.0
    def build(c):
        tr = {'eyes': {'scale': blink(L, 0.7)},
              'body': {'position': [(0, 0, sn(240, 0, 1.0), 0)], 'rotation': [(0, sn(120, 0, 5), sn(120, 90, 12), sn(240, 0, 3))]},
              'souls': {'rotation': [(0, 0, 'query.anim_time*120', 0)], 'position': [(0, 0, sn(360, 0, 0.8), 0)]}}
        for b, ring, i in tongues:
            f = 1200 + ring * 240 + i * 60
            tr[b] = {'scale': [(0, sn(f, i * 70, 0.12, 1), sn(f * 1.3, i * 110, 0.28, 1.05), sn(f, i * 70, 0.12, 1))],
                     'rotation': [(0, sn(600, i * 80, 6), 0, sn(480, i * 50, 8))]}
        for i, b in enumerate(tl): tr[b] = {'rotation': [(0, sn(360, -i * 50, 8 + i * 4), 0, sn(240, -i * 55, 6 + i * 4))]}
        if c == 'special':   # vanish-and-return: shrink into a spark, spin, pop back
            tr['body']['scale'] = [(0, 1, 1, 1), (0.4, 0.15, 1.8, 0.15), (0.8, 1.2, 0.8, 1.2), (1.0, 1, 1, 1), (L, 1, 1, 1)]
            tr['body']['rotation'] = [(0, 0, 0, 0), (0.8, 0, 720, 0), (L, 0, 720, 0)]
        if c == 'special2':   # flares up
            for b, ring, i in tongues: tr[b]['scale'] = [(0, 1, 1, 1), (0.3, 1.2, 1.9, 1.2), (1.2, 1.2, 1.9, 1.2), (1.6, 1, 1, 1), (L, 1, 1, 1)]
        return tr
    clips(m, build, L, fxo, names=('idle', 'fly', 'special', 'special2'))
    return m

# ================================================================== SLIME (ground; hops)
def slime7(name, col, eye=(20, 25, 60), crown=None, glow_eyes=False, fx='bubbles', core=None):
    m = P4.slime(name, col, eye, crown, glow_eyes, fx)
    k = Kit(m)
    if core is not None:   # a glowing core you can see in the middle
        gl = k.glow('core7', P.facet(4, 4, P.mixc(core, (255, 255, 255), 0.5), core))
        m.box('body', [-1.2, 3.2, -1.2], [1.2, 5.6, 1.2], gl, gl, origin=[0, 4.4, 0], rotation=[45, 45, 0])
    # replace the hop with anticipation -> stretch -> land squash (the walk/run clips)
    m.anims = [a for a in m.anims if a['name'] not in ('walk', 'run', 'fly')]
    L = 4.0
    keys = [(0, 1.18, 0.78, 1.18, 0), (0.12, 0.88, 1.22, 0.88, 1.6), (0.3, 0.95, 1.08, 0.95, 3.4), (0.45, 1.0, 1.0, 1.0, 3.0), (0.6, 0.92, 1.12, 0.92, 0.6), (0.68, 1.2, 0.76, 1.2, 0), (0.8, 1.0, 1.0, 1.0, 0)]
    def hop(period):
        sc_, ps_ = [], []
        t0 = 0.0
        while t0 < L - 1e-6:
            for (t, sx, sy, sz, py) in keys:
                tt = round(t0 + t * period / 0.8, 3)
                if tt <= L: sc_.append((tt, sx, sy, sz)); ps_.append((tt, 0, py, 0))
            t0 += period
        return {'scale': sc_, 'position': ps_}
    for nm, per in (('walk', 0.8), ('run', 0.5), ('fly', 4.0)):
        tr = {'eyes': {'scale': blink(L, 0.55)}}
        tr['body'] = hop(per) if nm != 'fly' else {'scale': [(0, 0.9, 1.15, 0.9)], 'rotation': [(0, sn(180, 0, 8), 0, sn(240, 0, 8))]}
        m.anim(nm, L, tr)
        idle = next(a for a in m.anims if a['name'] == 'idle'); new = m.anims[-1]
        for uid_, an in idle['animators'].items():   # keep the particles running
            if an['name'] not in tr: new['animators'][uid_] = an
    return m
