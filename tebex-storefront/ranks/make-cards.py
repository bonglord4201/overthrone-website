# Builds 3:4 Tebex card images from the owner's rank artwork (no new artwork):
# the art's scenery fills the card, and the art's own [RANK] title banner sits in the middle.
#   python3 make-cards.py <src-dir>   (expects ronin.webp, valkyrie.webp, ... in src-dir)
import sys, os
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

W, H = 900, 1200
# (file, title banner box in the source image, scenery box used for the background)
# skyline: a clean strip of scenery (no text) shown sharp at the top; None = scenery box is already clean.
RANKS = {
    "ronin":    ((75, 45, 805, 180),   (0, 0, 1711, 919),   (905, 18, 1640, 178)),
    "valkyrie": ((75, 45, 915, 180),   (0, 0, 1711, 919),   (915, 18, 1640, 178)),
    "monarch":  ((75, 45, 885, 180),   (0, 0, 1711, 919),   (905, 18, 1640, 178)),
    "godborn":  ((95, 65, 965, 220),   (960, 0, 1594, 987), None),
    "overlord": ((95, 35, 965, 180),   (900, 0, 1774, 887), None),
}

def cover(img, w, h):
    s = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    l, t = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((l, t, l + w, t + h))

src, out = sys.argv[1], os.path.join(os.path.dirname(__file__), "cards")
os.makedirs(out, exist_ok=True)
for key, (title_box, scene_box, skyline) in RANKS.items():
    art = Image.open(os.path.join(src, f"{key}.webp")).convert("RGB")
    bg = cover(art.crop(scene_box), W, H)
    if skyline:
        # text-heavy art: use only its clean skyline - sharp at the top, mirrored as a dim reflection below
        sky = ImageEnhance.Brightness(cover(art.crop(skyline), W, round(H * 0.46))).enhance(1.4)
        tone = art.crop(skyline).resize((1, 1), Image.BOX).getpixel((0, 0))
        bg = Image.new("RGB", (W, H), tuple(int(c * 0.35) for c in tone))
        fade = Image.linear_gradient("L").resize(sky.size).transpose(Image.FLIP_TOP_BOTTOM).point(lambda v: min(255, v * 1.6))
        bg.paste(sky, (0, 0), fade)
        refl = ImageEnhance.Brightness(sky.transpose(Image.FLIP_TOP_BOTTOM)).enhance(0.5)
        rfade = Image.linear_gradient("L").resize(refl.size).point(lambda v: min(255, v * 1.4))
        bg.paste(refl, (0, H - refl.height), rfade)
    else:
        bg = ImageEnhance.Brightness(bg).enhance(0.72)
    # soft vignette so the title stands out
    shade = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(shade)
    d.rectangle((0, H * 0.36, W, H * 0.64), fill=150)
    shade = shade.filter(ImageFilter.GaussianBlur(90))
    bg = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), bg, shade)
    title = art.crop(title_box)
    tw = W - 60
    title = title.resize((tw, round(title.height * tw / title.width)), Image.LANCZOS)
    bg.paste(title, ((W - tw) // 2, (H - title.height) // 2))
    bg.save(os.path.join(out, f"{key}-card-900x1200.jpg"), quality=92)
    print("wrote", key)
