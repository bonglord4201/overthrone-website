"""Skins for the two in-game guide NPCs.  python3 marketing/npc-skins/make_guides.py
   slr_guide.png      [SLR] Solo Leveling Guide: shadow hunter, black coat, crimson lining, gold trim, System-blue eyes
   tensura_guide.png  [TENSURA] Tensura Guide: sage in a black and gold robe, crimson sash, slime-blue hair and core gem"""
import importlib.util, os
from PIL import Image
spec = importlib.util.spec_from_file_location("ms", os.path.join(os.path.dirname(os.path.abspath(__file__)), "make_skins.py"))
ms = importlib.util.module_from_spec(spec); spec.loader.exec_module(ms)
Skin, PARTS, hx, shade, face_detail, hair_head, front_view, OUT = ms.Skin, ms.PARTS, ms.hx, ms.shade, ms.face_detail, ms.hair_head, ms.front_view, ms.OUT

BLACK, BLACK_L = hx("141116"), hx("24202a")
CRIMSON, CRIMSON_D = hx("b3121f"), hx("6e0a12")
GOLD, GOLD_D = hx("e0b13e"), hx("a87a22")

def slr_guide():  # Shadow hunter in a long black coat
    s = Skin(21)
    skin, hair, eye = hx("e6c2a2"), hx("1a1820"), hx("4fc3ff")
    s.paint("head", hair_head(hair, skin, fringe=2, sides=5))
    face_detail(s, skin, eye, hair, brow=hair, mouth=hx("9a6a58"))
    x, y, w, h = PARTS["head"]["front"]
    for ex in (1, 5): s.px(x + ex, y + 4, hx("bfe9ff"))  # glowing System eyes
    def hood(f, u, v, w, h):  # hood down around the neck + messy fringe
        if f == "front": return hair if v == 0 or (v == 1 and u in (1, 3, 6)) else None
        if f == "back": return BLACK if v >= 6 else None
        if f in ("left", "right"): return BLACK if v >= 6 else None
        return None
    s.paint("hat", hood)
    def body(f, u, v, w, h):
        if f == "front":
            if u in (3, 4): return CRIMSON if v < 11 else BLACK_L  # crimson inner shirt
            if v == 7: return GOLD_D                              # belt
            return BLACK
        return BLACK
    s.paint("body", body)
    def coat(f, u, v, w, h):  # open long coat: crimson lining, gold edge and buttons
        if f == "front":
            if u in (2, 5): return GOLD if v in (2, 5) else CRIMSON_D
            if u in (3, 4): return None
            return BLACK_L if v == 0 else BLACK
        if f == "back": return CRIMSON_D if u in (3, 4) and v > 8 else BLACK
        if f in ("left", "right", "top"): return BLACK
        return None
    s.paint("jacket", coat)
    arm = lambda f, u, v, w, h: skin if v >= 11 else (CRIMSON if v == 10 else BLACK)
    s.paint("rarm", arm); s.paint("larm", arm)
    sleeve = lambda f, u, v, w, h: (GOLD_D if v == 9 else BLACK_L) if v < 10 else None
    s.paint("rsleeve", sleeve); s.paint("lsleeve", sleeve)
    leg = lambda f, u, v, w, h: hx("0d0b0e") if v >= 9 else hx("1d1a20")
    s.paint("rleg", leg); s.paint("lleg", leg)
    tails = lambda f, u, v, w, h: (BLACK if v < 6 else None) if f in ("back", "left", "right") else None
    s.paint("rpants", tails); s.paint("lpants", tails)
    return s.save("slr_guide")

def tensura_guide():  # Sage with slime-blue hair and a core gem
    s = Skin(22)
    skin, hair, eye = hx("f0d6c0"), hx("6fc8f0"), hx("e0b13e")
    hair_d = hx("3f97c8")
    s.paint("head", hair_head(hair, skin, fringe=2, sides=6, back=8))
    face_detail(s, skin, eye, hair, brow=hair_d, mouth=hx("b07068"))
    long_hair = lambda f, u, v, w, h: (hair if (u + v) % 3 else hair_d) if f in ("back", "left", "right") or (f == "front" and u in (0, 7) and v < 6) else None
    s.paint("hat", long_hair)
    x, y, w, h = PARTS["hat"]["front"]
    for u in range(1, 7): s.px(x + u, y + 0, GOLD_D)  # gold circlet
    s.px(x + 3, y + 0, CRIMSON); s.px(x + 4, y + 0, CRIMSON)
    def body(f, u, v, w, h):
        if f == "front":
            if v == 7: return CRIMSON                       # sash
            if u in (3, 4): return GOLD if v % 3 == 0 else BLACK_L
            return BLACK
        if f == "back" and v == 7: return CRIMSON
        return BLACK
    s.paint("body", body)
    def mantle(f, u, v, w, h):  # gold-trimmed collar and the blue core gem
        if f == "front":
            if v == 3 and u in (3, 4): return hx("49b6ff")
            if v == 0: return GOLD
            return GOLD_D if u in (0, 7) and v < 4 else None
        if f == "back": return BLACK_L if v < 10 else (GOLD_D if v == 10 else None)
        if f in ("left", "right"): return GOLD_D if v == 0 else None
        if f == "top": return GOLD
        return None
    s.paint("jacket", mantle)
    arm = lambda f, u, v, w, h: skin if v >= 11 else (GOLD if v == 10 else BLACK)
    s.paint("rarm", arm); s.paint("larm", arm)
    cuff = lambda f, u, v, w, h: (CRIMSON_D if v in (8, 9) else None)
    s.paint("rsleeve", cuff); s.paint("lsleeve", cuff)
    leg = lambda f, u, v, w, h: BLACK
    s.paint("rleg", leg); s.paint("lleg", leg)
    robe = lambda f, u, v, w, h: (GOLD_D if v == 11 else BLACK_L)
    s.paint("rpants", robe); s.paint("lpants", robe)
    return s.save("tensura_guide")

if __name__ == "__main__":
    skins = [slr_guide(), tensura_guide()]
    sheet = Image.new("RGBA", (len(skins) * 160, 34 * 8), (40, 34, 38, 255))
    for i, sk in enumerate(skins):
        sheet.alpha_composite(front_view(sk).resize((128, 256), Image.NEAREST), (i * 160 + 16, 8))
    sheet.save(os.path.join(OUT, "preview-guides.png"))
    print("ok")
