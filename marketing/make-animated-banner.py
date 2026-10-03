# Cinematic animated 468x60 server-list banner for OVERTHRONE SMP (seamless 9-second loop).
#   python3 marketing/make-animated-banner.py <rank-art-dir>
# <rank-art-dir> holds the owner's rank artwork: overlord.webp (hellfire castle) and godborn.webp
# (heavenly citadel). Writes marketing/overthrone-banner-animated-468x60.mp4 (minecraft-mp.com wants MP4)
# and .gif (other sites), plus a preview contact sheet.
import math, os, random, shutil, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ART = sys.argv[1]
W, H, S = 468, 60, 3
SW, SH = W * S, H * S
FPS, SECONDS = 25, 9
N = FPS * SECONDS

GOLD, CREAM, RED_HI = (240, 200, 120), (248, 240, 228), (255, 64, 70)
DISPLAY = os.path.join(ROOT, "public/fonts/lora-var.woff")
SANS_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def font(path, size, bold=True):
    f = ImageFont.truetype(path, size)
    if bold and path.endswith(".woff"):
        try: f.set_variation_by_axes([700])
        except Exception: pass
    return f


def cover(img, w, h):
    s = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    l, t = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((l, t, l + w, t + h))


# --- scenes from the owner's artwork (clean regions, no frame/text) ---
def scene(file, box, tint=1.0):
    im = Image.open(os.path.join(ART, file)).convert("RGB").crop(box)
    im = ImageEnhance.Contrast(im).enhance(1.12)
    im = ImageEnhance.Color(im).enhance(tint)
    return im

SCENES = [
    dict(img=scene("overlord.webp", (930, 150, 1650, 560), 1.15), pan=(0.0, 0.35), zoom=(1.0, 1.12),
         title="OVERTHRONE SMP", sub="DON'T REACH THE THRONE. OVERTHROW IT.", accent=RED_HI, dark=0.62),
    dict(img=scene("godborn.webp", (1010, 150, 1480, 520), 1.0), pan=(0.2, 0.75), zoom=(1.1, 1.0),
         title="SIX REALMS AWAIT", sub="AEONIA  •  NETHERFALL  •  THE GATES", accent=GOLD, dark=0.72),
    dict(img=scene("overlord.webp", (1000, 220, 1600, 560), 1.2), pan=(0.7, 0.3), zoom=(1.18, 1.05),
         title="FROM E TO ???", sub="TENSURA RPG  •  HUNTER RANKS  •  BOSSES", accent=RED_HI, dark=0.62),
]
SEG = N // len(SCENES)
FADE = int(FPS * 0.7)

logo = Image.open(os.path.join(ROOT, "public/images/overthrone-logo-800.webp")).convert("RGBA")
LOGO = SH + 6 * S
logo = logo.resize((LOGO, LOGO), Image.LANCZOS)
logo_glow = Image.new("RGBA", logo.size, RED_HI + (0,))
logo_glow.putalpha(logo.getchannel("A").filter(ImageFilter.GaussianBlur(7 * S)))
LX, LY = -1 * S, -3 * S

TX = LOGO - 2 * S                       # text column start
IPW = 118 * S                           # right info plate width
TW = SW - TX - IPW - 10 * S             # text column width
title_cache, sub_font = {}, font(SANS_B, 8 * S)
ip_font, ip_small = font(SANS_B, 10 * S), font(SANS_B, 7 * S)


def title_font(text):
    if text not in title_cache:
        for size in range(26 * S, 12 * S, -S):
            f = font(DISPLAY, size)
            if ImageDraw.Draw(Image.new("L", (1, 1))).textlength(text, font=f) <= TW:
                break
        title_cache[text] = f
    return title_cache[text]


random.seed(5)
EMBERS = [dict(x=random.uniform(0, SW), y=random.uniform(0, SH), rise=random.choice([1, 2, 2, 3]) * SH,
               sway=random.uniform(2, 8) * S, ph=random.uniform(0, 6.28), r=random.uniform(0.8, 2.2) * S,
               hot=random.random() < 0.4) for _ in range(60)]


def ease(x):
    return x * x * (3 - 2 * x)


def background(sc, p):
    z = sc["zoom"][0] + (sc["zoom"][1] - sc["zoom"][0]) * p
    img = sc["img"]
    cw, ch = img.width / z, img.width / z * SH / SW
    ch = min(ch, img.height); cw = ch * SW / SH
    px = sc["pan"][0] + (sc["pan"][1] - sc["pan"][0]) * p
    x0 = (img.width - cw) * px
    y0 = (img.height - ch) * 0.45
    return img.resize((SW, SH), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch))


def shade(dark):
    """Left/right darkening so text and plate stay readable over busy art."""
    g = Image.new("L", (SW, SH), 0)
    px = g.load()
    for x in range(SW):
        u = x / SW
        left = max(0.0, 1 - u / 0.62) ** 1.4
        right = max(0.0, (u - 0.7) / 0.3) ** 1.6
        v = int(255 * dark * min(1, left * 1.15 + right * 0.9 + 0.18))
        for y in range(SH):
            px[x, y] = v
    return g

SHADES = {sc["dark"]: shade(sc["dark"]) for sc in SCENES}


def text_layer(sc, appear, t_global):
    lay = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    tf = title_font(sc["title"])
    a = int(255 * appear)
    dx = int((1 - appear) * 14 * S)
    ty = 6 * S
    # glow behind title
    g = Image.new("L", (SW, SH), 0)
    ImageDraw.Draw(g).text((TX + dx, ty), sc["title"], font=tf, fill=255, stroke_width=3 * S)
    g = g.filter(ImageFilter.GaussianBlur(6 * S)).point(lambda v: int(v * 0.8 * appear))
    lay.paste(sc["accent"] + (255,), (0, 0), g)
    d.text((TX + dx, ty), sc["title"], font=tf, fill=(14, 4, 6, a), stroke_width=int(1.6 * S), stroke_fill=(14, 4, 6, a))
    m = Image.new("L", (SW, SH), 0)
    ImageDraw.Draw(m).text((TX + dx, ty), sc["title"], font=tf, fill=255)
    m = m.point(lambda v: int(v * appear))
    # metallic face: cream top -> gold bottom
    face = Image.linear_gradient("L").resize((SW, SH))
    face = Image.merge("RGB", [face.point(lambda v, c=c, k=k: int(c + (k - c) * v / 255)) for c, k in zip(CREAM, GOLD)])
    lay.paste(face, (0, 0), m)
    # light sweep
    bbox = m.getbbox()
    if bbox:
        sx = bbox[0] - 40 * S + (bbox[2] - bbox[0] + 80 * S) * ((t_global * 3) % 1)
        band = Image.new("L", (SW, SH), 0)
        ImageDraw.Draw(band).polygon([(sx, 0), (sx + 16 * S, 0), (sx, SH), (sx - 16 * S, SH)], fill=255)
        lay.paste((255, 255, 255), (0, 0), ImageChops.multiply(band.filter(ImageFilter.GaussianBlur(4 * S)), m).point(lambda v: int(v * 0.85)))
    # subtitle with accent line
    sy = 39 * S
    d.line((TX + dx, sy + 5 * S, TX + dx + 10 * S, sy + 5 * S), fill=sc["accent"] + (a,), width=S)
    d.text((TX + dx + 14 * S, sy), sc["sub"], font=sub_font, fill=(235, 225, 215, a), stroke_width=S, stroke_fill=(0, 0, 0, int(a * 0.8)))
    return lay


def ip_plate(t):
    lay = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    x0, y0, x1, y1 = SW - IPW - 6 * S, 9 * S, SW - 6 * S, SH - 9 * S
    pulse = 0.5 + 0.5 * math.sin(2 * math.pi * t * 3)
    glow = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    ImageDraw.Draw(glow).rounded_rectangle((x0 - 2 * S, y0 - 2 * S, x1 + 2 * S, y1 + 2 * S), 4 * S, fill=RED_HI + (int(110 + 110 * pulse),))
    lay.alpha_composite(glow.filter(ImageFilter.GaussianBlur(5 * S)))
    d.rounded_rectangle((x0, y0, x1, y1), 3 * S, fill=(18, 4, 8, 235), outline=(255, 90, 90, 255), width=max(1, S // 2 + 1))
    top = "PLAY NOW"
    tw = d.textlength(top, font=ip_small)
    d.text(((x0 + x1 - tw) / 2, y0 + 4 * S), top, font=ip_small, fill=GOLD + (255,))
    ip = "overthronesmp.net"
    iw = d.textlength(ip, font=ip_font)
    d.text(((x0 + x1 - iw) / 2, y0 + 15 * S), ip, font=ip_font, fill=(255, 255, 255, 255))
    ver = "1.21.1 NEOFORGE"
    vw = d.textlength(ver, font=ip_small)
    d.text(((x0 + x1 - vw) / 2, y1 - 11 * S), ver, font=ip_small, fill=(255, 120, 120, 255))
    return lay


def embers(t):
    lay = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for e in EMBERS:
        y = (e["y"] - e["rise"] * t) % (SH + 10 * S) - 5 * S
        x = e["x"] + e["sway"] * math.sin(2 * math.pi * t * 3 + e["ph"])
        fl = 0.55 + 0.45 * math.sin(2 * math.pi * t * 7 + e["ph"] * 3)
        col = (255, 200, 120) if e["hot"] else (255, 70, 50)
        d.ellipse((x - e["r"], y - e["r"], x + e["r"], y + e["r"]), fill=col + (int(240 * fl),))
    return Image.alpha_composite(lay.filter(ImageFilter.GaussianBlur(2.2 * S)), lay)


def frame(i):
    t = i / N
    k, local = divmod(i, SEG)
    k %= len(SCENES)
    sc, nxt = SCENES[k], SCENES[(k + 1) % len(SCENES)]
    p = local / SEG
    bg = background(sc, p)
    dark = SHADES[sc["dark"]]
    fade = 0.0
    if local >= SEG - FADE:                                # cross-fade into the next scene
        fade = ease((local - (SEG - FADE)) / FADE)
        bg = Image.blend(bg, background(nxt, 0.0), fade)
        dark = Image.blend(dark, SHADES[nxt["dark"]], fade)
    img = bg.convert("RGBA")
    img.paste((6, 2, 4, 255), (0, 0), dark)
    # vignette top/bottom
    vg = Image.linear_gradient("L").resize((1, SH)).point(lambda v: int(140 * (abs(v - 128) / 128) ** 2.2)).resize((SW, SH))
    img.paste((0, 0, 0, 255), (0, 0), vg)
    img = Image.alpha_composite(img, embers(t))
    # logo with glow
    pulse = 0.55 + 0.45 * math.sin(2 * math.pi * t * 3)
    g = logo_glow.copy(); g.putalpha(g.getchannel("A").point(lambda v: int(v * pulse)))
    img.alpha_composite(g, (LX, LY)); img.alpha_composite(logo, (LX, LY))
    # text: current scene fades out at the end, next fades in
    appear_in = ease(min(1, local / (FPS * 0.5))) if not (k == 0 and i < FPS * 0.5 and False) else 1
    if fade:
        # old text out in the first half of the fade, new text in during the second half
        if fade < 0.5:
            img = Image.alpha_composite(img, text_layer(sc, 1 - ease(fade * 2), t))
        else:
            img = Image.alpha_composite(img, text_layer(nxt, ease(fade * 2 - 1), t))
    else:
        img = Image.alpha_composite(img, text_layer(sc, 1, t))
    img = Image.alpha_composite(img, ip_plate(t))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, SW - 1, SH - 1), outline=(150, 18, 38, 255), width=S)
    d.rectangle((S, S, SW - 1 - S, SH - 1 - S), outline=(60, 8, 16, 255), width=S)
    return img.convert("RGB").resize((W, H), Image.LANCZOS)


tmp = tempfile.mkdtemp()
for i in range(N):
    frame(i).save(os.path.join(tmp, f"f{i:03d}.png"))
mp4 = os.path.join(HERE, "overthrone-banner-animated-468x60.mp4")
gif = os.path.join(HERE, "overthrone-banner-animated-468x60.gif")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(tmp, "f%03d.png"),
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "slow", "-movflags", "+faststart", "-an", mp4], check=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(tmp, "f%03d.png"),
                "-vf", "fps=10,split[a][b];[a]palettegen=max_colors=96:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=5",
                "-loop", "0", gif], check=True)
sheet = Image.new("RGB", (W, H * 6 + 5 * 4), (30, 30, 30))
for j, fi in enumerate([10, 50, 90, 140, 180, 215]):
    sheet.paste(Image.open(os.path.join(tmp, f"f{fi:03d}.png")), (0, j * (H + 4)))
sheet.resize((W * 2, sheet.height * 2), Image.NEAREST).save(os.path.join(HERE, "overthrone-banner-animated-preview.png"))
shutil.rmtree(tmp)
for p in (mp4, gif):
    print(os.path.basename(p), round(os.path.getsize(p) / 1024), "KB")
