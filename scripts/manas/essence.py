# OVERTHRONE v14 "essence" effects: designed magical effects for model cosmetics, replacing the v4-v12 "fx" particles
# (tiny glowing cubes scattered at random and moved in straight lines, which read as random floating blocks in game).
#
# Built only on what Manas Cosmetics 1.0.6 really does (decompiled jar):
#  - ANIMATED TEXTURES: a texture whose PNG height is a multiple of its uv_height is a strip of frames; the renderer shows
#    frame (ticks / frame_time) % frames (BBModelRenderer.computeUv) and syncs it to players (SyncCosmeticRegistryPayload).
#    FlowAtlas packs every animated sprite of a model into one such strip (texture slot 3, name *_flow_e -> full bright).
#  - A texture with more half-transparent than opaque pixels is drawn see-through (TRANSLUCENT_TRANSPARENCY, normal alpha
#    blend); every alpha here stays <= 253 so the whole flow texture is see-through and soft.
#  - Faces are double-sided; bones take keyframed position / rotation / scale + Molang (math.sin/cos, query.anim_time).
#
# Pieces:
#  - Ribbon: a curved stream of light. The path is cut into short segments; each segment is two crossed planes (so it
#    reads from every angle) showing its slice of one animated stream sprite, so a bright pulse with a fading tail TRAVELS
#    along the whole curve, and detached sparks drift off it. Segments can sit on different bones (wing / forearm / hand)
#    so the stream bends with the wing.
#  - Motes: designed sprites (glowing feathers, twinkling sparkles, embers, snow crystals, leaves, wisps, shards) on crossed
#    planes, emitted from chosen points and flying a curved path while they tumble and shrink away (dissolve).
#  - pulse(): a pulsing energy core (animated expanding rings) at a gem.
import math, random
import numpy as np
from PIL import Image, ImageFilter
from bb import UV
from fx import cycle_keys, fade

NF, FT = 24, 2          # 24 frames, one every 2 ticks -> the flow loops every 2.4 s

def _img(rgb, a):
    out = np.zeros(a.shape + (4,), np.uint8); out[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[..., 3] = np.clip(np.round(a * 253), 0, 253).astype(np.uint8)
    out[..., 3] = np.where(out[..., 3] < 3, 0, out[..., 3]); return Image.fromarray(out, 'RGBA')
def _mix(cols, b):
    """b (0..1 array) -> colour along the ramp cols (edge ... core)."""
    cols = [np.array(c, float) for c in cols]; n = len(cols) - 1; f = np.clip(b, 0, 1) * n; i = np.minimum(f.astype(int), n - 1); fr = (f - i)[..., None]
    lo = np.stack([cols[j] for j in range(n)])[i]; hi = np.stack([cols[j + 1] for j in range(n)])[i]
    return lo + (hi - lo) * fr

class FlowAtlas:
    """Animated full-bright see-through texture (slot 3). Sprites are lists of NF frames; add() returns their uv (in frame
    pixels) on texture 3."""
    def __init__(self, m, fw=256, fh=256, suffix='_flow_e'):
        m.soft_atlas()                                   # slots 1 (glow) and 2 (soft) must exist first
        self.index = len(m.extra) + 1; m.extra.append(self); self.m = m
        self.fw, self.fh, self.frame_time, self.suffix = fw, fh, FT, suffix
        self.frames = [Image.new('RGBA', (fw, fh), (0, 0, 0, 0)) for _ in range(NF)]
        self.x = self.y = self.row = 0; self.cache = {}; self.used = True
    def add(self, key, make):
        if key in self.cache: return self.cache[key]
        fr = make(); w, h = fr[0].size
        if self.x + w + 1 > self.fw: self.x = 0; self.y += self.row + 1; self.row = 0
        if self.y + h > self.fh: raise ValueError('flow atlas full')
        for i in range(NF): self.frames[i].paste(fr[i], (self.x, self.y))
        uv = UV((self.x, self.y, self.x + w, self.y + h), self.index); self.x += w + 1; self.row = max(self.row, h)
        self.cache[key] = uv; return uv
    def strip(self):
        used = self.y + self.row                      # crop every frame to the rows actually used (uvs start at the top)
        self.fh = max(8, int(math.ceil(used / 8.0)) * 8)
        out = Image.new('RGBA', (self.fw, self.fh * NF), (0, 0, 0, 0))
        for i, f in enumerate(self.frames): out.paste(f, (0, i * self.fh))
        # soft glows survive 4-bit colour / 5-bit alpha steps; it halves the PNG (players download every model on join)
        a = np.array(out); a[..., :3] = (a[..., :3] >> 4) << 4 | 8; a[..., 3] = np.minimum((a[..., 3] >> 3) << 3, 248)
        a[a[..., 3] == 0] = 0; out = Image.fromarray(a, 'RGBA')
        return out
def flow(m):
    for e in m.extra:
        if isinstance(e, FlowAtlas): return e
    return FlowAtlas(m)

# ------------------------------------------------------------------------------------------------ animated sprite painters
def stream_frames(cols, w=128, h=16, pulses=2, tail=0.2, sparks=True, start=0.08, end=0.7, seed=0):
    """A stream of light along u (0 = source, 1 = end). cols = colour ramp edge -> body -> core (white-hot head).
    Every frame: a soft base band + a thin core line (fading in at the source and trailing away towards the end), and
    `pulses` bright comet heads with fading tails travelling from source to end once per loop, shedding sparks."""
    X, Y = np.meshgrid((np.arange(w) + 0.5) / w, (np.arange(h) + 0.5) / h * 2 - 1)
    env = np.clip(X / start, 0, 1) ** 1.5 * np.clip((1 - X) / (1 - end), 0, 1) ** 1.3
    band = np.exp(-(Y / 0.5) ** 2); core = np.exp(-(Y / 0.13) ** 2)
    rr = random.Random(seed); sp = [(rr.uniform(0.04, 0.16), rr.choice((-1, 1)) * rr.uniform(0.45, 0.85), rr.uniform(0.5, 1.0)) for _ in range(4)]
    out = []
    for f in range(NF):
        I = np.zeros_like(X); S = np.zeros_like(X)
        for k in range(pulses):
            p = (f / NF + k / pulses) % 1.0
            d = (p - X) % 1.0                                           # distance behind the head
            I += (np.exp(-d / tail) * (d < 0.6) * 0.75 + np.exp(-((X - p) / 0.022) ** 2)) * env
            if sparks:
                for (lag, vy, br) in sp:                                # sparks shed behind the head, drifting off the stream
                    su = p - lag; age = lag / 0.16
                    if su < 0: continue
                    vv = vy * (0.4 + 0.6 * age)
                    S += br * (1 - age * 0.7) * np.exp(-(((X - su) * w / 1.3) ** 2 + ((Y - vv) * h / 2.6) ** 2)) * env
        a = np.clip(0.42 * band * env + 0.8 * core * env + I * np.exp(-(Y / 0.5) ** 2) + S, 0, 1)
        b = np.clip(0.55 * core * env + 0.18 * band * env + I * np.exp(-(Y / 0.28) ** 2) + S * 0.8, 0, 1)
        out.append(_img(_mix(cols, b), a))
    return out

def bolt_frames(cols, w=128, h=24, seed=5, hold=3):
    """Electric arcs along u: a jagged bolt (re-drawn every `hold` frames) with a forked branch and a glow, flickering,
    over a faint charged band; fades in at the source and out at the end."""
    X, Y = np.meshgrid((np.arange(w) + 0.5) / w, (np.arange(h) + 0.5) / h * 2 - 1)
    env = np.clip(X / 0.06, 0, 1) * np.clip((1 - X) / 0.3, 0, 1); band = np.exp(-(Y / 0.5) ** 2)
    out = []
    for f in range(NF):
        rr = random.Random(seed * 100 + f // hold); n = 9
        ys = [0.0] + [rr.uniform(-0.55, 0.55) for _ in range(n - 1)] + [0.0]
        yc = np.interp(X[0], np.linspace(0, 1, n + 1), ys)[None, :]
        line = np.exp(-((Y - yc) / 0.09) ** 2); glow = np.exp(-((Y - yc) / 0.35) ** 2)
        b0 = rr.uniform(0.25, 0.6); by = [yc[0, int(b0 * (w - 1))]] + [rr.uniform(-0.9, 0.9) for _ in range(3)]
        bx = np.linspace(b0, b0 + 0.25, 4); inb = (X >= b0) & (X <= b0 + 0.25)
        ybr = np.interp(X[0], bx, by)[None, :]; br = np.exp(-((Y - ybr) / 0.07) ** 2) * inb * np.clip(1 - (X - b0) / 0.25, 0, 1)
        fl = 0.55 + 0.45 * (1 if (f % hold) == 0 else rr.uniform(0.4, 1.0))
        a = np.clip((line + 0.5 * glow + 0.8 * br) * fl * env + 0.12 * band * env, 0, 1)
        out.append(_img(_mix(cols, np.clip((line + br) * fl, 0, 1)), a))
    return out

def pulse_frames(cols, n=40):
    """An energy core: steady bright centre + two rings expanding out and fading, once per loop."""
    X, Y = np.meshgrid((np.arange(n) + 0.5) / n * 2 - 1, (np.arange(n) + 0.5) / n * 2 - 1); r = np.sqrt(X * X + Y * Y)
    out = []
    for f in range(NF):
        a = np.exp(-(r / 0.22) ** 2) * 0.95 + np.exp(-(r / 0.55) ** 2) * 0.25; b = np.exp(-(r / 0.2) ** 2)
        for k in range(2):
            p = (f / NF + k / 2) % 1.0; rad = 0.15 + 0.8 * p
            ring = np.exp(-((r - rad) / 0.06) ** 2) * (1 - p) ** 1.2
            a += ring * 0.8; b += ring * 0.5
        out.append(_img(_mix(cols, np.clip(b, 0, 1)), np.clip(a, 0, 1) * (r < 1)))
    return out

def sparkle_frames(cols, n=16, phase=0.0, points=4):
    """A twinkling star: thin cross rays + bright core, pulsing in size and brightness (offset by phase)."""
    X, Y = np.meshgrid((np.arange(n) + 0.5) / n * 2 - 1, (np.arange(n) + 0.5) / n * 2 - 1); r = np.sqrt(X * X + Y * Y); ang = np.arctan2(Y, X)
    out = []
    for f in range(NF):
        k = 0.5 + 0.5 * math.sin(2 * math.pi * (f / NF + phase)); s = 0.45 + 0.55 * k
        rays = np.exp(-(np.abs(np.sin(ang * points / 2)) * r / 0.06) ** 2) * np.clip(1 - r / s, 0, 1) ** 1.5
        a = np.clip(rays + np.exp(-(r / (0.18 * s + 0.05)) ** 2), 0, 1) * (0.35 + 0.65 * k)
        out.append(_img(_mix(cols, np.clip(np.exp(-(r / 0.25) ** 2) + rays * 0.4, 0, 1)), a))
    return out

def rune_band_frames(cols, w=192, h=12, seed=3):
    """A band of glowing runes; a bright highlight runs around it once per loop."""
    rr = random.Random(seed); mask = np.zeros((h, w))
    x = 2
    while x < w - 6:   # simple angular glyphs: verticals, bars, diagonals, dots
        g = rr.randint(0, 5); y0, y1 = 2, h - 3
        if g in (0, 3): mask[y0:y1 + 1, x] = 1
        if g in (1, 3, 4): mask[y0, x:x + 4] = 1
        if g in (2, 4): mask[y1, x:x + 4] = 1
        if g == 5: mask[(y0 + y1) // 2, x:x + 3] = 1
        if g in (0, 2): mask[(y0 + y1) // 2, x:x + 3] = 1
        if g == 1:
            for i in range(4): mask[min(y1, y0 + i * 2), x + i] = 1
        x += rr.randint(5, 7)
    glow = np.array(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0)), float) / 255
    X = (np.arange(w) + 0.5) / w; Yb = np.exp(-(((np.arange(h) + 0.5) / h * 2 - 1) / 0.75) ** 2)[:, None]
    out = []
    for f in range(NF):
        hl = np.exp(-(((X - f / NF + 0.5) % 1.0 - 0.5) / 0.12) ** 2)[None, :]
        a = np.clip(0.18 * Yb + mask * (0.6 + 0.4 * hl) + glow * 0.8, 0, 1)
        out.append(_img(_mix(cols, np.clip(mask * (0.4 + 0.6 * hl) + 0.2 * Yb, 0, 1)), a))
    return out

# ------------------------------------------------------------------------------------------------ static soft sprites
def soft_feather(col, core=(255, 255, 255), w=14, h=30):
    """A glowing feather mote: crisp white-gold feather with a soft halo (see-through)."""
    from plumage import feather_poly, _poly_mask
    S = 4; Y, X = np.mgrid[0:h * S, 0:w * S].astype(float) + 0.5
    m = _poly_mask(X, Y, feather_poly(w * S / 2, 2 * S, (h - 4) * S, (w - 5) * S, 0, 'point')).astype(float)
    m = np.array(Image.fromarray((m * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS), float) / 255
    halo = np.array(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6)), float) / 255
    rgb = _mix([col, core, core], np.clip(m, 0, 1)); shaft = np.zeros_like(m); shaft[3:h - 6, w // 2] = 1
    rgb = np.where(shaft[..., None] > 0, np.array(col, float), rgb)
    return _img(rgb, np.clip(m + halo * 0.6, 0, 1))
def soft_blob(cols, n=12, kind='ember'):
    """Small see-through sprites: ember (hot core), snow (six-point crystal), wisp (soft comet), drop (tear), shard."""
    X, Y = np.meshgrid((np.arange(n) + 0.5) / n * 2 - 1, (np.arange(n) + 0.5) / n * 2 - 1); r = np.sqrt(X * X + Y * Y); ang = np.arctan2(Y, X)
    if kind == 'snow':
        a = np.exp(-(np.abs(np.sin(ang * 3)) * r / 0.08) ** 2) * (r < 0.95) + np.exp(-(r / 0.25) ** 2); b = np.exp(-(r / 0.35) ** 2)
    elif kind == 'wisp':
        Yc = Y + 0.3; a = np.exp(-(X / 0.35) ** 2 - (np.maximum(Yc, 0) / 0.9) ** 2 - (np.minimum(Yc, 0) / 0.3) ** 2); b = a ** 2
    elif kind == 'drop':
        a = np.exp(-(X / (0.32 * np.clip(Y + 1.0, 0, 2) / 2 + 0.05)) ** 2) * np.exp(-(np.maximum(Y - 0.5, 0) / 0.2) ** 2) * (Y > -0.95); b = a ** 1.5
    elif kind == 'shard':
        a = ((np.abs(X) * 2.2 + np.abs(Y)) < 0.95).astype(float) * 0.95 + np.exp(-(r / 0.6) ** 2) * 0.3; b = np.clip(1 - np.abs(X) * 3, 0, 1)
    else:
        a = np.exp(-(r / 0.32) ** 2) + 0.35 * np.exp(-(r / 0.75) ** 2); b = np.exp(-(r / 0.3) ** 2)
    return _img(_mix(cols, np.clip(b, 0, 1)), np.clip(a, 0, 1))
def soft_leaf(col, vein, w=10, h=14):
    Y, X = np.mgrid[0:h, 0:w].astype(float) + 0.5; t = Y / h; half = (w / 2) * np.sin(np.pi * np.clip(t * 1.05, 0, 1)) + 0.3
    m = (np.abs(X - w / 2) <= half).astype(float); halo = np.array(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), float) / 255
    rgb = np.where((np.abs(X - w / 2) < 0.6)[..., None], np.array(vein, float), np.array(col, float) * (0.85 + 0.3 * (1 - t))[..., None])
    return _img(rgb, np.clip(m * 0.95 + halo * 0.45, 0, 1))

# ------------------------------------------------------------------------------------------------ geometry
def _euler(R):
    """Rotation matrix -> [x, y, z] degrees with R = Rz(z) Ry(y) Rx(x) (the mod's cube/bone rotation order)."""
    b = -math.asin(max(-1.0, min(1.0, R[2][0])))
    if abs(math.cos(b)) > 1e-6: a = math.atan2(R[2][1], R[2][2]); c = math.atan2(R[1][0], R[0][0])
    else: a = math.atan2(-R[1][2], R[1][1]); c = 0.0
    return [math.degrees(a), math.degrees(b), math.degrees(c)]
def _n(v): v = np.asarray(v, float); l = np.linalg.norm(v); return v / l if l > 1e-9 else v

def plane(m, bone, C, d, side, L, W, uv, flip=False):
    """A two-sided plane centred at C: length L along direction d, width W along `side` (made perpendicular to d).
    uv maps u along +d (source -> end) on both faces (north face reversed, as the mod needs; see MODEL-CONSTRAINTS.md)."""
    d = _n(d); sd = _n(np.asarray(side, float) - d * np.dot(side, d)); nz = np.cross(d, sd)
    R = np.array([d, sd, nz]).T
    u0, v0, u1, v1 = uv
    if flip: v0, v1 = v1, v0
    north = UV((u1, v0, u0, v1), uv.tex); south = UV((u0, v0, u1, v1), uv.tex)
    F_ = lambda q: {'uv': [round(x, 4) for x in q], 'texture': q.tex}
    m.cube(bone, [C[0] - L / 2, C[1] - W / 2, C[2] - 0.001], [C[0] + L / 2, C[1] + W / 2, C[2] + 0.001], {'north': F_(north), 'south': F_(south)},
           origin=[round(v, 4) for v in C], rotation=[round(v, 3) for v in _euler(R)])

def smooth(pts, bones=None, step=1.4):
    """Catmull-Rom curve through the control points, resampled about every `step` px (so streams curve smoothly instead
    of showing corners). bones (one per control segment) are carried over to the new segments."""
    P = [np.asarray(p, float) for p in pts]; out, ob = [P[0]], []
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = P[max(i - 1, 0)], P[i], P[i + 1], P[min(i + 2, len(P) - 1)]
        n = max(1, int(round(np.linalg.norm(p2 - p1) / step)))
        for j in range(1, n + 1):
            t = j / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
            ob.append(bones[i] if isinstance(bones, (list, tuple)) else bones)
    return out, ob

def ribbon(m, pts, width, uv, bones=None, cross=True, overlap=0.12, step=1.4):
    pts, bones = smooth(pts, bones, step)
    """(after smoothing) A stream of light along the polyline pts (model px). uv = an animated stream sprite (u along the stream). bones =
    one bone name per segment (or a single name). Each segment gets its slice of the sprite, so the pulse travels along
    the whole curve. cross=True adds a second plane turned 90 degrees around the stream, so it never vanishes edge-on."""
    P = [np.asarray(p, float) for p in pts]; seg = [np.linalg.norm(P[i + 1] - P[i]) for i in range(len(P) - 1)]; tot = sum(seg)
    u0, v0, u1, v1 = uv; acc = 0.0
    for i in range(len(P) - 1):
        A, B = P[i], P[i + 1]; d = B - A; L = seg[i]
        ua = u0 + (u1 - u0) * acc / tot; acc += L; ub = u0 + (u1 - u0) * acc / tot
        bn = bones[i] if isinstance(bones, (list, tuple)) else bones
        prev = P[i] - P[i - 1] if i > 0 else d; nxt = P[i + 2] - P[i + 1] if i + 2 < len(P) else d
        bend = np.cross(_n(prev) + _n(d), _n(nxt) + _n(d))           # the curve's own plane, so the flat face follows the bend
        nrm = _n(np.cross(d, bend)) if np.linalg.norm(bend) > 1e-3 else _n(np.cross(d, [0, 0, 1]) if abs(_n(d)[2]) < 0.9 else np.cross(d, [1, 0, 0]))
        C = (A + B) / 2; Lx = L * (1 + overlap)
        plane(m, bn, C, d, nrm, Lx, width, UV((ua, v0, ub, v1), uv.tex))
        if cross: plane(m, bn, C, d, np.cross(d, nrm), Lx, width * 0.8, UV((ua, v0, ub, v1), uv.tex))

def cross_sprite(m, bone, C, size, uv, planes=2, h=None, flat=True):
    """A sprite on `planes` crossed vertical planes (2 = X, 3 = star) centred at C, plus (flat=True) a horizontal one.
    Vanilla entity shading darkens upright planes to ~60-75 % but leaves up-facing ones at 100 %, and the third-person
    camera mostly looks down on the player, so the flat plane keeps light sprites from turning grey."""
    h = h if h is not None else size
    for j in range(planes):
        a = math.pi * j / planes; d = [math.cos(a), 0, math.sin(a)]
        plane(m, bone, C, d, [0, 1, 0], size, h, uv)
    if flat: plane(m, bone, C, [1, 0, 0], [0, 0, 1], size, h, uv)

def rest_points(m, bone):
    """Rest-pose world corners of every cube under `bone` (bone + cube rotations applied, no animation), to find where
    the feather tips really are before choosing where effects emit from."""
    import sim
    els = {e['uuid']: e for e in m.elements}; out = []
    def walk(b, M):
        p = b['origin']; Mb = M @ sim.T(*p) @ sim.rot_zyx(b.get('rotation', [0, 0, 0])) @ sim.T(-p[0], -p[1], -p[2])
        for c in b['children']:
            if isinstance(c, str):
                e = els[c]; cp = e.get('origin', [0, 0, 0]); Mc = Mb @ sim.T(*cp) @ sim.rot_zyx(e.get('rotation', [0, 0, 0])) @ sim.T(-cp[0], -cp[1], -cp[2])
                for x in (e['from'][0], e['to'][0]):
                    for y in (e['from'][1], e['to'][1]):
                        for z in (e['from'][2], e['to'][2]): out.append((Mc @ np.array([x, y, z, 1.0]))[:3])
            else: walk(c, Mb)
    def find(lst, M):
        for b in lst:
            if not isinstance(b, dict): continue
            p = b['origin']; Mb = M @ sim.T(*p) @ sim.rot_zyx(b.get('rotation', [0, 0, 0])) @ sim.T(-p[0], -p[1], -p[2])
            if b['name'] == bone: walk(b, M); return True
            if find(b['children'], Mb): return True
        return False
    find(m.root_bones, np.eye(4)); return out

def bez(p0, p1, p2, t): return [(1 - t) ** 2 * p0[i] + 2 * (1 - t) * t * p1[i] + t * t * p2[i] for i in range(3)]

class Motes:
    """Designed particles: a sprite on crossed planes that flies a curved (quadratic Bezier) path, tumbling, growing in and
    shrinking away. Two bones each (move + scale/tumble), like fx.Particles, so the shrink doesn't scale the path."""
    def __init__(self, m, parent=None, L=4.0, name='mote'):
        self.m, self.L, self.n, self.tracks, self.nm = m, L, 0, {}, name
        self.root = m.bone(name, [0, 0, 0], parent)
    def add(self, p0, p1, p2, size, uv, phase, planes=2, spin=0.0, sway=0.0, fade_in=0.12, fade_out=0.6, h=None):
        i = self.n; self.n += 1
        mv = self.m.bone('%s%d' % (self.nm, i), list(p0), self.root); sc = self.m.bone('%ss%d' % (self.nm, i), list(p0), mv)
        cross_sprite(self.m, sc, p0, size, uv, planes, h)
        br = (0.0, 0.2, 0.4, 0.6, 0.8, 1.0)
        self.tracks['%s%d' % (self.nm, i)] = {'position': cycle_keys(self.L, phase, lambda f: tuple(round(bez(p0, p1, p2, f)[k] - p0[k], 3) for k in range(3)), breaks=br)}
        st = {'scale': cycle_keys(self.L, phase, lambda f: (round(fade(f, fade_in, fade_out, 0.01), 3),) * 3, breaks=(0.0, fade_in, fade_out, 1.0))}
        rot = ['0', '0', '0']
        if spin: rot[1] = 'query.anim_time*%d+%d' % (spin, i * 47)
        if sway: rot[2] = 'math.sin(query.anim_time*150+%d)*%d' % (i * 61, sway)
        if spin or sway: st['rotation'] = [(0, *rot)]
        self.tracks['%ss%d' % (self.nm, i)] = st
    def add_tracks(self, tracks):
        for k, v in self.tracks.items(): tracks[k] = v
        return tracks

class Effects:
    """Everything a cosmetic's effects add to each clip: mote tracks + bone motion (Molang, continuous across clips)."""
    def __init__(self): self.parts, self.extra = [], {}
    def add_tracks(self, tracks):
        for p in self.parts: p.add_tracks(tracks)
        for k, v in self.extra.items(): tracks[k] = v
        return tracks

# ------------------------------------------------------------------------------------------------ themes
# Each wing collection gets its own effect identity. cols ramps run edge -> body -> core.
THEMES = {
    'celestial': dict(stream=[(255, 176, 40), (255, 214, 100), (255, 240, 180), (255, 255, 240)], energy=[(30, 170, 255), (80, 225, 255), (200, 250, 255), (255, 255, 255)],
                      spark=[(255, 196, 70), (255, 232, 160), (255, 255, 235)], motes=('feather', 'spark'), motecol=(255, 186, 50), motecore=(255, 238, 180)),
    'solar': dict(stream=[(255, 110, 0), (255, 170, 20), (255, 226, 110), (255, 250, 210)], energy=[(255, 70, 0), (255, 140, 10), (255, 210, 90), (255, 245, 200)],
                  spark=[(255, 150, 20), (255, 215, 90), (255, 250, 210)], motes=('ember', 'spark'), motecol=(255, 140, 10), motecore=(255, 236, 150)),
    'frost': dict(stream=[(70, 160, 255), (140, 210, 255), (215, 244, 255), (255, 255, 255)], energy=[(40, 110, 255), (100, 190, 255), (200, 240, 255), (255, 255, 255)],
                  spark=[(120, 200, 255), (200, 240, 255), (255, 255, 255)], motes=('snow', 'shard'), motecol=(140, 210, 255), motecore=(240, 252, 255)),
    'verdant': dict(stream=[(40, 170, 50), (120, 225, 80), (220, 240, 130), (255, 255, 215)], energy=[(210, 160, 20), (245, 205, 70), (255, 240, 160), (255, 255, 230)],
                    spark=[(150, 230, 90), (230, 245, 150), (255, 255, 220)], motes=('leaf', 'spark'), motecol=(90, 200, 70), motecore=(230, 245, 140)),
    'throne': dict(stream=[(150, 0, 20), (230, 26, 40), (255, 170, 60), (255, 238, 186)], energy=[(255, 150, 20), (255, 200, 70), (255, 236, 160), (255, 255, 225)],
                   spark=[(230, 30, 40), (255, 190, 80), (255, 245, 210)], motes=('ember', 'spark'), motecol=(230, 26, 40), motecore=(255, 210, 120)),
    'void': dict(stream=[(80, 0, 140), (160, 50, 255), (255, 70, 120), (255, 215, 235)], energy=[(200, 0, 40), (255, 40, 70), (255, 140, 160), (255, 230, 235)],
                 spark=[(150, 60, 255), (230, 140, 255), (255, 230, 255)], motes=('wisp', 'spark'), motecol=(120, 30, 220), motecore=(255, 120, 170)),
    'storm': dict(stream=[(30, 90, 255), (80, 196, 255), (196, 244, 255), (255, 255, 255)], energy=[(30, 90, 255), (80, 196, 255), (196, 244, 255), (255, 255, 255)],
                  spark=[(80, 190, 255), (190, 240, 255), (255, 255, 255)], motes=('spark', 'shard'), motecol=(80, 196, 255), motecore=(235, 250, 255), bolt=True),
    'blood': dict(stream=[(120, 0, 10), (220, 10, 30), (255, 86, 66), (255, 206, 186)], energy=[(160, 0, 20), (240, 20, 40), (255, 120, 90), (255, 220, 200)],
                  spark=[(230, 20, 30), (255, 120, 80), (255, 225, 200)], motes=('ember', 'drop'), motecol=(220, 10, 30), motecore=(255, 150, 110)),
    'abyss': dict(stream=[(10, 60, 170), (24, 150, 220), (80, 236, 226), (215, 255, 250)], energy=[(0, 90, 200), (20, 180, 230), (110, 240, 235), (230, 255, 255)],
                  spark=[(40, 180, 230), (140, 245, 235), (235, 255, 255)], motes=('wisp', 'spark'), motecol=(24, 160, 220), motecore=(160, 250, 240)),
    'soul': dict(stream=[(70, 20, 140), (150, 80, 255), (205, 165, 255), (245, 235, 255)], energy=[(90, 255, 200), (150, 255, 220), (220, 255, 240), (255, 255, 255)],
                 spark=[(160, 100, 255), (220, 190, 255), (250, 245, 255)], motes=('wisp', 'spark'), motecol=(140, 80, 255), motecore=(225, 205, 255)),
}
FX_THEME = {'angel': 'celestial', 'flame': 'solar', 'frost': 'frost', 'leaf': 'verdant', 'storm': 'storm', 'void': 'void', 'blood': 'blood'}
def auto_theme(fx, col, col2):
    """A theme for a wing without a named one: the mote kinds / stream style of its fx family, recoloured with its own
    colours (so no two wings share the same effect)."""
    base = dict(THEMES[FX_THEME.get(fx, 'celestial')]); c, c2 = np.array(col, float), np.array(col2, float)
    lift = lambda v, k: tuple(int(min(255, x + (255 - x) * k)) for v_ in [v] for x in v_)
    base['stream'] = [tuple(int(x) for x in c * 0.75), tuple(int(x) for x in c), lift(c2, 0.45), lift(c2, 0.85)]
    base['spark'] = [tuple(int(x) for x in c), lift(c2, 0.4), lift(c2, 0.9)]
    base['motecol'] = tuple(int(x) for x in c); base['motecore'] = lift(c2, 0.6)
    return base
def theme(t, fx='angel', col=(255, 200, 80), col2=(255, 240, 200)):
    return THEMES[t] if isinstance(t, str) and t in THEMES else (t if isinstance(t, dict) else auto_theme(fx, col, col2))

def mote_sprites(m, k, th, kind, key):
    """uv list for a mote kind (several variants where it twinkles)."""
    FA = flow(m)
    if kind == 'spark': return [FA.add(key + 'sp%d' % j, lambda j=j: sparkle_frames(th['spark'], phase=j / 3)) for j in range(3)]
    if kind == 'feather': return [k.soft(key + 'fea', soft_feather(th['motecol'], th.get('motecore', (255, 255, 255))))]
    if kind == 'leaf': return [k.soft(key + 'leaf', soft_leaf(th['motecol'], th.get('motecore', (230, 245, 140))))]
    return [k.soft(key + kind, soft_blob([th['motecol'], th.get('motecore', (255, 255, 255)), (255, 255, 255)], kind=kind))]
MOTE_PATH = {   # how each kind moves from its emit point (dx, dy over the two curve points) and its size
    'feather': ((2, -5, -2), (3, -15, 0), 3.0, 4.2, 70, 25), 'leaf': ((2, -4, -2), (4, -14, 1), 2.4, 3.2, 90, 35),
    'ember': ((1, 4, -1), (2, 10, -2), 1.1, None, 0, 0), 'spark': ((1.5, 3, -1), (3, 8, -2), 1.5, None, 0, 0),
    'snow': ((1, -4, -1), (2, -12, 1), 1.5, None, 60, 20), 'shard': ((2, -3, -2), (4, -9, -1), 1.3, 2.4, 160, 0),
    'wisp': ((1, 3, -2), (2, 9, -4), 2.2, 3.0, 0, 18), 'drop': ((0, -4, 0), (0.5, -12, 0), 1.0, 1.6, 0, 0),
}
def emit(mo, X, p0, kind, uvs, i, n, rr, size, side_phase):
    (a1, b1, c1), (a2, b2, c2), sz, hh, spin, sway = MOTE_PATH[kind]
    j = lambda v: v * rr.uniform(0.7, 1.3)
    p0 = np.asarray(p0, float)
    mo.add(X(p0), X(p0 + [j(a1), j(b1), j(c1)]), X(p0 + [j(a2), j(b2), j(c2)]), sz * size, uvs[i % len(uvs)], i / n + side_phase,
           planes=2, spin=spin, sway=sway, fade_in=0.12, fade_out=0.55, h=(hh or sz) * size)

def stream_uv(m, th, key, **kw):
    FA = flow(m)
    if th.get('bolt'): return FA.add(key + 'bolt', lambda: bolt_frames(th['stream'], seed=len(key)))
    return FA.add(key, lambda: stream_frames(th['stream'], **kw))

def wing_essence(m, k, theme, G, size=1.0):
    """The designed effects for a feathered wing pair. G = rest-pose geometry from wingkit.build: WS, WE, WW, WH (right
    wing joints), tip (outer primary tip, right), gem (harness gem or None). Returns an Effects for fx.clips()."""
    th = theme if isinstance(theme, dict) else THEMES[theme]; FA = flow(m); E = Effects()
    gold = stream_uv(m, th, 'stream', seed=1)
    gold2 = stream_uv(m, th, 'stream2', pulses=1, tail=0.3, seed=2)
    cyan = FA.add('energy', lambda: stream_frames(th['energy'], pulses=3, tail=0.12, start=0.02, end=0.6, seed=3))
    WS, WE, WW, WH, tip = (np.asarray(G[x], float) for x in ('WS', 'WE', 'WW', 'WH', 'tip'))
    for s, n in ((1, 'r'), (-1, 'l')):
        X = lambda p: [p[0] * s, p[1], p[2]]
        wb, mb, hb = 'wing_' + n, 'mid_' + n, 'hand_' + n
        # 1) leading-edge stream: rides the wing from the root along the gold frame, past the wrist crest, and curls off the
        #    tip into a fading flourish (segments sit on the arm / forearm / hand bones, so it bends with the wing)
        up = np.array([0, 1.6, -2.6])
        P = [WS + up, (WS + WE) / 2 + up + [0, 0.4, 0], WE + up, (WE + WW) / 2 + up + [0, 0.5, -0.2], WW + up + [0, 0.3, -0.4],
             (WW + WH) / 2 + up + [0, 0.6, -0.6], WH + up + [0, 0.4, -0.8], WH + [4.5, 3.6, -3.8], WH + [8.0, 2.2, -4.0], WH + [9.6, -1.6, -3.6], WH + [8.6, -4.8, -3.0]]
        B = [wb, wb, mb, mb, hb, hb, hb, hb, hb, hb]
        ribbon(m, [X(p) for p in P], 3.4 * size, gold, B)
        # 2) a long sweeping stream: from behind the wing root, down and out under the wing, round the outside edge and
        #    forward past the hip (wraps partially around the wing); sways on its own bone
        fb = m.bone('flow_' + n, X(WS + [0, 0, -3]), wb)
        Q = [WS + [0.5, -2.0, -3.5], WS + [6, -8, -6.5], WS + [13, -12, -7.5], WS + [20, -11, -6], WS + [25, -6, -3], WS + [27, 0, 1], WS + [25, 4, 4.5], WS + [21, 6, 6.5]]
        ribbon(m, [X(q) for q in Q], 3.0 * size, gold2, fb)
        E.extra[fb] = {'rotation': [(0, 'math.sin(query.anim_time*60+%d)*4' % (90 * s), '%d*math.sin(query.anim_time*45)*7' % s, '%d*math.sin(query.anim_time*75+40)*3' % s)]}
        # 3) cyan energy from the harness gem along the arm (the wing-root energy travelling outward)
        if G.get('gem') is not None:
            g = np.asarray(G['gem'], float)
            R_ = [g, g + [1.6, 0.4, -0.6], WS + [0, 0.4, -2.0], (WS + WE) / 2 + [0, 0.6, -2.2], WE + [0, 0.8, -2.4], WE + [1.6, 3.0, -2.6]]
            ribbon(m, [X(r) for r in R_], 2.2 * size, cyan, ['harness' if 'harness' in m.bones else wb, wb, wb, wb, mb])
    # 4) a spiral of light circling behind the back between the wings (its own bone, turning continuously)
    m.bone('orbit_fx', [0, WS[1] - 2, -6.5])
    spiral = [[math.cos(a) * (4.2 + 0.8 * math.sin(a * 1.3)), WS[1] - 9 + a * 2.1, -6.5 + math.sin(a) * 3.2] for a in np.linspace(0, 2.4 * math.pi, 16)]
    ribbon(m, spiral, 2.4 * size, gold2, 'orbit_fx')
    E.extra['orbit_fx'] = {'rotation': [(0, 0, 'query.anim_time*50', 0)]}
    # 5) wing-root energy: a pulsing core at the gem
    if G.get('gem') is not None:
        pu = FA.add('pulse', lambda: pulse_frames(th['energy']))
        gb = m.bone('core_fx', list(G['gem']), 'harness' if 'harness' in m.bones else None)
        cross_sprite(m, gb, list(np.asarray(G['gem']) + [0, 0, -0.4]), 7.0 * size, pu, planes=3)
        E.extra['core_fx'] = {'scale': [(0, 'math.sin(query.anim_time*180)*0.12+1', 'math.sin(query.anim_time*180)*0.12+1', 'math.sin(query.anim_time*180)*0.12+1')]}
    # 6) motes from deliberate points, on the wing bones so they leave from where the wing really is (the wings wrap
    #    forward at rest): glowing feathers shed from the primary tips, sparkles from the stream flourish and the outer
    #    feather edge, small energy motes rising from the gem
    rr = random.Random(m.name); k1, k2 = th['motes']
    u1, u2 = mote_sprites(m, k, th, k1, 'm1'), mote_sprites(m, k, th, k2, 'm2')
    for s, n in ((1, 'r'), (-1, 'l')):
        X = lambda p: [p[0] * s, p[1], p[2]]
        mo = Motes(m, 'hand_' + n, 4.0, 'mote_' + n); E.parts.append(mo)
        tips = [np.asarray(p, float) for p in G.get('tips', [tip])]
        for i in range(5): emit(mo, X, tips[rr.randrange(len(tips))] + [-1.0, 0.5, 0], k1, u1, i, 5, rr, size, 0.1 if s < 0 else 0.03)
        for i in range(7):
            src = (WH + [9.0, -3.0, -3.4]) if i % 3 == 0 else ((WW + [0.6, 3.6, -3.4]) if i % 3 == 1 else (tips[rr.randrange(len(tips))] + [-1.0, 0.5, -0.6]))
            emit(mo, X, src, k2, u2, i, 7, rr, size, 0.07 if s < 0 else 0.0)
    if G.get('gem') is not None:
        mo = Motes(m, 'harness' if 'harness' in m.bones else None, 4.0, 'mote_c'); E.parts.append(mo)
        em = k.soft('egm', soft_blob(th['energy'], kind='ember'))
        for i in range(6):
            s = 1 if i % 2 else -1; g = np.asarray(G['gem'], float)
            mo.add(list(g + [0, 0, -0.6]), list(g + [s * 2.5, 2.5, -2.0]), list(g + [s * rr.uniform(3, 6), rr.uniform(7, 11), -rr.uniform(2, 4)]), 1.0 * size, em, i / 6, planes=2, fade_in=0.1, fade_out=0.5)
    return E

# ------------------------------------------------------------------------------------------------ halo
def halo(m, k, y, cols, ring=((240, 190, 60), (255, 245, 190), (150, 95, 15)), gems=(84, 232, 255), parent=None, L=3.0, R=6.4, size=1.0):
    """An animated celestial halo at height y (helmet frame, Y up): ornate painted gold ring with raised gem sockets
    (faces up, so the shader lights it fully), a band of glowing runes standing round its rim (animated: a highlight runs
    round it), a thinner spiked inner ring turning the other way, a soft bloom, and sparkles rising off it. Returns an
    Effects (tracks for the halo bones + the motes)."""
    import headkit as HK
    E = Effects(); FA = flow(m)
    m.bone('halo_fx', [0, y, 0], parent); m.bone('halo_in', [0, y + 0.6, 0], parent)
    img, g, Rt = HK.paint_ring(R * size, (R - 1.8) * size, ring[0], ring[1], ring[2], gems, 8, True, spikes=16, spike_len=1.4, seed=11, glow_runes=cols[1])
    HK.flat(m, 'halo_fx', img, Rt, y, glow=True)
    if g is not None: HK.flat(m, 'halo_fx', g, Rt, y + 0.03, glow=True, thick=0)
    torus(m, k, 'halo_fx', y - 1.2, (R - 0.9) * size, h=3.6, w=2.0, col=ring[0], light=ring[1], dark=ring[2], key='hr3')
    rb = FA.add('runes', lambda: rune_band_frames(cols))
    n = 28; rad = (R - 0.9) * size; u0, v0, u1, v1 = rb
    for i in range(n):   # the rune band: upright plates standing round the ring, each showing its slice of the band
        a0, a1 = 2 * math.pi * i / n, 2 * math.pi * (i + 1) / n
        A = np.array([math.cos(a0) * rad, y + 0.85, math.sin(a0) * rad]); B = np.array([math.cos(a1) * rad, y + 0.85, math.sin(a1) * rad])
        plane(m, 'halo_fx', (A + B) / 2, B - A, [0, 1, 0], np.linalg.norm(B - A) * 1.06, 1.5 * size, UV((u0 + (u1 - u0) * i / n, v0, u0 + (u1 - u0) * (i + 1) / n, v1), rb.tex))
    img2, g2, Rt2 = HK.paint_ring((R - 2.4) * size, (R - 3.1) * size, ring[1], (255, 255, 255), ring[0], None, 0, False, spikes=12, spike_len=1.1, seed=7)
    HK.flat(m, 'halo_in', img2, Rt2, y + 0.6, glow=True, thick=0.2)
    torus(m, k, 'halo_in', y + 0.3, (R - 2.75) * size, h=2.2, w=1.2, col=ring[1], light=(255, 255, 255), dark=ring[0], n=24, key='ir3')
    blo = k.soft('hbloom', __import__('paint').soft(48, 48, cols[1], peak=120, ring=(0.7, 0.16)))
    m.flat('halo_fx', [-(R + 3) * size, y - 0.3, -(R + 3) * size], [(R + 3) * size, y - 0.28, (R + 3) * size], blo)
    E.extra['halo_fx'] = {'rotation': [(0, 0, 'query.anim_time*28', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*120)*0.35', 0)]}
    E.extra['halo_in'] = {'rotation': [(0, 0, '-query.anim_time*55', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*120+60)*0.35', 0)]}
    sp = [FA.add('hspark%d' % j, lambda j=j: sparkle_frames(cols, phase=j / 3)) for j in range(3)]
    mo = Motes(m, 'halo_fx', L, 'hmote'); E.parts.append(mo); rr = random.Random(m.name + 'halo')
    for i in range(10):
        a = 2 * math.pi * i / 10 + rr.uniform(-0.2, 0.2); r = R * size * rr.uniform(0.8, 1.05); p0 = [math.cos(a) * r, y + 0.4, math.sin(a) * r]
        mo.add(p0, [p0[0] * 1.08, y + rr.uniform(1.5, 2.5), p0[2] * 1.08], [p0[0] * 1.15, y + rr.uniform(3.5, 5.5), p0[2] * 1.15], 1.2 * size, sp[i % 3], i / 10, planes=2, fade_in=0.2, fade_out=0.55)
    return E

def membrane_essence(m, k, th, G, size=1.0):
    """Designed effects for a bat / dragon wing pair. G: S0, E0, W0 (right arm joints), tips (finger tip x,y), z (bone
    plane), gem (hand gem or None). A stream rides the arm and the longest finger and trails off its claw; short trails
    leave every claw; a sweeping stream wraps under the wing; a spiral circles the back; motes leave the claws and the
    scalloped trailing edge (on the finger bones, so they follow the membrane)."""
    th = theme(th); FA = flow(m); E = Effects()
    main = stream_uv(m, th, 'stream', seed=1); soft2 = stream_uv(m, th, 'stream2', pulses=1, tail=0.3, seed=2)
    S0, E0, W0 = (np.asarray(G[x], float) for x in ('S0', 'E0', 'W0')); z = G['z'] - 0.8; tips = G['tips']
    for s, n in ((1, 'r'), (-1, 'l')):
        X = lambda p: [p[0] * s, p[1], p[2]]
        wb, mb, hb = 'wing_' + n, 'mid_' + n, 'hand_' + n; fb = ['fin%d_%s' % (i, n) for i in range(len(tips))]
        L_ = max(range(len(tips)), key=lambda i: tips[i][1]); T = np.array([tips[L_][0], tips[L_][1], z])
        up = np.array([0, 1.4, 0]); W_ = np.array([W0[0], W0[1], z])
        P = [np.array([S0[0], S0[1], z]) + up, (np.array([S0[0], S0[1], z]) + np.array([E0[0], E0[1], z])) / 2 + up, np.array([E0[0], E0[1], z]) + up,
             (np.array([E0[0], E0[1], z]) + W_) / 2 + up, W_ + up, W_ + (T - W_) * 0.5 + up * 0.6, T, T + (T - W_) / np.linalg.norm(T - W_) * 5 + [0, 1.5, -1.5],
             T + (T - W_) / np.linalg.norm(T - W_) * 8 + [0, -1.5, -2.5]]
        ribbon(m, [X(p) for p in P], 3.0 * size, main, [wb, wb, mb, mb, hb, fb[L_], fb[L_], fb[L_]])
        for i, t_ in enumerate(tips):   # a short fading trail off every claw
            d = np.array([t_[0] - W0[0], t_[1] - W0[1], 0.0]); d /= np.linalg.norm(d); C = np.array([t_[0], t_[1], z])
            ribbon(m, [X(C), X(C + d * 3 + [0, 0, -1]), X(C + d * 6 + [0, -1.2, -2.2]), X(C + d * 8 + [0, -3, -2.8])], 2.0 * size, soft2, fb[i])
        fl = m.bone('flow_' + n, X([S0[0], S0[1], -3]), wb)
        Q = [S0 + [0.5, -2, -2.5], S0 + [6, -8, -6.5], S0 + [13, -12, -7.5], S0 + [20, -11, -6], S0 + [25, -6, -3], S0 + [27, 0, 1], S0 + [25, 4, 4.5], S0 + [21, 6, 6.5]]
        ribbon(m, [X(q * [size, 1, 1] + [0, 0, 0]) for q in Q], 2.8 * size, soft2, fl)
        E.extra[fl] = {'rotation': [(0, 'math.sin(query.anim_time*60+%d)*4' % (90 * s), '%d*math.sin(query.anim_time*45)*7' % s, '%d*math.sin(query.anim_time*75+40)*3' % s)]}
    m.bone('orbit_fx', [0, S0[1] - 2, -6.5])
    spiral = [[math.cos(a) * (4.2 + 0.8 * math.sin(a * 1.3)), S0[1] - 9 + a * 2.1, -6.5 + math.sin(a) * 3.2] for a in np.linspace(0, 2.4 * math.pi, 16)]
    ribbon(m, spiral, 2.4 * size, soft2, 'orbit_fx'); E.extra['orbit_fx'] = {'rotation': [(0, 0, 'query.anim_time*50', 0)]}
    if G.get('gem') is not None:
        pu = FA.add('pulse', lambda: pulse_frames(th['energy']))
        for s, n in ((1, 'r'), (-1, 'l')):
            gb = m.bone('core_fx_' + n, [s * W0[0], W0[1], z - 0.6], 'hand_' + n)
            cross_sprite(m, gb, [s * W0[0], W0[1], z - 0.8], 5.5 * size, pu, planes=3)
            E.extra[gb] = {'scale': [(0, 'math.sin(query.anim_time*180)*0.12+1', 'math.sin(query.anim_time*180)*0.12+1', 'math.sin(query.anim_time*180)*0.12+1')]}
    rr = random.Random(m.name); k1, k2 = th['motes']
    u1, u2 = mote_sprites(m, k, th, k1, 'm1'), mote_sprites(m, k, th, k2, 'm2')
    for s, n in ((1, 'r'), (-1, 'l')):
        X = lambda p: [p[0] * s, p[1], p[2]]
        for i, t_ in enumerate(tips):
            mo = Motes(m, 'fin%d_%s' % (i, n), 4.0, 'mote%d_%s' % (i, n)); E.parts.append(mo)
            C = np.array([t_[0], t_[1], z])
            emit(mo, X, C, k1, u1, 0, 2, rr, size, (i * 0.23 + (0.1 if s < 0 else 0)) % 1)
            emit(mo, X, C, k1, u1, 1, 2, rr, size, (i * 0.23 + 0.5 + (0.1 if s < 0 else 0)) % 1)
            if i + 1 < len(tips):   # from the middle of the scalloped edge between this claw and the next
                b_ = tips[i + 1]; mid = np.array([(t_[0] + b_[0]) / 2 * 0.85 + W0[0] * 0.15, (t_[1] + b_[1]) / 2 * 0.85 + W0[1] * 0.15, z])
                emit(mo, X, mid, k2, u2, 0, 1, rr, size, (i * 0.31 + 0.2) % 1)
    return E

# ------------------------------------------------------------------------------------------------ solid 3D rings
def ring3d(m, k, bone, y, R, tr=1.3, th=1.1, col=(240, 190, 60), light=(255, 245, 190), dark=(150, 95, 15), n=32, glow=True, key='r3', broken=()):
    """A solid ring (a band with real depth and height, made of n bevelled segments) lying round the vertical axis at
    height y, radius R (centre of the band). Flat painted halos vanish when seen side-on; this one shows its outer face
    (bright lip, engraved centre line, shaded lower edge), top, inner face and underside from every angle."""
    import paint as P
    def face(rows):   # vertical stripe sprite from a list of colours (top -> bottom)
        a = np.zeros((len(rows), 2, 4), np.uint8)
        for i, c in enumerate(rows): a[i, :, :3] = c; a[i, :, 3] = 255
        return Image.fromarray(a, 'RGBA')
    sh = lambda c, f: tuple(int(max(0, min(255, v * f))) for v in c)
    outer = face([light, light, col, col, sh(col, 0.7), col, col, sh(col, 0.8), dark, dark])
    top = face([light, light, sh(light, 0.92), col]); inner = face([col, sh(col, 0.75), dark, dark]); under = face([dark, sh(dark, 0.8)])
    add = (lambda kk, im: k.glow(key + kk, im)) if glow else (lambda kk, im: k.main(key + kk, im))
    uo, ut, ui, ud = add('o', outer), add('t', top), add('i', inner), add('d', under)
    F_ = lambda q: {'uv': [round(x, 4) for x in q], 'texture': q.tex}
    for i in range(n):
        a = 2 * math.pi * (i + 0.5) / n; L = 2 * math.pi * R / n * 1.04
        if any(b0 <= math.degrees(a) % 360 <= b1 for b0, b1 in broken): continue   # keep a broken halo broken
        t = np.array([-math.sin(a), 0, math.cos(a)]); r = np.array([math.cos(a), 0, math.sin(a)]); up = np.array([0, 1.0, 0])
        Rm = np.array([t, up, r]).T          # local x = tangent, y = up, z = outward
        C = [math.cos(a) * R, y, math.sin(a) * R]
        m.cube(bone, [C[0] - L / 2, C[1] - th / 2, C[2] - tr / 2], [C[0] + L / 2, C[1] + th / 2, C[2] + tr / 2],
               {'south': F_(uo), 'north': F_(ui), 'up': F_(ut), 'down': F_(ud)}, origin=[round(v, 4) for v in C], rotation=[round(v, 3) for v in _euler(Rm)])

def torus(m, k, bone, y, R, h=3.4, w=2.0, col=(240, 190, 60), light=(255, 245, 190), dark=(150, 95, 15), n=32, glow=True, key='tr', broken=()):
    """A thick solid ring with a rounded profile (narrow top lip, wide middle band, narrow bottom lip), ~h px tall and w px
    deep, so it reads as a solid 3D halo from the side as well as from above."""
    ring3d(m, k, bone, y, R, tr=w, th=h * 0.5, col=col, light=light, dark=dark, n=n, glow=glow, key=key + 'm', broken=broken)
    ring3d(m, k, bone, y + h * 0.36, R, tr=w * 0.62, th=h * 0.24, col=light, light=(255, 255, 255), dark=col, n=n, glow=glow, key=key + 't', broken=broken)
    ring3d(m, k, bone, y - h * 0.36, R, tr=w * 0.62, th=h * 0.24, col=col, light=col, dark=dark, n=n, glow=glow, key=key + 'b', broken=broken)
