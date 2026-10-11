# Pixel-art crate key icons for the Tebex key packages (transparent 800x800 PNG, OG-style diagonal key).
#   python3 tebex-storefront/crate-keys/make-key-icons.py
from PIL import Image, ImageDraw
import os, random

OUT = os.path.dirname(os.path.abspath(__file__))
GOLD, GOLD_HI, GOLD_DK, OUTLINE = (246, 190, 40), (255, 232, 120), (176, 116, 18), (58, 36, 10)
STONE, STONE_HI, STONE_DK = (112, 124, 130), (160, 172, 178), (70, 80, 86)
KEYS = {
    'vote':   {'gem': (80, 230, 70), 'gem_hi': (190, 255, 160), 'gem_dk': (30, 140, 40)},
    'armor':  {'gem': (240, 90, 200), 'gem_hi': (255, 190, 240), 'gem_dk': (150, 40, 130)},
    'weapon': {'gem': (255, 140, 30), 'gem_hi': (255, 220, 140), 'gem_dk': (190, 70, 10)},
}

def key_sprite(k):
    W, H = 18, 32
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    px = im.load()
    def put(x, y, c):
        if 0 <= x < W and 0 <= y < H: px[x, y] = c + (255,)
    # head: rounded stone tablet with a gem
    for y in range(0, 13):
        for x in range(2, 16):
            corner = (y in (0, 12)) and (x in (2, 15))
            if corner: continue
            edge = y in (0, 12) or x in (2, 15) or ((y in (1, 11)) and (x in (3, 14))) and False
            put(x, y, OUTLINE if (y in (0, 12) or x in (2, 15)) else STONE)
    for x in range(3, 15): put(x, 1, STONE_HI)
    for y in range(1, 12): put(3, y, STONE_HI)
    for x in range(3, 15): put(x, 11, STONE_DK)
    for y in range(1, 12): put(14, y, STONE_DK)
    # gem (diamond shape) in the middle of the head
    cx, cy = 9, 6
    for dy in range(-4, 5):
        w = 4 - abs(dy)
        for dx in range(-w, w + 1):
            c = k['gem']
            if abs(dx) == w or abs(dy) == 4: c = k['gem_dk']
            elif dx < 0 and dy < 0: c = k['gem_hi']
            put(cx + dx, cy + dy, c)
    # gold shaft
    for y in range(13, 30):
        put(7, y, OUTLINE); put(8, y, GOLD_HI); put(9, y, GOLD); put(10, y, GOLD_DK); put(11, y, OUTLINE)
    for x in range(7, 12): put(x, 30, OUTLINE)
    # teeth
    for ty in (21, 26):
        for y in range(ty, ty + 3):
            for x in range(11, 15):
                put(x, y, OUTLINE if (y in (ty, ty + 2) or x == 14) else GOLD)
        put(11, ty + 1, GOLD)
    return im

def icon(name, k):
    spr = key_sprite(k).resize((18 * 18, 32 * 18), Image.NEAREST).rotate(-38, resample=Image.NEAREST, expand=True)
    out = Image.new('RGBA', (800, 800), (0, 0, 0, 0))
    out.paste(spr, ((800 - spr.width) // 2, (800 - spr.height) // 2), spr)
    d = ImageDraw.Draw(out)
    random.seed(name)
    for _ in range(14):   # little gold sparkles like OG's
        x, y, s = random.randint(120, 680), random.randint(80, 720), random.choice([10, 12, 16])
        if 250 < x < 550 and 200 < y < 600: continue
        d.rectangle([x, y, x + s, y + s], fill=GOLD + (230,))
    out.save(os.path.join(OUT, f'{name}-key-800.png'))

for n, k in KEYS.items(): icon(n, k)
print('wrote', ', '.join(f'{n}-key-800.png' for n in KEYS))
