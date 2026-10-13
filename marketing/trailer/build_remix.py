"""OVERTHRONE remix of the owner's own pre-rebrand trailer (the old Mineshoku Tensei TikTok, 61 s, 1024x576).

The TikTok watermark, the old logo, 'COMING SOON' and the TikTok outro are cut out; OVERTHRONE hub shots are cut in
(one replaces the old town panorama); the ending becomes the OVERTHRONE logo over the hub, then a JOIN NOW card.
Music: the original 56 s score from make_movie_music.py (its big hit at 39 s lands on the bridge shot).

    python3 build_remix.py <ref.mov> <clips_dir> <hub_still.png | clip:<name>:<start>> <music.wav> <fonts_dir> <out.mp4>
"""
import os, shutil, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

REF, CLIPS, STILL, AUDIO, FONTS, OUT = sys.argv[1:7]
IMAGES = os.environ.get('REMIX_IMAGES', CLIPS)        # folder with the hub screenshots ('img' shots)
HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, '..', 'server-icon', 'overthrone-logo-enhanced.png')
W, H, FPS = 1920, 1080, 30
MODE = os.environ.get('REMIX_MODE', 'scope')   # scope = 2.71:1 with black bars, full = 16:9 full screen
if MODE == 'full':
    PH, PY = H, 0
    REF_CROP = '732:412:166:82'              # 16:9 window inside the old trailer that misses both TikTok watermarks
    CLIP_CROP = '1156:650:62:0'              # 16:9 above the hotbar
else:
    PH = 708; PY = (H - PH) // 2             # picture band (2.71:1), black bars above and below
    REF_CROP, CLIP_CROP = '1024:378:0:98', '1280:472:0:89'
BEBAS = os.path.join(FONTS, 'BebasNeue-Regular.ttf')
X264 = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-an']
tmp = tempfile.mkdtemp(prefix='remix_')
def run(a): subprocess.run(['ffmpeg', '-v', 'error', '-y'] + a, check=True)
def frames(s): return int(round(s * FPS))
BAND = 'scale=%d:%d:flags=lanczos,unsharp=5:5:0.5,pad=%d:%d:0:%d:black,setsar=1,fps=%d' % (W, PH, W, H, PY, FPS)
WARM = 'eq=contrast=1.08:saturation=1.12:gamma=1.03,colorbalance=rh=0.08:gh=0.03:bh=-0.08:bs=0.03'

# (kind, source, start, seconds, speed)   ref = old trailer, clip = OVERTHRONE footage
# every cut sits on the 80 BPM grid (1 beat = 0.75 s, 1 bar = 3 s); the big hit at 39 s (bar 13) lands on the bridge
CUT = [
    ('img', '458', 0, 3.0, 'in'),          # OVERTHRONE first: the red temple tower between the trees
    ('clip', 'c3', 4.0, 3.0, 0.75),        # flying past the temples above the clouds
    ('ref', None, 0.733, 7.5, 1),          # crops & village, aerial valley
    ('ref', None, 8.767, 2.25, 1),         # walking through the crops
    ('img', '457', 0, 2.25, 'out'),        # OVERTHRONE pagoda and statue (replaces the dark house)
    ('ref', None, 13.333, 3.0, 1),         # villager, wheat, cliff
    ('img', '461', 0, 2.25, 'in'),         # OVERTHRONE courtyard and pillars (replaces the old town panorama)
    ('ref', None, 19.3, 1.5, 1),           # blacksmith
    ('clip', 'n1', 9.0, 1.5, 0.75),        # OVERTHRONE golden hall to the portal (replaces the old market street)
    ('ref', None, 22.067, 6.0, 1),         # armour, faces, mage, into the forest and the mine
    ('ref', None, 34.0, 2.25, 1),          # the swing (the staff close-up after it is left out)
    ('fight', 'f2', 1.5, 1.5, 1),          # OVERTHRONE Epic Fight: the Lycanth werewolf boss appears
    ('fight', 'f1', 1.0, 0.75, 1),         # skill blast through the wither skeletons
    ('fight', 'f2', 4.4, 0.75, 1),         # trading blows with the werewolf
    ('fight', 'f1', 10.4, 0.75, 1),        # combo burst
    ('fight', 'f2', 22.5, 0.75, 1),        # the werewolf lunges
    ('ref', None, 38.067, 7.5, 1),         # bridge (on the hit), tilt up into the blur (cut before the old logo)
]
FIGHT = 'eq=contrast=1.12:saturation=1.2:gamma=1.35,colorbalance=rs=-0.03:bs=0.05:rh=0.06'
XF, LOGO_LEN, END_LEN = 0.6, 5.35, 4.0     # JOIN NOW lands at 50.75 s, on bar 17

pieces = []
for i, (kind, src, start, dur, speed) in enumerate(CUT):
    p = os.path.join(tmp, 'p%02d.mp4' % i); pieces.append(p)
    if kind == 'ref':
        run(['-ss', '%.3f' % start, '-t', '%.3f' % (dur + 0.3), '-i', REF, '-vf',
             'crop=' + REF_CROP + ',' + BAND + ',' + 'eq=saturation=1.05', '-frames:v', str(frames(dur))] + X264 + [p])
    elif kind == 'img':     # hub screenshot: slow push in / pull out
        im = Image.open([os.path.join(IMAGES, src + e) for e in ('.webp', '.png', '.jpg') if os.path.exists(os.path.join(IMAGES, src + e))][0]).convert('RGB')
        bh = int(im.width * PH / W); y0 = max(0, (im.height - bh) // 2)
        im = im.crop((0, y0, im.width, y0 + min(bh, im.height))).resize((W * 2, PH * 2), Image.LANCZOS)
        sp = p + '.png'; im.save(sp); n = frames(dur)
        z = "1.0+0.08*on/%d" % n if speed == 'in' else "1.08-0.08*on/%d" % n
        run(['-i', sp, '-vf', "zoompan=z='%s':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=%d:s=%dx%d:fps=%d,%s,pad=%d:%d:0:%d:black,setsar=1"
             % (z, n, W, PH, FPS, 'eq=contrast=1.04:saturation=1.08,colorbalance=rh=0.05:bh=-0.05', W, H, PY), '-frames:v', str(n)] + X264 + [p])
    elif kind == 'fight':   # real speed, brightened, hard cuts
        run(['-ss', '%.3f' % start, '-t', '%.3f' % (dur + 0.3), '-i', os.path.join(CLIPS, src + '.mp4'), '-vf',
             'crop=' + CLIP_CROP + ',' + FIGHT + ',' + BAND, '-frames:v', str(frames(dur))] + X264 + [p])
    else:   # 1280x720 gameplay: crop the band above the hotbar, slow it down smoothly
        vf = ['crop=' + CLIP_CROP, 'setpts=%.4f*(PTS-STARTPTS)' % (1 / speed),
              'minterpolate=fps=%d:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1' % FPS, WARM, BAND]
        run(['-ss', '%.3f' % start, '-t', '%.3f' % (dur * speed + 0.5), '-i', os.path.join(CLIPS, src + '.mp4'),
             '-vf', ','.join(vf), '-frames:v', str(frames(dur))] + X264 + [p])

# hub shot under the logo: slow push / slow motion, out of focus -> sharp
n = frames(LOGO_LEN); still = os.path.join(tmp, 'still.mp4')
FOCUS = "split[a][b];[b]gblur=sigma=18[bb];[a][bb]blend=all_expr='A+(B-A)*clip(1-(T-0.3)/2.2,0,1)',vignette=PI/4,pad=%d:%d:0:%d:black" % (W, H, PY)
if STILL.startswith('img:'):
    STILL = [os.path.join(IMAGES, STILL[4:] + e) for e in ('.webp', '.png', '.jpg') if os.path.exists(os.path.join(IMAGES, STILL[4:] + e))][0]
if STILL.startswith('clip:'):
    _, name, st = STILL.split(':')
    vf = ['crop=' + CLIP_CROP, 'setpts=2*(PTS-STARTPTS)', 'minterpolate=fps=%d:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1' % FPS,
          WARM, 'scale=%d:%d:flags=lanczos' % (W, PH), 'setsar=1,fps=%d' % FPS]
    run(['-ss', st, '-t', '%.2f' % (LOGO_LEN / 2 + 0.5), '-i', os.path.join(CLIPS, name + '.mp4'), '-filter_complex',
         '[0:v]' + ','.join(vf) + ',' + FOCUS + '[v]', '-map', '[v]', '-frames:v', str(n)] + X264 + [still])
else:
    im = Image.open(STILL).convert('RGB'); bh = int(im.width * PH / W)
    im = im.crop((0, (im.height - bh) // 2, im.width, (im.height - bh) // 2 + bh)).resize((W * 2, PH * 2), Image.LANCZOS)
    sp = os.path.join(tmp, 'still.png'); im.save(sp)
    run(['-i', sp, '-filter_complex',
         "[0:v]zoompan=z='1.0+0.07*on/%d':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=%d:s=%dx%d:fps=%d,%s,setsar=1,%s[v]"
         % (n, n, W, PH, FPS, WARM, FOCUS), '-map', '[v]', '-frames:v', str(n)] + X264 + [still])

# logo + end card frames
def shadowed(img, r=16):
    a = img.split()[3].filter(ImageFilter.GaussianBlur(r)).point(lambda v: min(255, v * 9 // 5))
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); sh.putalpha(a); return Image.alpha_composite(sh, img)
def text(t, size, fill, track, y):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img); f = ImageFont.truetype(BEBAS, size)
    ws = [d.textlength(c, font=f) for c in t]; x = (W - sum(ws) - track * (len(t) - 1)) / 2
    for c, w in zip(t, ws): d.text((x, y), c, font=f, fill=fill); x += w + track
    return shadowed(img, 12)
def ease(x): return 1 - (1 - min(max(x, 0), 1)) ** 3

logo_dir = os.path.join(tmp, 'logo'); os.makedirs(logo_dir)
logo = shadowed(Image.open(LOGO).convert('RGBA').resize((560, 560), Image.LANCZOS), 20)
L0 = frames(1.0)                                           # logo starts as the picture comes into focus
for i in range(n):
    f = Image.new('RGBA', (W, H), (0, 0, 0, 0)); j = i - L0
    if j >= 0:
        a = min(1, j / 30, (n - 1 - i) / 15); s = 1.08 - 0.08 * ease(j / 90); size = int(560 * s)
        lg = logo.resize((size, size), Image.LANCZOS); lg.putalpha(lg.split()[3].point(lambda v: int(v * a)))
        f.alpha_composite(lg, ((W - size) // 2, (H - size) // 2))
    f.save(os.path.join(logo_dir, '%04d.png' % i), compress_level=1)
logov = os.path.join(tmp, 'logo.mp4')
run(['-i', still, '-framerate', str(FPS), '-i', os.path.join(logo_dir, '%04d.png'), '-filter_complex',
     '[0:v][1:v]overlay=format=auto,format=yuv420p[v]', '-map', '[v]', '-frames:v', str(n)] + X264 + [logov])

end_dir = os.path.join(tmp, 'end'); os.makedirs(end_dir)
lines = (text('JOIN NOW', 120, (245, 242, 236, 255), 14, 410), text('OVERTHRONESMP.NET', 72, (255, 200, 90, 255), 8, 560))
for i in range(frames(END_LEN)):
    f = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    for k, l in enumerate(lines):
        a = min(1, max(0, i - 6 * k) / 15, (frames(END_LEN) - 1 - i) / 20)
        if a > 0: c = l.copy(); c.putalpha(c.split()[3].point(lambda v: int(v * a))); f.alpha_composite(c)
    f.save(os.path.join(end_dir, '%04d.png' % i), compress_level=1)
endv = os.path.join(tmp, 'end.mp4')
run(['-framerate', str(FPS), '-i', os.path.join(end_dir, '%04d.png'), '-vf', 'format=yuv420p,setsar=1'] + X264 + [endv])

# assemble: hard cuts like the original, a dissolve into the logo shot, a dip to black before JOIN NOW
body = os.path.join(tmp, 'body.mp4'); lst = os.path.join(tmp, 'list.txt')
with open(lst, 'w') as f:
    for p in pieces: f.write("file '%s'\n" % p)
run(['-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', body])
blen = sum(c[3] for c in CUT)
total = blen - XF + LOGO_LEN - 0.5 + END_LEN
fc = ('[0:v]settb=AVTB,fps=%d,format=yuv420p,settb=AVTB[a];[1:v]settb=AVTB,fps=%d,format=yuv420p,settb=AVTB[b];'
      '[2:v]settb=AVTB,fps=%d,format=yuv420p,settb=AVTB[c];'
      '[a][b]xfade=transition=fade:duration=%.2f:offset=%.3f,settb=AVTB[ab];'
      '[ab][c]xfade=transition=fadeblack:duration=0.5:offset=%.3f,settb=AVTB,fade=in:st=0:d=1.0,'
      'noise=alls=5:allf=t%s[v]'
      % (FPS, FPS, FPS, XF, blen - XF, blen - XF + LOGO_LEN - 0.5,
         ',drawbox=x=0:y=0:w=%d:h=%d:color=black:t=fill,drawbox=x=0:y=%d:w=%d:h=%d:color=black:t=fill'
         % (W, PY, PY + PH, W, H - PY - PH) if PY else ''))
run(['-i', body, '-i', logov, '-i', endv, '-i', AUDIO, '-filter_complex', fc + ';[3:a]afade=t=out:st=%.2f:d=2[au]' % (total - 2),
     '-map', '[v]', '-map', '[au]', '-t', '%.3f' % total, '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
     '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', OUT])
shutil.rmtree(tmp, ignore_errors=True)
print('wrote', OUT, round(total, 2), 's')
