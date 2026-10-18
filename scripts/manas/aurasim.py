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
