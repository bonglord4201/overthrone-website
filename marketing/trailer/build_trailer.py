"""Cuts the OVERTHRONE SMP trailer from the 8 recorded clips.

    python3 build_trailer.py <clips_dir> <music.wav> <out.mp4>

<clips_dir> holds c1.mp4 ... c8.mp4 (INTRO_1 ... INTRO_8). Every shot is 5.5 s with a 0.5 s
dissolve, so a new shot lands every 5 s = every 2 bars of the 96 BPM soundtrack (make_music.py).
Timeline: 0-5 intro card | 5-55 the hub | 55-80 the RPG world | 80-87.5 end card.
"""
import os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

CLIPS, MUSIC, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, '..', 'server-icon', 'overthrone-logo-enhanced.png')
W, H, FPS = 1280, 720, 30
SHOT, XF, STEP = 5.5, 0.5, 5.0
BAR = 92                                   # 2.39:1 letterbox (also hides HUD + debug text)
END_LEN = 7.5
GOLD, WHITE = (236, 200, 110, 255), (240, 240, 240, 255)
SERIF = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

# (clip, start second, caption title, caption subtitle, big centred caption?)
SHOTS = [
    ('c1', 1.0,  'THE HUB', 'Welcome to', True),
    ('c1', 9.5,  'A city above the clouds', None, False),
    ('c2', 0.0,  None, None, False),
    ('c2', 12.5, 'Built by legends', None, False),
    ('c3', 3.0,  None, None, False),
    ('c4', 0.0,  'Halls of ancient power', None, False),
    ('c4', 12.8, None, None, False),
    ('c5', 9.5,  'Explore every corner', None, False),
    ('c6', 0.5,  'Where dragons rest', None, False),
    ('c6', 6.5,  None, None, False),
    ('c6', 15.0, 'THE RPG WORLD', 'Quests  •  Bosses  •  Loot', True),
    ('c7', 2.5,  None, None, False),
    ('c7', 9.0,  'Arcade & Trade Hall', 'Grind coins. Spin the gachas. Trade.', False),
    ('c7', 19.0, 'Claim your throne', None, False),
    ('c8', 0.0,  None, None, False),
]
FLASH_AT = {1, 11}                         # white flash on the music's impact hits
TOTAL = STEP * (len(SHOTS) + 1) + END_LEN  # intro + shots + end card = 87.5 s

tmp = tempfile.mkdtemp(prefix='trailer_')

def font(path, size): return ImageFont.truetype(path, size)

def spaced(draw, xy, text, fnt, fill, spacing, anchor_center=True):
    widths = [draw.textlength(ch, font=fnt) for ch in text]
    total = sum(widths) + spacing * (len(text) - 1)
    x, y = xy
    if anchor_center: x -= total / 2
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += w + spacing
    return total

def with_shadow(layer, radius=6, alpha=200):
    a = layer.split()[3].filter(ImageFilter.GaussianBlur(radius))
    shadow = Image.new('RGBA', layer.size, (0, 0, 0, 0))
    shadow.putalpha(a.point(lambda v: min(255, v * alpha // 255 * 2)))
    return Image.alpha_composite(shadow, layer)

def caption_png(i, title, sub, big):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if big:
        tf, sf = font(SERIF, 86), font(SANS, 24)
        cy = H // 2 - 30
        if sub and sub.startswith('Welcome'):
            spaced(d, (W / 2, cy - 48), sub.upper(), sf, WHITE, 8)
            tw = spaced(d, (W / 2, cy - 10), title, tf, GOLD, 10)
            d.line([(W / 2 - tw / 2, cy + 98), (W / 2 + tw / 2, cy + 98)], fill=GOLD, width=2)
        else:
            tw = spaced(d, (W / 2, cy - 20), title, tf, GOLD, 10)
            d.line([(W / 2 - tw / 2, cy + 86), (W / 2 + tw / 2, cy + 86)], fill=GOLD, width=2)
            if sub: spaced(d, (W / 2, cy + 104), sub.upper(), sf, WHITE, 6)
    else:                                   # lower-left chapter caption
        tf, sf = font(SERIF, 44), font(SANS, 20)
        x, y = 70, H - BAR - (120 if sub else 92)
        d.rectangle([x, y + 8, x + 4, y + 54], fill=GOLD)
        spaced(d, (x + 22, y), title.upper(), tf, GOLD, 3, False)
        if sub: spaced(d, (x + 24, y + 62), sub, sf, WHITE, 1, False)
    path = os.path.join(tmp, 'cap%02d.png' % i)
    with_shadow(img).save(path)
    return path

def logo_card(path, lines, logo_size):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    logo = Image.open(LOGO).convert('RGBA').resize((logo_size, logo_size), Image.LANCZOS)
    top = (H - logo_size - 40 * len(lines)) // 2 - 10
    img.alpha_composite(logo, ((W - logo_size) // 2, top))
    d = ImageDraw.Draw(img)
    y = top + logo_size + 6
    for text, fnt, fill, sp in lines:
        spaced(d, (W / 2, y), text, fnt, fill, sp)
        y += fnt.size + 14
    with_shadow(img, 8).save(path)
    return path

intro_png = logo_card(os.path.join(tmp, 'intro.png'),
                      [('A NEW REALM AWAITS', font(SANS, 26), WHITE, 12)], 330)
end_png = logo_card(os.path.join(tmp, 'end.png'), [
    ('MODDED  •  TENSURA  •  EPIC FIGHT  •  RPG', font(SANS, 20), WHITE, 4),
    ('JOIN NOW', font(SERIF, 46), GOLD, 10),
    ('overthronesmp.net     |     51.161.196.66', font(SANS, 22), WHITE, 2),
], 300)

# ---------- inputs
args = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-stats']
grade = 'eq=contrast=1.08:saturation=1.18:brightness=0.005:gamma=0.97,vignette=PI/5'
fc = []
n_in = 0
def add_input(*a):
    global n_in
    args.extend(a); n_in += 1
    return n_in - 1

# intro: black + logo card
fc.append('color=c=black:s=%dx%d:r=%d:d=%.2f,format=yuv420p[bg0]' % (W, H, FPS, SHOT))
i = add_input('-loop', '1', '-t', str(SHOT), '-i', intro_png)
fc.append('[%d:v]format=rgba,fade=in:st=0.6:d=1.2:alpha=1,fade=out:st=4.2:d=0.8:alpha=1[lg0]' % i)
fc.append('[bg0][lg0]overlay=format=auto,format=yuv420p,setsar=1[s0]')

for k, (clip, start, *_ ) in enumerate(SHOTS, 1):
    src = os.path.join(CLIPS, clip + '.mp4')
    slow = 1.12 if clip == 'c8' else 1.0           # c8 is only 5 s long: gentle slow-mo
    i = add_input('-ss', str(start), '-t', str(SHOT / slow + 0.2), '-i', src)
    fc.append('[%d:v]setpts=%.3f*(PTS-STARTPTS),fps=%d,scale=%d:%d,%s,trim=duration=%.2f,'
              'setpts=PTS-STARTPTS,format=yuv420p,setsar=1[s%d]' % (i, slow, FPS, W, H, grade, SHOT, k))

# end card: the opening flyover, blurred and darkened, behind the logo
k_end = len(SHOTS) + 1
i = add_input('-ss', '2', '-t', str(END_LEN + 0.5), '-i', os.path.join(CLIPS, 'c1.mp4'))
fc.append('[%d:v]setpts=1.6*(PTS-STARTPTS),fps=%d,scale=%d:%d,gblur=sigma=18,eq=brightness=-0.22:saturation=0.8,'
          'trim=duration=%.2f,setpts=PTS-STARTPTS,format=yuv420p,setsar=1[eb]' % (i, FPS, W, H, END_LEN))
i = add_input('-loop', '1', '-t', str(END_LEN), '-i', end_png)
fc.append('[%d:v]format=rgba,fade=in:st=0.5:d=1.2:alpha=1[el]' % i)
fc.append('[eb][el]overlay=format=auto,format=yuv420p,setsar=1[s%d]' % k_end)

# ---------- dissolve chain
prev = 's0'
for k in range(1, k_end + 1):
    trans = 'fadewhite' if k in FLASH_AT else ('fadeblack' if k == k_end else 'fade')
    fc.append('[%s][s%d]xfade=transition=%s:duration=%.2f:offset=%.2f[x%d]' % (prev, k, trans, XF, STEP * k, k))
    prev = 'x%d' % k

# ---------- captions (fade in/out over each shot)
for k, (clip, start, title, sub, big) in enumerate(SHOTS, 1):
    if not title: continue
    t0, length = STEP * k + 0.5, 3.9
    if title == 'Claim your throne': t0, length = STEP * k + 1.6, 3.6      # wait until the throne is in view
    i = add_input('-loop', '1', '-t', str(length), '-i', caption_png(k, title, sub, big))
    fc.append('[%d:v]format=rgba,fade=in:st=0:d=0.7:alpha=1,fade=out:st=%.2f:d=0.7:alpha=1,'
              'setpts=PTS+%.2f/TB[c%d]' % (i, length - 0.7, t0, k))
    fc.append('[%s][c%d]overlay=eof_action=pass:format=auto[o%d]' % (prev, k, k))
    prev = 'o%d' % k

# ---------- letterbox, light film grain, fade out
fc.append('[%s]drawbox=x=0:y=0:w=iw:h=%d:color=black:t=fill,drawbox=x=0:y=ih-%d:w=iw:h=%d:color=black:t=fill,'
          'noise=alls=3:allf=t,fade=out:st=%.2f:d=1.5,format=yuv420p[v]' % (prev, BAR, BAR, BAR, TOTAL - 1.5))

a = add_input('-i', MUSIC)
args += ['-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '%d:a' % a,
         '-t', '%.2f' % TOTAL, '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-profile:v', 'high',
         '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '256k', OUT]
subprocess.run(args, check=True)
print('wrote', OUT)
