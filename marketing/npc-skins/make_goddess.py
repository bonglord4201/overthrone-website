"""Divine goddess NPC skin.  python3 marketing/npc-skins/make_goddess.py"""
import importlib.util, os
from PIL import Image
spec = importlib.util.spec_from_file_location("ms", os.path.join(os.path.dirname(os.path.abspath(__file__)), "make_skins.py"))
ms = importlib.util.module_from_spec(spec); spec.loader.exec_module(ms)
Skin, PARTS, hx, shade, face_detail, hair_head, front_view, OUT = ms.Skin, ms.PARTS, ms.hx, ms.shade, ms.face_detail, ms.hair_head, ms.front_view, ms.OUT

GOLD, GOLD_L, GOLD_D = hx("f2c14e"), hx("fff1a8"), hx("b8862a")
SKIN, HAIR, HAIR_L = hx("f6dcc6"), hx("f3d26b"), hx("fff0a0")
GOWN, GOWN_S, EYE = hx("fbfaf5"), hx("e6e1d2"), hx("7fe3ff")
FEATHER, FEATHER_S = hx("ffffff"), hx("d9e4f2")

def goddess():
    s = Skin(21)
    # head: long golden hair, glowing eyes, soft lips
    s.paint("head", hair_head(HAIR, SKIN, fringe=2, sides=8, back=8))
    face_detail(s, SKIN, EYE, HAIR, brow=shade(HAIR, 0.8), mouth=hx("d98a96"))
    x, y, _, _ = PARTS["head"]["front"]
    for ex in (1, 5): s.px(x + ex, y + 4, hx("dff8ff"))  # bright glow in both eyes
    # hat layer: flowing hair + radiant crown with rays and a sapphire
    def crown(f, u, v, w, h):
        if f == "top": return HAIR_L if (u + v) % 3 else HAIR
        if f == "bottom": return None
        if v == 0: return GOLD_L if u % 2 == 0 else None          # crown rays
        if v == 1: return GOLD
        if f in ("back", "left", "right"): return HAIR if v > 1 else None
        if f == "front" and u in (0, 7) and v > 1: return HAIR
        return None
    s.paint("hat", crown, noise=3)
    hx_, hy_, _, _ = PARTS["hat"]["front"]
    s.px(hx_ + 3, hy_ + 1, hx("6ad7ff")); s.px(hx_ + 4, hy_ + 1, hx("6ad7ff"))
    s.px(hx_ + 3, hy_ + 0, hx("ffffff")); s.px(hx_ + 4, hy_ + 0, hx("ffffff"))
    # body: white gown, gold collar, gold belt, gold gem
    def body(f, u, v, w, h):
        if f == "front":
            if v == 0 and u not in (3, 4): return GOLD
            if v == 1 and u in (3, 4): return hx("6ad7ff")
            if v == 6: return GOLD
            if u in (3, 4) and v > 6: return GOLD_L
            return GOWN if (u + v) % 4 else GOWN_S
        if f == "back": return HAIR if v < 6 else GOWN
        return GOWN
    s.paint("body", body, noise=4)
    # jacket back = feathered wings folded on the back; front = sheer sash
    def wings(f, u, v, w, h):
        if f == "back":
            if v < 2: return None                       # let the hair show
            inner = 3 - u if u < 4 else u - 4           # 0 = next to spine, 3 = outer edge
            bottom = 8 + inner                          # outer feathers hang lower
            if v > bottom: return None
            if inner == 0 and v < 5: return GOLD        # golden wing joints
            if inner == 3 or v == bottom: return hx("9fb6d6")   # outline / feather tips
            if (v - inner) % 3 == 0: return FEATHER_S   # feather layers
            return FEATHER
        if f in ("left", "right"): return hx("9fb6d6") if 2 <= v < 9 else None
        if f == "front": return GOLD_D if (u in (1, 6) and v < 2) else None
        return None
    s.paint("jacket", wings, noise=3)
    arm = lambda f, u, v, w, h: GOLD if v in (3, 9) else (SKIN if v > 9 else GOWN)
    s.paint("rarm", arm, noise=4); s.paint("larm", arm, noise=4)
    sleeve = lambda f, u, v, w, h: GOWN_S if v < 3 else None
    s.paint("rsleeve", sleeve); s.paint("lsleeve", sleeve)
    leg = lambda f, u, v, w, h: GOLD if v == 11 else GOWN_S
    s.paint("rleg", leg); s.paint("lleg", leg)
    skirt = lambda f, u, v, w, h: (GOLD if v == 11 else (GOWN if (u + v) % 4 else GOWN_S))
    s.paint("rpants", skirt, noise=3); s.paint("lpants", skirt, noise=3)
    return s.save("divine_goddess")

def back_view(img):
    v = Image.new("RGBA", (16, 32), (0, 0, 0, 0))
    def blit(part, dx, dy, overlay=None):
        x, y, w, h = PARTS[part]["back"]
        v.alpha_composite(img.crop((x, y, x + w, y + h)), (dx, dy))
        if overlay:
            x, y, w, h = PARTS[overlay]["back"]
            v.alpha_composite(img.crop((x, y, x + w, y + h)), (dx, dy))
    blit("head", 4, 0, "hat"); blit("body", 4, 8, "jacket")
    blit("larm", 0, 8, "lsleeve"); blit("rarm", 12, 8, "rsleeve")
    blit("lleg", 4, 20, "lpants"); blit("rleg", 8, 20, "rpants")
    return v

if __name__ == "__main__":
    g = goddess()
    sheet = Image.new("RGBA", (320, 272), (40, 34, 38, 255))
    sheet.alpha_composite(front_view(g).resize((128, 256), Image.NEAREST), (16, 8))
    sheet.alpha_composite(back_view(g).resize((128, 256), Image.NEAREST), (176, 8))
    sheet.save(os.path.join(OUT, "preview-goddess.png"))
    print("ok")
