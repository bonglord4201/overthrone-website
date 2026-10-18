# OVERTHRONE v4 pets for Manas Cosmetics (pet slot). Frame: Y up from the pet's feet (y=0), -Z = the pet's front.
# The mod shrinks a pet whose model box is over 16 px tall or 32 px wide/deep, so everything stays inside that.
# Clips: idle, walk, run (falls back to walk), fly (airborne), and special / special2 (played now and then while the pet
# stands still: little tricks). Eyes are a separate plate so they can blink (scale Y).
import math, random
from bb import BB, Atlas
import paint as P
from fx import Kit, Particles, clips, cycle_keys

def cube6(m, bone, f, t, north, other, top=None, south=None, origin=None, rotation=None):
    faces = {'north': F(north), 'south': F(south or other), 'east': F(other), 'west': F(other), 'up': F(top or other), 'down': F(other)}
    return m.cube(bone, f, t, faces, origin, rotation)

def F(uv): return {'uv': [round(v, 4) for v in uv], 'texture': getattr(uv, 'tex', 0)}

def blink_keys(L, at=0.55):
    t0 = round(L * at, 3)
    return [(0, 1, 1, 1), (t0, 1, 1, 1), (round(t0 + 0.06, 3), 1, 0.1, 1), (round(t0 + 0.14, 3), 1, 1, 1), (L, 1, 1, 1)]

def eyes(m, k, bone, c, w, h, iris, style='round', sep=0.52, ew=0.34, eh=0.8, parent=None):
    """An eye plate (and its blink bone) centred at c on the -Z face."""
    b = m.bone(bone, list(c), parent)
    uv = k.main('eyes_' + bone, P.eyes_sprite(int(w * 5), int(h * 5), iris, style, sep, ew, eh))
    m.plate(bone, [c[0] - w / 2, c[1] - h / 2, c[2] - 0.02], [c[0] + w / 2, c[1] + h / 2, c[2] + 0.02], uv, back=uv)
    return b

def particles(m, k, col, n, region, rise, size=0.5, L=3.0, name='p'):
    fx = Particles(m, None, L); rnd = random.Random(m.name + name)
    g = k.glow(name, P.dot(col, 3, core=(255, 255, 255)))
    (x0, x1), (y0, y1), (z0, z1) = region
    for i in range(n):
        fx.add([rnd.uniform(x0, x1), rnd.uniform(y0, y1), rnd.uniform(z0, z1)], [rnd.uniform(-0.6, 0.6), rnd.uniform(*rise), rnd.uniform(-0.6, 0.6)], size, g, i / n, spin=160)
    return fx

# ================================================================== SLIMES
def slime(name, col, eye=(20, 25, 60), crown=None, glow_eyes=False, fx='bubbles'):
    m = BB(name, Atlas(256, 128)); k = Kit(m)
    top = k.main('top', P.facet(8, 8, P.mixc(col, (255, 255, 255), 0.45), col))
    side = k.main('side', P.facet(8, 16, P.mixc(col, (255, 255, 255), 0.2), P.shade(col, 0.72)))
    hi = k.main('hi', P.solid((255, 255, 255)))
    m.bone('body', [0, 0, 0])
    layers = [(5.6, 0.0, 4.4), (5.0, 4.4, 6.2), (3.9, 6.2, 7.5), (2.5, 7.5, 8.5), (1.3, 8.5, 9.3)]
    for r, y0, y1 in layers:   # each layer is a cross of two boxes: an octagon, so the blob looks round
        c = r * 0.72
        m.box('body', [-r, y0, -c], [r, y1, c], side, side, uv_top=top)
        m.box('body', [-c, y0, -r], [c, y1, r], side, side, uv_top=top)
    m.box('body', [-0.5, 9.4, -0.3], [0.5, 10.4, 0.7], side, side, uv_top=top, rotation=[-20, 0, 0], origin=[0, 9.4, 0.2])   # teardrop tip
    m.box('body', [-3.4, 5.0, -5.15], [-2.2, 5.8, -4.95], hi, hi); m.box('body', [-4.6, 3.0, -4.15], [-4.0, 4.2, -4.0], hi, hi)   # gloss
    m.box('body', [-2.6, 6.5, -3.95], [-1.8, 7.0, -3.75], hi, hi)
    if glow_eyes:
        uv = k.glow('geyes', P.eyes_sprite(30, 20, eye, 'round', 0.5, 0.3, 0.86, pupil=(60, 0, 10)))
        m.bone('eyes', [0, 3.8, -5.65], 'body'); m.plate('eyes', [-3.4, 2.4, -5.67], [3.4, 5.0, -5.63], uv, back=uv)
    else:
        m.bone('eyes', [0, 3.8, -5.65], 'body')
        uv = k.main('eyes', P.eyes_sprite(30, 20, eye, 'round', 0.5, 0.26, 0.9, pupil=(15, 15, 30)))
        m.plate('eyes', [-3.4, 2.4, -5.67], [3.4, 5.0, -5.63], uv, back=uv)
    fm = k.main('marks', P.face_marks(24, 8, blush=P.mixc(col, (255, 120, 160), 0.6)))
    m.plate('body', [-3.2, 1.3, -5.67], [3.2, 2.5, -5.63], fm, back=fm)
    if crown:
        g = k.main('gold', P.facet(4, 4, (255, 245, 180), crown)); gem = k.glow('gem', P.dot((255, 40, 60), 3, core=(255, 200, 200)))
        m.bone('crown', [0, 8.4, 0], 'body')
        for (f, t) in [([-2.4, 8.2, -2.4], [2.4, 9.0, 2.4])]: m.box('crown', f, t, g, g)
        for x, z in ((-1.9, -1.9), (1.9, -1.9), (-1.9, 1.9), (1.9, 1.9), (0, -2.1), (0, 2.1), (-2.1, 0), (2.1, 0)):
            m.box('crown', [x - 0.35, 9.0, z - 0.35], [x + 0.35, 10.3, z + 0.35], g, g)
        m.box('crown', [-0.45, 8.35, -2.55], [0.45, 8.95, -2.35], gem, gem)
    soft = k.soft('shadow', P.soft(32, 32, col, peak=90))
    m.flat('body', [-7.5, 0.05, -7.5], [7.5, 0.07, 7.5], soft)
    fxo = None
    if fx == 'bubbles': fxo = particles(m, k, P.mixc(col, (255, 255, 255), 0.6), 6, ((-5, 5), (3, 8), (-5, 5)), (3, 6), 0.6)
    elif fx == 'embers': fxo = particles(m, k, (255, 110, 40), 7, ((-5, 5), (4, 9), (-5, 5)), (3, 6), 0.5)
    L = 4.0
    def build(c):
        tr = {'eyes': {'scale': blink_keys(L)}}
        if c in ('idle', 'special', 'special2'):
            tr['body'] = {'scale': [(0, '1+math.sin(query.anim_time*180)*0.05', '1-math.sin(query.anim_time*180)*0.06', '1+math.sin(query.anim_time*180)*0.05')]}
        if c in ('walk', 'run', 'fly'):
            sp = 300 if c == 'walk' else 420
            tr['body'] = {'position': [(0, 0, f'math.abs(math.sin(query.anim_time*{sp}))*3', 0)],
                          'scale': [(0, f'1.06-math.abs(math.sin(query.anim_time*{sp}))*0.1', f'0.9+math.abs(math.sin(query.anim_time*{sp}))*0.18', f'1.06-math.abs(math.sin(query.anim_time*{sp}))*0.1')]}
        if c == 'special':   # happy spin-hop
            tr['body'] = {'position': [(0, 0, 0, 0), (0.4, 0, 4, 0), (0.8, 0, 0, 0), (L, 0, 0, 0)], 'rotation': [(0, 0, 0, 0), (0.8, 0, 360, 0), (L, 0, 360, 0)],
                          'scale': [(0, 1.1, 0.85, 1.1), (0.15, 0.9, 1.15, 0.9), (0.8, 1.15, 0.8, 1.15), (1.0, 1, 1, 1), (L, 1, 1, 1)]}
        if c == 'special2':  # wobble
            tr['body'] = {'rotation': [(0, 0, 0, 'math.sin(query.anim_time*720)*10*math.clamp(1.5-query.anim_time)')]}
        return tr
    clips(m, build, L, fxo, names=('idle', 'walk', 'run', 'fly', 'special', 'special2'))
    return m

# ================================================================== FOXES
def fox(name, fur, light, dark, iris, tails=3, glow=None, spirit=False, fx=None):
    m = BB(name, Atlas(256, 256)); k = Kit(m)
    fu = k.main('fur', P.facet(8, 8, P.shade(fur, 1.12), P.shade(fur, 0.85)))
    fd = k.main('furd', P.facet(8, 8, fur, P.shade(fur, 0.7)))
    lt = k.main('light', P.facet(8, 8, (255, 255, 255), light))
    dk = k.main('dark', P.solid(dark)); pink = k.main('pink', P.solid((255, 160, 170)))
    gl = k.glow('glow', P.facet(8, 8, P.mixc(glow, (255, 255, 255), 0.4), glow)) if glow else lt
    # body (sitting), chest fluff, legs
    m.bone('body', [0, 4, 0])
    m.box('body', [-2.4, 1.8, -1.6], [2.4, 6.8, 3.2], fu, fd, uv_top=fu)
    m.box('body', [-1.7, 2.4, -2.3], [1.7, 6.2, -1.5], lt, lt)                         # chest fluff
    m.box('body', [-1.2, 1.6, -2.6], [1.2, 4.0, -2.2], lt, lt)
    legs = []
    for s in (-1, 1):
        lb = m.bone('leg_f' + ('r' if s > 0 else 'l'), [s * 1.3, 3.5, -1.0], 'body'); legs.append(lb)
        m.box(lb, [s * 1.3 - 0.75, 0, -1.8], [s * 1.3 + 0.75, 3.6, -0.4], fu, fd); m.box(lb, [s * 1.3 - 0.8, 0, -2.0], [s * 1.3 + 0.8, 0.8, -0.4], dk if not spirit else lt, dk)
        hb = m.bone('leg_b' + ('r' if s > 0 else 'l'), [s * 2.0, 2.5, 2.0], 'body'); legs.append(hb)
        m.box(hb, [s * 2.0 - 1.1, 0, 0.6], [s * 2.0 + 1.1, 3.2, 3.4], fu, fd); m.box(hb, [s * 2.0 - 0.8, 0, -0.4], [s * 2.0 + 0.8, 0.8, 1.2], dk if not spirit else lt, dk)
    # head
    m.bone('head', [0, 7, 0.4], 'body')
    face = k.main('face', P.facet(8, 8, P.shade(fur, 1.15), P.shade(fur, 0.95)))
    cube6(m, 'head', [-3.3, 6.6, -3.0], [3.3, 11.8, 2.4], face, fd, top=fu)
    m.box('head', [-3.8, 6.8, -2.4], [-3.0, 9.0, 1.4], lt, lt); m.box('head', [3.0, 6.8, -2.4], [3.8, 9.0, 1.4], lt, lt)   # cheek fluff
    cube6(m, 'head', [-1.5, 6.9, -5.0], [1.5, 8.9, -2.9], lt, lt, top=fu)                    # snout
    m.box('head', [-0.55, 8.2, -5.15], [0.55, 8.9, -4.95], dk, dk)                           # nose
    eyes(m, k, 'eyes', [0, 9.6, -3.05], 5.6, 2.2, iris, 'sharp', 0.56, 0.32, 0.86, parent='head')
    for s, n in ((-1, 'l'), (1, 'r')):
        eb = m.bone('ear_' + n, [s * 2.0, 11.6, 0.0], 'head')
        m.box(eb, [s * 2.0 - 1.3, 11.6, -0.6], [s * 2.0 + 1.3, 13.6, 0.6], fu, fd)
        m.box(eb, [s * 2.0 - 0.8, 13.6, -0.5], [s * 2.0 + 0.8, 15.0, 0.5], fu, fd)
        m.box(eb, [s * 2.0 - 0.4, 15.0, -0.4], [s * 2.0 + 0.4, 15.8, 0.4], dk if not glow else gl, dk)
        m.box(eb, [s * 2.0 - 0.75, 11.8, -0.68], [s * 2.0 + 0.75, 14.2, -0.6], pink if not spirit else gl, pink)
    if spirit:   # glowing markings on the forehead and cheeks
        m.box('head', [-0.35, 10.4, -3.08], [0.35, 11.5, -3.0], gl, gl)
        for s in (-1, 1): m.box('head', [s * 2.6 - 0.3, 7.6, -3.08], [s * 2.6 + 0.3, 8.6, -3.0], gl, gl)
    # tails (fanned behind, each a swaying chain)
    tb = []
    for ti in range(tails):
        f = (ti / max(1, tails - 1) - 0.5) if tails > 1 else 0
        base = m.bone('tail%d' % ti, [0, 3.0, 3.0], 'body')
        y, z, parent, ch = 3.0, 3.0, base, []
        for si, (w, L) in enumerate([(1.6, 2.2), (2.6, 2.6), (3.0, 2.6), (2.6, 2.2), (1.6, 1.6)]):
            b = base if si == 0 else m.bone('tail%d_%d' % (ti, si), [0, y, z], parent)
            uv = (gl if glow else lt) if si >= 3 else fu
            m.box(b, [-w / 2, y - w / 2, z], [w / 2, y + w / 2, z + L], uv, uv if si >= 3 else fd)
            ch.append(b); parent = b; z += L * 0.9
        tb.append((ch, f, ti))
    soft = k.soft('shadow', P.soft(32, 32, glow or (0, 0, 0), peak=70 if glow else 50))
    m.flat('body', [-6.5, 0.05, -6.5], [6.5, 0.07, 6.5], soft)
    fxo = None
    if fx == 'foxfire':
        fxo = particles(m, k, glow, 6, ((-6, 6), (6, 12), (3, 10)), (2, 5), 0.6)
    L = 4.0
    def build(c):
        tr = {'eyes': {'scale': blink_keys(L, 0.4)}}
        wv = 120 if c in ('idle', 'special', 'special2') else 260
        for ch, f, ti in tb:
            for si, b in enumerate(ch):
                ph = si * 35 + ti * 60
                if si == 0:
                    tr[b] = {'rotation': [(0, f'{-35 if c == "idle" else -15}+math.sin(query.anim_time*{wv}*0.7-{ti * 50})*6', 0, f'{f * 80:.1f}+math.sin(query.anim_time*{wv}-{ti * 50})*12')]}
                else:
                    tr[b] = {'rotation': [(0, f'math.sin(query.anim_time*{wv}*0.8-{ph})*6-6', 0, f'math.sin(query.anim_time*{wv}-{ph})*12')]}
        tr['head'] = {'rotation': [(0, 'math.sin(query.anim_time*45)*4', 'math.sin(query.anim_time*30)*10', 'math.sin(query.anim_time*36)*5')]}
        tr['ear_l'] = {'rotation': [(0, 0, 0, 0), (2.8, 0, 0, 0), (2.9, 0, 0, -20), (3.05, 0, 0, 0), (L, 0, 0, 0)]}
        tr['ear_r'] = {'rotation': [(0, 0, 0, 0), (1.2, 0, 0, 0), (1.3, 0, 0, 20), (1.45, 0, 0, 0), (L, 0, 0, 0)]}
        if c in ('walk', 'run', 'fly'):
            sp = 400 if c == 'walk' else 560
            for i, lb in enumerate(legs):
                tr[lb] = {'rotation': [(0, f'math.sin(query.anim_time*{sp}+{(i % 2) * 180 + (i // 2) * 90})*30', 0, 0)]}
            tr['body'] = {'position': [(0, 0, f'math.abs(math.sin(query.anim_time*{sp}))*0.6', 0)]}
        else:
            tr['body'] = {'scale': [(0, 1, '1+math.sin(query.anim_time*120)*0.02', 1)]}
        if c == 'special':   # chases its tails: a full spin
            tr['body'] = {'rotation': [(0, 0, 0, 0), (1.2, 0, -360, 0), (L, 0, -360, 0)], 'position': [(0, 0, 0, 0), (0.6, 0, 1.5, 0), (1.2, 0, 0, 0), (L, 0, 0, 0)]}
        if c == 'special2':  # head tilt + ear flick
            tr['head'] = {'rotation': [(0, 0, 0, 0), (0.4, 0, 0, 25), (1.6, 0, 0, 25), (2.0, 0, 0, 0), (L, 0, 0, 0)]}
        return tr
    clips(m, build, L, fxo, names=('idle', 'walk', 'run', 'fly', 'special', 'special2'))
    return m

# ================================================================== PHOENIX CHICK (floats)
def phoenix(name, body=(255, 95, 25), head=(255, 150, 40), tail=(220, 30, 10), glow=(255, 210, 70)):
    m = BB(name, Atlas(256, 256)); k = Kit(m)
    bd = k.main('body', P.facet(8, 8, P.shade(body, 1.15), P.shade(body, 0.8))); hd = k.main('head', P.facet(8, 8, P.shade(head, 1.1), P.shade(head, 0.85)))
    belly = k.main('belly', P.facet(8, 8, (255, 245, 200), (255, 220, 140))); beak = k.main('beak', P.facet(4, 4, (255, 230, 120), (220, 140, 30)))
    fth = k.sprite('fth', lambda: P.feather(10, 30, head, tail, (255, 250, 200), None, 'flame', glow_tip=glow, seed=1))
    tl = k.sprite('tl', lambda: P.feather(10, 50, body, tail, (255, 250, 200), None, 'flame', glow_tip=glow, seed=2))
    m.bone('body', [0, 6, 0])
    m.box('body', [-3.2, 3.0, -2.8], [3.2, 8.4, 3.4], bd, bd, uv_top=bd)
    m.box('body', [-2.4, 3.4, -3.3], [2.4, 7.4, -2.8], belly, belly)
    m.bone('head', [0, 8.4, -0.5], 'body')
    cube6(m, 'head', [-2.8, 8.2, -3.4], [2.8, 13.0, 1.8], hd, hd, top=hd)
    m.box('head', [-0.8, 9.6, -4.9], [0.8, 10.8, -3.4], beak, beak); m.box('head', [-0.5, 9.2, -4.4], [0.5, 9.7, -3.4], beak, beak)
    eyes(m, k, 'eyes', [0, 11.2, -3.45], 5.0, 1.9, (40, 20, 10), 'round', 0.6, 0.26, 0.86, parent='head')
    for i, a in enumerate((-25, 0, 25)):   # flame crest
        hang_up(m, 'head', [a / 25 * 0.9, 12.6, 0.2 + abs(a) / 25 * 0.6], 4.5 - abs(a) / 25, 2.4, a, fth)
    for s, n in ((-1, 'l'), (1, 'r')):
        wb = m.bone('wing_' + n, [s * 3.1, 7.8, 0.3], 'body')
        for i in range(4):
            R = [s * 3.1, 7.8 - i * 0.6, 0.3 + i * 0.8]
            hang_side(m, wb, R, 5.5 - i * 0.6, 2.4, s, 15 + i * 12, fth)
    m.bone('tail', [0, 4.0, 3.2], 'body')
    for i, a in enumerate((-22, 0, 22)):
        hang_back(m, 'tail', [a / 22 * 0.8, 4.2, 3.2], 9.5 - abs(a) / 22 * 2, 2.6, a, tl)
    sft = k.soft('aura', P.soft(48, 48, (255, 150, 40), peak=80))
    m.plate('body', [-8, -1, 3.6], [8, 15, 3.7], sft)
    fxo = particles(m, k, (255, 170, 50), 8, ((-4, 4), (2, 8), (0, 6)), (4, 7), 0.5)
    L = 4.0
    def build(c):
        fl = 600 if c in ('fly', 'walk', 'run') else 360
        amp = 35 if c in ('fly', 'walk', 'run') else 18
        tr = {'eyes': {'scale': blink_keys(L)},
              'wing_l': {'rotation': [(0, 0, f'math.sin(query.anim_time*{fl})*10', f'-20-math.sin(query.anim_time*{fl})*{amp}')]},
              'wing_r': {'rotation': [(0, 0, f'-math.sin(query.anim_time*{fl})*10', f'20+math.sin(query.anim_time*{fl})*{amp}')]},
              'tail': {'rotation': [(0, 'math.sin(query.anim_time*150)*8', 'math.sin(query.anim_time*90)*10', 0)]},
              'head': {'rotation': [(0, 'math.sin(query.anim_time*60)*5', 'math.sin(query.anim_time*40)*12', 0)]},
              'body': {'position': [(0, 0, 'math.sin(query.anim_time*180)*0.8', 0)]}}
        if c == 'special':   # flame burst: a loop-the-loop
            tr['body'] = {'rotation': [(0, 0, 0, 0), (1.0, -360, 0, 0), (L, -360, 0, 0)], 'position': [(0, 0, 0, 0), (0.5, 0, 3, -2), (1.0, 0, 0, 0), (L, 0, 0, 0)]}
        return tr
    clips(m, build, L, fxo, names=('idle', 'walk', 'run', 'fly', 'special'))
    return m

def hang_up(m, bone, R, L, w, ang, spr):
    """A feather standing UP from R (tilted by ang around Z)."""
    m.plate(bone, [R[0] - w / 2, R[1], R[2] - 0.05], [R[0] + w / 2, R[1] + L, R[2] + 0.05], flipv(spr[0]), origin=list(R), rotation=[0, 0, ang])
    if spr[1] is not None: m.plate(bone, [R[0] - w / 2, R[1], R[2] - 0.09], [R[0] + w / 2, R[1] + L, R[2] + 0.09], flipv(spr[1]), origin=list(R), rotation=[0, 0, ang])

def hang_back(m, bone, R, L, w, ang, spr):
    """A feather streaming backwards (+Z) from R, lying in a vertical plane, fanned by ang."""
    m.plate(bone, [R[0] - w / 2, R[1] - L, R[2] - 0.05], [R[0] + w / 2, R[1], R[2] + 0.05], spr[0], origin=list(R), rotation=[-62, ang, 0])
    if spr[1] is not None: m.plate(bone, [R[0] - w / 2, R[1] - L, R[2] - 0.09], [R[0] + w / 2, R[1], R[2] + 0.09], spr[1], origin=list(R), rotation=[-62, ang, 0])

def hang_side(m, bone, R, L, w, s, ang, spr):
    """A wing feather pointing outwards/down on side s."""
    m.plate(bone, [R[0] - w / 2, R[1] - L, R[2] - 0.05], [R[0] + w / 2, R[1], R[2] + 0.05], spr[0] if s > 0 else spr[0].mirrored(), origin=list(R), rotation=[0, 0, s * ang])
    if spr[1] is not None: m.plate(bone, [R[0] - w / 2, R[1] - L, R[2] - 0.09], [R[0] + w / 2, R[1], R[2] + 0.09], spr[1] if s > 0 else spr[1].mirrored(), origin=list(R), rotation=[0, 0, s * ang])

def flipv(uv):
    from bb import UV
    return UV((uv[0], uv[3], uv[2], uv[1]), uv.tex)

# ================================================================== DRAGONS (float)
def dragon(name, body, belly, wing, horn, glow, iris, fx='sparks'):
    m = BB(name, Atlas(256, 256)); k = Kit(m)
    bd = k.main('body', P.facet(8, 8, P.shade(body, 1.15), P.shade(body, 0.8))); bdd = k.main('bodyd', P.facet(8, 8, body, P.shade(body, 0.6)))
    bl = k.main('belly', P.facet(8, 8, P.shade(belly, 1.1), P.shade(belly, 0.85))); hn = k.main('horn', P.facet(4, 8, P.shade(horn, 1.1), P.shade(horn, 0.7)))
    gl = k.glow('glow', P.facet(4, 4, P.mixc(glow, (255, 255, 255), 0.4), glow))
    m.bone('body', [0, 6, 0])
    m.box('body', [-2.6, 3.0, -2.6], [2.6, 7.6, 3.2], bd, bdd, uv_top=bd)
    for i in range(4):   # belly plates
        m.box('body', [-1.8, 3.3 + i * 1.05, -2.9], [1.8, 4.2 + i * 1.05, -2.55], bl, bl)
    for i in range(4):   # back spikes, glowing
        z = -1.6 + i * 1.4
        m.box('body', [-0.35, 7.6, z - 0.35], [0.35, 8.9 - i * 0.15, z + 0.35], gl if i % 2 == 0 else hn, hn, origin=[0, 7.6, z], rotation=[-20, 45, 0])
    legs = []
    for s in (-1, 1):
        for zz, nm in ((-1.4, 'f'), (2.0, 'b')):
            lb = m.bone('leg_%s%s' % (nm, 'r' if s > 0 else 'l'), [s * 1.8, 3.2, zz], 'body'); legs.append(lb)
            m.box(lb, [s * 1.8 - 0.8, 0.6, zz - 0.8], [s * 1.8 + 0.8, 3.4, zz + 0.8], bd, bdd)
            m.box(lb, [s * 1.8 - 0.9, 0.0, zz - 1.2], [s * 1.8 + 0.9, 0.7, zz + 0.6], bdd, bdd)
    m.bone('head', [0, 7.4, -1.6], 'body')
    face = k.main('face', P.facet(8, 8, P.shade(body, 1.2), body))
    cube6(m, 'head', [-2.7, 7.0, -5.2], [2.7, 11.6, -0.6], face, bdd, top=bd)
    cube6(m, 'head', [-1.7, 7.2, -7.4], [1.7, 9.4, -5.2], bd, bdd, top=bd)        # snout
    m.box('head', [-1.75, 7.1, -7.45], [1.75, 7.8, -5.1], bl, bl)                 # jaw
    for s in (-1, 1): m.box('head', [s * 0.9 - 0.3, 8.7, -7.5], [s * 0.9 + 0.3, 9.1, -7.38], k.main('nostril', P.solid((20, 10, 10))), k.main('nostril', P.solid((20, 10, 10))))
    eyes(m, k, 'eyes', [0, 9.9, -5.25], 5.0, 2.0, iris, 'sharp', 0.6, 0.3, 0.86, parent='head')
    for s in (-1, 1):   # swept-back horns, two segments
        a = [s * 1.6, 11.2, -2.0]
        m.box('head', [a[0] - 0.45, a[1], a[2] - 0.45], [a[0] + 0.45, a[1] + 2.6, a[2] + 0.45], hn, hn, origin=list(a), rotation=[60, 0, -s * 15])
        b = [s * 1.95, 12.3, 0.2]
        m.box('head', [b[0] - 0.3, b[1], b[2] - 0.3], [b[0] + 0.3, b[1] + 1.9, b[2] + 0.3], gl, hn, origin=list(b), rotation=[95, 0, -s * 15])
    # membrane wings
    poly = [(0, 0), (3.5, 3.2), (7.5, 4.0), (9.0, 1.5), (7.2, 0.6), (8.0, -1.8), (5.2, -1.4), (5.0, -3.4), (2.2, -1.8)]
    veins = [((0, 0), (7.5, 4.0)), ((0, 0), (8.0, -1.8)), ((0, 0), (5.0, -3.4))]
    mm, gg, fr = P.membrane(poly, veins, 5, wing, P.shade(wing, 0.5), P.shade(wing, 0.6), glow_vein=glow, seed=name)
    uw = m.atlas.add(mm); ug = m.glow_atlas().add(gg) if gg is not None else None
    wbones = []
    for s, n in ((-1, 'l'), (1, 'r')):
        wb = m.bone('wing_' + n, [s * 2.2, 7.4, 0.4], 'body'); wbones.append(wb)
        x0, y0, x1, y1 = fr
        off = (s * 2.2, 7.4, 0.4)
        fa = [off[0] + (x0 if s > 0 else -x1), off[1] + y0, off[2] - 0.05]; fb = [off[0] + (x1 if s > 0 else -x0), off[1] + y1, off[2] + 0.05]
        uvw = uw if s > 0 else uw.mirrored()
        m.plate(wb, fa, fb, uvw, origin=list(off), rotation=[0, -s * 30, 0])
        if ug is not None: m.plate(wb, [fa[0], fa[1], fa[2] - 0.04], [fb[0], fb[1], fb[2] + 0.04], ug if s > 0 else ug.mirrored(), origin=list(off), rotation=[0, -s * 30, 0])
        m.box(wb, [s * 2.2 - 0.4 if s > 0 else s * 2.2 - 0.4, 7.0, 0.0], [s * 2.2 + 0.4, 7.8, 0.8], hn, hn)
    # tail: 4 segments + glowing tip
    parent = 'body'; z = 3.2; tails = []
    for i, w in enumerate((1.8, 1.4, 1.0, 0.7)):
        b = m.bone('tail%d' % i, [0, 4.4, z], parent); tails.append(b)
        m.box(b, [-w / 2, 4.4 - w / 2, z], [w / 2, 4.4 + w / 2, z + 2.2], bd, bdd)
        parent = b; z += 2.0
    m.box(tails[-1], [-0.9, 4.0, z], [0.9, 4.8, z + 1.6], gl, gl, origin=[0, 4.4, z], rotation=[0, 45, 0])
    sft = k.soft('aura', P.soft(48, 48, glow, peak=60))
    m.flat('body', [-7, 0.05, -7], [7, 0.07, 7], sft)
    fxo = particles(m, k, glow, 7, ((-4, 4), (5, 10), (-4, 3)), (2, 5), 0.5) if fx else None
    L = 4.0
    def build(c):
        fast = c in ('fly', 'walk', 'run')
        fl, amp = (520, 38) if fast else (220, 22)
        tr = {'eyes': {'scale': blink_keys(L)},
              'wing_l': {'rotation': [(0, 0, 0, f'-15-math.sin(query.anim_time*{fl})*{amp}')]},
              'wing_r': {'rotation': [(0, 0, 0, f'15+math.sin(query.anim_time*{fl})*{amp}')]},
              'head': {'rotation': [(0, 'math.sin(query.anim_time*50)*5', 'math.sin(query.anim_time*35)*12', 0)]},
              'body': {'position': [(0, 0, f'math.sin(query.anim_time*{fl / 2})*0.8', 0)]}}
        for i, b in enumerate(tails): tr[b] = {'rotation': [(0, f'math.sin(query.anim_time*120-{i * 40})*6', f'math.sin(query.anim_time*90-{i * 45})*14', 0)]}
        if fast:
            for i, lb in enumerate(legs): tr[lb] = {'rotation': [(0, 25, 0, 0)]}
        if c == 'special':   # roar: head up, wings wide
            tr['head'] = {'rotation': [(0, 0, 0, 0), (0.3, -30, 0, 0), (1.3, -30, 0, 0), (1.6, 0, 0, 0), (L, 0, 0, 0)]}
            tr['wing_l'] = {'rotation': [(0, 0, 0, -15), (0.3, 0, 0, -55), (1.3, 0, 0, -55), (1.6, 0, 0, -15), (L, 0, 0, -15)]}
            tr['wing_r'] = {'rotation': [(0, 0, 0, 15), (0.3, 0, 0, 55), (1.3, 0, 0, 55), (1.6, 0, 0, 15), (L, 0, 0, 15)]}
        if c == 'special2':  # tail swish spin
            tr['body'] = {'rotation': [(0, 0, 0, 0), (1.0, 0, 360, 0), (L, 0, 360, 0)]}
        return tr
    clips(m, build, L, fxo, names=('idle', 'walk', 'run', 'fly', 'special', 'special2'))
    return m

# ================================================================== SHADOW WISP (floats)
def wisp(name, core=(30, 10, 45), flame=(170, 80, 255), eye=(255, 240, 255)):
    m = BB(name, Atlas(256, 128)); k = Kit(m)
    cd = k.main('core', P.facet(8, 8, P.shade(core, 1.6), core)); fl = k.glow('flame', P.facet(4, 8, P.mixc(flame, (255, 255, 255), 0.5), flame))
    fd = k.main('flamed', P.facet(4, 8, flame, P.shade(flame, 0.5)))
    m.bone('body', [0, 8, 0])
    # hooded ghost: stacked, tapering layers with a flame crown
    for r, y0, y1 in [(3.6, 6.0, 9.5), (3.2, 9.5, 11.0), (2.4, 11.0, 12.2), (1.4, 12.2, 13.2)]:
        m.box('body', [-r, y0, -r], [r, y1, r], cd, cd)
    m.box('body', [-3.75, 9.0, -3.75], [3.75, 9.6, 3.75], fd, fd)                       # hood rim
    eu = k.glow('eyes', P.eyes_sprite(32, 20, eye, 'sharp', 0.55, 0.34, 0.86, pupil=(120, 50, 200)))
    m.bone('eyes', [0, 8.3, -3.65], 'body'); m.plate('eyes', [-3.2, 7.3, -3.67], [3.2, 9.3, -3.63], eu, back=eu)
    for i in range(6):   # flame crown
        a = 2 * math.pi * i / 6; x, z = math.cos(a) * 1.6, math.sin(a) * 1.6
        m.box('body', [x - 0.5, 13.0, z - 0.5], [x + 0.5, 14.4 + (i % 2) * 1.0, z + 0.5], fl, fl, origin=[x, 13, z], rotation=[0, 45, 0])
    # wispy tail: segments trailing down/back that sway
    parent = 'body'; y = 6.0; tl = []
    for i, r in enumerate((3.0, 2.3, 1.6, 1.0, 0.5)):
        b = m.bone('wt%d' % i, [0, y, 0.4 * i], parent); tl.append(b)
        m.box(b, [-r, y - 1.5, -r + 0.4 * i], [r, y, r + 0.4 * i], cd if i < 3 else fl, cd if i < 3 else fl)
        parent = b; y -= 1.4
    for s, n in ((-1, 'l'), (1, 'r')):   # little arms
        ab = m.bone('arm_' + n, [s * 3.6, 9.0, 0], 'body')
        m.box(ab, [s * 3.6 - 0.6, 7.0, -0.6], [s * 3.6 + 0.6, 9.0, 0.6], cd, cd); m.box(ab, [s * 3.6 - 0.4, 6.4, -0.4], [s * 3.6 + 0.4, 7.0, 0.4], fl, fl)
    m.bone('souls', [0, 9, 0])
    for i in range(3):
        a = 2 * math.pi * i / 3; x, z = math.cos(a) * 6.0, math.sin(a) * 6.0
        m.box('souls', [x - 0.7, 8.3, z - 0.7], [x + 0.7, 9.7, z + 0.7], fl, fl, origin=[x, 9, z], rotation=[45, 45, 0])
        m.plate('souls', [x - 1.8, 7.2, z], [x + 1.8, 10.8, z + 0.02], k.soft('ss', P.soft(24, 24, flame, peak=120)))
    m.plate('body', [-7, 2, 3.8], [7, 15, 3.9], k.soft('aura', P.soft(48, 48, flame, peak=60)))
    fxo = particles(m, k, flame, 8, ((-4, 4), (4, 10), (-3, 3)), (3, 6), 0.5)
    L = 4.0
    def build(c):
        tr = {'eyes': {'scale': blink_keys(L, 0.7)},
              'body': {'position': [(0, 0, 'math.sin(query.anim_time*120)*1.0', 0)], 'rotation': [(0, 0, 'math.sin(query.anim_time*40)*10', 'math.sin(query.anim_time*80)*3')]},
              'souls': {'rotation': [(0, 0, 'query.anim_time*80', 0)], 'position': [(0, 0, 'math.sin(query.anim_time*160)*0.8', 0)]},
              'arm_l': {'rotation': [(0, 0, 0, '-10-math.sin(query.anim_time*150)*15')]}, 'arm_r': {'rotation': [(0, 0, 0, '10+math.sin(query.anim_time*150+60)*15')]}}
        for i, b in enumerate(tl): tr[b] = {'rotation': [(0, f'math.sin(query.anim_time*160-{i * 45})*{8 + i * 3}', 0, f'math.sin(query.anim_time*110-{i * 50})*{6 + i * 3}')]}
        if c == 'special':   # vanish-and-return: shrink, spin, pop back
            tr['body'] = {'scale': [(0, 1, 1, 1), (0.4, 0.2, 1.6, 0.2), (0.8, 1, 1, 1), (L, 1, 1, 1)], 'rotation': [(0, 0, 0, 0), (0.8, 0, 720, 0), (L, 0, 720, 0)]}
        return tr
    clips(m, build, L, fxo, names=('idle', 'walk', 'run', 'fly', 'special'))
    return m
