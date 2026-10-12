"""OVERTHRONE 'mini-movie' trailer (16:9, 1920x1080, 2.39:1 letterbox), cut to the structure of the reference trailer:
world tour with characters -> walk into the dungeon -> action -> group shot with logo reveal -> JOIN NOW.
All footage is OVERTHRONE's own. Music: make_movie_music.py (80 BPM, 1 bar = 3 s, 56 s).

    python3 build_movie.py <clips_dir> <images_dir> <music.wav> <fonts_dir> <out.mp4>
"""
import concurrent.futures as cf, math, os, shutil, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

CLIPS, IMAGES, AUDIO, FONTS, OUT = sys.argv[1:6]
HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, '..', 'server-icon', 'overthrone-logo-enhanced.png')
W, H, FPS = 1920, 1080, 30
BAR_H = 138                                # letterbox bars (2.39:1)
WHITE, GOLD, RED = (245, 242, 236, 255), (255, 200, 90, 255), (226, 38, 58, 255)
BEBAS = os.path.join(FONTS, 'BebasNeue-Regular.ttf')
tmp = os.environ.get('MOVIE_TMP') or tempfile.mkdtemp(prefix='movie_')   # MOVIE_TMP=<dir> re-uses rendered pieces
X264 = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-an']
def run(args): subprocess.run(['ffmpeg', '-v', 'error', '-y'] + args, check=True)
def frames(sec): return int(round(sec * FPS))
NOHUD = '1280:650:0:0'

# (source, start, seconds, speed, options, transition-into-this-shot)
# sources: clip name, 'img:<file>' (scenery photo, slow push), 'npc:<file>' (small NPC portrait on a blurred backdrop)
STORY = [
    ('n2', 0.6, 4.6, 1.0, {}, None),                         # 1  low glide into the hub
    ('c6', 0.4, 2.4, 1.0, {}, 'fade'),                      # 2  aerial: the dragon over the sky city
    ('n1', 0.6, 2.4, 1.0, {}, 'fade'),                      # 3  the Realms & Tavern hall
    ('c7', 8.3, 1.8, 1.0, {}, 'fade'),                      # 4  inside the tavern
    ('npc:453', 0, 0.8, 1.0, {}, 'cut'),                    # 5  close-up: NPC
    ('c12', 8.4, 1.3, 1.0, {'box': NOHUD}, 'cut'),          # 6  a player walking the red road
    ('img:438', 0, 1.5, 1.0, {'zoom': 'in'}, 'fade'),       # 7  the overworld
    ('img:434', 0, 2.4, 1.0, {'zoom': 'out'}, 'fade'),      # 8  wide: the hub from above
    ('n3', 21.0, 1.3, 1.0, {}, 'cut'),                      # 9  weapon & armour displays
    ('c7', 0.5, 1.5, 1.0, {}, 'cut'),                       # 10 the RPG village market
    ('npc:451', 0, 1.2, 1.0, {}, 'cut'),                    # 11 close-up: NPC in red
    ('n1', 9.8, 0.8, 1.0, {}, 'cut'),                       # 12 the purple portal
    ('npc:452', 0, 0.7, 1.0, {}, 'cut'),                    # 13 close-up: NPC in grey & gold
    ('n5', 0.8, 1.3, 1.0, {}, 'fade'),                      # 14 a hunter on the hill at sunset
    ('n6', 9.0, 4.0, 1.0, {}, 'black'),                     # 15 into the dark forest...
    ('n4', 2.0, 5.0, 1.0, {}, 'fade'),                      # 16 ...to the dungeon gate
]
ACTION = [   # hard cuts on the beat
    ('c10', 5.9, [(0.75, 1.0), (1.5, 0.45)], {'box': NOHUD}),
    ('c11', 0.0, [(0.75, 1.0), (0.75, 0.5)], {'box': NOHUD}),
    ('c9', 3.6, [(0.75, 1.0)], {'box': NOHUD}),
    ('n5', 6.3, [(1.5, 0.6)], {}),
]
GROUP = ('c12', 17.0, 12.0, 0.5, {'box': NOHUD})            # hero shot under the logo
STORY_LEN, ACTION_LEN, GROUP_LEN, END_LEN = 33.0, 6.0, 12.0, 5.0
TOTAL = STORY_LEN + ACTION_LEN + GROUP_LEN + END_LEN         # 56 s
XF = 0.35

def grade(lift=1.0, action=False):
    if action:
        return 'eq=contrast=1.14:saturation=1.16:gamma=1.04,colorbalance=rs=-0.04:bs=0.06:rh=0.06:bh=-0.04'
    return 'eq=contrast=1.07:saturation=1.12:gamma=%.2f,colorbalance=rh=0.08:gh=0.02:bh=-0.07:bs=0.04,curves=all=0/0.03 1/0.97' % (1.04 * lift)

def dof_mask(path):
    m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
    for y in range(H):
        p = y / H
        a = max(0, (0.30 - p) / 0.30) if p < 0.30 else max(0, (p - 0.78) / 0.22)
        d.line([(0, y), (W, y)], fill=int(255 * min(1, a) ** 1.4))
    m.save(path)
MASK = os.path.join(tmp, 'dof.png'); dof_mask(MASK)

def finish(look, dof, extra=''):
    if not dof: return '[v0]%s,vignette=PI/5%s,format=yuv420p,setsar=1[v]' % (look, extra)
    return ('[v0]%s,vignette=PI/5%s,split[a][b];[b]gblur=sigma=10[bb];[1:v]format=gray,scale=%d:%d[mk];'
            '[bb][mk]alphamerge[m];[a][m]overlay=format=auto,format=yuv420p,setsar=1[v]' % (look, extra, W, H))

def render_clip(path, clip, src, dur, speed, opt, look, dof, extra=''):
    vf = ['crop=' + opt.get('box', '1280:720:0:0'), 'scale=%d:%d:flags=lanczos' % (W, H), 'unsharp=5:5:0.6',
          'setpts=%.4f*(PTS-STARTPTS)' % (1 / speed)]
    if speed < 1: vf.append('minterpolate=fps=%d:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1' % FPS)
    vf.append('fps=%d' % FPS)
    args = ['-ss', '%.3f' % src, '-t', '%.3f' % (dur * speed + 0.5), '-i', os.path.join(CLIPS, clip + '.mp4')]
    if dof: args += ['-loop', '1', '-i', MASK]
    run(args + ['-filter_complex', '[0:v]' + ','.join(vf) + '[v0];' + finish(look, dof, extra), '-map', '[v]',
                '-frames:v', str(frames(dur))] + X264 + [path])

def image_file(name):
    return [os.path.join(IMAGES, name + e) for e in ('.webp', '.png') if os.path.exists(os.path.join(IMAGES, name + e))][0]

def render_still(path, src_png, dur, zoom, look):
    n = frames(dur)
    z = "1.0+0.06*on/%d" % n if zoom == 'in' else "1.06-0.06*on/%d" % n
    fc = ('[0:v]zoompan=z=\'%s\':x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':d=%d:s=%dx%d:fps=%d,setsar=1[v0];' % (z, n, W, H, FPS)
          + finish(look, True))
    run(['-i', src_png, '-loop', '1', '-i', MASK, '-filter_complex', fc, '-map', '[v]', '-frames:v', str(n)] + X264 + [path])

def scenery_png(name):
    im = Image.open(image_file(name)).convert('RGB')
    h = int(im.width * 9 / 16); y = max(0, (im.height - h) // 2)
    im = im.crop((0, y, im.width, y + h)).resize((W * 2, H * 2), Image.LANCZOS)
    p = os.path.join(tmp, 'sc_%s.png' % name); im.save(p); return p

def npc_png(name):
    """small NPC screenshot: sharp portrait in the middle, the same picture blurred and darkened behind it."""
    im = Image.open(image_file(name)).convert('RGB')
    bg = im.resize((W * 2, int(W * 2 * im.height / im.width)), Image.LANCZOS)
    y = (bg.height - H * 2) // 2; bg = bg.crop((0, y, W * 2, y + H * 2)).filter(ImageFilter.GaussianBlur(40))
    bg = Image.eval(bg, lambda v: int(v * 0.55))
    ph = int(H * 2 * 0.95); fg = im.resize((int(im.width * ph / im.height), ph), Image.LANCZOS)
    m = Image.new('L', fg.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, fg.width, fg.height), 30, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(25))
    bg.paste(fg, ((W * 2 - fg.width) // 2, (H * 2 - fg.height) // 2), m)
    p = os.path.join(tmp, 'npc_%s.png' % name); bg.save(p); return p

# ---------------------------------------------------------------- render story pieces
jobs, story_paths = [], []
for k, (src, start, dur, speed, opt, tr) in enumerate(STORY):
    nxt = STORY[k + 1][5] if k + 1 < len(STORY) else None
    pad = XF if nxt in ('fade', 'black') else 0.0
    p = os.path.join(tmp, 's%02d.mp4' % k); story_paths.append((p, dur, tr, pad))
    if src.startswith('img:'): jobs.append(('still', p, scenery_png(src[4:]), dur + pad, opt.get('zoom', 'in'), 'eq=contrast=1.18:saturation=1.25:gamma=0.95,' + grade()))
    elif src.startswith('npc:'): jobs.append(('still', p, npc_png(src[4:]), dur + pad, 'in', grade()))
    else: jobs.append(('clip', p, src, start, dur + pad, speed, opt, grade(1.12 if src in ('n6', 'n4', 'c7') else 1.0), True))
action_paths = []
for k, (src, start, pieces, opt) in enumerate(ACTION):
    s = start
    for j, (dur, speed) in enumerate(pieces):
        p = os.path.join(tmp, 'a%02d_%d.mp4' % (k, j)); action_paths.append(p)
        jobs.append(('clip', p, src, s, dur, speed, opt, grade(action=True), False)); s += dur * speed
group = os.path.join(tmp, 'group.mp4')
# rack focus in at the start, then back out of focus as the logo arrives
jobs.append(('group', group))
assert abs(sum(d for _, d, _, _ in story_paths) - STORY_LEN) < 1e-6
assert abs(sum(d for _, _, pc, _ in ACTION for d, _ in pc) - ACTION_LEN) < 1e-6

def do(j):
    if os.path.exists(j[1]) and os.path.getsize(j[1]) > 0: return
    if j[0] == 'still': render_still(j[1], j[2], j[3], j[4], j[5])
    elif j[0] == 'clip': render_clip(*j[1:])
    else:
        src, start, dur, speed, opt = GROUP
        vf = ['crop=' + opt['box'], 'scale=%d:%d:flags=lanczos' % (W, H), 'setpts=%.4f*(PTS-STARTPTS)' % (1 / speed),
              'minterpolate=fps=%d:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1' % FPS, 'fps=%d' % FPS, grade(),
              'vignette=PI/4', 'gblur=sigma=1', 'format=yuv420p', 'setsar=1']
        run(['-ss', str(start), '-t', '%.2f' % (dur * speed + 0.5), '-i', os.path.join(CLIPS, src + '.mp4'),
             '-vf', ','.join(vf), '-frames:v', str(frames(dur))] + X264 + [j[1] + '.raw.mp4'])
        # time-varying blur (rack focus) applied as a second pass with sendcmd-free expression on a split
        run(['-i', j[1] + '.raw.mp4', '-filter_complex',
             "[0:v]split[a][b];[b]gblur=sigma=16[bb];[a][bb]blend=all_expr='A+(B-A)*clip(if(lt(T,1.6),1-T/1.6,(T-4.2)/1.5),0,1)'[o];[o]format=yuv420p[v]",
             '-map', '[v]', '-frames:v', str(frames(dur))] + X264 + [j[1]])
print('rendering %d pieces...' % len(jobs), flush=True)
with cf.ThreadPoolExecutor(4) as ex: list(ex.map(do, jobs))

# story: transitions (fade = dissolve, black = through black, cut = hard cut)
story = os.path.join(tmp, 'story.mp4')
args, fc, prev, off = [], [], None, 0.0
for i, (p, d, tr, pad) in enumerate(story_paths):
    args += ['-i', p]
    fc.append('[%d:v]settb=AVTB,setpts=PTS-STARTPTS,fps=%d,format=yuv420p,setsar=1,settb=AVTB[i%d]' % (i, FPS, i))
    if i == 0: prev = 'i0'; off = d; continue
    if tr in ('fade', 'black'):
        fc.append('[%s][i%d]xfade=transition=%s:duration=%.2f:offset=%.3f,settb=AVTB[x%d]' % (prev, i, 'fadeblack' if tr == 'black' else 'fade', XF, off, i))
    else:
        fc.append('[%s][i%d]concat=n=2:v=1:a=0,settb=AVTB[x%d]' % (prev, i, i))
    prev = 'x%d' % i; off += d
fc.append('[%s]fade=in:st=0:d=1.8,trim=duration=%.3f,setpts=PTS-STARTPTS[v]' % (prev, STORY_LEN))
run(args + ['-filter_complex', ';'.join(fc), '-map', '[v]', '-frames:v', str(frames(STORY_LEN))] + X264 + [story])

# ---------------------------------------------------------------- logo + end card graphics
def font(size): return ImageFont.truetype(BEBAS, size)
def shadowed(img, r=14, k=180):
    a = img.split()[3].filter(ImageFilter.GaussianBlur(r)).point(lambda v: min(255, v * k // 100))
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); sh.putalpha(a); return Image.alpha_composite(sh, img)
def text(t, size, fill, track, y):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img); f = font(size)
    ws = [d.textlength(c, font=f) for c in t]; x = (W - sum(ws) - track * (len(t) - 1)) / 2
    for c, w in zip(t, ws): d.text((x, y), c, font=f, fill=fill); x += w + track
    return shadowed(img)
def ease(x): return 1 - (1 - min(max(x, 0), 1)) ** 3

logo_dir = os.path.join(tmp, 'logo'); os.makedirs(logo_dir)
logo = shadowed(Image.open(LOGO).convert('RGBA').resize((520, 520), Image.LANCZOS), 18)
n = frames(GROUP_LEN); start = frames(4.0)
for i in range(n):
    f = Image.new('RGBA', (W, H), (0, 0, 0, 0)); j = i - start
    if j >= 0:
        a = min(1, j / 40, (n - 1 - i) / 20); s = 1.06 - 0.06 * ease(j / 120)
        size = int(520 * s); lg = logo.resize((size, size), Image.LANCZOS)
        lg.putalpha(lg.split()[3].point(lambda v: int(v * a))); f.alpha_composite(lg, ((W - size) // 2, (H - size) // 2 - 20))
    f.save(os.path.join(logo_dir, '%04d.png' % i), compress_level=1)
end_dir = os.path.join(tmp, 'end'); os.makedirs(end_dir)
l1 = text('JOIN NOW', 120, WHITE, 14, 400); l2 = text('51.161.196.66', 64, GOLD, 8, 545); l3 = text('OVERTHRONESMP.NET', 40, RED, 8, 630)
for i in range(frames(END_LEN)):
    f = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    for k, l in enumerate((l1, l2, l3)):
        a = min(1, max(0, i - 6 * k) / 15, (frames(END_LEN) - 1 - i) / 20)
        if a > 0: c = l.copy(); c.putalpha(c.split()[3].point(lambda v: int(v * a))); f.alpha_composite(c)
    f.save(os.path.join(end_dir, '%04d.png' % i), compress_level=1)
endv = os.path.join(tmp, 'end.mp4')
run(['-framerate', str(FPS), '-i', os.path.join(end_dir, '%04d.png'), '-vf', 'format=yuv420p,setsar=1'] + X264 + [endv])

listfile = os.path.join(tmp, 'list.txt')
with open(listfile, 'w') as f:
    for s in [story] + action_paths + [group, endv]: f.write("file '%s'\n" % s)
body = os.path.join(tmp, 'body.mp4')
run(['-f', 'concat', '-safe', '0', '-i', listfile, '-c', 'copy', body])

# ---------------------------------------------------------------- final: logo overlay, flashes, letterbox, grain
g0 = STORY_LEN + ACTION_LEN
slows, t = [], STORY_LEN
for _, _, pieces, _ in ACTION:
    for d, sp in pieces:
        if sp < 1: slows.append(t)
        t += d
post = []
for h, amps in ((STORY_LEN, (0.6, 0.35, 0.15)), (g0, (0.9, 0.6, 0.35, 0.18, 0.06))):
    for j, a in enumerate(amps):
        t0 = h + j / FPS
        post.append("drawbox=x=0:y=0:w=iw:h=ih:color=white@%.2f:t=fill:enable='between(t,%.3f,%.3f)'" % (a, t0, t0 + 0.99 / FPS))
for s in slows:
    t0 = s; post.append("drawbox=x=0:y=0:w=iw:h=ih:color=white@0.2:t=fill:enable='between(t,%.3f,%.3f)'" % (t0, t0 + 0.99 / FPS))
post += ['noise=alls=4:allf=t', 'drawbox=x=0:y=0:w=iw:h=%d:color=black:t=fill' % BAR_H, 'drawbox=x=0:y=ih-%d:w=iw:h=%d:color=black:t=fill' % (BAR_H, BAR_H),
         'fade=out:st=%.2f:d=1.2' % (TOTAL - 1.2), 'format=yuv420p']
fc = ['[1:v]format=rgba,setpts=PTS+%.3f/TB[lg]' % g0, '[0:v][lg]overlay=eof_action=pass:format=auto[o]', '[o]%s[v]' % ','.join(post)]
subprocess.run(['ffmpeg', '-v', 'error', '-stats', '-y', '-i', body, '-framerate', str(FPS), '-i', os.path.join(logo_dir, '%04d.png'), '-i', AUDIO,
                '-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '2:a', '-t', '%.2f' % TOTAL, '-c:v', 'libx264', '-preset', 'slow',
                '-crf', '19', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '256k', OUT], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print('wrote', OUT)
