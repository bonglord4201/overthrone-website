# Shared helpers for the OVERTHRONE v4 cosmetics: sprite caching across the main/glow/soft textures, plates with a glowing
# overlay, looping "particles" built from tiny model pieces (the mod has no particles for model cosmetics, so these are
# bones moved by linear keyframes), and the animation-clip assembler.
#
# Facts used (Manas Cosmetics 1.0.6 code):
# - A texture whose name ends in _e is drawn full bright; a texture with more half-transparent than opaque pixels is drawn
#   translucent. Faces pick their texture with "texture": <index>.
# - Clips: the mod plays the clip named after the player's state: idle, walk, run, jump (while rising), fly (elytra
#   gliding falls back to fly), falling back to idle. Keyframes are linear; looping clips wrap at their length.
#   Molang: + - * / ( ), math.sin/cos (degrees), math.abs, math.clamp (0..1), query.anim_time (seconds, never wraps),
#   query.ground_speed (0..1), query.is_sneaking, query.is_on_ground ... (1/0).
# - Bone transform: T(pivot) R(z,y,x) S T(position) T(-pivot): position is scaled by the same bone's scale, so particles
#   use two bones (one moves, its child scales).
import math
from bb import UV

class Kit:
    def __init__(self, m):
        self.m, self.cache = m, {}
    def sprite(self, key, fn):
        """fn() -> (main PIL image, glow PIL image or None). Returns (uv, glow_uv or None), each added once."""
        if key not in self.cache:
            main, glow = fn()
            uv = self.m.atlas.add(main) if main is not None else None
            g = self.m.glow_atlas().add(glow) if glow is not None else None
            self.cache[key] = (uv, g)
        return self.cache[key]
    def glow(self, key, img):
        if key not in self.cache: self.cache[key] = self.m.glow_atlas().add(img)
        return self.cache[key]
    def soft(self, key, img):
        if key not in self.cache: self.cache[key] = self.m.soft_atlas().add(img)
        return self.cache[key]
    def main(self, key, img):
        if key not in self.cache: self.cache[key] = self.m.atlas.add(img)
        return self.cache[key]

def mir(uv, side):
    return uv if (uv is None or side > 0) else uv.mirrored()

def hang(m, bone, R, L, w, ang, uv, guv=None, th=0.1, tilt=0.0, twist=0.0, side=1, box=False, side_uv=None):
    """A flat piece hanging DOWN from root R (length L, width w), swung by ang degrees (+ = towards +X). Left side pieces
    get mirrored uvs. guv = glow overlay (a slightly thicker copy drawn full bright)."""
    frm = [R[0] - w / 2, R[1] - L, R[2] - th / 2]; to = [R[0] + w / 2, R[1], R[2] + th / 2]
    rot = [tilt, twist, ang]
    if box:
        m.box(bone, frm, to, mir(uv, side), side_uv or mir(uv, side), origin=list(R), rotation=rot)
    else:
        m.plate(bone, frm, to, mir(uv, side), origin=list(R), rotation=rot)
    if guv is not None:
        e = 0.04
        frm2 = [frm[0], frm[1], frm[2] - e]; to2 = [to[0], to[1], to[2] + e]
        if box: frm2 = [frm[0] - e, frm[1] - e, frm[2] - e]; to2 = [to[0] + e, to[1] + e, to[2] + e]
        if box: m.box(bone, frm2, to2, mir(guv, side), mir(guv, side), origin=list(R), rotation=rot)
        else: m.plate(bone, frm2, to2, mir(guv, side), origin=list(R), rotation=rot)

def seg(m, bone, A, B, th, uv, side_uv=None, thz=None, guv=None):
    """A box from A to B (rotated in the XY plane), th thick (thz along Z)."""
    cx, cy, cz = [(A[i] + B[i]) / 2 for i in range(3)]
    L = math.hypot(B[0] - A[0], B[1] - A[1]); ang = math.degrees(math.atan2(B[1] - A[1], B[0] - A[0]))
    tz = thz if thz is not None else th
    m.box(bone, [cx - L / 2, cy - th / 2, cz - tz / 2], [cx + L / 2, cy + th / 2, cz + tz / 2], uv, side_uv, origin=[cx, cy, cz], rotation=[0, 0, ang])
    if guv is not None:
        e = 0.04
        m.box(bone, [cx - L / 2 - e, cy - th / 2 - e, cz - tz / 2 - e], [cx + L / 2 + e, cy + th / 2 + e, cz + tz / 2 + e], guv, guv, origin=[cx, cy, cz], rotation=[0, 0, ang])

def lerp3(A, B, t): return [A[i] + (B[i] - A[i]) * t for i in range(3)]

# ---------------------------------------------------------------- looping particles
def cycle_keys(L, phase, fn, breaks=(0.0, 0.15, 0.7, 1.0)):
    """Keyframes over one loop of length L for a value that runs fn(f) as f goes 0 -> 1 once per loop, started at `phase`.
    fn must be linear between the break points. The jump from f=1 back to f=0 gets two keys 2 ms apart."""
    times = {0.0, float(L)}
    for fb in breaks: times.add(round(((fb - phase) % 1.0) * L, 4))
    keys = []
    for t in sorted(times):
        f = (t / L + phase) % 1.0
        keys.append((round(t, 4), *fn(f)))
    tj = round(((1.0 - phase) % 1.0) * L, 4)
    if 0.003 < tj < L - 0.003: keys.append((round(tj - 0.002, 4), *fn(0.9999)))
    keys.sort(key=lambda k: k[0])
    return keys

def fade(f, a=0.15, b=0.7, lo=0.02):
    if f < a: return lo + (1 - lo) * f / a
    if f < b: return 1.0
    return lo + (1 - lo) * (1 - f) / (1 - b)

class Particles:
    """Collects particle bones and their keyframes; add_tracks(tracks) puts them into every animation clip."""
    def __init__(self, m, parent=None, L=4.0):
        self.m, self.L, self.n, self.tracks = m, L, 0, {}
        self.root = m.bone('fx', [0, 0, 0], parent)
    def add(self, pos, delta, size, uv, phase, spin=0.0, sway=0.0, plate=False, breaks=(0.0, 0.15, 0.7, 1.0), fade_in=0.15, fade_out=0.7, rot=(0, 0, 0)):
        i = self.n; self.n += 1
        mv = self.m.bone('fx%d' % i, list(pos), self.root)
        sc = self.m.bone('fxs%d' % i, list(pos), mv)
        h = size / 2
        if plate:
            self.m.plate(sc, [pos[0] - h, pos[1] - h, pos[2] - 0.05], [pos[0] + h, pos[1] + h, pos[2] + 0.05], uv, origin=list(pos), rotation=list(rot))
        else:
            self.m.box(sc, [pos[0] - h, pos[1] - h, pos[2] - h], [pos[0] + h, pos[1] + h, pos[2] + h], uv, uv, origin=list(pos), rotation=list(rot))
        L = self.L
        tr = {'position': cycle_keys(L, phase, lambda f: (round(delta[0] * f, 3), round(delta[1] * f, 3), round(delta[2] * f, 3)))}
        if sway: tr['rotation'] = [(0, 0, 0, f'math.sin(query.anim_time*160+{i * 70})*{sway}')]
        self.tracks['fx%d' % i] = tr
        st = {'scale': cycle_keys(L, phase, lambda f: (round(fade(f, fade_in, fade_out), 3),) * 3, breaks=(0.0, fade_in, fade_out, 1.0))}
        if spin: st['rotation'] = [(0, 0, f'query.anim_time*{spin}+{i * 40}', 0)]
        self.tracks['fxs%d' % i] = st
    def add_tracks(self, tracks):
        for k, v in self.tracks.items(): tracks[k] = v
        return tracks

def clips(m, build, L=4.0, extra=None, names=('idle', 'walk', 'run', 'jump', 'fly')):
    """build(clip_name) -> tracks dict. extra: Particles (added to every clip). idle is written first (the mod bakes the rest
    pose and the placement box from the first clip)."""
    for n in names:
        tr = build(n)
        if tr is None: continue
        if extra is not None: extra.add_tracks(tr)
        m.anim(n, L, tr)
