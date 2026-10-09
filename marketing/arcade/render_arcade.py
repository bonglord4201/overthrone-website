"""Isometric voxel mockup of the RPG-world Arcade & Trade Hall (roof and front wall cut away)."""
from PIL import Image, ImageDraw, ImageFilter
import random
random.seed(4)

W, D = 23, 15          # room width (x) and depth (z)
T = 32                 # tile size in px
blocks = {}            # (x,y,z) -> colour or (colour, glow)

def put(x, y, z, c, glow=False): blocks[(x, y, z)] = (c, glow)

BLACK=(28,24,30); PURP=(96,52,140); MAG=(170,60,160); PLANK=(118,86,58); PLANK2=(104,74,50)
RED=(150,30,36); WALL=(222,218,212); DARK=(64,40,34); GOLD=(240,196,60); GLOW=(255,236,170)
CYAN=(60,200,220); SEA=(190,240,235); BLKSTONE=(48,44,52)

# floor: arcade checker left, planks right, red carpet path in the middle
for x in range(W):
    for z in range(D):
        if 10 <= x <= 12: c = RED
        elif x < 10: c = BLACK if (x + z) % 2 else PURP
        else: c = PLANK if z % 2 else PLANK2
        put(x, 0, z, c)
# back wall + side walls (front wall cut away)
for y in range(1, 6):
    for x in range(W): put(x, y, 0, WALL)
    for z in range(D): put(0, y, z, WALL)
# pillars along the walls
for x in (0, 6, 12, 16, 22):
    for y in range(1, 6): put(x, y, 0, DARK)
for z in (0, 5, 10, 14):
    for y in range(1, 6): put(0, y, z, DARK)
# neon strip along the bottom of the walls (arcade half + left wall)
for x in range(1, 10): put(x, 1, 0, MAG, True)
for z in range(1, D): put(0, 1, z, MAG, True) if z not in (5, 10, 14) else None
# jackpot wall: gold block panel on the back wall, black frame, end rods
for x in range(8, 15):
    for y in range(2, 6):
        put(x, y, 0, BLKSTONE if x in (8, 14) or y in (2, 5) else GOLD, x not in (8, 14) and y not in (2, 5))
for y in (1, 2, 3): put(7, y, 1, (250, 250, 240), True); put(15, y, 1, (250, 250, 240), True)

# gacha machines: 2-tall capsule machines (coloured top, glass dome glow), rows on arcade side
GACHA_COLS = [(220,60,80), (70,140,230), (250,190,40), (90,200,110), (200,90,220), (240,120,40)]
def gacha(x, z, c):
    put(x, 1, z, c); put(x, 2, z, (230,240,255), True); put(x, 3, z, c)
for i, x in enumerate((2, 4, 6, 8)):
    gacha(x, 2, GACHA_COLS[i])
    gacha(x, 12, GACHA_COLS[(i + 2) % 6])
    put(x, 0, 2, GLOW, True); put(x, 0, 12, GLOW, True)
# vending machines: tall boxes with lit front, in the middle aisle of the arcade side
def vend(x, z, c):
    put(x, 1, z, c, False); put(x, 2, z, c, True)
for i, x in enumerate((2, 4, 6, 8)):
    vend(x, 7, [(40,110,200), (200,40,50), (40,160,90), (230,140,30)][i])

# trade stalls on the right: slab counter, barrel, wool awning on posts
AWN = [(200,40,40), (40,90,200), (230,180,40), (40,150,70), (150,60,180), (220,110,30)]
def stall(x0, z0, c):
    for dx in range(3):
        put(x0 + dx, 1, z0, (90,62,40))                   # counter
        put(x0 + dx, 4, z0 - 1, c); put(x0 + dx, 4, z0, c) # awning
    put(x0, 1, z0 - 1, (130,90,50)); put(x0 + 2, 1, z0 - 1, (130,90,50))  # barrels
    for y in (2, 3): put(x0, y, z0, (70,48,34)); put(x0 + 2, y, z0, (70,48,34))  # posts
    put(x0 + 1, 2, z0 - 1, (255,220,150), True)          # lantern
k = 0
for x0 in (14, 18):
    for z0 in (3, 8, 13):
        stall(x0, z0, AWN[k]); k += 1
# hanging lanterns down the middle
for z in (3, 7, 11):
    put(11, 5, z, (255,210,120), True)
# lounge: stair seats + table near the door on the arcade side? -> plants in corners
for (x, z) in ((1, 1), (21, 1), (1, 13)):
    put(x, 1, z, (80,60,40)); put(x, 2, z, (60,150,60))

# ---------- render ----------
def iso(x, y, z):
    return ((x - z) * T, (x + z) * T // 2 - y * T)

def shade(c, f): return tuple(max(0, min(255, int(v * f))) for v in c)

ox, oy = D * T + 80, 6 * T + 150
img = Image.new("RGB", ((W + D) * T + 160, (W + D) * T // 2 + 7 * T + 220), (20, 16, 26))
glow = Image.new("RGB", img.size, (0, 0, 0))
d = ImageDraw.Draw(img); g = ImageDraw.Draw(glow)
for (x, y, z), (c, lit) in sorted(blocks.items(), key=lambda k: (k[0][0] + k[0][2], k[0][1], k[0][0])):
    px, py = iso(x, y, z); px += ox; py += oy
    top = [(px, py), (px + T, py + T // 2), (px, py + T), (px - T, py + T // 2)]
    left = [(px - T, py + T // 2), (px, py + T), (px, py + 2 * T), (px - T, py + T + T // 2)]
    right = [(px, py + T), (px + T, py + T // 2), (px + T, py + T + T // 2), (px, py + 2 * T)]
    jitter = random.uniform(0.95, 1.05)
    d.polygon(top, fill=shade(c, 1.0 * jitter)); d.polygon(left, fill=shade(c, 0.72 * jitter)); d.polygon(right, fill=shade(c, 0.55 * jitter))
    for poly in (top, left, right): d.line(poly + [poly[0]], fill=shade(c, 0.4), width=1)
    if lit:
        g.ellipse([px - 1.4 * T, py - 0.6 * T, px + 1.4 * T, py + 2.4 * T], fill=shade(c, 0.32))
img = Image.blend(img, Image.composite(img, img, Image.new("L", img.size, 255)), 0)
glow = glow.filter(ImageFilter.GaussianBlur(16))
from PIL import ImageChops
img = ImageChops.add(img, glow)

# labels
d = ImageDraw.Draw(img)
try:
    from PIL import ImageFont
    F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 26)
    FB = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 44)
except Exception:
    F = FB = None
def label(x, y, z, text, col):
    px, py = iso(x, y, z); px += ox; py += oy
    tw = d.textlength(text, font=F)
    d.rounded_rectangle([px - tw / 2 - 8, py - 30, px + tw / 2 + 8, py + 2], 6, fill=(0, 0, 0))
    d.text((px - tw / 2, py - 28), text, font=F, fill=col)
label(11, 7.5, 0, "JACKPOT PRIZE WALL", GOLD)
label(5, 4.5, 2, "GACHA ZONE", (230, 120, 240))
label(5, 3.5, 7, "VENDING ROW", CYAN)
label(5, 4.5, 12, "GACHA ZONE", (230, 120, 240))
label(17, 6.5, 3, "TRADE STALLS", (250, 200, 90))
label(11, 1.5, 14, "red carpet entrance", (240, 120, 120))
d.text((40, 30), "OVERTHRONE  •  ARCADE & TRADE HALL", font=FB, fill=(245, 200, 80))
img.save("arcade-mockup.png")
print(img.size)
