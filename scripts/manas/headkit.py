# OVERTHRONE above-head v12: ornate painted halos (same lesson as the wings: detail comes from painted sheets on
# well-placed surfaces). A halo = a painted ornate ring lying flat (its top faces up, so the vanilla entity shader lights it
# fully), a thinner inner ring turning the other way, 3D gems on the ring, optional light rays / orbiting crystals /
# broken chunks, a soft glow, and themed model particles. Frame: as heads4.halo_basic (above_head slot, Y up, y=12).
import math, random
import numpy as np
from PIL import Image
from bb import BB, Atlas, UV
import paint as P
from art import erode
from fx import Kit, Particles, clips
from sets6 import gem3d
import heads4 as H4

TEX = 4
def F(u): return {'uv': [round(v, 4) for v in u], 'texture': u.tex}
def C(c): return np.array(c[:3], float)

def paint_ring(R, r0, col, light, dark, gems=None, n_gems=8, runes=True, spikes=0, spike_len=2.5, broken=(), seed=0, glow_runes=None):
    """Top view of an ornate ring (radius R, band from r0 to R, model px). Bevelled metal (light outer lip, darker inner
    lip), an engraved band of runes, gem sockets, outward spikes. Returns (main, glow)."""
    Rt = R + (spike_len if spikes else 0) + 0.5; n = int(math.ceil(2 * Rt * TEX))
    Y, X = np.mgrid[0:n, 0:n].astype(float); X = (X + 0.5) / TEX - Rt; Y = (Y + 0.5) / TEX - Rt
    r = np.hypot(X, Y); a = (np.degrees(np.arctan2(Y, X)) + 360) % 360
    band = (r >= r0) & (r <= R)
    for (b0, b1) in broken: band &= ~((a >= b0) & (a <= b1))
    t = (r - r0) / max(R - r0, 1e-3)
    rgb = np.zeros((n, n, 3)); on = band.copy(); g_on = np.zeros((n, n), bool); grgb = np.zeros((n, n, 3))
    base = C(col); lt = C(light); dk = C(dark)
    rgb[band] = (base * 0.9)[None, :] if False else base
    rgb[band & (t > 0.82)] = lt; rgb[band & (t < 0.16)] = dk * 1.2
    rgb[band & (np.abs(t - 0.5) < 0.04)] = base * 0.75
    if runes:   # a rune band (little 3x3 glyphs) between two engraved lines
        rr = np.random.default_rng(seed); bins = 28; bits = rr.random((bins, 3, 3)) > 0.5
        bi = (a / (360 / bins)).astype(int) % bins
        lu = ((a % (360 / bins)) / (360 / bins) * 4 - 0.5); lv = (t - 0.28) / 0.44 * 3
        gu, gv = np.floor(lu).astype(int), np.floor(lv).astype(int)
        ok = band & (gu >= 0) & (gu < 3) & (gv >= 0) & (gv < 3) & (t > 0.28) & (t < 0.72)
        rune = ok & bits[bi, np.clip(gv, 0, 2), np.clip(gu, 0, 2)]
        rgb[rune] = dk if glow_runes is None else C(glow_runes)
        if glow_runes is not None: g_on |= rune; grgb[rune] = C(glow_runes)
    if spikes:   # outward rays / crown points
        for k in range(spikes):
            ang = math.radians(k * 360 / spikes); L = spike_len * (1.0 if k % 2 == 0 else 0.6)
            dx, dy = math.cos(ang), math.sin(ang)
            along = X * dx + Y * dy; across = np.abs(-X * dy + Y * dx)
            sp = (along > R - 0.2) & (along < R + L) & (across < 0.7 * (1 - (along - R) / L))
            on |= sp; rgb[sp] = np.where((across[sp] < 0.25)[:, None], lt, base)
    if gems is not None:
        for k in range(n_gems):
            ang = math.radians(k * 360 / n_gems + 360 / n_gems / 2); cx, cy = math.cos(ang) * (r0 + R) / 2, math.sin(ang) * (r0 + R) / 2
            d = np.hypot(X - cx, Y - cy); sock = d < (R - r0) * 0.5; gem = d < (R - r0) * 0.34
            if any(b0 <= math.degrees(ang) % 360 <= b1 for b0, b1 in broken): continue
            rgb[sock] = lt; rgb[gem] = C(gems); rgb[gem & (X - cx < 0) & (Y - cy < 0)] = np.clip(C(gems) + 90, 0, 255)
            g_on |= gem; grgb[gem] = C(gems)
    edge = on & ~erode(on); rgb[edge] = dk * 0.8
    out = np.zeros((n, n, 4), np.uint8); out[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8); out[..., 3] = np.where(on, 255, 0)
    g = None
    if g_on.any():
        go = np.zeros((n, n, 4), np.uint8); go[..., :3] = np.clip(grgb, 0, 255).astype(np.uint8); go[..., 3] = np.where(g_on, 255, 0); g = Image.fromarray(go, 'RGBA')
    return Image.fromarray(out, 'RGBA'), g, Rt

def flat(m, bone, img, Rt, y, glow=False, k=None, cz=0.0, thick=0.35):
    """A flat painted disc sheet centred on the axis at height y (top face up), with a second copy below for thickness."""
    uv = (m.glow_atlas() if glow else m.atlas).add(img)
    for dy in ((0.0, -thick) if thick else (0.0,)):
        m.cube(bone, [-Rt, y + dy - 0.02, cz - Rt], [Rt, y + dy, cz + Rt], {'up': F(uv), 'down': F(uv)})

def halo(name, spec):
    """spec: col, light, dark, gems (colour or None), runes_glow, spikes, broken (list of angle gaps), inner (inner ring
    colour or None), crystals (colour or None), rays (colour or None), tilt, fx (sparkles|embers|drips|stars|souls),
    fxcol, bloom (soft glow colour)."""
    m = BB(name, Atlas(512, 512)); k = Kit(m)
    y = 12.0; tilt = spec.get('tilt', 0.0)
    m.bone('tilt', [0, y, 0], rotation=(tilt, 0, tilt * 0.6))
    m.bone('halo', [0, y, 0], 'tilt')
    img, g, Rt = paint_ring(6.4, 4.6, spec['col'], spec['light'], spec['dark'], spec.get('gems'), spec.get('n_gems', 8), True,
                            spec.get('spikes', 0), spec.get('spike_len', 2.5), spec.get('broken', ()), seed=len(name), glow_runes=spec.get('runes_glow'))
    flat(m, 'halo', img, Rt, y, glow=spec.get('emissive', True))
    if g is not None: flat(m, 'halo', g, Rt, y + 0.03, glow=True, thick=0)
    # v14: a solid 3D band under the painted top, so the halo has real depth and is seen from the side, not a flat line
    import essence
    essence.torus(m, k, 'halo', y - 1.2, 5.5, h=3.6, w=2.0, col=spec['col'], light=spec['light'], dark=spec['dark'], key='hr3', broken=spec.get('broken', ()))
    if spec.get('gems'):   # raised 3D gems on the cardinal points
        for i in range(4):
            a = math.radians(i * 90 + 45); gem3d(m, k, 'halo', [math.cos(a) * 5.5, y + 0.5, math.sin(a) * 5.5], 0.9, spec['gems'], rot=(45, i * 90 + 45, 0))
    # v14: a band of glowing runes standing round the rim; a highlight runs round it (animated texture, essence.py)
    import essence
    rcol = spec.get('runes_glow') or spec['light']
    rb = essence.flow(m).add('runes', lambda: essence.rune_band_frames([tuple(int(v * 0.7) for v in rcol), rcol, (255, 255, 255)]))
    n_, rad_ = 28, 5.5; u0, v0, u1, v1 = rb
    for i in range(n_):
        a0, a1 = 2 * math.pi * i / n_, 2 * math.pi * (i + 1) / n_
        if any(b0 <= math.degrees(a0) % 360 <= b1 for b0, b1 in spec.get('broken', ())): continue
        A = np.array([math.cos(a0) * rad_, y + 0.8, math.sin(a0) * rad_]); B = np.array([math.cos(a1) * rad_, y + 0.8, math.sin(a1) * rad_])
        essence.plane(m, 'halo', (A + B) / 2, B - A, [0, 1, 0], np.linalg.norm(B - A) * 1.06, 1.4, UV((u0 + (u1 - u0) * i / n_, v0, u0 + (u1 - u0) * (i + 1) / n_, v1), rb.tex))
    tr = {'halo': {'rotation': [(0, 0, 'query.anim_time*30', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90)*0.4', 0)]}}
    if spec.get('inner'):
        m.bone('inner', [0, y + 0.8, 0], 'tilt')
        img2, g2, Rt2 = paint_ring(4.0, 3.3, spec['inner'], spec['light'], spec['dark'], None, 0, False, spikes=12, spike_len=1.2, seed=7)
        flat(m, 'inner', img2, Rt2, y + 0.8, glow=True, thick=0.2)
        essence.torus(m, k, 'inner', y + 0.4, 3.65, h=2.2, w=1.2, col=spec['inner'], light=spec['light'], dark=spec['dark'], n=24, key='ir3')
        tr['inner'] = {'rotation': [(0, 0, '-query.anim_time*55', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*90+60)*0.4', 0)]}
    if spec.get('rays'):
        m.bone('rays', [0, y - 0.2, 0], 'tilt')
        img3, _, Rt3 = paint_ring(6.0, 5.8, spec['rays'], (255, 255, 255), spec['rays'], None, 0, False, spikes=24, spike_len=4.0, seed=9)
        flat(m, 'rays', img3, Rt3, y - 0.2, glow=True, thick=0)
        tr['rays'] = {'rotation': [(0, 0, 'query.anim_time*12', 0)], 'scale': [(0, 'math.sin(query.anim_time*120)*0.05+1', 1, 'math.sin(query.anim_time*120)*0.05+1')]}
    if spec.get('crystals'):
        m.bone('orbit', [0, y, 0], 'tilt')
        cry = k.main('cb', P.facet(6, 24, P.shade(spec['crystals'], 1.25), P.shade(spec['crystals'], 0.7), hi=(255, 255, 255)))
        cg = k.glow('cg', P.facet(4, 4, (255, 255, 255), spec['crystals']))
        for i in range(6):
            a = 2 * math.pi * i / 6; x, z = math.cos(a) * 8.0, math.sin(a) * 8.0
            H4.crystal(m, 'orbit', [x, y - 1.5 + (i % 2) * 1.2, z], 3.4, 1.0, cry, cry, cg, both=True)
        tr['orbit'] = {'rotation': [(0, 0, '-query.anim_time*24', 0)]}
    if spec.get('bloom'):
        sft = k.soft('bloom', P.soft(48, 48, spec['bloom'], peak=110, ring=(0.72, 0.15)))
        m.flat('halo', [-9, y - 0.4, -9], [9, y - 0.38, 9], sft)
    # particles
    fx = Particles(m, 'tilt', 3.0, 'hp'); rr = random.Random(name); col = spec.get('fxcol', spec['light'])
    dot = k.glow('hdot', P.dot(col, 4, core=(255, 255, 255)))
    kind = spec.get('fx', 'sparkles')
    for i in range(12):
        a = 2 * math.pi * i / 12 + rr.uniform(-0.2, 0.2); x, z = math.cos(a) * rr.uniform(4.5, 7), math.sin(a) * rr.uniform(4.5, 7)
        if kind == 'drips': fx.add([x, y - 0.5, z], [0, -rr.uniform(6, 9), 0], 0.7, dot, i / 12)
        elif kind == 'embers': fx.add([x, y, z], [rr.uniform(-1, 1), rr.uniform(4, 7), rr.uniform(-1, 1)], 0.8, dot, i / 12, spin=160)
        else: fx.add([x, y + rr.uniform(-0.5, 0.5), z], [rr.uniform(-0.5, 0.5), rr.uniform(1.5, 3.5), rr.uniform(-0.5, 0.5)], 0.7, dot, i / 12, spin=120, fade_in=0.3, fade_out=0.6)
    clips(m, lambda c: dict(tr), 3.0, fx, names=('idle',))
    return m

HALOS = {
    'hero_halo': dict(col=(240, 190, 60), light=(255, 245, 190), dark=(150, 95, 15), gems=(255, 250, 200), inner=(255, 230, 140), bloom=(255, 215, 110), fx='sparkles', fxcol=(255, 235, 150)),
    'fallen_halo': dict(col=(150, 15, 30), light=(255, 110, 100), dark=(40, 6, 12), gems=(255, 40, 50), runes_glow=(255, 40, 50), broken=((20, 45), (150, 170), (250, 280)), tilt=14, bloom=(220, 20, 30), fx='drips', fxcol=(255, 40, 50)),
    'void_halo': dict(col=(80, 40, 140), light=(220, 180, 255), dark=(24, 8, 44), gems=(200, 120, 255), runes_glow=(210, 140, 255), inner=(190, 110, 255), crystals=(170, 80, 255), bloom=(160, 80, 255), fx='stars', fxcol=(230, 200, 255)),
    'crimson_crystal_halo': dict(col=(200, 150, 50), light=(255, 230, 150), dark=(90, 50, 10), gems=(230, 30, 50), crystals=(230, 25, 45), bloom=(230, 30, 50), fx='embers', fxcol=(255, 110, 60)),
    'radiant_double_halo': dict(col=(245, 200, 70), light=(255, 252, 220), dark=(160, 105, 20), gems=(255, 255, 230), inner=(255, 245, 200), rays=(255, 225, 120), spikes=16, spike_len=1.6, bloom=(255, 230, 140), fx='sparkles', fxcol=(255, 245, 190)),
    'throne_halo': dict(col=(238, 188, 66), light=(255, 240, 170), dark=(140, 90, 20), gems=(255, 40, 55), runes_glow=(255, 60, 70), inner=(255, 60, 70), rays=(255, 200, 80), spikes=12, spike_len=2.2, bloom=(255, 190, 70), fx='embers', fxcol=(255, 200, 90)),
}
