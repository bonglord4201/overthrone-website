"""Cuts the OVERTHRONE SMP trailer from the recorded clips, locked to the soundtrack's beat grid.

    python3 build_trailer.py <clips_dir> <music.wav> <fonts_dir> <out.mp4>

<clips_dir> holds c1.mp4 ... c12.mp4 (INTRO_1 ... INTRO_12). <fonts_dir> holds Bebas Neue and
Shippori Mincho B1 (both SIL Open Font License, from github.com/google/fonts).
The edit itself (shots, speeds, captions, hits) lives in timeline.py.
"""
import concurrent.futures as cf, math, os, shutil, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import timeline as T

CLIPS, MUSIC, FONTS, OUT = sys.argv[1:5]
HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, '..', 'server-icon', 'overthrone-logo-enhanced.png')
W, H, FPS = 1280, 720, T.FPS
BARS = 92                                         # 2.39:1 letterbox; also hides the HUD corners
RED, WHITE = (226, 38, 58, 255), (245, 242, 236, 255)
BEBAS = os.path.join(FONTS, 'BebasNeue-Regular.ttf')
MINCHO = os.path.join(FONTS, 'ShipporiMinchoB1-ExtraBold.ttf')
tmp = tempfile.mkdtemp(prefix='trailer_')
X264 = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-an']

def run(args): subprocess.run(['ffmpeg', '-v', 'error', '-y'] + args, check=True)
def frames(sec): return int(round(sec * FPS))

# ---------------------------------------------------------------- per-section colour grade
def grade_for(t):
    if t < T.bars(T.BUILD):    # sky city: warm highlights, rich colour
        return 'eq=contrast=1.08:saturation=1.22:gamma=0.98,colorbalance=rh=0.04:bh=-0.04:bs=0.03'
    if t < T.bars(T.RPG):      # combat: punchy, cool shadows
        return 'eq=contrast=1.16:saturation=1.15:gamma=0.97,colorbalance=rs=-0.04:bs=0.06:rh=0.05:bh=-0.03'
    return 'eq=contrast=1.1:saturation=1.12:gamma=1.12:brightness=0.02,colorbalance=rh=0.05:bh=-0.04'   # RPG world is dark

# ---------------------------------------------------------------- shot pieces
def render_piece(job):
    path, clip, src, dur, speed, crop, grade, extra = job
    n = frames(dur)
    vf = []
    if crop: vf.append('crop=948:533:60:107,scale=1280:720:flags=lanczos')     # zoom past the Epic Fight HUD
    vf.append('setpts=%.4f*(PTS-STARTPTS)' % (1 / speed))
    if speed < 1:
        vf.append('minterpolate=fps=%d:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1' % FPS)
    vf += ['fps=%d' % FPS, grade, 'vignette=PI/5', 'format=yuv420p', 'setsar=1']
    run(['-ss', '%.3f' % src, '-t', '%.3f' % (dur * speed + 0.4), '-i', os.path.join(CLIPS, clip + '.mp4'),
         '-vf', ','.join(vf + extra), '-frames:v', str(n)] + X264 + [path])
    return path

# ---------------------------------------------------------------- text
def font(path, size): return ImageFont.truetype(path, size)

def text_layer(lines):
    """lines: [(text, font, fill, tracking, y)] centred horizontally. Returns an RGBA layer with a soft shadow."""
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for text, fnt, fill, track, y, *rest in lines:
        cx = rest[0] if rest else W / 2
        ws = [d.textlength(ch, font=fnt) for ch in text]
        x = cx - (sum(ws) + track * (len(text) - 1)) / 2
        for ch, w in zip(text, ws):
            d.text((x, y), ch, font=fnt, fill=fill)
            x += w + track
    return shadowed(img)

def shadowed(img, radius=10, strength=170):
    a = img.split()[3].filter(ImageFilter.GaussianBlur(radius)).point(lambda v: min(255, v * strength // 100))
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); sh.putalpha(a)
    return Image.alpha_composite(sh, img)

def red_rule(d, cx, y, half, gap):
    d.line([(cx - gap - half, y), (cx - gap, y)], fill=RED, width=2)
    d.line([(cx + gap, y), (cx + gap + half, y)], fill=RED, width=2)

def ease_out(x): return 1 - (1 - min(max(x, 0), 1)) ** 3

def animate(layer, n, style, outdir):
    """Write n PNG frames animating a full-frame RGBA layer: 'slam' punches in, 'word' hits hard, 'soft' fades."""
    os.makedirs(outdir, exist_ok=True)
    for i in range(n):
        if style == 'soft':
            a = min(1, i / 15, (n - 1 - i) / 15); s = 1.0 + 0.03 * i / n
        elif style == 'word':
            a = min(1, i / 2, (n - 1 - i) / 3); s = 1.0 + 0.35 * (1 - ease_out(i / 4)) + 0.02 * i / n
        else:
            a = min(1, i / 3, (n - 1 - i) / 6); s = 1.0 + 0.16 * (1 - ease_out(i / 7)) + 0.025 * i / n
            if i > n - 7: s += 0.012 * (i - (n - 7))
        frame = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        if a > 0:
            w, h = int(W * s), int(H * s)
            l = layer.resize((w, h), Image.BILINEAR)
            if a < 1: l.putalpha(l.split()[3].point(lambda v: int(v * a)))
            frame.alpha_composite(l, ((W - w) // 2, (H - h) // 2)) if s >= 1 else frame.alpha_composite(l)
        frame.save(os.path.join(outdir, '%04d.png' % i), compress_level=1)

def caption_layer(style, en, jp, sub):
    if style == 'word':
        return text_layer([(en, font(BEBAS, 190), WHITE, 14, H / 2 - 105)])
    if style == 'soft':
        layer = text_layer([(jp, font(MINCHO, 34), RED, 14, H / 2 + 120), (en, font(BEBAS, 46), WHITE, 16, H / 2 + 168)])
        return layer
    big = 128 if len(en) <= 14 else 104
    lines = [(jp, font(MINCHO, 46), RED, 18, H / 2 - 134), (en, font(BEBAS, big), WHITE, 10, H / 2 - 70)]
    if sub: lines.append((sub, font(BEBAS, 34), WHITE, 6, H / 2 + 62))
    layer = text_layer(lines)
    d = ImageDraw.Draw(layer)
    jw = d.textlength(jp, font=font(MINCHO, 46)) + 18 * (len(jp) - 1)
    red_rule(d, W / 2, H / 2 - 100, 70, jw / 2 + 24)
    return layer

def card_title(outdir, n):
    """Logo slam with a giant faint kanji 覇 ('supremacy') behind it."""
    os.makedirs(outdir, exist_ok=True)
    logo = Image.open(LOGO).convert('RGBA')
    kanji = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(kanji).text((W / 2, H / 2), '覇', font=font(MINCHO, 400), fill=(226, 38, 58, 46), anchor='mm')
    kana = text_layer([('オーバースローン', font(MINCHO, 28), WHITE, 16, 560)])
    for i in range(n):
        f = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ks = 1.0 + 0.08 * i / n
        k = kanji.resize((int(W * ks), int(H * ks)), Image.BILINEAR)
        f.alpha_composite(k, ((W - k.width) // 2, (H - k.height) // 2))
        size = int(400 * (1.0 + 0.5 * (1 - ease_out(i / 6)) + 0.04 * i / n))
        lg = logo.resize((size, size), Image.LANCZOS)
        f.alpha_composite(lg, ((W - size) // 2, (H - size) // 2 - 20))
        if i >= 9:
            kk = kana.copy(); a = min(1, (i - 9) / 8)
            kk.putalpha(kk.split()[3].point(lambda v: int(v * a))); f.alpha_composite(kk)
        a = min(1, (n - 1 - i) / 6)
        if a < 1: f.putalpha(f.split()[3].point(lambda v: int(v * a)))
        f.save(os.path.join(outdir, '%04d.png' % i), compress_level=1)

def card_end(outdir, n):
    os.makedirs(outdir, exist_ok=True)
    logo = shadowed(Image.open(LOGO).convert('RGBA').resize((330, 330), Image.LANCZOS), 12)
    tx = 600
    parts = [   # (appear at beat, layer)
        (2, text_layer([('王座を掴め', font(MINCHO, 38), RED, 14, 196, tx + 190)])),
        (4, text_layer([('JOIN NOW', font(BEBAS, 132), WHITE, 10, 238, tx + 230)])),
        (6, text_layer([('51.161.196.66', font(BEBAS, 66), WHITE, 6, 380, tx + 230)])),
        (7, text_layer([('OVERTHRONESMP.NET', font(BEBAS, 40), RED, 8, 456, tx + 230)])),
        (8, text_layer([('MODDED  ·  TENSURA  ·  EPIC FIGHT  ·  RPG', font(BEBAS, 28), WHITE, 4, 512, tx + 230)])),
    ]
    for i in range(n):
        f = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        s = 1.0 + 0.45 * (1 - ease_out(i / 6))
        size = int(330 * s)
        f.alpha_composite(logo.resize((size, size), Image.LANCZOS), (170 + (330 - size) // 2, 195 + (330 - size) // 2))
        for beat, layer in parts:
            j = i - frames(beat * T.BEAT)
            if j < 0: continue
            a = min(1, j / 4); dx = int(30 * (1 - ease_out(j / 8)))
            l = layer if a >= 1 else layer.copy()
            if a < 1: l.putalpha(l.split()[3].point(lambda v: int(v * a)))
            f.alpha_composite(l, (dx, 0))
        f.save(os.path.join(outdir, '%04d.png' % i), compress_level=1)

# ---------------------------------------------------------------- build the shot list
jobs, order, t = [], [], 0.0
intro_parts = []
for k, (clip, src, pieces, opt) in enumerate(T.SHOTS):
    shot_dur = sum(d for d, _ in pieces)
    if clip in ('TITLE', 'END'):
        order.append(('card', clip, t, shot_dur))
    else:
        s = src
        for j, (dur, speed) in enumerate(pieces):
            path = os.path.join(tmp, 'p%02d_%d.mp4' % (k, j))
            extra_dur = 0.4 if opt.get('fade') else 0.0         # overlap for the intro dissolves
            jobs.append((path, clip, s, dur + extra_dur, speed, opt.get('crop', False), grade_for(t), []))
            (intro_parts if opt.get('fade') else order).append(('piece', path, t, dur))
            s += dur * speed
    t += shot_dur
assert abs(t - T.TOTAL) < 1e-6, t

print('rendering %d shot pieces...' % len(jobs), flush=True)
with cf.ThreadPoolExecutor(4) as ex:
    list(ex.map(render_piece, sorted(jobs, key=lambda j: j[4])))   # slow-mo first (slowest)

# intro: dissolves between the 4 opening shots, fade up from black
intro = os.path.join(tmp, 'intro.mp4')
fc, prev = [], '0:v'
for i in range(1, len(intro_parts)):
    fc.append('[%s][%d:v]xfade=transition=fade:duration=0.4:offset=%.2f[x%d]' % (prev, i, T.bars(2 * i), i))
    prev = 'x%d' % i
fc.append('[%s]fade=in:st=0:d=1.2,trim=duration=%.2f,setpts=PTS-STARTPTS[v]' % (prev, T.bars(T.TITLE)))
args = []
for _, p, _, _ in intro_parts: args += ['-i', p]
run(args + ['-filter_complex', ';'.join(fc), '-map', '[v]', '-frames:v', str(frames(T.bars(T.TITLE)))] + X264 + [intro])

# title + end cards: blurred, darkened footage behind animated graphics
def make_card(kind, start, dur):
    n = frames(dur)
    gfx = os.path.join(tmp, 'card_' + kind)
    (card_title if kind == 'TITLE' else card_end)(gfx, n)
    bg_clip, bg_src = ('c2', 3.0) if kind == 'TITLE' else ('c1', 10.0)
    out = os.path.join(tmp, kind + '.mp4')
    run(['-ss', str(bg_src), '-t', '%.2f' % (dur * 0.6 + 0.5), '-i', os.path.join(CLIPS, bg_clip + '.mp4'),
         '-framerate', str(FPS), '-i', os.path.join(gfx, '%04d.png'),
         '-filter_complex', '[0:v]setpts=1.6*(PTS-STARTPTS),fps=%d,gblur=sigma=14,eq=brightness=-0.2:saturation=0.75,'
         'vignette=PI/4,format=yuv420p[bg];[bg][1:v]overlay=format=auto,format=yuv420p,setsar=1[v]' % FPS,
         '-map', '[v]', '-frames:v', str(n)] + X264 + [out])
    return out

segments = [intro]
for kind, path, start, dur in order:
    segments.append(make_card(path, start, dur) if kind == 'card' else path)
listfile = os.path.join(tmp, 'list.txt')
with open(listfile, 'w') as f:
    for s in segments: f.write("file '%s'\n" % s)
body = os.path.join(tmp, 'body.mp4')
run(['-f', 'concat', '-safe', '0', '-i', listfile, '-c', 'copy', body])

# ---------------------------------------------------------------- captions
cap_inputs = []
for k, (bar, length, style, en, jp, sub) in enumerate(T.CAPTIONS):
    d = os.path.join(tmp, 'cap%02d' % k)
    animate(caption_layer(style, en, jp, sub), frames(T.bars(length)), style, d)
    cap_inputs.append((d, T.bars(bar)))

# ---------------------------------------------------------------- final pass
starts, slows, _ = T.shot_times()
fc = ['[0:v]scale=1318:742,setsar=1[z]']
shake_x = '+'.join("if(between(t,%.2f,%.2f),14*exp(-(t-%.2f)*8)*sin(2*PI*13*(t-%.2f)),0)" % (h, h + 0.6, h, h) for h in T.IMPACTS)
shake_y = '+'.join("if(between(t,%.2f,%.2f),9*exp(-(t-%.2f)*8)*cos(2*PI*11*(t-%.2f)),0)" % (h, h + 0.6, h, h) for h in T.IMPACTS)
fc.append("[z]crop=1280:720:x='19+%s':y='11+%s'[s]" % (shake_x, shake_y))
prev = 's'
for k, (d, st) in enumerate(cap_inputs):
    fc.append('[%d:v]format=rgba,setpts=PTS+%.3f/TB[c%d]' % (k + 1, st, k))
    fc.append('[%s][c%d]overlay=eof_action=pass:format=auto[o%d]' % (prev, k, k))
    prev = 'o%d' % k
post = []
for h in T.IMPACTS:                                        # white flash + RGB split on every big hit
    for j, a in enumerate((0.9, 0.65, 0.45, 0.3, 0.18, 0.08)):
        t0 = h + j / FPS
        post.append("drawbox=x=0:y=0:w=iw:h=ih:color=white@%.2f:t=fill:enable='between(t,%.3f,%.3f)'" % (a, t0, t0 + 0.99 / FPS))
    post.append("rgbashift=rh=-7:bh=7:enable='between(t,%.2f,%.2f)'" % (h, h + 0.2))
for s in slows:                                            # quick flash on each slow-motion strike
    if T.bars(T.BUILD) <= s < T.bars(T.HERO):
        for j, a in enumerate((0.3, 0.12)):
            t0 = s + j / FPS
            post.append("drawbox=x=0:y=0:w=iw:h=ih:color=white@%.2f:t=fill:enable='between(t,%.3f,%.3f)'" % (a, t0, t0 + 0.99 / FPS))
post += ['drawbox=x=0:y=0:w=iw:h=%d:color=black:t=fill' % BARS, 'drawbox=x=0:y=ih-%d:w=iw:h=%d:color=black:t=fill' % (BARS, BARS),
         'noise=alls=4:allf=t', 'fade=out:st=%.2f:d=1.4' % (T.TOTAL - 1.4), 'format=yuv420p']
fc.append('[%s]%s[v]' % (prev, ','.join(post)))

args = ['-i', body]
for d, _ in cap_inputs: args += ['-framerate', str(FPS), '-i', os.path.join(d, '%04d.png')]
args += ['-i', MUSIC]
subprocess.run(['ffmpeg', '-v', 'error', '-stats', '-y'] + args + [
    '-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '%d:a' % (len(cap_inputs) + 1),
    '-t', '%.2f' % T.TOTAL, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-profile:v', 'high',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '256k', OUT], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print('wrote', OUT)
