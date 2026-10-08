"""Questmaster Orin skin.  python3 marketing/npc-skins/make_questmaster.py"""
import importlib.util, os
from PIL import Image
spec = importlib.util.spec_from_file_location("ms", os.path.join(os.path.dirname(os.path.abspath(__file__)), "make_skins.py"))
ms = importlib.util.module_from_spec(spec); spec.loader.exec_module(ms)
Skin, PARTS, hx, shade, face_detail, hair_head, front_view, OUT = ms.Skin, ms.PARTS, ms.hx, ms.shade, ms.face_detail, ms.hair_head, ms.front_view, ms.OUT

def questmaster():
    s = Skin(31)
    skin, hair, eye = hx("d8a47e"), hx("5a3a24"), hx("3b6e4a")
    coat, coat_d, gold, shirt, boot = hx("1f4a3a"), hx("143326"), hx("d9a83c"), hx("e7dcc3"), hx("3a2618")
    s.paint("head", hair_head(hair, skin, fringe=2))
    face_detail(s, skin, eye, hair, brow=hair, mouth=hx("8a5444"), beard=shade(hair, 1.1))
    x, y, _, _ = PARTS["head"]["front"]
    for gx in (0, 1, 2, 3, 4, 5, 6, 7):  # round reading glasses
        if gx in (0, 3, 4, 7): s.px(x + gx, y + 4, gold)
    for gx in (1, 2, 5, 6): s.px(x + gx, y + 3, gold)
    def hat(f, u, v, w, h):  # guild cap with gold band and a quill
        if f == "top": return coat
        if f == "bottom": return None
        if v == 0: return coat
        if v == 1: return gold
        return None
    s.paint("hat", hat)
    hx_, hy_, _, _ = PARTS["hat"]["left"]
    for i, c in enumerate([hx("f2f2f2"), hx("f2f2f2"), hx("dcdcdc")]): s.px(hx_ + 1, hy_ - 1 + i if hy_ - 1 + i >= 8 else hy_ + i, c)
    def body(f, u, v, w, h):
        if f == "front":
            if u in (3, 4) and v < 3: return shirt
            if u in (3, 4): return gold if v % 3 == 0 else coat_d
            if v == 7: return hx("6b4a2a")  # belt
            return coat
        return coat
    s.paint("body", body)
    def satchel(f, u, v, w, h):  # strap + scroll case
        if f == "front": return hx("8a5a2e") if (u + v == 7 or u + v == 8) and v < 8 else (gold if (u, v) == (6, 9) else None)
        if f == "back": return hx("8a5a2e") if (u == v or u == v - 1) and v < 8 else None
        return None
    s.paint("jacket", satchel)
    arm = lambda f, u, v, w, h: skin if v >= 11 else (gold if v == 9 else coat)
    s.paint("rarm", arm); s.paint("larm", arm)
    cuff = lambda f, u, v, w, h: coat_d if v == 10 else None
    s.paint("rsleeve", cuff); s.paint("lsleeve", cuff)
    leg = lambda f, u, v, w, h: boot if v >= 8 else hx("2b2a33")
    s.paint("rleg", leg); s.paint("lleg", leg)
    return s.save("questmaster_orin")

if __name__ == "__main__":
    q = questmaster()
    sheet = Image.new("RGBA", (160, 272), (40, 34, 38, 255))
    sheet.alpha_composite(front_view(q).resize((128, 256), Image.NEAREST), (16, 8))
    sheet.save(os.path.join(OUT, "preview-questmaster.png")); print("ok")
