# Small Blockbench (.bbmodel) writer + texture atlas helpers for the OVERTHRONE Manas Cosmetics generator.
# Writes the exact JSON the mod's parser reads: elements (cubes with from/to/origin/rotation/faces), an outliner of nested
# groups (bones with origin = pivot), one embedded PNG texture, and animations (keyframes may hold Molang expressions).
import base64, io, json, math, os, uuid
from PIL import Image, ImageDraw

def uid(): return str(uuid.uuid4())
def lerp(a, b, t): t = max(0.0, min(1.0, t)); return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))
def shade(c, k): return tuple(max(0, min(255, int(v * k))) for v in c[:3])
def mix(a, b, t): return lerp(a, b, t)

class Atlas:
    """Packs small sprites into one texture; returns the uv rectangle of each."""
    def __init__(self, w=256, h=256):
        self.img = Image.new('RGBA', (w, h), (0, 0, 0, 0)); self.x = self.y = self.row = 0; self.w, self.h = w, h
    def add(self, sprite):
        sw, sh = sprite.size
        if self.x + sw > self.w: self.x = 0; self.y += self.row; self.row = 0
        if self.y + sh > self.h: raise ValueError('atlas full')
        self.img.paste(sprite, (self.x, self.y)); r = (self.x, self.y, self.x + sw, self.y + sh)
        self.x += sw; self.row = max(self.row, sh); return r
    def solid(self, c, a=255):
        return self.add(Image.new('RGBA', (2, 2), tuple(c[:3]) + (a,)))

# ---------------------------------------------------------------- sprite painters (top of the sprite = root/top of the piece)
def feather_sprite(root, tip, edge, shaft=None, w=6, h=28, jag=False, notch=True):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); px = im.load()
    for y in range(h):
        t = y / (h - 1)
        c = lerp(root, tip, t ** 0.9)
        half = (w / 2) * (1 - max(0, t - 0.78) / 0.22 * 0.9)          # tapers to a point at the tip
        for x in range(w):
            d = abs(x + 0.5 - w / 2)
            if d > half: continue
            cc = c
            if d > half - 1.0: cc = lerp(c, edge, 0.75) if x >= w / 2 else shade(c, 0.78)   # lit outer rim, shaded inner rim
            if shaft and d < 0.6: cc = shaft
            if jag and (y % 5 == 0) and x in (0, w - 1): continue       # serrated edge
            if notch and y % 7 == 3 and x == w - 1: cc = shade(c, 0.7)  # barb lines
            px[x, y] = cc + (255,)
    return im

def crystal_sprite(core, edge, w=6, h=24, stars=False):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); px = im.load()
    for y in range(h):
        t = y / (h - 1)
        half = (w / 2) * (1 - abs(t - 0.35) / 0.65 * 0.85)
        for x in range(w):
            d = abs(x + 0.5 - w / 2)
            if d > half: continue
            k = 1.15 if x < w / 2 else 0.85                               # two facets (lit / shadow)
            c = shade(lerp(edge, core, d / max(half, 0.01)), k)
            if stars and (x * 7 + y * 13) % 17 == 0: c = (255, 255, 255)
            px[x, y] = c + (255,)
    return im

def blade_sprite(dark, glow, w=6, h=28):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); px = im.load()
    for y in range(h):
        t = y / (h - 1); half = (w / 2) * (1 - max(0, t - 0.6) / 0.4)
        for x in range(w):
            d = abs(x + 0.5 - w / 2)
            if d > half: continue
            c = dark
            if x == 0 or d > half - 0.8: c = glow                           # glowing cutting edge
            if y in (6, 7, 15, 16) and d < half - 1: c = shade(glow, 0.7)    # panel lines
            px[x, y] = c + (255,)
    return im

def leaf_sprite(base, vein, w=8, h=14):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); px = im.load()
    for y in range(h):
        t = y / (h - 1); half = (w / 2) * math.sin(math.pi * min(1, t * 1.05)) + 0.3
        for x in range(w):
            d = abs(x + 0.5 - w / 2)
            if d > half: continue
            c = shade(base, 0.85 + 0.3 * (1 - t))
            if d < 0.6 or (abs(d - (t * 3) % 3) < 0.4): c = vein
            px[x, y] = c + (255,)
    return im

def ring_sprite(inner, outer, size=32, cut=None):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0)); px = im.load(); c = (size - 1) / 2
    for y in range(size):
        for x in range(size):
            r = math.hypot(x - c, y - c); a = math.degrees(math.atan2(y - c, x - c)) % 360
            if cut and any(lo <= a <= hi for lo, hi in cut): continue
            if size * 0.36 <= r <= size * 0.49:
                t = abs(r - size * 0.425) / (size * 0.065)
                px[x, y] = lerp(inner, outer, t) + (int(255 * max(0, 1 - t ** 2.2)),)
    return im

def runes_sprite(col, size=64):
    S = size * 4; im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = S / 2; w = S // 48
    for r in (0.48, 0.40): d.ellipse([c - S * r, c - S * r, c + S * r, c + S * r], outline=col + (255,), width=w)
    for i in range(16):
        a = math.radians(i * 22.5); r0, r1 = S * 0.41, S * 0.47
        x, y = c + math.cos(a) * (r0 + r1) / 2, c + math.sin(a) * (r0 + r1) / 2
        if i % 2: d.line([(x - w * 2, y), (x + w * 2, y)], fill=col + (255,), width=w)
        else: d.line([(x, y - w * 2), (x, y + w * 2)], fill=col + (255,), width=w)
    return im.resize((size, size), Image.LANCZOS)

# ---------------------------------------------------------------- model
class BB:
    def __init__(self, name, atlas, fmt='free'):
        self.name, self.atlas, self.fmt = name, atlas, fmt
        self.elements, self.bones, self.root_bones, self.anims = [], {}, [], []
    def bone(self, name, pivot, parent=None, rotation=(0, 0, 0)):
        b = {'name': name, 'origin': [round(v, 4) for v in pivot], 'rotation': list(rotation), 'color': 0, 'uuid': uid(), 'export': True,
             'mirror_uv': False, 'isOpen': True, 'locked': False, 'visibility': True, 'autouv': 0, 'children': []}
        self.bones[name] = b
        (self.bones[parent]['children'] if parent else self.root_bones).append(b)
        return name
    def cube(self, bone, frm, to, faces, origin=None, rotation=None, name='cube'):
        e = {'name': name, 'box_uv': False, 'rescale': False, 'locked': False, 'render_order': 'default', 'allow_mirror_modeling': True,
             'from': [round(v, 4) for v in frm], 'to': [round(v, 4) for v in to], 'autouv': 0, 'color': 0,
             'origin': [round(v, 4) for v in (origin if origin is not None else [(frm[i] + to[i]) / 2 for i in range(3)])],
             'faces': faces, 'type': 'cube', 'uuid': uid()}
        if rotation is not None and any(abs(r) > 1e-6 for r in rotation): e['rotation'] = [round(v, 3) for v in rotation]
        self.elements.append(e); self.bones[bone]['children'].insert(0, e['uuid']); return e
    def box(self, bone, frm, to, uv_front, uv_side=None, origin=None, rotation=None, uv_top=None):
        """A cube: front+back faces show uv_front (top of sprite = top of the cube), sides/top/bottom show uv_side."""
        side = uv_side or uv_front; top = uv_top or side
        f = {'north': {'uv': list(uv_front), 'texture': 0}, 'south': {'uv': list(uv_front), 'texture': 0},
             'east': {'uv': list(side), 'texture': 0}, 'west': {'uv': list(side), 'texture': 0},
             'up': {'uv': list(top), 'texture': 0}, 'down': {'uv': list(top), 'texture': 0}}
        return self.cube(bone, frm, to, f, origin, rotation)
    def flat(self, bone, frm, to, uv, origin=None, rotation=None):
        return self.cube(bone, frm, to, {'up': {'uv': list(uv), 'texture': 0}, 'down': {'uv': list(uv), 'texture': 0}}, origin, rotation)
    def plate(self, bone, frm, to, uv, origin=None, rotation=None):
        return self.cube(bone, frm, to, {'north': {'uv': list(uv), 'texture': 0}, 'south': {'uv': list(uv), 'texture': 0}}, origin, rotation)
    def anim(self, name, length, tracks, loop=True):
        """tracks: {bone: {'rotation'|'position'|'scale': [(time, x, y, z), ...]}}; x/y/z may be Molang strings."""
        animators = {}
        for bname, chans in tracks.items():
            kfs = []
            for ch, keys in chans.items():
                for (t, x, y, z) in keys:
                    kfs.append({'channel': ch, 'data_points': [{'x': str(x), 'y': str(y), 'z': str(z)}], 'uuid': uid(), 'time': t,
                                'color': -1, 'interpolation': 'linear'})
            animators[self.bones[bname]['uuid']] = {'name': bname, 'type': 'bone', 'keyframes': kfs}
        self.anims.append({'uuid': uid(), 'name': name, 'loop': 'loop' if loop else 'once', 'override': False, 'length': length, 'snapping': 20,
                           'selected': False, 'anim_time_update': '', 'blend_weight': '', 'start_delay': '', 'loop_delay': '', 'animators': animators})
    def write(self, path):
        tex = self.atlas.img; w, h = tex.size
        b = io.BytesIO(); tex.save(b, 'PNG')
        data = {'meta': {'format_version': '4.10', 'model_format': self.fmt, 'box_uv': False}, 'name': self.name, 'model_identifier': '',
                'visible_box': [1, 1, 0], 'variable_placeholders': '', 'variable_placeholder_buttons': [], 'timeline_setups': [],
                'unhandled_root_fields': {}, 'resolution': {'width': w, 'height': h}, 'elements': self.elements, 'outliner': self.root_bones,
                'textures': [{'path': '', 'name': self.name + '.png', 'folder': '', 'namespace': '', 'id': '0', 'group': '', 'width': w, 'height': h,
                              'uv_width': w, 'uv_height': h, 'particle': False, 'use_as_default': False, 'layers_enabled': False, 'sync_to_project': '',
                              'render_mode': 'default', 'render_sides': 'auto', 'frame_time': 1, 'frame_order_type': 'loop', 'frame_order': '',
                              'frame_interpolate': False, 'visible': True, 'internal': True, 'saved': False, 'uuid': uid(), 'relative_path': '',
                              'source': 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()}],
                'animations': self.anims}
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f: json.dump(data, f)
