# Builds OVERTHRONE model cosmetics for Manas Cosmetics: .bbmodel files (Blockbench, opens and edits in Blockbench) +
# their .json sidecars. Layout from the mod's README (manas_cosmetics 1.0.6):
#   config/manas_cosmetics/models/<slot>/<name>.bbmodel     config/manas_cosmetics/cosmetics/<name>.json
# The shapes come from pixel-art textures with see-through parts on flat plates (the mod's parser reads embedded PNGs and
# their transparency), plus voxel cubes for the horns. Position/size can be tuned in game: /manas_cosmetics edit <id>.
#   python3 scripts/build-manas-models.py      (needs Pillow)
import base64, io, json, math, os, uuid
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), '..', 'minecraft', 'manas_cosmetics')
PREVIEW = os.path.join(ROOT, 'previews')

def uid(): return str(uuid.uuid4())
def png_b64(img):
    b = io.BytesIO(); img.save(b, 'PNG'); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
def lerp(a, b, t): return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(len(a)))

# ------------------------------------------------------------------ textures
def wing_texture(dark, mid, bone, glow, size=64):
    """A demon/bat wing, drawn for the RIGHT side: shoulder at the left edge, tip at the top right."""
    S = size * 4                                       # draw big, shrink = clean pixel edges
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    sh = (int(S * 0.04), int(S * 0.60))                # shoulder (at the spine)
    el = (int(S * 0.34), int(S * 0.20))                # elbow
    tip = (int(S * 0.98), int(S * 0.02))               # wing tip, swept up and out
    fingers = [(int(S * 0.97), int(S * 0.36)), (int(S * 0.80), int(S * 0.66)), (int(S * 0.55), int(S * 0.86)), (int(S * 0.24), int(S * 0.92))]
    # membrane: between the fingers, each edge curving in towards the elbow (the classic scalloped wing edge)
    pts = [sh, el, tip]
    prev = tip
    for f in fingers:
        mx, my = (prev[0] + f[0]) / 2, (prev[1] + f[1]) / 2
        cx, cy = mx + (el[0] - mx) * 0.38, my + (el[1] - my) * 0.38
        for k in range(1, 11):
            t = k / 10
            x = (1 - t) ** 2 * prev[0] + 2 * (1 - t) * t * cx + t * t * f[0]
            y = (1 - t) ** 2 * prev[1] + 2 * (1 - t) * t * cy + t * t * f[1]
            pts.append((x, y))
        prev = f
    pts += [(int(S * 0.03), int(S * 0.80))]
    d.polygon(pts, fill=mid + (255,))
    # darker shading towards the body, lighter towards the tips
    px = img.load()
    for y in range(S):
        for x in range(S):
            if px[x, y][3]:
                t = min(1, math.hypot(x - sh[0], y - sh[1]) / (S * 0.95))
                c = lerp(dark, mid, t)
                px[x, y] = c + (235,)
    # bones: arm + fingers, with a glow line
    w = max(3, S // 40)
    d.line([sh, el, tip], fill=bone + (255,), width=w * 2)
    for f in fingers: d.line([el, f], fill=bone + (255,), width=w)
    # glowing edge along the membrane
    d.line(pts[2:-1], fill=glow + (255,), width=w)
    # claws at the elbow and tip
    d.polygon([(el[0] - w * 2, el[1]), (el[0] + w * 2, el[1]), (el[0], el[1] - w * 6)], fill=glow + (255,))
    return img.resize((size, size), Image.NEAREST)

def halo_texture(inner, outer, size=32):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0)); px = img.load(); c = (size - 1) / 2
    for y in range(size):
        for x in range(size):
            r = math.hypot(x - c, y - c)
            if size * 0.33 <= r <= size * 0.47:
                t = abs(r - size * 0.40) / (size * 0.07)          # bright in the middle of the ring
                px[x, y] = lerp(inner, outer, min(1, t)) + (255,)
    return img

def crown_texture(gold, dark, gems, w=32, h=16):
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    band = h - 6
    d.rectangle([0, band, w - 1, h - 1], fill=gold + (255,))
    d.line([0, band, w - 1, band], fill=lerp(gold, (255, 255, 255), 0.4) + (255,))
    d.line([0, h - 1, w - 1, h - 1], fill=dark + (255,))
    spikes = 4
    for i in range(spikes):
        x0 = i * w / spikes; xm = x0 + w / spikes / 2; tall = band - (2 if i % 2 else 0)
        d.polygon([(x0 + 1, band), (xm, band - tall + 1), (x0 + w / spikes - 1, band)], fill=gold + (255,))
        d.point((xm, band - tall + 2), fill=lerp(gold, (255, 255, 255), 0.6) + (255,))
    for i in range(spikes):
        xm = int(i * w / spikes + w / spikes / 2)
        g = gems[i % len(gems)]
        d.rectangle([xm - 1, band + 2, xm, band + 3], fill=g + (255,))
    return img

# ------------------------------------------------------------------ bbmodel writer
class Model:
    def __init__(self, name, tex):
        self.name, self.tex, self.elements, self.groups = name, tex, [], []
    def plate(self, group, frm, to, uv, origin=None, rotation=None, flip=False):
        """A flat (zero-thickness) plate showing the texture area uv on both sides."""
        u = list(uv)
        back = [u[2], u[1], u[0], u[3]] if not flip else u
        front = u if not flip else [u[2], u[1], u[0], u[3]]
        e = {'name': group + '_plate', 'box_uv': False, 'rescale': False, 'locked': False, 'render_order': 'default',
             'from': frm, 'to': to, 'autouv': 0, 'color': 0, 'origin': origin or [0, 0, 0],
             'faces': {'north': {'uv': front, 'texture': 0}, 'south': {'uv': back, 'texture': 0}}, 'type': 'cube', 'uuid': uid()}
        if rotation: e['rotation'] = rotation
        return self._add(group, e)
    def flat(self, group, frm, to, uv, origin=None):
        """A horizontal plate (texture on top and bottom)."""
        e = {'name': group + '_plate', 'box_uv': False, 'rescale': False, 'locked': False, 'render_order': 'default',
             'from': frm, 'to': to, 'autouv': 0, 'color': 0, 'origin': origin or [0, 0, 0],
             'faces': {'up': {'uv': list(uv), 'texture': 0}, 'down': {'uv': list(uv), 'texture': 0}}, 'type': 'cube', 'uuid': uid()}
        return self._add(group, e)
    def cube(self, group, frm, to, uv_px, origin=None, rotation=None):
        """A solid cube, every face showing one 1x1 texel area (a palette colour)."""
        u = [uv_px[0], uv_px[1], uv_px[0] + 1, uv_px[1] + 1]
        e = {'name': group + '_cube', 'box_uv': False, 'rescale': False, 'locked': False, 'render_order': 'default',
             'from': frm, 'to': to, 'autouv': 0, 'color': 0, 'origin': origin or [0, 0, 0],
             'faces': {f: {'uv': u, 'texture': 0} for f in ['north', 'east', 'south', 'west', 'up', 'down']}, 'type': 'cube', 'uuid': uid()}
        if rotation: e['rotation'] = rotation
        return self._add(group, e)
    def _add(self, group, e):
        self.elements.append(e)
        g = next((g for g in self.groups if g['name'] == group), None)
        if g is None:
            g = {'name': group, 'origin': [0, 0, 0], 'color': 0, 'uuid': uid(), 'export': True, 'mirror_uv': False,
                 'isOpen': True, 'locked': False, 'visibility': True, 'autouv': 0, 'children': []}
            self.groups.append(g)
        g['children'].append(e['uuid'])
        return e
    def write(self, path):
        w, h = self.tex.size
        data = {
            'meta': {'format_version': '4.10', 'model_format': 'free', 'box_uv': False},
            'name': self.name, 'model_identifier': '', 'visible_box': [1, 1, 0], 'variable_placeholders': '',
            'variable_placeholder_buttons': [], 'timeline_setups': [], 'unhandled_root_fields': {},
            'resolution': {'width': w, 'height': h},
            'elements': self.elements, 'outliner': self.groups,
            'textures': [{'path': '', 'name': self.name + '.png', 'folder': '', 'namespace': '', 'id': '0', 'group': '',
                          'width': w, 'height': h, 'uv_width': w, 'uv_height': h, 'particle': False, 'use_as_default': False,
                          'layers_enabled': False, 'sync_to_project': '', 'render_mode': 'default', 'render_sides': 'auto',
                          'frame_time': 1, 'frame_order_type': 'loop', 'frame_order': '', 'frame_interpolate': False,
                          'visible': True, 'internal': True, 'saved': False, 'uuid': uid(), 'relative_path': '',
                          'source': png_b64(self.tex)}],
            'animations': [],
        }
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f: json.dump(data, f)

def sidecar(cid, name, slot, model_rel, scale=1.0, offset=(0, 0, 0)):
    d = {'id': 'overthrone:' + cid, 'display_name': name, 'slot': slot, 'weapon_type': 'any', 'force_equip_allowed': True,
         'model': model_rel, 'scale': [scale] * 3, 'offset': list(offset), 'rotation': [0.0, 0.0, 0.0]}
    with open(os.path.join(ROOT, 'cosmetics', cid + '.json'), 'w') as f: json.dump(d, f, indent=2)

previews = []
# ------------------------------------------------------------------ WINGS (back slot): two angled plates
WINGS = [
    ('shadow_monarch_wings', 'Shadow Monarch Wings', (20, 0, 40), (70, 20, 130), (110, 60, 190), (190, 120, 255)),
    ('demon_lord_wings', 'Demon Lord Wings', (40, 0, 5), (140, 10, 20), (70, 20, 20), (255, 90, 60)),
    ('dragon_wings', 'Storm Dragon Wings', (0, 30, 60), (20, 110, 170), (210, 230, 240), (120, 240, 255)),
    ('seraph_wings', 'Seraph Wings', (200, 190, 150), (255, 250, 230), (255, 215, 120), (255, 255, 255)),
]
for cid, name, dark, mid, bone, glow in WINGS:
    t = wing_texture(dark, mid, bone, glow, 64)
    atlas = Image.new('RGBA', (128, 64), (0, 0, 0, 0)); atlas.paste(t, (0, 0)); atlas.paste(t.transpose(Image.FLIP_LEFT_RIGHT), (64, 0))
    m = Model(cid, atlas)
    W = 24   # each wing 24 x 24 pixels (1.5 blocks)
    # right wing: from the spine (x=1) outwards to +x, angled 25 degrees back
    # texture left edge = shoulder. Seen from the front (north) +X is on the viewer's left, so the north face is mirrored
    # and the south face isn't: the shoulder sits at the spine on both sides (flip=True).
    m.plate('wing_right', [1, 0, 0], [1 + W, W, 0], [0, 0, 64, 64], origin=[1, 0, 0], rotation=[0, -25, 0], flip=True)
    m.plate('wing_left', [-1 - W, 0, 0], [-1, W, 0], [64, 0, 128, 64], origin=[-1, 0, 0], rotation=[0, 25, 0], flip=True)
    m.write(os.path.join(ROOT, 'models', 'back', cid + '.bbmodel'))
    sidecar(cid, name, 'back', 'models/back/' + cid + '.bbmodel', 1.0)
    previews.append((name, atlas))

# ------------------------------------------------------------------ HALOS (above_head): one horizontal ring plate
HALOS = [
    ('hero_halo', 'Hero Halo', (255, 255, 230), (255, 190, 40)),
    ('fallen_halo', 'Fallen Halo', (255, 120, 120), (120, 0, 20)),
    ('void_halo', 'Void Halo', (230, 180, 255), (90, 20, 160)),
]
for cid, name, inner, outer in HALOS:
    t = halo_texture(inner, outer, 32)
    m = Model(cid, t)
    m.flat('halo', [-6, 0, -6], [6, 0, 6], [0, 0, 32, 32])
    m.write(os.path.join(ROOT, 'models', 'above_head', cid + '.bbmodel'))
    sidecar(cid, name, 'above_head', 'models/above_head/' + cid + '.bbmodel', 1.0)
    previews.append((name, t))

# ------------------------------------------------------------------ CROWNS (helmet): 4 plates around the head
CROWNS = [
    ('demon_king_crown', 'Demon King Crown', (60, 60, 70), (20, 20, 25), [(220, 20, 40), (150, 40, 220)]),
    ('royal_crown', 'Royal Crown', (240, 190, 50), (150, 100, 10), [(220, 20, 40), (40, 140, 255), (40, 200, 90)]),
]
for cid, name, gold, dark, gems in CROWNS:
    t = crown_texture(gold, dark, gems, 32, 16)
    m = Model(cid, t)
    s = 4.5; y0 = 7; y1 = 12   # head is 8 x 8 x 8 (y 0..8): the crown sits on the top of the head
    m.plate('crown', [-s, y0, -s], [s, y1, -s], [0, 0, 32, 16])
    m.plate('crown', [-s, y0, s], [s, y1, s], [0, 0, 32, 16])
    # left/right sides: zero width in x, so they show their east/west faces
    for x in (-s, s):
        e = {'name': 'crown_side', 'box_uv': False, 'rescale': False, 'locked': False, 'render_order': 'default',
             'from': [x, y0, -s], 'to': [x, y1, s], 'autouv': 0, 'color': 0, 'origin': [0, 0, 0],
             'faces': {'east': {'uv': [0, 0, 32, 16], 'texture': 0}, 'west': {'uv': [32, 0, 0, 16], 'texture': 0}}, 'type': 'cube', 'uuid': uid()}
        m._add('crown', e)
    m.write(os.path.join(ROOT, 'models', 'helmet', cid + '.bbmodel'))
    sidecar(cid, name, 'helmet', 'models/helmet/' + cid + '.bbmodel', 1.0)
    previews.append((name, t))

# ------------------------------------------------------------------ HORNS (helmet): voxel horns curving out and up
HORNS = [
    ('demon_horns', 'Demon Horns', [(60, 10, 10), (110, 20, 20), (160, 40, 30), (30, 5, 5), (10, 0, 0)]),
    ('oni_horns', 'Oni Horns', [(230, 220, 200), (210, 190, 160), (190, 160, 120), (120, 80, 50), (60, 30, 20)]),
]
for cid, name, pal in HORNS:
    t = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    for i, c in enumerate(pal): t.putpixel((i, 0), c + (255,))
    m = Model(cid, t)
    for side in (-1, 1):
        # (x, y, z, size, palette index): base on the top-side of the head, curving outwards then up and back
        path = [(2.5, 7.5, 0, 2.0, 0), (3.6, 9.0, 0.3, 1.8, 1), (4.6, 10.4, 0.8, 1.5, 2), (5.2, 11.9, 1.4, 1.2, 2), (5.4, 13.2, 2.1, 0.9, 3), (5.3, 14.2, 2.9, 0.6, 4)]
        for (x, y, z, sz, ci) in path:
            cx = x * side; h = sz / 2
            m.cube('horn_' + ('right' if side > 0 else 'left'), [cx - h, y - h, z - h], [cx + h, y + h, z + h], (ci, 0))
    m.write(os.path.join(ROOT, 'models', 'helmet', cid + '.bbmodel'))
    sidecar(cid, name, 'helmet', 'models/helmet/' + cid + '.bbmodel', 1.0)
    big = t.crop((0, 0, len(pal), 1)).resize((len(pal) * 12, 12), Image.NEAREST)
    previews.append((name, big))

# ------------------------------------------------------------------ 3D preview on a player figure (for checking shapes)
FACE = {  # face -> (fixed axis, fixed side (0=from,1=to), u axis, v axis) ; v runs top->bottom of the texture
    'north': (2, 0, 0, 1), 'south': (2, 1, 0, 1), 'east': (0, 1, 2, 1), 'west': (0, 0, 2, 1), 'up': (1, 1, 0, 2), 'down': (1, 0, 0, 2)}
def rot_point(p, origin, rot):
    x, y, z = p[0] - origin[0], p[1] - origin[1], p[2] - origin[2]
    rx, ry, rz = [math.radians(a) for a in rot]
    y, z = y * math.cos(rx) - z * math.sin(rx), y * math.sin(rx) + z * math.cos(rx)
    x, z = x * math.cos(ry) + z * math.sin(ry), -x * math.sin(ry) + z * math.cos(ry)
    x, y = x * math.cos(rz) - y * math.sin(rz), x * math.sin(rz) + y * math.cos(rz)
    return (x + origin[0], y + origin[1], z + origin[2])
def render(model_elems, tex, shift, yaw=200, pitch=-12, size=260, scale=6.5):
    img = Image.new('RGBA', (size, size), (34, 34, 40, 255)); px = img.load(); zb = {}
    cy, sy = math.cos(math.radians(yaw)), math.sin(math.radians(yaw)); cp, sp = math.cos(math.radians(pitch)), math.sin(math.radians(pitch))
    def proj(p):
        x, y, z = p[0], p[1] - 18, p[2]
        x, z = x * cy + z * sy, -x * sy + z * cy
        y, z = y * cp - z * sp, y * sp + z * cp
        return (size / 2 + x * scale, size * 0.55 - y * scale, z)
    def draw(elems, texture, sh):
        tw, th = texture.size; tp = texture.load()
        for e in elems:
            f, t = e['from'], e['to']
            for name, fc in e['faces'].items():
                ax, side, ua, va = FACE[name]; u0, v0, u1, v1 = fc['uv']
                ext = max(abs(t[ua] - f[ua]), abs(t[va] - f[va]))
                N = int(min(260, max(8, ext * scale * 1.6)))
                for i in range(N):
                    for j in range(N):
                        a, b = (i + 0.5) / N, (j + 0.5) / N
                        p = [0, 0, 0]
                        p[ax] = t[ax] if side else f[ax]
                        p[ua] = f[ua] + (t[ua] - f[ua]) * a
                        p[va] = (t[va] - (t[va] - f[va]) * b) if va == 1 else (f[va] + (t[va] - f[va]) * b)
                        uu, vv = u0 + (u1 - u0) * a, v0 + (v1 - v0) * b
                        c = tp[min(tw - 1, max(0, int(uu))), min(th - 1, max(0, int(vv)))]
                        if len(c) == 4 and c[3] < 40: continue
                        q = rot_point(p, e.get('origin', [0, 0, 0]), e.get('rotation', [0, 0, 0]))
                        q = (q[0] + sh[0], q[1] + sh[1], q[2] + sh[2])
                        X, Y, Z = proj(q); k = (int(X), int(Y))
                        if 0 <= k[0] < size and 0 <= k[1] < size and Z > zb.get(k, -1e9):
                            zb[k] = Z; px[k] = c[:3] + (255,)
    # the player: head 8^3 at y 24..32, body 8x12x4 at y 12..24, legs/arms (grey)
    body = Image.new('RGBA', (1, 1), (120, 130, 150, 255)); head = Image.new('RGBA', (1, 1), (200, 170, 140, 255))
    box = lambda f, t: {'from': f, 'to': t, 'faces': {n: {'uv': [0, 0, 1, 1]} for n in FACE}}
    draw([box([-4, 24, -4], [4, 32, 4])], head, (0, 0, 0))
    draw([box([-4, 12, -2], [4, 24, 2]), box([-4, 0, -2], [0, 12, 2]), box([0, 0, -2], [4, 12, 2]), box([-8, 12, -2], [-4, 24, 2]), box([4, 12, -2], [8, 24, 2])], body, (0, 0, 0))
    draw(model_elems, tex, shift)
    return img
SHIFT = {'back': (0, 13, 2.2), 'above_head': (0, 35, 0), 'helmet': (0, 24, 0)}
shots = []
for slot in ['back', 'above_head', 'helmet']:
    folder = os.path.join(ROOT, 'models', slot)
    for fn in sorted(os.listdir(folder)):
        d = json.load(open(os.path.join(folder, fn)))
        src = d['textures'][0]['source'].split(',', 1)[1]
        tex = Image.open(io.BytesIO(base64.b64decode(src))).convert('RGBA')
        yaw = 200 if slot == 'back' else 25
        shots.append((json.load(open(os.path.join(ROOT, 'cosmetics', fn.replace('.bbmodel', '.json'))))['display_name'], render(d['elements'], tex, SHIFT[slot], yaw=yaw)))
os.makedirs(PREVIEW, exist_ok=True)
cols = 4; sheet3 = Image.new('RGBA', (260 * cols, 280 * ((len(shots) + cols - 1) // cols)), (24, 24, 30, 255)); d3 = ImageDraw.Draw(sheet3)
for i, (name, im) in enumerate(shots):
    x, y = (i % cols) * 260, (i // cols) * 280
    sheet3.alpha_composite(im, (x, y)); d3.text((x + 8, y + 262), name, fill=(255, 255, 255, 255))
sheet3.save(os.path.join(PREVIEW, 'models_3d.png'))

# ------------------------------------------------------------------ preview sheet (textures, 4x)
os.makedirs(PREVIEW, exist_ok=True)
cell = 280
sheet = Image.new('RGBA', (cell * 4, cell * ((len(previews) + 3) // 4)), (34, 34, 40, 255))
d = ImageDraw.Draw(sheet)
for i, (name, img) in enumerate(previews):
    x, y = (i % 4) * cell, (i // 4) * cell
    k = max(1, min(4, (cell - 40) // max(img.size))) if max(img.size) <= 120 else 2
    im = img.resize((img.size[0] * k, img.size[1] * k), Image.NEAREST)
    sheet.alpha_composite(im, (x + (cell - im.size[0]) // 2, y + 10))
    d.text((x + 10, y + cell - 22), name, fill=(255, 255, 255, 255))
sheet.save(os.path.join(PREVIEW, 'textures.png'))
print('models:', len(previews), '-> minecraft/manas_cosmetics/models, sidecars in cosmetics/, preview in previews/textures.png')
