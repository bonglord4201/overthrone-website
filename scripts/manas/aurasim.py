# Where Manas Cosmetics 1.0.6 draws aura particles, ported from its decompiled client/renderer/aura/*Style.java
# (same hash, same maths), so weapon auras can be tuned offline against the blade they sit on.
# Units: aura units (blocks before the slot scale). CosmeticLayer.renderWeaponAura puts the aura at the hand transform,
# then translate(0, bladeLift + offset, 0) in blocks, then scale(s) with s = clamp(0.4 * weapon length in blocks, 0.12, 1.2).
import math
import numpy as np

def _i32(n): n &= 0xffffffff; return n - (1 << 32) if n & 0x80000000 else n
def h(n):   # AuraStyle.hash
    n &= 0xffffffff
    n = n ^ 0x3D ^ (n >> 16)
    n = (n * 9) & 0xffffffff
    n ^= n >> 4
    n = (n * 668265261) & 0xffffffff
    n ^= n >> 15
    return (n & 0x7fffffff) / 2.1474836E9
def env(t): return t / 0.12 if t < 0.12 else ((1 - t) / 0.25 if t > 0.75 else 1.0)
def grad(cols, t, tint):
    n = len(cols)
    if n <= 1: c = np.array(cols[0], float)
    else:
        f = t * (n - 1); i = min(max(int(f), 0), n - 2); fr = f - i
        c = np.array(cols[i], float) + (np.array(cols[i + 1], float) - np.array(cols[i], float)) * fr
    return np.clip(c * tint, 0, 255)

DEFAULT_COUNT = {'twin_helix': 160, 'rising_motes': 260, 'flame': 320, 'flame_scorched': 320, 'vortex_shroud': 240, 'orbiting_orbs': 70,
                 'falling_embers': 180, 'starfield_shimmer': 140, 'ember_crown': 80}

def particles(a, time):
    """a = the 'aura' dict of a cosmetic JSON. Returns [(x, y, z, half_size, rgb, alpha 0..1)] in aura units."""
    st = a['style']; cols = a['colors']; n = a.get('particle_count') or DEFAULT_COUNT.get(st, 160)
    R, H, size, speed, rot, alpha = a['radius'], a['height'], a['size'], a['speed'], a['rotation_speed'], a.get('alpha', 1.0)
    out = []
    if st == 'twin_helix':
        ts = speed / 3.0; spin = time * 1.6 * rot
        for i in range(n):
            ph = h(i * 5); jx = (h(i * 5 + 1) - .5) * .08; jz = (h(i * 5 + 2) - .5) * .08; sc = .75 + h(i * 5 + 3) * .55; ti = .75 + h(i * 5 + 4) * .25
            t = (time * ts + ph) % 1.0; th = math.pi * 5 * t + spin + (i & 1) * math.pi + ph * .5; r = .55 * R * (1 - .25 * t)
            out.append((r * math.cos(th) + jx, t * 2.4 * H, r * math.sin(th) + jz, .07 * sc * size * (.8 + .4 * math.sin(math.pi * t)), grad(cols, t, ti), env(t) * .9 * alpha))
    elif st == 'rising_motes':
        ts = speed / 2.4
        for i in range(n):
            s = [h(i * 8 + k) for k in range(8)]
            th = s[0] * 2 * math.pi; cp = s[1] * 2 - 1; sp = math.sqrt(max(0, 1 - cp * cp))
            d = np.array([sp * math.cos(th), cp + .45, sp * math.sin(th)]); d /= np.linalg.norm(d)
            t = (time * ts + s[3]) % 1.0; dist = (.4 + s[2] * .95) * t * R
            out.append(((s[4] - .5) * .3 * R + d[0] * dist, d[1] * dist * H, (s[5] - .5) * .3 * R + d[2] * dist, .075 * (.75 + s[6] * .55) * size, grad(cols, t, .7 + s[7] * .3), env(t) * .85 * alpha))
    elif st in ('flame', 'flame_scorched'):
        ts = speed / 1.15
        if st == 'flame_scorched':
            for j in range(int(round(165 * min(1, n / 320)))):
                ring = j < 110; ang = h(j * 7 + 1000) * 2 * math.pi
                rad = (.95 + h(j * 7 + 1001) * .35) if ring else (.15 + math.sqrt(h(j * 7 + 1001)) * .75)
                heat = (.55 + h(j * 7 + 1005) * .45) if ring else (.1 + h(j * 7 + 1005) * .5); f = .75
                out.append((rad * R * math.cos(ang), .04, rad * R * math.sin(ang), .1 * ((1 if ring else .6) + h(j * 7 + 1004) * .6) * size, grad(cols, .45 - heat * .39, (.7 + .3 * heat) * f), (.4 + .5 * heat) * f * alpha))
        for i in range(n):
            g = [h(i * 13 + k) for k in range(13)]
            ang = g[0] * 2 * math.pi; rad = .2 + .8 * math.sqrt(g[1]); em = g[12] < .28
            t = (time * ts + g[2]) % 1.0; rise = t ** .72
            py = rise * (2.5 if em else 1.55) * (.75 + g[3] * .5) * H
            rn = rad * (1 - .45 * rise) * R; wa = (.08 if em else .32) * R * rise
            px = rn * math.cos(ang) + wa * math.sin(time * (3 + g[4] * 4) + g[5] * 2 * math.pi)
            pz = rn * math.sin(ang) + wa * math.sin(time * (3 + g[6] * 4) + g[7] * 2 * math.pi)
            fl = .6 * math.sin(time * (9 + g[8] * 8) + g[9] * 2 * math.pi) + .4 * math.sin(time * (9 + g[8] * 8) * 2.3 + g[9] * 5); f = .55 + .225 * (fl + 1)
            out.append((px, py, pz, .105 * (.7 + g[10] * .6) * size * (.4 if em else 1.2 - .65 * rise) * (.85 + .3 * f),
                        grad(cols, t * .33 if em else t, (.8 + g[11] * .2) * f), env(t) * (.95 if em else 1 - .4 * rise) * f * alpha * (.9 if em else .8)))
    elif st in ('vortex_shroud', 'ember_crown'):
        yb, ext, br = (0.0, 2.3, .75) if st == 'vortex_shroud' else (2.0, .6, .35)
        ts = speed / 2.0; spin = time * 2.2 * rot
        for i in range(n):
            ph = h(i * 4); t = (time * ts + ph) % 1.0; rise = t * math.sqrt(t)
            r = br * R * (1 - .7 * rise) * (.8 + h(i * 4 + 1) * .4); th = ph * 2 * math.pi + 4 * t + spin
            out.append((r * math.cos(th), (yb + rise * ext) * H, r * math.sin(th), .08 * (.7 + h(i * 4 + 2) * .6) * size * (1 - .35 * rise), grad(cols, t, .75 + h(i * 4 + 3) * .25), env(t) * (1 - .5 * rise) * alpha))
    elif st == 'orbiting_orbs':
        orbs = max(1, (n + 13) // 14); spin = time * 1.8 * rot
        for i in range(n):
            k, j = i // 14, i % 14; th = spin + k * 2 * math.pi / orbs - j * .09; tf = j / 14; fade = 1 - tf
            out.append((.85 * R * math.cos(th), 1.2 * H + .35 * math.sin(2 * th), .85 * R * math.sin(th), .11 * size * (.45 + .55 * fade), grad(cols, tf, .85 + h(i) * .15), min(1, .95 * fade * alpha)))
    elif st == 'falling_embers':
        ts = speed / 3.5
        for i in range(n):
            ang = h(i * 7) * 2 * math.pi; rad = math.sqrt(h(i * 7 + 1)) * .95
            t = (time * ts + h(i * 7 + 2)) % 1.0; sw = .16 * math.sin(time * (1.5 + h(i * 7 + 3) * 2) + h(i * 7 + 4) * 2 * math.pi)
            out.append(((rad * math.cos(ang) + sw) * R, (2.7 - t * 2.8) * H, (rad * math.sin(ang) - sw * .6) * R, .06 * (.7 + h(i * 7 + 5) * .6) * size, grad(cols, t, .8 + h(i * 7 + 6) * .2), env(t) * .85 * alpha))
    elif st == 'starfield_shimmer':
        dr = time * .08 * rot; sd, cd = math.sin(dr), math.cos(dr)
        for i in range(n):
            th = h(i * 6) * 2 * math.pi; cp = h(i * 6 + 1) * 2 - 1; sp = math.sqrt(max(0, 1 - cp * cp))
            sx, sz, sy = .85 * sp * math.cos(th), .85 * sp * math.sin(th), 1 + cp * 1.05
            fr = (.8 + h(i * 6 + 2) * 2.2) * 2 * math.pi; tp = h(i * 6 + 3) * 2 * math.pi
            tw = max(0.0, math.sin(time * speed * fr + tp)) ** 3
            out.append(((sx * cd - sz * sd) * R, sy * H, (sx * sd + sz * cd) * R, .06 * (.8 + h(i * 6 + 4) * .4) * size * (.6 + .7 * tw), grad(cols, tw, .85 + h(i * 6 + 5) * .15), (.15 + .85 * tw) * alpha))
    else:
        raise ValueError('aurasim has no port of style ' + st)
    return out

def weapon_frame_scale(blade_px, scale_y=1.0):
    """(lift, s) for a weapon cosmetic whose blade (cube top above the grip bone) is blade_px pixels long."""
    L = blade_px * scale_y / 16.0
    return min(max(L * 0.5, 0.15), 1.5), min(max(L * 0.4, 0.12), 1.2)


# ---------------------------------------------------------------------------------------------------------------------
# Full port of every aura style (v13), as primitives the preview renderer (auraview.py) draws like the game does:
#   ('b', x, y, z, half, rgb, a)        camera-facing billboard (AuraStyle.renderParticle), particle texture
#   ('f', x, y, z, half, rgb, a)        flat horizontal quad (MagicCircleStyle.flatQuad), particle texture
#   ('q', [(x,z) x4], y, rgb, a)        flat band segment (MagicCircleStyle.bandSeg), texture column u=0.5, v 0 -> 1 across
# Positions are aura units: blocks, Y up, origin at the feet. vel = the smoothed per-tick velocity (AuraMotionTracker);
# every style pushes particles back by vel * 4 * motion_response * lag, which is what made auras fall behind.
TAU = math.pi * 2
def _S(n, step):
    out = []
    for k in range(n):
        a1 = -math.pi / 2 + k * TAU / n; a2 = -math.pi / 2 + ((k + step) % n) * TAU / n
        out.append((math.cos(a1), math.sin(a1), math.cos(a2), math.sin(a2)))
    return out
SIGILS = {'triangle': (3, 1), 'pentagram': (5, 2), 'hexagram': (6, 2), 'square': (4, 1), 'octagram': (8, 3), 'heptagram': (7, 3)}
R_ = lambda cx, cz, r, inner: ('ring', cx, cz, r, inner)
ST_ = lambda n, step, r, off, inner: ('star', n, step, r, off, inner)
RU_ = lambda r, clumps, inner: ('runes', r, clumps, inner)
SP_ = lambda r, count, ir, inner: ('spokes', r, count, ir, inner)
GE_ = lambda r, teeth, tl, inner: ('gear', r, teeth, tl, inner)
BR_ = lambda r, amp, freq, inner: ('breath', r, amp, freq, inner)
BU_ = lambda pts, ro, ri, off, inner: ('burst', pts, ro, ri, off, inner)
Q = math.pi / 4
MAGIC = {
    'magic_circle': ([R_(0, 0, 1, False), R_(0, 0, .85, False), RU_(.925, 28, False), ST_(6, 2, .85, 0, True), R_(0, 0, .4, True)], 260),
    'arcane_array': ([R_(0, 0, 1, False), ST_(4, 1, 1, 0, False), ST_(4, 1, 1, Q, True), RU_(.62, 16, True), R_(0, 0, .3, True)], 240),
    'summoning_circle': ([R_(0, 0, 1.05, False), RU_(.92, 20, False), ST_(3, 1, .8, 0, True), R_(0, -.8, .14, True), R_(.6928, .4, .14, True), R_(-.6928, .4, .14, True), R_(0, 0, .18, True)], 260),
    'square_seal': ([R_(0, 0, 1, False), ST_(4, 1, 1, 0, False), ST_(4, 1, .78, Q, True), RU_(.62, 12, True), R_(0, 0, .32, True)], 250),
    'octagram_array': ([R_(0, 0, 1, False), ST_(8, 3, 1, 0, False), ST_(8, 3, .82, .3926991, True), RU_(.9, 24, False), R_(0, 0, .3, True)], 260),
    'pentacle_array': ([R_(0, 0, 1, False), ST_(5, 2, 1, 0, False), ST_(5, 2, .7, .62831855, True), RU_(.6, 15, True), R_(0, 0, .25, True)], 255),
    'nested_polygons': ([R_(0, 0, 1, False), ST_(6, 1, 1, 0, False), ST_(4, 1, .7, Q, True), ST_(3, 1, .42, 0, False), R_(0, 0, .2, True)], 250),
    'seal_of_solomon': ([R_(0, 0, 1, False), R_(0, 0, .9, False), ST_(3, 1, .85, 0, True), ST_(3, 1, .85, math.pi, True), RU_(.62, 12, False)], 255),
    'sunburst_mandala': ([R_(0, 0, 1, False), SP_(.97, 24, .55, False), R_(0, 0, .52, True), RU_(.74, 16, True), R_(0, 0, .2, True)], 260),
    'radiant_sun': ([R_(0, 0, 1, False), SP_(1, 16, .62, False), BU_(8, .6, .3, 0, True), R_(0, 0, .22, True)], 250),
    'clockwork_seal': ([GE_(.92, 24, .09, False), R_(0, 0, .78, False), RU_(.66, 20, True), GE_(.5, 14, .07, True), R_(0, 0, .24, True)], 255),
    'astral_compass': ([R_(0, 0, 1, False), BU_(4, 1, .34, 0, False), BU_(4, .78, .26, Q, True), R_(0, 0, .5, True), RU_(.66, 8, False)], 250),
    'pulsar_seal': ([BR_(.95, .06, 1.6, False), BR_(.66, .09, 1.6, True), ST_(6, 2, .5, 0, True), RU_(.82, 18, False), R_(0, 0, .2, True)], 255),
}
DEFAULTS = dict(DEFAULT_COUNT, rune_circle=200, pulse_rings=150, halo=70, circle=80, **{k: 200 for k in SIGILS}, **{k: v[1] for k, v in MAGIC.items()})

def prims(a, time, vel=(0.0, 0.0, 0.0)):
    st = a['style']; cols = a['colors']; n = min(1024, a.get('particle_count') or DEFAULTS.get(st, 160))
    R, H, size, speed, rot = a.get('radius', 1), a.get('height', 1), a.get('size', 1), a.get('speed', 1), a.get('rotation_speed', 1)
    mr = max(0.0, a.get('motion_response', 1.0)); vx, vy, vz = vel if mr > 0 else (0.0, 0.0, 0.0)
    ign = min(1.0, math.sqrt(vx * vx + vy * vy + vz * vz) * 8) * mr
    am = min(1.0, a.get('alpha', 1.0) * (1 + .35 * ign)); trail = 4 * mr
    out = []
    def B(x, y, z, lag, hs, rgb, al):
        A = int(round(al * 255))
        if A > 0: out.append(('b', x - vx * lag, y - vy * lag, z - vz * lag, hs, rgb, A / 255))
    if st in DEFAULT_COUNT or st in ('vortex_shroud', 'ember_crown'):
        # the billboard styles already ported above, re-run with the trail lag applied
        base = particles(dict(a, particle_count=n, alpha=am), time)
        for i, (x, y, z, hs, rgb, al) in enumerate(base):
            if st == 'orbiting_orbs': lag = trail * ((i % 14) / 14)
            elif st == 'starfield_shimmer': lag = trail * h(i * 6 + 3)
            elif st == 'flame_scorched' and i < int(round(165 * min(1, n / 320))): lag = trail
            else:
                ph = {'twin_helix': lambda i: h(i * 5), 'rising_motes': lambda i: h(i * 8 + 3), 'vortex_shroud': lambda i: h(i * 4),
                      'ember_crown': lambda i: h(i * 4), 'falling_embers': lambda i: h(i * 7 + 2)}.get(st)
                tsc = {'twin_helix': 3.0, 'rising_motes': 2.4, 'vortex_shroud': 2.0, 'ember_crown': 2.0, 'falling_embers': 3.5, 'flame': 1.15, 'flame_scorched': 1.15}[st]
                if ph is None:
                    k = i - (int(round(165 * min(1, n / 320))) if st == 'flame_scorched' else 0); p0 = h(k * 13 + 2)
                else: p0 = ph(i)
                lag = trail * (1 - (time * speed / tsc + p0) % 1.0)
            B(x, y, z, lag, hs, rgb, al)
        return out
    if st == 'pulse_rings':
        ts = speed / 1.8
        for i in range(n):
            t = (time * ts + (i % 3) / 3) % 1.0; ang = h(i * 4) * TAU; r = (t * 1.6 + (h(i * 4 + 1) - .5) * .06) * R
            al = min(1, t / .06) * (1 - t) ** 2 * .95 * am
            B(r * math.cos(ang), .06, r * math.sin(ang), trail * (1 - t), .09 * (.75 + h(i * 4 + 2) * .5) * size, grad(cols, t, .8 + h(i * 4 + 3) * .2), al)
        return out
    if st == 'rune_circle':
        ts = speed / 2.2; w = time * .8 * rot; rc = int(round(n * .4))
        for i in range(n):
            p = h(i * 5); sc = .75 + h(i * 5 + 3) * .5; ti = .78 + h(i * 5 + 4) * .22
            if i < rc:
                rp = math.floor(p * 24) / 24 + (h(i * 5 + 1) - .5) * .018; phi = rp * TAU + w
                r = (.9 + .025 * math.sin(8 * phi + time * 3)) * R
                B(r * math.cos(phi), .06, r * math.sin(phi), trail * p, .1 * sc * size, grad(cols, p, ti), min(1, .9 * am))
            else:
                t = (time * ts + p) % 1.0; r = .9 * R * (1 - .4 * t); ang = h(i * 5 + 2) * TAU
                fl = .6 + .4 * math.sin(t * 25 + p * TAU)
                B(r * math.cos(ang), t * 1.7 * H, r * math.sin(ang), trail * (1 - t), .06 * sc * size, grad(cols, t, ti), env(t) * fl * am)
        return out
    if st in ('halo', 'circle'):
        frac = 0.0 if st == 'halo' else 1.0; spin = time * rot; wA, wH, psi = spin * 1.2, spin * -.7, spin * .35
        ts_, tc_ = math.sin(math.radians(18)), math.cos(math.radians(18)); ac = int(round(n * frac))
        for i in range(n):
            p = h(i * 4)
            if i < ac:
                phi = p * TAU + wA; r = .8 * R; x, z, y = r * math.cos(phi), r * math.sin(phi), .1 + .04 * math.sin(3 * phi + time * 2)
            else:
                phi = p * TAU + wH; r = .45 * R; fx, fz = r * math.cos(phi), r * math.sin(phi); ty, tz = -fz * ts_, fz * tc_
                x, z, y = fx * math.cos(psi) - tz * math.sin(psi), fx * math.sin(psi) + tz * math.cos(psi), 2.15 * H + ty
            tw = .8 + .2 * math.sin(time * 3 + h(i * 4 + 1) * TAU)
            B(x, y, z, trail * p, .09 * (.8 + h(i * 4 + 2) * .45) * size, grad(cols, p, .8 + h(i * 4 + 3) * .2), min(1, .9 * tw * am))
        return out
    if st in SIGILS:
        segs = _S(*SIGILS[st]); L = [math.hypot(s[2] - s[0], s[3] - s[1]) for s in segs]; total = TAU + sum(L)
        rr = time * .5 * rot; sr, cr = math.sin(rr), math.cos(rr); r = 1.1 * R
        for i in range(n):
            arc = ((i * 0.6180339887498949) % 1.0) * total
            if arc < TAU: f = arc / TAU; lx, lz, gt = math.cos(f * TAU), math.sin(f * TAU), f
            else:
                d = arc - TAU; s = 0
                while s < len(segs) - 1 and d >= L[s]: d -= L[s]; s += 1
                f = d / L[s] if L[s] > 1e-6 else 0; sg = segs[s]
                lx, lz, gt = sg[0] + (sg[2] - sg[0]) * f, sg[1] + (sg[3] - sg[1]) * f, (s + f) / len(segs)
            p = h(i * 5 + 3); br = .85 + .15 * math.sin(time * 1.5 + p * TAU)
            B((lx * cr - lz * sr) * r, .06, (lx * sr + lz * cr) * r, trail * p, .075 * (.75 + h(i * 5 + 4) * .5) * size, grad(cols, gt, .8 + h(i * 5 + 2) * .2), min(1, .95 * br * am))
        return out
    if st in MAGIC:
        shapes, dc = MAGIC[st]; ns = len(shapes)
        rotO = time * .5 * rot; rotI = rotO * -.7; r = R
        br = .85 + .15 * math.sin(time * 1.5); ba = int(round(min(1, .95 * br * am) * 255))
        lod = min(1, n / dc); alpha = int(round(ba * lod)) / 255
        if alpha <= 0: return out
        thick = .022 * size
        def W(x, z, inner, dx, dz):
            s, c = (math.sin(rotI), math.cos(rotI)) if inner else (math.sin(rotO), math.cos(rotO))
            return ((x * c - z * s) * r - dx, (x * s + z * c) * r - dz)
        def band(p0i, p0o, p1i, p1o, y, rgb): out.append(('q', [p0i, p1i, p1o, p0o], y, rgb, alpha))
        def ringband(cx, cz, rad, th, inner, y, dx, dz, rgb):
            segs = max(24, min(96, round(TAU * max(rad, .05) / .1)))
            def edge(an): c, s = math.cos(an), math.sin(an); return W(cx + (rad - th) * c, cz + (rad - th) * s, inner, dx, dz), W(cx + (rad + th) * c, cz + (rad + th) * s, inner, dx, dz)
            pi_, po = edge(0)
            for k in range(1, segs + 1):
                ci, co = edge(k / segs * TAU); band(pi_, po, ci, co, y, rgb); pi_, po = ci, co
        def seg(x1, z1, x2, z2, th, inner, y, dx, dz, rgb):
            ex, ez = x2 - x1, z2 - z1; ln = math.hypot(ex, ez)
            if ln < 1e-5: return
            nx, nz = -ez / ln * th, ex / ln * th
            band(W(x1 - nx, z1 - nz, inner, dx, dz), W(x1 + nx, z1 + nz, inner, dx, dz), W(x2 - nx, z2 - nz, inner, dx, dz), W(x2 + nx, z2 + nz, inner, dx, dz), y, rgb)
        def radial(rin, rout, ang, hw, inner, y, dx, dz, rgb):
            c, s = math.cos(ang), math.sin(ang); tx, tz = -s * hw, c * hw
            band(W(rin * c - tx, rin * s - tz, inner, dx, dz), W(rin * c + tx, rin * s + tz, inner, dx, dz), W(rout * c - tx, rout * s - tz, inner, dx, dz), W(rout * c + tx, rout * s + tz, inner, dx, dz), y, rgb)
        for idx, sh in enumerate(shapes):
            kind = sh[0]
            if kind == 'runes': continue
            inner = sh[-1]; gt = .5 if ns <= 1 else (idx + .5) / ns; ti = .85 + h(idx * 7 + 1) * .15; ph = h(idx * 7 + 2)
            rgb = grad(cols, gt, ti); lag = trail * ph; dx, dz = vx * lag, vz * lag; y = .06 - vy * lag
            if kind == 'ring':
                _, cx, cz, rad, _ = sh
                if rad <= .22: x, z = W(cx, cz, inner, dx, dz); out.append(('f', x, y, z, rad * size * r, rgb, alpha))
                else: ringband(cx, cz, rad, thick, inner, y, dx, dz, rgb)
            elif kind in ('star', 'burst'):
                if kind == 'star':
                    _, nn, step, rad, off, _ = sh; V = [(rad * math.cos(-math.pi / 2 + off + k * TAU / nn), rad * math.sin(-math.pi / 2 + off + k * TAU / nn)) for k in range(nn)]
                    for k in range(nn): j = (k + step) % nn; seg(*V[k], *V[j], thick, inner, y, dx, dz, rgb)
                    joints = V
                else:
                    _, pts, ro, ri, off, _ = sh; nn = pts * 2
                    V = [((ro if k % 2 == 0 else ri) * math.cos(-math.pi / 2 + off + k * TAU / nn), (ro if k % 2 == 0 else ri) * math.sin(-math.pi / 2 + off + k * TAU / nn)) for k in range(nn)]
                    for k in range(nn): seg(*V[k], *V[(k + 1) % nn], thick, inner, y, dx, dz, rgb)
                    joints = V[::2]
                for (jx, jz) in joints: x, z = W(jx, jz, inner, dx, dz); out.append(('f', x, y, z, thick * 1.15 * r, rgb, alpha))
            elif kind == 'spokes':
                _, rad, cnt, ir, _ = sh
                for k in range(cnt): radial(ir, rad, k * TAU / cnt, thick, inner, y, dx, dz, rgb)
            elif kind == 'gear':
                _, rad, teeth, tl, _ = sh; ringband(0, 0, rad, thick, inner, y, dx, dz, rgb)
                for k in range(teeth): radial(rad + thick, rad + tl, k * TAU / teeth, thick * 1.6, inner, y, dx, dz, rgb)
            elif kind == 'breath':
                _, rad, amp, fq, _ = sh; ringband(0, 0, max(.05, rad * (1 + amp * math.sin(time * fq + ph * TAU))), thick, inner, y, dx, dz, rgb)
        dots = []
        for s, sh in enumerate(shapes):
            if sh[0] != 'runes': continue
            _, rr_, clumps, inner = sh; gb = s / ns
            for c in range(clumps):
                for d in range(5):
                    hh = ((s * 131 + c) * 17 + d) * 5; j1, j2 = h(hh + 2), h(hh + 3); ang = c * TAU / clumps + (j1 - .5) * .09; rd = rr_ + (j2 - .5) * .06
                    dots.append((rd * math.cos(ang), rd * math.sin(ang), gb + (d + .5) / 5 / ns, h(hh + 4), .75 + j1 * .5, .8 + j2 * .2, inner))
        for (lx, lz, gt, p, sc, ti, inner) in dots[:int(round(min(len(dots), 1024) * lod))]:
            lag = trail * p; x, z = W(lx, lz, inner, vx * lag, vz * lag)
            db = .85 + .15 * math.sin(time * 1.5 + p * TAU); A = int(round(min(1, ba / 255 * db) * 255))
            if A > 0: out.append(('f', x, .06 - vy * lag, z, .03 * sc * size, grad(cols, gt, ti), A / 255))
        return out
    raise ValueError('no port of style ' + st)

def texture(particle):
    """The 32x32 alpha mask the mod generates for a particle type (AuraRenderer.ensureTexture / AuraParticleType)."""
    c = 15.5; Y, X = np.mgrid[0:32, 0:32].astype(float); u = (X - c) / c; v = (Y - c) / c; d = np.sqrt(u * u + v * v)
    ss = lambda e0, e1, x: (lambda t: t * t * (3 - 2 * t))(np.clip((x - e0) / (e1 - e0), 0, 1))
    ang = np.arctan2(v, u)
    if particle == 'orb': a = 1 - ss(.55, .78, d)
    elif particle == 'spark':
        au, av = np.abs(u), np.abs(v); ax_ = np.maximum(0, 1 - av * 6) * np.maximum(0, 1 - au); ay_ = np.maximum(0, 1 - au * 6) * np.maximum(0, 1 - av)
        a = np.minimum(1, np.maximum(np.maximum(ax_ ** 2, ay_ ** 2), 1 - ss(0, .3, d)))
    elif particle == 'pixel': a = 1 - ss(.55, .7, np.maximum(np.abs(u), np.abs(v)))
    elif particle == 'smoke':
        def lat(x, y):
            n_ = (x.astype(np.int64) * 374761393 + y.astype(np.int64) * 668265263) & 0xffffffff
            n_ = (n_ ^ (n_ >> 13)) * 1274126177 & 0xffffffff; n_ ^= n_ >> 16; return (n_ & 0x7fffffff) / 2.1474836E9
        fx_, fy_ = (u + 1) * 3, (v + 1) * 3; x0, y0 = np.floor(fx_), np.floor(fy_); tx, ty = fx_ - x0, fy_ - y0
        tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
        nz = (lat(x0, y0) * (1 - tx) + lat(x0 + 1, y0) * tx) * (1 - ty) + (lat(x0, y0 + 1) * (1 - tx) + lat(x0 + 1, y0 + 1) * tx) * ty
        a = (1 - ss(.05, .95, d)) * (.4 + .6 * nz)
    elif particle == 'ring': a = np.minimum(1, ss(.25, .42, d) * (1 - ss(.52, .72, d)) + (1 - ss(0, .26, d)) * .28)
    elif particle == 'crystal': a = np.where(d < .001, 1, (1 - ss(0, .78, d)) ** 2 * (.6 + .4 * np.cos(6 * ang)))
    elif particle == 'star': a = np.where(d < .001, 1, (1 - ss(0, .85, d)) ** 2 * (.25 + .75 * np.maximum(0, np.cos(6 * ang))))
    elif particle == 'tear': a = np.minimum(1, (1 - ss(.05, .78, d)) ** 2 + (1 - ss(0, .24, np.sqrt((u + .28) ** 2 + (v - .28) ** 2))) * .45)
    elif particle == 'comet': a = np.minimum(1, (1 - ss(0, .24, d)) ** 2 + (1 - ss(.12, .9, d)) * .42)
    else: a = 1 - ss(.1, 1, d)   # glow
    return np.clip(np.round(np.clip(a, 0, 1) * 255) / 255, 0, 1)
