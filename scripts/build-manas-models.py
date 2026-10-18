# Builds OVERTHRONE model cosmetics for Manas Cosmetics (v2): .bbmodel files (Blockbench projects, open/edit them in
# Blockbench) + their .json sidecars. Layout from the mod's own README (manas_cosmetics 1.0.6):
#   config/manas_cosmetics/models/<slot>/<name>.bbmodel     config/manas_cosmetics/cosmetics/<name>.json
# Verified from the mod's code: the parser reads embedded PNG textures (with transparency), cubes with free rotation,
# groups (bones) and Blockbench animations; the renderer plays the animation named "idle" (also walk/run/fly/...).
# v2: high-resolution shaded textures, layered plates for depth, real 3D bones/gems/segments, and "idle" animations
# (wings flap, halos spin and bob, sigils turn, crystals orbit).
# Position/size can be tuned in game: /manas_cosmetics edit <id>.
#   python3 scripts/build-manas-models.py      (needs Pillow)
import base64, io, json, math, os, random, shutil, uuid
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..', 'minecraft', 'manas_cosmetics')
PREVIEW = os.path.join(ROOT, 'previews')
random.seed(7)

def uid(): return str(uuid.uuid4())
def png_b64(img):
    b = io.BytesIO(); img.save(b, 'PNG'); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
def lerp(a, b, t): t = max(0.0, min(1.0, t)); return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(len(a)))
def shade(c, k): return tuple(max(0, min(255, int(v * k))) for v in c[:3])

# ================================================================== textures
def bat_wing(dark, mid, bone, glow, size=128):
    """Bat/demon wing for the RIGHT side (shoulder at the left edge). Shaded membrane, veins, scalloped glowing rim."""
    S = size * 4
    mask = Image.new('L', (S, S), 0); dm = ImageDraw.Draw(mask)
    sh, el, tip = (S * 0.03, S * 0.62), (S * 0.33, S * 0.18), (S * 0.985, S * 0.02)
    fingers = [(S * 0.975, S * 0.38), (S * 0.82, S * 0.68), (S * 0.58, S * 0.88), (S * 0.28, S * 0.95)]
    pts = [sh, el, tip]; prev = tip
    for f in fingers:
        mx, my = (prev[0] + f[0]) / 2, (prev[1] + f[1]) / 2
        cx, cy = mx + (el[0] - mx) * 0.42, my + (el[1] - my) * 0.42
        for k in range(1, 16):
            t = k / 15
            pts.append(((1 - t) ** 2 * prev[0] + 2 * (1 - t) * t * cx + t * t * f[0], (1 - t) ** 2 * prev[1] + 2 * (1 - t) * t * cy + t * t * f[1]))
        prev = f
    pts.append((S * 0.02, S * 0.82))
    dm.polygon(pts, fill=255)
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0)); px = img.load(); mk = mask.load()
    for y in range(0, S):
        for x in range(0, S):
            if mk[x, y]:
                t = math.hypot(x - sh[0], y - sh[1]) / (S * 1.0)
                n = 0.9 + 0.2 * random.random() if (x // 6 + y // 6) % 3 == 0 else 1.0          # leathery grain
                c = shade(lerp(dark, mid, t * 1.15), n)
                px[x, y] = c + (240,)
    d = ImageDraw.Draw(img)
    w = max(4, S // 64)
    # veins between the fingers (thin, darker)
    for f in fingers:
        for k in (0.33, 0.66):
            a = (el[0] + (f[0] - el[0]) * k, el[1] + (f[1] - el[1]) * k)
            d.line([a, (a[0] + (f[0] - tip[0]) * 0.08, a[1] + S * 0.12)], fill=shade(dark, 0.7) + (255,), width=max(2, w // 2))
    # glowing scalloped rim
    d.line(pts[2:-1], fill=glow + (255,), width=w)
    d.line(pts[2:-1], fill=lerp(glow, (255, 255, 255), 0.5) + (255,), width=max(2, w // 3))
    # bones painted under the 3D bone cubes (fingers), with highlight
    for f in fingers:
        d.line([el, f], fill=bone + (255,), width=w)
        d.line([el, f], fill=lerp(bone, (255, 255, 255), 0.35) + (255,), width=max(2, w // 3))
    img = img.filter(ImageFilter.SMOOTH)
    return img.resize((size, size), Image.LANCZOS)

def feather_wing(base, tip_c, edge, size=128):
    """Angel/phoenix wing for the RIGHT side (shoulder at the left edge): the wing arm rises from the shoulder to the
    tip; feathers hang from it pointing down and outwards, longest at the tip. Three overlapping rows, shaded."""
    S = size * 4
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    def arm(t):   # point on the wing arm (shoulder -> elbow bump -> tip), t 0..1
        return (S * (0.04 + 0.90 * t), S * (0.55 - 0.48 * t - 0.10 * math.sin(math.pi * t)))
    rows = [(16, 0.62, 0.20, 1.00), (14, 0.42, 0.16, 0.85), (12, 0.24, 0.14, 0.70)]   # count, max length, width, darkness
    for ri, (n, maxlen, fw, dk) in enumerate(rows):
        for i in range(n):
            t = 0.04 + 0.94 * i / (n - 1)
            rx, ry = arm(t)
            L = S * maxlen * (0.45 + 0.55 * t)                       # longer towards the tip
            ang = math.radians(8 + 58 * t)                           # pointing down near the body, outwards at the tip
            tx, ty = rx + math.sin(ang) * L, ry + math.cos(ang) * L
            W = S * fw * 0.5 * (0.8 + 0.4 * t)
            nx, ny = math.cos(ang), -math.sin(ang)
            poly = [(rx - nx * W * 0.5, ry - ny * W * 0.5), (rx + nx * W * 0.5, ry + ny * W * 0.5),
                    (tx + nx * W * 0.45 - math.sin(ang) * W * 0.4, ty + ny * W * 0.45 - math.cos(ang) * W * 0.4),
                    (tx, ty), (tx - nx * W * 0.45 - math.sin(ang) * W * 0.4, ty - ny * W * 0.45 - math.cos(ang) * W * 0.4)]
            c = shade(lerp(base, tip_c, t * (0.4 + 0.6 * (2 - ri) / 2)), dk * (0.92 + 0.08 * random.random()))
            d.polygon(poly, fill=c + (255,))
            d.line([(rx, ry), (tx, ty)], fill=shade(c, 0.8) + (255,), width=max(2, S // 220))                  # quill
            d.line(poly[1:4], fill=lerp(c, edge, 0.7) + (255,), width=max(2, S // 260))                        # light edge
    # the wing arm itself (soft, on top)
    pts = [arm(k / 30) for k in range(31)]
    d.line(pts, fill=lerp(base, edge, 0.5) + (255,), width=S // 40)
    img = img.filter(ImageFilter.SMOOTH)
    return img.resize((size, size), Image.LANCZOS)

def rim_glow(src, glow, grow=2):
    """A soft glow version of a wing's outline (for a plate just behind it)."""
    a = src.split()[3].point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MaxFilter(grow * 2 + 1)).filter(ImageFilter.GaussianBlur(grow / 2))
    out = Image.new('RGBA', src.size, glow + (0,)); out.putalpha(a.point(lambda v: int(v * 0.35)))
    return out

def strip(colors, w=16):
    """A 1-pixel-tall colour strip (cube faces sample a pixel of it = shaded palette)."""
    img = Image.new('RGBA', (w, 1), (0, 0, 0, 0))
    for i in range(w): img.putpixel((i, 0), lerp(colors[0], colors[-1], i / (w - 1)) + (255,)) if len(colors) == 2 else None
    return img

def ring_texture(inner, outer, size=64, broken=False):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0)); px = img.load(); c = (size - 1) / 2
    for y in range(size):
        for x in range(size):
            r = math.hypot(x - c, y - c); a = math.atan2(y - c, x - c)
            if broken and (0.4 < a < 0.9 or -2.4 < a < -2.0): continue
            if size * 0.30 <= r <= size * 0.49:
                t = abs(r - size * 0.40) / (size * 0.09)
                al = int(255 * max(0, 1 - t ** 1.6))
                if al > 8: px[x, y] = lerp(inner, outer, t) + (al,)
    return img

def sigil_texture(col, size=128):
    """A glowing hexagram magic sigil (double circle, star, runes)."""
    S = size * 4
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(img); c = S / 2; w = S // 60
    for r in (0.47, 0.40):
        d.ellipse([c - S * r, c - S * r, c + S * r, c + S * r], outline=col + (255,), width=w)
    for k in range(2):
        p = [(c + math.cos(math.radians(90 + k * 60 + i * 120)) * S * 0.40, c - math.sin(math.radians(90 + k * 60 + i * 120)) * S * 0.40) for i in range(3)]
        d.polygon(p, outline=col + (255,)); d.line(p + [p[0]], fill=col + (255,), width=w)
    for i in range(24):   # rune ticks between the circles
        a = math.radians(i * 15); r0, r1 = S * 0.41, S * 0.46
        if i % 2: d.line([(c + math.cos(a) * r0, c + math.sin(a) * r0), (c + math.cos(a) * r1, c + math.sin(a) * r1)], fill=col + (255,), width=w)
        else: d.ellipse([c + math.cos(a) * S * 0.435 - w, c + math.sin(a) * S * 0.435 - w, c + math.cos(a) * S * 0.435 + w, c + math.sin(a) * S * 0.435 + w], fill=col + (255,))
    d.ellipse([c - S * 0.08, c - S * 0.08, c + S * 0.08, c + S * 0.08], outline=lerp(col, (255, 255, 255), 0.5) + (255,), width=w)
    glow = img.filter(ImageFilter.GaussianBlur(S / 90))
    out = Image.alpha_composite(glow, img)
    return out.resize((size, size), Image.LANCZOS)

# ================================================================== bbmodel writer
class Model:
    def __init__(self, name, tex):
        self.name, self.tex, self.elements, self.groups, self.anims = name, tex, [], {}, []
    def group(self, name, origin):
        if name not in self.groups:
            self.groups[name] = {'name': name, 'origin': list(origin), 'rotation': [0, 0, 0], 'color': 0, 'uuid': uid(), 'export': True,
                                 'mirror_uv': False, 'isOpen': True, 'locked': False, 'visibility': True, 'autouv': 0, 'children': []}
        return self.groups[name]
    def _el(self, group, name, frm, to, faces, origin=None, rotation=None):
        e = {'name': name, 'box_uv': False, 'rescale': False, 'locked': False, 'render_order': 'default', 'allow_mirror_modeling': True,
             'from': [round(v, 4) for v in frm], 'to': [round(v, 4) for v in to], 'autouv': 0, 'color': 0,
             'origin': [round(v, 4) for v in (origin or [(frm[i] + to[i]) / 2 for i in range(3)])],
             'faces': faces, 'type': 'cube', 'uuid': uid()}
        if rotation and any(rotation): e['rotation'] = [round(v, 3) for v in rotation]
        self.elements.append(e); self.groups[group]['children'].append(e['uuid']); return e
    def plate(self, group, frm, to, uv, origin=None, rotation=None, flip=False):
        """Zero-thickness vertical plate (z fixed) showing uv on both sides; flip mirrors the north face (see notes)."""
        u = list(uv); rev = [u[2], u[1], u[0], u[3]]
        return self._el(group, 'plate', frm, to, {'north': {'uv': rev if flip else u, 'texture': 0}, 'south': {'uv': u if flip else rev, 'texture': 0}}, origin, rotation)
    def flat(self, group, frm, to, uv, origin=None, rotation=None):
        return self._el(group, 'flat', frm, to, {'up': {'uv': list(uv), 'texture': 0}, 'down': {'uv': list(uv), 'texture': 0}}, origin, rotation)
    def cube(self, group, frm, to, uvpx, origin=None, rotation=None, uvw=1):
        u = [uvpx[0], uvpx[1], uvpx[0] + uvw, uvpx[1] + 1]
        return self._el(group, 'cube', frm, to, {f: {'uv': u, 'texture': 0} for f in ['north', 'east', 'south', 'west', 'up', 'down']}, origin, rotation)
    def anim(self, name, length, tracks):
        """tracks: {group: {'rotation': [(t, x, y, z)...], 'position': [...]}} -> a looping Blockbench animation."""
        animators = {}
        for gname, chans in tracks.items():
            g = self.groups[gname]; kfs = []
            for ch, keys in chans.items():
                for (t, x, y, z) in keys:
                    kfs.append({'channel': ch, 'data_points': [{'x': str(round(x, 3)), 'y': str(round(y, 3)), 'z': str(round(z, 3))}],
                                'uuid': uid(), 'time': round(t, 4), 'color': -1, 'interpolation': 'catmullrom'})
            animators[g['uuid']] = {'name': gname, 'type': 'bone', 'keyframes': kfs}
        self.anims.append({'uuid': uid(), 'name': name, 'loop': 'loop', 'override': False, 'length': length, 'snapping': 20,
                           'selected': False, 'anim_time_update': '', 'blend_weight': '', 'start_delay': '', 'loop_delay': '', 'animators': animators})
    def write(self, path):
        w, h = self.tex.size
        data = {'meta': {'format_version': '4.10', 'model_format': 'free', 'box_uv': False}, 'name': self.name, 'model_identifier': '',
                'visible_box': [1, 1, 0], 'variable_placeholders': '', 'variable_placeholder_buttons': [], 'timeline_setups': [],
                'unhandled_root_fields': {}, 'resolution': {'width': w, 'height': h}, 'elements': self.elements,
                'outliner': list(self.groups.values()),
                'textures': [{'path': '', 'name': self.name + '.png', 'folder': '', 'namespace': '', 'id': '0', 'group': '', 'width': w, 'height': h,
                              'uv_width': w, 'uv_height': h, 'particle': False, 'use_as_default': False, 'layers_enabled': False, 'sync_to_project': '',
                              'render_mode': 'default', 'render_sides': 'auto', 'frame_time': 1, 'frame_order_type': 'loop', 'frame_order': '',
                              'frame_interpolate': False, 'visible': True, 'internal': True, 'saved': False, 'uuid': uid(), 'relative_path': '',
                              'source': png_b64(self.tex)}],
                'animations': self.anims}
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f: json.dump(data, f)

def sidecar(cid, name, slot, model_rel, scale=1.0, offset=(0, 0, 0)):
    d = {'id': 'overthrone:' + cid, 'display_name': name, 'slot': slot, 'weapon_type': 'any', 'force_equip_allowed': True,
         'model': model_rel, 'scale': [scale] * 3, 'offset': list(offset), 'rotation': [0.0, 0.0, 0.0]}
    with open(os.path.join(ROOT, 'cosmetics', cid + '.json'), 'w') as f: json.dump(d, f, indent=2)

# clean old generated models (so removed/renamed cosmetics don't linger)
for slot in ['back', 'above_head', 'helmet', 'orbit']:
    shutil.rmtree(os.path.join(ROOT, 'models', slot), ignore_errors=True)
os.makedirs(os.path.join(ROOT, 'cosmetics'), exist_ok=True)
for fn in os.listdir(os.path.join(ROOT, 'cosmetics')):
    if not fn.startswith('aura_') and not fn.startswith('weapon_'): os.remove(os.path.join(ROOT, 'cosmetics', fn))
built = []   # (cid, slot)

# ================================================================== WINGS (back)
def wing_model(cid, tex_right, glow, bone, W=22, kind='bat'):
    T = 128
    atlas = Image.new('RGBA', (T * 4 + 16, T), (0, 0, 0, 0))
    gl = rim_glow(tex_right, glow)
    atlas.paste(tex_right, (0, 0)); atlas.paste(tex_right.transpose(Image.FLIP_LEFT_RIGHT), (T, 0))
    atlas.paste(gl, (T * 2, 0)); atlas.paste(gl.transpose(Image.FLIP_LEFT_RIGHT), (T * 3, 0))
    pal = strip([shade(bone, 0.6), lerp(bone, (255, 255, 255), 0.35)], 16)
    atlas.paste(pal, (T * 4, 0))
    m = Model(cid, atlas)
    for side in (1, -1):
        g = 'wing_' + ('right' if side > 0 else 'left'); m.group(g, [side * 1, 2, 0])
        x0, x1 = (1, 1 + W) if side > 0 else (-1 - W, -1)
        tu = [0, 0, T, T] if side > 0 else [T, 0, 2 * T, T]
        gu = [2 * T, 0, 3 * T, T] if side > 0 else [3 * T, 0, 4 * T, T]
        m.plate(g, [x0, -W * 0.25, 0], [x1, W * 0.75, 0], tu, flip=True)                       # the wing
        m.plate(g, [x0 - side * 0.4, -W * 0.25 - 0.4, 0.3], [x1 + side * 0.4, W * 0.75 + 0.4, 0.3], gu, flip=True)   # glow behind
        if kind == 'bat':
            # 3D arm bones: shoulder -> elbow -> tip (matching the texture's bone line)
            def P(u, v): return (x0 + (u if side > 0 else 1 - u) * W, W * 0.75 - v * W)
            sh, el, tp = P(0.03, 0.62), P(0.33, 0.18), P(0.985, 0.02)
            for (a, b, th) in [(sh, el, 1.1), (el, tp, 0.8)]:
                L = math.hypot(b[0] - a[0], b[1] - a[1]); ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
                cx, cy = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
                m.cube(g, [cx - L / 2, cy - th / 2, -th / 2], [cx + L / 2, cy + th / 2, th / 2], (T * 4 + 8, 0), origin=[cx, cy, 0], rotation=[0, 0, ang])
            # claw at the elbow
            m.cube(g, [el[0] - 0.5, el[1], -0.5], [el[0] + 0.5, el[1] + 2.2, 0.5], (T * 4 + 15, 0), origin=[el[0], el[1], 0], rotation=[0, 0, -side * 20])
    # idle: slow flap (each wing swings back 15 degrees and lifts slightly), 2.4 s loop
    m.anim('idle', 2.4, {
        'wing_right': {'rotation': [(0, 0, -20, 14), (1.2, 3, -38, 20), (2.4, 0, -20, 14)]},
        'wing_left': {'rotation': [(0, 0, 20, -14), (1.2, 3, 38, -20), (2.4, 0, 20, -14)]},
    })
    m.write(os.path.join(ROOT, 'models', 'back', cid + '.bbmodel'))
    return m

WINGS = [
    ('demon_lord_wings', 'Demon Lord Wings', 'bat', ((35, 0, 5), (150, 12, 25), (60, 14, 14), (255, 80, 40))),
    ('shadow_monarch_wings', 'Shadow Monarch Wings', 'bat', ((12, 0, 25), (75, 25, 140), (40, 20, 70), (190, 120, 255))),
    ('dragon_wings', 'Storm Dragon Wings', 'bat', ((0, 25, 55), (25, 120, 180), (200, 225, 240), (120, 240, 255))),
    ('void_wings', 'Void Wings', 'bat', ((5, 5, 10), (35, 30, 60), (20, 20, 30), (230, 80, 255))),
    ('seraph_wings', 'Seraph Wings', 'feather', ((240, 235, 220), (255, 255, 255), (255, 215, 120))),
    ('phoenix_wings', 'Phoenix Wings', 'feather', ((200, 40, 10), (255, 210, 60), (255, 240, 170))),
]
for cid, name, kind, cols in WINGS:
    if kind == 'bat':
        dark, mid, bone, glow = cols; tex = bat_wing(dark, mid, bone, glow); wing_model(cid, tex, glow, bone, kind='bat')
    else:
        base, tip_c, edge = cols; tex = feather_wing(base, tip_c, edge); wing_model(cid, tex, edge, edge, W=24, kind='feather')
    sidecar(cid, name, 'back', 'models/back/' + cid + '.bbmodel', 1.0); built.append((cid, 'back'))

# ================================================================== HALOS (above_head): 3D ring of segments + glow disc, spin + bob
HALOS = [('hero_halo', 'Hero Halo', (255, 255, 235), (255, 185, 40), False), ('fallen_halo', 'Fallen Halo', (255, 140, 140), (130, 0, 20), True),
         ('void_halo', 'Void Halo', (235, 190, 255), (95, 20, 170), False)]
for cid, name, inner, outer, broken in HALOS:
    ring = ring_texture(inner, outer, 64, broken)
    atlas = Image.new('RGBA', (96, 64), (0, 0, 0, 0)); atlas.paste(ring, (0, 0)); atlas.paste(strip([outer, inner], 16), (64, 0)); atlas.paste(strip([inner, (255, 255, 255)], 16), (64, 1))
    m = Model(cid, atlas); m.group('halo', [0, 0, 0])
    m.flat('halo', [-6.5, 0, -6.5], [6.5, 0, 6.5], [0, 0, 64, 64])                       # soft glow ring
    n = 28; R = 5.0
    for i in range(n):
        a = 360 * i / n
        if broken and (i in (3, 4, 17)): continue
        x, z = math.cos(math.radians(a)) * R, math.sin(math.radians(a)) * R
        m.cube('halo', [x - 0.6, -0.35, z - 0.35], [x + 0.6, 0.35, z + 0.35], (64 + (i % 16), 0), origin=[x, 0, z], rotation=[0, -a + 90, 0])
    for i in range(4):   # sparkles riding on the ring
        a = math.radians(i * 90 + 45); x, z = math.cos(a) * R, math.sin(a) * R
        m.cube('halo', [x - 0.25, 0.4, z - 0.25], [x + 0.25, 0.9, z + 0.25], (79, 1))
    m.anim('idle', 4.0, {'halo': {'rotation': [(0, 0, 0, 0), (2.0, 0, 180, 0), (4.0, 0, 360, 0)], 'position': [(0, 0, 0, 0), (2.0, 0, 0.7, 0), (4.0, 0, 0, 0)]}})
    m.write(os.path.join(ROOT, 'models', 'above_head', cid + '.bbmodel'))
    sidecar(cid, name, 'above_head', 'models/above_head/' + cid + '.bbmodel'); built.append((cid, 'above_head'))

# demon sigil: a glowing hexagram that turns slowly above the head
sig = sigil_texture((255, 60, 60)); m = Model('demon_sigil', sig); m.group('sigil', [0, 0, 0])
m.flat('sigil', [-7, 0, -7], [7, 0, 7], [0, 0, 128, 128])
m.anim('idle', 6.0, {'sigil': {'rotation': [(0, 0, 0, 0), (3.0, 0, -180, 0), (6.0, 0, -360, 0)], 'position': [(0, 0, 0, 0), (3.0, 0, 0.5, 0), (6.0, 0, 0, 0)]}})
m.write(os.path.join(ROOT, 'models', 'above_head', 'demon_sigil.bbmodel'))
sidecar('demon_sigil', 'Demon Sigil', 'above_head', 'models/above_head/demon_sigil.bbmodel'); built.append(('demon_sigil', 'above_head'))

# ================================================================== CROWNS (helmet): 3D band, stepped spikes, raised gems
def crown(cid, metal_dark, metal_light, gems, tall=1.0, crystal=False):
    atlas = Image.new('RGBA', (16, 4), (0, 0, 0, 0))
    atlas.paste(strip([metal_dark, metal_light], 16), (0, 0))
    for i, g in enumerate(gems): atlas.putpixel((i, 1), g + (255,)); atlas.putpixel((i, 2), lerp(g, (255, 255, 255), 0.5) + (255,))
    m = Model(cid, atlas); m.group('crown', [0, 8, 0])
    s, y0 = 4.4, 7.4
    # band: 4 sides (each 0.7 thick), shaded darker at the bottom row
    for (frm, to) in [([-s, y0, -s - 0.7], [s, y0 + 1.6, -s]), ([-s, y0, s], [s, y0 + 1.6, s + 0.7]), ([-s - 0.7, y0, -s - 0.7], [-s, y0 + 1.6, s + 0.7]), ([s, y0, -s - 0.7], [s + 0.7, y0 + 1.6, s + 0.7])]:
        m.cube('crown', frm, to, (5, 0)); m.cube('crown', [frm[0], y0 - 0.4, frm[2]], [to[0], y0, to[2]], (1, 0))
    # spikes: 3 per side, stepped (wide base, narrower top); middle one taller
    k = 0
    for side in range(4):
        for j, off in enumerate((-2.8, 0, 2.8)):
            h = (2.6 if j == 1 else 1.8) * tall
            for st in range(3):
                wdt = 1.3 - st * 0.4; yb = y0 + 1.6 + st * h / 3
                if side == 0: frm, to = [off - wdt / 2, yb, -s - 0.6], [off + wdt / 2, yb + h / 3, -s + 0.1]
                elif side == 1: frm, to = [off - wdt / 2, yb, s - 0.1], [off + wdt / 2, yb + h / 3, s + 0.6]
                elif side == 2: frm, to = [-s - 0.6, yb, off - wdt / 2], [-s + 0.1, yb + h / 3, off + wdt / 2]
                else: frm, to = [s - 0.1, yb, off - wdt / 2], [s + 0.6, yb + h / 3, off + wdt / 2]
                m.cube('crown', frm, to, ((8 + st * 3) if not crystal else 1, 0 if not crystal else 1))
            # gem on the band under each spike, sticking out
            g = gems[k % len(gems)]; k += 1; gi = gems.index(g)
            gy = y0 + 0.4
            if side == 0: frm, to = [off - 0.45, gy, -s - 1.0], [off + 0.45, gy + 0.9, -s - 0.6]
            elif side == 1: frm, to = [off - 0.45, gy, s + 0.6], [off + 0.45, gy + 0.9, s + 1.0]
            elif side == 2: frm, to = [-s - 1.0, gy, off - 0.45], [-s - 0.6, gy + 0.9, off + 0.45]
            else: frm, to = [s + 0.6, gy, off - 0.45], [s + 1.0, gy + 0.9, off + 0.45]
            m.cube('crown', frm, to, (gi, 1))
    m.anim('idle', 3.0, {'crown': {'position': [(0, 0, 0, 0), (1.5, 0, 0.15, 0), (3.0, 0, 0, 0)]}})
    m.write(os.path.join(ROOT, 'models', 'helmet', cid + '.bbmodel'))

CROWNS = [('royal_crown', 'Royal Crown', (150, 95, 10), (255, 225, 110), [(220, 20, 40), (40, 140, 255), (40, 200, 90)], 1.0, False),
          ('demon_king_crown', 'Demon King Crown', (20, 18, 24), (110, 100, 120), [(230, 20, 40), (160, 40, 230)], 1.5, False),
          ('ice_crown', 'Ice Crown', (60, 140, 200), (225, 250, 255), [(120, 220, 255), (255, 255, 255)], 1.6, True)]
for cid, name, md, ml, gems, tall, cry in CROWNS:
    crown(cid, md, ml, gems, tall, cry)
    sidecar(cid, name, 'helmet', 'models/helmet/' + cid + '.bbmodel'); built.append((cid, 'helmet'))

# ================================================================== HORNS (helmet): 10 smooth segments, ridged, glowing tips
def horns(cid, pal, path_fn, glow=None):
    atlas = Image.new('RGBA', (16, 2), (0, 0, 0, 0))
    for i in range(16):
        c = lerp(pal[0], pal[1], i / 15); atlas.putpixel((i, 0), (shade(c, 0.82) if i % 2 else c) + (255,))   # ridges
    atlas.putpixel((0, 1), (glow or pal[1]) + (255,))
    m = Model(cid, atlas)
    for side in (-1, 1):
        g = 'horn_' + ('right' if side > 0 else 'left'); m.group(g, [side * 2.5, 7.5, 0])
        pts = path_fn()
        for i, (x, y, z, sz) in enumerate(pts):
            cx = x * side; h = sz / 2
            nxt = pts[min(i + 1, len(pts) - 1)]; prv = pts[max(i - 1, 0)]
            ang = math.degrees(math.atan2((nxt[0] - prv[0]) * side, (nxt[1] - prv[1])))
            u = (min(15, i * 16 // len(pts)), 0) if not (glow and i >= len(pts) - 2) else (0, 1)
            m.cube(g, [cx - h, y - h * 1.2, z - h], [cx + h, y + h * 1.2, z + h], u, origin=[cx, y, z], rotation=[0, 0, -ang])
    m.anim('idle', 3.0, {})   # (horns don't move; kept so the model has the standard "idle")
    m.anims = []
    m.write(os.path.join(ROOT, 'models', 'helmet', cid + '.bbmodel'))

def demon_path():
    out = []
    for i in range(10):
        t = i / 9
        out.append((2.4 + 3.4 * math.sin(t * 1.4), 7.6 + 6.4 * t, 0.2 + 2.6 * t * t, 2.0 - 1.55 * t))
    return out
def oni_path():
    return [(2.0 + 0.5 * i / 9, 7.6 + 5.0 * i / 9, 0.1 * i / 9, 1.7 - 1.2 * i / 9) for i in range(10)]
def ram_path():
    out = []
    for i in range(12):
        a = math.radians(i * 30); r = 3.0 - i * 0.14
        out.append((4.2 + math.cos(a) * r * 0.25 + 0.6, 8.5 + math.sin(a) * r, -0.5 + math.cos(a) * r, 1.9 - 0.11 * i))
    return out
for cid, name, pal, fn, glow in [('demon_horns', 'Demon Horns', [(70, 10, 10), (15, 0, 0)], demon_path, (255, 70, 30)),
                                 ('oni_horns', 'Oni Horns', [(235, 225, 205), (120, 80, 50)], oni_path, None),
                                 ('ram_horns', 'Ram Horns', [(150, 120, 90), (60, 45, 35)], ram_path, None)]:
    horns(cid, pal, fn, glow)
    sidecar(cid, name, 'helmet', 'models/helmet/' + cid + '.bbmodel'); built.append((cid, 'helmet'))

# ================================================================== ORBIT: three soul crystals circling the player
atlas = Image.new('RGBA', (16, 2), (0, 0, 0, 0)); atlas.paste(strip([(60, 0, 120), (210, 150, 255)], 16), (0, 0)); atlas.paste(strip([(255, 255, 255), (200, 160, 255)], 16), (0, 1))
m = Model('soul_crystals', atlas); m.group('orbit', [0, 0, 0])
for i in range(3):
    a = math.radians(i * 120); x, z = math.cos(a) * 9, math.sin(a) * 9
    m.cube('orbit', [x - 0.8, 14, z - 0.8], [x + 0.8, 17.5, z + 0.8], (10, 0), origin=[x, 15.75, z], rotation=[0, 45, 0])
    m.cube('orbit', [x - 0.5, 17.5, z - 0.5], [x + 0.5, 18.6, z + 0.5], (14, 1), origin=[x, 18, z], rotation=[0, 45, 0])
    m.cube('orbit', [x - 0.5, 13.0, z - 0.5], [x + 0.5, 14, z + 0.5], (3, 0), origin=[x, 13.5, z], rotation=[0, 45, 0])
m.anim('idle', 6.0, {'orbit': {'rotation': [(0, 0, 0, 0), (3.0, 0, 180, 0), (6.0, 0, 360, 0)], 'position': [(0, 0, 0, 0), (1.5, 0, 1.0, 0), (3.0, 0, 0, 0), (4.5, 0, 1.0, 0), (6.0, 0, 0, 0)]}})
m.write(os.path.join(ROOT, 'models', 'orbit', 'soul_crystals.bbmodel'))
sidecar('soul_crystals', 'Soul Crystals', 'orbit', 'models/orbit/soul_crystals.bbmodel'); built.append(('soul_crystals', 'orbit'))

# ================================================================== 3D preview on a player figure (first animation frame)
FACE = {'north': (2, 0, 0, 1), 'south': (2, 1, 0, 1), 'east': (0, 1, 2, 1), 'west': (0, 0, 2, 1), 'up': (1, 1, 0, 2), 'down': (1, 0, 0, 2)}
def rot_point(p, origin, rot):
    x, y, z = p[0] - origin[0], p[1] - origin[1], p[2] - origin[2]
    rx, ry, rz = [math.radians(a) for a in rot]
    x, y = x * math.cos(rz) - y * math.sin(rz), x * math.sin(rz) + y * math.cos(rz)
    x, z = x * math.cos(ry) + z * math.sin(ry), -x * math.sin(ry) + z * math.cos(ry)
    y, z = y * math.cos(rx) - z * math.sin(rx), y * math.sin(rx) + z * math.cos(rx)
    return (x + origin[0], y + origin[1], z + origin[2])
def render(data, tex, shift, t=0.0, yaw=200, pitch=-12, size=260, scale=6.0):
    img = Image.new('RGBA', (size, size), (34, 34, 40, 255)); px = img.load(); zb = {}
    cy, sy = math.cos(math.radians(yaw)), math.sin(math.radians(yaw)); cp, sp = math.cos(math.radians(pitch)), math.sin(math.radians(pitch))
    # group transform at time t (first keyframe at or before t)
    gpose = {}
    for an in data.get('animations', []):
        if an['name'] != 'idle': continue
        for gu, a in an['animators'].items():
            for ch in ('rotation', 'position'):
                ks = sorted([k for k in a['keyframes'] if k['channel'] == ch], key=lambda k: k['time'])
                if ks:
                    k = [kk for kk in ks if kk['time'] <= t + 1e-6][-1]; dp = k['data_points'][0]
                    gpose.setdefault(gu, {})[ch] = [float(dp['x']), float(dp['y']), float(dp['z'])]
    owner = {}
    for g in data['outliner']:
        for c in g['children']: owner[c] = g
    def proj(p):
        x, y, z = p[0], p[1] - 18, p[2]
        x, z = x * cy + z * sy, -x * sy + z * cy
        y, z = y * cp - z * sp, y * sp + z * cp
        return (size / 2 + x * scale, size * 0.55 - y * scale, z)
    def draw(elems, texture, sh, own=None):
        tw, th = texture.size; tp = texture.load()
        for e in elems:
            f, to = e['from'], e['to']; g = (own or {}).get(e.get('uuid')); gp = gpose.get(g['uuid'], {}) if g else {}
            for name, fc in e['faces'].items():
                ax, side, ua, va = FACE[name]; u0, v0, u1, v1 = fc['uv']
                ext = max(abs(to[ua] - f[ua]), abs(to[va] - f[va])); N = int(min(260, max(6, ext * scale * 1.6)))
                for i in range(N):
                    for j in range(N):
                        a, b = (i + 0.5) / N, (j + 0.5) / N
                        p = [0, 0, 0]; p[ax] = to[ax] if side else f[ax]
                        p[ua] = f[ua] + (to[ua] - f[ua]) * a
                        p[va] = (to[va] - (to[va] - f[va]) * b) if va == 1 else (f[va] + (to[va] - f[va]) * b)
                        c = tp[min(tw - 1, max(0, int(u0 + (u1 - u0) * a))), min(th - 1, max(0, int(v0 + (v1 - v0) * b)))]
                        if len(c) == 4 and c[3] < 40: continue
                        q = rot_point(p, e.get('origin', [0, 0, 0]), e.get('rotation', [0, 0, 0]))
                        if g is not None and gp:
                            q = rot_point(q, g['origin'], gp.get('rotation', [0, 0, 0]))
                            pp = gp.get('position', [0, 0, 0]); q = (q[0] + pp[0], q[1] + pp[1], q[2] + pp[2])
                        q = (q[0] + sh[0], q[1] + sh[1], q[2] + sh[2])
                        X, Y, Z = proj(q); k = (int(X), int(Y))
                        if 0 <= k[0] < size and 0 <= k[1] < size and Z > zb.get(k, -1e9):
                            zb[k] = Z; px[k] = c[:3] + (255,)
    body = Image.new('RGBA', (1, 1), (120, 130, 150, 255)); head = Image.new('RGBA', (1, 1), (200, 170, 140, 255))
    box = lambda f, to: {'from': f, 'to': to, 'faces': {n: {'uv': [0, 0, 1, 1]} for n in FACE}}
    draw([box([-4, 24, -4], [4, 32, 4])], head, (0, 0, 0))
    draw([box([-4, 12, -2], [4, 24, 2]), box([-4, 0, -2], [0, 12, 2]), box([0, 0, -2], [4, 12, 2]), box([-8, 12, -2], [-4, 24, 2]), box([4, 12, -2], [8, 24, 2])], body, (0, 0, 0))
    draw(data['elements'], tex, shift, owner)
    return img
SHIFT = {'back': (0, 17, 2.2), 'above_head': (0, 35, 0), 'helmet': (0, 24, 0), 'orbit': (0, 0, 0)}
shots = []
for cid, slot in built:
    d = json.load(open(os.path.join(ROOT, 'models', slot, cid + '.bbmodel')))
    tex = Image.open(io.BytesIO(base64.b64decode(d['textures'][0]['source'].split(',', 1)[1]))).convert('RGBA')
    name = json.load(open(os.path.join(ROOT, 'cosmetics', cid + '.json')))['display_name']
    t2 = d['animations'][0]['length'] / 2 if d['animations'] else 0
    shots.append((name, render(d, tex, SHIFT[slot], 0, yaw=200 if slot == 'back' else 25), render(d, tex, SHIFT[slot], t2, yaw=200 if slot == 'back' else 25) if d['animations'] else None))
os.makedirs(PREVIEW, exist_ok=True)
cols = 4; sheet = Image.new('RGBA', (260 * cols, 280 * ((len(shots) + cols - 1) // cols)), (24, 24, 30, 255)); dd = ImageDraw.Draw(sheet)
for i, (name, im, im2) in enumerate(shots):
    x, y = (i % cols) * 260, (i // cols) * 280
    sheet.alpha_composite(im, (x, y)); dd.text((x + 8, y + 262), name + ('  (animated)' if im2 else ''), fill=(255, 255, 255, 255))
sheet.save(os.path.join(PREVIEW, 'models_3d.png'))
# animation frames (second pose) for the animated ones
anim = [(n, b) for (n, a, b) in shots if b is not None]
sheet2 = Image.new('RGBA', (260 * cols, 280 * ((len(anim) + cols - 1) // cols)), (24, 24, 30, 255)); d2 = ImageDraw.Draw(sheet2)
for i, (name, im) in enumerate(anim):
    x, y = (i % cols) * 260, (i // cols) * 280
    sheet2.alpha_composite(im, (x, y)); d2.text((x + 8, y + 262), name + ' (mid-animation)', fill=(255, 255, 255, 255))
sheet2.save(os.path.join(PREVIEW, 'models_3d_anim.png'))
print('models:', len(built), '-> minecraft/manas_cosmetics/models; previews/models_3d.png + models_3d_anim.png')
