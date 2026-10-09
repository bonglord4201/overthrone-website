"""Isometric mockup of the Exchange Counter for the Arcade & Trade Hall."""
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
import random
random.seed(7)
S = 46                      # px per block
boxes = []                  # (x0,y0,z0,x1,y1,z1,colour,glow,decal)
def box(x0, y0, z0, x1, y1, z1, c, glow=False, decal=None): boxes.append((x0, y0, z0, x1, y1, z1, c, glow, decal))
def blk(x, y, z, c, glow=False, decal=None): box(x, y, z, x + 1, y + 1, z + 1, c, glow, decal)

PLANK=(176,128,82); PLANK2=(160,114,72); WALL=(226,220,212); PILLAR=(110,40,36); DARKOAK=(66,44,30)
STRIP=(90,62,40); QUARTZ=(236,230,222); TERRA=(150,60,44); BARREL=(122,86,52); SHELF=(96,66,40)
GOLD=(240,196,60); RED=(160,32,40); GLASS=(200,235,245)
W, D = 9, 8
for x in range(W):
    for z in range(D):
        blk(x, -1, z, PLANK if (x + z) % 2 else PLANK2)
# walls: back (z=0 plane, blocks at z=-1) and left (x=-1)
for y in range(0, 5):
    for x in range(-1, W): blk(x, y, -1, PILLAR if x in (-1, 4, 8) else (DARKOAK if y == 4 else WALL))
    for z in range(0, D): blk(-1, y, z, PILLAR if z in (3, 7) else (DARKOAK if y == 4 else WALL))
# lower wood wainscot band
for x in range(0, W):
    if x not in (4, 8): blk(x, 0, -1, (140, 98, 62))
for z in range(0, D):
    if z not in (3, 7): blk(-1, 0, z, (140, 98, 62))
# raised platform behind the counter (one block step)
for x in range(0, 6):
    for z in range(0, 3): box(x, -0.0, z, x + 1, 0.5, z + 1, DARKOAK)
# L counter: long side z=3 (x 0..5), short side x=5 (z 4..5)
L = [(x, 3) for x in range(0, 6)] + [(5, 4), (5, 5)]
for (x, z) in L:
    corner = (x, z) in ((0, 3), (5, 3), (5, 5))
    box(x, 0, z, x + 1, 0.25, z + 1, TERRA)                      # red trim kick
    box(x, 0.25, z, x + 1, 1.0, z + 1, STRIP if corner else DARKOAK)
    box(x - 0.04 if x == 0 else x, 1.0, z - 0.06, x + 1.04 if x == 5 else x + 1, 1.5, z + 1.06, QUARTZ)  # marble slab top
# glass display case at the front end of the short side
box(5.1, 1.5, 5.1, 5.9, 2.3, 5.9, GLASS, True)
box(5.35, 1.55, 5.35, 5.65, 2.0, 5.65, (120, 220, 255), True)     # diamond sword glint
# till / lectern, bell, candles, item frames on the counter top
box(0.25, 1.5, 3.2, 0.75, 2.0, 3.8, (150, 104, 60))
box(2.35, 1.5, 3.35, 2.65, 1.85, 3.65, GOLD, True)                 # bell
for cx in (1.4, 3.6):
    box(cx, 1.5, 3.42, cx + 0.16, 1.85, 3.58, (240, 230, 200)); box(cx + 0.03, 1.85, 3.45, cx + 0.13, 1.97, 3.55, (255, 200, 90), True)
box(4.2, 1.5, 3.2, 4.8, 1.56, 3.8, (120, 82, 50), False, (200, 60, 220))  # item frame lying flat
# barrels + chiseled bookshelves along the back wall, raised
for x in range(0, 6):
    box(x, 0.5, 0, x + 1, 1.5, 1, BARREL if x % 2 == 0 else SHELF)
    if x % 2 == 0: box(x, 1.5, 0, x + 1, 2.5, 1, SHELF)
# prize wall: item frames on the back wall (decals on wall blocks)
PRIZES = [(80, 200, 255), (250, 200, 40), (220, 60, 80), (120, 220, 120), (200, 90, 220), (240, 140, 40)]
frames = []
for i, x in enumerate((0.15, 1.15, 2.15, 3.15)):
    for j, y in enumerate((2.6, 3.4)):
        frames.append((x, y, PRIZES[(i + j * 2) % 6]))
# Hall Keeper NPC on the platform
box(2.25, 0.5, 1.55, 2.75, 1.25, 1.85, (40, 30, 60))      # legs
box(2.1, 1.25, 1.5, 2.9, 2.1, 1.9, (170, 30, 40))         # robe
box(2.2, 2.1, 1.45, 2.8, 2.7, 1.95, (220, 170, 130))      # head
box(2.15, 2.6, 1.4, 2.85, 2.75, 2.0, (40, 30, 30))        # hair
# hanging lanterns over the counter
for x in (1.2, 3.2, 5.2):
    box(x + 0.27, 3.2, 3.37, x + 0.33, 4.0, 3.43, (60, 60, 60))
    box(x + 0.1, 2.75, 3.2, x + 0.5, 3.2, 3.6, (255, 200, 110), True)
# red carpet in front of the counter
for x in range(0, 5):
    for z in (4, 5): box(x, 0, z, x + 1, 0.06, z + 1, RED)
# potted plant at the corner
box(7.2, 0, 0.2, 7.8, 0.5, 0.8, (150, 80, 50)); box(7.0, 0.5, 0.0, 8.0, 1.6, 1.0, (60, 140, 60))

# ---------- render ----------
def P(x, y, z): return (OX + (x - z) * S, OY + (x + z) * S / 2 - y * S)
def shade(c, f): return tuple(max(0, min(255, int(v * f))) for v in c)
OX, OY = 8.5 * S + 200, 5.2 * S + 210
img = Image.new("RGB", (int(18 * S) + 400, int(10.5 * S) + 380), (22, 17, 26))
glow = Image.new("RGB", img.size, (0, 0, 0))
d, g = ImageDraw.Draw(img), ImageDraw.Draw(glow)
boxes.sort(key=lambda b: ((b[0] + b[3]) / 2 + (b[2] + b[5]) / 2, b[1], (b[0] + b[3]) / 2))
for (x0, y0, z0, x1, y1, z1, c, lit, decal) in boxes:
    j = random.uniform(0.96, 1.04)
    top = [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)]
    left = [P(x0, y1, z1), P(x1, y1, z1), P(x1, y0, z1), P(x0, y0, z1)]
    right = [P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1), P(x1, y0, z0)]
    for poly, f in ((top, 1.0), (left, 0.74), (right, 0.56)):
        d.polygon(poly, fill=shade(c, f * j)); d.line(poly + [poly[0]], fill=shade(c, 0.45), width=1)
    if decal:
        cx, cy = P((x0 + x1) / 2, y1, (z0 + z1) / 2)
        d.ellipse([cx - 9, cy - 5, cx + 9, cy + 5], fill=decal)
    if lit:
        cx, cy = P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
        g.ellipse([cx - 0.9 * S, cy - 0.9 * S, cx + 0.9 * S, cy + 0.9 * S], fill=shade(c, 0.28))
# item frames on the back wall face (z = 0 plane)
for (x, y, col) in frames:
    q = [P(x + 0.1, y + 0.7, 0), P(x + 0.8, y + 0.7, 0), P(x + 0.8, y, 0), P(x + 0.1, y, 0)]
    d.polygon(q, fill=(120, 82, 50)); d.line(q + [q[0]], fill=(70, 46, 28), width=2)
    cx, cy = P(x + 0.45, y + 0.35, 0); d.ellipse([cx - 10, cy - 8, cx + 10, cy + 8], fill=col)
img = ImageChops.add(img, glow.filter(ImageFilter.GaussianBlur(14)))
d = ImageDraw.Draw(img)
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
FH = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 34)
FS = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
FT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
# in-game style hologram floating above the counter
hx, hy = P(3, 6.4, 3.5)
for txt, f, col, dy in (("EXCHANGE COUNTER", FH, (250, 200, 60), 0), ("Prizes • Help • Trades", FS, (200, 200, 200), 42)):
    tw = d.textlength(txt, font=f)
    d.text((hx - tw / 2 + 3, hy + dy + 3), txt, font=f, fill=(40, 30, 10)); d.text((hx - tw / 2, hy + dy), txt, font=f, fill=col)
def label(x, y, z, text, col=(255, 255, 255), dx=0, dy=-40):
    px, py = P(x, y, z); tx, ty = px + dx, py + dy
    d.line([(px, py), (tx, ty + 14)], fill=col, width=2)
    tw = d.textlength(text, font=F)
    d.rounded_rectangle([tx - tw / 2 - 8, ty - 4, tx + tw / 2 + 8, ty + 28], 6, fill=(0, 0, 0))
    d.text((tx - tw / 2, ty), text, font=F, fill=col)
label(0.3, 1.5, 3.9, "marble slab top", (235, 235, 235), -190, -10)
label(0.3, 0.15, 3.9, "red terracotta trim", (240, 120, 100), -170, 70)
label(2.5, 2.4, 1.9, "Hall Keeper NPC", (120, 230, 120), 230, -150)
label(2.5, 1.85, 3.5, "bell", GOLD, 40, 90)
label(5.5, 2.3, 5.5, "glass display case", (150, 220, 255), 200, 10)
label(0.2, 2.5, 0.5, "barrels + shelves", (230, 180, 120), -230, -90)
label(1.6, 3.7, 0.0, "prize wall (item frames)", (230, 140, 240), -150, -120)
label(3.5, 0.06, 5.5, "red carpet", (240, 100, 100), -40, 90)
label(5.5, 3.0, 3.4, "hanging lanterns", (255, 210, 120), 230, -60)
label(1.0, 0.5, 1.0, "raised 1/2 block floor", (200, 170, 140), -250, 30)
d.text((40, 30), "EXCHANGE COUNTER  —  mockup", font=FT, fill=(245, 200, 80))
d.text((40, 82), "L-shaped dark oak counter • raised floor behind it • prizes on the wall", font=FS, fill=(190, 190, 190))
img.save("counter-mockup.png"); print(img.size)
