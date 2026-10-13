"""9:16 TikTok version made from the finished full-screen remix (build_remix.py with REMIX_MODE=full).

The 16:9 video sits in the middle (4:3 centre crop, full width), over a blurred, darkened copy of itself that fills
the screen; 'OVERTHRONE SMP' above it and the IP below it, hidden during the JOIN NOW card at the end.

    python3 build_remix_tiktok.py <remix_full.mp4> <fonts_dir> <out.mp4>
"""
import os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SRC, FONTS, OUT = sys.argv[1:4]
W, H = 1080, 1920
FW, FH = 1080, 810; FY = (H - FH) // 2 - 40          # foreground video box
END_LEN = 4.0
BEBAS = os.path.join(FONTS, 'BebasNeue-Regular.ttf')
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', SRC],
                           capture_output=True, text=True).stdout)

def line(d, t, size, fill, track, y):
    f = ImageFont.truetype(BEBAS, size); ws = [d.textlength(c, font=f) for c in t]
    x = (W - sum(ws) - track * (len(t) - 1)) / 2
    for c, w in zip(t, ws): d.text((x, y), c, font=f, fill=fill); x += w + track

txt = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(txt)
line(d, 'OVERTHRONE SMP', 104, (245, 242, 236, 255), 10, FY - 175)
line(d, 'ANIME RPG  -  NEOFORGE 1.21.1', 38, (255, 200, 90, 255), 6, FY - 62)
line(d, 'JOIN NOW', 70, (245, 242, 236, 255), 10, FY + FH + 34)
line(d, '51.161.196.66', 60, (255, 200, 90, 255), 6, FY + FH + 112)
a = txt.split()[3].filter(ImageFilter.GaussianBlur(10)).point(lambda v: min(255, v * 2))
sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sh.putalpha(a); txt = Image.alpha_composite(sh, txt)
tp = os.path.join(tempfile.mkdtemp(prefix='tt_'), 'text.png'); txt.save(tp)

hide = dur - END_LEN - 0.3
fc = ('[0:v]split[a][b];'
      '[a]scale=-2:%d,crop=%d:%d,gblur=sigma=40,eq=brightness=-0.18:saturation=1.1[bg];'
      '[b]crop=1440:1080:240:0,scale=%d:%d:flags=lanczos[fg];'
      '[bg][fg]overlay=0:%d[v1];'
      "[1:v]format=rgba,fade=t=in:st=0.8:d=1.0:alpha=1,fade=t=out:st=%.2f:d=0.5:alpha=1[t];"
      '[v1][t]overlay=0:0:format=auto,format=yuv420p,setsar=1[v]'
      % (H, W, H, FW, FH, FY, hide))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', SRC, '-loop', '1', '-t', '%.3f' % dur, '-i', tp, '-filter_complex', fc,
                '-map', '[v]', '-map', '0:a', '-t', '%.3f' % dur, '-c:v', 'libx264', '-preset', 'slow', '-b:v', '3600k',
                '-maxrate', '4500k', '-bufsize', '9000k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
                '-movflags', '+faststart', OUT], check=True)
print('wrote', OUT, round(dur, 2), 's')
