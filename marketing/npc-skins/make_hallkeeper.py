"""Hall Keeper Jax (Arcade & Trade Hall) skin.  python3 marketing/npc-skins/make_hallkeeper.py"""
import importlib.util, os
from PIL import Image
spec = importlib.util.spec_from_file_location("ms", os.path.join(os.path.dirname(os.path.abspath(__file__)), "make_skins.py"))
ms = importlib.util.module_from_spec(spec); spec.loader.exec_module(ms)
Skin, PARTS, hx, shade, face_detail, hair_head, front_view, OUT = ms.Skin, ms.PARTS, ms.hx, ms.shade, ms.face_detail, ms.hair_head, ms.front_view, ms.OUT

def hallkeeper():
    s = Skin(57)
    skin, hair, eye = hx("e0b08a"), hx("1e1a22"), hx("7a3fb0")
    vest, vest_d, gold, shirt, tie = hx("5a2a8a"), hx("3e1d63"), hx("e8b93a"), hx("f1ece2"), hx("c0283a")
    jacket, pants, shoe = hx("26202e"), hx("2b2733"), hx("15121a")
    s.paint("head", hair_head(hair, skin, fringe=1))
    face_detail(s, skin, eye, hair, brow=hair, mouth=hx("8a4f44"))
    x, y, _, _ = PARTS["head"]["front"]
    for gx in (1, 2, 5, 6): s.px(x + gx, y + 6, hair)          # curled moustache
    s.px(x + 0, y + 5, hair); s.px(x + 7, y + 5, hair)
    s.px(x + 2, y + 7, gold)                                   # gold tooth grin
    def hat(f, u, v, w, h):  # short top hat: black with magenta band and a gold card
        if f == "top": return jacket
        if f == "bottom": return None
        if v == 0: return jacket
        if v == 1: return hx("d23c9a")
        return None
    s.paint("hat", hat)
    hx_, hy_, _, _ = PARTS["hat"]["front"]
    s.px(hx_ + 5, hy_ + 1, gold); s.px(hx_ + 6, hy_ + 1, hx("fff2b0"))
    def body(f, u, v, w, h):
        if f == "front":
            if u in (3, 4) and v == 0: return tie                 # bow tie
            if u in (2, 5) and v == 0: return tie
            if u in (3, 4): return shirt if v < 6 else (gold if v % 2 else vest_d)
            if v == 9: return gold                                # watch chain
            if v >= 10: return pants
            return vest
        if f == "back": return vest_d if v < 10 else pants
        return vest
    s.paint("body", body)
    def coat(f, u, v, w, h):  # open tailcoat over the waistcoat
        if f == "front": return jacket if u in (0, 7) else None
        if f in ("left", "right"): return jacket
        if f == "back": return jacket if v < 11 or u in (0, 1, 6, 7) else None
        return None
    s.paint("jacket", coat)
    arm = lambda f, u, v, w, h: skin if v >= 11 else (gold if v == 10 else jacket)
    s.paint("rarm", arm); s.paint("larm", arm)
    glove = lambda f, u, v, w, h: hx("f6f2ea") if v >= 11 else None   # white gloves
    s.paint("rsleeve", glove); s.paint("lsleeve", glove)
    leg = lambda f, u, v, w, h: shoe if v >= 10 else pants
    s.paint("rleg", leg); s.paint("lleg", leg)
    return s.save("hallkeeper_jax")

if __name__ == "__main__":
    q = hallkeeper()
    sheet = Image.new("RGBA", (160, 272), (40, 34, 38, 255))
    sheet.alpha_composite(front_view(q).resize((128, 256), Image.NEAREST), (16, 8))
    sheet.save(os.path.join(OUT, "preview-hallkeeper.png")); print("ok")
