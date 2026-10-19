# OVERTHRONE "Celestial Sovereign" v10: rebuilt with the solid plate sculptor (vox.py).
# Every armour part is a sculpted plate with real thickness: a gold frame layer (full outline, gold sides) with an ivory
# layer inset 0.75 px and raised in front of it, so the gold edging is the plate's own rim. Plates are split and angled
# (halves meeting in a ridge, overlapping lames, flares) so the silhouette changes; the dark navy under-suit shows in
# the recesses between plates. Stage: helmet + chest prototype first (owner's workflow).
import math, random
import numpy as np
from bb import BB, Atlas, UV
import paint as P
from art import Canvas, erode
from fx import Kit, Particles, clips
import vox
from vox import Sculptor, bevel_paint, metal_paint, solid_uv
from sets6 import gem3d
import sets5 as S5

IVORY, IVORY_SH = (238, 236, 232), (196, 192, 220)
NAVY, NAVY_SH = (34, 36, 60), (20, 21, 36)
GOLD, GEM = (238, 188, 66), (84, 232, 255)

def mirror(poly): return [(1 - x, y) for x, y in poly]

class Mat:
    """Standard materials: (layers) builders."""
    def __init__(self, k):
        self.gside = solid_uv(k, 'gside', (176, 128, 40)); self.iside = solid_uv(k, 'iside', (210, 206, 222))
        self.nside = solid_uv(k, 'nside', NAVY_SH); self.gback = solid_uv(k, 'gback', (120, 84, 24))
    def armour(self, t=0.9, inset=0.75, raise_=0.35, engrave=True, gem=None, extra=None, shade=IVORY_SH):
        return [dict(inset=0, z=0.0, t=t, paint=metal_paint(GOLD), side=self.gside, back=self.gback),
                dict(inset=inset, z=-raise_, t=0.5, paint=bevel_paint(IVORY, shade, engrave, gem=gem, gem_col=GEM, setting=GOLD, extra=extra), side=self.iside)]
    def gold(self, t=0.7):
        return [dict(inset=0, z=0.0, t=t, paint=metal_paint(GOLD), side=self.gside, back=self.gback)]
    def dark(self, t=0.6, inset=0.5):
        return [dict(inset=0, z=0.0, t=t, paint=metal_paint(GOLD), side=self.gside, back=self.gback),
                dict(inset=inset, z=-0.2, t=0.4, paint=bevel_paint(NAVY, NAVY_SH, False), side=self.nside)]

def feather_lines(n=3):
    def ex(c, m):
        for i in range(n):
            y = c.h * (0.25 + i * 0.2)
            c.engrave([(c.w * 0.15, y + c.h * 0.08), (c.w * 0.5, y), (c.w * 0.85, y + c.h * 0.08)], (0, 0, 0), 0.86)
    return ex

def navy_tex(w, h, seams=True, belt=None):
    c = Canvas(w, h); c.rgb[:] = np.array(NAVY, float); c.a[:] = True
    c.rgb[: max(1, h // 16)] = np.array(NAVY, float) * 1.25
    if seams:
        for x in range(3, w - 1, 6): c.rgb[:, x] = np.array(NAVY_SH, float)
    if belt is not None:
        y0, y1 = int(h * belt[0]), int(h * belt[1]); c.metal(c.m_rect(0, y0, w, y1), GOLD, outline=False)
    return c.images()[0]

def shell(m, k, bone, f, t, belt=None, ydown=True):
    """The dark under-suit (visible in the recesses)."""
    dx, dy, dz = [abs(t[i] - f[i]) for i in range(3)]
    fr = k.main(('navy', round(dx, 2), round(dy, 2), belt), navy_tex(int(dx * 4), int(dy * 4), True, belt))
    sd = k.main(('navy', round(dz, 2), round(dy, 2), belt), navy_tex(int(dz * 4), int(dy * 4), True, belt))
    if ydown: fr, sd = UV((fr[0], fr[3], fr[2], fr[1]), fr.tex), UV((sd[0], sd[3], sd[2], sd[1]), sd.tex)
    cap = solid_uv(k, 'navycap', NAVY_SH)
    m.cube(bone, f, t, {'north': vox.F(fr), 'south': vox.F(fr), 'east': vox.F(sd), 'west': vox.F(sd), 'up': vox.F(cap), 'down': vox.F(cap)})

# ===================================================================== HELM (Y up from the neck, -Z = face)
def helm(name):
    m = BB(name, Atlas(1024, 512)); k = Kit(m); S = Sculptor(m, k, ydown=False); M = Mat(k)
    m.bone('helm', [0, 4, 0]); h = 'helm'
    shell(m, k, h, [-4.25, -0.25, -4.25], [4.25, 8.35, 4.25], ydown=False)
    # dark visor with glowing eyes (as in the concept), framed by angled ivory cheek guards and a slim gold V-brow
    eye = solid_uv(k, 'eye', GEM, glow=True)
    for s in (-1, 1):
        m.cube(h, [s * 2.0 - 1.4 if s > 0 else s * 2.0 - 1.4, 4.4, -4.33], [s * 2.0 + 1.4, 5.0, -4.27], {'north': vox.F(eye)})
    cheek = [(0.0, 0.0), (1.0, 0.0), (1.0, 0.7), (0.35, 1.0), (0.1, 0.62)]
    for s in (-1, 1):
        S.plate(h, (s * 3.0, 2.0, -4.5), 3.0, 4.2, [cheek if s > 0 else mirror(cheek)], M.armour(t=0.8, inset=0.5, engrave=False), rot=(0, s * -24, 0), pivot=(s * 4.4, 2.0, -4.4), key='cheek%d' % s)
    S.plate(h, (0, 0.2, -4.5), 3.4, 1.2, [[(0, 0), (1, 0), (0.75, 1), (0.25, 1)]], M.gold(0.6), key='chin')
    S.plate(h, (0, 6.4, -4.6), 9.0, 1.6, [[(0, 0), (1, 0), (1, 0.5), (0.58, 1.0), (0.42, 1.0), (0, 0.5)]], M.gold(0.6), key='brow')
    m.cube(h, [-0.35, 1.2, -4.6], [0.35, 5.8, -4.3], {'north': vox.F(solid_uv(k, 'nasal', GOLD))})
    gem3d(m, k, h, [0, 6.2, -4.85], 1.1, GEM, rot=(0, 0, 45))
    # wing guards: swept up and back past the crown, flared away from the head, feather-scalloped trailing edge
    wing = [(0.0, 0.62), (0.18, 0.4), (0.42, 0.2), (0.72, 0.04), (1.0, 0.0), (0.9, 0.2), (1.0, 0.3), (0.86, 0.48), (0.95, 0.58), (0.76, 0.74), (0.82, 0.86), (0.55, 0.95), (0.2, 1.0), (0.0, 0.9)]
    for s in (-1, 1):
        S.plate(h, (s * 5.2, 6.4, 1.6), 10.0, 10.0, [wing if s > 0 else mirror(wing)], M.armour(extra=feather_lines(3)), rot=(0, s * -90, s * -18), key='wingg%d' % s)
        gem3d(m, k, h, [s * 5.4, 4.2, -1.6], 1.1, GEM, rot=(45, 0, 0))
    # back plate + nape lames flaring out
    S.plate(h, (0, 4.6, 4.55), 8.2, 7.0, [[(0, 0), (1, 0), (1, 0.8), (0.5, 1.0), (0, 0.8)]], M.armour(), rot=(0, 180, 0), key='back')
    for i, (y, w_) in enumerate(((0.6, 8.6), (-0.6, 7.8))):
        S.plate(h, (0, y, 4.75 + i * 0.3), w_, 1.4, [[(0, 0), (1, 0), (0.92, 1), (0.08, 1)]], M.armour(t=0.6, engrave=False), rot=(-14 - i * 10, 180, 0), pivot=(0, y + 0.7, 4.6), key='nape%d' % i)
    # crown: front crown with five spikes (centre tallest), side crowns sweeping round, a low back crown
    crown_f = [(0.0, 1.0), (0.0, 0.62), (0.12, 0.44), (0.22, 0.62), (0.3, 0.24), (0.41, 0.6), (0.5, 0.0), (0.59, 0.6), (0.7, 0.24), (0.78, 0.62), (0.88, 0.44), (1.0, 0.62), (1.0, 1.0)]
    S.plate(h, (0, 12.4, -3.9), 11.6, 10.0, [crown_f], M.armour(t=1.0, inset=0.6, engrave=False), rot=(-14, 0, 0), pivot=(0, 8.0, -4.2), key='crown_f')
    gem3d(m, k, h, [0, 11.4, -5.0], 2.0, GEM, rot=(-14, 0, 45))
    for s in (-1, 1):
        gem3d(m, k, h, [s * 3.0, 10.6, -4.75], 1.0, GEM, rot=(-14, 0, 45))
    crown_s = [(0.0, 1.0), (0.0, 0.5), (0.2, 0.3), (0.32, 0.55), (0.55, 0.05), (0.72, 0.55), (0.86, 0.35), (1.0, 0.6), (1.0, 1.0)]
    for s in (-1, 1):
        S.plate(h, (s * 4.4, 10.8, -0.6), 7.2, 6.4, [crown_s if s > 0 else mirror(crown_s)], M.armour(t=0.8, engrave=False), rot=(-6, s * -66, s * -14), pivot=(s * 3.9, 7.8, -0.8), key='crown_s%d' % s)
    S.plate(h, (0, 9.5, 3.9), 8.0, 3.4, [[(0, 1), (0, 0.4), (0.25, 0.1), (0.5, 0.45), (0.75, 0.1), (1, 0.4), (1, 1)]], M.armour(t=0.8, engrave=False), rot=(6, 180, 0), pivot=(0, 7.8, 3.9), key='crown_b')
    # crown band (gold circlet) + a skull plate on top
    for s in (-1, 1):
        S.plate(h, (s * 4.5, 8.4, 0), 9.0, 1.4, [[(0, 0), (1, 0), (1, 1), (0, 1)]], M.gold(0.6), rot=(0, s * -90, 0), pivot=(s * 4.5, 8.4, 0), key='band_s')
    S.plate(h, (0, 8.6, 0), 8.0, 8.0, [[(0.1, 0), (0.9, 0), (1, 0.1), (1, 0.9), (0.9, 1), (0.1, 1), (0, 0.9), (0, 0.1)]], M.armour(t=0.6, engrave=False), rot=(90, 0, 0), pivot=(0, 8.6, 0), key='skull')
    clips(m, lambda c: {}, 3.0, None, names=('idle',))
    return m

# ===================================================================== CHEST prototype (armor_set, Y down, -Z front)
def armor(name, full=False):
    m = BB(name, Atlas(1024, 1024)); k = Kit(m); S = Sculptor(m, k, ydown=True); M = Mat(k)
    m.bone('body', [0, 0, 0]); b = 'body'
    shell(m, k, b, [-4.25, -0.25, -2.25], [4.25, 12.25, 2.25], belt=(0.76, 0.84))
    # breastplate: two sculpted halves angled into a central ridge, notched at the sternum to frame the core
    # (plate x runs towards the player's right on screen in this frame, so the outer edge is x=1 for s=-1)
    half = [(0.0, 0.16), (0.45, 0.06), (0.88, 0.0), (1.0, 0.07), (0.97, 0.5), (0.72, 0.8), (0.3, 0.97), (0.0, 1.0), (0.0, 0.68), (0.24, 0.48), (0.0, 0.3)]
    for s in (-1, 1):
        poly = half if s > 0 else mirror(half)
        S.plate(b, (s * 2.55, 3.5, -3.25), 5.1, 7.2, [poly], M.armour(t=0.9, extra=feather_lines(3)), rot=(0, s * 10, 0), pivot=(0, 3.5, -3.25), key='pec%d' % s)
        # layered clavicle plates over the top of each pec, pointing up towards the shoulder
        clav = [(0.0, 0.5), (0.3, 0.1), (1.0, 0.0), (0.85, 0.7), (0.2, 1.0)]
        S.plate(b, (s * 2.7, 0.9, -3.75), 3.8, 2.0, [clav if s > 0 else mirror(clav)], M.armour(t=0.6, inset=0.5, engrave=False), rot=(0, s * 10, s * -8), pivot=(0, 0.9, -3.75), key='clav%d' % s)
    # the core: a gold setting (pointed diamond frame) around a big cyan gem, sitting in the dark notch
    setting = [(0.5, 0.0), (0.68, 0.32), (1.0, 0.5), (0.68, 0.68), (0.5, 1.0), (0.32, 0.68), (0.0, 0.5), (0.32, 0.32)]
    inner = [(0.5, 0.2), (0.66, 0.5), (0.5, 0.8), (0.34, 0.5)]
    S.plate(b, (0, 4.0, -3.75), 4.6, 5.4, [setting, inner], M.gold(0.7), key='core_set')
    m.bone('core', [0, 4.0, -3.9], b)
    gem3d(m, k, 'core', [0, 4.0, -3.9], 2.3, GEM, rot=(0, 0, 45))
    # collar: flared gorget plates around the neck
    gorget = [(0.0, 1.0), (0.12, 0.0), (0.88, 0.0), (1.0, 1.0)]
    for s in (-1, 1):
        S.plate(b, (s * 1.95, -0.55, -2.35), 3.7, 1.9, [gorget], M.armour(t=0.7, engrave=False), rot=(-32, 0, s * 6), pivot=(s * 1.95, 0.3, -2.35), key='gorget')
        S.plate(b, (s * 3.6, -0.5, 0.0), 4.4, 1.8, [gorget], M.armour(t=0.7, engrave=False), rot=(-28, s * 90, 0), pivot=(s * 3.6, 0.3, 0.0), key='gorget_s')
    # abdomen: two overlapping lames, pointed in the middle, narrower than the chest (dark sides show)
    for i, (y, w_) in enumerate(((7.9, 6.2), (9.0, 5.4))):
        S.plate(b, (0, y, -2.45 - 0.15 * (1 - i)), w_, 1.6, [[(0, 0), (1, 0), (0.88, 0.7), (0.5, 1.0), (0.12, 0.7)]], M.armour(t=0.6, engrave=False), key='lame%d' % i)
    # belt: gold band + a winged emblem with a gem
    S.plate(b, (0, 9.95, -2.5), 8.9, 1.2, [[(0, 0), (1, 0), (1, 1), (0, 1)]], M.gold(0.5), key='belt')
    emblem = [(0.5, 0.0), (0.62, 0.3), (1.0, 0.1), (0.85, 0.55), (0.62, 0.65), (0.5, 1.0), (0.38, 0.65), (0.15, 0.55), (0.0, 0.1), (0.38, 0.3)]
    S.plate(b, (0, 10.0, -2.75), 5.2, 2.8, [emblem], M.armour(t=0.7, engrave=False), key='emblem')
    gem3d(m, k, b, [0, 10.0, -3.25], 1.1, GEM, rot=(0, 0, 45))
    # arms/legs: under-suit only in the prototype
    for s, n in ((-1, 'r'), (1, 'l')):
        a = m.bone('arm_' + n, [s * 5, 2, 0]); lo, hi = (-8.25, -3.75) if s < 0 else (3.75, 8.25)
        shell(m, k, a, [lo, -0.25, -2.25], [hi, 12.25, 2.25])
        g = m.bone('leg_' + n, [s * 1.9, 12, 0]); lo, hi = (-4.25, 0.25) if s < 0 else (-0.25, 4.25)
        shell(m, k, g, [lo, 11.75, -2.25], [hi, 24.25, 2.25])
    S5.fit_centre(m, 'body')
    clips(m, lambda c: {'core': {'scale': [(0, 'math.sin(query.anim_time*180)*0.06+1', 'math.sin(query.anim_time*180)*0.06+1', 'math.sin(query.anim_time*180)*0.06+1')]}}, 3.0, None)
    return m
