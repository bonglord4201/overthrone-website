"""Vertical (9:16) TikTok intro for OVERTHRONE SMP, cut on the trailer soundtrack's 150 BPM beat grid.

    python3 build_tiktok.py <clips_dir> <trailer_audio.wav> <fonts_dir> <out.mp4>

<clips_dir>: c1..c12 (INTRO_1..12), f1/f2 (fight clips), n1..n6 (Oct 12 clips: hub halls, hub flyover,
RPG village + casino, dungeon/throne, savanna boss fight, mushroom forest).
The music is re-cut from the trailer's own soundtrack (make_music.py, CC0 samples) at bar boundaries,
so every section keeps its beat.
"""
import concurrent.futures as cf, math, os, shutil, subprocess, sys, tempfile, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

CLIPS, AUDIO, FONTS, OUT = sys.argv[1:5]
HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, '..', 'server-icon', 'overthrone-logo-enhanced.png')
W, H, FPS = 1080, 1920, 30
BPM = 150; BEAT = 60 / BPM; BAR = 4 * BEAT; HB = BAR / 2
RED, WHITE, GOLD = (226, 38, 58, 255), (245, 242, 236, 255), (255, 200, 90, 255)
BEBAS = os.path.join(FONTS, 'BebasNeue-Regular.ttf')
tmp = tempfile.mkdtemp(prefix='tiktok_')
X264 = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-an']

def run(args): subprocess.run(['ffmpeg', '-v', 'error', '-y'] + args, check=True)
def frames(sec): return int(round(sec * FPS))
def bars(b): return round(b * BAR, 4)

# ---------------------------------------------------------------- the edit
# sections (bars) and which trailer-soundtrack bars play under them
HOOK, HUB, BUILD, FIGHT, WORLD, END, FINISH = 0, 2, 8, 10, 18, 22, 26
MUSIC = [(HOOK, 8, 2), (HUB, 12, 6), (BUILD, 22, 2), (FIGHT, 24, 8), (WORLD, 52, 4), (END, 62, 4)]
TOTAL = bars(FINISH)

# (clip, source start, [(seconds, speed)], options)   speed < 1 = slow motion
# options: box = source crop before the 9:16 cut, x = horizontal focus 0..1, lift = brighten dark footage
SHOTS = [
    ('f2', 1.4,  [(HB, 1.0), (HB, 0.45)], {'box': '924:520:240:100', 'lift': 1.25, 'x': 0.55}),   # hook: boss reveal
    ('TITLE', 0, [(BAR, 1.0)], {}),
    # the hub
    ('n2', 0.2,  [(BAR, 1.35)], {}),
    ('n1', 0.0,  [(BAR, 1.25)], {}),
    ('n2', 3.0,  [(BAR, 1.1)], {'x': 0.5}),
    ('n1', 7.2,  [(BAR, 1.4)], {}),
    ('n2', 9.0,  [(HB, 1.3), (HB, 1.3)], {}),
    ('n2', 18.0, [(BAR, 1.3)], {}),
    # build: the dungeon
    ('n4', 3.0,  [(BAR, 1.0)], {}),
    ('n4', 12.0, [(BAR, 0.75)], {'lift': 1.15}),
    # the fight
    ('n5', 3.0,  [(HB, 1.0), (HB, 0.5)], {'x': 0.45}),
    ('c10', 13.2, [(HB, 1.0), (HB, 0.5)], {'box': '948:533:60:107'}),
    ('f2', 14.0, [(BAR, 1.0)], {'box': '924:520:240:100', 'lift': 1.2}),
    ('n5', 6.3,  [(BAR, 0.6)], {'x': 0.5}),
    ('c11', 12.9, [(BEAT, 1.0), (3 * BEAT, 0.5)], {}),
    ('n5', 9.4,  [(BAR, 0.7)], {'x': 0.6}),
    ('f1', 4.8,  [(HB, 1.0), (HB, 0.5)], {'box': '960:540:160:80', 'lift': 1.4}),
    ('n5', 18.8, [(BAR, 0.8)], {'x': 0.45}),
    # the worlds
    ('n6', 0.0,  [(BAR, 1.2)], {'x': 0.35}),
    ('n3', 20.0, [(BAR, 1.2)], {'x': 0.65}),
    ('n6', 14.4, [(BAR, 1.0)], {'x': 0.6}),
    ('n5', 22.3, [(BAR, 1.0)], {'x': 0.55}),
    ('END', 0,   [(4 * BAR, 1.0)], {}),
]

# (start bar, length bars, style, text, sub)
CAPTIONS = [
    (0.0, 1.0, 'slam', 'MODDED RPG SMP', None),
    (HUB + 0.15, 1.6, 'slam', 'A HUB LIKE NO OTHER', None),
    (HUB + 2.1, 1.6, 'slam', 'CUSTOM NPCS', 'SHOPS  ·  KITS  ·  COSMETICS'),
    (HUB + 4.1, 1.6, 'slam', 'REALMS & TAVERN', None),
    (BUILD + 0.1, 1.8, 'slam', 'SOLO LEVELING', 'DUNGEONS  ·  HUNTER RANKS'),
    (FIGHT + 0.1, 1.4, 'slam', 'SLAY THE BOSSES', None),
    (FIGHT + 2.0, 0.5, 'word', 'DODGE', None),
    (FIGHT + 2.5, 0.5, 'word', 'DASH', None),
    (FIGHT + 3.0, 0.9, 'word', 'STRIKE', None),
    (FIGHT + 5.0, 1.5, 'slam', 'EPIC FIGHT COMBAT', None),
    (FIGHT + 7.0, 1.0, 'slam', 'TENSURA RACES', None),
    (WORLD + 0.1, 1.8, 'slam', 'EXPLORE', 'SURVIVAL  ·  RPG  ·  RESOURCE WORLDS'),
    (WORLD + 2.1, 1.8, 'slam', 'CRATES & LOOT', None),
]
IMPACTS = [0.0, bars(HUB), bars(FIGHT), bars(WORLD), bars(END)]

# ---------------------------------------------------------------- shots
def grade(lift):
    if lift != 1.0:
        return ('eq=contrast=1.12:saturation=1.22:gamma=%.2f:brightness=0.02,'
                'colorbalance=rs=-0.03:bs=0.05:rh=0.05:bh=-0.03' % lift)
    return 'eq=contrast=1.1:saturation=1.2:gamma=1.04,colorbalance=rh=0.04:bh=-0.04:bs=0.03'

def vertical_crop(box, x):
    bw, bh, bx, by = [int(v) for v in box.split(':')]
    cw = int(bh * 9 / 16) // 2 * 2
    cx = bx + int((bw - cw) * x)
    return '%d:%d:%d:%d' % (cw, bh, cx, by)

def render_piece(job):
    path, clip, src, dur, speed, opt = job
    n = frames(dur)
    vf = ['crop=' + vertical_crop(opt.get('box', '1280:720:0:0'), opt.get('x', 0.5)),
          'scale=%d:%d:flags=lanczos' % (W, H), 'unsharp=7:7:0.8']
    vf.append('setpts=%.4f*(PTS-STARTPTS)' % (1 / speed))
    if speed < 1:
        vf.append('minterpolate=fps=%d:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1' % FPS)
    vf += ['fps=%d' % FPS, grade(opt.get('lift', 1.0)), 'vignette=PI/5', 'format=yuv420p', 'setsar=1']
    run(['-ss', '%.3f' % src, '-t', '%.3f' % (dur * speed + 0.4), '-i', os.path.join(CLIPS, clip + '.mp4'),
         '-vf', ','.join(vf), '-frames:v', str(n)] + X264 + [path])
    return path

# ---------------------------------------------------------------- text
def font(size): return ImageFont.truetype(BEBAS, size)

def shadowed(img, radius=12, strength=180):
    a = img.split()[3].filter(ImageFilter.GaussianBlur(radius)).point(lambda v: min(255, v * strength // 100))
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); sh.putalpha(a)
    return Image.alpha_composite(sh, img)

def text_layer(lines):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for text, fnt, fill, track, y in lines:
        ws = [d.textlength(ch, font=fnt) for ch in text]
        total = sum(ws) + track * (len(text) - 1)
        while total > W - 80 and fnt.size > 30:      # keep it inside the frame
            fnt = font(fnt.size - 6); ws = [d.textlength(ch, font=fnt) for ch in text]; total = sum(ws) + track * (len(text) - 1)
        x = (W - total) / 2
        for ch, w in zip(text, ws):
            d.text((x, y), ch, font=fnt, fill=fill); x += w + track
    return shadowed(img)

def ease_out(x): return 1 - (1 - min(max(x, 0), 1)) ** 3

def caption_layer(style, en, sub):
    y = H * 0.62   # lower-middle: clear of TikTok's top bar and bottom caption area
    if style == 'word':
        return text_layer([(en, font(230), WHITE, 14, H / 2 - 130)])
    lines = [(en, font(150), WHITE, 8, y)]
    if sub: lines.append((sub, font(52), RED, 5, y + 165))
    layer = text_layer(lines)
    ImageDraw.Draw(layer).line([(W / 2 - 70, y - 22), (W / 2 + 70, y - 22)], fill=RED, width=6)
    return layer

def animate(layer, n, style, outdir):
    os.makedirs(outdir, exist_ok=True)
    for i in range(n):
        if style == 'word':
            a = min(1, i / 2, (n - 1 - i) / 3); s = 1.0 + 0.35 * (1 - ease_out(i / 4)) + 0.02 * i / n
        else:
            a = min(1, i / 3, (n - 1 - i) / 6); s = 1.0 + 0.16 * (1 - ease_out(i / 7)) + 0.025 * i / n
        f = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        if a > 0:
            w, h = int(W * s), int(H * s)
            l = layer.resize((w, h), Image.BILINEAR)
            if a < 1: l.putalpha(l.split()[3].point(lambda v: int(v * a)))
            f.alpha_composite(l, ((W - w) // 2, (H - h) // 2))
        f.save(os.path.join(outdir, '%04d.png' % i), compress_level=1)

def card_title(outdir, n):
    os.makedirs(outdir, exist_ok=True)
    logo = Image.open(LOGO).convert('RGBA')
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([W / 2 - 420, H / 2 - 460, W / 2 + 420, H / 2 + 380], fill=(226, 38, 58, 110))
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    name = text_layer([('OVERTHRONE SMP', font(120), WHITE, 10, H / 2 + 330)])
    for i in range(n):
        f = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        g = glow.copy(); ga = 0.5 + 0.5 * math.exp(-i / 10)
        g.putalpha(g.split()[3].point(lambda v: int(v * ga))); f.alpha_composite(g)
        size = int(720 * (1.0 + 0.5 * (1 - ease_out(i / 6)) + 0.04 * i / n))
        f.alpha_composite(logo.resize((size, size), Image.LANCZOS), ((W - size) // 2, (H - size) // 2 - 120))
        if i >= 4:
            l = name.copy(); a = min(1, (i - 4) / 4)
            l.putalpha(l.split()[3].point(lambda v: int(v * a))); f.alpha_composite(l)
        f.save(os.path.join(outdir, '%04d.png' % i), compress_level=1)

def card_end(outdir, n):
    os.makedirs(outdir, exist_ok=True)
    logo = shadowed(Image.open(LOGO).convert('RGBA').resize((560, 560), Image.LANCZOS), 14)
    parts = [
        (2, text_layer([('YOUR THRONE AWAITS', font(64), RED, 10, 1000)])),
        (4, text_layer([('JOIN NOW', font(230), WHITE, 12, 1070)])),
        (6, text_layer([('51.161.196.66', font(110), WHITE, 6, 1320)])),
        (7, text_layer([('OVERTHRONESMP.NET', font(66), RED, 8, 1450)])),
        (8, text_layer([('TENSURA  ·  SOLO LEVELING  ·  EPIC FIGHT', font(46), GOLD, 4, 1540)])),
    ]
    for i in range(n):
        f = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        s = 1.0 + 0.45 * (1 - ease_out(i / 6)); size = int(560 * s)
        f.alpha_composite(logo.resize((size, size), Image.LANCZOS), ((W - size) // 2, 380 + (560 - size) // 2))
        for beat, layer in parts:
            j = i - frames(beat * BEAT)
            if j < 0: continue
            a = min(1, j / 4); dy = int(40 * (1 - ease_out(j / 8)))
            l = layer if a >= 1 else layer.copy()
            if a < 1: l.putalpha(l.split()[3].point(lambda v: int(v * a)))
            f.alpha_composite(l, (0, dy))
        f.save(os.path.join(outdir, '%04d.png' % i), compress_level=1)

def make_card(kind, dur):
    n = frames(dur)
    gfx = os.path.join(tmp, 'card_' + kind)
    (card_title if kind == 'TITLE' else card_end)(gfx, n)
    bg_clip, bg_src = ('n2', 0.0) if kind == 'TITLE' else ('n4', 18.0)
    out = os.path.join(tmp, kind + '.mp4')
    run(['-ss', str(bg_src), '-t', '%.2f' % (dur * 0.7 + 0.5), '-i', os.path.join(CLIPS, bg_clip + '.mp4'),
         '-framerate', str(FPS), '-i', os.path.join(gfx, '%04d.png'),
         '-filter_complex', '[0:v]crop=%s,scale=%d:%d,setpts=1.5*(PTS-STARTPTS),fps=%d,gblur=sigma=18,'
         'eq=brightness=-0.22:saturation=0.75,vignette=PI/4,format=yuv420p[bg];[bg][1:v]overlay=format=auto,'
         'format=yuv420p,setsar=1[v]' % (vertical_crop('1280:720:0:0', 0.5), W, H, FPS),
         '-map', '[v]', '-frames:v', str(n)] + X264 + [out])
    return out

# ---------------------------------------------------------------- music: re-cut the trailer soundtrack on bar lines
def build_music(path):
    with wave.open(AUDIO) as w:
        sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2).astype(np.float64)
    out = np.zeros((int(TOTAL * sr) + sr, 2))
    xf = int(0.012 * sr)
    for at_bar, src_bar, length in MUSIC:
        a, b = int(bars(src_bar) * sr), int(bars(src_bar + length) * sr) + xf
        seg = x[a:b].copy()
        seg[:xf] *= np.linspace(0, 1, xf)[:, None]; seg[-xf:] *= np.linspace(1, 0, xf)[:, None]
        o = int(bars(at_bar) * sr)
        out[o:o + len(seg)] += seg[: len(out) - o]
    out = out[: int(TOTAL * sr)]
    fade = int(1.6 * sr); out[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(np.clip(out, -32767, 32767).astype(np.int16).tobytes())

# ---------------------------------------------------------------- build
jobs, order, t = [], [], 0.0
for k, (clip, src, pieces, opt) in enumerate(SHOTS):
    shot_dur = sum(d for d, _ in pieces)
    if clip in ('TITLE', 'END'):
        order.append(('card', clip, shot_dur))
    else:
        s = src
        for j, (dur, speed) in enumerate(pieces):
            p = os.path.join(tmp, 'p%02d_%d.mp4' % (k, j))
            jobs.append((p, clip, s, dur, speed, opt)); order.append(('piece', p, dur))
            s += dur * speed
    t += shot_dur
assert abs(t - TOTAL) < 1e-6, (t, TOTAL)

print('rendering %d pieces...' % len(jobs), flush=True)
with cf.ThreadPoolExecutor(4) as ex:
    list(ex.map(render_piece, sorted(jobs, key=lambda j: j[4])))
segs = [make_card(p, d) if kind == 'card' else p for kind, p, d in order]
listfile = os.path.join(tmp, 'list.txt')
with open(listfile, 'w') as f:
    for s in segs: f.write("file '%s'\n" % s)
body = os.path.join(tmp, 'body.mp4')
run(['-f', 'concat', '-safe', '0', '-i', listfile, '-c', 'copy', body])
music = os.path.join(tmp, 'music.wav'); build_music(music)

cap_inputs = []
for k, (bar, length, style, en, sub) in enumerate(CAPTIONS):
    d = os.path.join(tmp, 'cap%02d' % k)
    animate(caption_layer(style, en, sub), frames(bars(length)), style, d)
    cap_inputs.append((d, bars(bar)))

# slow-mo starts (for flashes)
slows, tt = [], 0.0
for clip, _, pieces, _ in SHOTS:
    for dur, speed in pieces:
        if speed < 1 and clip.startswith(('n5', 'c1', 'f')): slows.append(tt)
        tt += dur

fc = ['[0:v]scale=1124:1998,setsar=1[z]']
sx = '+'.join("if(between(t,%.2f,%.2f),18*exp(-(t-%.2f)*8)*sin(2*PI*13*(t-%.2f)),0)" % (h, h + 0.6, h, h) for h in IMPACTS)
sy = '+'.join("if(between(t,%.2f,%.2f),12*exp(-(t-%.2f)*8)*cos(2*PI*11*(t-%.2f)),0)" % (h, h + 0.6, h, h) for h in IMPACTS)
fc.append("[z]crop=%d:%d:x='22+%s':y='39+%s'[s]" % (W, H, sx, sy))
prev = 's'
for k, (d, st) in enumerate(cap_inputs):
    fc.append('[%d:v]format=rgba,setpts=PTS+%.3f/TB[c%d]' % (k + 1, st, k))
    fc.append('[%s][c%d]overlay=eof_action=pass:format=auto[o%d]' % (prev, k, k)); prev = 'o%d' % k
post = []
for h in IMPACTS:
    for j, a in enumerate((0.9, 0.65, 0.45, 0.3, 0.18, 0.08)):
        t0 = h + j / FPS
        post.append("drawbox=x=0:y=0:w=iw:h=ih:color=white@%.2f:t=fill:enable='between(t,%.3f,%.3f)'" % (a, t0, t0 + 0.99 / FPS))
    post.append("rgbashift=rh=-9:bh=9:enable='between(t,%.2f,%.2f)'" % (h, h + 0.2))
for s in slows:
    for j, a in enumerate((0.35, 0.12)):
        t0 = s + j / FPS
        post.append("drawbox=x=0:y=0:w=iw:h=ih:color=white@%.2f:t=fill:enable='between(t,%.3f,%.3f)'" % (a, t0, t0 + 0.99 / FPS))
post += ['noise=alls=4:allf=t', 'fade=out:st=%.2f:d=1.2' % (TOTAL - 1.2), 'format=yuv420p']
fc.append('[%s]%s[v]' % (prev, ','.join(post)))
args = ['-i', body]
for d, _ in cap_inputs: args += ['-framerate', str(FPS), '-i', os.path.join(d, '%04d.png')]
args += ['-i', music]
subprocess.run(['ffmpeg', '-v', 'error', '-stats', '-y'] + args + [
    '-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '%d:a' % (len(cap_inputs) + 1),
    '-t', '%.2f' % TOTAL, '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-profile:v', 'high',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '256k', OUT], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print('wrote', OUT)
