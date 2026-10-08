"""Generates 64x64 Minecraft player skins (classic/wide arms) for the OVERTHRONE RPG NPCs.
   python3 marketing/npc-skins/make_skins.py   -> writes <name>.png + preview.png next to this file"""
import os, random
from PIL import Image

OUT = os.path.dirname(os.path.abspath(__file__))

# UV rects (x, y, w, h) per part and face, classic 64x64 layout
def faces(x, y, w, h, d):
    return {"top": (x + d, y, w, d), "bottom": (x + d + w, y, w, d), "right": (x, y + d, d, h),
            "front": (x + d, y + d, w, h), "left": (x + d + w, y + d, d, h), "back": (x + 2 * d + w, y + d, w, h)}
PARTS = {
    "head": faces(0, 0, 8, 8, 8), "hat": faces(32, 0, 8, 8, 8),
    "body": faces(16, 16, 8, 12, 4), "jacket": faces(16, 32, 8, 12, 4),
    "rarm": faces(40, 16, 4, 12, 4), "rsleeve": faces(40, 32, 4, 12, 4),
    "larm": faces(32, 48, 4, 12, 4), "lsleeve": faces(48, 48, 4, 12, 4),
    "rleg": faces(0, 16, 4, 12, 4), "rpants": faces(0, 32, 4, 12, 4),
    "lleg": faces(16, 48, 4, 12, 4), "lpants": faces(0, 48, 4, 12, 4),
}

def hx(c):
    c = c.lstrip("#"); return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))

def shade(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c)

class Skin:
    def __init__(self, seed):
        self.img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        self.rng = random.Random(seed)
    def px(self, x, y, c, a=255):
        self.img.putpixel((x, y), (*c, a))
    def paint(self, part, fn, faces_=None, noise=7):
        """fn(face, u, v, w, h) -> rgb or None (transparent)"""
        for face, (x, y, w, h) in PARTS[part].items():
            if faces_ and face not in faces_:
                continue
            for v in range(h):
                for u in range(w):
                    c = fn(face, u, v, w, h)
                    if c is None:
                        continue
                    n = self.rng.randint(-noise, noise)
                    # light from above/front: sides a bit darker, bottom rows darker
                    k = 1.0
                    if face in ("right", "left"): k *= 0.88
                    if face == "back": k *= 0.82
                    if face == "bottom": k *= 0.7
                    if face not in ("top", "bottom"): k *= 1.04 - 0.1 * (v / max(1, h - 1))
                    c = tuple(max(0, min(255, int(ch * k) + n)) for ch in c)
                    self.px(x + u, y + v, c)
    def front(self, part):
        return PARTS[part]["front"]
    def save(self, name):
        self.img.save(os.path.join(OUT, name + ".png"))
        return self.img

def solid(c):
    return lambda f, u, v, w, h: c

def face_detail(s, skin, eye, hair, brow=None, beard=None, mouth=None, scar=False, eyes_y=4):
    x, y, w, h = s.front("head")
    # eyes (white + iris)
    for ex in (1, 5):
        s.px(x + ex, y + eyes_y, (235, 235, 235)); s.px(x + ex + 1, y + eyes_y, eye)
    if brow:
        for ex in (1, 2, 5, 6): s.px(x + ex, y + eyes_y - 1, brow)
    s.px(x + 3, y + eyes_y + 1, shade(skin, 0.85)); s.px(x + 4, y + eyes_y + 1, shade(skin, 0.85))  # nose
    if mouth:
        for mx in (3, 4): s.px(x + mx, y + eyes_y + 2, mouth)
    if beard:
        for (bx, by) in [(1, 6), (2, 6), (5, 6), (6, 6), (1, 7), (2, 7), (3, 7), (4, 7), (5, 7), (6, 7), (0, 5), (7, 5), (0, 6), (7, 6), (0, 7), (7, 7)]:
            s.px(x + bx, y + by, shade(beard, 0.9 + 0.2 * ((bx + by) % 2)))
        for mx in (2, 3, 4, 5): s.px(x + mx, y + 5, beard)  # moustache
    if scar:
        for (sx, sy) in ((6, 5), (7, 6), (6, 6)): s.px(x + sx, y + sy, (150, 60, 55))

def hair_head(hair, skin, fringe=2, sides=4, back=8):
    def fn(f, u, v, w, h):
        if f == "top": return hair
        if f == "bottom": return skin
        if f == "front": return hair if v < fringe or (v < 4 and u in (0, 7)) else skin
        if f in ("right", "left"): return hair if v < sides or (f == "right" and u < 2 and v < 6) or (f == "left" and u > 1 and v < 6) else skin
        if f == "back": return hair if v < back else skin
    return fn

# ------------------------------------------------------------------ characters
def kael():  # Wayfinder guide: green-brown hooded traveller
    s = Skin(1)
    skin, hair, eye = hx("c99a74"), hx("3b2a1e"), hx("3f7a4a")
    cloak, cloak_d, tunic, leather, boot = hx("2f4a2e"), hx("223822"), hx("6b5236"), hx("4a3524"), hx("2e2219")
    s.paint("head", hair_head(hair, skin, fringe=2))
    face_detail(s, skin, eye, hair, brow=shade(hair, 0.8), mouth=hx("8a5a48"))
    # hood overlay (open face)
    def hood(f, u, v, w, h):
        if f == "front": return cloak if (v < 1 or u == 0 or u == 7) else None
        return cloak if f != "bottom" else None
    s.paint("hat", hood)
    def body(f, u, v, w, h):
        if f == "front":
            if v == 7: return leather
            if u in (3, 4) and v < 7: return shade(tunic, 1.1)
            return tunic
        return tunic
    s.paint("body", body)
    def cape(f, u, v, w, h):
        if f == "back": return cloak if v < 12 else None
        if f == "front": return cloak_d if u in (0, 7) else (hx("b48a3c") if v == 0 and u in (3, 4) else None)  # brooch
        if f in ("right", "left", "top"): return cloak
        return None
    s.paint("jacket", cape)
    arm = lambda f, u, v, w, h: (skin if v >= 10 else (leather if v >= 8 else tunic))
    s.paint("rarm", arm); s.paint("larm", arm)
    sleeve = lambda f, u, v, w, h: cloak if v < 5 else None
    s.paint("rsleeve", sleeve); s.paint("lsleeve", sleeve)
    leg = lambda f, u, v, w, h: boot if v >= 8 else hx("4b4032")
    s.paint("rleg", leg); s.paint("lleg", leg)
    return s.save("wayfinder_kael")

def ryo():  # Hunter Association guildmaster: black hair, crimson & gold coat, scar
    s = Skin(2)
    skin, hair, eye = hx("d9a882"), hx("17141a"), hx("b8202a")
    coat, coat_d, gold, black, boot = hx("8e1620"), hx("5e0d14"), hx("d8a738"), hx("1c1a1f"), hx("16141a")
    s.paint("head", hair_head(hair, skin, fringe=3))
    face_detail(s, skin, eye, hair, brow=hair, mouth=hx("8c5246"), scar=True)
    spikes = lambda f, u, v, w, h: hair if (f == "top" or (f == "front" and v < 2 and u % 2 == 0) or (f in ("left", "right", "back") and v < 3)) else None
    s.paint("hat", spikes)
    def body(f, u, v, w, h):
        if f == "front":
            if u in (3, 4): return gold if v in (1, 4, 7, 10) else black
            if v == 8: return gold
            return coat
        if f == "back" and v == 8: return gold
        return coat
    s.paint("body", body)
    def collar(f, u, v, w, h):
        if f == "front": return gold if (v == 0 and u not in (3, 4)) else (coat_d if v < 11 and u in (2, 5) else None)
        if f == "back": return coat_d if v > 8 else None
        return None
    s.paint("jacket", collar)
    arm = lambda f, u, v, w, h: black if v >= 10 else (gold if v == 9 else coat)
    s.paint("rarm", arm); s.paint("larm", arm)
    pauldron = lambda f, u, v, w, h: (gold if v == 3 else coat_d) if v < 4 else None
    s.paint("rsleeve", pauldron); s.paint("lsleeve", pauldron)
    leg = lambda f, u, v, w, h: boot if v >= 7 else (black if f != "front" or u not in (1, 2) else shade(black, 1.3))
    s.paint("rleg", leg); s.paint("lleg", leg)
    return s.save("guildmaster_ryo")

def brann():  # Blacksmith: big ginger beard, bald, leather apron, bare arms
    s = Skin(3)
    skin, beard, eye = hx("c98e66"), hx("b0512a"), hx("34404d")
    shirt, apron, apron_d, boot = hx("5a4a3f"), hx("6e4a2c"), hx("4d321d"), hx("2b211b")
    def head(f, u, v, w, h):
        if f == "top": return shade(skin, 1.05)
        if f == "back" and v > 5: return beard
        return skin
    s.paint("head", head)
    face_detail(s, skin, eye, beard, brow=beard, beard=beard)
    def body(f, u, v, w, h):
        if f == "front":
            if v < 2: return beard  # beard over chest
            if u in (0, 7) and v < 9: return shirt
            return apron if v < 11 else apron_d
        return shirt
    s.paint("body", body)
    belt = lambda f, u, v, w, h: (hx("8a8f96") if (f == "front" and u in (3, 4)) else apron_d) if v == 7 else None
    s.paint("jacket", belt)
    arm = lambda f, u, v, w, h: hx("3a2e26") if v >= 9 else (shirt if v < 3 else skin)  # rolled sleeves, gloves
    s.paint("rarm", arm); s.paint("larm", arm)
    leg = lambda f, u, v, w, h: boot if v >= 8 else hx("3c3530")
    s.paint("rleg", leg); s.paint("lleg", leg)
    return s.save("blacksmith_brann")

def silas():  # Merchant: purple & gold robes, turban, coin pouch
    s = Skin(4)
    skin, hair, eye = hx("a8714f"), hx("2a1d16"), hx("d1a33a")
    robe, robe_d, gold, wrap, boot = hx("4b2a6b"), hx("33194d"), hx("d6a63b"), hx("e8dcc0"), hx("3a2416")
    s.paint("head", hair_head(hair, skin, fringe=1))
    face_detail(s, skin, eye, hair, brow=hair, mouth=hx("6e3e30"), beard=hx("2a1d16"))
    def turban(f, u, v, w, h):
        if f == "front": return (gold if u in (3, 4) else wrap) if v < 3 else None
        if f == "top": return wrap
        if f in ("left", "right", "back"): return wrap if v < 3 else None
        return None
    s.paint("hat", turban)
    def body(f, u, v, w, h):
        if f == "front":
            if v == 6: return gold
            if u == 3 or u == 4: return gold if v % 3 == 0 else robe_d
            return robe
        return robe
    s.paint("body", body)
    pouch = lambda f, u, v, w, h: (hx("8a5a2e") if (f == "front" and u in (5, 6) and 7 <= v <= 9) else None)
    s.paint("jacket", pouch)
    arm = lambda f, u, v, w, h: skin if v >= 11 else (gold if v in (9, 10) else robe)
    s.paint("rarm", arm); s.paint("larm", arm)
    leg = lambda f, u, v, w, h: boot if v >= 10 else robe_d
    s.paint("rleg", leg); s.paint("lleg", leg)
    robe_skirt = lambda f, u, v, w, h: robe if v < 8 else None
    s.paint("rpants", robe_skirt); s.paint("lpants", robe_skirt)
    return s.save("merchant_silas")

def elara():  # Healer priestess: blonde, white & gold robes
    s = Skin(5)
    skin, hair, eye = hx("efc9a8"), hx("e6c766"), hx("4f86c2")
    robe, robe_d, gold, boot = hx("eae6dc"), hx("c9c3b3"), hx("d9ad45"), hx("8c7a60")
    s.paint("head", hair_head(hair, skin, fringe=2, sides=8, back=8))
    face_detail(s, skin, eye, hair, brow=shade(hair, 0.8), mouth=hx("c4707a"))
    long_hair = lambda f, u, v, w, h: hair if f in ("back", "left", "right") or (f == "front" and (u in (0, 7) or v < 1)) or f == "top" else None
    s.paint("hat", long_hair)
    circlet = PARTS["hat"]["front"]
    for u in range(8): s.px(circlet[0] + u, circlet[1] + 1, gold if u != 3 and u != 4 else hx("4fb3d9"))
    def body(f, u, v, w, h):
        if f == "front":
            if u in (3, 4): return gold
            if v == 6: return gold
            return robe
        if f == "back": return hair if v < 4 else robe
        return robe
    s.paint("body", body)
    arm = lambda f, u, v, w, h: skin if v >= 11 else (gold if v == 10 else robe)
    s.paint("rarm", arm); s.paint("larm", arm)
    leg = lambda f, u, v, w, h: boot if v >= 11 else robe_d
    s.paint("rleg", leg); s.paint("lleg", leg)
    skirt = lambda f, u, v, w, h: robe if v < 10 else None
    s.paint("rpants", skirt); s.paint("lpants", skirt)
    return s.save("healer_elara")

# ------------------------------------------------------------------ preview (front view, 8x)
def front_view(img):
    v = Image.new("RGBA", (16, 32), (0, 0, 0, 0))
    def blit(part, dx, dy, overlay=None):
        x, y, w, h = PARTS[part]["front"]
        v.alpha_composite(img.crop((x, y, x + w, y + h)), (dx, dy))
        if overlay:
            x, y, w, h = PARTS[overlay]["front"]
            v.alpha_composite(img.crop((x, y, x + w, y + h)), (dx, dy))
    blit("head", 4, 0, "hat"); blit("body", 4, 8, "jacket")
    blit("rarm", 0, 8, "rsleeve"); blit("larm", 12, 8, "lsleeve")
    blit("rleg", 4, 20, "rpants"); blit("lleg", 8, 20, "lpants")
    return v

if __name__ == "__main__":
    skins = [kael(), ryo(), brann(), silas(), elara()]
    sheet = Image.new("RGBA", (len(skins) * 20 * 8, 34 * 8), (40, 34, 38, 255))
    for i, sk in enumerate(skins):
        sheet.alpha_composite(front_view(sk).resize((128, 256), Image.NEAREST), (i * 160 + 16, 8))
    sheet.save(os.path.join(OUT, "preview.png"))
    print("ok")
