"""Shot runner: renders a list of shots to frames and pipes them into ffmpeg (1080x1920, 30 fps).
A shot is dict(start, end, fn, captions=[(t0, t1, text, highlight_set, size)]) where fn(sec, u, fi) -> float RGB array,
sec = seconds into the shot, u = 0..1 progress."""
import subprocess, sys
import numpy as np
from art import *

FPS = 30

def cap_layer(a, sec_abs, caps, y=1440):
    for c in caps:
        t0, t1, text = c[0], c[1], c[2]
        hl = c[3] if len(c) > 3 else None
        size = c[4] if len(c) > 4 else 88
        yy = c[5] if len(c) > 5 else y
        if t0 <= sec_abs < t1:
            frac = clamp((sec_abs - t0) / max(0.4, min(1.6, (t1 - t0) * 0.45)))
            fade = clamp((t1 - sec_abs) / 0.2)
            a = over(a, caption(text, frac, size=size, hl=hl), 0, yy, alpha=fade)
    return a

def run(shots, total, out, flashes=(), whites=()):
    ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    n = int(total * FPS)
    for fi in range(n):
        sec = fi / FPS
        shot = next((s for s in shots if s['start'] <= sec < s['end']), shots[-1])
        ls = sec - shot['start']; u = ls / (shot['end'] - shot['start'])
        a = shot['fn'](ls, u, fi)
        a = cap_layer(a, sec, shot.get('captions', []))
        f = finish(a, fi, bloom=shot.get('bloom', 0.35), grade=shot.get('grade', (1.0, 0.96, 1.04))).astype(np.float32)
        for t0, dur, col in flashes:                      # impact flashes
            if t0 <= sec < t0 + dur:
                k = 1 - (sec - t0) / dur
                f = f * (1 - k * 0.85) + np.array(col, np.float32) * k * 0.85
        for t0 in (s['start'] for s in shots):            # 3-frame fade from black at every cut
            if 0 <= sec - t0 < 3 / FPS: f *= (sec - t0) * FPS / 3 * 0.6 + 0.4
        ff.stdin.write(np.clip(f, 0, 255).astype(np.uint8).tobytes())
        if fi % 150 == 0: print(f'  {sec:5.1f}s / {total}s', file=sys.stderr, flush=True)
    ff.stdin.close(); ff.wait()
