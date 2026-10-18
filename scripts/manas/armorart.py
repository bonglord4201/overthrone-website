# Painted armour faces for the v6 sets (art.py). Each function paints one face at D px per unit, top row = top of the
# face (the builder flips uvs for the Y-down armour frame). Palette keys: dark (base plating), plate (light plates),
# gold (trim), gem (glow gems), accent (secondary colour), energy (glow lines).
import math
from art import Canvas, ramp, sh, lit, mix, C, dilate

def chest_front(w, h, p):
    c = Canvas(w, h, bg=p['dark'])
    cx = w / 2
    # light breast plates (two, split by a gold spine) with bevel
    for s in (-1, 1):
        pts = [(cx + s * 1.5, h * 0.12), (cx + s * w * 0.42, h * 0.08), (cx + s * w * 0.44, h * 0.42), (cx + s * w * 0.18, h * 0.6), (cx + s * 1.5, h * 0.62)]
        c.fill(c.m_poly(pts), p['plate'], grad=0.25, bevel=True, outline=True)
        c.engrave([(cx + s * w * 0.12, h * 0.2), (cx + s * w * 0.36, h * 0.18)], p['plate'])
        c.engrave([(cx + s * w * 0.1, h * 0.32), (cx + s * w * 0.38, h * 0.3)], p['plate'])
    # gold sash bands from the shoulders down to the belt
    for s in (-1, 1):
        c.line([(cx + s * w * 0.47, h * 0.05), (cx + s * w * 0.3, h * 0.66)], p['gold'], 2.2)
        c.scroll(cx + s * w * 0.3, h * 0.5, 2.6, p['gold'], flip=s < 0)
    c.line([(cx, h * 0.1), (cx, h * 0.64)], p['gold'], 2.0)                      # gold spine
    c.gem(cx, h * 0.24, 4.2, p['gem'], 'diamond', setting=p['gold'])             # collar medallion
    for s in (-1, 1): c.gem(cx + s * w * 0.3, h * 0.13, 1.6, p['gem'], 'round', setting=p['gold'])
    # belt
    c.metal(c.m_rect(1, h * 0.66, w - 1, h * 0.74), p['gold'])
    c.gem(cx, h * 0.70, 2.4, p['gem'], 'diamond', setting=p['gold'])
    # tabard below the belt with gold edging and a hanging emblem
    tb = c.m_poly([(cx - w * 0.2, h * 0.75), (cx + w * 0.2, h * 0.75), (cx + w * 0.17, h * 0.99), (cx - w * 0.17, h * 0.99)])
    c.fill(tb, p['plate'], grad=0.2, bevel=True, outline=True)
    for s in (-1, 1): c.line([(cx + s * w * 0.2, h * 0.75), (cx + s * w * 0.17, h * 0.99)], p['gold'], 1.2)
    c.line([(cx - w * 0.08, h * 0.86), (cx, h * 0.93), (cx + w * 0.08, h * 0.86)], p['gold'], 1.2)
    if p.get('energy'):
        for s in (-1, 1): c.fill(c.m_line([(cx + s * w * 0.12, h * 0.4), (cx + s * w * 0.12, h * 0.6)], 1.0), p['energy'], glow=True)
    c.noise(0.04)
    return c.images()


# ------------------------------------------------------------------ motif helpers
def motif_bg(c, p, m=None):
    """Background pattern of the dark plating per set motif."""
    import numpy as np
    mo = p.get('motif', 'royal')
    if m is None: m = c.a.copy()
    if mo == 'scale':
        Y, X = c.Y, c.X
        row = (Y // 3).astype(int); off = (row % 2) * 2
        edge = (((X + off) % 4) < 1) | ((Y % 3) < 0.9)
        c.rgb[m & edge] = c.rgb[m & edge] * 0.7
    elif mo == 'bone':
        for y in range(3, c.h - 2, 4): c.engrave([(2, y), (c.w - 2, y)], p['dark'], 0.75)
    elif mo == 'ice':
        for i in range(0, c.w + c.h, 6): c.engrave([(i, 0), (i - c.h * 0.6, c.h)], p['dark'], 0.85)
    elif mo == 'leaf':
        for x in range(2, c.w, 5): c.engrave([(x, 0), (x + 2, c.h)], p['dark'], 0.82)
    elif mo == 'demon':
        for i in range(3): c.engrave([(c.w * (0.2 + i * 0.3), 0), (c.w * (0.1 + i * 0.3), c.h * 0.5), (c.w * (0.25 + i * 0.3), c.h)], p['dark'], 0.7)

def chest(w, h, p, back=False):
    c = Canvas(w, h, bg=p['dark']); motif_bg(c, p)
    cx = w / 2; mo = p.get('motif', 'royal')
    if mo in ('royal', 'feather', 'ice', 'leaf'):
        for s in (-1, 1):
            pts = [(cx + s * 1.5, h * 0.12), (cx + s * w * 0.42, h * 0.08), (cx + s * w * 0.44, h * 0.42), (cx + s * w * 0.18, h * 0.6), (cx + s * 1.5, h * 0.62)]
            c.fill(c.m_poly(pts), p['plate'], grad=0.25, bevel=True, outline=True)
            for k in (0.2, 0.32, 0.44): c.engrave([(cx + s * w * 0.1, h * k), (cx + s * w * 0.37, h * (k - 0.02))], p['plate'], 0.82)
    elif mo in ('demon', 'bone'):
        pts = [(cx - w * 0.44, h * 0.06), (cx + w * 0.44, h * 0.06), (cx + w * 0.3, h * 0.36), (cx, h * 0.62), (cx - w * 0.3, h * 0.36)]
        c.fill(c.m_poly(pts), p['plate'], grad=0.25, bevel=True, outline=True)
        if mo == 'bone':
            for k in range(4): c.line([(cx - w * 0.32 + k * 0.02 * w, h * (0.16 + k * 0.1)), (cx - 1.5, h * (0.2 + k * 0.1))], p.get('accent', p['plate']), 1.4, metal=False)
            for k in range(4): c.line([(cx + w * 0.32 - k * 0.02 * w, h * (0.16 + k * 0.1)), (cx + 1.5, h * (0.2 + k * 0.1))], p.get('accent', p['plate']), 1.4, metal=False)
        else:
            for s in (-1, 1): c.engrave([(cx + s * w * 0.36, h * 0.12), (cx + s * 2, h * 0.5)], p['plate'], 0.7)
    elif mo == 'scale':
        pts = [(cx - w * 0.4, h * 0.08), (cx + w * 0.4, h * 0.08), (cx + w * 0.36, h * 0.5), (cx, h * 0.62), (cx - w * 0.36, h * 0.5)]
        m = c.m_poly(pts); c.fill(m, p['plate'], grad=0.25, bevel=True, outline=True)
        Y, X = c.Y, c.X; row = (Y // 3).astype(int); off = (row % 2) * 2.5
        c.rgb[m & ((((X + off) % 5) < 1) | ((Y % 3) < 0.9))] *= 0.72
    elif mo == 'sun':
        pts = [(cx - w * 0.42, h * 0.07), (cx + w * 0.42, h * 0.07), (cx + w * 0.34, h * 0.5), (cx, h * 0.63), (cx - w * 0.34, h * 0.5)]
        c.fill(c.m_poly(pts), p['plate'], grad=0.2, bevel=True, outline=True)
        for k in range(9):
            a = math.radians(-80 + k * 20); c.line([(cx + math.sin(a) * 4, h * 0.3 - math.cos(a) * 4), (cx + math.sin(a) * w * 0.33, h * 0.3 - math.cos(a) * h * 0.2)], p['gold'], 1.2)
    # gold framing
    for s in (-1, 1):
        c.line([(cx + s * w * 0.47, h * 0.04), (cx + s * w * 0.3, h * 0.66)], p['gold'], 2.2)
        if not back: c.scroll(cx + s * w * 0.31, h * 0.5, 2.6, p['gold'], flip=s < 0)
    c.line([(cx, h * 0.1), (cx, h * 0.64)], p['gold'], 2.0)
    if not back:
        c.gem(cx, h * 0.25, 4.2, p['gem'], 'diamond', setting=p['gold'])
        for s in (-1, 1): c.gem(cx + s * w * 0.3, h * 0.13, 1.6, p['gem'], 'round', setting=p['gold'])
    else:
        for s in (-1, 1): c.scroll(cx + s * w * 0.2, h * 0.3, 3.0, p['gold'], flip=s > 0)
        c.gem(cx, h * 0.18, 2.4, p['gem'], 'diamond', setting=p['gold'])
    c.metal(c.m_rect(1, h * 0.66, w - 1, h * 0.74), p['gold'])
    c.gem(cx, h * 0.70, 2.4, p['gem'], 'diamond', setting=p['gold'])
    tb = c.m_poly([(cx - w * 0.2, h * 0.75), (cx + w * 0.2, h * 0.75), (cx + w * 0.17, h * 0.99), (cx - w * 0.17, h * 0.99)])
    c.fill(tb, p.get('cloth', p['plate']), grad=0.2, bevel=True, outline=True)
    for s in (-1, 1): c.line([(cx + s * w * 0.2, h * 0.75), (cx + s * w * 0.17, h * 0.99)], p['gold'], 1.2)
    c.line([(cx - w * 0.08, h * 0.86), (cx, h * 0.93), (cx + w * 0.08, h * 0.86)], p['gold'], 1.2)
    if p.get('energy'):
        for s in (-1, 1): c.fill(c.m_line([(cx + s * w * 0.12, h * 0.4), (cx + s * w * 0.12, h * 0.6)], 1.0), p['energy'], glow=True)
    c.noise(0.04); return c.images()

def side(w, h, p):
    """Torso side: dark plating, a light rib plate, gold edges."""
    c = Canvas(w, h, bg=p['dark']); motif_bg(c, p)
    c.fill(c.m_rect(w * 0.18, h * 0.08, w * 0.82, h * 0.6), p['plate'], grad=0.25, bevel=True, outline=True)
    c.metal(c.m_rect(0, h * 0.66, w, h * 0.74), p['gold'])
    for y in (0.24, 0.4): c.engrave([(w * 0.25, h * y), (w * 0.75, h * y)], p['plate'])
    c.noise(0.04); return c.images()

def plate(w, h, p, col=None, gem=True, scroll=False, rim=True):
    """A bevelled armour plate with a gold rim, optional centre gem and filigree."""
    c = Canvas(w, h)
    col = col or p['plate']
    c.fill(c.m_rect(0, 0, w, h), col, grad=0.3, bevel=True)
    if rim and w >= 5 and h >= 5:
        m = c.m_rect(0, 0, w, h) & ~c.m_rect(1.2, 1.2, w - 1.2, h - 1.2); c.metal(m, p['gold'], outline=False)
    if scroll and w >= 12 and h >= 10:
        c.scroll(w * 0.3, h * 0.5, min(w, h) * 0.18, p['gold']); c.scroll(w * 0.7, h * 0.5, min(w, h) * 0.18, p['gold'], flip=True)
    if gem and w >= 6 and h >= 6:
        c.gem(w / 2, h / 2, min(w, h) * 0.22, p['gem'], 'diamond', setting=p['gold'])
    c.noise(0.035); return c.images()

def gold(w, h, p):
    c = Canvas(w, h); c.metal(c.m_rect(0, 0, w, h), p['gold'], outline=False)
    if w >= 8:
        for x in range(3, w - 2, 5): c.engrave([(x, 1), (x, h - 1)], p['gold'], 0.82)
    return c.images()

def darkface(w, h, p):
    c = Canvas(w, h, bg=p['dark']); motif_bg(c, p); c.noise(0.05); return c.images()

def arm(w, h, p, face='out'):
    """Arm shell face, top -> bottom: shoulder (under the pauldron), bicep plate, elbow band, vambrace, gauntlet."""
    c = Canvas(w, h, bg=p['dark']); motif_bg(c, p)
    c.fill(c.m_rect(w * 0.12, h * 0.2, w * 0.88, h * 0.44), p['plate'], grad=0.25, bevel=True, outline=True)
    c.metal(c.m_rect(0, h * 0.47, w, h * 0.52), p['gold'])
    c.fill(c.m_rect(w * 0.08, h * 0.58, w * 0.92, h * 0.88), p['plate'] if face in ('out', 'front') else p['dark'], grad=0.25, bevel=True, outline=True)
    c.metal(c.m_rect(0, h * 0.56, w, h * 0.6), p['gold']); c.metal(c.m_rect(0, h * 0.86, w, h * 0.9), p['gold'])
    if face == 'out':
        c.gem(w / 2, h * 0.73, min(w, h) * 0.2, p['gem'], 'diamond', setting=p['gold'])
        c.scroll(w * 0.5, h * 0.32, 2.2, p['gold'])
    elif p.get('energy') and face == 'front':
        c.fill(c.m_line([(w / 2, h * 0.62), (w / 2, h * 0.84)], 1.0), p['energy'], glow=True)
    c.fill(c.m_rect(0, h * 0.9, w, h), sh(p['dark'], 0.8))
    c.metal(c.m_rect(w * 0.15, h * 0.93, w * 0.85, h * 0.97), p['gold'])
    c.noise(0.04); return c.images()

def leg(w, h, p, face='front'):
    """Leg shell face, top -> bottom: thigh plate, knee band, greave, boot cuff, boot with gem, sole."""
    c = Canvas(w, h, bg=p['dark']); motif_bg(c, p)
    c.fill(c.m_rect(w * 0.1, h * 0.02, w * 0.9, h * 0.3), p['plate'] if face != 'back' else p['dark'], grad=0.25, bevel=True, outline=True)
    c.metal(c.m_rect(0, h * 0.33, w, h * 0.38), p['gold'])
    if face == 'front':
        c.fill(c.m_poly([(w * 0.25, h * 0.42), (w * 0.75, h * 0.42), (w * 0.62, h * 0.7), (w * 0.38, h * 0.7)]), p['plate'], grad=0.25, bevel=True, outline=True)
        c.line([(w * 0.5, h * 0.44), (w * 0.5, h * 0.68)], p['gold'], 1.2)
    c.metal(c.m_rect(0, h * 0.72, w, h * 0.77), p['gold'])
    c.fill(c.m_rect(0, h * 0.77, w, h * 0.97), sh(p['dark'], 0.85), bevel=True)
    if face == 'front': c.gem(w / 2, h * 0.86, min(w, h) * 0.17, p['gem'], 'diamond', setting=p['gold'])
    elif face in ('out', 'in'): c.scroll(w / 2, h * 0.86, 2.0, p['gold'])
    c.metal(c.m_rect(0, h * 0.96, w, h), p['gold'])
    c.noise(0.04); return c.images()

# ------------------------------------------------------------------ helmet faces (Y-up frame: top row = top)
def helm_side(w, h, p):
    """Helmet side/back: dark shell, light plate with gold rim and a filigree curl, gold brow line."""
    c = Canvas(w, h, bg=p['dark']); motif_bg(c, p)
    c.fill(c.m_rect(w * 0.12, h * 0.28, w * 0.88, h * 0.9), p['plate'], grad=0.25, bevel=True, outline=True)
    c.scroll(w * 0.5, h * 0.58, min(w, h) * 0.16, p['gold'])
    c.metal(c.m_rect(0, h * 0.12, w, h * 0.24), p['gold'])
    c.noise(0.04); return c.images()

def helm_brow(w, h, p):
    c = Canvas(w, h); c.metal(c.m_rect(0, 0, w, h), p['gold'], outline=False)
    for s in (-1, 1): c.scroll(w / 2 + s * w * 0.28, h / 2, min(h * 0.38, 2.4), p['gold'], flip=s < 0)
    c.gem(w / 2, h / 2, h * 0.36, p['gem'], 'diamond', setting=p['gold'])
    return c.images()

# ------------------------------------------------------------------ weapon faces
def blade_face(w, h, p):
    """Blade (top = tip): bright edges, mid steel, dark central ridge with a glowing fuller."""
    c = Canvas(w, h)
    m = c.m_rect(0, 0, w, h); c.fill(m, p['blade'], grad=0.3)
    import numpy as np
    u = c.X / w
    c.rgb[(u < 0.18) | (u > 0.82)] = lit(p['blade'], 0.45)
    c.rgb[(np.abs(u - 0.5) < 0.12)] = sh(p['blade'], 0.6)
    if p.get('edge') is not None:
        g = (np.abs(u - 0.5) < 0.08) & (c.Y > h * 0.08) & (c.Y < h * 0.9); c.glow_mask(g, p['edge']); c.rgb[g] = C(p['edge'])
    c.a[:] = True; return c.images()

def grip_face(w, h, p):
    """Wrapped grip: alternating dark/light bands with gold rings (like the reference's striped hilts)."""
    c = Canvas(w, h)
    for y in range(h):
        col = p['grip'] if (y // 2) % 2 == 0 else lit(p['grip'], 0.5)
        c.fill(c.m_rect(0, y, w, y + 1), col)
    c.metal(c.m_rect(0, 0, w, 1.2), p['gold'], outline=False); c.metal(c.m_rect(0, h - 1.2, w, h), p['gold'], outline=False)
    return c.images()
