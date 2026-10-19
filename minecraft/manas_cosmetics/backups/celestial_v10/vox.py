# Solid plate sculpting for Manas Cosmetics (cuboids only, see minecraft/manas_cosmetics/MODEL-CONSTRAINTS.md).
# A plate = a 2D silhouette (polygons, even-odd so holes work) rasterised at RES px, cut into stepped cuboid strips with
# real thickness. Plates are built from LAYERS (e.g. a gold frame layer with the full outline, then an ivory layer inset
# by 1 px and raised in front), so trims are real 3D rims. Each strip's front face samples its own slice of a single
# painted texture for the whole layer, so the painting is continuous across strips.
#
# Plate space: x right, y DOWN (like an image), units = model pixels, origin at the plate's top-left. The plate is placed
# with its centre at `c` (model space), front face towards -Z, then rotated by `rot` about `pivot` (default c).
import math
import numpy as np
from PIL import Image
from bb import UV
from art import Canvas, erode

RES = 0.25          # silhouette raster resolution (px)
TD = 4              # texels per px for the painted faces

def F(u): return {'uv': [round(v, 4) for v in u], 'texture': u.tex}

def raster(polys, w, h):
    nx, ny = max(1, int(round(w / RES))), max(1, int(round(h / RES)))
    X, Y = np.meshgrid((np.arange(nx) + 0.5) * RES, (np.arange(ny) + 0.5) * RES)
    inside = np.zeros((ny, nx), bool)
    for poly in polys:
        pts = [(x * w, y * h) for x, y in poly]; n = len(pts)
        for i in range(n):
            x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % n]
            inside ^= ((y1 > Y) != (y2 > Y)) & (X < (x2 - x1) * (Y - y1) / ((y2 - y1) + 1e-12) + x1)
    return inside

def strips(mask, step, quant=None):
    """Rows grouped every `step` px; runs of filled cells in each band -> rects (x0, y0, x1, y1) in px; equal bands merged."""
    k = max(1, int(round(step / RES))); ny, nx = mask.shape
    bands = []
    for r0 in range(0, ny, k):
        band = mask[r0:r0 + k].all(0) if mask[r0:r0 + k].shape[0] else np.zeros(nx, bool)
        runs, x = [], 0
        while x < nx:
            if band[x]:
                x0 = x
                while x < nx and band[x]: x += 1
                runs.append((x0, x))
            else: x += 1
        bands.append((r0, min(ny, r0 + k), tuple(runs)))
    if quant:
        q = quant / RES
        bands = [(r0, r1, tuple((int(round(a / q) * q), int(round(b / q) * q)) for a, b in runs if round(b / q) > round(a / q))) for r0, r1, runs in bands]
        quant = None
    out = []; i = 0
    while i < len(bands):
        r0, r1, runs = bands[i]; j = i + 1
        while j < len(bands) and bands[j][2] == runs: r1 = bands[j][1]; j += 1
        for (a, b) in runs:
            xa, xb = a * RES, b * RES
            if quant: xa, xb = round(xa / quant) * quant, round(xb / quant) * quant
            if xb > xa: out.append((xa, r0 * RES, xb, r1 * RES))
        i = j
    return out

class Sculptor:
    def __init__(self, m, k, ydown=False):
        self.m, self.k, self.ydown = m, k, ydown
        self.cache = {}
    def _tex(self, key, w, h, mask, painter, glow):
        ck = (key, round(w, 3), round(h, 3))
        if ck not in self.cache:
            tw, th = max(2, int(round(w * TD))), max(2, int(round(h * TD)))
            # mask at texture resolution (nearest from the raster)
            my = (np.minimum(mask.shape[0] - 1, (np.arange(th) + 0.5) / TD / RES)).astype(int)
            mx = (np.minimum(mask.shape[1] - 1, (np.arange(tw) + 0.5) / TD / RES)).astype(int)
            tm = mask[my][:, mx]
            c = Canvas(tw, th)
            painter(c, tm)
            main, g = c.images()
            uv = self.m.atlas.add(main) if not glow else self.m.glow_atlas().add(main)
            guv = self.m.glow_atlas().add(g) if (g is not None and not glow) else None
            self.cache[ck] = (uv, guv)
        return self.cache[ck]
    def plate(self, bone, c, w, h, polys, layers, rot=(0, 0, 0), pivot=None, key=None, step=0.5):
        """layers: list of dict(inset=px, z=front offset (negative = towards the viewer), t=thickness, paint=fn(canvas, mask),
        side=uv for the sides, back=uv or None, glow=bool). Returns nothing; adds cubes to `bone`."""
        base = raster(polys, w, h)
        piv = list(pivot or c)
        x0w, y0w = c[0] - w / 2, c[1] - h / 2
        for li, L in enumerate(layers):
            mask = base.copy()
            for _ in range(int(round(L.get('inset', 0) / RES))): mask = erode(mask)
            if not mask.any(): continue
            uv, guv = self._tex(str(key or polys) + '#%d' % li, w, h, mask, L['paint'], L.get('glow', False))
            u0, v0 = uv[0], uv[1]
            side = L['side']; back = L.get('back') or side
            zf = c[2] + L.get('z', 0.0); zb = zf + L['t']
            for (ax, ay, bx, by) in strips(mask, L.get('step', step), L.get('quant')):
                X0, X1 = x0w + ax, x0w + bx
                if self.ydown: Y0, Y1 = y0w + ay, y0w + by
                else: Y0, Y1 = c[1] + h / 2 - by, c[1] + h / 2 - ay
                tu0, tu1 = u0 + ax * TD, u0 + bx * TD
                tv0, tv1 = v0 + ay * TD, v0 + by * TD
                # north face: u0 sits at X max, v0 at Y max  -> pick the slice so the painting lands where it was drawn
                nu = (tu1, tv1, tu0, tv0) if self.ydown else (tu1, tv0, tu0, tv1)
                north = UV(nu, uv.tex)
                if L.get('back') == 'face':   # the same painting on the back face (seen from the other side)
                    south = UV((tu0, tv1, tu1, tv0) if self.ydown else (tu0, tv0, tu1, tv1), uv.tex)
                else: south = back
                faces = {'north': F(north), 'south': F(south), 'east': F(side), 'west': F(side), 'up': F(side), 'down': F(side)}
                self.m.cube(bone, [X0, Y0, zf], [X1, Y1, zb], faces, piv, list(rot))
                if guv is not None:
                    g0, h0 = guv[0], guv[1]
                    gu0, gu1, gv0, gv1 = g0 + ax * TD, g0 + bx * TD, h0 + ay * TD, h0 + by * TD
                    gn = UV((gu1, gv1, gu0, gv0) if self.ydown else (gu1, gv0, gu0, gv1), guv.tex)
                    self.m.cube(bone, [X0, Y0, zf - 0.03], [X1, Y1, zf - 0.01], {'north': F(gn)}, piv, list(rot))

# ---------------------------------------------------------------- painters (pixel art: flat bands, crisp edges, no noise)
def _ramp(col):
    c = np.array(col, float)
    return [c * 0.42, c * 0.68, c, np.clip(c + (255 - c) * 0.3, 0, 255), np.clip(c + (255 - c) * 0.62, 0, 255)]

def bevel_paint(col, shade=None, engrave=True, bands=(0.3, 0.72), gem=None, gem_col=None, setting=None, extra=None):
    """A plate face: three flat value bands top->bottom (shade colour in the lowest band), a 1-texel highlight on the
    top/left edges, a shadow on the bottom/right edges, an engraved line 3 texels inside the outline."""
    def paint(c, m):
        r = _ramp(col); h = c.h
        ys = np.where(m.any(1))[0]
        if not len(ys): return
        y0, y1 = ys.min(), ys.max() + 1; t = (c.Y - y0) / max(1, y1 - y0)
        low = np.array(shade if shade is not None else r[1], float)
        rgb = np.where((t < bands[0])[..., None], r[3], np.where((t < bands[1])[..., None], r[2] * np.ones((c.h, c.w, 1)), low))
        c.rgb[m] = rgb[m]; c.a |= m
        top = m & ~np.roll(m, 1, 0); left = m & ~np.roll(m, 1, 1); bot = m & ~np.roll(m, -1, 0); right = m & ~np.roll(m, -1, 1)
        c.rgb[(top | left) & m] = r[4]; c.rgb[(bot | right) & m] = r[1]
        if engrave:
            e3 = erode(erode(erode(m))); line = e3 & ~erode(e3)
            c.rgb[line] = c.rgb[line] * 0.84
        if gem is not None:
            c.gem(gem[0] * c.w, gem[1] * c.h, gem[2] * min(c.w, c.h), gem_col, 'diamond', setting=setting)
        if extra: extra(c, m)
    return paint

def metal_paint(col):
    def paint(c, m):
        c.metal(m, col, outline=False)
    return paint

def solid_uv(k, key, col, glow=False):
    c = Canvas(2, 2); c.rgb[:] = np.array(col, float); c.a[:] = True
    img = c.images()[0]
    return k.glow(key, img) if glow else k.main(key, img)
