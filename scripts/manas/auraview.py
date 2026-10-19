# Aura preview renderer (v13): draws aurasim.prims() the way Manas Cosmetics 1.0.6 does, so the previews match the game.
#  - every quad uses the particle's 32x32 alpha mask (nearest sampling, like TextureStateShard(blur=false)), tinted by the
#    vertex colour, NORMAL alpha blending (TRANSLUCENT_TRANSPARENCY), depth-tested against the player and ground, no depth
#    write, sorted far -> near (sortOnUpload)
#  - entity shading: billboards carry the camera-back vector as their normal, flat circle quads point up; both go through
#    vanilla diffuse light min(1, 0.4 + 0.6 * (max(0, n.L0) + max(0, n.L1))). Full-bright only skips the light level.
#  - scene: a daytime spawn (red carpet, gold blocks, sky) and a night scene, because translucent particles look very
#    different on bright and dark backgrounds (the old previews used additive glow on black, which flattered them).
import math, sys, os
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
import sim, aurasim

TEX = {}
def tex(p):
    if p not in TEX: TEX[p] = aurasim.texture(p)
    return TEX[p]
L0 = np.array([0.2, 1.0, -0.7]) / np.linalg.norm([0.2, 1.0, -0.7]); L1 = np.array([-0.2, 1.0, 0.7]) / np.linalg.norm([-0.2, 1.0, 0.7])
def diffuse(n): return min(1.0, 0.4 + 0.6 * (max(0.0, n @ L0) + max(0.0, n @ L1)))

SCENES = {
    'day': dict(sky=((150, 195, 245), (205, 228, 255)), tiles=((158, 32, 36), (142, 26, 30)), edge=(225, 190, 70)),
    'night': dict(sky=((8, 10, 24), (24, 28, 52)), tiles=((48, 44, 52), (40, 37, 45)), edge=(70, 64, 80)),
}

class View:
    def __init__(self, size=360, scale=8.0, yaw=200, pitch=22, scene="day", center_y=-12):
        self.c = sim.Canvas(size, scale, yaw, pitch, center_y); s = SCENES[scene]
        top, bot = np.array(s['sky'][0], float), np.array(s['sky'][1], float)
        k = np.linspace(0, 1, size)[:, None, None]
        self.c.img[:] = (top * (1 - k) + bot * k).astype(np.uint8)
        # ground: 1-block tiles under the feet (model px: Y down, feet at y=24)
        for i in range(-4, 4):
            for j in range(-4, 4):
                col = s['edge'] if (i in (-4, 3) or j in (-4, 3)) else s['tiles'][(i + j) & 1]
                self.c.box(np.eye(4), (i * 16, 24, j * 16), (i * 16 + 16, 26, j * 16 + 16), (*col, 255))
        self.size = size
    def player(self, wings=None, t=0.0, clip='idle'):
        self.c.player()
        for sc, mm in (wings or []): self.c.model(mm, sim.slot_matrix(sc['slot'], mm, sc), t, clip)
    def _cam(self, x, y, z):
        """aura units (blocks, Y up, feet origin) -> (screen x, screen y, depth). Larger depth = nearer."""
        P = np.array([-16 * x, 24 - 16 * y, -16 * z])
        d = np.array([-P[0], -P[1] - self.c.cy, -P[2]]) @ self.c.V.T
        return self.size / 2 + d[0] * self.c.scale, self.size * 0.55 - d[1] * self.c.scale, d[2]
    def aura(self, a, time, vel=(0.0, 0.0, 0.0), origin=(0.0, 0.0, 0.0)):
        self.c.flush()
        T = tex(a.get('particle', 'glow')); col_v = T[:, 16]          # bands sample the texture's middle column (u = 0.5)
        back = np.array([0.0, 0.0, 1.0]) @ self.c.V                    # camera-back vector in world space
        lb = diffuse(back); lf = diffuse(np.array([0.0, 1.0, 0.0]))
        items = []
        for p in aurasim.prims(a, time, vel):
            if p[0] in 'bf':
                _, x, y, z, hs, rgb, al = p; x += origin[0]; y += origin[1]; z += origin[2]
                items.append((self._cam(x, y, z)[2], p[0], (x, y, z, hs), rgb, al))
            else:
                _, pts, y, rgb, al = p; pts = [(px + origin[0], pz + origin[2]) for px, pz in pts]
                zc = np.mean([self._cam(px, y + origin[1], pz)[2] for px, pz in pts])
                items.append((zc, 'q', (pts, y + origin[1]), rgb, al))
        items.sort(key=lambda it: it[0])                               # far first
        img = self.c.img.astype(float); zb = self.c.zb.reshape(self.size, self.size)
        for depth, kind, geo, rgb, al in items:
            rgb = np.asarray(rgb, float)
            if kind == 'b':
                x, y, z, hs = geo; sx, sy, d = self._cam(x, y, z); r = hs * 16 * self.c.scale
                if r < 0.35: continue
                x0, x1 = int(math.floor(sx - r)), int(math.ceil(sx + r)); y0, y1 = int(math.floor(sy - r)), int(math.ceil(sy + r))
                X0, Y0, X1, Y1 = max(x0, 0), max(y0, 0), min(x1, self.size), min(y1, self.size)
                if X0 >= X1 or Y0 >= Y1: continue
                yy, xx = np.mgrid[Y0:Y1, X0:X1] + 0.5
                tu = np.clip(((xx - (sx - r)) / (2 * r) * 32).astype(int), 0, 31); tv = np.clip(((yy - (sy - r)) / (2 * r) * 32).astype(int), 0, 31)
                A = T[tv, tu] * al * (zb[Y0:Y1, X0:X1] < d)
                img[Y0:Y1, X0:X1] = img[Y0:Y1, X0:X1] * (1 - A[..., None]) + (rgb * lb)[None, None, :] * A[..., None]
                continue
            if kind == 'f':
                x, y, z, hs = geo; quad = [(x - hs, z - hs), (x + hs, z - hs), (x + hs, z + hs), (x - hs, z + hs)]; yq = y
                uv = [(0, 0), (1, 0), (1, 1), (0, 1)]
            else:
                quad, yq = geo; uv = [(.5, 0), (.5, 0), (.5, 1), (.5, 1)]
            S = [self._cam(px, yq, pz) for px, pz in quad]
            for tri in ((0, 1, 2), (0, 2, 3)):
                self._tri(img, zb, [S[i] for i in tri], [uv[i] for i in tri], T, rgb * lf, al)
        self.c.img = np.clip(img, 0, 255).astype(np.uint8)
    def _tri(self, img, zb, S, UV, T, rgb, al):
        (x0, y0, d0), (x1, y1, d1), (x2, y2, d2) = S
        X0, X1 = max(int(math.floor(min(x0, x1, x2))), 0), min(int(math.ceil(max(x0, x1, x2))) + 1, self.size)
        Y0, Y1 = max(int(math.floor(min(y0, y1, y2))), 0), min(int(math.ceil(max(y0, y1, y2))) + 1, self.size)
        if X0 >= X1 or Y0 >= Y1: return
        den = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
        if abs(den) < 1e-9: return
        yy, xx = np.mgrid[Y0:Y1, X0:X1] + 0.5
        w0 = ((y1 - y2) * (xx - x2) + (x2 - x1) * (yy - y2)) / den; w1 = ((y2 - y0) * (xx - x2) + (x0 - x2) * (yy - y2)) / den; w2 = 1 - w0 - w1
        inside = (w0 >= 0) & (w1 >= 0) & (w2 >= 0)
        if not inside.any(): return
        u = w0 * UV[0][0] + w1 * UV[1][0] + w2 * UV[2][0]; v = w0 * UV[0][1] + w1 * UV[1][1] + w2 * UV[2][1]
        d = w0 * d0 + w1 * d1 + w2 * d2
        A = T[np.clip((v * 32).astype(int), 0, 31), np.clip((u * 32).astype(int), 0, 31)] * al * inside * (zb[Y0:Y1, X0:X1] < d + 0.5)
        img[Y0:Y1, X0:X1] = img[Y0:Y1, X0:X1] * (1 - A[..., None]) + rgb[None, None, :] * A[..., None]
    def image(self): return Image.fromarray(self.c.img)

def frame(a, time=1.0, scene='day', vel=(0, 0, 0), size=300, scale=7.0, yaw=200, pitch=22, label=None, wings=None):
    v = View(size, scale, yaw, pitch, scene); v.player(wings); v.aura(a, time, vel, origin=(0.0, a.get('offset', 0.0), 0.0)); im = v.image()
    if label: ImageDraw.Draw(im).text((5, 4), label, fill=(255, 255, 255) if scene == 'night' else (20, 20, 30))
    return im
