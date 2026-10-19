# OVERTHRONE v8 "Celestial Sovereign" premium set (stage 1 of the 10-set rebuild).
# Quality targets (owner's brief + the Aurion / Lucifer's Wings / Angel Wings references):
#   - wings: six layers of individually placed, broad, overlapping feathers (primaries, secondaries, tertials, greater /
#     median / marginal coverts) at different depths, a sculpted gold frame along the leading edge with set gems, two
#     sweeping gold crescent blades per wing, and a rotating celestial sigil ring behind the back.
#   - armour: fitted (no bulky stacks): a painted 64x shell (ivory plate over a navy undersuit, gold trim, cyan gems) plus
#     sculpted 3D pieces - plastron, gorget, belt, tabards that sway, layered pauldrons with gold crescents and feather
#     fans, vambraces, knee cops, greaves and winged sabatons.
#   - helm: ivory/gold winged helm, T-visor with glowing eyes, gold crest + feather wings, floating halo.
#   - weapon: winged-guard greatsword.
# Frames (from sim.py / the mod's code): back = wings4 frame (Y up, -Z away from the back, needs_y_flip true);
# armor_set = player space, Y DOWN, bones body/arm_r/arm_l/leg_r/leg_l; helmet = Y up from the neck, -Z = face;
# weapon = first bone is the grip at the origin, blade along +Y.
import math, random
import numpy as np
from PIL import Image
from bb import BB, Atlas, UV
import paint as P
from art import Canvas, ramp, sh, lit, mix, C, dilate, erode, sd
from fx import Kit, hang, seg, lerp3, Particles, clips, mir
import wings4 as W4
from sets6 import Painted, gem3d, flipv
import sets5 as S5

PAL = dict(ivory=(238, 236, 230), lav=(172, 168, 206), navy=(26, 28, 46), gold=(246, 196, 72), gem=(80, 232, 255), shaft=(255, 226, 150))

def tint(arr, col, t): return arr * (1 - t) + np.array(col[:3], float) * t

# ===================================================================== textures
def feather_tex(w, h, base, shade, edge, shaft, tip=None, kind='primary', seed=0, glow=True):
    """A painted feather, root at the top row, tip at the bottom: asymmetric vanes (narrow leading vane), a quill and shaft,
    diagonal barbs, a couple of splits in the vane, lavender shading on the trailing vane and towards the tip, a dark
    outline, and an optional bright trim along the tip (also on the glow texture)."""
    r = np.random.default_rng(seed)
    Y, X = np.mgrid[0:h, 0:w].astype(float); X += 0.5; Y += 0.5
    t = Y / h; sx = w * (0.40 if kind != 'covert' else 0.5)
    if kind == 'covert': prof = np.clip(np.minimum(t / 0.2, 1) * np.sqrt(np.clip(1 - ((t - 0.55) / 0.47) ** 2, 0, 1)) * 1.08, 0, 1)
    else: prof = np.clip(np.minimum(t / 0.14, 1) * np.where(t < 0.72, 1.0, np.sqrt(np.clip(1 - ((t - 0.72) / 0.29) ** 2, 0, 1))), 0, 1)
    lead = (sx - 0.5) * prof + 0.4; trail = (w - sx - 0.5) * prof + 0.4
    u = X - sx
    inside = ((u < 0) & (-u <= lead)) | ((u >= 0) & (u <= trail))
    for _ in range(2 if kind != 'covert' else 0):       # splits in the trailing vane
        y0 = r.uniform(0.35, 0.8) * h; inside &= ~((u > 1.2) & (np.abs((Y - y0) - (u - 1.2) * 0.9) < 0.55))
    vt = np.where(u < 0, -u / np.maximum(lead, 1), u / np.maximum(trail, 1))      # 0 at the shaft, 1 at the vane edge
    col = mix(base, shade, np.clip(0.04 + 0.5 * (u > 0) * vt ** 1.5 + 0.3 * np.clip((t - 0.55) / 0.45, 0, 1), 0, 1)[..., None])
    barbs = (((Y - np.abs(u) * 0.85) % 3.0) < 1.0) & inside
    col = np.where(barbs[..., None], col * 0.93, col)
    col = np.where(((u < 0) & (vt < 0.6))[..., None], np.clip(col * 1.05 + 6, 0, 255), col)       # bright leading vane
    shaft_m = (np.abs(u) < 0.5) & (t < 0.94)
    col = np.where(shaft_m[..., None], mix(sh(shaft, 0.85), shaft, t[..., None]), col)
    quill = (np.abs(u) < 0.8) & (t < 0.1); col = np.where(quill[..., None], C(shaft) * 0.9, col)
    inside |= quill
    edge_m = inside & ~erode(inside)
    col = np.where(edge_m[..., None], C(edge), col)
    g = None
    if tip is not None:
        tm = (edge_m | (erode(inside) & ~erode(erode(inside)) & (t > 0.9))) & (t > 0.84)
        col = np.where(tm[..., None], C(tip), col)
        ga = np.zeros((h, w, 4), np.uint8); ga[..., :3] = np.where(tm[..., None], C(tip), 0).astype(np.uint8); ga[..., 3] = np.where(tm, 255, 0)
        g = Image.fromarray(ga, 'RGBA') if glow else None
    out = np.zeros((h, w, 4), np.uint8); out[..., :3] = np.clip(col, 0, 255).astype(np.uint8); out[..., 3] = np.where(inside, 255, 0)
    return Image.fromarray(out, 'RGBA'), g

def gold_tex(w, h, col, engrave=True, seed=0):
    c = Canvas(w, h); c.metal(c.m_rect(0, 0, w, h), col, outline=False)
    if engrave and h > 6:
        for y in range(3, h - 2, 5): c.engrave([(1, y), (w - 1, y + 1)], col, 0.8)
    return c.images()[0]

def gem_tex(col, n=8):
    c = Canvas(n, n); c.gem(n / 2, n / 2, n * 0.45, col, 'diamond'); main, g = c.images(); return main, g

# ===================================================================== shared 3D helpers
def arc_pts(A, Cc, B, n):
    return [[(1 - t) ** 2 * A[i] + 2 * (1 - t) * t * Cc[i] + t * t * B[i] for i in range(3)] for t in [j / (n - 1) for j in range(n)]]

def seg3d(m, bone, A, B, w, th, uv, side_uv=None):
    """A box from A to B in any direction: w across (the box's X), th deep (its Z)."""
    from heads4 import rot_to
    d = [B[i] - A[i] for i in range(3)]; L = math.sqrt(sum(v * v for v in d)) or 0.01
    m.box(bone, [A[0] - w / 2, A[1], A[2] - th / 2], [A[0] + w / 2, A[1] + L, A[2] + th / 2], uv, side_uv or uv, origin=list(A), rotation=rot_to(d))

def blade_arc(m, bone, pts, w0, w1, th, uv, side_uv=None, guv=None, fin=False):
    """A tapering curved blade along pts. XY-plane arcs taper in-plane (th = depth along Z); fin=True (arcs in the YZ
    plane) tapers along Z and uses th as the thickness across X."""
    n = len(pts)
    for i in range(n - 1):
        f = i / max(1, n - 2); w_ = w0 + (w1 - w0) * f
        A = pts[i]; B = [pts[i + 1][j] + (pts[i + 1][j] - pts[i][j]) * 0.08 for j in range(3)]
        ww, tt = (th, w_) if fin else (w_, th)
        seg3d(m, bone, A, B, ww, tt, uv, side_uv)
        if guv is not None and i >= n - 3: seg3d(m, bone, A, B, ww + 0.08, tt + 0.08, guv)

def rise(m, bone, R, L, w, ang, uv, guv=None, side=1, tilt=0.0, th=0.1):
    """Like fx.hang but pointing UP (+Y) from root R; the sprite's root row stays at R."""
    frm = [R[0] - w / 2, R[1], R[2] - th / 2]; to = [R[0] + w / 2, R[1] + L, R[2] + th / 2]
    m.plate(bone, frm, to, flipv(mir(uv, side)), origin=list(R), rotation=[tilt, 0, ang])
    if guv is not None: m.plate(bone, [frm[0], frm[1], frm[2] - 0.04], [to[0], to[1], to[2] + 0.04], flipv(mir(guv, side)), origin=list(R), rotation=[tilt, 0, ang])

def ring(m, bone, c, r, n, th, depth, uv, start=0.0):
    pts = [[c[0] + math.cos(start + 2 * math.pi * i / n) * r, c[1] + math.sin(start + 2 * math.pi * i / n) * r, c[2]] for i in range(n + 1)]
    for i in range(n): seg(m, bone, pts[i], [pts[i + 1][0] + (pts[i + 1][0] - pts[i][0]) * 0.1, pts[i + 1][1] + (pts[i + 1][1] - pts[i][1]) * 0.1, pts[i + 1][2]], th, uv, thz=depth)

# ===================================================================== WINGS
S_, E_, W_, H_ = (2.0, -15.0, -1.2), (8.0, -5.0, -2.4), (13.5, 4.5, -3.8), (18.5, 8.5, -5.2)

def wings_v1(name, pal=PAL):
    m = BB(name, Atlas(512, 512)); k = Kit(m)
    iv, lv, gd, gm = pal['ivory'], pal['lav'], pal['gold'], pal['gem']
    edge = sh(lv, 0.72); shaft = pal['shaft']
    spr = lambda key, *a, **kw: k.sprite(key, lambda: feather_tex(*a, **kw))
    tipc = (255, 214, 110)
    prim = spr('prim', 16, 104, (255, 255, 255), lv, edge, shaft, tip=tipc, seed=1)
    prim2 = spr('prim2', 16, 96, (252, 252, 255), sh(lv, 0.95), edge, shaft, tip=tipc, seed=2)
    sec = spr('sec', 16, 72, iv, lv, edge, shaft, seed=3)
    ter = spr('ter', 16, 56, (250, 248, 244), lv, edge, shaft, seed=4)
    gcov = spr('gcov', 14, 40, (255, 255, 255), mix(iv, lv, 0.4), edge, shaft, kind='covert', seed=5)
    mcov = spr('mcov', 12, 26, (255, 255, 255), mix(iv, lv, 0.3), edge, None or shaft, kind='covert', seed=6)
    scl = spr('scl', 10, 14, (255, 255, 255), mix(iv, lv, 0.25), edge, shaft, kind='covert', seed=7)
    gold = k.main('gold', gold_tex(6, 16, gd)); goldd = k.main('goldd', gold_tex(6, 16, sh(gd, 0.78)))
    gglow = k.glow('gglow', gold_tex(6, 8, lit(gd, 0.3), False))
    prims_all = {}
    for s, n in ((1, 'r'), (-1, 'l')):
        wb, mb, hb = W4.skeleton(m, n, s, pts=(S_, E_, W_))
        X = lambda p: [p[0] * s, p[1], p[2]]
        prims = []
        NP = 12
        for i in range(NP):                                   # primaries (bottom layer), each on a bone so it ripples
            t = i / (NP - 1)
            R = lerp3(W_, H_, 0.0 + t); R[2] += 0.5 + 0.04 * i
            ang = 22 + 86 * t ** 1.1
            L = 22 + 7 * math.sin(min(1.0, t * 1.15) * math.pi * 0.62)
            pb = m.bone('p%d_%s' % (i, n), X(R), hb); prims.append(pb)
            hang(m, pb, X(R), L, 5.4, s * ang, *(prim if i % 2 else prim2), side=s, tilt=-4 - 3 * t)
        for i in range(10):                                   # secondaries
            t = i / 9; R = lerp3(E_, W_, t); R[2] += 0.36 - 0.02 * i
            hang(m, mb, X(R), 17.5 + 3.5 * t, 5.6, s * (1 + 20 * t), *sec, side=s, tilt=-3)
        for i in range(5):                                    # tertials
            t = 0.1 + 0.2 * i; R = lerp3(S_, E_, t); R[2] += 0.2 - 0.02 * i
            hang(m, wb, X(R), 11.5 + 5 * t, 5.8, s * (-6 + 7 * t), *ter, side=s, tilt=-2)
        for i in range(14):                                   # greater coverts
            t = i / 13; R = lerp3(S_, H_, 0.03 + 0.92 * t); R[2] -= 0.35 + 0.01 * i
            b = wb if t < 0.33 else (mb if t < 0.62 else hb)
            ang = 20 * (t / 0.62) if t < 0.62 else 20 + 72 * (t - 0.62) / 0.38
            hang(m, b, X(R), 10.5 + 2.5 * math.sin(t * math.pi), 4.8, s * ang, *gcov, side=s, tilt=-6)
        for i in range(12):                                   # median coverts
            t = i / 11; R = lerp3(S_, H_, 0.02 + 0.86 * t); R[1] += 0.3; R[2] -= 0.8 + 0.01 * i
            b = wb if t < 0.33 else (mb if t < 0.62 else hb)
            hang(m, b, X(R), 6.8, 4.0, s * (4 + 66 * t ** 1.4), *mcov, side=s, tilt=-8)
        for i in range(12):                                   # marginal coverts (little scales on the leading edge)
            t = i / 11; R = lerp3(S_, H_, 0.0 + 0.84 * t); R[1] += 1.0; R[2] -= 1.25
            b = wb if t < 0.36 else (mb if t < 0.66 else hb)
            hang(m, b, X(R), 3.8, 3.2, s * (8 + 64 * t ** 1.4), *scl, side=s, tilt=-10)
        # sculpted gold frame along the leading edge, with caps at the joints and set gems
        Sx, Ex, Wx, Hx = X([S_[0], S_[1] + 1.4, S_[2] - 1.6]), X([E_[0], E_[1] + 1.4, E_[2] - 1.6]), X([W_[0], W_[1] + 1.2, W_[2] - 1.6]), X([H_[0] + 1.0, H_[1] + 1.0, H_[2] - 1.5])
        seg(m, wb, Sx, Ex, 2.2, gold, goldd, thz=1.8); seg(m, mb, Ex, Wx, 1.9, gold, goldd, thz=1.6); seg(m, hb, Wx, Hx, 1.4, gold, goldd, thz=1.3)
        for b, c_, r_ in ((wb, Sx, 1.8), (mb, Ex, 1.5), (hb, Wx, 1.4)):
            m.box(b, [c_[0] - r_, c_[1] - r_, c_[2] - r_ * 0.8], [c_[0] + r_, c_[1] + r_, c_[2] + r_ * 0.8], gold, goldd, origin=list(c_), rotation=[0, 0, 45])
            gem3d(m, k, b, [c_[0], c_[1], c_[2] - r_ * 0.8 - 0.3], r_ * 0.95, gm, rot=(0, 0, 45))
        # gold filigree spurs along the arm (little curls pointing up-in)
        for i in range(4):
            t = 0.2 + 0.2 * i; R = lerp3([S_[0], S_[1] + 2.4, S_[2] - 1.6], [W_[0], W_[1] + 2.0, W_[2] - 1.6], t)
            b = wb if t < 0.5 else mb
            A = X(R); B = X([R[0] - 1.2, R[1] + 2.4 - 0.3 * i, R[2]]); Cc = X([R[0] - 2.6, R[1] + 2.0 - 0.3 * i, R[2]])
            blade_arc(m, b, arc_pts(A, B, Cc, 4), 0.9, 0.45, 0.6, gold, goldd)
        # two sweeping gold crescent blades from the wrist (the set's signature shape)
        for j, (ctrl, tip, w0) in enumerate((((W_[0] + 6, W_[1] + 10, W_[2] - 1.9), (H_[0] + 9, H_[1] + 9, W_[2] - 1.9), 1.5),
                                             ((W_[0] + 9, W_[1] + 1, W_[2] - 1.7), (H_[0] + 12, H_[1] - 9, W_[2] - 1.7), 1.2))):
            blade_arc(m, hb, arc_pts(X([W_[0], W_[1] + 1.2, W_[2] - 1.8 - 0.1 * j]), X(ctrl), X(tip), 9), w0, 0.3, 0.7, gold, goldd, guv=gglow)
        prims_all[n] = prims
    # centre piece on the spine: gold winged medallion with a big gem (joins the two wings)
    m.bone('spine', [0, -13, -1.6])
    m.box('spine', [-1.6, -16.5, -2.2], [1.6, -10.5, -1.0], gold, goldd)
    for s in (-1, 1): m.box('spine', [s * 1.4 - 1.0, -15.2, -2.1], [s * 1.4 + 1.0, -12.2, -1.1], gold, goldd, origin=[s * 1.4, -13.7, -1.6], rotation=[0, 0, s * 30])
    gem3d(m, k, 'spine', [0, -13.5, -2.6], 1.8, gm, setting=gd, rot=(0, 0, 45))
    # rotating celestial sigil ring behind the back
    SY = -2.0
    m.bone('sigil', [0, SY, 0.4])
    ring(m, 'sigil', (0, SY, 0.4), 11.0, 36, 0.75, 0.4, gold)
    ring(m, 'sigil', (0, SY, 0.4), 9.4, 32, 0.45, 0.3, gold)
    for i in range(8):
        a = 2 * math.pi * i / 8
        A = [math.cos(a) * 3.0, SY + math.sin(a) * 3.0, 0.4]; B = [math.cos(a) * 9.4, SY + math.sin(a) * 9.4, 0.4]
        seg(m, 'sigil', A, B, 0.35, gold, thz=0.25)
        st = [math.cos(a + math.pi / 8) * 10.2, SY + math.sin(a + math.pi / 8) * 10.2, 0.3]
        gem3d(m, k, 'sigil', st, 0.8, gm, rot=(0, 0, 45))
    ring(m, 'sigil', (0, SY, 0.4), 3.0, 16, 0.45, 0.3, gold)
    W4.soft_glow(m, k, (120, 220, 255))
    fx = W4.effects(m, k, dict(fx='feathers', fxcol=(255, 255, 255), root=(255, 255, 255), tip=pal['lav'], edge=(255, 255, 255)))
    def build(c):
        tr = {}
        for s, n in ((1, 'r'), (-1, 'l')): tr.update(W4.flap_tracks(c, n, s, prims_all[n], 'feather'))
        tr['sigil'] = {'rotation': [(0, 0, 0, 'query.anim_time*18')]}
        tr['spine'] = {'position': [(0, 0, 'math.sin(query.anim_time*90)*0.15', 0)]}
        return tr
    clips(m, build, 4.0, fx)
    W4.place_back(m)
    return m

# ---------------------------------------------------------------- v2 wings: solid 3D feathers (owner feedback 2026-10-19)
# The references (Sketchfab "Angel Wings" / "Lucifer's Wings", and the Divine Sovereign wings the owner likes) are built
# from THICK pieces: every feather is a solid slab made of 3 stepped blocks (a voxel taper, like a pixel-art tip), painted
# on its faces with shaded edges, so the wing has depth from every side instead of being paper plates.
def feather_slab_tex(w, h, base, shade, shaft, tip=None, seed=0, glowtip=None):
    """Opaque feather face (root at the top row): bright leading vane, lavender-shaded trailing vane, a cream rachis,
    slanted barbs, a crisp outline, a few split barbs, soft shadow towards the tip and a gold (optionally glowing) tip."""
    r = np.random.default_rng(seed)
    Y, X = np.mgrid[0:h, 0:w].astype(float); X += 0.5; Y += 0.5; t = Y / h; u = X / w
    sx = w * 0.4
    trail = np.clip((X - sx) / (w - sx), 0, 1)
    col = mix(base, shade, np.clip(0.55 * trail ** 1.3 + 0.35 * np.clip((t - 0.45) / 0.55, 0, 1), 0, 1)[..., None])
    barb = (((Y - np.abs(X - sx) * 0.75) % 2.6) < 0.9) & (np.abs(X - sx) > 0.8)
    col = np.where(barb[..., None], col * 0.9, col)
    for _ in range(3):   # split barbs
        y0 = r.uniform(0.3, 0.8) * h; sp = (X > sx + 1) & (np.abs((Y - y0) - (X - sx) * 0.75) < 0.5); col = np.where(sp[..., None], col * 0.78, col)
    col = np.where((np.abs(X - sx) < 0.6)[..., None], mix(shaft, sh(shaft, 0.8), t[..., None]), col)
    col = np.where(((X < 1) | (X > w - 1))[..., None], mix(shade, (90, 86, 120), 0.35) * np.ones((h, w, 1)), col)
    col = col * (1 + (r.random((h, w)) - 0.5)[..., None] * 0.04)
    if tip is not None:
        f = np.clip((t - 0.82) * 6, 0, 1)[..., None]; col = col * (1 - f) + C(tip) * f
    if glowtip is not None:
        f = np.clip((t - 0.9) * 10, 0, 1)[..., None]; col = col * (1 - f) + C(glowtip) * f
    out = np.zeros((h, w, 4), np.uint8); out[..., :3] = np.clip(col, 0, 255).astype(np.uint8); out[..., 3] = 255
    return Image.fromarray(out, 'RGBA')

def edge_tex(col):
    c = Canvas(4, 8); c.fill(c.m_rect(0, 0, 4, 8), col, grad=0.3); return c.images()[0]

def bevel_gold(w, h, col):
    """Chunky bevelled gold bar (Lucifer-style bone): light top edge, dark bottom edge, engraved line."""
    c = Canvas(w, h); r = ramp(col)
    c.rgb[:] = r[2]; c.a[:] = True
    c.rgb[: max(1, h // 5)] = r[4]; c.rgb[max(1, h // 5): h // 2] = r[3]; c.rgb[-max(1, h // 5):] = r[1]; c.rgb[-1:] = r[0]
    c.engrave([(0, h * 0.55), (w, h * 0.55)], col, 0.8)
    return c.images()[0]

def slab(m, bone, R, L, w, ang, face, sides, tipside, s, tilt=0.0, th=0.55, glow=None, steps=((0.0, 0.55, 1.0), (0.55, 0.75, 0.84), (0.75, 0.89, 0.6), (0.89, 1.0, 0.3))):
    """A solid feather hanging DOWN from root R: stepped blocks (voxel taper) sharing one painted face texture."""
    u0, v0, u1, v1 = face
    for (a, b, k_) in steps:
        ww = w * k_
        fu0 = u0 + (u1 - u0) * (0.5 - k_ / 2); fu1 = u0 + (u1 - u0) * (0.5 + k_ / 2)
        fv0 = v0 + (v1 - v0) * a; fv1 = v0 + (v1 - v0) * b
        uv = UV((fu0, fv0, fu1, fv1), face.tex)
        fu = uv if s > 0 else uv.mirrored()
        faces = {'north': P4F(fu), 'south': P4F(fu.mirrored()), 'east': P4F(sides), 'west': P4F(sides), 'up': P4F(sides), 'down': P4F(tipside)}
        m.cube(bone, [R[0] - ww / 2, R[1] - L * b, R[2] - th / 2], [R[0] + ww / 2, R[1] - L * a, R[2] + th / 2], faces, list(R), [tilt, 0, ang])
        if glow is not None and b >= 0.99:
            e = 0.05
            m.cube(bone, [R[0] - ww / 2 - e, R[1] - L * b - e, R[2] - th / 2 - e], [R[0] + ww / 2 + e, R[1] - L * a, R[2] + th / 2 + e],
                   {'north': P4F(glow), 'south': P4F(glow), 'east': P4F(glow), 'west': P4F(glow), 'down': P4F(glow)}, list(R), [tilt, 0, ang])

def P4F(uv): return {'uv': [round(v, 4) for v in uv], 'texture': getattr(uv, 'tex', 0)}

S2, E2, W2, H2 = (2.0, -14.0, -1.0), (7.5, -4.5, -1.8), (12.0, 6.0, -2.8), (16.5, 12.0, -3.6)

def wings_v2(name, pal=PAL):
    m = BB(name, Atlas(512, 512)); k = Kit(m)
    iv, lv, gd, gm = pal['ivory'], pal['lav'], pal['gold'], pal['gem']
    tipg = (255, 214, 110)
    F_prim = k.main('fprim', feather_slab_tex(20, 72, (255, 255, 255), lv, pal['shaft'], tip=tipg, seed=1))
    F_sec = k.main('fsec', feather_slab_tex(20, 60, (252, 252, 255), lv, pal['shaft'], tip=tipg, seed=2))
    F_ter = k.main('fter', feather_slab_tex(20, 44, iv, lv, pal['shaft'], seed=3))
    F_cov = k.main('fcov', feather_slab_tex(18, 32, (255, 255, 255), mix(iv, lv, 0.5), pal['shaft'], seed=4))
    F_sm = k.main('fsm', feather_slab_tex(14, 18, (255, 255, 255), mix(iv, lv, 0.35), pal['shaft'], seed=5))
    side = k.main('fside', edge_tex(sh(lv, 0.8))); tside = k.main('ftip', edge_tex(tipg)); wside = k.main('fwside', edge_tex((246, 244, 250)))
    tglow = k.glow('tglow', P.dot(gm, 2))
    gb = k.main('gbev', bevel_gold(8, 16, gd)); gbd = k.main('gbevd', bevel_gold(8, 16, sh(gd, 0.8)))
    gcap = k.main('gcap', gold_tex(8, 8, gd)); gglow = k.glow('gglow', gold_tex(6, 8, lit(gd, 0.3), False))
    cry = k.main('cry', P.facet(4, 8, lit(gm, 0.5), sh(gm, 0.7))); cryg = k.glow('cryg', P.facet(4, 4, (255, 255, 255), lit(gm, 0.3)))
    import heads4 as H4
    prims_all = {}
    for s, n in ((1, 'r'), (-1, 'l')):
        wb, mb, hb = W4.skeleton(m, n, s, pts=(S2, E2, W2))
        X = lambda p: [p[0] * s, p[1], p[2]]
        prims = []
        for i in range(11):                                   # primaries: fan from down-out to up-out
            t = i / 10; R = lerp3(W2, H2, t); R[2] += 0.75 + 0.03 * i
            ang = 30 + 118 * t ** 1.05
            L = 19 + 6 * math.sin(min(1.0, t * 1.2) * math.pi * 0.7)
            pb = m.bone('p%d_%s' % (i, n), X(R), hb); prims.append(pb)
            slab(m, pb, X(R), L, 6.2, s * ang, F_prim, side, tside, s, tilt=-3, glow=None)
        for i in range(9):                                    # secondaries
            t = i / 8; R = lerp3(E2, W2, t); R[2] += 0.45 - 0.02 * i
            slab(m, mb, X(R), 16.5 + 3 * t, 6.6, s * (6 + 24 * t), F_sec, side, tside, s, tilt=-2)
        for i in range(5):                                    # tertials
            t = 0.1 + 0.2 * i; R = lerp3(S2, E2, t); R[2] += 0.2
            slab(m, wb, X(R), 11 + 5 * t, 6.6, s * (-4 + 9 * t), F_ter, side, wside, s, tilt=-2)
        for i in range(12):                                   # greater coverts
            t = i / 11; R = lerp3(S2, H2, 0.04 + 0.9 * t); R[2] -= 0.25
            b = wb if t < 0.33 else (mb if t < 0.62 else hb)
            ang = (2 + 26 * t / 0.62) if t < 0.62 else 28 + 100 * (t - 0.62) / 0.38
            slab(m, b, X(R), 9 + 2 * math.sin(t * math.pi), 5.6, s * ang, F_cov, side, wside, s, tilt=-5, th=0.5)
        for i in range(10):                                   # small coverts on the leading edge
            t = i / 9; R = lerp3(S2, H2, 0.02 + 0.84 * t); R[1] += 0.6; R[2] -= 0.85
            b = wb if t < 0.36 else (mb if t < 0.66 else hb)
            slab(m, b, X(R), 5.2, 4.6, s * (8 + 92 * t ** 1.3), F_sm, side, wside, s, tilt=-8, th=0.45, steps=((0.0, 0.7, 1.0), (0.7, 1.0, 0.6)))
        # chunky bevelled gold frame (Lucifer-style bone) + knuckle caps + set crystals
        Sx, Ex, Wx, Hx = X([S2[0], S2[1] + 1.2, S2[2] - 1.3]), X([E2[0], E2[1] + 1.2, E2[2] - 1.3]), X([W2[0], W2[1] + 1.0, W2[2] - 1.3]), X([H2[0] + 0.8, H2[1] + 0.8, H2[2] - 1.2])
        seg(m, wb, Sx, Ex, 2.6, gb, gbd, thz=2.2); seg(m, mb, Ex, Wx, 2.2, gb, gbd, thz=2.0); seg(m, hb, Wx, Hx, 1.7, gb, gbd, thz=1.7)
        for b, c_, r_, d_ in ((wb, Sx, 1.9, (-0.3, 1, -0.6)), (mb, Ex, 1.6, (0.4, 1, -0.6)), (hb, Wx, 1.5, (0.6, 1, -0.5)), (hb, Hx, 1.2, (0.9, 0.7, -0.4))):
            m.box(b, [c_[0] - r_, c_[1] - r_, c_[2] - r_], [c_[0] + r_, c_[1] + r_, c_[2] + r_], gcap, gcap, origin=list(c_), rotation=[0, 0, 45])
            H4.crystal(m, b, [c_[0], c_[1] + r_ * 0.4, c_[2] - r_ * 0.6], 3.2 * r_ / 1.6, 1.1 * r_ / 1.6, cry, cry, cryg, d=(d_[0] * s, d_[1], d_[2]))
        # gold horn arcs rising from the wing root over the head (concept sheet #1), tipped with a crystal
        for j, (A, Cc, B, w0) in enumerate((([S2[0] + 0.6, S2[1] + 2.6, S2[2] - 1.8], [S2[0] + 9.0, S2[1] + 12.0, S2[2] - 1.8], [S2[0] + 3.0, S2[1] + 24.5, S2[2] - 1.2], 1.8),
                                            ([E2[0], E2[1] + 1.8, E2[2] - 1.9], [E2[0] + 9.5, E2[1] + 7.0, E2[2] - 1.9], [E2[0] + 7.0, E2[1] + 17.5, E2[2] - 1.5], 1.4))):
            pts = arc_pts(X(A), X(Cc), X(B), 10)
            blade_arc(m, wb if j == 0 else mb, pts, w0, 0.35, 1.0, gb, gbd, guv=gglow)
            H4.crystal(m, wb if j == 0 else mb, pts[-1], 2.6, 0.9, cry, cry, cryg, d=(0.15 * s, 1, 0))
        prims_all[n] = prims
    # spine medallion + rotating sigil (kept from the Divine Sovereign look the owner likes)
    m.bone('spine', [0, -12, -1.6])
    m.box('spine', [-1.8, -16.0, -2.4], [1.8, -9.0, -1.0], gb, gbd)
    gem3d(m, k, 'spine', [0, -12.5, -2.8], 2.0, gm, setting=gd, rot=(0, 0, 45))
    SY = 0.0
    m.bone('sigil', [0, SY, 0.4])
    ring(m, 'sigil', (0, SY, 0.4), 11.5, 40, 0.8, 0.45, gcap); ring(m, 'sigil', (0, SY, 0.4), 9.8, 36, 0.45, 0.3, gcap); ring(m, 'sigil', (0, SY, 0.4), 3.2, 16, 0.5, 0.3, gcap)
    for i in range(8):
        a = 2 * math.pi * i / 8
        seg(m, 'sigil', [math.cos(a) * 3.2, SY + math.sin(a) * 3.2, 0.4], [math.cos(a) * 9.8, SY + math.sin(a) * 9.8, 0.4], 0.35, gcap, thz=0.25)
        gem3d(m, k, 'sigil', [math.cos(a + math.pi / 8) * 10.65, SY + math.sin(a + math.pi / 8) * 10.65, 0.3], 0.9, gm, rot=(0, 0, 45))
    W4.soft_glow(m, k, (120, 220, 255))
    # special effects: shed feathers, wingtip sparkle streams, rising light motes
    fx = Particles(m, None, 4.0, 'wf'); rr = random.Random(name)
    flake = k.main('flake', feather_slab_tex(4, 8, (255, 255, 255), lv, pal['shaft'], seed=9))
    spark = k.glow('wspark', P.dot(gm, 3, core=(255, 255, 255))); gmote = k.glow('gmote', P.dot(lit(gd, 0.3), 3, core=(255, 255, 230)))
    for i in range(12):   # feathers drifting down and out, spinning
        s = 1 if i % 2 else -1
        fx.add([s * rr.uniform(6, 16), rr.uniform(-12, 4), rr.uniform(-4, -1)], [s * rr.uniform(1, 4), -rr.uniform(10, 16), -rr.uniform(0, 3)], 1.2, flake, i / 12, spin=200, sway=25, plate=True)
    for i in range(14):   # sparkles streaming off the wingtips
        s = 1 if i % 2 else -1
        fx.add([s * rr.uniform(20, 30), rr.uniform(4, 20), rr.uniform(-4, -2)], [s * rr.uniform(1, 3), -rr.uniform(4, 9), -rr.uniform(1, 3)], 0.55, spark, i / 14, spin=160)
    for i in range(10):   # golden motes rising along the frame
        s = 1 if i % 2 else -1
        fx.add([s * rr.uniform(3, 14), rr.uniform(-12, 4), rr.uniform(-4, -2.5)], [0, rr.uniform(5, 9), 0], 0.5, gmote, i / 10, spin=120)
    def build(c):
        tr = {}
        for s, n in ((1, 'r'), (-1, 'l')): tr.update(W4.flap_tracks(c, n, s, prims_all[n], 'feather'))
        tr['sigil'] = {'rotation': [(0, 0, 0, 'query.anim_time*18')], 'scale': [(0, 'math.sin(query.anim_time*90)*0.03+1', 'math.sin(query.anim_time*90)*0.03+1', 1)]}
        tr['spine'] = {'position': [(0, 0, 'math.sin(query.anim_time*90)*0.15', 0)]}
        return tr
    clips(m, build, 4.0, fx)
    W4.place_back(m)
    return m

# ---------------------------------------------------------------- v3 wings (the showcase design)
# Built on the layout of the Divine Sovereign wings the owner likes (three radiating feather layers that make a spiky,
# airy burst, many sweeping gold blades, a glowing sigil in the middle), upgraded: every feather is a solid stepped
# 3D slab with painted faces and a gold tip, the frame is chunky bevelled gold with set cyan crystals, the blades are
# solid and crystal-tipped, the sigil has a 3D gold frame and a cyan heart, and it sheds feathers, sparkles and light.
def wings(name, pal=PAL):
    m = BB(name, Atlas(512, 512)); k = Kit(m)
    iv, lv, gd, gm = pal['ivory'], pal['lav'], pal['gold'], pal['gem']
    tipg = (255, 214, 110)
    S0, E0, W0, H0 = W4.S, W4.E, W4.W, W4.H
    lv2 = (196, 194, 226)
    F_prim = k.glow('fprim', feather_slab_tex(14, 80, (255, 255, 255), lv2, pal['shaft'], tip=tipg, glowtip=lit(gm, 0.3), seed=1))
    F_sec = k.glow('fsec', feather_slab_tex(14, 64, (255, 255, 255), lv2, pal['shaft'], tip=tipg, seed=2))
    F_cov = k.glow('fcov', feather_slab_tex(12, 34, (255, 255, 255), mix(iv, lv2, 0.6), pal['shaft'], seed=4))
    F_sm = k.glow('fsm', feather_slab_tex(10, 18, (255, 255, 255), mix(iv, lv2, 0.45), pal['shaft'], seed=5))
    side = k.main('fside', edge_tex(sh(lv, 0.85))); tside = k.main('ftip', edge_tex(tipg)); wside = k.main('fwside', edge_tex((236, 234, 244)))
    tglow = None
    gb = k.main('gbev', bevel_gold(8, 16, gd)); gbd = k.main('gbevd', bevel_gold(8, 16, sh(gd, 0.8)))
    gcap = k.main('gcap', gold_tex(8, 8, gd)); gglow = k.glow('gglow', gold_tex(6, 8, lit(gd, 0.3), False))
    cry = k.main('cry', P.facet(4, 8, lit(gm, 0.5), sh(gm, 0.7))); cryg = k.glow('cryg', P.facet(4, 4, (255, 255, 255), lit(gm, 0.3)))
    import heads4 as H4
    xf = W4.xform
    layers = [('', 1.0, 0, 0.0, 0.0, (11, 9, 12, 8)), ('b', 0.82, -30, -1.5, 0.8, (9, 7, 9, 6)), ('c', 0.62, -64, -3.0, 1.5, (7, 5, 7, 0))]
    prims = {}
    for li, (pre, kk, th, dy, dz, (NP, NS, NG, NM)) in enumerate(layers):
        Sx, Ex, Wx, Hx = [xf(p, kk, th, dy, dz) for p in (S0, E0, W0, H0)]
        for s, n in ((1, 'r'), (-1, 'l')):
            X = lambda p: [p[0] * s, p[1], p[2]]
            wb, mb, hb = W4.skeleton(m, n, s, pre=pre, pts=(Sx, Ex, Wx))
            fw = 1.7 * kk if li == 0 else 1.4 * kk
            seg(m, wb, X(Sx), X(Ex), fw * 1.25, gb, gbd, thz=fw); seg(m, mb, X(Ex), X(Wx), fw * 1.05, gb, gbd, thz=fw * 0.9); seg(m, hb, X(Wx), X(Hx), fw * 0.85, gb, gbd, thz=fw * 0.8)
            pl = []
            for i in range(NP):
                t = i / (NP - 1); R = lerp3(Wx, Hx, 0.05 + 0.95 * t); R[2] += 0.4 + 0.03 * i
                pb = m.bone(pre + 'p%d_%s' % (i, n), X(R), hb); pl.append(pb)
                L = (20 + 11 * math.sin(min(1, t * 1.1) * math.pi * 0.6)) * kk
                slab(m, pb, X(R), L, 3.4 * max(0.85, kk), s * (28 + 98 * t ** 1.1 + th), F_prim, side, tside, s, th=0.5, glow=tglow if li == 0 else None)
            prims[pre + n] = pl
            for i in range(NS):
                t = i / (NS - 1); R = lerp3(Ex, Wx, t); R[2] += 0.25 - 0.02 * i
                slab(m, mb, X(R), (17 + 4 * t) * kk, 3.6 * max(0.85, kk), s * (24 * t + th), F_sec, side, tside, s, th=0.5)
            for i in range(NG):
                t = i / (NG - 1); R = lerp3(Sx, Hx, 0.04 + 0.9 * t); R[2] -= 0.45 + 0.01 * i
                b = wb if t < 0.33 else (mb if t < 0.62 else hb)
                ang = (24 * t / 0.62) if t < 0.62 else (24 + 84 * (t - 0.62) / 0.38)
                slab(m, b, X(R), (9 + 3 * t) * kk, 3.3 * max(0.85, kk), s * (ang + th), F_cov, side, wside, s, th=0.45)
            for i in range(NM):
                t = i / max(1, NM - 1); R = lerp3(Sx, Hx, 0.02 + 0.8 * t); R[2] -= 0.85
                b = wb if t < 0.33 else (mb if t < 0.62 else hb)
                slab(m, b, X(R), 5 * kk, 3.0, s * (4 + 70 * t ** 1.5 + th), F_sm, side, wside, s, th=0.4, steps=((0.0, 0.7, 1.0), (0.7, 1.0, 0.6)))
            if li == 0:   # set crystals on the joints of the main layer
                for b, c_, r_, d_ in ((wb, X(Sx), 1.5, (-0.4, 1, -0.5)), (mb, X(Ex), 1.4, (0.3, 1, -0.5)), (hb, X(Wx), 1.3, (0.6, 1, -0.4))):
                    cc = [c_[0], c_[1] + 0.4, c_[2] - 1.0]
                    m.box(b, [cc[0] - r_, cc[1] - r_, cc[2] - r_ * 0.7], [cc[0] + r_, cc[1] + r_, cc[2] + r_ * 0.7], gcap, gcap, origin=cc, rotation=[0, 0, 45])
                    H4.crystal(m, b, [cc[0], cc[1], cc[2] - 0.6], 3.0 * r_ / 1.4, r_ * 0.75, cry, cry, cryg, d=(d_[0] * s, d_[1], d_[2]))
            if pre in ('', 'b'):   # sweeping gold blades along the wing: solid, bevelled, crystal-tipped
                for (a_, b_, c_, w0) in (((E0[0] - 1, E0[1] + 1.5, E0[2] - 1.9), (W0[0] + 4, W0[1] + 9, W0[2] - 1.9), (35, 8, W0[2] - 1.9), 2.4),
                                         ((W0[0] + 1, W0[1] - 4, W0[2] - 1.7), (24, -2, W0[2] - 1.7), (33, -12, W0[2] - 1.7), 1.7)):
                    pts = [X(p) for p in W4.bez3(xf(a_, kk, th, dy, dz), xf(b_, kk, th, dy, dz), xf(c_, kk, th, dy, dz), 12)]
                    blade_arc(m, hb, pts, w0 * kk, 0.35, 0.9 * kk, gb, gbd, guv=gglow)
                    if li == 0:
                        d = [pts[-1][j] - pts[-2][j] for j in range(3)]
                        H4.crystal(m, hb, pts[-1], 2.4, 0.8, cry, cry, cryg, d=d)
    # the sigil: glowing gold discs (as on the Divine Sovereign) inside a 3D gold frame with a cyan heart and orbiting crystals
    cy, cz = -12.0, -6.0
    m.bone('sigil', [0, cy, cz]); m.bone('sig_o', [0, cy, cz], 'sigil'); m.bone('sig_i', [0, cy, cz], 'sigil')
    light, dark = (255, 250, 200), (150, 95, 15)
    uo = k.glow('circ_o', P.magic_circle(112, gd, light, dark, 'outer')); ui = k.glow('circ_i', P.magic_circle(112, gm, (230, 255, 255), (20, 90, 120), 'inner'))
    R1, R2 = 13.0, 9.5
    m.plate('sig_o', [-R1, cy - R1, cz - 0.05], [R1, cy + R1, cz + 0.05], uo)
    m.plate('sig_i', [-R2, cy - R2, cz - 0.25], [R2, cy + R2, cz - 0.15], ui)
    ring(m, 'sig_o', (0, cy, cz + 0.1), R1 + 0.6, 44, 0.9, 0.7, gb)
    gem3d(m, k, 'sigil', [0, cy, cz - 0.6], 2.6, gm, setting=gd, rot=(0, 0, 45))
    for i in range(4):
        a = math.radians(45 + i * 90); x, y = math.cos(a) * (R1 + 2.2), cy + math.sin(a) * (R1 + 2.2)
        H4.crystal(m, 'sig_o', [x, y, cz], 2.4, 0.9, cry, cry, cryg, d=(math.cos(a), math.sin(a), 0), both=True)
    m.plate('sigil', [-17, cy - 17, cz + 1.0], [17, cy + 17, cz + 1.1], k.soft('sig_soft', P.soft(64, 64, gd, peak=70)))
    # special effects
    fx = Particles(m, None, 4.0, 'wf'); rr = random.Random(name)
    flake = k.main('flake', feather_slab_tex(4, 8, (255, 255, 255), lv, pal['shaft'], seed=9))
    spark = k.glow('wspark', P.dot(gm, 3, core=(255, 255, 255))); gmote = k.glow('gmote', P.dot((255, 225, 120), 3, core=(255, 255, 255)))
    for i in range(14):   # gold motes rising through the wings
        fx.add([rr.uniform(-28, 28), rr.uniform(-26, 0), -4.0], [rr.uniform(-1, 1), rr.uniform(5, 11), -rr.uniform(0, 2)], 0.7, gmote, i / 14, spin=150)
    for i in range(12):   # cyan sparkles streaming off the wingtips
        s = 1 if i % 2 else -1
        fx.add([s * rr.uniform(26, 36), rr.uniform(-14, 10), -3.0], [s * rr.uniform(1, 3), -rr.uniform(4, 9), -rr.uniform(1, 3)], 0.6, spark, i / 12, spin=170)
    for i in range(8):    # feathers drifting down, spinning
        s = 1 if i % 2 else -1
        fx.add([s * rr.uniform(8, 24), rr.uniform(-6, 2), -3.0], [s * rr.uniform(1, 4), -15, -2], 1.6, flake, i / 8 + 0.03, sway=25, plate=True, spin=120)
    def build(c):
        tr = {}
        for li, (pre, kk, th, dy, dz, _) in enumerate(layers):
            for s, n in ((1, 'r'), (-1, 'l')):
                tr.update(W4.flap_tracks(c, n, s, prims[pre + n], pre=pre, ph=li * 35, amp=1.0 - li * 0.2))
        spd = 2.0 if c in ('fly', 'jump') else 1.0
        tr['sig_o'] = {'rotation': [(0, 0, 0, f'query.anim_time*{18 * spd}')]}
        tr['sig_i'] = {'rotation': [(0, 0, 0, f'-query.anim_time*{30 * spd}')]}
        tr['sigil'] = {'position': [(0, 0, 'math.sin(query.anim_time*90)*0.4', 0)]}
        return tr
    clips(m, build, 4.0, fx)
    W4.place_back(m)
    return m

# ===================================================================== ARMOUR (armor_set, Y down)
def _bg(w, h, p):
    c = Canvas(w, h); c.fill(c.m_rect(0, 0, w, h), p['navy'], grad=0.25)
    for x in range(2, w - 1, 4): c.engrave([(x, 0), (x, h)], p['navy'], 0.86)       # quilted undersuit
    return c

def _plate(c, m, p, rim=True, grad=0.3):
    c.fill(m, p['ivory'], grad=grad, bevel=True, outline=tuple(int(v) for v in sh(p['lav'], 0.55)))
    lo = m & (c.Y > (np.where(m.any(1))[0].max() if m.any() else 0) - 3)
    c.rgb[lo & m] = tint(c.rgb[lo & m], p['lav'], 0.45)
    if rim:
        e = m & ~erode(m); c.metal(e, p['gold'], outline=False)

def body_front(w, h, p):
    c = _bg(w, h, p); cx = w / 2
    for s in (-1, 1):
        bp = c.m_poly([(cx + s * 2.2, h * 0.1), (cx + s * (w / 2 - 1.5), h * 0.05), (cx + s * (w / 2 - 1), h * 0.3), (cx + s * 5, h * 0.5), (cx + s * 2.2, h * 0.44)])
        _plate(c, bp, p)
    for s in (-1, 1):   # feather engraving on each pec
        for i in range(3): c.engrave([(cx + s * 3, h * (0.14 + i * 0.07)), (cx + s * (8 + i * 2), h * (0.1 + i * 0.09)), (cx + s * (12 + i), h * (0.16 + i * 0.1))], p['ivory'], 0.8)
    c.line([(cx, h * 0.1), (cx, h * 0.6)], p['gold'], 1.6)
    c.metal(c.m_poly([(3, 0), (w - 3, 0), (w - 6, 3.5), (cx + 3, 5.5), (cx - 3, 5.5), (6, 3.5)]), p['gold'])    # collar
    c.gem(cx, 3.0, 1.6, p['gem'], 'round')
    for i in range(3):  # ab plates
        y = h * 0.62 + i * 2.4
        for s in (-1, 1): c.fill(c.m_rect(cx + s * 0.8 - (5 if s < 0 else 0), y, cx + s * 0.8 + (5 if s > 0 else 0), y + 1.8), p['ivory'], grad=0.2, bevel=True)
    c.metal(c.m_rect(0, h * 0.7, w, h * 0.78), p['gold'])
    for x in range(3, w - 2, 5): c.rivet(x, h * 0.74, p['gold'])
    for s in (-1, 1):   # faulds
        fm = c.m_poly([(cx + s * 1.2, h * 0.79), (cx + s * (w / 2 - 1), h * 0.79), (cx + s * (w / 2 - 2), h * 0.99), (cx + s * 2.2, h * 0.99)])
        _plate(c, fm, p, grad=0.2)
    c.noise(0.025, 3)
    return c.images()

def body_back(w, h, p):
    c = _bg(w, h, p); cx = w / 2
    bp = c.m_poly([(2, 1.5), (w - 2, 1.5), (w - 2, h * 0.58), (cx, h * 0.66), (2, h * 0.58)])
    _plate(c, bp, p)
    c.line([(cx, 1), (cx, h * 0.66)], p['gold'], 2.2)
    for s in (-1, 1):   # wing-root roundels
        c.fill(c.m_circle(cx + s * w * 0.24, h * 0.2, 3.6), p['gold'], bevel=True, outline=True)
        c.gem(cx + s * w * 0.24, h * 0.2, 2.0, p['gem'], 'diamond')
        for i in range(3): c.engrave([(cx + s * 2.5, h * (0.36 + i * 0.06)), (cx + s * (w / 2 - 3), h * (0.32 + i * 0.07))], p['ivory'], 0.82)
    c.metal(c.m_rect(0, h * 0.7, w, h * 0.78), p['gold'])
    c.noise(0.025, 4)
    return c.images()

def body_side(w, h, p):
    c = _bg(w, h, p)
    _plate(c, c.m_rect(1, 1, w - 1, h * 0.6), p)
    c.metal(c.m_rect(0, h * 0.7, w, h * 0.78), p['gold'])
    return c.images()

def arm_face(w, h, p, face='out'):
    c = _bg(w, h, p)
    c.metal(c.m_rect(0, h * 0.4, w, h * 0.45), p['gold'])
    gm = c.m_rect(w * 0.2, h * 0.6, w * 0.8, h * 0.9); _plate(c, gm, p)
    c.metal(c.m_rect(0, h * 0.55, w, h * 0.59), p['gold']); c.metal(c.m_rect(0, h * 0.9, w, h * 0.95), p['gold'])
    if face == 'out':
        c.gem(w / 2, h * 0.74, 1.8, p['gem'], 'diamond', setting=p['gold'])
        _plate(c, c.m_rect(1, 0, w - 1, h * 0.36), p)
    elif face in ('front', 'back'):
        for i in range(3): c.engrave([(1, h * (0.64 + i * 0.08)), (w - 1, h * (0.62 + i * 0.08))], p['ivory'], 0.8)
    return c.images()

def leg_face(w, h, p, face='front'):
    c = _bg(w, h, p)
    if face == 'out':
        _plate(c, c.m_rect(w * 0.2, h * 0.05, w * 0.8, h * 0.36), p, grad=0.2)
    if face == 'front':
        for i in range(3): c.metal(c.m_rect(w * 0.15, h * (0.08 + i * 0.1), w * 0.85, h * (0.08 + i * 0.1) + 0.9), p['gold'])
    gm = c.m_poly([(w * 0.18, h * 0.54), (w * 0.82, h * 0.54), (w * 0.82, h * 0.82), (w / 2, h * 0.88), (w * 0.18, h * 0.82)]); _plate(c, gm, p)
    if face == 'front':
        c.line([(w / 2, h * 0.54), (w / 2, h * 0.86)], p['gold'], 1.2)
        for i in range(2): c.engrave([(1.5, h * (0.6 + i * 0.1)), (w / 2, h * (0.66 + i * 0.1)), (w - 1.5, h * (0.6 + i * 0.1))], p['ivory'], 0.8)
    c.metal(c.m_rect(0, h * 0.88, w, h), p['gold'])
    return c.images()

def flat_face(w, h, p, col='navy'):
    c = Canvas(w, h); c.fill(c.m_rect(0, 0, w, h), p[col], grad=0.2, bevel=True); return c.images()

def plate_face(w, h, p, gem=False, feather=False, col='ivory'):
    c = Canvas(w, h); m_ = c.m_rect(0, 0, w, h)
    c.fill(m_, p[col], grad=0.35, bevel=True)
    lo = c.Y > h * 0.7
    if col == 'ivory': c.rgb[lo] = tint(c.rgb[lo], p['lav'], 0.4)
    e = m_ & ~erode(m_); c.metal(e, p['gold'], outline=False)
    if feather and w > 6:
        for i in range(3): c.engrave([(w * 0.2, h * (0.3 + i * 0.18)), (w * 0.5, h * (0.2 + i * 0.18)), (w * 0.8, h * (0.3 + i * 0.18))], p['ivory'], 0.82)
    if gem and min(w, h) >= 6: c.gem(w / 2, h / 2, min(w, h) * 0.28, p['gem'], 'diamond', setting=p['gold'])
    return c.images()

def gold_face(w, h, p):
    c = Canvas(w, h); c.metal(c.m_rect(0, 0, w, h), p['gold'], outline=False)
    if w > 8: c.engrave([(1, h / 2), (w - 1, h / 2)], p['gold'], 0.75)
    return c.images()

def tabard_face(w, h, p):
    c = Canvas(w, h); m_ = c.m_poly([(0, 0), (w, 0), (w, h * 0.82), (w / 2, h), (0, h * 0.82)])
    c.fill(m_, p['ivory'], grad=0.3)
    c.rgb[m_ & (c.Y > h * 0.6)] = tint(c.rgb[m_ & (c.Y > h * 0.6)], p['lav'], 0.35)
    e = m_ & ~erode(m_); e2 = m_ & ~erode(erode(m_)); c.metal(e2, p['gold'], outline=False)
    cx = w / 2
    c.fill(c.m_poly([(cx, h * 0.18), (cx + 3, h * 0.42), (cx, h * 0.66), (cx - 3, h * 0.42)]), p['gold'], bevel=True, outline=True)   # star sigil
    c.gem(cx, h * 0.42, 1.5, p['gem'], 'diamond')
    for s in (-1, 1): c.fill(c.m_line([(cx + s * 1.5, h * 0.42), (cx + s * (w / 2 - 2), h * 0.36)], 1.0), p['gold'], outline=True)
    return c.images()

def _small_feather(k, key, pal, L=24):
    return k.sprite(key, lambda: feather_tex(10, L, (255, 255, 255), pal['lav'], sh(pal['lav'], 0.72), pal['shaft'], tip=(255, 214, 110), seed=len(key), glow=False))

def armor(name, pal=PAL):
    m = BB(name, Atlas(512, 512)); k = Kit(m)
    p = dict(pal)
    PB = Painted(m, k, p)
    gold = (gold_face, {}); navy = (flat_face, {}); plate = (plate_face, {}); plate_g = (plate_face, {'gem': True}); plate_f = (plate_face, {'feather': True})
    dplate = (plate_face, {'col': 'navy'}); dplate_g = (plate_face, {'col': 'navy', 'gem': True})
    gem_c = pal['gem']; gold_c = pal['gold']
    gtex = k.main('gold_s', gold_tex(6, 16, gold_c)); gtexd = k.main('gold_sd', gold_tex(6, 16, sh(gold_c, 0.78)))
    fea = _small_feather(k, 'afea', pal)
    # ---------------- body: fitted shell + sculpted layers
    m.bone('body', [0, 0, 0]); b = 'body'
    PB.box(b, [-4.25, -0.25, -2.25], [4.25, 12.25, 2.25], {'north': (body_front, {}), 'south': (body_back, {}), 'east': (body_side, {}), 'west': (body_side, {}), 'up': navy, 'down': navy})
    PB.box(b, [-1.9, 0.9, -2.75], [1.9, 6.4, -2.3], {'north': dplate, '*': gold})                       # raised sternum plate
    for s in (-1, 1):                                                                                   # gorget (collar) plates
        PB.box(b, [min(s * 0.4, s * 3.9), -1.0, -2.65], [max(s * 0.4, s * 3.9), 0.4, 2.65], {'*': gold}, origin=[s * 2.0, -0.3, 0], rotation=[0, 0, s * 6])
    PB.box(b, [-4.45, 8.4, -2.55], [4.45, 9.6, 2.55], {'*': gold})                                     # belt
    PB.box(b, [-1.3, 8.1, -2.95], [1.3, 9.9, -2.5], {'north': (plate_face, {'gem': True}), '*': gold})  # buckle
    m.bone('body_core', [0, 3.2, -3.0], 'body')
    gem3d(m, k, 'body_core', [0, 3.2, -3.05], 1.7, gem_c, setting=gold_c, rot=(0, 0, 45))
    for s in (-1, 1):   # gold wings flanking the chest gem
        A = [s * 1.6, 3.2, -2.95]; blade_arc(m, b, arc_pts(A, [s * 3.0, 1.8, -2.95], [s * 3.6, 0.9, -2.95], 5), 0.9, 0.35, 0.35, gtex, gtexd)
    for nm, z0, z1 in (('tab_f', -2.75, -2.45), ('tab_b', 2.45, 2.75)):                                # tabards that sway
        m.bone(nm, [0, 9.6, (z0 + z1) / 2], 'body')
        PB.box(nm, [-2.1, 9.6, z0], [2.1, 17.6, z1], {'north' if z0 < 0 else 'south': (tabard_face, {}), 'south' if z0 < 0 else 'north': plate, '*': gold})
    # ---------------- arms
    for s, n in ((-1, 'r'), (1, 'l')):
        a = m.bone('arm_' + n, [s * 5, 2, 0])
        lo, hi = (-8.25, -3.75) if s < 0 else (3.75, 8.25)
        outf, inf = ('west', 'east') if s < 0 else ('east', 'west')
        PB.box(a, [lo, -0.25, -2.25], [hi, 12.25, 2.25], {outf: (arm_face, {'face': 'out'}), inf: (arm_face, {'face': 'in'}), 'north': (arm_face, {'face': 'front'}), 'south': (arm_face, {'face': 'back'}), 'up': navy, 'down': navy})
        def X(a_, b_): return (min(s * a_, s * b_), max(s * a_, s * b_))
        # pauldron: rounded dome (two crossing boxes) + three lames stepping down the arm, gold rims
        x = X(8.9, 3.5); PB.box(a, [x[0], -2.4, -2.9], [x[1], 1.0, 2.9], {'up': dplate, outf: dplate_g, '*': dplate})
        x = X(8.3, 4.0); PB.box(a, [x[0], -2.95, -2.3], [x[1], -2.3, 2.3], {'*': gold})
        x = X(9.3, 4.1); PB.box(a, [x[0], -1.6, -2.4], [x[1], 0.6, 2.4], {'*': dplate})
        for i in range(2):
            x = X(9.0 + i * 0.35, 4.6 + i * 0.2); y0 = 0.8 + i * 1.05
            PB.box(a, [x[0], y0, -2.95 - i * 0.08], [x[1], y0 + 1.0, 2.95 + i * 0.08], {outf: plate, 'north': plate, 'south': plate, '*': gold}, origin=[s * 5.5, y0, 0], rotation=[0, 0, s * (4 + i * 3)])
            PB.box(a, [x[0] - 0.05, y0 + 0.85, -3.0 - i * 0.08], [x[1] + 0.05, y0 + 1.1, 3.0 + i * 0.08], {'*': gold}, origin=[s * 5.5, y0, 0], rotation=[0, 0, s * (4 + i * 3)])
        orn = m.bone('orn_' + n, [s * 8.0, -2.5, 0.4], a)
        # gold crescent rising off the shoulder + a feather fan behind it + the pauldron gem
        blade_arc(m, orn, arc_pts([s * 8.4, -2.2, 0.2], [s * 11.0, -6.5, 0.2], [s * 8.4, -10.2, 0.4], 8), 1.6, 0.35, 0.7, gtex, gtexd)
        blade_arc(m, orn, arc_pts([s * 7.0, -2.6, 1.6], [s * 9.0, -6.0, 1.6], [s * 6.8, -8.4, 1.8], 7), 1.1, 0.3, 0.55, gtex, gtexd)
        for i in range(5):
            R = [s * (6.0 + i * 0.7), -2.2, 1.0 + i * 0.25]
            hang(m, orn, R, 5.0 + i * 0.9, 2.4, s * (12 + i * 14), *fea, side=s, tilt=8)
        gem3d(m, k, a, [s * 9.05, -0.6, 0], 1.1, gem_c, setting=gold_c, rot=(45, 0, 0))
        # vambrace (raised forearm guard) with a gem
        x = X(8.45, 3.55); PB.box(a, [x[0], 7.8, -2.45], [x[1], 11.1, 2.45], {outf: dplate_g, 'north': dplate, 'south': dplate, inf: dplate, '*': gold})
        x = X(8.7, 3.3); PB.box(a, [x[0], 7.3, -2.7], [x[1], 7.8, 2.7], {'*': gold}); PB.box(a, [x[0], 11.0, -2.7], [x[1], 11.5, 2.7], {'*': gold})
        for i in range(3):   # small swept fin on the outside of the vambrace
            blade_arc(m, a, arc_pts([s * 8.6, 8.0 + i * 1.1, 0.0], [s * 10.0, 7.2 + i * 1.2, 0.8], [s * 10.6, 6.6 + i * 1.2, 1.8], 4), 0.7, 0.25, 0.4, gtex, gtexd)
    # ---------------- legs
    for s, n in ((-1, 'r'), (1, 'l')):
        g = m.bone('leg_' + n, [s * 1.9, 12, 0])
        lo, hi = (-4.25, 0.25) if s < 0 else (-0.25, 4.25)
        outf, inf = ('west', 'east') if s < 0 else ('east', 'west')
        PB.box(g, [lo, 11.75, -2.25], [hi, 24.25, 2.25], {'north': (leg_face, {'face': 'front'}), 'south': (leg_face, {'face': 'back'}), outf: (leg_face, {'face': 'out'}), inf: (leg_face, {'face': 'in'}), 'up': navy, 'down': navy})
        kx = s * 1.9
        PB.box(g, [kx - 1.8, 16.4, -2.85], [kx + 1.8, 18.6, -2.3], {'north': plate_g, '*': gold})                  # knee cop
        gem3d(m, k, g, [kx, 17.5, -2.95], 0.9, gem_c, rot=(0, 0, 45))
        PB.box(g, [kx - 1.3, 18.8, -2.6], [kx + 1.3, 22.2, -2.3], {'north': plate_f, '*': gold})                  # greave
        PB.box(g, [lo - 0.15, 22.3, -3.4], [hi + 0.15, 24.3, 2.45], {'north': gold, 'up': gold, '*': gold})        # sabaton
        for i in range(3):   # little gold wings on the outside of the ankle
            blade_arc(m, g, arc_pts([s * 3.9 if s > 0 else -3.9, 22.4 - i * 0.6, 0.6 + i * 0.5], [s * 5.6 if s > 0 else -5.6, 21.0 - i * 0.6, 1.4 + i * 0.5], [s * 6.0 if s > 0 else -6.0, 19.6 - i * 0.6, 2.6 + i * 0.5], 4), 0.6, 0.2, 0.3, gtex, gtexd)
    S5.fit_centre(m, 'body')
    # particles: soft cyan motes rising off the shoulders and the core
    fx = Particles(m, 'body', 3.0, 'af'); rnd = random.Random(name)
    sp = k.glow('spark', P.dot(gem_c, 3, core=(255, 255, 255)))
    for i in range(8):
        s = 1 if i % 2 else -1
        x = s * rnd.uniform(6.0, 10.0) if i < 6 else rnd.uniform(-1.5, 1.5)
        y = rnd.uniform(-4.0, -1.0) if i < 6 else rnd.uniform(2, 4)
        fx.add([x, y, rnd.uniform(-2.5, 2.5) if i < 6 else -3.4], [rnd.uniform(-0.4, 0.4), -rnd.uniform(4, 6), rnd.uniform(-0.5, 0.5)], 0.45, sp, i / 8, spin=140)
    def build(c):
        sw = {'idle': (90, 3), 'walk': (240, 8), 'run': (330, 16), 'jump': (200, 10), 'fly': (260, 20)}[c]
        tr = {'body_core': {'rotation': [(0, 0, 'query.anim_time*60', 0)], 'scale': [(0, 'math.sin(query.anim_time*180)*0.08+1', 'math.sin(query.anim_time*180)*0.08+1', 'math.sin(query.anim_time*180)*0.08+1')]},
              'tab_f': {'rotation': [(0, '%d+math.sin(query.anim_time*%d)*%d' % (-sw[1] // 2 if c in ('run', 'fly') else 0, sw[0], sw[1]), 0, 0)]},
              'tab_b': {'rotation': [(0, '%d+math.sin(query.anim_time*%d+40)*%d' % (sw[1] if c in ('run', 'fly') else 0, sw[0], sw[1]), 0, 0)]}}
        for s, n in ((-1, 'r'), (1, 'l')): tr['orn_' + n] = {'rotation': [(0, 'math.sin(query.anim_time*%d+%d)*2' % (sw[0], 60 if s > 0 else 0), 0, '%d*math.sin(query.anim_time*%d)*2' % (s, sw[0]))]}
        return tr
    clips(m, build, 3.0, fx)
    return m

# ===================================================================== HELM (helmet, Y up, -Z = face)
def helm_face(w, h, p):
    c = Canvas(w, h); m_ = c.m_rect(0, 0, w, h)
    c.fill(m_, p['ivory'], grad=0.3, bevel=True)
    cx = w / 2
    c.fill(c.m_rect(cx - w * 0.36, h * 0.38, cx + w * 0.36, h * 0.5), (12, 12, 22))       # T-visor: eye slit
    c.fill(c.m_rect(cx - 1.5, h * 0.48, cx + 1.5, h * 0.82), (12, 12, 22))                 # mouth slit
    for s in (-1, 1): c.glow_mask(c.m_rect(cx + s * w * 0.2 - 2.5, h * 0.4, cx + s * w * 0.2 + 2.5, h * 0.48), p['gem'])
    c.rgb[c.ga] = C(p['gem'])
    for s in (-1, 1): c.engrave([(cx + s * 3, h * 0.6), (cx + s * w * 0.4, h * 0.75)], p['ivory'], 0.8)
    c.metal(c.m_rect(0, 0, w, h * 0.12), p['gold'])
    c.metal(c.m_rect(cx - 1, h * 0.1, cx + 1, h * 0.38), p['gold'])
    e = m_ & ~erode(m_); c.rgb[e & (c.Y > h * 0.12)] = sh(p['lav'], 0.6)
    return c.images()

def helm_side(w, h, p):
    c = Canvas(w, h); m_ = c.m_rect(0, 0, w, h); c.fill(m_, p['navy'], grad=0.3, bevel=True)
    _plate(c, c.m_poly([(w * 0.05, h * 0.3), (w * 0.6, h * 0.3), (w * 0.35, h * 0.95), (w * 0.05, h * 0.95)]), p)
    c.metal(c.m_rect(0, 0, w, h * 0.12), p['gold'])
    for i in range(3): c.engrave([(w * 0.15, h * (0.35 + i * 0.15)), (w * 0.85, h * (0.28 + i * 0.15))], p['ivory'], 0.8)
    return c.images()

def helm(name, pal=PAL):
    m = BB(name, Atlas(512, 256)); k = Kit(m); p = dict(pal)
    PB = Painted(m, k, p, ydown=False)
    gold = (gold_face, {}); plate = (plate_face, {}); side = (helm_side, {}); face = (helm_face, {})
    gtex = k.main('gold_s', gold_tex(6, 16, pal['gold'])); gtexd = k.main('gold_sd', gold_tex(6, 16, sh(pal['gold'], 0.78)))
    gglow = k.glow('gglow', gold_tex(6, 8, lit(pal['gold'], 0.3), False))
    m.bone('helm', [0, 4, 0]); h = 'helm'
    dplate = (plate_face, {'col': 'navy'})
    PB.box(h, [-4.55, -0.2, -4.55], [4.55, 8.6, 4.55], {'north': face, 'south': dplate, 'east': side, 'west': side, 'up': dplate, 'down': dplate})
    PB.box(h, [-3.6, 8.6, -3.6], [3.6, 9.4, 3.6], {'up': (plate_face, {'feather': True}), '*': gold})                  # crown plate
    PB.box(h, [-4.75, 6.6, -4.8], [4.75, 7.6, 4.8], {'*': gold})                                                       # brow band
    PB.box(h, [-4.7, -0.4, -4.7], [4.7, 0.5, 4.7], {'*': gold})                                                       # lower rim
    PB.box(h, [-0.8, 0.5, 4.5], [0.8, 8.6, 4.85], {'south': (plate_face, {'gem': True}), '*': gold})                    # back ridge
    for s in (-1, 1):   # pointed gold brow (a V over the visor)
        PB.box(h, [min(0, s * 4.7), 7.3, -4.95], [max(0, s * 4.7), 8.3, -4.55], {'*': gold}, origin=[0, 8.3, -4.75], rotation=[0, 0, s * 14])
    PB.box(h, [-0.7, 7.4, -5.1], [0.7, 10.6, -4.5], {'*': gold}); gem3d(m, k, h, [0, 7.6, -5.2], 1.4, pal['gem'], setting=pal['gold'])
    PB.box(h, [-0.5, 9.0, -4.0], [0.5, 12.2, 3.6], {'*': gold})                                                        # crest ridge
    blade_arc(m, h, arc_pts([0, 10.4, -4.4], [0, 13.6, -3.0], [0, 14.6, 1.0], 7), 1.4, 0.3, 0.8, gtex, gtexd, guv=gglow, fin=True)
    fea = _small_feather(k, 'hfea', pal, 28)
    for s in (-1, 1):
        # gold cheek guards + ear discs with gems
        PB.box(h, [min(s * 4.5, s * 2.4), -0.4, -4.9], [max(s * 4.5, s * 2.4), 3.6, -4.4], {'north': plate, '*': gold})
        PB.box(h, [min(s * 4.5, s * 5.1), 2.4, -2.0], [max(s * 4.5, s * 5.1), 6.4, 2.0], {'*': gold})
        gem3d(m, k, h, [s * 5.25, 4.4, 0], 1.2, pal['gem'], rot=(45, 0, 0))
        # feathered wing crests sweeping up and back from the temples
        wb = m.bone('hw_' + ('r' if s > 0 else 'l'), [s * 5.0, 5.0, 0.0], h)
        for i in range(6):
            R = [s * 5.2, 4.6 + i * 0.55, -1.0 + i * 0.7]
            rise(m, wb, R, 6.5 + i * 0.9 - (i > 3) * 1.6, 2.4, s * (-52 + i * 9), *fea, side=s, tilt=30 + i * 4)
        blade_arc(m, wb, arc_pts([s * 5.0, 5.4, -1.6], [s * 8.6, 9.0, -0.4], [s * 8.0, 13.4, 2.4], 7), 1.0, 0.25, 0.6, gtex, gtexd, guv=gglow)
    # floating halo
    m.bone('halo', [0, 13.4, 1.2], h)
    m2 = 'halo'
    pts = [[math.cos(2 * math.pi * i / 24) * 4.6, 13.4, 1.2 + math.sin(2 * math.pi * i / 24) * 4.6] for i in range(25)]
    for i in range(24):
        A, B = pts[i], pts[i + 1]
        cx, cz = (A[0] + B[0]) / 2, (A[2] + B[2]) / 2; L = math.hypot(B[0] - A[0], B[2] - A[2]) * 1.1; ang = -math.degrees(math.atan2(B[2] - A[2], B[0] - A[0]))
        m.box(m2, [cx - L / 2, 13.2, cz - 0.35], [cx + L / 2, 13.6, cz + 0.35], gglow, gglow, origin=[cx, 13.4, cz], rotation=[0, ang, 0])
    for i in range(4):
        a = 2 * math.pi * i / 4 + math.pi / 4
        gem3d(m, k, m2, [math.cos(a) * 4.6, 13.4, 1.2 + math.sin(a) * 4.6], 0.7, pal['gem'], rot=(45, 0, 45))
    fx = Particles(m, 'helm', 3.0, 'hf'); rnd = random.Random(name)
    sp = k.glow('spark', P.dot(pal['gem'], 3, core=(255, 255, 255)))
    for i in range(6): fx.add([rnd.uniform(-5, 5), rnd.uniform(11, 14), rnd.uniform(-3, 4)], [0, rnd.uniform(2, 4), 0], 0.4, sp, i / 6, spin=150)
    def build(c):
        return {'halo': {'position': [(0, 0, 'math.sin(query.anim_time*90)*0.35', 0)], 'rotation': [(0, 0, 'query.anim_time*25', 0)]},
                'hw_r': {'rotation': [(0, 'math.sin(query.anim_time*80)*3', 0, 0)]}, 'hw_l': {'rotation': [(0, 'math.sin(query.anim_time*80+40)*3', 0, 0)]}}
    clips(m, build, 4.0, fx, names=('idle',))
    return m

# ===================================================================== WEAPON (winged-guard greatsword)
def blade_tex(w, h, p):
    c = Canvas(w, h); m_ = c.m_poly([(1, h), (w - 1, h), (w - 1, h * 0.12), (w / 2, 0), (1, h * 0.12)])
    c.fill(m_, (226, 232, 244), grad=0.25)
    c.rgb[m_ & (c.X > w / 2)] = c.rgb[m_ & (c.X > w / 2)] * 0.82                            # bevelled edge: shaded half
    e = m_ & ~erode(m_); c.rgb[e] = (255, 255, 255)
    fl = c.m_rect(w / 2 - 0.8, h * 0.18, w / 2 + 0.8, h * 0.95); c.rgb[fl] = sh(p['gem'], 0.8); c.glow_mask(fl, p['gem'])
    for i in range(5): c.glow_mask(c.m_rect(w / 2 - 1.5, h * (0.3 + i * 0.13), w / 2 + 1.5, h * (0.3 + i * 0.13) + 1), lit(p['gem'], 0.5))
    return c.images()

def weapon(name, pal=PAL):
    m = BB(name, Atlas(256, 256)); k = Kit(m); p = dict(pal)
    gtex = k.main('gold_s', gold_tex(6, 16, pal['gold'])); gtexd = k.main('gold_sd', gold_tex(6, 16, sh(pal['gold'], 0.78)))
    bl = k.sprite('blade', lambda: blade_tex(12, 88, p)); steel = k.main('steel', P.facet(4, 8, (240, 244, 252), (150, 156, 176)))
    grip = k.main('grip', P.facet(4, 8, pal['navy'], sh(pal['navy'], 0.6))); wrap = k.main('wrap', gold_tex(4, 4, pal['gold'], False))
    fea = _small_feather(k, 'wfea', pal, 30)
    m.bone('grip', [0, 0, 0]); g = 'grip'
    for i in range(7): m.box(g, [-0.6, -1.0 + i, -0.6], [0.6, i, 0.6], grip if i % 2 == 0 else wrap, grip if i % 2 == 0 else wrap)
    m.box(g, [-0.9, -2.8, -0.9], [0.9, -1.0, 0.9], gtex, gtexd); gem3d(m, k, g, [0, -2.4, 0], 1.0, pal['gem'], rot=(45, 45, 0))
    gy = 6.0
    m.box(g, [-0.9, gy, -2.4], [0.9, gy + 1.8, 2.4], gtex, gtexd)                     # guard centre
    gem3d(m, k, g, [0, gy + 0.9, -1.0], 1.2, pal['gem'], setting=pal['gold'], rot=(0, 90, 45))
    for s in (-1, 1):                                                                  # winged guard: gold arm + feathers
        blade_arc(m, g, [[0, gy + 0.9, s * 2.0], [0, gy + 1.6, s * 4.0], [0, gy + 3.2, s * 5.6], [0, gy + 5.2, s * 6.2]], 1.3, 0.4, 0.9, gtex, gtexd, fin=True)
        blade_arc(m, g, [[0, gy + 0.5, s * 2.0], [0, gy - 0.2, s * 3.6], [0, gy + 0.6, s * 5.0], [0, gy + 2.2, s * 5.6]], 0.9, 0.3, 0.7, gtex, gtexd, fin=True)
    y0 = gy + 1.8; L = 24.0
    for i in range(6):                                                                 # blade (tapers), painted face plates
        t0, t1 = i / 6, (i + 1) / 6; wd = 3.4 * (1 - 0.18 * t0)
        m.box(g, [-0.35, y0 + L * t0, -wd / 2], [0.35, y0 + L * t1 + 0.05, wd / 2], steel, steel)
    m.cube(g, [-0.4, y0, -1.75], [0.4, y0 + L + 3.0, 1.75], {'east': {'uv': list(bl[0]), 'texture': bl[0].tex}, 'west': {'uv': list(bl[0]), 'texture': bl[0].tex}})
    if bl[1] is not None: m.cube(g, [-0.45, y0, -1.75], [0.45, y0 + L + 3.0, 1.75], {'east': {'uv': list(bl[1]), 'texture': bl[1].tex}, 'west': {'uv': list(bl[1]), 'texture': bl[1].tex}})
    m.bone('rune', [0, y0 + 12, 0], g)
    for i in range(3):
        a = 2 * math.pi * i / 3
        gem3d(m, k, 'rune', [math.cos(a) * 2.6, y0 + 12, math.sin(a) * 2.6], 0.6, pal['gem'], rot=(45, 0, 45))
    clips(m, lambda c: {'rune': {'rotation': [(0, 0, 'query.anim_time*120', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90)*1.5', 0)]}}, 4.0, None, names=('idle',))
    return m
