# Animated 468x60 server-list banner for OVERTHRONE SMP (seamless 4-second loop).
#   python3 marketing/make-animated-banner.py
# Writes marketing/overthrone-banner-animated-468x60.mp4 (for minecraft-mp.com, which wants MP4)
# and marketing/overthrone-banner-animated-468x60.gif (for sites that take GIF).
import math, os, random, shutil, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
W, H, S = 468, 60, 3                 # output size and supersampling
FPS, SECONDS = 25, 4
N = FPS * SECONDS
SW, SH = W * S, H * S

RED, RED_HI, GOLD = (165, 22, 45), (255, 70, 80), (232, 196, 120)
TITLE = "OVERTHRONE SMP"
LINES = ["overthronesmp.net", "1.21.1 NeoForge  •  Tensura RPG", "Hunter Ranks  E  →  ???", "6 Realms  •  Dungeon Gates"]

title_font = ImageFont.truetype(os.path.join(ROOT, "public/fonts/lora-var.woff"), 25 * S)
try:
    title_font.set_variation_by_axes([700])
except Exception:
    pass
sub_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 10 * S)
btn_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 9 * S)

logo = Image.open(os.path.join(ROOT, "public/images/overthrone-logo-800.webp")).convert("RGBA")
LOGO = SH - 6 * S
logo = logo.resize((LOGO, LOGO), Image.LANCZOS)
logo_glow = Image.new("RGBA", logo.size, RED_HI + (0,))
logo_glow.putalpha(logo.getchannel("A").filter(ImageFilter.GaussianBlur(6 * S)))

# layout
LX = 5 * S
TX = LX + LOGO + 8 * S
BTN_W, BTN_H = 92 * S, 22 * S
BTN_X, BTN_Y = SW - BTN_W - 9 * S, (SH - BTN_H) // 2

# title mask (for the light sweep)
tmask = Image.new("L", (SW, SH), 0)
ImageDraw.Draw(tmask).text((TX, 5 * S), TITLE, font=title_font, fill=255)
tbox = tmask.getbbox()

# embers: periodic paths so the loop is seamless
random.seed(11)
embers = []
for _ in range(46):
    embers.append(dict(
        x=random.uniform(0, SW), y=random.uniform(0, SH),
        rise=random.choice([1, 1, 2]) * SH,          # distance per loop (multiple of height)
        sway=random.uniform(2, 7) * S, phase=random.uniform(0, 2 * math.pi),
        r=random.uniform(0.9, 2.1) * S, hot=random.random() < 0.35))


def frame(i):
    t = i / N                                         # 0..1 loop position
    img = Image.new("RGB", (SW, SH), (7, 4, 5))

    # drifting red fog
    fog = Image.new("L", (SW, SH), 0)
    fd = ImageDraw.Draw(fog)
    for k, (cx, cy, rx, amp) in enumerate([(0.18, 0.5, 0.42, 0.06), (0.62, 0.4, 0.35, 0.08), (0.95, 0.6, 0.3, 0.05)]):
        x = (cx + amp * math.sin(2 * math.pi * (t + k / 3))) * SW
        y = (cy + 0.25 * math.cos(2 * math.pi * (t + k / 5))) * SH
        r = rx * SW
        fd.ellipse((x - r, y - r * 0.55, x + r, y + r * 0.55), fill=70 + 25 * k % 50)
    fog = fog.filter(ImageFilter.GaussianBlur(28 * S))
    img.paste((120, 10, 26), (0, 0), fog.point(lambda v: int(v * 0.6)))

    # embers
    ember = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    ed = ImageDraw.Draw(ember)
    for e in embers:
        y = (e["y"] - e["rise"] * t) % (SH + 10 * S) - 5 * S
        x = e["x"] + e["sway"] * math.sin(2 * math.pi * t * 2 + e["phase"])
        flick = 0.6 + 0.4 * math.sin(2 * math.pi * t * 4 + e["phase"] * 3)
        col = (255, 190, 120) if e["hot"] else (255, 70, 60)
        a = int(230 * flick)
        r = e["r"]
        ed.ellipse((x - r, y - r, x + r, y + r), fill=col + (a,))
    glow = ember.filter(ImageFilter.GaussianBlur(2.5 * S))
    img = Image.alpha_composite(img.convert("RGBA"), glow)
    img = Image.alpha_composite(img, ember)

    # left vignette behind logo + title for contrast
    d = ImageDraw.Draw(img)

    # logo with pulsing glow
    pulse = 0.55 + 0.45 * math.sin(2 * math.pi * t * 2)
    g = logo_glow.copy()
    g.putalpha(g.getchannel("A").point(lambda v: int(v * pulse)))
    img.alpha_composite(g, (LX, 3 * S))
    img.alpha_composite(logo, (LX, 3 * S))

    # title: shadow, face, then a light sweep across it once per loop
    shadow = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).text((TX + 1 * S, 6 * S), TITLE, font=title_font, fill=(0, 0, 0, 200))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(1.2 * S)))
    face = Image.new("RGBA", (SW, SH), (240, 234, 226, 255))
    img.paste(face, (0, 0), tmask)
    sweep_x = tbox[0] - 60 * S + (tbox[2] - tbox[0] + 120 * S) * ((t * 1.0) % 1.0)
    band = Image.new("L", (SW, SH), 0)
    bd = ImageDraw.Draw(band)
    bd.polygon([(sweep_x, 0), (sweep_x + 22 * S, 0), (sweep_x + 2 * S, SH), (sweep_x - 20 * S, SH)], fill=255)
    band = band.filter(ImageFilter.GaussianBlur(5 * S))
    shine = ImageChops.multiply(band, tmask)
    img.paste(GOLD, (0, 0), shine)

    # rotating info line (cross-fade between lines)
    seg = t * len(LINES)
    k, f = int(seg) % len(LINES), seg - int(seg)
    def put(text, alpha, dy):
        lay = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
        ImageDraw.Draw(lay).text((TX + 1 * S, 37 * S + dy), text, font=sub_font, fill=(255, 92, 106, int(255 * alpha)))
        img.alpha_composite(lay)
    fade = 0.18                                           # portion of each segment spent fading
    if f < 1 - fade:
        put(LINES[k], 1, 0)
    else:
        p = (f - (1 - fade)) / fade
        put(LINES[k], 1 - p, -4 * S * p)
        put(LINES[(k + 1) % len(LINES)], p, 4 * S * (1 - p))

    # PLAY NOW button with breathing glow
    bglow = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    ImageDraw.Draw(bglow).rounded_rectangle((BTN_X - 3 * S, BTN_Y - 3 * S, BTN_X + BTN_W + 3 * S, BTN_Y + BTN_H + 3 * S), 4 * S, fill=RED_HI + (int(150 * pulse),))
    img.alpha_composite(bglow.filter(ImageFilter.GaussianBlur(5 * S)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((BTN_X, BTN_Y, BTN_X + BTN_W, BTN_Y + BTN_H), 3 * S, fill=RED, outline=(255, 120, 120), width=max(1, S // 2))
    label = "PLAY NOW"
    lw = d.textlength(label, font=btn_font)
    d.text((BTN_X + (BTN_W - lw) / 2, BTN_Y + (BTN_H - 9 * S) / 2 - 1 * S), label, font=btn_font, fill=(255, 245, 240))

    # border with a highlight running around it
    d.rectangle((0, 0, SW - 1, SH - 1), outline=RED, width=2 * S)
    per = 2 * (SW + SH)
    pos = (t * per) % per
    hl = Image.new("L", (SW, SH), 0)
    hd = ImageDraw.Draw(hl)
    for off in range(0, 90 * S, S):
        p = (pos - off) % per
        if p < SW: x, y = p, 0
        elif p < SW + SH: x, y = SW - 1, p - SW
        elif p < 2 * SW + SH: x, y = SW - 1 - (p - SW - SH), SH - 1
        else: x, y = 0, SH - 1 - (p - 2 * SW - SH)
        a = int(255 * (1 - off / (90 * S)))
        hd.ellipse((x - 2 * S, y - 2 * S, x + 2 * S, y + 2 * S), fill=a)
    img.paste((255, 170, 150), (0, 0), hl.filter(ImageFilter.GaussianBlur(1 * S)))

    return img.convert("RGB").resize((W, H), Image.LANCZOS)


tmp = tempfile.mkdtemp()
for i in range(N):
    frame(i).save(os.path.join(tmp, f"f{i:03d}.png"))
mp4 = os.path.join(HERE, "overthrone-banner-animated-468x60.mp4")
gif = os.path.join(HERE, "overthrone-banner-animated-468x60.gif")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(tmp, "f%03d.png"),
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "slow", "-movflags", "+faststart", "-an", mp4], check=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(tmp, "f%03d.png"),
                "-vf", "split[a][b];[a]palettegen=max_colors=128:stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a",
                "-loop", "0", gif], check=True)
frame(int(N * 0.1)).save(os.path.join(tmp, "preview.png"))
shutil.copy(os.path.join(tmp, "preview.png"), os.path.join(HERE, "overthrone-banner-animated-preview.png"))
shutil.rmtree(tmp)
for p in (mp4, gif):
    print(os.path.basename(p), round(os.path.getsize(p) / 1024), "KB")
