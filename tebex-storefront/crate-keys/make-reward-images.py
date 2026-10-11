# Reward images for the Armor / Weapon crate key packages: a Minecraft-style "Select ... Reward" menu
# plus a list of every reward with its enchants and key cost.
#   python3 tebex-storefront/crate-keys/make-reward-images.py
# Item pictures are simple pixel drawings made here (no Minecraft textures are copied).
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.dirname(os.path.abspath(__file__))
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# 16x16 sprites. '#' outline, 'a' main, 'b' light, 'c' dark, 'h' handle (wood), 'g' gold, 's' string
SPRITES = {
 'helmet': ["................","................","................","....########....","...#bbaaaaaa#...","..#baaaaaaaac#..","..#ba######ac#..","..#a#......#c#..","..#c#......#c#..","..###......###..","................","................","................","................","................","................"],
 'chest':  ["................","..###......###..","..#b#......#a#..",".#bba#....#aac#.",".#baaa####aaac#.",".##aaaaaaaaaa##.","..#aaaaaaaaac#..","..#baaaaaaaac#..","..#baaaaaaaac#..","..#baaaaaaaac#..","..#aaaaaaaaac#..","..#accccccccc#..","..############..","................","................","................"],
 'legs':   ["................","..############..","..#baaaaaaaac#..","..#baaaaaaaac#..","..#baaa##aaac#..","..#baa#..#aac#..","..#baa#..#aac#..","..#baa#..#aac#..","..#baa#..#aac#..","..#bac#..#bac#..","..#bac#..#bac#..","..####....####..","................","................","................","................"],
 'boots':  ["................","................","................","................","................","...###....###...","...#a#....#a#...","...#a#....#a#...","...#a#....#a#...","..##a#....#a##..",".#baa#....#baa#.",".#bcc#....#bcc#.",".#####....#####.","................","................","................"],
 'elytra': ["................","..###......###..",".#bba#....#abb#.",".#baaa#..#aaab#.","#baaaaa##aaaaab#","#baaaaa##aaaaab#","#baaaac##caaaab#","#baaac#..#caaab#",".#bac#....#cab#.",".#bac#....#cab#.","..#c#......#c#..","..#c#......#c#..","...#........#...","................","................","................"],
 'shield': ["................","..############..","..#hhhhhhhhhh#..","..#hbaaaaaach#..","..#hbaaaaaach#..","..#hbaaaaaach#..","..#hbaaaaaach#..","..#hbaaaaaach#..","..#hbaaaaaach#..","...#hbaaaach#...","...#hbaaaach#...","....#hbaach#....",".....#hhhh#.....","......####......","................","................"],
 'sword':  ["............###.","...........#bb#","..........#bac#",".........#bac#.","........#bac#..",".......#bac#...","..#...#bac#....","..##.#bac#.....","...##bac#......","....#gc#.......","...#hg###......","..#hh#..##.....",".#hh#..........",".###...........","................","................"],
 'axe':    ["................","......####......",".....#bbaa#.....","....#bbaaac#....","....#baaa#h#....","....#baa#hh#....",".....##.#h#.....",".......#h#......","......#h#.......",".....#h#........","....#h#.........","...#h#..........","..#h#...........","..##............","................","................"],
 'pick':   ["................","...#######......","..#bbaaaaa#.....","..##.###hac#....","......#h#.#c#...",".....#h#...#a#..","....#h#.....#b#.","...#h#.......##.","..#h#...........",".#h#............",".##.............","................","................","................","................","................"],
 'hoe':    ["................","....######......","...#bbaaac#.....","...####hhc#.....","......#hh#......",".....#hh#.......","....#hh#........","...#hh#.........","..#hh#..........",".#hh#...........",".###............","................","................","................","................","................"],
 'shovel': ["................","..........###...",".........#bba#..","........#baaac#.","........#aaaac#.",".........#acc#..","........#h##....",".......#h#......","......#h#.......",".....#h#........","....#h#.........","...#h#..........","..##............","................","................","................"],
 'bow':    ["..........####..","........##hhs#..","......##hh.s#...",".....#hh...s#...","....#h....s#....","...#h.....s#....","...#h....s#.....","..#h....s#......","..#h...s#.......","..#h..s#........","..#h.s#.........","...#hs#.........","...##s..........","....##..........","................","................"],
 'crossbow': ["................","..#####.........","..#hhhh###......","...##hhhhh##....","....#h#..#hh#...","....#hh#..#h#...",".....#hh#..#s#..","......#hh#.s#...",".......#hhs#....","........#hh#....",".........#hh#...","..........#hh#..","...........###..","................","................","................"],
 'trident': ["...........#.#.#","...........#a#a#","...........#aaa#","............#a#.","...........#a#..","..........#a#...",".........#a#....","........#a#.....",".......#a#......","......#a#.......",".....#a#........","....#a#.........","...#a#..........","..#a#...........","..##............","................"],
}
NETH = {'a': (78, 72, 76), 'b': (120, 112, 118), 'c': (44, 40, 44)}
WOOD, GOLD, STRING, OUTL = (122, 86, 48), (230, 180, 40), (220, 220, 220), (20, 16, 20)

def sprite(kind, tint=None, size=48):
    base = dict(NETH)
    if kind in ('elytra',): base = {'a': (150, 140, 180), 'b': (200, 190, 230), 'c': (100, 90, 130)}
    if kind == 'trident': base = {'a': (90, 190, 170), 'b': (150, 230, 210), 'c': (50, 130, 120)}
    if kind == 'shield': base = {'a': (140, 140, 150), 'b': (190, 190, 200), 'c': (90, 90, 100)}
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); px = im.load()
    for y, row in enumerate(SPRITES[kind]):
        for x, ch in enumerate(row):
            if ch == '.': continue
            c = {'#': OUTL, 'h': WOOD, 'g': GOLD, 's': STRING}.get(ch) or base[ch]
            if tint and ch in 'ab':   # enchant glint: mix in the item's name colour
                c = tuple(int(c[i] * 0.55 + tint[i] * 0.45) for i in range(3))
            px[x, y] = c + (255,)
    return im.resize((size, size), Image.NEAREST)

def hexrgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

ARMOR = [
 ('helmet', 'Throne Guard Helmet', ['#ff2a2a', '#ffb000'], 'Protection IX, Blast/Fire/Projectile Prot IX, Unbreaking VIII, Mending', 3),
 ('chest', 'Throne Guard Chestplate', ['#ff2a2a', '#ffb000'], 'Protection IX, Blast/Fire/Projectile Prot IX, Unbreaking VIII, Mending', 3),
 ('legs', 'Throne Guard Leggings', ['#ff2a2a', '#ffb000'], 'Protection IX, Blast/Fire/Projectile Prot IX, Unbreaking VIII, Mending', 3),
 ('boots', 'Throne Guard Boots', ['#ff2a2a', '#ffb000'], 'Protection IX, Blast/Fire/Projectile Prot IX, Unbreaking VIII, Mending', 3),
 ('elytra', "Monarch's Wings", ['#c86bff', '#ff7ad9'], 'Unbreaking VIII, Mending', 2),
 ('shield', 'Bastion Shield', ['#ffe36b', '#ff8c00'], 'Unbreaking VIII, Mending', 2),
 ('helmet', 'Abyssal Helm', ['#00e5ff', '#3d5afe'], 'Respiration VIII, Aqua Affinity, Thorns III, Unbreaking VIII, Mending', 4),
 ('legs', 'Shadowstep Leggings', ['#c86bff', '#4a00e0'], 'Swift Sneak III, Thorns III, Unbreaking VIII, Mending', 4),
 ('boots', 'Frostbound Boots', ['#e0f7ff', '#0091ea'], 'Frost Walker X, Feather Falling IX, Thorns III, Unbreaking VIII, Mending', 4),
]
WEAPON = [
 ('sword', "Sovereign's Reach", ['#a855f7', '#ec4899'], 'Sweeping VIII, Fire Aspect II, Knockback VIII, Looting VIII, Unb VIII, Mending', 3),
 ('sword', 'Trinity Edge', ['#ff0000', '#ffee00'], 'Sharpness VIII, Smite X, Bane of Arthropods X', 3),
 ('axe', "Headsman's Cleaver", ['#ff1f1f', '#c0392b'], 'Sharpness VIII, Smite X, Bane X, Unbreaking VIII, Mending', 3),
 ('bow', "Warlord's Longbow", ['#3cff7a', '#00b3ff'], 'Power VIII, Flame, Punch VIII', 3),
 ('pick', 'Throneforged Pick I', ['#00c6ff', '#0072ff'], 'Silk Touch, Efficiency VIII, Unbreaking VIII, Mending', 2),
 ('pick', 'Throneforged Pick II', ['#00c6ff', '#7f00ff'], 'Fortune VIII, Efficiency VIII, Unbreaking VIII, Mending', 2),
 ('axe', 'Throneforged Axe I', ['#f7971e', '#ffd200'], 'Sharpness VIII, Fire Aspect II, Silk Touch, Efficiency VIII, Unb VIII, Mending', 4),
 ('axe', 'Throneforged Axe II', ['#f7971e', '#ff4e50'], 'Fortune VIII, Efficiency VIII, Unbreaking VIII, Mending', 2),
 ('sword', 'Overthrone Blade', ['#ff0000', '#ffd700'], 'Sharp VIII, Smite X, Bane X, Sweeping VIII, Fire Aspect II, Knockback VII, Looting VIII, Unb VIII, Mending', 4),
 ('hoe', 'Throneforged Hoe I', ['#56ab2f', '#a8e063'], 'Silk Touch, Efficiency VIII, Unbreaking VIII, Mending', 2),
 ('hoe', 'Throneforged Hoe II', ['#11998e', '#38ef7d'], 'Fortune VIII, Efficiency VIII, Unbreaking VIII, Mending', 2),
 ('shovel', 'Throneforged Spade I', ['#c79081', '#dfa579'], 'Silk Touch, Efficiency VIII, Unbreaking VIII, Mending', 2),
 ('shovel', 'Throneforged Spade II', ['#b06ab3', '#4568dc'], 'Fortune VIII, Efficiency VIII, Unbreaking VIII, Mending', 2),
 ('bow', 'Bloodmoon Bow', ['#ff3b3b', '#c0392b'], 'Power VIII, Flame, Punch VIII, Infinity, Unbreaking VIII, Mending', 4),
 ('crossbow', 'Dreadforge Crossbow', ['#ff6a00', '#ee0979'], 'Piercing IX, Multishot, Quick Charge V, Unbreaking VIII, Mending', 4),
 ('trident', 'Tidecaller', ['#00f2fe', '#4facfe'], 'Channeling, Impaling X, Loyalty VIII, Unbreaking VIII, Mending', 4),
 ('trident', "Leviathan's Wrath", ['#43e97b', '#0072ff'], 'Riptide VIII, Channeling, Impaling X, Loyalty VIII, Unb VIII, Mending', 4),
]

def gradient_text(d, xy, text, stops, font):
    cols = [hexrgb(s) for s in stops]; x, y = xy; n = max(1, len(text) - 1)
    for i, ch in enumerate(text):
        p = i / n * (len(cols) - 1); s = min(len(cols) - 2, int(p)); u = p - s
        c = tuple(int(cols[s][j] + (cols[s + 1][j] - cols[s][j]) * u) for j in range(3))
        d.text((x + 2, y + 2), ch, font=font, fill=(40, 30, 40))
        d.text((x, y), ch, font=font, fill=c)
        x += d.textlength(ch, font=font)

def slot(d, x, y, s):
    d.rectangle([x, y, x + s, y + s], fill=(139, 139, 139))
    d.line([x, y, x + s, y], fill=(55, 55, 55), width=3); d.line([x, y, x, y + s], fill=(55, 55, 55), width=3)
    d.line([x, y + s, x + s, y + s], fill=(255, 255, 255), width=3); d.line([x + s, y, x + s, y + s], fill=(255, 255, 255), width=3)

def build(name, title, items):
    W, S = 1000, 86
    rows_menu = (len(items) + 8) // 9
    list_h = len(items) * 70
    H = 130 + 70 + rows_menu * (S + 6) + 40 + list_h + 40
    im = Image.new('RGB', (W, H), (19, 26, 46)); d = ImageDraw.Draw(im)
    big, mid, small, tiny = ImageFont.truetype(BOLD, 34), ImageFont.truetype(BOLD, 26), ImageFont.truetype(BOLD, 22), ImageFont.truetype(REG, 18)
    for i, t in enumerate(['ALL PAID KEYS ARE NON-RNG / NON-GAMBLING', 'YOU PICK WHAT YOU WIN']):
        w = d.textlength(t, font=big); d.text(((W - w) / 2, 24 + i * 46), t, font=big, fill=(225, 50, 50))
    # the menu
    mx, my = 40, 130; mw = W - 80; mh = 60 + rows_menu * (S + 6) + 14
    d.rectangle([mx, my, mx + mw, my + mh], fill=(198, 198, 198), outline=(0, 0, 0), width=3)
    d.text((mx + 20, my + 14), 'Select ', font=mid, fill=(64, 64, 64))
    d.text((mx + 20 + d.textlength('Select ', font=mid), my + 14), title, font=mid, fill=(150, 60, 160) if 'Armor' in title else (200, 110, 20))
    for i, it in enumerate(items):
        x = mx + 24 + (i % 9) * (S + 14); y = my + 56 + (i // 9) * (S + 6)
        slot(d, x, y, S)
        sp = sprite(it[0], hexrgb(it[2][0]), 70); im.paste(sp, (x + 8, y + 8), sp)
    # the list
    y = my + mh + 30
    for it in items:
        sp = sprite(it[0], hexrgb(it[2][0]), 52); im.paste(sp, (50, y + 4), sp)
        gradient_text(d, (120, y), it[1], it[2], small)
        fs = 18   # shrink long enchant lists so they fit before the key cost
        while fs > 12 and d.textlength(it[3], font=ImageFont.truetype(REG, fs)) > W - 120 - 150: fs -= 1
        d.text((120, y + 30), it[3], font=ImageFont.truetype(REG, fs), fill=(190, 196, 210))
        cost = f'{it[4]} keys'; w = d.textlength(cost, font=small)
        d.text((W - 50 - w, y + 12), cost, font=small, fill=(255, 210, 80))
        y += 70
    im.save(os.path.join(OUT, f'{name}-rewards.png'))

build('armor', 'Armor Crate Reward', ARMOR)
build('weapon', 'Weapon Crate Reward', WEAPON)
print('wrote armor-rewards.png, weapon-rewards.png')
