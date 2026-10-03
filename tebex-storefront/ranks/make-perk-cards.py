# Builds easy-to-read 3:4 perk / command images (900x1200) from the owner's rank artwork:
# the art's own [RANK] title banner and scenery, with the perk list re-set in large, clean text.
# Perk wording is copied from the owner's original perk images.
#   python3 make-perk-cards.py <src-dir>              perk images   (src-dir: ronin.webp, valkyrie.webp, ...)
#   python3 make-perk-cards.py <src-dir> --commands   command images (src-dir: the command artwork)
#   python3 make-perk-cards.py <src-dir> --kits <kit-dir>   kit images (src-dir: perk artwork, kit-dir: ronin.png ... kit screenshots)
#
# Markup in perk lines: {text} = rank colour, a trailing "(...)" = grey note.
import sys, os, re
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H = 900, 1200
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
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

# Command lists, copied from the owner's command images. Higher ranks list what their image lists.
COMMANDS = {
    "ronin": dict(header=None, perks=[
        "{/recipe} | View an item's recipe",
        "{/seen} | View a player's last login",
        "{/craft} | Open a virtual crafting table",
        "{/furnace} | Open a virtual furnace",
        "{/ptime} | Change the time for yourself",
        "{/pweather} | Change the weather for yourself",
    ]),
    "valkyrie": dict(header=None, perks=[
        "{/recipe} | View an item's recipe",
        "{/seen} | View a player's last login",
        "{/craft} | Open a virtual crafting table",
        "{/furnace} | Open a virtual furnace",
        "{/ptime} | Change the time for yourself",
        "{/pweather} | Change the weather for yourself",
        "{/enchantable} | Open a virtual enchanting table",
        "{/grindstone} | Open a virtual grindstone",
        "{/stonecutter} | Open a virtual stonecutter",
        "{/cartographytable} | Open a virtual cartography table",
        "{/loom} | Open a virtual loom",
        "{/smithingtable} | Open a virtual smithing table",
    ]),
    "monarch": dict(header=None, perks=[
        "{/recipe} | View an item's recipe",
        "{/seen} | View a player's last login",
        "{/craft} | Open a virtual crafting table",
        "{/furnace} | Open a virtual furnace",
        "{/ptime} | Change the time for yourself",
        "{/pweather} | Change the weather for yourself",
        "{/enchantable} | Open a virtual enchanting table",
        "{/grindstone} | Open a virtual grindstone",
        "{/stonecutter} | Open a virtual stonecutter",
        "{/cartographytable} | Open a virtual cartography table",
        "{/loom} | Open a virtual loom",
        "{/smithingtable} | Open a virtual smithing table",
        "{/ec} | Open your ender chest",
        "{/anvil} | Open a virtual anvil",
    ]),
    "godborn": dict(header=("ALL MONARCH COMMANDS, AND:", (255, 180, 50)), title=(95, 65, 965, 220), perks=[
        "{/bal <player>} | View other player's balance",
        "{/disposal} | Open a menu that acts as a trash bin",
        "{/clearinventory} | Clears your inventory",
        "{/rename} | Rename the item you are holding",
        "{/tpahere} | Request to teleport a player to you",
        "{/near} | View how many players are near you",
        "{/eglow} | Make yourself glow in different colors",
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


MODE = "commands" if "--commands" in sys.argv else "kits" if "--kits" in sys.argv else "perks"
src = sys.argv[1]
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"{MODE[:-1]}-cards")
os.makedirs(out, exist_ok=True)
for key in (COMMANDS if MODE == "commands" else RANKS):
    r = dict(RANKS[key], **COMMANDS[key]) if MODE == "commands" else RANKS[key]
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

    maxw = (px1 - px0) - 92
    avail = (py1 - py0) - 56
    header = r["header"] or ((f"{key.upper()} COMMANDS", r["color"]) if MODE == "commands" else None)
    if MODE == "kits":
        # the owner's in-game kit preview, enlarged, with a heading and how to claim it
        kit = Image.open(os.path.join(sys.argv[sys.argv.index("--kits") + 1], f"{key}.png")).convert("RGB")
        kw = (px1 - px0) - 60
        kit = kit.resize((kw, round(kit.height * kw / kit.width)), Image.LANCZOS)
        hfont, cfont = ImageFont.truetype(BOLD, 46), ImageFont.truetype(BOLD, 30)
        notes = ["Claim in-game with /kits"] + (["Includes every lower rank kit too"] if key != "ronin" else [])
        block = 46 + 40 + kit.height + 40 + len(notes) * 44
        y = py0 + ((py1 - py0) - block) // 2
        head = f"{key.upper()} KIT"
        d.text(((W - hfont.getlength(head)) / 2, y), head, font=hfont, fill=r["color"])
        y += 46 + 40
        img.paste(kit, ((W - kw) // 2, y))
        d.rectangle(((W - kw) // 2 - 2, y - 2, (W + kw) // 2 + 1, y + kit.height + 1), outline=r["color"], width=2)
        y += kit.height + 40
        for i, n in enumerate(notes):
            d.text(((W - cfont.getlength(n)) / 2, y), n, font=cfont, fill=WHITE if i == 0 else GREY)
            y += 44
    elif MODE == "commands":
        # one block per command: the command in rank colour, its description underneath
        items = [re.match(r"\{(.*)\} \| (.*)", c).groups() for c in r["perks"]]
        for size in range(40, 16, -1):
            font = ImageFont.truetype(BOLD, size)
            dfont = ImageFont.truetype(REG, round(size * 0.8))
            hfont = ImageFont.truetype(BOLD, size)
            while hfont.getlength(header[0]) > maxw + 40:
                hfont = ImageFont.truetype(BOLD, hfont.size - 1)
            lh, dlh, gap = round(size * 1.12), round(size * 0.8 * 1.18), round(size * 0.32)
            need = len(items) * (lh + dlh + gap) - gap + round(size * 1.8)
            if need <= avail and all(dfont.getlength(dsc) <= maxw for _, dsc in items):
                break
        y = py0 + 28 + (avail - need) // 2
        d.text((px0 + 30, y), header[0], font=hfont, fill=header[1])
        y += round(size * 1.8)
        sq = round(size * 0.36)
        for cmd, dsc in items:
            bx = px0 + 34
            d.rectangle((bx, y + round(size * 0.38), bx + sq, y + round(size * 0.38) + sq), fill=r["color"])
            d.text((bx + sq + 22, y), cmd, font=font, fill=r["color"])
            d.text((bx + sq + 22, y + lh), dsc, font=dfont, fill=(205, 200, 192))
            y += lh + dlh + gap
    else:
        for size in range(36, 18, -1):
            font = ImageFont.truetype(BOLD, size)
            hfont = ImageFont.truetype(BOLD, size + 2)
            lh = round(size * 1.3)
            body = [wrap(runs(p, r["color"]), font, maxw) for p in r["perks"]]
            need = sum(len(b) for b in body) * lh + len(body) * round(size * 0.12) + (round(lh * 1.5) if header else 0)
            if need <= avail:
                break
        y = py0 + 28 + (avail - need) // 2
        if header:
            d.text((px0 + 30, y), header[0], font=hfont, fill=header[1])
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
    img.convert("RGB").save(os.path.join(out, f"{key}-{MODE}-900x1200.jpg"), quality=92)
    print("wrote", key, MODE)
