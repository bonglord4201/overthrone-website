# Pixel-art painter for OVERTHRONE v6 cosmetics: draws on a small canvas the way a texture artist would, with shaded
# shapes (bevel: light top/left edge, dark bottom/right edge), dark outlines, 4-5 tone metal ramps, faceted gems with
# highlights, gold filigree scrolls, engraved lines and rivets. Everything that should glow (gems, energy lines, runes) is
# also painted into a separate glow canvas (the model's full-bright *_e texture).
import math
import numpy as np
from PIL import Image

def C(c): return np.array(c[:3], float)
def mix(a, b, t): return C(a) * (1 - t) + C(b) * t
def sh(c, k): return np.clip(C(c) * k, 0, 255)
def lit(c, k): return np.clip(C(c) + (255 - C(c)) * k, 0, 255)

def sd(m, dy, dx):   # shifted mask (out of bounds = False)
    out = np.zeros_like(m); h, w = m.shape
    ys = slice(max(0, dy), h + min(0, dy)); yd = slice(max(0, -dy), h + min(0, -dy))
    xs = slice(max(0, dx), w + min(0, dx)); xd = slice(max(0, -dx), w + min(0, -dx))
    out[ys, xs] = m[yd, xd]; return out

def erode(m): return m & sd(m, 1, 0) & sd(m, -1, 0) & sd(m, 0, 1) & sd(m, 0, -1)
def dilate(m): return m | sd(m, 1, 0) | sd(m, -1, 0) | sd(m, 0, 1) | sd(m, 0, -1)

def ramp(col, n=5):
    """dark outline, shadow, base, light, highlight."""
    return [sh(col, 0.38), sh(col, 0.7), C(col), lit(col, 0.28), lit(col, 0.6)][:n]

class Canvas:
    def __init__(self, w, h, bg=None):
        self.w, self.h = w, h
        self.rgb = np.zeros((h, w, 3)); self.a = np.zeros((h, w), bool)
        self.grgb = np.zeros((h, w, 3)); self.ga = np.zeros((h, w), bool)
        Y, X = np.mgrid[0:h, 0:w]; self.X, self.Y = X + 0.5, Y + 0.5
        if bg is not None: self.fill(np.ones((h, w), bool), bg, grad=0.18)
    # ---------------------------------------------------------------- masks
    def m_rect(self, x0, y0, x1, y1): return (self.X >= x0) & (self.X < x1) & (self.Y >= y0) & (self.Y < y1)
    def m_poly(self, pts):
        inside = np.zeros((self.h, self.w), bool); n = len(pts); px, py = self.X, self.Y
        for i in range(n):
            x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % n]
            inside ^= ((y1 > py) != (y2 > py)) & (px < (x2 - x1) * (py - y1) / ((y2 - y1) + 1e-12) + x1)
        return inside
    def m_circle(self, cx, cy, r): return (self.X - cx) ** 2 + (self.Y - cy) ** 2 < r * r
    def m_ring(self, cx, cy, r0, r1):
        d = np.sqrt((self.X - cx) ** 2 + (self.Y - cy) ** 2); return (d >= r0) & (d < r1)
    def m_line(self, pts, w=1.0):
        m = np.zeros((self.h, self.w), bool)
        for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
            dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy + 1e-9
            t = np.clip(((self.X - ax) * dx + (self.Y - ay) * dy) / L2, 0, 1)
            m |= np.hypot(self.X - (ax + t * dx), self.Y - (ay + t * dy)) <= w / 2 + 0.02
        return m
    # ---------------------------------------------------------------- painting
    def fill(self, m, col, grad=0.0, outline=False, bevel=False, glow=False):
        """Fill mask m: vertical gradient (top lighter by grad), optional bevel edges and a dark outline around it."""
        if not m.any(): return
        ys = np.where(m.any(1))[0]; y0, y1 = ys.min(), ys.max() + 1
        t = np.clip((self.Y - y0) / max(1, y1 - y0), 0, 1)[..., None]
        c = np.clip(C(col) * (1 + grad * (0.5 - t) * 2), 0, 255) if grad else C(col) * np.ones((self.h, self.w, 1))
        if bevel:
            r = ramp(col)
            top = m & ~sd(m, 1, 0); left = m & ~sd(m, 0, 1); bot = m & ~sd(m, -1, 0); right = m & ~sd(m, 0, -1)
            c = np.where((top | left)[..., None], r[3], c); c = np.where((bot | right)[..., None], r[1], c)
            c = np.where((top & left)[..., None], r[4], c)
        self.rgb[m] = c[m]; self.a |= m
        if glow: self.grgb[m] = c[m]; self.ga |= m
        if outline:
            o = dilate(m) & ~m
            self.rgb[o] = ramp(col)[0] if outline is True else C(outline); self.a |= o
            if glow: self.grgb[o] = ramp(col)[1]; self.ga |= o
    def metal(self, m, col, outline=True, glow=False):
        """Polished metal (gold / silver): bright streak in the upper third, darker lower part, bevel, outline."""
        if not m.any(): return
        r = ramp(col)
        ys = np.where(m.any(1))[0]; y0, y1 = ys.min(), ys.max() + 1
        t = np.clip((self.Y - y0) / max(1, y1 - y0), 0, 1)
        c = np.where((t < 0.35)[..., None], r[3], np.where((t < 0.7)[..., None], r[2] * np.ones((self.h, self.w, 1)), r[1]))
        top = m & ~sd(m, 1, 0); left = m & ~sd(m, 0, 1); bot = m & ~sd(m, -1, 0); right = m & ~sd(m, 0, -1)
        c = np.where((top | left)[..., None], r[4], c); c = np.where((bot | right)[..., None], r[1] * 0.85, c)
        self.rgb[m] = c[m]; self.a |= m
        if glow: self.grgb[m] = c[m]; self.ga |= m
        if outline:
            o = dilate(m) & ~m; self.rgb[o] = r[0]; self.a |= o
    def line(self, pts, col, w=1.0, metal=True, glow=False, outline=True):
        m = self.m_line(pts, w)
        if metal: self.metal(m, col, outline=outline, glow=glow)
        else: self.fill(m, col, outline=outline, glow=glow)
    def gem(self, cx, cy, r, col, shape='diamond', glow=True, setting=None):
        """Faceted gem: 4 facets (light top-left .. dark bottom-right), white glint, dark outline, optional gold setting."""
        if setting is not None:
            sm = self._gem_mask(cx, cy, r + 1.0, shape); self.metal(sm, setting)
        m = self._gem_mask(cx, cy, r, shape)
        rr = ramp(col)
        dx, dy = self.X - cx, self.Y - cy
        c = np.where(((dx < 0) & (dy < 0))[..., None], rr[4], np.where(((dx >= 0) & (dy < 0))[..., None], rr[3], np.where(((dx < 0) & (dy >= 0))[..., None], rr[2], rr[1])))
        core = (np.abs(dx) + np.abs(dy) < r * 0.45) if shape == 'diamond' else (dx * dx + dy * dy < (r * 0.45) ** 2)
        c = np.where(core[..., None], rr[3], c)
        self.rgb[m] = c[m]; self.a |= m
        gl = (np.abs(dx + r * 0.35) < 0.6) & (np.abs(dy + r * 0.35) < 0.6) & m
        self.rgb[gl] = (255, 255, 255)
        if glow: self.grgb[m] = c[m]; self.ga |= m; self.grgb[gl] = (255, 255, 255)
        o = dilate(m) & ~m
        if setting is None: self.rgb[o] = rr[0]; self.a |= o
    def _gem_mask(self, cx, cy, r, shape):
        dx, dy = self.X - cx, self.Y - cy
        if shape == 'diamond': return np.abs(dx) / max(r * 0.75, 0.6) + np.abs(dy) / max(r, 0.6) <= 1.0
        if shape == 'tear': return ((dx * dx + (dy - r * 0.25) ** 2) < (r * 0.75) ** 2) | ((np.abs(dx) < (r * 0.75) * (1 - (-(dy) - r * 0.25) / (r * 1.1))) & (dy < r * 0.25) & (dy > -r * 1.35))
        return dx * dx + dy * dy < r * r
    def scroll(self, cx, cy, r, col, flip=False, turns=1.35, w=1.0):
        """Gold filigree curl (a spiral flourish with a tail)."""
        pts = []
        for i in range(28):
            th = i / 27 * turns * 2 * math.pi
            rad = r * (1 - i / 27 * 0.82)
            x = cx + math.cos(th + math.pi) * rad * (-1 if flip else 1); y = cy + math.sin(th + math.pi) * rad
            pts.append((x, y))
        self.line(pts, col, w)
    def rivet(self, x, y, col):
        m = self.m_rect(x - 0.5, y - 0.5, x + 0.5, y + 0.5); self.rgb[m] = lit(col, 0.6); self.a |= m
        d = self.m_rect(x + 0.5, y + 0.5, x + 1.5, y + 1.5); self.rgb[d & ~self.a | d] = sh(col, 0.5); self.a |= d
    def engrave(self, pts, col, k=0.72):
        m = self.m_line(pts, 1.0) & self.a; self.rgb[m] = self.rgb[m] * k
    def noise(self, k=0.06, seed=0):
        r = np.random.default_rng(seed).random((self.h, self.w)); self.rgb[self.a] = np.clip(self.rgb[self.a] * (1 + (r[self.a] - 0.5) * 2 * k)[:, None], 0, 255)
    def glow_mask(self, m, col):
        self.grgb[m] = C(col); self.ga |= m
    def images(self):
        def img(rgb, a):
            out = np.zeros((self.h, self.w, 4), np.uint8); out[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8); out[..., 3] = np.where(a, 255, 0)
            return Image.fromarray(out, 'RGBA')
        return img(self.rgb, self.a), (img(self.grgb, self.ga) if self.ga.any() else None)
