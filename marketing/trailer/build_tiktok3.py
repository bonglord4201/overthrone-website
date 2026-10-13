"""TikTok intro v3 for OVERTHRONE SMP, in the style of a cinematic Minecraft trailer: calm real-speed world tour
with soft crossfades and depth-of-field edges, then hard, intense combat cuts, then the logo. No captions in between.

    python3 build_tiktok3.py <clips_dir> <images_dir> <music.wav> <fonts_dir> <out.mp4>

Music: make_cinematic.py (80 BPM, 1 bar = 3 s, 16 bars).
"""
import concurrent.futures as cf, math, os, shutil, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

CLIPS, IMAGES, AUDIO, FONTS, OUT = sys.argv[1:6]
HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, '..', 'server-icon', 'overthrone-logo-enhanced.png')
W, H, FPS = 1080, 1920, 30
BEAT = 0.75; BAR = 3.0
RED, WHITE, GOLD = (226, 38, 58, 255), (245, 242, 236, 255), (255, 200, 90, 255)
BEBAS = os.path.join(FONTS, 'BebasNeue-Regular.ttf')
tmp = tempfile.mkdtemp(prefix='tiktok3_')
X264 = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-an']
XF = 0.5                                  # crossfade length in the world tour

def run(args): subprocess.run(['ffmpeg', '-v', 'error', '-y'] + args, check=True)
def frames(sec): return int(round(sec * FPS))

NOHUD = '1280:650:0:0'
# ---- world tour (bars 0-8): (source, start, seconds, speed, options). Images: ('img:433', zoom direction)
B3 = 3 * BEAT
WORLD = [
    ('n6',      13.6, B3, 1.0, {'x': 0.5}),                 # sunrise over the forest
    ('img:439', 0,    B3, 1.0, {'x': 0.45, 'zoom': 'in'}),
    ('n2',      0.6,  B3, 1.0, {}),                         # hub portal
    ('n1',      0.6,  B3, 1.0, {}),                         # realms hall
    ('img:434', 0,    B3, 1.0, {'x': 0.5, 'zoom': 'out'}),  # spawn from above
    ('c6',      0.4,  B3, 1.0, {'x': 0.45}),                # the dragon
    ('img:438', 0,    B3, 1.0, {'x': 0.4, 'zoom': 'in'}),
    ('n4',      3.0,  B3, 1.0, {}),                         # dungeon gate
    ('n3',      20.5, B3, 1.0, {'x': 0.6}),                 # casino
    ('img:433', 0,    B3, 1.0, {'x': 0.5, 'zoom': 'in'}),   # temple + chains
    ('n5',      16.2, 2 * BEAT, 0.5, {'x': 0.4}),           # ant boss under the tree, slow
]
# ---- combat (bars 8-13): hard cuts. (source, start, [(seconds, speed)], options)
COMBAT = [
    ('n5', 3.0,   [(BEAT, 1.0), (BEAT, 0.5)], {'x': 0.45}),
    ('c10', 5.9,  [(BEAT, 1.0), (BEAT, 0.45)], {'box': NOHUD}),
    ('c9', 3.6,   [(BEAT, 1.0)], {'box': NOHUD, 'x': 0.4}),
    ('c9', 6.0,   [(BEAT, 1.0)], {'box': NOHUD, 'x': 0.55}),
    ('c11', 14.5, [(BEAT, 1.0), (BEAT, 0.5)], {'box': NOHUD, 'x': 0.45}),
    ('c11', 0.0,  [(BEAT, 1.0), (BEAT, 0.5)], {'box': NOHUD, 'x': 0.4}),
    ('n5', 6.3,   [(2 * BEAT, 0.6)], {'x': 0.5}),
    ('c9', 12.2,  [(BEAT, 1.0), (BEAT, 0.5)], {'box': NOHUD, 'x': 0.45}),
    ('c12', 12.6, [(2 * BEAT, 0.8)], {'box': NOHUD, 'x': 0.5}),
    ('c10', 20.3, [(BEAT, 1.0), (BEAT, 0.5)], {'box': NOHUD}),
    ('c12', 22.4, [(2 * BEAT, 0.6)], {'box': NOHUD, 'x': 0.5}),
]
WORLD_LEN = 8 * BAR; COMBAT_LEN = 5 * BAR; END_LEN = 3 * BAR
TOTAL = WORLD_LEN + COMBAT_LEN + END_LEN

# ---------------------------------------------------------------- look
def grade(lift=1.0, combat=False):
    if lift != 1.0:
        return 'eq=contrast=1.12:saturation=1.2:gamma=%.2f:brightness=0.02,colorbalance=rs=-0.03:bs=0.05:rh=0.06:bh=-0.03' % lift
    if combat:
        return 'eq=contrast=1.14:saturation=1.18:gamma=1.04,colorbalance=rs=-0.04:bs=0.06:rh=0.06:bh=-0.04'
    # warm, soft, cinematic
    return 'eq=contrast=1.06:saturation=1.12:gamma=1.04,colorbalance=rh=0.07:gh=0.02:bh=-0.06:bs=0.04,curves=all=0/0.03 1/0.97'

def dof_mask(path):
    """white = blurred: top and bottom of the frame, soft gradient into the sharp middle (tilt-shift DOF)."""
    m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
    for y in range(H):
        p = y / H
        a = max(0, (0.22 - p) / 0.22) if p < 0.22 else max(0, (p - 0.80) / 0.20)
        d.line([(0, y), (W, y)], fill=int(255 * min(1, a) ** 1.3))
    m.save(path)
MASK = os.path.join(tmp, 'dof.png'); dof_mask(MASK)

def vertical_crop(box, x):
    bw, bh, bx, by = [int(v) for v in box.split(':')]
    cw = int(bh * 9 / 16) // 2 * 2
    return '%d:%d:%d:%d' % (cw, bh, bx + int((bw - cw) * x), by)

def finish_chain(look, dof):
    """returns filter_complex tail taking [v0] -> [v]"""
    if not dof:
        return '[v0]%s,vignette=PI/5,format=yuv420p,setsar=1[v]' % look
    return ('[v0]%s,vignette=PI/5,split[a][b];[b]gblur=sigma=14[bb];[1:v]format=gray,scale=%d:%d[mk];'
            '[bb][mk]alphamerge[m];[a][m]overlay=format=auto,format=yuv420p,setsar=1[v]' % (look, W, H))

def render_video(path, clip, src, dur, speed, opt, look, dof):
    vf = ['crop=' + vertical_crop(opt.get('box', '1280:720:0:0'), opt.get('x', 0.5)),
          'scale=%d:%d:flags=lanczos' % (W, H), 'unsharp=7:7:0.7', 'setpts=%.4f*(PTS-STARTPTS)' % (1 / speed)]
    if speed < 1: vf.append('minterpolate=fps=%d:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1' % FPS)
    vf.append('fps=%d' % FPS)
    fc = '[0:v]' + ','.join(vf) + '[v0];' + finish_chain(look, dof)
    args = ['-ss', '%.3f' % src, '-t', '%.3f' % (dur * speed + 0.5), '-i', os.path.join(CLIPS, clip + '.mp4')]
    if dof: args += ['-loop', '1', '-i', MASK]
    run(args + ['-filter_complex', fc, '-map', '[v]', '-frames:v', str(frames(dur))] + X264 + [path])

def render_image(path, name, dur, opt, look):
    src = [os.path.join(IMAGES, name + e) for e in ('.webp', '.png') if os.path.exists(os.path.join(IMAGES, name + e))][0]
    im = Image.open(src).convert('RGB')
    cw = int(im.height * 9 / 16); cx = int((im.width - cw) * opt.get('x', 0.5))
    im = im.crop((cx, 0, cx + cw, im.height)).resize((W * 2, H * 2), Image.LANCZOS)
    big = os.path.join(tmp, 'img_%s.png' % name); im.save(big)
    n = frames(dur)
    z = "1.0+0.07*on/%d" % n if opt.get('zoom') == 'in' else "1.07-0.07*on/%d" % n
    fc = ('[0:v]zoompan=z=\'%s\':x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':d=%d:s=%dx%d:fps=%d,setsar=1[v0];' % (z, n, W, H, FPS)
          + finish_chain(look, True))
    run(['-i', big, '-loop', '1', '-i', MASK, '-filter_complex', fc, '-map', '[v]', '-frames:v', str(n)] + X264 + [path])

# ---------------------------------------------------------------- text / logo
def font(size): return ImageFont.truetype(BEBAS, size)
def shadowed(img, radius=14, strength=180):
    a = img.split()[3].filter(ImageFilter.GaussianBlur(radius)).point(lambda v: min(255, v * strength // 100))
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); sh.putalpha(a)
    return Image.alpha_composite(sh, img)
def text_layer(lines):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    for text, fnt, fill, track, y in lines:
        ws = [d.textlength(ch, font=fnt) for ch in text]; x = (W - sum(ws) - track * (len(text) - 1)) / 2
        for ch, w in zip(text, ws): d.text((x, y), ch, font=fnt, fill=fill); x += w + track
    return shadowed(img)
def ease_out(x): return 1 - (1 - min(max(x, 0), 1)) ** 3

def opening_title(outdir, n):
    """small, elegant 'OVERTHRONE SMP' fading in and out over the first shots."""
    os.makedirs(outdir, exist_ok=True)
    l1 = text_layer([('OVERTHRONE SMP', font(86), WHITE, 26, H * 0.44)])
    l2 = text_layer([('A MODDED RPG WORLD', font(40), GOLD, 14, H * 0.44 + 100)])
    for i in range(n):
        f = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for layer, delay in ((l1, 0), (l2, 18)):
            j = i - delay; a = min(1, max(0, j) / 24, (n - 1 - i) / 20)
            if a <= 0: continue
            l = layer.copy(); l.putalpha(l.split()[3].point(lambda v: int(v * a)))
            f.alpha_composite(l, (0, int(12 * (1 - ease_out(max(0, j) / 30)))))
        f.save(os.path.join(outdir, '%04d.png' % i), compress_level=1)

def end_card(outdir, n):
    os.makedirs(outdir, exist_ok=True)
    logo = Image.open(LOGO).convert('RGBA')
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([W / 2 - 400, 360, W / 2 + 400, 1160], fill=(226, 38, 58, 120))
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    parts = [(6, text_layer([('JOIN NOW', font(210), WHITE, 12, 1150)])),
             (10, text_layer([('51.161.196.66', font(104), WHITE, 6, 1390)])),
             (13, text_layer([('OVERTHRONESMP.NET', font(62), RED, 8, 1515)])),
             (16, text_layer([('TENSURA  ·  SOLO LEVELING  ·  EPIC FIGHT', font(44), GOLD, 4, 1600)]))]
    for i in range(n):
        f = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        a = min(1, i / 4, (n - 1 - i) / 20)
        g = glow.copy(); g.putalpha(g.split()[3].point(lambda v: int(v * a * (0.6 + 0.4 * math.exp(-i / 12))))); f.alpha_composite(g)
        size = int(620 * (1.0 + 0.4 * (1 - ease_out(i / 7)) + 0.03 * i / n))
        lg = logo.resize((size, size), Image.LANCZOS)
        if a < 1: lg.putalpha(lg.split()[3].point(lambda v: int(v * a)))
        f.alpha_composite(lg, ((W - size) // 2, 760 - size // 2))
        for k, layer in parts:
            j = i - k
            if j < 0: continue
            b = min(1, j / 6, (n - 1 - i) / 20); dy = int(30 * (1 - ease_out(j / 10)))
            l = layer.copy(); l.putalpha(l.split()[3].point(lambda v: int(v * b))); f.alpha_composite(l, (0, dy))
        f.save(os.path.join(outdir, '%04d.png' % i), compress_level=1)

# ---------------------------------------------------------------- render
jobs = []
world_paths = []
for k, (src, start, dur, speed, opt) in enumerate(WORLD):
    p = os.path.join(tmp, 'w%02d.mp4' % k); world_paths.append((p, dur))
    d = dur + (XF if k < len(WORLD) - 1 else 0)          # extra frames for the crossfade
    if src.startswith('img:'): jobs.append(('img', p, src[4:], d, opt, 'eq=contrast=1.2:saturation=1.28:gamma=0.94,' + grade()))
    else: jobs.append(('vid', p, src, start, d, speed, opt, grade(opt.get('lift', 1.0)), True))
combat_paths = []
for k, (src, start, pieces, opt) in enumerate(COMBAT):
    s = start
    for j, (dur, speed) in enumerate(pieces):
        p = os.path.join(tmp, 'c%02d_%d.mp4' % (k, j)); combat_paths.append(p)
        jobs.append(('vid', p, src, s, dur, speed, opt, grade(opt.get('lift', 1.0), True), False)); s += dur * speed
assert abs(sum(d for d, _ in [(sum(x for x, _ in pc), 0) for _, _, pc, _ in COMBAT]) - COMBAT_LEN) < 1e-6
assert abs(sum(d for _, d in world_paths) - WORLD_LEN) < 1e-6

def do(job):
    if job[0] == 'img': render_image(job[1], job[2], job[3], job[4], job[5])
    else: render_video(*job[1:])
print('rendering %d pieces...' % len(jobs), flush=True)
with cf.ThreadPoolExecutor(4) as ex: list(ex.map(do, sorted(jobs, key=lambda j: 0 if j[0] == 'vid' and j[5] < 1 else 1)))

# world: crossfade chain
world = os.path.join(tmp, 'world.mp4')
args, fc, prev, off = [], [], '0:v', 0.0
for i, (p, d) in enumerate(world_paths):
    args += ['-i', p]
    if i == 0: off = d; continue
    fc.append('[%s][%d:v]xfade=transition=fade:duration=%.2f:offset=%.3f[x%d]' % (prev, i, XF, off, i)); prev = 'x%d' % i; off += d
fc.append('[%s]fade=in:st=0:d=1.5,trim=duration=%.3f,setpts=PTS-STARTPTS[v]' % (prev, WORLD_LEN))
run(args + ['-filter_complex', ';'.join(fc), '-map', '[v]', '-frames:v', str(frames(WORLD_LEN))] + X264 + [world])

# end: blurred last combat frame + logo card
endgfx = os.path.join(tmp, 'endgfx'); end_card(endgfx, frames(END_LEN))
endbg = os.path.join(tmp, 'endbg.mp4')
run(['-ss', '0.8', '-t', '%.2f' % (END_LEN / 1.5 + 0.5), '-i', os.path.join(CLIPS, 'n5.mp4'), '-framerate', str(FPS), '-i', os.path.join(endgfx, '%04d.png'),
     '-filter_complex', '[0:v]crop=%s,scale=%d:%d,setpts=1.5*(PTS-STARTPTS),fps=%d,gblur=sigma=20,eq=brightness=-0.25:saturation=0.7,vignette=PI/4,format=yuv420p[bg];'
     '[bg][1:v]overlay=format=auto,format=yuv420p,setsar=1[v]' % (vertical_crop('1280:720:0:0', 0.5), W, H, FPS),
     '-map', '[v]', '-frames:v', str(frames(END_LEN))] + X264 + [endbg])

listfile = os.path.join(tmp, 'list.txt')
with open(listfile, 'w') as f:
    for s in [world] + combat_paths + [endbg]: f.write("file '%s'\n" % s)
body = os.path.join(tmp, 'body.mp4')
run(['-f', 'concat', '-safe', '0', '-i', listfile, '-c', 'copy', body])

# final: opening title, flashes on the drop / logo / combat slow-mo, light grain, fade out
title = os.path.join(tmp, 'title'); opening_title(title, frames(2 * B3))
hits = [WORLD_LEN, WORLD_LEN + COMBAT_LEN]
slows, t = [], WORLD_LEN
for _, _, pieces, _ in COMBAT:
    for dur, speed in pieces:
        if speed < 1: slows.append(t)
        t += dur
fc = ['[0:v]scale=1112:1976,setsar=1[z]']
sx = '+'.join("if(between(t,%.2f,%.2f),6*exp(-(t-%.2f)*10)*sin(2*PI*9*(t-%.2f)),0)" % (h, h + 0.35, h, h) for h in hits)
sy = '+'.join("if(between(t,%.2f,%.2f),4*exp(-(t-%.2f)*10)*cos(2*PI*8*(t-%.2f)),0)" % (h, h + 0.35, h, h) for h in hits)
fc.append("[z]crop=%d:%d:x='16+%s':y='28+%s'[s]" % (W, H, sx, sy))
fc.append('[1:v]format=rgba,setpts=PTS+0.4/TB[t]')
fc.append('[s][t]overlay=eof_action=pass:format=auto[o]')
post = []
for h in hits:
    for j, a in enumerate((0.85, 0.6, 0.4, 0.25, 0.12, 0.05)):
        t0 = h + j / FPS
        post.append("drawbox=x=0:y=0:w=iw:h=ih:color=white@%.2f:t=fill:enable='between(t,%.3f,%.3f)'" % (a, t0, t0 + 0.99 / FPS))
for s in slows:
    for j, a in enumerate((0.22, 0.07)):
        t0 = s + j / FPS
        post.append("drawbox=x=0:y=0:w=iw:h=ih:color=white@%.2f:t=fill:enable='between(t,%.3f,%.3f)'" % (a, t0, t0 + 0.99 / FPS))
post += ['noise=alls=3:allf=t', 'fade=out:st=%.2f:d=1.5' % (TOTAL - 1.5), 'format=yuv420p']
fc.append('[o]%s[v]' % ','.join(post))
subprocess.run(['ffmpeg', '-v', 'error', '-stats', '-y', '-i', body, '-framerate', str(FPS), '-i', os.path.join(title, '%04d.png'), '-i', AUDIO,
                '-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '2:a', '-t', '%.2f' % TOTAL,
                '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                '-c:a', 'aac', '-b:a', '256k', OUT], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print('wrote', OUT)
