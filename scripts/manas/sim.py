# Preview renderer that copies how Manas Cosmetics 1.0.6 draws a cosmetic on a player, so the pictures match the game.
# Every rule below is from the mod's decompiled code (client/renderer/CosmeticLayer, BBModelRenderer, BBModelParser,
# PetCosmeticRenderer). Units are model pixels. Player model space: Y points DOWN, -Z is the player's front,
# origin = the neck (head/body pivot), like vanilla's HumanoidModel.
import base64, io, json, math
import numpy as np
from PIL import Image

def T(x, y, z):
    m = np.eye(4); m[:3, 3] = [x, y, z]; return m
def S(x, y, z):
    m = np.eye(4); m[0, 0], m[1, 1], m[2, 2] = x, y, z; return m
def Rx(d):
    a = math.radians(d); c, s = math.cos(a), math.sin(a); m = np.eye(4); m[1, 1], m[1, 2], m[2, 1], m[2, 2] = c, -s, s, c; return m
def Ry(d):
    a = math.radians(d); c, s = math.cos(a), math.sin(a); m = np.eye(4); m[0, 0], m[0, 2], m[2, 0], m[2, 2] = c, s, -s, c; return m
def Rz(d):
    a = math.radians(d); c, s = math.cos(a), math.sin(a); m = np.eye(4); m[0, 0], m[0, 1], m[1, 0], m[1, 1] = c, -s, s, c; return m
def rot_zyx(r):   # BBModelRenderer: mulPose rotateZ, then rotateY, then rotateX
    return Rz(r[2]) @ Ry(r[1]) @ Rx(r[0])

# ---------------------------------------------------------------- Molang-lite (what the mod supports: math.sin/cos in degrees,
# math.abs, math.clamp, query.anim_time/life_time/time, + - * / and brackets)
def molang(expr, t):
    e = expr.replace('query.anim_time', '(%f)' % t).replace('query.life_time', '(%f)' % t).replace('query.time', '(%f)' % t)
    e = e.replace('math.sin', '_sin').replace('math.cos', '_cos').replace('math.abs', 'abs').replace('math.clamp', '_cl')
    return float(eval(e, {'__builtins__': {}}, {'_sin': lambda d: math.sin(math.radians(d)), '_cos': lambda d: math.cos(math.radians(d)),
                                                 'abs': abs, '_cl': lambda v: max(0.0, min(1.0, v)), 'pi': math.pi}))

def num(s):
    try: float(s); return True
    except Exception: return False

class Model:
    """A parsed .bbmodel, the way BBModelParser reads it."""
    def __init__(self, data):
        self.d = data
        self.fmt = data.get('meta', {}).get('model_format', '')
        self.el = {e['uuid']: e for e in data['elements']}
        # every texture, with how the mod draws it (BBModelData.Texture / BBModelRenderer.openPass):
        #   name ending _e (or render_mode emissive) -> full bright; more half-transparent than opaque pixels -> translucent
        self.texs = []
        for t in data['textures']:
            im = np.array(Image.open(io.BytesIO(base64.b64decode(t['source'].split(',', 1)[1]))).convert('RGBA'))
            a = im[:, :, 3]; partial, opaque = int(((a > 0) & (a < 255)).sum()), int((a == 255).sum())
            nm = t.get('name', '').lower().replace('.png', '')
            self.texs.append({'img': im, 'emissive': nm.endswith('_e') or t.get('render_mode') == 'emissive', 'translucent': partial > opaque})
        self.tex = self.texs[0]['img']
        res = data.get('resolution', {})
        self.uvw = res.get('width', self.tex.shape[1]); self.uvh = res.get('height', self.tex.shape[0])
        self.roots = [self._bone(g) for g in data['outliner'] if isinstance(g, dict)]
        loose = [self.el[c] for c in data['outliner'] if isinstance(c, str)]
        if loose: self.roots.append({'name': '__root_loose_cubes__', 'pivot': [0, 0, 0], 'rot': [0, 0, 0], 'cubes': loose, 'children': []})
        self.anims = {a['name']: a for a in data.get('animations', [])}
        self.first_anim = data['animations'][0] if data.get('animations') else None
    def _bone(self, g):
        cubes, kids = [], []
        for c in g.get('children', []):
            if isinstance(c, str): cubes.append(self.el[c])
            else: kids.append(self._bone(c))
        return {'name': g['name'], 'pivot': g.get('origin', [0, 0, 0]), 'rot': g.get('rotation', [0, 0, 0]), 'cubes': cubes, 'children': kids}
    def frames(self, anim, bone, ch):
        if not anim: return []
        for a in anim['animators'].values():
            if a['name'] == bone:
                return sorted([k for k in a['keyframes'] if k['channel'] == ch], key=lambda k: k['time'])
        return []
    def sample(self, anim, bone, ch, t, base):
        fr = self.frames(anim, bone, ch)
        if not fr: return base
        L = anim.get('length', 0) or 0
        tw = t - math.floor(t / L) * L if anim.get('loop') == 'loop' and L > 0 else t
        def ev(k):
            dp = k['data_points'][0]
            return [float(dp[a]) if num(dp[a]) else molang(dp[a], t) for a in 'xyz']
        if tw <= fr[0]['time']: return ev(fr[0])
        prev = fr[0]
        for nx in fr[1:]:
            if tw <= nx['time']:
                sp = nx['time'] - prev['time']; f = 0 if sp == 0 else (tw - prev['time']) / sp
                a, b = ev(prev), ev(nx); return [a[i] + (b[i] - a[i]) * f for i in range(3)]
            prev = nx
        return ev(prev)
    # ---- what BBModelParser precomputes
    def rest_rot(self, bone):   # bakeRestPoseRotation: zero rotation + first anim's first rotation keyframe
        r = bone['rot']
        if not any(r) and self.first_anim:
            fr = self.frames(self.first_anim, bone['name'], 'rotation')
            if fr:
                dp = fr[0]['data_points'][0]; r = [float(dp[a]) if num(dp[a]) else 0.0 for a in 'xyz']
        return r
    def all_cubes(self):
        out = []
        def walk(b):
            out.extend(b['cubes']); [walk(c) for c in b['children']]
        [walk(r) for r in self.roots]; return out
    def avg_centroid_y(self):
        cs = [(c['from'][1] + c['to'][1]) / 2 for c in self.all_cubes()]
        return sum(cs) / len(cs) if cs else 0
    def rest_aabb(self):
        pts = []
        def walk(b, M):
            p = b['pivot']; Mb = M @ T(*p) @ rot_zyx(self.rest_rot(b)) @ T(-p[0], -p[1], -p[2])
            for c in b['cubes']:
                cp = c.get('origin', [0, 0, 0]); Mc = Mb @ T(*cp) @ rot_zyx(c.get('rotation', [0, 0, 0])) @ T(-cp[0], -cp[1], -cp[2])
                f, to = c['from'], c['to']
                for x in (f[0], to[0]):
                    for y in (f[1], to[1]):
                        for z in (f[2], to[2]): pts.append((Mc @ np.array([x, y, z, 1]))[:3])
            for k in b['children']: walk(k, Mb)
        for r in self.roots: walk(r, np.eye(4))
        a = np.array(pts); return list(a.min(0)) + list(a.max(0))

# ---------------------------------------------------------------- slot placement (CosmeticLayer.applySlotTransform + applyDefTransform + applyAutoOrient)
def slot_matrix(slot, model, sidecar):
    off, sc, rot = sidecar.get('offset', [0, 0, 0]), sidecar.get('scale', [1, 1, 1]), sidecar.get('rotation', [0, 0, 0])
    has_off, has_rot = any(off), any(rot)
    D = T(*off) @ S(*sc) @ Rx(rot[0]) @ Ry(rot[1]) @ Rz(rot[2])
    entity_down = model.fmt in ('geckolib_model', 'modded_entity', 'java_block')
    bedrock = model.fmt in ('bedrock', 'bedrock_entity', 'bedrock_block')
    if slot in ('helmet', 'above_head'):
        M = T(0, 4 if slot == 'helmet' else 14.4, 0) @ D
        if not has_off: M = M @ T(0, -3.5 if slot == 'helmet' else -13.0, 0)
        if not has_rot: M = M @ Rx(180) @ Ry(180)
        return M
    if slot == 'back':
        M = T(0, 0, 2) @ D; flip = (1, 1, 1)
        want = (not entity_down) and model.avg_centroid_y() < 0
        if sidecar.get('needs_y_flip') is not None: want = bool(sidecar['needs_y_flip'])   # CosmeticDefinition.needsYFlipOverride
        if not has_rot and want:
            if bedrock: M = M @ Rz(180); flip = (-1, -1, 1)
            else: M = M @ Rx(180); flip = (1, -1, -1)
        if not has_off:
            a = model.rest_aabb(); M = M @ T(0, 4 * flip[1] - (a[1] + a[4]) / 2, 0)
        return M
    if slot == 'orbit':
        return T(0, 8, 0) @ D
    raise ValueError(slot)

# ---------------------------------------------------------------- drawing
FACES = {  # BBModelRenderer.renderCube quad vertex order (v0..v3 get uv (u0,v0) (u1,v0) (u1,v1) (u0,v1))
    'north': lambda x0, y0, z0, x1, y1, z1: [(x1, y1, z0), (x0, y1, z0), (x0, y0, z0), (x1, y0, z0)],
    'south': lambda x0, y0, z0, x1, y1, z1: [(x0, y1, z1), (x1, y1, z1), (x1, y0, z1), (x0, y0, z1)],
    'west': lambda x0, y0, z0, x1, y1, z1: [(x0, y1, z0), (x0, y1, z1), (x0, y0, z1), (x0, y0, z0)],
    'east': lambda x0, y0, z0, x1, y1, z1: [(x1, y1, z1), (x1, y1, z0), (x1, y0, z0), (x1, y0, z1)],
    'up': lambda x0, y0, z0, x1, y1, z1: [(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)],
    'down': lambda x0, y0, z0, x1, y1, z1: [(x0, y0, z1), (x1, y0, z1), (x1, y0, z0), (x0, y0, z0)],
}
class Canvas:
    def __init__(self, size=360, scale=7.0, yaw=0, pitch=10, center_y=-4):
        self.size, self.scale = size, scale
        self.img = np.zeros((size, size, 3), np.uint8); self.img[:] = (30, 30, 38)
        self.late, self.ambient = [], 1.0
        self.zb = np.full((size, size), -1e9)
        # camera: world (display) coords = (-x, -y, -z) of model space (so +Y is up, +Z is the player's front)
        cy, sy = math.cos(math.radians(yaw)), math.sin(math.radians(yaw)); cp, sp = math.cos(math.radians(pitch)), math.sin(math.radians(pitch))
        self.V = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]]) ; self.V = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]]) @ self.V
        self.cy = center_y
    def quad(self, M, v, uv, tex, uvw, uvh, emissive=True, translucent=False):
        P = np.array([(M @ np.array([*p, 1]))[:3] for p in v])
        P = np.c_[-P[:, 0], -P[:, 1] - self.cy, -P[:, 2]] @ self.V.T
        e1, e2 = P[1] - P[0], P[3] - P[0]
        nrm = np.cross(e1, e2); nl = np.linalg.norm(nrm)
        # vanilla-ish entity lighting (two lights from above), only for lit textures
        light = 1.0
        if not emissive and nl > 1e-9:
            nv = nrm / nl; L1 = np.array([0.2, 1.0, -0.7]); L2 = np.array([-0.2, 1.0, 0.7])
            L1 /= np.linalg.norm(L1); L2 /= np.linalg.norm(L2)
            light = min(1.0, 0.4 + 0.6 * (abs(nv @ L1) + abs(nv @ L2)) * 0.5) * self.ambient
        n = int(min(400, max(4, max(np.linalg.norm(e1), np.linalg.norm(e2)) * self.scale * 1.8)))
        a, b = np.meshgrid((np.arange(n) + 0.5) / n, (np.arange(n) + 0.5) / n)
        a, b = a.ravel(), b.ravel()
        pts = P[0] + np.outer(a, e1) + np.outer(b, e2)
        u0, v0, u1, v1 = uv
        th, tw = tex.shape[:2]
        tu = np.clip(((u0 + (u1 - u0) * a) / uvw * tw).astype(int), 0, tw - 1)
        tv = np.clip(((v0 + (v1 - v0) * b) / uvh * th).astype(int), 0, th - 1)
        col = tex[tv, tu].astype(float)
        keep = col[:, 3] > (0 if translucent else 30)
        pts, col = pts[keep], col[keep]
        col[:, :3] *= light
        X = (self.size / 2 + pts[:, 0] * self.scale).astype(int); Y = (self.size * 0.55 - pts[:, 1] * self.scale).astype(int); Z = pts[:, 2]
        ok = (X >= 0) & (X < self.size) & (Y >= 0) & (Y < self.size)
        X, Y, Z, col = X[ok], Y[ok], Z[ok], col[ok]
        if not len(Z): return
        idx = Y * self.size + X
        order = np.argsort(-Z)                       # nearest first
        u, first = np.unique(idx[order], return_index=True)
        sel = order[first]                           # the nearest sample for each pixel
        if translucent:                              # drawn after everything else, blended, no depth write
            self.late.append((u, Z[sel], col[sel])); return
        zf = self.zb.ravel(); imf = self.img.reshape(-1, 3)
        win = Z[sel] > zf[u]
        zf[u[win]] = Z[sel][win]; imf[u[win]] = np.clip(col[sel][win][:, :3], 0, 255)
    def flush(self):
        zf = self.zb.ravel(); imf = self.img.reshape(-1, 3)
        for u, z, col in self.late:
            win = z > zf[u]; a = col[win][:, 3:4] / 255.0
            base = imf[u[win]].astype(float)
            imf[u[win]] = np.clip(base * (1 - a) + col[win][:, :3] * a, 0, 255)   # TRANSLUCENT_TRANSPARENCY: normal alpha blend
        self.late = []
    def box(self, M, f, t, rgba):
        tex = np.array([[rgba]], np.uint8)
        x0, y0, z0 = [min(f[i], t[i]) for i in range(3)]; x1, y1, z1 = [max(f[i], t[i]) for i in range(3)]
        for fn in FACES.values(): self.quad(M, fn(x0, y0, z0, x1, y1, z1), (0, 0, 1, 1), tex, 1, 1, emissive=False)
    def player(self, M0=np.eye(4)):
        skin, shirt, pants, hair = (200, 160, 130, 255), (130, 30, 35, 255), (40, 40, 60, 255), (60, 40, 30, 255)
        self.box(M0, (-4, -8, -4), (4, 0, 4), skin); self.box(M0, (-4, -8.4, -4), (4, -7, 4), hair)
        self.box(M0, (-4, 0, -2), (4, 12, 2), shirt)
        self.box(M0, (-8, 0, -2), (-4, 12, 2), shirt); self.box(M0, (4, 0, -2), (8, 12, 2), shirt)
        self.box(M0, (-4, 12, -2), (0, 24, 2), pants); self.box(M0, (0, 12, -2), (4, 24, 2), pants)
        self.box(M0, (-2.5, -4.5, -4.05), (-1, -3, -4), (20, 20, 20, 255)); self.box(M0, (1, -4.5, -4.05), (2.5, -3, -4), (20, 20, 20, 255))   # eyes on the face (-Z)
    def model(self, model, M, t, anim_name='idle'):
        anim = model.anims.get(anim_name) or (model.first_anim if model.anims else None)
        def walk(b, Mp):
            p = b['pivot']; base = model.rest_rot(b)
            r = model.sample(anim, b['name'], 'rotation', t, base)
            sc = model.sample(anim, b['name'], 'scale', t, [1, 1, 1])
            pos = model.sample(anim, b['name'], 'position', t, [0, 0, 0])
            Mb = Mp @ T(*p) @ rot_zyx(r) @ S(*sc) @ T(*pos) @ T(-p[0], -p[1], -p[2])
            for c in b['cubes']:
                cp = c.get('origin', [0, 0, 0]); Mc = Mb @ T(*cp) @ rot_zyx(c.get('rotation', [0, 0, 0])) @ T(-cp[0], -cp[1], -cp[2])
                f, to = c['from'], c['to']
                x0, y0, z0 = [min(f[i], to[i]) for i in range(3)]; x1, y1, z1 = [max(f[i], to[i]) for i in range(3)]
                for name, fc in c['faces'].items():
                    uv = fc['uv']
                    if uv[0] == uv[2] or uv[1] == uv[3]: continue
                    ti = fc.get('texture', 0); ti = ti if isinstance(ti, int) and 0 <= ti < len(model.texs) else 0
                    tx = model.texs[ti]
                    self.quad(Mc, FACES[name](x0, y0, z0, x1, y1, z1), uv, tx['img'], model.uvw, model.uvh, tx['emissive'], tx['translucent'])
            for k in b['children']: walk(k, Mb)
        for r in model.roots: walk(r, M)
    def image(self): self.flush(); return Image.fromarray(self.img)

def preview(bbmodel_path, sidecar, t=0.0, yaw=180, pitch=12, size=320, scale=6.0, pet=False, anim='idle', dark=False):
    m = Model(json.load(open(bbmodel_path)))
    if pet:   # PetCosmeticRenderer: world space, Y up from the feet, -Z = the pet's front; our canvas flips Y, so S(1,-1,1)
        c = Canvas(size, scale * 1.6, yaw, pitch, center_y=6)
        if dark: c.img[:] = (8, 8, 14); c.ambient = 0.35
        M = S(1, -1, 1) @ S(*sidecar.get('scale', [1, 1, 1]))
        c.model(m, M, t, anim); return c.image()
    c = Canvas(size, scale, yaw, pitch)
    if dark: c.img[:] = (8, 8, 14); c.ambient = 0.35
    c.player()
    c.model(m, slot_matrix(sidecar['slot'], m, sidecar), t, anim)
    return c.image()
