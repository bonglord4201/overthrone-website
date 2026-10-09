"""Royal / majestic NPC skins for OVERTHRONE.  python3 marketing/npc-skins/make_royal.py"""
import importlib.util, os
from PIL import Image
spec = importlib.util.spec_from_file_location("ms", os.path.join(os.path.dirname(os.path.abspath(__file__)), "make_skins.py"))
ms = importlib.util.module_from_spec(spec); spec.loader.exec_module(ms)
Skin, PARTS, hx, shade, face_detail, hair_head, front_view, OUT = ms.Skin, ms.PARTS, ms.hx, ms.shade, ms.face_detail, ms.hair_head, ms.front_view, ms.OUT

GOLD, GOLD_D, GOLD_L = hx("e0b13e"), hx("a87a22"), hx("ffe08a")
RUBY, SAPPHIRE, EMERALD = hx("c8102e"), hx("2f5fd0"), hx("2fae5a")
ERMINE, ERMINE_SPOT = hx("f2efe8"), hx("1b1b1b")

def crown(s, gem=RUBY, tall=True):
    """Gold crown on the hat layer: band + points + gems."""
    def fn(f, u, v, w, h):
        if f == "top": return None
        if f == "bottom": return None
        if v == 2: return GOLD_D
        if v == 1: return GOLD
        if v == 0 and u % 2 == 0: return GOLD_L
        return None
    s.paint("hat", fn, noise=4)
    x, y, w, h = PARTS["hat"]["front"]
    s.px(x + 3, y + 1, gem); s.px(x + 4, y + 1, gem)
    if tall:
        s.px(x + 3, y + 0, GOLD_L); s.px(x + 4, y + 0, GOLD_L)
    for side in ("left", "right", "back"):
        sx, sy, sw, sh = PARTS["hat"][side]
        s.px(sx + sw // 2, sy + 1, gem)

def ermine(f, u, v, w, h):
    return ERMINE_SPOT if (u + v * 3) % 5 == 0 else ERMINE

def king():  # Crimson-robed king with ermine collar, white beard, gold crown
    s = Skin(11)
    skin, hair, eye = hx("e2b08c"), hx("d9d4cc"), hx("3b5d8f")
    robe, robe_d, under = hx("9b1022"), hx("650a17"), hx("2a2550")
    s.paint("head", hair_head(hair, skin, fringe=1))
    face_detail(s, skin, eye, hair, brow=hair, beard=hair)
    crown(s, RUBY)
    def body(f, u, v, w, h):
        if f == "front":
            if u in (3, 4): return GOLD if v % 3 == 1 else under
            if v == 7: return GOLD
            return robe
        return robe
    s.paint("body", body)
    def mantle(f, u, v, w, h):  # ermine collar + long cape
        if f == "front": return ermine(f, u, v, w, h) if v < 2 else (ermine(f, u, v, w, h) if u in (0, 7) else None)
        if f == "back": return ermine(f, u, v, w, h) if v < 2 else robe_d
        if f in ("left", "right"): return robe_d if v >= 2 else ermine(f, u, v, w, h)
        if f == "top": return ERMINE
        return None
    s.paint("jacket", mantle)
    arm = lambda f, u, v, w, h: skin if v >= 11 else (ERMINE if v in (9, 10) else robe)
    s.paint("rarm", arm); s.paint("larm", arm)
    shoulder = lambda f, u, v, w, h: ermine(f, u, v, w, h) if v < 3 else None
    s.paint("rsleeve", shoulder); s.paint("lsleeve", shoulder)
    leg = lambda f, u, v, w, h: GOLD_D if v >= 11 else robe_d
    s.paint("rleg", leg); s.paint("lleg", leg)
    skirt = lambda f, u, v, w, h: robe if v < 10 else None
    s.paint("rpants", skirt); s.paint("lpants", skirt)
    return s.save("royal_king")

def queen():  # Queen: dark hair, sapphire gown, gold tiara
    s = Skin(12)
    skin, hair, eye = hx("f0cdb0"), hx("2a1a14"), hx("5a3f8f")
    gown, gown_d, gown_l = hx("1f3c8f"), hx("142763"), hx("3b62c9")
    s.paint("head", hair_head(hair, skin, fringe=2, sides=8, back=8))
    face_detail(s, skin, eye, hair, brow=hair, mouth=hx("b8505e"))
    long_hair = lambda f, u, v, w, h: hair if f in ("back", "left", "right") or (f == "front" and u in (0, 7)) else None
    s.paint("hat", long_hair)
    x, y, w, h = PARTS["hat"]["front"]
    for u in range(1, 7): s.px(x + u, y + 1, GOLD)
    for u in (2, 5): s.px(x + u, y + 0, GOLD_L)
    s.px(x + 3, y + 0, SAPPHIRE); s.px(x + 4, y + 0, SAPPHIRE); s.px(x + 3, y + 1, GOLD_L); s.px(x + 4, y + 1, GOLD_L)
    def body(f, u, v, w, h):
        if f == "front":
            if v == 0: return GOLD
            if v == 1 and u in (3, 4): return hx("e8e8f0")  # pearl necklace
            if v == 6: return GOLD
            if u in (3, 4) and v > 6: return gown_l
            return gown
        if f == "back": return hair if v < 5 else gown
        return gown
    s.paint("body", body)
    arm = lambda f, u, v, w, h: skin if v >= 10 or v < 2 else (GOLD if v == 9 else gown_l)
    s.paint("rarm", arm); s.paint("larm", arm)
    leg = lambda f, u, v, w, h: gown_d
    s.paint("rleg", leg); s.paint("lleg", leg)
    skirt = lambda f, u, v, w, h: (GOLD if v == 11 else gown)
    s.paint("rpants", skirt); s.paint("lpants", skirt)
    return s.save("royal_queen")

def overlord():  # Dark emperor: black & gold armour, crimson cape, spiked crown, glowing red eyes
    s = Skin(13)
    skin, hair, eye = hx("c9a083"), hx("0f0d12"), hx("ff2a2a")
    armour, armour_l, cape = hx("1d1b22"), hx("3a3744"), hx("8e0f1c")
    s.paint("head", hair_head(hair, skin, fringe=3))
    face_detail(s, skin, eye, hair, brow=hair, mouth=hx("6e3a34"))
    x, y, w, h = PARTS["head"]["front"]
    for ex in (1, 5): s.px(x + ex, y + 4, eye)  # fully red eyes
    def spikes(f, u, v, w, h):
        if f in ("top", "bottom"): return None
        if v == 2: return GOLD_D
        if v == 1: return armour_l
        if v == 0 and u % 3 == 0: return GOLD
        return None
    s.paint("hat", spikes)
    hx_, hy_, _, _ = PARTS["hat"]["front"]
    s.px(hx_ + 3, hy_ + 1, RUBY); s.px(hx_ + 4, hy_ + 1, RUBY)
    def body(f, u, v, w, h):
        if f == "front":
            if 3 <= v <= 5 and 2 <= u <= 5: return GOLD if (u in (2, 5) or v in (3, 5)) else RUBY  # chest emblem
            if v == 8: return GOLD
            return armour_l if (u + v) % 4 == 0 else armour
        return armour
    s.paint("body", body)
    def cape_fn(f, u, v, w, h):
        if f == "back": return cape if v > 0 else GOLD
        if f in ("left", "right"): return shade(cape, 0.8)
        if f == "front": return GOLD if (v == 0 and u in (0, 7)) else None
        return None
    s.paint("jacket", cape_fn)
    arm = lambda f, u, v, w, h: GOLD if v == 8 else (armour_l if v < 4 else armour)
    s.paint("rarm", arm); s.paint("larm", arm)
    pauldron = lambda f, u, v, w, h: (GOLD if v == 3 else armour_l) if v < 4 else None
    s.paint("rsleeve", pauldron); s.paint("lsleeve", pauldron)
    leg = lambda f, u, v, w, h: GOLD_D if v == 6 else (armour if v < 11 else hx("0b0a0e"))
    s.paint("rleg", leg); s.paint("lleg", leg)
    return s.save("royal_overlord")

def knight():  # Royal guard: polished steel, crimson tabard with gold crown emblem, plumed helm
    s = Skin(14)
    steel, steel_d, steel_l, tabard = hx("a9b0ba"), hx("6f7680"), hx("d6dce3"), hx("a3101f")
    def helm(f, u, v, w, h):
        if f == "front":
            if v in (3, 4) and 1 <= u <= 6: return hx("101014")  # visor slit
            if u in (3, 4) and v >= 5: return steel_d
            return steel
        return steel_l if f == "top" else steel
    s.paint("head", helm)
    plume = lambda f, u, v, w, h: (RUBY if f == "top" and u in (3, 4) else (RUBY if f in ("back",) and u in (3, 4) and v < 4 else None))
    s.paint("hat", plume)
    hx_, hy_, _, _ = PARTS["head"]["front"]
    for u in range(8): s.px(hx_ + u, hy_ + 0, GOLD)
    def body(f, u, v, w, h):
        if f == "front":
            if 1 <= u <= 6 and v >= 1:
                if v == 3 and u in (2, 3, 4, 5): return GOLD
                if v == 2 and u in (2, 5): return GOLD
                if v == 2 and u in (3, 4): return GOLD_L
                if v == 7: return GOLD_D
                return tabard
            return steel
        if f == "back" and 1 <= u <= 6 and v >= 1: return tabard
        return steel
    s.paint("body", body)
    arm = lambda f, u, v, w, h: steel_d if v >= 10 else (steel_l if v < 4 else steel)
    s.paint("rarm", arm); s.paint("larm", arm)
    pauldron = lambda f, u, v, w, h: (GOLD if v == 3 else steel_l) if v < 4 else None
    s.paint("rsleeve", pauldron); s.paint("lsleeve", pauldron)
    leg = lambda f, u, v, w, h: steel_d if v >= 9 else (steel_l if v == 4 else steel)
    s.paint("rleg", leg); s.paint("lleg", leg)
    return s.save("royal_knight")

def archmage():  # Royal archmage: violet & gold robe, silver beard, star-embroidered hood
    s = Skin(15)
    skin, beard, eye = hx("dcb293"), hx("cfd3db"), hx("8ad8ff")
    robe, robe_d, star = hx("3b1f6e"), hx("26124a"), hx("ffe08a")
    s.paint("head", hair_head(beard, skin, fringe=1))
    face_detail(s, skin, eye, beard, brow=beard, beard=beard)
    def hood(f, u, v, w, h):
        if f == "front": return (GOLD if v == 0 else robe) if (v < 1 or u in (0, 7)) else None
        if f in ("top", "left", "right", "back"): return star if (u * 7 + v * 3) % 11 == 0 else robe
        return None
    s.paint("hat", hood)
    def body(f, u, v, w, h):
        if f == "front":
            if v < 3 and 2 <= u <= 5: return beard  # long beard
            if u in (3, 4): return GOLD
            if v == 7: return GOLD_D
            return star if (u * 5 + v * 7) % 13 == 0 else robe
        return star if (u * 5 + v * 7) % 13 == 0 else robe
    s.paint("body", body)
    amulet = lambda f, u, v, w, h: (SAPPHIRE if (f == "front" and u in (3, 4) and v == 4) else None)
    s.paint("jacket", amulet)
    arm = lambda f, u, v, w, h: skin if v >= 11 else (GOLD if v == 10 else robe)
    s.paint("rarm", arm); s.paint("larm", arm)
    leg = lambda f, u, v, w, h: robe_d
    s.paint("rleg", leg); s.paint("lleg", leg)
    skirt = lambda f, u, v, w, h: (GOLD if v == 11 else robe)
    s.paint("rpants", skirt); s.paint("lpants", skirt)
    return s.save("royal_archmage")

if __name__ == "__main__":
    skins = [king(), queen(), overlord(), knight(), archmage()]
    sheet = Image.new("RGBA", (len(skins) * 160, 34 * 8), (40, 34, 38, 255))
    for i, sk in enumerate(skins):
        sheet.alpha_composite(front_view(sk).resize((128, 256), Image.NEAREST), (i * 160 + 16, 8))
    sheet.save(os.path.join(OUT, "preview-royal.png"))
    print("ok")
