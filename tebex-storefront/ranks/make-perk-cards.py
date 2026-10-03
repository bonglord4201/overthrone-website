# Builds easy-to-read 3:4 perk images (900x1200) from the owner's rank artwork:
# the art's own [RANK] title banner and scenery, with the perk list re-set in large, clean text.
# Perk wording is copied from the owner's original perk images.
#   python3 make-perk-cards.py <src-dir>   (expects ronin.webp, valkyrie.webp, ... in src-dir)
#
# Markup in perk lines: {text} = rank colour, a trailing "(...)" = grey note.
import sys, os, re
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H = 900, 1200
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
WHITE, GREY = (242, 238, 230), (150, 146, 140)

RANKS = {
    "ronin": dict(
        color=(255, 70, 85), title=(75, 45, 805, 180), scene=None, skyline=(905, 18, 1640, 178),
        header=None,
        perks=[
            "{[Ronin]} Prefix in Chat & Tab",
            "Have up to {1} Job Active at once",
            "Get {1x} Class Reset Token on Purchase",
            "Create up to {100} Chest Shops",
            "Access to {Ronin} Kit (/kits)",
            "Access to {5} Auction House Slots",
            "Access to {1} Player Vault (/vault)",
            "Access to {3} Reset Vaults",
            "Create up to {2} Homes",
            "Access to basic Player Warps (coming in higher ranks)",
            "Access to join Premium Jobs",
            "Colors in Books",
            "Create Double-Chest Shops",
            "Access to mine spawners with Silk Touch",
            "Basic Hunter & Class info menu access (view your current class, race & skills)",
            "Access to select quality-of-life features and RPG conveniences",
        ]),
    "valkyrie": dict(
        color=(226, 80, 255), title=(75, 45, 915, 180), scene=None, skyline=(915, 18, 1640, 178),
        header=None,
        perks=[
            "{[Valkyrie]} Prefix in Chat & Tab",
            "Have up to {2} Jobs Active at once",
            "Get {2x} Class Reset Tokens on Purchase",
            "Create up to {200} Chest Shops",
            "Create Double-Chest Shops",
            "Access to {Valkyrie} Kit (/kits)",
            "Access to {7} Auction House Slots",
            "Access to {Level 2} Auction House Priority",
            "Access to {2} Player Vaults (/vault)",
            "Access to {5} Reset Vaults",
            "Create up to {3} Homes",
            "Create up to {1} Player Warp",
            "Access to Player Warp Priority (Level 1)",
            "Access to join Premium Jobs",
            "Colors in Books, Signs & Chat",
            "Access to mine spawners with Silk Touch",
            "Expanded utility features and RPG conveniences (see commands)",
        ]),
    "monarch": dict(
        color=(255, 180, 50), title=(75, 45, 885, 180), scene=None, skyline=(905, 18, 1640, 178),
        header=("ALL VALKYRIE PERKS, AND:", (226, 80, 255)),
        perks=[
            "{[Monarch]} Prefix in Chat & Tab",
            "Have up to {3} Jobs Active at once",
            "Get {3x} Class Reset Tokens on Purchase",
            "Create up to {300} Chest Shops",
            "Create and manage Double-Chest Shops",
            "Access to {Monarch} Kit (/kits)",
            "Access to {11} Auction House Slots",
            "Access to {Level 3} Auction House Priority",
            "Access to {3} Player Vaults (/vault)",
            "Access to {7} Reset Vaults",
            "Create up to {4} Homes",
            "Create up to {2} Player Warps",
            "Access to {Level 1} Player Warp Priority",
            "Access to additional RPG utilities and convenience features",
            "Expanded chat formatting options (colors, bold, italics, etc.)",
            "Access to Ender Chest and Anvil via commands (see commands)",
            "Access to item rename, disposal and inventory management features",
        ]),
    "godborn": dict(
        color=(255, 214, 80), title=(105, 70, 975, 215), scene=(1110, 0, 1594, 987), skyline=None,
        header=("ALL MONARCH PERKS, AND:", (255, 180, 50)),
        perks=[
            "{[Godborn]} Prefix in Chat & Tab",
            "Have up to {4} Jobs Active at once",
            "Get {4x} Class Reset Tokens on Purchase",
            "Create up to {500} Chest Shops",
            "Create Remote Chest Shops up to {50} Blocks Away",
            "Create up to {3} Player Warps",
            "Access to {Godborn} Kit (/kits)",
            "Access to {11} Auction House Slots",
            "Access to {Level 4} Auction House Priority",
            "Access to {Level 2} Player Warp Priority",
            "Access to {5} Player Vaults (/vault)",
            "Access to {9} Reset Vaults",
            "Create up to {5} Homes",
            "Mine spawners without using Silk Touch",
        ]),
    "overlord": dict(
        color=(255, 60, 50), title=(95, 35, 965, 180), scene=(900, 0, 1774, 887), skyline=None,
        header=("ALL GODBORN PERKS, AND:", (255, 214, 80)),
        perks=[
            "{[Overlord]} Prefix in Chat & Tab",
            "Have up to {5} Jobs Active at once",
            "Have up to {2} Classes & Abilities at once",
            "Keep EXP on Death",
            "Get {5x} Class Reset Tokens on Purchase",
            "Create an {Unlimited} amount of Chest Shops",
            "Create up to {4} Player Warps",
            "Create Remote Chest Shops up to {200} Blocks Away",
            "Access to {Overlord} Kit (/kits)",
            "Access to {15} Auction House Slots",
            "Access to {Level 5} Auction House Priority",
            "Access to {Level 3} Player Warp Priority",
            "Access to {7} Player Vaults",
            "Access to {12} Reset Vaults",
            "Create up to {6} Homes",
            "Customize Armorstands",
            "Custom chat formatting",
        ]),
}


def cover(img, w, h):
    s = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    l, t = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((l, t, l + w, t + h))


def runs(line, color):
    """Split a perk line into (text, colour) runs."""
    note = None
    m = re.search(r"\s(\([^)]*\))$", line)
    if m and not line.endswith("{" + m.group(1) + "}"):
        note, line = m.group(1), line[: m.start()]
    out = []
    for part in re.split(r"(\{[^}]*\})", line):
        if part:
            out.append((part[1:-1], color) if part.startswith("{") else (part, WHITE))
    if note:
        out.append((" " + note, GREY))
    return out


def wrap(rs, font, maxw):
    """Word-wrap runs into lines of runs."""
    words = []
    for text, col in rs:
        for i, wd in enumerate(re.split(r"(\s+)", text)):
            if wd:
                words.append((wd, col))
    lines, cur, cw = [], [], 0
    for wd, col in words:
        ww = font.getlength(wd)
        if cur and cw + ww > maxw and not wd.isspace():
            lines.append(cur)
            cur, cw = [], 0
        if not cur and wd.isspace():
            continue
        cur.append((wd, col))
        cw += ww
    if cur:
        lines.append(cur)
    return lines


def background(art, r):
    if r["skyline"]:
        sky = ImageEnhance.Brightness(cover(art.crop(r["skyline"]), W, round(H * 0.4))).enhance(1.3)
        tone = art.crop(r["skyline"]).resize((1, 1), Image.BOX).getpixel((0, 0))
        bg = Image.new("RGB", (W, H), tuple(int(c * 0.3) for c in tone))
        fade = Image.linear_gradient("L").resize(sky.size).transpose(Image.FLIP_TOP_BOTTOM).point(lambda v: min(255, v * 1.6))
        bg.paste(sky, (0, 0), fade)
        refl = ImageEnhance.Brightness(sky.transpose(Image.FLIP_TOP_BOTTOM)).enhance(0.45)
        rf = Image.linear_gradient("L").resize(refl.size).point(lambda v: min(255, v * 1.3))
        bg.paste(refl, (0, H - refl.height), rf)
        return bg
    return ImageEnhance.Brightness(cover(art.crop(r["scene"]), W, H)).enhance(0.8)


src, out = sys.argv[1], os.path.join(os.path.dirname(os.path.abspath(__file__)), "perk-cards")
os.makedirs(out, exist_ok=True)
for key, r in RANKS.items():
    art = Image.open(os.path.join(src, f"{key}.webp")).convert("RGB")
    img = background(art, r)

    # title banner from the artwork
    title = art.crop(r["title"])
    tw = W - 70
    title = title.resize((tw, round(title.height * tw / title.width)), Image.LANCZOS)
    top = 34
    img.paste(title, ((W - tw) // 2, top))

    # dark readable panel for the list
    px0, py0, px1, py1 = 34, top + title.height + 22, W - 34, H - 34
    panel = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(panel)
    pd.rectangle((px0, py0, px1, py1), fill=(8, 6, 7, 214), outline=r["color"] + (150,), width=2)
    img = Image.alpha_composite(img.convert("RGBA"), panel)
    d = ImageDraw.Draw(img)

    # largest font size that fits the panel
    maxw = (px1 - px0) - 92
    avail = (py1 - py0) - 56
    for size in range(36, 18, -1):
        font = ImageFont.truetype(BOLD, size)
        hfont = ImageFont.truetype(BOLD, size + 2)
        lh = round(size * 1.3)
        body = [wrap(runs(p, r["color"]), font, maxw) for p in r["perks"]]
        need = sum(len(b) for b in body) * lh + len(body) * round(size * 0.12) + (round(lh * 1.5) if r["header"] else 0)
        if need <= avail:
            break
    y = py0 + 28 + (avail - need) // 2
    if r["header"]:
        d.text((px0 + 30, y), r["header"][0], font=hfont, fill=r["header"][1])
        y += round(lh * 1.5)
    for b in body:
        bx = px0 + 34
        sq = round(size * 0.38)
        by = y + round(size * 0.36)
        d.rectangle((bx, by, bx + sq, by + sq), fill=r["color"])
        for ln in b:
            x = px0 + 34 + sq + 22
            for wd, col in ln:
                d.text((x, y), wd, font=font, fill=col)
                x += font.getlength(wd)
            y += lh
        y += round(size * 0.12)
    img.convert("RGB").save(os.path.join(out, f"{key}-perks-900x1200.jpg"), quality=92)
    print("wrote", key, "font", size)
