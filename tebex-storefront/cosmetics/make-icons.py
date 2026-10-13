# Pixel-art category icons for the Tebex cosmetics packages (transparent PNG, 512x512).
# Run: python3 make-icons.py   -> icons/*.png
from PIL import Image, ImageFilter
import os
OUT = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(OUT, exist_ok=True)

def render(name, rows, pal, glow=None, size=512):
    h, w = len(rows), len(rows[0])
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        assert len(row) == w, (name, y, len(row))
        for x, ch in enumerate(row):
            if ch != ".":
                img.putpixel((x, y), pal[ch])
    scale = (size - 64) // max(w, h)
    big = img.resize((w * scale, h * scale), Image.NEAREST)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ox, oy = (size - big.width) // 2, (size - big.height) // 2
    if glow:  # soft coloured glow behind the sprite (still a transparent PNG)
        mask = big.split()[3].point(lambda a: 255 if a else 0)
        g = Image.new("RGBA", big.size, glow + (0,))
        g.putalpha(mask)
        layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        layer.paste(g, (ox, oy), g)
        layer = layer.filter(ImageFilter.GaussianBlur(18))
        a = layer.split()[3].point(lambda v: min(255, int(v * 1.6)))
        layer.putalpha(a)
        canvas = Image.alpha_composite(canvas, layer)
    canvas.alpha_composite(big, (ox, oy))
    canvas.save(os.path.join(OUT, name + ".png"))
    print("icons/" + name + ".png")

K = (24, 14, 16, 255)  # outline

# Custom Tags: red name tag with a white label
render("custom-tags", [
    "......kkk.......",
    ".....kgggk......",
    "....kgk.kgk.....",
    "....kgk..kk.....",
    "..kkkkkkkkkkkk..",
    ".krrrrrrrrrrrrk.",
    ".krRRRRRRRRRRrk.",
    ".krRwwwwwwwwRrk.",
    ".krRwbwbbwbwRrk.",
    ".krRwwbwwbwwRrk.",
    ".krRwwwwwwwwRrk.",
    ".krRRRRRRRRRRrk.",
    ".krrrrrrrrrrrrk.",
    ".kddddddddddddk.",
    "..kkkkkkkkkkkk..",
    "................"], {"k": K, "g": (200, 200, 205, 255), "r": (200, 30, 40, 255), "R": (235, 60, 60, 255),
                         "w": (250, 240, 225, 255), "b": (120, 40, 40, 255), "d": (130, 15, 25, 255)}, glow=(255, 60, 60))

# Statuses: oak sign with coloured text lines
render("statuses", [
    "................",
    ".kkkkkkkkkkkkkk.",
    ".koooooooooooOk.",
    ".koaaaaaaaaaaOk.",
    ".koapppcccyyaOk.",
    ".koaaaaaaaaaaOk.",
    ".koaggbbbmmmaOk.",
    ".koaaaaaaaaaaOk.",
    ".kOOOOOOOOOOOOk.",
    ".kkkkkkkkkkkkkk.",
    "......kook......",
    "......kooOk.....",
    "......kooOk.....",
    "......kooOk.....",
    "......kkkkk.....",
    "................"], {"k": K, "o": (196, 150, 90, 255), "O": (140, 100, 55, 255), "a": (225, 185, 120, 255),
                         "p": (255, 80, 160, 255), "c": (255, 170, 60, 255), "y": (255, 230, 80, 255),
                         "g": (90, 230, 120, 255), "b": (70, 190, 255, 255), "m": (190, 110, 255, 255)}, glow=(255, 190, 90))

# Join & Quit Messages: scroll with a green arrow in and a red arrow out
render("join-quit-messages", [
    "................",
    "..kkkkkkkkkkkk..",
    ".kpPPPPPPPPPPpk.",
    ".kkppppppppppkk.",
    "..kppppppppppk..",
    "..kppgpppppppk..",
    "..kpgggggppppk..",
    "..kppgpppppppk..",
    "..kppppppprppk..",
    "..kppprrrrrrpk..",
    "..kppppppprppk..",
    "..kppppppppppk..",
    ".kkppppppppppkk.",
    ".kpPPPPPPPPPPpk.",
    "..kkkkkkkkkkkk..",
    "................"], {"k": K, "p": (245, 225, 180, 255), "P": (205, 175, 120, 255),
                         "g": (60, 210, 90, 255), "r": (230, 60, 60, 255)}, glow=(255, 215, 120))

# Gradient Bundles: bucket full of rainbow paint
render("gradient-bundles", [
    "................",
    "...kkkkkkkkkk...",
    "..kRROOYYGGBBk..",
    "..kRROOYYGGBBk..",
    "..ksssssssssk...",
    "..kSRROOYYGGBk..",
    "...kROOYYGGBk...",
    "...kSRROYYGBk...",
    "...ksssssssk....",
    "...kSsssssssk...",
    "....kSsssssk....",
    "....kSsssssk....",
    "....kSssssk.....",
    "....kkkkkkk.....",
    "................",
    "................"], {"k": K, "s": (190, 195, 205, 255), "S": (140, 145, 160, 255),
                         "R": (240, 60, 70, 255), "O": (255, 150, 40, 255), "Y": (255, 225, 60, 255),
                         "G": (80, 220, 100, 255), "B": (70, 140, 255, 255)}, glow=(200, 120, 255))

# Name Colors: paint brush with a colourful tip
render("name-colors", [
    "...........kkk..",
    "..........kpmk..",
    ".........kpmmk..",
    "........kcppk...",
    ".......kccpk....",
    "......kssck.....",
    ".....ksSsk......",
    "....kwwSk.......",
    "...kwwwk........",
    "..kwwWk.........",
    ".kwwWk..........",
    ".kwWk...........",
    ".kWk............",
    "..k.............",
    "................",
    "................"], {"k": K, "p": (255, 90, 170, 255), "m": (180, 90, 255, 255), "c": (90, 220, 255, 255),
                         "s": (200, 200, 210, 255), "S": (140, 140, 155, 255),
                         "w": (180, 120, 70, 255), "W": (120, 75, 40, 255)}, glow=(255, 100, 200))
# (sprite above is 16 wide; pad rows that are shorter)

# Chat Colors: speech bubble with coloured text
render("chat-colors", [
    "................",
    "..kkkkkkkkkkkk..",
    ".kwwwwwwwwwwwwk.",
    ".kwrrrooyyywwwk.",
    ".kwwwwwwwwwwwwk.",
    ".kwgggbbbmmmmwk.",
    ".kwwwwwwwwwwwwk.",
    ".kwcccpppwwwwwk.",
    ".kwwwwwwwwwwwwk.",
    "..kkkkwwkkkkkk..",
    ".....kwwk.......",
    "....kwwk........",
    "....kkk.........",
    "................",
    "................",
    "................"], {"k": K, "w": (245, 245, 250, 255), "r": (240, 60, 70, 255), "o": (255, 150, 40, 255),
                         "y": (240, 200, 40, 255), "g": (60, 200, 90, 255), "b": (60, 130, 255, 255),
                         "m": (170, 80, 255, 255), "c": (40, 200, 220, 255), "p": (255, 90, 170, 255)}, glow=(120, 200, 255))

# Glow Colors: glowing star
render("glow-colors", [
    ".......kk.......",
    "......kyyk......",
    "......kyyk......",
    ".....kyYYyk.....",
    "kkkkkyYWWYykkkkk",
    "kyyyyYWWWWYyyyyk",
    ".kyyYWWWWWWYyyk.",
    "..kyYWWWWWWYyk..",
    "...kyYWWWWYyk...",
    "...kyYWWWWYyk...",
    "..kyYYWYYWYYyk..",
    "..kyYYykkyYYyk..",
    ".kyYyk....kyYyk.",
    ".kyyk......kyyk.",
    "kkkk........kkkk",
    "................"], {"k": K, "y": (255, 200, 40, 255), "Y": (255, 230, 90, 255), "W": (255, 250, 210, 255)}, glow=(255, 230, 90))
