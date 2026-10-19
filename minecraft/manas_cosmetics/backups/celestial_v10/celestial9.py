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
    # ---------------- back of the torso: a shield-shaped backplate with a gold spine ridge
    S.plate(b, (0, 4.2, 2.6), 8.0, 7.8, [[(0.0, 0.0), (1.0, 0.0), (1.0, 0.62), (0.5, 1.0), (0.0, 0.62)]], M.armour(t=0.8), rot=(0, 180, 0), key='backplate')
    S.plate(b, (0, 4.0, 3.3), 1.4, 7.6, [[(0.5, 0.0), (1.0, 0.1), (1.0, 0.9), (0.5, 1.0), (0.0, 0.9), (0.0, 0.1)]], M.gold(0.6), rot=(0, 180, 0), key='spine')
    # ---------------- waist: dark centre tabard (front, sways), layered ivory tassets that follow the thighs, side and rear plates
    m.bone('tab_f', [0, 10.6, -2.7], b); m.bone('tab_b', [0, 10.6, 2.7], b)
    tab = [(0.0, 0.0), (1.0, 0.0), (1.0, 0.82), (0.5, 1.0), (0.0, 0.82)]
    S.plate('tab_f', (0, 15.0, -2.75), 3.0, 8.8, [tab], M.dark(t=0.5, inset=0.5), key='tab_f')
    S.plate('tab_b', (0, 15.4, 2.75), 5.0, 9.6, [tab], M.armour(t=0.6, engrave=False), rot=(0, 180, 0), key='tab_b')
    tasset = [(0.0, 0.0), (1.0, 0.0), (0.95, 0.62), (0.6, 1.0), (0.05, 0.78)]
    for s in (-1, 1):
        for i, (y, h_, w_) in enumerate(((12.4, 4.4, 3.6), (14.9, 4.0, 3.2))):
            S.plate(b, (s * 2.75, y, -2.85 - 0.25 * (1 - i)), w_, h_, [tasset if s > 0 else mirror(tasset)], M.armour(t=0.6, inset=0.55, engrave=False), rot=(-6, 0, s * -9), pivot=(s * 2.75, y - h_ / 2, -2.8), key='tasset%d%d' % (s, i))
        S.plate(b, (s * 4.6, 12.8, 0.0), 4.4, 5.0, [[(0.0, 0.0), (1.0, 0.0), (0.9, 0.7), (0.5, 1.0), (0.1, 0.7)]], M.armour(t=0.6, inset=0.55, engrave=False), rot=(0, s * -90, s * 10), key='stasset')
    # ---------------- arms
    for s, n in ((-1, 'r'), (1, 'l')):
        a = m.bone('arm_' + n, [s * 5, 2, 0]); lo, hi = (-8.25, -3.75) if s < 0 else (3.75, 8.25)
        shell(m, k, a, [lo, -0.25, -2.25], [hi, 12.25, 2.25])
        ox = s * 8.55
        # pauldron: three feather-edged lames stepping down the outside, flared, under a domed cap; front/back faces too
        lame = [(0.0, 0.0), (1.0, 0.0), (1.0, 0.5), (0.8, 0.85), (0.5, 1.0), (0.2, 0.85), (0.0, 0.5)]
        for i, (y, h_, w_, fl) in enumerate(((-1.5, 3.8, 7.2, 30), (0.7, 3.4, 6.6, 20), (2.7, 3.0, 5.8, 12))):
            S.plate(a, (ox + s * (0.6 - 0.2 * i), y, 0.0), w_, h_, [lame], M.armour(t=0.8, inset=0.6, engrave=False, extra=feather_lines(1) if i == 0 else None), rot=(0, s * -90, s * -fl), key='lame%d' % i)
        S.plate(a, (s * 6.2, -2.6, 0.0), 6.4, 6.6, [[(0.2, 0.0), (0.8, 0.0), (1.0, 0.25), (1.0, 0.75), (0.8, 1.0), (0.2, 1.0), (0.0, 0.75), (0.0, 0.25)]], M.armour(t=0.7, inset=0.6, engrave=False), rot=(90, 0, s * -12), key='pcap')
        pf = [(0.0, 0.0), (1.0, 0.0), (1.0, 0.4), (0.72, 0.95), (0.3, 0.75), (0.0, 0.45)]
        for zz, ry in ((-3.3, 0), (3.3, 180)):
            S.plate(a, (s * 6.7, -0.4, zz), 5.2, 4.6, [pf if s > 0 else mirror(pf)], M.armour(t=0.7, inset=0.55, engrave=False), rot=(0, ry, s * -16 if ry == 0 else s * 16), key='pfront%d%d' % (s, ry))
        gem3d(m, k, a, [ox + s * 1.25, -1.6, 0.0], 1.4, GEM, setting=GOLD, rot=(45, 0, 0))
        # small feathers rising off the pauldron towards the wings
        for i in range(3):
            S.plate(a, (s * (6.0 + i * 1.1), -5.4 - i * 0.3, 1.2 + i * 0.4), 2.4, 5.6 - i * 0.6, [COV], [dict(inset=0, z=0.0, t=0.4, paint=feather_base('sec'), side=M.iside, back='face', step=0.75, quant=0.5)], rot=(18, 0, s * (14 + i * 14)), pivot=(s * (6.0 + i * 1.1), -2.6, 1.2 + i * 0.4), key='pfea%d' % i)
        # rerebrace (outer upper arm) and elbow cop
        S.plate(a, (ox, 5.0, 0.0), 3.4, 3.4, [[(0.0, 0.0), (1.0, 0.0), (1.0, 0.6), (0.5, 1.0), (0.0, 0.6)]], M.armour(t=0.6, inset=0.5, engrave=False), rot=(0, s * -90, 0), key='rere')
        S.plate(a, (s * 6.0, 7.2, 2.6), 3.2, 2.8, [[(0.5, 0.0), (1.0, 0.5), (0.5, 1.0), (0.0, 0.5)]], M.gold(0.6), rot=(0, 180, 0), key='elbow')
        # vambrace: flared towards the wrist, outer plate with a raised gold fin and a small gem
        vam = [(0.18, 0.0), (0.82, 0.0), (1.0, 1.0), (0.0, 1.0)]
        S.plate(a, (ox + s * 0.05, 9.4, 0.0), 5.0, 4.6, [vam], M.armour(t=0.7, inset=0.6, engrave=False), rot=(0, s * -90, s * -6), key='vam_o')
        S.plate(a, (s * 6.0, 9.4, -2.6), 4.6, 4.6, [vam], M.armour(t=0.7, inset=0.6, engrave=False), rot=(8, 0, 0), key='vam_f')
        S.plate(a, (s * 6.0, 9.4, 2.6), 4.6, 4.6, [vam], M.armour(t=0.7, inset=0.6, engrave=False), rot=(-8, 180, 0), key='vam_b')
        S.plate(a, (ox + s * 0.9, 9.0, 0.0), 1.2, 4.4, [[(0.5, 0.0), (1.0, 0.25), (1.0, 1.0), (0.0, 1.0), (0.0, 0.25)]], M.gold(0.5), rot=(0, 0, 0), key='fin')
        gem3d(m, k, a, [ox + s * 0.75, 10.6, -1.3], 0.8, GEM, rot=(45, 0, 0))
        S.plate(a, (s * 6.0, 11.85, -2.55), 4.6, 0.9, [[(0, 0), (1, 0), (1, 1), (0, 1)]], M.gold(0.4), key='cuff')
    # ---------------- legs
    for s, n in ((-1, 'r'), (1, 'l')):
        g = m.bone('leg_' + n, [s * 1.9, 12, 0]); lo, hi = (-4.25, 0.25) if s < 0 else (-0.25, 4.25)
        shell(m, k, g, [lo, 11.75, -2.25], [hi, 24.25, 2.25])
        x = s * 1.9; xo = s * 4.45
        S.plate(g, (xo, 14.6, 0.0), 4.0, 4.0, [[(0.0, 0.0), (1.0, 0.0), (1.0, 0.7), (0.5, 1.0), (0.0, 0.7)]], M.armour(t=0.6, inset=0.5, engrave=False), rot=(0, s * -90, 0), key='thigh_o')
        # knee cop: pointed, with side wings, a gem in a gold socket
        knee = [(0.5, 0.0), (0.85, 0.3), (1.0, 0.25), (0.92, 0.6), (0.5, 1.0), (0.08, 0.6), (0.0, 0.25), (0.15, 0.3)]
        S.plate(g, (x, 17.4, -2.85), 4.4, 3.8, [knee], M.armour(t=0.8, inset=0.6, engrave=False), rot=(-10, 0, 0), key='knee')
        gem3d(m, k, g, [x, 17.4, -3.5], 1.1, GEM, rot=(0, 0, 45))
        # greave: two halves angled into a ridge down the shin, narrow under the knee and wider at the ankle
        gh = [(0.0, 0.0), (0.7, 0.0), (1.0, 0.25), (1.0, 1.0), (0.0, 1.0)]
        for q in (-1, 1):
            S.plate(g, (x + q * 1.05, 20.6, -2.6), 2.1, 3.8, [gh if q > 0 else mirror(gh)], M.armour(t=0.7, inset=0.5, engrave=False), rot=(0, q * 14, 0), pivot=(x, 20.6, -2.6), key='greave%d' % q)
        S.plate(g, (xo, 20.5, 0.0), 4.2, 3.8, [[(0.0, 0.3), (0.5, 0.0), (1.0, 0.3), (1.0, 1.0), (0.0, 1.0)]], M.armour(t=0.6, inset=0.5, engrave=False), rot=(0, s * -90, 0), key='greave_o')
        # sabaton: ivory boot plates, a pointed toe cap, a flared cuff and a little gold heel wing
        boot = [(0, 0), (1, 0), (1, 1), (0, 1)]
        S.plate(g, (x, 23.2, -2.55), 4.7, 2.2, [boot], M.armour(t=0.6, inset=0.45, engrave=False), key='boot_f')
        S.plate(g, (xo + s * 0.1, 23.2, 0.0), 4.9, 2.2, [boot], M.armour(t=0.6, inset=0.45, engrave=False), rot=(0, s * -90, 0), key='boot_o')
        S.plate(g, (x, 24.0, -3.4), 4.2, 2.6, [[(0.0, 0.0), (1.0, 0.0), (0.85, 0.7), (0.5, 1.0), (0.15, 0.7)]], M.armour(t=0.6, inset=0.5, engrave=False), rot=(80, 0, 0), pivot=(x, 23.2, -2.6), key='toe')
        S.plate(g, (x, 21.9, -2.9), 4.8, 1.4, [[(0.0, 0.0), (1.0, 0.0), (0.88, 1.0), (0.12, 1.0)]], M.gold(0.5), rot=(-20, 0, 0), pivot=(x, 22.6, -2.6), key='cuff_f')
        S.plate(g, (xo + s * 0.4, 22.2, 1.6), 3.0, 2.2, [[(0.0, 1.0), (0.2, 0.3), (1.0, 0.0), (0.7, 0.6), (1.0, 1.0)]], M.gold(0.4), rot=(0, s * -90, 0), key='heel')
    S5.fit_centre(m, 'body')
    def build(c):
        sw = {'idle': (90, 2), 'walk': (240, 7), 'run': (330, 14), 'jump': (200, 9), 'fly': (260, 18)}[c]
        return {'core': {'scale': [(0, 'math.sin(query.anim_time*180)*0.06+1', 'math.sin(query.anim_time*180)*0.06+1', 'math.sin(query.anim_time*180)*0.06+1')]},
                'tab_f': {'rotation': [(0, '%d+math.sin(query.anim_time*%d)*%d' % (-sw[1] if c in ('run', 'fly') else 0, sw[0], sw[1]), 0, 0)]},
                'tab_b': {'rotation': [(0, '%d+math.sin(query.anim_time*%d+40)*%d' % (sw[1] if c in ('run', 'fly') else 0, sw[0], sw[1]), 0, 0)]}}
    clips(m, build, 3.0, None)
    return m

# ===================================================================== WINGS (back slot; wings4 frame: Y up, -Z = away from the back)
# Every feather is a SOLID sculpted plate (vox): a lavender-edged base layer with the full feather outline (gold at the tip
# of the primaries) and a white top layer inset and raised, painted with a shaft, barbs and soft shading. Three different
# profiles (asymmetric primary with a notch, broad rounded secondary, rounded covert), each with jittered length, width
# and angle, arranged in six overlapping rows on a three-joint skeleton, under a gold-framed leading edge and wrist crest.
PRIM = [(0.32, 0.0), (0.52, 0.0), (0.66, 0.08), (0.9, 0.22), (1.0, 0.46), (0.9, 0.54), (0.99, 0.62), (0.88, 0.84), (0.6, 1.0), (0.44, 0.97), (0.28, 0.84), (0.14, 0.58), (0.1, 0.3), (0.2, 0.1)]
SEC = [(0.3, 0.0), (0.7, 0.0), (0.95, 0.16), (1.0, 0.6), (0.9, 0.88), (0.68, 1.0), (0.32, 0.99), (0.1, 0.86), (0.0, 0.6), (0.05, 0.16)]
COV = [(0.2, 0.0), (0.8, 0.0), (1.0, 0.3), (0.95, 0.7), (0.75, 0.94), (0.5, 1.0), (0.25, 0.94), (0.05, 0.7), (0.0, 0.3)]
LAV = (190, 186, 218)

def feather_face(kind):
    """White feather face: cream shaft, slanted barbs, lavender on the trailing vane and towards the tip; a thin cyan line
    inside the tip of the primaries."""
    def paint(c, m):
        sx = c.w * (0.42 if kind == 'prim' else 0.5)
        t = c.Y / c.h; u = (c.X - sx) / (c.w * 0.5)
        col = np.ones((c.h, c.w, 3)) * np.array((255, 255, 255), float)
        sh_ = np.clip(0.55 * np.clip(u, 0, 1) + 0.45 * np.clip((t - 0.55) / 0.45, 0, 1), 0, 1)[..., None]
        col = col * (1 - sh_) + np.array((214, 211, 236), float) * sh_
        barb = (((c.Y - np.abs(c.X - sx) * 0.8) % 3.0) < 0.9) & (np.abs(c.X - sx) > 0.9)
        col[barb] = col[barb] * 0.95
        col[np.abs(c.X - sx) < 0.55] = np.array((246, 226, 170), float)
        c.rgb[m] = col[m]; c.a |= m
        e = m & ~erode(m); c.rgb[e] = np.array((226, 224, 242), float)
        if kind == 'prim':
            tipl = m & ~erode(erode(m)) & erode(m) & (c.Y > c.h * 0.86); c.rgb[tipl] = np.array(GEM, float); c.glow_mask(tipl, GEM)
    return paint

def feather_base(kind):
    def paint(c, m):
        feather_face(kind)(c, m)
        c.ga[:] = False
        e = m & ~erode(m); c.rgb[e] = np.array(LAV, float)
        if kind == 'prim':
            tip = e & (c.Y > c.h * 0.78); c.rgb[tip] = np.array((226, 176, 60), float)
    return paint

def wings(name):
    import wings4 as W4
    from fx import lerp3
    m = BB(name, Atlas(1024, 1024)); k = Kit(m); S = Sculptor(m, k, ydown=False); M = Mat(k)
    lside = solid_uv(k, 'lside', (170, 166, 200))
    def feather(bone, R, L, w, ang, kind, s, tilt=0.0, var=0, step=1.5):
        prof = {'prim': PRIM, 'sec': SEC, 'cov': COV}[kind]
        poly = prof if s > 0 else mirror(prof)
        layers = [dict(inset=0, z=0.0, t=0.5, paint=feather_base(kind), side=lside, back='face', step=step, quant=0.5)]
        if kind != 'cov' or L > 9:   # raised white face on the flight feathers and big coverts
            layers.append(dict(inset=0.5, z=-0.2, t=0.3, paint=feather_face(kind), side=M.iside, step=step * 2, quant=0.5, glow=True))   # luminous feather faces
        S.plate(bone, (R[0], R[1] - L / 2, R[2]), w, L, [poly], layers, rot=(tilt, 0, ang), pivot=list(R), key='%s%d_%d_%d' % (kind, s, int(L * 4), int(w * 4)))
    WS, WE, WW, WH = (2.0, -15.0, -1.0), (6.0, -7.0, -1.9), (9.5, 3.5, -2.8), (15.5, 9.5, -3.8)
    prims = {}
    for s, n in ((1, 'r'), (-1, 'l')):
        rv = random.Random(name + n)
        wb, mb, hb = W4.skeleton(m, n, s, pts=(WS, WE, WW))
        X = lambda p: [p[0] * s, p[1], p[2]]
        pl = []
        for i in range(10):          # primaries: broad, long, fanning from down-out to out-up at the tip
            t = i / 9; R = lerp3(WW, WH, t); R[2] += 0.6 + 0.1 * i
            L = 25.0 + 7.0 * math.sin(t * math.pi * 0.8) + rv.uniform(-1.0, 1.0)
            pb = m.bone('p%d_%s' % (i, n), X(R), hb); pl.append(pb)
            feather(pb, X(R), L, 6.4 + rv.uniform(-0.5, 0.5), s * (8 + 74 * t ** 1.3 + rv.uniform(-2, 2)), 'prim', s, tilt=-6 - 8 * t)
        prims[n] = pl
        for i in range(10):          # secondaries: broad rounded, hanging from the forearm, overlapping
            t = i / 9; R = lerp3(WE, WW, t); R[2] += 0.42 - 0.02 * i
            feather(mb, X(R), 21.0 + 5.0 * t + rv.uniform(-1, 1), 6.6 + rv.uniform(-0.4, 0.4), s * (-4 + 12 * t + rv.uniform(-2, 2)), 'sec', s, tilt=-5)
        for i in range(5):           # tertials near the body
            t = 0.08 + 0.21 * i; R = lerp3(WS, WE, t); R[2] += 0.25
            feather(wb, X(R), 15.0 + 5.0 * t + rv.uniform(-0.8, 0.8), 6.4, s * (-14 + 10 * t), 'sec', s, tilt=-3)
        for i in range(11):          # greater coverts over the upper half of the flight feathers
            t = i / 10; R = lerp3(WS, WH, 0.06 + 0.84 * t); R[1] -= 0.4; R[2] -= 0.3
            b = wb if t < 0.3 else (mb if t < 0.62 else hb)
            ang = -10 + 16 * t if t < 0.62 else 6 + 60 * ((t - 0.62) / 0.38) ** 1.3
            feather(b, X(R), 11.0 + 2.0 * math.sin(t * math.pi) + rv.uniform(-0.6, 0.6), 5.4 + rv.uniform(-0.3, 0.3), s * ang, 'cov', s, tilt=-8, step=1.0)
        for i in range(10):          # median coverts
            t = i / 9; R = lerp3(WS, WH, 0.04 + 0.82 * t); R[2] -= 0.75
            b = wb if t < 0.3 else (mb if t < 0.62 else hb)
            feather(b, X(R), 7.0 + rv.uniform(-0.4, 0.4), 4.6, s * (-8 + 56 * t ** 1.6), 'cov', s, tilt=-10, step=1.0)
        for i in range(9):           # lesser coverts: small scales along the leading edge, root to wrist
            t = i / 8; R = lerp3(WS, WW, 0.02 + 0.96 * t); R[1] += 0.3; R[2] -= 1.2
            feather(wb if t < 0.45 else mb, X(R), 4.0, 3.8, s * (-4 + 10 * t), 'cov', s, tilt=-12, step=1.0)
        # gold-framed leading edge: sculpted gold+ivory plates along each bone, a crest with the cyan gem on the wrist
        for b, A, B, wd in ((wb, WS, WE, 2.6), (mb, WE, WW, 2.4), (hb, WW, WH, 2.0)):
            A2, B2 = X([A[0], A[1] + 0.6, A[2] - 1.7]), X([B[0], B[1] + 0.6, B[2] - 1.7])
            L = math.hypot(B2[0] - A2[0], B2[1] - A2[1]); ang = math.degrees(math.atan2(B2[1] - A2[1], B2[0] - A2[0])) - 90
            cx, cy = (A2[0] + B2[0]) / 2, (A2[1] + B2[1]) / 2
            S.plate(b, (cx, cy, A2[2]), wd, L + 1.0, [[(0.5, 0.0), (1.0, 0.12), (0.85, 0.5), (1.0, 0.88), (0.5, 1.0), (0.0, 0.88), (0.15, 0.5), (0.0, 0.12)]], M.armour(t=0.8, inset=0.5, engrave=False), rot=(0, 0, ang), key='frame%d' % int(L * 4))
        crest = [(0.5, 0.0), (0.78, 0.28), (1.0, 0.62), (0.7, 0.8), (0.5, 1.0), (0.3, 0.8), (0.0, 0.62), (0.22, 0.28)]
        S.plate(hb, X([WW[0], WW[1] + 3.2, WW[2] - 2.2]), 5.4, 7.6, [crest], M.armour(t=0.9, inset=0.6, engrave=False), rot=(0, 0, s * -14), key='crest')
        gem3d(m, k, hb, X([WW[0] + 0.3, WW[1] + 2.4, WW[2] - 2.9]), 1.8, GEM, rot=(0, 0, 45))
        S.plate(wb, X([WS[0] + 0.6, WS[1] + 1.4, WS[2] - 2.0]), 3.6, 4.0, [crest], M.armour(t=0.8, inset=0.5, engrave=False), key='hub')
        gem3d(m, k, wb, X([WS[0] + 0.6, WS[1] + 1.0, WS[2] - 2.6]), 1.1, GEM, rot=(0, 0, 45))
    # back harness between the shoulder blades joining both wing roots
    m.bone('harness', [0, -14, -0.8])
    S.plate('harness', (0, -13.2, -1.0), 7.0, 8.4, [[(0.5, 0.0), (1.0, 0.18), (0.92, 0.6), (0.5, 1.0), (0.08, 0.6), (0.0, 0.18)]], M.armour(t=0.9), key='harness')
    gem3d(m, k, 'harness', [0, -12.6, -1.8], 1.6, GEM, rot=(0, 0, 45))
    fx = Particles(m, None, 4.0, 'wf'); rr = random.Random(name)
    mote = k.glow('wmote', P.dot(GEM, 3, core=(255, 255, 255)))
    for i in range(8):
        s = 1 if i % 2 else -1
        fx.add([s * rr.uniform(9, 11), rr.uniform(4, 8), -4.4], [s * rr.uniform(0, 2), rr.uniform(3, 6), -rr.uniform(0, 1.5)], 0.55, mote, i / 8, spin=140)
    def build(c):
        tr = {}
        for s, n in ((1, 'r'), (-1, 'l')): tr.update(W4.flap_tracks(c, n, s, prims[n], 'feather', amp=0.8))
        tr['harness'] = {'position': [(0, 0, 'math.sin(query.anim_time*90)*0.1', 0)]}
        return tr
    clips(m, build, 4.0, fx)
    W4.place_back(m, root_y=WS[1])
    return m

def weapon(name):
    """The set's winged-guard greatsword (built in v8, kept)."""
    import celestial7 as C7
    return C7.weapon(name)
